// app/pos/components/modals/CustomerPickerModal.tsx
"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";
import { useGetCustomersQuery, type PosCustomer } from "@/features/posApi";
import { fmt } from "../ui";

export default function CustomerPickerModal({
  onClose,
  onSelect,
  onAddNew,
}: {
  onClose: () => void;
  onSelect: (customer: PosCustomer | null) => void;
  onAddNew: () => void;
}) {
  const [q, setQ] = useState("");
  const { data, isFetching } = useGetCustomersQuery({ q: q || undefined });
  const customers = data?.data ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md border border-cyan-100 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <span className="font-bold text-slate-700">Select Customer</span>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400"
          >
            <X size={16} />
          </button>
        </div>
        <div className="p-4 shrink-0">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name, phone..."
              className="w-full pl-9 py-2.5 text-sm bg-slate-50 border border-cyan-100 rounded-xl focus:outline-none focus:border-cyan-300 transition-all"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 space-y-1.5">
          {isFetching && (
            <div className="text-center text-xs text-slate-400 py-6">Searching...</div>
          )}
          {!isFetching && customers.length === 0 && (
            <div className="text-center text-xs text-slate-400 py-6">No customers found</div>
          )}
          {customers.map((c) => (
            <button
              key={c.id}
              onClick={() => onSelect(c)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-slate-100 hover:bg-cyan-50 hover:border-cyan-200 text-left transition-all"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-200 to-cyan-200 flex items-center justify-center text-sm font-bold text-blue-700 shrink-0">
                {c.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-slate-700">{c.name}</div>
                <div className="text-xs text-slate-400">{c.phone}</div>
                {c.due > 0 && (
                  <div className="text-[10px] text-amber-500 font-semibold">
                    Due: {fmt(c.due)}
                  </div>
                )}
              </div>
              <div className="text-xs font-bold text-cyan-600">{c.orders}x</div>
            </button>
          ))}
        </div>
        <div className="flex gap-2 px-4 py-4 border-t border-slate-100 shrink-0">
          <button
            onClick={() => onSelect(null)}
            className="flex-1 py-2 text-xs font-semibold text-slate-500 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
          >
            👤 Walk-in
          </button>
          <button
            onClick={onAddNew}
            className="flex-1 py-2 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl transition-all"
          >
            + Add New
          </button>
        </div>
      </div>
    </div>
  );
}