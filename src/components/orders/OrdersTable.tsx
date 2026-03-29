"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  Store,
  Truck,
  Package,
  AlertCircle,
  ShoppingBag,
} from "lucide-react";
import type { AdminOrder, Pagination } from "@/features/adminOrderApi";
import type { OrderFilters } from "./useOrderFilters";
import {
  OrderStatusBadge,
  PaymentStatusBadge,
  FulfillmentStatusBadge,
  CourierStatusBadge,
} from "./OrderStatusBadge";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-BD", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(iso));
}

function formatCurrency(amount: number) {
  return `৳${amount.toLocaleString("en-BD", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function VendorPills({ vendorOrders }: { vendorOrders: AdminOrder["vendorOrders"] }) {
  const unique = vendorOrders.slice(0, 2);
  const rest = vendorOrders.length - 2;
  return (
    <div className="flex flex-wrap gap-1">
      {unique.map((vo) => (
        <span
          key={vo.id}
          className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium"
        >
          <Store className="w-2.5 h-2.5" />
          {vo.vendor.storeName}
        </span>
      ))}
      {rest > 0 && <span className="text-[10px] text-slate-400">+{rest}</span>}
    </div>
  );
}

function CourierPill({ vendorOrders }: { vendorOrders: AdminOrder["vendorOrders"] }) {
  const withCourier = vendorOrders.find((vo) => vo.courierOrder);
  if (!withCourier?.courierOrder) return <span className="text-slate-300 text-xs">—</span>;
  const co = withCourier.courierOrder;
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1 text-[10px] text-slate-500">
        <Truck className="w-3 h-3" />
        Courier
      </div>
      <CourierStatusBadge status={co.status} />
    </div>
  );
}

// ── Main Table ────────────────────────────────────────────────────────────────

interface Props {
  orders: AdminOrder[];
  pagination: Pagination | undefined;
  isLoading: boolean;
  isError: boolean;
  filters: OrderFilters;
  setFilter: <K extends keyof OrderFilters>(key: K, value: OrderFilters[K]) => void;
  onViewOrder: (order: AdminOrder) => void;
}

export function OrdersTable({
  orders,
  pagination,
  isLoading,
  isError,
  filters,
  setFilter,
  onViewOrder,
}: Props) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleAll = () => {
    setSelectedIds(
      selectedIds.size === orders.length ? new Set() : new Set(orders.map((o) => o.id))
    );
  };

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const totalPages = pagination?.totalPages ?? 1;
  const currentPage = pagination?.page ?? 1;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Selection bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-teal-50 border-b border-teal-200 text-sm text-teal-800 font-medium">
          <span>{selectedIds.size} selected</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="h-7 text-xs border-teal-300 text-teal-700">
              Bulk Update Status
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs"
              onClick={() => setSelectedIds(new Set())}
            >
              Deselect All
            </Button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80 hover:bg-slate-50 border-b border-slate-100">
              <TableHead className="w-10 pl-4">
                <Checkbox
                  checked={orders.length > 0 && selectedIds.size === orders.length}
                  onCheckedChange={toggleAll}
                />
              </TableHead>
              <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Order</TableHead>
              <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Customer</TableHead>
              <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Amount</TableHead>
              <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Status</TableHead>
              <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Payment</TableHead>
              <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Fulfillment</TableHead>
              <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Vendors</TableHead>
              <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Courier</TableHead>
              <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Date</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i} className="animate-pulse">
                  {Array.from({ length: 11 }).map((_, j) => (
                    <TableCell key={j}>
                      <div className="h-4 bg-slate-100 rounded w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={11}>
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
                    <AlertCircle className="w-8 h-8 opacity-40" />
                    <p className="text-sm">Failed to load orders. Please try again.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11}>
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
                    <ShoppingBag className="w-10 h-10 opacity-20" />
                    <p className="text-sm font-medium">No orders found</p>
                    <p className="text-xs">Try adjusting your filters</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow
                  key={order.id}
                  className="hover:bg-slate-50/60 transition-colors cursor-pointer group"
                  onClick={() => onViewOrder(order)}
                >
                  {/* Checkbox */}
                  <TableCell className="pl-4" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedIds.has(order.id)}
                      onCheckedChange={() => toggleOne(order.id)}
                    />
                  </TableCell>

                  {/* Order number */}
                  <TableCell>
                    <div>
                      <p className="text-sm font-bold text-slate-800 font-mono">
                        #{order.orderNumber || order.id.slice(-8).toUpperCase()}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {order.vendorOrders.reduce((acc, vo) => acc + vo.items.length, 0)} items
                        {" · "}
                        {order.vendorOrders.length} vendor
                        {order.vendorOrders.length > 1 ? "s" : ""}
                      </p>
                    </div>
                  </TableCell>

                  {/* Customer */}
                  <TableCell>
                    {order.user ? (
                      <div>
                        <p className="text-sm font-medium text-slate-700">
                          {order.user.name || "Guest"}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate max-w-[130px]">
                          {order.user.email || order.user.phone || order.address?.phone}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm text-slate-600">
                          {order.address?.receiverFullName || "Guest"}
                        </p>
                        <p className="text-[10px] text-slate-400">{order.address?.phone}</p>
                      </div>
                    )}
                  </TableCell>

                  {/* Amount */}
                  <TableCell>
                    <p className="text-sm font-bold text-slate-900 font-mono">
                      {formatCurrency(order.totalAmount)}
                    </p>
                    {(order.discountAmount ?? 0) > 0 && (
                      <p className="text-[10px] text-emerald-600">
                        -{formatCurrency(order.discountAmount!)} off
                      </p>
                    )}
                  </TableCell>

                  {/* Order Status */}
                  <TableCell>
                    <OrderStatusBadge status={order.status} />
                  </TableCell>

                  {/* Payment Status */}
                  <TableCell>
                    <PaymentStatusBadge status={order.paymentStatus} />
                    {order.payments?.[0]?.method && (
                      <p className="text-[10px] text-slate-400 mt-0.5 capitalize">
                        {order.payments[0].method.toLowerCase()}
                      </p>
                    )}
                  </TableCell>

                  {/* Fulfillment */}
                  <TableCell>
                    <FulfillmentStatusBadge status={order.fulfillmentStatus} />
                  </TableCell>

                  {/* Vendors */}
                  <TableCell>
                    <VendorPills vendorOrders={order.vendorOrders} />
                  </TableCell>

                  {/* Courier */}
                  <TableCell>
                    <CourierPill vendorOrders={order.vendorOrders} />
                  </TableCell>

                  {/* Date */}
                  <TableCell>
                    <p className="text-xs text-slate-600 whitespace-nowrap">
                      {formatDate(order.createdAt)}
                    </p>
                  </TableCell>

                  {/* View button */}
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => onViewOrder(order)}
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/50">
          <p className="text-xs text-slate-500">
            Showing{" "}
            <span className="font-semibold text-slate-700">
              {(currentPage - 1) * filters.limit + 1}–
              {Math.min(currentPage * filters.limit, pagination.total)}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-slate-700">
              {pagination.total.toLocaleString()}
            </span>{" "}
            orders
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              disabled={currentPage <= 1}
              onClick={() => setFilter("page", 1)}
            >
              <ChevronsLeft className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              disabled={currentPage <= 1}
              onClick={() => setFilter("page", currentPage - 1)}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            <div className="flex items-center gap-1 mx-1">
              {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                let page: number;
                if (totalPages <= 5) {
                  page = i + 1;
                } else if (currentPage <= 3) {
                  page = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  page = totalPages - 4 + i;
                } else {
                  page = currentPage - 2 + i;
                }
                return (
                  <Button
                    key={page}
                    variant={page === currentPage ? "default" : "outline"}
                    size="sm"
                    className={`h-7 w-7 p-0 text-xs ${
                      page === currentPage
                        ? "bg-slate-900 text-white border-slate-900 hover:bg-slate-800"
                        : ""
                    }`}
                    onClick={() => setFilter("page", page)}
                  >
                    {page}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              disabled={currentPage >= totalPages}
              onClick={() => setFilter("page", currentPage + 1)}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              disabled={currentPage >= totalPages}
              onClick={() => setFilter("page", totalPages)}
            >
              <ChevronsRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}