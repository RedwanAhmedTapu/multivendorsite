// tests/homepage-config.test.mjs
//
// Phase A: homepage config resolution, section registry order, visibility,
// grid defaults, revalidation authorization — and a contract check against
// the backend's own defaults/validator. Pure logic, no extra dependencies:
//   node --test tests/
// (Node 22 strips TypeScript types natively, so the .ts modules load as-is.)

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";

import {
  getDefaultHomepageConfig,
  getRenderableSections,
  homepageConfigSchema,
  normalizeLayoutId,
  resolveHomepageConfig,
  selectPublishedConfig,
  visibilityClass,
} from "../src/lib/homepage-config/core.ts";
import { CURRENT_GRID_COLUMNS, isCurrentGridColumns } from "../src/lib/homepage-config/grid.ts";
import { HOMEPAGE_CACHE_TAGS, tagsForScope, verifyAdminToken } from "../src/lib/homepage-config/revalidate.ts";

const here = dirname(fileURLToPath(import.meta.url));
const cfg = () => getDefaultHomepageConfig();
const sig = (config, layout) =>
  getRenderableSections(config, layout).map(({ section, wrapperClass }) =>
    section.type === "productCollection"
      ? `products:${section.settings.source}:${section.settings.limit}`
      : `${section.type}${wrapperClass ? `[${wrapperClass}]` : ""}`,
  );

// ── default output == the original hardcoded LayoutProvider ─────────────────

// The original ProductGrid rendered Flash Sale, Featured Products, New Arrivals
// (12 each); trending/discounted were fetched but commented out.
const ORIGINAL_PRODUCTS = ["products:flashSale:12", "products:featured:12", "products:newArrivals:12"];

test("defaults render the same components in the same order as the original three layouts", () => {
  assert.deepEqual(sig(cfg(), "layout_1"), ["hero", "benefits", "categoryCircles", ...ORIGINAL_PRODUCTS, "footer"]);
  assert.deepEqual(sig(cfg(), "layout_2"), ["horizontalCategoryNav", "hero", "benefits", "categoryCircles", ...ORIGINAL_PRODUCTS, "footer"]);
  // CategoryLayout3 hides itself below md; the wrapper uses display:contents so
  // tablet/desktop layout is unchanged.
  assert.deepEqual(sig(cfg(), "layout_3"), ["categoryGrid[hidden md:contents]", "benefits", "categoryCircles", ...ORIGINAL_PRODUCTS, "footer"]);
});

test("default product sections keep today's titles, limit 12, 2/5/6 columns and See All", () => {
  const titles = getRenderableSections(cfg(), "layout_1")
    .filter((r) => r.section.type === "productCollection")
    .map((r) => r.section.settings);
  assert.deepEqual(titles.map((s) => s.title), ["Flash Sale", "Featured Products", "New Arrivals"]);
  for (const s of titles) {
    assert.equal(s.limit, 12);
    assert.ok(isCurrentGridColumns(s.columns));
    assert.equal(s.showSeeAll, true);
    assert.equal(s.subtitle, undefined);
  }
  assert.deepEqual({ ...CURRENT_GRID_COLUMNS }, { mobile: 2, tablet: 5, desktop: 6 });
});

// ── safe resolution ─────────────────────────────────────────────────────────

test("missing config resolves to defaults without reporting a fallback", () => {
  for (const raw of [undefined, null]) {
    const r = resolveHomepageConfig(raw);
    assert.deepEqual(r.config, cfg());
    assert.deepEqual(r.fallbackParts, []);
  }
});

test("garbage or unsupported schema versions fall back to defaults entirely", () => {
  for (const raw of ["x", 42, [], { schemaVersion: 2, layouts: {} }, { layouts: {} }]) {
    const r = resolveHomepageConfig(raw);
    assert.deepEqual(r.config, cfg());
    assert.deepEqual(r.fallbackParts, ["all"]);
  }
});

test("one invalid layout falls back on its own; valid parts are kept", () => {
  const raw = cfg();
  raw.layouts.layout_1.sections.reverse(); // valid custom order
  raw.layouts.layout_2.sections.push({ id: "x", type: "customHtml", enabled: true, visibility: { mobile: true, tablet: true, desktop: true } });
  raw.theme = { preset: "finixmartDefault", colors: { primary: "teal" } };
  const r = resolveHomepageConfig(raw);
  assert.deepEqual(r.fallbackParts.sort(), ["layout_2", "theme"]);
  assert.equal(r.config.layouts.layout_1.sections[0].type, "footer", "valid custom order kept");
  assert.deepEqual(r.config.layouts.layout_2, cfg().layouts.layout_2, "invalid layout replaced by its default");
  assert.deepEqual(r.config.theme, { preset: "finixmartDefault" });
  assert.equal("productCard" in r.config, false, "card design is not part of the homepage config");
});

test("unsafe values never survive resolution (markup, raw colors, class names, unknown keys)", () => {
  const cases = [
    ["<img src=x onerror=alert(1)>", (c, v) => (c.layouts.layout_1.sections[3].settings.title = v)],
    ["red; background:url(x)", (c, v) => (c.theme.colors = { primary: v })],
    ["fixed inset-0", (c, v) => (c.layouts.layout_1.sections[0].className = v)],
    ["body{display:none}", (c, v) => (c.customCss = v)], // unknown root key: dropped, rest kept
    [1000, (c, v) => (c.layouts.layout_1.sections[3].settings.limit = v)],
  ];
  for (const [value, mutate] of cases) {
    const raw = cfg();
    mutate(raw, value);
    const r = resolveHomepageConfig(raw);
    assert.ok(homepageConfigSchema.safeParse(r.config).success, "resolved config is always valid");
    assert.ok(!JSON.stringify(r.config).includes(JSON.stringify(value)), `unsafe value ${JSON.stringify(value)} must not survive`);
  }
});

test("only a 'published' API answer is used; 'default' / 'fallback' / garbage render the frontend defaults", () => {
  const custom = cfg();
  custom.layouts.layout_1.sections.reverse();
  // A backend on an older version might return different defaults — ignored.
  const olderBackendDefaults = cfg();
  olderBackendDefaults.layouts.layout_1.sections.pop(); // e.g. no footer section
  assert.deepEqual(selectPublishedConfig({ source: "default", config: olderBackendDefaults }).config, cfg());
  assert.deepEqual(selectPublishedConfig({ source: "fallback", config: olderBackendDefaults }).config, cfg());
  for (const junk of [undefined, null, "x", [], {}]) assert.deepEqual(selectPublishedConfig(junk).config, cfg());
  const published = selectPublishedConfig({ source: "published", config: custom });
  assert.equal(published.config.layouts.layout_1.sections[0].type, "footer", "published config is used as-is");
  assert.deepEqual(published.fallbackParts, []);
});

// ── order / enable / visibility ─────────────────────────────────────────────

test("section order follows the config; disabled and fully hidden sections are not rendered", () => {
  const c = cfg();
  const s = c.layouts.layout_1.sections;
  [s[0], s[1]] = [s[1], s[0]]; // benefits before hero
  s.find((x) => x.id === "products-featured").enabled = false;
  s.find((x) => x.id === "products-trending").enabled = true;
  s.find((x) => x.id === "footer").visibility = { mobile: false, tablet: false, desktop: false };
  assert.deepEqual(sig(c, "layout_1"), [
    "benefits",
    "hero",
    "categoryCircles",
    "products:flashSale:12",
    "products:newArrivals:12",
    "products:trending:12",
  ]);
});

test("visibility maps to a fixed set of breakpoint classes (md=768, lg=1024)", () => {
  const v = (m, t, d) => visibilityClass({ mobile: m, tablet: t, desktop: d });
  assert.equal(v(true, true, true), null);
  assert.equal(v(false, false, false), "never");
  assert.equal(v(true, false, false), "contents md:hidden");
  assert.equal(v(false, true, false), "hidden md:contents lg:hidden");
  assert.equal(v(false, false, true), "hidden lg:contents");
  assert.equal(v(true, true, false), "contents lg:hidden");
  assert.equal(v(true, false, true), "contents md:hidden lg:contents");
  assert.equal(v(false, true, true), "hidden md:contents");
});

test("unknown layout ids fall back to layout_1", () => {
  assert.equal(normalizeLayoutId("layout_2"), "layout_2");
  for (const bad of ["layout_4", "", null, undefined, 3]) assert.equal(normalizeLayoutId(bad), "layout_1");
});

// ── revalidation route logic ────────────────────────────────────────────────

test("revalidation scopes map only to the homepage cache tags", () => {
  assert.deepEqual(tagsForScope("config"), [HOMEPAGE_CACHE_TAGS.config]);
  assert.deepEqual(tagsForScope("layout"), [HOMEPAGE_CACHE_TAGS.layout]);
  assert.deepEqual(tagsForScope("card"), [HOMEPAGE_CACHE_TAGS.card]);
  assert.deepEqual(tagsForScope("all"), ["homepage-config", "homepage-layout", "product-card-config"]);
  for (const bad of [undefined, "products", "*", ["config"], { scope: "all" }]) assert.equal(tagsForScope(bad), null);
});

test("revalidation requires the backend to accept the caller as ADMIN", async () => {
  const calls = [];
  const fakeFetch = (status) => async (url, init) => {
    calls.push({ url, init });
    if (status === "throw") throw new Error("down");
    return { status, ok: status >= 200 && status < 300 };
  };
  const api = "http://api.test/api";

  assert.deepEqual(await verifyAdminToken(null, api, fakeFetch(200)), { ok: false, status: 401, error: "Missing bearer token" });
  assert.deepEqual(await verifyAdminToken("Basic abc", api, fakeFetch(200)), { ok: false, status: 401, error: "Missing bearer token" });
  assert.equal(calls.length, 0, "no backend call without a bearer token");

  assert.deepEqual(await verifyAdminToken("Bearer good", api, fakeFetch(200)), { ok: true });
  assert.equal(calls[0].url, "http://api.test/api/themes/homepage-config/draft", "ADMIN-only, read-only endpoint");
  assert.equal(calls[0].init.headers.Authorization, "Bearer good");
  assert.equal(calls[0].init.cache, "no-store");

  assert.equal((await verifyAdminToken("Bearer x", api, fakeFetch(401))).status, 401);
  assert.equal((await verifyAdminToken("Bearer vendor", api, fakeFetch(403))).status, 403);
  assert.equal((await verifyAdminToken("Bearer x", api, fakeFetch(500))).status, 502);
  assert.equal((await verifyAdminToken("Bearer x", api, fakeFetch("throw"))).status, 502);
});

// ── contract with the backend ───────────────────────────────────────────────

const backendRoot = resolve(here, "../../multivendorbackend/src");
const hasBackend = existsSync(resolve(backendRoot, "constants/homepage-config.defaults.ts"));

test("frontend and backend agree on defaults and accept each other's configs", { skip: !hasBackend && "backend repo not found next to the frontend" }, async () => {
  const { getDefaultHomepageConfig: backendDefaults } = await import(pathToFileURL(resolve(backendRoot, "constants/homepage-config.defaults.ts")).href);
  const { validateHomepageConfig } = await import(pathToFileURL(resolve(backendRoot, "validators/homepage-config.validator.ts")).href);

  assert.deepEqual(cfg(), backendDefaults(), "defaults must be identical");
  assert.ok(validateHomepageConfig(cfg()).ok, "backend accepts frontend defaults");
  assert.ok(homepageConfigSchema.safeParse(backendDefaults()).success, "frontend accepts backend defaults");

  // A customized config accepted by one side is accepted by the other.
  const custom = cfg();
  custom.layouts.layout_2.sections[0].appearance = { spacing: { mobile: "sm", tablet: null, desktop: "lg" }, background: "#F0FDFA" };
  custom.theme = { preset: "finixmartDefault", colors: { primary: "#0F766E" } };
  const backend = validateHomepageConfig(custom);
  assert.ok(backend.ok);
  assert.deepEqual(homepageConfigSchema.parse(custom), backend.config, "both sides normalize identically");
});
