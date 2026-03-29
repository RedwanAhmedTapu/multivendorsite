"use client";

import { useMemo } from "react";
import {
  ShoppingBag,
  TrendingUp,
  Clock,
  Package,
  Truck,
  CheckCircle2,
} from "lucide-react";
import { useGetVendorOrderStatsQuery } from "@/features/vendorOrderApi";

function StatCard({
  icon,
  label,
  value,
  sub,
  accentColor,
  isLoading,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  accentColor: string;   // Tailwind bg class e.g. "bg-teal-500"
  isLoading?: boolean;
}) {
  return (
    <div className="relative bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-all duration-200 group">
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${accentColor}`} />
      <div className="p-4">
        <div className={`inline-flex p-2 rounded-xl mb-3 ${accentColor.replace("bg-", "bg-").replace("-500", "-50").replace("-400", "-50").replace("-600", "-50")}`}>
          {icon}
        </div>
        {isLoading ? (
          <div className="h-7 w-16 bg-slate-100 rounded animate-pulse mb-1" />
        ) : (
          <p className="text-xl font-bold text-slate-900 font-mono tracking-tight">{value}</p>
        )}
        <p className="text-xs font-medium text-slate-500 mt-0.5">{label}</p>
        {sub && <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

interface Props {
  statsQueryString: string;
}

export function VendorOrderStatsBar({ statsQueryString }: Props) {
  const { data, isLoading } = useGetVendorOrderStatsQuery(statsQueryString);
  const s = data?.data;

  const fmt = (n?: number) =>
    n === undefined
      ? "—"
      : n >= 1_000_000
      ? `৳${(n / 1_000_000).toFixed(1)}M`
      : n >= 1_000
      ? `৳${(n / 1_000).toFixed(1)}K`
      : `৳${n.toLocaleString()}`;

  const num = (n?: number) =>
    isLoading ? "—" : (n ?? 0).toLocaleString();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      <StatCard
        icon={<ShoppingBag className="w-4 h-4 text-slate-600" />}
        label="Total Orders"
        value={num(s?.totalOrders)}
        accentColor="bg-slate-700"
        isLoading={isLoading}
      />
      <StatCard
        icon={<TrendingUp className="w-4 h-4 text-teal-600" />}
        label="Revenue"
        value={isLoading ? "—" : fmt(s?.totalRevenue)}
        sub="Your earnings"
        accentColor="bg-teal-500"
        isLoading={isLoading}
      />
      <StatCard
        icon={<Clock className="w-4 h-4 text-amber-600" />}
        label="New / Pending"
        value={num(s?.pendingOrders)}
        sub="Needs your action"
        accentColor="bg-amber-400"
        isLoading={isLoading}
      />
      <StatCard
        icon={<Package className="w-4 h-4 text-indigo-600" />}
        label="Processing"
        value={num(s?.processingOrders)}
        accentColor="bg-indigo-500"
        isLoading={isLoading}
      />
      <StatCard
        icon={<Truck className="w-4 h-4 text-sky-600" />}
        label="Shipped"
        value={num(s?.shippedOrders)}
        sub="With courier"
        accentColor="bg-sky-500"
        isLoading={isLoading}
      />
      <StatCard
        icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
        label="Delivered"
        value={num(s?.deliveredOrders)}
        accentColor="bg-emerald-500"
        isLoading={isLoading}
      />
    </div>
  );
}