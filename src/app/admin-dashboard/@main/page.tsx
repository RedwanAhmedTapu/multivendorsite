"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  DollarSign, ShoppingCart, Users, Store, Clock, PackageX,
  RotateCcw, Truck, TrendingUp, TrendingDown, Minus, CalendarDays,
} from "lucide-react";
import { HrmWorkspaceEntry } from "@/components/hrm/HrmWorkspaceEntry";
import {
  useGetAdminDashboardSummaryQuery,
  type DashboardPreset,
  type DashboardQueryArgs,
} from "@/features/adminDashboardApi";
import {
  ChartCard, EmptyState, fmtMoney, Sparkline, RadialGauge, MiniBars,
  RevenueTrendChart, StatusDonut, PaymentDonut, CategoryBars, CustomerGrowthChart,
  TopVendorsList, TopProductsList, RecentOrdersList, PendingOrdersList,
  LowStockList, RecentPaymentsList, NewCustomersList,
} from "@/components/admin/dashboard/DashboardWidgets";

// ── delta chip ───────────────────────────────────────────────────────────────
function Delta({ current, previous }: { current: number; previous: number }) {
  if (!previous) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400">
        <Minus className="h-3 w-3" /> no prior data
      </span>
    );
  }
  const pct = ((current - previous) / previous) * 100;
  const up = pct >= 0;
  const Icon = pct === 0 ? Minus : up ? TrendingUp : TrendingDown;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
        pct === 0 ? "bg-slate-100 text-slate-500" : up ? "bg-emerald-100/80 text-emerald-600" : "bg-rose-100/80 text-rose-600"
      }`}
    >
      <Icon className="h-3 w-3" />
      {up && pct > 0 ? "+" : ""}
      {pct.toFixed(1)}%
    </span>
  );
}

// ── colorful stat card with a micro visual ───────────────────────────────────
type Tint = {
  card: string;      // card background + border
  icon: string;      // icon chip gradient
  color: string;     // accent hex (sparkline/gauge)
};

function StatCard({
  icon: Icon, label, value, current, previous, href, tint, visual,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  value: string;
  current?: number;
  previous?: number;
  href?: string;
  tint: Tint;
  visual?: React.ReactNode;
}) {
  const body = (
    <div
      className={`group h-full rounded-2xl border p-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_16px_-6px_rgba(79,70,229,0.18)] ${tint.card}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tint.icon} shadow-sm`}>
          <Icon className="h-[18px] w-[18px] text-white" />
        </div>
        {visual}
      </div>
      <p className="mt-2.5 text-[22px] font-black leading-none tracking-tight text-slate-900">{value}</p>
      <div className="mt-1.5 flex items-center justify-between gap-2">
        <p className="text-[12px] font-medium text-slate-500">{label}</p>
        {current !== undefined && previous !== undefined && <Delta current={current} previous={previous} />}
      </div>
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

function StatCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-slate-100 bg-white p-3.5 shadow-sm">
      <div className="flex justify-between">
        <div className="h-10 w-10 rounded-xl bg-slate-100" />
        <div className="h-12 w-24 rounded-lg bg-slate-50" />
      </div>
      <div className="mt-2.5 h-6 w-24 rounded bg-slate-100" />
      <div className="mt-2 h-3.5 w-32 rounded bg-slate-100" />
    </div>
  );
}

function ChartSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-2xl border border-slate-100 bg-white p-4 shadow-sm ${className}`}>
      <div className="h-4 w-40 rounded bg-slate-100" />
      <div className="mt-3 h-[200px] rounded-xl bg-slate-50" />
    </div>
  );
}

// ── filter bar ───────────────────────────────────────────────────────────────
const PRESETS: { key: Exclude<DashboardPreset, "custom">; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "7d", label: "7D" },
  { key: "30d", label: "30D" },
  { key: "90d", label: "90D" },
  { key: "year", label: "Year" },
];

function FilterBar({
  preset, onPreset, customFrom, customTo, onCustom,
}: {
  preset: DashboardPreset;
  onPreset: (p: DashboardPreset) => void;
  customFrom: string;
  customTo: string;
  onCustom: (from: string, to: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
        {PRESETS.map((p) => (
          <button
            key={p.key}
            onClick={() => onPreset(p.key)}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              preset === p.key
                ? "bg-gradient-to-r from-[#4f46e5] to-[#6366f1] text-white shadow-[0_4px_12px_-4px_rgba(79,70,229,0.5)]"
                : "text-slate-500 hover:bg-indigo-50 hover:text-[#4f46e5]"
            }`}
          >
            {p.label}
          </button>
        ))}
        <button
          onClick={() => onPreset("custom")}
          className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
            preset === "custom"
              ? "bg-gradient-to-r from-[#4f46e5] to-[#6366f1] text-white shadow-[0_4px_12px_-4px_rgba(79,70,229,0.5)]"
              : "text-slate-500 hover:bg-indigo-50 hover:text-[#4f46e5]"
          }`}
        >
          <CalendarDays className="h-3.5 w-3.5" /> Custom
        </button>
      </div>
      {preset === "custom" && (
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm">
          <input
            type="date"
            value={customFrom}
            onChange={(e) => onCustom(e.target.value, customTo)}
            className="rounded-lg border border-slate-100 bg-slate-50 px-2 py-1 text-xs text-slate-600 outline-none focus:border-[#4f46e5]"
          />
          <span className="text-xs text-slate-400">→</span>
          <input
            type="date"
            value={customTo}
            onChange={(e) => onCustom(customFrom, e.target.value)}
            className="rounded-lg border border-slate-100 bg-slate-50 px-2 py-1 text-xs text-slate-600 outline-none focus:border-[#4f46e5]"
          />
        </div>
      )}
    </div>
  );
}

// ── tints ────────────────────────────────────────────────────────────────────
const TINTS: Record<string, Tint> = {
  indigo:  { card: "bg-indigo-50/60 border-indigo-100",   icon: "bg-gradient-to-br from-[#4f46e5] to-[#6366f1]", color: "#4f46e5" },
  violet:  { card: "bg-violet-50/60 border-violet-100",   icon: "bg-gradient-to-br from-[#7c3aed] to-[#8b5cf6]", color: "#7c3aed" },
  cyan:    { card: "bg-cyan-50/60 border-cyan-100",       icon: "bg-gradient-to-br from-[#06b6d4] to-[#0891b2]", color: "#06b6d4" },
  amber:   { card: "bg-amber-50/60 border-amber-100",     icon: "bg-gradient-to-br from-[#f59e0b] to-[#f97316]", color: "#f59e0b" },
  emerald: { card: "bg-emerald-50/60 border-emerald-100", icon: "bg-gradient-to-br from-[#10b981] to-[#059669]", color: "#10b981" },
  rose:    { card: "bg-rose-50/60 border-rose-100",       icon: "bg-gradient-to-br from-[#f43f5e] to-[#e11d48]", color: "#f43f5e" },
  purple:  { card: "bg-purple-50/60 border-purple-100",   icon: "bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed]", color: "#8b5cf6" },
};

// ── page ─────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [preset, setPreset] = useState<DashboardPreset>("30d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const queryArgs: DashboardQueryArgs = useMemo(() => {
    if (preset === "custom" && customFrom && customTo) {
      return { preset: "custom", from: customFrom, to: `${customTo}T23:59:59.999Z` };
    }
    return { preset: preset === "custom" ? "30d" : preset };
  }, [preset, customFrom, customTo]);

  const { data, isLoading, isError, refetch, isFetching } = useGetAdminDashboardSummaryQuery(queryArgs);

  const s = data?.stats;

  // micro-visual series (all from the same real payload)
  const revenueSeries = data?.revenueTrend.map((d) => d.revenue) ?? [];
  const ordersSeries = data?.revenueTrend.map((d) => d.orders) ?? [];
  const customerSeries = data?.customerGrowth.map((d) => d.count) ?? [];
  const aovSeries = data
    ? data.revenueTrend.map((d) => (d.orders ? Math.round(d.revenue / Math.max(d.orders, 1)) : 0))
    : [];
  const lowStockSeries = data?.lists.lowStock.map((l) => l.available) ?? [];
  const pendingShare = s && s.orders > 0 ? Math.round((s.pendingOrders / Math.max(s.pendingOrders + s.orders, 1)) * 100) : 0;
  const vendorShare = s && s.totalVendors > 0 ? Math.round((s.activeVendors / s.totalVendors) * 100) : 0;

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-[1400px] space-y-3">
        {/* header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-900">Dashboard</h1>
            <p className="text-xs text-slate-400">
              {data
                ? `${new Date(data.range.from).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – ${new Date(data.range.to).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} · compared with the previous period`
                : "Platform performance at a glance"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <HrmWorkspaceEntry />
            <FilterBar
              preset={preset}
              onPreset={setPreset}
              customFrom={customFrom}
              customTo={customTo}
              onCustom={(f, t) => { setCustomFrom(f); setCustomTo(t); }}
            />
          </div>
        </div>

        {isError ? (
          <div className="rounded-2xl border border-rose-100 bg-white p-10 text-center shadow-sm">
            <p className="text-sm font-semibold text-rose-600">Couldn&apos;t load dashboard analytics.</p>
            <p className="mt-1 text-xs text-slate-400">Admin access is required for this data.</p>
            <button
              onClick={() => refetch()}
              className="mt-4 rounded-xl bg-gradient-to-r from-[#4f46e5] to-[#6366f1] px-4 py-2 text-xs font-bold text-white shadow-[0_4px_12px_-4px_rgba(79,70,229,0.5)]"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            {/* primary stats */}
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
              {isLoading || !s ? (
                <>
                  <StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton />
                </>
              ) : (
                <>
                  <StatCard
                    icon={DollarSign} label="Revenue (delivered)" value={fmtMoney(s.revenue)}
                    current={s.revenue} previous={s.previous.revenue}
                    href="/admin-dashboard/order" tint={TINTS.indigo}
                    visual={<Sparkline values={revenueSeries} color={TINTS.indigo.color} />}
                  />
                  <StatCard
                    icon={ShoppingCart} label="Orders" value={s.orders.toLocaleString()}
                    current={s.orders} previous={s.previous.orders}
                    href="/admin-dashboard/order" tint={TINTS.violet}
                    visual={<Sparkline values={ordersSeries} color={TINTS.violet.color} />}
                  />
                  <StatCard
                    icon={Users} label="New customers" value={s.newCustomers.toLocaleString()}
                    current={s.newCustomers} previous={s.previous.newCustomers}
                    href="/admin-dashboard/customer-manage/accountmanage" tint={TINTS.cyan}
                    visual={<Sparkline values={customerSeries} color={TINTS.cyan.color} />}
                  />
                  <StatCard
                    icon={TrendingUp} label="Avg. order value" value={fmtMoney(s.aov)}
                    href="/admin-dashboard/order" tint={TINTS.amber}
                    visual={<Sparkline values={aovSeries} color={TINTS.amber.color} />}
                  />
                </>
              )}
            </div>

            {/* secondary stats */}
            <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
              {isLoading || !s ? (
                <>
                  <StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton />
                </>
              ) : (
                <>
                  <StatCard
                    icon={Clock} label="Pending orders" value={s.pendingOrders.toLocaleString()}
                    href="/admin-dashboard/order" tint={TINTS.amber}
                    visual={<RadialGauge pct={pendingShare} color={TINTS.amber.color} label={`${pendingShare}%`} />}
                  />
                  <StatCard
                    icon={Store} label="Active vendors" value={s.activeVendors.toLocaleString()}
                    href="/admin-dashboard/vendormanage/vendor-approval" tint={TINTS.emerald}
                    visual={<RadialGauge pct={vendorShare} color={TINTS.emerald.color} label={`${vendorShare}%`} />}
                  />
                  <StatCard
                    icon={PackageX} label="Low-stock variants" value={s.lowStockCount.toLocaleString()}
                    href="/admin-dashboard/products" tint={TINTS.rose}
                    visual={<MiniBars values={lowStockSeries} color={TINTS.rose.color} />}
                  />
                  <StatCard
                    icon={Truck} label="Avg. fulfillment" value={`${s.fulfillment.avgHours}h`}
                    href="/admin-dashboard/order" tint={TINTS.purple}
                    visual={<RadialGauge pct={s.fulfillment.deliveredShare} color={TINTS.purple.color} label={`${Math.round(s.fulfillment.deliveredShare)}%`} />}
                  />
                </>
              )}
            </div>

            {/* charts row 1 */}
            <div className="grid grid-cols-1 gap-2.5 xl:grid-cols-3">
              {isLoading || !data ? (
                <>
                  <ChartSkeleton className="xl:col-span-2" /><ChartSkeleton />
                </>
              ) : (
                <>
                  <ChartCard
                    title="Revenue trend"
                    subtitle="Delivered revenue & orders per day"
                    className="xl:col-span-2"
                    action={<Delta current={s!.revenue} previous={s!.previous.revenue} />}
                  >
                    <RevenueTrendChart data={data.revenueTrend} />
                  </ChartCard>
                  <ChartCard title="Order status" subtitle="Distribution in period">
                    <StatusDonut data={data.ordersByStatus} />
                  </ChartCard>
                </>
              )}
            </div>

            {/* charts row 2 */}
            <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2 xl:grid-cols-3">
              {isLoading || !data ? (
                <>
                  <ChartSkeleton /><ChartSkeleton /><ChartSkeleton />
                </>
              ) : (
                <>
                  <ChartCard title="Payment methods" subtitle="Order count & value by method">
                    <PaymentDonut data={data.paymentsByMethod} />
                  </ChartCard>
                  <ChartCard title="Sales by category" subtitle="Delivered revenue, top categories">
                    <CategoryBars data={data.salesByCategory} />
                  </ChartCard>
                  <ChartCard
                    title="Customer growth"
                    subtitle="New sign-ups per day"
                    action={<Delta current={s!.newCustomers} previous={s!.previous.newCustomers} />}
                  >
                    <CustomerGrowthChart data={data.customerGrowth} />
                  </ChartCard>
                </>
              )}
            </div>

            {/* leaders row */}
            <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2">
              {isLoading || !data ? (
                <>
                  <ChartSkeleton /><ChartSkeleton />
                </>
              ) : (
                <>
                  <ChartCard title="Top vendors" subtitle="By delivered revenue">
                    <TopVendorsList data={data.topVendors} />
                  </ChartCard>
                  <ChartCard title="Best-selling products" subtitle="By units sold (delivered)">
                    <TopProductsList data={data.topProducts} />
                  </ChartCard>
                </>
              )}
            </div>

            {/* operations row */}
            <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-3">
              {isLoading || !data ? (
                <>
                  <ChartSkeleton /><ChartSkeleton /><ChartSkeleton />
                </>
              ) : (
                <>
                  <ChartCard title="Pending orders" subtitle="Newest first" action={
                    <Link href="/admin-dashboard/order" className="text-xs font-bold text-[#4f46e5] hover:underline">View all</Link>
                  }>
                    <PendingOrdersList data={data.lists.pendingOrders} />
                  </ChartCard>
                  <ChartCard title="Low stock" subtitle="Variants at or below 5 available" action={
                    <Link href="/admin-dashboard/products" className="text-xs font-bold text-[#4f46e5] hover:underline">Manage</Link>
                  }>
                    <LowStockList data={data.lists.lowStock} />
                  </ChartCard>
                  <ChartCard title="New customers" subtitle="Latest sign-ups" action={
                    <Link href="/admin-dashboard/customer-manage/accountmanage" className="text-xs font-bold text-[#4f46e5] hover:underline">View all</Link>
                  }>
                    <NewCustomersList data={data.lists.newCustomers} />
                  </ChartCard>
                </>
              )}
            </div>

            {/* activity row */}
            <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2">
              {isLoading || !data ? (
                <>
                  <ChartSkeleton /><ChartSkeleton />
                </>
              ) : (
                <>
                  <ChartCard title="Recent orders" subtitle="Latest across all statuses" action={
                    <Link href="/admin-dashboard/order" className="text-xs font-bold text-[#4f46e5] hover:underline">View all</Link>
                  }>
                    <RecentOrdersList data={data.lists.recentOrders} />
                  </ChartCard>
                  <ChartCard title="Recent transactions" subtitle="Latest completed payments">
                    <RecentPaymentsList data={data.lists.recentPayments} />
                  </ChartCard>
                </>
              )}
            </div>

            {/* refunds strip */}
            {!isLoading && data && s && (
              <ChartCard title="Refunds" subtitle="Requests in period">
                {data.refunds.byStatus.length ? (
                  <div className="flex flex-wrap items-center gap-5">
                    <div>
                      <p className="text-2xl font-black text-slate-900">{fmtMoney(s.refundAmount)}</p>
                      <p className="text-xs text-slate-400">{s.refundCount} requests · {s.refundRate}% of revenue</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {data.refunds.byStatus.map((r) => (
                        <span key={r.status} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">
                          <RotateCcw className="h-3 w-3 text-slate-400" />
                          {r.status}: {r.count} ({fmtMoney(r.amount)})
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <EmptyState label="No refund requests in this period" />
                )}
              </ChartCard>
            )}
          </>
        )}

        {isFetching && !isLoading && (
          <p className="text-right text-[11px] font-medium text-slate-400">Refreshing…</p>
        )}
      </div>
    </div>
  );
}
