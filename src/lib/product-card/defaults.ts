// lib/product-card/defaults.ts
//
// "FinixMart Default" product card — identical to the backend defaults
// (multivendorbackend/src/constants/product-card.defaults.ts; checked by
// tests/product-card.test.mjs). It reproduces today's homepage card on tablet
// and desktop; mobile gets the approved compact spacing (image 150px, 6px
// image-to-text gap, 8px side padding). zod-free: safe for client bundles.
import type { ProductCardConfig } from "./config";

export function getDefaultProductCardConfig(): ProductCardConfig {
  return {
    schemaVersion: 1,
    preset: "finixmartDefault",
    show: {
      image: true,
      title: true,
      price: true,
      originalPrice: true,
      discountBadge: true,
      rating: true,
      reviewCount: false,
      storeName: true,
      verifiedBadge: true,
      freeShippingBadge: true,
      stockLabel: false,
      addToCart: false,
    },
    card: {
      background: null,
      borderColor: null,
      borderWidth: 1,
      radius: 10, // rounded-lg = var(--radius) = 0.625rem
      shadow: "sm",
      hoverShadow: "lg",
      imageGap: { mobile: 6, tablet: 24, desktop: 24 },
      contentPaddingX: { mobile: 8, tablet: 16, desktop: 16 },
      contentPaddingY: 4,
      align: "left",
    },
    image: {
      sizing: "fixed",
      height: { mobile: 150, tablet: 176, desktop: 176 },
      fit: "contain",
      padding: 0,
      background: null,
    },
    title: {
      size: { mobile: 14, tablet: 14, desktop: 14 },
      // rendered semibold today (globals.css h1–h6 rule beats font-medium)
      weight: "semibold",
      lines: 2,
      color: null,
    },
    price: {
      size: { mobile: 20, tablet: 20, desktop: 20 },
      weight: "bold",
      color: null,
      originalSize: { mobile: 14, tablet: 14, desktop: 14 },
      originalColor: null,
    },
    discountBadge: {
      position: "besidePrice",
      background: null,
      text: null,
      radius: 8,
    },
    addToCart: {
      variant: "filled",
      size: "sm",
      background: null,
      text: null,
      radius: 8,
    },
  };
}
