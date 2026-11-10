// tests/payment-reconciliation-ui.test.mjs
//
// /admin-dashboard/payment-reconciliation — read-only queue of verified
// payments the backend couldn't apply (GET /admin-orders/payment-reconciliation).
//   1. wording (pure): every reason explained; the notice says what did NOT
//      happen (no refund, order unchanged, no accounting entry) — no claim of
//      a refund or resolution;
//   2. runtime (jsdom, real store + RTK Query, fetch stubbed): the backend's
//      facts per payment (amount, reason, gateway + reference, order, customer,
//      unchanged payment status); NO apply / refund / resolve control; paging
//      is server-side; empty, error + retry and 403 states.
//   node --test tests/payment-reconciliation-ui.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { register, createRequire } from "node:module";
import { format } from "node:util";

register("./support/tsx-loader.mjs", import.meta.url);
const require = createRequire(import.meta.url);
const L = await import("../src/lib/orders/payment-reconciliation.ts");

const ITEM = (over = {}) => ({
  id: "PAY_B", method: "SSLCOMMERZ", status: "PENDING", amount: "1500", createdAt: "2026-10-19T08:00:00.000Z",
  reconciliation: { state: "NEEDS_REVIEW", reason: "ORDER_ALREADY_PAID", receivedAt: "2026-10-19T08:05:00.000Z", gateway: "SSLCOMMERZ", gatewayRef: "BANK_123", amount: "1500" },
  order: { id: "O1", orderNumber: "ORD-1001", status: "CONFIRMED", paymentStatus: "PAID", user: { id: "U1", name: "Rahim Uddin", email: "r@example.com" } },
  ...over,
});
const LIST = (items, { total = items.length, totalPages = 1, page = 1 } = {}) => [200, { success: true, data: items, pagination: { page, limit: 20, total, totalPages }, count: items.length }];

test("wording: every reason explained; the notice states what did NOT happen and promises nothing", () => {
  for (const r of ["ORDER_ALREADY_PAID", "ORDER_CANCELLED", "ORDER_NOT_PAYABLE"]) {
    const c = L.unappliedReasonCopy(r);
    assert.ok(c.label && c.explanation, r);
  }
  assert.equal(L.unappliedReasonCopy("SOMETHING_NEW").label, "Needs review");
  assert.match(L.RECONCILIATION_NOTICE, /No refund has been issued/);
  assert.match(L.RECONCILIATION_NOTICE, /order was not changed/);
  assert.match(L.RECONCILIATION_NOTICE, /no accounting entry was posted/);
  assert.match(L.RECONCILIATION_NOTICE, /read-only/);
  assert.doesNotMatch(L.RECONCILIATION_NOTICE + Object.values(L.UNAPPLIED_REASON_COPY).map((c) => c.explanation).join(" "), /will be refunded|has been refunded|refund (is|was) (issued|sent)|resolved automatically/i);
  assert.equal(L.gatewayLabel("PAYSTATION"), "PayStation");
});

let JSDOM = null;
try {
  ({ JSDOM } = require("jsdom"));
} catch {
  JSDOM = null;
}
const skip = JSDOM ? false : "jsdom is not installed (it is only a transitive dependency)";

async function render(handler, fn) {
  const dom = new JSDOM("<!doctype html><html><body><div id=root></div></body></html>", { url: "http://localhost:3000/admin-dashboard/payment-reconciliation", pretendToBeVisual: true });
  const g = globalThis;
  const saved = {};
  const setGlobal = (k, v) => {
    saved[k] = Object.getOwnPropertyDescriptor(g, k);
    Object.defineProperty(g, k, { value: v, configurable: true, writable: true });
  };
  for (const k of ["window", "document", "navigator", "HTMLElement", "Node", "Element", "MutationObserver", "getComputedStyle", "Event", "MouseEvent", "KeyboardEvent", "FocusEvent", "CustomEvent", "PointerEvent", "InputEvent", "NodeFilter", "localStorage"]) setGlobal(k, k === "window" ? dom.window : dom.window[k]);
  for (const k of Object.getOwnPropertyNames(dom.window)) if (/^(HTML|SVG)\w*Element$/.test(k) && !(k in saved)) setGlobal(k, dom.window[k]);
  g.IS_REACT_ACT_ENVIRONMENT = true;
  const errors = [];
  const realError = console.error;
  console.error = (...a) => errors.push(format(...a));
  const calls = [];
  const realFetch = g.fetch;
  g.fetch = async (input, init) => {
    const req = input instanceof Request ? input : new Request(input, init);
    const url = new URL(req.url);
    calls.push({ method: req.method, path: url.pathname, query: Object.fromEntries(url.searchParams) });
    const [status, json] = handler(req.method, url) ?? [500, {}];
    return new Response(JSON.stringify(json), { status, headers: { "content-type": "application/json" } });
  };
  const React = await import("react");
  const { act } = React;
  const { createRoot } = await import("react-dom/client");
  const { Provider } = await import("react-redux");
  const { configureStore } = await import("@reduxjs/toolkit");
  const { adminOrderApi } = await import("../src/features/adminOrderApi.ts");
  const authReducer = (await import("../src/features/authSlice.ts")).default;
  const { PaymentReconciliationQueue } = await import("../src/components/orders/PaymentReconciliationQueue.tsx");
  const store = configureStore({
    reducer: { auth: authReducer, [adminOrderApi.reducerPath]: adminOrderApi.reducer },
    middleware: (gd) => gd({ serializableCheck: false, immutableCheck: false }).concat(adminOrderApi.middleware),
    preloadedState: { auth: { user: { id: "A1", name: "Admin", role: "ADMIN" }, accessToken: "token" } },
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
    calls,
    wait,
    text: () => doc.body.textContent.replace(/\s+/g, " "),
    buttons: () => [...doc.querySelectorAll("button")].map((b) => b.textContent.trim()),
    button: (label) => [...doc.querySelectorAll("button")].find((b) => b.textContent.trim().startsWith(label)),
    click: async (el) => {
      assert.ok(el, "element to click exists");
      await run(async () => el.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true })));
      await wait(60);
    },
    errors,
  };
  try {
    await run(async () => root.render(React.createElement(Provider, { store }, React.createElement(PaymentReconciliationQueue))));
    await wait(80);
    await fn(ui);
  } finally {
    await run(async () => root.unmount());
    store.dispatch(adminOrderApi.util.resetApiState());
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
const lists = (calls) => calls.filter((c) => c.method === "GET" && c.path === "/api/admin-orders/payment-reconciliation");

test("the backend's facts per payment, and NO apply / refund / resolve control anywhere", { skip }, async () => {
  const items = [
    ITEM(),
    ITEM({ id: "PAY_C", method: "PAYSTATION", status: "PENDING", reconciliation: { state: "NEEDS_REVIEW", reason: "ORDER_CANCELLED", receivedAt: "2026-10-19T09:00:00.000Z", gateway: "PAYSTATION", gatewayRef: "TRX_9", amount: "980" }, order: { id: "O2", orderNumber: "ORD-1002", status: "CANCELLED", paymentStatus: "PENDING", user: { id: "U2", name: "Karim", email: null } } }),
  ];
  await render((m, url) => (url.pathname.endsWith("/payment-reconciliation") ? LIST(items) : undefined), async (ui) => {
    const t = ui.text();
    for (const s of ["৳1,500.00", "Order already paid", "second charge", "SSLCommerz", "BANK_123", "ORD-1001", "Rahim Uddin", "status pending (unchanged)", "৳980.00", "Order cancelled", "PayStation", "TRX_9", "ORD-1002", "2 awaiting review", "No refund has been issued"]) {
      assert.ok(t.includes(s), `${s} — ${t.slice(0, 300)}`);
    }
    assert.deepEqual(ui.buttons(), ["Refresh"], "read-only: the only control is Refresh");
    assert.ok(!ui.doc.querySelector("a[href*='refund'], form"), "no refund link or form");
    assert.deepEqual(lists(ui.calls)[0].query, { page: "1", limit: "20" });
    assert.ok(ui.calls.every((c) => c.method === "GET"), "nothing but reads");
    assert.deepEqual(ui.errors.filter((m) => !/not wrapped in act|ReactDOMTestUtils/.test(m)), []);
  });
});

test("paging is server-side", { skip }, async () => {
  await render((m, url) => (url.pathname.endsWith("/payment-reconciliation") ? LIST([ITEM()], { total: 45, totalPages: 3, page: Number(url.searchParams.get("page")) }) : undefined), async (ui) => {
    assert.ok(ui.text().includes("Page 1 of 3"));
    await ui.click(ui.button("Next"));
    assert.equal(lists(ui.calls).at(-1).query.page, "2");
    assert.ok(ui.text().includes("Page 2 of 3"));
  });
});

test("empty, error with retry, and 403 without a retry", { skip }, async () => {
  await render((m, url) => (url.pathname.endsWith("/payment-reconciliation") ? LIST([]) : undefined), async (ui) => {
    assert.ok(ui.text().includes("Nothing to reconcile"));
  });
  let fail = true;
  await render((m, url) => (url.pathname.endsWith("/payment-reconciliation") ? (fail ? [500, { success: false, message: "stack trace" }] : LIST([ITEM()])) : undefined), async (ui) => {
    assert.ok(ui.text().includes("Couldn't load the reconciliation queue"));
    assert.ok(!ui.text().includes("stack trace"));
    fail = false;
    await ui.click(ui.button("Try again"));
    await ui.wait(80);
    assert.ok(ui.text().includes("ORD-1001"));
  });
  // the shared reauth refreshes once on 403 and retries; a valid session without the permission gets 403 again
  await render((m, url) => (url.pathname === "/api/auth/refresh" ? [200, { accessToken: "t2", user: { id: "A1", role: "ADMIN" } }] : url.pathname.endsWith("/payment-reconciliation") ? [403, { success: false }] : undefined), async (ui) => {
    await ui.wait(80);
    assert.ok(ui.text().includes("You don't have access to payment reconciliation"));
    assert.equal(ui.button("Try again"), undefined);
  });
});
