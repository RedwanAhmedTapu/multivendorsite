// app/pos/components/BottomNav.tsx
"use client";

import {
  ShoppingCart, Receipt, Users, BarChart2, UserCog, Settings,
} from "lucide-react";
import type { PosStaff } from "@/features/posApi";
import type { PosView } from "../types";
import { NAV_ITEMS } from "../types";

const ICONS: Record<string, React.ReactNode> = {
  ShoppingCart: <ShoppingCart size={18} />,
  Receipt: <Receipt size={18} />,
  Users: <Users size={18} />,
  BarChart2: <BarChart2 size={18} />,
  UserCog: <UserCog size={18} />,
  Settings: <Settings size={18} />,
};

export default function BottomNav({
  activeView,
  onNavigate,
  staff,
}: {
  activeView: PosView;
  onNavigate: (v: PosView) => void;
  staff: PosStaff;
}) {
  const items = NAV_ITEMS.filter((n) => !n.adminOnly || staff.isAdmin).slice(0, 5);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[58px] bg-white border-t border-slate-100 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] z-50 flex px-1 pb-0.5">
      {items.map((item) => {
        const active = activeView === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 rounded-xl text-[8px] font-bold transition-all py-1 ${
              active ? "text-cyan-500" : "text-slate-400"
            }`}
          >
            {ICONS[item.icon]}
            <span>{item.label.split(" ")[0]}</span>
          </button>
        );
      })}
    </nav>
  );
}