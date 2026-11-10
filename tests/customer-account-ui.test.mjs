// tests/customer-account-ui.test.mjs
//
// Admin › Customer Account Management redesign.
//   1. pure (lib/customers/customer-view): query params match the backend
//      contract (status active|blocked, startDate/endDate, allowlisted sort),
//      BD phone / Taka / date formatting, page list, export byte decoding;
//   2. runtime (jsdom, real store + RTK Query, fetch stubbed — no backend):
//      summary cards come from pagination.total of status-filtered requests,
//      rows render real fields only (no password, no invented orders/spend),
//      search is debounced to the API, status/date wait for Apply, Reset
//      restores defaults, pagination keeps filters, sorting, suspend needs a
//      reason, reactivate confirms, View loads GET /:id, error + empty states.
//   node --test tests/customer-account-ui.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { register, createRequire } from "node:module";
import { format } from "node:util";

register("./support/tsx-loader.mjs", import.meta.url);
const require = createRequire(import.meta.url);
const V = await import("../src/lib/customers/customer-view.ts");

test("query params follow the backend contract", () => {
  assert.deepEqual(V.buildCustomerQuery(V.DEFAULT_LIST_STATE), { page: 1, limit: 10, sortBy: "createdAt", sortOrder: "desc" });
  const q = V.buildCustomerQuery({ ...V.DEFAULT_LIST_STATE, search: "  rahim ", status: "blocked", from: "2026-01-01", to: "2026-01-31", page: 3, sortBy: "name", sortOrder: "asc" });
  assert.equal(q.search, "rahim");
  assert.equal(q.status, "blocked", "the API reads active|blocked, not ACTIVE/SUSPENDED");
  assert.equal(new Date(q.startDate).getTime(), new Date(2026, 0, 1, 0, 0, 0, 0).getTime());
  assert.equal(new Date(q.endDate).getTime(), new Date(2026, 0, 31, 23, 59, 59, 999).getTime(), "end date inclusive");
  assert.equal(q.page, 3);
  assert.equal(V.buildCustomerQuery({ ...V.DEFAULT_LIST_STATE, sortBy: "password" }).sortBy, "createdAt", "sort is allowlisted");
  assert.equal(V.buildCustomerQuery({ ...V.DEFAULT_LIST_STATE, from: "bad" }).startDate, undefined);
  assert.equal(V.validateDateRange("2026-02-01", "2026-01-01"), "The start date must be on or before the end date.");
  assert.equal(V.validateDateRange("", ""), null);
  const ex = V.exportFilters({ ...V.DEFAULT_LIST_STATE, status: "active" });
  assert.equal(ex.page, undefined);
  assert.equal(ex.status, "active");
});

test("formatting: BD phones, Taka, names, ids, pages", () => {
  assert.equal(V.formatBdPhone("01712345678"), "+880 1712-345678");
  assert.equal(V.formatBdPhone("+8801812345678"), "+880 1812-345678");
  assert.equal(V.formatBdPhone("8801912345678"), "+880 1912-345678");
  assert.equal(V.formatBdPhone("+44 20 7946 0958"), "+44 20 7946 0958", "non-BD left as is");
  assert.equal(V.formatBdPhone(null), null);
  assert.equal(V.formatTaka(1234.5), "৳1,234.50");
  assert.equal(V.formatTaka("x"), "—");
  assert.equal(V.displayName({ name: "", email: "karim@example.com" }), "karim");
  assert.equal(V.initials({ name: "Rahim Uddin Khan" }), "RK");
  assert.equal(V.shortId("cmabc1234567890xyz"), "#67890XYZ");
  assert.deepEqual(V.pageList(5, 12), [1, "…", 4, 5, 6, "…", 12]);
  assert.deepEqual(V.pageList(2, 4), [1, 2, 3, 4]);
  assert.equal(V.rangeLabel(2, 10, 34, 10), "Showing 11–20 of 34");
  assert.equal(V.accountStatus({ isActive: false }), "suspended");
  assert.equal(V.accountStatus({ isActive: true }), "active");
});

test("export bytes come from the JSON-serialised Buffer; anything else is rejected", () => {
  const ok = V.exportBytes({ data: { type: "Buffer", data: [80, 75, 3, 4] }, fileName: "customers-export-2026-10-22.xlsx" });
  assert.deepEqual([...ok.bytes], [80, 75, 3, 4]);
  assert.equal(ok.fileName, "customers-export-2026-10-22.xlsx");
  assert.equal(V.exportBytes({ data: { type: "Buffer", data: [300] } }), null);
  assert.equal(V.exportBytes({ data: "x" }), null);
  assert.equal(V.exportBytes({ data: { type: "Buffer", data: [1] }, fileName: "../../evil.sh" }).fileName, null);
  assert.ok(!V.EXPORT_FIELDS.includes("password"));
});

// ---------------------------------------------------------------------------
// runtime
// ---------------------------------------------------------------------------

let JSDOM = null;
try {
  ({ JSDOM } = require("jsdom"));
} catch {
  JSDOM = null;
}
const skip = JSDOM ? false : "jsdom is not installed (it is only a transitive dependency)";

const customer = (i, over = {}) => ({
  id: `cmcust${String(i).padStart(12, "0")}`,
  name: `Customer ${i}`,
  email: `c${i}@example.com`,
  phone: `0171234${String(5000 + i)}`,
  password: "$2b$10$SHOULD_NEVER_RENDER",
  role: "CUSTOMER",
  isActive: true,
  isVerified: i % 2 === 0,
  createdAt: new Date(Date.UTC(2026, 5, i)).toISOString(),
  customerProfile: { id: `p${i}`, wallet: i * 10.5, loyaltyPoints: i * 3, profileImage: null },
  _count: { reviews: i },
  ...over,
});

const ALL = Array.from({ length: 23 }, (_, i) => customer(i + 1, i + 1 === 4 ? { isActive: false } : {}));

function backend(state = {}) {
  return async (method, url, body) => {
    const q = url.searchParams;
    if (method === "GET" && url.pathname === "/api/customermanagement") {
      if (state.fail) return [500, { error: "Failed to fetch customers" }];
      let rows = ALL;
      const st = q.get("status");
      if (st === "active") rows = rows.filter((c) => c.isActive);
      if (st === "blocked") rows = rows.filter((c) => !c.isActive);
      const s = q.get("search")?.toLowerCase();
      if (s) rows = rows.filter((c) => [c.name, c.email, c.phone].some((v) => v.toLowerCase().includes(s)));
      if (q.get("startDate")) rows = rows.filter((c) => c.createdAt >= q.get("startDate"));
      if (q.get("endDate")) rows = rows.filter((c) => c.createdAt <= q.get("endDate"));
      const page = Number(q.get("page") || 1);
      const limit = Number(q.get("limit") || 10);
      return [200, { data: rows.slice((page - 1) * limit, page * limit), pagination: { total: rows.length, page, limit, pages: Math.ceil(rows.length / limit) } }];
    }
    const m = url.pathname.match(/^\/api\/customermanagement\/([^/]+)$/);
    if (method === "GET" && m) return [200, { ...ALL.find((c) => c.id === m[1]), reviews: [{}, {}], walletTransactions: [{}], loyaltyTransactions: [] }];
    const b = url.pathname.match(/^\/api\/customermanagement\/([^/]+)\/block$/);
    if (method === "PUT" && b) return [200, { id: b[1], isActive: body.block }];
    return null;
  };
}

async function withDom(route, fn) {
  const dom = new JSDOM("<!doctype html><html><body><div id=root></div></body></html>", { url: "http://localhost:3000/admin-dashboard/customer-manage/accountmanage", pretendToBeVisual: true });
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
  setGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
  for (const k of Object.getOwnPropertyNames(dom.window)) {
    if (/^(HTML|SVG)\w*Element$|^(DocumentFragment|ShadowRoot|Text|Range|Selection|DOMRect)$/.test(k) && !(k in saved)) setGlobal(k, dom.window[k]);
  }
  dom.window.HTMLElement.prototype.scrollIntoView = () => {};
  dom.window.HTMLElement.prototype.hasPointerCapture = () => false;
  dom.window.HTMLElement.prototype.releasePointerCapture = () => {};
  g.IS_REACT_ACT_ENVIRONMENT = true;
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
    return Response.json({ error: `unexpected ${req.method} ${url.pathname}` }, { status: 404 });
  };

  const React = await import("react");
  const { act } = React;
  const { createRoot } = await import("react-dom/client");
  const { Provider } = await import("react-redux");
  const { configureStore } = await import("@reduxjs/toolkit");
  const { customerManageApi } = await import("../src/features/customerManageApi.ts");
  const authReducer = (await import("../src/features/authSlice.ts")).default;
  const store = configureStore({
    reducer: { auth: authReducer, [customerManageApi.reducerPath]: customerManageApi.reducer },
    middleware: (gd) => gd({ serializableCheck: false, immutableCheck: false }).concat(customerManageApi.middleware),
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
  const setValue = async (el, value, evt) => {
    assert.ok(el, "field exists");
    const proto = el.tagName === "SELECT" ? dom.window.HTMLSelectElement.prototype : el.tagName === "TEXTAREA" ? dom.window.HTMLTextAreaElement.prototype : dom.window.HTMLInputElement.prototype;
    await run(async () => {
      Object.getOwnPropertyDescriptor(proto, "value").set.call(el, value);
      el.dispatchEvent(new dom.window.Event(evt, { bubbles: true }));
    });
    await settle();
  };
  const ui = {
    doc,
    errors,
    calls,
    settle,
    text: () => doc.body.textContent,
    byLabel: (l) => doc.querySelector(`[aria-label="${l}"]`),
    button: (label) => [...doc.querySelectorAll("button")].find((b) => b.textContent.trim().startsWith(label)),
    stat: (label) => [...doc.querySelectorAll("section[aria-label='Customer summary'] p")].find((p) => p.textContent === label)?.nextElementSibling?.textContent,
    listCalls: () => calls.filter((c) => c.path === "/api/customermanagement" && c.query.limit !== "1"),
    click: async (el) => {
      assert.ok(el, "element to click exists");
      await run(async () => el.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true })));
      await settle();
    },
    openMenu: async (el) => {
      assert.ok(el, "menu trigger exists");
      await run(async () => {
        el.focus();
        el.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
      });
      await settle();
    },
    type: (el, v) => setValue(el, v, "input"),
    select: (el, v) => setValue(el, v, "change"),
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
    store.dispatch(customerManageApi.util.resetApiState());
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

const tableRows = (ui) => [...ui.doc.querySelectorAll("tbody tr")];

test("account management: real totals, real fields, search, Apply/Reset, pagination, sort", { skip }, async () => {
  await withDom(backend(), async (ui, React) => {
    const { default: AccountManagement } = await import("../src/components/customermanagement/AccountManagement.tsx");
    await ui.render(React.createElement(AccountManagement));
    assert.match(ui.text(), /Customer Account Management/);
    assert.match(ui.text(), /View, manage, and monitor customer accounts, activity, and status\./);

    // Summary cards = pagination.total of status-filtered requests, not page rows.
    assert.equal(ui.stat("Total Customers"), "23");
    assert.equal(ui.stat("Active Accounts"), "22");
    assert.equal(ui.stat("Suspended Accounts"), "1");
    assert.equal(ui.stat("Pending Verification"), "—", "not countable from the API → not invented");
    for (const st of [undefined, "active", "blocked"]) {
      assert.ok(ui.calls.some((c) => c.path === "/api/customermanagement" && c.query.limit === "1" && c.query.status === st), `total for ${st ?? "all"}`);
    }

    // Rows: real fields, formatted; never the password hash; no fake order/spend columns.
    assert.equal(tableRows(ui).length, 10);
    const first = tableRows(ui)[0].textContent;
    assert.match(first, /Customer 1/);
    assert.match(first, /c1@example\.com/);
    assert.match(first, /\+880 1712-345001/);
    assert.match(first, /৳10\.50/);
    assert.doesNotMatch(ui.text(), /SHOULD_NEVER_RENDER/);
    assert.doesNotMatch([...ui.doc.querySelectorAll("thead th")].map((t) => t.textContent).join("|"), /Orders|Spent|Type/);
    assert.match(ui.text(), /Suspended/);
    assert.match(ui.text(), /Unverified/);
    assert.match(ui.text(), /Showing 1–10 of 23 · Page 1 of 3/);
    assert.equal(ui.button("Add"), undefined, "no Add Customer: the API has no create route");

    // Pagination keeps state; page 3 has 3 rows.
    await ui.click(ui.doc.querySelector("nav[aria-label='Customer pages'] button[aria-current]")?.parentElement.querySelectorAll("button")[3]);
    assert.equal(ui.listCalls().at(-1).query.page, "3");
    assert.equal(tableRows(ui).length, 3);

    // Search → debounced API call, page reset to 1.
    const before = ui.listCalls().length;
    await ui.type(ui.byLabel("Search customers by name, email or phone"), "c12@");
    assert.equal(ui.listCalls().length, before, "not sent on every keystroke");
    await ui.settle(10);
    const searched = ui.listCalls().at(-1);
    assert.equal(searched.query.search, "c12@");
    assert.equal(searched.query.page, "1");
    assert.equal(tableRows(ui).length, 1);
    assert.match(ui.text(), /1 matching customer/);

    // Status waits for Apply.
    await ui.type(ui.byLabel("Search customers by name, email or phone"), "");
    await ui.settle(10);
    await ui.select(ui.byLabel("Account status"), "blocked");
    assert.notEqual(ui.listCalls().at(-1).query.status, "blocked", "not applied yet");
    assert.ok(ui.byLabel("Unapplied changes"));
    await ui.click(ui.button("Apply"));
    assert.equal(ui.listCalls().at(-1).query.status, "blocked");
    assert.equal(tableRows(ui).length, 1);
    assert.match(tableRows(ui)[0].textContent, /Customer 4/);

    // Invalid range is blocked client-side.
    await ui.type(ui.byLabel("Registered from"), "2026-06-20");
    await ui.type(ui.byLabel("Registered to"), "2026-06-10");
    const n = ui.listCalls().length;
    await ui.click(ui.button("Apply"));
    assert.match(ui.text(), /start date must be on or before/);
    assert.equal(ui.listCalls().length, n);

    // Reset restores every default and refetches.
    await ui.click(ui.button("Reset"));
    const reset = ui.listCalls().at(-1).query;
    assert.deepEqual(reset, { page: "1", limit: "10", sortBy: "createdAt", sortOrder: "desc" });
    assert.equal(ui.byLabel("Account status").value, "all");
    assert.equal(ui.byLabel("Registered from").value, "");
    assert.equal(tableRows(ui).length, 10);

    // Sorting where the API supports it.
    await ui.click(ui.byLabel("Sort by Customer"));
    assert.equal(ui.listCalls().at(-1).query.sortBy, "name");
    assert.equal(ui.listCalls().at(-1).query.sortOrder, "asc");

    // Rows per page.
    await ui.select(ui.byLabel("Rows per page"), "25");
    assert.equal(ui.listCalls().at(-1).query.limit, "25");
    assert.equal(tableRows(ui).length, 23);

    const fatal = ui.errors.filter((e) => !/not wrapped in act|Missing `Description`|aria-describedby/.test(e));
    assert.deepEqual(fatal, []);
  });
});

test("row actions: View loads GET /:id; suspend needs a reason; reactivate confirms", { skip }, async () => {
  await withDom(backend(), async (ui, React) => {
    const { default: AccountManagement } = await import("../src/components/customermanagement/AccountManagement.tsx");
    await ui.render(React.createElement(AccountManagement));

    await ui.openMenu(ui.byLabel("Actions for Customer 1"));
    const items = () => [...ui.doc.querySelectorAll("[role=menuitem]")];
    assert.deepEqual(items().map((i) => i.textContent.trim()), ["View details", "Suspend account"], "only supported actions (no delete/edit)");
    await ui.click(items()[0]);
    await ui.settle(4);
    assert.ok(ui.calls.some((c) => c.method === "GET" && c.path === `/api/customermanagement/${ALL[0].id}`));
    assert.match(ui.text(), /Customer details/);
    assert.match(ui.text(), new RegExp(ALL[0].id));
    assert.doesNotMatch(ui.text(), /SHOULD_NEVER_RENDER/);
    // close the sheet
    await ui.click([...ui.doc.querySelectorAll("button")].find((b) => b.textContent.trim() === "Close" || b.querySelector(".sr-only")?.textContent === "Close"));

    await ui.openMenu(ui.byLabel("Actions for Customer 1"));
    await ui.click([...ui.doc.querySelectorAll("[role=menuitem]")].find((i) => i.textContent.includes("Suspend")));
    const confirm = ui.button("Suspend account");
    assert.equal(confirm.disabled, true, "reason required");
    await ui.type(ui.doc.getElementById("suspend-reason"), "Chargeback fraud");
    await ui.click(ui.button("Suspend account"));
    const put = ui.calls.find((c) => c.method === "PUT");
    assert.equal(put.path, `/api/customermanagement/${ALL[0].id}/block`);
    assert.deepEqual(put.body, { block: false, reason: "Chargeback fraud" });
    const totalsAfter = ui.calls.filter((c) => c.query.limit === "1").length;
    assert.ok(totalsAfter >= 6, "summary cards refetched after the change");

    await ui.openMenu(ui.byLabel("Actions for Customer 4"));
    await ui.click([...ui.doc.querySelectorAll("[role=menuitem]")].find((i) => i.textContent.includes("Reactivate")));
    assert.match(ui.text(), /Reactivate account\?/);
    assert.equal(ui.calls.filter((c) => c.method === "PUT").length, 1, "nothing sent before confirming");
    await ui.click(ui.button("Reactivate"));
    const puts = ui.calls.filter((c) => c.method === "PUT");
    assert.deepEqual(puts.at(-1).body, { block: true });
  });
});

test("error and empty states", { skip }, async () => {
  const state = { fail: true };
  await withDom(backend(state), async (ui, React) => {
    const { default: AccountManagement } = await import("../src/components/customermanagement/AccountManagement.tsx");
    await ui.render(React.createElement(AccountManagement));
    assert.match(ui.text(), /Couldn't load customers/);
    assert.match(ui.text(), /Failed to fetch customers/);
    assert.equal(ui.stat("Total Customers"), "—", "no fake total when the API fails");
    state.fail = false;
    await ui.click(ui.button("Try again"));
    assert.equal(tableRows(ui).length, 10);

    await ui.type(ui.byLabel("Search customers by name, email or phone"), "nobody-matches");
    await ui.settle(10);
    assert.match(ui.text(), /No customers match these filters/);
    await ui.click(ui.button("Reset filters"));
    assert.equal(tableRows(ui).length, 10);
  });
});
