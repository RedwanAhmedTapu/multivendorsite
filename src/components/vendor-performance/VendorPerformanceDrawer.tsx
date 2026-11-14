// components/vendor-performance/VendorPerformanceDrawer.tsx
//
// Vendor detail sheet: Overview, Metrics, Catalog, KYC & compliance, History.
// The Overview reads the stored snapshot row (no live aggregate); the other
// tabs load the Phase 4 detail endpoints. Every null metric renders as
// "Collecting data" — never 0.

"use client";

import * as React from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle, History as HistoryIcon, Loader2, Play, Save } from "lucide-react";
import { toast } from "sonner";
import { taka } from "@/lib/billing/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useGetVendorPerformanceHistoryQuery,
  useRunVendorPerformanceSnapshotMutation,
} from "@/features/vendorPerformanceApi";
import { useAppLocale } from "@/i18n/MarketingIntlProvider";
import type {
  HistoryDay,
  PerformanceListItem,
  RunResponse,
  ScoreConfig,
} from "./types";
import {
  apiErrorText,
  checklistText,
  coverageTone,
  explainGrade,
  flagMeta,
  formatDay,
  formatNumber,
  gradeMeta,
  groupKeys,
  percentText,
  runResultLines,
  scoreText,
  scoreTrend,
} from "./format";
import { Chip, EmptyState, ErrorState, GradeBadge, LoadingBlock, Meter } from "./shared";
import { DrawerMetrics } from "./DrawerMetrics";
import { CatalogSection, KycSection } from "./DrawerCatalogKyc";

type DrawerTab = "overview" | "metrics" | "catalog" | "kyc" | "history";

export function VendorPerformanceDrawer({
  item,
  config,
  onClose,
}: {
  item: PerformanceListItem;
  config: ScoreConfig | null;
  onClose: () => void;
}) {
  const [tab, setTab] = React.useState<DrawerTab>("overview");
  const { locale } = useAppLocale();
  const snapshot = item;
  const grade = gradeMeta(snapshot.score.grade);
  const trend = scoreTrend(snapshot.score.overallScore, item.previous?.overallScore);
  const groupScoreKeys = groupKeys(config);

  return (
    <Sheet open onOpenChange={(open) => (open ? undefined : onClose())}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl"
      >
        <SheetHeader className="space-y-1 border-b px-5 py-4 pr-12">
          <div className="flex flex-wrap items-center gap-2">
            <SheetTitle className="text-lg leading-tight">{item.vendor.storeName}</SheetTitle>
            <Chip tone={item.vendor.status === "ACTIVE" ? "emerald" : "slate"}>
              {item.vendor.status}
            </Chip>
            {item.vendor.vatRegistered ? <Chip tone="sky">VAT registered</Chip> : null}
            <GradeBadge grade={snapshot.score.grade} />
          </div>
          <p className="text-xs text-muted-foreground">
            Snapshot {formatDay(snapshot.day)} · {snapshot.periodDays}-day window · config{" "}
            {snapshot.configVersion ?? "—"} · Previous{" "}
            {item.previous?.day ? formatDay(item.previous.day) : "snapshot not available"}
          </p>
        </SheetHeader>

        <Tabs
          value={tab}
          onValueChange={(value) => setTab(value as DrawerTab)}
          className="flex min-h-0 flex-1 flex-col gap-0"
        >
          <div className="border-b px-3 py-2">
            <TabsList className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="metrics">Metrics</TabsTrigger>
              <TabsTrigger value="catalog">Catalog</TabsTrigger>
              <TabsTrigger value="kyc">KYC &amp; compliance</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            <TabsContent value="overview" className="mt-0 space-y-4">
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
                <div className="rounded-xl border p-4">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Overall score
                  </p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-4xl font-semibold tabular-nums">
                      {scoreText(snapshot.score.overallScore)}
                    </span>
                    <span className="text-sm text-muted-foreground">/ 100</span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <GradeBadge grade={snapshot.score.grade} />
                    {trend.direction === "none" ? (
                      <span className="text-[11px] text-muted-foreground">No previous snapshot</span>
                    ) : (
                      <span
                        className={cn(
                          "text-[11px] font-medium",
                          trend.direction === "up"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : trend.direction === "down"
                              ? "text-rose-600 dark:text-rose-400"
                              : "text-muted-foreground",
                        )}
                      >
                        {trend.label}
                      </span>
                    )}
                  </div>
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>Metric coverage</span>
                      <span className="tabular-nums">{percentText(snapshot.score.coveragePct)}</span>
                    </div>
                    <Meter
                      className="mt-1"
                      value={snapshot.score.coveragePct}
                      tone={coverageTone(snapshot.score.coveragePct)}
                      label="Coverage"
                    />
                  </div>
                </div>
                <div className="rounded-xl border p-4">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Why this grade
                  </p>
                  <p className="mt-1 text-sm leading-relaxed">{explainGrade(snapshot, config)}</p>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {(snapshot.score.flags ?? []).length === 0 ? (
                      <Chip tone="emerald">No flags</Chip>
                    ) : (
                      (snapshot.score.flags ?? []).map((flag) => {
                        const meta = flagMeta(flag);
                        return (
                          <Chip
                            key={flag.code}
                            tone={meta.tone}
                            title={flag.message}
                          >
                            {meta.label}
                          </Chip>
                        );
                      })
                    )}
                  </div>
                  {snapshot.score.grade === "AT_RISK" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-3"
                      onClick={() => setTab("kyc")}
                    >
                      <AlertTriangle className="mr-1.5 h-3.5 w-3.5" /> Review KYC documents
                    </Button>
                  ) : null}
                </div>
              </div>

              <section className="rounded-xl border">
                <header className="flex items-center justify-between border-b px-3 py-2">
                  <h4 className="text-sm font-semibold">Group scores</h4>
                  <span className="text-[11px] text-muted-foreground">0–100, latest snapshot</span>
                </header>
                <div className="grid gap-x-4 gap-y-2 px-3 py-3 sm:grid-cols-2">
                  {groupScoreKeys.map((group) => {
                    const value = snapshot.score.groupScores?.[group.key];
                    return (
                      <div key={group.key}>
                        <div className="flex items-baseline justify-between text-[11px]">
                          <span className="font-medium">
                            {group.label}
                            {group.weight !== null ? (
                              <span className="ml-1 text-muted-foreground">
                                ({formatNumber(group.weight, 0)}%)
                              </span>
                            ) : null}
                          </span>
                          <span className="tabular-nums text-muted-foreground">
                            {typeof value === "number" ? formatNumber(value, 1) : "Collecting data"}
                          </span>
                        </div>
                        <Meter
                          className="mt-1"
                          value={value ?? null}
                          tone={coverageTone(value ?? null)}
                          label={`${group.label} score`}
                        />
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-xl border">
                <header className="flex items-center justify-between border-b px-3 py-2">
                  <h4 className="text-sm font-semibold">What to improve</h4>
                  <span className="text-[11px] text-muted-foreground">
                    Ranked by score at stake · {locale === "bn" ? "বাংলা" : "English"}
                  </span>
                </header>
                {snapshot.checklist && snapshot.checklist.length > 0 ? (
                  <ol className="divide-y">
                    {snapshot.checklist.map((action, index) => (
                      <li key={action.code} className="flex items-start gap-3 px-3 py-2">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold">
                          {index + 1}
                        </span>
                        <p className="flex-1 text-sm leading-snug">{checklistText(action, locale)}</p>
                        <Chip tone="amber" title="Weighted score at stake">
                          {formatNumber(action.impact, 1)} pts
                        </Chip>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="px-3 py-3 text-xs text-muted-foreground">
                    No improvement actions — every scored metric with data is at its target.
                  </p>
                )}
              </section>

              <ManualRunCard vendorId={item.vendorId} />

              <p className="text-[11px] text-muted-foreground">
                Last updated {formatDay(snapshot.day)} by the nightly snapshot job. The score is
                informational only — it is not wired into commission, payouts or badges.
              </p>
            </TabsContent>

            <TabsContent value="metrics" className="mt-0">
              <DrawerMetrics snapshot={snapshot} config={config} />
            </TabsContent>

            <TabsContent value="catalog" className="mt-0">
              <CatalogSection vendorId={item.vendorId} config={config} />
            </TabsContent>

            <TabsContent value="kyc" className="mt-0">
              <KycSection vendorId={item.vendorId} storeName={item.vendor.storeName} />
            </TabsContent>

            <TabsContent value="history" className="mt-0 space-y-4">
              <HistorySection vendorId={item.vendorId} config={config} />
            </TabsContent>
          </div>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

/* ─── manual run ────────────────────────────────────────────────────────── */

function ManualRunCard({ vendorId }: { vendorId: string }) {
  const [runSnapshot, { isLoading }] = useRunVendorPerformanceSnapshotMutation();
  const [result, setResult] = React.useState<RunResponse | null>(null);
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  async function run(dryRun: boolean) {
    try {
      const response = await runSnapshot({ vendorId, dryRun }).unwrap();
      setResult(response);
      toast.success(dryRun ? "Dry run complete — nothing written." : "Snapshot saved.");
      setConfirmOpen(false);
    } catch (error) {
      const text = apiErrorText(error, "The snapshot run failed.");
      toast.error(text.message, {
        description: text.details.length ? text.details.join("; ") : undefined,
      });
    }
  }

  return (
    <section className="rounded-xl border">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2">
        <div>
          <h4 className="text-sm font-semibold">Manual snapshot run</h4>
          <p className="text-[11px] text-muted-foreground">
            Uses the nightly job lock. Dry run previews; saving overwrites today&apos;s row.
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" disabled={isLoading} onClick={() => run(true)}>
            {isLoading ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Play className="mr-1.5 h-3.5 w-3.5" />
            )}
            Dry run
          </Button>
          <Button size="sm" disabled={isLoading} onClick={() => setConfirmOpen(true)}>
            <Save className="mr-1.5 h-3.5 w-3.5" /> Run &amp; save
          </Button>
        </div>
      </header>
      {result ? (
        <div className="space-y-1 px-3 py-2">
          {runResultLines(result).map((line) => (
            <p key={line} className="text-xs">
              {line}
            </p>
          ))}
          <div className="mt-1 flex flex-wrap gap-1">
            {result.productCompleteness
              .filter((product) =>
                result.dryRun ? product.current !== product.completenessScore : product.written,
              )
              .slice(0, 6)
              .map((product) => (
                <Chip key={product.productId} tone="sky">
                  {product.productId.slice(-6)}: {product.current ?? "—"} → {product.completenessScore}
                </Chip>
              ))}
          </div>
        </div>
      ) : (
        <p className="px-3 py-2 text-xs text-muted-foreground">
          No run yet in this session.
        </p>
      )}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save a fresh snapshot?</DialogTitle>
            <DialogDescription>
              This recomputes today&apos;s vendor snapshot and overwrites the stored row for the
              day. It also refreshes each product&apos;s completeness score. Use Dry run first if
              you only want to preview the result.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={() => run(false)} disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
              Save snapshot
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

/* ─── history ───────────────────────────────────────────────────────────── */

function HistorySection({ vendorId, config }: { vendorId: string; config: ScoreConfig | null }) {
  const { data, isLoading, isError, error, refetch } = useGetVendorPerformanceHistoryQuery({
    vendorId,
    days: 30,
  });

  if (isLoading) return <LoadingBlock label="Loading score history" rows={4} />;
  if (isError || !data) {
    return (
      <ErrorState
        title="Could not load score history"
        message={apiErrorText(error, "The history read failed.").message}
        onRetry={() => refetch()}
      />
    );
  }

  const chartData = data.days.map((day) => ({
    label: new Date(day.day).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      timeZone: "Asia/Dhaka",
    }),
    score: day.overallScore,
    coverage: day.coveragePct,
  }));
  const hasScore = data.days.some((day) => typeof day.overallScore === "number");

  if (!data.days.length) {
    return (
      <EmptyState
        title="No snapshot history yet"
        description="History fills up as the nightly job writes one snapshot per day."
      />
    );
  }

  const bands = config?.gradeBands ?? [];
  const recent = [...data.days].reverse().slice(0, 8);

  return (
    <div className="space-y-3">
      <div className="rounded-xl border p-3">
        <div className="flex items-center justify-between">
          <h4 className="flex items-center gap-1.5 text-sm font-semibold">
            <HistoryIcon className="h-4 w-4" /> Score &amp; coverage trend
          </h4>
          <span className="text-[11px] text-muted-foreground">
            Last {data.days.length} snapshot day(s)
          </span>
        </div>
        {hasScore ? (
          <div className="mt-2 h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
                <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 10, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={false}
                />
                <ChartTooltip
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                    border: "1px solid #e2e8f0",
                  }}
                />
                {bands.map((band) => (
                  <ReferenceLine
                    key={band.grade}
                    y={band.min}
                    stroke="#cbd5e1"
                    strokeDasharray="2 4"
                  />
                ))}
                <Line
                  type="monotone"
                  dataKey="score"
                  name="Score"
                  stroke="#4338CA"
                  strokeWidth={2}
                  dot={false}
                  connectNulls={false}
                />
                <Line
                  type="monotone"
                  dataKey="coverage"
                  name="Coverage %"
                  stroke="#94a3b8"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="mt-2 text-xs text-muted-foreground">
            No scored day yet — every snapshot in this range has too little data.
          </p>
        )}
        {bands.length ? (
          <p className="mt-1 text-[11px] text-muted-foreground">
            Dashed reference lines: grade bands {bands.map((band) => `${band.grade} ≥ ${band.min}`).join(" · ")}
          </p>
        ) : null}
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b text-left text-[11px] uppercase tracking-wide text-muted-foreground">
              <th className="px-3 py-2 font-medium">Day</th>
              <th className="px-3 py-2 font-medium">Score</th>
              <th className="px-3 py-2 font-medium">Grade</th>
              <th className="px-3 py-2 font-medium">Coverage</th>
              <th className="px-3 py-2 font-medium">Orders</th>
              <th className="px-3 py-2 font-medium">Vendor-fault cancels</th>
              <th className="px-3 py-2 font-medium">Gross revenue</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((day: HistoryDay) => (
              <tr key={day.day} className="border-b last:border-0">
                <td className="px-3 py-2 whitespace-nowrap">{formatDay(day.day)}</td>
                <td className="px-3 py-2 tabular-nums">{scoreText(day.overallScore)}</td>
                <td className="px-3 py-2">
                  <GradeBadge grade={day.grade} compact />
                </td>
                <td className="px-3 py-2 tabular-nums">{percentText(day.coveragePct)}</td>
                <td className="px-3 py-2 tabular-nums">
                  {day.orderCount === null ? "—" : formatNumber(day.orderCount, 0)}
                </td>
                <td className="px-3 py-2 tabular-nums">{percentText(day.vendorFaultCancelRate)}</td>
                <td className="px-3 py-2 tabular-nums">
                  {day.grossRevenue === null ? "—" : taka(day.grossRevenue)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
