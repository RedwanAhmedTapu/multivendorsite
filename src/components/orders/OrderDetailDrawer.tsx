"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MapPin,
  Store,
  Package,
  Truck,
  CreditCard,
  Calendar,
  Loader2,
  Copy,
  Check,
  ClipboardList,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import {
  useGetAdminOrderByIdQuery,
  useUpdateAdminOrderStatusMutation,
  useUpdateAdminVendorOrderStatusMutation,
} from "@/features/adminOrderApi";
import type { OrderStatus } from "@/features/adminOrderApi";
import {
  OrderStatusBadge,
  PaymentStatusBadge,
  FulfillmentStatusBadge,
  CourierStatusBadge,
  ORDER_STATUS_CONFIG,
} from "./OrderStatusBadge";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso?: string | null) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-BD", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

function formatCurrency(n?: number) {
  if (n === undefined) return "—";
  return `৳${n.toLocaleString("en-BD", { minimumFractionDigits: 0 })}`;
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 pb-2">
      <div className="text-slate-400">{icon}</div>
      <h4 className="text-xs font-bold text-slate-600 uppercase tracking-widest">{title}</h4>
    </div>
  );
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const handle = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button onClick={handle} className="text-slate-400 hover:text-slate-700 transition-colors">
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

// ── Main Drawer ───────────────────────────────────────────────────────────────

interface Props {
  orderId: string | null;
  onClose: () => void;
}

export function OrderDetailDrawer({ orderId, onClose }: Props) {
  const { data, isLoading } = useGetAdminOrderByIdQuery(orderId!, { skip: !orderId });
  const order = data?.data;

  const [updateOrderStatus, { isLoading: updatingOrder }] = useUpdateAdminOrderStatusMutation();
  const [updateVendorStatus, { isLoading: updatingVendor }] = useUpdateAdminVendorOrderStatusMutation();

  const handleOrderStatusChange = async (status: OrderStatus) => {
    if (!order) return;
    try {
      await updateOrderStatus({ id: order.id, status }).unwrap();
      toast.success(`Order status updated to ${status}`);
    } catch {
      toast.error("Failed to update order status");
    }
  };

  const handleVendorStatusChange = async (vendorOrderId: string, status: OrderStatus) => {
    if (!order) return;
    try {
      await updateVendorStatus({ id: order.id, vendorOrderId, status }).unwrap();
      toast.success("Vendor order updated");
    } catch {
      toast.error("Failed to update vendor order");
    }
  };

  return (
    <Sheet open={!!orderId} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl flex flex-col gap-0 p-0 overflow-hidden"
      >
        {/* Header */}
        <SheetHeader className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-900 to-slate-800 flex-shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <SheetTitle className="text-white font-bold text-lg font-mono">
                #{order?.orderNumber || (orderId?.slice(-8).toUpperCase() ?? "—")}
              </SheetTitle>
              <p className="text-slate-400 text-xs mt-0.5">
                {order ? formatDate(order.createdAt) : "Loading…"}
              </p>
            </div>
            {order && (
              <div className="flex flex-col items-end gap-1.5">
                <OrderStatusBadge status={order.status} size="md" />
                <div className="flex gap-1">
                  <PaymentStatusBadge status={order.paymentStatus} size="sm" />
                  <FulfillmentStatusBadge status={order.fulfillmentStatus} size="sm" />
                </div>
              </div>
            )}
          </div>
        </SheetHeader>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-20 text-slate-400 gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Loading order details…
            </div>
          ) : !order ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
              <AlertTriangle className="w-8 h-8 opacity-40" />
              <p className="text-sm">Order not found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">

              {/* ── Status Control ─────────────────────────────────────── */}
              <section className="px-6 py-5">
                <SectionTitle
                  icon={<ClipboardList className="w-4 h-4" />}
                  title="Order Status Control"
                />
                <div className="flex items-center gap-3 mt-3">
                  <div className="flex-1">
                    <p className="text-xs text-slate-500 mb-1.5">Override Order Status</p>
                    <Select
                      value={order.status}
                      onValueChange={(v) => handleOrderStatusChange(v as OrderStatus)}
                      disabled={updatingOrder}
                    >
                      <SelectTrigger className="h-9 text-xs border-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(ORDER_STATUS_CONFIG) as OrderStatus[]).map((s) => (
                          <SelectItem key={s} value={s} className="text-xs">
                            <span className="flex items-center gap-2">
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${ORDER_STATUS_CONFIG[s].dot}`}
                              />
                              {ORDER_STATUS_CONFIG[s].label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {updatingOrder && (
                    <Loader2 className="w-4 h-4 animate-spin text-slate-400 mt-5" />
                  )}
                </div>
              </section>

              {/* ── Order Summary ──────────────────────────────────────── */}
              <section className="px-6 py-5">
                <SectionTitle icon={<CreditCard className="w-4 h-4" />} title="Order Summary" />
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span className="font-mono">{formatCurrency(order.subtotal)}</span>
                  </div>
                  {(order.shippingCost ?? 0) > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Shipping</span>
                      <span className="font-mono">{formatCurrency(order.shippingCost)}</span>
                    </div>
                  )}
                  {(order.discountAmount ?? 0) > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Discount</span>
                      <span className="font-mono">-{formatCurrency(order.discountAmount)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>Total</span>
                    <span className="font-mono text-base">{formatCurrency(order.totalAmount)}</span>
                  </div>
                  {/* Payment info */}
                  {order.payments?.[0] && (
                    <div className="flex justify-between text-xs text-slate-500 pt-1">
                      <span className="capitalize">{order.payments[0].method.toLowerCase()}</span>
                      <PaymentStatusBadge status={order.payments[0].status} size="sm" />
                    </div>
                  )}
                </div>
              </section>

              {/* ── Customer & Address ─────────────────────────────────── */}
              <section className="px-6 py-5">
                <SectionTitle icon={<MapPin className="w-4 h-4" />} title="Customer & Delivery" />
                <div className="mt-3 space-y-3">
                  {order.user && (
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {order.user.name?.[0]?.toUpperCase() || "G"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800">
                          {order.user.name || "Guest"}
                        </p>
                        <p className="text-xs text-slate-400 truncate">{order.user.email}</p>
                      </div>
                      <div className="ml-auto text-xs text-slate-400">{order.user.phone}</div>
                    </div>
                  )}
                  {order.address && (
                    <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-xs">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-slate-700">
                            {order.address.receiverFullName}
                          </p>
                          <p className="text-slate-500">{order.address.phone}</p>
                          <p className="text-slate-500 mt-0.5">{order.address.address}</p>
                          <p className="text-slate-400">
                            {[order.address.city, order.address.zone]
                              .filter(Boolean)
                              .join(", ")}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* ── Vendor Orders ──────────────────────────────────────── */}
              <section className="px-6 py-5">
                <SectionTitle
                  icon={<Store className="w-4 h-4" />}
                  title={`Vendor Orders (${order.vendorOrders.length})`}
                />
                <div className="mt-3 space-y-4">
                  {order.vendorOrders.map((vo) => (
                    <div key={vo.id} className="border border-slate-200 rounded-xl overflow-hidden">
                      {/* Vendor header */}
                      <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-teal-400 to-teal-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {vo.vendor.storeName[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800">{vo.vendor.storeName}</p>
                            <p className="text-[10px] text-slate-400">
                              {vo.items.length} items · {formatCurrency(vo.subtotal)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <FulfillmentStatusBadge status={vo.fulfillmentStatus} />
                          <Select
                            value={vo.status}
                            onValueChange={(v) =>
                              handleVendorStatusChange(vo.id, v as OrderStatus)
                            }
                            disabled={updatingVendor}
                          >
                            <SelectTrigger className="h-6 text-[11px] border-slate-200 w-28 py-0">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {(
                                [
                                  "CONFIRMED",
                                  "PROCESSING",
                                  "PACKAGING",
                                  "SHIPPED",
                                  "DELIVERED",
                                  "CANCELLED",
                                ] as OrderStatus[]
                              ).map((s) => (
                                <SelectItem key={s} value={s} className="text-xs">
                                  {ORDER_STATUS_CONFIG[s]?.label || s}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="divide-y divide-slate-100">
                        {vo.items.map((item) => (
                          <div key={item.quantity + item.price} className="flex items-center gap-3 px-4 py-2.5">
                            <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                              <Package className="w-4 h-4 text-slate-300" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-slate-800 truncate">
                                Item × {item.quantity}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-semibold text-slate-800">
                                {formatCurrency(item.price * item.quantity)}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                {item.quantity} × {formatCurrency(item.price)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Courier info */}
                      {vo.courierOrder && (
                        <div className="px-4 py-3 bg-blue-50 border-t border-blue-100">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Truck className="w-3.5 h-3.5 text-blue-600" />
                              <span className="text-xs font-semibold text-blue-800">
                                Courier
                              </span>
                              {vo.courierOrder.courierTrackingId && (
                                <span className="text-[10px] text-blue-600 font-mono">
                                  #{vo.courierOrder.courierTrackingId}
                                </span>
                              )}
                            </div>
                            <CourierStatusBadge status={vo.courierOrder.status} />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              {/* ── Refunds ────────────────────────────────────────────── */}
              {order.refunds && order.refunds.length > 0 && (
                <section className="px-6 py-5">
                  <SectionTitle icon={<CreditCard className="w-4 h-4" />} title="Refunds" />
                  <div className="mt-3 space-y-2">
                    {order.refunds.map((r) => (
                      <div
                        key={r.id}
                        className="flex items-center justify-between text-xs p-3 bg-rose-50 rounded-xl border border-rose-100"
                      >
                        <div>
                          <p className="font-semibold text-rose-700">{formatCurrency(r.amount)}</p>
                          <p className="text-rose-500 mt-0.5">{r.reason || "No reason provided"}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono text-rose-600 uppercase text-[10px]">{r.status}</p>
                          <p className="text-rose-400 mt-0.5">{formatDate(r.createdAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* ── Timeline ───────────────────────────────────────────── */}
              <section className="px-6 py-5">
                <SectionTitle icon={<Calendar className="w-4 h-4" />} title="Timeline" />
                <div className="mt-3 space-y-2">
                  {[
                    { label: "Order Placed", date: order.createdAt },
                    { label: "Confirmed At", date: order.confirmedAt },
                    { label: "Paid At", date: order.paidAt },
                    { label: "Cancelled At", date: order.cancelledAt },
                  ]
                    .filter((e) => e.date)
                    .map((event) => (
                      <div key={event.label} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                          <span className="text-slate-600">{event.label}</span>
                        </div>
                        <span className="text-slate-400 font-mono">
                          {formatDate(event.date)}
                        </span>
                      </div>
                    ))}
                </div>
              </section>

              {/* ── Meta ───────────────────────────────────────────────── */}
              {(order.conversionSource || order.deviceType) && (
                <section className="px-6 py-4">
                  <div className="flex gap-4 text-xs text-slate-500">
                    {order.conversionSource && (
                      <span>
                        Source:{" "}
                        <strong className="text-slate-700">{order.conversionSource}</strong>
                      </span>
                    )}
                    {order.deviceType && (
                      <span>
                        Device:{" "}
                        <strong className="text-slate-700">{order.deviceType}</strong>
                      </span>
                    )}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-6 py-3 border-t border-slate-100 bg-white flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <p className="text-[11px] text-slate-400 font-mono">{orderId}</p>
            {orderId && <CopyButton value={orderId} />}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 text-xs">
            Close
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}