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

const DOT_CLASS: Record<Tone, string> = {
  emerald: "bg-emerald-500",
  indigo: "bg-indigo-500",
  sky: "bg-sky-500",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
  slate: "bg-slate-400",
};

export function Kpi({
  label,
  value,
  hint,
  tone = "slate",
  icon,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  tone?: Tone;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-card p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        {icon ? <span className="text-muted-foreground">{icon}</span> : null}
      </div>
      <div className="mt-1 flex items-end gap-2">
        <span className="text-2xl font-semibold leading-none tabular-nums">{value}</span>
        {tone !== "slate" ? <span className={cn("mb-0.5 h-2 w-2 rounded-full", DOT_CLASS[tone])} /> : null}
      </div>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
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
