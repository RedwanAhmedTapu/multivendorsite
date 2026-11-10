"use client";

// components/reviews/product-reviews.tsx
//
// The customer-facing review surface for a product page.
//
// Wired to real endpoints only:
//   GET   /products/:productId/reviews            (public, paged, rating filter, sort)
//   GET   /products/:productId/reviews/me         (own reviews — list since Increment 2)
//   GET   /products/:productId/reviews/eligibility(delivered-order-line gate)
//   POST  /reviews                                (create, 409 if already reviewed)
//   PATCH /reviews/:reviewId                      (owner edit)
//   DELETE /reviews/:reviewId                     (owner delete)
//
// Not wired, because no endpoint exists: review images and comment threads.
// ReviewCard renders both slots, and both stay empty until the API ships.

import { useMemo, useState } from "react";
import { Loader2, PenLine } from "lucide-react";
import { ConfirmDialog } from "./confirm-dialog";
import {
  useCreateReviewMutation,
  useDeleteReviewMutation,
  useGetMyProductReviewQuery,
  useGetProductReviewsQuery,
  useUpdateReviewMutation,
} from "@/features/productReviewApi";
import { useGetReviewEligibilityQuery } from "@/features/productReviewEligibilityApi";
import { useUploadReviewImageMutation } from "@/features/productReviewImageApi";
import { ReviewCard } from "./review-card";
import { ReviewFilters, type ReviewSortBy } from "./review-filters";
import { ReviewForm } from "./review-form";
import { ReviewEmpty, ReviewError, ReviewSkeleton } from "./review-states";
import {
  ELIGIBILITY_MESSAGES,
  normalizeReviewList,
  type ReviewDto,
  type ReviewEligibility,
} from "./review-types";

const PAGE_SIZE = 5;

interface ProductReviewsProps {
  productId: string;
  summary?: {
    averageRating: number;
    totalReviews: number;
    ratingDistribution: { star: number; count: number; percentage: number }[];
  } | null;
  isAuthenticated: boolean;
  onRequireAuth: () => void;
  /** Dashboard embedding reuses this component with the blue palette. */
  variant?: "storefront" | "dashboard";
}

/** RTK's error envelope → a sentence a customer can read. */
function messageOf(error: unknown, fallback: string): string {
  const box = error as { data?: { message?: string; error?: string } };
  return box?.data?.message || box?.data?.error || fallback;
}

export function ProductReviews({
  productId,
  summary,
  isAuthenticated,
  onRequireAuth,
  variant = "storefront",
}: ProductReviewsProps) {
  const dashboard = variant === "dashboard";
  const [page, setPage] = useState(1);
  const [rating, setRating] = useState<number | undefined>(undefined);
  const [sortBy, setSortBy] = useState<ReviewSortBy>("newest");
  const [formMode, setFormMode] = useState<"closed" | "create" | "edit">("closed");
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const list = useGetProductReviewsQuery({
    productId,
    page,
    limit: PAGE_SIZE,
    rating,
    sortBy,
  });

  const mine = useGetMyProductReviewQuery(productId, {
    skip: !isAuthenticated,
    refetchOnMountOrArgChange: true,
  });

  const eligibility = useGetReviewEligibilityQuery(productId, {
    skip: !isAuthenticated,
    refetchOnMountOrArgChange: true,
  });

  const [createReview, createState] = useCreateReviewMutation();
  const [updateReview, updateState] = useUpdateReviewMutation();
  const [deleteReview, deleteState] = useDeleteReviewMutation();
  const [uploadReviewImage] = useUploadReviewImageMutation();

  const reviews = useMemo(() => (list.data?.data ?? []) as unknown as ReviewDto[], [list.data]);
  const pagination = list.data?.pagination;
  const ownReviews = useMemo(() => normalizeReviewList(mine.data), [mine.data]);
  const ownReview = ownReviews[0];

  const eligibilityBox = eligibility.data as
    | { data?: ReviewEligibility }
    | ReviewEligibility
    | undefined;
  const eligibleState: ReviewEligibility | undefined =
    eligibilityBox && "data" in eligibilityBox && eligibilityBox.data
      ? eligibilityBox.data
      : (eligibilityBox as ReviewEligibility | undefined);

  const submitting = createState.isLoading || updateState.isLoading;
  const formError =
    actionError ||
    (createState.error ? messageOf(createState.error, "Could not save your review.") : null) ||
    (updateState.error ? messageOf(updateState.error, "Could not update your review.") : null);

  const openCreate = () => {
    setActionError(null);
    if (!isAuthenticated) {
      onRequireAuth();
      return;
    }
    setFormMode("create");
  };

  /** Photos are a second, multipart request: the review row must exist first. */
  const uploadPhotos = async (reviewId: string, files: File[]) => {
    const failed: string[] = [];
    for (const file of files) {
      try {
        await uploadReviewImage({ reviewId, file }).unwrap();
      } catch {
        failed.push(file.name);
      }
    }
    return failed;
  };

  const handleCreate = async (values: { rating: number; comment: string; files: File[] }) => {
    setActionError(null);
    setNotice(null);
    try {
      const created = await createReview({
        productId,
        rating: values.rating,
        comment: values.comment,
      }).unwrap();

      const newId = (created as { data?: { id?: string } })?.data?.id;
      const failed = newId && values.files.length ? await uploadPhotos(newId, values.files) : [];

      setFormMode("closed");
      setPage(1);
      setNotice(
        failed.length
          ? `Review published, but ${failed.length} photo(s) could not be uploaded: ${failed.join(", ")}.`
          : "Your review is published."
      );
    } catch (error) {
      setActionError(messageOf(error, "Could not save your review."));
    }
  };

  const handleUpdate = async (values: { rating: number; comment: string; files: File[] }) => {
    if (!ownReview) return;
    setActionError(null);
    try {
      // `files` is a client-only field; the PATCH body takes rating/comment only.
      await updateReview({
        reviewId: ownReview.id,
        productId,
        rating: values.rating,
        comment: values.comment,
      }).unwrap();

      const failed = values.files.length ? await uploadPhotos(ownReview.id, values.files) : [];
      setFormMode("closed");
      setNotice(
        failed.length
          ? `Review updated, but ${failed.length} photo(s) could not be uploaded: ${failed.join(", ")}.`
          : "Your review was updated."
      );
    } catch (error) {
      setActionError(messageOf(error, "Could not update your review."));
    }
  };

  const handleDelete = async (reviewId: string) => {
    setActionError(null);
    try {
      await deleteReview({ reviewId, productId }).unwrap();
      setFormMode("closed");
      setConfirmId(null);
      setNotice("Your review was deleted.");
    } catch (error) {
      setActionError(messageOf(error, "Could not delete your review."));
    }
  };

  const distributionCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    (summary?.ratingDistribution ?? []).forEach((d) => {
      counts[d.star] = d.count;
    });
    return counts;
  }, [summary]);

  const canWrite = isAuthenticated && !ownReview && eligibleState?.eligible === true;
  const blockedReason =
    isAuthenticated && !ownReview && eligibleState && !eligibleState.eligible
      ? ELIGIBILITY_MESSAGES[eligibleState.reason ?? ""] ??
        "Only verified buyers of this product can review it."
      : null;

  const writeButton = (
    <button
      type="button"
      onClick={openCreate}
      className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-white transition disabled:opacity-50 ${
        dashboard
          ? "bg-gradient-to-r from-blue-600 to-cyan-500 hover:brightness-105"
          : "bg-teal-800 hover:bg-teal-900"
      }`}
    >
      <PenLine size={12} /> Write a review
    </button>
  );

  return (
    <section id="product-reviews" className="mt-8 scroll-mt-24">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className={`text-xl font-semibold ${dashboard ? "text-slate-800" : "text-teal-900"}`}>
            Customer Reviews
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            {typeof summary?.totalReviews === "number" && summary.totalReviews > 0 ? (
              <>
                <span className="font-semibold text-slate-700">
                  {summary.averageRating.toFixed(1)} out of 5
                </span>{" "}
                · {summary.totalReviews} review{summary.totalReviews === 1 ? "" : "s"}
                {typeof pagination?.totalItems === "number" && pagination.totalItems !== summary.totalReviews
                  ? ` · ${pagination.totalItems} shown by the live feed`
                  : ""}
              </>
            ) : (
              "No ratings yet."
            )}
          </p>
        </div>

        {formMode === "closed" &&
          (ownReview ? (
            <button
              type="button"
              onClick={() => {
                setActionError(null);
                setFormMode("edit");
              }}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold ${
                dashboard
                  ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
                  : "bg-teal-50 text-teal-800 hover:bg-teal-100"
              }`}
            >
              <PenLine size={12} /> Edit your review
            </button>
          ) : canWrite ? (
            writeButton
          ) : null)}
      </div>

      {blockedReason && formMode === "closed" && (
        <p className="mb-3 rounded-xl bg-slate-50 px-3 py-2 text-[11px] font-medium text-slate-500">
          {blockedReason}
        </p>
      )}

      {formMode === "create" && (
        <div className="mb-4">
          <ReviewForm
            variant={variant}
            submitting={submitting}
            error={formError}
            onSubmit={handleCreate}
            onCancel={() => setFormMode("closed")}
          />
        </div>
      )}

      {formMode === "edit" && ownReview && (
        <div className="mb-4">
          <ReviewForm
            mode="edit"
            variant={variant}
            initialRating={ownReview.rating}
            initialComment={ownReview.comment ?? ""}
            submitting={submitting}
            error={formError}
            onSubmit={handleUpdate}
            onCancel={() => setFormMode("closed")}
          />
        </div>
      )}

      <div className="mb-3">
        <ReviewFilters
          rating={rating}
          onRating={(next) => {
            setRating(next);
            setPage(1);
          }}
          sortBy={sortBy}
          onSort={(next) => {
            setSortBy(next);
            setPage(1);
          }}
          counts={distributionCounts}
          total={summary?.totalReviews}
          variant={variant}
          disabled={list.isFetching && reviews.length === 0}
        />
      </div>

      {list.isLoading ? (
        <ReviewSkeleton rows={3} />
      ) : list.isError ? (
        <ReviewError message={messageOf(list.error, "We could not load the reviews.")} onRetry={() => list.refetch()} />
      ) : reviews.length === 0 ? (
        <ReviewEmpty
          title={rating ? `No ${rating}-star reviews yet` : "No reviews yet"}
          description={
            rating
              ? "Try another star rating, or clear the filter to see every review."
              : "Bought this product? Your review is the first thing the next customer reads."
          }
          action={
            rating ? (
              <button
                type="button"
                onClick={() => {
                  setRating(undefined);
                  setPage(1);
                }}
                className="rounded-lg bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
              >
                Clear filter
              </button>
            ) : canWrite ? (
              writeButton
            ) : undefined
          }
        />
      ) : (
        <div className={`space-y-3 ${list.isFetching ? "opacity-60 transition-opacity" : ""}`}>
          {reviews.map((review) => {
            const isOwn = !!ownReview && ownReview.id === review.id;
            return (
              <ReviewCard
                key={review.id}
                review={review}
                variant={variant}
                isOwn={isOwn}
                onEdit={
                  isOwn && formMode === "closed"
                    ? () => {
                        setActionError(null);
                        setFormMode("edit");
                      }
                    : undefined
                }
                onDelete={isOwn ? () => setConfirmId(review.id) : undefined}
                deleting={deleteState.isLoading}
              />
            );
          })}
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between gap-3">
          <button
            type="button"
            disabled={!pagination.hasPrevious || list.isFetching}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-[11px] font-medium text-slate-500 tabular-nums">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          <button
            type="button"
            disabled={!pagination.hasNext || list.isFetching}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}

      {list.isFetching && reviews.length > 0 && (
        <p className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-400">
          <Loader2 size={10} className="animate-spin" /> Updating…
        </p>
      )}

      {actionError && formMode === "closed" && (
        <p role="alert" className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-[11px] font-medium text-rose-700">
          {actionError}
        </p>
      )}

      {notice && (
        <p role="status" className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-[11px] font-medium text-emerald-700">
          {notice}
        </p>
      )}

      <ConfirmDialog
        open={confirmId !== null}
        title="Delete your review?"
        description="The review is removed permanently and the product rating is recalculated. This cannot be undone."
        confirmLabel="Delete review"
        cancelLabel="Keep it"
        destructive
        busy={deleteState.isLoading}
        onConfirm={() => confirmId && handleDelete(confirmId)}
        onCancel={() => setConfirmId(null)}
      />
    </section>
  );
}
