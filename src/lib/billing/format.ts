// src/lib/billing/format.ts — pure display helpers for subscriptions and payouts (unit-tested).

export function taka(amount: string | number | null | undefined): string {
  const n = typeof amount === "number" ? amount : Number(amount);
  if (amount === null || amount === undefined || amount === "" || !Number.isFinite(n)) return "—";
  return `৳${n.toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Whole-taka form for prices on cards (৳1,250 / ৳999.50). */
export function takaShort(amount: string | number | null | undefined): string {
  const n = typeof amount === "number" ? amount : Number(amount);
  if (amount === null || amount === undefined || amount === "" || !Number.isFinite(n)) return "—";
  return `৳${n.toLocaleString("en-BD", { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 })}`;
}

const TZ = "Asia/Dhaka";
export function dateText(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isFinite(d.getTime()) ? d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: TZ }) : "—";
}
export function dateTimeText(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isFinite(d.getTime()) ? d.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: TZ }) : "—";
}
export function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  if (!y || !m) return key;
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" });
}

/** "per month" / "per 6 months" / "per year" / "per 2 years" from the cycle's months. */
export function perCycle(months: number): string {
  if (months === 1) return "per month";
  if (months === 12) return "per year";
  if (months % 12 === 0) return `per ${months / 12} years`;
  return `per ${months} months`;
}

/** Monthly equivalent of a cycle price, for "≈ ৳x / month" hints. */
export function monthlyEquivalent(price: string | number, months: number): number {
  const n = Number(price);
  return months > 0 && Number.isFinite(n) ? Math.round((n / months) * 100) / 100 : NaN;
}

/** Savings of a longer cycle versus paying monthly, in whole percent (0 when not cheaper). */
export function cycleSavingsPercent(monthlyPrice: string | number | null | undefined, cyclePrice: string | number, months: number): number {
  const m = Number(monthlyPrice);
  const c = Number(cyclePrice);
  if (!Number.isFinite(m) || !Number.isFinite(c) || m <= 0 || months <= 1) return 0;
  const full = m * months;
  return c < full ? Math.round(((full - c) / full) * 100) : 0;
}

export function limitText(type: "number" | "boolean", value: number | boolean | null | undefined, unit?: string, period?: string): string {
  if (value === null || value === undefined) return type === "boolean" ? "Included" : "Unlimited";
  if (type === "boolean") return value ? "Included" : "Not included";
  return `${Number(value).toLocaleString("en-BD")}${unit ? ` ${unit}` : ""}${period === "MONTH" ? " / month" : ""}`;
}

export const STATE_LABEL: Record<string, string> = {
  NONE: "No plan", PENDING: "Pending", ACTIVE: "Active", GRACE: "Grace period", EXPIRED: "Expired", CANCELLED: "Cancelled", SUSPENDED: "Suspended",
};
export const STATE_TONE: Record<string, "green" | "amber" | "red" | "slate" | "violet"> = {
  ACTIVE: "green", GRACE: "amber", EXPIRED: "red", CANCELLED: "red", SUSPENDED: "slate", NONE: "slate", PENDING: "violet",
  PAID: "green", FAILED: "red", REFUNDED: "slate", DRAFT: "slate", PUBLISHED: "green", ARCHIVED: "slate", PAUSED: "amber", REVOKED: "red",
  APPROVED: "violet", PARTIALLY_PAID: "amber", HELD: "amber", ON_HOLD: "amber", ELIGIBLE: "green", BELOW_THRESHOLD: "slate", NOTHING_DUE: "slate",
};
export const OFFER_KIND_LABEL: Record<string, string> = {
  PRICE_OVERRIDE: "Custom price", PERCENT_DISCOUNT: "% discount", FIXED_DISCOUNT: "Fixed discount", FREE_PLAN: "Free plan access", FREE_FEATURE: "Free feature",
};
export const AFTER_EXPIRY_LABEL: Record<string, string> = {
  NORMAL_PRICE: "Back to normal price", PREVIOUS_SUBSCRIPTION: "Continue previous subscription", SWITCH_PLAN: "Open a request for another plan (not charged)",
  DISABLE_FEATURE: "Disable the free feature", MANUAL_RENEWAL: "Vendor renews manually",
};
export const SOURCE_LABEL: Record<string, string> = { TRIAL: "Trial", PAID: "Paid", COMPLIMENTARY: "Complimentary", OFFER: "Offer", ADMIN: "Admin" };
export const CYCLE_LABEL: Record<string, string> = { WEEKLY: "Weekly", BIWEEKLY: "Every 2 weeks", MONTHLY: "Monthly", QUARTERLY: "Quarterly", CUSTOM: "Custom" };
export const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const REASON_LABEL: Record<string, string> = {
  PAUSED: "Paused", ON_HOLD: "On hold", PLATFORM_HOLD: "Platform hold", NOTHING_DUE: "Nothing due", BELOW_THRESHOLD: "Below minimum",
};

export function offerValueText(kind: string, value: string | null): string {
  if (kind === "PERCENT_DISCOUNT") return `${Number(value)}% off`;
  if (kind === "FIXED_DISCOUNT") return `${taka(value)} off`;
  if (kind === "PRICE_OVERRIDE") return `${taka(value)}`;
  return OFFER_KIND_LABEL[kind] ?? kind;
}

/** A fresh idempotency key per "record payment" form, so a double submit records once. */
export function newIdempotencyKey(prefix = "pay"): string {
  const rnd = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}-${rnd}`;
}
