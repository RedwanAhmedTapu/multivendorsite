"use client";

// Visual session replay player (admin only) — rrweb's Replayer, loaded lazily
// so it is never part of the storefront or the dashboard's first load.
//
// Safety: the recorded page is rebuilt inside rrweb's sandboxed iframe
// (sandbox="allow-same-origin", no allow-scripts — UNSAFE_replayCanvas is
// pinned off), so recorded markup can't run script in the admin page.
// Chunk bodies are fetched directly (not through the Redux store — they can
// be megabytes) with the admin's bearer token, in order, and abort on unmount.

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { demoModeEnabled } from "@/lib/analytics/replay/demo-gate";
import { resolveChunk } from "@/lib/analytics/replay/demo-adapter";
import { Pause, Play, RotateCcw, MonitorPlay, Loader2 } from "lucide-react";
import type { SessionRecordingDetail } from "@/features/businessAdvisorApi";
import { formatDateTime } from "@/lib/analytics/advisor-view";

type RRWebEvent = { type: number; timestamp: number; data?: any };
export type ReplayerLike = {
  play(timeOffset?: number): void;
  pause(timeOffset?: number): void;
  getCurrentTime(): number;
  getMetaData(): { startTime: number; endTime: number; totalTime: number };
  setConfig(config: Record<string, unknown>): void;
  addEvent(event: RRWebEvent): void;
  destroy(): void;
  on(event: string, handler: (payload?: any) => void): unknown;
};
export type ReplayerCtor = new (events: RRWebEvent[], config: Record<string, unknown>) => ReplayerLike;

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
export const REPLAY_SPEEDS = [1, 2, 4, 8] as const;

const defaultLoadReplayer = () => import("@rrweb/replay").then((m) => m.Replayer as unknown as ReplayerCtor);

/** gunzip + parse one uploaded chunk. */
export async function decodeChunk(buf: ArrayBuffer): Promise<RRWebEvent[]> {
  const DS = (globalThis as { DecompressionStream?: new (f: string) => TransformStream<Uint8Array, Uint8Array> }).DecompressionStream;
  if (!DS) throw new Error("This browser can't decompress recordings.");
  const text = await new Response(new Blob([buf]).stream().pipeThrough(new DS("gzip"))).text();
  const events = JSON.parse(text);
  if (!Array.isArray(events)) throw new Error("Invalid recording chunk");
  return events as RRWebEvent[];
}

export function formatClock(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}

// rrweb's own player styles (cursor + click ripple), scoped keyframe names.
const PLAYER_CSS = `.fm-replay .replayer-wrapper{position:relative}.fm-replay .replayer-wrapper iframe{border:0;background:#fff}.fm-replay .replayer-mouse{position:absolute;width:20px;height:20px;transition:left .05s linear,top .05s linear;background-size:contain;background-position:center;background-repeat:no-repeat;background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 50 50'><path d='M48.71 42.91 34.08 28.29 44.33 18A1 1 0 0 0 44 16.39L2.35 1.06a1 1 0 0 0-1.29 1.29L16.39 44a1 1 0 0 0 1.65.36l10.25-10.28 14.62 14.63a1 1 0 0 0 1.41 0l4.38-4.38a1 1 0 0 0 .01-1.42Z' fill='%23111827' stroke='white' stroke-width='2'/></svg>")}.fm-replay .replayer-mouse:after{content:"";display:inline-block;width:20px;height:20px;background:#c026d3;border-radius:100%;transform:translate(-50%,-50%);opacity:.3}.fm-replay .replayer-mouse.active:after{animation:fm-replay-click .2s ease-in-out 1}.fm-replay .replayer-mouse-tail{position:absolute;pointer-events:none}@keyframes fm-replay-click{0%{opacity:.3;width:20px;height:20px}50%{opacity:.6;width:10px;height:10px}}`;

export function SessionReplayPlayer({
  recording,
  accessToken,
  loadReplayer = defaultLoadReplayer,
  fetchImpl,
  apiBase = API_BASE,
}: {
  recording: SessionRecordingDetail;
  accessToken: string | null;
  loadReplayer?: () => Promise<ReplayerCtor>;
  fetchImpl?: typeof fetch;
  apiBase?: string;
}) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const replayer = useRef<ReplayerLike | null>(null);
  const [loaded, setLoaded] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [now, setNow] = useState(0);
  const [total, setTotal] = useState(0);
  const [speed, setSpeed] = useState<(typeof REPLAY_SPEEDS)[number]>(1);
  const [skipInactive, setSkipInactive] = useState(true);
  // a new recording's replayer starts with the controls' current values (they persist across switching)
  const speedRef = useRef(speed);
  speedRef.current = speed;
  const skipRef = useRef(skipInactive);
  skipRef.current = skipInactive;
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const [scale, setScale] = useState(1);
  // page changes (Meta) and "not recorded" gaps (the recorder's excluded-section marker), by time offset
  const [pages, setPages] = useState<{ at: number; path: string; excluded?: string }[]>([]);
  const chunkCount = recording.chunks.length;

  // load + stream chunks
  useEffect(() => {
    const abort = new AbortController();
    const doFetch = fetchImpl ?? ((i: RequestInfo | URL, init?: RequestInit) => fetch(i, init));
    let destroyed = false;
    // a new recording starts from a clean slate — no page label, clock or size from the previous one
    setLoaded(0);
    setError(null);
    setReady(false);
    setPlaying(false);
    setNow(0);
    setTotal(0);
    setSize(null);
    setPages([]);
    const getChunk = async (seq: number) => {
      const demo = resolveChunk(demoModeEnabled(), recording.id, seq);
      if (demo.demo) {
        if (!demo.found) throw new Error("This demo recording has no chunk " + seq + ".");
        return JSON.parse(demo.body) as RRWebEvent[];
      }
      const res = await doFetch(`${apiBase}/analytics/business-advisor/recordings/${encodeURIComponent(recording.id)}/chunks/${seq}`, {
        headers: accessToken ? {
          Authorization: `Bearer ${accessToken}`,
        } : {},
        credentials: "include",
        signal: abort.signal,
      });
      if (res.status === 401 || res.status === 403) throw new Error("You don't have access to this recording (sign in again as an administrator).");
      if (!res.ok) throw new Error("Couldn't load part of this recording.");
      return decodeChunk(await res.arrayBuffer());
    };
    const notePages = (events: RRWebEvent[], start: number) => {
      const metas = events.filter((e) => (e.type === 4 && typeof e.data?.href === "string") || (e.type === 5 && e.data?.tag === "fm:excluded-page"));
      if (!metas.length) return;
      setPages((p) => [
        ...p,
        ...metas.map((e) => {
          if (e.type === 5) return { at: e.timestamp - start, path: "", excluded: String(e.data?.payload?.section ?? "other") };
          let path = "/";
          try {
            path = new URL(e.data.href).pathname;
          } catch {
            /* keep "/" */
          }
          return { at: e.timestamp - start, path };
        }),
      ]);
    };
    (async () => {
      try {
        if (!chunkCount) throw new Error("This recording has no captured data.");
        const [Replayer, first] = await Promise.all([loadReplayer(), getChunk(recording.chunks[0].seq)]);
        if (destroyed) return;
        if (first.length < 2) throw new Error("This recording is too short to replay.");
        const r = new Replayer(first, {
          root: frameRef.current!,
          speed: speedRef.current,
          skipInactive: skipRef.current,
          mouseTail: false,
          triggerFocus: false,
          showWarning: false,
          UNSAFE_replayCanvas: false,
          insertStyleRules: [],
        });
        replayer.current = r;
        r.on("resize", (d: { width: number; height: number }) => d && setSize({ width: d.width, height: d.height }));
        r.on("finish", () => setPlaying(false));
        const start = r.getMetaData().startTime;
        notePages(first, start);
        setTotal(r.getMetaData().totalTime);
        setLoaded(1);
        setReady(true);
        r.pause(0);
        for (let i = 1; i < chunkCount; i++) {
          const events = await getChunk(recording.chunks[i].seq);
          if (destroyed) return;
          for (const e of events) r.addEvent(e);
          // rrweb's addEvent applies each event in a microtask; wait for them before reading the new end time
          await Promise.resolve();
          if (destroyed) return;
          notePages(events, start);
          setTotal(r.getMetaData().totalTime);
          setLoaded(i + 1);
        }
      } catch (err: any) {
        if (destroyed || err?.name === "AbortError") return;
        setError(err?.message || "Couldn't load this recording.");
      }
    })();
    return () => {
      destroyed = true;
      abort.abort();
      try {
        replayer.current?.destroy();
      } catch {
        /* ignore */
      }
      replayer.current = null;
    };
  }, [recording.id, chunkCount, accessToken, apiBase, fetchImpl, loadReplayer]);

  // clock
  useEffect(() => {
    if (!ready) return;
    const t = setInterval(() => {
      const r = replayer.current;
      if (r) setNow(Math.min(r.getCurrentTime(), r.getMetaData().totalTime));
    }, 250);
    return () => clearInterval(t);
  }, [ready]);

  // fit the recorded viewport into the stage
  useEffect(() => {
    const el = stageRef.current;
    if (!el || !size) return;
    const fit = () => setScale(Math.min(1, el.clientWidth / size.width || 1));
    fit();
    const RO = (globalThis as { ResizeObserver?: typeof ResizeObserver }).ResizeObserver;
    if (!RO) return;
    const ro = new RO(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [size]);

  const togglePlay = useCallback(() => {
    const r = replayer.current;
    if (!r) return;
    if (playing) {
      r.pause();
      setPlaying(false);
    } else {
      const at = now >= total ? 0 : r.getCurrentTime();
      r.play(at);
      setPlaying(true);
    }
  }, [playing, now, total]);

  const seek = (ms: number) => {
    const r = replayer.current;
    if (!r) return;
    setNow(ms);
    // rrweb applies events strictly BEFORE the seek time; the end of the slider equals the last event's
    // time, so seek just past it — otherwise the recording's final event is never shown
    const at = ms >= total ? total + 1 : ms;
    if (playing) r.play(at);
    else r.pause(at);
  };

  const current = useMemo(() => [...pages].reverse().find((p) => p.at <= now), [pages, now]);
  const gap = current?.excluded ?? null;
  const currentPage = gap ? `not recorded — ${gap} (privacy)` : current?.path ?? recording.entryPath ?? "—";
  const loading = loaded < chunkCount && !error;

  return (
    <div className="fm-replay rounded-[14px] border border-fuchsia-200 bg-white p-3" role="region" aria-label={`Visual replay of journey ${recording.journeyId}`}>
      <style>{PLAYER_CSS}</style>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <MonitorPlay className="h-4 w-4 text-fuchsia-600" aria-hidden />
          <p className="text-sm font-semibold text-slate-800">
            Visual replay <span className="font-mono text-xs text-slate-500">{recording.journeyId}</span>
          </p>
          {recording.synthetic ? <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800 ring-1 ring-amber-200">Synthetic test</span> : null}
        </div>
        <p className="text-[11px] text-slate-500">
          Started {formatDateTime(recording.startedAt)} · {recording.pageCount} page{recording.pageCount === 1 ? "" : "s"}
        </p>
      </div>
      <p className="mb-2 text-[11px] text-slate-500">
        A recording of the page as the browser rendered it. Typed values are masked; checkout, payment, sign-in, account pages and dashboards are never recorded, so time spent there appears as a gap.
      </p>

      <div ref={stageRef} className="relative overflow-hidden rounded-lg bg-slate-100" style={{ height: size ? Math.min(size.height * scale, 640) : 360 }}>
        <div ref={frameRef} data-testid="replay-stage" style={{ transform: `scale(${scale})`, transformOrigin: "top left", width: size?.width, height: size?.height }} />
        {!ready && !error ? (
          <div className="absolute inset-0 flex items-center justify-center gap-2 text-xs text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Loading recording…
          </div>
        ) : null}
        {ready && gap && !error ? (
          <div data-testid="replay-gap" className="absolute inset-0 flex items-center justify-center bg-slate-900/70 px-6 text-center text-xs font-semibold text-white">
            Not recorded: the shopper was on a {gap} page. It is excluded from replays for privacy; the recording continues when they leave it.
          </div>
        ) : null}
        {error ? (
          <div role="alert" className="absolute inset-0 flex items-center justify-center px-6 text-center text-xs text-rose-700">
            {error}
          </div>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={togglePlay}
          disabled={!ready}
          aria-label={playing ? "Pause visual replay" : "Play visual replay"}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-fuchsia-600 text-white disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400"
        >
          {playing ? <Pause className="h-4 w-4" aria-hidden /> : <Play className="h-4 w-4" aria-hidden />}
        </button>
        <button type="button" onClick={() => seek(0)} disabled={!ready} aria-label="Restart visual replay" className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-600 ring-1 ring-slate-200 disabled:opacity-40">
          <RotateCcw className="h-3.5 w-3.5" aria-hidden />
        </button>
        <span className="w-24 text-xs tabular-nums text-slate-600" aria-live="off">
          {formatClock(now)} / {formatClock(total)}
        </span>
        <input
          type="range"
          min={0}
          max={Math.max(total, 1)}
          // exact positions: a fixed step snaps seeks to its multiples and can make the recording's end unreachable
          step="any"
          value={Math.min(now, total)}
          onChange={(e) => seek(Number(e.target.value))}
          disabled={!ready}
          aria-label="Seek visual replay"
          aria-valuetext={`${formatClock(now)} of ${formatClock(total)}`}
          className="min-w-[160px] flex-1 accent-fuchsia-600"
        />
        <label className="flex items-center gap-1 text-xs text-slate-600">
          Speed
          <select
            value={speed}
            onChange={(e) => {
              const v = Number(e.target.value) as (typeof REPLAY_SPEEDS)[number];
              setSpeed(v);
              replayer.current?.setConfig({ speed: v });
            }}
            aria-label="Playback speed"
            className="rounded-md border border-slate-200 bg-white px-1.5 py-1 text-xs"
          >
            {REPLAY_SPEEDS.map((s) => (
              <option key={s} value={s}>
                {s}×
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-1 text-xs text-slate-600">
          <input
            type="checkbox"
            checked={skipInactive}
            onChange={(e) => {
              setSkipInactive(e.target.checked);
              replayer.current?.setConfig({ skipInactive: e.target.checked });
            }}
          />
          Skip inactivity
        </label>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
        <span>
          Page: <span className="font-mono text-slate-700">{currentPage}</span>
        </span>
        <span aria-live="polite">{loading ? `Loading ${loaded} of ${chunkCount} parts…` : error ? "" : `${chunkCount} part${chunkCount === 1 ? "" : "s"} loaded`}</span>
      </div>
    </div>
  );
}
