// tests/product-card-render.test.mjs
//
// Renders the REAL shared product card (components/product/card) with
// react-dom/server and checks that configuration reaches the markup:
// non-default design values, visibility switches, the discount rule (M1),
// the prefetch policy (M3) and the rating accessibility (L3).
// No new dependencies: tests/support/tsx-loader.mjs transpiles src/ .tsx with
// the project's own `typescript` and stubs next/link + next/image.
//   node --test tests/product-card-render.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";

register("./support/tsx-loader.mjs", import.meta.url);

const { createElement } = await import("react");
const { renderToStaticMarkup } = await import("react-dom/server");
const { SharedProductCard } = await import("../src/components/product/card/SharedProductCard.tsx");
const { ProductCardConfigProvider } = await import("../src/components/product/card/ProductCardConfigProvider.tsx");
const { getDefaultProductCardConfig } = await import("../src/lib/product-card/defaults.ts");

const product = (over = {}) => ({
  id: "p1",
  slug: "phone-x",
  name: "Phone X",
  images: [{ url: "http://img/1.jpg", altText: "Phone X front" }],
  variants: [{ id: "v1", price: "2500", specialPrice: "2000", discount: 20, stock: 5 }],
  vendor: { id: "ven1", storeName: "Finixmart Store", verificationStatus: "VERIFIED" },
  avgRating: 0,
  reviewCount: 0,
  ...over,
});

/** Renders one card, optionally inside a provider carrying `config`. */
const render = (p, { config, context } = {}) => {
  const card = createElement(SharedProductCard, { product: p, context });
  return renderToStaticMarkup(config ? createElement(ProductCardConfigProvider, { config }, card) : card);
};

test("default design: real link without prefetch, today's sizes, discount and store name", () => {
  const html = render(product());
  // (React 19 may hoist a <link rel="preload"> for the image before the card.)
  assert.match(html, /<a href="\/products\/phone-x" data-prefetch="false" data-fm-card=""/, "semantic link, prefetch disabled");
  assert.match(html, /--fmc-radius:10px/);
  assert.match(html, /--fmc-img-h-d:176px/);
  assert.match(html, /--fmc-title-weight:600/);
  assert.match(html, /line-through/, "real discount shows the original price");
  assert.match(html, />-(<!-- -->)?20(<!-- -->)?%</, "and the discount badge");
  assert.match(html, /Finixmart Store/);
  assert.match(html, /aria-label="Verified seller"/);
  assert.doesNotMatch(html, /imageBoxRatio/, "fixed-height image by default");
  // Narrow cells (e.g. 320px phones): price rows may wrap so the badge drops below the price instead of being clipped.
  assert.equal((html.match(/flex flex-wrap items-center justify-between gap-y-1/g) ?? []).length, 2, "both price rows can wrap");
});

test("a non-default configuration is reflected in the rendered markup", () => {
  const config = getDefaultProductCardConfig();
  config.card.radius = 16;
  config.title.lines = 1;
  config.price.color = "#b91c1c";
  config.card.background = "#fefce8";
  config.image.sizing = "1:1";
  config.show.storeName = false;
  config.discountBadge.position = "imageTopRight";
  const html = render(product(), { config });

  assert.match(html, /--fmc-radius:16px/);
  assert.doesNotMatch(html, /--fmc-title-lines/, "title.lines is not used: titles are always one line");
  assert.match(html, /--fmc-img-ratio:1 \/ 1/);
  assert.match(html, /imageBoxRatio/, "ratio sizing class applied");
  assert.match(html, /background-color:#fefce8/, "card background override");
  assert.match(html, /color:#b91c1c/, "price color override");
  assert.doesNotMatch(html, /Finixmart Store/, "store name hidden by config");
  assert.match(html, /absolute top-2 z-10 right-2/, "discount badge moved onto the image");

  // Without a provider the same card renders the defaults (no leakage between trees).
  const plain = render(product());
  assert.match(plain, /--fmc-radius:10px/);
  assert.match(plain, /Finixmart Store/);
});

test("M1: only 0 < specialPrice < price is a discount; the main price is unchanged", () => {
  const cases = [
    ["equal", { price: "2000", specialPrice: "2000", discount: 0 }, "2000", false],
    ["higher special", { price: "2000", specialPrice: "2500", discount: 10 }, "2000", false],
    ["zero special", { price: "2000", specialPrice: "0", discount: 10 }, "2000", false],
    ["null special", { price: "2000", specialPrice: null, discount: 10 }, "2000", false],
    ["invalid special", { price: "2000", specialPrice: "abc", discount: 10 }, "2000", false],
    ["lower special", { price: "2500", specialPrice: "2000", discount: 20 }, "2000", true],
  ];
  for (const [name, v, shown, discounted] of cases) {
    const html = render(product({ variants: [{ id: "v", stock: 1, ...v }] }));
    assert.match(html, new RegExp(`>${shown}</span>`), `${name}: main price ${shown}`);
    if (discounted) {
      assert.match(html, /line-through/, `${name}: struck-through original`);
      assert.match(html, /%</, `${name}: discount badge`);
    } else {
      assert.doesNotMatch(html, /line-through/, `${name}: no struck-through price`);
      assert.doesNotMatch(html, /%</, `${name}: no discount badge`);
    }
  }
});

test("L3: valid ratings are an accessible image; missing/invalid ratings render nothing", () => {
  const rated = render(product({ avgRating: 4.5, reviewCount: 12 }));
  assert.match(rated, /role="img" aria-label="Rated 4.5 out of 5 from 12 reviews"/);
  assert.equal((rated.match(/★/g) ?? []).length, 4, "4 full stars for 4.5");
  for (const r of [{ avgRating: 0, reviewCount: 0 }, { avgRating: 4.5, reviewCount: 0 }, { avgRating: 9, reviewCount: 3 }]) {
    const html = render(product(r));
    assert.doesNotMatch(html, /aria-label="Rated /, "no rating element");
    assert.doesNotMatch(html, /[★☆]/, "no stars without valid rating data");
  }
});

test("storefront context hides the store name; no Wishlist / Quick View / Add to Cart controls", () => {
  const html = render(product(), { context: "storefront" });
  assert.doesNotMatch(html, /Finixmart Store/);
  assert.doesNotMatch(html, /Verified seller/);
  const any = render(product());
  assert.doesNotMatch(any, /<button/i, "the card has no buttons at all");
  assert.doesNotMatch(any, /wishlist|quick view|add to cart/i);
});

test("B2 campaign shape: existing /products route, derived discount, no vendor/rating, unoptimized image", () => {
  // Exactly what GET /campaigns/:slug returns per product (campaignPage.service.ts select).
  const campaignProduct = {
    id: "cp1",
    name: "Mega T-Shirt",
    slug: "mega-t-shirt",
    images: [{ url: "https://cdn.example.org/t.jpg" }],
    variants: [{ price: "1000", specialPrice: "750", sku: "TS-1", stock: 4 }],
  };
  const html = renderToStaticMarkup(
    createElement(SharedProductCard, { product: campaignProduct, unoptimizedImage: true, imageSizes: "(max-width: 767px) 50vw, 220px" }),
  );
  assert.match(html, /<a href="\/products\/mega-t-shirt" data-prefetch="false"/, "the existing product route, not /product/");
  assert.doesNotMatch(html, /href="\/product\//);
  assert.match(html, /data-unoptimized="true"/, "no Next image host check, like the old <img>");
  assert.match(html, />-(<!-- -->)?25(<!-- -->)?%</, "discount derived from the prices (field absent in campaign payloads)");
  assert.match(html, /line-through/);
  assert.doesNotMatch(html, /Verified seller|aria-label="Rated /, "no vendor or rating data → nothing rendered");

  // Default listings keep Next's optimizer.
  assert.match(render(product()), /data-unoptimized="false"/);
});
