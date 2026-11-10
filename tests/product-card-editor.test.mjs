// tests/product-card-editor.test.mjs
//
// PHASE D: ADMIN product card editor. No live API, no database:
//   - pure editor logic (lib/product-card/editor.ts): preview per breakpoint,
//     immutable edits, validation, API error mapping, action availability;
//   - workflows with MOCKED API calls: save / publish / restore / discard /
//     reset — success, validation errors, conflicts and cache-refresh failure;
//   - the real RTK slice (features/productCardConfigApi.ts) against a mocked
//     global fetch: right URL / method / body for every endpoint, 409 / 422
//     surfaced, cache tags refetch the draft;
//   - every control's bounds in EditorControls.tsx match the shared schema;
//   - the REAL preview (PreviewPanel → SharedProductCard) reflects edits.
//   node --test tests/product-card-editor.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { register } from "node:module";

register("./support/tsx-loader.mjs", import.meta.url);

const editor = await import("../src/lib/product-card/editor.ts");
const { getDefaultProductCardConfig } = await import("../src/lib/product-card/defaults.ts");
const { productCardConfigSchema } = await import("../src/lib/product-card/config.ts");

const cfg = () => getDefaultProductCardConfig();
const rtkError = (status, data) => ({ status, data });

// ── preview & edits ─────────────────────────────────────────────────────────

test("previewConfigFor pins every responsive field to the chosen breakpoint, without touching the real config", () => {
  const c = cfg();
  c.image.height = { mobile: 120, tablet: 160, desktop: 200 };
  c.title.size = { mobile: 12, tablet: 14, desktop: 16 };
  const before = structuredClone(c);
  for (const bp of editor.BREAKPOINTS) {
    const p = editor.previewConfigFor(c, bp);
    for (const path of editor.RESPONSIVE_PATHS) {
      const r = editor.getIn(p, path);
      const expected = editor.getIn(c, path)[bp];
      assert.deepEqual(r, { mobile: expected, tablet: expected, desktop: expected }, `${path} @ ${bp}`);
    }
    assert.ok(productCardConfigSchema.safeParse(p).success, "preview config stays valid");
  }
  assert.deepEqual(c, before, "original config unchanged");
  assert.equal(editor.RESPONSIVE_PATHS.length, 6, "all responsive schema fields are covered");
});

test("setIn edits one known field immutably and refuses unknown paths (no new keys can be injected)", () => {
  const c = cfg();
  const n = editor.setIn(c, "card.radius", 16);
  assert.equal(n.card.radius, 16);
  assert.equal(c.card.radius, 10);
  assert.notEqual(n, c);
  assert.equal(editor.setIn(c, "image.height.mobile", 140).image.height.mobile, 140);
  assert.throws(() => editor.setIn(c, "card.className", "fixed inset-0"), /Unknown product card setting/);
  assert.throws(() => editor.setIn(c, "customCss", "body{}"), /Unknown/);
  assert.throws(() => editor.setIn(c, "show.wishlist", true), /Unknown/);
  assert.ok(editor.sameConfig({ a: 1, b: { c: 2 } }, { b: { c: 2 }, a: 1 }));
  assert.ok(!editor.sameConfig(c, n));
});

test("validateConfig uses the shared schema: field errors by path; Add to Cart and CSS injection rejected", () => {
  assert.ok(editor.validateConfig(cfg()).ok);
  let c = editor.setIn(cfg(), "card.radius", 30);
  let v = editor.validateConfig(c);
  assert.equal(v.ok, false);
  assert.ok(v.fieldErrors["card.radius"]);
  c = editor.setIn(cfg(), "image.height.tablet", 1.5);
  assert.ok(editor.validateConfig(c).fieldErrors["image.height.tablet"]);
  c = editor.setIn(cfg(), "addToCart.label", "<b>Buy</b>");
  assert.ok(editor.validateConfig(c).fieldErrors["addToCart.label"]);
  c = editor.setIn(cfg(), "title.color", "#fff;position:fixed");
  assert.ok(editor.validateConfig(c).fieldErrors["title.color"]);
  assert.deepEqual(editor.issuesToFieldErrors([{ path: "price.size.mobile", message: "Too big" }, { path: ["card", "radius"], message: "x" }, null]), {
    "price.size.mobile": "Too big",
    "card.radius": "x",
  });
});

test("describeApiError maps 401 / 403 / 409 / 422 / 404 / network / 500 to clear messages", () => {
  const d = editor.describeApiError;
  assert.equal(d(rtkError(401, { error: "jwt expired" })).kind, "auth");
  assert.equal(d(rtkError(403, { error: "Forbidden" })).kind, "forbidden");
  assert.equal(d(rtkError(409, { code: "DRAFT_CONFLICT", error: "x" })).kind, "conflict");
  assert.equal(d(rtkError(409, { code: "NO_DRAFT", error: "x" })).kind, "noDraft");
  assert.equal(d(rtkError(404, { code: "NO_PREVIOUS", error: "x" })).kind, "noPrevious");
  const v = d(rtkError(422, { code: "INVALID_CONFIG", error: "card.radius: too big", issues: [{ path: "card.radius", message: "too big" }] }));
  assert.equal(v.kind, "validation");
  assert.deepEqual(v.fieldErrors, { "card.radius": "too big" });
  assert.equal(d({ status: "FETCH_ERROR", error: "TypeError: Failed to fetch" }).kind, "network");
  const s = d(rtkError(500, { error: "Failed to publish product card design" }));
  assert.equal(s.kind, "server");
  assert.match(s.message, /Failed to publish/);
  assert.equal(d(undefined).kind, "network");
});

test("blockedReason: publish needs a saved, locally unchanged draft that differs from live", () => {
  const base = { dirty: false, hasFieldErrors: false, busy: false, draftUpdatedAt: "2026-10-10T00:00:00.000Z", hasUnpublishedChanges: true, previousAvailable: false };
  assert.equal(editor.blockedReason("publish", base), null);
  assert.match(editor.blockedReason("publish", { ...base, dirty: true }), /Save your changes first/);
  assert.match(editor.blockedReason("publish", { ...base, draftUpdatedAt: null }), /Save a draft first/);
  assert.match(editor.blockedReason("publish", { ...base, hasUnpublishedChanges: false }), /already the published/);
  assert.match(editor.blockedReason("save", base), /No unsaved/);
  assert.equal(editor.blockedReason("save", { ...base, dirty: true }), null);
  assert.match(editor.blockedReason("save", { ...base, dirty: true, hasFieldErrors: true }), /Fix/);
  assert.match(editor.blockedReason("restore", base), /no previously/);
  assert.equal(editor.blockedReason("restore", { ...base, previousAvailable: true }), null);
  assert.match(editor.blockedReason("discard", { ...base, draftUpdatedAt: null }), /no saved draft/);
  assert.match(editor.blockedReason("publish", { ...base, busy: true }), /wait/);
});

// ── workflows with mocked API calls ─────────────────────────────────────────

test("save: invalid configs never reach the API; success, server 422 (field errors) and 409 conflict are reported", async () => {
  const calls = [];
  const bad = editor.setIn(cfg(), "card.radius", 99);
  let out = await editor.saveDraftWorkflow(async (b) => { calls.push(b); return { data: {} }; }, bad, null);
  assert.equal(out.ok, false);
  assert.equal(out.error.code, "CLIENT_VALIDATION");
  assert.ok(out.error.fieldErrors["card.radius"]);
  assert.equal(calls.length, 0, "no request for an invalid config");

  const good = editor.setIn(cfg(), "card.radius", 12);
  out = await editor.saveDraftWorkflow(async (b) => { calls.push(b); return { data: { config: b.config, updatedAt: "2026-10-10T10:00:00.000Z" } }; }, good, "2026-10-10T09:00:00.000Z");
  assert.equal(out.ok, true);
  assert.equal(out.tone, "success");
  assert.match(out.message, /not live until you publish/);
  assert.deepEqual(calls[0], { config: good, expectedUpdatedAt: "2026-10-10T09:00:00.000Z" }, "sends the version it loaded");

  out = await editor.saveDraftWorkflow(async () => { throw rtkError(422, { code: "INVALID_CONFIG", error: "x", issues: [{ path: "title.lines", message: "max 3" }] }); }, good, null);
  assert.equal(out.error.kind, "validation");
  assert.deepEqual(out.error.fieldErrors, { "title.lines": "max 3" });

  out = await editor.saveDraftWorkflow(async () => { throw rtkError(409, { code: "DRAFT_CONFLICT", error: "x" }); }, good, null);
  assert.equal(out.error.kind, "conflict");
});

test("publish: success only after a 2xx; cache refresh runs only after success; refresh failure is a distinct warning", async () => {
  const order = [];
  const okPublish = async (body) => { order.push(["publish", body]); return { data: { unchanged: false, config: cfg() } }; };

  let out = await editor.publishWorkflow(okPublish, async () => { order.push(["refresh"]); return true; }, "2026-10-10T10:00:00.000Z");
  assert.equal(out.ok, true);
  assert.equal(out.tone, "success");
  assert.match(out.message, /^Published successfully/);
  assert.deepEqual(order, [["publish", { expectedDraftUpdatedAt: "2026-10-10T10:00:00.000Z" }], ["refresh"]], "refresh after the publish response");

  out = await editor.publishWorkflow(okPublish, async () => false, "t");
  assert.equal(out.ok, true);
  assert.equal(out.tone, "warning");
  assert.match(out.message, /^Published, but the storefront cache refresh failed/);

  out = await editor.publishWorkflow(okPublish, async () => { throw new Error("network down"); }, "t");
  assert.equal(out.tone, "warning", "a throwing refresh is still 'published, cache failed'");

  let refreshed = 0;
  out = await editor.publishWorkflow(async () => ({ data: { unchanged: true } }), async () => { refreshed++; return true; }, "t");
  assert.equal(out.tone, "info");
  assert.match(out.message, /nothing was published/);
  assert.equal(refreshed, 0, "no refresh when nothing changed");

  for (const [err, kind] of [
    [rtkError(409, { code: "DRAFT_CONFLICT" }), "conflict"],
    [rtkError(409, { code: "NO_DRAFT" }), "noDraft"],
    [rtkError(422, { code: "INVALID_DRAFT", issues: [] }), "validation"],
    [rtkError(403, {}), "forbidden"],
    [rtkError(401, {}), "auth"],
    [rtkError(500, {}), "server"],
  ]) {
    refreshed = 0;
    out = await editor.publishWorkflow(async () => { throw err; }, async () => { refreshed++; return true; }, "t");
    assert.equal(out.ok, false);
    assert.equal(out.error.kind, kind);
    assert.equal(refreshed, 0, `no cache refresh after a failed publish (${kind})`);
  }
});

test("restore / discard / reset: same success-before-refresh rule; errors mapped", async () => {
  let refreshed = 0;
  let out = await editor.restoreWorkflow(async () => ({ data: { reversible: true } }), async () => { refreshed++; return true; });
  assert.equal(out.tone, "success");
  assert.equal(refreshed, 1);
  out = await editor.restoreWorkflow(async () => ({ data: {} }), async () => false);
  assert.equal(out.tone, "warning");
  assert.match(out.message, /cache refresh failed/);
  refreshed = 0;
  out = await editor.restoreWorkflow(async () => { throw rtkError(404, { code: "NO_PREVIOUS" }); }, async () => { refreshed++; return true; });
  assert.equal(out.error.kind, "noPrevious");
  assert.equal(refreshed, 0);

  out = await editor.draftActionWorkflow(async () => ({ data: { config: cfg(), updatedAt: "x" } }), "Draft discarded.");
  assert.equal(out.ok, true);
  out = await editor.draftActionWorkflow(async () => { throw rtkError(403, {}); }, "x");
  assert.equal(out.error.kind, "forbidden");
});

// ── the real RTK slice against a mocked fetch ───────────────────────────────

test("RTK slice: each endpoint hits the right URL / method / body; 409 and 422 surface; mutations refetch the draft", async () => {
  const { configureStore } = await import("@reduxjs/toolkit");
  const { productCardConfigApi } = await import("../src/features/productCardConfigApi.ts");
  const requests = [];
  const queue = [];
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    const req = input instanceof Request ? input : new Request(input, init);
    const body = req.method === "GET" ? null : await req.text();
    requests.push({ method: req.method, url: req.url, body: body ? JSON.parse(body) : null, auth: req.headers.get("authorization") });
    const [status, json] = queue.shift() ?? [200, { success: true, data: {} }];
    return new Response(JSON.stringify(json), { status, headers: { "Content-Type": "application/json" } });
  };
  try {
    const store = configureStore({
      reducer: {
        auth: (s = { accessToken: "test-admin-token" }) => s,
        [productCardConfigApi.reducerPath]: productCardConfigApi.reducer,
      },
      middleware: (gDM) => gDM({ serializableCheck: false }).concat(productCardConfigApi.middleware),
    });
    const draft = { config: cfg(), source: "draft", meta: { draftUpdatedAt: "2026-10-10T10:00:00.000Z", publishedUpdatedAt: null, previousAvailable: false, hasUnpublishedChanges: true, storedDraftInvalid: false, storedPublishedInvalid: false } };
    const e = productCardConfigApi.endpoints;
    const run = (thunk) => store.dispatch(thunk).unwrap();

    queue.push([200, { success: true, data: draft }]);
    const sub = store.dispatch(e.getProductCardDraft.initiate());
    assert.deepEqual((await sub.unwrap()).data, draft);

    queue.push([200, { success: true, data: { config: cfg(), updatedAt: "2026-10-10T11:00:00.000Z" } }], [200, { success: true, data: draft }]);
    await run(e.saveProductCardDraft.initiate({ config: cfg(), expectedUpdatedAt: "2026-10-10T10:00:00.000Z" }));

    queue.push([409, { success: false, code: "DRAFT_CONFLICT", error: "changed" }]);
    await assert.rejects(run(e.publishProductCard.initiate({ expectedDraftUpdatedAt: "2026-10-10T10:00:00.000Z" })), (err) => {
      assert.equal(editor.describeApiError(err).kind, "conflict");
      return true;
    });
    queue.push([422, { success: false, code: "INVALID_CONFIG", error: "bad", issues: [{ path: "card.radius", message: "bad" }] }]);
    await assert.rejects(run(e.saveProductCardDraft.initiate({ config: cfg(), expectedUpdatedAt: null })), (err) => {
      assert.deepEqual(editor.describeApiError(err).fieldErrors, { "card.radius": "bad" });
      return true;
    });
    await run(e.discardProductCardDraft.initiate());
    await run(e.resetProductCardDraft.initiate());
    await run(e.restorePreviousProductCard.initiate());
    await new Promise((r) => setTimeout(r, 20)); // let tag-driven refetches settle
    sub.unsubscribe();

    const sig = requests.map((r) => `${r.method} ${new URL(r.url).pathname}`);
    assert.deepEqual(sig.filter((s) => !s.startsWith("GET")), [
      "PUT /api/themes/product-card/draft",
      "POST /api/themes/product-card/publish",
      "PUT /api/themes/product-card/draft",
      "POST /api/themes/product-card/draft/discard",
      "POST /api/themes/product-card/draft/reset-defaults",
      "POST /api/themes/product-card/restore-previous",
    ]);
    assert.ok(sig.filter((s) => s === "GET /api/themes/product-card/draft").length >= 2, "successful mutations refetch the draft");
    assert.ok(!sig.some((s) => s === "GET /api/themes/product-card"), "the editor never uses the public published endpoint");
    assert.deepEqual(requests.find((r) => r.url.endsWith("/publish")).body, { expectedDraftUpdatedAt: "2026-10-10T10:00:00.000Z" });
    assert.deepEqual(requests[1].body, { config: cfg(), expectedUpdatedAt: "2026-10-10T10:00:00.000Z" });
    assert.ok(requests.every((r) => r.auth === "Bearer test-admin-token"), "admin bearer token on every request");
    assert.ok(requests.every((r) => new URL(r.url).host === "localhost:5000"), "only the backend API is called");
  } finally {
    globalThis.fetch = realFetch;
  }
});

// ── controls ↔ schema ───────────────────────────────────────────────────────

test("every numeric control's min/max equals the schema bounds; every edited path exists in the schema", async () => {
  const { defaultListingGrid } = await import("../src/lib/product-card/grid.ts");
  // A config with the optional blocks present, so their paths can be probed.
  const full = () => ({ ...cfg(), grid: defaultListingGrid(), addToCart: { ...cfg().addToCart, label: "Add to Cart" } });
  const src = readFileSync(new URL("../src/components/admin/product-card-editor/EditorControls.tsx", import.meta.url), "utf8");
  const numeric = [...src.matchAll(/<NumberField[^>]*?path="([^"]+)"[^>]*?min=\{(\d+)\}[^>]*?max=\{(\d+)\}([^>]*?)\/?>/gs)];
  assert.equal(numeric.length, (src.match(/<NumberField\s/g) ?? []).length, "every NumberField was parsed");
  assert.equal(numeric.length, 14, "14 numeric settings are editable (incl. button radius and grid gaps; title.lines is not — titles are one line)");
  for (const [, path, minS, maxS, rest] of numeric) {
    const [min, max] = [Number(minS), Number(maxS)];
    const responsive = /responsive=/.test(rest);
    const fullPath = responsive ? `${path}.mobile` : path;
    const at = (v) => productCardConfigSchema.safeParse(editor.setIn(full(), fullPath, v)).success;
    assert.ok(at(min) && at(max), `${fullPath}: ${min}..${max} accepted`);
    assert.ok(!at(min - 1) && !at(max + 1), `${fullPath}: outside ${min}..${max} rejected`);
  }
  const paths = [...src.matchAll(/\bpath="([^"]+)"/g)].map((m) => m[1]);
  for (const p of paths) {
    const probe = editor.getIn(full(), p);
    assert.notEqual(probe, undefined, `${p} exists in the schema`);
  }
  for (const forbidden of ["preset", "schemaVersion", "className", "css", "wishlist", "quickView", "lines"]) {
    assert.ok(!paths.some((p) => p.split(".").includes(forbidden)), `no control for ${forbidden}`);
  }
  // Every show.* field has a toggle (Add to Cart included).
  const toggles = new Set([...src.matchAll(/<Toggle[^>]*?path="show\.([a-zA-Z]+)"/g)].map((m) => m[1]));
  for (const k of Object.keys(cfg().show)) assert.ok(toggles.has(k), `toggle for show.${k}`);
  // Grid column choices are exactly the schema's allowed sets.
  for (const [bp, lo, hi] of [["mobile", 1, 2], ["tablet", 2, 4], ["desktop", 3, 6]]) {
    const block = src.match(new RegExp(`${bp}: \\[([^\\]]+)\\]`))[1];
    const values = [...block.matchAll(/value: (\d+)/g)].map((m) => Number(m[1]));
    assert.deepEqual(values, Array.from({ length: hi - lo + 1 }, (_, i) => lo + i), `${bp} column choices`);
  }
});

// ── the real preview ────────────────────────────────────────────────────────

test("preview renders the REAL shared card for the sample products and follows edits per breakpoint", async () => {
  const { createElement } = await import("react");
  const { renderToStaticMarkup } = await import("react-dom/server");
  const { PreviewPanel } = await import("../src/components/admin/product-card-editor/PreviewPanel.tsx");
  const render = (config, breakpoint) => renderToStaticMarkup(createElement(PreviewPanel, { config, breakpoint }));

  const c = cfg();
  c.image.height = { mobile: 120, tablet: 170, desktop: 220 };
  c.card.radius = 18;
  c.title.weight = "bold";
  const mobile = render(c, "mobile");
  const desktop = render(c, "desktop");

  assert.ok((mobile.match(/data-fm-card=/g) ?? []).length >= 5, "real cards for every sample");
  assert.match(mobile, /data-fm-card-preview="mobile"/);
  assert.match(mobile, /--fmc-img-h-d:120px/, "mobile preview pins desktop CSS to the mobile value");
  assert.match(desktop, /--fmc-img-h-m:220px/, "desktop preview pins mobile CSS to the desktop value");
  assert.match(mobile, /--fmc-radius:18px/);
  assert.match(mobile, /--fmc-title-weight:700/);
  assert.match(mobile, /width:375px/, "mobile frame = listing grid width at a 375px screen");
  assert.match(desktop, /width:935px/, "desktop frame = listing grid width at a 1440px screen");
  assert.match(desktop, /data-fm-grid=""/, "the real listing grid component");

  // Discount (sample 1 & 3), rating (sample 1 & 2), no-image (sample 3), store / verified.
  assert.match(desktop, /-11%/);
  assert.match(desktop, /-17%/);
  assert.match(desktop, /Rated 4\.5 out of 5/);
  assert.match(desktop, /No Image/);
  assert.match(desktop, /FinixMart Store/);
  assert.match(desktop, /src="\/products\/2-75\.webp"/);

  const hidden = editor.setIn(editor.setIn(editor.setIn(cfg(), "show.discountBadge", false), "show.rating", false), "show.storeName", false);
  const h = render(hidden, "desktop");
  assert.doesNotMatch(h, /-11%/);
  assert.doesNotMatch(h, /Rated 4\.5/);
  assert.doesNotMatch(h, /FinixMart Store/);
  assert.match(h, /No Image/);
});
