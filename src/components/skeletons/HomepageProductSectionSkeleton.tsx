"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const ProductCardSkeleton = () => {
  return (
    <Card className="border border-gray-200 rounded-lg p-0 h-full flex flex-col bg-white overflow-hidden">
      {/* Image Skeleton */}
      <div className="relative w-full h-44 overflow-hidden bg-gray-100">
        <Skeleton className="w-full h-full" />
      </div>

      {/* Content Skeleton */}
      <CardContent className="flex flex-col px-4 py-1 flex-grow space-y-3">
        {/* Product Name Skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>

        {/* Price Section Skeleton */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-5 w-12 rounded-full" />
          </div>
          <Skeleton className="h-4 w-20" />
        </div>

        {/* Rating Section Skeleton */}
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-4 rounded-sm" />
            ))}
          </div>
          <Skeleton className="h-4 w-16" />
        </div>

        {/* Store Name Skeleton */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
};

interface SectionSkeletonProps {
  title?: boolean;
  showSeeAll?: boolean;
  gridCols?: number;
}

const HomepageProductSectionSkeleton = ({
  title = true,
  showSeeAll = true,
  gridCols = 6,
}: SectionSkeletonProps) => {
  // Generate skeleton cards (6 by default or based on gridCols)
  const skeletonCards = Array.from({ length: gridCols }).map((_, index) => (
    <ProductCardSkeleton key={index} />
  ));

  return (
    <section className="max-w-4xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-[75rem] mx-auto px-4 py-8">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center mb-6">
        {title && (
          <Skeleton className="h-8 w-64" />
        )}
        {showSeeAll && (
          <Skeleton className="h-5 w-16" />
        )}
      </div>

      {/* Grid Skeleton */}
      <div 
        className={`grid grid-cols-2 md:grid-cols-4 lg:grid-cols-${gridCols} gap-1`}
      >
        {skeletonCards}
      </div>
    </section>
  );
};

export default HomepageProductSectionSkeleton;

// Optional: Export individual skeleton components for reuse
export { ProductCardSkeleton, HomepageProductSectionSkeleton };