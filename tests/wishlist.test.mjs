// tests/wishlist.test.mjs
//
// Wishlist redesign. No live API, no real wishlist / cart writes:
//   - wishlist item → shared card input (the SAVED variant only);
//   - status notes + header summary from the actual items;
//   - remove workflow with a mocked mutation;
//   - the REAL view (WishlistView → SharedProductCard) in every state:
//     loading / error / signed out never show the empty message; empty state;
//     list with count, remove controls OUTSIDE the product links, Add to Cart
//     from the global design adding the saved variant.
//   node --test tests/wishlist.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";

register("./support/tsx-loader.mjs", import.meta.url);

const wl = await import("../src/lib/wishlist/card.ts");
const { cardCartAction, toProductCardModel } = await import("../src/lib/product-card/model.ts");
const { getDefaultProductCardConfig } = await import("../src/lib/product-card/defaults.ts");
const { createElement } = await import("react");
const { renderToStaticMarkup } = await import("react-dom/server");
const { Provider } = await import("react-redux");
const { configureStore } = await import("@reduxjs/toolkit");
const { cartWishApi } = await import("../src/features/cartWishApi.ts");
const { ProductCardConfigProvider } = await import("../src/components/product/card/ProductCardConfigProvider.tsx");
const { WishlistView } = await import("../src/components/wishlist/WishlistView.tsx");

/** A wishlist item exactly as GET /cart-wish/wishlist returns it today. */
const item = (over = {}) => ({
  id: "wi1",
  productId: "p1",
  variantId: "v-saved",
  priority: 0,
  notes: null,
  priceWhenAdded: 3000,
  notifyOnDiscount: false,
  notifyOnRestock: false,
  addedAt: "2026-10-03T08:00:00.000Z",
  currentPrice: 3000,
  priceChange: 0,
  priceChangePercent: "0.00",
  isPriceDropped: false,
  isPriceIncreased: false,
  isInStock: true,
  products: { id: "p1", name: "Noise Cancelling Headphones", slug: "nc-headphones", vendorId: "ven1" },
  product_variants: { id: "v-saved", sku: "NC-1", price: 3000, specialPrice: 2400, availability: true },
  ...over,
});

// ── mapping ─────────────────────────────────────────────────────────────────

test("item → card input: only the saved variant; discount derived; unavailable → stock 0; extras passed through", () => {
  const p = wl.wishlistItemToCardProduct(item());
  assert.equal(p.id, "p1");
  assert.equal(p.slug, "nc-headphones");
  assert.equal(p.name, "Noise Cancelling Headphones");
  assert.equal(p.variants.length, 1);
  assert.equal(p.variants[0].id, "v-saved");
  assert.equal("discount" in p.variants[0], false, "discount derived by the card");
  assert.equal("stock" in p.variants[0], false, "in stock: left to the server");
  const m = toProductCardModel(p);
  assert.equal(m.priceText, "2,400");
  assert.equal(m.originalPriceText, "3,000");
  assert.equal(m.discountPercent, 20);
  assert.deepEqual(m.cart, { kind: "add", productId: "p1", variantId: "v-saved" }, "Add to Cart adds the saved variant");
  assert.equal(m.href, "/products/nc-headphones");

  assert.deepEqual(cardCartAction(wl.wishlistItemToCardProduct(item({ isInStock: false }))), { kind: "outOfStock" });
  assert.deepEqual(cardCartAction(wl.wishlistItemToCardProduct(item({ variantId: null, product_variants: null }))), { kind: "viewProduct" }, "no saved variant → no request");
  assert.equal(toProductCardModel(wl.wishlistItemToCardProduct(item({ product_variants: { id: "v", price: 500, specialPrice: null } }))).discountPercent, null);

  // When the API includes card fields they flow straight into the card.
  const rich = wl.wishlistItemToCardProduct(
    item({ products: { id: "p1", name: "X", slug: "x", vendorId: "ven1", images: [{ url: "/a.webp", altText: "A" }], vendor: { id: "ven1", storeName: "Shop", verificationStatus: "VERIFIED" }, avgRating: 4.5, reviewCount: 10 } }),
  );
  assert.deepEqual(rich.images, [{ url: "/a.webp", altText: "A" }]);
  assert.equal(rich.vendor.storeName, "Shop");
  assert.deepEqual([rich.avgRating, rich.reviewCount], [4.5, 10]);
  const variantImg = wl.wishlistItemToCardProduct(item({ product_variants: { id: "v", price: 5, images: [{ url: "/v.webp" }] } }));
  assert.deepEqual(variantImg.images, [{ url: "/v.webp" }], "the saved variant's own image wins");
});

test("notes + summary come from the actual items", () => {
  assert.deepEqual(wl.wishlistNote(item({ isPriceDropped: true, priceChange: -500 })), { kind: "priceDrop", amount: 500 });
  assert.deepEqual(wl.wishlistNote(item({ isInStock: false, isPriceDropped: true, priceChange: -500 })), { kind: "unavailable" }, "unavailable wins");
  const saved = wl.wishlistNote(item());
  assert.equal(saved.kind, "saved");
  assert.equal(wl.formatSavedDate(saved.date), "Saved 3 Oct");
  assert.deepEqual(wl.wishlistNote(item({ addedAt: "nope" })), { kind: "saved", date: null });
  assert.equal(wl.formatTaka(12500), "৳12,500");
  assert.deepEqual(
    wl.wishlistSummary([item(), item({ id: "b", isPriceDropped: true, priceChange: -10 }), item({ id: "c", isInStock: false })]),
    { count: 3, priceDrops: 1, unavailable: 1 },
  );
});

test("remove: exactly one request for that item; success / server error / expired session / network messages", async () => {
  const calls = [];
  const notes = [];
  const deps = (remove) => ({ remove: async (id) => { calls.push(id); return remove(id); }, notify: (t, m) => notes.push([t, m]) });
  assert.equal(await wl.removeWishlistItem("wi1", "Headphones", deps(async () => ({ success: true }))), true);
  assert.deepEqual(calls, ["wi1"]);
  assert.deepEqual(notes.at(-1), ["success", "Removed “Headphones” from your wishlist"]);

  assert.equal(await wl.removeWishlistItem("wi2", "X", deps(async () => { throw { status: 404, data: { message: "Wishlist item not found" } }; })), false);
  assert.deepEqual(notes.at(-1), ["error", "Wishlist item not found"]);
  await wl.removeWishlistItem("wi3", "X", deps(async () => { throw { status: 401, data: {} }; }));
  assert.match(notes.at(-1)[1], /session has expired/);
  await wl.removeWishlistItem("wi4", "X", deps(async () => { throw { status: "FETCH_ERROR" }; }));
  assert.match(notes.at(-1)[1], /Could not reach the server/);
  assert.deepEqual(calls, ["wi1", "wi2", "wi3", "wi4"], "one call per remove, never batched / repeated");
});

// ── the real view ───────────────────────────────────────────────────────────

const store = () =>
  configureStore({
    reducer: { auth: (s = { user: { id: "u1" }, accessToken: "t" }) => s, [cartWishApi.reducerPath]: cartWishApi.reducer },
    middleware: (gDM) => gDM({ serializableCheck: false }).concat(cartWishApi.middleware),
  });

function render(props, { addToCart = false } = {}) {
  const config = getDefaultProductCardConfig();
  config.show.addToCart = addToCart;
  const view = createElement(WishlistView, {
    items: [],
    removingIds: new Set(),
    onRemove: () => {},
    onRetry: () => {},
    onSignIn: () => {},
    onClearAll: () => {},
    ...props,
  });
  return renderToStaticMarkup(createElement(Provider, { store: store() }, createElement(ProductCardConfigProvider, { config }, view)));
}

const EMPTY_TEXT = /Your wishlist is waiting/;

test("loading / error / signed out never show the empty-wishlist message", () => {
  const loading = render({ status: "loading" });
  assert.match(loading, /role="status" aria-label="Loading your wishlist"/);
  assert.equal((loading.match(/animate-pulse/g) ?? []).length, 10, "skeleton cards");
  assert.doesNotMatch(loading, EMPTY_TEXT);
  assert.doesNotMatch(loading, /data-fm-card=/);
  assert.doesNotMatch(loading, /saved items?/, "no count before data");

  const error = render({ status: "error", errorMessage: "Database timeout." });
  assert.match(error, /We couldn’t load your wishlist/);
  assert.match(error, /Database timeout\./);
  assert.match(error, />Try again<\/button>/);
  assert.doesNotMatch(error, EMPTY_TEXT);

  const signedOut = render({ status: "signedOut" });
  assert.match(signedOut, /Sign in to see your wishlist/);
  assert.match(signedOut, /<button type="button"[^>]*>Sign in<\/button>/);
  assert.doesNotMatch(signedOut, EMPTY_TEXT);
});

test("empty state: heading, friendly line, Explore products → /products; no count / clear-all", () => {
  const html = render({ status: "ready", items: [] });
  assert.match(html, EMPTY_TEXT);
  assert.match(html, /<a href="\/products"[^>]*>Explore products/);
  assert.doesNotMatch(html, /Clear all/);
  assert.doesNotMatch(html, /data-fm-card=/);
});

test("list: every item is the shared card; count from data; remove controls OUTSIDE the product links", () => {
  const items = [
    item(),
    item({ id: "wi2", products: { id: "p2", name: "A very long product name that keeps going and going for testing truncation", slug: "long", vendorId: "v" }, product_variants: { id: "v2", price: 900, specialPrice: null }, isPriceDropped: true, priceChange: -150 }),
    item({ id: "wi3", products: { id: "p3", name: "Sold Out Lamp", slug: "lamp", vendorId: "v" }, product_variants: { id: "v3", price: 1200, specialPrice: null }, isInStock: false }),
  ];
  const html = render({ status: "ready", items, removingIds: new Set(["wi2"]) });
  assert.equal((html.match(/data-fm-card=""/g) ?? []).length, 3, "three shared cards");
  assert.match(html, /<b[^>]*>3<\/b>saved items/);
  assert.match(html, /Clear all/);
  assert.match(html, /-20%/, "discount from the shared card");
  assert.match(html, /No Image/, "missing images use the shared placeholder");
  assert.match(html, /title="৳150 lower than when you saved it"/);
  assert.match(html, /Now ৳150 lower<\/span>/);
  assert.match(html, /Currently unavailable/);
  assert.match(html, /Saved 3 Oct/);
  assert.match(html, /1 price has dropped since you saved/);
  assert.match(html, /1 currently unavailable/);
  assert.match(html, /data-fm-wishlist-item="wi2" aria-busy="true"/, "item being removed is marked busy");

  const removes = html.match(/<button[^>]*data-fm-wishlist-remove=""[^>]*>/g) ?? [];
  assert.equal(removes.length, 3);
  assert.match(removes[0], /aria-label="Remove Noise Cancelling Headphones from wishlist"/);
  // No remove button inside any product link.
  for (const link of html.match(/<a [^>]*data-fm-card=""[\s\S]*?<\/a>/g) ?? []) {
    assert.doesNotMatch(link, /data-fm-wishlist-remove/);
  }
});

test("Add to Cart follows the global design: off → none; on → adds the saved variant, unavailable → disabled; never a remove", () => {
  const items = [item(), item({ id: "wi3", products: { id: "p3", name: "Sold Out Lamp", slug: "lamp", vendorId: "v" }, product_variants: { id: "v3", price: 1200, specialPrice: null }, isInStock: false })];
  assert.doesNotMatch(render({ status: "ready", items }), /data-fm-cart=/, "global setting off → no button");
  const on = render({ status: "ready", items }, { addToCart: true });
  assert.match(on, /data-fm-cart="add" data-fm-variant="v-saved"/);
  assert.match(on, /<button type="button" disabled=""[^>]*data-fm-cart="outOfStock"/);
  // Cart buttons and remove buttons are different controls.
  for (const b of on.match(/<button[^>]*data-fm-cart=[^>]*>/g) ?? []) assert.doesNotMatch(b, /data-fm-wishlist-remove/);
});
