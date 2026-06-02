"use client";

import { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";
import {
  Package,
  AlertTriangle,
  TrendingDown,
  BarChart3,
  Search,
  Filter,
  RefreshCw,
  ArrowUpDown,
  Warehouse,
  DollarSign,
  ShieldAlert,
  ChevronRight,
  Building2,
  X,
  Plus,
  Minus,
  ArrowLeftRight,
  Trash2,
  Tag,
  ChevronDown,
  ChevronLeft,
  Loader2,
  CheckCircle,
  Eye,
  SlidersHorizontal,
  TrendingUp,
  Activity,
  Box,
  Layers,
  MoreVertical,
} from "lucide-react";

import {
  useGetStockInventoryQuery,
  useGetStockStatsQuery,
  useGetVariantStockQuery,
  useAdjustStockMutation,
  useDamageStockMutation,
  useTransferStockMutation,
  useSellDamageStockMutation,
  type StockInventoryRow,
  type StockStatus,
} from "@/features/stockApi";
import { useGetWarehousesByVendorQuery, type Warehouse as WarehouseEntity } from "@/features/warehouseApi";

// ─── Types ────────────────────────────────────────────────────────────────────
type ModalMode = "adjust" | "damage" | "transfer" | "sell" | "detail" | null;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<
  StockStatus,
  { label: string; bg: string; text: string; dot: string; icon: React.ReactNode }
> = {
  in_stock: {
    label: "In Stock",
    bg: "bg-emerald-50 border-emerald-200",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
    icon: <CheckCircle size={11} />,
  },
  low_stock: {
    label: "Low Stock",
    bg: "bg-amber-50 border-amber-200",
    text: "text-amber-700",
    dot: "bg-amber-400",
    icon: <AlertTriangle size={11} />,
  },
  out_stock: {
    label: "Out of Stock",
    bg: "bg-rose-50 border-rose-200",
    text: "text-rose-700",
    dot: "bg-rose-500",
    icon: <X size={11} />,
  },
  overstock: {
    label: "Overstock",
    bg: "bg-blue-50 border-blue-200",
    text: "text-blue-700",
    dot: "bg-blue-500",
    icon: <TrendingUp size={11} />,
  },
};

function StatusBadge({ status }: { status: StockStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${cfg.bg} ${cfg.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon,
  accent,
  loading,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  accent: string;
  loading?: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm shadow-blue-50 relative overflow-hidden group hover:shadow-md hover:shadow-blue-100 transition-all duration-300">
      <div
        className={`absolute top-0 right-0 w-24 h-24 rounded-full -translate-y-8 translate-x-8 opacity-[0.07] ${accent}`}
      />
      <div className="flex items-start justify-between mb-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${accent} bg-opacity-10 text-white`}
        >
          {icon}
        </div>
        {loading && (
          <Loader2 size={14} className="text-slate-300 animate-spin" />
        )}
      </div>
      {loading ? (
        <div className="space-y-2">
          <div className="h-7 bg-slate-100 rounded-lg animate-pulse w-24" />
          <div className="h-3.5 bg-slate-50 rounded animate-pulse w-16" />
        </div>
      ) : (
        <>
          <div className="text-2xl font-extrabold text-slate-800 tracking-tight">
            {value}
          </div>
          <div className="text-xs text-slate-400 font-medium mt-0.5">{label}</div>
          {sub && (
            <div className="text-xs text-slate-500 mt-1.5 font-semibold">{sub}</div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Warehouse Pill (breakdown) ───────────────────────────────────────────────
function WarehousePill({ name, qty }: { name: string; qty: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-100 rounded-lg px-2 py-0.5 text-[11px] text-blue-700 font-semibold whitespace-nowrap">
      <Warehouse size={9} className="shrink-0" />
      {name.length > 12 ? name.slice(0, 12) + "…" : name}: {qty}
    </span>
  );
}

// ─── Searchable Select ────────────────────────────────────────────────────────
function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Select…",
  className = "",
}: {
  options: { value: string; label: string; sub?: string }[];
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = options.filter(
    (o) =>
      !q ||
      o.label.toLowerCase().includes(q.toLowerCase()) ||
      (o.sub || "").toLowerCase().includes(q.toLowerCase())
  );

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => { setOpen((v) => !v); setQ(""); }}
        className="w-full flex items-center justify-between bg-white border border-cyan-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition-all hover:border-cyan-300"
      >
        <span className={selected ? "text-slate-700" : "text-slate-400"}>
          {selected?.label || placeholder}
        </span>
        <ChevronDown size={13} className={`text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl shadow-slate-200/60 overflow-hidden">
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                autoFocus
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search…"
                className="w-full pl-7 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-100 rounded-lg focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-100"
              />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-3 py-3 text-xs text-slate-400 text-center italic">No results</div>
            ) : (
              filtered.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => { onChange(o.value); setOpen(false); }}
                  className={`w-full text-left px-3 py-2 flex flex-col gap-0.5 hover:bg-blue-50 transition-colors ${
                    o.value === value ? "bg-blue-50" : ""
                  }`}
                >
                  <span className={`text-xs font-semibold ${o.value === value ? "text-blue-700" : "text-slate-700"}`}>
                    {o.label}
                  </span>
                  {o.sub && <span className="text-[10px] text-slate-400">{o.sub}</span>}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── 3-dot Action Menu ────────────────────────────────────────────────────────
function ActionMenu({
  row,
  onAction,
}: {
  row: StockInventoryRow;
  onAction: (mode: ModalMode, row: StockInventoryRow) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const items = [
    {
      mode: "detail" as ModalMode,
      label: "View Detail",
      icon: <Eye size={13} />,
      cls: "text-slate-600 hover:bg-slate-50",
    },
    {
      mode: "adjust" as ModalMode,
      label: "Adjust Stock",
      icon: <Minus size={13} />,
      cls: "text-slate-600 hover:bg-slate-50",
    },
    {
      mode: "transfer" as ModalMode,
      label: "Transfer Stock",
      icon: <ArrowLeftRight size={13} />,
      cls: "text-cyan-700 hover:bg-cyan-50",
    },
    {
      mode: "damage" as ModalMode,
      label: "Mark Damaged",
      icon: <ShieldAlert size={13} />,
      cls: "text-amber-700 hover:bg-amber-50",
    },
    ...(row.damagedQty > 0
      ? [
          {
            mode: "sell" as ModalMode,
            label: `Sell Damaged (${row.damagedQty})`,
            icon: <Tag size={13} />,
            cls: "text-purple-700 hover:bg-purple-50",
            separator: true,
          },
        ]
      : []),
  ];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-600 hover:border-slate-300 transition-all"
        title="Actions"
      >
        <MoreVertical size={13} />
      </button>

      {open && (
        <div className="absolute right-0 top-8 z-50 w-48 bg-white border border-slate-200 rounded-xl shadow-xl shadow-slate-200/60 overflow-hidden">
          {items.map((item, i) => (
            <div key={item.mode}>
              {item.separator && <div className="h-px bg-slate-100 my-0.5" />}
              <button
                onClick={() => { onAction(item.mode, row); setOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold transition-colors ${item.cls}`}
              >
                {item.icon}
                {item.label}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Modal Shell ──────────────────────────────────────────────────────────────
function ModalShell({
  title,
  icon,
  onClose,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-100 animate-[modal-in_0.2s_ease]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-sm">
              {icon}
            </div>
            <span className="text-sm font-bold text-slate-700">{title}</span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full bg-white border border-cyan-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition-all placeholder-slate-300";

// ─── Adjust Modal ─────────────────────────────────────────────────────────────
function AdjustModal({
  row,
  vendorId,
  onClose,
}: {
  row: StockInventoryRow;
  vendorId: string;
  onClose: () => void;
}) {
  const whOpts = row.warehouseBreakdown.map((wb) => ({
    value: wb.warehouseId,
    label: wb.warehouseName,
    sub: `Stock: ${wb.quantity}`,
  }));
  const [warehouseId, setWarehouseId] = useState(row.warehouseBreakdown[0]?.warehouseId ?? "");
  const [qty, setQty] = useState(1);
  const [reason, setReason] = useState("");
  const [adjustStock, { isLoading }] = useAdjustStockMutation();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async () => {
    setError("");
    if (!warehouseId) return setError("Select a warehouse");
    if (qty <= 0) return setError("Quantity must be > 0");
    try {
      const res = await adjustStock({
        variantId: row.variantId,
        warehouseId,
        quantity: qty,
        reason,
        entityType: "VENDOR",
        entityId: vendorId,
      }).unwrap();
      setSuccess(`✅ Adjusted! Voucher: ${res.data.voucherNumber}`);
      setTimeout(onClose, 1800);
    } catch (e: any) {
      setError(e?.data?.message ?? "Failed to adjust stock");
    }
  };

  return (
    <ModalShell title="Stock Adjustment" icon={<Minus size={14} className="text-white" />} onClose={onClose}>
      <div className="bg-slate-50 rounded-xl px-4 py-3 mb-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-lg">📦</div>
        <div>
          <div className="text-sm font-bold text-slate-700">{row.productName}</div>
          <div className="text-xs text-slate-400">{row.variantName} · SKU: {row.sku}</div>
        </div>
        <div className="ml-auto text-right">
          <div className="text-xs text-slate-400">Current</div>
          <div className="text-lg font-extrabold text-slate-700">{row.totalStock}</div>
        </div>
      </div>

      {error && (
        <div className="mb-3 flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 text-xs text-rose-700">
          <AlertTriangle size={13} /> {error}
        </div>
      )}
      {success && (
        <div className="mb-3 flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 text-xs text-emerald-700">
          <CheckCircle size={13} /> {success}
        </div>
      )}

      <FieldRow label="Warehouse">
        <SearchableSelect
          options={whOpts}
          value={warehouseId}
          onChange={setWarehouseId}
          placeholder="Select warehouse…"
        />
      </FieldRow>

      <FieldRow label="Quantity to Deduct">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="w-9 h-9 rounded-xl border border-cyan-200 flex items-center justify-center text-slate-500 hover:bg-cyan-50 transition-colors"
          >
            <Minus size={14} />
          </button>
          <input
            type="number"
            min={1}
            value={qty}
            onChange={(e) => setQty(parseInt(e.target.value) || 1)}
            className={inputCls + " text-center font-bold text-lg"}
          />
          <button
            onClick={() => setQty((q) => q + 1)}
            className="w-9 h-9 rounded-xl border border-cyan-200 flex items-center justify-center text-slate-500 hover:bg-cyan-50 transition-colors"
          >
            <Plus size={14} />
          </button>
        </div>
      </FieldRow>

      <FieldRow label="Reason (optional)">
        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Manual count correction, write-off…"
          className={inputCls}
        />
      </FieldRow>

      <div className="flex gap-2 mt-1">
        <button onClick={onClose} className="flex-1 py-2.5 text-sm font-semibold text-slate-500 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors">
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="flex-1 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl hover:from-blue-700 hover:to-cyan-600 disabled:opacity-60 shadow-sm shadow-blue-200 transition-all flex items-center justify-center gap-2"
        >
          {isLoading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
          {isLoading ? "Saving…" : "Apply Adjustment"}
        </button>
      </div>
    </ModalShell>
  );
}

// ─── Damage Modal ─────────────────────────────────────────────────────────────
function DamageModal({
  row,
  vendorId,
  onClose,
}: {
  row: StockInventoryRow;
  vendorId: string;
  onClose: () => void;
}) {
  const whOpts = row.warehouseBreakdown.map((wb) => ({
    value: wb.warehouseId,
    label: wb.warehouseName,
    sub: `Qty: ${wb.quantity}`,
  }));
  const [warehouseId, setWarehouseId] = useState(row.warehouseBreakdown[0]?.warehouseId ?? "");
  const [qty, setQty] = useState(1);
  const [reason, setReason] = useState("");
  const [damageStock, { isLoading }] = useDamageStockMutation();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async () => {
    setError("");
    if (!warehouseId) return setError("Select a warehouse");
    if (qty <= 0) return setError("Quantity must be > 0");
    try {
      const res = await damageStock({
        variantId: row.variantId,
        warehouseId,
        quantity: qty,
        reason,
        entityType: "VENDOR",
        entityId: vendorId,
      }).unwrap();
      setSuccess(`✅ Marked damaged! Voucher: ${res.data.voucherNumber}`);
      setTimeout(onClose, 1800);
    } catch (e: any) {
      setError(e?.data?.message ?? "Failed to mark as damaged");
    }
  };

  return (
    <ModalShell title="Mark as Damaged" icon={<ShieldAlert size={14} className="text-white" />} onClose={onClose}>
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4 flex items-center gap-2 text-xs text-amber-700">
        <AlertTriangle size={13} className="shrink-0" />
        Damaged stock will be moved out of sellable inventory and expensed.
      </div>

      {error && (
        <div className="mb-3 flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 text-xs text-rose-700">
          <AlertTriangle size={13} /> {error}
        </div>
      )}
      {success && (
        <div className="mb-3 flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 text-xs text-emerald-700">
          <CheckCircle size={13} /> {success}
        </div>
      )}

      <FieldRow label="Warehouse">
        <SearchableSelect
          options={whOpts}
          value={warehouseId}
          onChange={setWarehouseId}
          placeholder="Select warehouse…"
        />
      </FieldRow>

      <FieldRow label="Damaged Quantity">
        <div className="flex items-center gap-2">
          <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="w-9 h-9 rounded-xl border border-cyan-200 flex items-center justify-center hover:bg-cyan-50 transition-colors">
            <Minus size={14} />
          </button>
          <input type="number" min={1} value={qty} onChange={(e) => setQty(parseInt(e.target.value) || 1)} className={inputCls + " text-center font-bold text-lg"} />
          <button onClick={() => setQty((q) => q + 1)} className="w-9 h-9 rounded-xl border border-cyan-200 flex items-center justify-center hover:bg-cyan-50 transition-colors">
            <Plus size={14} />
          </button>
        </div>
      </FieldRow>

      <FieldRow label="Reason">
        <input type="text" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Water damage, expired, broken…" className={inputCls} />
      </FieldRow>

      <div className="flex gap-2 mt-1">
        <button onClick={onClose} className="flex-1 py-2.5 text-sm font-semibold text-slate-500 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors">Cancel</button>
        <button onClick={handleSubmit} disabled={isLoading} className="flex-1 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl hover:from-amber-600 hover:to-orange-600 disabled:opacity-60 shadow-sm transition-all flex items-center justify-center gap-2">
          {isLoading ? <Loader2 size={14} className="animate-spin" /> : <ShieldAlert size={14} />}
          {isLoading ? "Saving…" : "Mark Damaged"}
        </button>
      </div>
    </ModalShell>
  );
}

// ─── Transfer Modal ───────────────────────────────────────────────────────────
function TransferModal({
  row,
  vendorId,
  warehouses,
  onClose,
}: {
  row: StockInventoryRow;
  vendorId: string;
  warehouses: WarehouseEntity[];
  onClose: () => void;
}) {
  // fromOpts: only warehouses where this variant has stock (from row breakdown)
  const fromOpts = row.warehouseBreakdown.map((wb) => ({
    value: wb.warehouseId,
    label: wb.warehouseName,
    sub: `Available: ${Math.max(0, wb.quantity - wb.damagedQty - wb.reservedQty)}`,
  }));

  const [fromId, setFromId] = useState(row.warehouseBreakdown[0]?.warehouseId ?? "");
  const [toId, setToId] = useState("");
  const [qty, setQty] = useState(1);
  const [reason, setReason] = useState("");
  const [transferStock, { isLoading }] = useTransferStockMutation();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // toOpts: all vendor warehouses EXCEPT the selected source
  // Prefer warehouseName from the row breakdown for consistency; fall back to API name/code
  const breakdownNameMap = Object.fromEntries(
    row.warehouseBreakdown.map((wb) => [wb.warehouseId, wb.warehouseName])
  );
  const toOpts = warehouses
    .filter((w) => w.id !== fromId)
    .map((w) => ({
      value: w.id,
      label: breakdownNameMap[w.id] ?? (w.name || w.code || "Warehouse"),
      sub: w.location
        ? [w.location.city, w.location.country].filter(Boolean).join(", ")
        : undefined,
    }));

  const fromWH = row.warehouseBreakdown.find((w) => w.warehouseId === fromId);

  const handleSubmit = async () => {
    setError("");
    if (!fromId || !toId) return setError("Select both warehouses");
    if (fromId === toId) return setError("Source and destination must differ");
    if (qty <= 0) return setError("Quantity must be > 0");
    try {
      const res = await transferStock({
        variantId: row.variantId,
        fromWarehouseId: fromId,
        toWarehouseId: toId,
        quantity: qty,
        reason,
        entityType: "VENDOR",
        entityId: vendorId,
      }).unwrap();
      setSuccess(`✅ Transferred! Voucher: ${res.data.voucherNumber}`);
      setTimeout(onClose, 1800);
    } catch (e: any) {
      setError(e?.data?.message ?? "Failed to transfer stock");
    }
  };

  return (
    <ModalShell title="Transfer Stock" icon={<ArrowLeftRight size={14} className="text-white" />} onClose={onClose}>
      {error && (
        <div className="mb-3 flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 text-xs text-rose-700">
          <AlertTriangle size={13} /> {error}
        </div>
      )}
      {success && (
        <div className="mb-3 flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 text-xs text-emerald-700">
          <CheckCircle size={13} /> {success}
        </div>
      )}

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 mb-4">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">From</label>
          <SearchableSelect
            options={fromOpts}
            value={fromId}
            onChange={(v) => { setFromId(v); setToId(""); }}
            placeholder="Select source…"
          />
        </div>
        <div className="mt-5">
          <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center">
            <ArrowLeftRight size={13} className="text-blue-500" />
          </div>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">To</label>
          {warehouses.length === 0 ? (
            <div className="w-full flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-400 bg-slate-50">
              <Loader2 size={12} className="animate-spin shrink-0" />
              Loading warehouses…
            </div>
          ) : toOpts.length === 0 ? (
            <div className="w-full flex items-center gap-2 border border-amber-200 rounded-xl px-3 py-2.5 text-xs text-amber-600 bg-amber-50">
              <AlertTriangle size={12} className="shrink-0" />
              No other warehouses available
            </div>
          ) : (
            <SearchableSelect
              options={toOpts}
              value={toId}
              onChange={setToId}
              placeholder="Select destination…"
            />
          )}
        </div>
      </div>

      {fromWH && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 mb-4 text-xs text-blue-700">
          Available in <b>{fromWH.warehouseName}</b>:{" "}
          <b>{fromWH.quantity - fromWH.damagedQty - fromWH.reservedQty}</b> units
        </div>
      )}

      <FieldRow label="Quantity">
        <div className="flex items-center gap-2">
          <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="w-9 h-9 rounded-xl border border-cyan-200 flex items-center justify-center hover:bg-cyan-50 transition-colors">
            <Minus size={14} />
          </button>
          <input type="number" min={1} value={qty} onChange={(e) => setQty(parseInt(e.target.value) || 1)} className={inputCls + " text-center font-bold text-lg"} />
          <button onClick={() => setQty((q) => q + 1)} className="w-9 h-9 rounded-xl border border-cyan-200 flex items-center justify-center hover:bg-cyan-50 transition-colors">
            <Plus size={14} />
          </button>
        </div>
      </FieldRow>

      <FieldRow label="Reason (optional)">
        <input type="text" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Rebalance inventory…" className={inputCls} />
      </FieldRow>

      <div className="flex gap-2 mt-1">
        <button onClick={onClose} className="flex-1 py-2.5 text-sm font-semibold text-slate-500 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors">Cancel</button>
        <button onClick={handleSubmit} disabled={isLoading} className="flex-1 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl hover:from-blue-700 hover:to-cyan-600 disabled:opacity-60 shadow-sm shadow-blue-200 transition-all flex items-center justify-center gap-2">
          {isLoading ? <Loader2 size={14} className="animate-spin" /> : <ArrowLeftRight size={14} />}
          {isLoading ? "Transferring…" : "Transfer Stock"}
        </button>
      </div>
    </ModalShell>
  );
}

// ─── Sell Damage Modal ────────────────────────────────────────────────────────
const COA_OPTIONS = [
  { value: "1020", label: "Cash in Hand" },
  { value: "1021", label: "BRAC Bank - Current" },
  { value: "1022", label: "Dutch Bangla Bank" },
  { value: "1023", label: "Islami Bank" },
];

function SellDamageModal({
  row,
  vendorId,
  onClose,
}: {
  row: StockInventoryRow;
  vendorId: string;
  onClose: () => void;
}) {
  // Only warehouses with damaged qty
  const damagedWarehouses = row.warehouseBreakdown.filter((wb) => wb.damagedQty > 0);
  const whOpts = damagedWarehouses.map((wb) => ({
    value: wb.warehouseId,
    label: wb.warehouseName,
    sub: `Damaged: ${wb.damagedQty}`,
  }));

  const [warehouseId, setWarehouseId] = useState(damagedWarehouses[0]?.warehouseId ?? "");
  const [qty, setQty] = useState(1);
  const [saleAmount, setSaleAmount] = useState("");
  const [receiptCoa, setReceiptCoa] = useState(COA_OPTIONS[0]?.value ?? "");
  const [sellDamage, { isLoading }] = useSellDamageStockMutation();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const wb = row.warehouseBreakdown.find((w) => w.warehouseId === warehouseId);
  const availDamaged = wb?.damagedQty ?? row.damagedQty;

  const handleSubmit = async () => {
    setError("");
    if (!warehouseId) return setError("Select a warehouse");
    if (qty <= 0) return setError("Quantity must be > 0");
    if (qty > availDamaged) return setError(`Only ${availDamaged} damaged units available`);
    if (!saleAmount || parseFloat(saleAmount) <= 0) return setError("Enter sale amount");
    if (!receiptCoa) return setError("Select receipt account");
    try {
      const res = await sellDamage({
        variantId: row.variantId,
        warehouseId,
        quantity: qty,
        saleAmount: parseFloat(saleAmount),
        receiptCoaAccountId: receiptCoa,
        entityType: "VENDOR",
        entityId: vendorId,
      }).unwrap();
      setSuccess(`✅ Sold! Voucher: ${res.data.voucherNumber}`);
      setTimeout(onClose, 1800);
    } catch (e: any) {
      setError(e?.data?.message ?? "Failed to sell damaged stock");
    }
  };

  if (damagedWarehouses.length === 0) {
    return (
      <ModalShell title="Sell Damaged Stock" icon={<Tag size={14} className="text-white" />} onClose={onClose}>
        <div className="flex flex-col items-center gap-3 py-8 text-slate-400">
          <ShieldAlert size={32} className="opacity-30" />
          <p className="text-sm">No damaged stock available to sell.</p>
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-500 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors">
            Close
          </button>
        </div>
      </ModalShell>
    );
  }

  return (
    <ModalShell title="Sell Damaged Stock" icon={<Tag size={14} className="text-white" />} onClose={onClose}>
      {/* Product + damaged summary */}
      <div className="bg-slate-50 rounded-xl px-4 py-3 mb-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
          <ShieldAlert size={16} className="text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-slate-700 truncate">{row.productName}</div>
          <div className="text-xs text-slate-400">{row.variantName} · SKU: {row.sku}</div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-xs text-slate-400">Damaged</div>
          <div className="text-xl font-extrabold text-amber-600">{availDamaged}</div>
        </div>
      </div>

      {/* Accounting preview banner */}
      <div className="bg-purple-50 border border-purple-200 rounded-xl px-4 py-3 mb-4">
        <div className="text-[10px] font-bold text-purple-500 uppercase tracking-wider mb-1.5">Accounting Preview</div>
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-5 text-center bg-purple-200 text-purple-800 rounded text-[10px] font-bold">DR</span>
              <span className="text-slate-600">
                {COA_OPTIONS.find((o) => o.value === receiptCoa)?.label ?? "Receipt Account"}
              </span>
            </div>
            <span className="font-mono font-bold text-slate-700">
              ৳{saleAmount ? parseFloat(saleAmount).toFixed(2) : "0.00"}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-5 text-center bg-emerald-200 text-emerald-800 rounded text-[10px] font-bold">CR</span>
              <span className="text-slate-600">Damage Stock Sale Income</span>
            </div>
            <span className="font-mono font-bold text-slate-700">
              ৳{saleAmount ? parseFloat(saleAmount).toFixed(2) : "0.00"}
            </span>
          </div>
        </div>
        <div className="mt-1.5 text-[10px] text-purple-500 font-semibold">✓ Auto-voucher will be posted</div>
      </div>

      {error && (
        <div className="mb-3 flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 text-xs text-rose-700">
          <AlertTriangle size={13} /> {error}
        </div>
      )}
      {success && (
        <div className="mb-3 flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 text-xs text-emerald-700">
          <CheckCircle size={13} /> {success}
        </div>
      )}

      <FieldRow label="Warehouse">
        <SearchableSelect
          options={whOpts}
          value={warehouseId}
          onChange={setWarehouseId}
          placeholder="Select warehouse…"
        />
      </FieldRow>

      <div className="grid grid-cols-2 gap-3">
        <FieldRow label="Quantity">
          <input
            type="number"
            min={1}
            max={availDamaged}
            value={qty}
            onChange={(e) => setQty(parseInt(e.target.value) || 1)}
            className={inputCls}
          />
        </FieldRow>
        <FieldRow label="Sale Amount (৳)">
          <input
            type="number"
            min={0}
            step="0.01"
            value={saleAmount}
            onChange={(e) => setSaleAmount(e.target.value)}
            placeholder="0.00"
            className={inputCls}
          />
        </FieldRow>
      </div>

      <FieldRow label="Receipt Account">
        <SearchableSelect
          options={COA_OPTIONS}
          value={receiptCoa}
          onChange={setReceiptCoa}
          placeholder="Select account…"
        />
      </FieldRow>

      <div className="flex gap-2 mt-1">
        <button onClick={onClose} className="flex-1 py-2.5 text-sm font-semibold text-slate-500 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors">Cancel</button>
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="flex-1 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-pink-500 rounded-xl hover:from-purple-700 hover:to-pink-600 disabled:opacity-60 shadow-sm transition-all flex items-center justify-center gap-2"
        >
          {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Tag size={14} />}
          {isLoading ? "Processing…" : "Confirm Sale"}
        </button>
      </div>
    </ModalShell>
  );
}

// ─── Detail Side Panel ────────────────────────────────────────────────────────
function DetailPanel({ variantId, onClose }: { variantId: string; onClose: () => void }) {
  const { data, isLoading } = useGetVariantStockQuery(variantId);
  const d = data?.data;

  const MOVE_COLORS: Record<string, string> = {
    PURCHASE_RECEIVE: "bg-emerald-100 text-emerald-700",
    ADJUSTMENT: "bg-amber-100 text-amber-700",
    DAMAGE: "bg-rose-100 text-rose-700",
    TRANSFER: "bg-blue-100 text-blue-700",
    SELL_DAMAGE: "bg-purple-100 text-purple-700",
    SALE: "bg-cyan-100 text-cyan-700",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white h-full w-full max-w-sm shadow-2xl border-l border-slate-100 overflow-y-auto flex flex-col animate-[slide-in_0.25s_ease]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
              <Activity size={14} className="text-white" />
            </div>
            <span className="text-sm font-bold text-slate-700">Stock Detail</span>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
            <X size={14} />
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-cyan-500" />
          </div>
        ) : d ? (
          <div className="p-5 flex-1">
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-4 mb-5 border border-blue-100">
              <div className="text-base font-extrabold text-slate-800">{d.variant.productName}</div>
              <div className="text-xs text-slate-500 mt-0.5 mb-3">
                {d.variant.name} · <span className="font-mono">{d.variant.sku}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Total Stock", val: d.variant.totalStock, accent: "text-blue-700" },
                  { label: "Available", val: d.variant.availableStock, accent: "text-emerald-700" },
                  { label: "Damaged", val: d.variant.damagedQty, accent: "text-amber-600" },
                  { label: "Reserved", val: d.variant.reservedQty, accent: "text-purple-600" },
                ].map((s) => (
                  <div key={s.label} className="bg-white rounded-xl p-2.5 border border-white/80">
                    <div className={`text-lg font-extrabold ${s.accent}`}>{s.val}</div>
                    <div className="text-[10px] text-slate-400 font-medium">{s.label}</div>
                  </div>
                ))}
              </div>
              {d.variant.avgCost && (
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Avg Cost</span>
                  <span className="font-bold text-slate-700">৳{d.variant.avgCost.toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="mb-5">
              <div className="flex items-center gap-1.5 mb-3">
                <Warehouse size={13} className="text-cyan-500" />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Warehouse Breakdown</span>
              </div>
              <div className="space-y-2">
                {d.warehouseBreakdown.map((wb) => (
                  <div key={wb.warehouseId} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-700">{wb.warehouseName}</span>
                      <span className="text-sm font-extrabold text-blue-600">{wb.quantity}</span>
                    </div>
                    <div className="flex gap-3 text-[10px] text-slate-400">
                      <span>Reserved: <b className="text-slate-600">{wb.reservedQty}</b></span>
                      <span>Damaged: <b className="text-amber-600">{wb.damagedQty}</b></span>
                      <span>Available: <b className="text-emerald-600">{wb.available}</b></span>
                    </div>
                    <div className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full"
                        style={{ width: `${Math.min(100, (wb.available / Math.max(wb.quantity, 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5 mb-3">
                <Activity size={13} className="text-cyan-500" />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Recent Movements</span>
              </div>
              {d.recentMovements.length === 0 ? (
                <div className="text-center py-8 text-slate-300 text-sm">No movements yet</div>
              ) : (
                <div className="space-y-2">
                  {d.recentMovements.slice(0, 10).map((mv) => (
                    <div key={mv.id} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${MOVE_COLORS[mv.movementType] ?? "bg-slate-100 text-slate-600"}`}>
                        {mv.movementType.replace("_", " ")}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-slate-600 truncate">{mv.reason ?? "—"}</div>
                        <div className="text-[10px] text-slate-400">{new Date(mv.createdAt).toLocaleDateString()}</div>
                      </div>
                      <span className="text-sm font-bold text-slate-700 shrink-0">×{mv.quantity}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-20 text-slate-400">Not found</div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function StockInventoryPage() {
  const vendorId = useSelector(
    (state: RootState) => state.auth.user?.vendorId ?? ""
  );

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StockStatus | "">("");
  const [warehouseFilter, setWarehouseFilter] = useState("");
  const [page, setPage] = useState(1);

  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [activeRow, setActiveRow] = useState<StockInventoryRow | null>(null);
  const [detailVariantId, setDetailVariantId] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 380);
    return () => clearTimeout(t);
  }, [search]);

  const { data: statsData, isLoading: statsLoading, refetch: refetchStats } =
    useGetStockStatsQuery();

  const {
    data: inventoryData,
    isLoading: inventoryLoading,
    isFetching,
    refetch: refetchInventory,
  } = useGetStockInventoryQuery({
    q: debouncedSearch || undefined,
    status: statusFilter || undefined,
    warehouseId: warehouseFilter || undefined,
    page,
    limit: 15,
  });

  const { data: warehouseData } = useGetWarehousesByVendorQuery(
    { vendorId, filters: { type: undefined } },
    { skip: !vendorId }
  );

  const stats = statsData?.data;
  const rows = inventoryData?.data ?? [];
  const pagination = inventoryData?.pagination;
  const warehouses = warehouseData?.data ?? [];

  // Build warehouse filter options from the API data
  const warehouseFilterOptions = [
    { value: "", label: "All Warehouses" },
    ...warehouses.map((w) => ({
      value: w.id,
      label: w.name || w.code || "Warehouse",
      sub: w.location
        ? [w.location.city, w.location.country].filter(Boolean).join(", ") || undefined
        : undefined,
    })),
  ];

  const statusOptions = [
    { value: "", label: "All Status" },
    { value: "in_stock", label: "In Stock" },
    { value: "low_stock", label: "Low Stock" },
    { value: "out_stock", label: "Out of Stock" },
    { value: "overstock", label: "Overstock" },
  ];

  const openModal = (mode: ModalMode, row: StockInventoryRow) => {
    setActiveRow(row);
    setModalMode(mode);
    // If mode is "detail", use the side panel instead
    if (mode === "detail") {
      setDetailVariantId(row.variantId);
      setModalMode(null);
      setActiveRow(null);
    }
  };

  const closeModal = () => {
    setModalMode(null);
    setActiveRow(null);
    refetchInventory();
    refetchStats();
  };

  const handleRefresh = () => {
    refetchInventory();
    refetchStats();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-cyan-50/10 font-sans">
      <style>{`
        @keyframes modal-in {
          from { opacity: 0; transform: scale(0.95) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes slide-in {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
      `}</style>

      {/* ── Top Bar ── */}
      <header className="bg-white/80 backdrop-blur-md border-b border-blue-100 sticky top-0 z-30 shadow-sm shadow-blue-50">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <div className="flex items-center gap-1.5 font-semibold text-cyan-600">
              <Building2 size={14} />
              <span>ERP</span>
            </div>
            <ChevronRight size={12} />
            <span className="text-slate-500">Inventory</span>
            <ChevronRight size={12} />
            <span className="font-semibold text-slate-700">Stock Inventory</span>
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-500 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
          >
            <RefreshCw size={12} className={isFetching ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </header>

      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-6">

        {/* ── Page title ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Stock Inventory</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
          {isFetching && (
            <div className="flex items-center gap-2 text-xs text-cyan-600 bg-cyan-50 border border-cyan-200 rounded-xl px-3 py-1.5">
              <Loader2 size={12} className="animate-spin" /> Syncing…
            </div>
          )}
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            label="Total Products"
            value={stats?.totalVariants ?? 0}
            sub={`${stats?.totalStock ?? 0} total units`}
            icon={<Package size={18} className="text-white" />}
            accent="bg-blue-500"
            loading={statsLoading}
          />
          <StatCard
            label="Inventory Value"
            value={stats ? `৳${stats.totalValue.toLocaleString()}` : "—"}
            sub={`৳${stats ? (stats.totalValue / Math.max(stats.totalVariants, 1)).toFixed(0) : 0} avg/product`}
            icon={<DollarSign size={18} className="text-white" />}
            accent="bg-emerald-500"
            loading={statsLoading}
          />
          <StatCard
            label="Low / Out of Stock"
            value={`${stats?.lowStockCount ?? 0} / ${stats?.outOfStockCount ?? 0}`}
            sub="Need attention"
            icon={<AlertTriangle size={18} className="text-white" />}
            accent="bg-amber-500"
            loading={statsLoading}
          />
          <StatCard
            label="Damaged Units"
            value={stats?.totalDamaged ?? 0}
            sub={`${stats?.totalReserved ?? 0} reserved`}
            icon={<ShieldAlert size={18} className="text-white" />}
            accent="bg-rose-500"
            loading={statsLoading}
          />
        </div>

        {/* ── Filters Bar ── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm shadow-blue-50 px-4 py-3 mb-4 flex flex-wrap gap-3 items-end">
          {/* Search */}
          <div className="relative flex-1 min-w-52">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Search</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by product name or SKU…"
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition-all placeholder-slate-300"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Status filter — searchable */}
          <div className="min-w-[160px]">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Status</label>
            <SearchableSelect
              options={statusOptions}
              value={statusFilter}
              onChange={(v) => { setStatusFilter(v as StockStatus | ""); setPage(1); }}
              placeholder="All Status"
            />
          </div>

          {/* Warehouse filter — searchable, from API */}
          <div className="min-w-[180px]">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Warehouse</label>
            <SearchableSelect
              options={warehouseFilterOptions}
              value={warehouseFilter}
              onChange={(v) => { setWarehouseFilter(v); setPage(1); }}
              placeholder="All Warehouses"
            />
          </div>

          {/* Clear filters */}
          {(statusFilter || warehouseFilter || search) && (
            <div className="pb-0.5">
              <button
                onClick={() => { setSearch(""); setStatusFilter(""); setWarehouseFilter(""); setPage(1); }}
                className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100 transition-colors"
              >
                <X size={12} /> Clear filters
              </button>
            </div>
          )}

          <div className="text-xs text-slate-400 ml-auto hidden sm:block self-end pb-0.5">
            {pagination ? `${pagination.total} products` : ""}
          </div>
        </div>

        {/* ── Table ── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm shadow-blue-50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="bg-gradient-to-r from-slate-50 to-blue-50/50 border-b border-slate-100">
                  {[
                    "Product",
                    "SKU",
                    "Category",
                    "Status",
                    "Total",
                    "Available",
                    "Damaged",
                    "Avg Cost",
                    "Value",
                    "Warehouses",
                    "Actions",
                  ].map((h, i) => (
                    <th
                      key={i}
                      className="text-left text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-4 py-3 whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {inventoryLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-b border-slate-50">
                      {Array.from({ length: 11 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-slate-100 rounded animate-pulse" style={{ width: `${40 + Math.random() * 50}%` }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-3 text-slate-300">
                        <Package size={40} className="opacity-40" />
                        <div className="text-sm font-medium text-slate-400">No stock records found</div>
                        <div className="text-xs text-slate-300">Try adjusting your filters</div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => {
                    const value = row.totalStock * (row.avgCost ?? 0);
                    return (
                      <tr
                        key={row.variantId}
                        className="border-b border-slate-50 hover:bg-blue-50/30 group transition-colors"
                      >
                        {/* Product */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            {row.image ? (
                              <img src={row.image} alt="" className="w-8 h-8 rounded-xl object-cover shrink-0 border border-slate-100" />
                            ) : (
                              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center shrink-0">
                                <Box size={13} className="text-blue-500" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-700 truncate max-w-[150px]">{row.productName}</div>
                              <div className="text-[10px] text-slate-400 truncate max-w-[150px]">{row.variantName}</div>
                            </div>
                          </div>
                        </td>

                        {/* SKU */}
                        <td className="px-4 py-3">
                          <span className="font-mono text-[11px] bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-lg text-slate-500">{row.sku}</span>
                        </td>

                        {/* Category */}
                        <td className="px-4 py-3">
                          <span className="text-xs text-slate-500 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-lg">{row.category ?? "—"}</span>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <StatusBadge status={row.status} />
                        </td>

                        {/* Total */}
                        <td className="px-4 py-3">
                          <span className="text-sm font-extrabold text-slate-700">{row.totalStock}</span>
                        </td>

                        {/* Available */}
                        <td className="px-4 py-3">
                          <span className={`text-sm font-bold ${row.availableStock > 0 ? "text-emerald-600" : "text-rose-500"}`}>
                            {row.availableStock}
                          </span>
                        </td>

                        {/* Damaged */}
                        <td className="px-4 py-3">
                          {row.damagedQty > 0 ? (
                            <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-lg">
                              <ShieldAlert size={10} />
                              {row.damagedQty}
                            </span>
                          ) : (
                            <span className="text-sm font-bold text-slate-300">—</span>
                          )}
                        </td>

                        {/* Avg Cost */}
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs text-slate-600">
                            ৳{(row.avgCost ?? 0).toFixed(2)}
                          </span>
                        </td>

                        {/* Value */}
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs font-bold text-blue-700">
                            ৳{value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </span>
                        </td>

                        {/* Warehouses */}
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1 max-w-[160px]">
                            {row.warehouseBreakdown.slice(0, 3).map((wb) => (
                              <WarehousePill key={wb.warehouseId} name={wb.warehouseName} qty={wb.quantity} />
                            ))}
                            {row.warehouseBreakdown.length > 3 && (
                              <span className="text-[10px] text-slate-400 font-semibold self-center">
                                +{row.warehouseBreakdown.length - 3}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Actions — 3-dot menu like ERP HTML */}
                        <td className="px-4 py-3">
                          <ActionMenu row={row} onAction={openModal} />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* ── Pagination ── */}
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/50">
              <span className="text-xs text-slate-400">
                Page <b>{pagination.page}</b> of <b>{pagination.pages}</b> · {pagination.total} products
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={pagination.page === 1}
                  className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-xl text-slate-500 disabled:opacity-40 hover:bg-slate-50 transition-colors flex items-center gap-1"
                >
                  <ChevronLeft size={12} /> Prev
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={pagination.page === pagination.pages}
                  className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-xl text-slate-500 disabled:opacity-40 hover:bg-slate-50 transition-colors flex items-center gap-1"
                >
                  Next <ChevronRight size={12} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Legend ── */}
        <div className="flex flex-wrap items-center gap-4 mt-4 px-1">
          <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Legend:</span>
          {(Object.entries(STATUS_CONFIG) as [StockStatus, typeof STATUS_CONFIG[StockStatus]][]).map(([k, v]) => (
            <span key={k} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${v.bg} ${v.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${v.dot}`} />
              {v.label}
            </span>
          ))}
          <div className="ml-auto text-[11px] text-slate-400 hidden sm:flex items-center gap-3">
            <span className="flex items-center gap-1"><MoreVertical size={11} /> Actions menu per row</span>
            <span className="flex items-center gap-1 text-purple-500 font-semibold"><Tag size={11} /> Sell damaged available when damaged &gt; 0</span>
          </div>
        </div>
      </div>

      {/* ── Modals ── */}
      {modalMode === "adjust" && activeRow && (
        <AdjustModal row={activeRow} vendorId={vendorId} onClose={closeModal} />
      )}
      {modalMode === "damage" && activeRow && (
        <DamageModal row={activeRow} vendorId={vendorId} onClose={closeModal} />
      )}
      {modalMode === "transfer" && activeRow && (
        <TransferModal row={activeRow} vendorId={vendorId} warehouses={warehouses} onClose={closeModal} />
      )}
      {modalMode === "sell" && activeRow && (
        <SellDamageModal row={activeRow} vendorId={vendorId} onClose={closeModal} />
      )}
      {detailVariantId && (
        <DetailPanel variantId={detailVariantId} onClose={() => setDetailVariantId(null)} />
      )}
    </div>
  );
}