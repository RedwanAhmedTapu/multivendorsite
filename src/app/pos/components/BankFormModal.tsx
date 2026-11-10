// app/pos/components/modals/BankFormModal.tsx
"use client";

import { useState } from "react";
import { Save, X } from "lucide-react";
import { useCreateBankAccountMutation, type PosBankAccount } from "@/features/posApi";
import { inputCls, labelCls } from "../ui";

export default function BankFormModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: (bank: PosBankAccount) => void;
}) {
  const [form, setForm] = useState({ bankName: "", accountName: "", accountNo: "", routing: "", branch: "" });
  const [error, setError] = useState("");
  const [createBank, { isLoading }] = useCreateBankAccountMutation();

  const upd = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.bankName || !form.accountNo) { setError("Bank name and account number are required"); return; }
    try {
      const res = await createBank(form).unwrap();
      onSaved(res.data);
    } catch (err: any) {
      setError(err?.data?.message || "Failed to save bank account");
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md border border-cyan-100">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <span className="font-bold text-slate-700">New Bank Account</span>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Bank Name <span className="text-rose-500">*</span></label>
              <input className={inputCls} placeholder="e.g. Dutch-Bangla Bank" value={form.bankName} onChange={(e) => upd("bankName", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Branch</label>
              <input className={inputCls} placeholder="Branch name" value={form.branch} onChange={(e) => upd("branch", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Account Name</label>
              <input className={inputCls} placeholder="As per cheque" value={form.accountName} onChange={(e) => upd("accountName", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Account No. <span className="text-rose-500">*</span></label>
              <input className={inputCls + " font-mono"} placeholder="Account number" value={form.accountNo} onChange={(e) => upd("accountNo", e.target.value)} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Routing No.</label>
            <input className={inputCls + " font-mono"} placeholder="9-digit routing" value={form.routing} onChange={(e) => upd("routing", e.target.value)} />
          </div>
          {error && <div className="text-xs font-semibold text-red-600">⚠ {error}</div>}
          <div className="flex gap-2.5 pt-1">
            <button onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-500 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">Cancel</button>
            <button onClick={handleSave} disabled={isLoading} className="flex-1 py-2 text-xs font-bold bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl shadow-md shadow-blue-200 transition-all flex items-center justify-center gap-1.5 disabled:opacity-60">
              <Save size={13} /> {isLoading ? "Saving..." : "Save Bank"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}