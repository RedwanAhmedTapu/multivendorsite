"use client";

import { Sparkles, RotateCcw, Check, MapPin, Phone, Building2, Loader2, Warehouse as WarehouseIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Warehouse } from "@/features/warehouseApi";
import { WarehouseType } from "@/features/warehouseApi";

interface Props {
  warehouses: Warehouse[];
  selectedWarehouseId: string | null;
  onSelect: (w: Warehouse) => void;
  onClear: () => void;
  isLoading?: boolean;
}

export function WarehouseAutoFill({
  warehouses,
  selectedWarehouseId,
  onSelect,
  onClear,
  isLoading,
}: Props) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 bg-teal-50 border border-teal-200 rounded-xl text-sm text-teal-700">
        <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
        Loading warehouse data...
      </div>
    );
  }

  if (warehouses.length === 0) return null;

  const selected = warehouses.find((w) => w.id === selectedWarehouseId);

  return (
    <div className="p-4 bg-gradient-to-r from-teal-50/80 to-cyan-50/60 border border-teal-200 rounded-xl space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-teal-100">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
          </div>
          <div>
            <p className="text-xs font-semibold text-teal-800 leading-tight">
              Auto-fill from Warehouse
            </p>
            <p className="text-xs text-teal-600 leading-tight">
              Tap a warehouse to pre-populate fields
            </p>
          </div>
        </div>
        {selected && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="h-7 px-2 text-xs text-slate-500 hover:text-slate-700 gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            Clear
          </Button>
        )}
      </div>

      {/* Warehouse Pills */}
      <div className="flex flex-wrap gap-1.5">
        {warehouses.map((w) => {
          const isSelected = w.id === selectedWarehouseId;
          return (
            <button
              key={w.id}
              type="button"
              onClick={() => onSelect(w)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all duration-150 ${
                isSelected
                  ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                  : "bg-white text-slate-700 border-slate-200 hover:border-teal-300 hover:bg-teal-50"
              }`}
            >
              <WarehouseIcon className="w-3 h-3 flex-shrink-0" />
              <span>{w.name || w.code || "Warehouse"}</span>
              {w.isDefault && (
                <span
                  className={`text-[10px] px-1 py-0.5 rounded-full leading-none ${
                    isSelected ? "bg-teal-500 text-white" : "bg-teal-100 text-teal-700"
                  }`}
                >
                  Default
                </span>
              )}
              {w.type === WarehouseType.PICKUP && (
                <span
                  className={`text-[10px] px-1 py-0.5 rounded-full leading-none ${
                    isSelected ? "bg-cyan-500 text-white" : "bg-blue-100 text-blue-700"
                  }`}
                >
                  Pickup
                </span>
              )}
              {isSelected && <Check className="w-3 h-3 flex-shrink-0" />}
            </button>
          );
        })}
      </div>

      {/* Selected Warehouse Info */}
      {selected && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 pt-2 border-t border-teal-200/50 text-[11px] text-teal-700">
          {selected.address && (
            <span className="flex items-center gap-1 truncate max-w-full">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              {selected.address}
            </span>
          )}
          {selected.phone && (
            <span className="flex items-center gap-1">
              <Phone className="w-3 h-3 flex-shrink-0" />
              {selected.phone}
            </span>
          )}
          {selected.location?.name && (
            <span className="flex items-center gap-1">
              <Building2 className="w-3 h-3 flex-shrink-0" />
              {selected.location.name}
            </span>
          )}
        </div>
      )}
    </div>
  );
}