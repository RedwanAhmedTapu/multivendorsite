// components/vendor/steps/BankInfoStep.tsx
import React, { useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import type { 
  VendorPersonalInfoRequest, 
  VendorBankInfoRequest,
  VendorPersonalInfo,
  VendorBankInfo 
} from '@/features/vendorManageApi';

interface BankInfoStepProps {
  personalForm: UseFormReturn<VendorPersonalInfoRequest>;
  bankForm: UseFormReturn<VendorBankInfoRequest>;
  onSubmit: () => void;
  isSubmitting: boolean;
  onBack: () => void;
  onClearError: (field: string) => void;
  accountType: 'INDIVIDUAL' | 'BUSINESS';
  existingPersonalInfo?: VendorPersonalInfo | null;
  existingBankInfo?: VendorBankInfo | null;
}

const BankInfoStep: React.FC<BankInfoStepProps> = ({
  personalForm,
  bankForm,
  onSubmit,
  isSubmitting,
  onBack,
  onClearError,
  accountType,
  existingPersonalInfo,
  existingBankInfo
}) => {
  const { register: registerPersonal, formState: { errors: personalErrors }, setValue: setPersonalValue } = personalForm;
  const { register: registerBank, formState: { errors: bankErrors }, setValue: setBankValue } = bankForm;

  // Pre-fill form with existing data
  useEffect(() => {
    if (existingPersonalInfo) {
      console.log('🔄 Pre-filling personal info from existing data:', existingPersonalInfo);
      if (existingPersonalInfo.idName) setPersonalValue('idName', existingPersonalInfo.idName);
      if (existingPersonalInfo.idNumber) setPersonalValue('idNumber', existingPersonalInfo.idNumber);
      if (existingPersonalInfo.companyName) setPersonalValue('companyName', existingPersonalInfo.companyName);
      if (existingPersonalInfo.businessRegNo) setPersonalValue('businessRegNo', existingPersonalInfo.businessRegNo);
      if (existingPersonalInfo.taxIdNumber) setPersonalValue('taxIdNumber', existingPersonalInfo.taxIdNumber);
    }

    if (existingBankInfo) {
      console.log('🔄 Pre-filling bank info from existing data:', existingBankInfo);
      if (existingBankInfo.accountName) setBankValue('accountName', existingBankInfo.accountName);
      if (existingBankInfo.accountNumber) setBankValue('accountNumber', existingBankInfo.accountNumber);
      if (existingBankInfo.bankName) setBankValue('bankName', existingBankInfo.bankName);
      if (existingBankInfo.branchName) setBankValue('branchName', existingBankInfo.branchName);
    }
  }, [existingPersonalInfo, existingBankInfo, setPersonalValue, setBankValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left Column - Forms */}
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Complete Your Profile</h2>
          <p className="text-gray-600">
            {accountType === 'INDIVIDUAL' 
              ? 'Enter your personal and bank information'
              : 'Enter your business and bank information'
            }
          </p>
          
          {/* Show existing data indicators */}
          {(existingPersonalInfo || existingBankInfo) && (
            <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-700">
                ✓ Some information is pre-filled from your existing profile
              </p>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal/Business Information */}
          {/* <div className="border rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-4">
              {accountType === 'INDIVIDUAL' ? 'Personal Information' : 'Business Information'}
            </h3>
            
            {accountType === 'INDIVIDUAL' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name as in ID *
                  </label>
                  <input
                    type="text"
                    {...registerPersonal('idName', { 
                      required: 'Full name is required',
                      onChange: () => onClearError('submit')
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your full name as shown on your ID"
                  />
                  {personalErrors.idName && (
                    <p className="text-red-500 text-sm mt-1">{personalErrors.idName.message}</p>
                  )}
                  {existingPersonalInfo?.idName && (
                    <p className="text-xs text-green-600 mt-1">Current: {existingPersonalInfo.idName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ID Number *
                  </label>
                  <input
                    type="text"
                    {...registerPersonal('idNumber', { 
                      required: 'ID number is required',
                      onChange: () => onClearError('submit')
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your National ID or Passport number"
                  />
                  {personalErrors.idNumber && (
                    <p className="text-red-500 text-sm mt-1">{personalErrors.idNumber.message}</p>
                  )}
                  {existingPersonalInfo?.idNumber && (
                    <p className="text-xs text-green-600 mt-1">Current: {existingPersonalInfo.idNumber}</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    {...registerPersonal('companyName', { 
                      required: 'Company name is required',
                      onChange: () => onClearError('submit')
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your registered company name"
                  />
                  {personalErrors.companyName && (
                    <p className="text-red-500 text-sm mt-1">{personalErrors.companyName.message}</p>
                  )}
                  {existingPersonalInfo?.companyName && (
                    <p className="text-xs text-green-600 mt-1">Current: {existingPersonalInfo.companyName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Business Registration Number *
                  </label>
                  <input
                    type="text"
                    {...registerPersonal('businessRegNo', { 
                      required: 'Business registration number is required',
                      onChange: () => onClearError('submit')
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your business registration number"
                  />
                  {personalErrors.businessRegNo && (
                    <p className="text-red-500 text-sm mt-1">{personalErrors.businessRegNo.message}</p>
                  )}
                  {existingPersonalInfo?.businessRegNo && (
                    <p className="text-xs text-green-600 mt-1">Current: {existingPersonalInfo.businessRegNo}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tax ID Number (Optional)
                  </label>
                  <input
                    type="text"
                    {...registerPersonal('taxIdNumber', {
                      onChange: () => onClearError('submit')
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your tax identification number"
                  />
                  {existingPersonalInfo?.taxIdNumber && (
                    <p className="text-xs text-green-600 mt-1">Current: {existingPersonalInfo.taxIdNumber}</p>
                  )}
                </div>
              </div>
            )}
          </div> */}

          {/* Bank Information */}
          <div className="border rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-4">Bank Account Information</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Holder Name *
                </label>
                <input
                  type="text"
                  {...registerBank('accountName', { 
                    required: 'Account holder name is required',
                    onChange: () => onClearError('submit')
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter account holder name"
                />
                {bankErrors.accountName && (
                  <p className="text-red-500 text-sm mt-1">{bankErrors.accountName.message}</p>
                )}
                {existingBankInfo?.accountName && (
                  <p className="text-xs text-green-600 mt-1">Current: {existingBankInfo.accountName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Number *
                </label>
                <input
                  type="text"
                  {...registerBank('accountNumber', { 
                    required: 'Account number is required',
                    onChange: () => onClearError('submit')
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter bank account number"
                />
                {bankErrors.accountNumber && (
                  <p className="text-red-500 text-sm mt-1">{bankErrors.accountNumber.message}</p>
                )}
                {existingBankInfo?.accountNumber && (
                  <p className="text-xs text-green-600 mt-1">Current: {existingBankInfo.accountNumber}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bank Name *
                </label>
                <input
                  type="text"
                  {...registerBank('bankName', { 
                    required: 'Bank name is required',
                    onChange: () => onClearError('submit')
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter bank name"
                />
                {bankErrors.bankName && (
                  <p className="text-red-500 text-sm mt-1">{bankErrors.bankName.message}</p>
                )}
                {existingBankInfo?.bankName && (
                  <p className="text-xs text-green-600 mt-1">Current: {existingBankInfo.bankName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Branch Name *
                </label>
                <input
                  type="text"
                  {...registerBank('branchName', { 
                    required: 'Branch name is required',
                    onChange: () => onClearError('submit')
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter branch name"
                />
                {bankErrors.branchName && (
                  <p className="text-red-500 text-sm mt-1">{bankErrors.branchName.message}</p>
                )}
                {existingBankInfo?.branchName && (
                  <p className="text-xs text-green-600 mt-1">Current: {existingBankInfo.branchName}</p>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-4">
            <button
              type="button"
              onClick={onBack}
              disabled={isSubmitting}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 flex items-center"
            >
              {isSubmitting && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {isSubmitting ? 'Submitting...' : 'Complete Onboarding'}
            </button>
          </div>
        </form>
      </div>

      {/* Right Column - Information */}
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">ℹ️ Information</h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>• All information must match your official documents</li>
            <li>• Bank account will be used for payouts</li>
            <li>• Ensure all details are accurate to avoid delays</li>
            {accountType === 'INDIVIDUAL' ? (
              <li>• Name must match exactly with your ID document</li>
            ) : (
              <li>• Company name must match business registration</li>
            )}
          </ul>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-medium text-green-900 mb-2">✅ Next Steps</h3>
          <ul className="text-sm text-green-800 space-y-2">
            <li>• Profile verification (1-2 business days)</li>
            <li>• Document verification</li>
            <li>• Account activation notification</li>
            <li>• Start listing your products</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default BankInfoStep;