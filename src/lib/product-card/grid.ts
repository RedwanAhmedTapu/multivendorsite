// lib/product-card/grid.ts
//
// Listing grid for /category/[slug] and /products, driven by the optional
// `grid` block of the global product card config. zod-free (client-safe).
//
//   - No `grid` block → the built-in grid, byte-for-byte today's classes.
//   - With a block → components/product/card/listing-grid.module.css with
//     validated integers passed as CSS variables (never class names).
//     Breakpoints are the project's md (768px) / lg (1024px), as everywhere
//     else in the card system. Mobile uses its column count exactly; on tablet
//     and desktop the count is a MAXIMUM: the CSS drops columns instead of
//     rendering cards narrower than MIN_CARD_WIDTH.
import type { ProductCardConfig } from "./config";

export type ListingGridConfig = NonNullable<ProductCardConfig["grid"]>;
type Bp = "mobile" | "tablet" | "desktop";

/** Today's grid on /category/[slug] and /products (kept exactly when no grid is configured). */
export const BUILT_IN_GRID_CLASS = "grid gap-1 sm:gap-2 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6";
export const BUILT_IN_IMAGE_SIZES =
  "(max-width: 639px) 50vw, (max-width: 767px) 33vw, (max-width: 1023px) 25vw, (max-width: 1535px) 20vw, 17vw";

/** Narrowest card the tablet/desktop grid will render (px). */
export const MIN_CARD_WIDTH = 130;

/** Starting values when an admin turns the custom grid on (close to today's look). */
export function defaultListingGrid(): ListingGridConfig {
  return {
    columns: { mobile: 2, tablet: 4, desktop: 5 },
    gapX: { mobile: 4, tablet: 8, desktop: 8 },
    gapY: { mobile: 4, tablet: 8, desktop: 8 },
  };
}

/**
 * Width of the product grid on the listing pages (measured on /category/laptops:
 * page container minus the 256px filter sidebar and its gap). Used for the
 * admin preview and the "actual columns" readout; the live page measures
 * nothing — the CSS does the same arithmetic on the real width.
 */
export const LISTING_CONTENT_WIDTH: Record<Bp, { min: number; max: number; screenMin: number; screenMax: number; preview: number }> = {
  mobile: { min: 375, max: 375, screenMin: 375, screenMax: 767, preview: 375 },
  tablet: { min: 478, max: 616, screenMin: 768, screenMax: 1023, preview: 478 },
  desktop: { min: 582, max: 935, screenMin: 1024, screenMax: 1440, preview: 935 },
};

/** CSS variables for the configured grid (validated numbers only). */
export function listingGridVars(grid: ListingGridConfig, minCardWidth: number = MIN_CARD_WIDTH): Record<string, string> {
  const px = (n: number) => `${n}px`;
  return {
    "--fmg-cols-m": String(grid.columns.mobile),
    "--fmg-cols-t": String(grid.columns.tablet),
    "--fmg-cols-d": String(grid.columns.desktop),
    "--fmg-gx-m": px(grid.gapX.mobile),
    "--fmg-gx-t": px(grid.gapX.tablet),
    "--fmg-gx-d": px(grid.gapX.desktop),
    "--fmg-gy-m": px(grid.gapY.mobile),
    "--fmg-gy-t": px(grid.gapY.tablet),
    "--fmg-gy-d": px(grid.gapY.desktop),
    "--fmg-min": px(minCardWidth),
  };
}

/**
 * Columns actually rendered for a selected maximum at a given grid width —
 * the same rule the CSS applies: the largest n ≤ max whose cards are at least
 * MIN_CARD_WIDTH wide (never fewer than 1). Mobile is exact (no minimum).
 */
export function renderedColumns(max: number, width: number, gap: number, bp: Bp, minCardWidth: number = MIN_CARD_WIDTH): number {
  if (bp === "mobile") return max;
  for (let n = max; n > 1; n--) {
    if ((width - (n - 1) * gap) / n >= minCardWidth) return n;
  }
  return 1;
}

/** Rendered column range across a breakpoint's screen widths (for the editor readout). */
export function renderedColumnRange(grid: ListingGridConfig, bp: Bp): { min: number; max: number } {
  const w = LISTING_CONTENT_WIDTH[bp];
  const a = renderedColumns(grid.columns[bp], w.min, grid.gapX[bp], bp);
  const b = renderedColumns(grid.columns[bp], w.max, grid.gapX[bp], bp);
  return { min: Math.min(a, b), max: Math.max(a, b) };
}

/** next/image `sizes` for the configured grid (roughly one column of the viewport). */
export function listingImageSizes(grid: ListingGridConfig): string {
  const vw = (cols: number) => `${Math.ceil(100 / cols)}vw`;
  return `(max-width: 767px) ${vw(grid.columns.mobile)}, (max-width: 1023px) ${vw(grid.columns.tablet)}, ${vw(grid.columns.desktop)}`;
}

/**
 * Admin preview only: every breakpoint gets the chosen breakpoint's values,
 * so the real grid CSS shows that breakpoint at any admin screen size (the
 * same approach as the card preview). Mobile previews disable the minimum
 * width, matching the live mobile rule.
 */
export function previewGridFor(grid: ListingGridConfig, bp: Bp): { grid: ListingGridConfig; minCardWidth: number } {
  const pin = (r: Record<Bp, number>) => ({ mobile: r[bp], tablet: r[bp], desktop: r[bp] });
  return {
    grid: { columns: pin(grid.columns) as ListingGridConfig["columns"], gapX: pin(grid.gapX), gapY: pin(grid.gapY) },
    minCardWidth: bp === "mobile" ? 0 : MIN_CARD_WIDTH,
  };
}

/**
 * The built-in grid expressed per breakpoint at the preview widths
 * (375 → 2 cols / 4px, 478 → 4 / 8px, 935 → 5 / 8px), so the editor can
 * preview "no custom grid" with the same component. No minimum width: the
 * built-in grid has none.
 */
export const BUILT_IN_GRID_AT_PREVIEW: ListingGridConfig = {
  columns: { mobile: 2, tablet: 4, desktop: 5 },
  gapX: { mobile: 4, tablet: 8, desktop: 8 },
  gapY: { mobile: 4, tablet: 8, desktop: 8 },
};
