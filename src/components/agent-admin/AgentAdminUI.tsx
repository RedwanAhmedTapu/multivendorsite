"use client";
// Shared UI for the admin Agent Commission screens
// (src/app/admin-dashboard/@main/agents/*). Plain Tailwind + lucide-react,
// the same approach as the existing admin pages.

import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Loader2, X } from "lucide-react";
import { formatBDT } from "@/lib/cart/display";

export const bdt = (v: string | number | null | undefined, fallback = "—") =>
  v === null || v === undefined || v === "" || !Number.isFinite(Number(v)) ? fallback : formatBDT(Number(v));

export const pct = (v: string | number | null | undefined, fallback = "—") =>
  v === null || v === undefined || v === "" ? fallback : `${Number(v).toLocaleString("en-BD", { maximumFractionDigits: 4 })}%`;

export const fmtDate = (v: string | null | undefined) =>
  v ? new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Dhaka", day: "2-digit", month: "short", year: "numeric" }).format(new Date(v)) : "—";

export const fmtDateTime = (v: string | null | undefined) =>
  v ? new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Dhaka", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(v)) : "—";

const TABS = [
  { href: "/admin-dashboard/agents", label: "Agents" },
  { href: "/admin-dashboard/agents/settings", label: "Settings" },
  { href: "/admin-dashboard/agents/levels", label: "Levels" },
  { href: "/admin-dashboard/agents/overrides", label: "Rate overrides" },
  { href: "/admin-dashboard/agents/bonus-rules", label: "Bonus rules" },
  { href: "/admin-dashboard/agents/commissions", label: "Commissions" },
  { href: "/admin-dashboard/agents/withdrawals", label: "Withdrawals" },
  { href: "/admin-dashboard/agents/audit", label: "Audit log" },
];

export function AgentAdminHeader({ title, subtitle, actions }: { title: string; subtitle: string; actions?: ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-blue-600">Agent Commission System</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-800">{title}</h1>
          <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
      <nav className="mt-5 flex flex-wrap gap-1 border-b border-slate-200" aria-label="Agent admin sections">
        {TABS.map((t) => {
          const active = t.href === "/admin-dashboard/agents" ? pathname === t.href || /^\/admin-dashboard\/agents\/(?!settings|levels|overrides|bonus-rules|audit)[^/]+$/.test(pathname ?? "") : pathname?.startsWith(t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`-mb-px border-b-2 px-3.5 py-2.5 text-sm font-semibold transition-colors ${active ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-800"}`}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

type Variant = "primary" | "outline" | "danger" | "ghost" | "success";
const VARIANT: Record<Variant, string> = {
  primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-200",
  outline: "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
  danger: "bg-red-600 text-white hover:bg-red-700",
  success: "bg-emerald-600 text-white hover:bg-emerald-700",
  ghost: "text-slate-600 hover:bg-slate-100",
};

export function Btn({
  children,
  variant = "primary",
  loading,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; loading?: boolean }) {
  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-3.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${VARIANT[variant]} ${className}`}
    >
      {loading && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
  );
}

export function Panel({ title, subtitle, children, actions, className = "" }: { title?: string; subtitle?: string; children: ReactNode; actions?: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>
      {(title || actions) && (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            {title && <h2 className="text-base font-bold text-slate-800">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function FieldRow({ label, error, hint, children, htmlFor }: { label: string; error?: string; hint?: string; children: ReactNode; htmlFor?: string }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </label>
      {children}
      {error ? <p className="text-xs font-medium text-red-600">{error}</p> : hint ? <p className="text-xs text-slate-400">{hint}</p> : null}
    </div>
  );
}

export const inputCls = (invalid?: boolean) =>
  `h-10 w-full rounded-lg border bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 ${invalid ? "border-red-400 focus:ring-red-100" : "border-slate-200 focus:border-blue-400 focus:ring-blue-100"}`;

export type Tone = "slate" | "blue" | "green" | "amber" | "red" | "violet";
const TONE: Record<Tone, string> = {
  slate: "bg-slate-100 text-slate-600 border-slate-200",
  blue: "bg-blue-50 text-blue-700 border-blue-200",
  green: "bg-emerald-50 text-emerald-700 border-emerald-200",
  amber: "bg-amber-50 text-amber-700 border-amber-200",
  red: "bg-red-50 text-red-700 border-red-200",
  violet: "bg-violet-50 text-violet-700 border-violet-200",
};

export function Pill({ tone = "slate", children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`inline-flex items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${TONE[tone]}`}>{children}</span>;
}

export const STATUS_TONE: Record<string, Tone> = { PENDING: "amber", ACTIVE: "green", SUSPENDED: "red", DEACTIVATED: "slate" };

export function Modal({ open, onClose, title, children, footer, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" onClick={onClose}>
      <div className={`flex max-h-[90vh] w-full flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ${wide ? "max-w-2xl" : "max-w-lg"}`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-extrabold text-slate-800">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600" aria-label="Close">
            <X className="size-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50 px-6 py-3">{footer}</div>}
      </div>
    </div>
  );
}

export function Empty({ title, text }: { title: string; text?: string }) {
  return (
    <div className="px-6 py-12 text-center">
      <p className="text-sm font-semibold text-slate-600">{title}</p>
      {text && <p className="mt-1 text-xs text-slate-400">{text}</p>}
    </div>
  );
}

export const thCls = "whitespace-nowrap px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400";
export const tdCls = "px-4 py-3 align-middle text-sm text-slate-700";
