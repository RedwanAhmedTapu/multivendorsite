// app/pos/components/modals/CustomerFormModal.tsx
"use client";

import { useState } from "react";
import { Save, X } from "lucide-react";
import {
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  type PosCustomer,
} from "@/features/posApi";
import { creditStatus } from "@/lib/pos/credit";

const inp =
  "w-full bg-white border border-cyan-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition-all";

export default function CustomerFormModal({
  editData,
  canSetCredit = false,
  onClose,
  onSaved,
}: {
  editData?: PosCustomer | null;
  /** posCredit (owner, or staff with POS Credit Sales). Without it the form never sends credit terms. */
  canSetCredit?: boolean;
  onClose: () => void;
  onSaved: (customer: PosCustomer) => void;
}) {
  const [form, setForm] = useState({
    name: editData?.name ?? "",
    phone: editData?.phone ?? "",
    email: editData?.email ?? "",
    address: editData?.address ?? "",
    note: editData?.note ?? "",
  });
  const [loanLimit, setLoanLimit] = useState(String(editData?.loanLimit ?? 0));
  const credit = creditStatus(editData);
  const [error, setError] = useState("");

  const [createCustomer, { isLoading: creating }] = useCreateCustomerMutation();
  const [updateCustomer, { isLoading: updating }] = useUpdateCustomerMutation();
  const busy = creating || updating;

  const upd = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.name || !form.phone) {
      setError("Name and phone are required");
      return;
    }
    const limit = Number(loanLimit);
    if (canSetCredit && (!Number.isFinite(limit) || limit < 0)) {
      setError("Credit limit must be 0 or more");
      return;
    }
    // Credit terms are sent only by users allowed to set them (the server refuses them otherwise).
    const body = canSetCredit ? { ...form, loanLimit: Math.round(limit * 100) / 100 } : form;
    try {
      if (editData) {
        const res = await updateCustomer({ id: editData.id, ...body }).unwrap();
        onSaved(res.data);
      } else {
        const res = await createCustomer(body).unwrap();
        onSaved(res.data);
      }
    } catch (err: any) {
      setError(err?.data?.message || "Failed to save customer");
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md border border-cyan-100 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <span className="font-bold text-slate-700">
            {editData ? "Edit Customer" : "Add Customer"}
          </span>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400"
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <input className={inp} value={form.name} onChange={(e) => upd("name", e.target.value)} placeholder="Customer's full name" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">
              Phone <span className="text-rose-500">*</span>
            </label>
            <input className={inp} value={form.phone} onChange={(e) => upd("phone", e.target.value)} placeholder="01XXX-XXXXXX" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">
              Email
            </label>
            <input type="email" className={inp} value={form.email} onChange={(e) => upd("email", e.target.value)} placeholder="customer@email.com" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">
              Address
            </label>
            <textarea rows={2} className={inp + " resize-none"} value={form.address} onChange={(e) => upd("address", e.target.value)} placeholder="Full address" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">
              Internal Note
            </label>
            <textarea rows={2} className={inp + " resize-none"} value={form.note} onChange={(e) => upd("note", e.target.value)} placeholder="VIP, preferences..." />
          </div>
          {canSetCredit ? (
            <div>
              <label htmlFor="pos-customer-credit-limit" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">
                Credit Limit
              </label>
              <input id="pos-customer-credit-limit" aria-label="Credit limit" type="number" min={0} step="0.01" className={inp} value={loanLimit} onChange={(e) => setLoanLimit(e.target.value)} placeholder="0" />
              <p className="text-[10px] text-slate-400 mt-1">
                0 = no credit facility.
                {editData ? ` Outstanding due ${credit.outstanding.toFixed(2)}${credit.hasFacility ? ` · ${credit.available.toFixed(2)} available` : ""}.` : ""}
              </p>
            </div>
          ) : editData && (editData.loanLimit > 0 || editData.due > 0) ? (
            <p className="text-[10px] text-slate-400">
              Credit limit {credit.limit.toFixed(2)} · outstanding {credit.outstanding.toFixed(2)}. Changing it needs the POS Credit Sales permission.
            </p>
          ) : null}
          {error && <div className="text-xs font-semibold text-red-600">⚠ {error}</div>}
        </div>
        <div className="flex gap-2.5 px-5 py-4 border-t border-slate-100 shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-500 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={busy}
            className="flex-1 py-2 text-xs font-bold bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl shadow-md shadow-blue-200 transition-all flex items-center justify-center gap-1.5 disabled:opacity-60"
          >
            <Save size={13} /> {busy ? "Saving..." : "Save Customer"}
          </button>
        </div>
      </div>
    </div>
  );
}