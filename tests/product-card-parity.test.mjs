// tests/product-card-parity.test.mjs
//
// Frontend ↔ backend parity for the GLOBAL product card schema. The backend
// (multivendorbackend/src/validators/product-card.validator.ts) is the
// authority; the frontend copy (src/lib/product-card/config.ts) must accept
// and reject exactly the same configs, and both defaults must be identical.
// Deterministic (a fixed, generated list of mutations), no dependencies.
// Skipped only when the backend repo is not next to the frontend.
//   node --test tests/product-card-parity.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { productCardConfigSchema } from "../src/lib/product-card/config.ts";
import { getDefaultProductCardConfig as frontendDefaults } from "../src/lib/product-card/defaults.ts";

const backendRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../multivendorbackend/src");
const hasBackend = existsSync(resolve(backendRoot, "validators/product-card.validator.ts"));
const skip = !hasBackend && "backend repo not found next to the frontend";

async function loadBackend() {
  const { validateProductCardConfig } = await import(pathToFileURL(resolve(backendRoot, "validators/product-card.validator.ts")).href);
  const { getDefaultProductCardConfig } = await import(pathToFileURL(resolve(backendRoot, "constants/product-card.defaults.ts")).href);
  return { validateProductCardConfig, backendDefaults: getDefaultProductCardConfig };
}

const DELETE = Symbol("delete");
const set = (path, value) => (c) => {
  const keys = path.split(".");
  let o = c;
  for (const k of keys.slice(0, -1)) o = o[k];
  if (value === DELETE) delete o[keys.at(-1)];
  else o[keys.at(-1)] = value;
};

/** Every case: [name, mutation, expected validity]. */
function buildCases() {
  const cases = [];
  const ints = {
    "card.borderWidth": [0, 2],
    "card.radius": [0, 24],
    "card.contentPaddingY": [0, 16],
    "image.padding": [0, 24],
    "title.lines": [1, 3],
    "discountBadge.radius": [0, 12],
    "addToCart.radius": [0, 16],
  };
  for (const [p, [lo, hi]] of Object.entries(ints)) {
    cases.push(
      [`${p}=${lo}`, set(p, lo), true],
      [`${p}=${hi}`, set(p, hi), true],
      [`${p}=${lo - 1}`, set(p, lo - 1), false],
      [`${p}=${hi + 1}`, set(p, hi + 1), false],
      [`${p}=1.5`, set(p, 1.5), false],
      [`${p}="1"`, set(p, "1"), false],
      [`${p} missing`, set(p, DELETE), false],
    );
  }
  const responsive = {
    "card.imageGap": [0, 24],
    "card.contentPaddingX": [0, 24],
    "image.height": [80, 320],
    "title.size": [10, 20],
    "price.size": [10, 28],
    "price.originalSize": [9, 20],
  };
  for (const [p, [lo, hi]] of Object.entries(responsive)) {
    for (const bp of ["mobile", "tablet", "desktop"]) {
      cases.push(
        [`${p}.${bp}=${lo}`, set(`${p}.${bp}`, lo), true],
        [`${p}.${bp}=${hi}`, set(`${p}.${bp}`, hi), true],
        [`${p}.${bp}=${lo - 1}`, set(`${p}.${bp}`, lo - 1), false],
        [`${p}.${bp}=${hi + 1}`, set(`${p}.${bp}`, hi + 1), false],
      );
    }
    cases.push([`${p}.wide (extra key)`, set(`${p}.wide`, lo), false]);
  }
  const enums = {
    preset: [["finixmartDefault", "compactMarketplace", "cleanMinimal", "imageFocused", "premiumStorefront"], ["neon", ""]],
    "card.shadow": [["none", "sm", "md", "lg"], ["xl"]],
    "card.hoverShadow": [["none", "sm", "md", "lg"], ["2xl"]],
    "card.align": [["left", "center"], ["right"]],
    "image.sizing": [["fixed", "1:1", "4:5", "3:4", "4:3"], ["16:9"]],
    "image.fit": [["contain", "cover"], ["fill"]],
    "title.weight": [["normal", "medium", "semibold", "bold"], ["black"]],
    "price.weight": [["normal", "medium", "semibold", "bold"], ["light"]],
    "discountBadge.position": [["besidePrice", "imageTopLeft", "imageTopRight"], ["bottom"]],
    "addToCart.variant": [["filled", "outline"], ["ghost"]],
    "addToCart.size": [["sm", "md"], ["lg"]],
  };
  for (const [p, [valid, invalid]] of Object.entries(enums)) {
    for (const v of valid) cases.push([`${p}=${v}`, set(p, v), true]);
    for (const v of invalid) cases.push([`${p}=${v}`, set(p, v), false]);
  }
  const colors = [
    "card.background", "card.borderColor", "image.background", "title.color", "price.color",
    "price.originalColor", "discountBadge.background", "discountBadge.text", "addToCart.background", "addToCart.text",
  ];
  for (const p of colors) {
    cases.push(
      [`${p}=#ABCDEF`, set(p, "#ABCDEF"), true],
      [`${p}=null`, set(p, null), true],
      [`${p} omitted`, set(p, DELETE), true],
      [`${p}=#abc`, set(p, "#abc"), false],
      [`${p}=red`, set(p, "red"), false],
      [`${p}=#12345g`, set(p, "#12345g"), false],
      [`${p}=css injection`, set(p, "#ffffff;position:fixed"), false],
    );
  }
  const shows = ["image", "title", "price", "originalPrice", "discountBadge", "rating", "reviewCount", "storeName", "verifiedBadge", "freeShippingBadge", "stockLabel"];
  for (const k of shows) {
    cases.push(
      [`show.${k}=true`, set(`show.${k}`, true), true],
      [`show.${k}=false`, set(`show.${k}`, false), true],
      [`show.${k} missing`, set(`show.${k}`, DELETE), false],
      [`show.${k}="yes"`, set(`show.${k}`, "yes"), false],
    );
  }
  // Forbidden / unavailable options.
  cases.push(
    ["show.addToCart=false", set("show.addToCart", false), true],
    ["show.addToCart=true (opt-in button)", set("show.addToCart", true), true],
    ["show.wishlist", set("show.wishlist", true), false],
    ["show.quickView", set("show.quickView", true), false],
    ["root className", set("className", "fixed inset-0"), false],
    ["root customCss", set("customCss", "body{}"), false],
    ["card.className", set("card.className", "x"), false],
    ["schemaVersion=2", set("schemaVersion", 2), false],
    ["schemaVersion='1'", set("schemaVersion", "1"), false],
    ["missing card block", set("card", DELETE), false],
    ["missing show block", set("show", DELETE), false],
  );
  // Add to Cart label (optional, bounded plain text).
  for (const [v, ok] of [
    ["Add to Cart", true], ["কার্টে যোগ করুন", true], ["Buy now!", true], ["Add & go", true], ["  Trim me  ", true],
    ["x".repeat(24), true], ["x".repeat(25), false], ["", false], ["   ", false], ["<b>x</b>", false],
    ['Say "hi"', false], ["a/b", false], ["a;b", false], ["{x}", false], [42, false], [null, false],
  ]) cases.push([`addToCart.label=${JSON.stringify(v)}`, set("addToCart.label", v), ok]);
  cases.push(["addToCart.label omitted", set("addToCart.label", DELETE), true]);
  // Grid (optional block).
  const grid = () => ({ columns: { mobile: 2, tablet: 4, desktop: 5 }, gapX: { mobile: 4, tablet: 8, desktop: 8 }, gapY: { mobile: 4, tablet: 8, desktop: 8 } });
  cases.push(["grid omitted", set("grid", DELETE), true], ["grid valid", set("grid", grid()), true], ["grid=null", set("grid", null), false]);
  for (const [bp, lo, hi] of [["mobile", 1, 2], ["tablet", 2, 4], ["desktop", 3, 6]]) {
    for (let v = lo - 1; v <= hi + 1; v++) {
      cases.push([`grid.columns.${bp}=${v}`, (c) => { c.grid = grid(); c.grid.columns[bp] = v; }, v >= lo && v <= hi]);
    }
    cases.push([`grid.columns.${bp}=2.5`, (c) => { c.grid = grid(); c.grid.columns[bp] = 2.5; }, false]);
  }
  for (const k of ["gapX", "gapY"]) {
    for (const bp of ["mobile", "tablet", "desktop"]) {
      for (const [v, ok] of [[0, true], [24, true], [-1, false], [25, false], ["8", false]]) {
        cases.push([`grid.${k}.${bp}=${v}`, (c) => { c.grid = grid(); c.grid[k][bp] = v; }, ok]);
      }
    }
    cases.push([`grid.${k} missing`, (c) => { c.grid = grid(); delete c.grid[k]; }, false]);
  }
  cases.push(["grid extra key", (c) => { c.grid = grid(); c.grid.className = "grid-cols-12"; }, false]);
  cases.push(["grid.columns extra key", (c) => { c.grid = grid(); c.grid.columns.wide = 8; }, false]);
  return cases;
}

test("defaults are identical and valid on both sides", { skip }, async () => {
  const { validateProductCardConfig, backendDefaults } = await loadBackend();
  assert.deepEqual(frontendDefaults(), backendDefaults());
  assert.ok(validateProductCardConfig(frontendDefaults()).ok);
  assert.ok(productCardConfigSchema.safeParse(backendDefaults()).success);
});

test("frontend and backend accept and reject exactly the same configs", { skip }, async () => {
  const { validateProductCardConfig } = await loadBackend();
  const cases = buildCases();
  assert.ok(cases.length > 250, `expected a broad case list, got ${cases.length}`);
  const mismatches = [];
  for (const [name, mutate, expected] of cases) {
    const config = structuredClone(frontendDefaults());
    mutate(config);
    const backend = validateProductCardConfig(config).ok;
    const frontend = productCardConfigSchema.safeParse(config).success;
    if (backend !== expected || frontend !== expected) mismatches.push({ name, expected, backend, frontend });
  }
  assert.deepEqual(mismatches, [], `validator disagreements:\n${JSON.stringify(mismatches, null, 2)}`);
});

test("valid configs normalize identically on both sides", { skip }, async () => {
  const { validateProductCardConfig } = await loadBackend();
  const config = structuredClone(frontendDefaults());
  config.card.borderColor = "#E5E7EB";
  config.price.color = "#B91C1C";
  config.image.sizing = "4:5";
  const backend = validateProductCardConfig(config);
  assert.ok(backend.ok);
  assert.deepEqual(productCardConfigSchema.parse(config), backend.config);
  assert.equal(backend.config.price.color, "#b91c1c", "colors are lowercased");
});
