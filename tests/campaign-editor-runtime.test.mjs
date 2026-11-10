// tests/campaign-editor-runtime.test.mjs
//
// Regression: opening a campaign in /admin-dashboard/campaigns threw
//   "useEffect must not return anything besides a function, which is used
//    for clean-up. You returned: false"
// because CampaignEditor's `useEffect(() => onDirtyChange(dirty), …)` returned
// the value of the page's `(d) => (dirtyRef.current = d)` callback.
//
// 1. Static: no effect in the campaign/banner editor files has an expression
//    body (an expression-bodied effect returns whatever the expression yields).
// 2. Runtime: the REAL page is rendered with react-dom/client in a jsdom
//    window (development React, where this check lives), a campaign is
//    selected so CampaignEditor mounts and its effects run — clean and dirty —
//    and React must report no invalid effect return. The API runs for real
//    against a stubbed fetch (no network). jsdom is present only as a
//    transitive dependency, so this part skips with a reason if it is absent.
//   node --test tests/campaign-editor-runtime.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { register } from "node:module";
import { createRequire } from "node:module";
import { format } from "node:util";

register("./support/tsx-loader.mjs", import.meta.url);

const read = (p) => readFileSync(new URL(`../src/${p}`, import.meta.url), "utf8");

test("no expression-bodied useEffect in the campaign / banner editors", () => {
  for (const file of [
    "app/admin-dashboard/@main/campaigns/page.tsx",
    "app/admin-dashboard/@main/campaigns/[id]/page.tsx",
    "components/slider/adminsliderhome/SliderAdmin.tsx",
  ]) {
    const src = read(file);
    // `(?![\s{])` — the lookahead must also reject whitespace, or `\s*` backtracks
    // one space and `useEffect(() => {` would match.
    const bad = [...src.matchAll(/useEffect\(\s*\(\)\s*=>\s*(?![\s{])/g)];
    assert.deepEqual(bad.map((m) => m.index), [], `${file}: an effect callback must use a block body`);
  }
});

// ── runtime ─────────────────────────────────────────────────────────────────

let JSDOM = null;
try {
  ({ JSDOM } = createRequire(import.meta.url)("jsdom"));
} catch {
  JSDOM = null;
}

const CAMPAIGN = {
  id: "C1",
  title: "Mega Fest",
  slug: "mega-fest",
  status: "DRAFT",
  heroImage: null,
  heroTitle: "Up to 70% off",
  heroSubtitle: null,
  startDate: "2026-11-01T04:00:00.000Z",
  endDate: null,
  createdAt: "2026-10-01T00:00:00.000Z",
  updatedAt: "2026-10-01T00:00:00.000Z",
  _count: { components: 2 },
};

test(
  "opening a campaign mounts CampaignEditor without an invalid effect return (clean and dirty)",
  { skip: JSDOM ? false : "jsdom is not installed (it is only a transitive dependency)" },
  async () => {
    const dom = new JSDOM("<!doctype html><html><body><div id=root></div></body></html>", { url: "http://localhost:3000/admin-dashboard/campaigns", pretendToBeVisual: true });
    const g = globalThis;
    const saved = {};
    const setGlobal = (k, v) => {
      saved[k] = Object.getOwnPropertyDescriptor(g, k);
      Object.defineProperty(g, k, { value: v, configurable: true, writable: true });
    };
    for (const k of ["window", "document", "navigator", "HTMLElement", "Node", "Element", "MutationObserver", "getComputedStyle", "requestAnimationFrame", "cancelAnimationFrame"]) {
      setGlobal(k, k === "window" ? dom.window : dom.window[k] ?? (k === "requestAnimationFrame" ? (cb) => setTimeout(cb, 0) : k === "cancelAnimationFrame" ? clearTimeout : undefined));
    }
    g.IS_REACT_ACT_ENVIRONMENT = true;

    const errors = [];
    const realError = console.error;
    // React logs "%s must not return anything…" with arguments — format it as the console would.
    console.error = (...a) => errors.push(format(...a));
    const realFetch = g.fetch;
    g.fetch = async (input, init) => {
      const req = input instanceof Request ? input : new Request(input, init);
      const path = new URL(req.url).pathname;
      // The page asks who is signed in (ADMIN → page builder + vendor tabs) and
      // loads the vendor-programme summaries for the list chips.
      if (path === "/api/auth/me") return Response.json({ success: true, data: { id: "U1", rawId: "U1", role: "ADMIN", vendorId: null, permissions: null, hrCapabilities: {} } });
      if (path === "/api/marketing/admin/campaign-pages") return Response.json({ success: true, data: [], pagination: { page: 1, limit: 100, total: 0, totalPages: 1 } });
      const data = req.method === "GET" && req.url.endsWith("/api/campaigns") ? [CAMPAIGN] : { ...CAMPAIGN };
      return new Response(JSON.stringify({ success: true, data }), { status: 200, headers: { "content-type": "application/json" } });
    };

    let root;
    try {
      const React = await import("react");
      const { act } = React;
      const { createRoot } = await import("react-dom/client");
      const { Provider } = await import("react-redux");
      const { configureStore } = await import("@reduxjs/toolkit");
      const { campaignPageApi } = await import("../src/features/campaignPageApi.ts");
      const { authApi } = await import("../src/features/authApi.ts");
      const { marketingAdminApi } = await import("../src/features/marketingAdminApi.ts");
      const apis = [campaignPageApi, authApi, marketingAdminApi];
      const authReducer = (await import("../src/features/authSlice.ts")).default;
      const Page = (await import("../src/app/admin-dashboard/@main/campaigns/page.tsx")).default;

      const store = configureStore({
        reducer: { auth: authReducer, ...Object.fromEntries(apis.map((a) => [a.reducerPath, a.reducer])) },
        middleware: (gd) => gd({ serializableCheck: false, immutableCheck: false }).concat(...apis.map((a) => a.middleware)),
      });
      // React 19 throws an invalid effect return during commit; act() rethrows
      // it as an AggregateError. Record every message (thrown or logged).
      const run = async (fn) => {
        try {
          await act(fn);
        } catch (err) {
          for (const e of err?.errors ?? [err]) errors.push(String(e?.message ?? e));
        }
      };
      const settle = () => run(() => new Promise((r) => setTimeout(r, 40)));

      root = createRoot(dom.window.document.getElementById("root"));
      await run(async () => {
        root.render(React.createElement(Provider, { store }, React.createElement(Page)));
      });
      await settle();

      const doc = dom.window.document;
      const item = [...doc.querySelectorAll("button")].find((b) => b.textContent.includes("Mega Fest"));
      assert.ok(item, "the campaign is listed");
      await run(async () => {
        item.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
      });
      await settle();
      assert.deepEqual(errors.filter((m) => /useEffect must not return anything/.test(m)), [], "no invalid effect return on mount");
      assert.ok(doc.body.textContent.includes("Campaign details"), "CampaignEditor mounted");
      assert.ok(doc.body.textContent.includes("All changes saved"), "clean state");

      // Make the form dirty so the dirty-tracking effect runs again with `true`.
      const title = [...doc.querySelectorAll("input")].find((i) => i.value === "Mega Fest");
      assert.ok(title, "title input prefilled from the saved campaign");
      const setValue = Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, "value").set;
      await run(async () => {
        setValue.call(title, "Mega Fest 2");
        title.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
      });
      await settle();
      assert.ok(doc.body.textContent.includes("You have unsaved changes"), "dirty state tracked");

      assert.deepEqual(errors.filter((m) => /useEffect must not return anything/.test(m)), [], "no invalid effect return when dirty");
      assert.deepEqual(errors.filter((m) => !/not wrapped in act|ReactDOMTestUtils/.test(m)), [], "no other React errors");
    } finally {
      if (root) {
        const { act } = await import("react");
        // With the bug, unmount also throws ("destroy is not a function" — React
        // calling the non-function "cleanup"); never let that mask the assertion.
        try {
          await act(async () => root.unmount());
        } catch {
          /* reported by the assertions above */
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
