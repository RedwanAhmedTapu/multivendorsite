// components/product/productcategory/CategoryBreadcrumb.tsx
"use client";

import Image from "next/image";

interface Category {
  name: string;
  image?: string;
  description?: string;
  productCount?: number;
}

interface Props {
  category: Category;
}

export default function CategoryBreadcrumb({ category }: Props) {
  return (
    <section className="relative w-full h-[280px] md:h-[320px] flex items-center overflow-hidden bg-gradient-to-r from-white via-white to-rose-50">
      {/* Background Image */}
      {category.image && (
        <div className="absolute inset-0">
          <Image
            src={category.image}
            alt={category.name}
            fill
            priority
            className="object-cover object-right"
          />
          {/* Gradient overlay to ensure content readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-transparent" />
        </div>
      )}

      {/* Content positioned at start */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 flex flex-col justify-center h-full">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 mb-4">
          <span className="text-xs text-rose-600 font-medium">Home</span>
          <span className="text-xs text-rose-300">/</span>
          <span className="text-xs text-rose-600 font-medium">Categories</span>
          <span className="text-xs text-rose-300">/</span>
          <span className="text-xs text-gray-900 font-semibold">
            {category.name}
          </span>
        </div>

        {/* Title + Count */}
        <div className="flex flex-col sm:flex-row sm:items-center mb-3">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-2 sm:mb-0">
            {category.name}
          </h1>
          {category.productCount && (
            <span className="sm:ml-4 text-xs text-rose-700 bg-rose-100 px-3 py-1.5 rounded-full font-medium self-start sm:self-center">
              {category.productCount} products
            </span>
          )}
        </div>

       
      </div>

     
    </section>
  );
}