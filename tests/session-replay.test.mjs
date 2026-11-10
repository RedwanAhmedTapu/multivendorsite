// tests/session-replay.test.mjs
//
// Visual session replay — storefront recorder (no backend, no network).
//   1. config: off by default (no "on" mode), synthetic opt-in, excluded
//      pages mirror the server's list exactly;
//   2. ReplaySession with a fake rrweb recorder + stubbed fetch: start /
//      resume, batched gzip uploads in order, bounded queue, overload stop,
//      bounded retries, restart on journey rotation, refusal, oversize
//      batches, and the synchronous stop before navigating to an excluded
//      page (history.pushState / popstate) with resume afterwards;
//   3. the REAL @rrweb/record in jsdom: inputs masked with a fixed
//      placeholder, password / payment fields and data-replay-block regions
//      not captured, data-replay-mask text masked;
//   4. SessionReplayBoot renders nothing when recording is off.
//   node --test tests/session-replay.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { register, createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";

register("./support/tsx-loader.mjs", import.meta.url);
const require = createRequire(import.meta.url);
let JSDOM = null;
try {
  ({ JSDOM } = require("jsdom"));
} catch {
  JSDOM = null;
}
const skip = JSDOM ? false : "jsdom is not installed";

const CFG = await import("../src/lib/analytics/replay/replay-config.ts");
const { ReplaySession, gzipText } = await import("../src/lib/analytics/replay/replay-session.ts");

// ── 1. config ───────────────────────────────────────────────────────────
test("config: recording is off unless the build says 'synthetic' — there is no 'on' mode", () => {
  assert.equal(CFG.replayClientMode(undefined), "off");
  assert.equal(CFG.replayClientMode(""), "off");
  assert.equal(CFG.replayClientMode("on"), "off");
  assert.equal(CFG.replayClientMode("true"), "off");
  assert.equal(CFG.replayClientMode("synthetic"), "synthetic");
  assert.equal(CFG.isSyntheticBrowser(), false, "no window → never a test browser");
});

test("config: excluded pages match the server list exactly; checkout / payment / auth / account / dashboards / chat are excluded", () => {
  const server = readFileSync(new URL("../../multivendorbackend/src/modules/analytics/session-replay.contract.ts", import.meta.url), "utf8");
  const block = server.slice(server.indexOf("REPLAY_EXCLUDED_PATH_PREFIXES = ["), server.indexOf("] as const", server.indexOf("REPLAY_EXCLUDED_PATH_PREFIXES = [")));
  const serverList = [...block.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual([...CFG.REPLAY_EXCLUDED_PATH_PREFIXES], serverList);
  for (const p of ["/checkout", "/payment/failed", "/payment-option", "/login", "/register", "/reset-password", "/user-dashboard/profile", "/vendor-dashboard/x", "/admin-dashboard", "/track/1", "/chat", null, ""]) assert.ok(CFG.isExcludedPath(p), String(p));
  for (const p of ["/", "/products/a", "/category/x", "/cart", "/store/y", "/wishlist"]) assert.ok(!CFG.isExcludedPath(p), p);
});

test("config: record options mask every input with a fixed placeholder and block sensitive fields; heavy capture is off", () => {
  const o = CFG.REPLAY_RECORD_OPTIONS;
  assert.equal(o.maskAllInputs, true);
  assert.equal(o.maskInputFn("my secret password"), "•••", "no length leak");
  for (const s of ["input[type=password]", "[autocomplete^='cc-']", "[data-replay-block]", "iframe"]) assert.ok(o.blockSelector.includes(s), s);
  assert.equal(o.recordCanvas, false);
  assert.equal(o.collectFonts, false);
  assert.equal(o.inlineImages, false);
  assert.equal(o.recordCrossOriginIframes, false);
  assert.ok(o.sampling.mousemove >= 50 && o.sampling.scroll >= 100 && o.sampling.input === "last");
});

// ── 2. ReplaySession ────────────────────────────────────────────────────
const SESSION_ID = "sess-aaaaaaaaaaaaaaaa";
const ev = (type, ts, data = {}) => ({ type, timestamp: ts, data });
function harness({ idle = (fn) => setTimeout(fn, 0), start = () => [201, { success: true, enabled: true, recordingId: "rec0000000001", token: "tok-abcdefghijklmnopqrstuvwx" }], chunk = () => [202, { success: true }], limits = {}, win, path, sessionId = () => SESSION_ID, storage } = {}) {
  const calls = [];
  const timers = [];
  const store = storage ?? new Map();
  let recorder = null;
  const recordCalls = [];
  const fakeRecord = (opts) => {
    const r = { opts, stopped: 0, stoppedAt: [], emit: opts.emit };
    recordCalls.push(r);
    recorder = r;
    opts.emit(ev(4, Date.now(), { href: "http://localhost:3000" + (path ? path() : "/products/p1") }));
    opts.emit(ev(2, Date.now() + 1, { node: { id: 1 } }));
    return () => {
      r.stopped++;
      r.stoppedAt.push(path ? path() : null);
    };
  };
  // like rrweb's record.takeFullSnapshot: a Meta (page URL) event + a full snapshot from the live recorder
  const fullSnapshots = [];
  fakeRecord.takeFullSnapshot = (isCheckout) => {
    fullSnapshots.push({ isCheckout, path: path ? path() : "/products/p1" });
    recorder.emit(ev(4, Date.now(), { href: "http://localhost:3000" + (path ? path() : "/products/p1") }));
    recorder.emit(ev(2, Date.now() + 1, { node: { id: 1 } }));
  };
  const fetch = async (url, init) => {
    const u = new URL(url);
    const entry = { path: u.pathname, seq: u.searchParams.get("seq"), method: init.method, headers: init.headers, keepalive: init.keepalive };
    if (u.pathname.endsWith("/start")) {
      entry.body = JSON.parse(init.body);
      calls.push(entry);
      const [s, b] = start(entry);
      return new Response(JSON.stringify(b), { status: s });
    }
    entry.events = JSON.parse(gunzipSync(Buffer.from(init.body)).toString("utf8"));
    calls.push(entry);
    const [s, b] = chunk(entry);
    return new Response(JSON.stringify(b), { status: s });
  };
  const states = [];
  const session = new ReplaySession({
    apiBase: "http://api.test/api",
    loadRecord: async () => fakeRecord,
    fetch,
    compress: gzipText,
    headers: () => ({ "x-fm-analytics-session": SESSION_ID }),
    sessionId,
    storage: { get: (k) => store.get(k) ?? null, set: (k, v) => store.set(k, v), remove: (k) => store.delete(k) },
    path: path ?? (() => "/products/p1"),
    schedule: (fn, ms) => (ms === 0 ? setTimeout(fn, 0) : (timers.push({ fn, ms }), timers.length)),
    cancel: () => undefined,
    idle,
    win,
    limits: { retryBaseMs: 0, ...limits },
    onState: (s, r) => states.push(r ? `${s}:${r}` : s),
  });
  const tick = () => new Promise((r) => setTimeout(r, 5));
  const settle = async (n = 6) => {
    for (let i = 0; i < n; i++) await tick();
  };
  return { session, calls, timers, store, states, settle, recordCalls, fullSnapshots, get recorder() { return recorder; }, uploads: () => calls.filter((c) => c.path.endsWith("/chunks")) };
}

test("session: starts on an allowed page, records with the privacy options, uploads gzip batches in order and persists for a reload", async () => {
  const h = harness();
  await h.session.start();
  assert.equal(h.session.state, "recording");
  assert.deepEqual(h.calls[0].body, { synthetic: true, path: "/products/p1" });
  assert.equal(h.recordCalls[0].opts.maskAllInputs, true);
  for (let i = 0; i < 10; i++) h.recorder.emit(ev(3, Date.now() + 10 + i, { source: 2 }));
  await h.session.flush(false);
  let up = h.uploads();
  assert.equal(up.length, 1);
  assert.equal(up[0].seq, "0");
  assert.equal(up[0].headers["x-fm-replay-token"], "tok-abcdefghijklmnopqrstuvwx");
  assert.equal(up[0].headers["content-type"], "application/octet-stream");
  assert.deepEqual(up[0].events.map((e) => e.type), [4, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3]);
  h.recorder.emit(ev(3, Date.now() + 50, { source: 3 }));
  await h.session.flush(false);
  up = h.uploads();
  assert.equal(up[1].seq, "1", "sequential, in order");
  assert.deepEqual(JSON.parse(h.store.get("fm_replay")), { recordingId: "rec0000000001", token: "tok-abcdefghijklmnopqrstuvwx", seq: 2, sessionId: SESSION_ID });
  // nothing buffered → no request
  await h.session.flush(false);
  assert.equal(h.uploads().length, 2);
  assert.equal(h.timers[0].ms, CFG.REPLAY_CLIENT_LIMITS.flushIntervalMs, "periodic flush armed");
  h.session.stop("disposed");

  // full reload in the same journey → resumes the same recording (no new /start), with a fresh full snapshot
  const h2 = harness({ storage: h.store });
  await h2.session.start();
  assert.equal(h2.calls.filter((c) => c.path.endsWith("/start")).length, 0);
  await h2.session.flush(false);
  assert.equal(h2.uploads()[0].seq, "2");
  assert.equal(h2.uploads()[0].events[1].type, 2, "new page load starts with a full snapshot");
  h2.session.stop("disposed");

  // a different journey → new recording
  const h3 = harness({ storage: h.store, sessionId: () => "sess-bbbbbbbbbbbbbbbb" });
  await h3.session.start();
  assert.equal(h3.calls.filter((c) => c.path.endsWith("/start")).length, 1);
  h3.session.stop("disposed");
});

test("session: server says disabled / excluded start page → nothing is loaded or recorded", async () => {
  const off = harness({ start: () => [202, { success: true, enabled: false }] });
  await off.session.start();
  assert.equal(off.session.state, "stopped");
  assert.equal(off.session.stopReason, "server_disabled");
  assert.equal(off.recordCalls.length, 0, "rrweb never started");
  const down = harness({ start: () => [500, { error: "x" }] });
  await down.session.start();
  assert.equal(down.session.stopReason, "server_disabled");
  const ex = harness({ path: () => "/checkout" });
  await ex.session.start();
  assert.equal(ex.session.state, "paused");
  assert.equal(ex.calls.length, 0, "no request at all on an excluded page");
  ex.session.stop("disposed");
});

test("session: a full batch flushes early; the queue is bounded — reaching it stops recording instead of growing", async () => {
  const h = harness({ limits: { maxBatchEvents: 5 } });
  await h.session.start();
  for (let i = 0; i < 4; i++) h.recorder.emit(ev(3, Date.now() + i));
  await h.settle();
  assert.ok(h.uploads().length >= 1, "flushed without waiting for the 10 s timer once the batch reached 5 events");
  assert.deepEqual(h.uploads().map((u) => u.events.length), [5, 1], "batches of at most 5, drained in order");
  h.session.stop("disposed");

  // no flush happens before the cap (batch size larger than the cap) → the cap stops recording
  const q = harness({ limits: { maxQueueEvents: 50, maxBatchEvents: 1000 } });
  await q.session.start();
  for (let i = 0; i < 100; i++) q.recorder.emit(ev(3, Date.now() + i));
  assert.equal(q.session.state, "stopped");
  assert.equal(q.session.stopReason, "queue_full");
  assert.equal(q.recorder.stopped, 1, "rrweb listeners removed");
  await q.settle();
  assert.equal(q.uploads().length, 0, "the discarded buffer is never sent");
});

test("session: an excessively busy page (events per minute) stops recording", async () => {
  const h = harness({ limits: { maxEventsPerMinute: 30, maxBatchEvents: 1000 } });
  await h.session.start();
  for (let i = 0; i < 40; i++) h.recorder.emit(ev(3, Date.now() + i));
  assert.equal(h.session.stopReason, "overload");
  assert.equal(h.recorder.stopped, 1);
});

test("session: failed uploads retry a bounded number of times, then recording stops (shopping unaffected)", async () => {
  let n = 0;
  const h = harness({ chunk: () => (n++, [503, { error: "down" }]), limits: { maxRetries: 2 } });
  await h.session.start();
  await h.session.flush(false);
  assert.equal(n, 3, "1 try + 2 retries");
  assert.equal(h.session.stopReason, "upload_failed");
  assert.equal(h.store.get("fm_replay"), undefined, "forgotten");
  let m = 0;
  const net = harness({ chunk: () => (m++, (() => { throw new TypeError("network"); })()), limits: { maxRetries: 1 } });
  await net.session.start();
  await net.session.flush(false);
  assert.equal(m, 2);
  assert.equal(net.session.stopReason, "upload_failed");
});

test("session: refusal (4xx) stops; journey rotation (restart) starts a new recording with a fresh snapshot", async () => {
  const refused = harness({ chunk: () => [403, { success: false, stop: true }] });
  await refused.session.start();
  await refused.session.flush(false);
  assert.equal(refused.session.stopReason, "refused");

  let first = true;
  let starts = 0;
  const h = harness({
    start: () => [201, { success: true, enabled: true, recordingId: `rec000000000${++starts}`, token: "tok-abcdefghijklmnopqrstuvwx" }],
    chunk: () => (first ? ((first = false), [409, { success: false, restart: true }]) : [202, {}]),
  });
  await h.session.start();
  await h.session.flush(false);
  await h.settle();
  assert.equal(starts, 2, "a new recording for the new journey");
  assert.equal(h.recordCalls.length, 2, "rrweb restarted → new full snapshot");
  assert.equal(h.session.state, "recording");
  await h.session.flush(false);
  const last = h.uploads().at(-1);
  assert.ok(last.path.includes("rec0000000002"));
  assert.equal(last.seq, "0");
  h.session.stop("disposed");
});

test("session: oversize batches are split; a single event that can never fit stops recording", async () => {
  const h = harness({ limits: { maxBatchChars: 400, maxBatchEvents: 1000 } });
  await h.session.start();
  for (let i = 0; i < 12; i++) h.recorder.emit(ev(3, Date.now() + i, { source: 2, pad: "x".repeat(20) }));
  await h.session.flush(false);
  const up = h.uploads();
  assert.ok(up.length > 1, "split into several uploads");
  assert.deepEqual(up.map((u) => u.seq), up.map((_, i) => String(i)));
  assert.equal(up.reduce((n, u) => n + u.events.length, 0), 14, "nothing lost");
  h.recorder.emit(ev(2, Date.now() + 99, { huge: "y".repeat(1000) }));
  await h.session.flush(false);
  assert.equal(h.session.stopReason, "too_large");
});

test("session: navigating to checkout stops recording synchronously BEFORE the URL changes; nothing from checkout is sent; recording resumes after", { skip }, async () => {
  const dom = new JSDOM("<!doctype html><body><main>product</main></body>", { url: "http://localhost:3000/products/p1" });
  const w = dom.window;
  const h = harness({ win: w, path: () => w.location.pathname });
  await h.session.start();
  assert.equal(h.session.state, "recording");
  h.recorder.emit(ev(3, Date.now() + 5));
  const r = h.recorder;
  const realPush = Object.getPrototypeOf(w.history).pushState;
  w.history.pushState({}, "", "/checkout");
  assert.deepEqual(r.stoppedAt, ["/products/p1"], "rrweb was stopped inside pushState, while the URL was still the product page");
  assert.equal(w.location.pathname, "/checkout");
  assert.equal(h.session.state, "paused");
  // anything emitted now (e.g. late mutation callbacks) is dropped
  r.emit(ev(3, Date.now() + 6, { checkoutDom: true }));
  await h.settle();
  const sent = h.uploads().flatMap((u) => u.events);
  assert.ok(!JSON.stringify(sent).includes("checkoutDom"));
  // back to an allowed page → resumes (new rrweb start → fresh full snapshot)
  w.history.pushState({}, "", "/category/shoes");
  h.session.onRoute("/category/shoes");
  await h.settle();
  assert.equal(h.recordCalls.length, 2);
  assert.equal(h.session.state, "recording");
  // browser back into an excluded page (popstate) also stops
  w.history.pushState({}, "", "/payment/success");
  assert.equal(h.session.state, "paused");
  h.session.stop("disposed");
  assert.equal(w.history.pushState, realPush, "history restored on stop");
});

test("session: staff sign-in or unmount — staff discards the buffer; unmount flushes it with keepalive", async () => {
  const h = harness();
  await h.session.start();
  h.recorder.emit(ev(3, Date.now() + 3));
  h.session.stop("staff");
  await h.settle();
  assert.equal(h.uploads().length, 0);
  const u = harness();
  await u.session.start();
  u.recorder.emit(ev(3, Date.now() + 3));
  u.session.stop("disposed");
  await u.settle();
  assert.equal(u.uploads().length, 1);
  assert.equal(u.uploads()[0].keepalive, true);
});

// ── 3. real rrweb masking ───────────────────────────────────────────────
test("real rrweb (jsdom): typed values are masked, password / card / blocked regions are not captured, marked text is masked", { skip }, async () => {
  const dom = new JSDOM(
    `<!doctype html><html><head></head><body>
      <h1>Cotton Saree</h1>
      <input id="email" type="email" value="shopper@example.com">
      <input id="phone" type="tel" value="01711000000">
      <input id="pw" type="password" value="hunter2-password">
      <input id="cc" autocomplete="cc-number" value="4111111111111111">
      <p data-replay-mask>Hello Rayhan Customer</p>
      <section data-replay-block><span>Delivery to House 12, Road 7, Dhanmondi</span></section>
      <textarea id="note">leave at the gate, flat 3B</textarea>
    </body></html>`,
    { url: "http://localhost:3000/products/p1", pretendToBeVisual: true }
  );
  const g = globalThis;
  const saved = {};
  const set = (k, v) => {
    saved[k] = Object.getOwnPropertyDescriptor(g, k);
    Object.defineProperty(g, k, { value: v, configurable: true, writable: true });
  };
  for (const k of ["window", "document", "Node", "Element", "HTMLElement", "MutationObserver", "HTMLInputElement", "HTMLTextAreaElement", "HTMLSelectElement", "CSSStyleSheet", "CSSRule", "Event", "location", "requestAnimationFrame", "cancelAnimationFrame", "getComputedStyle", "HTMLIFrameElement", "HTMLCanvasElement", "HTMLFormElement", "HTMLMediaElement", "ShadowRoot", "DocumentFragment", "Text"]) set(k, k === "window" ? dom.window : dom.window[k]);
  const events = [];
  let stop = null;
  try {
    const { record } = await import("@rrweb/record");
    stop = record({ ...CFG.REPLAY_RECORD_OPTIONS, emit: (e) => events.push(e) });
    const d = dom.window.document;
    const type = (el, value) => {
      el.value = value;
      el.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
    };
    type(d.getElementById("email"), "changed@example.com");
    type(d.getElementById("note"), "my private address");
    type(d.getElementById("pw"), "another-password");
    const p = d.createElement("p");
    p.textContent = "Added later";
    d.body.appendChild(p);
    await new Promise((r) => setTimeout(r, 50));
  } finally {
    stop?.();
    for (const [k, v] of Object.entries(saved)) if (v) Object.defineProperty(g, k, v); else delete g[k];
  }
  const json = JSON.stringify(events);
  assert.ok(events.some((e) => e.type === 2), "a full snapshot was captured");
  assert.ok(json.includes("Cotton Saree"), "ordinary page text is captured (so the replay is useful)");
  assert.ok(json.includes("Added later"), "DOM mutations are captured");
  for (const secret of ["shopper@example.com", "changed@example.com", "01711000000", "hunter2-password", "another-password", "4111111111111111", "Rayhan", "Dhanmondi", "flat 3B", "my private address"]) {
    assert.ok(!json.includes(secret), `"${secret}" must not be captured`);
  }
});

// ── 4. boot ─────────────────────────────────────────────────────────────
test("boot: with recording off (default build) the component renders nothing", async () => {
  const mod = await import("../src/components/analytics/SessionReplayBoot.tsx");
  assert.equal(mod.default(), null);
});

test("session: checkout → cart resumes recording promptly even when the page never gets an idle period; nothing from checkout is sent", { skip }, async () => {
  const dom = new JSDOM("<!doctype html><body>cart</body>", { url: "http://localhost:3000/cart" });
  const w = dom.window;
  // idle callbacks never fire (a busy page / background tab) — resume must not depend on them
  const h = harness({ win: w, path: () => w.location.pathname, idle: () => undefined });
  await h.session.start();
  assert.equal(h.session.state, "recording");
  w.history.pushState({}, "", "/checkout");
  assert.equal(h.session.state, "paused", "stopped before the checkout page rendered");
  h.recorder.emit(ev(3, Date.now() + 1, { checkoutDom: true }));
  w.history.pushState({}, "", "/cart");
  h.session.onRoute("/cart"); // SessionReplayBoot's usePathname effect
  await h.settle(2);
  assert.equal(h.session.state, "recording", "resumed on the next task, without waiting for idle");
  assert.equal(h.recordCalls.length, 2, "a fresh rrweb start → new full snapshot of the cart page");
  assert.equal(h.calls.filter((c) => c.path.endsWith("/start")).length, 1, "same recording continues — no duplicate recording session");
  h.recorder.emit(ev(3, Date.now() + 2, { source: 2 }));
  await h.session.flush(false);
  const sent = h.uploads().flatMap((u) => u.events);
  assert.ok(!JSON.stringify(sent).includes("checkoutDom"));
  assert.deepEqual(h.uploads().map((u) => u.seq), h.uploads().map((_, i) => String(i)), "sequence continues across the gap");
  h.session.stop("disposed");
});

test("privacy: excluded sections are named only by kind; the test-account hint accepts only the reserved test.invalid domain", () => {
  assert.equal(CFG.excludedSection("/checkout?addr=House%2012"), "checkout");
  assert.equal(CFG.excludedSection("/payment/success"), "checkout");
  assert.equal(CFG.excludedSection("/login"), "sign-in");
  assert.equal(CFG.excludedSection("/user-dashboard/orders/1"), "account");
  assert.equal(CFG.excludedSection("/admin-dashboard"), "dashboard");
  assert.equal(CFG.excludedSection("/chat"), "chat");
  assert.equal(CFG.excludedSection("/somewhere"), "other");
  assert.equal(CFG.isSyntheticTestEmail("shopper1@test.invalid"), true);
  for (const e of ["shopper1@testXinvalid", "shopper1@test.invalid.evil.com", "real@gmail.com", "", null]) assert.equal(CFG.isSyntheticTestEmail(e), false, String(e));
});

test("privacy: every place the navbar renders the signed-in identity is masked for replay", () => {
  const src = readFileSync(new URL("../src/components/publicnavbar/Navbar.tsx", import.meta.url), "utf8");
  const uses = src.split("{getUserDisplayName()}").length - 1;
  assert.ok(uses >= 2);
  const masked = [...src.matchAll(/<span data-replay-mask[^>]*>\{getUserDisplayName\(\)\}<\/span>/g)].length;
  assert.equal(masked, uses, "each identity span carries data-replay-mask");
  assert.ok(CFG.REPLAY_RECORD_OPTIONS.maskTextSelector.includes("[data-replay-mask]"));
});

test("session: entering checkout leaves a section-only 'not recorded' marker — no path, query or page content", { skip }, async () => {
  const dom = new JSDOM("<!doctype html><body>cart</body>", { url: "http://localhost:3000/cart" });
  const w = dom.window;
  const h = harness({ win: w, path: () => w.location.pathname });
  await h.session.start();
  w.history.pushState({}, "", "/checkout?address=House%2012");
  await h.session.flush(false);
  const markers = h.uploads().flatMap((u) => u.events).filter((e) => e.type === 5);
  assert.deepEqual(markers.map((m) => m.data), [{ tag: CFG.EXCLUDED_MARKER_TAG, payload: { section: "checkout" } }]);
  assert.ok(!JSON.stringify(h.uploads()).includes("House"), "nothing from the checkout URL");
  h.session.stop("disposed");
});

test("session: client-side navigation to another allowed page records a page marker (Meta) so the replay's page label follows", { skip }, async () => {
  const dom = new JSDOM("<!doctype html><body>products</body>", { url: "http://localhost:3000/products" });
  const w = dom.window;
  const h = harness({ win: w, path: () => w.location.pathname });
  await h.session.start();
  w.history.pushState({}, "", "/cart");
  h.session.onRoute("/cart"); // SessionReplayBoot's usePathname effect
  assert.deepEqual(h.fullSnapshots, [{ isCheckout: true, path: "/cart" }], "one fresh snapshot for the new page");
  h.session.onRoute("/cart"); // same page again (re-render / query change) → no extra snapshot
  w.history.pushState({}, "", "/cart?step=1");
  h.session.onRoute("/cart");
  assert.equal(h.fullSnapshots.length, 1);
  w.history.pushState({}, "", "/products");
  h.session.onRoute("/products"); // back
  assert.equal(h.fullSnapshots.length, 2);
  assert.equal(h.recordCalls.length, 1, "same rrweb session — no restart for allowed → allowed navigation");
  await h.session.flush(false);
  const metas = h.uploads().flatMap((u) => u.events).filter((e) => e.type === 4).map((e) => new URL(e.data.href).pathname);
  assert.deepEqual(metas, ["/products", "/cart", "/products"], "every page the shopper saw is marked, in order");
  h.session.stop("disposed");
});

test("session: an upload never carries more than 3 full snapshots (server limit 4), even after quick navigation", { skip }, async () => {
  const dom = new JSDOM("<!doctype html><body>x</body>", { url: "http://localhost:3000/products" });
  const w = dom.window;
  const h = harness({ win: w, path: () => w.location.pathname, limits: { maxBatchEvents: 1000 } });
  await h.session.start();
  for (const p of ["/category/a", "/category/b", "/cart", "/category/c", "/products"]) {
    w.history.pushState({}, "", p);
    h.session.onRoute(p);
  }
  await h.session.flush(false);
  const perUpload = h.uploads().map((u) => u.events.filter((e) => e.type === 2).length);
  assert.ok(perUpload.length >= 2, "split into several uploads");
  assert.ok(perUpload.every((n) => n <= 3), JSON.stringify(perUpload));
  assert.equal(perUpload.reduce((a, b) => a + b, 0), 6, "no snapshot lost (initial + 5 pages)");
  h.session.stop("disposed");
});
