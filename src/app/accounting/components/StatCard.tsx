'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string;
  helper?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    direction: 'up' | 'down';
  };
  accent?: 'cyan' | 'emerald' | 'rose' | 'amber';
}

const accentMap: Record<string, string> = {
  cyan: 'from-cyan-400 to-blue-500 shadow-cyan-500/30',
  emerald: 'from-emerald-400 to-teal-500 shadow-emerald-500/30',
  rose: 'from-rose-400 to-pink-500 shadow-rose-500/30',
  amber: 'from-amber-300 to-orange-400 shadow-amber-500/30',
};

export default function StatCard({
  label,
  value,
  helper,
  icon: Icon,
  trend,
  accent = 'cyan',
}: StatCardProps) {
  return (
    <div className="relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-5 overflow-hidden">
      <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-cyan-500/10 blur-[50px]" />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold text-white/40 uppercase tracking-wider truncate">
            {label}
          </p>
          <p className="text-2xl font-extrabold text-white mt-1.5 tracking-tight truncate">
            {value}
          </p>
          {helper && <p className="text-xs text-white/35 mt-1 truncate">{helper}</p>}
        </div>
        <span
          className={`flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br ${accentMap[accent]} shadow-lg shrink-0`}
        >
          <Icon size={18} className="text-white" />
        </span>
      </div>

      {trend && (
        <div
          className={`relative mt-3 inline-flex items-center gap-1 text-xs font-semibold ${
            trend.direction === 'up' ? 'text-emerald-400' : 'text-rose-400'
          }`}
        >
          <span>{trend.direction === 'up' ? '▲' : '▼'}</span>
          <span>{trend.value}</span>
        </div>
      )}
    </div>
  );
}