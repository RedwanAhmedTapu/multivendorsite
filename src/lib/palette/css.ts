// src/lib/palette/css.ts
//
// Part 1 — pure CSS mapping (THEME_MANAGEMENT_ARCHITECTURE.md §2.5).
//
//   paletteToCssVars(resolved)  → ordered [--var, value] entries
//   paletteToCss(resolved, sel) → a deterministic `sel { --var: value; … }`
//                                 stylesheet string
//
// Pure functions only: no DOM, no fetch, no storage, no side effects.
// Output order is fixed by TOKEN_TO_CSS_VAR, so identical input always
// produces byte-identical output (snapshot-testable).
//
// Injection safety: every value passed through here is already validated by
// validatePaletteTokens (tokens.ts); the selector is restricted to simple
// selector grammar (descendant combinators of :root, element, .class, #id,
// [data-attr]) so a selector can never break out of the rule block either.

import type { ResolvedPaletteTokens, SemanticToken } from "./tokens.ts";

/** Canonical emission order — mirrors globals.css `:root` layout. */
export const TOKEN_TO_CSS_VAR: ReadonlyArray<readonly [SemanticToken, string]> = [
  ["background", "--background"],
  ["text", "--foreground"],
  ["card", "--card"],
  ["cardForeground", "--card-foreground"],
  ["surface", "--popover"],
  ["surfaceForeground", "--popover-foreground"],
  ["primary", "--primary"],
  ["primaryForeground", "--primary-foreground"],
  ["primaryHover", "--primary-hover"],
  ["primaryActive", "--primary-active"],
  ["primaryTint", "--primary-tint"],
  ["primaryDark", "--primary-dark"],
  ["secondary", "--secondary"],
  ["secondaryForeground", "--secondary-foreground"],
  ["muted", "--muted"],
  ["textSecondary", "--muted-foreground"],
  ["accent", "--accent"],
  ["accentForeground", "--accent-foreground"],
  ["danger", "--destructive"],
  ["dangerForeground", "--destructive-foreground"],
  ["success", "--success"],
  ["successForeground", "--success-foreground"],
  ["warning", "--warning"],
  ["warningForeground", "--warning-foreground"],
  ["info", "--info"],
  ["infoForeground", "--info-foreground"],
  ["border", "--border"],
  ["borderStrong", "--border-strong"],
  ["input", "--input"],
  ["focusRing", "--ring"],
  ["chart1", "--chart-1"],
  ["chart2", "--chart-2"],
  ["chart3", "--chart-3"],
  ["chart4", "--chart-4"],
  ["chart5", "--chart-5"],
  ["sidebar", "--sidebar"],
  ["sidebarForeground", "--sidebar-foreground"],
  ["sidebarPrimary", "--sidebar-primary"],
  ["sidebarPrimaryForeground", "--sidebar-primary-foreground"],
  ["sidebarAccent", "--sidebar-accent"],
  ["sidebarAccentForeground", "--sidebar-accent-foreground"],
  ["sidebarBorder", "--sidebar-border"],
  ["sidebarRing", "--sidebar-ring"],
];

export type CssVarEntries = ReadonlyArray<readonly [string, string]>;

/** Ordered CSS variable declarations for a resolved token map. */
export function paletteToCssVars(tokens: ResolvedPaletteTokens): CssVarEntries {
  return TOKEN_TO_CSS_VAR.map(([token, cssVar]) => [cssVar, tokens[token]] as const);
}

// ── selector safety ─────────────────────────────────────────────────────────

// Simple selectors only, joined by descendant combinators:
//   :root | element | .class | #id | [attr] | [attr="value"]
const SIMPLE_SELECTOR = /^(?::root|[a-zA-Z][\w-]*|\.[\w-]+|#[\w-]+|\[[\w-]+(?:=["']?[\w-]*["']?)?\])$/;

export function isSafeCssSelector(selector: unknown): selector is string {
  if (typeof selector !== "string") return false;
  const trimmed = selector.trim();
  if (trimmed.length === 0 || trimmed.length > 120) return false;
  return trimmed.split(/\s+/).every((part) => SIMPLE_SELECTOR.test(part));
}

/**
 * Render a complete stylesheet rule. Throws on an unsafe selector — callers
 * pass their own constant (":root", "[data-fm-storefront]", …), never user
 * input, so a throw here means a programming error, not bad data.
 */
export function paletteToCss(tokens: ResolvedPaletteTokens, selector = ":root"): string {
  if (!isSafeCssSelector(selector)) {
    throw new Error(`Unsafe CSS selector for palette injection: ${JSON.stringify(selector)}`);
  }
  const lines = paletteToCssVars(tokens).map(([name, value]) => `  ${name}: ${value};`);
  return `${selector} {\n${lines.join("\n")}\n}`;
}
