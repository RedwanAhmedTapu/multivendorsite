// tests/order-status-controls.test.mjs
//
// PHASE 3 (H-5): the admin order drawer offers only the transitions the
// backend accepts — the order-level control offers CANCELLED (plus the current
// status as the selected value); the vendor-order control offers only
// CONFIRMED→PROCESSING and PROCESSING→PACKAGING — and shows the server's
// refusal message. Source-level check (the drawer needs the app's store and
// API hooks to render). Run with:
//   node --test tests/order-status-controls.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const src = readFileSync(new URL("../src/components/orders/OrderDetailDrawer.tsx", import.meta.url), "utf8");

test("order-level select offers only the current status and CANCELLED", () => {
  assert.match(src, /\[\.\.\.new Set\(\[order\.status, "CANCELLED"\]\)\]/);
  assert.doesNotMatch(src, /ALL_ORDER_STATUSES|Object\.values\(OrderStatus\)/, "no full status list");
});

test("vendor-order select offers only the next preparation step", () => {
  assert.match(
    src,
    /vo\.status === "CONFIRMED" \? \["PROCESSING"\] : vo\.status === "PROCESSING" \? \["PACKAGING"\] : \[\]/,
  );
  for (const target of ["SHIPPED", "DELIVERED"]) {
    assert.doesNotMatch(src, new RegExp(`\\? \\["${target}"\\]`), `${target} is never offered`);
  }
});

test("refusals show the server's message", () => {
  assert.match(src, /toast\.error\(err\?\.data\?\.message \|\| "Failed to update order status"\)/);
  assert.match(src, /toast\.error\(err\?\.data\?\.message \|\| "Failed to update vendor order"\)/);
});
