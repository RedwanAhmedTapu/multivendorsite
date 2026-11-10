"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useGetCategoriesQuery } from "@/features/apiSlice";
import {
  useGetProductsQuery,
  useFilterProductsQuery,
} from "@/features/productapi/commonProductApi"; 

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
  initialProducts?: any[]; // This is now a plain array from server
  staticPaths?: any[];
}

const ProductsPage: React.FC<ProductsPageProps> = ({
  initialCategories = [],
  initialProducts = [],
  staticPaths = [],
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ============================================
  // 1. RTK QUERY HOOKS
  // ============================================
  
  const {
    data: categoriesData,
    isLoading: categoriesLoading,
  } = useGetCategoriesQuery(undefined, {
    skip: initialCategories.length > 0,
  });

  const {
    data: productsData, // CursorPage<Product>
    isLoading: productsLoading,
  } = useGetProductsQuery({}, {
    skip: initialProducts.length > 0,
  });

  // ============================================
  // 2. LOCAL STATE (MUST be defined before useMemo that uses them)
  // ============================================
  
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

  const isInitialMount = useRef(true);

  // ============================================
  // 3. URL-DERIVED STATE
  // ============================================
  
  const categorySlugFromUrl = useMemo(() => {
    return searchParams.get("category");
  }, [searchParams]);

  const isBaseProductsPage = useMemo(() => {
    const hasQueryParams = searchParams.toString().length > 0;
    const hasCategoryParam = searchParams.has("category");
    const hasOtherParams = Array.from(searchParams.keys()).some(
      (key) => key !== "category"
    );
    return !hasQueryParams || (!hasCategoryParam && !hasOtherParams);
  }, [searchParams]);

  // ============================================
  // 4. FILTER QUERY PARAMS (Uses currentFilters - now safely defined)
  // ============================================
  
  const filterQueryParams = useMemo((): Record<string, any> | undefined => {
    const hasActiveFilters =
      currentFilters.priceRange[0] > 1 ||
      currentFilters.priceRange[1] < 100000 ||
      Object.values(currentFilters.attributes).some((arr) => arr.length > 0) ||
      currentFilters.ratings.length > 0 ||
      currentFilters.availability.length > 0 ||
      currentFilters.brands.length > 0 ||
      currentFilters.vendors.length > 0;

    // Skip query if no filters and no category
    if (!hasActiveFilters && !selectedCategorySlug) {
      return undefined;
    }

    // Build unified attributes structure
    const unifiedAttributes: Record<string, string | string[] | number | number[] | boolean> = {};

    Object.entries(currentFilters.attributes).forEach(([key, values]) => {
      if (Array.isArray(values) && values.length > 0) {
        const firstValue = values[0];

        if (typeof firstValue === "number") {
          unifiedAttributes[key] = values.length === 1 ? firstValue : values;
        } else if (typeof firstValue === "boolean") {
          unifiedAttributes[key] = firstValue;
        } else {
          unifiedAttributes[key] = values.length === 1 ? String(firstValue) : values.map(String);
        }
      }
    });

    const params: Record<string, any> = {};

    if (selectedCategorySlug) {
      params.categorySlug = selectedCategorySlug;
    }
    if (currentFilters.priceRange[0] > 1) {
      params.minPrice = currentFilters.priceRange[0];
    }
    if (currentFilters.priceRange[1] < 100000) {
      params.maxPrice = currentFilters.priceRange[1];
    }
    if (Object.keys(unifiedAttributes).length > 0) {
      params.attributes = unifiedAttributes;
    }
    if (currentFilters.ratings.length > 0) {
      params.ratings = currentFilters.ratings;
    }
    if (currentFilters.brands.length > 0) {
      params.brandNames = currentFilters.brands;
    }
    if (currentFilters.vendors.length > 0) {
      params.vendorNames = currentFilters.vendors;
    }
    if (currentFilters.availability.includes("inStock")) {
      params.inStock = true;
    }
    if (currentFilters.availability.includes("onSale")) {
      params.onSale = true;
    }
    if (currentFilters.availability.includes("newArrivals")) {
      params.newArrivals = true;
    }

    return params;
  }, [currentFilters, selectedCategorySlug]);

  // ============================================
  // 5. FILTERED PRODUCTS QUERY
  // ============================================
  
  const {
    data: filteredProductsData, // CursorPage<Product>
    isLoading: filterLoading,
  } = useFilterProductsQuery(filterQueryParams as any, {
    skip: !filterQueryParams,
  });

  // ============================================
  // 6. DATA EXTRACTION
  // ============================================
  
  const categories = categoriesData || initialCategories;

  // Extract items from CursorPage OR use initial products
  const allProducts = useMemo(() => {
    if (productsData?.items) {
      return productsData.items;
    }
    if (initialProducts.length > 0) {
      return initialProducts;
    }
    return [];
  }, [productsData, initialProducts]);

  // Extract items from filtered CursorPage
  const filteredProducts = useMemo(() => {
    if (filteredProductsData?.items) {
      return filteredProductsData.items;
    }
    return null;
  }, [filteredProductsData]);

  // ============================================
  // 7. URL SYNC EFFECTS
  // ============================================
  
  useEffect(() => {
    if (isInitialMount.current) {
      if (categorySlugFromUrl) {
        setSelectedCategorySlug(categorySlugFromUrl);
      }
      isInitialMount.current = false;
    }
  }, [categorySlugFromUrl]);

  useEffect(() => {
    if (isInitialMount.current) return;

    if (categorySlugFromUrl && categorySlugFromUrl !== selectedCategorySlug) {
      setSelectedCategorySlug(categorySlugFromUrl);
    } else if (!categorySlugFromUrl && selectedCategorySlug) {
      setSelectedCategorySlug("");
    }
  }, [categorySlugFromUrl, selectedCategorySlug]);

  // ============================================
  // 8. CATEGORY HELPERS
  // ============================================
  
  const findCategoryBySlug = useCallback((categoriesList: any[], targetSlug: string): any => {
    for (const category of categoriesList) {
      if (category.slug === targetSlug) return category;
      if (category.children?.length > 0) {
        const found = findCategoryBySlug(category.children, targetSlug);
        if (found) return found;
      }
    }
    return null;
  }, []);

  const findCategoryById = useCallback((categoriesList: any[], targetId: string): any => {
    for (const category of categoriesList) {
      if (category.id === targetId) return category;
      if (category.children?.length > 0) {
        const found = findCategoryById(category.children, targetId);
        if (found) return found;
      }
    }
    return null;
  }, []);

  // ============================================
  // 9. DERIVED CATEGORY STATE
  // ============================================
  
  const selectedCategoryId = useMemo(() => {
    if (!selectedCategorySlug || !categories.length) return "";
    const category = findCategoryBySlug(categories, selectedCategorySlug);
    return category?.id || "";
  }, [selectedCategorySlug, categories, findCategoryBySlug]);

  const selectedCategoryName = useMemo(() => {
    if (!selectedCategorySlug || !categories.length) return "";
    const category = findCategoryBySlug(categories, selectedCategorySlug);
    return category?.name || "";
  }, [selectedCategorySlug, categories, findCategoryBySlug]);

  const breadcrumbPath = useMemo(
    () => selectedCategoryId ? getCategoryPath(categories, selectedCategoryId) : [],
    [selectedCategoryId, categories]
  );

  const isLeafCategory = useMemo(() => {
    if (!selectedCategoryId || !categories.length) return false;
    const category = findCategoryById(categories, selectedCategoryId);
    return category && (!category.children || category.children.length === 0);
  }, [selectedCategoryId, categories, findCategoryById]);

  const truncatedCategories = useMemo(
    () => truncateCategories(categories, 3),
    [categories]
  );

  // ============================================
  // 10. DISPLAY LOGIC
  // ============================================
  
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

  const totalProductCount = useMemo(() => {
    // Use pagination total if available (from filtered query)
    if (filteredProductsData?.pagination?.total !== undefined) {
      return filteredProductsData.pagination.total;
    }
    // Use pagination total from base query
    if (productsData?.pagination?.total !== undefined) {
      return productsData.pagination.total;
    }
    // Fallback to displayed items count
    return displayedProducts.length;
  }, [filteredProductsData, productsData, displayedProducts]);

  // ============================================
  // 11. LOADING & COUNT STATES
  // ============================================
  
  const isLoading =
    (initialProducts.length === 0 && productsLoading) ||
    (initialCategories.length === 0 && categoriesLoading) ||
    filterLoading;

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (currentFilters.priceRange[0] > 1 || currentFilters.priceRange[1] < 100000) count++;
    count += Object.values(currentFilters.attributes).flat().length;
    count += currentFilters.ratings.length;
    count += currentFilters.availability.length;
    count += currentFilters.brands.length;
    count += currentFilters.vendors.length;
    if (selectedCategorySlug) count++;
    return count;
  }, [currentFilters, selectedCategorySlug]);

  // ============================================
  // 12. HANDLERS
  // ============================================
  
  const handleProductClick = useCallback(
    (data: { slug: string; id: string }) => {
      router.push(`/products/${data.slug || data.id}`);
    },
    [router]
  );

 const handleCategorySelect = useCallback(
    (categorySlug: string) => {
      if (categorySlug) {
        router.push(`/category/${categorySlug}`);  
      } else {
        router.push('/products');
      }
      
      // Filter reset korun
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
    [router]
  );

  const handleFiltersChange = useCallback((filters: ProductFilters) => {
    setCurrentFilters(filters);
  }, []);

 const clearAllFilters = useCallback(() => {
    router.replace('/products', { scroll: false });
    
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
  }, [router]);

  // ============================================
  // 13. SEO STRUCTURED DATA
  // ============================================
  
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
            image: product.images?.[0]?.url,
            offers: {
              "@type": "Offer",
              price: product.variants?.[0]?.specialPrice || product.variants?.[0]?.price || 0,
              priceCurrency: "BDT",
            },
          },
        })),
    };
  }, [displayedProducts]);

  // ============================================
  // 14. GRID COLUMNS HELPER
  // ============================================
  
  const getGridColumns = useCallback(() => {
    if (viewMode === "list") {
      return "space-y-2";
    }
    if (isBaseProductsPage) {
      return "grid gap-1 sm:gap-2 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6";
    }
    return "grid gap-1 sm:gap-2 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";
  }, [viewMode, isBaseProductsPage]);

  // ============================================
  // 15. RENDER
  // ============================================
  
  return (
    <div className="min-h-screen bg-gray-50">
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
              const category = findCategoryById(categories, categoryId);
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
              const category = findCategoryById(categories, categoryId);
              handleCategorySelect(category?.slug || "");
            }}
          />

          <ProductHeader
            totalResults={totalProductCount}
            viewMode={viewMode}
            setViewMode={setViewMode}
            onFilterClick={() => setIsMobileFilterOpen(true)}
            selectedCategory={selectedCategoryName}
            isLeafCategory={isLeafCategory}
          />
        </div>

        <div className="flex gap-6">
          {/* Sidebar */}
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
            ) : displayedProducts.length === 0 ? (
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
                <div className={getGridColumns()}>
                  {displayedProducts.map((product: any) => (
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

                {/* Load More for Cursor Pagination */}
                {(filteredProductsData?.pagination?.hasMore ||
                  (!filteredProductsData && productsData?.pagination?.hasMore)) && (
                  <div className="flex justify-center mt-8">
                    <Button
                      variant="outline"
                      size="lg"
                      className="px-12"
                    >
                      Load More Products
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
};

export default ProductsPage;