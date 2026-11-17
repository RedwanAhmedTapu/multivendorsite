"use client";

import Link from "next/link";
import {
  AreaChart, Area, LineChart, Line, PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import type {
  AdminDashboardSummary,
} from "@/features/adminDashboardApi";

// ── palette ──────────────────────────────────────────────────────────────────
export const CHART_COLORS = [
  "#4f46e5", "#7c3aed", "#06b6d4", "#f59e0b", "#f43f5e", "#10b981",
  "#8b5cf6", "#64748b",
];

export const STATUS_COLORS: Record<string, string> = {
  DELIVERED: "#10b981",
  PENDING: "#f59e0b",
  CONFIRMED: "#4f46e5",
  PROCESSING: "#6366f1",
  PACKAGING: "#8b5cf6",
  SHIPPED: "#06b6d4",
  CANCELLED: "#f43f5e",
  RETURNED: "#f97316",
  REFUNDED: "#e11d48",
  FAILED_TO_DELIVER: "#64748b",
};

const prettyStatus = (s: string) =>
  s.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());

export const fmtMoney = (n: number) =>
  `৳${Math.round(n).toLocaleString("en-IN")}`;

// ── shared card shell ────────────────────────────────────────────────────────
export function ChartCard({
  title,
  subtitle,
  children,
  className = "",
  action,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-2xl border border-slate-200/70 bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.05)] transition-shadow hover:shadow-[0_4px_16px_-4px_rgba(79,70,229,0.12)] ${className}`}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[14px] font-bold text-slate-800">{title}</h3>
          {subtitle && <p className="mt-0.5 text-[11px] text-slate-400">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

export function EmptyState({ label = "No data for this period" }: { label?: string }) {
  return (
    <div className="flex h-full min-h-[140px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
      <p className="text-xs text-slate-400">{label}</p>
    </div>
  );
}

// ── stat-card micro visuals (all from real series/counts) ────────────────────
export function Sparkline({ values, color }: { values: number[]; color: string }) {
  const data = values.map((v, i) => ({ i, v }));
  const id = `spark-${color.replace("#", "")}`;
  if (!data.length) data.push({ i: 0, v: 0 });
  return (
    <div className="h-12 w-24 shrink-0">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2} fill={`url(#${id})`} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function RadialGauge({ pct, color, label }: { pct: number; color: string; label: string }) {
  const clamped = Math.max(0, Math.min(100, pct));
  const data = [
    { name: "value", value: clamped },
    { name: "rest", value: 100 - clamped },
  ];
  return (
    <div className="relative h-14 w-14 shrink-0">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" innerRadius={20} outerRadius={27} startAngle={90} endAngle={-270} strokeWidth={0} cornerRadius={4} isAnimationActive={false}>
            <Cell fill={color} />
            <Cell fill="#e8eaf6" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <span className="text-[10px] font-black" style={{ color }}>{label}</span>
      </div>
    </div>
  );
}

export function MiniBars({ values, color }: { values: number[]; color: string }) {
  const data = values.map((v, i) => ({ i, v }));
  if (!data.length) data.push({ i: 0, v: 0 });
  return (
    <div className="h-12 w-24 shrink-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }} barCategoryGap="25%">
          <Bar dataKey="v" radius={[3, 3, 0, 0]} isAnimationActive={false}>
            {data.map((_, i) => (
              <Cell key={i} fill={color} fillOpacity={0.45 + (0.55 * (i + 1)) / data.length} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── tooltips ─────────────────────────────────────────────────────────────────
function MoneyTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-100 bg-white px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-semibold text-slate-700">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color || p.fill }} className="font-medium">
          {p.name}: {p.dataKey === "revenue" || p.name === "Revenue" ? fmtMoney(p.value) : p.value}
        </p>
      ))}
    </div>
  );
}

// ── revenue trend ────────────────────────────────────────────────────────────
export function RevenueTrendChart({ data }: { data: AdminDashboardSummary["revenueTrend"] }) {
  if (!data.length) return <EmptyState />;
  const chartData = data.map((d) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
  }));
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.28} />
            <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="ordGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.20} />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#eef0fb" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} minTickGap={24} />
        <YAxis
          yAxisId="rev"
          tick={{ fontSize: 11, fill: "#94a3b8" }}
          tickLine={false}
          axisLine={false}
          width={60}
          tickFormatter={(v: number) => (v >= 1000 ? `৳${(v / 1000).toFixed(0)}k` : `৳${v}`)}
        />
        <YAxis yAxisId="ord" orientation="right" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} width={32} allowDecimals={false} />
        <Tooltip content={<MoneyTooltip />} />
        <Area yAxisId="rev" type="monotone" dataKey="revenue" name="Revenue" stroke="#4f46e5" strokeWidth={2.5} fill="url(#revGrad)" />
        <Area yAxisId="ord" type="monotone" dataKey="orders" name="Orders" stroke="#06b6d4" strokeWidth={2} fill="url(#ordGrad)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ── donuts ───────────────────────────────────────────────────────────────────
export function StatusDonut({ data }: { data: AdminDashboardSummary["ordersByStatus"] }) {
  const rows = data.filter((d) => d.count > 0);
  if (!rows.length) return <EmptyState />;
  const total = rows.reduce((a, r) => a + r.count, 0);
  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row">
      <div className="relative h-[170px] w-[170px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={rows} dataKey="count" nameKey="status" innerRadius={52} outerRadius={78} paddingAngle={3} strokeWidth={0}>
              {rows.map((r) => (
                <Cell key={r.status} fill={STATUS_COLORS[r.status] ?? "#94a3b8"} />
              ))}
            </Pie>
            <Tooltip content={<MoneyTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-black text-slate-800">{total}</span>
          <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">orders</span>
        </div>
      </div>
      <ul className="w-full space-y-1.5">
        {rows.map((r) => (
          <li key={r.status} className="flex items-center gap-2 text-xs">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[r.status] ?? "#94a3b8" }} />
            <span className="flex-1 font-medium text-slate-600">{prettyStatus(r.status)}</span>
            <span className="font-bold text-slate-800">{r.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PaymentDonut({ data }: { data: AdminDashboardSummary["paymentsByMethod"] }) {
  const rows = data.filter((d) => d.count > 0);
  if (!rows.length) return <EmptyState />;
  const total = rows.reduce((a, r) => a + r.count, 0);
  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row">
      <div className="relative h-[170px] w-[170px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={rows} dataKey="count" nameKey="method" innerRadius={52} outerRadius={78} paddingAngle={3} strokeWidth={0}>
              {rows.map((r, i) => (
                <Cell key={r.method} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<MoneyTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-black text-slate-800">{total}</span>
          <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">orders</span>
        </div>
      </div>
      <ul className="w-full space-y-1.5">
        {rows.map((r, i) => (
          <li key={r.method} className="flex items-center gap-2 text-xs">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
            <span className="flex-1 font-medium text-slate-600">{r.method}</span>
            <span className="font-bold text-slate-800">{r.count}</span>
            <span className="font-semibold text-slate-400">{fmtMoney(r.amount)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── category bars (horizontal) ───────────────────────────────────────────────
export function CategoryBars({ data }: { data: AdminDashboardSummary["salesByCategory"] }) {
  const rows = data.filter((d) => d.revenue > 0);
  if (!rows.length) return <EmptyState />;
  return (
    <ResponsiveContainer width="100%" height={Math.max(190, rows.length * 42)}>
      <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eef0fb" horizontal={false} />
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 11, fill: "#475569", fontWeight: 600 }}
          tickLine={false}
          axisLine={false}
          width={110}
        />
        <Tooltip content={<MoneyTooltip />} />
        <Bar dataKey="revenue" name="Revenue" radius={[0, 8, 8, 0]} barSize={16}>
          {rows.map((_, i) => (
            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── customer growth ──────────────────────────────────────────────────────────
export function CustomerGrowthChart({ data }: { data: AdminDashboardSummary["customerGrowth"] }) {
  if (!data.length) return <EmptyState />;
  const chartData = data.map((d) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
  }));
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eef0fb" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} minTickGap={24} />
        <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} width={32} allowDecimals={false} />
        <Tooltip content={<MoneyTooltip />} />
        <Line type="monotone" dataKey="count" name="New customers" stroke="#7c3aed" strokeWidth={2.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ── progress lists ───────────────────────────────────────────────────────────
export function TopVendorsList({ data }: { data: AdminDashboardSummary["topVendors"] }) {
  if (!data.length) return <EmptyState />;
  const max = Math.max(...data.map((v) => v.revenue), 1);
  return (
    <ul className="space-y-3">
      {data.map((v, i) => (
        <li key={v.vendorId}>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700">
              <span className="mr-2 text-slate-400">{String(i + 1).padStart(2, "0")}</span>
              {v.storeName}
            </span>
            <span className="font-bold text-slate-800">{fmtMoney(v.revenue)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.round((v.revenue / max) * 100)}%`,
                background: `linear-gradient(90deg, ${CHART_COLORS[i % CHART_COLORS.length]}, ${CHART_COLORS[(i + 1) % CHART_COLORS.length]})`,
              }}
            />
          </div>
          <p className="mt-0.5 text-[11px] text-slate-400">{v.orders} delivered consignments</p>
        </li>
      ))}
    </ul>
  );
}

export function TopProductsList({ data }: { data: AdminDashboardSummary["topProducts"] }) {
  if (!data.length) return <EmptyState />;
  const max = Math.max(...data.map((p) => p.units), 1);
  return (
    <ul className="space-y-3">
      {data.map((p, i) => (
        <li key={p.productId}>
          <div className="mb-1 flex items-center justify-between gap-2 text-xs">
            <span className="truncate font-semibold text-slate-700">
              <span className="mr-2 text-slate-400">{String(i + 1).padStart(2, "0")}</span>
              {p.name}
            </span>
            <span className="shrink-0 font-bold text-slate-800">{p.units} sold</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.round((p.units / max) * 100)}%`,
                background: `linear-gradient(90deg, ${CHART_COLORS[i % CHART_COLORS.length]}, ${CHART_COLORS[(i + 1) % CHART_COLORS.length]})`,
              }}
            />
          </div>
          <p className="mt-0.5 text-[11px] text-slate-400">{fmtMoney(p.revenue)} revenue</p>
        </li>
      ))}
    </ul>
  );
}

// ── premium bordered mini-tables ─────────────────────────────────────────────
function ListTable({
  head,
  children,
}: {
  head: React.ReactNode[];
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200/80">
      <div className="grid grid-cols-[1fr_auto_auto] items-center gap-3 border-b border-slate-200/80 bg-gradient-to-r from-slate-50 to-indigo-50/40 px-3 py-2">
        {head.map((h, i) => (
          <span
            key={i}
            className={`text-[10px] font-black uppercase tracking-[0.12em] text-slate-400 ${i === 2 ? "text-right" : i === 1 ? "text-center" : ""}`}
          >
            {h}
          </span>
        ))}
      </div>
      <div className="divide-y divide-slate-100">{children}</div>
    </div>
  );
}

function RowLink({ href, children, hoverClass = "hover:bg-indigo-50/60" }: { href: string; children: React.ReactNode; hoverClass?: string }) {
  return (
    <Link href={href} className={`grid grid-cols-[1fr_auto_auto] items-center gap-3 px-3 py-2.5 transition-colors ${hoverClass}`}>
      {children}
    </Link>
  );
}

const statusPill = (status: string) => {
  const color = STATUS_COLORS[status] ?? "#64748b";
  return (
    <span
      className="inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-[10px] font-bold"
      style={{ backgroundColor: `${color}14`, color, borderColor: `${color}33` }}
    >
      {prettyStatus(status)}
    </span>
  );
};

export function RecentOrdersList({ data }: { data: AdminDashboardSummary["lists"]["recentOrders"] }) {
  if (!data.length) return <EmptyState label="No orders yet" />;
  return (
    <ListTable head={["Order", "Status", "Total"]}>
      {data.map((o) => (
        <RowLink key={o.id} href="/admin-dashboard/order">
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-slate-700">#{o.orderNumber}</p>
            <p className="truncate text-[11px] text-slate-400">
              {o.customer} · {new Date(o.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
            </p>
          </div>
          {statusPill(o.status)}
          <span className="w-20 text-right text-[13px] font-bold text-slate-800">{fmtMoney(o.totalAmount)}</span>
        </RowLink>
      ))}
    </ListTable>
  );
}

export function PendingOrdersList({ data }: { data: AdminDashboardSummary["lists"]["pendingOrders"] }) {
  if (!data.length) return <EmptyState label="No pending orders 🎉" />;
  return (
    <ListTable head={["Order", "Placed", "Total"]}>
      {data.map((o) => (
        <RowLink key={o.id} href="/admin-dashboard/order" hoverClass="hover:bg-amber-50/70">
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-slate-700">#{o.orderNumber}</p>
            <p className="truncate text-[11px] text-slate-400">{o.customer}</p>
          </div>
          <span className="text-[11px] font-medium text-slate-400">
            {new Date(o.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
          </span>
          <span className="w-20 text-right text-[13px] font-bold text-slate-800">{fmtMoney(o.totalAmount)}</span>
        </RowLink>
      ))}
    </ListTable>
  );
}

export function LowStockList({ data }: { data: AdminDashboardSummary["lists"]["lowStock"] }) {
  if (!data.length) return <EmptyState label="Stock levels look healthy" />;
  return (
    <ListTable head={["Product", "Variant", "Available"]}>
      {data.map((s) => (
        <RowLink key={s.variantId} href="/admin-dashboard/products" hoverClass="hover:bg-rose-50/60">
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-slate-700">{s.productName}</p>
          </div>
          <span className="text-[11px] font-medium text-slate-400">…{s.variantId.slice(-6)}</span>
          <span
            className={`inline-flex w-20 items-center justify-center justify-self-end rounded-full border px-2 py-0.5 text-[10px] font-bold ${
              s.available <= 0
                ? "border-rose-200 bg-rose-50 text-rose-600"
                : "border-amber-200 bg-amber-50 text-amber-600"
            }`}
          >
            {s.available <= 0 ? "Out" : `${s.available} left`}
          </span>
        </RowLink>
      ))}
    </ListTable>
  );
}

export function RecentPaymentsList({ data }: { data: AdminDashboardSummary["lists"]["recentPayments"] }) {
  if (!data.length) return <EmptyState label="No payments yet" />;
  return (
    <ListTable head={["Order", "Method", "Amount"]}>
      {data.map((p) => (
        <div key={p.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 px-3 py-2.5 transition-colors hover:bg-emerald-50/50">
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-slate-700">#{p.orderNumber}</p>
            <p className="truncate text-[11px] text-slate-400">
              {p.paidAt ? new Date(p.paidAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "—"}
            </p>
          </div>
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-500">
            {p.method}
          </span>
          <span className="w-20 text-right text-[13px] font-bold text-emerald-600">{fmtMoney(p.amount)}</span>
        </div>
      ))}
    </ListTable>
  );
}

export function NewCustomersList({ data }: { data: AdminDashboardSummary["lists"]["newCustomers"] }) {
  if (!data.length) return <EmptyState label="No new customers yet" />;
  return (
    <ListTable head={["Customer", "Contact", "Joined"]}>
      {data.map((u) => (
        <RowLink key={u.id} href="/admin-dashboard/customer-manage/accountmanage">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] text-[11px] font-bold text-white shadow-sm">
              {(u.name ?? u.email ?? "?").charAt(0).toUpperCase()}
            </div>
            <p className="truncate text-[13px] font-semibold text-slate-700">{u.name ?? "Unnamed"}</p>
          </div>
          <span className="max-w-[120px] truncate text-[11px] font-medium text-slate-400">{u.email ?? "—"}</span>
          <span className="w-16 text-right text-[11px] font-medium text-slate-400">
            {new Date(u.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
          </span>
        </RowLink>
      ))}
    </ListTable>
  );
}
