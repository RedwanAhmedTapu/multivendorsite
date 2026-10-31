// tests/agent-admin-access.test.mjs
//
// Agent Commission admin area on the site:
//   1. usePermissions().can("agentManagement"): ADMIN, or admin-side staff
//      holding it — never vendor accounts or vendor staff (jsdom, fetch stubbed);
//   2. the admin sidebar shows "Agents" (/admin-dashboard/agents) gated on it;
//   3. the employee permission editor offers it to ADMIN only.
//   node --test tests/agent-admin-access.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { register, createRequire } from "node:module";

register("./support/tsx-loader.mjs", import.meta.url);
const require = createRequire(import.meta.url);

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
  let out = null;
  function Probe() {
    out = usePermissions().can("agentManagement");
    return null;
  }
  const root = createRoot(dom.window.document.getElementById("root"));
  try {
    await act(async () => root.render(React.createElement(Provider, { store }, React.createElement(Probe))));
    for (let i = 0; i < 5; i++) await act(() => new Promise((r) => setTimeout(r, 20)));
    return out;
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

test("can('agentManagement'): ADMIN and admin-side staff holding it; never vendors or vendor staff", { skip }, async () => {
  assert.equal(await canFor(user({ role: "ADMIN", vendorId: null })), true, "ADMIN");
  assert.equal(await canFor(user({ role: "EMPLOYEE", vendorId: null, permissions: { agentManagement: true } })), true, "admin staff with it");
  assert.equal(await canFor(user({ role: "EMPLOYEE", vendorId: null, permissions: { posSubscriptionManagement: true } })), false, "admin staff without it");
  assert.equal(await canFor(user({ role: "VENDOR", vendorId: "V1" })), false, "vendor owner");
  assert.equal(await canFor(user({ role: "EMPLOYEE", vendorId: "V1", permissions: { agentManagement: true } })), false, "vendor staff holding it");
  assert.equal(await canFor(user({ role: "CUSTOMER", vendorId: null })), false, "customer");
});

test("admin sidebar: 'Agents' links to /admin-dashboard/agents and is gated on agentManagement", () => {
  const src = readFileSync(new URL("../src/app/admin-dashboard/layout.tsx", import.meta.url), "utf8");
  const line = src.split(/\r?\n/).find((l) => l.includes('title: "Agents"'));
  assert.ok(line, "Agents item present");
  assert.match(line, /href: "\/admin-dashboard\/agents"/);
  assert.match(line, /permissionKey: "agentManagement"/);
});

test("permission editor: Agent Management is labelled and offered to ADMIN only", () => {
  const src = readFileSync(new URL("../src/othersfeatures/hrm/components/PermissionCheckboxGroup.tsx", import.meta.url), "utf8");
  assert.match(src, /agentManagement: "Agent Management"/);
  const block = src.slice(src.indexOf('label="Agent Management"') - 200, src.indexOf('label="Agent Management"'));
  assert.match(block, /role === "ADMIN" &&/, "rendered only for an ADMIN");
});
