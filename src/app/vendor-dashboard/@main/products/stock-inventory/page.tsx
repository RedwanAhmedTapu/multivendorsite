"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";
import {
  AlertTriangle,
  Building2,
  ChevronDown,
  ChevronRight,
  Loader2,
  MoreVertical,
  Package,
  RefreshCw,
  Search,
  ShieldAlert,
  Tag,
  X,
  Box,
} from "lucide-react";

import {
  useGetStockInventoryQuery,
  useLazyGetStockInventoryQuery,
  useGetStockStatsQuery,
  type StockInventoryRow,
  type StockStatus,
} from "@/features/stockApi";
import { useGetWarehousesByVendorQuery } from "@/features/warehouseApi";
import UnifiedStockModal from "./components/UnifiedStockModal";

import type { ModalMode } from "./types";
import { STATUS_CONFIG } from "./constants";
import {
  StatCard,
  StatusBadge,
  WarehousePill,
  SearchableSelect,
  ActionMenu,
  SellDamageModal,
  DetailPanel,
  PaginationBar,
} from "./components";

// FIX: dropdown option shape for the Rack/Row/Shelf filter. Extends the
// plain {value,label,sub} shape SearchableSelect expects with the raw
// rack/row/shelf identifiers so we can pass them straight into the
// getStockInventory query params.
type LocationOption = {
  value: string;
  label: string;
  sub?: string;
  rackId?: string;
  rowNumber?: number;
  shelfNumber?: number;
};

// FIX: a product-level group aggregating all variant rows (on the current
// page) that share the same productId, used to render one collapsible
// header row per product instead of one flat row per variant.
type ProductGroup = {
  productId: string;
  productName: string;
  category: string | null;
  image: string | null;
  variants: StockInventoryRow[];
  totalStock: number;
  available: number;
  damaged: number;
  value: number;
  warehouses: { warehouseId: string; warehouseName: string; quantity: number }[];
  variantCount: number;
  statusSet: Set<StockStatus>;
};

export default function StockInventoryPage() {
  const vendorId = useSelector(
    (state: RootState) => state.auth.user?.vendorId ?? "",
  );

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StockStatus | "">("");
  const [warehouseFilter, setWarehouseFilter] = useState("");
  // FIX: composite key identifying a rack/row/shelf combo within the
  // selected warehouse. Cleared whenever the warehouse filter changes.
  const [locationKey, setLocationKey] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [activeRow, setActiveRow] = useState<StockInventoryRow | null>(null);
  const [detailVariantId, setDetailVariantId] = useState<string | null>(null);

  // FIX: which product groups are expanded to show their individual
  // variant rows. Single-variant products always render expanded.
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 380);
    return () => clearTimeout(t);
  }, [search]);

  const {
    data: statsData,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useGetStockStatsQuery();

  // FIX: separate lazy query used only to enumerate rack/row/shelf
  // locations for the currently selected warehouse. Fetched with a large
  // limit and no search/status filters so the Location dropdown reflects
  // the whole warehouse, not just the current page of the main table.
  const [fetchLocationsProbe, { data: locationProbeData, isFetching: locationsLoading }] =
    useLazyGetStockInventoryQuery();

  useEffect(() => {
    setLocationKey("");
    if (warehouseFilter) {
      fetchLocationsProbe({ warehouseId: warehouseFilter, limit: 200, page: 1 });
    }
  }, [warehouseFilter, fetchLocationsProbe]);

  // FIX: derive de-duplicated rack/row/shelf options for the selected
  // warehouse from the probe query's warehouseBreakdown[].locations.
  const locationOptions = useMemo<LocationOption[]>(() => {
    if (!warehouseFilter) return [];
    const probeRows = locationProbeData?.data ?? [];
    const map = new Map<string, LocationOption>();

    probeRows.forEach((row) => {
      const wb = row.warehouseBreakdown.find(
        (w) => w.warehouseId === warehouseFilter,
      );
      wb?.locations.forEach((loc) => {
        const key = `${loc.rackId ?? "loose"}::${loc.rowNumber ?? ""}::${loc.shelfNumber ?? ""}`;
        if (!map.has(key)) {
          const parts: string[] = [];
          if (loc.rackLabel || loc.rackCode) {
            parts.push(`Rack ${loc.rackLabel || loc.rackCode}`);
          }
          if (loc.rowNumber != null) parts.push(`Row ${loc.rowNumber}`);
          if (loc.shelfNumber != null) parts.push(`Shelf ${loc.shelfNumber}`);
          map.set(key, {
            value: key,
            label: parts.length ? parts.join(" · ") : "Loose stock (no rack)",
            sub: `${loc.quantity} units`,
            rackId: loc.rackId ?? undefined,
            rowNumber: loc.rowNumber ?? undefined,
            shelfNumber: loc.shelfNumber ?? undefined,
          });
        }
      });
    });

    return Array.from(map.values());
  }, [locationProbeData, warehouseFilter]);

  const selectedLocation = locationOptions.find((l) => l.value === locationKey);

  const {
    data: inventoryData,
    isLoading: inventoryLoading,
    isFetching,
    refetch: refetchInventory,
  } = useGetStockInventoryQuery({
    q: debouncedSearch || undefined,
    status: statusFilter || undefined,
    warehouseId: warehouseFilter || undefined,
    // FIX: pass the selected rack/row/shelf through to the main query.
    rackId: selectedLocation?.rackId,
    rowNumber: selectedLocation?.rowNumber,
    shelfNumber: selectedLocation?.shelfNumber,
    page,
    limit,
  });

  const { data: warehouseData } = useGetWarehousesByVendorQuery(
    { vendorId, filters: { type: undefined } },
    { skip: !vendorId },
  );

  const stats = statsData?.data;
  const rows = inventoryData?.data ?? [];
  const pagination = inventoryData?.pagination;
  const warehouses = warehouseData?.data ?? [];

  // FIX: group the current page's flat variant rows by productId so the
  // table can render one product header row with its variants nested
  // underneath — mirrors the grouping pattern used in ProductPickerModal.
  // NOTE: grouping only applies within the current page of results, since
  // the backend paginates by variant row, not by product. A product whose
  // variants straddle a page boundary will appear as a partial group on
  // each page.
  const groupedRows = useMemo<ProductGroup[]>(() => {
    const map = new Map<string, ProductGroup>();

    rows.forEach((row) => {
      let group = map.get(row.productId);
      if (!group) {
        group = {
          productId: row.productId,
          productName: row.productName,
          category: row.category,
          image: row.image,
          variants: [],
          totalStock: 0,
          available: 0,
          damaged: 0,
          value: 0,
          warehouses: [],
          variantCount: 0,
          statusSet: new Set(),
        };
        map.set(row.productId, group);
      }

      const totalStock = Number(row.totalStock) || 0;
      const avgCost = Number(row.avgCost) || 0;

      group.variants.push(row);
      group.totalStock += totalStock;
      group.available += Number(row.availableStock) || 0;
      group.damaged += Number(row.damagedQty) || 0;
      group.value += totalStock * avgCost;
      group.statusSet.add(row.status);

      const whMap = new Map(group.warehouses.map((w) => [w.warehouseId, w]));
      row.warehouseBreakdown.forEach((wb) => {
        const existing = whMap.get(wb.warehouseId);
        if (existing) {
          existing.quantity += wb.quantity;
        } else {
          whMap.set(wb.warehouseId, {
            warehouseId: wb.warehouseId,
            warehouseName: wb.warehouseName,
            quantity: wb.quantity,
          });
        }
      });
      group.warehouses = Array.from(whMap.values());
    });

    map.forEach((g) => (g.variantCount = g.variants.length));
    return Array.from(map.values());
  }, [rows]);

  const toggleProductExpand = (productId: string) => {
    setExpandedProducts((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  };

  const warehouseFilterOptions = [
    { value: "", label: "All Warehouses" },
    ...warehouses.map((w) => ({
      value: w.id,
      label: w.name || w.code || "Warehouse",
      sub: w.location
        ? [w.location.city, w.location.country].filter(Boolean).join(", ") ||
          undefined
        : undefined,
    })),
  ];

  const statusOptions = [
    { value: "", label: "All Status" },
    { value: "in_stock", label: "In Stock" },
    { value: "low_stock", label: "Low Stock" },
    { value: "out_stock", label: "Out of Stock" },
    { value: "overstock", label: "Overstock" },
  ];

  const openModal = (mode: ModalMode, row: StockInventoryRow) => {
    setActiveRow(row);
    setModalMode(mode);
    // If mode is "detail", use the side panel instead
    if (mode === "detail") {
      setDetailVariantId(row.variantId);
      setModalMode(null);
      setActiveRow(null);
    }
  };

  const closeModal = () => {
    setModalMode(null);
    setActiveRow(null);
    refetchInventory();
    refetchStats();
  };

  const handleRefresh = () => {
    refetchInventory();
    refetchStats();
    // FIX: keep the location dropdown's option list in sync too.
    if (warehouseFilter) {
      fetchLocationsProbe({ warehouseId: warehouseFilter, limit: 200, page: 1 });
    }
  };

  const handleLimitChange = (l: number) => {
    setLimit(l);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/20 font-sans">
      <style>{`
        @keyframes modal-in {
          from { opacity: 0; transform: scale(0.95) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes slide-in {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
      `}</style>

      {/* ── Top Bar ── */}
      <header className="bg-white/80 backdrop-blur-md border-b border-blue-100 sticky top-0 z-30 shadow-sm shadow-blue-50">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 min-w-0 overflow-hidden">
            <div className="flex items-center gap-1.5 font-semibold text-cyan-600 shrink-0">
              <Building2 size={14} />
              <span>ERP</span>
            </div>
            <ChevronRight size={12} className="shrink-0" />
            <span className="text-slate-500 shrink-0 hidden xs:inline">
              Inventory
            </span>
            <ChevronRight size={12} className="shrink-0 hidden xs:inline" />
            <span className="font-semibold text-slate-700 truncate">
              Stock Inventory
            </span>
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl hover:from-blue-700 hover:to-cyan-600 shadow-sm shadow-blue-200 transition-all shrink-0"
          >
            <RefreshCw size={12} className={isFetching ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </header>

      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-6">
        {/* ── Page title ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">
              Stock Inventory
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          {isFetching && (
            <div className="flex items-center gap-2 text-xs text-cyan-600 bg-cyan-50 border border-cyan-200 rounded-xl px-3 py-1.5 self-start sm:self-auto">
              <Loader2 size={12} className="animate-spin" /> Syncing…
            </div>
          )}
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <StatCard
            label="Total Products"
            value={stats?.totalVariants ?? 0}
            sub={`${stats?.totalStock ?? 0} total units`}
            icon={<Package size={18} />}
            accent="from-blue-500 to-cyan-400"
            loading={statsLoading}
          />
          <StatCard
            label="Inventory Value"
            value={stats ? `৳${stats.totalValue.toLocaleString()}` : "—"}
            sub={`৳${stats ? (stats.totalValue / Math.max(stats.totalVariants, 1)).toFixed(0) : 0} avg/product`}
            icon={<span style={{ fontSize: "18px", fontWeight: 600 }}>৳</span>}
            accent="from-cyan-500 to-emerald-400"
            loading={statsLoading}
          />
          <StatCard
            label="Low / Out of Stock"
            value={`${stats?.lowStockCount ?? 0} / ${stats?.outOfStockCount ?? 0}`}
            sub="Need attention"
            icon={<AlertTriangle size={18} />}
            accent="from-amber-500 to-orange-400"
            loading={statsLoading}
          />
          <StatCard
            label="Damaged Units"
            value={stats?.totalDamaged ?? 0}
            sub={`${stats?.totalReserved ?? 0} reserved`}
            icon={<ShieldAlert size={18} />}
            accent="from-rose-500 to-pink-400"
            loading={statsLoading}
          />
        </div>

        {/* ── Filters Bar ── */}
        <div className="bg-white rounded-2xl border border-blue-100 shadow-sm shadow-blue-50 px-4 py-3 mb-4 flex flex-wrap gap-3 items-end">
          {/* Search */}
          <div className="relative flex-1 min-w-52">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Search
            </label>
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by product name or SKU…"
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-cyan-200 rounded-xl focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition-all placeholder-slate-300"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Status filter — searchable */}
          <div className="min-w-[160px]">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Status
            </label>
            <SearchableSelect
              options={statusOptions}
              value={statusFilter}
              onChange={(v) => {
                setStatusFilter(v as StockStatus | "");
                setPage(1);
              }}
              placeholder="All Status"
            />
          </div>

          {/* Warehouse filter — searchable, from API */}
          <div className="min-w-[180px]">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Warehouse
            </label>
            <SearchableSelect
              options={warehouseFilterOptions}
              value={warehouseFilter}
              onChange={(v) => {
                setWarehouseFilter(v);
                setPage(1);
              }}
              placeholder="All Warehouses"
            />
          </div>

          {/* FIX: Rack/Row/Shelf filter — only shown once a warehouse is
              selected and that warehouse actually has enumerable locations. */}
          {warehouseFilter && (locationsLoading || locationOptions.length > 0) && (
            <div className="min-w-[200px]">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Rack / Row / Shelf
              </label>
              <SearchableSelect
                options={[{ value: "", label: "All Locations" }, ...locationOptions]}
                value={locationKey}
                onChange={(v) => {
                  setLocationKey(v);
                  setPage(1);
                }}
                placeholder={locationsLoading ? "Loading…" : "All Locations"}
              />
            </div>
          )}

          {/* Clear filters */}
          {(statusFilter || warehouseFilter || locationKey || search) && (
            <div className="pb-0.5">
              <button
                onClick={() => {
                  setSearch("");
                  setStatusFilter("");
                  setWarehouseFilter("");
                  setLocationKey("");
                  setPage(1);
                }}
                className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100 transition-colors"
              >
                <X size={12} /> Clear filters
              </button>
            </div>
          )}

          <div className="text-xs text-slate-400 ml-auto hidden sm:block self-end pb-0.5">
            {pagination ? `${pagination.total} products` : ""}
          </div>
        </div>

        {/* ── Table ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm shadow-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-separate border-spacing-0">
              <thead>
                <tr className="bg-slate-50/80">
                  {[
                    "Product",
                    "SKU",
                    "Category",
                    "Status",
                    "Total",
                    "Available",
                    "Damaged",
                    "Avg Cost",
                    "Value",
                    "Warehouses",
                    "Actions",
                  ].map((h, i) => (
                    <th
                      key={i}
                      className="text-left text-[10px] font-extrabold text-slate-500 uppercase tracking-widest px-4 py-3.5 whitespace-nowrap border-y border-x-0 border-slate-200 first:rounded-tl-2xl last:rounded-tr-2xl"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {inventoryLoading ? (
                  Array.from({ length: limit }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 11 }).map((_, j) => (
                        <td
                          key={j}
                          className="px-4 py-3 border-y border-x-0 border-slate-100"
                        >
                          <div
                            className="h-4 bg-slate-100 rounded animate-pulse"
                            style={{ width: `${40 + Math.random() * 50}%` }}
                          />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : groupedRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={11}
                      className="py-20 text-center border-y border-x-0 border-slate-100"
                    >
                      <div className="flex flex-col items-center gap-3 text-slate-300">
                        <Package size={40} className="opacity-40" />
                        <div className="text-sm font-medium text-slate-400">
                          No stock records found
                        </div>
                        <div className="text-xs text-slate-300">
                          Try adjusting your filters
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  groupedRows.map((group) => {
                    const rowCell =
                      "px-4 py-3.5 border-y border-x-0 border-slate-100";
                    const isMultiVariant = group.variantCount > 1;
                    const isExpanded =
                      !isMultiVariant || expandedProducts.has(group.productId);
                    const singleStatus =
                      group.statusSet.size === 1
                        ? (Array.from(group.statusSet)[0] as StockStatus)
                        : null;

                    return (
                      <React.Fragment key={group.productId}>
                        {/* ── Product header row ── */}
                        <tr
                          className={`bg-slate-50/60 transition-colors ${
                            isMultiVariant
                              ? "cursor-pointer hover:bg-slate-100/70"
                              : "hover:bg-slate-50/70"
                          }`}
                          onClick={() =>
                            isMultiVariant && toggleProductExpand(group.productId)
                          }
                        >
                          {/* Product */}
                          <td className={rowCell} colSpan={2}>
                            <div className="flex items-center gap-2.5">
                              {isMultiVariant ? (
                                <ChevronDown
                                  size={14}
                                  className={`text-slate-400 shrink-0 transition-transform ${
                                    isExpanded ? "rotate-180" : ""
                                  }`}
                                />
                              ) : (
                                <span className="w-3.5 shrink-0" />
                              )}
                              {group.image ? (
                                <img
                                  src={group.image}
                                  alt=""
                                  className="w-8 h-8 rounded-xl object-cover shrink-0 border border-slate-200"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                                  <Box size={13} className="text-blue-500" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-slate-700 truncate max-w-[170px]">
                                  {group.productName}
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  {isMultiVariant
                                    ? `${group.variantCount} variants`
                                    : group.variants[0].variantName}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Category (spans where SKU column would've been) */}
                          <td className={rowCell}>
                            <span className="text-xs text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-lg">
                              {group.category ?? "—"}
                            </span>
                          </td>

                          {/* Status */}
                          <td className={rowCell}>
                            {isMultiVariant ? (
                              singleStatus ? (
                                <StatusBadge status={singleStatus} />
                              ) : (
                                <span className="text-[10px] text-slate-400 font-semibold italic">
                                  mixed
                                </span>
                              )
                            ) : (
                              <StatusBadge status={group.variants[0].status} />
                            )}
                          </td>

                          {/* Total */}
                          <td className={rowCell}>
                            <span className="text-sm font-extrabold text-slate-700">
                              {group.totalStock}
                            </span>
                          </td>

                          {/* Available */}
                          <td className={rowCell}>
                            <span
                              className={`text-sm font-bold ${
                                group.available > 0
                                  ? "text-emerald-600"
                                  : "text-rose-500"
                              }`}
                            >
                              {group.available}
                            </span>
                          </td>

                          {/* Damaged */}
                          <td className={rowCell}>
                            {group.damaged > 0 ? (
                              <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-lg">
                                <ShieldAlert size={10} />
                                {group.damaged}
                              </span>
                            ) : (
                              <span className="text-sm font-bold text-slate-300">
                                —
                              </span>
                            )}
                          </td>

                          {/* Avg Cost */}
                          <td className={rowCell}>
                            {isMultiVariant ? (
                              <span className="text-[10px] text-slate-400 font-semibold italic">
                                varies
                              </span>
                            ) : (
                              <span className="font-mono text-xs text-slate-600">
                                ৳{(Number(group.variants[0].avgCost) || 0).toFixed(2)}
                              </span>
                            )}
                          </td>

                          {/* Value */}
                          <td className={rowCell}>
                            <span className="font-mono text-xs font-bold text-blue-700">
                              ৳
                              {group.value.toLocaleString(undefined, {
                                maximumFractionDigits: 0,
                              })}
                            </span>
                          </td>

                          {/* Warehouses */}
                          <td className={rowCell}>
                            <div className="flex flex-wrap gap-1 max-w-[160px]">
                              {group.warehouses.slice(0, 3).map((wb) => (
                                <WarehousePill
                                  key={wb.warehouseId}
                                  name={wb.warehouseName}
                                  qty={wb.quantity}
                                />
                              ))}
                              {group.warehouses.length > 3 && (
                                <span className="text-[10px] text-slate-400 font-semibold self-center">
                                  +{group.warehouses.length - 3}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Actions — only meaningful per-variant; show
                              menu directly when there's just one variant */}
                          <td className={rowCell} onClick={(e) => e.stopPropagation()}>
                            {isMultiVariant ? (
                              <span className="text-[10px] text-slate-300">—</span>
                            ) : (
                              <ActionMenu row={group.variants[0]} onAction={openModal} />
                            )}
                          </td>
                        </tr>

                        {/* ── Variant rows (nested, shown when expanded) ── */}
                        {isMultiVariant &&
                          isExpanded &&
                          group.variants.map((row) => {
                            const totalStock = Number(row.totalStock) || 0;
                            const avgCost = Number(row.avgCost) || 0;
                            const value = totalStock * avgCost;

                            return (
                              <tr
                                key={row.variantId}
                                className="hover:bg-cyan-50/40 group transition-colors"
                              >
                                {/* Variant name + SKU */}
                                <td className={rowCell} colSpan={2}>
                                  <div className="flex items-center gap-2.5 pl-9">
                                    <div className="min-w-0">
                                      <div className="text-xs font-semibold text-slate-600 truncate max-w-[150px]">
                                        {row.variantName}
                                      </div>
                                      <span className="font-mono text-[10px] bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded-lg text-slate-500">
                                        {row.sku}
                                      </span>
                                    </div>
                                  </div>
                                </td>

                                {/* Category left blank at variant level (shown on header) */}
                                <td className={rowCell} />

                                {/* Status */}
                                <td className={rowCell}>
                                  <StatusBadge status={row.status} />
                                </td>

                                {/* Total */}
                                <td className={rowCell}>
                                  <span className="text-sm font-bold text-slate-600">
                                    {totalStock}
                                  </span>
                                </td>

                                {/* Available */}
                                <td className={rowCell}>
                                  <span
                                    className={`text-sm font-bold ${
                                      row.availableStock > 0
                                        ? "text-emerald-600"
                                        : "text-rose-500"
                                    }`}
                                  >
                                    {row.availableStock}
                                  </span>
                                </td>

                                {/* Damaged */}
                                <td className={rowCell}>
                                  {row.damagedQty > 0 ? (
                                    <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-lg">
                                      <ShieldAlert size={10} />
                                      {row.damagedQty}
                                    </span>
                                  ) : (
                                    <span className="text-sm font-bold text-slate-300">
                                      —
                                    </span>
                                  )}
                                </td>

                                {/* Avg Cost */}
                                <td className={rowCell}>
                                  <span className="font-mono text-xs text-slate-500">
                                    ৳{avgCost.toFixed(2)}
                                  </span>
                                </td>

                                {/* Value */}
                                <td className={rowCell}>
                                  <span className="font-mono text-xs font-semibold text-blue-600">
                                    ৳
                                    {value.toLocaleString(undefined, {
                                      maximumFractionDigits: 0,
                                    })}
                                  </span>
                                </td>

                                {/* Warehouses */}
                                <td className={rowCell}>
                                  <div className="flex flex-wrap gap-1 max-w-[160px]">
                                    {row.warehouseBreakdown.slice(0, 3).map((wb) => (
                                      <WarehousePill
                                        key={wb.warehouseId}
                                        name={wb.warehouseName}
                                        qty={wb.quantity}
                                      />
                                    ))}
                                    {row.warehouseBreakdown.length > 3 && (
                                      <span className="text-[10px] text-slate-400 font-semibold self-center">
                                        +{row.warehouseBreakdown.length - 3}
                                      </span>
                                    )}
                                  </div>
                                </td>

                                {/* Actions — 3-dot menu */}
                                <td className={rowCell}>
                                  <ActionMenu row={row} onAction={openModal} />
                                </td>
                              </tr>
                            );
                          })}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* ── Pagination ── */}
          {!inventoryLoading && pagination && pagination.total > 0 && (
            <PaginationBar
              page={pagination.page}
              pages={pagination.pages}
              total={pagination.total}
              limit={limit}
              onPageChange={setPage}
              onLimitChange={handleLimitChange}
            />
          )}
        </div>

        {/* ── Legend ── */}
        <div className="flex flex-wrap items-center gap-4 mt-4 px-1">
          <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
            Legend:
          </span>
          {(
            Object.entries(STATUS_CONFIG) as [
              StockStatus,
              (typeof STATUS_CONFIG)[StockStatus],
            ][]
          ).map(([k, v]) => (
            <span
              key={k}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${v.bg} ${v.text}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${v.dot}`} />
              {v.label}
            </span>
          ))}
          <div className="ml-auto text-[11px] text-slate-400 hidden lg:flex items-center gap-3">
            <span className="flex items-center gap-1">
              <MoreVertical size={11} /> Actions menu per row
            </span>
            <span className="flex items-center gap-1 text-purple-500 font-semibold">
              <Tag size={11} /> Sell damaged available when damaged &gt; 0
            </span>
          </div>
        </div>
      </div>

      {/* ── Unified Modals ── */}
      {(modalMode === "adjust" ||
        modalMode === "damage" ||
        modalMode === "transfer") &&
        activeRow && (
          <UnifiedStockModal
            row={activeRow}
            vendorId={vendorId}
            warehouses={warehouses}
            initialMode={modalMode as "adjust" | "damage" | "transfer"}
            onClose={closeModal}
          />
        )}

      {modalMode === "sell" && activeRow && (
        <SellDamageModal
          row={activeRow}
          vendorId={vendorId}
          onClose={closeModal}
        />
      )}
      {detailVariantId && (
        <DetailPanel
          variantId={detailVariantId}
          onClose={() => setDetailVariantId(null)}
        />
      )}
    </div>
  );
}