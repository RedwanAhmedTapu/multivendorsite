"use client";

import Image from "next/image";

interface Category {
  id: string;
  name: string;
  image?: string;
  description?: string;
  productCount?: number;
}

interface Props {
  path: Category[];
  onCategoryClick?: (categoryId: string) => void;
}

export default function CategoryBreadcrumb({ path, onCategoryClick }: Props) {
  const rootCategory = path[0];
  const childPath = path.slice(1);

  if (!rootCategory) return null;

  return (
    <section className="relative w-full h-[120px] sm:h-[140px] md:h-[160px] lg:h-[180px] flex items-center overflow-hidden bg-gradient-to-r from-white via-white to-rose-50">
      {/* Background Image */}
      {rootCategory.image && (
        <div className="absolute inset-0">
          <Image
            src={rootCategory.image}
            alt={rootCategory.name}
            fill
            priority
            className="object-cover object-center sm:object-right"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-transparent" />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 flex flex-col justify-center h-full">
        {/* Breadcrumb */}
        <div className="flex flex-wrap items-center gap-x-1 gap-y-1 mb-2 text-[10px] sm:text-xs md:text-sm">
          {path.map((cat, idx) => (
            <span key={cat.id} className="flex items-center">
              {idx !== 0 && (
                <span className="text-rose-300 mx-1 sm:mx-2">/</span>
              )}
              <span
                onClick={() => onCategoryClick?.(cat.id)}
                className={`${
                  idx === path.length - 1
                    ? "text-gray-900 font-semibold cursor-default"
                    : "text-rose-600 font-medium hover:underline cursor-pointer"
                }`}
              >
                {cat.name}
              </span>
            </span>
          ))}
        </div>

        {/* Title: root category */}
        <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 leading-tight">
          {rootCategory.name}
        </h1>

        {/* Optional description */}
        {rootCategory.description && (
          <p className="mt-1 text-xs text-gray-600 max-w-2xl line-clamp-2">
            {rootCategory.description}
          </p>
        )}
      </div>
    </section>
  );
}