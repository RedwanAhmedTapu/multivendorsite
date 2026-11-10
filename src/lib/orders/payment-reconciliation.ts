// src/lib/orders/payment-reconciliation.ts
//
// Wording for the admin payment-reconciliation queue (read-only). Every fact
// comes from the backend record (payment.meta.reconciliation); nothing here
// claims a refund or a resolution that the data doesn't show.

import type { UnappliedReason } from "@/features/adminOrderApi";

export const UNAPPLIED_REASON_COPY: Record<UnappliedReason, { label: string; explanation: string }> = {
  ORDER_ALREADY_PAID: {
    label: "Order already paid",
    explanation: "Another payment for this order had already been applied, so this one was a second charge to the customer.",
  },
  ORDER_CANCELLED: {
    label: "Order cancelled",
    explanation: "The order had been cancelled (or refunded) before this payment arrived.",
  },
  ORDER_NOT_PAYABLE: {
    label: "Order not awaiting payment",
    explanation: "The order had already moved past awaiting payment without this payment, so it couldn't be applied.",
  },
};

export function unappliedReasonCopy(reason: string | null | undefined) {
  return (reason && UNAPPLIED_REASON_COPY[reason as UnappliedReason]) || { label: "Needs review", explanation: "This payment was received but couldn't be applied to its order." };
}

/** What the record means — shown once above the list. */
export const RECONCILIATION_NOTICE =
  "Each payment below was verified by the gateway, so the money was received, but it was not applied to its order. No refund has been issued, the order was not changed, and no accounting entry was posted for it. This queue is read-only: resolve each payment with the gateway and finance outside this screen.";

export function gatewayLabel(gateway: string | null | undefined): string {
  switch (gateway) {
    case "SSLCOMMERZ":
      return "SSLCommerz";
    case "EPS":
      return "EPS";
    case "PAYSTATION":
      return "PayStation";
    default:
      return gateway ? gateway.toLowerCase().replace(/_/g, " ") : "—";
  }
}
