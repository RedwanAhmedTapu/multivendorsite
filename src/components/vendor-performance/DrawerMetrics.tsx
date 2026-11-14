// components/vendor-performance/DrawerMetrics.tsx
//
// "Metrics" tab of the vendor drawer. Every metric shows its value (or
// "Collecting data" for null), the configured scoring threshold and the sample
// size the value is based on, so a number is never shown bare.

"use client";

import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { PerformanceSnapshotView, ScoreConfig } from "./types";
import {
  formatNumber,
  groupKeys,
  metricDisplayValue,
  metricRowsForGroup,
  MISSING_TEXT,
  sampleNote,
  thresholdText,
} from "./format";

export function DrawerMetrics({
  snapshot,
  config,
}: {
  snapshot: PerformanceSnapshotView;
  config: ScoreConfig | null;
}) {
  const groups = groupKeys(config);

  return (
    <TooltipProvider delayDuration={150}>
      <div className="space-y-4">
        {!config ? (
          <p className="rounded-lg border border-dashed px-3 py-2 text-xs text-muted-foreground">
            Score config unavailable — thresholds are hidden, values are still from the stored
            snapshot.
          </p>
        ) : null}
        {groups.map((group) => {
          const score = snapshot.score.groupScores?.[group.key];
          return (
            <section key={group.key} className="rounded-xl border">
              <header className="flex flex-wrap items-baseline justify-between gap-2 border-b px-3 py-2">
                <h4 className="text-sm font-semibold">{group.label}</h4>
                <p className="text-[11px] text-muted-foreground">
                  {group.weight !== null ? `Weight ${formatNumber(group.weight, 0)}% · ` : ""}
                  Group score{" "}
                  <span className="font-medium text-foreground">
                    {typeof score === "number" ? formatNumber(score, 1) : MISSING_TEXT}
                  </span>
                </p>
              </header>
              <div className="divide-y">
                {metricRowsForGroup(group.key, config).map((row) => {
                  const value = metricDisplayValue(row.def, snapshot.metrics, snapshot.day);
                  const sample = sampleNote(row.def, snapshot.sampleSizes);
                  const isNull =
                    row.key === "lastLoginAt"
                      ? snapshot.metrics.lastLoginAt === null
                      : row.key === "kycStatus"
                        ? snapshot.metrics.kycStatus === null
                        : row.key === "lastLoginDays"
                          ? snapshot.metrics.lastLoginAt === null
                          : (snapshot.metrics as unknown as Record<string, unknown>)[row.key] === null;
                  return (
                    <div
                      key={row.key}
                      className="grid grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)_minmax(0,1.4fr)] items-start gap-2 px-3 py-2 text-sm"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="font-medium">{row.def.label}</span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                aria-label={`About ${row.def.label}`}
                                className="text-muted-foreground hover:text-foreground"
                              >
                                <Info className="h-3.5 w-3.5" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-[260px] text-xs">
                              {row.def.definition}
                            </TooltipContent>
                          </Tooltip>
                          {row.informational ? (
                            <span className="rounded bg-muted px-1 text-[10px] text-muted-foreground">
                              info
                            </span>
                          ) : null}
                        </div>
                        {row.def.note ? (
                          <p className="mt-0.5 text-[11px] text-amber-700 dark:text-amber-300">
                            {row.def.note}
                          </p>
                        ) : null}
                        {sample ? (
                          <p className="mt-0.5 text-[11px] text-muted-foreground">{sample}</p>
                        ) : null}
                      </div>
                      <div
                        className={cn(
                          "tabular-nums",
                          isNull ? "text-xs text-muted-foreground" : "font-semibold",
                        )}
                      >
                        {value}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {row.informational ? "Context only" : thresholdText(row.rule, row.def)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
        <p className="text-[11px] text-muted-foreground">
          Metrics whose sample is below the configured minimum are stored as null and shown as
          &ldquo;{MISSING_TEXT}&rdquo;. Gross revenue is before commission and before refunds.
        </p>
      </div>
    </TooltipProvider>
  );
}
