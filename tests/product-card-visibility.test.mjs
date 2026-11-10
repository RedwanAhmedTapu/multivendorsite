// tests/product-card-visibility.test.mjs
//
// Module-level card visibility is HIDE-ONLY.
//
//   global true  + module true/absent → shown
//   global true  + module false       → hidden
//   global false + module true        → still hidden (a module can never force-show)
//
// Plus: an absent flag keeps exactly today's look (decorations saved before the
// flags existed must not change), and the contract never carries colour/style.
//
// Renders the REAL shared card with react-dom/server through the project's own
// tsx-loader (next/link + next/image stubbed) — no new dependencies.
//   node --test tests/product-card-visibility.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";

register("./support/tsx-loader.mjs", import.meta.url);

const { createElement } = await import("react");
const { renderToStaticMarkup } = await import("react-dom/server");
const { SharedProductCard } = await import("../src/components/product/card/SharedProductCard.tsx");
const { ProductCardConfigProvider } = await import(
  "../src/components/product/card/ProductCardConfigProvider.tsx"
);
const { getDefaultProductCardConfig } = await import("../src/lib/product-card/defaults.ts");
const {
  MODULE_CARD_VISIBILITY_FLAGS,
  resolveCardVisibility,
  readModuleCardVisibility,
} = await import("../src/lib/product-card/visibility.ts");

/** A product that exercises every switchable element. */
const product = (over = {}) => ({
  id: "p1",
  slug: "phone-x",
  name: "Phone X",
  images: [{ url: "http://img/1.jpg", altText: "Phone X front" }],
  variants: [{ id: "v1", price: "2500", specialPrice: "2000", discount: 20, stock: 5 }],
  vendor: { id: "ven1", storeName: "Finixmart Store", verificationStatus: "VERIFIED" },
  avgRating: 4.8,
  reviewCount: 12,
  ...over,
});

const withConfig = (over = {}) => {
  const base = getDefaultProductCardConfig();
  return {
    ...base,
    ...over,
    show: { ...base.show, ...(over.show ?? {}) },
  };
};

/** Renders one card, optionally inside a provider carrying `config`. */
const render = (p, { config, context, visibility } = {}) => {
  const card = createElement(SharedProductCard, { product: p, context, visibility });
  return renderToStaticMarkup(config ? createElement(ProductCardConfigProvider, { config }, card) : card);
};

/* ── the pure contract ─────────────────────────────────────────────────────── */

test("resolveCardVisibility: a module flag may only subtract from the global config", () => {
  const on = withConfig().show;
  // absent → unchanged
  assert.deepEqual(resolveCardVisibility(on, undefined), on);
  assert.deepEqual(resolveCardVisibility(on, {}), on);
  assert.deepEqual(resolveCardVisibility(on), on);
  // true → still unchanged (never force-show, never restyle)
  const allTrue = Object.fromEntries(MODULE_CARD_VISIBILITY_FLAGS.map((f) => [f, true]));
  assert.deepEqual(resolveCardVisibility(on, allTrue), on);
  // false → that element only
  const off = resolveCardVisibility(on, { showRating: false, showAddToCart: false });
  assert.equal(off.rating, false);
  assert.equal(off.addToCart, false);
  assert.equal(off.storeName, on.storeName, "other flags untouched");
  assert.equal(off.price, on.price, "price is not a module flag");
  // global false + module true → still false
  const globallyOff = withConfig({ show: { rating: false } }).show;
  assert.equal(resolveCardVisibility(globallyOff, { showRating: true }).rating, false);
});

test("resolveCardVisibility: the result is a plain show-block copy (no style keys)", () => {
  const on = withConfig().show;
  const out = resolveCardVisibility(on, { showWishlist: false });
  assert.deepEqual(Object.keys(out).sort(), Object.keys(on).sort());
  for (const key of Object.keys(out)) {
    assert.equal(typeof out[key], "boolean", `${key} stays a boolean`);
  }
});

test("readModuleCardVisibility: booleans only, junk ignored, nothing → undefined", () => {
  assert.equal(readModuleCardVisibility(undefined), undefined);
  assert.equal(readModuleCardVisibility(null), undefined);
  assert.equal(readModuleCardVisibility("x"), undefined);
  assert.equal(readModuleCardVisibility([]), undefined);
  assert.equal(readModuleCardVisibility({}), undefined, "no flags at all");
  assert.equal(readModuleCardVisibility({ showRating: "no" }), undefined, "non-boolean ignored");
  assert.deepEqual(readModuleCardVisibility({ showRating: false, nope: true }), { showRating: false });
  assert.deepEqual(readModuleCardVisibility({ showOldPrice: true, showWishlist: false }), {
    showOldPrice: true,
    showWishlist: false,
  });
});

/* ── the rendered card ─────────────────────────────────────────────────────── */

test("no visibility prop, {}, undefined and all-true render the SAME markup (old configs keep today's look)", () => {
  const p = product();
  const plain = render(p);
  assert.equal(render(p, { visibility: {} }), plain, "empty object == absent");
  assert.equal(render(p, { visibility: undefined }), plain, "undefined == absent");
  const allTrue = Object.fromEntries(MODULE_CARD_VISIBILITY_FLAGS.map((f) => [f, true]));
  assert.equal(render(p, { visibility: allTrue }), plain, "true never changes the card");
  // sanity: the fixture really does show the switchable elements
  assert.match(plain, /Finixmart Store/, "store name shown");
  assert.match(plain, /Rated 4\.8 out of 5/, "rating shown");
  assert.match(plain, /-20%/, "discount badge shown");
  assert.match(plain, /line-through/, "old price shown");
});

test("each flag turns its element off, and nothing else", () => {
  const p = product();
  const plain = render(p);

  const noStoreName = render(p, { visibility: { showStoreName: false } });
  assert.doesNotMatch(noStoreName, /Finixmart Store/);
  assert.match(noStoreName, /Rated 4\.8 out of 5/, "rating untouched");

  const noRating = render(p, { visibility: { showRating: false } });
  assert.doesNotMatch(noRating, /Rated 4\.8 out of 5/);
  assert.match(noRating, /Finixmart Store/, "store name untouched");

  const noDiscount = render(p, { visibility: { showDiscountBadge: false } });
  assert.doesNotMatch(noDiscount, /-20%/);
  assert.match(noDiscount, /line-through/, "old price untouched");

  const noOldPrice = render(p, { visibility: { showOldPrice: false } });
  assert.doesNotMatch(noOldPrice, /line-through/);
  assert.match(noOldPrice, /-20%/, "discount untouched");

  const noVerified = render(p, { visibility: { showVerifiedBadge: false } });
  assert.notEqual(noVerified, plain, "the verified badge disappears from the markup");
  assert.match(noVerified, /Finixmart Store/, "the row itself stays while the name shows");
});

test("a module cannot force-show what the global config switched off", () => {
  const p = product();
  const globalOff = withConfig({
    show: { storeName: false, rating: false, discountBadge: false, originalPrice: false },
  });
  const html = render(p, {
    config: globalOff,
    visibility: {
      showStoreName: true,
      showRating: true,
      showDiscountBadge: true,
      showOldPrice: true,
    },
  });
  assert.doesNotMatch(html, /Finixmart Store/);
  assert.doesNotMatch(html, /Rated 4\.8 out of 5/);
  assert.doesNotMatch(html, /-20%/);
  assert.doesNotMatch(html, /line-through/);
});

test("a module flag can only hide, never restyle: the markup is byte-identical when a flag is true", () => {
  const p = product();
  const plain = render(p);
  for (const flag of MODULE_CARD_VISIBILITY_FLAGS) {
    assert.equal(render(p, { visibility: { [flag]: true } }), plain, `${flag}: true must change nothing`);
  }
});
