"use client";

// Vendor › POS subscription: status, plans, checkout and payment history.
// Only the store OWNER buys (backend: POST /api/pos/subscription/checkout is
// VENDOR-role only). Amounts come from the server's plan rows; the gateway
// return lands here with ?result=… which is display-only — the payment was
// already verified (or not) with the gateway on the server.

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { CreditCard, Receipt, ShieldCheck } from "lucide-react";
import {
  useGetPosPaymentsQuery,
  useGetPosPlansQuery,
  useGetSubscriptionQuery,
  useStartPosCheckoutMutation,
} from "@/features/posApi";
import { useGetMeQuery } from "@/features/authApi";
import {
  ENTITLEMENT_LABEL,
  PAYMENT_STATUS_LABEL,
  SOURCE_LABEL,
  checkoutResultMessage,
  durationText,
  formatDate,
  formatTaka,
  posBannerFor,
  safeGatewayUrl,
} from "@/lib/pos/subscription-view";

const card = "rounded-2xl border border-[#E5EAF2] bg-white p-4 shadow-[0_1px_2px_rgba(13,27,46,0.04)] sm:p-5";
const toneCls = {
  info: "bg-sky-50 text-sky-800 ring-sky-200",
  warn: "bg-amber-50 text-amber-800 ring-amber-200",
  danger: "bg-rose-50 text-rose-800 ring-rose-200",
} as const;

export default function PosBillingPage() {
  return (
    <Suspense fallback={<div className={card}><p className="text-sm text-[#7A90AB]">Loading…</p></div>}>
      <PosBilling />
    </Suspense>
  );
}

function PosBilling() {
  const { data: meRes } = useGetMeQuery();
  const me = meRes?.data;
  const params = useSearchParams();
  const result = checkoutResultMessage(params.get("result"));
  const ref = params.get("ref");

  const sub = useGetSubscriptionQuery();
  const plans = useGetPosPlansQuery();
  const isOwner = me?.role === "VENDOR";
  // `isOwner` only becomes true after /me resolves. Passing `skip: !isOwner` straight
  // to the hook makes RTK Query subscribe/unsubscribe *during* the render in which that
  // data arrives, notifying other subscribers of the same store (RequireVendorSide reads
  // /me too) while React is still rendering this component — the "cannot update a
  // component while rendering another" warning. Route the flip through state set in an
  // effect so the subscription change happens after commit.
  const [canLoadPayments, setCanLoadPayments] = useState(false);
  useEffect(() => { setCanLoadPayments(isOwner); }, [isOwner]);
  const payments = useGetPosPaymentsQuery(undefined, { skip: !canLoadPayments });
  const [checkout, { isLoading: starting }] = useStartPosCheckoutMutation();
  const [busyPlan, setBusyPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (me && !isOwner) {
    return (
      <div className={card}>
        <p className="text-sm font-semibold text-[#0D1B2E]">Only the store owner can manage the POS subscription.</p>
      </div>
    );
  }

  const status = sub.data?.data;
  const e = status?.entitlement;
  const banner = status ? posBannerFor(status) : null;

  const buy = async (planId: string) => {
    setError(null);
    setBusyPlan(planId);
    try {
      const res = await checkout({ planId }).unwrap();
      const url = safeGatewayUrl(res.data.redirectUrl);
      if (!url) throw new Error("The payment gateway returned an invalid address.");
      window.location.assign(url);
    } catch (err) {
      const m = (err as { data?: { message?: string }; message?: string })?.data?.message ?? (err as Error)?.message;
      setError(m || "Couldn't start the payment. Please try again.");
      setBusyPlan(null);
    }
  };

  return (
    <div className="space-y-4">
      <header className={`${card} flex items-start gap-3`}>
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white">
          <CreditCard className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <h1 className="text-xl font-bold text-[#0D1B2E]">POS subscription</h1>
          <p className="text-sm text-[#7A90AB]">Your store&apos;s point-of-sale access, plans and payments.</p>
        </div>
      </header>

      {result && (
        <div role="status" className={`rounded-xl px-4 py-3 text-sm ring-1 ${toneCls[result.tone]}`}>
          {result.text}
          {ref && <span className="ml-1 font-mono text-xs">Ref: {ref}</span>}
        </div>
      )}

      <section aria-label="Current status" className={card}>
        {sub.isLoading ? (
          <p className="text-sm text-[#7A90AB]">Loading…</p>
        ) : sub.isError || !status || !e ? (
          <p role="alert" className="text-sm text-rose-600">Couldn&apos;t load your POS subscription.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-4">
            <div>
              <p className="text-xs text-[#7A90AB]">Status</p>
              <p className="text-base font-bold text-[#0D1B2E]">{ENTITLEMENT_LABEL[e.state]}</p>
            </div>
            <div>
              <p className="text-xs text-[#7A90AB]">Type</p>
              <p className="text-base font-bold text-[#0D1B2E]">{status.subscription ? SOURCE_LABEL[status.subscription.source] ?? status.subscription.source : "—"}</p>
            </div>
            <div>
              <p className="text-xs text-[#7A90AB]">Access until</p>
              <p className="text-base font-bold text-[#0D1B2E]">{e.expiresAt ? formatDate(e.expiresAt) : status.subscription ? "No end date" : "—"}</p>
            </div>
            <div>
              <p className="text-xs text-[#7A90AB]">Plan</p>
              <p className="text-base font-bold text-[#0D1B2E]">{status.subscription?.plan?.name ?? "—"}</p>
            </div>
            {banner && (
              <p role="status" className={`sm:col-span-4 rounded-xl px-3 py-2 text-xs font-semibold ring-1 ${toneCls[banner.tone]}`}>{banner.text}</p>
            )}
          </div>
        )}
      </section>

      <section aria-label="Plans" className="space-y-2">
        <h2 className="text-sm font-semibold text-[#0D1B2E]">Plans</h2>
        {error && <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">{error}</p>}
        {plans.isLoading ? (
          <p className="text-sm text-[#7A90AB]">Loading plans…</p>
        ) : !plans.data?.data?.length ? (
          <div className={card}><p className="text-sm text-[#7A90AB]">No POS plans are available yet. FinixMart will publish them soon.</p></div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {plans.data.data.map((p) => (
              <div key={p.id} className={`${card} flex flex-col`}>
                <p className="text-base font-bold text-[#0D1B2E]">{p.name}</p>
                {p.description && <p className="mt-1 text-sm text-[#7A90AB]">{p.description}</p>}
                <p className="mt-3 text-2xl font-extrabold text-[#0D1B2E]">{formatTaka(p.price)}</p>
                <p className="text-xs text-[#7A90AB]">for {durationText(p.durationDays)} · one-time payment, renew manually</p>
                <button
                  type="button"
                  disabled={starting || e?.state === "SUSPENDED" || (e?.state === "ACTIVE" && !e.expiresAt)}
                  onClick={() => buy(p.id)}
                  className="mt-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                >
                  {busyPlan === p.id ? "Opening payment…" : e?.state === "ACTIVE" || e?.state === "GRACE" ? "Extend with this plan" : "Buy this plan"}
                </button>
              </div>
            ))}
          </div>
        )}
        <p className="flex items-center gap-1.5 text-xs text-[#7A90AB]">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden /> Paid time is added after the payment gateway confirms the payment to FinixMart.
        </p>
      </section>

      <section aria-label="Payment history" className={card}>
        <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-[#0D1B2E]"><Receipt className="h-4 w-4" aria-hidden /> Payments</h2>
        {payments.isLoading ? (
          <p className="text-sm text-[#7A90AB]">Loading…</p>
        ) : !payments.data?.data?.length ? (
          <p className="text-sm text-[#7A90AB]">No payments yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-[#7A90AB]">
                  <th className="py-2 pr-3">Date</th><th className="py-2 pr-3">Plan</th><th className="py-2 pr-3">Amount</th><th className="py-2 pr-3">Status</th><th className="py-2">Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF2F7]">
                {payments.data.data.map((p) => (
                  <tr key={p.id}>
                    <td className="py-2 pr-3 whitespace-nowrap">{formatDate(p.createdAt)}</td>
                    <td className="py-2 pr-3">{p.plan?.name ?? "—"} · {durationText(p.durationDays)}</td>
                    <td className="py-2 pr-3 whitespace-nowrap">{formatTaka(p.amount)}</td>
                    <td className="py-2 pr-3">{PAYMENT_STATUS_LABEL[p.status] ?? p.status}</td>
                    <td className="py-2 font-mono text-xs">{p.tranId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="text-xs text-[#7A90AB]">
        <Link href="/pos" className="font-semibold text-cyan-700 hover:underline">Open the POS terminal →</Link>
      </p>
    </div>
  );
}
