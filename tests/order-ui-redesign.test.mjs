// tests/order-ui-redesign.test.mjs
//
// Order-management UI redesign — the parts that can be verified without the
// app's Redux store:
//   • the four status-badge components render every state, keep their semantic
//     colour, never wrap, and keep the same size API;
//   • the vendor order table keeps its responsive structure (cards on phones,
//     table from md up), its retry affordance in the loading/empty states, and
//     tabular numerals for money and page numbers.
//
// Render-level for the badges (pure components), source-level for the table
// (it needs the app store and API hooks — the project's existing convention in
// tests/vendor-order-ui.test.mjs).
//   node --test tests/order-ui-redesign.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { register } from "node:module";

register("./support/tsx-loader.mjs", import.meta.url);

const { createElement } = await import("react");
const { renderToStaticMarkup } = await import("react-dom/server");
const {
  OrderStatusBadge,
  PaymentStatusBadge,
  FulfillmentStatusBadge,
  CourierStatusBadge,
  ORDER_STATUS_CONFIG,
  PAYMENT_STATUS_CONFIG,
  FULFILLMENT_STATUS_CONFIG,
} = await import("../src/components/orders/OrderStatusBadge.tsx");

const html = (type, props) => renderToStaticMarkup(createElement(type, props));
const strip = (s) => s.replace(/<[^>]+>/g, "");

test("every order status renders its label with a semantic colour, never wrapping", () => {
  for (const [status, cfg] of Object.entries(ORDER_STATUS_CONFIG)) {
    const out = html(OrderStatusBadge, { status });
    assert.equal(strip(out), cfg.label, `${status} label`);
    assert.match(out, /whitespace-nowrap/, `${status} must not wrap`);
    assert.match(out, /shrink-0/, `${status} must not be squeezed in a flex row`);
    for (const cls of cfg.cls.split(" ")) {
      assert.ok(out.includes(cls), `${status} keeps its accent class ${cls}`);
    }
    assert.match(out, new RegExp(cfg.dot.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `${status} keeps its dot`);
  }
});

test("payment + fulfillment badges render every state with a semantic colour", () => {
  for (const [status, cfg] of Object.entries(PAYMENT_STATUS_CONFIG)) {
    const out = html(PaymentStatusBadge, { status });
    assert.equal(strip(out), cfg.label, `payment ${status}`);
    assert.match(out, /whitespace-nowrap/);
    assert.ok(out.includes(cfg.cls.split(" ")[0]), `payment ${status} keeps ${cfg.cls.split(" ")[0]}`);
  }
  for (const [status, cfg] of Object.entries(FULFILLMENT_STATUS_CONFIG)) {
    const out = html(FulfillmentStatusBadge, { status });
    assert.equal(strip(out), cfg.label, `fulfillment ${status}`);
    assert.match(out, /whitespace-nowrap/);
  }
});

test("courier badge covers the pipeline states and falls back safely", () => {
  for (const status of ["PENDING_PICKUP", "IN_TRANSIT", "DELIVERED", "FAILED_DELIVERY", "RETURNED", "ON_HOLD"]) {
    const out = html(CourierStatusBadge, { status });
    assert.ok(strip(out).length > 0, `${status} label`);
    assert.match(out, /whitespace-nowrap/);
  }
  // An unknown status must not explode: every badge falls back to a real label.
  assert.equal(strip(html(OrderStatusBadge, { status: "NOT_A_STATUS" })), ORDER_STATUS_CONFIG.PENDING.label);
  assert.equal(strip(html(PaymentStatusBadge, { status: "NOPE" })), PAYMENT_STATUS_CONFIG.PENDING.label);
  assert.equal(strip(html(FulfillmentStatusBadge, { status: "NOPE" })), FULFILLMENT_STATUS_CONFIG.UNFULFILLED.label);
  assert.ok(strip(html(CourierStatusBadge, { status: "NOPE" })).length > 0);
});

test("the size API is unchanged: sm = 11px/20px, md = 12px/24px", () => {
  const sm = html(OrderStatusBadge, { status: "PENDING" });
  assert.match(sm, /text-\[11px\]/);
  assert.match(sm, /h-5/);
  const md = html(OrderStatusBadge, { status: "PENDING", size: "md" });
  assert.match(md, /text-xs/);
  assert.match(md, /h-6/);
  // default stays sm
  assert.equal(html(OrderStatusBadge, { status: "PENDING" }), sm);
});

/* ── the vendor table (source-level, like tests/vendor-order-ui.test.mjs) ───── */

const tableSrc = readFileSync(
  new URL("../src/app/vendor-dashboard/@main/orders/components/VendorOrdersTable.tsx", import.meta.url),
  "utf8",
);

test("vendor table keeps the responsive structure: cards on phones, table from md", () => {
  assert.match(tableSrc, /<ul className="divide-y divide-slate-100 md:hidden">/, "phone cards");
  assert.match(tableSrc, /<div className="hidden overflow-x-auto md:block">/, "md+ table");
  assert.match(tableSrc, /overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm/, "card shell");
});

test("vendor table states: busy loading, retry on error AND on empty", () => {
  assert.match(tableSrc, /role="status" aria-busy="true"/, "loading announces itself");
  assert.match(tableSrc, /Couldn&apos;t load your orders/, "error copy");
  assert.match(tableSrc, /\{onRetry \? \([\s\S]{0,400}?Refresh[\s\S]{0,80}?<\/Button>/, "empty state offers Refresh");
  assert.match(tableSrc, /No orders found/, "empty copy");
});

test("money and page numbers are tabular; rows give touch feedback", () => {
  assert.match(tableSrc, /font-mono text-sm font-bold tabular-nums text-slate-900/);
  assert.match(tableSrc, /size-8 p-0 text-xs tabular-nums/);
  assert.match(tableSrc, /active:bg-slate-50\/70/);
  assert.match(tableSrc, /hover:bg-slate-50\/80/);
});

test("no redesign regression in the table's semantics", () => {
  // Inline actions still come only from rowNextAction / the backend's vendorActions.
  assert.match(tableSrc, /const action = rowNextAction\(order\);/);
  // Status refusals still surface the server's message.
  assert.match(tableSrc, /toast\.error\(vendorActionError\(err, "Couldn't update the order status\."\)\)/);
  // Pagination still drives the shared filter state.
  assert.match(tableSrc, /setFilter\("page"/);
});
