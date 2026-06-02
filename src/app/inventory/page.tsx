"use client";

import { useState } from "react";
import {
  useGetSuppliersQuery,
  useToggleSupplierStatusMutation,
  useGetSupplierDuesQuery,
} from "@/features/supplierApi";
import {
  useGetPurchaseOrdersQuery,
  useGetNextPurchaseNumberQuery,
} from "@/features/purchaseOrderApi";
import {
  useGetStockInventoryQuery,
  useGetStockStatsQuery,
  useAdjustStockMutation,
} from "@/features/stockApi";

/* ─── Types (inline for portability) ─────────────────────────────────────── */
type ActiveTab = "overview" | "suppliers" | "purchases" | "stock";
type ActiveView = "list" | "detail";

/* ─── Utility helpers ─────────────────────────────────────────────────────── */
const fmt = (n: number, decimals = 0) =>
  new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n);

const fmtCurrency = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

const statusColors: Record<string, string> = {
  ACTIVE: "bg-blue-100 text-blue-800",
  INACTIVE: "bg-slate-100 text-slate-600",
  PENDING: "bg-amber-100 text-amber-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  PARTIALLY_PAID: "bg-indigo-100 text-indigo-700",
  CANCELLED: "bg-red-100 text-red-700",
  in_stock: "bg-emerald-100 text-emerald-800",
  low_stock: "bg-amber-100 text-amber-800",
  out_stock: "bg-red-100 text-red-800",
  overstock: "bg-blue-100 text-blue-800",
};

/* ─── Skeleton loader ─────────────────────────────────────────────────────── */
function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-blue-50 rounded-lg ${className}`} />
  );
}

/* ─── Stat Card ───────────────────────────────────────────────────────────── */
function StatCard({
  label,
  value,
  sub,
  icon,
  accent = false,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-5 border transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${
        accent
          ? "bg-gradient-to-br from-blue-600 to-blue-700 border-blue-500 text-white"
          : "bg-white border-blue-100 text-slate-700"
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-widest mb-1 ${accent ? "text-blue-200" : "text-blue-400"}`}>
            {label}
          </p>
          <p className={`text-2xl font-bold leading-none ${accent ? "text-white" : "text-slate-800"}`}>
            {value}
          </p>
          {sub && (
            <p className={`text-xs mt-1.5 ${accent ? "text-blue-200" : "text-slate-500"}`}>{sub}</p>
          )}
        </div>
        <span className={`text-2xl ${accent ? "opacity-70" : "text-blue-200"}`}>{icon}</span>
      </div>
      {accent && (
        <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-blue-500/30" />
      )}
    </div>
  );
}

/* ─── Badge ───────────────────────────────────────────────────────────────── */
function Badge({ status }: { status: string }) {
  const cls = statusColors[status] ?? "bg-slate-100 text-slate-600";
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

/* ─── Empty state ─────────────────────────────────────────────────────────── */
function Empty({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-slate-400">
      <svg className="w-12 h-12 mb-3 text-blue-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0H4" />
      </svg>
      <p className="text-sm">{message}</p>
    </div>
  );
}

/* ─── Section header ──────────────────────────────────────────────────────── */
function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800">{title}</h2>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/* ─── Search input ────────────────────────────────────────────────────────── */
function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative w-full sm:max-w-xs">
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "Search…"}
        className="w-full pl-9 pr-4 py-2 text-sm border border-blue-100 rounded-xl bg-blue-50/40 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent text-slate-700 placeholder:text-slate-400 transition"
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   OVERVIEW TAB
═══════════════════════════════════════════════════════════════════════════ */
function OverviewTab() {
  const { data: stockStats, isLoading: statsLoading } = useGetStockStatsQuery();
  const { data: suppliers } = useGetSuppliersQuery({ limit: 5, status: "ACTIVE" });
  const { data: purchases } = useGetPurchaseOrdersQuery({ limit: 5 });

  const stats = stockStats?.data;
  const pStats = purchases?.stats;

  return (
    <div className="space-y-8">
      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)
        ) : (
          <>
            <StatCard label="Total SKUs" value={fmt(stats?.totalVariants ?? 0)} icon="📦" accent />
            <StatCard label="Available Stock" value={fmt(stats?.totalAvailable ?? 0)} sub={`${fmt(stats?.totalDamaged ?? 0)} damaged`} icon="✅" />
            <StatCard label="Inventory Value" value={fmtCurrency(stats?.totalValue ?? 0)} icon="💰" />
            <StatCard label="Low / Out of Stock" value={`${fmt(stats?.lowStockCount ?? 0)} / ${fmt(stats?.outOfStockCount ?? 0)}`} icon="⚠️" />
          </>
        )}
      </div>

      {/* Purchase stats */}
      {pStats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Purchase Orders" value={fmt(pStats.count)} icon="🛒" />
          <StatCard label="Purchase Value" value={fmtCurrency(pStats.totalValue)} icon="📊" />
          <StatCard label="Total Paid" value={fmtCurrency(pStats.totalPaid)} icon="💳" />
          <StatCard label="Outstanding Due" value={fmtCurrency(pStats.totalDue)} icon="🔔" accent />
        </div>
      )}

      {/* Two-column: recent suppliers + recent purchases */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent Suppliers */}
        <div className="bg-white rounded-2xl border border-blue-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-blue-50 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800 text-sm">Active Suppliers</h3>
            <span className="text-xs text-blue-400">{suppliers?.data.length ?? 0} shown</span>
          </div>
          <ul className="divide-y divide-blue-50">
            {suppliers?.data.map((s) => (
              <li key={s.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-blue-50/50 transition-colors">
                <div>
                  <p className="text-sm font-medium text-slate-800">{s.name}</p>
                  <p className="text-xs text-slate-400">{s.supplierType} · {s.phone}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-blue-600">{fmtCurrency(s.totalDue)}</p>
                  <p className="text-xs text-slate-400">due</p>
                </div>
              </li>
            ))}
            {!suppliers?.data.length && <li className="px-5 py-8 text-center text-sm text-slate-400">No suppliers found</li>}
          </ul>
        </div>

        {/* Recent Purchases */}
        <div className="bg-white rounded-2xl border border-blue-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-blue-50 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800 text-sm">Recent Purchase Orders</h3>
            <span className="text-xs text-blue-400">{purchases?.data.length ?? 0} shown</span>
          </div>
          <ul className="divide-y divide-blue-50">
            {purchases?.data.map((p) => (
              <li key={p.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-blue-50/50 transition-colors">
                <div>
                  <p className="text-sm font-medium text-slate-800">{p.purchaseNo}</p>
                  <p className="text-xs text-slate-400">{p.supplier.name} · {p.purchaseDate.slice(0, 10)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge status={p.status} />
                  <span className="text-sm font-bold text-slate-700">{fmtCurrency(p.totalAmount)}</span>
                </div>
              </li>
            ))}
            {!purchases?.data.length && <li className="px-5 py-8 text-center text-sm text-slate-400">No orders found</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SUPPLIERS TAB
═══════════════════════════════════════════════════════════════════════════ */
function SuppliersTab() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "ACTIVE" | "INACTIVE">("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching } = useGetSuppliersQuery({
    search: search || undefined,
    status: statusFilter || undefined,
    page,
    limit: 10,
  });

  const { data: duesData } = useGetSupplierDuesQuery(selectedId!, { skip: !selectedId });
  const [toggleStatus, { isLoading: toggling }] = useToggleSupplierStatusMutation();

  const suppliers = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Suppliers"
        subtitle="Manage your supplier network and track dues"
        action={
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors shadow-sm shadow-blue-200">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Supplier
          </button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Search suppliers…" />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as "" | "ACTIVE" | "INACTIVE")}
          className="px-3 py-2 text-sm border border-blue-100 rounded-xl bg-blue-50/40 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300 transition"
        >
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Supplier list */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-blue-100 overflow-hidden">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-blue-50/80">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-blue-500 uppercase tracking-wider">Name</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-blue-500 uppercase tracking-wider">Type</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-blue-500 uppercase tracking-wider">Contact</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-blue-500 uppercase tracking-wider">Due</th>
                      <th className="text-center px-5 py-3 text-xs font-semibold text-blue-500 uppercase tracking-wider">Status</th>
                      <th className="px-5 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-blue-50">
                    {suppliers.map((s) => (
                      <tr
                        key={s.id}
                        onClick={() => setSelectedId(s.id === selectedId ? null : s.id)}
                        className={`cursor-pointer hover:bg-blue-50/50 transition-colors ${selectedId === s.id ? "bg-blue-50" : ""}`}
                      >
                        <td className="px-5 py-4">
                          <p className="font-medium text-slate-800">{s.name}</p>
                          <p className="text-xs text-slate-400 truncate max-w-[160px]">{s.email}</p>
                        </td>
                        <td className="px-5 py-4 text-slate-500">{s.supplierType}</td>
                        <td className="px-5 py-4 text-slate-500">{s.contactName ?? "—"}</td>
                        <td className="px-5 py-4 text-right font-semibold text-blue-700">{fmtCurrency(s.totalDue)}</td>
                        <td className="px-5 py-4 text-center">
                          <Badge status={s.status} />
                        </td>
                        <td className="px-5 py-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleStatus(s.id);
                            }}
                            disabled={toggling}
                            className="text-xs text-blue-500 hover:text-blue-700 font-medium transition-colors disabled:opacity-40"
                          >
                            Toggle
                          </button>
                        </td>
                      </tr>
                    ))}
                    {suppliers.length === 0 && (
                      <tr>
                        <td colSpan={6}><Empty message="No suppliers found" /></td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-blue-50">
                {suppliers.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => setSelectedId(s.id === selectedId ? null : s.id)}
                    className={`p-4 cursor-pointer ${selectedId === s.id ? "bg-blue-50" : ""}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">{s.name}</p>
                        <p className="text-xs text-slate-400">{s.supplierType}</p>
                      </div>
                      <Badge status={s.status} />
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-slate-500">{s.email}</p>
                      <p className="text-sm font-bold text-blue-600">{fmtCurrency(s.totalDue)} due</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination && pagination.pages > 1 && (
                <div className="px-5 py-4 border-t border-blue-50 flex items-center justify-between">
                  <p className="text-xs text-slate-500">
                    Page {pagination.page} of {pagination.pages} · {pagination.total} total
                  </p>
                  <div className="flex gap-2">
                    <button
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                      className="px-3 py-1.5 text-xs border border-blue-100 rounded-lg hover:bg-blue-50 disabled:opacity-40 text-slate-600 transition-colors"
                    >
                      ← Prev
                    </button>
                    <button
                      disabled={page >= pagination.pages}
                      onClick={() => setPage((p) => p + 1)}
                      className="px-3 py-1.5 text-xs border border-blue-100 rounded-lg hover:bg-blue-50 disabled:opacity-40 text-slate-600 transition-colors"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Supplier dues panel */}
        <div className="bg-white rounded-2xl border border-blue-100 overflow-hidden">
          {!selectedId ? (
            <div className="flex flex-col items-center justify-center h-full py-16 px-6 text-center text-slate-400">
              <svg className="w-10 h-10 mb-3 text-blue-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <p className="text-sm">Select a supplier to view dues</p>
            </div>
          ) : !duesData ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
            </div>
          ) : (
            <>
              <div className="px-5 py-4 bg-blue-600 text-white">
                <p className="font-semibold">{duesData.data.supplier.name}</p>
                <p className="text-xs text-blue-200 mt-0.5">Outstanding dues</p>
                <p className="text-3xl font-bold mt-2">{fmtCurrency(duesData.data.totalDue)}</p>
              </div>
              <div className="divide-y divide-blue-50">
                {duesData.data.pendingOrders.map((order) => (
                  <div key={order.id} className="px-5 py-3.5">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-slate-800">{order.purchaseNo}</p>
                        <p className="text-xs text-slate-400">{order.purchaseDate.slice(0, 10)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-red-500">{fmtCurrency(order.dueAmount)}</p>
                        <p className="text-xs text-slate-400">of {fmtCurrency(order.totalAmount)}</p>
                      </div>
                    </div>
                    <div className="mt-2 h-1.5 bg-blue-50 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{ width: `${Math.min(100, (order.paidAmount / order.totalAmount) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
                {duesData.data.pendingOrders.length === 0 && (
                  <div className="px-5 py-8 text-center text-sm text-slate-400">No pending orders 🎉</div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PURCHASES TAB
═══════════════════════════════════════════════════════════════════════════ */
function PurchasesTab() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: nextNo } = useGetNextPurchaseNumberQuery();
  const { data, isLoading } = useGetPurchaseOrdersQuery({
    search: search || undefined,
    status: statusFilter as any || undefined,
    page,
    limit: 10,
  });

  const orders = data?.data ?? [];
  const stats = data?.stats;
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Purchase Orders"
        subtitle={`Next order: ${nextNo?.data.purchaseNo ?? "—"}`}
        action={
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors shadow-sm shadow-blue-200">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Order
          </button>
        }
      />

      {/* Stats banner */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="Orders" value={fmt(stats.count)} icon="📋" />
          <StatCard label="Total Value" value={fmtCurrency(stats.totalValue)} icon="💰" accent />
          <StatCard label="Paid" value={fmtCurrency(stats.totalPaid)} icon="✅" />
          <StatCard label="Due" value={fmtCurrency(stats.totalDue)} icon="⏳" />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Search purchase no…" />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-blue-100 rounded-xl bg-blue-50/40 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300 transition"
        >
          <option value="">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="PARTIALLY_PAID">Partially Paid</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-blue-100 overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-blue-50/80">
                    {["Order No", "Supplier", "Date", "Total", "Paid", "Due", "Status", ""].map((h) => (
                      <th key={h} className={`px-5 py-3 text-xs font-semibold text-blue-500 uppercase tracking-wider ${h === "" ? "" : "text-left"}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-50">
                  {orders.map((o) => (
                    <>
                      <tr
                        key={o.id}
                        className="hover:bg-blue-50/50 transition-colors cursor-pointer"
                        onClick={() => setExpandedId(o.id === expandedId ? null : o.id)}
                      >
                        <td className="px-5 py-4 font-mono font-medium text-blue-700">{o.purchaseNo}</td>
                        <td className="px-5 py-4 text-slate-700">{o.supplier.name}</td>
                        <td className="px-5 py-4 text-slate-500">{o.purchaseDate.slice(0, 10)}</td>
                        <td className="px-5 py-4 font-semibold text-slate-800">{fmtCurrency(o.totalAmount)}</td>
                        <td className="px-5 py-4 text-emerald-600 font-medium">{fmtCurrency(o.paidAmount)}</td>
                        <td className="px-5 py-4 text-red-500 font-medium">{fmtCurrency(o.dueAmount)}</td>
                        <td className="px-5 py-4"><Badge status={o.status} /></td>
                        <td className="px-5 py-4">
                          <svg className={`w-4 h-4 text-blue-400 transition-transform ${expandedId === o.id ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </td>
                      </tr>
                      {expandedId === o.id && (
                        <tr key={`${o.id}-expanded`} className="bg-blue-50/30">
                          <td colSpan={8} className="px-5 py-4">
                            <p className="text-xs font-semibold text-blue-500 uppercase tracking-wide mb-3">Line Items</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                              {o.items.map((item) => (
                                <div key={item.id} className="bg-white rounded-xl border border-blue-100 px-4 py-3">
                                  <p className="text-sm font-medium text-slate-800 truncate">{item.productName}</p>
                                  <p className="text-xs text-slate-500">{item.variantName} · SKU: {item.sku}</p>
                                  <div className="flex justify-between mt-2 text-xs">
                                    <span className="text-slate-400">Qty: <strong className="text-slate-700">{item.quantity}</strong></span>
                                    <span className="text-slate-400">Cost: <strong className="text-blue-700">{fmtCurrency(item.unitCost)}</strong></span>
                                    <span className="text-slate-400">Total: <strong className="text-slate-700">{fmtCurrency(item.total)}</strong></span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                  {orders.length === 0 && (
                    <tr><td colSpan={8}><Empty message="No purchase orders found" /></td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="md:hidden divide-y divide-blue-50">
              {orders.map((o) => (
                <div key={o.id} className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-mono font-semibold text-blue-700 text-sm">{o.purchaseNo}</p>
                      <p className="text-xs text-slate-500">{o.supplier.name}</p>
                    </div>
                    <Badge status={o.status} />
                  </div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>{o.purchaseDate.slice(0, 10)}</span>
                    <span className="font-semibold text-slate-700">{fmtCurrency(o.totalAmount)}</span>
                  </div>
                  <div className="flex gap-4 mt-1 text-xs">
                    <span className="text-emerald-600">Paid: {fmtCurrency(o.paidAmount)}</span>
                    <span className="text-red-500">Due: {fmtCurrency(o.dueAmount)}</span>
                  </div>
                </div>
              ))}
              {orders.length === 0 && <Empty message="No orders found" />}
            </div>

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="px-5 py-4 border-t border-blue-50 flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  {pagination.total} orders · Page {pagination.page} of {pagination.pages}
                </p>
                <div className="flex gap-2">
                  <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1.5 text-xs border border-blue-100 rounded-lg hover:bg-blue-50 disabled:opacity-40 text-slate-600 transition-colors">← Prev</button>
                  <button disabled={page >= pagination.pages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1.5 text-xs border border-blue-100 rounded-lg hover:bg-blue-50 disabled:opacity-40 text-slate-600 transition-colors">Next →</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   STOCK TAB
═══════════════════════════════════════════════════════════════════════════ */
function StockTab() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const { data: statsData } = useGetStockStatsQuery();
  const { data, isLoading } = useGetStockInventoryQuery({
    q: search || undefined,
    status: statusFilter as any || undefined,
    page,
    limit: 15,
  });
  const [adjustStock] = useAdjustStockMutation();

  const items = data?.data ?? [];
  const pagination = data?.pagination;
  const stats = statsData?.data;

  const stockBg: Record<string, string> = {
    in_stock: "bg-emerald-50 border-emerald-200",
    low_stock: "bg-amber-50 border-amber-200",
    out_stock: "bg-red-50 border-red-200",
    overstock: "bg-blue-50 border-blue-200",
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Stock Inventory"
        subtitle="Real-time stock levels across all warehouses"
        action={
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors shadow-sm shadow-blue-200">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Export
          </button>
        }
      />

      {/* Stock health cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="In Stock SKUs" value={fmt(stats.totalVariants - stats.lowStockCount - stats.outOfStockCount)} icon="✅" />
          <StatCard label="Low Stock" value={fmt(stats.lowStockCount)} icon="⚠️" />
          <StatCard label="Out of Stock" value={fmt(stats.outOfStockCount)} icon="🚫" accent />
          <StatCard label="Overstock" value={fmt(stats.overstockCount)} icon="📦" />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Search SKU or product…" />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-blue-100 rounded-xl bg-blue-50/40 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300 transition"
        >
          <option value="">All Status</option>
          <option value="in_stock">In Stock</option>
          <option value="low_stock">Low Stock</option>
          <option value="out_stock">Out of Stock</option>
          <option value="overstock">Overstock</option>
        </select>
      </div>

      {/* Stock grid (card-based) */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => <Skeleton key={i} className="h-40" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <div
              key={item.variantId}
              className={`rounded-2xl border p-4 transition-all hover:shadow-md hover:-translate-y-0.5 ${stockBg[item.status] ?? "bg-white border-slate-100"}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 text-sm truncate">{item.productName}</p>
                  <p className="text-xs text-slate-500 truncate">{item.variantName}</p>
                  <p className="text-xs font-mono text-blue-500 mt-0.5">{item.sku}</p>
                </div>
                <Badge status={item.status} />
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="text-center">
                  <p className="text-lg font-bold text-slate-800">{fmt(item.totalStock)}</p>
                  <p className="text-xs text-slate-400">Total</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-emerald-600">{fmt(item.availableStock)}</p>
                  <p className="text-xs text-slate-400">Available</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-red-500">{fmt(item.damagedQty)}</p>
                  <p className="text-xs text-slate-400">Damaged</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs border-t border-white/60 pt-3">
                <div>
                  <span className="text-slate-500">Avg Cost: </span>
                  <span className="font-semibold text-slate-700">{fmtCurrency(item.avgCost)}</span>
                </div>
                <div>
                  <span className="text-slate-500">Value: </span>
                  <span className="font-semibold text-blue-700">{fmtCurrency(item.avgCost * item.totalStock)}</span>
                </div>
              </div>

              {/* Warehouse breakdown pills */}
              {item.warehouseBreakdown.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {item.warehouseBreakdown.map((wh) => (
                    <span key={wh.warehouseId} className="text-xs bg-white/70 text-slate-600 border border-white rounded-lg px-2 py-0.5">
                      {wh.warehouseName}: <strong>{wh.quantity}</strong>
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
          {items.length === 0 && (
            <div className="col-span-full">
              <Empty message="No stock items found" />
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">{pagination.total} items · Page {pagination.page} of {pagination.pages}</p>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1.5 text-xs border border-blue-100 rounded-lg hover:bg-blue-50 disabled:opacity-40 text-slate-600 transition-colors bg-white">← Prev</button>
            <button disabled={page >= pagination.pages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1.5 text-xs border border-blue-100 rounded-lg hover:bg-blue-50 disabled:opacity-40 text-slate-600 transition-colors bg-white">Next →</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   ROOT DASHBOARD
═══════════════════════════════════════════════════════════════════════════ */
export default function InventoryDashboard() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");

  const tabs: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    {
      id: "overview",
      label: "Overview",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
    },
    {
      id: "suppliers",
      label: "Suppliers",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      id: "purchases",
      label: "Purchases",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
    {
      id: "stock",
      label: "Stock",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Top nav */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-blue-100 shadow-sm shadow-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <span className="font-bold text-slate-800 text-lg tracking-tight hidden sm:block">StockFlow</span>
            </div>

            {/* Tabs (desktop) */}
            <nav className="hidden md:flex items-center gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? "bg-blue-600 text-white shadow-sm shadow-blue-200"
                      : "text-slate-500 hover:text-slate-800 hover:bg-blue-50"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </nav>

            {/* Right slot */}
            <div className="flex items-center gap-2">
              <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-blue-50 text-slate-400 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5-5V9a6 6 0 10-12 0v3L2 17h5m8 0a3 3 0 11-6 0" />
                </svg>
              </button>
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                AD
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile tab bar */}
      <nav className="md:hidden sticky top-16 z-20 bg-white border-b border-blue-100 px-2 py-2 flex gap-1 overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
              activeTab === tab.id
                ? "bg-blue-600 text-white"
                : "text-slate-500 hover:bg-blue-50"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Page content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">
            {tabs.find((t) => t.id === activeTab)?.label}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>

        {/* Tab content */}
        {activeTab === "overview" && <OverviewTab />}
        {activeTab === "suppliers" && <SuppliersTab />}
        {activeTab === "purchases" && <PurchasesTab />}
        {activeTab === "stock" && <StockTab />}
      </main>
    </div>
  );
}