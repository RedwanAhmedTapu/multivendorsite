// tests/vendor-performance-ui.test.mjs
//
// Vendor-performance page (jsdom, real RTK Query store, stubbed backend):
//   • scoreboard KPIs + table render from the snapshot API
//   • a grade card filters server-side (grade=NOT_ENOUGH_DATA) and search is
//     debounced into the request
//   • the drawer shows why the grade was given, localised checklist text,
//     per-metric "Collecting data"/"Not tracked" states, and a dry run posts
//     dryRun=true
//   • the expiry dialog PATCHes the same date twice without error (idempotent)
//   node --test tests/vendor-performance-ui.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { register, createRequire } from "node:module";
import { format } from "node:util";

register("./support/tsx-loader.mjs", import.meta.url);
const require = createRequire(import.meta.url);
let JSDOM = null;
try {
  ({ JSDOM } = require("jsdom"));
} catch {
  JSDOM = null;
}
const skip = JSDOM ? false : "jsdom is not installed";

/* ─── fixtures ──────────────────────────────────────────────────────────── */

const DAY = "2026-11-14T00:00:00.000Z";
const PREV_DAY = "2026-11-13T00:00:00.000Z";
const CREATED = "2026-10-01T09:00:00.000Z";

const METRICS = {
  orderCount: 24,
  acceptRate: 91.2,
  medianAcceptMinutes: null,
  onTimeDispatchRate: null,
  avgDispatchDelayHours: 3.4,
  vendorCancelRate: null,
  vendorFaultCancelRate: 4.2,
  qualifiedProductCount: 6,
  avgCompletenessPct: 61.5,
  grossRevenue: 120000,
  revenueGrowthPct: -3.4,
  repeatBuyerRate: 12,
  avgRating: 4.3,
  returnRate: null,
  refundRate: null,
  kycValidWeightPct: 90,
  kycStatus: "EXPIRING_SOON",
  lastLoginAt: "2026-11-01T00:00:00.000Z",
  activeDays30: 18,
};

const ALPHA = {
  vendorId: "vend-1",
  day: DAY,
  periodDays: 30,
  configVersion: "phase2-v1+score-v1",
  vendor: { id: "vend-1", storeName: "Alpha Store", avatar: null, status: "ACTIVE", vatRegistered: true },
  previous: { day: PREV_DAY, overallScore: 70.1, grade: "B" },
  metrics: METRICS,
  score: {
    overallScore: 72.4,
    grade: "B",
    coveragePct: 78,
    groupScores: { order: 70.5, compliance: 90 },
    flags: [],
  },
  sampleSizes: {
    received: 24,
    acceptDenominator: 22,
    acceptMinutes: 22,
    dispatchComparable: 20,
    reviews: 9,
    delivered: 18,
    buyers: 14,
    products: 12,
    loginDays: 18,
  },
  checklist: [
    {
      code: "METRIC_onTimeDispatchRate",
      message: {
        en: "Only 80% of orders are dispatched on time (target 95%+).",
        bn: "শুধু ৮০% অর্ডার সময়মতো dispatch হয়েছে (লক্ষ্য ৯৫%+)।",
      },
      impact: 6.5,
    },
  ],
};

const BETA = {
  vendorId: "vend-2",
  day: DAY,
  periodDays: 30,
  configVersion: "phase2-v1+score-v1",
  vendor: { id: "vend-2", storeName: "Beta Mart", avatar: null, status: "ACTIVE", vatRegistered: false },
  previous: null,
  metrics: {
    ...METRICS,
    orderCount: 4,
    acceptRate: null,
    vendorFaultCancelRate: null,
    avgRating: null,
    qualifiedProductCount: null,
    kycStatus: null,
  },
  score: {
    overallScore: null,
    grade: "NOT_ENOUGH_DATA",
    coveragePct: 12.5,
    groupScores: { order: null, compliance: null },
    flags: [{ code: "CATALOG_INCOMPLETE", severity: "warning", message: "Only 0 of 10 required products are complete.", value: 0 }],
  },
  sampleSizes: { received: 4, products: 0 },
  checklist: [],
};

const CONFIG = {
  version: "score-v1",
  notEnoughDataCoveragePct: 40,
  atRiskScoreCap: 49,
  catalogFlagMinProducts: 10,
  gradeBands: [
    { grade: "A", min: 85 },
    { grade: "B", min: 70 },
    { grade: "C", min: 50 },
    { grade: "D", min: 0 },
  ],
  groups: [
    {
      key: "order",
      label: "Order",
      weight: 30,
      metrics: [
        { key: "acceptRate", weight: 40, scale: "linear", at100: 95, at0: 70 },
        { key: "medianAcceptMinutes", weight: 20, scale: "linear", at100: 30, at0: 240 },
        { key: "onTimeDispatchRate", weight: 30, scale: "linear", at100: 95, at0: 70 },
        { key: "vendorFaultCancelRate", weight: 10, scale: "linear", at100: 1, at0: 10 },
      ],
    },
    {
      key: "compliance",
      label: "Compliance",
      weight: 15,
      metrics: [{ key: "kycValidWeightPct", weight: 100, scale: "identity" }],
    },
  ],
};

const DISTRIBUTION = {
  day: DAY,
  total: 2,
  averageScore: 72.4,
  scoredVendors: 1,
  needsAttention: 1,
  grades: [
    { grade: "B", count: 1 },
    { grade: "NOT_ENOUGH_DATA", count: 1 },
  ],
  coverage: {
    buckets: [
      { min: 0, max: 20, count: 1 },
      { min: 20, max: 40, count: 0 },
      { min: 40, max: 60, count: 0 },
      { min: 60, max: 80, count: 1 },
      { min: 80, max: 100, count: 0 },
    ],
    unknown: 0,
  },
  groupAverages: { order: { average: 70.5, sampleSize: 1 }, compliance: { average: 90, sampleSize: 1 } },
};

const HISTORY = {
  vendorId: "vend-1",
  days: [
    { day: PREV_DAY, overallScore: 70.1, grade: "B", coveragePct: 75, configVersion: "phase2-v1+score-v1", orderCount: 21, acceptRate: 90, onTimeDispatchRate: 78, vendorFaultCancelRate: 5, grossRevenue: 110000 },
    { day: DAY, overallScore: 72.4, grade: "B", coveragePct: 78, configVersion: "phase2-v1+score-v1", orderCount: 24, acceptRate: 91.2, onTimeDispatchRate: 80, vendorFaultCancelRate: 4.2, grossRevenue: 120000 },
  ],
};

const CATALOG = {
  vendorId: "vend-1",
  summary: { total: 2, qualified: 1, averageCompletenessPct: 61.5, minImages: 3, minDescriptionChars: 100 },
  items: [
    { id: "p1", name: "Weak Lamp", completenessScore: 40, qualified: false, issues: [{ code: "IMAGES", actual: 1, target: 3 }, { code: "DESCRIPTION", actual: 20, target: 100 }] },
    { id: "p2", name: "Good Chair", completenessScore: 88, qualified: true, issues: [] },
  ],
};

const KYC = {
  vendorId: "vend-1",
  evaluatedAt: DAY,
  graceDays: 7,
  restrictedAt: null,
  headline: "EXPIRING_SOON",
  validWeightPct: 90,
  restricted: false,
  documents: [
    {
      id: "doc-1",
      type: "TRADE_LICENSE",
      label: "Trade license",
      status: "APPROVED",
      state: "EXPIRING_SOON",
      requiresExpiry: true,
      expiresAt: "2026-11-20T00:00:00.000Z",
      createdAt: CREATED,
      daysLeft: 6,
      graceDaysLeft: 13,
      notices: [{ window: 15, notifiedAt: "2026-11-10T00:00:00.000Z" }],
    },
  ],
};

const EXPIRY_ITEMS = {
  page: 1,
  limit: 20,
  total: 1,
  totalPages: 1,
  items: [
    {
      vendor: { id: "vend-2", storeName: "Beta Mart", status: "ACTIVE" },
      document: {
        id: "doc-9",
        type: "TRADE_LICENSE",
        typeLabel: "Trade license",
        status: "EXPIRY_UNKNOWN",
        filePath: "https://cdn.example.com/tl.pdf",
        createdAt: CREATED,
        verifiedAt: CREATED,
      },
    },
  ],
};

/* ─── harness ───────────────────────────────────────────────────────────── */

async function withDom(route, fn) {
  const dom = new JSDOM("<!doctype html><html><body><div id=root></div></body></html>", {
    url: "http://localhost:3000/admin-dashboard/vendormanage/performance",
    pretendToBeVisual: true,
  });
  const g = globalThis;
  const saved = {};
  const setGlobal = (k, v) => {
    saved[k] = Object.getOwnPropertyDescriptor(g, k);
    Object.defineProperty(g, k, { value: v, configurable: true, writable: true });
  };
  for (const k of [
    "window", "document", "navigator", "HTMLElement", "Node", "Element", "MutationObserver",
    "getComputedStyle", "Event", "CustomEvent", "MouseEvent", "KeyboardEvent", "FocusEvent",
    "PointerEvent", "NodeFilter", "localStorage", "sessionStorage",
  ]) {
    setGlobal(k, k === "window" ? dom.window : dom.window[k]);
  }
  setGlobal("requestAnimationFrame", (cb) => setTimeout(cb, 0));
  setGlobal("cancelAnimationFrame", clearTimeout);
  setGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
  for (const k of Object.getOwnPropertyNames(dom.window)) {
    if (/^(HTML|SVG)\w*Element$|^(DocumentFragment|ShadowRoot|Text|Range|Selection|DOMRect)$/.test(k) && !(k in saved)) {
      setGlobal(k, dom.window[k]);
    }
  }
  g.IS_REACT_ACT_ENVIRONMENT = true;
  const errors = [];
  const realError = console.error;
  console.error = (...a) => errors.push(format(...a));
  const realFetch = g.fetch;
  const calls = [];
  g.fetch = async (input, init) => {
    const req = input instanceof Request ? input : new Request(input, init);
    const url = new URL(req.url);
    const body = req.method === "GET" ? null : await req.text().then((t) => (t ? JSON.parse(t) : null));
    calls.push({ method: req.method, path: url.pathname, query: Object.fromEntries(url.searchParams), body });
    const res = await route(req.method, url, body);
    if (res) return Response.json(res[1], { status: res[0] });
    return Response.json({ success: false, message: `unexpected ${req.method} ${url.pathname}` }, { status: 404 });
  };

  const React = await import("react");
  const { act } = React;
  const { createRoot } = await import("react-dom/client");
  const { Provider } = await import("react-redux");
  const { configureStore } = await import("@reduxjs/toolkit");
  const { vendorManageApi } = await import("../src/features/vendorManageApi.ts");
  await import("../src/features/vendorPerformanceApi.ts");
  const { apiSlice } = await import("../src/features/apiSlice.ts");
  const authReducer = (await import("../src/features/authSlice.ts")).default;
  const store = configureStore({
    reducer: {
      auth: authReducer,
      [vendorManageApi.reducerPath]: vendorManageApi.reducer,
      [apiSlice.reducerPath]: apiSlice.reducer,
    },
    middleware: (gd) => gd({ serializableCheck: false, immutableCheck: false }).concat(vendorManageApi.middleware, apiSlice.middleware),
  });

  let root;
  const run = async (f) => {
    try {
      await act(f);
    } catch (err) {
      for (const e of err?.errors ?? [err]) errors.push(String(e?.stack ?? e?.message ?? e));
    }
  };
  const settle = async (n = 8) => {
    for (let i = 0; i < n; i++) await run(() => new Promise((r) => setTimeout(r, 30)));
  };
  const doc = dom.window.document;
  const ui = {
    doc,
    calls,
    errors,
    settle,
    wait: async (ms) => run(() => new Promise((r) => setTimeout(r, ms))),
    text: () => doc.body.textContent,
    byLabel: (l) => doc.querySelector(`[aria-label="${l}"]`),
    button: (label) => [...doc.querySelectorAll("button")].find((b) => b.textContent.trim().startsWith(label)),
    buttonExact: (label) => [...doc.querySelectorAll("button")].find((b) => b.textContent.trim() === label),
    click: async (el) => {
      assert.ok(el, "element to click exists");
      // Radix Tabs activate on mousedown (not click), so replay the real
      // sequence instead of dispatching a synthetic click alone.
      await run(async () => {
        el.dispatchEvent(new dom.window.MouseEvent("mousedown", { bubbles: true, button: 0 }));
        el.dispatchEvent(new dom.window.MouseEvent("mouseup", { bubbles: true, button: 0 }));
        el.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true, button: 0 }));
      });
      await settle();
    },
    type: async (el, value) => {
      assert.ok(el, "input exists");
      await run(async () => {
        Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, "value").set.call(el, value);
        el.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
      });
      await settle();
    },
    render: async (element) => {
      root = createRoot(doc.getElementById("root"));
      await run(async () => root.render(React.createElement(Provider, { store }, element)));
      await settle(12);
    },
    listCalls: () => calls.filter((c) => c.method === "GET" && c.path === "/api/admin/vendor-performance"),
  };
  try {
    await fn(ui, React);
  } finally {
    if (root) {
      try {
        await act(async () => root.unmount());
      } catch {
        /* ignore */
      }
    }
    await new Promise((r) => setTimeout(r, 30));
    console.error = realError;
    g.fetch = realFetch;
    for (const [k, d] of Object.entries(saved)) {
      if (d) Object.defineProperty(g, k, d);
      else delete g[k];
    }
    delete g.IS_REACT_ACT_ENVIRONMENT;
    dom.window.close();
  }
}

function backend() {
  let expiryValue = null;
  return async (method, url, body) => {
    const p = url.pathname;
    if (method === "GET" && p === "/api/admin/vendor-performance") {
      const q = url.searchParams;
      const grade = q.get("grade");
      const search = (q.get("search") || "").toLowerCase();
      const items = [ALPHA, BETA].filter(
        (item) => (!grade || item.score.grade === grade) && (!search || item.vendor.storeName.toLowerCase().includes(search)),
      );
      return [200, { success: true, day: DAY, previousDay: PREV_DAY, items, page: 1, limit: 20, total: items.length, totalPages: 1 }];
    }
    if (method === "GET" && p === "/api/admin/vendor-performance/distribution") {
      return [200, { success: true, ...DISTRIBUTION }];
    }
    if (method === "GET" && p === "/api/admin/vendor-performance/config") {
      return [200, { success: true, source: "database", version: CONFIG.version, config: CONFIG, note: null, createdAt: CREATED, shadowMode: { visibleToVendors: false } }];
    }
    if (method === "GET" && p === "/api/admin/vendor-performance/vendors/vend-1/history") {
      return [200, { success: true, ...HISTORY }];
    }
    if (method === "GET" && p === "/api/admin/vendor-performance/vendors/vend-1/catalog") {
      return [200, { success: true, ...CATALOG }];
    }
    if (method === "GET" && p === "/api/admin/vendor-performance/vendors/vend-1/kyc") {
      return [200, { success: true, ...KYC }];
    }
    if (method === "GET" && p === "/api/admin/vendor-performance/vendors/vend-2/catalog") {
      return [200, { success: true, vendorId: "vend-2", summary: { total: 0, qualified: 0, averageCompletenessPct: null, minImages: 3, minDescriptionChars: 100 }, items: [] }];
    }
    if (method === "GET" && p === "/api/admin/vendor-performance/vendors/vend-2/kyc") {
      return [200, { success: true, vendorId: "vend-2", evaluatedAt: DAY, graceDays: 7, restrictedAt: null, headline: "MISSING", validWeightPct: null, restricted: false, documents: [] }];
    }
    if (method === "GET" && p === "/api/admin/vendor-performance/expiry-missing") {
      return [200, { success: true, ...EXPIRY_ITEMS }];
    }
    if (method === "POST" && p === "/api/admin/vendor-performance/run") {
      return [
        200,
        {
          success: true,
          dryRun: url.searchParams.get("dryRun") === "true",
          vendorId: "vend-1",
          day: DAY,
          snapshot: { ...ALPHA.score, orderCount: 24, qualifiedProductCount: 6, avgCompletenessPct: 61.5 },
          productCompleteness: [
            { productId: "p1", completenessScore: 40, current: 60, written: false },
            { productId: "p2", completenessScore: 88, current: 88, written: false },
          ],
        },
      ];
    }
    if (method === "PATCH" && p === "/api/admin/vendor-performance/documents/doc-9/expiry") {
      const changed = expiryValue !== body.expiresAt;
      expiryValue = body.expiresAt;
      return [200, { success: true, changed, revived: false, document: { id: "doc-9", type: "TRADE_LICENSE", expiresAt: body.expiresAt, status: "APPROVED" } }];
    }
    return null;
  };
}

async function renderPage(ui, React, Page) {
  await ui.render(React.createElement(Page));
}

/* ─── tests ─────────────────────────────────────────────────────────────── */

test("scoreboard renders KPIs, honest null score, and filters server-side", { skip }, async () => {
  await withDom(backend(), async (ui, React) => {
    const { default: Page } = await import("../src/components/vendor-performance/VendorPerformancePage.tsx");
    await renderPage(ui, React, Page);

    const text = ui.text();
    assert.match(text, /Vendor performance/);
    assert.match(text, /Average score/);
    assert.match(text, /72\.4/);
    assert.match(text, /Needs attention/);
    assert.match(text, /Shadow mode — admin only/);
    assert.match(text, /Alpha Store/);
    assert.match(text, /Beta Mart/);
    assert.match(text, /No score yet/);
    assert.match(text, /Collecting/);

    const first = ui.listCalls()[0];
    assert.equal(first.query.sort, "score_desc");
    assert.equal(first.query.page, "1");
    assert.equal(first.query.limit, "20");

    // grade card → server filter + reset to page 1
    await ui.click(ui.byLabel("Filter by grade Collecting data (1)"));
    const filtered = ui.listCalls().at(-1);
    assert.equal(filtered.query.grade, "NOT_ENOUGH_DATA");
    assert.equal(filtered.query.page, "1");

    // debounced search → request carries the trimmed term
    await ui.type(ui.byLabel("Search vendors by store name"), "  beta ");
    await ui.wait(450);
    const searched = ui.listCalls().at(-1);
    assert.equal(searched.query.search, "beta");
    assert.equal(searched.query.grade, "NOT_ENOUGH_DATA");

    assert.deepEqual(ui.errors, [], `console errors: ${ui.errors.join("\n")}`);
  });
});

test("drawer explains the grade, localises the checklist, and runs a dry run", { skip }, async () => {
  await withDom(backend(), async (ui, React) => {
    const { default: Page } = await import("../src/components/vendor-performance/VendorPerformancePage.tsx");
    await renderPage(ui, React, Page);

    await ui.click(ui.button("Alpha Store"));

    const text = ui.text();
    assert.match(text, /Why this grade/);
    assert.match(text, /B band \(70\+\)/);
    assert.match(text, /\+2\.3 vs previous/);
    assert.match(text, /Only 80% of orders are dispatched on time/);
    assert.match(text, /6\.5 pts/);

    // Detail tabs mount lazily — each one is what issues its read request.
    await ui.click(ui.buttonExact("History"));
    assert.match(ui.text(), /Score & coverage trend/);
    const paths = ui.calls.map((call) => call.path);
    assert.ok(paths.includes("/api/admin/vendor-performance/vendors/vend-1/history"));

    await ui.click(ui.buttonExact("Catalog"));
    assert.match(ui.text(), /Weak Lamp/);
    assert.ok(
      ui.calls.some((call) => call.path === "/api/admin/vendor-performance/vendors/vend-1/catalog"),
    );

    await ui.click(ui.buttonExact("KYC & compliance"));
    assert.match(ui.text(), /Trade license/);
    assert.match(ui.text(), /6 days/);
    assert.ok(
      ui.calls.some((call) => call.path === "/api/admin/vendor-performance/vendors/vend-1/kyc"),
    );

    await ui.click(ui.buttonExact("Overview"));

    // locale switch → Bangla checklist message from the API's {en, bn}
    await ui.click(ui.buttonExact("বাংলা"));
    assert.match(ui.text(), /শুধু ৮০% অর্ডার সময়মতো dispatch হয়েছে/);

    // dry run POST + rendered result lines
    await ui.click(ui.button("Dry run"));
    const runCall = ui.calls.find((call) => call.method === "POST" && call.path === "/api/admin/vendor-performance/run");
    assert.ok(runCall, "dry run request was sent");
    assert.equal(runCall.query.dryRun, "true");
    assert.equal(runCall.query.vendorId, "vend-1");
    assert.match(ui.text(), /Dry run for/);
    assert.match(ui.text(), /1 of 2 products would change/);

    // metrics tab: nulls are explicit, the two cancel metrics stay separate
    await ui.click(ui.buttonExact("Metrics"));
    const metricsText = ui.text();
    assert.match(metricsText, /Vendor-cancel rate \(self-initiated\)/);
    assert.match(metricsText, /Not tracked/);
    assert.match(metricsText, /Vendor-fault cancel rate/);
    assert.match(metricsText, /4\.2%/);
    assert.match(metricsText, /Median accept time/);
    assert.match(metricsText, /Collecting data/);
    assert.match(metricsText, /Based on 22 orders/);

    assert.deepEqual(ui.errors, [], `console errors: ${ui.errors.join("\n")}`);
  });
});

test("expiry queue saves the same date twice without error or duplicate write", { skip }, async () => {
  await withDom(backend(), async (ui, React) => {
    const { default: Page } = await import("../src/components/vendor-performance/VendorPerformancePage.tsx");
    await renderPage(ui, React, Page);

    await ui.click(ui.buttonExact("Expiry queue"));
    assert.match(ui.text(), /Beta Mart/);
    assert.match(ui.text(), /Trade license/);
    assert.match(ui.text(), /EXPIRY UNKNOWN/);

    const save = async () => {
      await ui.click(ui.button("Set expiry"));
      assert.match(ui.text(), /Record document expiry/);
      await ui.type(ui.doc.getElementById("expiry-date"), "2027-01-31");
      await ui.click(ui.buttonExact("Save expiry"));
    };

    await save();
    const patches = ui.calls.filter((call) => call.method === "PATCH");
    assert.equal(patches.length, 1);
    assert.equal(patches[0].body.expiresAt, "2027-01-31T00:00:00.000Z");
    assert.doesNotMatch(ui.text(), /Record document expiry/);

    // second identical send is idempotent: same payload, dialog closes, no error
    await save();
    const again = ui.calls.filter((call) => call.method === "PATCH");
    assert.equal(again.length, 2);
    assert.deepEqual(again[1].body, again[0].body);
    assert.doesNotMatch(ui.text(), /Could not save/);

    assert.deepEqual(ui.errors, [], `console errors: ${ui.errors.join("\n")}`);
  });
});
