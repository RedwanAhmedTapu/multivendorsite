// components/vendor-performance/ScoreConfigPanel.tsx
//
// "Score config" tab: the active version, every group/weight/threshold and the
// publish dialog. The backend validates weights (both levels sum to 100),
// distinct linear thresholds, descending grade bands and a required version;
// the dialog only adds a JSON parse check and a typed confirmation.

"use client";

import * as React from "react";
import { EyeOff, FileCog, Loader2, Rocket } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Chip, ErrorState, Kpi, LoadingBlock } from "./shared";

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
        <Kpi label="Active version" value={<span className="text-lg">{data.version}</span>} hint={`Source: ${data.source}`} />
        <Kpi
          label="Published"
          value={<span className="text-lg">{data.createdAt ? formatDay(data.createdAt) : "Built-in default"}</span>}
          hint={data.createdAt ? "Audited config row" : "No row in vendor_performance_config"}
        />
        <Kpi
          label="Minimum coverage"
          value={`${formatNumber(config.notEnoughDataCoveragePct, 0)}%`}
          hint="Below this the grade is “Collecting data”"
        />
        <Kpi
          label="At-risk cap"
          value={`${formatNumber(config.atRiskScoreCap, 0)}/100`}
          hint="Applied when KYC is past grace"
        />
      </div>

      <div className="rounded-xl border bg-card p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="flex items-center gap-1.5 text-sm font-semibold">
            {data.shadowMode.visibleToVendors ? <Rocket className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            Vendor visibility
          </p>
          <Chip tone={data.shadowMode.visibleToVendors ? "emerald" : "slate"}>
            {data.shadowMode.visibleToVendors ? "Visible to vendors" : "Shadow mode"}
          </Chip>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{shadowModeText(data.shadowMode.visibleToVendors)}</p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Controlled by VENDOR_PERFORMANCE_VISIBLE_TO_VENDORS on the server — the UI cannot flip it.
        </p>
        {data.note ? (
          <p className="mt-2 rounded-md bg-muted px-2 py-1 text-xs">Note: {data.note}</p>
        ) : null}
      </div>

      <div className="rounded-xl border bg-card p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold">Grade bands</p>
          <span className="text-[11px] text-muted-foreground">
            Catalog flag below {formatNumber(config.catalogFlagMinProducts, 0)} qualified products
          </span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {config.gradeBands.map((band) => (
            <Chip key={band.grade} tone="indigo">
              {band.grade} ≥ {formatNumber(band.min, 0)}
            </Chip>
          ))}
          <Chip tone="rose">At risk · capped at {formatNumber(config.atRiskScoreCap, 0)}</Chip>
          <Chip tone="slate">Collecting data · coverage &lt; {formatNumber(config.notEnoughDataCoveragePct, 0)}%</Chip>
        </div>
      </div>

      <div className="space-y-3">
        {groups.map((group) => (
          <section key={group.key} className="rounded-xl border bg-card">
            <header className="flex items-center justify-between border-b px-3 py-2">
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

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-card p-3">
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
      <Button size="sm" onClick={openDialog}>
        <FileCog className="mr-1.5 h-4 w-4" /> Publish new version
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Publish a new score config</DialogTitle>
            <DialogDescription>
              The server deactivates the current row and activates this one in a single
              transaction (audited). Every existing snapshot keeps the version that produced it.
              Change the version string, for example to <code>score-v2</code>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label htmlFor="config-json" className="text-xs font-medium text-muted-foreground">
              Config JSON
            </label>
            <Textarea
              id="config-json"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              spellCheck={false}
              className="min-h-[260px] font-mono text-xs"
            />
            <label htmlFor="config-note" className="text-xs font-medium text-muted-foreground">
              Note (optional)
            </label>
            <Input
              id="config-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Why this version exists"
            />
            <label className="flex items-start gap-2 text-xs">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4"
                checked={confirmed}
                onChange={(event) => setConfirmed(event.target.checked)}
              />
              <span>
                I understand this changes the score for every vendor from the next snapshot run
                onward.
              </span>
            </label>
            {localError ? (
              <div className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1.5 text-xs text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
                <p>{localError}</p>
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={isLoading || !confirmed}>
              {isLoading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
              Publish &amp; activate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
