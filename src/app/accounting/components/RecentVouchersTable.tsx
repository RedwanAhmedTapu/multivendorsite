import React from 'react';
import Link from 'next/link';
import { Voucher, VoucherStatus, VoucherType } from '@/features/accountingApi';
import { format } from 'date-fns';

interface RecentVouchersTableProps {
  vouchers: Voucher[];
}

const getStatusColor = (status: VoucherStatus) => {
  switch (status) {
    case 'POSTED':
      return 'bg-green-100 text-green-800';
    case 'DRAFT':
      return 'bg-yellow-100 text-yellow-800';
    case 'REVERSED':
      return 'bg-red-100 text-red-800';
    case 'VOID':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getTypeLabel = (type: VoucherType) => {
  const labels: Record<VoucherType, string> = {
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
  return labels[type] || type;
};

export default function RecentVouchersTable({ vouchers }: RecentVouchersTableProps) {
  if (vouchers.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No recent vouchers found
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Voucher #
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Type
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Amount
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {vouchers.map((voucher) => (
            <tr key={voucher.id} className="hover:bg-gray-50">
              <td className="whitespace-nowrap px-6 py-4">
                <div className="text-sm font-medium text-gray-900">
                  {voucher.voucherNumber}
                </div>
                <div className="text-sm text-gray-500">{voucher.narration}</div>
              </td>
              <td className="whitespace-nowrap px-6 py-4">
                <span className="text-sm text-gray-900">
                  {getTypeLabel(voucher.voucherType)}
                </span>
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                {format(new Date(voucher.voucherDate), 'MMM dd, yyyy')}
              </td>
              <td className="whitespace-nowrap px-6 py-4">
                <div className="text-sm font-medium text-gray-900">
                  ৳{parseFloat(voucher.totalDebit).toLocaleString()}
                </div>
              </td>
              <td className="whitespace-nowrap px-6 py-4">
                <span
                  className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getStatusColor(
                    voucher.status
                  )}`}
                >
                  {voucher.status}
                </span>
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                <Link
                  href={`/accounting/vouchers/${voucher.id}`}
                  className="text-blue-600 hover:text-blue-900"
                >
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}