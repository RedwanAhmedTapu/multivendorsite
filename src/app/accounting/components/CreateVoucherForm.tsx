'use client';

import React, { useState } from 'react';
import { useGetChartOfAccountsQuery, useCreateManualVoucherMutation } from '@/features/accountingApi';
import {
  Plus,
  Trash2,
  Calendar,
  FileText,
  CheckCircle,
  XCircle,
  Loader2,
  RotateCcw,
  Hash,
} from 'lucide-react';

interface LedgerEntry {
  id: string;
  drCr: 'Dr' | 'Cr';
  accountId: string;
  accountName: string;
  accountCode: string;
  amount: string;
}

const voucherTypes = [
  { value: 'JOURNAL', label: 'Journal Voucher' },
  { value: 'PAYMENT', label: 'Payment Voucher' },
  { value: 'RECEIPT', label: 'Receipt Voucher' },
  { value: 'EXPENSE', label: 'Expense Voucher' },
  { value: 'SALES', label: 'Sales Voucher' },
  { value: 'DELIVERY', label: 'Delivery Voucher' },
  { value: 'COMMISSION', label: 'Commission Voucher' },
  { value: 'SETTLEMENT', label: 'Settlement Voucher' },
  { value: 'REFUND', label: 'Refund Voucher' },
  { value: 'PAYOUT', label: 'Payout Voucher' },
  { value: 'OPENING', label: 'Opening Voucher' },
  { value: 'CLOSING', label: 'Closing Voucher' },
];

// ============================================
// STYLE TOKENS — matches accounts page's dark cyan/blue glass theme
// ============================================

const glassCard = 'rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md';
const darkField =
  'w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/40 transition-all';
const errorField =
  'w-full rounded-lg border border-rose-400/50 bg-rose-400/5 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-rose-400/50 transition-all';

function InputField({
  label,
  required,
  children,
  icon,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-white/40 uppercase tracking-wider flex items-center gap-1">
        {icon && <span className="text-cyan-300">{icon}</span>}
        {label}
        {required && <span className="text-rose-400">*</span>}
      </label>
      {children}
    </div>
  );
}

export default function CreateVoucherForm() {
  const [formData, setFormData] = useState({
    voucherType: 'JOURNAL',
    voucherDate: new Date().toISOString().split('T')[0],
    narration: '',
  });

  const [entries, setEntries] = useState<LedgerEntry[]>([]);

  const [currentEntry, setCurrentEntry] = useState<Partial<LedgerEntry>>({
    drCr: 'Dr',
    accountId: '',
    amount: '',
  });

  const { data: accountsData, isLoading: isLoadingAccounts } = useGetChartOfAccountsQuery({
    entityType: 'ADMIN',
  });

  const [createVoucher, { isLoading: isCreating }] = useCreateManualVoucherMutation();

  const accounts = accountsData?.data || [];

  const formatDateDisplay = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month}, ${year}`;
  };

  const addEntry = () => {
    if (!currentEntry.accountId || !currentEntry.amount) {
      alert('Please select an account and enter an amount');
      return;
    }

    const selectedAccount = accounts.find((acc) => acc.id === currentEntry.accountId);

    if (!selectedAccount) {
      alert('Selected account not found');
      return;
    }

    const newEntry: LedgerEntry = {
      id: Date.now().toString(),
      drCr: currentEntry.drCr || 'Dr',
      accountId: currentEntry.accountId || '',
      accountName: selectedAccount.name,
      accountCode: selectedAccount.code,
      amount: currentEntry.amount || '',
    };

    setEntries([...entries, newEntry]);

    setCurrentEntry({
      drCr: currentEntry.drCr === 'Dr' ? 'Cr' : 'Dr',
      accountId: '',
      amount: '',
    });
  };

  const removeEntry = (id: string) => {
    setEntries(entries.filter((entry) => entry.id !== id));
  };

  const calculateTotals = () => {
    const totalDebit = entries
      .filter((e) => e.drCr === 'Dr')
      .reduce((sum, e) => sum + parseFloat(e.amount || '0'), 0);

    const totalCredit = entries
      .filter((e) => e.drCr === 'Cr')
      .reduce((sum, e) => sum + parseFloat(e.amount || '0'), 0);

    return { totalDebit, totalCredit, isBalanced: totalDebit === totalCredit && totalDebit > 0 };
  };

  const { totalDebit, totalCredit, isBalanced } = calculateTotals();

  const numberToWords = (num: number): string => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const teens = [
      'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen',
      'Eighteen', 'Nineteen',
    ];

    if (num === 0) return 'Zero';
    if (num < 10) return ones[num];
    if (num >= 10 && num < 20) return teens[num - 10];
    if (num >= 20 && num < 100)
      return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : '');
    if (num >= 100 && num < 1000)
      return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 ? ' ' + numberToWords(num % 100) : '');
    if (num >= 1000 && num < 100000) {
      const thousands = Math.floor(num / 1000);
      const remainder = num % 1000;
      return numberToWords(thousands) + ' Thousand' + (remainder ? ' ' + numberToWords(remainder) : '');
    }
    if (num >= 100000 && num < 10000000) {
      const lakhs = Math.floor(num / 100000);
      const remainder = num % 100000;
      return numberToWords(lakhs) + ' Lakh' + (remainder ? ' ' + numberToWords(remainder) : '');
    }
    if (num >= 10000000) {
      const crores = Math.floor(num / 10000000);
      const remainder = num % 10000000;
      return numberToWords(crores) + ' Crore' + (remainder ? ' ' + numberToWords(remainder) : '');
    }
    return '';
  };

  const handleSave = async () => {
    if (!isBalanced) {
      alert('Voucher must balance! Total debit must equal total credit.');
      return;
    }

    if (entries.length === 0) {
      alert('Please add at least one entry');
      return;
    }

    if (!formData.narration.trim()) {
      alert('Please enter narration');
      return;
    }

    try {
      const voucherDateTime = new Date(formData.voucherDate + 'T00:00:00.000Z').toISOString();

      const voucherData = {
        voucherType: formData.voucherType,
        entityType: 'ADMIN' as const,
        voucherDate: voucherDateTime,
        narration: formData.narration.trim(),
        entries: entries.map((entry) => ({
          accountId: entry.accountId,
          debitAmount: entry.drCr === 'Dr' ? parseFloat(entry.amount).toFixed(2) : '0.00',
          creditAmount: entry.drCr === 'Cr' ? parseFloat(entry.amount).toFixed(2) : '0.00',
        })),
      };

      const result = await createVoucher(voucherData).unwrap();

      if (result.success) {
        alert(`Voucher created successfully! Voucher Number: ${result.data?.voucherNumber}`);
        setEntries([]);
        setFormData({
          voucherType: 'JOURNAL',
          voucherDate: new Date().toISOString().split('T')[0],
          narration: '',
        });
        setCurrentEntry({
          drCr: 'Dr',
          accountId: '',
          amount: '',
        });
      }
    } catch (error: any) {
      const errorMessage = error?.data?.message || error?.message || 'Unknown error occurred';
      alert(`Error creating voucher: ${errorMessage}`);
      console.error('Error creating voucher:', error);
    }
  };

  const handleReset = () => {
    if (entries.length > 0 || formData.narration) {
      if (!confirm('Are you sure you want to reset the form? All unsaved data will be lost.')) {
        return;
      }
    }
    setEntries([]);
    setFormData({
      voucherType: 'JOURNAL',
      voucherDate: new Date().toISOString().split('T')[0],
      narration: '',
    });
    setCurrentEntry({
      drCr: 'Dr',
      accountId: '',
      amount: '',
    });
  };

  const canSave = isBalanced && !isCreating && entries.length > 0 && !!formData.narration.trim();

  return (
    <div className="space-y-5">
      {/* Header + top actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/30 shrink-0">
            <FileText size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
              Voucher Entry
            </h1>
            <p className="text-xs sm:text-sm text-white/35 mt-0.5">
              Create and manage accounting journal entries
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={handleReset}
            className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-all"
          >
            <RotateCcw size={12} />
            Reset
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded-lg bg-gradient-to-r from-cyan-400 to-blue-500 text-white border-0 shadow-lg shadow-cyan-500/30 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {isCreating ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
            {isCreating ? 'Saving...' : 'Save Voucher'}
          </button>
        </div>
      </div>

      {/* Voucher Details Card */}
      <div className={glassCard}>
        <div className="px-5 py-4 border-b border-white/10 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-sm shadow-cyan-500/30">
            <FileText size={15} className="text-white" />
          </div>
          <span className="text-sm font-bold text-white">Voucher Information</span>
        </div>

        <div className="p-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <InputField label="Voucher Type" required icon={<Hash size={11} />}>
              <select
                value={formData.voucherType}
                onChange={(e) => setFormData({ ...formData, voucherType: e.target.value })}
                className={`${darkField} appearance-none cursor-pointer`}
              >
                {voucherTypes.map((type) => (
                  <option key={type.value} value={type.value} className="bg-slate-900 text-white">
                    {type.label}
                  </option>
                ))}
              </select>
            </InputField>

            <InputField label="Voucher Date" required icon={<Calendar size={11} />}>
              <input
                type="date"
                value={formData.voucherDate}
                onChange={(e) => setFormData({ ...formData, voucherDate: e.target.value })}
                className={`${darkField} [color-scheme:dark]`}
              />
              {formData.voucherDate && (
                <div className="mt-1 text-xs font-semibold text-cyan-300">
                  Selected: {formatDateDisplay(formData.voucherDate)}
                </div>
              )}
            </InputField>
          </div>
        </div>
      </div>

      {/* Ledger Entries Card */}
      <div className={glassCard}>
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-sm shadow-cyan-500/30">
              <Plus size={15} className="text-white" />
            </div>
            <span className="text-sm font-bold text-white">Ledger Entries</span>
          </div>
          <span className="text-xs font-semibold text-cyan-300 bg-cyan-400/10 border border-cyan-400/25 rounded-full px-3 py-1">
            Add debit and credit entries
          </span>
        </div>

        <div className="p-5">
          {/* Entry input row */}
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-12 md:col-span-2">
                <InputField label="Dr / Cr">
                  <select
                    value={currentEntry.drCr}
                    onChange={(e) =>
                      setCurrentEntry({ ...currentEntry, drCr: e.target.value as 'Dr' | 'Cr' })
                    }
                    className={`${darkField} appearance-none cursor-pointer font-semibold`}
                  >
                    <option value="Dr" className="bg-slate-900 text-white">Debit</option>
                    <option value="Cr" className="bg-slate-900 text-white">Credit</option>
                  </select>
                </InputField>
              </div>

              <div className="col-span-12 md:col-span-5">
                <InputField label="Account">
                  <select
                    value={currentEntry.accountId}
                    onChange={(e) => setCurrentEntry({ ...currentEntry, accountId: e.target.value })}
                    className={`${darkField} appearance-none cursor-pointer`}
                    disabled={isLoadingAccounts}
                  >
                    <option value="" className="bg-slate-900 text-white/50">
                      {isLoadingAccounts ? 'Loading accounts...' : 'Select Account'}
                    </option>
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id} className="bg-slate-900 text-white">
                        [{acc.code}] {acc.name}
                      </option>
                    ))}
                  </select>
                </InputField>
              </div>

              <div className="col-span-12 md:col-span-4">
                <InputField label="Amount (৳)">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={currentEntry.amount}
                    onChange={(e) => setCurrentEntry({ ...currentEntry, amount: e.target.value })}
                    className={darkField}
                    placeholder="0.00"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addEntry();
                      }
                    }}
                  />
                </InputField>
              </div>

              <div className="col-span-12 md:col-span-1 flex items-end">
                <button
                  type="button"
                  onClick={addEntry}
                  className="flex h-[42px] w-full items-center justify-center rounded-lg bg-gradient-to-r from-cyan-400 to-blue-500 text-white shadow-lg shadow-cyan-500/30 hover:opacity-90 active:scale-95 transition-all"
                  title="Add Entry (or press Enter)"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Entries table */}
          {entries.length > 0 && (
            <div className="mt-5 overflow-hidden rounded-xl border border-white/10">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px]">
                  <thead>
                    <tr className="border-b border-white/10">
                      {['Type', 'Code', 'Account Name', 'Debit (৳)', 'Credit (৳)', 'Action'].map(
                        (h, i) => (
                          <th
                            key={i}
                            className={`px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-white/40 whitespace-nowrap ${
                              i === 3 || i === 4 ? 'text-right' : i === 5 ? 'text-center' : 'text-left'
                            }`}
                          >
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry, index) => (
                      <tr
                        key={entry.id}
                        className={`${index % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.02]'} border-b border-white/5 hover:bg-cyan-400/5 transition-colors`}
                      >
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold border ${
                              entry.drCr === 'Dr'
                                ? 'bg-rose-400/10 text-rose-300 border-rose-400/25'
                                : 'bg-emerald-400/10 text-emerald-300 border-emerald-400/25'
                            }`}
                          >
                            {entry.drCr === 'Dr' ? 'Debit' : 'Credit'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs font-semibold text-cyan-300/80">
                            {entry.accountCode}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-white/80">
                          {entry.accountName}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-bold text-white/80 font-mono">
                          {entry.drCr === 'Dr'
                            ? parseFloat(entry.amount).toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })
                            : '—'}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-bold text-white/80 font-mono">
                          {entry.drCr === 'Cr'
                            ? parseFloat(entry.amount).toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })
                            : '—'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => removeEntry(entry.id)}
                            className="inline-flex items-center rounded-lg p-1.5 text-white/40 hover:text-rose-300 hover:bg-rose-400/10 transition-colors"
                            title="Remove Entry"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-white/[0.03] border-t border-white/10">
                      <td colSpan={3} className="px-4 py-3.5 text-right text-xs font-bold text-white/50">
                        Totals
                      </td>
                      <td className="px-4 py-3.5 text-right text-sm font-extrabold text-cyan-300 font-mono">
                        ৳{totalDebit.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-4 py-3.5 text-right text-sm font-extrabold text-cyan-300 font-mono">
                        ৳{totalCredit.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {isBalanced ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300 border border-emerald-400/25">
                            <CheckCircle className="h-3.5 w-3.5" />
                            Balanced
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-400/10 px-3 py-1 text-xs font-bold text-rose-300 border border-rose-400/25">
                            <XCircle className="h-3.5 w-3.5" />
                            Not Balanced
                          </span>
                        )}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Totals in words */}
          {entries.length > 0 && (
            <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div className="space-y-1.5">
                <div className="flex items-start gap-2">
                  <span className="text-xs font-semibold text-white/40 min-w-[110px]">Total Debit:</span>
                  <span className="text-xs font-bold text-white/75">
                    {numberToWords(Math.floor(totalDebit))} Taka
                    {totalDebit % 1 > 0 ? ` and ${Math.round((totalDebit % 1) * 100)} Paisa` : ''} Only
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-xs font-semibold text-white/40 min-w-[110px]">Total Credit:</span>
                  <span className="text-xs font-bold text-white/75">
                    {numberToWords(Math.floor(totalCredit))} Taka
                    {totalCredit % 1 > 0 ? ` and ${Math.round((totalCredit % 1) * 100)} Paisa` : ''} Only
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Narration + Actions Card */}
      <div className={glassCard}>
        <div className="px-5 py-4 border-b border-white/10 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center">
            <FileText size={15} className="text-white/60" />
          </div>
          <span className="text-sm font-bold text-white">Narration</span>
        </div>

        <div className="p-5">
          <InputField label="Narration / Description" required>
            <textarea
              value={formData.narration}
              onChange={(e) => setFormData({ ...formData, narration: e.target.value })}
              rows={4}
              className={`${darkField} resize-none`}
              placeholder="Enter a detailed description for this voucher entry..."
            />
          </InputField>

          {/* Balance warning */}
          {!isBalanced && entries.length > 0 && (
            <div className="mt-4 flex items-start gap-3 rounded-xl border border-rose-400/25 bg-rose-400/5 p-4">
              <XCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-rose-400" />
              <div>
                <p className="text-sm font-bold text-rose-300">Voucher is not balanced</p>
                <p className="mt-1 text-xs text-rose-300/70">
                  Total debit must equal total credit. Difference: ৳
                  {Math.abs(totalDebit - totalCredit).toFixed(2)}
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-5">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white/70 hover:bg-white/10 hover:text-white transition-all"
            >
              <RotateCcw size={14} />
              Reset Form
            </button>
            <button
              onClick={handleSave}
              disabled={!canSave}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-400 to-blue-500 px-6 py-2.5 text-sm font-bold text-white border-0 shadow-lg shadow-cyan-500/30 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all"
            >
              {isCreating ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
              {isCreating ? 'Saving...' : 'Save Voucher'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}