// lib/product-card/editor.ts
//
// Pure logic behind the ADMIN product card editor
// (components/admin/product-card-editor). React-free so every rule — preview
// per breakpoint, validation, API error mapping and the save / publish /
// restore workflows (including the storefront cache refresh) — is unit tested
// with mocked API calls (tests/product-card-editor.test.mjs).
//
// Validation uses the same schema the storefront and backend agree on
// (./config, kept in parity with the backend by tests/product-card-parity).
import { productCardConfigSchema, type ProductCardConfig } from "./config";

// ── responsive fields & preview ─────────────────────────────────────────────

export type Breakpoint = "mobile" | "tablet" | "desktop";
export const BREAKPOINTS: readonly Breakpoint[] = ["mobile", "tablet", "desktop"];

/** Every per-breakpoint field in the schema ({ mobile, tablet, desktop }). */
export const RESPONSIVE_PATHS = [
  "card.imageGap",
  "card.contentPaddingX",
  "image.height",
  "title.size",
  "price.size",
  "price.originalSize",
] as const;

/**
 * The card's CSS picks mobile / tablet / desktop values by VIEWPORT width
 * (media queries), so a small preview box on a wide admin screen would still
 * show desktop values. The preview therefore renders a copy of the config in
 * which every responsive field holds the chosen breakpoint's value at all
 * three breakpoints — the real card then shows exactly that breakpoint at any
 * admin screen size. Preview only; never saved.
 */
export function previewConfigFor(config: ProductCardConfig, bp: Breakpoint): ProductCardConfig {
  const out = structuredClone(config);
  for (const path of RESPONSIVE_PATHS) {
    const r = getIn(out, path) as Record<Breakpoint, number>;
    const v = r[bp];
    setInPlace(out, path, { mobile: v, tablet: v, desktop: v });
  }
  return out;
}

// ── immutable path helpers ──────────────────────────────────────────────────

export function getIn(obj: unknown, path: string): unknown {
  let o: unknown = obj;
  for (const k of path.split(".")) {
    if (o === null || typeof o !== "object") return undefined;
    o = (o as Record<string, unknown>)[k];
  }
  return o;
}

function setInPlace(obj: unknown, path: string, value: unknown) {
  const keys = path.split(".");
  let o = obj as Record<string, unknown>;
  for (const k of keys.slice(0, -1)) o = o[k] as Record<string, unknown>;
  o[keys[keys.length - 1]] = value;
}

/** Optional settings that may be absent from a config (older configs lack them). */
export const OPTIONAL_PATHS: ReadonlySet<string> = new Set(["addToCart.label", "grid"]);

/**
 * Returns a new config with one field changed. Only existing paths, or the
 * known optional ones, are allowed; `undefined` removes an optional setting.
 */
export function setIn(config: ProductCardConfig, path: string, value: unknown): ProductCardConfig {
  const keys = path.split(".");
  const last = keys[keys.length - 1];
  const parent = keys.length === 1 ? config : getIn(config, keys.slice(0, -1).join("."));
  const optional = OPTIONAL_PATHS.has(path);
  if (!parent || typeof parent !== "object" || (!optional && (keys.length < 2 || !(last in parent)))) {
    throw new Error(`Unknown product card setting: ${path}`);
  }
  if (value === undefined && !optional) throw new Error(`Setting ${path} cannot be removed`);
  const out = structuredClone(config);
  if (value === undefined) {
    const target = (keys.length === 1 ? out : getIn(out, keys.slice(0, -1).join("."))) as Record<string, unknown>;
    delete target[last];
  } else {
    setInPlace(out, path, value);
  }
  return out;
}

/** Stable deep equality for configs (key order independent). */
export function sameConfig(a: unknown, b: unknown): boolean {
  return stableStringify(a) === stableStringify(b);
}
function stableStringify(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(stableStringify).join(",")}]`;
  if (v && typeof v === "object") {
    return `{${Object.keys(v as object)
      .filter((k) => (v as Record<string, unknown>)[k] !== undefined)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${stableStringify((v as Record<string, unknown>)[k])}`)
      .join(",")}}`;
  }
  return JSON.stringify(v);
}

// ── validation ──────────────────────────────────────────────────────────────

export type FieldErrors = Record<string, string>;

/** Validates with the shared schema. Field errors are keyed by dotted path. */
export function validateConfig(config: unknown): { ok: true; config: ProductCardConfig } | { ok: false; fieldErrors: FieldErrors } {
  const parsed = productCardConfigSchema.safeParse(config);
  if (parsed.success) return { ok: true, config: parsed.data };
  return { ok: false, fieldErrors: issuesToFieldErrors(parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message }))) };
}

/** Backend `issues` ([{ path: "card.radius", message }]) → { "card.radius": message }. */
export function issuesToFieldErrors(issues: unknown): FieldErrors {
  const out: FieldErrors = {};
  if (!Array.isArray(issues)) return out;
  for (const i of issues) {
    if (!i || typeof i !== "object") continue;
    const rawPath = (i as { path?: unknown }).path;
    const path = Array.isArray(rawPath) ? rawPath.join(".") : typeof rawPath === "string" ? rawPath : "";
    const message = typeof (i as { message?: unknown }).message === "string" ? (i as { message: string }).message : "Invalid value";
    const key = path || "_form";
    if (!out[key]) out[key] = message;
  }
  return out;
}

// ── API errors ──────────────────────────────────────────────────────────────

export type EditorErrorKind = "auth" | "forbidden" | "conflict" | "validation" | "noDraft" | "noPrevious" | "network" | "server";

export interface EditorError {
  kind: EditorErrorKind;
  status: number | null;
  code: string | null;
  message: string;
  fieldErrors: FieldErrors;
}

/** Any RTK Query / fetch error → one user-facing editor error. Never throws. */
export function describeApiError(error: unknown): EditorError {
  const e = (error && typeof error === "object" ? error : {}) as { status?: unknown; data?: unknown };
  const status = typeof e.status === "number" ? e.status : null;
  const data = (e.data && typeof e.data === "object" ? e.data : {}) as { error?: unknown; message?: unknown; code?: unknown; issues?: unknown };
  const code = typeof data.code === "string" ? data.code : null;
  const serverMessage = typeof data.error === "string" ? data.error : typeof data.message === "string" ? data.message : null;
  const make = (kind: EditorErrorKind, message: string, fieldErrors: FieldErrors = {}): EditorError => ({ kind, status, code, message, fieldErrors });

  if (status === null) return make("network", "Could not reach the server. Check your connection and try again.");
  if (status === 401) return make("auth", "Your session has expired. Please sign in again.");
  if (status === 403) return make("forbidden", "Only administrators can change the product card design.");
  if (status === 409 && code === "DRAFT_CONFLICT") {
    return make("conflict", "Another admin changed the draft since you loaded it. Reload the editor to see the latest draft before saving or publishing.");
  }
  if (status === 409 && code === "NO_DRAFT") return make("noDraft", "There is no saved draft to publish. Save a draft first.");
  if (status === 404 && code === "NO_PREVIOUS") return make("noPrevious", "There is no previously published design to restore.");
  if (status === 400 || status === 422) {
    const fieldErrors = issuesToFieldErrors(data.issues);
    return make("validation", serverMessage ? `The design was rejected: ${serverMessage}` : "Some settings are invalid.", fieldErrors);
  }
  return make("server", serverMessage ?? "Something went wrong on the server. Nothing was changed.");
}

// ── workflows (API calls injected; they must reject on non-2xx, like RTK's .unwrap()) ──

export type Outcome<T = undefined> =
  | { ok: true; tone: "success" | "warning" | "info"; message: string; data: T }
  | { ok: false; error: EditorError };

interface Envelope<T> { data: T }

/** Validate locally first; only a valid config reaches the API. */
export async function saveDraftWorkflow<R extends { config: ProductCardConfig; updatedAt: string }>(
  save: (body: { config: ProductCardConfig; expectedUpdatedAt: string | null }) => Promise<Envelope<R>>,
  config: ProductCardConfig,
  expectedUpdatedAt: string | null,
): Promise<Outcome<R | undefined>> {
  const v = validateConfig(config);
  if (!v.ok) {
    return {
      ok: false,
      error: { kind: "validation", status: null, code: "CLIENT_VALIDATION", message: "Fix the highlighted settings before saving.", fieldErrors: v.fieldErrors },
    };
  }
  try {
    const res = await save({ config: v.config, expectedUpdatedAt });
    return { ok: true, tone: "success", message: "Draft saved. It is not live until you publish it.", data: res.data };
  } catch (error) {
    return { ok: false, error: describeApiError(error) };
  }
}

/**
 * Publish the SAVED draft with the version the editor last saw. The storefront
 * cache is refreshed only after the backend confirmed the publish; a refresh
 * failure is reported separately (the publish itself still happened).
 */
export async function publishWorkflow<R extends { unchanged: boolean }>(
  publish: (body: { expectedDraftUpdatedAt: string | null }) => Promise<Envelope<R>>,
  refreshCache: () => Promise<boolean>,
  expectedDraftUpdatedAt: string | null,
): Promise<Outcome<R | undefined>> {
  let res: Envelope<R>;
  try {
    res = await publish({ expectedDraftUpdatedAt });
  } catch (error) {
    return { ok: false, error: describeApiError(error) };
  }
  if (res.data.unchanged) {
    return { ok: true, tone: "info", message: "The draft is identical to the published design — nothing was published.", data: res.data };
  }
  const refreshed = await safeRefresh(refreshCache);
  return refreshed
    ? { ok: true, tone: "success", message: "Published successfully. All product listings now use this design.", data: res.data }
    : {
        ok: true,
        tone: "warning",
        message: "Published, but the storefront cache refresh failed. Listings will show the new design within 5 minutes.",
        data: res.data,
      };
}

/** Restore the previously published design; same cache-refresh rule as publishing. */
export async function restoreWorkflow<R>(
  restore: () => Promise<Envelope<R>>,
  refreshCache: () => Promise<boolean>,
): Promise<Outcome<R | undefined>> {
  let res: Envelope<R>;
  try {
    res = await restore();
  } catch (error) {
    return { ok: false, error: describeApiError(error) };
  }
  const refreshed = await safeRefresh(refreshCache);
  return refreshed
    ? { ok: true, tone: "success", message: "Previous design restored and live.", data: res.data }
    : {
        ok: true,
        tone: "warning",
        message: "Previous design restored, but the storefront cache refresh failed. Listings will update within 5 minutes.",
        data: res.data,
      };
}

/** Discard / reset-defaults: draft-only server actions (nothing goes live). */
export async function draftActionWorkflow<R>(action: () => Promise<Envelope<R>>, successMessage: string): Promise<Outcome<R | undefined>> {
  try {
    const res = await action();
    return { ok: true, tone: "success", message: successMessage, data: res.data };
  } catch (error) {
    return { ok: false, error: describeApiError(error) };
  }
}

async function safeRefresh(refreshCache: () => Promise<boolean>): Promise<boolean> {
  try {
    return (await refreshCache()) === true;
  } catch {
    return false;
  }
}

// ── action availability ─────────────────────────────────────────────────────

export interface EditorState {
  dirty: boolean;
  hasFieldErrors: boolean;
  busy: boolean;
  draftUpdatedAt: string | null;
  hasUnpublishedChanges: boolean;
  previousAvailable: boolean;
}

/** Why an action is unavailable (null = allowed). Publishing needs a saved, unchanged-locally draft. */
export function blockedReason(action: "save" | "publish" | "revert" | "discard" | "reset" | "restore", s: EditorState): string | null {
  if (s.busy) return "Please wait for the current action to finish.";
  switch (action) {
    case "save":
      if (!s.dirty) return "No unsaved changes.";
      if (s.hasFieldErrors) return "Fix the highlighted settings first.";
      return null;
    case "revert":
      return s.dirty ? null : "No unsaved changes.";
    case "publish":
      if (s.dirty) return "Save your changes first — publishing uses the saved draft.";
      if (!s.draftUpdatedAt) return "Save a draft first.";
      if (!s.hasUnpublishedChanges) return "The saved draft is already the published design.";
      return null;
    case "discard":
      return s.draftUpdatedAt ? null : "There is no saved draft to discard.";
    case "reset":
      return null;
    case "restore":
      return s.previousAvailable ? null : "There is no previously published design.";
  }
}
