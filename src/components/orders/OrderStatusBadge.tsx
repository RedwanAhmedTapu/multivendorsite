"use client";

import type {
  OrderStatus,
  PaymentStatus,
  FulfillmentStatus,
  CourierOrderStatus,
} from "@/features/adminOrderApi";

// ─── Order Status ─────────────────────────────────────────────────────────────

export const ORDER_STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; cls: string; dot: string }
> = {
  PENDING:           { label: "Pending",        cls: "bg-amber-50 text-amber-700 border-amber-200",    dot: "bg-amber-400" },
  CONFIRMED:         { label: "Confirmed",       cls: "bg-blue-50 text-blue-700 border-blue-200",       dot: "bg-blue-500" },
  PROCESSING:        { label: "Processing",      cls: "bg-indigo-50 text-indigo-700 border-indigo-200", dot: "bg-indigo-500" },
  PACKAGING:         { label: "Packaging",       cls: "bg-violet-50 text-violet-700 border-violet-200", dot: "bg-violet-500" },
  SHIPPED:           { label: "Shipped",         cls: "bg-sky-50 text-sky-700 border-sky-200",          dot: "bg-sky-500" },
  DELIVERED:         { label: "Delivered",       cls: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  RETURNED:          { label: "Returned",        cls: "bg-orange-50 text-orange-700 border-orange-200", dot: "bg-orange-500" },
  FAILED_TO_DELIVER: { label: "Failed Delivery", cls: "bg-red-50 text-red-700 border-red-200",          dot: "bg-red-500" },
  CANCELLED:         { label: "Cancelled",       cls: "bg-slate-100 text-slate-500 border-slate-200",   dot: "bg-slate-400" },
  REFUNDED:          { label: "Refunded",        cls: "bg-rose-50 text-rose-700 border-rose-200",       dot: "bg-rose-500" },
};

export const PAYMENT_STATUS_CONFIG: Record<
  PaymentStatus,
  { label: string; cls: string }
> = {
  PENDING:  { label: "Unpaid",   cls: "bg-amber-50 text-amber-600 border-amber-200" },
  PAID:     { label: "Paid",     cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  FAILED:   { label: "Failed",   cls: "bg-red-50 text-red-700 border-red-200" },
  REFUNDED: { label: "Refunded", cls: "bg-rose-50 text-rose-700 border-rose-200" },
};

export const FULFILLMENT_STATUS_CONFIG: Record<
  FulfillmentStatus,
  { label: string; cls: string }
> = {
  UNFULFILLED:         { label: "Unfulfilled", cls: "bg-slate-100 text-slate-600 border-slate-200" },
  PARTIALLY_FULFILLED: { label: "Partial",     cls: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  FULFILLED:           { label: "Fulfilled",   cls: "bg-teal-50 text-teal-700 border-teal-200" },
  SHIPPED:             { label: "Shipped",     cls: "bg-sky-50 text-sky-700 border-sky-200" },
  DELIVERED:           { label: "Delivered",   cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  RETURNED:            { label: "Returned",    cls: "bg-orange-50 text-orange-700 border-orange-200" },
  CANCELLED:           { label: "Cancelled",   cls: "bg-slate-100 text-slate-500 border-slate-200" },
};

const COURIER_STATUS_CONFIG: Record<
  CourierOrderStatus,
  { label: string; cls: string }
> = {
  PENDING_PICKUP:   { label: "Pending Pickup",   cls: "bg-amber-50 text-amber-700 border-amber-200" },
  READY_FOR_PICKUP: { label: "Ready",            cls: "bg-blue-50 text-blue-700 border-blue-200" },
  PICKUP_PENDING:   { label: "Pickup Pending",   cls: "bg-amber-50 text-amber-600 border-amber-200" },
  PICKED_UP:        { label: "Picked Up",        cls: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  IN_TRANSIT:       { label: "In Transit",       cls: "bg-sky-50 text-sky-700 border-sky-200" },
  OUT_FOR_DELIVERY: { label: "Out for Delivery", cls: "bg-violet-50 text-violet-700 border-violet-200" },
  DELIVERED:        { label: "Delivered",        cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  FAILED_DELIVERY:  { label: "Failed",           cls: "bg-red-50 text-red-700 border-red-200" },
  RETURNING:        { label: "Returning",        cls: "bg-orange-50 text-orange-700 border-orange-200" },
  RETURNED:         { label: "Returned",         cls: "bg-orange-50 text-orange-600 border-orange-200" },
  CANCELLED:        { label: "Cancelled",        cls: "bg-slate-100 text-slate-500 border-slate-200" },
  ON_HOLD:          { label: "On Hold",          cls: "bg-rose-50 text-rose-600 border-rose-200" },
};

// ─── Components ───────────────────────────────────────────────────────────────

interface BadgeProps {
  size?: "sm" | "md";
}

export function OrderStatusBadge({
  status,
  size = "sm",
}: BadgeProps & { status: OrderStatus }) {
  const cfg = ORDER_STATUS_CONFIG[status] ?? ORDER_STATUS_CONFIG.PENDING;
  const textSize = size === "sm" ? "text-[11px]" : "text-xs";
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border font-medium ${textSize} ${cfg.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

export function PaymentStatusBadge({
  status,
  size = "sm",
}: BadgeProps & { status: PaymentStatus }) {
  const cfg = PAYMENT_STATUS_CONFIG[status] ?? PAYMENT_STATUS_CONFIG.PENDING;
  const textSize = size === "sm" ? "text-[11px]" : "text-xs";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full border font-medium ${textSize} ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

export function FulfillmentStatusBadge({
  status,
  size = "sm",
}: BadgeProps & { status: FulfillmentStatus }) {
  const cfg = FULFILLMENT_STATUS_CONFIG[status] ?? FULFILLMENT_STATUS_CONFIG.UNFULFILLED;
  const textSize = size === "sm" ? "text-[11px]" : "text-xs";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full border font-medium ${textSize} ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

export function CourierStatusBadge({
  status,
  size = "sm",
}: BadgeProps & { status: CourierOrderStatus }) {
  const cfg = COURIER_STATUS_CONFIG[status] ?? COURIER_STATUS_CONFIG.PENDING_PICKUP;
  const textSize = size === "sm" ? "text-[11px]" : "text-xs";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full border font-medium ${textSize} ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}