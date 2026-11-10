// lib/offers/offer-view.ts
//
// Offer management (admin + vendor) — pure presentation logic shared by both
// dashboards. No React, no API calls: every value is derived from fields the
// offer endpoints actually return (see features/offerApi.ts). Nothing here
// invents a metric; when the data cannot answer a question the helpers say so.

import type { Offer, OfferFilters, OfferStatus, OfferType, DiscountType } from "@/features/offerApi";

/** What the listing shows for one offer. Derived, never stored. */
export type OfferDisplayStatus = "active" | "scheduled" | "pending" | "inactive" | "expired" | "rejected";

export const DISPLAY_STATUS_LABEL: Record<OfferDisplayStatus, string> = {
  active: "Active",
  scheduled: "Scheduled",
  pending: "Pending review",
  inactive: "Inactive",
  expired: "Expired",
  rejected: "Rejected",
};

type StatusInput = Pick<Offer, "status" | "isActive" | "validFrom" | "validTo">;

const toTime = (v: unknown): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const t = new Date(v as string).getTime();
  return Number.isFinite(t) ? t : null;
};

/**
 * One status per offer, in order of precedence:
 * rejected → pending → expired (status or past validTo) → inactive
 * (paused / switched off) → scheduled (starts later) → active.
 */
export function getOfferDisplayStatus(offer: StatusInput, now: Date = new Date()): OfferDisplayStatus {
  if (offer.status === "REJECTED") return "rejected";
  if (offer.status === "PENDING") return "pending";
  const end = toTime(offer.validTo);
  if (offer.status === "EXPIRED" || (end !== null && end < now.getTime())) return "expired";
  if (offer.status === "PAUSED" || !offer.isActive) return "inactive";
  const start = toTime(offer.validFrom);
  if (start !== null && start > now.getTime()) return "scheduled";
  return "active";
}

export const OFFER_TYPE_LABEL: Record<OfferType, string> = {
  REGULAR_DISCOUNT: "Regular discount",
  VOUCHER: "Voucher",
  COUNTDOWN_DEAL: "Countdown deal",
  FLASH_SALE: "Flash sale",
  BUY_X_GET_Y: "Buy X get Y",
  FREE_SHIPPING: "Free shipping",
  BUNDLE_DEAL: "Bundle deal",
  SEASONAL_SALE: "Seasonal sale",
  LOYALTY_REWARD: "Loyalty reward",
  REFERRAL_BONUS: "Referral bonus",
};

export const OFFER_TYPES = Object.keys(OFFER_TYPE_LABEL) as OfferType[];

export function offerTypeLabel(type: string | null | undefined): string {
  return (type && OFFER_TYPE_LABEL[type as OfferType]) || String(type ?? "Offer").replace(/_/g, " ").toLowerCase();
}

/** Taka, formatted the way the rest of the vendor dashboard formats prices. */
export function formatTaka(value: unknown): string {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return "—";
  return `৳${n.toLocaleString("en-BD", { maximumFractionDigits: 2 })}`;
}

type DiscountInput = Pick<Offer, "discountType" | "discountValue" | "maxDiscountAmount"> & {
  buyXGetYOffer?: { buyQuantity?: number; getQuantity?: number } | null;
};

export function formatOfferDiscount(offer: DiscountInput): string {
  const type = offer.discountType as DiscountType | string;
  switch (type) {
    case "PERCENTAGE": {
      const cap = offer.maxDiscountAmount ? ` · max ${formatTaka(offer.maxDiscountAmount)}` : "";
      return `${offer.discountValue}% off${cap}`;
    }
    case "FIXED_AMOUNT":
      return `${formatTaka(offer.discountValue)} off`;
    case "FREE_SHIPPING":
      return "Free shipping";
    case "BUY_X_GET_Y": {
      const c = offer.buyXGetYOffer;
      return c?.buyQuantity && c?.getQuantity ? `Buy ${c.buyQuantity} get ${c.getQuantity}` : "Buy X get Y";
    }
    default:
      return "Discount";
  }
}

/** "12 / 100" or "12 used" when there is no total limit. */
export function formatUsage(offer: Pick<Offer, "currentUsageCount" | "totalUsageLimit">): string {
  const used = Number(offer.currentUsageCount) || 0;
  return offer.totalUsageLimit ? `${used.toLocaleString("en-BD")} / ${offer.totalUsageLimit.toLocaleString("en-BD")}` : `${used.toLocaleString("en-BD")} used`;
}

/** 0–100 when a total limit exists, otherwise null (no fake progress bar). */
export function usagePercent(offer: Pick<Offer, "currentUsageCount" | "totalUsageLimit">): number | null {
  if (!offer.totalUsageLimit) return null;
  return Math.min(100, Math.round(((Number(offer.currentUsageCount) || 0) / offer.totalUsageLimit) * 100));
}

const DAY = 24 * 60 * 60 * 1000;
const fmtDate = (t: number) => new Date(t).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

/** Validity line for the table: start, end and a short relative hint. */
export function describeValidity(offer: Pick<Offer, "validFrom" | "validTo">, now: Date = new Date()): { primary: string; hint: string | null } {
  const start = toTime(offer.validFrom);
  const end = toTime(offer.validTo);
  const t = now.getTime();
  if (start !== null && start > t) return { primary: `Starts ${fmtDate(start)}`, hint: end !== null ? `Ends ${fmtDate(end)}` : "No end date" };
  if (end === null) return { primary: "No end date", hint: start !== null ? `Since ${fmtDate(start)}` : null };
  if (end < t) return { primary: `Ended ${fmtDate(end)}`, hint: null };
  const days = Math.ceil((end - t) / DAY);
  return { primary: `Ends ${fmtDate(end)}`, hint: days <= 7 ? `${days} day${days === 1 ? "" : "s"} left` : null };
}

/** Client-side search (the list endpoints have no search parameter). */
export function matchesOfferSearch(offer: Pick<Offer, "title" | "description" | "voucherConfig"> & { createdByVendor?: { storeName?: string } | null }, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [offer.title, offer.description, offer.voucherConfig?.code, offer.createdByVendor?.storeName]
    .some((v) => typeof v === "string" && v.toLowerCase().includes(q));
}

// ---------------------------------------------------------------------------
// Status tabs → server-side filters. Both list endpoints accept `status`,
// `isActive` and `type`; each tab maps onto exactly one of those so the tab
// filters on the server, not just the rows already loaded.
// ---------------------------------------------------------------------------

export type OfferStatusTab = "all" | "active" | "pending" | "inactive" | "expired" | "rejected";

export const OFFER_STATUS_TABS: { value: OfferStatusTab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending" },
  { value: "inactive", label: "Inactive" },
  { value: "expired", label: "Expired" },
  { value: "rejected", label: "Rejected" },
];

const TAB_FILTER: Record<OfferStatusTab, Pick<OfferFilters, "status" | "isActive">> = {
  all: {},
  active: { isActive: true },
  pending: { status: "PENDING" as OfferStatus },
  inactive: { isActive: false },
  expired: { status: "EXPIRED" as OfferStatus },
  rejected: { status: "REJECTED" as OfferStatus },
};

export interface OfferListQuery {
  tab: OfferStatusTab;
  type: OfferType | "ALL";
  page: number;
  limit: number;
  createdByType?: OfferFilters["createdByType"] | "ALL";
}

export function buildOfferFilters(q: OfferListQuery): OfferFilters {
  const f: OfferFilters = { page: Math.max(1, q.page), limit: q.limit, ...TAB_FILTER[q.tab] };
  if (q.type !== "ALL") f.type = q.type;
  if (q.createdByType && q.createdByType !== "ALL") f.createdByType = q.createdByType;
  return f;
}

/**
 * Rows on screen for a tab. The server filter is authoritative; this only
 * removes rows a coarse server filter lets through (e.g. "Active" is
 * isActive=true, which still includes offers whose end date has passed).
 */
export function rowsForTab<T extends StatusInput>(offers: T[], tab: OfferStatusTab, now: Date = new Date()): T[] {
  if (tab === "active") return offers.filter((o) => {
    const s = getOfferDisplayStatus(o, now);
    return s === "active" || s === "scheduled";
  });
  return offers;
}

/**
 * The APIs report `pagination.total` as the size of the returned page, not
 * the true total, so "is there a next page?" is only knowable as "the page
 * came back full".
 */
export function hasNextPage(returned: number, limit: number): boolean {
  return returned >= limit && limit > 0;
}

/** Counts by display status over a window of offers (used for stat cards). */
export function countByStatus(offers: StatusInput[], now: Date = new Date()): Record<OfferDisplayStatus, number> {
  const out: Record<OfferDisplayStatus, number> = { active: 0, scheduled: 0, pending: 0, inactive: 0, expired: 0, rejected: 0 };
  for (const o of offers) out[getOfferDisplayStatus(o, now)] += 1;
  return out;
}

export function totalRedemptions(offers: Pick<Offer, "currentUsageCount">[]): number {
  return offers.reduce((sum, o) => sum + (Number(o.currentUsageCount) || 0), 0);
}

/** Voucher codes: A–Z, 0–9 and dashes, upper-cased, max 32 chars. */
export function normalizeVoucherCode(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 32);
}

// ---------------------------------------------------------------------------
// Form validation (mirrors the server's vendor limits so the vendor sees the
// problem before submitting; the server still enforces them).
// ---------------------------------------------------------------------------

export interface DiscountLimits {
  maxDiscountPercent?: number;
  maxDiscountAmount?: number;
}

export interface OfferFormValues {
  title?: string;
  discountType?: string;
  discountValue?: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  validFrom?: string | Date;
  validTo?: string | Date;
  totalUsageLimit?: number;
  userUsageLimit?: number;
}

export type OfferFormErrors = Partial<Record<keyof OfferFormValues | "code", string>>;

const isNonNegative = (n: unknown) => n === undefined || (typeof n === "number" && Number.isFinite(n) && n >= 0);
const isPositiveInt = (n: unknown) => n === undefined || (typeof n === "number" && Number.isInteger(n) && n >= 1);

export function validateOfferForm(v: OfferFormValues, limits?: DiscountLimits): OfferFormErrors {
  const e: OfferFormErrors = {};
  if (!v.title || !v.title.trim()) e.title = "Give the offer a title.";
  else if (v.title.trim().length > 120) e.title = "Keep the title under 120 characters.";

  const needsValue = v.discountType === "PERCENTAGE" || v.discountType === "FIXED_AMOUNT";
  if (needsValue) {
    const d = v.discountValue;
    if (typeof d !== "number" || !Number.isFinite(d) || d <= 0) e.discountValue = "Enter a discount greater than 0.";
    else if (v.discountType === "PERCENTAGE" && d > 100) e.discountValue = "A percentage can't be more than 100%.";
    else if (v.discountType === "PERCENTAGE" && limits?.maxDiscountPercent !== undefined && d > limits.maxDiscountPercent)
      e.discountValue = `Your limit is ${limits.maxDiscountPercent}%.`;
    else if (v.discountType === "FIXED_AMOUNT" && limits?.maxDiscountAmount !== undefined && d > limits.maxDiscountAmount)
      e.discountValue = `Your limit is ${formatTaka(limits.maxDiscountAmount)}.`;
  }
  if (!isNonNegative(v.minOrderAmount)) e.minOrderAmount = "Minimum order can't be negative.";
  if (!isNonNegative(v.maxDiscountAmount)) e.maxDiscountAmount = "Maximum discount can't be negative.";
  if (!isPositiveInt(v.totalUsageLimit)) e.totalUsageLimit = "Use a whole number of 1 or more, or leave empty.";
  if (!isPositiveInt(v.userUsageLimit)) e.userUsageLimit = "Use a whole number of 1 or more.";

  const from = toTime(v.validFrom);
  const to = toTime(v.validTo);
  if (v.validFrom !== undefined && from === null) e.validFrom = "Pick a valid start date.";
  if (from !== null && to !== null && to <= from) e.validTo = "The end date must be after the start date.";
  return e;
}

export function validateVoucherCode(code: string): string | undefined {
  if (!code) return "Enter a code or generate one.";
  if (code.length < 4) return "Use at least 4 characters.";
  if (!/^[A-Z0-9-]+$/.test(code)) return "Use letters, numbers and dashes only.";
  return undefined;
}

// ---------------------------------------------------------------------------
// Create / edit wizard steps (admin + vendor share the same four steps).
// ---------------------------------------------------------------------------

export const OFFER_WIZARD_STEPS = ["basic", "discount", "rules", "advanced"] as const;
export type OfferWizardStep = (typeof OFFER_WIZARD_STEPS)[number];

export interface WizardOfferData extends OfferFormValues {
  type?: string;
  applicableToAll?: boolean;
  voucherConfig?: { code?: string; isAutoGenerated?: boolean } | null;
  buyXGetYConfig?: { buyQuantity?: number; getQuantity?: number } | null;
}

/** Problems that block leaving a step (empty array = step is complete). */
export function validateWizardStep(
  step: OfferWizardStep,
  data: WizardOfferData,
  ctx: { limits?: DiscountLimits; targetProductCount?: number } = {},
): string[] {
  const errs = validateOfferForm(data, ctx.limits);
  const out: string[] = [];
  if (step === "basic") {
    if (errs.title) out.push(errs.title);
    if (data.type === "VOUCHER" && data.voucherConfig && !data.voucherConfig.isAutoGenerated) {
      const codeErr = validateVoucherCode(normalizeVoucherCode(data.voucherConfig.code ?? ""));
      if (codeErr) out.push(`Voucher code: ${codeErr}`);
    }
  } else if (step === "discount") {
    if (errs.discountValue) out.push(errs.discountValue);
    if (errs.maxDiscountAmount) out.push(errs.maxDiscountAmount);
    if (errs.minOrderAmount) out.push(errs.minOrderAmount);
    if (data.type === "BUY_X_GET_Y" && data.buyXGetYConfig) {
      const { buyQuantity, getQuantity } = data.buyXGetYConfig;
      if (!Number.isInteger(buyQuantity) || (buyQuantity as number) < 1) out.push("“Buy” quantity must be 1 or more.");
      if (!Number.isInteger(getQuantity) || (getQuantity as number) < 1) out.push("“Get” quantity must be 1 or more.");
    }
  } else if (step === "rules") {
    for (const k of ["validFrom", "validTo", "totalUsageLimit", "userUsageLimit"] as const) if (errs[k]) out.push(errs[k] as string);
  } else if (step === "advanced") {
    if (data.applicableToAll === false && (ctx.targetProductCount ?? 0) === 0) out.push("Select at least one product, or apply the offer to all products.");
  }
  return out;
}
