'use client';

import React from 'react';
import Link from 'next/link';
import { Plus, FileText, BarChart3, ArrowRight } from 'lucide-react';

const actions = [
  {
    title: 'Create Voucher',
    description: 'Record a new manual journal entry',
    icon: Plus,
    href: '/accounting/vouchers/create',
  },
  {
    title: 'Add Account',
    description: 'Add to the chart of accounts',
    icon: BarChart3,
    href: '/accounting/accounts',
  },
  {
    title: 'Trial Balance',
    description: 'Generate the trial balance report',
    icon: FileText,
    href: '/accounting/reports/trial-balance',
  },
];

export default function QuickActions() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
      <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-md shadow-cyan-500/30">
          <Plus size={15} className="text-white" />
        </div>
        <span className="text-sm font-bold text-white/80">Quick Actions</span>
      </div>

      <div className="p-3 space-y-1.5">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.title}
              href={action.href}
              className="flex items-center gap-3 rounded-xl border border-transparent p-3 transition-all hover:border-cyan-400/20 hover:bg-white/5 group"
            >
              <div className="w-9 h-9 shrink-0 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-md shadow-cyan-500/30">
                <Icon className="h-4 w-4 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold text-white/80">{action.title}</h3>
                <p className="text-xs text-white/35 truncate">{action.description}</p>
              </div>
              <ArrowRight
                size={14}
                className="text-cyan-300/60 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0"
              />
            </Link>
          );
        })}
      </div>
    </div>
  );
}