"use client";

import { useState, useCallback } from "react";
import { ShoppingBag } from "lucide-react";
import { toast } from "sonner";

import {
  useGetAllAdminOrdersQuery,
  type AdminOrder,
} from "@/features/adminOrderApi";
import { useOrderFilters } from "@/components/orders/useOrderFilters";
import { OrderStatsBar } from "@/components/orders/OrderStatsBar";
import { OrderFiltersBar } from "@/components/orders/OrderFiltersBar";
import { OrdersTable } from "@/components/orders/OrdersTable";
import { OrderDetailDrawer } from "@/components/orders/OrderDetailDrawer";

export default function AdminOrdersPage() {
  const { filters, setFilter, resetFilters, activeFilterCount, queryParams } = useOrderFilters();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // ── Data fetching ─────────────────────────────────────────────────────────
  const {
    data,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useGetAllAdminOrdersQuery(queryParams);

  const orders = data?.data || [];
  const pagination = data?.pagination;

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleViewOrder = useCallback((order: AdminOrder) => {
    setSelectedOrderId(order.id);
  }, []);

  const handleRefresh = () => {
    refetch();
    toast.success("Orders refreshed");
  };

  // Export is not part of adminOrderApi — stub handler left for future wiring
  const handleExport = () => {
    toast.info("Export feature coming soon");
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      {/* Background texture */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative container mx-auto px-4 sm:px-6 py-8 max-w-[1400px] space-y-6">

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-900/20">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h1
                className="text-2xl font-black tracking-tight text-slate-900"
                style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
              >
                Orders
              </h1>
              <p className="text-xs text-slate-500 -mt-0.5">Multivendor order management</p>
            </div>
          </div>

          {pagination && (
            <div className="px-3 py-1.5 bg-white rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs text-slate-500">
                <span className="font-bold text-slate-900 text-sm font-mono">
                  {pagination.total.toLocaleString()}
                </span>{" "}
                total orders
                {activeFilterCount > 0 && (
                  <span className="ml-1 text-teal-600 font-medium">
                    · {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""} active
                  </span>
                )}
              </p>
            </div>
          )}
        </div>

        {/* Stats Bar — no date props needed; uses platform-wide statistics endpoint */}
        <OrderStatsBar />

        {/* Filters */}
        <OrderFiltersBar
          filters={filters}
          setFilter={setFilter}
          resetFilters={resetFilters}
          activeFilterCount={activeFilterCount}
          isLoading={isLoading || isFetching}
          onExport={handleExport}
          onRefresh={handleRefresh}
        />

        {/* Refetch indicator */}
        {isFetching && !isLoading && (
          <div className="flex items-center gap-2 text-xs text-slate-500 -mt-3">
            <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
            Updating…
          </div>
        )}

        {/* Orders Table */}
        <OrdersTable
          orders={orders}
          pagination={pagination}
          isLoading={isLoading}
          isError={isError}
          filters={filters}
          setFilter={setFilter}
          onViewOrder={handleViewOrder}
        />

        {/* Order Detail Drawer */}
        <OrderDetailDrawer
          orderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
        />
      </div>
    </div>
  );
}