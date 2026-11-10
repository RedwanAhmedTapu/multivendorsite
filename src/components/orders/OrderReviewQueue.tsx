"use client";

// src/components/orders/OrderReviewQueue.tsx
//
// Admin order review queue — GET /api/admin-orders/fraud-review (requires the
// orderManagement permission on the backend). PENDING orders that need an
// admin decision: COD orders awaiting confirmation (high-risk ones cannot be
// confirmed by vendors) and paid online orders that are not confirmed,
// including payments that arrived after the stock reservation was released.
// Server-side queue filter, order-number search and pagination; counts are the
// backend's per-queue totals.

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { AlertCircle, ChevronLeft, ChevronRight, Inbox, Loader2, RefreshCw, Search, ShieldCheck, X } from "lucide-react";

import { useGetAdminFraudReviewQuery, type FraudReviewFilters, type ReviewQueueItem } from "@/features/adminOrderApi";
import { TONE_CLASSES, formatDateTime, formatMoney, paymentMethodLabel, reviewFacts } from "@/lib/orders/order-review";
import { OrderReviewSheet, ReasonBadge } from "@/components/orders/OrderReviewSheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

type Queue = "all" | "cod" | "paid";
const PAGE_SIZE = 20;

function errorStatus(error: unknown): number | string | undefined {
  return (error as { status?: number | string } | undefined)?.status;
}

function QueueCard({ item, onOpen }: { item: ReviewQueueItem; onOpen: () => void }) {
  const facts = reviewFacts(item);
  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className="group flex w-full flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-slate-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/30 md:grid md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1.2fr)_auto] md:items-center md:gap-4"
        aria-label={`Review order ${item.orderNumber}`}
      >
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="break-all font-mono text-sm font-bold text-slate-900">{item.orderNumber}</span>
            <ReasonBadge item={item} />
          </div>
          <p className="text-xs text-slate-500">
            {formatDateTime(item.createdAt)} · {item.customer?.name ?? "Unknown customer"}
          </p>
        </div>
        <div className="flex items-baseline justify-between gap-3 md:block">
          <p className="text-base font-bold text-slate-900">{formatMoney(item.totalAmount)}</p>
          <p className="text-xs text-slate-500">
            {paymentMethodLabel(item.paymentMethod)}
            {item.riskScore !== null ? ` · risk ${item.riskScore.toFixed(0)}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {[facts.payment, facts.stock].map((f) => (
            <span key={f.label} className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold ${TONE_CLASSES[f.tone]}`}>
              {f.label}: {f.value}
            </span>
          ))}
        </div>
        <span className="hidden items-center gap-1 text-xs font-semibold text-slate-500 group-hover:text-slate-900 md:inline-flex">
          Review
          <ChevronRight className="size-4" aria-hidden />
        </span>
      </button>
    </li>
  );
}

export function OrderReviewQueue() {
  const [queue, setQueue] = useState<Queue>("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const params: FraudReviewFilters = useMemo(() => {
    const p: FraudReviewFilters = { page, limit: PAGE_SIZE };
    if (queue !== "all") p.queue = queue;
    if (search) p.search = search;
    return p;
  }, [queue, search, page]);

  const { data, isLoading, isFetching, isError, error, refetch } = useGetAdminFraudReviewQuery(params, { refetchOnMountOrArgChange: true });
  const items = data?.data ?? [];
  const pagination = data?.pagination;
  const counts = data?.counts;
  const selected = items.find((i) => i.id === selectedId) ?? null;
  const totalPages = Math.max(1, pagination?.totalPages ?? 1);

  // The last order of the last page was resolved: step back instead of showing an empty page.
  useEffect(() => {
    if (pagination && page > totalPages) setPage(totalPages);
  }, [pagination, page, totalPages]);

  const tabs: { key: Queue; label: string; short?: string; count?: number }[] = [
    { key: "all", label: "All", count: counts ? counts.cod + counts.paid : undefined },
    { key: "cod", label: "Cash on delivery", short: "COD", count: counts?.cod },
    { key: "paid", label: "Paid online", short: "Paid", count: counts?.paid },
  ];

  const submitSearch = (e: FormEvent) => {
    e.preventDefault();
    setSearch(searchInput.trim().slice(0, 64));
    setPage(1);
  };
  const clearSearch = () => {
    setSearchInput("");
    setSearch("");
    setPage(1);
  };

  const status = errorStatus(error);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-[1200px] space-y-5 px-4 py-6 sm:px-6 sm:py-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-slate-900 p-2.5 text-white shadow-lg shadow-slate-900/20">
              <ShieldCheck className="size-5" aria-hidden />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">Order review</h1>
              <p className="mt-0.5 max-w-xl text-sm text-slate-500">
                Pending orders that need an admin decision: COD orders awaiting confirmation and paid orders that couldn't be confirmed.
              </p>
            </div>
          </div>
          <Button type="button" variant="outline" onClick={() => refetch()} disabled={isFetching} className="h-11 self-start sm:h-9 sm:self-auto">
            <RefreshCw className={isFetching ? "animate-spin" : undefined} aria-hidden />
            Refresh
          </Button>
        </header>

        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1" role="group" aria-label="Queue">
            {tabs.map((t) => (
              <button
                key={t.key}
                type="button"
                aria-pressed={queue === t.key}
                onClick={() => {
                  setQueue(t.key);
                  setPage(1);
                }}
                className={`flex min-h-10 items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/30 sm:px-3 sm:text-sm ${
                  queue === t.key ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {t.short ? (
                  <>
                    <span className="sm:hidden" aria-hidden>
                      {t.short}
                    </span>
                    <span className="sr-only sm:not-sr-only sm:truncate">{t.label}</span>
                  </>
                ) : (
                  <span className="truncate">{t.label}</span>
                )}
                {t.count !== undefined ? (
                  <span className={`rounded-full px-1.5 text-[11px] tabular-nums ${queue === t.key ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-700"}`}>
                    {t.count}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
          <form onSubmit={submitSearch} role="search" className="flex w-full gap-2 lg:w-auto">
            <label htmlFor="order-review-search" className="sr-only">
              Search by order number
            </label>
            <div className="relative min-w-0 flex-1 lg:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
              <Input
                id="order-review-search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                maxLength={64}
                placeholder="Order number"
                className="h-11 pl-9 text-base sm:h-10 sm:text-sm"
              />
            </div>
            <Button type="submit" className="h-11 bg-slate-900 text-white hover:bg-slate-800 sm:h-10">
              Search
            </Button>
            {search ? (
              <Button type="button" variant="ghost" onClick={clearSearch} className="h-11 px-3 sm:h-10" aria-label="Clear search">
                <X aria-hidden />
              </Button>
            ) : null}
          </form>
        </div>

        {search && !isLoading ? (
          <p className="text-sm text-slate-600">
            {pagination?.total ?? 0} {pagination?.total === 1 ? "result" : "results"} for <span className="font-mono font-semibold text-slate-900">{search}</span>
          </p>
        ) : null}

        {isLoading ? (
          <ul className="space-y-3" aria-label="Loading orders">
            {Array.from({ length: 4 }).map((_, i) => (
              <li key={i} className="rounded-2xl border border-slate-200 bg-white p-4">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="mt-3 h-3 w-64 max-w-full" />
                <Skeleton className="mt-3 h-5 w-48" />
              </li>
            ))}
          </ul>
        ) : isError ? (
          <div role="alert" className="flex flex-col items-center gap-3 rounded-2xl border border-red-200 bg-white px-6 py-10 text-center">
            <AlertCircle className="size-8 text-red-500" aria-hidden />
            <div>
              <p className="font-semibold text-slate-900">
                {status === 403 ? "You don't have access to order review" : status === 401 ? "Your session has expired" : "Couldn't load the review queue"}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {status === 403
                  ? "Ask an owner for the Order management permission."
                  : status === 401
                    ? "Sign in again to continue."
                    : "Check your connection and try again."}
              </p>
            </div>
            {status !== 403 && status !== 401 ? (
              <Button type="button" variant="outline" onClick={() => refetch()} className="h-11 sm:h-9">
                <RefreshCw aria-hidden />
                Try again
              </Button>
            ) : null}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
            <Inbox className="size-8 text-slate-400" aria-hidden />
            <div>
              <p className="font-semibold text-slate-900">{search ? "No matching orders" : "Nothing to review"}</p>
              <p className="mt-1 text-sm text-slate-500">
                {search ? "No order in this queue matches that order number." : "No pending orders need an admin decision right now."}
              </p>
            </div>
            {search ? (
              <Button type="button" variant="outline" onClick={clearSearch} className="h-11 sm:h-9">
                Clear search
              </Button>
            ) : null}
          </div>
        ) : (
          <>
            <ul className={`space-y-3 transition-opacity ${isFetching ? "opacity-60" : ""}`} aria-busy={isFetching}>
              {items.map((item) => (
                <QueueCard key={item.id} item={item} onOpen={() => setSelectedId(item.id)} />
              ))}
            </ul>

            {totalPages > 1 ? (
              <nav className="flex items-center justify-between gap-3" aria-label="Pagination">
                <Button type="button" variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1 || isFetching} className="h-11 sm:h-9">
                  <ChevronLeft aria-hidden />
                  Previous
                </Button>
                <p className="flex items-center gap-2 text-sm text-slate-600">
                  {isFetching ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
                  Page {page} of {totalPages}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || isFetching}
                  className="h-11 sm:h-9"
                >
                  Next
                  <ChevronRight aria-hidden />
                </Button>
              </nav>
            ) : null}
          </>
        )}
      </div>

      <OrderReviewSheet item={selected} open={!!selected} onOpenChange={(o) => (!o ? setSelectedId(null) : undefined)} onSettled={() => refetch()} />
    </div>
  );
}
