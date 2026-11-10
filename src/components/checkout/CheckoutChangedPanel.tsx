"use client";

// components/checkout/CheckoutChangedPanel.tsx
//
// Phase 2 (H-3): shown when placing the order returned 409 CHECKOUT_CHANGED —
// NO order was placed because the server's recomputed quote differs from the
// one the customer reviewed (prices, the warehouses it ships from, delivery
// charges or the total), or prices changed since the items were added and
// need the customer's acknowledgment. It shows what changed and requires an
// explicit "Confirm and place order"; nothing is retried automatically.
// Presentational — the page owns the state and the submit.
import { AlertTriangle, Loader2 } from "lucide-react";
import type { CheckoutQuote } from "@/features/cartWishApi";
import { diffQuotes, formatBDT } from "@/lib/cart/display";

export interface CheckoutChangedPanelProps {
  /** The quote the customer had reviewed (null if unknown). */
  previous: CheckoutQuote | null;
  /** The fresh quote from the server's 409 response. */
  next: CheckoutQuote;
  message: string;
  /** cartItemId → product name, for readable price lines. */
  itemNames: Record<string, string>;
  acknowledged: boolean;
  onAcknowledge: (value: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
  busy: boolean;
}

export function CheckoutChangedPanel(p: CheckoutChangedPanelProps) {
  const diff = p.previous ? diffQuotes(p.previous, p.next) : null;
  const needsAck = p.next.priceChanges.length > 0;
  const name = (id: string) => p.itemNames[id] || "Item";
  return (
    <section role="alert" aria-labelledby="checkout-changed-title" className="rounded-xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-950" data-fm-checkout-changed="">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <h2 id="checkout-changed-title" className="text-base font-semibold text-amber-950">
            Your order changed — nothing has been placed yet
          </h2>
          <p className="mt-1 text-amber-900">{p.message}</p>

          <ul className="mt-3 space-y-1.5">
            {diff?.priceChanges.map((c) => (
              <li key={`p-${c.cartItemId}`} data-fm-change="price">
                {name(c.cartItemId)}: {formatBDT(c.from)} → <b className="font-semibold">{formatBDT(c.to)}</b>
              </li>
            ))}
            {diff?.deliveryChanges.map((c) => (
              <li key={`d-${c.vendorId}`} data-fm-change="delivery">
                Delivery from {c.vendorName}: {c.from === null ? "—" : formatBDT(c.from)} → <b className="font-semibold">{formatBDT(c.to)}</b>
              </li>
            ))}
            {diff?.allocationChanged && (
              <li data-fm-change="allocation">Some items will now ship from a different warehouse.</li>
            )}
            {needsAck &&
              p.next.priceChanges.map((l) => (
                <li key={`a-${l.cartItemId}`} data-fm-change="since-added">
                  {name(l.cartItemId)}: price since you added it {formatBDT(l.cartPrice)} → <b className="font-semibold">{formatBDT(l.price)}</b>
                </li>
              ))}
          </ul>

          <p className="mt-3 flex flex-wrap items-baseline gap-x-2 border-t border-amber-200 pt-3">
            <span>New total</span>
            {diff && diff.totalFrom !== diff.totalTo && <span className="tabular-nums text-amber-700 line-through">{formatBDT(diff.totalFrom)}</span>}
            <b className="text-lg font-semibold tabular-nums" data-fm-new-total="">
              {formatBDT(p.next.grandTotal)}
            </b>
          </p>

          {needsAck && (
            <label className="mt-3 flex cursor-pointer items-start gap-2.5 text-sm">
              <input
                type="checkbox"
                checked={p.acknowledged}
                onChange={(e) => p.onAcknowledge(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-amber-400 accent-teal-700"
                data-fm-ack-prices=""
              />
              <span>I accept the updated prices.</span>
            </label>
          )}

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={p.onConfirm}
              disabled={p.busy || !p.next.complete || (needsAck && !p.acknowledged)}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-teal-700 px-5 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-500"
              data-fm-confirm-changed=""
            >
              {p.busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              Confirm and place order · {formatBDT(p.next.grandTotal)}
            </button>
            <button type="button" onClick={p.onCancel} disabled={p.busy} className="inline-flex h-10 items-center rounded-full px-4 text-sm font-medium text-amber-900 hover:bg-amber-100">
              Back to cart
            </button>
          </div>
          {!p.next.complete && <p className="mt-2 text-xs text-amber-800">Some items can no longer be delivered — please review your cart.</p>}
        </div>
      </div>
    </section>
  );
}
