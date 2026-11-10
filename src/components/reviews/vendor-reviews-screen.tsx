"use client";

// components/reviews/vendor-reviews-screen.tsx
//
// Vendor dashboard → Reviews. Blue gradient/StatCard idiom from the product
// forms (bg-white rounded-2xl border-blue-100 shadow-blue-50).
//
// The FEED is live: GET /api/vendor/reviews. The REPLY action needs
// reviews.vendorReply*, which the server reports through `meta.schemaReady` —
// false until Migration A is applied — so the composer stays disabled with the
// reason instead of firing a request that would 503.

import { useMemo, useState } from "react";
import { Lock, MessageSquare, RefreshCw, Reply, ShieldOff, Star, TrendingUp } from "lucide-react";
import {
  ENDPOINTS_REQUIRED,
  REVIEW_MODERATION_API_READY,
  useGetVendorReviewsQuery,
  useReplyToReviewMutation,
  type ModerationListQuery,
} from "@/features/reviewModerationApi";
import { ReviewCard } from "./review-card";
import { ReviewFilters, type ReviewSortBy } from "./review-filters";
import { ReviewEmpty, ReviewError, ReviewSkeleton } from "./review-states";
import { IntegrationPanel } from "./integration-panel";
import type { ReviewDto } from "./review-types";

interface VendorReviewsScreenProps {
  /** Tests render the shell without a network call; production uses the flag. */
  enabled?: boolean;
}

export function VendorReviewsScreen({ enabled = REVIEW_MODERATION_API_READY }: VendorReviewsScreenProps) {
  const [page, setPage] = useState(1);
  const [rating, setRating] = useState<number | undefined>(undefined);
  const [sortBy, setSortBy] = useState<ReviewSortBy>("newest");
  const [status, setStatus] = useState<"ALL" | "PUBLISHED" | "HIDDEN">("ALL");
  const [search, setSearch] = useState("");
  const [replyFor, setReplyFor] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyError, setReplyError] = useState<string | null>(null);

  const query: ModerationListQuery = { page, limit: 10, rating, status, sortBy, search };
  const list = useGetVendorReviewsQuery(query, { skip: !enabled });
  const [replyToReview, replyState] = useReplyToReviewMutation();

  const meta = list.data?.meta;
  const schemaReady = meta?.schemaReady ?? false;
  const canReply = enabled && schemaReady;

  const rows = useMemo(() => (list.data?.data ?? []) as unknown as ReviewDto[], [list.data]);
  const pagination = list.data?.pagination;
  const answered = rows.filter((r) => !!r.vendorReply).length;

  const submitReply = async (reviewId: string) => {
    const text = replyText.trim();
    if (!text || !canReply) return;
    setReplyError(null);
    try {
      await replyToReview({ reviewId, reply: text }).unwrap();
      setReplyFor(null);
      setReplyText("");
    } catch (error) {
      const box = error as { data?: { message?: string } };
      setReplyError(box?.data?.message || "Could not save the reply.");
    }
  };

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-slate-800">Reviews</h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Every review left on your products, with a single seller response each.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-500 ring-1 ring-blue-100">
            {enabled ? `${pagination?.totalItems ?? rows.length} reviews` : "feed disabled"}
          </span>
          <button
            type="button"
            disabled={!enabled || list.isFetching}
            onClick={() => list.refetch()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-3 py-2 text-xs font-semibold text-white transition hover:brightness-105 disabled:opacity-50"
          >
            <RefreshCw size={12} className={list.isFetching ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Total reviews" value={enabled ? pagination?.totalItems ?? rows.length : null} icon={<MessageSquare size={14} />} accent="from-blue-500 to-cyan-400" />
        <Stat label="Answered" value={enabled ? answered : null} icon={<Reply size={14} />} accent="from-emerald-500 to-teal-400" />
        <Stat label="Average rating" value={enabled ? averageOf(rows) : null} icon={<Star size={14} />} accent="from-amber-400 to-orange-400" />
        <Stat label="Hidden" value={enabled ? rows.filter((r) => r.status === "HIDDEN").length : null} icon={<ShieldOff size={14} />} accent="from-rose-400 to-pink-400" />
      </div>

      {!enabled && (
        <IntegrationPanel
          title="Vendor review feed is disabled"
          description="The route is implemented (GET /api/vendor/reviews). This shell rendered with the feed switched off, so it issued no request and shows no rows."
          endpoints={ENDPOINTS_REQUIRED.filter((e) => e.path.includes("/vendor/"))}
        />
      )}

      {enabled && !schemaReady && !list.isLoading && !list.isError && (
        <div className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50/70 px-3.5 py-2.5">
          <Lock size={13} className="mt-0.5 shrink-0 text-amber-600" />
          <p className="text-[11px] leading-relaxed text-amber-800">
            <span className="font-semibold">Seller replies are disabled.</span> The review schema is
            not provisioned yet (Migration A + client regeneration), so the API reports
            <code className="mx-1 rounded bg-white/70 px-1 py-0.5 font-mono text-[10px]">schemaReady: false</code>
            and the composer stays locked rather than failing on submit.
          </p>
        </div>
      )}

      <div className="rounded-2xl border border-blue-100 bg-white p-3 shadow-sm shadow-blue-50">
        <div className="flex flex-wrap items-center gap-2">
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
            variant="dashboard"
            disabled={!enabled}
          />
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <select
              value={status}
              disabled={!enabled || !schemaReady}
              title={schemaReady ? undefined : "Status filtering needs reviews.status"}
              onChange={(e) => {
                setStatus(e.target.value as typeof status);
                setPage(1);
              }}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] font-medium text-slate-700 outline-none focus:border-slate-300 focus:ring-2 focus:ring-blue-100 disabled:opacity-50"
            >
              <option value="ALL">All statuses</option>
              <option value="PUBLISHED">Published</option>
              <option value="HIDDEN">Hidden</option>
            </select>
            <input
              value={search}
              disabled={!enabled}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search review text or product…"
              className="w-52 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] text-slate-700 outline-none placeholder:text-slate-400 focus:border-slate-300 focus:ring-2 focus:ring-blue-100 disabled:opacity-50"
            />
          </div>
        </div>
      </div>

      {!enabled ? (
        <ReviewEmpty
          title="Feed disabled"
          description="No request is made while the screen is rendered disabled. Turn the feed on to load this vendor's reviews."
        />
      ) : list.isLoading ? (
        <ReviewSkeleton rows={4} />
      ) : list.isError ? (
        <ReviewError
          message="We could not load your reviews. If this says 404, the vendor review route is not deployed in this environment."
          onRetry={() => list.refetch()}
        />
      ) : rows.length === 0 ? (
        <ReviewEmpty
          title={search || rating || status !== "ALL" ? "No reviews match these filters" : "No reviews yet"}
          description={
            search || rating || status !== "ALL"
              ? "Try clearing the search, the star filter and the status filter."
              : "When customers review your products they appear here, newest first."
          }
        />
      ) : (
        <div className={`space-y-3 ${list.isFetching ? "opacity-60 transition-opacity" : ""}`}>
          {rows.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              variant="dashboard"
              showStatus
              replySlot={
                <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                  <p className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
                    <TrendingUp size={11} /> Seller response
                  </p>
                  {review.vendorReply ? (
                    <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-slate-600">
                      {review.vendorReply}
                    </p>
                  ) : replyFor === review.id && canReply ? (
                    <div className="mt-2 space-y-2">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value.slice(0, 2000))}
                        rows={3}
                        placeholder="Thank the customer, address the issue, offer a next step…"
                        className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-slate-300 focus:ring-2 focus:ring-blue-100"
                      />
                      {replyError && (
                        <p role="alert" className="text-[11px] font-medium text-rose-600">
                          {replyError}
                        </p>
                      )}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={replyState.isLoading || !replyText.trim()}
                          onClick={() => submitReply(review.id)}
                          className="rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 px-2.5 py-1.5 text-[11px] font-semibold text-white disabled:opacity-40"
                        >
                          {replyState.isLoading ? "Saving…" : "Publish reply"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setReplyFor(null);
                            setReplyText("");
                            setReplyError(null);
                          }}
                          className="text-[11px] font-medium text-slate-500 hover:text-slate-700"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={!canReply}
                      title={canReply ? undefined : "Replies need the review schema (Migration A + client regeneration)"}
                      onClick={() => {
                        setReplyFor(review.id);
                        setReplyText("");
                        setReplyError(null);
                      }}
                      className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 disabled:cursor-not-allowed disabled:text-slate-400"
                    >
                      {canReply ? <Reply size={11} /> : <Lock size={11} />} Reply to this review
                    </button>
                  )}
                </div>
              }
            />
          ))}
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            type="button"
            disabled={!pagination.hasPrevious}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-[11px] text-slate-500 tabular-nums">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          <button
            type="button"
            disabled={!pagination.hasNext}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

function averageOf(rows: ReviewDto[]): string {
  if (rows.length === 0) return "—";
  const sum = rows.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
  return (sum / rows.length).toFixed(1);
}

function Stat({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string | number | null;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-blue-100 bg-white p-4 shadow-sm shadow-blue-50">
      <div className={`absolute right-0 top-0 h-16 w-16 -translate-y-6 translate-x-6 rounded-full bg-gradient-to-br ${accent} opacity-[0.08]`} />
      <div className={`mb-2 flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br ${accent} text-white shadow-sm`}>
        {icon}
      </div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 text-lg font-bold text-slate-800 tabular-nums">
        {value === null ? <span className="text-sm font-medium text-slate-300">—</span> : value}
      </p>
    </div>
  );
}
