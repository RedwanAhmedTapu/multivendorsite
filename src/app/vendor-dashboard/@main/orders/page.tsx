"use client";

import { useState, useCallback } from "react";
import { ShoppingBag, AlertCircle } from "lucide-react";
import { toast } from "sonner";

import { useGetVendorOrdersQuery } from "@/features/vendorOrderApi";
import { useVendorOrderFilters } from "./components/useVendorOrderFilters";
import { VendorOrderStatsBar } from "./components/VendorOrderStatsBar";
import { VendorOrderFiltersBar } from "./components/VendorOrderFiltersBar";
import { VendorOrdersTable } from "./components/VendorOrdersTable";
import { VendorOrderDetailDrawer } from "./components/VendorOrderDetailDrawer";
import type { VendorOrderRow } from "@/types/vendorOrderTypes";

export default function VendorOrdersPage() {
  const {
    filters,
    setFilter,
    resetFilters,
    activeFilterCount,
    queryString,
  } = useVendorOrderFilters();

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const {
    data,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useGetVendorOrdersQuery(queryString);

  const orders = data?.data || [];
  const pagination = data?.pagination;

  const handleViewOrder = useCallback((order: VendorOrderRow) => {
    setSelectedOrderId(order.id);
  }, []);

  const handleRefresh = () => {
    refetch();
    toast.success("Orders refreshed");
  };

  const newOrderCount = orders.filter((o) => o.status === "CONFIRMED").length;

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      <div className="container mx-auto px-4 sm:px-6 py-8 max-w-[1400px] space-y-6">

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-teal-700 text-white shadow-lg shadow-teal-700/20">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h1
                className="text-2xl font-black tracking-tight text-slate-900"
                style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
              >
                My Orders
              </h1>
              <p className="text-xs text-slate-500 -mt-0.5">
                Manage and fulfill your store orders
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {newOrderCount > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                <p className="text-xs text-amber-700 font-semibold">
                  {newOrderCount} new order{newOrderCount > 1 ? "s" : ""} need{newOrderCount === 1 ? "s" : ""} action
                </p>
              </div>
            )}

            {pagination && (
              <div className="px-3 py-1.5 bg-white rounded-xl border border-slate-200 shadow-sm">
                <p className="text-xs text-slate-500">
                  <span className="font-bold text-slate-900 text-sm font-mono">
                    {pagination.total.toLocaleString()}
                  </span>{" "}
                  total
                  {activeFilterCount > 0 && (
                    <span className="ml-1 text-teal-600 font-medium">
                      · {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""}
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Stats ──────────────────────────────────────────────────── */}
        <VendorOrderStatsBar />

        {/* ── Filters ────────────────────────────────────────────────── */}
        <VendorOrderFiltersBar
          filters={filters}
          setFilter={setFilter}
          resetFilters={resetFilters}
          activeFilterCount={activeFilterCount}
          isLoading={isLoading || isFetching}
          onRefresh={handleRefresh}
        />

        {/* Updating indicator */}
        {isFetching && !isLoading && (
          <div className="flex items-center gap-2 text-xs text-slate-500 -mt-3">
            <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
            Updating…
          </div>
        )}

        {/* ── Table ──────────────────────────────────────────────────── */}
        <VendorOrdersTable
          orders={orders}
          pagination={pagination}
          isLoading={isLoading}
          isError={isError}
          filters={filters}
          setFilter={setFilter}
          onViewOrder={handleViewOrder}
        />

        {/* ── Detail Drawer ───────────────────────────────────────────── */}
        <VendorOrderDetailDrawer
          vendorOrderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
        />
      </div>
    </div>
  );
}