"use client";

// Shared payout design language (admin + vendor): white panels, 1px slate
// borders, 8px radii, compact 44px table rows and indigo #4338CA accents.
// Mirrors stitch_web_page_ui_design/finixmart_admin_console.

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Loader2, Search, X } from "lucide-react";
import { monthLabel, taka } from "@/lib/billing/format";

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export const INDIGO = "#4338CA";

export const inputCls =
  "h-9 w-full rounded border border-slate-300 bg-white px-2.5 text-[13px] text-slate-800 placeholder:text-slate-400 focus:border-[#4338CA] focus:outline-none focus:ring-2 focus:ring-[#4338CA]/15 disabled:bg-slate-50 disabled:text-slate-400";
export const textareaCls = cx(inputCls, "h-auto min-h-[88px] py-2");
export const tableCls = "w-full min-w-[720px] border-collapse text-left text-[13px]";
export const thCls = "whitespace-nowrap border-b border-slate-200 bg-slate-50 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500";
export const tdCls = "h-11 border-b border-slate-100 px-3 py-2 align-middle text-slate-700";
export const moneyCls = "tabular-nums";

export function PayoutShell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cx("min-h-full rounded-xl bg-[#f8fafc] p-3 sm:p-5 lg:p-6", className)}>
      {children}
    </div>
  );
}

export function Breadcrumb({ items }: { items: string[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-2 flex items-center gap-1.5 overflow-x-auto whitespace-nowrap text-[11px] text-slate-500">
      {items.map((it, i) => (
        <span key={it} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-slate-300">/</span>}
          <span className={i === items.length - 1 ? "font-medium text-slate-700" : ""}>{it}</span>
        </span>
      ))}
    </nav>
  );
}

export interface PageTab { key: string; label: string; icon?: ReactNode }
export function PageTabs({ items, active, onChange }: { items: PageTab[]; active: string; onChange: (k: string) => void }) {
  return (
    <div role="tablist" aria-label="Payout sections" className="-mx-3 mb-4 overflow-x-auto border-b border-slate-200 px-3 sm:-mx-5 sm:px-5">
      <div className="flex min-w-max gap-0.5 md:min-w-0 md:w-full md:flex-wrap">
        {items.map((it) => {
          const on = it.key === active;
          return (
            <button
              key={it.key}
              role="tab"
              aria-selected={on}
              onClick={() => onChange(it.key)}
              className={cx(
                "relative flex items-center gap-1.5 px-2 pb-2.5 pt-1 text-[13px] font-medium transition-colors sm:px-2.5",
                on ? "text-[#4338CA]" : "text-slate-500 hover:text-slate-800",
              )}
            >
              {it.icon && <span className="[&>svg]:h-3.5 [&>svg]:w-3.5">{it.icon}</span>}
              {it.label}
              <span aria-hidden className={cx("absolute inset-x-1 -bottom-px h-0.5 rounded-full", on ? "bg-[#4338CA]" : "bg-transparent")} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle, badge, icon, actions }: { title: string; subtitle?: ReactNode; badge?: ReactNode; icon?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          {icon && <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#eef2ff] text-[#4338CA] [&>svg]:h-4 [&>svg]:w-4">{icon}</span>}
          <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-[22px]">{title}</h1>
          {badge}
        </div>
        {subtitle && <p className="mt-1 text-[13px] text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ children, className, title, subtitle, action, flush }: {
  children: ReactNode; className?: string; title?: ReactNode; subtitle?: ReactNode; action?: ReactNode; flush?: boolean;
}) {
  return (
    <section className={cx("rounded-lg border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]", className)}>
      {(title || action) && (
        <div className="flex min-h-11 flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-2.5">
          <div className="min-w-0">
            {title && <h2 className="text-[13px] font-semibold text-slate-800">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-[11px] text-slate-500">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={flush ? "" : "p-4"}>{children}</div>
    </section>
  );
}

const ICON_TONES: Record<string, string> = {
  indigo: "bg-[#eef2ff] text-[#4338CA]",
  green: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  rose: "bg-rose-50 text-rose-600",
  sky: "bg-sky-50 text-sky-600",
  slate: "bg-slate-100 text-slate-600",
};

export function StatCard({ label, value, hint, icon, accent = "indigo", footer }: {
  label: string; value: ReactNode; hint?: ReactNode; icon?: ReactNode; accent?: keyof typeof ICON_TONES; footer?: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.09em] text-slate-500">{label}</p>
          <p className="mt-1 text-[18px] font-semibold tracking-tight text-slate-900 tabular-nums sm:truncate sm:text-[22px]">{value}</p>
          {hint && <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-slate-500">{hint}</p>}
        </div>
        {icon && <span className={cx("grid h-8 w-8 shrink-0 place-items-center rounded-md [&>svg]:h-4 [&>svg]:w-4", ICON_TONES[accent])}>{icon}</span>}
      </div>
      {footer && <div className="mt-2.5 border-t border-slate-100 pt-2 text-[11px] text-slate-500">{footer}</div>}
    </div>
  );
}

const TONES = {
  green: "border-emerald-200 bg-emerald-50 text-emerald-700",
  amber: "border-amber-200 bg-amber-50 text-amber-700",
  red: "border-rose-200 bg-rose-50 text-rose-700",
  slate: "border-slate-200 bg-slate-50 text-slate-600",
  violet: "border-indigo-200 bg-indigo-50 text-indigo-700",
  blue: "border-sky-200 bg-sky-50 text-sky-700",
};

export function Badge({ tone = "slate", children, dot }: { tone?: keyof typeof TONES; children: ReactNode; dot?: boolean }) {
  const dotColor = { green: "bg-emerald-500", amber: "bg-amber-500", red: "bg-rose-500", slate: "bg-slate-400", violet: "bg-indigo-500", blue: "bg-sky-500" }[tone];
  return (
    <span className={cx("inline-flex items-center gap-1.5 whitespace-nowrap rounded border px-1.5 py-0.5 text-[11px] font-medium leading-4", TONES[tone])}>
      {dot && <span aria-hidden className={cx("h-1.5 w-1.5 rounded-full", dotColor)} />}
      {children}
    </span>
  );
}

export function Button({
  children, onClick, variant = "primary", type = "button", disabled, loading, className, size = "md", title,
}: {
  children: ReactNode; onClick?: () => void; variant?: "primary" | "secondary" | "danger" | "ghost"; type?: "button" | "submit";
  disabled?: boolean; loading?: boolean; className?: string; size?: "sm" | "md"; title?: string;
}) {
  const v = {
    primary: "border border-[#4338CA] bg-[#4338CA] text-white hover:bg-[#3730A3] hover:border-[#3730A3] focus-visible:ring-[#4338CA]/30",
    secondary: "border border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50 focus-visible:ring-slate-300",
    danger: "border border-rose-200 bg-rose-50 text-rose-700 hover:border-rose-300 hover:bg-rose-100 focus-visible:ring-rose-200",
    ghost: "border border-transparent bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-slate-200",
  }[variant];
  return (
    <button
      type={type}
      title={title}
      onClick={onClick}
      disabled={disabled || loading}
      className={cx(
        "inline-flex items-center justify-center gap-1.5 rounded font-semibold transition focus:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50",
        size === "sm" ? "h-7 px-2 text-[11px]" : "h-9 px-3 text-[12px]",
        v,
        className,
      )}
    >
      {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

export function Field({ label, hint, children, error }: { label: string; hint?: string; children: ReactNode; error?: string | null }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold text-slate-600">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-[11px] text-rose-600">{error}</span> : hint ? <span className="mt-1 block text-[11px] leading-4 text-slate-500">{hint}</span> : null}
    </label>
  );
}

export function Toggle({ checked, onChange, label, hint, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string; disabled?: boolean }) {
  return (
    <label className={cx("flex items-start gap-2.5", disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer")}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cx("relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors", checked ? "bg-[#4338CA]" : "bg-slate-300")}
      >
        <span className={cx("absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all", checked ? "left-[18px]" : "left-0.5")} />
      </button>
      <span>
        <span className="block text-[12px] font-medium text-slate-800">{label}</span>
        {hint && <span className="mt-0.5 block text-[11px] leading-4 text-slate-500">{hint}</span>}
      </span>
    </label>
  );
}

export function Notice({ tone = "violet", children }: { tone?: "violet" | "amber" | "red" | "green" | "slate"; children: ReactNode }) {
  const t = {
    violet: "border-indigo-200 bg-indigo-50 text-indigo-800",
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    red: "border-rose-200 bg-rose-50 text-rose-700",
    green: "border-emerald-200 bg-emerald-50 text-emerald-800",
    slate: "border-slate-200 bg-slate-50 text-slate-600",
  }[tone];
  return <div role={tone === "red" ? "alert" : "status"} className={cx("rounded border px-3 py-2 text-[12px] leading-5", t)}>{children}</div>;
}

export function EmptyState({ icon, title, body, action }: { icon?: ReactNode; title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/50 px-6 py-10 text-center">
      {icon && <span className="mb-2.5 grid h-9 w-9 place-items-center rounded-md bg-white text-slate-400 shadow-sm [&>svg]:h-4 [&>svg]:w-4">{icon}</span>}
      <p className="text-[13px] font-semibold text-slate-700">{title}</p>
      {body && <p className="mt-1 max-w-md text-[12px] leading-5 text-slate-500">{body}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function Skeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => <div key={i} className="h-10 animate-pulse rounded bg-slate-100" />)}
    </div>
  );
}

export function Modal({ open, title, onClose, children, footer, wide }: {
  open: boolean; title: string; onClose: () => void; children: ReactNode; footer?: ReactNode; wide?: boolean;
}) {
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
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-900/40 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={id} className={cx("flex max-h-[92vh] w-full flex-col rounded-t-xl bg-white shadow-xl outline-none sm:rounded-lg", wide ? "sm:max-w-4xl" : "sm:max-w-lg")}>
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 id={id} className="text-[14px] font-semibold text-slate-900">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800"><X className="h-4 w-4" /></button>
        </div>
        <div className="overflow-y-auto px-4 py-3.5">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 px-4 py-2.5">{footer}</div>}
      </div>
    </div>
  );
}

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
      {body && <div className="mb-3 text-[12px] leading-5 text-slate-600">{body}</div>}
      {extra}
      <Field label="Reason" hint="Kept in the audit log (at least 3 characters).">
        <textarea className={textareaCls} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} />
      </Field>
    </Modal>
  );
}

export function PillTabs({ options, value, onChange, className }: {
  options: { key: string; label: string; count?: number }[]; value: string; onChange: (k: string) => void; className?: string;
}) {
  return (
    <div className={cx("flex flex-wrap items-center gap-1", className)}>
      {options.map((o) => {
        const on = o.key === value;
        return (
          <button
            key={o.key}
            onClick={() => onChange(o.key)}
            aria-pressed={on}
            className={cx(
              "inline-flex h-7 items-center gap-1.5 rounded border px-2.5 text-[11px] font-medium transition-colors",
              on ? "border-[#4338CA] bg-[#eef2ff] text-[#4338CA]" : "border-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-800",
            )}
          >
            {o.label}
            {o.count !== undefined && <span className={cx("rounded px-1 text-[10px] tabular-nums", on ? "bg-white text-[#4338CA]" : "bg-slate-100 text-slate-500")}>{o.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

export function SearchBox({ value, onChange, placeholder, className }: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string }) {
  return (
    <div className={cx("relative", className)}>
      <Search aria-hidden className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
      <input className={cx(inputCls, "pl-8")} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} />
    </div>
  );
}

export function Pager({ page, pages, onPage, total, pageSize }: { page: number; pages: number; onPage: (p: number) => void; total?: number; pageSize?: number }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-4 py-2.5">
      <p className="text-[11px] text-slate-500">
        {total !== undefined ? <>Showing page <b className="text-slate-700">{page}</b> of <b className="text-slate-700">{pages}</b> · {total} record{total === 1 ? "" : "s"}</> : <>Page {page} of {pages}</>}
        {pageSize ? ` · ${pageSize} per page` : ""}
      </p>
      <div className="flex items-center gap-1">
        <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</Button>
        <span className="grid h-7 min-w-7 place-items-center rounded bg-[#4338CA] px-1.5 text-[11px] font-semibold text-white tabular-nums">{page}</span>
        <Button size="sm" variant="secondary" disabled={page >= pages} onClick={() => onPage(page + 1)}>Next</Button>
      </div>
    </div>
  );
}

export function Avatar({ name }: { name: string }) {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";
  return (
    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-indigo-100 bg-[#eef2ff] text-[11px] font-bold text-[#4338CA]">
      {initials}
    </span>
  );
}

export function Progress({ segments, total }: { segments: { label: string; value: number; color: string }[]; total?: number }) {
  const sum = total ?? segments.reduce((s, x) => s + Math.max(0, x.value), 0);
  return (
    <div>
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-slate-100">
        {sum > 0 ? segments.map((s) => (
          <span key={s.label} title={`${s.label}: ${taka(s.value)}`} style={{ width: `${(Math.max(0, s.value) / sum) * 100}%`, background: s.color }} className="h-full" />
        )) : null}
      </div>
      <ul className="mt-2.5 space-y-1.5">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center gap-2 text-[11px]">
            <span aria-hidden className="h-2 w-2 rounded-full" style={{ background: s.color }} />
            <span className="flex-1 text-slate-500">{s.label}</span>
            <span className="font-medium text-slate-700 tabular-nums">{taka(s.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Single-series paid-payouts chart; the hue carries the series, text stays slate. */
export function MonthlyBars({ data, label }: { data: { month: string; value: number }[]; label: string }) {
  if (!data.some((d) => d.value > 0)) return <EmptyState title="No payout history yet" body={`${label} will appear here once vendors are paid.`} />;
  return (
    <div className="h-[240px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, left: -18, bottom: 0 }} barCategoryGap="28%">
          <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="3 3" />
          <XAxis dataKey="month" tickFormatter={(v: string) => monthLabel(v)} tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={{ stroke: "#e2e8f0" }} />
          <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} tickFormatter={(v: number) => (v >= 1000 ? `৳${Math.round(v / 1000)}k` : `৳${v}`)} />
          <Tooltip
            cursor={{ fill: "#f1f5f9" }}
            content={({ active, payload, label: l }) => active && payload?.length ? (
              <div className="rounded border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] shadow-md">
                <div className="font-semibold text-slate-800 tabular-nums">{taka(payload[0].value as number)}</div>
                <div className="text-slate-500">{monthLabel(String(l))}</div>
              </div>
            ) : null}
          />
          <Bar dataKey="value" name={label} fill={INDIGO} radius={[3, 3, 0, 0]} maxBarSize={28} isAnimationActive={false}>
            {data.map((d, i) => <Cell key={d.month} fill={i === data.length - 1 ? "#6366F1" : INDIGO} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Compact inline "dot + label" used in table cells. */
export function Dot({ tone = "slate" }: { tone?: "green" | "amber" | "red" | "indigo" | "slate" }) {
  const c = { green: "bg-emerald-500", amber: "bg-amber-500", red: "bg-rose-500", indigo: "bg-indigo-500", slate: "bg-slate-400" }[tone];
  return <span aria-hidden className={cx("inline-block h-1.5 w-1.5 shrink-0 rounded-full", c)} />;
}
