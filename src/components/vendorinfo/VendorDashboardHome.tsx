"use client";

import React, { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  DollarSign,
  Package,
  BarChart3,
  Download,
  Plus,
  MoreHorizontal,
  Star,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MessageSquare,
  Users,
  Lightbulb,
  RefreshCw,
  FileText,
  Truck,
  UserPlus,
  Tag,
  PenLine,
} from "lucide-react";

/* ─── Design tokens matching HTML dashboard ─── */
const C = {
  bg: "#faf8ff",
  surface: "#ffffff",
  surfaceLow: "#f2f3ff",
  surfaceContainer: "#eaedff",
  surfaceHigh: "#e2e7ff",
  surfaceHighest: "#dae2fd",
  primary: "#004ac6",
  primaryContainer: "#2563eb",
  secondary: "#006c49",
  secondaryFixed: "#6ffbbe",
  onSecondaryContainer: "#00714d",
  error: "#ba1a1a",
  errorContainer: "#ffdad6",
  onErrorContainer: "#93000a",
  tertiaryFixed: "#ffdbca",
  onTertiaryFixedVariant: "#783200",
  outline: "#737686",
  outlineVariant: "#c3c6d7",
  onSurface: "#131b2e",
  onSurfaceVariant: "#434655",
};

/* ─── Reusable primitives ─── */
const KPICard = ({
  icon,
  iconBg,
  iconColor,
  label,
  value,
  badge,
  badgePositive,
}: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string;
  badge: string;
  badgePositive: boolean;
}) => (
  <div
    className="rounded-xl p-6 shadow-sm border"
    style={{ backgroundColor: C.surface, borderColor: "#f8f8ff" }}
  >
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-lg`} style={{ backgroundColor: iconBg, color: iconColor }}>
        {icon}
      </div>
      <span
        className="px-2 py-1 rounded-full text-[10px] font-bold"
        style={{
          backgroundColor: badgePositive ? C.secondaryFixed : C.errorContainer,
          color: badgePositive ? C.onSecondaryContainer : C.onErrorContainer,
        }}
      >
        {badge}
      </span>
    </div>
    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">{label}</p>
    <h3 className="text-2xl font-black mt-1" style={{ color: C.onSurface }}>{value}</h3>
  </div>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-xl font-bold text-slate-900">{children}</h3>
);

const insightColors = [
  { bg: "#fff7ed", border: "#fed7aa", icon: "#c2410c", action: "#c2410c" },
  { bg: "#f0fdf4", border: "#bbf7d0", icon: "#15803d", action: "#15803d" },
  { bg: "#eff6ff", border: "#bfdbfe", icon: "#1d4ed8", action: "#1d4ed8" },
];

export default function VendorDashboardHome() {
  const [activeFilter, setActiveFilter] = useState("This Week");

  const kpis1 = [
    { icon: <DollarSign size={20} />, iconBg: "#eff6ff", iconColor: "#2563eb", label: "Net Sales", value: "$42,890.00", badge: "+12.5%", pos: true },
    { icon: <ShoppingCart size={20} />, iconBg: "#f0fdf4", iconColor: "#16a34a", label: "Total Orders", value: "1,204", badge: "+8.2%", pos: true },
    { icon: <BarChart3 size={20} />, iconBg: "#fff7ed", iconColor: "#ea580c", label: "Revenue Growth", value: "$12,450.00", badge: "-2.1%", pos: false },
    { icon: <TrendingUp size={20} />, iconBg: "#eef2ff", iconColor: "#4f46e5", label: "Conversion Rate", value: "4.2%", badge: "+24%", pos: true },
  ];

  const kpis2 = [
    { icon: <DollarSign size={20} />, iconBg: "#f0fdfa", iconColor: "#0d9488", label: "Gross Revenue", value: "$58,230.00", badge: "+5.4%", pos: true },
    { icon: <FileText size={20} />, iconBg: "#fff1f2", iconColor: "#e11d48", label: "Operational Cost", value: "$15,340.00", badge: "+1.2%", pos: false },
    { icon: <DollarSign size={20} />, iconBg: "#f0fdf4", iconColor: "#16a34a", label: "Net Profit", value: "$42,890.00", badge: "+14%", pos: true },
    { icon: <BarChart3 size={20} />, iconBg: "#f5f3ff", iconColor: "#7c3aed", label: "Profit Margin", value: "73.6%", badge: "Target Met", pos: true },
  ];

  const barData = [
    { day: "MON", h: 43 }, { day: "TUE", h: 57 }, { day: "WED", h: 86 },
    { day: "THU", h: 100, active: true }, { day: "FRI", h: 71 }, { day: "SAT", h: 50 }, { day: "SUN", h: 64 },
  ];

  const topProducts = [
    { name: "Nordic Watch Series 7", cat: "Electronic", sold: 428, price: "$299", emoji: "⌚" },
    { name: "Acoustic Pro Max", cat: "Audio", sold: 312, price: "$189", emoji: "🎧" },
    { name: "Sprint Runner X-2", cat: "Footwear", sold: 298, price: "$120", emoji: "👟" },
  ];

  const insights = [
    { icon: <Package size={18} />, title: "Inventory Alert", desc: "8 products reaching critical low stock levels.", action: "Restock Now", c: insightColors[0] },
    { icon: <TrendingUp size={18} />, title: "Sales Surge", desc: "Audio category sales up 24% in the last 48 hours.", action: "Promote More", c: insightColors[1] },
    { icon: <Package size={18} />, title: "Optimization", desc: "Update images for 'Nordic Series' to boost conversion.", action: "Edit Now", c: insightColors[2] },
  ];

  const pendingActions = [
    { icon: <ShoppingCart size={18} />, label: "Orders to Ship", count: "24", bg: C.primary, fg: "#fff" },
    { icon: <RefreshCw size={18} />, label: "Pending Returns", count: "08", bg: "#f43f5e", fg: "#fff" },
    { icon: <PenLine size={18} />, label: "Product Updates", count: "12", bg: "#f59e0b", fg: "#fff" },
    { icon: <MessageSquare size={18} />, label: "Unread Messages", count: "05", bg: "#10b981", fg: "#fff" },
  ];

  const transactions = [
    { id: "#ORD-90214", initials: "JD", initialsColor: "#1d4ed8", initialsBg: "#dbeafe", name: "Jane Doe", product: "Nordic Watch S7", type: "Online", typeBg: "#dbeafe", typeColor: "#1d4ed8", amount: "$299.00", status: "SHIPPED", statusBg: C.secondaryFixed, statusColor: C.onSecondaryContainer },
    { id: "#ORD-90215", initials: "MK", initialsColor: "#15803d", initialsBg: "#dcfce7", name: "Marcus Kane", product: "Acoustic Pro Max", type: "POS", typeBg: "#dcfce7", typeColor: "#15803d", amount: "$189.00", status: "PROCESSING", statusBg: C.tertiaryFixed, statusColor: C.onTertiaryFixedVariant },
    { id: "#ORD-90216", initials: "SC", initialsColor: "#be185d", initialsBg: "#fce7f3", name: "Sarah Connor", product: "Sprint Runner X-2", type: "Online", typeBg: "#dbeafe", typeColor: "#1d4ed8", amount: "$120.00", status: "CANCELLED", statusBg: C.errorContainer, statusColor: C.onErrorContainer },
  ];

  const activity = [
    { dot: C.primary, time: "2 mins ago", label: "New Order", desc: "#90217 from Jane Smith" },
    { dot: "#f59e0b", time: "15 mins ago", label: "Stock Low:", desc: "Acoustic Pro Max (2 units left)" },
    { dot: "#10b981", time: "1 hour ago", label: "Review:", desc: "Received 5-star rating for Nordic Watch" },
    { dot: "#3b82f6", time: "2 hours ago", label: "Vendor:", desc: "Luxe Co. updated their profile" },
  ];

  const quickActions = [
    { icon: <Plus size={20} />, label: "Add New Product", iconBg: "#eff6ff", iconColor: C.primary, hoverBg: C.primary, hoverBorder: C.primary },
    { icon: <UserPlus size={20} />, label: "Add Customer", iconBg: "#f0fdf4", iconColor: C.secondary, hoverBg: C.secondary, hoverBorder: C.secondary },
    { icon: <Tag size={20} />, label: "Add New Voucher", iconBg: "#fff7ed", iconColor: "#f97316", hoverBg: "#f97316", hoverBorder: "#f97316" },
    { icon: <FileText size={20} />, label: "Create Quotation", iconBg: "#eff6ff", iconColor: C.primary, hoverBg: C.primary, hoverBorder: C.primary },
    { icon: <Truck size={20} />, label: "Add New Supplier", iconBg: "#eef2ff", iconColor: "#6366f1", hoverBg: "#6366f1", hoverBorder: "#6366f1" },
    { icon: <Package size={20} />, label: "Add Stock", iconBg: "#f0fdf4", iconColor: C.secondary, hoverBg: C.secondary, hoverBorder: C.secondary },
  ];

  return (
    <div className="p-6 space-y-8 max-w-[1600px] mx-auto" style={{ backgroundColor: C.bg }}>

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight" style={{ color: C.onSurface }}>
            Weekly Overview
          </h2>
          <p className="mt-1 text-sm" style={{ color: C.onSurfaceVariant }}>
            Real-time performance tracking for October 2nd – 8th.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 text-sm font-bold rounded-lg hover:bg-slate-50 transition-all border border-slate-200"
          >
            <Download size={16} /> Export Data
          </button>
          <button
            className="flex items-center gap-2 px-6 py-2 text-white text-sm font-bold rounded-lg shadow-lg transition-all hover:scale-95"
            style={{ background: `linear-gradient(135deg, ${C.primary}, ${C.primaryContainer})`, boxShadow: `0 8px 20px ${C.primary}33` }}
          >
            <Plus size={16} /> New Order
          </button>
        </div>
      </div>

      {/* ── KPI Row 1 ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis1.map((k) => (
          <KPICard key={k.label} icon={k.icon} iconBg={k.iconBg} iconColor={k.iconColor} label={k.label} value={k.value} badge={k.badge} badgePositive={k.pos} />
        ))}
      </div>

      {/* ── KPI Row 2 (Profit Snapshot) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis2.map((k) => (
          <KPICard key={k.label} icon={k.icon} iconBg={k.iconBg} iconColor={k.iconColor} label={k.label} value={k.value} badge={k.badge} badgePositive={k.pos} />
        ))}
      </div>

      {/* ── Chart + Top Sellers ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left: chart + fulfilment */}
        <div className="lg:col-span-2 space-y-6">

          {/* Bar chart */}
          <div className="rounded-xl p-8 relative overflow-hidden" style={{ backgroundColor: C.surfaceLow }}>
            <div className="flex justify-between items-center mb-8">
              <div>
                <SectionTitle>Sales Performance</SectionTitle>
                <p className="text-sm text-slate-500 mt-0.5">Daily transaction volume trends</p>
              </div>
              <select
                className="bg-white border border-slate-200 rounded-lg text-xs font-bold px-3 py-1.5 focus:outline-none focus:ring-2"
                style={{ "--tw-ring-color": `${C.primary}33` } as React.CSSProperties}
              >
                <option>All Platforms</option>
                <option>Direct Store</option>
                <option>Marketplace</option>
              </select>
            </div>

            <div className="h-56 flex items-end justify-between gap-3 relative">
              {barData.map((b) => (
                <div key={b.day} className="flex-1 flex flex-col items-center group cursor-pointer">
                  <div
                    className="w-full rounded-t-lg transition-all duration-200"
                    style={{
                      height: `${(b.h / 100) * 200}px`,
                      backgroundColor: b.active ? C.primary : `${C.primary}1a`,
                      boxShadow: b.active ? `0 8px 24px ${C.primary}40` : "none",
                    }}
                  />
                  <span
                    className="text-[10px] font-bold mt-3"
                    style={{ color: b.active ? C.primary : "#94a3b8" }}
                  >
                    {b.day}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Fulfillment + Customer insights row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Fulfillment health */}
            <div className="rounded-xl p-6 shadow-sm border" style={{ backgroundColor: C.surface, borderColor: "#f8f8ff" }}>
              <h4 className="text-sm font-black text-slate-900 mb-4 uppercase tracking-wider">Fulfillment Health</h4>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs mb-1 font-bold">
                    <span className="text-slate-500">Delivery Success</span>
                    <span style={{ color: C.secondary }}>98.2%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1 rounded-full">
                    <div className="h-full rounded-full" style={{ width: "98%", backgroundColor: C.secondary }} />
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-slate-500 font-medium">Processing Time</span>
                  <span className="text-xs font-bold text-slate-900">1.2 Days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-slate-500 font-medium">Delayed Orders</span>
                  <span className="text-xs font-bold" style={{ color: C.error }}>3 Orders</span>
                </div>
              </div>
            </div>

            {/* Customer insights */}
            <div className="rounded-xl p-6 shadow-sm border" style={{ backgroundColor: C.surface, borderColor: "#f8f8ff" }}>
              <h4 className="text-sm font-black text-slate-900 mb-4 uppercase tracking-wider">Customer Insights</h4>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs mb-1 font-bold">
                    <span className="text-slate-500">Returning Customers</span>
                    <span style={{ color: C.primary }}>42%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1 rounded-full">
                    <div className="h-full rounded-full" style={{ width: "42%", backgroundColor: C.primary }} />
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-slate-500 font-medium">Avg. Basket Value</span>
                  <span className="text-xs font-bold text-slate-900">$142.50</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-slate-500 font-medium">Lifetime Value</span>
                  <span className="text-xs font-bold text-slate-900">$840.00</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: top sellers + review summary */}
        <div className="space-y-6">
          {/* Top performing */}
          <div className="rounded-xl p-8 border border-blue-100/50" style={{ backgroundColor: C.surfaceHighest }}>
            <SectionTitle>Top Performing</SectionTitle>
            <div className="space-y-4 mt-6">
              {topProducts.map((p) => (
                <div
                  key={p.name}
                  className="flex items-center gap-4 p-3 rounded-lg border"
                  style={{ backgroundColor: "rgba(255,255,255,0.4)", borderColor: "rgba(255,255,255,0.6)" }}
                >
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl bg-white shadow-sm">
                    {p.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{p.name}</p>
                    <p className="text-[10px] text-slate-500">{p.cat} • {p.sold} Sold</p>
                  </div>
                  <p className="font-bold text-sm shrink-0" style={{ color: C.primary }}>{p.price}</p>
                </div>
              ))}
            </div>
            <button
              className="w-full mt-6 py-3 text-xs font-bold rounded-lg transition-colors"
              style={{ color: C.primary, backgroundColor: `${C.primary}0d` }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = `${C.primary}1a`)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = `${C.primary}0d`)}
            >
              VIEW ALL PRODUCTS
            </button>
          </div>

          {/* Review summary */}
          <div className="rounded-xl p-6 shadow-sm border" style={{ backgroundColor: C.surface, borderColor: "#f8f8ff" }}>
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">Review Summary</h4>
              <div className="flex items-center gap-1 text-amber-500">
                <Star size={14} fill="currentColor" />
                <span className="text-xs font-bold">4.8</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">New Reviews</p>
                <p className="text-lg font-black text-slate-900">124</p>
              </div>
              <div className="p-3 rounded-lg border" style={{ backgroundColor: "#fff1f2", borderColor: "#fecdd3" }}>
                <p className="text-[10px] font-bold uppercase mb-1" style={{ color: "#f43f5e" }}>Negative Alerts</p>
                <p className="text-lg font-black" style={{ color: "#e11d48" }}>2</p>
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <div className="flex -space-x-2">
                {["#bfdbfe", "#d1fae5", "#fce7f3"].map((bg, i) => (
                  <div key={i} className="w-6 h-6 rounded-full border-2 border-white" style={{ backgroundColor: bg }} />
                ))}
              </div>
              <span className="text-[10px] text-slate-400 font-medium ml-3 mt-0">+82 others today</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Smart Insights + Pending Actions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Smart Insights */}
        <div className="rounded-2xl p-8 shadow-sm border" style={{ backgroundColor: C.surface, borderColor: "#f8f8ff" }}>
          <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Lightbulb size={20} className="text-amber-500" />
            Smart Insights
          </h3>
          <div className="space-y-4">
            {insights.map((ins) => (
              <div
                key={ins.title}
                className="flex items-center gap-4 p-4 rounded-xl border"
                style={{ backgroundColor: ins.c.bg, borderColor: ins.c.border }}
              >
                <div style={{ color: ins.c.icon }}>{ins.icon}</div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-900">{ins.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{ins.desc}</p>
                </div>
                <span className="text-[10px] font-black uppercase shrink-0" style={{ color: ins.c.action }}>
                  {ins.action}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Actions */}
        <div className="rounded-2xl p-8 shadow-sm border" style={{ backgroundColor: C.surface, borderColor: "#f8f8ff" }}>
          <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <CheckCircle2 size={20} style={{ color: C.primary }} />
            Pending Actions
          </h3>
          <div className="space-y-3">
            {pendingActions.map((a) => (
              <div
                key={a.label}
                className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="text-slate-400">{a.icon}</span>
                  <span className="text-sm font-semibold text-slate-900">{a.label}</span>
                </div>
                <span
                  className="px-2.5 py-1 rounded-full text-[10px] font-black"
                  style={{ backgroundColor: a.bg, color: a.fg }}
                >
                  {a.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Recent Transactions Table ── */}
      <div
        className="rounded-2xl overflow-hidden shadow-sm border"
        style={{ backgroundColor: C.surface, borderColor: "#f8f8ff" }}
      >
        <div className="p-8 flex justify-between items-center border-b border-slate-50">
          <SectionTitle>Recent Transactions</SectionTitle>
          <div className="flex items-center gap-3">
            <button className="px-3 py-1.5 text-xs font-bold bg-slate-100 text-slate-600 rounded-md hover:bg-slate-200 transition-colors">Filter</button>
            <button className="px-3 py-1.5 text-xs font-bold bg-slate-100 text-slate-600 rounded-md hover:bg-slate-200 transition-colors">Columns</button>
            <button
              className="px-4 py-1.5 text-xs font-bold rounded-md transition-colors border"
              style={{ color: C.primary, backgroundColor: `${C.primary}0d`, borderColor: `${C.primary}1a` }}
            >
              View All
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead style={{ backgroundColor: C.surfaceLow }}>
              <tr>
                {["Order ID", "Customer", "Product", "Sales Type", "Amount", "Status", "Action"].map((h) => (
                  <th key={h} className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {transactions.map((t, i) => (
                <tr key={t.id} className="hover:bg-slate-50 transition-colors" style={{ backgroundColor: i % 2 === 1 ? "rgba(248,250,252,0.3)" : undefined }}>
                  <td className="px-6 py-5 font-mono text-xs font-bold" style={{ color: C.primary }}>{t.id}</td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-[10px]"
                        style={{ backgroundColor: t.initialsBg, color: t.initialsColor }}
                      >
                        {t.initials}
                      </div>
                      <span className="text-sm font-semibold text-slate-900">{t.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-sm text-slate-700">{t.product}</td>
                  <td className="px-6 py-5">
                    <span className="px-2 py-1 rounded text-[10px] font-bold" style={{ backgroundColor: t.typeBg, color: t.typeColor }}>{t.type}</span>
                  </td>
                  <td className="px-6 py-5 font-bold text-sm text-slate-900">{t.amount}</td>
                  <td className="px-6 py-5">
                    <span className="px-3 py-1 rounded-full text-[10px] font-bold" style={{ backgroundColor: t.statusBg, color: t.statusColor }}>{t.status}</span>
                  </td>
                  <td className="px-6 py-5">
                    <button className="text-slate-400 hover:text-blue-600 transition-colors">
                      <MoreHorizontal size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Bottom Grid: Vendors + Inventory + Activity ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Top Vendors */}
        <div className="rounded-2xl p-8 shadow-sm border" style={{ backgroundColor: C.surface, borderColor: "#f8f8ff" }}>
          <div className="flex justify-between items-center mb-6">
            <SectionTitle>Top Vendors</SectionTitle>
            <div className="flex bg-slate-100 p-1 rounded-lg gap-0.5">
              {["D", "W", "M"].map((l, i) => (
                <button
                  key={l}
                  className="px-2 py-1 text-[9px] font-bold rounded transition-all"
                  style={i === 1 ? { backgroundColor: "#fff", color: C.primary, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" } : { color: "#94a3b8" }}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            {[
              { rank: "01", name: "Luxe Co.", type: "Premium", revenue: "$24.5k", growth: "+18%" },
              { rank: "02", name: "Urban Est.", type: "Retail", revenue: "$19.2k", growth: "+12%" },
            ].map((v) => (
              <div key={v.rank} className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center gap-4">
                  <span className="text-lg font-black text-slate-300 w-6">{v.rank}</span>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{v.name}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">{v.type}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-slate-900">{v.revenue}</p>
                  <p className="text-[10px] font-bold" style={{ color: C.secondary }}>{v.growth}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Inventory Pulse */}
        <div className="rounded-2xl p-8 shadow-sm border" style={{ backgroundColor: C.surface, borderColor: "#f8f8ff" }}>
          <SectionTitle>Inventory Pulse</SectionTitle>
          <div className="space-y-8 mt-8">
            {[
              { dot: C.error, label: "Low Stock", count: 42, pct: 28, color: C.error },
              { dot: "#7f1d1d", label: "Out of Stock", count: 12, pct: 8, color: "#7f1d1d" },
              { dot: C.secondary, label: "Healthy", count: 842, pct: 64, color: C.secondary },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between items-end mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.dot }} />
                    <span className="text-sm font-bold text-slate-700">{item.label}</span>
                  </div>
                  <span className="text-sm font-black" style={{ color: item.color }}>{item.count}</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${item.pct}%`, backgroundColor: item.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Activity */}
        <div className="rounded-2xl p-8 shadow-sm border" style={{ backgroundColor: C.surface, borderColor: "#f8f8ff" }}>
          <SectionTitle>Live Activity</SectionTitle>
          <div className="mt-6 space-y-6 relative">
            {/* Vertical line */}
            <div className="absolute left-2 top-2 bottom-2 w-px bg-slate-100" />
            {activity.map((a, i) => (
              <div key={i} className="relative pl-8">
                <div
                  className="absolute left-0 top-1.5 w-4 h-4 rounded-full border-4 border-white shadow-sm"
                  style={{ backgroundColor: a.dot }}
                />
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">{a.time}</p>
                <p className="text-sm text-slate-900">
                  <span className="font-bold">{a.label}</span> {a.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <section className="space-y-4">
        <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest text-center">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {quickActions.map((qa) => (
            <button
              key={qa.label}
              className="flex flex-col items-center justify-center gap-3 p-6 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all group"
            >
              <div
                className="p-3 rounded-xl transition-colors"
                style={{ backgroundColor: qa.iconBg, color: qa.iconColor }}
              >
                {qa.icon}
              </div>
              <span className="text-xs font-bold text-slate-600 text-center leading-tight">{qa.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ── Floating Action Button ── */}
      <button
        className="fixed bottom-8 right-8 w-14 h-14 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50"
        style={{ background: `linear-gradient(135deg, ${C.primary}, ${C.primaryContainer})` }}
      >
        <Zap size={22} fill="white" />
      </button>
    </div>
  );
}