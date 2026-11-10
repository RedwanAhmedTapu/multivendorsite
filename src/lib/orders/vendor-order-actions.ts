// src/lib/orders/vendor-order-actions.ts
//
// Store-side order actions — wording and the list's "next action". Pure.
// The detail drawer uses the backend's `vendorActions` (derived from the rules
// the action endpoints enforce); the list only offers the two plain status
// steps the endpoint accepts for any order the store owns and otherwise opens
// the drawer or explains why nothing can be done yet.

import type { VendorActionNote, VendorOrder } from "@/features/vendorOrderApi";

export type RowNextAction =
  | { kind: "advance"; to: "PROCESSING" | "PACKAGING"; label: string }
  | { kind: "open"; label: string }
  | { kind: "info"; text: string };

export function rowNextAction(row: Pick<VendorOrder, "status"> & { order: { paymentmethod?: string; paymentStatus?: string } }): RowNextAction | null {
  switch (row.status) {
    case "CONFIRMED":
      return { kind: "advance", to: "PROCESSING", label: "Start processing" };
    case "PROCESSING":
      return { kind: "advance", to: "PACKAGING", label: "Mark packed" };
    case "PACKAGING":
      return { kind: "open", label: "Book courier" };
    case "PENDING":
      if (row.order.paymentmethod === "COD") return { kind: "open", label: "Review COD" };
      return row.order.paymentStatus === "PAID"
        ? { kind: "info", text: "Paid · awaiting confirmation" }
        : { kind: "info", text: "Awaiting payment" };
    default:
      return null;
  }
}

/** Why an action isn't offered in the drawer (backend note codes). */
export const VENDOR_NOTE_COPY: Record<VendorActionNote, { title: string; body: string }> = {
  COD_REVIEW_REQUIRED: {
    title: "Awaiting FinixMart review",
    body: "This cash-on-delivery order was flagged as high risk. FinixMart reviews it, so the store can't confirm it.",
  },
  STOCK_RELEASED: {
    title: "Stock reservation released",
    body: "The reserved stock for this order was released, so it can't be confirmed. FinixMart support will review it.",
  },
  AWAITING_PAYMENT: {
    title: "Awaiting customer payment",
    body: "The customer hasn't paid for this order yet. Nothing to do until the payment is received.",
  },
  PAID_AWAITING_CONFIRMATION: {
    title: "Paid, awaiting confirmation",
    body: "The customer has paid, but FinixMart hasn't confirmed the order yet. You'll be able to process it once it's confirmed.",
  },
  BOOKING_NEEDS_ATTENTION: {
    title: "Courier booking needs attention",
    body: "A courier booking for this order is still being confirmed or must be reconciled with the courier. Don't book again — contact support.",
  },
};

export function vendorActionError(error: unknown, fallback: string): string {
  const e = error as { status?: number | string; data?: { message?: string } } | undefined;
  if (e?.status === "FETCH_ERROR") return "Couldn't reach FinixMart. Check your connection and try again.";
  if (e?.status === 403) return "You don't have permission to manage this order.";
  const msg = e?.data?.message;
  return typeof msg === "string" && msg.trim() ? msg.trim() : fallback;
}

export function formatTaka(v: number | string | null | undefined, digits = 0): string {
  const n = Number(v);
  if (v === null || v === undefined || v === "" || !Number.isFinite(n)) return "—";
  return `৳${n.toLocaleString("en-BD", { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
}
