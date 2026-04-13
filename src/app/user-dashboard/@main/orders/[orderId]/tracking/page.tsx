"use client";

import { useParams, useRouter } from "next/navigation";
import { useTrackOrderQuery } from "@/features/userorderApi";
import { ArrowLeft, AlertCircle } from "lucide-react";

function fmt(date: string | null | undefined) {
  if (!date) return null;
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

/* ── Custom SVG status icons ─────────────────────────────────────────────── */

function IconOrderPlaced({ active }: { active: boolean }) {
  const c = active ? "#1d4ed8" : "#cbd5e1";
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect x="8" y="10" width="24" height="22" rx="3" stroke={c} strokeWidth="2" fill={active ? "#eff6ff" : "#f8fafc"} />
      <path d="M14 18h12M14 23h8" stroke={c} strokeWidth="2" strokeLinecap="round" />
      <path d="M14 13h4a2 2 0 0 1 4 0h4" stroke={c} strokeWidth="2" strokeLinecap="round" />
      <circle cx="28" cy="10" r="1.5" fill={c} />
    </svg>
  );
}

function IconConfirmed({ active }: { active: boolean }) {
  const c = active ? "#1d4ed8" : "#cbd5e1";
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <circle cx="20" cy="20" r="12" stroke={c} strokeWidth="2" fill={active ? "#eff6ff" : "#f8fafc"} />
      <path d="M14 20l4 4 8-8" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconProcessing({ active }: { active: boolean }) {
  const c = active ? "#1d4ed8" : "#cbd5e1";
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <path d="M20 8v4M20 28v4M8 20h4M28 20h4" stroke={c} strokeWidth="2" strokeLinecap="round" />
      <path d="M11.5 11.5l2.8 2.8M25.7 25.7l2.8 2.8M11.5 28.5l2.8-2.8M25.7 14.3l2.8-2.8" stroke={c} strokeWidth="2" strokeLinecap="round" />
      <circle cx="20" cy="20" r="4" fill={c} opacity={active ? 1 : 0.4} />
    </svg>
  );
}

function IconPackaging({ active }: { active: boolean }) {
  const c = active ? "#1d4ed8" : "#cbd5e1";
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <path d="M10 16l10-6 10 6v12l-10 6-10-6V16z" stroke={c} strokeWidth="2" fill={active ? "#eff6ff" : "#f8fafc"} />
      <path d="M20 10v18M10 16l10 6 10-6" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 13l10 6" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconShipped({ active }: { active: boolean }) {
  const c = active ? "#1d4ed8" : "#cbd5e1";
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect x="7" y="16" width="18" height="12" rx="2" stroke={c} strokeWidth="2" fill={active ? "#eff6ff" : "#f8fafc"} />
      <path d="M25 20h5l3 5v3h-8V20z" stroke={c} strokeWidth="2" fill={active ? "#dbeafe" : "#f1f5f9"} strokeLinejoin="round" />
      <circle cx="13" cy="30" r="2.5" stroke={c} strokeWidth="2" fill="white" />
      <circle cx="29" cy="30" r="2.5" stroke={c} strokeWidth="2" fill="white" />
      <path d="M10 22h8" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconDelivered({ active }: { active: boolean }) {
  const c = active ? "#16a34a" : "#cbd5e1";
  const bg = active ? "#dcfce7" : "#f8fafc";
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <circle cx="20" cy="20" r="13" fill={bg} stroke={c} strokeWidth="2" />
      <path d="M13 20l5 5 9-9" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {active && (
        <>
          <circle cx="20" cy="20" r="13" stroke={c} strokeWidth="1" strokeDasharray="3 3" opacity="0.3" />
        </>
      )}
    </svg>
  );
}

function IconCancelled() {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <circle cx="20" cy="20" r="12" stroke="#ef4444" strokeWidth="2" fill="#fef2f2" />
      <path d="M15 15l10 10M25 15l-10 10" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function IconFailed() {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <path d="M20 9l11 19H9L20 9z" stroke="#f59e0b" strokeWidth="2" fill="#fffbeb" strokeLinejoin="round" />
      <path d="M20 19v-5M20 24v-1" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function IconReturned() {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <path d="M26 14a8 8 0 1 1-12 6.9" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" />
      <path d="M14 11l0 5 5 0" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── Step config ─────────────────────────────────────────────────────────── */

const STEPS = [
  { key: "PENDING",    label: "Order placed",  Icon: IconOrderPlaced  },
  { key: "CONFIRMED",  label: "Confirmed",     Icon: IconConfirmed    },
  { key: "PROCESSING", label: "Processing",    Icon: IconProcessing   },
  { key: "PACKAGING",  label: "Packaging",     Icon: IconPackaging    },
  { key: "SHIPPED",    label: "Shipped",       Icon: IconShipped      },
  { key: "DELIVERED",  label: "Delivered",     Icon: IconDelivered    },
];

const TERMINAL = ["CANCELLED", "RETURNED", "FAILED_TO_DELIVER", "REFUNDED"];

/* ── Tracking event row ──────────────────────────────────────────────────── */

function TrackingEvent({ event, isFirst }: { event: any; isFirst: boolean }) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className={`w-3 h-3 rounded-full border-2 mt-1 flex-shrink-0 ${isFirst ? "border-blue-600 bg-blue-600" : "border-slate-300 bg-white"}`} />
        <div className="w-px flex-1 bg-slate-100 my-1" />
      </div>
      <div className="pb-5 min-w-0">
        <p className={`text-sm font-medium ${isFirst ? "text-slate-800" : "text-slate-500"}`}>
          {event.messageEn}
        </p>
        {event.location && (
          <p className="text-xs text-slate-400 mt-0.5">{event.location}</p>
        )}
        <p className="text-xs text-slate-400 mt-1">{fmt(event.timestamp)}</p>
      </div>
    </div>
  );
}

/* ── Main page ───────────────────────────────────────────────────────────── */

export default function OrderTrackingPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const router = useRouter();

  const { data, isLoading, isError } = useTrackOrderQuery(orderId as string, { skip: !orderId });
  const tracking = data?.data;

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white border border-slate-100 rounded-2xl p-6 animate-pulse">
            <div className="h-4 bg-slate-100 rounded w-1/3 mb-4" />
            <div className="flex gap-4">
              {[...Array(6)].map((_, j) => (
                <div key={j} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-10 h-10 bg-slate-100 rounded-full" />
                  <div className="h-2 bg-slate-100 rounded w-12" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError || !tracking) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white border border-slate-100 rounded-2xl p-10 text-center">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">Tracking info not available</p>
          <button onClick={() => router.back()} className="mt-4 text-sm text-blue-700 hover:underline">Go back</button>
        </div>
      </div>
    );
  }

  const isTerminal = TERMINAL.includes(tracking.orderStatus);
  const currentStepIdx = STEPS.findIndex((s) => s.key === tracking.orderStatus);

  return (
    <div className="max-w-2xl mx-auto space-y-4">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-8 h-8 flex items-center justify-center rounded-xl bg-white border border-slate-200 hover:border-blue-300 text-slate-500 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-base font-semibold text-slate-800">Order tracking</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {tracking.orderNumber ?? `#${tracking.orderId.slice(-8).toUpperCase()}`}
          </p>
        </div>
      </div>

      {/* Progress stepper */}
      {!isTerminal ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-6">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-6">Delivery progress</p>
          <div className="flex items-start">
            {STEPS.map((step, idx) => {
              const done = idx <= currentStepIdx;
              const isLast = idx === STEPS.length - 1;
              return (
                <div key={step.key} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center gap-2 relative">
                    <div className="w-10 h-10">
                      <step.Icon active={done} />
                    </div>
                    <span className={`text-[10px] text-center leading-tight font-medium w-14 ${done ? "text-blue-700" : "text-slate-400"}`}>
                      {step.label}
                    </span>
                    {idx === currentStepIdx && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-600 rounded-full border-2 border-white animate-pulse" />
                    )}
                  </div>
                  {!isLast && (
                    <div className={`flex-1 h-0.5 mx-1 mb-7 ${idx < currentStepIdx ? "bg-blue-400" : "bg-slate-100"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-2xl p-6 flex items-center gap-5">
          <div className="w-14 h-14 flex-shrink-0">
            {tracking.orderStatus === "CANCELLED" ? <IconCancelled /> :
             tracking.orderStatus === "RETURNED"  ? <IconReturned /> :
             <IconFailed />}
          </div>
          <div>
            <p className="text-base font-semibold text-slate-800">
              {tracking.orderStatus === "CANCELLED" ? "Order cancelled" :
               tracking.orderStatus === "RETURNED"  ? "Order returned" :
               tracking.orderStatus === "REFUNDED"  ? "Order refunded" :
               "Failed to deliver"}
            </p>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              {tracking.orderStatus === "CANCELLED"
                ? "This order was cancelled and will not be processed further."
                : tracking.orderStatus === "RETURNED"
                ? "The item was returned. Refund will be processed shortly."
                : tracking.orderStatus === "REFUNDED"
                ? "Your refund has been processed."
                : "Delivery was unsuccessful. Please contact support for assistance."}
            </p>
          </div>
        </div>
      )}

      {/* Per-vendor tracking */}
      {tracking.vendorOrders.map((vo) => (
        <div key={vo.id} className="bg-white border border-slate-100 rounded-2xl overflow-hidden">

          {/* Vendor header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-50 bg-slate-50/60">
            {vo.vendor.avatar ? (
              <img src={vo.vendor.avatar} alt={vo.vendor.storeName} className="w-7 h-7 rounded-full object-cover" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-[11px] font-semibold text-blue-700">
                {vo.vendor.storeName?.[0] ?? "S"}
              </div>
            )}
            <span className="text-sm font-medium text-slate-700">{vo.vendor.storeName}</span>
            <span className={`ml-auto text-[10px] font-semibold px-2.5 py-1 rounded-full ${
              vo.status === "DELIVERED" ? "bg-green-50 text-green-700 ring-1 ring-green-200" :
              vo.status === "SHIPPED"   ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200" :
              vo.status === "CANCELLED" ? "bg-red-50 text-red-600 ring-1 ring-red-200" :
              "bg-slate-100 text-slate-500"
            }`}>
              {vo.status.charAt(0) + vo.status.slice(1).toLowerCase()}
            </span>
          </div>

          {/* Courier info */}
          {vo.courierOrder && (
            <div className="px-5 pt-5">
              <div className="grid grid-cols-2 gap-3 mb-5">
                {[
                  { label: "Courier", value: vo.courierOrder.courier_providers?.displayName ?? "N/A" },
                  { label: "Tracking ID", value: vo.courierOrder.courierTrackingId ?? "—" },
                  { label: "Recipient", value: vo.courierOrder.recipientName },
                  { label: "Address", value: vo.courierOrder.recipientAddress },
                ].map((row) => (
                  <div key={row.label}>
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">{row.label}</p>
                    <p className="text-sm font-medium text-slate-700 mt-0.5 truncate">{row.value}</p>
                  </div>
                ))}
              </div>

              {/* Timeline events */}
              {vo.courierOrder.courier_tracking_history?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-4">Tracking history</p>
                  <div>
                    {vo.courierOrder.courier_tracking_history.map((event, idx) => (
                      <TrackingEvent key={event.id} event={event} isFirst={idx === 0} />
                    ))}
                  </div>
                </div>
              )}

              {/* Empty state for tracking */}
              {(!vo.courierOrder.courier_tracking_history || vo.courierOrder.courier_tracking_history.length === 0) && (
                <div className="py-8 flex flex-col items-center gap-2 text-center">
                  <div className="w-12 h-12 mx-auto mb-1">
                    <IconShipped active={false} />
                  </div>
                  <p className="text-sm text-slate-400">Tracking updates will appear here once the parcel is dispatched.</p>
                </div>
              )}
            </div>
          )}

          {/* No courier yet */}
          {!vo.courierOrder && (
            <div className="px-5 py-8 flex flex-col items-center gap-2 text-center">
              <div className="w-12 h-12 mx-auto mb-1">
                <IconPackaging active={false} />
              </div>
              <p className="text-sm font-medium text-slate-500">Preparing for shipment</p>
              <p className="text-xs text-slate-400">Courier details will be added once the order is shipped.</p>
            </div>
          )}

          {/* Timestamps */}
          {(vo.shippedAt || vo.deliveredAt) && (
            <div className="px-5 pb-5 pt-3 border-t border-slate-50 grid grid-cols-2 gap-3">
              {vo.shippedAt && (
                <div>
                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Shipped</p>
                  <p className="text-xs font-medium text-slate-700 mt-0.5">{fmt(vo.shippedAt)}</p>
                </div>
              )}
              {vo.deliveredAt && (
                <div>
                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Delivered</p>
                  <p className="text-xs font-medium text-green-700 mt-0.5">{fmt(vo.deliveredAt)}</p>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}