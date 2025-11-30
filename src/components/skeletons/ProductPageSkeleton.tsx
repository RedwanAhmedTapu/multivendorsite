"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const ProductPageSkeleton = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-1 sm:px-4 py-2 max-w-7xl">
        {/* Header Skeleton */}
        <div className="mb-6">
          {/* Categories Skeleton */}
          <div className="mb-4">
            <Skeleton className="h-10 w-48 rounded-md" />
          </div>

          {/* Breadcrumb Skeleton */}
          <div className="mb-4">
            <div className="flex items-center space-x-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>

          {/* Product Header Skeleton */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4 mb-6 border-b bg-white rounded-lg px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-6 w-24" />
            </div>
            <div className="flex items-center gap-4">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-8 w-8 rounded-md" />
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Filter Sidebar Skeleton */}
          <div className="hidden md:block w-64 space-y-4">
            <div className="space-y-4 p-4 bg-white rounded-lg border">
              {/* Filter Header */}
              <div className="flex justify-between items-center">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-6 w-6 rounded-md" />
              </div>

              {/* Price Filter */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 flex-1" />
                  <Skeleton className="h-8 flex-1" />
                </div>
              </div>

              {/* Rating Filter */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center space-x-2">
                    <Skeleton className="h-4 w-4 rounded" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ))}
              </div>

              {/* Availability Filter */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center space-x-2">
                    <Skeleton className="h-4 w-4 rounded" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Products Grid Skeleton */}
          <div className="flex-1">
            {/* Grid Layout */}
            <div className="grid gap-1 sm:gap-2 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <ProductCardSkeleton key={index} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Individual Product Card Skeleton
export const ProductCardSkeleton = () => {
  return (
    <Card className="group relative border border-gray-200 rounded-lg p-0 shadow-sm h-full flex flex-col bg-white overflow-hidden">
      {/* Wishlist & View Icons Skeleton */}
      <div className="absolute top-3 right-3 z-20 flex flex-col gap-2">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>

      {/* Image Container Skeleton */}
      <div className="relative w-full h-44 overflow-hidden bg-gray-100">
        <Skeleton className="w-full h-full" />
      </div>

      {/* Content Skeleton */}
      <CardContent className="flex flex-col px-4 py-3 flex-grow space-y-2">
        {/* Product Name Skeleton */}
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />

        {/* Price Section Skeleton */}
        <div className="space-y-1">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>

        {/* Rating Section Skeleton */}
        <div className="flex items-center gap-2">
          <div className="flex space-x-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-3 w-3 rounded-sm" />
            ))}
          </div>
          <Skeleton className="h-3 w-12" />
        </div>

        {/* Store Name & Verified Badge Skeleton */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-4 w-12 rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
};

// List View Product Card Skeleton
export const ProductCardListSkeleton = () => {
  return (
    <Card className="w-full overflow-hidden border shadow-none">
      <CardContent className="p-0">
        <div className="flex flex-col lg:flex-row">
          {/* Image Section Skeleton */}
          <div className="lg:w-2/5 xl:w-1/3 relative bg-gray-100">
            <div className="w-full h-48 sm:h-56 md:h-64 lg:h-full flex items-center justify-center relative overflow-hidden min-h-[200px]">
              <Skeleton className="w-full h-full" />
            </div>
          </div>

          {/* Content Section Skeleton */}
          <div className="p-4 sm:p-6 lg:w-3/5 xl:w-2/3 flex flex-col justify-between">
            <div className="space-y-3">
              {/* Store Name & Verified Badge */}
              <div className="flex items-center gap-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-12 rounded-full" />
              </div>

              {/* Product Name */}
              <div className="space-y-2">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-3/4" />
              </div>

              {/* Price Section */}
              <div className="space-y-2">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>

              {/* Rating & Category */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex space-x-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-4 w-4 rounded-sm" />
                    ))}
                  </div>
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            </div>

            {/* Add to Cart Button Skeleton */}
            <Skeleton className="h-10 w-full mt-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Loading State Component
export const ProductGridSkeleton = ({ view = "grid", count = 8 }: { view?: "grid" | "list"; count?: number }) => {
  if (view === "list") {
    return (
      <div className="space-y-4">
        {Array.from({ length: count }).map((_, index) => (
          <ProductCardListSkeleton key={index} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-1 sm:gap-2 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
};

// Enhanced version with conditional grid columns
export const ProductsPageSkeleton = ({ 
  isBaseProductsPage = false,
  viewMode = "grid"
}: { 
  isBaseProductsPage?: boolean;
  viewMode?: "grid" | "list";
}) => {
  const getGridColumns = () => {
    if (viewMode === "list") {
      return "space-y-4";
    }
    
    if (isBaseProductsPage) {
      return "grid gap-1 sm:gap-2 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6";
    } else {
      return "grid gap-1 sm:gap-2 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-1 sm:px-4 py-2 max-w-7xl">
        {/* Header Section */}
        <div className="mb-6">
          {/* Categories Skeleton */}
          <div className="mb-4">
            <Skeleton className="h-10 w-48 rounded-md" />
          </div>

          {/* Breadcrumb Skeleton */}
          <div className="mb-4">
            <div className="flex items-center space-x-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>

          {/* Product Header Skeleton */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4 mb-6 border-b bg-white rounded-lg px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-6 w-24" />
            </div>
            <div className="flex items-center gap-4">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-8 w-8 rounded-md" />
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Filter Sidebar Skeleton */}
          <div className="hidden md:block w-64">
            <div className="space-y-6 p-4 bg-white rounded-lg border sticky top-4">
              {/* Active Filters Skeleton */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <div className="flex flex-wrap gap-1">
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-6 w-14 rounded-full" />
                </div>
              </div>

              {/* Filter Sections */}
              {[1, 2, 3, 4].map((section) => (
                <div key={section} className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-4" />
                  </div>
                  <div className="space-y-2">
                    {[1, 2, 3].map((item) => (
                      <div key={item} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Skeleton className="h-4 w-4 rounded" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                        <Skeleton className="h-3 w-8" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Products Grid Skeleton */}
          <div className="flex-1">
            <div className={getGridColumns()}>
              {Array.from({ length: isBaseProductsPage ? 12 : 8 }).map((_, index) => (
                viewMode === "list" ? (
                  <ProductCardListSkeleton key={index} />
                ) : (
                  <ProductCardSkeleton key={index} />
                )
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductPageSkeleton;