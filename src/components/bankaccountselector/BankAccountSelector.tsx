// components/bankaccountselector/BankAccountSelector.tsx
//
// Reusable "bank accounts" block: lists a vendor's existing BANK-type
// payment accounts, lets them add a new one (bank + branch picked from the
// real master list via a searchable dropdown, routing number auto-filled
// from the branch), and mark one as default / select one. Use this
// anywhere bank-account data is needed — onboarding, vendor settings,
// payout screens, etc.
//
// NOTE: vendor bank-account CRUD is served from vendorManageApi's
// `/vendormanagement/:vendorId/payment-accounts` endpoints (the underlying
// model is polymorphic VendorPaymentAccount — BANK / MOBILE_BANKING / CARD
// / CASH — this component always sends/filters `type: "BANK"`).
// The bank/branch master-list dropdowns still come from bankApi, since
// vendorManageApi doesn't expose getBanks / getBranchesByBank.
import React, { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  useAddVendorPaymentAccountMutation,
  useGetVendorPaymentAccountsQuery,
  useSetDefaultVendorPaymentAccountMutation,
} from '@/features/vendorManageApi';
import type { VendorPaymentAccount } from '@/features/vendorManageApi';
import {
  useGetBanksQuery,
  useGetBranchesByBankQuery,
} from '@/features/bankApi';
import type { Bank, BankBranch } from '@/features/bankApi';

export interface BankAccountSelectorProps {
  vendorId: string;
  /** Card header text. */
  title?: string;
  /** Show the "+ Add account" affordance and inline add form. Default true. */
  allowAdd?: boolean;
  /**
   * If true, each account row becomes selectable (radio-style) instead of
   * only showing a "Set default" action. Use this in flows where the caller
   * needs the vendor to pick one account (e.g. "choose payout account").
   */
  selectable?: boolean;
  /** Controlled selected account id, only used when `selectable` is true. */
  selectedId?: string | null;
  /** Fired when the vendor picks an account (only when `selectable`). */
  onSelect?: (account: VendorPaymentAccount) => void;
  /** Fired whenever the underlying accounts list changes (add/refetch/default). */
  onAccountsChange?: (accounts: VendorPaymentAccount[]) => void;
  /** Optional wrapper className override. */
  className?: string;
}

/* ── Visual helpers ── */
const SpinnerIcon = ({ className = 'h-4 w-4 text-white' }: { className?: string }) => (
  <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

const CardIcon = () => (
  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const ChevronIcon = () => (
  <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const SearchIcon = () => (
  <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
  </svg>
);

const inputCls = (hasError?: boolean, disabled?: boolean) =>
  `w-full px-4 py-3 rounded-xl border-2 text-sm text-slate-900 font-medium placeholder-slate-300 focus:outline-none transition-all ${
    hasError
      ? 'border-red-300 bg-red-50 focus:border-red-400'
      : 'border-slate-200 focus:border-blue-500'
  } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`;

const FieldWrap = ({
  id,
  label,
  required,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-1.5">
    <label htmlFor={id} className="block text-xs font-black uppercase tracking-widest text-slate-500">
      {label} {required && <span className="text-red-500 normal-case">*</span>}
    </label>
    {children}
    {hint && !error ? <p className="text-xs text-slate-400">{hint}</p> : null}
    {error ? <p className="text-xs text-red-500 font-semibold">{error}</p> : null}
  </div>
);

/* ── Searchable dropdown (combobox) ──
   Plain <select> becomes painful to scroll/find in once the bank or
   branch master list gets long, so this swaps in a text-filterable
   dropdown instead. Purely presentational — value/onChange only, so it
   plugs into react-hook-form via <Controller>. */
interface SearchableOption {
  id: string;
  label: string;
  sublabel?: string;
}

const SearchableSelect = ({
  id,
  value,
  onChange,
  onBlur,
  options,
  placeholder,
  searchPlaceholder = 'Type to search…',
  disabled,
  loading,
  loadingText = 'Loading…',
  error,
  emptyText = 'No results found',
}: {
  id: string;
  value: string;
  onChange: (id: string) => void;
  onBlur?: () => void;
  options: SearchableOption[];
  placeholder: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  loading?: boolean;
  loadingText?: string;
  error?: boolean;
  emptyText?: string;
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selected = options.find((o) => o.id === value);

  // Close on outside click, and let the field register a blur for
  // react-hook-form validation once it's closed.
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery('');
      // let the dropdown paint before focusing
      requestAnimationFrame(() => searchInputRef.current?.focus());
    } else {
      onBlur?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const filtered = query.trim()
    ? options.filter((o) =>
        `${o.label} ${o.sublabel ?? ''}`.toLowerCase().includes(query.trim().toLowerCase()),
      )
    : options;

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        id={id}
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        className={`${inputCls(error, disabled)} text-left flex items-center justify-between gap-2`}
      >
        <span className={`truncate ${selected ? 'text-slate-900' : 'text-slate-300'}`}>
          {loading ? loadingText : selected ? selected.label : placeholder}
        </span>
        <ChevronIcon />
      </button>

      {open && !disabled && (
        <div className="absolute z-20 mt-1 w-full rounded-xl border-2 border-slate-200 bg-white shadow-xl overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100">
            <SearchIcon />
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full text-sm text-slate-900 placeholder-slate-300 focus:outline-none"
            />
          </div>
          <div className="max-h-56 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-4 py-3 text-xs text-slate-400">{emptyText}</p>
            ) : (
              filtered.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    onChange(opt.id);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-blue-50 ${
                    opt.id === value ? 'bg-blue-50 font-bold text-blue-700' : 'text-slate-700'
                  }`}
                >
                  {opt.label}
                  {opt.sublabel && <span className="block text-xs text-slate-400">{opt.sublabel}</span>}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const BankAccountRow = ({
  account,
  selectable,
  isSelected,
  onSelectClick,
  onSetDefault,
  settingDefaultId,
}: {
  account: VendorPaymentAccount;
  selectable: boolean;
  isSelected: boolean;
  onSelectClick: () => void;
  onSetDefault: (id: string) => void;
  settingDefaultId: string | null;
}) => (
  <div
    role={selectable ? 'button' : undefined}
    onClick={selectable ? onSelectClick : undefined}
    className={`rounded-2xl border p-4 flex items-center justify-between gap-3 transition-all ${
      selectable ? 'cursor-pointer hover:border-blue-300' : ''
    }`}
    style={{
      backgroundColor: isSelected || account.isDefault ? '#f0fdf4' : '#fff',
      borderColor: isSelected || account.isDefault ? '#bbf7d0' : '#e2e8f0',
    }}
  >
    <div className="flex items-center gap-3 min-w-0">
      {selectable && (
        <span
          className={`flex-shrink-0 h-4 w-4 rounded-full border-2 ${
            isSelected ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
          }`}
        />
      )}
      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-sm font-black text-slate-900 truncate">
            {account.bankBranch?.bank?.name}
          </p>
          {account.isDefault && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-green-100 text-green-700 flex-shrink-0">
              Default
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500 truncate">
          {account.accountName} • ****{account.accountNumber?.slice(-4)} •{' '}
          {account.bankBranch?.branchName}
          {account.bankBranch?.routingNumber
            ? ` • RN: ${account.bankBranch.routingNumber}`
            : ''}
        </p>
      </div>
    </div>
    {!account.isDefault && (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onSetDefault(account.id);
        }}
        disabled={settingDefaultId === account.id}
        className="flex-shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-600 disabled:opacity-50 transition-all"
      >
        {settingDefaultId === account.id ? 'Setting…' : 'Set default'}
      </button>
    )}
  </div>
);

/* Form values collected in the UI. `bankId` only drives the branch
   dropdown locally — it is never sent to the API, only bankBranchId is. */
interface AddAccountFormValues {
  bankId: string;
  bankBranchId: string;
  accountName: string;
  accountNumber: string;
  isDefault?: boolean;
}

const BankAccountSelector: React.FC<BankAccountSelectorProps> = ({
  vendorId,
  title = 'Bank Accounts',
  allowAdd = true,
  selectable = false,
  selectedId = null,
  onSelect,
  onAccountsChange,
  className = '',
}) => {
  const {
    data: paymentAccountsResponse,
    isFetching: accountsLoading,
    refetch: refetchAccounts,
  } = useGetVendorPaymentAccountsQuery(vendorId);

  // This selector is BANK-only — the underlying endpoint returns every
  // payment instrument type (BANK / MOBILE_BANKING / CARD / CASH), so we
  // filter down to bank accounts here.
  const accounts = (paymentAccountsResponse?.data ?? []).filter(
    (acc) => acc.type === 'BANK',
  );

  // Real master bank list — powers the "select bank" dropdown. No hardcoded
  // fallback: banks are managed by admin via bulk-import, so the dropdown
  // must always reflect that source.
  const { data: banksResponse, isLoading: banksLoading, isError: banksError } = useGetBanksQuery();
  const banks: Bank[] = (banksResponse?.data ?? []).filter((b) => b.isActive);
  const bankOptions: SearchableOption[] = banks.map((b) => ({
    id: b.id,
    label: b.name,
    sublabel: b.code ? `Code: ${b.code}` : undefined,
  }));

  const [addPaymentAccount, { isLoading: isAdding }] = useAddVendorPaymentAccountMutation();
  const [setDefaultPaymentAccount] = useSetDefaultVendorPaymentAccountMutation();

  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(accounts.length === 0);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    register: registerAccount,
    handleSubmit: handleAccountSubmit,
    reset: resetAccountForm,
    watch,
    setValue,
    formState: { errors: accountErrors },
  } = useForm<AddAccountFormValues>({
    mode: 'onChange',
    defaultValues: {
      bankId: '',
      bankBranchId: '',
      accountName: '',
      accountNumber: '',
      isDefault: accounts.length === 0,
    },
  });

  const selectedBankId = watch('bankId');
  const selectedBranchId = watch('bankBranchId');

  // Branches for whichever bank is currently selected — skipped until a
  // bank is chosen. Uses bankApi's dedicated bank-scoped endpoint (flat
  // list, no pagination), distinct from the admin table's filtered/
  // paginated getBankBranches query.
  const {
    data: branchesResponse,
    isFetching: branchesLoading,
    isError: branchesError,
  } = useGetBranchesByBankQuery(selectedBankId, { skip: !selectedBankId });
  const branches: BankBranch[] = branchesResponse?.data ?? [];
  const branchOptions: SearchableOption[] = branches.map((b) => ({
    id: b.id,
    label: b.branchName,
    sublabel: b.routingNumber ? `RN: ${b.routingNumber}` : undefined,
  }));

  const selectedBank = banks.find((b) => b.id === selectedBankId);
  const selectedBranch = branches.find((b) => b.id === selectedBranchId);

  useEffect(() => {
    onAccountsChange?.(accounts);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentAccountsResponse]);

  // Whenever the chosen bank changes, the previously-picked branch is no
  // longer valid — clear it so a stale branch from a different bank can't
  // be submitted.
  useEffect(() => {
    setValue('bankBranchId', '');
  }, [selectedBankId, setValue]);

  const handleSetDefault = async (paymentAccountId: string) => {
    setSettingDefaultId(paymentAccountId);
    try {
      await setDefaultPaymentAccount({ vendorId, paymentAccountId }).unwrap();
      await refetchAccounts();
    } catch (err: any) {
      setFormError(err?.data?.message || 'Failed to set default account.');
    } finally {
      setSettingDefaultId(null);
    }
  };

  const onAddAccount = async (data: AddAccountFormValues) => {
    setFormError(null);
    if (!data.bankBranchId) {
      setFormError('Please select a branch.');
      return;
    }
    try {
      // vendorManageApi's addVendorPaymentAccount expects a NESTED payload:
      // { vendorId, data: { type, bankBranchId, accountName, accountNumber, isDefault? } }
      const result = await addPaymentAccount({
        vendorId,
        data: {
          type: 'BANK',
          bankBranchId: data.bankBranchId,
          accountName: data.accountName,
          accountNumber: data.accountNumber,
          isDefault: data.isDefault ?? accounts.length === 0,
        },
      }).unwrap();
      resetAccountForm();
      setShowAddForm(false);
      await refetchAccounts();
      if (selectable && result?.data) onSelect?.(result.data);
    } catch (err: any) {
      setFormError(err?.data?.message || 'Failed to add bank account.');
    }
  };

  return (
    <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden ${className}`}>
      <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-slate-100" style={{ backgroundColor: '#f2f3ff' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#2563eb,#7c3aed)' }}>
            <CardIcon />
          </div>
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-700">{title}</h3>
        </div>
        {allowAdd && !showAddForm && (
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-200 text-blue-600 hover:border-blue-400 transition-all"
          >
            + Add account
          </button>
        )}
      </div>

      <div className="p-6 space-y-4">
        {formError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-600">
            {formError}
          </div>
        )}

        {accountsLoading ? (
          <p className="text-sm text-slate-400">Loading bank accounts…</p>
        ) : accounts.length > 0 ? (
          <div className="space-y-3">
            {accounts.map((account) => (
              <BankAccountRow
                key={account.id}
                account={account}
                selectable={selectable}
                isSelected={selectedId === account.id}
                onSelectClick={() => onSelect?.(account)}
                onSetDefault={handleSetDefault}
                settingDefaultId={settingDefaultId}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400">No bank accounts added yet.</p>
        )}

        {allowAdd && showAddForm && (
          <form onSubmit={handleAccountSubmit(onAddAccount)} className="space-y-5 pt-2 border-t border-slate-100 mt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <FieldWrap id="bankId" label="Bank" required error={accountErrors.bankId?.message as string}>
                <Controller
                  name="bankId"
                  control={control}
                  rules={{ required: 'Please select a bank' }}
                  render={({ field }) => (
                    <SearchableSelect
                      id="bankId"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      options={bankOptions}
                      placeholder="Select a bank"
                      searchPlaceholder="Search banks…"
                      loading={banksLoading}
                      loadingText="Loading banks…"
                      disabled={banksLoading || banksError}
                      error={!!accountErrors.bankId}
                      emptyText={banksError ? "Couldn't load the bank list" : 'No banks found'}
                    />
                  )}
                />
                {banksError && (
                  <p className="text-xs text-red-500 font-semibold mt-1">
                    Couldn't load the bank list. Please refresh and try again.
                  </p>
                )}
              </FieldWrap>

              <FieldWrap
                id="bankBranchId"
                label="Branch"
                required
                error={accountErrors.bankBranchId?.message as string}
                hint={!selectedBankId ? 'Select a bank first' : undefined}
              >
                <Controller
                  name="bankBranchId"
                  control={control}
                  rules={{ required: 'Please select a branch' }}
                  render={({ field }) => (
                    <SearchableSelect
                      id="bankBranchId"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      options={branchOptions}
                      placeholder={!selectedBankId ? 'Select a bank first' : 'Select a branch'}
                      searchPlaceholder="Search branches…"
                      loading={branchesLoading}
                      loadingText="Loading branches…"
                      disabled={!selectedBankId || branchesLoading || branchesError}
                      error={!!accountErrors.bankBranchId}
                      emptyText={
                        branchesError
                          ? "Couldn't load branches for this bank"
                          : 'No branches available for this bank'
                      }
                    />
                  )}
                />
                {branchesError && (
                  <p className="text-xs text-red-500 font-semibold mt-1">
                    Couldn't load branches for this bank. Please try again.
                  </p>
                )}
              </FieldWrap>
            </div>

            {/* Read-only branch detail preview, once a branch is picked. */}
            {selectedBranch && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <p className="text-slate-400 font-bold uppercase tracking-wide">Bank</p>
                  <p className="text-slate-700 font-semibold">{selectedBank?.name || '—'}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-bold uppercase tracking-wide">Branch</p>
                  <p className="text-slate-700 font-semibold">{selectedBranch.branchName}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-bold uppercase tracking-wide">Routing No.</p>
                  <p className="text-slate-700 font-semibold">
                    {selectedBranch.routingNumber || '—'}
                  </p>
                </div>
              </div>
            )}

            <FieldWrap id="accountName" label="Account Holder Name" required error={accountErrors.accountName?.message as string}>
              <input
                id="accountName"
                type="text"
                {...registerAccount('accountName', { required: 'Account holder name is required' })}
                className={inputCls(!!accountErrors.accountName)}
                placeholder="Enter account holder name"
                style={{ backgroundColor: '#faf8ff' }}
              />
            </FieldWrap>

            <FieldWrap id="accountNumber" label="Account Number" required error={accountErrors.accountNumber?.message as string}>
              <input
                id="accountNumber"
                type="text"
                {...registerAccount('accountNumber', { required: 'Account number is required' })}
                className={inputCls(!!accountErrors.accountNumber)}
                placeholder="Enter bank account number"
                style={{ backgroundColor: '#faf8ff' }}
              />
            </FieldWrap>

            <label className="flex items-center gap-2 text-xs font-bold text-slate-600">
              <input type="checkbox" {...registerAccount('isDefault')} className="rounded border-slate-300" />
              Set as default payout account
            </label>

            <div className="flex justify-end gap-3">
              {accounts.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    resetAccountForm();
                  }}
                  className="px-5 py-2.5 border-2 border-slate-200 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={isAdding || banksLoading || !selectedBranchId}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 disabled:opacity-50 transition-all"
              >
                {isAdding && <SpinnerIcon />}
                {isAdding ? 'Adding…' : 'Add Account'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default BankAccountSelector;