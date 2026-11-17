"use client";

// Admin › Payouts. Balances come from the ledger (VendorPayable). Batches go
// DRAFT → APPROVED, and each vendor item is marked paid with the bank
// reference after the transfer is made outside FinixMart (no payout provider
// is connected). Marking paid posts the ledger voucher once.
//
// Presentation only: every query, mutation and handler below is the existing
// payout flow, restyled to the FinixMart admin console design language.

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
import {
  Avatar, Badge, Button, Card, EmptyState, Field, Modal, MonthlyBars, Notice, Pager, PillTabs,
  ReasonDialog, SearchBox, Skeleton, StatCard, Toggle, cx, inputCls, tableCls, tdCls, thCls,
} from "@/components/payouts/ui";
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

const pretty = (s: string) => s.replace(/_/g, " ").toLowerCase();

function StateBadge({ status }: { status: string }) {
  return <Badge tone={STATE_TONE[status] ?? "slate"} dot>{pretty(status)}</Badge>;
}

/** Table that bleeds to the card's side padding, so the slate header spans the panel. */
function TableWrap({ children }: { children: React.ReactNode }) {
  return <div className="-mx-4 overflow-x-auto border-y border-slate-100">{children}</div>;
}

// ─── overview + reports ─────────────────────────────────────────────────────

export function PayoutOverviewSection({ go }: { go: (t: string) => void }) {
  const { data, isLoading, isError } = usePayoutOverviewQuery();
  const due = usePayoutPreviewQuery({ onlyDue: true });
  if (isLoading) return <Skeleton rows={6} />;
  if (isError || !data) return <Notice tone="red">Couldn&apos;t load payouts. Is the payout migration applied?</Notice>;
  const o = data.data;
  const awaiting = (due.data?.data.rows ?? [])
    .filter((r) => r.eligibility.payable)
    .sort((a, b) => Number(b.eligibility.amount) - Number(a.eligibility.amount))
    .slice(0, 5);
  const pct = Number(o.totals.balance) > 0 ? Math.min(100, Math.round((Number(o.totals.available) / Number(o.totals.balance)) * 100)) : 0;
  return (
    <div className="space-y-4">
      {o.policy.holdAll && <Notice tone="amber"><Lock className="mr-1 inline h-3.5 w-3.5" />All payouts are on a platform-wide hold (Cycle settings).</Notice>}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard label="Payable now" value={taka(o.totals.payableNow)} hint={`${o.totals.payableVendors} vendor${o.totals.payableVendors === 1 ? "" : "s"} eligible on the next payout day`} icon={<Wallet />} accent="green" />
        <StatCard label="Not yet payable" value={taka(o.totals.pendingInWindow)} hint="Inside the settlement / refund window" icon={<Clock />} accent="amber" />
        <StatCard label="In open batches" value={taka(o.totals.inOpenBatches)} hint={`${o.totals.openBatches} batch${o.totals.openBatches === 1 ? "" : "es"} · ${o.totals.heldItems} item(s) held`} icon={<FileText />} accent="indigo" />
        <StatCard label="Next payout day" value={dateText(o.nextPayoutDate)} hint={scheduleText(o.policy)} icon={<CalendarClock />} accent="sky" />
      </div>
      <div className="grid gap-4 xl:grid-cols-5">
        <Card className="xl:col-span-3" title="Paid to vendors" subtitle="Last 12 months · payout items marked paid" action={<span className="text-[13px] font-semibold text-slate-800 tabular-nums">{taka(o.totals.paid12m)}</span>}>
          <MonthlyBars label="Vendor payouts by month" data={o.paidByMonth.map((m) => ({ month: m.month, value: Number(m.paid) }))} />
        </Card>
        <Card className="xl:col-span-2" title="Owed to vendors" subtitle="Ledger-derived balance across every store">
          <dl className="space-y-2.5 text-[13px]">
            <div className="flex items-center justify-between"><dt className="text-slate-500">Total ledger balance</dt><dd className="font-semibold text-slate-800 tabular-nums">{taka(o.totals.balance)}</dd></div>
            <div className="flex items-center justify-between"><dt className="text-slate-500">Available after windows and batches</dt><dd className="font-semibold text-slate-800 tabular-nums">{taka(o.totals.available)}</dd></div>
            <div className="flex items-center justify-between"><dt className="text-slate-500">Vendors with a balance</dt><dd className="font-semibold text-slate-800 tabular-nums">{o.totals.vendors}</dd></div>
          </dl>
          <div className="mt-3.5">
            <div className="flex items-center justify-between text-[11px] text-slate-500"><span>Available share of balance</span><span className="font-semibold text-slate-700 tabular-nums">{pct}%</span></div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100"><span className="block h-full rounded-full bg-[#4338CA]" style={{ width: `${pct}%` }} /></div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" onClick={() => go("pending")}>Review pending payouts</Button>
            <Button size="sm" variant="secondary" onClick={() => go("batches")}>Open batches</Button>
          </div>
        </Card>
      </div>
      <Card
        title="Vendors awaiting payout"
        subtitle="Stores due on the next payout day, largest payable first"
        action={<Button size="sm" variant="secondary" onClick={() => go("pending")}>View all</Button>}
      >
        {due.isLoading ? <Skeleton rows={4} /> : !awaiting.length ? (
          <EmptyState icon={<Wallet />} title="No vendor is due today" body="Vendors become payable once their schedule matches the payout day and balances clear the settlement window." />
        ) : (
          <TableWrap>
            <table className={tableCls}>
              <thead><tr><th className={thCls}>Vendor</th><th className={`${thCls} text-right`}>Available</th><th className={`${thCls} text-right`}>Payable</th><th className={thCls}>Next payout</th><th className={thCls}>Schedule</th></tr></thead>
              <tbody>
                {awaiting.map((r) => (
                  <tr key={r.vendorId} className="hover:bg-slate-50/70">
                    <td className={tdCls}><span className="flex items-center gap-2.5"><Avatar name={r.storeName} /><span className="truncate font-medium text-slate-800">{r.storeName}</span></span></td>
                    <td className={`${tdCls} text-right tabular-nums text-slate-500`}>{taka(r.eligibility.available)}</td>
                    <td className={`${tdCls} text-right font-semibold tabular-nums text-slate-900`}>{taka(r.eligibility.amount)}</td>
                    <td className={`${tdCls} text-slate-600`}>{dateText(r.nextPayoutDate)}</td>
                    <td className={`${tdCls} text-slate-500`}>{scheduleText(r.rule)}{r.rule.overridden.length > 0 && <span className="ml-1.5"><Badge tone="violet">custom</Badge></span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        )}
      </Card>
    </div>
  );
}

export function PayoutReportsSection() {
  const { data, isLoading } = usePayoutOverviewQuery();
  if (isLoading || !data) return <Skeleton rows={5} />;
  const months = [...data.data.paidByMonth].reverse();
  const total = months.reduce((s, m) => s + Number(m.paid), 0);
  const last = months[0];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
        <StatCard label="Paid · last 12 months" value={taka(total)} hint="Payout items marked paid" icon={<Wallet />} accent="green" />
        <StatCard label="Latest month" value={last ? taka(last.paid) : "—"} hint={last ? last.month : "No payouts recorded"} icon={<CalendarClock />} accent="indigo" />
        <StatCard label="Months reported" value={months.length} hint="Calendar months with a reporting row" icon={<FileText />} accent="slate" />
      </div>
      <Card title="Payout report" subtitle="Paid to vendors by payment date (Asia/Dhaka)">
        <TableWrap>
          <table className={tableCls}>
            <thead><tr><th className={thCls}>Month</th><th className={`${thCls} text-right`}>Paid to vendors</th></tr></thead>
            <tbody>
              {months.map((m) => (
                <tr key={m.month} className="hover:bg-slate-50/70">
                  <td className={`${tdCls} font-medium`}>{m.month}</td>
                  <td className={`${tdCls} text-right tabular-nums`}>{taka(m.paid)}</td>
                </tr>
              ))}
              {!months.length && <tr><td className={tdCls} colSpan={2}><span className="text-slate-500">Nothing has been paid yet.</span></td></tr>}
            </tbody>
          </table>
        </TableWrap>
        <p className="mt-3 text-[11px] leading-4 text-slate-500">Counts payout items marked paid, by payment date (Asia/Dhaka). Subscription revenue is reported under Subscriptions; the two are never mixed.</p>
      </Card>
    </div>
  );
}

// ─── pending payouts + earnings ─────────────────────────────────────────────

function ReasonBadges({ r }: { r: PreviewRow }) {
  if (r.eligibility.payable) return <Badge tone="green" dot>Eligible</Badge>;
  return <span className="flex flex-wrap gap-1">{r.eligibility.reasons.map((x) => <Badge key={x} tone={x === "NOTHING_DUE" || x === "BELOW_THRESHOLD" ? "slate" : "amber"}>{REASON_LABEL[x] ?? x}</Badge>)}</span>;
}

export function PendingSection({ earnings = false }: { earnings?: boolean }) {
  const [onlyDue, setOnlyDue] = useState(!earnings);
  const { data, isLoading } = usePayoutPreviewQuery({ onlyDue });
  const [create, { isLoading: creating }] = usePayoutCreateBatchMutation();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [msg, setMsg] = useState<{ tone: "green" | "red"; text: string } | null>(null);
  const [q, setQ] = useState("");
  const rows = useMemo(() => (data?.data.rows ?? []).filter((r) => earnings || r.eligibility.payable || !onlyDue), [data, earnings, onlyDue]);
  const visible = useMemo(() => { const s = q.trim().toLowerCase(); return s ? rows.filter((r) => r.storeName.toLowerCase().includes(s)) : rows; }, [rows, q]);
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
  const t = data?.data.totals;
  const allChecked = visible.length > 0 && visible.every((r) => !r.eligibility.payable || selected.has(r.vendorId));
  const toggleAll = () => {
    const n = new Set(selected);
    if (allChecked) visible.forEach((r) => n.delete(r.vendorId));
    else visible.forEach((r) => { if (r.eligibility.payable) n.add(r.vendorId); });
    setSelected(n);
  };
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard label={earnings ? "Vendors with a balance" : "Vendors listed"} value={data ? rows.length : "—"} hint={onlyDue ? "Matching today's payout schedule" : "Every vendor with a positive balance"} icon={<Wallet />} accent="indigo" />
        <StatCard label="Payable now" value={data ? taka(t?.payableNow ?? 0) : "—"} hint="Eligible after windows and open batches" icon={<CheckCircle2 />} accent="green" />
        <StatCard label="Pending in window" value={data ? taka(t?.pendingInWindow ?? 0) : "—"} hint="Credits still inside the settlement window" icon={<Clock />} accent="amber" />
        <StatCard
          label={earnings ? "In open batches" : "Selected"}
          value={earnings ? (data ? taka(t?.inOpenBatches ?? 0) : "—") : `${selected.size}`}
          hint={earnings ? "Already included in an open batch" : `${taka(total)} across the selected vendors`}
          icon={<FileText />}
          accent="slate"
        />
      </div>
      <Card
        title={earnings ? "Vendor earnings" : "Pending payouts"}
        subtitle={earnings ? "Ledger balance per vendor, before and after the settlement window" : "Ledger balance minus recent credits inside the settlement window and anything already in an open batch"}
        action={<Toggle checked={onlyDue} onChange={setOnlyDue} label={earnings ? "Due today only" : "Only vendors due today"} />}
      >
        {msg && <div className="mb-3"><Notice tone={msg.tone}>{msg.text}</Notice></div>}
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <SearchBox value={q} onChange={setQ} placeholder="Search vendor" className="w-full sm:max-w-xs" />
          <p className="text-[11px] text-slate-500">{visible.length} of {rows.length} vendor(s){!earnings && <> · <b className="text-slate-700">{selected.size}</b> selected</>}</p>
        </div>
        {isLoading ? <Skeleton rows={5} /> : !visible.length ? (
          <EmptyState
            icon={<Wallet />}
            title={q ? "No vendor matches that search" : onlyDue ? "No vendor is due today" : "No vendor has a balance"}
            body={q ? "Clear the search to see every vendor." : onlyDue ? "Turn off the filter to see every vendor with a balance." : undefined}
          />
        ) : (
          <>
            <TableWrap>
              <table className={tableCls}>
                <thead>
                  <tr>
                    {!earnings && <th className={cx(thCls, "w-8 pr-0")}><input type="checkbox" aria-label="Select every payable vendor" checked={allChecked} onChange={toggleAll} className="h-3.5 w-3.5 accent-[#4338CA]" /></th>}
                    <th className={thCls}>Vendor</th>
                    <th className={`${thCls} text-right`}>Balance</th>
                    <th className={`${thCls} text-right`}>In window</th>
                    <th className={`${thCls} text-right`}>In batches</th>
                    <th className={`${thCls} text-right`}>Available</th>
                    <th className={thCls}>Schedule</th>
                    <th className={thCls}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((r) => (
                    <tr key={r.vendorId} className={cx("hover:bg-slate-50/70", !earnings && selected.has(r.vendorId) && "bg-indigo-50/30")}>
                      {!earnings && <td className={cx(tdCls, "pr-0")}><input type="checkbox" aria-label={`Include ${r.storeName}`} disabled={!r.eligibility.payable} checked={selected.has(r.vendorId)} onChange={(e) => { const n = new Set(selected); if (e.target.checked) n.add(r.vendorId); else n.delete(r.vendorId); setSelected(n); }} className="h-3.5 w-3.5 accent-[#4338CA]" /></td>}
                      <td className={tdCls}>
                        <span className="flex items-center gap-2.5">
                          <Avatar name={r.storeName} />
                          <span className="min-w-0">
                            <span className="block truncate font-medium text-slate-800">{r.storeName}</span>
                            <span className="block text-[11px] text-slate-500">Paid so far {taka(r.totalPaid)}</span>
                          </span>
                        </span>
                      </td>
                      <td className={`${tdCls} text-right tabular-nums`}>{taka(r.eligibility.balance)}</td>
                      <td className={`${tdCls} text-right tabular-nums text-slate-500`}>{taka(r.eligibility.pendingInWindow)}</td>
                      <td className={`${tdCls} text-right tabular-nums text-slate-500`}>{taka(r.eligibility.inOpenBatches)}</td>
                      <td className={`${tdCls} text-right font-semibold tabular-nums text-slate-900`}>{taka(r.eligibility.available)}</td>
                      <td className={tdCls}>
                        <span className="block text-[12px] text-slate-700">{scheduleText(r.rule)}{r.rule.overridden.length > 0 && <span className="ml-1.5"><Badge tone="violet">custom</Badge></span>}</span>
                        <span className="block text-[11px] text-slate-500">next {dateText(r.nextPayoutDate)}</span>
                      </td>
                      <td className={tdCls}><ReasonBadges r={r} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
            {!earnings && (
              <div className="mt-3 flex flex-col gap-2 border-t border-slate-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[12px] text-slate-600">{selected.size} vendor{selected.size === 1 ? "" : "s"} selected · <b className="text-slate-900 tabular-nums">{taka(total)}</b></p>
                <Button onClick={draft} loading={creating} disabled={!selected.size}><Plus className="h-3.5 w-3.5" />Create draft batch</Button>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}

// ─── batches ────────────────────────────────────────────────────────────────

export function BatchesSection({ go }: { go: (t: string) => void }) {
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const { data, isLoading } = usePayoutBatchesQuery(status ? { status } : undefined);
  const [open, setOpen] = useState<string | null>(null);
  const all = data?.data ?? [];
  const batches = useMemo(() => { const s = q.trim().toLowerCase(); return s ? all.filter((b) => b.batchNumber.toLowerCase().includes(s)) : all; }, [all, q]);
  const drafts = all.filter((b) => b.status === "DRAFT").length;
  const openCount = all.filter((b) => ["DRAFT", "APPROVED", "PARTIALLY_PAID"].includes(b.status)).length;
  const value = all.reduce((s, b) => s + Number(b.totalAmount), 0);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard label="Batches" value={data ? all.length : "—"} hint={status ? `Filtered to ${pretty(status)}` : "Every batch on record"} icon={<FileText />} accent="indigo" />
        <StatCard label="Open" value={data ? openCount : "—"} hint="Draft, approved or partially paid" icon={<Clock />} accent="amber" />
        <StatCard label="Awaiting approval" value={data ? drafts : "—"} hint="Draft batches not yet approved" icon={<ShieldAlert />} accent="slate" />
        <StatCard label="Value in view" value={data ? taka(value) : "—"} hint="Sum of the batches currently listed" icon={<Wallet />} accent="green" />
      </div>
      <Card title="Payout batches" subtitle="Batches group each vendor's payable amount for one payout day" action={<Button size="sm" variant="secondary" onClick={() => go("pending")}><Plus className="h-3.5 w-3.5" />New draft</Button>}>
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <PillTabs
            value={status}
            onChange={setStatus}
            options={[{ key: "", label: "All" }, ...["DRAFT", "APPROVED", "PARTIALLY_PAID", "PAID", "CANCELLED"].map((s) => ({ key: s, label: pretty(s) }))]}
          />
          <SearchBox value={q} onChange={setQ} placeholder="Search batch number" className="w-full sm:max-w-[220px]" />
        </div>
        {isLoading ? <Skeleton rows={4} /> : !batches.length ? (
          <EmptyState icon={<FileText />} title={q ? "No batch matches that search" : "No batches"} body={q ? "Clear the search to list every batch." : "Draft one from Pending payouts."} action={!q ? <Button size="sm" onClick={() => go("pending")}>Open pending payouts</Button> : undefined} />
        ) : (
          <TableWrap>
            <table className={tableCls}>
              <thead><tr><th className={thCls}>Batch</th><th className={thCls}>Payout day</th><th className={`${thCls} text-right`}>Vendors</th><th className={`${thCls} text-right`}>Total</th><th className={thCls}>Status</th><th className={cx(thCls, "text-right")} /></tr></thead>
              <tbody>
                {batches.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/70">
                    <td className={tdCls}><span className="font-medium text-slate-800">{b.batchNumber}</span>{!b.createdById && <span className="ml-1.5"><Badge tone="blue">auto</Badge></span>}</td>
                    <td className={tdCls}>{dateText(b.scheduledFor)}</td>
                    <td className={`${tdCls} text-right tabular-nums`}>{b.vendorCount}</td>
                    <td className={`${tdCls} text-right font-semibold tabular-nums text-slate-900`}>{taka(b.totalAmount)}</td>
                    <td className={tdCls}><StateBadge status={b.status} /></td>
                    <td className={`${tdCls} text-right`}><Button size="sm" variant="secondary" onClick={() => setOpen(b.id)}>Open</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        )}
      </Card>
      {open && <BatchModal id={open} onClose={() => setOpen(null)} />}
    </div>
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
        <div className="space-y-3.5">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50/70 p-3.5">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-slate-500">Payout day</p>
              <p className="mt-0.5 text-[13px] font-medium text-slate-700">{dateText(b.scheduledFor)} · {b.vendorCount} vendor(s)</p>
              <p className="mt-0.5 text-2xl font-semibold tracking-tight text-slate-900 tabular-nums">{taka(b.totalAmount)}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <StateBadge status={b.status} />
              {b.status === "DRAFT" && <Button size="sm" loading={acting} onClick={() => run(() => batchAct({ id, action: "approve" }).unwrap(), "Batch approved. Make the transfers, then mark each vendor paid.")}><CheckCircle2 className="h-3.5 w-3.5" />Approve</Button>}
              {(b.status === "DRAFT" || b.status === "APPROVED") && <Button size="sm" variant="danger" onClick={() => setCancelBatch(true)}><XCircle className="h-3.5 w-3.5" />Cancel batch</Button>}
            </div>
          </div>
          {b.status === "APPROVED" || b.status === "PARTIALLY_PAID" ? <Notice tone="violet">FinixMart doesn&apos;t send money automatically. Transfer each amount from the bank, then press <b>Mark paid</b> with the bank reference. That posts the payout to the ledger once.</Notice> : null}
          {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
          <TableWrap>
            <table className={tableCls}>
              <thead><tr><th className={thCls}>Vendor</th><th className={`${thCls} text-right`}>Amount</th><th className={thCls}>Status</th><th className={thCls}>Reference</th><th className={cx(thCls, "text-right")} /></tr></thead>
              <tbody>
                {(b.items ?? []).map((i) => (
                  <tr key={i.id} className="hover:bg-slate-50/70">
                    <td className={tdCls}>
                      <span className="block font-medium text-slate-800">{i.vendor?.storeName ?? i.vendorId}</span>
                      <span className="block text-[11px] text-slate-500">balance at draft {taka(i.calculation?.balance)}</span>
                    </td>
                    <td className={`${tdCls} text-right font-semibold tabular-nums text-slate-900`}>{taka(i.amount)}</td>
                    <td className={tdCls}><StateBadge status={i.status} />{i.heldReason && <span className="mt-0.5 block max-w-[200px] text-[11px] leading-4 text-slate-500">{i.heldReason}</span>}</td>
                    <td className={`${tdCls} text-[12px]`}>{i.reference ? <>{i.reference}<span className="block text-[11px] text-slate-500">{dateText(i.paidAt)}</span></> : "—"}</td>
                    <td className={`${tdCls} whitespace-nowrap text-right`}>
                      <span className="inline-flex items-center gap-1">
                        {i.status === "APPROVED" && <Button size="sm" onClick={() => setPaying(i)}>Mark paid</Button>}
                        {(i.status === "PENDING" || i.status === "APPROVED") && <Button size="sm" variant="ghost" title="Hold" onClick={() => setItemReason({ item: i, action: "hold" })}><Hand className="h-3.5 w-3.5" /></Button>}
                        {i.status === "HELD" && <Button size="sm" variant="ghost" title="Release" loading={itemBusy} onClick={() => run(() => itemAct({ id: i.id, action: "release" }).unwrap(), "Item released.")}><Play className="h-3.5 w-3.5" /></Button>}
                        {["PENDING", "APPROVED", "HELD"].includes(i.status) && <Button size="sm" variant="ghost" title="Cancel item" onClick={() => setItemReason({ item: i, action: "cancel" })}><XCircle className="h-3.5 w-3.5 text-rose-500" /></Button>}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
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
        <p className="text-[12px] leading-5 text-slate-600">Paying <b className="text-slate-800">{item.vendor?.storeName}</b>. Enter the reference of the transfer you already made.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Method"><select className={inputCls} value={method} onChange={(e) => setMethod(e.target.value)}>{["BANK_TRANSFER", "BKASH", "NAGAD", "ROCKET", "CHEQUE", "OTHER"].map((m) => <option key={m} value={m}>{pretty(m)}</option>)}</select></Field>
          <Field label="Paid on" hint="Empty = today"><input type="date" className={inputCls} value={paidAt} onChange={(e) => setPaidAt(e.target.value)} /></Field>
          <div className="sm:col-span-2"><Field label="Transfer reference"><input className={inputCls} value={reference} onChange={(e) => setReference(e.target.value)} /></Field></div>
        </div>
        <label className="flex items-start gap-2 text-[12px] leading-5 text-slate-700"><input type="checkbox" className="mt-0.5 h-3.5 w-3.5 accent-[#4338CA]" checked={sure} onChange={(e) => setSure(e.target.checked)} />I confirm {taka(item.amount)} has left FinixMart&apos;s bank account for this vendor.</label>
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
  const total = data?.data.total ?? 0;
  const pageSize = data?.data.pageSize ?? 25;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const paidOnPage = items.filter((i) => i.status === "PAID").reduce((s, i) => s + Number(i.amount), 0);
  const openOnPage = items.filter((i) => ["PENDING", "APPROVED", "HELD"].includes(i.status)).length;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard label="Records" value={data ? total : "—"} hint="Matching the current filter" icon={<FileText />} accent="indigo" />
        <StatCard label="Paid on this page" value={data ? taka(paidOnPage) : "—"} hint="Page-scoped payout items" icon={<CheckCircle2 />} accent="green" />
        <StatCard label="Open on this page" value={data ? openOnPage : "—"} hint="Pending, approved or held" icon={<Clock />} accent="amber" />
        <StatCard label="Page" value={data ? `${page} / ${pages}` : "—"} hint={`${pageSize} records per page`} icon={<Wallet />} accent="slate" />
      </div>
      <Card title="Payout transactions" subtitle="Every vendor payout item, newest first">
        <div className="mb-3">
          <PillTabs
            value={status}
            onChange={(s) => { setStatus(s); setPage(1); }}
            options={["PAID", "APPROVED", "PENDING", "HELD", "CANCELLED", ""].map((s) => ({ key: s, label: s ? pretty(s) : "All" }))}
          />
        </div>
        {isLoading ? <Skeleton rows={5} /> : !items.length ? (
          <EmptyState icon={<Wallet />} title="Nothing here" body="No payout items match this status." />
        ) : (
          <>
            <TableWrap>
              <table className={tableCls}>
                <thead><tr><th className={thCls}>Vendor</th><th className={thCls}>Batch</th><th className={`${thCls} text-right`}>Amount</th><th className={thCls}>Status</th><th className={thCls}>Paid</th><th className={thCls}>Reference</th></tr></thead>
                <tbody>
                  {items.map((i) => (
                    <tr key={i.id} className="hover:bg-slate-50/70">
                      <td className={tdCls}><span className="flex items-center gap-2.5"><Avatar name={i.vendor?.storeName ?? "Vendor"} /><span className="truncate font-medium text-slate-800">{i.vendor?.storeName ?? "—"}</span></span></td>
                      <td className={`${tdCls} text-slate-600`}>{i.batch?.batchNumber ?? "—"}</td>
                      <td className={`${tdCls} text-right font-semibold tabular-nums text-slate-900`}>{taka(i.amount)}</td>
                      <td className={tdCls}><StateBadge status={i.status} /></td>
                      <td className={`${tdCls} text-slate-600`}>{dateText(i.paidAt)}</td>
                      <td className={`${tdCls} text-[12px]`}>{i.reference ?? "—"}{i.method && <span className="block text-[11px] text-slate-500">{pretty(i.method)}</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
            {pages > 1 && <Pager page={page} pages={pages} onPage={setPage} total={total} pageSize={pageSize} />}
          </>
        )}
      </Card>
    </div>
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
  const [q, setQ] = useState("");
  const rules = data?.data ?? [];
  const visible = useMemo(() => { const s = q.trim().toLowerCase(); return s ? rules.filter((r) => (r.vendor?.storeName ?? "").toLowerCase().includes(s) || (r.note ?? "").toLowerCase().includes(s)) : rules; }, [rules, q]);
  const isHeld = (r: PayoutRule) => !!r.holdUntil && new Date(r.holdUntil) > new Date();
  const paused = rules.filter((r) => r.paused).length;
  const held = rules.filter(isHeld).length;
  const custom = rules.filter((r) => r.cycle || r.minThreshold || r.settlementDelayDays !== null).length;
  const act = async (vendorId: string, action: "hold" | "release" | "pause" | "resume", reason?: string, until?: string) => {
    setMsg(null);
    try { await stateAct({ vendorId, action, reason, until }).unwrap(); setMsg({ tone: "green", text: "Saved." }); } catch (e) { setMsg({ tone: "red", text: apiError(e) }); }
  };
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard label="Custom rules" value={data ? rules.length : "—"} hint="Vendors with any override" icon={<ShieldAlert />} accent="indigo" />
        <StatCard label="Schedule overrides" value={data ? custom : "—"} hint="Cycle, minimum or delay changed" icon={<CalendarClock />} accent="slate" />
        <StatCard label="Paused" value={data ? paused : "—"} hint="Payouts stopped until resumed" icon={<Pause />} accent="amber" />
        <StatCard label="On hold" value={data ? held : "—"} hint="Held until a date or released" icon={<Lock />} accent="rose" />
      </div>
      <Card title="Vendor-specific rules" subtitle="Anything left empty follows the platform cycle settings" action={<Button size="sm" onClick={() => setPicking(true)}><Plus className="h-3.5 w-3.5" />Add vendor rule</Button>}>
        {msg && <div className="mb-3"><Notice tone={msg.tone}>{msg.text}</Notice></div>}
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <SearchBox value={q} onChange={setQ} placeholder="Search vendor or note" className="w-full sm:max-w-xs" />
          <p className="text-[11px] text-slate-500">{visible.length} of {rules.length} rule(s)</p>
        </div>
        {isLoading ? <Skeleton /> : !visible.length ? (
          <EmptyState icon={<ShieldAlert />} title={q ? "No rule matches that search" : "Every vendor follows the platform schedule"} body={q ? "Clear the search to list every rule." : "Add a vendor rule to override the schedule, minimum or settlement delay."} />
        ) : (
          <TableWrap>
            <table className={tableCls}>
              <thead><tr><th className={thCls}>Vendor</th><th className={thCls}>Schedule</th><th className={`${thCls} text-right`}>Minimum</th><th className={thCls}>Delay</th><th className={thCls}>State</th><th className={cx(thCls, "text-right")} /></tr></thead>
              <tbody>
                {visible.map((r) => {
                  const h = isHeld(r);
                  return (
                    <tr key={r.vendorId} className="hover:bg-slate-50/70">
                      <td className={tdCls}>
                        <span className="flex items-center gap-2.5">
                          <Avatar name={r.vendor?.storeName ?? "Vendor"} />
                          <span className="min-w-0">
                            <span className="block truncate font-medium text-slate-800">{r.vendor?.storeName ?? "—"}</span>
                            {r.note && <span className="block truncate text-[11px] text-slate-500">{r.note}</span>}
                          </span>
                        </span>
                      </td>
                      <td className={`${tdCls} text-slate-600`}>{r.cycle ? CYCLE_LABEL[r.cycle] : <span className="text-slate-400">Platform</span>}</td>
                      <td className={`${tdCls} text-right tabular-nums`}>{r.minThreshold ? taka(r.minThreshold) : <span className="text-slate-400">Platform</span>}</td>
                      <td className={`${tdCls} text-slate-600`}>{r.settlementDelayDays ?? <span className="text-slate-400">Platform</span>}{r.settlementDelayDays !== null && " days"}</td>
                      <td className={tdCls}>
                        <span className="flex flex-wrap gap-1">
                          {r.paused && <Badge tone="amber" dot>Paused</Badge>}
                          {h && <Badge tone="amber" dot>Held until {dateText(r.holdUntil)}</Badge>}
                          {!r.paused && !h && <Badge tone="green" dot>Normal</Badge>}
                        </span>
                        {(r.paused || h) && r.holdReason && <span className="mt-0.5 block text-[11px] leading-4 text-slate-500">{r.holdReason}</span>}
                      </td>
                      <td className={`${tdCls} whitespace-nowrap text-right`}>
                        <span className="inline-flex items-center gap-1">
                          <Button size="sm" variant="secondary" onClick={() => setEditing({ id: r.vendorId, storeName: r.vendor?.storeName ?? "" })}>Edit</Button>
                          {h ? <Button size="sm" variant="ghost" loading={busy} onClick={() => act(r.vendorId, "release")} title="Release hold"><Unlock className="h-3.5 w-3.5" /></Button> : <Button size="sm" variant="ghost" onClick={() => setAsk({ vendorId: r.vendorId, action: "hold" })} title="Hold"><Lock className="h-3.5 w-3.5" /></Button>}
                          {r.paused ? <Button size="sm" variant="ghost" loading={busy} onClick={() => act(r.vendorId, "resume")} title="Resume"><Play className="h-3.5 w-3.5" /></Button> : <Button size="sm" variant="ghost" onClick={() => setAsk({ vendorId: r.vendorId, action: "pause" })} title="Pause"><Pause className="h-3.5 w-3.5" /></Button>}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableWrap>
        )}
      </Card>
      {picking && <PickModal onClose={() => setPicking(false)} onPick={(v) => { setPicking(false); setEditing(v); }} />}
      {editing && <RuleModal vendor={editing} existing={rules.find((r) => r.vendorId === editing.id) ?? null} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); setMsg({ tone: "green", text: "Rule saved." }); }} />}
      <HoldDialog open={!!ask} action={ask?.action ?? "hold"} loading={busy} onClose={() => setAsk(null)} onConfirm={(reason, until) => { const a = ask!; setAsk(null); act(a.vendorId, a.action, reason, until); }} />
    </div>
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
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Cycle"><select className={inputCls} value={f.cycle} onChange={(e) => setF({ ...f, cycle: e.target.value })}><option value="">Platform default</option>{Object.entries(CYCLE_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Field>
        {(f.cycle === "WEEKLY" || f.cycle === "BIWEEKLY") && <Field label="Weekday"><select className={inputCls} value={f.weekday} onChange={(e) => setF({ ...f, weekday: e.target.value })}><option value="">Platform default</option>{WEEKDAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}</select></Field>}
        {(f.cycle === "MONTHLY" || f.cycle === "QUARTERLY") && <Field label="Day(s) of month" hint="e.g. 1, 15 (31 = month end)"><input className={inputCls} value={f.monthDays} onChange={(e) => setF({ ...f, monthDays: e.target.value })} /></Field>}
        {f.cycle === "CUSTOM" && <Field label="Every N days"><input type="number" min={1} max={365} className={inputCls} value={f.customIntervalDays} onChange={(e) => setF({ ...f, customIntervalDays: e.target.value })} /></Field>}
        {(f.cycle === "CUSTOM" || f.cycle === "BIWEEKLY") && <Field label="Starting from"><input type="date" className={inputCls} value={f.anchorDate} onChange={(e) => setF({ ...f, anchorDate: e.target.value })} /></Field>}
        <Field label="Minimum payout (৳)" hint="Empty = platform default"><input inputMode="decimal" className={inputCls} value={f.minThreshold} onChange={(e) => setF({ ...f, minThreshold: e.target.value })} /></Field>
        <Field label="Settlement delay (days)" hint="Empty = platform default"><input type="number" min={0} max={365} className={inputCls} value={f.settlementDelayDays} onChange={(e) => setF({ ...f, settlementDelayDays: e.target.value })} /></Field>
        <div className="sm:col-span-2"><Field label="Internal note"><input className={inputCls} value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} /></Field></div>
      </div>
      {err && <div className="mt-3"><Notice tone="red">{err}</Notice></div>}
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
    <div className="grid gap-4 xl:grid-cols-3">
      <div className="space-y-4 xl:col-span-2">
        <Card title="Payout schedule" subtitle={scheduleText(p)} action={<Button size="sm" loading={saving} onClick={submit}>Save settings</Button>}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Payout cycle"><select className={inputCls} value={p.cycle} onChange={(e) => setP({ ...p, cycle: e.target.value as PayoutPolicy["cycle"] })}>{Object.entries(CYCLE_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Field>
            {(p.cycle === "WEEKLY" || p.cycle === "BIWEEKLY") && <Field label="Processing day"><select className={inputCls} value={p.weekday} onChange={(e) => setP({ ...p, weekday: Number(e.target.value) })}>{WEEKDAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}</select></Field>}
            {(p.cycle === "MONTHLY" || p.cycle === "QUARTERLY") && <Field label="Day(s) of month" hint="Up to 4, e.g. 1, 15. 31 = month end."><input className={inputCls} value={days} onChange={(e) => setDays(e.target.value)} /></Field>}
            {p.cycle === "CUSTOM" && <Field label="Every N days"><input type="number" min={1} max={365} className={inputCls} value={p.customIntervalDays ?? ""} onChange={(e) => setP({ ...p, customIntervalDays: e.target.value ? Number(e.target.value) : null })} /></Field>}
            {(p.cycle === "CUSTOM" || p.cycle === "BIWEEKLY") && <Field label="Starting from" hint={p.cycle === "BIWEEKLY" ? "Optional anchor date" : "Required"}><input type="date" className={inputCls} value={p.anchorDate ?? ""} onChange={(e) => setP({ ...p, anchorDate: e.target.value || null })} /></Field>}
          </div>
        </Card>
        <Card title="Amounts and settlement">
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Minimum payout (৳)"><input inputMode="decimal" className={inputCls} value={p.minThreshold} onChange={(e) => setP({ ...p, minThreshold: e.target.value })} /></Field>
            <Field label="Settlement delay (days)" hint="Ledger credits newer than this wait."><input type="number" min={0} max={365} className={inputCls} value={p.settlementDelayDays} onChange={(e) => setP({ ...p, settlementDelayDays: Number(e.target.value) })} /></Field>
            <Field label="Refund window (days)" hint="The longer of delay and window applies."><input type="number" min={0} max={365} className={inputCls} value={p.refundWindowDays} onChange={(e) => setP({ ...p, refundWindowDays: Number(e.target.value) })} /></Field>
          </div>
        </Card>
        <Card title="Automation and safety">
          <div className="grid gap-4 sm:grid-cols-3">
            <Toggle checked={p.autoPropose} onChange={(v) => setP({ ...p, autoPropose: v })} label="Draft batches automatically" hint="On payout days a draft is prepared. It never approves or pays." />
            <Toggle checked={p.requireApproval} onChange={() => setP({ ...p, requireApproval: true })} label="Manual approval" hint="Always on: an admin approves every batch before anything is marked paid." />
            <Toggle checked={p.holdAll} onChange={(v) => setP({ ...p, holdAll: v })} label="Hold all payouts" hint="Emergency stop: no new batches or approvals." />
          </div>
          {msg && <div className="mt-3"><Notice tone={msg.tone}>{msg.text}</Notice></div>}
        </Card>
      </div>
      <Card title="How this applies" subtitle="Ledger rules that shape every payout" className="h-fit">
        <ul className="space-y-2.5 text-[12px] leading-5 text-slate-600">
          <li className="flex gap-2"><Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#4338CA]" />Only delivered orders reach a vendor&apos;s ledger balance; undelivered earnings are never included.</li>
          <li className="flex gap-2"><ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#4338CA]" />Commission, refunds, returns and earlier payouts are already netted by the ledger.</li>
          <li className="flex gap-2"><Wallet className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#4338CA]" />A vendor is payable when its balance clears both the settlement delay and the refund window.</li>
          <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#4338CA]" />Minimum payout keeps small balances in the ledger for the next payout day.</li>
        </ul>
        <div className="mt-3.5 rounded-lg border border-slate-200 bg-slate-50 p-3 text-[11px] leading-4 text-slate-500">
          Current schedule: <b className="text-slate-700">{scheduleText(p)}</b>{p.cycle === "CUSTOM" || p.cycle === "BIWEEKLY" ? ` · anchored ${dateText(p.anchorDate)}` : ""}
        </div>
        <div className="mt-3 flex justify-end"><Button size="sm" variant="secondary" onClick={submit} loading={saving}>Save settings</Button></div>
      </Card>
    </div>
  );
}

// ─── audit ─────────────────────────────────────────────────────────────────

export function AuditSection() {
  const { data, isLoading } = usePayoutAuditQuery();
  const [q, setQ] = useState("");
  const [entity, setEntity] = useState("");
  const rows = data?.data ?? [];
  const entities = useMemo(() => {
    const m = new Map<string, number>();
    rows.forEach((r) => m.set(r.entity, (m.get(r.entity) ?? 0) + 1));
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [rows]);
  const visible = useMemo(() => {
    const s = q.trim().toLowerCase();
    return rows.filter((r) => (!entity || r.entity === entity) && (!s || `${r.action} ${r.entity} ${r.entityId} ${r.actorName ?? ""}`.toLowerCase().includes(s)));
  }, [rows, entity, q]);
  return (
    <Card title="Payout audit log" subtitle="Every change to batches, items, rules and settings">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <PillTabs
          value={entity}
          onChange={setEntity}
          options={[{ key: "", label: "All", count: rows.length }, ...entities.map(([e, n]) => ({ key: e, label: e, count: n }))]}
        />
        <SearchBox value={q} onChange={setQ} placeholder="Search action or actor" className="w-full sm:max-w-xs" />
      </div>
      {isLoading ? <Skeleton rows={6} /> : !visible.length ? (
        <EmptyState icon={<FileText />} title={q || entity ? "No entry matches those filters" : "No activity yet"} body={q || entity ? "Clear the filters to see the full log." : undefined} />
      ) : (
        <TableWrap>
          <table className={tableCls}>
            <thead><tr><th className={thCls}>When</th><th className={thCls}>Action</th><th className={thCls}>Entity</th><th className={thCls}>Actor</th></tr></thead>
            <tbody>
              {visible.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/70">
                  <td className={`${tdCls} whitespace-nowrap text-slate-600`}>{dateTimeText(r.createdAt)}</td>
                  <td className={tdCls}><span className="font-medium text-slate-800">{r.action.replaceAll("_", " ").toLowerCase()}</span></td>
                  <td className={tdCls}><span className="text-slate-600">{r.entity}</span><span className="block text-[11px] text-slate-400">{r.entityId.slice(0, 12)}</span></td>
                  <td className={`${tdCls} text-slate-600`}>{r.actorName ?? (r.actorName === null ? "system" : "—")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      )}
    </Card>
  );
}
