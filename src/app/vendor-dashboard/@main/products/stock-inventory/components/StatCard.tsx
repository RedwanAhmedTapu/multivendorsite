"use client";

import { Loader2 } from "lucide-react";

// accent is a gradient pair, e.g. "from-blue-500 to-cyan-400" — matches the
// icon-badge treatment used throughout the Purchase Entry form.
export function StatCard({
  label,
  value,
  sub,
  icon,
  accent,
  loading,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  accent: string;
  loading?: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl border border-blue-100 p-5 shadow-sm shadow-blue-50 relative overflow-hidden group hover:shadow-md hover:shadow-blue-100 transition-all duration-300">
      <div
        className={`absolute top-0 right-0 w-24 h-24 rounded-full -translate-y-8 translate-x-8 opacity-[0.08] bg-gradient-to-br ${accent}`}
      />
      <div className="flex items-start justify-between mb-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${accent} text-white shadow-sm`}
        >
          {icon}
        </div>
        {loading && <Loader2 size={14} className="text-slate-300 animate-spin" />}
      </div>
      {loading ? (
        <div className="space-y-2">
          <div className="h-7 bg-slate-100 rounded-lg animate-pulse w-24" />
          <div className="h-3.5 bg-slate-50 rounded animate-pulse w-16" />
        </div>
      ) : (
        <>
          <div className="text-2xl font-extrabold text-slate-800 tracking-tight">{value}</div>
          <div className="text-xs text-slate-400 font-medium mt-0.5">{label}</div>
          {sub && <div className="text-xs text-slate-500 mt-1.5 font-semibold">{sub}</div>}
        </>
      )}
    </div>
  );
}
