// src/lib/orders/customer-order-actions.ts
//
// Wording + guards for the customer's order actions (Pay Now, cancel) and the
// refund status list. Pure — no React, no store. Which actions exist comes
// from the backend (`order.customerActions`); the endpoints re-check them.

import type { CustomerOrderActions, OrderRefund, PayNowErrorBody, RefundStatus } from "@/features/userorderApi";

export type Tone = "success" | "attention" | "danger" | "neutral" | "info";

export const TONE_BADGE: Record<Tone, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  attention: "border-amber-200 bg-amber-50 text-amber-800",
  danger: "border-red-200 bg-red-50 text-red-700",
  neutral: "border-slate-200 bg-slate-100 text-slate-600",
  info: "border-sky-200 bg-sky-50 text-sky-800",
};

/** Only the persisted refund states, worded without promises the data can't back. */
export const REFUND_STATUS_COPY: Record<RefundStatus, { label: string; tone: Tone; description: string }> = {
  PENDING: { label: "Requested", tone: "attention", description: "Your refund request was received and is waiting for review." },
  APPROVED: { label: "Approved", tone: "info", description: "The refund was approved and is waiting to be processed." },
  PROCESSING: { label: "Processing", tone: "info", description: "The refund is being processed with the payment provider." },
  REFUNDED: { label: "Refunded", tone: "success", description: "The refund was completed." },
  FAILED: { label: "Failed", tone: "danger", description: "The refund couldn't be completed. Please contact support." },
  REJECTED: { label: "Rejected", tone: "neutral", description: "The refund request was rejected." },
  CANCELLED: { label: "Cancelled", tone: "neutral", description: "The refund request was cancelled." },
};

export function refundCopy(status: string) {
  return REFUND_STATUS_COPY[status as RefundStatus] ?? { label: status.toLowerCase().replace(/_/g, " "), tone: "neutral" as Tone, description: "" };
}

/** Newest first. */
export function sortRefunds(refunds: OrderRefund[] | undefined): OrderRefund[] {
  return [...(refunds ?? [])].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export const CANCEL_BLOCKED_COPY: Record<NonNullable<CustomerOrderActions["cancelBlockedReason"]>, string | null> = {
  ALREADY_CANCELLED: null,
  DISPATCHED: "This order has already been handed to the courier, so it can't be cancelled.",
  COURIER_BOOKING_ACTIVE: "A courier pickup is already being arranged for this order, so it can't be cancelled here. Contact support if you need to cancel it.",
};

/** The gateway page must be an absolute https URL — anything else is never followed. */
export function safeGatewayUrl(url: unknown): string | null {
  if (typeof url !== "string") return null;
  try {
    const u = new URL(url);
    return u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
}

function errorBody(error: unknown): { status?: number | string; body?: PayNowErrorBody & { error?: string } } {
  const e = error as { status?: number | string; data?: unknown } | undefined;
  return { status: e?.status, body: (e?.data && typeof e.data === "object" ? e.data : undefined) as any };
}

export function payNowErrorMessage(error: unknown): string {
  const { status, body } = errorBody(error);
  if (status === "FETCH_ERROR") return "Couldn't reach FinixMart. Check your connection and try again.";
  if (body?.code === "PAYMENT_IN_PROGRESS") {
    const mins = body.retryAfterSeconds ? Math.max(1, Math.ceil(body.retryAfterSeconds / 60)) : null;
    return `A payment for this order was started a moment ago. If you completed it, it will be confirmed shortly${
      mins ? `; otherwise you can try again in about ${mins} minute${mins === 1 ? "" : "s"}` : ""
    }.`;
  }
  if (typeof body?.message === "string" && body.message.trim()) return body.message.trim();
  return "We couldn't open the payment page. Please try again.";
}

export function cancelErrorMessage(error: unknown): string {
  const { status, body } = errorBody(error);
  if (status === "FETCH_ERROR") return "Couldn't reach FinixMart. Check your connection and try again.";
  const msg = body?.message ?? body?.error;
  if (status === 409 && typeof msg === "string" && msg.trim()) return msg.trim();
  if (status === 400 && typeof msg === "string" && /after dispatch/i.test(msg)) return CANCEL_BLOCKED_COPY.DISPATCHED!;
  return "We couldn't cancel this order. Please try again or contact support.";
}

export const CANCEL_REASONS = [
  "Changed my mind",
  "Ordered by mistake",
  "Found a better price",
  "Delivery takes too long",
  "Other",
] as const;

export function formatTaka(v: number | string | null | undefined): string {
  const n = Number(v);
  if (v === null || v === undefined || v === "" || !Number.isFinite(n)) return "—";
  return `৳${n.toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function isPaid(paymentStatus: string): boolean {
  return paymentStatus === "PAID" || paymentStatus === "PARTIALLY_REFUNDED";
}
