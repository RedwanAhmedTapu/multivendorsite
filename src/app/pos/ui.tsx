// app/pos/components/ui.tsx
"use client";

import type { ReactNode } from "react";

// ---------------------------------------------------------------------------
// Shared form field styling — used across all modal forms (Bank, Customer,
// Staff, Settings) so inputs/labels look identical everywhere.
// ---------------------------------------------------------------------------
export const inputCls =
  "w-full bg-white border border-cyan-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition-all";

export const labelCls =
  "text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block";

// ---------------------------------------------------------------------------
// Badge — small pill used for statuses (Paid/Due, Admin, Inactive, etc.)
// ---------------------------------------------------------------------------
export type BadgeColor = "green" | "red" | "amber" | "blue" | "purple" | "teal" | "gray" | "cyan";

const BADGE_COLORS: Record<BadgeColor, string> = {
  green: "bg-green-50 text-green-600 border-green-100",
  red: "bg-red-50 text-red-600 border-red-100",
  amber: "bg-amber-50 text-amber-600 border-amber-100",
  blue: "bg-blue-50 text-blue-600 border-blue-100",
  purple: "bg-purple-50 text-purple-600 border-purple-100",
  teal: "bg-teal-50 text-teal-600 border-teal-100",
  gray: "bg-slate-100 text-slate-500 border-slate-200",
  cyan: "bg-cyan-50 text-cyan-600 border-cyan-100",
};

export function Badge({
  color = "gray",
  children,
}: {
  color?: BadgeColor;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${BADGE_COLORS[color] ?? BADGE_COLORS.gray}`}
    >
      {children}
    </span>
  );
}

// ---------------------------------------------------------------------------
// EmptyState — centered icon + message for empty lists / no-access screens
// ---------------------------------------------------------------------------
export function EmptyState({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2.5 text-center py-10 px-6">
      <div className="opacity-70">{icon}</div>
      <div className="text-xs font-semibold text-slate-400 max-w-[240px] leading-relaxed">{text}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Currency formatting
// fmt   -> general-purpose money display (receipts, dashboards, lists).
//          Drops decimals for whole numbers, keeps them for cents.
// fmtD  -> fixed 2-decimal plain number, used in the accounting ledger table
//          where Debit/Credit columns need consistent alignment and the
//          currency symbol is already implied by context.
// ---------------------------------------------------------------------------
const CURRENCY_SYMBOL = "৳";

export function fmt(n: number | string | undefined | null): string {
  const v = Number(n ?? 0);
  const isWhole = Number.isInteger(v);
  return `${CURRENCY_SYMBOL}${v.toLocaleString("en-US", {
    minimumFractionDigits: isWhole ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

export function fmtD(n: number | string | undefined | null): string {
  const v = Number(n ?? 0);
  return v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}