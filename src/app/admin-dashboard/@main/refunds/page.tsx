"use client";

// src/app/admin-dashboard/@main/refunds/page.tsx
//
// 1C-9 Phase 1 — Admin refund list. Server-side pagination + filters
// (status / orderId / refundId) against GET /api/admin-orders/refunds.
// Row click opens the refund detail drawer (Phases 2–5).

import { useCallback, useMemo, useState } from "react";
import { RotateCcw, AlertCircle, Search } from "lucide-react";
import { toast } from "sonner";

import {
  useGetAllAdminRefundsQuery,
  type RefundListFilters,
  type RefundStatus,
  type Refund,
} from "@/features/adminOrderApi";
import { PaymentStatusBadge } from "@/components/orders/OrderStatusBadge";
import {
  RefundDetailDrawer,
  RefundStatusBadge,
  REFUND_STATUS_CONFIG,
  fmtMoney,
  fmtDate,
} from "@/components/orders/RefundDetailDrawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const REFUND_STATUSES = Object.keys(REFUND_STATUS_CONFIG) as RefundStatus[];

export default function AdminRefundsPage() {
  const [status, setStatus] = useState<RefundStatus | "ALL">("ALL");
  const [orderIdInput, setOrderIdInput] = useState("");
  const [refundIdInput, setRefundIdInput] = useState("");
  const [applied, setApplied] = useState<{ orderId?: string; refundId?: string }>({});
  const [page, setPage] = useState(1);
  const [selectedRefundId, setSelectedRefundId] = useState<string | null>(null);

  // Only send defined, non-empty params (1C-8 endpoint drops undefined, but
  // empty strings would still serialize).
  const queryParams: RefundListFilters = useMemo(() => {
    const q: RefundListFilters = { page, limit: 15 };
    if (status !== "ALL") q.status = status;
    if (applied.orderId) q.orderId = applied.orderId;
    if (applied.refundId) q.refundId = applied.refundId;
    return q;
  }, [status, applied, page]);

  const { data, isLoading, isError, isFetching, refetch } =
    useGetAllAdminRefundsQuery(queryParams);

  const refunds = data?.data ?? [];
  const pagination = data?.pagination;

  const handleApplyFilters = useCallback(() => {
    const orderId = orderIdInput.trim();
    const refundId = refundIdInput.trim();
    setApplied({
      ...(orderId ? { orderId } : {}),
      ...(refundId ? { refundId } : {}),
    });
    setPage(1);
  }, [orderIdInput, refundIdInput]);

  const handleReset = useCallback(() => {
    setStatus("ALL");
    setOrderIdInput("");
    setRefundIdInput("");
    setApplied({});
    setPage(1);
  }, []);

  const handleRefresh = useCallback(() => {
    refetch();
    toast.success("Refunds refreshed");
  }, [refetch]);

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative container mx-auto px-4 sm:px-6 py-8 max-w-[1400px] space-y-6">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-900/20">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h1
                className="text-2xl font-black tracking-tight text-slate-900"
                style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
              >
                Refunds
              </h1>
              <p className="text-xs text-slate-500 -mt-0.5">Refund requests, gateway state and refundable balance</p>
            </div>
          </div>
          {pagination && (
            <div className="px-3 py-1.5 bg-white rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs text-slate-500">
                <span className="font-bold text-slate-900 text-sm font-mono">
                  {pagination.total.toLocaleString()}
                </span>{" "}
                refunds total
              </p>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col md:flex-row gap-3 md:items-end">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-500">Status</label>
              <Select
                value={status}
                onValueChange={(v) => {
                  setStatus(v as RefundStatus | "ALL");
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[180px] h-9 text-xs">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All statuses</SelectItem>
                  {REFUND_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {REFUND_STATUS_CONFIG[s].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 flex-1">
              <label className="text-[11px] font-medium text-slate-500">Order ID</label>
              <Input
                className="h-9 text-xs font-mono"
                placeholder="exact order id"
                value={orderIdInput}
                onChange={(e) => setOrderIdInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleApplyFilters()}
              />
            </div>
            <div className="space-y-1 flex-1">
              <label className="text-[11px] font-medium text-slate-500">Refund ID</label>
              <Input
                className="h-9 text-xs font-mono"
                placeholder="exact refund id"
                value={refundIdInput}
                onChange={(e) => setRefundIdInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleApplyFilters()}
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="h-9 text-xs" onClick={handleApplyFilters}>
                <Search className="w-3.5 h-3.5 mr-1" /> Apply
              </Button>
              <Button size="sm" variant="outline" className="h-9 text-xs" onClick={handleReset}>
                Reset
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-9 text-xs"
                onClick={handleRefresh}
                disabled={isFetching}
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80">
                <TableHead className="pl-4">Refund</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead className="pr-4 text-right">Processed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i} className="animate-pulse">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}>
                        <div className="h-4 bg-slate-100 rounded w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
                      <AlertCircle className="w-8 h-8 opacity-40" />
                      <p className="text-sm">Failed to load refunds. Please try again.</p>
                      <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : refunds.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
                      <RotateCcw className="w-10 h-10 opacity-20" />
                      <p className="text-sm font-medium">No refunds found</p>
                      <p className="text-xs">Try adjusting your filters</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                refunds.map((refund: Refund) => (
                  <TableRow
                    key={refund.id}
                    className="hover:bg-slate-50/60 transition-colors cursor-pointer"
                    onClick={() => setSelectedRefundId(refund.id)}
                  >
                    <TableCell className="pl-4 font-mono text-xs text-slate-600">
                      …{refund.id.slice(-12)}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate-600">
                      …{refund.orderId.slice(-12)}
                    </TableCell>
                    <TableCell className="text-sm font-semibold text-slate-900 font-mono">
                      {fmtMoney(refund.amount)}
                    </TableCell>
                    <TableCell>
                      <RefundStatusBadge status={refund.status} />
                    </TableCell>
                    <TableCell>
                      {refund.order?.paymentStatus ? (
                        <PaymentStatusBadge status={refund.order.paymentStatus} />
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">{fmtDate(refund.createdAt)}</TableCell>
                    <TableCell className="pr-4 text-right text-xs text-slate-500">
                      {fmtDate(refund.processedAt)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Server-side pagination */}
        {pagination && pagination.totalPages > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Page <span className="font-semibold text-slate-900">{pagination.page}</span> of{" "}
              <span className="font-semibold text-slate-900">{pagination.totalPages}</span> ·{" "}
              {pagination.total.toLocaleString()} refunds
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                disabled={pagination.page <= 1 || isFetching}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                disabled={pagination.page >= pagination.totalPages || isFetching}
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      <RefundDetailDrawer
        refundId={selectedRefundId}
        onClose={() => setSelectedRefundId(null)}
      />
    </div>
  );
}
