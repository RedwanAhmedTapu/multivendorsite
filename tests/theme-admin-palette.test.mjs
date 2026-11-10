// tests/theme-admin-palette.test.mjs
//
// Part 3 — admin palette UI helpers (src/lib/palette/editor.ts).
// Pure logic, no dependencies beyond node:test:
//   node --test tests/theme-admin-palette.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";

import { ALL_TOKENS, CORE_TOKENS, COMPANION_TOKENS } from "../src/lib/palette/tokens.ts";
import { NEUTRAL_PRESET, EMERALD_PRESET } from "../src/lib/palette/presets.ts";
import {
  TOKEN_GROUPS,
  buildUpdatePayload,
  canArchivePalette,
  canDeletePalette,
  canEditPalette,
  canPublishPalette,
  canRestoreDefaultPalette,
  canRollbackPalette,
  describePaletteError,
  diffTokenKeys,
  displaySwatches,
  filterPalettes,
  isConflictError,
  isEditorDirty,
  resolvedForDisplay,
  sanitizeTokens,
  swatchColors,
  tokenLabel,
  tokensEqual,
  validateDarkDraft,
  validateTokenDraft,
} from "../src/lib/palette/editor.ts";

const rtkError = (status, body) => ({ status, data: body });

// ── token groups ─────────────────────────────────────────────────────────────

test("TOKEN_GROUPS covers every semantic token exactly once", () => {
  const seen = [];
  for (const group of TOKEN_GROUPS) {
    for (const token of group.tokens) {
      assert.ok(!seen.includes(token), `duplicate token in groups: ${token}`);
      seen.push(token);
    }
  }
  assert.equal(seen.length, ALL_TOKENS.length);
  assert.deepEqual(new Set(seen), new Set(ALL_TOKENS));
});

test("tokenLabel humanizes camelCase and numeric suffixes", () => {
  assert.equal(tokenLabel("primary"), "Primary");
  assert.equal(tokenLabel("primaryHover"), "Primary hover");
  assert.equal(tokenLabel("chart5"), "Chart 5");
  assert.equal(tokenLabel("sidebarPrimaryForeground"), "Sidebar primary foreground");
});

// ── equality / diffing ───────────────────────────────────────────────────────

test("tokensEqual is order-insensitive and treats '' as unset", () => {
  assert.ok(tokensEqual({ primary: "#111" }, { primary: "#111" }));
  assert.ok(tokensEqual({ primary: "#111", accent: "" }, { primary: "#111" }));
  assert.ok(tokensEqual(null, {}));
  assert.ok(!tokensEqual({ primary: "#111" }, { primary: "#222" }));
  assert.ok(!tokensEqual({ primary: "#111" }, {}));
});

test("diffTokenKeys reports only changed known tokens", () => {
  assert.deepEqual(diffTokenKeys({ primary: "#111" }, { primary: "#111", accent: "" }), []);
  assert.deepEqual(diffTokenKeys({ primary: "#111" }, { primary: "#222", accent: "#333" }), ["primary", "accent"]);
});

// ── sanitize ─────────────────────────────────────────────────────────────────

test("sanitizeTokens trims, strips empty values and unknown keys", () => {
  const out = sanitizeTokens({ primary: "  #111  ", accent: "", bogus: "#000", danger: "red" });
  assert.deepEqual(out, { primary: "#111", danger: "red" });
});

// ── update payload ───────────────────────────────────────────────────────────

const BASELINE = {
  name: "Festive",
  description: "Eid colors",
  tokens: { ...EMERALD_PRESET.tokens },
  darkTokens: null,
  updatedAt: "2026-11-09T03:00:00.000Z",
};

test("buildUpdatePayload sends only changed fields plus the concurrency stamp", () => {
  const payload = buildUpdatePayload(
    { name: "Festive", description: "Eid colors", tokens: { ...EMERALD_PRESET.tokens }, darkTokens: {} },
    BASELINE,
  );
  assert.deepEqual(payload, { expectedUpdatedAt: BASELINE.updatedAt });
});

test("buildUpdatePayload maps empty description to null and diffs tokens", () => {
  const tokens = { ...EMERALD_PRESET.tokens, primary: "#123456" };
  const payload = buildUpdatePayload({ name: "Renamed", description: "", tokens, darkTokens: {} }, BASELINE);
  assert.equal(payload.name, "Renamed");
  assert.equal(payload.description, null);
  assert.deepEqual(payload.tokens, tokens);
  assert.equal(payload.darkTokens, undefined); // null ≡ empty — no change
  assert.equal(payload.expectedUpdatedAt, BASELINE.updatedAt);
});

test("buildUpdatePayload sends dark overrides and explicit null to clear", () => {
  const withDark = buildUpdatePayload(
    { name: "Festive", description: "Eid colors", tokens: { ...EMERALD_PRESET.tokens }, darkTokens: { background: "#000000" } },
    BASELINE,
  );
  assert.deepEqual(withDark.darkTokens, { background: "#000000" });

  const cleared = buildUpdatePayload(
    { name: "Festive", description: "Eid colors", tokens: { ...EMERALD_PRESET.tokens }, darkTokens: {} },
    { ...BASELINE, darkTokens: { background: "#000000" } },
  );
  assert.equal(cleared.darkTokens, null);
});

// ── dirty tracking ───────────────────────────────────────────────────────────

test("isEditorDirty detects name, description, token and dark-token changes", () => {
  const clean = { name: "Festive", description: "Eid colors", tokens: { ...EMERALD_PRESET.tokens }, darkTokens: {} };
  assert.ok(!isEditorDirty(clean, BASELINE));
  assert.ok(isEditorDirty({ ...clean, name: "Other" }, BASELINE));
  assert.ok(isEditorDirty({ ...clean, description: "New" }, BASELINE));
  assert.ok(isEditorDirty({ ...clean, tokens: { ...EMERALD_PRESET.tokens, primary: "#000000" } }, BASELINE));
  assert.ok(isEditorDirty({ ...clean, darkTokens: { background: "#000000" } }, BASELINE));
});

// ── validation ───────────────────────────────────────────────────────────────

test("validateTokenDraft requires core tokens and flags invalid colors", () => {
  const missing = validateTokenDraft({ primary: "#111111" });
  assert.ok(!missing.ok);
  assert.ok(missing.errors.background, "missing core token must be keyed by token name");

  const invalid = validateTokenDraft({ ...NEUTRAL_PRESET.tokens, danger: "url(javascript:x)" });
  assert.ok(!invalid.ok);
  assert.ok(invalid.errors.danger);

  const valid = validateTokenDraft(NEUTRAL_PRESET.tokens);
  assert.ok(valid.ok);
  assert.deepEqual(valid.errors, {});
});

test("validateDarkDraft validates partial overrides only", () => {
  assert.ok(validateDarkDraft(null).ok);
  assert.ok(validateDarkDraft({}).ok);
  assert.ok(validateDarkDraft({ background: "#000" }).ok);
  const bad = validateDarkDraft({ background: "not-a-color;;;" });
  assert.ok(!bad.ok);
  assert.ok(bad.errors.background);
});

// ── list filtering ───────────────────────────────────────────────────────────

test("filterPalettes searches name/description case-insensitively and filters status", () => {
  const palettes = [
    { name: "Neutral", description: "Production", status: "PUBLISHED" },
    { name: "Emerald", description: "Green brand", status: "PUBLISHED" },
    { name: "Festive Sale", description: null, status: "DRAFT" },
  ];
  assert.equal(filterPalettes(palettes, "", "ALL").length, 3);
  assert.deepEqual(filterPalettes(palettes, "festive", "ALL").map((p) => p.name), ["Festive Sale"]);
  assert.deepEqual(filterPalettes(palettes, "GREEN", "ALL").map((p) => p.name), ["Emerald"]);
  assert.equal(filterPalettes(palettes, "", "DRAFT").length, 1);
  assert.equal(filterPalettes(palettes, "festive", "PUBLISHED").length, 0);
});

// ── action predicates (mirror backend rules) ─────────────────────────────────

test("action predicates mirror the backend lifecycle rules", () => {
  const draft = { kind: "CUSTOM", status: "DRAFT", assignmentCount: 0, versionCount: 0 };
  const published = { kind: "CUSTOM", status: "PUBLISHED", assignmentCount: 0, versionCount: 2 };
  const archived = { kind: "CUSTOM", status: "ARCHIVED", assignmentCount: 0, versionCount: 3 };
  const assigned = { kind: "CUSTOM", status: "PUBLISHED", assignmentCount: 1, versionCount: 1 };
  const preset = { kind: "PRESET", status: "PUBLISHED", assignmentCount: 0, versionCount: 1 };

  assert.ok(canEditPalette(draft) && !canEditPalette(published) && !canEditPalette(archived));
  assert.ok(canPublishPalette(draft) && canPublishPalette(published) && !canPublishPalette(archived));
  assert.ok(canArchivePalette(draft) && canArchivePalette(published) && !canArchivePalette(assigned) && !canArchivePalette(archived));
  assert.ok(canDeletePalette(draft));
  assert.ok(!canDeletePalette(published), "publish history blocks delete");
  assert.ok(!canDeletePalette(preset), "presets cannot be deleted");
  assert.ok(!canDeletePalette({ ...draft, assignmentCount: 2 }));
  assert.ok(canRollbackPalette(published) && canRollbackPalette(archived) && !canRollbackPalette(draft));
  assert.ok(canRestoreDefaultPalette(preset) && !canRestoreDefaultPalette(draft));
});

// ── display-safe resolution ──────────────────────────────────────────────────

test("swatchColors keeps palette values and fills gaps from the fallback", () => {
  const swatches = swatchColors({ primary: "#111111", danger: "#ff0000" }, () => "#dddddd");
  assert.deepEqual(swatches, ["#111111", "#dddddd", "#dddddd", "#dddddd", "#dddddd", "#ff0000", "#dddddd"]);
});

test("resolvedForDisplay never throws on partial or invalid input", () => {
  const partial = resolvedForDisplay({ primary: "#123456" });
  assert.equal(partial.primary, "#123456");
  assert.equal(partial.background, NEUTRAL_PRESET.tokens.background);

  const withGarbage = resolvedForDisplay({ primary: ";;bad;;" });
  assert.notEqual(withGarbage.primary, ";;bad;;");
  for (const token of ALL_TOKENS) {
    assert.equal(typeof withGarbage[token], "string", `${token} must resolve to a string`);
    assert.ok(withGarbage[token].length > 0, `${token} must not be empty`);
  }

  const darkMerged = resolvedForDisplay({ primary: "#123456" }, { background: "#000000" });
  assert.equal(darkMerged.background, "#000000");
});

test("displaySwatches returns 7 display-safe colors", () => {
  const swatches = displaySwatches(EMERALD_PRESET.tokens);
  assert.equal(swatches.length, 7);
  assert.equal(swatches[0], EMERALD_PRESET.tokens.primary);
});

// ── error mapping ────────────────────────────────────────────────────────────

test("isConflictError detects only the 409 DRAFT_CONFLICT protocol", () => {
  assert.ok(isConflictError(rtkError(409, { success: false, error: "stale", code: "DRAFT_CONFLICT" })));
  assert.ok(!isConflictError(rtkError(409, { success: false, error: "taken", code: "NAME_TAKEN" })));
  assert.ok(!isConflictError(rtkError(400, { success: false, code: "DRAFT_CONFLICT" })));
  assert.ok(!isConflictError({ data: { code: "DRAFT_CONFLICT" } }));
  assert.ok(!isConflictError(null));
});

test("describePaletteError maps backend codes and statuses to UI kinds", () => {
  assert.equal(describePaletteError(rtkError(409, { code: "DRAFT_CONFLICT", error: "stale" })).kind, "conflict");
  assert.equal(describePaletteError(rtkError(409, { code: "NAME_TAKEN", error: "taken" })).kind, "name-taken");
  assert.equal(describePaletteError(rtkError(409, { code: "IN_USE", error: "assigned" })).kind, "in-use");
  assert.equal(describePaletteError(rtkError(409, { code: "HAS_HISTORY", error: "history" })).kind, "in-use");
  assert.equal(describePaletteError(rtkError(422, { error: "bad tokens" })).kind, "validation");
  assert.equal(describePaletteError(rtkError(403, {})).kind, "forbidden");
  assert.equal(describePaletteError(rtkError(404, { error: "gone" })).kind, "not-found");
  assert.equal(describePaletteError({ status: "FETCH_ERROR" }).kind, "network");
  assert.equal(describePaletteError(rtkError(500, { error: "boom" })).kind, "unknown");
  assert.equal(describePaletteError(rtkError(409, { code: "NAME_TAKEN", error: "taken" })).message, "taken");
});

// ── preset seeds stay creatable ──────────────────────────────────────────────

test("every preset seed passes draft validation (create flow sanity)", () => {
  for (const preset of [NEUTRAL_PRESET, EMERALD_PRESET]) {
    assert.ok(validateTokenDraft(preset.tokens).ok, `${preset.name} must validate`);
    assert.ok(validateDarkDraft(preset.darkTokens ?? null).ok, `${preset.name} dark overrides must validate`);
  }
  // Core/companion split sanity for the editor's "required vs inheritable" UI.
  assert.equal(CORE_TOKENS.length, 20);
  assert.equal(COMPANION_TOKENS.length, 23);
});
