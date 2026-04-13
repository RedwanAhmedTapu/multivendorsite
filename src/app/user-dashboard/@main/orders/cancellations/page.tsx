"use client";

import { useGetMyOrdersQuery } from "@/features/userorderApi";
import { Package, XCircle, AlertCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";

// ─── Status config ─────────────────────────────────────────

const statusConfig: Record<string, { label: string; className: string }> = {
  CANCELLED: { label: "Cancelled", className: "bg-red-100 text-red-700 border border-red-200" },
  REFUNDED: { label: "Refunded", className: "bg-green-100 text-green-700 border border-green-200" },
};

function fmt(date: string | null | undefined) {
  if (!date) return "—";
  return new Date(date).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

// ─── Order Card ─────────────────────────────────────────

function OrderCard({ order }: any) {
  const allItems = order.vendorOrders.flatMap((vo: any) =>
    vo.items.map((item: any) => ({ ...item, vendor: vo.vendor }))
  );

  const totalItems = allItems.reduce((s: number, i: any) => s + i.quantity, 0);
  const cfg = statusConfig[order.status] ?? statusConfig["CANCELLED"];

  const orderNumber = order.orderNumber ?? order.id.slice(-13).toUpperCase();
  const cancellationReason = order.refunds?.[0]?.reason || "No reason provided";
  const cancelledAt = order.cancelledAt || order.refunds?.[0]?.createdAt || order.updatedAt;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">

      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 bg-red-50 flex items-center gap-3">
        <XCircle className="w-4 h-4 text-red-600" />
        <p className="text-sm text-slate-600">
          Order No: <span className="font-bold text-slate-900">#{orderNumber}</span>
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

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="px-5 py-2 text-left text-xs text-slate-400">Product</th>
              <th className="px-4 py-2 text-center text-xs text-slate-400">Seller</th>
              <th className="px-4 py-2 text-center text-xs text-slate-400">Image</th>
              <th className="px-4 py-2 text-center text-xs text-slate-400">Qty</th>
              <th className="px-4 py-2 text-right text-xs text-slate-400">Amount</th>
              <th className="px-4 py-2 text-center text-xs text-slate-400">Status</th>
            </tr>
          </thead>

          <tbody>
            {allItems.map((item: any) => {
              const img = item.variant.images?.[0]?.url;
              const price = item.variant.specialPrice ?? item.variant.price;

              return (
                <tr key={item.id} className="border-b hover:bg-gray-50">

                  {/* Product */}
                  <td className="px-5 py-4">
                    <Link
                      href={`/products/${item.variant.product.slug}`}
                      className="font-medium text-slate-800"
                    >
                      {item.variant.product.name}
                    </Link>

                    {item.variant.name && (
                      <p className="text-xs text-slate-400 mt-1">
                        {item.variant.name}
                      </p>
                    )}
                  </td>

                  {/* Seller */}
                  <td className="px-4 py-4 text-center text-xs text-slate-600">
                    {item.vendor.storeName}
                  </td>

                  {/* Image */}
                  <td className="px-4 py-4 text-center">
                    <div className="w-12 h-12 mx-auto rounded border overflow-hidden">
                      {img ? (
                        <Image src={img} alt="" width={48} height={48} />
                      ) : (
                        <Package className="w-4 h-4 text-slate-300 mx-auto" />
                      )}
                    </div>
                  </td>

                  {/* Qty */}
                  <td className="px-4 py-4 text-center">
                    {item.quantity}
                  </td>

                  {/* Amount */}
                  <td className="px-4 py-4 text-right font-semibold">
                    ৳ {(price * item.quantity).toLocaleString()}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-4 text-center">
                    <span className={`px-2 py-1 rounded text-xs ${cfg.className}`}>
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
      <div className="px-5 py-3 bg-gray-50 flex justify-between">
        <p className="text-xs text-slate-500">
          {totalItems} items · Total: ৳ {order.totalAmount}
        </p>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────

export default function CancelledOrdersPage() {
  const { user } = useSelector((state: RootState) => state.auth);

  const { data, isLoading, isError } = useGetMyOrdersQuery(
    { page: 1, limit: 50 },
    { skip: !user }
  );

  const orders = data?.data ?? [];

  const cancelledOrders = orders.filter(
    (o) => o.status === "CANCELLED" || o.status === "REFUNDED"
  );

  if (isLoading) return <p>Loading...</p>;

  if (isError) return <p>Error loading orders</p>;

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      <h1 className="text-lg font-semibold">Cancelled Orders</h1>

      {cancelledOrders.length === 0 ? (
        <p>No cancelled orders</p>
      ) : (
        cancelledOrders.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))
      )}
    </div>
  );
}