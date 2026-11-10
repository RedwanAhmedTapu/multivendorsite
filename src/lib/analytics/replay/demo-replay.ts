// lib/analytics/replay/demo-replay.ts
//
// Entirely fictional sessions for exercising the existing replay UI without a
// database, a chunk store or any recording. Nothing here is captured from a
// person: the ids are DEMO-*, the journeys are J-DEMO…, and every event is
// generated below. Demo data is served ONLY by the explicit demo gate
// (lib/analytics/replay/demo-gate.ts) — never as a fallback for a failed
// request. Types mirror features/businessAdvisorApi.ts exactly.

export type DemoEvent = { type: number; timestamp: number; data?: any };

export type DemoChunk = { seq: number; bytes: number; eventCount: number; firstEventAt: string; lastEventAt: string; events: DemoEvent[] };

export type DemoSession = {
  id: string;
  journeyId: string;
  entryPath: string;
  startedAt: string;
  pages: string[];
  chunks: DemoChunk[];
};

const T0 = Date.parse("2026-03-02T10:00:00.000Z");

// rrweb's recorder emits Meta.href as window.location.href (absolute), so the
// fixture does too — on a fictional, non-routable origin.
export const DEMO_ORIGIN = "https://demo.finixmart.invalid";
const meta = (t: number, path: string): DemoEvent => ({ type: 4, timestamp: t, data: { href: DEMO_ORIGIN + path, width: 1280, height: 800 } });

const fullSnapshot = (t: number, heading: string): DemoEvent => ({
  type: 2,
  timestamp: t,
  data: {
    node: {
      type: 0,
      id: 1,
      childNodes: [
        {
          type: 2,
          tagName: "html",
          attributes: { lang: "en" },
          id: 2,
          childNodes: [
            {
              type: 2,
              tagName: "body",
              attributes: {},
              id: 3,
              childNodes: [{ type: 3, id: 4, textContent: heading }],
            },
          ],
        },
      ],
    },
  },
});

const move = (t: number, x: number, y: number): DemoEvent => ({ type: 3, timestamp: t, data: { source: 1, positions: [{ x, y, id: 3, timeOffset: 0 }] } });
const click = (t: number, x: number, y: number): DemoEvent => ({ type: 3, timestamp: t, data: { source: 2, type: 2, id: 3, x, y } });
const scroll = (t: number, y: number): DemoEvent => ({ type: 3, timestamp: t, data: { source: 3, id: 3, x: 0, y } });

function chunk(seq: number, start: number, events: DemoEvent[]): DemoChunk {
  const body = JSON.stringify(events);
  return {
    seq,
    bytes: Buffer.byteLength(body, "utf8"),
    eventCount: events.length,
    firstEventAt: new Date(events[0].timestamp).toISOString(),
    lastEventAt: new Date(events[events.length - 1].timestamp).toISOString(),
    events,
  };
}

function session(id: string, journeyId: string, startOffsetMin: number, pages: [string, number][]): DemoSession {
  const startedAt = new Date(T0 + startOffsetMin * 60_000).toISOString();
  const chunks = pages.map(([href, offset], i) => {
    const t = T0 + startOffsetMin * 60_000 + offset;
    return chunk(i, t, [
      meta(t, href),
      fullSnapshot(t + 20, `Demo page ${href}`),
      move(t + 300, 120 + i * 40, 240),
      move(t + 520, 180 + i * 40, 260),
      click(t + 700, 200, 300),
      scroll(t + 900, 420),
      move(t + 1100, 210, 330),
    ]);
  });
  return { id, journeyId, entryPath: pages[0][0], startedAt, pages: pages.map((p) => p[0]), chunks };
}

export const DEMO_SESSIONS: DemoSession[] = [
  session("DEMO-0001", "J-DEMO0001", 0, [["/", 0], ["/products", 60_000], ["/product/demo-headphones", 120_000]]),
  session("DEMO-0002", "J-DEMO0002", 7, [["/products", 0], ["/product/demo-mug", 45_000]]),
  session("DEMO-0003", "J-DEMO0003", 15, [["/", 0], ["/products", 30_000], ["/cart", 75_000]]),
];

export function demoSessionById(id: string): DemoSession | undefined {
  return DEMO_SESSIONS.find((s) => s.id === id);
}

/** Summary/list shape — mirrors SessionRecordingSummary. */
export function demoSummary(s: DemoSession) {
  const first = s.chunks[0].events[0].timestamp;
  const last = s.chunks[s.chunks.length - 1].events.at(-1)!.timestamp;
  return {
    id: s.id,
    journeyId: s.journeyId,
    synthetic: true,
    status: "COMPLETE" as const,
    stopReason: null,
    entryPath: s.entryPath,
    startedAt: s.startedAt,
    firstEventAt: new Date(first).toISOString(),
    lastEventAt: new Date(last).toISOString(),
    durationMs: last - first,
    pageCount: s.pages.length,
    chunkCount: s.chunks.length,
    eventCount: s.chunks.reduce((n, c) => n + c.eventCount, 0),
    bytes: s.chunks.reduce((n, c) => n + c.bytes, 0),
    expiresAt: new Date(T0 + 30 * 86_400_000).toISOString(),
  };
}

export function demoList() {
  const items = DEMO_SESSIONS.map(demoSummary);
  return { items, total: items.length, page: 1, pageSize: items.length };
}

export function demoDetail(id: string) {
  const s = demoSessionById(id);
  if (!s) return undefined;
  return { ...demoSummary(s), chunks: s.chunks.map(({ events, ...rest }) => rest) };
}

/** Chunk body exactly as the player parses it: a JSON array of rrweb events. */
export function demoChunkBody(id: string, seq: number): string | undefined {
  const s = demoSessionById(id);
  const c = s?.chunks.find((x) => x.seq === seq);
  return c ? JSON.stringify(c.events) : undefined;
}