// app/pos/components/views/CustomersView.tsx
"use client";

import { useState } from "react";
import { Search, Plus, Pencil, Phone, Mail, MapPin, Wallet, CreditCard } from "lucide-react";
import {
  useGetCustomersQuery,
  type PosCustomer,
  type PosStaff,
} from "@/features/posApi";
import CustomerFormModal from "../CustomerFormModal";
import { creditStatus } from "@/lib/pos/credit";
import { Badge, EmptyState, fmt } from "../../ui";

export default function CustomersView({ staff }: { staff: PosStaff }) {
  const [q, setQ] = useState("");
  const { data, isFetching } = useGetCustomersQuery({ q: q || undefined });
  const customers = data?.data ?? [];

  const [editing, setEditing] = useState<PosCustomer | null | undefined>(undefined);

  const canManage = staff.isAdmin || !!staff.permissions?.canManageCustomers;
  // posCredit on the server; the form only sends credit terms when this is true.
  const canSetCredit = staff.isAdmin || !!staff.permissions?.canGrantLoan;

  const totalDue = customers.reduce((s, c) => s + (c.due ?? 0), 0);

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3 shrink-0 flex-wrap">
        <div>
          <div className="text-sm font-bold text-slate-800">Customers</div>
          <div className="text-[10px] text-slate-400">
            {customers.length} customers{totalDue > 0 ? ` · ${fmt(totalDue)} total due` : ""}
          </div>
        </div>
        {canManage && (
          <button
            onClick={() => setEditing(null)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl shadow-md shadow-blue-200 hover:from-blue-700 hover:to-cyan-600 transition-all"
          >
            <Plus size={13} /> Add Customer
          </button>
        )}
      </div>

      <div className="p-4 shrink-0">
        <div className="relative max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name or phone..."
            className="w-full pl-9 py-2.5 text-sm bg-white border border-cyan-100 rounded-xl focus:outline-none focus:border-cyan-300 transition-all"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2.5">
        {isFetching && !customers.length && (
          <div className="text-center text-xs text-slate-400 py-10">Loading customers...</div>
        )}
        {!isFetching && !customers.length && (
          <div className="h-full flex items-center justify-center py-10">
            <EmptyState icon={<span className="text-4xl">👥</span>} text={q ? "No customers match your search" : "No customers yet"} />
          </div>
        )}
        {customers.map((c) => (
          <div key={c.id} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-200 to-cyan-200 flex items-center justify-center text-sm font-bold text-blue-700 shrink-0">
              {c.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-extrabold text-slate-800">{c.name}</span>
                {c.due > 0 && <Badge color="amber">Due {fmt(c.due)}</Badge>}
                {c.orders > 0 && <Badge color="teal">{c.orders} orders</Badge>}
                {c.creditScore && <Badge color="purple">{c.creditScore}</Badge>}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-[11px] text-slate-400">
                {c.phone && (
                  <span className="flex items-center gap-1"><Phone size={11} /> {c.phone}</span>
                )}
                {c.email && (
                  <span className="flex items-center gap-1"><Mail size={11} /> {c.email}</span>
                )}
                {c.address && (
                  <span className="flex items-center gap-1 truncate max-w-[220px]"><MapPin size={11} /> {c.address}</span>
                )}
              </div>
              {c.note && (
                <div className="text-[11px] text-slate-400 italic mt-1">"{c.note}"</div>
              )}
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
                {(c.loanLimit > 0 || c.due > 0) && (() => {
                  const cr = creditStatus(c);
                  return (
                    <div className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                      <CreditCard size={11} /> Credit:{" "}
                      {cr.hasFacility ? (
                        <span className="text-slate-600">{fmt(cr.outstanding)} / {fmt(cr.limit)} · {fmt(cr.available)} available</span>
                      ) : (
                        <span className="text-amber-600">no facility</span>
                      )}
                    </div>
                  );
                })()}
                {c.walletBalance > 0 && (
                  <div className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                    <Wallet size={11} /> Wallet: <span className="text-slate-600">{fmt(c.walletBalance)}</span>
                  </div>
                )}
                {c.spent > 0 && (
                  <div className="text-[10px] font-semibold text-slate-400">
                    Lifetime spent: <span className="text-slate-600">{fmt(c.spent)}</span>
                  </div>
                )}
              </div>
            </div>
            {canManage && (
              <div className="flex gap-1.5 shrink-0">
                <button
                  onClick={() => setEditing(c)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
                >
                  <Pencil size={12} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {editing !== undefined && (
        <CustomerFormModal editData={editing} canSetCredit={canSetCredit} onClose={() => setEditing(undefined)} onSaved={() => setEditing(undefined)} />
      )}
    </div>
  );
}