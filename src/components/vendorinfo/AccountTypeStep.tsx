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

const AccountTypeStep: React.FC<AccountTypeStepProps> = ({
  accountType,
  onAccountTypeChange,
  onNext,
  onBack,
  showBackButton = true,
  vendorId,
  completeProfile
}) => {
  const [updateVendorProfile, { isLoading: isUpdating }] = useUpdateVendorProfileMutation();
  
  const [localAccountType, setLocalAccountType] = useState<AccountType>(accountType);
  const [isUpdatingServer, setIsUpdatingServer] = useState(false);

  // Sync with parent component and server data from props
  useEffect(() => {
    if (completeProfile?.accountType) {
      console.log('🔄 AccountTypeStep: Setting account type from completeProfile:', completeProfile.accountType);
      setLocalAccountType(completeProfile.accountType);
      onAccountTypeChange(completeProfile.accountType);
    }
  }, [completeProfile, onAccountTypeChange]);

  const handleAccountTypeChange = async (newType: AccountType) => {
    setLocalAccountType(newType);
    onAccountTypeChange(newType);
    
    try {
      setIsUpdatingServer(true);
      
      // Create FormData to update vendor profile with account type
      const formData = new FormData();
      formData.append('accountType', newType);
      
      // Update vendor profile on server
      await updateVendorProfile({
        id: vendorId,
        formData
      }).unwrap();
      
      console.log(`✅ Account type updated to: ${newType}`);
    } catch (error: any) {
      console.error('❌ Failed to update account type:', error);
      // Revert local state if server update fails
      setLocalAccountType(accountType);
      onAccountTypeChange(accountType);
      
      // Show error message to user
      alert(`Failed to update account type: ${error.data?.message || 'Unknown error'}`);
    } finally {
      setIsUpdatingServer(false);
    }
  };

  const handleNext = () => {
    // Ensure account type is saved before proceeding
    if (isUpdatingServer) {
      alert('Please wait for account type to be saved before continuing.');
      return;
    }
    onNext();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Type</h2>
        <p className="text-gray-600">Choose your account type for verification</p>
        
        {isUpdatingServer && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-blue-700 text-sm">Saving account type...</span>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div
          className={`relative p-6 border-2 rounded-lg cursor-pointer transition-all ${
            localAccountType === 'INDIVIDUAL'
              ? 'border-blue-500 bg-blue-50 shadow-md'
              : 'border-gray-200 hover:border-gray-300 bg-white'
          } ${isUpdatingServer ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={() => !isUpdatingServer && handleAccountTypeChange('INDIVIDUAL')}
        >
          <div className="flex items-center mb-4">
            <div className={`flex items-center justify-center h-6 w-6 rounded-full border-2 ${
              localAccountType === 'INDIVIDUAL' 
                ? 'bg-blue-500 border-blue-500' 
                : 'border-gray-300'
            }`}>
              {localAccountType === 'INDIVIDUAL' && (
                <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <h3 className="ml-3 text-lg font-semibold text-gray-900">Individual Account</h3>
          </div>
          <p className="text-gray-600 text-sm mb-3">
            For individual sellers. Requires National ID (NID) or Passport for verification.
          </p>
          <ul className="text-xs text-gray-500 space-y-1">
            <li className="flex items-center">
              <svg className="h-3 w-3 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              National ID (NID) or Passport
            </li>
            <li className="flex items-center">
              <svg className="h-3 w-3 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Personal information
            </li>
            <li className="flex items-center">
              <svg className="h-3 w-3 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Faster verification process
            </li>
          </ul>
        </div>

        <div
          className={`relative p-6 border-2 rounded-lg cursor-pointer transition-all ${
            localAccountType === 'BUSINESS'
              ? 'border-blue-500 bg-blue-50 shadow-md'
              : 'border-gray-200 hover:border-gray-300 bg-white'
          } ${isUpdatingServer ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={() => !isUpdatingServer && handleAccountTypeChange('BUSINESS')}
        >
          <div className="flex items-center mb-4">
            <div className={`flex items-center justify-center h-6 w-6 rounded-full border-2 ${
              localAccountType === 'BUSINESS' 
                ? 'bg-blue-500 border-blue-500' 
                : 'border-gray-300'
            }`}>
              {localAccountType === 'BUSINESS' && (
                <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <h3 className="ml-3 text-lg font-semibold text-gray-900">Business Account</h3>
          </div>
          <p className="text-gray-600 text-sm mb-3">
            For registered businesses. Requires business registration documents.
          </p>
          <ul className="text-xs text-gray-500 space-y-1">
            <li className="flex items-center">
              <svg className="h-3 w-3 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Business registration documents
            </li>
            <li className="flex items-center">
              <svg className="h-3 w-3 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Trade license
            </li>
            <li className="flex items-center">
              <svg className="h-3 w-3 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Owner identification
            </li>
            <li className="flex items-center">
              <svg className="h-3 w-3 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Tax certificates
            </li>
          </ul>
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
        <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
          <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          What you'll need:
        </h4>
        {localAccountType === 'INDIVIDUAL' ? (
          <div className="text-sm text-gray-600">
            <p className="font-medium text-gray-900 mb-2">For Individual Accounts:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>National ID (NID) - both front and back sides, OR</li>
              <li>Passport - photo page</li>
              <li>Personal information matching your ID</li>
            </ul>
          </div>
        ) : (
          <div className="text-sm text-gray-600">
            <p className="font-medium text-gray-900 mb-2">For Business Accounts:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Business registration certificate</li>
              <li>Trade license</li>
              <li>Owner's National ID (both sides)</li>
              <li>Tax identification documents (TIN/VAT)</li>
              <li>Company information</li>
            </ul>
          </div>
        )}
      </div>

      <div className="flex justify-between pt-6">
        {showBackButton ? (
          <button
            type="button"
            onClick={onBack}
            disabled={isUpdatingServer}
            className="px-8 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Back
          </button>
        ) : (
          <div></div>
        )}
        <button
          type="button"
          onClick={handleNext}
          disabled={isUpdatingServer || !localAccountType}
          className="px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-all shadow-md hover:shadow-lg"
        >
          {isUpdatingServer ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </>
          ) : (
            'Continue to Documents'
          )}
        </button>
      </div>
    </div>
  );
};

export default AccountTypeStep;