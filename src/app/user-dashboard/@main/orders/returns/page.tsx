"use client";

import { useParams, useRouter } from "next/navigation";
import { useGetOrderByIdQuery } from "@/features/userorderApi";
import { useState } from "react";
import { ArrowLeft, Package, CheckCircle, XCircle, Loader2, RotateCcw, AlertTriangle, Camera } from "lucide-react";
import Image from "next/image";

const RETURN_REASONS = [
  "Item is damaged or defective",
  "Wrong item received",
  "Item does not match description",
  "Item is of poor quality",
  "Changed my mind",
  "Other",
];

function fmt(date: string) {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

export default function ReturnOrderPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const router = useRouter();

  const { data, isLoading } = useGetOrderByIdQuery(orderId as string, { skip: !orderId });

  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const order = data?.data;
  const canReturn = order?.status === "DELIVERED";

  const toggleItem = (itemId: string) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      next.has(itemId) ? next.delete(itemId) : next.add(itemId);
      return next;
    });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 1200));
    setIsSubmitting(false);
    setSubmitted(true);
  };

  if (isLoading) {
    return (
      <div className="max-w-xl mx-auto space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white border border-slate-100 rounded-2xl p-5 animate-pulse">
            <div className="h-4 bg-slate-100 rounded w-1/2 mb-3" />
            <div className="h-3 bg-slate-100 rounded w-full mb-2" />
            <div className="h-3 bg-slate-100 rounded w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-xl mx-auto">
        <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center">
          <XCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">Order not found</p>
          <button onClick={() => router.back()} className="mt-4 text-sm text-blue-700 hover:underline">Go back</button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto">
        <div className="bg-white border border-slate-100 rounded-2xl p-10 text-center">
          <div className="w-16 h-16 rounded-3xl bg-green-50 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-lg font-semibold text-slate-800 mb-2">Return request submitted</h2>
          <p className="text-sm text-slate-400 leading-relaxed mb-3 max-w-sm mx-auto">
            Your return request for order{" "}
            <span className="font-medium text-slate-700">
              {order.orderNumber ?? `#${order.id.slice(-8).toUpperCase()}`}
            </span>{" "}
            has been received. Our team will review and respond within 24–48 hours.
          </p>
          <div className="bg-slate-50 rounded-2xl p-4 text-left space-y-2 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Items requested</span>
              <span className="font-medium text-slate-700">{selectedItems.size}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Reason</span>
              <span className="font-medium text-slate-700 text-right max-w-[180px] truncate">
                {selectedReason === "Other" ? customReason : selectedReason}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Reference</span>
              <span className="font-medium text-slate-700">
                RET-{Math.floor(100000 + Math.random() * 899999)}
              </span>
            </div>
          </div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.push("/user-dashboard/orders")}
              className="text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 px-5 py-2.5 rounded-xl transition-colors"
            >
              My orders
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!canReturn) {
    return (
      <div className="max-w-xl mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="w-8 h-8 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-500">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-base font-semibold text-slate-800">Return order</h1>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-8 text-center">
          <div className="w-14 h-14 rounded-3xl bg-amber-50 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-7 h-7 text-amber-500" />
          </div>
          <h2 className="text-base font-semibold text-slate-800 mb-2">Returns not available</h2>
          <p className="text-sm text-slate-400 leading-relaxed max-w-xs mx-auto">
            Returns are only available for <strong className="text-slate-600">delivered</strong> orders. Current status:{" "}
            <span className="font-medium text-slate-600">{order.status.toLowerCase()}</span>.
          </p>
          <button onClick={() => router.back()} className="mt-6 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 px-5 py-2.5 rounded-xl transition-colors">
            Go back
          </button>
        </div>
      </div>
    );
  }

  const allItems = order.vendorOrders.flatMap((vo) => vo.items);
  const isValid = selectedItems.size > 0 && !!selectedReason && (selectedReason !== "Other" || customReason.trim().length > 0);

  return (
    <div className="max-w-xl mx-auto space-y-4">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="w-8 h-8 flex items-center justify-center rounded-xl bg-white border border-slate-200 hover:border-blue-300 text-slate-500 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-base font-semibold text-slate-800">Return order</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {order.orderNumber ?? `#${order.id.slice(-8).toUpperCase()}`} · Delivered {fmt(order.createdAt)}
          </p>
        </div>
      </div>

      {/* Policy notice */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-2xl px-5 py-4">
        <RotateCcw className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-blue-700 leading-relaxed">
          Items must be returned within <strong>7 days</strong> of delivery in original packaging. Refunds are processed within 5–7 business days after the item is received.
        </p>
      </div>

      {/* Select items */}
      <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-50">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Select items to return</p>
        </div>
        <div className="divide-y divide-slate-50">
          {allItems.map((item) => {
            const img = item.variant.images?.[0]?.url;
            const price = item.variant.specialPrice ?? item.variant.price;
            const checked = selectedItems.has(item.id);
            return (
              <label
                key={item.id}
                className={`flex items-center gap-3 px-5 py-4 cursor-pointer transition-colors ${checked ? "bg-blue-50/40" : "hover:bg-slate-50/60"}`}
              >
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${checked ? "border-blue-600 bg-blue-600" : "border-slate-300"}`}>
                  {checked && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
                <input type="checkbox" className="sr-only" checked={checked} onChange={() => toggleItem(item.id)} />
                <div className="w-12 h-12 rounded-xl border border-slate-100 overflow-hidden bg-slate-50 flex-shrink-0">
                  {img ? (
                    <Image src={img} alt={item.variant.product.name} width={48} height={48} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-4 h-4 text-slate-300" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{item.variant.product.name}</p>
                  {item.variant.name && <p className="text-xs text-slate-400 mt-0.5">{item.variant.name}</p>}
                  <p className="text-xs text-slate-400">Qty: {item.quantity}</p>
                </div>
                <p className="text-sm font-semibold text-slate-700 flex-shrink-0">
                  ৳ {(price * item.quantity).toLocaleString("en-BD", { minimumFractionDigits: 2 })}
                </p>
              </label>
            );
          })}
        </div>
      </div>

      {/* Reason */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-4">Reason for return</p>
        <div className="space-y-2.5">
          {RETURN_REASONS.map((reason) => (
            <label
              key={reason}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all ${
                selectedReason === reason ? "border-blue-400 bg-blue-50" : "border-slate-100 hover:border-slate-200"
              }`}
            >
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selectedReason === reason ? "border-blue-600" : "border-slate-300"}`}>
                {selectedReason === reason && <div className="w-2 h-2 rounded-full bg-blue-600" />}
              </div>
              <input type="radio" name="return-reason" value={reason} className="sr-only" onChange={() => setSelectedReason(reason)} />
              <span className="text-sm text-slate-700">{reason}</span>
            </label>
          ))}
        </div>
        {selectedReason === "Other" && (
          <textarea
            value={customReason}
            onChange={(e) => setCustomReason(e.target.value)}
            placeholder="Please describe the issue..."
            rows={3}
            className="mt-3 w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 resize-none transition-all"
          />
        )}
      </div>

      {/* Photo upload hint */}
      <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-5 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center flex-shrink-0">
          <Camera className="w-5 h-5 text-slate-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-700">Add photos (optional)</p>
          <p className="text-xs text-slate-400 mt-0.5">Upload up to 5 photos of the item to help process your return faster.</p>
        </div>
        <button className="ml-auto text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-xl transition-colors whitespace-nowrap">
          Upload
        </button>
      </div>

      {/* Submit */}
      <div className="flex gap-3">
        <button
          onClick={() => router.back()}
          className="flex-1 h-11 text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-2xl transition-colors"
        >
          Go back
        </button>
        <button
          onClick={handleSubmit}
          disabled={!isValid || isSubmitting}
          className="flex-1 h-11 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 active:scale-[0.99] rounded-2xl transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Submitting…
            </>
          ) : (
            "Submit return request"
          )}
        </button>
      </div>
    </div>
  );
}