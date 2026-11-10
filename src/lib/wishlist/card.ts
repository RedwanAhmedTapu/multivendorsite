// lib/wishlist/card.ts
//
// Wishlist → shared product card. Pure (no React), unit tested in
// tests/wishlist.test.mjs.
//
// A wishlist item is ONE saved variant of a product (GET /cart-wish/wishlist →
// cartWish.service.ts getWishlist). The card is given exactly that variant,
// so it displays the saved variant's price (and discount, derived from price /
// special price) and its Add to Cart adds that same variant — never another
// one. The server's `isInStock` (warehouse stock + variant availability) is
// the only stock signal in the payload: an unavailable saved variant is
// passed as stock 0, so the shared card disables its Add to Cart; otherwise
// stock is left unknown and the backend validates on add.
//
// Images / vendor / rating are passed through when the API includes them
// (today's wishlist payload selects only id, name, slug, vendorId — the card
// then shows its built-in "No Image" placeholder).
import type { WishlistItem } from "@/features/cartWishApi";
import type { CardProductInput } from "@/lib/product-card/model";

type Loose = Record<string, unknown>;
const asNumber = (v: unknown): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

/** The shared card's input for one wishlist item (its saved variant only). */
export function wishlistItemToCardProduct(item: WishlistItem): CardProductInput {
  const product = (item.products ?? {}) as unknown as Loose;
  const variant = item.product_variants as unknown as Loose | null;
  const productImages = Array.isArray(product.images) ? (product.images as CardProductInput["images"]) : null;
  const variantImages = variant && Array.isArray(variant.images) ? (variant.images as CardProductInput["images"]) : null;
  const vendor = product.vendor && typeof product.vendor === "object" ? (product.vendor as CardProductInput["vendor"]) : null;

  return {
    id: String(product.id ?? item.productId ?? ""),
    slug: typeof product.slug === "string" ? product.slug : null,
    name: typeof product.name === "string" ? product.name : "",
    images: variantImages?.length ? variantImages : productImages ?? [],
    variants: variant
      ? [
          {
            id: typeof variant.id === "string" ? variant.id : null,
            price: variant.price as number | string | null,
            specialPrice: variant.specialPrice as number | string | null,
            // `discount` deliberately omitted: the card derives it from the two prices.
            ...(item.isInStock === false ? { stock: 0 } : {}),
          },
        ]
      : [],
    vendor,
    vendorId: typeof product.vendorId === "string" ? product.vendorId : null,
    avgRating: (product.avgRating as number | string | null | undefined) ?? null,
    reviewCount: (product.reviewCount as number | string | null | undefined) ?? null,
  };
}

/** Short status line under a saved card (price drop / unavailable / saved date). */
export type WishlistNote =
  | { kind: "priceDrop"; amount: number }
  | { kind: "unavailable" }
  | { kind: "saved"; date: Date | null };

export function wishlistNote(item: WishlistItem): WishlistNote {
  if (item.isInStock === false) return { kind: "unavailable" };
  const change = asNumber(item.priceChange);
  if (item.isPriceDropped && change !== null && change < 0) return { kind: "priceDrop", amount: Math.abs(change) };
  const date = item.addedAt ? new Date(item.addedAt) : null;
  return { kind: "saved", date: date && !Number.isNaN(date.getTime()) ? date : null };
}

/** "৳1,250" — same grouping as the shared card's prices (en-US, no decimals). */
export const formatTaka = (n: number) => `৳${Math.round(n).toLocaleString("en-US")}`;

/** "Saved 3 Oct" (local, stable across server/browser: fixed en-GB format). */
export const formatSavedDate = (d: Date) =>
  `Saved ${d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`;

/** Header summary from the actual items. */
export function wishlistSummary(items: WishlistItem[]) {
  let priceDrops = 0;
  let unavailable = 0;
  for (const item of items) {
    const n = wishlistNote(item);
    if (n.kind === "priceDrop") priceDrops++;
    if (n.kind === "unavailable") unavailable++;
  }
  return { count: items.length, priceDrops, unavailable };
}

// ── remove (existing removeFromWishlist mutation, injected) ───────────────────

export type WishlistNotify = (tone: "success" | "error", message: string) => void;

/** Removes exactly one saved item; never throws. Server message on failure. */
export async function removeWishlistItem(
  itemId: string,
  productName: string,
  deps: { remove: (itemId: string) => Promise<unknown>; notify: WishlistNotify },
): Promise<boolean> {
  try {
    await deps.remove(itemId);
    deps.notify("success", `Removed “${productName || "item"}” from your wishlist`);
    return true;
  } catch (error) {
    const e = (error && typeof error === "object" ? error : {}) as { status?: unknown; data?: { message?: unknown; error?: unknown } };
    const msg =
      e.status === 401 || e.status === 403
        ? "Your session has expired. Please sign in again."
        : typeof e.status !== "number"
          ? "Could not reach the server. Check your connection and try again."
          : typeof e.data?.message === "string"
            ? e.data.message
            : typeof e.data?.error === "string"
              ? e.data.error
              : "Could not remove this item. Please try again.";
    deps.notify("error", msg);
    return false;
  }
}
