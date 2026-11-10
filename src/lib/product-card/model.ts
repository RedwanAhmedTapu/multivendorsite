// lib/product-card/model.ts
//
// Pure adapter: any product shape a listing receives → the one view model the
// shared card renders. zod-free (client-safe) and unit tested.
//
// Data rules (never invent data):
//   - price / special price / discount come from the first variant, exactly as
//     today's cards do (the API orders variants by price ascending);
//   - the main price shown follows the approved selling-price rule
//     (lib/pricing/effective-price.ts): the special price ONLY when
//     0 < specialPrice < price — shown as a DISCOUNT, with struck-through
//     original price + discount badge; an equal or higher special price, zero
//     or an invalid value shows the regular price, never as a discount;
//   - the discount % is the variant's `discount` field; only when a payload
//     does not include that field at all (e.g. campaign pages) is it derived
//     from the two prices — never when the field is present but empty/0;
//   - rating is shown only with real data: reviewCount > 0 and a valid
//     avgRating (0 < x ≤ 5). Listing APIs return avgRating / reviewCount
//     columns; they don't include the reviews relation;
//   - store name only when the vendor actually has one (no "Unknown Store");
//   - availability = Σ (stock − reservedQty − damagedQty), the backend's rule,
//     and only when stock data is present;
//   - Add to Cart (cart) adds the variant the card DISPLAYS — the same
//     variant object its price / special price / discount come from
//     (displayedVariant: the first variant of the listing payload, which the
//     API orders by price ascending). Its id comes from that same object, so
//     the added variant always matches the shown price. Without an
//     identifiable displayed variant (no variants, no variant id — e.g.
//     campaign payloads — or an invalid price) no request is ever built:
//     "viewProduct" opens the product page instead. The displayed variant
//     confirmed out of stock → a disabled button. The backend re-checks
//     stock, price, availability and ownership on every add.

import { effectivePrice } from "../pricing/effective-price";

export interface CardProductInput {
  id: string;
  slug?: string | null;
  name?: string | null;
  images?: Array<{ url?: string | null; altText?: string | null } | null> | null;
  variants?: Array<{
    id?: string | null;
    price?: number | string | null;
    specialPrice?: number | string | null;
    discount?: number | string | null;
    stock?: number | string | null;
    reservedQty?: number | string | null;
    damagedQty?: number | string | null;
  } | null> | null;
  vendor?: { id?: string | null; storeName?: string | null; verificationStatus?: string | null } | null;
  vendorId?: string | null;
  avgRating?: number | string | null;
  reviewCount?: number | string | null;
  offerProducts?: Array<{ offer?: { type?: string | null } | null } | null> | null;
}

export interface ProductCardModel {
  id: string;
  href: string;
  name: string;
  image: { url: string; alt: string } | null;
  /** Main price shown (special price when > 0, else the price — as today). */
  price: number;
  /** Original price, only for a real discount (0 < specialPrice < price). */
  originalPrice: number | null;
  /** Display strings, formatted exactly like today's cards (see formatPriceText). */
  priceText: string;
  originalPriceText: string | null;
  /** Discount %, only for a real discount (see originalPrice). */
  discountPercent: number | null;
  rating: { average: number; count: number } | null;
  vendorId: string | null;
  storeName: string | null;
  verified: boolean;
  freeShipping: boolean;
  /** Available units across variants, or null when stock isn't in the payload. */
  available: number | null;
  variantCount: number;
  /** What an Add to Cart button may do for this product (see cardCartAction). */
  cart: CardCartAction;
}

export type CardCartAction =
  /** Add the variant the card displays (its id comes from the same payload object as the shown price). */
  | { kind: "add"; productId: string; variantId: string }
  /** The displayed variant can't be identified safely: the button opens the product page, no request. */
  | { kind: "viewProduct" }
  /** The displayed variant is confirmed out of stock: disabled button. */
  | { kind: "outOfStock" }
  /** No usable product (no id): no button at all. */
  | { kind: "none" };

const nonEmptyId = (v: unknown): v is string => typeof v === "string" && v.trim() !== "";

/**
 * The variant a card displays: the first non-null variant of the payload.
 * Listing APIs return variants ordered by price ascending (cardInclude), so
 * this is the cheapest variant — the one whose price / special price /
 * discount the card shows. toProductCardModel and cardCartAction both use
 * this, so the displayed price and the added variant can never diverge.
 */
export function displayedVariant(p: CardProductInput): NonNullable<NonNullable<CardProductInput["variants"]>[number]> | null {
  return (p.variants ?? []).find((v): v is NonNullable<typeof v> => !!v) ?? null;
}

/**
 * Add to Cart state: the DISPLAYED variant (displayedVariant), never another
 * one. Not identifiable — no variants, no variant id (e.g. campaign payloads,
 * which truncate variants and select no ids) or an invalid price — →
 * "viewProduct" (no request). Displayed variant confirmed sold out → "outOfStock".
 */
export function cardCartAction(p: CardProductInput): CardCartAction {
  if (!nonEmptyId(p.id)) return { kind: "none" };
  const v = displayedVariant(p);
  if (!v || !nonEmptyId(v.id)) return { kind: "viewProduct" };
  const price = num(v.price);
  if (price === null || price <= 0) return { kind: "viewProduct" };
  const stock = num(v.stock);
  if (stock !== null && stock - (num(v.reservedQty) ?? 0) - (num(v.damagedQty) ?? 0) <= 0) return { kind: "outOfStock" };
  return { kind: "add", productId: p.id, variantId: v.id };
}

/**
 * Same output as today's cards (`value.toLocaleString()` on the raw API value):
 * numbers get en-US grouping, string amounts (Decimal-as-string) are shown as
 * sent. en-US is pinned so server and browser render identical text.
 */
export function formatPriceText(raw: unknown): string {
  if (typeof raw === "number") return Number.isFinite(raw) ? raw.toLocaleString("en-US") : "0";
  if (typeof raw === "string" && raw.trim() !== "") return raw;
  return "0";
}

const num = (v: unknown): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

function discountPercentFor(
  variant: { discount?: unknown } | undefined,
  discount: number | null,
  basePrice: number,
  special: number,
): number | null {
  if (variant && "discount" in variant) return discount !== null && discount > 0 ? discount : null;
  const derived = Math.round(((basePrice - special) / basePrice) * 100); // basePrice > special > 0 here
  return derived > 0 ? derived : null;
}

export function toProductCardModel(p: CardProductInput): ProductCardModel {
  const variants = (p.variants ?? []).filter((v): v is NonNullable<typeof v> => !!v);
  const first = displayedVariant(p) ?? undefined; // the variant the card shows (and adds)
  const basePrice = num(first?.price) ?? 0;
  const special = num(first?.specialPrice);
  // Approved rule (lib/pricing/effective-price.ts): the special price is the
  // selling price ONLY when 0 < specialPrice < price — then it is shown with
  // the struck-through original + badge; otherwise the regular price is shown.
  const isDiscount = effectivePrice(first?.price, first?.specialPrice).discounted;
  const discount = num(first?.discount);

  const avg = num(p.avgRating);
  const count = num(p.reviewCount);
  const rating = count !== null && count > 0 && avg !== null && avg > 0 && avg <= 5 ? { average: avg, count: Math.trunc(count) } : null;

  const img = (p.images ?? []).find((i) => i && i.url);
  const name = (p.name ?? "").trim();

  const stockKnown = variants.some((v) => num(v.stock) !== null);
  const available = stockKnown
    ? variants.reduce((sum, v) => sum + Math.max(0, (num(v.stock) ?? 0) - (num(v.reservedQty) ?? 0) - (num(v.damagedQty) ?? 0)), 0)
    : null;

  const storeName = p.vendor?.storeName?.trim() || null;

  return {
    id: p.id,
    href: `/products/${encodeURIComponent(p.slug || p.id)}`,
    name,
    image: img?.url ? { url: img.url, alt: img.altText || name } : null,
    price: isDiscount ? special! : basePrice,
    originalPrice: isDiscount ? basePrice : null,
    priceText: formatPriceText(isDiscount ? first?.specialPrice : first?.price),
    originalPriceText: isDiscount ? formatPriceText(first?.price) : null,
    discountPercent: isDiscount ? discountPercentFor(first, discount, basePrice, special!) : null,
    rating,
    vendorId: p.vendor?.id ?? p.vendorId ?? null,
    storeName,
    verified: p.vendor?.verificationStatus === "VERIFIED",
    freeShipping: (p.offerProducts ?? []).some((op) => op?.offer?.type === "FREE_SHIPPING"),
    available,
    variantCount: variants.length,
    cart: cardCartAction(p),
  };
}
