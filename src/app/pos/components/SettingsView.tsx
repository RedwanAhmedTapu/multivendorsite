// app/pos/components/views/SettingsView.tsx
"use client";

import { useEffect, useState } from "react";
import { Building2 } from "lucide-react";
import {
  useGetSettingsQuery,
  useUpdateSettingsMutation,
  type PosStaff,
} from "@/features/posApi";
import { inputCls, labelCls, EmptyState } from "../ui";

export default function SettingsView({ staff, storeName, vendorId }: { staff: PosStaff; storeName: string; vendorId: string }) {
  const { data: settingsRes } = useGetSettingsQuery();
  const settings = settingsRes?.data;
  const [updateSettings, { isLoading: saving }] = useUpdateSettingsMutation();

  const [form, setForm] = useState({ invoicePrefix: "", voucherPrefix: "", currencySymbol: "৳", receiptFooterText: "", storeOnline: true });

  useEffect(() => {
    if (settings) {
      setForm({
        invoicePrefix: settings.invoicePrefix ?? "",
        voucherPrefix: settings.voucherPrefix ?? "",
        currencySymbol: settings.currencySymbol ?? "৳",
        receiptFooterText: settings.receiptFooterText ?? "",
        storeOnline: settings.storeOnline ?? true,
      });
    }
  }, [settings]);

  if (!staff.isAdmin) {
    return <div className="h-full flex items-center justify-center"><EmptyState icon={<span className="text-4xl">🚫</span>} text="Admin access required" /></div>;
  }

  const upd = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));
  const save = () => updateSettings(form);

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="bg-white px-5 py-4 border-b border-slate-100 shrink-0">
        <div className="text-sm font-bold text-slate-800">Settings</div>
        <div className="text-[10px] text-slate-400">Store, invoice & receipt details</div>
      </div>
      <div className="p-5 max-w-2xl space-y-6">
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="text-xs font-bold text-slate-700 mb-4 flex items-center gap-2"><Building2 size={14} className="text-cyan-500" /> Store Information</div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Store Name</label>
              <input className={inputCls + " bg-slate-50 text-slate-400"} value={storeName} readOnly />
            </div>
            <div>
              <label className={labelCls}>Vendor ID</label>
              <input className={inputCls + " font-mono bg-slate-50 text-slate-400"} value={vendorId} readOnly />
            </div>
            <div>
              <label className={labelCls}>Invoice Prefix</label>
              <input className={inputCls + " font-mono"} value={form.invoicePrefix} onChange={(e) => upd("invoicePrefix", e.target.value)} placeholder="INV-" />
            </div>
            <div>
              <label className={labelCls}>Voucher Prefix</label>
              <input className={inputCls + " font-mono"} value={form.voucherPrefix} onChange={(e) => upd("voucherPrefix", e.target.value)} placeholder="POSV-" />
            </div>
            <div>
              <label className={labelCls}>Currency Symbol</label>
              <input className={inputCls} value={form.currencySymbol} onChange={(e) => upd("currencySymbol", e.target.value)} placeholder="৳" />
            </div>
            <div className="flex items-end pb-2.5">
              <button onClick={() => upd("storeOnline", !form.storeOnline)} className="flex items-center gap-2">
                <div className={`w-9 h-5 rounded-full relative transition-all ${form.storeOnline ? "bg-green-500" : "bg-slate-300"}`}>
                  <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${form.storeOnline ? "left-4.5" : "left-0.5"}`} />
                </div>
                <span className="text-xs font-bold text-slate-600">Store Online</span>
              </button>
            </div>
          </div>
          <div className="mt-3">
            <label className={labelCls}>Receipt Footer Text</label>
            <input className={inputCls} value={form.receiptFooterText} onChange={(e) => upd("receiptFooterText", e.target.value)} placeholder="Thank you for your purchase!" />
          </div>
          <button onClick={save} disabled={saving} className="mt-4 px-4 py-2 text-xs font-bold bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl shadow-md shadow-blue-200 transition-all disabled:opacity-60">
            💾 {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}