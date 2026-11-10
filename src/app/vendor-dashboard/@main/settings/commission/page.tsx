"use client";

import { useMemo } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";
import {
  Building2,
  ChevronRight,
  Percent,
  Tag,
  TrendingUp,
  Calendar,
  AlertCircle,
  Layers,
} from "lucide-react";
import Link from "next/link";
import { useGetCommissionHistoryQuery } from "@/features/vendorManageApi";

/* ── Helpers ────────────────────────────────────────────────────────────── */

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function isCurrentlyActive(effectiveFrom?: string, effectiveTo?: string | null) {
  const now = new Date();
  const from = effectiveFrom ? new Date(effectiveFrom) : null;
  const to = effectiveTo ? new Date(effectiveTo) : null;

  if (from && now < from) return false; // Not started yet
  if (to && now > to) return false; // Already ended
  return true; // Active
}

/* ── Stat Card ──────────────────────────────────────────────────────────── */

function StatCard({
  label,
  value,
  sub,
  icon,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-blue-100 shadow-sm shadow-blue-50 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          {label}
        </span>
        <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${accent} flex items-center justify-center text-white shadow-sm`}>
          {icon}
        </div>
      </div>
      <div className="text-xl font-extrabold text-slate-800">{value}</div>
      {sub && <div className="text-[11px] text-slate-400 mt-0.5">{sub}</div>}
    </div>
  );
}

/* ── Main Page ──────────────────────────────────────────────────────────── */

export default function VendorCommissionPage() {
  const vendorId = useSelector(
    (state: RootState) => state.auth.user?.vendorId ?? ""
  );

  const { data: rawData, isLoading } = useGetCommissionHistoryQuery(vendorId, {
    skip: !vendorId,
  });

  // ১০০% বুলেটপ্রুফ ডাটা এক্সট্র্যাকশন লজিক
  const commissions = useMemo(() => {
    if (!rawData) return [];
    
    // যদি সরাসরি অ্যারে হয়
    if (Array.isArray(rawData)) return rawData;
    
    // যদি { data: [...] } হয়
    if (rawData && Array.isArray((rawData as any).data)) return (rawData as any).data;
    
    // যদি { history: [...] } হয়
    if (rawData && Array.isArray((rawData as any).history)) return (rawData as any).history;
    
    // যদি { commissions: [...] } হয়
    if (rawData && Array.isArray((rawData as any).commissions)) return (rawData as any).commissions;
    
    // যদি ডিপলি নেস্টেড থাকে { data: { history: [...] } }
    const nestedData = (rawData as any)?.data;
    if (nestedData && typeof nestedData === 'object') {
      if (Array.isArray(nestedData.history)) return nestedData.history;
      if (Array.isArray(nestedData.commissions)) return nestedData.commissions;
      if (Array.isArray(nestedData.data)) return nestedData.data;
    }
    
    // কিছু না মিললে খালি অ্যারে
    return [];
  }, [rawData]);

  // Calculate Stats
  const stats = useMemo(() => {
    if (!commissions || commissions.length === 0) {
      return { avgRate: 0, highestRate: 0, totalCategories: 0, activeCount: 0 };
    }

    const rates = commissions.map((c: any) => Number(c.rate) || 0);
    const sum = rates.reduce((acc, curr) => acc + curr, 0);
    const highest = Math.max(...rates);
    
    const uniqueCategories = new Set(
      commissions.map((c: any) => c.category?.id || c.categoryId || c.id)
    );

    const active = commissions.filter((c: any) =>
      isCurrentlyActive(c.effectiveFrom, c.effectiveTo)
    ).length;

    return {
      avgRate: (sum / rates.length).toFixed(2),
      highestRate: highest.toFixed(2),
      totalCategories: uniqueCategories.size,
      activeCount: active,
    };
  }, [commissions]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/20 font-sans">
      {/* ── Top Bar ── */}
      <header className="bg-white/80 backdrop-blur-md border-b border-blue-100 sticky top-0 z-30 shadow-sm shadow-blue-50">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 min-w-0 overflow-hidden">
            <Link href="/vendor-dashboard/settings" className="flex items-center gap-1.5 font-semibold text-cyan-600 shrink-0">
            <div className="flex items-center gap-1.5 font-semibold text-cyan-600 shrink-0">
              <Building2 size={14} />
              <span>Settings</span>
            </div>
            </Link>
            <ChevronRight size={12} className="shrink-0" />
            <span className="font-semibold text-slate-700 truncate">
              Commission & Rates
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-6">
        {/* ── Page title ── */}
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">
            Category-wise Commissions
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            View your commission rates, applicable categories, and active periods
          </p>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <StatCard
            label="Avg. Commission"
            value={`${stats.avgRate}%`}
            sub="Across all categories"
            icon={<Percent size={16} />}
            accent="from-blue-500 to-cyan-400"
          />
          <StatCard
            label="Highest Rate"
            value={`${stats.highestRate}%`}
            sub="Maximum applicable"
            icon={<TrendingUp size={16} />}
            accent="from-cyan-500 to-emerald-400"
          />
          <StatCard
            label="Total Categories"
            value={stats.totalCategories}
            sub="Configured rates"
            icon={<Layers size={16} />}
            accent="from-violet-500 to-purple-400"
          />
          <StatCard
            label="Active Rates"
            value={stats.activeCount}
            sub="Currently running"
            icon={<Calendar size={16} />}
            accent="from-amber-500 to-orange-400"
          />
        </div>

        {/* ── Commission List ── */}
        {isLoading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 border border-slate-100 rounded-xl animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100" />
                  <div className="space-y-2">
                    <div className="h-3 w-24 bg-slate-100 rounded" />
                    <div className="h-2 w-16 bg-slate-100 rounded" />
                  </div>
                </div>
                <div className="h-4 w-12 bg-slate-100 rounded" />
              </div>
            ))}
          </div>
        ) : !commissions || commissions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm shadow-slate-100 py-20 text-center">
            <div className="flex flex-col items-center gap-3 text-slate-300">
              <AlertCircle size={40} className="opacity-40" />
              <div className="text-sm font-medium text-slate-400">
                No commission records found
              </div>
              <p className="text-xs text-slate-400 max-w-sm">
                Your commission rates will appear here once they are configured by the admin.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-blue-100 shadow-sm shadow-blue-50 overflow-hidden">
            <div className="divide-y divide-slate-100">
              {commissions.map((item: any, index: number) => {
                const rate = Number(item.rate) || 0;
                const isActive = isCurrentlyActive(
                  item.effectiveFrom,
                  item.effectiveTo
                );
                
                const categoryName = 
                  item.category?.name || 
                  item.categoryName || 
                  `Category ${index + 1}`;

                return (
                  <div
                    key={item.id || index}
                    className="flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isActive 
                          ? "bg-gradient-to-br from-blue-500 to-cyan-400 text-white shadow-sm" 
                          : "bg-slate-100 text-slate-400"
                      }`}>
                        <Tag size={18} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-slate-700 truncate">
                          {categoryName}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <Calendar size={10} />
                          <span>{formatDate(item.effectiveFrom)}</span>
                          <span className="text-slate-300">→</span>
                          <span>{item.effectiveTo ? formatDate(item.effectiveTo) : "Ongoing"}</span>
                        </div>
                        {item.note && (
                          <div className="text-[11px] text-slate-400 italic mt-0.5 truncate">
                            Note: {item.note}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end pl-4 shrink-0">
                      <div className={`text-lg font-extrabold ${
                        isActive ? "text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500" : "text-slate-400"
                      }`}>
                        {rate}%
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 ${
                        isActive 
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                          : "bg-slate-100 text-slate-500 border border-slate-200"
                      }`}>
                        {isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}