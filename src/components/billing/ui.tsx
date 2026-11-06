"use client";

// Shared UI for the subscription and payout areas (admin + vendor).
// Purple / indigo accents on the existing dashboard look; no new dependencies.

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Loader2, X } from "lucide-react";
import { monthLabel, taka } from "@/lib/billing/format";

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export const inputCls =
  "h-10 w-full rounded-xl border border-[#e2e8f0] bg-white px-3 text-sm text-[#1e1b4b] placeholder:text-[#94a3b8] focus:border-[#7c3aed] focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/25 disabled:bg-slate-50";
export const textareaCls = cx(inputCls, "h-auto min-h-[84px] py-2");
export const tableCls = "w-full min-w-[640px] text-left text-sm";
export const thCls = "px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-[#64748b]";
export const tdCls = "px-3 py-3 align-middle text-[#1e1b4b]";

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-full overflow-hidden rounded-2xl bg-[#f5f5ff] p-4 sm:p-6">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-0 bg-[radial-gradient(700px_380px_at_100%_0%,#ede9fe_0%,transparent_60%),radial-gradient(640px_360px_at_0%_100%,#e0e7ff_0%,transparent_60%)]" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export function PageHeader({ title, subtitle, icon, actions }: { title: string; subtitle?: string; icon?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        {icon && <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-[#4f46e5] to-[#9333ea] text-white shadow-[0_8px_20px_rgba(99,52,224,0.3)]">{icon}</span>}
        <div>
          <h1 className="text-xl font-bold text-[#1e1b4b] sm:text-2xl">{title}</h1>
          {subtitle && <p className="text-sm text-[#64748b]">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ children, className, title, action }: { children: ReactNode; className?: string; title?: ReactNode; action?: ReactNode }) {
  return (
    <section className={cx("rounded-2xl border border-[#e6e3ff] bg-white/95 p-4 shadow-[0_6px_24px_rgba(79,70,229,0.07)] sm:p-5", className)}>
      {(title || action) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          {title && <h2 className="text-base font-semibold text-[#1e1b4b]">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

const ACCENTS: Record<string, string> = {
  violet: "from-[#7c3aed] to-[#a855f7]",
  indigo: "from-[#4f46e5] to-[#6366f1]",
  blue: "from-[#2563eb] to-[#0ea5e9]",
  green: "from-[#059669] to-[#10b981]",
  amber: "from-[#d97706] to-[#f59e0b]",
  rose: "from-[#e11d48] to-[#f43f5e]",
};

export function StatCard({ label, value, hint, icon, accent = "violet" }: { label: string; value: ReactNode; hint?: ReactNode; icon?: ReactNode; accent?: keyof typeof ACCENTS }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#e6e3ff] bg-white p-4 shadow-[0_6px_24px_rgba(79,70,229,0.07)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-[#64748b]">{label}</p>
          <p className="mt-1 truncate text-2xl font-bold text-[#1e1b4b]">{value}</p>
          {hint && <p className="mt-1 text-xs text-[#64748b]">{hint}</p>}
        </div>
        {icon && <span className={cx("grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-white", ACCENTS[accent])}>{icon}</span>}
      </div>
    </div>
  );
}

const TONES = {
  green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  amber: "bg-amber-50 text-amber-700 ring-amber-200",
  red: "bg-rose-50 text-rose-700 ring-rose-200",
  slate: "bg-slate-100 text-slate-600 ring-slate-200",
  violet: "bg-violet-50 text-violet-700 ring-violet-200",
  blue: "bg-sky-50 text-sky-700 ring-sky-200",
};
export function Badge({ tone = "slate", children }: { tone?: keyof typeof TONES; children: ReactNode }) {
  return <span className={cx("inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset", TONES[tone])}>{children}</span>;
}

export function Button({
  children, onClick, variant = "primary", type = "button", disabled, loading, className, size = "md", title,
}: {
  children: ReactNode; onClick?: () => void; variant?: "primary" | "secondary" | "danger" | "ghost"; type?: "button" | "submit";
  disabled?: boolean; loading?: boolean; className?: string; size?: "sm" | "md"; title?: string;
}) {
  const v = {
    primary: "bg-gradient-to-r from-[#4f46e5] via-[#7c3aed] to-[#9333ea] text-white shadow-[0_6px_16px_rgba(99,52,224,0.28)] hover:brightness-110",
    secondary: "border border-[#ddd6fe] bg-white text-[#4c1d95] hover:bg-[#f5f3ff]",
    danger: "border border-rose-200 bg-white text-rose-600 hover:bg-rose-50",
    ghost: "text-[#4c1d95] hover:bg-[#f5f3ff]",
  }[variant];
  return (
    <button
      type={type}
      title={title}
      onClick={onClick}
      disabled={disabled || loading}
      className={cx("inline-flex items-center justify-center gap-1.5 rounded-xl font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7c3aed]/40 disabled:cursor-not-allowed disabled:opacity-50", size === "sm" ? "h-8 px-3 text-xs" : "h-10 px-4 text-sm", v, className)}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

export function Field({ label, hint, children, error }: { label: string; hint?: string; children: ReactNode; error?: string | null }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-[#334155]">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-xs text-rose-600">{error}</span> : hint ? <span className="mt-1 block text-xs text-[#64748b]">{hint}</span> : null}
    </label>
  );
}

export function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className={cx("relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition", checked ? "bg-[#7c3aed]" : "bg-slate-300")}>
        <span className={cx("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition", checked ? "left-[22px]" : "left-0.5")} />
      </button>
      <span>
        <span className="block text-sm font-medium text-[#1e1b4b]">{label}</span>
        {hint && <span className="block text-xs text-[#64748b]">{hint}</span>}
      </span>
    </label>
  );
}

export function Notice({ tone = "violet", children }: { tone?: "violet" | "amber" | "red" | "green"; children: ReactNode }) {
  const t = { violet: "border-violet-200 bg-violet-50 text-violet-800", amber: "border-amber-200 bg-amber-50 text-amber-800", red: "border-rose-200 bg-rose-50 text-rose-700", green: "border-emerald-200 bg-emerald-50 text-emerald-800" }[tone];
  return <div role={tone === "red" ? "alert" : "status"} className={cx("rounded-xl border px-3 py-2 text-sm", t)}>{children}</div>;
}

export function EmptyState({ icon, title, body, action }: { icon?: ReactNode; title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#ddd6fe] bg-white/70 px-6 py-10 text-center">
      {icon && <span className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-[#f5f3ff] text-[#7c3aed]">{icon}</span>}
      <p className="font-semibold text-[#1e1b4b]">{title}</p>
      {body && <p className="mt-1 max-w-md text-sm text-[#64748b]">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Skeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => <div key={i} className="h-12 animate-pulse rounded-xl bg-[#ede9fe]/70" />)}
    </div>
  );
}

export function Modal({ open, title, onClose, children, footer, wide }: { open: boolean; title: string; onClose: () => void; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    ref.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-[#1e1b4b]/40 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={id} className={cx("flex max-h-[92vh] w-full flex-col rounded-t-2xl bg-white shadow-2xl outline-none sm:rounded-2xl", wide ? "sm:max-w-3xl" : "sm:max-w-lg")}>
        <div className="flex items-center justify-between border-b border-[#ede9fe] px-5 py-3.5">
          <h2 id={id} className="text-base font-semibold text-[#1e1b4b]">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-[#64748b] hover:bg-[#f5f3ff]"><X className="h-4 w-4" /></button>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-[#ede9fe] px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}

/** Asks for a reason (≥ 3 characters) before running an action. */
export function ReasonDialog({ open, title, body, confirmLabel = "Confirm", danger, onClose, onConfirm, loading, extra }: {
  open: boolean; title: string; body?: ReactNode; confirmLabel?: string; danger?: boolean; loading?: boolean; extra?: ReactNode;
  onClose: () => void; onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");
  useEffect(() => { if (open) setReason(""); }, [open]);
  return (
    <Modal open={open} title={title} onClose={onClose} footer={<>
      <Button variant="secondary" onClick={onClose}>Back</Button>
      <Button variant={danger ? "danger" : "primary"} loading={loading} disabled={reason.trim().length < 3} onClick={() => onConfirm(reason.trim())}>{confirmLabel}</Button>
    </>}>
      {body && <div className="mb-3 text-sm text-[#475569]">{body}</div>}
      {extra}
      <Field label="Reason" hint="Kept in the audit log (at least 3 characters).">
        <textarea className={textareaCls} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} />
      </Field>
    </Modal>
  );
}

export interface NavItem { key: string; label: string; icon: ReactNode; badge?: number }
/** Section navigation: a vertical list on desktop, a scrollable pill row on phones. */
export function SectionNav({ items, active, onChange }: { items: NavItem[]; active: string; onChange: (k: string) => void }) {
  return (
    <nav aria-label="Sections" className="lg:w-56 lg:shrink-0">
      <ul className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 lg:sticky lg:top-4 lg:mx-0 lg:flex-col lg:overflow-visible lg:rounded-2xl lg:border lg:border-[#e6e3ff] lg:bg-white lg:p-2 lg:shadow-[0_6px_24px_rgba(79,70,229,0.07)]">
        {items.map((it) => (
          <li key={it.key}>
            <button
              onClick={() => onChange(it.key)}
              aria-current={active === it.key ? "page" : undefined}
              className={cx(
                "flex w-full items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium transition",
                active === it.key ? "bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white shadow-[0_6px_14px_rgba(99,52,224,0.25)]" : "bg-white text-[#475569] hover:bg-[#f5f3ff] lg:bg-transparent",
              )}
            >
              <span className="[&>svg]:h-4 [&>svg]:w-4">{it.icon}</span>
              <span className="flex-1 text-left">{it.label}</span>
              {!!it.badge && <span className={cx("rounded-full px-1.5 text-[11px] font-bold", active === it.key ? "bg-white/25" : "bg-[#ede9fe] text-[#6d28d9]")}>{it.badge}</span>}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/**
 * Single-series monthly bar chart (one hue, thin bars, rounded data ends,
 * recessive grid, hover tooltip, table fallback for screen readers).
 */
export function MonthlyBars({ data, label }: { data: { month: string; value: number }[]; label: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 640, H = 220, pad = { l: 56, r: 12, t: 12, b: 28 };
  const max = Math.max(1, ...data.map((d) => d.value));
  const nice = (() => { const p = Math.pow(10, Math.floor(Math.log10(max))); return Math.ceil(max / p) * p; })();
  const bw = (W - pad.l - pad.r) / Math.max(1, data.length);
  const y = (v: number) => pad.t + (H - pad.t - pad.b) * (1 - v / nice);
  const ticks = [0, 0.5, 1].map((f) => nice * f);
  if (!data.some((d) => d.value > 0)) return <EmptyState title="No data yet" body={`${label} will appear here once there is activity.`} />;
  return (
    <figure className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={label}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="#ede9fe" strokeWidth={1} />
            <text x={pad.l - 8} y={y(t) + 4} textAnchor="end" fontSize="10" fill="#94a3b8">{t >= 1000 ? `৳${Math.round(t / 1000)}k` : `৳${Math.round(t)}`}</text>
          </g>
        ))}
        {data.map((d, i) => {
          const x = pad.l + i * bw + bw * 0.22, w = bw * 0.56, top = y(d.value), h = Math.max(0, H - pad.b - top);
          return (
            <g key={d.month} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <rect x={pad.l + i * bw} y={pad.t} width={bw} height={H - pad.t - pad.b} fill="transparent" />
              {h > 0 && <path d={`M${x},${H - pad.b} V${top + Math.min(4, h)} Q${x},${top} ${x + Math.min(4, w / 2)},${top} H${x + w - Math.min(4, w / 2)} Q${x + w},${top} ${x + w},${top + Math.min(4, h)} V${H - pad.b} Z`} fill={hover === i ? "#6d28d9" : "#8b5cf6"} />}
              <text x={pad.l + i * bw + bw / 2} y={H - 9} textAnchor="middle" fontSize="10" fill="#64748b">{monthLabel(d.month)}</text>
            </g>
          );
        })}
      </svg>
      {hover !== null && (
        <div className="pointer-events-none absolute top-1 rounded-lg bg-[#1e1b4b] px-2.5 py-1.5 text-xs text-white shadow-lg" style={{ left: `${((pad.l + hover * bw + bw / 2) / W) * 100}%`, transform: "translateX(-50%)" }}>
          <div className="font-semibold">{taka(data[hover].value)}</div>
          <div className="text-white/70">{data[hover].month}</div>
        </div>
      )}
      <table className="sr-only">
        <caption>{label}</caption>
        <tbody>{data.map((d) => <tr key={d.month}><th>{d.month}</th><td>{taka(d.value)}</td></tr>)}</tbody>
      </table>
    </figure>
  );
}

/** Horizontal share bars (e.g. subscribers per plan). Text stays in ink colours; the bar carries the plan colour. */
export function ShareBars({ rows, valueLabel }: { rows: { label: string; value: number; color?: string | null; hint?: string }[]; valueLabel: (v: number) => string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (!rows.length) return <EmptyState title="Nothing to show yet" />;
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="font-medium text-[#1e1b4b]">{r.label}</span>
            <span className="text-[#475569]">{valueLabel(r.value)}{r.hint ? <span className="ml-2 text-xs text-[#94a3b8]">{r.hint}</span> : null}</span>
          </div>
          <div className="h-2 rounded-full bg-[#f1f0ff]">
            <div className="h-2 rounded-full" style={{ width: `${(r.value / max) * 100}%`, background: r.color || "#7c3aed" }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
