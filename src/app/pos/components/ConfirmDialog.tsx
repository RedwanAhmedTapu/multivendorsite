// app/pos/components/modals/ConfirmDialog.tsx
"use client";

import { AlertTriangle, CheckCircle } from "lucide-react";

export default function ConfirmDialog({
  title,
  message,
  tone = "amber",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  busy,
  children,
}: {
  title: string;
  message: string;
  tone?: "amber" | "red" | "green" | "blue";
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  busy?: boolean;
  children?: React.ReactNode;
}) {
  const toneCls: Record<string, string> = {
    amber: "bg-amber-50 text-amber-500",
    red: "bg-red-50 text-red-500",
    green: "bg-green-50 text-green-500",
    blue: "bg-blue-50 text-blue-500",
  };
  const btnCls: Record<string, string> = {
    amber: "bg-amber-500 hover:bg-amber-600",
    red: "bg-red-600 hover:bg-red-700",
    green: "bg-green-600 hover:bg-green-700",
    blue: "bg-gradient-to-r from-blue-600 to-cyan-500",
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-slate-900/70 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-sm border border-slate-100 p-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start gap-3 mb-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${toneCls[tone]}`}>
            {tone === "green" ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          </div>
          <div>
            <div className="font-bold text-slate-800 text-sm mb-1">{title}</div>
            <div className="text-xs text-slate-500 leading-relaxed">{message}</div>
          </div>
        </div>
        {children}
        <div className="flex gap-2.5 mt-4">
          <button
            onClick={onCancel}
            className="flex-1 py-2 text-xs font-semibold text-slate-500 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className={`flex-1 py-2 text-xs font-bold text-white rounded-xl transition-all disabled:opacity-60 ${btnCls[tone]}`}
          >
            {busy ? "Working..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}