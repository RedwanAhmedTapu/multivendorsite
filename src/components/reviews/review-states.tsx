"use client";

// components/reviews/review-states.tsx
//
// The three states every review surface needs. Kept together so the customer,
// vendor and admin screens cannot drift into three different looks.

import type { ReactNode } from "react";
import { AlertTriangle, MessageSquare, RefreshCw } from "lucide-react";

export function ReviewSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-hidden="true">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="animate-pulse rounded-2xl border border-slate-100 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-slate-100" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-32 rounded bg-slate-100" />
              <div className="h-3 w-20 rounded bg-slate-100" />
            </div>
          </div>
          <div className="mt-3 space-y-2">
            <div className="h-3 w-full rounded bg-slate-100" />
            <div className="h-3 w-4/5 rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface ReviewEmptyProps {
  title?: string;
  description?: string;
  action?: ReactNode;
}

export function ReviewEmpty({
  title = "No reviews yet",
  description = "Be the first to share what you think about this product.",
  action,
}: ReviewEmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-10 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-300 shadow-sm">
        <MessageSquare size={20} />
      </span>
      <p className="mt-3 text-sm font-semibold text-slate-700">{title}</p>
      <p className="mt-1 max-w-sm text-xs leading-relaxed text-slate-500">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

interface ReviewErrorProps {
  message?: string;
  onRetry?: () => void;
  compact?: boolean;
}

export function ReviewError({
  message = "We could not load the reviews. Please try again.",
  onRetry,
  compact = false,
}: ReviewErrorProps) {
  return (
    <div
      role="alert"
      className={`flex flex-col items-start gap-2 rounded-2xl border border-rose-100 bg-rose-50/70 px-4 py-3 text-left ${
        compact ? "" : "sm:flex-row sm:items-center sm:justify-between"
      }`}
    >
      <div className="flex items-start gap-2">
        <AlertTriangle size={16} className="mt-0.5 shrink-0 text-rose-500" />
        <p className="text-xs leading-relaxed text-rose-700">{message}</p>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold text-rose-600 shadow-sm ring-1 ring-rose-100 transition hover:bg-rose-100"
        >
          <RefreshCw size={12} /> Retry
        </button>
      )}
    </div>
  );
}
