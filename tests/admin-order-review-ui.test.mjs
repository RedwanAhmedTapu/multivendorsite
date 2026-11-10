// tests/admin-order-review-ui.test.mjs
//
// /admin-dashboard/order-review — the admin order review queue.
//   1. presentation rules (pure): payment received / order not confirmed /
//      stock released are separate facts; an action the backend refuses is
//      explained, never offered; error wording for 409 / 403 / network;
//   2. runtime (jsdom, real store + RTK Query, fetch stubbed): server-side
//      queue / search / page params and per-queue counts; detail sheet; a
//      stock-released paid order offers only "Cancel order" (refund) with the
//      no-re-reservation explanation; approve goes through a confirmation
//      dialog to PATCH …/approve; reject needs a reason; a 409 is shown and
//      the queue is refreshed; loading → empty, error + retry, 403 states.
//   node --test tests/admin-order-review-ui.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { register, createRequire } from "node:module";
import { format } from "node:util";

register("./support/tsx-loader.mjs", import.meta.url);
const require = createRequire(import.meta.url);
const L = await import("../src/lib/orders/order-review.ts");

const ITEM = (over = {}) => ({
  id: "O1", orderNumber: "ORD-1001", createdAt: "2026-10-18T08:00:00.000Z", totalAmount: "1060", paymentMethod: "COD",
  orderStatus: "PENDING", paymentStatus: "PENDING", riskScore: 72, highRisk: true, reviewReason: "HIGH_RISK_COD",
  stockReserved: true, reservationReleasedAt: null, payment: null,
  customer: { id: "U1", name: "Rahim Uddin", email: "r@example.com", phone: "01700000000", verified: false, memberSince: "2026-10-15T00:00:00.000Z", problemOrders: 2 },
  shipTo: { name: "Rahim Uddin", city: "Dhaka", address: "House 1, Road 2" },
  vendors: [{ id: "V1", storeName: "Store One", subtotal: "1000", items: 2 }],
  actions: { canApprove: true, canReject: true, canCancel: true },
  ...over,
});
const HELD = ITEM({
  id: "O2", orderNumber: "ORD-1002", paymentMethod: "SSLCOMMERZ", paymentStatus: "PAID", riskScore: 5, highRisk: false,
  reviewReason: "PAID_STOCK_RELEASED", stockReserved: false, reservationReleasedAt: "2026-10-18T09:00:00.000Z",
  payment: { method: "SSLCOMMERZ", status: "PAID", amount: "1060", paidAt: "2026-10-18T09:30:00.000Z", stockHold: true },
  actions: { canApprove: false, canReject: false, canCancel: true },
});
const LIST = (orders, { total = orders.length, totalPages = 1, page = 1, counts = { cod: 1, paid: 1 } } = {}) => [
  200, { success: true, data: orders, counts, pagination: { page, limit: 20, total, totalPages }, count: orders.length },
];

// ── 1. rules ────────────────────────────────────────────────────────────────

test("facts keep payment, order confirmation and stock reservation separate", () => {
  const cod = L.reviewFacts(ITEM());
  assert.equal(cod.payment.value, "Cash on delivery: not collected");
  assert.equal(cod.order.value, "Not confirmed: awaiting review");
  assert.equal(cod.stock.value, "Reserved");
  const held = L.reviewFacts(HELD);
  assert.deepEqual([held.payment.value, held.payment.tone], ["Payment received", "success"]);
  assert.equal(held.order.value, "Not confirmed: awaiting review", "a received payment is never shown as a confirmed order");
  assert.deepEqual([held.stock.value, held.stock.tone], ["Reservation released", "danger"]);
});

test("unavailable actions are explained from the backend flags; no re-reservation is promised", () => {
  assert.equal(L.unavailableReason(ITEM(), "approve"), null);
  assert.match(L.unavailableReason(HELD, "approve"), /stock reservation was released.*doesn't re-reserve/);
  assert.match(L.unavailableReason(HELD, "reject"), /paid order can't be rejected.*refunded/);
  assert.equal(L.unavailableReason(HELD, "cancel"), null);
  assert.match(L.ACTION_COPY.cancel.body(HELD), /one pending full refund/);
  assert.doesNotMatch(L.ACTION_COPY.cancel.body(ITEM()), /refund/);
  assert.match(L.ACTION_COPY.approve.body(ITEM()), /manual admin override/);
  assert.equal(L.actionErrorMessage({ status: 409, data: { message: "Stock reservation was released" } }), "Stock reservation was released");
  assert.match(L.actionErrorMessage({ status: 409, data: {} }), /changed while you were reviewing/);
  assert.match(L.actionErrorMessage({ status: 403 }), /permission/);
  assert.match(L.actionErrorMessage({ status: "FETCH_ERROR" }), /Couldn't reach the server/);
  assert.equal(L.formatMoney("1060"), "৳1,060.00");
});

// ── 2. runtime ──────────────────────────────────────────────────────────────

let JSDOM = null;
try {
  ({ JSDOM } = require("jsdom"));
} catch {
  JSDOM = null;
}
const skip = JSDOM ? false : "jsdom is not installed (it is only a transitive dependency)";

/** Renders the queue against `handler(method, url, body) → [status, json]`. */
async function render(handler, fn) {
  const dom = new JSDOM("<!doctype html><html><body><div id=root></div></body></html>", { url: "http://localhost:3000/admin-dashboard/order-review", pretendToBeVisual: true });
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
    const body = req.method === "GET" ? undefined : await req.text().then((t) => (t ? JSON.parse(t) : undefined));
    calls.push({ method: req.method, path: url.pathname, query: Object.fromEntries(url.searchParams), body });
    const [status, json] = handler(req.method, url, body, calls) ?? [500, {}];
    return new Response(JSON.stringify(json), { status, headers: { "content-type": "application/json" } });
  };
  const React = await import("react");
  const { act } = React;
  const { createRoot } = await import("react-dom/client");
  const { Provider } = await import("react-redux");
  const { configureStore } = await import("@reduxjs/toolkit");
  const { adminOrderApi } = await import("../src/features/adminOrderApi.ts");
  const authReducer = (await import("../src/features/authSlice.ts")).default;
  const { OrderReviewQueue } = await import("../src/components/orders/OrderReviewQueue.tsx");
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
      errors.push(String(e?.message || e) + (e?.errors ? ": " + e.errors.map((x) => x?.message ?? x).join(" | ") : ""));
    }
  };
  const wait = (ms) => run(() => new Promise((r) => setTimeout(r, ms)));
  const doc = dom.window.document;
  const ui = {
    doc,
    calls,
    wait,
    text: () => doc.body.textContent.replace(/\s+/g, " "),
    button: (label) => [...doc.querySelectorAll("button")].find((b) => b.textContent.trim().startsWith(label) || b.getAttribute("aria-label") === label || [...b.querySelectorAll(".sr-only")].some((x) => x.textContent.trim() === label)),
    dialog: () => doc.querySelector('[role="alertdialog"]'),
    sheet: () => doc.querySelector('[role="dialog"]'),
    click: async (el) => {
      assert.ok(el, "element to click exists");
      await run(async () => el.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true })));
      await wait(60);
    },
    type: async (el, value) => {
      assert.ok(el, "field exists");
      const proto = el.tagName === "TEXTAREA" ? dom.window.HTMLTextAreaElement.prototype : dom.window.HTMLInputElement.prototype;
      await run(async () => {
        Object.getOwnPropertyDescriptor(proto, "value").set.call(el, value);
        el.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
      });
    },
    submit: async (form) => {
      await run(async () => form.dispatchEvent(new dom.window.Event("submit", { bubbles: true, cancelable: true })));
      await wait(60);
    },
    errors,
  };
  try {
    await run(async () => root.render(React.createElement(Provider, { store }, React.createElement(OrderReviewQueue))));
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
const reactErrors = (ui) => ui.errors.filter((m) => !/not wrapped in act|ReactDOMTestUtils|Missing `Description`|DialogContent/.test(m));
const lists = (calls) => calls.filter((c) => c.method === "GET" && c.path === "/api/admin-orders/fraud-review");

test("list: real counts per queue, reason badges and separate facts; queue, search and page are server-side", { skip }, async () => {
  await render((m, url) => (url.pathname.endsWith("/fraud-review") ? LIST([ITEM(), HELD], { total: 45, totalPages: 3, counts: { cod: 30, paid: 15 } }) : undefined), async (ui) => {
    const t = ui.text();
    assert.ok(t.includes("ORD-1001") && t.includes("High-risk COD") && t.includes("ORD-1002") && t.includes("Paid, stock released"), t);
    assert.ok(t.includes("Payment: Payment received") && t.includes("Stock: Reservation released") && t.includes("Payment: Cash on delivery: not collected"), t);
    assert.ok(ui.button("All").textContent.includes("45") && ui.button("Cash on delivery").textContent.includes("30") && ui.button("Paid online").textContent.includes("15"));
    assert.deepEqual(lists(ui.calls)[0].query, { page: "1", limit: "20" });

    await ui.click(ui.button("Paid online"));
    assert.equal(ui.button("Paid online").getAttribute("aria-pressed"), "true");
    assert.deepEqual(lists(ui.calls).at(-1).query, { page: "1", limit: "20", queue: "paid" });

    await ui.type(ui.doc.getElementById("order-review-search"), "  ORD-10 ");
    await ui.submit(ui.doc.querySelector('form[role="search"]'));
    assert.deepEqual(lists(ui.calls).at(-1).query, { page: "1", limit: "20", queue: "paid", search: "ORD-10" });

    await ui.click(ui.button("Next"));
    assert.equal(lists(ui.calls).at(-1).query.page, "2");
    assert.ok(ui.text().includes("Page 2 of 3"));
    assert.deepEqual(reactErrors(ui), []);
  });
});

test("stock-released paid order: no Approve / Reject — only Cancel (pending refund) with the no-re-reservation explanation", { skip }, async () => {
  await render((m, url) => (url.pathname.endsWith("/fraud-review") ? LIST([HELD]) : [500, {}]), async (ui) => {
    await ui.click(ui.button("Review order ORD-1002"));
    const sheet = ui.sheet();
    assert.ok(sheet, "detail sheet open");
    const s = sheet.textContent;
    assert.ok(s.includes("Stock reservation released") && s.includes("can't be re-reserved") && s.includes("Paid after the stock was released"), s);
    const buttons = [...sheet.querySelectorAll("button")].map((b) => b.textContent.trim());
    assert.ok(!buttons.includes("Approve") && !buttons.includes("Reject"), buttons.join("|"));
    assert.ok(buttons.includes("Cancel order"));
    assert.ok(s.includes("can't be approved because its stock reservation was released") && s.includes("paid order can't be rejected"));

    await ui.click([...sheet.querySelectorAll("button")].find((b) => b.textContent.trim() === "Cancel order"));
    assert.ok(ui.dialog().textContent.includes("one pending full refund"));
    const confirm = [...ui.dialog().querySelectorAll("button")].find((b) => b.textContent.trim() === "Cancel order");
    assert.equal(confirm.disabled, true, "a reason is required");
    assert.equal(ui.calls.filter((c) => c.method !== "GET").length, 0, "nothing sent before confirmation");
  });
});

test("approve: confirmation dialog → PATCH /approve → success closes the sheet and the queue reloads", { skip }, async () => {
  let resolved = false;
  await render((m, url) => {
    if (m === "PATCH" && url.pathname === "/api/admin-orders/O1/approve") return (resolved = true), [200, { success: true, data: { success: true } }];
    if (url.pathname.endsWith("/fraud-review")) return resolved ? LIST([], { counts: { cod: 0, paid: 0 } }) : LIST([ITEM()]);
  }, async (ui) => {
    await ui.click(ui.button("Review order ORD-1001"));
    const buttons = [...ui.sheet().querySelectorAll("button")].map((b) => b.textContent.trim());
    assert.ok(buttons.includes("Approve") && buttons.includes("Reject") && !buttons.includes("Cancel order"), buttons.join("|"));
    await ui.click([...ui.sheet().querySelectorAll("button")].find((b) => b.textContent.trim() === "Approve"));
    assert.ok(ui.dialog().textContent.includes("manual admin override"));
    assert.equal(ui.calls.filter((c) => c.method === "PATCH").length, 0, "the sheet button only opens the dialog");
    await ui.click([...ui.dialog().querySelectorAll("button")].find((b) => b.textContent.trim() === "Approve order"));
    await ui.wait(120);
    assert.deepEqual(ui.calls.filter((c) => c.method === "PATCH").map((c) => c.path), ["/api/admin-orders/O1/approve"]);
    assert.equal(ui.dialog(), null);
    assert.equal(ui.sheet(), null);
    assert.ok(ui.text().includes("Nothing to review"), ui.text());
  });
});

test("reject needs a reason; a 409 conflict is shown in the dialog and the queue is refreshed", { skip }, async () => {
  await render((m, url) => {
    if (m === "PATCH" && url.pathname === "/api/admin-orders/O1/reject") return [409, { success: false, message: "Order status changed — reload and retry", code: "ORDER_STATUS_CHANGED" }];
    if (url.pathname.endsWith("/fraud-review")) return LIST([ITEM()]);
  }, async (ui) => {
    await ui.click(ui.button("Review order ORD-1001"));
    await ui.click([...ui.sheet().querySelectorAll("button")].find((b) => b.textContent.trim() === "Reject"));
    const confirm = () => [...ui.dialog().querySelectorAll("button")].find((b) => b.textContent.trim() === "Reject order");
    assert.equal(confirm().disabled, true);
    await ui.type(ui.dialog().querySelector("textarea"), "   ");
    assert.equal(confirm().disabled, true, "whitespace is not a reason");
    await ui.type(ui.dialog().querySelector("textarea"), "Customer unreachable");
    const before = lists(ui.calls).length;
    await ui.click(confirm());
    await ui.wait(120);
    const patch = ui.calls.find((c) => c.method === "PATCH");
    assert.deepEqual(patch.body, { reason: "Customer unreachable" });
    assert.ok(ui.dialog().querySelector('[role="alert"]').textContent.includes("Order status changed"));
    assert.ok(lists(ui.calls).length > before, "queue refetched after the conflict");
  });
});

test("loading → empty; error with retry; 403 explains the missing permission without a retry loop", { skip }, async () => {
  await render((m, url) => (url.pathname.endsWith("/fraud-review") ? LIST([], { counts: { cod: 0, paid: 0 } }) : undefined), async (ui) => {
    assert.ok(ui.text().includes("Nothing to review") && ui.text().includes("No pending orders need an admin decision"));
  });
  let fail = true;
  await render((m, url) => (url.pathname.endsWith("/fraud-review") ? (fail ? [500, { success: false, message: "boom" }] : LIST([ITEM()])) : undefined), async (ui) => {
    assert.ok(ui.text().includes("Couldn't load the review queue"));
    assert.ok(!ui.text().includes("boom"), "no raw server message");
    fail = false;
    await ui.click(ui.button("Try again"));
    await ui.wait(80);
    assert.ok(ui.text().includes("ORD-1001"));
  });
  // The shared baseQueryWithReauth refreshes once on 401/403 and retries; a valid
  // session that lacks the permission gets 403 again — that is what is shown.
  await render((m, url) => (url.pathname === "/api/auth/refresh" ? [200, { accessToken: "token-2", user: { id: "A1", name: "Admin", role: "ADMIN" } }] : url.pathname.endsWith("/fraud-review") ? [403, { success: false, message: "Forbidden" }] : undefined), async (ui) => {
    await ui.wait(80);
    assert.ok(ui.text().includes("You don't have access to order review") && ui.text().includes("Order management permission"));
    assert.equal(ui.button("Try again"), undefined);
  });
});
