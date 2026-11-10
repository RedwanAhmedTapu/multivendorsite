// src/lib/palette/presets.ts
//
// Part 1 — the three initial palettes (THEME_MANAGEMENT_ARCHITECTURE.md §2.2).
//
//   NEUTRAL  — EXACT production values, extracted verbatim from
//              src/app/globals.css (`:root` + the new Part-1 extension vars).
//              oklch strings are kept in their source-native form so parity
//              with production is a string comparison, not a color conversion.
//   EMERALD  — brief spec; the 8 given values are Tailwind's emerald/slate
//              scale (emerald-500/600/700/800/900, emerald-50, slate-50/200/900),
//              so derived companions follow the same scale (documented inline).
//   ORANGE   — brief spec; does not exist anywhere in the codebase today
//              (grep-verified 2026-11-09). Derived values use one documented
//              rule: sRGB mix of `primary` toward white or black by a fixed
//              percentage (each value annotated).
//
// Status colors (success/warning/danger/info) are deliberately SHARED across
// presets — they are platform semantics, not brand (architecture §2.1).
//
// Nothing here is activated: these are data definitions only. Publishing and
// runtime switching arrive in Parts 2–5.

import type { PaletteTokens } from "./tokens.ts";

export interface PalettePreset {
  id: "neutral" | "emerald" | "orange";
  name: string;
  description: string;
  kind: "PRESET";
  tokens: PaletteTokens;
  /** Optional dark variant. Only Neutral ships one today (the dormant
   *  production `.dark` map); Emerald/Orange are light-first by decision. */
  darkTokens?: PaletteTokens;
}

// ── NEUTRAL — verbatim production extraction ────────────────────────────────
// Sources: globals.css :root (lines 47–81) + the Part-1 extension block.
// Tokens that production does not define (status group, hover/active/tint/
// dark, border-strong) take the exact values added to globals.css in Part 1,
// so the token layer and the live stylesheet cannot drift.
export const NEUTRAL_PRESET: PalettePreset = {
  id: "neutral",
  name: "Neutral",
  description: "The current production palette (shadcn neutral, oklch).",
  kind: "PRESET",
  tokens: {
    background: "oklch(1 0 0)",
    text: "oklch(0.145 0 0)",
    card: "oklch(1 0 0)",
    cardForeground: "oklch(0.145 0 0)",
    surface: "oklch(1 0 0)", // → --popover
    surfaceForeground: "oklch(0.145 0 0)",
    primary: "oklch(0.205 0 0)",
    primaryForeground: "oklch(0.985 0 0)",
    // Extension tokens (added to globals.css in Part 1). Neutral's primary is
    // near-maximum darkness, so hover/active LIGHTEN — mirroring the existing
    // bg-primary/90 hover convention.
    primaryHover: "oklch(0.269 0 0)",
    primaryActive: "oklch(0.32 0 0)",
    primaryTint: "oklch(0.97 0 0)",
    primaryDark: "oklch(0.145 0 0)",
    secondary: "oklch(0.97 0 0)",
    secondaryForeground: "oklch(0.205 0 0)",
    muted: "oklch(0.97 0 0)",
    textSecondary: "oklch(0.556 0 0)",
    accent: "oklch(0.97 0 0)",
    accentForeground: "oklch(0.205 0 0)",
    border: "oklch(0.922 0 0)",
    borderStrong: "oklch(0.85 0 0)",
    input: "oklch(0.922 0 0)",
    focusRing: "oklch(0.708 0 0)",
    danger: "oklch(0.577 0.245 27.325)",
    // Status group — platform-shared (hex; see file header).
    success: "#16A34A",
    successForeground: "#FFFFFF",
    warning: "#D97706",
    warningForeground: "#1E293B",
    info: "#2563EB",
    infoForeground: "#FFFFFF",
    dangerForeground: "#FFFFFF",
    chart1: "oklch(0.646 0.222 41.116)",
    chart2: "oklch(0.6 0.118 184.704)",
    chart3: "oklch(0.398 0.07 227.392)",
    chart4: "oklch(0.828 0.189 84.429)",
    chart5: "oklch(0.769 0.188 70.08)",
    sidebar: "oklch(0.985 0 0)",
    sidebarForeground: "oklch(0.145 0 0)",
    sidebarPrimary: "oklch(0.205 0 0)",
    sidebarPrimaryForeground: "oklch(0.985 0 0)",
    sidebarAccent: "oklch(0.97 0 0)",
    sidebarAccentForeground: "oklch(0.205 0 0)",
    sidebarBorder: "oklch(0.922 0 0)",
    sidebarRing: "oklch(0.708 0 0)",
  },
  // Verbatim globals.css .dark map (dormant in production) + the Part-1
  // extension values added to .dark alongside it.
  darkTokens: {
    background: "oklch(0.145 0 0)",
    text: "oklch(0.985 0 0)",
    card: "oklch(0.205 0 0)",
    cardForeground: "oklch(0.985 0 0)",
    surface: "oklch(0.205 0 0)",
    surfaceForeground: "oklch(0.985 0 0)",
    primary: "oklch(0.922 0 0)",
    primaryForeground: "oklch(0.205 0 0)",
    // Dark primary is near-white — hover/active DARKEN.
    primaryHover: "oklch(0.85 0 0)",
    primaryActive: "oklch(0.8 0 0)",
    primaryTint: "oklch(0.269 0 0)",
    primaryDark: "oklch(1 0 0)",
    secondary: "oklch(0.269 0 0)",
    secondaryForeground: "oklch(0.985 0 0)",
    muted: "oklch(0.269 0 0)",
    textSecondary: "oklch(0.708 0 0)",
    accent: "oklch(0.269 0 0)",
    accentForeground: "oklch(0.985 0 0)",
    border: "oklch(1 0 0 / 10%)",
    borderStrong: "oklch(1 0 0 / 25%)",
    input: "oklch(1 0 0 / 15%)",
    focusRing: "oklch(0.556 0 0)",
    danger: "oklch(0.704 0.191 22.216)",
    success: "#16A34A",
    successForeground: "#FFFFFF",
    warning: "#D97706",
    warningForeground: "#1E293B",
    info: "#2563EB",
    infoForeground: "#FFFFFF",
    dangerForeground: "#FFFFFF",
    chart1: "oklch(0.488 0.243 264.376)",
    chart2: "oklch(0.696 0.17 162.48)",
    chart3: "oklch(0.769 0.188 70.08)",
    chart4: "oklch(0.627 0.265 303.9)",
    chart5: "oklch(0.645 0.246 16.439)",
    sidebar: "oklch(0.205 0 0)",
    sidebarForeground: "oklch(0.985 0 0)",
    sidebarPrimary: "oklch(0.488 0.243 264.376)",
    sidebarPrimaryForeground: "oklch(0.985 0 0)",
    sidebarAccent: "oklch(0.269 0 0)",
    sidebarAccentForeground: "oklch(0.985 0 0)",
    sidebarBorder: "oklch(1 0 0 / 10%)",
    sidebarRing: "oklch(0.556 0 0)",
  },
};

// ── EMERALD — brief spec on the Tailwind emerald/slate scale ────────────────
export const EMERALD_PRESET: PalettePreset = {
  id: "emerald",
  name: "Emerald",
  description: "Emerald brand palette (spec). Matches the existing vendor-area emerald usage.",
  kind: "PRESET",
  tokens: {
    // Given by the spec:
    primary: "#10B981", // emerald-500
    primaryHover: "#059669", // emerald-600
    primaryTint: "#ECFDF5", // emerald-50
    primaryDark: "#064E3B", // emerald-900
    surface: "#FFFFFF",
    background: "#F8FAFC", // slate-50
    border: "#E2E8F0", // slate-200
    text: "#0F172A", // slate-900
    // Derived on the same scale (documented choices):
    primaryActive: "#047857", // emerald-700 — the scale step below hover
    secondary: "#F1F5F9", // slate-100
    accent: "#D1FAE5", // emerald-100
    card: "#FFFFFF",
    textSecondary: "#64748B", // slate-500
    muted: "#F1F5F9", // slate-100
    borderStrong: "#CBD5E1", // slate-300
    focusRing: "#10B981",
    // Status group — platform-shared:
    success: "#16A34A",
    warning: "#D97706",
    danger: "#DC2626",
    info: "#2563EB",
  },
};

// ── ORANGE — brief spec; new to the platform (not in any existing file) ─────
export const ORANGE_PRESET: PalettePreset = {
  id: "orange",
  name: "Orange",
  description: "Orange brand palette (spec). New — no existing code uses it yet.",
  kind: "PRESET",
  tokens: {
    // Given by the spec:
    primary: "#FF7A1A",
    primaryHover: "#FF9B45", // spec "Soft Orange"
    primaryTint: "#FFB7A8", // spec "Coral"
    background: "#FFF7F2",
    card: "#FFFFFF", // spec "Card White"
    text: "#1E293B",
    border: "#E5E7EB", // spec "Border Gray"
    success: "#16A34A", // spec "Success Green"
    // Derived — one rule: sRGB mix of primary toward white/black by the stated
    // percentage (computed, then rounded to the nearest integer channel):
    primaryActive: "#E06B17", // primary → black 12%
    primaryDark: "#8C430E", // primary → black 45%
    secondary: "#FFF2E8", // primary → white 90%
    accent: "#FFDEC6", // primary → white 75%
    surface: "#FFFFFF",
    textSecondary: "#64748B", // slate-500
    muted: "#FBE9DC", // between background and tint (warm neutral)
    borderStrong: "#D1D5DB", // gray-300
    focusRing: "#FF7A1A",
    // Status group — platform-shared:
    warning: "#D97706",
    danger: "#DC2626",
    info: "#2563EB",
  },
};

export const PALETTE_PRESETS: readonly PalettePreset[] = [NEUTRAL_PRESET, EMERALD_PRESET, ORANGE_PRESET];

export function getPalettePreset(id: string): PalettePreset | null {
  return PALETTE_PRESETS.find((p) => p.id === id) ?? null;
}
