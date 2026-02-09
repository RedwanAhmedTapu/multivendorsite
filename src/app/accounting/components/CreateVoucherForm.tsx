'use client';

import React, { useState } from 'react';
import { useGetChartOfAccountsQuery, useCreateManualVoucherMutation } from '@/features/accountingApi';
import { Plus, Trash2, Calendar, FileText, CheckCircle, XCircle } from 'lucide-react';

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

export default function VoucherEntryForm() {
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

  // Format date for display (e.g., "23 Jan, 2025")
  const formatDateDisplay = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00'); // Add time to avoid timezone issues
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

    const selectedAccount = accounts.find(acc => acc.id === currentEntry.accountId);
    
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
    
    // Reset current entry but keep the drCr toggle for convenience
    setCurrentEntry({
      drCr: currentEntry.drCr === 'Dr' ? 'Cr' : 'Dr', // Auto-toggle for double-entry convenience
      accountId: '',
      amount: '',
    });
  };

  const removeEntry = (id: string) => {
    setEntries(entries.filter(entry => entry.id !== id));
  };

  const calculateTotals = () => {
    const totalDebit = entries
      .filter(e => e.drCr === 'Dr')
      .reduce((sum, e) => sum + parseFloat(e.amount || '0'), 0);
    
    const totalCredit = entries
      .filter(e => e.drCr === 'Cr')
      .reduce((sum, e) => sum + parseFloat(e.amount || '0'), 0);
    
    return { totalDebit, totalCredit, isBalanced: totalDebit === totalCredit && totalDebit > 0 };
  };

  const { totalDebit, totalCredit, isBalanced } = calculateTotals();

  const numberToWords = (num: number): string => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

    if (num === 0) return 'Zero';
    if (num < 10) return ones[num];
    if (num >= 10 && num < 20) return teens[num - 10];
    if (num >= 20 && num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : '');
    if (num >= 100 && num < 1000) return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 ? ' ' + numberToWords(num % 100) : '');
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
      // Convert date to ISO-8601 DateTime format (YYYY-MM-DDTHH:mm:ss.sssZ)
      const voucherDateTime = new Date(formData.voucherDate + 'T00:00:00.000Z').toISOString();
      
      const voucherData = {
        voucherType: formData.voucherType,
        entityType: 'ADMIN' as const,
        voucherDate: voucherDateTime, // ISO-8601 DateTime format
        narration: formData.narration.trim(),
        entries: entries.map(entry => ({
          accountId: entry.accountId,
          debitAmount: entry.drCr === 'Dr' ? parseFloat(entry.amount).toFixed(2) : '0.00',
          creditAmount: entry.drCr === 'Cr' ? parseFloat(entry.amount).toFixed(2) : '0.00',
        })),
      };

      console.log('Sending voucher data:', voucherData); // For debugging

      const result = await createVoucher(voucherData).unwrap();
      
      if (result.success) {
        alert(`Voucher created successfully! Voucher Number: ${result.data?.voucherNumber}`);
        // Reset form
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-slate-50 to-blue-50 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4 rounded-xl bg-white px-6 py-5 shadow-md border border-teal-100">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-teal-100">
            <FileText className="h-6 w-6 text-teal-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Voucher Entry</h1>
            <p className="text-sm text-gray-600">Create and manage accounting journal entries</p>
          </div>
        </div>

        {/* Main Form Container */}
        <div className="rounded-xl bg-white shadow-xl border border-gray-200 overflow-hidden">
          <div className="border-b border-teal-200 bg-teal-50 px-6 py-4">
            <h2 className="text-lg font-semibold text-teal-900">Voucher Information</h2>
          </div>

          <div className="p-6">
            {/* Voucher Header */}
            <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 flex items-center text-sm font-semibold text-gray-700">
                  Voucher Type <span className="ml-1 text-rose-500">*</span>
                </label>
                <select
                  value={formData.voucherType}
                  onChange={(e) => setFormData({ ...formData, voucherType: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm shadow-sm transition focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                >
                  {voucherTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 flex items-center text-sm font-semibold text-gray-700">
                  <Calendar className="mr-1.5 h-4 w-4 text-teal-600" />
                  Voucher Date <span className="ml-1 text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={formData.voucherDate}
                    onChange={(e) => setFormData({ ...formData, voucherDate: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm shadow-sm transition focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                  {formData.voucherDate && (
                    <div className="mt-2 text-sm font-medium text-teal-600">
                      Selected: {formatDateDisplay(formData.voucherDate)}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Entry Input Section */}
            <div className="mb-6">
              <div className="mb-4 flex items-center justify-between border-b border-gray-200 pb-3">
                <h3 className="text-base font-semibold text-gray-900">Ledger Entries</h3>
                <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-medium text-teal-700">
                  Add debit and credit entries
                </span>
              </div>

              <div className="rounded-lg border-2 border-teal-200 bg-teal-50/50 p-5">
                <div className="grid grid-cols-12 gap-3">
                  <div className="col-span-12 md:col-span-2">
                    <label className="mb-2 block text-xs font-semibold text-gray-700">Dr/Cr</label>
                    <select
                      value={currentEntry.drCr}
                      onChange={(e) => setCurrentEntry({ ...currentEntry, drCr: e.target.value as 'Dr' | 'Cr' })}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm font-medium shadow-sm transition focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    >
                      <option value="Dr">Debit</option>
                      <option value="Cr">Credit</option>
                    </select>
                  </div>

                  <div className="col-span-12 md:col-span-5">
                    <label className="mb-2 block text-xs font-semibold text-gray-700">Account</label>
                    <select
                      value={currentEntry.accountId}
                      onChange={(e) => setCurrentEntry({ ...currentEntry, accountId: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm shadow-sm transition focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                      disabled={isLoadingAccounts}
                    >
                      <option value="">
                        {isLoadingAccounts ? 'Loading accounts...' : 'Select Account'}
                      </option>
                      {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          [{acc.code}] {acc.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-12 md:col-span-4">
                    <label className="mb-2 block text-xs font-semibold text-gray-700">Amount (৳)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={currentEntry.amount}
                      onChange={(e) => setCurrentEntry({ ...currentEntry, amount: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm transition focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                      placeholder="0.00"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addEntry();
                        }
                      }}
                    />
                  </div>

                  <div className="col-span-12 md:col-span-1 flex items-end">
                    <button
                      type="button"
                      onClick={addEntry}
                      className="flex h-[42px] w-full items-center justify-center rounded-lg bg-teal-600 text-white shadow-md transition hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                      title="Add Entry (or press Enter)"
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Entries Table */}
            {entries.length > 0 && (
              <div className="mb-6">
                <div className="overflow-hidden rounded-xl border-2 border-gray-200 shadow-md">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-100 border-b-2 border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-700">
                            Type
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-700">
                            Code
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-700">
                            Account Name
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-gray-700">
                            Debit (৳)
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-gray-700">
                            Credit (৳)
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-gray-700">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {entries.map((entry, index) => (
                          <tr 
                            key={entry.id} 
                            className={`transition hover:bg-teal-50 ${
                              index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                            }`}
                          >
                            <td className="px-4 py-3">
                              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                                entry.drCr === 'Dr' 
                                  ? 'bg-rose-100 text-rose-700 border border-rose-200' 
                                  : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                              }`}>
                                {entry.drCr === 'Dr' ? 'Debit' : 'Credit'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-mono text-sm font-semibold text-teal-600">
                                {entry.accountCode}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                              {entry.accountName}
                            </td>
                            <td className="px-4 py-3 text-right text-sm font-bold text-gray-900">
                              {entry.drCr === 'Dr' ? parseFloat(entry.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}
                            </td>
                            <td className="px-4 py-3 text-right text-sm font-bold text-gray-900">
                              {entry.drCr === 'Cr' ? parseFloat(entry.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={() => removeEntry(entry.id)}
                                className="inline-flex items-center rounded-lg p-2 text-rose-600 transition hover:bg-rose-100 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                                title="Remove Entry"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-teal-50 border-t-2 border-teal-200">
                        <tr className="font-bold">
                          <td colSpan={3} className="px-4 py-4 text-right text-sm text-gray-900">
                            <span className="text-base">Totals:</span>
                          </td>
                          <td className="px-4 py-4 text-right text-base text-gray-900">
                            ৳ {totalDebit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-4 text-right text-base text-gray-900">
                            ৳ {totalCredit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-4 text-center">
                            {isBalanced ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
                                <CheckCircle className="h-4 w-4" />
                                Balanced
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-700 border border-rose-200">
                                <XCircle className="h-4 w-4" />
                                Not Balanced
                              </span>
                            )}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Totals in Words */}
            {entries.length > 0 && (
              <div className="mb-6 rounded-xl border-2 border-teal-200 bg-gradient-to-br from-teal-50 to-blue-50 p-5 shadow-sm">
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="text-sm font-semibold text-gray-700 min-w-[120px]">Total Debit:</span>
                    <span className="text-sm font-bold text-gray-900">
                      {numberToWords(Math.floor(totalDebit))} Taka {totalDebit % 1 > 0 ? `and ${Math.round((totalDebit % 1) * 100)} Paisa` : ''} Only
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-sm font-semibold text-gray-700 min-w-[120px]">Total Credit:</span>
                    <span className="text-sm font-bold text-gray-900">
                      {numberToWords(Math.floor(totalCredit))} Taka {totalCredit % 1 > 0 ? `and ${Math.round((totalCredit % 1) * 100)} Paisa` : ''} Only
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Narration */}
            <div className="mb-6">
              <label className="mb-2 flex items-center text-sm font-semibold text-gray-700">
                Narration / Description <span className="ml-1 text-rose-500">*</span>
              </label>
              <textarea
                value={formData.narration}
                onChange={(e) => setFormData({ ...formData, narration: e.target.value })}
                rows={4}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm shadow-sm transition focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                placeholder="Enter a detailed description for this voucher entry..."
              />
            </div>

            {/* Balance Warning */}
            {!isBalanced && entries.length > 0 && (
              <div className="mb-6 flex items-start gap-3 rounded-lg border-2 border-rose-200 bg-rose-50 p-4">
                <XCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-rose-600" />
                <div>
                  <p className="text-sm font-bold text-rose-800">Voucher is not balanced</p>
                  <p className="mt-1 text-xs text-rose-700">
                    Total debit must equal total credit. Difference: ৳ {Math.abs(totalDebit - totalCredit).toFixed(2)}
                  </p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between border-t-2 border-gray-200 pt-6">
              <button
                type="button"
                onClick={handleReset}
                className="rounded-lg border-2 border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500/50"
              >
                Reset Form
              </button>
              <button
                onClick={handleSave}
                disabled={!isBalanced || isCreating || entries.length === 0 || !formData.narration.trim()}
                className="flex items-center gap-2 rounded-lg bg-teal-600 px-8 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500/50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-teal-600"
              >
                {isCreating ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5" />
                    Save Voucher
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}