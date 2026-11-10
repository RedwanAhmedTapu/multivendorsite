"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";
import { Search, X, Filter, Warehouse as WarehouseIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useGetWarehousesByVendorQuery, useGetRacksByWarehouseQuery } from "@/features/warehouseApi";
import { SearchableSelect } from "./SearchableSelect";
import type { SortBy } from "@/features/productapi/types";

// FIX: matches VendorProductFilter exactly — categoryId (an ID, not a
// free-text name), a single SortBy enum value (no separate sortOrder),
// plus warehouseId/rackId/rowNumber/shelfNumber.
interface FilterState {
  search: string;
  categoryId: string;
  minPrice: number | undefined;
  maxPrice: number | undefined;
  sortBy: SortBy;
  warehouseId: string;
  rackId: string;
  rowNumber: number | undefined;
  shelfNumber: number | undefined;
}

interface FilterProps {
  filters: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
}

const inputCls =
  "border-cyan-200 rounded-xl focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition-all";
const labelCls = "text-xs font-bold text-slate-400 uppercase tracking-wider";

// FIX: real SortBy enum values from types.ts — there's no separate
// direction field, so each option here IS the full backend value.
const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "rating_desc", label: "Rating: High to Low" },
  { value: "best_selling", label: "Best Selling" },
  { value: "most_viewed", label: "Most Viewed" },
  { value: "highest_discount", label: "Highest Discount" },
  { value: "recently_updated", label: "Recently Updated" },
];

const DEFAULT_SORT: SortBy = "newest";

const ProductFilters: React.FC<FilterProps> = ({ filters, onFilterChange }) => {
  const [localFilters, setLocalFilters] = useState(filters);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const vendorId = useSelector((state: RootState) => state.auth.user?.vendorId ?? "");

  const { data: warehouseData } = useGetWarehousesByVendorQuery(
    { vendorId, filters: {} },
    { skip: !vendorId },
  );
  const warehouses = warehouseData?.data ?? [];

  const { data: rackData } = useGetRacksByWarehouseQuery(
    { warehouseId: localFilters.warehouseId },
    { skip: !localFilters.warehouseId },
  );
  const racks = rackData?.data ?? [];

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const warehouseOptions = useMemo(
    () => [
      { value: "", label: "All Warehouses" },
      ...warehouses.map((w) => ({
        value: w.id,
        label: w.name || w.code || "Warehouse",
        sub: w.location
          ? [w.location.city, w.location.country].filter(Boolean).join(", ") || undefined
          : undefined,
      })),
    ],
    [warehouses],
  );

  const rackOptions = useMemo(
    () => [
      { value: "", label: "All Racks" },
      ...racks.map((r) => ({
        value: r.id,
        label: `${r.code}${r.label ? ` — ${r.label}` : ""}`,
      })),
    ],
    [racks],
  );

  const handleSearchChange = (value: string) => {
    setLocalFilters((prev) => ({ ...prev, search: value }));
  };

  const handleSearchSubmit = () => {
    onFilterChange({ search: localFilters.search });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearchSubmit();
  };

  const handleApplyFilters = () => {
    onFilterChange(localFilters);
    setMobileFiltersOpen(false);
  };

  const handleClearFilters = () => {
    const cleared: FilterState = {
      search: "",
      categoryId: "",
      minPrice: undefined,
      maxPrice: undefined,
      sortBy: DEFAULT_SORT,
      warehouseId: "",
      rackId: "",
      rowNumber: undefined,
      shelfNumber: undefined,
    };
    setLocalFilters(cleared);
    onFilterChange(cleared);
    setMobileFiltersOpen(false);
  };

  const handleWarehouseChange = (warehouseId: string) => {
    const next = { warehouseId, rackId: "", rowNumber: undefined, shelfNumber: undefined };
    setLocalFilters((prev) => ({ ...prev, ...next }));
    onFilterChange(next);
  };

  const handleRackChange = (rackId: string) => {
    const next = { rackId, rowNumber: undefined, shelfNumber: undefined };
    setLocalFilters((prev) => ({ ...prev, ...next }));
    onFilterChange(next);
  };

  const hasActiveFilters =
    filters.search ||
    filters.categoryId ||
    filters.minPrice !== undefined ||
    filters.maxPrice !== undefined ||
    filters.sortBy !== DEFAULT_SORT ||
    filters.warehouseId ||
    filters.rackId ||
    filters.rowNumber !== undefined ||
    filters.shelfNumber !== undefined;

  const activeFilterCount = [
    filters.search,
    filters.categoryId,
    filters.minPrice !== undefined,
    filters.maxPrice !== undefined,
    filters.sortBy !== DEFAULT_SORT,
    filters.warehouseId,
    filters.rackId,
    filters.rowNumber !== undefined,
    filters.shelfNumber !== undefined,
  ].filter(Boolean).length;

  const warehouseName = (id: string) =>
    warehouses.find((w) => w.id === id)?.name || warehouses.find((w) => w.id === id)?.code || id;
  const rackCode = (id: string) => racks.find((r) => r.id === id)?.code || id;
  const sortLabel = (v: SortBy) => SORT_OPTIONS.find((o) => o.value === v)?.label ?? v;

  const renderLocationFilters = (idPrefix: string) => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <WarehouseIcon className="w-3.5 h-3.5 text-cyan-500" />
        <Label className={labelCls}>Stock Location</Label>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-warehouse`} className="text-xs text-slate-500">
            Warehouse
          </Label>
          <SearchableSelect
            options={warehouseOptions}
            value={localFilters.warehouseId}
            onChange={handleWarehouseChange}
            placeholder="All Warehouses"
          />
        </div>

        {localFilters.warehouseId && racks.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-rack`} className="text-xs text-slate-500">
              Rack
            </Label>
            <SearchableSelect
              options={rackOptions}
              value={localFilters.rackId}
              onChange={handleRackChange}
              placeholder="All Racks"
            />
          </div>
        )}
      </div>

      {localFilters.warehouseId && localFilters.rackId && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-row`} className="text-xs text-slate-500">
              Row
            </Label>
            <Input
              id={`${idPrefix}-row`}
              type="number"
              min={1}
              placeholder="Any row"
              value={localFilters.rowNumber ?? ""}
              onChange={(e) => {
                const rowNumber = e.target.value ? parseInt(e.target.value, 10) : undefined;
                const next = { rowNumber };
                setLocalFilters((prev) => ({ ...prev, ...next }));
                onFilterChange(next);
              }}
              className={inputCls}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-shelf`} className="text-xs text-slate-500">
              Shelf
            </Label>
            <Input
              id={`${idPrefix}-shelf`}
              type="number"
              min={1}
              placeholder="Any shelf"
              value={localFilters.shelfNumber ?? ""}
              onChange={(e) => {
                const shelfNumber = e.target.value ? parseInt(e.target.value, 10) : undefined;
                const next = { shelfNumber };
                setLocalFilters((prev) => ({ ...prev, ...next }));
                onFilterChange(next);
              }}
              className={inputCls}
            />
          </div>
        </div>
      )}
    </div>
  );

  const renderAdvancedFilters = () => (
    <Card className="border-cyan-100 rounded-2xl">
      <CardContent className="pt-6">
        <div className="space-y-6">
          {/* FIX: this expects a real category ID now, not a free-text
              name — swap for a category picker if you have a category
              list source available; left as a text input for now. */}
          <div className="space-y-2">
            <Label htmlFor="categoryId" className={labelCls}>
              Category ID
            </Label>
            <Input
              id="categoryId"
              type="text"
              placeholder="Enter category ID"
              value={localFilters.categoryId}
              onChange={(e) => setLocalFilters((prev) => ({ ...prev, categoryId: e.target.value }))}
              className={inputCls}
            />
          </div>

          <div className="space-y-4">
            <Label className={labelCls}>Price Range (৳)</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                type="number"
                placeholder="Minimum"
                value={localFilters.minPrice || ""}
                onChange={(e) =>
                  setLocalFilters((prev) => ({
                    ...prev,
                    minPrice: e.target.value ? parseFloat(e.target.value) : undefined,
                  }))
                }
                className={inputCls}
              />
              <Input
                type="number"
                placeholder="Maximum"
                value={localFilters.maxPrice || ""}
                onChange={(e) =>
                  setLocalFilters((prev) => ({
                    ...prev,
                    maxPrice: e.target.value ? parseFloat(e.target.value) : undefined,
                  }))
                }
                className={inputCls}
              />
            </div>
          </div>

          {renderLocationFilters("mobile")}

          <div className="space-y-2">
            <Label htmlFor="sort" className={labelCls}>
              Sort By
            </Label>
            <Select
              value={localFilters.sortBy}
              onValueChange={(value) =>
                setLocalFilters((prev) => ({ ...prev, sortBy: value as SortBy }))
              }
            >
              <SelectTrigger id="sort" className={inputCls}>
                <SelectValue placeholder="Select sort option" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClearFilters}
              className="flex-1 border-cyan-200 text-cyan-700 hover:bg-cyan-50 hover:text-cyan-800 rounded-xl"
            >
              Clear All Filters
            </Button>
            <Button
              type="button"
              onClick={handleApplyFilters}
              className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 rounded-xl shadow-sm shadow-blue-200"
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4 p-4">
      {/* Desktop Layout */}
      <div className="hidden md:block">
        <div className="space-y-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-500" />
                <Input
                  type="text"
                  placeholder="Search by product name, SKU, category..."
                  value={localFilters.search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className={`pl-10 pr-10 py-2 h-11 ${inputCls}`}
                />
                {localFilters.search && (
                  <button
                    onClick={() => {
                      setLocalFilters((prev) => ({ ...prev, search: "" }));
                      onFilterChange({ search: "" });
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-500 hover:text-cyan-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
            <Button
              onClick={handleSearchSubmit}
              className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 px-6 whitespace-nowrap rounded-xl shadow-sm shadow-blue-200"
            >
              Search
            </Button>
            {hasActiveFilters && (
              <Button
                variant="outline"
                onClick={handleClearFilters}
                className="border-cyan-200 text-cyan-700 hover:bg-cyan-50 whitespace-nowrap rounded-xl"
              >
                Clear All
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="desktop-categoryId" className={labelCls}>
                Category ID
              </Label>
              <div className="relative">
                <Input
                  id="desktop-categoryId"
                  type="text"
                  placeholder="Category ID"
                  value={localFilters.categoryId}
                  onChange={(e) =>
                    setLocalFilters((prev) => ({ ...prev, categoryId: e.target.value }))
                  }
                  className={inputCls}
                />
                {localFilters.categoryId && (
                  <button
                    onClick={() => {
                      setLocalFilters((prev) => ({ ...prev, categoryId: "" }));
                      onFilterChange({ categoryId: "" });
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-500 hover:text-cyan-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="desktop-min-price" className={labelCls}>
                Min Price (৳)
              </Label>
              <Input
                id="desktop-min-price"
                type="number"
                placeholder="Minimum"
                value={localFilters.minPrice || ""}
                onChange={(e) =>
                  setLocalFilters((prev) => ({
                    ...prev,
                    minPrice: e.target.value ? parseFloat(e.target.value) : undefined,
                  }))
                }
                className={inputCls}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="desktop-max-price" className={labelCls}>
                Max Price (৳)
              </Label>
              <Input
                id="desktop-max-price"
                type="number"
                placeholder="Maximum"
                value={localFilters.maxPrice || ""}
                onChange={(e) =>
                  setLocalFilters((prev) => ({
                    ...prev,
                    maxPrice: e.target.value ? parseFloat(e.target.value) : undefined,
                  }))
                }
                className={inputCls}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="desktop-sort" className={labelCls}>
                Sort By
              </Label>
              <Select
                value={localFilters.sortBy}
                onValueChange={(value) => {
                  const next = { sortBy: value as SortBy };
                  setLocalFilters((prev) => ({ ...prev, ...next }));
                  onFilterChange(next);
                }}
              >
                <SelectTrigger id="desktop-sort" className={inputCls}>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="bg-blue-50/30 rounded-2xl border border-cyan-100 p-4">
            {renderLocationFilters("desktop")}
          </div>

          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-3 p-3 bg-cyan-50 rounded-xl border border-cyan-100">
              <span className="text-sm font-medium text-cyan-700">Active Filters:</span>
              <div className="flex flex-wrap gap-2">
                {filters.search && (
                  <Badge variant="outline" className="bg-white text-cyan-700 border-cyan-200">
                    Search: {filters.search}
                    <button
                      onClick={() => {
                        setLocalFilters((prev) => ({ ...prev, search: "" }));
                        onFilterChange({ search: "" });
                      }}
                      className="ml-1 hover:text-cyan-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                {filters.categoryId && (
                  <Badge variant="outline" className="bg-white text-cyan-700 border-cyan-200">
                    Category: {filters.categoryId}
                    <button
                      onClick={() => {
                        setLocalFilters((prev) => ({ ...prev, categoryId: "" }));
                        onFilterChange({ categoryId: "" });
                      }}
                      className="ml-1 hover:text-cyan-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                {filters.minPrice !== undefined && (
                  <Badge variant="outline" className="bg-white text-cyan-700 border-cyan-200">
                    Min: ৳{filters.minPrice}
                    <button
                      onClick={() => {
                        setLocalFilters((prev) => ({ ...prev, minPrice: undefined }));
                        onFilterChange({ minPrice: undefined });
                      }}
                      className="ml-1 hover:text-cyan-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                {filters.maxPrice !== undefined && (
                  <Badge variant="outline" className="bg-white text-cyan-700 border-cyan-200">
                    Max: ৳{filters.maxPrice}
                    <button
                      onClick={() => {
                        setLocalFilters((prev) => ({ ...prev, maxPrice: undefined }));
                        onFilterChange({ maxPrice: undefined });
                      }}
                      className="ml-1 hover:text-cyan-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                {filters.warehouseId && (
                  <Badge variant="outline" className="bg-white text-cyan-700 border-cyan-200">
                    Warehouse: {warehouseName(filters.warehouseId)}
                    <button onClick={() => handleWarehouseChange("")} className="ml-1 hover:text-cyan-900">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                {filters.rackId && (
                  <Badge variant="outline" className="bg-white text-cyan-700 border-cyan-200">
                    Rack: {rackCode(filters.rackId)}
                    <button onClick={() => handleRackChange("")} className="ml-1 hover:text-cyan-900">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                {(filters.rowNumber !== undefined || filters.shelfNumber !== undefined) && (
                  <Badge variant="outline" className="bg-white text-cyan-700 border-cyan-200">
                    {filters.rowNumber !== undefined ? `Row ${filters.rowNumber}` : ""}
                    {filters.rowNumber !== undefined && filters.shelfNumber !== undefined ? " / " : ""}
                    {filters.shelfNumber !== undefined ? `Shelf ${filters.shelfNumber}` : ""}
                    <button
                      onClick={() => {
                        const next = { rowNumber: undefined, shelfNumber: undefined };
                        setLocalFilters((prev) => ({ ...prev, ...next }));
                        onFilterChange(next);
                      }}
                      className="ml-1 hover:text-cyan-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                {filters.sortBy !== DEFAULT_SORT && (
                  <Badge variant="outline" className="bg-white text-cyan-700 border-cyan-200">
                    Sort: {sortLabel(filters.sortBy)}
                    <button
                      onClick={() => {
                        setLocalFilters((prev) => ({ ...prev, sortBy: DEFAULT_SORT }));
                        onFilterChange({ sortBy: DEFAULT_SORT });
                      }}
                      className="ml-1 hover:text-cyan-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden space-y-4">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-500" />
            <Input
              type="text"
              placeholder="Search products..."
              value={localFilters.search}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyPress={handleKeyPress}
              className={`pl-9 pr-9 py-2 h-10 text-sm ${inputCls}`}
            />
            {localFilters.search && (
              <button
                onClick={() => {
                  setLocalFilters((prev) => ({ ...prev, search: "" }));
                  onFilterChange({ search: "" });
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-500 hover:text-cyan-700"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="border-cyan-200 text-cyan-700 hover:bg-cyan-50 relative rounded-xl"
              >
                <Filter className="h-4 w-4" />
                {hasActiveFilters && (
                  <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 text-xs bg-gradient-to-r from-blue-600 to-cyan-500">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filters
                  {hasActiveFilters && (
                    <Badge variant="secondary" className="bg-cyan-100 text-cyan-800">
                      {activeFilterCount} active
                    </Badge>
                  )}
                </SheetTitle>
              </SheetHeader>
              <div className="py-6">{renderAdvancedFilters()}</div>
            </SheetContent>
          </Sheet>

          <Button
            onClick={handleSearchSubmit}
            className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 px-4 rounded-xl"
            size="sm"
          >
            Search
          </Button>
        </div>

        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 p-3 bg-cyan-50 rounded-xl border border-cyan-100">
            <span className="text-xs font-medium text-cyan-700">Active:</span>
            {filters.search && (
              <Badge variant="outline" className="bg-white text-cyan-700 border-cyan-200 text-xs">
                Search: {filters.search.length > 10 ? filters.search.substring(0, 10) + "..." : filters.search}
                <button
                  onClick={() => {
                    setLocalFilters((prev) => ({ ...prev, search: "" }));
                    onFilterChange({ search: "" });
                  }}
                  className="ml-1 hover:text-cyan-900"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            {filters.warehouseId && (
              <Badge variant="outline" className="bg-white text-cyan-700 border-cyan-200 text-xs">
                {warehouseName(filters.warehouseId)}
                <button onClick={() => handleWarehouseChange("")} className="ml-1 hover:text-cyan-900">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            <button
              onClick={handleClearFilters}
              className="text-xs text-cyan-600 hover:text-cyan-800 font-medium ml-auto"
            >
              Clear all
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductFilters;