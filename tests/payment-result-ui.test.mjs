// tests/payment-result-ui.test.mjs
//
// /payment/success | /payment/failed | /payment/cancelled
//   1. the screen decision (pure): ONLY persisted state CONFIRMED shows a
//      success screen; the landing route never overrides the backend; 401 →
//      sign in, 404 → not found, other errors → retryable error; no tran_id →
//      an honest "couldn't confirm" screen; polling only while PENDING;
//   2. runtime (jsdom, real store + RTK Query, fetch stubbed): every state's
//      heading, details and actions; limited polling that stops on the final
//      state and after its budget; manual re-check; no request without a
//      transaction id or without a signed-in customer.
//   node --test tests/payment-result-ui.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { register, createRequire } from "node:module";
import { format } from "node:util";

register("./support/tsx-loader.mjs", import.meta.url);
const require = createRequire(import.meta.url);
const L = await import("../src/lib/payment/payment-result.ts");

const RESULT = (over = {}) => ({
  transactionId: "TXN_1_O1", state: "CONFIRMED", purpose: "order_payment", holdReason: null,
  amount: "1560", method: "SSLCOMMERZ", paidAt: "2026-10-18T10:00:00.000Z",
  order: { id: "O1", orderNumber: "ORD-1", status: "CONFIRMED" }, ...over,
});

// ── 1. the decision ─────────────────────────────────────────────────────────

test("only a persisted CONFIRMED state is a success; the landing route never overrides the backend", () => {
  const key = (over) => L.resultScreenKey({ landing: "success", transactionId: "T1", isAuthenticated: true, query: { isLoading: false, isError: false }, pollingExpired: false, ...over });
  assert.equal(key({ query: { result: RESULT() } }), "CONFIRMED");
  for (const landing of ["success", "failed", "cancelled"]) {
    assert.equal(key({ landing, query: { result: RESULT() } }), "CONFIRMED", `${landing}: backend truth`);
    assert.equal(key({ landing, query: { result: RESULT({ state: "FAILED" }) } }), "FAILED", `${landing}: backend truth`);
  }
  assert.equal(key({ query: { result: RESULT({ state: "HELD", holdReason: "STOCK" }) } }), "HELD_STOCK");
  assert.equal(key({ query: { result: RESULT({ state: "HELD", holdReason: "REVIEW" }) } }), "HELD_REVIEW");
  assert.equal(key({ query: { result: RESULT({ state: "PENDING" }) } }), "PENDING");
  assert.equal(key({ query: { result: RESULT({ state: "PENDING" }) }, pollingExpired: true }), "PENDING_TIMEOUT");
  assert.equal(key({ query: { result: RESULT({ state: "CONFIRMED", purpose: "delivery_fee" }) } }), "DELIVERY_FEE_PAID");
  for (const s of ["CANCELLED", "ORDER_CANCELLED", "REFUNDED"]) assert.equal(key({ query: { result: RESULT({ state: s }) } }), s);
  assert.equal(key({ query: { isLoading: true, isError: false } }), "LOADING");
  assert.equal(key({ query: { isError: true, errorStatus: 404 } }), "NOT_FOUND");
  assert.equal(key({ query: { isError: true, errorStatus: 401 } }), "SIGN_IN");
  assert.equal(key({ query: { isError: true, errorStatus: 500 } }), "ERROR");
  assert.equal(key({ query: { isError: true, errorStatus: "FETCH_ERROR" } }), "ERROR");
  assert.equal(key({ isAuthenticated: false }), "SIGN_IN");
  assert.equal(key({ transactionId: null }), "UNVERIFIED");
  // Every non-CONFIRMED screen is not a success tone.
  for (const k of ["LOADING", "SIGN_IN", "UNVERIFIED", "NOT_FOUND", "ERROR", "HELD_STOCK", "HELD_REVIEW", "PENDING", "PENDING_TIMEOUT", "FAILED", "CANCELLED", "ORDER_CANCELLED", "REFUNDED"]) {
    for (const landing of ["success", "failed", "cancelled"]) assert.notEqual(L.resultScreenCopy(k, landing).tone, "success", `${k}/${landing}`);
  }
  assert.equal(L.resultScreenCopy("UNVERIFIED", "success").title, "We couldn't confirm this payment", "no success claim without a reference");
});

test("polling only while PENDING and within budget; copy never claims money was or wasn't taken without proof", () => {
  assert.equal(L.shouldPoll(RESULT({ state: "PENDING" }), false), true);
  assert.equal(L.shouldPoll(RESULT({ state: "PENDING" }), true), false);
  assert.equal(L.shouldPoll(RESULT({ state: "CONFIRMED" }), false), false);
  assert.equal(L.shouldPoll(undefined, false), false);
  const all = ["LOADING", "SIGN_IN", "UNVERIFIED", "NOT_FOUND", "ERROR", "CONFIRMED", "DELIVERY_FEE_PAID", "HELD_STOCK", "HELD_REVIEW", "PENDING", "PENDING_TIMEOUT", "FAILED", "CANCELLED", "ORDER_CANCELLED", "REFUNDED"];
  for (const k of all) for (const landing of ["success", "failed", "cancelled"]) {
    const c = L.resultScreenCopy(k, landing);
    assert.ok(c.title && c.body && c.badge, k);
    assert.doesNotMatch(c.body, /no money was taken|money has been returned|refunded to your account/i, `${k}: no unverifiable money claims`);
  }
  assert.equal(L.formatPaymentAmount("1560"), "৳1,560.00");
  assert.equal(L.formatPaymentAmount(null), "—");
  assert.equal(L.paymentMethodLabel("SSLCOMMERZ"), "Online payment (SSLCommerz)");
});

test("Phase 5: money received but not applied (UNAPPLIED) is never a success, never pending, and promises no refund", () => {
  const key = (landing) => L.resultScreenKey({ landing, transactionId: "T1", isAuthenticated: true, query: { isLoading: false, isError: false, result: RESULT({ state: "UNAPPLIED", unappliedReason: "ORDER_ALREADY_PAID" }) }, pollingExpired: false });
  for (const landing of ["success", "failed", "cancelled"]) {
    assert.equal(key(landing), "UNAPPLIED", landing);
    const c = L.resultScreenCopy("UNAPPLIED", landing);
    assert.notEqual(c.tone, "success");
    assert.match(c.body, /received this payment, but it couldn't be applied/);
    assert.doesNotMatch(c.body, /will be refunded|has been refunded|refunded to/i, "no refund promise");
  }
  assert.equal(L.shouldPoll(RESULT({ state: "UNAPPLIED" }), false), false);
});

test("Phase 5: an unverified failure report is shown as 'not completed' (never success, never 'failed' as fact), and polling continues", () => {
  const result = RESULT({ state: "PENDING", paidAt: null, gatewayReport: "FAILED" });
  for (const [landing, expired] of [["failed", false], ["success", false], ["cancelled", true]]) {
    const k = L.resultScreenKey({ landing, transactionId: "T1", isAuthenticated: true, query: { isLoading: false, isError: false, result }, pollingExpired: expired });
    assert.equal(k, "REPORTED_NOT_COMPLETED", `${landing}/${expired}`);
  }
  const c = L.resultScreenCopy("REPORTED_NOT_COMPLETED", "failed");
  assert.notEqual(c.tone, "success");
  assert.match(c.body, /reported that this payment didn't go through, and the payment provider hasn't confirmed otherwise/);
  assert.equal(L.shouldPoll(result, false), true, "a late confirmation is still picked up");
});

// ── 2. runtime ──────────────────────────────────────────────────────────────

let JSDOM = null;
try {
  ({ JSDOM } = require("jsdom"));
} catch {
  JSDOM = null;
}
const skip = JSDOM ? false : "jsdom is not installed (it is only a transitive dependency)";

/** Renders PaymentResultView for `landing` with `search` and a backend that answers `responses` in order (last repeats). */
async function render({ landing = "success", search = "tran_id=TXN_1_O1", signedIn = true, responses = [], props = {} }, fn) {
  const dom = new JSDOM("<!doctype html><html><body><div id=root></div></body></html>", { url: `http://localhost:3000/payment/${landing}?${search}`, pretendToBeVisual: true });
  const g = globalThis;
  const saved = {};
  const setGlobal = (k, v) => {
    saved[k] = Object.getOwnPropertyDescriptor(g, k);
    Object.defineProperty(g, k, { value: v, configurable: true, writable: true });
  };
  for (const k of ["window", "document", "navigator", "HTMLElement", "Node", "Element", "MutationObserver", "getComputedStyle", "Event", "MouseEvent", "KeyboardEvent", "FocusEvent", "NodeFilter", "localStorage"]) setGlobal(k, k === "window" ? dom.window : dom.window[k]);
  for (const k of Object.getOwnPropertyNames(dom.window)) if (/^(HTML|SVG)\w*Element$/.test(k) && !(k in saved)) setGlobal(k, dom.window[k]);
  setGlobal("__searchParams", search);
  g.IS_REACT_ACT_ENVIRONMENT = true;
  const errors = [];
  const realError = console.error;
  console.error = (...a) => errors.push(format(...a));
  const calls = [];
  const realFetch = g.fetch;
  g.fetch = async (input, init) => {
    const req = input instanceof Request ? input : new Request(input, init);
    calls.push(new URL(req.url).pathname);
    const [status, body] = responses[Math.min(calls.length - 1, responses.length - 1)] ?? [500, {}];
    return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
  };
  const React = await import("react");
  const { act } = React;
  const { createRoot } = await import("react-dom/client");
  const { Provider } = await import("react-redux");
  const { configureStore } = await import("@reduxjs/toolkit");
  const { paymentApi } = await import("../src/features/paymentApi.ts");
  const authReducer = (await import("../src/features/authSlice.ts")).default;
  const { PaymentResultView } = await import("../src/components/payment/PaymentResultView.tsx");
  const store = configureStore({
    reducer: { auth: authReducer, [paymentApi.reducerPath]: paymentApi.reducer },
    middleware: (gd) => gd({ serializableCheck: false, immutableCheck: false }).concat(paymentApi.middleware),
    preloadedState: { auth: signedIn ? { user: { id: "U1", name: "Customer" }, accessToken: "token" } : { user: null, accessToken: null } },
  });
  const root = createRoot(dom.window.document.getElementById("root"));
  const run = async (f) => {
    try {
      await act(f);
    } catch (e) {
      errors.push(String(e?.message ?? e));
    }
  };
  const wait = (ms) => run(() => new Promise((r) => setTimeout(r, ms)));
  const doc = dom.window.document;
  const ui = {
    doc,
    calls,
    wait,
    text: () => doc.body.textContent.replace(/\s+/g, " "),
    title: () => doc.getElementById("payment-result-title")?.textContent,
    button: (label) => [...doc.querySelectorAll("button")].find((b) => b.textContent.trim().startsWith(label)),
    link: (label) => [...doc.querySelectorAll("a")].find((a) => a.textContent.trim().startsWith(label)),
    click: async (el) => {
      assert.ok(el, "element exists");
      await run(async () => el.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true })));
      await wait(40);
    },
    errors,
  };
  try {
    await run(async () => root.render(React.createElement(Provider, { store }, React.createElement(PaymentResultView, { landing, ...props }))));
    await wait(60);
    await fn(ui);
  } finally {
    await run(async () => root.unmount());
    store.dispatch(paymentApi.util.resetApiState());
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
const ok = (data) => [200, { success: true, data }];
const reactErrors = (ui) => ui.errors.filter((m) => !/not wrapped in act|ReactDOMTestUtils/.test(m));

test("confirmed: success heading, persisted details and order link — from the owner-scoped result endpoint", { skip }, async () => {
  await render({ responses: [ok(RESULT())] }, async (ui) => {
    assert.equal(ui.title(), "Payment successful");
    assert.deepEqual(ui.calls, ["/api/payment/result/TXN_1_O1"]);
    const t = ui.text();
    assert.ok(t.includes("#ORD-1") && t.includes("৳1,560.00") && t.includes("Online payment (SSLCommerz)") && t.includes("Paid · Confirmed"), t);
    assert.equal(ui.link("View order").getAttribute("href"), "/user-dashboard/orders/O1");
    assert.ok(ui.link("Continue shopping"));
    assert.deepEqual(reactErrors(ui), []);
  });
});

test("held for stock on the SUCCESS landing: never a success screen — on-hold explanation instead", { skip }, async () => {
  await render({ landing: "success", responses: [ok(RESULT({ state: "HELD", holdReason: "STOCK", order: { id: "O1", orderNumber: "ORD-1", status: "PENDING" } }))] }, async (ui) => {
    assert.equal(ui.title(), "Payment received — order on hold");
    assert.ok(!ui.text().includes("Payment successful"));
    assert.ok(ui.text().includes("Paid · On hold"));
  });
});

test("failed / cancelled come from the backend; a 'failed' landing whose payment is actually confirmed shows the truth", { skip }, async () => {
  await render({ landing: "failed", responses: [ok(RESULT({ state: "FAILED", paidAt: null }))] }, async (ui) => {
    assert.equal(ui.title(), "Payment failed");
    assert.ok(ui.link("View order") && ui.link("My orders"));
  });
  await render({ landing: "cancelled", responses: [ok(RESULT({ state: "CANCELLED", paidAt: null }))] }, async (ui) => assert.equal(ui.title(), "Payment cancelled"));
  await render({ landing: "failed", responses: [ok(RESULT())] }, async (ui) => assert.equal(ui.title(), "Payment successful"));
});

test("pending: polls on a short interval and stops as soon as the persisted state is final", { skip }, async () => {
  const pending = ok(RESULT({ state: "PENDING", paidAt: null }));
  await render({ responses: [pending, pending, ok(RESULT())], props: { pollIntervalMs: 60, pollTimeoutMs: 5000 } }, async (ui) => {
    assert.equal(ui.title(), "Confirming your payment");
    assert.ok(ui.text().includes("Checking automatically"));
    await ui.wait(400);
    assert.equal(ui.title(), "Payment successful", "updated by polling");
    const n = ui.calls.length;
    await ui.wait(300);
    assert.equal(ui.calls.length, n, "no more requests after the final state");
  });
});

test("pending past the polling budget: polling stops, 'taking longer' + manual check that re-reads the backend", { skip }, async () => {
  const pending = ok(RESULT({ state: "PENDING", paidAt: null }));
  await render({ responses: [pending], props: { pollIntervalMs: 50, pollTimeoutMs: 200 } }, async (ui) => {
    await ui.wait(450);
    assert.equal(ui.title(), "This is taking longer than usual");
    const n = ui.calls.length;
    assert.ok(n >= 2, "it polled before the budget ran out");
    await ui.wait(250);
    assert.equal(ui.calls.length, n, "polling stopped");
    await ui.click(ui.button("Check again"));
    assert.equal(ui.calls.length, n + 1, "manual re-check");
  });
});

test("404 (unknown or someone else's) → 'couldn't find'; server error → retry; no reference / signed out → no request at all", { skip }, async () => {
  await render({ responses: [[404, { success: false, message: "Payment not found" }]] }, async (ui) => {
    assert.equal(ui.title(), "We couldn't find this payment");
    assert.ok(!ui.text().includes("#ORD-1"), "nothing about the order is shown");
  });
  await render({ responses: [[500, { success: false }], ok(RESULT())] }, async (ui) => {
    assert.equal(ui.title(), "We couldn't load your payment result");
    await ui.click(ui.button("Try again"));
    assert.equal(ui.title(), "Payment successful");
  });
  await render({ search: "", responses: [ok(RESULT())] }, async (ui) => {
    assert.equal(ui.title(), "We couldn't confirm this payment");
    assert.deepEqual(ui.calls, []);
  });
  await render({ landing: "cancelled", search: "", responses: [] }, async (ui) => assert.equal(ui.title(), "Payment cancelled"));
  await render({ signedIn: false, responses: [ok(RESULT())] }, async (ui) => {
    assert.equal(ui.title(), "Sign in to see this payment");
    assert.equal(ui.link("Sign in").getAttribute("href"), "/login");
    assert.deepEqual(ui.calls, []);
  });
});
