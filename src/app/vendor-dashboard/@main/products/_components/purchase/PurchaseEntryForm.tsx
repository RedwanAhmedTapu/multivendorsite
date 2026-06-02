"use client";
import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/store"; // adjust path if your store export differs
import {
  Save, Plus, RotateCcw, AlertTriangle, ChevronRight,
  Package, Truck, CreditCard, FileText, X, Search,
  Warehouse, ChevronDown, Loader2, CheckCircle, Building2,
  Hash, Calendar, DollarSign, Layers, ShoppingCart,
} from "lucide-react";

// ─── RTK Query hooks ──────────────────────────────────────────────────────────
import { useGetNextPurchaseNumberQuery, useCreatePurchaseOrderMutation } from "@/features/purchaseOrderApi";
import { useGetSuppliersQuery } from "@/features/supplierApi";
import { useGetMyProductsQuery } from "@/features/productApi";
import { useGetWarehousesByVendorQuery } from "@/features/warehouseApi";
import {
  usePurchaseCreatedWebhookMutation,
  usePurchasePaymentWebhookMutation,
} from "@/features/accountingApi";

// ─── Types ────────────────────────────────────────────────────────────────────
interface PurchaseLineItem {
  rowId: string;
  variantId: string;
  productId: string;
  productName: string;
  variantName: string;
  sku: string;
  qty: number;
  unitCost: number;
  sellPrice: number;
  newAvgCost: number;
  total: number;
  expiry: string;
  prevStock: number;
  prevAvg: number;
  image?: string | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const PAYMENT_METHODS = ["Bank Transfer", "Cash", "Cheque", "Mobile Banking", "Card"];
const COA_OPTIONS = [
  { value: "1020", label: "Cash in Hand" },
  { value: "1021", label: "BRAC Bank - Current" },
  { value: "1022", label: "Dutch Bangla Bank" },
  { value: "1023", label: "Islami Bank" },
];
const VAT_OPTIONS = [
  { value: "0",     label: "No VAT (0%)" },
  { value: "0.05",  label: "VAT 5%" },
  { value: "0.075", label: "VAT 7.5%" },
  { value: "0.1",   label: "VAT 10%" },
  { value: "0.15",  label: "VAT 15%" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function weightedAvgCost(
  prevStock: number,
  prevAvg: number,
  newQty: number,
  newCost: number,
) {
  const total = prevStock + newQty;
  if (total === 0) return newCost;
  return (prevStock * prevAvg + newQty * newCost) / total;
}

function toWords(n: number): string {
  if (!n || isNaN(n)) return "Zero Taka Only";
  const ones = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen",
  ];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  function hw(x: number): string {
    if (x < 20) return ones[x];
    if (x < 100) return tens[Math.floor(x / 10)] + (ones[x % 10] ? " " + ones[x % 10] : "");
    return ones[Math.floor(x / 100)] + " Hundred" + (x % 100 ? " " + hw(x % 100) : "");
  }
  return hw(Math.floor(n)) + " Taka Only";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

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
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full appearance-none bg-white border border-cyan-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 pr-8 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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

function InputField({
  label,
  required,
  children,
  icon,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
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
    // position:relative on a NON-overflow-hidden parent — dropdown escapes fine
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
        // z-[200] so it renders above sibling cards; position:absolute escapes
        // only if NO ancestor has overflow:hidden — we've removed that from all
        // parent cards below.
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
                  <div className="text-sm font-semibold text-slate-700">{s.name}</div>
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

// ─── Product Picker Modal ─────────────────────────────────────────────────────
function ProductPickerModal({
  open,
  onClose,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (product: any, variant: any) => void;
}) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isFetching } = useGetMyProductsQuery(
    { search: search || undefined, page, limit: 8, status: "ACTIVE" },
    { skip: !open },
  );

  const products = data?.products ?? [];
  const pagination = data?.pagination;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col border border-cyan-100">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500 flex items-center justify-center">
              <Package size={16} className="text-white" />
            </div>
            <span className="font-bold text-slate-700">Add Product</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-slate-100">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400"
            />
            <input
              autoFocus
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by name or SKU..."
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 border border-cyan-100 rounded-xl focus:outline-none focus:border-cyan-300 focus:ring-2 focus:ring-cyan-50"
            />
          </div>
        </div>

        {/* Products */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {isFetching ? (
            <div className="flex items-center justify-center py-12 gap-2 text-cyan-500">
              <Loader2 size={20} className="animate-spin" />
              <span className="text-sm font-medium">Loading products...</span>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Package size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No products found</p>
            </div>
          ) : (
            products.map((product: any) => (
              <div
                key={product.id}
                className="border border-slate-100 rounded-xl overflow-hidden"
              >
                <div className="px-3 py-2 bg-slate-50 flex items-center gap-2">
                  {product.images?.[0]?.url ? (
                    <img
                      src={product.images[0].url}
                      alt=""
                      className="w-6 h-6 rounded object-cover"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded bg-cyan-100 flex items-center justify-center">
                      <Package size={12} className="text-cyan-500" />
                    </div>
                  )}
                  <span className="text-xs font-bold text-slate-600 truncate">
                    {product.name}
                  </span>
                  <span className="text-xs text-slate-400 ml-auto shrink-0">
                    {product.category?.name}
                  </span>
                </div>
                {product.variants?.map((variant: any) => {
                  const warehouseTotal =
                    variant.warehouseStock?.reduce(
                      (s: number, ws: any) => s + (ws.quantity ?? 0),
                      0,
                    ) ??
                    variant.stock ??
                    0;
                  return (
                    <button
                      key={variant.id}
                      onClick={() => {
                        onAdd(product, variant);
                        onClose();
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-cyan-50 text-left transition-colors border-t border-slate-50 group"
                    >
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-slate-700 font-medium group-hover:text-cyan-700">
                          {variant.name || "Default"}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-slate-400 font-mono">
                            {variant.sku}
                          </span>
                          <span className="text-xs text-slate-300">·</span>
                          <span className="text-xs text-slate-400">
                            Stock:{" "}
                            <span
                              className={`font-semibold ${
                                warehouseTotal < (variant.reorderLevel ?? 5)
                                  ? "text-rose-500"
                                  : "text-emerald-600"
                              }`}
                            >
                              {warehouseTotal}
                            </span>
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-bold text-slate-700">
                          ৳{variant.price?.toFixed(2)}
                        </div>
                        {variant.avgCost > 0 && (
                          <div className="text-xs text-slate-400">
                            avg ৳{variant.avgCost?.toFixed(2)}
                          </div>
                        )}
                      </div>
                      <Plus
                        size={14}
                        className="text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                      />
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <span className="text-xs text-slate-400">{pagination.total} products</span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={!pagination.hasPrev}
                className="px-3 py-1.5 text-xs bg-cyan-50 text-cyan-600 rounded-lg disabled:opacity-40 hover:bg-cyan-100 transition-colors"
              >
                Prev
              </button>
              <span className="px-3 py-1.5 text-xs text-slate-500">
                {page} / {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={!pagination.hasNext}
                className="px-3 py-1.5 text-xs bg-cyan-50 text-cyan-600 rounded-lg disabled:opacity-40 hover:bg-cyan-100 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Line Items Table ─────────────────────────────────────────────────────────
function LineItemRow({
  item,
  onChange,
  onRemove,
}: {
  item: PurchaseLineItem;
  onChange: (id: string, field: string, val: any) => void;
  onRemove: (id: string) => void;
}) {
  const numInput = (field: string, val: number, placeholder = "0") => (
    <input
      type="number"
      min={0}
      step="0.01"
      value={val || ""}
      onChange={(e) =>
        onChange(item.rowId, field, parseFloat(e.target.value) || 0)
      }
      placeholder={placeholder}
      className="w-full bg-white border border-cyan-100 rounded-lg px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-100 text-right transition-all"
    />
  );

  return (
    <tr className="border-b border-slate-50 hover:bg-blue-50/30 group transition-colors">
      <td className="px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-100 to-blue-100 flex items-center justify-center shrink-0">
            <Package size={13} className="text-cyan-600" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-slate-700 truncate max-w-[140px]">
              {item.productName}
            </div>
            <div className="text-xs text-slate-400 truncate max-w-[140px]">
              {item.variantName}
            </div>
          </div>
        </div>
      </td>
      <td className="px-2 py-2">
        <span className="font-mono text-xs text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded">
          {item.sku}
        </span>
      </td>
      <td className="px-2 py-2 w-16">{numInput("qty", item.qty, "1")}</td>
      <td className="px-2 py-2 w-24">{numInput("unitCost", item.unitCost, "Cost")}</td>
      <td className="px-2 py-2 w-28">
        <input
          type="date"
          value={item.expiry}
          onChange={(e) => onChange(item.rowId, "expiry", e.target.value)}
          className="w-full bg-white border border-cyan-100 rounded-lg px-2 py-1.5 text-xs text-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-100 transition-all"
        />
      </td>
      <td className="px-2 py-2 w-24">
        <div
          className={`text-xs font-mono text-right px-2 py-1.5 rounded-lg ${
            item.newAvgCost > 0
              ? "bg-amber-50 text-amber-700 font-semibold"
              : "text-slate-400"
          }`}
        >
          {item.newAvgCost > 0 ? `৳${item.newAvgCost.toFixed(2)}` : "—"}
        </div>
      </td>
      <td className="px-2 py-2 w-24">{numInput("sellPrice", item.sellPrice, "Price")}</td>
      <td className="px-2 py-2 w-24 text-right">
        <span className="text-sm font-bold text-slate-700 font-mono">
          ৳{item.total.toFixed(2)}
        </span>
      </td>
      <td className="px-2 py-2 w-8 text-center">
        <button
          onClick={() => onRemove(item.rowId)}
          className="w-6 h-6 flex items-center justify-center rounded-md text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100"
        >
          <X size={13} />
        </button>
      </td>
    </tr>
  );
}

// ─── Accounting Preview ───────────────────────────────────────────────────────
function AccountingPreview({
  subtotal,
  vatRate,
  vatLabel,
  paidAmount,
  poNumber,
  supplierName,
  bankLabel,
}: {
  subtotal: number;
  vatRate: number;
  vatLabel: string;
  paidAmount: number;
  poNumber: string;
  supplierName: string | null;
  bankLabel: string;
}) {
  const vat = parseFloat((subtotal * vatRate).toFixed(2));
  const grand = subtotal + vat;

  const entries = [
    { account: "Inventory / Stock", dr: grand, cr: 0, note: "Goods received" },
    ...(vatRate > 0
      ? [{ account: "VAT Input Account", dr: vat, cr: 0, note: vatLabel }]
      : []),
    {
      account: supplierName ? `AP – ${supplierName}` : "Accounts Payable",
      dr: 0,
      cr: grand,
      note: "Supplier liability",
    },
    ...(paidAmount > 0
      ? [
          {
            account: bankLabel,
            dr: 0,
            cr: paidAmount,
            note: "Payment made",
          },
          {
            account: supplierName ? `AP – ${supplierName}` : "Accounts Payable",
            dr: paidAmount,
            cr: 0,
            note: "AP cleared",
          },
        ]
      : []),
  ];

  return (
    <div className="bg-white border border-cyan-100 rounded-2xl overflow-hidden">
      <div className="px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 flex items-center gap-2">
        <Layers size={14} className="text-white/80" />
        <span className="text-xs font-bold text-white uppercase tracking-wider">
          Journal Preview
        </span>
      </div>
      <div className="p-3">
        <div className="text-xs text-slate-400 mb-2 font-mono">{poNumber}</div>
        <div className="space-y-1">
          {entries.map((e, i) => (
            <div
              key={i}
              className="flex items-center gap-2 text-xs py-1 border-b border-slate-50 last:border-0"
            >
              <span className="flex-1 text-slate-600 truncate">{e.account}</span>
              <span
                className={`font-mono w-20 text-right font-semibold ${
                  e.dr > 0 ? "text-blue-600" : "text-slate-300"
                }`}
              >
                {e.dr > 0 ? `৳${e.dr.toFixed(0)}` : "—"}
              </span>
              <span
                className={`font-mono w-20 text-right font-semibold ${
                  e.cr > 0 ? "text-cyan-600" : "text-slate-300"
                }`}
              >
                {e.cr > 0 ? `৳${e.cr.toFixed(0)}` : "—"}
              </span>
            </div>
          ))}
        </div>
        <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-200">
          <span className="text-xs font-bold text-slate-500">Total</span>
          <span className="text-xs font-bold font-mono text-blue-600">
            ৳{grand.toFixed(0)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Main Form ────────────────────────────────────────────────────────────────
export default function PurchaseEntryForm() {
  // ── RTK Query ──────────────────────────────────────────────────────────────
  const { data: nextPoData } = useGetNextPurchaseNumberQuery();
  const [createPurchaseOrder, { isLoading: isSaving }] = useCreatePurchaseOrderMutation();
  const [purchaseCreatedWebhook] = usePurchaseCreatedWebhookMutation();
  const [purchasePaymentWebhook] = usePurchasePaymentWebhookMutation();

  // Pull vendorId from the auth slice — same pattern used everywhere in your app
  const vendorId = useSelector((state: RootState) => state.auth.user?.vendorId ?? "");

  const {
    data: warehouseData,
    isLoading: warehousesLoading,
  } = useGetWarehousesByVendorQuery(
    { vendorId, filters: { type: undefined } },
    { skip: !vendorId },
  );
  const warehouses = warehouseData?.data ?? [];
  const warehouseOptions = warehouses.map((w) => ({
    value: w.id,
    label: [w.name, w.location?.city].filter(Boolean).join(" — ") || w.code || w.id,
  }));

  // ── Form state ─────────────────────────────────────────────────────────────
  const [poNumber, setPoNumber]                     = useState("PUR-2025-0001");
  const [purchaseDate, setPurchaseDate]             = useState(() => new Date().toISOString().slice(0, 10));
  const [warehouseId, setWarehouseId]               = useState("");
  const [supplier, setSupplier]                     = useState<any | null>(null);
  const [supplierInvoiceNo, setSupplierInvoiceNo]   = useState("");
  const [items, setItems]                           = useState<PurchaseLineItem[]>([]);
  const [paidAmount, setPaidAmount]                 = useState("");
  const [paymentMethod, setPaymentMethod]           = useState("Bank Transfer");
  const [coaPayAccount, setCoaPayAccount]           = useState("1020");
  const [vatRate, setVatRate]                       = useState("0");
  const [payRef, setPayRef]                         = useState("");
  const [notes, setNotes]                           = useState("");
  const [pickerOpen, setPickerOpen]                 = useState(false);
  const [saveError, setSaveError]                   = useState("");
  const [saveSuccess, setSaveSuccess]               = useState("");

  // Set first warehouse as default once loaded
  useEffect(() => {
    if (warehouses.length > 0 && !warehouseId) {
      const defaultWarehouse = warehouses.find((w) => w.isDefault) ?? warehouses[0];
      setWarehouseId(defaultWarehouse.id);
    }
  }, [warehouses, warehouseId]);

  // Sync PO number
  useEffect(() => {
    if (nextPoData?.data?.purchaseNo) setPoNumber(nextPoData.data.purchaseNo);
  }, [nextPoData]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "F2") { e.preventDefault(); setPickerOpen(true); }
      if (e.ctrlKey && e.key === "s") { e.preventDefault(); handleSave(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, supplier, paidAmount, vatRate, coaPayAccount]);

  // ── Financials ─────────────────────────────────────────────────────────────
  const subtotal   = items.reduce((s, i) => s + i.total, 0);
  const vatRateNum = parseFloat(vatRate) || 0;
  const vat        = parseFloat((subtotal * vatRateNum).toFixed(2));
  const grandTotal = subtotal + vat;
  const paidNum    = parseFloat(paidAmount) || 0;
  const dueAmount  = Math.max(0, grandTotal - paidNum);

  const bankLabel = COA_OPTIONS.find((o) => o.value === coaPayAccount)?.label || "Bank Account";
  const vatLabel  = VAT_OPTIONS.find((o) => o.value === vatRate)?.label || "No VAT";

  // ── Item management ────────────────────────────────────────────────────────
  const handleAddItem = useCallback((product: any, variant: any) => {
    const warehouseTotal =
      variant.warehouseStock?.reduce(
        (s: number, ws: any) => s + (ws.quantity ?? 0),
        0,
      ) ??
      variant.stock ??
      0;

    setItems((prev) => {
      const exists = prev.find((i) => i.variantId === variant.id);
      if (exists) {
        return prev.map((i) =>
          i.variantId === variant.id
            ? { ...i, qty: i.qty + 1, total: (i.qty + 1) * i.unitCost }
            : i,
        );
      }
      return [
        ...prev,
        {
          rowId: `row-${Date.now()}`,
          variantId: variant.id,
          productId: product.id,
          productName: product.name,
          variantName: variant.name || "Default",
          sku: variant.sku,
          qty: 1,
          unitCost: 0,
          sellPrice: variant.price ?? 0,
          newAvgCost: 0,
          total: 0,
          expiry: "",
          prevStock: warehouseTotal,
          prevAvg: variant.avgCost ?? 0,
          image: product.images?.[0]?.url ?? null,
        },
      ];
    });
  }, []);

  const handleItemChange = (id: string, field: string, val: any) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.rowId !== id) return item;
        const updated = { ...item, [field]: val };
        if (field === "qty" || field === "unitCost") {
          updated.total = updated.qty * updated.unitCost;
          updated.newAvgCost =
            updated.unitCost > 0
              ? weightedAvgCost(item.prevStock, item.prevAvg, updated.qty, updated.unitCost)
              : 0;
        }
        return updated;
      }),
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
    setVatRate("0");
    setCoaPayAccount("1020");
    setPaymentMethod("Bank Transfer");
    setPurchaseDate(new Date().toISOString().slice(0, 10));
    setSaveError("");
    setSaveSuccess("");
    // Keep warehouseId — user likely stays at the same warehouse
  };

  // ── Save ───────────────────────────────────────────────────────────────────
 const handleSave = async () => {
  setSaveError("");
  setSaveSuccess("");
 
  // ── Validation ──────────────────────────────────────────────────────────────
  if (!supplier)     { setSaveError("Please select a supplier.");  return; }
  if (!warehouseId)  { setSaveError("Please select a warehouse."); return; }
  if (!items.length) { setSaveError("Add at least one item.");     return; }
  if (items.some((i) => !i.unitCost || i.unitCost <= 0)) {
    setSaveError("Enter unit cost for all items.");
    return;
  }
 
  const belowAvg = items.filter(
    (i) => i.sellPrice > 0 && i.newAvgCost > 0 && i.sellPrice < i.newAvgCost,
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
    // ── Single API call — purchaseService handles everything atomically ──────
    //   ✅ PurchaseOrder + PurchaseOrderItems
    //   ✅ WarehouseStock upsert
    //   ✅ ProductVariant avgCost + stock update
    //   ✅ StockMovement (PURCHASE_RECEIVE)
    //   ✅ PURCHASE voucher  DR Inventory(1200) + DR VAT(1410) → CR AP(2000)
    //   ✅ PAYMENT  voucher  DR AP(2000) → CR Bank(1010)  [only if paidAmount > 0]
    //   ✅ PurchasePayment record
    //
    // ❌ DO NOT call purchaseCreatedWebhook or purchasePaymentWebhook here.
    //    Those go through AccountingService.getAccountId() which looks up by
    //    NAME and will throw "Inventory not found" because the service uses
    //    a different name convention than STANDARD_COA in purchaseService.ts.
 
   // In PurchaseEntryForm.tsx — add this alongside vendorId:

// Then in handleSave, add entityId to the createPurchaseOrder call:
const result = await createPurchaseOrder({
  purchaseDate,
  supplierId:          supplier.id,
  warehouseId,
  supplierInvoiceNo:   supplierInvoiceNo || undefined,
  vatRate:             vatRateNum        || undefined,
  paymentCoaAccountId: paidNum > 0 ? coaPayAccount : undefined,
  vatCoaAccountId:     vatRateNum > 0 ? "1410"      : undefined,
  paidAmount:          paidNum    || undefined,
  paymentMethod:       paidNum > 0 ? paymentMethod : undefined,
  paymentReference:    payRef     || undefined,
  notes:               notes      || undefined,
  entityType:          "VENDOR" as const,
  entityId:            vendorId,    // ← ADD THIS — was missing entirely
  items: items.map((i) => ({
    variantId:   i.variantId,
    productName: i.productName,
    variantName: i.variantName,
    sku:         i.sku,
    quantity:    i.qty,
    unitCost:    i.unitCost,
    sellPrice:   i.sellPrice,
    expiryDate:  i.expiry || null,
  })),
}).unwrap();
 
    // Build success message including the auto-posted voucher numbers
    const poNo = result.data?.purchaseNo ?? poNumber;
    const voucherNos = (result.data?.vouchers ?? [])
      .map((v: any) => v.voucherNumber)
      .filter(Boolean)
      .join(", ");
 
    setSaveSuccess(
      `✅ ${poNo} saved successfully!${voucherNos ? `  Vouchers posted: ${voucherNos}` : ""}`,
    );
    handleReset();
 
  } catch (err: any) {
    // purchaseService throws descriptive messages — surface them directly
    const msg =
      err?.data?.message ??
      err?.message ??
      "Failed to save purchase order. Please try again.";
    setSaveError(msg);
  }
};

  // ── Derived ────────────────────────────────────────────────────────────────
  const selectedWarehouse = warehouses.find((w) => w.id === warehouseId);

  // ── JSX ────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/20 font-sans text-slate-800">

      {/* ── Top Navigation Bar ── */}
      <header className="bg-white/80 backdrop-blur-md border-b border-blue-100 sticky top-0 z-40 shadow-sm shadow-blue-50">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          {/* Breadcrumb */}
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

          {/* Actions */}
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

      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-5 sm:py-7">

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
            <span>{saveError}</span>
            <button
              onClick={() => setSaveError("")}
              className="ml-auto text-rose-400 hover:text-rose-600"
            >
              <X size={13} />
            </button>
          </div>
        )}
        {saveSuccess && (
          <div className="mb-4 flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-700">
            <CheckCircle size={15} className="shrink-0" />
            <span>{saveSuccess}</span>
            <button
              onClick={() => setSaveSuccess("")}
              className="ml-auto text-emerald-400 hover:text-emerald-600"
            >
              <X size={13} />
            </button>
          </div>
        )}

        {/* ── Main Grid ── */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-5">

          {/* LEFT COLUMN */}
          <div className="flex flex-col gap-5">

            {/* Purchase Details Card
                ─────────────────────────────────────────────────────────────
                CRITICAL: Do NOT add overflow-hidden here. The SupplierSearch
                dropdown is position:absolute and must escape this container.
                Border-radius on the card itself is fine — overflow-hidden is
                what clips the dropdown.
                ───────────────────────────────────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-blue-100 shadow-sm shadow-blue-50">
              {/* Card header — rounded top corners via the parent's border-radius */}
              <div className="px-5 py-4 border-b border-blue-50 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-sm">
                  <FileText size={15} className="text-white" />
                </div>
                <span className="text-sm font-bold text-slate-700">Purchase Details</span>
              </div>

              <div className="p-5">
                {/* Row 1: Date · PO · Warehouse */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                  <InputField label="Date" required icon={<Calendar size={11} />}>
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
                      className={inputClass("bg-slate-50 text-slate-400 cursor-not-allowed font-mono")}
                    />
                  </InputField>

                  <InputField label="Warehouse" required icon={<Warehouse size={11} />}>
                    {warehousesLoading ? (
                      <div className="flex items-center gap-2 border border-cyan-200 rounded-xl px-3 py-2.5 text-sm text-slate-400 bg-slate-50">
                        <Loader2 size={14} className="animate-spin text-cyan-400" />
                        Loading warehouses...
                      </div>
                    ) : (
                      <SelectBox
                        options={warehouseOptions}
                        value={warehouseId}
                        onChange={setWarehouseId}
                        placeholder={warehouses.length === 0 ? "No warehouses found" : "Select warehouse..."}
                        disabled={warehouses.length === 0}
                      />
                    )}
                  </InputField>
                </div>

                {/* Warehouse info badge — shown when a warehouse is selected */}
                {selectedWarehouse && (
                  <div className="mb-5 flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 text-xs text-blue-700">
                    <Warehouse size={12} className="shrink-0 text-blue-500" />
                    <span className="font-semibold">{selectedWarehouse.name ?? selectedWarehouse.code}</span>
                    {selectedWarehouse.location && (
                      <>
                        <span className="text-blue-300">·</span>
                        <span className="text-blue-500">
                          {[
                            selectedWarehouse.location.address,
                            selectedWarehouse.location.city,
                          ]
                            .filter(Boolean)
                            .join(", ")}
                        </span>
                      </>
                    )}
                    {selectedWarehouse.isDefault && (
                      <span className="ml-auto bg-blue-100 text-blue-600 rounded-md px-2 py-0.5 font-semibold">
                        Default
                      </span>
                    )}
                  </div>
                )}

                <div className="h-px bg-gradient-to-r from-transparent via-blue-100 to-transparent mb-5" />

                {/* Supplier section */}
                <div>
                  <div className="flex items-center gap-1.5 mb-3">
                    <Truck size={13} className="text-cyan-500" />
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                      Supplier Information
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Supplier search — the dropdown is position:absolute and
                        needs a non-overflow-hidden ancestor, which we now have. */}
                    <InputField label="Search Supplier" required icon={<Search size={11} />}>
                      <SupplierSearchDropdown selected={supplier} onSelect={setSupplier} />
                    </InputField>

                    <InputField label="Supplier Invoice No" icon={<Hash size={11} />}>
                      <input
                        type="text"
                        value={supplierInvoiceNo}
                        onChange={(e) => setSupplierInvoiceNo(e.target.value)}
                        placeholder="INV-2025-..."
                        className={inputClass()}
                      />
                    </InputField>
                  </div>
                </div>

                {/* Supplier info card — shown inline below the search fields,
                    NOT inside a dropdown so it never gets clipped */}
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
                            Outstanding: ৳{supplier.totalDue?.toFixed(2)}
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

            {/* Items Card — also no overflow-hidden needed */}
            <div className="bg-white rounded-2xl border border-blue-100 shadow-sm shadow-blue-50">
              <div className="px-5 py-4 border-b border-blue-50 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-sm">
                    <ShoppingCart size={15} className="text-white" />
                  </div>
                  <span className="text-sm font-bold text-slate-700">Purchase Items</span>
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

              {/* Table (scrollable on mobile) */}
              <div className="overflow-x-auto">
                {items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-14 text-slate-300">
                    <Package size={36} className="mb-3 opacity-40" />
                    <p className="text-sm font-medium text-slate-400">No items added yet</p>
                    <p className="text-xs text-slate-300 mt-1">
                      Press{" "}
                      <kbd className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded text-[10px] font-mono border border-slate-200">
                        F2
                      </kbd>{" "}
                      or click Add Product
                    </p>
                  </div>
                ) : (
                  <table className="w-full min-w-[700px]">
                    <thead>
                      <tr className="bg-gradient-to-r from-blue-50 to-cyan-50">
                        {[
                          "Product / Variant",
                          "SKU",
                          "Qty",
                          "Unit Cost",
                          "Expiry",
                          "New Avg",
                          "Sell Price",
                          "Total",
                          "",
                        ].map((h, i) => (
                          <th
                            key={i}
                            className="text-left text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-3 py-2.5 border-b border-blue-100 whitespace-nowrap"
                            style={i === 7 ? { textAlign: "right" } : {}}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => (
                        <LineItemRow
                          key={item.rowId}
                          item={item}
                          onChange={handleItemChange}
                          onRemove={handleRemoveItem}
                        />
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-blue-50/50 border-t border-blue-100">
                        <td
                          colSpan={7}
                          className="px-3 py-3 text-xs font-bold text-slate-500 text-right"
                        >
                          Subtotal
                        </td>
                        <td className="px-3 py-3 text-sm font-extrabold text-blue-700 text-right font-mono">
                          ৳{subtotal.toFixed(2)}
                        </td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                )}
              </div>

              {/* Shortcuts */}
              <div className="border-t border-blue-50 bg-slate-50/50 px-4 py-2 flex flex-wrap gap-3">
                {[
                  ["F2", "Add Product"],
                  ["Ctrl+S", "Save"],
                ].map(([k, l]) => (
                  <div key={k} className="flex items-center gap-1.5 text-xs text-slate-400">
                    <kbd className="bg-white border border-slate-200 rounded px-1.5 py-0.5 font-mono text-[10px] text-slate-500 shadow-sm">
                      {k}
                    </kbd>
                    <span>{l}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="bg-white rounded-2xl border border-blue-100 shadow-sm shadow-blue-50">
              <div className="px-5 py-4 border-b border-blue-50 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center">
                  <FileText size={15} className="text-white" />
                </div>
                <span className="text-sm font-bold text-slate-700">Internal Notes</span>
              </div>
              <div className="p-5">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add internal remarks, delivery instructions, or notes..."
                  rows={3}
                  className="w-full bg-slate-50 border border-cyan-100 rounded-xl px-4 py-3 text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 resize-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="flex flex-col gap-4">

            {/* Financial Summary */}
            <div className="bg-white rounded-2xl border border-blue-100 shadow-sm shadow-blue-50 sticky top-20">
              <div className="px-4 py-3.5 bg-gradient-to-r from-blue-600 to-cyan-500 flex items-center gap-2 rounded-t-2xl">
                <DollarSign size={15} className="text-white/80" />
                <span className="text-xs font-extrabold text-white uppercase tracking-widest">
                  Financial Summary
                </span>
              </div>

              <div className="p-4 space-y-3">
                {/* Totals */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Subtotal</span>
                    <span className="font-mono font-semibold text-slate-700">
                      ৳{subtotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">VAT ({vatLabel})</span>
                    <span className="font-mono font-semibold text-slate-700">
                      ৳{vat.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-blue-100">
                    <span className="text-sm font-bold text-slate-700">Grand Total</span>
                    <span className="font-mono text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
                      ৳{grandTotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="text-[10px] text-right text-slate-400 italic">
                    {toWords(grandTotal)}
                  </div>
                </div>

                <div className="h-px bg-blue-50" />

                {/* Payment inputs */}
                <div className="space-y-3">
                  <InputField label="Paid Amount" icon={<CreditCard size={11} />}>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold">
                        ৳
                      </span>
                      <input
                        type="number"
                        value={paidAmount}
                        onChange={(e) => setPaidAmount(e.target.value)}
                        placeholder="0.00"
                        min={0}
                        className={inputClass("pl-7")}
                      />
                    </div>
                  </InputField>

                  <div className="grid grid-cols-2 gap-2">
                    <InputField label="Method">
                      <SelectBox
                        options={PAYMENT_METHODS.map((m) => ({ value: m, label: m }))}
                        value={paymentMethod}
                        onChange={setPaymentMethod}
                      />
                    </InputField>
                    <InputField label="Account">
                      <SelectBox
                        options={COA_OPTIONS}
                        value={coaPayAccount}
                        onChange={setCoaPayAccount}
                      />
                    </InputField>
                  </div>

                  <InputField label="VAT Account">
                    <SelectBox
                      options={VAT_OPTIONS}
                      value={vatRate}
                      onChange={setVatRate}
                    />
                  </InputField>

                  <InputField label="Payment Ref">
                    <input
                      type="text"
                      value={payRef}
                      onChange={(e) => setPayRef(e.target.value)}
                      placeholder="TXN / Cheque No..."
                      className={inputClass()}
                    />
                  </InputField>
                </div>

                {/* Due Amount */}
                <div
                  className={`rounded-xl px-4 py-3.5 flex items-center gap-3 ${
                    dueAmount > 0
                      ? "bg-amber-50 border border-amber-200"
                      : "bg-emerald-50 border border-emerald-200"
                  }`}
                >
                  {dueAmount > 0 ? (
                    <AlertTriangle size={16} className="text-amber-500 shrink-0" />
                  ) : (
                    <CheckCircle size={16} className="text-emerald-500 shrink-0" />
                  )}
                  <div>
                    <div
                      className={`text-xs font-bold uppercase tracking-wider ${
                        dueAmount > 0 ? "text-amber-600" : "text-emerald-600"
                      }`}
                    >
                      {dueAmount > 0 ? "Amount Due" : "Fully Paid"}
                    </div>
                    <div
                      className={`font-mono text-xl font-extrabold ${
                        dueAmount > 0 ? "text-amber-700" : "text-emerald-700"
                      }`}
                    >
                      ৳{dueAmount.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-sm font-extrabold rounded-xl hover:from-blue-700 hover:to-cyan-600 disabled:opacity-60 shadow-lg shadow-blue-200 transition-all hover:shadow-xl active:scale-[0.98]"
                >
                  {isSaving ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  {isSaving ? "Saving..." : "Save Purchase Order"}
                </button>
              </div>
            </div>

            {/* Accounting Preview */}
            {(subtotal > 0 || supplier) && (
              <AccountingPreview
                subtotal={subtotal}
                vatRate={vatRateNum}
                vatLabel={vatLabel}
                paidAmount={paidNum}
                poNumber={poNumber}
                supplierName={supplier?.name ?? null}
                bankLabel={bankLabel}
              />
            )}
          </div>
        </div>
      </div>

      {/* Product Picker Modal */}
      <ProductPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onAdd={handleAddItem}
      />
    </div>
  );
}