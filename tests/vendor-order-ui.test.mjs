// tests/vendor-order-ui.test.mjs
//
// PHASE 4:
//   M-b — the vendor drawer shows a per-shipment "needs reconciliation" /
//         "booking in progress" note from the server-derived bookingState and
//         hides "Book Courier & Ship" while any shipment is IN_FLIGHT or
//         NEEDS_RECONCILIATION (another booking could duplicate it). Since the
//         premium-UI Phase 4 the block is derived by the backend
//         (vendorActions.canMarkForDelivery false + note BOOKING_NEEDS_ATTENTION;
//         tests/vendor-order-actions.test.ts) and the drawer renders only what
//         it allows (runtime: tests/vendor-order-workflow-ui.test.mjs).
//   M-a — vendor status refusals (e.g. 409 after a cancellation) show the
//         server's message in the drawer and the orders table (through
//         vendorActionError, which returns the server message).
//   D5  — /admin-dashboard/orders (mock data) redirects to /admin-dashboard/order.
//   D4  — the delivery-fee request type sends neither userId nor amount.
// Source-level checks (the components need the app's store and API hooks).
//   node --test tests/vendor-order-ui.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { register } from "node:module";

register("./support/tsx-loader.mjs", import.meta.url);
const L = await import("../src/lib/orders/vendor-order-actions.ts");

const read = (p) => readFileSync(new URL(`../src/${p}`, import.meta.url), "utf8");
const drawer = read("app/vendor-dashboard/@main/orders/components/VendorOrderDetailDrawer.tsx");
const table = read("app/vendor-dashboard/@main/orders/components/VendorOrdersTable.tsx");

test("M-b: booking is blocked while a shipment is IN_FLIGHT or NEEDS_RECONCILIATION", () => {
  // The drawer offers booking only when the backend allows it…
  assert.match(drawer, /const needsShipping = !!vendorActions\?\.canMarkForDelivery;/);
  // The booking dialog opens only from the trigger inside the needsShipping block.
  const opens = [...drawer.matchAll(/setShipDialogOpen\(true\)/g)].map((m) => m.index);
  assert.equal(opens.length, 1, "one way to open the booking dialog");
  const block = drawer.lastIndexOf("{needsShipping && (", opens[0]);
  assert.ok(block > 0 && opens[0] - block < 800, "Book Courier & Ship is triggered only under needsShipping");
  // …and otherwise explains the blocked booking (backend note), telling the store to contact support.
  assert.match(drawer, /\{notes\.map\(\(n\) =>/);
  assert.match(L.VENDOR_NOTE_COPY.BOOKING_NEEDS_ATTENTION.body, /contact support/);
  assert.doesNotMatch(drawer, /bookingBlocked/, "no second, client-side copy of the rule");
});

test("M-b: each shipment shows its booking state note", () => {
  assert.match(drawer, /Needs reconciliation — contact support before booking again/);
  assert.match(drawer, /Booking in progress — not yet confirmed by the courier/);
});

test("M-b: the courier order type carries bookingState", () => {
  assert.match(read("features/vendorOrderApi.ts"), /bookingState\?: "BOOKED" \| "PENDING" \| "IN_FLIGHT" \| "NEEDS_RECONCILIATION" \| "CANCELLED";/);
});

test("M-a: status refusals show the server's message (drawer + table)", () => {
  assert.equal(L.vendorActionError({ status: 409, data: { message: "This order changed in the meantime." } }, "fallback"), "This order changed in the meantime.");
  assert.equal(L.vendorActionError({ status: 500, data: {} }, "Couldn't update the order status."), "Couldn't update the order status.");
  assert.match(drawer, /toast\.error\(vendorActionError\(err, "Couldn't update the order status\."\)\)/);
  assert.match(table, /toast\.error\(vendorActionError\(err, "Couldn't update the order status\."\)\)/);
  assert.doesNotMatch(table, /toast\.error\("[^"]*"\)/, "no fixed message that hides the server's reason");
});

test("D5: the mock admin orders page redirects to the real screen", () => {
  const page = read("app/admin-dashboard/@main/orders/page.tsx");
  const code = page.replace(/^\s*\/\/.*$/gm, "");
  assert.match(code, /redirect\("\/admin-dashboard\/order"\)/);
  assert.doesNotMatch(code, /generateOrders|@\/data\/orders/);
});

test("D4: the delivery-fee request type sends neither userId nor amount", () => {
  const api = read("features/paymentApi.ts");
  const dto = api.match(/export interface ProcessDeliveryFeeDto \{([\s\S]*?)\}/)?.[1] ?? "";
  assert.match(dto, /orderId: string;/);
  assert.doesNotMatch(dto, /userId|amount/);
});
