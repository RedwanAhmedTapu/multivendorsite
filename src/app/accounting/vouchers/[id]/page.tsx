'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {   useGetVoucherQuery
, usePostVoucherMutation, useReverseVoucherMutation } from '@/features/accountingApi';
import {
  ArrowLeft,
  FileText,
  Calendar,
  User,
  CheckCircle,
  XCircle,
  RefreshCw,
  Printer,
  Download,
  Copy,
} from 'lucide-react';
import { format } from 'date-fns';

export default function VoucherDetailsPage() {
  const { id } = useParams();
  const [showReverseModal, setShowReverseModal] = useState(false);
  const [reverseReason, setReverseReason] = useState('');
  
  const { data: voucherData, isLoading, error } =   useGetVoucherQuery(
    id as string,
    { skip: !id }
  );
  
  const [postVoucher, { isLoading: isPosting }] = usePostVoucherMutation();
  const [reverseVoucher, { isLoading: isReversing }] = useReverseVoucherMutation();

  const voucher = voucherData?.data;

  const handlePostVoucher = async () => {
    if (voucher && voucher.status === 'DRAFT') {
      try {
        await postVoucher(voucher.id).unwrap();
      } catch (error) {
        console.error('Failed to post voucher:', error);
      }
    }
  };

  const handleReverseVoucher = async () => {
    if (voucher && reverseReason.trim()) {
      try {
        await reverseVoucher({ id: voucher.id, data: { reason: reverseReason } }).unwrap();
        setShowReverseModal(false);
        setReverseReason('');
      } catch (error) {
        console.error('Failed to reverse voucher:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
      </div>
    );
  }

  if (error || !voucher) {
    return (
      <div className="rounded-lg bg-red-50 p-8 text-center">
        <XCircle className="mx-auto h-12 w-12 text-red-500" />
        <h3 className="mt-4 text-lg font-medium text-red-800">Voucher Not Found</h3>
        <p className="mt-2 text-red-700">
          The voucher you're looking for doesn't exist or you don't have permission to view it.
        </p>
        <Link
          href="/accounting/vouchers"
          className="mt-4 inline-flex items-center text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Vouchers
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/accounting/vouchers"
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Vouchers
          </Link>
          <div className="mt-4 flex items-center">
            <FileText className="mr-3 h-8 w-8 text-gray-400" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Voucher #{voucher.voucherNumber}
              </h1>
              <p className="text-sm text-gray-600">{voucher.narration}</p>
            </div>
          </div>
        </div>
        <div className="flex space-x-3">
          <button className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            <Printer className="mr-2 h-4 w-4" />
            Print
          </button>
          <button className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            <Download className="mr-2 h-4 w-4" />
            Export
          </button>
          {voucher.status === 'DRAFT' && (
            <button
              onClick={handlePostVoucher}
              disabled={isPosting}
              className="inline-flex items-center rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              {isPosting ? 'Posting...' : 'Post Voucher'}
            </button>
          )}
          {voucher.status === 'POSTED' && !voucher.isReversed && (
            <button
              onClick={() => setShowReverseModal(true)}
              className="inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Reverse
            </button>
          )}
        </div>
      </div>

      {/* Status Banner */}
      <div className={`rounded-lg p-4 ${
        voucher.status === 'POSTED' ? 'bg-green-50' :
        voucher.status === 'DRAFT' ? 'bg-yellow-50' :
        voucher.status === 'REVERSED' ? 'bg-red-50' :
        'bg-gray-50'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className={`h-3 w-3 rounded-full ${
              voucher.status === 'POSTED' ? 'bg-green-500' :
              voucher.status === 'DRAFT' ? 'bg-yellow-500' :
              voucher.status === 'REVERSED' ? 'bg-red-500' :
              'bg-gray-500'
            }`}></div>
            <span className="ml-2 font-medium capitalize">{voucher.status.toLowerCase()} Voucher</span>
          </div>
          <div className="text-sm text-gray-600">
            Created on {format(new Date(voucher.createdAt), 'MMMM dd, yyyy')}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {/* Voucher Details */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Voucher Details</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-gray-500">Voucher Type</label>
                <p className="mt-1 font-medium text-gray-900">{voucher.voucherType}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Voucher Date</label>
                <div className="mt-1 flex items-center">
                  <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                  <span className="font-medium text-gray-900">
                    {format(new Date(voucher.voucherDate), 'MMMM dd, yyyy')}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Entity Type</label>
                <p className="mt-1 font-medium text-gray-900">{voucher.entityType}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Created By</label>
                <div className="mt-1 flex items-center">
                  <User className="mr-2 h-4 w-4 text-gray-400" />
                  <span className="font-medium text-gray-900">{voucher.createdBy || 'System'}</span>
                </div>
              </div>
            </div>
            
            {voucher.internalNotes && (
              <div className="mt-6">
                <label className="text-sm font-medium text-gray-500">Internal Notes</label>
                <p className="mt-1 text-gray-700">{voucher.internalNotes}</p>
              </div>
            )}
          </div>

          {/* Ledger Entries */}
          <div className="mt-6 rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Ledger Entries</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Account
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Description
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Debit
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Credit
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {voucher.ledgerEntries?.map((entry: any) => (
                    <tr key={entry.id}>
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="font-medium text-gray-900">
                          {entry.account?.code} - {entry.account?.name}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-500">{entry.description}</div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                        {entry.debitAmount !== '0' && (
                          <span className="text-green-600">
                            ৳{parseFloat(entry.debitAmount).toLocaleString()}
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                        {entry.creditAmount !== '0' && (
                          <span className="text-red-600">
                            ৳{parseFloat(entry.creditAmount).toLocaleString()}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={2} className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                      Totals:
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                      ৳{parseFloat(voucher.totalDebit).toLocaleString()}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                      ৳{parseFloat(voucher.totalCredit).toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Summary Card */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Debit</span>
                <span className="font-medium text-gray-900">
                  ৳{parseFloat(voucher.totalDebit).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Credit</span>
                <span className="font-medium text-gray-900">
                  ৳{parseFloat(voucher.totalCredit).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-3">
                <span className="text-sm font-medium text-gray-600">Difference</span>
                <span className={`font-medium ${
                  parseFloat(voucher.totalDebit) === parseFloat(voucher.totalCredit)
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}>
                  {parseFloat(voucher.totalDebit) === parseFloat(voucher.totalCredit)
                    ? '✓ Balanced'
                    : '✗ Not Balanced'}
                </span>
              </div>
            </div>
          </div>

          {/* Audit Information */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Audit Information</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-500">Created At</label>
                <p className="text-sm text-gray-900">
                  {format(new Date(voucher.createdAt), 'PPpp')}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Last Updated</label>
                <p className="text-sm text-gray-900">
                  {format(new Date(voucher.updatedAt), 'PPpp')}
                </p>
              </div>
              {voucher.postingDate && (
                <div>
                  <label className="text-sm text-gray-500">Posted At</label>
                  <p className="text-sm text-gray-900">
                    {format(new Date(voucher.postingDate), 'PPpp')}
                  </p>
                </div>
              )}
              {voucher.lockedAt && (
                <div>
                  <label className="text-sm text-gray-500">Locked At</label>
                  <p className="text-sm text-gray-900">
                    {format(new Date(voucher.lockedAt), 'PPpp')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Reverse Voucher Modal */}
      {showReverseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">Reverse Voucher</h3>
            <p className="mt-2 text-sm text-gray-600">
              Are you sure you want to reverse this voucher? This action cannot be undone.
            </p>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">
                Reason for reversal *
              </label>
              <textarea
                value={reverseReason}
                onChange={(e) => setReverseReason(e.target.value)}
                rows={3}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                placeholder="Enter the reason for reversing this voucher..."
                required
              />
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowReverseModal(false);
                  setReverseReason('');
                }}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReverseVoucher}
                disabled={!reverseReason.trim() || isReversing}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isReversing ? 'Reversing...' : 'Confirm Reverse'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}