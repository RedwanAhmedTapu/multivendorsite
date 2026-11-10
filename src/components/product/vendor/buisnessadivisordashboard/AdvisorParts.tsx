"use client";

// components/product/vendor/buisnessadivisordashboard/AdvisorParts.tsx
//
// Business Advisor — shared presentational pieces for the tabbed dashboard.
// Every value comes from the API response handed in by the dashboard;
// nothing is hard-coded or simulated.
//
// Colour system
//   - DATA colours (chart series, funnel bars, sparklines) are the validated
//     categorical set: Traffic blue, Cart orange, Checkout aqua, Sales violet
//     (worst adjacent CVD ΔE 9.2). Aqua is below 3:1 on white, so every
//     series also carries a visible label and the trend panels a table view.
//   - ACCENT palettes (tinted headers, icon tiles, tab states) extend that set
//     for the other sections: orders indigo, journeys magenta, friction amber,
//     insights green. Text never takes a data colour — tints sit behind dark
//     text of the same family.
// Two kinds of numbers are always labelled apart:
//   - "tracked" = recorded shopping events (only since tracking began);
//   - "order records" = the order / payment tables (includes history).

import React, { useId, useState } from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip as ChartTooltip, CartesianGrid } from "recharts";
import {
  Info, TrendingUp, TrendingDown, Minus, Lightbulb, AlertTriangle, CheckCircle2, Table2, LineChart as LineIcon,
  Eye, ShoppingCart, CreditCard, BadgeDollarSign, Receipt, Route, ShieldAlert, Filter, BookOpen, LayoutDashboard, Package, Activity,
} from "lucide-react";
import type { AdvisorOverview, AdvisorInsight, FunnelStage, AdvisorKpi } from "@/features/businessAdvisorApi";
import { changeBadge, formatCount, formatDayLabel, formatMoneyMinor, formatPct, FAILURE_COPY } from "@/lib/analytics/advisor-view";

export const ACCENT = {
  traffic: { label: "Traffic", color: "#2a78d6", tint: "#EEF5FD", ink: "#0C447C", ring: "#C9DDF5", icon: Eye },
  cart: { label: "Cart", color: "#eb6834", tint: "#FDF1EB", ink: "#7A2E10", ring: "#F6D2C1", icon: ShoppingCart },
  checkout: { label: "Checkout", color: "#1baf7a", tint: "#E9F7F1", ink: "#085041", ring: "#BFE8D7", icon: CreditCard },
  sales: { label: "Sales", color: "#6250d6", tint: "#F1EFFC", ink: "#3C3489", ring: "#D6D1F5", icon: BadgeDollarSign },
  orders: { label: "Orders and payments", color: "#4f46e5", tint: "#EEF0FD", ink: "#312E81", ring: "#D2D4F7", icon: Receipt },
  funnel: { label: "Funnel", color: "#4f46e5", tint: "#EEF0FD", ink: "#312E81", ring: "#D2D4F7", icon: Filter },
  products: { label: "Products", color: "#2563eb", tint: "#EEF4FE", ink: "#1E3A8A", ring: "#CFDDFB", icon: Package },
  journeys: { label: "Journeys", color: "#c2417a", tint: "#FCEEF4", ink: "#72243E", ring: "#F2C9DA", icon: Route },
  friction: { label: "Checkout insights", color: "#d97706", tint: "#FEF5E7", ink: "#7C3F06", ring: "#F7DDB0", icon: ShieldAlert },
  insights: { label: "Insights", color: "#16a34a", tint: "#ECF8F0", ink: "#14532D", ring: "#C5EBD2", icon: Lightbulb },
  overview: { label: "Overview", color: "#4f46e5", tint: "#EEF0FD", ink: "#312E81", ring: "#D2D4F7", icon: LayoutDashboard },
  trends: { label: "Trends", color: "#2a78d6", tint: "#EEF5FD", ink: "#0C447C", ring: "#C9DDF5", icon: Activity },
  definitions: { label: "Definitions", color: "#475569", tint: "#F4F6F9", ink: "#1E293B", ring: "#DDE3EA", icon: BookOpen },
} as const;
export type AccentKey = keyof typeof ACCENT;
/** Back-compat alias for the four metric families. */
export const FAMILY = ACCENT;
export type FamilyKey = "traffic" | "cart" | "checkout" | "sales";

export const SERIES = {
  views: { label: "Product views", color: ACCENT.traffic.color },
  addToCart: { label: "Add to cart", color: ACCENT.cart.color },
  checkoutStarts: { label: "Checkout starts", color: ACCENT.checkout.color },
  orders: { label: "Orders (tracked)", color: ACCENT.sales.color },
} as const;
export type SeriesKey = keyof typeof SERIES;

/** Soft accent for the page header icon and the primary control (never a full-page gradient). */
export const BRAND_GRADIENT = "linear-gradient(135deg,#2563EB,#8B5CF6)";

export const CARD = "rounded-[14px] border border-[#E5EAF2] bg-white";
const pctChange = (cur: number, prev: number) => (prev > 0 ? Math.round(((cur - prev) / prev) * 1000) / 10 : null);

export function IconTile({ accent, size = "md" }: { accent: AccentKey; size?: "sm" | "md" }) {
  const a = ACCENT[accent];
  const Icon = a.icon;
  const box = size === "sm" ? "h-6 w-6 rounded-[8px]" : "h-7 w-7 rounded-[9px]";
  return (
    <span aria-hidden className={`flex ${box} shrink-0 items-center justify-center bg-white`} style={{ color: a.color, boxShadow: `inset 0 0 0 1px ${a.ring}` }}>
      <Icon className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} />
    </span>
  );
}

export function Panel({
  title,
  subtitle,
  actions,
  children,
  className = "",
  id,
  accent,
  family,
  dense,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  id?: string;
  accent?: AccentKey;
  /** @deprecated use accent */
  family?: AccentKey;
  dense?: boolean;
}) {
  const key = accent ?? family;
  const a = key ? ACCENT[key] : null;
  return (
    <section aria-labelledby={id} className={`${CARD} overflow-hidden ${className}`}>
      <div className={`flex flex-wrap items-center justify-between gap-2 border-b border-[#E5EAF2] ${dense ? "px-3.5 py-2.5" : "px-4 py-2.5 sm:px-5"}`} style={{ background: a ? a.tint : "#FAFBFD" }}>
        <div className="flex min-w-0 items-center gap-2.5">
          {key ? <IconTile accent={key} /> : null}
          <div className="min-w-0">
            <h2 id={id} className="text-[13.5px] font-bold leading-tight" style={{ color: a ? a.ink : "#0f172a" }}>
              {title}
            </h2>
            {subtitle ? <p className="text-[11px] leading-snug text-[#64748B]">{subtitle}</p> : null}
          </div>
        </div>
        {actions}
      </div>
      <div className={dense ? "p-3.5" : "p-4 sm:p-5"}>{children}</div>
    </section>
  );
}

/** Small "i" disclosure — keyboard and pointer accessible, no portal. */
export function InfoTip({ label, text }: { label: string; text: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <span className="relative inline-flex">
      <button
        type="button"
        aria-label={`About ${label}`}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setOpen(false)}
        className="rounded-full p-0.5 text-slate-400 hover:text-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
      >
        <Info className="h-3.5 w-3.5" aria-hidden />
      </button>
      {open ? (
        <span id={id} role="tooltip" className="absolute left-1/2 top-full z-30 mt-1.5 w-64 -translate-x-1/2 rounded-lg bg-slate-900 px-3 py-2 text-[11px] font-normal normal-case leading-relaxed tracking-normal text-white shadow-lg">
          {text}
        </span>
      ) : null}
    </span>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`animate-pulse rounded-xl bg-slate-100 ${className}`} />;
}

/** Compact empty / low-activity state — a small icon, one line, an optional hint. Never a tall blank panel. */
export function CompactEmpty({ icon: Icon = Info, title, hint, tone = "neutral" }: { icon?: React.ElementType; title: string; hint?: string; tone?: "neutral" | "positive" }) {
  return (
    <div role="status" className={`flex items-start gap-2.5 rounded-xl px-3 py-2.5 ${tone === "positive" ? "bg-emerald-50 text-emerald-800" : "bg-[#FAFBFD] text-slate-600"}`}>
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${tone === "positive" ? "text-emerald-600" : "text-slate-400"}`} aria-hidden />
      <div className="min-w-0">
        <p className="text-xs font-semibold">{title}</p>
        {hint ? <p className="mt-0.5 text-[11px] text-[#64748B]">{hint}</p> : null}
      </div>
    </div>
  );
}

export function SourceBadge({ source, accent }: { source: "tracked" | "records"; accent: AccentKey }) {
  return (
    <span className="rounded-full bg-white/85 px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider" style={{ color: ACCENT[accent].ink, boxShadow: `inset 0 0 0 1px ${ACCENT[accent].ring}` }}>
      {source === "records" ? "Order records" : "Tracked"}
    </span>
  );
}

function ChangeChip({ kpi, change }: { kpi?: AdvisorKpi; change?: number | null }) {
  const badge = kpi ? changeBadge(kpi) : typeof change === "number" ? changeBadge({ change, pointsChange: null }) : null;
  if (!badge) return <span className="text-[11px] text-[#7A90AB]">No comparison available</span>;
  const cls = badge.direction === "up" ? "bg-emerald-50 text-emerald-700" : badge.direction === "down" ? "bg-rose-50 text-rose-700" : "bg-slate-100 text-slate-600";
  const Icon = badge.direction === "up" ? TrendingUp : badge.direction === "down" ? TrendingDown : Minus;
  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-[#64748B]">
      <span className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-semibold ${cls}`}>
        <Icon className="h-3 w-3" aria-hidden />
        {badge.text}
      </span>
      vs previous period
    </span>
  );
}

/** Tiny single-series trend for a KPI card (tracked daily events). Decorative; the card states the total. */
export function Sparkline({ data, k }: { data: AdvisorOverview["series"]; k: SeriesKey }) {
  const uid = useId().replace(/:/g, "");
  if (!data.length || data.every((d) => d[k] === 0)) return <div className="h-8" aria-hidden />;
  return (
    <div className="h-8" aria-hidden>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={`spark-${uid}-${k}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={SERIES[k].color} stopOpacity={0.25} />
              <stop offset="100%" stopColor={SERIES[k].color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey={k} stroke={SERIES[k].color} strokeWidth={1.75} fill={`url(#spark-${uid}-${k})`} dot={false} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Family (KPI) cards ──────────────────────────────────────────────────

type Secondary = { label: string; value: string };
function FamilyCard({
  family,
  primaryLabel,
  primaryValue,
  primarySource,
  kpi,
  change,
  secondary,
  help,
  loading,
  spark,
  sparkLabel,
}: {
  family: FamilyKey;
  primaryLabel: string;
  primaryValue: string;
  primarySource: "tracked" | "records";
  kpi?: AdvisorKpi;
  change?: number | null;
  secondary: Secondary[];
  help?: string;
  loading: boolean;
  spark?: { data: AdvisorOverview["series"]; k: SeriesKey };
  sparkLabel?: string;
}) {
  const f = ACCENT[family];
  return (
    <article role="listitem" aria-label={`${f.label}: ${primaryLabel}`} className={`${CARD} relative flex flex-col overflow-hidden`} data-family={family}>
      <span aria-hidden className="absolute inset-x-0 top-0 h-[3px]" style={{ background: f.color }} />
      <div className="flex items-center justify-between gap-2 px-3.5 pb-1 pt-3">
        <span className="flex items-center gap-2 text-[12px] font-bold" style={{ color: f.ink }}>
          <IconTile accent={family} size="sm" />
          {f.label}
        </span>
        <SourceBadge source={primarySource} accent={family} />
      </div>
      <div className="flex flex-1 flex-col px-3.5 pb-3">
        <div className="flex items-center gap-1 text-[11px] font-semibold text-[#64748B]">
          {primaryLabel}
          {help ? <InfoTip label={primaryLabel} text={help} /> : null}
        </div>
        {loading ? (
          <Skeleton className="mt-1 h-7 w-24" />
        ) : (
          <div className="mt-0.5 truncate text-[22px] font-extrabold leading-tight tracking-tight text-slate-900" data-primary={family}>
            {primaryValue}
          </div>
        )}
        <div className="mt-0.5 min-h-[18px]">{loading ? null : <ChangeChip kpi={kpi} change={change} />}</div>
        {spark && !loading ? (
          <div className="mt-1.5">
            <Sparkline data={spark.data} k={spark.k} />
            {sparkLabel ? <p className="sr-only">{sparkLabel}</p> : null}
          </div>
        ) : null}
        <dl className="mt-auto grid grid-cols-2 gap-2 border-t border-[#EEF2F7] pt-2">
          {secondary.map((s) => (
            <div key={s.label} className="min-w-0">
              <dt className="truncate text-[10.5px] text-[#7A90AB]" title={s.label}>
                {s.label}
              </dt>
              <dd className="truncate text-[13px] font-bold tabular-nums text-slate-800">{loading ? "…" : s.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </article>
  );
}

export function FamilyCards({ data, loading }: { data?: AdvisorOverview; loading: boolean }) {
  const k = data?.kpis;
  const rec = data?.orders;
  const series = data?.series ?? [];
  const buyNowCarts = data?.funnel.paths.buyNow.stages[0]?.journeys;
  return (
    <div role="list" aria-label="Metric families" className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      <FamilyCard
        family="traffic"
        primaryLabel="Product views"
        primaryValue={formatCount(k?.views.value)}
        primarySource="tracked"
        kpi={k?.views}
        help={data?.definitions.views}
        loading={loading && !data}
        spark={{ data: series, k: "views" }}
        sparkLabel="Daily product views (tracked)"
        secondary={[{ label: "Browsing journeys", value: formatCount(data?.funnel.totalJourneys) }]}
      />
      <FamilyCard
        family="cart"
        primaryLabel="Add to cart"
        primaryValue={formatCount(k?.addToCart.value)}
        primarySource="tracked"
        kpi={k?.addToCart}
        help={data?.definitions.addToCart}
        loading={loading && !data}
        spark={{ data: series, k: "addToCart" }}
        sparkLabel="Daily add-to-cart (tracked)"
        secondary={[{ label: "Buy Now journeys", value: formatCount(buyNowCarts) }]}
      />
      <FamilyCard
        family="checkout"
        primaryLabel="Checkout starts"
        primaryValue={formatCount(k?.checkoutStarts.value)}
        primarySource="tracked"
        kpi={k?.checkoutStarts}
        help={data?.definitions.checkoutStarts}
        loading={loading && !data}
        spark={{ data: series, k: "checkoutStarts" }}
        sparkLabel="Daily checkout starts (tracked)"
        secondary={[
          { label: "Abandonment", value: formatPct(data?.abandonment.abandonmentRate) },
          { label: "Failed attempts", value: formatCount(k?.checkoutFailures.value) },
        ]}
      />
      {rec ? (
        <FamilyCard
          family="sales"
          primaryLabel="Revenue"
          primaryValue={formatMoneyMinor(rec.current.revenueMinor)}
          primarySource="records"
          change={pctChange(rec.current.revenueMinor, rec.previous.revenueMinor)}
          help={data?.definitions.ordersAuthoritative}
          loading={loading && !data}
          spark={{ data: series, k: "orders" }}
          sparkLabel="Daily orders (tracked) — the trend line is tracked; the revenue figure is from order records"
          secondary={[
            { label: "Orders (records)", value: formatCount(rec.current.ordersPlaced) },
            { label: "Orders (tracked)", value: formatCount(k?.orders.value) },
          ]}
        />
      ) : (
        // product focus: order records aren't product-filtered, so the tracked figures lead
        <FamilyCard
          family="sales"
          primaryLabel="Ordered value (tracked)"
          primaryValue={formatMoneyMinor(k?.orderedValueMinor.value)}
          primarySource="tracked"
          kpi={k?.orderedValueMinor}
          help={data?.definitions.orders}
          loading={loading && !data}
          spark={{ data: series, k: "orders" }}
          sparkLabel="Daily orders (tracked)"
          secondary={[
            { label: "Orders (tracked)", value: formatCount(k?.orders.value) },
            { label: "Units (tracked)", value: formatCount(k?.unitsOrdered.value) },
          ]}
        />
      )}
    </div>
  );
}

// ── Funnel ─────────────────────────────────────────────────────────────

export type FunnelPath = "all" | "buyNow";
const STAGE_COLOR: Record<string, string> = { views: ACCENT.traffic.color, cart: ACCENT.cart.color, checkout: ACCENT.checkout.color, order: ACCENT.sales.color };

function FunnelBars({ stages, compact }: { stages: FunnelStage[]; compact?: boolean }) {
  const max = Math.max(...stages.map((s) => s.journeys), 1);
  return (
    <ol className={`flex flex-col ${compact ? "gap-2" : "gap-3"}`}>
      {stages.map((s, i) => (
        <li key={s.key}>
          <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-3 text-xs">
            <span className="flex items-center gap-1.5 font-semibold text-slate-800">
              <span aria-hidden className="h-2 w-2 rounded-full" style={{ background: STAGE_COLOR[s.key] ?? ACCENT.traffic.color }} />
              {s.label}
            </span>
            <span className="text-[#64748B]">
              <strong className="text-sm font-bold text-slate-900">{formatCount(s.journeys)}</strong> journeys
              {i > 0 ? (
                <>
                  {" · "}
                  {formatPct(s.fromPrevious)} of previous step
                  {!compact && s.dropOff ? ` · ${formatCount(s.dropOff)} dropped` : ""}
                </>
              ) : null}
            </span>
          </div>
          <div className={`${compact ? "h-2" : "h-2.5"} overflow-hidden rounded-full bg-[#EEF2F7]`} aria-hidden>
            <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${Math.max((s.journeys / max) * 100, s.journeys ? 2 : 0)}%`, background: STAGE_COLOR[s.key] ?? ACCENT.traffic.color }} />
          </div>
        </li>
      ))}
    </ol>
  );
}

export function FunnelPathToggle({ path, onChange }: { path: FunnelPath; onChange: (p: FunnelPath) => void }) {
  return (
    <div role="group" aria-label="Funnel path" className="flex rounded-lg bg-white p-0.5 text-xs font-semibold ring-1 ring-[#E5EAF2]">
      {(["all", "buyNow"] as const).map((p) => (
        <button key={p} type="button" aria-pressed={path === p} onClick={() => onChange(p)} className={`rounded-md px-2.5 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${path === p ? "bg-indigo-600 text-white" : "text-[#64748B] hover:text-slate-800"}`}>
          {p === "all" ? "All journeys" : "Buy Now path"}
        </button>
      ))}
    </div>
  );
}

function RateCell({ label, kpi }: { label: string; kpi?: AdvisorKpi }) {
  const badge = kpi ? changeBadge(kpi) : null;
  return (
    <div className="min-w-0 rounded-xl bg-[#FAFBFD] px-2.5 py-2">
      <dt className="truncate text-[10.5px] text-[#7A90AB]">{label}</dt>
      <dd className="flex flex-wrap items-baseline gap-x-1.5">
        <span className="text-sm font-bold tabular-nums text-slate-900">{formatPct(kpi?.value)}</span>
        {badge ? <span className={`text-[10.5px] font-semibold ${badge.direction === "up" ? "text-emerald-700" : badge.direction === "down" ? "text-rose-700" : "text-slate-500"}`}>{badge.text}</span> : null}
      </dd>
    </div>
  );
}

/** Full funnel (Shopping funnel tab) or the compact Overview version; the path selection is owned by the dashboard. */
export function FunnelPanel({ data, loading, path, onPathChange, compact, onOpen }: { data?: AdvisorOverview; loading: boolean; path: FunnelPath; onPathChange: (p: FunnelPath) => void; compact?: boolean; onOpen?: () => void }) {
  if (loading && !data) return <Panel title="Shopping funnel" accent="funnel" dense={compact}><Skeleton className={compact ? "h-28" : "h-48"} /></Panel>;
  if (!data) return null;
  const stages = path === "all" ? data.funnel.stages : data.funnel.paths.buyNow.stages;
  return (
    <Panel
      title="Shopping funnel"
      subtitle={`Journey-based · ${data.range.from} to ${data.range.to}`}
      accent="funnel"
      dense={compact}
      actions={
        <div className="flex items-center gap-2">
          <FunnelPathToggle path={path} onChange={onPathChange} />
          {onOpen ? (
            <button type="button" onClick={onOpen} className="rounded-lg px-2 py-1 text-xs font-semibold text-indigo-700 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
              Details →
            </button>
          ) : null}
        </div>
      }
    >
      <FunnelBars stages={stages} compact={compact} />
      {compact ? null : (
        <>
          <p className="mt-3 text-[11px] leading-relaxed text-[#64748B]">
            {data.definitions.funnel} {path === "buyNow" ? "Buy Now journeys are those whose add-to-cart came from the Buy Now button (it adds to the cart, then opens it)." : ""}
            {data.funnel.truncated ? " Very large range: the funnel was computed from the first 50,000 journey records." : ""}
          </p>
          <div className="mt-3 border-t border-[#EEF2F7] pt-3">
            <p className="mb-2 flex items-center gap-1 text-[11px] font-semibold text-[#64748B]">
              Event conversion rates (tracked events)
              <InfoTip label="event conversion rates" text="Ratios of event counts in the period (e.g. add-to-cart actions ÷ product views), compared in percentage points with the previous period. The bars above count journeys instead." />
            </p>
            <dl className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <RateCell label="View → cart" kpi={data.kpis.viewToCart} />
              <RateCell label="Cart → checkout" kpi={data.kpis.cartToCheckout} />
              <RateCell label="Checkout → order" kpi={data.kpis.checkoutToOrder} />
            </dl>
          </div>
        </>
      )}
    </Panel>
  );
}

// ── Trend panels (one axis per measure — small multiples, never dual axis) ──

export function TrendPanel({ data, loading, keys, title, subtitle, accent, summaryLabel }: { data?: AdvisorOverview; loading: boolean; keys: SeriesKey[]; title: string; subtitle: string; accent: AccentKey; summaryLabel: string }) {
  const [asTable, setAsTable] = useState(false);
  // unique per instance: the same trend can be mounted in two tabs (one hidden), and SVG gradient ids must not collide
  const uid = useId().replace(/:/g, "");
  if (loading && !data) return <Panel title={title} accent={accent}><Skeleton className="h-36" /></Panel>;
  if (!data) return null;
  const totals = Object.fromEntries(keys.map((k) => [k, data.series.reduce((s, d) => s + d[k], 0)])) as Record<SeriesKey, number>;
  const empty = keys.every((k) => totals[k] === 0);
  return (
    <Panel
      title={title}
      subtitle={`${subtitle} · ${data.range.days} day${data.range.days === 1 ? "" : "s"}, Asia/Dhaka`}
      accent={accent}
      actions={
        empty ? null : (
          <button type="button" onClick={() => setAsTable((v) => !v)} aria-pressed={asTable} aria-label={`${asTable ? "Show charts" : "Show table"} for ${summaryLabel}`} className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-[#E5EAF2] hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
            {asTable ? <LineIcon className="h-3.5 w-3.5" aria-hidden /> : <Table2 className="h-3.5 w-3.5" aria-hidden />}
            {asTable ? "Show charts" : "Show table"}
          </button>
        )
      }
    >
      <p className="sr-only" data-testid={`trend-summary-${accent}`}>
        {keys.map((k) => `${SERIES[k].label}: ${formatCount(totals[k])}`).join("; ")} over {data.range.days} days.
      </p>
      {empty ? (
        <CompactEmpty icon={Activity} title="No tracked activity in this period." hint="Trends appear once customers browse and shop. Earlier activity was never recorded." />
      ) : asTable ? (
        <div className="max-h-64 overflow-auto rounded-xl border border-[#E5EAF2]">
          <table className="w-full min-w-[320px] text-left text-xs">
            <caption className="sr-only">Daily {summaryLabel}</caption>
            <thead className="sticky top-0 bg-[#FAFBFD] text-[#64748B]">
              <tr>
                <th scope="col" className="px-3 py-2 font-semibold">Day</th>
                {keys.map((k) => (
                  <th key={k} scope="col" className="px-3 py-2 text-right font-semibold">{SERIES[k].label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.series.map((d) => (
                <tr key={d.day} className="border-t border-slate-100">
                  <th scope="row" className="px-3 py-1.5 font-medium text-slate-700">{formatDayLabel(d.day)}</th>
                  {keys.map((k) => (
                    <td key={k} className="px-3 py-1.5 text-right tabular-nums text-slate-700">{formatCount(d[k])}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={`grid gap-3 ${keys.length > 1 ? "sm:grid-cols-2" : ""} ${keys.length === 3 ? "lg:grid-cols-3" : ""}`}>
          {keys.map((k) => (
            <figure key={k} className="min-w-0 rounded-xl border border-[#EEF2F7] bg-white p-3">
              <figcaption className="mb-1 flex items-center justify-between gap-2 text-xs">
                <span className="flex min-w-0 items-center gap-1.5 font-semibold text-slate-700">
                  <span aria-hidden className="h-2 w-2 shrink-0 rounded-full" style={{ background: SERIES[k].color }} />
                  <span className="truncate">{SERIES[k].label}</span>
                </span>
                <span className="font-bold tabular-nums text-slate-900">{formatCount(totals[k])}</span>
              </figcaption>
              <div className="h-28" aria-hidden>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.series} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
                    <defs>
                      <linearGradient id={`ba-${uid}-${k}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={SERIES[k].color} stopOpacity={0.22} />
                        <stop offset="100%" stopColor={SERIES[k].color} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="#EEF2F7" />
                    <XAxis dataKey="day" tickFormatter={formatDayLabel} tick={{ fontSize: 10, fill: "#64748B" }} tickLine={false} axisLine={false} minTickGap={24} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#64748B" }} tickLine={false} axisLine={false} width={40} />
                    <ChartTooltip
                      cursor={{ stroke: "#94A3B8", strokeDasharray: "3 3" }}
                      labelFormatter={(v) => formatDayLabel(String(v))}
                      formatter={(v) => [formatCount(Number(v)), SERIES[k].label]}
                      contentStyle={{ borderRadius: 10, border: "1px solid #E5EAF2", fontSize: 12 }}
                    />
                    <Area type="monotone" dataKey={k} stroke={SERIES[k].color} strokeWidth={2} fill={`url(#ba-${uid}-${k})`} activeDot={{ r: 4, stroke: "#fff", strokeWidth: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </figure>
          ))}
        </div>
      )}
    </Panel>
  );
}

export function TrafficTrendPanel({ data, loading }: { data?: AdvisorOverview; loading: boolean }) {
  return <TrendPanel data={data} loading={loading} keys={["views", "addToCart", "checkoutStarts"]} title="Traffic and shopping activity" subtitle="Tracked events" accent="traffic" summaryLabel="product views, add-to-cart and checkout starts" />;
}

export function SalesTrendPanel({ data, loading }: { data?: AdvisorOverview; loading: boolean }) {
  return <TrendPanel data={data} loading={loading} keys={["orders"]} title="Sales trend" subtitle="Orders recorded by tracking" accent="sales" summaryLabel="tracked orders" />;
}

// ── Orders and payments (records + tracked, side by side but never merged) ──

export function OrdersPaymentsPanel({ data, loading, compact, onOpen }: { data?: AdvisorOverview; loading: boolean; compact?: boolean; onOpen?: () => void }) {
  if (loading && !data) return <Panel title="Orders & payments" accent="orders" dense={compact}><Skeleton className="h-36" /></Panel>;
  if (!data) return null;
  const k = data.kpis;
  const rec = data.orders;
  const recordItems = rec
    ? [
        { label: "Orders placed", value: formatCount(rec.current.ordersPlaced), change: pctChange(rec.current.ordersPlaced, rec.previous.ordersPlaced) },
        { label: "Revenue", value: formatMoneyMinor(rec.current.revenueMinor), change: pctChange(rec.current.revenueMinor, rec.previous.revenueMinor) },
        { label: "Paid", value: formatCount(rec.current.paid), change: pctChange(rec.current.paid, rec.previous.paid) },
        { label: "Cash on delivery", value: formatCount(rec.current.cashOnDelivery), change: null },
        { label: "Payment failed", value: formatCount(rec.current.paymentFailed), change: null },
        { label: "Cancelled", value: formatCount(rec.current.cancelled), change: null },
      ]
    : [];
  return (
    <Panel
      title="Orders & payments"
      subtitle={rec ? "From your order records — includes orders placed before tracking began" : "Order records aren't product-filtered — clear the product focus to see them"}
      accent="orders"
      dense={compact}
      actions={
        onOpen ? (
          <button type="button" onClick={onOpen} className="rounded-lg px-2 py-1 text-xs font-semibold text-indigo-700 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
            Details →
          </button>
        ) : null
      }
    >
      {rec ? (
        <>
          <dl className={`grid gap-2 ${compact ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2 sm:grid-cols-3"}`}>
            {(compact ? recordItems.slice(0, 6) : recordItems).map((i) => (
              <div key={i.label} className="min-w-0 rounded-xl bg-[#FAFBFD] px-2.5 py-2">
                <dt className="truncate text-[10.5px] font-medium text-[#64748B]">{i.label}</dt>
                <dd className="flex flex-wrap items-baseline gap-x-1.5">
                  <span className="truncate text-[14px] font-bold tabular-nums text-slate-900">{i.value}</span>
                  {i.change !== null ? <span className={`text-[10.5px] font-semibold ${i.change >= 0 ? "text-emerald-700" : "text-rose-700"}`}>{i.change > 0 ? "+" : ""}{i.change}%</span> : null}
                </dd>
              </div>
            ))}
          </dl>
          {compact ? null : (
            <>
              <p className="mt-3 text-[11px] text-[#64748B]">{data.definitions.ordersAuthoritative}</p>
            </>
          )}
        </>
      ) : null}
      {compact ? null : (
        <div className={rec ? "mt-3 border-t border-[#EEF2F7] pt-3" : ""}>
          <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold text-[#64748B]">
            <SourceBadge source="tracked" accent="sales" /> Tracked since tracking began
          </p>
          <dl className="grid grid-cols-3 gap-2">
            {[
              { label: "Orders", value: formatCount(k.orders.value) },
              { label: "Units", value: formatCount(k.unitsOrdered.value) },
              { label: "Ordered value", value: formatMoneyMinor(k.orderedValueMinor.value) },
            ].map((i) => (
              <div key={i.label} className="min-w-0 rounded-xl px-2.5 py-2 ring-1 ring-inset ring-[#EEF2F7]">
                <dt className="truncate text-[10.5px] text-[#7A90AB]">{i.label} (tracked)</dt>
                <dd className="truncate text-sm font-bold tabular-nums text-slate-900">{i.value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-2 text-[11px] text-[#64748B]">{data.definitions.orders} Tracked figures and order records are counted differently and are never added together.</p>
        </div>
      )}
    </Panel>
  );
}

// ── Checkout friction ──────────────────────────────────────────────────

export function FrictionPanel({ data, loading }: { data?: AdvisorOverview; loading: boolean }) {
  if (loading && !data) return <Panel title="Checkout friction" accent="friction"><Skeleton className="h-36" /></Panel>;
  if (!data) return null;
  const total = data.failureReasons.reduce((s, r) => s + r.attempts, 0);
  const max = Math.max(...data.failureReasons.map((r) => r.attempts), 1);
  const a = data.abandonment;
  return (
    <Panel title="Checkout friction" subtitle="Recorded failures and abandonment — facts, not causes" accent="friction">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div>
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { label: "Abandonment", value: formatPct(a.abandonmentRate), tone: "text-rose-700" },
              { label: "Abandoned", value: formatCount(a.abandoned), tone: "text-slate-900" },
              { label: "In progress", value: formatCount(a.inProgress), tone: "text-slate-900" },
            ].map((x) => (
              <div key={x.label} className="rounded-xl bg-[#FAFBFD] px-2 py-2.5">
                <div className={`text-lg font-extrabold tabular-nums ${x.tone}`}>{x.value}</div>
                <div className="text-[11px] text-[#64748B]">{x.label}</div>
              </div>
            ))}
          </div>
          <p className="mt-2.5 text-[11px] leading-relaxed text-[#64748B]">
            {data.definitions.abandonment} <InfoTip label="abandonment" text={`Window: ${a.windowHours} hours. ${a.customersStarted} customers started checkout in this period; ${a.converted} ordered.`} />
          </p>
        </div>
        <div>
          <h3 className="mb-2 text-[11px] font-semibold text-[#64748B]">Failed checkout attempts by reason</h3>
          {total === 0 ? (
            <CompactEmpty icon={CheckCircle2} tone="positive" title="No checkout failures recorded in this period." />
          ) : (
            <ul className="flex flex-col gap-2" aria-label="Failed checkout attempts by reason">
              {data.failureReasons.map((r) => (
                <li key={r.reason}>
                  <div className="mb-0.5 flex justify-between gap-2 text-xs">
                    <span className="font-medium text-slate-700">{FAILURE_COPY[r.reason] ?? r.reason}</span>
                    <span className="tabular-nums text-slate-600">
                      {formatCount(r.attempts)} · {formatPct(Math.round((r.attempts / total) * 1000) / 10)}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[#EEF2F7]" aria-hidden>
                    <div className="h-full rounded-full" style={{ width: `${(r.attempts / max) * 100}%`, background: ACCENT.friction.color }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Panel>
  );
}

// ── Insights (fact first; a hypothesis is labelled as such) ────────────

export function InsightsPanel({ insights, limit, compact, onOpen }: { insights: AdvisorInsight[]; limit?: number; compact?: boolean; onOpen?: () => void }) {
  const shown = typeof limit === "number" ? insights.slice(0, limit) : insights;
  return (
    <Panel
      title="Insights"
      subtitle="Shown only when there is enough data behind them"
      accent="insights"
      dense={compact}
      actions={
        onOpen && insights.length > shown.length ? (
          <button type="button" onClick={onOpen} className="rounded-lg px-2 py-1 text-xs font-semibold text-emerald-800 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
            All {insights.length} →
          </button>
        ) : null
      }
    >
      {shown.length === 0 ? (
        <CompactEmpty icon={Lightbulb} title="Not enough activity yet for reliable insights." hint="Insights need a minimum number of recorded events; nothing is guessed." />
      ) : (
        <ul className={`grid gap-2 ${compact ? "" : "md:grid-cols-2"}`}>
          {shown.map((i) => (
            <li key={i.id} className={`rounded-xl px-3 py-2 text-[13px] ring-1 ring-inset ${i.tone === "positive" ? "bg-emerald-50/60 ring-emerald-100" : "bg-amber-50/60 ring-amber-100"}`}>
              <p className="flex items-start gap-2 font-medium text-slate-800">
                {i.tone === "positive" ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden />}
                <span>
                  <span className="sr-only">Observed: </span>
                  {i.fact}
                </span>
              </p>
              {i.hypothesis ? (
                <p className="mt-1 pl-6 text-xs text-slate-600">
                  <span className="font-semibold">Possible reason (not proven):</span> {i.hypothesis}
                </p>
              ) : null}
              <p className="mt-0.5 pl-6 text-[10.5px] text-[#7A90AB]">Based on {formatCount(i.sample)} records</p>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

// ── Definitions ────────────────────────────────────────────────────────

const DEFINITION_GROUPS: { title: string; keys: string[] }[] = [
  { title: "Calendar and comparison", keys: ["timezone"] },
  { title: "Metrics", keys: ["views", "addToCart", "checkoutStarts", "orders", "funnel", "abandonment"] },
  { title: "Data sources", keys: ["ordersAuthoritative", "history"] },
  { title: "Tracking limitations", keys: ["impressions"] },
];
const DEFINITION_LABEL: Record<string, string> = {
  timezone: "Timezone and comparison period",
  views: "Product views",
  addToCart: "Add to cart",
  checkoutStarts: "Checkout starts",
  orders: "Orders (tracked)",
  funnel: "Shopping funnel",
  abandonment: "Checkout abandonment",
  ordersAuthoritative: "Order records (revenue, orders, payments)",
  history: "History before tracking",
  impressions: "Product impressions",
};

export function DefinitionsPanel({ data }: { data?: AdvisorOverview }) {
  if (!data) return null;
  const known = new Set(DEFINITION_GROUPS.flatMap((g) => g.keys));
  const extra = Object.keys(data.definitions).filter((k) => !known.has(k));
  const groups = extra.length ? [...DEFINITION_GROUPS, { title: "Other", keys: extra }] : DEFINITION_GROUPS;
  return (
    <Panel title="How these numbers are measured" subtitle={`Range ${data.range.from} → ${data.range.to} · ${data.range.timezone}`} accent="definitions">
      <div className="grid gap-4 md:grid-cols-2">
        {groups.map((g) => {
          const items = g.keys.filter((k) => data.definitions[k]);
          if (!items.length) return null;
          return (
            <section key={g.title} aria-label={g.title} className="rounded-xl border border-[#EEF2F7] p-3">
              <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[#64748B]">{g.title}</h3>
              <dl className="flex flex-col gap-2 text-xs text-slate-600">
                {items.map((k) => (
                  <div key={k}>
                    <dt className="font-semibold text-slate-800">{DEFINITION_LABEL[k] ?? k.replace(/([A-Z])/g, " $1")}</dt>
                    <dd className="mt-0.5 leading-relaxed">{data.definitions[k]}</dd>
                  </div>
                ))}
              </dl>
            </section>
          );
        })}
      </div>
      <p className="mt-3 text-[11px] text-[#64748B]">
        {data.trackingStartedAt
          ? `Tracking started ${new Date(data.trackingStartedAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "Asia/Dhaka" })}.`
          : "No analytics have been collected yet."}{" "}
        Comparison period: {data.comparison.from} → {data.comparison.to}. Journey replays are built from recorded events — they are not screen recordings.
      </p>
    </Panel>
  );
}
