// components/vendor-performance/Scoreboard.tsx
//
// Scoreboard tab: latest snapshot day, grade distribution (clickable filter),
// coverage histogram, group averages and the server-paginated vendor table.

"use client";

import * as React from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Minus,
  Search,
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
  TONE_CLASS,
} from "./format";
import {
  Chip,
  EmptyState,
  ErrorState,
  GradeBadge,
  Kpi,
  Meter,
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
            <div key={index} className="h-[86px] animate-pulse rounded-xl border bg-muted" />
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
            />
            <Kpi
              label="Needs attention"
              value={formatNumber(distribution.data?.needsAttention ?? 0, 0)}
              hint="At risk or still collecting data"
              tone={distribution.data?.needsAttention ? "amber" : "slate"}
            />
            <Kpi
              label="Snapshot day"
              value={<span className="text-lg">{formatDay(distribution.data?.day)}</span>}
              hint="Nightly job output — never a live aggregate"
            />
            <Kpi
              label="No coverage value"
              value={formatNumber(distribution.data?.coverage.unknown ?? 0, 0)}
              hint="Rows written before coverage was tracked"
            />
          </>
        )}
      </div>

      {/* Distribution */}
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <div className="rounded-xl border bg-card p-3">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Grade distribution
            </h3>
            {grade ? (
              <button
                type="button"
                className="text-[11px] font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                onClick={() => {
                  setGrade(null);
                  setPage(1);
                }}
              >
                Clear filter
              </button>
            ) : (
              <span className="text-[11px] text-muted-foreground">Click a grade to filter</span>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {distribution.isLoading
              ? Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="h-16 animate-pulse rounded-lg bg-muted" />
                ))
              : GRADE_ORDER.map((value) => {
                  const meta = gradeMeta(value);
                  const count = gradeCount(value);
                  const active = grade === value;
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
                        "rounded-lg border p-2 text-left transition-colors",
                        active ? TONE_CLASS[meta.tone] : "bg-background hover:bg-muted/60",
                        count === 0 && !active ? "opacity-60" : "",
                      )}
                    >
                      <div className="text-base font-semibold leading-none tabular-nums">{count}</div>
                      <div className="mt-1 text-[11px] font-medium leading-tight">{meta.label}</div>
                    </button>
                  );
                })}
          </div>
          {unknownGrades > 0 ? (
            <p className="mt-2 text-[11px] text-muted-foreground">
              {unknownGrades} snapshot row(s) have no grade value.
            </p>
          ) : null}
        </div>

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
      <div className="rounded-xl border bg-card">
        <div className="flex flex-col gap-2 border-b p-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="vendor-performance-search"
              aria-label="Search vendors by store name"
              type="search"
              placeholder="Search store name…"
              className="pl-8"
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
                <tr className="border-b text-left text-[11px] uppercase tracking-wide text-muted-foreground">
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

        <div className="flex flex-wrap items-center justify-between gap-2 border-t p-3">
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
      </div>
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
      className="cursor-pointer border-b last:border-0 hover:bg-muted/50"
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
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground">
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
    <div className="rounded-xl border bg-card p-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Coverage spread
      </h3>
      <p className="mt-0.5 text-[11px] text-muted-foreground">
        Share of score weight backed by real data.
      </p>
      {loading ? (
        <div className="mt-3 h-20 animate-pulse rounded bg-muted" />
      ) : buckets.length === 0 ? (
        <p className="mt-4 text-xs text-muted-foreground">No snapshots in the latest day.</p>
      ) : (
        <div className="mt-3 flex h-24 items-end gap-1.5">
          {buckets.map((bucket) => (
            <div key={`${bucket.min}-${bucket.max}`} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-[11px] tabular-nums text-muted-foreground">{bucket.count}</span>
              <div
                className="w-full rounded-t bg-indigo-500/80 dark:bg-indigo-400/70"
                style={{ height: `${Math.max(4, (bucket.count / max) * 64)}px` }}
                title={`${bucket.min}–${bucket.max}% coverage: ${bucket.count} vendor(s)`}
              />
              <span className="text-[10px] text-muted-foreground">
                {bucket.min}–{bucket.max}
              </span>
            </div>
          ))}
        </div>
      )}
      {unknown > 0 ? (
        <p className="mt-2 text-[11px] text-muted-foreground">{unknown} row(s) without a coverage value.</p>
      ) : null}
    </div>
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
    <div className="rounded-xl border bg-card p-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Group averages
      </h3>
      <p className="mt-0.5 text-[11px] text-muted-foreground">Mean 0–100 group score, latest day.</p>
      {loading ? (
        <div className="mt-3 space-y-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-6 animate-pulse rounded bg-muted" />
          ))}
        </div>
      ) : (
        <ul className="mt-3 space-y-2">
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
    </div>
  );
}
