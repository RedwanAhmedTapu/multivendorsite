// ============================================
// components/vendor/steps/AccountTypeStep.tsx
// ============================================
import React, { useState, useEffect } from 'react';
import { useUpdateVendorProfileMutation } from '@/features/vendorManageApi';
import type { CompleteVendorProfile } from '@/features/vendorManageApi';

export type AccountType = 'INDIVIDUAL' | 'BUSINESS';

interface AccountTypeStepProps {
  accountType: AccountType;
  onAccountTypeChange: (type: AccountType) => void;
  onNext: () => void;
  onBack: () => void;
  showBackButton?: boolean;
  vendorId: string;
  completeProfile?: CompleteVendorProfile | null;
}

/* ── Small SVG helpers (shared visual language) ── */
const SpinnerIcon = ({ className = 'h-5 w-5 text-white' }: { className?: string }) => (
  <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

const CheckIcon = () => (
  <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
  </svg>
);

const BulletCheck = () => (
  <svg className="h-3.5 w-3.5 text-blue-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
);

const PersonIcon = () => (
  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const BuildingIcon = () => (
  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const AccountTypeStep: React.FC<AccountTypeStepProps> = ({
  accountType,
  onAccountTypeChange,
  onNext,
  onBack,
  showBackButton = true,
  vendorId,
  completeProfile,
}) => {
  const [updateVendorProfile] = useUpdateVendorProfileMutation();

  const [localAccountType, setLocalAccountType] = useState<AccountType>(accountType);
  const [isUpdatingServer, setIsUpdatingServer] = useState(false);

  useEffect(() => {
    if (completeProfile?.accountType) {
      setLocalAccountType(completeProfile.accountType);
      onAccountTypeChange(completeProfile.accountType);
    }
  }, [completeProfile, onAccountTypeChange]);

  const handleAccountTypeChange = async (newType: AccountType) => {
    setLocalAccountType(newType);
    onAccountTypeChange(newType);

    try {
      setIsUpdatingServer(true);
      const formData = new FormData();
      formData.append('accountType', newType);
      await updateVendorProfile({ id: vendorId, formData }).unwrap();
    } catch (error: any) {
      setLocalAccountType(accountType);
      onAccountTypeChange(accountType);
      alert(`Failed to update account type: ${error.data?.message || 'Unknown error'}`);
    } finally {
      setIsUpdatingServer(false);
    }
  };

  const handleNext = () => {
    if (isUpdatingServer) return;
    onNext();
  };

  const OptionCard = ({
    type,
    icon,
    title,
    description,
    bullets,
  }: {
    type: AccountType;
    icon: React.ReactNode;
    title: string;
    description: string;
    bullets: string[];
  }) => {
    const selected = localAccountType === type;
    return (
      <div
        className={`relative rounded-2xl border-2 p-6 cursor-pointer transition-all ${
          selected
            ? 'border-blue-500 shadow-lg shadow-blue-500/10'
            : 'border-slate-100 hover:border-slate-200'
        } ${isUpdatingServer ? 'opacity-50 cursor-not-allowed' : ''}`}
        style={{ backgroundColor: selected ? '#f2f3ff' : '#fff' }}
        onClick={() => !isUpdatingServer && handleAccountTypeChange(type)}
      >
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: selected
                ? 'linear-gradient(135deg,#2563eb,#7c3aed)'
                : '#cbd5e1',
            }}
          >
            {icon}
          </div>
          <h3 className="text-base font-black text-slate-900">{title}</h3>
          <div
            className={`ml-auto flex items-center justify-center h-6 w-6 rounded-full border-2 flex-shrink-0 ${
              selected ? 'bg-blue-600 border-blue-600' : 'border-slate-300'
            }`}
          >
            {selected && <CheckIcon />}
          </div>
        </div>
        <p className="text-slate-500 text-sm mb-4">{description}</p>
        <ul className="text-xs text-slate-500 space-y-2">
          {bullets.map((b) => (
            <li key={b} className="flex items-center">
              <BulletCheck />
              {b}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Title */}
      <div className="text-center">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Account Type</h2>
        <p className="text-slate-500 mt-1 text-sm">Choose your account type for verification</p>

        {isUpdatingServer && (
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-blue-100" style={{ backgroundColor: '#eef2ff' }}>
            <SpinnerIcon className="h-4 w-4 text-blue-600" />
            <span className="text-blue-700 text-xs font-semibold">Saving account type...</span>
          </div>
        )}
      </div>

      {/* Option cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <OptionCard
          type="INDIVIDUAL"
          icon={<PersonIcon />}
          title="Individual Account"
          description="For individual sellers. Requires National ID (NID) or Passport for verification."
          bullets={['National ID (NID) or Passport', 'Personal information', 'Faster verification process']}
        />
        <OptionCard
          type="BUSINESS"
          icon={<BuildingIcon />}
          title="Business Account"
          description="For registered businesses. Requires business registration documents."
          bullets={['Business registration documents', 'Trade license', 'Owner identification', 'Tax certificates']}
        />
      </div>

      {/* Requirements card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100" style={{ backgroundColor: '#f2f3ff' }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#2563eb,#7c3aed)' }}>
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-700">What you'll need</h3>
        </div>
        <div className="p-6">
          {localAccountType === 'INDIVIDUAL' ? (
            <div className="text-sm text-slate-600">
              <p className="font-bold text-slate-900 mb-2">For Individual Accounts:</p>
              <ul className="space-y-1.5">
                <li className="flex items-center"><BulletCheck />National ID (NID) — both front and back sides, OR</li>
                <li className="flex items-center"><BulletCheck />Passport — photo page</li>
                <li className="flex items-center"><BulletCheck />Personal information matching your ID</li>
              </ul>
            </div>
          ) : (
            <div className="text-sm text-slate-600">
              <p className="font-bold text-slate-900 mb-2">For Business Accounts:</p>
              <ul className="space-y-1.5">
                <li className="flex items-center"><BulletCheck />Business registration certificate</li>
                <li className="flex items-center"><BulletCheck />Trade license</li>
                <li className="flex items-center"><BulletCheck />Owner's National ID (both sides)</li>
                <li className="flex items-center"><BulletCheck />Tax identification documents (TIN/VAT)</li>
                <li className="flex items-center"><BulletCheck />Company information</li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-2">
        {showBackButton ? (
          <button
            type="button"
            onClick={onBack}
            disabled={isUpdatingServer}
            className="px-6 py-3 border-2 border-slate-200 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-all"
          >
            Back
          </button>
        ) : (
          <div />
        )}
        <button
          type="button"
          onClick={handleNext}
          disabled={isUpdatingServer || !localAccountType}
          className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all"
        >
          {isUpdatingServer && <SpinnerIcon className="h-4 w-4 text-white" />}
          {isUpdatingServer ? 'Saving...' : 'Continue to Documents'}
          {!isUpdatingServer && (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
};

export default AccountTypeStep;