"use client";

import { Activity, Loader2, Warehouse, X } from "lucide-react";
import { useGetVariantStockQuery } from "@/features/stockApi";

const MOVE_COLORS: Record<string, string> = {
  PURCHASE_RECEIVE: "bg-emerald-100 text-emerald-700",
  ADJUSTMENT: "bg-amber-100 text-amber-700",
  DAMAGE: "bg-rose-100 text-rose-700",
  TRANSFER: "bg-blue-100 text-blue-700",
  SELL_DAMAGE: "bg-purple-100 text-purple-700",
  SALE: "bg-cyan-100 text-cyan-700",
};

export function DetailPanel({ variantId, onClose }: { variantId: string; onClose: () => void }) {
  const { data, isLoading } = useGetVariantStockQuery(variantId);
  const d = data?.data;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white h-full w-full max-w-sm shadow-2xl border-l border-cyan-100 overflow-y-auto flex flex-col animate-[slide-in_0.25s_ease]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-blue-50 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
              <Activity size={14} className="text-white" />
            </div>
            <span className="text-sm font-bold text-slate-700">Stock Detail</span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
          >
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
                  { label: "Total Stock", val: Number(d.variant.totalStock) || 0, accent: "text-blue-700" },
                  { label: "Available", val: Number(d.variant.availableStock) || 0, accent: "text-emerald-700" },
                  { label: "Damaged", val: Number(d.variant.damagedQty) || 0, accent: "text-amber-600" },
                  { label: "Reserved", val: Number(d.variant.reservedQty) || 0, accent: "text-purple-600" },
                ].map((s) => (
                  <div key={s.label} className="bg-white rounded-xl p-2.5 border border-white/80">
                    <div className={`text-lg font-extrabold ${s.accent}`}>{s.val}</div>
                    <div className="text-[10px] text-slate-400 font-medium">{s.label}</div>
                  </div>
                ))}
              </div>
              {d.variant.avgCost != null && (
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Avg Cost</span>
                  <span className="font-bold text-slate-700">
                    ৳{(Number(d.variant.avgCost) || 0).toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            <div className="mb-5">
              <div className="flex items-center gap-1.5 mb-3">
                <Warehouse size={13} className="text-cyan-500" />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Warehouse Breakdown</span>
              </div>
              <div className="space-y-2">
                {d.warehouseBreakdown.map((wb) => {
                  const qty = Number(wb.quantity) || 0;
                  const reserved = Number(wb.reservedQty) || 0;
                  const damaged = Number(wb.damagedQty) || 0;
                  const available = Number(wb.available) || 0;
                  
                  return (
                    <div key={wb.warehouseId} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-700">{wb.warehouseName}</span>
                        <span className="text-sm font-extrabold text-blue-600">{qty}</span>
                      </div>
                      <div className="flex gap-3 text-[10px] text-slate-400">
                        <span>Reserved: <b className="text-slate-600">{reserved}</b></span>
                        <span>Damaged: <b className="text-amber-600">{damaged}</b></span>
                        <span>Available: <b className="text-emerald-600">{available}</b></span>
                      </div>
                      <div className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full"
                          style={{ width: `${Math.min(100, (available / Math.max(qty, 1)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
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
                      <span className="text-sm font-bold text-slate-700 shrink-0">
                        ×{Number(mv.quantity) || 0}
                      </span>
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