// tests/demo-replay.test.mjs
// Fixture shape for the opt-in replay demo mode. No network, no database.
//   node --test tests/demo-replay.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";

register("./support/tsx-loader.mjs", import.meta.url);
const D = await import("../src/lib/analytics/replay/demo-replay.ts");

test("demo: three fictional sessions with DEMO-* ids and .invalid-free, invented paths", () => {
  assert.equal(D.DEMO_SESSIONS.length, 3);
  for (const s of D.DEMO_SESSIONS) {
    assert.match(s.id, /^DEMO-000[1-3]$/);
    assert.match(s.journeyId, /^J-DEMO\d{4}$/);
    assert.ok(s.pages.length >= 2 && s.pages.length <= 3, "2–3 pages per session");
    assert.equal(s.chunks.length, s.pages.length);
  }
});

test("demo: list + detail shapes match the API contracts the UI consumes", () => {
  const list = D.demoList();
  assert.equal(list.total, 3);
  assert.deepEqual(Object.keys(list).sort(), ["items", "page", "pageSize", "total"]);
  const first = list.items[0];
  for (const k of ["id", "journeyId", "synthetic", "status", "stopReason", "entryPath", "startedAt", "firstEventAt", "lastEventAt", "durationMs", "pageCount", "chunkCount", "eventCount", "bytes", "expiresAt"]) {
    assert.ok(k in first, `summary is missing ${k}`);
  }
  assert.equal(first.synthetic, true);
  assert.equal(first.status, "COMPLETE");
  const detail = D.demoDetail("DEMO-0001");
  assert.ok(detail && Array.isArray(detail.chunks));
  for (const c of detail.chunks) {
    assert.deepEqual(Object.keys(c).sort(), ["bytes", "eventCount", "firstEventAt", "lastEventAt", "seq"]);
    assert.ok(!("events" in c), "chunk metadata must not embed the body");
  }
  assert.equal(D.demoDetail("DEMO-9999"), undefined);
});

test("demo: chunk bodies are the rrweb event arrays the player parses, with the required event types", () => {
  const body = D.demoChunkBody("DEMO-0001", 0);
  assert.equal(typeof body, "string");
  const events = JSON.parse(body);
  assert.ok(Array.isArray(events) && events.length > 0);
  const types = events.map((e) => e.type);
  assert.equal(types[0], 4, "a chunk starts with Meta");
  assert.ok(types.includes(2), "FullSnapshot present");
  assert.ok(events.some((e) => e.type === 3 && e.data?.source === 1), "mousemove present");
  assert.ok(events.some((e) => e.type === 3 && e.data?.source === 2), "click present");
  assert.ok(events.some((e) => e.type === 3 && e.data?.source === 3), "scroll present");
  // rrweb's recorder emits Meta.href = window.location.href (absolute); the player derives the page from new URL(href)
  assert.equal(new URL(events[0].data.href).origin, D.DEMO_ORIGIN, "Meta carries an absolute URL on the fictional demo origin");
  assert.equal(new URL(events[0].data.href).pathname, "/");
  for (let i = 1; i < events.length; i++) assert.ok(events[i].timestamp >= events[i - 1].timestamp, "timestamps are monotonic");
  assert.equal(D.demoChunkBody("DEMO-0001", 99), undefined);
});

test("demo: pages advance across chunks so navigation is replayable", () => {
  const s = D.DEMO_SESSIONS[0];
  const hrefs = s.chunks.map((c) => new URL(c.events[0].data.href).pathname);
  assert.deepEqual(hrefs, s.pages);
  assert.notEqual(hrefs[0], hrefs[1]);
});