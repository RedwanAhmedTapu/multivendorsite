// tests/pricing.test.mjs
//
// PHASE 1 (C1): the storefront mirror of the approved selling-price rule
// (src/lib/pricing/effective-price.ts): specialPrice applies ONLY when
// 0 < specialPrice < regular price. The cases are identical to the backend's
// tests/pricing-effective.test.ts (multivendorbackend), so storefront display and
// server charge follow the same rule. Also checks the shop card shows that price.
//   node --test tests/pricing.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";

register("./support/tsx-loader.mjs", import.meta.url);

const { effectivePrice } = await import("../src/lib/pricing/effective-price.ts");
const { toProductCardModel } = await import("../src/lib/product-card/model.ts");

// [label, regular, special, expected price, discounted] — keep identical to the backend list.
const CASES = [
  ["valid discount", 1200, 960, 960, true],
  ["null special", 1200, null, 1200, false],
  ["undefined special", 1200, undefined, 1200, false],
  ["zero special", 1200, 0, 1200, false],
  ["negative special", 1200, -5, 1200, false],
  ["equal special", 1200, 1200, 1200, false],
  ["greater special", 1200, 1500, 1200, false],
  ["non-numeric special", 1200, "abc", 1200, false],
  ["empty-string special", 1200, "", 1200, false],
  ["string amounts (Decimal-as-string)", "2500.0000", "2000.5000", 2000.5, true],
];

test("effectivePrice follows the approved rule for every case", () => {
  for (const [label, regular, special, price, discounted] of CASES) {
    const r = effectivePrice(regular, special);
    assert.equal(r.price, price, `${label}: price`);
    assert.equal(r.discounted, discounted, `${label}: discounted`);
    assert.equal(r.originalPrice, discounted ? Number(regular) : null, `${label}: originalPrice`);
  }
});

test("shop card main price = effective price for every case (no invalid special price is ever shown)", () => {
  for (const [label, regular, special, price, discounted] of CASES) {
    const m = toProductCardModel({ id: "p", variants: [{ id: "v", stock: 1, price: regular, specialPrice: special }] });
    assert.equal(m.price, price, `${label}: card price`);
    assert.equal(m.originalPrice, discounted ? Number(regular) : null, `${label}: struck-through original`);
  }
});
