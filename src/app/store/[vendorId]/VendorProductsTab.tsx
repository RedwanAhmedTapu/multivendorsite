"use client";

// src/app/store/[vendorId]/VendorProductsTab.tsx
//
// Rendered when the storefront's "Products" tab is active. Shows this
// vendor's products with a category sidebar to filter by.
//
// ⚠️ TWO THINGS I COULDN'T CONFIRM FROM WHAT'S BEEN SHARED SO FAR — please
// send the real versions and I'll swap these in directly:
//
// 1. VENDOR-SCOPED PUBLIC PRODUCT LISTING: commonProductApi's
//    `filterProducts` takes a `PublicProductFilter` whose fields I don't
//    have (only imported as a type). I'm assuming it accepts a `vendorId`
//    alongside `categoryId` — if your actual filter shape differs, this
//    is the one place to fix (the `filterProducts({ vendorId, categoryId,
//    cursor, limit })` call below).
//
// 2. "3-LAYER" CATEGORY SIDEBAR: I don't have your product-listing page's
//    actual category-tree component, so this only does a flat, single-level
//    list (top-level categories, click to filter) rather than the nested
//    3-level drill-down you described. Send me that component (or the
//    nested category-tree API shape) and I'll replace CategorySidebar
//    below with a faithful match instead of guessing at the UX.

import { useState } from "react";
import { Loader2, Package, ChevronRight } from "lucide-react";
import { useGetCategoriesQuery } from "@/features/apiSlice";
import { useFilterProductsQuery } from "@/features/productapi/commonProductApi";
import { SharedProductCard } from "@/components/product/card/SharedProductCard";

function CategorySidebar({
  selectedCategoryId,
  onSelect,
}: {
  selectedCategoryId: string | null;
  onSelect: (categoryId: string | null) => void;
}) {
  const { data, isFetching } = useGetCategoriesQuery(undefined);
  const categories: any[] = (data as any)?.data ?? (data as any) ?? [];

  return (
    <div className="hidden md:block w-56 flex-shrink-0 border-r border-gray-100 bg-white">
      <p className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Categories</p>
      <button
        onClick={() => onSelect(null)}
        className={`w-full text-left px-4 py-2 text-sm ${!selectedCategoryId ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
      >
        All Products
      </button>
      {isFetching ? (
        <div className="flex justify-center py-6"><Loader2 size={16} className="animate-spin text-gray-300" /></div>
      ) : (
        categories.map((cat: any) => (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className={`w-full flex items-center justify-between text-left px-4 py-2 text-sm ${selectedCategoryId === cat.id ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
          >
            {cat.name}
            <ChevronRight size={13} className="text-gray-300" />
          </button>
        ))
      )}
    </div>
  );
}

// Below md the fixed-width sidebar left ~52px per product card on phones, so
// small screens get the same categories as a horizontally scrollable chip row
// above the grid instead (same data, same selection state).
function CategoryChips({
  selectedCategoryId,
  onSelect,
}: {
  selectedCategoryId: string | null;
  onSelect: (categoryId: string | null) => void;
}) {
  const { data, isFetching } = useGetCategoriesQuery(undefined);
  const categories: any[] = (data as any)?.data ?? (data as any) ?? [];
  const chip = (active: boolean) =>
    `shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
      active ? "border-blue-200 bg-blue-50 text-blue-600" : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
    }`;

  return (
    <div className="md:hidden -mx-4 mb-3 overflow-x-auto px-4" role="group" aria-label="Filter by category">
      <div className="flex w-max gap-2 pb-1">
        <button type="button" onClick={() => onSelect(null)} aria-pressed={!selectedCategoryId} className={chip(!selectedCategoryId)}>
          All Products
        </button>
        {isFetching ? (
          <span className="flex items-center px-2"><Loader2 size={14} className="animate-spin text-gray-300" /></span>
        ) : (
          categories.map((cat: any) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelect(cat.id)}
              aria-pressed={selectedCategoryId === cat.id}
              className={chip(selectedCategoryId === cat.id)}
            >
              {cat.name}
            </button>
          ))
        )}
      </div>
    </div>
  );
}

export function VendorProductsTab({ vendorId }: { vendorId: string }) {
  const [categoryId, setCategoryId] = useState<string | null>(null);

  const { data, isFetching } = useFilterProductsQuery({
    vendorId,
    categoryId: categoryId ?? undefined,
    limit: 24,
  } as any);

  const products = data?.items ?? [];

  return (
    <div className="flex bg-white" style={{ minHeight: 480 }}>
      <CategorySidebar selectedCategoryId={categoryId} onSelect={setCategoryId} />

      <div className="flex-1 min-w-0 p-4">
        <CategoryChips selectedCategoryId={categoryId} onSelect={setCategoryId} />
        {isFetching ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-gray-300">
            <Loader2 size={22} className="animate-spin" />
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-gray-300">
            <Package size={32} />
            <p className="text-sm text-gray-400">No products in this category</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {/* Shared global product card; "storefront" context hides this
                vendor's own store name, as the old tab card did. */}
            {products.map((p: any) => (
              <SharedProductCard
                key={p.id}
                product={p}
                context="storefront"
                imageSizes="(max-width: 639px) 50vw, (max-width: 767px) 33vw, 25vw"
                unoptimizedImage
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}