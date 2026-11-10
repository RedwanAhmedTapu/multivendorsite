// lib/product-card/config.ts
//
// Frontend copy of the GLOBAL product card configuration contract owned by the
// backend (multivendorbackend/src/validators/product-card.validator.ts and
// src/constants/product-card.defaults.ts). tests/product-card.test.mjs checks
// both sides accept each other's configs and that the defaults are identical.
//
// Server-side only (it imports zod). Client code uses ./defaults, ./model and
// ./style, which are zod-free. No relative value imports, so this file also
// runs under `node --test` (native type stripping).
import { z } from "zod";

export const PRODUCT_CARD_SCHEMA_VERSION = 1 as const;
export const PRODUCT_CARD_PRESETS = [
  "finixmartDefault",
  "compactMarketplace",
  "cleanMinimal",
  "imageFocused",
  "premiumStorefront",
] as const;

/** Mirrors the backend: the opt-in Add to Cart button exists (off by default). */
export const ADD_TO_CART_AVAILABLE = true;

/** Mirrors the backend: plain-text button label (any script), bounded. */
export const ADD_TO_CART_LABEL_PATTERN = /^[\p{L}\p{N}\p{M} .,'&!+-]+$/u;
export const ADD_TO_CART_LABEL_MAX = 24;

const hexColor = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/)
  .transform((v) => v.toLowerCase());
const optColor = hexColor.nullable().optional();
const int = (min: number, max: number) => z.number().int().min(min).max(max);
const responsive = (min: number, max: number) =>
  z.strictObject({ mobile: int(min, max), tablet: int(min, max), desktop: int(min, max) });
const fontWeight = z.enum(["normal", "medium", "semibold", "bold"]);
const shadow = z.enum(["none", "sm", "md", "lg"]);

export const productCardConfigSchema = z
  .strictObject({
    schemaVersion: z.literal(PRODUCT_CARD_SCHEMA_VERSION),
    preset: z.enum(PRODUCT_CARD_PRESETS),
    show: z.strictObject({
      image: z.boolean(),
      title: z.boolean(),
      price: z.boolean(),
      originalPrice: z.boolean(),
      discountBadge: z.boolean(),
      rating: z.boolean(),
      reviewCount: z.boolean(),
      storeName: z.boolean(),
      verifiedBadge: z.boolean(),
      freeShippingBadge: z.boolean(),
      stockLabel: z.boolean(),
      addToCart: z.boolean(),
    }),
    card: z.strictObject({
      background: optColor,
      borderColor: optColor,
      borderWidth: int(0, 2),
      radius: int(0, 24),
      shadow,
      hoverShadow: shadow,
      imageGap: responsive(0, 24),
      contentPaddingX: responsive(0, 24),
      contentPaddingY: int(0, 16),
      align: z.enum(["left", "center"]),
    }),
    image: z.strictObject({
      sizing: z.enum(["fixed", "1:1", "4:5", "3:4", "4:3"]),
      height: responsive(80, 320),
      fit: z.enum(["contain", "cover"]),
      padding: int(0, 24),
      background: optColor,
    }),
    title: z.strictObject({
      size: responsive(10, 20),
      weight: fontWeight,
      lines: int(1, 3),
      color: optColor,
    }),
    price: z.strictObject({
      size: responsive(10, 28),
      weight: fontWeight,
      color: optColor,
      originalSize: responsive(9, 20),
      originalColor: optColor,
    }),
    discountBadge: z.strictObject({
      position: z.enum(["besidePrice", "imageTopLeft", "imageTopRight"]),
      background: optColor,
      text: optColor,
      radius: int(0, 12),
    }),
    addToCart: z.strictObject({
      variant: z.enum(["filled", "outline"]),
      size: z.enum(["sm", "md"]),
      background: optColor,
      text: optColor,
      radius: int(0, 16),
      /** Optional (older configs lack it); absent = "Add to Cart". */
      label: z
        .string()
        .trim()
        .min(1, "Button label cannot be empty")
        .max(ADD_TO_CART_LABEL_MAX, `Button label can be at most ${ADD_TO_CART_LABEL_MAX} characters`)
        .regex(ADD_TO_CART_LABEL_PATTERN, "Button label may only contain letters, numbers, spaces and . , ' & ! + -")
        .optional(),
    }),
    /** Listing grid (/category/[slug], /products). Optional; absent = the built-in grid. */
    grid: z
      .strictObject({
        columns: z.strictObject({ mobile: int(1, 2), tablet: int(2, 4), desktop: int(3, 6) }),
        gapX: responsive(0, 24),
        gapY: responsive(0, 24),
      })
      .optional(),
  })
  .superRefine((cfg, ctx) => {
    if (cfg.show.addToCart && !ADD_TO_CART_AVAILABLE) {
      ctx.addIssue({ code: "custom", path: ["show", "addToCart"], message: "Add to Cart is not available on product cards yet" });
    }
  });

export type ProductCardConfig = z.infer<typeof productCardConfigSchema>;

/**
 * Any value → a renderable card config. Never throws; anything invalid or of
 * an unknown version yields the given defaults (pass getDefaultProductCardConfig()).
 */
export function resolveProductCardConfig(raw: unknown, defaults: ProductCardConfig): { config: ProductCardConfig; usedFallback: boolean } {
  if (raw === undefined || raw === null) return { config: defaults, usedFallback: false };
  const parsed = productCardConfigSchema.safeParse(raw);
  return parsed.success ? { config: parsed.data, usedFallback: false } : { config: defaults, usedFallback: true };
}

/**
 * Picks the card config from a GET /themes/product-card `data` body. Only a
 * 'published' answer is used; 'default' / 'fallback' / garbage render the
 * frontend defaults, so a frontend/backend version skew can't change cards.
 */
export function selectPublishedProductCardConfig(apiData: unknown, defaults: ProductCardConfig) {
  const data = apiData && typeof apiData === "object" && !Array.isArray(apiData) ? (apiData as Record<string, unknown>) : {};
  if (data.source !== "published") return { config: defaults, usedFallback: false };
  return resolveProductCardConfig(data.config, defaults);
}
