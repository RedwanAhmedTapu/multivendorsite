"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
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
} from "@/utils/category";
import CategoryBreadcrumb from "@/components/product/productcategory/CategoryBreadCumb";
import { ProductsPageSkeleton } from "@/components/skeletons/ProductPageSkeleton";
import { Container } from "@/components/Container";

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
  } = useGetProductsQuery({}, {
    skip: initialProducts.length > 0,
  });

  const [
    filterProducts,
    { data: filteredProductsResponse, isLoading: filterLoading },
  ] = useFilterProductsMutation();

  // Use initial data or fetched data
  const categories = categoriesData || initialCategories;

  // Extract products from the response structure
  const allProducts = useMemo(() => {
    if (productsData) return productsData;
    if (initialProducts.length > 0) return initialProducts;
    return [];
  }, [productsData, initialProducts]);

  const filteredProducts = useMemo(() => {
    if (filteredProductsResponse) return filteredProductsResponse;
    return null;
  }, [filteredProductsResponse]);

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>("");
  const [currentFilters, setCurrentFilters] = useState<ProductFilters>({
    categories: [],
    priceRange: [1, 100000],
    attributes: {},
    brands: [],
    vendors: [],
    ratings: [],
    availability: [],
  });

  // Use refs to track if we're in the middle of an update
  const isInitialMount = useRef(true);

  // Check if this is the base products page (no query params)
  const isBaseProductsPage = useMemo(() => {
    const hasQueryParams = searchParams.toString().length > 0;
    const hasCategoryParam = searchParams.has("category");
    const hasOtherParams = Array.from(searchParams.keys()).some(
      (key) => key !== "category"
    );

    return !hasQueryParams || (!hasCategoryParam && !hasOtherParams);
  }, [searchParams]);

  // Get category from URL
  const categorySlugFromUrl = useMemo(() => {
    return searchParams.get("category");
  }, [searchParams]);

  // Initialize from URL on first mount
  useEffect(() => {
    if (isInitialMount.current) {
      if (categorySlugFromUrl) {
        setSelectedCategorySlug(categorySlugFromUrl);
      }
      isInitialMount.current = false;
    }
  }, [categorySlugFromUrl]);

  // Handle URL parameter changes (only after initial mount)
  useEffect(() => {
    if (isInitialMount.current) {
      return;
    }

    if (categorySlugFromUrl && categorySlugFromUrl !== selectedCategorySlug) {
      console.log("Category slug from URL changed:", categorySlugFromUrl);
      setSelectedCategorySlug(categorySlugFromUrl);
    } else if (!categorySlugFromUrl && selectedCategorySlug) {
      console.log("Clearing category selection - no category in URL");
      setSelectedCategorySlug("");
    }
  }, [categorySlugFromUrl, selectedCategorySlug]);

  // Find selected category ID from slug (for UI display only)
  const selectedCategoryId = useMemo(() => {
    if (!selectedCategorySlug || !categories.length) return "";
    
    // Find category by slug (this is just for UI - server handles the real filtering)
    const findCategoryBySlug = (categoriesList: any[], targetSlug: string): any => {
      for (const category of categoriesList) {
        if (category.slug === targetSlug) {
          return category;
        }
        
        if (category.children && category.children.length > 0) {
          const foundInChildren = findCategoryBySlug(category.children, targetSlug);
          if (foundInChildren) {
            return foundInChildren;
          }
        }
      }
      return null;
    };
    
    const category = findCategoryBySlug(categories, selectedCategorySlug);
    return category?.id || "";
  }, [selectedCategorySlug, categories]);

  // Find selected category name (for UI display)
  const selectedCategoryName = useMemo(() => {
    if (!selectedCategorySlug || !categories.length) return "";
    
    const findCategoryNameBySlug = (categoriesList: any[], targetSlug: string): string => {
      for (const category of categoriesList) {
        if (category.slug === targetSlug) {
          return category.name;
        }
        
        if (category.children && category.children.length > 0) {
          const foundInChildren = findCategoryNameBySlug(category.children, targetSlug);
          if (foundInChildren) {
            return foundInChildren;
          }
        }
      }
      return "";
    };
    
    return findCategoryNameBySlug(categories, selectedCategorySlug);
  }, [selectedCategorySlug, categories]);

  // Filter products based on current filters - with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const hasActiveFilters =
        currentFilters.priceRange[0] > 1 ||
        currentFilters.priceRange[1] < 100000 ||
        Object.values(currentFilters.attributes).some(
          (arr) => arr.length > 0
        ) ||
        currentFilters.ratings.length > 0 ||
        currentFilters.availability.length > 0 ||
        currentFilters.brands.length > 0 ||
        currentFilters.vendors.length > 0;

      // Always filter when there's a category slug or other filters
      if (hasActiveFilters || selectedCategorySlug) {
        // Unified attributes structure
        const unifiedAttributes: {
          [key: string]: string | string[] | number | number[] | boolean;
        } = {};

        Object.entries(currentFilters.attributes).forEach(([key, values]) => {
          if (Array.isArray(values) && values.length > 0) {
            const firstValue = values[0];

            if (typeof firstValue === "number") {
              if (values.length === 1) {
                unifiedAttributes[key] = firstValue;
              } else {
                unifiedAttributes[key] = values;
              }
            } else if (typeof firstValue === "boolean") {
              unifiedAttributes[key] = firstValue;
            } else {
              if (values.length === 1) {
                unifiedAttributes[key] = String(firstValue);
              } else {
                unifiedAttributes[key] = values.map((v) => String(v));
              }
            }
          }
        });

        // Build filter data - send categorySlug directly to server
        const filterData = {
          categorySlug: selectedCategorySlug || undefined, // Send slug to server
          minPrice: currentFilters.priceRange[0],
          maxPrice: currentFilters.priceRange[1],
          attributes:
            Object.keys(unifiedAttributes).length > 0
              ? unifiedAttributes
              : undefined,
          ratings:
            currentFilters.ratings.length > 0
              ? currentFilters.ratings
              : undefined,
          brands:
            currentFilters.brands.length > 0
              ? currentFilters.brands
              : undefined,
          vendors:
            currentFilters.vendors.length > 0
              ? currentFilters.vendors
              : undefined,
          inStock: currentFilters.availability.includes("inStock")
            ? true
            : undefined,
          onSale: currentFilters.availability.includes("onSale")
            ? true
            : undefined,
          newArrivals: currentFilters.availability.includes("newArrivals")
            ? true
            : undefined,
        };

        console.log("Applying filters with category slug:", filterData);

        // Call filter API - server will handle category matching
        filterProducts(filterData as any);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [currentFilters, selectedCategorySlug, filterProducts]);

  // Determine which products to display
  const displayedProducts = useMemo(() => {
    const hasActiveFilters =
      currentFilters.priceRange[0] > 1 ||
      currentFilters.priceRange[1] < 100000 ||
      Object.values(currentFilters.attributes).some((arr) => arr.length > 0) ||
      currentFilters.ratings.length > 0 ||
      currentFilters.availability.length > 0 ||
      currentFilters.brands.length > 0 ||
      currentFilters.vendors.length > 0;

    if ((hasActiveFilters || selectedCategorySlug) && filteredProducts) {
      return filteredProducts;
    }

    return allProducts;
  }, [allProducts, filteredProducts, currentFilters, selectedCategorySlug]);

  // Limit nested categories to first 3 levels
  const truncatedCategories = useMemo(
    () => truncateCategories(categories, 3),
    [categories]
  );

  // Compute breadcrumb path
  const breadcrumbPath = useMemo(
    () =>
      selectedCategoryId ? getCategoryPath(categories, selectedCategoryId) : [],
    [selectedCategoryId, categories]
  );

  // Check if selected category is a leaf category
  const isLeafCategory = useMemo(() => {
    if (!selectedCategoryId || !categories.length) return false;

    const category = categories.find((c: any) => c.id === selectedCategoryId);
    return category && (!category.children || category.children.length === 0);
  }, [selectedCategoryId, categories]);

  const handleProductClick = useCallback(
    (data: { slug: string; id: string }) => {
      router.push(`/products/${data.id}`);
    },
    [router]
  );

  const handleCategorySelect = useCallback(
    (categorySlug: string) => {
      console.log("Category selected via slug:", categorySlug);
      
      // Update URL
      const params = new URLSearchParams(searchParams.toString());
      
      if (categorySlug) {
        params.set("category", categorySlug);
      } else {
        params.delete("category");
      }
      
      // Remove other filter params when changing category
      const filterParams = ["minPrice", "maxPrice", "brands", "ratings", "availability"];
      filterParams.forEach(param => params.delete(param));
      
      router.replace(`/products?${params.toString()}`, { scroll: false });
      
      // Reset filters when category changes
      setCurrentFilters({
        categories: [],
        priceRange: [1, 100000],
        attributes: {},
        brands: [],
        vendors: [],
        ratings: [],
        availability: [],
      });
    },
    [searchParams, router]
  );

  const handleFiltersChange = useCallback((filters: ProductFilters) => {
    setCurrentFilters(filters);
  }, []);

  const clearAllFilters = useCallback(() => {
    // Update URL
    const params = new URLSearchParams(searchParams.toString());
    params.delete("category");
    
    // Clear all filter params
    const filterParams = ["minPrice", "maxPrice", "brands", "ratings", "availability"];
    filterParams.forEach(param => params.delete(param));
    
    router.replace(`/products?${params.toString()}`, { scroll: false });
    
    // Reset state
    setSelectedCategorySlug("");
    setCurrentFilters({
      categories: [],
      priceRange: [1, 100000],
      attributes: {},
      brands: [],
      vendors: [],
      ratings: [],
      availability: [],
    });
  }, [searchParams, router]);

  // Loading states
  const isLoading =
    (initialProducts.length === 0 && productsLoading) ||
    (initialCategories.length === 0 && categoriesLoading) ||
    filterLoading;

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (
      currentFilters.priceRange[0] > 1 ||
      currentFilters.priceRange[1] < 100000
    )
      count++;
    count += Object.values(currentFilters.attributes).flat().length;
    count += currentFilters.ratings.length;
    count += currentFilters.availability.length;
    count += currentFilters.brands.length;
    count += currentFilters.vendors.length;
    if (selectedCategorySlug) count++; // Count category as an active filter
    return count;
  }, [currentFilters, selectedCategorySlug]);

  // Generate structured data for SEO
  const structuredData = useMemo(() => {
    const productsArray = Array.isArray(displayedProducts) 
      ? displayedProducts 
      : displayedProducts?.data || [];
    
    return {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Products",
      description: "Browse our collection of products",
      numberOfItems: productsArray.length,
      itemListElement: productsArray
        .slice(0, 10)
        .map((product: any, index: number) => ({
          "@type": "ListItem",
          position: index + 1,
          item: {
            "@type": "Product",
            name: product.name,
            description: product.description,
            image: product.images?.[0]?.url,
            offers: {
              "@type": "Offer",
              price:
                product.variants?.[0]?.specialPrice ||
                product.variants?.[0]?.price ||
                0,
              priceCurrency: "USD",
            },
          },
        })),
    };
  }, [displayedProducts]);

  // Determine grid columns based on whether it's base products page
  const getGridColumns = useCallback(() => {
    if (viewMode === "list") {
      return "space-y-2";
    }

    if (isBaseProductsPage) {
      return "grid gap-1 sm:gap-2 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6";
    } else {
      return "grid gap-1 sm:gap-2 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";
    }
  }, [viewMode, isBaseProductsPage]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <Container>
        {/* Header */}
        <div className="mb-6">
          <ProductCategories
            categories={truncatedCategories}
            onSelectCategory={(categoryId) => {
              // Find category by ID to get slug
              const category = categories.find((c: any) => c.id === categoryId);
              handleCategorySelect(category?.slug || "");
            }}
            selectedCategory={selectedCategoryId}
          />

          <CategoryBreadcrumb
            path={
              selectedCategoryId
                ? breadcrumbPath
                : [{ id: "", name: "All Products" }]
            }
            onCategoryClick={(categoryId) => {
              // Find category by ID to get slug
              const category = categories.find((c: any) => c.id === categoryId);
              handleCategorySelect(category?.slug || "");
            }}
          />

          <ProductHeader
            totalResults={Array.isArray(displayedProducts) ? displayedProducts.length : (displayedProducts?.data?.length || 0)}
            viewMode={viewMode}
            setViewMode={setViewMode}
            onFilterClick={() => setIsMobileFilterOpen(true)}
            selectedCategory={selectedCategoryName}
            isLeafCategory={isLeafCategory}
          />
        </div>

        <div className="flex gap-6">
          {/* Sidebar with new filter API */}
          <FilterSidebar
            isMobileOpen={isMobileFilterOpen}
            onMobileClose={() => setIsMobileFilterOpen(false)}
            categorySlug={selectedCategorySlug}
            onFiltersChange={handleFiltersChange}
            currentFilters={currentFilters}
          />

          {/* Products */}
          <div className="flex-1">
            {isLoading ? (
              <ProductsPageSkeleton
                isBaseProductsPage={isBaseProductsPage}
                viewMode={viewMode}
              />
            ) : (Array.isArray(displayedProducts) ? displayedProducts.length : displayedProducts?.data?.length || 0) === 0 ? (
              <div className="text-center py-10">
                <div className="text-gray-400 text-6xl mb-4">😔</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No products found
                </h3>
                <p className="text-gray-600 mb-4">
                  {activeFilterCount > 0 || selectedCategorySlug
                    ? "Try adjusting your filters to see more results."
                    : "No products available."}
                </p>
                {(activeFilterCount > 0 || selectedCategorySlug) && (
                  <Button variant="outline" onClick={clearAllFilters}>
                    Clear All Filters
                  </Button>
                )}
              </div>
            ) : (
              <>
                {/* Products Grid */}
                <div className={getGridColumns()}>
                  {(Array.isArray(displayedProducts) ? displayedProducts : displayedProducts?.data || []).map((product: any) => (
                    <div
                      key={product.id}
                      onClick={() =>
                        handleProductClick({
                          slug: product.slug,
                          id: product.id,
                        })
                      }
                      className="cursor-pointer"
                    >
                      <ProductCard view={viewMode} product={product} />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
};

export default ProductsPage;