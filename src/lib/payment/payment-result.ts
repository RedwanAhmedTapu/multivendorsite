// src/lib/payment/payment-result.ts
//
// Which screen the customer sees after a payment gateway sends them back to
// /payment/success | /payment/failed | /payment/cancelled. Pure (unit-tested).
//
// The ONLY source of truth is the persisted state from
// GET /api/payment/result/:transactionId (PaymentResult.state). The landing
// route a gateway redirected to is NEVER proof of anything: it only flavours
// the wording when there is no transaction to check. A success screen is shown
// exclusively for state CONFIRMED.

import type { PaymentResult, PaymentResultState } from "@/features/paymentApi";

export type PaymentLanding = "success" | "failed" | "cancelled";

export type ResultScreenKey =
  | "LOADING"
  | "SIGN_IN"
  | "UNVERIFIED" // no transaction id to check
  | "NOT_FOUND"
  | "ERROR"
  | "CONFIRMED"
  | "DELIVERY_FEE_PAID"
  | "HELD_STOCK"
  | "HELD_REVIEW"
  | "UNAPPLIED"
  | "PENDING"
  | "PENDING_TIMEOUT"
  | "REPORTED_NOT_COMPLETED" // the payment page reported failure / cancellation; the provider hasn't confirmed it
  | "FAILED"
  | "CANCELLED"
  | "ORDER_CANCELLED"
  | "REFUNDED";

export type ResultTone = "success" | "attention" | "danger" | "neutral";

export interface ResultScreenInput {
  landing: PaymentLanding;
  transactionId: string | null;
  isAuthenticated: boolean;
  query: { isLoading: boolean; isError: boolean; errorStatus?: number | string; result?: PaymentResult };
  pollingExpired: boolean;
}

/** The one place that turns persisted state (+ request status) into a screen. */
export function resultScreenKey(i: ResultScreenInput): ResultScreenKey {
  if (!i.transactionId) return "UNVERIFIED";
  if (!i.isAuthenticated) return "SIGN_IN";
  if (i.query.result) return screenForState(i.query.result, i.pollingExpired);
  if (i.query.isError) {
    if (i.query.errorStatus === 401 || i.query.errorStatus === 403) return "SIGN_IN";
    if (i.query.errorStatus === 404) return "NOT_FOUND";
    return "ERROR";
  }
  return "LOADING";
}

function screenForState(r: PaymentResult, pollingExpired: boolean): ResultScreenKey {
  const map: Record<PaymentResultState, ResultScreenKey> = {
    CONFIRMED: r.purpose === "delivery_fee" ? "DELIVERY_FEE_PAID" : "CONFIRMED",
    HELD: r.holdReason === "STOCK" ? "HELD_STOCK" : "HELD_REVIEW",
    UNAPPLIED: "UNAPPLIED",
    PENDING: r.gatewayReport ? "REPORTED_NOT_COMPLETED" : pollingExpired ? "PENDING_TIMEOUT" : "PENDING",
    FAILED: "FAILED",
    CANCELLED: "CANCELLED",
    ORDER_CANCELLED: "ORDER_CANCELLED",
    REFUNDED: "REFUNDED",
  };
  return map[r.state] ?? "ERROR";
}

/** Poll only while the persisted state is still PENDING and the time budget lasts. */
export function shouldPoll(result: PaymentResult | undefined, pollingExpired: boolean): boolean {
  return result?.state === "PENDING" && !pollingExpired;
}

export interface ResultScreenCopy {
  tone: ResultTone;
  title: string;
  body: string;
  /** Short status pill shown next to the details. */
  badge: string;
}

export function resultScreenCopy(key: ResultScreenKey, landing: PaymentLanding): ResultScreenCopy {
  switch (key) {
    case "LOADING":
      return { tone: "neutral", title: "Checking your payment", body: "Getting the latest status of this payment from FinixMart…", badge: "Checking" };
    case "SIGN_IN":
      return {
        tone: "neutral",
        title: "Sign in to see this payment",
        body: "Payment results are only shown to the account that placed the order. Sign in with that account, then open this page again or check My orders.",
        badge: "Sign in required",
      };
    case "UNVERIFIED":
      return landing === "success"
        ? { tone: "neutral", title: "We couldn't confirm this payment", body: "This page doesn't include a payment reference we can check. If a payment went through, it will appear on your order.", badge: "Not confirmed" }
        : landing === "cancelled"
          ? { tone: "neutral", title: "Payment cancelled", body: "The payment page reported that the payment was cancelled. Your order is saved — check its status in My orders.", badge: "Cancelled" }
          : { tone: "danger", title: "Payment not completed", body: "The payment page reported that the payment didn't go through. Your order is saved — check its status in My orders.", badge: "Not completed" };
    case "NOT_FOUND":
      return {
        tone: "neutral",
        title: "We couldn't find this payment",
        body: "This payment isn't linked to the account you're signed in with. If you paid with another account, sign in with it — or check My orders.",
        badge: "Not found",
      };
    case "ERROR":
      return { tone: "neutral", title: "We couldn't load your payment result", body: "Something went wrong while checking this payment. Your payment and order are not affected — please try again.", badge: "Unavailable" };
    case "CONFIRMED":
      return { tone: "success", title: "Payment successful", body: "We've received your payment and your order is confirmed. The seller will start preparing it soon.", badge: "Paid · Confirmed" };
    case "DELIVERY_FEE_PAID":
      return { tone: "success", title: "Delivery fee paid", body: "We've received your delivery fee. The rest of your order is still paid in cash on delivery.", badge: "Fee paid" };
    case "HELD_STOCK":
      return {
        tone: "attention",
        title: "Payment received — order on hold",
        body: "Your payment arrived after the items' reservation had expired, so the order can't be confirmed automatically. Our team will review it. If the order can't be fulfilled, it will be cancelled and your payment refunded.",
        badge: "Paid · On hold",
      };
    case "HELD_REVIEW":
      return {
        tone: "attention",
        title: "Payment received — order under review",
        body: "We've received your payment. Your order needs a quick review before it's confirmed. You'll see the update on your order.",
        badge: "Paid · In review",
      };
    case "UNAPPLIED":
      return {
        tone: "attention",
        title: "Payment received — needs review",
        body: "We received this payment, but it couldn't be applied to the order — the order was already paid or is no longer awaiting payment. It has been recorded for FinixMart to review. Contact support with the reference below if you have questions.",
        badge: "Received · Under review",
      };
    case "PENDING":
      return { tone: "neutral", title: "Confirming your payment", body: "The payment provider hasn't confirmed this payment yet. This usually takes a few seconds — this page updates automatically.", badge: "Awaiting confirmation" };
    case "PENDING_TIMEOUT":
      return {
        tone: "attention",
        title: "This is taking longer than usual",
        body: "We still haven't received the payment provider's confirmation. Please don't pay again — check again in a minute, or open your order to see its status.",
        badge: "Awaiting confirmation",
      };
    case "REPORTED_NOT_COMPLETED":
      return {
        tone: "neutral",
        title: "Payment not completed",
        body: "The payment page reported that this payment didn't go through, and the payment provider hasn't confirmed otherwise. Your order is saved — you can try again from My orders. If you were charged, it will show on your order once the provider confirms the payment.",
        badge: "Not completed",
      };
    case "FAILED":
      return { tone: "danger", title: "Payment failed", body: "The payment didn't go through. Your order is saved — you can review it in My orders. If your account was charged anyway, contact FinixMart support with the reference below.", badge: "Failed" };
    case "CANCELLED":
      return { tone: "neutral", title: "Payment cancelled", body: "The payment was cancelled before it was completed. Your order is saved — you can review it in My orders.", badge: "Cancelled" };
    case "ORDER_CANCELLED":
      return { tone: "neutral", title: "This order was cancelled", body: "The order linked to this payment is cancelled. If you were charged, any refund appears on the order.", badge: "Order cancelled" };
    case "REFUNDED":
      return { tone: "neutral", title: "Payment refunded", body: "This payment has been refunded. The order shows the details.", badge: "Refunded" };
  }
}

/** ৳ with two decimals. */
export function formatPaymentAmount(amount: string | number | null | undefined): string {
  const n = Number(amount);
  if (amount === null || amount === undefined || amount === "" || !Number.isFinite(n)) return "—";
  return `৳${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const METHOD_LABELS: Record<string, string> = { SSLCOMMERZ: "Online payment (SSLCommerz)", EPS: "Online payment (EPS)", PAYSTATION: "Online payment (PayStation)", COD: "Cash on delivery", BKASH: "bKash", NAGAD: "Nagad", ROCKET: "Rocket" };
export function paymentMethodLabel(method: string | null | undefined): string {
  if (!method) return "—";
  return METHOD_LABELS[method] ?? method.charAt(0) + method.slice(1).toLowerCase().replace(/_/g, " ");
}
