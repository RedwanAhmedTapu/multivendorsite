// tests/vendor-cod-review-ui.test.mjs
//
// High-risk COD orders are reserved for FinixMart's fraud review: the backend
// refuses a store confirmation (403 COD_REVIEW_REQUIRED) and, on the order
// detail, reports it (codReviewRequired + vendorActions.notes
// ["COD_REVIEW_REQUIRED"], canConfirmCod false). The vendor drawer must hide
// "Manually Confirm COD" for such orders and say why, while eligible PENDING
// COD orders keep the button. Runtime checks of the REAL drawer (jsdom, real
// store, stubbed backend) — formerly source-level regexes.
//   node --test tests/vendor-cod-review-ui.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { register } from "node:module";

register("./support/tsx-loader.mjs", import.meta.url);
const { withDom, skip } = await import("./support/vendor-drawer-harness.mjs");

const read = (p) => readFileSync(new URL(`../src/${p}`, import.meta.url), "utf8");
const drawerSrc = read("app/vendor-dashboard/@main/orders/components/VendorOrderDetailDrawer.tsx");
const api = read("features/vendorOrderApi.ts");

const ACTIONS = (over = {}) => ({ nextStatus: null, canConfirmCod: false, canMarkForDelivery: false, canConfirmReturn: false, notes: [], ...over });
const VO = (over = {}) => ({
  id: "VO1", orderId: "O1", vendorId: "V1", status: "PENDING", fulfillmentStatus: "UNFULFILLED", subtotal: "1000", shippingCost: "60",
  createdAt: "2026-10-18T08:00:00.000Z", codReviewRequired: false, vendorActions: ACTIONS({ canConfirmCod: true }), courierOrders: [], returns: [],
  vendor: { id: "V1", storeName: "Store One" },
  items: [{ id: "OI1", quantity: 1, price: "1000", variant: { id: "VAR1", sku: "SKU-1", name: null, price: "1000", product: { id: "P1", name: "Phone X", slug: "phone-x", images: [] }, images: [] }, allocations: [] }],
  order: {
    id: "O1", orderNumber: "ORD-1", status: "PENDING", paymentStatus: "PENDING", paymentmethod: "COD", totalAmount: "1060", createdAt: "2026-10-18T08:00:00.000Z", confirmedAt: null, payments: [],
    user: { id: "U1", name: "Customer", email: null, phone: "01700000000" },
    address: { receiverFullName: "Customer", phone: "01700000000", address: "House 1", city: "Dhaka", landmark: null, location: { name: "Dhanmondi" } },
  },
  ...over,
});
const drawer = async (ui, React) => {
  const { VendorOrderDetailDrawer } = await import("../src/app/vendor-dashboard/@main/orders/components/VendorOrderDetailDrawer.tsx");
  await ui.render(React.createElement(VendorOrderDetailDrawer, { vendorOrderId: "VO1", onClose: () => {} }));
};

test("the manual COD confirmation follows the server's decision", { skip }, async () => {
  await withDom(VO(), async (ui, React) => {
    await drawer(ui, React);
    assert.ok(ui.button("Manually Confirm COD"), "eligible: offered");
  });
  await withDom(VO({ codReviewRequired: true, vendorActions: ACTIONS({ notes: ["COD_REVIEW_REQUIRED"] }) }), async (ui, React) => {
    await drawer(ui, React);
    assert.ok(ui.text().includes("Phone X"), "the drawer loaded the order");
    assert.equal(ui.button("Manually Confirm COD"), undefined, "high risk: not offered");
  });
});

test("a high-risk COD order shows why the store can't confirm it — and only that", { skip }, async () => {
  await withDom(VO({ codReviewRequired: true, vendorActions: ACTIONS({ notes: ["COD_REVIEW_REQUIRED"] }) }), async (ui, React) => {
    await drawer(ui, React);
    const t = ui.text();
    assert.ok(t.includes("Awaiting FinixMart review") && t.includes("the store can't confirm it"), t.slice(0, 400));
    assert.ok(!t.includes("No further actions available"), "the generic 'no actions' text is not shown on top");
  });
});

test("the vendor order detail type carries the server-derived flags (no client-side risk threshold)", () => {
  assert.match(api, /codReviewRequired\?: boolean;/);
  assert.match(api, /vendorActions\?: VendorOrderActions;/);
  assert.doesNotMatch(drawerSrc, /riskScore/, "the drawer never re-implements the risk rule");
});
