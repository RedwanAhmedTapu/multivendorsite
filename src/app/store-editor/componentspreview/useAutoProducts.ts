import type { CarouselProductItem } from "./ProductCarosoel";
// ⚠️ ADJUST ME: this assumes commonProductApi lives at this path, mirroring
// vendorProductApi's location (@/features/productapi/vendorProductApi). If
// your project puts it somewhere else, this is the only line to change.
import {
  useGetBestSellingProductsQuery,
  useGetNewArrivalsQuery,
  useGetDiscountedProductsQuery,
  useGetFeaturedProductsQuery,
  useGetProductsQuery,
} from "@/features/productapi/commonProductApi";

export type ProductSortBy =
  | "personalized"
  | "itemSold"
  | "createdDate"
  | "customerReview"
  | "highestDiscount"
  | "rating";

export const SORT_BY_OPTIONS: { value: ProductSortBy; label: string }[] = [
  { value: "personalized",    label: "Personalized" },
  { value: "itemSold",        label: "Item Sold" },
  { value: "createdDate",     label: "Product Created Date" },
  { value: "customerReview",  label: "Customer Review" },
  { value: "highestDiscount", label: "Highest Discount" },
  { value: "rating",          label: "Product Rating" },
];

/** Raw `Product` (from commonProductApi) → the display shape every
 *  product-list preview component already renders (CarouselProductItem and
 *  friends share this exact shape). */
export function toDisplayProduct(p: any): CarouselProductItem {
  const variant  = p.variants?.[0];
  const price    = variant?.specialPrice ?? variant?.price;
  const original = variant?.specialPrice ? variant?.price : undefined;
  const discount =
    original && price ? `-${Math.round(100 - (price / original) * 100)}%` : undefined;
  return {
    name:  p.name,
    image: p.images?.[0]?.url,
    price: price !== undefined ? `৳${Number(price).toLocaleString()}` : undefined,
    originalPrice: original !== undefined ? `৳${Number(original).toLocaleString()}` : undefined,
    discount,
    rating:  p.avgRating ?? p.rating,
    reviews: p.reviewCount ?? p.reviews,
  };
}

/**
 * Live-fetches up to `count` products matching `sortBy`, only when
 * `enabled` is true (pass `!hasManualProducts` from the caller — a vendor's
 * manually-picked products, via the product picker, always take priority
 * over this auto list).
 *
 * There's no single "sort by X" endpoint — commonProductApi exposes
 * dedicated endpoints for some criteria (best-selling, new-arrivals,
 * discounted, featured) and a generic cursor-paginated `getProducts` with a
 * free-form `sortBy` string for the rest. Every branch is called on every
 * render (with `skip` toggling which one actually fetches) to satisfy the
 * Rules of Hooks — only the active one does real work.
 */
export function useAutoProducts(sortBy: ProductSortBy | undefined, count: number, enabled: boolean) {
  const limit = Math.min(Math.max(count || 8, 1), 54);
  const s = sortBy ?? "personalized";

  const bestSelling = useGetBestSellingProductsQuery({ limit }, { skip: !enabled || s !== "itemSold" });
  const newArrivals  = useGetNewArrivalsQuery({ limit },        { skip: !enabled || s !== "createdDate" });
  const discounted   = useGetDiscountedProductsQuery({ limit }, { skip: !enabled || s !== "highestDiscount" });
  const featured     = useGetFeaturedProductsQuery({ limit },   { skip: !enabled || s !== "personalized" });

  // ⚠️ ADJUST ME: no dedicated endpoint exists for "customer review" /
  // "rating" sort, so this falls back to the generic listing with a guessed
  // `sortBy` query value ('reviews' / 'rating'). Confirm the exact string
  // your PublicProductController expects and update below if it differs.
  const genericSorted = useGetProductsQuery(
    { limit, sortBy: s === "customerReview" ? "reviews" : s === "rating" ? "rating" : undefined },
    { skip: !enabled || (s !== "customerReview" && s !== "rating") },
  );

  const isFetching =
    bestSelling.isFetching || newArrivals.isFetching || discounted.isFetching ||
    featured.isFetching || genericSorted.isFetching;

  let items: any[] | undefined;
  if (s === "itemSold") items = bestSelling.data;
  else if (s === "createdDate") items = newArrivals.data;
  else if (s === "highestDiscount") items = discounted.data;
  else if (s === "customerReview" || s === "rating") items = genericSorted.data?.items;
  else items = featured.data;

  return { items: (items ?? []).map(toDisplayProduct), isFetching };
}