"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useGetMyOrdersQuery, OrderStatus, PaymentStatus } from "@/features/userorderApi";
import {
  Search, Package, ChevronRight, ChevronLeft, ChevronDown,
  SlidersHorizontal, X, ShoppingBag, Truck, RotateCcw,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

/* ─────────────────────────── constants ─────────────────────────── */

const ALL_STATUSES: OrderStatus[] = [
  "PENDING", "CONFIRMED", "PROCESSING", "PACKAGING",
  "SHIPPED", "DELIVERED", "CANCELLED", "RETURNED",
  "FAILED_TO_DELIVER", "REFUNDED",
];

const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING:           "Pending",
  CONFIRMED:         "Confirmed",
  PROCESSING:        "Processing",
  PACKAGING:         "Packaging",
  SHIPPED:           "Shipped",
  DELIVERED:         "Delivered",
  CANCELLED:         "Cancelled",
  RETURNED:          "Returned",
  FAILED_TO_DELIVER: "Failed to Deliver",
  REFUNDED:          "Refunded",
};

const STATUS_STYLE: Record<OrderStatus, string> = {
  PENDING:           "bg-amber-50  text-amber-600  border-amber-200",
  CONFIRMED:         "bg-blue-50   text-blue-600   border-blue-200",
  PROCESSING:        "bg-violet-50 text-violet-600 border-violet-200",
  PACKAGING:         "bg-indigo-50 text-indigo-600 border-indigo-200",
  SHIPPED:           "bg-sky-50    text-sky-600    border-sky-200",
  DELIVERED:         "bg-green-50  text-green-600  border-green-200",
  CANCELLED:         "bg-blue-50   text-blue-500   border-blue-200",
  RETURNED:          "bg-orange-50 text-orange-600 border-orange-200",
  FAILED_TO_DELIVER: "bg-red-50    text-red-600    border-red-200",
  REFUNDED:          "bg-teal-50   text-teal-600   border-teal-200",
};

const PAYMENT_STYLE: Record<PaymentStatus, string> = {
  PENDING:  "text-amber-500",
  PAID:     "text-green-600",
  FAILED:   "text-red-500",
  REFUNDED: "text-teal-600",
};

const TAB_GROUPS = [
  { key: "ALL",       label: "All Orders",  statuses: ALL_STATUSES },
  { key: "ACTIVE",    label: "Active",      statuses: ["PENDING","CONFIRMED","PROCESSING","PACKAGING"] as OrderStatus[] },
  { key: "SHIPPED",   label: "Shipped",     statuses: ["SHIPPED"] as OrderStatus[] },
  { key: "DELIVERED", label: "Delivered",   statuses: ["DELIVERED"] as OrderStatus[] },
  { key: "CANCELLED", label: "Cancelled",   statuses: ["CANCELLED","RETURNED","FAILED_TO_DELIVER","REFUNDED"] as OrderStatus[] },
];

const PAGE_SIZE_OPTIONS = [10, 25, 50];

function fmt(date: string | null | undefined) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

/* ─────────────────────────── component ─────────────────────────── */

export default function OrdersPage() {
  const router = useRouter();

  /* query state */
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [statusParam, setStatusParam] = useState<OrderStatus | undefined>(undefined);

  /* query - use the correct hook */
  const { data, isLoading, isError } = useGetMyOrdersQuery({
    page,
    limit: pageSize,
    status: statusParam,
  });
  
  const orders = useMemo(() => data?.data ?? [], [data]);
  const totalOrders = data?.pagination?.total ?? 0;
  const totalPages = data?.pagination?.totalPages ?? 1;

  /* ui state */
  const [activeTab, setActiveTab] = useState("ALL");
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<"date" | "total">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "">("");

  /* derived */
  const tabStatuses = TAB_GROUPS.find((t) => t.key === activeTab)?.statuses ?? ALL_STATUSES;

  // Filter and sort locally (since API doesn't support all these filters)
  const filtered = useMemo(() => {
    return orders
      .filter((o: any) => {
        const matchTab    = tabStatuses.includes(o.status);
        const matchStatus = statusFilter ? o.status === statusFilter : true;
        const q = search.toLowerCase();
        const matchSearch = !q
          || (o.orderNumber ?? o.id).toLowerCase().includes(q)
          || o.vendorOrders?.some((vo: any) =>
              vo.items?.some((item: any) =>
                item.variant?.product?.name?.toLowerCase().includes(q)
              ) || vo.vendor?.storeName?.toLowerCase().includes(q)
            );
        return matchTab && matchStatus && matchSearch;
      })
      .sort((a: any, b: any) => {
        if (sortField === "date") {
          const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          return sortDir === "desc" ? -diff : diff;
        }
        const diff = a.totalAmount - b.totalAmount;
        return sortDir === "desc" ? -diff : diff;
      });
  }, [orders, tabStatuses, search, statusFilter, sortField, sortDir]);

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);
  const localTotalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    TAB_GROUPS.forEach((t) => {
      counts[t.key] = orders.filter((o: any) => t.statuses.includes(o.status)).length;
    });
    return counts;
  }, [orders]);

  function toggleSort(field: "date" | "total") {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("desc"); }
  }

  function SortIcon({ field }: { field: "date" | "total" }) {
    if (sortField !== field) return <ChevronDown className="w-3 h-3 text-slate-300" />;
    return (
      <ChevronDown className={`w-3 h-3 text-blue-500 transition-transform ${sortDir === "asc" ? "rotate-180" : ""}`} />
    );
  }

  // Handle tab change - reset filters and optionally set API status param
  const handleTabChange = (tabKey: string) => {
    setActiveTab(tabKey);
    setPage(1);
    setStatusFilter("");
    
    // Optionally update API status param based on tab
    const tab = TAB_GROUPS.find(t => t.key === tabKey);
    if (tab && tab.statuses.length === 1) {
      setStatusParam(tab.statuses[0]);
    } else {
      setStatusParam(undefined);
    }
  };

  /* ── skeleton ── */
  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-8 bg-slate-100 rounded-lg w-40 animate-pulse" />
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden animate-pulse">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex gap-4 px-6 py-4 border-b border-slate-100 last:border-0">
              <div className="w-10 h-10 rounded-lg bg-slate-100" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-slate-100 rounded w-1/3" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
              </div>
              <div className="h-6 bg-slate-100 rounded-full w-20" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ── error ── */
  if (isError) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
        <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500 font-medium">Failed to load orders</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 text-sm text-blue-500 hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* ── Page header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">My Orders</h1>
          <p className="text-sm text-slate-400 mt-0.5">{totalOrders} total orders</p>
        </div>
      </div>

      {/* ── Status tabs ── */}
      <div className="flex items-center gap-1 overflow-x-auto pb-0.5 border-b border-slate-200 scrollbar-hide">
        {TAB_GROUPS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            className={`relative flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px
              ${activeTab === tab.key
                ? "border-blue-500 text-blue-500"
                : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
          >
            {tab.label}
            {tabCounts[tab.key] > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold
                ${activeTab === tab.key ? "bg-blue-50 text-blue-500" : "bg-slate-100 text-slate-400"}`}>
                {tabCounts[tab.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Search + filter bar ── */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by order number, product or seller…"
            className="w-full pl-9 pr-4 h-9 text-sm border border-slate-200 rounded-lg bg-white text-slate-700
              placeholder:text-slate-400 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters((v) => !v)}
          className={`flex items-center gap-1.5 h-9 px-3 text-sm border rounded-lg transition-colors font-medium
            ${showFilters || statusFilter
              ? "border-blue-400 bg-blue-50 text-blue-600"
              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
            }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Filter
          {statusFilter && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
        </button>

        {/* Page size */}
        <div className="relative">
          <select
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
            className="appearance-none h-9 pl-3 pr-7 text-sm border border-slate-200 rounded-lg bg-white text-slate-600
              outline-none focus:border-blue-400 cursor-pointer"
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>{n} / page</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* ── Filter panel ── */}
      {showFilters && (
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Filter by Status</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => { setStatusFilter(""); setPage(1); }}
              className={`px-3 py-1.5 text-xs rounded-full border font-medium transition-colors
                ${statusFilter === "" ? "bg-blue-50 border-blue-400 text-blue-600" : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"}`}
            >
              All
            </button>
            {tabStatuses.map((s) => (
              <button
                key={s}
                onClick={() => { setStatusFilter(s === statusFilter ? "" : s); setPage(1); }}
                className={`px-3 py-1.5 text-xs rounded-full border font-medium transition-colors
                  ${statusFilter === s ? STATUS_STYLE[s] : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"}`}
              >
                {STATUS_LABEL[s]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Table ── */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {paginated.length === 0 ? (
          <div className="py-20 text-center">
            <ShoppingBag className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 font-medium text-sm">No orders found</p>
            {(search || statusFilter) && (
              <button
                onClick={() => { setSearch(""); setStatusFilter(""); }}
                className="mt-3 text-xs text-blue-500 hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[760px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Seller
                  </th>
                  <th
                    className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer select-none hover:text-slate-600 transition-colors"
                    onClick={() => toggleSort("date")}
                  >
                    <span className="flex items-center gap-1">
                      Date <SortIcon field="date" />
                    </span>
                  </th>
                  <th
                    className="text-right px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer select-none hover:text-slate-600 transition-colors"
                    onClick={() => toggleSort("total")}
                  >
                    <span className="flex items-center gap-1 justify-end">
                      Total <SortIcon field="total" />
                    </span>
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-center px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginated.map((order: any) => {
                  /* Get all items from all vendor orders */
                  const allItems = order.vendorOrders.flatMap((vo: any) => vo.items);
                  const previewImgs = allItems.slice(0, 3).map(
                    (item: any) => item.variant?.images?.[0]?.url ?? null
                  );
                  const extraItems = allItems.length - 3;
                  const sellers = [...new Set(
                    order.vendorOrders.map((vo: any) => vo.vendor?.storeName).filter(Boolean)
                  )] as string[];
                  const totalQty = allItems.reduce((s: number, i: any) => s + i.quantity, 0);

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-slate-50/60 transition-colors group"
                    >
                      {/* Order number */}
                      <td className="px-5 py-4">
                        <Link
                          href={`/user-dashboard/orders/${order.id}`}
                          className="font-semibold text-slate-800 group-hover:text-blue-500 transition-colors text-sm"
                        >
                          {order.orderNumber ?? `#${order.id.slice(-12).toUpperCase()}`}
                        </Link>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {totalQty} item{totalQty !== 1 ? "s" : ""}
                        </p>
                      </td>

                      {/* Item images preview */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5">
                          {previewImgs.map((src: string | null, idx: number) => (
                            <div
                              key={idx}
                              className="w-10 h-10 rounded-lg border border-slate-200 bg-slate-50 overflow-hidden flex-shrink-0"
                            >
                              {src ? (
                                <Image
                                  src={src}
                                  alt="Product"
                                  width={40}
                                  height={40}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Package className="w-4 h-4 text-slate-300" />
                                </div>
                              )}
                            </div>
                          ))}
                          {extraItems > 0 && (
                            <div className="w-10 h-10 rounded-lg border border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-xs font-semibold text-slate-400">
                              +{extraItems}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Sellers */}
                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-1">
                          {sellers.slice(0, 2).map((name: string) => (
                            <div key={name} className="flex items-center gap-1.5">
                              <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-[9px] font-bold text-blue-500 flex-shrink-0">
                                {name[0]}
                              </div>
                              <span className="text-xs text-slate-600 truncate max-w-[100px]">{name}</span>
                            </div>
                          ))}
                          {sellers.length > 2 && (
                            <span className="text-xs text-slate-400">+{sellers.length - 2} more</span>
                          )}
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-4 text-sm text-slate-500 whitespace-nowrap">
                        {fmt(order.createdAt)}
                      </td>

                      {/* Total */}
                      <td className="px-4 py-4 text-right">
                        <p className="font-semibold text-slate-800 whitespace-nowrap">
                          ৳ {order.totalAmount.toLocaleString("en-BD", { minimumFractionDigits: 0 })}
                        </p>
                        {order.discountAmount > 0 && (
                          <p className="text-xs text-green-500 mt-0.5">
                            −৳ {order.discountAmount.toLocaleString()}
                          </p>
                        )}
                      </td>

                      {/* Payment */}
                      <td className="px-4 py-4 text-center">
                        <span className={`text-xs font-semibold ${PAYMENT_STYLE[order.paymentStatus as PaymentStatus]}`}>
                          {order.paymentStatus === "PENDING" ? "Unpaid" : order.paymentStatus}
                        </span>
                      </td>

                      {/* Order status */}
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full border ${STATUS_STYLE[order.status as OrderStatus]}`}>
                          {STATUS_LABEL[order.status as OrderStatus] ?? order.status}
                        </span>
                      </td>

                      {/* Actions - Only show Details and Track buttons */}
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            href={`/user-dashboard/orders/${order.id}`}
                            className="flex items-center gap-1 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                          >
                            Details
                            <ChevronRight className="w-3 h-3" />
                          </Link>
                          {(order.status === "SHIPPED" || order.status === "DELIVERED") && (
                            <Link
                              href={`/user-dashboard/orders/${order.id}/tracking`}
                              className="flex items-center gap-1 text-xs font-medium text-sky-600 bg-sky-50 hover:bg-sky-100 px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap border border-sky-200"
                            >
                              <Truck className="w-3 h-3" />
                              Track
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Pagination ── */}
      {localTotalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-400">
            Showing{" "}
            <span className="font-medium text-slate-600">
              {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)}
            </span>{" "}
            of <span className="font-medium text-slate-600">{filtered.length}</span> orders
          </p>
          <div className="flex items-center gap-1">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded-lg text-slate-500
                hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors bg-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: localTotalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === localTotalPages || Math.abs(p - page) <= 1)
              .reduce((acc: (number | "…")[], p, idx, arr) => {
                if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push("…");
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === "…" ? (
                  <span key={`e${i}`} className="w-8 h-8 flex items-center justify-center text-xs text-slate-400">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p as number)}
                    className={`w-8 h-8 flex items-center justify-center text-xs font-medium border rounded-lg transition-colors
                      ${page === p
                        ? "bg-blue-500 border-blue-500 text-white"
                        : "bg-white border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-500"
                      }`}
                  >
                    {p}
                  </button>
                )
              )}
            <button
              disabled={page === localTotalPages}
              onClick={() => setPage((p) => p + 1)}
              className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded-lg text-slate-500
                hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors bg-white"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}