// tests/theme-palette.test.mjs
//
// Part 1 — semantic token architecture: schema, presets, CSS mapping.
// Pure logic, no dependencies beyond node:test:
//   node --test tests/theme-palette.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  ALL_TOKENS,
  CORE_TOKENS,
  isValidColorValue,
  resolvePaletteTokens,
  validatePaletteTokens,
} from "../src/lib/palette/tokens.ts";
import { PALETTE_PRESETS, NEUTRAL_PRESET, EMERALD_PRESET, ORANGE_PRESET } from "../src/lib/palette/presets.ts";
import { TOKEN_TO_CSS_VAR, isSafeCssSelector, paletteToCss, paletteToCssVars } from "../src/lib/palette/css.ts";

// ── helpers ─────────────────────────────────────────────────────────────────

const resolve = (tokens) => {
  const r = resolvePaletteTokens(tokens);
  assert.ok(r.ok, `expected resolution to succeed: ${JSON.stringify(!r.ok && r.issues)}`);
  return r.tokens;
};

/** Parse `selector { --var: value; … }` blocks out of globals.css. */
function cssBlockVars(fileText, selectorRe) {
  const m = fileText.match(selectorRe);
  assert.ok(m, "expected block not found in globals.css");
  const vars = {};
  for (const line of m[1].split("\n")) {
    const d = line.match(/^\s*(--[\w-]+)\s*:\s*(.+?)\s*;\s*$/);
    if (d) vars[d[1]] = d[2];
  }
  return vars;
}

const globalsCss = readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8");
const rootVars = cssBlockVars(globalsCss, /^:root\s*\{([^}]*)\}/m);
const darkVars = cssBlockVars(globalsCss, /^\.dark\s*\{([^}]*)\}/m);

// ── presets ─────────────────────────────────────────────────────────────────

test("all three presets exist, validate, and resolve to a complete token map", () => {
  assert.deepEqual(
    PALETTE_PRESETS.map((p) => p.id),
    ["neutral", "emerald", "orange"],
  );
  for (const preset of PALETTE_PRESETS) {
    const resolved = resolve(preset.tokens);
    for (const token of ALL_TOKENS) {
      assert.ok(resolved[token], `${preset.id}: resolved map must contain '${token}'`);
      assert.ok(isValidColorValue(resolved[token]), `${preset.id}.${token} must be a valid color`);
    }
  }
});

test("preset spec values are exact (Neutral anchor + Emerald/Orange brief values)", () => {
  // Emerald — the 8 spec-given values:
  assert.equal(EMERALD_PRESET.tokens.primary, "#10B981");
  assert.equal(EMERALD_PRESET.tokens.primaryHover, "#059669");
  assert.equal(EMERALD_PRESET.tokens.primaryTint, "#ECFDF5");
  assert.equal(EMERALD_PRESET.tokens.primaryDark, "#064E3B");
  assert.equal(EMERALD_PRESET.tokens.surface, "#FFFFFF");
  assert.equal(EMERALD_PRESET.tokens.background, "#F8FAFC");
  assert.equal(EMERALD_PRESET.tokens.border, "#E2E8F0");
  assert.equal(EMERALD_PRESET.tokens.text, "#0F172A");
  // Orange — the spec-given values:
  assert.equal(ORANGE_PRESET.tokens.primary, "#FF7A1A");
  assert.equal(ORANGE_PRESET.tokens.primaryHover, "#FF9B45");
  assert.equal(ORANGE_PRESET.tokens.primaryTint, "#FFB7A8");
  assert.equal(ORANGE_PRESET.tokens.background, "#FFF7F2");
  assert.equal(ORANGE_PRESET.tokens.card, "#FFFFFF");
  assert.equal(ORANGE_PRESET.tokens.text, "#1E293B");
  assert.equal(ORANGE_PRESET.tokens.success, "#16A34A");
  assert.equal(ORANGE_PRESET.tokens.border, "#E5E7EB");
  // Neutral anchor values (shadcn production):
  assert.equal(NEUTRAL_PRESET.tokens.primary, "oklch(0.205 0 0)");
  assert.equal(NEUTRAL_PRESET.tokens.background, "oklch(1 0 0)");
});

// ── validation ──────────────────────────────────────────────────────────────

test("missing required core tokens are reported by name", () => {
  const broken = { ...EMERALD_PRESET.tokens };
  delete broken.primary;
  delete broken.focusRing;
  const v = validatePaletteTokens(broken);
  assert.equal(v.ok, false);
  const names = v.issues.map((i) => i.token);
  assert.ok(names.includes("primary"));
  assert.ok(names.includes("focusRing"));
});

test("unknown (extra) tokens are rejected", () => {
  const v = validatePaletteTokens({ ...EMERALD_PRESET.tokens, brandNewPink: "#FF00FF" });
  assert.equal(v.ok, false);
  assert.equal(v.issues[0].token, "brandNewPink");
});

test("invalid and unsafe color values are rejected", () => {
  for (const bad of [
    "#GG0000",
    "#12345",
    "10px",
    "red",
    "url(javascript:alert(1))",
    "#fff; } body { display: none",
    "oklch(0.5 0.1 30); }",
    "oklch(0.5 0.1 30)}",
    "${evil}",
    "",
    123,
    null,
  ]) {
    assert.equal(isValidColorValue(bad), false, `must reject ${JSON.stringify(bad)}`);
  }
});

test("legitimate color formats are accepted (incl. modern space syntax + slash alpha)", () => {
  for (const good of [
    "#FFF",
    "#FFFF",
    "#FFFFFF",
    "#FFFFFFFF",
    "#10b981",
    "rgb(16 185 129)",
    "rgba(16, 185, 129, 0.5)",
    "hsl(160 84% 39%)",
    "hsla(160, 84%, 39%, 0.9)",
    "oklch(0.205 0 0)",
    "oklch(1 0 0 / 10%)",
    "oklch(0.7 0.15 160 / 0.5)",
  ]) {
    assert.equal(isValidColorValue(good), true, `must accept ${good}`);
  }
});

// ── derivation ──────────────────────────────────────────────────────────────

test("companion derivation is deterministic and documented", () => {
  const emerald = resolve(EMERALD_PRESET.tokens);
  assert.equal(emerald.primaryForeground, "#FFFFFF");
  assert.equal(emerald.secondaryForeground, emerald.text);
  assert.equal(emerald.accentForeground, emerald.primaryDark);
  assert.equal(emerald.cardForeground, emerald.text);
  assert.equal(emerald.input, emerald.border, "input defaults to border (production parity)");
  assert.equal(emerald.warningForeground, "#1E293B", "dark on amber for WCAG");
  assert.equal(emerald.sidebarPrimary, emerald.primary);
  assert.equal(emerald.sidebar, emerald.card);
  assert.equal(emerald.sidebarRing, emerald.focusRing);
  // explicit values are never overwritten by derivation:
  assert.equal(emerald.primaryHover, "#059669");
  const orange = resolve(ORANGE_PRESET.tokens);
  assert.equal(orange.accent, "#FFDEC6", "documented sRGB mix value");
  assert.equal(orange.primaryActive, "#E06B17");
  assert.equal(orange.primaryDark, "#8C430E");
});

// ── CSS mapping ─────────────────────────────────────────────────────────────

test("CSS output is deterministic: identical inputs → byte-identical output", () => {
  const a = paletteToCss(resolve(EMERALD_PRESET.tokens));
  const b = paletteToCss(resolve(EMERALD_PRESET.tokens));
  assert.equal(a, b);
  // emission order follows TOKEN_TO_CSS_VAR, not object key order
  const entries = paletteToCssVars(resolve(EMERALD_PRESET.tokens));
  assert.deepEqual(
    entries.map(([name]) => name),
    TOKEN_TO_CSS_VAR.map(([, cssVar]) => cssVar),
  );
  assert.equal(entries.length, ALL_TOKENS.length);
});

test("stylesheet shape: scoped rule, every declaration terminated", () => {
  const css = paletteToCss(resolve(EMERALD_PRESET.tokens), ":root");
  assert.ok(css.startsWith(":root {\n"));
  assert.ok(css.endsWith("\n}"));
  assert.match(css, /  --primary: #10B981;\n/);
  const storefront = paletteToCss(resolve(ORANGE_PRESET.tokens), "[data-fm-storefront]");
  assert.ok(storefront.startsWith("[data-fm-storefront] {"));
});

test("selector injection is impossible", () => {
  assert.equal(isSafeCssSelector(":root"), true);
  assert.equal(isSafeCssSelector("[data-fm-storefront]"), true);
  assert.equal(isSafeCssSelector('[data-theme-preview="draft"]'), true);
  assert.equal(isSafeCssSelector(":root .emerald-preview"), true);
  for (const bad of [
    "body {} * { display: none }",
    "*",
    "body, html",
    ":root; background: url(x)",
    "div > p",
    ":root:not(.x)",
    " ",
    null,
  ]) {
    assert.equal(isSafeCssSelector(bad), false, `must reject ${JSON.stringify(bad)}`);
  }
  assert.throws(() => paletteToCss(resolve(EMERALD_PRESET.tokens), "body {} * { display:none }"), /Unsafe CSS selector/);
});

// ── Neutral parity with production globals.css ─────────────────────────────

test("Neutral preset == production :root variables (string parity)", () => {
  const neutral = resolve(NEUTRAL_PRESET.tokens);
  let compared = 0;
  for (const [token, cssVar] of TOKEN_TO_CSS_VAR) {
    if (cssVar in rootVars) {
      assert.equal(neutral[token], rootVars[cssVar], `:root ${cssVar} must match the Neutral preset`);
      compared += 1;
    }
  }
  assert.ok(compared >= 40, `parity must cover the production vars (compared ${compared})`);
});

test("Neutral darkTokens == production .dark variables (string parity)", () => {
  assert.ok(NEUTRAL_PRESET.darkTokens, "Neutral ships the production dark map");
  const dark = resolve(NEUTRAL_PRESET.darkTokens);
  let compared = 0;
  for (const [token, cssVar] of TOKEN_TO_CSS_VAR) {
    if (cssVar in darkVars) {
      assert.equal(dark[token], darkVars[cssVar], `.dark ${cssVar} must match the Neutral dark preset`);
      compared += 1;
    }
  }
  assert.ok(compared >= 30, `parity must cover the dark vars (compared ${compared})`);
});

test("core token set is exactly the brief's 20 semantic tokens", () => {
  assert.equal(CORE_TOKENS.length, 20);
  for (const t of ["primary", "primaryHover", "primaryActive", "primaryTint", "primaryDark", "secondary", "accent", "background", "surface", "card", "text", "textSecondary", "muted", "border", "borderStrong", "success", "warning", "danger", "info", "focusRing"]) {
    assert.ok(CORE_TOKENS.includes(t), t);
  }
});
