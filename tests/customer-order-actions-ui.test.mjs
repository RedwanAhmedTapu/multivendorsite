// tests/customer-order-actions-ui.test.mjs
//
// Customer order detail: Pay Now, cancel, refund status.
//   1. rules (pure): every persisted refund state worded; only https gateway
//      URLs are followed; Pay Now / cancel error wording (409 in progress with
//      minutes, courier conflict message from the backend, network);
//   2. runtime (jsdom, real store + RTK Query, fetch stubbed): actions follow
//      the backend's customerActions; Pay Now posts once and follows only the
//      returned https URL (no success claim); refusals shown; cancel needs a
//      confirmation + reason, sends it, shows a 409; blocked reasons explained;
//      refund rows newest first with their stored status.
//   node --test tests/customer-order-actions-ui.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { register, createRequire } from "node:module";
import { format } from "node:util";

register("./support/tsx-loader.mjs", import.meta.url);
const require = createRequire(import.meta.url);
const L = await import("../src/lib/orders/customer-order-actions.ts");

const ORDER = (over = {}) => ({
  id: "O1", orderNumber: "ORD-1001", status: "PENDING", paymentStatus: "PENDING", totalAmount: "1560",
  customerActions: { canPayNow: true, canCancel: true, cancelBlockedReason: null }, ...over,
});

// ── 1. rules ────────────────────────────────────────────────────────────────

test("refund states: all seven persisted values worded; unknown values never crash", () => {
  for (const s of ["PENDING", "APPROVED", "PROCESSING", "REFUNDED", "FAILED", "REJECTED", "CANCELLED"]) {
    const c = L.refundCopy(s);
    assert.ok(c.label && c.tone && c.description, s);
  }
  assert.equal(L.refundCopy("REFUNDED").tone, "success");
  assert.equal(L.refundCopy("PENDING").label, "Requested");
  assert.doesNotMatch(L.refundCopy("PENDING").description, /refunded|credited|returned to your/i, "a request is not a completed refund");
  assert.equal(L.refundCopy("SOMETHING_NEW").label, "something new");
  const sorted = L.sortRefunds([{ id: "a", createdAt: "2026-10-01T00:00:00Z" }, { id: "b", createdAt: "2026-10-05T00:00:00Z" }]);
  assert.deepEqual(sorted.map((r) => r.id), ["b", "a"]);
});

test("only an absolute https gateway URL is followed", () => {
  assert.equal(L.safeGatewayUrl("https://sandbox.sslcommerz.com/EasyCheckOut/x"), "https://sandbox.sslcommerz.com/EasyCheckOut/x");
  for (const bad of ["http://gw.example/pay", "javascript:alert(1)", "/payment/success", "", null, undefined, 42, "data:text/html,hi"]) {
    assert.equal(L.safeGatewayUrl(bad), null, String(bad));
  }
});

test("error wording: in-progress with minutes; backend conflict message for cancel; generic otherwise", () => {
  assert.match(L.payNowErrorMessage({ status: 409, data: { code: "PAYMENT_IN_PROGRESS", retryAfterSeconds: 200 } }), /try again in about 4 minutes/);
  assert.match(L.payNowErrorMessage({ status: 409, data: { code: "PAYMENT_IN_PROGRESS", retryAfterSeconds: 30 } }), /about 1 minute\./);
  assert.equal(L.payNowErrorMessage({ status: 409, data: { code: "STOCK_UNAVAILABLE", message: "Some items are gone." } }), "Some items are gone.");
  assert.match(L.payNowErrorMessage({ status: "FETCH_ERROR" }), /connection/);
  assert.match(L.payNowErrorMessage({ status: 500, data: {} }), /couldn't open the payment page/);
  assert.equal(L.cancelErrorMessage({ status: 409, data: { code: "COURIER_BOOKING_ACTIVE", message: "Courier booked." } }), "Courier booked.");
  assert.match(L.cancelErrorMessage({ status: 400, data: { error: "Order cannot be cancelled by user after dispatch (status SHIPPED)" } }), /handed to the courier/);
  assert.match(L.cancelErrorMessage({ status: 500, data: { error: "TypeError: x is undefined" } }), /couldn't cancel/);
  assert.ok(!L.cancelErrorMessage({ status: 500, data: { error: "TypeError: x" } }).includes("TypeError"), "no raw server errors");
});

// ── 2. runtime ──────────────────────────────────────────────────────────────

let JSDOM = null;
try {
  ({ JSDOM } = require("jsdom"));
} catch {
  JSDOM = null;
}
const skip = JSDOM ? false : "jsdom is not installed (it is only a transitive dependency)";

async function render(element, handler, fn) {
  const dom = new JSDOM("<!doctype html><html><body><div id=root></div></body></html>", { url: "http://localhost:3000/user-dashboard/orders/O1", pretendToBeVisual: true });
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
    const text = req.method === "GET" ? "" : await req.text();
    const body = text ? JSON.parse(text) : undefined;
    calls.push({ method: req.method, path: url.pathname, body });
    const [status, json] = (await handler(req.method, url, body)) ?? [500, {}];
    return new Response(JSON.stringify(json), { status, headers: { "content-type": "application/json" } });
  };
  const React = await import("react");
  const { act } = React;
  const { createRoot } = await import("react-dom/client");
  const { Provider } = await import("react-redux");
  const { configureStore } = await import("@reduxjs/toolkit");
  const { userOrderApi } = await import("../src/features/userorderApi.ts");
  const authReducer = (await import("../src/features/authSlice.ts")).default;
  const mods = {
    ...(await import("../src/components/orders/customer/OrderCustomerActions.tsx")),
    ...(await import("../src/components/orders/customer/OrderRefundList.tsx")),
  };
  const store = configureStore({
    reducer: { auth: authReducer, [userOrderApi.reducerPath]: userOrderApi.reducer },
    middleware: (gd) => gd({ serializableCheck: false, immutableCheck: false }).concat(userOrderApi.middleware),
    preloadedState: { auth: { user: { id: "U1", name: "Customer" }, accessToken: "token" } },
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
    button: (label, scope = doc) => [...scope.querySelectorAll("button")].find((b) => b.textContent.trim().startsWith(label)),
    dialog: () => doc.querySelector('[role="alertdialog"]'),
    click: async (el) => {
      assert.ok(el, "element to click exists");
      await run(async () => el.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true })));
      await wait(60);
    },
    errors,
  };
  try {
    await run(async () => root.render(React.createElement(Provider, { store }, element(React, mods))));
    await wait(40);
    await fn(ui);
  } finally {
    await run(async () => root.unmount());
    store.dispatch(userOrderApi.util.resetApiState());
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
const actions = (order, redirect) => (R, m) => R.createElement(m.OrderCustomerActions, { order, redirect });
const reactErrors = (ui) => ui.errors.filter((m) => !/not wrapped in act|ReactDOMTestUtils|Missing `Description`|DialogContent/.test(m));

test("Pay Now: one POST, follows only the returned https gateway URL, never claims success", { skip }, async () => {
  const redirects = [];
  let release;
  const gate = new Promise((r) => (release = r));
  await render(
    actions(ORDER(), (u) => redirects.push(u)),
    async (m, url) => {
      if (m === "POST" && url.pathname === "/api/user-orders/O1/pay-now") {
        await gate;
        return [200, { success: true, data: { gatewayPageURL: "https://sandbox.sslcommerz.com/EasyCheckOut/abc", transactionId: "TXN_1" } }];
      }
    },
    async (ui) => {
      assert.ok(ui.text().includes("Payment pending") && ui.text().includes("Pay ৳1,560.00"));
      const pay = ui.button("Pay ৳1,560.00");
      await ui.click(pay);
      assert.ok(ui.text().includes("Preparing payment…"));
      await ui.click(ui.button("Preparing payment…"));
      assert.equal(ui.calls.filter((c) => c.method === "POST").length, 1, "a second click while loading sends nothing");
      release();
      await ui.wait(80);
      assert.deepEqual(redirects, ["https://sandbox.sslcommerz.com/EasyCheckOut/abc"]);
      assert.ok(ui.text().includes("Opening payment page…"));
      assert.doesNotMatch(ui.text(), /payment (successful|complete)|paid successfully/i);
      assert.deepEqual(ui.calls[0].body, {});
      assert.deepEqual(reactErrors(ui), []);
    },
  );
});

test("Pay Now: a non-https URL is not followed; 409 in progress and stock errors are explained", { skip }, async () => {
  const redirects = [];
  let reply = [200, { success: true, data: { gatewayPageURL: "http://gw.example/pay", transactionId: "T" } }];
  await render(actions(ORDER(), (u) => redirects.push(u)), async (m) => (m === "POST" ? reply : undefined), async (ui) => {
    await ui.click(ui.button("Pay ৳1,560.00"));
    assert.deepEqual(redirects, []);
    assert.match(ui.doc.querySelector('[role="alert"]').textContent, /couldn't open the payment page/);
    reply = [409, { success: false, code: "PAYMENT_IN_PROGRESS", message: "x", retryAfterSeconds: 290 }];
    await ui.click(ui.button("Pay ৳1,560.00"));
    assert.match(ui.doc.querySelector('[role="alert"]').textContent, /about 5 minutes/);
    reply = [409, { success: false, code: "STOCK_UNAVAILABLE", message: "Some items in this order are no longer in stock, so it can't be paid." }];
    await ui.click(ui.button("Pay ৳1,560.00"));
    assert.match(ui.doc.querySelector('[role="alert"]').textContent, /no longer in stock/);
    assert.deepEqual(redirects, []);
  });
});

test("cancel (paid order): confirmation with refund wording, reason required, sent with the request", { skip }, async () => {
  const paid = ORDER({ status: "CONFIRMED", paymentStatus: "PAID", customerActions: { canPayNow: false, canCancel: true, cancelBlockedReason: null } });
  await render(actions(paid), (m, url) => (m === "PATCH" && url.pathname === "/api/user-orders/O1/cancel" ? [200, { success: true, data: { ...paid, status: "CANCELLED", refunds: [{ id: "R1" }] } }] : undefined), async (ui) => {
    assert.equal(ui.button("Pay"), undefined, "no Pay Now for a paid order");
    assert.ok(ui.text().includes("The amount you paid will be refunded"));
    await ui.click(ui.button("Cancel order"));
    const dlg = ui.dialog();
    assert.ok(dlg.textContent.includes("A refund request for the amount you paid is created"));
    const confirm = () => [...ui.dialog().querySelectorAll("button")].find((b) => b.textContent.trim() === "Cancel order");
    assert.equal(confirm().disabled, true, "a reason must be chosen");
    await ui.click([...dlg.querySelectorAll('input[type="radio"]')].find((i) => i.value === "Ordered by mistake"));
    assert.equal(confirm().disabled, false);
    await ui.click(confirm());
    await ui.wait(80);
    const patch = ui.calls.find((c) => c.method === "PATCH");
    assert.deepEqual(patch.body, { reason: "Ordered by mistake" });
    assert.equal(ui.dialog(), null, "closed after success");
  });
});

test("cancel refused by the backend (409 courier booking) is shown in the dialog", { skip }, async () => {
  await render(
    actions(ORDER()),
    (m) => (m === "PATCH" ? [409, { success: false, code: "COURIER_BOOKING_ACTIVE", message: "This order has a courier booking that is already in progress, so it can't be cancelled here." }] : [200, { success: true, data: ORDER() }]),
    async (ui) => {
      assert.ok(ui.text().includes("Nothing has been charged") === false, "dialog closed initially");
      await ui.click(ui.button("Cancel order"));
      assert.ok(ui.dialog().textContent.includes("Nothing has been charged for this order"));
      await ui.click(ui.dialog().querySelector('input[type="radio"]'));
      await ui.click([...ui.dialog().querySelectorAll("button")].find((b) => b.textContent.trim() === "Cancel order"));
      await ui.wait(80);
      assert.match(ui.dialog().querySelector('[role="alert"]').textContent, /courier booking that is already in progress/);
    },
  );
});

test("blocked / absent actions: explanation instead of a button; nothing for cancelled orders or without the backend field", { skip }, async () => {
  await render(actions(ORDER({ status: "SHIPPED", paymentStatus: "PAID", customerActions: { canPayNow: false, canCancel: false, cancelBlockedReason: "DISPATCHED" } })), () => undefined, async (ui) => {
    assert.equal(ui.button("Cancel order"), undefined);
    assert.ok(ui.text().includes("already been handed to the courier"));
  });
  await render(actions(ORDER({ status: "PACKAGING", customerActions: { canPayNow: false, canCancel: false, cancelBlockedReason: "COURIER_BOOKING_ACTIVE" } })), () => undefined, async (ui) => {
    assert.ok(ui.text().includes("courier pickup is already being arranged") && ui.text().includes("Contact support"));
  });
  await render(actions(ORDER({ status: "CANCELLED", customerActions: { canPayNow: false, canCancel: false, cancelBlockedReason: "ALREADY_CANCELLED" } })), () => undefined, async (ui) => {
    assert.equal(ui.doc.getElementById("root").textContent, "");
  });
  await render(actions(ORDER({ customerActions: undefined })), () => undefined, async (ui) => {
    assert.equal(ui.doc.getElementById("root").textContent, "", "no guessing without the backend's actions");
  });
});

test("refund list: stored statuses, newest first; nothing when there are no refunds", { skip }, async () => {
  const refunds = [
    { id: "R1", amount: "500", reason: "Order cancelled", status: "REFUNDED", createdAt: "2026-10-01T00:00:00Z" },
    { id: "R2", amount: "1060.5", reason: null, status: "PENDING", createdAt: "2026-10-10T00:00:00Z" },
  ];
  await render((R, m) => R.createElement(m.OrderRefundList, { refunds }), () => undefined, async (ui) => {
    const items = [...ui.doc.querySelectorAll("li")].map((li) => li.textContent);
    assert.ok(items[0].includes("৳1,060.50") && items[0].includes("Requested"), items[0]);
    assert.ok(items[1].includes("৳500.00") && items[1].includes("Refunded") && items[1].includes("Reason: Order cancelled"), items[1]);
  });
  await render((R, m) => R.createElement(m.OrderRefundList, { refunds: [] }), () => undefined, async (ui) => assert.equal(ui.doc.getElementById("root").textContent, ""));
});
