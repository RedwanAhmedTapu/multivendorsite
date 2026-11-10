// components/offers/shared/offer-ui.tsx
//
// Offer management design system — the presentational pieces shared by the
// Admin and Vendor offer pages (header, approval banner, stat cards, status
// tabs, toolbar, table states, badges, voucher code, confirmation dialog).
// Pure UI: no data fetching and no permission decisions — callers pass in
// what they are allowed to show.

"use client";

import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { AlertTriangle, Check, ChevronLeft, ChevronRight, Copy, RefreshCw, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  DISPLAY_STATUS_LABEL,
  offerTypeLabel,
  type OfferDisplayStatus,
} from "@/lib/offers/offer-view";

export type OfferTone = "indigo" | "blue" | "violet" | "cyan" | "emerald" | "amber" | "rose" | "orange" | "slate";

const TONE: Record<OfferTone, { icon: string; soft: string; text: string; ring: string }> = {
  indigo: { icon: "from-indigo-500 to-indigo-600", soft: "bg-indigo-50", text: "text-indigo-700", ring: "ring-indigo-100" },
  blue: { icon: "from-blue-500 to-blue-600", soft: "bg-blue-50", text: "text-blue-700", ring: "ring-blue-100" },
  violet: { icon: "from-violet-500 to-violet-600", soft: "bg-violet-50", text: "text-violet-700", ring: "ring-violet-100" },
  cyan: { icon: "from-cyan-500 to-cyan-600", soft: "bg-cyan-50", text: "text-cyan-700", ring: "ring-cyan-100" },
  emerald: { icon: "from-emerald-500 to-emerald-600", soft: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-100" },
  amber: { icon: "from-amber-400 to-amber-500", soft: "bg-amber-50", text: "text-amber-700", ring: "ring-amber-100" },
  rose: { icon: "from-rose-500 to-rose-600", soft: "bg-rose-50", text: "text-rose-700", ring: "ring-rose-100" },
  orange: { icon: "from-orange-400 to-orange-500", soft: "bg-orange-50", text: "text-orange-700", ring: "ring-orange-100" },
  slate: { icon: "from-slate-500 to-slate-600", soft: "bg-slate-50", text: "text-slate-700", ring: "ring-slate-100" },
};

/** Card surface used across every offer page. */
export const offerCard = "rounded-2xl border border-[#E5EAF2] bg-white shadow-[0_1px_2px_rgba(13,27,46,0.04)]";

/** Primary gradient action (indigo → violet). */
export const offerPrimaryButton =
  "border-0 bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm shadow-indigo-600/20 hover:from-indigo-500 hover:to-violet-500 focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2";

/** Secondary action. */
export const offerSecondaryButton =
  "border-[#E5EAF2] bg-white text-[#0D1B2E] hover:bg-[#F5F8FD] focus-visible:ring-2 focus-visible:ring-indigo-300";

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

export function OfferPageHeader({
  icon: Icon,
  eyebrow,
  title,
  description,
  actions,
  meta,
}: {
  icon: LucideIcon;
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  meta?: React.ReactNode;
}) {
  return (
    <header className={cn(offerCard, "relative overflow-hidden px-4 py-4 sm:px-5")}>
      <div aria-hidden className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-gradient-to-br from-indigo-200/50 via-violet-200/40 to-cyan-200/30 blur-3xl" />
      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-sm shadow-indigo-600/25">
            <Icon className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0">
            {eyebrow && <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-indigo-600">{eyebrow}</p>}
            <h1 className="truncate text-xl font-bold tracking-tight text-[#0D1B2E] sm:text-2xl">{title}</h1>
            {description && <p className="mt-0.5 text-sm text-[#7A90AB]">{description}</p>}
            {meta && <div className="mt-2 flex flex-wrap items-center gap-2">{meta}</div>}
          </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2 sm:justify-end">{actions}</div>}
      </div>
    </header>
  );
}

/** Small pill for header metadata (limits, scopes). */
export function OfferMetaPill({ icon: Icon, children, tone = "slate" }: { icon?: LucideIcon; children: React.ReactNode; tone?: OfferTone }) {
  const t = TONE[tone];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1", t.soft, t.text, t.ring)}>
      {Icon && <Icon className="h-3.5 w-3.5" aria-hidden />}
      {children}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Banner (approval notices etc.)
// ---------------------------------------------------------------------------

export function OfferBanner({
  tone = "amber",
  icon: Icon = AlertTriangle,
  title,
  children,
  action,
}: {
  tone?: Extract<OfferTone, "amber" | "indigo" | "rose" | "cyan" | "emerald">;
  icon?: LucideIcon;
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
}) {
  const t = TONE[tone];
  return (
    <div role="status" className={cn("flex flex-col gap-3 rounded-2xl px-4 py-3 ring-1 sm:flex-row sm:items-center sm:justify-between", t.soft, t.ring)}>
      <div className="flex items-start gap-3">
        <span className={cn("mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-gradient-to-br text-white", t.icon)}>
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <div className="text-sm">
          <p className={cn("font-semibold", t.text)}>{title}</p>
          {children && <div className="mt-0.5 text-[#3D5068]">{children}</div>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stat cards
// ---------------------------------------------------------------------------

export function OfferStatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone,
  loading,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon: LucideIcon;
  tone: OfferTone;
  loading?: boolean;
}) {
  const t = TONE[tone];
  return (
    <div className={cn(offerCard, "flex items-start gap-3 p-3.5")}>
      <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-white shadow-sm", t.icon)}>
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-[#7A90AB]">{label}</p>
        {loading ? (
          <Skeleton className="mt-1.5 h-6 w-16" />
        ) : (
          <p className="mt-0.5 text-xl font-bold tabular-nums tracking-tight text-[#0D1B2E]">{value}</p>
        )}
        {hint && !loading && <p className="mt-0.5 truncate text-[11px] text-[#7A90AB]">{hint}</p>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Badges
// ---------------------------------------------------------------------------

const STATUS_STYLE: Record<OfferDisplayStatus, string> = {
  active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  scheduled: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  pending: "bg-amber-50 text-amber-700 ring-amber-200",
  inactive: "bg-slate-100 text-slate-600 ring-slate-200",
  expired: "bg-rose-50/70 text-rose-500 ring-rose-100",
  rejected: "bg-rose-50 text-rose-700 ring-rose-200",
};

const STATUS_DOT: Record<OfferDisplayStatus, string> = {
  active: "bg-emerald-500",
  scheduled: "bg-indigo-500",
  pending: "bg-amber-500",
  inactive: "bg-slate-400",
  expired: "bg-rose-300",
  rejected: "bg-rose-600",
};

export function OfferStatusBadge({ status, className }: { status: OfferDisplayStatus; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset", STATUS_STYLE[status], className)}>
      <span aria-hidden className={cn("h-1.5 w-1.5 rounded-full", STATUS_DOT[status])} />
      {DISPLAY_STATUS_LABEL[status]}
    </span>
  );
}

const TYPE_STYLE: Record<string, string> = {
  VOUCHER: "bg-violet-50 text-violet-700 ring-violet-200",
  FLASH_SALE: "bg-orange-50 text-orange-700 ring-orange-200",
  COUNTDOWN_DEAL: "bg-cyan-50 text-cyan-700 ring-cyan-200",
  REGULAR_DISCOUNT: "bg-blue-50 text-blue-700 ring-blue-200",
};

export function OfferTypeBadge({ type }: { type: string }) {
  return (
    <span className={cn("inline-flex whitespace-nowrap rounded-md px-1.5 py-0.5 text-[11px] font-medium ring-1 ring-inset", TYPE_STYLE[type] ?? "bg-indigo-50 text-indigo-700 ring-indigo-200")}>
      {offerTypeLabel(type)}
    </span>
  );
}

/** Thin usage meter — only rendered when a usage limit exists. */
export function UsageMeter({ percent }: { percent: number }) {
  return (
    <div className="mt-1 h-1 w-20 overflow-hidden rounded-full bg-[#EEF3FB]" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} aria-label="Usage">
      <div className={cn("h-full rounded-full", percent >= 90 ? "bg-rose-500" : percent >= 70 ? "bg-amber-500" : "bg-indigo-500")} style={{ width: `${percent}%` }} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Status tabs (segmented control, keyboard accessible)
// ---------------------------------------------------------------------------

export function OfferStatusTabs<T extends string>({
  value,
  onChange,
  tabs,
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  tabs: { value: T; label: string; count?: number }[];
  label: string;
}) {
  const refs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const onKey = (e: React.KeyboardEvent, i: number) => {
    const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const next = (i + d + tabs.length) % tabs.length;
    refs.current[next]?.focus();
    onChange(tabs[next].value);
  };
  return (
    <div role="tablist" aria-label={label} className="flex max-w-full gap-1 overflow-x-auto rounded-xl bg-[#F1F4F9] p-1 [scrollbar-width:none]">
      {tabs.map((t, i) => {
        const selected = t.value === value;
        return (
          <button
            key={t.value}
            ref={(el) => { refs.current[i] = el; }}
            type="button"
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(t.value)}
            onKeyDown={(e) => onKey(e, i)}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400",
              selected ? "bg-white text-indigo-700 shadow-sm" : "text-[#3D5068] hover:text-[#0D1B2E]",
            )}
          >
            {t.label}
            {typeof t.count === "number" && t.count > 0 && (
              <span className={cn("rounded-full px-1.5 text-[11px] tabular-nums", selected ? "bg-indigo-50 text-indigo-700" : "bg-white/70 text-[#7A90AB]")}>{t.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Toolbar
// ---------------------------------------------------------------------------

export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [v, setV] = React.useState(value);
  React.useEffect(() => {
    const id = setTimeout(() => setV(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return v;
}

export function OfferSearchInput({ value, onChange, placeholder, label }: { value: string; onChange: (v: string) => void; placeholder: string; label: string }) {
  return (
    <div className="relative min-w-0 flex-1">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7A90AB]" aria-hidden />
      <input
        type="search"
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9 w-full rounded-xl border border-[#E5EAF2] bg-white pl-9 pr-8 text-sm text-[#0D1B2E] placeholder:text-[#9AABC1] focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button type="button" onClick={() => onChange("")} aria-label="Clear search" className="absolute right-2 top-1/2 grid h-5 w-5 -translate-y-1/2 place-items-center rounded-md text-[#7A90AB] hover:bg-[#F1F4F9] hover:text-[#0D1B2E]">
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

export function OfferSelect<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  label: string;
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className="h-9 min-w-0 rounded-xl border border-[#E5EAF2] bg-white px-3 text-sm text-[#0D1B2E] focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

// ---------------------------------------------------------------------------
// Table states
// ---------------------------------------------------------------------------

export function OfferTableSkeleton({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="divide-y divide-[#EEF2F7]" aria-busy="true" aria-label="Loading offers">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4 px-4 py-3.5">
          <div className="flex min-w-0 flex-[2] items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
          {Array.from({ length: Math.max(0, cols - 2) }).map((__, c) => (
            <Skeleton key={c} className="hidden h-3.5 flex-1 md:block" />
          ))}
          <Skeleton className="h-7 w-7 rounded-md" />
        </div>
      ))}
    </div>
  );
}

export function OfferEmptyState({ icon: Icon, title, description, action }: { icon: LucideIcon; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 text-indigo-500 ring-1 ring-indigo-100">
        <Icon className="h-6 w-6" aria-hidden />
      </span>
      <p className="mt-3 text-sm font-semibold text-[#0D1B2E]">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-[#7A90AB]">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function OfferErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-rose-50 text-rose-500 ring-1 ring-rose-100">
        <AlertTriangle className="h-6 w-6" aria-hidden />
      </span>
      <p className="mt-3 text-sm font-semibold text-[#0D1B2E]">Couldn&apos;t load offers</p>
      <p className="mt-1 max-w-sm text-sm text-[#7A90AB]">{message}</p>
      {onRetry && (
        <Button type="button" variant="outline" size="sm" className={cn("mt-4", offerSecondaryButton)} onClick={onRetry}>
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Try again
        </Button>
      )}
    </div>
  );
}

/** Message from an RTK Query error, without leaking anything sensitive. */
export function offerErrorMessage(error: unknown): string {
  const e = error as { status?: unknown; data?: { message?: unknown } } | undefined;
  if (e?.status === 401) return "Your session has expired. Please sign in again.";
  if (e?.status === 403) return "You don't have permission to view these offers.";
  if (typeof e?.data?.message === "string" && e.data.message.length < 200) return e.data.message;
  if (e?.status === "FETCH_ERROR") return "The server could not be reached. Check your connection and try again.";
  return "Something went wrong while loading offers.";
}

export function OfferPagination({
  page,
  hasNext,
  onPage,
  shown,
  busy,
}: {
  page: number;
  hasNext: boolean;
  onPage: (p: number) => void;
  shown: number;
  busy?: boolean;
}) {
  if (page === 1 && !hasNext) return null;
  return (
    <nav aria-label="Offer pages" className="flex items-center justify-between gap-3 border-t border-[#EEF2F7] px-4 py-2.5 text-xs text-[#7A90AB]">
      <span>Page {page} · {shown} shown</span>
      <div className="flex items-center gap-1.5">
        <Button type="button" variant="outline" size="sm" className={cn("h-8", offerSecondaryButton)} disabled={page <= 1 || busy} onClick={() => onPage(page - 1)}>
          <ChevronLeft className="h-4 w-4" /> <span className="sr-only sm:not-sr-only">Previous</span>
        </Button>
        <Button type="button" variant="outline" size="sm" className={cn("h-8", offerSecondaryButton)} disabled={!hasNext || busy} onClick={() => onPage(page + 1)}>
          <span className="sr-only sm:not-sr-only">Next</span> <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </nav>
  );
}

// ---------------------------------------------------------------------------
// Voucher code with copy
// ---------------------------------------------------------------------------

export function VoucherCode({ code, size = "sm" }: { code: string; size?: "sm" | "lg" }) {
  const [copied, setCopied] = React.useState(false);
  React.useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(id);
  }, [copied]);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-lg border border-dashed border-violet-300 bg-violet-50/70 font-mono font-semibold text-violet-700", size === "lg" ? "px-3 py-1.5 text-base tracking-wider" : "px-1.5 py-0.5 text-[11px]")}>
      {code}
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? `Copied ${code}` : `Copy voucher code ${code}`}
        className="grid place-items-center rounded p-0.5 text-violet-500 hover:bg-violet-100 hover:text-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
      >
        {copied ? <Check className={size === "lg" ? "h-4 w-4" : "h-3 w-3"} /> : <Copy className={size === "lg" ? "h-4 w-4" : "h-3 w-3"} />}
      </button>
      <span className="sr-only" aria-live="polite">{copied ? "Copied" : ""}</span>
    </span>
  );
}

// ---------------------------------------------------------------------------
// Confirmation dialog
// ---------------------------------------------------------------------------

export function OfferConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText,
  tone = "default",
  busy,
  onConfirm,
  confirmDisabled,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: React.ReactNode;
  confirmText: string;
  tone?: "default" | "destructive" | "success";
  busy?: boolean;
  onConfirm: () => void;
  confirmDisabled?: boolean;
  children?: React.ReactNode;
}) {
  const iconTone = tone === "destructive" ? "bg-rose-50 text-rose-600 ring-rose-100" : tone === "success" ? "bg-emerald-50 text-emerald-600 ring-emerald-100" : "bg-indigo-50 text-indigo-600 ring-indigo-100";
  const btnTone = tone === "destructive" ? "bg-rose-600 text-white hover:bg-rose-500" : tone === "success" ? "bg-emerald-600 text-white hover:bg-emerald-500" : offerPrimaryButton;
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!busy) onOpenChange(o); }}>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-xl ring-1", iconTone)}>
              {tone === "success" ? <Check className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
            </span>
            <div className="space-y-1 text-left">
              <DialogTitle className="text-base text-[#0D1B2E]">{title}</DialogTitle>
              <DialogDescription className="text-sm text-[#3D5068]">{description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        {children}
        <DialogFooter className="gap-2 sm:gap-2">
          <Button type="button" variant="outline" className={offerSecondaryButton} disabled={busy} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" className={btnTone} disabled={busy || confirmDisabled} onClick={onConfirm}>
            {busy ? "Working…" : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
