"use client";

import { Warehouse } from "lucide-react";

export function WarehousePill({ name, qty }: { name: string; qty: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-100 rounded-lg px-2 py-0.5 text-[11px] text-blue-700 font-semibold whitespace-nowrap">
      <Warehouse size={9} className="shrink-0" />
      {name.length > 12 ? name.slice(0, 12) + "…" : name}: {qty}
    </span>
  );
}
