import {
  getFlashSaleProductsServer,
  getFeaturedProductsServer,
  getNewArrivalsServer,
  getTrendingProductsServer,
  getDiscountedProductsServer,
} from "@/lib/api-utils";
import ProductSection from "./ProductSection";
import type { Product as ProductType } from "@/types/product";

// Server component — সবগুলো section একসাথে parallel-এ fetch হয়,
// এবং যে section-এ data নাই সেটা ProductSection নিজেই null রিটার্ন করে
// (তাই title সহ পুরো section-ই hide হয়ে যায়)
export default async function ProductGrid() {
  const [flashSale, featured, newArrivals, trending, discounted] =
    await Promise.all([
      getFlashSaleProductsServer(12),
      getFeaturedProductsServer(12),
      getNewArrivalsServer(12),
      getTrendingProductsServer(12),
      getDiscountedProductsServer(12),
    ]);

  const sections: { title: string; products: ProductType[] }[] = [
    { title: "Flash Sale", products: flashSale?.data || [] },
    { title: "Featured Products", products: featured?.data || [] },
    { title: "New Arrivals", products: newArrivals?.data || [] },
    // { title: "Trending Now", products: trending?.data || [] },
    // { title: "Discounted Products", products: discounted?.data || [] },
  ];

  return (
    <>
      {sections.map((section) => (
        <ProductSection
          key={section.title}
          title={section.title}
          products={section.products}
        />
      ))}
    </>
  );
}