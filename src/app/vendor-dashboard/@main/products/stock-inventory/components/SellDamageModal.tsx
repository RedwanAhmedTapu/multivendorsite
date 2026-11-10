"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle, Loader2, ShieldAlert, Tag } from "lucide-react";
import { useSellDamageStockMutation, type StockInventoryRow } from "@/features/stockApi";
import { COA_OPTIONS, inputCls } from "../constants";
import { ModalShell } from "./ModalShell";
import { FieldRow } from "./FieldRow";
import { SearchableSelect } from "./SearchableSelect";

export function SellDamageModal({
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
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-500 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
          >
            Close
          </button>
        </div>
      </ModalShell>
    );
  }

  return (
    <ModalShell title="Sell Damaged Stock" icon={<Tag size={14} className="text-white" />} onClose={onClose}>
      {/* Product + damaged summary */}
      <div className="bg-blue-50/60 rounded-xl px-4 py-3 mb-4 flex items-center gap-3 border border-blue-100">
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
      <div className="bg-white border border-cyan-100 rounded-xl overflow-hidden mb-4">
        <div className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500">
          <div className="text-[10px] font-bold text-white uppercase tracking-wider">Accounting Preview</div>
        </div>
        <div className="px-4 py-3 space-y-1">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-5 text-center bg-blue-100 text-blue-700 rounded text-[10px] font-bold">DR</span>
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
              <span className="inline-block w-5 text-center bg-cyan-100 text-cyan-700 rounded text-[10px] font-bold">CR</span>
              <span className="text-slate-600">Damage Stock Sale Income</span>
            </div>
            <span className="font-mono font-bold text-slate-700">
              ৳{saleAmount ? parseFloat(saleAmount).toFixed(2) : "0.00"}
            </span>
          </div>
          <div className="mt-1.5 text-[10px] text-cyan-600 font-semibold">✓ Auto-voucher will be posted</div>
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
        <button
          onClick={onClose}
          className="flex-1 py-2.5 text-sm font-semibold text-slate-500 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="flex-1 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl hover:from-blue-700 hover:to-cyan-600 disabled:opacity-60 shadow-sm shadow-blue-200 transition-all flex items-center justify-center gap-2"
        >
          {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Tag size={14} />}
          {isLoading ? "Processing…" : "Confirm Sale"}
        </button>
      </div>
    </ModalShell>
  );
}
