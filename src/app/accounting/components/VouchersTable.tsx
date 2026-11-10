import React from 'react';
import Link from 'next/link';
import { Voucher } from '@/features/accountingApi';
import { format } from 'date-fns';
import { FileText } from 'lucide-react';

interface VouchersTableProps {
  vouchers: Voucher[];
}

const statusStyles: Record<string, string> = {
  POSTED: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
  DRAFT: 'bg-amber-50 text-amber-600 border border-amber-200',
  REVERSED: 'bg-rose-50 text-rose-600 border border-rose-200',
  VOID: 'bg-slate-100 text-slate-500 border border-slate-200',
};

export default function VouchersTable({ vouchers }: VouchersTableProps) {
  if (vouchers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-14 text-slate-300">
        <FileText size={36} className="mb-3 opacity-40" />
        <p className="text-sm font-medium text-slate-400">No vouchers found matching your criteria</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px]">
        <thead>
          <tr className="bg-gradient-to-r from-blue-50 to-cyan-50">
            {['Voucher #', 'Type', 'Date', 'Debit', 'Credit', 'Status', 'Created By', ''].map(
              (h, i) => (
                <th
                  key={i}
                  className="text-left text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-4 py-2.5 border-b border-blue-100 whitespace-nowrap"
                >
                  {h}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {vouchers.map((voucher) => (
            <tr
              key={voucher.id}
              className="border-b border-slate-50 last:border-0 hover:bg-blue-50/30 transition-colors"
            >
              <td className="px-4 py-3">
                <div className="text-sm font-semibold text-slate-700 font-mono">
                  {voucher.voucherNumber}
                </div>
                <div className="text-xs text-slate-400 truncate max-w-[200px]">
                  {voucher.narration}
                </div>
              </td>
              <td className="px-4 py-3">
                <span className="inline-flex rounded-full bg-cyan-50 border border-cyan-200 px-2.5 py-0.5 text-xs font-semibold text-cyan-700">
                  {voucher.voucherType}
                </span>
              </td>
              <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                {format(new Date(voucher.voucherDate), 'MMM dd, yyyy')}
              </td>
              <td className="px-4 py-3 text-sm font-semibold text-slate-700 font-mono">
                ৳{parseFloat(voucher.totalDebit).toLocaleString()}
              </td>
              <td className="px-4 py-3 text-sm font-semibold text-slate-700 font-mono">
                ৳{parseFloat(voucher.totalCredit).toLocaleString()}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    statusStyles[voucher.status] || statusStyles.VOID
                  }`}
                >
                  {voucher.status}
                </span>
              </td>
              <td className="px-4 py-3 text-xs text-slate-500">
                {voucher.createdBy || 'System'}
              </td>
              <td className="px-4 py-3 text-sm font-medium">
                <div className="flex items-center gap-3">
                  <Link
                    href={`/accounting/vouchers/${voucher.id}`}
                    className="text-blue-600 hover:text-cyan-600 transition-colors text-xs font-semibold"
                  >
                    View
                  </Link>
                  {voucher.status === 'DRAFT' && (
                    <>
                      <span className="text-slate-200">|</span>
                      <button className="text-emerald-600 hover:text-emerald-700 transition-colors text-xs font-semibold">
                        Post
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}