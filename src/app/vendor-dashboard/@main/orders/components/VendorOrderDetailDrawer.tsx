"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Phone,
  User,
  Package,
  Truck,
  CreditCard,
  Calendar,
  Loader2,
  Copy,
  Check,
  AlertTriangle,
  ArrowRight,
  MessageSquare,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import {
  OrderStatusBadge,
  PaymentStatusBadge,
  FulfillmentStatusBadge,
  CourierStatusBadge,
} from "@/components/orders/OrderStatusBadge";
import {
  useGetVendorOrderByIdQuery,
  useUpdateVendorOrderStatusMutation,
} from "@/features/vendorOrderApi";
import type { VendorOrderRow, VendorUpdatableStatus } from "@/types/vendorOrderTypes";

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-BD", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(iso)
  );
}

function fmtCurrency(n?: number) {
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
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="text-slate-400 hover:text-teal-600 transition-colors"
    >
      {copied ? <Check className="w-3 h-3 text-teal-500" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

// ── Status pipeline for vendor ────────────────────────────────────────────────

const VENDOR_PIPELINE: { from: string; to: VendorUpdatableStatus; label: string; color: string }[] = [
  { from: "CONFIRMED",  to: "PROCESSING", label: "Start Processing", color: "bg-indigo-600 hover:bg-indigo-700" },
  { from: "PROCESSING", to: "PACKAGING",  label: "Mark as Packaging", color: "bg-violet-600 hover:bg-violet-700" },
  { from: "PACKAGING",  to: "SHIPPED",    label: "Mark as Shipped",   color: "bg-sky-600 hover:bg-sky-700" },
];

// ── Main Drawer ───────────────────────────────────────────────────────────────

interface Props {
  vendorOrderId: string | null;
  onClose: () => void;
}

export function VendorOrderDetailDrawer({ vendorOrderId, onClose }: Props) {
  const { data, isLoading } = useGetVendorOrderByIdQuery(vendorOrderId!, {
    skip: !vendorOrderId,
  });
  const order = data?.data;

  const [updateStatus, { isLoading: updating }] = useUpdateVendorOrderStatusMutation();

  const pipelineStep = VENDOR_PIPELINE.find((p) => p.from === order?.status);

  const handleStatusUpdate = async () => {
    if (!order || !pipelineStep) return;
    try {
      await updateStatus({ vendorOrderId: order.id, status: pipelineStep.to }).unwrap();
      toast.success(`Order moved to ${pipelineStep.to.toLowerCase()}`);
    } catch {
      toast.error("Failed to update order status");
    }
  };

  return (
    <Sheet open={!!vendorOrderId} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl flex flex-col gap-0 p-0 overflow-hidden"
      >
        {/* Header */}
        <SheetHeader className="px-6 py-4 bg-gradient-to-br from-teal-800 to-teal-900 flex-shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <SheetTitle className="text-white font-bold text-lg font-mono">
                #{order?.order.orderNumber || (vendorOrderId?.slice(-8).toUpperCase() ?? "—")}
              </SheetTitle>
              <p className="text-teal-300 text-xs mt-0.5">
                {order ? fmtDate(order.createdAt) : "Loading…"}
              </p>
            </div>
            {order && (
              <div className="flex flex-col items-end gap-1.5">
                <OrderStatusBadge status={order.status} size="md" />
                <div className="flex gap-1">
                  <PaymentStatusBadge status={order.order.paymentStatus} />
                  <FulfillmentStatusBadge status={order.fulfillmentStatus} />
                </div>
              </div>
            )}
          </div>

          {/* Pipeline action — shown right in header for maximum visibility */}
          {order && pipelineStep && (
            <div className="mt-3 pt-3 border-t border-teal-700">
              <p className="text-teal-400 text-[11px] mb-2 uppercase tracking-wide font-semibold">
                Next Step
              </p>
              <Button
                className={`w-full h-9 text-sm font-semibold text-white gap-2 ${pipelineStep.color} transition-colors`}
                onClick={handleStatusUpdate}
                disabled={updating}
              >
                {updating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
                {pipelineStep.label}
              </Button>
            </div>
          )}

          {/* Terminal state note */}
          {order && !pipelineStep && ["SHIPPED", "DELIVERED", "CANCELLED", "RETURNED"].includes(order.status) && (
            <div className="mt-3 pt-3 border-t border-teal-700">
              <div className="flex items-center gap-2 text-teal-400 text-xs">
                <Info className="w-3.5 h-3.5 flex-shrink-0" />
                {order.status === "SHIPPED"
                  ? "Order handed to courier. Awaiting delivery."
                  : order.status === "DELIVERED"
                  ? "Order successfully delivered."
                  : "No further actions available for this order."}
              </div>
            </div>
          )}
        </SheetHeader>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-20 text-slate-400 gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Loading order…
            </div>
          ) : !order ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
              <AlertTriangle className="w-8 h-8 opacity-40" />
              <p className="text-sm">Order not found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">

              {/* ── Order Items ─────────────────────────────────────────── */}
              <section className="px-6 py-5">
                <SectionTitle
                  icon={<Package className="w-4 h-4" />}
                  title={`Items (${order.items.length})`}
                />
                <div className="mt-3 space-y-2">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl"
                    >
                      {/* Product image */}
                      <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {item.variant.product.images?.[0]?.url ? (
                          <img
                            src={item.variant.product.images[0].url}
                            alt={item.variant.product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="w-5 h-5 text-slate-300" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">
                          {item.variant.product.name}
                        </p>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                          SKU: {item.variant.sku}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Qty: <span className="font-semibold">{item.quantity}</span>
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-slate-900 font-mono">
                          {fmtCurrency(item.price * item.quantity)}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {fmtCurrency(item.price)} each
                        </p>
                      </div>
                    </div>
                  ))}

                  {/* Order subtotal */}
                  <div className="flex items-center justify-between pt-2 px-1">
                    <span className="text-xs text-slate-500">Subtotal</span>
                    <span className="text-sm font-bold text-slate-900 font-mono">
                      {fmtCurrency(order.subtotal)}
                    </span>
                  </div>
                  {order.shippingCost > 0 && (
                    <div className="flex items-center justify-between px-1 -mt-1">
                      <span className="text-xs text-slate-500">Shipping</span>
                      <span className="text-xs text-slate-700 font-mono">
                        {fmtCurrency(order.shippingCost)}
                      </span>
                    </div>
                  )}
                </div>
              </section>

              {/* ── Customer & Address ──────────────────────────────────── */}
              <section className="px-6 py-5">
                <SectionTitle icon={<User className="w-4 h-4" />} title="Customer" />
                <div className="mt-3 space-y-2">
                  {order.order.user && (
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {order.order.user.name?.[0]?.toUpperCase() || "G"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-800">
                          {order.order.user.name || "Guest"}
                        </p>
                        <p className="text-xs text-slate-400 truncate">
                          {order.order.user.email}
                        </p>
                      </div>
                      {order.order.user.phone && (
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <Phone className="w-3 h-3" />
                          {order.order.user.phone}
                        </div>
                      )}
                    </div>
                  )}

                  {order.order.address && (
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                        <div className="text-xs space-y-0.5 flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-slate-700">
                              {order.order.address.receiverFullName}
                            </p>
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-500">{order.order.address.phone}</span>
                              <CopyButton value={order.order.address.phone} />
                            </div>
                          </div>
                          <p className="text-slate-500">
                            {order.order.address.address}
                            {order.order.address.landmark &&
                              `, near ${order.order.address.landmark}`}
                          </p>
                          <p className="text-slate-400">
                            {[
                              order.order.address.city,
                              order.order.address.zone,
                              order.order.address.state,
                            ]
                              .filter(Boolean)
                              .join(", ")}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* ── Payment Info (read-only) ────────────────────────────── */}
              <section className="px-6 py-5">
                <SectionTitle icon={<CreditCard className="w-4 h-4" />} title="Payment" />
                <div className="mt-3 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <p className="text-[11px] text-slate-500 mb-1">Payment Status</p>
                      <PaymentStatusBadge status={order.order.paymentStatus} size="md" />
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <p className="text-[11px] text-slate-500 mb-1">Order Total</p>
                      <p className="text-sm font-bold text-slate-900 font-mono">
                        {fmtCurrency(order.order.totalAmount)}
                      </p>
                    </div>
                  </div>
                  {order.order.paidAt && (
                    <p className="text-[11px] text-slate-400 px-1">
                      Paid at: {fmtDate(order.order.paidAt)}
                    </p>
                  )}
                  {/* Note: vendor can see payment status but cannot control it */}
                  <div className="flex items-start gap-1.5 px-1">
                    <Info className="w-3 h-3 text-slate-400 mt-0.5 flex-shrink-0" />
                    <p className="text-[11px] text-slate-400">
                      Payment is managed by the platform. Contact support for payment issues.
                    </p>
                  </div>
                </div>
              </section>

              {/* ── Courier ─────────────────────────────────────────────── */}
              <section className="px-6 py-5">
                <SectionTitle icon={<Truck className="w-4 h-4" />} title="Courier" />
                {order.courierOrder ? (
                  <div className="mt-3 space-y-2">
                    <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-semibold text-blue-800">
                            {order.courierOrder.courier_providers?.displayName ||
                              order.courierOrder.courier_providers?.name ||
                              "Courier"}
                          </span>
                        </div>
                        <CourierStatusBadge status={order.courierOrder.status} size="md" />
                      </div>
                      {order.courierOrder.courierTrackingId && (
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-blue-700 font-mono">
                            #{order.courierOrder.courierTrackingId}
                          </p>
                          <CopyButton value={order.courierOrder.courierTrackingId} />
                        </div>
                      )}
                      <p className="text-[10px] text-blue-500 mt-1">
                        Last update: {fmtDate(order.courierOrder.lastStatusUpdate)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 p-3 bg-slate-50 rounded-xl text-xs text-slate-400 flex items-center gap-2">
                    <Truck className="w-4 h-4 opacity-40" />
                    No courier assigned yet. Create a pickup order from the Courier section.
                  </div>
                )}
              </section>

              {/* ── Timeline ────────────────────────────────────────────── */}
              <section className="px-6 py-5">
                <SectionTitle icon={<Calendar className="w-4 h-4" />} title="Timeline" />
                <div className="mt-3 relative">
                  {/* Vertical line */}
                  <div className="absolute left-[7px] top-2 bottom-2 w-px bg-slate-200" />
                  <div className="space-y-3">
                    {[
                      { label: "Order placed",   date: order.order.createdAt,  done: true },
                      { label: "Confirmed",       date: order.order.confirmedAt, done: true },
                      { label: "Processing",      date: order.status !== "CONFIRMED" ? order.createdAt : null, done: ["PROCESSING","PACKAGING","SHIPPED","DELIVERED"].includes(order.status) },
                      { label: "Packaging",       date: null,                   done: ["PACKAGING","SHIPPED","DELIVERED"].includes(order.status) },
                      { label: "Shipped",         date: order.shippedAt,        done: ["SHIPPED","DELIVERED"].includes(order.status) },
                      { label: "Delivered",       date: order.deliveredAt,      done: order.status === "DELIVERED" },
                    ].map(({ label, date, done }) => (
                      <div key={label} className="flex items-center gap-3 relative">
                        <div className={`w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 z-10 ${
                          done
                            ? "bg-teal-500 border-teal-500"
                            : "bg-white border-slate-300"
                        }`} />
                        <span className={`text-xs flex-1 ${done ? "text-slate-700 font-medium" : "text-slate-400"}`}>
                          {label}
                        </span>
                        {date && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            {fmtDate(date)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-6 py-3 border-t border-slate-100 bg-white flex items-center justify-between gap-2">
          <p className="text-[11px] text-slate-400 font-mono truncate">
            {vendorOrderId?.slice(-16)}
          </p>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 text-xs flex-shrink-0">
            Close
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}