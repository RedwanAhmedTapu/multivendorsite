// pages/products/index.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useGetCategoriesQuery } from "@/features/apiSlice";
import { useGetProductsQuery } from "@/features/productApi";

import ProductCategories from "@/components/product/productcategory/ProductCategories";
import { ProductCard } from "@/components/product/productcard/ProductCard";
import { ProductHeader } from "@/components/product/header/ProductHeader";
import { FilterSidebar } from "@/components/product/filter/FilterSidebar";

import { truncateCategories, getCategoryPath } from "@/utils/category";
import CategoryBreadcrumb from "@/components/product/productcategory/CategoryBreadCumb";

const ProductsPage = () => {
  const router = useRouter();
  const { data: products = [], isLoading } = useGetProductsQuery();
  const { data: categories = [] } = useGetCategoriesQuery();

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  // Limit nested categories to first 3 levels
  const truncatedCategories = truncateCategories(categories, 3);

  // Compute breadcrumb path
  const breadcrumbPath = selectedCategory
    ? getCategoryPath(categories, selectedCategory)
    : [];

  const getProductImage = (product: any) => {
    if (product.variants?.length && product.variants[0].images?.length) {
      return product.variants[0].images[0].url;
    }
    if (product.images?.length) return product.images[0].url;
    return "";
  };

  const getAllProductImages = (product: any) => {
    const images: string[] = [];
    product.images?.forEach((img: any) => images.push(img.url));
    product.variants?.forEach((v: any) =>
      v.images?.forEach((img: any) => images.push(img.url))
    );
    return images;
  };

  const handleProductClick = (productId: string) => {
    router.push(`/products/${productId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <ProductCategories
            categories={truncatedCategories}
            onSelectCategory={(cat) => setSelectedCategory(cat)}
          />
          <CategoryBreadcrumb
            path={
              selectedCategory
                ? getCategoryPath(categories, selectedCategory)
                : [{ name: "All Products" }]
            }
          />

          <ProductHeader
            totalResults={products.length}
            viewMode={viewMode}
            setViewMode={setViewMode}
            onFilterClick={() => setIsMobileFilterOpen(true)}
          />
        </div>

        <div className="flex gap-6">
          {/* Sidebar */}
          <FilterSidebar
            isMobileOpen={isMobileFilterOpen}
            onMobileClose={() => setIsMobileFilterOpen(false)}
          />

          {/* Products */}
          <div className="flex-1">
            {isLoading ? (
              <div className="text-center py-10">Loading...</div>
            ) : products.length === 0 ? (
              <div className="text-center py-10">No products found</div>
            ) : (
              <div
                className={
                  viewMode === "grid"
                    ? "grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                    : "space-y-6"
                }
              >
                {products.map((p: any) => {
                  const primaryImage = getProductImage(p);
                  const allImages = getAllProductImages(p);

                  return (
                    <div 
                      key={p.id} 
                      onClick={() => handleProductClick(p.id)}
                      className="cursor-pointer"
                    >
                      <ProductCard
                        view={viewMode}
                        product={{
                          id: p.id,
                          title: p.name || "Untitled Product",
                          image: primaryImage,
                          images: allImages,
                          price: p.variants?.[0]?.price || 0,
                          oldPrice: undefined,
                          colors:
                            p.variants?.map((v: any) => v.name).join(", ") || "",
                          rating: 4.5,
                          reviews: 12,
                          tags: p.category?.name
                            ? [p.category.name]
                            : ["General"],
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;