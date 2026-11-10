"use client";

// components/product/vendor/buisnessadivisordashboard/BusinessAdvisorDashboard.tsx
//
// Business Advisor — a compact, tab-based analytics workspace. One shared
// header with the global date filters and refresh / reset, a section tab
// bar, and one visible section at a time:
//   Overview · Traffic & trends · Sales & payments · Shopping funnel ·
//   Products · Customer journeys · Checkout insights · Definitions
// Every number comes from GET /api/analytics/business-advisor/* (see
// features/businessAdvisorApi); nothing is hard-coded, sampled or
// simulated. The vendor scope is decided by the server from the session —
// the vendor dashboard never sends a vendor id; in admin mode an optional
// vendor id can be entered (validated server-side).
//
// State that must survive tab switches lives here (date range, product
// focus, admin scope, funnel path) or inside panels that stay mounted after
// their first visit (product search / sort / page, journey selection). The
// overview query is shared by all overview-based tabs, so switching tabs
// never refetches it.

import React, { useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { BarChart3, RefreshCw, RotateCcw, CalendarRange, X, Loader2, Lock, AlertTriangle, Sparkles, Database, Store, Info } from "lucide-react";
import { businessAdvisorApi, useGetAdvisorOverviewQuery, type AdvisorFilters } from "@/features/businessAdvisorApi";
import { PRESETS, presetRange, validateRange, dhakaToday, type PresetId } from "@/lib/analytics/advisor-view";
import {
  BRAND_GRADIENT,
  DefinitionsPanel,
  FamilyCards,
  FrictionPanel,
  FunnelPanel,
  InsightsPanel,
  OrdersPaymentsPanel,
  SalesTrendPanel,
  TrafficTrendPanel,
  type FunnelPath,
} from "./AdvisorParts";
import { AdvisorProducts } from "./AdvisorProducts";
import { AdvisorJourneys } from "./AdvisorJourneys";
import { RecordedSessionsPanel } from "./SessionRecordings";
import { AdvisorTabBar, AdvisorTabPanel, type AdvisorTabId } from "./AdvisorTabs";

const CONTROL = "rounded-lg border border-[#E5EAF2] bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100";

export default function BusinessAdvisorDashboard({ mode = "vendor" }: { mode?: "vendor" | "admin" }) {
  const dispatch = useDispatch();
  const [preset, setPreset] = useState<PresetId>("30d");
  const [range, setRange] = useState(() => presetRange("30d"));
  const [custom, setCustom] = useState(range);
  const [rangeError, setRangeError] = useState<string | null>(null);
  const [focus, setFocus] = useState<{ id: string; name: string } | null>(null);
  const [vendorInput, setVendorInput] = useState("");
  const [vendorId, setVendorId] = useState<string | undefined>(undefined);
  const [funnelPath, setFunnelPath] = useState<FunnelPath>("all");
  const [tab, setTab] = useState<AdvisorTabId>("overview");
  const [visited, setVisited] = useState<ReadonlySet<AdvisorTabId>>(() => new Set<AdvisorTabId>(["overview"]));

  const selectTab = (id: AdvisorTabId) => {
    setTab(id);
    setVisited((v) => (v.has(id) ? v : new Set([...v, id])));
  };

  const filters: AdvisorFilters = useMemo(
    () => ({ from: range.from, to: range.to, productId: focus?.id, vendorId: mode === "admin" ? vendorId : undefined }),
    [range, focus, vendorId, mode]
  );
  const { data, error, isLoading, isFetching, isError, refetch } = useGetAdvisorOverviewQuery(filters);
  const status = (error as { status?: number } | undefined)?.status;

  const choosePreset = (id: Exclude<PresetId, "custom">) => {
    setPreset(id);
    const r = presetRange(id);
    setRange(r);
    setCustom(r);
    setRangeError(null);
  };
  const applyCustom = () => {
    const err = validateRange(custom.from, custom.to);
    setRangeError(err);
    if (!err) {
      setPreset("custom");
      setRange(custom);
    }
  };
  const reset = () => {
    choosePreset("30d");
    setFocus(null);
    setVendorId(undefined);
    setVendorInput("");
  };
  const refresh = () => dispatch(businessAdvisorApi.util.invalidateTags(["BusinessAdvisor"]));
  const loading = isLoading;
  const noDataYet = data && !data.trackingStartedAt;

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-3 overflow-x-hidden pb-10">
      {/* ── Header + global filters (one compact card) ── */}
      <header className="rounded-[14px] border border-[#E5EAF2] bg-white">
        <div className="flex flex-col gap-2.5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] text-white" style={{ background: BRAND_GRADIENT }}>
              <BarChart3 className="h-[18px] w-[18px]" aria-hidden />
            </span>
            <div className="min-w-0">
              <h1 className="text-[17px] font-extrabold leading-tight tracking-tight text-slate-900">Business Advisor</h1>
              <p className="truncate text-[12px] text-[#64748B]">
                {mode === "admin" ? "Platform-wide" : "Your store's"} shopping journey — what customers view, add to cart, check out and order, and where they drop off.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="hidden text-[11px] text-[#7A90AB] md:inline" aria-live="polite">
              {isFetching ? "Updating…" : data ? `${data.range.from} → ${data.range.to} · Asia/Dhaka` : ""}
            </span>
            <button type="button" onClick={refresh} aria-label="Refresh data" className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5EAF2] bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
              {isFetching ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <RefreshCw className="h-3.5 w-3.5" aria-hidden />}
              Refresh
            </button>
            <button type="button" onClick={reset} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1" style={{ background: BRAND_GRADIENT }}>
              <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Reset
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-[#E5EAF2] bg-[#FAFBFD] px-4 py-2.5 lg:flex-row lg:items-center lg:justify-between">
          <div role="group" aria-label="Date range" className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-0.5">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                aria-pressed={preset === p.id}
                onClick={() => choosePreset(p.id)}
                className={`shrink-0 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${preset === p.id ? "bg-indigo-600 text-white" : "bg-white text-slate-600 ring-1 ring-[#E5EAF2] hover:text-slate-900"}`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <form
            className="flex flex-wrap items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              applyCustom();
            }}
          >
            <CalendarRange className="h-4 w-4 text-[#7A90AB]" aria-hidden />
            <input type="date" value={custom.from} max={dhakaToday()} onChange={(e) => setCustom((c) => ({ ...c, from: e.target.value }))} aria-label="From date" className={CONTROL} />
            <span className="text-xs text-[#7A90AB]">to</span>
            <input type="date" value={custom.to} max={dhakaToday()} onChange={(e) => setCustom((c) => ({ ...c, to: e.target.value }))} aria-label="To date" className={CONTROL} />
            <button type="submit" className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
              Apply
            </button>
            {mode === "admin" ? (
              <span className="flex items-center gap-1.5">
                <Store className="h-4 w-4 text-[#7A90AB]" aria-hidden />
                <input value={vendorInput} onChange={(e) => setVendorInput(e.target.value)} placeholder="All vendors (or vendor ID)" aria-label="Vendor ID (optional)" className={`${CONTROL} w-44`} />
                <button type="button" onClick={() => setVendorId(vendorInput.trim() || undefined)} className="rounded-lg border border-[#E5EAF2] bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
                  Scope
                </button>
              </span>
            ) : null}
          </form>
        </div>
      </header>

      {rangeError ? <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{rangeError}</p> : null}
      {focus ? (
        <p className="flex flex-wrap items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50/60 px-3 py-1.5 text-xs text-slate-700">
          Showing <strong className="font-semibold text-slate-900">{focus.name}</strong> only.
          <button type="button" onClick={() => setFocus(null)} className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 font-semibold text-indigo-700 ring-1 ring-indigo-200 hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
            <X className="h-3 w-3" aria-hidden /> Clear product filter
          </button>
        </p>
      ) : null}

      {/* ── Whole-page states (nothing to navigate) ── */}
      {isError && status === 503 ? (
        <Notice icon={<Database className="h-5 w-5" aria-hidden />} tone="info" title="Analytics isn't set up yet">
          Business Advisor starts collecting data once FinixMart enables analytics tracking. Nothing has been recorded so far, so no figures are shown.
        </Notice>
      ) : isError && status === 403 ? (
        <Notice icon={<Lock className="h-5 w-5" aria-hidden />} tone="warning" title="You don't have access to Business Advisor">
          Ask the store owner to grant the Analytics permission to your account.
        </Notice>
      ) : isError && status === 404 && mode === "admin" ? (
        <Notice icon={<Store className="h-5 w-5" aria-hidden />} tone="warning" title="Vendor not found">Check the vendor ID, or clear it to see all vendors.</Notice>
      ) : isError ? (
        <Notice icon={<AlertTriangle className="h-5 w-5" aria-hidden />} tone="danger" title="Couldn't load Business Advisor" action={<button type="button" onClick={() => refetch()} className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 ring-1 ring-rose-200">Try again</button>}>
          Check your connection and try again.
        </Notice>
      ) : (
        <>
          {noDataYet ? (
            <Notice icon={<Sparkles className="h-5 w-5" aria-hidden />} tone="info" title="No analytics collected yet">
              Views, carts and checkouts are recorded from now on; earlier activity was never collected and isn&apos;t estimated. Order figures come from your order records.
            </Notice>
          ) : data?.trackingStartedAt ? (
            <p className="flex items-start gap-2 px-1 text-[11.5px] leading-relaxed text-[#64748B]">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-500" aria-hidden />
              <span>
                Tracking started {new Date(data.trackingStartedAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "Asia/Dhaka" })}. {data.definitions.history} Comparison period: {data.comparison.from} → {data.comparison.to}.
              </span>
            </p>
          ) : null}

          <AdvisorTabBar active={tab} onSelect={selectTab} />

          <AdvisorTabPanel id="overview" active={tab} visited={visited}>
            <FamilyCards data={data} loading={loading} />
            <div className="grid items-start gap-3 lg:grid-cols-12">
              <div className="lg:col-span-5">
                <FunnelPanel data={data} loading={loading} path={funnelPath} onPathChange={setFunnelPath} compact onOpen={() => selectTab("funnel")} />
              </div>
              <div className="lg:col-span-4">
                <OrdersPaymentsPanel data={data} loading={loading} compact onOpen={() => selectTab("sales")} />
              </div>
              <div className="lg:col-span-3">
                <InsightsPanel insights={data?.insights ?? []} limit={2} compact onOpen={() => selectTab("checkout")} />
              </div>
            </div>
          </AdvisorTabPanel>

          <AdvisorTabPanel id="trends" active={tab} visited={visited}>
            <TrafficTrendPanel data={data} loading={loading} />
            <SalesTrendPanel data={data} loading={loading} />
          </AdvisorTabPanel>

          <AdvisorTabPanel id="sales" active={tab} visited={visited}>
            <div className="grid items-start gap-3 lg:grid-cols-2">
              <OrdersPaymentsPanel data={data} loading={loading} />
              <SalesTrendPanel data={data} loading={loading} />
            </div>
          </AdvisorTabPanel>

          <AdvisorTabPanel id="funnel" active={tab} visited={visited}>
            <FunnelPanel data={data} loading={loading} path={funnelPath} onPathChange={setFunnelPath} />
          </AdvisorTabPanel>

          <AdvisorTabPanel id="products" active={tab} visited={visited}>
            <AdvisorProducts filters={filters} focusedProductId={focus?.id} onFocusProduct={(id, name) => setFocus(id ? { id, name: name ?? id } : null)} />
          </AdvisorTabPanel>

          <AdvisorTabPanel id="journeys" active={tab} visited={visited}>
            <AdvisorJourneys filters={filters} visualReplay={mode === "admin"} />
            {mode === "admin" ? <RecordedSessionsPanel /> : null}
          </AdvisorTabPanel>

          <AdvisorTabPanel id="checkout" active={tab} visited={visited}>
            <FrictionPanel data={data} loading={loading} />
            <InsightsPanel insights={data?.insights ?? []} />
          </AdvisorTabPanel>

          <AdvisorTabPanel id="definitions" active={tab} visited={visited}>
            <DefinitionsPanel data={data} />
          </AdvisorTabPanel>
        </>
      )}
    </div>
  );
}

function Notice({ icon, tone, title, children, action }: { icon: React.ReactNode; tone: "info" | "warning" | "danger"; title: string; children: React.ReactNode; action?: React.ReactNode }) {
  const styles = { info: "border-indigo-100 bg-indigo-50/70 text-indigo-900", warning: "border-amber-200 bg-amber-50 text-amber-900", danger: "border-rose-200 bg-rose-50 text-rose-900" }[tone];
  return (
    <div role={tone === "danger" ? "alert" : "status"} className={`flex flex-col gap-2.5 rounded-[14px] border px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${styles}`}>
      <div className="flex items-start gap-3">
        <span className="mt-0.5 shrink-0">{icon}</span>
        <div>
          <p className="text-sm font-bold">{title}</p>
          <p className="mt-0.5 text-xs opacity-80">{children}</p>
        </div>
      </div>
      {action}
    </div>
  );
}
