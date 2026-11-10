"use client";

// Customer payment result screen for /payment/success | /payment/failed |
// /payment/cancelled. Everything shown comes from the PERSISTED state
// (GET /api/payment/result/:transactionId, owner only) — the route a gateway
// redirected to is never treated as proof. While the payment is still
// PENDING the result is re-read on a short interval for a limited time; the
// customer can always check again manually.

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CircleSlash,
  Clock3,
  Loader2,
  LogIn,
  PackageX,
  RefreshCw,
  RotateCcw,
  SearchX,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import type { RootState } from "@/store/store";
import { PageBreadcrumb } from "@/components/cart/PageBreadcrumb";
import { useGetPaymentResultQuery, type PaymentResult } from "@/features/paymentApi";
import {
  formatPaymentAmount,
  paymentMethodLabel,
  resultScreenCopy,
  resultScreenKey,
  shouldPoll,
  type PaymentLanding,
  type ResultScreenKey,
  type ResultTone,
} from "@/lib/payment/payment-result";

const PAGE = "mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8";
const BTN_BASE =
  "inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:cursor-not-allowed sm:w-auto";
const PRIMARY_BTN = `${BTN_BASE} bg-teal-700 text-white hover:bg-teal-800 disabled:bg-stone-300 disabled:text-stone-500`;
const SECONDARY_BTN = `${BTN_BASE} border border-stone-300 bg-white text-stone-700 hover:border-stone-400 hover:bg-stone-50`;

const TONE: Record<ResultTone, { icon: string; bar: string; badge: string }> = {
  success: { icon: "bg-teal-50 text-teal-700 ring-teal-100", bar: "bg-teal-600", badge: "bg-teal-50 text-teal-800 ring-teal-200" },
  attention: { icon: "bg-amber-50 text-amber-600 ring-amber-100", bar: "bg-amber-500", badge: "bg-amber-50 text-amber-800 ring-amber-200" },
  danger: { icon: "bg-rose-50 text-rose-600 ring-rose-100", bar: "bg-rose-500", badge: "bg-rose-50 text-rose-700 ring-rose-200" },
  neutral: { icon: "bg-stone-100 text-stone-600 ring-stone-200", bar: "bg-stone-300", badge: "bg-stone-100 text-stone-700 ring-stone-200" },
};

const ICON: Record<ResultScreenKey, typeof CheckCircle2> = {
  LOADING: Loader2,
  SIGN_IN: LogIn,
  UNVERIFIED: ShieldAlert,
  NOT_FOUND: SearchX,
  ERROR: AlertTriangle,
  CONFIRMED: CheckCircle2,
  DELIVERY_FEE_PAID: CheckCircle2,
  HELD_STOCK: PackageX,
  HELD_REVIEW: Clock3,
  UNAPPLIED: ShieldAlert,
  PENDING: Clock3,
  PENDING_TIMEOUT: Clock3,
  REPORTED_NOT_COMPLETED: XCircle,
  FAILED: XCircle,
  CANCELLED: CircleSlash,
  ORDER_CANCELLED: CircleSlash,
  REFUNDED: RotateCcw,
};

const errorStatus = (error: unknown) => (error as FetchBaseQueryError | undefined)?.status;
const orderHref = (r: PaymentResult) => `/user-dashboard/orders/${encodeURIComponent(r.order.id)}`;
const orderLabel = (r: PaymentResult) => (r.order.orderNumber ? `#${r.order.orderNumber}` : `#${r.order.id.slice(-8).toUpperCase()}`);

export function PaymentResultView({
  landing,
  pollIntervalMs = 4000,
  pollTimeoutMs = 90_000,
}: {
  landing: PaymentLanding;
  pollIntervalMs?: number;
  pollTimeoutMs?: number;
}) {
  const params = useSearchParams();
  const transactionId = params.get("tran_id")?.trim() || null;
  const { user, accessToken } = useSelector((s: RootState) => s.auth);
  const isAuthenticated = !!user && !!accessToken;

  // Polling budget: from the moment the screen opens.
  const [pollingExpired, setPollingExpired] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setPollingExpired(true), pollTimeoutMs);
    return () => clearTimeout(t);
  }, [pollTimeoutMs]);

  const [poll, setPoll] = useState(false);
  const query = useGetPaymentResultQuery(transactionId ?? "", {
    skip: !transactionId || !isAuthenticated,
    pollingInterval: poll ? pollIntervalMs : 0,
    skipPollingIfUnfocused: true,
  });
  const result = query.data?.data;
  useEffect(() => setPoll(shouldPoll(result, pollingExpired)), [result, pollingExpired]);

  const key = resultScreenKey({
    landing,
    transactionId,
    isAuthenticated,
    query: { isLoading: query.isLoading, isError: query.isError, errorStatus: errorStatus(query.error), result },
    pollingExpired,
  });
  const copy = resultScreenCopy(key, landing);
  const tone = TONE[copy.tone];
  const Icon = ICON[key];
  const checking = query.isFetching;

  return (
    <div className="min-h-[70vh] bg-stone-50 pb-16">
      <div className={`${PAGE} pt-5 md:pt-6`}>
        <PageBreadcrumb current="Payment" />

        <section aria-labelledby="payment-result-title" className="mx-auto mt-6 w-full max-w-xl sm:mt-10">
          <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
            <div className={`h-1 w-full ${tone.bar}`} aria-hidden="true" />

            <div className="px-5 py-8 text-center sm:px-10 sm:py-10" aria-live="polite" aria-busy={key === "LOADING"}>
              <span className={`inline-flex h-16 w-16 items-center justify-center rounded-full ring-1 ${tone.icon}`} aria-hidden="true">
                <Icon className={`h-8 w-8 ${key === "LOADING" ? "motion-safe:animate-spin" : ""}`} strokeWidth={1.75} />
              </span>
              <h2 id="payment-result-title" className="mt-5 text-2xl tracking-tight text-balance text-stone-900 sm:text-[28px]">
                {copy.title}
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-pretty text-stone-500 sm:text-[15px]">{copy.body}</p>
              {key === "PENDING" && (
                <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600">
                  <Loader2 className="h-3.5 w-3.5 motion-safe:animate-spin" aria-hidden="true" />
                  Checking automatically
                </p>
              )}
            </div>

            {key === "LOADING" && <DetailsSkeleton />}
            {result && key !== "LOADING" && <ResultDetails result={result} badge={copy.badge} badgeClass={tone.badge} />}

            <div className="flex flex-col-reverse gap-3 border-t border-stone-100 px-5 py-5 sm:flex-row sm:justify-center sm:px-10">
              <Actions screen={key} result={result} checking={checking} onCheck={() => void query.refetch()} />
            </div>
          </div>

          <p className="mt-5 px-2 text-center text-xs leading-relaxed text-stone-500">
            Need help?{" "}
            <Link href="/help-center" className="font-medium text-teal-700 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700">
              Contact FinixMart support
            </Link>
            {transactionId && (
              <>
                {" "}and mention the payment reference <span className="break-all font-mono text-stone-700">{transactionId}</span>.
              </>
            )}
          </p>
        </section>
      </div>
    </div>
  );
}

function ResultDetails({ result, badge, badgeClass }: { result: PaymentResult; badge: string; badgeClass: string }) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-3 border-t border-stone-100 bg-stone-50/70 px-5 py-5 sm:grid-cols-2 sm:px-10">
      <Detail label="Order">
        <Link href={orderHref(result)} className="font-semibold tabular-nums text-stone-900 underline-offset-4 hover:text-teal-700 hover:underline">
          {orderLabel(result)}
        </Link>
      </Detail>
      <Detail label="Amount">
        <span className="font-semibold tabular-nums text-stone-900">{formatPaymentAmount(result.amount)}</span>
      </Detail>
      <Detail label="Payment method">
        <span className="text-stone-700">{paymentMethodLabel(result.method)}</span>
      </Detail>
      <Detail label="Status">
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${badgeClass}`}>{badge}</span>
      </Detail>
    </dl>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3 sm:block">
      <dt className="text-xs font-medium uppercase tracking-wide text-stone-500">{label}</dt>
      <dd className="min-w-0 text-right text-sm sm:mt-1 sm:text-left">{children}</dd>
    </div>
  );
}

function DetailsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 border-t border-stone-100 bg-stone-50/70 px-5 py-5 sm:grid-cols-2 sm:px-10" aria-hidden="true">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="motion-safe:animate-pulse space-y-2">
          <div className="h-2.5 w-16 rounded bg-stone-200" />
          <div className="h-4 w-28 rounded bg-stone-200" />
        </div>
      ))}
    </div>
  );
}

function Actions({ screen, result, checking, onCheck }: { screen: ResultScreenKey; result?: PaymentResult; checking: boolean; onCheck: () => void }) {
  const orders = (
    <Link href="/user-dashboard/orders" className={SECONDARY_BTN}>
      My orders
    </Link>
  );
  const shop = (
    <Link href="/" className={SECONDARY_BTN}>
      Continue shopping
    </Link>
  );
  const viewOrder = (primary: boolean) =>
    result ? (
      <Link href={orderHref(result)} className={primary ? PRIMARY_BTN : SECONDARY_BTN}>
        View order {primary && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
      </Link>
    ) : (
      orders
    );
  const check = (label: string) => (
    <button type="button" onClick={onCheck} disabled={checking} className={PRIMARY_BTN}>
      <RefreshCw className={`h-4 w-4 ${checking ? "motion-safe:animate-spin" : ""}`} aria-hidden="true" />
      {checking ? "Checking…" : label}
    </button>
  );

  switch (screen) {
    case "LOADING":
      return orders;
    case "SIGN_IN":
      return (
        <>
          <Link href="/" className={SECONDARY_BTN}>
            Go to homepage
          </Link>
          <Link href="/login" className={PRIMARY_BTN}>
            <LogIn className="h-4 w-4" aria-hidden="true" />
            Sign in
          </Link>
        </>
      );
    case "PENDING":
      return (
        <>
          {viewOrder(false)}
          {check("Check now")}
        </>
      );
    case "PENDING_TIMEOUT":
    case "REPORTED_NOT_COMPLETED":
      return (
        <>
          {viewOrder(false)}
          {check("Check again")}
        </>
      );
    case "ERROR":
      return (
        <>
          {orders}
          {check("Try again")}
        </>
      );
    case "UNVERIFIED":
    case "NOT_FOUND":
      return (
        <>
          {shop}
          <Link href="/user-dashboard/orders" className={PRIMARY_BTN}>
            My orders <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </>
      );
    case "CONFIRMED":
    case "DELIVERY_FEE_PAID":
      return (
        <>
          {shop}
          {viewOrder(true)}
        </>
      );
    default:
      // HELD_*, FAILED, CANCELLED, ORDER_CANCELLED, REFUNDED
      return (
        <>
          {orders}
          {viewOrder(true)}
        </>
      );
  }
}

/** Shown while the client component (and its search params) loads. */
export function PaymentResultFallback() {
  return (
    <div className="min-h-[70vh] bg-stone-50 pb-16" role="status" aria-label="Loading payment result">
      <div className={`${PAGE} pt-5 md:pt-6`}>
        <div className="mx-auto mt-6 w-full max-w-xl rounded-2xl border border-stone-200 bg-white p-8 sm:mt-10 sm:p-10">
          <div className="mx-auto h-16 w-16 rounded-full bg-stone-100 motion-safe:animate-pulse" />
          <div className="mx-auto mt-5 h-6 w-2/3 rounded bg-stone-200 motion-safe:animate-pulse" />
          <div className="mx-auto mt-3 h-4 w-5/6 rounded bg-stone-100 motion-safe:animate-pulse" />
        </div>
      </div>
    </div>
  );
}
