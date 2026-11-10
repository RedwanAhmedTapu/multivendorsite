'use client';

import React from 'react';
import Link from 'next/link';
import { Receipt, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import type { Voucher } from '@/features/accountingApi';

function formatMoney(v: string | number) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Number(v));
}

export default function RecentVouchers({ vouchers }: { vouchers?: Voucher[] }) {
  const items = (vouchers || []).slice(0, 6);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
      <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-md shadow-cyan-500/30">
            <Receipt size={15} className="text-white" />
          </span>
          <span className="text-sm font-bold text-white/80">Recent Vouchers</span>
        </div>
        <Link href="/accounting/vouchers" className="text-[11px] font-semibold text-cyan-300 hover:text-cyan-200">
          View all
        </Link>
      </div>

      <div className="p-3 space-y-1">
        {items.length === 0 && (
          <p className="text-xs text-white/30 text-center py-6">No vouchers recorded yet</p>
        )}
        {items.map((v) => {
          const isCredit = Number(v.totalCredit) >= Number(v.totalDebit);
          return (
            <Link
              key={v.id}
              href={`/accounting/vouchers?id=${v.id}`}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-white/5 transition-colors"
            >
              <span
                className={`flex items-center justify-center w-8 h-8 rounded-lg shrink-0 ${
                  isCredit ? 'bg-emerald-400/10 text-emerald-400' : 'bg-rose-400/10 text-rose-400'
                }`}
              >
                {isCredit ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-white/70 truncate">{v.narration}</p>
                <p className="text-[10px] text-white/30">
                  {v.voucherNumber} ·{' '}
                  {new Date(v.voucherDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
              </div>
              <span className="text-xs font-bold text-white/70 shrink-0">
                {formatMoney(Math.max(Number(v.totalDebit), Number(v.totalCredit)))} ৳
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}