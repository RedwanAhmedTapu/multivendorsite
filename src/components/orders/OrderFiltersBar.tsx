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
import { useGetVendorsQuery } from "@/features/vendorManageApi";
import type { OrderFilters } from "./useOrderFilters";
import {
  ORDER_STATUS_CONFIG,
  PAYMENT_STATUS_CONFIG,
  FULFILLMENT_STATUS_CONFIG,
} from "./OrderStatusBadge";

interface Props {
  filters: OrderFilters;
  setFilter: <K extends keyof OrderFilters>(key: K, value: OrderFilters[K]) => void;
  resetFilters: () => void;
  activeFilterCount: number;
  isLoading?: boolean;
  onExport?: () => void;
  onRefresh?: () => void;
}

export function OrderFiltersBar({
  filters,
  setFilter,
  resetFilters,
  activeFilterCount,
  isLoading,
  onExport,
  onRefresh,
}: Props) {
  const { data: vendorsData } = useGetVendorsQuery({ limit: 100, status: "ACTIVE" });
  const vendors = vendorsData?.data || [];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
      {/* Top row: search + quick actions */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          <Input
            className="pl-9 h-9 text-sm bg-slate-50 border-slate-200 focus:bg-white"
            placeholder="Search by order #, customer name or phone…"
            value={filters.search ?? ""}
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

        {/* Action buttons */}
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

      {/* Bottom row: filter selects */}
      <div className="flex flex-wrap gap-2">
        {/* Order Status */}
        <Select
          value={filters.status ?? "ALL"}
          onValueChange={(v) =>
            setFilter("status", v === "ALL" ? undefined : (v as OrderFilters["status"]))
          }
        >
          <SelectTrigger className="h-8 text-xs border-slate-200 bg-slate-50 w-36">
            <SelectValue placeholder="Order Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            {Object.entries(ORDER_STATUS_CONFIG).map(([key, cfg]) => (
              <SelectItem key={key} value={key}>
                <span className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
                  {cfg.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Payment Status */}
        <Select
          value={filters.paymentStatus ?? "ALL"}
          onValueChange={(v) =>
            setFilter("paymentStatus", v === "ALL" ? undefined : (v as OrderFilters["paymentStatus"]))
          }
        >
          <SelectTrigger className="h-8 text-xs border-slate-200 bg-slate-50 w-32">
            <SelectValue placeholder="Payment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Payments</SelectItem>
            {Object.entries(PAYMENT_STATUS_CONFIG).map(([key, cfg]) => (
              <SelectItem key={key} value={key}>
                {cfg.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Fulfillment Status */}
        <Select
          value={filters.fulfillmentStatus ?? "ALL"}
          onValueChange={(v) =>
            setFilter(
              "fulfillmentStatus",
              v === "ALL" ? undefined : (v as OrderFilters["fulfillmentStatus"])
            )
          }
        >
          <SelectTrigger className="h-8 text-xs border-slate-200 bg-slate-50 w-36">
            <SelectValue placeholder="Fulfillment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Fulfillment</SelectItem>
            {Object.entries(FULFILLMENT_STATUS_CONFIG).map(([key, cfg]) => (
              <SelectItem key={key} value={key}>
                {cfg.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Vendor filter */}
        <Select
          value={filters.vendorId || "ALL"}
          onValueChange={(v) => setFilter("vendorId", v === "ALL" ? "" : v)}
        >
          <SelectTrigger className="h-8 text-xs border-slate-200 bg-slate-50 w-40">
            <SelectValue placeholder="All Vendors" />
          </SelectTrigger>
          <SelectContent className="max-h-48">
            <SelectItem value="ALL">All Vendors</SelectItem>
            {vendors.map((v) => (
              <SelectItem key={v.id} value={v.id}>
                {v.storeName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Date Range — uses fromDate / toDate per new API */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={`h-8 text-xs border-slate-200 bg-slate-50 gap-1.5 ${
                filters.fromDate || filters.toDate
                  ? "border-teal-300 bg-teal-50 text-teal-700"
                  : ""
              }`}
            >
              <CalendarRange className="w-3.5 h-3.5" />
              {filters.fromDate || filters.toDate
                ? `${filters.fromDate || "…"} → ${filters.toDate || "…"}`
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
                  value={filters.fromDate ?? ""}
                  onChange={(e) => setFilter("fromDate", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-500">To</Label>
                <Input
                  type="date"
                  className="h-8 text-xs"
                  value={filters.toDate ?? ""}
                  onChange={(e) => setFilter("toDate", e.target.value)}
                />
              </div>
              {/* Quick presets */}
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
                      setFilter("fromDate", from.toISOString().split("T")[0]);
                      setFilter("toDate", to.toISOString().split("T")[0]);
                    }}
                  >
                    {label}
                  </button>
                ))}
                <button
                  className="px-2 py-1 text-[11px] rounded-md bg-slate-100 hover:bg-red-100 hover:text-red-600 text-slate-600 transition-colors"
                  onClick={() => {
                    setFilter("fromDate", "");
                    setFilter("toDate", "");
                  }}
                >
                  Clear
                </button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Sort (UI-only — not sent to API but controls client-side display preference) */}
        <Select
          value={`${filters.sortBy}:${filters.sortOrder}`}
          onValueChange={(v) => {
            const [by, order] = v.split(":") as [OrderFilters["sortBy"], OrderFilters["sortOrder"]];
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
            <SelectItem value="totalAmount:desc">Highest Amount</SelectItem>
            <SelectItem value="totalAmount:asc">Lowest Amount</SelectItem>
          </SelectContent>
        </Select>

        {/* Per page */}
        <Select
          value={String(filters.limit)}
          onValueChange={(v) => setFilter("limit", Number(v) as OrderFilters["limit"])}
        >
          <SelectTrigger className="h-8 text-xs border-slate-200 bg-slate-50 w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[10, 20, 50, 100].map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n} / page
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}