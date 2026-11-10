// src/lib/palette/tokens.ts
//
// Part 1 — semantic theme-token schema (THEME_MANAGEMENT_ARCHITECTURE.md §2.1).
//
// One canonical token set for every FinixMart surface. The 20 REQUIRED core
// tokens are the brief's semantic set; companion tokens (foregrounds, input,
// chart + sidebar groups) are OPTIONAL and filled deterministically by
// resolvePaletteTokens() using the documented derivation rules in
// COMPANION_DEFAULTS — presets may still set any companion explicitly
// (Neutral does, verbatim from globals.css).
//
// Values are concrete CSS colors only — hex / rgb(a) / hsl(a) / oklch etc.
// Anything else (CSS expressions, var() refs, strings with structural
// characters) is rejected so a stored palette can never inject CSS.

// ── token names ─────────────────────────────────────────────────────────────

export const CORE_TOKENS = [
  "primary",
  "primaryHover",
  "primaryActive",
  "primaryTint",
  "primaryDark",
  "secondary",
  "accent",
  "background",
  "surface",
  "card",
  "text",
  "textSecondary",
  "muted",
  "border",
  "borderStrong",
  "success",
  "warning",
  "danger",
  "info",
  "focusRing",
] as const;

export const COMPANION_TOKENS = [
  "primaryForeground",
  "secondaryForeground",
  "accentForeground",
  "cardForeground",
  "surfaceForeground",
  "input",
  "successForeground",
  "warningForeground",
  "dangerForeground",
  "infoForeground",
  "chart1",
  "chart2",
  "chart3",
  "chart4",
  "chart5",
  "sidebar",
  "sidebarForeground",
  "sidebarPrimary",
  "sidebarPrimaryForeground",
  "sidebarAccent",
  "sidebarAccentForeground",
  "sidebarBorder",
  "sidebarRing",
] as const;

export type CoreToken = (typeof CORE_TOKENS)[number];
export type CompanionToken = (typeof COMPANION_TOKENS)[number];
export type SemanticToken = CoreToken | CompanionToken;

export const ALL_TOKENS: readonly SemanticToken[] = [...CORE_TOKENS, ...COMPANION_TOKENS];

/** What a preset/author supplies: core required, companions optional. */
export type PaletteTokens = Partial<Record<SemanticToken, string>>;
/** What the runtime consumes: every token present. */
export type ResolvedPaletteTokens = Record<SemanticToken, string>;

// ── color validation (also the CSS-injection guard) ─────────────────────────

const HEX_COLOR = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
// Functional colors: rgb(a), hsl(a), hwb, lab, lch, oklab, oklch, color().
// The inner grammar is deliberately permissive about numbers/spaces/slashes
// (modern space-separated syntax, `/ alpha`, `none`) but allows ONLY
// color-grammar characters — no quotes, semicolons, braces, or urls.
const FUNCTION_COLOR = /^(?:rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch|color)\(([\d\s.,%+\-/a-zA-Z]*)\)$/;
// Defense in depth: structural characters never appear in a legit color.
const UNSAFE_CHARS = /[;{}<>@\\"']|url\s*\(|expression\s*\(|var\s*\(|\/\*/i;

export function isValidColorValue(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const v = value.trim();
  if (v.length === 0 || v.length > 64) return false;
  if (UNSAFE_CHARS.test(v)) return false;
  if (HEX_COLOR.test(v)) return true;
  const fn = FUNCTION_COLOR.exec(v);
  if (!fn) return false;
  // a functional color must contain at least one digit (no empty/keyword-only bodies)
  return /\d/.test(fn[1]);
}

// ── validation ──────────────────────────────────────────────────────────────

export interface PaletteValidationIssue {
  token: string;
  message: string;
}

export type PaletteValidation =
  | { ok: true; tokens: PaletteTokens }
  | { ok: false; issues: PaletteValidationIssue[] };

/**
 * Structural validation only (no derivation): unknown keys, missing required
 * core tokens and invalid/unsafe color values are reported together.
 */
export function validatePaletteTokens(input: unknown): PaletteValidation {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { ok: false, issues: [{ token: "(root)", message: "Palette tokens must be a plain object" }] };
  }
  const issues: PaletteValidationIssue[] = [];
  const entries = Object.entries(input as Record<string, unknown>);
  const known = new Set<string>(ALL_TOKENS);
  for (const [key, value] of entries) {
    if (!known.has(key)) {
      issues.push({ token: key, message: `Unknown token '${key}'` });
      continue;
    }
    if (!isValidColorValue(value)) {
      issues.push({ token: key, message: `Invalid or unsafe color value` });
    }
  }
  for (const required of CORE_TOKENS) {
    if (!(required in (input as object))) {
      issues.push({ token: required, message: `Missing required token '${required}'` });
    }
  }
  if (issues.length > 0) return { ok: false, issues };
  return { ok: true, tokens: input as PaletteTokens };
}

// ── derivation ──────────────────────────────────────────────────────────────

/** Platform chart defaults (identical to globals.css `:root` chart tokens). */
export const DEFAULT_CHART_TOKENS = {
  chart1: "oklch(0.646 0.222 41.116)",
  chart2: "oklch(0.6 0.118 184.704)",
  chart3: "oklch(0.398 0.07 227.392)",
  chart4: "oklch(0.828 0.189 84.429)",
  chart5: "oklch(0.769 0.188 70.08)",
} as const;

/**
 * Companion derivation rules (deterministic; documented in
 * THEME_MANAGEMENT_ARCHITECTURE.md §2.1):
 *   *-Foreground (brand)      → white on saturated brand/status colors…
 *   warningForeground         → dark slate (#1E293B) — white on amber fails WCAG
 *   secondary/card/surface fg → text
 *   accentForeground          → primaryDark
 *   input                     → border (matches production: --input == --border)
 *   chart1..5                 → platform defaults (chart theming is opt-in)
 *   sidebar group             → card/text/primary/muted/border/focusRing mapping
 */
export function resolvePaletteTokens(
  input: unknown,
): { ok: true; tokens: ResolvedPaletteTokens } | { ok: false; issues: PaletteValidationIssue[] } {
  const v = validatePaletteTokens(input);
  if (!v.ok) return v;
  const t = v.tokens as Record<string, string>;
  const pick = (key: SemanticToken, fallback: string) => t[key] ?? fallback;

  const text = t.text!;
  const primary = t.primary!;
  const primaryDark = t.primaryDark!;
  const card = t.card!;
  const muted = t.muted!;
  const border = t.border!;
  const focusRing = t.focusRing!;
  const primaryForeground = pick("primaryForeground", "#FFFFFF");

  const resolved: ResolvedPaletteTokens = {
    // core (validated present)
    primary,
    primaryHover: t.primaryHover!,
    primaryActive: t.primaryActive!,
    primaryTint: t.primaryTint!,
    primaryDark,
    secondary: t.secondary!,
    accent: t.accent!,
    background: t.background!,
    surface: t.surface!,
    card,
    text,
    textSecondary: t.textSecondary!,
    muted,
    border,
    borderStrong: t.borderStrong!,
    success: t.success!,
    warning: t.warning!,
    danger: t.danger!,
    info: t.info!,
    focusRing,
    // companions
    primaryForeground,
    secondaryForeground: pick("secondaryForeground", text),
    accentForeground: pick("accentForeground", primaryDark),
    cardForeground: pick("cardForeground", text),
    surfaceForeground: pick("surfaceForeground", text),
    input: pick("input", border),
    successForeground: pick("successForeground", "#FFFFFF"),
    warningForeground: pick("warningForeground", "#1E293B"),
    dangerForeground: pick("dangerForeground", "#FFFFFF"),
    infoForeground: pick("infoForeground", "#FFFFFF"),
    chart1: pick("chart1", DEFAULT_CHART_TOKENS.chart1),
    chart2: pick("chart2", DEFAULT_CHART_TOKENS.chart2),
    chart3: pick("chart3", DEFAULT_CHART_TOKENS.chart3),
    chart4: pick("chart4", DEFAULT_CHART_TOKENS.chart4),
    chart5: pick("chart5", DEFAULT_CHART_TOKENS.chart5),
    sidebar: pick("sidebar", card),
    sidebarForeground: pick("sidebarForeground", text),
    sidebarPrimary: pick("sidebarPrimary", primary),
    sidebarPrimaryForeground: pick("sidebarPrimaryForeground", primaryForeground),
    sidebarAccent: pick("sidebarAccent", muted),
    sidebarAccentForeground: pick("sidebarAccentForeground", text),
    sidebarBorder: pick("sidebarBorder", border),
    sidebarRing: pick("sidebarRing", focusRing),
  };
  return { ok: true, tokens: resolved };
}
