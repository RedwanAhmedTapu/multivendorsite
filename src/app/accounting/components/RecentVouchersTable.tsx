import React from 'react';
import Link from 'next/link';
import { Voucher, VoucherStatus, VoucherType } from '@/features/accountingApi';
import { format } from 'date-fns';
import { FileText, ArrowUpRight } from 'lucide-react';

interface RecentVouchersTableProps {
  vouchers: Voucher[];
}

const statusStyles: Record<VoucherStatus, string> = {
  POSTED: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
  DRAFT: 'bg-amber-50 text-amber-600 border border-amber-200',
  REVERSED: 'bg-rose-50 text-rose-600 border border-rose-200',
  VOID: 'bg-slate-100 text-slate-500 border border-slate-200',
};

const typeLabels: Record<VoucherType, string> = {
  SALES: 'Sales',
  PAYMENT: 'Payment',
  RECEIPT: 'Receipt',
  COMMISSION: 'Commission',
  SETTLEMENT: 'Settlement',
  REFUND: 'Refund',
  PAYOUT: 'Payout',
  EXPENSE: 'Expense',
  JOURNAL: 'Journal',
};

export default function RecentVouchersTable({ vouchers }: RecentVouchersTableProps) {
  if (vouchers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-14 text-slate-300">
        <FileText size={32} className="mb-3 opacity-40" />
        <p className="text-sm font-medium text-slate-400">No recent vouchers</p>
        <p className="text-xs text-slate-300 mt-1">New vouchers will show up here</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px]">
        <thead>
          <tr className="bg-gradient-to-r from-blue-50 to-cyan-50">
            {['Voucher #', 'Type', 'Date', 'Amount', 'Status', ''].map((h, i) => (
              <th
                key={i}
                className="text-left text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-4 py-2.5 border-b border-blue-100 whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {vouchers.map((voucher) => (
            <tr
              key={voucher.id}
              className="border-b border-slate-50 last:border-0 hover:bg-blue-50/30 transition-colors group"
            >
              <td className="px-4 py-3">
                <div className="text-sm font-semibold text-slate-700 font-mono">
                  {voucher.voucherNumber}
                </div>
                <div className="text-xs text-slate-400 truncate max-w-[220px]">
                  {voucher.narration}
                </div>
              </td>
              <td className="px-4 py-3">
                <span className="text-xs font-semibold text-cyan-700 bg-cyan-50 border border-cyan-200 rounded-full px-2.5 py-0.5">
                  {typeLabels[voucher.voucherType] || voucher.voucherType}
                </span>
              </td>
              <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                {format(new Date(voucher.voucherDate), 'MMM dd, yyyy')}
              </td>
              <td className="px-4 py-3">
                <span className="text-sm font-bold text-slate-700 font-mono">
                  ৳{parseFloat(voucher.totalDebit).toLocaleString()}
                </span>
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyles[voucher.status]}`}
                >
                  {voucher.status}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <Link
                  href={`/accounting/vouchers/${voucher.id}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-cyan-600 transition-colors opacity-0 group-hover:opacity-100"
                >
                  View <ArrowUpRight size={12} />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}