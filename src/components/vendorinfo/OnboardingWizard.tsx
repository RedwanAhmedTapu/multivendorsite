// components/vendor/OnboardingWizard.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import {
  useGetVendorByIdQuery,
  useUpdateVendorProfileMutation,
  useCreateOrUpdatePersonalInfoMutation,
  useCreateOrUpdateAddressMutation,
  useCreateOrUpdateBankInfoMutation,
  useGetOnboardingStatusQuery,
  useGetCompleteVendorProfileQuery,
} from '@/features/vendorManageApi';
import type {
  UpdateVendorProfileRequest,
  VendorPersonalInfoRequest,
  VendorAddressRequest,
  VendorBankInfoRequest,
  CompleteVendorProfile,
} from '../../features/vendorManageApi';
import LoadingState from './LoadingState';
import WizardProgress from './WizardProgress';
import StoreInfoStep from './StoreInfoStep';
import AddressStep from './AddressStep';
import AccountTypeStep from './AccountTypeStep';
import DocumentsStep from './DocumentsStep';
import BankInfoStep from './BankInfoStep';

interface OnboardingWizardProps {
  vendorId: string;
  onComplete?: () => void;
}

export type WizardStep = 'store-info' | 'address' | 'account-type' | 'documents' | 'bank-info';
export type AccountType = 'INDIVIDUAL' | 'BUSINESS';
export type BusinessType = 'PROPRIETORSHIP' | 'LIMITED_COMPANY' | 'PARTNERSHIP_FIRM';

interface DocumentUploadData {
  nidFront?: File;
  nidBack?: File;
  passportFront?: File;
  passportBack?: File;
  tradeLicense?: File;
  rjscRegistration?: File;
  tinCertificate?: File;
  vatCertificate?: File;
  otherDocument?: File;
}

interface AddressFormData {
  detailsAddress: string;
  city: string;
  zone: string;
  area: string;
}

interface SelectedLocation {
  city: string;
  zone: string;
  area: string;
}

const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ vendorId, onComplete }) => {
  const [currentStep, setCurrentStep] = useState<WizardStep>('store-info');
  const [accountType, setAccountType] = useState<AccountType>('INDIVIDUAL');
  const [businessType, setBusinessType] = useState<BusinessType | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(null);
  const [documents, setDocuments] = useState<DocumentUploadData>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const initialStepDetermined = useRef(false);

  // API hooks - Single source of truth for vendor data
  const { data: vendor, refetch: refetchVendor, isLoading: vendorLoading } = useGetVendorByIdQuery(vendorId);
  const { data: onboardingStatus, refetch: refetchOnboarding, isLoading: statusLoading } = useGetOnboardingStatusQuery(vendorId);
  const { data: completeProfile, refetch: refetchProfile, isLoading: profileLoading } = useGetCompleteVendorProfileQuery(vendorId);
  
  const [updateVendorProfile] = useUpdateVendorProfileMutation();
  const [updatePersonalInfo] = useCreateOrUpdatePersonalInfoMutation();
  const [updateAddress] = useCreateOrUpdateAddressMutation();
  const [updateBankInfo] = useCreateOrUpdateBankInfoMutation();

  // Form hooks
  const storeInfoForm = useForm<UpdateVendorProfileRequest & { email?: string }>({ 
    mode: 'onChange',
    defaultValues: {
      storeName: '',
      email: ''
    }
  });
  
  const addressForm = useForm<AddressFormData>({ 
    mode: 'onChange',
    defaultValues: {
      detailsAddress: '',
      city: '',
      zone: '',
      area: ''
    }
  });
  
  const personalInfoForm = useForm<VendorPersonalInfoRequest>({ 
    mode: 'onChange',
    defaultValues: {
      idNumber: '',
      idName: '',
      companyName: '',
      businessRegNo: '',
      taxIdNumber: ''
    }
  });
  
  const bankInfoForm = useForm<VendorBankInfoRequest>({ 
    mode: 'onChange',
    defaultValues: {
      accountName: '',
      accountNumber: '',
      bankName: '',
      branchName: ''
    }
  });

  // Debug logging
  useEffect(() => {
    if (completeProfile) {
      console.log('📊 COMPLETE PROFILE DATA:', completeProfile);
    }
  }, [completeProfile]);

  // Set form default values from vendor data
  useEffect(() => {
    if (completeProfile) {
      console.log('🔄 Setting ALL form data from complete profile:', {
        storeName: completeProfile.storeName,
        hasPickupAddress: !!completeProfile.pickupAddress,
        hasPersonalInfo: !!completeProfile.personalInfo,
        hasBankInfo: !!completeProfile.bankInfo,
        hasDocuments: !!completeProfile.documents,
        accountType: completeProfile.accountType,
        businessType: completeProfile.businessType
      });
      
      // Store Info
      if (completeProfile.storeName) {
        storeInfoForm.reset({
          storeName: completeProfile.storeName,
          email: completeProfile.user?.email || ''
        });
      }

      // Address
      if (completeProfile.pickupAddress) {
        const address = completeProfile.pickupAddress;
        console.log('📍 Setting address data:', address);
        addressForm.reset({
          detailsAddress: address.detailsAddress || '',
          city: address.city || '',
          zone: address.zone || '',
          area: address.area || ''
        });

        if (address.city && address.zone && address.area) {
          setSelectedLocation({
            city: address.city,
            zone: address.zone,
            area: address.area
          });
        }
      }

      // Account Type & Business Type
      if (completeProfile.accountType) {
        console.log('👤 Setting account type:', completeProfile.accountType);
        setAccountType(completeProfile.accountType);
      }
      
      if (completeProfile.businessType) {
        console.log('🏢 Setting business type:', completeProfile.businessType);
        setBusinessType(completeProfile.businessType as BusinessType);
      }

      // Personal Info
      if (completeProfile.personalInfo) {
        const personalInfo = completeProfile.personalInfo;
        console.log('📝 Setting personal info:', personalInfo);
        personalInfoForm.reset({
          idNumber: personalInfo.idNumber || '',
          idName: personalInfo.idName || '',
          companyName: personalInfo.companyName || '',
          businessRegNo: personalInfo.businessRegNo || '',
          taxIdNumber: personalInfo.taxIdNumber || ''
        });
      }

      // Bank Info
      if (completeProfile.bankInfo) {
        const bankInfo = completeProfile.bankInfo;
        console.log('🏦 Setting bank info:', bankInfo);
        bankInfoForm.reset({
          accountName: bankInfo.accountName || '',
          accountNumber: bankInfo.accountNumber || '',
          bankName: bankInfo.bankName || '',
          branchName: bankInfo.branchName || ''
        });
      }
    }
  }, [completeProfile, storeInfoForm, addressForm, personalInfoForm, bankInfoForm]);

  // Determine initial step ONLY ONCE when component mounts
  useEffect(() => {
    if (onboardingStatus && completeProfile && !statusLoading && !profileLoading && !initialStepDetermined.current) {
      console.log('🎯 Determining INITIAL step with actual data:', {
        storeName: completeProfile.storeName,
        addressComplete: onboardingStatus.addressComplete,
        personalInfoComplete: onboardingStatus.personalInfoComplete,
        bankInfoComplete: onboardingStatus.bankInfoComplete,
        documentsComplete: onboardingStatus.documentsComplete,
        overallComplete: onboardingStatus.overallComplete
      });
      
      if (!completeProfile.storeName) {
        console.log('➡️ Initial step: store-info (no store name)');
        setCurrentStep('store-info');
      } else if (!onboardingStatus.addressComplete) {
        console.log('➡️ Initial step: address (address incomplete)');
        setCurrentStep('address');
      } else if (!onboardingStatus.personalInfoComplete || !onboardingStatus.bankInfoComplete) {
        console.log('➡️ Initial step: account-type (personal/bank info incomplete)');
        setCurrentStep('account-type');
      } else if (!onboardingStatus.documentsComplete) {
        console.log('➡️ Initial step: documents (documents incomplete)');
        setCurrentStep('documents');
      } else if (!onboardingStatus.overallComplete) {
        console.log('➡️ Initial step: bank-info (overall incomplete)');
        setCurrentStep('bank-info');
      } else {
        console.log('➡️ All steps completed - onboarding done');
        onComplete?.();
      }
      
      initialStepDetermined.current = true;
    }
  }, [onboardingStatus, completeProfile, statusLoading, profileLoading, onComplete]);

  const clearError = (field: string) => {
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleAvatarChange = (file: File | null) => {
    setAvatarFile(file);
  };

  // Store info submission with avatar
  const handleStep1Submit = async (data: UpdateVendorProfileRequest & { email?: string }, avatarFile?: File | null) => {
    setIsSubmitting(true);
    setErrors({});
    
    try {
      console.log('📤 Submitting store info:', { 
        storeName: data.storeName,
        hasAvatarFile: !!avatarFile 
      });
      
      const formData = new FormData();
      formData.append('storeName', data.storeName || '');
      
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }
      
      const result = await updateVendorProfile({
        id: vendorId,
        formData: formData
      }).unwrap();
      
      console.log('✅ Store info update successful:', result);
      
      await new Promise(resolve => setTimeout(resolve, 800));
      
      await Promise.all([
        refetchVendor(),
        refetchOnboarding(),
        refetchProfile()
      ]);
      
      console.log('✅ All data refetched after store info update');
      console.log('🚀 Manually progressing to address step');
      setCurrentStep('address');
      
    } catch (error: any) {
      console.error('❌ Failed to update store info:', error);
      setErrors({
        submit: error?.message || error?.data?.message || 'Failed to update store information. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Address submission
  const handleStep2Submit = async (data: AddressFormData) => {
    setIsSubmitting(true);
    setErrors({});
    
    try {
      const addressData: VendorAddressRequest = {
        detailsAddress: data.detailsAddress,
        city: data.city,
        zone: data.zone,
        area: data.area,
      };

      console.log('📤 Submitting address data:', addressData);

      const result = await updateAddress({ 
        vendorId, 
        data: addressData 
      }).unwrap();
      
      console.log('✅ Address update successful:', result);
      
      await new Promise(resolve => setTimeout(resolve, 800));
      
      await Promise.all([
        refetchOnboarding(), 
        refetchProfile(),
        refetchVendor()
      ]);
      
      console.log('✅ All data refetched after address update');
      console.log('🚀 Manually progressing to account-type step');
      setCurrentStep('account-type');
      
    } catch (error: any) {
      console.error('❌ Failed to update address:', error);
      setErrors({
        submit: error?.data?.message || 'Failed to update address information. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAccountTypeNext = async () => {
    console.log('🚀 Moving to documents step with account type:', accountType);
    // Refetch profile to ensure we have latest accountType
    await refetchProfile();
    setCurrentStep('documents');
  };

  // Documents submit handler
  const handleDocumentsSubmit = async (payload: {
    documents: DocumentUploadData;
    businessType?: BusinessType;
    personalInfo: {
      idNumber?: string;
      idName?: string;
      companyName?: string;
      businessRegNo?: string;
      taxIdNumber?: string;
    };
  }) => {
    setIsSubmitting(true);
    setErrors({});
    
    try {
      console.log('📤 Processing documents step with payload:', payload);

      // Update business type if provided
      if (payload.businessType) {
        setBusinessType(payload.businessType);
        console.log('🏢 Business type set to:', payload.businessType);
      }

      // Personal info is already saved in DocumentsStep component
      // Documents are already uploaded in DocumentsStep component
      
      // Add delay to ensure backend processes everything
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Refetch all data to get updated status
      await Promise.all([
        refetchOnboarding(), 
        refetchProfile(),
        refetchVendor()
      ]);
      
      console.log('✅ Documents step completed successfully');
      console.log('🚀 Moving to bank-info step');
      setCurrentStep('bank-info');
      
    } catch (error: any) {
      console.error('❌ Failed to complete documents step:', error);
      setErrors({
        submit: error?.data?.message || 'Failed to complete document step. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Final submission (Bank Info)
  const handleFinalSubmit = async () => {
    const bankData = bankInfoForm.getValues();

    // Validate bank info
    if (!bankData.accountName || !bankData.accountNumber || !bankData.bankName || !bankData.branchName) {
      setErrors({ submit: 'Please complete all bank information fields' });
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    
    try {
      console.log('📤 Submitting final bank data:', bankData);

      // Submit bank info
      await updateBankInfo({ 
        vendorId, 
        data: bankData 
      }).unwrap();

      // Refetch all data to ensure UI is up to date
      await Promise.all([
        refetchOnboarding(), 
        refetchProfile(), 
        refetchVendor()
      ]);
      
      console.log('✅ Onboarding completed successfully!');
      onComplete?.();
    } catch (error: any) {
      console.error('❌ Failed to update bank info:', error);
      setErrors({
        submit: error?.data?.message || 'Failed to update bank information. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStepStatus = (stepKey: WizardStep) => {
    const stepOrder: WizardStep[] = ['store-info', 'address', 'account-type', 'documents', 'bank-info'];
    const currentStepIndex = stepOrder.indexOf(currentStep);
    const stepIndex = stepOrder.indexOf(stepKey);
    
    if (stepIndex < currentStepIndex) return 'completed';
    if (stepIndex === currentStepIndex) return 'current';
    return 'pending';
  };

  const calculateProgress = () => {
    if (!onboardingStatus) return 0;
    
    let completed = 0;
    const total = 5;
    
    if (completeProfile?.storeName) completed++;
    if (onboardingStatus.addressComplete) completed++;
    if (accountType) completed++;
    if (onboardingStatus.documentsComplete) completed++;
    if (onboardingStatus.personalInfoComplete && onboardingStatus.bankInfoComplete) completed++;
    
    return (completed / total) * 100;
  };

  const progress = calculateProgress();
  const isLoading = vendorLoading || statusLoading || profileLoading;

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white ">
      <WizardProgress 
        progress={progress}
        currentStep={currentStep}
        getStepStatus={getStepStatus}
      />

      {/* Global Error Display */}
      {errors.submit && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-600">{errors.submit}</p>
          </div>
        </div>
      )}

      {/* Form Content */}
      <div className="border-t pt-6">
        {currentStep === 'store-info' && (
          <StoreInfoStep
            form={storeInfoForm}
            onSubmit={handleStep1Submit}
            isSubmitting={isSubmitting}
            vendor={completeProfile}
            onClearError={clearError}
            onAvatarChange={handleAvatarChange}
            avatarPreview={completeProfile?.avatar}
          />
        )}

        {currentStep === 'address' && (
          <AddressStep
            form={addressForm}
            onSubmit={handleStep2Submit}
            isSubmitting={isSubmitting}
            onBack={() => setCurrentStep('store-info')}
            onClearError={clearError}
            onLocationSelected={setSelectedLocation}
            selectedLocation={selectedLocation}
            existingAddress={completeProfile?.pickupAddress}
          />
        )}

        {currentStep === 'account-type' && (
          <AccountTypeStep
            accountType={accountType}
            onAccountTypeChange={setAccountType}
            onNext={handleAccountTypeNext}
            onBack={() => setCurrentStep('address')}
            showBackButton={true}
            vendorId={vendorId}
            completeProfile={completeProfile}
          />
        )}

        {currentStep === 'documents' && (
          <DocumentsStep
            accountType={accountType}
            businessType={businessType}
            vendorId={vendorId}
            onDocumentsChange={setDocuments}
            onBusinessTypeChange={setBusinessType}
            onSubmit={handleDocumentsSubmit}
            isSubmitting={isSubmitting}
            onBack={() => setCurrentStep('account-type')}
            onClearError={clearError}
            existingPersonalInfo={completeProfile?.personalInfo}
            existingBankInfo={completeProfile?.bankInfo}
            completeProfile={completeProfile}
          />
        )}

        {currentStep === 'bank-info' && (
          <BankInfoStep
            personalForm={personalInfoForm}
            bankForm={bankInfoForm}
            onSubmit={handleFinalSubmit}
            isSubmitting={isSubmitting}
            onBack={() => setCurrentStep('documents')}
            onClearError={clearError}
            accountType={accountType}
            existingPersonalInfo={completeProfile?.personalInfo}
            existingBankInfo={completeProfile?.bankInfo}
          />
        )}
      </div>
    </div>
  );
};

export default OnboardingWizard;