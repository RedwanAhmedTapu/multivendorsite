"use client";

// Vendor › Subscription: the store owner's plan, features, usage and payment
// history, and the pricing page. Every plan, price and feature comes from the
// API; nothing here is hardcoded. Choosing a paid plan sends a request that
// FinixMart confirms after payment: nothing is charged from this page.

import { useMemo, useState } from "react";
import { Check, Clock, Crown, Gift, Minus, Receipt, Sparkles, X } from "lucide-react";
import {
  apiError,
  useVendorCancelRequestMutation,
  useVendorCurrentQuery,
  useVendorPlansQuery,
  useVendorRequestPlanMutation,
  useVendorSubPaymentsQuery,
  type VendorPlan,
} from "@/features/billingApi";
import { STATE_LABEL, STATE_TONE, cycleSavingsPercent, dateText, limitText, monthlyEquivalent, offerValueText, perCycle, taka, takaShort } from "@/lib/billing/format";
import { Badge, Button, Card, EmptyState, Field, Modal, Notice, Shell, Skeleton, cx, inputCls, tableCls, tdCls, thCls } from "@/components/billing/ui";

export default function VendorSubscriptionPage() {
  const { data: cur, isLoading: l1, isError } = useVendorCurrentQuery();
  const { data: plansRes, isLoading: l2 } = useVendorPlansQuery();
  const { data: payRes } = useVendorSubPaymentsQuery();
  const [cycleMonths, setCycleMonths] = useState<number | null>(null);
  const [choose, setChoose] = useState<{ plan: VendorPlan; cycleId: string } | null>(null);
  const [msg, setMsg] = useState<{ tone: "green" | "red" | "violet"; text: string } | null>(null);
  const [cancelReq] = useVendorCancelRequestMutation();

  const cycles = plansRes?.data.cycles ?? [];
  const plans = plansRes?.data.plans ?? [];
  const months = cycleMonths ?? cycles[0]?.months ?? 1;
  const c = cur?.data;
  const state = c?.evaluation.state ?? "NONE";

  if (l1 || l2) return <Shell><Skeleton rows={6} /></Shell>;
  if (isError) return <Shell><Notice tone="red">Subscription information isn&apos;t available right now. Only the store owner can open this page.</Notice></Shell>;

  return (
    <Shell>
      {/* hero: current plan */}
      <section className="relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-[#312e81] via-[#4f46e5] to-[#9333ea] p-5 text-white shadow-[0_20px_40px_rgba(79,70,229,0.3)] sm:p-7">
        <div aria-hidden className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-white/70"><Crown className="h-3.5 w-3.5" />Your FinixMart plan</p>
            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{c?.package?.name ?? "No plan yet"}</h1>
            <p className="mt-1 text-sm text-white/80">
              {state === "NONE" ? "Pick a plan below to unlock more tools for your store." : STATE_LABEL[state]}
              {c?.subscription?.expiresAt && state !== "NONE" ? ` · ${state === "EXPIRED" ? "ended" : "renews / ends"} ${dateText(c.subscription.expiresAt)}` : ""}
              {state === "ACTIVE" && !c?.subscription?.expiresAt ? " · no end date" : ""}
              {c?.cycle ? ` · ${c.cycle.name}` : ""}
            </p>
            {state === "GRACE" && <p className="mt-2 inline-block rounded-lg bg-amber-400/20 px-2 py-1 text-xs font-semibold text-amber-100">Grace period until {dateText(c?.evaluation.graceEndsAt)}. Renew to keep your features.</p>}
          </div>
          {state === "ACTIVE" && c?.evaluation.daysLeft !== null && c?.evaluation.daysLeft !== undefined && (
            <div className="rounded-2xl bg-white/15 px-4 py-3 text-center backdrop-blur">
              <p className="text-3xl font-bold">{c.evaluation.daysLeft}</p>
              <p className="text-xs text-white/80">days left</p>
            </div>
          )}
        </div>
      </section>

      {msg && <div className="mb-4"><Notice tone={msg.tone}>{msg.text}</Notice></div>}

      {(c?.pendingRequests.length ?? 0) > 0 && (
        <Card className="mb-5" title={<span className="flex items-center gap-2"><Clock className="h-4 w-4 text-[#7c3aed]" />Waiting for confirmation</span>}>
          <ul className="space-y-2">
            {c!.pendingRequests.map((p) => (
              <li key={p.id} className="flex flex-col gap-2 rounded-xl bg-[#faf9ff] p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                <span><b>{p.package?.name}</b> · {p.cycle?.name} · {taka(p.amount)}<span className="block text-xs text-[#64748b]">Pay FinixMart and share the transaction ID with support; your plan starts once it&apos;s confirmed.</span></span>
                <Button size="sm" variant="ghost" onClick={async () => { try { await cancelReq(p.id).unwrap(); setMsg({ tone: "violet", text: "Request withdrawn." }); } catch (e) { setMsg({ tone: "red", text: apiError(e) }); } }}><X className="h-3.5 w-3.5" />Withdraw</Button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {(c?.offers.length ?? 0) > 0 && (
        <div className="mb-5 grid gap-3 md:grid-cols-2">
          {c!.offers.map((o) => (
            <div key={o.id} className="flex items-start gap-3 rounded-2xl border border-[#f5d0fe] bg-gradient-to-r from-[#fdf4ff] to-[#f5f3ff] p-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#c026d3] to-[#7c3aed] text-white"><Gift className="h-5 w-5" /></span>
              <div className="text-sm">
                <p className="font-semibold text-[#1e1b4b]">{o.kind === "FREE_PLAN" ? `Free ${o.planName} access` : o.kind === "FREE_FEATURE" ? `Free ${o.featureName}` : `${offerValueText(o.kind, o.value)} on ${o.planName}`}</p>
                <p className="text-xs text-[#64748b]">{o.live ? "Active now" : `Starts ${dateText(o.startsAt)}`} · until {dateText(o.endsAt)}. Nothing is charged when it ends.</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* features + usage */}
      {(c?.entitlements.length ?? 0) > 0 && (
        <Card className="mb-6" title="Your features">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {c!.entitlements.map((e) => (
              <div key={e.key} className={cx("rounded-xl border p-3", e.granted ? "border-[#ddd6fe] bg-white" : "border-dashed border-slate-200 bg-slate-50/60")}>
                <div className="flex items-center justify-between gap-2">
                  <p className={cx("font-medium", e.granted ? "text-[#1e1b4b]" : "text-[#94a3b8]")}>{e.name}</p>
                  {e.granted ? <Badge tone="green"><Check className="h-3 w-3" />{e.sources.includes("PLAN") ? "Included" : "Offer"}</Badge> : <Badge tone="slate">Not in plan</Badge>}
                </div>
                {e.granted && e.limitDefs.map((d) => {
                  const cap = e.limits[d.key];
                  const used = e.usage.find((u) => u.key === d.key)?.used ?? 0;
                  if (d.type === "boolean") return <p key={d.key} className="mt-1 text-xs text-[#64748b]">{d.label}: {limitText("boolean", cap as boolean | null)}</p>;
                  const pct = typeof cap === "number" && cap > 0 ? Math.min(100, Math.round((used / cap) * 100)) : 0;
                  return (
                    <div key={d.key} className="mt-2">
                      <div className="flex justify-between text-xs text-[#64748b]"><span>{d.label}</span><span>{typeof cap === "number" ? `${used} / ${limitText("number", cap, d.unit, d.period)}` : "Unlimited"}</span></div>
                      {typeof cap === "number" && <div className="mt-1 h-1.5 rounded-full bg-[#f1f0ff]"><div className={cx("h-1.5 rounded-full", pct >= 90 ? "bg-rose-500" : "bg-[#7c3aed]")} style={{ width: `${pct}%` }} /></div>}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* pricing */}
      <div className="mb-4 flex flex-col items-center text-center">
        <h2 className="flex items-center gap-2 text-2xl font-bold text-[#1e1b4b]"><Sparkles className="h-5 w-5 text-[#7c3aed]" />Choose your plan</h2>
        <p className="mt-1 text-sm text-[#64748b]">Prices in Taka. Your special offers are already applied.</p>
        {cycles.length > 1 && (
          <div className="mt-4 inline-flex rounded-2xl bg-white p-1 shadow-[0_4px_16px_rgba(79,70,229,0.1)]" role="tablist" aria-label="Billing cycle">
            {cycles.map((cy) => (
              <button key={cy.id} role="tab" aria-selected={months === cy.months} onClick={() => setCycleMonths(cy.months)}
                className={cx("rounded-xl px-4 py-2 text-sm font-semibold transition", months === cy.months ? "bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white shadow" : "text-[#64748b] hover:text-[#4c1d95]")}>{cy.name}</button>
            ))}
          </div>
        )}
      </div>
      {!plans.length ? <EmptyState icon={<Sparkles className="h-5 w-5" />} title="Plans are coming soon" body="FinixMart hasn't published any plans yet." /> : (
        <PricingGrid plans={plans} months={months} currentPackageId={state === "ACTIVE" || state === "GRACE" ? c?.package?.id ?? null : null} currentCycleMonths={c?.cycle?.months ?? null} onChoose={(plan, cycleId) => setChoose({ plan, cycleId })} />
      )}

      {/* payment history */}
      <Card className="mt-6" title={<span className="flex items-center gap-2"><Receipt className="h-4 w-4 text-[#7c3aed]" />Payment history</span>}>
        {!(payRes?.data ?? []).length ? <p className="text-sm text-[#64748b]">No payments yet.</p> : (
          <div className="overflow-x-auto">
            <table className={tableCls}>
              <thead><tr className="border-b border-[#ede9fe]"><th className={thCls}>Date</th><th className={thCls}>Plan</th><th className={`${thCls} text-right`}>Amount</th><th className={thCls}>Period</th><th className={thCls}>Status</th></tr></thead>
              <tbody>
                {payRes!.data.map((p) => (
                  <tr key={p.id} className="border-b border-[#f5f3ff] last:border-0">
                    <td className={tdCls}>{dateText(p.createdAt)}</td>
                    <td className={tdCls}>{p.package?.name}<span className="block text-xs text-[#94a3b8]">{p.cycle?.name}</span></td>
                    <td className={`${tdCls} text-right font-medium`}>{taka(p.amount)}</td>
                    <td className={`${tdCls} text-xs`}>{p.periodStart ? `${dateText(p.periodStart)} – ${dateText(p.periodEnd)}` : "—"}</td>
                    <td className={tdCls}><Badge tone={STATE_TONE[p.status]}>{p.status.toLowerCase()}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {choose && <ChooseModal plan={choose.plan} cycleId={choose.cycleId} onClose={() => setChoose(null)} onDone={(t) => { setChoose(null); setMsg({ tone: "green", text: t }); }} />}
    </Shell>
  );
}

function PricingGrid({ plans, months, currentPackageId, currentCycleMonths, onChoose }: {
  plans: VendorPlan[]; months: number; currentPackageId: string | null; currentCycleMonths: number | null; onChoose: (p: VendorPlan, cycleId: string) => void;
}) {
  const allFeatures = useMemo(() => {
    const seen = new Map<string, string>();
    for (const p of plans) for (const f of p.features) if (!seen.has(f.key)) seen.set(f.key, f.name);
    return [...seen.entries()];
  }, [plans]);
  return (
    <>
      <div className={cx("grid gap-5", plans.length === 1 ? "mx-auto max-w-md" : plans.length === 2 ? "md:grid-cols-2" : "md:grid-cols-2 xl:grid-cols-3")}>
        {plans.map((p) => {
          const price = p.prices.find((x) => x.months === months) ?? null;
          const monthly = p.prices.find((x) => x.months === 1);
          const save = price && monthly ? cycleSavingsPercent(monthly.finalPrice, price.finalPrice, price.months) : 0;
          const isCurrent = currentPackageId === p.id && (!price || currentCycleMonths === price.months);
          return (
            <article key={p.id} className={cx("relative flex flex-col rounded-3xl border bg-white p-5 shadow-[0_10px_30px_rgba(79,70,229,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(79,70,229,0.14)] sm:p-6", p.isPopular ? "border-[#a78bfa] ring-2 ring-[#a78bfa]/40" : "border-[#e6e3ff]")}>
              {p.isPopular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#4f46e5] to-[#c026d3] px-3 py-1 text-xs font-bold text-white shadow">Most popular</span>}
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ background: p.color || "#7c3aed" }} />
                <h3 className="text-lg font-bold text-[#1e1b4b]">{p.name}</h3>
                {isCurrent && <Badge tone="green">Current</Badge>}
              </div>
              {p.description && <p className="mt-1 text-sm text-[#64748b]">{p.description}</p>}
              <div className="mt-5 min-h-[88px]">
                {price ? (
                  <>
                    {price.finalPrice !== price.listPrice && <p className="text-sm text-[#94a3b8] line-through">{takaShort(price.listPrice)}</p>}
                    <p className="flex items-end gap-1.5"><span className="text-4xl font-extrabold tracking-tight text-[#1e1b4b]">{takaShort(price.finalPrice)}</span><span className="mb-1 text-sm text-[#64748b]">{perCycle(price.months)}</span></p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {price.months > 1 && <span className="text-xs text-[#64748b]">≈ {taka(monthlyEquivalent(price.finalPrice, price.months))} / month</span>}
                      {save > 0 && <Badge tone="green">Save {save}%</Badge>}
                      {price.offerId && <Badge tone="violet"><Gift className="h-3 w-3" />Your offer</Badge>}
                    </div>
                  </>
                ) : <p className="text-sm text-[#94a3b8]">Not available for this billing cycle.</p>}
                {p.freeUntil && <p className="mt-2 text-xs font-semibold text-[#a21caf]">Free for you until {dateText(p.freeUntil)}</p>}
              </div>
              <ul className="mt-5 flex-1 space-y-2.5">
                {p.features.map((f) => (
                  <li key={f.key} className="flex items-start gap-2 text-sm text-[#334155]">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#ede9fe] text-[#6d28d9]"><Check className="h-3 w-3" /></span>
                    <span>
                      {f.name}
                      {f.limitDefs.length > 0 && <span className="block text-xs text-[#64748b]">{f.limitDefs.map((d) => `${d.label}: ${limitText(d.type, (f.limits ?? {})[d.key] ?? null, d.unit, d.period)}`).join(" · ")}</span>}
                    </span>
                  </li>
                ))}
                {!p.features.length && <li className="text-sm text-[#94a3b8]">Feature list coming soon</li>}
              </ul>
              <Button className="mt-6 w-full" variant={p.isPopular ? "primary" : "secondary"} disabled={!price || isCurrent} onClick={() => price && onChoose(p, price.cycleId)}>
                {isCurrent ? "Your current plan" : currentPackageId ? (currentPackageId === p.id ? "Renew" : "Switch to this plan") : "Choose plan"}
              </Button>
            </article>
          );
        })}
      </div>
      {plans.length > 1 && allFeatures.length > 0 && (
        <Card className="mt-6" title="Compare plans">
          <div className="overflow-x-auto">
            <table className={tableCls}>
              <thead><tr className="border-b border-[#ede9fe]"><th className={thCls}>Feature</th>{plans.map((p) => <th key={p.id} className={`${thCls} text-center`}>{p.name}</th>)}</tr></thead>
              <tbody>
                {allFeatures.map(([key, name]) => (
                  <tr key={key} className="border-b border-[#f5f3ff] last:border-0">
                    <td className={tdCls}>{name}</td>
                    {plans.map((p) => {
                      const f = p.features.find((x) => x.key === key);
                      return <td key={p.id} className={`${tdCls} text-center`}>{f ? (f.limitDefs.length ? <span className="text-xs">{f.limitDefs.map((d) => limitText(d.type, (f.limits ?? {})[d.key] ?? null, d.unit, d.period)).join(" · ")}</span> : <Check className="mx-auto h-4 w-4 text-[#7c3aed]" aria-label="Included" />) : <Minus className="mx-auto h-4 w-4 text-slate-300" aria-label="Not included" />}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  );
}

function ChooseModal({ plan, cycleId, onClose, onDone }: { plan: VendorPlan; cycleId: string; onClose: () => void; onDone: (t: string) => void }) {
  const [request, { isLoading }] = useVendorRequestPlanMutation();
  const [method, setMethod] = useState("BKASH");
  const [reference, setReference] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const price = plan.prices.find((p) => p.cycleId === cycleId)!;
  const free = Number(price.finalPrice) === 0;
  const submit = async () => {
    setErr(null);
    try {
      const res = await request({ packageId: plan.id, cycleId, method, reference: reference || undefined }).unwrap();
      onDone(res.data.status === "ACTIVE" ? `${plan.name} is active.` : res.data.duplicate ? "You already asked for this plan; it's waiting for confirmation." : `Request sent. Pay ${taka(price.finalPrice)} to FinixMart and your ${plan.name} plan starts once the payment is confirmed.`);
    } catch (e) {
      setErr(apiError(e));
    }
  };
  return (
    <Modal open title={`${plan.name} · ${price.cycleName}`} onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button loading={isLoading} onClick={submit}>{free ? "Activate" : "Send request"}</Button></>}>
      <div className="space-y-4">
        <div className="rounded-2xl bg-gradient-to-r from-[#f5f3ff] to-[#eef2ff] p-4">
          <p className="text-sm text-[#64748b]">You pay</p>
          <p className="text-3xl font-bold text-[#1e1b4b]">{taka(price.finalPrice)} <span className="text-sm font-normal text-[#64748b]">{perCycle(price.months)}</span></p>
          {price.savings !== "0.00" && <p className="text-xs text-emerald-700">You save {taka(price.savings)}</p>}
        </div>
        {free ? <Notice tone="green">This plan costs nothing for you right now, so it starts immediately.</Notice> : (
          <>
            <Notice tone="violet">Nothing is charged here. FinixMart confirms your payment and then starts the plan. If you have already paid, add the transaction ID.</Notice>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="How will you pay?"><select className={inputCls} value={method} onChange={(e) => setMethod(e.target.value)}>{["BKASH", "NAGAD", "ROCKET", "BANK_TRANSFER", "CASH"].map((m) => <option key={m} value={m}>{m.replace("_", " ").toLowerCase()}</option>)}</select></Field>
              <Field label="Transaction ID (optional)"><input className={inputCls} value={reference} onChange={(e) => setReference(e.target.value)} /></Field>
            </div>
          </>
        )}
        {err && <Notice tone="red">{err}</Notice>}
      </div>
    </Modal>
  );
}
