"use client";
import { useState, useCallback } from "react";
import {
  Search, Eye, CreditCard, Plus, ChevronRight, Building2,
  ShoppingCart, DollarSign, CheckCircle, AlertTriangle,
  Clock, X, Filter, Download, Calendar, Loader2, Hash,
  TrendingUp, Package, Truck, ChevronDown, ChevronUp,
  RotateCcw, FileText, Layers, ArrowUpRight,
} from "lucide-react";
import {
  useGetPurchaseOrdersQuery,
  useGetPurchaseOrderByIdQuery,
  usePayPurchaseDueMutation,
  type PurchaseOrder,
  type PurchaseOrderDetail,
  type PurchaseOrderStatus,
  type PurchaseOrderListParams,
} from "@/features/purchaseOrderApi";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PayDueModalState {
  open: boolean;
  purchaseId: string;
  purchaseNo: string;
  dueAmount: number;
  supplierName: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  PurchaseOrderStatus,
  { label: string; bg: string; text: string; border: string; icon: React.ReactNode }
> = {
  CONFIRMED: {
    label: "Confirmed",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    icon: <CheckCircle size={11} />,
  },
  PARTIALLY_PAID: {
    label: "Partial",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    icon: <Clock size={11} />,
  },
  PENDING: {
    label: "Pending",
    bg: "bg-slate-50",
    text: "text-slate-500",
    border: "border-slate-200",
    icon: <Clock size={11} />,
  },
  CANCELLED: {
    label: "Cancelled",
    bg: "bg-rose-50",
    text: "text-rose-600",
    border: "border-rose-200",
    icon: <X size={11} />,
  },
};

const COA_OPTIONS = [
  { value: "1020", label: "Cash in Hand" },
  { value: "1021", label: "BRAC Bank - Current" },
  { value: "1022", label: "Dutch Bangla Bank" },
  { value: "1023", label: "Islami Bank" },
];

const PAYMENT_METHODS = ["Bank Transfer", "Cash", "Cheque", "Mobile Banking", "Card"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return `৳${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: PurchaseOrderStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDING;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      {cfg.icon}
      {cfg.label}
    </span>
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

// ─── Select Box ───────────────────────────────────────────────────────────────

function SelectBox({
  options, value, onChange, placeholder = "Select...",
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

// ─── PO Detail Modal ──────────────────────────────────────────────────────────

function PODetailModal({
  purchaseId,
  onClose,
  onPayDue,
}: {
  purchaseId: string;
  onClose: () => void;
  onPayDue: (po: PurchaseOrder) => void;
}) {
  const { data, isLoading } = useGetPurchaseOrderByIdQuery(purchaseId, { skip: !purchaseId });
  const po = data?.data as PurchaseOrderDetail | undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[88vh] flex flex-col border border-blue-100">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
              <FileText size={15} className="text-white" />
            </div>
            <div>
              <div className="text-white font-bold text-sm">{po?.purchaseNo ?? "Loading..."}</div>
              <div className="text-white/70 text-xs">{po ? fmtDate(po.purchaseDate) : ""}</div>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center text-white transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 gap-2 text-cyan-500">
              <Loader2 size={20} className="animate-spin" />
              <span className="text-sm font-medium">Loading details...</span>
            </div>
          ) : !po ? (
            <div className="text-center py-16 text-slate-400">Purchase order not found</div>
          ) : (
            <>
              {/* Order Info Grid */}
              <div>
                <div className="flex items-center gap-1.5 mb-3">
                  <Hash size={12} className="text-cyan-500" />
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Order Info</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { label: "Supplier", value: po.supplier.name },
                    { label: "Warehouse", value: po.warehouse.name },
                    { label: "Status", value: <StatusBadge status={po.status} /> },
                    { label: "Invoice No", value: po.supplierInvoiceNo ?? "—" },
                    { label: "Items", value: `${po.items.length} line item${po.items.length !== 1 ? "s" : ""}` },
                    { label: "Created", value: fmtDate(po.createdAt) },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-100">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</div>
                      <div className="text-sm font-semibold text-slate-700">{value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Items Table */}
              <div>
                <div className="flex items-center gap-1.5 mb-3">
                  <Package size={12} className="text-cyan-500" />
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Line Items</span>
                </div>
                <div className="overflow-x-auto rounded-xl border border-blue-100">
                  <table className="w-full min-w-[520px]">
                    <thead>
                      <tr className="bg-gradient-to-r from-blue-50 to-cyan-50">
                        {["Product", "SKU", "Qty", "Unit Cost", "Avg Cost", "Sell Price", "Total"].map((h) => (
                          <th key={h} className="text-left text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-3 py-2.5 border-b border-blue-100 whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {po.items.map((item, i) => (
                        <tr key={i} className="border-b border-slate-50 hover:bg-blue-50/30 transition-colors">
                          <td className="px-3 py-2.5">
                            <div className="text-xs font-semibold text-slate-700">{item.productName}</div>
                            <div className="text-xs text-slate-400">{item.variantName}</div>
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="font-mono text-xs text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded">{item.sku}</span>
                          </td>
                          <td className="px-3 py-2.5 text-sm font-bold text-slate-700">{item.quantity}</td>
                          <td className="px-3 py-2.5 font-mono text-xs text-slate-600">{fmt(item.unitCost)}</td>
                          <td className="px-3 py-2.5">
                            <span className="font-mono text-xs text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">{fmt(item.newAvgCost)}</span>
                          </td>
                          <td className="px-3 py-2.5 font-mono text-xs text-slate-600">{fmt(item.sellPrice)}</td>
                          <td className="px-3 py-2.5 font-mono text-sm font-bold text-blue-700">{fmt(item.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-blue-50/50 border-t border-blue-100">
                        <td colSpan={6} className="px-3 py-2.5 text-xs font-bold text-slate-500 text-right">Grand Total</td>
                        <td className="px-3 py-2.5 font-mono text-sm font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">{fmt(po.totalAmount)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Financial Summary */}
              <div>
                <div className="flex items-center gap-1.5 mb-3">
                  <DollarSign size={12} className="text-cyan-500" />
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Financial Summary</span>
                </div>
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-100 rounded-xl p-4 space-y-2">
                  {[
                    { label: "Subtotal", value: fmt(po.subtotal) },
                    { label: "VAT", value: fmt(po.vatAmount) },
                    { label: "Grand Total", value: fmt(po.totalAmount), bold: true },
                    { label: "Paid", value: fmt(po.paidAmount), color: "text-emerald-600" },
                    { label: "Due", value: fmt(po.dueAmount), color: po.dueAmount > 0 ? "text-amber-700" : "text-emerald-600" },
                  ].map(({ label, value, bold, color }) => (
                    <div key={label} className={`flex items-center justify-between ${bold ? "pt-2 border-t border-blue-200" : ""}`}>
                      <span className={`text-sm ${bold ? "font-bold text-slate-700" : "text-slate-500"}`}>{label}</span>
                      <span className={`font-mono text-sm font-bold ${color ?? (bold ? "text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500" : "text-slate-700")}`}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment History */}
              {po.payments && po.payments.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-3">
                    <CreditCard size={12} className="text-cyan-500" />
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Payment History</span>
                  </div>
                  <div className="space-y-2">
                    {po.payments.map((p, i) => (
                      <div key={i} className="flex items-center justify-between bg-white border border-emerald-100 rounded-xl px-4 py-2.5">
                        <div>
                          <div className="text-xs font-semibold text-slate-600">{p.method}</div>
                          {p.reference && <div className="text-xs text-slate-400 font-mono">{p.reference}</div>}
                          <div className="text-xs text-slate-400">{fmtDate(p.paidAt)}</div>
                        </div>
                        <div className="font-mono text-sm font-bold text-emerald-600">{fmt(p.amount)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Vouchers */}
              {po.vouchers && po.vouchers.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-3">
                    <Layers size={12} className="text-cyan-500" />
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Vouchers Posted</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {po.vouchers.map((v) => (
                      <div key={v.id} className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5">
                        <Hash size={10} className="text-blue-500" />
                        <span className="text-xs font-mono font-bold text-blue-700">{v.voucherNumber}</span>
                        <span className="text-xs text-blue-400">{v.voucherType}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-blue-50 bg-slate-50/50 flex items-center justify-between rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-500 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
            Close
          </button>
          {po && po.dueAmount > 0 && (
            <button
              onClick={() => { onPayDue(po); onClose(); }}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold rounded-xl hover:from-amber-600 hover:to-orange-600 shadow-md shadow-amber-200 transition-all active:scale-95"
            >
              <CreditCard size={13} />
              Pay Due {fmt(po.dueAmount)}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Pay Due Modal ────────────────────────────────────────────────────────────

function PayDueModal({
  state,
  onClose,
  onSuccess,
}: {
  state: PayDueModalState;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [amount, setAmount] = useState(String(state.dueAmount));
  const [method, setMethod] = useState("Bank Transfer");
  const [coaAccount, setCoaAccount] = useState("1021");
  const [reference, setReference] = useState("");
  const [error, setError] = useState("");

  const [payPurchaseDue, { isLoading }] = usePayPurchaseDueMutation();

  const paidNum = parseFloat(amount) || 0;
  const remaining = Math.max(0, state.dueAmount - paidNum);
  const bankLabel = COA_OPTIONS.find((o) => o.value === coaAccount)?.label ?? "Bank";

  const handlePay = async () => {
    setError("");
    if (!paidNum || paidNum <= 0) { setError("Enter a valid amount."); return; }
    if (paidNum > state.dueAmount) { setError(`Amount exceeds due (${fmt(state.dueAmount)}).`); return; }
    try {
      await payPurchaseDue({
        id: state.purchaseId,
        data: {
          amount: paidNum,
          method,
          coaAccountId: coaAccount,
          reference: reference || undefined,
          entityType: "VENDOR",
        },
      }).unwrap();
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.data?.message ?? "Payment failed. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-amber-100">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-amber-500 to-orange-500 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
              <CreditCard size={15} className="text-white" />
            </div>
            <div>
              <div className="text-white font-bold text-sm">Pay Due</div>
              <div className="text-white/70 text-xs">{state.supplierName} · {state.purchaseNo}</div>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center text-white transition-colors">
            <X size={15} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Due Info */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <div className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-0.5">Outstanding Due</div>
            <div className="font-mono text-2xl font-extrabold text-amber-700">{fmt(state.dueAmount)}</div>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2.5 text-sm text-rose-700">
              <AlertTriangle size={13} className="shrink-0" />
              {error}
            </div>
          )}

          {/* Fields */}
          <div className="space-y-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pay Amount *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold">৳</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-7 bg-white border border-cyan-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Method</label>
                <SelectBox
                  options={PAYMENT_METHODS.map((m) => ({ value: m, label: m }))}
                  value={method}
                  onChange={setMethod}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Account</label>
                <SelectBox options={COA_OPTIONS} value={coaAccount} onChange={setCoaAccount} />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Reference</label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="TXN / Cheque No..."
                className="w-full bg-white border border-cyan-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition-all"
              />
            </div>
          </div>

          {/* Journal Preview */}
          {paidNum > 0 && (
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-100 rounded-xl p-3">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Journal Entry Preview</div>
              <div className="space-y-1.5">
                {[
                  { side: "DR", acc: `AP – ${state.supplierName}`, amt: paidNum },
                  { side: "CR", acc: bankLabel, amt: paidNum },
                ].map((e) => (
                  <div key={e.side} className="flex items-center gap-2 text-xs">
                    <span className={`w-6 text-center font-bold rounded px-1 py-0.5 text-[10px] ${e.side === "DR" ? "bg-blue-100 text-blue-700" : "bg-cyan-100 text-cyan-700"}`}>{e.side}</span>
                    <span className="flex-1 text-slate-600">{e.acc}</span>
                    <span className="font-mono font-semibold text-slate-700">{fmt(e.amt)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-2 pt-2 border-t border-blue-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">Remaining after payment</span>
                <span className={`font-mono text-xs font-bold ${remaining > 0 ? "text-amber-600" : "text-emerald-600"}`}>{fmt(remaining)}</span>
              </div>
            </div>
          )}

          {/* Remaining */}
          <div className={`flex items-center gap-3 rounded-xl px-4 py-3 ${remaining > 0 ? "bg-amber-50 border border-amber-200" : "bg-emerald-50 border border-emerald-200"}`}>
            {remaining > 0
              ? <AlertTriangle size={15} className="text-amber-500 shrink-0" />
              : <CheckCircle size={15} className="text-emerald-500 shrink-0" />}
            <div>
              <div className={`text-[10px] font-bold uppercase tracking-wider ${remaining > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                {remaining > 0 ? "Remaining After Payment" : "Fully Cleared"}
              </div>
              <div className={`font-mono text-lg font-extrabold ${remaining > 0 ? "text-amber-700" : "text-emerald-700"}`}>{fmt(remaining)}</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-100 flex gap-3 justify-end rounded-b-2xl bg-slate-50/50">
          <button onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-500 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button
            onClick={handlePay}
            disabled={isLoading}
            className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold rounded-xl hover:from-amber-600 hover:to-orange-600 disabled:opacity-60 shadow-md shadow-amber-200 transition-all active:scale-95"
          >
            {isLoading ? <Loader2 size={13} className="animate-spin" /> : <CreditCard size={13} />}
            {isLoading ? "Processing..." : "Save Payment"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Table Row ────────────────────────────────────────────────────────────────

function PurchaseRow({
  po,
  onView,
  onPay,
}: {
  po: PurchaseOrder;
  onView: () => void;
  onPay: () => void;
}) {
  const paidPct = po.totalAmount > 0 ? Math.min(100, (po.paidAmount / po.totalAmount) * 100) : 0;

  return (
    <tr className="border-b border-slate-50 hover:bg-blue-50/30 group transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center shrink-0">
            <Hash size={11} className="text-blue-600" />
          </div>
          <span className="font-mono text-xs font-bold text-blue-700">{po.purchaseNo}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
        <div className="flex items-center gap-1">
          <Calendar size={11} className="text-slate-300" />
          {fmtDate(po.purchaseDate)}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="text-sm font-semibold text-slate-700 max-w-[140px] truncate">{po.supplier.name}</div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <Building2 size={11} className="text-slate-300 shrink-0" />
          <span className="truncate max-w-[100px]">{po.warehouse.name}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-center">
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-blue-50 text-blue-600 text-xs font-bold border border-blue-100">
          {po.items.length}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <span className="font-mono text-sm font-bold text-slate-700">{fmt(po.totalAmount)}</span>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-col gap-1 min-w-[80px]">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-semibold text-emerald-600">{fmt(po.paidAmount)}</span>
            <span className="text-[10px] text-slate-400">{Math.round(paidPct)}%</span>
          </div>
          <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${paidPct >= 100 ? "bg-gradient-to-r from-emerald-400 to-emerald-500" : paidPct > 0 ? "bg-gradient-to-r from-amber-400 to-orange-400" : "bg-slate-200"}`}
              style={{ width: `${paidPct}%` }}
            />
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-right">
        <span className={`font-mono text-sm font-semibold ${po.dueAmount > 0 ? "text-amber-600" : "text-slate-300"}`}>
          {fmt(po.dueAmount)}
        </span>
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={po.status} />
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onView}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-semibold rounded-lg border border-blue-200 transition-colors"
          >
            <Eye size={11} />
            View
          </button>
          {po.dueAmount > 0 && (
            <button
              onClick={onPay}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-semibold rounded-lg border border-amber-200 transition-colors"
            >
              <CreditCard size={11} />
              Pay
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PurchaseHistoryPage() {
  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [showFilters, setShowFilters] = useState(false);

  // Modals
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [payDueState, setPayDueState] = useState<PayDueModalState | null>(null);
  const [paySuccess, setPaySuccess] = useState("");

  // Query params
  const queryParams: PurchaseOrderListParams = {
    search: search || undefined,
    status: (statusFilter as PurchaseOrderStatus) || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    page,
    limit,
  };

  const { data, isLoading, isFetching, refetch } = useGetPurchaseOrdersQuery(queryParams);

  const orders = data?.data ?? [];
  const pagination = data?.pagination;
  const stats = data?.stats;

  const totalPages = pagination?.pages ?? 1;

  const handleReset = useCallback(() => {
    setSearch("");
    setStatusFilter("");
    setStartDate("");
    setEndDate("");
    setPage(1);
  }, []);

  const openPayDue = (po: PurchaseOrder) => {
    setPayDueState({
      open: true,
      purchaseId: po.id,
      purchaseNo: po.purchaseNo,
      dueAmount: po.dueAmount,
      supplierName: po.supplier.name,
    });
  };

  // ── Render ─────────────────────────────────────────────────────────────────
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
            <span className="text-slate-500">Inventory</span>
            <ChevronRight size={12} />
            <span className="font-semibold text-slate-700">Purchase History</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-500 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
            >
              <RotateCcw size={12} className={isFetching ? "animate-spin" : ""} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <a
              href="/purchase/new"
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-xs font-bold rounded-xl hover:from-blue-700 hover:to-cyan-600 shadow-md shadow-blue-200 transition-all hover:shadow-lg active:scale-95"
            >
              <Plus size={13} />
              New Purchase
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-5 sm:py-7">

        {/* Page Title */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">
              Purchase History
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">All-time purchase orders across all warehouses</p>
          </div>
          {stats && (
            <div className="text-xs text-slate-400 bg-white border border-blue-100 rounded-xl px-3 py-2 font-mono">
              {stats.count} orders · {fmt(stats.totalValue)} total
            </div>
          )}
        </div>

        {/* Success Alert */}
        {paySuccess && (
          <div className="mb-4 flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-700">
            <CheckCircle size={15} className="shrink-0" />
            <span>{paySuccess}</span>
            <button onClick={() => setPaySuccess("")} className="ml-auto text-emerald-400 hover:text-emerald-600"><X size={13} /></button>
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <StatCard
            label="Total Orders"
            value={stats?.count ?? "—"}
            sub="All time"
            icon={<ShoppingCart size={16} />}
            accent
          />
          <StatCard
            label="Total Value"
            value={stats ? fmt(stats.totalValue) : "—"}
            sub="Gross amount"
            icon={<TrendingUp size={16} />}
          />
          <StatCard
            label="Total Paid"
            value={stats ? fmt(stats.totalPaid) : "—"}
            sub="Settled"
            icon={<CheckCircle size={16} />}
          />
          <StatCard
            label="Outstanding"
            value={stats ? fmt(stats.totalDue) : "—"}
            sub="Due to suppliers"
            icon={<AlertTriangle size={16} />}
            warning={(stats?.totalDue ?? 0) > 0}
          />
        </div>

        {/* Filters Card */}
        <div className="bg-white rounded-2xl border border-blue-100 shadow-sm shadow-blue-50 mb-5">
          <div
            className="px-5 py-3.5 flex items-center justify-between cursor-pointer select-none"
            onClick={() => setShowFilters((s) => !s)}
          >
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-cyan-500" />
              <span className="text-sm font-bold text-slate-600">Filters</span>
              {(search || statusFilter || startDate || endDate) && (
                <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">Active</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {(search || statusFilter || startDate || endDate) && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleReset(); }}
                  className="text-xs text-slate-400 hover:text-rose-500 transition-colors flex items-center gap-1"
                >
                  <X size={11} /> Clear
                </button>
              )}
              {showFilters ? <ChevronUp size={15} className="text-slate-400" /> : <ChevronDown size={15} className="text-slate-400" />}
            </div>
          </div>

          {showFilters && (
            <div className="px-5 pb-5 border-t border-blue-50 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Search</label>
                  <div className="relative">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                      placeholder="PO # or supplier..."
                      className="w-full pl-9 pr-3 py-2.5 bg-white border border-cyan-200 rounded-xl text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition-all"
                    />
                  </div>
                </div>

                {/* Status */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status</label>
                  <SelectBox
                    options={[
                      { value: "CONFIRMED", label: "Confirmed" },
                      { value: "PARTIALLY_PAID", label: "Partially Paid" },
                      { value: "PENDING", label: "Pending" },
                      { value: "CANCELLED", label: "Cancelled" },
                    ]}
                    value={statusFilter}
                    onChange={(v) => { setStatusFilter(v); setPage(1); }}
                    placeholder="All Statuses"
                  />
                </div>

                {/* Date range */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">From Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                    className="w-full bg-white border border-cyan-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">To Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                    className="w-full bg-white border border-cyan-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition-all"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Table Card */}
        <div className="bg-white rounded-2xl border border-blue-100 shadow-sm shadow-blue-50">
          {/* Table Header */}
          <div className="px-5 py-4 border-b border-blue-50 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-sm">
                <Truck size={15} className="text-white" />
              </div>
              <div>
                <span className="text-sm font-bold text-slate-700">All Purchases</span>
                {pagination && (
                  <div className="text-xs text-slate-400 mt-0.5">
                    Showing {pagination.page > 1 ? (pagination.page - 1) * limit + 1 : 1}–{Math.min(pagination.page * limit, pagination.total)} of {pagination.total}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <SelectBox
                options={[
                  { value: "10", label: "10 / page" },
                  { value: "25", label: "25 / page" },
                  { value: "50", label: "50 / page" },
                ]}
                value={String(limit)}
                onChange={(v) => { setLimit(Number(v)); setPage(1); }}
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-20 gap-2 text-cyan-500">
                <Loader2 size={22} className="animate-spin" />
                <span className="text-sm font-medium">Loading purchases...</span>
              </div>
            ) : orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-300">
                <ShoppingCart size={40} className="mb-3 opacity-30" />
                <p className="text-sm font-medium text-slate-400">No purchase orders found</p>
                <p className="text-xs text-slate-300 mt-1">Try adjusting filters or create a new purchase</p>
                <a
                  href="/purchase/new"
                  className="mt-4 flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-200"
                >
                  <Plus size={13} />
                  New Purchase
                </a>
              </div>
            ) : (
              <table className="w-full min-w-[860px]">
                <thead>
                  <tr className="bg-gradient-to-r from-blue-50 to-cyan-50">
                    {[
                      "PO Number", "Date", "Supplier", "Warehouse", "Items",
                      "Total", "Paid", "Due", "Status", "Actions",
                    ].map((h, i) => (
                      <th
                        key={h}
                        className="text-left text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-4 py-3 border-b border-blue-100 whitespace-nowrap"
                        style={[5, 6, 7].includes(i) ? { textAlign: "right" } : i === 4 ? { textAlign: "center" } : {}}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map((po) => (
                    <PurchaseRow
                      key={po.id}
                      po={po}
                      onView={() => setViewingId(po.id)}
                      onPay={() => openPayDue(po)}
                    />
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3.5 border-t border-blue-50 bg-slate-50/50 rounded-b-2xl">
              <span className="text-xs text-slate-400">
                Page {page} of {totalPages}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                  className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                >
                  «
                </button>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                >
                  Prev
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                  const pg = start + i;
                  if (pg > totalPages) return null;
                  return (
                    <button
                      key={pg}
                      onClick={() => setPage(pg)}
                      className={`px-3 py-1.5 text-xs rounded-lg border transition-colors font-semibold ${
                        pg === page
                          ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white border-transparent shadow-md shadow-blue-200"
                          : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                      }`}
                    >
                      {pg}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                >
                  Next
                </button>
                <button
                  onClick={() => setPage(totalPages)}
                  disabled={page === totalPages}
                  className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                >
                  »
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* PO Detail Modal */}
      {viewingId && (
        <PODetailModal
          purchaseId={viewingId}
          onClose={() => setViewingId(null)}
          onPayDue={openPayDue}
        />
      )}

      {/* Pay Due Modal */}
      {payDueState && (
        <PayDueModal
          state={payDueState}
          onClose={() => setPayDueState(null)}
          onSuccess={() => {
            setPaySuccess(`✅ Payment recorded for ${payDueState.purchaseNo}`);
            refetch();
          }}
        />
      )}
    </div>
  );
}