"use client";

// Vendor › Payouts: the store owner's own earnings balance, what is payable,
// pending or on hold, the next payout day and payout history. Figures come
// from FinixMart's ledger; subscription payments are a separate page.

import { CalendarClock, CheckCircle2, Clock, Hourglass, Lock, ShieldCheck, Wallet } from "lucide-react";
import { useVendorPayoutSummaryQuery } from "@/features/billingApi";
import { CYCLE_LABEL, STATE_TONE, dateText, taka } from "@/lib/billing/format";
import { Badge, Breadcrumb, Card, EmptyState, Notice, PageHeader, PayoutShell, Skeleton, StatCard, tableCls, tdCls, thCls } from "@/components/payouts/ui";

const STATUS_TEXT: Record<string, string> = {
  ELIGIBLE: "You'll be included in the next payout.",
  BELOW_THRESHOLD: "Your available balance is below the minimum payout. It carries over to the next payout day.",
  NOTHING_DUE: "Nothing is payable yet. New earnings become payable after the settlement window.",
  ON_HOLD: "Your payouts are on hold. Contact FinixMart support for details.",
};

const STATUS_TONE: Record<string, "green" | "amber" | "slate"> = {
  ELIGIBLE: "green", BELOW_THRESHOLD: "slate", NOTHING_DUE: "slate", ON_HOLD: "amber",
};

const STATUS_LABEL: Record<string, string> = {
  ELIGIBLE: "Eligible", BELOW_THRESHOLD: "Below minimum", NOTHING_DUE: "Nothing due", ON_HOLD: "On hold",
};

export default function VendorPayoutsPage() {
  const { data, isLoading, isError } = useVendorPayoutSummaryQuery();
  if (isLoading) return <PayoutShell><Skeleton rows={6} /></PayoutShell>;
  if (isError || !data) {
    return (
      <PayoutShell>
        <Breadcrumb items={["FinixMart", "Vendor", "Payouts"]} />
        <Notice tone="red">Payout information isn&apos;t available right now. Only the store owner can open this page.</Notice>
      </PayoutShell>
    );
  }
  const s = data.data;
  const pct = Number(s.totalBalance) > 0 ? Math.min(100, Math.round((Number(s.available) / Number(s.totalBalance)) * 100)) : 0;
  return (
    <PayoutShell>
      <Breadcrumb items={["FinixMart", "Vendor", "Payouts"]} />
      <PageHeader
        title="Payouts"
        subtitle="Your earnings from FinixMart orders and when they're paid"
        icon={<Wallet />}
        badge={<Badge tone={STATUS_TONE[s.status] ?? "slate"} dot>{STATUS_LABEL[s.status] ?? s.status}</Badge>}
      />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard label="Available" value={taka(s.available)} hint="Payable on the next payout day" icon={<CheckCircle2 />} accent="green" />
        <StatCard label="Pending" value={taka(s.pending)} hint={`Inside the ${s.schedule.holdWindowDays}-day settlement window`} icon={<Hourglass />} accent="amber" />
        <StatCard label="On hold" value={taka(s.onHold)} hint={Number(s.inProcess) > 0 ? `${taka(s.inProcess)} being processed` : "Not held by FinixMart"} icon={<Lock />} accent="rose" />
        <StatCard label="Total paid" value={taka(s.totalPaid)} hint={s.lastPayoutAt ? `Last on ${dateText(s.lastPayoutAt)}` : "No payouts yet"} icon={<Wallet />} accent="indigo" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2" title="Next payout day" action={<Badge tone={STATUS_TONE[s.status] ?? "slate"} dot>{STATUS_LABEL[s.status] ?? s.status}</Badge>}>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500"><CalendarClock className="h-3.5 w-3.5" />Scheduled for</p>
              <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 tabular-nums">{dateText(s.nextPayoutDate)}</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Available</p>
              <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 tabular-nums">{taka(s.available)}</p>
            </div>
          </div>
          <p className="mt-2.5 text-[12px] leading-5 text-slate-600">{STATUS_TEXT[s.status]}</p>
          <div className="mt-3.5">
            <div className="flex items-center justify-between text-[11px] text-slate-500"><span>Available share of total balance</span><span className="font-semibold text-slate-700 tabular-nums">{pct}%</span></div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100"><span className="block h-full rounded-full bg-[#4338CA]" style={{ width: `${pct}%` }} /></div>
          </div>
          <dl className="mt-4 grid gap-x-6 gap-y-2 border-t border-slate-100 pt-3 text-[12px] sm:grid-cols-2">
            <div className="flex items-center justify-between"><dt className="text-slate-500">Schedule</dt><dd className="font-medium text-slate-800">{CYCLE_LABEL[s.schedule.cycle]}</dd></div>
            <div className="flex items-center justify-between"><dt className="text-slate-500">Minimum payout</dt><dd className="font-medium text-slate-800 tabular-nums">{taka(s.schedule.minThreshold)}</dd></div>
            <div className="flex items-center justify-between"><dt className="text-slate-500">Settlement window</dt><dd className="font-medium text-slate-800">{s.schedule.holdWindowDays} days</dd></div>
            <div className="flex items-center justify-between"><dt className="text-slate-500">Total balance</dt><dd className="font-medium text-slate-800 tabular-nums">{taka(s.totalBalance)}</dd></div>
          </dl>
        </Card>
        <Card title="How payouts work">
          <ul className="space-y-2.5 text-[12px] leading-5 text-slate-600">
            <li className="flex gap-2"><Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#4338CA]" />Earnings count once an order is delivered, after commission, refunds and returns.</li>
            <li className="flex gap-2"><Hourglass className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#4338CA]" />New earnings wait {s.schedule.holdWindowDays} days for returns and refunds.</li>
            <li className="flex gap-2"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#4338CA]" />FinixMart reviews each payout before sending it to your bank account.</li>
            <li className="flex gap-2"><Wallet className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#4338CA]" />Balances below the minimum carry over to the next payout day.</li>
          </ul>
        </Card>
      </div>

      <div className="mt-4">
        <Card title="Payout history" subtitle="Transfers FinixMart has made to your store">
          {!s.history.length ? <EmptyState icon={<Wallet />} title="No payouts yet" body="Your payouts will be listed here with their bank reference." /> : (
            <div className="-mx-4 overflow-x-auto border-y border-slate-100">
              <table className={tableCls}>
                <thead><tr><th className={thCls}>Payout day</th><th className={`${thCls} text-right`}>Amount</th><th className={thCls}>Status</th><th className={thCls}>Paid on</th><th className={thCls}>Reference</th></tr></thead>
                <tbody>
                  {s.history.map((h) => (
                    <tr key={h.id} className="hover:bg-slate-50/70">
                      <td className={tdCls}><span className="block font-medium text-slate-800">{dateText(h.batch.scheduledFor)}</span><span className="block text-[11px] text-slate-500">{h.batch.batchNumber}</span></td>
                      <td className={`${tdCls} text-right font-semibold tabular-nums text-slate-900`}>{taka(h.amount)}</td>
                      <td className={tdCls}><Badge tone={STATE_TONE[h.status] ?? "slate"} dot>{h.status === "APPROVED" || h.status === "PENDING" ? "processing" : h.status.replace("_", " ").toLowerCase()}</Badge></td>
                      <td className={`${tdCls} text-slate-600`}>{dateText(h.paidAt)}</td>
                      <td className={`${tdCls} text-[12px]`}>{h.reference ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </PayoutShell>
  );
}
