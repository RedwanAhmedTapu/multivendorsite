"use client";

// src/components/orders/PaymentReconciliationQueue.tsx
//
// Admin payment-reconciliation queue — GET /api/admin-orders/payment-reconciliation
// (ADMIN / EMPLOYEE with orderManagement, enforced by the backend router).
// Verified gateway payments the backend could not apply to their order: the
// money was received, the order was left as it was, no refund and no Event 0a.
// READ-ONLY by design: there is no apply / refund / resolve action until a
// separately tested, idempotent service contract and a refund policy exist.

import { useEffect, useState } from "react";
import { AlertCircle, ChevronLeft, ChevronRight, Inbox, Info, Loader2, RefreshCw, Scale } from "lucide-react";

import { useGetUnappliedPaymentsQuery, type UnappliedPayment } from "@/features/adminOrderApi";
import { formatDateTime, formatMoney, humanize } from "@/lib/orders/order-review";
import { RECONCILIATION_NOTICE, gatewayLabel, unappliedReasonCopy } from "@/lib/orders/payment-reconciliation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const PAGE_SIZE = 20;

function Field({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{term}</dt>
      <dd className="mt-0.5 break-words text-sm text-slate-900">{children}</dd>
    </div>
  );
}

function PaymentCard({ p }: { p: UnappliedPayment }) {
  const r = p.reconciliation;
  const reason = unappliedReasonCopy(r?.reason);
  return (
    <li className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-lg font-bold text-slate-900">{formatMoney(r?.amount ?? p.amount)}</span>
            <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800">{reason.label}</span>
            <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">Needs review</span>
          </div>
          <p className="text-sm leading-relaxed text-slate-600">{reason.explanation}</p>
        </div>
        <p className="shrink-0 text-xs text-slate-500">Received {formatDateTime(r?.receivedAt ?? p.createdAt)}</p>
      </div>
      <dl className="mt-4 grid grid-cols-1 gap-3 border-t border-slate-100 pt-4 min-[480px]:grid-cols-2 lg:grid-cols-4">
        <Field term="Order">
          <span className="font-mono font-semibold">{p.order?.orderNumber ?? "—"}</span>
          {p.order ? <span className="block text-xs text-slate-500">{`${humanize(p.order.status)} · payment ${humanize(p.order.paymentStatus)}`}</span> : null}
        </Field>
        <Field term="Customer">
          {p.order?.user?.name ?? "—"}
          {p.order?.user?.email ? <span className="block text-xs text-slate-500">{p.order.user.email}</span> : null}
        </Field>
        <Field term="Gateway">
          {gatewayLabel(r?.gateway ?? p.method)}
          {r?.gatewayRef ? <span className="block break-all font-mono text-xs text-slate-500">{r.gatewayRef}</span> : null}
        </Field>
        <Field term="Payment record">
          <span className="font-mono text-xs">{p.id}</span>
          <span className="block text-xs text-slate-500">{`status ${humanize(p.status)} (unchanged)`}</span>
        </Field>
      </dl>
    </li>
  );
}

export function PaymentReconciliationQueue() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching, isError, error, refetch } = useGetUnappliedPaymentsQuery({ page, limit: PAGE_SIZE }, { refetchOnMountOrArgChange: true });
  const items = data?.data ?? [];
  const total = data?.pagination?.total ?? 0;
  const totalPages = Math.max(1, data?.pagination?.totalPages ?? 1);
  const status = (error as { status?: number | string } | undefined)?.status;

  useEffect(() => {
    if (data?.pagination && page > totalPages) setPage(totalPages);
  }, [data?.pagination, page, totalPages]);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-[1200px] space-y-5 px-4 py-6 sm:px-6 sm:py-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-slate-900 p-2.5 text-white shadow-lg shadow-slate-900/20">
              <Scale className="size-5" aria-hidden />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">Payment reconciliation</h1>
              <p className="mt-0.5 max-w-xl text-sm text-slate-500">
                Payments received from a gateway that couldn&apos;t be applied to their order.
                {data ? ` ${total} awaiting review.` : ""}
              </p>
            </div>
          </div>
          <Button type="button" variant="outline" onClick={() => refetch()} disabled={isFetching} className="h-11 self-start sm:h-9 sm:self-auto">
            <RefreshCw className={isFetching ? "animate-spin" : undefined} aria-hidden />
            Refresh
          </Button>
        </header>

        <div role="note" className="flex gap-3 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm leading-relaxed text-sky-900">
          <Info className="mt-0.5 size-5 shrink-0" aria-hidden />
          <p>{RECONCILIATION_NOTICE}</p>
        </div>

        {isLoading ? (
          <ul className="space-y-3" aria-label="Loading payments">
            {Array.from({ length: 3 }).map((_, i) => (
              <li key={i} className="rounded-2xl border border-slate-200 bg-white p-5">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="mt-3 h-4 w-80 max-w-full" />
                <Skeleton className="mt-4 h-10 w-full" />
              </li>
            ))}
          </ul>
        ) : isError ? (
          <div role="alert" className="flex flex-col items-center gap-3 rounded-2xl border border-red-200 bg-white px-6 py-10 text-center">
            <AlertCircle className="size-8 text-red-500" aria-hidden />
            <p className="font-semibold text-slate-900">
              {status === 403 ? "You don't have access to payment reconciliation" : status === 401 ? "Your session has expired" : "Couldn't load the reconciliation queue"}
            </p>
            <p className="text-sm text-slate-500">
              {status === 403 ? "Ask an owner for the Order management permission." : status === 401 ? "Sign in again to continue." : "Check your connection and try again."}
            </p>
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
            <p className="font-semibold text-slate-900">Nothing to reconcile</p>
            <p className="text-sm text-slate-500">No received payment is waiting for review.</p>
          </div>
        ) : (
          <>
            <ul className={`space-y-3 transition-opacity ${isFetching ? "opacity-60" : ""}`} aria-busy={isFetching}>
              {items.map((p) => (
                <PaymentCard key={p.id} p={p} />
              ))}
            </ul>
            {totalPages > 1 ? (
              <nav className="flex items-center justify-between gap-3" aria-label="Pagination">
                <Button type="button" variant="outline" onClick={() => setPage((x) => Math.max(1, x - 1))} disabled={page <= 1 || isFetching} className="h-11 sm:h-9">
                  <ChevronLeft aria-hidden />
                  Previous
                </Button>
                <p className="flex items-center gap-2 text-sm text-slate-600">
                  {isFetching ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
                  Page {page} of {totalPages}
                </p>
                <Button type="button" variant="outline" onClick={() => setPage((x) => Math.min(totalPages, x + 1))} disabled={page >= totalPages || isFetching} className="h-11 sm:h-9">
                  Next
                  <ChevronRight aria-hidden />
                </Button>
              </nav>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
