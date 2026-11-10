import React from 'react';
import { VoucherType, VoucherStatus } from '@/features/accountingApi';
import { SlidersHorizontal, RotateCcw, ChevronDown } from 'lucide-react';

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

function FilterField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
        {label}
      </label>
      {children}
    </div>
  );
}

const selectClass =
  'w-full appearance-none bg-white border border-cyan-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 pr-8 cursor-pointer transition-all';
const inputClass =
  'w-full bg-white border border-cyan-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition-all';

export default function VoucherFilters({ filters, onFilterChange }: VoucherFiltersProps) {
  return (
    <div className="rounded-2xl bg-white border border-blue-100 shadow-sm shadow-blue-50 p-5">
      <div className="flex items-center gap-2 mb-4">
        <SlidersHorizontal size={14} className="text-cyan-500" />
        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
          Filter Vouchers
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FilterField label="Type">
          <div className="relative">
            <select
              value={filters.voucherType || ''}
              onChange={(e) => onFilterChange({ voucherType: e.target.value || undefined })}
              className={selectClass}
            >
              <option value="">All Types</option>
              {voucherTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-cyan-400 pointer-events-none"
            />
          </div>
        </FilterField>

        <FilterField label="Status">
          <div className="relative">
            <select
              value={filters.status || ''}
              onChange={(e) => onFilterChange({ status: e.target.value || undefined })}
              className={selectClass}
            >
              <option value="">All Status</option>
              {voucherStatuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-cyan-400 pointer-events-none"
            />
          </div>
        </FilterField>

        <FilterField label="From Date">
          <input
            type="date"
            value={filters.fromDate || ''}
            onChange={(e) => onFilterChange({ fromDate: e.target.value || undefined })}
            className={inputClass}
          />
        </FilterField>

        <FilterField label="To Date">
          <input
            type="date"
            value={filters.toDate || ''}
            onChange={(e) => onFilterChange({ toDate: e.target.value || undefined })}
            className={inputClass}
          />
        </FilterField>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          onClick={() =>
            onFilterChange({
              voucherType: undefined,
              status: undefined,
              fromDate: undefined,
              toDate: undefined,
            })
          }
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50 hover:border-slate-300 transition-all"
        >
          <RotateCcw size={12} />
          Clear Filters
        </button>
      </div>
    </div>
  );
}