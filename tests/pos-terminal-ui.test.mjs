// tests/pos-terminal-ui.test.mjs
//
// Vendor POS — frontend (jsdom, real store + RTK Query, fetch stubbed; no backend):
//   1. sale-math mirrors the backend's createSale arithmetic;
//   2. vendor sidebar: POS opens /pos in a NEW TAB (target=_blank,
//      rel="noopener noreferrer"), only on click, no credentials in the URL;
//      other items stay same-tab;
//   3. /pos is a private route: no session → /login, customer/admin →
//      /unauthorized, vendor staff without posAccess → no-access screen,
//      owner → POS loads (session read from the persisted auth state);
//   4. the existing selling screen works against the API: products from
//      GET /pos/products, add / +/- / remove, totals, walk-in rule, customer,
//      charge → POST /pos/sales with variant+location+qty only (no price,
//      vendorId, staffId), one POST on double click, receipt only after the
//      server confirms, retry keeps the same clientRequestId, 402 shows no
//      receipt; discounts hidden without posDiscount; blocked subscription
//      locks selling but keeps invoices.
//   node --test tests/pos-terminal-ui.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { register, createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { format } from "node:util";

register("./support/tsx-loader.mjs", import.meta.url);
const require = createRequire(import.meta.url);
const M = await import("../src/lib/pos/sale-math.ts");

// ─── 1. pure ───────────────────────────────────────────────────────────────

test("sale-math mirrors the backend: discount first, VAT on the discounted base, change above the bill", () => {
  const lines = [{ price: 100, qty: 2, taxRate: 5 }, { price: 50, qty: 1, taxRate: 0 }];
  const e = M.estimateSale(lines, { type: "PERCENT", value: 10 }, 300);
  assert.equal(e.subtotal, 250);
  assert.equal(e.discountAmount, 25);
  // taxable 225; line1 share 200/250 → 180 × 5% = 9
  assert.equal(e.tax, 9);
  assert.equal(e.netBilling, 234);
  assert.equal(e.change, 66);
  assert.equal(e.paid, 234);
  assert.equal(e.due, 0);
  const d = M.estimateSale(lines, { type: "FLAT", value: 1000 }, 0);
  assert.equal(d.discountAmount, 250, "flat discount capped at the subtotal");
  assert.equal(M.estimateSale(lines, { type: "PERCENT", value: 0 }, 100).due, 160, "net 250 + 10 VAT − 100 paid");
  assert.match(M.newClientRequestId(), /^[A-Za-z0-9-]{8,64}$/, "matches the server's accepted format");
});

test("vendor nav config: POS Terminal opens in a new tab and is gated on posAccess", () => {
  const src = readFileSync(new URL("../src/app/vendor-dashboard/layout.tsx", import.meta.url), "utf8");
  assert.match(src, /title: "POS Terminal", href: "\/pos",[^}]*permissionKey: "posAccess", openInNewTab: true/);
});

// ─── jsdom harness ─────────────────────────────────────────────────────────

let JSDOM = null;
try {
  ({ JSDOM } = require("jsdom"));
} catch {
  JSDOM = null;
}
const skip = JSDOM ? false : "jsdom is not installed";

async function withDom({ auth = null, route = async () => null } = {}, fn) {
  const dom = new JSDOM("<!doctype html><html><body><div id=root></div></body></html>", { url: "http://localhost:3000/pos", pretendToBeVisual: true });
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
    calls.push({ method: req.method, path: url.pathname, query: Object.fromEntries(url.searchParams), body, headers: [...req.headers.keys()] });
    const res = await route(req.method, url, body);
    if (res) return Response.json(res[1], { status: res[0] });
    return Response.json({ success: false, message: `unexpected ${req.method} ${url.pathname}` }, { status: 404 });
  };

  const React = await import("react");
  const { act } = React;
  const { createRoot } = await import("react-dom/client");
  const { Provider } = await import("react-redux");
  const { configureStore } = await import("@reduxjs/toolkit");
  const { posApi } = await import("../src/features/posApi.ts");
  const { authApi } = await import("../src/features/authApi.ts");
  const { vendorManageApi } = await import("../src/features/vendorManageApi.ts");
  const authReducer = (await import("../src/features/authSlice.ts")).default;
  const store = configureStore({
    reducer: { auth: authReducer, [posApi.reducerPath]: posApi.reducer, [authApi.reducerPath]: authApi.reducer, [vendorManageApi.reducerPath]: vendorManageApi.reducer },
    preloadedState: { auth: auth ?? { user: null, accessToken: null } },
    middleware: (gd) => gd({ serializableCheck: false, immutableCheck: false }).concat(posApi.middleware, authApi.middleware, vendorManageApi.middleware),
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
    text: () => doc.body.textContent,
    byLabel: (l) => doc.querySelector(`[aria-label="${l}"]`),
    button: (label) => [...doc.querySelectorAll("button")].find((b) => b.textContent.trim().startsWith(label)),
    click: async (el, settleAfter = true) => {
      assert.ok(el, "element to click exists");
      await run(async () => el.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true })));
      if (settleAfter) await settle();
    },
    type: async (el, v) => {
      assert.ok(el, "input exists");
      await run(async () => {
        Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, "value").set.call(el, v);
        el.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
      });
      await settle();
    },
    render: async (element) => {
      root = createRoot(doc.getElementById("root"));
      await run(async () => root.render(React.createElement(Provider, { store }, element)));
      await settle();
    },
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
    store.dispatch(posApi.util.resetApiState());
    store.dispatch(authApi.util.resetApiState());
    store.dispatch(vendorManageApi.util.resetApiState());
    await new Promise((r) => setTimeout(r, 60));
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
const ME_OWNER = { id: "V1", rawId: "U_V1", role: "VENDOR", vendorId: "V1", employeeId: null, name: "Rahman Store", email: "o@x.test", phone: null, permissions: null, employeeMeta: null };
const POS_ME_OWNER = { vendorId: "V1", userId: "U_V1", employeeId: null, isOwner: true, displayName: "Rahman Store", grants: { posDiscount: true, posCredit: true, posRefund: true, posReports: true } };
const ACTIVE = { entitlement: { state: "ACTIVE", canOperate: true, expiresAt: null, graceEndsAt: null, daysLeft: null }, enforcement: "enforce", subscription: null, graceDays: 0 };
const PRODUCTS = [
  { variantId: "VAR1", productId: "P1", name: "Shirt - Red", category: "Fashion", sku: "S1", barcode: null, price: 100, taxRate: 5, image: null, totalAvailable: 3, locations: [{ warehouseId: "WH1", warehouseName: "Main", isDefault: true, rackId: "R1", rackCode: "A-01", available: 3 }] },
  { variantId: "VAR2", productId: "P2", name: "Rice 5kg", category: "Groceries", sku: "R5", barcode: null, price: 50, taxRate: 0, image: null, totalAvailable: 0, locations: [] },
];
const SALE = { id: "SALE1", invoiceNo: "INV-260923-0001", voucherNo: "POSV-260923-0001", items: [{ id: "IT1", name: "Shirt - Red", qty: 2, price: 100, cost: 60, taxRate: 5 }], subtotal: 200, discountAmount: 0, taxAmount: 10, netBilling: 210, paidAmount: 210, dueAmount: 0, paymentMethod: "CASH", status: "PAID", customer: null, accountingVoucherId: null };

function posBackend({ me = ME_OWNER, posMe = POS_ME_OWNER, sub = ACTIVE, onSale, accounts = [], customers = [], onCustomerWrite } = {}) {
  return async (method, url, body) => {
    const p = url.pathname;
    if (p === "/api/auth/me") return ok(me);
    if (p === "/api/pos/me") return ok(posMe);
    if (p === "/api/pos/subscription") return ok(sub);
    if (p === "/api/pos/products") return ok(PRODUCTS);
    // Same vendor payment-accounts API as Purchase Entry; a function can return a status.
    if (p === "/api/vendormanagement/V1/payment-accounts") return typeof accounts === "function" ? accounts() : ok(accounts);
    if (p === "/api/pos/customers" && method === "GET") return ok(customers);
    if (p.startsWith("/api/pos/customers") && (method === "POST" || method === "PUT")) return onCustomerWrite ? onCustomerWrite(method, body) : ok({ id: "C9", ...body });
    if (p === "/api/pos/dashboard") return ok({ today: { salesCount: 0, netBilling: 0, collected: 0, due: 0 }, totalCustomerDue: 0, subscription: sub });
    if (p === "/api/pos/sales" && method === "GET") return [200, { success: true, data: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } }];
    if (p === "/api/pos/sales" && method === "POST") return onSale ? onSale(body) : [201, { success: true, data: { sale: SALE, change: 0, duplicate: false } }];
    return null;
  };
}
const OWNER_AUTH = { user: { id: "V1", rawId: "U_V1", role: "VENDOR", vendorId: "V1", employeeId: null }, accessToken: "persisted-token" };

// ─── 2. sidebar ────────────────────────────────────────────────────────────

test("sidebar: POS opens /pos in a new tab (no credentials in URL); normal items stay in this tab", { skip }, async () => {
  await withDom({ auth: OWNER_AUTH }, async (ui, React) => {
    const { VendorSidebar } = await import("../src/app/vendor-dashboard/sidebar/VendorSidebar.tsx");
    const Icon = () => null;
    await ui.render(
      React.createElement(VendorSidebar, {
        logo: { title: "Finixmart" },
        sections: [{ items: [
          { title: "Dashboard", href: "/vendor-dashboard", icon: Icon },
          { title: "POS Terminal", href: "/pos", icon: Icon, openInNewTab: true },
        ] }],
      }),
    );
    const links = [...ui.doc.querySelectorAll("a")];
    const pos = links.find((a) => a.getAttribute("href") === "/pos");
    const dash = links.find((a) => a.getAttribute("href") === "/vendor-dashboard");
    assert.ok(pos && dash);
    assert.equal(pos.getAttribute("target"), "_blank");
    assert.equal(pos.getAttribute("rel"), "noopener noreferrer");
    assert.equal(pos.getAttribute("href"), "/pos", "no token / query in the URL");
    assert.match(pos.textContent, /opens in a new tab/);
    assert.equal(dash.getAttribute("target"), null, "other items unchanged");
    assert.equal(globalThis.__routerPushes.length, 0, "nothing opens on load");
  });
});

// ─── 3. private route ──────────────────────────────────────────────────────

test("/pos private route: no session → /login; customer/admin → /unauthorized; staff without posAccess → no access", { skip }, async () => {
  const { default: PosPage } = await import("../src/app/pos/page.tsx");
  await withDom({ auth: null, route: posBackend() }, async (ui, React) => {
    await ui.render(React.createElement(PosPage));
    assert.deepEqual(globalThis.__routerPushes, ["/login"]);
    assert.ok(!ui.calls.some((c) => c.path.startsWith("/api/pos")), "no POS calls without a session");
  });
  for (const role of ["CUSTOMER", "ADMIN"]) {
    await withDom({ auth: { user: { id: "X", role, employeeId: null }, accessToken: "t" }, route: posBackend() }, async (ui, React) => {
      await ui.render(React.createElement(PosPage));
      assert.deepEqual(globalThis.__routerPushes, ["/unauthorized"], role);
    });
  }
  const staffNoPos = { ...ME_OWNER, role: "EMPLOYEE", employeeId: "E1", permissions: { orderManagement: true } };
  await withDom({ auth: { user: { id: "E1", role: "EMPLOYEE", vendorId: "V1", employeeId: "E1" }, accessToken: "t" }, route: posBackend({ me: staffNoPos }) }, async (ui, React) => {
    await ui.render(React.createElement(PosPage));
    assert.match(ui.text(), /No POS access/);
    assert.match(ui.text(), /Ask your store owner/);
    assert.ok(!ui.calls.some((c) => c.path === "/api/pos/products"), "terminal never loads");
  });
});

// ─── 4. selling screen ─────────────────────────────────────────────────────

test("owner: products load, cart works, charge posts variant+location+qty only, one POST on double click, receipt after confirmation", { skip }, async () => {
  let release;
  const gate = new Promise((r) => (release = r));
  await withDom({ auth: OWNER_AUTH, route: posBackend({ onSale: async () => (await gate, [201, { success: true, data: { sale: SALE, change: 0, duplicate: false } }]) }) }, async (ui, React) => {
    const { default: PosPage } = await import("../src/app/pos/page.tsx");
    await ui.render(React.createElement(PosPage));
    await ui.settle(8);
    assert.match(ui.text(), /POS Terminal/);
    assert.match(ui.text(), /Shirt - Red/);
    assert.match(ui.text(), /Out of stock/, "zero-stock product disabled");
    assert.ok(ui.byLabel("Add Rice 5kg").disabled);
    for (const c of ui.calls) assert.ok(!c.headers.includes("x-pos-staff-token"), "no terminal token");

    await ui.click(ui.byLabel("Add Shirt - Red"));
    await ui.click(ui.byLabel("More Shirt - Red"));
    await ui.click(ui.byLabel("More Shirt - Red"));
    await ui.click(ui.byLabel("More Shirt - Red")); // 4th > 3 available
    assert.match(ui.text(), /Stock limit/);
    await ui.click(ui.byLabel("Less Shirt - Red"));
    assert.match(ui.text(), /NET BILLING/);
    assert.match(ui.text(), /৳210/, "2 × 100 + 5% VAT");

    // Walk-in partial payment is refused before any request.
    await ui.type(ui.byLabel("Paid amount"), "50");
    await ui.click(ui.button("⚡ Charge"));
    assert.match(ui.text(), /Walk-in customers must pay in full/);
    assert.ok(!ui.calls.some((c) => c.method === "POST"));

    await ui.type(ui.byLabel("Paid amount"), "210");
    const charge = ui.button("⚡ Charge");
    await ui.click(charge, false);
    await ui.click(charge, false); // double click while the first is in flight
    await ui.settle(3);
    assert.match(ui.text(), /Processing/);
    assert.ok(!/INV-260923-0001/.test(ui.text()), "no receipt before the server confirms");
    release();
    await ui.settle(8);
    const posts = ui.calls.filter((c) => c.method === "POST" && c.path === "/api/pos/sales");
    assert.equal(posts.length, 1, "one sale request");
    const b = posts[0].body;
    assert.deepEqual(b.items, [{ variantId: "VAR1", qty: 2, warehouseId: "WH1", rackId: "R1" }], "no client price/cost/name");
    for (const k of ["vendorId", "staffId", "saleDate", "subtotal", "netBilling"]) assert.ok(!(k in b), `${k} never sent`);
    assert.equal(b.paidAmount, 210);
    assert.equal(b.paymentMethod, "CASH");
    assert.match(b.clientRequestId, /^[A-Za-z0-9-]{8,64}$/);
    assert.match(ui.text(), /INV-260923-0001/, "receipt from the server's sale");
  });
});

test("a failed sale shows no receipt and a retry reuses the same clientRequestId; 402 blocks", { skip }, async () => {
  let n = 0;
  await withDom({
    auth: OWNER_AUTH,
    route: posBackend({ onSale: async () => (++n === 1 ? [402, { success: false, code: "POS_SUBSCRIPTION_REQUIRED", message: "Your POS subscription has ended." }] : [201, { success: true, data: { sale: SALE, change: 0, duplicate: true } }]) }),
  }, async (ui, React) => {
    const { default: PosPage } = await import("../src/app/pos/page.tsx");
    await ui.render(React.createElement(PosPage));
    await ui.settle(8);
    await ui.click(ui.byLabel("Add Shirt - Red"));
    await ui.type(ui.byLabel("Paid amount"), "105");
    await ui.click(ui.button("⚡ Charge"));
    await ui.settle(4);
    assert.match(ui.text(), /subscription has ended/);
    assert.ok(!/INV-260923-0001/.test(ui.text()), "no receipt after a refused sale");
    await ui.click(ui.button("⚡ Charge"));
    await ui.settle(6);
    const posts = ui.calls.filter((c) => c.method === "POST");
    assert.equal(posts.length, 2);
    assert.equal(posts[0].body.clientRequestId, posts[1].body.clientRequestId, "same attempt id on retry");
    assert.match(ui.text(), /INV-260923-0001/);
  });
});

test("employee without posDiscount sees no discount control; blocked subscription locks selling but keeps invoices", { skip }, async () => {
  const empMe = { ...ME_OWNER, role: "EMPLOYEE", employeeId: "E1", permissions: { posAccess: true } };
  const empPos = { ...POS_ME_OWNER, employeeId: "E1", isOwner: false, displayName: "Rina", grants: { posDiscount: false, posCredit: false, posRefund: false, posReports: false } };
  const empAuth = { user: { id: "E1", role: "EMPLOYEE", vendorId: "V1", employeeId: "E1" }, accessToken: "t" };
  await withDom({ auth: empAuth, route: posBackend({ me: empMe, posMe: empPos }) }, async (ui, React) => {
    const { default: PosPage } = await import("../src/app/pos/page.tsx");
    await ui.render(React.createElement(PosPage));
    await ui.settle(8);
    assert.equal(ui.byLabel("Discount"), null);
    assert.match(ui.text(), /Discounts need the POS Discounts permission/);
  });
  const expired = { ...ACTIVE, entitlement: { state: "EXPIRED", canOperate: false, expiresAt: "2026-10-01T00:00:00Z", graceEndsAt: null, daysLeft: null } };
  await withDom({ auth: OWNER_AUTH, route: posBackend({ sub: expired }) }, async (ui, React) => {
    const { default: PosPage } = await import("../src/app/pos/page.tsx");
    await ui.render(React.createElement(PosPage));
    await ui.settle(8);
    assert.match(ui.text(), /Selling is paused until the POS subscription is active/);
    assert.ok(!ui.calls.some((c) => c.path === "/api/pos/products"), "no selling calls while blocked");
    assert.match(ui.text(), /Renew/);
  });
});

// ─── 5. settings & payment methods ─────────────────────────────────────────

const SETTINGS = { invoicePrefix: "INV-", voucherPrefix: "POSV-", currencySymbol: "৳", receiptFooterText: "Thanks", storeOnline: true };
const withSettings = (base) => async (method, url, body) => {
  if (url.pathname === "/api/pos/settings") return method === "PUT" ? ok({ ...SETTINGS, ...body }) : ok(SETTINGS);
  return base(method, url, body);
};
const ACCOUNTS = [
  { id: "b1", vendorId: "V1", type: "BANK", isActive: true, isDefault: true, accountName: "Shop", accountNumber: "123" },
  { id: "c1", vendorId: "V1", type: "CARD", isActive: true, isDefault: false, cardProcessor: "SSLCommerz POS" },
  { id: "m1", vendorId: "V1", type: "MOBILE_BANKING", isActive: true, isDefault: false, mobileProvider: "BKASH", walletNumber: "017" },
  { id: "m2", vendorId: "V1", type: "MOBILE_BANKING", isActive: true, isDefault: false, mobileProvider: "NAGAD", walletNumber: "018" },
  { id: "m3", vendorId: "V1", type: "MOBILE_BANKING", isActive: true, isDefault: false, mobileProvider: "ROCKET", walletNumber: "019" },
];
const groupButtons = (ui, label) => [...(ui.byLabel(label)?.querySelectorAll("button") ?? [])].map((b) => b.textContent.trim());

test("POS Settings: no bank-account section or Add Bank; store information still saves", { skip }, async () => {
  await withDom({ auth: OWNER_AUTH, route: withSettings(posBackend()) }, async (ui, React) => {
    const { default: SettingsView } = await import("../src/app/pos/components/views/SettingsView.tsx");
    const { operatorFromMe } = await import("../src/lib/pos/subscription-view.ts");
    await ui.render(React.createElement(SettingsView, { staff: operatorFromMe(POS_ME_OWNER), storeName: "Rahman Store", vendorId: "V1" }));
    await ui.settle(6);
    const t = ui.text();
    for (const s of ["Store Information", "Invoice Prefix", "Voucher Prefix", "Currency Symbol", "Store Online", "Receipt Footer Text", "Save Settings"]) assert.match(t, new RegExp(s));
    assert.doesNotMatch(t, /Bank Accounts for Card Payments|Add Bank|No bank accounts added/);
    assert.equal(ui.button("Add Bank"), undefined);
    await ui.type(ui.doc.querySelector('input[placeholder="INV-"]'), "SHOP-");
    await ui.click(ui.button("💾"));
    const put = ui.calls.find((c) => c.method === "PUT" && c.path === "/api/pos/settings");
    assert.deepEqual(put?.body, { ...SETTINGS, invoicePrefix: "SHOP-" });
    assert.ok(!ui.calls.some((c) => c.path.startsWith("/api/pos/bank-accounts")), "no bank-account calls");
  });
});

test("terminal: methods come from Purchase Entry's list + the vendor's payment accounts; only the method is sent", { skip }, async () => {
  await withDom({ auth: OWNER_AUTH, route: posBackend({ accounts: ACCOUNTS }) }, async (ui, React) => {
    const { default: PosPage } = await import("../src/app/pos/page.tsx");
    await ui.render(React.createElement(PosPage));
    await ui.settle(8);
    assert.ok(ui.calls.some((c) => c.method === "GET" && c.path === "/api/vendormanagement/V1/payment-accounts"), "Purchase Entry's account API");
    assert.ok(!ui.calls.some((c) => c.path.startsWith("/api/pos/bank-accounts")), "POS bank accounts no longer used");
    assert.deepEqual(groupButtons(ui, "Payment method"), ["Bank Transfer", "Cash", "Mobile Banking", "Card"], "Purchase Entry order and labels, no Cheque");

    await ui.click(ui.button("Mobile Banking"));
    assert.deepEqual(groupButtons(ui, "Mobile Banking provider"), ["bKash", "Nagad"], "no Rocket");
    await ui.click(ui.button("Nagad"));
    assert.match(ui.text(), /no card or wallet charge is made here/i);

    await ui.click(ui.byLabel("Add Shirt - Red"));
    await ui.type(ui.byLabel("Paid amount"), "105");
    await ui.click(ui.button("⚡ Charge"));
    await ui.settle(6);
    const posts = ui.calls.filter((c) => c.method === "POST" && c.path === "/api/pos/sales");
    assert.equal(posts.length, 1);
    const b = posts[0].body;
    assert.equal(b.paymentMethod, "NAGAD");
    for (const k of ["bankAccountId", "vendorPaymentAccountId", "supplierId", "purchaseId", "vendorId", "staffId"]) assert.ok(!(k in b), `${k} never sent`);
    assert.match(ui.text(), /INV-260923-0001/);
  });
});

test("terminal: staff who can't read payment accounts get Cash only (no forbidden call) and a cash sale works", { skip }, async () => {
  const empMe = { ...ME_OWNER, role: "EMPLOYEE", employeeId: "E1", permissions: { posAccess: true } };
  const empPos = { ...POS_ME_OWNER, employeeId: "E1", isOwner: false, displayName: "Rina", grants: { posDiscount: false, posCredit: false, posRefund: false, posReports: false } };
  const empAuth = { user: { id: "E1", role: "EMPLOYEE", vendorId: "V1", employeeId: "E1" }, accessToken: "t" };
  await withDom({ auth: empAuth, route: posBackend({ me: empMe, posMe: empPos, accounts: () => [403, { success: false, message: "Forbidden" }] }) }, async (ui, React) => {
    const { default: PosPage } = await import("../src/app/pos/page.tsx");
    await ui.render(React.createElement(PosPage));
    await ui.settle(8);
    assert.ok(!ui.calls.some((c) => c.path.includes("/payment-accounts")), "no call that the server would refuse");
    assert.ok(!ui.calls.some((c) => c.path === "/api/auth/refresh"), "no token refresh");
    assert.deepEqual(groupButtons(ui, "Payment method"), ["Cash"]);
    assert.match(ui.text(), /Only Cash is available on your account/);
    await ui.click(ui.byLabel("Add Shirt - Red"));
    await ui.type(ui.byLabel("Paid amount"), "200"); // over-payment → change confirmation
    await ui.click(ui.button("⚡ Charge"));
    assert.match(ui.text(), /Paid Amount Exceeds Invoice/);
    const dialog = ui.byLabel("Confirm change");
    await ui.click([...dialog.querySelectorAll("button")].pop());
    await ui.settle(6);
    const posts = ui.calls.filter((c) => c.method === "POST" && c.path === "/api/pos/sales");
    assert.equal(posts.length, 1);
    assert.equal(posts[0].body.paymentMethod, "CASH");
    assert.equal(posts[0].body.paidAmount, 200, "tendered is sent; the server records change");
    assert.match(ui.text(), /INV-260923-0001/);
  });
});

// ─── 6. receiving account per payment method ───────────────────────────────

const MANY = [
  { id: "b1", vendorId: "V1", type: "BANK", isActive: true, isDefault: true, label: "Main DBBL", accountNumber: "1234567890", bankBranch: { branchName: "Motijheel", bank: { name: "Dutch-Bangla Bank" } } },
  { id: "b2", vendorId: "V1", type: "BANK", isActive: true, isDefault: false, accountNumber: "5550001111", bankBranch: { branchName: "Gulshan", bank: { name: "BRAC Bank" } } },
  { id: "b3", vendorId: "V1", type: "BANK", isActive: false, isDefault: false, label: "Closed", accountNumber: "999" },
  { id: "c1", vendorId: "V1", type: "CARD", isActive: true, isDefault: false, cardProcessor: "SSLCommerz POS", merchantId: "MID778899" },
  { id: "m1", vendorId: "V1", type: "MOBILE_BANKING", isActive: true, isDefault: false, label: "Shop bKash", mobileProvider: "BKASH", walletNumber: "01710000001" },
  { id: "m2", vendorId: "V1", type: "MOBILE_BANKING", isActive: true, isDefault: false, mobileProvider: "BKASH", walletNumber: "01710000002", walletKind: "Merchant" },
  { id: "m3", vendorId: "V1", type: "MOBILE_BANKING", isActive: true, isDefault: false, mobileProvider: "NAGAD", walletNumber: "01810000003" },
];
const optionTexts = (ui) => [...(ui.byLabel("Receiving account")?.querySelectorAll("option") ?? [])].filter((o) => o.value).map((o) => `${o.value}|${o.textContent}`);
const pick = async (ui, value) => {
  const sel = ui.byLabel("Receiving account");
  assert.ok(sel && sel.tagName === "SELECT");
  await (async () => {
    Object.getOwnPropertyDescriptor(ui.doc.defaultView.HTMLSelectElement.prototype, "value").set.call(sel, value);
    sel.dispatchEvent(new ui.doc.defaultView.Event("change", { bubbles: true }));
  })();
  await ui.settle(2);
};

test("terminal: each method shows only its own active accounts (masked); a method change clears the account; nothing extra is sent", { skip }, async () => {
  await withDom({ auth: OWNER_AUTH, route: posBackend({ accounts: MANY }) }, async (ui, React) => {
    const { default: PosPage } = await import("../src/app/pos/page.tsx");
    await ui.render(React.createElement(PosPage));
    await ui.settle(8);
    assert.equal(ui.byLabel("Receiving account"), null, "cash: no account control");

    await ui.click(ui.button("Bank Transfer"));
    assert.deepEqual(optionTexts(ui), ["b1|Main DBBL · Dutch-Bangla Bank · Motijheel · ••7890", "b2|BRAC Bank · Gulshan · ••1111"], "active banks only");
    assert.equal(ui.byLabel("Receiving account").value, "", "several accounts: no silent default");
    assert.ok(!ui.text().includes("1234567890") && !ui.doc.body.innerHTML.includes("1234567890"), "full account number never rendered");
    await pick(ui, "b2");
    assert.equal(ui.byLabel("Receiving account").value, "b2");

    await ui.click(ui.button("Card"));
    assert.match(ui.byLabel("Receiving account").textContent, /Pays into SSLCommerz POS · ••8899/, "the one card account is shown");
    await ui.click(ui.button("Bank Transfer"));
    assert.equal(ui.byLabel("Receiving account").value, "", "bank selection cleared by the method change");

    await ui.click(ui.button("Mobile Banking"));
    assert.deepEqual(optionTexts(ui), ["m1|Shop bKash · bKash · ••0001", "m2|bKash · Merchant · ••0002"], "bKash wallets only");
    await pick(ui, "m2");
    await ui.click(ui.button("Nagad"));
    assert.match(ui.byLabel("Receiving account").textContent, /Pays into Nagad · ••0003/);
    await ui.click(ui.button("bKash"));
    assert.equal(ui.byLabel("Receiving account").value, "", "wallet selection cleared by the provider change");
    await pick(ui, "m1");
    assert.match(ui.text(), /the account isn.t saved with it yet/, "the cashier is told the account is not recorded");

    await ui.click(ui.byLabel("Add Shirt - Red"));
    await ui.type(ui.byLabel("Paid amount"), "105");
    await ui.click(ui.button("⚡ Charge"));
    await ui.settle(6);
    const posts = ui.calls.filter((c) => c.method === "POST" && c.path === "/api/pos/sales");
    assert.equal(posts.length, 1);
    assert.equal(posts[0].body.paymentMethod, "BKASH");
    for (const k of ["bankAccountId", "vendorPaymentAccountId", "paymentAccountId", "accountId", "chartOfAccountId"]) assert.ok(!(k in posts[0].body), `${k} not sent (no backend field for it)`);
    assert.match(ui.text(), /INV-260923-0001/);
  });
});

test("terminal: account load states — loading, then a failure that leaves Cash and offers Retry, then the accounts", { skip }, async () => {
  let release;
  let n = 0;
  const gate = new Promise((r) => (release = r));
  const accounts = async () => (++n === 1 ? (await gate, [500, { success: false, message: "boom" }]) : ok(MANY));
  await withDom({ auth: OWNER_AUTH, route: posBackend({ accounts }) }, async (ui, React) => {
    const { default: PosPage } = await import("../src/app/pos/page.tsx");
    await ui.render(React.createElement(PosPage));
    await ui.settle(8);
    assert.match(ui.text(), /Loading the store.s payment accounts/);
    release();
    await ui.settle(8);
    assert.match(ui.text(), /Couldn.t load the store.s payment accounts — Cash still works/);
    assert.deepEqual(groupButtons(ui, "Payment method"), ["Cash"]);
    assert.ok(!ui.calls.some((c) => c.path === "/api/auth/refresh"), "a failed load is not treated as an expired session");
    await ui.click(ui.button("Retry"));
    await ui.settle(6);
    assert.deepEqual(groupButtons(ui, "Payment method"), ["Bank Transfer", "Cash", "Mobile Banking", "Card"]);
  });
});

// ─── 7. header layout ──────────────────────────────────────────────────────

test("layout: no page header/date or navbar clock; one Clear button beside Current Sale clears the cart; no item counter", { skip }, async () => {
  await withDom({ auth: OWNER_AUTH, route: posBackend() }, async (ui, React) => {
    const { default: PosPage } = await import("../src/app/pos/page.tsx");
    await ui.render(React.createElement(PosPage));
    await ui.settle(8);
    const t = ui.text();
    assert.doesNotMatch(t, /\b\d{1,2}:\d{2}:\d{2}\s?(AM|PM)\b/i, "no clock");
    assert.doesNotMatch(t, /(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday), /, "no date line");
    assert.doesNotMatch(t, /\d+ items/, "no item counter");
    const clears = [...ui.doc.querySelectorAll("button")].filter((b) => b.textContent.trim() === "Clear");
    assert.equal(clears.length, 1, "exactly one Clear button");
    const heading = [...ui.doc.querySelectorAll("span")].find((s) => s.textContent.trim() === "🛒 Current Sale");
    assert.equal(clears[0].parentElement, heading.parentElement, "Clear sits in the Current Sale row");
    await ui.click(ui.byLabel("Add Shirt - Red"));
    assert.ok(ui.byLabel("More Shirt - Red"), "item in cart");
    await ui.click(clears[0]);
    assert.equal(ui.byLabel("More Shirt - Red"), null, "Clear empties the cart");
    assert.match(ui.text(), /Cart is empty/);
  });
});

// ─── 8. customer credit ────────────────────────────────────────────────────

const KARIM = { id: "C1", vendorId: "V1", name: "Karim", phone: "01711111111", email: null, nid: null, address: null, note: null, loanLimit: 100, loanBalance: 60, loanInterestRate: 12, loanTenureDays: 30, creditScore: "Good", walletBalance: 0, due: 60, orders: 3, spent: 900, lastOrderAt: null, createdAt: "2026-10-01T00:00:00Z" };
const NOLIMIT = { ...KARIM, id: "C2", name: "Rahim", phone: "01822222222", loanLimit: 0, loanBalance: 0, due: 0 };
const btnWith = (ui, text) => [...ui.doc.querySelectorAll("button")].find((b) => b.textContent.includes(text));
const pickCustomer = async (ui, current, name) => {
  await ui.click(btnWith(ui, current));
  await ui.click(btnWith(ui, name));
};

test("credit at checkout: no facility and over-limit are stopped with the server's reason; within the limit shows the real headroom and sells", { skip }, async () => {
  await withDom({ auth: OWNER_AUTH, route: posBackend({ customers: [KARIM, NOLIMIT] }) }, async (ui, React) => {
    const { default: PosPage } = await import("../src/app/pos/page.tsx");
    await ui.render(React.createElement(PosPage));
    await ui.settle(8);
    await ui.click(ui.byLabel("Add Shirt - Red")); // 105 incl. VAT

    await pickCustomer(ui, "Walk-in Customer", "Rahim");
    await ui.type(ui.byLabel("Paid amount"), "50");
    await ui.click(ui.button("⚡ Charge"));
    assert.match(ui.text(), /no credit facility/);
    assert.equal(ui.byLabel("Confirm credit sale"), null, "no confirm dialog");

    await pickCustomer(ui, "Rahim", "Karim"); // limit 100, due 60 → 40 available
    await ui.type(ui.byLabel("Paid amount"), "50"); // leaves 55
    await ui.click(ui.button("⚡ Charge"));
    assert.match(ui.text(), /Credit limit exceeded: 40\.00 available of 100\.00, this sale needs 55\.00/);
    assert.equal(ui.byLabel("Confirm credit sale"), null);
    assert.ok(!ui.calls.some((c) => c.method === "POST" && c.path === "/api/pos/sales"), "nothing sent");

    await ui.type(ui.byLabel("Paid amount"), "70"); // leaves 35
    await ui.click(ui.button("⚡ Charge"));
    const dialog = ui.byLabel("Confirm credit sale");
    assert.ok(dialog, "confirm shown");
    assert.match(dialog.textContent, /Credit Facility Enabled/);
    assert.match(dialog.textContent, /Outstanding ৳60.*of ৳100.*৳40.*available/s, "uses due, not loanBalance");
    await ui.click([...dialog.querySelectorAll("button")].pop());
    await ui.settle(6);
    const post = ui.calls.find((c) => c.method === "POST" && c.path === "/api/pos/sales");
    assert.equal(post.body.customerId, "C1");
    assert.equal(post.body.paidAmount, 70);
    for (const k of ["loanLimit", "due", "loanBalance", "extraAmount", "dueCutAmount", "walletAddAmount"]) assert.ok(!(k in post.body), `${k} never sent`);
  });
});

test("a server credit refusal (e.g. another till used the headroom) is shown and no receipt appears", { skip }, async () => {
  const refuse = async () => [409, { success: false, message: "Credit limit exceeded: 10.00 available of 100.00, this sale needs 35.00" }];
  await withDom({ auth: OWNER_AUTH, route: posBackend({ customers: [KARIM], onSale: refuse }) }, async (ui, React) => {
    const { default: PosPage } = await import("../src/app/pos/page.tsx");
    await ui.render(React.createElement(PosPage));
    await ui.settle(8);
    await ui.click(ui.byLabel("Add Shirt - Red"));
    await pickCustomer(ui, "Walk-in Customer", "Karim");
    await ui.type(ui.byLabel("Paid amount"), "70");
    await ui.click(ui.button("⚡ Charge"));
    await ui.click([...ui.byLabel("Confirm credit sale").querySelectorAll("button")].pop());
    await ui.settle(6);
    assert.match(ui.text(), /Credit limit exceeded: 10\.00 available/);
    assert.ok(!/INV-260923-0001/.test(ui.text()));
  });
});

test("customer form: staff without POS Credit never send credit terms (profile edits work); credit holders get the limit field", { skip }, async () => {
  const writes = [];
  const onCustomerWrite = async (method, body) => (writes.push({ method, body }), ok({ ...KARIM, ...body }));
  await withDom({ auth: OWNER_AUTH, route: posBackend({ customers: [KARIM], onCustomerWrite }) }, async (ui, React) => {
    const { default: CustomerFormModal } = await import("../src/app/pos/components/CustomerFormModal.tsx");
    await ui.render(React.createElement(CustomerFormModal, { editData: KARIM, canSetCredit: false, onClose() {}, onSaved() {} }));
    assert.equal(ui.byLabel("Credit limit"), null, "no limit field");
    assert.match(ui.text(), /Changing it needs the POS Credit Sales permission/);
    await ui.click(btnWith(ui, "Save Customer"));
    assert.equal(writes.length, 1);
    assert.equal(writes[0].method, "PUT");
    assert.ok(!("loanLimit" in writes[0].body), "no credit terms from a non-credit user");
    assert.equal(writes[0].body.name, "Karim");
  });
  await withDom({ auth: OWNER_AUTH, route: posBackend({ customers: [KARIM], onCustomerWrite }) }, async (ui, React) => {
    const { default: CustomerFormModal } = await import("../src/app/pos/components/CustomerFormModal.tsx");
    await ui.render(React.createElement(CustomerFormModal, { editData: KARIM, canSetCredit: true, onClose() {}, onSaved() {} }));
    assert.match(ui.text(), /Outstanding due 60\.00 · 40\.00 available/);
    await ui.type(ui.byLabel("Credit limit"), "250");
    await ui.click(btnWith(ui, "Save Customer"));
    assert.equal(writes[1].body.loanLimit, 250);
    await ui.type(ui.byLabel("Credit limit"), "-5");
    await ui.click(btnWith(ui, "Save Customer"));
    assert.match(ui.text(), /Credit limit must be 0 or more/);
    assert.equal(writes.length, 2, "invalid limit not sent");
  });
});

test("a suspended store: the server's refusal is shown and no receipt appears", { skip }, async () => {
  const refuse = async () => [403, { success: false, message: "This store is suspended — new POS sales are paused. Refunds and due collection are still available." }];
  await withDom({ auth: OWNER_AUTH, route: posBackend({ onSale: refuse }) }, async (ui, React) => {
    const { default: PosPage } = await import("../src/app/pos/page.tsx");
    await ui.render(React.createElement(PosPage));
    await ui.settle(8);
    await ui.click(ui.byLabel("Add Shirt - Red"));
    await ui.type(ui.byLabel("Paid amount"), "105");
    await ui.click(ui.button("⚡ Charge"));
    await ui.settle(6);
    assert.match(ui.text(), /This store is suspended — new POS sales are paused/);
    assert.ok(!/INV-260923-0001/.test(ui.text()), "no receipt");
  });
});
