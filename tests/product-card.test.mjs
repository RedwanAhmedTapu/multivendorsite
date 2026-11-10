// tests/product-card.test.mjs
//
// Phase B0/B1: global product card — data adapter, config resolution, CSS
// variable mapping, and a contract check against the backend's own product
// card validator/defaults. Pure logic, no extra dependencies:
//   node --test tests/product-card.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";

import {
  productCardConfigSchema,
  resolveProductCardConfig,
  selectPublishedProductCardConfig,
} from "../src/lib/product-card/config.ts";
import { getDefaultProductCardConfig } from "../src/lib/product-card/defaults.ts";
import { SHADOWS, cardColorOverrides, cardStyleVars } from "../src/lib/product-card/style.ts";
import { register } from "node:module";

// model.ts now imports the shared pricing rule with an extensionless path (the
// app's convention), so it is loaded through the same tsx loader the other
// suites use.
register("./support/tsx-loader.mjs", import.meta.url);
const { formatPriceText, toProductCardModel } = await import("../src/lib/product-card/model.ts");

const here = dirname(fileURLToPath(import.meta.url));
const cfg = () => getDefaultProductCardConfig();

const product = (over = {}) => ({
  id: "p1",
  slug: "phone-x",
  name: "  Phone X  ",
  images: [{ url: "http://img/1.jpg", altText: "" }],
  variants: [{ id: "v1", price: "2500", specialPrice: "2000", discount: 20, stock: 5, reservedQty: 1, damagedQty: 1 }],
  vendor: { id: "ven1", storeName: "Finixmart", verificationStatus: "VERIFIED" },
  avgRating: 0,
  reviewCount: 0,
  ...over,
});

// ── data adapter (mirrors today's card rules) ───────────────────────────────

test("discounted product: special price shown, original struck, discount only with a special price", () => {
  const m = toProductCardModel(product());
  assert.equal(m.href, "/products/phone-x");
  assert.equal(m.name, "Phone X");
  assert.deepEqual(m.image, { url: "http://img/1.jpg", alt: "Phone X" }, "alt falls back to the name");
  assert.equal(m.price, 2000);
  assert.equal(m.originalPrice, 2500);
  assert.equal(m.priceText, "2000", "string amounts are shown as sent, like today's toLocaleString on a string");
  assert.equal(m.originalPriceText, "2500");
  assert.equal(m.discountPercent, 20);
  assert.equal(m.storeName, "Finixmart");
  assert.equal(m.verified, true);
  assert.equal(m.available, 3, "stock − reserved − damaged");
});

test("regular product: no original price and no discount badge even if a discount value exists", () => {
  const m = toProductCardModel(product({ variants: [{ price: 1500, specialPrice: null, discount: 10 }] }));
  assert.equal(m.price, 1500);
  assert.equal(m.priceText, "1,500", "numbers get grouping, as toLocaleString does today");
  assert.equal(m.originalPrice, null);
  assert.equal(m.originalPriceText, null);
  assert.equal(m.discountPercent, null);
});

test("M1: a special price is a discount only when 0 < specialPrice < price", () => {
  const m = (v) => toProductCardModel(product({ variants: [{ id: "v", stock: 1, ...v }] }));
  // equal → shown as a normal price (no strike-through, no badge); main number unchanged
  let r = m({ price: "2000", specialPrice: "2000", discount: 0 });
  assert.deepEqual([r.priceText, r.originalPriceText, r.discountPercent], ["2000", null, null]);
  // lower → real discount
  r = m({ price: "2500", specialPrice: "2000", discount: 20 });
  assert.deepEqual([r.priceText, r.originalPriceText, r.discountPercent], ["2000", "2500", 20]);
  // higher → the regular price (approved rule: a special price applies only when
  // 0 < special < price), and no discount display
  r = m({ price: "2000", specialPrice: "2500", discount: 10 });
  assert.deepEqual([r.priceText, r.originalPriceText, r.discountPercent], ["2000", null, null]);
  // zero / null / invalid special → regular price, no discount
  for (const special of ["0", 0, null, "abc", "", -5]) {
    r = m({ price: "2000", specialPrice: special, discount: 10 });
    assert.deepEqual([r.priceText, r.originalPriceText, r.discountPercent], ["2000", null, null], `special=${JSON.stringify(special)}`);
  }
  // invalid base price → nothing can be a discount
  r = m({ price: "abc", specialPrice: "100", discount: 10 });
  assert.equal(r.originalPriceText, null);
  // a real discount with no discount % still strikes through, without a badge value
  r = m({ price: "2500", specialPrice: "2000", discount: 0 });
  assert.deepEqual([r.originalPriceText, r.discountPercent], ["2500", null]);
});

test("discount % falls back to the prices ONLY when the payload has no discount field (campaign shape)", () => {
  // Campaign API: variants select { price, specialPrice, sku, stock } — no `discount` key at all.
  const campaign = toProductCardModel({ id: "c1", slug: "c", name: "C", variants: [{ price: "1000", specialPrice: "750", sku: "X", stock: 3 }] });
  assert.equal(campaign.discountPercent, 25, "derived like the old campaign card: round((1000-750)/1000*100)");
  assert.equal(campaign.originalPriceText, "1000");
  // Field present but 0/null (listing APIs) → no badge, never derived.
  for (const discount of [0, null]) {
    const m = toProductCardModel({ id: "p", variants: [{ price: "1000", specialPrice: "750", discount }] });
    assert.equal(m.discountPercent, null, `discount=${discount}`);
    assert.equal(m.originalPriceText, "1000", "strike-through still shown for a real discount");
  }
  // No real discount → nothing derived either.
  assert.equal(toProductCardModel({ id: "c2", variants: [{ price: "1000", specialPrice: "1000" }] }).discountPercent, null);
  // Missing vendor / rating data never produces placeholders.
  assert.equal(campaign.storeName, null);
  assert.equal(campaign.rating, null);
});

test("ratings only from real data — never empty stars", () => {
  assert.equal(toProductCardModel(product()).rating, null, "0 reviews → no rating");
  assert.equal(toProductCardModel(product({ avgRating: 4.2, reviewCount: 0 })).rating, null, "no reviews → hidden");
  assert.equal(toProductCardModel(product({ avgRating: 0, reviewCount: 3 })).rating, null, "invalid average → hidden");
  assert.equal(toProductCardModel(product({ avgRating: 7, reviewCount: 3 })).rating, null, "out of range → hidden");
  assert.equal(toProductCardModel(product({ avgRating: null, reviewCount: null })).rating, null);
  // The legacy `reviews` relation is not what listing APIs return; it is ignored.
  assert.equal(toProductCardModel(product({ reviews: [{ rating: 5 }] })).rating, null);
  assert.deepEqual(toProductCardModel(product({ avgRating: "4.5", reviewCount: "12" })).rating, { average: 4.5, count: 12 });
});

test("missing data never produces placeholders", () => {
  const m = toProductCardModel({ id: "p2" });
  assert.equal(m.href, "/products/p2", "slug falls back to id, as today");
  assert.equal(m.image, null);
  assert.equal(m.storeName, null, "no 'Unknown Store'");
  assert.equal(m.verified, false);
  assert.equal(m.price, 0);
  assert.equal(m.priceText, "0");
  assert.equal(m.available, null, "no stock data → unknown, not 0");
  assert.equal(m.variantCount, 0);
  assert.equal(toProductCardModel(product({ vendor: { storeName: "   " } })).storeName, null);
});

test("free shipping from offers; slugs are URL-encoded; availability floors at zero per variant", () => {
  assert.equal(toProductCardModel(product({ offerProducts: [{ offer: { type: "FREE_SHIPPING" } }] })).freeShipping, true);
  assert.equal(toProductCardModel(product({ offerProducts: [{ offer: { type: "FLASH_SALE" } }] })).freeShipping, false);
  assert.equal(toProductCardModel(product({ slug: "a b/c" })).href, "/products/a%20b%2Fc");
  const m = toProductCardModel(product({ variants: [{ price: 1, stock: 1, reservedQty: 5 }, { price: 2, stock: 4 }] }));
  assert.equal(m.available, 4);
  assert.equal(m.variantCount, 2);
});

test("formatPriceText matches today's output", () => {
  assert.equal(formatPriceText(12345), "12,345");
  assert.equal(formatPriceText("12345"), "12345");
  assert.equal(formatPriceText(null), "0");
  assert.equal(formatPriceText(Number.NaN), "0");
});

// ── config resolution ───────────────────────────────────────────────────────

test("only a 'published' API answer is used; anything else renders the default card", () => {
  const custom = cfg();
  custom.card.radius = 16;
  assert.deepEqual(selectPublishedProductCardConfig({ source: "default", config: custom }, cfg()).config, cfg());
  assert.deepEqual(selectPublishedProductCardConfig({ source: "fallback", config: custom }, cfg()).config, cfg());
  for (const junk of [undefined, null, "x", []]) assert.deepEqual(selectPublishedProductCardConfig(junk, cfg()).config, cfg());
  assert.equal(selectPublishedProductCardConfig({ source: "published", config: custom }, cfg()).config.card.radius, 16);
  const bad = selectPublishedProductCardConfig({ source: "published", config: { ...custom, schemaVersion: 2 } }, cfg());
  assert.deepEqual(bad.config, cfg());
  assert.equal(bad.usedFallback, true);
  assert.deepEqual(resolveProductCardConfig(undefined, cfg()), { config: cfg(), usedFallback: false });
});

// ── CSS variable mapping ────────────────────────────────────────────────────

test("default design maps to today's card sizes (tablet/desktop) and the compact mobile values", () => {
  const v = cardStyleVars(cfg());
  assert.equal(v["--fmc-img-h-t"], "176px"); // h-44
  assert.equal(v["--fmc-img-h-d"], "176px");
  assert.equal(v["--fmc-img-h-m"], "150px"); // approved mobile change
  assert.equal(v["--fmc-gap-t"], "24px"); // gap-6
  assert.equal(v["--fmc-gap-m"], "6px"); // approved mobile change
  assert.equal(v["--fmc-padx-d"], "16px"); // px-4
  assert.equal(v["--fmc-padx-m"], "8px"); // approved mobile change
  assert.equal(v["--fmc-pady"], "4px"); // py-1
  assert.equal(v["--fmc-title-d"], "14px"); // text-sm
  assert.equal(v["--fmc-title-weight"], "600"); // rendered semibold today (globals.css h1–h6)
  assert.equal(v["--fmc-title-lines"], undefined, "titles are always one line (no line clamp variable)");
  assert.equal(v["--fmc-price-d"], "20px"); // text-xl
  assert.equal(v["--fmc-price-weight"], "700");
  assert.equal(v["--fmc-orig-d"], "14px"); // text-sm
  assert.equal(v["--fmc-radius"], "10px"); // rounded-lg (--radius 0.625rem)
  assert.equal(v["--fmc-badge-radius"], "8px"); // rounded-md
  assert.equal(v["--fmc-shadow"], SHADOWS.sm);
  assert.equal(v["--fmc-hover-shadow"], SHADOWS.lg);
  assert.equal("--fmc-img-ratio" in v, false, "fixed-height images by default");
  const colors = cardColorOverrides(cfg());
  for (const part of Object.values(colors)) assert.deepEqual(part, {}, "default colors = the built-in Tailwind classes");
});

test("configured values map to bounded CSS values only", () => {
  const c = cfg();
  c.image.sizing = "4:5";
  c.card.borderColor = "#e5e7eb";
  c.price.color = "#b91c1c";
  const v = cardStyleVars(c);
  assert.equal(v["--fmc-img-ratio"], "4 / 5");
  const colors = cardColorOverrides(c);
  assert.deepEqual(colors.card, { borderColor: "#e5e7eb" });
  assert.deepEqual(colors.price, { color: "#b91c1c" });
  for (const value of Object.values(v)) assert.match(value, /^(\d+px|\d+|\d+ \/ \d+|none|[0-9a-z ().,/-]+)$/);
});

// ── contract with the backend ───────────────────────────────────────────────

const backendRoot = resolve(here, "../../multivendorbackend/src");
const hasBackend = existsSync(resolve(backendRoot, "constants/product-card.defaults.ts"));

test("frontend and backend agree on the product card contract", { skip: !hasBackend && "backend repo not found next to the frontend" }, async () => {
  const { getDefaultProductCardConfig: backendDefaults } = await import(pathToFileURL(resolve(backendRoot, "constants/product-card.defaults.ts")).href);
  const { validateProductCardConfig } = await import(pathToFileURL(resolve(backendRoot, "validators/product-card.validator.ts")).href);

  assert.deepEqual(cfg(), backendDefaults(), "defaults must be identical");
  assert.ok(validateProductCardConfig(cfg()).ok);
  assert.ok(productCardConfigSchema.safeParse(backendDefaults()).success);

  const custom = cfg();
  custom.preset = "compactMarketplace";
  custom.image = { sizing: "1:1", height: { mobile: 120, tablet: 160, desktop: 180 }, fit: "cover", padding: 4, background: "#F9FAFB" };
  custom.title.lines = 1;
  const backend = validateProductCardConfig(custom);
  assert.ok(backend.ok);
  assert.deepEqual(productCardConfigSchema.parse(custom), backend.config, "both sides normalize identically");

  const withCart = cfg();
  withCart.show.addToCart = true;
  withCart.addToCart.label = "Buy now";
  assert.equal(validateProductCardConfig(withCart).ok, true, "backend accepts the opt-in Add to Cart");
  assert.equal(productCardConfigSchema.safeParse(withCart).success, true, "frontend accepts it too");
});
