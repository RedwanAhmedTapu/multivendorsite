// components/homesections/ProductCollectionSection.tsx
//
// Server component for one configured product collection. Each collection
// fetches only its own source (the existing public product endpoints via
// lib/api-utils), and sibling collections fetch in parallel. Empty results
// render nothing — ProductSection returns null, exactly as before.
import {
  getFlashSaleProductsServer,
  getFeaturedProductsServer,
  getNewArrivalsServer,
  getTrendingProductsServer,
  getBestSellingProductsServer,
  getDiscountedProductsServer,
} from "@/lib/api-utils";
import type { ProductCollectionSettings, ProductSource } from "@/lib/homepage-config/core";
import type { Product as ProductType } from "@/types/product";
import ProductSection from "./ProductSection";

const FETCHERS: Record<ProductSource, (limit?: number) => Promise<{ data?: ProductType[] } | undefined>> = {
  flashSale: getFlashSaleProductsServer,
  featured: getFeaturedProductsServer,
  newArrivals: getNewArrivalsServer,
  trending: getTrendingProductsServer,
  bestSelling: getBestSellingProductsServer,
  discounted: getDiscountedProductsServer,
};

export default async function ProductCollectionSection({ settings }: { settings: ProductCollectionSettings }) {
  const response = await FETCHERS[settings.source](settings.limit);
  const products = Array.isArray(response?.data) ? response.data : [];

  return (
    <ProductSection
      title={settings.title}
      subtitle={settings.subtitle}
      showSeeAll={settings.showSeeAll}
      columns={settings.columns}
      products={products}
    />
  );
}
