"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Search, Tag, Loader2, Check } from "lucide-react";
// ⚠️ ADJUST ME: guessed hook name/path — this project didn't include a
// categories API slice in what was shared with me. Point this at whatever
// query actually lists your vendor's/platform's categories
// (id, name, slug, image). If it's paginated, mirror the pagination
// handling from StoreProductPicker.tsx; most category lists are small
// enough to fetch in one page, so this assumes a flat `{ data: Category[] }`
// response with no paging.
import { useGetCategoriesQuery } from "@/features/apiSlice";

export interface PickedCategory {
  id: string;
  name: string;
  slug?: string;
  image?: string;
}

interface StoreCategoryPickerProps {
  open: boolean;
  onClose: () => void;
  selectedCategoryIds: string[];
  onConfirm: (categories: PickedCategory[]) => void;
  maxSelect?: number;
}

export function StoreCategoryPicker({
  open,
  onClose,
  selectedCategoryIds,
  onConfirm,
  maxSelect,
}: StoreCategoryPickerProps) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Map<string, PickedCategory>>(new Map());

  useEffect(() => {
    if (!open) return;
    setSelected((prev) => {
      const next = new Map(prev);
      selectedCategoryIds.forEach((id) => {
        if (!next.has(id)) next.set(id, { id, name: "" });
      });
      return next;
    });
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) setSearch("");
  }, [open]);

  const { data, isFetching } = useGetCategoriesQuery(undefined, { skip: !open });
  const allCategories: any[] = (data as any)?.data ?? (data as any) ?? [];
  const categories = search
    ? allCategories.filter((c) => c.name?.toLowerCase().includes(search.toLowerCase()))
    : allCategories;

  // Backfill full details for pre-selected ids once the list arrives.
  useEffect(() => {
    if (allCategories.length === 0) return;
    setSelected((prev) => {
      let changed = false;
      const next = new Map(prev);
      allCategories.forEach((c) => {
        if (next.has(c.id) && !next.get(c.id)?.name) {
          next.set(c.id, { id: c.id, name: c.name, slug: c.slug, image: c.image });
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [allCategories]);

  const toggle = useCallback(
    (c: any) => {
      setSelected((prev) => {
        const next = new Map(prev);
        if (next.has(c.id)) {
          next.delete(c.id);
        } else {
          if (maxSelect && next.size >= maxSelect) return prev;
          next.set(c.id, { id: c.id, name: c.name, slug: c.slug, image: c.image });
        }
        return next;
      });
    },
    [maxSelect],
  );

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
        className="bg-white rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.2)] w-full max-w-[560px] max-h-[80vh] flex flex-col border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-400 flex items-center justify-center shadow-sm">
              <Tag size={16} className="text-white" />
            </div>
            <span className="font-bold text-slate-700 text-[14px]">Select categories</span>
            {maxSelect && <span className="text-[11px] text-slate-400 ml-2">max {maxSelect}</span>}
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="px-4 py-3 border-b border-slate-100 flex-shrink-0">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search categories..."
              className="w-full pl-8 pr-3 py-2 text-[13px] bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-50 transition-all"
            />
          </div>
        </div>

        {selectedCount > 0 && (
          <div className="mx-4 mt-3 flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 text-[12px] text-emerald-700 flex-shrink-0">
            <Check size={13} className="shrink-0 text-emerald-500" />
            <span><strong>{selectedCount}</strong> categor{selectedCount > 1 ? "ies" : "y"} selected</span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-3 grid grid-cols-3 gap-2">
          {isFetching && categories.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-16 gap-3 text-purple-500">
              <Loader2 size={24} className="animate-spin" />
              <span className="text-sm font-medium">Loading categories...</span>
            </div>
          ) : categories.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-slate-400">
              <Tag size={36} className="mb-3 opacity-30" />
              <p className="text-sm font-medium">No categories found</p>
            </div>
          ) : (
            categories.map((cat: any) => {
              const isChecked = selected.has(cat.id);
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggle(cat)}
                  className={`relative text-left border rounded-xl p-2 transition-colors ${
                    isChecked ? "border-purple-400 bg-purple-50/60 ring-1 ring-purple-300" : "border-slate-100 hover:border-slate-200"
                  }`}
                >
                  <div className="w-full aspect-square rounded-lg overflow-hidden bg-slate-50 mb-2 flex items-center justify-center">
                    {cat.image ? (
                      <img src={cat.image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Tag size={18} className="text-slate-300" />
                    )}
                  </div>
                  <div className="text-[12px] font-medium text-slate-700 line-clamp-2 leading-tight">{cat.name}</div>
                  {isChecked && (
                    <span className="absolute top-1.5 right-1.5 w-5 h-5 flex items-center justify-center rounded-full bg-purple-500 text-white">
                      <Check size={11} />
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>

        <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between flex-shrink-0 bg-slate-50/50">
          <button onClick={onClose} className="px-3 py-2 text-[13px] font-medium text-slate-500 hover:text-slate-700">Cancel</button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white rounded-xl text-[13px] font-semibold hover:from-purple-600 hover:to-fuchsia-600 transition-all shadow-sm shadow-purple-200"
          >
            Done ({selectedCount})
          </button>
        </div>
      </div>
    </div>
  );
}