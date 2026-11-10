// tests/offer-management-ui.test.mjs
//
// Offer management redesign (admin + vendor).
//   1. pure (lib/offers/offer-view): one display status per offer, discount /
//      usage / validity text, status tabs → server filters, "next page" only
//      when a page came back full, search, form + wizard step validation;
//   2. runtime (jsdom, real store + RTK Query, fetch stubbed — no backend):
//      vendor list → stat cards from real rows, approval banner, tabs and type
//      filter go to the server, search narrows the page, create buttons follow
//      permissions, edit dialog is pre-filled and sends type/discountType,
//      over-limit discount blocked client-side, deactivate only reports success
//      when the server says the offer is off; admin list → pending banner,
//      "Review now" filters to pending vendor offers, reject needs a reason.
//   node --test tests/offer-management-ui.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { register, createRequire } from "node:module";
import { format } from "node:util";

register("./support/tsx-loader.mjs", import.meta.url);
const require = createRequire(import.meta.url);
const V = await import("../src/lib/offers/offer-view.ts");

const NOW = new Date("2026-10-22T06:00:00Z");
const day = (n) => new Date(NOW.getTime() + n * 86400000).toISOString();

const offer = (over = {}) => ({
  id: "O1",
  title: "Eid sale",
  description: "Big savings",
  slug: "eid-sale",
  type: "REGULAR_DISCOUNT",
  category: "GENERAL",
  status: "APPROVED",
  discountType: "PERCENTAGE",
  discountValue: 10,
  minOrderAmount: 0,
  validFrom: day(-5),
  validTo: day(20),
  userUsageLimit: 1,
  currentUsageCount: 3,
  isPublic: true,
  isActive: true,
  applicableToAll: true,
  priority: 1,
  createdByType: "VENDOR",
  createdAt: day(-5),
  updatedAt: day(-5),
  ...over,
});

// ---------------------------------------------------------------------------
// 1. pure
// ---------------------------------------------------------------------------

test("display status: rejected → pending → expired → inactive → scheduled → active", () => {
  const s = (o) => V.getOfferDisplayStatus(offer(o), NOW);
  assert.equal(s({ status: "REJECTED", isActive: false }), "rejected");
  assert.equal(s({ status: "PENDING", isActive: false }), "pending");
  assert.equal(s({ status: "EXPIRED" }), "expired");
  assert.equal(s({ validTo: day(-1) }), "expired", "past end date counts as expired even if the status lags");
  assert.equal(s({ status: "PAUSED" }), "inactive");
  assert.equal(s({ isActive: false }), "inactive");
  assert.equal(s({ validFrom: day(2) }), "scheduled");
  assert.equal(s({}), "active");
  assert.equal(s({ status: "ACTIVE", validTo: undefined }), "active", "no end date");
});

test("discount, usage and validity text use real fields and Taka", () => {
  assert.equal(V.formatOfferDiscount(offer({ maxDiscountAmount: 500 })), "10% off · max ৳500");
  assert.equal(V.formatOfferDiscount(offer({ discountType: "FIXED_AMOUNT", discountValue: 150 })), "৳150 off");
  assert.equal(V.formatOfferDiscount(offer({ discountType: "FREE_SHIPPING" })), "Free shipping");
  assert.equal(V.formatOfferDiscount(offer({ discountType: "BUY_X_GET_Y", buyXGetYOffer: { buyQuantity: 2, getQuantity: 1 } })), "Buy 2 get 1");
  assert.equal(V.formatUsage(offer({ totalUsageLimit: 100 })), "3 / 100");
  assert.equal(V.formatUsage(offer()), "3 used");
  assert.equal(V.usagePercent(offer()), null, "no limit → no meter");
  assert.equal(V.usagePercent(offer({ currentUsageCount: 150, totalUsageLimit: 100 })), 100);
  assert.deepEqual(V.describeValidity(offer({ validTo: day(3) }), NOW).hint, "3 days left");
  assert.match(V.describeValidity(offer({ validFrom: day(4) }), NOW).primary, /^Starts /);
  assert.equal(V.describeValidity(offer({ validTo: undefined }), NOW).primary, "No end date");
  assert.equal(V.formatTaka("x"), "—");
});

test("status tabs map to list-endpoint filters; type/creator pass through; page ≥ 1", () => {
  const f = (tab, extra = {}) => V.buildOfferFilters({ tab, type: "ALL", page: 1, limit: 10, ...extra });
  assert.deepEqual(f("all"), { page: 1, limit: 10 });
  assert.deepEqual(f("active"), { page: 1, limit: 10, isActive: true });
  assert.deepEqual(f("pending"), { page: 1, limit: 10, status: "PENDING" });
  assert.deepEqual(f("inactive"), { page: 1, limit: 10, isActive: false });
  assert.deepEqual(f("expired"), { page: 1, limit: 10, status: "EXPIRED" });
  assert.deepEqual(f("rejected"), { page: 1, limit: 10, status: "REJECTED" });
  assert.deepEqual(f("all", { type: "VOUCHER", createdByType: "VENDOR", page: 0 }), { page: 1, limit: 10, type: "VOUCHER", createdByType: "VENDOR" });
  // isActive=true still lets an offer past its end date through; the Active tab hides it.
  const rows = V.rowsForTab([offer({ id: "a" }), offer({ id: "b", validTo: day(-1) })], "active", NOW);
  assert.deepEqual(rows.map((o) => o.id), ["a"]);
  assert.equal(V.hasNextPage(10, 10), true);
  assert.equal(V.hasNextPage(9, 10), false);
});

test("search covers title, description, voucher code and store name", () => {
  const o = offer({ voucherConfig: { code: "EID50" }, createdByVendor: { storeName: "Dhaka Mart" } });
  for (const q of ["eid sale", "SAVINGS", "eid50", "dhaka", ""]) assert.equal(V.matchesOfferSearch(o, q), true, q);
  assert.equal(V.matchesOfferSearch(o, "nothing"), false);
});

test("form validation mirrors the vendor's discount limits and date order", () => {
  const limits = { maxDiscountPercent: 30, maxDiscountAmount: 500 };
  const base = { title: "T", discountType: "PERCENTAGE", discountValue: 10, validFrom: day(0), validTo: day(5), userUsageLimit: 1 };
  assert.deepEqual(Object.values(V.validateOfferForm(base, limits)).filter(Boolean), []);
  assert.match(V.validateOfferForm({ ...base, title: "  " }).title, /title/);
  assert.match(V.validateOfferForm({ ...base, discountValue: 40 }, limits).discountValue, /30%/);
  assert.match(V.validateOfferForm({ ...base, discountType: "FIXED_AMOUNT", discountValue: 600 }, limits).discountValue, /৳500/);
  assert.match(V.validateOfferForm({ ...base, discountValue: 0 }).discountValue, /greater than 0/);
  assert.match(V.validateOfferForm({ ...base, discountValue: NaN }).discountValue, /greater than 0/);
  assert.equal(V.validateOfferForm({ ...base, discountType: "FREE_SHIPPING", discountValue: 0 }).discountValue, undefined);
  assert.match(V.validateOfferForm({ ...base, validTo: day(-1) }).validTo, /after the start/);
  assert.match(V.validateOfferForm({ ...base, totalUsageLimit: 1.5 }).totalUsageLimit, /whole number/);
  assert.match(V.validateOfferForm({ ...base, userUsageLimit: 0 }).userUsageLimit, /whole number/);
  assert.equal(V.normalizeVoucherCode("eid 2026_x!"), "EID2026X");
  assert.match(V.validateVoucherCode("AB"), /4 characters/);
});

test("wizard steps validate independently", () => {
  const data = { title: "", type: "VOUCHER", discountType: "PERCENTAGE", discountValue: 0, validFrom: day(0), userUsageLimit: 1, applicableToAll: false, voucherConfig: { code: "", isAutoGenerated: false } };
  assert.equal(V.validateWizardStep("basic", data).length, 2, "title + voucher code");
  assert.equal(V.validateWizardStep("basic", { ...data, voucherConfig: { isAutoGenerated: true } , title: "x" }).length, 0);
  assert.equal(V.validateWizardStep("discount", data).length, 1);
  assert.equal(V.validateWizardStep("rules", data).length, 0);
  assert.equal(V.validateWizardStep("advanced", data, { targetProductCount: 0 }).length, 1);
  assert.equal(V.validateWizardStep("advanced", data, { targetProductCount: 2 }).length, 0);
  assert.equal(V.validateWizardStep("discount", { ...data, type: "BUY_X_GET_Y", discountType: "BUY_X_GET_Y", buyXGetYConfig: { buyQuantity: 0, getQuantity: 1 } }).length, 1);
});

// ---------------------------------------------------------------------------
// 2. runtime (jsdom)
// ---------------------------------------------------------------------------

let JSDOM = null;
try {
  ({ JSDOM } = require("jsdom"));
} catch {
  JSDOM = null;
}
const skip = JSDOM ? false : "jsdom is not installed (it is only a transitive dependency)";

async function withDom(route, fn) {
  const dom = new JSDOM("<!doctype html><html><body><div id=root></div></body></html>", { url: "http://localhost:3000/", pretendToBeVisual: true });
  const g = globalThis;
  const saved = {};
  const setGlobal = (k, v) => {
    saved[k] = Object.getOwnPropertyDescriptor(g, k);
    Object.defineProperty(g, k, { value: v, configurable: true, writable: true });
  };
  for (const k of ["window", "document", "navigator", "HTMLElement", "Node", "Element", "MutationObserver", "getComputedStyle", "Event", "CustomEvent", "MouseEvent", "KeyboardEvent", "FocusEvent", "PointerEvent", "NodeFilter", "localStorage"]) {
    setGlobal(k, k === "window" ? dom.window : dom.window[k]);
  }
  setGlobal("requestAnimationFrame", (cb) => setTimeout(cb, 0));
  setGlobal("cancelAnimationFrame", clearTimeout);
  for (const k of Object.getOwnPropertyNames(dom.window)) {
    if (/^(HTML|SVG)\w*Element$|^(DocumentFragment|ShadowRoot|Text|Range|Selection|DOMRect)$/.test(k) && !(k in saved)) setGlobal(k, dom.window[k]);
  }
  // jsdom has no ResizeObserver (Radix Switch/Slider measure themselves).
  setGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
  dom.window.ResizeObserver = globalThis.ResizeObserver;
  dom.window.scrollTo = () => {};
  dom.window.HTMLElement.prototype.scrollIntoView = () => {};
  dom.window.HTMLElement.prototype.hasPointerCapture = () => false;
  dom.window.HTMLElement.prototype.releasePointerCapture = () => {};
  g.IS_REACT_ACT_ENVIRONMENT = true;
  // The next/navigation stub keeps the array it saw first: clear in place.
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
  const { offerApi } = await import("../src/features/offerApi.ts");
  const authReducer = (await import("../src/features/authSlice.ts")).default;
  const store = configureStore({
    reducer: { auth: authReducer, [offerApi.reducerPath]: offerApi.reducer },
    middleware: (gd) => gd({ serializableCheck: false, immutableCheck: false }).concat(offerApi.middleware),
  });

  let root;
  const run = async (f) => {
    try {
      await act(f);
    } catch (err) {
      for (const e of err?.errors ?? [err]) errors.push(String(e?.message ?? e));
    }
  };
  const settle = async (n = 5) => {
    for (let i = 0; i < n; i++) await run(() => new Promise((r) => setTimeout(r, 40)));
  };
  const doc = dom.window.document;
  const all = (sel) => [...doc.querySelectorAll(sel)];
  const ui = {
    doc,
    errors,
    calls,
    settle,
    text: () => doc.body.textContent,
    button: (label) => all("button").find((b) => b.textContent.trim().startsWith(label)),
    byLabel: (label) => doc.querySelector(`[aria-label="${label}"]`),
    click: async (el) => {
      assert.ok(el, "element to click exists");
      await run(async () => el.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true })));
      await settle();
    },
    /** Radix menus/selects open on pointerdown / keyboard, not click. */
    openMenu: async (el) => {
      assert.ok(el, "menu trigger exists");
      await run(async () => {
        el.focus();
        el.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
      });
      await settle();
    },
    type: async (el, value) => {
      assert.ok(el, "input exists");
      const proto = el.tagName === "TEXTAREA" ? dom.window.HTMLTextAreaElement.prototype : dom.window.HTMLInputElement.prototype;
      await run(async () => {
        Object.getOwnPropertyDescriptor(proto, "value").set.call(el, value);
        el.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
      });
      await settle();
    },
    select: async (el, value) => {
      assert.ok(el, "select exists");
      await run(async () => {
        Object.getOwnPropertyDescriptor(dom.window.HTMLSelectElement.prototype, "value").set.call(el, value);
        el.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
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
    store.dispatch(offerApi.util.resetApiState());
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

const PERMS = {
  id: "P1", vendorId: "V1",
  canCreateRegular: true, canCreateVoucher: true, canCreateCountdown: false, canCreateFlashSale: false,
  canCreateBuyXGetY: false, canCreateFreeShipping: false, canCreateBundleDeal: false, canCreateSeasonalSale: false,
  canCreateLoyaltyReward: false, canCreateReferralBonus: false,
  maxDiscountPercent: 30, maxDiscountAmount: 500, maxActiveOffers: 5, requiresApproval: true,
};
const VENDOR_OFFERS = [
  offer({ id: "A1", title: "Live deal", validFrom: new Date(Date.now() - 86400000).toISOString(), validTo: new Date(Date.now() + 9 * 86400000).toISOString(), currentUsageCount: 7 }),
  offer({ id: "P1", title: "Waiting voucher", type: "VOUCHER", status: "PENDING", isActive: false, voucherConfig: { code: "WAIT10" }, currentUsageCount: 0 }),
  offer({ id: "R1", title: "Too deep", status: "REJECTED", isActive: false, currentUsageCount: 0 }),
];
const json = (data) => [200, { success: true, data, pagination: { page: 1, limit: 10, total: Array.isArray(data) ? data.length : 0 } }];

function vendorRoutes(state) {
  return async (method, url, body) => {
    if (method === "GET" && url.pathname === "/api/offers/vendor/permissions") return json(PERMS);
    if (method === "GET" && url.pathname === "/api/offers/vendor") {
      const q = url.searchParams;
      let rows = VENDOR_OFFERS;
      if (q.get("status")) rows = rows.filter((o) => o.status === q.get("status"));
      if (q.get("type")) rows = rows.filter((o) => o.type === q.get("type"));
      if (q.get("isActive")) rows = rows.filter((o) => String(o.isActive) === q.get("isActive"));
      return json(rows);
    }
    if (method === "PATCH" && url.pathname === "/api/offers/vendor/A1/deactivate") return json({ ...VENDOR_OFFERS[0], isActive: state.deactivateWorks ? false : true });
    if (method === "PUT" && url.pathname === "/api/offers/vendor/A1") return json({ ...VENDOR_OFFERS[0], ...body });
    return null;
  };
}

test("vendor offers page: real stats, approval banner, server-side tabs/type, search, permission-aware actions", { skip }, async () => {
  await withDom(vendorRoutes({}), async (ui, React) => {
    const { VendorOffersManagement } = await import("../src/components/vendor/offers/vendor-offers-management.tsx");
    await ui.render(React.createElement(VendorOffersManagement));
    const text = ui.text();
    assert.match(text, /Offers & vouchers/);
    assert.match(text, /Up to 30% or ৳500 off/);
    assert.match(text, /5 active offers max/);
    assert.match(text, /1 offer waiting for approval/, "banner from real pending rows");
    // Stat cards (window query, limit=100): 3 offers, 1 live, 1 pending, 7 redemptions.
    const stat = (label) => [...ui.doc.querySelectorAll("section[aria-label='Offer summary'] p")].find((p) => p.textContent === label)?.nextElementSibling?.textContent;
    assert.equal(stat("Offers"), "3");
    assert.equal(stat("Live now"), "1");
    assert.equal(stat("Pending review"), "1");
    assert.equal(stat("Redemptions"), "7");
    assert.equal(stat("Discount cap"), "30%");
    assert.ok(ui.calls.some((c) => c.path === "/api/offers/vendor" && c.query.limit === "100"), "stats window request");
    assert.ok(!ui.calls.some((c) => c.path.startsWith("/api/offers/vendor/analytics")), "no call to the unusable analytics URL");
    assert.ok(!ui.calls.some((c) => c.path.includes("/admin/")), "vendor page never calls admin endpoints");

    // Both create actions enabled by these permissions.
    assert.equal(ui.button("Create offer").disabled, false);
    assert.equal(ui.button("Create voucher").disabled, false);
    await ui.click(ui.button("Create offer"));
    assert.deepEqual(globalThis.__routerPushes.at(-1), "/vendor-dashboard/offer/add-offer");

    // Status badges and voucher code on the rows.
    assert.match(ui.text(), /Pending review/);
    assert.match(ui.text(), /Rejected/);
    assert.ok(ui.byLabel("Copy voucher code WAIT10"), "voucher code has a copy button");

    // Tab → server filter.
    const tab = (label) => [...ui.doc.querySelectorAll("[role=tab]")].find((t) => t.textContent.trim().startsWith(label));
    await ui.click(tab("Pending"));
    assert.equal(tab("Pending").getAttribute("aria-selected"), "true");
    assert.ok(ui.calls.some((c) => c.path === "/api/offers/vendor" && c.query.status === "PENDING" && c.query.limit === "10"));
    await ui.click(tab("All"));

    // Type filter → server filter.
    await ui.select(ui.byLabel("Filter by offer type"), "VOUCHER");
    assert.ok(ui.calls.some((c) => c.path === "/api/offers/vendor" && c.query.type === "VOUCHER"));
    await ui.select(ui.byLabel("Filter by offer type"), "ALL");

    // Search narrows the loaded page (debounced).
    await ui.type(ui.byLabel("Search offers on this page"), "wait10");
    await ui.settle(8);
    assert.match(ui.text(), /1 match on this page/);
    assert.ok(!/Live deal/.test([...ui.doc.querySelectorAll("tbody")].map((t) => t.textContent).join("")), "non-matching row hidden");

    const fatal = ui.errors.filter((e) => !/not wrapped in act|Missing `Description`|aria-describedby/.test(e));
    assert.deepEqual(fatal, []);
  });
});

test("vendor create buttons are disabled without permission", { skip }, async () => {
  const route = async (method, url) => {
    if (url.pathname === "/api/offers/vendor/permissions") return json({ ...PERMS, canCreateRegular: false, canCreateVoucher: false, requiresApproval: false });
    if (url.pathname === "/api/offers/vendor") return json([]);
    return null;
  };
  await withDom(route, async (ui, React) => {
    const { VendorOffersManagement } = await import("../src/components/vendor/offers/vendor-offers-management.tsx");
    await ui.render(React.createElement(VendorOffersManagement));
    assert.equal(ui.button("Create offer").disabled, true);
    assert.equal(ui.button("Create voucher").disabled, true);
    assert.match(ui.text(), /You haven't created any offers yet/);
    assert.doesNotMatch(ui.text(), /Create your first offer/, "no create CTA without permission");
    assert.equal(ui.doc.querySelector("[role=status]"), null, "no approval banner when approval isn't required");
    assert.doesNotMatch(ui.text(), /need FinixMart approval/);
  });
});

test("vendor edit dialog is pre-filled, validates limits and sends type + discountType", { skip }, async () => {
  await withDom(vendorRoutes({}), async (ui, React) => {
    const { EditVendorOfferDialog } = await import("../src/components/vendor/offers/edit-vendor-offer-dialog.tsx");
    const closed = [];
    await ui.render(React.createElement(EditVendorOfferDialog, { offer: VENDOR_OFFERS[0], onOpenChange: (o) => closed.push(o), permissions: PERMS }));
    const title = ui.doc.getElementById("edit-title");
    assert.equal(title.value, "Live deal", "form loads the selected offer (was empty before)");
    assert.equal(ui.doc.getElementById("edit-discountValue").value, "10");

    await ui.type(ui.doc.getElementById("edit-discountValue"), "45");
    await ui.click(ui.button("Save changes"));
    assert.match(ui.text(), /Your limit is 30%/);
    assert.ok(!ui.calls.some((c) => c.method === "PUT"), "nothing sent while invalid");

    await ui.type(ui.doc.getElementById("edit-discountValue"), "25");
    await ui.click(ui.button("Save changes"));
    const put = ui.calls.find((c) => c.method === "PUT");
    assert.ok(put, "update sent");
    assert.equal(put.path, "/api/offers/vendor/A1");
    assert.equal(put.body.discountValue, 25);
    assert.equal(put.body.type, "REGULAR_DISCOUNT");
    assert.equal(put.body.discountType, "PERCENTAGE");
    assert.equal(put.body.title, "Live deal");
    assert.deepEqual(closed, [false]);
  });
});

for (const works of [true, false]) {
  test(`vendor deactivate ${works ? "reports success" : "reports the server didn't switch it off"}`, { skip }, async () => {
    await withDom(vendorRoutes({ deactivateWorks: works }), async (ui, React) => {
      const { VendorOffersTable } = await import("../src/components/vendor/offers/vendor-offers-table.tsx");
      const sonner = await import("sonner");
      const toasts = [];
      const realS = sonner.toast.success, realE = sonner.toast.error;
      sonner.toast.success = (m) => toasts.push(["ok", m]);
      sonner.toast.error = (m) => toasts.push(["err", m]);
      try {
        await ui.render(React.createElement(VendorOffersTable, { offers: [VENDOR_OFFERS[0]], isLoading: false, isFetching: false, error: null, onRetry() {}, onEdit() {}, empty: { title: "none" } }));
        await ui.openMenu(ui.byLabel("Actions for Live deal"));
        const item = [...ui.doc.querySelectorAll("[role=menuitem]")].find((m) => m.textContent.includes("Deactivate"));
        assert.ok(item, "deactivate offered for an active offer");
        await ui.click(item);
        assert.match(ui.text(), /Deactivate this offer\?/, "asks for confirmation first");
        assert.ok(!ui.calls.some((c) => c.method === "PATCH"));
        await ui.click(ui.button("Deactivate"));
        assert.ok(ui.calls.some((c) => c.method === "PATCH" && c.path === "/api/offers/vendor/A1/deactivate"));
        assert.equal(toasts.at(-1)[0], works ? "ok" : "err");
        if (!works) assert.match(toasts.at(-1)[1], /still active/);
      } finally {
        sonner.toast.success = realS;
        sonner.toast.error = realE;
      }
    });
  });
}

test("admin offers page: pending banner, Review now → pending vendor filter, reject needs a reason", { skip }, async () => {
  const pendingVendor = offer({ id: "PV1", title: "Vendor promo", status: "PENDING", isActive: false, createdByVendor: { storeName: "Dhaka Mart" } });
  const adminOffer = offer({ id: "AD1", title: "Platform sale", createdByType: "ADMIN", status: "ACTIVE" });
  const route = async (method, url) => {
    const q = url.searchParams;
    if (method === "GET" && url.pathname === "/api/offers/admin") {
      let rows = [pendingVendor, adminOffer];
      if (q.get("status")) rows = rows.filter((o) => o.status === q.get("status"));
      if (q.get("createdByType")) rows = rows.filter((o) => o.createdByType === q.get("createdByType"));
      return json(rows);
    }
    if (url.pathname === "/api/offers/admin/analytics") return json([{ totalUsage: 3, totalRevenue: 1200 }]);
    if (url.pathname === "/api/offers/admin/vendor-permissions/stats") return json({ averageMaxDiscount: 22.456 });
    if (method === "PATCH" && url.pathname === "/api/offers/admin/PV1/approve") return json({ ...pendingVendor, status: "REJECTED" });
    return null;
  };
  await withDom(route, async (ui, React) => {
    const { OffersManagement } = await import("../src/components/admin/offers/offers-management.tsx");
    await ui.render(React.createElement(OffersManagement));
    assert.match(ui.text(), /1 vendor offer waiting for approval/);
    assert.match(ui.text(), /৳1,200 recorded revenue/);
    assert.match(ui.text(), /22\.5%/);
    assert.match(ui.text(), /Dhaka Mart/, "creator column shows the store");

    await ui.click(ui.button("Review now"));
    assert.ok(ui.calls.some((c) => c.path === "/api/offers/admin" && c.query.status === "PENDING" && c.query.createdByType === "VENDOR" && c.query.limit === "10"));
    assert.equal(ui.byLabel("Filter by creator").value, "VENDOR");

    await ui.openMenu(ui.byLabel("Actions for Vendor promo"));
    const reject = [...ui.doc.querySelectorAll("[role=menuitem]")].find((m) => m.textContent.includes("Reject"));
    assert.ok(reject, "approve/reject offered for a pending vendor offer");
    await ui.click(reject);
    const confirm = ui.button("Reject offer");
    assert.equal(confirm.disabled, true, "disabled until a reason is entered");
    await ui.type(ui.doc.getElementById("offer-reject-reason"), "Discount above policy");
    assert.equal(ui.button("Reject offer").disabled, false);
    await ui.click(ui.button("Reject offer"));
    const patch = ui.calls.find((c) => c.method === "PATCH");
    assert.deepEqual(patch.body, { approved: false, reason: "Discount above policy" });
  });
});

test("vendor create wizard: one stepper, Continue blocked until the step is valid, one submit, correct redirect", { skip }, async () => {
  let release;
  const gate = new Promise((r) => { release = r; });
  const route = async (method, url, body) => {
    if (url.pathname === "/api/offers/vendor/permissions") return json(PERMS);
    if (method === "POST" && url.pathname === "/api/offers/vendor") { await gate; return json({ id: "NEW", ...body }); }
    return null;
  };
  await withDom(route, async (ui, React) => {
    const { VendorCreateOfferPage } = await import("../src/components/offers/VendorCreateOfferPage.tsx");
    await ui.render(React.createElement(VendorCreateOfferPage));
    assert.equal(ui.doc.querySelectorAll("nav[aria-label='Offer steps']").length, 1, "a single stepper");
    assert.equal(ui.doc.querySelectorAll("[role=tablist]").length, 0, "the duplicate tab strip is gone");
    assert.equal(ui.doc.querySelector("[aria-current=step]").textContent.includes("Basic info"), true);
    assert.match(ui.text(), /Admin approval required/);

    // Title empty → Continue shows the problem and stays on step 1.
    await ui.click(ui.button("Continue"));
    assert.match(ui.text(), /Give the offer a title/);
    assert.ok(ui.doc.querySelector("[aria-current=step]").textContent.includes("Basic info"));
    // Later steps can't be jumped to while step 1 is invalid.
    const stepBtn = (label) => [...ui.doc.querySelectorAll("nav[aria-label='Offer steps'] button")].find((b) => b.textContent.includes(label));
    assert.equal(stepBtn("Advanced").disabled, true);

    await ui.type(ui.doc.getElementById("title"), "Puja week");
    await ui.click(ui.button("Continue"));
    assert.ok(ui.doc.querySelector("[aria-current=step]").textContent.includes("Discount"));
    // Discount 0 → blocked; over the 30% limit → blocked.
    await ui.click(ui.button("Continue"));
    assert.match(ui.text(), /greater than 0/);
    const discount = ui.doc.getElementById("discountValue");
    assert.ok(discount, "discount input");
    await ui.type(discount, "40");
    await ui.click(ui.button("Continue"));
    assert.match(ui.text(), /Your limit is 30%/);
    await ui.type(discount, "20");
    await ui.click(ui.button("Continue"));
    assert.ok(ui.doc.querySelector("[aria-current=step]").textContent.includes("Rules"));
    await ui.click(ui.button("Continue"));
    assert.ok(ui.doc.querySelector("[aria-current=step]").textContent.includes("Advanced"));
    assert.ok(!ui.calls.some((c) => c.method === "POST"), "nothing submitted before the last step");

    // Double submit → exactly one POST; button shows progress while in flight.
    const submit = ui.button("Submit for approval");
    assert.ok(submit, "approval-aware submit label");
    const form = submit.closest("form");
    await ui.click(submit);
    await ui.click(submit);
    form.dispatchEvent(new ui.doc.defaultView.Event("submit", { bubbles: true, cancelable: true }));
    await ui.settle();
    assert.equal(ui.calls.filter((c) => c.method === "POST").length, 1);
    release();
    await ui.settle(6);
    const post = ui.calls.find((c) => c.method === "POST");
    assert.equal(post.body.title, "Puja week");
    assert.equal(post.body.discountValue, 20);
    assert.equal(post.body.status, "PENDING");
    assert.equal(globalThis.__routerPushes.at(-1), "/vendor-dashboard/offer/offer-manage");
  });
});
