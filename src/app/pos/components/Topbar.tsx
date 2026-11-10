// app/pos/components/Topbar.tsx
"use client";

import { Menu, Building2, ChevronRight } from "lucide-react";
import type { PosStaff } from "@/features/posApi";
import type { PosView } from "../types";
import { NAV_ITEMS } from "../types";

export default function Topbar({
  activeView,
  staff,
  storeName,
  vendorId,
  onLogout,
  onMenuClick,
}: {
  activeView: PosView;
  staff: PosStaff;
  storeName: string;
  vendorId: string;
  onLogout: () => void;
  onMenuClick: () => void;
}) {
  const label = NAV_ITEMS.find((n) => n.id === activeView)?.label ?? "POS";

  return (
    <header className="bg-white border-b border-slate-100 h-14 flex items-center gap-3 px-3 md:px-5 shrink-0 shadow-sm">
      <button
        onClick={onMenuClick}
        className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500"
      >
        <Menu size={16} />
      </button>

      <div className="hidden sm:flex text-[10px] text-slate-400 items-center gap-1">
        <Building2 size={12} className="text-cyan-500" />
        <span className="font-semibold text-cyan-600">FinixMart</span>
        <ChevronRight size={11} />
        <span className="font-semibold text-slate-700">{label}</span>
      </div>

      <div className="ml-auto flex items-center gap-2.5">
        <button
          onClick={onLogout}
          className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-full pl-1 pr-3 py-1 hover:bg-slate-100 transition-all"
          title="Switch user / logout"
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white"
            style={{ background: staff.avatarColor }}
          >
            {staff.displayName[0]}
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-[11px] font-bold text-slate-700 leading-tight">
              {staff.displayName}
            </div>
            <div className="text-[9px] text-slate-400 leading-tight">{vendorId}</div>
          </div>
        </button>
      </div>
    </header>
  );
}