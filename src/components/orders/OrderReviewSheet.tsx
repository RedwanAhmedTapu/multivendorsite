"use client";

// src/components/orders/OrderReviewSheet.tsx
//
// Detail sheet for one order in the admin review queue. Shows only backend
// facts (ReviewQueueItem) and offers only the actions the backend reported as
// accepted (`item.actions`). Every action goes through a confirmation dialog;
// reject and cancel require a reason (the backend refuses an empty one).
// Full-width on phones, a side panel from `sm` up.

import { useEffect, useId, useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, PackageX, ShieldAlert, XCircle, Ban, Info } from "lucide-react";
import { toast } from "sonner";

import {
  useApproveAdminOrderMutation,
  useCancelAdminOrderMutation,
  useRejectAdminOrderMutation,
  type ReviewQueueItem,
} from "@/features/adminOrderApi";
import {
  ACTION_COPY,
  REASON_MAX,
  REVIEW_REASON_COPY,
  TONE_CLASSES,
  actionErrorMessage,
  formatDateTime,
  formatMoney,
  paymentMethodLabel,
  reviewFacts,
  unavailableReason,
  type ReviewAction,
} from "@/lib/orders/order-review";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
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
import { Textarea } from "@/components/ui/textarea";

export function ReasonBadge({ item }: { item: Pick<ReviewQueueItem, "reviewReason"> }) {
  const copy = REVIEW_REASON_COPY[item.reviewReason];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${TONE_CLASSES[copy.tone]}`}>
      {copy.tone === "danger" ? <ShieldAlert className="size-3.5" aria-hidden /> : null}
      {copy.label}
    </span>
  );
}

function FactTile({ label, value, tone }: { label: string; value: string; tone: keyof typeof TONE_CLASSES }) {
  return (
    <div className={`rounded-xl border px-3 py-2.5 ${TONE_CLASSES[tone]}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wide opacity-80">{label}</p>
      <p className="mt-0.5 text-sm font-semibold leading-snug">{value}</p>
    </div>
  );
}

function Row({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-2 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
      <dt className="text-xs font-medium text-slate-500">{term}</dt>
      <dd className="min-w-0 break-words text-sm text-slate-900 sm:text-right">{children}</dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-1">
      <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">{title}</h3>
      {children}
    </section>
  );
}

const ACTION_BUTTON: Record<ReviewAction, { label: string; icon: typeof CheckCircle2; className: string }> = {
  approve: { label: "Approve", icon: CheckCircle2, className: "bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-600/40" },
  reject: { label: "Reject", icon: XCircle, className: "border border-red-200 bg-white text-red-700 hover:bg-red-50 focus-visible:ring-red-600/30" },
  cancel: { label: "Cancel order", icon: Ban, className: "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 focus-visible:ring-slate-500/30" },
};

interface Props {
  item: ReviewQueueItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after an action succeeded or the backend reported a conflict (409). */
  onSettled?: () => void;
}

export function OrderReviewSheet({ item, open, onOpenChange, onSettled }: Props) {
  const [pending, setPending] = useState<ReviewAction | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const reasonId = useId();
  const [approve, approveState] = useApproveAdminOrderMutation();
  const [reject, rejectState] = useRejectAdminOrderMutation();
  const [cancel, cancelState] = useCancelAdminOrderMutation();
  const busy = approveState.isLoading || rejectState.isLoading || cancelState.isLoading;

  useEffect(() => {
    if (!open) {
      setPending(null);
      setReason("");
      setError(null);
    }
  }, [open]);

  if (!item) return null;
  const facts = reviewFacts(item);
  const reasonCopy = REVIEW_REASON_COPY[item.reviewReason];
  const actions: ReviewAction[] = ["approve", "reject", "cancel"];
  // Reject is the review action for unpaid orders; cancel (which refunds) is
  // offered only when reject is not — i.e. for paid orders.
  const accepted = actions.filter((a) => !unavailableReason(item, a));
  const available = accepted.filter((a) => !(a === "cancel" && accepted.includes("reject")));
  const unavailable = actions.map((a) => unavailableReason(item, a)).filter((r): r is string => !!r);
  const dialog = pending ? ACTION_COPY[pending] : null;
  const trimmed = reason.trim();

  const openDialog = (action: ReviewAction) => {
    setPending(action);
    setReason("");
    setError(null);
  };

  const run = async () => {
    if (!pending || busy) return;
    if (ACTION_COPY[pending].needsReason && !trimmed) {
      setError("Enter a reason.");
      return;
    }
    try {
      if (pending === "approve") await approve({ id: item.id }).unwrap();
      else if (pending === "reject") await reject({ id: item.id, reason: trimmed }).unwrap();
      else await cancel({ id: item.id, reason: trimmed }).unwrap();
      const done = pending === "approve" ? "approved" : pending === "reject" ? "rejected" : "cancelled";
      toast.success(`Order ${item.orderNumber} ${done}`);
      setPending(null);
      onOpenChange(false);
      onSettled?.();
    } catch (e) {
      const message = actionErrorMessage(e);
      setError(message);
      toast.error(message);
      if ((e as { status?: unknown })?.status === 409) onSettled?.();
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        {/* The shared close button is the last child of the content; enlarge it to a 44px target here without changing ui/sheet. */}
        <SheetContent
          side="right"
          className="w-full gap-0 overflow-y-auto bg-white p-0 sm:max-w-lg [&>button:last-child]:top-2 [&>button:last-child]:right-2 [&>button:last-child]:flex [&>button:last-child]:size-11 [&>button:last-child]:items-center [&>button:last-child]:justify-center [&>button:last-child]:rounded-lg [&>button:last-child]:hover:bg-slate-200/60 [&>button:last-child>svg]:size-5"
        >
          <SheetHeader className="gap-2 border-b border-slate-200 bg-slate-50/80 py-4 pl-4 pr-14 sm:pl-6">
            <div className="flex flex-wrap items-center gap-2">
              <ReasonBadge item={item} />
              <span className="text-xs text-slate-500">Placed {formatDateTime(item.createdAt)}</span>
            </div>
            <SheetTitle className="break-all font-mono text-lg font-bold text-slate-900">{item.orderNumber}</SheetTitle>
            <SheetDescription className="text-sm leading-relaxed text-slate-600">{reasonCopy.explanation}</SheetDescription>
          </SheetHeader>

          <div className="space-y-6 px-4 py-5 sm:px-6">
            <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-3">
              <FactTile {...facts.payment} />
              <FactTile {...facts.order} />
              <FactTile {...facts.stock} />
            </div>

            {!item.stockReserved ? (
              <div role="note" className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                <PackageX className="mt-0.5 size-5 shrink-0" aria-hidden />
                <div className="space-y-1">
                  <p className="font-semibold">Stock reservation released{item.reservationReleasedAt ? ` on ${formatDateTime(item.reservationReleasedAt)}` : ""}</p>
                  <p className="leading-relaxed">
                    The reserved items went back to inventory and may have been sold since. This order can't be confirmed, and stock can't be
                    re-reserved from here.{" "}
                    {item.payment?.status === "PAID" ? "Cancel the order to create the customer's refund." : "Reject the order."}
                  </p>
                </div>
              </div>
            ) : null}

            <Section title="Payment">
              <dl className="divide-y divide-slate-100">
                <Row term="Order total">{formatMoney(item.totalAmount)}</Row>
                <Row term="Method">{paymentMethodLabel(item.paymentMethod)}</Row>
                {item.payment ? (
                  <>
                    <Row term="Payment record">{`${paymentMethodLabel(item.payment.method)} · ${item.payment.status.toLowerCase()}`}</Row>
                    <Row term="Amount">{formatMoney(item.payment.amount)}</Row>
                    <Row term="Paid at">{formatDateTime(item.payment.paidAt)}</Row>
                    {item.payment.stockHold ? <Row term="Hold">Paid after the stock was released</Row> : null}
                  </>
                ) : (
                  <Row term="Payment record">None</Row>
                )}
                <Row term="Risk score">
                  {item.riskScore === null ? (
                    "Not scored"
                  ) : (
                    <span className={item.highRisk ? "font-semibold text-red-700" : undefined}>
                      {item.riskScore.toFixed(0)} / 100{item.highRisk ? " · high" : ""}
                    </span>
                  )}
                </Row>
              </dl>
            </Section>

            <Section title="Customer">
              {item.customer ? (
                <dl className="divide-y divide-slate-100">
                  <Row term="Name">{item.customer.name}</Row>
                  <Row term="Email">{item.customer.email}</Row>
                  <Row term="Phone">{item.customer.phone || "—"}</Row>
                  <Row term="Account">{item.customer.verified ? "Verified" : "Not verified"}</Row>
                  <Row term="Member since">{formatDateTime(item.customer.memberSince)}</Row>
                  <Row term="Cancelled, returned or failed orders">
                    <span className={item.customer.problemOrders > 0 ? "font-semibold text-amber-700" : undefined}>{item.customer.problemOrders}</span>
                  </Row>
                </dl>
              ) : (
                <p className="text-sm text-slate-500">No customer record.</p>
              )}
            </Section>

            <Section title="Ship to">
              {item.shipTo ? (
                <p className="text-sm leading-relaxed text-slate-900">
                  {item.shipTo.name}
                  <br />
                  {item.shipTo.address}, {item.shipTo.city}
                </p>
              ) : (
                <p className="text-sm text-slate-500">No address on the order.</p>
              )}
            </Section>

            <Section title={`Vendors (${item.vendors.length})`}>
              <ul className="divide-y divide-slate-100">
                {item.vendors.map((v) => (
                  <li key={v.id} className="flex items-baseline justify-between gap-3 py-2 text-sm">
                    <span className="min-w-0 truncate text-slate-900">{v.storeName}</span>
                    <span className="shrink-0 text-slate-600">
                      {v.items} {v.items === 1 ? "item" : "items"} · {formatMoney(v.subtotal)}
                    </span>
                  </li>
                ))}
              </ul>
            </Section>

            {unavailable.length > 0 ? (
              <Section title="Unavailable actions">
                <ul className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  {unavailable.map((r) => (
                    <li key={r} className="flex gap-2 text-sm leading-relaxed text-slate-700">
                      <Info className="mt-0.5 size-4 shrink-0 text-slate-500" aria-hidden />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </Section>
            ) : null}
          </div>

          <div className="sticky bottom-0 mt-auto border-t border-slate-200 bg-white px-4 py-3 sm:px-6">
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              {available.map((a) => {
                const b = ACTION_BUTTON[a];
                const Icon = b.icon;
                return (
                  <Button key={a} type="button" onClick={() => openDialog(a)} disabled={busy} className={`h-11 w-full sm:w-auto ${b.className}`}>
                    <Icon aria-hidden />
                    {b.label}
                  </Button>
                );
              })}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!pending} onOpenChange={(o) => (!o && !busy ? setPending(null) : undefined)}>
        {dialog && pending ? (
          <AlertDialogContent className="max-w-[calc(100%-2rem)] sm:max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle>{dialog.title}</AlertDialogTitle>
              <AlertDialogDescription className="leading-relaxed">
                <span className="font-mono font-semibold text-slate-900">{item.orderNumber}</span> · {formatMoney(item.totalAmount)}. {dialog.body(item)}
              </AlertDialogDescription>
            </AlertDialogHeader>
            {dialog.needsReason ? (
              <div className="space-y-1.5">
                <label htmlFor={reasonId} className="text-sm font-medium text-slate-800">
                  Reason <span className="text-red-600">*</span>
                </label>
                <Textarea
                  id={reasonId}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  maxLength={REASON_MAX}
                  rows={3}
                  aria-invalid={!!error && !trimmed}
                  placeholder={pending === "reject" ? "e.g. Customer unreachable for verification" : "e.g. Stock no longer available"}
                  className="text-base sm:text-sm"
                />
                <p className="text-right text-xs text-slate-500">
                  {reason.length}/{REASON_MAX}
                </p>
              </div>
            ) : null}
            {error ? (
              <p role="alert" className="flex gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
                <span>{error}</span>
              </p>
            ) : null}
            <AlertDialogFooter className="gap-2">
              <AlertDialogCancel disabled={busy} className="h-11 sm:h-9">
                Keep order
              </AlertDialogCancel>
              <Button
                type="button"
                onClick={run}
                disabled={busy || (dialog.needsReason && !trimmed)}
                className={`h-11 sm:h-9 ${pending === "approve" ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-red-600 text-white hover:bg-red-700"}`}
              >
                {busy ? <Loader2 className="animate-spin" aria-hidden /> : null}
                {busy ? "Working…" : dialog.confirm}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        ) : null}
      </AlertDialog>
    </>
  );
}
