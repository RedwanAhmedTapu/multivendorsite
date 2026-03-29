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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  Truck,
  Package,
  AlertCircle,
  ShoppingBag,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import {
  OrderStatusBadge,
  PaymentStatusBadge,
  FulfillmentStatusBadge,
  CourierStatusBadge,
} from "@/components/orders/OrderStatusBadge";
import { useUpdateVendorOrderStatusMutation } from "@/features/vendorOrderApi";
import type {
  VendorOrderRow,
  VendorOrderFilters,
  VendorOrdersPagination,
  VendorUpdatableStatus,
} from "@/types/vendorOrderTypes";

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Intl.DateTimeFormat("en-BD", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(iso));
}

function fmtCurrency(n: number) {
  return `৳${n.toLocaleString("en-BD", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

// Next action the vendor should take — shown as a prominent CTA
function nextAction(status: string): { label: string; next: VendorUpdatableStatus } | null {
  const map: Record<string, { label: string; next: VendorUpdatableStatus }> = {
    CONFIRMED:  { label: "Start Processing", next: "PROCESSING" },
    PROCESSING: { label: "Mark Packaging",   next: "PACKAGING"  },
    PACKAGING:  { label: "Mark Shipped",     next: "SHIPPED"    },
  };
  return map[status] ?? null;
}

// ── Status action cell ────────────────────────────────────────────────────────

function StatusActionCell({ order, onUpdated }: { order: VendorOrderRow; onUpdated: () => void }) {
  const [update, { isLoading }] = useUpdateVendorOrderStatusMutation();
  const action = nextAction(order.status);

  if (!action) return <span className="text-xs text-slate-400">—</span>;

  const handle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await update({ vendorOrderId: order.id, status: action.next }).unwrap();
      toast.success(`Order marked as ${action.next.toLowerCase()}`);
      onUpdated();
    } catch {
      toast.error("Failed to update status");
    }
  };

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handle}
      disabled={isLoading}
      className="h-7 text-[11px] gap-1 border-teal-200 text-teal-700 hover:bg-teal-50 hover:border-teal-400 transition-colors"
    >
      {isLoading ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : (
        <ArrowRight className="w-3 h-3" />
      )}
      {action.label}
    </Button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  orders: VendorOrderRow[];
  pagination: VendorOrdersPagination | undefined;
  isLoading: boolean;
  isError: boolean;
  filters: VendorOrderFilters;
  setFilter: <K extends keyof VendorOrderFilters>(key: K, value: VendorOrderFilters[K]) => void;
  onViewOrder: (order: VendorOrderRow) => void;
}

export function VendorOrdersTable({
  orders,
  pagination,
  isLoading,
  isError,
  filters,
  setFilter,
  onViewOrder,
}: Props) {
  const totalPages = pagination?.pages ?? 1;
  const currentPage = pagination?.page ?? 1;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80 hover:bg-slate-50 border-b border-slate-100">
              <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide pl-5">Order</TableHead>
              <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Customer</TableHead>
              <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Items</TableHead>
              <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Value</TableHead>
              <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Status</TableHead>
              <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Payment</TableHead>
              <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Fulfillment</TableHead>
              <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Courier</TableHead>
              <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Next Action</TableHead>
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
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
                    <ShoppingBag className="w-10 h-10 opacity-20" />
                    <p className="text-sm font-medium">No orders yet</p>
                    <p className="text-xs">Orders from customers will appear here</p>
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
                  {/* Order number */}
                  <TableCell className="pl-5">
                    <div>
                      <p className="text-sm font-bold text-slate-800 font-mono">
                        #{order.order.orderNumber || order.orderId.slice(-8).toUpperCase()}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                        {order.id.slice(-6).toUpperCase()}
                      </p>
                    </div>
                  </TableCell>

                  {/* Customer */}
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium text-slate-700">
                        {order.order.user?.name || order.order.address?.receiverFullName || "Guest"}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate max-w-[120px]">
                        {order.order.address?.phone || order.order.user?.phone || order.order.user?.email}
                      </p>
                    </div>
                  </TableCell>

                  {/* Items */}
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <div className="flex -space-x-1">
                        {order.items.slice(0, 3).map((item) => (
                          <div
                            key={item.id}
                            className="w-7 h-7 rounded-lg bg-slate-100 border-2 border-white overflow-hidden flex-shrink-0 flex items-center justify-center"
                          >
                            {item.variant.product.images?.[0]?.url ? (
                              <img
                                src={item.variant.product.images[0].url}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Package className="w-3 h-3 text-slate-300" />
                            )}
                          </div>
                        ))}
                      </div>
                      <span className="text-xs text-slate-500">
                        {order.items.length} item{order.items.length > 1 ? "s" : ""}
                      </span>
                    </div>
                  </TableCell>

                  {/* Value */}
                  <TableCell>
                    <p className="text-sm font-bold text-slate-900 font-mono">
                      {fmtCurrency(order.subtotal)}
                    </p>
                    {order.shippingCost > 0 && (
                      <p className="text-[10px] text-slate-400">
                        +{fmtCurrency(order.shippingCost)} ship
                      </p>
                    )}
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <OrderStatusBadge status={order.status} />
                  </TableCell>

                  {/* Payment */}
                  <TableCell>
                    <PaymentStatusBadge status={order.order.paymentStatus} />
                  </TableCell>

                  {/* Fulfillment */}
                  <TableCell>
                    <FulfillmentStatusBadge status={order.fulfillmentStatus} />
                  </TableCell>

                  {/* Courier */}
                  <TableCell>
                    {order.courierOrder ? (
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1 text-[10px] text-slate-500">
                          <Truck className="w-3 h-3" />
                          <span className="truncate max-w-[80px]">
                            {order.courierOrder.courier_providers?.displayName ||
                              order.courierOrder.courier_providers?.name ||
                              "Courier"}
                          </span>
                        </div>
                        <CourierStatusBadge status={order.courierOrder.status} />
                      </div>
                    ) : (
                      <span className="text-slate-300 text-xs">—</span>
                    )}
                  </TableCell>

                  {/* Next Action CTA */}
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <StatusActionCell
                      order={order}
                      onUpdated={() => {}}
                    />
                  </TableCell>

                  {/* Date */}
                  <TableCell>
                    <p className="text-xs text-slate-600 whitespace-nowrap">
                      {fmtDate(order.createdAt)}
                    </p>
                  </TableCell>

                  {/* View */}
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
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/50">
          <p className="text-xs text-slate-500">
            Showing{" "}
            <span className="font-semibold text-slate-700">
              {(currentPage - 1) * filters.limit + 1}–
              {Math.min(currentPage * filters.limit, pagination.total)}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-slate-700">{pagination.total.toLocaleString()}</span>{" "}
            orders
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline" size="sm" className="h-7 w-7 p-0"
              disabled={currentPage <= 1}
              onClick={() => setFilter("page", 1)}
            >
              <ChevronsLeft className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="outline" size="sm" className="h-7 w-7 p-0"
              disabled={currentPage <= 1}
              onClick={() => setFilter("page", currentPage - 1)}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            <div className="flex items-center gap-1 mx-1">
              {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                let page: number;
                if (totalPages <= 5) page = i + 1;
                else if (currentPage <= 3) page = i + 1;
                else if (currentPage >= totalPages - 2) page = totalPages - 4 + i;
                else page = currentPage - 2 + i;
                return (
                  <Button
                    key={page}
                    variant={page === currentPage ? "default" : "outline"}
                    size="sm"
                    className={`h-7 w-7 p-0 text-xs ${
                      page === currentPage
                        ? "bg-teal-600 text-white border-teal-600 hover:bg-teal-700"
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
              variant="outline" size="sm" className="h-7 w-7 p-0"
              disabled={currentPage >= totalPages}
              onClick={() => setFilter("page", currentPage + 1)}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="outline" size="sm" className="h-7 w-7 p-0"
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