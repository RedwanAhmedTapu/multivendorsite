"use client";

// src/components/orders/customer/OrderCustomerActions.tsx
//
// Pay Now + cancel for the customer's order detail page. What is offered comes
// from the backend (`order.customerActions`, derived from the rules the
// endpoints enforce); both endpoints re-check.
//  - Pay Now asks the backend to open a gateway session and follows ONLY the
//    https page URL it returns. Nothing here claims the order is paid — the
//    payment result page reads the persisted state after the gateway returns.
//  - Cancel goes through a confirmation dialog; 409 (courier booking active)
//    and other refusals are shown, and the order is refreshed either way.

import { useId, useState } from "react";
import { AlertTriangle, Ban, CreditCard, Info, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";

import { useCancelOrderMutation, usePayNowMutation, type OrderDetail } from "@/features/userorderApi";
import {
  CANCEL_BLOCKED_COPY,
  CANCEL_REASONS,
  cancelErrorMessage,
  formatTaka,
  isPaid,
  payNowErrorMessage,
  safeGatewayUrl,
} from "@/lib/orders/customer-order-actions";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface Props {
  order: Pick<OrderDetail, "id" | "orderNumber" | "status" | "paymentStatus" | "totalAmount" | "customerActions">;
  /** Navigation to the gateway page (replaced in tests). */
  redirect?: (url: string) => void;
}

export function OrderCustomerActions({ order, redirect = (url) => window.location.assign(url) }: Props) {
  const actions = order.customerActions;
  const [payNow, payState] = usePayNowMutation();
  const [cancelOrder, cancelState] = useCancelOrderMutation();
  const [payError, setPayError] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [reason, setReason] = useState<string>("");
  const [cancelError, setCancelError] = useState<string | null>(null);
  const groupId = useId();

  if (!actions) return null;
  const blockedCopy = actions.cancelBlockedReason ? CANCEL_BLOCKED_COPY[actions.cancelBlockedReason] : null;
  if (!actions.canPayNow && !actions.canCancel && !blockedCopy) return null;

  const paid = isPaid(order.paymentStatus);
  const amount = formatTaka(order.totalAmount);
  const busyPaying = payState.isLoading || redirecting;

  const startPayment = async () => {
    if (busyPaying) return;
    setPayError(null);
    try {
      const res = await payNow({ orderId: order.id }).unwrap();
      const url = safeGatewayUrl(res?.data?.gatewayPageURL);
      if (!url) {
        setPayError("We couldn't open the payment page. Please try again.");
        return;
      }
      setRedirecting(true);
      redirect(url);
    } catch (e) {
      setPayError(payNowErrorMessage(e));
    }
  };

  const confirmCancel = async () => {
    if (cancelState.isLoading || !reason) return;
    setCancelError(null);
    try {
      const res = await cancelOrder({ orderId: order.id, reason }).unwrap();
      setConfirmOpen(false);
      const refundCreated = paid && (res?.data?.refunds?.length ?? 0) > 0;
      toast.success(refundCreated ? "Order cancelled. Your refund request is listed under Refunds." : "Order cancelled.");
    } catch (e) {
      setCancelError(cancelErrorMessage(e));
    }
  };

  return (
    <section aria-labelledby="order-actions-title" className="mb-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
      <h2 id="order-actions-title" className="sr-only">
        Order actions
      </h2>

      {actions.canPayNow ? (
        <div className="flex flex-col gap-3 border-b border-slate-100 bg-amber-50/60 p-4 last:border-b-0 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:p-5">
          <div className="flex gap-3">
            <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <CreditCard className="size-4" aria-hidden />
            </span>
            <div>
              <p className="font-semibold text-slate-900">Payment pending</p>
              <p className="mt-0.5 text-sm leading-relaxed text-slate-600">
                This order isn&apos;t paid yet. Pay {amount} online to have it confirmed.
              </p>
            </div>
          </div>
          <Button
            type="button"
            onClick={startPayment}
            disabled={busyPaying}
            aria-busy={busyPaying}
            className="h-11 w-full shrink-0 bg-blue-600 px-5 text-white hover:bg-blue-700 sm:w-auto"
          >
            {busyPaying ? <Loader2 className="animate-spin" aria-hidden /> : <Lock aria-hidden />}
            {redirecting ? "Opening payment page…" : payState.isLoading ? "Preparing payment…" : `Pay ${amount}`}
          </Button>
          {payError ? (
            <p role="alert" className="flex gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm text-red-700 sm:basis-full">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>{payError}</span>
            </p>
          ) : null}
        </div>
      ) : null}

      {actions.canCancel ? (
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <p className="text-sm leading-relaxed text-slate-600">
            {paid
              ? "You can still cancel this order. The amount you paid will be refunded."
              : "You can still cancel this order before it is handed to the courier."}
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setReason("");
              setCancelError(null);
              setConfirmOpen(true);
            }}
            className="h-11 w-full shrink-0 border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800 sm:w-auto"
          >
            <Ban aria-hidden />
            Cancel order
          </Button>
        </div>
      ) : blockedCopy ? (
        <p className="flex gap-2 p-4 text-sm leading-relaxed text-slate-600 sm:p-5">
          <Info className="mt-0.5 size-4 shrink-0 text-slate-400" aria-hidden />
          <span>{blockedCopy}</span>
        </p>
      ) : null}

      <AlertDialog open={confirmOpen} onOpenChange={(o) => (!cancelState.isLoading ? setConfirmOpen(o) : undefined)}>
        <AlertDialogContent className="max-w-[calc(100%-2rem)] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this order?</AlertDialogTitle>
            <AlertDialogDescription className="leading-relaxed">
              {order.orderNumber ? <span className="font-semibold text-slate-900">{order.orderNumber}</span> : "This order"} · {amount}.{" "}
              {paid
                ? "A refund request for the amount you paid is created; you can follow its status on this page."
                : "Nothing has been charged for this order."}{" "}
              This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <fieldset className="space-y-2">
            <legend className="mb-1 text-sm font-medium text-slate-800">Why are you cancelling?</legend>
            {CANCEL_REASONS.map((r) => (
              <label
                key={r}
                className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-slate-200 px-3 text-sm text-slate-700 has-[:checked]:border-blue-400 has-[:checked]:bg-blue-50"
              >
                <input type="radio" name={groupId} value={r} checked={reason === r} onChange={() => setReason(r)} className="size-4 accent-blue-600" />
                {r}
              </label>
            ))}
          </fieldset>
          {cancelError ? (
            <p role="alert" className="flex gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>{cancelError}</span>
            </p>
          ) : null}
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel disabled={cancelState.isLoading} className="h-11 sm:h-9">
              Keep order
            </AlertDialogCancel>
            <Button type="button" onClick={confirmCancel} disabled={!reason || cancelState.isLoading} className="h-11 bg-red-600 text-white hover:bg-red-700 sm:h-9">
              {cancelState.isLoading ? <Loader2 className="animate-spin" aria-hidden /> : null}
              {cancelState.isLoading ? "Cancelling…" : "Cancel order"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
