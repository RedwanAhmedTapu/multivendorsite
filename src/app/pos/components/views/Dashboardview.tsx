// app/pos/components/views/DashboardView.tsx
"use client";

import {
  TrendingUp, Receipt, Wallet, Users, ArrowUpRight, ArrowDownRight, Package,
} from "lucide-react";
import { useGetDashboardQuery } from "@/features/posApi";
import { Badge, EmptyState, fmt } from "../../ui";

// NOTE: only `today.netBilling` / `today.salesCount` are confirmed fields on
// DashboardSummary elsewhere in the app. The rest of this view reads
// optional/extended fields defensively (via `d?.x ?? fallback`) so it degrades
// gracefully — wire up the matching keys on your DashboardSummary API type
// (week, month, dueOutstanding, customerCount, topProducts, recentSales,
// paymentBreakdown) to light everything up.

function StatCard({
  icon,
  label,
  value,
  delta,
  tone = "cyan",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  delta?: number;
  tone?: "cyan" | "blue" | "amber" | "purple";
}) {
  const toneCls: Record<string, string> = {
    cyan: "from-cyan-500 to-blue-500",
    blue: "from-blue-600 to-indigo-500",
    amber: "from-amber-500 to-orange-500",
    purple: "from-purple-500 to-fuchsia-500",
  };
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${toneCls[tone]} flex items-center justify-center text-white shadow-md`}>
          {icon}
        </div>
        {delta !== undefined && (
          <span className={`flex items-center gap-0.5 text-[10px] font-bold ${delta >= 0 ? "text-green-600" : "text-red-500"}`}>
            {delta >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {Math.abs(delta).toFixed(1)}%
          </span>
        )}
      </div>
      <div className="text-lg font-extrabold text-slate-900 tracking-tight">{value}</div>
      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-0.5">{label}</div>
    </div>
  );
}

export default function DashboardView() {
  const { data: dashRes, isFetching } = useGetDashboardQuery();
  const dashboard = dashRes?.data;
  const d: any = dashboard ?? {};

  const today = d.today ?? { netBilling: 0, salesCount: 0 };
  const week = d.week ?? null;
  const month = d.month ?? null;
  const dueOutstanding = d.dueOutstanding ?? d.totalDue ?? 0;
  const customerCount = d.customerCount ?? d.customersCount ?? null;
  const topProducts: Array<{ name: string; qty: number; revenue: number }> = d.topProducts ?? [];
  const recentSales: Array<any> = d.recentSales ?? [];
  const paymentBreakdown: Array<{ method: string; amount: number }> = d.paymentBreakdown ?? [];

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="bg-white px-5 py-4 border-b border-slate-100 shrink-0">
        <div className="text-sm font-bold text-slate-800">Dashboard</div>
        <div className="text-[10px] text-slate-400">Sales performance at a glance</div>
      </div>

      <div className="p-5 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard icon={<TrendingUp size={16} />} label="Today's Sales" value={fmt(today.netBilling ?? 0)} tone="cyan" />
          <StatCard icon={<Receipt size={16} />} label="Today's Orders" value={String(today.salesCount ?? 0)} tone="blue" />
          <StatCard icon={<Wallet size={16} />} label="Outstanding Due" value={fmt(dueOutstanding)} tone="amber" />
          <StatCard icon={<Users size={16} />} label="Customers" value={customerCount === null ? "—" : String(customerCount)} tone="purple" />
        </div>

        {(week || month) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {week && (
              <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">This Week</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-extrabold text-slate-900">{fmt(week.netBilling ?? 0)}</span>
                  <span className="text-xs text-slate-400">{week.salesCount ?? 0} orders</span>
                </div>
              </div>
            )}
            {month && (
              <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">This Month</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-extrabold text-slate-900">{fmt(month.netBilling ?? 0)}</span>
                  <span className="text-xs text-slate-400">{month.salesCount ?? 0} orders</span>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <div className="text-xs font-bold text-slate-700 mb-4 flex items-center gap-2">
              <Package size={14} className="text-cyan-500" /> Top Products
            </div>
            {!topProducts.length ? (
              <EmptyState icon={<span className="text-3xl">📦</span>} text="No product data yet" />
            ) : (
              <div className="space-y-2.5">
                {topProducts.slice(0, 6).map((p, i) => (
                  <div key={p.name + i} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-700 truncate">{p.name}</div>
                      <div className="text-[10px] text-slate-400">{p.qty} sold</div>
                    </div>
                    <div className="text-xs font-bold text-cyan-600">{fmt(p.revenue)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <div className="text-xs font-bold text-slate-700 mb-4 flex items-center gap-2">
              <Receipt size={14} className="text-cyan-500" /> Recent Sales
            </div>
            {isFetching && !recentSales.length ? (
              <div className="text-center text-xs text-slate-400 py-6">Loading...</div>
            ) : !recentSales.length ? (
              <EmptyState icon={<span className="text-3xl">🧾</span>} text="No recent sales" />
            ) : (
              <div className="space-y-2">
                {recentSales.slice(0, 6).map((s) => (
                  <div key={s.id} className="flex items-center justify-between border-b border-slate-50 last:border-0 pb-2 last:pb-0">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-700 truncate">{s.invoiceNo}</div>
                      <div className="text-[10px] text-slate-400 truncate">{s.customer?.name ?? "Walk-in"}</div>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <div className="text-xs font-bold text-slate-800">{fmt(s.netBilling)}</div>
                      {s.dueAmount > 0 ? <Badge color="amber">Due</Badge> : <Badge color="green">Paid</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {paymentBreakdown.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <div className="text-xs font-bold text-slate-700 mb-4">Payment Method Breakdown</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {paymentBreakdown.map((p) => (
                <div key={p.method} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{p.method}</div>
                  <div className="text-sm font-extrabold text-slate-800 mt-0.5">{fmt(p.amount)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}