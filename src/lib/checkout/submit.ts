// lib/checkout/submit.ts
//
// Checkout's existing two-step submission (app/checkout/page.tsx), made safe to
// retry. Unit tested in tests/cart-checkout.test.mjs.
//   1. placeOrder   → POST /user-orders creates the (unpaid) order. The backend
//                     then deletes the selected cart lines.
//   2. createPayment → POST /payment/init: COD = pending payment, no redirect;
//                     ONLINE = gatewayPageURL to redirect to.
// If step 2 fails after step 1 succeeded, the order already exists and the
// cart lines are gone — calling placeOrder again would fail ("No selected
// items in cart") and strand the shopper. So the placed order is returned
// with the error and passed back in on retry: only step 2 runs again.
// Duplicate clicks are stopped by the page's synchronous lock (see
// createSubmitLock) on top of the button's disabled state.

import type { CheckoutQuote } from "@/features/cartWishApi";

export interface PlacedOrder {
  orderId: string;
  orderNumber: string;
}

export type SubmitResult =
  | { kind: "success"; order: PlacedOrder }
  | { kind: "redirect"; url: string; order: PlacedOrder }
  | { kind: "error"; message: string; order: PlacedOrder | null }
  /**
   * Phase 2 (H-3): 409 CHECKOUT_CHANGED — no order was placed because the
   * order no longer matches the reviewed quote (or a changed price needs the
   * customer's acknowledgment). The customer must review `quote` and confirm;
   * nothing is retried automatically and no payment is started.
   */
  | { kind: "changed"; reason: string; message: string; quote: CheckoutQuote; order: null };

/** The server's 409 CHECKOUT_CHANGED body (fresh quote), or null for any other error. */
export function checkoutChanged(err: unknown): { reason: string; message: string; quote: CheckoutQuote } | null {
  const e = (err && typeof err === "object" ? err : {}) as {
    status?: unknown;
    data?: { code?: unknown; reason?: unknown; message?: unknown; data?: { quote?: unknown } };
  };
  if (e.status !== 409 || e.data?.code !== "CHECKOUT_CHANGED" || !e.data?.data?.quote) return null;
  return {
    reason: typeof e.data.reason === "string" ? e.data.reason : "QUOTE_CHANGED",
    message: typeof e.data.message === "string" ? e.data.message : "Your order changed. Please review it before placing it.",
    quote: e.data.data.quote as CheckoutQuote,
  };
}

/** Same message precedence the page always used. */
export const apiErrorMessage = (err: unknown, fallback: string) => {
  const e = (err && typeof err === "object" ? err : {}) as { data?: { message?: unknown; error?: unknown } };
  return typeof e.data?.message === "string" ? e.data.message : typeof e.data?.error === "string" ? e.data.error : fallback;
};

export async function submitCheckout(
  placed: PlacedOrder | null,
  deps: {
    placeOrder: () => Promise<{ data: { id: string; orderNumber?: string | null } }>;
    createPayment: (orderId: string) => Promise<{ data: object }>;
  },
): Promise<SubmitResult> {
  let order = placed;
  if (!order) {
    try {
      const res = await deps.placeOrder();
      order = { orderId: res.data.id, orderNumber: res.data.orderNumber ?? res.data.id };
    } catch (err) {
      const changed = checkoutChanged(err);
      if (changed) return { kind: "changed", ...changed, order: null };
      return { kind: "error", message: apiErrorMessage(err, "Failed to place order. Please try again."), order: null };
    }
  }
  try {
    const pay = await deps.createPayment(order.orderId);
    const url = (pay.data as { gatewayPageURL?: unknown }).gatewayPageURL;
    if (typeof url === "string" && url) return { kind: "redirect", url, order };
    return { kind: "success", order };
  } catch (err) {
    return {
      kind: "error",
      message: apiErrorMessage(err, "Your order was created, but the payment couldn’t be started. Please try again."),
      order,
    };
  }
}

/** A synchronous re-entrancy guard (state updates are async; a ref-like lock is not). */
export function createSubmitLock() {
  let busy = false;
  return {
    tryAcquire: () => (busy ? false : (busy = true)),
    release: () => {
      busy = false;
    },
    get busy() {
      return busy;
    },
  };
}

/** Why the order can't be placed yet — the page's existing checks, in order. */
export function checkoutBlock(s: {
  hasAddress: boolean;
  payment: "COD" | "ONLINE" | string;
  onlineAvailable: boolean;
  agreedToTerms: boolean;
  signedIn: boolean;
}): string | null {
  if (!s.hasAddress) return "Please select a delivery address.";
  if (s.payment === "ONLINE" && !s.onlineAvailable) return "Online payment isn't available right now. Please choose Cash on Delivery.";
  if (!s.agreedToTerms) return "Please agree to the Terms & Conditions.";
  if (!s.signedIn) return "You need to be signed in to place an order.";
  return null;
}
