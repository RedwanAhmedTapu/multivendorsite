'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  FileText,
  BarChart3,
  Calendar,
  PieChart,
  ChevronDown,
  Calculator,
} from 'lucide-react';

const navigation = [
  {
    name: 'Dashboard',
    href: '/accounting',
    icon: Home,
  },
  {
    name: 'Vouchers',
    href: '/accounting/vouchers',
    icon: FileText,
    subItems: [
      { name: 'All Vouchers', href: '/accounting/vouchers' },
      { name: 'Create Voucher', href: '/accounting/vouchers/create' },
      { name: 'Posted Vouchers', href: '/accounting/vouchers?status=POSTED' },
    ],
  },
  {
    name: 'Chart of Accounts',
    href: '/accounting/accounts',
    icon: BarChart3,
  },
  {
    name: 'Accounting Periods',
    href: '/accounting/periods',
    icon: Calendar,
  },
  {
    name: 'Reports',
    href: '/accounting/reports',
    icon: PieChart,
    subItems: [
      { name: 'Trial Balance', href: '/accounting/reports/trial-balance' },
      { name: 'Ledger Statements', href: '/accounting/reports/ledger' },
      { name: 'Vendor Payables', href: '/accounting/reports/vendor-payables' },
    ],
  },
];

export default function AccountingSidebar() {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleItem = (name: string) => {
    setExpandedItems((prev) =>
      prev.includes(name) ? prev.filter((item) => item !== name) : [...prev, name],
    );
  };

  return (
    <div className="relative flex w-64 flex-col h-screen overflow-hidden bg-slate-950">
      {/* ── Background: dark diagonal gradient + glow blobs ── */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-cyan-950" />
      <div className="absolute -top-24 -left-16 w-56 h-56 rounded-full bg-cyan-500/25 blur-[80px]" />
      <div className="absolute top-1/3 -right-20 w-64 h-64 rounded-full bg-blue-600/20 blur-[90px]" />
      <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-cyan-400/10 blur-[70px]" />

      {/* ── Content ── */}
      <div className="relative flex flex-col h-full">
        {/* Window dots + brand */}
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-center gap-1.5 mb-4">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-300/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <Calculator size={17} className="text-white" />
            </div>
            <h2 className="text-lg font-extrabold text-white tracking-tight">Accounting</h2>
          </div>
        </div>

      
        {/* Menu label */}
        <div className="px-6 mb-2">
          <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">
            Menu
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 px-4 overflow-y-auto pb-4">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.subItems && item.subItems.some((sub) => pathname.startsWith(sub.href)));

            const Icon = item.icon;
            const hasSubItems = item.subItems && item.subItems.length > 0;
            const isExpanded = expandedItems.includes(item.name);

            return (
              <div key={item.name}>
                <div
                  className={`w-full flex items-center justify-between rounded-2xl transition-all ${
                    isActive
                      ? 'bg-white/10 backdrop-blur-md border border-cyan-400/30 shadow-[0_0_0_1px_rgba(34,211,238,0.15),0_8px_20px_-8px_rgba(34,211,238,0.4)]'
                      : 'border border-transparent hover:bg-white/5'
                  }`}
                >
                  <Link
                    href={item.href}
                    className="flex items-center gap-3 flex-1 px-3.5 py-2.5 text-sm font-medium"
                  >
                    <span
                      className={`flex items-center justify-center w-8 h-8 rounded-xl shrink-0 transition-colors ${
                        isActive
                          ? 'bg-gradient-to-br from-cyan-400 to-blue-500 shadow-md shadow-cyan-500/30'
                          : 'bg-white/5'
                      }`}
                    >
                      <Icon
                        className={`h-4 w-4 ${isActive ? 'text-white' : 'text-white/50'}`}
                      />
                    </span>
                    <span className={isActive ? 'text-white font-semibold' : 'text-white/60'}>
                      {item.name}
                    </span>
                  </Link>
                  {hasSubItems && (
                    <button
                      onClick={() => toggleItem(item.name)}
                      className="px-3 py-2.5"
                      aria-label={`Toggle ${item.name} submenu`}
                    >
                      <ChevronDown
                        className={`h-3.5 w-3.5 text-white/40 transition-transform ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                  )}
                </div>

                {hasSubItems && isExpanded && (
                  <div className="ml-6 mt-1 mb-1 space-y-0.5 border-l border-white/10 pl-3">
                    {item.subItems!.map((subItem) => (
                      <Link
                        key={subItem.name}
                        href={subItem.href}
                        className={`block rounded-xl px-3 py-2 text-xs font-medium transition-all ${
                          pathname === subItem.href
                            ? 'bg-cyan-400/10 text-cyan-300 font-semibold'
                            : 'text-white/40 hover:bg-white/5 hover:text-white/70'
                        }`}
                      >
                        {subItem.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Bottom glow divider */}
        <div className="px-4 pb-5 pt-3 border-t border-white/5">
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md px-3.5 py-3 text-center">
            <p className="text-[11px] text-white/30">Synced with production</p>
          </div>
        </div>
      </div>
    </div>
  );
}