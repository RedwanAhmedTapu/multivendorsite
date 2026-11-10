// tests/demo-adapter.test.mjs
// Stage C: the demo adapter must serve fixtures only behind the double gate, must
// never fall through to the network, and must miss (404) rather than borrow real data.
import { test } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";

register("./support/tsx-loader.mjs", import.meta.url);
const A = await import("../src/lib/analytics/replay/demo-adapter.ts");
const D = await import("../src/lib/analytics/replay/demo-replay.ts");
const G = await import("../src/lib/analytics/replay/demo-gate.ts");

const opted = { getItem: (k) => (k === G.DEMO_OPT_IN_KEY ? "1" : null) };
const notOpted = { getItem: () => null };

test("adapter: gate off routes all three paths to the real implementation", () => {
  assert.deepEqual(A.resolveList(false), { demo: false });
  assert.deepEqual(A.resolveDetail(false, "DEMO-0001"), { demo: false });
  assert.deepEqual(A.resolveChunk(false, "DEMO-0001", 0), { demo: false });
});

test("adapter: real gate object drives it — both switches required", () => {
  const offEnv = G.demoModeEnabled(undefined, opted);
  const offStorage = G.demoModeEnabled("1", notOpted);
  const on = G.demoModeEnabled("1", opted);
  assert.equal(offEnv, false);
  assert.equal(offStorage, false);
  assert.equal(on, true);
  assert.deepEqual(A.resolveList(offEnv), { demo: false });
  assert.deepEqual(A.resolveList(offStorage), { demo: false });
  assert.equal(A.resolveList(on).demo, true);
});

test("adapter: list serves the fixture list with the API envelope", () => {
  const r = A.resolveList(true);
  assert.equal(r.demo, true);
  assert.equal(r.found, true);
  assert.deepEqual(A.demoEnvelope(r.data), { success: true, data: D.demoList() });
  assert.equal(r.data.items.length, 3);
  assert.equal(r.data.total, 3);
});

test("adapter: detail matches the list entry and refuses unknown ids without falling through", () => {
  const list = A.resolveList(true).data;
  const detail = A.resolveDetail(true, "DEMO-0002");
  assert.equal(detail.demo, true);
  assert.equal(detail.found, true);
  const summary = list.items.find((i) => i.id === "DEMO-0002");
  for (const k of ["journeyId", "startedAt", "chunkCount", "eventCount", "bytes", "pageCount", "durationMs"]) {
    assert.equal(detail.data[k], summary[k], `${k} must agree between list and detail`);
  }
  const miss = A.resolveDetail(true, "DEMO-9999");
  assert.deepEqual(miss, { demo: true, found: false }, "unknown id is a miss, never {demo:false}");
  assert.deepEqual(A.resolveDetail(true, ""), { demo: true, found: false });
});

test("adapter: chunk bodies agree with detail metadata and validate id + seq", () => {
  const detail = A.resolveDetail(true, "DEMO-0001").data;
  for (const meta of detail.chunks) {
    const got = A.resolveChunk(true, "DEMO-0001", meta.seq);
    assert.equal(got.demo, true);
    assert.equal(got.found, true);
    const events = JSON.parse(got.body);
    assert.equal(events.length, meta.eventCount, "seq " + meta.seq + " event count matches metadata");
    assert.equal(got.body.length, meta.bytes, "seq " + meta.seq + " byte length matches metadata");
  }
  assert.deepEqual(A.resolveChunk(true, "DEMO-0001", 99), { demo: true, found: false });
  assert.deepEqual(A.resolveChunk(true, "DEMO-9999", 0), { demo: true, found: false });
  assert.deepEqual(A.resolveChunk(true, "DEMO-0001", "abc"), { demo: true, found: false });
  assert.deepEqual(A.resolveChunk(true, "DEMO-0001", -1), { demo: true, found: false });
});

test("adapter: a failed real request cannot be turned into fixtures", () => {
  // The adapter is only consulted before a request. With the gate off it always
  // answers { demo: false }, so there is no code path that maps an error to data.
  for (const fn of [() => A.resolveList(false), () => A.resolveDetail(false, "DEMO-0001"), () => A.resolveChunk(false, "DEMO-0001", 0)]) {
    assert.deepEqual(fn(), { demo: false });
  }
  assert.equal(typeof A.demoEnvelope, "function");
});

test("adapter: fixture ids are recognisable and disjoint from real ids", () => {
  assert.equal(A.isDemoRecordingId("DEMO-0001"), true);
  assert.equal(A.isDemoRecordingId("clx0realrecord"), false);
});
test("adapter: the list honours ?journey= like the real API — a real journey gets no demo recordings", () => {
  const one = A.resolveList(true, "J-DEMO0002");
  assert.deepEqual(one.data.items.map((i) => i.id), ["DEMO-0002"]);
  assert.equal(one.data.total, 1);
  assert.deepEqual(A.resolveList(true, "j-demo0003").data.items.map((i) => i.id), ["DEMO-0003"], "case-insensitive like the server");
  const real = A.resolveList(true, "J-0A1B2C3D");
  assert.equal(real.demo, true, "still answered by the demo — never a fall-through to the network");
  assert.deepEqual(real.data.items, []);
  assert.equal(real.data.total, 0);
  assert.equal(A.resolveList(true, undefined).data.items.length, 3, "no filter → every demo session");
  assert.deepEqual(A.resolveList(false, "J-DEMO0002"), { demo: false });
});
