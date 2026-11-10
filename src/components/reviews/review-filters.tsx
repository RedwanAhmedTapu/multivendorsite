"use client";

// components/reviews/review-filters.tsx
//
// Rating chips + sort. The rating value is what the API expects (`rating=5`),
// `undefined` = all stars.

import { Star, X } from "lucide-react";

export type ReviewSortBy = "newest" | "oldest" | "highest_rating" | "lowest_rating";

const SORTS: { value: ReviewSortBy; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "highest_rating", label: "Highest rating" },
  { value: "lowest_rating", label: "Lowest rating" },
];

interface ReviewFiltersProps {
  rating?: number;
  onRating: (rating?: number) => void;
  sortBy: ReviewSortBy;
  onSort: (sort: ReviewSortBy) => void;
  /** Optional per-star counts, keyed by star. */
  counts?: Partial<Record<number, number>>;
  total?: number;
  variant?: "storefront" | "dashboard";
  disabled?: boolean;
}

export function ReviewFilters({
  rating,
  onRating,
  sortBy,
  onSort,
  counts,
  total,
  variant = "storefront",
  disabled = false,
}: ReviewFiltersProps) {
  const dashboard = variant === "dashboard";
  const activeChip = dashboard
    ? "border-blue-600 bg-blue-600 text-white"
    : "border-teal-800 bg-teal-800 text-white";
  const idleChip = "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={disabled}
        onClick={() => onRating(undefined)}
        className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition disabled:opacity-50 ${
          rating === undefined ? activeChip : idleChip
        }`}
        aria-pressed={rating === undefined}
      >
        All{typeof total === "number" ? ` (${total})` : ""}
      </button>

      {[5, 4, 3, 2, 1].map((star) => {
        const count = counts?.[star];
        const active = rating === star;
        return (
          <button
            key={star}
            type="button"
            disabled={disabled}
            onClick={() => onRating(active ? undefined : star)}
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1.5 text-[11px] font-semibold transition disabled:opacity-50 ${
              active ? activeChip : idleChip
            }`}
            aria-pressed={active}
            aria-label={`${star} star${star === 1 ? "" : "s"}${typeof count === "number" ? `, ${count} reviews` : ""}`}
          >
            {star}
            <Star size={10} className={active ? "fill-white text-white" : "fill-amber-400 text-amber-400"} />
            {typeof count === "number" && (
              <span className={active ? "text-white/80" : "text-slate-400"}>{count}</span>
            )}
          </button>
        );
      })}

      {rating !== undefined && (
        <button
          type="button"
          onClick={() => onRating(undefined)}
          className="inline-flex items-center gap-1 rounded-full px-2 py-1.5 text-[11px] font-medium text-slate-500 transition hover:text-slate-800"
        >
          <X size={11} /> Clear
        </button>
      )}

      <label className="ml-auto inline-flex items-center gap-1.5 text-[11px] text-slate-500">
        <span className="sr-only sm:not-sr-only">Sort</span>
        <select
          value={sortBy}
          disabled={disabled}
          onChange={(e) => onSort(e.target.value as ReviewSortBy)}
          className={`rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] font-medium text-slate-700 outline-none transition focus:border-slate-300 focus:ring-2 disabled:opacity-50 ${
            dashboard ? "focus:ring-blue-100" : "focus:ring-teal-100"
          }`}
        >
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
