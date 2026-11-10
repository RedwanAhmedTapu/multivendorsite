// tests/vendor-order-workflow-ui.test.mjs
//
// Vendor order workflow (list + drawer):
//   1. list next action (pure): only the two plain status steps inline; PENDING
//      prepaid explained (awaiting payment / paid awaiting confirmation);
//      packaging and COD review open the drawer;
//   2. drawer (REAL component, jsdom, stubbed backend): buttons only for what
//      the backend's vendorActions allow, notes explain everything else;
//      status step sends PATCH …/status; load errors → retry (403 → no retry);
//   3. list (REAL component): courier column reads the courierOrders array the
//      backend sends; inline status step; error state with retry.
//   node --test tests/vendor-order-workflow-ui.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";

register("./support/tsx-loader.mjs", import.meta.url);
const L = await import("../src/lib/orders/vendor-order-actions.ts");
const { withDom, skip } = await import("./support/vendor-drawer-harness.mjs");

const ACTIONS = (over = {}) => ({ nextStatus: null, canConfirmCod: false, canMarkForDelivery: false, canConfirmReturn: false, notes: [], ...over });
const VO = (over = {}, order = {}) => ({
  id: "VO1", orderId: "O1", vendorId: "V1", status: "PENDING", fulfillmentStatus: "UNFULFILLED", subtotal: "1000", shippingCost: "60",
  createdAt: "2026-10-18T08:00:00.000Z", codReviewRequired: false, vendorActions: ACTIONS(), courierOrders: [], returns: [],
  vendor: { id: "V1", storeName: "Store One" },
  items: [{ id: "OI1", quantity: 1, price: "1000", variant: { id: "VAR1", sku: "SKU-1", name: null, price: "1000", product: { id: "P1", name: "Phone X", slug: "phone-x", images: [] }, images: [] }, allocations: [] }],
  order: {
    id: "O1", orderNumber: "ORD-1", status: "PENDING", paymentStatus: "PENDING", paymentmethod: "COD", totalAmount: "1060", createdAt: "2026-10-18T08:00:00.000Z", confirmedAt: null, payments: [],
    user: { id: "U1", name: "Customer", email: null, phone: "01700000000" },
    address: { receiverFullName: "Customer", phone: "01700000000", address: "House 1", city: "Dhaka", landmark: null, location: { name: "Dhanmondi" } },
    ...order,
  },
  ...over,
});
const openDrawer = async (ui, React) => {
  const { VendorOrderDetailDrawer } = await import("../src/app/vendor-dashboard/@main/orders/components/VendorOrderDetailDrawer.tsx");
  await ui.render(React.createElement(VendorOrderDetailDrawer, { vendorOrderId: "VO1", onClose: () => {} }));
};

// ── 1. list rule ────────────────────────────────────────────────────────────

test("list next action: inline status steps only; pending prepaid explained; the rest opens the drawer", () => {
  const r = (status, paymentmethod = "COD", paymentStatus = "PENDING") => L.rowNextAction({ status, order: { paymentmethod, paymentStatus } });
  assert.deepEqual(r("CONFIRMED"), { kind: "advance", to: "PROCESSING", label: "Start processing" });
  assert.deepEqual(r("PROCESSING"), { kind: "advance", to: "PACKAGING", label: "Mark packed" });
  assert.equal(r("PACKAGING").kind, "open");
  assert.deepEqual(r("PENDING"), { kind: "open", label: "Review COD" });
  assert.deepEqual(r("PENDING", "SSLCOMMERZ"), { kind: "info", text: "Awaiting payment" });
  assert.deepEqual(r("PENDING", "SSLCOMMERZ", "PAID"), { kind: "info", text: "Paid · awaiting confirmation" });
  for (const s of ["SHIPPED", "DELIVERED", "CANCELLED", "RETURNED"]) assert.equal(r(s), null, s);
  for (const n of ["COD_REVIEW_REQUIRED", "STOCK_RELEASED", "AWAITING_PAYMENT", "PAID_AWAITING_CONFIRMATION", "BOOKING_NEEDS_ATTENTION"]) {
    assert.ok(L.VENDOR_NOTE_COPY[n].title && L.VENDOR_NOTE_COPY[n].body, n);
  }
  assert.match(L.vendorActionError({ status: 403 }, "x"), /permission/);
  assert.equal(L.vendorActionError({ status: 409, data: { message: "Changed." } }, "x"), "Changed.");
});

// ── 2. drawer ───────────────────────────────────────────────────────────────

test("drawer: packaging + unpaid prepaid → no courier booking, the reason instead", { skip }, async () => {
  await withDom(VO({ status: "PACKAGING", vendorActions: ACTIONS({ notes: ["AWAITING_PAYMENT"] }) }, { paymentmethod: "SSLCOMMERZ" }), async (ui, React) => {
    await openDrawer(ui, React);
    assert.ok(ui.text().includes("Phone X"));
    assert.equal(ui.button("Book Courier"), undefined);
    assert.ok(ui.text().includes("Awaiting customer payment"));
  });
  await withDom(VO({ status: "PACKAGING", vendorActions: ACTIONS({ canMarkForDelivery: true }) }), async (ui, React) => {
    await openDrawer(ui, React);
    assert.ok(ui.button("Book Courier"), "allowed → offered");
  });
});

test("drawer: stock released / booking needs attention → notes, no confirm or booking buttons", { skip }, async () => {
  await withDom(VO({ vendorActions: ACTIONS({ notes: ["STOCK_RELEASED"] }) }), async (ui, React) => {
    await openDrawer(ui, React);
    assert.equal(ui.button("Manually Confirm COD"), undefined);
    assert.ok(ui.text().includes("Stock reservation released"));
  });
  await withDom(VO({ status: "PACKAGING", vendorActions: ACTIONS({ notes: ["BOOKING_NEEDS_ATTENTION"] }) }), async (ui, React) => {
    await openDrawer(ui, React);
    assert.equal(ui.button("Book Courier"), undefined);
    assert.ok(ui.text().includes("Don't book again"));
  });
});

test("drawer: next status step sends PATCH …/status with the backend's next status", { skip }, async () => {
  await withDom(
    VO({ status: "CONFIRMED", vendorActions: ACTIONS({ nextStatus: "PROCESSING" }) }),
    async (ui, React) => {
      await openDrawer(ui, React);
      await ui.click(ui.button("Start Processing"));
      const patch = ui.calls.find((c) => c.method === "PATCH");
      assert.deepEqual([patch.path, patch.body], ["/api/vendor-orders/VO1/status", { status: "PROCESSING" }]);
    },
    (m, url) => (m === "PATCH" && url.pathname === "/api/vendor-orders/VO1/status" ? [200, { success: true, data: {} }] : null),
  );
});

test("drawer: no vendorActions → no action buttons at all (never guesses)", { skip }, async () => {
  await withDom(VO({ status: "CONFIRMED", vendorActions: undefined }), async (ui, React) => {
    await openDrawer(ui, React);
    assert.ok(ui.text().includes("Phone X"));
    for (const b of ["Start Processing", "Manually Confirm COD", "Book Courier", "Confirm Return"]) assert.equal(ui.button(b), undefined, b);
  });
});

// ── 3. list ─────────────────────────────────────────────────────────────────

const listProps = (React, mod, orders, extra = {}) =>
  React.createElement(mod.VendorOrdersTable, {
    orders,
    pagination: { page: 1, limit: 20, total: orders.length, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
    isLoading: false, isError: false, filters: { page: 1, limit: 20 }, setFilter: () => {}, onViewOrder: () => {}, ...extra,
  });

test("list: courier from the courierOrders array; pending prepaid explained; inline step sends PATCH", { skip }, async () => {
  const courier = { id: "C1", status: "IN_TRANSIT", courier_providers: { name: "pathao", displayName: "Pathao" }, lastStatusUpdate: "2026-10-18T09:00:00Z" };
  const rows = [
    VO({ id: "VO1", status: "SHIPPED", courierOrders: [courier] }),
    VO({ id: "VO2", status: "PENDING" }, { orderNumber: "ORD-2", paymentmethod: "EPS" }),
    VO({ id: "VO3", status: "CONFIRMED" }, { orderNumber: "ORD-3" }),
  ];
  await withDom(
    VO(),
    async (ui, React) => {
      const mod = await import("../src/app/vendor-dashboard/@main/orders/components/VendorOrdersTable.tsx");
      await ui.render(listProps(React, mod, rows));
      const t = ui.text();
      assert.ok(t.includes("Pathao"), "courier column filled from courierOrders");
      assert.ok(t.includes("Awaiting payment"));
      await ui.click(ui.button("Start processing"));
      const patch = ui.calls.find((c) => c.method === "PATCH");
      assert.deepEqual([patch.path, patch.body], ["/api/vendor-orders/VO3/status", { status: "PROCESSING" }]);
    },
    (m, url) => (m === "PATCH" ? [200, { success: true, data: {} }] : null),
  );
});

test("list: error state offers a retry", { skip }, async () => {
  await withDom(VO(), async (ui, React) => {
    const mod = await import("../src/app/vendor-dashboard/@main/orders/components/VendorOrdersTable.tsx");
    let retried = 0;
    await ui.render(listProps(React, mod, [], { isError: true, pagination: undefined, onRetry: () => retried++ }));
    assert.ok(ui.text().includes("Couldn't load your orders."));
    await ui.click(ui.button("Try again"));
    assert.equal(retried, 1);
  });
});
