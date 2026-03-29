"use client";

import {
  ShoppingBag,
  DollarSign,
  Clock,
  TrendingUp,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useGetAdminOrderStatisticsQuery } from "@/features/adminOrderApi";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  accent: string;
  isLoading?: boolean;
}

function StatCard({ icon, label, value, sub, accent, isLoading }: StatCardProps) {
  return (
    <div className="relative bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden group hover:shadow-md transition-shadow duration-200">
      {/* Accent bar */}
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${accent}`} />
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className={`p-2 rounded-xl ${accent.replace("bg-", "bg-").replace("-500", "-100").replace("-600", "-100")} opacity-80`}>
            {icon}
          </div>
        </div>
        {isLoading ? (
          <div className="h-7 w-20 bg-slate-100 rounded animate-pulse mb-1" />
        ) : (
          <p className="text-2xl font-bold text-slate-900 tracking-tight font-mono">
            {value}
          </p>
        )}
        <p className="text-xs font-medium text-slate-500 mt-1">{label}</p>
        {sub && <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function fmt(n?: number) {
  if (n === undefined) return "—";
  if (n >= 1_000_000) return `৳${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `৳${(n / 1_000).toFixed(1)}K`;
  return `৳${n.toLocaleString()}`;
}

export function OrderStatsBar() {
  const { data, isLoading } = useGetAdminOrderStatisticsQuery();
  const stats = data?.data;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      <StatCard
        icon={<ShoppingBag className="w-4 h-4 text-slate-600" />}
        label="Total Orders"
        value={isLoading ? "—" : (stats?.total ?? 0).toLocaleString()}
        accent="bg-slate-900"
        isLoading={isLoading}
      />
      <StatCard
        icon={<DollarSign className="w-4 h-4 text-teal-600" />}
        label="Total Revenue"
        value={fmt(stats?.revenue.total)}
        accent="bg-teal-500"
        isLoading={isLoading}
      />
      <StatCard
        icon={<Clock className="w-4 h-4 text-amber-600" />}
        label="Pending"
        value={isLoading ? "—" : (stats?.byStatus.pending ?? 0).toLocaleString()}
        sub="Awaiting confirmation"
        accent="bg-amber-400"
        isLoading={isLoading}
      />
      <StatCard
        icon={<TrendingUp className="w-4 h-4 text-blue-600" />}
        label="Today"
        value={isLoading ? "—" : (stats?.newOrders.today ?? 0).toLocaleString()}
        sub="New orders today"
        accent="bg-blue-500"
        isLoading={isLoading}
      />
      <StatCard
        icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
        label="Delivered"
        value={isLoading ? "—" : (stats?.byStatus.delivered ?? 0).toLocaleString()}
        accent="bg-emerald-500"
        isLoading={isLoading}
      />
      <StatCard
        icon={<XCircle className="w-4 h-4 text-red-500" />}
        label="Cancelled"
        value={isLoading ? "—" : (stats?.byStatus.cancelled ?? 0).toLocaleString()}
        accent="bg-red-400"
        isLoading={isLoading}
      />
    </div>
  );
}