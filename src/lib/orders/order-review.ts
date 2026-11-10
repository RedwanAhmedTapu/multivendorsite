// src/lib/orders/order-review.ts
//
// Presentation rules for the admin order review queue
// (GET /api/admin-orders/fraud-review). Pure — no React, no store.
//
// Every fact shown comes from the backend item (toReviewItem): the review
// reason, whether the stock is still reserved, the payment summary and the
// `actions` the backend will accept. This module only words them and keeps
// four things visibly separate: payment received, order confirmed (never, in
// this queue — every order here is PENDING), awaiting review, and stock
// reservation released.

import type { ReviewQueueItem, ReviewReason } from "@/features/adminOrderApi";

export type Tone = "danger" | "attention" | "info" | "neutral" | "success";

export const TONE_CLASSES: Record<Tone, string> = {
  danger: "border-red-200 bg-red-50 text-red-700",
  attention: "border-amber-200 bg-amber-50 text-amber-800",
  info: "border-sky-200 bg-sky-50 text-sky-800",
  neutral: "border-slate-200 bg-slate-100 text-slate-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

export const REVIEW_REASON_COPY: Record<ReviewReason, { label: string; tone: Tone; explanation: string }> = {
  HIGH_RISK_COD: {
    label: "High-risk COD",
    tone: "danger",
    explanation:
      "Cash on delivery with a risk score at or above the review threshold. Vendors cannot confirm it; an admin must approve or reject it.",
  },
  COD_AWAITING_CONFIRMATION: {
    label: "COD awaiting confirmation",
    tone: "attention",
    explanation: "Cash on delivery that has not been confirmed yet. Nothing has been collected from the customer.",
  },
  PAID_AWAITING_CONFIRMATION: {
    label: "Paid, awaiting confirmation",
    tone: "info",
    explanation: "The online payment was received and the stock is still reserved, but the order has not been confirmed.",
  },
  PAID_STOCK_RELEASED: {
    label: "Paid, stock released",
    tone: "danger",
    explanation:
      "The payment arrived after the stock reservation was released. The order cannot be confirmed; cancel it to refund the customer.",
  },
};

export interface Fact {
  label: string;
  value: string;
  tone: Tone;
}

const isCod = (item: Pick<ReviewQueueItem, "paymentMethod">) => item.paymentMethod === "COD";

/** Payment / order / stock — three separate facts, never merged into one "status". */
export function reviewFacts(item: ReviewQueueItem): { payment: Fact; order: Fact; stock: Fact } {
  let payment: Fact;
  if (isCod(item)) {
    payment = { label: "Payment", value: "Cash on delivery: not collected", tone: "neutral" };
  } else if (item.payment?.status === "PAID") {
    payment = { label: "Payment", value: "Payment received", tone: "success" };
  } else {
    payment = { label: "Payment", value: `Payment ${humanize(item.payment?.status ?? item.paymentStatus)}`, tone: "attention" };
  }
  const order: Fact = { label: "Order", value: "Not confirmed: awaiting review", tone: "attention" };
  const stock: Fact = item.stockReserved
    ? { label: "Stock", value: "Reserved", tone: "success" }
    : { label: "Stock", value: "Reservation released", tone: "danger" };
  return { payment, order, stock };
}

export type ReviewAction = "approve" | "reject" | "cancel";

/** Why an action is not offered, or null when the backend accepts it. */
export function unavailableReason(item: ReviewQueueItem, action: ReviewAction): string | null {
  if (action === "approve" && !item.actions.canApprove) {
    return "This order can't be approved because its stock reservation was released. FinixMart doesn't re-reserve stock from the review queue, because the items may already have been sold to someone else.";
  }
  if (action === "reject" && !item.actions.canReject) {
    return "A paid order can't be rejected. Cancel it instead, so the customer is refunded.";
  }
  if (action === "cancel" && !item.actions.canCancel) return "This order can't be cancelled from the review queue.";
  return null;
}

export const ACTION_COPY: Record<ReviewAction, { title: string; confirm: string; needsReason: boolean; body: (item: ReviewQueueItem) => string }> = {
  approve: {
    title: "Approve this order?",
    confirm: "Approve order",
    needsReason: false,
    body: (item) =>
      isCod(item)
        ? "The order is confirmed and released to the vendor for fulfilment. Cash is collected on delivery. This is recorded as a manual admin override."
        : "The order is confirmed and released to the vendor for fulfilment.",
  },
  reject: {
    title: "Reject this order?",
    confirm: "Reject order",
    needsReason: true,
    body: () => "The order is cancelled and its reserved stock is returned to inventory. The customer is notified. This can't be undone.",
  },
  cancel: {
    title: "Cancel this order?",
    confirm: "Cancel order",
    needsReason: true,
    body: (item) =>
      item.payment?.status === "PAID"
        ? "The order is cancelled and one pending full refund is created for the payment. Process the refund from Refunds. This can't be undone."
        : "The order is cancelled and any reserved stock is returned to inventory. This can't be undone.",
  },
};

export const REASON_MAX = 500;

/** The backend's message for a failed action; 409 = the order changed meanwhile. */
export function actionErrorMessage(error: unknown): string {
  const e = error as { status?: number | string; data?: { message?: string } } | undefined;
  const message = typeof e?.data?.message === "string" && e.data.message.trim() ? e.data.message.trim() : null;
  if (e?.status === 409) return message ?? "This order changed while you were reviewing it. The queue has been refreshed.";
  if (e?.status === 403) return "You don't have permission to manage orders.";
  if (e?.status === "FETCH_ERROR") return "Couldn't reach the server. Check your connection and try again.";
  return message ?? "The action couldn't be completed. Try again.";
}

export function formatMoney(v: string | number | null | undefined): string {
  if (v === null || v === undefined || v === "") return "—";
  const n = Number(v);
  if (!Number.isFinite(n)) return String(v);
  return `৳${n.toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("en-BD", { dateStyle: "medium", timeStyle: "short" });
}

export function humanize(v: string | null | undefined): string {
  if (!v) return "—";
  return v.toLowerCase().replace(/_/g, " ");
}

export function paymentMethodLabel(method: string | null | undefined): string {
  switch (method) {
    case "COD":
      return "Cash on delivery";
    case "SSLCOMMERZ":
      return "SSLCommerz";
    case "EPS":
      return "EPS";
    case "BKASH":
      return "bKash";
    case "NAGAD":
      return "Nagad";
    default:
      return method ? humanize(method) : "—";
  }
}
