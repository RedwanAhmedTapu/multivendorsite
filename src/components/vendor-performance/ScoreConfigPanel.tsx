// components/vendor-performance/ScoreConfigPanel.tsx
//
// "Score config" tab: the active version, every group/weight/threshold and the
// publish dialog. The backend validates weights (both levels sum to 100),
// distinct linear thresholds, descending grade bands and a required version;
// the dialog only adds a JSON parse check and a typed confirmation.

"use client";

import * as React from "react";
import {
  CalendarCheck,
  Code2,
  EyeOff,
  FileCog,
  Gauge,
  Loader2,
  Percent,
  Rocket,
  ShieldAlert,
} from "lucide-react";
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
import {
  useGetVendorPerformanceConfigQuery,
  usePublishVendorPerformanceConfigMutation,
} from "@/features/vendorPerformanceApi";
import type { ConfigResponse } from "./types";
import {
  apiErrorText,
  formatDay,
  formatNumber,
  metricDef,
  shadowModeText,
  thresholdText,
} from "./format";
import { Chip, ErrorState, Kpi, LoadingBlock, Panel } from "./shared";

export function ScoreConfigPanel() {
  const { data, isLoading, isError, error, refetch } = useGetVendorPerformanceConfigQuery();

  if (isLoading) return <LoadingBlock label="Loading score config" rows={5} />;
  if (isError || !data) {
    return (
      <ErrorState
        title="Could not load the score config"
        message={apiErrorText(error, "The config read failed.").message}
        onRetry={() => refetch()}
      />
    );
  }

  return <ConfigView data={data} />;
}

function ConfigView({ data }: { data: ConfigResponse }) {
  const config = data.config;
  const groups = config.groups;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi
          label="Active version"
          value={<span className="text-lg font-extrabold">{data.version}</span>}
          hint={`Source: ${data.source}`}
          tone="indigo"
          icon={<FileCog />}
        />
        <Kpi
          label="Published"
          value={<span className="text-lg font-extrabold">{data.createdAt ? formatDay(data.createdAt) : "Built-in default"}</span>}
          hint={data.createdAt ? "Audited config row" : "No row in vendor_performance_config"}
          tone="sky"
          icon={<CalendarCheck />}
        />
        <Kpi
          label="Minimum coverage"
          value={`${formatNumber(config.notEnoughDataCoveragePct, 0)}%`}
          hint="Below this the grade is “Collecting data”"
          tone="emerald"
          icon={<Percent />}
        />
        <Kpi
          label="At-risk cap"
          value={`${formatNumber(config.atRiskScoreCap, 0)}/100`}
          hint="Applied when KYC is past grace"
          tone="amber"
          icon={<ShieldAlert />}
        />
      </div>

      <Panel tone={data.shadowMode.visibleToVendors ? "emerald" : "amber"} icon={data.shadowMode.visibleToVendors ? <Rocket /> : <EyeOff />} title="Vendor visibility" subtitle="Controlled by the server flag — the UI cannot flip it">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">{shadowModeText(data.shadowMode.visibleToVendors)}</p>
          <Chip tone={data.shadowMode.visibleToVendors ? "emerald" : "amber"}>
            {data.shadowMode.visibleToVendors ? "Visible to vendors" : "Shadow mode"}
          </Chip>
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Controlled by VENDOR_PERFORMANCE_VISIBLE_TO_VENDORS on the server.
        </p>
        {data.note ? (
          <p className="mt-2 rounded-md bg-white/70 px-2 py-1 text-xs dark:bg-slate-900/60">Note: {data.note}</p>
        ) : null}
      </Panel>

      <Panel
        tone="rose"
        icon={<Gauge />}
        title="Grade bands"
        subtitle={`Catalog flag below ${formatNumber(config.catalogFlagMinProducts, 0)} qualified products`}
      >
        <div className="flex flex-wrap gap-1.5">
          {config.gradeBands.map((band) => (
            <Chip key={band.grade} tone="indigo">
              {band.grade} ≥ {formatNumber(band.min, 0)}
            </Chip>
          ))}
          <Chip tone="rose">At risk · capped at {formatNumber(config.atRiskScoreCap, 0)}</Chip>
          <Chip tone="slate">Collecting data · coverage &lt; {formatNumber(config.notEnoughDataCoveragePct, 0)}%</Chip>
        </div>
      </Panel>

      <div className="space-y-3">
        {groups.map((group) => (
          <section key={group.key} className="overflow-hidden rounded-2xl border bg-card">
            <header className="flex items-center justify-between border-b bg-gradient-to-r from-indigo-50 via-white to-violet-50 px-3 py-2 dark:from-indigo-950/40 dark:via-slate-900 dark:to-violet-950/30">
              <h4 className="text-sm font-semibold">{group.label}</h4>
              <span className="text-[11px] text-muted-foreground">
                Group weight {formatNumber(group.weight, 0)}%
              </span>
            </header>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                  <th className="px-3 py-1.5 font-medium">Metric</th>
                  <th className="px-3 py-1.5 font-medium">Weight</th>
                  <th className="px-3 py-1.5 font-medium">Scale</th>
                  <th className="px-3 py-1.5 font-medium">Threshold</th>
                </tr>
              </thead>
              <tbody>
                {group.metrics.map((metric) => {
                  const def = metricDef(metric.key);
                  return (
                    <tr key={metric.key} className="border-b last:border-0">
                      <td className="px-3 py-1.5">{def.label}</td>
                      <td className="px-3 py-1.5 tabular-nums">{formatNumber(metric.weight, 0)}%</td>
                      <td className="px-3 py-1.5 text-xs text-muted-foreground">{metric.scale}</td>
                      <td className="px-3 py-1.5 text-xs text-muted-foreground">
                        {thresholdText(metric, def)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-indigo-200/70 bg-gradient-to-r from-indigo-50 via-white to-violet-50 p-3 dark:border-indigo-900/60 dark:from-indigo-950/40 dark:via-slate-900 dark:to-violet-950/30">
        <p className="text-[11px] text-muted-foreground">
          Group weights sum to {formatNumber(groups.reduce((sum, group) => sum + group.weight, 0), 0)} ·
          metric weights per group sum to 100 · publishing creates a new version and keeps older
          rows for audit.
        </p>
        <PublishDialog data={data} />
      </div>
    </div>
  );
}

/* ─── colored JSON editor ───────────────────────────────────────────────── */

const JSON_TOKEN =
  /("(?:\\u[\da-fA-F]{4}|\\[^u]|[^\\"])*")(\s*:)?|\b(true|false|null)\b|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g;

function JsonHighlight({ text }: { text: string }) {
  const nodes: React.ReactNode[] = [];
  let last = 0;
  let index = 0;
  JSON_TOKEN.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = JSON_TOKEN.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    const [, str, colon, literal, number] = match;
    if (str) {
      nodes.push(
        <span
          key={index++}
          className={
            colon
              ? "font-semibold text-sky-600 dark:text-sky-300"
              : "text-emerald-600 dark:text-emerald-300"
          }
        >
          {str}
        </span>,
      );
      if (colon) {
        nodes.push(
          <span key={index++} className="text-slate-400 dark:text-slate-500">
            {colon}
          </span>,
        );
      }
    } else if (literal) {
      nodes.push(
        <span key={index++} className="font-semibold text-fuchsia-600 dark:text-fuchsia-300">
          {literal}
        </span>,
      );
    } else if (number) {
      nodes.push(
        <span key={index++} className="text-amber-600 dark:text-amber-300">
          {number}
        </span>,
      );
    }
    last = match.index + match[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return <>{nodes}</>;
}

const EDITOR_TEXT = "p-3 font-mono text-xs leading-5";

function JsonEditor({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (next: string) => void;
}) {
  const preRef = React.useRef<HTMLPreElement>(null);

  return (
    <div className="relative h-[42vh] min-h-[200px] overflow-hidden rounded-xl border border-indigo-200/80 bg-white shadow-inner dark:border-indigo-900/60 dark:bg-slate-950">
      <pre
        ref={preRef}
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 m-0 overflow-hidden whitespace-pre text-slate-700 dark:text-slate-200",
          EDITOR_TEXT,
        )}
      >
        <JsonHighlight text={value} />
        {"\n"}
      </pre>
      <textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onScroll={(event) => {
          const pre = preRef.current;
          if (!pre) return;
          pre.scrollTop = event.currentTarget.scrollTop;
          pre.scrollLeft = event.currentTarget.scrollLeft;
        }}
        wrap="off"
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        aria-label="Score config JSON"
        className={cn(
          "absolute inset-0 h-full w-full resize-none overflow-auto whitespace-pre rounded-xl border-0 bg-transparent text-transparent caret-sky-500 outline-none selection:bg-sky-300/40 selection:text-slate-900 focus-visible:ring-0 dark:caret-sky-300 dark:selection:text-white",
          EDITOR_TEXT,
        )}
      />
    </div>
  );
}

const LEGEND = [
  { label: "Key", className: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-300" },
  { label: "Text", className: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300" },
  { label: "Number", className: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300" },
  { label: "true / false / null", className: "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700 dark:border-fuchsia-900/60 dark:bg-fuchsia-950/40 dark:text-fuchsia-300" },
];

function PublishDialog({ data }: { data: ConfigResponse }) {
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState("");
  const [note, setNote] = React.useState("");
  const [confirmed, setConfirmed] = React.useState(false);
  const [localError, setLocalError] = React.useState<string | null>(null);
  const [details, setDetails] = React.useState<string[]>([]);
  const [publish, { isLoading }] = usePublishVendorPerformanceConfigMutation();

  function openDialog() {
    setDraft(JSON.stringify(data.config, null, 2));
    setNote("");
    setConfirmed(false);
    setLocalError(null);
    setDetails([]);
    setOpen(true);
  }

  async function submit() {
    let parsed: unknown;
    try {
      parsed = JSON.parse(draft);
    } catch {
      setLocalError("The config is not valid JSON.");
      return;
    }
    if (!parsed || typeof parsed !== "object") {
      setLocalError("The config must be a JSON object.");
      return;
    }
    if (typeof (parsed as { version?: unknown }).version !== "string" || !(parsed as { version: string }).version.trim()) {
      setLocalError("A version string is required.");
      return;
    }
    setLocalError(null);
    setDetails([]);
    try {
      const result = await publish({ config: parsed, note: note.trim() || null }).unwrap();
      toast.success(`Score config ${result.version} published and active.`);
      setOpen(false);
    } catch (error) {
      const text = apiErrorText(error, "Could not publish the config.");
      setLocalError(text.message);
      setDetails(text.details);
    }
  }

  return (
    <>
      <Button
        size="sm"
        onClick={openDialog}
        className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 text-white shadow-md shadow-indigo-500/30 hover:from-indigo-500 hover:via-violet-500 hover:to-fuchsia-500"
      >
        <FileCog className="mr-1.5 h-4 w-4" /> Publish new version
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex h-[80vh] w-full flex-col gap-0 overflow-hidden rounded-2xl border-indigo-200/70 p-0 shadow-2xl shadow-indigo-500/20 dark:border-indigo-900/60 [&>[data-slot=dialog-close]]:text-white [&>[data-slot=dialog-close]]:opacity-90 [&>[data-slot=dialog-close]]:hover:opacity-100 sm:max-w-2xl">
          <DialogHeader className="relative block shrink-0 overflow-hidden border-b border-indigo-500/30 bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 px-5 py-4 pr-12 text-left">
            <span
              aria-hidden
              className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full bg-white/20 blur-2xl"
            />
            <div className="relative flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/20 text-white ring-1 ring-white/30 backdrop-blur">
                <FileCog className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <DialogTitle className="text-base font-bold text-white">
                  Publish a new score config
                </DialogTitle>
                <DialogDescription className="mt-1 text-xs leading-5 text-indigo-100">
                  The server deactivates the current row and activates this one in a single
                  transaction (audited). Every existing snapshot keeps the version that produced it.
                  Change the version string, for example to <code>score-v2</code>.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-gradient-to-b from-indigo-50/40 via-white to-violet-50/40 px-5 py-4 dark:from-indigo-950/20 dark:via-slate-900 dark:to-violet-950/20">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label htmlFor="config-json" className="flex items-center gap-1.5 text-xs font-semibold">
                <Code2 className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-300" />
                Config JSON
                <span className="font-normal text-muted-foreground">· editable &amp; scrollable</span>
              </label>
              <div className="flex flex-wrap items-center gap-1">
                {LEGEND.map((item) => (
                  <span
                    key={item.label}
                    className={cn(
                      "rounded-md border px-1.5 py-0.5 text-[10px] font-semibold",
                      item.className,
                    )}
                  >
                    {item.label}
                  </span>
                ))}
              </div>
            </div>

            <JsonEditor id="config-json" value={draft} onChange={setDraft} />

            <label htmlFor="config-note" className="block text-xs font-semibold">
              Note (optional)
            </label>
            <Input
              id="config-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Why this version exists"
              className="border-indigo-200 bg-white dark:border-indigo-900/60 dark:bg-slate-950"
            />
            <label className="flex items-start gap-2 rounded-xl border border-indigo-200/70 bg-white/80 p-3 text-xs dark:border-indigo-900/60 dark:bg-slate-950/60">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 accent-indigo-600"
                checked={confirmed}
                onChange={(event) => setConfirmed(event.target.checked)}
              />
              <span>
                I understand this changes the score for every vendor from the next snapshot run
                onward.
              </span>
            </label>
            {localError ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
                <p className="font-semibold">{localError}</p>
                {details.length ? (
                  <ul className="mt-1 list-disc pl-4">
                    {details.map((detail) => (
                      <li key={detail}>{detail}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}
          </div>

          <DialogFooter className="shrink-0 flex-row items-center justify-end gap-2 border-t bg-gradient-to-r from-indigo-50 via-white to-violet-50 px-5 py-3 dark:from-indigo-950/40 dark:via-slate-900 dark:to-violet-950/30">
            <p className="mr-auto hidden text-[11px] text-muted-foreground sm:block">
              Takes effect from the next snapshot run.
            </p>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              onClick={submit}
              disabled={isLoading || !confirmed}
              className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 text-white shadow-lg shadow-indigo-500/30 hover:from-indigo-500 hover:via-violet-500 hover:to-fuchsia-500"
            >
              {isLoading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
              Publish &amp; activate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
