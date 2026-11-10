"use client";

// Product performance — GET /analytics/business-advisor/products (server-side
// sort, search and pagination; the server returns only the scope's products).

import React, { useEffect, useState } from "react";
import { Search, ChevronLeft, ChevronRight, Package, ArrowUpDown, Crosshair } from "lucide-react";
import { useGetAdvisorProductsQuery, type AdvisorFilters } from "@/features/businessAdvisorApi";
import { formatCount, formatMoneyMinor, formatPct } from "@/lib/analytics/advisor-view";
import { CompactEmpty, Panel, Skeleton } from "./AdvisorParts";

const SORTS = [
  { id: "views", label: "Views" },
  { id: "addToCart", label: "Add to cart" },
  { id: "checkoutStarts", label: "Checkouts" },
  { id: "orders", label: "Orders" },
  { id: "orderedValueMinor", label: "Value" },
  { id: "conversion", label: "Conversion" },
] as const;

export function AdvisorProducts({ filters, onFocusProduct, focusedProductId }: { filters: AdvisorFilters; onFocusProduct: (id: string | null, name?: string) => void; focusedProductId?: string }) {
  const [sort, setSort] = useState<(typeof SORTS)[number]["id"]>("views");
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  useEffect(() => {
    const t = setTimeout(() => {
      setQ(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);
  useEffect(() => setPage(1), [filters.from, filters.to, filters.vendorId]);

  const { data, isLoading, isFetching, isError, refetch } = useGetAdvisorProductsQuery({ from: filters.from, to: filters.to, vendorId: filters.vendorId, sort, q, page, pageSize: 10 });

  return (
    <Panel
      accent="products"
      title="Product performance"
      subtitle="Views, carts, checkouts and orders per product in this period"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <label className="relative">
            <span className="sr-only">Search products</span>
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" aria-hidden />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products" className="w-44 rounded-lg border border-[#E5EAF2] bg-white py-1.5 pl-8 pr-2 text-xs focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100" />
          </label>
          <label className="flex items-center gap-1 text-xs text-slate-500">
            <ArrowUpDown className="h-3.5 w-3.5" aria-hidden />
            <span className="sr-only">Sort by</span>
            <select value={sort} onChange={(e) => { setSort(e.target.value as any); setPage(1); }} aria-label="Sort products by" className="rounded-lg border border-[#E5EAF2] bg-white px-2 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-100">
              {SORTS.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </label>
        </div>
      }
    >
      {isLoading ? (
        <div className="flex flex-col gap-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-12" />)}</div>
      ) : isError ? (
        <div role="alert" className="flex items-center justify-between rounded-xl bg-rose-50 px-3 py-3 text-xs text-rose-700">
          <span>Couldn&apos;t load product performance.</span>
          <button type="button" onClick={() => refetch()} className="font-bold">Try again</button>
        </div>
      ) : !data || data.items.length === 0 ? (
        <CompactEmpty
          icon={Package}
          title={q ? "No products match your search." : "No product activity in this period."}
          hint={q ? "Try another name or product ID." : "Product activity will appear when customers view or interact with products."}
        />
      ) : (
        <>
          {/* table on wide screens, cards on phones — no horizontal page overflow */}
          <div className="hidden overflow-x-auto md:block" aria-busy={isFetching}>
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Product performance, sorted by {SORTS.find((s) => s.id === sort)?.label}</caption>
              <thead className="text-[11px] uppercase tracking-wide text-slate-500">
                <tr className="border-b border-slate-100">
                  <th scope="col" className="py-2 pr-3 font-semibold">Product</th>
                  {["Views", "Add to cart", "Checkouts", "Orders", "Conversion", "Value", ""].map((h, i) => (
                    <th key={i} scope="col" className={`px-2 py-2 font-semibold ${i < 6 ? "text-right" : ""}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.items.map((p) => (
                  <tr key={p.productId} className={`border-b border-slate-50 ${focusedProductId === p.productId ? "bg-indigo-50/50" : "hover:bg-slate-50/70"}`}>
                    <td className="py-2.5 pr-3">
                      <div className="flex items-center gap-2.5">
                        {p.thumbnail ? <img src={p.thumbnail} alt="" className="h-9 w-9 shrink-0 rounded-lg border border-slate-100 object-cover" /> : <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400"><Package className="h-4 w-4" aria-hidden /></span>}
                        <div className="min-w-0">
                          <div className="max-w-[260px] truncate font-semibold text-slate-800" title={p.name}>{p.name}</div>
                          <div className="font-mono text-[10px] text-slate-400">{p.productId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 text-right tabular-nums">
                      {formatCount(p.views)}
                      {p.viewsChange !== null ? <span className={`ml-1 text-[10px] font-semibold ${p.viewsChange >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{p.viewsChange > 0 ? "+" : ""}{p.viewsChange}%</span> : null}
                    </td>
                    <td className="px-2 text-right tabular-nums">{formatCount(p.addToCart)}</td>
                    <td className="px-2 text-right tabular-nums">{formatCount(p.checkoutStarts)}</td>
                    <td className="px-2 text-right tabular-nums">{formatCount(p.orders)}</td>
                    <td className="px-2 text-right tabular-nums">{formatPct(p.conversion)}</td>
                    <td className="px-2 text-right tabular-nums">{formatMoneyMinor(p.orderedValueMinor)}</td>
                    <td className="pl-2 text-right">
                      <button type="button" onClick={() => onFocusProduct(focusedProductId === p.productId ? null : p.productId, p.name)} aria-pressed={focusedProductId === p.productId} aria-label={`${focusedProductId === p.productId ? "Clear focus on" : "Focus dashboard on"} ${p.name}`} className="rounded-lg p-1.5 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
                        <Crosshair className="h-4 w-4" aria-hidden />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="flex flex-col gap-2 md:hidden" aria-label="Product performance">
            {data.items.map((p) => (
              <li key={p.productId} className="rounded-xl border border-slate-100 p-3">
                <div className="flex items-center gap-2.5">
                  {p.thumbnail ? <img src={p.thumbnail} alt="" className="h-10 w-10 rounded-lg object-cover" /> : <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100"><Package className="h-4 w-4 text-slate-400" aria-hidden /></span>}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-slate-800">{p.name}</div>
                    <div className="text-[11px] text-slate-500">{formatPct(p.conversion)} view → order</div>
                  </div>
                  <button type="button" onClick={() => onFocusProduct(focusedProductId === p.productId ? null : p.productId, p.name)} aria-label={`Focus dashboard on ${p.name}`} className="rounded-lg p-1.5 text-slate-400">
                    <Crosshair className="h-4 w-4" aria-hidden />
                  </button>
                </div>
                <dl className="mt-2 grid grid-cols-4 gap-1 text-center text-[11px]">
                  {[["Views", p.views], ["Carts", p.addToCart], ["Checkouts", p.checkoutStarts], ["Orders", p.orders]].map(([l, v]) => (
                    <div key={l as string} className="rounded-lg bg-slate-50 py-1">
                      <dt className="text-slate-500">{l}</dt>
                      <dd className="font-bold text-slate-800">{formatCount(v as number)}</dd>
                    </div>
                  ))}
                </dl>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span>{formatCount(data.total)} product{data.total === 1 ? "" : "s"} · page {data.page} of {data.totalPages}</span>
            <div className="flex gap-1">
              <button type="button" aria-label="Previous page" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg border border-[#E5EAF2] p-1.5 disabled:opacity-40"><ChevronLeft className="h-4 w-4" aria-hidden /></button>
              <button type="button" aria-label="Next page" disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-lg border border-[#E5EAF2] p-1.5 disabled:opacity-40"><ChevronRight className="h-4 w-4" aria-hidden /></button>
            </div>
          </div>
        </>
      )}
    </Panel>
  );
}
