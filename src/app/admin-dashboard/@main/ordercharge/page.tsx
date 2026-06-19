"use client";
import { useState, useCallback } from "react";
import {
  Plus, ChevronRight, Building2, ReceiptText, Percent, Tag,
  CheckCircle, AlertTriangle, X, Loader2, Hash, ToggleLeft,
  ToggleRight, Trash2, Pencil, RotateCcw, Settings2, Layers,
  ChevronDown, ArrowUpDown,
} from "lucide-react";
import {
  useListOrderChargesQuery,
  useCreateOrderChargeMutation,
  useUpdateOrderChargeMutation,
  useToggleOrderChargeMutation,
  useDeleteOrderChargeMutation,
  useGetOrderSummaryQuery,
  ChargeValueType,
  ChargeAppliesTo,
  type OrderChargeType,
} from "@/features/orderChargeApi";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChargeFormState {
  id?: string;
  key: string;
  label: string;
  type: ChargeValueType;
  value: string;
  appliesTo: ChargeAppliesTo;
  sortOrder: string;
  description: string;
  isActive: boolean;
}

const EMPTY_FORM: ChargeFormState = {
  key: "",
  label: "",
  type: ChargeValueType.FLAT,
  value: "",
  appliesTo: ChargeAppliesTo.ALL,
  sortOrder: "0",
  description: "",
  isActive: true,
};

// ─── Constants ────────────────────────────────────────────────────────────────

const APPLIES_TO_CONFIG: Record<ChargeAppliesTo, { label: string; bg: string; text: string; border: string }> = {
  [ChargeAppliesTo.ALL]: { label: "All Orders", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  [ChargeAppliesTo.COD_ONLY]: { label: "COD Only", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  [ChargeAppliesTo.PREPAID_ONLY]: { label: "Prepaid Only", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
};

const APPLIES_TO_OPTIONS = [
  { value: ChargeAppliesTo.ALL, label: "All Orders" },
  { value: ChargeAppliesTo.COD_ONLY, label: "COD Only" },
  { value: ChargeAppliesTo.PREPAID_ONLY, label: "Prepaid Only" },
];

const TYPE_OPTIONS = [
  { value: ChargeValueType.FLAT, label: "Flat Amount (৳)" },
  { value: ChargeValueType.PERCENTAGE, label: "Percentage (%)" },
];

const SAMPLE_SUBTOTAL = 786;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return `৳${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtValue(charge: OrderChargeType) {
  return charge.type === ChargeValueType.PERCENTAGE ? `${charge.value}%` : fmt(charge.value);
}

// ─── Select Box ───────────────────────────────────────────────────────────────

function SelectBox({
  options, value, onChange, placeholder,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none bg-white border border-cyan-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 pr-8 cursor-pointer transition-all"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-cyan-400 pointer-events-none" />
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, icon, accent = false, warning = false,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  accent?: boolean;
  warning?: boolean;
}) {
  return (
    <div className={`relative bg-white rounded-2xl border shadow-sm overflow-hidden ${
      accent ? "border-blue-200 shadow-blue-100" : warning ? "border-amber-200 shadow-amber-50" : "border-blue-100 shadow-blue-50"
    }`}>
      <div className={`absolute inset-x-0 top-0 h-0.5 ${
        accent ? "bg-gradient-to-r from-blue-600 to-cyan-500" : warning ? "bg-gradient-to-r from-amber-400 to-orange-400" : "bg-gradient-to-r from-blue-200 to-cyan-200"
      }`} />
      <div className="p-4">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${
          accent ? "bg-gradient-to-br from-blue-600 to-cyan-500 shadow-md shadow-blue-200" : warning ? "bg-gradient-to-br from-amber-400 to-orange-400 shadow-md shadow-amber-100" : "bg-blue-50 border border-blue-100"
        }`}>
          <span className={accent || warning ? "text-white" : "text-blue-500"}>{icon}</span>
        </div>
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</div>
        <div className={`text-xl font-extrabold font-mono tracking-tight ${
          accent ? "text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500" : warning ? "text-amber-700" : "text-slate-700"
        }`}>{value}</div>
        {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

// ─── Applies-To Badge ─────────────────────────────────────────────────────────

function AppliesToBadge({ appliesTo }: { appliesTo: ChargeAppliesTo }) {
  const cfg = APPLIES_TO_CONFIG[appliesTo] ?? APPLIES_TO_CONFIG.ALL;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      {cfg.label}
    </span>
  );
}

// ─── Charge Form Modal ────────────────────────────────────────────────────────

function ChargeFormModal({
  initial,
  onClose,
  onSaved,
}: {
  initial: ChargeFormState;
  onClose: () => void;
  onSaved: (msg: string) => void;
}) {
  const isEdit = Boolean(initial.id);
  const [form, setForm] = useState<ChargeFormState>(initial);
  const [error, setError] = useState("");

  const [createCharge, { isLoading: creating }] = useCreateOrderChargeMutation();
  const [updateCharge, { isLoading: updating }] = useUpdateOrderChargeMutation();
  const isLoading = creating || updating;

  const set = <K extends keyof ChargeFormState>(key: K, value: ChargeFormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async () => {
    setError("");
    if (!form.label.trim()) { setError("Label is required."); return; }
    if (!isEdit && !form.key.trim()) { setError("Key is required."); return; }
    const numericValue = parseFloat(form.value);
    if (isNaN(numericValue) || numericValue < 0) { setError("Enter a valid value."); return; }

    const sortOrder = parseInt(form.sortOrder, 10) || 0;

    try {
      if (isEdit && form.id) {
        await updateCharge({
          id: form.id,
          data: {
            label: form.label,
            type: form.type,
            value: numericValue,
            appliesTo: form.appliesTo,
            sortOrder,
            description: form.description || undefined,
            isActive: form.isActive,
          },
        }).unwrap();
        onSaved(`Updated "${form.label}".`);
      } else {
        await createCharge({
          key: form.key.trim().toUpperCase().replace(/\s+/g, "_"),
          label: form.label,
          type: form.type,
          value: numericValue,
          appliesTo: form.appliesTo,
          sortOrder,
          description: form.description || undefined,
          isActive: form.isActive,
        }).unwrap();
        onSaved(`Created "${form.label}".`);
      }
      onClose();
    } catch (err: any) {
      setError(err?.data?.message ?? "Save failed. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-blue-100">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
              <ReceiptText size={15} className="text-white" />
            </div>
            <div>
              <div className="text-white font-bold text-sm">{isEdit ? "Edit Charge" : "New Charge"}</div>
              <div className="text-white/70 text-xs">{isEdit ? form.key : "Add a dynamic order charge"}</div>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center text-white transition-colors">
            <X size={15} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2.5 text-sm text-rose-700">
              <AlertTriangle size={13} className="shrink-0" />
              {error}
            </div>
          )}

          {/* Label */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Display Label *</label>
            <input
              type="text"
              value={form.label}
              onChange={(e) => set("label", e.target.value)}
              placeholder="e.g. Platform Fee"
              className="w-full bg-white border border-cyan-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition-all"
            />
          </div>

          {/* Key (create only) */}
          {!isEdit && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Key *</label>
              <div className="relative">
                <Hash size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400" />
                <input
                  type="text"
                  value={form.key}
                  onChange={(e) => set("key", e.target.value.toUpperCase().replace(/\s+/g, "_"))}
                  placeholder="PLATFORM_FEE"
                  className="w-full pl-9 bg-white border border-cyan-200 rounded-xl px-3 py-2.5 text-sm font-mono text-slate-700 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition-all"
                />
              </div>
              <span className="text-[11px] text-slate-400">Used internally to identify this charge. Cannot be changed later.</span>
            </div>
          )}

          {/* Type & Value */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Charge Type</label>
              <SelectBox
                options={TYPE_OPTIONS}
                value={form.type}
                onChange={(v) => set("type", v as ChargeValueType)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Value *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold">
                  {form.type === ChargeValueType.PERCENTAGE ? <Percent size={13} /> : "৳"}
                </span>
                <input
                  type="number"
                  value={form.value}
                  onChange={(e) => set("value", e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-7 bg-white border border-cyan-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Applies to & sort order */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Applies To</label>
              <SelectBox
                options={APPLIES_TO_OPTIONS}
                value={form.appliesTo}
                onChange={(v) => set("appliesTo", v as ChargeAppliesTo)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Display Order</label>
              <div className="relative">
                <ArrowUpDown size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400" />
                <input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => set("sortOrder", e.target.value)}
                  className="w-full pl-9 bg-white border border-cyan-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Description</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Shown to admins only (optional)"
              className="w-full bg-white border border-cyan-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition-all"
            />
          </div>

          {/* Active toggle */}
          <div className="flex items-center justify-between bg-blue-50/50 border border-blue-100 rounded-xl px-4 py-3">
            <div>
              <div className="text-sm font-semibold text-slate-700">Active</div>
              <div className="text-xs text-slate-400">Applied to matching orders immediately</div>
            </div>
            <button
              onClick={() => set("isActive", !form.isActive)}
              className={form.isActive ? "text-emerald-500" : "text-slate-300"}
            >
              {form.isActive ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
            </button>
          </div>

          {/* Live preview */}
          {form.value && !isNaN(parseFloat(form.value)) && (
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-100 rounded-xl p-3">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Preview on {fmt(SAMPLE_SUBTOTAL)} subtotal</div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">{form.label || "—"}</span>
                <span className="font-mono font-bold text-slate-700">
                  {form.type === ChargeValueType.PERCENTAGE
                    ? fmt((SAMPLE_SUBTOTAL * parseFloat(form.value)) / 100)
                    : fmt(parseFloat(form.value))}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-100 flex gap-3 justify-end rounded-b-2xl bg-slate-50/50">
          <button onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-500 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-xs font-bold rounded-xl hover:from-blue-700 hover:to-cyan-600 disabled:opacity-60 shadow-md shadow-blue-200 transition-all active:scale-95"
          >
            {isLoading ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
            {isLoading ? "Saving..." : isEdit ? "Save Changes" : "Create Charge"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────

function DeleteConfirmModal({
  charge,
  onClose,
  onDeleted,
}: {
  charge: OrderChargeType;
  onClose: () => void;
  onDeleted: (msg: string) => void;
}) {
  const [deleteCharge, { isLoading }] = useDeleteOrderChargeMutation();
  const [error, setError] = useState("");

  const handleDelete = async () => {
    setError("");
    try {
      await deleteCharge(charge.id).unwrap();
      onDeleted(`Deleted "${charge.label}".`);
      onClose();
    } catch (err: any) {
      setError(err?.data?.message ?? "Delete failed. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-rose-100">
        <div className="px-5 py-4 bg-gradient-to-r from-rose-500 to-orange-500 rounded-t-2xl flex items-center gap-2.5">
          <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
            <Trash2 size={15} className="text-white" />
          </div>
          <div className="text-white font-bold text-sm">Delete Charge</div>
        </div>
        <div className="p-5 space-y-3">
          <p className="text-sm text-slate-600">
            Are you sure you want to delete <span className="font-bold text-slate-800">{charge.label}</span>? This will stop applying it to future order summaries.
          </p>
          {error && (
            <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2.5 text-sm text-rose-700">
              <AlertTriangle size={13} className="shrink-0" />
              {error}
            </div>
          )}
        </div>
        <div className="px-5 py-3.5 border-t border-slate-100 flex gap-3 justify-end rounded-b-2xl bg-slate-50/50">
          <button onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-500 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={isLoading}
            className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-rose-500 to-orange-500 text-white text-xs font-bold rounded-xl hover:from-rose-600 hover:to-orange-600 disabled:opacity-60 shadow-md shadow-rose-200 transition-all active:scale-95"
          >
            {isLoading ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
            {isLoading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Charge Row ───────────────────────────────────────────────────────────────

function ChargeRow({
  charge,
  onEdit,
  onDelete,
}: {
  charge: OrderChargeType;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [toggleCharge, { isLoading: toggling }] = useToggleOrderChargeMutation();

  const handleToggle = () => {
    toggleCharge({ id: charge.id, data: { isActive: !charge.isActive } });
  };

  return (
    <tr className="border-b border-slate-50 hover:bg-blue-50/30 group transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center shrink-0">
            <Tag size={11} className="text-blue-600" />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-700">{charge.label}</div>
            <span className="font-mono text-[10px] text-slate-400">{charge.key}</span>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border bg-slate-50 text-slate-500 border-slate-200">
          {charge.type === ChargeValueType.PERCENTAGE ? <Percent size={10} /> : <span className="font-mono">৳</span>}
          {charge.type === ChargeValueType.PERCENTAGE ? "Percentage" : "Flat"}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <span className="font-mono text-sm font-bold text-slate-700">{fmtValue(charge)}</span>
      </td>
      <td className="px-4 py-3">
        <AppliesToBadge appliesTo={charge.appliesTo} />
      </td>
      <td className="px-4 py-3 text-center">
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-blue-50 text-blue-600 text-xs font-bold border border-blue-100">
          {charge.sortOrder}
        </span>
      </td>
      <td className="px-4 py-3">
        <button onClick={handleToggle} disabled={toggling} className="disabled:opacity-50">
          {charge.isActive ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border bg-emerald-50 text-emerald-700 border-emerald-200">
              <CheckCircle size={11} /> Active
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border bg-slate-50 text-slate-400 border-slate-200">
              <X size={11} /> Inactive
            </span>
          )}
        </button>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onEdit}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-semibold rounded-lg border border-blue-200 transition-colors"
          >
            <Pencil size={11} />
            Edit
          </button>
          <button
            onClick={onDelete}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold rounded-lg border border-rose-200 transition-colors"
          >
            <Trash2 size={11} />
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─── Live Preview Card ────────────────────────────────────────────────────────

function LivePreviewCard() {
  const { data: codData } = useGetOrderSummaryQuery({ subtotal: SAMPLE_SUBTOTAL, paymentMethod: "COD" as any });
  const { data: prepaidData } = useGetOrderSummaryQuery({ subtotal: SAMPLE_SUBTOTAL, paymentMethod: "PREPAID" as any });

  const cod = codData?.data;
  const prepaid = prepaidData?.data;

  return (
    <div className="bg-white rounded-2xl border border-blue-100 shadow-sm shadow-blue-50">
      <div className="px-5 py-4 border-b border-blue-50 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-sm">
          <Settings2 size={15} className="text-white" />
        </div>
        <div>
          <span className="text-sm font-bold text-slate-700">Order Summary Preview</span>
          <div className="text-xs text-slate-400 mt-0.5">How charges apply on a {fmt(SAMPLE_SUBTOTAL)} order</div>
        </div>
      </div>
      <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { title: "Cash on Delivery", data: cod, badge: APPLIES_TO_CONFIG[ChargeAppliesTo.COD_ONLY] },
          { title: "Prepaid", data: prepaid, badge: APPLIES_TO_CONFIG[ChargeAppliesTo.PREPAID_ONLY] },
        ].map(({ title, data, badge }) => (
          <div key={title} className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-100 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-600">{title}</span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                {badge.label}
              </span>
            </div>
            {!data ? (
              <div className="flex items-center gap-2 text-cyan-500 py-4">
                <Loader2 size={14} className="animate-spin" />
                <span className="text-xs">Calculating...</span>
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="font-mono font-semibold text-slate-700">{fmt(data.subtotal)}</span>
                </div>
                {data.charges.map((c) => (
                  <div key={c.key} className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">{c.label}</span>
                    <span className="font-mono font-semibold text-slate-700">{fmt(c.amount)}</span>
                  </div>
                ))}
                <div className="pt-2 border-t border-blue-200 flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-700">Total</span>
                  <span className="font-mono text-sm font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">{fmt(data.total)}</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function OrderChargesPage() {
  const { data, isLoading, isFetching, refetch } = useListOrderChargesQuery();
  const charges = data?.data ?? [];

  const [formState, setFormState] = useState<ChargeFormState | null>(null);
  const [deletingCharge, setDeletingCharge] = useState<OrderChargeType | null>(null);
  const [successMsg, setSuccessMsg] = useState("");

  const stats = {
    total: charges.length,
    active: charges.filter((c) => c.isActive).length,
    inactive: charges.filter((c) => !c.isActive).length,
    percentageBased: charges.filter((c) => c.type === ChargeValueType.PERCENTAGE).length,
  };

  const openCreate = useCallback(() => {
    const nextSort = charges.length ? Math.max(...charges.map((c) => c.sortOrder)) + 1 : 0;
    setFormState({ ...EMPTY_FORM, sortOrder: String(nextSort) });
  }, [charges]);

  const openEdit = (charge: OrderChargeType) => {
    setFormState({
      id: charge.id,
      key: charge.key,
      label: charge.label,
      type: charge.type,
      value: String(charge.value),
      appliesTo: charge.appliesTo,
      sortOrder: String(charge.sortOrder),
      description: charge.description ?? "",
      isActive: charge.isActive,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/20 font-sans text-slate-800">

      {/* ── Top Nav ── */}
      <header className="bg-white/80 backdrop-blur-md border-b border-blue-100 sticky top-0 z-40 shadow-sm shadow-blue-50">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <div className="flex items-center gap-1.5 font-semibold text-cyan-600">
              <Building2 size={14} />
              <span>ERP</span>
            </div>
            <ChevronRight size={12} />
            <span className="text-slate-500">Settings</span>
            <ChevronRight size={12} />
            <span className="font-semibold text-slate-700">Order Charges</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-500 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
            >
              <RotateCcw size={12} className={isFetching ? "animate-spin" : ""} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-xs font-bold rounded-xl hover:from-blue-700 hover:to-cyan-600 shadow-md shadow-blue-200 transition-all hover:shadow-lg active:scale-95"
            >
              <Plus size={13} />
              New Charge
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-5 sm:py-7">

        {/* Page Title */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">
              Order Charges
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">Configure dynamic fees applied to customer order summaries</p>
          </div>
          <div className="text-xs text-slate-400 bg-white border border-blue-100 rounded-xl px-3 py-2 font-mono">
            {stats.total} charge{stats.total !== 1 ? "s" : ""} configured
          </div>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div className="mb-4 flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-700">
            <CheckCircle size={15} className="shrink-0" />
            <span>{successMsg}</span>
            <button onClick={() => setSuccessMsg("")} className="ml-auto text-emerald-400 hover:text-emerald-600"><X size={13} /></button>
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <StatCard label="Total Charges" value={stats.total} sub="Configured" icon={<ReceiptText size={16} />} accent />
          <StatCard label="Active" value={stats.active} sub="Applied to orders" icon={<CheckCircle size={16} />} />
          <StatCard label="Inactive" value={stats.inactive} sub="Not applied" icon={<AlertTriangle size={16} />} warning={stats.inactive > 0} />
          <StatCard label="Percentage-Based" value={stats.percentageBased} sub="Scale with subtotal" icon={<Percent size={16} />} />
        </div>

        {/* Live Preview */}
        <div className="mb-5">
          <LivePreviewCard />
        </div>

        {/* Table Card */}
        <div className="bg-white rounded-2xl border border-blue-100 shadow-sm shadow-blue-50">
          {/* Table Header */}
          <div className="px-5 py-4 border-b border-blue-50 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-sm">
                <Layers size={15} className="text-white" />
              </div>
              <div>
                <span className="text-sm font-bold text-slate-700">All Charges</span>
                <div className="text-xs text-slate-400 mt-0.5">Ordered by display order</div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-20 gap-2 text-cyan-500">
                <Loader2 size={22} className="animate-spin" />
                <span className="text-sm font-medium">Loading charges...</span>
              </div>
            ) : charges.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-300">
                <ReceiptText size={40} className="mb-3 opacity-30" />
                <p className="text-sm font-medium text-slate-400">No order charges configured</p>
                <p className="text-xs text-slate-300 mt-1">Create one to start applying it to order summaries</p>
                <button
                  onClick={openCreate}
                  className="mt-4 flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-200"
                >
                  <Plus size={13} />
                  New Charge
                </button>
              </div>
            ) : (
              <table className="w-full min-w-[760px]">
                <thead>
                  <tr className="bg-gradient-to-r from-blue-50 to-cyan-50">
                    {["Charge", "Type", "Value", "Applies To", "Order", "Status", "Actions"].map((h, i) => (
                      <th
                        key={h}
                        className="text-left text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-4 py-3 border-b border-blue-100 whitespace-nowrap"
                        style={i === 2 ? { textAlign: "right" } : i === 4 ? { textAlign: "center" } : {}}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...charges].sort((a, b) => a.sortOrder - b.sortOrder).map((charge) => (
                    <ChargeRow
                      key={charge.id}
                      charge={charge}
                      onEdit={() => openEdit(charge)}
                      onDelete={() => setDeletingCharge(charge)}
                    />
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {formState && (
        <ChargeFormModal
          initial={formState}
          onClose={() => setFormState(null)}
          onSaved={(msg) => { setSuccessMsg(msg); refetch(); }}
        />
      )}

      {/* Delete Modal */}
      {deletingCharge && (
        <DeleteConfirmModal
          charge={deletingCharge}
          onClose={() => setDeletingCharge(null)}
          onDeleted={(msg) => { setSuccessMsg(msg); refetch(); }}
        />
      )}
    </div>
  );
}