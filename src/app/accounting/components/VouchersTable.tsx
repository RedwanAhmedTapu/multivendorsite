import React from 'react';
import Link from 'next/link';
import { Voucher } from '@/features/accountingApi';
import { format } from 'date-fns';

interface VouchersTableProps {
  vouchers: Voucher[];
}

export default function VouchersTable({ vouchers }: VouchersTableProps) {
  if (vouchers.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">No vouchers found matching your criteria.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
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
              Debit
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Credit
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Created By
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
                <span className="inline-flex rounded-full bg-blue-100 px-2 text-xs font-semibold leading-5 text-blue-800">
                  {voucher.voucherType}
                </span>
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                {format(new Date(voucher.voucherDate), 'MMM dd, yyyy')}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                ৳{parseFloat(voucher.totalDebit).toLocaleString()}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                ৳{parseFloat(voucher.totalCredit).toLocaleString()}
              </td>
              <td className="whitespace-nowrap px-6 py-4">
                <span
                  className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                    voucher.status === 'POSTED'
                      ? 'bg-green-100 text-green-800'
                      : voucher.status === 'DRAFT'
                      ? 'bg-yellow-100 text-yellow-800'
                      : voucher.status === 'REVERSED'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {voucher.status}
                </span>
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                {voucher.createdBy || 'System'}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                <div className="flex space-x-2">
                  <Link
                    href={`/accounting/vouchers/${voucher.id}`}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    View
                  </Link>
                  {voucher.status === 'DRAFT' && (
                    <>
                      <span className="text-gray-300">|</span>
                      <button className="text-green-600 hover:text-green-900">
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