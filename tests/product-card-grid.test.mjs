// tests/product-card-grid.test.mjs
//
// Listing grid for /category/[slug] and /products (lib/product-card/grid.ts,
// components/product/card/ProductListingGrid.tsx, listing-grid.module.css):
// the built-in grid is kept byte-for-byte when no grid is configured; a
// configured grid becomes validated CSS variables (never class names); the
// 130px minimum card width drops tablet/desktop columns; the admin preview
// pins one breakpoint and reports the rendered column count.
//   node --test tests/product-card-grid.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { register } from "node:module";

register("./support/tsx-loader.mjs", import.meta.url);

const grid = await import("../src/lib/product-card/grid.ts");
const { createElement } = await import("react");
const { renderToStaticMarkup } = await import("react-dom/server");
const { ProductListingGrid, gridImageSizes } = await import("../src/components/product/card/ProductListingGrid.tsx");
const { getDefaultProductCardConfig } = await import("../src/lib/product-card/defaults.ts");
const { productCardConfigSchema } = await import("../src/lib/product-card/config.ts");

const read = (rel) => readFileSync(new URL(rel, import.meta.url), "utf8");
const g = (over = {}) => ({ ...grid.defaultListingGrid(), ...over });

test("default layout: no grid block → exactly today's classes and image sizes on both pages", () => {
  assert.equal("grid" in getDefaultProductCardConfig(), false, "the default config has no grid block");
  assert.equal(grid.BUILT_IN_GRID_CLASS, "grid gap-1 sm:gap-2 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6");
  const html = renderToStaticMarkup(createElement(ProductListingGrid, { grid: undefined }, createElement("i")));
  assert.equal(html, `<div class="${grid.BUILT_IN_GRID_CLASS}"><i></i></div>`, "plain built-in grid, no style / data attributes");
  assert.equal(renderToStaticMarkup(createElement(ProductListingGrid, { grid: null }, null)), `<div class="${grid.BUILT_IN_GRID_CLASS}"></div>`);
  assert.equal(gridImageSizes(undefined), "(max-width: 639px) 50vw, (max-width: 767px) 33vw, (max-width: 1023px) 25vw, (max-width: 1535px) 20vw, 17vw");

  for (const page of ["../src/app/category/[slug]/page.tsx", "../src/app/products/page.tsx"]) {
    const src = read(page);
    assert.match(src, /<ProductListingGrid grid=\{listingGrid\}>/, `${page} renders the shared listing grid`);
    assert.match(src, /imageSizes=\{gridImageSizes\(listingGrid\)\}/);
    assert.match(src, /const listingGrid = cardConfig\.grid \?\? null;/);
    assert.match(src, /getPublishedProductCardConfig\(\)/, "published config only (never the draft)");
    assert.doesNotMatch(src, /grid-cols-\$\{|`grid-cols/, "no dynamic Tailwind class names");
  }
});

test("configured grid → CSS variables only (validated numbers), on the module class", () => {
  const cfg = g({ columns: { mobile: 1, tablet: 3, desktop: 6 }, gapX: { mobile: 0, tablet: 12, desktop: 24 }, gapY: { mobile: 2, tablet: 6, desktop: 16 } });
  assert.ok(productCardConfigSchema.safeParse({ ...getDefaultProductCardConfig(), grid: cfg }).success);
  const html = renderToStaticMarkup(createElement(ProductListingGrid, { grid: cfg }, null));
  assert.match(html, /^<div class="grid" style="/, "module class (the test loader maps it to its own name)");
  assert.match(html, /data-fm-grid=""/);
  for (const v of ["--fmg-cols-m:1", "--fmg-cols-t:3", "--fmg-cols-d:6", "--fmg-gx-m:0px", "--fmg-gx-t:12px", "--fmg-gx-d:24px", "--fmg-gy-m:2px", "--fmg-gy-t:6px", "--fmg-gy-d:16px", "--fmg-min:130px"]) {
    assert.ok(html.includes(v), v);
  }
  assert.doesNotMatch(html, /grid-cols-/, "no Tailwind column classes when configured");
  assert.equal(gridImageSizes(cfg), "(max-width: 767px) 100vw, (max-width: 1023px) 34vw, 17vw");
});

test("the CSS applies columns per breakpoint: exact on mobile, at most N (min 130px) on tablet/desktop", () => {
  const css = read("../src/components/product/card/listing-grid.module.css");
  assert.match(css, /grid-template-columns: repeat\(var\(--fmg-cols-m\), minmax\(0, 1fr\)\);/, "mobile: exact count");
  assert.match(css, /@media \(min-width: 768px\)[\s\S]*repeat\(\s*auto-fill,\s*minmax\(max\(var\(--fmg-min\), calc\(\(100% - \(var\(--fmg-cols-t\) - 1\) \* var\(--fmg-gx-t\)\) \/ var\(--fmg-cols-t\) - 0\.5px\)\), 1fr\)/);
  assert.match(css, /@media \(min-width: 1024px\)[\s\S]*var\(--fmg-cols-d\)[\s\S]*var\(--fmg-gx-d\)/);
  for (const v of ["--fmg-gx-m", "--fmg-gy-m", "--fmg-gx-t", "--fmg-gy-t", "--fmg-gx-d", "--fmg-gy-d"]) assert.ok(css.includes(`var(${v})`), `${v} used`);
});

test("rendered column count: the largest count ≤ the maximum whose cards stay ≥ 130px (mobile exact)", () => {
  const r = grid.renderedColumns;
  // Listing grid widths measured on /category/laptops: 478 (768px screen), 582 (1024), 935 (1440).
  assert.equal(r(4, 478, 8, "tablet"), 3, "4 × 113px would be too narrow → 3");
  assert.equal(r(3, 478, 8, "tablet"), 3);
  assert.equal(r(2, 478, 8, "tablet"), 2);
  assert.equal(r(4, 616, 8, "tablet"), 4, "a 1023px screen has room for 4");
  assert.equal(r(6, 582, 8, "desktop"), 4, "6 at a 1024px screen → 4 (138px each)");
  assert.equal(r(5, 935, 8, "desktop"), 5);
  assert.equal(r(6, 935, 8, "desktop"), 6, "6 × 149px fits at 1440px");
  assert.equal(r(6, 935, 24, "desktop"), 6);
  assert.equal(r(6, 800, 24, "desktop"), 5, "gaps count");
  assert.equal(r(2, 375, 24, "mobile"), 2, "mobile is never reduced");
  assert.equal(r(2, 200, 24, "mobile"), 2);
  assert.equal(r(4, 100, 8, "tablet"), 1, "never below 1");
  // Boundary: exactly 130px fits.
  assert.equal(r(3, 3 * 130 + 2 * 10, 10, "desktop"), 3);
  assert.equal(r(3, 3 * 130 + 2 * 10 - 1, 10, "desktop"), 2);

  const range = grid.renderedColumnRange(g({ columns: { mobile: 2, tablet: 4, desktop: 6 } }), "desktop");
  assert.deepEqual(range, { min: 4, max: 6 });
  assert.deepEqual(grid.renderedColumnRange(g({ columns: { mobile: 2, tablet: 4, desktop: 5 } }), "tablet"), { min: 3, max: 4 });
});

test("preview pins one breakpoint's columns and gaps; mobile preview has no minimum width", () => {
  const cfg = g({ columns: { mobile: 1, tablet: 3, desktop: 6 }, gapX: { mobile: 2, tablet: 10, desktop: 20 }, gapY: { mobile: 3, tablet: 11, desktop: 21 } });
  const d = grid.previewGridFor(cfg, "desktop");
  assert.deepEqual(d.grid.columns, { mobile: 6, tablet: 6, desktop: 6 });
  assert.deepEqual(d.grid.gapX, { mobile: 20, tablet: 20, desktop: 20 });
  assert.deepEqual(d.grid.gapY, { mobile: 21, tablet: 21, desktop: 21 });
  assert.equal(d.minCardWidth, 130);
  const m = grid.previewGridFor(cfg, "mobile");
  assert.deepEqual(m.grid.columns, { mobile: 1, tablet: 1, desktop: 1 });
  assert.equal(m.minCardWidth, 0);
  assert.deepEqual(cfg.columns, { mobile: 1, tablet: 3, desktop: 6 }, "config untouched");
});

test("editor preview layout: selected maximum vs rendered count, built-in grid when none is configured", async () => {
  const { previewLayout } = await import("../src/components/admin/product-card-editor/PreviewPanel.tsx");
  const base = getDefaultProductCardConfig();

  const builtIn = previewLayout(base, "tablet");
  assert.equal(builtIn.custom, false);
  assert.equal(builtIn.rendered, 4, "built-in tablet grid = 4 per row (as measured live)");
  assert.equal(builtIn.minCardWidth, 0, "the built-in grid has no minimum");
  assert.deepEqual([previewLayout(base, "mobile").rendered, previewLayout(base, "desktop").rendered], [2, 5]);

  const custom = { ...base, grid: g({ columns: { mobile: 1, tablet: 4, desktop: 6 } }) };
  const t = previewLayout(custom, "tablet");
  assert.deepEqual([t.selected, t.rendered, t.width], [4, 3, 478], "tablet: up to 4 selected, 3 rendered at 478px");
  const dsk = previewLayout(custom, "desktop");
  assert.deepEqual([dsk.selected, dsk.rendered, dsk.width], [6, 6, 935]);
  assert.deepEqual(dsk.range, { min: 4, max: 6 });
  assert.equal(previewLayout(custom, "mobile").rendered, 1);
  assert.ok(dsk.cardCount >= 12, "two full rows of sample cards");
});
