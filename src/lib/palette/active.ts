// src/lib/palette/active.ts
//
// Homepage integration — server-side loader for the currently published
// PLATFORM_WEBSITE palette (backend: GET /api/themes/palette/active,
// service: getActivePalette in theme-palette.service.ts).
//
// Mirrors the lib/theme-utils.ts contract exactly:
//   * force-cache + revalidate 300 + a dedicated cache tag, so publishing a
//     palette propagates within ≤5 minutes (instant tag revalidation on
//     publish is Part 5 scope — see THEME_MANAGEMENT_HOMEPAGE_AUDIT.md §3.5);
//   * NEVER throws — any network/HTTP/shape problem resolves to the built-in
//     Neutral preset, which is byte-identical to today's globals.css :root;
//   * drafts are never served: only `source === 'published'` payloads are
//     used, everything else yields Neutral with `isNeutral: true` so the
//     caller skips CSS injection entirely.
//
// Defense in depth: published tokens are re-validated client-side through
// resolvePaletteTokens() (unknown keys / invalid colors / missing core
// tokens / CSS-injection patterns all fail closed to Neutral).

import { HOMEPAGE_CACHE_TAGS } from "../homepage-config/revalidate.ts";
import { paletteToCssVars, type CssVarEntries } from "./css.ts";
import { NEUTRAL_PRESET } from "./presets.ts";
import {
  resolvePaletteTokens,
  type PaletteTokens,
  type ResolvedPaletteTokens,
} from "./tokens.ts";

// ── payload shape (mirrors ActivePaletteResult in the backend service) ───────

export interface ActivePalettePayload {
  scope: string;
  scopeId: string;
  name: string;
  version: number;
  tokens: PaletteTokens;
  darkTokens: PaletteTokens | null;
  updatedAt: string | null;
  source: "published" | "default" | "fallback";
}

export interface ResolvedHomepagePalette {
  /** Fully derived light token map (always present). */
  light: ResolvedPaletteTokens;
  /** Fully derived dark token map, or null when the palette has none / it is invalid. */
  dark: ResolvedPaletteTokens | null;
  /** True when serving built-in defaults — the caller injects NO css. */
  isNeutral: boolean;
  name: string;
  version: number;
  source: "published" | "default" | "fallback";
}

// ── Neutral resolution (module-cached; inputs are constants) ─────────────────

let neutralCache: ResolvedHomepagePalette | null = null;

export function neutralHomepagePalette(source: "default" | "fallback"): ResolvedHomepagePalette {
  if (source === "default" && neutralCache) return neutralCache;
  const light = resolvePaletteTokens(NEUTRAL_PRESET.tokens);
  const dark = NEUTRAL_PRESET.darkTokens ? resolvePaletteTokens(NEUTRAL_PRESET.darkTokens) : null;
  // The Neutral preset is parity-tested against globals.css; a failure here
  // would be a build-time bug, not runtime data — fail closed with a throw so
  // tests catch it instead of silently shipping an unstyled page.
  if (!light.ok) throw new Error("Neutral preset failed to resolve");
  const resolved: ResolvedHomepagePalette = {
    light: light.tokens,
    dark: dark && dark.ok ? dark.tokens : null,
    isNeutral: true,
    name: NEUTRAL_PRESET.name,
    version: 0,
    source,
  };
  if (source === "default") neutralCache = resolved;
  return resolved;
}

// ── pure payload resolution (unit-tested without fetch) ─────────────────────

/**
 * Decides what the homepage renders for one API response body. Only
 * `source: 'published'` with fully valid tokens is honored; every other
 * shape — defaults, fallbacks, malformed envelopes, invalid token maps —
 * resolves to Neutral. Dark tokens are independent: an invalid dark map
 * degrades to "no dark overrides" without touching the light map.
 */
export function resolveActivePalettePayload(body: unknown): ResolvedHomepagePalette {
  const data =
    body && typeof body === "object" && "data" in body
      ? (body as { data?: unknown }).data
      : undefined;
  if (!data || typeof data !== "object") return neutralHomepagePalette("fallback");

  const p = data as Partial<ActivePalettePayload>;
  if (p.source !== "published") {
    return neutralHomepagePalette(p.source === "default" ? "default" : "fallback");
  }
  const light = resolvePaletteTokens(p.tokens);
  if (!light.ok) {
    console.warn("[palette] published palette failed client-side validation — serving Neutral");
    return neutralHomepagePalette("fallback");
  }
  let dark: ResolvedPaletteTokens | null = null;
  if (p.darkTokens) {
    const d = resolvePaletteTokens(p.darkTokens);
    if (d.ok) dark = d.tokens;
    else console.warn("[palette] published palette has invalid dark tokens — light only");
  }
  return {
    light: light.tokens,
    dark,
    isNeutral: false,
    name: typeof p.name === "string" ? p.name : "Published palette",
    version: typeof p.version === "number" ? p.version : 0,
    source: "published",
  };
}

// ── CSS injection builder (pure, deterministic) ──────────────────────────────

/**
 * Shared-chrome accent variables (Pattern B in the audit): Navbar,
 * MobileBottomNav and NestedCategoryMenu consume these with the CURRENT
 * production color as the var() fallback, so every non-homepage route renders
 * byte-identical to today while the homepage follows the active palette.
 * Values reference token vars, so the .dark override adapts automatically.
 * Lighter/stronger legacy accents (teal-500/teal-100/teal-200) merge into the
 * palette's primary/tint — an intentional, documented simplification.
 */
export const FM_CHROME_VARS: CssVarEntries = [
  ["--fm-accent", "var(--primary)"],
  ["--fm-accent-hover", "var(--primary-hover)"],
  ["--fm-accent-light", "var(--primary)"],
  ["--fm-accent-dark", "var(--primary-dark)"],
  ["--fm-accent-tint", "var(--primary-tint)"],
  ["--fm-accent-tint2", "var(--primary-tint)"],
  ["--fm-accent-shadow", "color-mix(in oklab, var(--primary) 14%, transparent)"],
  ["--fm-accent-shadow-strong", "color-mix(in oklab, var(--primary) 30%, transparent)"],
  ["--fm-danger", "var(--destructive)"],
  ["--fm-danger-hover", "var(--destructive)"],
  // Cart CTA is a deliberate conversion color (not an error state): it keeps
  // its red fallback everywhere, and follows the brand primary on the
  // homepage where the palette is injected (documented in the audit §3.1).
  ["--fm-cart", "var(--primary)"],
  ["--fm-cart-hover", "var(--primary-hover)"],
];

function rule(selector: string, vars: CssVarEntries): string {
  return `${selector} {\n${vars.map(([n, v]) => `  ${n}: ${v};`).join("\n")}\n}`;
}

/**
 * Stylesheet for the homepage's inline <style> tag. Empty string for Neutral
 * (globals.css :root and the var() fallbacks already carry those values —
 * injecting nothing keeps the SSR output deterministic and minimal).
 * Selector constants only; paletteToCss's selector whitelist is honored by
 * construction.
 */
export function buildHomepagePaletteCss(palette: ResolvedHomepagePalette): string {
  if (palette.isNeutral) return "";
  const light = rule(":root", [...paletteToCssVars(palette.light), ...FM_CHROME_VARS]);
  if (!palette.dark) return light;
  return `${light}\n${rule(".dark", paletteToCssVars(palette.dark))}`;
}

// ── server fetcher (never throws) ────────────────────────────────────────────

type PaletteFetchLike = (
  input: string,
) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>;

/**
 * Loads the active PLATFORM_WEBSITE palette for SSR injection. Optional
 * fetchImpl exists for unit tests; production uses global fetch with the
 * standard FinixMart cache policy (force-cache + 300s revalidate + tag).
 */
export async function getActivePaletteServer(
  fetchImpl?: PaletteFetchLike,
): Promise<ResolvedHomepagePalette> {
  const doFetch: PaletteFetchLike =
    fetchImpl ??
    ((url: string) =>
      fetch(url, {
        cache: "force-cache",
        next: { revalidate: 300, tags: [HOMEPAGE_CACHE_TAGS.palette] },
        headers: { "Content-Type": "application/json" },
      }));
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    const response = await doFetch(`${apiUrl}/themes/palette/active?scope=PLATFORM_WEBSITE`);
    if (!response.ok) {
      console.warn(`Failed to fetch active palette (${response.status}), using Neutral defaults`);
      return neutralHomepagePalette("fallback");
    }
    return resolveActivePalettePayload(await response.json());
  } catch (error) {
    console.error("Error fetching active palette, using Neutral defaults:", error);
    return neutralHomepagePalette("fallback");
  }
}
