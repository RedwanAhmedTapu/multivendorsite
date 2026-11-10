import { AlertTriangle, CheckCircle, TrendingUp, X } from "lucide-react";
import type { StockStatus } from "@/features/stockApi";

// ─── Status badge config ───────────────────────────────────────────────────
export const STATUS_CONFIG: Record<
  StockStatus,
  { label: string; bg: string; text: string; dot: string; icon: React.ReactNode }
> = {
  in_stock: {
    label: "In Stock",
    bg: "bg-emerald-50 border-emerald-200",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
    icon: <CheckCircle size={11} />,
  },
  low_stock: {
    label: "Low Stock",
    bg: "bg-amber-50 border-amber-200",
    text: "text-amber-700",
    dot: "bg-amber-400",
    icon: <AlertTriangle size={11} />,
  },
  out_stock: {
    label: "Out of Stock",
    bg: "bg-rose-50 border-rose-200",
    text: "text-rose-700",
    dot: "bg-rose-500",
    icon: <X size={11} />,
  },
  overstock: {
    label: "Overstock",
    bg: "bg-blue-50 border-blue-200",
    text: "text-blue-700",
    dot: "bg-blue-500",
    icon: <TrendingUp size={11} />,
  },
};

// ─── Chart-of-accounts options (Sell Damage modal receipt account) ─────────
export const COA_OPTIONS = [
  { value: "1020", label: "Cash in Hand" },
  { value: "1021", label: "BRAC Bank - Current" },
  { value: "1022", label: "Dutch Bangla Bank" },
  { value: "1023", label: "Islami Bank" },
];

// ─── Pagination ─────────────────────────────────────────────────────────────
export const PAGE_SIZE_OPTIONS = [10, 20, 50];

// ─── Shared input styling (matches the Purchase Entry form's inputs) ──────
export const inputCls =
  "w-full bg-white border border-cyan-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition-all placeholder-slate-300";
