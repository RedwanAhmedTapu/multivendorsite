"use client";

import { useParams, useRouter } from "next/navigation";
import { useGetOrderByIdQuery, OrderStatus, PaymentStatus } from "@/features/userorderApi";
import {
  ArrowLeft, Package, MapPin, CreditCard, Truck,
  CheckCircle, Clock, XCircle, RefreshCcw, AlertCircle, Home,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const orderStatusSteps: OrderStatus[] = [
  "PENDING", "CONFIRMED", "PROCESSING", "PACKAGING", "SHIPPED", "DELIVERED",
];

const statusLabel: Record<OrderStatus, string> = {
  PENDING:           "Pending",
  CONFIRMED:         "Confirmed",
  PROCESSING:        "Processing",
  PACKAGING:         "Packaging",
  SHIPPED:           "Shipped",
  DELIVERED:         "Delivered",
  RETURNED:          "Returned",
  FAILED_TO_DELIVER: "Failed to deliver",
  CANCELLED:         "Cancelled",
  REFUNDED:          "Refunded",
};

const orderStatusBadge: Record<string, string> = {
  PENDING:           "bg-amber-50 text-amber-600 border border-amber-200",
  CONFIRMED:         "bg-blue-50 text-blue-600 border border-blue-200",
  PROCESSING:        "bg-purple-50 text-purple-600 border border-purple-200",
  PACKAGING:         "bg-indigo-50 text-indigo-600 border border-indigo-200",
  SHIPPED:           "bg-sky-50 text-sky-600 border border-sky-200",
  DELIVERED:         "bg-green-50 text-green-600 border border-green-200",
  RETURNED:          "bg-orange-50 text-orange-600 border border-orange-200",
  FAILED_TO_DELIVER: "bg-red-50 text-red-600 border border-red-200",
  CANCELLED:         "bg-blue-50 text-blue-500 border border-blue-200",
  REFUNDED:          "bg-teal-50 text-teal-600 border border-teal-200",
};

const paymentStatusConfig: Record<PaymentStatus, { label: string; className: string }> = {
  PENDING:  { label: "Pending",  className: "text-slate-500" },
  PAID:     { label: "Paid",     className: "text-green-600" },
  FAILED:   { label: "Failed",   className: "text-red-500" },
  REFUNDED: { label: "Refunded", className: "text-teal-600" },
};

function fmt(date: string | null | undefined) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function OrderProgress({ status }: { status: OrderStatus }) {
  const terminal = ["CANCELLED", "RETURNED", "FAILED_TO_DELIVER", "REFUNDED"].includes(status);
  if (terminal) {
    return (
      <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">
        <XCircle className="w-4 h-4 text-blue-400 flex-shrink-0" />
        <span className="text-sm font-medium text-blue-600">{statusLabel[status]}</span>
      </div>
    );
  }
  const currentIdx = orderStatusSteps.indexOf(status);
  return (
    <div className="flex items-center gap-0">
      {orderStatusSteps.map((s, i) => {
        const done = i <= currentIdx;
        return (
          <div key={s} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors
                ${done ? "bg-blue-400 border-blue-400" : "bg-white border-slate-200"}`}>
                {done
                  ? <CheckCircle className="w-3.5 h-3.5 text-white" />
                  : <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />}
              </div>
              <span className={`text-[10px] mt-1 whitespace-nowrap font-medium ${done ? "text-blue-500" : "text-slate-400"}`}>
                {statusLabel[s]}
              </span>
            </div>
            {i < orderStatusSteps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 mb-4 ${i < currentIdx ? "bg-blue-300" : "bg-slate-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const router = useRouter();

  const { data, isLoading, isError } = useGetOrderByIdQuery(orderId as string, {
    skip: !orderId,
  });

  const order = data?.data;

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4 p-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white border border-slate-100 rounded-xl p-6 animate-pulse">
            <div className="h-4 bg-slate-100 rounded w-1/3 mb-3" />
            <div className="h-3 bg-slate-100 rounded w-full mb-2" />
            <div className="h-3 bg-slate-100 rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-white border border-slate-100 rounded-xl p-10 text-center">
          <AlertCircle className="w-10 h-10 text-blue-400 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">Order not found</p>
          <button onClick={() => router.back()} className="mt-4 text-sm text-blue-500 hover:underline">
            Go back
          </button>
        </div>
      </div>
    );
  }

  const paymentCfg = paymentStatusConfig[order.paymentStatus];
  const orderNumber = order.orderNumber ?? `#${order.id.slice(-15).toUpperCase()}`;

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-0">

      {/* Page title with track button */}
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={() => router.back()}
          className="text-slate-500 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-2xl font-bold text-slate-800">Order Details</h1>
        <div className="ml-auto flex items-center gap-2">
          <Link
            href={`/user-dashboard/orders/${order.id}/tracking`}
            className="flex items-center gap-1.5 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors font-medium"
          >
            <Truck className="w-4 h-4" />
            Track Order
          </Link>
        </div>
      </div>

      {/* Delivery type bar */}
      <div className="bg-slate-50 border border-slate-200 rounded-t-xl px-5 py-3.5 flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Delivery Type:{" "}
          <span className="font-semibold text-slate-800">Standard Delivery</span>
        </p>
        <p className="text-sm text-slate-500">
          Total:{" "}
          <span className="font-semibold text-slate-800 text-base">
            ৳ {order.totalAmount.toLocaleString("en-BD", { minimumFractionDigits: 0 })}
          </span>
        </p>
      </div>

      {/* Vendor order tables */}
      {order.vendorOrders.map((vo, voIdx) => (
        <div key={vo.id} className={`bg-white border-x border-slate-200 ${voIdx === order.vendorOrders.length - 1 ? "border-b rounded-b-xl" : ""}`}>
          {/* Order number + payment status row */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-dashed border-slate-200">
            <p className="text-sm text-slate-600 font-medium">
              Order No: <span className="text-slate-800">{orderNumber}</span>
            </p>
            <span className={`text-sm font-medium ${paymentCfg.className}`}>
              {order.paymentStatus === "PENDING" ? "Unpaid" : paymentCfg.label}
            </span>
          </div>

          {/* Items table */}
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-5 py-3 text-slate-500 font-medium text-xs">Name</th>
                <th className="text-left px-3 py-3 text-slate-500 font-medium text-xs">Seller Name</th>
                <th className="text-center px-3 py-3 text-slate-500 font-medium text-xs">Image</th>
                <th className="text-center px-3 py-3 text-slate-500 font-medium text-xs">Qty</th>
                <th className="text-right px-3 py-3 text-slate-500 font-medium text-xs">Amount</th>
                <th className="text-right px-5 py-3 text-slate-500 font-medium text-xs">Order Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {vo.items.map((item) => {
                const img = item.variant.images?.[0]?.url;
                const effectivePrice = item.variant.specialPrice ?? item.variant.price;
                const statusKey = (vo as any).status ?? order.status;
                return (
                  <tr key={item.id}>
                    <td className="px-5 py-4">
                      <div className="flex items-start gap-2">
                        <Link
                          href={`/products/${item.variant.product.slug}`}
                          className="text-sm text-slate-800 hover:text-blue-500 font-medium leading-snug"
                        >
                          {item.variant.product.name}
                        </Link>
                      </div>
                      {item.variant.name && (
                        <p className="text-xs text-slate-400 mt-0.5 pl-0">{item.variant.name}</p>
                      )}
                    </td>
                    <td className="px-3 py-4 text-slate-600 text-sm whitespace-nowrap">
                      {vo.vendor.storeName}
                    </td>
                    <td className="px-3 py-4">
                      <div className="w-12 h-12 mx-auto border border-slate-200 rounded overflow-hidden bg-slate-50">
                        {img ? (
                          <Image
                            src={img}
                            alt={item.variant.product.name}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-4 h-4 text-slate-300" />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-4 text-center text-slate-700">
                      {item.quantity}
                    </td>
                    <td className="px-3 py-4 text-right text-slate-800 font-medium whitespace-nowrap">
                      ৳ {(effectivePrice * item.quantity).toLocaleString("en-BD", { minimumFractionDigits: 0 })}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className={`inline-block text-xs font-medium px-3 py-1 rounded-full ${orderStatusBadge[statusKey] ?? "bg-slate-100 text-slate-500"}`}>
                        {statusLabel[statusKey as OrderStatus] ?? statusKey}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Courier info row */}
          {"courierOrder" in vo && vo.courierOrder && (
            <div className="border-t border-dashed border-slate-200 px-5 py-3 flex items-center gap-2 bg-slate-50">
              <Truck className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span className="text-xs text-slate-600 font-medium">
                {vo.courierOrder.courier_providers?.displayName ?? "Courier"}
              </span>
              {vo.courierOrder.courierTrackingId && (
                <span className="text-xs text-slate-400 ml-2">
                  Tracking: {vo.courierOrder.courierTrackingId}
                </span>
              )}
              <span className="ml-auto text-xs bg-blue-50 text-blue-500 border border-blue-200 px-2.5 py-0.5 rounded-full font-medium">
                {vo.courierOrder.status}
              </span>
            </div>
          )}
        </div>
      ))}

      {/* Order progress */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 mt-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">Order Status</p>
        <OrderProgress status={order.status} />
      </div>

      {/* Total Summary + Shipping Address - Now in column layout */}
      <div className="space-y-4 mt-4">
        {/* Total Summary */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-800">Total Summary</h3>
          </div>
          <div className="px-5 py-4 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Payment Method</span>
              <span className={`font-medium ${paymentCfg.className}`}>{paymentCfg.label}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Product Price</span>
              <span className="font-medium text-slate-800">
                ৳ {(order.subtotal ?? 0).toLocaleString("en-BD", { minimumFractionDigits: 0 })}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Delivery Charge</span>
              <span className="font-medium text-slate-800">
                ৳ {(order.shippingCost ?? 0).toLocaleString("en-BD", { minimumFractionDigits: 0 })}
              </span>
            </div>
            {(order.discountAmount ?? 0) > 0 && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Delivery Discount</span>
                <span className="font-medium text-slate-800">
                  − ৳ {order.discountAmount!.toLocaleString("en-BD", { minimumFractionDigits: 0 })}
                </span>
              </div>
            )}
          </div>
          <div className="px-5 py-4 border-t border-dashed border-slate-200 flex justify-between items-center">
            <span className="font-bold text-slate-800">Grand Total</span>
            <span className="font-bold text-slate-800 text-base">
              ৳ {order.totalAmount.toLocaleString("en-BD", { minimumFractionDigits: 0 })}
            </span>
          </div>

          {/* Payments */}
          {order.payments?.length > 0 && (
            <div className="px-5 pb-4 border-t border-slate-100 pt-3 space-y-2">
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Payments</p>
              {order.payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">{p.method}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-700">৳ {p.amount.toLocaleString()}</span>
                    <span className={`${paymentStatusConfig[p.status].className} font-medium`}>
                      {paymentStatusConfig[p.status].label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Shipping Address */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-800">Shipping Address</h3>
          </div>
          <div className="px-5 py-5">
            {order.address ? (
              <div className="space-y-1.5">
                <p className="font-semibold text-slate-800 text-sm">{order.address.receiverFullName}</p>
                <p className="text-sm text-slate-500">{order.address.address}</p>
                <p className="text-sm text-slate-500">{order.address.city}</p>
                <p className="text-sm text-slate-500">{order.address.phone}</p>
                <div className="pt-2">
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md">
                    <Home className="w-3 h-3" />
                    Home
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400">No address on record</p>
            )}
          </div>

          {/* Timeline */}
          <div className="px-5 pb-5 border-t border-slate-100 pt-4 space-y-2.5">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-3">Timeline</p>
            {[
              { label: "Ordered",   date: order.createdAt,  icon: Clock },
              { label: "Confirmed", date: order.confirmedAt, icon: CheckCircle },
              { label: "Shipped",   date: (order.vendorOrders[0] as any)?.shippedAt, icon: Truck },
              { label: "Delivered", date: (order.vendorOrders[0] as any)?.deliveredAt, icon: CheckCircle },
            ]
              .filter((t) => t.date)
              .map((t) => (
                <div key={t.label} className="flex items-center gap-2 text-xs">
                  <t.icon className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                  <span className="text-slate-400 w-20">{t.label}</span>
                  <span className="text-slate-700 font-medium">{fmt(t.date)}</span>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Refunds */}
      {order.refunds?.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 mt-4">
          <div className="flex items-center gap-2 mb-4">
            <RefreshCcw className="w-4 h-4 text-slate-400" />
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Refunds</p>
          </div>
          <div className="space-y-3">
            {order.refunds.map((r) => (
              <div key={r.id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium text-slate-800">
                    ৳ {r.amount.toLocaleString("en-BD", { minimumFractionDigits: 2 })}
                  </p>
                  {r.reason && <p className="text-xs text-slate-400 mt-0.5">{r.reason}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    r.status === "COMPLETED"
                      ? "bg-green-50 text-green-600 border border-green-200"
                      : "bg-amber-50 text-amber-600 border border-amber-200"
                  }`}>
                    {r.status}
                  </span>
                  <span className="text-xs text-slate-400">{fmt(r.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}