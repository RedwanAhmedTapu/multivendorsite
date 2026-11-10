"use client";

// lib/analytics/useAnalytics.ts
//
// React hooks for the two browser-sent analytics events. Both are
// fire-and-forget: failures are ignored and never affect the page.

import { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";
import { useTrackAnalyticsEventsMutation } from "@/features/businessAdvisorApi";
import { isShopper, shouldRecordView, type AnalyticsSource } from "./tracker";

/** A genuine product-detail view: once per product per 30 min in this browser session. */
export function useTrackProductView(productId: string | null | undefined, source: AnalyticsSource = "PRODUCT_PAGE") {
  const role = useSelector((s: RootState) => (s.auth?.user as { role?: string } | null)?.role);
  const [track] = useTrackAnalyticsEventsMutation();
  useEffect(() => {
    if (!productId || !isShopper(role)) return;
    if (!shouldRecordView(productId)) return;
    track({ events: [{ type: "PRODUCT_VIEW", productId, source }] });
    // role is read at mount; a login mid-view doesn't make it a second view
  }, [productId]);
}

/**
 * "Checkout opened" — sent once per checkout page mount when a signed-in
 * shopper has selected items. The server reads WHICH products from the cart
 * itself and counts the same checkout once per 30 minutes.
 */
export function useTrackCheckoutStarted(ready: boolean) {
  const user = useSelector((s: RootState) => s.auth?.user as { id?: string; role?: string } | null);
  const [track] = useTrackAnalyticsEventsMutation();
  const sent = useRef(false);
  useEffect(() => {
    if (!ready || sent.current || !user?.id || !isShopper(user.role)) return;
    sent.current = true;
    track({ events: [{ type: "CHECKOUT_STARTED" }] });
  }, [ready, user?.id, user?.role, track]);
}
