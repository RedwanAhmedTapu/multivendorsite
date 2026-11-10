// tests/marketing-admin-ui.test.mjs
//
// Marketing Center — vendor-programme tabs on the existing Campaigns page
// (frontend only; backend stubbed via fetch).
//   1. i18n: en/bn catalogues have the same keys, every message is valid ICU,
//      every t("…") key used by the marketing components exists, no
//      hard-coded English copy;
//   2. the RTK Query slice calls exactly the 10 programme endpoints (method,
//      URL, body) — nothing invented;
//   3. pure helpers: validation (registration must close before the page's
//      start), changed-fields update (published → no registration dates),
//      server-error mapping (page dates → liveWindow), ৳ formatting;
//   4. runtime (jsdom):
//      - Vendor Rules: no dates → notice, no form; enable → POST; published →
//        registration window disabled; tightening 409 → confirm → resend with
//        acknowledgeTightening;
//      - Registrations: approve 422 → violations; reject needs a reason; bulk
//        preview → confirm with the same expectedCount; no programme → notice;
//      - the REAL Campaigns page: ADMIN sees the programme chip and the tabs,
//        Details stays mounted (unsaved edits survive a tab switch);
//        marketingManagement staff get only the vendor tabs and never call the
//        ADMIN-only /api/campaigns; language switch to বাংলা.
//   node --test tests/marketing-admin-ui.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { register, createRequire } from "node:module";
import { format } from "node:util";

register("./support/tsx-loader.mjs", import.meta.url);
const require = createRequire(import.meta.url);

const read = (p) => readFileSync(new URL(`../src/${p}`, import.meta.url), "utf8");
const en = JSON.parse(read("messages/en.json"));
const bn = JSON.parse(read("messages/bn.json"));
const h = await import("../src/lib/marketing/campaign-admin.ts");

// ── 1. i18n ─────────────────────────────────────────────────────────────────

const flatKeys = (o, p = "") => Object.entries(o).flatMap(([k, v]) => (v && typeof v === "object" ? flatKeys(v, `${p}${k}.`) : [[`${p}${k}`, v]]));
const get = (o, path) => path.split(".").reduce((x, k) => (x == null ? undefined : x[k]), o);
const COMPONENT_DIR = new URL("../src/components/marketing/admin/", import.meta.url);

test("en and bn catalogues have exactly the same keys and no empty messages", () => {
  const ek = flatKeys(en).map(([k]) => k).sort();
  const bk = flatKeys(bn).map(([k]) => k).sort();
  assert.deepEqual(bk, ek);
  for (const [k, v] of [...flatKeys(en), ...flatKeys(bn)]) assert.ok(typeof v === "string" && v.trim(), `${k} is empty`);
});

test("every message is valid ICU in its locale", () => {
  const { IntlMessageFormat } = require("intl-messageformat");
  for (const [locale, cat] of [["en", en], ["bn", bn]]) {
    for (const [k, v] of flatKeys(cat)) {
      assert.doesNotThrow(() => new IntlMessageFormat(v, locale), `${locale}:${k}`);
    }
  }
});

test("every translation key used by the marketing components exists; old separate-UI namespaces are gone", () => {
  const missing = [];
  for (const f of readdirSync(COMPONENT_DIR)) {
    const src = readFileSync(new URL(f, COMPONENT_DIR), "utf8");
    // Scope per top-level function: the same variable name (t) may bind different namespaces.
    for (const chunk of src.split(/\n(?=(?:export )?function )/)) {
      const vars = new Map([...chunk.matchAll(/const (\w+) = useTranslations\("([^"]+)"\)/g)].map((m) => [m[1], m[2]]));
      for (const [v, ns] of vars) {
        assert.ok(get(en, ns), `${f}: namespace ${ns}`);
        for (const m of chunk.matchAll(new RegExp(`\\b${v}\\(\\s*"([^"]+)"`, "g"))) {
          if (get(en, `${ns}.${m[1]}`) === undefined) missing.push(`${f}: ${ns}.${m[1]}`);
        }
      }
    }
  }
  for (const k of h.REGISTRATION_FIELDS) assert.ok(get(en, `marketing.fields.${k}`), k);
  for (const k of ["DRAFT", "PUBLISHED", "ENDED", "CANCELLED"]) {
    assert.ok(get(en, `marketing.status.${k}`), `status ${k}`);
    assert.ok(get(en, `marketing.chip.${k}`), `chip ${k}`);
  }
  for (const k of ["PENDING", "APPROVED", "REJECTED", "WITHDRAWN"]) assert.ok(get(en, `marketing.registrationStatus.${k}`), k);
  for (const k of ["dateRequired", "registrationOrder", "registrationBeforeStart", "percent", "percentDecimals", "wholeNumber", "positiveWhole", "loosened", "datesLocked", "unknownCategories"]) {
    assert.ok(get(en, `marketing.errors.${k}`), `error code ${k}`);
  }
  for (const ns of ["list", "form", "detail"]) assert.equal(get(en, `marketing.${ns}`), undefined, `unused namespace ${ns} removed`);
  assert.deepEqual(missing, []);
});

test("no hard-coded English copy in the marketing components (text goes through next-intl)", () => {
  for (const f of readdirSync(COMPONENT_DIR)) {
    const src = readFileSync(new URL(f, COMPONENT_DIR), "utf8");
    // JSX text nodes made only of letters/spaces (e.g. ">Approve<") would be untranslated copy.
    // `(?<!=)` skips arrow-function generics such as `=> new Map<…>`.
    const literal = [...src.matchAll(/(?<!=)>\s*([A-Za-z][A-Za-z ,.'!?-]{2,})\s*</g)].map((m) => m[1].trim()).filter((s) => !["English"].includes(s));
    assert.deepEqual(literal, [], `${f} has untranslated text`);
  }
});

test("the separate /marketing/campaigns UI and its sidebar item are gone; the Campaign link carries marketingManagement", () => {
  assert.equal(existsSync(new URL("../src/app/admin-dashboard/@main/marketing", import.meta.url)), false, "route folder removed");
  for (const f of ["CampaignListScreen", "CampaignFormScreen", "CampaignDetailScreen", "CampaignEditScreen", "MarketingAdminShell"]) {
    assert.equal(existsSync(new URL(`${f}.tsx`, COMPONENT_DIR)), false, `${f} removed`);
  }
  const layout = read("app/admin-dashboard/layout.tsx");
  assert.doesNotMatch(layout, /marketing\/campaigns|Marketing Campaigns/);
  assert.match(layout, /\{ title: "Campaign", href: "\/admin-dashboard\/campaigns", icon: Layout, permissionKey: "marketingManagement" \}/);
});

// ── 2. RTK Query endpoints ─────────────────────────────────────────────────

async function makeStore(handler) {
  const { configureStore } = await import("@reduxjs/toolkit");
  const { marketingAdminApi } = await import("../src/features/marketingAdminApi.ts");
  const { campaignPageApi } = await import("../src/features/campaignPageApi.ts");
  const { authApi } = await import("../src/features/authApi.ts");
  const { apiSlice } = await import("../src/features/apiSlice.ts");
  const authReducer = (await import("../src/features/authSlice.ts")).default;
  const calls = [];
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    const req = input instanceof Request ? input : new Request(input, init);
    const url = new URL(req.url);
    const body = req.method === "GET" ? null : await req.text().then((t) => (t ? JSON.parse(t) : null));
    calls.push({ method: req.method, path: url.pathname, query: Object.fromEntries(url.searchParams), body });
    const [status, json] = (await handler({ method: req.method, path: url.pathname, body, query: Object.fromEntries(url.searchParams) })) ?? [200, { success: true, data: {} }];
    return new Response(JSON.stringify(json), { status, headers: { "content-type": "application/json" } });
  };
  const apis = [marketingAdminApi, campaignPageApi, authApi, apiSlice];
  const store = configureStore({
    reducer: { auth: authReducer, ...Object.fromEntries(apis.map((a) => [a.reducerPath, a.reducer])) },
    middleware: (g) => g({ serializableCheck: false, immutableCheck: false }).concat(...apis.map((a) => a.middleware)),
  });
  return { store, calls, marketingAdminApi, restore: () => (globalThis.fetch = realFetch) };
}

test("the slice exposes exactly the 10 programme endpoints and calls the documented routes", async () => {
  const { store, calls, marketingAdminApi, restore } = await makeStore(() => [200, { success: true, data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 1 } }]);
  try {
    assert.deepEqual(Object.keys(marketingAdminApi.endpoints).sort(), [
      "approveCampaignRegistration", "bulkReviewRegistrations", "cancelCampaignProgramme", "createCampaignProgramme", "getCampaignProgramme",
      "listMarketingCampaignPages", "listProgrammeRegistrations", "publishCampaignProgramme", "rejectCampaignRegistration", "updateCampaignProgramme",
    ]);
    const e = marketingAdminApi.endpoints;
    const run = (thunk) => store.dispatch(thunk);
    await run(e.listMarketingCampaignPages.initiate({ search: "eid", page: 2, limit: 10 }));
    await run(e.getCampaignProgramme.initiate("PG1"));
    await run(e.createCampaignProgramme.initiate({ pageId: "PG1", body: { minStock: 1 } }));
    await run(e.updateCampaignProgramme.initiate({ id: "MP1", pageId: "PG1", body: { minStock: 5, acknowledgeTightening: true } }));
    await run(e.publishCampaignProgramme.initiate({ id: "MP1", pageId: "PG1" }));
    await run(e.cancelCampaignProgramme.initiate({ id: "MP1", pageId: "PG1", reason: "r" }));
    await run(e.listProgrammeRegistrations.initiate({ id: "MP1", status: "PENDING", page: 1, limit: 20 }));
    await run(e.bulkReviewRegistrations.initiate({ id: "MP1", pageId: "PG1", body: { action: "approve" } }));
    await run(e.approveCampaignRegistration.initiate({ registrationId: "R1", pageId: "PG1" }));
    await run(e.rejectCampaignRegistration.initiate({ registrationId: "R1", pageId: "PG1", reason: "no" }));
    const sig = calls.map((c) => `${c.method} ${c.path}`);
    const documented = [
      "GET /api/marketing/admin/campaign-pages",
      "GET /api/marketing/admin/campaign-pages/PG1/programme",
      "POST /api/marketing/admin/campaign-pages/PG1/programme",
      "PATCH /api/marketing/admin/programmes/MP1",
      "POST /api/marketing/admin/programmes/MP1/publish",
      "POST /api/marketing/admin/programmes/MP1/cancel",
      "GET /api/marketing/admin/programmes/MP1/registrations",
      "POST /api/marketing/admin/programmes/MP1/registrations/bulk-review",
      "POST /api/marketing/admin/registrations/R1/approve",
      "POST /api/marketing/admin/registrations/R1/reject",
    ];
    // Mutations refetch cached queries, so GETs repeat — but every call is a
    // documented route, and every documented route is used.
    assert.deepEqual([...new Set(sig)].sort(), [...documented].sort());
    assert.deepEqual(calls[0].query, { search: "eid", page: "2", limit: "10" });
    assert.deepEqual(calls.find((c) => c.method === "PATCH").body, { minStock: 5, acknowledgeTightening: true });
    assert.deepEqual(calls.find((c) => c.method === "POST" && c.path.endsWith("/programme")).body, { minStock: 1 });
    assert.deepEqual(calls.find((c) => c.path.endsWith("/cancel")).body, { reason: "r" });
    assert.deepEqual(calls.find((c) => c.path.endsWith("/reject")).body, { reason: "no" });
    assert.equal(calls.find((c) => c.path.endsWith("/approve")).body, null);
    assert.equal(calls.find((c) => c.path.endsWith("/publish")).body, null);
  } finally {
    store.dispatch(marketingAdminApi.util.resetApiState());
    restore();
  }
});

// ── 3. pure helpers ─────────────────────────────────────────────────────────

const PAGE = { id: "PG1", title: "Mega Fest", slug: "mega-fest", status: "PUBLISHED", heroImage: null, startDate: "2026-10-21T00:00:00.000Z", endDate: "2026-10-25T00:00:00.000Z" };
const PROGRAMME = {
  id: "MP1", campaignPageId: "PG1",
  registrationStartAt: "2026-10-16T00:00:00.000Z", registrationEndAt: "2026-10-20T00:00:00.000Z",
  status: "PUBLISHED", minDiscountPercent: "10", minStock: 5, maxProductsPerVendor: 2,
  createdById: "U", createdAt: "2026-10-01T00:00:00.000Z", updatedAt: "2026-10-01T00:00:00.000Z",
  categories: [{ categoryId: "cat-root", category: { id: "cat-root", name: "Electronics", slug: "electronics" } }],
  campaignPage: PAGE, phase: "REGISTRATION_OPEN",
  counts: { pending: 2, approved: 0, rejected: 0, withdrawn: 0, total: 2, vendors: 1 },
};

test("validateProgrammeForm: obvious mistakes; registration must close before the page starts", () => {
  const ok = h.programmeToForm(PROGRAMME);
  assert.deepEqual(h.validateProgrammeForm(ok, PAGE.startDate), {});
  assert.deepEqual(h.validateProgrammeForm({ ...ok, registrationStartAt: "" }, PAGE.startDate).registrationStartAt, { code: "dateRequired" });
  assert.deepEqual(h.validateProgrammeForm({ ...ok, registrationEndAt: ok.registrationStartAt }, PAGE.startDate).registrationEndAt, { code: "registrationOrder" });
  assert.deepEqual(h.validateProgrammeForm({ ...ok, registrationEndAt: "2026-10-23T12:00" }, PAGE.startDate).registrationEndAt, { code: "registrationBeforeStart" });
  assert.equal(h.validateProgrammeForm({ ...ok, registrationEndAt: "2026-10-23T12:00" }, null).registrationEndAt, undefined, "no page start → the server decides");
  assert.deepEqual(h.validateProgrammeForm({ ...ok, minDiscountPercent: "101" }).minDiscountPercent, { code: "percent" });
  assert.deepEqual(h.validateProgrammeForm({ ...ok, minDiscountPercent: "10.555" }).minDiscountPercent, { code: "percentDecimals" });
  assert.deepEqual(h.validateProgrammeForm({ ...ok, minStock: "2.5" }).minStock, { code: "wholeNumber" });
  assert.deepEqual(h.validateProgrammeForm({ ...ok, maxProductsPerVendor: "0" }).maxProductsPerVendor, { code: "positiveWhole" });
  assert.equal(h.validateProgrammeForm({ ...ok, maxProductsPerVendor: "" }).maxProductsPerVendor, undefined, "empty = no limit");
  assert.deepEqual(Object.keys(h.emptyProgrammeForm()).sort(), ["categoryIds", "maxProductsPerVendor", "minDiscountPercent", "minStock", "registrationEndAt", "registrationStartAt"], "the live window is not part of this form");
});

test("formToBody / buildProgrammeUpdate: exact body; only changed fields; published never sends registration dates", () => {
  const form = h.programmeToForm(PROGRAMME);
  assert.deepEqual(h.buildProgrammeUpdate(form, PROGRAMME), {});
  const body = h.formToBody(form);
  assert.equal(body.registrationStartAt, PROGRAMME.registrationStartAt, "dates round-trip through datetime-local without drift");
  assert.deepEqual([body.minDiscountPercent, body.minStock, body.maxProductsPerVendor, body.categoryIds], [10, 5, 2, ["cat-root"]]);
  assert.equal("startAt" in body || "endAt" in body, false, "page dates are never sent from here");
  const changed = { ...form, minDiscountPercent: "20", categoryIds: [], registrationEndAt: "2026-10-19T06:00", maxProductsPerVendor: "" };
  assert.deepEqual(h.buildProgrammeUpdate(changed, PROGRAMME), { minDiscountPercent: 20, maxProductsPerVendor: null, categoryIds: [] });
  const draftUpdate = h.buildProgrammeUpdate(changed, { ...PROGRAMME, status: "DRAFT" });
  assert.equal(draftUpdate.registrationEndAt, new Date("2026-10-19T06:00").toISOString(), "a draft sends changed registration dates");
});

test("mapServerError: every backend error shape (page dates → liveWindow)", () => {
  assert.deepEqual(h.mapServerError({ status: 400, data: { message: "Validation error", errors: [{ path: "minStock", message: "Too small" }, { path: "categoryIds.0", message: "bad" }] } }).fieldErrors, { minStock: { text: "Too small" }, categoryIds: { text: "bad" } });
  assert.deepEqual(h.mapServerError({ status: 422, data: { details: { registrationEndAt: "Registration must close before the campaign starts" } } }).fieldErrors, { registrationEndAt: { text: "Registration must close before the campaign starts" } });
  assert.deepEqual(h.mapServerError({ status: 422, data: { details: { startAt: "The campaign page needs a start date" } } }).fieldErrors, { liveWindow: { text: "The campaign page needs a start date" } });
  assert.deepEqual(h.mapServerError({ status: 422, data: { details: { loosened: ["minDiscountPercent", "categoryIds"] } } }).fieldErrors, { minDiscountPercent: { code: "loosened" }, categoryIds: { code: "loosened" } });
  assert.deepEqual(h.mapServerError({ status: 422, data: { details: { fields: ["registrationStartAt"] } } }).fieldErrors, { registrationStartAt: { code: "datesLocked" } });
  assert.deepEqual(h.mapServerError({ status: 409, data: { details: { fields: ["startAt"] } } }).fieldErrors, { liveWindow: { code: "datesLocked" } });
  assert.deepEqual(h.mapServerError({ status: 422, data: { details: { categoryIds: ["x"] } } }).fieldErrors, { categoryIds: { code: "unknownCategories" } });
  assert.deepEqual(h.mapServerError({ status: 409, data: { details: { tightened: ["minStock"], affectedRegistrations: 3 } } }).tightening, { tightened: ["minStock"], affectedRegistrations: 3 });
  assert.deepEqual(h.mapServerError({ status: 422, data: { details: { violations: [{ rule: "stock", message: "Only 3" }] } } }).violations, [{ rule: "stock", message: "Only 3" }]);
  assert.deepEqual(h.mapServerError(undefined), { status: "UNKNOWN", message: "", fieldErrors: {} });
  assert.deepEqual(h.mapServerError({ status: "FETCH_ERROR", error: "x" }).fieldErrors, {});
});

test("money: ৳ with exactly 2 decimals (Bangla digits in bn); discount helper", () => {
  assert.equal(h.formatTaka("1234.5"), "৳1,234.50");
  assert.equal(h.formatTaka(0), "৳0.00");
  assert.equal(h.formatTaka("999.999"), "৳1,000.00");
  assert.equal(h.formatTaka(null), "—");
  assert.equal(h.formatTaka("abc"), "—");
  assert.match(h.formatTaka("1234.5", "bn"), /^৳১,২৩৪\.৫০$/);
  assert.equal(h.discountPercent("850", "1000"), "15.00");
  assert.equal(h.discountPercent("900.01", "1000"), "9.99", "rounded down, never overstated");
});

// ── 4. runtime (jsdom) ──────────────────────────────────────────────────────

let JSDOM = null;
try {
  ({ JSDOM } = require("jsdom"));
} catch {
  JSDOM = null;
}
const skip = JSDOM ? false : "jsdom is not installed (it is only a transitive dependency)";

// Import components INSIDE withDom: Radix picks useLayoutEffect vs a no-op when
// its module first loads, so loading it without a document breaks portals.
async function withDom(fn) {
  const dom = new JSDOM("<!doctype html><html><body><div id=root></div></body></html>", { url: "http://localhost:3000/admin-dashboard/campaigns", pretendToBeVisual: true });
  const g = globalThis;
  const saved = {};
  const setGlobal = (k, v) => {
    saved[k] = Object.getOwnPropertyDescriptor(g, k);
    Object.defineProperty(g, k, { value: v, configurable: true, writable: true });
  };
  for (const k of ["window", "document", "navigator", "HTMLElement", "Node", "Element", "MutationObserver", "getComputedStyle", "Event", "CustomEvent", "MouseEvent", "KeyboardEvent", "FocusEvent", "NodeFilter", "localStorage"]) {
    setGlobal(k, k === "window" ? dom.window : dom.window[k]);
  }
  setGlobal("requestAnimationFrame", (cb) => setTimeout(cb, 0));
  setGlobal("cancelAnimationFrame", clearTimeout);
  for (const k of Object.getOwnPropertyNames(dom.window)) {
    if (/^(HTML|SVG)\w*Element$|^(DocumentFragment|ShadowRoot|Text|Range|Selection|DOMRect)$/.test(k) && !(k in saved)) setGlobal(k, dom.window[k]);
  }
  g.IS_REACT_ACT_ENVIRONMENT = true;
  const errors = [];
  const realError = console.error;
  console.error = (...a) => errors.push(format(...a));
  const React = await import("react");
  const { act } = React;
  const { createRoot } = await import("react-dom/client");
  const { Provider } = await import("react-redux");
  let root;
  const run = async (f) => {
    try {
      await act(f);
    } catch (err) {
      for (const e of err?.errors ?? [err]) errors.push(String(e?.message ?? e));
    }
  };
  const settle = async () => {
    for (let i = 0; i < 3; i++) await run(() => new Promise((r) => setTimeout(r, 30)));
  };
  const doc = dom.window.document;
  const ui = {
    dom,
    doc,
    errors,
    text: () => doc.body.textContent,
    button: (label) => [...doc.querySelectorAll("button")].find((b) => b.textContent.trim().startsWith(label)),
    tab: (label) => [...doc.querySelectorAll('[role="tab"]')].find((b) => b.textContent.trim() === label),
    click: async (el) => {
      assert.ok(el, "element to click exists");
      await run(async () => el.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true })));
      await settle();
    },
    type: async (el, value) => {
      assert.ok(el, "element to type into exists");
      const proto = el.tagName === "TEXTAREA" ? dom.window.HTMLTextAreaElement.prototype : dom.window.HTMLInputElement.prototype;
      await run(async () => {
        Object.getOwnPropertyDescriptor(proto, "value").set.call(el, value);
        el.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
      });
      await settle();
    },
    render: async (store, element) => {
      root = createRoot(doc.getElementById("root"));
      await run(async () => root.render(React.createElement(Provider, { store }, element)));
      await settle();
    },
    reactErrors: () => errors.filter((m) => !/not wrapped in act|ReactDOMTestUtils/.test(m)),
    settle,
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
    await new Promise((r) => setTimeout(r, 60)); // Radix restores focus on a timer after unmount
    console.error = realError;
    for (const [k, d] of Object.entries(saved)) {
      if (d) Object.defineProperty(g, k, d);
      else delete g[k];
    }
    delete g.IS_REACT_ACT_ENVIRONMENT;
    dom.window.close();
  }
}

const ME = (over = {}) => ({ id: "U1", rawId: "U1", role: "ADMIN", vendorId: null, employeeId: "E1", name: "Admin", email: null, phone: null, permissions: null, employeeMeta: null, hrCapabilities: {}, ...over });
const REGS = [
  { id: "R1", campaignId: "MP1", vendorId: "V1", productId: "P1", variantId: "VAR1", campaignPrice: "850", originalPrice: "1000", committedStock: 10, status: "PENDING", rejectionReason: null, reviewedAt: null, createdAt: "2026-10-16T00:00:00.000Z", vendor: { id: "V1", storeName: "Store One" }, product: { id: "P1", name: "Phone X", slug: "phone-x" }, variant: { id: "VAR1", sku: "PX-1", price: "1000", specialPrice: null, stock: 50 } },
  { id: "R2", campaignId: "MP1", vendorId: "V1", productId: "P2", variantId: "VAR2", campaignPrice: "1500", originalPrice: "2000", committedStock: 5, status: "PENDING", rejectionReason: null, reviewedAt: null, createdAt: "2026-10-16T01:00:00.000Z", vendor: { id: "V1", storeName: "Store One" }, product: { id: "P2", name: "Phone Y", slug: "phone-y" }, variant: { id: "VAR2", sku: "PY-1", price: "2000", specialPrice: null, stock: 20 } },
];
const VIOLATION = { rule: "minDiscountPercent", message: "Discount is 5.55% — the campaign requires at least 10%" };
/** The existing page's own record (campaignPageApi, /api/campaigns). */
const CAMPAIGN = { id: "PG1", title: "Mega Fest", slug: "mega-fest", status: "PUBLISHED", heroImage: null, heroTitle: "Up to 70% off", heroSubtitle: null, startDate: PAGE.startDate, endDate: PAGE.endDate, createdAt: "2026-10-01T00:00:00.000Z", updatedAt: "2026-10-01T00:00:00.000Z", _count: { components: 2 } };

function backend(over = {}) {
  const page = over.page ?? PAGE;
  const programme = "programme" in over ? over.programme : PROGRAMME;
  const P = "/api/marketing/admin";
  return async ({ method, path, body }) => {
    if (path === "/api/auth/me") return [200, { success: true, data: over.me ?? ME() }];
    if (path === "/api/categories") return [200, [{ id: "cat-root", name: "Electronics", slug: "electronics", children: [{ id: "cat-phones", name: "Phones", slug: "phones", children: [] }] }]];
    if (method === "GET" && path === "/api/campaigns") return [200, { success: true, data: [CAMPAIGN] }];
    if (path.startsWith("/api/campaigns/")) return [200, { success: true, data: CAMPAIGN }];
    if (method === "GET" && path === `${P}/campaign-pages`) {
      const summary = programme ? { id: programme.id, status: programme.status, counts: programme.counts } : null;
      return [200, { success: true, data: [{ ...page, programme: summary }], pagination: { page: 1, limit: 100, total: 1, totalPages: 1 } }];
    }
    if (method === "GET" && path === `${P}/campaign-pages/${page.id}/programme`) return [200, { success: true, data: { page, programme } }];
    if (method === "POST" && path === `${P}/campaign-pages/${page.id}/programme`) return [201, { success: true, data: { ...PROGRAMME, ...body, status: "DRAFT" } }];
    if (method === "PATCH" && path === `${P}/programmes/MP1`) {
      if (!body.acknowledgeTightening) return [409, { success: false, message: "Tightening the rules affects registered vendors", details: { tightened: ["minDiscountPercent"], affectedRegistrations: 3 } }];
      return [200, { success: true, data: programme, warning: { tightened: ["minDiscountPercent"], affectedRegistrations: 3 } }];
    }
    if (method === "GET" && path === `${P}/programmes/MP1/registrations`) return [200, { success: true, data: REGS, pagination: { page: 1, limit: 20, total: 2, totalPages: 1 } }];
    if (path === `${P}/registrations/R1/approve`) return [422, { success: false, message: "The registration no longer meets the campaign rules", details: { violations: [VIOLATION] } }];
    if (path === `${P}/registrations/R2/reject`) return [200, { success: true, data: { id: "R2", status: "REJECTED" } }];
    if (path === `${P}/programmes/MP1/registrations/bulk-review`) {
      if (!body.confirm) return [200, { success: true, data: { confirmRequired: true, action: "approve", count: 2, eligibleCount: 1, ineligible: [{ id: "R1", violations: [VIOLATION] }] } }];
      return [200, { success: true, data: { action: "approve", count: 2, appliedCount: 1, applied: ["R2"], skipped: [{ id: "R1", status: 422, message: "The registration no longer meets the campaign rules", details: { violations: [VIOLATION] } }] } }];
    }
    return [404, { success: false, message: `unexpected ${method} ${path}` }];
  };
}

async function renderIntl(ui, store, React, Component, props) {
  const { MarketingIntlProvider } = await import("../src/i18n/MarketingIntlProvider.tsx");
  await ui.render(store, React.createElement(MarketingIntlProvider, { initialLocale: "en" }, React.createElement(Component, props)));
}

test("vendor rules: a page without dates cannot enable a programme; with dates, enable sends exactly the form body", { skip }, async () => {
  await withDom(async (ui, React) => {
    const { VendorRulesPanel } = await import("../src/components/marketing/admin/VendorRulesPanel.tsx");
    const { store, calls, restore } = await makeStore(backend({ page: { ...PAGE, startDate: null, endDate: null }, programme: null }));
    try {
      await renderIntl(ui, store, React, VendorRulesPanel, { pageId: "PG1" });
      assert.ok(ui.text().includes("Vendor registration is not enabled for this campaign"));
      assert.ok(ui.text().includes("Set the campaign dates first"), "needs page dates");
      assert.equal(ui.doc.getElementById("rule-minStock"), null, "no form without page dates");
      assert.equal(calls.some((c) => c.method !== "GET"), false);
    } finally {
      restore();
    }
  });
  await withDom(async (ui, React) => {
    const { VendorRulesPanel } = await import("../src/components/marketing/admin/VendorRulesPanel.tsx");
    const { store, calls, restore } = await makeStore(backend({ programme: null }));
    try {
      await renderIntl(ui, store, React, VendorRulesPanel, { pageId: "PG1" });
      await ui.click(ui.button("Enable vendor registration"));
      assert.equal(calls.filter((c) => c.method === "POST").length, 0, "empty form is refused client-side");
      assert.ok(ui.text().includes("Please fix the highlighted fields."));
      await ui.type(ui.doc.getElementById("rule-registrationStartAt"), "2026-10-17T09:00");
      await ui.type(ui.doc.getElementById("rule-registrationEndAt"), "2026-10-19T09:00");
      await ui.type(ui.doc.getElementById("rule-minDiscountPercent"), "12.5");
      await ui.click(ui.button("Enable vendor registration"));
      const post = calls.find((c) => c.method === "POST");
      assert.equal(post.path, "/api/marketing/admin/campaign-pages/PG1/programme");
      assert.deepEqual(post.body, {
        registrationStartAt: new Date("2026-10-17T09:00").toISOString(),
        registrationEndAt: new Date("2026-10-19T09:00").toISOString(),
        categoryIds: [],
        minDiscountPercent: 12.5,
        minStock: 0,
        maxProductsPerVendor: null,
      });
      assert.deepEqual(ui.reactErrors(), []);
    } finally {
      restore();
    }
  });
});

test("vendor rules (published): registration window disabled; tightening 409 shows rules + count; resend only after confirm with acknowledgeTightening", { skip }, async () => {
  await withDom(async (ui, React) => {
    const { VendorRulesPanel } = await import("../src/components/marketing/admin/VendorRulesPanel.tsx");
    const { store, calls, restore } = await makeStore(backend());
    try {
      await renderIntl(ui, store, React, VendorRulesPanel, { pageId: "PG1" });
      assert.ok(ui.text().includes("Vendor registration is published"));
      assert.ok(ui.text().includes("1 vendor · 2 pending · 0 approved"), "counts");
      assert.ok(ui.text().includes("the start date is locked and the end date can only be extended"), "page-date rule explained");
      for (const k of h.REGISTRATION_FIELDS) assert.equal(ui.doc.getElementById(`rule-${k}`).disabled, true, `${k} disabled`);
      assert.equal(ui.doc.getElementById("rule-minDiscountPercent").value, "10");
      assert.equal(ui.button("Publish to vendors"), undefined, "already published");
      await ui.type(ui.doc.getElementById("rule-minDiscountPercent"), "20");
      await ui.click(ui.button("Save rules"));
      const patches = () => calls.filter((c) => c.method === "PATCH");
      assert.equal(patches().length, 1);
      assert.equal(patches()[0].path, "/api/marketing/admin/programmes/MP1");
      assert.deepEqual(patches()[0].body, { minDiscountPercent: 20 }, "only the changed rule; no dates");
      assert.ok(ui.text().includes("Make the rules stricter?"), "warning dialog");
      assert.ok(ui.text().includes("3 registrations would no longer meet the new rules."));
      assert.ok(ui.text().includes("Minimum discount"), "tightened rule named");
      assert.equal(patches().length, 1, "not resent before confirming");
      await ui.click(ui.button("Apply anyway"));
      assert.equal(patches().length, 2);
      assert.deepEqual(patches()[1].body, { minDiscountPercent: 20, acknowledgeTightening: true });
      assert.deepEqual(ui.reactErrors(), []);
    } finally {
      restore();
    }
  });
});

test("registrations: ৳ prices; approve 422 lists violations; reject needs a reason; bulk preview → confirm with the same expectedCount; no programme → notice", { skip }, async () => {
  await withDom(async (ui, React) => {
    const { RegistrationsPanel } = await import("../src/components/marketing/admin/RegistrationsPanel.tsx");
    const { store, calls, restore } = await makeStore(backend());
    try {
      await renderIntl(ui, store, React, RegistrationsPanel, { programme: PROGRAMME });
      assert.ok(ui.text().includes("৳1,000.00") && ui.text().includes("৳850.00"), "money with 2 decimals");
      assert.ok(ui.text().includes("15.00% off"));
      assert.equal(calls.find((c) => c.path.endsWith("/registrations")).path, "/api/marketing/admin/programmes/MP1/registrations");

      await ui.click(ui.doc.querySelector('button[aria-label="Approve Phone X"]'));
      assert.ok(ui.text().includes("Can't approve this product"));
      assert.ok(ui.text().includes(VIOLATION.message));
      await ui.click(ui.button("Close"));

      await ui.click(ui.doc.querySelector('button[aria-label="Reject Phone Y"]'));
      const confirmReject = () => [...ui.doc.querySelectorAll('[role="dialog"] button')].find((b) => b.textContent.trim() === "Reject");
      assert.equal(confirmReject().disabled, true, "disabled without a reason");
      await ui.type(ui.doc.getElementById("reject-reason"), "  Wrong category ");
      assert.equal(confirmReject().disabled, false);
      await ui.click(confirmReject());
      assert.deepEqual(calls.find((c) => c.path.endsWith("/R2/reject")).body, { reason: "Wrong category" });

      await ui.click(ui.button("Bulk approve"));
      const bulkCalls = () => calls.filter((c) => c.path.endsWith("/bulk-review"));
      assert.deepEqual(bulkCalls()[0].body, { action: "approve" }, "preview: no confirm");
      assert.ok(ui.text().includes("2 pending registrations selected — 1 can be approved now."));
      assert.ok(ui.text().includes("1 product can't be approved:"));
      await ui.click(ui.button("Approve 1"));
      assert.deepEqual(bulkCalls()[1].body, { action: "approve", confirm: true, expectedCount: 2 });
      assert.ok(ui.text().includes("1 of 2 applied."));
      assert.ok(ui.text().includes("1 not applied:"));
      assert.deepEqual(ui.reactErrors(), []);
    } finally {
      restore();
    }
  });
  await withDom(async (ui, React) => {
    const { RegistrationsTab } = await import("../src/components/marketing/admin/RegistrationsPanel.tsx");
    const { store, calls, restore } = await makeStore(backend({ programme: null }));
    try {
      await renderIntl(ui, store, React, RegistrationsTab, { pageId: "PG1" });
      assert.ok(ui.text().includes("No vendor programme yet"));
      assert.equal(calls.some((c) => c.path.includes("/programmes/")), false, "nothing to list");
    } finally {
      restore();
    }
  });
});

test("Campaigns page (ADMIN): chip in the list; Details | Vendor Rules | Registrations; Details stays mounted so unsaved edits survive a tab switch", { skip }, async () => {
  await withDom(async (ui, React) => {
    const Page = (await import("../src/app/admin-dashboard/@main/campaigns/page.tsx")).default;
    const { store, calls, restore } = await makeStore(backend());
    try {
      await ui.render(store, React.createElement(Page));
      assert.ok(ui.text().includes("Vendors · 2 to review"), "programme chip on the list item");
      await ui.click([...ui.doc.querySelectorAll("button")].find((b) => b.textContent.includes("Mega Fest")));
      assert.deepEqual([...ui.doc.querySelectorAll('[role="tab"]')].map((b) => b.textContent.trim()), ["Details", "Vendor Rules", "Registrations"]);
      assert.ok(ui.text().includes("Campaign details"), "the existing editor is the Details tab");

      const title = [...ui.doc.querySelectorAll("input")].find((i) => i.value === "Mega Fest");
      await ui.type(title, "Mega Fest 2");
      assert.ok(ui.text().includes("You have unsaved changes"));

      await ui.click(ui.tab("Vendor Rules"));
      assert.equal(ui.doc.getElementById("campaign-panel-details").hidden, true, "Details hidden, not unmounted");
      assert.equal(ui.doc.getElementById("rule-minDiscountPercent").value, "10", "Vendor Rules loaded");
      assert.ok(calls.some((c) => c.path === "/api/marketing/admin/campaign-pages/PG1/programme"));

      await ui.click(ui.tab("Details"));
      assert.equal(ui.doc.getElementById("campaign-panel-details").hidden, false);
      assert.ok([...ui.doc.querySelectorAll("input")].some((i) => i.value === "Mega Fest 2"), "unsaved title kept");
      assert.ok(ui.text().includes("You have unsaved changes"), "dirty state kept");
      assert.equal(calls.some((c) => c.method !== "GET"), false, "switching tabs saves nothing");
      assert.deepEqual(ui.reactErrors(), []);
    } finally {
      restore();
    }
  });
});

test("Campaigns page (staff with marketingManagement): only the vendor tabs, never the ADMIN-only /api/campaigns; language switch to বাংলা", { skip }, async () => {
  await withDom(async (ui, React) => {
    const Page = (await import("../src/app/admin-dashboard/@main/campaigns/page.tsx")).default;
    const { store, calls, restore } = await makeStore(backend({ me: ME({ role: "EMPLOYEE", permissions: { marketingManagement: true } }) }));
    try {
      await ui.render(store, React.createElement(Page));
      assert.ok(ui.text().includes("Campaigns — vendor programmes"));
      await ui.click([...ui.doc.querySelectorAll("button")].find((b) => b.textContent.includes("Mega Fest")));
      assert.deepEqual([...ui.doc.querySelectorAll('[role="tab"]')].map((b) => b.textContent.trim()), ["Vendor Rules", "Registrations"]);
      assert.equal(ui.text().includes("Campaign details"), false, "no page builder for staff");
      assert.equal(ui.doc.getElementById("rule-minDiscountPercent").value, "10");
      assert.equal(calls.some((c) => c.path === "/api/campaigns" || c.path.startsWith("/api/campaigns/")), false, "ADMIN-only API never called");

      await ui.click(ui.button("বাংলা"));
      assert.ok(ui.text().includes("ক্যাম্পেইন — ভেন্ডর প্রোগ্রাম"), "Bangla title");
      assert.ok(ui.tab("ভেন্ডর নিয়ম"), "Bangla tab");
      assert.deepEqual(ui.reactErrors(), []);
    } finally {
      restore();
    }
  });
  // Staff WITHOUT marketingManagement keep the page's previous behaviour (the API decides).
  await withDom(async (ui, React) => {
    const Page = (await import("../src/app/admin-dashboard/@main/campaigns/page.tsx")).default;
    const { store, calls, restore } = await makeStore(backend({ me: ME({ role: "EMPLOYEE", permissions: { orderManagement: true } }) }));
    try {
      await ui.render(store, React.createElement(Page));
      assert.equal(ui.text().includes("Campaigns — vendor programmes"), false, "no staff view without the permission");
      assert.equal(calls.some((c) => c.path.startsWith("/api/marketing/")), false, "no marketing API calls without the permission");
    } finally {
      restore();
    }
  });
});
