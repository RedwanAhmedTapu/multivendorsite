"use client";

// Admin › Subscriptions: Vendor Subscriptions, Special Vendor Offers and
// Transactions. Every action asks for a reason or a payment reference and is
// re-checked by the server. Nothing here charges a vendor.

import { useEffect, useMemo, useState } from "react";
import { BadgeCheck, CalendarPlus, Ban, Gift, Pause, Play, Receipt, RotateCcw, Search, Store, X, XCircle } from "lucide-react";
import {
  apiError,
  useSubsConfirmPaymentMutation,
  useSubsCreateOfferMutation,
  useSubsCyclesQuery,
  useSubsFeaturesQuery,
  useSubsOfferActionMutation,
  useSubsOffersQuery,
  useSubsPaymentStatusMutation,
  useSubsPlansQuery,
  useSubsQuoteQuery,
  useSubsTransactionsQuery,
  useSubsVendorActionMutation,
  useSubsVendorQuery,
  useSubsVendorSearchQuery,
  useSubsVendorsQuery,
  type SubOffer,
  type SubPayment,
} from "@/features/billingApi";
import { AFTER_EXPIRY_LABEL, OFFER_KIND_LABEL, SOURCE_LABEL, STATE_LABEL, STATE_TONE, dateText, dateTimeText, newIdempotencyKey, offerValueText, taka } from "@/lib/billing/format";
import { Badge, Button, Card, EmptyState, Field, Modal, Notice, ReasonDialog, Skeleton, cx, inputCls, tableCls, tdCls, textareaCls, thCls } from "@/components/billing/ui";

function useDebounced<T>(v: T, ms = 300) {
  const [d, setD] = useState(v);
  useEffect(() => { const t = setTimeout(() => setD(v), ms); return () => clearTimeout(t); }, [v, ms]);
  return d;
}

/** Search-as-you-type vendor picker (id + store name only). */
export function VendorPicker({ value, onChange }: { value: { id: string; storeName: string } | null; onChange: (v: { id: string; storeName: string } | null) => void }) {
  const [q, setQ] = useState("");
  const dq = useDebounced(q);
  const { data, isFetching } = useSubsVendorSearchQuery(dq, { skip: dq.trim().length < 2 });
  if (value) return (
    <div className="flex h-10 items-center justify-between rounded-xl border border-[#c4b5fd] bg-[#faf9ff] px-3 text-sm">
      <span className="flex items-center gap-2"><Store className="h-4 w-4 text-[#7c3aed]" />{value.storeName}</span>
      <button onClick={() => onChange(null)} aria-label="Change vendor" className="text-[#64748b]"><X className="h-4 w-4" /></button>
    </div>
  );
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[#94a3b8]" />
      <input className={cx(inputCls, "pl-9")} placeholder="Type at least 2 letters of the store name" value={q} onChange={(e) => setQ(e.target.value)} />
      {dq.trim().length >= 2 && (
        <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-[#ede9fe] bg-white py-1 shadow-lg">
          {isFetching && <li className="px-3 py-2 text-sm text-[#64748b]">Searching…</li>}
          {!isFetching && !(data?.data ?? []).length && <li className="px-3 py-2 text-sm text-[#64748b]">No vendor found</li>}
          {(data?.data ?? []).map((v) => <li key={v.id}><button className="w-full px-3 py-2 text-left text-sm hover:bg-[#f5f3ff]" onClick={() => onChange(v)}>{v.storeName} <span className="text-xs text-[#94a3b8]">{v.status?.toLowerCase()}</span></button></li>)}
        </ul>
      )}
    </div>
  );
}

// ─── vendor subscriptions ──────────────────────────────────────────────────

export function VendorsSection() {
  const [state, setState] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const dq = useDebounced(q);
  const { data, isLoading } = useSubsVendorsQuery({ state: state || undefined, q: dq || undefined, page });
  const [open, setOpen] = useState<string | null>(null);
  const [pick, setPick] = useState(false);
  const rows = data?.data.items ?? [];
  const total = data?.data.total ?? 0;
  return (
    <Card title="Vendor subscriptions" action={<Button size="sm" onClick={() => setPick(true)}><BadgeCheck className="h-4 w-4" />Manage a vendor</Button>}>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1"><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[#94a3b8]" /><input className={cx(inputCls, "pl-9")} placeholder="Search store name" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} /></div>
        <select className={cx(inputCls, "sm:w-48")} value={state} onChange={(e) => { setState(e.target.value); setPage(1); }}>
          <option value="">All states</option>
          {["ACTIVE", "GRACE", "EXPIRED", "SUSPENDED", "CANCELLED", "PENDING"].map((s) => <option key={s} value={s}>{STATE_LABEL[s]}</option>)}
        </select>
      </div>
      {isLoading ? <Skeleton rows={5} /> : !rows.length ? <EmptyState icon={<Store className="h-5 w-5" />} title="No vendor subscriptions found" body="Vendors appear here once they have a plan. Use “Manage a vendor” to activate one." /> : (
        <>
          <div className="overflow-x-auto">
            <table className={tableCls}>
              <thead><tr className="border-b border-[#ede9fe]"><th className={thCls}>Vendor</th><th className={thCls}>Plan</th><th className={thCls}>State</th><th className={thCls}>Source</th><th className={thCls}>Ends</th><th className={thCls} /></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-[#f5f3ff] last:border-0 hover:bg-[#faf9ff]">
                    <td className={tdCls}><span className="font-medium">{r.vendor.storeName}</span></td>
                    <td className={tdCls}>{r.package ? <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: r.package.color || "#7c3aed" }} />{r.package.name}{r.cycle && <span className="text-xs text-[#94a3b8]">{r.cycle.name}</span>}</span> : "—"}</td>
                    <td className={tdCls}><Badge tone={STATE_TONE[r.evaluation.state]}>{STATE_LABEL[r.evaluation.state]}</Badge></td>
                    <td className={tdCls}>{r.source ? SOURCE_LABEL[r.source] ?? r.source : "—"}</td>
                    <td className={tdCls}>{r.expiresAt ? dateText(r.expiresAt) : "No end date"}{r.evaluation.daysLeft !== null && r.evaluation.state === "ACTIVE" && <span className="block text-xs text-[#94a3b8]">{r.evaluation.daysLeft} days left</span>}</td>
                    <td className={`${tdCls} text-right`}><Button size="sm" variant="secondary" onClick={() => setOpen(r.vendorId)}>Open</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager page={page} total={total} pageSize={data?.data.pageSize ?? 25} onPage={setPage} />
        </>
      )}
      {pick && <PickVendorModal onClose={() => setPick(false)} onPick={(id) => { setPick(false); setOpen(id); }} />}
      {open && <VendorDetailModal vendorId={open} onClose={() => setOpen(null)} />}
    </Card>
  );
}

function Pager({ page, total, pageSize, onPage }: { page: number; total: number; pageSize: number; onPage: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  return (
    <div className="mt-3 flex items-center justify-between text-sm text-[#64748b]">
      <span>{total} total</span>
      <div className="flex gap-2"><Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</Button><span className="self-center">Page {page} of {pages}</span><Button size="sm" variant="secondary" disabled={page >= pages} onClick={() => onPage(page + 1)}>Next</Button></div>
    </div>
  );
}

function PickVendorModal({ onClose, onPick }: { onClose: () => void; onPick: (id: string) => void }) {
  const [v, setV] = useState<{ id: string; storeName: string } | null>(null);
  return (
    <Modal open title="Manage a vendor's subscription" onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button disabled={!v} onClick={() => v && onPick(v.id)}>Open</Button></>}>
      <Field label="Vendor"><VendorPicker value={v} onChange={setV} /></Field>
    </Modal>
  );
}

type Action = "payments" | "activate" | "extend" | "suspend" | "restore" | "cancel" | "offer" | null;

function VendorDetailModal({ vendorId, onClose }: { vendorId: string; onClose: () => void }) {
  const { data, isLoading } = useSubsVendorQuery(vendorId);
  const [run, { isLoading: busy }] = useSubsVendorActionMutation();
  const [action, setAction] = useState<Action>(null);
  const [msg, setMsg] = useState<{ tone: "green" | "red"; text: string } | null>(null);
  const d = data?.data;
  const doAction = async (a: Exclude<Action, null | "offer">, body: Record<string, unknown>, ok: string) => {
    setMsg(null);
    try { await run({ vendorId, action: a, body }).unwrap(); setAction(null); setMsg({ tone: "green", text: ok }); } catch (e) { setMsg({ tone: "red", text: apiError(e) }); }
  };
  const st = d?.evaluation.state ?? "NONE";
  return (
    <Modal open wide title={d ? d.vendor.storeName : "Vendor subscription"} onClose={onClose}>
      {isLoading || !d ? <Skeleton rows={5} /> : (
        <div className="space-y-5">
          <div className="flex flex-col gap-3 rounded-2xl bg-gradient-to-r from-[#4f46e5] to-[#9333ea] p-4 text-white sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-white/70">Current plan</p>
              <p className="text-xl font-bold">{d.package?.name ?? "No plan"}</p>
              <p className="text-sm text-white/80">{STATE_LABEL[st]}{d.evaluation.expiresAt ? ` · ends ${dateText(d.evaluation.expiresAt)}` : st === "ACTIVE" ? " · no end date" : ""}{st === "GRACE" && d.evaluation.graceEndsAt ? ` · grace until ${dateText(d.evaluation.graceEndsAt)}` : ""}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onClick={() => setAction("payments")}><Receipt className="h-3.5 w-3.5" />Record payment</Button>
              <Button size="sm" variant="secondary" onClick={() => setAction("activate")}><BadgeCheck className="h-3.5 w-3.5" />Activate</Button>
              <Button size="sm" variant="secondary" onClick={() => setAction("offer")}><Gift className="h-3.5 w-3.5" />Special offer</Button>
            </div>
          </div>
          {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
          {d.subscription?.status && (
            <div className="flex flex-wrap gap-2">
              {st !== "CANCELLED" && d.evaluation.expiresAt && <Button size="sm" variant="secondary" onClick={() => setAction("extend")}><CalendarPlus className="h-3.5 w-3.5" />Extend</Button>}
              {st !== "SUSPENDED" && st !== "CANCELLED" && <Button size="sm" variant="secondary" onClick={() => setAction("suspend")}><Pause className="h-3.5 w-3.5" />Suspend</Button>}
              {st === "SUSPENDED" && <Button size="sm" variant="secondary" onClick={() => setAction("restore")}><Play className="h-3.5 w-3.5" />Restore</Button>}
              {st !== "CANCELLED" && <Button size="sm" variant="danger" onClick={() => setAction("cancel")}><Ban className="h-3.5 w-3.5" />Cancel</Button>}
            </div>
          )}
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <h3 className="mb-2 text-sm font-semibold text-[#1e1b4b]">Features</h3>
              <ul className="space-y-1.5">
                {d.entitlements.map((e) => (
                  <li key={e.key} className="flex items-center justify-between rounded-lg bg-[#faf9ff] px-3 py-2 text-sm">
                    <span>{e.name}</span>
                    <span className="flex gap-1">{e.granted ? <Badge tone="green">{e.sources.includes("PLAN") ? "Plan" : "Offer"}</Badge> : <Badge tone={e.enforced ? "red" : "amber"}>{e.enforced ? "Blocked" : "Not included"}</Badge>}</span>
                  </li>
                ))}
                {!d.entitlements.length && <li className="text-sm text-[#64748b]">No active features configured.</li>}
              </ul>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold text-[#1e1b4b]">History</h3>
              <ol className="max-h-72 space-y-2 overflow-y-auto border-l-2 border-[#ede9fe] pl-4">
                {d.events.map((ev) => (
                  <li key={ev.id} className="text-sm">
                    <p className="font-medium text-[#1e1b4b]">{ev.kind.replaceAll("_", " ").toLowerCase()}</p>
                    <p className="text-xs text-[#64748b]">{dateTimeText(ev.createdAt)}{ev.reason ? ` · ${ev.reason}` : ""}</p>
                  </li>
                ))}
                {!d.events.length && <li className="text-sm text-[#64748b]">No changes yet.</li>}
              </ol>
            </div>
          </div>
          <PaymentsTable payments={d.payments} compact />
          {d.offers.length > 0 && <OffersTable offers={d.offers} compact />}
        </div>
      )}
      {d && action === "payments" && <RecordPaymentModal vendorId={vendorId} busy={busy} onClose={() => setAction(null)} onSubmit={(b) => doAction("payments", b, "Payment recorded and plan updated.")} />}
      {d && action === "activate" && <ActivateModal busy={busy} onClose={() => setAction(null)} onSubmit={(b) => doAction("activate", b, "Plan activated.")} />}
      {d && action === "offer" && <OfferModal vendor={d.vendor} onClose={() => setAction(null)} onDone={(t) => { setAction(null); setMsg({ tone: "green", text: t }); }} />}
      {action === "extend" && <ExtendModal busy={busy} onClose={() => setAction(null)} onSubmit={(days, reason) => doAction("extend", { days, reason }, `Subscription extended by ${days} day${days === 1 ? "" : "s"}.`)} />}
      <ReasonDialog open={action === "suspend"} title="Suspend subscription" body="Plan features stop working until you restore it. No charge or refund happens." loading={busy} danger onClose={() => setAction(null)} confirmLabel="Suspend" onConfirm={(reason) => doAction("suspend", { reason }, "Subscription suspended.")} />
      <ReasonDialog open={action === "restore"} title="Restore subscription" loading={busy} onClose={() => setAction(null)} confirmLabel="Restore" onConfirm={(reason) => doAction("restore", { reason }, "Subscription restored.")} />
      <ReasonDialog open={action === "cancel"} title="Cancel subscription" body="Plan features stop now. Payments are not refunded automatically (mark a payment refunded under Transactions if you refund it)." loading={busy} danger onClose={() => setAction(null)} confirmLabel="Cancel subscription" onConfirm={(reason) => doAction("cancel", { reason }, "Subscription cancelled.")} />
    </Modal>
  );
}

function ExtendModal({ busy, onClose, onSubmit }: { busy: boolean; onClose: () => void; onSubmit: (days: number, reason: string) => void }) {
  const [days, setDays] = useState(30);
  const [reason, setReason] = useState("");
  const valid = Number.isInteger(days) && days >= 1 && days <= 3650 && reason.trim().length >= 3;
  return (
    <Modal open title="Extend subscription" onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Back</Button><Button loading={busy} disabled={!valid} onClick={() => onSubmit(days, reason.trim())}>Extend</Button></>}>
      <div className="space-y-4">
        <Field label="Days to add" hint="Added to the current end date (or to today if it already passed). No charge."><input type="number" min={1} max={3650} className={inputCls} value={days} onChange={(e) => setDays(Number(e.target.value))} /></Field>
        <Field label="Reason" hint="Kept in the audit log."><textarea className={textareaCls} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} /></Field>
      </div>
    </Modal>
  );
}

function PlanCyclePickers({ packageId, cycleId, onChange, allowDrafts }: { packageId: string; cycleId: string; onChange: (p: string, c: string) => void; allowDrafts?: boolean }) {
  const { data: plans } = useSubsPlansQuery();
  const list = (plans?.data ?? []).filter((p) => p.status === "PUBLISHED" || (allowDrafts && p.status === "DRAFT"));
  const plan = list.find((p) => p.id === packageId);
  const cycles = (plan?.prices ?? []).filter((x) => x.isActive && x.cycle?.isActive);
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Plan">
        <select className={inputCls} value={packageId} onChange={(e) => onChange(e.target.value, "")}>
          <option value="">Choose a plan</option>
          {list.map((p) => <option key={p.id} value={p.id}>{p.name}{p.status !== "PUBLISHED" ? ` (${p.status.toLowerCase()})` : ""}</option>)}
        </select>
      </Field>
      <Field label="Billing cycle">
        <select className={inputCls} value={cycleId} disabled={!plan} onChange={(e) => onChange(packageId, e.target.value)}>
          <option value="">Choose a cycle</option>
          {cycles.map((x) => <option key={x.cycleId} value={x.cycleId}>{x.cycle?.name} · {taka(x.promoPrice ?? x.price)}</option>)}
        </select>
      </Field>
    </div>
  );
}

function RecordPaymentModal({ vendorId, busy, onClose, onSubmit }: { vendorId: string; busy: boolean; onClose: () => void; onSubmit: (b: Record<string, unknown>) => void }) {
  const [packageId, setPackageId] = useState("");
  const [cycleId, setCycleId] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("BANK_TRANSFER");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [overrideReason, setOverrideReason] = useState("");
  const idempotencyKey = useMemo(() => newIdempotencyKey("subpay"), []);
  const { data: q } = useSubsQuoteQuery({ vendorId, packageId, cycleId }, { skip: !packageId || !cycleId });
  useEffect(() => { if (q?.data) setAmount(q.data.finalPrice); }, [q]);
  const mismatch = q?.data && amount !== "" && Number(amount) !== Number(q.data.finalPrice);
  return (
    <Modal open title="Record a received payment" onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button>
      <Button loading={busy} disabled={!packageId || !cycleId || !amount || reference.trim().length < 3 || (mismatch && overrideReason.trim().length < 3) || undefined}
        onClick={() => onSubmit({ packageId, cycleId, amount, method, reference, note: note || undefined, overrideReason: mismatch ? overrideReason : undefined, idempotencyKey })}>Record payment</Button></>}>
      <div className="space-y-4">
        <Notice tone="violet">Only record money you have already received. The plan period starts as soon as you save; recording twice is safe (same form = one payment).</Notice>
        <PlanCyclePickers packageId={packageId} cycleId={cycleId} onChange={(p, c) => { setPackageId(p); setCycleId(c); }} />
        {q?.data && (
          <div className="rounded-xl bg-[#faf9ff] p-3 text-sm">
            <p>Vendor price: <b>{taka(q.data.finalPrice)}</b>{q.data.offerId && <span className="ml-2"><Badge tone="violet">special offer</Badge></span>}</p>
            {q.data.listPrice !== q.data.finalPrice && <p className="text-xs text-[#64748b]">Regular {taka(q.data.listPrice)} · saves {taka(q.data.savings)}</p>}
          </div>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Amount received (৳)"><input inputMode="decimal" className={inputCls} value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
          <Field label="Method">
            <select className={inputCls} value={method} onChange={(e) => setMethod(e.target.value)}>
              {["BANK_TRANSFER", "BKASH", "NAGAD", "ROCKET", "CASH", "CHEQUE", "OTHER"].map((m) => <option key={m} value={m}>{m.replace("_", " ").toLowerCase()}</option>)}
            </select>
          </Field>
          <div className="sm:col-span-2"><Field label="Transaction reference" hint="Bank / wallet transaction ID."><input className={inputCls} value={reference} onChange={(e) => setReference(e.target.value)} /></Field></div>
        </div>
        {mismatch && <Field label="Why is the amount different?" hint="Required when the amount isn't the vendor's price."><input className={inputCls} value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)} /></Field>}
        <Field label="Note (optional)"><textarea className={textareaCls} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
      </div>
    </Modal>
  );
}

function ActivateModal({ busy, onClose, onSubmit }: { busy: boolean; onClose: () => void; onSubmit: (b: Record<string, unknown>) => void }) {
  const [packageId, setPackageId] = useState("");
  const [cycleId, setCycleId] = useState("");
  const [source, setSource] = useState("COMPLIMENTARY");
  const [mode, setMode] = useState<"cycle" | "date" | "open">("cycle");
  const [until, setUntil] = useState("");
  const [reason, setReason] = useState("");
  return (
    <Modal open title="Activate a plan without payment" onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button>
      <Button loading={busy} disabled={!packageId || !cycleId || reason.trim().length < 3 || (mode === "date" && !until)}
        onClick={() => onSubmit({ packageId, cycleId, source, reason, ...(mode === "date" ? { expiresAt: new Date(`${until}T23:59:59+06:00`).toISOString() } : mode === "open" ? { expiresAt: null } : {}) })}>Activate</Button></>}>
      <div className="space-y-4">
        <PlanCyclePickers packageId={packageId} cycleId={cycleId} onChange={(p, c) => { setPackageId(p); setCycleId(c); }} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Type"><select className={inputCls} value={source} onChange={(e) => { setSource(e.target.value); if (e.target.value === "TRIAL" && mode === "open") setMode("cycle"); }}><option value="COMPLIMENTARY">Complimentary</option><option value="TRIAL">Trial</option><option value="ADMIN">Admin adjustment</option></select></Field>
          <Field label="Ends">
            <select className={inputCls} value={mode} onChange={(e) => setMode(e.target.value as typeof mode)}>
              <option value="cycle">After one billing cycle</option><option value="date">On a date</option>{source !== "TRIAL" && <option value="open">No end date</option>}
            </select>
          </Field>
        </div>
        {mode === "date" && <Field label="End date"><input type="date" className={inputCls} value={until} onChange={(e) => setUntil(e.target.value)} /></Field>}
        <Field label="Reason" hint="Kept in the audit log."><input className={inputCls} value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
      </div>
    </Modal>
  );
}

// ─── offers ─────────────────────────────────────────────────────────────────

export function OffersSection() {
  const [status, setStatus] = useState("");
  const { data, isLoading } = useSubsOffersQuery(status ? { status } : undefined);
  const [creating, setCreating] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const offers = data?.data ?? [];
  return (
    <Card title="Special vendor offers" action={<Button size="sm" onClick={() => setCreating(true)}><Gift className="h-4 w-4" />New offer</Button>}>
      <p className="mb-4 text-sm text-[#64748b]">Custom prices, discounts, temporary free plans or free features for one vendor. Free access never becomes a charge: when an offer ends, the vendor is notified and nothing is billed without a confirmed payment.</p>
      <div className="mb-3 flex flex-wrap gap-1">
        {["", "ACTIVE", "PAUSED", "EXPIRED", "REVOKED"].map((s) => <button key={s} onClick={() => setStatus(s)} className={cx("rounded-lg px-3 py-1.5 text-sm font-medium", status === s ? "bg-[#ede9fe] text-[#5b21b6]" : "text-[#64748b] hover:bg-[#f5f3ff]")}>{s ? s.toLowerCase() : "all"}</button>)}
      </div>
      {msg && <div className="mb-3"><Notice tone="green">{msg}</Notice></div>}
      {isLoading ? <Skeleton /> : !offers.length ? <EmptyState icon={<Gift className="h-5 w-5" />} title="No offers" body="Create one for a vendor you want to reward or win back." /> : <OffersTable offers={offers} />}
      {creating && <OfferModal onClose={() => setCreating(false)} onDone={(t) => { setCreating(false); setMsg(t); }} />}
    </Card>
  );
}

function OffersTable({ offers, compact }: { offers: SubOffer[]; compact?: boolean }) {
  const [act, { isLoading }] = useSubsOfferActionMutation();
  const [pending, setPending] = useState<{ id: string; action: "pause" | "resume" | "revoke" } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  return (
    <div>
      {compact && <h3 className="mb-2 text-sm font-semibold text-[#1e1b4b]">Offers</h3>}
      {err && <div className="mb-2"><Notice tone="red">{err}</Notice></div>}
      <div className="overflow-x-auto">
        <table className={tableCls}>
          <thead><tr className="border-b border-[#ede9fe]">{!compact && <th className={thCls}>Vendor</th>}<th className={thCls}>Offer</th><th className={thCls}>On</th><th className={thCls}>Valid</th><th className={thCls}>After it ends</th><th className={thCls}>Status</th><th className={thCls} /></tr></thead>
          <tbody>
            {offers.map((o) => (
              <tr key={o.id} className="border-b border-[#f5f3ff] last:border-0">
                {!compact && <td className={tdCls}>{o.vendor?.storeName ?? "—"}</td>}
                <td className={tdCls}><span className="font-medium">{offerValueText(o.kind, o.value)}</span><span className="block text-xs text-[#94a3b8]">{OFFER_KIND_LABEL[o.kind]}</span></td>
                <td className={tdCls}>{o.feature?.name ?? o.package?.name ?? "—"}{o.cycle && <span className="block text-xs text-[#94a3b8]">{o.cycle.name} only</span>}</td>
                <td className={tdCls}>{dateText(o.startsAt)} – {dateText(o.endsAt)}</td>
                <td className={`${tdCls} text-xs`}>{AFTER_EXPIRY_LABEL[o.afterExpiry]}</td>
                <td className={tdCls}><Badge tone={STATE_TONE[o.status]}>{o.status.toLowerCase()}</Badge></td>
                <td className={`${tdCls} whitespace-nowrap text-right`}>
                  {o.status === "ACTIVE" && <Button size="sm" variant="ghost" onClick={() => setPending({ id: o.id, action: "pause" })}><Pause className="h-3.5 w-3.5" /></Button>}
                  {o.status === "PAUSED" && <Button size="sm" variant="ghost" onClick={() => setPending({ id: o.id, action: "resume" })}><Play className="h-3.5 w-3.5" /></Button>}
                  {(o.status === "ACTIVE" || o.status === "PAUSED") && <Button size="sm" variant="ghost" onClick={() => setPending({ id: o.id, action: "revoke" })}><XCircle className="h-3.5 w-3.5 text-rose-500" /></Button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ReasonDialog open={!!pending} title={pending ? `${pending.action[0].toUpperCase()}${pending.action.slice(1)} offer` : ""} danger={pending?.action === "revoke"} loading={isLoading} onClose={() => setPending(null)}
        confirmLabel={pending?.action === "revoke" ? "Revoke" : "Confirm"}
        onConfirm={async (reason) => { setErr(null); try { await act({ ...pending!, reason }).unwrap(); setPending(null); } catch (e) { setErr(apiError(e)); setPending(null); } }} />
    </div>
  );
}

function OfferModal({ vendor, onClose, onDone }: { vendor?: { id: string; storeName: string }; onClose: () => void; onDone: (msg: string) => void }) {
  const [create, { isLoading }] = useSubsCreateOfferMutation();
  const { data: plans } = useSubsPlansQuery();
  const { data: feats } = useSubsFeaturesQuery();
  const { data: cycles } = useSubsCyclesQuery();
  const [v, setV] = useState<{ id: string; storeName: string } | null>(vendor ?? null);
  const [f, setF] = useState({ kind: "PERCENT_DISCOUNT", packageId: "", cycleId: "", featureId: "", value: "", startsAt: "", endsAt: "", afterExpiry: "MANUAL_RENEWAL", afterExpiryPackageId: "", note: "" });
  const [err, setErr] = useState<string | null>(null);
  const sellable = (plans?.data ?? []).filter((p) => p.status !== "ARCHIVED");
  const published = (plans?.data ?? []).filter((p) => p.status === "PUBLISHED");
  const needsValue = ["PRICE_OVERRIDE", "PERCENT_DISCOUNT", "FIXED_DISCOUNT"].includes(f.kind);
  const isFeature = f.kind === "FREE_FEATURE";
  const submit = async () => {
    setErr(null);
    try {
      await create({
        vendorId: v?.id, kind: f.kind, packageId: isFeature ? undefined : f.packageId, cycleId: isFeature ? undefined : f.cycleId || undefined, featureId: isFeature ? f.featureId : undefined,
        value: needsValue ? f.value : undefined, startsAt: f.startsAt ? new Date(`${f.startsAt}T00:00:00+06:00`).toISOString() : undefined, endsAt: new Date(`${f.endsAt}T23:59:59+06:00`).toISOString(),
        afterExpiry: f.afterExpiry, afterExpiryPackageId: f.afterExpiry === "SWITCH_PLAN" ? f.afterExpiryPackageId : undefined, note: f.note || undefined,
      }).unwrap();
      onDone(`Offer created for ${v?.storeName}. The vendor has been notified.`);
    } catch (e) {
      setErr(apiError(e));
    }
  };
  return (
    <Modal open wide title="New special offer" onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button loading={isLoading} disabled={!v || !f.endsAt || (isFeature ? !f.featureId : !f.packageId) || (needsValue && !f.value)} onClick={submit}>Create offer</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><Field label="Vendor">{vendor ? <div className="flex h-10 items-center rounded-xl bg-[#faf9ff] px-3 text-sm">{vendor.storeName}</div> : <VendorPicker value={v} onChange={setV} />}</Field></div>
        <Field label="Offer type"><select className={inputCls} value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value, afterExpiry: e.target.value === "FREE_FEATURE" ? "DISABLE_FEATURE" : f.afterExpiry === "DISABLE_FEATURE" ? "MANUAL_RENEWAL" : f.afterExpiry })}>{Object.entries(OFFER_KIND_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Field>
        {isFeature ? (
          <Field label="Feature"><select className={inputCls} value={f.featureId} onChange={(e) => setF({ ...f, featureId: e.target.value })}><option value="">Choose a feature</option>{(feats?.data ?? []).filter((x) => x.isActive).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></Field>
        ) : (
          <Field label="Plan"><select className={inputCls} value={f.packageId} onChange={(e) => setF({ ...f, packageId: e.target.value })}><option value="">Choose a plan</option>{sellable.map((p) => <option key={p.id} value={p.id}>{p.name}{p.visibility === "HIDDEN" ? " (hidden)" : ""}{p.status === "DRAFT" ? " (draft)" : ""}</option>)}</select></Field>
        )}
        {!isFeature && f.kind !== "FREE_PLAN" && <Field label="Billing cycle" hint="Leave empty for every cycle."><select className={inputCls} value={f.cycleId} onChange={(e) => setF({ ...f, cycleId: e.target.value })}><option value="">All cycles</option>{(cycles?.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>}
        {needsValue && <Field label={f.kind === "PERCENT_DISCOUNT" ? "Discount (%)" : f.kind === "PRICE_OVERRIDE" ? "Custom price (৳)" : "Discount (৳)"}><input inputMode="decimal" className={inputCls} value={f.value} onChange={(e) => setF({ ...f, value: e.target.value })} /></Field>}
        <Field label="Starts" hint="Empty = now"><input type="date" className={inputCls} value={f.startsAt} onChange={(e) => setF({ ...f, startsAt: e.target.value })} /></Field>
        <Field label="Ends"><input type="date" className={inputCls} value={f.endsAt} onChange={(e) => setF({ ...f, endsAt: e.target.value })} /></Field>
        <Field label="After the offer ends">
          <select className={inputCls} value={f.afterExpiry} onChange={(e) => setF({ ...f, afterExpiry: e.target.value })}>
            {Object.entries(AFTER_EXPIRY_LABEL).filter(([k]) => (isFeature ? k === "DISABLE_FEATURE" || k === "MANUAL_RENEWAL" : k !== "DISABLE_FEATURE")).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </Field>
        {f.afterExpiry === "SWITCH_PLAN" && <Field label="Plan to offer afterwards" hint="Opens a pending request; nothing is charged."><select className={inputCls} value={f.afterExpiryPackageId} onChange={(e) => setF({ ...f, afterExpiryPackageId: e.target.value })}><option value="">Choose a plan</option>{published.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>}
        <div className="sm:col-span-2"><Field label="Internal note"><textarea className={textareaCls} value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} /></Field></div>
      </div>
      {err && <div className="mt-4"><Notice tone="red">{err}</Notice></div>}
    </Modal>
  );
}

// ─── transactions ──────────────────────────────────────────────────────────

export function TransactionsSection() {
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const { data, isLoading } = useSubsTransactionsQuery({ status: status || undefined, page });
  const rows = data?.data.items ?? [];
  return (
    <Card title="Subscription payments">
      <div className="mb-3 flex flex-wrap gap-1">
        {["", "PENDING", "PAID", "CANCELLED", "FAILED", "REFUNDED"].map((s) => <button key={s} onClick={() => { setStatus(s); setPage(1); }} className={cx("rounded-lg px-3 py-1.5 text-sm font-medium", status === s ? "bg-[#ede9fe] text-[#5b21b6]" : "text-[#64748b] hover:bg-[#f5f3ff]")}>{s ? s.toLowerCase() : "all"}</button>)}
      </div>
      {isLoading ? <Skeleton rows={5} /> : !rows.length ? <EmptyState icon={<Receipt className="h-5 w-5" />} title="No payments" /> : (
        <>
          <PaymentsTable payments={rows} />
          <Pager page={page} total={data?.data.total ?? 0} pageSize={data?.data.pageSize ?? 25} onPage={setPage} />
        </>
      )}
    </Card>
  );
}

function PaymentsTable({ payments, compact }: { payments: SubPayment[]; compact?: boolean }) {
  const [confirm, { isLoading: confirming }] = useSubsConfirmPaymentMutation();
  const [setStatus, { isLoading: updating }] = useSubsPaymentStatusMutation();
  const [confirmFor, setConfirmFor] = useState<SubPayment | null>(null);
  const [ref, setRef] = useState("");
  const [statusFor, setStatusFor] = useState<{ p: SubPayment; status: "CANCELLED" | "REFUNDED" } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  if (!payments.length) return compact ? <p className="text-sm text-[#64748b]">No payments yet.</p> : null;
  return (
    <div>
      {compact && <h3 className="mb-2 text-sm font-semibold text-[#1e1b4b]">Payments</h3>}
      {err && <div className="mb-2"><Notice tone="red">{err}</Notice></div>}
      <div className="overflow-x-auto">
        <table className={tableCls}>
          <thead><tr className="border-b border-[#ede9fe]"><th className={thCls}>Date</th>{!compact && <th className={thCls}>Vendor</th>}<th className={thCls}>Plan</th><th className={`${thCls} text-right`}>Amount</th><th className={thCls}>Method / ref</th><th className={thCls}>Period</th><th className={thCls}>Status</th><th className={thCls} /></tr></thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id} className="border-b border-[#f5f3ff] last:border-0">
                <td className={tdCls}>{dateText(p.createdAt)}</td>
                {!compact && <td className={tdCls}>{p.vendor?.storeName ?? "—"}</td>}
                <td className={tdCls}>{p.package?.name ?? "—"}<span className="block text-xs text-[#94a3b8]">{p.cycle?.name}</span></td>
                <td className={`${tdCls} text-right font-medium`}>{taka(p.amount)}{p.listAmount !== p.amount && <s className="block text-xs font-normal text-[#94a3b8]">{taka(p.listAmount)}</s>}</td>
                <td className={tdCls}>{p.method.replace("_", " ").toLowerCase()}<span className="block max-w-[160px] truncate text-xs text-[#94a3b8]">{p.reference ?? "—"}</span></td>
                <td className={`${tdCls} text-xs`}>{p.periodStart ? `${dateText(p.periodStart)} – ${dateText(p.periodEnd)}` : "—"}</td>
                <td className={tdCls}><Badge tone={STATE_TONE[p.status]}>{p.status.toLowerCase()}</Badge></td>
                <td className={`${tdCls} whitespace-nowrap text-right`}>
                  {p.status === "PENDING" && <><Button size="sm" variant="secondary" onClick={() => { setRef(p.reference ?? ""); setConfirmFor(p); }}>Confirm</Button><Button size="sm" variant="ghost" onClick={() => setStatusFor({ p, status: "CANCELLED" })}><X className="h-3.5 w-3.5" /></Button></>}
                  {p.status === "PAID" && <Button size="sm" variant="ghost" onClick={() => setStatusFor({ p, status: "REFUNDED" })} title="Mark refunded"><RotateCcw className="h-3.5 w-3.5" /></Button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={!!confirmFor} title="Confirm payment received" onClose={() => setConfirmFor(null)} footer={<><Button variant="secondary" onClick={() => setConfirmFor(null)}>Back</Button>
        <Button loading={confirming} disabled={ref.trim().length < 3} onClick={async () => { setErr(null); try { await confirm({ id: confirmFor!.id, reference: ref.trim() }).unwrap(); setConfirmFor(null); } catch (e) { setErr(apiError(e)); setConfirmFor(null); } }}>Confirm and activate</Button></>}>
        {confirmFor && <p className="mb-3 text-sm text-[#475569]">{confirmFor.vendor?.storeName ?? "The vendor"} asked for {confirmFor.package?.name} ({confirmFor.cycle?.name}) at <b>{taka(confirmFor.amount)}</b>. Confirm only after the money has arrived.</p>}
        <Field label="Transaction reference"><input className={inputCls} value={ref} onChange={(e) => setRef(e.target.value)} /></Field>
      </Modal>
      <ReasonDialog open={!!statusFor} title={statusFor?.status === "REFUNDED" ? "Mark payment refunded" : "Cancel payment request"} danger loading={updating}
        body={statusFor?.status === "REFUNDED" ? "This only records the refund you made. The subscription is not changed: suspend or cancel it separately if needed." : "The vendor's request is closed. Nothing was charged."}
        onClose={() => setStatusFor(null)} confirmLabel={statusFor?.status === "REFUNDED" ? "Mark refunded" : "Cancel request"}
        onConfirm={async (reason) => { setErr(null); try { await setStatus({ id: statusFor!.p.id, status: statusFor!.status, reason }).unwrap(); setStatusFor(null); } catch (e) { setErr(apiError(e)); setStatusFor(null); } }} />
    </div>
  );
}
