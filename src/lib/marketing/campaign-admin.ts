// src/lib/marketing/campaign-admin.ts
//
// Pure helpers for the vendor-programme tabs of the Campaigns page
// (unit-tested in tests/marketing-admin-ui.test.mjs): programme form ⇄
// request body, changed-fields updates, mapping every backend error shape to
// per-field errors / the tightening warning / rule violations, ৳ formatting.
// The server is authoritative — client checks only catch obvious mistakes.
// The live window (start/end) belongs to the campaign page, not this form.

import { fromDateTimeLocal, toDateTimeLocal } from "@/lib/campaign/campaign-editor";
import type { AdminProgramme, ProgrammeBody, RuleViolation } from "@/features/marketingAdminApi";

export const REGISTRATION_FIELDS = ["registrationStartAt", "registrationEndAt"] as const;

export interface ProgrammeFormState {
  registrationStartAt: string; // datetime-local (browser local time)
  registrationEndAt: string;
  categoryIds: string[];
  minDiscountPercent: string;
  minStock: string;
  maxProductsPerVendor: string; // "" = no limit
}

/** Form fields plus `liveWindow` for errors about the page's start/end dates. */
export type ProgrammeField = keyof ProgrammeFormState | "liveWindow";

/** A field error is either an i18n code (client/known server cases) or server text. */
export type FieldError = { code: string } | { text: string };
export type FieldErrors = Partial<Record<ProgrammeField, FieldError>>;

export const emptyProgrammeForm = (): ProgrammeFormState => ({
  registrationStartAt: "",
  registrationEndAt: "",
  categoryIds: [],
  minDiscountPercent: "",
  minStock: "0",
  maxProductsPerVendor: "",
});

export function programmeToForm(p: AdminProgramme): ProgrammeFormState {
  return {
    registrationStartAt: toDateTimeLocal(p.registrationStartAt),
    registrationEndAt: toDateTimeLocal(p.registrationEndAt),
    categoryIds: p.categories.map((x) => x.categoryId).sort(),
    minDiscountPercent: String(Number(p.minDiscountPercent)),
    minStock: String(p.minStock),
    maxProductsPerVendor: p.maxProductsPerVendor === null ? "" : String(p.maxProductsPerVendor),
  };
}

const isNum = (s: string) => s.trim() !== "" && Number.isFinite(Number(s));

/** Obvious client-side mistakes only; the server re-validates everything.
 *  `pageStart` (ISO) — registration must close by the time the campaign starts. */
export function validateProgrammeForm(f: ProgrammeFormState, pageStart?: string | null): FieldErrors {
  const e: FieldErrors = {};
  for (const k of REGISTRATION_FIELDS) if (!f[k] || fromDateTimeLocal(f[k]) === undefined) e[k] = { code: "dateRequired" };
  if (!e.registrationStartAt && !e.registrationEndAt && f.registrationStartAt >= f.registrationEndAt) e.registrationEndAt = { code: "registrationOrder" };
  if (!e.registrationEndAt && pageStart && f.registrationEndAt > toDateTimeLocal(pageStart)) e.registrationEndAt = { code: "registrationBeforeStart" };
  if (!isNum(f.minDiscountPercent) || Number(f.minDiscountPercent) < 0 || Number(f.minDiscountPercent) > 100) e.minDiscountPercent = { code: "percent" };
  else if (!/^\d+(\.\d{1,2})?$/.test(f.minDiscountPercent.trim())) e.minDiscountPercent = { code: "percentDecimals" };
  if (!/^\d+$/.test(f.minStock.trim())) e.minStock = { code: "wholeNumber" };
  if (f.maxProductsPerVendor.trim() && (!/^\d+$/.test(f.maxProductsPerVendor.trim()) || Number(f.maxProductsPerVendor) < 1)) e.maxProductsPerVendor = { code: "positiveWhole" };
  return e;
}

export function formToBody(f: ProgrammeFormState): ProgrammeBody {
  return {
    registrationStartAt: fromDateTimeLocal(f.registrationStartAt)!,
    registrationEndAt: fromDateTimeLocal(f.registrationEndAt)!,
    categoryIds: [...f.categoryIds],
    minDiscountPercent: Number(f.minDiscountPercent),
    minStock: Number(f.minStock),
    maxProductsPerVendor: f.maxProductsPerVendor.trim() ? Number(f.maxProductsPerVendor) : null,
  };
}

/** Only the fields that changed. A published programme never sends its registration window (frozen). */
export function buildProgrammeUpdate(f: ProgrammeFormState, p: AdminProgramme): Partial<ProgrammeBody> {
  const before = programmeToForm(p);
  const next = formToBody(f);
  const out: Partial<ProgrammeBody> = {};
  if (p.status !== "PUBLISHED") for (const k of REGISTRATION_FIELDS) if (f[k] !== before[k]) out[k] = next[k];
  if (Number(f.minDiscountPercent) !== Number(before.minDiscountPercent)) out.minDiscountPercent = next.minDiscountPercent;
  if (Number(f.minStock) !== Number(before.minStock)) out.minStock = next.minStock;
  if (f.maxProductsPerVendor.trim() !== before.maxProductsPerVendor) out.maxProductsPerVendor = next.maxProductsPerVendor;
  if ([...f.categoryIds].sort().join() !== before.categoryIds.join()) out.categoryIds = next.categoryIds;
  return out;
}

// ── server errors ───────────────────────────────────────────────────────────

export interface MappedError {
  status: number | string;
  message: string;
  fieldErrors: FieldErrors;
  /** 409 on rule tightening: which rules, and how many registrations would fail. */
  tightening?: { tightened: string[]; affectedRegistrations: number };
  /** 422 on approval: the rules the registration breaks now. */
  violations?: RuleViolation[];
}

const FORM_KEYS = new Set<string>(Object.keys(emptyProgrammeForm()));
const asField = (k: string): ProgrammeField | undefined => (FORM_KEYS.has(k) ? (k as ProgrammeField) : k === "startAt" || k === "endAt" ? "liveWindow" : undefined);

/** RTK Query error → what the screen needs. Never throws. */
export function mapServerError(err: unknown): MappedError {
  const e = (err ?? {}) as { status?: number | string; data?: any };
  const data = e.data ?? {};
  const out: MappedError = { status: e.status ?? "UNKNOWN", message: typeof data.message === "string" ? data.message : "", fieldErrors: {} };
  if (Array.isArray(data.errors)) {
    for (const it of data.errors) {
      const f = asField(String(it?.path ?? "").split(".")[0]);
      if (f && !out.fieldErrors[f]) out.fieldErrors[f] = { text: String(it.message) };
    }
  }
  const d = data.details;
  if (d && typeof d === "object") {
    if (Array.isArray(d.violations)) out.violations = d.violations;
    if (Array.isArray(d.tightened)) out.tightening = { tightened: d.tightened, affectedRegistrations: Number(d.affectedRegistrations ?? 0) };
    if (Array.isArray(d.loosened)) for (const k of d.loosened) { const f = asField(k); if (f) out.fieldErrors[f] = { code: "loosened" }; }
    if (Array.isArray(d.fields)) for (const k of d.fields) { const f = asField(k); if (f) out.fieldErrors[f] = { code: "datesLocked" }; }
    if (Array.isArray(d.categoryIds)) out.fieldErrors.categoryIds = { code: "unknownCategories" };
    // 422 date windows: { field: message } — registration fields, or the page's live window.
    for (const k of [...REGISTRATION_FIELDS, "startAt", "endAt"]) {
      const f = asField(k);
      if (f && typeof d[k] === "string" && !out.fieldErrors[f]) out.fieldErrors[f] = { text: d[k] };
    }
  }
  return out;
}

// ── formatting ──────────────────────────────────────────────────────────────

/** ৳ with exactly 2 decimals. Bangla locale uses Bangla digits. */
export function formatTaka(value: string | number | null | undefined, locale: string = "en"): string {
  const n = Number(value);
  if (value === null || value === undefined || value === "" || !Number.isFinite(n)) return "—";
  const fmt = new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `৳${fmt.format(n)}`;
}

/** Discount of the campaign price vs a price, in % (2 decimals, rounded down). */
export function discountPercent(campaignPrice: string, against: string): string {
  const a = Number(against);
  const c = Number(campaignPrice);
  if (!(a > 0) || !Number.isFinite(c)) return "—";
  return (Math.floor(((a - c) / a) * 10000) / 100).toFixed(2);
}
