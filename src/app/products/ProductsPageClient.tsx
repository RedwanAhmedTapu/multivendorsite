// app/products/ProductsPageClient.tsx
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
  findLeafCategories,
} from "@/utils/category";
import CategoryBreadcrumb from "@/components/product/productcategory/CategoryBreadCumb";
import { ProductsPageSkeleton } from "@/components/skeletons/ProductPageSkeleton";

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
  const [selectedCategory, setSelectedCategory] = useState<string>("");
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
  const isUpdatingFromUrl = useRef(false);
  const isUpdatingToUrl = useRef(false);
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

  // Handle URL parameters - only update state from URL
  useEffect(() => {
    if (isUpdatingToUrl.current) {
      isUpdatingToUrl.current = false;
      return;
    }

    const categoryFromUrl = searchParams.get("category");
    console.log("URL category changed:", categoryFromUrl);

    if (categoryFromUrl && categories.length > 0) {
      const category = categories.find((c: any) => c.slug === categoryFromUrl);

      if (category) {
        console.log("Found category:", category.name);
        isUpdatingFromUrl.current = true;
        setSelectedCategory(category.id);
        setSelectedCategorySlug(category.slug);
        setCurrentFilters((prev) => ({
          ...prev,
          categories: [category.id],
        }));
        isUpdatingFromUrl.current = false;
      } else {
        console.log("Category not found in categories list");
        setSelectedCategory("");
        setSelectedCategorySlug("");
        setCurrentFilters((prev) => ({
          ...prev,
          categories: [],
        }));
      }
    } else if (!categoryFromUrl && !isInitialMount.current) {
      console.log("Clearing category selection - no category in URL");
      setSelectedCategory("");
      setSelectedCategorySlug("");
      setCurrentFilters((prev) => ({
        ...prev,
        categories: [],
      }));
    }

    if (isInitialMount.current) {
      isInitialMount.current = false;
    }
  }, [searchParams, categories]);

  // Update URL when category changes from component (not from URL)
  useEffect(() => {
    if (isUpdatingFromUrl.current || isInitialMount.current) {
      return;
    }

    if (selectedCategorySlug) {
      const params = new URLSearchParams(searchParams.toString());
      if (params.get("category") !== selectedCategorySlug) {
        params.set("category", selectedCategorySlug);
        isUpdatingToUrl.current = true;
        router.replace(`/products?${params.toString()}`, { scroll: false });
      }
    } else {
      const params = new URLSearchParams(searchParams.toString());
      if (params.has("category")) {
        params.delete("category");
        isUpdatingToUrl.current = true;
        router.replace(`/products?${params.toString()}`, { scroll: false });
      }
    }
  }, [selectedCategorySlug, searchParams, router]);

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

        // Unified attributes structure
        const unifiedAttributes: { [key: string]: string | string[] | number | number[] | boolean } = {};
        
        Object.entries(currentFilters.attributes).forEach(([key, values]) => {
          if (Array.isArray(values) && values.length > 0) {
            const firstValue = values[0];
            
            if (typeof firstValue === 'number') {
              if (values.length === 1) {
                unifiedAttributes[key] = firstValue;
              } else {
                unifiedAttributes[key] = values;
              }
            } else if (typeof firstValue === 'boolean') {
              unifiedAttributes[key] = firstValue;
            } else {
              if (values.length === 1) {
                unifiedAttributes[key] = String(firstValue);
              } else {
                unifiedAttributes[key] = values.map(v => String(v));
              }
            }
          }
        });

        // Build filter data matching ProductFilter interface
        const filterData = {
          categoryId: selectedCategory || undefined,
          categoryIds: leafCategoryIds.length > 0 ? leafCategoryIds : undefined,
          minPrice: currentFilters.priceRange[0],
          maxPrice: currentFilters.priceRange[1],
          attributes: Object.keys(unifiedAttributes).length > 0 
            ? unifiedAttributes 
            : undefined,
          ratings: currentFilters.ratings.length > 0
            ? currentFilters.ratings
            : undefined,
          brands: currentFilters.brands.length > 0
            ? currentFilters.brands
            : undefined,
          vendors: currentFilters.vendors.length > 0
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

        console.log("Applying filters:", filterData);
        console.log("Leaf category IDs for filtering:", leafCategoryIds);

        // Call filter API
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
      currentFilters.ratings.length > 0 ||
      currentFilters.availability.length > 0 ||
      currentFilters.brands.length > 0 ||
      currentFilters.vendors.length > 0;

    if ((hasActiveFilters || selectedCategory) && filteredProducts) {
      return filteredProducts;
    }

    return allProducts;
  }, [allProducts, filteredProducts, currentFilters, selectedCategory]);

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

  const handleProductClick = useCallback(
    (data: { slug: string; id: string }) => {
      router.push(`/products/${data.id}`);
    },
    [router]
  );

  const handleCategorySelect = useCallback(
    (categoryId: string) => {
      if (categoryId === selectedCategory) {
        return; // Already selected, no need to update
      }

      setSelectedCategory(categoryId);

      setCurrentFilters((prev) => ({
        ...prev,
        categories: categoryId ? [categoryId] : [],
      }));

      if (categoryId && categories.length > 0) {
        const category = categories.find((c: any) => c.id === categoryId);
        if (category) {
          setSelectedCategorySlug(category.slug);
        }
      } else {
        setSelectedCategorySlug("");
      }
    },
    [categories, selectedCategory]
  );

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
      return "grid gap-1 sm:gap-2 grid-cols-2 sm:grid-cols-3 md:grid-cols-4  lg:grid-cols-5 2xl:grid-cols-6";
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

      <div className="container mx-auto p-1 sm:px-4 py-2 max-w-7xl">
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
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;