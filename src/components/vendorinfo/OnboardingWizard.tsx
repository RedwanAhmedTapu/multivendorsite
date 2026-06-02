"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useForm } from "react-hook-form";
import {
  useGetVendorByIdQuery,
  useUpdateVendorProfileMutation,
  useCreateOrUpdatePersonalInfoMutation,
  useCreateOrUpdateAddressMutation,
  useCreateOrUpdateBankInfoMutation,
  useGetOnboardingStatusQuery,
  useGetCompleteVendorProfileQuery,
} from "@/features/vendorManageApi";
import type {
  UpdateVendorProfileRequest,
  VendorPersonalInfoRequest,
  VendorAddressRequest,
  VendorBankInfoRequest,
  CompleteVendorProfile,
} from "../../features/vendorManageApi";
import LoadingState from "./LoadingState";
import WizardProgress from "./WizardProgress";
import StoreInfoStep from "./StoreInfoStep";
import AddressStep from "./AddressStep";
import AccountTypeStep from "./AccountTypeStep";
import DocumentsStep from "./DocumentsStep";
import BankInfoStep from "./BankInfoStep";

interface OnboardingWizardProps {
  vendorId: string;
  onComplete?: () => void;
}

export type WizardStep =
  | "store-info"
  | "address"
  | "account-type"
  | "documents"
  | "bank-info";
export type AccountType = "INDIVIDUAL" | "BUSINESS";
export type BusinessType =
  | "PROPRIETORSHIP"
  | "LIMITED_COMPANY"
  | "PARTNERSHIP_FIRM";

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

const OnboardingWizard: React.FC<OnboardingWizardProps> = ({
  vendorId,
  onComplete,
}) => {
  const [currentStep, setCurrentStep] = useState<WizardStep>("store-info");
  const [accountType, setAccountType] = useState<AccountType>("INDIVIDUAL");
  const [businessType, setBusinessType] = useState<BusinessType | null>(null);
  const [selectedLocation, setSelectedLocation] =
    useState<SelectedLocation | null>(null);
  const [documents, setDocuments] = useState<DocumentUploadData>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const [editMode, setEditMode] = useState<Record<WizardStep, boolean>>({
    "store-info": false,
    address: false,
    "account-type": false,
    documents: false,
    "bank-info": false,
  });

  const initialStepDetermined = useRef(false);
  const formsInitialized = useRef(false);

  const {
    data: vendor,
    refetch: refetchVendor,
    isLoading: vendorLoading,
  } = useGetVendorByIdQuery(vendorId);
  const {
    data: onboardingStatus,
    refetch: refetchOnboarding,
    isLoading: statusLoading,
  } = useGetOnboardingStatusQuery(vendorId);
  const {
    data: completeProfile,
    refetch: refetchProfile,
    isLoading: profileLoading,
  } = useGetCompleteVendorProfileQuery(vendorId);

  const [updateVendorProfile] = useUpdateVendorProfileMutation();
  const [updatePersonalInfo] = useCreateOrUpdatePersonalInfoMutation();
  const [updateAddress] = useCreateOrUpdateAddressMutation();
  const [updateBankInfo] = useCreateOrUpdateBankInfoMutation();

  const profileData = useMemo(
    () => completeProfile?.data || completeProfile,
    [completeProfile]
  );
  const statusData = useMemo(
    () => onboardingStatus?.data || onboardingStatus,
    [onboardingStatus]
  );

  const storeInfoForm = useForm<UpdateVendorProfileRequest & { email?: string }>(
    {
      mode: "onChange",
      defaultValues: { storeName: "", email: "" },
    }
  );
  const addressForm = useForm<AddressFormData>({
    mode: "onChange",
    defaultValues: { detailsAddress: "", city: "", zone: "", area: "" },
  });
  const personalInfoForm = useForm<VendorPersonalInfoRequest>({
    mode: "onChange",
    defaultValues: {
      idNumber: "",
      idName: "",
      companyName: "",
      businessRegNo: "",
      taxIdNumber: "",
    },
  });
  const bankInfoForm = useForm<VendorBankInfoRequest>({
    mode: "onChange",
    defaultValues: {
      accountName: "",
      accountNumber: "",
      bankName: "",
      branchName: "",
    },
  });

  useEffect(() => {
    if (profileData && !formsInitialized.current) {
      if (profileData.storeName) {
        storeInfoForm.reset(
          { storeName: profileData.storeName, email: profileData.user?.email || "" },
          { keepDefaultValues: false }
        );
      }
      if (profileData.pickupAddress) {
        const a = profileData.pickupAddress;
        if (a.detailsAddress && a.city && a.zone && a.area) {
          addressForm.reset(
            { detailsAddress: a.detailsAddress, city: a.city, zone: a.zone, area: a.area },
            { keepDefaultValues: false }
          );
          setSelectedLocation({ city: a.city, zone: a.zone, area: a.area });
        }
      }
      if (profileData.accountType) setAccountType(profileData.accountType);
      if (profileData.businessType) setBusinessType(profileData.businessType as BusinessType);
      if (profileData.personalInfo) {
        personalInfoForm.reset(
          {
            idNumber: profileData.personalInfo.idNumber || "",
            idName: profileData.personalInfo.idName || "",
            companyName: profileData.personalInfo.companyName || "",
            businessRegNo: profileData.personalInfo.businessRegNo || "",
            taxIdNumber: profileData.personalInfo.taxIdNumber || "",
          },
          { keepDefaultValues: false }
        );
      }
      if (profileData.bankInfo) {
        bankInfoForm.reset(
          {
            accountName: profileData.bankInfo.accountName || "",
            accountNumber: profileData.bankInfo.accountNumber || "",
            bankName: profileData.bankInfo.bankName || "",
            branchName: profileData.bankInfo.branchName || "",
          },
          { keepDefaultValues: false }
        );
      }
      formsInitialized.current = true;
    }
  }, [profileData]);

  useEffect(() => {
    if (
      statusData &&
      profileData &&
      !statusLoading &&
      !profileLoading &&
      !initialStepDetermined.current
    ) {
      let targetStep: WizardStep = "store-info";
      if (!profileData.storeName) targetStep = "store-info";
      else if (!statusData.addressComplete) targetStep = "address";
      else if (!profileData.accountType) targetStep = "account-type";
      else if (!statusData.documentsComplete) targetStep = "documents";
      else if (!statusData.bankInfoComplete) targetStep = "bank-info";
      else if (statusData.overallComplete) {
        onComplete?.();
        initialStepDetermined.current = true;
        return;
      }
      setCurrentStep(targetStep);
      initialStepDetermined.current = true;
    }
  }, [statusData, profileData, statusLoading, profileLoading]);

  const clearError = (field: string) => {
    setErrors((prev) => {
      if (prev[field]) {
        const n = { ...prev };
        delete n[field];
        return n;
      }
      return prev;
    });
  };

  const handleAvatarChange = (file: File | null) => setAvatarFile(file);

  const isStepCompleted = (step: WizardStep): boolean => {
    if (!profileData || !statusData) return false;
    switch (step) {
      case "store-info":   return !!profileData.storeName;
      case "address":      return statusData.addressComplete || false;
      case "account-type": return !!profileData.accountType;
      case "documents":    return statusData.documentsComplete || false;
      case "bank-info":    return statusData.bankInfoComplete || false;
      default:             return false;
    }
  };

  const handleStepNavigation = (step: WizardStep) => {
    if (isStepCompleted(step) || step === currentStep) {
      if (editMode[currentStep]) {
        setEditMode((prev) => ({ ...prev, [currentStep]: false }));
      }
      setCurrentStep(step);
      setErrors({});
    }
  };

  const toggleEditMode = (step: WizardStep) => {
    setEditMode((prev) => ({ ...prev, [step]: !prev[step] }));
  };

  const handleStep1Submit = async (
    data: UpdateVendorProfileRequest & { email?: string },
    avatarFile?: File | null
  ) => {
    setIsSubmitting(true);
    setErrors({});
    try {
      const formData = new FormData();
      formData.append("storeName", data.storeName || "");
      if (avatarFile) formData.append("avatar", avatarFile);
      await updateVendorProfile({ id: vendorId, formData }).unwrap();
      await new Promise((r) => setTimeout(r, 800));
      await Promise.all([refetchVendor(), refetchOnboarding(), refetchProfile()]);
      if (editMode["store-info"]) {
        setEditMode((prev) => ({ ...prev, "store-info": false }));
      } else {
        setCurrentStep("address");
      }
    } catch (error: any) {
      setErrors({ submit: error?.message || error?.data?.message || "Failed to update store information." });
    } finally {
      setIsSubmitting(false);
    }
  };

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
      await updateAddress({ vendorId, data: addressData }).unwrap();
      await new Promise((r) => setTimeout(r, 800));
      await Promise.all([refetchOnboarding(), refetchProfile(), refetchVendor()]);
      if (editMode["address"]) {
        setEditMode((prev) => ({ ...prev, address: false }));
      } else {
        setCurrentStep("account-type");
      }
    } catch (error: any) {
      setErrors({ submit: error?.data?.message || "Failed to update address information." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAccountTypeNext = async () => {
    await refetchProfile();
    if (editMode["account-type"]) {
      setEditMode((prev) => ({ ...prev, "account-type": false }));
    } else {
      setCurrentStep("documents");
    }
  };

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
      if (payload.businessType) setBusinessType(payload.businessType);
      await new Promise((r) => setTimeout(r, 800));
      await Promise.all([refetchOnboarding(), refetchProfile(), refetchVendor()]);
      if (editMode["documents"]) {
        setEditMode((prev) => ({ ...prev, documents: false }));
      } else {
        setCurrentStep("bank-info");
      }
    } catch (error: any) {
      setErrors({ submit: error?.data?.message || "Failed to complete document step." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinalSubmit = async () => {
    const bankData = bankInfoForm.getValues();
    if (!bankData.accountName || !bankData.accountNumber || !bankData.bankName || !bankData.branchName) {
      setErrors({ submit: "Please complete all bank information fields" });
      return;
    }
    setIsSubmitting(true);
    setErrors({});
    try {
      await updateBankInfo({ vendorId, data: bankData }).unwrap();
      await Promise.all([refetchOnboarding(), refetchProfile(), refetchVendor()]);
      if (editMode["bank-info"]) {
        setEditMode((prev) => ({ ...prev, "bank-info": false }));
      } else {
        onComplete?.();
      }
    } catch (error: any) {
      setErrors({ submit: error?.data?.message || "Failed to update bank information." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStepStatus = (stepKey: WizardStep) => {
    if (isStepCompleted(stepKey)) return "completed";
    if (stepKey === currentStep) return "current";
    return "pending";
  };

  const calculateProgress = () => {
    if (!statusData || !profileData) return 0;
    let completed = 0;
    if (profileData.storeName) completed++;
    if (statusData.addressComplete) completed++;
    if (profileData.accountType) completed++;
    if (statusData.documentsComplete) completed++;
    if (statusData.bankInfoComplete) completed++;
    return (completed / 5) * 100;
  };

  const progress = calculateProgress();
  const isLoading = vendorLoading || statusLoading || profileLoading;

  // ── Completed step summary card (indigo/violet theme) ──
  const renderStepSummary = (step: WizardStep) => {
    if (!profileData) return null;

    let title = "";
    let content: React.ReactNode = null;

    switch (step) {
      case "store-info":
        title = "Store Information";
        content = (
          <div className="flex items-center gap-3">
            {profileData.avatar && (
              <img
                src={profileData.avatar}
                alt="Store avatar"
                className="w-12 h-12 rounded-full object-cover border-2 border-[#c7d2fe]"
              />
            )}
            <div>
              <p className="text-xs text-[#6d28d9] font-medium mb-0.5">Store Name</p>
              <p className="text-sm font-semibold text-[#1e1b4b]">{profileData.storeName}</p>
            </div>
          </div>
        );
        break;

      case "address":
        title = "Pickup Address";
        const addr = profileData.pickupAddress;
        content = addr ? (
          <div className="space-y-2">
            <div>
              <p className="text-xs text-[#6d28d9] font-medium mb-0.5">Location</p>
              <p className="text-sm font-semibold text-[#1e1b4b]">
                {addr.area}, {addr.zone}, {addr.city}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#6d28d9] font-medium mb-0.5">Detailed Address</p>
              <p className="text-sm text-[#3730a3]">{addr.detailsAddress}</p>
            </div>
          </div>
        ) : null;
        break;

      case "account-type":
        title = "Account Type";
        content = (
          <div className="space-y-2">
            <div>
              <p className="text-xs text-[#6d28d9] font-medium mb-0.5">Account Type</p>
              <p className="text-sm font-semibold text-[#1e1b4b]">{profileData.accountType}</p>
            </div>
            {profileData.businessType && (
              <div>
                <p className="text-xs text-[#6d28d9] font-medium mb-0.5">Business Type</p>
                <p className="text-sm font-semibold text-[#1e1b4b]">{profileData.businessType}</p>
              </div>
            )}
          </div>
        );
        break;

      case "documents":
        title = "Documents";
        content = (
          <p className="text-sm text-[#3730a3]">
            {profileData.documents?.length || 0} document(s) uploaded
          </p>
        );
        break;

      case "bank-info":
        title = "Bank Information";
        const bank = profileData.bankInfo;
        content = bank ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <p className="text-xs text-[#6d28d9] font-medium mb-0.5">Account Name</p>
              <p className="text-sm font-semibold text-[#1e1b4b]">{bank.accountName}</p>
            </div>
            <div>
              <p className="text-xs text-[#6d28d9] font-medium mb-0.5">Bank Name</p>
              <p className="text-sm text-[#3730a3]">{bank.bankName}</p>
            </div>
            <div>
              <p className="text-xs text-[#6d28d9] font-medium mb-0.5">Account Number</p>
              <p className="text-sm text-[#3730a3]">****{bank.accountNumber?.slice(-4)}</p>
            </div>
          </div>
        ) : null;
        break;
    }

    return (
      <div className="relative mb-6 rounded-xl border border-[#c7d2fe] bg-[#eef2ff] p-5 overflow-hidden">
        {/* Decorative left accent bar */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
          style={{ background: "linear-gradient(180deg,#4f46e5,#7c3aed)" }}
        />

        <div className="flex items-start justify-between pl-3">
          <div className="flex-1">
            {/* Header row */}
            <div className="flex items-center gap-2 mb-3">
              {/* Checkmark circle */}
              <div
                className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full"
                style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)" }}
              >
                <svg
                  className="h-4 w-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  viewBox="0 0 24 24"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h3 className="text-[15px] font-semibold text-[#1e1b4b]">
                {title}{" "}
                <span
                  className="ml-1 rounded-md px-2 py-0.5 text-[10px] font-medium"
                  style={{ background: "#ede9fe", color: "#5b21b6" }}
                >
                  Completed
                </span>
              </h3>
            </div>
            {content}
          </div>

          {/* Edit button */}
          <button
            type="button"
            onClick={() => toggleEditMode(step)}
            className="ml-4 flex flex-shrink-0 items-center gap-1.5 rounded-lg border border-[#c7d2fe] bg-white px-3.5 py-2 text-xs font-medium text-[#4338ca] transition-all hover:border-[#4f46e5] hover:bg-[#eef2ff] active:scale-95"
          >
            {editMode[step] ? (
              <>
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancel
              </>
            ) : (
              <>
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  if (isLoading) return <LoadingState />;

  return (
    <div className="mx-auto max-w-7xl p-6">
      {/* Page background card */}
      <div className="rounded-2xl border border-[#e0e0f0] bg-white shadow-[0_2px_24px_rgba(79,70,229,0.07)]">

        {/* Wizard Progress */}
        <div className="px-6 pt-6">
          <WizardProgress
            progress={progress}
            currentStep={currentStep}
            getStepStatus={getStepStatus}
            onStepClick={handleStepNavigation}
          />
        </div>

        {/* Error banner */}
        {errors.submit && (
          <div className="mx-6 mb-5 flex items-start gap-3 rounded-xl border border-[#fca5a5] bg-[#fef2f2] p-4">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#fee2e2]">
              <svg
                className="h-4 w-4 text-[#dc2626]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-[#991b1b]">Something went wrong</p>
              <p className="mt-0.5 text-xs text-[#dc2626]">{errors.submit}</p>
            </div>
          </div>
        )}

        {/* Step content area */}
        <div className="border-t border-[#e0e0f0] px-6 pb-6 pt-6">

          {/* ── Store Info ── */}
          {currentStep === "store-info" && (
            <>
              {isStepCompleted("store-info") && !editMode["store-info"]
                ? renderStepSummary("store-info")
                : (
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

          {/* ── Address ── */}
          {currentStep === "address" && (
            <>
              {isStepCompleted("address") && !editMode["address"]
                ? renderStepSummary("address")
                : (
                  <AddressStep
                    form={addressForm}
                    onSubmit={handleStep2Submit}
                    isSubmitting={isSubmitting}
                    onBack={() => setCurrentStep("store-info")}
                    onClearError={clearError}
                    onLocationSelected={setSelectedLocation}
                    selectedLocation={selectedLocation}
                    existingAddress={profileData?.pickupAddress}
                  />
                )}
            </>
          )}

          {/* ── Account Type ── */}
          {currentStep === "account-type" && (
            <>
              {isStepCompleted("account-type") && !editMode["account-type"]
                ? renderStepSummary("account-type")
                : (
                  <AccountTypeStep
                    accountType={accountType}
                    onAccountTypeChange={setAccountType}
                    onNext={handleAccountTypeNext}
                    onBack={() => setCurrentStep("address")}
                    showBackButton={true}
                    vendorId={vendorId}
                    completeProfile={profileData}
                  />
                )}
            </>
          )}

          {/* ── Documents ── */}
          {currentStep === "documents" && (
            <>
              {isStepCompleted("documents") && !editMode["documents"]
                ? renderStepSummary("documents")
                : (
                  <DocumentsStep
                    accountType={accountType}
                    businessType={businessType}
                    vendorId={vendorId}
                    onDocumentsChange={setDocuments}
                    onBusinessTypeChange={setBusinessType}
                    onSubmit={handleDocumentsSubmit}
                    isSubmitting={isSubmitting}
                    onBack={() => setCurrentStep("account-type")}
                    onClearError={clearError}
                    existingPersonalInfo={profileData?.personalInfo}
                    existingBankInfo={profileData?.bankInfo}
                    completeProfile={profileData}
                  />
                )}
            </>
          )}

          {/* ── Bank Info ── */}
          {currentStep === "bank-info" && (
            <>
              {isStepCompleted("bank-info") && !editMode["bank-info"]
                ? renderStepSummary("bank-info")
                : (
                  <BankInfoStep
                    personalForm={personalInfoForm}
                    bankForm={bankInfoForm}
                    onSubmit={handleFinalSubmit}
                    isSubmitting={isSubmitting}
                    onBack={() => setCurrentStep("documents")}
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
    </div>
  );
};

export default OnboardingWizard;