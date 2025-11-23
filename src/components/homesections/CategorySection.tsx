"use client";

import { useGetCategoriesQuery } from "@/features/apiSlice";
import Image from "next/image";
import Link from "next/link";

export default function CategorySection() {
  const { data, isLoading, isError } = useGetCategoriesQuery(undefined);

  // useGetCategoriesQuery returns Category[] directly (not wrapped)
  const categories = data || [];

  if (isLoading) {
    return (
      <section className="max-w-5xl xl:max-w-6xl 2xl:max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl md:text-2xl font-bold">Shop by Category</h2>
        </div>
        <p className="text-gray-500">Loading categories...</p>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="max-w-5xl xl:max-w-6xl 2xl:max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl md:text-2xl font-bold">Shop by Category</h2>
        </div>
        <p className="text-red-500">Failed to load categories.</p>
      </section>
    );
  }

  if (categories.length === 0) {
    return (
      <section className="max-w-5xl xl:max-w-6xl 2xl:max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl md:text-2xl font-bold">Shop by Category</h2>
        </div>
        <p className="text-gray-500">No categories available.</p>
      </section>
    );
  }

  return (
    <section className="max-w-5xl xl:max-w-6xl 2xl:max-w-7xl mx-auto px-4 sm:px-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl md:text-2xl font-bold">Shop by Category</h2>
        <Link
          href="/categories"
          className="text-sm font-medium text-gray-700 hover:underline"
        >
          See All
        </Link>
      </div>

      <div className="relative">
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex space-x-6 pb-4 justify-between items-center">
            {categories.map((cat: any) => (
              <Link
                key={cat.id}
                href={`/categories/${cat.slug || cat.id}`}
                className="flex flex-col items-center text-center group cursor-pointer min-w-max"
              >
                <div
                  className={`flex items-center justify-center w-20 h-20 rounded-full 
                    ${cat.highlight ? "bg-red-50 border-2 border-red-500" : "bg-gray-100"} 
                    transition-colors group-hover:bg-gray-200`}
                >
                  <Image
                    src={cat.image || "/placeholder.png"}
                    alt={cat.name}
                    width={50}
                    height={50}
                    className="object-contain"
                  />
                </div>
                <p className="mt-2 text-sm text-gray-700">{cat.name}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}