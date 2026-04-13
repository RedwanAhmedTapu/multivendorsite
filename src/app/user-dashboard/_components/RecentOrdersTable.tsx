"use client";

import Link from "next/link";
import { Eye, Package } from "lucide-react";
import { OrderSummary, OrderStatus } from "@/features/userorderApi";

interface Props {
  orders: OrderSummary[];
  loading?: boolean;
}

const statusConfig: Record<OrderStatus, { label: string; className: string }> = {
  PENDING:           { label: "Pending",            className: "bg-amber-50 text-amber-700" },
  CONFIRMED:         { label: "Confirmed",           className: "bg-blue-50 text-[#0052cc]" },
  PROCESSING:        { label: "Processing",          className: "bg-blue-50 text-[#0052cc]" },
  PACKAGING:         { label: "Packaging",           className: "bg-purple-50 text-purple-700" },
  SHIPPED:           { label: "Shipped",             className: "bg-indigo-50 text-indigo-700" },
  DELIVERED:         { label: "Delivered",           className: "bg-green-50 text-green-700" },
  RETURNED:          { label: "Returned",            className: "bg-orange-50 text-orange-700" },
  FAILED_TO_DELIVER: { label: "Failed to deliver",   className: "bg-red-50 text-red-600" },
  CANCELLED:         { label: "Cancelled",           className: "bg-slate-100 text-slate-500" },
  REFUNDED:          { label: "Refunded",            className: "bg-teal-50 text-teal-700" },
};

function StatusBadge({ status }: { status: OrderStatus }) {
  const cfg = statusConfig[status] ?? { label: status, className: "bg-slate-100 text-slate-500" };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

function SkeletonRow() {
  return (
    <tr>
      {[...Array(6)].map((_, i) => (
        <td key={i} className="px-4 py-3.5">
          <div className="h-3.5 bg-slate-100 rounded-full animate-pulse w-3/4" />
        </td>
      ))}
    </tr>
  );
}

export function RecentOrdersTable({ orders, loading }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" style={{ tableLayout: "fixed" }}>
        <colgroup>
          <col style={{ width: "130px" }} />
          <col style={{ width: "110px" }} />
          <col style={{ width: "160px" }} />
          <col style={{ width: "80px" }} />
          <col style={{ width: "100px" }} />
          <col style={{ width: "80px" }} />
        </colgroup>
        <thead>
          <tr className="border-b border-slate-100 bg-[#f5f7f8]">
            <th className="px-4 py-2.5 text-left text-[11px] font-medium text-slate-400 uppercase tracking-wide">Order no.</th>
            <th className="px-4 py-2.5 text-left text-[11px] font-medium text-slate-400 uppercase tracking-wide">Order date</th>
            <th className="px-4 py-2.5 text-left text-[11px] font-medium text-slate-400 uppercase tracking-wide">Shop name</th>
            <th className="px-4 py-2.5 text-left text-[11px] font-medium text-slate-400 uppercase tracking-wide">Item(s)</th>
            <th className="px-4 py-2.5 text-left text-[11px] font-medium text-slate-400 uppercase tracking-wide">Amount</th>
            <th className="px-4 py-2.5 text-left text-[11px] font-medium text-slate-400 uppercase tracking-wide">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {loading ? (
            [...Array(4)].map((_, i) => <SkeletonRow key={i} />)
          ) : orders.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-10 text-center">
                <div className="flex flex-col items-center gap-2">
                  <Package className="w-8 h-8 text-slate-300" />
                  <p className="text-sm text-slate-400">No orders yet</p>
                  <Link href="/products" className="text-xs text-[#0052cc] hover:underline">Browse products</Link>
                </div>
              </td>
            </tr>
          ) : (
            orders.map((order) => {
              const totalItems = order.vendorOrders.reduce(
                (sum, vo) => sum + vo.items.reduce((s, i) => s + i.quantity, 0),
                0
              );
              const shopNames = order.vendorOrders
                .map((vo) => vo.vendor.storeName)
                .filter(Boolean)
                .join(", ");
              const date = new Date(order.createdAt).toLocaleDateString("en-GB", {
                day: "2-digit", month: "short", year: "numeric",
              });

              return (
                <tr key={order.id} className="hover:bg-[#f5f7f8] transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-800 text-xs truncate">
                        {order.orderNumber ?? `#${order.id.slice(-8).toUpperCase()}`}
                      </span>
                      <StatusBadge status={order.status} />
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-slate-500">{date}</td>
                  <td className="px-4 py-3.5 text-xs text-slate-700 truncate" title={shopNames}>
                    {shopNames || "—"}
                  </td>
                  <td className="px-4 py-3.5 text-xs text-slate-700">
                    {totalItems} item{totalItems !== 1 ? "s" : ""}
                  </td>
                  <td className="px-4 py-3.5 text-xs font-semibold text-slate-800">
                    ৳ {order.totalAmount.toLocaleString("en-BD", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3.5">
                    <Link
                      href={`/user-dashboard/orders/${order.id}`}
                      className="inline-flex items-center gap-1.5 text-xs text-[#0052cc] bg-[#0052cc]/10 hover:bg-[#0052cc]/20 px-2.5 py-1 rounded-lg transition-colors font-medium"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View
                    </Link>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}