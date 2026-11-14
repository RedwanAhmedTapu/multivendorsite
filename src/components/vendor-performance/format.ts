// components/vendor-performance/format.ts
//
// Pure display helpers for the vendor-performance admin surface. No React and
// no network: every value the UI shows passes through here so a null metric can
// never render as 0% or 100% by accident.

import { dateText, taka } from "@/lib/billing/format";
import type {
  CatalogIssue,
  ChecklistAction,
  KycDocument,
  LocalizedText,
  MetricRule,
  PerformanceMetrics,
  PerformanceSnapshotView,
  RunResponse,
  ScoreConfig,
  ScoreFlag,
} from "./types";

/** The only text a null metric is allowed to produce. */
export const MISSING_TEXT = "Collecting data";
export const NO_SCORE_TEXT = "No score yet";
const DAY_MS = 24 * 60 * 60 * 1000;

export const isNum = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const round1 = (value: number) => Math.round(value * 10) / 10;

export function formatNumber(value: number, digits = 1): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
}

export function percentText(value: number | null | undefined, digits = 1): string {
  return isNum(value) ? `${formatNumber(value, digits)}%` : MISSING_TEXT;
}

export function scoreText(value: number | null | undefined): string {
  return isNum(value) ? formatNumber(round1(value), 1) : NO_SCORE_TEXT;
}

export function signedPercentText(value: number | null | undefined): string {
  if (!isNum(value)) return MISSING_TEXT;
  const rounded = round1(value);
  return `${rounded > 0 ? "+" : ""}${formatNumber(rounded, 1)}%`;
}

export function formatDay(day: string | null | undefined): string {
  return day ? dateText(day) : "—";
}

export function pickLocalized(text: LocalizedText | string | null | undefined, locale: string): string {
  if (!text) return "";
  if (typeof text === "string") return text;
  return locale === "bn" ? text.bn || text.en : text.en || text.bn;
}

/* ─── tones ─────────────────────────────────────────────────────────────── */

export type Tone = "emerald" | "indigo" | "sky" | "amber" | "rose" | "slate";

/** Full class strings so Tailwind keeps them; works in light and dark mode. */
export const TONE_CLASS: Record<Tone, string> = {
  emerald:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300",
  indigo:
    "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-300",
  sky: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-300",
  amber:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300",
  rose: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300",
  slate:
    "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300",
};

/* ─── grades and flags ──────────────────────────────────────────────────── */

export const GRADE_ORDER = ["A", "B", "C", "D", "AT_RISK", "NOT_ENOUGH_DATA"] as const;

export interface GradeMeta {
  label: string;
  tone: Tone;
  description: string;
}

export function gradeMeta(grade: string | null | undefined): GradeMeta {
  switch (grade) {
    case "A":
      return { label: "A · Excellent", tone: "emerald", description: "Top band" };
    case "B":
      return { label: "B · Good", tone: "indigo", description: "Meets most targets" };
    case "C":
      return { label: "C · Needs work", tone: "amber", description: "Below several targets" };
    case "D":
      return { label: "D · Poor", tone: "rose", description: "Well below targets" };
    case "AT_RISK":
      return {
        label: "At risk",
        tone: "rose",
        description: "Required KYC document past expiry + grace; score capped",
      };
    case "NOT_ENOUGH_DATA":
      return {
        label: "Collecting data",
        tone: "slate",
        description: "Not enough orders or metric coverage for a grade",
      };
    default:
      return { label: grade || "Unknown", tone: "slate", description: "No grade recorded" };
  }
}

export function flagMeta(flag: ScoreFlag): { label: string; tone: Tone } {
  switch (flag.code) {
    case "CATALOG_INCOMPLETE":
      return { label: "Catalog incomplete", tone: "amber" };
    case "KYC_EXPIRED_PAST_GRACE":
      return { label: "KYC expired past grace", tone: "rose" };
    default:
      return { label: flag.code.replace(/_/g, " ").toLowerCase(), tone: "amber" };
  }
}

export function kycMeta(status: string | null | undefined): { label: string; tone: Tone } {
  switch (status) {
    case "VALID":
      return { label: "Valid", tone: "emerald" };
    case "EXPIRING_SOON":
      return { label: "Expiring soon", tone: "amber" };
    case "EXPIRY_UNKNOWN":
      return { label: "Expiry not recorded", tone: "sky" };
    case "MISSING":
      return { label: "Missing", tone: "rose" };
    case "EXPIRED":
      return { label: "Expired", tone: "rose" };
    default:
      return { label: "Not evaluated", tone: "slate" };
  }
}

export function docStateMeta(state: string | null | undefined): { label: string; tone: Tone } {
  if (state === "REJECTED") return { label: "Rejected", tone: "rose" };
  return kycMeta(state);
}

export function vendorStatusMeta(status: string | null | undefined): { label: string; tone: Tone } {
  switch (status) {
    case "ACTIVE":
      return { label: "Active", tone: "emerald" };
    case "PENDING":
      return { label: "Pending", tone: "amber" };
    case "SUSPENDED":
      return { label: "Suspended", tone: "rose" };
    case "DEACTIVATED":
      return { label: "Deactivated", tone: "slate" };
    default:
      return { label: status || "Unknown", tone: "slate" };
  }
}

export function coverageTone(pct: number | null | undefined): Tone {
  if (!isNum(pct)) return "slate";
  if (pct >= 80) return "emerald";
  if (pct >= 40) return "indigo";
  if (pct > 0) return "amber";
  return "rose";
}

export function kycInlineLabel(metrics: PerformanceMetrics): { label: string; tone: Tone } {
  return kycMeta(metrics.kycStatus);
}

/* ─── trend ─────────────────────────────────────────────────────────────── */

export interface Trend {
  direction: "up" | "down" | "flat" | "none";
  delta: number | null;
  label: string;
}

export function scoreTrend(
  current: number | null | undefined,
  previous: number | null | undefined,
): Trend {
  if (!isNum(current) || !isNum(previous)) {
    return { direction: "none", delta: null, label: "No previous snapshot" };
  }
  const delta = round1(current - previous);
  if (Math.abs(delta) < 0.05) return { direction: "flat", delta: 0, label: "No change" };
  return {
    direction: delta > 0 ? "up" : "down",
    delta,
    label: `${delta > 0 ? "+" : ""}${formatNumber(delta, 1)} vs previous`,
  };
}

/* ─── metrics catalogue ─────────────────────────────────────────────────── */

export type MetricKey = keyof PerformanceMetrics | "lastLoginDays";
export type MetricKind =
  | "percent"
  | "signedPercent"
  | "minutes"
  | "hours"
  | "rating"
  | "count"
  | "days"
  | "money"
  | "date"
  | "text";

export interface MetricDef {
  key: MetricKey;
  group: string;
  label: string;
  definition: string;
  kind: MetricKind;
  direction: "higher" | "lower" | "none";
  /** Not part of the score (context or denominator). */
  informational?: boolean;
  sampleKey?: string;
  sampleNoun?: string;
  note?: string;
}

export const GROUP_LABELS: Record<string, string> = {
  order: "Order",
  catalog: "Catalog",
  customerExperience: "Customer experience",
  sales: "Sales",
  compliance: "Compliance",
  activity: "Activity",
};

export const METRIC_DEFS: MetricDef[] = [
  {
    key: "orderCount",
    group: "order",
    label: "Orders received",
    definition: "Orders placed in the trailing window (context, not scored).",
    kind: "count",
    direction: "none",
    informational: true,
    sampleKey: "received",
    sampleNoun: "order",
  },
  {
    key: "acceptRate",
    group: "order",
    label: "Accept rate",
    definition: "Accepted ÷ (received − cancelled before accept).",
    kind: "percent",
    direction: "higher",
    sampleKey: "acceptDenominator",
    sampleNoun: "order",
  },
  {
    key: "medianAcceptMinutes",
    group: "order",
    label: "Median accept time",
    definition: "Median minutes from order placement to vendor acceptance.",
    kind: "minutes",
    direction: "lower",
    sampleKey: "acceptMinutes",
    sampleNoun: "order",
  },
  {
    key: "onTimeDispatchRate",
    group: "order",
    label: "On-time dispatch",
    definition: "Share of dispatchable orders handled inside the dispatch SLA.",
    kind: "percent",
    direction: "higher",
    sampleKey: "dispatchComparable",
    sampleNoun: "dispatch",
  },
  {
    key: "avgDispatchDelayHours",
    group: "order",
    label: "Avg dispatch delay",
    definition: "Average hours late against the dispatch SLA (context, not scored).",
    kind: "hours",
    direction: "lower",
    informational: true,
    sampleKey: "dispatchComparable",
    sampleNoun: "dispatch",
  },
  {
    key: "vendorCancelRate",
    group: "order",
    label: "Vendor-cancel rate (self-initiated)",
    definition:
      "Reserved for vendor-initiated cancellations. No such flow exists yet, so this metric is not tracked.",
    kind: "percent",
    direction: "lower",
    note: "Not tracked yet — there is no vendor-initiated cancel flow. Vendor-fault cancels are counted separately below.",
  },
  {
    key: "vendorFaultCancelRate",
    group: "order",
    label: "Vendor-fault cancel rate",
    definition:
      "Orders cancelled by admin with a vendor-fault reason (vendor unable / out of stock) ÷ orders received.",
    kind: "percent",
    direction: "lower",
    sampleKey: "received",
    sampleNoun: "order",
  },
  {
    key: "qualifiedProductCount",
    group: "catalog",
    label: "Qualified products",
    definition:
      "Approved, active products meeting the image, description, price, stock and category minimums.",
    kind: "count",
    direction: "higher",
    sampleKey: "products",
    sampleNoun: "product",
  },
  {
    key: "avgCompletenessPct",
    group: "catalog",
    label: "Avg completeness",
    definition: "Average 0–100 completeness score across the vendor's products.",
    kind: "percent",
    direction: "higher",
    sampleKey: "products",
    sampleNoun: "product",
  },
  {
    key: "avgRating",
    group: "customerExperience",
    label: "Average rating",
    definition: "Mean buyer review rating in the window.",
    kind: "rating",
    direction: "higher",
    sampleKey: "reviews",
    sampleNoun: "review",
  },
  {
    key: "returnRate",
    group: "customerExperience",
    label: "Return rate",
    definition: "Returned orders ÷ delivered orders.",
    kind: "percent",
    direction: "lower",
    sampleKey: "delivered",
    sampleNoun: "delivered order",
  },
  {
    key: "refundRate",
    group: "customerExperience",
    label: "Refund rate",
    definition: "Refunded orders ÷ delivered orders.",
    kind: "percent",
    direction: "lower",
    sampleKey: "delivered",
    sampleNoun: "delivered order",
  },
  {
    key: "grossRevenue",
    group: "sales",
    label: "Gross revenue",
    definition: "Order value before commission and before refunds (context, not scored).",
    kind: "money",
    direction: "higher",
    informational: true,
  },
  {
    key: "revenueGrowthPct",
    group: "sales",
    label: "Revenue growth",
    definition: "Gross revenue versus the previous equal-length period.",
    kind: "signedPercent",
    direction: "higher",
  },
  {
    key: "repeatBuyerRate",
    group: "sales",
    label: "Repeat buyer rate",
    definition: "Share of buyers in the window who ordered more than once.",
    kind: "percent",
    direction: "higher",
    sampleKey: "buyers",
    sampleNoun: "buyer",
  },
  {
    key: "kycValidWeightPct",
    group: "compliance",
    label: "KYC weight valid",
    definition:
      "Weighted share of required KYC documents that are valid; a missing expiry date earns half credit.",
    kind: "percent",
    direction: "higher",
  },
  {
    key: "kycStatus",
    group: "compliance",
    label: "KYC status",
    definition: "Headline KYC verdict from the daily sweep.",
    kind: "text",
    direction: "none",
    informational: true,
  },
  {
    key: "activeDays30",
    group: "activity",
    label: "Active days (30)",
    definition: "Days with at least one login in the last 30 days.",
    kind: "days",
    direction: "higher",
    sampleKey: "loginDays",
    sampleNoun: "active day",
  },
  {
    key: "lastLoginAt",
    group: "activity",
    label: "Last login",
    definition: "Most recent vendor login (context, not scored directly).",
    kind: "date",
    direction: "none",
    informational: true,
  },
  {
    key: "lastLoginDays",
    group: "activity",
    label: "Days since last login",
    definition:
      "Derived from the last login at the snapshot time; the score uses the job's evaluation instant.",
    kind: "days",
    direction: "lower",
    informational: true,
  },
];

export const METRIC_DEF_BY_KEY: Record<string, MetricDef> = Object.fromEntries(
  METRIC_DEFS.map((def) => [def.key, def]),
);

export function metricDef(key: string): MetricDef {
  return (
    METRIC_DEF_BY_KEY[key] ?? {
      key,
      group: "other",
      label: key,
      definition: "Unknown metric.",
      kind: "count",
      direction: "none",
      informational: true,
    }
  );
}

export interface MetricRow {
  key: MetricKey;
  def: MetricDef;
  rule: MetricRule | null;
  informational: boolean;
}

/**
 * Rows for one group, in config order, followed by the informational metrics
 * that belong to the group but are not scored.
 */
export function metricRowsForGroup(groupKey: string, config: ScoreConfig | null): MetricRow[] {
  const defs = METRIC_DEFS.filter((def) => def.group === groupKey);
  const group = config?.groups.find((entry) => entry.key === groupKey);
  if (!group) {
    return defs.map((def) => ({
      key: def.key,
      def,
      rule: null,
      informational: Boolean(def.informational),
    }));
  }
  const rows: MetricRow[] = [];
  for (const rule of group.metrics) {
    rows.push({ key: rule.key as MetricKey, def: metricDef(rule.key), rule, informational: false });
  }
  for (const def of defs) {
    if (!rows.some((row) => row.key === def.key)) {
      rows.push({ key: def.key, def, rule: null, informational: Boolean(def.informational) });
    }
  }
  return rows;
}

export function groupKeys(config: ScoreConfig | null): { key: string; label: string; weight: number | null }[] {
  if (config?.groups.length) {
    return config.groups.map((group) => ({ key: group.key, label: group.label, weight: group.weight }));
  }
  return Object.keys(GROUP_LABELS).map((key) => ({ key, label: GROUP_LABELS[key], weight: null }));
}

/** Days from the raw last-login timestamp to the reference instant. */
export function daysSince(iso: string | null | undefined, reference: string | Date): number | null {
  if (!iso) return null;
  const from = new Date(iso).getTime();
  const to = reference instanceof Date ? reference.getTime() : new Date(reference).getTime();
  if (!Number.isFinite(from) || !Number.isFinite(to)) return null;
  return Math.max(0, Math.floor((to - from) / DAY_MS));
}

export function metricDisplayValue(
  def: MetricDef,
  metrics: PerformanceMetrics,
  referenceDay: string,
): string {
  if (def.key === "lastLoginDays") {
    const days = daysSince(metrics.lastLoginAt, referenceDay);
    return isNum(days) ? `${formatNumber(days, 0)} days` : MISSING_TEXT;
  }
  const value = (metrics as unknown as Record<string, unknown>)[def.key];
  if (value === null || value === undefined) {
    return def.key === "vendorCancelRate" ? "Not tracked" : MISSING_TEXT;
  }
  switch (def.kind) {
    case "percent":
      return percentText(value as number);
    case "signedPercent":
      return signedPercentText(value as number);
    case "minutes":
      return `${formatNumber(value as number, 1)} min`;
    case "hours":
      return `${formatNumber(value as number, 1)} h`;
    case "rating":
      return `${formatNumber(value as number, 1)}/5`;
    case "count":
      return formatNumber(value as number, 0);
    case "days":
      return `${formatNumber(value as number, 0)} days`;
    case "money":
      return taka(value as number);
    case "date":
      return dateText(value as string);
    case "text": {
      const meta = kycMeta(String(value));
      return meta.label;
    }
    default:
      return String(value);
  }
}

const UNIT_SUFFIX: Partial<Record<MetricKind, string>> = {
  percent: "%",
  signedPercent: "%",
  minutes: " min",
  hours: " h",
  days: " days",
  rating: "",
};

/** Human readable scoring threshold for a config rule. */
export function thresholdText(rule: MetricRule | null, def: MetricDef): string {
  if (!rule) return "—";
  const unit = UNIT_SUFFIX[def.kind] ?? "";
  const fmt = (value: number | undefined) =>
    isNum(value) ? `${formatNumber(value, 1)}${unit}` : "—";
  if (rule.scale === "linear") {
    const higher = (rule.at100 ?? 0) >= (rule.at0 ?? 0);
    return higher
      ? `Full score at ≥ ${fmt(rule.at100)} · 0 at ${fmt(rule.at0)}`
      : `Full score at ≤ ${fmt(rule.at100)} · 0 at ${fmt(rule.at0)}`;
  }
  if (rule.scale === "cap") return `Target ${fmt(rule.target)}`;
  return "Score = value (0–100%)";
}

function plural(noun: string, count: number): string {
  if (count === 1) return noun;
  return noun.endsWith("s") ? noun : `${noun}s`;
}

/** "Based on 24 orders" — null when the metric has no sample count. */
export function sampleNote(
  def: MetricDef,
  sampleSizes: Record<string, number> | null,
): string | null {
  if (!def.sampleKey || !sampleSizes) return null;
  const size = sampleSizes[def.sampleKey];
  if (!isNum(size)) return null;
  return `Based on ${formatNumber(size, 0)} ${plural(def.sampleNoun ?? "record", size)}`;
}

/* ─── explanations ──────────────────────────────────────────────────────── */

/** One sentence that explains why the vendor has this grade (never a guess). */
export function explainGrade(
  snapshot: Pick<PerformanceSnapshotView, "score" | "periodDays" | "metrics">,
  config: ScoreConfig | null,
): string {
  const { grade, overallScore, coveragePct } = snapshot.score;
  if (grade === "NOT_ENOUGH_DATA") {
    const need = config?.notEnoughDataCoveragePct;
    const parts: string[] = [];
    if (isNum(coveragePct)) {
      parts.push(`only ${percentText(coveragePct)} of the score weight has data`);
    }
    if (isNum(need)) parts.push(`coverage must reach ${percentText(need)}`);
    parts.push(`too few orders in the ${snapshot.periodDays}-day window`);
    return `Not enough data yet — ${parts.join(", ")}. The grade appears once the window fills.`;
  }
  if (grade === "AT_RISK") {
    const cap = config?.atRiskScoreCap;
    return `At risk — a required KYC document is past its expiry and grace period${
      isNum(cap) ? `, so the score is capped at ${formatNumber(cap, 0)}` : ""
    }. The grade clears when a valid document is on file.`;
  }
  const band = config?.gradeBands.find((entry) => entry.grade === grade);
  if (isNum(overallScore)) {
    return band
      ? `Score ${scoreText(overallScore)}/100 places the vendor in the ${grade} band (${formatNumber(
          band.min,
          0,
        )}+).`
      : `Score ${scoreText(overallScore)}/100 → grade ${grade}.`;
  }
  return `Grade ${grade}.`;
}

/* ─── catalogue issues and KYC expiry text ──────────────────────────────── */

export function catalogIssueText(issue: CatalogIssue): string {
  switch (issue.code) {
    case "IMAGES":
      return `${formatNumber(issue.actual, 0)}/${formatNumber(issue.target, 0)} images`;
    case "DESCRIPTION":
      return `${formatNumber(issue.actual, 0)}/${formatNumber(issue.target, 0)} chars`;
    case "PRICE":
      return "No positive price";
    case "STOCK":
      return "Out of stock";
    case "CATEGORY":
      return "No category";
    case "INACTIVE":
      return "Inactive";
    default:
      return String(issue.code);
  }
}

export function expiryText(doc: Pick<KycDocument, "expiresAt" | "daysLeft">): string {
  if (!doc.expiresAt) return "No expiry date";
  if (!isNum(doc.daysLeft)) return dateText(doc.expiresAt);
  if (doc.daysLeft > 0) return `${formatNumber(doc.daysLeft, 0)} days left`;
  if (doc.daysLeft === 0) return "Expires today";
  return `${formatNumber(Math.abs(doc.daysLeft), 0)} days ago`;
}

export function graceText(
  doc: Pick<KycDocument, "requiresExpiry" | "expiresAt" | "daysLeft" | "graceDaysLeft">,
): string | null {
  if (!doc.requiresExpiry || !doc.expiresAt || !isNum(doc.daysLeft) || doc.daysLeft >= 0) return null;
  if (!isNum(doc.graceDaysLeft)) return null;
  if (doc.graceDaysLeft > 0) return `Grace: ${formatNumber(doc.graceDaysLeft, 0)} days left`;
  return "Grace passed — listings restricted";
}

/* ─── config / run helpers ──────────────────────────────────────────────── */

export function configVersionParts(version: string | null | undefined): {
  platform: string | null;
  score: string | null;
} {
  if (!version) return { platform: null, score: null };
  const [platform, score] = version.split("+");
  return { platform: platform || null, score: score || null };
}

export function shadowModeText(visible: boolean | null | undefined): string {
  if (visible === true) return "Vendor-facing performance is visible";
  return "Shadow mode — admin only (vendors receive 403)";
}

export function runResultLines(result: RunResponse): string[] {
  const fields = result.snapshot;
  const changed = result.productCompleteness.filter((product) =>
    result.dryRun ? product.current !== product.completenessScore : product.written,
  ).length;
  return [
    `${result.dryRun ? "Dry run" : "Saved"} for ${formatDay(result.day)}`,
    `Score ${scoreText(fields.overallScore)} · grade ${fields.grade} · coverage ${percentText(
      fields.coveragePct,
    )}`,
    `${formatNumber(changed, 0)} of ${formatNumber(
      result.productCompleteness.length,
      0,
    )} products ${result.dryRun ? "would change" : "updated"}`,
  ];
}

export function checklistText(action: ChecklistAction, locale: string): string {
  return pickLocalized(action.message, locale);
}

/* ─── API errors ────────────────────────────────────────────────────────── */

export function apiStatus(error: unknown): number | null {
  const status = (error as { status?: unknown } | null)?.status;
  return typeof status === "number" ? status : null;
}

/**
 * Message + field errors from the backend envelope
 * `{ success:false, message, errors? }`, with readable text for the two
 * statuses the manual runner documents (409 lock held, 503 Redis offline).
 */
export function apiErrorText(
  error: unknown,
  fallback: string,
): { message: string; details: string[] } {
  const status = apiStatus(error);
  const data = (error as { data?: unknown } | null)?.data as
    | { message?: unknown; errors?: unknown }
    | undefined;
  const details = Array.isArray(data?.errors) ? data.errors.map(String) : [];
  const server = typeof data?.message === "string" ? data.message.trim() : "";
  let message = server || fallback;
  if (!server && status === 409) message = "A vendor performance run is already in progress.";
  if (!server && status === 503) {
    message = "Snapshot runner unavailable — the job lock store (Redis) is offline.";
  }
  return { message, details };
}

/** Ordered headline metrics for the overview strip. */
export const HEADLINE_METRICS: MetricKey[] = [
  "acceptRate",
  "onTimeDispatchRate",
  "avgRating",
  "qualifiedProductCount",
];
