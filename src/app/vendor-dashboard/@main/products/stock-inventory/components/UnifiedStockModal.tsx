"use client";

import { useEffect, useMemo, useState } from "react";
import { X, SlidersHorizontal, ShieldAlert, ArrowRightLeft, Loader2, AlertCircle } from "lucide-react";
import type { StockInventoryRow } from "@/features/stockApi";
import {
  useAdjustStockMutation,
  useDamageStockMutation,
  useTransferStockMutation,
} from "@/features/stockApi";
import { SearchableSelect } from "./index"; 

type TabMode = "adjust" | "damage" | "transfer";

interface UnifiedStockModalProps {
  row: StockInventoryRow;
  vendorId: string;
  warehouses: any[];
  initialMode: TabMode;
  onClose: () => void;
}

const ADJUST_REASONS = ["Physical Count Correction", "System Error", "Found Stock", "Other"];
const DAMAGE_REASONS = ["Broken", "Expired", "Water Damage", "Manufacturing Defect", "Other"];

export default function UnifiedStockModal({
  row,
  vendorId,
  warehouses,
  initialMode,
  onClose,
}: UnifiedStockModalProps) {
  const [activeTab, setActiveTab] = useState<TabMode>(initialMode);
  const [formError, setFormError] = useState<string | null>(null);

  // FIX: warehouses that actually hold stock for this variant, derived
  // from the row's own warehouseBreakdown — used to restrict Adjust/Damage
  // warehouse pickers and the Transfer "From" picker to real stock locations.
  const stockedWarehouseOptions = useMemo(
    () =>
      row.warehouseBreakdown
        .filter((wb) => wb.quantity > 0)
        .map((wb) => ({
          value: wb.warehouseId,
          label: wb.warehouseName,
          sub: `${wb.available} available`,
        })),
    [row.warehouseBreakdown],
  );

  // FIX: every warehouse the vendor has, used for the Transfer "To" picker.
  const allWarehouseOptions = useMemo(
    () =>
      warehouses.map((w) => ({
        value: w.id,
        label: w.name || w.code || "Warehouse",
        sub: w.location
          ? [w.location.city, w.location.country].filter(Boolean).join(", ") || undefined
          : undefined,
      })),
    [warehouses],
  );

  const tabs = [
    { id: "adjust" as TabMode, label: "Adjustment", icon: SlidersHorizontal },
    { id: "damage" as TabMode, label: "Damage", icon: ShieldAlert },
    { id: "transfer" as TabMode, label: "Transfer", icon: ArrowRightLeft },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
        style={{ animation: "modal-in 0.2s ease-out forwards" }}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="min-w-0">
            <h2 className="text-lg font-extrabold text-slate-800 truncate">Stock Actions</h2>
            <p className="text-xs text-slate-400 mt-0.5 truncate">
              {row.productName} – {row.variantName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs Header */}
        <div className="flex border-b border-slate-100 px-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setFormError(null);
                }}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all -mb-px ${
                  isActive
                    ? "border-cyan-500 text-cyan-600"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                <Icon size={15} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Modal Body / Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {formError && (
            <div className="mb-4 flex items-center gap-2 px-3 py-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-600">
              <AlertCircle size={14} className="shrink-0" />
              {formError}
            </div>
          )}

          {activeTab === "adjust" && (
            <AdjustForm
              row={row}
              vendorId={vendorId}
              warehouseOptions={stockedWarehouseOptions}
              onError={setFormError}
              onSuccess={onClose}
            />
          )}

          {activeTab === "damage" && (
            <DamageForm
              row={row}
              vendorId={vendorId}
              warehouseOptions={stockedWarehouseOptions}
              onError={setFormError}
              onSuccess={onClose}
            />
          )}

          {activeTab === "transfer" && (
            <TransferForm
              row={row}
              vendorId={vendorId}
              fromWarehouseOptions={stockedWarehouseOptions}
              allWarehouseOptions={allWarehouseOptions}
              onError={setFormError}
              onSuccess={onClose}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ==================== ADJUST TAB ==================== */

function AdjustForm({
  row,
  vendorId,
  warehouseOptions,
  onError,
  onSuccess,
}: {
  row: StockInventoryRow;
  vendorId: string;
  warehouseOptions: { value: string; label: string; sub?: string }[];
  onError: (msg: string | null) => void;
  onSuccess: () => void;
}) {
  const [adjustStock, { isLoading }] = useAdjustStockMutation();

  const [warehouseId, setWarehouseId] = useState(warehouseOptions[0]?.value ?? "");
  const [direction, setDirection] = useState<"add" | "deduct">("deduct");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState(ADJUST_REASONS[0]);
  const [notes, setNotes] = useState("");

  const selectedWarehouse = row.warehouseBreakdown.find((wb) => wb.warehouseId === warehouseId);

  const handleSubmit = async () => {
    onError(null);
    const qty = Number(quantity);

    if (!warehouseId) return onError("Select a warehouse.");
    if (!qty || qty <= 0) return onError("Enter a quantity greater than 0.");
    if (direction === "deduct" && selectedWarehouse && qty > selectedWarehouse.available) {
      return onError(`Only ${selectedWarehouse.available} units available to deduct.`);
    }

    try {
      await adjustStock({
        variantId: row.variantId,
        warehouseId,
        quantity: direction === "deduct" ? -qty : qty,
        reason,
        notes: notes || undefined,
        entityType: "VENDOR",
        entityId: vendorId,
      }).unwrap();
      onSuccess();
    } catch (err: any) {
      onError(err?.data?.message || "Failed to adjust stock. Please try again.");
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
          Warehouse
        </label>
        <SearchableSelect
          options={warehouseOptions}
          value={warehouseId}
          onChange={setWarehouseId}
          placeholder="Select warehouse"
        />
        {selectedWarehouse && (
          <p className="text-[11px] text-slate-400 mt-1">
            {selectedWarehouse.available} available in this warehouse
          </p>
        )}
      </div>

      <div className="grid grid-cols-[110px_1fr] gap-3">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Direction
          </label>
          <select
            value={direction}
            onChange={(e) => setDirection(e.target.value as "add" | "deduct")}
            className="w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-cyan-400"
          >
            <option value="deduct">Deduct</option>
            <option value="add">Add</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Quantity
          </label>
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="0"
            className="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
          Reason
        </label>
        <select
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-cyan-400"
        >
          {ADJUST_REASONS.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
          Notes
        </label>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Write notes here..."
          className="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
        />
      </div>

      <FormFooter isLoading={isLoading} onSubmit={handleSubmit} />
    </div>
  );
}

/* ==================== DAMAGE TAB ==================== */

function DamageForm({
  row,
  vendorId,
  warehouseOptions,
  onError,
  onSuccess,
}: {
  row: StockInventoryRow;
  vendorId: string;
  warehouseOptions: { value: string; label: string; sub?: string }[];
  onError: (msg: string | null) => void;
  onSuccess: () => void;
}) {
  const [damageStock, { isLoading }] = useDamageStockMutation();

  const [warehouseId, setWarehouseId] = useState(warehouseOptions[0]?.value ?? "");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState(DAMAGE_REASONS[0]);
  const [notes, setNotes] = useState("");

  const selectedWarehouse = row.warehouseBreakdown.find((wb) => wb.warehouseId === warehouseId);

  const handleSubmit = async () => {
    onError(null);
    const qty = Number(quantity);

    if (!warehouseId) return onError("Select a warehouse.");
    if (!qty || qty <= 0) return onError("Enter a quantity greater than 0.");
    if (selectedWarehouse && qty > selectedWarehouse.available) {
      return onError(`Only ${selectedWarehouse.available} units available to mark as damaged.`);
    }

    try {
      await damageStock({
        variantId: row.variantId,
        warehouseId,
        quantity: qty,
        reason,
        notes: notes || undefined,
        entityType: "VENDOR",
        entityId: vendorId,
      }).unwrap();
      onSuccess();
    } catch (err: any) {
      onError(err?.data?.message || "Failed to record damaged stock. Please try again.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-sm text-rose-600 flex items-center gap-2">
        <ShieldAlert size={16} className="shrink-0" />
        Marking stock as damaged will remove it from available inventory.
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
          Warehouse
        </label>
        <SearchableSelect
          options={warehouseOptions}
          value={warehouseId}
          onChange={setWarehouseId}
          placeholder="Select warehouse"
        />
        {selectedWarehouse && (
          <p className="text-[11px] text-slate-400 mt-1">
            {selectedWarehouse.available} available in this warehouse
          </p>
        )}
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
          Damaged Quantity
        </label>
        <input
          type="number"
          min={1}
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="0"
          className="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
          Damage Reason
        </label>
        <select
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-rose-400"
        >
          {DAMAGE_REASONS.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
          Notes
        </label>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Write notes here..."
          className="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
        />
      </div>

      <FormFooter isLoading={isLoading} onSubmit={handleSubmit} tone="rose" />
    </div>
  );
}

/* ==================== TRANSFER TAB ==================== */

function TransferForm({
  row,
  vendorId,
  fromWarehouseOptions,
  allWarehouseOptions,
  onError,
  onSuccess,
}: {
  row: StockInventoryRow;
  vendorId: string;
  fromWarehouseOptions: { value: string; label: string; sub?: string }[];
  allWarehouseOptions: { value: string; label: string; sub?: string }[];
  onError: (msg: string | null) => void;
  onSuccess: () => void;
}) {
  const [transferStock, { isLoading }] = useTransferStockMutation();

  const [fromWarehouseId, setFromWarehouseId] = useState(fromWarehouseOptions[0]?.value ?? "");
  const [toWarehouseId, setToWarehouseId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  // FIX: "To" list is every warehouse except whichever one is currently
  // selected as "From" — so you can never pick the same warehouse twice.
  const toWarehouseOptions = useMemo(
    () => allWarehouseOptions.filter((w) => w.value !== fromWarehouseId),
    [allWarehouseOptions, fromWarehouseId],
  );

  // If the current "To" selection becomes invalid (e.g. it now equals the
  // newly picked "From"), clear it so the user has to re-pick.
  useEffect(() => {
    if (toWarehouseId && !toWarehouseOptions.some((w) => w.value === toWarehouseId)) {
      setToWarehouseId("");
    }
  }, [toWarehouseOptions, toWarehouseId]);

  const fromStock = row.warehouseBreakdown.find((wb) => wb.warehouseId === fromWarehouseId);

  const handleSubmit = async () => {
    onError(null);
    const qty = Number(quantity);

    if (!fromWarehouseId) return onError("Select a source warehouse.");
    if (!toWarehouseId) return onError("Select a destination warehouse.");
    if (fromWarehouseId === toWarehouseId) return onError("Source and destination must differ.");
    if (!qty || qty <= 0) return onError("Enter a quantity greater than 0.");
    if (fromStock && qty > fromStock.available) {
      return onError(`Only ${fromStock.available} units available to transfer.`);
    }

    try {
      await transferStock({
        variantId: row.variantId,
        fromWarehouseId,
        toWarehouseId,
        quantity: qty,
        reason: reason || undefined,
        notes: notes || undefined,
        entityType: "VENDOR",
        entityId: vendorId,
      }).unwrap();
      onSuccess();
    } catch (err: any) {
      onError(err?.data?.message || "Failed to transfer stock. Please try again.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            From Warehouse
          </label>
          {/* FIX: only warehouses that actually hold stock of this variant */}
          <SearchableSelect
            options={fromWarehouseOptions}
            value={fromWarehouseId}
            onChange={setFromWarehouseId}
            placeholder="Select source"
          />
          {fromStock && (
            <p className="text-[11px] text-slate-400 mt-1">
              {fromStock.available} available
            </p>
          )}
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            To Warehouse
          </label>
          {/* FIX: every vendor warehouse except the selected From warehouse */}
          <SearchableSelect
            options={toWarehouseOptions}
            value={toWarehouseId}
            onChange={setToWarehouseId}
            placeholder="Select destination"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
          Transfer Quantity
        </label>
        <input
          type="number"
          min={1}
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="0"
          className="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
          Reason <span className="text-slate-300 normal-case">(optional)</span>
        </label>
        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Rebalancing stock"
          className="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
          Notes <span className="text-slate-300 normal-case">(optional)</span>
        </label>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Write notes here..."
          className="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
        />
      </div>

      <FormFooter isLoading={isLoading} onSubmit={handleSubmit} />
    </div>
  );
}

/* ==================== SHARED FOOTER ==================== */

function FormFooter({
  isLoading,
  onSubmit,
  tone = "cyan",
}: {
  isLoading: boolean;
  onSubmit: () => void;
  tone?: "cyan" | "rose";
}) {
  const gradient =
    tone === "rose"
      ? "from-rose-600 to-pink-500 hover:from-rose-700 hover:to-pink-600 shadow-rose-200"
      : "from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 shadow-blue-200";

  return (
    <div className="flex justify-end pt-2">
      <button
        onClick={onSubmit}
        disabled={isLoading}
        className={`flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-gradient-to-r ${gradient} rounded-xl transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed`}
      >
        {isLoading && <Loader2 size={14} className="animate-spin" />}
        Apply
      </button>
    </div>
  );
}