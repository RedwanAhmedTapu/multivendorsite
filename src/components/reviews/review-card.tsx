"use client";

// components/reviews/review-card.tsx
//
// One review, in the two shapes the product uses:
//   variant="storefront" → the teal product page (rounded-lg, teal accents)
//   variant="dashboard"  → vendor/admin panels (rounded-2xl, blue accents,
//                          border-blue-100, shadow-blue-50 — the StatCard idiom)
//
// Everything after `updatedAt` in ReviewDto is optional, so a field the API has
// not started returning simply does not render.

import type { ReactNode } from "react";
import { BadgeCheck, EyeOff, Pencil, Store, Trash2 } from "lucide-react";
import { StarRating } from "./star-rating";
import { ReviewImages } from "./review-images";
import { ReviewThread } from "./review-thread";
import { formatReviewDate, initialsOf, type ReviewDto } from "./review-types";

interface ReviewCardProps {
  review: ReviewDto;
  variant?: "storefront" | "dashboard";
  isOwn?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  deleting?: boolean;
  /** Admin table: show the HIDDEN badge and comment threads' hidden state. */
  showStatus?: boolean;
  /** Vendor view: renders the reply composer slot. */
  replySlot?: ReactNode;
  children?: ReactNode;
}

export function ReviewCard({
  review,
  variant = "storefront",
  isOwn = false,
  onEdit,
  onDelete,
  deleting = false,
  showStatus = false,
  replySlot,
  children,
}: ReviewCardProps) {
  const dashboard = variant === "dashboard";
  const card = dashboard
    ? "rounded-2xl border border-blue-100 bg-white p-4 shadow-sm shadow-blue-50"
    : "rounded-lg border border-gray-100 bg-white p-4";
  const name = review.user?.name || "Customer";
  const hidden = review.status === "HIDDEN";
  const edited =
    !!review.updatedAt && !!review.createdAt && review.updatedAt !== review.createdAt;

  return (
    <article className={`${card} ${hidden ? "opacity-80" : ""}`}>
      <header className="flex items-start gap-3">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
            dashboard ? "bg-blue-50 text-blue-700" : "bg-teal-50 text-teal-800"
          }`}
          aria-hidden="true"
        >
          {initialsOf(name)}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="truncate text-sm font-semibold text-slate-800">
              {name}
              {isOwn && <span className="ml-1.5 text-[10px] font-medium text-slate-400">(you)</span>}
            </p>
            {review.orderItemId && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                <BadgeCheck size={11} /> Verified purchase
              </span>
            )}
            {showStatus && hidden && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                <EyeOff size={10} /> hidden
              </span>
            )}
          </div>
          <p className="mt-0.5 text-[11px] text-slate-400">
            {formatReviewDate(review.createdAt)}
            {edited ? " · edited" : ""}
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1">
          <StarRating value={review.rating} size={dashboard ? 14 : 15} />
          <span className="text-[10px] font-semibold text-slate-400 tabular-nums">
            {review.rating}.0
          </span>
        </div>
      </header>

      {review.comment ? (
        <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-600">
          {review.comment}
        </p>
      ) : (
        <p className="mt-3 text-xs italic text-slate-400">No written comment.</p>
      )}

      <ReviewImages images={review.images} authorName={name} size={dashboard ? "md" : "sm"} />

      {review.vendorReply && (
        <div
          className={`mt-3 rounded-xl border-l-2 bg-slate-50/80 px-3 py-2 ${
            dashboard ? "border-blue-400" : "border-teal-500"
          }`}
        >
          <p className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700">
            <Store size={11} /> Seller response
            {review.vendorReplyAt && (
              <span className="font-normal text-slate-400">{formatReviewDate(review.vendorReplyAt)}</span>
            )}
          </p>
          <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-slate-600">
            {review.vendorReply}
          </p>
        </div>
      )}

      {replySlot}

      <ReviewThread comments={review.comments} variant={variant} />

      {children}

      {(onEdit || onDelete) && (
        <footer className="mt-3 flex items-center gap-3 border-t border-slate-100 pt-2.5">
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 transition hover:text-slate-800"
            >
              <Pencil size={11} /> Edit
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              disabled={deleting}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-500 transition hover:text-rose-700 disabled:opacity-50"
            >
              <Trash2 size={11} /> {deleting ? "Deleting…" : "Delete"}
            </button>
          )}
        </footer>
      )}
    </article>
  );
}
