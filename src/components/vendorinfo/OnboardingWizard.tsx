// components/vendor/OnboardingWizard.tsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  
  // Edit mode state
  const [editMode, setEditMode] = useState<Record<WizardStep, boolean>>({
    'store-info': false,
    'address': false,
    'account-type': false,
    'documents': false,
    'bank-info': false
  });

  // Refs to prevent infinite loops
  const initialStepDetermined = useRef(false);
  const formsInitialized = useRef(false);

  // API hooks
  const { data: vendor, refetch: refetchVendor, isLoading: vendorLoading } = useGetVendorByIdQuery(vendorId);
  const { data: onboardingStatus, refetch: refetchOnboarding, isLoading: statusLoading } = useGetOnboardingStatusQuery(vendorId);
  const { data: completeProfile, refetch: refetchProfile, isLoading: profileLoading } = useGetCompleteVendorProfileQuery(vendorId);
  
  const [updateVendorProfile] = useUpdateVendorProfileMutation();
  const [updatePersonalInfo] = useCreateOrUpdatePersonalInfoMutation();
  const [updateAddress] = useCreateOrUpdateAddressMutation();
  const [updateBankInfo] = useCreateOrUpdateBankInfoMutation();

  // Memoize profile and status data to prevent unnecessary re-renders
  const profileData = useMemo(() => {
    return completeProfile?.data || completeProfile;
  }, [completeProfile]);

  const statusData = useMemo(() => {
    return onboardingStatus?.data || onboardingStatus;
  }, [onboardingStatus]);

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

  // Initialize forms ONCE when data is available
  useEffect(() => {
    if (profileData && !formsInitialized.current) {
      console.log('🔄 Initializing forms with profile data (ONE TIME)');
      
      // Store Info
      if (profileData.storeName) {
        storeInfoForm.reset({
          storeName: profileData.storeName,
          email: profileData.user?.email || ''
        }, { keepDefaultValues: false });
      }

      // Address
      if (profileData.pickupAddress) {
        const address = profileData.pickupAddress;
        if (address.detailsAddress && address.city && address.zone && address.area) {
          addressForm.reset({
            detailsAddress: address.detailsAddress,
            city: address.city,
            zone: address.zone,
            area: address.area
          }, { keepDefaultValues: false });

          setSelectedLocation({
            city: address.city,
            zone: address.zone,
            area: address.area
          });
        }
      }

      // Account Type & Business Type
      if (profileData.accountType) {
        setAccountType(profileData.accountType);
      }
      
      if (profileData.businessType) {
        setBusinessType(profileData.businessType as BusinessType);
      }

      // Personal Info
      if (profileData.personalInfo) {
        personalInfoForm.reset({
          idNumber: profileData.personalInfo.idNumber || '',
          idName: profileData.personalInfo.idName || '',
          companyName: profileData.personalInfo.companyName || '',
          businessRegNo: profileData.personalInfo.businessRegNo || '',
          taxIdNumber: profileData.personalInfo.taxIdNumber || ''
        }, { keepDefaultValues: false });
      }

      // Bank Info
      if (profileData.bankInfo) {
        bankInfoForm.reset({
          accountName: profileData.bankInfo.accountName || '',
          accountNumber: profileData.bankInfo.accountNumber || '',
          bankName: profileData.bankInfo.bankName || '',
          branchName: profileData.bankInfo.branchName || ''
        }, { keepDefaultValues: false });
      }

      formsInitialized.current = true;
      console.log('✅ Forms initialized successfully');
    }
  }, [profileData]);

  // Determine initial step ONCE when component mounts
  useEffect(() => {
    if (statusData && profileData && !statusLoading && !profileLoading && !initialStepDetermined.current) {
      console.log('🎯 Determining INITIAL step (ONE TIME):', {
        storeName: profileData.storeName,
        addressComplete: statusData.addressComplete,
        accountType: profileData.accountType,
        documentsComplete: statusData.documentsComplete,
        bankInfoComplete: statusData.bankInfoComplete,
        overallComplete: statusData.overallComplete
      });
      
      let targetStep: WizardStep = 'store-info';
      
      if (!profileData.storeName) {
        targetStep = 'store-info';
      } else if (!statusData.addressComplete) {
        targetStep = 'address';
      } else if (!profileData.accountType) {
        targetStep = 'account-type';
      } else if (!statusData.documentsComplete) {
        targetStep = 'documents';
      } else if (!statusData.bankInfoComplete) {
        targetStep = 'bank-info';
      } else if (statusData.overallComplete) {
        console.log('✅ All steps completed - calling onComplete');
        onComplete?.();
        initialStepDetermined.current = true;
        return;
      }
      
      console.log(`➡️ Initial step set to: ${targetStep}`);
      setCurrentStep(targetStep);
      initialStepDetermined.current = true;
    }
  }, [statusData, profileData, statusLoading, profileLoading]);

  const clearError = (field: string) => {
    setErrors(prev => {
      if (prev[field]) {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      }
      return prev;
    });
  };

  const handleAvatarChange = (file: File | null) => {
    setAvatarFile(file);
  };

  // Check if step is completed
  const isStepCompleted = (step: WizardStep): boolean => {
    if (!profileData || !statusData) return false;
    
    switch (step) {
      case 'store-info':
        return !!profileData.storeName;
      case 'address':
        return statusData.addressComplete || false;
      case 'account-type':
        return !!profileData.accountType;
      case 'documents':
        return statusData.documentsComplete || false;
      case 'bank-info':
        return statusData.bankInfoComplete || false;
      default:
        return false;
    }
  };

  // Handle step navigation from wizard progress
  const handleStepNavigation = (step: WizardStep) => {
    console.log('🔘 Step clicked:', step, 'Current step:', currentStep);
    
    // Only allow navigation to completed steps or current step
    if (isStepCompleted(step) || step === currentStep) {
      console.log('✅ Navigation allowed to:', step);
      
      // Exit edit mode for current step if active
      if (editMode[currentStep]) {
        setEditMode(prev => ({
          ...prev,
          [currentStep]: false
        }));
      }
      
      // Navigate to the clicked step
      setCurrentStep(step);
      
      // Clear any errors
      setErrors({});
    } else {
      console.log('❌ Navigation blocked - step not completed:', step);
    }
  };

  // Toggle edit mode
  const toggleEditMode = (step: WizardStep) => {
    setEditMode(prev => ({
      ...prev,
      [step]: !prev[step]
    }));
  };

  // Store info submission
  const handleStep1Submit = async (data: UpdateVendorProfileRequest & { email?: string }, avatarFile?: File | null) => {
    setIsSubmitting(true);
    setErrors({});
    
    try {
      const formData = new FormData();
      formData.append('storeName', data.storeName || '');
      
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }
      
      await updateVendorProfile({
        id: vendorId,
        formData: formData
      }).unwrap();
      
      await new Promise(resolve => setTimeout(resolve, 800));
      
      await Promise.all([
        refetchVendor(),
        refetchOnboarding(),
        refetchProfile()
      ]);
      
      if (editMode['store-info']) {
        setEditMode(prev => ({ ...prev, 'store-info': false }));
      } else {
        setCurrentStep('address');
      }
      
    } catch (error: any) {
      console.error('❌ Failed to update store info:', error);
      setErrors({
        submit: error?.message || error?.data?.message || 'Failed to update store information.'
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

      await updateAddress({ 
        vendorId, 
        data: addressData 
      }).unwrap();
      
      await new Promise(resolve => setTimeout(resolve, 800));
      
      await Promise.all([
        refetchOnboarding(), 
        refetchProfile(),
        refetchVendor()
      ]);
      
      if (editMode['address']) {
        setEditMode(prev => ({ ...prev, 'address': false }));
      } else {
        setCurrentStep('account-type');
      }
      
    } catch (error: any) {
      console.error('❌ Failed to update address:', error);
      setErrors({
        submit: error?.data?.message || 'Failed to update address information.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAccountTypeNext = async () => {
    await refetchProfile();
    
    if (editMode['account-type']) {
      setEditMode(prev => ({ ...prev, 'account-type': false }));
    } else {
      setCurrentStep('documents');
    }
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
      if (payload.businessType) {
        setBusinessType(payload.businessType);
      }
      
      await new Promise(resolve => setTimeout(resolve, 800));
      
      await Promise.all([
        refetchOnboarding(), 
        refetchProfile(),
        refetchVendor()
      ]);
      
      if (editMode['documents']) {
        setEditMode(prev => ({ ...prev, 'documents': false }));
      } else {
        setCurrentStep('bank-info');
      }
      
    } catch (error: any) {
      console.error('❌ Failed to complete documents step:', error);
      setErrors({
        submit: error?.data?.message || 'Failed to complete document step.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Bank info submission
  const handleFinalSubmit = async () => {
    const bankData = bankInfoForm.getValues();

    if (!bankData.accountName || !bankData.accountNumber || !bankData.bankName || !bankData.branchName) {
      setErrors({ submit: 'Please complete all bank information fields' });
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    
    try {
      await updateBankInfo({ 
        vendorId, 
        data: bankData 
      }).unwrap();

      await Promise.all([
        refetchOnboarding(), 
        refetchProfile(), 
        refetchVendor()
      ]);
      
      if (editMode['bank-info']) {
        setEditMode(prev => ({ ...prev, 'bank-info': false }));
      } else {
        onComplete?.();
      }
    } catch (error: any) {
      console.error('❌ Failed to update bank info:', error);
      setErrors({
        submit: error?.data?.message || 'Failed to update bank information.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStepStatus = (stepKey: WizardStep) => {
    if (isStepCompleted(stepKey)) return 'completed';
    if (stepKey === currentStep) return 'current';
    return 'pending';
  };

  const calculateProgress = () => {
    if (!statusData || !profileData) return 0;
    
    let completed = 0;
    const total = 5;
    
    if (profileData.storeName) completed++;
    if (statusData.addressComplete) completed++;
    if (profileData.accountType) completed++;
    if (statusData.documentsComplete) completed++;
    if (statusData.bankInfoComplete) completed++;
    
    return (completed / total) * 100;
  };

  const progress = calculateProgress();
  const isLoading = vendorLoading || statusLoading || profileLoading;

  // Render completed step summary
  const renderStepSummary = (step: WizardStep) => {
    if (!profileData) return null;

    let title = '';
    let content: React.ReactNode = null;

    switch (step) {
      case 'store-info':
        title = 'Store Information';
        content = (
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              {profileData.avatar && (
                <img 
                  src={profileData.avatar} 
                  alt="Store avatar" 
                  className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                />
              )}
              <div>
                <p className="text-sm text-gray-600">Store Name</p>
                <p className="font-semibold text-gray-900">{profileData.storeName}</p>
              </div>
            </div>
          </div>
        );
        break;

      case 'address':
        title = 'Pickup Address';
        const address = profileData.pickupAddress;
        content = address ? (
          <div className="space-y-2">
            <div>
              <p className="text-sm text-gray-600">Location</p>
              <p className="font-semibold text-gray-900">
                {address.area}, {address.zone}, {address.city}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Detailed Address</p>
              <p className="text-gray-900">{address.detailsAddress}</p>
            </div>
          </div>
        ) : null;
        break;

      case 'account-type':
        title = 'Account Type';
        content = (
          <div className="space-y-2">
            <div>
              <p className="text-sm text-gray-600">Account Type</p>
              <p className="font-semibold text-gray-900">{profileData.accountType}</p>
            </div>
            {profileData.businessType && (
              <div>
                <p className="text-sm text-gray-600">Business Type</p>
                <p className="font-semibold text-gray-900">{profileData.businessType}</p>
              </div>
            )}
          </div>
        );
        break;

      case 'documents':
        title = 'Documents';
        content = (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              {profileData.documents?.length || 0} document(s) uploaded
            </p>
          </div>
        );
        break;

      case 'bank-info':
        title = 'Bank Information';
        const bankInfo = profileData.bankInfo;
        content = bankInfo ? (
          <div className="space-y-2">
            <div>
              <p className="text-sm text-gray-600">Account Name</p>
              <p className="font-semibold text-gray-900">{bankInfo.accountName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Bank Name</p>
              <p className="text-gray-900">{bankInfo.bankName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Account Number</p>
              <p className="text-gray-900">****{bankInfo.accountNumber?.slice(-4)}</p>
            </div>
          </div>
        ) : null;
        break;
    }

    return (
      <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <h3 className="text-lg font-bold text-green-900">{title} Completed</h3>
            </div>
            {content}
          </div>
          <button
            type="button"
            onClick={() => toggleEditMode(step)}
            className="ml-4 px-4 py-2 bg-white border-2 border-green-600 text-green-700 rounded-lg hover:bg-green-50 font-semibold transition-colors"
          >
            {editMode[step] ? 'Cancel Edit' : 'Edit'}
          </button>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white">
      <WizardProgress 
        progress={progress}
        currentStep={currentStep}
        getStepStatus={getStepStatus}
        onStepClick={handleStepNavigation}
      />

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

      <div className="border-t pt-6">
        {currentStep === 'store-info' && (
          <>
            {isStepCompleted('store-info') && !editMode['store-info'] ? (
              renderStepSummary('store-info')
            ) : (
              <StoreInfoStep
                form={storeInfoForm}
                onSubmit={handleStep1Submit}
                isSubmitting={isSubmitting}
                vendor={profileData}
                onClearError={clearError}
                onAvatarChange={handleAvatarChange}
                avatarPreview={profileData?.avatar}
              />
            )}
          </>
        )}

        {currentStep === 'address' && (
          <>
            {isStepCompleted('address') && !editMode['address'] ? (
              renderStepSummary('address')
            ) : (
              <AddressStep
                form={addressForm}
                onSubmit={handleStep2Submit}
                isSubmitting={isSubmitting}
                onBack={() => setCurrentStep('store-info')}
                onClearError={clearError}
                onLocationSelected={setSelectedLocation}
                selectedLocation={selectedLocation}
                existingAddress={profileData?.pickupAddress}
              />
            )}
          </>
        )}

        {currentStep === 'account-type' && (
          <>
            {isStepCompleted('account-type') && !editMode['account-type'] ? (
              renderStepSummary('account-type')
            ) : (
              <AccountTypeStep
                accountType={accountType}
                onAccountTypeChange={setAccountType}
                onNext={handleAccountTypeNext}
                onBack={() => setCurrentStep('address')}
                showBackButton={true}
                vendorId={vendorId}
                completeProfile={profileData}
              />
            )}
          </>
        )}

        {currentStep === 'documents' && (
          <>
            {isStepCompleted('documents') && !editMode['documents'] ? (
              renderStepSummary('documents')
            ) : (
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
                existingPersonalInfo={profileData?.personalInfo}
                existingBankInfo={profileData?.bankInfo}
                completeProfile={profileData}
              />
            )}
          </>
        )}

        {currentStep === 'bank-info' && (
          <>
            {isStepCompleted('bank-info') && !editMode['bank-info'] ? (
              renderStepSummary('bank-info')
            ) : (
              <BankInfoStep
                personalForm={personalInfoForm}
                bankForm={bankInfoForm}
                onSubmit={handleFinalSubmit}
                isSubmitting={isSubmitting}
                onBack={() => setCurrentStep('documents')}
                onClearError={clearError}
                accountType={accountType}
                existingPersonalInfo={profileData?.personalInfo}
                existingBankInfo={profileData?.bankInfo}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default OnboardingWizard;