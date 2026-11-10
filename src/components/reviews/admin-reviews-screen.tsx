"use client";

// components/reviews/admin-reviews-screen.tsx
//
// Admin → Review moderation. Redesigned around a single question: "what needs my
// attention, and what happens if I hide it?".
//
// Everything shown comes from the real admin API:
//   • three list queries (ALL / PUBLISHED / HIDDEN, limit 1) supply the exact
//     totals for the KPI cards and the status tabs;
//   • the table is the paginated ALL query with rating/search/sort filters;
//   • the drawer reuses the same row data;
//   • publish/hide calls PATCH /admin/reviews/:id/status and invalidates the
//     review lists plus the product caches the server has already dropped.
//
// Page-scoped numbers (average, photo count, rating spread) are labelled "this
// page" — the API exposes no global aggregate, and inventing one would be worse
// than saying so.

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  ImageIcon,
  Lock,
  MessageSquare,
  RefreshCw,
  Search,
  ShieldCheck,
  Star,
  Store,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  ENDPOINTS_REQUIRED,
  REVIEW_MODERATION_API_READY,
  useGetAdminReviewsQuery,
  useModerateReviewStatusMutation,
  type ModerationListQuery,
} from "@/features/reviewModerationApi";
import { ConfirmDialog } from "./confirm-dialog";
import { IntegrationPanel } from "./integration-panel";
import { ReviewImages } from "./review-images";
import { ReviewEmpty, ReviewError, ReviewSkeleton } from "./review-states";
import { StarRating } from "./star-rating";
import { formatReviewDate, initialsOf, type ReviewDto } from "./review-types";

interface AdminReviewsScreenProps {
  enabled?: boolean;
}

type StatusTab = "ALL" | "PUBLISHED" | "HIDDEN";

const PAGE_SIZE = 10;

export function AdminReviewsScreen({ enabled = REVIEW_MODERATION_API_READY }: AdminReviewsScreenProps) {
  const [status, setStatus] = useState<StatusTab>("ALL");
  const [rating, setRating] = useState<number | undefined>(undefined);
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "highest_rating" | "lowest_rating">("newest");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string | null>(null);
  const [pendingHide, setPendingHide] = useState<string | null>(null);

  const query: ModerationListQuery = { page, limit: PAGE_SIZE, status, rating, sortBy, search };
  const list = useGetAdminReviewsQuery(query, { skip: !enabled });

  // Exact totals per status — same endpoint, one row each.
  const total = useGetAdminReviewsQuery({ page: 1, limit: 1, status: "ALL" }, { skip: !enabled });
  const published = useGetAdminReviewsQuery({ page: 1, limit: 1, status: "PUBLISHED" }, { skip: !enabled });
  const hidden = useGetAdminReviewsQuery({ page: 1, limit: 1, status: "HIDDEN" }, { skip: !enabled });

  const [moderate, moderateState] = useModerateReviewStatusMutation();

  const rows = useMemo(() => (list.data?.data ?? []) as unknown as ReviewDto[], [list.data]);
  const meta = list.data?.meta;
  const schemaReady = meta?.schemaReady ?? false;
  const canModerate = enabled && schemaReady;
  const pagination = list.data?.pagination;

  const counts = {
    ALL: total.data?.pagination.totalItems ?? 0,
    PUBLISHED: published.data?.pagination.totalItems ?? 0,
    HIDDEN: hidden.data?.pagination.totalItems ?? 0,
  };

  const pageAverage = useMemo(() => {
    if (rows.length === 0) return null;
    return rows.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) / rows.length;
  }, [rows]);

  const withPhotos = useMemo(
    () => rows.filter((r) => (r.images?.length ?? 0) > 0).length,
    [rows]
  );

  const distribution = useMemo(() => {
    const buckets = [5, 4, 3, 2, 1].map((star) => ({ star, count: rows.filter((r) => r.rating === star).length }));
    const max = Math.max(1, ...buckets.map((b) => b.count));
    return buckets.map((b) => ({ ...b, pct: Math.round((b.count / max) * 100) }));
  }, [rows]);

  const openReview = rows.find((r) => r.id === openId) ?? null;

  const applyStatus = async (reviewId: string, next: "PUBLISHED" | "HIDDEN") => {
    if (!canModerate) return;
    try {
      await moderate({ reviewId, status: next }).unwrap();
      toast.success(next === "HIDDEN" ? "Review hidden — ratings recalculated" : "Review published again");
      setPendingHide(null);
      setOpenId(null);
    } catch (error) {
      const box = error as { data?: { message?: string } };
      toast.error(box?.data?.message || "Could not update this review");
    }
  };

  return (
    <div className="space-y-6 bg-slate-50 text-slate-900">
      {/* ── header ─────────────────────────────────────────────────────────── */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 ring-1 ring-indigo-500/30">
              <ShieldCheck size={16} />
            </span>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Review moderation</h1>
          </div>
          <p className="mt-2 max-w-2xl text-xs leading-relaxed text-slate-500">
            Hiding a review removes it from the storefront and from the product and vendor ratings in the same
            request. Everything below is live data from the moderation API.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-500/30 sm:inline">
            {enabled ? `${counts.ALL} in queue` : "queue disabled"}
          </span>
          <button
            type="button"
            disabled={!enabled || list.isFetching}
            onClick={() => {
              list.refetch();
              total.refetch();
              published.refetch();
              hidden.refetch();
            }}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30 disabled:opacity-50"
          >
            <RefreshCw size={13} className={list.isFetching ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </header>

      {!enabled && (
        <IntegrationPanel
          title="Moderation queue is disabled"
          description="The route is implemented (GET /api/admin/reviews, ADMIN only). This shell rendered with the queue switched off, so it issued no request and shows no rows."
          endpoints={ENDPOINTS_REQUIRED.filter((e) => e.path.includes("/admin/"))}
        />
      )}

      {enabled && !schemaReady && !list.isLoading && !list.isError && (
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <Lock size={13} className="mt-0.5 shrink-0 text-amber-600" />
          <p className="text-sm leading-relaxed text-amber-900">
            <span className="font-semibold">Hide / Publish is disabled.</span> The API reports{" "}
            <code className="mx-1 rounded bg-white/70 px-1.5 py-0.5 font-mono text-xs">schemaReady: false</code>
            because <code className="font-mono text-xs">reviews.status</code> is not provisioned, so moderation
            would answer 503. The queue itself is live and read-only.
          </p>
        </div>
      )}

      {/* ── KPI cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-[repeat(auto-fit,minmax(170px,1fr))]">
        <Kpi tone="indigo" label="Total reviews" value={counts.ALL} loading={total.isLoading} icon={<MessageSquare size={13} />} />
        <Kpi tone="emerald" label="Published" value={counts.PUBLISHED} loading={published.isLoading} hint={counts.ALL > 0 ? `${Math.round((counts.PUBLISHED / counts.ALL) * 100)}% of total` : undefined} icon={<Eye size={13} />} />
        <Kpi tone="slate" label="Hidden" value={counts.HIDDEN} loading={hidden.isLoading} icon={<EyeOff size={13} />} />
        <Kpi
          tone="amber"
          label="Avg · this page"
          value={pageAverage === null ? "—" : pageAverage.toFixed(1)}
          loading={list.isLoading}
          icon={<Star size={13} />}
        />
        <Kpi tone="sky" label="With photos · this page" value={`${withPhotos}/${rows.length}`} loading={list.isLoading} icon={<ImageIcon size={13} />} />
      </div>

      {/* ── filters ────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-6 border-b border-slate-200">
            {(["ALL", "PUBLISHED", "HIDDEN"] as const).map((tab) => {
              const active = status === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  disabled={!enabled || (tab !== "ALL" && !schemaReady)}
                  onClick={() => {
                    setStatus(tab);
                    setPage(1);
                  }}
                  title={tab !== "ALL" && !schemaReady ? "Status filtering needs reviews.status" : undefined}
                  aria-pressed={active}
                  className={`-mb-px inline-flex items-center gap-1.5 border-b-2 px-0.5 py-2.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-40 ${
                    active ? "border-indigo-600 font-semibold text-indigo-700" : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {tab === "ALL" ? "All" : tab === "PUBLISHED" ? "Published" : "Hidden"}
                  <span className={`rounded-full px-2 py-0.5 text-xs tabular-nums ${active ? "bg-indigo-50 text-indigo-700" : "bg-slate-100 text-slate-600"}`}>
                    {counts[tab]}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1">
            {[5, 4, 3, 2, 1].map((star) => (
              <button
                key={star}
                type="button"
                disabled={!enabled}
                onClick={() => {
                  setRating(rating === star ? undefined : star);
                  setPage(1);
                }}
                aria-pressed={rating === star}
                aria-label={`Filter ${star} star reviews`}
                className={`inline-flex h-8 items-center gap-1 rounded-lg border px-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30 disabled:opacity-40 ${
                  rating === star
                    ? "border-indigo-600 bg-indigo-600 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {star}
                <Star size={9} className={rating === star ? "fill-white text-white" : "fill-amber-400 text-amber-400"} />
              </button>
            ))}
            {rating !== undefined && (
              <button type="button" onClick={() => setRating(undefined)} className="ml-1 inline-flex h-8 items-center rounded-lg px-2 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30">
                Clear
              </button>
            )}
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <select
              value={sortBy}
              disabled={!enabled}
              onChange={(e) => {
                setSortBy(e.target.value as typeof sortBy);
                setPage(1);
              }}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 disabled:opacity-50"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="highest_rating">Highest rating</option>
              <option value="lowest_rating">Lowest rating</option>
            </select>

            <label className="relative">
              <Search size={12} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                disabled={!enabled}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search review, customer, product…"
                className="h-10 w-60 rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 disabled:opacity-50"
              />
            </label>
          </div>
        </div>

        {rows.length > 0 && (
          <div className="mt-4 flex flex-wrap items-end gap-4 border-t border-slate-200 pt-4">
            <div className="flex-1">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Rating spread · this page
              </p>
              <div className="flex items-end gap-2">
                {distribution.map((bucket) => (
                  <div key={bucket.star} className="flex w-9 flex-col items-center gap-1.5">
                    <div className="flex h-10 w-full items-end rounded-md bg-slate-100">
                      <div
                        className="w-full rounded-md bg-indigo-500"
                        style={{ height: `${Math.max(4, bucket.pct)}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-slate-500 tabular-nums">
                      {bucket.star}★ {bucket.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── list ───────────────────────────────────────────────────────────── */}
      {!enabled ? (
        <ReviewEmpty title="Queue disabled" description="No request is made while the screen is rendered disabled. Turn the queue on to load platform reviews." />
      ) : list.isLoading ? (
        <ReviewSkeleton rows={4} />
      ) : list.isError ? (
        <ReviewError
          message="We could not load the moderation queue. A 403 means this account is not ADMIN; a 404 means the route is not deployed."
          onRetry={() => list.refetch()}
        />
      ) : rows.length === 0 ? (
        <ReviewEmpty
          title={search || rating !== undefined || status !== "ALL" ? "No reviews match these filters" : "Queue is clear"}
          description={
            search || rating !== undefined || status !== "ALL"
              ? "Clear the search, the star filter and the status tab to see everything."
              : "No review has been written on the marketplace yet."
          }
        />
      ) : (
        <div className="overflow-clip rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* table header (desktop) */}
          <div className="sticky top-0 z-10 hidden grid-cols-[minmax(0,2.2fr)_minmax(0,1.4fr)_90px_70px_90px_110px_120px] gap-3 border-b border-slate-200 border-l-[3px] border-l-transparent bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 lg:grid">
            <span>Review</span>
            <span>Product</span>
            <span>Rating</span>
            <span>Photos</span>
            <span>Date</span>
            <span>Status</span>
            <span className="text-right">Actions</span>
          </div>

          <ul className="divide-y divide-slate-100">
            {rows.map((review) => {
              const hiddenRow = review.status === "HIDDEN";
              const store = review.product?.vendor?.storeName;
              return (
                <li
                  key={review.id}
                  className={`grid gap-3 border-l-[3px] px-4 py-3 transition lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1.4fr)_90px_70px_90px_110px_120px] lg:items-center ${
                    review.id === openId
                      ? "border-l-indigo-600 bg-indigo-50/60"
                      : "border-l-transparent hover:bg-slate-50"
                  }`}
                >
                  {/* reviewer + text */}
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-700">
                      {initialsOf(review.user?.name)}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <p className="truncate text-sm font-semibold text-slate-900">{review.user?.name || "Customer"}</p>
                        {review.orderItemId && (
                          <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-indigo-700">
                            verified
                          </span>
                        )}
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-slate-600">
                        {review.comment || <span className="italic text-slate-400">No written comment</span>}
                      </p>
                    </div>
                  </div>

                  {/* product */}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">{review.product?.name || "—"}</p>
                    <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-slate-500">
                      <Store size={9} /> {store || "Vendor"}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <StarRating value={review.rating} size={11} />
                    <span className="text-xs font-semibold text-slate-500 tabular-nums">{review.rating}.0</span>
                  </div>

                  <div className="text-xs text-slate-500">
                    {(review.images?.length ?? 0) > 0 ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                        <ImageIcon size={9} /> {review.images?.length}
                      </span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </div>

                  <span className="text-xs text-slate-500">{formatReviewDate(review.createdAt)}</span>

                  <span
                    className={`inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${
                      hiddenRow ? "bg-slate-100 text-slate-600" : "bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    {hiddenRow ? <EyeOff size={9} /> : <Eye size={9} />}
                    {hiddenRow ? "Hidden" : "Published"}
                  </span>

                  <div className="flex items-center gap-1.5 lg:justify-end">
                    <button
                      type="button"
                      onClick={() => setOpenId(review.id)}
                      className="inline-flex h-8 items-center rounded-lg px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30"
                    >
                      View
                    </button>
                    {hiddenRow ? (
                      <button
                        type="button"
                        disabled={!canModerate || moderateState.isLoading}
                        onClick={() => applyStatus(review.id, "PUBLISHED")}
                        className="inline-flex h-8 items-center rounded-lg bg-indigo-600 px-3 text-sm font-semibold text-white transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30 disabled:opacity-40"
                      >
                        Publish
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={!canModerate || moderateState.isLoading}
                        onClick={() => setPendingHide(review.id)}
                        className="inline-flex h-8 items-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30 disabled:opacity-40"
                      >
                        Hide
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
              <button
                type="button"
                disabled={!pagination.hasPrevious || list.isFetching}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex h-9 items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30 disabled:opacity-40"
              >
                <ChevronLeft size={11} /> Previous
              </button>
              <span className="text-xs text-slate-500 tabular-nums">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              <button
                type="button"
                disabled={!pagination.hasNext || list.isFetching}
                onClick={() => setPage((p) => p + 1)}
                className="inline-flex h-9 items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30 disabled:opacity-40"
              >
                Next <ChevronRight size={11} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── detail drawer ─────────────────────────────────────────────────── */}
      {openReview && (
        <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Review details">
          <button
            type="button"
            aria-label="Close details"
            onClick={() => setOpenId(null)}
            className="absolute inset-0 bg-slate-900/40"
          />
          <aside className="relative flex h-full w-full max-w-md flex-col overflow-y-auto rounded-l-2xl border-l border-slate-200 bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-slate-200 bg-white px-5 py-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Review</p>
                <p className="truncate text-sm font-bold text-slate-900">{openReview.user?.name || "Customer"}</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {formatReviewDate(openReview.createdAt)} · {openReview.rating}.0 / 5
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpenId(null)}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30"
                aria-label="Close"
              >
                <X size={15} />
              </button>
            </div>

            <div className="space-y-5 px-5 py-5">
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Rating</p>
                <StarRating value={openReview.rating} size={16} showValue />
              </div>

              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Review</p>
                <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
                  {openReview.comment || <span className="italic text-slate-400">No written comment.</span>}
                </p>
              </div>

              {(openReview.images?.length ?? 0) > 0 && (
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Photos</p>
                  <ReviewImages images={openReview.images} authorName={openReview.user?.name} size="md" />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Product</p>
                  <p className="mt-0.5 text-sm font-medium text-slate-800">{openReview.product?.name || "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Vendor</p>
                  <p className="mt-0.5 text-sm font-medium text-slate-800">
                    {openReview.product?.vendor?.storeName || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</p>
                  <p className="mt-0.5 text-sm font-semibold text-slate-800">
                    {openReview.status === "HIDDEN" ? "Hidden" : "Published"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Purchase</p>
                  <p className="mt-0.5 text-sm font-medium text-slate-800">
                    {openReview.orderItemId ? "Verified order line" : "Legacy (no link)"}
                  </p>
                </div>
              </div>

              {openReview.vendorReply && (
                <div className="rounded-xl border-l-2 border-indigo-500 bg-slate-50 px-3 py-2.5">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <Store size={11} /> Seller response
                  </p>
                  <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-slate-600">
                    {openReview.vendorReply}
                  </p>
                </div>
              )}

              <p className="flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-xs leading-relaxed text-amber-800">
                <AlertTriangle size={11} className="mt-0.5 shrink-0" />
                Hiding recalculates the product and vendor ratings and clears their caches immediately.
              </p>
            </div>

            <div className="sticky bottom-0 mt-auto flex items-center gap-2 border-t border-slate-200 bg-white px-5 py-4">
              {openReview.status === "HIDDEN" ? (
                <button
                  type="button"
                  disabled={!canModerate || moderateState.isLoading}
                  onClick={() => applyStatus(openReview.id, "PUBLISHED")}
                  className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30 disabled:opacity-40"
                >
                  <Eye size={12} /> Publish
                </button>
              ) : (
                <button
                  type="button"
                  disabled={!canModerate || moderateState.isLoading}
                  onClick={() => setPendingHide(openReview.id)}
                  className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30 disabled:opacity-40"
                >
                  <EyeOff size={12} /> Hide
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpenId(null)}
                className="inline-flex h-10 items-center rounded-xl px-4 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30"
              >
                Close
              </button>
            </div>
          </aside>
        </div>
      )}

      <ConfirmDialog
        open={pendingHide !== null}
        title="Hide this review?"
        description="It disappears from the product page and stops counting towards the product rating and the vendor's average. You can publish it again from the Hidden tab."
        confirmLabel="Hide"
        destructive
        busy={moderateState.isLoading}
        onConfirm={() => pendingHide && applyStatus(pendingHide, "HIDDEN")}
        onCancel={() => setPendingHide(null)}
      />
    </div>
  );
}

const TONES = {
  indigo: { bar: "bg-indigo-500", tile: "bg-indigo-50 text-indigo-700" },
  emerald: { bar: "bg-emerald-500", tile: "bg-emerald-50 text-emerald-700" },
  slate: { bar: "bg-slate-400", tile: "bg-slate-100 text-slate-600" },
  amber: { bar: "bg-amber-400", tile: "bg-amber-50 text-amber-700" },
  sky: { bar: "bg-sky-500", tile: "bg-sky-50 text-sky-700" },
} as const;

type KpiTone = keyof typeof TONES;

function Kpi({
  label,
  value,
  icon,
  loading,
  tone,
  hint,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  loading?: boolean;
  tone: KpiTone;
  hint?: string;
}) {
  const t = TONES[tone];
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md">
      <div className={`absolute inset-x-0 top-0 h-1 ${t.bar}`} />
      <div className="flex items-center gap-2.5">
        <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${t.tile}`}>{icon}</div>
        <p className="text-xs font-medium text-slate-500">{label}</p>
      </div>
      <p className="mt-3 text-2xl font-semibold leading-none tracking-tight text-slate-900 tabular-nums">
        {loading ? <span className="inline-block h-6 w-10 animate-pulse rounded-md bg-slate-100" /> : value}
      </p>
      {hint && <p className="mt-1 text-xs font-medium text-emerald-700">{hint}</p>}
    </div>
  );
}
