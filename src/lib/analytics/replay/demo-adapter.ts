// lib/analytics/replay/demo-adapter.ts
//
// The single decision point for demo mode. Pure, synchronous, no React, no fetch:
// call sites ask "should this request be answered from fixtures?" and get either
// fixture data or a plain { demo: false } meaning "use the real path, unchanged".
//
// Rules encoded here:
//   * gate off  -> { demo: false } for every path; the caller performs the real
//     request with its original URL, headers, envelope and error handling.
//   * gate on   -> { demo: true, ... } and the caller MUST NOT fall through to the
//     network, even when the fixture lookup misses. A miss is a 404, never a real
//     request: demo data may not mask a live failure, and a live request may not
//     fill a demo gap.
//   * chunk ids/seqs are validated against the fixture; unknown values miss.

import { demoChunkBody, demoDetail, demoList, DEMO_SESSIONS } from "./demo-replay";

export type DemoMiss = { demo: true; found: false };
export type DemoHit<T> = { demo: true; found: true; data: T };
export type DemoOff = { demo: false };

/** `journey` mirrors the real list's ?journey= filter: only that journey's recordings (none for a non-demo journey). */
export function resolveList(gate: boolean, journey?: string): DemoOff | DemoHit<ReturnType<typeof demoList>> {
  if (!gate) return { demo: false };
  const all = demoList();
  if (!journey) return { demo: true, found: true, data: all };
  const items = all.items.filter((r) => r.journeyId === String(journey).trim().toUpperCase());
  return { demo: true, found: true, data: { ...all, items, total: items.length } };
}

export function resolveDetail(gate: boolean, id: string): DemoOff | DemoHit<NonNullable<ReturnType<typeof demoDetail>>> | DemoMiss {
  if (!gate) return { demo: false };
  const data = demoDetail(String(id ?? ""));
  return data ? { demo: true, found: true, data } : { demo: true, found: false };
}

export type DemoChunkHit = { demo: true; found: true; body: string; seq: number };

export function resolveChunk(gate: boolean, id: string, seq: unknown): DemoOff | DemoChunkHit | DemoMiss {
  if (!gate) return { demo: false };
  const n = Number(seq);
  if (!Number.isInteger(n) || n < 0) return { demo: true, found: false };
  const body = demoChunkBody(String(id ?? ""), n);
  return body === undefined ? { demo: true, found: false } : { demo: true, found: true, body, seq: n };
}

/** The real API's envelope, reused verbatim for demo responses. */
export function demoEnvelope<T>(data: T): { success: true; data: T } {
  return { success: true, data };
}

/** True when a recording id belongs to the fixture set (used to keep lists consistent). */
export function isDemoRecordingId(id: string): boolean {
  return DEMO_SESSIONS.some((s) => s.id === id);
}