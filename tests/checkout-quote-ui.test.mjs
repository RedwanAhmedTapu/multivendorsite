// tests/checkout-quote-ui.test.mjs
//
// PHASE 2 (H-3): checkout shows and places exactly the server's checkout quote.
//   - the review table shows EVERY warehouse shipment of a seller (not only
//     the first) and marks prices changed since the items were added;
//   - the summary's delivery total = the quote's shippingTotal;
//   - submitCheckout turns a 409 CHECKOUT_CHANGED into { kind: "changed" }
//     with the fresh quote — no payment is started and nothing is retried;
//   - diffQuotes lists what changed; the confirmation panel shows it and its
//     confirm button stays disabled until changed prices are accepted;
//   - the page sends only quoteHash + acknowledgePriceChanges, never amounts,
//     and confirms a pending change only through the panel.
// Mocks only — no live cart, order or payment.
//   node --test tests/checkout-quote-ui.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";

register("./support/tsx-loader.mjs", import.meta.url);

const d = await import("../src/lib/cart/display.ts");
const s = await import("../src/lib/checkout/submit.ts");
const { createElement } = await import("react");
const { renderToStaticMarkup } = await import("react-dom/server");
const { ReviewItemsTable } = await import("../src/components/checkout/ReviewItemsTable.tsx");
const { CheckoutChangedPanel } = await import("../src/components/checkout/CheckoutChangedPanel.tsx");

const cartLine = (over = {}) => ({
  id: "c1", productId: "p1", variantId: "v1", quantity: 8, price: 1200, compareAtPrice: null, isSelected: true,
  itemTotal: 9600, savings: 0, isInStock: true, availableStock: 55,
  products: { id: "p1", name: "Desk Lamp", slug: "lamp", vendorId: "ven1", vendor: { storeName: "Bright Home" } },
  product_variants: { id: "v1", attributes: [] },
  ...over,
});

const quote = (over = {}) => ({
  quoteHash: "hash-1",
  userAddressId: "a1",
  lines: [{ cartItemId: "c1", variantId: "v1", vendorId: "ven1", quantity: 8, cartPrice: 1200, price: 960, lineTotal: 7680, changedSinceAdded: true }],
  vendors: [
    {
      vendorId: "ven1", vendorName: "Bright Home", subtotal: 7680, shippingCost: 230,
      shipments: [
        { warehouseId: "WH-A", warehouseName: "Dhaka Hub", locationName: "Dhaka", weightKg: 2.5, charge: 90, courierProviderId: "p", courierProvider: "Pathao", items: [{ cartItemId: "c1", quantity: 5 }] },
        { warehouseId: "WH-B", warehouseName: "Ctg Store", locationName: "Chattogram", weightKg: 1.5, charge: 140, courierProviderId: "p", courierProvider: "RedX", items: [{ cartItemId: "c1", quantity: 3 }] },
      ],
    },
  ],
  subtotal: 7680, shippingTotal: 230, grandTotal: 7910, complete: true,
  priceChanges: [{ cartItemId: "c1", variantId: "v1", vendorId: "ven1", quantity: 8, cartPrice: 1200, price: 960, lineTotal: 7680, changedSinceAdded: true }],
  ...over,
});

// ── review table ────────────────────────────────────────────────────────────

test("review table: every warehouse shipment of a seller has its own delivery row and charge", () => {
  const html = renderToStaticMarkup(createElement(ReviewItemsTable, { groups: d.groupByVendor([cartLine()]), quote: quote(), calculating: false }));
  assert.equal((html.match(/data-fm-shipment=/g) ?? []).length, 2, "two shipments, two rows");
  assert.match(html, /Pathao delivery.*?from Dhaka.*?5 units.*?<\/td><td[^>]*>৳ 90<\/td>/s);
  assert.match(html, /RedX delivery.*?from Chattogram.*?3 units.*?<\/td><td[^>]*>৳ 140<\/td>/s);
});

test("review table: amounts come from the quote, and a price changed since adding is marked", () => {
  const html = renderToStaticMarkup(createElement(ReviewItemsTable, { groups: d.groupByVendor([cartLine()]), quote: quote(), calculating: false }));
  assert.match(html, />৳ 960<\/td><td[^>]*>8<\/td><td[^>]*>৳ 7,680<\/td>/, "unit = current price, subtotal = quote lineTotal");
  assert.match(html, /data-fm-price-changed="">Price updated: ৳ 1,200 → ৳ 960/);
});

test("summary delivery total = the quote's shippingTotal (all warehouses), not a single row", () => {
  assert.deepEqual(d.deliveryQuote(quote(), ["ven1"]), { total: 230, failed: [], missing: [], complete: true });
});

// ── submit: 409 CHECKOUT_CHANGED ────────────────────────────────────────────

test("submitCheckout: 409 CHECKOUT_CHANGED → { kind: 'changed' } with the fresh quote; no payment, no retry", async () => {
  const fresh = quote({ quoteHash: "hash-2" });
  const calls = { place: 0, pay: 0 };
  const r = await s.submitCheckout(null, {
    placeOrder: async () => {
      calls.place++;
      throw { status: 409, data: { code: "CHECKOUT_CHANGED", reason: "QUOTE_CHANGED", message: "Your order changed", data: { quote: fresh } } };
    },
    createPayment: async () => {
      calls.pay++;
      return { data: {} };
    },
  });
  assert.equal(r.kind, "changed");
  assert.equal(r.reason, "QUOTE_CHANGED");
  assert.equal(r.quote.quoteHash, "hash-2");
  assert.equal(r.order, null);
  assert.deepEqual(calls, { place: 1, pay: 0 }, "placed once, never paid, never retried");
});

test("submitCheckout: other 409s and errors stay plain errors", async () => {
  const r = await s.submitCheckout(null, {
    placeOrder: async () => {
      throw { status: 409, data: { message: "Something else" } };
    },
    createPayment: async () => assert.fail("no payment"),
  });
  assert.deepEqual(r, { kind: "error", message: "Something else", order: null });
});

// ── diff + confirmation panel ───────────────────────────────────────────────

test("diffQuotes: price, delivery, allocation and total changes", () => {
  const prev = quote({
    lines: [{ cartItemId: "c1", variantId: "v1", vendorId: "ven1", quantity: 8, cartPrice: 960, price: 960, lineTotal: 7680, changedSinceAdded: false }],
    vendors: [{ vendorId: "ven1", vendorName: "Bright Home", subtotal: 7680, shippingCost: 90, shipments: [{ warehouseId: "WH-A", warehouseName: null, locationName: null, weightKg: 4, charge: 90, courierProviderId: "p", courierProvider: "Pathao", items: [{ cartItemId: "c1", quantity: 8 }] }] }],
    shippingTotal: 90, grandTotal: 7770, priceChanges: [],
  });
  const next = quote({ lines: [{ ...prev.lines[0], price: 1000, lineTotal: 8000 }], subtotal: 8000, grandTotal: 8230 });
  const diff = d.diffQuotes(prev, next);
  assert.deepEqual(diff.priceChanges, [{ cartItemId: "c1", from: 960, to: 1000 }]);
  assert.deepEqual(diff.deliveryChanges, [{ vendorId: "ven1", vendorName: "Bright Home", from: 90, to: 230 }]);
  assert.equal(diff.allocationChanged, true);
  assert.deepEqual([diff.totalFrom, diff.totalTo], [7770, 8230]);
  assert.equal(d.diffQuotes(next, next).allocationChanged, false);
});

test("confirmation panel: shows the changes and the new total; confirm disabled until changed prices are accepted", () => {
  const props = (acknowledged) => ({
    previous: quote({ grandTotal: 7770, priceChanges: [] }),
    next: quote(),
    message: "Your order total, prices or delivery have changed since you reviewed them.",
    itemNames: { c1: "Desk Lamp" },
    acknowledged,
    onAcknowledge: () => {},
    onConfirm: () => {},
    onCancel: () => {},
    busy: false,
  });
  const html = renderToStaticMarkup(createElement(CheckoutChangedPanel, props(false)));
  assert.match(html, /nothing has been placed yet/);
  assert.match(html, /data-fm-new-total="">৳ 7,910/);
  assert.match(html, /Desk Lamp: price since you added it ৳ 1,200 → <b[^>]*>৳ 960/);
  assert.match(html, /data-fm-ack-prices=""/);
  assert.match(html, /<button[^>]*disabled=""[^>]*data-fm-confirm-changed=""/, "disabled until accepted");
  const accepted = renderToStaticMarkup(createElement(CheckoutChangedPanel, props(true)));
  assert.doesNotMatch(accepted, /<button[^>]*disabled=""[^>]*data-fm-confirm-changed=""/, "enabled once accepted");
});

// ── page wiring (source checks; the page needs a full app to render) ────────

test("checkout page sends only quoteHash + acknowledgment, and confirms a 409 only through the panel", async () => {
  const { readFileSync } = await import("node:fs");
  const src = readFileSync(new URL("../src/app/checkout/page.tsx", import.meta.url), "utf8");
  const body = src.match(/placeOrder\(\{([\s\S]*?)\}\s*as never\)/)?.[1] ?? "";
  assert.match(body, /quoteHash: reviewed\?\.quoteHash/);
  assert.match(body, /acknowledgePriceChanges: acceptedPrices/);
  assert.doesNotMatch(body, /total|shipping|price:|amount/i, "no client amounts in the request");
  assert.match(src, /result\.kind === "changed"/);
  assert.match(src, /const handlePlaceOrder = \(\) => submitOrder\(false\)/, "the place button never confirms a pending change");
  assert.match(src, /void submitOrder\(true\)/, "only the panel's confirm does");
  assert.match(src, /"Review the updated order above\."/);
  assert.match(src, /"Accept the updated prices to continue\."/);
  assert.match(src, /setAcceptedPrices\(false\)/, "acceptance never carries over to a new quote");
});
