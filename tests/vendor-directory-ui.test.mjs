// tests/vendor-directory-ui.test.mjs
//
// Admin "All Vendors" directory (jsdom, real RTK Query store, stubbed backend):
// list is server-driven (page/limit/status/search), tabs filter through the API,
// pagination requests the next page, the drawer loads the complete profile, and
// a status action sends PATCH /vendormanagement/:id/suspended.
//   node --test tests/vendor-directory-ui.test.mjs

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

const stamp = "2026-01-10T09:00:00.000Z";

function vendor(over) {
  return {
    id: "vend-000001",
    storeName: "Alpha Store",
    status: "ACTIVE",
    createdAt: stamp,
    updatedAt: stamp,
    currentCommissionRate: 8.5,
    verificationStatus: "VERIFIED",
    accountType: "BUSINESS",
    user: { id: "u1", email: "alpha@store.com", phone: "01700000001", isActive: true, isVerified: true },
    performance: { totalSales: 120000, totalOrders: 42, fulfillmentRatePct: 95.5, avgRating: 4.5 },
    _count: { products: 12, orders: 42, flags: 0 },
    subscription: { id: "sub1", vendorId: "vend-000001", planType: "BASIC", isActive: true, createdAt: stamp, updatedAt: stamp },
    paymentAccounts: [
      { id: "pa1", vendorId: "vend-000001", type: "BANK", isDefault: true, accountNumber: "12345678", bankBranch: { id: "br1", bankId: "b1", bank: { id: "b1", name: "DBBL" } } },
    ],
    ...over,
  };
}

const ALPHA = vendor({});
const BETA = vendor({
  id: "vend-000002",
  storeName: "Beta Mart",
  status: "SUSPENDED",
  verificationStatus: "UNDER_REVIEW",
  user: { id: "u2", email: "beta@mart.com", phone: "01700000002", isActive: true, isVerified: false },
});
const GAMMA = vendor({
  id: "vend-000003",
  storeName: "Gamma Traders",
  status: "PENDING",
  verificationStatus: "PENDING",
  subscription: null,
  paymentAccounts: [],
  user: { id: "u3", email: "gamma@traders.com", phone: "01700000003", isActive: true, isVerified: false },
});

const PROFILE = {
  ...ALPHA,
  verificationStatus: "UNDER_REVIEW",
  personalInfo: { id: "pi1", vendorId: ALPHA.id, idName: "Karim Uddin", idNumber: "1990123456789", companyName: null, taxIdNumber: "123456789", businessRegNo: "RJSC-1", createdAt: stamp, updatedAt: stamp },
  pickupAddress: { id: "addr1", vendorId: ALPHA.id, detailsAddress: "12 Road 5", area: "Banani", zone: "Gulshan", city: "Dhaka", createdAt: stamp, updatedAt: stamp },
  documents: [
    { id: "doc1", vendorId: ALPHA.id, type: "TRADE_LICENSE", title: "Trade License 2024", filePath: "https://cdn.example.com/tl.pdf", verificationStatus: "UNDER_REVIEW", createdAt: stamp, updatedAt: stamp },
  ],
  onboarding: { id: "on1", vendorId: ALPHA.id, personalInfoComplete: true, addressComplete: true, bankInfoComplete: false, documentsComplete: true, overallComplete: false, createdAt: stamp, updatedAt: stamp },
};

/* ─── harness ───────────────────────────────────────────────────────────── */

async function withDom(route, fn) {
  const dom = new JSDOM("<!doctype html><html><body><div id=root></div></body></html>", { url: "http://localhost:3000/admin-dashboard/vendormanage/vendor-approval", pretendToBeVisual: true });
  const g = globalThis;
  const saved = {};
  const setGlobal = (k, v) => {
    saved[k] = Object.getOwnPropertyDescriptor(g, k);
    Object.defineProperty(g, k, { value: v, configurable: true, writable: true });
  };
  for (const k of ["window", "document", "navigator", "HTMLElement", "Node", "Element", "MutationObserver", "getComputedStyle", "Event", "CustomEvent", "MouseEvent", "KeyboardEvent", "FocusEvent", "PointerEvent", "NodeFilter", "localStorage", "sessionStorage"]) {
    setGlobal(k, k === "window" ? dom.window : dom.window[k]);
  }
  setGlobal("requestAnimationFrame", (cb) => setTimeout(cb, 0));
  setGlobal("cancelAnimationFrame", clearTimeout);
  setGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
  for (const k of Object.getOwnPropertyNames(dom.window)) {
    if (/^(HTML|SVG)\w*Element$|^(DocumentFragment|ShadowRoot|Text|Range|Selection|DOMRect)$/.test(k) && !(k in saved)) setGlobal(k, dom.window[k]);
  }
  g.IS_REACT_ACT_ENVIRONMENT = true;
  (g.__routerPushes ??= []).length = 0;
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
  const { apiSlice } = await import("../src/features/apiSlice.ts");
  const authReducer = (await import("../src/features/authSlice.ts")).default;
  const store = configureStore({
    reducer: { auth: authReducer, [vendorManageApi.reducerPath]: vendorManageApi.reducer, [apiSlice.reducerPath]: apiSlice.reducer },
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
  const settle = async (n = 6) => {
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
      await run(async () => el.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true })));
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
      await settle(10);
    },
    listCalls: () => calls.filter((c) => c.method === "GET" && c.path === "/api/vendormanagement"),
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

function vendorBackend(list) {
  return async (method, url) => {
    const p = url.pathname;
    if (method === "GET" && p === "/api/vendormanagement") {
      const q = url.searchParams;
      const status = q.get("status");
      const search = (q.get("search") || "").toLowerCase();
      const page = Number(q.get("page") || 1);
      const limit = Number(q.get("limit") || 10);
      let rows = list.filter((v) => (!status || v.status === status) && (!search || `${v.storeName} ${v.user?.email}`.toLowerCase().includes(search)));
      const total = rows.length;
      rows = rows.slice((page - 1) * limit, page * limit);
      return [200, { success: true, data: rows, pagination: { total, page, limit, pages: Math.ceil(total / limit) } }];
    }
    if (method === "GET" && p === `/api/vendormanagement/${ALPHA.id}/complete-profile`) return [200, { success: true, data: PROFILE }];
    if (method === "GET" && p === `/api/vendormanagement/${ALPHA.id}/commission/history`) return [200, { success: true, data: [{ id: "c1", rate: 7.5, categoryId: "cat1", category: { name: "Electronics" }, effectiveFrom: stamp }] }];
    if (method === "GET" && p === `/api/vendormanagement/${ALPHA.id}/payouts`) return [200, { success: true, data: [{ id: "p1", amount: 1200, status: "PAID", period: "October", method: "BANK", createdAt: stamp, paidAt: stamp }] }];
    if (method === "GET" && p === `/api/vendormanagement/${ALPHA.id}/payouts/summary`) return [200, { success: true, data: { vendorId: ALPHA.id, totalPending: 0, totalPaid: 1200, totalFailed: 0, currentBalance: 0 } }];
    if (method === "PATCH" && p === `/api/vendormanagement/${ALPHA.id}/suspended`) {
      ALPHA.status = "SUSPENDED";
      return [200, { success: true, data: ALPHA }];
    }
    return null;
  };
}

/* ─── tests ─────────────────────────────────────────────────────────────── */

test("directory: KPIs, rows and the initial server-side query", { skip }, async () => {
  await withDom(vendorBackend([ALPHA, BETA, GAMMA]), async (ui, React) => {
    const { default: VendorDirectory } = await import("../src/components/vendor-management/VendorDirectory.tsx");
    await ui.render(React.createElement(VendorDirectory));

    const text = ui.text();
    assert.match(text, /Vendor Management/);
    assert.match(text, /Total Vendors\s*3/, "total comes from pagination.total");
    assert.match(text, /Active Stores\s*1/, "active count is its own filtered call");
    assert.match(text, /Pending KYC\s*—/, "no fabricated pending-KYC count");
    assert.match(text, /Vendor GMV \(Quarter\)\s*—/, "no fabricated GMV");
    assert.match(text, /Platform Take \(Revenue\)\s*—/);

    assert.match(text, /Alpha Store/);
    assert.match(text, /#000001/);
    assert.match(text, /DBBL/);
    assert.match(text, /8\.5%/);
    assert.match(text, /120\.0K|120,000/, "GMV is shown compact and exact");

    const first = ui.listCalls().find((c) => c.query.limit === "10");
    assert.ok(first, "the table query ran");
    assert.deepEqual(
      { page: first.query.page, limit: first.query.limit, sortBy: first.query.sortBy, sortOrder: first.query.sortOrder },
      { page: "1", limit: "10", sortBy: "createdAt", sortOrder: "desc" }
    );
  });
});

test("directory: tabs filter through the API and unavailable segments never fake results", { skip }, async () => {
  await withDom(vendorBackend([ALPHA, BETA, GAMMA]), async (ui, React) => {
    const { default: VendorDirectory } = await import("../src/components/vendor-management/VendorDirectory.tsx");
    await ui.render(React.createElement(VendorDirectory));

    await ui.click(ui.button("Active Stores"));
    const active = ui.listCalls().filter((c) => c.query.status === "ACTIVE" && c.query.limit === "10").pop();
    assert.ok(active, "tab selection sends status=ACTIVE to the API");
    assert.match(ui.text(), /Alpha Store/);
    assert.doesNotMatch(ui.text(), /Beta Mart/);

    await ui.click(ui.button("Pending KYC"));
    assert.match(ui.text(), /Pending KYC is not available/);
    assert.ok(!ui.listCalls().some((c) => c.query.verificationStatus), "no unsupported filter is sent");

    await ui.click(ui.button("Back to all vendors"));
    assert.match(ui.text(), /Beta Mart/);
  });
});

test("directory: search is debounced into the query and pagination asks for the next page", { skip }, async () => {
  const many = Array.from({ length: 12 }, (_, i) =>
    vendor({
      id: `vend-${String(i + 1).padStart(6, "0")}`,
      storeName: i === 10 ? "Omega Traders" : `Store ${i + 1}`,
      user: { id: `u${i}`, email: `store${i + 1}@mail.com`, phone: `017000000${i}`, isActive: true, isVerified: true },
    })
  );
  await withDom(vendorBackend(many), async (ui, React) => {
    const { default: VendorDirectory } = await import("../src/components/vendor-management/VendorDirectory.tsx");
    await ui.render(React.createElement(VendorDirectory));

    assert.match(ui.text(), /Showing 1 to 10 of 12 vendors/);
    await ui.click(ui.byLabel("Next page"));
    const next = ui.listCalls().filter((c) => c.query.limit === "10").pop();
    assert.equal(next.query.page, "2");
    assert.match(ui.text(), /Showing 11 to 12 of 12 vendors/);
    assert.match(ui.text(), /Omega Traders/);

    await ui.type(ui.byLabel("Search vendors"), "Omega");
    await ui.wait(450);
    await ui.settle();
    const searched = ui.listCalls().pop();
    assert.equal(searched.query.search, "Omega");
    assert.equal(searched.query.page, "1", "search resets to the first page");
    assert.match(ui.text(), /Showing 1 to 1 of 1 vendors/);
  });
});

test("directory: drawer loads the complete profile and a status action updates the server", { skip }, async () => {
  await withDom(vendorBackend([ALPHA, BETA, GAMMA]), async (ui, React) => {
    const { default: VendorDirectory } = await import("../src/components/vendor-management/VendorDirectory.tsx");
    await ui.render(React.createElement(VendorDirectory));

    await ui.click(ui.byLabel("View Alpha Store"));
    assert.ok(ui.calls.some((c) => c.path === `/api/vendormanagement/${ALPHA.id}/complete-profile`));
    const text = ui.text();
    assert.match(text, /Audit Dossier/);
    assert.match(text, /Karim Uddin/, "legal proprietor from personalInfo");
    assert.match(text, /12 Road 5/, "pickup address dossier");

    await ui.click(ui.button("KYC Documents"));
    assert.match(ui.text(), /Trade License 2024/);
    assert.match(ui.text(), /Approve KYC|Save & Update KYC/);

    await ui.click(ui.byLabel("Close vendor drawer"));
    assert.doesNotMatch(ui.text(), /Audit Dossier/);

    await ui.click(ui.byLabel("Actions for Alpha Store"));
    assert.match(ui.text(), /Quick operations/);
    await ui.click(ui.button("Suspend store"));
    assert.match(ui.text(), /will be set to SUSPENDED/);
    await ui.click(ui.buttonExact("Suspend"));

    assert.ok(ui.calls.some((c) => c.method === "PATCH" && c.path === `/api/vendormanagement/${ALPHA.id}/suspended`), "status PATCH is sent");
    assert.equal(ALPHA.status, "SUSPENDED");
  });
});
