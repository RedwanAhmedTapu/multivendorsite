"use client";

// Visual recordings in Business Advisor (admin only — the server refuses
// vendors). Two entry points:
//   - JourneyRecordings: under a journey's event-based replay, the visual
//     recordings linked to that journey (same J- id), if any;
//   - RecordedSessionsPanel: every recording, newest first (synthetic test
//     sessions may have no shopping events, so no journey in the explorer).
// Recordings and event-based replays are labelled distinctly; a journey
// without a recording says so instead of pretending to have one.

import React, { useState } from "react";
import { useSelector } from "react-redux";
import { MonitorPlay, Trash2, X } from "lucide-react";
import type { RootState } from "@/store/store";
import {
  useDeleteSessionRecordingMutation,
  useGetSessionRecordingQuery,
  useGetSessionRecordingsQuery,
  type SessionRecordingSummary,
} from "@/features/businessAdvisorApi";
import { formatDateTime } from "@/lib/analytics/advisor-view";
import { CompactEmpty, Panel, Skeleton } from "./AdvisorParts";
import { SessionReplayPlayer, formatClock } from "./SessionReplayPlayer";

const notReady = (error: unknown) => (error as { status?: number } | undefined)?.status === 503;

function sizeLabel(bytes: number) {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function RecordingViewer({ id, onClose }: { id: string; onClose: () => void }) {
  const accessToken = useSelector((s: RootState) => s.auth?.accessToken ?? null);
  const { data, isLoading, isError } = useGetSessionRecordingQuery(id);
  return (
    <div className="mt-3">
      <div className="mb-1 flex justify-end">
        <button type="button" onClick={onClose} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100">
          <X className="h-3.5 w-3.5" aria-hidden /> Close visual replay
        </button>
      </div>
      {isLoading ? <Skeleton className="h-64" /> : isError || !data ? <p role="alert" className="text-xs text-rose-700">Couldn&apos;t load this recording.</p> : <SessionReplayPlayer recording={data} accessToken={accessToken} />}
    </div>
  );
}

/** Visual recordings linked to one journey (shown under its event-based replay). */
export function JourneyRecordings({ journeyId }: { journeyId: string }) {
  const { data, isLoading, error } = useGetSessionRecordingsQuery({ journey: journeyId });
  const [open, setOpen] = useState<string | null>(null);
  if (isLoading) return <Skeleton className="mt-3 h-10" />;
  if (notReady(error)) return <p className="mt-3 text-[11px] text-slate-500">Visual replay isn&apos;t set up yet — this journey has its event-based replay only.</p>;
  if (error) return null;
  const items = data?.items ?? [];
  if (!items.length) return <p className="mt-3 text-[11px] text-slate-500">No screen recording for this journey — the event-based replay above is everything that was captured.</p>;
  return (
    <div className="mt-3 rounded-xl border border-fuchsia-100 bg-fuchsia-50/40 p-2.5">
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-fuchsia-800">Visual recordings of this journey</p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => setOpen(open === r.id ? null : r.id)}
            aria-pressed={open === r.id}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold text-fuchsia-700 ring-1 ring-fuchsia-200 hover:bg-fuchsia-50"
          >
            <MonitorPlay className="h-3.5 w-3.5" aria-hidden />
            Watch visual replay · {formatClock(r.durationMs)} · {r.pageCount} page{r.pageCount === 1 ? "" : "s"}
          </button>
        ))}
      </div>
      {open ? <RecordingViewer id={open} onClose={() => setOpen(null)} /> : null}
    </div>
  );
}

function RecordingRow({ r, onOpen, open }: { r: SessionRecordingSummary; onOpen: () => void; open: boolean }) {
  const [confirming, setConfirming] = useState(false);
  const [remove, { isLoading: deleting }] = useDeleteSessionRecordingMutation();
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 px-3 py-2">
      <div className="min-w-0">
        <p className="flex items-center gap-2 text-xs font-semibold text-slate-800">
          <span className="font-mono">{r.journeyId}</span>
          {r.synthetic ? <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-800 ring-1 ring-amber-200">Synthetic</span> : null}
          {r.status === "STOPPED" ? <span className="text-[10px] font-semibold text-slate-500">stopped ({r.stopReason ?? "limit"})</span> : null}
          {r.status === "RECORDING" ? (
            <span className="text-[10px] font-semibold text-amber-700" title="No finish signal was received: the browser may still be recording, or it closed mid-upload. Only the parts received so far can be replayed.">
              in progress / incomplete
            </span>
          ) : null}
        </p>
        <p className="text-[11px] text-slate-500">
          {formatDateTime(r.startedAt)} · {formatClock(r.durationMs)} · {r.pageCount} page{r.pageCount === 1 ? "" : "s"} · {sizeLabel(r.bytes)}
          {r.entryPath ? ` · from ${r.entryPath}` : ""}
        </p>
      </div>
      <div className="flex items-center gap-1.5">
        <button type="button" onClick={onOpen} aria-pressed={open} className="inline-flex items-center gap-1 rounded-lg bg-fuchsia-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-fuchsia-700">
          <MonitorPlay className="h-3.5 w-3.5" aria-hidden /> {open ? "Hide" : "Watch"}
        </button>
        {confirming ? (
          <>
            <button type="button" disabled={deleting} onClick={() => remove(r.id)} className="rounded-lg bg-rose-600 px-2.5 py-1.5 text-xs font-semibold text-white disabled:opacity-50">
              Confirm delete
            </button>
            <button type="button" onClick={() => setConfirming(false)} className="rounded-lg px-2 py-1.5 text-xs text-slate-600">
              Cancel
            </button>
          </>
        ) : (
          <button type="button" onClick={() => setConfirming(true)} aria-label={`Delete recording ${r.journeyId}`} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600">
            <Trash2 className="h-3.5 w-3.5" aria-hidden />
          </button>
        )}
      </div>
    </li>
  );
}

/** All recordings (admin). */
export function RecordedSessionsPanel() {
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<string | null>(null);
  const { data, isLoading, error, refetch } = useGetSessionRecordingsQuery({ page });
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  return (
    <Panel accent="journeys" title="Visual session recordings" subtitle="Screen recordings captured with rrweb — synthetic test sessions only in this phase. Administrators only.">
      {isLoading ? (
        <Skeleton className="h-24" />
      ) : notReady(error) ? (
        <CompactEmpty icon={MonitorPlay} title="Visual replay isn't set up yet." hint="Recordings become available once the session-replay tables are created and recording is enabled for testing." />
      ) : error ? (
        <div role="alert" className="flex items-center justify-between rounded-xl bg-rose-50 px-3 py-3 text-xs text-rose-700">
          <span>Couldn&apos;t load recordings.</span>
          <button type="button" onClick={() => refetch()} className="font-bold">Try again</button>
        </div>
      ) : !data || data.items.length === 0 ? (
        <CompactEmpty icon={MonitorPlay} title="No visual recordings yet." hint="Event-based journey replays above are unaffected." />
      ) : (
        <>
          <ul className="flex flex-col gap-1.5" aria-label="Visual recordings">
            {data.items.map((r) => (
              <RecordingRow key={r.id} r={r} open={open === r.id} onOpen={() => setOpen(open === r.id ? null : r.id)} />
            ))}
          </ul>
          {open ? <RecordingViewer id={open} onClose={() => setOpen(null)} /> : null}
          {totalPages > 1 ? (
            <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
              <span>
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-1">
                <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg border border-[#E5EAF2] px-2 py-1 disabled:opacity-40">Previous</button>
                <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-lg border border-[#E5EAF2] px-2 py-1 disabled:opacity-40">Next</button>
              </div>
            </div>
          ) : null}
        </>
      )}
    </Panel>
  );
}
