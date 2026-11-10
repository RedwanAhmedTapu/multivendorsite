"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowLeftRight,
  Eye,
  Minus,
  MoreVertical,
  ShieldAlert,
  Tag,
} from "lucide-react";
import type { StockInventoryRow } from "@/features/stockApi";
import type { ModalMode } from "../types";

export function ActionMenu({
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
      cls: "text-blue-700 hover:bg-blue-50",
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
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-all"
        title="Actions"
      >
        <MoreVertical size={13} />
      </button>

      {open && (
        <div className="absolute right-0 top-8 z-50 w-48 bg-white border border-slate-200 rounded-xl shadow-xl shadow-slate-200/60 overflow-hidden">
          {items.map((item) => (
            <div key={item.mode}>
              {item.separator && <div className="h-px bg-slate-100 my-0.5" />}
              <button
                onClick={() => {
                  onAction(item.mode, row);
                  setOpen(false);
                }}
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
