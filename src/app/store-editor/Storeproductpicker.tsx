"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { X, Search, Package, Loader2, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { useGetMyProductsQuery } from "@/features/productapi/vendorProductApi";

/**
 * A single product the way ConfigurationForm / preview components consume it.
 * This is intentionally display-shaped (matches CarouselProductItem /
 * RecommendationProductItem / SliderProductItem / ThreeColumnProductItem),
 * plus `id` and `slug` so it can be linked back to the real product and
 * re-hydrated from `component.products` after a reload.
 */
export interface PickedProduct {
  id: string;
  name: string;
  slug?: string;
  image?: string;
  price?: string;
  originalPrice?: string;
  discount?: string;
  rating?: number;
  reviews?: number;
}

interface StoreProductPickerProps {
  open: boolean;
  onClose: () => void;
  /** Already-selected product ids (pre-checked when the modal opens) */
  selectedProductIds: string[];
  /** Fired with the full new selection when the user hits "Done" */
  onConfirm: (products: PickedProduct[]) => void;
  /** Optional cap on how many products can be targeted at once */
  maxSelect?: number;
}

const PAGE_SIZE = 12;

function formatMoney(n?: number) {
  if (n === undefined || n === null) return undefined;
  return `৳${Number(n).toLocaleString()}`;
}

/** Maps a raw vendor product record -> the display shape used everywhere else */
function toPickedProduct(p: any): PickedProduct {
  const variant = p.variants?.[0];
  const price = variant?.specialPrice ?? variant?.price;
  const original = variant?.specialPrice ? variant?.price : undefined;
  const discount =
    original && price ? `-${Math.round(100 - (price / original) * 100)}%` : undefined;

  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    image: p.images?.[0]?.url,
    price: formatMoney(price),
    originalPrice: formatMoney(original),
    discount,
    rating: p.avgRating ?? p.rating,
    reviews: p.reviewCount ?? p.reviews,
  };
}

export function StoreProductPicker({
  open,
  onClose,
  selectedProductIds,
  onConfirm,
  maxSelect,
}: StoreProductPickerProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // selected.id -> full PickedProduct, so we can hand back rich data on confirm
  // without a second fetch, even for products selected on a page we've since
  // scrolled past.
  const [selected, setSelected] = useState<Map<string, PickedProduct>>(new Map());

  useEffect(() => {
    if (!open) return;
    // Re-seed from whatever the component already had saved.
    // We don't have full product details for previously-saved ids yet
    // (they'll be filled in as pages containing them are fetched); the ids
    // are enough to keep the checkboxes correctly pre-checked meanwhile.
    setSelected((prev) => {
      const next = new Map(prev);
      selectedProductIds.forEach((id) => {
        if (!next.has(id)) next.set(id, { id, name: "" });
      });
      return next;
    });
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) {
      setSearch("");
      setPage(1);
    }
  }, [open]);

  useEffect(() => setPage(1), [search]);

  const { data, isFetching } = useGetMyProductsQuery(
    { search: search || undefined, page, limit: PAGE_SIZE } as any,
    { skip: !open },
  );

  const products: any[] = data?.items ?? [];
  const pagination = data?.pagination as
    | { currentPage?: number; totalPages?: number; totalItems?: number; hasNext?: boolean; hasPrevious?: boolean }
    | undefined;

  // Backfill full details for already-selected products as soon as they
  // appear in a fetched page (fixes the "name missing" placeholder above).
  useEffect(() => {
    if (products.length === 0) return;
    setSelected((prev) => {
      let changed = false;
      const next = new Map(prev);
      products.forEach((p) => {
        if (next.has(p.id) && !next.get(p.id)?.name) {
          next.set(p.id, toPickedProduct(p));
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [products]);

  const toggle = useCallback(
    (p: any) => {
      setSelected((prev) => {
        const next = new Map(prev);
        if (next.has(p.id)) {
          next.delete(p.id);
        } else {
          if (maxSelect && next.size >= maxSelect) return prev;
          next.set(p.id, toPickedProduct(p));
        }
        return next;
      });
    },
    [maxSelect],
  );

  const totalPages = Math.max(1, pagination?.totalPages ?? 1);
  const displayPage = pagination?.currentPage ?? page;

  const handleConfirm = () => {
    onConfirm(Array.from(selected.values()));
    onClose();
  };

  const selectedCount = selected.size;

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.2)] w-full max-w-[720px] max-h-[85vh] flex flex-col border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-sm">
              <Package size={16} className="text-white" />
            </div>
            <div>
              <span className="font-bold text-slate-700 text-[14px]">Select products</span>
              {maxSelect && (
                <span className="text-[11px] text-slate-400 ml-2">max {maxSelect}</span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-slate-100 flex-shrink-0">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400" />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search your products..."
              className="w-full pl-8 pr-3 py-2 text-[13px] bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-50 transition-all"
            />
          </div>
        </div>

        {selectedCount > 0 && (
          <div className="mx-4 mt-3 flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 text-[12px] text-emerald-700 flex-shrink-0">
            <Check size={13} className="shrink-0 text-emerald-500" />
            <span>
              <strong>{selectedCount}</strong> product{selectedCount > 1 ? "s" : ""} selected
            </span>
          </div>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
          {isFetching && products.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-16 gap-3 text-cyan-500">
              <Loader2 size={24} className="animate-spin" />
              <span className="text-sm font-medium">Loading products...</span>
            </div>
          ) : products.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-slate-400">
              <Package size={36} className="mb-3 opacity-30" />
              <p className="text-sm font-medium">No products found</p>
            </div>
          ) : (
            products.map((product: any) => {
              const isChecked = selected.has(product.id);
              const picked = toPickedProduct(product);
              return (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => toggle(product)}
                  className={`relative text-left border rounded-xl p-2 transition-colors ${
                    isChecked ? "border-blue-400 bg-blue-50/60 ring-1 ring-blue-300" : "border-slate-100 hover:border-slate-200"
                  }`}
                >
                  <div className="w-full aspect-square rounded-lg overflow-hidden bg-slate-50 mb-2 flex items-center justify-center">
                    {picked.image ? (
                      <img src={picked.image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Package size={20} className="text-slate-300" />
                    )}
                  </div>
                  <div className="text-[12px] font-medium text-slate-700 line-clamp-2 leading-tight">
                    {picked.name}
                  </div>
                  {picked.price && (
                    <div className="text-[12px] font-bold text-slate-800 mt-1">{picked.price}</div>
                  )}
                  {isChecked && (
                    <span className="absolute top-1.5 right-1.5 w-5 h-5 flex items-center justify-center rounded-full bg-blue-500 text-white">
                      <Check size={11} />
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-2.5 border-t border-slate-100 flex items-center justify-between flex-shrink-0">
            <span className="text-[11px] text-slate-400">
              Page {displayPage} / {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={!pagination?.hasPrevious && page <= 1}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={!pagination?.hasNext && page >= totalPages}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between flex-shrink-0 bg-slate-50/50">
          <button
            onClick={onClose}
            className="px-3 py-2 text-[13px] font-medium text-slate-500 hover:text-slate-700"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl text-[13px] font-semibold hover:from-blue-600 hover:to-cyan-600 transition-all shadow-sm shadow-blue-200"
          >
            Done ({selectedCount})
          </button>
        </div>
      </div>
    </div>
  );
}