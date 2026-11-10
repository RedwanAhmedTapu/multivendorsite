"use client";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  X,
  Search,
  Package,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Warehouse,
  AlertTriangle,
  Layers,
  Check,
  Minus,
  ChevronDown,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { useGetMyProductsQuery } from "@/features/productapi/vendorProductApi";

/* ── Types ─────────────────────────────────────────────────────────────────── */

interface WarehouseFilterOption {
  id: string;
  label: string;
}

interface ProductPickerModalProps {
  open: boolean;
  onClose: () => void;
  /** variantId set currently present in the purchase items table */
  selectedVariantIds: Set<string>;
  /** Called when a single variant's checkbox is toggled */
  onToggleVariant: (product: any, variant: any, checked: boolean) => void;
  /** Called when the product-level checkbox is toggled — toggles all its variants */
  onToggleProduct: (product: any, checked: boolean) => void;
  /** Vendor's warehouses, used to build the multi-select warehouse filter. */
  warehouses?: WarehouseFilterOption[];
}

type SortOption = "newest" | "oldest" | "name_asc" | "name_desc";

/* ── Page size options ─────────────────────────────────────────────────────── */

const PAGE_SIZES = [10, 20, 50, 100] as const;

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "name_asc", label: "Name (A–Z)" },
  { value: "name_desc", label: "Name (Z–A)" },
];

/* ── Tri-state checkbox (handles indeterminate) ──────────────────────────────── */

function TriStateCheckbox({
  checked,
  indeterminate,
  onChange,
  size = 16,
}: {
  checked: boolean;
  indeterminate: boolean;
  onChange: (checked: boolean) => void;
  size?: number;
}) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => {
        e.stopPropagation();
        onChange(e.target.checked);
      }}
      style={{ width: size, height: size }}
      className="shrink-0 accent-cyan-500 cursor-pointer rounded"
    />
  );
}

/* ── Multi-select Warehouse Filter Dropdown ───────────────────────────────── */

function WarehouseFilterDropdown({
  options,
  selected,
  onToggle,
  onClear,
}: {
  options: WarehouseFilterOption[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Close on outside click — multi-checkbox panels need this since a single
  // click on a checkbox must NOT close the panel.
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1.5 px-3 py-2 text-[13px] rounded-xl border transition-all ${
          selected.size > 0
            ? "bg-blue-50 border-blue-300 text-blue-700"
            : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
        }`}
      >
        <Warehouse size={13} />
        <span className="hidden sm:inline">Warehouse</span>
        {selected.size > 0 && (
          <span className="bg-blue-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
            {selected.size}
          </span>
        )}
        <ChevronDown
          size={12}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute z-[300] top-full mt-1.5 left-0 w-64 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Filter by warehouse
            </span>
            {selected.size > 0 && (
              <button
                onClick={onClear}
                className="text-[11px] text-rose-500 hover:text-rose-600 font-semibold"
              >
                Clear
              </button>
            )}
          </div>
          <div className="max-h-56 overflow-y-auto p-1.5">
            {options.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-slate-400">
                No warehouses found
              </div>
            ) : (
              options.map((w) => (
                <label
                  key={w.id}
                  className="flex items-center gap-2 px-2.5 py-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(w.id)}
                    onChange={() => onToggle(w.id)}
                    className="w-3.5 h-3.5 accent-blue-500 cursor-pointer shrink-0"
                  />
                  <span className="text-[12.5px] text-slate-600 truncate">
                    {w.label}
                  </span>
                </label>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Component ─────────────────────────────────────────────────────────────── */

export default function ProductPickerModal({
  open,
  onClose,
  selectedVariantIds,
  onToggleVariant,
  onToggleProduct,
  warehouses = [],
}: ProductPickerModalProps) {
  const [search, setSearch] = useState("");
  // 1-indexed page, since vendorProductApi.getMyProducts returns an
  // OffsetPage (page/limit/total), not a cursor page.
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [categoryId, setCategoryId] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [selectedWarehouseIds, setSelectedWarehouseIds] = useState<Set<string>>(
    new Set()
  );
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());

  const warehouseMap = useMemo(() => {
    const map: Record<string, string> = {};
    warehouses.forEach((w) => (map[w.id] = w.label));
    return map;
  }, [warehouses]);

  // ── Reset on close ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) {
      setSearch("");
      setPage(1);
      setCategoryId("");
      setSortBy("newest");
      setSelectedWarehouseIds(new Set());
      setExpandedProducts(new Set());
    }
  }, [open]);

  // ── Reset page when filters/sort/page-size change ──────────────────────────
  const warehouseFilterKey = Array.from(selectedWarehouseIds).sort().join(",");
  useEffect(() => {
    setPage(1);
  }, [search, categoryId, pageSize, sortBy, warehouseFilterKey]);

  const toggleWarehouse = useCallback((id: string) => {
    setSelectedWarehouseIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const clearWarehouseFilter = useCallback(() => {
    setSelectedWarehouseIds(new Set());
  }, []);

  // ── Fetch vendor's own products (offset-based) ─────────────────────────────
  // NOTE: this is the VENDOR-scoped endpoint (server-side scoped to the
  // authenticated vendor's own products) — correct source for the purchase
  // entry product picker. `warehouseIds` and `sortBy` are passed through as a
  // best-effort server-side filter/sort (matches the `sortBy` vocabulary used
  // elsewhere in the codebase: newest/oldest/...); a client-side pass below
  // guarantees correctness for the warehouse filter regardless of whether the
  // backend currently honors `warehouseIds`.
  const { data, isFetching } = useGetMyProductsQuery(
    {
      search: search || undefined,
      categoryId: categoryId || undefined,
      sortBy,
      warehouseIds:
        selectedWarehouseIds.size > 0
          ? Array.from(selectedWarehouseIds)
          : undefined,
      page,
      limit: pageSize,
    } as any,
    { skip: !open },
  );

  const rawProducts: any[] = data?.items ?? [];

  // Client-side safety net: only show products that actually have a variant
  // stocked at (at least one of) the selected warehouses. Works whether or
  // not the backend already narrowed the result set.
  const products = useMemo(() => {
    if (selectedWarehouseIds.size === 0) return rawProducts;
    return rawProducts
      .map((p: any) => {
        const variants = (p.variants ?? []).filter((v: any) => {
          const stockRows: any[] = v.warehouseStock ?? [];
          return stockRows.some((ws) => selectedWarehouseIds.has(ws.warehouseId));
        });
        return { ...p, variants };
      })
      .filter((p: any) => (p.variants ?? []).length > 0);
  }, [rawProducts, selectedWarehouseIds]);

  const pagination = data?.pagination as
    | {
        currentPage?: number;
        totalPages?: number;
        totalItems?: number;
        hasNext?: boolean;
        hasPrevious?: boolean;
        limit?: number;
      }
    | undefined;

  const totalItems = pagination?.totalItems ?? 0;
  const totalPages = Math.max(1, pagination?.totalPages ?? 1);
  const hasPrevPage = pagination?.hasPrevious ?? page > 1;
  const hasNextPage = pagination?.hasNext ?? page < totalPages;
  const displayPage = pagination?.currentPage ?? page;

  const warehouseFilterActive = selectedWarehouseIds.size > 0;
  const hiddenByWarehouseFilter = rawProducts.length - products.length;

  const goNext = useCallback(() => {
    if (hasNextPage) setPage((p) => p + 1);
  }, [hasNextPage]);

  const goPrev = useCallback(() => {
    if (hasPrevPage) setPage((p) => p - 1);
  }, [hasPrevPage]);

  const goFirst = useCallback(() => setPage(1), []);

  const goLast = useCallback(() => {
    setPage(totalPages);
  }, [totalPages]);

  const goToPage = useCallback(
    (target: number) => {
      if (target < 1 || target > totalPages || target === page) return;
      setPage(target);
    },
    [page, totalPages],
  );

  const categoryOptions = useMemo(() => {
    const map = new Map<string, string>();
    rawProducts.forEach((p: any) => {
      if (p.categoryId && p.category?.name && !map.has(p.categoryId)) {
        map.set(p.categoryId, p.category.name);
      }
    });
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
  }, [rawProducts]);

  const toggleExpand = useCallback((productId: string) => {
    setExpandedProducts((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  }, []);

  const getWarehouseStock = (variant: any) => {
    if (!variant.warehouseStock?.length) {
      return { total: variant.stock ?? 0, byWarehouse: {} as Record<string, number> };
    }
    const byWarehouse: Record<string, number> = {};
    let total = 0;
    for (const ws of variant.warehouseStock) {
      const qty = ws.quantity ?? 0;
      byWarehouse[ws.warehouseId] = qty;
      total += qty;
    }
    return { total, byWarehouse };
  };

  const pageButtons = useMemo(() => {
    const current = displayPage;
    const total = totalPages;
    let start = Math.max(1, current - 2);
    let end = Math.min(total, start + 4);
    if (end - start < 4) start = Math.max(1, end - 4);

    const pages: (number | "...")[] = [];
    if (start > 1) {
      pages.push(1);
      if (start > 2) pages.push("...");
    }
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < total) {
      if (end < total - 1) pages.push("...");
      pages.push(total);
    }
    return pages;
  }, [displayPage, totalPages]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.2)] w-full max-w-[860px] max-h-[88vh] flex flex-col border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-sm">
              <Package size={16} className="text-white" />
            </div>
            <div>
              <span className="font-bold text-slate-700 text-[14px]">Add Product</span>
              <span className="text-[11px] text-slate-400 ml-2">
                {totalItems} products found
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Filters Bar ─────────────────────────────────────────────────── */}
        <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap items-center gap-2 flex-shrink-0">
          <div className="relative flex-1 min-w-[160px]">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400" />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or SKU..."
              className="w-full pl-8 pr-3 py-2 text-[13px] bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-50 transition-all"
            />
          </div>

          {/* Category filter */}
          <div className="relative min-w-[130px]">
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-3 py-2 text-[13px] text-slate-700 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-50 pr-7 cursor-pointer transition-all"
            >
              <option value="">All Categories</option>
              {categoryOptions.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            <ChevronDown
              size={12}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
          </div>

          {/* Warehouse multi-select filter */}
          <WarehouseFilterDropdown
            options={warehouses}
            selected={selectedWarehouseIds}
            onToggle={toggleWarehouse}
            onClear={clearWarehouseFilter}
          />

          {/* Sort filter (Newest, etc.) */}
          <div className="relative min-w-[140px]">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="w-full appearance-none bg-white border border-slate-200 rounded-xl pl-8 pr-7 py-2 text-[13px] text-slate-700 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-50 cursor-pointer transition-all"
            >
              {SORT_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <Sparkles
              size={12}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-cyan-400 pointer-events-none"
            />
            <ChevronDown
              size={12}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
          </div>

          {/* Page size */}
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 pointer-events-none">
              Show:
            </span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="appearance-none bg-white border border-slate-200 rounded-xl pl-[44px] pr-7 py-2 text-[13px] text-slate-700 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-50 cursor-pointer transition-all"
            >
              {PAGE_SIZES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <ChevronDown
              size={12}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
          </div>
        </div>

        {/* ── Warehouse filter chips + hints ─────────────────────────────── */}
        {warehouseFilterActive && (
          <div className="mx-4 mt-3 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-slate-400 inline-flex items-center gap-1">
              <SlidersHorizontal size={11} />
              Filtering by:
            </span>
            {Array.from(selectedWarehouseIds).map((id) => (
              <span
                key={id}
                className="inline-flex items-center gap-1 bg-blue-50 text-blue-600 border border-blue-200 rounded-full pl-2.5 pr-1.5 py-0.5 text-[11px] font-medium"
              >
                {warehouseMap[id] || id}
                <button
                  onClick={() => toggleWarehouse(id)}
                  className="w-3.5 h-3.5 flex items-center justify-center rounded-full hover:bg-blue-200 transition-colors"
                >
                  <X size={9} />
                </button>
              </span>
            ))}
            {hiddenByWarehouseFilter > 0 && (
              <span className="text-[11px] text-slate-300">
                ({hiddenByWarehouseFilter} hidden on this page)
              </span>
            )}
          </div>
        )}

        {selectedVariantIds.size > 0 && (
          <div className="mx-4 mt-2 flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 text-[12px] text-emerald-700">
            <Check size={13} className="shrink-0 text-emerald-500" />
            <span>
              <strong>{selectedVariantIds.size}</strong> variant
              {selectedVariantIds.size > 1 ? "s" : ""} selected
            </span>
          </div>
        )}

        {/* ── Product List ───────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {isFetching && products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-cyan-500">
              <Loader2 size={24} className="animate-spin" />
              <span className="text-sm font-medium">Loading products...</span>
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <Package size={36} className="mb-3 opacity-30" />
              <p className="text-sm font-medium">No products found</p>
              <p className="text-xs text-slate-300 mt-1">
                {warehouseFilterActive
                  ? "No products are stocked at the selected warehouse(s) on this page"
                  : search
                  ? "Try a different search term"
                  : "No active products available"}
              </p>
            </div>
          ) : (
            products.map((product: any) => {
              const variants: any[] = product.variants ?? [];
              const hasVariants = variants.length > 0;
              const isExpanded = expandedProducts.has(product.id) || !hasVariants;

              const selectedCount = variants.filter((v) =>
                selectedVariantIds.has(v.id),
              ).length;
              const allSelected = hasVariants && selectedCount === variants.length;
              const someSelected = selectedCount > 0 && !allSelected;

              return (
                <div
                  key={product.id}
                  className="border border-slate-100 rounded-xl overflow-hidden hover:border-slate-200 transition-colors"
                >
                  {/* ── Product Header ─────────────────────────────────────── */}
                  <div className="w-full px-3.5 py-2.5 bg-slate-50/70 flex items-center gap-2.5 hover:bg-slate-50 transition-colors">
                    {/* Product-level checkbox */}
                    {hasVariants && (
                      <TriStateCheckbox
                        checked={allSelected}
                        indeterminate={someSelected}
                        onChange={(checked) => onToggleProduct(product, checked)}
                      />
                    )}

                    {/* Clickable area toggles expand */}
                    <button
                      onClick={() => hasVariants && toggleExpand(product.id)}
                      className="flex-1 flex items-center gap-2.5 text-left min-w-0"
                    >
                      {product.images?.[0]?.url ? (
                        <img
                          src={product.images[0].url}
                          alt=""
                          className="w-7 h-7 rounded-lg object-cover border border-slate-200"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-100 to-blue-100 flex items-center justify-center">
                          <Package size={13} className="text-cyan-500" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-semibold text-slate-700 truncate">
                          {product.name}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {product.category?.name || "Uncategorized"}
                        </div>
                      </div>

                      {hasVariants && (
                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`text-[11px] rounded-full px-2 py-0.5 ${
                              selectedCount > 0
                                ? "bg-emerald-100 text-emerald-700 font-semibold"
                                : "text-slate-400 bg-slate-100"
                            }`}
                          >
                            {selectedCount > 0 ? `${selectedCount}/` : ""}
                            {variants.length} variant{variants.length > 1 ? "s" : ""}
                          </span>
                          <svg
                            className={`text-slate-400 transition-transform duration-200 ${
                              isExpanded ? "rotate-180" : ""
                            }`}
                            width="14" height="14" viewBox="0 0 14 14" fill="none"
                          >
                            <path
                              d="M3.5 5.25L7 8.75L10.5 5.25"
                              stroke="currentColor" strokeWidth="1.5"
                              strokeLinecap="round" strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                      )}
                    </button>
                  </div>

                  {/* ── Variants Subsection ──────────────────────────────── */}
                  {isExpanded && hasVariants && (
                    <div className="border-t border-slate-100">
                      {variants.map((variant: any) => {
                        const { total: stockTotal, byWarehouse } = getWarehouseStock(variant);
                        const relevantTotal = warehouseFilterActive
                          ? Object.entries(byWarehouse)
                              .filter(([whId]) => selectedWarehouseIds.has(whId))
                              .reduce((s, [, qty]) => s + (qty as number), 0)
                          : stockTotal;
                        const isLow = relevantTotal < (variant.reorderLevel ?? 5);
                        const warehouseEntries = Object.entries(byWarehouse);
                        const isChecked = selectedVariantIds.has(variant.id);

                        return (
                          <label
                            key={variant.id}
                            className={`flex items-start gap-3 px-3.5 py-3 hover:bg-cyan-50/50 transition-colors border-b border-slate-50 last:border-b-0 cursor-pointer ${
                              isChecked ? "bg-cyan-50/40" : ""
                            }`}
                          >
                            {/* Variant checkbox */}
                            <div className="pt-0.5">
                              <TriStateCheckbox
                                checked={isChecked}
                                indeterminate={false}
                                onChange={(checked) =>
                                  onToggleVariant(product, variant, checked)
                                }
                              />
                            </div>

                            {/* Variant info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-[13px] font-medium text-slate-700">
                                  {variant.name || "Default"}
                                </span>
                                <span className="font-mono text-[11px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">
                                  {variant.sku}
                                </span>
                              </div>

                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                                {/* Per-warehouse stock chips — highlight the
                                    ones matching the active filter */}
                                {warehouseEntries.map(([whId, qty]) => {
                                  const isHighlighted =
                                    warehouseFilterActive && selectedWarehouseIds.has(whId);
                                  return (
                                    <span
                                      key={whId}
                                      className={
                                        isHighlighted
                                          ? `inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-[2px] rounded-md ${
                                              (qty as number) < (variant.reorderLevel ?? 5)
                                                ? "bg-rose-50 text-rose-600 border border-rose-200"
                                                : "bg-emerald-50 text-emerald-600 border border-emerald-200"
                                            }`
                                          : "text-[11px] text-slate-400"
                                      }
                                    >
                                      {isHighlighted && <Warehouse size={10} />}
                                      {warehouseMap[whId] || whId}:{" "}
                                      <span
                                        className={
                                          isHighlighted ? "" : "font-medium text-slate-500"
                                        }
                                      >
                                        {qty as number}
                                      </span>
                                      {isHighlighted &&
                                        (qty as number) < (variant.reorderLevel ?? 5) && (
                                          <AlertTriangle size={10} />
                                        )}
                                    </span>
                                  );
                                })}

                                {warehouseEntries.length > 1 && (
                                  <>
                                    <span className="text-[11px] text-slate-300">|</span>
                                    <span className="text-[11px] text-slate-500">
                                      Total:{" "}
                                      <span className="font-semibold text-slate-600">
                                        {stockTotal}
                                      </span>
                                    </span>
                                  </>
                                )}

                                {variant.avgCost > 0 && (
                                  <>
                                    <span className="text-[11px] text-slate-300">|</span>
                                    <span className="text-[11px] text-slate-400">
                                      Avg:{" "}
                                      <span className="font-medium text-slate-500">
                                        {Number(variant.avgCost || 0).toFixed(2)}
                                      </span>
                                    </span>
                                  </>
                                )}

                               
                              </div>
                            </div>

                            {/* Price + checked state icon */}
                            <div className="flex items-center gap-2 shrink-0">
                              <div className="text-right">
                                <div className="text-[14px] font-bold font-mono text-slate-700">
                                  {Number(variant.price || 0).toFixed(2)}
                                </div>
                              </div>
                              {isChecked ? (
                                <span className="w-6 h-6 flex items-center justify-center rounded-full bg-emerald-500 text-white">
                                  <Check size={13} />
                                </span>
                              ) : (
                                <span className="w-6 h-6 flex items-center justify-center rounded-full border border-slate-200 text-transparent">
                                  <Minus size={13} />
                                </span>
                              )}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {isExpanded && !hasVariants && (
                    <div className="px-3.5 py-2.5 border-t border-slate-100 text-[12px] text-slate-400">
                      No variants available
                    </div>
                  )}
                </div>
              );
            })
          )}

          {isFetching && products.length > 0 && (
            <div className="flex items-center justify-center py-4 gap-2 text-cyan-500">
              <Loader2 size={14} className="animate-spin" />
              <span className="text-xs">Loading...</span>
            </div>
          )}
        </div>

        {/* ── Pagination Footer ──────────────────────────────────────────── */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between flex-shrink-0">
            <span className="text-[11px] text-slate-400">
              {totalItems} product{totalItems !== 1 ? "s" : ""} · Page{" "}
              <span className="font-semibold text-slate-600">{displayPage}</span>
              {" / "}
              {totalPages}
            </span>

            <div className="flex items-center gap-1">
              <button
                onClick={goFirst}
                disabled={!hasPrevPage}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                title="First page"
              >
                <ChevronsLeft size={14} />
              </button>
              <button
                onClick={goPrev}
                disabled={!hasPrevPage}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                title="Previous"
              >
                <ChevronLeft size={14} />
              </button>

              {pageButtons.map((p, i) =>
                p === "..." ? (
                  <span key={`dots-${i}`} className="px-1 text-slate-300 text-xs">...</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => goToPage(p)}
                    className={`min-w-[28px] h-7 text-xs font-medium rounded-lg transition-all ${
                      p === displayPage
                        ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-sm"
                        : "text-slate-500 hover:bg-slate-100 cursor-pointer"
                    }`}
                  >
                    {p}
                  </button>
                ),
              )}

              <button
                onClick={goNext}
                disabled={!hasNextPage}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                title="Next"
              >
                <ChevronRight size={14} />
              </button>
              <button
                onClick={goLast}
                disabled={page >= totalPages}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                title="Last page"
              >
                <ChevronsRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* ── Bottom Bar ─────────────────────────────────────────────────── */}
        <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between flex-shrink-0 bg-slate-50/50">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <Layers size={11} />
            <span>Check a product to add all its variants, or check individual variants</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl text-[13px] font-semibold hover:from-blue-600 hover:to-cyan-600 transition-all shadow-sm shadow-blue-200"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}