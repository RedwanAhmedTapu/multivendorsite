"use client";

// Admin › Payouts. Balances come from the ledger (VendorPayable). Batches go
// DRAFT → APPROVED, and each vendor item is marked paid with the bank
// reference after the transfer is made outside FinixMart (no payout provider
// is connected). Marking paid posts the ledger voucher once.

import { useEffect, useMemo, useState } from "react";
import { CalendarClock, CheckCircle2, Clock, FileText, Hand, Lock, Pause, Play, Plus, ShieldAlert, Unlock, Wallet, XCircle } from "lucide-react";
import {
  apiError,
  usePayoutAuditQuery,
  usePayoutBatchActionMutation,
  usePayoutBatchQuery,
  usePayoutBatchesQuery,
  usePayoutCreateBatchMutation,
  usePayoutItemActionMutation,
  usePayoutItemsQuery,
  usePayoutOverviewQuery,
  usePayoutPolicyQuery,
  usePayoutPreviewQuery,
  usePayoutRulesQuery,
  usePayoutSetPolicyMutation,
  usePayoutSetRuleMutation,
  usePayoutVendorStateMutation,
  type PayoutItem,
  type PayoutPolicy,
  type PayoutRule,
  type PreviewRow,
} from "@/features/billingApi";
import { CYCLE_LABEL, REASON_LABEL, STATE_TONE, WEEKDAYS, dateText, dateTimeText, taka } from "@/lib/billing/format";
import { Badge, Button, Card, EmptyState, Field, Modal, MonthlyBars, Notice, ReasonDialog, Skeleton, StatCard, Toggle, cx, inputCls, tableCls, tdCls, thCls } from "@/components/billing/ui";
import { VendorPicker } from "@/components/admin-subscriptions/VendorSections";

export function scheduleText(p: Pick<PayoutPolicy, "cycle" | "weekday" | "monthDays" | "customIntervalDays">): string {
  switch (p.cycle) {
    case "WEEKLY": return `Every ${WEEKDAYS[p.weekday]}`;
    case "BIWEEKLY": return `Every other ${WEEKDAYS[p.weekday]}`;
    case "MONTHLY": return `Monthly on day ${p.monthDays.join(", ")}`;
    case "QUARTERLY": return `Quarterly on day ${p.monthDays[0] ?? 1}`;
    case "CUSTOM": return `Every ${p.customIntervalDays} days`;
  }
}

// ─── overview + reports ─────────────────────────────────────────────────────

export function PayoutOverviewSection({ go }: { go: (t: string) => void }) {
  const { data, isLoading, isError } = usePayoutOverviewQuery();
  if (isLoading) return <Skeleton rows={6} />;
  if (isError || !data) return <Notice tone="red">Couldn&apos;t load payouts. Is the payout migration applied?</Notice>;
  const o = data.data;
  return (
    <div className="space-y-5">
      {o.policy.holdAll && <Notice tone="amber"><Lock className="mr-1 inline h-4 w-4" />All payouts are on a platform-wide hold (Settings).</Notice>}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard label="Payable now" value={taka(o.totals.payableNow)} hint={`${o.totals.payableVendors} vendor${o.totals.payableVendors === 1 ? "" : "s"} eligible`} icon={<Wallet className="h-5 w-5" />} accent="violet" />
        <StatCard label="Not yet payable" value={taka(o.totals.pendingInWindow)} hint="Inside the settlement / refund window" icon={<Clock className="h-5 w-5" />} accent="amber" />
        <StatCard label="In open batches" value={taka(o.totals.inOpenBatches)} hint={`${o.totals.openBatches} batch${o.totals.openBatches === 1 ? "" : "es"} · ${o.totals.heldItems} held`} icon={<FileText className="h-5 w-5" />} accent="indigo" />
        <StatCard label="Next payout day" value={dateText(o.nextPayoutDate)} hint={scheduleText(o.policy)} icon={<CalendarClock className="h-5 w-5" />} accent="blue" />
      </div>
      <div className="grid gap-5 xl:grid-cols-5">
        <Card title="Paid to vendors (last 12 months)" className="xl:col-span-3" action={<span className="text-sm font-semibold text-[#1e1b4b]">{taka(o.totals.paid12m)}</span>}>
          <MonthlyBars label="Vendor payouts by month" data={o.paidByMonth.map((m) => ({ month: m.month, value: Number(m.paid) }))} />
        </Card>
        <Card title="Owed to vendors" className="xl:col-span-2">
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-[#64748b]">Total ledger balance</dt><dd className="font-semibold">{taka(o.totals.balance)}</dd></div>
            <div className="flex justify-between"><dt className="text-[#64748b]">Available (after window and open batches)</dt><dd className="font-semibold">{taka(o.totals.available)}</dd></div>
            <div className="flex justify-between"><dt className="text-[#64748b]">Vendors with a balance</dt><dd className="font-semibold">{o.totals.vendors}</dd></div>
          </dl>
          <div className="mt-4 flex flex-wrap gap-2"><Button size="sm" onClick={() => go("pending")}>Review pending payouts</Button><Button size="sm" variant="secondary" onClick={() => go("batches")}>Open batches</Button></div>
        </Card>
      </div>
    </div>
  );
}

export function PayoutReportsSection() {
  const { data, isLoading } = usePayoutOverviewQuery();
  if (isLoading || !data) return <Skeleton rows={5} />;
  return (
    <Card title="Payout report">
      <div className="overflow-x-auto">
        <table className={tableCls}>
          <thead><tr className="border-b border-[#ede9fe]"><th className={thCls}>Month</th><th className={`${thCls} text-right`}>Paid to vendors</th></tr></thead>
          <tbody>{[...data.data.paidByMonth].reverse().map((m) => <tr key={m.month} className="border-b border-[#f5f3ff] last:border-0"><td className={tdCls}>{m.month}</td><td className={`${tdCls} text-right`}>{taka(m.paid)}</td></tr>)}</tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-[#64748b]">Counts payout items marked paid, by payment date (Asia/Dhaka). Subscription revenue is reported under Subscriptions; the two are never mixed.</p>
    </Card>
  );
}

// ─── pending payouts + earnings ─────────────────────────────────────────────

function ReasonBadges({ r }: { r: PreviewRow }) {
  if (r.eligibility.payable) return <Badge tone="green">Eligible</Badge>;
  return <span className="flex flex-wrap gap-1">{r.eligibility.reasons.map((x) => <Badge key={x} tone={x === "NOTHING_DUE" || x === "BELOW_THRESHOLD" ? "slate" : "amber"}>{REASON_LABEL[x] ?? x}</Badge>)}</span>;
}

export function PendingSection({ earnings = false }: { earnings?: boolean }) {
  const [onlyDue, setOnlyDue] = useState(!earnings);
  const { data, isLoading } = usePayoutPreviewQuery({ onlyDue });
  const [create, { isLoading: creating }] = usePayoutCreateBatchMutation();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [msg, setMsg] = useState<{ tone: "green" | "red"; text: string } | null>(null);
  const rows = useMemo(() => (data?.data.rows ?? []).filter((r) => earnings || r.eligibility.payable || !onlyDue), [data, earnings, onlyDue]);
  const payable = rows.filter((r) => r.eligibility.payable);
  const total = payable.filter((r) => selected.has(r.vendorId)).reduce((s, r) => s + Number(r.eligibility.amount), 0);
  useEffect(() => { setSelected(new Set(payable.map((r) => r.vendorId))); }, [data]); // eslint-disable-line react-hooks/exhaustive-deps
  const draft = async () => {
    setMsg(null);
    try {
      const res = await create({ vendorIds: [...selected], includeNotDue: !onlyDue }).unwrap();
      setMsg({ tone: "green", text: `Draft batch ${res.data.batchNumber} created for ${res.data.vendorCount} vendor(s), ${taka(res.data.totalAmount)}. Approve it under Batches.` });
    } catch (e) {
      setMsg({ tone: "red", text: apiError(e) });
    }
  };
  return (
    <Card title={earnings ? "Vendor earnings (ledger balances)" : "Pending payouts"}
      action={<Toggle checked={onlyDue} onChange={setOnlyDue} label={earnings ? "Due today only" : "Only vendors due today"} />}>
      {!earnings && <p className="mb-4 text-sm text-[#64748b]">Amounts come from each vendor&apos;s ledger balance minus recent credits still inside the settlement / refund window and minus anything already in an open batch.</p>}
      {msg && <div className="mb-3"><Notice tone={msg.tone}>{msg.text}</Notice></div>}
      {isLoading ? <Skeleton rows={5} /> : !rows.length ? <EmptyState icon={<Wallet className="h-5 w-5" />} title={onlyDue ? "No vendor is due today" : "No vendor has a balance"} body={onlyDue ? "Turn off the filter to see every vendor with a balance." : undefined} /> : (
        <>
          <div className="overflow-x-auto">
            <table className={tableCls}>
              <thead><tr className="border-b border-[#ede9fe]">{!earnings && <th className={thCls} />}<th className={thCls}>Vendor</th><th className={`${thCls} text-right`}>Balance</th><th className={`${thCls} text-right`}>In window</th><th className={`${thCls} text-right`}>In batches</th><th className={`${thCls} text-right`}>Available</th><th className={thCls}>Schedule</th><th className={thCls}>Status</th></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.vendorId} className="border-b border-[#f5f3ff] last:border-0">
                    {!earnings && <td className={tdCls}><input type="checkbox" aria-label={`Include ${r.storeName}`} disabled={!r.eligibility.payable} checked={selected.has(r.vendorId)} onChange={(e) => { const n = new Set(selected); if (e.target.checked) n.add(r.vendorId); else n.delete(r.vendorId); setSelected(n); }} className="h-4 w-4 accent-[#7c3aed]" /></td>}
                    <td className={tdCls}><span className="font-medium">{r.storeName}</span><span className="block text-xs text-[#94a3b8]">Paid so far {taka(r.totalPaid)}</span></td>
                    <td className={`${tdCls} text-right`}>{taka(r.eligibility.balance)}</td>
                    <td className={`${tdCls} text-right text-[#64748b]`}>{taka(r.eligibility.pendingInWindow)}</td>
                    <td className={`${tdCls} text-right text-[#64748b]`}>{taka(r.eligibility.inOpenBatches)}</td>
                    <td className={`${tdCls} text-right font-semibold`}>{taka(r.eligibility.available)}</td>
                    <td className={`${tdCls} text-xs`}>{scheduleText(r.rule)}{r.rule.overridden.length > 0 && <Badge tone="violet">custom</Badge>}<span className="block text-[#94a3b8]">next {dateText(r.nextPayoutDate)}</span></td>
                    <td className={tdCls}><ReasonBadges r={r} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!earnings && (
            <div className="mt-4 flex flex-col gap-2 border-t border-[#f5f3ff] pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-[#475569]">{selected.size} vendor{selected.size === 1 ? "" : "s"} selected · <b>{taka(total)}</b></p>
              <Button onClick={draft} loading={creating} disabled={!selected.size}><Plus className="h-4 w-4" />Create draft batch</Button>
            </div>
          )}
        </>
      )}
    </Card>
  );
}

// ─── batches ────────────────────────────────────────────────────────────────

export function BatchesSection() {
  const [status, setStatus] = useState("");
  const { data, isLoading } = usePayoutBatchesQuery(status ? { status } : undefined);
  const [open, setOpen] = useState<string | null>(null);
  const batches = data?.data ?? [];
  return (
    <Card title="Payout batches">
      <div className="mb-3 flex flex-wrap gap-1">
        {["", "DRAFT", "APPROVED", "PARTIALLY_PAID", "PAID", "CANCELLED"].map((s) => <button key={s} onClick={() => setStatus(s)} className={cx("rounded-lg px-3 py-1.5 text-sm font-medium", status === s ? "bg-[#ede9fe] text-[#5b21b6]" : "text-[#64748b] hover:bg-[#f5f3ff]")}>{s ? s.replace("_", " ").toLowerCase() : "all"}</button>)}
      </div>
      {isLoading ? <Skeleton rows={4} /> : !batches.length ? <EmptyState icon={<FileText className="h-5 w-5" />} title="No batches" body="Draft one from Pending payouts." /> : (
        <div className="overflow-x-auto">
          <table className={tableCls}>
            <thead><tr className="border-b border-[#ede9fe]"><th className={thCls}>Batch</th><th className={thCls}>Payout day</th><th className={thCls}>Vendors</th><th className={`${thCls} text-right`}>Total</th><th className={thCls}>Status</th><th className={thCls} /></tr></thead>
            <tbody>
              {batches.map((b) => (
                <tr key={b.id} className="border-b border-[#f5f3ff] last:border-0">
                  <td className={tdCls}><span className="font-medium">{b.batchNumber}</span>{!b.createdById && <span className="ml-2"><Badge tone="blue">auto</Badge></span>}</td>
                  <td className={tdCls}>{dateText(b.scheduledFor)}</td>
                  <td className={tdCls}>{b.vendorCount}</td>
                  <td className={`${tdCls} text-right font-medium`}>{taka(b.totalAmount)}</td>
                  <td className={tdCls}><Badge tone={STATE_TONE[b.status]}>{b.status.replace("_", " ").toLowerCase()}</Badge></td>
                  <td className={`${tdCls} text-right`}><Button size="sm" variant="secondary" onClick={() => setOpen(b.id)}>Open</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {open && <BatchModal id={open} onClose={() => setOpen(null)} />}
    </Card>
  );
}

function BatchModal({ id, onClose }: { id: string; onClose: () => void }) {
  const { data, isLoading } = usePayoutBatchQuery(id);
  const [batchAct, { isLoading: acting }] = usePayoutBatchActionMutation();
  const [itemAct, { isLoading: itemBusy }] = usePayoutItemActionMutation();
  const [msg, setMsg] = useState<{ tone: "green" | "red" | "amber"; text: string } | null>(null);
  const [cancelBatch, setCancelBatch] = useState(false);
  const [itemReason, setItemReason] = useState<{ item: PayoutItem; action: "hold" | "cancel" } | null>(null);
  const [paying, setPaying] = useState<PayoutItem | null>(null);
  const b = data?.data;
  const run = async (fn: () => Promise<unknown>, ok: string) => {
    setMsg(null);
    try { const r = (await fn()) as { data?: { held?: { vendorId: string; reason: string }[] } } | undefined; const held = r?.data?.held; setMsg(held?.length ? { tone: "amber", text: `${ok} ${held.length} item(s) were put on hold because the vendor's balance or status changed.` } : { tone: "green", text: ok }); } catch (e) { setMsg({ tone: "red", text: apiError(e) }); }
  };
  return (
    <Modal open wide title={b ? `Batch ${b.batchNumber}` : "Batch"} onClose={onClose}>
      {isLoading || !b ? <Skeleton rows={5} /> : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#faf9ff] p-4">
            <div>
              <p className="text-sm text-[#64748b]">Payout day {dateText(b.scheduledFor)} · {b.vendorCount} vendor(s)</p>
              <p className="text-2xl font-bold text-[#1e1b4b]">{taka(b.totalAmount)}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={STATE_TONE[b.status]}>{b.status.replace("_", " ").toLowerCase()}</Badge>
              {b.status === "DRAFT" && <Button size="sm" loading={acting} onClick={() => run(() => batchAct({ id, action: "approve" }).unwrap(), "Batch approved. Make the transfers, then mark each vendor paid.")}><CheckCircle2 className="h-3.5 w-3.5" />Approve</Button>}
              {(b.status === "DRAFT" || b.status === "APPROVED") && <Button size="sm" variant="danger" onClick={() => setCancelBatch(true)}><XCircle className="h-3.5 w-3.5" />Cancel batch</Button>}
            </div>
          </div>
          {b.status === "APPROVED" || b.status === "PARTIALLY_PAID" ? <Notice tone="violet">FinixMart doesn&apos;t send money automatically. Transfer each amount from the bank, then press <b>Mark paid</b> with the bank reference. That posts the payout to the ledger once.</Notice> : null}
          {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
          <div className="overflow-x-auto">
            <table className={tableCls}>
              <thead><tr className="border-b border-[#ede9fe]"><th className={thCls}>Vendor</th><th className={`${thCls} text-right`}>Amount</th><th className={thCls}>Status</th><th className={thCls}>Reference</th><th className={thCls} /></tr></thead>
              <tbody>
                {(b.items ?? []).map((i) => (
                  <tr key={i.id} className="border-b border-[#f5f3ff] last:border-0">
                    <td className={tdCls}>{i.vendor?.storeName ?? i.vendorId}<span className="block text-xs text-[#94a3b8]">balance at draft {taka(i.calculation?.balance)}</span></td>
                    <td className={`${tdCls} text-right font-semibold`}>{taka(i.amount)}</td>
                    <td className={tdCls}><Badge tone={STATE_TONE[i.status]}>{i.status.toLowerCase()}</Badge>{i.heldReason && <span className="block max-w-[200px] text-xs text-[#94a3b8]">{i.heldReason}</span>}</td>
                    <td className={`${tdCls} text-xs`}>{i.reference ? <>{i.reference}<span className="block text-[#94a3b8]">{dateText(i.paidAt)}</span></> : "—"}</td>
                    <td className={`${tdCls} whitespace-nowrap text-right`}>
                      {i.status === "APPROVED" && <Button size="sm" onClick={() => setPaying(i)}>Mark paid</Button>}
                      {(i.status === "PENDING" || i.status === "APPROVED") && <Button size="sm" variant="ghost" title="Hold" onClick={() => setItemReason({ item: i, action: "hold" })}><Hand className="h-3.5 w-3.5" /></Button>}
                      {i.status === "HELD" && <Button size="sm" variant="ghost" title="Release" loading={itemBusy} onClick={() => run(() => itemAct({ id: i.id, action: "release" }).unwrap(), "Item released.")}><Play className="h-3.5 w-3.5" /></Button>}
                      {["PENDING", "APPROVED", "HELD"].includes(i.status) && <Button size="sm" variant="ghost" title="Cancel item" onClick={() => setItemReason({ item: i, action: "cancel" })}><XCircle className="h-3.5 w-3.5 text-rose-500" /></Button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <ReasonDialog open={cancelBatch} title="Cancel this batch" body="Unpaid items are cancelled; vendors stay eligible for a new batch. Nothing is posted to the ledger." danger loading={acting}
        onClose={() => setCancelBatch(false)} confirmLabel="Cancel batch" onConfirm={(reason) => { setCancelBatch(false); run(() => batchAct({ id, action: "cancel", reason }).unwrap(), "Batch cancelled."); }} />
      <ReasonDialog open={!!itemReason} title={itemReason?.action === "hold" ? "Hold this payout" : "Cancel this payout"} danger={itemReason?.action === "cancel"} loading={itemBusy}
        onClose={() => setItemReason(null)} confirmLabel={itemReason?.action === "hold" ? "Hold" : "Cancel item"}
        onConfirm={(reason) => { const it = itemReason!; setItemReason(null); run(() => itemAct({ id: it.item.id, action: it.action, body: { reason } }).unwrap(), it.action === "hold" ? "Item on hold." : "Item cancelled."); }} />
      {paying && <MarkPaidModal item={paying} busy={itemBusy} onClose={() => setPaying(null)} onSubmit={(body) => { const it = paying; setPaying(null); run(() => itemAct({ id: it.id, action: "mark-paid", body }).unwrap(), `${it.vendor?.storeName ?? "Vendor"} marked paid; the payout is posted to the ledger.`); }} />}
    </Modal>
  );
}

function MarkPaidModal({ item, busy, onClose, onSubmit }: { item: PayoutItem; busy: boolean; onClose: () => void; onSubmit: (b: Record<string, unknown>) => void }) {
  const [reference, setReference] = useState("");
  const [method, setMethod] = useState("BANK_TRANSFER");
  const [paidAt, setPaidAt] = useState("");
  const [sure, setSure] = useState(false);
  return (
    <Modal open title={`Mark ${taka(item.amount)} paid`} onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Back</Button>
      <Button loading={busy} disabled={reference.trim().length < 3 || !sure} onClick={() => onSubmit({ reference: reference.trim(), method, paidAt: paidAt ? new Date(`${paidAt}T12:00:00+06:00`).toISOString() : undefined })}>Mark paid</Button></>}>
      <div className="space-y-4">
        <p className="text-sm text-[#475569]">Paying <b>{item.vendor?.storeName}</b>. Enter the reference of the transfer you already made.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Method"><select className={inputCls} value={method} onChange={(e) => setMethod(e.target.value)}>{["BANK_TRANSFER", "BKASH", "NAGAD", "ROCKET", "CHEQUE", "OTHER"].map((m) => <option key={m} value={m}>{m.replace("_", " ").toLowerCase()}</option>)}</select></Field>
          <Field label="Paid on" hint="Empty = today"><input type="date" className={inputCls} value={paidAt} onChange={(e) => setPaidAt(e.target.value)} /></Field>
          <div className="sm:col-span-2"><Field label="Transfer reference"><input className={inputCls} value={reference} onChange={(e) => setReference(e.target.value)} /></Field></div>
        </div>
        <label className="flex items-start gap-2 text-sm text-[#334155]"><input type="checkbox" className="mt-0.5 h-4 w-4 accent-[#7c3aed]" checked={sure} onChange={(e) => setSure(e.target.checked)} />I confirm {taka(item.amount)} has left FinixMart&apos;s bank account for this vendor.</label>
      </div>
    </Modal>
  );
}

// ─── transactions ──────────────────────────────────────────────────────────

export function PayoutTransactionsSection() {
  const [status, setStatus] = useState("PAID");
  const [page, setPage] = useState(1);
  const { data, isLoading } = usePayoutItemsQuery({ status: status || undefined, page });
  const items = data?.data.items ?? [];
  const pages = Math.max(1, Math.ceil((data?.data.total ?? 0) / (data?.data.pageSize ?? 25)));
  return (
    <Card title="Payout transactions">
      <div className="mb-3 flex flex-wrap gap-1">
        {["PAID", "APPROVED", "PENDING", "HELD", "CANCELLED", ""].map((s) => <button key={s} onClick={() => { setStatus(s); setPage(1); }} className={cx("rounded-lg px-3 py-1.5 text-sm font-medium", status === s ? "bg-[#ede9fe] text-[#5b21b6]" : "text-[#64748b] hover:bg-[#f5f3ff]")}>{s ? s.toLowerCase() : "all"}</button>)}
      </div>
      {isLoading ? <Skeleton rows={5} /> : !items.length ? <EmptyState icon={<Wallet className="h-5 w-5" />} title="Nothing here" /> : (
        <>
          <div className="overflow-x-auto">
            <table className={tableCls}>
              <thead><tr className="border-b border-[#ede9fe]"><th className={thCls}>Vendor</th><th className={thCls}>Batch</th><th className={`${thCls} text-right`}>Amount</th><th className={thCls}>Status</th><th className={thCls}>Paid</th><th className={thCls}>Reference</th></tr></thead>
              <tbody>
                {items.map((i) => (
                  <tr key={i.id} className="border-b border-[#f5f3ff] last:border-0">
                    <td className={tdCls}>{i.vendor?.storeName}</td>
                    <td className={tdCls}>{i.batch?.batchNumber}</td>
                    <td className={`${tdCls} text-right font-medium`}>{taka(i.amount)}</td>
                    <td className={tdCls}><Badge tone={STATE_TONE[i.status]}>{i.status.toLowerCase()}</Badge></td>
                    <td className={tdCls}>{dateText(i.paidAt)}</td>
                    <td className={`${tdCls} text-xs`}>{i.reference ?? "—"}{i.method && <span className="block text-[#94a3b8]">{i.method.replace("_", " ").toLowerCase()}</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pages > 1 && <div className="mt-3 flex justify-end gap-2"><Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button><span className="self-center text-sm text-[#64748b]">Page {page} of {pages}</span><Button size="sm" variant="secondary" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</Button></div>}
        </>
      )}
    </Card>
  );
}

// ─── vendor rules ──────────────────────────────────────────────────────────

export function RulesSection() {
  const { data, isLoading } = usePayoutRulesQuery();
  const [editing, setEditing] = useState<{ id: string; storeName: string } | null>(null);
  const [picking, setPicking] = useState(false);
  const [stateAct, { isLoading: busy }] = usePayoutVendorStateMutation();
  const [ask, setAsk] = useState<{ vendorId: string; action: "hold" | "pause" } | null>(null);
  const [msg, setMsg] = useState<{ tone: "green" | "red"; text: string } | null>(null);
  const rules = data?.data ?? [];
  const act = async (vendorId: string, action: "hold" | "release" | "pause" | "resume", reason?: string, until?: string) => {
    setMsg(null);
    try { await stateAct({ vendorId, action, reason, until }).unwrap(); setMsg({ tone: "green", text: "Saved." }); } catch (e) { setMsg({ tone: "red", text: apiError(e) }); }
  };
  return (
    <Card title="Vendor-specific rules" action={<Button size="sm" onClick={() => setPicking(true)}><Plus className="h-4 w-4" />Add vendor rule</Button>}>
      <p className="mb-4 text-sm text-[#64748b]">Give a vendor its own schedule, minimum or settlement delay, or hold / pause its payouts. Anything left empty follows the platform settings.</p>
      {msg && <div className="mb-3"><Notice tone={msg.tone}>{msg.text}</Notice></div>}
      {isLoading ? <Skeleton /> : !rules.length ? <EmptyState icon={<ShieldAlert className="h-5 w-5" />} title="Every vendor follows the platform schedule" /> : (
        <div className="overflow-x-auto">
          <table className={tableCls}>
            <thead><tr className="border-b border-[#ede9fe]"><th className={thCls}>Vendor</th><th className={thCls}>Schedule</th><th className={thCls}>Minimum</th><th className={thCls}>Delay</th><th className={thCls}>State</th><th className={thCls} /></tr></thead>
            <tbody>
              {rules.map((r) => {
                const held = r.holdUntil && new Date(r.holdUntil) > new Date();
                return (
                  <tr key={r.vendorId} className="border-b border-[#f5f3ff] last:border-0">
                    <td className={tdCls}>{r.vendor?.storeName}{r.note && <span className="block text-xs text-[#94a3b8]">{r.note}</span>}</td>
                    <td className={tdCls}>{r.cycle ? CYCLE_LABEL[r.cycle] : <span className="text-[#94a3b8]">Platform</span>}</td>
                    <td className={tdCls}>{r.minThreshold ? taka(r.minThreshold) : <span className="text-[#94a3b8]">Platform</span>}</td>
                    <td className={tdCls}>{r.settlementDelayDays ?? <span className="text-[#94a3b8]">Platform</span>}{r.settlementDelayDays !== null && " days"}</td>
                    <td className={tdCls}><span className="flex flex-wrap gap-1">{r.paused && <Badge tone="amber">Paused</Badge>}{held && <Badge tone="amber">Held until {dateText(r.holdUntil)}</Badge>}{!r.paused && !held && <Badge tone="green">Normal</Badge>}</span>{(r.paused || held) && r.holdReason && <span className="block text-xs text-[#94a3b8]">{r.holdReason}</span>}</td>
                    <td className={`${tdCls} whitespace-nowrap text-right`}>
                      <Button size="sm" variant="ghost" onClick={() => setEditing({ id: r.vendorId, storeName: r.vendor?.storeName ?? "" })}>Edit</Button>
                      {held ? <Button size="sm" variant="ghost" loading={busy} onClick={() => act(r.vendorId, "release")} title="Release hold"><Unlock className="h-3.5 w-3.5" /></Button> : <Button size="sm" variant="ghost" onClick={() => setAsk({ vendorId: r.vendorId, action: "hold" })} title="Hold"><Lock className="h-3.5 w-3.5" /></Button>}
                      {r.paused ? <Button size="sm" variant="ghost" loading={busy} onClick={() => act(r.vendorId, "resume")} title="Resume"><Play className="h-3.5 w-3.5" /></Button> : <Button size="sm" variant="ghost" onClick={() => setAsk({ vendorId: r.vendorId, action: "pause" })} title="Pause"><Pause className="h-3.5 w-3.5" /></Button>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {picking && <PickModal onClose={() => setPicking(false)} onPick={(v) => { setPicking(false); setEditing(v); }} />}
      {editing && <RuleModal vendor={editing} existing={rules.find((r) => r.vendorId === editing.id) ?? null} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); setMsg({ tone: "green", text: "Rule saved." }); }} />}
      <HoldDialog open={!!ask} action={ask?.action ?? "hold"} loading={busy} onClose={() => setAsk(null)} onConfirm={(reason, until) => { const a = ask!; setAsk(null); act(a.vendorId, a.action, reason, until); }} />
    </Card>
  );
}

function HoldDialog({ open, action, loading, onClose, onConfirm }: { open: boolean; action: "hold" | "pause"; loading: boolean; onClose: () => void; onConfirm: (reason: string, until?: string) => void }) {
  const [until, setUntil] = useState("");
  return (
    <ReasonDialog open={open} title={action === "hold" ? "Hold payouts" : "Pause payouts"} loading={loading} onClose={onClose} confirmLabel={action === "hold" ? "Hold" : "Pause"} danger
      body={action === "hold" ? "The vendor's balance stays untouched; it just isn't paid until the hold ends. The vendor sees “on hold”, not your reason." : "Payouts stop until you resume them. The balance is untouched."}
      extra={action === "hold" ? <div className="mb-3"><Field label="Hold until" hint="Empty = until you release it"><input type="date" className={inputCls} value={until} onChange={(e) => setUntil(e.target.value)} /></Field></div> : undefined}
      onConfirm={(reason) => onConfirm(reason, until ? new Date(`${until}T23:59:59+06:00`).toISOString() : undefined)} />
  );
}

function PickModal({ onClose, onPick }: { onClose: () => void; onPick: (v: { id: string; storeName: string }) => void }) {
  const [v, setV] = useState<{ id: string; storeName: string } | null>(null);
  return (
    <Modal open title="Choose a vendor" onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button disabled={!v} onClick={() => v && onPick(v)}>Continue</Button></>}>
      <Field label="Vendor"><VendorPicker value={v} onChange={setV} /></Field>
    </Modal>
  );
}

function RuleModal({ vendor, existing, onClose, onSaved }: { vendor: { id: string; storeName: string }; existing: PayoutRule | null; onClose: () => void; onSaved: () => void }) {
  const [save, { isLoading }] = usePayoutSetRuleMutation();
  const opt = (v: number | string | null | undefined) => (v === null || v === undefined ? "" : String(v));
  const [f, setF] = useState<Record<"cycle" | "weekday" | "monthDays" | "customIntervalDays" | "anchorDate" | "minThreshold" | "settlementDelayDays" | "note", string>>({
    cycle: existing?.cycle ?? "", weekday: opt(existing?.weekday), monthDays: (existing?.monthDays ?? []).join(", "), customIntervalDays: opt(existing?.customIntervalDays),
    anchorDate: existing?.anchorDate ? existing.anchorDate.slice(0, 10) : "", minThreshold: opt(existing?.minThreshold), settlementDelayDays: opt(existing?.settlementDelayDays), note: existing?.note ?? "",
  });
  const [err, setErr] = useState<string | null>(null);
  const submit = async () => {
    setErr(null);
    try {
      await save({
        vendorId: vendor.id, cycle: f.cycle || null, weekday: f.weekday === "" ? null : Number(f.weekday),
        monthDays: f.monthDays ? f.monthDays.split(",").map((x) => Number(x.trim())).filter((x) => x) : [],
        customIntervalDays: f.customIntervalDays === "" ? null : Number(f.customIntervalDays), anchorDate: f.anchorDate || null,
        minThreshold: f.minThreshold === "" ? null : f.minThreshold, settlementDelayDays: f.settlementDelayDays === "" ? null : Number(f.settlementDelayDays), note: f.note,
      }).unwrap();
      onSaved();
    } catch (e) {
      setErr(apiError(e));
    }
  };
  return (
    <Modal open title={`Payout rule: ${vendor.storeName}`} onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button loading={isLoading} onClick={submit}>Save rule</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Cycle"><select className={inputCls} value={f.cycle} onChange={(e) => setF({ ...f, cycle: e.target.value })}><option value="">Platform default</option>{Object.entries(CYCLE_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Field>
        {(f.cycle === "WEEKLY" || f.cycle === "BIWEEKLY") && <Field label="Weekday"><select className={inputCls} value={f.weekday} onChange={(e) => setF({ ...f, weekday: e.target.value })}><option value="">Platform default</option>{WEEKDAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}</select></Field>}
        {(f.cycle === "MONTHLY" || f.cycle === "QUARTERLY") && <Field label="Day(s) of month" hint="e.g. 1, 15 (31 = month end)"><input className={inputCls} value={f.monthDays} onChange={(e) => setF({ ...f, monthDays: e.target.value })} /></Field>}
        {f.cycle === "CUSTOM" && <Field label="Every N days"><input type="number" min={1} max={365} className={inputCls} value={f.customIntervalDays} onChange={(e) => setF({ ...f, customIntervalDays: e.target.value })} /></Field>}
        {(f.cycle === "CUSTOM" || f.cycle === "BIWEEKLY") && <Field label="Starting from"><input type="date" className={inputCls} value={f.anchorDate} onChange={(e) => setF({ ...f, anchorDate: e.target.value })} /></Field>}
        <Field label="Minimum payout (৳)" hint="Empty = platform default"><input inputMode="decimal" className={inputCls} value={f.minThreshold} onChange={(e) => setF({ ...f, minThreshold: e.target.value })} /></Field>
        <Field label="Settlement delay (days)" hint="Empty = platform default"><input type="number" min={0} max={365} className={inputCls} value={f.settlementDelayDays} onChange={(e) => setF({ ...f, settlementDelayDays: e.target.value })} /></Field>
        <div className="sm:col-span-2"><Field label="Internal note"><input className={inputCls} value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} /></Field></div>
      </div>
      {err && <div className="mt-4"><Notice tone="red">{err}</Notice></div>}
    </Modal>
  );
}

// ─── settings ──────────────────────────────────────────────────────────────

export function PayoutSettingsSection() {
  const { data, isLoading } = usePayoutPolicyQuery();
  const [save, { isLoading: saving }] = usePayoutSetPolicyMutation();
  const [p, setP] = useState<PayoutPolicy | null>(null);
  const [days, setDays] = useState("");
  const [msg, setMsg] = useState<{ tone: "green" | "red"; text: string } | null>(null);
  useEffect(() => { if (data?.data) { setP(data.data); setDays(data.data.monthDays.join(", ")); } }, [data]);
  if (isLoading || !p) return <Skeleton rows={5} />;
  const submit = async () => {
    setMsg(null);
    try {
      await save({ ...p, monthDays: days.split(",").map((x) => Number(x.trim())).filter((x) => x), customIntervalDays: p.cycle === "CUSTOM" ? p.customIntervalDays : p.customIntervalDays || null, anchorDate: p.anchorDate || null }).unwrap();
      setMsg({ tone: "green", text: "Payout settings saved." });
    } catch (e) {
      setMsg({ tone: "red", text: apiError(e) });
    }
  };
  return (
    <Card title="Payout cycle settings">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Field label="Payout cycle"><select className={inputCls} value={p.cycle} onChange={(e) => setP({ ...p, cycle: e.target.value as PayoutPolicy["cycle"] })}>{Object.entries(CYCLE_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Field>
        {(p.cycle === "WEEKLY" || p.cycle === "BIWEEKLY") && <Field label="Processing day"><select className={inputCls} value={p.weekday} onChange={(e) => setP({ ...p, weekday: Number(e.target.value) })}>{WEEKDAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}</select></Field>}
        {(p.cycle === "MONTHLY" || p.cycle === "QUARTERLY") && <Field label="Day(s) of month" hint="Up to 4, e.g. 1, 15. 31 = month end."><input className={inputCls} value={days} onChange={(e) => setDays(e.target.value)} /></Field>}
        {p.cycle === "CUSTOM" && <Field label="Every N days"><input type="number" min={1} max={365} className={inputCls} value={p.customIntervalDays ?? ""} onChange={(e) => setP({ ...p, customIntervalDays: e.target.value ? Number(e.target.value) : null })} /></Field>}
        {(p.cycle === "CUSTOM" || p.cycle === "BIWEEKLY") && <Field label="Starting from" hint={p.cycle === "BIWEEKLY" ? "Optional anchor date" : "Required"}><input type="date" className={inputCls} value={p.anchorDate ?? ""} onChange={(e) => setP({ ...p, anchorDate: e.target.value || null })} /></Field>}
        <Field label="Minimum payout (৳)"><input inputMode="decimal" className={inputCls} value={p.minThreshold} onChange={(e) => setP({ ...p, minThreshold: e.target.value })} /></Field>
        <Field label="Settlement delay (days)" hint="Ledger credits newer than this wait."><input type="number" min={0} max={365} className={inputCls} value={p.settlementDelayDays} onChange={(e) => setP({ ...p, settlementDelayDays: Number(e.target.value) })} /></Field>
        <Field label="Refund window (days)" hint="The longer of delay and window applies."><input type="number" min={0} max={365} className={inputCls} value={p.refundWindowDays} onChange={(e) => setP({ ...p, refundWindowDays: Number(e.target.value) })} /></Field>
      </div>
      <div className="mt-5 grid gap-4 rounded-xl border border-[#ede9fe] bg-[#faf9ff] p-4 md:grid-cols-3">
        <Toggle checked={p.autoPropose} onChange={(v) => setP({ ...p, autoPropose: v })} label="Draft batches automatically" hint="On payout days a draft is prepared. It never approves or pays." />
        <Toggle checked={p.requireApproval} onChange={() => setP({ ...p, requireApproval: true })} label="Manual approval" hint="Always on: an admin approves every batch before anything is marked paid." />
        <Toggle checked={p.holdAll} onChange={(v) => setP({ ...p, holdAll: v })} label="Hold all payouts" hint="Emergency stop: no new batches or approvals." />
      </div>
      <p className="mt-3 text-xs text-[#64748b]">Only delivered orders reach a vendor&apos;s ledger balance; undelivered (pending) earnings are never included. Commission, refunds, returns and earlier payouts are already netted by the ledger.</p>
      {msg && <div className="mt-4"><Notice tone={msg.tone}>{msg.text}</Notice></div>}
      <div className="mt-5 flex justify-end"><Button onClick={submit} loading={saving}>Save settings</Button></div>
    </Card>
  );
}

// ─── audit ─────────────────────────────────────────────────────────────────

export function AuditSection() {
  const { data, isLoading } = usePayoutAuditQuery();
  const rows = data?.data ?? [];
  return (
    <Card title="Payout audit log">
      {isLoading ? <Skeleton rows={6} /> : !rows.length ? <EmptyState icon={<FileText className="h-5 w-5" />} title="No activity yet" /> : (
        <ol className="space-y-2">
          {rows.map((r) => (
            <li key={r.id} className="rounded-xl border border-[#f1f0ff] bg-white px-3 py-2 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium text-[#1e1b4b]">{r.action.replaceAll("_", " ").toLowerCase()}</span>
                <span className="text-xs text-[#94a3b8]">{dateTimeText(r.createdAt)}{r.actorName ? ` · ${r.actorName}` : r.actorName === null ? " · system" : ""}</span>
              </div>
              <p className="text-xs text-[#64748b]">{r.entity} {r.entityId.slice(0, 12)}</p>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}
