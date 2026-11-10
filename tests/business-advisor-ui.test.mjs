// tests/business-advisor-ui.test.mjs
//
// Business Advisor (frontend).
//   1. pure: date presets in Asia/Dhaka, range validation, formatting that
//      never invents a value, comparison badges, outcome copy;
//   2. tracker: view dedup per product·30 min, session rotation after 30 min
//      idle, ids match the server's format, staff aren't shoppers;
//   3. runtime (jsdom, real store + RTK Query, fetch stubbed — no backend):
//      KPIs / funnel / friction / insights render from the API response;
//      filters drive the query (and the vendor dashboard never sends a
//      vendorId); product focus; products table sort + search; journey
//      replay step navigation and play; 503 / 403 / error + retry / no-data
//      states; product-view tracking fires once; analytics headers only on
//      already-preflighted requests.
//   node --test tests/business-advisor-ui.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { register, createRequire } from "node:module";
import { format } from "node:util";

register("./support/tsx-loader.mjs", import.meta.url);
const require = createRequire(import.meta.url);
const V = await import("../src/lib/analytics/advisor-view.ts");
const T = await import("../src/lib/analytics/tracker.ts");

const NOW = new Date("2026-10-20T19:00:00Z"); // 01:00 on 21 Oct in Dhaka

test("presets and ranges use Asia/Dhaka days; validation mirrors the server", () => {
  assert.equal(V.dhakaToday(NOW), "2026-10-21");
  assert.deepEqual(V.presetRange("today", NOW), { from: "2026-10-21", to: "2026-10-21" });
  assert.deepEqual(V.presetRange("7d", NOW), { from: "2026-10-15", to: "2026-10-21" });
  assert.deepEqual(V.presetRange("30d", NOW), { from: "2026-09-22", to: "2026-10-21" });
  assert.deepEqual(V.presetRange("month", NOW), { from: "2026-10-01", to: "2026-10-21" });
  assert.equal(V.daysBetween("2026-10-01", "2026-10-21"), 21);
  assert.equal(V.validateRange("2026-10-01", "2026-10-21", NOW), null);
  assert.match(V.validateRange("2026-10-22", "2026-10-01", NOW), /on or before/);
  assert.match(V.validateRange("2026-01-01", "2026-10-21", NOW), /at most 92/);
  assert.match(V.validateRange("2026-10-01", "2026-10-23", NOW), /future/);
});

test("formatting never invents a value; comparison badges only when the server sent one", () => {
  assert.equal(V.formatCount(null), "—");
  assert.equal(V.formatPct(null), "—");
  assert.equal(V.formatPct(33.333), "33.3%");
  assert.equal(V.formatMoneyMinor(123456), "৳ 1,234.56");
  assert.equal(V.changeBadge({ change: null, pointsChange: null }), null);
  assert.deepEqual(V.changeBadge({ change: 12.5, pointsChange: null }), { text: "+12.5%", direction: "up" });
  assert.deepEqual(V.changeBadge({ change: null, pointsChange: -3 }), { text: "-3 pts", direction: "down" });
  assert.equal(V.formatDuration(125), "2m 5s");
  assert.equal(V.outcomeCopy("SOMETHING_NEW").label, "Unknown outcome");
  assert.equal(V.outcomeCopy("ABANDONED_CHECKOUT").tone, "warning");
  assert.equal(V.outcomeCopy("ORDER_REFUNDED").label, "Refunded / returned", "Phase 2 audit B3");
});

test("tracker: one view per product per 30 min; sessions rotate after 30 min idle; ids match the server format; staff aren't shoppers", () => {
  const t0 = 1_000_000_000_000;
  assert.equal(T.shouldRecordView("P1", t0), true);
  assert.equal(T.shouldRecordView("P1", t0 + 1000), false, "re-render / Strict Mode");
  assert.equal(T.shouldRecordView("P2", t0 + 1000), true);
  assert.equal(T.shouldRecordView("P1", t0 + 31 * 60_000), true);
  const s1 = T.getSessionId(t0);
  assert.equal(T.getSessionId(t0 + 10 * 60_000), s1, "activity keeps the session");
  assert.notEqual(T.getSessionId(t0 + 45 * 60_000), s1, "30+ min idle → a new journey");
  assert.match(T.getVisitorId(), /^[A-Za-z0-9_-]{16,64}$/);
  assert.equal(T.getVisitorId(), T.getVisitorId());
  assert.deepEqual(T.analyticsHeaders(), {}, "no ids on the server side");
  assert.equal(T.isShopper("VENDOR"), false);
  assert.equal(T.isShopper("CUSTOMER"), true);
  assert.equal(T.isShopper(undefined), true);
});

// ── runtime harness ────────────────────────────────────────────────────
let JSDOM = null;
try {
  ({ JSDOM } = require("jsdom"));
} catch {
  JSDOM = null;
}
const skip = JSDOM ? false : "jsdom is not installed (it is only a transitive dependency)";
const API = "/api/analytics";

async function render(make, handler, fn, { user = { id: "U_V", role: "VENDOR", vendorId: "VA" }, accessToken = "token" } = {}) {
  const dom = new JSDOM("<!doctype html><html><body><div id=root></div></body></html>", { url: "http://localhost:3000/vendor-dashboard/buisnessadvisor", pretendToBeVisual: true });
  const g = globalThis;
  const saved = {};
  const setGlobal = (k, v) => {
    saved[k] = Object.getOwnPropertyDescriptor(g, k);
    Object.defineProperty(g, k, { value: v, configurable: true, writable: true });
  };
  for (const k of ["window", "document", "navigator", "HTMLElement", "Node", "Element", "MutationObserver", "getComputedStyle", "Event", "MouseEvent", "KeyboardEvent", "FocusEvent", "CustomEvent", "PointerEvent", "InputEvent", "NodeFilter", "localStorage", "sessionStorage", "requestAnimationFrame", "cancelAnimationFrame", "SVGElement"])
    setGlobal(k, k === "window" ? dom.window : dom.window[k]);
  for (const k of Object.getOwnPropertyNames(dom.window)) if (/^(HTML|SVG)\w*Element$/.test(k) && !(k in saved)) setGlobal(k, dom.window[k]);
  class RO {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  setGlobal("ResizeObserver", RO);
  dom.window.ResizeObserver = RO;
  g.IS_REACT_ACT_ENVIRONMENT = true;
  const errors = [];
  const realError = console.error;
  console.error = (...a) => errors.push(format(...a));
  const calls = [];
  const realFetch = g.fetch;
  g.fetch = async (input, init) => {
    const req = input instanceof Request ? input : new Request(input, init);
    const url = new URL(req.url);
    let body = null;
    try {
      body = req.method === "GET" ? null : await req.clone().json();
    } catch {
      body = null;
    }
    calls.push({ method: req.method, path: url.pathname, query: Object.fromEntries(url.searchParams), body, headers: Object.fromEntries(req.headers) });
    const [status, json] = handler(req.method, url.pathname, Object.fromEntries(url.searchParams), body) ?? [404, { error: "not stubbed" }];
    return new Response(JSON.stringify(json), { status, headers: { "content-type": "application/json" } });
  };
  const React = await import("react");
  const { act } = React;
  const { createRoot } = await import("react-dom/client");
  const { Provider } = await import("react-redux");
  const { configureStore } = await import("@reduxjs/toolkit");
  const { apiSlice } = await import("../src/features/apiSlice.ts");
  await import("../src/features/businessAdvisorApi.ts");
  const authReducer = (await import("../src/features/authSlice.ts")).default;
  const store = configureStore({
    reducer: { auth: authReducer, [apiSlice.reducerPath]: apiSlice.reducer },
    middleware: (gd) => gd({ serializableCheck: false, immutableCheck: false }).concat(apiSlice.middleware),
    preloadedState: { auth: { user, accessToken } },
  });
  const root = createRoot(dom.window.document.getElementById("root"));
  const run = async (f) => {
    try {
      await act(f);
    } catch (e) {
      errors.push(String(e?.message || e));
    }
  };
  const wait = (ms) => run(() => new Promise((r) => setTimeout(r, ms)));
  const doc = dom.window.document;
  const ui = {
    doc,
    win: dom.window,
    run,
    calls,
    wait,
    errors,
    store,
    text: () => doc.body.textContent.replace(/\s+/g, " "),
    button: (label) => [...doc.querySelectorAll("button")].find((b) => b.textContent.trim() === label || b.getAttribute("aria-label") === label || b.textContent.trim().startsWith(label)),
    click: async (el) => {
      assert.ok(el, "element to click exists");
      await run(async () => el.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true })));
      await wait(80);
    },
    /** Tab-based layout: open a section by its tab label. */
    tab: async (label) => {
      const el = [...doc.querySelectorAll('[role="tab"]')].find((b) => b.textContent.trim() === label);
      assert.ok(el, `tab ${label} exists`);
      await run(async () => el.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true })));
      await wait(120);
    },
    /** Text of the visible tab panel only. */
    panelText: () => ([...doc.querySelectorAll('[role="tabpanel"]')].find((p) => !p.hidden)?.textContent ?? "").replace(/\s+/g, " "),
    change: async (el, value) => {
      assert.ok(el, "field exists");
      const proto = el.tagName === "SELECT" ? dom.window.HTMLSelectElement.prototype : dom.window.HTMLInputElement.prototype;
      await run(async () => {
        Object.getOwnPropertyDescriptor(proto, "value").set.call(el, value);
        el.dispatchEvent(new dom.window.Event(el.tagName === "SELECT" ? "change" : "input", { bubbles: true }));
      });
      await wait(80);
    },
  };
  try {
    await run(async () => root.render(React.createElement(Provider, { store }, await make(React))));
    await wait(150);
    await fn(ui);
  } finally {
    await run(async () => root.unmount());
    store.dispatch(apiSlice.util.resetApiState());
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

const kpi = (value, previous = null, change = null, pointsChange = null) => ({ value, previous, change, pointsChange });
const OVERVIEW = (over = {}) => ({
  scope: { vendorId: "VA", platform: false },
  range: { from: "2026-09-22", to: "2026-10-21", days: 30, timezone: "Asia/Dhaka" },
  comparison: { from: "2026-08-23", to: "2026-09-21" },
  productId: null,
  trackingStartedAt: "2026-10-01T04:00:00.000Z",
  kpis: {
    views: kpi(1240, 1000, 24),
    addToCart: kpi(186, 200, -7),
    checkoutStarts: kpi(74),
    orders: kpi(41),
    unitsOrdered: kpi(55),
    orderedValueMinor: kpi(8765400),
    checkoutFailures: kpi(9),
    viewToCart: kpi(15, 20, null, -5),
    cartToCheckout: kpi(39.78),
    checkoutToOrder: kpi(55.41),
  },
  funnel: {
    basis: "journeys",
    truncated: false,
    totalJourneys: 900,
    stages: [
      { key: "views", label: "Viewed a product", journeys: 880, fromPrevious: null, dropOff: null },
      { key: "cart", label: "Added to cart", journeys: 160, fromPrevious: 18.18, dropOff: 720 },
      { key: "checkout", label: "Started checkout", journeys: 70, fromPrevious: 43.75, dropOff: 90 },
      { key: "order", label: "Placed an order", journeys: 40, fromPrevious: 57.14, dropOff: 30 },
    ],
    paths: {
      cart: { label: "Add to cart → checkout", stages: [] },
      buyNow: { label: "Buy Now → checkout", stages: [
        { key: "cart", label: "Added to cart", journeys: 25, fromPrevious: null, dropOff: null },
        { key: "checkout", label: "Started checkout", journeys: 20, fromPrevious: 80, dropOff: 5 },
        { key: "order", label: "Placed an order", journeys: 15, fromPrevious: 75, dropOff: 5 },
      ] },
    },
  },
  abandonment: { customersStarted: 60, converted: 38, abandoned: 18, inProgress: 4, abandonmentRate: 32.14, windowHours: 24 },
  series: [
    { day: "2026-10-20", views: 50, addToCart: 8, checkoutStarts: 3, orders: 2 },
    { day: "2026-10-21", views: 40, addToCart: 6, checkoutStarts: 2, orders: 1 },
  ],
  failureReasons: [{ reason: "SHIPPING_UNAVAILABLE", attempts: 6 }, { reason: "STOCK_UNAVAILABLE", attempts: 3 }],
  orders: { current: { ordersPlaced: 52, cancelled: 3, paid: 30, paymentFailed: 2, cashOnDelivery: 20, revenueMinor: 10012300 }, previous: { ordersPlaced: 40, cancelled: 2, paid: 25, paymentFailed: 1, cashOnDelivery: 15, revenueMinor: 8000000 } },
  insights: [{ id: "checkout-drop", tone: "warning", fact: "55.41% of checkout starts became orders (41 of 74).", hypothesis: "Delivery charges or availability at checkout may be causing customers to leave.", sample: 74 }],
  definitions: { funnel: "Journey-based: each stage counts browsing sessions.", views: "Product page views…", addToCart: "Successful adds", checkoutStarts: "Checkout attempts", orders: "Orders", abandonment: "Customers whose latest checkout…", ordersAuthoritative: "From your order records.", history: "Earlier activity was never recorded.", timezone: "Asia/Dhaka", impressions: "Not measured." },
  ...over,
});
const PRODUCTS = (items) => ({ range: OVERVIEW().range, sort: "views", page: 1, pageSize: 10, total: items.length, totalPages: 1, items });
const PROW = (over = {}) => ({ productId: "P_A1", name: "Cotton Saree", slug: "cotton-saree", thumbnail: null, views: 300, addToCart: 40, checkoutStarts: 20, orders: 12, unitsOrdered: 14, orderedValueMinor: 600000, conversion: 4, viewsChange: 12.5, ...over });
const JOURNEYS = (items) => ({ range: OVERVIEW().range, page: 1, pageSize: 20, total: items.length, totalPages: 1, items, abandonAfterHours: 24, replayNotice: "Event-based journey replay — a timeline of recorded shopping events, not a recording of the customer's screen." });
const JOURNEY = {
  id: "J-0A1B2C3D",
  startedAt: "2026-10-19T04:00:00.000Z",
  lastActivityAt: "2026-10-19T04:07:00.000Z",
  durationSeconds: 420,
  path: "BUY_NOW",
  outcome: "ORDERED_PAID",
  products: [{ id: "P_A1", name: "Cotton Saree", thumbnail: null }],
  steps: [
    { type: "PRODUCT_VIEW", at: "2026-10-19T04:00:00.000Z", secondsSincePrevious: null, productId: "P_A1", productName: "Cotton Saree", source: "PRODUCT_PAGE", reason: null, quantity: null },
    { type: "ADD_TO_CART", at: "2026-10-19T04:01:00.000Z", secondsSincePrevious: 60, productId: "P_A1", productName: "Cotton Saree", source: "BUY_NOW", reason: null, quantity: 1 },
    { type: "CHECKOUT_FAILED", at: "2026-10-19T04:03:00.000Z", secondsSincePrevious: 120, productId: "P_A1", productName: "Cotton Saree", source: "CHECKOUT", reason: "SHIPPING_UNAVAILABLE", quantity: 1 },
    { type: "ORDER_PLACED", at: "2026-10-19T04:07:00.000Z", secondsSincePrevious: 240, productId: "P_A1", productName: "Cotton Saree", source: "CHECKOUT", reason: null, quantity: 1 },
  ],
};
const ok = (data) => [200, { success: true, data }];
const handlerFor = ({ overview = OVERVIEW(), products = PRODUCTS([PROW()]), journeys = JOURNEYS([JOURNEY]) } = {}) => (m, p) => {
  if (p === `${API}/business-advisor/overview`) return typeof overview === "function" ? overview() : ok(overview);
  if (p === `${API}/business-advisor/products`) return ok(products);
  if (p === `${API}/business-advisor/journeys`) return ok(journeys);
};
const Dashboard = async (React, props = {}) => React.createElement((await import("../src/components/product/vendor/buisnessadivisordashboard/BusinessAdvisorDashboard.tsx")).default, props);
const noise = (errs) => errs.filter((m) => !/not wrapped in act|ReactDOMTestUtils|width\(0\) and height\(0\)|The width\(|defaultProps/.test(m));

test("dashboard: KPIs, funnel, friction, orders and insights come from the API; no vendorId is ever sent", { skip }, async () => {
  await render((R) => Dashboard(R), handlerFor(), async (ui) => {
    const has = (where, list) => {
      for (const s of list) assert.ok(where.includes(s), `${s} — ${where.slice(0, 400)}`);
    };
    // Overview (default tab): families, compact funnel, orders summary, insights
    has(ui.text(), ["Business Advisor"]);
    has(ui.panelText(), ["1,240", "186", "74", "41", "+24%", "-7%", "No comparison available", "Viewed a product", "880", "18.2% of previous step", "32.1%", "Possible reason (not proven)", "Based on 74 records", "Orders & payments", "৳ 100,123", "+30%"]);
    await ui.tab("Shopping funnel");
    has(ui.panelText(), ["720 dropped", "15%", "-5 pts"]);
    await ui.tab("Checkout insights");
    has(ui.panelText(), ["Delivery unavailable", "32.1%"]);
    await ui.tab("Sales & payments");
    has(ui.panelText(), ["৳ 87,654", "Tracked since tracking began", "৳ 100,123"]);
    await ui.tab("Traffic & trends");
    // each trend panel keeps its screen-reader summary
    has(ui.panelText(), ["Product views: 90; Add to cart: 14; Checkout starts: 5 over 30 days.", "Orders (tracked): 3 over 30 days."]);
    await ui.tab("Products");
    has(ui.panelText(), ["Cotton Saree"]);
    await ui.tab("Customer journeys");
    has(ui.panelText(), ["J-0A1B2C3D"]);
    for (const c of ui.calls) assert.ok(!("vendorId" in c.query), `vendor dashboard sent vendorId on ${c.path}`);
    const ov = ui.calls.find((c) => c.path === `${API}/business-advisor/overview`);
    assert.deepEqual(Object.keys(ov.query).sort(), ["from", "to"]);
    assert.deepEqual(noise(ui.errors), []);
  });
});

test("filters: presets and a custom range re-query; invalid ranges are refused client-side; product focus filters everything; Buy Now path toggle", { skip }, async () => {
  await render((R) => Dashboard(R), handlerFor(), async (ui) => {
    await ui.click(ui.button("Last 7 days"));
    const last = () => ui.calls.filter((c) => c.path === `${API}/business-advisor/overview`).at(-1).query;
    assert.equal(V.daysBetween(last().from, last().to), 7);
    await ui.change(ui.doc.querySelector('[aria-label="From date"]'), "2026-10-10");
    await ui.change(ui.doc.querySelector('[aria-label="To date"]'), "2026-10-01");
    const before = ui.calls.length;
    await ui.click(ui.button("Apply"));
    assert.ok(ui.text().includes("The start date must be on or before the end date."));
    assert.equal(ui.calls.filter((c, i) => i >= before && c.path.endsWith("/overview")).length, 0, "no request for an invalid range");
    await ui.change(ui.doc.querySelector('[aria-label="To date"]'), "2026-10-15");
    await ui.click(ui.button("Apply"));
    assert.deepEqual([last().from, last().to], ["2026-10-10", "2026-10-15"]);
    await ui.tab("Products");
    await ui.click(ui.button("Focus dashboard on Cotton Saree"));
    assert.equal(last().productId, "P_A1");
    assert.ok(ui.text().includes("Showing Cotton Saree only."));
    await ui.tab("Customer journeys");
    const journeysCall = ui.calls.filter((c) => c.path.endsWith("/journeys")).at(-1).query;
    assert.equal(journeysCall.productId, "P_A1", "journeys follow the product focus");
    await ui.click(ui.button("Clear product filter"));
    assert.ok(!ui.text().includes("Showing Cotton Saree only."), "focus cleared (RTK serves the unfocused query from cache)");
    assert.ok(ui.text().includes("Product performance"), "the product table is back");
    await ui.tab("Shopping funnel");
    await ui.click([...ui.doc.querySelectorAll('[role="tabpanel"]:not([hidden]) button')].find((b) => b.textContent.trim() === "Buy Now path"));
    assert.ok(ui.panelText().includes("Buy Now journeys are those whose add-to-cart came from the Buy Now button"));
    await ui.click(ui.button("Reset"));
    assert.equal(ui.button("Last 30 days").getAttribute("aria-pressed"), "true", "reset → last 30 days (served from the RTK cache)");
  });
});

test("products table: server-side sort and search", { skip }, async () => {
  await render((R) => Dashboard(R), handlerFor(), async (ui) => {
    await ui.tab("Products");
    await ui.change(ui.doc.querySelector('[aria-label="Sort products by"]'), "orders");
    assert.equal(ui.calls.filter((c) => c.path.endsWith("/products")).at(-1).query.sort, "orders");
    await ui.change(ui.doc.querySelector('input[placeholder="Search products"]'), "saree");
    await ui.wait(400);
    assert.equal(ui.calls.filter((c) => c.path.endsWith("/products")).at(-1).query.q, "saree");
    assert.ok(ui.text().includes("+12.5%"));
  });
});

test("journey replay: step navigation, scrubber and play — labelled as an event-based replay", { skip }, async () => {
  await render((R) => Dashboard(R), handlerFor(), async (ui) => {
    await ui.tab("Customer journeys");
    assert.ok(ui.text().includes("not a recording of the customer's screen"));
    const current = () => ui.doc.querySelector('[aria-label="Recorded steps"] li[aria-current="step"]').textContent;
    assert.match(current(), /Viewed product/);
    await ui.click(ui.button("Next step"));
    assert.match(current(), /Added to cart.*via Buy Now/);
    await ui.click(ui.button("Next step"));
    assert.match(current(), /Checkout failed.*Delivery unavailable/);
    await ui.click(ui.button("Previous step"));
    assert.match(current(), /Added to cart/);
    await ui.change(ui.doc.querySelector('input[type="range"]'), "3");
    assert.match(current(), /Placed order/);
    assert.equal(ui.button("Next step").disabled, true);
    await ui.click(ui.button("Play replay"));
    assert.match(current(), /Viewed product/, "play from the end restarts");
    await ui.wait(1350);
    assert.match(current(), /Added to cart/, "advances on its own");
    await ui.click(ui.button("Pause replay"));
    const paused = current();
    await ui.wait(1350);
    assert.equal(current(), paused);
    assert.ok(ui.text().includes("Ordered · paid"));
  });
});

test("states: not set up (503), no access (403), error + retry, and no data collected yet", { skip }, async () => {
  await render((R) => Dashboard(R), handlerFor({ overview: () => [503, { success: false, code: "ANALYTICS_NOT_READY", error: "x" }] }), async (ui) => {
    assert.ok(ui.text().includes("Analytics isn't set up yet"));
    assert.ok(!ui.text().includes("1,240"));
  });
  await render((R) => Dashboard(R), handlerFor({ overview: () => [403, { message: "Forbidden" }] }), async (ui) => {
    assert.ok(ui.text().includes("You don't have access to Business Advisor"));
  });
  let fail = true;
  await render((R) => Dashboard(R), handlerFor({ overview: () => (fail ? [500, { error: "PrismaClientKnownRequestError at db:5432" }] : ok(OVERVIEW())) }), async (ui) => {
    assert.ok(ui.text().includes("Couldn't load Business Advisor"));
    assert.ok(!/Prisma|5432/.test(ui.text()));
    fail = false;
    await ui.click(ui.button("Try again"));
    await ui.wait(150);
    assert.ok(ui.text().includes("1,240"));
  });
  const zero = OVERVIEW({ trackingStartedAt: null, insights: [], failureReasons: [], series: [{ day: "2026-10-21", views: 0, addToCart: 0, checkoutStarts: 0, orders: 0 }] });
  await render((R) => Dashboard(R), handlerFor({ overview: zero, products: PRODUCTS([]), journeys: JOURNEYS([]) }), async (ui) => {
    const where = { overview: ["No analytics collected yet", "Not enough activity yet for reliable insights."], "Traffic & trends": ["No tracked activity in this period."], "Checkout insights": ["No checkout failures recorded in this period."], Products: ["No product activity in this period.", "Product activity will appear when customers view or interact with products."], "Customer journeys": ["No journeys recorded in this period."] };
    for (const [tab, list] of Object.entries(where)) {
      if (tab !== "overview") await ui.tab(tab);
      const t = ui.text();
      for (const s of list) assert.ok(t.includes(s), `${tab}: ${s}`);
    }
  });
});

test("admin mode: platform-wide by default; an entered vendor id is passed (and validated by the server)", { skip }, async () => {
  await render((R) => Dashboard(R, { mode: "admin" }), handlerFor(), async (ui) => {
    assert.ok(ui.text().includes("Platform-wide"));
    assert.equal(ui.calls.find((c) => c.path.endsWith("/overview")).query.vendorId, undefined);
    await ui.change(ui.doc.querySelector('[aria-label="Vendor ID (optional)"]'), "VA");
    await ui.click(ui.button("Scope"));
    assert.equal(ui.calls.filter((c) => c.path.endsWith("/overview")).at(-1).query.vendorId, "VA");
  }, { user: { id: "A1", role: "ADMIN" } });
});

test("tracking: a product view is sent once (re-renders don't repeat it); staff views aren't sent; analytics headers only on preflighted requests", { skip }, async () => {
  const { useTrackProductView } = await import("../src/lib/analytics/useAnalytics.ts");
  const Viewer = (React) => {
    function V2({ id }) {
      useTrackProductView(id);
      const [n, setN] = React.useState(0);
      return React.createElement("button", { onClick: () => setN(n + 1) }, `rerender ${n}`);
    }
    return React.createElement(React.StrictMode, null, React.createElement(V2, { id: "P_TRACK_1" }));
  };
  await render(Viewer, (m, p) => (p === `${API}/events` ? [202, { success: true, accepted: 1 }] : undefined), async (ui) => {
    await ui.click(ui.button("rerender 0"));
    const posts = ui.calls.filter((c) => c.path === `${API}/events`);
    assert.equal(posts.length, 1, "Strict Mode double effect + re-render → one view");
    assert.deepEqual(posts[0].body, { events: [{ type: "PRODUCT_VIEW", productId: "P_TRACK_1", source: "PRODUCT_PAGE" }] });
    assert.match(posts[0].headers["x-fm-analytics-session"], /^[A-Za-z0-9_-]{16,64}$/);
    assert.match(posts[0].headers["x-fm-analytics-visitor"], /^[A-Za-z0-9_-]{16,64}$/);
    assert.equal(posts[0].body.vendorId, undefined, "never a vendor id from the browser");
  }, { user: null, accessToken: null });
  const StaffViewer = (React) => {
    function S() {
      useTrackProductView("P_TRACK_2");
      return null;
    }
    return React.createElement(S);
  };
  await render(StaffViewer, () => [202, { success: true, accepted: 0 }], async (ui) => {
    assert.equal(ui.calls.filter((c) => c.path === `${API}/events`).length, 0);
  }, { user: { id: "V1", role: "VENDOR" } });
  // an anonymous GET (product browsing) stays a simple request — no analytics headers
  const { apiSlice } = await import("../src/features/apiSlice.ts");
  const Probe = (React) => {
    function P() {
      apiSlice.endpoints.getAdvisorOverview.useQuery({ from: "2026-10-01", to: "2026-10-02" });
      return null;
    }
    return React.createElement(P);
  };
  await render(Probe, () => [200, { success: true, data: OVERVIEW() }], async (ui) => {
    const get = ui.calls.find((c) => c.path.endsWith("/overview"));
    assert.equal(get.headers["x-fm-analytics-session"], undefined);
  }, { user: null, accessToken: null });
});

test("Phase 2 audit: a long journey says it shows only its latest steps", { skip }, async () => {
  const long = { ...JOURNEY, id: "J-LONG0001", stepsTruncated: true };
  await render((R) => Dashboard(R), handlerFor({ journeys: JOURNEYS([long]) }), async (ui) => {
    await ui.tab("Customer journeys");
    assert.ok(ui.text().includes("Long journey — showing its latest 4 recorded steps."));
  });
  await render((R) => Dashboard(R), handlerFor(), async (ui) => {
    await ui.tab("Customer journeys");
    assert.ok(!ui.text().includes("Long journey"));
  });
});

test("Option B: four metric families (tracked vs order records labelled), rates only in the funnel, product table stays while focused", { skip }, async () => {
  await render((R) => Dashboard(R), handlerFor(), async (ui) => {
    const cards = [...ui.doc.querySelectorAll('[role="list"][aria-label="Metric families"] [data-family]')];
    assert.deepEqual(cards.map((c) => c.getAttribute("data-family")), ["traffic", "cart", "checkout", "sales"]);
    const byFamily = Object.fromEntries(cards.map((c) => [c.getAttribute("data-family"), c.textContent.replace(/\s+/g, " ")]));
    assert.ok(byFamily.traffic.includes("Product views") && byFamily.traffic.includes("1,240") && byFamily.traffic.includes("Tracked"));
    assert.ok(byFamily.cart.includes("Add to cart") && byFamily.cart.includes("186") && byFamily.cart.includes("Buy Now journeys") && byFamily.cart.includes("25"));
    assert.ok(byFamily.checkout.includes("Checkout starts") && byFamily.checkout.includes("74") && byFamily.checkout.includes("32.1%") && byFamily.checkout.includes("Failed attempts"));
    assert.ok(byFamily.sales.includes("Order records") && byFamily.sales.includes("Revenue") && byFamily.sales.includes("৳ 100,123") && byFamily.sales.includes("+25.2%"), byFamily.sales);
    assert.ok(byFamily.sales.includes("Orders (records)") && byFamily.sales.includes("52") && byFamily.sales.includes("Orders (tracked)") && byFamily.sales.includes("41"));
    // conversion rates are shown once — in the funnel tab, not as KPI cards or in the compact overview funnel
    assert.ok(!ui.text().includes("View → cart"));
    await ui.tab("Shopping funnel");
    await ui.tab("Sales & payments");
    const t = ui.text();
    assert.equal((t.match(/View → cart/g) ?? []).length, 1);
    assert.ok(ui.doc.querySelector('[aria-label="Metric families"]').textContent.indexOf("View → cart") === -1);
    // the tracked/records distinction in the sales panel
    assert.ok(t.includes("Tracked since tracking began") && t.includes("Ordered value (tracked)") && t.includes("৳ 87,654"));
    // product focus keeps the table mounted (no layout jump) and marks the row
    await ui.tab("Products");
    await ui.click(ui.button("Focus dashboard on Cotton Saree"));
    assert.ok(ui.text().includes("Product performance"), "table stays");
    assert.equal(ui.doc.querySelector('[aria-label="Clear focus on Cotton Saree"]').getAttribute("aria-pressed"), "true");
  });
  // focused product: order records aren't product-filtered, so Sales leads with the tracked value
  await render((R) => Dashboard(R), handlerFor({ overview: OVERVIEW({ orders: null, productId: "P_A1" }) }), async (ui) => {
    const sales = ui.doc.querySelector('[data-family="sales"]').textContent.replace(/\s+/g, " ");
    assert.ok(sales.includes("Ordered value (tracked)") && sales.includes("৳ 87,654") && sales.includes("Tracked") && !sales.includes("Order records"));
    assert.ok(ui.text().includes("Order records aren't product-filtered"));
  });
});

test("tabs: ARIA tablist, Overview by default, only the active panel visible, keyboard Arrow/Home/End", { skip }, async () => {
  await render((R) => Dashboard(R), handlerFor(), async (ui) => {
    const tabs = () => [...ui.doc.querySelectorAll('[role="tablist"] [role="tab"]')];
    assert.deepEqual(tabs().map((t) => t.textContent.trim()), ["Overview", "Traffic & trends", "Sales & payments", "Shopping funnel", "Products", "Customer journeys", "Checkout insights", "Definitions"]);
    const selected = () => tabs().filter((t) => t.getAttribute("aria-selected") === "true").map((t) => t.textContent.trim());
    assert.deepEqual(selected(), ["Overview"]);
    assert.deepEqual(tabs().map((t) => t.tabIndex), [0, -1, -1, -1, -1, -1, -1, -1], "roving tabindex");
    const visible = () => [...ui.doc.querySelectorAll('[role="tabpanel"]')].filter((p) => !p.hidden);
    assert.equal(visible().length, 1);
    assert.equal(visible()[0].getAttribute("aria-labelledby"), tabs()[0].id);
    assert.equal(tabs()[0].getAttribute("aria-controls"), visible()[0].id);
    const key = async (k) => {
      const el = tabs().find((t) => t.getAttribute("aria-selected") === "true");
      await ui.run(async () => el.dispatchEvent(new ui.win.KeyboardEvent("keydown", { key: k, bubbles: true })));
      await ui.wait(60);
    };
    await key("ArrowRight");
    assert.deepEqual(selected(), ["Traffic & trends"]);
    assert.equal(ui.doc.activeElement, tabs()[1], "focus follows selection");
    await key("ArrowLeft");
    await key("ArrowLeft");
    assert.deepEqual(selected(), ["Definitions"], "wraps around");
    await key("Home");
    assert.deepEqual(selected(), ["Overview"]);
    await key("End");
    assert.deepEqual(selected(), ["Definitions"]);
    assert.equal(visible().length, 1);
    assert.equal(visible()[0].getAttribute("aria-labelledby"), tabs()[7].id);
    // the header filters stay available on every tab
    assert.ok(ui.button("Refresh") && ui.button("Apply"));
  });
});

test("tabs: switching never refetches; Products/Journeys load on first visit; search, sort and funnel path survive switches", { skip }, async () => {
  await render((R) => Dashboard(R), handlerFor(), async (ui) => {
    const count = (p) => ui.calls.filter((c) => c.path.endsWith(p)).length;
    assert.equal(count("/overview"), 1);
    assert.equal(count("/products"), 0, "products not fetched before the tab is opened");
    assert.equal(count("/journeys"), 0, "journeys not fetched before the tab is opened");
    await ui.tab("Products");
    assert.equal(count("/products"), 1);
    await ui.change(ui.doc.querySelector('input[placeholder="Search products"]'), "Saree");
    await ui.change(ui.doc.querySelector('[aria-label="Sort products by"]'), "orders");
    await ui.wait(450);
    const productCalls = count("/products");
    await ui.tab("Customer journeys");
    assert.equal(count("/journeys"), 1);
    await ui.tab("Shopping funnel");
    const pathBtn = () => [...ui.doc.querySelectorAll('[role="tabpanel"]:not([hidden]) button')].find((b) => b.textContent.trim() === "Buy Now path");
    await ui.click(pathBtn());
    assert.equal(pathBtn().getAttribute("aria-pressed"), "true");
    const overviewCalls = count("/overview");
    for (const t of ["Overview", "Traffic & trends", "Sales & payments", "Products", "Customer journeys", "Checkout insights", "Definitions", "Overview"]) await ui.tab(t);
    assert.equal(count("/overview"), overviewCalls, "no overview refetch on tab switch");
    assert.equal(count("/products"), productCalls, "no products refetch on tab switch");
    assert.equal(count("/journeys"), 1, "no journeys refetch on tab switch");
    // the funnel path chosen in the Funnel tab is the same state the Overview funnel shows
    assert.equal(pathBtn()?.getAttribute("aria-pressed"), "true");
    await ui.tab("Products");
    assert.equal(ui.doc.querySelector('input[placeholder="Search products"]').value, "Saree", "search kept");
    assert.equal(ui.doc.querySelector('[aria-label="Sort products by"]').value, "orders", "sort kept");
  });
});

// ── visual session replay (admin only) ───────────────────────────────────
const REC = (o = {}) => ({ id: "rec0000000001", journeyId: JOURNEY.id, synthetic: true, status: "COMPLETE", stopReason: null, entryPath: "/products/p1", startedAt: "2026-10-20T10:00:00.000Z", firstEventAt: "2026-10-20T10:00:00.000Z", lastEventAt: "2026-10-20T10:01:05.000Z", durationMs: 65_000, pageCount: 2, chunkCount: 2, eventCount: 9, bytes: 4096, expiresAt: "2026-11-03T10:00:00.000Z", ...o });
const ADMIN = { user: { id: "U_A", role: "ADMIN", vendorId: null } };
const withRecordings = (recordings, base = handlerFor()) => (m, p, q) => {
  if (p === `${API}/business-advisor/recordings`) return typeof recordings === "function" ? recordings(q) : recordings;
  if (p.startsWith(`${API}/business-advisor/recordings/`) && m === "GET") return ok({ ...REC(), chunks: [{ seq: 0, bytes: 2000, eventCount: 5, firstEventAt: REC().firstEventAt, lastEventAt: REC().firstEventAt }, { seq: 1, bytes: 2096, eventCount: 4, firstEventAt: REC().firstEventAt, lastEventAt: REC().lastEventAt }] });
  if (p.startsWith(`${API}/business-advisor/recordings/`) && m === "DELETE") return ok({ deleted: 1 });
  return base(m, p, q);
};

test("visual replay: vendors never request or see recordings; the event-based replay is unchanged", { skip }, async () => {
  await render((R) => Dashboard(R), withRecordings(ok({ items: [REC()], total: 1, page: 1, pageSize: 20 })), async (ui) => {
    await ui.tab("Customer journeys");
    assert.ok(ui.panelText().includes("Customer journey explorer"));
    assert.ok(!ui.panelText().includes("Visual session recordings"));
    assert.ok(!ui.panelText().includes("Watch visual replay"));
    assert.equal(ui.calls.filter((c) => c.path.includes("/recordings")).length, 0, "no recordings request from the vendor dashboard");
  });
});

test("visual replay (admin): linked recordings under a journey, the recordings list, distinct labels, and delete with confirmation", { skip }, async () => {
  const deletes = [];
  const handler = withRecordings((q) => ok(q.journey ? { items: q.journey === JOURNEY.id ? [REC()] : [], total: 1, page: 1, pageSize: 20 } : { items: [REC(), REC({ id: "rec0000000002", journeyId: "J-00FF00FF", synthetic: true, status: "STOPPED", stopReason: "max_bytes" })], total: 2, page: 1, pageSize: 20 }));
  await render((R) => Dashboard(R, { mode: "admin" }), (m, p, q) => (m === "DELETE" && deletes.push(p), handler(m, p, q)), async (ui) => {
    await ui.tab("Customer journeys");
    const t = ui.panelText();
    assert.ok(t.includes("Event-based journey replay"), "the event-based replay keeps its own label");
    assert.ok(t.includes("Visual recordings of this journey"));
    assert.ok(t.includes("Watch visual replay · 1:05 · 2 pages"));
    assert.ok(t.includes("Visual session recordings"));
    assert.ok(t.includes("stopped (max_bytes)"));
    assert.ok(t.includes("Synthetic"));
    assert.equal(ui.calls.find((c) => c.path.endsWith("/recordings") && c.query.journey)?.query.journey, JOURNEY.id, "linked by the journey id");
    await ui.click(ui.button("Delete recording J-00FF00FF"));
    assert.equal(deletes.length, 0, "first click only asks for confirmation");
    await ui.click(ui.button("Confirm delete"));
    assert.deepEqual(deletes, [`${API}/business-advisor/recordings/rec0000000002`]);
  }, ADMIN);
  // a journey without a recording says so, instead of implying one exists
  await render((R) => Dashboard(R, { mode: "admin" }), withRecordings(ok({ items: [], total: 0, page: 1, pageSize: 20 })), async (ui) => {
    await ui.tab("Customer journeys");
    assert.ok(ui.panelText().includes("No screen recording for this journey — the event-based replay above is everything that was captured."));
    assert.ok(ui.panelText().includes("No visual recordings yet."));
  }, ADMIN);
  // before the migration: 503 → "not set up", the rest of the tab works
  await render((R) => Dashboard(R, { mode: "admin" }), withRecordings([503, { success: false, code: "REPLAY_NOT_READY" }]), async (ui) => {
    await ui.tab("Customer journeys");
    assert.ok(ui.panelText().includes("Visual replay isn't set up yet"));
    assert.ok(ui.panelText().includes("J-0A1B2C3D"), "journeys still listed");
  }, ADMIN);
});

test("visual replay player: streams chunks in order with the admin token, play / pause / seek / speed / skip, page indicator, sandbox-safe config, cleanup", { skip }, async () => {
  const { gzipSync } = await import("node:zlib");
  const T0 = Date.parse("2026-10-20T10:00:00.000Z");
  const chunk0 = [{ type: 4, timestamp: T0, data: { href: "http://localhost:3000/products/p1", width: 1280, height: 800 } }, { type: 2, timestamp: T0 + 1, data: {} }, { type: 3, timestamp: T0 + 900, data: { source: 2 } }];
  const chunk1 = [{ type: 4, timestamp: T0 + 30_000, data: { href: "http://localhost:3000/category/shoes?q=x", width: 1280, height: 800 } }, { type: 2, timestamp: T0 + 30_001, data: {} }, { type: 3, timestamp: T0 + 65_000, data: { source: 3 } }];
  const fetched = [];
  const fetchImpl = async (url, init) => {
    fetched.push({ url: String(url), auth: init.headers.Authorization });
    const seq = Number(String(url).split("/").pop());
    return new Response(gzipSync(Buffer.from(JSON.stringify(seq === 0 ? chunk0 : chunk1))), { status: 200 });
  };
  const inst = [];
  class FakeReplayer {
    constructor(events, config) {
      this.events = [...events];
      this.config = config;
      this.calls = [];
      this.t = 0;
      this.handlers = {};
      inst.push(this);
    }
    on(e, h) {
      this.handlers[e] = h;
      if (e === "resize") h({ width: 1280, height: 800 });
    }
    getMetaData() {
      const ts = this.events.map((e) => e.timestamp);
      return { startTime: Math.min(...ts), endTime: Math.max(...ts), totalTime: Math.max(...ts) - Math.min(...ts) };
    }
    getCurrentTime() {
      return this.t;
    }
    play(t = this.t) {
      this.t = t;
      this.calls.push(["play", t]);
    }
    pause(t = this.t) {
      this.t = t;
      this.calls.push(["pause", t]);
    }
    setConfig(c) {
      this.calls.push(["setConfig", c]);
    }
    addEvent(e) {
      // like rrweb 2.1.7: Replayer.addEvent applies the event in a microtask, not synchronously
      this.calls.push(["addEvent", e.timestamp]);
      void Promise.resolve().then(() => this.events.push(e));
    }
    destroy() {
      this.destroyed = true;
    }
  }
  const { SessionReplayPlayer } = await import("../src/components/product/vendor/buisnessadivisordashboard/SessionReplayPlayer.tsx");
  const recording = { ...REC(), chunks: [{ seq: 0 }, { seq: 1 }] };
  await render((R) => R.createElement(SessionReplayPlayer, { recording, accessToken: "admin-token", loadReplayer: async () => FakeReplayer, fetchImpl, apiBase: "http://api.test/api" }), () => undefined, async (ui) => {
    await ui.wait(200);
    const r = inst[0];
    assert.deepEqual(fetched.map((f) => f.url), ["http://api.test/api/analytics/business-advisor/recordings/rec0000000001/chunks/0", "http://api.test/api/analytics/business-advisor/recordings/rec0000000001/chunks/1"]);
    assert.ok(fetched.every((f) => f.auth === "Bearer admin-token"));
    assert.deepEqual(r.events.slice(0, 3), chunk0, "first chunk builds the player");
    assert.deepEqual(r.calls.filter((c) => c[0] === "addEvent").map((c) => c[1]), chunk1.map((e) => e.timestamp), "later chunks appended in order");
    assert.equal(r.config.UNSAFE_replayCanvas, false, "sandboxed iframe without scripts");
    assert.equal(r.config.root, ui.doc.querySelector('[data-testid="replay-stage"]'));
    assert.ok(ui.text().includes("Visual replay"));
    assert.ok(ui.text().includes("Synthetic test"));
    assert.ok(ui.text().includes("0:00 / 1:05"));
    assert.ok(ui.text().includes("2 parts loaded"));
    assert.ok(ui.text().includes("Typed values are masked"));
    await ui.click(ui.button("Play visual replay"));
    assert.deepEqual(r.calls.at(-1), ["play", 0]);
    assert.ok(ui.button("Pause visual replay"));
    await ui.click(ui.button("Pause visual replay"));
    assert.equal(r.calls.at(-1)[0], "pause");
    await ui.change(ui.doc.querySelector('[aria-label="Seek visual replay"]'), "40000");
    assert.deepEqual(r.calls.at(-1), ["pause", 40000], "seek while paused");
    // exact positions: browsers snap a range input to its step (jsdom doesn't), and a 100 ms step made the
    // recording's end unreachable — the slider must accept any value
    assert.equal(ui.doc.querySelector('[aria-label="Seek visual replay"]').getAttribute("step"), "any");
    await ui.change(ui.doc.querySelector('[aria-label="Seek visual replay"]'), "64955");
    assert.deepEqual(r.calls.at(-1), ["pause", 64955]);
    // seeking to the end goes just past the last event: rrweb only applies events strictly before the seek time
    await ui.change(ui.doc.querySelector('[aria-label="Seek visual replay"]'), "65000");
    assert.deepEqual(r.calls.at(-1), ["pause", 65001], "the recording's final event is applied at the end");
    await ui.wait(300);
    assert.ok(ui.text().includes("Page: /category/shoes"), "page indicator follows navigation (no query string)");
    await ui.change(ui.doc.querySelector('[aria-label="Playback speed"]'), "4");
    assert.deepEqual(r.calls.at(-1), ["setConfig", { speed: 4 }]);
    await ui.click(ui.doc.querySelector('input[type="checkbox"]'));
    assert.deepEqual(r.calls.at(-1), ["setConfig", { skipInactive: false }]);
  });
  assert.equal(inst[0].destroyed, true, "player destroyed on unmount");

  // access refused → message, no crash
  await render((R) => R.createElement(SessionReplayPlayer, { recording, accessToken: "vendor-token", loadReplayer: async () => FakeReplayer, fetchImpl: async () => new Response("{}", { status: 403 }), apiBase: "http://api.test/api" }), () => undefined, async (ui) => {
    await ui.wait(150);
    assert.ok(ui.text().includes("You don't have access to this recording"));
  });
});

// ── recorder lifecycle, session switching, demo-delete isolation ─────────
const Recorder = async (React) => React.createElement((await import("../src/components/analytics/SessionReplayBoot.tsx")).SessionReplayRecorder);
const replayStarts = (ui) => ui.calls.filter((c) => c.path === "/api/analytics/replay/start");
const replayHandler = (m, p) => (p === "/api/analytics/replay/start" ? [202, { success: true, enabled: false }] : undefined);

test("recorder: starts only for an opted-in, signed-out shopper after the page settles; staff and signed-in sessions are never recorded; unmount tears down", { skip }, async () => {
  // opted-in tester, signed out → one start request with the synthetic flag and the analytics session id
  await render(async (R) => (localStorage.setItem("fm_replay_synthetic", "1"), Recorder(R)), replayHandler, async (ui) => {
    assert.equal(replayStarts(ui).length, 0, "nothing during the first render");
    await ui.wait(2200);
    const s = replayStarts(ui);
    assert.equal(s.length, 1);
    // jsdom here has no global `location`, so the recorder reports "/" (in a browser it is location.pathname + search)
    assert.deepEqual(s[0].body, { synthetic: true, path: "/" });
    assert.match(s[0].headers["x-fm-analytics-session"], /^[A-Za-z0-9_-]{16,64}$/);
    assert.equal(s[0].headers.authorization, undefined, "signed out");
  }, { user: null, accessToken: null });
  // signed-in customer → fail closed (no request at all)
  await render(async (R) => (localStorage.setItem("fm_replay_synthetic", "1"), Recorder(R)), replayHandler, async (ui) => {
    await ui.wait(2200);
    assert.equal(replayStarts(ui).length, 0, "signed-in sessions are not recorded");
  }, { user: { id: "U_C", role: "CUSTOMER" }, accessToken: "customer-token" });
  // staff → never
  await render(async (R) => (localStorage.setItem("fm_replay_synthetic", "1"), Recorder(R)), replayHandler, async (ui) => {
    await ui.wait(2200);
    assert.equal(replayStarts(ui).length, 0);
  }, { user: { id: "U_V", role: "VENDOR" }, accessToken: "vendor-token" });
  // not opted in → never
  await render(async (R) => Recorder(R), replayHandler, async (ui) => {
    await ui.wait(2200);
    assert.equal(replayStarts(ui).length, 0);
  }, { user: null, accessToken: null });
  // unmounted before the page settled → no start afterwards
  let calls;
  await render(async (R) => (localStorage.setItem("fm_replay_synthetic", "1"), Recorder(R)), replayHandler, async (ui) => {
    calls = ui.calls;
  }, { user: null, accessToken: null });
  await new Promise((r) => setTimeout(r, 2200));
  assert.equal(calls.filter((c) => c.path === "/api/analytics/replay/start").length, 0, "teardown cancels the pending start");
});

test("player: switching recordings resets page label, clock and pages — nothing stale from the previous session", { skip }, async () => {
  const { gzipSync } = await import("node:zlib");
  const T0 = Date.parse("2026-10-20T10:00:00.000Z");
  const meta = (t, path) => ({ type: 4, timestamp: t, data: { href: "http://localhost:3000" + path, width: 1280, height: 800 } });
  const BODIES = {
    recA: [[meta(T0, "/products/a"), { type: 2, timestamp: T0 + 1, data: {} }, meta(T0 + 9_000, "/category/a"), { type: 2, timestamp: T0 + 9_001, data: {} }]],
    recB: [[meta(T0, "/cart"), { type: 2, timestamp: T0 + 1, data: {} }, { type: 3, timestamp: T0 + 3_000, data: { source: 3 } }]],
  };
  const fetchImpl = async (url) => {
    const [, id, seq] = /recordings\/([^/]+)\/chunks\/(\d+)$/.exec(String(url));
    if (id === "recB") await new Promise((r) => setTimeout(r, 500)); // the next recording is still loading for a moment
    return new Response(gzipSync(Buffer.from(JSON.stringify(BODIES[id][Number(seq)]))), { status: 200 });
  };
  const made = [];
  class R {
    constructor(events, config) {
      this.events = [...events];
      this.t = 0;
      this.config = config;
      made.push(this);
    }
    on(e, h) {
      if (e === "resize") h({ width: 1280, height: 800 });
    }
    getMetaData() {
      const ts = this.events.map((e) => e.timestamp);
      return { startTime: Math.min(...ts), endTime: Math.max(...ts), totalTime: Math.max(...ts) - Math.min(...ts) };
    }
    getCurrentTime() {
      return this.t;
    }
    play(t = this.t) {
      this.t = t;
    }
    pause(t = this.t) {
      this.t = t;
    }
    setConfig() {}
    addEvent(e) {
      void Promise.resolve().then(() => this.events.push(e));
    }
    destroy() {}
  }
  const { SessionReplayPlayer } = await import("../src/components/product/vendor/buisnessadivisordashboard/SessionReplayPlayer.tsx");
  const rec = (id) => ({ ...REC({ id, entryPath: null }), chunks: [{ seq: 0 }] });
  const Switcher = (React) => {
    function S() {
      const [id, setId] = React.useState("recA");
      return React.createElement("div", null, React.createElement("button", { onClick: () => setId("recB") }, "switch"), React.createElement(SessionReplayPlayer, { recording: rec(id), accessToken: "t", loadReplayer: async () => R, fetchImpl, apiBase: "http://api.test/api" }));
    }
    return React.createElement(S);
  };
  await render(Switcher, () => undefined, async (ui) => {
    await ui.wait(200);
    await ui.change(ui.doc.querySelector('[aria-label="Seek visual replay"]'), "9500");
    await ui.wait(300);
    assert.ok(ui.text().includes("Page: /category/a"), JSON.stringify([...ui.doc.querySelectorAll("span,[role=alert]")].map((e) => e.textContent).filter((t) => /Page:| \/ |part|Couldn|access/.test(t))));
    assert.ok(ui.text().includes("0:09 / 0:09"));
    // the admin's control choices carry over and the next recording really plays with them
    await ui.change(ui.doc.querySelector('[aria-label="Playback speed"]'), "4");
    await ui.click(ui.doc.querySelector('input[type="checkbox"]'));
    await ui.click(ui.button("switch"));
    // while recording B loads, nothing from recording A may be shown
    const loading = ui.text();
    assert.ok(!loading.includes("/category/a") && !loading.includes("0:09"), "no stale page label or clock while the next recording loads");
    await ui.wait(700);
    const t = ui.text();
    assert.ok(t.includes("Page: /cart"), t.slice(0, 300));
    assert.ok(!t.includes("/category/a") && !t.includes("/products/a"), "no page from the previous recording");
    assert.ok(t.includes("0:00 / 0:03"), "clock reset to the new recording (3 s long)");
    const next = made.at(-1);
    assert.equal(ui.doc.querySelector('[aria-label="Playback speed"]').value, "4");
    assert.equal(next.config.speed, 4, "new recording's replayer runs at the speed the control shows");
    assert.equal(next.config.skipInactive, false, "and with the skip-inactivity choice the checkbox shows");
  });
});

test("demo isolation: in demo mode delete never reaches the real DELETE endpoint (fixture or unknown id); with demo off the real path is unchanged", { skip }, async () => {
  const saved = process.env.NEXT_PUBLIC_REPLAY_DEMO;
  process.env.NEXT_PUBLIC_REPLAY_DEMO = "1";
  try {
    await render(async (R) => (localStorage.setItem("fm_replay_demo", "1"), R.createElement("div")), (m, p) => (m === "DELETE" ? ok({ deleted: 1 }) : undefined), async (ui) => {
      const { businessAdvisorApi } = await import("../src/features/businessAdvisorApi.ts");
      for (const id of ["DEMO-0001", "DEMO-9999", "rec0000000001"]) {
        const r = await ui.store.dispatch(businessAdvisorApi.endpoints.deleteSessionRecording.initiate(id));
        assert.equal(r.error?.status, 403, id);
      }
      assert.equal(ui.calls.filter((c) => c.method === "DELETE").length, 0, "no DELETE request in demo mode");
      localStorage.removeItem("fm_replay_demo");
      const real = await ui.store.dispatch(businessAdvisorApi.endpoints.deleteSessionRecording.initiate("rec0000000001"));
      assert.deepEqual(real.data, { deleted: 1 });
      assert.deepEqual(ui.calls.filter((c) => c.method === "DELETE").map((c) => c.path), [`${API}/business-advisor/recordings/rec0000000001`], "demo off → the real endpoint, as before");
    });
  } finally {
    if (saved === undefined) delete process.env.NEXT_PUBLIC_REPLAY_DEMO;
    else process.env.NEXT_PUBLIC_REPLAY_DEMO = saved;
  }
});

test("recorder: a signed-in synthetic test account (@test.invalid) may start — the request carries its token so the server can decide; any other customer never does", { skip }, async () => {
  await render(async (R) => (localStorage.setItem("fm_replay_synthetic", "1"), Recorder(R)), replayHandler, async (ui) => {
    await ui.wait(2200);
    const s = replayStarts(ui);
    assert.equal(s.length, 1);
    assert.equal(s[0].headers.authorization, "Bearer synthetic-token", "the server checks the account against its allowlist");
  }, { user: { id: "U_S", role: "CUSTOMER", email: "shopper1@test.invalid" }, accessToken: "synthetic-token" });
  await render(async (R) => (localStorage.setItem("fm_replay_synthetic", "1"), Recorder(R)), replayHandler, async (ui) => {
    await ui.wait(2200);
    assert.equal(replayStarts(ui).length, 0);
  }, { user: { id: "U_R", role: "CUSTOMER", email: "someone@test.invalid.example.com" }, accessToken: "customer-token" });
});

test("player: time on an excluded page is shown as a 'not recorded' gap, never as page content", { skip }, async () => {
  const { gzipSync } = await import("node:zlib");
  const T0 = Date.parse("2026-10-20T10:00:00.000Z");
  const meta = (t, path) => ({ type: 4, timestamp: t, data: { href: "http://localhost:3000" + path, width: 1280, height: 800 } });
  const events = [meta(T0, "/cart"), { type: 2, timestamp: T0 + 1, data: {} }, { type: 5, timestamp: T0 + 4000, data: { tag: "fm:excluded-page", payload: { section: "checkout" } } }, meta(T0 + 9000, "/cart"), { type: 2, timestamp: T0 + 9001, data: {} }];
  class R {
    constructor(e) {
      this.events = [...e];
      this.t = 0;
    }
    on(e, h) {
      if (e === "resize") h({ width: 1280, height: 800 });
    }
    getMetaData() {
      const ts = this.events.map((e) => e.timestamp);
      return { startTime: Math.min(...ts), endTime: Math.max(...ts), totalTime: Math.max(...ts) - Math.min(...ts) };
    }
    getCurrentTime() {
      return this.t;
    }
    play(t = this.t) {
      this.t = t;
    }
    pause(t = this.t) {
      this.t = t;
    }
    setConfig() {}
    addEvent() {}
    destroy() {}
  }
  const { SessionReplayPlayer } = await import("../src/components/product/vendor/buisnessadivisordashboard/SessionReplayPlayer.tsx");
  const recording = { ...REC({ id: "recGap", entryPath: "/cart" }), chunks: [{ seq: 0 }] };
  const fetchImpl = async () => new Response(gzipSync(Buffer.from(JSON.stringify(events))), { status: 200 });
  await render((Re) => Re.createElement(SessionReplayPlayer, { recording, accessToken: "t", loadReplayer: async () => R, fetchImpl, apiBase: "http://api.test/api" }), () => undefined, async (ui) => {
    await ui.wait(200);
    assert.ok(ui.text().includes("Page: /cart"));
    assert.equal(ui.doc.querySelector('[data-testid="replay-gap"]'), null);
    await ui.change(ui.doc.querySelector('[aria-label="Seek visual replay"]'), "6000");
    await ui.wait(300);
    assert.ok(ui.text().includes("Page: not recorded — checkout (privacy)"));
    assert.match(ui.doc.querySelector('[data-testid="replay-gap"]').textContent, /Not recorded: the shopper was on a checkout page/);
    await ui.change(ui.doc.querySelector('[aria-label="Seek visual replay"]'), "9000");
    await ui.wait(300);
    assert.ok(ui.text().includes("Page: /cart"), "recording continues after the gap");
    assert.equal(ui.doc.querySelector('[data-testid="replay-gap"]'), null);
  });
});

test("visual replay (admin): an incomplete recording (no finish signal) is labelled as such, not shown as a finished one", { skip }, async () => {
  await render((R) => Dashboard(R, { mode: "admin" }), withRecordings(ok({ items: [REC({ id: "rec0000000009", status: "RECORDING" })], total: 1, page: 1, pageSize: 20 })), async (ui) => {
    await ui.tab("Customer journeys");
    assert.ok(ui.panelText().includes("in progress / incomplete"));
  }, ADMIN);
  await render((R) => Dashboard(R, { mode: "admin" }), withRecordings(ok({ items: [REC()], total: 1, page: 1, pageSize: 20 })), async (ui) => {
    await ui.tab("Customer journeys");
    assert.ok(!ui.panelText().includes("in progress / incomplete"), "a COMPLETE recording carries no such label");
  }, ADMIN);
});
