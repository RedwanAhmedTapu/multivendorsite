// components/product/card/ProductListingGrid.tsx
//
// Product grid for /category/[slug] and /products. Server-component safe (no
// hooks): the page passes the published `grid` block. Without one, today's
// grid classes are rendered unchanged. Cards inside are SharedProductCard;
// `imageSizes` for them comes from gridImageSizes().
import type { CSSProperties, ReactNode } from "react";
import {
  BUILT_IN_GRID_CLASS,
  BUILT_IN_IMAGE_SIZES,
  MIN_CARD_WIDTH,
  listingGridVars,
  listingImageSizes,
  type ListingGridConfig,
} from "@/lib/product-card/grid";
import styles from "./listing-grid.module.css";

export function ProductListingGrid({
  grid,
  minCardWidth = MIN_CARD_WIDTH,
  children,
}: {
  grid?: ListingGridConfig | null;
  /** Preview only (mobile preview passes 0); pages use the default. */
  minCardWidth?: number;
  children: ReactNode;
}) {
  if (!grid) return <div className={BUILT_IN_GRID_CLASS}>{children}</div>;
  return (
    <div className={styles.grid} style={listingGridVars(grid, minCardWidth) as CSSProperties} data-fm-grid="">
      {children}
    </div>
  );
}

export function gridImageSizes(grid?: ListingGridConfig | null): string {
  return grid ? listingImageSizes(grid) : BUILT_IN_IMAGE_SIZES;
}
