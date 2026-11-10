// src/lib/product-card/visibility.ts
//
// Module-level card visibility — HIDE-ONLY.
//
// The global product-card config (admin-published) owns the card's design and
// which elements exist by default. A store module (carousel, highlights,
// slider, recommendation, countdown, three-column list) may only turn elements
// OFF for the cards IT renders: it can never force one on, and it can never
// restyle or recolour anything.
//
//   global true  + module true/absent → shown
//   global true  + module false       → hidden  (the module's whole point)
//   global false + module true        → still hidden (never force-show)
//
// An absent flag is treated as `true`, so decorations saved before these flags
// existed keep exactly today's look — no migration, no backfill.
//
// Colour / font / style are deliberately NOT part of this contract: the card
// uses platform theme tokens and the storefront ignores any style or colour
// field in saved configuration.

import type { ProductCardConfig } from "./config";

/** Flags a store module may set for the cards it renders. */
export const MODULE_CARD_VISIBILITY_FLAGS = [
  "showAddToCart",
  "showRating",
  "showStoreName",
  "showVerifiedBadge",
  "showDiscountBadge",
  "showWishlist",
  "showOldPrice",
] as const;

export type ModuleCardVisibilityFlag = (typeof MODULE_CARD_VISIBILITY_FLAGS)[number];

/** Every flag is optional and defaults to true (absent never hides anything). */
export type ModuleCardVisibility = Partial<Record<ModuleCardVisibilityFlag, boolean>>;

/** Human labels for the settings panel (same order as MODULE_CARD_VISIBILITY_FLAGS). */
export const MODULE_CARD_VISIBILITY_LABELS: Record<ModuleCardVisibilityFlag, string> = {
  showAddToCart: "Add to cart button",
  showRating: "Rating",
  showStoreName: "Store name",
  showVerifiedBadge: "Verified badge",
  showDiscountBadge: "Discount badge",
  showWishlist: "Wishlist button",
  showOldPrice: "Old price",
};

/** The card's own `show` block (see the global config schema). */
export type CardShowFlags = ProductCardConfig["show"];

/**
 * The effective per-card flags: the global config's `show` block ANDed with the
 * module's hide-only flags.
 *
 * `showWishlist` is accepted and stored, but the shared card has no wishlist
 * control today, so it has no visible effect (see the card's header comment:
 * "No Wishlist / Quick View"). It is kept in the contract so the settings panel
 * and the saved decoration already carry it if that control is added later.
 */
export function resolveCardVisibility(
  global: CardShowFlags,
  moduleFlags?: ModuleCardVisibility | null,
): CardShowFlags {
  const on = (flag: ModuleCardVisibilityFlag) => moduleFlags?.[flag] !== false;
  return {
    ...global,
    addToCart: global.addToCart && on("showAddToCart"),
    rating: global.rating && on("showRating"),
    storeName: global.storeName && on("showStoreName"),
    verifiedBadge: global.verifiedBadge && on("showVerifiedBadge"),
    discountBadge: global.discountBadge && on("showDiscountBadge"),
    originalPrice: global.originalPrice && on("showOldPrice"),
  };
}

/** Reads the hide-only flags off an untrusted saved module config. */
export function readModuleCardVisibility(raw: unknown): ModuleCardVisibility | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const source = raw as Record<string, unknown>;
  const out: ModuleCardVisibility = {};
  let any = false;
  for (const flag of MODULE_CARD_VISIBILITY_FLAGS) {
    const value = source[flag];
    if (typeof value === "boolean") {
      out[flag] = value;
      any = true;
    }
  }
  return any ? out : undefined;
}
