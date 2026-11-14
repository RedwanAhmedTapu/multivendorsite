// components/vendor-performance/shared.tsx
//
// Small presentational pieces shared by the scoreboard, the drawer and the
// admin tabs. Colours always come with a text label, never colour alone.

"use client";

import * as React from "react";
import { AlertTriangle, CalendarClock, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSetVendorDocumentExpiryMutation } from "@/features/vendorPerformanceApi";
import {
  apiErrorText,
  formatDay,
  gradeMeta,
  kycMeta,
  TONE_CLASS,
  type Tone,
} from "./format";

export function Chip({
  tone = "slate",
  children,
  title,
}: {
  tone?: Tone;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap",
        TONE_CLASS[tone],
      )}
    >
      {children}
    </span>
  );
}

export function GradeBadge({ grade, compact = false }: { grade: string | null | undefined; compact?: boolean }) {
  const meta = gradeMeta(grade);
  return (
    <Chip tone={meta.tone} title={meta.description}>
      {compact ? (grade === "NOT_ENOUGH_DATA" ? "Collecting" : grade === "AT_RISK" ? "At risk" : meta.label) : meta.label}
    </Chip>
  );
}

export function KycChip({ status }: { status: string | null | undefined }) {
  const meta = kycMeta(status);
  return <Chip tone={meta.tone}>{meta.label}</Chip>;
}

export function Meter({
  value,
  tone = "indigo",
  className,
  label,
}: {
  value: number | null | undefined;
  tone?: Tone;
  className?: string;
  label?: string;
}) {
  const width = typeof value === "number" && Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0;
  const bar: Record<Tone, string> = {
    emerald: "bg-emerald-500",
    indigo: "bg-indigo-500",
    sky: "bg-sky-500",
    amber: "bg-amber-500",
    rose: "bg-rose-500",
    slate: "bg-slate-400",
  };
  return (
    <div
      role="meter"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={typeof value === "number" ? Math.round(value) : undefined}
      aria-label={label}
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-muted", className)}
    >
      <div
        className={cn("h-full rounded-full transition-all", bar[tone])}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

const KPI_SKIN: Record<Tone, { card: string; tile: string; label: string; hint: string }> = {
  indigo: {
    card: "border-indigo-200/80 bg-gradient-to-br from-indigo-50 via-white to-violet-50 dark:border-indigo-900/60 dark:from-indigo-950/50 dark:via-slate-900 dark:to-violet-950/40",
    tile: "from-indigo-500 to-violet-600 shadow-indigo-500/30",
    label: "text-indigo-700/80 dark:text-indigo-300",
    hint: "text-indigo-950/60 dark:text-indigo-200/60",
  },
  emerald: {
    card: "border-emerald-200/80 bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:border-emerald-900/60 dark:from-emerald-950/50 dark:via-slate-900 dark:to-teal-950/40",
    tile: "from-emerald-500 to-teal-600 shadow-emerald-500/30",
    label: "text-emerald-700/80 dark:text-emerald-300",
    hint: "text-emerald-950/60 dark:text-emerald-200/60",
  },
  sky: {
    card: "border-sky-200/80 bg-gradient-to-br from-sky-50 via-white to-cyan-50 dark:border-sky-900/60 dark:from-sky-950/50 dark:via-slate-900 dark:to-cyan-950/40",
    tile: "from-sky-500 to-cyan-600 shadow-sky-500/30",
    label: "text-sky-700/80 dark:text-sky-300",
    hint: "text-sky-950/60 dark:text-sky-200/60",
  },
  amber: {
    card: "border-amber-200/80 bg-gradient-to-br from-amber-50 via-white to-orange-50 dark:border-amber-900/60 dark:from-amber-950/50 dark:via-slate-900 dark:to-orange-950/40",
    tile: "from-amber-500 to-orange-600 shadow-amber-500/30",
    label: "text-amber-700/80 dark:text-amber-300",
    hint: "text-amber-950/60 dark:text-amber-200/60",
  },
  rose: {
    card: "border-rose-200/80 bg-gradient-to-br from-rose-50 via-white to-pink-50 dark:border-rose-900/60 dark:from-rose-950/50 dark:via-slate-900 dark:to-pink-950/40",
    tile: "from-rose-500 to-pink-600 shadow-rose-500/30",
    label: "text-rose-700/80 dark:text-rose-300",
    hint: "text-rose-950/60 dark:text-rose-200/60",
  },
  slate: {
    card: "border-slate-200/80 bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:border-slate-700/60 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800",
    tile: "from-slate-500 to-slate-700 shadow-slate-500/30",
    label: "text-slate-600 dark:text-slate-300",
    hint: "text-slate-600 dark:text-slate-400",
  },
};

export function Kpi({
  label,
  value,
  hint,
  tone = "indigo",
  icon,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  tone?: Tone;
  icon?: React.ReactNode;
}) {
  const skin = KPI_SKIN[tone];
  return (
    <div className={cn("relative overflow-hidden rounded-2xl border p-3.5 shadow-sm", skin.card)}>
      <span
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-10 h-24 w-24 rounded-full bg-white/50 blur-2xl dark:bg-white/5"
      />
      <div className="relative flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className={cn("text-[10px] font-bold uppercase tracking-[0.09em]", skin.label)}>
            {label}
          </p>
          <div className="mt-1.5 flex items-baseline gap-1.5 text-[24px] font-extrabold leading-none tracking-tight tabular-nums text-slate-900 dark:text-white sm:text-[26px]">
            {value}
          </div>
          {hint ? (
            <p className={cn("mt-1.5 line-clamp-2 text-[11px] leading-4", skin.hint)}>{hint}</p>
          ) : null}
        </div>
        {icon ? (
          <span
            className={cn(
              "grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-white shadow-md [&>svg]:h-4 [&>svg]:w-4",
              skin.tile,
            )}
          >
            {icon}
          </span>
        ) : null}
      </div>
    </div>
  );
}

const PANEL_HEAD: Record<Tone, string> = {
  indigo: "from-indigo-50/90 via-white to-violet-50/70 dark:from-indigo-950/50 dark:via-slate-900 dark:to-violet-950/30",
  emerald: "from-emerald-50/90 via-white to-teal-50/70 dark:from-emerald-950/50 dark:via-slate-900 dark:to-teal-950/30",
  sky: "from-sky-50/90 via-white to-cyan-50/70 dark:from-sky-950/50 dark:via-slate-900 dark:to-cyan-950/30",
  amber: "from-amber-50/90 via-white to-orange-50/70 dark:from-amber-950/50 dark:via-slate-900 dark:to-orange-950/30",
  rose: "from-rose-50/90 via-white to-pink-50/70 dark:from-rose-950/50 dark:via-slate-900 dark:to-pink-950/30",
  slate: "from-slate-50/90 via-white to-slate-100/70 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800/60",
};

const PANEL_TILE: Record<Tone, string> = {
  indigo: "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300",
  emerald: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300",
  sky: "bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300",
  amber: "bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300",
  rose: "bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300",
  slate: "bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-300",
};

/** Tinted panel header + rounded-2xl body used across the performance tabs. */
export function Panel({
  title,
  subtitle,
  icon,
  tone = "indigo",
  action,
  children,
  className,
  bodyClassName,
}: {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  tone?: Tone;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn("overflow-hidden rounded-2xl border bg-card shadow-sm", className)}>
      {title ? (
        <header
          className={cn(
            "flex flex-wrap items-center justify-between gap-2 border-b bg-gradient-to-r px-3 py-2.5",
            PANEL_HEAD[tone],
          )}
        >
          <div className="flex min-w-0 items-center gap-2">
            {icon ? (
              <span
                className={cn(
                  "grid h-6 w-6 shrink-0 place-items-center rounded-lg [&>svg]:h-3.5 [&>svg]:w-3.5",
                  PANEL_TILE[tone],
                )}
              >
                {icon}
              </span>
            ) : null}
            <div className="min-w-0">
              <h3 className="text-[13px] font-semibold leading-tight">{title}</h3>
              {subtitle ? (
                <p className="text-[11px] leading-4 text-muted-foreground">{subtitle}</p>
              ) : null}
            </div>
          </div>
          {action}
        </header>
      ) : null}
      <div className={bodyClassName ?? "p-3"}>{children}</div>
    </section>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-6 py-12 text-center">
      <p className="text-sm font-medium">{title}</p>
      {description ? <p className="max-w-md text-xs text-muted-foreground">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  title = "Failed to load",
  message,
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-rose-200 px-6 py-12 text-center dark:border-rose-900/60">
      <AlertTriangle className="h-5 w-5 text-rose-500" />
      <p className="text-sm font-medium">{title}</p>
      {message ? <p className="max-w-md text-xs text-muted-foreground">{message}</p> : null}
      {onRetry ? (
        <Button size="sm" variant="outline" onClick={onRetry} className="mt-2">
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Retry
        </Button>
      ) : null}
    </div>
  );
}

export function SectionHeading({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        {description ? <p className="mt-0.5 text-xs text-muted-foreground">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

/* ─── set-expiry dialog ─────────────────────────────────────────────────── */

export interface ExpiryTarget {
  documentId: string;
  label: string;
  storeName?: string;
  expiresAt: string | null;
}

/** Date input value from the UTC date the API stores (avoids an off-by-one). */
export function expiryInputValue(iso: string | null): string {
  if (!iso) return "";
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(iso);
  return match ? match[1] : "";
}

export function SetExpiryDialog({
  target,
  onClose,
}: {
  target: ExpiryTarget | null;
  onClose: () => void;
}) {
  const [value, setValue] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [setExpiry, { isLoading }] = useSetVendorDocumentExpiryMutation();

  React.useEffect(() => {
    setValue(expiryInputValue(target?.expiresAt ?? null));
    setError(null);
  }, [target]);

  async function submit() {
    if (!target) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      setError("Pick an expiry date first.");
      return;
    }
    setError(null);
    try {
      const result = await setExpiry({
        documentId: target.documentId,
        expiresAt: `${value}T00:00:00.000Z`,
      }).unwrap();
      if (result.changed) {
        toast.success(
          result.revived
            ? `Expiry saved (${formatDay(result.document.expiresAt)}) — document revived to approved.`
            : `Expiry saved: ${formatDay(result.document.expiresAt)}.`,
        );
      } else {
        toast.info("This expiry date is already on file — nothing changed.");
      }
      onClose();
    } catch (err) {
      const text = apiErrorText(err, "Could not save the expiry date.");
      setError(text.details.length ? `${text.message} — ${text.details.join("; ")}` : text.message);
    }
  }

  return (
    <Dialog open={Boolean(target)} onOpenChange={(open) => (open ? undefined : onClose())}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4" /> Record document expiry
          </DialogTitle>
          <DialogDescription>
            {target ? (
              <>
                {target.label}
                {target.storeName ? ` — ${target.storeName}` : ""}. Current expiry:{" "}
                {target.expiresAt ? formatDay(target.expiresAt) : "not recorded"}.
              </>
            ) : null}{" "}
            A future date revives an expired or unknown document to approved. Sending the same date
            again changes nothing.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <label htmlFor="expiry-date" className="text-xs font-medium text-muted-foreground">
            Expiry date
          </label>
          <Input
            id="expiry-date"
            type="date"
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
          {error ? <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p> : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
            Save expiry
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function LoadingBlock({ label = "Loading…", rows = 4 }: { label?: string; rows?: number }) {
  return (
    <div aria-busy="true" aria-label={label} className="space-y-2">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="h-11 animate-pulse rounded-lg bg-muted" />
      ))}
    </div>
  );
}
