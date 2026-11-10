// tests/order-history-price.test.mjs
//
// PHASE 4 (H-4): customer order history shows the price actually paid — the
// persisted OrderItem.price — never today's catalog price
// (variant.specialPrice ?? variant.price), on all four history pages. The
// customer order type no longer carries the vendor's avgCost.
// Source-level check (the pages need the app's store and API hooks to render).
//   node --test tests/order-history-price.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL(`../src/${p}`, import.meta.url), "utf8");
const PAGES = [
  "app/user-dashboard/@main/orders/[orderId]/page.tsx",
  "app/user-dashboard/@main/orders/pending/page.tsx",
  "app/user-dashboard/@main/orders/cancellations/page.tsx",
];

for (const page of PAGES) {
  test(`${page}: line prices come from item.price, never the live catalog price`, () => {
    const src = read(page);
    assert.match(src, /= Number\(item\.price\);/);
    assert.doesNotMatch(src, /item\.variant\.specialPrice|item\.variant\.price\b/);
  });
}

// The returns page no longer lists order lines (returns can't be requested online
// yet — tests/customer-returns-page.test.mjs): it shows no prices at all, and so
// in particular never the live catalog price.
test("app/user-dashboard/@main/orders/returns/page.tsx: shows no line prices, never the live catalog price", () => {
  const src = read("app/user-dashboard/@main/orders/returns/page.tsx");
  assert.doesNotMatch(src, /item.variant.specialPrice|item.variant.price/);
  assert.doesNotMatch(src, /item.price|৳/, "no order-line prices on this page");
});

test("the customer order types drop avgCost and accept the Decimal-string price", () => {
  const src = read("features/userorderApi.ts");
  assert.doesNotMatch(src, /avgCost/);
  assert.match(src, /price: number \| string;/);
});

test("a changed catalog price does not change the displayed line total", () => {
  // The exact expression the pages now evaluate, against an order line paid at 960.
  const item = { price: "960.0000", quantity: 2, variant: { price: 1200, specialPrice: 999 } };
  const price = Number(item.price);
  assert.equal(price * item.quantity, 1920);
});
