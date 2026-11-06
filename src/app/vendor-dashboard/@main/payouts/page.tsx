"use client";

// Vendor › Payouts: the store owner's own earnings balance, what is payable,
// pending or on hold, the next payout day and payout history. Figures come
// from FinixMart's ledger; subscription payments are a separate page.

import { CalendarClock, CheckCircle2, Clock, Hourglass, Lock, Wallet } from "lucide-react";
import { useVendorPayoutSummaryQuery } from "@/features/billingApi";
import { CYCLE_LABEL, STATE_TONE, dateText, taka } from "@/lib/billing/format";
import { Badge, Card, EmptyState, Notice, PageHeader, Shell, Skeleton, StatCard, tableCls, tdCls, thCls } from "@/components/billing/ui";

const STATUS_TEXT: Record<string, string> = {
  ELIGIBLE: "You'll be included in the next payout.",
  BELOW_THRESHOLD: "Your available balance is below the minimum payout. It carries over to the next payout day.",
  NOTHING_DUE: "Nothing is payable yet. New earnings become payable after the settlement window.",
  ON_HOLD: "Your payouts are on hold. Contact FinixMart support for details.",
};

export default function VendorPayoutsPage() {
  const { data, isLoading, isError } = useVendorPayoutSummaryQuery();
  if (isLoading) return <Shell><Skeleton rows={6} /></Shell>;
  if (isError || !data) return <Shell><Notice tone="red">Payout information isn&apos;t available right now. Only the store owner can open this page.</Notice></Shell>;
  const s = data.data;
  return (
    <Shell>
      <PageHeader title="Payouts" subtitle="Your earnings from FinixMart orders and when they're paid" icon={<Wallet className="h-5 w-5" />} />
      <div className="mb-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard label="Available" value={taka(s.available)} hint="Payable on the next payout day" icon={<CheckCircle2 className="h-5 w-5" />} accent="green" />
        <StatCard label="Pending" value={taka(s.pending)} hint={`Inside the ${s.schedule.holdWindowDays}-day settlement window`} icon={<Hourglass className="h-5 w-5" />} accent="amber" />
        <StatCard label="On hold" value={taka(s.onHold)} hint={Number(s.inProcess) > 0 ? `${taka(s.inProcess)} being processed` : undefined} icon={<Lock className="h-5 w-5" />} accent="rose" />
        <StatCard label="Total paid" value={taka(s.totalPaid)} hint={s.lastPayoutAt ? `Last on ${dateText(s.lastPayoutAt)}` : "No payouts yet"} icon={<Wallet className="h-5 w-5" />} accent="violet" />
      </div>
      <div className="mb-5 grid gap-5 lg:grid-cols-3">
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#312e81] via-[#4f46e5] to-[#9333ea] p-5 text-white shadow-[0_20px_40px_rgba(79,70,229,0.3)] lg:col-span-2">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-white/70"><CalendarClock className="h-3.5 w-3.5" />Next payout day</p>
          <p className="mt-1 text-3xl font-bold">{dateText(s.nextPayoutDate)}</p>
          <p className="mt-2 text-sm text-white/85">{STATUS_TEXT[s.status]}</p>
          <p className="mt-4 text-xs text-white/70">Schedule: {CYCLE_LABEL[s.schedule.cycle]} · minimum {taka(s.schedule.minThreshold)} · total balance {taka(s.totalBalance)}</p>
        </section>
        <Card title="How payouts work">
          <ul className="space-y-2 text-sm text-[#475569]">
            <li className="flex gap-2"><Clock className="mt-0.5 h-4 w-4 shrink-0 text-[#7c3aed]" />Earnings count once an order is delivered, after commission, refunds and returns.</li>
            <li className="flex gap-2"><Hourglass className="mt-0.5 h-4 w-4 shrink-0 text-[#7c3aed]" />New earnings wait {s.schedule.holdWindowDays} days for returns and refunds.</li>
            <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#7c3aed]" />FinixMart reviews each payout before sending it to your bank account.</li>
          </ul>
        </Card>
      </div>
      <Card title="Payout history">
        {!s.history.length ? <EmptyState icon={<Wallet className="h-5 w-5" />} title="No payouts yet" body="Your payouts will be listed here with their bank reference." /> : (
          <div className="overflow-x-auto">
            <table className={tableCls}>
              <thead><tr className="border-b border-[#ede9fe]"><th className={thCls}>Payout day</th><th className={`${thCls} text-right`}>Amount</th><th className={thCls}>Status</th><th className={thCls}>Paid on</th><th className={thCls}>Reference</th></tr></thead>
              <tbody>
                {s.history.map((h) => (
                  <tr key={h.id} className="border-b border-[#f5f3ff] last:border-0">
                    <td className={tdCls}>{dateText(h.batch.scheduledFor)}<span className="block text-xs text-[#94a3b8]">{h.batch.batchNumber}</span></td>
                    <td className={`${tdCls} text-right font-semibold`}>{taka(h.amount)}</td>
                    <td className={tdCls}><Badge tone={STATE_TONE[h.status]}>{h.status === "APPROVED" || h.status === "PENDING" ? "processing" : h.status.replace("_", " ").toLowerCase()}</Badge></td>
                    <td className={tdCls}>{dateText(h.paidAt)}</td>
                    <td className={`${tdCls} text-xs`}>{h.reference ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </Shell>
  );
}
