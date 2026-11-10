// tests/cart-checkout.test.mjs
//
// Cart + checkout redesign. Mocks only — no live cart, order or payment:
//   - display helpers (lib/cart/display.ts): variants, images, stock rules,
//     vendor grouping, savings, checkout block, delivery quote;
//   - checkout submission (lib/checkout/submit.ts): COD success, online
//     redirect, failures, and the retry that never places a second order;
//     the synchronous double-submit lock; validation order;
//   - the REAL CartView in every state.
//   node --test tests/cart-checkout.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";

register("./support/tsx-loader.mjs", import.meta.url);

const d = await import("../src/lib/cart/display.ts");
const s = await import("../src/lib/checkout/submit.ts");
const { createElement } = await import("react");
const { renderToStaticMarkup } = await import("react-dom/server");
const { CartView } = await import("../src/components/cart/CartView.tsx");

/** A cart line as GET /cart-wish/cart returns it. */
const line = (over = {}) => ({
  id: "c1",
  productId: "p1",
  variantId: "v1",
  quantity: 2,
  price: 1200,
  compareAtPrice: 1500,
  isSelected: true,
  notes: null,
  addedAt: "",
  updatedAt: "",
  itemTotal: 2400,
  savings: 600,
  isInStock: true,
  availableStock: 10,
  products: { id: "p1", name: "Desk Lamp", slug: "desk-lamp", vendorId: "ven1", vendor: { storeName: "Bright Home" }, images: [{ url: "/p.webp" }] },
  product_variants: {
    id: "v1",
    sku: "L1",
    price: 1500,
    specialPrice: 1200,
    availability: true,
    attributes: [{ attributeValue: { value: "Black", attribute: { name: "Color" } } }],
  },
  ...over,
});

// ── display helpers ─────────────────────────────────────────────────────────

test("display helpers: variant labels, images, stock rules, grouping, savings", () => {
  assert.deepEqual(d.variantLabels(line()), ["Color: Black"]);
  assert.deepEqual(d.variantLabels(line({ product_variants: { id: "v", name: " Large ", attributes: [] } })), ["Large"]);
  assert.deepEqual(d.variantLabels(line({ product_variants: { id: "v", attributes: [] } })), []);
  assert.equal(d.lineImage(line()), "/p.webp");
  assert.equal(d.lineImage(line({ product_variants: { id: "v", images: [{ url: "/v.webp" }] } })), "/v.webp", "variant image wins");
  assert.equal(d.lineImage(line({ products: { id: "p", name: "x", slug: "x", vendorId: "v" }, product_variants: { id: "v" } })), null);

  assert.equal(d.isUnavailable(line({ availableStock: 0 })), true);
  assert.equal(d.isUnavailable(line({ product_variants: { id: "v", availability: false } })), true);
  assert.equal(d.unavailableLabel(line({ product_variants: { id: "v", availability: false } })), "Currently unavailable");
  assert.equal(d.unavailableLabel(line({ availableStock: 0 })), "Out of stock");
  assert.equal(d.isShortStock(line({ quantity: 5, availableStock: 3 })), true);
  assert.equal(d.isShortStock(line({ quantity: 3, availableStock: 3 })), false);

  const groups = d.groupByVendor([
    line(),
    line({ id: "c2", products: { id: "p2", name: "B", slug: "b", vendorId: "ven2" } }),
    line({ id: "c3" }),
  ]);
  assert.deepEqual(groups.map((g) => [g.vendorId, g.name, g.items.map((i) => i.id)]), [
    ["ven1", "Bright Home", ["c1", "c3"]],
    ["ven2", "Seller", ["c2"]],
  ]);
  assert.equal(d.totalSavings([line(), line({ savings: 0 }), line({ savings: -5 })]), 600);
  assert.equal(d.formatBDT(12500.5), "৳ 12,500.5");
});

test("cart checkout block (existing rules) and delivery quote", () => {
  assert.equal(d.cartCheckoutBlock([]), "Select at least one item to continue");
  assert.equal(d.cartCheckoutBlock([line(), line({ id: "x", availableStock: 0 })]), "Remove or deselect 1 unavailable item to continue");
  assert.equal(d.cartCheckoutBlock([line()]), null);

  // Phase 2 (H-3): the delivery summary comes from the server's checkout quote.
  const quote = (vendors, shippingTotal) => ({ quoteHash: "h", userAddressId: "a1", lines: [], vendors, subtotal: 0, shippingTotal, grandTotal: shippingTotal, complete: true, priceChanges: [] });
  const vendors = [
    { vendorId: "a", vendorName: "A", subtotal: 0, shippingCost: 60, shipments: [] },
    { vendorId: "b", vendorName: "B", subtotal: 0, shippingCost: 0, shipments: [], error: "No courier available for this delivery route" },
  ];
  assert.deepEqual(d.deliveryQuote(quote(vendors, 60), ["a", "b"]), { total: 60, failed: ["b"], missing: [], complete: false });
  assert.deepEqual(d.deliveryQuote(quote(vendors.slice(0, 1), 60), ["a"]), { total: 60, failed: [], missing: [], complete: true });
  assert.equal(d.deliveryQuote(null, ["a"]).complete, false, "not quoted yet");
});

// ── checkout submission ────────────────────────────────────────────────────

function mocks({ placeFails = false, payFails = false, online = false } = {}) {
  const calls = { place: 0, pay: [] };
  return {
    calls,
    deps: {
      placeOrder: async () => {
        calls.place++;
        if (placeFails) throw { status: 400, data: { message: "No selected items in cart" } };
        return { data: { id: `order-${calls.place}`, orderNumber: `ORD-${calls.place}` } };
      },
      createPayment: async (orderId) => {
        calls.pay.push(orderId);
        if (payFails) throw { status: 502, data: { error: "Gateway timeout" } };
        return { data: online ? { gatewayPageURL: "https://gateway.example/pay/1" } : { paymentId: "pay1", status: "PENDING" } };
      },
    },
  };
}

test("submit: COD success, online redirect, order failure", async () => {
  let m = mocks();
  assert.deepEqual(await s.submitCheckout(null, m.deps), { kind: "success", order: { orderId: "order-1", orderNumber: "ORD-1" } });
  assert.deepEqual([m.calls.place, m.calls.pay], [1, ["order-1"]]);

  m = mocks({ online: true });
  const r = await s.submitCheckout(null, m.deps);
  assert.equal(r.kind, "redirect");
  assert.equal(r.url, "https://gateway.example/pay/1");

  m = mocks({ placeFails: true });
  assert.deepEqual(await s.submitCheckout(null, m.deps), { kind: "error", message: "No selected items in cart", order: null });
  assert.deepEqual(m.calls.pay, [], "no payment without an order");
});

test("submit: payment failure keeps the order; the retry only re-runs payment (never a second order)", async () => {
  const failing = mocks({ payFails: true });
  const first = await s.submitCheckout(null, failing.deps);
  assert.equal(first.kind, "error");
  assert.equal(first.message, "Gateway timeout");
  assert.deepEqual(first.order, { orderId: "order-1", orderNumber: "ORD-1" });

  const retry = mocks();
  const second = await s.submitCheckout(first.order, retry.deps);
  assert.equal(retry.calls.place, 0, "placeOrder NOT called again");
  assert.deepEqual(retry.calls.pay, ["order-1"], "payment retried for the same order");
  assert.deepEqual(second, { kind: "success", order: { orderId: "order-1", orderNumber: "ORD-1" } });
});

test("double-submit lock: a second click while submitting is ignored", async () => {
  const lock = s.createSubmitLock();
  const m = mocks();
  let release;
  const slowDeps = { ...m.deps, placeOrder: () => new Promise((r) => (release = () => r({ data: { id: "o1", orderNumber: "ORD-1" } }))) };
  const click = async () => {
    if (!lock.tryAcquire()) return "ignored";
    try {
      return (await s.submitCheckout(null, slowDeps)).kind;
    } finally {
      lock.release();
    }
  };
  const a = click();
  const b = click(); // while the first is in flight
  assert.equal(await b, "ignored");
  release();
  assert.equal(await a, "success");
  assert.equal(lock.busy, false);
  assert.equal(await (async () => (lock.tryAcquire() ? "free" : "busy"))(), "free");
});

test("checkout validation keeps the existing order of checks", () => {
  const ok = { hasAddress: true, payment: "COD", onlineAvailable: false, agreedToTerms: true, signedIn: true };
  assert.equal(s.checkoutBlock(ok), null);
  assert.match(s.checkoutBlock({ ...ok, hasAddress: false, agreedToTerms: false }), /delivery address/);
  assert.match(s.checkoutBlock({ ...ok, payment: "ONLINE" }), /Online payment isn't available/);
  assert.equal(s.checkoutBlock({ ...ok, payment: "ONLINE", onlineAvailable: true }), null);
  assert.match(s.checkoutBlock({ ...ok, agreedToTerms: false }), /Terms/);
  assert.match(s.checkoutBlock({ ...ok, signedIn: false }), /signed in/);
});

// ── the real CartView ───────────────────────────────────────────────────────

const noop = () => {};
const render = (props) =>
  renderToStaticMarkup(
    createElement(CartView, {
      status: "ready",
      items: [],
      subtotal: 0,
      updatingIds: new Set(),
      removingIds: new Set(),
      wishlistingIds: new Set(),
      bulkDeleting: false,
      onQty: noop,
      onRemove: noop,
      onSaveForLater: noop,
      onToggle: noop,
      onToggleVendor: noop,
      onToggleAll: noop,
      onRemoveSelected: noop,
      onCheckout: noop,
      onRetry: noop,
      onSignIn: noop,
      ...props,
    }),
  );

test("cart states: loading / error / signed out never show the empty cart; empty state links out", () => {
  const loading = render({ status: "loading" });
  assert.match(loading, /aria-label="Loading your cart"/);
  assert.doesNotMatch(loading, /Your cart is empty/);
  const error = render({ status: "error", errorMessage: "Database timeout." });
  assert.match(error, /We couldn’t load your cart/);
  assert.match(error, /Database timeout\./);
  assert.match(error, />Try again<\/button>|Try again/);
  assert.doesNotMatch(error, /Your cart is empty/);
  const signedOut = render({ status: "signedOut" });
  assert.match(signedOut, /Sign in to see your cart/);
  assert.doesNotMatch(signedOut, /Your cart is empty/);
  const empty = render({ status: "ready", items: [] });
  assert.match(empty, /Your cart is empty/);
  assert.match(empty, /href="\/products"/);
  assert.match(empty, /href="\/wishlist"/);
  assert.doesNotMatch(empty, /data-fm-cart-mobilebar/, "no checkout bar for an empty cart");
});

test("populated cart: vendor groups, server totals, stock states, actions, summary", () => {
  const items = [
    line(),
    line({ id: "c2", quantity: 5, availableStock: 3, itemTotal: 6000, savings: 0, compareAtPrice: null, products: { id: "p2", name: "Ceramic Mug", slug: "mug", vendorId: "ven2", vendor: { storeName: "Clay Co" } } }),
    line({ id: "c3", isSelected: false, availableStock: 0, itemTotal: 1200, savings: 0, products: { id: "p3", name: "Sold Out Vase", slug: "vase", vendorId: "ven2", vendor: { storeName: "Clay Co" } } }),
  ];
  const html = render({ items, subtotal: 8400, updatingIds: new Set(["c2"]) });
  assert.match(html, /3 items from 2 sellers/);
  assert.match(html, /aria-label="Items from Bright Home"/);
  assert.match(html, /aria-label="Items from Clay Co"/);
  assert.match(html, /href="\/products\/desk-lamp"/);
  assert.match(html, /Color: Black/);
  assert.match(html, /৳ 1,500<\/span>/, "compare-at price shown struck");
  assert.match(html, /Total <b[^>]*>৳ 2,400<\/b>/, "line total = server itemTotal");
  assert.match(html, /Only 3 left — reduce the quantity/);
  assert.match(html, /Out of stock/);
  assert.match(html, /aria-label="Updating"/, "quantity spinner while updating");
  assert.match(html, /aria-label="Remove Desk Lamp from cart"/);
  assert.match(html, /aria-label="Save Desk Lamp to wishlist"/);
  // Summary uses the server subtotal and the selected lines' server savings.
  assert.match(html, /Subtotal · 2 items/);
  assert.match(html, /৳ 8,400/);
  assert.match(html, /You save<\/dt><dd[^>]*>৳ 600/);
  assert.match(html, /Calculated at checkout/);
  assert.match(html, /data-fm-cart-mobilebar=""/);
  assert.doesNotMatch(html, /disabled=""[^>]*>Checkout|Checkout<svg[^>]*><\/svg><\/button>.*disabled/s, "checkout enabled for available selected items");

  const blocked = render({ items: [line({ availableStock: 0 })], subtotal: 2400 });
  assert.match(blocked, /Remove or deselect 1 unavailable item to continue/);
  assert.match(blocked, /<button type="button" class="[^"]*" disabled="">Checkout/);
});

test("cart mobile bar: the Total it presents discloses that delivery is excluded", () => {
  const html = render({ items: [line()], subtotal: 2400 });
  // The bar is the last element of the page, so slicing from its marker scopes
  // these assertions to the bar alone (the desktop summary is earlier).
  const at = html.indexOf("data-fm-cart-mobilebar");
  assert.notStrictEqual(at, -1, "mobile bar rendered for a ready cart");
  const bar = html.slice(at);
  assert.match(bar, /৳ 2,400/, "bar shows the server subtotal");
  // The amount is the server subtotal (delivery is not part of it, and is only
  // known at checkout), so the bar must disclose that exactly like the desktop
  // summary does — otherwise it presents a delivery-excluding amount as the
  // order Total.
  assert.match(bar, /Excluding delivery/, "mobile bar discloses that its Total excludes delivery");
  assert.match(bar, /calculated at checkout/i, "bar points at where delivery is calculated");
});

// ── checkout: section order + review table ─────────────────────────────────

test("checkout sections are ordered: 1 Delivery address → 2 Review items → 3 Payment method", async () => {
  const { readFileSync } = await import("node:fs");
  const src = readFileSync(new URL("../src/app/checkout/page.tsx", import.meta.url), "utf8");
  const at = (re) => src.search(re);
  const address = at(/<Section step=\{1\} title="Delivery address"/);
  const review = at(/<Section step=\{2\} title="Review items"/);
  const payment = at(/<Section step=\{3\} title="Payment method"/);
  assert.ok(address > 0 && review > address && payment > review, `order: ${address} < ${review} < ${payment}`);
  assert.match(src, /<ReviewItemsTable groups=\{groups\} quote=\{activeQuote\} calculating=\{calcFees\} \/>/);
  // Submission safety untouched.
  assert.match(src, /submitLock\.current\.tryAcquire\(\)/);
  assert.match(src, /submitCheckout\(placedOrder, \{/);
});

test("review items: a semantic table with an aligned header, one tbody per seller, server amounts, delivery per seller", async () => {
  const { ReviewItemsTable } = await import("../src/components/checkout/ReviewItemsTable.tsx");
  const groups = d.groupByVendor([
    line(),
    line({ id: "c2", quantity: 3, price: 450, itemTotal: 1350, products: { id: "p2", name: "Notebook Set", slug: "nb", vendorId: "ven1", vendor: { storeName: "Bright Home" } }, product_variants: { id: "v2", attributes: [] } }),
    line({ id: "c3", quantity: 1, price: 999, itemTotal: 999, products: { id: "p3", name: "Mug", slug: "mug", vendorId: "ven2", vendor: { storeName: "Clay Co" } }, product_variants: { id: "v3", name: "Large" } }),
  ]);
  // Phase 2 (H-3): the server's checkout quote (prices + per-warehouse delivery).
  const quote = {
    quoteHash: "h",
    userAddressId: "a1",
    lines: [
      { cartItemId: "c1", variantId: "v1", vendorId: "ven1", quantity: 2, cartPrice: 1200, price: 1200, lineTotal: 2400, changedSinceAdded: false },
      { cartItemId: "c2", variantId: "v2", vendorId: "ven1", quantity: 3, cartPrice: 450, price: 450, lineTotal: 1350, changedSinceAdded: false },
      { cartItemId: "c3", variantId: "v3", vendorId: "ven2", quantity: 1, cartPrice: 999, price: 999, lineTotal: 999, changedSinceAdded: false },
    ],
    vendors: [
      {
        vendorId: "ven1", vendorName: "Bright Home", subtotal: 3750, shippingCost: 60,
        shipments: [{ warehouseId: "wa", warehouseName: "Hub", locationName: "Dhaka", weightKg: 2, charge: 60, courierProviderId: "p", courierProvider: "Pathao", items: [{ cartItemId: "c1", quantity: 2 }, { cartItemId: "c2", quantity: 3 }] }],
      },
      { vendorId: "ven2", vendorName: "Clay Co", subtotal: 999, shippingCost: 0, shipments: [], error: "No courier available for this delivery route" },
    ],
    subtotal: 4749, shippingTotal: 60, grandTotal: 4809, complete: false, priceChanges: [],
  };
  const html = renderToStaticMarkup(createElement(ReviewItemsTable, { groups, quote, calculating: false }));

  assert.match(html, /<table[^>]*data-fm-review-table=""/);
  assert.match(html, /<caption class="sr-only">3 items in this order/);
  const heads = [...html.matchAll(/<th scope="col"[^>]*>([^<]+)<\/th>/g)].map((m) => m[1].trim());
  assert.deepEqual(heads, ["Product", "Seller", "Unit price", "Qty", "Subtotal"], "header row");
  assert.equal((html.match(/<tbody /g) ?? []).length, 2, "one tbody per seller");
  assert.equal((html.match(/<th scope="row"/g) ?? []).length, 3, "each product is a row header");
  // Every item row has 5 cells; the seller cell spans its group.
  assert.match(html, /<td rowSpan="2"[^>]*>.*?Bright Home/s);
  assert.match(html, /<td rowSpan="1"[^>]*>.*?Clay Co/s);
  // Server values: unit price = line price, subtotal = itemTotal.
  assert.match(html, />৳ 450<\/td><td[^>]*>3<\/td><td[^>]*>৳ 1,350<\/td>/);
  assert.match(html, />৳ 1,200<\/td><td[^>]*>2<\/td><td[^>]*>৳ 2,400<\/td>/);
  // Variants under the name, muted.
  assert.match(html, /Desk Lamp<\/span><span class="mt-0\.5 block text-xs text-stone-500">Color: Black<\/span>/);
  assert.match(html, />Large<\/span>/);
  // Delivery rows: fee in the Subtotal column (colSpan 4 + 1 = 5 columns); error shown, no fee.
  assert.match(html, /<td colSpan="4"[^>]*>.*?Pathao delivery.*?from Dhaka.*?5 units.*?<\/td><td[^>]*>৳ 60<\/td>/s);
  assert.match(html, /Delivery unavailable — No courier available for this delivery route.*?<\/td><td[^>]*text-amber-700[^>]*>—<\/td>/s);
  // Responsive: own horizontal scroll container, a minimum table width, a pinned product column.
  assert.match(html, /class="overflow-x-auto[^"]*"[^>]*data-fm-review-scroll=""/);
  assert.match(html, /min-w-\[540px\]/);
  assert.match(html, /<th scope="col" class="[^"]*sticky left-0[^"]*">Product<\/th>/);

  const busy = renderToStaticMarkup(createElement(ReviewItemsTable, { groups, quote: null, calculating: true }));
  assert.equal((busy.match(/aria-label="Calculating delivery"/g) ?? []).length, 2, "a spinner per seller while quoting");
});
