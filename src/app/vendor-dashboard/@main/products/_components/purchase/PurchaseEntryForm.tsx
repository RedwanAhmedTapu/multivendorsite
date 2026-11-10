"use client";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";
import {
  Save,
  RotateCcw,
  AlertTriangle,
  ChevronRight,
  Package,
  Truck,
  CreditCard,
  FileText,
  X,
  Search,
  Warehouse,
  ChevronDown,
  Loader2,
  CheckCircle,
  Building2,
  Hash,
  Calendar,
  Layers,
  ShoppingCart,
  Info,
  Plus,
  Percent,
  Sparkles,
  History,
  Smartphone,
  Wallet,
} from "lucide-react";

// ─── RTK Query hooks ──────────────────────────────────────────────────────────
import {
  useGetNextPurchaseNumberQuery,
  useCreatePurchaseOrderMutation,
} from "@/features/purchaseOrderApi";
import { useGetSuppliersQuery } from "@/features/supplierApi";
import { useGetWarehousesByVendorQuery } from "@/features/warehouseApi";
// Vendor's own payment accounts (bank / mobile banking / card) — used to
// populate the Payment "Account" dropdown, filtered by the selected
// payment method so a vendor can only pick an account of the matching type.
import {
  useGetVendorPaymentAccountsQuery,
  type VendorPaymentAccount,
} from "@/features/vendorManageApi";
import { PAYMENT_METHOD_OPTIONS, PAYMENT_METHOD_TO_TYPE } from "@/lib/payments/payment-methods";

// ─── Local components ─────────────────────────────────────────────────────────
import SearchableSelect from "./SearchableSelect";
import PurchaseItemsTable, { type PurchaseLineItem } from "./ItemsTable";
import ProductPickerModal from "./ProductPickerModal";
import AccountingPreview from "./AccountingPreview";

// ─── Draft persistence (session-expiry protection) ─────────────────────────────
// Place usePurchaseDraft.ts next to this file (or update this import path if
// you move it to a shared hooks/ folder, e.g. "@/hooks/usePurchaseDraft").
import { usePurchaseDraftWithPrompt } from "./usePurchaseDraft";

// ─── Local line-item type ──────────────────────────────────────────────────────
// NOTE: extends PurchaseLineItem (defined in ItemsTable.tsx) with `taxRate`,
// the ProductVariant.taxRate value captured at pick-time (converted from the
// server's whole-percent value to a fraction — see buildLineItem) so the VAT
// card can auto-calc a blended rate without re-fetching.
type LineItem = PurchaseLineItem & { taxRate: number };

// ─── Draft shape ──────────────────────────────────────────────────────────────
// Everything needed to fully reconstruct the form after a session-expiry
// interruption. Deliberately excludes poNumber (re-fetched fresh on
// restore — a stale reserved number could collide with one issued to
// someone else in the meantime) and the idempotency key (regenerated fresh
// so a restored draft is treated as a brand-new submission attempt).
interface PurchaseEntryDraft {
  supplier: any | null;
  supplierInvoiceNo: string;
  items: LineItem[];
  paidAmount: string;
  paymentMethod: string;
  vendorPaymentAccountId: string;
  payRef: string;
  notes: string;
  applyVat: boolean;
  vatMode: "auto" | "manual";
  manualVatPercent: string;
  purchaseDate: string;
}

const DRAFT_STORAGE_KEY = "purchase-entry-draft";

// ─── Constants ────────────────────────────────────────────────────────────────
// Payment methods and their account types: @/lib/payments/payment-methods
// (shared with the POS terminal).

// ─── Helpers ──────────────────────────────────────────────────────────────────
/** Defensively coerces every input — API strings, null, undefined, Prisma
 * Decimal-as-string, empty string — all normalized to a safe number. */
function weightedAvgCost(
  prevStock: number,
  prevAvg: number,
  newQty: number,
  newCost: number,
) {
  const safePrevStock = Number.isFinite(Number(prevStock))
    ? Number(prevStock)
    : 0;
  const safePrevAvg = Number.isFinite(Number(prevAvg)) ? Number(prevAvg) : 0;
  const safeNewQty = Number.isFinite(Number(newQty)) ? Number(newQty) : 0;
  const safeNewCost = Number.isFinite(Number(newCost)) ? Number(newCost) : 0;

  const total = safePrevStock + safeNewQty;
  if (total <= 0) return safeNewCost;

  const result =
    (safePrevStock * safePrevAvg + safeNewQty * safeNewCost) / total;
  return Number.isFinite(result) ? result : safeNewCost;
}

/** Generates a per-attempt idempotency key. Prefers the standard Web
 * Crypto UUID; falls back to a timestamp+random string on older browsers
 * or non-secure contexts where crypto.randomUUID isn't available. */
function generateIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

/** Builds a display label for a VendorPaymentAccount, shaped differently
 * per instrument type since BANK/MOBILE_BANKING/CARD carry different fields. */
function accountDisplayName(a: VendorPaymentAccount): string {
  if (a.type === "BANK") return a.bankBranch?.bank?.name ?? "Bank";
  if (a.type === "MOBILE_BANKING") return a.mobileProvider ?? "Mobile Banking";
  if (a.type === "CARD") return a.cardProcessor ?? "Card";
  return "Account";
}

function accountDisplaySub(a: VendorPaymentAccount): string {
  if (a.type === "BANK") {
    return [a.accountName, a.accountNumber].filter(Boolean).join(" · ");
  }
  if (a.type === "MOBILE_BANKING") {
    return [a.walletKind, a.walletNumber].filter(Boolean).join(" · ");
  }
  if (a.type === "CARD") {
    return [a.merchantId].filter(Boolean).join(" · ");
  }
  return "";
}

function accountSearchHaystack(a: VendorPaymentAccount): string {
  return [
    a.label,
    a.accountName,
    a.accountNumber,
    a.bankBranch?.bank?.name,
    a.bankBranch?.branchName,
    a.mobileProvider,
    a.walletNumber,
    a.walletKind,
    a.cardProcessor,
    a.merchantId,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

// ─── Taka currency icon ─────────────────────────────────────────────────────
// Small drop-in replacement for lucide's DollarSign — renders the Bangladeshi
// Taka glyph (৳) sized/colored the same way an icon component would be, so it
// can be used anywhere a `<DollarSign size={..} className={..} />` was used.
function TakaIcon({
  size = 14,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex items-center justify-center font-bold leading-none select-none ${className}`}
      style={{ fontSize: size, width: size, height: size }}
    >
      ৳
    </span>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SelectBox({
  options,
  value,
  onChange,
  placeholder = "Select...",
  disabled = false,
  small = false,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  small?: boolean;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`w-full appearance-none bg-white border border-cyan-200 rounded-xl text-slate-700 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 pr-8 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
          small ? "px-2.5 py-2 text-[12px]" : "px-3 py-2.5 text-sm"
        }`}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={small ? 12 : 14}
        className={`absolute right-2.5 top-1/2 -translate-y-1/2 text-cyan-400 pointer-events-none`}
      />
    </div>
  );
}

function InputField({
  label,
  required,
  children,
  icon,
  small,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  icon?: React.ReactNode;
  small?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        className={`font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1 ${
          small ? "text-[10px]" : "text-xs"
        }`}
      >
        {icon && <span className="text-cyan-500">{icon}</span>}
        {label}
        {required && <span className="text-rose-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function inputClass(extra = "") {
  return `w-full bg-white border border-cyan-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition-all ${extra}`;
}

function inputClassSmall(extra = "") {
  return `w-full bg-white border border-cyan-200 rounded-lg px-2.5 py-2 text-[12px] text-slate-700 placeholder-slate-300 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-100 transition-all ${extra}`;
}

// ─── Supplier Search Dropdown ─────────────────────────────────────────────────

function SupplierSearchDropdown({
  onSelect,
  selected,
}: {
  onSelect: (s: any) => void;
  selected: any | null;
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  const { data, isFetching } = useGetSuppliersQuery(
    { search: q, status: "ACTIVE", limit: 8 },
    { skip: !open },
  );

  const suppliers = data?.data ?? [];

  return (
    <div className="relative">
      <div
        className={`flex items-center gap-2 bg-white border rounded-xl px-3 py-2.5 cursor-pointer transition-all ${
          open
            ? "border-cyan-400 ring-2 ring-cyan-100"
            : "border-cyan-200 hover:border-cyan-300"
        }`}
        onClick={() => setOpen((o) => !o)}
      >
        <Search size={14} className="text-cyan-400 shrink-0" />
        <span className="text-sm flex-1 truncate text-slate-700">
          {selected ? (
            selected.name
          ) : (
            <span className="text-slate-300">Search supplier...</span>
          )}
        </span>
        {selected && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(null);
              setQ("");
            }}
            className="text-slate-400 hover:text-rose-400 transition-colors"
          >
            <X size={13} />
          </button>
        )}
        <ChevronDown
          size={14}
          className={`text-cyan-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </div>

      {open && (
        <div className="absolute z-[200] top-full mt-1.5 left-0 right-0 bg-white border border-cyan-200 rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-slate-100">
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Type name, phone..."
              className="w-full text-sm px-3 py-2 bg-slate-50 border border-cyan-100 rounded-lg focus:outline-none focus:border-cyan-300"
            />
          </div>
          <div className="max-h-52 overflow-y-auto">
            {isFetching ? (
              <div className="flex items-center justify-center py-6 gap-2 text-cyan-500">
                <Loader2 size={16} className="animate-spin" />
                <span className="text-sm">Loading...</span>
              </div>
            ) : suppliers.length === 0 ? (
              <div className="text-center py-6 text-sm text-slate-400">
                No suppliers found
              </div>
            ) : (
              suppliers.map((s: any) => (
                <button
                  key={s.id}
                  onClick={() => {
                    onSelect(s);
                    setOpen(false);
                    setQ("");
                  }}
                  className="w-full text-left px-3 py-2.5 hover:bg-cyan-50 transition-colors border-b border-slate-50 last:border-0"
                >
                  <div className="text-sm font-semibold text-slate-700">
                    {s.name}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {s.phone} · {s.supplierType}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Payment Account Search Dropdown ──────────────────────────────────────────
// Populates from GET /vendor/:vendorId/payment-accounts (vendorManageApi) —
// never shows admin/global accounts. The `accounts` prop is expected to
// already be pre-filtered by PaymentInstrumentType (BANK / MOBILE_BANKING /
// CARD) to match the currently selected payment method — see
// `relevantPaymentAccounts` in the parent component. Typing filters locally
// across bank/branch/account-name/number, mobile provider/wallet number, or
// card processor/merchant id, whichever fields are populated for that type.

function PaymentAccountSearchDropdown({
  accounts,
  isLoading,
  vendorReady,
  selected,
  onSelect,
  emptyLabel,
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
        className={`flex items-center gap-2 bg-white border rounded-xl px-2.5 py-2 cursor-pointer transition-all ${
          open
            ? "border-cyan-400 ring-1 ring-cyan-100"
            : "border-cyan-200 hover:border-cyan-300"
        } ${!vendorReady ? "opacity-50 cursor-not-allowed" : ""}`}
        onClick={() => vendorReady && setOpen((o) => !o)}
      >
        <Search size={12} className="text-cyan-400 shrink-0" />
        <span className="flex-1 min-w-0 text-[12px]">
          {selectedAccount ? (
            <span className="flex flex-col leading-tight min-w-0">
              <span className="font-semibold text-slate-700 truncate">
                {selectedAccount.label || accountDisplayName(selectedAccount)}
              </span>
              <span className="text-slate-400 text-[10px] truncate">
                {accountDisplaySub(selectedAccount)}
              </span>
            </span>
          ) : (
            <span className="text-slate-300">
              {vendorReady ? emptyLabel : "No vendor"}
            </span>
          )}
        </span>
        {selectedAccount && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect("");
              setQ("");
            }}
            className="text-slate-400 hover:text-rose-400 transition-colors shrink-0"
          >
            <X size={12} />
          </button>
        )}
        <ChevronDown
          size={12}
          className={`text-cyan-400 transition-transform shrink-0 ${open ? "rotate-180" : ""}`}
        />
      </div>

      {open && vendorReady && (
        <div className="absolute z-[200] top-full mt-1.5 left-0 right-0 bg-white border border-cyan-200 rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-slate-100">
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search account..."
              className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-cyan-100 rounded-lg focus:outline-none focus:border-cyan-300"
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
                {accounts.length === 0
                  ? emptyLabel
                  : "No matching accounts"}
              </div>
            ) : (
              filtered.map((a) => (
                <button
                  key={a.id}
                  onClick={() => {
                    onSelect(a.id);
                    setOpen(false);
                    setQ("");
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-cyan-50 transition-colors border-b border-slate-50 last:border-0"
                >
                  <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    {a.type === "MOBILE_BANKING" && (
                      <Smartphone size={11} className="text-cyan-500 shrink-0" />
                    )}
                    {a.type === "BANK" && (
                      <Building2 size={11} className="text-cyan-500 shrink-0" />
                    )}
                    {a.type === "CARD" && (
                      <CreditCard size={11} className="text-cyan-500 shrink-0" />
                    )}
                    {a.label || accountDisplayName(a)}
                    {a.isDefault && (
                      <span className="text-[9px] font-bold text-cyan-600 bg-cyan-50 border border-cyan-200 rounded px-1 py-0.5">
                        DEFAULT
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {accountDisplaySub(a)}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Form ────────────────────────────────────────────────────────────────

export default function PurchaseEntryForm() {
  // ── RTK Query ──────────────────────────────────────────────────────────────
  const { data: nextPoData } = useGetNextPurchaseNumberQuery();
  const [createPurchaseOrder, { isLoading: isSaving }] =
    useCreatePurchaseOrderMutation();

  const vendorId = useSelector(
    (state: RootState) => state.auth.user?.vendorId ?? "",
  );

  // Warehouses are still fetched — NOT for a top-level "which warehouse is
  // this PO for" selector (that field is removed; warehouse is decided per
  // line item during receiving), but purely to feed the multi-select
  // warehouse filter inside the Product Picker modal.
  const { data: warehouseData } = useGetWarehousesByVendorQuery(
    { vendorId, filters: { type: undefined } },
    { skip: !vendorId },
  );
  const warehouses = warehouseData?.data ?? [];
  const warehouseFilterOptions = useMemo(
    () =>
      warehouses.map((w: any) => ({
        id: w.id,
        label:
          [w.name, w.location?.city].filter(Boolean).join(" — ") ||
          w.code ||
          w.id,
      })),
    [warehouses],
  );

  // All of this vendor's payment accounts (bank + mobile banking + card).
  // Filtered down to the type matching the selected payment method below —
  // see `relevantPaymentAccounts`.
  const {
    data: vendorPaymentAccountsData,
    isFetching: isFetchingVendorPaymentAccounts,
  } = useGetVendorPaymentAccountsQuery(vendorId, { skip: !vendorId });
  const vendorPaymentAccounts = useMemo(
    () => vendorPaymentAccountsData?.data ?? [],
    [vendorPaymentAccountsData],
  );

  // ── Form state ─────────────────────────────────────────────────────────────
  const [poNumber, setPoNumber] = useState("PUR-2025-0001");
  const [purchaseDate, setPurchaseDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [supplier, setSupplier] = useState<any | null>(null);
  const [supplierInvoiceNo, setSupplierInvoiceNo] = useState("");
  const [items, setItems] = useState<LineItem[]>([]);
  const [paidAmount, setPaidAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Bank Transfer");
  // Holds the selected VendorPaymentAccount id (not a raw COA code).
  const [vendorPaymentAccountId, setVendorPaymentAccountId] = useState("");
  const [payRef, setPayRef] = useState("");
  const [notes, setNotes] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");
  const [showAccounting, setShowAccounting] = useState(true);

  // ── VAT state ──────────────────────────────────────────────────────────────
  const [applyVat, setApplyVat] = useState(false);
  const [vatMode, setVatMode] = useState<"auto" | "manual">("auto");
  const [manualVatPercent, setManualVatPercent] = useState("");

  // ── Duplicate-submission protection ──────────────────────────────────────
  const idempotencyKeyRef = useRef<string>(generateIdempotencyKey());

  // ── Draft persistence (session-expiry protection) ───────────────────────
  const {
    pendingDraft,
    acceptDraft,
    dismissDraft,
    save: saveDraft,
    clear: clearDraft,
  } = usePurchaseDraftWithPrompt<PurchaseEntryDraft>(DRAFT_STORAGE_KEY);

  const [draftBannerVisible, setDraftBannerVisible] = useState(false);
  useEffect(() => {
    if (pendingDraft) setDraftBannerVisible(true);
  }, [pendingDraft]);

  const handleRestoreDraft = () => {
    const draft = acceptDraft();
    if (!draft) return;
    setSupplier(draft.supplier ?? null);
    setSupplierInvoiceNo(draft.supplierInvoiceNo ?? "");
    setItems(draft.items ?? []);
    setPaidAmount(draft.paidAmount ?? "");
    setPaymentMethod(draft.paymentMethod ?? "Bank Transfer");
    setVendorPaymentAccountId(draft.vendorPaymentAccountId ?? "");
    setPayRef(draft.payRef ?? "");
    setNotes(draft.notes ?? "");
    setApplyVat(draft.applyVat ?? false);
    setVatMode(draft.vatMode ?? "auto");
    setManualVatPercent(draft.manualVatPercent ?? "");
    if (draft.purchaseDate) setPurchaseDate(draft.purchaseDate);
    setDraftBannerVisible(false);
  };

  const handleDiscardDraft = () => {
    dismissDraft();
    setDraftBannerVisible(false);
  };

  // Autosave
  useEffect(() => {
    if (!supplier && items.length === 0 && !notes && !supplierInvoiceNo) return;
    saveDraft({
      supplier,
      supplierInvoiceNo,
      items,
      paidAmount,
      paymentMethod,
      vendorPaymentAccountId,
      payRef,
      notes,
      applyVat,
      vatMode,
      manualVatPercent,
      purchaseDate,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    supplier,
    supplierInvoiceNo,
    items,
    paidAmount,
    paymentMethod,
    vendorPaymentAccountId,
    payRef,
    notes,
    applyVat,
    vatMode,
    manualVatPercent,
    purchaseDate,
  ]);

  // Sync PO number
  useEffect(() => {
    if (nextPoData?.data?.purchaseNo) setPoNumber(nextPoData.data.purchaseNo);
  }, [nextPoData]);

  // The instrument type that matches the currently selected payment method.
  // `null` means Cash — no account selection needed at all.
  const selectedInstrumentType = PAYMENT_METHOD_TO_TYPE[paymentMethod] ?? null;

  // Only the vendor's payment accounts matching the selected method's type,
  // and only active ones. This is what actually populates the dropdown.
  const relevantPaymentAccounts = useMemo(() => {
    if (!selectedInstrumentType) return [];
    return vendorPaymentAccounts.filter(
      (a) => a.type === selectedInstrumentType && a.isActive,
    );
  }, [vendorPaymentAccounts, selectedInstrumentType]);

  // Whenever the payment method changes, the previously selected account
  // (which belonged to a different instrument type) is no longer valid —
  // clear it so a stale BANK id can't silently get submitted as if it were
  // a MOBILE_BANKING id.
  const prevMethodRef = useRef(paymentMethod);
  useEffect(() => {
    if (prevMethodRef.current !== paymentMethod) {
      setVendorPaymentAccountId("");
      prevMethodRef.current = paymentMethod;
    }
  }, [paymentMethod]);

  // Default the payment account to this method's default account once the
  // list loads (only if the user — or a restored draft — hasn't picked one,
  // and only among accounts of the currently relevant type).
  useEffect(() => {
    if (vendorPaymentAccountId || relevantPaymentAccounts.length === 0) return;
    const def =
      relevantPaymentAccounts.find((a) => a.isDefault) ??
      relevantPaymentAccounts[0];
    if (def) setVendorPaymentAccountId(def.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [relevantPaymentAccounts]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "F2") {
        e.preventDefault();
        setPickerOpen(true);
      }
      if (e.ctrlKey && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    items,
    supplier,
    paidAmount,
    vendorPaymentAccountId,
    purchaseDate,
    supplierInvoiceNo,
    paymentMethod,
    payRef,
    notes,
    vendorId,
    applyVat,
    vatMode,
    manualVatPercent,
  ]);

  // ── Financials ─────────────────────────────────────────────────────────────
  const subtotal = items.reduce((s, i) => s + Number(i.total), 0);

  const autoVatRate = useMemo(() => {
    if (subtotal <= 0) return 0;
    const weighted = items.reduce(
      (s, i) => s + Number(i.total) * (Number(i.taxRate) || 0),
      0,
    );
    return weighted / subtotal;
  }, [items, subtotal]);

  const manualVatRateFraction = (parseFloat(manualVatPercent) || 0) / 100;

  const effectiveVatRate = !applyVat
    ? 0
    : vatMode === "manual"
      ? manualVatRateFraction
      : autoVatRate;

  const vat = parseFloat((subtotal * effectiveVatRate).toFixed(2));
  const grandTotal = subtotal + vat;
  const paidNum = parseFloat(paidAmount) || 0;
  const dueAmount = Math.max(0, grandTotal - paidNum);

  // Label shown in the Accounting Preview card — resolved from the selected
  // VendorPaymentAccount, shaped per instrument type, or "Cash in Hand" when
  // the method is Cash (no account selection applies).
  const selectedPaymentAccount = useMemo(
    () =>
      vendorPaymentAccounts.find((a) => a.id === vendorPaymentAccountId) ??
      null,
    [vendorPaymentAccounts, vendorPaymentAccountId],
  );
  const accountLabel = !selectedInstrumentType
    ? "Cash in Hand"
    : selectedPaymentAccount
      ? `${selectedPaymentAccount.label || accountDisplayName(selectedPaymentAccount)} — ${accountDisplaySub(selectedPaymentAccount)}`
      : "No account selected";

  const vatLabel = !applyVat
    ? "No VAT applied"
    : vatMode === "manual"
      ? `Manual — ${(manualVatRateFraction * 100).toFixed(2)}%`
      : `Auto — ${(autoVatRate * 100).toFixed(2)}% (blended from item tax rates)`;

  // ── Currently selected variant ids ─────────────────────────────────────────
  const selectedVariantIds = useMemo(
    () => new Set(items.map((i) => i.variantId)),
    [items],
  );

  function formatInvoiceNo(raw: string): string {
    return raw
      .toUpperCase()
      .replace(/[\s-]+/g, "-")
      .replace(/^-/, "");
  }

  // ── Item management ────────────────────────────────────────────────────────
  const buildLineItem = useCallback((product: any, variant: any): LineItem => {
    const warehouseTotal =
      variant.warehouseStock?.reduce(
        (s: number, ws: any) => s + (ws.quantity ?? 0),
        0,
      ) ??
      variant.stock ??
      0;

    return {
      rowId: `row-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      variantId: variant.id,
      productId: product.id,
      productName: product.name,
      variantName: variant.name || "Default",
      sku: variant.sku,
      qty: 1,
      unitCost: 0,
      mrpPrice: variant.price ?? 0,
      sellPrice: variant.specialPrice ?? variant.price ?? 0,
      newAvgCost: 0,
      total: 0,
      expiry: "",
      prevStock: warehouseTotal,
      prevAvg: variant.avgCost ?? 0,
      image: product.images?.[0]?.url ?? null,
      taxRate: (Number(variant.taxRate) || 0) / 100,
    } as LineItem;
  }, []);

  const handleToggleVariant = useCallback(
    (product: any, variant: any, checked: boolean) => {
      setItems((prev) => {
        const exists = prev.some((i) => i.variantId === variant.id);
        if (checked) {
          if (exists) return prev;
          return [...prev, buildLineItem(product, variant)];
        } else {
          if (!exists) return prev;
          return prev.filter((i) => i.variantId !== variant.id);
        }
      });
    },
    [buildLineItem],
  );

  const handleToggleProduct = useCallback(
    (product: any, checked: boolean) => {
      const variants: any[] = product.variants ?? [];
      setItems((prev) => {
        let next = [...prev];
        for (const variant of variants) {
          const exists = next.some((i) => i.variantId === variant.id);
          if (checked && !exists) {
            next.push(buildLineItem(product, variant));
          } else if (!checked && exists) {
            next = next.filter((i) => i.variantId !== variant.id);
          }
        }
        return next;
      });
    },
    [buildLineItem],
  );

  const handleQtyChange = (id: string, qty: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.rowId !== id) return item;
        const updated = { ...item, qty };
        const numQty = Number(updated.qty) || 0;
        const numCost = Number(updated.unitCost) || 0;
        updated.total = numQty * numCost;
        updated.newAvgCost =
          numCost > 0
            ? weightedAvgCost(
                Number(item.prevStock) || 0,
                Number(item.prevAvg) || 0,
                numQty,
                numCost,
              )
            : 0;
        return updated;
      }),
    );
  };

  const handleCostChange = (id: string, cost: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.rowId !== id) return item;
        const updated = { ...item, unitCost: cost };
        const numQty = Number(updated.qty) || 0;
        const numCost = Number(updated.unitCost) || 0;
        updated.total = numQty * numCost;
        updated.newAvgCost =
          numCost > 0
            ? weightedAvgCost(
                Number(item.prevStock) || 0,
                Number(item.prevAvg) || 0,
                numQty,
                numCost,
              )
            : 0;
        return updated;
      }),
    );
  };

  const handleMrpPriceChange = (id: string, price: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.rowId === id ? { ...item, mrpPrice: price } : item,
      ),
    );
  };

  const handleSellPriceChange = (id: string, price: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.rowId === id ? { ...item, sellPrice: price } : item,
      ),
    );
  };

  const handleExpiryChange = (id: string, expiry: string) => {
    setItems((prev) =>
      prev.map((item) => (item.rowId === id ? { ...item, expiry } : item)),
    );
  };

  const handleRemoveItem = (id: string) =>
    setItems((prev) => prev.filter((i) => i.rowId !== id));

  // ── Reset ──────────────────────────────────────────────────────────────────
  const handleReset = () => {
    setItems([]);
    setSupplier(null);
    setSupplierInvoiceNo("");
    setPaidAmount("");
    setPayRef("");
    setNotes("");
    setApplyVat(false);
    setVatMode("auto");
    setManualVatPercent("");
    setVendorPaymentAccountId("");
    setPaymentMethod("Bank Transfer");
    setPurchaseDate(new Date().toISOString().slice(0, 10));
    setSaveError("");
    setSaveSuccess("");
    clearDraft();
    idempotencyKeyRef.current = generateIdempotencyKey();
  };

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaveError("");
    setSaveSuccess("");

    if (!supplier) {
      setSaveError("Please select a supplier.");
      return;
    }
    if (!items.length) {
      setSaveError("Add at least one item.");
      return;
    }
    if (items.some((i) => !i.unitCost || Number(i.unitCost) <= 0)) {
      setSaveError("Enter unit cost for all items.");
      return;
    }
    if (items.some((i) => !i.sellPrice || Number(i.sellPrice) <= 0)) {
      setSaveError("Enter sell price for all items.");
      return;
    }
    if (applyVat && vatMode === "manual" && !manualVatPercent) {
      setSaveError("Enter a manual VAT percentage, or switch to Auto.");
      return;
    }
    // An account is only required when paid > 0 AND the method actually
    // needs one (i.e. not Cash — Cash always resolves to a fixed fallback
    // ledger account on the backend with no vendor input needed).
    if (paidNum > 0 && selectedInstrumentType && !vendorPaymentAccountId) {
      setSaveError(
        `Select which ${paymentMethod.toLowerCase()} account received the payment.`,
      );
      return;
    }

    const aboveMrp = items.filter(
      (i) => Number(i.mrpPrice) > 0 && Number(i.sellPrice) > Number(i.mrpPrice),
    );
    if (aboveMrp.length) {
      setSaveError(
        `Sell price cannot exceed MRP price for: ${aboveMrp
          .map((i) => `${i.productName} — ${i.variantName}`)
          .join(", ")}`,
      );
      return;
    }

    const belowAvg = items.filter(
      (i) =>
        Number(i.sellPrice) > 0 &&
        Number(i.newAvgCost) > 0 &&
        Number(i.sellPrice) < Number(i.newAvgCost),
    );
    if (belowAvg.length) {
      const ok = window.confirm(
        `⚠ Sell price below avg cost for:\n${belowAvg
          .map((i) => `• ${i.productName} — ${i.variantName}`)
          .join("\n")}\n\nProceed anyway?`,
      );
      if (!ok) return;
    }

    try {
      const result = await createPurchaseOrder({
        purchaseDate,
        supplierId: supplier.id,
        supplierInvoiceNo: supplierInvoiceNo || undefined,
        vatRate:
          applyVat && effectiveVatRate > 0 ? effectiveVatRate : undefined,
        // Resolved server-side against VendorPaymentAccount.chartOfAccountId.
        // Omitted entirely for Cash — the backend falls back to the vendor's
        // "Cash in Hand" ledger account with no id required.
        vendorPaymentAccountId:
          paidNum > 0 && selectedInstrumentType
            ? vendorPaymentAccountId
            : undefined,
        paidAmount: paidNum || undefined,
        paymentMethod: paidNum > 0 ? paymentMethod : undefined,
        paymentReference: payRef || undefined,
        notes: notes || undefined,
        entityType: "VENDOR" as const,
        entityId: vendorId || undefined,
        idempotencyKey: idempotencyKeyRef.current,
        items: items.map((i) => ({
          variantId: i.variantId,
          productName: i.productName,
          variantName: i.variantName,
          sku: i.sku,
          quantity: Number(i.qty),
          unitCost: Number(i.unitCost),
          mrpPrice: i.mrpPrice ? Number(i.mrpPrice) : undefined,
          sellPrice: Number(i.sellPrice),
          expiryDate: i.expiry || null,
        })),
      }).unwrap();

      const poNo = result.data?.purchaseNo ?? poNumber;
      const voucherNos = (result.data?.vouchers ?? [])
        .map((v: any) => v.voucherNumber)
        .filter(Boolean)
        .join(", ");

      setSaveSuccess(
        `✅ ${poNo} saved successfully!${
          voucherNos ? `  Vouchers posted: ${voucherNos}` : ""
        }`,
      );
      handleReset();
    } catch (err: any) {
      const msg =
        err?.data?.message ??
        err?.message ??
        "Failed to save purchase order. Please try again.";
      setSaveError(msg);
    }
  };

  const TABLE_HEADERS = [
    "#",
    "Product / Variant",
    "SKU",
    "Qty",
    "Unit Cost",
    "MRP Price",
    "Sell Price",
    "New Avg",
    "Expiry",
    "Total",
    "",
  ];

  // ── JSX ────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/20 font-sans text-slate-800">
      {/* ── Top Navigation Bar ── */}
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
            <span className="font-semibold text-slate-700">Purchase Entry</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1 font-mono text-xs text-slate-400 bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1.5">
              <Hash size={11} />
              {poNumber}
            </div>
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-500 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all"
            >
              <RotateCcw size={12} />
              <span className="hidden sm:inline">Reset</span>
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-xs font-bold rounded-xl hover:from-blue-700 hover:to-cyan-600 disabled:opacity-60 disabled:cursor-not-allowed shadow-md shadow-blue-200 transition-all hover:shadow-lg hover:shadow-blue-200 active:scale-95"
            >
              {isSaving ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Save size={13} />
              )}
              {isSaving ? "Saving..." : "Save Purchase"}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-screen-xl mx-auto px-2 py-5 sm:py-7">
        {/* Restore-draft banner */}
        {draftBannerVisible && pendingDraft && (
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-3 bg-cyan-50 border border-cyan-200 rounded-xl px-4 py-3">
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <History size={16} className="text-cyan-500 shrink-0" />
              <div className="min-w-0">
                <div className="text-sm font-semibold text-cyan-800">
                  Unsaved purchase entry found
                </div>
                <div className="text-xs text-cyan-600">
                  Looks like a previous session ended before this was saved
                  {pendingDraft.items?.length
                    ? ` — ${pendingDraft.items.length} item${
                        pendingDraft.items.length > 1 ? "s" : ""
                      } were added`
                    : ""}. Restore it?
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleRestoreDraft}
                className="px-3 py-1.5 text-xs font-bold text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 transition-all"
              >
                Restore
              </button>
              <button
                onClick={handleDiscardDraft}
                className="px-3 py-1.5 text-xs font-semibold text-cyan-700 bg-white border border-cyan-200 rounded-lg hover:bg-cyan-50 transition-all"
              >
                Discard
              </button>
            </div>
          </div>
        )}

        {/* Page Title */}
        <div className="mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">
              Purchase Entry
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          {items.length > 0 && (
            <div className="flex items-center gap-1.5 bg-cyan-50 text-cyan-700 border border-cyan-200 rounded-xl px-3 py-1.5 text-xs font-semibold">
              <ShoppingCart size={12} />
              {items.length} item{items.length > 1 ? "s" : ""}
            </div>
          )}
        </div>

        {/* Alerts */}
        {saveError && (
          <div className="mb-4 flex items-center gap-2.5 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-sm text-rose-700">
            <AlertTriangle size={15} className="shrink-0" />
            <span className="flex-1">{saveError}</span>
            <button
              onClick={() => setSaveError("")}
              className="text-rose-400 hover:text-rose-600"
            >
              <X size={13} />
            </button>
          </div>
        )}
        {saveSuccess && (
          <div className="mb-4 flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-700">
            <CheckCircle size={15} className="shrink-0" />
            <span className="flex-1">{saveSuccess}</span>
            <button
              onClick={() => setSaveSuccess("")}
              className="text-emerald-400 hover:text-emerald-600"
            >
              <X size={13} />
            </button>
          </div>
        )}

        {/* ── Main Layout Container ──────────────────────────────────────────
            Requested order (each full-width block stacked top→bottom):
            1) Purchase Details
            2) Purchase Items
            3) One row: Tax (VAT) | Order Summary | Payment
            4) Notes
            5) Accounting Preview | Quick Info  (supporting info, kept below)
            6) Status badges (only once supplier + items exist)
        ───────────────────────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-5">
          {/* ── 1. Purchase Details Card (Full Width) ── */}
          <div className="bg-white rounded-2xl border border-blue-100 shadow-sm shadow-blue-50">
            <div className="px-5 py-4 border-b border-blue-50 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-sm">
                <FileText size={15} className="text-white" />
              </div>
              <span className="text-sm font-bold text-slate-700">
                Purchase Details
              </span>
            </div>

            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
                <InputField
                  label="Date"
                  required
                  icon={<Calendar size={11} />}
                >
                  <input
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className={inputClass()}
                  />
                </InputField>

                <InputField label="PO Number" icon={<Hash size={11} />}>
                  <input
                    type="text"
                    value={poNumber}
                    readOnly
                    className={inputClass(
                      "bg-slate-50 text-slate-400 cursor-not-allowed font-mono",
                    )}
                  />
                </InputField>

                <InputField
                  label="Search Supplier"
                  required
                  icon={<Search size={11} />}
                >
                  <SupplierSearchDropdown
                    selected={supplier}
                    onSelect={setSupplier}
                  />
                </InputField>

                <InputField
                  label="Supplier Invoice No"
                  icon={<Hash size={11} />}
                >
                  <input
                    type="text"
                    value={supplierInvoiceNo}
                    onChange={(e) =>
                      setSupplierInvoiceNo(formatInvoiceNo(e.target.value))
                    }
                    placeholder="INV-2025-..."
                    className={inputClass("uppercase")}
                  />
                </InputField>
              </div>

              {/* Supplier info card */}
              {supplier && (
                <div className="mt-4 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-100 rounded-xl px-4 py-3">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div>
                      <div className="text-sm font-bold text-slate-700">
                        {supplier.name}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {supplier.phone} · {supplier.email}
                      </div>
                      {supplier.fullAddress && (
                        <div className="text-xs text-slate-400 mt-0.5">
                          {supplier.fullAddress}
                        </div>
                      )}
                      {supplier.totalDue > 0 ? (
                        <div className="text-xs text-amber-700 font-semibold mt-1.5 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1 inline-flex items-center gap-1">
                          <AlertTriangle size={11} />
                          Outstanding: ৳{" "}
                          {Number(supplier.totalDue ?? 0).toFixed(2)}
                        </div>
                      ) : (
                        <div className="text-xs text-emerald-600 font-semibold mt-1.5 inline-flex items-center gap-1">
                          <CheckCircle size={11} />
                          Clear Account
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 space-y-0.5 sm:text-right shrink-0">
                      <div>
                        <span className="text-slate-400">Terms: </span>
                        <span className="font-semibold">
                          {supplier.paymentTerms || "—"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400">Credit: </span>
                        <span className="font-semibold">
                          ৳{(supplier.creditLimit || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="inline-flex items-center gap-1 bg-blue-100 text-blue-600 rounded-md px-2 py-0.5 text-xs font-semibold mt-1">
                        {supplier.supplierType}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── 2. Purchase Items Card (Full Width) ── */}
          <div className="bg-white rounded-2xl border border-blue-100 shadow-sm shadow-blue-50 min-w-0">
            <div className="px-5 py-4 border-b border-blue-50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-sm">
                  <ShoppingCart size={15} className="text-white" />
                </div>
                <span className="text-sm font-bold text-slate-700">
                  Purchase Items
                </span>
                {items.length > 0 && (
                  <span className="text-xs font-bold text-cyan-600 bg-cyan-50 border border-cyan-200 rounded-full px-2 py-0.5">
                    {items.length}
                  </span>
                )}
              </div>
              <button
                onClick={() => setPickerOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-xs font-bold rounded-xl hover:from-blue-700 hover:to-cyan-600 shadow-sm shadow-blue-200 transition-all active:scale-95"
              >
                <Plus size={13} />
                <span className="hidden sm:inline">Add Product</span>
                <span className="sm:hidden">Add</span>
              </button>
            </div>

            <div className="overflow-x-auto min-w-0">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 text-slate-300">
                  <Package size={36} className="mb-3 opacity-40" />
                  <p className="text-sm font-medium text-slate-400">
                    No items added yet
                  </p>
                  <p className="text-xs text-slate-300 mt-1">
                    Press{" "}
                    <kbd className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded text-[10px] font-mono border border-slate-200">
                      F2
                    </kbd>{" "}
                    or click Add Product
                  </p>
                </div>
              ) : (
                <table className="w-full" style={{ minWidth: 1180 }}>
                  <thead>
                    <tr className="bg-gradient-to-r from-blue-50 to-cyan-50">
                      {TABLE_HEADERS.map((h, i) => (
                        <th
                          key={i}
                          className={`text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-3 py-2.5 border-b border-blue-100 whitespace-nowrap ${
                            i === TABLE_HEADERS.length - 2
                              ? "text-right"
                              : i === 0
                                ? "text-center"
                                : "text-left"
                          }`}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <PurchaseItemsTable
                      items={items}
                      onQtyChange={handleQtyChange}
                      onCostChange={handleCostChange}
                      onMrpPriceChange={handleMrpPriceChange}
                      onSellPriceChange={handleSellPriceChange}
                      onExpiryChange={handleExpiryChange}
                      onRemove={handleRemoveItem}
                    />
                  </tbody>
                </table>
              )}
            </div>

            {items.length > 0 && (
              <div className="px-5 py-3 border-t border-blue-50 bg-slate-50/50 flex items-center justify-between">
                <div className="text-xs text-slate-400">
                  {items.length} line item
                  {items.length > 1 ? "s" : ""}
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-slate-400">
                    Subtotal:{" "}
                    <span className="font-bold text-slate-600 font-mono">
                      ৳{subtotal.toFixed(2)}
                    </span>
                  </span>
                  {vat > 0 && (
                    <span className="text-slate-400">
                      VAT:{" "}
                      <span className="font-bold text-slate-600 font-mono">
                        ৳{vat.toFixed(2)}
                      </span>
                    </span>
                  )}
                  <span className="text-slate-500">
                    Total:{" "}
                    <span className="font-bold text-blue-600 font-mono text-sm">
                      ৳{grandTotal.toFixed(2)}
                    </span>
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* ── 3. One Row: Tax (VAT) | Order Summary | Payment ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
            {/* Tax (VAT) Card */}
            <div className="bg-white rounded-2xl border border-blue-100 shadow-sm shadow-blue-50">
              <div className="px-4 py-3 border-b border-blue-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Percent size={14} className="text-purple-500" />
                  <span className="text-sm font-bold text-slate-700">
                    Tax (VAT)
                  </span>
                </div>
                <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    Apply
                  </span>
                  <input
                    type="checkbox"
                    checked={applyVat}
                    onChange={(e) => setApplyVat(e.target.checked)}
                    className="w-4 h-4 accent-purple-500 cursor-pointer"
                  />
                </label>
              </div>

              <div className="p-4 space-y-3">
                {!applyVat ? (
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2.5 text-xs text-slate-400">
                    <Info size={12} className="shrink-0" />
                    No VAT will be applied to this purchase.
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setVatMode("auto")}
                        className={`flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                          vatMode === "auto"
                            ? "bg-purple-50 border-purple-300 text-purple-700"
                            : "bg-white border-slate-200 text-slate-400 hover:border-slate-300"
                        }`}
                      >
                        <Sparkles size={12} />
                        Auto
                      </button>
                      <button
                        type="button"
                        onClick={() => setVatMode("manual")}
                        className={`flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                          vatMode === "manual"
                            ? "bg-purple-50 border-purple-300 text-purple-700"
                            : "bg-white border-slate-200 text-slate-400 hover:border-slate-300"
                        }`}
                      >
                        <Hash size={12} />
                        Manual
                      </button>
                    </div>

                    {vatMode === "auto" ? (
                      <div className="bg-purple-50 border border-purple-100 rounded-xl px-3 py-2.5">
                        <div className="text-[10px] font-bold text-purple-500 uppercase tracking-wider mb-0.5">
                          Blended rate from item tax rates
                        </div>
                        <div className="text-lg font-extrabold font-mono text-purple-700">
                          {(autoVatRate * 100).toFixed(2)}%
                        </div>
                        <div className="text-[11px] text-purple-400 mt-0.5">
                          Weighted average of each item's variant tax rate,
                          proportional to its share of the subtotal.
                        </div>
                      </div>
                    ) : (
                      <InputField
                        label="Manual VAT rate (%)"
                        small
                        icon={<Percent size={10} />}
                      >
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step="0.01"
                          value={manualVatPercent}
                          onChange={(e) => setManualVatPercent(e.target.value)}
                          placeholder="e.g. 15"
                          className={inputClassSmall("font-mono")}
                        />
                      </InputField>
                    )}

                    <div className="flex justify-between items-center text-xs px-1">
                      <span className="text-slate-400">VAT amount</span>
                      <span className="font-mono font-bold text-purple-600">
                        ৳{vat.toFixed(2)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Order Summary Card */}
            <div className="bg-white rounded-2xl border border-blue-100 shadow-sm shadow-blue-50">
              <div className="px-4 py-3 border-b border-blue-50 flex items-center gap-2">
                <TakaIcon size={14} className="text-cyan-500" />
                <span className="text-sm font-bold text-slate-700">
                  Order Summary
                </span>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Subtotal</span>
                  <span className="font-mono font-semibold text-slate-600">
                    ৳{subtotal.toFixed(2)}
                  </span>
                </div>
                {vat > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">
                      VAT ({(effectiveVatRate * 100).toFixed(2)}%)
                    </span>
                    <span className="font-mono font-semibold text-slate-600">
                      ৳{vat.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="h-px bg-slate-100" />
                <div className="flex justify-between text-sm">
                  <span className="font-bold text-slate-700">Grand Total</span>
                  <span className="font-extrabold font-mono text-blue-600">
                    ৳{grandTotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Paid</span>
                  <span className="font-mono font-semibold text-emerald-600">
                    ৳{paidNum.toFixed(2)}
                  </span>
                </div>
                <div
                  className={`flex justify-between text-sm px-3 py-2 rounded-lg ${
                    dueAmount > 0
                      ? "bg-amber-50 text-amber-700"
                      : "bg-emerald-50 text-emerald-700"
                  }`}
                >
                  <span className="font-bold">Due</span>
                  <span className="font-extrabold font-mono">
                    ৳{dueAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Card */}
            <div className="bg-white rounded-2xl border border-blue-100 shadow-sm shadow-blue-50">
              <div className="px-4 py-3 border-b border-blue-50 flex items-center gap-2">
                <CreditCard size={14} className="text-emerald-500" />
                <span className="text-sm font-bold text-slate-700">
                  Payment
                </span>
                <div className="ml-auto flex items-center gap-1 text-[9px] text-slate-400 bg-slate-50 border border-slate-100 rounded-md px-1.5 py-0.5">
                  Optional
                </div>
              </div>

              <div className="p-4 space-y-3">
                <InputField
                  label="Paid Amount"
                  small
                  icon={<TakaIcon size={10} />}
                >
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    placeholder="0.00"
                    className={inputClassSmall("font-mono text-right")}
                  />
                </InputField>

                <InputField
                  label="Method"
                  small
                  icon={<CreditCard size={10} />}
                >
                  <SelectBox
                    options={PAYMENT_METHOD_OPTIONS}
                    value={paymentMethod}
                    onChange={setPaymentMethod}
                    small
                  />
                </InputField>

                {/* Account — searchable, filtered to the payment accounts
                    matching the selected method's instrument type, sourced
                    only from this vendor's own accounts (GET
                    /vendor/:vendorId/payment-accounts). Cash needs no
                    account selection at all — it always resolves server-side
                    to "Cash in Hand". */}
                {selectedInstrumentType ? (
                  <InputField label="Account" small icon={<Layers size={10} />}>
                    <PaymentAccountSearchDropdown
                      accounts={relevantPaymentAccounts}
                      isLoading={isFetchingVendorPaymentAccounts}
                      vendorReady={!!vendorId}
                      selected={vendorPaymentAccountId}
                      onSelect={setVendorPaymentAccountId}
                      emptyLabel={
                        selectedInstrumentType === "MOBILE_BANKING"
                          ? "No mobile banking accounts yet — add one in Settings"
                          : selectedInstrumentType === "CARD"
                            ? "No card accounts yet — add one in Settings"
                            : "No bank accounts yet — add one in Settings"
                      }
                    />
                  </InputField>
                ) : (
                  <InputField label="Account" small icon={<Wallet size={10} />}>
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-[12px] text-slate-400 italic">
                      Cash — no account selection needed
                    </div>
                  </InputField>
                )}

                <InputField label="Reference" small icon={<Hash size={10} />}>
                  <input
                    type="text"
                    value={payRef}
                    onChange={(e) => setPayRef(e.target.value)}
                    placeholder="Cheque # / Txn ref..."
                    className={inputClassSmall()}
                  />
                </InputField>

                {grandTotal > 0 && (
                  <div
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 border ${
                      dueAmount > 0
                        ? "bg-amber-50 border-amber-200"
                        : "bg-emerald-50 border-emerald-200"
                    }`}
                  >
                    {dueAmount > 0 ? (
                      <AlertTriangle
                        size={12}
                        className="text-amber-500 shrink-0"
                      />
                    ) : (
                      <CheckCircle
                        size={12}
                        className="text-emerald-500 shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div
                        className={`text-[10px] font-bold uppercase tracking-wider ${
                          dueAmount > 0 ? "text-amber-600" : "text-emerald-600"
                        }`}
                      >
                        {dueAmount > 0 ? "Due" : "Fully Paid"}
                      </div>
                      <div
                        className={`text-sm font-extrabold font-mono truncate ${
                          dueAmount > 0 ? "text-amber-800" : "text-emerald-800"
                        }`}
                      >
                        ৳{dueAmount.toFixed(2)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── 4. Notes Card (Full Width) ── */}
          <div className="bg-white rounded-2xl border border-blue-100 shadow-sm shadow-blue-50">
            <div className="px-5 py-4 border-b border-blue-50 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center shadow-sm">
                <FileText size={15} className="text-white" />
              </div>
              <span className="text-sm font-bold text-slate-700">Notes</span>
            </div>
            <div className="p-5">
              <InputField label="Internal Notes" icon={<FileText size={11} />}>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional notes about this purchase..."
                  rows={3}
                  className={`${inputClass("resize-none")} min-h-[80px]`}
                />
              </InputField>
            </div>
          </div>

          {/* ── 5. Accounting Preview + Quick Info (supporting info) ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
            {/* Accounting Preview Card */}
            <div className="bg-white rounded-2xl border border-blue-100 shadow-sm shadow-blue-50">
              <div className="px-4 py-3 border-b border-blue-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers size={14} className="text-cyan-500" />
                  <span className="text-sm font-bold text-slate-700">
                    Accounting
                  </span>
                </div>
                <button
                  onClick={() => setShowAccounting((p) => !p)}
                  className="text-[11px] text-cyan-600 hover:text-cyan-700 font-medium transition-colors"
                >
                  {showAccounting ? "Hide" : "Show"}
                </button>
              </div>
              {showAccounting && (
                <div className="p-3">
                  <AccountingPreview
                    subtotal={subtotal}
                    vatRate={effectiveVatRate}
                    vatLabel={vatLabel}
                    paidAmount={paidNum}
                    poNumber={poNumber}
                    supplierName={supplier?.name ?? null}
                    bankAccountLabel={accountLabel}
                  />
                </div>
              )}
            </div>

            {/* Quick Info Card */}
            <div className="bg-gradient-to-br from-slate-50 to-blue-50/50 rounded-2xl border border-slate-200/60 p-4 space-y-3">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Quick Info
              </div>
              <div className="space-y-2 text-[11px] text-slate-500">
                <div className="flex items-start gap-2">
                  <Info size={11} className="text-slate-400 mt-0.5 shrink-0" />
                  <span>
                    Creating this PO records the <strong>financial</strong>{" "}
                    commitment (vouchers, payable). Stock is{" "}
                    <strong>not</strong> updated until you use the{" "}
                    <strong>Receive</strong> action on the PO detail page.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <Warehouse
                    size={11}
                    className="text-slate-400 mt-0.5 shrink-0"
                  />
                  <span>
                    Warehouse / rack / row / shelf are assigned during{" "}
                    <strong>receiving</strong>, not at order time — the same
                    product can be split across multiple warehouses later.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <Info size={11} className="text-slate-400 mt-0.5 shrink-0" />
                  <span>
                    MRP Price is the regular/list price shown crossed-out on
                    the product page; Sell Price is the actual price the
                    customer pays and can never exceed MRP.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <Percent
                    size={11}
                    className="text-slate-400 mt-0.5 shrink-0"
                  />
                  <span>
                    VAT is <strong>off by default</strong>. Turn it on to
                    either auto-calculate a blended rate from each item's
                    product tax rate, or type your own manual rate.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <Wallet size={11} className="text-slate-400 mt-0.5 shrink-0" />
                  <span>
                    The <strong>Account</strong> dropdown only shows accounts
                    matching your selected <strong>Method</strong> — e.g.
                    Mobile Banking only lists your Bkash/Nagad/Rocket wallets.
                    Add more from Settings → Payment Accounts.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <Info size={11} className="text-slate-400 mt-0.5 shrink-0" />
                  <span>
                    <kbd className="bg-white text-slate-500 px-1 py-0.5 rounded text-[10px] font-mono border border-slate-200">
                      F2
                    </kbd>{" "}
                    to open product picker ·{" "}
                    <kbd className="bg-white text-slate-500 px-1 py-0.5 rounded text-[10px] font-mono border border-slate-200">
                      Ctrl+S
                    </kbd>{" "}
                    to save
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <History
                    size={11}
                    className="text-slate-400 mt-0.5 shrink-0"
                  />
                  <span>
                    Your progress is saved automatically on this device — if
                    your session expires mid-entry, you'll be offered the
                    chance to restore it next time you open this page.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── 6. Status Badges (Full Width) ── */}
          {supplier && items.length > 0 && (
            <div className="bg-white rounded-2xl border border-blue-100 shadow-sm shadow-blue-50 p-4 space-y-2">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Will Be Created As
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-blue-50 text-blue-600 border border-blue-200 rounded-lg px-2.5 py-1.5">
                  <FileText size={10} />
                  Receiving: CONFIRMED
                </span>
                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-semibold border rounded-lg px-2.5 py-1.5 ${
                    dueAmount <= 0
                      ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                      : paidNum > 0
                        ? "bg-amber-50 text-amber-600 border-amber-200"
                        : "bg-slate-50 text-slate-500 border-slate-200"
                  }`}
                >
                  <CreditCard size={10} />
                  Payment:{" "}
                  {dueAmount <= 0
                    ? "PAID"
                    : paidNum > 0
                      ? "PARTIALLY_PAID"
                      : "UNPAID"}
                </span>
                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-semibold border rounded-lg px-2.5 py-1.5 ${
                    applyVat
                      ? "bg-purple-50 text-purple-600 border-purple-200"
                      : "bg-slate-50 text-slate-500 border-slate-200"
                  }`}
                >
                  <Percent size={10} />
                  VAT:{" "}
                  {applyVat
                    ? `${(effectiveVatRate * 100).toFixed(1)}%`
                    : "None"}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Product Picker Modal ── */}
      <ProductPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        selectedVariantIds={selectedVariantIds}
        onToggleVariant={handleToggleVariant}
        onToggleProduct={handleToggleProduct}
        warehouses={warehouseFilterOptions}
      />
    </div>
  );
}