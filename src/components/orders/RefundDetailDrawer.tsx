// src/components/orders/RefundDetailDrawer.tsx
//
// 1C-9 — Admin refund detail drawer (Phases 2–5).
// Consumes the 1C-8 RTK layer: getAdminRefundById + getAdminRefundSummary +
// approveAdminRefund/rejectAdminRefund. Read-only except the approve/reject
// mutations (which the backend gates). Physical returns are DISPLAY-ONLY —
// creation stays exclusively via the vendor confirm-return flow.

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertCircle, Clock, CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { PaymentStatusBadge } from "./OrderStatusBadge";

import {
  useGetAdminRefundByIdQuery,
  useGetAdminRefundSummaryQuery,
  useApproveAdminRefundMutation,
  useRejectAdminRefundMutation,
  type RefundDetail,
  type RefundVendorReturn,
  type RefundStatus,
} from "@/features/adminOrderApi";

// ── presentation formatters (Decimal-safe) ──────────────────────────────────
// Backend money values are Prisma Decimal-serialized STRINGS; never parse them
// into the RTK layer — normalize only at this presentation boundary.
export function fmtMoney(v?: string | number | null): string {
  if (v === null || v === undefined || v === "") return "—";
  const n = typeof v === "string" ? Number(v) : v;
  if (!Number.isFinite(n)) return String(v);
  return `৳${n.toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function fmtDate(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("en-BD", { dateStyle: "medium", timeStyle: "short" });
}

export const REFUND_STATUS_CONFIG: Record<
  RefundStatus,
  { label: string; cls: string; icon: "pending" | "approved" | "processing" | "refunded" | "failed" | "rejected" | "cancelled" }
> = {
  PENDING: { label: "Pending", cls: "bg-amber-50 text-amber-700 border-amber-200", icon: "pending" },
  APPROVED: { label: "Approved", cls: "bg-blue-50 text-blue-700 border-blue-200", icon: "approved" },
  PROCESSING: { label: "Processing", cls: "bg-indigo-50 text-indigo-700 border-indigo-200", icon: "processing" },
  REFUNDED: { label: "Refunded", cls: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: "refunded" },
  FAILED: { label: "Failed", cls: "bg-red-50 text-red-700 border-red-200", icon: "failed" },
  REJECTED: { label: "Rejected", cls: "bg-slate-100 text-slate-600 border-slate-200", icon: "rejected" },
  CANCELLED: { label: "Cancelled", cls: "bg-slate-100 text-slate-500 border-slate-200", icon: "cancelled" },
};

export function RefundStatusBadge({ status }: { status: RefundStatus }) {
  const cfg = REFUND_STATUS_CONFIG[status] ?? REFUND_STATUS_CONFIG.PENDING;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-xs font-medium ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

function ConditionBadge({ condition }: { condition: string }) {
  const sellable = condition === "SELLABLE";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] font-medium ${sellable ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}`}>
      {sellable ? "Sellable" : "Damaged"}
    </span>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
      {children}
    </h3>
  );
}

function Row({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5">
      <span className="text-xs text-slate-500">{label}</span>
      <span className={`text-xs text-slate-900 text-right break-all ${mono ? "font-mono" : "font-medium"}`}>{value}</span>
    </div>
  );
}

// ── Vendor returns (Phase 3) ────────────────────────────────────────────────
export function VendorReturnCard({ vr }: { vr: RefundVendorReturn }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-mono text-slate-700">…{vr.id.slice(-12)}</span>
        <div className="flex items-center gap-1.5">
          <ConditionBadge condition={vr.condition} />
          <span className="text-[11px] text-slate-500">{vr.status}</span>
        </div>
      </div>
      <Row label="Vendor order" value={`…${vr.vendorOrderId.slice(-12)}`} mono />
      {vr.refundId ? (
        <Row label="Linked refund" value={<span className="inline-flex items-center gap-1 text-emerald-700"><CheckCircle2 className="w-3 h-3" />consumed by this refund</span>} />
      ) : (
        <Row label="Linked refund" value={<span className="text-slate-400">not linked to a refund</span>} />
      )}
      <Row label="Confirmed" value={fmtDate(vr.confirmedAt)} />
      {vr.confirmedBy && <Row label="Confirmed by" value={`…${vr.confirmedBy.slice(-10)}`} mono />}
      {vr.note && <Row label="Note" value={vr.note} />}
      <div className="rounded-lg bg-slate-50 border border-slate-100 overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-slate-400 border-b border-slate-100">
              <th className="text-left font-medium px-2 py-1.5">Order item</th>
              <th className="text-left font-medium px-2 py-1.5">Variant</th>
              <th className="text-right font-medium px-2 py-1.5">Qty returned</th>
            </tr>
          </thead>
          <tbody>
            {vr.items.map((it) => (
              <tr key={it.id} className="border-b border-slate-100 last:border-0">
                <td className="px-2 py-1.5 font-mono text-slate-600">…{it.orderItemId.slice(-10)}</td>
                <td className="px-2 py-1.5 font-mono text-slate-600">…{it.variantId.slice(-10)}</td>
                <td className="px-2 py-1.5 text-right font-semibold text-slate-900">{it.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Gateway state (Phase 2) — exported for verification ───────────────────
export function GatewayStateBlock({ detail }: { detail?: RefundDetail["detail"] }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between mb-2">
        <SectionTitle>Gateway state</SectionTitle>
        {detail ? <RefundStatusBadge status={detail.status} /> : null}
      </div>
      {!detail ? (
        <p className="text-xs text-slate-400">No gateway record for this refund.</p>
      ) : (
        <>
          {detail.status === "FAILED" && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 mb-2 flex items-start gap-2">
              <XCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-red-700">Gateway refund failed</p>
                {detail.failedReason && <p className="text-xs text-red-600 mt-0.5">{detail.failedReason}</p>}
                {detail.failedAt && <p className="text-[11px] text-red-500 mt-1 font-mono">{fmtDate(detail.failedAt)}</p>}
              </div>
            </div>
          )}
          {detail.status === "PROCESSING" && (
            <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-3 mb-2 flex items-start gap-2">
              <Clock className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-indigo-700">
                The gateway outcome is not confirmed yet. The refund amount remains reserved.
              </p>
            </div>
          )}
          {detail.status === "REFUNDED" && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 mb-2 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-emerald-700">The gateway confirmed this refund.</p>
            </div>
          )}
          <Row label="Record status" value={detail.status} />
          {detail.failedReason && <Row label="Failure reason" value={detail.failedReason} />}
          {detail.failedAt && <Row label="Failed at" value={fmtDate(detail.failedAt)} />}
          {detail.sslRefundRefId && <Row label="Gateway refund ref" value={detail.sslRefundRefId} mono />}
        </>
      )}
    </div>
  );
}

// ── Refundable summary (Phase 4) — exported for verification ──────────────
export function RefundSummaryBlock({
  summary,
  isLoading,
  isError,
}: {
  summary?: import("@/features/adminOrderApi").RefundSummary;
  isLoading: boolean;
  isError: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <SectionTitle>Refundable summary</SectionTitle>
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ) : isError || !summary ? (
        <p className="text-xs text-slate-400">Refundable summary is unavailable for this order.</p>
      ) : (
        <>
          <Row label="Payment amount" value={fmtMoney(summary.paymentAmount)} mono />
          <Row label="Consumed refunds" value={fmtMoney(summary.consumedRefundAmount)} mono />
          <Row label="Remaining refundable" value={fmtMoney(summary.remainingRefundableAmount)} mono />
          <Separator className="my-2" />
          <Row label="Payment status" value={summary.paymentStatus ? <PaymentStatusBadge status={summary.paymentStatus} /> : "—"} />
          <Row label="Order payment status" value={<PaymentStatusBadge status={summary.orderPaymentStatus} />} />
          {summary.paymentId && <Row label="Payment ID" value={summary.paymentId} mono />}
        </>
      )}
    </div>
  );
}


// ── main drawer ─────────────────────────────────────────────────────────────
export function RefundDetailDrawer({
  refundId,
  onClose,
}: {
  refundId: string | null;
  onClose: () => void;
}) {
  const [confirmAction, setConfirmAction] = useState<"approve" | "reject" | null>(null);
  const [persistedNotice, setPersistedNotice] = useState<string | null>(null);

  const {
    data: refundEnvelope,
    isLoading,
    isError,
    refetch,
  } = useGetAdminRefundByIdQuery(refundId ?? "", { skip: !refundId });

  const refund: RefundDetail | undefined = refundEnvelope?.data;
  const orderId = refund?.orderId ?? null;

  // Phase 4 — the backend summary is authoritative; no frontend accounting.
  const {
    data: summaryEnvelope,
    isLoading: summaryLoading,
    isError: summaryError,
    refetch: refetchSummary,
  } = useGetAdminRefundSummaryQuery(orderId ?? "", { skip: !orderId });

  const [approveAdminRefund, { isLoading: approving }] = useApproveAdminRefundMutation();
  const [rejectAdminRefund, { isLoading: rejecting }] = useRejectAdminRefundMutation();

  const summary = summaryEnvelope?.data;
  const mutating = approving || rejecting;

  // Phase 5 — a mutation HTTP 400 is NOT proof nothing changed: the backend
  // persists FAILED (definitive rejection) or keeps PROCESSING (unknown
  // outcome). Refresh the persisted state and surface it explicitly.
  const refreshAfterOutcome = async (backendMessage?: string) => {
    if (backendMessage) toast.error(backendMessage);
    try {
      await refetch();
      await refetchSummary();
      const detail = refundEnvelope?.data;
      const recordStatus = detail?.detail?.status;
      if (recordStatus === "FAILED") {
        setPersistedNotice("The gateway definitively rejected this refund. The persisted state is FAILED and the amount has been released back to the refundable balance.");
      } else if (recordStatus === "PROCESSING" || detail?.status === "APPROVED") {
        setPersistedNotice("The gateway outcome is unknown. The refund remains PROCESSING and the amount stays reserved — do not retry without reconciliation.");
      } else {
        setPersistedNotice(null);
      }
    } catch {
      setPersistedNotice("The refund state could not be refreshed — the gateway outcome may still be pending.");
    }
  };

  const handleApprove = async () => {
    if (!refundId || mutating) return;
    setConfirmAction(null);
    try {
      const res = await approveAdminRefund({ refundId, amount: Number(refund?.amount) }).unwrap();
      setPersistedNotice(null);
      toast.success(`Refund approved — payment is now ${res.data.paymentStatus ?? "updated"}`);
    } catch (err: any) {
      await refreshAfterOutcome(err?.data?.message ?? err?.error ?? "Refund approval failed");
    }
  };

  const handleReject = async () => {
    if (!refundId || mutating) return;
    setConfirmAction(null);
    try {
      await rejectAdminRefund({ refundId, reason: "Rejected by admin" }).unwrap();
      setPersistedNotice(null);
      toast.success("Refund request rejected");
    } catch (err: any) {
      await refreshAfterOutcome(err?.data?.message ?? err?.error ?? "Refund rejection failed");
    }
  };

  const detail = refund?.detail;
  const isPending = refund?.status === "PENDING";
  const canDecide = isPending && !mutating;

  return (
    <Sheet open={!!refundId} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[520px] p-0 flex flex-col bg-[#F7F8FA]"
      >
        <SheetHeader className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-900 to-slate-800 flex-shrink-0">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-slate-300" />
            <SheetTitle className="text-white text-base font-semibold">Refund detail</SheetTitle>
          </div>
          <SheetDescription className="text-slate-400 text-xs">
            {refundId ? `Refund …${refundId.slice(-16)}` : ""}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Loading / error / data */}
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-32 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>
          ) : isError || !refund ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
              <AlertCircle className="w-8 h-8 opacity-40" />
              <p className="text-sm">Failed to load refund detail. Please try again.</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
            </div>
          ) : (
            <>
              {/* Persisted-outcome notice (FAILED / PROCESSING) — Phase 2/5 */}
              {persistedNotice && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 flex items-start gap-2">
                  <Clock className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-amber-800">{persistedNotice}</p>
                </div>
              )}

              {/* REFUND */}
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between mb-2">
                  <SectionTitle>Refund</SectionTitle>
                  <RefundStatusBadge status={refund.status} />
                </div>
                <Row label="Refund ID" value={refund.id} mono />
                <Row label="Order ID" value={refund.orderId} mono />
                <Row label="Amount" value={fmtMoney(refund.amount)} mono />
                <Row label="Type" value={refund.detail?.refundType ?? "—"} />
                <Row label="Requested" value={fmtDate(refund.createdAt)} />
                {refund.processedAt && <Row label="Processed" value={fmtDate(refund.processedAt)} />}
                {refund.reason && <Row label="Reason" value={refund.reason} />}
              </div>

              {/* REFUND RECORD / GATEWAY STATE (Phase 2) */}
              <GatewayStateBlock detail={detail} />

              {/* PHASE 4 — refund summary (backend authoritative) */}
              <RefundSummaryBlock summary={summary} isLoading={summaryLoading} isError={summaryError} />

              {/* PHASE 3 — associated vendor returns */}
              <div>
                <SectionTitle>Associated vendor returns ({refund.returns?.length ?? 0})</SectionTitle>
                {(refund.returns?.length ?? 0) === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-white p-4 text-center">
                    <p className="text-xs text-slate-400">No physical returns are linked to this refund.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {refund.returns.map((vr) => (
                      <VendorReturnCard key={vr.id} vr={vr} />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Phase 5 — approve / reject (only meaningful while PENDING) */}
        <div className="flex-shrink-0 px-6 py-3 border-t border-slate-100 bg-white flex items-center justify-between gap-2">
          <p className="text-[11px] text-slate-400 font-mono truncate">{refundId?.slice(-16)}</p>
          {isPending ? (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                disabled={mutating || !canDecide}
                onClick={() => setConfirmAction("reject")}
              >
                Reject
              </Button>
              <Button
                size="sm"
                className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700"
                disabled={mutating || !canDecide}
                onClick={() => setConfirmAction("approve")}
              >
                {approving ? "Approving…" : "Approve refund"}
              </Button>
            </div>
          ) : (
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 text-xs flex-shrink-0">
              Close
            </Button>
          )}
        </div>

        {/* Phase 5 — confirmation dialogs */}
        <AlertDialog open={confirmAction === "approve"} onOpenChange={(v) => !v && setConfirmAction(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Approve this refund?</AlertDialogTitle>
              <AlertDialogDescription>
                {fmtMoney(refund?.amount)} will be refunded to the customer. Non-goodwill refunds require a
                vendor-confirmed physical return. If the gateway rejects the refund, the persisted state becomes FAILED
                and the amount is released back to the refundable balance.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-emerald-600 hover:bg-emerald-700"
                disabled={mutating}
                onClick={(e) => {
                  e.preventDefault();
                  void handleApprove();
                }}
              >
                {approving ? "Approving…" : "Approve"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={confirmAction === "reject"} onOpenChange={(v) => !v && setConfirmAction(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reject this refund request?</AlertDialogTitle>
              <AlertDialogDescription>
                The request will be marked REJECTED and will not consume any refundable balance.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700"
                disabled={mutating}
                onClick={(e) => {
                  e.preventDefault();
                  void handleReject();
                }}
              >
                {rejecting ? "Rejecting…" : "Reject request"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SheetContent>
    </Sheet>
  );
}
