// tests/theme-home-palette.test.mjs
//
// Homepage dynamic palette integration (audit: AI_CONTEXT/
// THEME_MANAGEMENT_HOMEPAGE_AUDIT.md). Covers:
//   * payload resolution: published honored; default/fallback/malformed/
//     invalid → Neutral; drafts never leak; dark degrades independently
//   * CSS builder: deterministic, Neutral → empty, dark rule, chrome vars
//   * fetcher: HTTP error / network throw → Neutral
//   * source guards: no hardcoded brand colors left in homepage-exclusive
//     components; shared chrome uses --fm-* fallbacks only (dashboard
//     isolation); every consumed --fm-* var is emitted by the injection
//
// Pure logic, no dependencies beyond node:test:
//   node --test tests/theme-home-palette.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  FM_CHROME_VARS,
  buildHomepagePaletteCss,
  getActivePaletteServer,
  neutralHomepagePalette,
  resolveActivePalettePayload,
} from "../src/lib/palette/active.ts";
import { NEUTRAL_PRESET, EMERALD_PRESET } from "../src/lib/palette/presets.ts";
import { resolvePaletteTokens } from "../src/lib/palette/tokens.ts";

// ── helpers ─────────────────────────────────────────────────────────────────

const emeraldLight = resolvePaletteTokens(EMERALD_PRESET.tokens);
assert.ok(emeraldLight.ok, "Emerald preset must resolve");

const publishedPayload = (overrides = {}) => ({
  success: true,
  data: {
    scope: "PLATFORM_WEBSITE",
    scopeId: "",
    name: "Emerald",
    version: 2,
    tokens: { ...EMERALD_PRESET.tokens },
    darkTokens: null,
    updatedAt: null,
    source: "published",
    ...overrides,
  },
});

const src = (path) => readFileSync(new URL(`../src/${path}`, import.meta.url), "utf8");

// ── payload resolution ──────────────────────────────────────────────────────

test("published payload with valid tokens is honored", () => {
  const r = resolveActivePalettePayload(publishedPayload());
  assert.equal(r.isNeutral, false);
  assert.equal(r.source, "published");
  assert.equal(r.name, "Emerald");
  assert.equal(r.version, 2);
  assert.equal(r.light.primary, emeraldLight.tokens.primary);
  assert.equal(r.dark, null);
});

test("source 'default' resolves to Neutral with isNeutral", () => {
  const r = resolveActivePalettePayload(publishedPayload({ source: "default" }));
  assert.equal(r.isNeutral, true);
  assert.equal(r.source, "default");
  assert.equal(r.light.primary, resolvePaletteTokens(NEUTRAL_PRESET.tokens).tokens.primary);
});

test("source 'fallback' resolves to Neutral", () => {
  const r = resolveActivePalettePayload(publishedPayload({ source: "fallback" }));
  assert.equal(r.isNeutral, true);
  assert.equal(r.source, "fallback");
});

test("malformed bodies resolve to Neutral", () => {
  for (const body of [null, undefined, {}, { success: true }, { data: null }, "garbage", 42]) {
    const r = resolveActivePalettePayload(body);
    assert.equal(r.isNeutral, true, `expected Neutral for ${JSON.stringify(body)}`);
  }
});

test("drafts can never leak: only exact source 'published' is honored", () => {
  // Any other source string — including none at all — resolves to Neutral,
  // so a draft-shaped payload can never reach the homepage.
  for (const source of [undefined, "DRAFT", "draft", "ARCHIVED", "PUBLISHED", "publish"]) {
    const r = resolveActivePalettePayload(publishedPayload({ source }));
    assert.equal(r.isNeutral, true, `source ${String(source)} must not be served`);
  }
});

test("invalid published tokens fail closed to Neutral", () => {
  // CSS-injection-shaped value
  let r = resolveActivePalettePayload(publishedPayload({ tokens: { ...EMERALD_PRESET.tokens, primary: "url(evil)" } }));
  assert.equal(r.isNeutral, true);
  // Missing required core tokens
  const partial = { ...EMERALD_PRESET.tokens };
  delete partial.primary;
  r = resolveActivePalettePayload(publishedPayload({ tokens: partial }));
  assert.equal(r.isNeutral, true);
  // Unknown token key
  r = resolveActivePalettePayload(publishedPayload({ tokens: { ...EMERALD_PRESET.tokens, bogus: "#fff" } }));
  assert.equal(r.isNeutral, true);
});

test("invalid dark tokens degrade to light-only", () => {
  const r = resolveActivePalettePayload(
    publishedPayload({ darkTokens: { primary: "url(evil)" } }),
  );
  assert.equal(r.isNeutral, false);
  assert.equal(r.dark, null);
  assert.equal(r.light.primary, emeraldLight.tokens.primary);
});

test("valid dark tokens produce a resolved dark map", () => {
  const r = resolveActivePalettePayload(publishedPayload({ darkTokens: { ...NEUTRAL_PRESET.darkTokens } }));
  assert.equal(r.isNeutral, false);
  assert.ok(r.dark, "dark map expected");
  assert.equal(typeof r.dark.background, "string");
});

// ── CSS builder ─────────────────────────────────────────────────────────────

test("Neutral palette injects nothing (globals.css :root already carries it)", () => {
  assert.equal(buildHomepagePaletteCss(neutralHomepagePalette("default")), "");
  assert.equal(buildHomepagePaletteCss(neutralHomepagePalette("fallback")), "");
});

test("published palette emits :root rule with tokens and chrome vars", () => {
  const css = buildHomepagePaletteCss(resolveActivePalettePayload(publishedPayload()));
  assert.ok(css.startsWith(":root {"), "must start with the :root rule");
  assert.ok(css.includes(`--primary: ${emeraldLight.tokens.primary};`), "token vars emitted");
  assert.ok(!css.includes(".dark"), "no dark rule without dark tokens");
  for (const [name] of FM_CHROME_VARS) {
    assert.ok(css.includes(`${name}:`), `chrome var ${name} must be emitted`);
  }
});

test("dark tokens emit a .dark rule", () => {
  const css = buildHomepagePaletteCss(
    resolveActivePalettePayload(publishedPayload({ darkTokens: { ...NEUTRAL_PRESET.darkTokens } })),
  );
  assert.ok(css.includes("\n.dark {"), "dark rule expected after the light rule");
});

test("CSS output is deterministic (byte-identical across calls)", () => {
  const palette = resolveActivePalettePayload(publishedPayload({ darkTokens: { ...NEUTRAL_PRESET.darkTokens } }));
  assert.equal(buildHomepagePaletteCss(palette), buildHomepagePaletteCss(palette));
});

test("emitted CSS contains no injection-shaped content", () => {
  const css = buildHomepagePaletteCss(resolveActivePalettePayload(publishedPayload()));
  assert.ok(!/url\s*\(|expression\s*\(|<|>|@import/i.test(css), "no structural content in emitted CSS");
});

// ── fetcher ─────────────────────────────────────────────────────────────────

test("fetcher honors a 200 published response", async () => {
  const r = await getActivePaletteServer(async () => ({
    ok: true,
    status: 200,
    json: async () => publishedPayload(),
  }));
  assert.equal(r.isNeutral, false);
  assert.equal(r.light.primary, emeraldLight.tokens.primary);
});

test("fetcher falls back to Neutral on HTTP errors", async () => {
  for (const status of [401, 403, 404, 500]) {
    const r = await getActivePaletteServer(async () => ({ ok: false, status, json: async () => ({}) }));
    assert.equal(r.isNeutral, true, `status ${status} must fall back`);
  }
});

test("fetcher falls back to Neutral when the network throws", async () => {
  const r = await getActivePaletteServer(async () => {
    throw new Error("ECONNREFUSED");
  });
  assert.equal(r.isNeutral, true);
});

// ── source guards: migrated homepage-exclusive components ───────────────────

const HOMEPAGE_EXCLUSIVE = [
  "components/footer/Footer.tsx",
  "components/homesections/CategoryLayout_2.tsx",
  "components/homesections/CategoryLayout_3.tsx",
  "components/homesections/CategorySection.tsx",
  "components/homesections/HomeSection.tsx",
  "components/homesections/ProductSection.tsx",
  "components/DownloadApp.tsx",
  "components/skeletons/HomeSectionSkeleton.tsx",
  "../public/svg/BenefitsSection.tsx",
];

test("no hardcoded brand colors remain in homepage-exclusive components", () => {
  // Legacy brand palette: teal/emerald utilities and the deep-teal hexes.
  // Deliberate exceptions (verified in the audit): media overlays
  // (from-black/50, white text on images) and platform brand SVG fills in
  // DownloadApp (#00D9FF / #FFCE00 / #FF3A44 / #00F076) — none match here.
  const brand = /(?:bg|text|border|from|to|via|ring|shadow|fill|stroke)-(?:teal|emerald)-\d|#0f766e|#14b8a6|#0b5052|#0d9488/i;
  for (const path of HOMEPAGE_EXCLUSIVE) {
    const content = src(path);
    const hit = content.match(brand);
    assert.equal(hit, null, `${path} still contains hardcoded brand color: ${hit && hit[0]}`);
  }
});

// ── source guards: shared chrome (dashboard isolation) ─────────────────────

const SHARED_CHROME = [
  "components/publicnavbar/Navbar.tsx",
  "components/movilebottomnav/MobileBottomNav.tsx",
  "components/publicnavbar/NestedCategoryMenu.tsx",
];

test("shared chrome never uses bare palette token classes", () => {
  // A bare bg-primary/text-primary here would follow :root on dashboards
  // (Neutral = near-black) and break isolation — chrome must stay on --fm-*.
  for (const path of SHARED_CHROME) {
    const content = src(path);
    const bare = content.match(/["'\s](?:bg|text|border)-primary(?:["'\s/]|$)/);
    assert.equal(bare, null, `${path} uses bare palette class: ${bare && bare[0]}`);
  }
});

test("every --fm-* consumption in shared chrome carries a hex fallback", () => {
  for (const path of SHARED_CHROME) {
    const content = src(path);
    const missing = content.match(/var\(--fm-[\w-]+\)/g);
    assert.equal(missing, null, `${path} consumes --fm-* without a fallback: ${missing && missing[0]}`);
  }
});

test("every --fm-* var consumed by components is emitted by the injection", () => {
  const emitted = new Set(FM_CHROME_VARS.map(([name]) => name));
  const files = [...SHARED_CHROME];
  for (const path of files) {
    const content = src(path);
    for (const m of content.matchAll(/var\((--fm-[\w-]+)\s*,/g)) {
      assert.ok(emitted.has(m[1]), `${path} consumes ${m[1]} which the injection never emits`);
    }
  }
});

// ── source guards: injection wiring ─────────────────────────────────────────

test("homepage route injects via buildHomepagePaletteCss only", () => {
  const page = src("app/page.tsx");
  assert.ok(page.includes("getActivePaletteServer"), "page must fetch the active palette server-side");
  assert.ok(page.includes('id="fm-home-palette"'), "injection style tag id expected");
  assert.ok(page.includes("buildHomepagePaletteCss"), "CSS must come from the pure builder");
});

test("cache tag for the palette fetch is registered", () => {
  const revalidate = src("lib/homepage-config/revalidate.ts");
  assert.ok(revalidate.includes('palette: "theme-palette"'), "HOMEPAGE_CACHE_TAGS.palette expected");
});
