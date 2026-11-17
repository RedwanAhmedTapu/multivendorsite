// components/admin/products/ProductsTableSkeleton.tsx
//
// Fallback for the Suspense boundary around <ProductsTable/>. Mirrors the
// shipped table chrome — filter row, nine-column header, 44px rows and a
// pager — so the page keeps its height while the product payload loads.

import { Sk } from "@/components/admin/ui/AdminSkeletons";

const ROW_BARS = ["w-24", "w-32", "w-20", "w-16", "w-24", "w-16", "w-20"];

export function ProductsTableSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading products" className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      {/* card header */}
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 bg-slate-50/70 px-4 py-3">
        <Sk className="h-8 w-8 rounded-lg bg-blue-100" />
        <div className="space-y-1.5">
          <Sk className="h-3.5 w-28" />
          <Sk soft className="h-2.5 w-20" />
        </div>
        <Sk className="ml-auto h-8 w-24 rounded-lg" />
      </div>

      {/* filters */}
      <div className="space-y-3 border-b border-slate-100 p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Sk key={i} className="h-10 w-full rounded-lg" />
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Sk key={i} soft className="h-7 w-20 rounded-full" />
          ))}
        </div>
      </div>

      {/* table */}
      <div className="overflow-hidden">
        <div className="flex items-center gap-4 border-b border-slate-100 bg-slate-50/70 px-4 py-2.5">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="flex-1">
              <Sk className="h-2.5 w-14" />
            </div>
          ))}
        </div>
        {Array.from({ length: 8 }).map((_, r) => (
          <div key={r} className="flex items-center gap-4 border-b border-slate-100 px-4 py-3 last:border-0">
            <Sk soft className="h-4 w-4 shrink-0 rounded" />
            <Sk soft className="h-10 w-10 shrink-0 rounded-lg" />
            {ROW_BARS.map((w, c) => (
              <div key={c} className="flex-1">
                <Sk soft className={`h-3.5 ${w}`} />
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* pager */}
      <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
        <Sk soft className="h-2.5 w-32" />
        <div className="flex gap-2">
          <Sk className="h-7 w-20 rounded-md" />
          <Sk className="h-7 w-16 rounded-md" />
        </div>
      </div>
    </div>
  );
}
