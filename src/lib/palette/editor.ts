// src/lib/palette/editor.ts
//
// Part 3 — pure helpers for the admin theme-palette UI. Everything here is
// side-effect free and unit-tested in tests/theme-admin-palette.test.mjs so
// the React components stay thin (same architecture as lib/product-card).
//
// Covers: editor token grouping, dirty checking / payload diffing, list
// filtering, API error mapping (incl. the 409 DRAFT_CONFLICT protocol), and
// the UX-only action predicates. The predicates mirror the backend rules in
// services/theme-palette.service.ts for display purposes ONLY — the backend
// re-checks every rule on every mutation.

import {
  ALL_TOKENS,
  isValidColorValue,
  resolvePaletteTokens,
  validatePaletteTokens,
  type PaletteTokens,
  type ResolvedPaletteTokens,
  type SemanticToken,
} from "./tokens.ts";
import { NEUTRAL_PRESET } from "./presets.ts";

// ── editor token grouping ────────────────────────────────────────────────────

export interface TokenGroup {
  id: string;
  title: string;
  description: string;
  tokens: readonly SemanticToken[];
  /** Advanced groups render collapsed by default. */
  advanced?: boolean;
}

/**
 * Display grouping for the token editor. Every one of the 43 semantic tokens
 * appears in exactly one group (enforced by a unit test against ALL_TOKENS).
 */
export const TOKEN_GROUPS: readonly TokenGroup[] = [
  {
    id: "brand",
    title: "Brand colors",
    description: "Primary actions, links and brand accents.",
    tokens: ["primary", "primaryHover", "primaryActive", "primaryTint", "primaryDark", "secondary", "accent"],
  },
  {
    id: "surfaces",
    title: "Surfaces",
    description: "Page background, raised surfaces and cards.",
    tokens: ["background", "surface", "card"],
  },
  {
    id: "text",
    title: "Text",
    description: "Primary, secondary and muted text colors.",
    tokens: ["text", "textSecondary", "muted"],
  },
  {
    id: "borders",
    title: "Borders, inputs & focus",
    description: "Default and strong borders, form fields and the focus ring.",
    tokens: ["border", "borderStrong", "input", "focusRing"],
  },
  {
    id: "status",
    title: "Status colors",
    description: "Success, warning, danger and info feedback.",
    tokens: ["success", "warning", "danger", "info"],
  },
  {
    id: "foregrounds",
    title: "Foreground overrides",
    description: "Text/icons drawn on top of brand, surface and status colors. Usually left at the derived defaults.",
    tokens: [
      "primaryForeground",
      "secondaryForeground",
      "accentForeground",
      "cardForeground",
      "surfaceForeground",
      "successForeground",
      "warningForeground",
      "dangerForeground",
      "infoForeground",
    ],
    advanced: true,
  },
  {
    id: "charts",
    title: "Charts",
    description: "Categorical chart series colors.",
    tokens: ["chart1", "chart2", "chart3", "chart4", "chart5"],
    advanced: true,
  },
  {
    id: "sidebar",
    title: "Sidebar",
    description: "Dashboard sidebar surface, text and accents.",
    tokens: [
      "sidebar",
      "sidebarForeground",
      "sidebarPrimary",
      "sidebarPrimaryForeground",
      "sidebarAccent",
      "sidebarAccentForeground",
      "sidebarBorder",
      "sidebarRing",
    ],
    advanced: true,
  },
];

/** Human label for a token, e.g. "primaryHover" → "Primary hover". */
export function tokenLabel(token: SemanticToken): string {
  const spaced = token
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/(\d+)$/g, " $1")
    .toLowerCase();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

// ── equality / diffing ───────────────────────────────────────────────────────

/** Order-insensitive equality over the known token keys (unknown keys ignored). */
export function tokensEqual(a: PaletteTokens | null | undefined, b: PaletteTokens | null | undefined): boolean {
  for (const token of ALL_TOKENS) {
    const av = a?.[token] ?? null;
    const bv = b?.[token] ?? null;
    if (av !== bv) {
      // "" and undefined both mean "not set".
      if ((av === "" || av === null) && (bv === "" || bv === null)) continue;
      return false;
    }
  }
  return true;
}

/** Keys whose values differ between two token maps ("" ≡ unset). */
export function diffTokenKeys(base: PaletteTokens | null | undefined, next: PaletteTokens | null | undefined): SemanticToken[] {
  return ALL_TOKENS.filter((token) => {
    const av = base?.[token] ?? null;
    const bv = next?.[token] ?? null;
    if (av === bv) return false;
    return !((av === "" || av === null) && (bv === "" || bv === null));
  });
}

// ── payload builders ─────────────────────────────────────────────────────────

/**
 * Strips empty values and unknown keys from an editor token map before it is
 * sent to the API. Throws nothing — invalid values are left in place so the
 * server's validator can reject them with a precise issue list (the UI also
 * blocks saving while client-side validation fails).
 */
export function sanitizeTokens(tokens: PaletteTokens): PaletteTokens {
  const out: PaletteTokens = {};
  for (const token of ALL_TOKENS) {
    const value = tokens[token];
    if (typeof value !== "string") continue;
    const trimmed = value.trim();
    if (trimmed === "") continue;
    out[token] = trimmed;
  }
  return out;
}

export interface EditorDraft {
  name: string;
  description: string;
  tokens: PaletteTokens;
  darkTokens: PaletteTokens | null;
}

export interface EditorBaseline extends EditorDraft {
  updatedAt: string;
}

export function isEditorDirty(draft: EditorDraft, baseline: EditorBaseline): boolean {
  if (draft.name.trim() !== baseline.name.trim()) return true;
  if (draft.description.trim() !== (baseline.description ?? "").trim()) return true;
  if (!tokensEqual(draft.tokens, baseline.tokens)) return true;
  return !tokensEqual(draft.darkTokens, baseline.darkTokens);
}

export interface UpdatePayload {
  name?: string;
  description?: string | null;
  tokens?: PaletteTokens;
  darkTokens?: PaletteTokens | null;
  expectedUpdatedAt: string;
}

/**
 * Minimal PATCH body for the current draft: only changed fields plus the
 * optimistic-concurrency stamp. An empty dark-override map is sent as null
 * (clear), matching the backend's explicit-null convention.
 */
export function buildUpdatePayload(draft: EditorDraft, baseline: EditorBaseline): UpdatePayload {
  const payload: UpdatePayload = { expectedUpdatedAt: baseline.updatedAt };
  const name = draft.name.trim();
  if (name !== baseline.name.trim()) payload.name = name;
  const description = draft.description.trim();
  if (description !== (baseline.description ?? "").trim()) payload.description = description === "" ? null : description;
  if (!tokensEqual(draft.tokens, baseline.tokens)) payload.tokens = sanitizeTokens(draft.tokens);
  if (!tokensEqual(draft.darkTokens, baseline.darkTokens)) {
    const dark = sanitizeTokens(draft.darkTokens ?? {});
    payload.darkTokens = Object.keys(dark).length === 0 ? null : dark;
  }
  return payload;
}

// ── client-side validation ───────────────────────────────────────────────────

export type TokenFieldErrors = Partial<Record<SemanticToken, string>>;

/**
 * Per-token error map for the light token map. Core tokens are required;
 * companion tokens are optional but must be valid colors when present.
 * Reuses the Part 1 validator — no duplicate schema here.
 */
export function validateTokenDraft(tokens: PaletteTokens): { ok: boolean; errors: TokenFieldErrors } {
  const result = validatePaletteTokens(sanitizeTokens(tokens));
  if (result.ok) return { ok: true, errors: {} };
  const errors: TokenFieldErrors = {};
  for (const issue of result.issues) {
    if ((ALL_TOKENS as readonly string[]).includes(issue.token)) {
      errors[issue.token as SemanticToken] = issue.message;
    }
  }
  return { ok: false, errors };
}

/**
 * Dark overrides are a partial map: every provided value must be a valid
 * color; missing keys simply inherit the light value.
 */
export function validateDarkDraft(darkTokens: PaletteTokens | null): { ok: boolean; errors: TokenFieldErrors } {
  const errors: TokenFieldErrors = {};
  if (!darkTokens) return { ok: true, errors };
  for (const token of ALL_TOKENS) {
    const value = darkTokens[token];
    if (value === undefined || value.trim() === "") continue;
    if (!isValidColorValue(value)) errors[token] = "Must be a CSS color (hex, rgb(a), hsl(a) or oklch).";
  }
  return { ok: Object.keys(errors).length === 0, errors };
}

// ── list filtering ───────────────────────────────────────────────────────────

export interface PaletteListItem {
  name: string;
  description: string | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
}

/** Case-insensitive name/description search plus an optional status filter. */
export function filterPalettes<T extends PaletteListItem>(palettes: readonly T[], search: string, status: "ALL" | T["status"]): T[] {
  const q = search.trim().toLowerCase();
  return palettes.filter((p) => {
    if (status !== "ALL" && p.status !== status) return false;
    if (q === "") return true;
    return p.name.toLowerCase().includes(q) || (p.description ?? "").toLowerCase().includes(q);
  });
}

// ── UX-only action predicates (mirror the backend rules) ─────────────────────

export interface PaletteActionState {
  kind: "PRESET" | "CUSTOM";
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  assignmentCount: number;
  versionCount: number;
}

/** Only DRAFT palettes are editable (published palettes are frozen). */
export const canEditPalette = (p: PaletteActionState) => p.status === "DRAFT";
/** Publish is possible from DRAFT and PUBLISHED (re-publish bumps a version), never ARCHIVED. */
export const canPublishPalette = (p: PaletteActionState) => p.status !== "ARCHIVED";
/** Archive is blocked while any scope assignment references the palette. */
export const canArchivePalette = (p: PaletteActionState) => p.status !== "ARCHIVED" && p.assignmentCount === 0;
/** Delete: never-published CUSTOM palettes with no assignments only. */
export const canDeletePalette = (p: PaletteActionState) =>
  p.kind === "CUSTOM" && p.assignmentCount === 0 && p.versionCount === 0;
/** Rollback needs publish history; DRAFT palettes have none. */
export const canRollbackPalette = (p: PaletteActionState) => p.status !== "DRAFT" && p.versionCount > 0;
/** Restore-default applies to built-in presets that are not archived. */
export const canRestoreDefaultPalette = (p: PaletteActionState) => p.kind === "PRESET" && p.status !== "ARCHIVED";

// ── swatch strip for list cards ──────────────────────────────────────────────

const SWATCH_TOKENS = ["primary", "secondary", "accent", "success", "warning", "danger", "info"] as const;

/** Up to 7 representative colors for a palette card, in a stable order. */
export function swatchColors(tokens: PaletteTokens, fallback: (token: SemanticToken) => string): string[] {
  return SWATCH_TOKENS.map((token) => {
    const value = tokens[token];
    return typeof value === "string" && value.trim() !== "" ? value : fallback(token);
  });
}

/**
 * Display-safe resolution: merges the (possibly partial or mid-edit invalid)
 * map over the Neutral production defaults, drops any invalid values, and
 * resolves — so preview/swatch rendering is always well-formed. Validation
 * errors are surfaced separately by validateTokenDraft; this function never
 * throws and never returns undefined values.
 */
export function resolvedForDisplay(tokens: PaletteTokens, darkTokens?: PaletteTokens | null): ResolvedPaletteTokens {
  const merged: Record<string, string> = { ...NEUTRAL_PRESET.tokens } as Record<string, string>;
  for (const [key, value] of Object.entries(sanitizeTokens(tokens))) {
    if (isValidColorValue(value)) merged[key] = value;
  }
  if (darkTokens) {
    for (const [key, value] of Object.entries(sanitizeTokens(darkTokens))) {
      if (isValidColorValue(value)) merged[key] = value;
    }
  }
  const resolved = resolvePaletteTokens(merged);
  if (resolved.ok) return resolved.tokens;
  // Unreachable in practice (cores come from the Neutral constants), but the
  // result union demands a fallback and Neutral always resolves.
  const fallback = resolvePaletteTokens(NEUTRAL_PRESET.tokens);
  return fallback.ok ? fallback.tokens : ({} as ResolvedPaletteTokens);
}

/** Swatch colors resolved through the display-safe path (list cards, version rows). */
export function displaySwatches(tokens: PaletteTokens): string[] {
  const resolved = resolvedForDisplay(tokens);
  return swatchColors(tokens, (token) => resolved[token]);
}

// ── API error mapping ────────────────────────────────────────────────────────

export type PaletteApiError =
  | { kind: "conflict"; message: string }
  | { kind: "validation"; message: string }
  | { kind: "forbidden"; message: string }
  | { kind: "not-found"; message: string }
  | { kind: "name-taken"; message: string }
  | { kind: "in-use"; message: string }
  | { kind: "network"; message: string }
  | { kind: "unknown"; message: string };

interface ErrorBody {
  error?: unknown;
  code?: unknown;
}

function bodyOf(error: unknown): ErrorBody | null {
  if (typeof error !== "object" || error === null) return null;
  const data = (error as { data?: unknown }).data;
  if (typeof data !== "object" || data === null) return null;
  return data as ErrorBody;
}

function statusOf(error: unknown): number | null {
  if (typeof error !== "object" || error === null) return null;
  const status = (error as { status?: unknown }).status;
  return typeof status === "number" ? status : null;
}

/** The 409 DRAFT_CONFLICT protocol — the editor reloads instead of saving over someone else's work. */
export function isConflictError(error: unknown): boolean {
  const body = bodyOf(error);
  return statusOf(error) === 409 && body?.code === "DRAFT_CONFLICT";
}

/** Best-effort extraction of the backend's human message from an RTK error. */
export function describePaletteError(error: unknown): PaletteApiError {
  const status = statusOf(error);
  const body = bodyOf(error);
  const message = typeof body?.error === "string" ? body.error : "Something went wrong. Please try again.";
  if (status === null) return { kind: "network", message: "Could not reach the server. Check your connection and try again." };
  if (status === 409 && body?.code === "DRAFT_CONFLICT") return { kind: "conflict", message };
  if (status === 409 && body?.code === "NAME_TAKEN") return { kind: "name-taken", message };
  if (status === 409 && (body?.code === "IN_USE" || body?.code === "HAS_HISTORY")) return { kind: "in-use", message };
  if (status === 400 || status === 422) return { kind: "validation", message };
  if (status === 401 || status === 403) return { kind: "forbidden", message: "You do not have permission to manage theme palettes." };
  if (status === 404) return { kind: "not-found", message };
  return { kind: "unknown", message };
}
