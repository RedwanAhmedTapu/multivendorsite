"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  
  Search,
  Eye,
  CreditCard,
  Plus,
  ChevronRight,
  Building2,
  ShoppingCart,
  DollarSign,
  CheckCircle,
  AlertTriangle,
  Clock,
  X,
  Filter,
  Loader2,
  Hash,
  Package,
  Truck,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  FileText,
  Layers,
  ChevronLeft,
  Wallet,
  Boxes,
  Ban,
  Scissors,
  Undo2,
  Banknote,
  Plus as PlusIcon,
  Trash2,
  Info,
  Sparkles,
  MoreVertical,
  Smartphone,
  
} from "lucide-react";
import {
  useGetPurchaseOrdersQuery,
  useGetPurchaseOrderByIdQuery,
  useReceivePurchaseOrderMutation,
  usePayPurchaseDueMutation,
  useShortClosePurchaseOrderMutation,
  useCancelPurchaseOrderMutation,
  type ReceivingStatus,
  type PaymentStatus,
  type ReceivePurchaseOrderItemInput,
  type PurchaseOrderDetail,
  type PurchaseOrderItem,
} from "@/features/purchaseOrderApi";
import {
  useGetVendorPaymentAccountsQuery,
  type VendorPaymentAccount,
  type PaymentInstrumentType,
} from "@/features/vendorManageApi";
import {
  useGetSuppliersQuery,
  type SupplierStatus,
} from "@/features/supplierApi";
import {
  useGetRacksByWarehouseQuery,
  useGetWarehousesByVendorQuery,
  WarehouseType,
} from "@/features/warehouseApi";
import { useAppSelector } from "@/store/store";
// Adjust this import path to wherever WarehouseRackSelector actually lives in
// your project. We only need the two "create" modals from it here — the
// same ones the warehouse/rack picker screen uses — so a Purchase Order
// receiver never has to leave this page just because a warehouse or rack
// doesn't exist yet.
import {
  CreateRackModal,
  type CreatedWarehouseResult,
  type CreatedRackResult,
} from "./WarehouseRack";
import { WarehouseFormDialog } from "@/components/warehouse/WarehouseFormDialog";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Filters {
  search: string;
  warehouseId: string;
  warehouseType: WarehouseType | "";
  supplierStatus: SupplierStatus | "";
  supplierId: string;
  receivingStatus: ReceivingStatus | "";
  paymentStatus: PaymentStatus | "";
  page: number;
  limit: number;
}

type SortField = "purchaseDate" | "dueAmount" | null;
type SortDir = "asc" | "desc";

// ─── Constants ────────────────────────────────────────────────────────────────

const RECEIVING_CONFIG: Record<
  string,
  {
    label: string;
    bg: string;
    text: string;
    border: string;
    icon: React.ReactNode;
  }
> = {
  DRAFT: {
    label: "Draft",
    bg: "bg-slate-50",
    text: "text-slate-500",
    border: "border-slate-200",
    icon: <FileText size={11} />,
  },
  CONFIRMED: {
    label: "Confirmed",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    icon: <CheckCircle size={11} />,
  },
  PARTIALLY_RECEIVED: {
    label: "Partially Received",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    icon: <Clock size={11} />,
  },
  FULLY_RECEIVED: {
    label: "Fully Received",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    icon: <CheckCircle size={11} />,
  },
  SHORT_CLOSED: {
    label: "Short Closed",
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
    icon: <Scissors size={11} />,
  },
  CANCELLED: {
    label: "Cancelled",
    bg: "bg-rose-50",
    text: "text-rose-600",
    border: "border-rose-200",
    icon: <X size={11} />,
  },
};

const PAYMENT_CONFIG: Record<
  string,
  {
    label: string;
    bg: string;
    text: string;
    border: string;
    icon: React.ReactNode;
  }
> = {
  UNPAID: {
    label: "Unpaid",
    bg: "bg-rose-50",
    text: "text-rose-600",
    border: "border-rose-200",
    icon: <AlertTriangle size={11} />,
  },
  PARTIALLY_PAID: {
    label: "Partial",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    icon: <Clock size={11} />,
  },
  PAID: {
    label: "Paid",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    icon: <CheckCircle size={11} />,
  },
};

const SUPPLIER_STATUS_CONFIG: Record<
  string,
  {
    label: string;
    bg: string;
    text: string;
    border: string;
    icon: React.ReactNode;
  }
> = {
  ACTIVE: {
    label: "Active",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    icon: <CheckCircle size={11} />,
  },
  INACTIVE: {
    label: "Inactive",
    bg: "bg-slate-50",
    text: "text-slate-500",
    border: "border-slate-200",
    icon: <X size={11} />,
  },
};

const WAREHOUSE_TYPE_CONFIG: Record<
  string,
  {
    label: string;
    bg: string;
    text: string;
    border: string;
    icon: React.ReactNode;
  }
> = {
  PICKUP: {
    label: "Pickup",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    icon: <Truck size={11} />,
  },
  RETURN: {
    label: "Return",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    icon: <RotateCcw size={11} />,
  },
};



const PAYMENT_METHODS = [
  "Bank Transfer",
  "Cash",
  "Cheque",
  "Mobile Banking",
  "Card",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number | undefined | null) {
  return `৳${(n ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function uid() {
  return `row-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function remainingOf(
  item: Pick<
    PurchaseOrderItem,
    "quantity" | "receivedQuantity" | "cancelledQuantity"
  >,
) {
  return Math.max(
    0,
    item.quantity - item.receivedQuantity - (item.cancelledQuantity || 0),
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({
  status,
  kind,
}: {
  status: string;
  kind: "receiving" | "payment" | "supplierStatus" | "warehouseType";
}) {
  const cfg =
    (kind === "receiving"
      ? RECEIVING_CONFIG[status]
      : kind === "payment"
        ? PAYMENT_CONFIG[status]
        : kind === "supplierStatus"
          ? SUPPLIER_STATUS_CONFIG[status]
          : WAREHOUSE_TYPE_CONFIG[status]) ?? RECEIVING_CONFIG.DRAFT;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${cfg.bg} ${cfg.text} ${cfg.border}`}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  icon,
  accent = false,
  warning = false,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  accent?: boolean;
  warning?: boolean;
}) {
  return (
    <div
      className={`relative bg-white rounded-2xl border shadow-sm overflow-hidden ${
        accent
          ? "border-blue-200 shadow-blue-100"
          : warning
            ? "border-amber-200 shadow-amber-50"
            : "border-blue-100 shadow-blue-50"
      }`}
    >
      <div
        className={`absolute inset-x-0 top-0 h-0.5 ${
          accent
            ? "bg-gradient-to-r from-blue-600 to-cyan-500"
            : warning
              ? "bg-gradient-to-r from-amber-400 to-orange-400"
              : "bg-gradient-to-r from-blue-200 to-cyan-200"
        }`}
      />
      <div className="p-4">
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${
            accent
              ? "bg-gradient-to-br from-blue-600 to-cyan-500 shadow-md shadow-blue-200"
              : warning
                ? "bg-gradient-to-br from-amber-400 to-orange-400 shadow-md shadow-amber-100"
                : "bg-blue-50 border border-blue-100"
          }`}
        >
          <span className={accent || warning ? "text-white" : "text-blue-500"}>
            {icon}
          </span>
        </div>
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
          {label}
        </div>
        <div
          className={`text-xl font-extrabold font-mono tracking-tight ${
            accent
              ? "text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500"
              : warning
                ? "text-amber-700"
                : "text-slate-700"
          }`}
        >
          {value}
        </div>
        {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

// ─── Select Box ───────────────────────────────────────────────────────────────

function SelectBox({
  options,
  value,
  onChange,
  placeholder = "Select...",
  disabled = false,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none bg-white border border-cyan-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 pr-8 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={14}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-cyan-400 pointer-events-none"
      />
    </div>
  );
}

function SelectBoxSmall({
  options,
  value,
  onChange,
  placeholder = "Select...",
  disabled = false,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none bg-white border border-cyan-200 rounded-lg px-2 py-1.5 text-[12px] text-slate-700 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-100 pr-6 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={11}
        className="absolute right-1.5 top-1/2 -translate-y-1/2 text-cyan-400 pointer-events-none"
      />
    </div>
  );
}

/** Small square icon button used to open a "create new X" modal next to a
 * SelectBoxSmall — same 28px footprint everywhere so it lines up cleanly. */
function InlineCreateButton({
  onClick,
  disabled,
  title,
  tone = "blue",
}: {
  onClick: () => void;
  disabled?: boolean;
  title: string;
  tone?: "blue" | "cyan";
}) {
  const toneClasses =
    tone === "blue"
      ? "bg-blue-50 text-blue-500 hover:bg-blue-100"
      : "bg-cyan-50 text-cyan-600 hover:bg-cyan-100";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`w-7 h-7 shrink-0 flex items-center justify-center rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${toneClasses}`}
    >
      <PlusIcon size={12} />
    </button>
  );
}

function ActionButton({
  icon,
  label,
  tone,
  onClick,
  disabled = false,
}: {
  icon: React.ReactNode;
  label: string;
  tone: "blue" | "amber" | "purple" | "rose";
  onClick: () => void;
  disabled?: boolean;
}) {
  const toneClasses = {
    blue: "bg-blue-600 hover:bg-blue-700",
    amber: "bg-amber-500 hover:bg-amber-600",
    purple: "bg-purple-600 hover:bg-purple-700",
    rose: "bg-rose-600 hover:bg-rose-700",
  }[tone];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${toneClasses}`}
    >
      {icon}
      {label}
    </button>
  );
}
// ─── Row Action Menu (3-dot → View / Pay Due) ──────────────────────────────

function ActionMenu({
  order,
  onView,
  onPay,
}: {
  order: any;
  onView: () => void;
  onPay: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const canPay = order.dueAmount > 0 && order.paymentStatus !== "PAID";

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
        title="Actions"
      >
        <MoreVertical size={15} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-20 w-36 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden py-1">
          <button
            onClick={() => {
              onView();
              setOpen(false);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-blue-50 hover:text-blue-700 transition-colors"
          >
            <Eye size={12} />
            View
          </button>
          {canPay && (
            <button
              onClick={() => {
                onPay();
                setOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-amber-50 hover:text-amber-700 transition-colors"
            >
              <CreditCard size={12} />
              Pay Due
            </button>
          )}
        </div>
      )}
    </div>
  );
}
// ─── Sortable Column Header (up/down arrow stack) ──────────────────────────────

function SortableHeader({
  label,
  field,
  sortField,
  sortDir,
  onSort,
}: {
  label: string;
  field: Exclude<SortField, null>;
  sortField: SortField;
  sortDir: SortDir;
  onSort: (field: Exclude<SortField, null>) => void;
}) {
  const active = sortField === field;
  return (
    <button
      type="button"
      onClick={() => onSort(field)}
      className="inline-flex items-center gap-1 hover:text-slate-600 transition-colors"
    >
      {label}
      <span className="flex flex-col -space-y-[3px]">
        <ChevronUp
          size={9}
          className={
            active && sortDir === "asc" ? "text-blue-600" : "text-slate-300"
          }
        />
        <ChevronDown
          size={9}
          className={
            active && sortDir === "desc" ? "text-blue-600" : "text-slate-300"
          }
        />
      </span>
    </button>
  );
}

// ─── Tab Bar ──────────────────────────────────────────────────────────────────

function TabBar({
  tabs,
  active,
  onChange,
}: {
  tabs: { key: string; label: string; icon: React.ReactNode; badge?: number }[];
  active: string;
  onChange: (k: string) => void;
}) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
            active === t.key
              ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md shadow-blue-200"
              : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50"
          }`}
        >
          {t.icon}
          {t.label}
          {!!t.badge && (
            <span
              className={`text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center ${
                active === t.key ? "bg-white/25" : "bg-slate-100"
              }`}
            >
              {t.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}



// ════════════════════════════════════════════════════════════════════════════
// PAY DUE MODAL
// ════════════════════════════════════════════════════════════════════════════

function PayDueModal({
  purchaseNo,
  supplierName,
  dueAmount,
  poId,
  onClose,
  onSuccess,
}: {
  purchaseNo: string;
  supplierName: string;
  dueAmount: number;
  poId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const user = useAppSelector((s) => s.auth.user);
  const vendorId = user?.vendorId ?? "";

  const [amount, setAmount] = useState(String(dueAmount));
  const [method, setMethod] = useState("Bank Transfer");
  const [vendorPaymentAccountId, setVendorPaymentAccountId] = useState("");
  const [reference, setReference] = useState("");
  const [error, setError] = useState("");

  const [payDue, { isLoading }] = usePayPurchaseDueMutation();

  // Vendor's own payment accounts — filtered by selected method's instrument type.
  const { data: vendorPaymentAccountsData, isFetching: isFetchingAccounts } =
    useGetVendorPaymentAccountsQuery(vendorId, { skip: !vendorId });
  const vendorPaymentAccounts = useMemo(
    () => vendorPaymentAccountsData?.data ?? [],
    [vendorPaymentAccountsData],
  );

  const selectedInstrumentType = PAYMENT_METHOD_TO_TYPE[method] ?? null;

  const relevantAccounts = useMemo(() => {
    if (!selectedInstrumentType) return [];
    return vendorPaymentAccounts.filter(
      (a) => a.type === selectedInstrumentType && a.isActive,
    );
  }, [vendorPaymentAccounts, selectedInstrumentType]);

  // Clear stale account selection whenever the method changes.
  const prevMethodRef = useRef(method);
  useEffect(() => {
    if (prevMethodRef.current !== method) {
      setVendorPaymentAccountId("");
      prevMethodRef.current = method;
    }
  }, [method]);

  // Default to the method's default account once accounts load.
  useEffect(() => {
    if (vendorPaymentAccountId || relevantAccounts.length === 0) return;
    const def = relevantAccounts.find((a) => a.isDefault) ?? relevantAccounts[0];
    if (def) setVendorPaymentAccountId(def.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [relevantAccounts]);

  const paidNum = parseFloat(amount) || 0;
  const remaining = Math.max(0, dueAmount - paidNum);

  const selectedAccount = useMemo(
    () => vendorPaymentAccounts.find((a) => a.id === vendorPaymentAccountId) ?? null,
    [vendorPaymentAccounts, vendorPaymentAccountId],
  );
  const bankLabel = !selectedInstrumentType
    ? "Cash in Hand"
    : selectedAccount
      ? `${selectedAccount.label || accountDisplayName(selectedAccount)}`
      : "Bank";

  const handlePay = async () => {
    setError("");
    if (!paidNum || paidNum <= 0) {
      setError("Enter a valid amount.");
      return;
    }
    if (paidNum > dueAmount) {
      setError(`Amount exceeds due (${fmt(dueAmount)}).`);
      return;
    }
    if (!vendorId) {
      setError("User not authenticated — cannot create payment.");
      return;
    }
    if (selectedInstrumentType && !vendorPaymentAccountId) {
      setError(`Select which ${method.toLowerCase()} account received the payment.`);
      return;
    }

    try {
      await payDue({
        id: poId,
        data: {
          amount: paidNum,
          method,
          vendorPaymentAccountId,
          reference: reference || undefined,
          entityType: "VENDOR",
          entityId: vendorId,
        },
      }).unwrap();
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.data?.message ?? "Payment failed. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-[92vw] sm:w-[70vw] max-w-lg max-h-[85vh] flex flex-col border border-amber-100">
        <div className="px-5 py-4 bg-gradient-to-r from-amber-500 to-orange-500 rounded-t-2xl flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
              <CreditCard size={15} className="text-white" />
            </div>
            <div>
              <div className="text-white font-bold text-sm">Pay Due</div>
              <div className="text-white/70 text-xs">{supplierName} · {purchaseNo}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center text-white transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <div className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-0.5">
              Outstanding Due
            </div>
            <div className="font-mono text-2xl font-extrabold text-amber-700">{fmt(dueAmount)}</div>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2.5 text-sm text-rose-700">
              <AlertTriangle size={13} className="shrink-0" />
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Pay Amount *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold">
                  ৳
                </span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-7 bg-white border border-cyan-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition-all"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Method
              </label>
              <SelectBox
                options={PAYMENT_METHODS.map((m) => ({ value: m, label: m }))}
                value={method}
                onChange={setMethod}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Account
              </label>
              {selectedInstrumentType ? (
                <PaymentAccountSearchDropdown
                  accounts={relevantAccounts}
                  isLoading={isFetchingAccounts}
                  vendorReady={!!vendorId}
                  selected={vendorPaymentAccountId}
                  onSelect={setVendorPaymentAccountId}
                  emptyLabel={
                    selectedInstrumentType === "MOBILE_BANKING"
                      ? "No mobile banking accounts yet"
                      : selectedInstrumentType === "CARD"
                        ? "No card accounts yet"
                        : "No bank accounts yet"
                  }
                />
              ) : (
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-400 italic">
                  Cash — no account needed
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Reference
              </label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="TXN / Cheque No..."
                className="w-full bg-white border border-cyan-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition-all"
              />
            </div>
          </div>

          {paidNum > 0 && (
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-100 rounded-xl p-4">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                Journal Entry Preview
              </div>
              <div className="space-y-1.5">
                {[
                  { side: "DR", acc: `AP – ${supplierName}`, amt: paidNum },
                  { side: "CR", acc: bankLabel, amt: paidNum },
                ].map((e) => (
                  <div key={e.side} className="flex items-center gap-2 text-xs">
                    <span
                      className={`w-6 text-center font-bold rounded px-1 py-0.5 text-[10px] ${e.side === "DR" ? "bg-blue-100 text-blue-700" : "bg-cyan-100 text-cyan-700"}`}
                    >
                      {e.side}
                    </span>
                    <span className="flex-1 text-slate-600">{e.acc}</span>
                    <span className="font-mono font-semibold text-slate-700">{fmt(e.amt)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-2 pt-2 border-t border-blue-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">Remaining after payment</span>
                <span className={`font-mono text-xs font-bold ${remaining > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                  {fmt(remaining)}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="px-5 py-3.5 border-t border-slate-100 flex gap-3 justify-end rounded-b-2xl bg-slate-50/50 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-500 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
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

// ════════════════════════════════════════════════════════════════════════════
// RECEIVE GOODS MODAL — multi-warehouse / rack / row / shelf split allocation
// ════════════════════════════════════════════════════════════════════════════

interface AllocationRow {
  key: string;
  warehouseId: string;
  rackId: string | null;
  rowNumber: number | null;
  shelfNumber: number | null;
  quantity: number;
  damagedQuantity: number;
}

/** One allocation "line" inside an item's Manage Allocation panel. Fetches
 * its own rack list because it depends on ITS OWN selected warehouseId,
 * which can differ from other rows for the same item. Also lets the user
 * create a brand-new warehouse or rack right here — via the same modals
 * used on the Warehouses screen — for the (common) case where the bin they
 * need doesn't exist yet. */
function AllocationRowEditor({
  row,
  vendorId,
  warehouses,
  warehouseOptions,
  maxQty,
  canRemove,
  onChange,
  onRemove,
}: {
  row: AllocationRow;
  vendorId: string;
  warehouses: any[];
  warehouseOptions: { value: string; label: string }[];
  maxQty: number;
  canRemove: boolean;
  onChange: (patch: Partial<AllocationRow>) => void;
  onRemove: () => void;
}) {
  const { data: rackData, isFetching } = useGetRacksByWarehouseQuery(
    { warehouseId: row.warehouseId, filters: { isActive: true } },
    { skip: !row.warehouseId },
  );
  const racks = rackData?.data ?? [];
  const selectedRack = racks.find((r) => r.id === row.rackId);
  const selectedWarehouse = warehouses.find(
    (w: any) => w.id === row.warehouseId,
  );

  const [showCreateWarehouse, setShowCreateWarehouse] = useState(false);
  const [showCreateRack, setShowCreateRack] = useState(false);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 bg-white border border-slate-100 rounded-xl p-2.5">
      <div className="col-span-2 sm:col-span-2 flex flex-col gap-1">
        <span className="text-[9px] font-bold text-slate-400 uppercase">
          Warehouse
        </span>
        <div className="flex gap-1">
          <div className="flex-1">
            <SelectBoxSmall
              options={warehouseOptions}
              value={row.warehouseId}
              onChange={(v) =>
                onChange({
                  warehouseId: v,
                  rackId: null,
                  rowNumber: null,
                  shelfNumber: null,
                })
              }
              placeholder="Select"
            />
          </div>
          <InlineCreateButton
            onClick={() => setShowCreateWarehouse(true)}
            title="Create new warehouse"
            tone="blue"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-[9px] font-bold text-slate-400 uppercase">
          Rack
        </span>
        <div className="flex gap-1">
          <div className="flex-1">
            <SelectBoxSmall
              options={racks.map((r: any) => ({
                value: r.id,
                label: r.label ? `${r.code} — ${r.label}` : r.code,
              }))}
              value={row.rackId ?? ""}
              onChange={(v) =>
                onChange({
                  rackId: v || null,
                  rowNumber: null,
                  shelfNumber: null,
                })
              }
              placeholder={
                !row.warehouseId ? "—" : isFetching ? "Loading..." : "No rack"
              }
              disabled={!row.warehouseId}
            />
          </div>
          <InlineCreateButton
            onClick={() => setShowCreateRack(true)}
            disabled={!row.warehouseId}
            title={
              row.warehouseId
                ? "Create new rack in this warehouse"
                : "Choose a warehouse first"
            }
            tone="cyan"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-[9px] font-bold text-slate-400 uppercase">
          Row
        </span>
        <SelectBoxSmall
          options={
            selectedRack && selectedRack.totalRows > 0
              ? Array.from({ length: selectedRack.totalRows }, (_, i) => ({
                  value: String(i + 1),
                  label: `R${i + 1}`,
                }))
              : []
          }
          value={row.rowNumber ? String(row.rowNumber) : ""}
          onChange={(v) => onChange({ rowNumber: v ? Number(v) : null })}
          placeholder="—"
          disabled={!selectedRack}
        />
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-[9px] font-bold text-slate-400 uppercase">
          Shelf
        </span>
        <SelectBoxSmall
          options={
            selectedRack && selectedRack.totalShelves > 0
              ? Array.from({ length: selectedRack.totalShelves }, (_, i) => ({
                  value: String(i + 1),
                  label: `S${i + 1}`,
                }))
              : []
          }
          value={row.shelfNumber ? String(row.shelfNumber) : ""}
          onChange={(v) => onChange({ shelfNumber: v ? Number(v) : null })}
          placeholder="—"
          disabled={!selectedRack}
        />
      </div>

      <div className="col-span-2 sm:col-span-1 flex items-end gap-1.5">
        <div className="flex-1 flex flex-col gap-1">
          <span className="text-[9px] font-bold text-slate-400 uppercase">
            Qty
          </span>
          <input
            type="number"
            min={0}
            value={row.quantity || ""}
            onChange={(e) =>
              onChange({ quantity: Number(e.target.value) || 0 })
            }
            className="w-full bg-white border border-cyan-200 rounded-lg px-2 py-1.5 text-[12px] text-slate-700 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-100"
          />
        </div>
        <div className="w-14 flex flex-col gap-1">
          <span className="text-[9px] font-bold text-rose-400 uppercase">
            Dmg
          </span>
          <input
            type="number"
            min={0}
            max={row.quantity}
            value={row.damagedQuantity || ""}
            onChange={(e) =>
              onChange({
                damagedQuantity: Math.min(
                  Number(e.target.value) || 0,
                  row.quantity,
                ),
              })
            }
            className="w-full bg-white border border-rose-200 rounded-lg px-1.5 py-1.5 text-[12px] text-rose-600 focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-100"
          />
        </div>
        {canRemove && (
          <button
            onClick={onRemove}
            className="w-7 h-7 shrink-0 flex items-center justify-center rounded-lg bg-rose-50 text-rose-400 hover:bg-rose-100 hover:text-rose-600 transition-colors"
            title="Remove allocation"
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>

      {!row.warehouseId && (
        <div className="col-span-2 sm:col-span-6 text-[10px] text-amber-500 flex items-center gap-1">
          <AlertTriangle size={10} /> Pick a warehouse for this line, or use the
          + button to create one.
        </div>
      )}
      {row.warehouseId && !isFetching && racks.length === 0 && (
        <div className="col-span-2 sm:col-span-6 text-[10px] text-slate-400 flex items-center gap-1">
          <Info size={10} /> No racks configured for this warehouse yet — use
          the + button next to Rack to create one, or leave it without a bin
          location.
        </div>
      )}

      {/* Create-on-the-spot modals. The warehouse dialog is the shared
          WarehouseFormDialog (same form as Settings and the product form);
          the rack modal keeps the manual-code convention (capitals,
          hyphens for spaces). */}
      <WarehouseFormDialog
        vendorId={vendorId}
        open={showCreateWarehouse}
        onClose={() => setShowCreateWarehouse(false)}
        onCreated={(created: CreatedWarehouseResult) => {
          onChange({
            warehouseId: created.id,
            rackId: null,
            rowNumber: null,
            shelfNumber: null,
          });
        }}
      />
      <CreateRackModal
        warehouseId={row.warehouseId}
        warehouseCode={selectedWarehouse?.code}
        warehouseName={selectedWarehouse?.name}
        open={showCreateRack}
        onClose={() => setShowCreateRack(false)}
        onCreated={(created: CreatedRackResult) => {
          onChange({ rackId: created.id, rowNumber: null, shelfNumber: null });
        }}
      />
    </div>
  );
}

function ReceiveItemCard({
  item,
  vendorId,
  warehouses,
  receiveQty,
  allocations,
  warehouseOptions,
  expanded,
  onToggleExpand,
  onReceiveQtyChange,
  onAddRow,
  onRemoveRow,
  onUpdateRow,
}: {
  item: PurchaseOrderItem;
  vendorId: string;
  warehouses: any[];
  receiveQty: number;
  allocations: AllocationRow[];
  warehouseOptions: { value: string; label: string }[];
  expanded: boolean;
  onToggleExpand: () => void;
  onReceiveQtyChange: (v: number) => void;
  onAddRow: () => void;
  onRemoveRow: (key: string) => void;
  onUpdateRow: (key: string, patch: Partial<AllocationRow>) => void;
}) {
  const remaining = remainingOf(item);
  const allocatedSum = allocations.reduce(
    (s, r) => s + (Number(r.quantity) || 0),
    0,
  );
  const matches = receiveQty === 0 || allocatedSum === receiveQty;
  const isSplit = allocations.length > 1;

  return (
    <div className="bg-slate-50 border border-slate-100 rounded-xl overflow-hidden">
      <div className="px-4 py-3 flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[180px]">
          <div className="text-xs font-semibold text-slate-700">
            {item.productName}
          </div>
          <div className="text-xs text-slate-400">
            {item.variantName} · <span className="font-mono">{item.sku}</span>
          </div>
          <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
            <span>
              Ordered:{" "}
              <strong className="text-slate-600">{item.quantity}</strong>
            </span>
            <span>·</span>
            <span>
              Received:{" "}
              <strong className="text-slate-600">
                {item.receivedQuantity}
              </strong>
            </span>
            <span>·</span>
            <span>
              Remaining: <strong className="text-blue-600">{remaining}</strong>
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-1 w-28">
          <span className="text-[9px] font-bold text-slate-400 uppercase">
            Receive now
          </span>
          <input
            type="number"
            min={0}
            max={remaining}
            value={receiveQty || ""}
            onChange={(e) =>
              onReceiveQtyChange(
                Math.min(Number(e.target.value) || 0, remaining),
              )
            }
            className="w-full bg-white border border-cyan-200 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-slate-700 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-100"
          />
        </div>

        <div className="flex flex-col items-end gap-1">
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              matches
                ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                : "bg-amber-50 text-amber-600 border-amber-200"
            }`}
          >
            Allocated: {allocatedSum} / {receiveQty}
          </span>
          <button
            onClick={onToggleExpand}
            className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600 hover:text-blue-800 transition-colors"
          >
            <Layers size={10} />
            {isSplit ? `${allocations.length} locations` : "Manage Allocation"}
            {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-slate-100 p-3 space-y-2 bg-white/60">
          {allocations.length === 0 && (
            <div className="text-[11px] text-slate-400 text-center py-2">
              No allocation yet — click "Add location" below or use "Apply
              default to all".
            </div>
          )}
          {allocations.map((row) => (
            <AllocationRowEditor
              key={row.key}
              row={row}
              vendorId={vendorId}
              warehouses={warehouses}
              warehouseOptions={warehouseOptions}
              maxQty={remaining}
              canRemove={allocations.length > 1}
              onChange={(patch) => onUpdateRow(row.key, patch)}
              onRemove={() => onRemoveRow(row.key)}
            />
          ))}
          <button
            onClick={onAddRow}
            className="w-full flex items-center justify-center gap-1.5 py-2 text-[11px] font-semibold text-blue-600 bg-blue-50 border border-dashed border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <PlusIcon size={12} />
            Add location split
          </button>
        </div>
      )}
    </div>
  );
}

function ReceiveGoodsModal({
  po,
  vendorId,
  onClose,
  onSuccess,
}: {
  po: PurchaseOrderDetail;
  vendorId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { data: whData } = useGetWarehousesByVendorQuery(
    { vendorId, filters: { type: undefined } },
    { skip: !vendorId },
  );
  const warehouses = whData?.data ?? [];
  const warehouseOptions = warehouses.map((w: any) => ({
    value: w.id,
    label:
      [w.name, w.location?.city].filter(Boolean).join(" — ") || w.code || w.id,
  }));

  const receivableItems = useMemo(
    () => po.items.filter((i) => remainingOf(i) > 0),
    [po.items],
  );

  const [defaultWarehouseId, setDefaultWarehouseId] = useState("");
  const [showCreateDefaultWarehouse, setShowCreateDefaultWarehouse] =
    useState(false);
  const [receiveQty, setReceiveQty] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    receivableItems.forEach((i) => (init[i.id] = remainingOf(i)));
    return init;
  });
  const [allocations, setAllocations] = useState<
    Record<string, AllocationRow[]>
  >({});
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  // Pre-select the vendor's default warehouse once loaded.
  useEffect(() => {
    if (warehouses.length > 0 && !defaultWarehouseId) {
      const def = warehouses.find((w: any) => w.isDefault) ?? warehouses[0];
      setDefaultWarehouseId(def.id);
    }
  }, [warehouses, defaultWarehouseId]);

  const [receivePurchase, { isLoading }] = useReceivePurchaseOrderMutation();

  const toggleExpand = (itemId: string) =>
    setExpandedItems((prev) => {
      const next = new Set(prev);
      next.has(itemId) ? next.delete(itemId) : next.add(itemId);
      return next;
    });

  const handleReceiveQtyChange = (itemId: string, qty: number) => {
    setReceiveQty((prev) => ({ ...prev, [itemId]: qty }));
    setAllocations((prev) => {
      const rows = prev[itemId];
      // Single-row (unsplit) items stay in sync automatically; split items
      // are left for the vendor to re-balance manually.
      if (rows && rows.length === 1) {
        return { ...prev, [itemId]: [{ ...rows[0], quantity: qty }] };
      }
      return prev;
    });
  };

  const handleApplyDefaultToAll = () => {
    if (!defaultWarehouseId) return;
    const hasCustomSplits = Object.values(allocations).some(
      (rows) => rows.length > 1,
    );
    if (hasCustomSplits) {
      const ok = window.confirm(
        "This will overwrite any custom multi-location splits you've already made. Continue?",
      );
      if (!ok) return;
    }
    setAllocations(() => {
      const next: Record<string, AllocationRow[]> = {};
      for (const item of receivableItems) {
        const qty = receiveQty[item.id] ?? 0;
        next[item.id] = [
          {
            key: uid(),
            warehouseId: defaultWarehouseId,
            rackId: null,
            rowNumber: null,
            shelfNumber: null,
            quantity: qty,
            damagedQuantity: 0,
          },
        ];
      }
      return next;
    });
  };

  const handleAddRow = (itemId: string) => {
    setAllocations((prev) => {
      const rows = prev[itemId] ?? [];
      const allocated = rows.reduce((s, r) => s + (r.quantity || 0), 0);
      const remainder = Math.max(0, (receiveQty[itemId] ?? 0) - allocated);
      return {
        ...prev,
        [itemId]: [
          ...rows,
          {
            key: uid(),
            warehouseId: defaultWarehouseId || "",
            rackId: null,
            rowNumber: null,
            shelfNumber: null,
            quantity: remainder,
            damagedQuantity: 0,
          },
        ],
      };
    });
    setExpandedItems((prev) => new Set(prev).add(itemId));
  };

  const handleRemoveRow = (itemId: string, key: string) => {
    setAllocations((prev) => ({
      ...prev,
      [itemId]: (prev[itemId] ?? []).filter((r) => r.key !== key),
    }));
  };

  const handleUpdateRow = (
    itemId: string,
    key: string,
    patch: Partial<AllocationRow>,
  ) => {
    setAllocations((prev) => ({
      ...prev,
      [itemId]: (prev[itemId] ?? []).map((r) =>
        r.key === key ? { ...r, ...patch } : r,
      ),
    }));
  };

  const totalReceiving = receivableItems.reduce(
    (s, i) => s + (receiveQty[i.id] || 0),
    0,
  );
  const allMatched = receivableItems.every((item) => {
    const qty = receiveQty[item.id] || 0;
    if (qty === 0) return true;
    const rows = allocations[item.id] ?? [];
    const sum = rows.reduce((s, r) => s + (r.quantity || 0), 0);
    return sum === qty && rows.every((r) => r.warehouseId);
  });

  const handleSubmit = async () => {
    setError("");

    if (totalReceiving <= 0) {
      setError("Enter at least one quantity to receive.");
      return;
    }
    if (!allMatched) {
      setError(
        "Every item's allocation must add up exactly to its 'Receive now' quantity, and every location needs a warehouse selected.",
      );
      return;
    }

    const items: ReceivePurchaseOrderItemInput[] = [];
    for (const item of receivableItems) {
      const qty = receiveQty[item.id] || 0;
      if (qty <= 0) continue;
      for (const row of allocations[item.id] ?? []) {
        if (row.quantity > 0) {
          items.push({
            purchaseOrderItemId: item.id,
            quantity: row.quantity,
            damagedQuantity: row.damagedQuantity || undefined,
            warehouseId: row.warehouseId,
            rackId: row.rackId ?? undefined,
            rowNumber: row.rowNumber ?? undefined,
            shelfNumber: row.shelfNumber ?? undefined,
          });
        }
      }
    }

    try {
      await receivePurchase({
        id: po.id,
        data: { notes: notes || undefined, items },
      }).unwrap();
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.data?.message ?? "Receiving failed. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col border border-blue-100">
        <div className="px-5 py-4 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-t-2xl flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
              <Boxes size={15} className="text-white" />
            </div>
            <div>
              <div className="text-white font-bold text-sm">Receive Goods</div>
              <div className="text-white/70 text-xs">
                {po.purchaseNo} · {receivableItems.length} item(s) outstanding
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center text-white transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Bulk allocation toolbar */}
        <div className="px-5 py-3 border-b border-blue-50 bg-blue-50/40 flex flex-wrap items-end gap-3 shrink-0">
          <div className="flex flex-col gap-1 min-w-[220px]">
            <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider flex items-center gap-1">
              <Sparkles size={10} /> Default warehouse
            </span>
            <div className="flex gap-1.5">
              <div className="flex-1">
                <SelectBox
                  options={warehouseOptions}
                  value={defaultWarehouseId}
                  onChange={setDefaultWarehouseId}
                  placeholder={
                    warehouses.length === 0
                      ? "No warehouses yet"
                      : "Select a warehouse..."
                  }
                />
              </div>
              <button
                type="button"
                onClick={() => setShowCreateDefaultWarehouse(true)}
                title="Create new warehouse"
                className="flex items-center justify-center px-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors shrink-0"
              >
                <PlusIcon size={14} />
              </button>
            </div>
          </div>
          <button
            onClick={handleApplyDefaultToAll}
            disabled={!defaultWarehouseId}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <CheckCircle size={13} />
            Apply to All
          </button>
          <div className="text-[11px] text-blue-500 flex-1 min-w-[160px]">
            Assigns every item's full "receive now" quantity to this warehouse.
            Use <strong>Manage Allocation</strong> per item to split across
            warehouses/racks, or the <strong>+</strong> buttons there to create
            a warehouse or rack that doesn't exist yet.
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-2.5">
          {error && (
            <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2.5 text-sm text-rose-700">
              <AlertTriangle size={13} className="shrink-0" />
              {error}
            </div>
          )}

          {receivableItems.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <CheckCircle size={28} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">
                All items on this order have been fully received or written off.
              </p>
            </div>
          ) : (
            receivableItems.map((item) => (
              <ReceiveItemCard
                key={item.id}
                item={item}
                vendorId={vendorId}
                warehouses={warehouses}
                receiveQty={receiveQty[item.id] ?? 0}
                allocations={allocations[item.id] ?? []}
                warehouseOptions={warehouseOptions}
                expanded={expandedItems.has(item.id)}
                onToggleExpand={() => toggleExpand(item.id)}
                onReceiveQtyChange={(v) => handleReceiveQtyChange(item.id, v)}
                onAddRow={() => handleAddRow(item.id)}
                onRemoveRow={(key) => handleRemoveRow(item.id, key)}
                onUpdateRow={(key, patch) =>
                  handleUpdateRow(item.id, key, patch)
                }
              />
            ))
          )}

          {receivableItems.length > 0 && (
            <div className="pt-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="e.g. Delivered by supplier's own van, invoice attached..."
                className="w-full bg-white border border-cyan-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 resize-none"
              />
            </div>
          )}
        </div>

        <div className="px-5 py-3.5 border-t border-blue-50 bg-slate-50/50 flex items-center justify-between gap-3 rounded-b-2xl shrink-0">
          <div className="text-xs text-slate-500">
            Total receiving:{" "}
            <span className="font-mono font-bold text-blue-700">
              {totalReceiving}
            </span>{" "}
            units
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-500 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading || receivableItems.length === 0}
              className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-xs font-bold rounded-xl hover:from-blue-700 hover:to-cyan-600 disabled:opacity-60 shadow-md shadow-blue-200 transition-all active:scale-95"
            >
              {isLoading ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Boxes size={13} />
              )}
              {isLoading ? "Saving..." : "Confirm Received"}
            </button>
          </div>
        </div>
      </div>

      {/* Lets the vendor create the very first warehouse for their account
          without leaving the receiving flow. */}
      <WarehouseFormDialog
        vendorId={vendorId}
        open={showCreateDefaultWarehouse}
        onClose={() => setShowCreateDefaultWarehouse(false)}
        onCreated={(created: CreatedWarehouseResult) =>
          setDefaultWarehouseId(created.id)
        }
      />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// SHORT-CLOSE MODAL
// ════════════════════════════════════════════════════════════════════════════

function ShortCloseModal({
  po,
  vendorId,
  onClose,
  onSuccess,
}: {
  po: PurchaseOrderDetail;
  vendorId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const eligibleItems = useMemo(
    () => po.items.filter((i) => remainingOf(i) > 0),
    [po.items],
  );
  const [cancelQty, setCancelQty] = useState<Record<string, number>>({});
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const [shortClose, { isLoading }] = useShortClosePurchaseOrderMutation();

  const vatRate =
    Number(po.subtotal) > 0 ? Number(po.vatAmount) / Number(po.subtotal) : 0;
  const estimatedReversal = eligibleItems.reduce((s, item) => {
    const qty = cancelQty[item.id] || 0;
    if (qty <= 0) return s;
    const unitCost = Number(item.total) / item.quantity;
    const base = unitCost * qty;
    return s + base + base * vatRate;
  }, 0);

  const totalWriteOff = eligibleItems.reduce(
    (s, i) => s + (cancelQty[i.id] || 0),
    0,
  );

  const handleSubmit = async () => {
    setError("");
    if (!reason.trim()) {
      setError("Please give a reason for the short-close.");
      return;
    }
    if (totalWriteOff <= 0) {
      setError("Enter at least one quantity to write off.");
      return;
    }
    if (!vendorId) {
      setError("User not authenticated.");
      return;
    }

    const items = eligibleItems
      .filter((i) => (cancelQty[i.id] || 0) > 0)
      .map((i) => ({
        purchaseOrderItemId: i.id,
        cancelQuantity: cancelQty[i.id],
      }));

    try {
      await shortClose({
        id: po.id,
        data: { reason, items, entityType: "VENDOR", entityId: vendorId },
      }).unwrap();
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.data?.message ?? "Short-close failed. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col border border-purple-100">
        <div className="px-5 py-4 bg-gradient-to-r from-purple-500 to-fuchsia-500 rounded-t-2xl flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
              <Scissors size={15} className="text-white" />
            </div>
            <div>
              <div className="text-white font-bold text-sm">
                Short-Close Order
              </div>
              <div className="text-white/70 text-xs">
                {po.purchaseNo} — write off outstanding quantity
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center text-white transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          <div className="flex items-start gap-2 bg-purple-50 border border-purple-100 rounded-xl px-3 py-2.5 text-[11px] text-purple-600">
            <Info size={13} className="shrink-0 mt-0.5" />
            Use this when a supplier can't fulfil the rest of an item — the
            remaining un-received quantity is permanently written off and the
            order total is reduced accordingly.
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2.5 text-sm text-rose-700">
              <AlertTriangle size={13} className="shrink-0" />
              {error}
            </div>
          )}

          {eligibleItems.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-sm">
              Nothing outstanding to short-close.
            </div>
          ) : (
            eligibleItems.map((item) => {
              const remaining = remainingOf(item);
              return (
                <div
                  key={item.id}
                  className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 flex items-center gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-slate-700 truncate">
                      {item.productName}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Remaining:{" "}
                      <strong className="text-slate-600">{remaining}</strong>
                    </div>
                  </div>
                  <div className="w-24">
                    <input
                      type="number"
                      min={0}
                      max={remaining}
                      value={cancelQty[item.id] || ""}
                      onChange={(e) =>
                        setCancelQty((prev) => ({
                          ...prev,
                          [item.id]: Math.min(
                            Number(e.target.value) || 0,
                            remaining,
                          ),
                        }))
                      }
                      placeholder="0"
                      className="w-full bg-white border border-purple-200 rounded-lg px-2.5 py-1.5 text-sm text-slate-700 text-right focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-100"
                    />
                  </div>
                </div>
              );
            })
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Reason *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              placeholder="e.g. Supplier out of stock, discontinued item..."
              className="w-full bg-white border border-purple-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 resize-none"
            />
          </div>

          {totalWriteOff > 0 && (
            <div className="bg-purple-50 border border-purple-100 rounded-xl px-4 py-3 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-purple-500">
                Estimated reversal amount
              </span>
              <span className="font-mono font-bold text-purple-700">
                {fmt(estimatedReversal)}
              </span>
            </div>
          )}
        </div>

        <div className="px-5 py-3.5 border-t border-slate-100 flex gap-3 justify-end rounded-b-2xl bg-slate-50/50 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-500 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading || eligibleItems.length === 0}
            className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white text-xs font-bold rounded-xl hover:from-purple-600 hover:to-fuchsia-600 disabled:opacity-60 shadow-md shadow-purple-200 transition-all active:scale-95"
          >
            {isLoading ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Scissors size={13} />
            )}
            {isLoading ? "Processing..." : "Short-Close"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// CANCEL ORDER MODAL
// ════════════════════════════════════════════════════════════════════════════

function CancelOrderModal({
  po,
  vendorId,
  onClose,
  onSuccess,
}: {
  po: PurchaseOrderDetail;
  vendorId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [cancelOrder, { isLoading }] = useCancelPurchaseOrderMutation();

  const outstandingItems = useMemo(
    () => po.items.filter((i) => remainingOf(i) > 0),
    [po.items],
  );

  const handleSubmit = async () => {
    setError("");
    if (!reason.trim()) {
      setError("Please give a reason for cancellation.");
      return;
    }
    if (!vendorId) {
      setError("User not authenticated.");
      return;
    }

    try {
      await cancelOrder({
        id: po.id,
        data: { reason, entityType: "VENDOR", entityId: vendorId },
      }).unwrap();
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.data?.message ?? "Cancellation failed. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col border border-rose-100">
        <div className="px-5 py-4 bg-gradient-to-r from-rose-500 to-red-500 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
              <Ban size={15} className="text-white" />
            </div>
            <div>
              <div className="text-white font-bold text-sm">Cancel Order</div>
              <div className="text-white/70 text-xs">{po.purchaseNo}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center text-white transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <div className="flex items-start gap-2 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2.5 text-[11px] text-rose-600">
            <AlertTriangle size={13} className="shrink-0 mt-0.5" />
            This cancels everything still outstanding on the order. Any quantity
            already received stays in stock.
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2.5 text-sm text-rose-700">
              <AlertTriangle size={13} className="shrink-0" />
              {error}
            </div>
          )}

          <div className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5">
            <div className="text-[10px] font-bold text-slate-400 uppercase mb-1.5">
              Will be cancelled
            </div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {outstandingItems.map((i) => (
                <div
                  key={i.id}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="text-slate-600 truncate">
                    {i.productName}
                  </span>
                  <span className="font-mono font-semibold text-rose-500">
                    {remainingOf(i)} pcs
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Reason *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              placeholder="e.g. Ordered by mistake, supplier unavailable..."
              className="w-full bg-white border border-rose-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 resize-none"
            />
          </div>
        </div>

        <div className="px-5 py-3.5 border-t border-slate-100 flex gap-3 justify-end rounded-b-2xl bg-slate-50/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-500 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            Keep Order
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-rose-500 to-red-500 text-white text-xs font-bold rounded-xl hover:from-rose-600 hover:to-red-600 disabled:opacity-60 shadow-md shadow-rose-200 transition-all active:scale-95"
          >
            {isLoading ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Ban size={13} />
            )}
            {isLoading ? "Cancelling..." : "Confirm Cancel"}
          </button>
        </div>
      </div>
    </div>
  );
}


// ════════════════════════════════════════════════════════════════════════════
// DETAIL PANEL SKELETON
// ════════════════════════════════════════════════════════════════════════════

function DetailPanelSkeleton() {
  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[560px] lg:w-[660px] bg-white border-l border-blue-100 shadow-2xl flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 bg-gradient-to-r from-blue-600 to-cyan-500 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5 min-w-0 animate-pulse">
          <div className="w-8 h-8 bg-white/20 rounded-xl shrink-0" />
          <div className="space-y-1.5">
            <div className="h-3.5 w-28 bg-white/30 rounded" />
            <div className="h-2.5 w-40 bg-white/20 rounded" />
          </div>
        </div>
        <div className="w-8 h-8 bg-white/20 rounded-xl shrink-0" />
      </div>

      {/* Status badges */}
      <div className="px-5 pt-4 flex items-center gap-2 animate-pulse">
        <div className="h-5 w-24 bg-slate-100 rounded-full" />
        <div className="h-5 w-16 bg-slate-100 rounded-full" />
        <div className="h-5 w-20 bg-slate-100 rounded-full" />
      </div>

      {/* Tabs */}
      <div className="px-5 pt-4 pb-3 border-b border-blue-50">
        <div className="flex items-center gap-1.5 animate-pulse">
          <div className="h-8 w-16 bg-slate-100 rounded-xl" />
          <div className="h-8 w-24 bg-slate-100 rounded-xl" />
          <div className="h-8 w-24 bg-slate-100 rounded-xl" />
          <div className="h-8 w-24 bg-slate-100 rounded-xl" />
        </div>
      </div>

      {/* Body — mimics the items table */}
      <div className="flex-1 overflow-hidden p-5">
        <div className="rounded-xl border border-blue-100 overflow-hidden animate-pulse">
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 px-3 py-2.5">
            <div className="h-2.5 w-full bg-blue-100/70 rounded" />
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-3 border-t border-slate-50">
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-3/5 bg-slate-200 rounded" />
                <div className="h-2.5 w-2/5 bg-slate-100 rounded" />
              </div>
              <div className="h-3 w-10 bg-slate-100 rounded" />
              <div className="h-3 w-10 bg-slate-100 rounded" />
              <div className="h-3 w-12 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-blue-50 bg-slate-50/50 space-y-3 shrink-0 animate-pulse">
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
          <div className="h-3 w-16 bg-slate-200 rounded" />
          <div className="h-3 w-16 bg-slate-200 rounded justify-self-end" />
          <div className="h-3 w-16 bg-slate-200 rounded" />
          <div className="h-3 w-16 bg-slate-200 rounded justify-self-end" />
          <div className="h-4 w-20 bg-slate-300 rounded col-span-1" />
          <div className="h-4 w-24 bg-slate-300 rounded justify-self-end" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="h-14 bg-slate-200 rounded-xl" />
          <div className="h-14 bg-slate-200 rounded-xl" />
          <div className="h-14 bg-slate-200 rounded-xl" />
          <div className="h-14 bg-slate-200 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// DETAIL PANEL
// ════════════════════════════════════════════════════════════════════════════

function DetailPanel({
  poId, onClose, onAction,
}: {
  poId: string;
  onClose: () => void;
  onAction: (action: "receive" | "pay" | "shortclose" | "cancel", po: PurchaseOrderDetail) => void;
}) {
  const { data, isLoading } = useGetPurchaseOrderByIdQuery(poId, { skip: !poId, refetchOnMountOrArgChange: true });
  const po = data?.data as PurchaseOrderDetail | undefined;
  const [tab, setTab] = useState("items");

  const outstandingCount = po?.items.filter((i) => remainingOf(i) > 0).length ?? 0;

  const tabs = [
    { key: "items", label: "Items", icon: <Package size={12} /> },
    { key: "receives", label: "Receives", icon: <Boxes size={12} />, badge: po?.receives?.length },
    { key: "payments", label: "Payments", icon: <Wallet size={12} />, badge: po?.payments?.length },
    { key: "vouchers", label: "Vouchers", icon: <Layers size={12} />, badge: po?.vouchers?.length },
  ];

  if (isLoading) return <DetailPanelSkeleton />;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[560px] lg:w-[660px] bg-white border-l border-blue-100 shadow-2xl flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 bg-gradient-to-r from-blue-600 to-cyan-500 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
            <FileText size={15} className="text-white" />
          </div>
          <div className="min-w-0">
            <div className="text-white font-bold text-sm truncate">{po?.purchaseNo ?? "Loading..."}</div>
            <div className="text-white/70 text-xs truncate">{po ? `${fmtDate(po.purchaseDate)} · ${po.supplier.name}` : ""}</div>
          </div>
        </div>
        <button onClick={onClose} className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center text-white transition-colors shrink-0">
          <X size={15} />
        </button>
      </div>

      {!po ? (
        <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">Purchase order not found</div>
      ) : (
        <>
          <div className="px-5 pt-4 flex items-center gap-2 flex-wrap">
            <StatusBadge status={po.receivingStatus} kind="receiving" />
            <StatusBadge status={po.paymentStatus} kind="payment" />
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border bg-slate-50 text-slate-500 border-slate-200">
              <Building2 size={11} />
              {po.warehouse?.name ?? "Multiple / not set"}
            </span>
          </div>

          <div className="px-5 pt-4 pb-3 border-b border-blue-50">
            <TabBar tabs={tabs} active={tab} onChange={setTab} />
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Items Tab */}
            {tab === "items" && (
              <div className="overflow-x-auto rounded-xl border border-blue-100">
                <table className="w-full min-w-[560px]">
                  <thead>
                    <tr className="bg-gradient-to-r from-blue-50 to-cyan-50">
                      {["Product", "Ordered", "Recv", "Cancelled", "Remain", "Unit Cost", "Total"].map((h) => (
                        <th key={h} className="text-left text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-3 py-2.5 border-b border-blue-100 whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {po.items.map((item) => (
                      <tr key={item.id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="px-3 py-2.5">
                          <div className="text-xs font-semibold text-slate-700">{item.productName}</div>
                          <div className="text-xs text-slate-400">{item.variantName}</div>
                        </td>
                        <td className="px-3 py-2.5 text-sm font-bold text-slate-700">{item.quantity}</td>
                        <td className="px-3 py-2.5">
                          <span className={`font-mono text-xs px-1.5 py-0.5 rounded ${item.receivedQuantity >= item.quantity ? "text-emerald-700 bg-emerald-50" : item.receivedQuantity > 0 ? "text-amber-700 bg-amber-50" : "text-slate-500 bg-slate-50"}`}>
                            {item.receivedQuantity}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          {item.cancelledQuantity > 0 ? (
                            <span className="font-mono text-xs px-1.5 py-0.5 rounded text-purple-700 bg-purple-50">{item.cancelledQuantity}</span>
                          ) : (
                            <span className="text-xs text-slate-300">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-xs font-semibold text-blue-600">{remainingOf(item)}</td>
                        <td className="px-3 py-2.5 font-mono text-xs text-slate-600">{fmt(item.unitCost)}</td>
                        <td className="px-3 py-2.5 font-mono text-sm font-bold text-blue-700">{fmt(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Receives Tab */}
            {tab === "receives" && (
              !po.receives?.length ? (
                <div className="text-center py-12 text-slate-400">
                  <Boxes size={28} className="mx-auto mb-2 opacity-40" />
                  <p className="text-sm font-medium">No receive records yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {po.receives.map((rec) => (
                    <div key={rec.id} className="bg-white border border-blue-100 rounded-xl overflow-hidden">
                      <div className="px-4 py-2.5 bg-gradient-to-r from-blue-50 to-cyan-50 flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-blue-700">{rec.receiveNo}</span>
                        <span className="text-xs text-slate-400">{fmtDate(rec.receivedAt)}</span>
                      </div>
                      <div className="p-3 space-y-1.5">
                        {rec.items.map((rItem) => (
                          <div key={rItem.id} className="flex items-center justify-between text-xs py-1">
                            <span className="text-slate-600">{rItem.purchaseOrderItem?.productName ?? "Item"}</span>
                            <span className="font-semibold text-slate-700 text-right">
                              Qty {rItem.quantity}
                              {rItem.warehouse ? ` · ${rItem.warehouse.name}` : ""}
                              {rItem.rack ? ` · ${rItem.rack.code}` : ""}
                              {rItem.rowNumber ? ` R${rItem.rowNumber}` : ""}
                              {rItem.shelfNumber ? `/S${rItem.shelfNumber}` : ""}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* Payments Tab */}
            {tab === "payments" && (
              po.payments.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Wallet size={28} className="mx-auto mb-2 opacity-40" />
                  <p className="text-sm font-medium">No payments made yet.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {po.payments.map((p) => (
                    <div key={p.id} className="flex items-center justify-between bg-white border border-emerald-100 rounded-xl px-4 py-2.5">
                      <div>
                        <div className="text-xs font-semibold text-slate-600">{p.method}</div>
                        {p.reference && <div className="text-xs text-slate-400 font-mono">{p.reference}</div>}
                        <div className="text-xs text-slate-400">{fmtDate(p.paidAt)}</div>
                      </div>
                      <div className="font-mono text-sm font-bold text-emerald-600">{fmt(p.amount)}</div>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* Vouchers Tab */}
            {tab === "vouchers" && (
              po.vouchers.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Layers size={28} className="mx-auto mb-2 opacity-40" />
                  <p className="text-sm font-medium">No vouchers generated.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {po.vouchers.map((v) => (
                    <div key={v.id} className="bg-white border border-blue-100 rounded-xl overflow-hidden">
                      <div className="px-4 py-2.5 bg-gradient-to-r from-blue-50 to-cyan-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Hash size={10} className="text-blue-500" />
                            <span className="text-xs font-mono font-bold text-blue-700">{v.voucherNumber}</span>
                            <span className="text-[10px] font-bold text-blue-400 bg-white border border-blue-200 rounded-full px-1.5 py-0.5">{v.voucherType}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">Dr {fmt(v.totalDebit)} / Cr {fmt(v.totalCredit)}</span>
                        </div>
                        {v.narration && <p className="text-xs text-slate-500 mt-1">{v.narration}</p>}
                      </div>
                      <table className="w-full">
                        <thead>
                          <tr>
                            <th className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-2 border-b border-slate-100">Account</th>
                            <th className="text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-2 border-b border-slate-100">Debit</th>
                            <th className="text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-2 border-b border-slate-100">Credit</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {v.ledgerEntries.map((entry) => (
                            <tr key={entry.id}>
                              <td className="px-3 py-2 text-xs text-slate-600">{entry.account?.name}</td>
                              <td className="px-3 py-2 text-xs text-right font-mono text-slate-700">{entry.debitAmount > 0 ? fmt(entry.debitAmount) : "—"}</td>
                              <td className="px-3 py-2 text-xs text-right font-mono text-slate-700">{entry.creditAmount > 0 ? fmt(entry.creditAmount) : "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>

          {/* Footer: Summary & Actions */}
          <div className="px-5 py-4 border-t border-blue-50 bg-slate-50/50 space-y-3 shrink-0">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
              <div className="flex justify-between"><span className="text-slate-400">Subtotal</span><span className="font-mono font-semibold text-slate-600">{fmt(po.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">VAT</span><span className="font-mono font-semibold text-slate-600">{fmt(po.vatAmount)}</span></div>
              <div className="flex justify-between col-span-2 pt-1.5 border-t border-slate-200">
                <span className="font-bold text-slate-700">{po.dueAmount > 0 ? "Total Due" : "Settled"}</span>
                <span className={`font-mono font-extrabold ${po.dueAmount > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                  {fmt(po.dueAmount)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <ActionButton
                icon={<Boxes size={14} />}
                label="Receive"
                tone="blue"
                onClick={() => onAction("receive", po)}
                disabled={["FULLY_RECEIVED", "CANCELLED", "SHORT_CLOSED", "DRAFT"].includes(po.receivingStatus)}
              />
              <ActionButton
                icon={<CreditCard size={14} />}
                label="Pay Due"
                tone="amber"
                onClick={() => onAction("pay", po)}
                disabled={po.dueAmount <= 0 || po.paymentStatus === "PAID"}
              />
              <ActionButton
                icon={<Scissors size={14} />}
                label="Short-Close"
                tone="purple"
                onClick={() => onAction("shortclose", po)}
                disabled={outstandingCount === 0 || ["CANCELLED", "SHORT_CLOSED"].includes(po.receivingStatus)}
              />
              <ActionButton
                icon={<Ban size={14} />}
                label="Cancel"
                tone="rose"
                onClick={() => onAction("cancel", po)}
                disabled={outstandingCount === 0 || ["CANCELLED", "SHORT_CLOSED", "FULLY_RECEIVED"].includes(po.receivingStatus)}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}


const PAYMENT_METHOD_TO_TYPE: Record<string, PaymentInstrumentType | null> = {
  "Bank Transfer": "BANK",
  Cheque: "BANK",
  "Mobile Banking": "MOBILE_BANKING",
  Card: "CARD",
  Cash: null,
};

function accountDisplayName(a: VendorPaymentAccount): string {
  if (a.type === "BANK") return a.bankBranch?.bank?.name ?? "Bank";
  if (a.type === "MOBILE_BANKING") return a.mobileProvider ?? "Mobile Banking";
  if (a.type === "CARD") return a.cardProcessor ?? "Card";
  return "Account";
}

function accountDisplaySub(a: VendorPaymentAccount): string {
  if (a.type === "BANK") return [a.accountName, a.accountNumber].filter(Boolean).join(" · ");
  if (a.type === "MOBILE_BANKING") return [a.walletKind, a.walletNumber].filter(Boolean).join(" · ");
  if (a.type === "CARD") return [a.merchantId].filter(Boolean).join(" · ");
  return "";
}

function accountSearchHaystack(a: VendorPaymentAccount): string {
  return [
    a.label, a.accountName, a.accountNumber,
    a.bankBranch?.bank?.name, a.bankBranch?.branchName,
    a.mobileProvider, a.walletNumber, a.walletKind,
    a.cardProcessor, a.merchantId,
  ].filter(Boolean).join(" ").toLowerCase();
}

function PaymentAccountSearchDropdown({
  accounts, isLoading, vendorReady, selected, onSelect, emptyLabel,
}: {
  accounts: VendorPaymentAccount[];
  isLoading: boolean;
  vendorReady: boolean;
  selected: string;
  onSelect: (id: string) => void;
  emptyLabel: string;
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!q.trim()) return accounts;
    const term = q.trim().toLowerCase();
    return accounts.filter((a) => accountSearchHaystack(a).includes(term));
  }, [accounts, q]);

  const selectedAccount = accounts.find((a) => a.id === selected) ?? null;

  return (
    <div className="relative">
      <div
        className={`flex items-center gap-2 bg-white border rounded-xl px-3 py-2.5 cursor-pointer transition-all ${
          open ? "border-cyan-400 ring-1 ring-cyan-100" : "border-cyan-200 hover:border-cyan-300"
        } ${!vendorReady ? "opacity-50 cursor-not-allowed" : ""}`}
        onClick={() => vendorReady && setOpen((o) => !o)}
      >
        <Search size={13} className="text-cyan-400 shrink-0" />
        <span className="flex-1 min-w-0 text-sm">
          {selectedAccount ? (
            <span className="flex flex-col leading-tight min-w-0">
              <span className="font-semibold text-slate-700 truncate">
                {selectedAccount.label || accountDisplayName(selectedAccount)}
              </span>
              <span className="text-slate-400 text-[11px] truncate">
                {accountDisplaySub(selectedAccount)}
              </span>
            </span>
          ) : (
            <span className="text-slate-300">{vendorReady ? emptyLabel : "No vendor"}</span>
          )}
        </span>
        {selectedAccount && (
          <button
            onClick={(e) => { e.stopPropagation(); onSelect(""); setQ(""); }}
            className="text-slate-400 hover:text-rose-400 transition-colors shrink-0"
          >
            <X size={13} />
          </button>
        )}
        <ChevronDown size={13} className={`text-cyan-400 transition-transform shrink-0 ${open ? "rotate-180" : ""}`} />
      </div>

      {open && vendorReady && (
        <div className="absolute z-[200] top-full mt-1.5 left-0 right-0 bg-white border border-cyan-200 rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-slate-100">
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search account..."
              className="w-full text-sm px-2.5 py-1.5 bg-slate-50 border border-cyan-100 rounded-lg focus:outline-none focus:border-cyan-300"
            />
          </div>
          <div className="max-h-52 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-6 gap-2 text-cyan-500">
                <Loader2 size={14} className="animate-spin" />
                <span className="text-xs">Loading...</span>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400 px-3">
                {accounts.length === 0 ? emptyLabel : "No matching accounts"}
              </div>
            ) : (
              filtered.map((a) => (
                <button
                  key={a.id}
                  onClick={() => { onSelect(a.id); setOpen(false); setQ(""); }}
                  className="w-full text-left px-3 py-2 hover:bg-cyan-50 transition-colors border-b border-slate-50 last:border-0"
                >
                  <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    {a.type === "MOBILE_BANKING" && <Smartphone size={11} className="text-cyan-500 shrink-0" />}
                    {a.type === "BANK" && <Building2 size={11} className="text-cyan-500 shrink-0" />}
                    {a.type === "CARD" && <CreditCard size={11} className="text-cyan-500 shrink-0" />}
                    {a.label || accountDisplayName(a)}
                    {a.isDefault && (
                      <span className="text-[9px] font-bold text-cyan-600 bg-cyan-50 border border-cyan-200 rounded px-1 py-0.5">
                        DEFAULT
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{accountDisplaySub(a)}</div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
// ════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════════════════════════════════════

export default function PurchaseOrderDetailPage() {
  const user = useAppSelector((s) => s.auth.user);
  const vendorId = user?.vendorId ?? "";

  const [filters, setFilters] = useState<Filters>({
    search: "",
    warehouseId: "",
    warehouseType: "",
    supplierStatus: "",
    supplierId: "",
    receivingStatus: "",
    paymentStatus: "",
    page: 1,
    limit: 10,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const [selectedPoId, setSelectedPoId] = useState<string | null>(null);
  const [payTarget, setPayTarget] = useState<{
    id: string;
    purchaseNo: string;
    dueAmount: number;
    supplierName: string;
  } | null>(null);
  const [receiveTarget, setReceiveTarget] =
    useState<PurchaseOrderDetail | null>(null);
  const [shortCloseTarget, setShortCloseTarget] =
    useState<PurchaseOrderDetail | null>(null);
  const [cancelTarget, setCancelTarget] = useState<PurchaseOrderDetail | null>(
    null,
  );
  const [banner, setBanner] = useState("");

  const {
    data: listData,
    isLoading,
    isFetching,
    refetch,
  } = useGetPurchaseOrdersQuery({
    ...filters,
    supplierStatus: filters.supplierStatus || undefined,
    receivingStatus: filters.receivingStatus || undefined,
    paymentStatus: filters.paymentStatus || undefined,
  });

  const { data: supplierData, isFetching: isFetchingSuppliers } =
    useGetSuppliersQuery({
      status: filters.supplierStatus || undefined,
      limit: 100,
    });
  const suppliers = supplierData?.data ?? [];

  const { data: vendorWhData } = useGetWarehousesByVendorQuery(
    { vendorId, filters: { type: filters.warehouseType || undefined } },
    { skip: !vendorId },
  );
  const vendorWarehouses = vendorWhData?.data ?? [];

  const orders = listData?.data ?? [];
  const pagination = listData?.pagination;
  const stats = listData?.stats;
  const totalPages = pagination?.pages ?? 1;

  const sortedOrders = useMemo(() => {
    if (!sortField) return orders;
    const copy = [...orders];
    copy.sort((a: any, b: any) => {
      let av: number, bv: number;
      if (sortField === "purchaseDate") {
        av = new Date(a.purchaseDate).getTime();
        bv = new Date(b.purchaseDate).getTime();
      } else {
        av = Number(a.dueAmount) || 0;
        bv = Number(b.dueAmount) || 0;
      }
      return sortDir === "asc" ? av - bv : bv - av;
    });
    return copy;
  }, [orders, sortField, sortDir]);

  const handleSort = (field: Exclude<SortField, null>) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  useEffect(() => {
    if (!filters.supplierId || isFetchingSuppliers) return;
    if (
      suppliers.length &&
      !suppliers.some((s) => s.id === filters.supplierId)
    ) {
      setFilters((p) => ({ ...p, supplierId: "", page: 1 }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supplierData]);

  const handleReset = () =>
    setFilters({
      search: "",
      warehouseId: "",
      warehouseType: "",
      supplierStatus: "",
      supplierId: "",
      receivingStatus: "",
      paymentStatus: "",
      page: 1,
      limit: filters.limit,
    });

  const hasActiveFilters = !!(
    filters.search ||
    filters.warehouseId ||
    filters.warehouseType ||
    filters.supplierStatus ||
    filters.supplierId ||
    filters.receivingStatus ||
    filters.paymentStatus
  );

  const openPayFromRow = (order: any) => {
    setPayTarget({
      id: order.id,
      purchaseNo: order.purchaseNo,
      dueAmount: order.dueAmount,
      supplierName: order.supplier.name,
    });
  };

  const handleAction = (
    action: "receive" | "pay" | "shortclose" | "cancel",
    po: PurchaseOrderDetail,
  ) => {
    if (action === "receive") setReceiveTarget(po);
    if (action === "pay")
      setPayTarget({
        id: po.id,
        purchaseNo: po.purchaseNo,
        dueAmount: po.dueAmount,
        supplierName: po.supplier.name,
      });
    if (action === "shortclose") setShortCloseTarget(po);
    if (action === "cancel") setCancelTarget(po);
  };

  const notify = (msg: string) => {
    setBanner(msg);
    setTimeout(() => setBanner(""), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/20 font-sans text-slate-800">
      {/* Top Nav */}
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
            <span className="font-semibold text-slate-700">
              Purchase Orders
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-500 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
            >
              <RotateCcw
                size={12}
                className={isFetching ? "animate-spin" : ""}
              />
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
              Purchase Orders
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Track orders, goods receiving, and supplier payments
            </p>
          </div>
        </div>

        {/* Banner */}
        {banner && (
          <div className="mb-4 flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-700">
            <CheckCircle size={15} className="shrink-0" />
            {banner}
          </div>
        )}

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <StatCard
            label="Total Orders"
            value={stats?.totalOrders ?? stats?.count ?? 0}
            icon={<ShoppingCart size={16} />}
            accent
          />
          <StatCard
  label="Total Amount"
  value={fmt(stats?.totalAmount ?? (stats as any)?.totalValue)}
  icon={<span style={{ fontSize: '18px', fontWeight: 'bold' }}>৳</span>}
/>
          <StatCard
            label="Unpaid Dues"
            value={fmt(stats?.totalDue)}
            icon={<AlertTriangle size={16} />}
            warning={!!(stats?.totalDue && stats.totalDue > 0)}
          />
          <StatCard
            label="Pending Receive"
            value={
              orders.filter((o: any) =>
                ["CONFIRMED", "PARTIALLY_RECEIVED"].includes(o.receivingStatus),
              ).length
            }
            icon={<Truck size={16} />}
            sub="on this page"
          />
        </div>

        {/* Search + Filter Toggle */}
        <div className="flex items-center gap-2.5 mb-4">
          <div className="relative flex-1 max-w-md">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search by PO #, supplier..."
              value={filters.search}
              onChange={(e) =>
                setFilters((p) => ({ ...p, search: e.target.value, page: 1 }))
              }
              className="w-full pl-9 pr-3 bg-white border border-cyan-200 rounded-xl py-2.5 text-sm text-slate-700 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition-all"
            />
          </div>
          <button
            onClick={() => setShowFilters((p) => !p)}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold rounded-xl border transition-all ${
              showFilters || hasActiveFilters
                ? "bg-blue-50 border-blue-200 text-blue-700"
                : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
            }`}
          >
            <Filter size={13} />
            <span className="hidden sm:inline">Filters</span>
            {hasActiveFilters && (
              <span className="w-4 h-4 bg-blue-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {
                  [
                    filters.warehouseId,
                    filters.supplierId,
                    filters.receivingStatus,
                    filters.paymentStatus,
                    filters.warehouseType,
                    filters.supplierStatus,
                  ].filter(Boolean).length
                }
              </span>
            )}
          </button>
          {hasActiveFilters && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1 px-3 py-2.5 text-xs font-semibold text-rose-500 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100 transition-all"
            >
              <X size={12} />
              Clear
            </button>
          )}
        </div>

        {/* Expandable Filter Panel */}
        {showFilters && (
          <div className="bg-white border border-blue-100 rounded-2xl p-4 mb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Warehouse Type
              </label>
              <SelectBox
                options={Object.entries(WAREHOUSE_TYPE_CONFIG).map(
                  ([k, v]) => ({ value: k, label: v.label }),
                )}
                value={filters.warehouseType}
                onChange={(v) =>
                  setFilters((p) => ({
                    ...p,
                    warehouseType: v as WarehouseType | "",
                    warehouseId: "",
                    page: 1,
                  }))
                }
                placeholder="All Types"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Warehouse
              </label>
              <SelectBox
                options={vendorWarehouses.map((w: any) => ({
                  value: w.id,
                  label: w.name ?? w.code ?? w.id,
                }))}
                value={filters.warehouseId}
                onChange={(v) =>
                  setFilters((p) => ({ ...p, warehouseId: v, page: 1 }))
                }
                placeholder="All Warehouses"
                disabled={vendorWarehouses.length === 0}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Supplier Status
              </label>
              <SelectBox
                options={Object.entries(SUPPLIER_STATUS_CONFIG).map(
                  ([k, v]) => ({ value: k, label: v.label }),
                )}
                value={filters.supplierStatus}
                onChange={(v) =>
                  setFilters((p) => ({
                    ...p,
                    supplierStatus: v as SupplierStatus | "",
                    supplierId: "",
                    page: 1,
                  }))
                }
                placeholder="All Statuses"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Supplier
              </label>
              <SelectBox
                options={suppliers.map((s: any) => ({
                  value: s.id,
                  label: s.name,
                }))}
                value={filters.supplierId}
                onChange={(v) =>
                  setFilters((p) => ({ ...p, supplierId: v, page: 1 }))
                }
                placeholder="All Suppliers"
                disabled={suppliers.length === 0}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Receiving Status
              </label>
              <SelectBox
                options={Object.entries(RECEIVING_CONFIG).map(([k, v]) => ({
                  value: k,
                  label: v.label,
                }))}
                value={filters.receivingStatus}
                onChange={(v) =>
                  setFilters((p) => ({
                    ...p,
                    receivingStatus: v as ReceivingStatus | "",
                    page: 1,
                  }))
                }
                placeholder="All"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Payment Status
              </label>
              <SelectBox
                options={Object.entries(PAYMENT_CONFIG).map(([k, v]) => ({
                  value: k,
                  label: v.label,
                }))}
                value={filters.paymentStatus}
                onChange={(v) =>
                  setFilters((p) => ({
                    ...p,
                    paymentStatus: v as PaymentStatus | "",
                    page: 1,
                  }))
                }
                placeholder="All"
              />
            </div>
          </div>
        )}

        {/* Table — horizontal-only borders via divide-y, no vertical dividers */}
             <div className="bg-white rounded-2xl border border-blue-100 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead>
                  <tr className="bg-gradient-to-r from-blue-50 to-cyan-50">
                    {["PO #", "Date", "Supplier", "Warehouse", "Total", "Due", "Receiving", "Payment", "Action"].map((h, i) => (
                      <th
                        key={i}
                        className="text-left text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-3 py-3 border-b-2 border-blue-100 whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-b border-slate-200 last:border-b-0 animate-pulse">
                      <td className="px-3 py-3"><div className="h-3 w-16 bg-slate-200 rounded" /></td>
                      <td className="px-3 py-3"><div className="h-3 w-20 bg-slate-100 rounded" /></td>
                      <td className="px-3 py-3"><div className="h-3 w-28 bg-slate-100 rounded" /></td>
                      <td className="px-3 py-3"><div className="h-3 w-24 bg-slate-100 rounded" /></td>
                      <td className="px-3 py-3"><div className="h-3 w-16 bg-slate-100 rounded" /></td>
                      <td className="px-3 py-3"><div className="h-3 w-16 bg-slate-100 rounded" /></td>
                      <td className="px-3 py-3"><div className="h-5 w-24 bg-slate-100 rounded-full" /></td>
                      <td className="px-3 py-3"><div className="h-5 w-16 bg-slate-100 rounded-full" /></td>
                      <td className="px-3 py-3 text-center"><div className="h-6 w-6 bg-slate-100 rounded-lg mx-auto" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : sortedOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400">
              <ShoppingCart size={32} className="mb-3 opacity-30" />
              <p className="text-sm font-medium">No purchase orders found</p>
              {hasActiveFilters && <p className="text-xs mt-1">Try adjusting your filters</p>}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead>
                  <tr className="bg-gradient-to-r from-blue-50 to-cyan-50">
                    <th className="text-left text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-3 py-3 border-b-2 border-blue-100 whitespace-nowrap">
                      PO #
                    </th>
                    <th className="text-left text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-3 py-3 border-b-2 border-blue-100 whitespace-nowrap">
                      <SortableHeader
                        label="Date"
                        field="purchaseDate"
                        sortField={sortField}
                        sortDir={sortDir}
                        onSort={handleSort}
                      />
                    </th>
                    <th className="text-left text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-3 py-3 border-b-2 border-blue-100 whitespace-nowrap">
                      Supplier
                    </th>
                    <th className="text-left text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-3 py-3 border-b-2 border-blue-100 whitespace-nowrap">
                      Warehouse
                    </th>
                    <th className="text-left text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-3 py-3 border-b-2 border-blue-100 whitespace-nowrap">
                      Total
                    </th>
                    <th className="text-left text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-3 py-3 border-b-2 border-blue-100 whitespace-nowrap">
                      <SortableHeader
                        label="Due"
                        field="dueAmount"
                        sortField={sortField}
                        sortDir={sortDir}
                        onSort={handleSort}
                      />
                    </th>
                    <th className="text-left text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-3 py-3 border-b-2 border-blue-100 whitespace-nowrap">
                      Receiving
                    </th>
                    <th className="text-left text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-3 py-3 border-b-2 border-blue-100 whitespace-nowrap">
                      Payment
                    </th>
                    <th className="text-center text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-3 py-3 border-b-2 border-blue-100 whitespace-nowrap w-16">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedOrders.map((order: any) => (
                    <tr
                      key={order.id}
                      className="hover:bg-blue-50/30 transition-colors group border-b border-slate-200 last:border-b-0"
                    >
                      <td className="px-3 py-3">
                        <button
                          onClick={() => setSelectedPoId(order.id)}
                          className="text-xs font-bold text-blue-700 hover:text-blue-900 hover:underline transition-colors font-mono"
                        >
                          {order.purchaseNo}
                        </button>
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-500">
                        {fmtDate(order.purchaseDate)}
                      </td>
                      <td className="px-3 py-3 text-xs font-semibold text-slate-700">
                        {order.supplier?.name ?? "—"}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1.5">
                          {order.warehouse?.type && (
                            <StatusBadge
                              status={order.warehouse.type}
                              kind="warehouseType"
                            />
                          )}
                          <span className="text-xs text-slate-500">
                            {order.warehouse?.name ?? "—"}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3 font-mono text-xs font-semibold text-slate-700">
                        {fmt(order.totalAmount)}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`font-mono text-xs font-bold ${order.dueAmount > 0 ? "text-amber-600" : "text-emerald-600"}`}
                        >
                          {fmt(order.dueAmount)}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <StatusBadge
                          status={order.receivingStatus}
                          kind="receiving"
                        />
                      </td>
                      <td className="px-3 py-3">
                        <StatusBadge
                          status={order.paymentStatus}
                          kind="payment"
                        />
                      </td>
                      <td className="px-3 py-3 text-center">
                        <ActionMenu
                          order={order}
                          onView={() => setSelectedPoId(order.id)}
                          onPay={() => openPayFromRow(order)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-3 border-t border-blue-50 bg-slate-50/50 flex items-center justify-between">
              <div className="text-xs text-slate-400">
                Page {filters.page} of {totalPages}
                {pagination && <span className="ml-2">({pagination.total} total)</span>}
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setFilters((p) => ({ ...p, page: p.page - 1 }))}
                  disabled={filters.page <= 1}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-500 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft size={12} />
                  Prev
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) pageNum = i + 1;
                  else if (filters.page <= 3) pageNum = i + 1;
                  else if (filters.page >= totalPages - 2) pageNum = totalPages - 4 + i;
                  else pageNum = filters.page - 2 + i;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setFilters((p) => ({ ...p, page: pageNum }))}
                      className={`w-8 h-8 text-xs font-bold rounded-lg transition-all ${
                        filters.page === pageNum
                          ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md shadow-blue-200"
                          : "text-slate-500 hover:bg-slate-100"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setFilters((p) => ({ ...p, page: p.page + 1 }))}
                  disabled={filters.page >= totalPages}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-500 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  Next
                  <ChevronRight size={12} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detail Panel */}
      {selectedPoId && (
        <DetailPanel
          poId={selectedPoId}
          onClose={() => setSelectedPoId(null)}
          onAction={handleAction}
        />
      )}

      {/* Pay Due Modal */}
      {payTarget && (
        <PayDueModal
          purchaseNo={payTarget.purchaseNo}
          supplierName={payTarget.supplierName}
          dueAmount={payTarget.dueAmount}
          poId={payTarget.id}
          onClose={() => setPayTarget(null)}
          onSuccess={() => notify("Payment saved successfully")}
        />
      )}

      {/* Receive Goods Modal */}
      {receiveTarget && (
        <ReceiveGoodsModal
          po={receiveTarget}
          vendorId={vendorId}
          onClose={() => setReceiveTarget(null)}
          onSuccess={() => notify("Goods received successfully")}
        />
      )}

      {/* Short-Close Modal */}
      {shortCloseTarget && (
        <ShortCloseModal
          po={shortCloseTarget}
          vendorId={vendorId}
          onClose={() => setShortCloseTarget(null)}
          onSuccess={() => notify("Order short-closed successfully")}
        />
      )}

      {/* Cancel Modal */}
      {cancelTarget && (
        <CancelOrderModal
          po={cancelTarget}
          vendorId={vendorId}
          onClose={() => setCancelTarget(null)}
          onSuccess={() => notify("Order cancelled successfully")}
        />
      )}
    </div>
  );
}
