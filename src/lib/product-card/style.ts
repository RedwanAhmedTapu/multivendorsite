// lib/product-card/style.ts
//
// Validated card config → CSS custom properties on the card root (sizes,
// spacing, shadows, weights) + optional inline color overrides. zod-free.
//
// Breakpoints match Tailwind's md (768px) and lg (1024px) and are applied in
// components/product/card/SharedProductCard.module.css. Default colors are NOT
// variables: the card keeps today's Tailwind color classes (Tailwind v4 colors
// are oklch, so re-typing them as hex would shift them); a configured color is
// applied as an inline override only when it is set. Every value here comes
// from the validated schema (bounded integers, fixed enums, #rrggbb), so no
// arbitrary CSS can be produced.
import type { ProductCardConfig } from "./config";

/** Tailwind v4 shadow-sm / md / lg values. */
export const SHADOWS: Record<ProductCardConfig["card"]["shadow"], string> = {
  none: "none",
  sm: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
  md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
};

export const FONT_WEIGHTS: Record<ProductCardConfig["title"]["weight"], number> = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
};

const RATIOS: Record<Exclude<ProductCardConfig["image"]["sizing"], "fixed">, string> = {
  "1:1": "1 / 1",
  "4:5": "4 / 5",
  "3:4": "3 / 4",
  "4:3": "4 / 3",
};

const px = (n: number) => `${n}px`;

/**
 * CSS custom properties for the card root (always all set; values are validated numbers/enums).
 * title.lines is not mapped: card titles are always one line (ellipsis).
 */
export function cardStyleVars(c: ProductCardConfig): Record<string, string> {
  const vars: Record<string, string> = {
    "--fmc-gap-m": px(c.card.imageGap.mobile),
    "--fmc-gap-t": px(c.card.imageGap.tablet),
    "--fmc-gap-d": px(c.card.imageGap.desktop),
    "--fmc-padx-m": px(c.card.contentPaddingX.mobile),
    "--fmc-padx-t": px(c.card.contentPaddingX.tablet),
    "--fmc-padx-d": px(c.card.contentPaddingX.desktop),
    "--fmc-pady": px(c.card.contentPaddingY),
    "--fmc-radius": px(c.card.radius),
    "--fmc-border-w": px(c.card.borderWidth),
    "--fmc-shadow": SHADOWS[c.card.shadow],
    "--fmc-hover-shadow": SHADOWS[c.card.hoverShadow],
    "--fmc-img-h-m": px(c.image.height.mobile),
    "--fmc-img-h-t": px(c.image.height.tablet),
    "--fmc-img-h-d": px(c.image.height.desktop),
    "--fmc-img-pad": px(c.image.padding),
    "--fmc-title-m": px(c.title.size.mobile),
    "--fmc-title-t": px(c.title.size.tablet),
    "--fmc-title-d": px(c.title.size.desktop),
    "--fmc-title-weight": String(FONT_WEIGHTS[c.title.weight]),
    "--fmc-price-m": px(c.price.size.mobile),
    "--fmc-price-t": px(c.price.size.tablet),
    "--fmc-price-d": px(c.price.size.desktop),
    "--fmc-price-weight": String(FONT_WEIGHTS[c.price.weight]),
    "--fmc-orig-m": px(c.price.originalSize.mobile),
    "--fmc-orig-t": px(c.price.originalSize.tablet),
    "--fmc-orig-d": px(c.price.originalSize.desktop),
    "--fmc-badge-radius": px(c.discountBadge.radius),
  };
  if (c.image.sizing !== "fixed") vars["--fmc-img-ratio"] = RATIOS[c.image.sizing];
  return vars;
}

/** Inline color overrides per element — empty objects when the built-in colors apply. */
export function cardColorOverrides(c: ProductCardConfig) {
  const color = (v: string | null | undefined) => (v ? { color: v } : {});
  return {
    card: {
      ...(c.card.background ? { backgroundColor: c.card.background } : {}),
      ...(c.card.borderColor ? { borderColor: c.card.borderColor } : {}),
    },
    image: c.image.background ? { backgroundColor: c.image.background } : {},
    title: color(c.title.color),
    price: color(c.price.color),
    originalPrice: color(c.price.originalColor),
    badge: {
      ...(c.discountBadge.background ? { backgroundColor: c.discountBadge.background } : {}),
      ...(c.discountBadge.text ? { color: c.discountBadge.text } : {}),
    },
  };
}
