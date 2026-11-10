// app/pos/components/Sidebar.tsx
"use client";

import {
  ShoppingCart, Receipt, Users, BarChart2, UserCog, Settings,
} from "lucide-react";
import type { PosStaff, DashboardSummary } from "@/features/posApi";
import type { PosView } from "../types";
import { NAV_ITEMS } from "../types";
import { fmt } from "../ui";

const ICONS: Record<string, React.ReactNode> = {
  ShoppingCart: <ShoppingCart size={15} />,
  Receipt: <Receipt size={15} />,
  Users: <Users size={15} />,
  BarChart2: <BarChart2 size={15} />,
  UserCog: <UserCog size={15} />,
  Settings: <Settings size={15} />,
};

const GROUPS: Array<"Sales" | "Customers" | "Insights" | "Admin"> = [
  "Sales",
  "Customers",
  "Insights",
  "Admin",
];

export default function Sidebar({
  activeView,
  onNavigate,
  staff,
  dashboard,
  storeName,
}: {
  activeView: PosView;
  onNavigate: (v: PosView) => void;
  staff: PosStaff;
  dashboard?: DashboardSummary;
  storeName: string;
}) {
  const items = NAV_ITEMS.filter((n) => !n.adminOnly || staff.isAdmin);

  return (
    <aside className="hidden md:flex w-56 shrink-0 bg-white border-r border-slate-100 flex-col shadow-sm">
      <div className="px-4 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center font-extrabold text-white text-sm shadow-md shadow-blue-200">
            F
          </div>
          <div>
            <div className="text-sm font-extrabold text-slate-900 tracking-tight">
              Finix<span className="text-cyan-500">Mart</span>
            </div>
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              {storeName}
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {GROUPS.map((group) => {
          const groupItems = items.filter((n) => n.group === group);
          if (!groupItems.length) return null;
          return (
            <div key={group}>
              <div className="text-[9px] font-extrabold text-slate-300 uppercase tracking-[1px] px-2 mb-1.5">
                {group}
              </div>
              <div className="space-y-0.5">
                {groupItems.map((item) => {
                  const active = activeView === item.id;
                  const badge = item.id === "invoices" ? undefined : undefined;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onNavigate(item.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition-all group ${
                        active
                          ? "bg-cyan-500 text-white shadow-md shadow-cyan-200"
                          : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                      }`}
                    >
                      <span
                        className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all ${
                          active ? "bg-white/20" : "bg-slate-100 group-hover:bg-slate-200"
                        }`}
                      >
                        {ICONS[item.icon]}
                      </span>
                      <span className="flex-1">{item.label}</span>
                      {badge !== undefined && badge > 0 && (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                            active ? "bg-white/20 text-white" : "bg-cyan-50 text-cyan-600"
                          }`}
                        >
                          {badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="px-3 py-3 border-t border-slate-100">
        <div className="bg-slate-50 rounded-xl p-3">
          <div className="text-[10px] font-bold text-slate-600 mb-2">Today</div>
          <div className="grid grid-cols-2 gap-1.5">
            <div className="bg-white rounded-lg p-2 border border-slate-100">
              <div className="text-xs font-extrabold text-slate-900">
                {fmt(dashboard?.today.netBilling ?? 0)}
              </div>
              <div className="text-[9px] text-slate-400">Sales</div>
            </div>
            <div className="bg-white rounded-lg p-2 border border-slate-100">
              <div className="text-xs font-extrabold text-slate-900">
                {dashboard?.today.salesCount ?? 0}
              </div>
              <div className="text-[9px] text-slate-400">Orders</div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}