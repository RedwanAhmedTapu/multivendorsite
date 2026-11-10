"use client";

// Vendor order list — a table from `md` up, cards on phones. Rows come from
// GET /api/vendor-orders (scoped to the signed-in store by the backend).
// The only inline actions are the two plain status steps the endpoint accepts
// (CONFIRMED → PROCESSING → PACKAGING); everything else opens the drawer, which
// follows the backend's per-order `vendorActions`, or is explained in text.

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
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Truck,
  Package,
  AlertCircle,
  ShoppingBag,
  Loader2,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import {
  OrderStatusBadge,
  PaymentStatusBadge,
  FulfillmentStatusBadge,
  CourierStatusBadge,
} from "@/components/orders/OrderStatusBadge";
import { useUpdateVendorOrderStatusMutation, type Pagination, type VendorOrder } from "@/features/vendorOrderApi";
import { formatTaka, rowNextAction, vendorActionError } from "@/lib/orders/vendor-order-actions";
import type { VendorOrderUiFilters } from "./useVendorOrderFilters";

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

const orderRef = (o: VendorOrder) => `#${o.order.orderNumber || o.orderId.slice(-8).toUpperCase()}`;
const customerName = (o: VendorOrder) => o.order.user?.name || o.order.address?.receiverFullName || "Guest";
const latestCourier = (o: VendorOrder) => o.courierOrders?.[0] ?? o.courierOrder;

// ── Next action ──────────────────────────────────────────────────────────────

function NextAction({ order, onOpen, block = false }: { order: VendorOrder; onOpen: () => void; block?: boolean }) {
  const [update, { isLoading }] = useUpdateVendorOrderStatusMutation();
  const action = rowNextAction(order);
  if (!action) return <span className="text-xs text-slate-400">—</span>;
  if (action.kind === "info") return <span className="text-xs font-medium text-slate-500">{action.text}</span>;

  const size = block ? "h-11 w-full text-sm" : "h-8 text-xs";
  if (action.kind === "open") {
    return (
      <Button
        type="button"
        variant="outline"
        onClick={(e) => {
          e.stopPropagation();
          onOpen();
        }}
        className={`${size} gap-1.5 border-sky-200 text-sky-700 hover:bg-sky-50`}
      >
        <Truck className="size-3.5" aria-hidden />
        {action.label}
      </Button>
    );
  }
  return (
    <Button
      type="button"
      variant="outline"
      disabled={isLoading}
      onClick={async (e) => {
        e.stopPropagation();
        try {
          await update({ vendorOrderId: order.id, status: action.to }).unwrap();
          toast.success(action.to === "PROCESSING" ? "Order marked as processing" : "Order marked as packed");
        } catch (err) {
          toast.error(vendorActionError(err, "Couldn't update the order status."));
        }
      }}
      className={`${size} gap-1.5 border-teal-200 text-teal-700 hover:bg-teal-50`}
    >
      {isLoading ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <ArrowRight className="size-3.5" aria-hidden />}
      {action.label}
    </Button>
  );
}

function ItemThumbs({ order }: { order: VendorOrder }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex -space-x-1">
        {order.items.slice(0, 3).map((item) => {
          const src = item.variant.product.images?.[0]?.url ?? item.variant.images?.[0]?.url;
          return (
            <div key={item.id} className="flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-lg border-2 border-white bg-slate-100">
              {src ? <img src={src} alt="" className="size-full object-cover" /> : <Package className="size-3 text-slate-300" aria-hidden />}
            </div>
          );
        })}
      </div>
      <span className="text-xs text-slate-500">
        {order.items.length} item{order.items.length === 1 ? "" : "s"}
      </span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  orders: VendorOrder[];
  pagination: Pagination | undefined;
  isLoading: boolean;
  isError: boolean;
  filters: VendorOrderUiFilters;
  setFilter: <K extends keyof VendorOrderUiFilters>(key: K, value: VendorOrderUiFilters[K]) => void;
  onViewOrder: (order: VendorOrder) => void;
  onRetry?: () => void;
}

export function VendorOrdersTable({ orders, pagination, isLoading, isError, filters, setFilter, onViewOrder, onRetry }: Props) {
  const totalPages = Math.max(1, pagination?.totalPages ?? 1);
  const currentPage = pagination?.page ?? 1;

  const state = isLoading ? (
    <div className="space-y-3 p-4" role="status" aria-busy="true" aria-label="Loading orders">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100" />
      ))}
    </div>
  ) : isError ? (
    <div role="alert" className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <AlertCircle className="size-8 text-red-400" aria-hidden />
      <p className="text-sm font-medium text-slate-700">Couldn&apos;t load your orders.</p>
      {onRetry ? (
        <Button type="button" variant="outline" onClick={onRetry} className="h-11 gap-2 sm:h-9">
          <RefreshCw className="size-4" aria-hidden />
          Try again
        </Button>
      ) : null}
    </div>
  ) : orders.length === 0 ? (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center text-slate-400">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-slate-50 ring-1 ring-slate-100">
        <ShoppingBag className="size-5 text-slate-400" aria-hidden />
      </span>
      <p className="mt-1 text-sm font-semibold text-slate-700">No orders found</p>
      <p className="text-xs">Orders from customers will appear here.</p>
      {onRetry ? (
        <Button type="button" variant="outline" onClick={onRetry} className="mt-2 h-9 gap-2">
          <RefreshCw className="size-4" aria-hidden />
          Refresh
        </Button>
      ) : null}
    </div>
  ) : null;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      {state ?? (
        <>
          {/* Phones / small tablets: cards */}
          <ul className="divide-y divide-slate-100 md:hidden">
            {orders.map((order) => {
              const courier = latestCourier(order);
              return (
                <li key={order.id} className="space-y-3 p-4">
                  <button
                    type="button"
                    onClick={() => onViewOrder(order)}
                    className="flex w-full flex-col gap-2 rounded-xl text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600/40 active:bg-slate-50/70"
                    aria-label={`Open order ${orderRef(order)}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="break-all font-mono text-sm font-bold text-slate-800">{orderRef(order)}</p>
                        <p className="mt-0.5 truncate text-xs text-slate-500">
                          {customerName(order)} · {fmtDate(order.createdAt)}
                        </p>
                      </div>
                      <p className="shrink-0 font-mono text-sm font-bold text-slate-900">{formatTaka(order.subtotal)}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <OrderStatusBadge status={order.status} />
                      <PaymentStatusBadge status={order.order.paymentStatus} />
                      {courier ? <CourierStatusBadge status={courier.status} /> : null}
                    </div>
                    <ItemThumbs order={order} />
                  </button>
                  <NextAction order={order} onOpen={() => onViewOrder(order)} block />
                </li>
              );
            })}
          </ul>

          {/* md and up: table */}
          <div className="hidden overflow-x-auto md:block">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-100 bg-slate-50/80 hover:bg-slate-50">
                  {["Order", "Customer", "Items", "Value", "Status", "Payment", "Fulfillment", "Courier", "Next action", "Date"].map((h, i) => (
                    <TableHead key={h} className={`text-[11px] font-semibold uppercase tracking-wide text-slate-500 ${i === 0 ? "pl-5" : ""}`}>
                      {h}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => {
                  const courier = latestCourier(order);
                  return (
                    <TableRow key={order.id} className="group cursor-pointer transition-colors hover:bg-slate-50/80" onClick={() => onViewOrder(order)}>
                      <TableCell className="pl-5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewOrder(order);
                          }}
                          className="rounded font-mono text-sm font-bold text-slate-800 hover:text-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600/40"
                        >
                          {orderRef(order)}
                        </button>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-medium text-slate-700">{customerName(order)}</p>
                        <p className="max-w-[140px] truncate text-[11px] text-slate-400">{order.order.address?.phone || order.order.user?.phone}</p>
                      </TableCell>
                      <TableCell>
                        <ItemThumbs order={order} />
                      </TableCell>
                      <TableCell>
                        <p className="font-mono text-sm font-bold tabular-nums text-slate-900">{formatTaka(order.subtotal)}</p>
                        {Number(order.shippingCost) > 0 ? <p className="text-[11px] text-slate-400">+{formatTaka(order.shippingCost)} shipping</p> : null}
                      </TableCell>
                      <TableCell>
                        <OrderStatusBadge status={order.status} />
                      </TableCell>
                      <TableCell>
                        <PaymentStatusBadge status={order.order.paymentStatus} />
                      </TableCell>
                      <TableCell>
                        <FulfillmentStatusBadge status={order.fulfillmentStatus} />
                      </TableCell>
                      <TableCell>
                        {courier ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1 text-[11px] text-slate-500">
                              <Truck className="size-3" aria-hidden />
                              <span className="max-w-[90px] truncate">{courier.courier_providers?.displayName || courier.courier_providers?.name || "Courier"}</span>
                            </div>
                            <CourierStatusBadge status={courier.status} />
                          </div>
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <NextAction order={order} onOpen={() => onViewOrder(order)} />
                      </TableCell>
                      <TableCell>
                        <p className="whitespace-nowrap text-xs text-slate-600">{fmtDate(order.createdAt)}</p>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {pagination && pagination.total > 0 ? (
        <nav aria-label="Pagination" className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <p className="text-xs text-slate-500">
            Showing{" "}
            <span className="font-semibold text-slate-700">
              {(currentPage - 1) * filters.limit + 1}–{Math.min(currentPage * filters.limit, pagination.total)}
            </span>{" "}
            of <span className="font-semibold text-slate-700">{pagination.total.toLocaleString()}</span> orders
          </p>
          <div className="flex items-center justify-between gap-1 sm:justify-end">
            <Button variant="outline" size="sm" className="hidden size-8 p-0 sm:inline-flex" aria-label="First page" disabled={currentPage <= 1} onClick={() => setFilter("page", 1)}>
              <ChevronsLeft className="size-3.5" aria-hidden />
            </Button>
            <Button variant="outline" size="sm" className="h-11 gap-1 px-3 sm:size-8 sm:p-0" aria-label="Previous page" disabled={currentPage <= 1} onClick={() => setFilter("page", currentPage - 1)}>
              <ChevronLeft className="size-3.5" aria-hidden />
              <span className="sm:sr-only">Previous</span>
            </Button>
            <span className="px-2 text-xs text-slate-600 sm:hidden">
              Page {currentPage} of {totalPages}
            </span>
            <div className="mx-1 hidden items-center gap-1 sm:flex">
              {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                let page: number;
                if (totalPages <= 5 || currentPage <= 3) page = i + 1;
                else if (currentPage >= totalPages - 2) page = totalPages - 4 + i;
                else page = currentPage - 2 + i;
                return (
                  <Button
                    key={page}
                    variant={page === currentPage ? "default" : "outline"}
                    size="sm"
                    aria-current={page === currentPage ? "page" : undefined}
                    className={`size-8 p-0 text-xs tabular-nums ${page === currentPage ? "border-teal-600 bg-teal-600 text-white hover:bg-teal-700" : ""}`}
                    onClick={() => setFilter("page", page)}
                  >
                    {page}
                  </Button>
                );
              })}
            </div>
            <Button variant="outline" size="sm" className="h-11 gap-1 px-3 sm:size-8 sm:p-0" aria-label="Next page" disabled={currentPage >= totalPages} onClick={() => setFilter("page", currentPage + 1)}>
              <span className="sm:sr-only">Next</span>
              <ChevronRight className="size-3.5" aria-hidden />
            </Button>
            <Button variant="outline" size="sm" className="hidden size-8 p-0 sm:inline-flex" aria-label="Last page" disabled={currentPage >= totalPages} onClick={() => setFilter("page", totalPages)}>
              <ChevronsRight className="size-3.5" aria-hidden />
            </Button>
          </div>
        </nav>
      ) : null}
    </div>
  );
}
