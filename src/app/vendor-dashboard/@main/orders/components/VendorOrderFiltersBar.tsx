"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Search,
  X,
  CalendarRange,
  Download,
  RefreshCw,
  ChevronDown,
} from "lucide-react";
import type { VendorOrderFilters } from "@/types/vendorOrderTypes";

// Only the statuses a vendor will see in practice
const ORDER_STATUS_OPTIONS = [
  { value: "CONFIRMED",  label: "New Order",   dot: "bg-blue-500" },
  { value: "PROCESSING", label: "Processing",  dot: "bg-indigo-500" },
  { value: "PACKAGING",  label: "Packaging",   dot: "bg-violet-500" },
  { value: "SHIPPED",    label: "Shipped",     dot: "bg-sky-500" },
  { value: "DELIVERED",  label: "Delivered",   dot: "bg-emerald-500" },
  { value: "CANCELLED",  label: "Cancelled",   dot: "bg-slate-400" },
  { value: "RETURNED",   label: "Returned",    dot: "bg-orange-500" },
] as const;

const FULFILLMENT_OPTIONS = [
  { value: "UNFULFILLED",         label: "Unfulfilled" },
  { value: "PARTIALLY_FULFILLED", label: "Partial" },
  { value: "FULFILLED",           label: "Fulfilled" },
  { value: "SHIPPED",             label: "Shipped" },
  { value: "DELIVERED",           label: "Delivered" },
] as const;

interface Props {
  filters: VendorOrderFilters;
  setFilter: <K extends keyof VendorOrderFilters>(key: K, value: VendorOrderFilters[K]) => void;
  resetFilters: () => void;
  activeFilterCount: number;
  isLoading?: boolean;
  onExport?: () => void;
  onRefresh?: () => void;
}

export function VendorOrderFiltersBar({
  filters,
  setFilter,
  resetFilters,
  activeFilterCount,
  isLoading,
  onExport,
  onRefresh,
}: Props) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
      {/* Row 1: search + actions */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          <Input
            className="pl-9 h-9 text-sm bg-slate-50 border-slate-200 focus:bg-white"
            placeholder="Search order # or customer name…"
            value={filters.search}
            onChange={(e) => setFilter("search", e.target.value)}
          />
          {filters.search && (
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              onClick={() => setFilter("search", "")}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="h-9 text-xs text-slate-500 hover:text-slate-700 gap-1.5"
            >
              <X className="w-3.5 h-3.5" />
              Clear ({activeFilterCount})
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            className="h-9 w-9 p-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            className="h-9 text-xs gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </Button>
        </div>
      </div>

      {/* Row 2: filter selects */}
      <div className="flex flex-wrap gap-2">
        {/* Order Status */}
        <Select
          value={filters.status || "ALL"}
          onValueChange={(v) => setFilter("status", v === "ALL" ? "" : (v as any))}
        >
          <SelectTrigger className="h-8 text-xs border-slate-200 bg-slate-50 w-36">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            {ORDER_STATUS_OPTIONS.map(({ value, label, dot }) => (
              <SelectItem key={value} value={value}>
                <span className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`} />
                  {label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Fulfillment */}
        <Select
          value={filters.fulfillmentStatus || "ALL"}
          onValueChange={(v) => setFilter("fulfillmentStatus", v === "ALL" ? "" : (v as any))}
        >
          <SelectTrigger className="h-8 text-xs border-slate-200 bg-slate-50 w-36">
            <SelectValue placeholder="Fulfillment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Fulfillment</SelectItem>
            {FULFILLMENT_OPTIONS.map(({ value, label }) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Date range */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={`h-8 text-xs border-slate-200 bg-slate-50 gap-1.5 ${
                filters.dateFrom || filters.dateTo
                  ? "border-teal-300 bg-teal-50 text-teal-700"
                  : ""
              }`}
            >
              <CalendarRange className="w-3.5 h-3.5" />
              {filters.dateFrom || filters.dateTo
                ? `${filters.dateFrom || "…"} → ${filters.dateTo || "…"}`
                : "Date Range"}
              <ChevronDown className="w-3 h-3 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-4" align="start">
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-500">From</Label>
                <Input
                  type="date"
                  className="h-8 text-xs"
                  value={filters.dateFrom}
                  onChange={(e) => setFilter("dateFrom", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-500">To</Label>
                <Input
                  type="date"
                  className="h-8 text-xs"
                  value={filters.dateTo}
                  onChange={(e) => setFilter("dateTo", e.target.value)}
                />
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[
                  { label: "Today", days: 0 },
                  { label: "7 days", days: 7 },
                  { label: "30 days", days: 30 },
                  { label: "90 days", days: 90 },
                ].map(({ label, days }) => (
                  <button
                    key={label}
                    className="px-2 py-1 text-[11px] rounded-md bg-slate-100 hover:bg-teal-100 hover:text-teal-700 text-slate-600 transition-colors"
                    onClick={() => {
                      const to = new Date();
                      const from = new Date();
                      from.setDate(from.getDate() - days);
                      setFilter("dateFrom", from.toISOString().split("T")[0]);
                      setFilter("dateTo", to.toISOString().split("T")[0]);
                    }}
                  >
                    {label}
                  </button>
                ))}
                <button
                  className="px-2 py-1 text-[11px] rounded-md bg-slate-100 hover:bg-red-100 hover:text-red-600 text-slate-600 transition-colors"
                  onClick={() => { setFilter("dateFrom", ""); setFilter("dateTo", ""); }}
                >
                  Clear
                </button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Sort */}
        <Select
          value={`${filters.sortBy}:${filters.sortOrder}`}
          onValueChange={(v) => {
            const [by, order] = v.split(":") as any;
            setFilter("sortBy", by);
            setFilter("sortOrder", order);
          }}
        >
          <SelectTrigger className="h-8 text-xs border-slate-200 bg-slate-50 w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt:desc">Newest First</SelectItem>
            <SelectItem value="createdAt:asc">Oldest First</SelectItem>
            <SelectItem value="subtotal:desc">Highest Value</SelectItem>
            <SelectItem value="subtotal:asc">Lowest Value</SelectItem>
          </SelectContent>
        </Select>

        {/* Per page */}
        <Select
          value={String(filters.limit)}
          onValueChange={(v) => setFilter("limit", Number(v) as any)}
        >
          <SelectTrigger className="h-8 text-xs border-slate-200 bg-slate-50 w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[10, 20, 50].map((n) => (
              <SelectItem key={n} value={String(n)}>{n} / page</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}