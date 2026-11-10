// lib/pricing/effective-price.ts
//
// The customer-facing selling price of a variant (approved business rule):
// `specialPrice` is the discounted selling price, and it applies ONLY when
// 0 < specialPrice < regular price. Null, zero, negative, equal, higher or
// non-numeric special prices fall back to the regular price.
//
// Display only — the backend computes the authoritative price that is charged
// (multivendorbackend src/modules/shared/pricing.ts implements the same rule
// and is tested with the same cases).

const toNumber = (v: unknown): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

export interface EffectivePrice {
  /** The price the customer pays (regular price when no valid discount). */
  price: number;
  /** The regular price, but only while a valid discount is active. */
  originalPrice: number | null;
  /** True only when 0 < specialPrice < regularPrice. */
  discounted: boolean;
}

export function effectivePrice(regularPrice: unknown, specialPrice: unknown): EffectivePrice {
  const regular = toNumber(regularPrice) ?? 0;
  const special = toNumber(specialPrice);
  const discounted = special !== null && special > 0 && special < regular;
  return discounted
    ? { price: special!, originalPrice: regular, discounted: true }
    : { price: regular, originalPrice: null, discounted: false };
}
