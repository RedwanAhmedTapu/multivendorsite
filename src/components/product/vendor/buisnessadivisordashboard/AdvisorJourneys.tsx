"use client";

// Customer Journey Explorer — GET /analytics/business-advisor/journeys.
// An EVENT-BASED replay: it steps through the recorded shopping events of a
// journey (view → cart → checkout → order / failure). It is not a recording
// of anyone's screen, and it shows no customer identity — journeys are
// labelled J-XXXXXXXX by the server and contain only this store's products.
// In admin mode (visualReplay) a journey may also have a VISUAL recording
// (SessionRecordings.tsx) — shown separately and labelled as such.

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Play, Pause, SkipBack, SkipForward, Route, Eye, ShoppingCart, CreditCard, PackageCheck, XCircle, MinusCircle, PlusCircle, Clapperboard } from "lucide-react";
import { useGetAdvisorJourneysQuery, type AdvisorFilters, type Journey, type JourneyStep } from "@/features/businessAdvisorApi";
import { FAILURE_COPY, PATH_COPY, STEP_COPY, formatDateTime, formatDuration, outcomeCopy, type OutcomeTone } from "@/lib/analytics/advisor-view";
import { CompactEmpty, Panel, Skeleton } from "./AdvisorParts";
import { JourneyRecordings } from "./SessionRecordings";

export const REPLAY_STEP_MS = 1200;

const STEP_ICON: Record<JourneyStep["type"], React.ElementType> = {
  PRODUCT_VIEW: Eye,
  ADD_TO_CART: ShoppingCart,
  REMOVE_FROM_CART: MinusCircle,
  CART_QUANTITY_CHANGED: PlusCircle,
  CHECKOUT_STARTED: CreditCard,
  CHECKOUT_FAILED: XCircle,
  ORDER_PLACED: PackageCheck,
};
const TONE: Record<OutcomeTone, string> = {
  success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  warning: "bg-amber-50 text-amber-800 ring-amber-200",
  danger: "bg-rose-50 text-rose-700 ring-rose-200",
  info: "bg-sky-50 text-sky-700 ring-sky-200",
  neutral: "bg-slate-100 text-slate-600 ring-slate-200",
};

export function OutcomeBadge({ outcome }: { outcome: string }) {
  const c = outcomeCopy(outcome);
  return (
    <span title={c.help} className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${TONE[c.tone]}`}>
      {c.label}
    </span>
  );
}

function stepDetail(s: JourneyStep): string {
  const parts: string[] = [];
  if (s.type === "CHECKOUT_FAILED" && s.reason) parts.push(FAILURE_COPY[s.reason] ?? s.reason);
  if (s.quantity && ["ADD_TO_CART", "CART_QUANTITY_CHANGED", "ORDER_PLACED", "REMOVE_FROM_CART"].includes(s.type)) parts.push(`qty ${s.quantity}`);
  if (s.source === "BUY_NOW") parts.push("via Buy Now");
  return parts.join(" · ");
}

/** Play / pause / step through a journey's recorded events. */
export function JourneyReplay({ journey }: { journey: Journey }) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const last = journey.steps.length - 1;

  useEffect(() => {
    setIndex(0);
    setPlaying(false);
  }, [journey.id]);
  useEffect(() => {
    if (!playing) return;
    timer.current = setInterval(() => {
      setIndex((i) => {
        if (i >= last) {
          setPlaying(false);
          return i;
        }
        return i + 1;
      });
    }, REPLAY_STEP_MS);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [playing, last]);

  const step = journey.steps[index];
  const progress = last > 0 ? (index / last) * 100 : 100;

  return (
    <div className="rounded-[14px] border border-[#E5EAF2] bg-[#FAFBFD] p-4" aria-label={`Journey ${journey.id} replay`} role="region">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="flex items-center gap-1.5 text-sm font-bold text-slate-900">
            <Clapperboard className="h-4 w-4 text-indigo-600" aria-hidden /> Journey {journey.id}
          </p>
          <p className="text-[11px] text-slate-500">
            {formatDateTime(journey.startedAt)} · {formatDuration(journey.durationSeconds)} · {PATH_COPY[journey.path] ?? journey.path}
          </p>
        </div>
        <OutcomeBadge outcome={journey.outcome} />
      </div>

      {/* transport */}
      <div className="mb-3 flex items-center gap-2">
        <button type="button" aria-label="Previous step" disabled={index === 0} onClick={() => { setPlaying(false); setIndex((i) => Math.max(i - 1, 0)); }} className="rounded-lg bg-white p-2 text-slate-600 shadow-sm ring-1 ring-slate-200 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
          <SkipBack className="h-4 w-4" aria-hidden />
        </button>
        <button
          type="button"
          aria-label={playing ? "Pause replay" : "Play replay"}
          onClick={() => {
            if (!playing && index >= last) setIndex(0);
            setPlaying((p) => !p);
          }}
          className="rounded-xl p-2.5 text-white shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
          style={{ background: "linear-gradient(135deg,#1D4ED8,#7C3AED)" }}
        >
          {playing ? <Pause className="h-4 w-4" aria-hidden /> : <Play className="h-4 w-4" aria-hidden />}
        </button>
        <button type="button" aria-label="Next step" disabled={index >= last} onClick={() => { setPlaying(false); setIndex((i) => Math.min(i + 1, last)); }} className="rounded-lg bg-white p-2 text-slate-600 shadow-sm ring-1 ring-slate-200 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
          <SkipForward className="h-4 w-4" aria-hidden />
        </button>
        <label className="flex flex-1 items-center gap-2">
          <span className="sr-only">Replay position</span>
          <input
            type="range"
            min={0}
            max={Math.max(last, 0)}
            value={index}
            onChange={(e) => {
              setPlaying(false);
              setIndex(Number(e.target.value));
            }}
            aria-valuetext={step ? `Step ${index + 1} of ${journey.steps.length}: ${STEP_COPY[step.type]?.label}` : undefined}
            className="w-full accent-indigo-600"
          />
        </label>
        <span className="w-12 text-right text-[11px] tabular-nums text-slate-500">
          {index + 1}/{journey.steps.length}
        </span>
      </div>
      <div className="mb-3 h-1 overflow-hidden rounded-full bg-indigo-100" aria-hidden>
        <div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-violet-600 transition-[width] duration-300" style={{ width: `${progress}%` }} />
      </div>

      {journey.stepsTruncated ? <p className="mb-2 text-[11px] text-slate-500">Long journey — showing its latest {journey.steps.length} recorded steps.</p> : null}
      {/* timeline */}
      <ol className="relative flex flex-col gap-1.5" aria-label="Recorded steps">
        {journey.steps.map((s, i) => {
          const Icon = STEP_ICON[s.type] ?? Route;
          const state = i < index ? "done" : i === index ? "current" : "next";
          const failed = s.type === "CHECKOUT_FAILED";
          return (
            <li
              key={`${s.at}-${i}`}
              aria-current={state === "current" ? "step" : undefined}
              className={`flex items-start gap-2.5 rounded-xl px-2.5 py-2 transition-all duration-300 ${
                state === "current" ? "bg-white shadow-md ring-1 ring-indigo-200" : state === "done" ? "opacity-80" : "opacity-45"
              }`}
            >
              <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${failed ? "bg-rose-100 text-rose-600" : s.type === "ORDER_PLACED" ? "bg-emerald-100 text-emerald-700" : "bg-indigo-100 text-indigo-700"} ${state === "current" ? "scale-110" : ""} transition-transform`}>
                <Icon className="h-3.5 w-3.5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-800">
                  {STEP_COPY[s.type]?.label ?? s.type} <span className="font-normal text-slate-500">· {s.productName}</span>
                </p>
                <p className="text-[11px] text-slate-500">
                  {formatDateTime(s.at)}
                  {s.secondsSincePrevious !== null ? ` · +${formatDuration(s.secondsSincePrevious)}` : ""}
                  {stepDetail(s) ? ` · ${stepDetail(s)}` : ""}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function AdvisorJourneys({ filters, visualReplay = false }: { filters: AdvisorFilters; visualReplay?: boolean }) {
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string | null>(null);
  useEffect(() => setPage(1), [filters.from, filters.to, filters.productId, filters.vendorId]);
  const { data, isLoading, isError, refetch } = useGetAdvisorJourneysQuery({ ...filters, page });
  const journey = useMemo(() => data?.items.find((j) => j.id === selected) ?? data?.items[0] ?? null, [data, selected]);
  const outcomeSummary = useMemo(() => {
    const m = new Map<string, number>();
    for (const j of data?.items ?? []) m.set(j.outcome, (m.get(j.outcome) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [data]);

  return (
    <Panel accent="journeys" title="Customer journey explorer" subtitle={data?.replayNotice ?? "Event-based journey replay — recorded shopping events, not a screen recording."}>
      {isLoading ? (
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]"><Skeleton className="h-48" /><Skeleton className="h-48" /></div>
      ) : isError ? (
        <div role="alert" className="flex items-center justify-between rounded-xl bg-rose-50 px-3 py-3 text-xs text-rose-700">
          <span>Couldn&apos;t load journeys.</span>
          <button type="button" onClick={() => refetch()} className="font-bold">Try again</button>
        </div>
      ) : !data || data.items.length === 0 ? (
        <CompactEmpty icon={Route} title="No journeys recorded in this period." hint="Journeys appear once customers view, add to cart or check out your products." />
      ) : (
        <>
          <div className="mb-3 flex flex-wrap gap-1.5" aria-label="Outcomes on this page">
            {outcomeSummary.map(([o, n]) => (
              <span key={o} className="inline-flex items-center gap-1 text-[11px] text-slate-600">
                <OutcomeBadge outcome={o} /> ×{n}
              </span>
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
            <ul className="flex max-h-[520px] flex-col gap-1.5 overflow-y-auto pr-1" aria-label="Journeys">
              {data.items.map((j) => (
                <li key={j.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(j.id)}
                    aria-pressed={journey?.id === j.id}
                    className={`w-full rounded-xl border px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${journey?.id === j.id ? "border-indigo-200 bg-indigo-50/60" : "border-slate-100 hover:bg-slate-50"}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-semibold text-slate-700">{j.id}</span>
                      <OutcomeBadge outcome={j.outcome} />
                    </div>
                    <div className="mt-1 flex items-center gap-1" aria-label={`Steps: ${j.steps.map((s) => STEP_COPY[s.type]?.short ?? s.type).join(", ")}`}>
                      {j.steps.slice(0, 8).map((s, i) => {
                        const Icon = STEP_ICON[s.type] ?? Route;
                        return <Icon key={i} className={`h-3.5 w-3.5 ${s.type === "CHECKOUT_FAILED" ? "text-rose-500" : s.type === "ORDER_PLACED" ? "text-emerald-600" : "text-indigo-500"}`} aria-hidden />;
                      })}
                      {j.steps.length > 8 ? <span className="text-[10px] text-slate-400">+{j.steps.length - 8}</span> : null}
                    </div>
                    <p className="mt-1 truncate text-[11px] text-slate-500">
                      {formatDateTime(j.lastActivityAt)} · {j.products.map((p) => p.name).join(", ")}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
            {journey ? (
              <div className="min-w-0">
                <JourneyReplay journey={journey} />
                {visualReplay ? <JourneyRecordings journeyId={journey.id} /> : null}
              </div>
            ) : null}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span>
              Page {data.page} of {data.totalPages} · abandonment is called after {data.abandonAfterHours} h without an order
            </span>
            <div className="flex gap-1">
              <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg border border-[#E5EAF2] px-2 py-1 disabled:opacity-40">Previous</button>
              <button type="button" disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-lg border border-[#E5EAF2] px-2 py-1 disabled:opacity-40">Next</button>
            </div>
          </div>
        </>
      )}
    </Panel>
  );
}
