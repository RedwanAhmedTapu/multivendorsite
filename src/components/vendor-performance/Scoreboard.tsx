// components/vendor-performance/Scoreboard.tsx
//
// Scoreboard tab: latest snapshot day, grade distribution (clickable filter),
// coverage histogram, group averages and the server-paginated vendor table.

"use client";

import * as React from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  BarChart3,
  CalendarDays,
  CircleHelp,
  Gauge,
  Layers,
  Minus,
  Search,
  Table2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  useGetVendorPerformanceDistributionQuery,
  useGetVendorPerformanceListQuery,
} from "@/features/vendorPerformanceApi";
import type {
  CoverageBucket,
  GradeCount,
  PerformanceListItem,
  ScoreConfig,
} from "./types";
import {
  apiErrorText,
  coverageTone,
  formatDay,
  formatNumber,
  GRADE_ORDER,
  gradeMeta,
  GROUP_LABELS,
  kycMeta,
  percentText,
  scoreText,
  scoreTrend,
  type Tone,
} from "./format";
import {
  Chip,
  EmptyState,
  ErrorState,
  GradeBadge,
  Kpi,
  Meter,
  Panel,
} from "./shared";

const SORT_OPTIONS = [
  { value: "score_desc", label: "Score: high → low" },
  { value: "score_asc", label: "Score: low → high" },
  { value: "coverage_desc", label: "Coverage: high → low" },
  { value: "coverage_asc", label: "Coverage: low → high" },
  { value: "vendor", label: "Store name" },
];

const KYC_OPTIONS = [
  { value: "VALID", label: "Valid" },
  { value: "EXPIRING_SOON", label: "Expiring soon" },
  { value: "EXPIRY_UNKNOWN", label: "Expiry not recorded" },
  { value: "MISSING", label: "Missing" },
  { value: "EXPIRED", label: "Expired" },
];

const GRADE_CARD: Record<Tone, { idle: string; active: string }> = {
  emerald: {
    idle: "border-emerald-200/80 bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:border-emerald-900/60 dark:from-emerald-950/40 dark:via-slate-900 dark:to-teal-950/30",
    active: "border-emerald-300 ring-2 ring-emerald-500/60 shadow-md shadow-emerald-500/20 dark:border-emerald-700",
  },
  indigo: {
    idle: "border-indigo-200/80 bg-gradient-to-br from-indigo-50 via-white to-violet-50 dark:border-indigo-900/60 dark:from-indigo-950/40 dark:via-slate-900 dark:to-violet-950/30",
    active: "border-indigo-300 ring-2 ring-indigo-500/60 shadow-md shadow-indigo-500/20 dark:border-indigo-700",
  },
  sky: {
    idle: "border-sky-200/80 bg-gradient-to-br from-sky-50 via-white to-cyan-50 dark:border-sky-900/60 dark:from-sky-950/40 dark:via-slate-900 dark:to-cyan-950/30",
    active: "border-sky-300 ring-2 ring-sky-500/60 shadow-md shadow-sky-500/20 dark:border-sky-700",
  },
  amber: {
    idle: "border-amber-200/80 bg-gradient-to-br from-amber-50 via-white to-orange-50 dark:border-amber-900/60 dark:from-amber-950/40 dark:via-slate-900 dark:to-orange-950/30",
    active: "border-amber-300 ring-2 ring-amber-500/60 shadow-md shadow-amber-500/20 dark:border-amber-700",
  },
  rose: {
    idle: "border-rose-200/80 bg-gradient-to-br from-rose-50 via-white to-pink-50 dark:border-rose-900/60 dark:from-rose-950/40 dark:via-slate-900 dark:to-pink-950/30",
    active: "border-rose-300 ring-2 ring-rose-500/60 shadow-md shadow-rose-500/20 dark:border-rose-700",
  },
  slate: {
    idle: "border-slate-200/80 bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:border-slate-700/60 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800",
    active: "border-slate-400 ring-2 ring-slate-400/60 shadow-md shadow-slate-500/20 dark:border-slate-500",
  },
};

const BUCKET_BARS = [
  "from-rose-400 to-rose-500",
  "from-amber-400 to-orange-500",
  "from-sky-400 to-cyan-500",
  "from-indigo-400 to-violet-500",
  "from-emerald-400 to-teal-500",
];

export function Scoreboard({
  config,
  onOpenVendor,
}: {
  config: ScoreConfig | null;
  onOpenVendor: (item: PerformanceListItem) => void;
}) {
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(20);
  const [searchInput, setSearchInput] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [grade, setGrade] = React.useState<string | null>(null);
  const [kycStatus, setKycStatus] = React.useState<string | null>(null);
  const [sort, setSort] = React.useState("score_desc");

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const list = useGetVendorPerformanceListQuery({
    page,
    limit,
    search: search || undefined,
    grade: grade ?? undefined,
    kycStatus: kycStatus ?? undefined,
    sort,
  });
  const distribution = useGetVendorPerformanceDistributionQuery();

  const gradeCount = (value: string): number =>
    distribution.data?.grades.find((row: GradeCount) => row.grade === value)?.count ?? 0;
  const unknownGrades = distribution.data?.grades
    .filter((row) => !row.grade || !(GRADE_ORDER as readonly string[]).includes(row.grade))
    .reduce((sum, row) => sum + row.count, 0) ?? 0;

  if (distribution.isError || list.isError) {
    const error = distribution.error ?? list.error;
    return (
      <ErrorState
        title="Could not load the performance scoreboard"
        message={apiErrorText(error, "Check the connection and your analytics permission.").message}
        onRetry={() => {
          distribution.refetch();
          list.refetch();
        }}
      />
    );
  }

  const hasSnapshotDay = Boolean(list.data?.day);

  return (
    <div className="space-y-4">
      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {distribution.isLoading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-[104px] animate-pulse rounded-2xl border bg-muted" />
          ))
        ) : (
          <>
            <Kpi
              label="Average score"
              value={scoreText(distribution.data?.averageScore)}
              hint={`${formatNumber(distribution.data?.scoredVendors ?? 0, 0)} of ${formatNumber(
                distribution.data?.total ?? 0,
                0,
              )} vendors scored`}
              tone="indigo"
              icon={<Gauge />}
            />
            <Kpi
              label="Needs attention"
              value={formatNumber(distribution.data?.needsAttention ?? 0, 0)}
              hint="At risk or still collecting data"
              tone={distribution.data?.needsAttention ? "amber" : "emerald"}
              icon={<AlertTriangle />}
            />
            <Kpi
              label="Snapshot day"
              value={<span className="text-lg font-extrabold">{formatDay(distribution.data?.day)}</span>}
              hint="Nightly job output — never a live aggregate"
              tone="sky"
              icon={<CalendarDays />}
            />
            <Kpi
              label="No coverage value"
              value={formatNumber(distribution.data?.coverage.unknown ?? 0, 0)}
              hint="Rows written before coverage was tracked"
              tone="slate"
              icon={<CircleHelp />}
            />
          </>
        )}
      </div>

      {/* Distribution */}
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <Panel
          tone="indigo"
          icon={<BarChart3 />}
          title="Grade distribution"
          subtitle="Click a grade to filter the vendor table"
          action={
            grade ? (
              <button
                type="button"
                className="rounded-md bg-white/70 px-2 py-1 text-[11px] font-semibold text-indigo-700 shadow-sm hover:bg-white dark:bg-indigo-500/20 dark:text-indigo-200"
                onClick={() => {
                  setGrade(null);
                  setPage(1);
                }}
              >
                Clear filter
              </button>
            ) : null
          }
        >
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {distribution.isLoading
              ? Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="h-16 animate-pulse rounded-xl bg-muted" />
                ))
              : GRADE_ORDER.map((value) => {
                  const meta = gradeMeta(value);
                  const count = gradeCount(value);
                  const active = grade === value;
                  const skin = GRADE_CARD[meta.tone];
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        setGrade(active ? null : value);
                        setPage(1);
                      }}
                      aria-pressed={active}
                      aria-label={`Filter by grade ${meta.label} (${count})`}
                      className={cn(
                        "rounded-xl border p-2 text-left transition-all",
                        active ? skin.active : `${skin.idle} hover:-translate-y-0.5 hover:shadow-sm`,
                        count === 0 && !active ? "opacity-60" : "",
                      )}
                    >
                      <div className="text-lg font-extrabold leading-none tabular-nums">{count}</div>
                      <div className="mt-1 text-[11px] font-semibold leading-tight">{meta.label}</div>
                    </button>
                  );
                })}
          </div>
          {unknownGrades > 0 ? (
            <p className="mt-2 text-[11px] text-muted-foreground">
              {unknownGrades} snapshot row(s) have no grade value.
            </p>
          ) : null}
        </Panel>

        <CoverageHistogram
          loading={distribution.isLoading}
          buckets={distribution.data?.coverage.buckets ?? []}
          unknown={distribution.data?.coverage.unknown ?? 0}
        />

        <GroupAverages
          loading={distribution.isLoading}
          averages={distribution.data?.groupAverages ?? {}}
          config={config}
        />
      </div>

      {/* Table */}
      <Panel
        tone="indigo"
        icon={<Table2 />}
        title="Vendor scoreboard"
        subtitle="One row per vendor on the latest snapshot day"
        bodyClassName="p-0"
      >
        <div className="flex flex-col gap-2 border-b bg-muted/30 p-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="vendor-performance-search"
              aria-label="Search vendors by store name"
              type="search"
              placeholder="Search store name…"
              className="bg-background pl-8"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Select
              value={grade ?? "all"}
              onValueChange={(value) => {
                setGrade(value === "all" ? null : value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[150px]" aria-label="Filter by grade">
                <SelectValue placeholder="All grades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All grades</SelectItem>
                {GRADE_ORDER.map((value) => (
                  <SelectItem key={value} value={value}>
                    {gradeMeta(value).label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={kycStatus ?? "all"}
              onValueChange={(value) => {
                setKycStatus(value === "all" ? null : value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[170px]" aria-label="Filter by KYC status">
                <SelectValue placeholder="Any KYC status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any KYC status</SelectItem>
                {KYC_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={sort}
              onValueChange={(value) => {
                setSort(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[180px]" aria-label="Sort vendors">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {!hasSnapshotDay && !list.isLoading ? (
          <div className="p-3">
            <EmptyState
              title="No performance snapshot yet"
              description="The nightly job has not written a snapshot. Run it from the server or use a manual dry run from a vendor's detail view."
              action={
                <Button size="sm" variant="outline" onClick={() => list.refetch()}>
                  Check again
                </Button>
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b bg-gradient-to-r from-indigo-50/80 via-white to-violet-50/60 text-left text-[11px] uppercase tracking-wide text-slate-600 dark:from-indigo-950/40 dark:via-slate-900 dark:to-violet-950/30 dark:text-slate-300">
                  <th className="px-3 py-2 font-medium">Store</th>
                  <th className="px-3 py-2 font-medium">Score</th>
                  <th className="px-3 py-2 font-medium">Coverage</th>
                  <th className="px-3 py-2 font-medium">Orders</th>
                  <th className="px-3 py-2 font-medium">Products</th>
                  <th className="px-3 py-2 font-medium">Flags</th>
                  <th className="px-3 py-2 font-medium">KYC</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {list.isLoading
                  ? Array.from({ length: 6 }).map((_, index) => (
                      <tr key={index} className="border-b last:border-0">
                        <td colSpan={8} className="px-3 py-2">
                          <div className="h-9 animate-pulse rounded bg-muted" />
                        </td>
                      </tr>
                    ))
                  : list.data?.items.map((item) => (
                      <ScoreRow
                        key={item.vendorId}
                        item={item}
                        catalogTarget={config?.catalogFlagMinProducts ?? null}
                        onOpen={() => onOpenVendor(item)}
                      />
                    ))}
                {!list.isLoading && list.data && list.data.items.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-3 py-10 text-center text-sm text-muted-foreground">
                      No vendors match these filters.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t bg-muted/20 p-3">
          <p className="text-xs text-muted-foreground">
            {list.data
              ? `${formatNumber(list.data.total, 0)} vendor(s) on ${formatDay(list.data.day)}`
              : "—"}
            {list.isFetching ? " · refreshing…" : ""}
          </p>
          <div className="flex items-center gap-2">
            <Select
              value={String(limit)}
              onValueChange={(value) => {
                setLimit(Number(value));
                setPage(1);
              }}
            >
              <SelectTrigger className="h-8 w-[110px]" aria-label="Rows per page">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 50, 100].map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size} / page
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {list.data && list.data.totalPages > 1 ? (
              <Pagination className="mx-0 w-auto">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setPage(Math.max(1, page - 1))}
                      className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  <PaginationItem>
                    <span className="px-2 text-xs text-muted-foreground">
                      {page} / {list.data.totalPages}
                    </span>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setPage(Math.min(list.data!.totalPages, page + 1))}
                      className={
                        page === list.data.totalPages
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            ) : null}
          </div>
        </div>
      </Panel>
    </div>
  );
}

function ScoreRow({
  item,
  catalogTarget,
  onOpen,
}: {
  item: PerformanceListItem;
  catalogTarget: number | null;
  onOpen: () => void;
}) {
  const trend = scoreTrend(item.score.overallScore, item.previous?.overallScore);
  const TrendIcon = trend.direction === "up" ? ArrowUp : trend.direction === "down" ? ArrowDown : Minus;
  const trendTone =
    trend.direction === "up" ? "text-emerald-600 dark:text-emerald-400" : trend.direction === "down" ? "text-rose-600 dark:text-rose-400" : "text-muted-foreground";
  const kyc = kycMeta(item.metrics.kycStatus);
  const initials = item.vendor.storeName?.slice(0, 2).toUpperCase() ?? "??";

  return (
    <tr
      className="cursor-pointer border-b transition-colors last:border-0 hover:bg-indigo-50/60 dark:hover:bg-indigo-500/10"
      onClick={onOpen}
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen();
        }
      }}
      aria-label={`Open performance detail for ${item.vendor.storeName}`}
    >
      <td className="px-3 py-2">
        <div className="flex items-center gap-2">
          {item.vendor.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.vendor.avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
          ) : (
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-[11px] font-bold text-white shadow-sm">
              {initials}
            </span>
          )}
          <div className="min-w-0">
            <button
              type="button"
              className="truncate text-left text-sm font-medium hover:underline"
              onClick={(event) => {
                event.stopPropagation();
                onOpen();
              }}
            >
              {item.vendor.storeName}
            </button>
            <div className="mt-0.5 flex flex-wrap items-center gap-1">
              <Chip tone={item.vendor.status === "ACTIVE" ? "emerald" : "slate"}>
                {item.vendor.status}
              </Chip>
              {item.vendor.vatRegistered ? <Chip tone="sky">VAT</Chip> : null}
            </div>
          </div>
        </div>
      </td>
      <td className="px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="text-base font-semibold tabular-nums">{scoreText(item.score.overallScore)}</span>
          <GradeBadge grade={item.score.grade} compact />
        </div>
        <div className="mt-0.5 flex items-center gap-1 text-[11px]">
          {trend.direction === "none" ? (
            <span className="text-muted-foreground">No previous snapshot</span>
          ) : (
            <span className={cn("inline-flex items-center gap-0.5", trendTone)} title={trend.label}>
              <TrendIcon className="h-3 w-3" />
              {trend.direction === "flat" ? "No change" : Math.abs(trend.delta ?? 0).toFixed(1)}
            </span>
          )}
        </div>
      </td>
      <td className="px-3 py-2">
        <div className="flex w-28 items-center gap-2">
          <Meter value={item.score.coveragePct} tone={coverageTone(item.score.coveragePct)} />
          <span className="text-[11px] tabular-nums text-muted-foreground">
            {percentText(item.score.coveragePct, 0)}
          </span>
        </div>
      </td>
      <td className="px-3 py-2 tabular-nums">{formatNumber(item.metrics.orderCount, 0)}</td>
      <td className="px-3 py-2 tabular-nums">
        {item.metrics.qualifiedProductCount === null ? (
          <span className="text-xs text-muted-foreground">—</span>
        ) : (
          <span>
            {formatNumber(item.metrics.qualifiedProductCount, 0)}
            {catalogTarget !== null ? (
              <span className="text-xs text-muted-foreground"> / {catalogTarget}</span>
            ) : null}
          </span>
        )}
      </td>
      <td className="px-3 py-2">
        <div className="flex flex-wrap gap-1">
          {(item.score.flags ?? []).length === 0 ? (
            <span className="text-xs text-muted-foreground">None</span>
          ) : (
            (item.score.flags ?? []).map((flag) => (
              <Chip key={flag.code} tone={flag.severity === "critical" ? "rose" : "amber"} title={flag.message}>
                {flag.code === "CATALOG_INCOMPLETE" ? "Catalog" : flag.code === "KYC_EXPIRED_PAST_GRACE" ? "KYC" : flag.code}
              </Chip>
            ))
          )}
        </div>
      </td>
      <td className="px-3 py-2">
        <Chip tone={kyc.tone}>{kyc.label}</Chip>
      </td>
      <td className="px-3 py-2 text-right">
        <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
      </td>
    </tr>
  );
}

function CoverageHistogram({
  loading,
  buckets,
  unknown,
}: {
  loading: boolean;
  buckets: CoverageBucket[];
  unknown: number;
}) {
  const max = Math.max(1, ...buckets.map((bucket) => bucket.count));
  return (
    <Panel
      tone="sky"
      icon={<Activity />}
      title="Coverage spread"
      subtitle="Share of score weight backed by real data"
    >
      {loading ? (
        <div className="h-20 animate-pulse rounded-xl bg-muted" />
      ) : buckets.length === 0 ? (
        <p className="py-6 text-center text-xs text-muted-foreground">
          No snapshots in the latest day.
        </p>
      ) : (
        <div className="flex h-24 items-end gap-1.5">
          {buckets.map((bucket, index) => (
            <div key={`${bucket.min}-${bucket.max}`} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-[11px] font-semibold tabular-nums text-muted-foreground">
                {bucket.count}
              </span>
              <div
                className={cn(
                  "w-full rounded-t-md bg-gradient-to-t shadow-sm",
                  BUCKET_BARS[index % BUCKET_BARS.length],
                )}
                style={{ height: `${Math.max(4, (bucket.count / max) * 64)}px` }}
                title={`${bucket.min}–${bucket.max}% coverage: ${bucket.count} vendor(s)`}
              />
              <span className="text-[10px] text-foreground/70">
                {bucket.min}–{bucket.max}
              </span>
            </div>
          ))}
        </div>
      )}
      {unknown > 0 ? (
        <p className="mt-2 text-[11px] text-muted-foreground">{unknown} row(s) without a coverage value.</p>
      ) : null}
    </Panel>
  );
}

function GroupAverages({
  loading,
  averages,
  config,
}: {
  loading: boolean;
  averages: Record<string, { average: number; sampleSize: number }>;
  config: ScoreConfig | null;
}) {
  const keys = config?.groups.length
    ? config.groups.map((group) => ({ key: group.key, label: group.label, weight: group.weight }))
    : Object.keys(GROUP_LABELS).map((key) => ({ key, label: GROUP_LABELS[key], weight: null }));

  return (
    <Panel
      tone="emerald"
      icon={<Layers />}
      title="Group averages"
      subtitle="Mean 0–100 group score, latest day"
    >
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-6 animate-pulse rounded bg-muted" />
          ))}
        </div>
      ) : (
        <ul className="space-y-2">
          {keys.map(({ key, label, weight }) => {
            const entry = averages[key];
            return (
              <li key={key}>
                <div className="flex items-baseline justify-between gap-2 text-[11px]">
                  <span className="font-medium">
                    {label}
                    {weight !== null ? (
                      <span className="ml-1 text-muted-foreground">({formatNumber(weight, 0)}%)</span>
                    ) : null}
                  </span>
                  <span className="tabular-nums text-muted-foreground">
                    {entry ? `${formatNumber(entry.average, 1)} · n=${entry.sampleSize}` : "No data"}
                  </span>
                </div>
                <Meter
                  className="mt-1"
                  value={entry?.average ?? null}
                  tone={coverageTone(entry?.average ?? null)}
                  label={`${label} average`}
                />
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
