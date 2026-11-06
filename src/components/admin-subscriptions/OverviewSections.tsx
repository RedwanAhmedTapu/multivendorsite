"use client";

// Admin › Subscriptions: Overview, Reports and Settings sections.

import { useEffect, useState } from "react";
import { AlertTriangle, BadgeCheck, CalendarClock, CreditCard, Gift, Layers, Users, Wallet } from "lucide-react";
import { apiError, useSubsOverviewQuery, useSubsSetSettingsMutation, useSubsSettingsQuery, type SubSettings } from "@/features/billingApi";
import { taka } from "@/lib/billing/format";
import { Badge, Button, Card, Field, MonthlyBars, Notice, ShareBars, Skeleton, StatCard, Toggle, inputCls, tableCls, tdCls, thCls } from "@/components/billing/ui";

export function OverviewSection({ go }: { go: (tab: string) => void }) {
  const { data, isLoading, isError } = useSubsOverviewQuery();
  if (isLoading) return <Skeleton rows={6} />;
  if (isError || !data) return <Notice tone="red">Couldn&apos;t load the overview. Is the subscription migration applied?</Notice>;
  const o = data.data;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard label="Active subscribers" value={o.totals.active} hint={o.totals.grace ? `${o.totals.grace} in grace period` : "All in good standing"} icon={<Users className="h-5 w-5" />} accent="violet" />
        <StatCard label="Revenue this month" value={taka(o.totals.revenueThisMonth)} hint={`${taka(o.totals.revenue12m)} in 12 months`} icon={<Wallet className="h-5 w-5" />} accent="indigo" />
        <StatCard label="Ending soon" value={o.totals.expiringSoon} hint="Within the reminder window" icon={<CalendarClock className="h-5 w-5" />} accent="amber" />
        <StatCard label="Pending payments" value={o.totals.pendingPayments} hint="Waiting for your confirmation" icon={<CreditCard className="h-5 w-5" />} accent="blue" />
      </div>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard label="Trials" value={o.totals.trials} icon={<BadgeCheck className="h-5 w-5" />} accent="green" />
        <StatCard label="Expired" value={o.totals.expired} icon={<AlertTriangle className="h-5 w-5" />} accent="rose" />
        <StatCard label="Live offers" value={o.totals.activeOffers} icon={<Gift className="h-5 w-5" />} accent="violet" />
        <StatCard label="Plans" value={o.plans.published} hint={`${o.plans.draft} draft · ${o.plans.archived} archived`} icon={<Layers className="h-5 w-5" />} accent="indigo" />
      </div>
      {o.totals.pendingPayments > 0 && (
        <Notice tone="amber">
          {o.totals.pendingPayments} plan request{o.totals.pendingPayments === 1 ? " is" : "s are"} waiting.{" "}
          <button className="font-semibold underline" onClick={() => go("transactions")}>Review payments</button>
        </Notice>
      )}
      <div className="grid gap-5 xl:grid-cols-5">
        <Card title="Subscription revenue (last 12 months)" className="xl:col-span-3">
          <MonthlyBars label="Subscription revenue by month" data={o.revenueByMonth.map((m) => ({ month: m.month, value: Number(m.revenue) }))} />
        </Card>
        <Card title="Active subscribers by plan" className="xl:col-span-2">
          <ShareBars rows={o.byPackage.filter((p) => p.status !== "ARCHIVED" || p.activeSubscribers > 0).map((p) => ({ label: p.name, value: p.activeSubscribers, color: p.color }))} valueLabel={(v) => `${v} vendor${v === 1 ? "" : "s"}`} />
        </Card>
      </div>
    </div>
  );
}

export function ReportsSection() {
  const { data, isLoading } = useSubsOverviewQuery();
  if (isLoading || !data) return <Skeleton rows={6} />;
  const o = data.data;
  const total = o.revenueByMonth.reduce((s, m) => s + Number(m.revenue), 0);
  return (
    <div className="space-y-5">
      <Card title="Revenue by plan (12 months)">
        <div className="overflow-x-auto">
          <table className={tableCls}>
            <thead><tr className="border-b border-[#ede9fe]"><th className={thCls}>Plan</th><th className={thCls}>Status</th><th className={thCls}>Active subscribers</th><th className={`${thCls} text-right`}>Revenue</th><th className={`${thCls} text-right`}>Share</th></tr></thead>
            <tbody>
              {o.byPackage.map((p) => (
                <tr key={p.id} className="border-b border-[#f5f3ff] last:border-0">
                  <td className={tdCls}><span className="mr-2 inline-block h-2.5 w-2.5 rounded-full align-middle" style={{ background: p.color || "#7c3aed" }} />{p.name}</td>
                  <td className={tdCls}><Badge tone={p.status === "PUBLISHED" ? "green" : "slate"}>{p.status.toLowerCase()}</Badge></td>
                  <td className={tdCls}>{p.activeSubscribers}</td>
                  <td className={`${tdCls} text-right font-medium`}>{taka(p.revenue12m)}</td>
                  <td className={`${tdCls} text-right text-[#64748b]`}>{total ? `${Math.round((Number(p.revenue12m) / total) * 100)}%` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Card title="Monthly revenue">
        <div className="overflow-x-auto">
          <table className={tableCls}>
            <thead><tr className="border-b border-[#ede9fe]"><th className={thCls}>Month</th><th className={`${thCls} text-right`}>Revenue</th></tr></thead>
            <tbody>{[...o.revenueByMonth].reverse().map((m) => <tr key={m.month} className="border-b border-[#f5f3ff] last:border-0"><td className={tdCls}>{m.month}</td><td className={`${tdCls} text-right`}>{taka(m.revenue)}</td></tr>)}</tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-[#64748b]">Revenue counts PAID subscription payments by payment date (Asia/Dhaka). Vendor earnings and payouts are reported separately under Payouts.</p>
      </Card>
    </div>
  );
}

export function SettingsSection() {
  const { data, isLoading } = useSubsSettingsQuery();
  const [save, { isLoading: saving }] = useSubsSetSettingsMutation();
  const [form, setForm] = useState<SubSettings | null>(null);
  const [msg, setMsg] = useState<{ tone: "green" | "red"; text: string } | null>(null);
  useEffect(() => { if (data?.data) setForm(data.data); }, [data]);
  if (isLoading || !form) return <Skeleton rows={4} />;
  const submit = async () => {
    setMsg(null);
    try {
      await save(form).unwrap();
      setMsg({ tone: "green", text: "Settings saved." });
    } catch (e) {
      setMsg({ tone: "red", text: apiError(e) });
    }
  };
  return (
    <Card title="Subscription settings">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Grace period (days)" hint="After a plan ends, features keep working this long. Each subscription can override it.">
          <input type="number" min={0} max={60} className={inputCls} value={form.graceDays} onChange={(e) => setForm({ ...form, graceDays: Number(e.target.value) })} />
        </Field>
        <Field label="Renewal reminder (days before the end)" hint="One in-app reminder per end date. 0 turns reminders off.">
          <input type="number" min={0} max={60} className={inputCls} value={form.reminderDays} onChange={(e) => setForm({ ...form, reminderDays: Number(e.target.value) })} />
        </Field>
        <Field label="When a vendor changes plan" hint="Renewals of the same plan always stack on the current end date.">
          <select className={inputCls} value={form.changeStartsFrom} onChange={(e) => setForm({ ...form, changeStartsFrom: e.target.value as SubSettings["changeStartsFrom"] })}>
            <option value="NOW">New plan starts immediately</option>
            <option value="CURRENT_END">New plan starts when the current one ends</option>
          </select>
        </Field>
      </div>
      <div className="mt-5 rounded-xl border border-[#ede9fe] bg-[#faf9ff] p-4">
        <Toggle
          checked={form.enforcement === "monitor"}
          onChange={(v) => setForm({ ...form, enforcement: v ? "monitor" : "enforce" })}
          label="Monitor mode (don't block anything)"
          hint="Platform-wide safety switch: features that would be denied are only logged. Blocking per feature is switched on under Feature Management."
        />
      </div>
      {msg && <div className="mt-4"><Notice tone={msg.tone}>{msg.text}</Notice></div>}
      <div className="mt-5 flex justify-end"><Button onClick={submit} loading={saving}>Save settings</Button></div>
    </Card>
  );
}
