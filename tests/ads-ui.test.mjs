// tests/ads-ui.test.mjs
//
// Advertisement UI (vendor "My Advertisements" + admin "Advertisement Review").
// FRONTEND-ONLY phase: there is no advertisement API, so these tests check
//   1. the pure demo logic in lib/ads/ads-demo.ts (filters, pagination,
//      summary, form validation incl. the 10-product UI cap, demo review);
//   2. that no advertisement file talks to a network endpoint or presents
//      sample data as real (source checks);
//   3. the admin review flow at runtime (jsdom): Reject stays disabled until a
//      reason is entered, decisions are labelled "demo" and only change local
//      state, and the only request made is the existing /auth/me lookup.
//   node --test tests/ads-ui.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { register, createRequire } from "node:module";
import { format } from "node:util";

register("./support/tsx-loader.mjs", import.meta.url);

const ads = await import("../src/lib/ads/ads-demo.ts");
const src = (p) => readFileSync(new URL(`../src/${p}`, import.meta.url), "utf8");

// ── pure logic ──────────────────────────────────────────────────────────────

test("every sample campaign is flagged demo and carries no price, amount or payment fields", () => {
  for (const c of [...ads.demoVendorCampaigns("Shop"), ...ads.demoAdminCampaigns()]) {
    assert.equal(c.demo, true, c.id);
    const json = JSON.stringify(c).toLowerCase();
    for (const word of ["price", "amount", "paid", "transaction", "invoice", "impression", "click"]) {
      assert.ok(!json.includes(`"${word}`), `${c.id} must not carry "${word}"`);
    }
  }
});

test("statuses are approval-first; no paid/running state exists in this phase", () => {
  assert.deepEqual(Object.keys(ads.AD_STATUS_LABEL).sort(), ["DRAFT", "PAYMENT_PENDING", "PENDING_REVIEW", "REJECTED"]);
  assert.equal(ads.AD_STATUS_LABEL.PAYMENT_PENDING, "Approved · payment pending");
});

test("placements: each belongs to one campaign type; category pages need a category", () => {
  assert.deepEqual(ads.placementsFor("STORE").map((p) => p.id), ["HOME_FEATURED_STORES", "CATEGORY_FEATURED_STORES"]);
  assert.deepEqual(ads.placementsFor("PRODUCT").map((p) => p.id), ["HOME_SPONSORED_PRODUCTS", "CATEGORY_SPONSORED_PRODUCTS"]);
  assert.deepEqual(ads.AD_PLACEMENTS.filter((p) => p.needsCategory).map((p) => p.id), ["CATEGORY_FEATURED_STORES", "CATEGORY_SPONSORED_PRODUCTS"]);
});

test("filterAndSortAds: status, type, search (title or store), and sort orders", () => {
  const list = ads.demoAdminCampaigns();
  assert.deepEqual(ads.filterAndSortAds(list, { status: "PENDING_REVIEW" }).map((c) => c.id), ["demo-rev-1", "demo-rev-2", "demo-rev-3"]);
  assert.deepEqual(ads.filterAndSortAds(list, { type: "STORE" }).map((c) => c.id), ["demo-rev-2", "demo-rev-4"]);
  assert.deepEqual(ads.filterAndSortAds(list, { search: "store e" }).map((c) => c.id), ["demo-rev-5"], "matches the store name");
  assert.deepEqual(ads.filterAndSortAds(list, { search: "BRAND" }).map((c) => c.id), ["demo-rev-4"], "case-insensitive title match");
  assert.deepEqual(ads.filterAndSortAds(list, { sort: "oldest" }).map((c) => c.id), ["demo-rev-5", "demo-rev-4", "demo-rev-3", "demo-rev-2", "demo-rev-1"]);
  assert.equal(ads.filterAndSortAds(list, { sort: "title" })[0].title, "Brand week");
  assert.equal(list.length, 5, "the input list is not mutated");
});

test("paginate clamps the page and reports totals", () => {
  const items = Array.from({ length: 17 }, (_, i) => i);
  assert.deepEqual(ads.paginate(items, 3, 8), { items: [16], page: 3, totalPages: 3, total: 17 });
  assert.equal(ads.paginate(items, 99, 8).page, 3);
  assert.equal(ads.paginate([], 1, 8).totalPages, 1);
});

test("adSummary counts by status", () => {
  assert.deepEqual(ads.adSummary(ads.demoAdminCampaigns()), { total: 5, draft: 0, pendingReview: 3, approved: 1, paymentPending: 1, rejected: 1 });
});

test("validateAdForm: a draft only needs a valid title", () => {
  assert.deepEqual(ads.validateAdForm(ads.emptyAdForm("STORE"), "draft"), { title: "Campaign title is required" });
  assert.deepEqual(ads.validateAdForm({ ...ads.emptyAdForm("PRODUCT"), title: "x" }, "draft"), {});
});

test("validateAdForm (submit): store ad needs headline, placement and duration", () => {
  const e = ads.validateAdForm({ ...ads.emptyAdForm("STORE"), title: "Spot" }, "submit");
  assert.deepEqual(Object.keys(e).sort(), ["durationDays", "headline", "placement"]);
  const ok = { ...ads.emptyAdForm("STORE"), title: "Spot", headline: "Hi", placement: "HOME_FEATURED_STORES", durationDays: 14 };
  assert.deepEqual(ads.validateAdForm(ok, "submit"), {});
});

test("validateAdForm (submit): product ad needs 1–10 products; placement must match type; category pages need a category", () => {
  const base = { ...ads.emptyAdForm("PRODUCT"), title: "Row", placement: "HOME_SPONSORED_PRODUCTS", durationDays: 7 };
  const products = (n) => Array.from({ length: n }, (_, i) => ({ id: `p${i}`, name: `P${i}` }));
  assert.equal(ads.validateAdForm(base, "submit").products, "Select at least one product");
  assert.deepEqual(ads.validateAdForm({ ...base, products: products(10) }, "submit"), {});
  assert.equal(ads.validateAdForm({ ...base, products: products(11) }, "submit").products, "Select at most 10 products");
  assert.equal(ads.validateAdForm({ ...base, products: products(11) }, "draft").products, "Select at most 10 products", "the cap applies to drafts too");
  assert.match(ads.validateAdForm({ ...base, products: products(1), placement: "HOME_FEATURED_STORES" }, "submit").placement, /not available/);
  const cat = { ...base, products: products(1), placement: "CATEGORY_SPONSORED_PRODUCTS" };
  assert.equal(ads.validateAdForm(cat, "submit").category, "Choose the category page");
  assert.deepEqual(ads.validateAdForm({ ...cat, categoryName: "Kitchen" }, "submit"), {});
  assert.equal(ads.validateAdForm({ ...base, products: products(1), durationDays: 5 }, "submit").durationDays, "Choose a campaign duration");
  assert.equal(ads.MAX_AD_PRODUCTS, 10);
});

test("switchAdType clears what belongs to the other type", () => {
  const store = { ...ads.emptyAdForm("STORE"), headline: "Hi", placement: "HOME_FEATURED_STORES" };
  const p = ads.switchAdType(store, "PRODUCT");
  assert.deepEqual([p.type, p.headline, p.placement], ["PRODUCT", "", ""]);
  const prod = { ...ads.emptyAdForm("PRODUCT"), products: [{ id: "a", name: "A" }] };
  assert.deepEqual(ads.switchAdType(prod, "STORE").products, []);
  assert.equal(ads.switchAdType(prod, "PRODUCT"), prod, "same type is a no-op");
});

test("canVendorEdit: only drafts and rejected campaigns", () => {
  assert.deepEqual(["DRAFT", "PENDING_REVIEW", "PAYMENT_PENDING", "REJECTED"].map(ads.canVendorEdit), [true, false, false, true]);
});

test("applyDemoReview: only PENDING_REVIEW is decided; reject needs a trimmed reason; approve → payment pending", () => {
  const [pending] = ads.demoAdminCampaigns();
  const now = new Date("2026-10-15T10:00:00Z");
  assert.deepEqual(ads.applyDemoReview(pending, { decision: "reject", reason: "   " }, now), { ok: false, error: "A rejection reason is required." });
  const rej = ads.applyDemoReview(pending, { decision: "reject", reason: "  Blurry images  ", note: " " }, now);
  assert.equal(rej.ok, true);
  assert.equal(rej.campaign.status, "REJECTED");
  assert.deepEqual(rej.campaign.review, { decidedAt: now.toISOString(), note: undefined, rejectionReason: "Blurry images" });
  const app = ads.applyDemoReview(pending, { decision: "approve", note: "ok" }, now);
  assert.equal(app.campaign.status, "PAYMENT_PENDING");
  assert.equal(pending.status, "PENDING_REVIEW", "input not mutated");
  assert.equal(ads.applyDemoReview(app.campaign, { decision: "approve" }, now).ok, false, "no second decision");
  assert.equal(ads.applyDemoReview(pending, { decision: "reject", reason: "x".repeat(501) }, now).ok, false);
});

// ── source boundaries ───────────────────────────────────────────────────────

const AD_FILES = [
  "lib/ads/ads-demo.ts",
  ...readdirSync(new URL("../src/components/ads/", import.meta.url)).map((f) => `components/ads/${f}`),
  "app/vendor-dashboard/@main/advertisements/page.tsx",
  "app/vendor-dashboard/@main/advertisements/create/page.tsx",
  "app/vendor-dashboard/@main/advertisements/[id]/page.tsx",
  "app/vendor-dashboard/@main/advertisements/[id]/edit/page.tsx",
  "app/admin-dashboard/@main/advertisements/page.tsx",
  "app/admin-dashboard/@main/advertisements/[id]/page.tsx",
];

test("all advertisement routes exist", () => {
  for (const f of AD_FILES) assert.ok(existsSync(new URL(`../src/${f}`, import.meta.url)), f);
});

test("no advertisement file calls the network or defines an API (no invented endpoints)", () => {
  for (const f of AD_FILES) {
    const s = src(f);
    assert.doesNotMatch(s, /\bfetch\(|axios|createApi|fetchBaseQuery|baseQueryWithReauth|builder\.(query|mutation)/, `${f}: no API client`);
    assert.doesNotMatch(s, /["'`]\/api\/|["'`]\/ads\b|["'`]\/advertis/, `${f}: no endpoint paths`);
    assert.doesNotMatch(s, /use\w+Mutation\b/, `${f}: no mutations`);
  }
});

test("only existing read-only queries are used: categories, own products (via the picker), and /auth/me (via usePermissions)", () => {
  const all = AD_FILES.map(src).join("\n");
  const hooks = [...new Set([...all.matchAll(/\buse(Get\w+)Query\b/g)].map((m) => m[1]))].sort();
  assert.deepEqual(hooks, ["GetCategories"]);
  assert.match(src("components/ads/VendorAdForm.tsx"), /maxSelect=\{MAX_AD_PRODUCTS\}/);
  assert.match(src("components/ads/VendorAdForm.tsx"), /from "@\/app\/store-editor\/Storeproductpicker"/, "reuses the existing picker");
});

test("every screen shows the demo notice, and payment is a disabled placeholder", () => {
  for (const f of ["components/ads/VendorAdsScreens.tsx", "components/ads/AdminAdsScreens.tsx", "components/ads/VendorAdForm.tsx"]) {
    assert.match(src(f), /<DemoNotice/, f);
  }
  const vendor = src("components/ads/VendorAdsScreens.tsx");
  assert.match(vendor, /<Button disabled aria-describedby="pay-placeholder-note">\s*Pay now/);
  assert.match(vendor, /My Advertisements/);
  assert.match(vendor, /Create Advertisement/);
  assert.match(src("components/ads/AdminAdsScreens.tsx"), /Advertisement Review/);
});

test("existing Promotions / Campaigns / permission files are not repurposed", () => {
  // Code only — explanatory comments may name the proposed keys.
  const all = AD_FILES.map(src).join("\n").replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  assert.doesNotMatch(all, /offerApi|campaignPageApi|sliderApi|vendorManageApi/);
  assert.doesNotMatch(all, /adApproval|adManagement"\s*:/, "no partially-integrated permission key in the UI");
});

// ── runtime: admin review flow ──────────────────────────────────────────────

let JSDOM = null;
try {
  ({ JSDOM } = createRequire(import.meta.url)("jsdom"));
} catch {
  JSDOM = null;
}

test(
  "admin review (jsdom): Reject disabled until a reason is entered; demo decision only changes local state; only /auth/me is requested",
  { skip: JSDOM ? false : "jsdom is not installed (it is only a transitive dependency)" },
  async () => {
    const dom = new JSDOM("<!doctype html><html><body><div id=root></div></body></html>", { url: "http://localhost:3000/admin-dashboard/advertisements/demo-rev-1", pretendToBeVisual: true });
    const g = globalThis;
    const saved = {};
    const setGlobal = (k, v) => {
      saved[k] = Object.getOwnPropertyDescriptor(g, k);
      Object.defineProperty(g, k, { value: v, configurable: true, writable: true });
    };
    for (const k of ["window", "document", "navigator", "HTMLElement", "Node", "Element", "MutationObserver", "getComputedStyle", "requestAnimationFrame", "cancelAnimationFrame", "Event", "CustomEvent", "MouseEvent", "KeyboardEvent", "FocusEvent", "NodeFilter"]) {
      setGlobal(k, k === "window" ? dom.window : dom.window[k] ?? (k === "requestAnimationFrame" ? (cb) => setTimeout(cb, 0) : k === "cancelAnimationFrame" ? clearTimeout : undefined));
    }
    // Radix dialogs (focus trap, instanceof checks) need jsdom's DOM classes as globals.
    for (const k of Object.getOwnPropertyNames(dom.window)) {
      if (/^(HTML|SVG)\w*Element$|^(DocumentFragment|ShadowRoot|Text|Range|Selection|DOMRect)$/.test(k) && !(k in saved)) setGlobal(k, dom.window[k]);
    }
    g.IS_REACT_ACT_ENVIRONMENT = true;
    const errors = [];
    const realError = console.error;
    console.error = (...a) => errors.push(format(...a));
    const requests = [];
    const realFetch = g.fetch;
    g.fetch = async (input, init) => {
      const req = input instanceof Request ? input : new Request(input, init);
      requests.push(`${req.method} ${new URL(req.url).pathname}`);
      const data = { id: "U1", rawId: "U1", role: "ADMIN", vendorId: null, employeeId: "E1", name: "Admin", email: null, phone: null, permissions: null, employeeMeta: null, hrCapabilities: {} };
      return new Response(JSON.stringify({ success: true, data }), { status: 200, headers: { "content-type": "application/json" } });
    };

    let root;
    try {
      const React = await import("react");
      const { act } = React;
      const { createRoot } = await import("react-dom/client");
      const { Provider } = await import("react-redux");
      const { configureStore } = await import("@reduxjs/toolkit");
      const { authApi } = await import("../src/features/authApi.ts");
      const authReducer = (await import("../src/features/authSlice.ts")).default;
      const { AdminAdReviewScreen } = await import("../src/components/ads/AdminAdsScreens.tsx");
      const store = configureStore({
        reducer: { auth: authReducer, [authApi.reducerPath]: authApi.reducer },
        middleware: (gd) => gd({ serializableCheck: false, immutableCheck: false }).concat(authApi.middleware),
      });
      const run = async (fn) => {
        try {
          await act(fn);
        } catch (err) {
          for (const e of err?.errors ?? [err]) errors.push(String(e?.message ?? e));
        }
      };
      const settle = () => run(() => new Promise((r) => setTimeout(r, 40)));
      root = createRoot(dom.window.document.getElementById("root"));
      await run(async () => root.render(React.createElement(Provider, { store }, React.createElement(AdminAdReviewScreen, { id: "demo-rev-1" }))));
      await settle();
      await settle();

      const doc = dom.window.document;
      const text = () => doc.body.textContent;
      const button = (label) => [...doc.querySelectorAll("button")].find((b) => b.textContent.trim().startsWith(label));
      assert.ok(text().includes("Weekend deals row"), "the sample campaign is shown");
      assert.ok(text().includes("Preview — sample data, nothing is saved"), "demo notice");
      const reject = button("Reject");
      assert.ok(reject, "Reject button");
      assert.equal(reject.disabled, true, "Reject disabled without a reason");

      const reason = doc.getElementById("review-reason");
      const setValue = Object.getOwnPropertyDescriptor(dom.window.HTMLTextAreaElement.prototype, "value").set;
      await run(async () => {
        setValue.call(reason, "Images are blurry");
        reason.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
      });
      assert.equal(button("Reject").disabled, false, "Reject enabled once a reason is entered");

      await run(async () => button("Reject").dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true })));
      await settle();
      assert.ok(text().includes("Reject this campaign? (demo)"), "confirmation dialog");
      await run(async () => button("Reject (demo)").dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true })));
      await settle();
      assert.ok(text().includes("Demo decision recorded on this page only — not saved."));
      assert.ok(text().includes("Rejection reason: Images are blurry"));
      assert.ok(text().includes("No decision needed"), "decision panel closed after the demo decision");

      assert.deepEqual([...new Set(requests)], ["GET /api/auth/me"], "no request other than the existing /auth/me lookup");
      assert.deepEqual(errors.filter((m) => !/not wrapped in act|ReactDOMTestUtils/.test(m)), [], "no React errors");
    } finally {
      if (root) {
        const { act } = await import("react");
        try {
          await act(async () => root.unmount());
        } catch {
          /* reported above */
        }
      }
      console.error = realError;
      g.fetch = realFetch;
      for (const [k, d] of Object.entries(saved)) {
        if (d) Object.defineProperty(g, k, d);
        else delete g[k];
      }
      delete g.IS_REACT_ACT_ENVIRONMENT;
      dom.window.close();
    }
  },
);
