import React from 'react';
import { VoucherType, VoucherStatus } from '@/features/accountingApi';

interface VoucherFiltersProps {
  filters: {
    voucherType?: string;
    status?: string;
    fromDate?: string;
    toDate?: string;
  };
  onFilterChange: (filters: Partial<typeof filters>) => void;
}

const voucherTypes: { value: VoucherType; label: string }[] = [
  { value: 'SALES', label: 'Sales' },
  { value: 'PAYMENT', label: 'Payment' },
  { value: 'RECEIPT', label: 'Receipt' },
  { value: 'COMMISSION', label: 'Commission' },
  { value: 'SETTLEMENT', label: 'Settlement' },
  { value: 'REFUND', label: 'Refund' },
  { value: 'PAYOUT', label: 'Payout' },
  { value: 'EXPENSE', label: 'Expense' },
  { value: 'JOURNAL', label: 'Journal' },
];

const voucherStatuses: { value: VoucherStatus; label: string }[] = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'POSTED', label: 'Posted' },
  { value: 'REVERSED', label: 'Reversed' },
  { value: 'VOID', label: 'Void' },
];

export default function VoucherFilters({ filters, onFilterChange }: VoucherFiltersProps) {
  return (
    <div className="rounded-lg bg-white p-4 shadow">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Type</label>
          <select
            value={filters.voucherType || ''}
            onChange={(e) => onFilterChange({ voucherType: e.target.value || undefined })}
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          >
            <option value="">All Types</option>
            {voucherTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Status</label>
          <select
            value={filters.status || ''}
            onChange={(e) => onFilterChange({ status: e.target.value || undefined })}
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          >
            <option value="">All Status</option>
            {voucherStatuses.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">From Date</label>
          <input
            type="date"
            value={filters.fromDate || ''}
            onChange={(e) => onFilterChange({ fromDate: e.target.value || undefined })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">To Date</label>
          <input
            type="date"
            value={filters.toDate || ''}
            onChange={(e) => onFilterChange({ toDate: e.target.value || undefined })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          onClick={() => onFilterChange({
            voucherType: undefined,
            status: undefined,
            fromDate: undefined,
            toDate: undefined,
          })}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Clear Filters
        </button>
      </div>
    </div>
  );
}