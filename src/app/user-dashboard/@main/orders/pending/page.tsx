"use client";

import { useState } from "react";
import { useGetMyOrdersQuery, useCancelOrderMutation, OrderSummary } from "@/features/userorderApi";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import Link from "next/link";
import { ShoppingBag, X, AlertTriangle, Loader2 } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

// ─── Status config ────────────────────────────────────────────────────────────

const statusConfig: Record<string, { label: string; className: string }> = {
  PENDING:           { label: "Pending",            className: "bg-amber-50 text-amber-700 border border-amber-200" },
  CONFIRMED:         { label: "Confirmed",           className: "bg-green-50 text-green-700 border border-green-200" },
  PROCESSING:        { label: "Processing",          className: "bg-blue-50 text-[#0052cc] border border-blue-200" },
  PACKAGING:         { label: "Packaging",           className: "bg-purple-50 text-purple-700 border border-purple-200" },
  SHIPPED:           { label: "Shipped",             className: "bg-indigo-50 text-indigo-700 border border-indigo-200" },
  DELIVERED:         { label: "Delivered",           className: "bg-teal-50 text-teal-700 border border-teal-200" },
  RETURNED:          { label: "Returned",            className: "bg-orange-50 text-orange-700 border border-orange-200" },
  FAILED_TO_DELIVER: { label: "Failed to deliver",   className: "bg-red-50 text-red-600 border border-red-200" },
  CANCELLED:         { label: "Cancelled",           className: "bg-slate-100 text-slate-500 border border-slate-200" },
  REFUNDED:          { label: "Refunded",            className: "bg-teal-50 text-teal-700 border border-teal-200" },
};

function fmt(date: string) {
  return new Date(date).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

// ─── Cancel Modal ─────────────────────────────────────────────────────────────

interface CancelModalProps {
  orderId: string;
  orderNumber: string;
  onClose: () => void;
  onSuccess: () => void;
}

function CancelModal({ orderId, orderNumber, onClose, onSuccess }: CancelModalProps) {
  const [reason, setReason] = useState("");
  const [cancelOrder, { isLoading }] = useCancelOrderMutation();

  const PRESET_REASONS = [
    "Changed my mind",
    "Ordered by mistake",
    "Found a better price",
    "Delivery time too long",
    "Duplicate order",
    "Other",
  ];

  const handleCancel = async () => {
    try {
      await cancelOrder({ orderId, reason: reason.trim() || undefined }).unwrap();
      toast.success("Order cancelled successfully");
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to cancel order");
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-red-500" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">Cancel order</h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-xs text-amber-700">
            You&apos;re about to cancel order{" "}
            <span className="font-bold">#{orderNumber}</span>. This action cannot be undone.
            If you&apos;ve already paid, a refund will be initiated automatically.
          </div>

          {/* Preset reasons */}
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
              Reason for cancellation
            </p>
            <div className="grid grid-cols-2 gap-2">
              {PRESET_REASONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setReason(r === "Other" ? "" : r)}
                  className={`text-xs px-3 py-2 rounded-xl border text-left transition-all ${
                    reason === r
                      ? "bg-[#0052cc]/10 border-[#0052cc]/40 text-[#0052cc] font-medium"
                      : "bg-[#f5f7f8] border-transparent text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Custom reason */}
          <div>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Add a note (optional)..."
              rows={3}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:border-[#0052cc] focus:ring-2 focus:ring-[#0052cc]/10 transition-all resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 h-10 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Keep order
            </button>
            <button
              onClick={handleCancel}
              disabled={isLoading}
              className="flex-1 h-10 bg-red-500 hover:bg-red-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Cancelling...
                </>
              ) : (
                "Yes, cancel"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden animate-pulse">
      <div className="px-5 py-4 border-b border-slate-100 space-y-2">
        <div className="h-4 bg-slate-100 rounded w-56" />
        <div className="h-3 bg-slate-100 rounded w-72" />
      </div>
      <div className="divide-y divide-slate-100">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="grid grid-cols-6 gap-4 px-5 py-4 items-center">
            <div className="col-span-2 h-3 bg-slate-100 rounded" />
            <div className="h-3 bg-slate-100 rounded" />
            <div className="w-12 h-12 bg-slate-100 rounded-lg mx-auto" />
            <div className="h-3 bg-slate-100 rounded" />
            <div className="h-3 bg-slate-100 rounded" />
          </div>
        ))}
      </div>
      <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex justify-between">
        <div className="h-3 bg-slate-100 rounded w-32" />
        <div className="h-7 bg-slate-100 rounded-lg w-24" />
      </div>
    </div>
  );
}

// ─── Order Card ───────────────────────────────────────────────────────────────

interface OrderCardProps {
  order: OrderSummary;
  onCancelClick: (orderId: string, orderNumber: string) => void;
}

function OrderCard({ order, onCancelClick }: OrderCardProps) {
  const allItems = order.vendorOrders.flatMap((vo) =>
    vo.items.map((item) => ({ ...item, vendor: vo.vendor }))
  );
  const totalItems = allItems.reduce((s, i) => s + i.quantity, 0);
  const cfg = statusConfig[order.status] ?? statusConfig["PENDING"];

  // Only PENDING orders can be cancelled
  const canCancel = order.status === "PENDING";

  const orderNumber = order.orderNumber ?? order.id.slice(-13).toUpperCase();

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">

      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 bg-[#f5f7f8]">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <p className="text-sm text-slate-600">
            Order No:{" "}
            <span className="font-bold text-slate-900">#{orderNumber}</span>
          </p>
          <Link
            href={`/user-dashboard/orders/${order.id}`}
            className="text-xs font-medium text-[#0052cc] hover:underline"
          >
            View details
          </Link>
          <span className={`ml-auto text-[11px] font-semibold px-3 py-1 rounded-full ${cfg.className}`}>
            {cfg.label}
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1.5">
          Placed: {fmt(order.createdAt)}
        </p>
      </div>

      {/* Items table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm" style={{ tableLayout: "fixed", minWidth: "580px" }}>
          <colgroup>
            <col style={{ width: "28%" }} />
            <col style={{ width: "18%" }} />
            <col style={{ width: "13%" }} />
            <col style={{ width: "8%" }} />
            <col style={{ width: "13%" }} />
            <col style={{ width: "20%" }} />
          </colgroup>
          <thead>
            <tr className="border-b border-slate-100">
              <th className="px-5 py-2.5 text-left text-[11px] font-medium text-slate-400 uppercase tracking-wide">Product</th>
              <th className="px-4 py-2.5 text-center text-[11px] font-medium text-slate-400 uppercase tracking-wide">Seller</th>
              <th className="px-4 py-2.5 text-center text-[11px] font-medium text-slate-400 uppercase tracking-wide">Image</th>
              <th className="px-4 py-2.5 text-center text-[11px] font-medium text-slate-400 uppercase tracking-wide">Qty</th>
              <th className="px-4 py-2.5 text-right text-[11px] font-medium text-slate-400 uppercase tracking-wide">Amount</th>
              <th className="px-4 py-2.5 text-center text-[11px] font-medium text-slate-400 uppercase tracking-wide">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {allItems.map((item) => {
              const img = item.variant.images?.[0]?.url;
              const price = item.variant.specialPrice ?? item.variant.price;

              return (
                <tr key={item.id} className="hover:bg-[#f5f7f8]/60 transition-colors">
                  {/* Product */}
                  <td className="px-5 py-4 align-middle">
                    <Link
                      href={`/products/${item.variant.product.slug}`}
                      className="text-sm text-slate-800 font-medium leading-snug line-clamp-2 hover:text-[#0052cc] transition-colors"
                    >
                      {item.variant.product.name}
                    </Link>
                    {item.variant.name && (
                      <p className="text-xs text-slate-400 mt-0.5">{item.variant.name}</p>
                    )}
                  </td>

                  {/* Seller */}
                  <td className="px-4 py-4 align-middle text-center">
                    <p className="text-xs text-slate-600 truncate">{item.vendor.storeName}</p>
                  </td>

                  {/* Image */}
                  <td className="px-4 py-4 align-middle">
                    <div className="w-12 h-12 mx-auto rounded-xl border border-slate-100 overflow-hidden bg-[#f5f7f8] flex items-center justify-center">
                      {img ? (
                        <Image
                          src={img}
                          alt={item.variant.product.name}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ShoppingBag className="w-4 h-4 text-slate-300" />
                      )}
                    </div>
                  </td>

                  {/* Qty */}
                  <td className="px-4 py-4 align-middle text-center">
                    <span className="text-sm font-semibold text-slate-700">{item.quantity}</span>
                  </td>

                  {/* Amount */}
                  <td className="px-4 py-4 align-middle text-right">
                    <span className="text-sm font-semibold text-slate-800">
                      ৳ {(price * item.quantity).toLocaleString("en-BD", { minimumFractionDigits: 0 })}
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      ৳ {price.toLocaleString()} × {item.quantity}
                    </p>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-4 align-middle text-center">
                    <span className={`inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${cfg.className}`}>
                      {cfg.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-5 py-3.5 bg-[#f5f7f8] border-t border-slate-100 flex items-center justify-between">
        <p className="text-xs text-slate-500">
          {totalItems} item{totalItems !== 1 ? "s" : ""}
          &nbsp;·&nbsp; Total:{" "}
          <span className="font-bold text-slate-800">
            ৳ {order.totalAmount.toLocaleString("en-BD", { minimumFractionDigits: 2 })}
          </span>
        </p>

        {canCancel ? (
          <button
            onClick={() => onCancelClick(order.id, orderNumber)}
            className="text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 px-3 py-1.5 rounded-xl transition-colors"
          >
            Cancel order
          </button>
        ) : (
          <span className="text-xs text-slate-400 italic">
            Cannot cancel — order {cfg.label.toLowerCase()}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PendingOrdersPage() {
  const { user } = useSelector((state: RootState) => state.auth);
  const { data, isLoading, refetch } = useGetMyOrdersQuery(
    { page: 1, limit: 20, status: "PENDING" },
    { skip: !user }
  );

  const [cancelTarget, setCancelTarget] = useState<{ orderId: string; orderNumber: string } | null>(null);

  const orders = data?.data ?? [];

  return (
    <div className="max-w-5xl mx-auto space-y-5">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-800">Pending orders</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Orders awaiting confirmation or processing
          </p>
        </div>
        {!isLoading && orders.length > 0 && (
          <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full">
            {orders.length} order{orders.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl py-20 flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-[#f5f7f8] flex items-center justify-center">
            <ShoppingBag className="w-7 h-7 text-slate-300" />
          </div>
          <p className="text-sm font-semibold text-slate-500">No pending orders</p>
          <p className="text-xs text-slate-400">You&apos;re all caught up!</p>
          <Link
            href="/products"
            className="mt-2 text-xs font-semibold text-[#0052cc] bg-[#0052cc]/10 hover:bg-[#0052cc]/20 px-4 py-2 rounded-xl transition-colors"
          >
            Browse products
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onCancelClick={(id, num) => setCancelTarget({ orderId: id, orderNumber: num })}
            />
          ))}
        </div>
      )}

      {/* Cancel Modal */}
      {cancelTarget && (
        <CancelModal
          orderId={cancelTarget.orderId}
          orderNumber={cancelTarget.orderNumber}
          onClose={() => setCancelTarget(null)}
          onSuccess={refetch}
        />
      )}
    </div>
  );
}