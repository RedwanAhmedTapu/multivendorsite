// lib/cart/display.ts
//
// Pure display helpers shared by /cart and /checkout (unit tested in
// tests/cart-checkout.test.mjs). No business rules are invented here: every
// amount comes from the cart API (cartWish.service.ts getCart: price,
// compareAtPrice, itemTotal = price × qty, savings = (compareAt − price) × qty,
// selectedSubtotal) or the checkout quote (calculateDeliveryFees); the stock
// rules are the ones the cart page already used.
import type { CartItem, CheckoutQuote } from "@/features/cartWishApi";

/** Cart API display extras (1C-22: vendor name + images + variant name). */
export type CartLine = CartItem & {
  products: CartItem["products"] & {
    vendor?: { storeName: string };
    images?: Array<{ url: string; altText?: string | null }>;
  };
  product_variants: CartItem["product_variants"] & {
    name?: string | null;
    images?: Array<{ url: string; altText?: string | null }>;
  };
};

/** "৳ 1,250" — the cart pages' existing format (en-BD grouping, up to 2 decimals). */
export const formatBDT = (n: number) => "৳ " + (Number.isFinite(n) ? n : 0).toLocaleString("en-BD", { maximumFractionDigits: 2 });

/** Variant options as "Color: Black"; falls back to the variant's own name. */
export function variantLabels(item: CartLine): string[] {
  const attrs = (item.product_variants?.attributes ?? []).map((a) => `${a.attributeValue.attribute.name}: ${a.attributeValue.value}`);
  if (attrs.length > 0) return attrs;
  const name = item.product_variants?.name?.trim();
  return name ? [name] : [];
}

/** Variant image, else product image, else null (caller shows a placeholder). */
export function lineImage(item: CartLine): string | null {
  return item.product_variants?.images?.[0]?.url ?? item.products?.images?.[0]?.url ?? null;
}

/** Existing rule: no available stock, or the variant switched off. */
export const isUnavailable = (item: CartLine) => item.availableStock <= 0 || item.product_variants?.availability === false;

/** Existing rule: available, but fewer units than the quantity in the cart. */
export const isShortStock = (item: CartLine) => !isUnavailable(item) && item.availableStock < item.quantity;

export const unavailableLabel = (item: CartLine) =>
  item.product_variants?.availability === false ? "Currently unavailable" : "Out of stock";

export interface VendorGroup {
  vendorId: string;
  name: string;
  items: CartLine[];
}

/** Lines grouped by vendor, in first-appearance order (the cart's existing grouping). */
export function groupByVendor(items: CartLine[]): VendorGroup[] {
  const groups = new Map<string, VendorGroup>();
  for (const item of items) {
    const id = item.products?.vendorId ?? "unknown";
    if (!groups.has(id)) groups.set(id, { vendorId: id, name: item.products?.vendor?.storeName?.trim() || "Seller", items: [] });
    groups.get(id)!.items.push(item);
  }
  return [...groups.values()];
}

/** Sum of the server's per-line `savings` (informational — already reflected in prices). */
export const totalSavings = (items: CartLine[]) => items.reduce((sum, i) => sum + (i.savings > 0 ? i.savings : 0), 0);

/** Why Checkout is unavailable on the cart page (existing rules), or null. */
export function cartCheckoutBlock(selected: CartLine[]): string | null {
  if (selected.length === 0) return "Select at least one item to continue";
  const unavailable = selected.filter(isUnavailable).length;
  if (unavailable > 0) return `Remove or deselect ${unavailable} unavailable item${unavailable !== 1 ? "s" : ""} to continue`;
  return null;
}

/**
 * Delivery summary for checkout, from the server's checkout quote (Phase 2,
 * H-3): one entry per vendor, already summed over all its warehouse shipments.
 */
export function deliveryQuote(quote: CheckoutQuote | null | undefined, vendorIds: string[]) {
  const vendors = quote?.vendors ?? [];
  const byVendor = new Map(vendors.map((v) => [v.vendorId, v]));
  const total = quote?.shippingTotal ?? 0;
  const failed = vendorIds.filter((id) => byVendor.get(id)?.error);
  const missing = vendorIds.filter((id) => !byVendor.has(id));
  return { total, failed, missing, complete: failed.length === 0 && missing.length === 0 && vendorIds.length > 0 };
}

/** What differs between the quote the customer reviewed and a fresh one (for the confirmation panel). */
export function diffQuotes(prev: CheckoutQuote, next: CheckoutQuote) {
  const prevLines = new Map(prev.lines.map((l) => [l.cartItemId, l]));
  const priceChanges = next.lines
    .filter((l) => prevLines.has(l.cartItemId) && prevLines.get(l.cartItemId)!.price !== l.price)
    .map((l) => ({ cartItemId: l.cartItemId, from: prevLines.get(l.cartItemId)!.price, to: l.price }));
  const prevVendors = new Map(prev.vendors.map((v) => [v.vendorId, v]));
  const deliveryChanges = next.vendors
    .filter((v) => (prevVendors.get(v.vendorId)?.shippingCost ?? null) !== v.shippingCost)
    .map((v) => ({ vendorId: v.vendorId, vendorName: v.vendorName, from: prevVendors.get(v.vendorId)?.shippingCost ?? null, to: v.shippingCost }));
  const shipKey = (q: CheckoutQuote) =>
    JSON.stringify(q.vendors.map((v) => [v.vendorId, v.shipments.map((s) => [s.warehouseId, s.items.map((i) => [i.cartItemId, i.quantity])])]));
  return {
    priceChanges,
    deliveryChanges,
    allocationChanged: shipKey(prev) !== shipKey(next),
    totalFrom: prev.grandTotal,
    totalTo: next.grandTotal,
  };
}
