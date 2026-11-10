// app/pos/components/views/InvoicesView.tsx
"use client";

import { useState } from "react";
import { Search, Receipt as ReceiptIcon } from "lucide-react";
import { useGetSalesQuery, type PosSale, type PosSaleStatus } from "@/features/posApi";
import ReceiptModal from "../ReceiptModal";
import { Badge, EmptyState, fmt } from "../../ui";

type StatusFilter = "ALL" | PosSaleStatus;

const STATUS_TABS: Array<{ id: StatusFilter; label: string }> = [
  { id: "ALL", label: "All" },
  { id: "PAID", label: "Paid" },
  { id: "PENDING", label: "Pending" },
  { id: "REFUNDED", label: "Refunded" },
  { id: "VOIDED", label: "Voided" },
];

const STATUS_BADGE: Record<PosSaleStatus, "green" | "amber" | "blue" | "red"> = {
  PAID: "green",
  PENDING: "amber",
  REFUNDED: "blue",
  VOIDED: "red",
};

export default function InvoicesView({ storeName, vendorId }: { storeName: string; vendorId: string }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const { data, isFetching } = useGetSalesQuery({
    q: q || undefined,
    status: status === "ALL" ? undefined : status,
  });
  const sales = data?.data ?? [];
  const pagination = data?.pagination;

  const [viewing, setViewing] = useState<PosSale | null>(null);

  const totalNet = sales.reduce((s, sale) => s + (sale.netBilling ?? 0), 0);
  const totalDue = sales.reduce((s, sale) => s + (sale.dueAmount ?? 0), 0);

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white px-5 py-4 border-b border-slate-100 shrink-0 flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="text-sm font-bold text-slate-800">Invoices</div>
          <div className="text-[10px] text-slate-400">
            {pagination?.total ?? sales.length} invoices · {fmt(totalNet)} billed{totalDue > 0 ? ` · ${fmt(totalDue)} due` : ""}
          </div>
        </div>
      </div>

      <div className="p-4 shrink-0 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search invoice #, customer..."
            className="w-full pl-9 py-2.5 text-sm bg-white border border-cyan-100 rounded-xl focus:outline-none focus:border-cyan-300 transition-all"
          />
        </div>
        <div className="flex gap-1.5 bg-slate-100 rounded-xl p-1 w-fit overflow-x-auto">
          {STATUS_TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setStatus(t.id)}
              className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all whitespace-nowrap ${
                status === t.id ? "bg-white text-cyan-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {isFetching && !sales.length && (
          <div className="text-center text-xs text-slate-400 py-10">Loading invoices...</div>
        )}
        {!isFetching && !sales.length && (
          <div className="h-full flex items-center justify-center py-10">
            <EmptyState icon={<span className="text-4xl">🧾</span>} text={q ? "No invoices match your search" : "No invoices yet"} />
          </div>
        )}

        {sales.length > 0 && (
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-xs border border-slate-100 rounded-xl overflow-hidden bg-white shadow-sm">
              <thead>
                <tr className="bg-slate-800 text-white">
                  <th className="px-4 py-3 text-left">Invoice #</th>
                  <th className="px-4 py-3 text-left">Customer</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Payment</th>
                  <th className="px-4 py-3 text-right">Net Billing</th>
                  <th className="px-4 py-3 text-right">Due</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((s) => (
                  <tr
                    key={s.id}
                    onClick={() => setViewing(s)}
                    className="border-b border-slate-50 last:border-0 hover:bg-cyan-50/50 cursor-pointer transition-all"
                  >
                    <td className="px-4 py-3 font-bold text-slate-700">{s.invoiceNo}</td>
                    <td className="px-4 py-3 text-slate-600">{s.customer?.name ?? "Walk-in"}</td>
                    <td className="px-4 py-3 text-slate-400">{new Date(s.saleDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-slate-600">{s.paymentMethod}</td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-slate-700">{fmt(s.netBilling)}</td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-amber-600">
                      {s.dueAmount > 0 ? fmt(s.dueAmount) : "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge color={STATUS_BADGE[s.status]}>{s.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {sales.length > 0 && (
          <div className="md:hidden space-y-2.5">
            {sales.map((s) => (
              <button
                key={s.id}
                onClick={() => setViewing(s)}
                className="w-full text-left bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex items-center gap-3"
              >
                <div className="w-9 h-9 rounded-xl bg-cyan-50 flex items-center justify-center text-cyan-500 shrink-0">
                  <ReceiptIcon size={15} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-slate-800">{s.invoiceNo}</span>
                    <Badge color={STATUS_BADGE[s.status]}>{s.status}</Badge>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {s.customer?.name ?? "Walk-in"} · {new Date(s.saleDate).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-bold text-slate-800">{fmt(s.netBilling)}</div>
                  {s.dueAmount > 0 && <div className="text-[10px] font-semibold text-amber-600">{fmt(s.dueAmount)} due</div>}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {viewing && (
        <ReceiptModal
          sale={viewing}
          storeName={storeName}
          vendorId={vendorId}
          onClose={() => setViewing(null)}
          onNewSale={() => setViewing(null)}
        />
      )}
    </div>
  );
}