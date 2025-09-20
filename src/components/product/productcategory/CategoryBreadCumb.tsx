"use client";

import Image from "next/image";

interface Category {
  name: string;
  image?: string;
  description?: string;
  productCount?: number;
}

interface Props {
  path: Category[];
}

export default function CategoryBreadcrumb({ path }: Props) {
  const rootCategory = path[0];
  const childPath = path.slice(1); // remaining subcategories

  return (
    <section className="relative w-full h-[220px] sm:h-[260px] md:h-[300px] lg:h-[340px] xl:h-[380px] flex items-center overflow-hidden bg-gradient-to-r from-white via-white to-rose-50">
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
        <div className="flex flex-wrap items-center gap-x-1 gap-y-1 mb-3 sm:mb-4 text-[11px] sm:text-xs md:text-sm">
          {path.map((cat, idx) => (
            <span key={cat.name} className="flex items-center">
              {idx !== 0 && (
                <span className="text-rose-300 mx-1 sm:mx-2">/</span>
              )}
              <span
                className={`${
                  idx === path.length - 1
                    ? "text-gray-900 font-semibold"
                    : "text-rose-600 font-medium hover:underline cursor-pointer"
                }`}
              >
                {cat.name}
              </span>
            </span>
          ))}
        </div>

        {/* Title: root category */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 leading-tight">
          {rootCategory.name}
        </h1>

        {/* Optional description */}
        {rootCategory.description && (
          <p className="mt-2 text-xs sm:text-sm md:text-base lg:text-lg text-gray-600 max-w-2xl">
            {rootCategory.description}
          </p>
        )}
      </div>
    </section>
  );
}
