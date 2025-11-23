// app/products/ProductsPageClient.tsx
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useGetCategoriesQuery } from "@/features/apiSlice";
import {
  useGetProductsQuery,
  useFilterProductsMutation,
} from "@/features/productApi";

import ProductCategories from "@/components/product/productcategory/ProductCategories";
import { ProductCard } from "@/components/product/productcard/ProductCard";
import { ProductHeader } from "@/components/product/header/ProductHeader";
import {
  FilterSidebar,
  ProductFilters,
} from "@/components/product/filter/FilterSidebar";

import {
  truncateCategories,
  getCategoryPath,
  findLeafCategories,
} from "@/utils/category";
import CategoryBreadcrumb from "@/components/product/productcategory/CategoryBreadCumb";
import FinixmartLoader from "@/components/loader/Loader";

interface ProductsPageProps {
  initialCategories?: any[];
  initialProducts?: any[];
  staticPaths?: any[];
}

const ProductsPage: React.FC<ProductsPageProps> = ({
  initialCategories = [],
  initialProducts = [],
  staticPaths = [],
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Use RTK queries with initial data from server
  const {
    data: categoriesData,
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useGetCategoriesQuery(undefined, {
    skip: initialCategories.length > 0,
  });

  const {
    data: productsData,
    isLoading: productsLoading,
    error: productsError,
  } = useGetProductsQuery(undefined, {
    skip: initialProducts.length > 0,
  });

  const [filterProducts, { data: filteredProducts, isLoading: filterLoading }] =
    useFilterProductsMutation();

  // Use initial data or fetched data
  const categories = categoriesData || initialCategories;
  const products = productsData || initialProducts;

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>("");
  const [currentFilters, setCurrentFilters] = useState<ProductFilters>({
    categories: [],
    priceRange: [1, 100000],
    attributes: {},
    specifications: {},
    brands: [],
    vendors: [],
    ratings: [],
    availability: [],
  });
  const [isUrlProcessing, setIsUrlProcessing] = useState(false);

  // Handle URL parameters for both SSR and client-side navigation
  useEffect(() => {
    const categoryFromUrl = searchParams.get("category");
    
    console.log("URL category changed:", categoryFromUrl);

    if (categoryFromUrl && categories.length > 0) {
      setIsUrlProcessing(true);
      const category = categories.find(
        (c: any) => c.slug === categoryFromUrl
      );
      
      if (category) {
        console.log("Found category:", category.name);
        setSelectedCategory(category.id);
        setCurrentFilters((prev) => ({
          ...prev,
          categories: [category.id],
        }));
      } else {
        console.log("Category not found in categories list");
        setSelectedCategory("");
        setCurrentFilters((prev) => ({
          ...prev,
          categories: [],
        }));
      }
      setIsUrlProcessing(false);
    } else if (!categoryFromUrl) {
      setIsUrlProcessing(true);
      console.log("Clearing category selection - no category in URL");
      setSelectedCategory("");
      setSelectedCategorySlug("");
      setCurrentFilters((prev) => ({
        ...prev,
        categories: [],
      }));
      setIsUrlProcessing(false);
    }
  }, [searchParams, categories]);

  // Update category slug when category is selected
  useEffect(() => {
    if (selectedCategory && categories.length > 0) {
      const category = categories.find((c: any) => c.id === selectedCategory);
      if (category) {
        setSelectedCategorySlug(category.slug);
      }
    } else {
      setSelectedCategorySlug("");
    }
  }, [selectedCategory, categories]);

  // Update URL when category changes from component
  useEffect(() => {
    if (selectedCategorySlug) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("category", selectedCategorySlug);
      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState({}, "", newUrl);
    } else {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("category");
      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState({}, "", newUrl);
    }
  }, [selectedCategorySlug, searchParams]);

  // Find leaf categories for a given category ID
  const getLeafCategoryIds = useCallback(
    (categoryId: string): string[] => {
      if (!categoryId || !categories.length) return [];

      const leafCategories = findLeafCategories(categories, categoryId);
      return leafCategories.map((cat) => cat.id);
    },
    [categories]
  );

  // Filter products based on current filters - with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const hasActiveFilters =
        currentFilters.priceRange[0] > 1 ||
        currentFilters.priceRange[1] < 100000 ||
        Object.values(currentFilters.attributes).some(
          (arr) => arr.length > 0
        ) ||
        Object.values(currentFilters.specifications).some(
          (arr) => arr.length > 0
        ) ||
        currentFilters.ratings.length > 0 ||
        currentFilters.availability.length > 0 ||
        currentFilters.brands.length > 0 ||
        currentFilters.vendors.length > 0;

      // Only filter if we have active filters OR a category selected
      if (hasActiveFilters || selectedCategory) {
        // Get leaf category IDs for filtering
        const leafCategoryIds = selectedCategory
          ? getLeafCategoryIds(selectedCategory)
          : [];

        // FIXED: Match ProductFilter types exactly
        // attributes: { [key: string]: string | string[] }
        const flattenedAttributes: { [key: string]: string | string[] } = {};
        Object.entries(currentFilters.attributes).forEach(([key, values]) => {
          if (Array.isArray(values) && values.length > 0) {
            if (values.length === 1) {
              flattenedAttributes[key] = String(values[0]);
            } else {
              flattenedAttributes[key] = values.map(v => String(v));
            }
          }
        });

        // specifications: { [key: string]: string | number | boolean }
        const flattenedSpecifications: { [key: string]: string | number | boolean } = {};
        Object.entries(currentFilters.specifications).forEach(([key, values]) => {
          if (Array.isArray(values) && values.length > 0) {
            const firstValue = values[0];
            // Keep as appropriate type - string, number, or boolean
            if (typeof firstValue === "number") {
              flattenedSpecifications[key] = firstValue;
            } else if (typeof firstValue === "boolean") {
              flattenedSpecifications[key] = firstValue;
            } else {
              flattenedSpecifications[key] = String(firstValue);
            }
          }
        });

        // Build filter data matching ProductFilter interface exactly
        const filterData = {
          categoryId: selectedCategory || undefined,
          categoryIds: leafCategoryIds.length > 0 ? leafCategoryIds : undefined,
          minPrice: currentFilters.priceRange[0],
          maxPrice: currentFilters.priceRange[1],
          // Matches { [key: string]: string | string[] }
          attributes: Object.keys(flattenedAttributes).length > 0 ? flattenedAttributes : undefined,
          // Matches { [key: string]: string | number | boolean }
          specifications: Object.keys(flattenedSpecifications).length > 0 ? flattenedSpecifications : undefined,
          ratings: currentFilters.ratings.length > 0 ? currentFilters.ratings : undefined,
          brands: currentFilters.brands.length > 0 ? currentFilters.brands : undefined,
          vendors: currentFilters.vendors.length > 0 ? currentFilters.vendors : undefined,
          inStock: currentFilters.availability.includes("inStock") ? true : undefined,
          onSale: currentFilters.availability.includes("onSale") ? true : undefined,
          newArrivals: currentFilters.availability.includes("newArrivals") ? true : undefined,
        };

        console.log("Applying filters:", filterData);
        console.log("Leaf category IDs for filtering:", leafCategoryIds);
        
        // Type assertion to ensure compatibility
        filterProducts(filterData as any);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [currentFilters, selectedCategory, filterProducts, getLeafCategoryIds]);

  // Determine which products to display
  const displayedProducts = useMemo(() => {
    const hasActiveFilters =
      currentFilters.priceRange[0] > 1 ||
      currentFilters.priceRange[1] < 100000 ||
      Object.values(currentFilters.attributes).some((arr) => arr.length > 0) ||
      Object.values(currentFilters.specifications).some(
        (arr) => arr.length > 0
      ) ||
      currentFilters.ratings.length > 0 ||
      currentFilters.availability.length > 0 ||
      currentFilters.brands.length > 0 ||
      currentFilters.vendors.length > 0;

    if ((hasActiveFilters || selectedCategory) && filteredProducts) {
      return filteredProducts;
    }

    return products;
  }, [products, filteredProducts, currentFilters, selectedCategory]);

  // Limit nested categories to first 3 levels
  const truncatedCategories = useMemo(
    () => truncateCategories(categories, 3),
    [categories]
  );

  // Compute breadcrumb path
  const breadcrumbPath = useMemo(
    () =>
      selectedCategory ? getCategoryPath(categories, selectedCategory) : [],
    [selectedCategory, categories]
  );

  // Check if selected category is a leaf category
  const isLeafCategory = useMemo(() => {
    if (!selectedCategory || !categories.length) return false;

    const category = categories.find((c: any) => c.id === selectedCategory);
    return category && (!category.children || category.children.length === 0);
  }, [selectedCategory, categories]);

  const getProductImage = useCallback((product: any) => {
    if (product.variants?.length && product.variants[0].images?.length) {
      return product.variants[0].images[0].url;
    }
    if (product.images?.length) return product.images[0].url;
    return "/placeholder-product.jpg";
  }, []);

  const getAllProductImages = useCallback((product: any) => {
    const images: string[] = [];
    product.images?.forEach((img: any) => images.push(img.url));
    product.variants?.forEach((v: any) =>
      v.images?.forEach((img: any) => images.push(img.url))
    );
    return images.length > 0 ? images : ["/placeholder-product.jpg"];
  }, []);

  const getProductPrice = useCallback((product: any) => {
    if (product.variants?.length) {
      const prices = product.variants
        .map((v: any) => v.price)
        .filter((p: number) => p > 0);
      return prices.length > 0 ? Math.min(...prices) : 0;
    }
    return product.price || 0;
  }, []);

  const handleProductClick = useCallback(
    (data: { slug: string; id: string }) => {
      router.push(`/products/${data.id}`);
    },
    [router]
  );

  const handleCategorySelect = useCallback((categoryId: string) => {
    setSelectedCategory(categoryId);

    setCurrentFilters((prev) => ({
      ...prev,
      categories: categoryId ? [categoryId] : [],
    }));

    if (categoryId && categories.length > 0) {
      const category = categories.find((c: any) => c.id === categoryId);
      if (category) {
        const params = new URLSearchParams(searchParams.toString());
        params.set("category", category.slug);
        router.replace(`/products?${params.toString()}`, { scroll: false });
      }
    } else {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("category");
      router.replace(`/products?${params.toString()}`, { scroll: false });
    }
  }, [categories, searchParams, router]);

  const handleFiltersChange = useCallback((filters: ProductFilters) => {
    setCurrentFilters(filters);
  }, []);

  const clearAllFilters = useCallback(() => {
    setSelectedCategory("");
    setSelectedCategorySlug("");
    setCurrentFilters({
      categories: [],
      priceRange: [1, 100000],
      attributes: {},
      specifications: {},
      brands: [],
      vendors: [],
      ratings: [],
      availability: [],
    });

    const params = new URLSearchParams(searchParams.toString());
    params.delete("category");
    router.replace(`/products?${params.toString()}`, { scroll: false });
  }, [searchParams, router]);

  // Loading states
  const isLoading =
    (initialProducts.length === 0 && productsLoading) ||
    (initialCategories.length === 0 && categoriesLoading) ||
    filterLoading ||
    isUrlProcessing;

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (currentFilters.priceRange[0] > 1 || currentFilters.priceRange[1] < 100000)
      count++;
    count += Object.values(currentFilters.attributes).flat().length;
    count += Object.values(currentFilters.specifications).flat().length;
    count += currentFilters.ratings.length;
    count += currentFilters.availability.length;
    count += currentFilters.brands.length;
    count += currentFilters.vendors.length;
    return count;
  }, [currentFilters]);

  // Generate structured data for SEO
  const structuredData = useMemo(() => {
    return {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Products",
      description: "Browse our collection of products",
      numberOfItems: displayedProducts.length,
      itemListElement: displayedProducts
        .slice(0, 10)
        .map((product: any, index: number) => ({
          "@type": "ListItem",
          position: index + 1,
          item: {
            "@type": "Product",
            name: product.name,
            description: product.description,
            image: getProductImage(product),
            offers: {
              "@type": "Offer",
              price: getProductPrice(product),
              priceCurrency: "USD",
            },
          },
        })),
    };
  }, [displayedProducts, getProductImage, getProductPrice]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="container mx-auto px-4 py-2 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <ProductCategories
            categories={truncatedCategories}
            onSelectCategory={handleCategorySelect}
            selectedCategory={selectedCategory}
          />

          <CategoryBreadcrumb
            path={
              selectedCategory
                ? breadcrumbPath
                : [{ id: "", name: "All Products" }]
            }
            onCategoryClick={(categoryId) => {
              handleCategorySelect(categoryId || "");
            }}
          />

          <ProductHeader
            totalResults={displayedProducts.length}
            viewMode={viewMode}
            setViewMode={setViewMode}
            onFilterClick={() => setIsMobileFilterOpen(true)}
            selectedCategory={
              selectedCategory
                ? categories.find((c) => c.id === selectedCategory)?.name
                : undefined
            }
            isLeafCategory={isLeafCategory}
          />
        </div>

        <div className="flex gap-6">
          {/* Sidebar with new filter API */}
          <FilterSidebar
            isMobileOpen={isMobileFilterOpen}
            onMobileClose={() => setIsMobileFilterOpen(false)}
            categoryId={selectedCategory}
            onFiltersChange={handleFiltersChange}
            currentFilters={currentFilters}
          />

          {/* Products */}
          <div className="flex-1">
            {isLoading ? (
              <FinixmartLoader onLoadingComplete={() => isLoading} />
            ) : displayedProducts.length === 0 ? (
              <div className="text-center py-10">
                <div className="text-gray-400 text-6xl mb-4">😔</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No products found
                </h3>
                <p className="text-gray-600 mb-4">
                  {activeFilterCount > 0 || selectedCategory
                    ? "Try adjusting your filters to see more results."
                    : "No products available."}
                </p>
                {(activeFilterCount > 0 || selectedCategory) && (
                  <Button variant="outline" onClick={clearAllFilters}>
                    Clear All Filters
                  </Button>
                )}
              </div>
            ) : (
              <>
                {/* Products Grid */}
                <div
                  className={
                    viewMode === "grid"
                      ? "grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                      : "space-y-2"
                  }
                >
                  {displayedProducts.map((product: any) => {
                    const primaryImage = getProductImage(product);
                    const allImages = getAllProductImages(product);
                    const price = getProductPrice(product);

                    return (
                      <div
                        key={product.id}
                        onClick={() => handleProductClick({ slug: product.slug, id: product.id })}
                        className="cursor-pointer transform transition-transform hover:scale-105"
                      >
                        <ProductCard
                          view={viewMode}
                          product={
                            {
                              id: product.id,
                              title: product.name || "Untitled Product",
                              image: primaryImage,
                              images: allImages,
                              price: price,
                              oldPrice: product.compareAtPrice || undefined,
                              colors:
                                product.variants
                                  ?.map((v: any) => v.name)
                                  .join(", ") || "",
                              rating: product.rating || 4.5,
                              reviews: product.reviewCount || 12,
                              tags: product.category?.name
                                ? [product.category.name]
                                : ["General"],
                              isNew: product.tags?.includes("new") || false,
                              onSale: product.tags?.includes("sale") || false,
                              inStock: product.status === "ACTIVE",
                            } as any
                          }
                        />
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;