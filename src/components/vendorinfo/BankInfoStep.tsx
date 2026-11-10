// components/vendor/steps/BankInfoStep.tsx
import React, { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { useCreateOrUpdatePersonalInfoMutation } from '@/features/vendorManageApi';
import type {
  VendorPersonalInfoRequest,
  VendorPersonalInfo,
} from '@/features/vendorManageApi';
import type { VendorBankAccount } from '@/features/bankApi';
import BankAccountSelector from '@/components/bankaccountselector/BankAccountSelector';

interface BankInfoStepProps {
  vendorId: string;
  personalForm: UseFormReturn<VendorPersonalInfoRequest>;
  onComplete: () => void; // called once onboarding's bank step should advance/finish
  isSubmitting: boolean; // external "wizard is busy" flag, disables Back etc.
  onBack: () => void;
  onClearError: (field: string) => void;
  accountType: 'INDIVIDUAL' | 'BUSINESS';
  existingPersonalInfo?: VendorPersonalInfo | null;
}

/* ── Shared visual helpers ── */
const SpinnerIcon = ({ className = 'h-4 w-4 text-white' }: { className?: string }) => (
  <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

const inputCls = (hasError?: boolean) =>
  `w-full px-4 py-3 rounded-xl border-2 text-sm text-slate-900 font-medium placeholder-slate-300 focus:outline-none transition-all ${
    hasError
      ? 'border-red-300 bg-red-50 focus:border-red-400'
      : 'border-slate-200 focus:border-blue-500'
  }`;

const FieldWrap = ({
  id,
  label,
  required,
  error,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-1.5">
    <label htmlFor={id} className="block text-xs font-black uppercase tracking-widest text-slate-500">
      {label} {required && <span className="text-red-500 normal-case">*</span>}
    </label>
    {children}
    {error ? <p className="text-xs text-red-500 font-semibold">{error}</p> : null}
  </div>
);

const InfoCard = ({
  icon,
  title,
  items,
  tone,
}: {
  icon: React.ReactNode;
  title: string;
  items: string[];
  tone: 'blue' | 'green';
}) => {
  const styles = {
    blue: { bg: '#eef2ff', border: '#c7d2fe', fg: '#3730a3', title: '#312e81' },
    green: { bg: '#f0fdf4', border: '#bbf7d0', fg: '#166534', title: '#14532d' },
  } as const;
  const s = styles[tone];
  return (
    <div className="rounded-2xl border p-5" style={{ backgroundColor: s.bg, borderColor: s.border }}>
      <h3 className="font-black text-sm mb-3 flex items-center gap-2" style={{ color: s.title }}>
        {icon}
        {title}
      </h3>
      <ul className="text-sm space-y-2" style={{ color: s.fg }}>
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2">
            <span className="mt-1.5 h-1 w-1 rounded-full flex-shrink-0" style={{ backgroundColor: s.fg }} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

const BankInfoStep: React.FC<BankInfoStepProps> = ({
  vendorId,
  personalForm,
  onComplete,
  isSubmitting,
  onBack,
  onClearError,
  accountType,
  existingPersonalInfo,
}) => {
  const { formState: { errors: personalErrors } } = personalForm;

  const [updatePersonalInfo, { isLoading: isSavingPersonalInfo }] =
    useCreateOrUpdatePersonalInfoMutation();

  const [bankAccounts, setBankAccounts] = useState<VendorBankAccount[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  const busy = isSubmitting || isSavingPersonalInfo;

  const handleContinue = async () => {
    setFormError(null);
    try {
      // Persist personal / business identity fields (previously collected
      // but never submitted) before finishing onboarding.
      const personalData = personalForm.getValues();
      const hasPersonalData = Object.values(personalData).some((v) => !!v);
      if (hasPersonalData) {
        await updatePersonalInfo({ vendorId, data: personalData }).unwrap();
      }
      if (bankAccounts.length === 0) {
        setFormError('Please add at least one bank account to continue.');
        return;
      }
      onComplete();
    } catch (err: any) {
      setFormError(err?.data?.message || 'Failed to save your information.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column - Form */}
      <div className="lg:col-span-2 space-y-6">
        <div className="text-center lg:text-left">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Bank Information</h2>
          <p className="text-slate-500 mt-1 text-sm">
            {accountType === 'INDIVIDUAL'
              ? 'Confirm your identity details and add a payout bank account'
              : 'Confirm your business details and add a payout bank account'}
          </p>

          {existingPersonalInfo && (
            <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl border" style={{ backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }}>
              <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-xs font-bold text-green-700">Some information is pre-filled from your existing profile</span>
            </div>
          )}
        </div>

        {formError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-600">
            {formError}
          </div>
        )}

        {/* Identity fields */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100" style={{ backgroundColor: '#f2f3ff' }}>
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-700">
              {accountType === 'INDIVIDUAL' ? 'Identity Information' : 'Business Information'}
            </h3>
          </div>
          <div className="p-6 space-y-5">
            {accountType === 'INDIVIDUAL' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <FieldWrap id="idName" label="Full Name (as on ID)" error={personalErrors.idName?.message as string}>
                  <input
                    id="idName"
                    type="text"
                    {...personalForm.register('idName', { onChange: () => onClearError('submit') })}
                    className={inputCls(!!personalErrors.idName)}
                    placeholder="Enter name exactly as on your ID"
                    style={{ backgroundColor: '#faf8ff' }}
                  />
                </FieldWrap>
                <FieldWrap id="idNumber" label="ID Number" error={personalErrors.idNumber?.message as string}>
                  <input
                    id="idNumber"
                    type="text"
                    {...personalForm.register('idNumber', { onChange: () => onClearError('submit') })}
                    className={inputCls(!!personalErrors.idNumber)}
                    placeholder="National ID / Passport number"
                    style={{ backgroundColor: '#faf8ff' }}
                  />
                </FieldWrap>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <FieldWrap id="companyName" label="Company Name" error={personalErrors.companyName?.message as string}>
                  <input
                    id="companyName"
                    type="text"
                    {...personalForm.register('companyName', { onChange: () => onClearError('submit') })}
                    className={inputCls(!!personalErrors.companyName)}
                    placeholder="Registered company name"
                    style={{ backgroundColor: '#faf8ff' }}
                  />
                </FieldWrap>
                <FieldWrap id="businessRegNo" label="Business Reg. No." error={personalErrors.businessRegNo?.message as string}>
                  <input
                    id="businessRegNo"
                    type="text"
                    {...personalForm.register('businessRegNo', { onChange: () => onClearError('submit') })}
                    className={inputCls(!!personalErrors.businessRegNo)}
                    placeholder="RJSC registration number"
                    style={{ backgroundColor: '#faf8ff' }}
                  />
                </FieldWrap>
                <FieldWrap id="taxIdNumber" label="Tax ID (TIN)" error={personalErrors.taxIdNumber?.message as string}>
                  <input
                    id="taxIdNumber"
                    type="text"
                    {...personalForm.register('taxIdNumber', { onChange: () => onClearError('submit') })}
                    className={inputCls(!!personalErrors.taxIdNumber)}
                    placeholder="Tax identification number"
                    style={{ backgroundColor: '#faf8ff' }}
                  />
                </FieldWrap>
              </div>
            )}
          </div>
        </div>

        {/* Reusable bank account block — same component can be dropped into
            payout settings, vendor profile, etc. */}
        <BankAccountSelector
          vendorId={vendorId}
          onAccountsChange={setBankAccounts}
        />

        {/* Action Buttons */}
        <div className="flex justify-between pt-2">
          <button
            type="button"
            onClick={onBack}
            disabled={busy}
            className="px-6 py-3 border-2 border-slate-200 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-all"
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleContinue}
            disabled={busy}
            className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all"
          >
            {busy && <SpinnerIcon />}
            {busy ? 'Submitting...' : 'Complete Onboarding'}
          </button>
        </div>
      </div>

      {/* Right Column - Info */}
      <div className="space-y-5">
        <InfoCard
          tone="blue"
          title="Information"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          items={[
            'All information must match your official documents',
            'You can add multiple bank accounts and choose a default for payouts',
            'Ensure all details are accurate to avoid delays',
            accountType === 'INDIVIDUAL'
              ? 'Name must match exactly with your ID document'
              : 'Company name must match business registration',
          ]}
        />

        <InfoCard
          tone="green"
          title="Next Steps"
          icon={
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          }
          items={[
            'Profile verification (1-2 business days)',
            'Document verification',
            'Account activation notification',
            'Start listing your products',
          ]}
        />
      </div>
    </div>
  );
};

export default BankInfoStep;