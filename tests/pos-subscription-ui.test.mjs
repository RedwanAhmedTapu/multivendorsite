// tests/pos-subscription-ui.test.mjs
//
// POS security + subscription (frontend):
//   1. pure: banner wording per entitlement state, gateway URL allowlist (https
//      only), admin lifecycle form validation, checkout result copy;
//   2. posApi: session only — no terminal token header, no login endpoint,
//      no vendorId/staffId sent; the operator comes from GET /pos/me;
//   3. usePermissions().can(): posAccess only for the vendor owner or vendor
//      staff holding it (never ADMIN / admin staff); posSubscriptionManagement
//      only for ADMIN or admin-side staff holding it (jsdom, fetch stubbed).
//   node --test tests/pos-subscription-ui.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { register, createRequire } from "node:module";

register("./support/tsx-loader.mjs", import.meta.url);
const require = createRequire(import.meta.url);
const V = await import("../src/lib/pos/subscription-view.ts");
const A = await import("../src/lib/pos/admin-subscription.ts");

const ent = (o) => ({ state: "ACTIVE", canOperate: true, expiresAt: null, graceEndsAt: null, daysLeft: null, ...o });
const status = (e, enforcement = "enforce") => ({ entitlement: ent(e), enforcement, subscription: null, graceDays: 0 });

test("banner: warns before expiry; any non-active state says every operation is paused", () => {
  assert.equal(V.posBannerFor(status({ daysLeft: 30 })), null);
  assert.match(V.posBannerFor(status({ daysLeft: 3 })).text, /ends in 3 days/);
  for (const state of ["EXPIRED", "CANCELLED", "NONE", "INVALID"]) {
    const b = V.posBannerFor(status({ state, canOperate: false }));
    assert.equal(b.tone, "danger", state);
    assert.match(b.text, /selling, refunds, voids and due collection are paused/, state);
    assert.doesNotMatch(b.text, /still work/, "nothing operational survives expiry");
  }
  assert.match(V.posBannerFor(status({ state: "SUSPENDED", canOperate: false })).text, /suspended/);
  assert.match(V.posBannerFor(status({ state: "GRACE", daysLeft: 2 })).text, /grace period, 2 days/);
  assert.equal(V.posBannerFor(status({ state: "NONE", canOperate: false }, "monitor")).tone, "info");
});

test("operator view model comes from the session (/pos/me), never a terminal login", () => {
  const op = V.operatorFromMe({ vendorId: "V1", userId: "U1", employeeId: "E1", isOwner: false, displayName: "Rina", grants: { posDiscount: true, posCredit: false, posRefund: false, posReports: true } });
  assert.equal(op.id, "E1");
  assert.equal(op.isAdmin, false, "only the owner gets owner-only screens");
  assert.deepEqual([op.permissions.canDiscount, op.permissions.canGrantLoan, op.permissions.canViewDashboard], [true, false, true]);
  assert.equal(V.operatorFromMe({ vendorId: "V1", userId: "U9", employeeId: null, isOwner: true, displayName: null, grants: { posDiscount: true, posCredit: true, posRefund: true, posReports: true } }).isAdmin, true);
});

test("gateway redirect: https only", () => {
  assert.equal(V.safeGatewayUrl("https://sandbox.sslcommerz.com/EasyCheckOut/abc"), "https://sandbox.sslcommerz.com/EasyCheckOut/abc");
  for (const bad of ["http://evil.example/pay", "javascript:alert(1)", "//evil.example", "", null, 42]) {
    assert.equal(V.safeGatewayUrl(bad), null, String(bad));
  }
});

test("money, durations, checkout result copy", () => {
  assert.equal(V.formatTaka("1500"), "৳1,500.00");
  assert.equal(V.durationText(30), "1 month");
  assert.equal(V.durationText(365), "1 year");
  assert.equal(V.durationText(45), "45 days");
  assert.equal(V.checkoutResultMessage("paid").tone, "info");
  assert.equal(V.checkoutResultMessage("whatever"), null);
  assert.doesNotMatch(V.checkoutResultMessage("failed").text, /No money was taken/, "never promises what the client can't know");
});

test("admin lifecycle form: reason required; extend days bounded; grant date in the future or open-ended", () => {
  const now = new Date(2026, 9, 22, 12);
  assert.equal(A.validateLifecycleForm({ op: "suspend", reason: " " }, now).ok, false);
  assert.deepEqual(A.validateLifecycleForm({ op: "suspend", reason: "Fraud check" }, now), { ok: true, body: { op: "suspend", reason: "Fraud check" } });
  assert.equal(A.validateLifecycleForm({ op: "extend", reason: "Goodwill", days: "0" }, now).ok, false);
  assert.equal(A.validateLifecycleForm({ op: "extend", reason: "Goodwill", days: "2.5" }, now).ok, false);
  assert.deepEqual(A.validateLifecycleForm({ op: "extend", reason: "Goodwill", days: "30" }, now).body, { op: "extend", reason: "Goodwill", days: 30 });
  assert.equal(A.validateLifecycleForm({ op: "grant", reason: "Partner", until: "2026-10-01" }, now).ok, false);
  assert.deepEqual(A.validateLifecycleForm({ op: "grant", reason: "Partner", openEnded: true }, now).body, { op: "grant", reason: "Partner", until: null });
  const g = A.validateLifecycleForm({ op: "grant", reason: "Partner", until: "2026-12-31" }, now);
  assert.equal(g.ok, true);
  assert.equal(new Date(g.body.until).getDate(), 31);
});

test("posApi: session only — no terminal header, no login endpoint, no vendorId/staffId", async () => {
  const { configureStore } = await import("@reduxjs/toolkit");
  const { posApi } = await import("../src/features/posApi.ts");
  const authReducer = (await import("../src/features/authSlice.ts")).default;
  assert.equal(posApi.endpoints.staffLogin, undefined, "no terminal login");
  for (const gone of ["createStaff", "updateStaff", "resetStaffPassword", "getStaffMe", "createStaffFromEmployee", "linkEmployee", "unlinkEmployee"]) {
    assert.equal(posApi.endpoints[gone], undefined, gone);
  }
  const calls = [];
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    const req = input instanceof Request ? input : new Request(input, init);
    calls.push({ url: req.url, headers: [...req.headers.keys()] });
    return new Response(JSON.stringify({ success: true, data: [] }), { status: 200, headers: { "content-type": "application/json" } });
  };
  const s = configureStore({
    reducer: { auth: authReducer, [posApi.reducerPath]: posApi.reducer },
    middleware: (g) => g({ serializableCheck: false, immutableCheck: false }).concat(posApi.middleware),
  });
  try {
    await s.dispatch(posApi.endpoints.getPosMe.initiate()).unwrap();
    await s.dispatch(posApi.endpoints.getSales.initiate({ page: 1 })).unwrap();
    assert.match(calls[0].url, /\/api\/pos\/me$/);
    for (const c of calls) {
      assert.ok(!c.headers.includes("x-pos-staff-token"), "no terminal token header");
      assert.doesNotMatch(c.url, /vendorId|staffId/);
    }
  } finally {
    s.dispatch(posApi.util.resetApiState());
    globalThis.fetch = realFetch;
  }
});

// ─── usePermissions (jsdom) ────────────────────────────────────────────────

let JSDOM = null;
try {
  ({ JSDOM } = require("jsdom"));
} catch {
  JSDOM = null;
}
const skip = JSDOM ? false : "jsdom is not installed";

async function canFor(me) {
  const dom = new JSDOM("<!doctype html><div id=root></div>", { url: "http://localhost:3000/" });
  const g = globalThis;
  const saved = {};
  for (const k of ["window", "document", "navigator", "HTMLElement", "Node", "Element", "MutationObserver", "getComputedStyle", "Event"]) {
    saved[k] = Object.getOwnPropertyDescriptor(g, k);
    Object.defineProperty(g, k, { value: k === "window" ? dom.window : dom.window[k], configurable: true, writable: true });
  }
  g.IS_REACT_ACT_ENVIRONMENT = true;
  const realFetch = g.fetch;
  g.fetch = async () => new Response(JSON.stringify({ success: true, data: me }), { status: 200, headers: { "content-type": "application/json" } });
  const React = await import("react");
  const { act } = React;
  const { createRoot } = await import("react-dom/client");
  const { Provider } = await import("react-redux");
  const { configureStore } = await import("@reduxjs/toolkit");
  const { authApi } = await import("../src/features/authApi.ts");
  const authReducer = (await import("../src/features/authSlice.ts")).default;
  const { usePermissions } = await import("../src/hooks/usePermissions.ts");
  const store = configureStore({
    reducer: { auth: authReducer, [authApi.reducerPath]: authApi.reducer },
    middleware: (gd) => gd({ serializableCheck: false, immutableCheck: false }).concat(authApi.middleware),
  });
  const out = {};
  function Probe() {
    const { can } = usePermissions();
    out.posAccess = can("posAccess");
    out.posSubscriptionManagement = can("posSubscriptionManagement");
    return null;
  }
  const root = createRoot(dom.window.document.getElementById("root"));
  try {
    await act(async () => root.render(React.createElement(Provider, { store }, React.createElement(Probe))));
    for (let i = 0; i < 5; i++) await act(() => new Promise((r) => setTimeout(r, 20)));
    return { ...out };
  } finally {
    await act(async () => root.unmount());
    store.dispatch(authApi.util.resetApiState());
    g.fetch = realFetch;
    for (const [k, d] of Object.entries(saved)) {
      if (d) Object.defineProperty(g, k, d);
      else delete g[k];
    }
    delete g.IS_REACT_ACT_ENVIRONMENT;
    dom.window.close();
  }
}

const user = (o) => ({ id: "x", rawId: "u", name: "n", email: null, phone: null, employeeId: null, employeeMeta: null, permissions: null, ...o });

test("can(): POS access and POS subscription admin never cross over", { skip }, async () => {
  assert.deepEqual(await canFor(user({ role: "VENDOR", vendorId: "V1" })), { posAccess: true, posSubscriptionManagement: false });
  assert.deepEqual(await canFor(user({ role: "EMPLOYEE", vendorId: "V1", permissions: { posAccess: true } })), { posAccess: true, posSubscriptionManagement: false });
  assert.deepEqual(await canFor(user({ role: "EMPLOYEE", vendorId: "V1", permissions: { orderManagement: true } })), { posAccess: false, posSubscriptionManagement: false });
  assert.deepEqual(await canFor(user({ role: "ADMIN", vendorId: null })), { posAccess: false, posSubscriptionManagement: true });
  assert.deepEqual(await canFor(user({ role: "EMPLOYEE", vendorId: null, permissions: { posSubscriptionManagement: true, posAccess: true } })), { posAccess: false, posSubscriptionManagement: true });
  assert.deepEqual(await canFor(user({ role: "EMPLOYEE", vendorId: "V1", permissions: { posSubscriptionManagement: true } })), { posAccess: false, posSubscriptionManagement: false });
});
