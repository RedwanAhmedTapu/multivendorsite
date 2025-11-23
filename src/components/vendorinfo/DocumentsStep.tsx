// ============================================
// components/vendor/steps/DocumentsStep.tsx
// ============================================
import React, { useState, useEffect } from 'react';
import { 
  VendorDocument, 
  useUploadDocumentsMutation,
  useDeleteDocumentMutation,
  useGetDocumentsQuery,
  useCreateOrUpdatePersonalInfoMutation,
  useUpdateVendorProfileMutation
} from '@/features/vendorManageApi';
import FileUploadField from './FileUploadField';

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

interface DocumentsStepProps {
  accountType: 'INDIVIDUAL' | 'BUSINESS';
  businessType?: 'PROPRIETORSHIP' | 'LIMITED_COMPANY' | 'PARTNERSHIP_FIRM' | null;
  vendorId: string;
  onDocumentsChange?: (docs: DocumentUploadData) => void;
  onBusinessTypeChange?: (businessType: 'PROPRIETORSHIP' | 'LIMITED_COMPANY' | 'PARTNERSHIP_FIRM') => void;
  onSubmit: (payload: {
    documents: DocumentUploadData;
    businessType?: 'PROPRIETORSHIP' | 'LIMITED_COMPANY' | 'PARTNERSHIP_FIRM';
    personalInfo: {
      idNumber?: string;
      idName?: string;
      companyName?: string;
      businessRegNo?: string;
      taxIdNumber?: string;
    };
  }) => void;
  isSubmitting: boolean;
  onBack: () => void;
  showBackButton?: boolean;
  onClearError: (field: string) => void;
  existingPersonalInfo?: any;
  existingBankInfo?: any;
  completeProfile?: any;
}

const DOCUMENT_FIELD_MAP: Record<string, string> = {
  'NATIONAL_ID_FRONT': 'nationalIdFront',
  'NATIONAL_ID_BACK': 'nationalIdBack',
  'PASSPORT_FRONT': 'passportFront',
  'PASSPORT_BACK': 'passportBack',
  'TRADE_LICENSE': 'tradeLicense',
  'RJSC_REGISTRATION': 'rjscRegistration',
  'TIN_CERTIFICATE': 'tinCertificate',
  'VAT_CERTIFICATE': 'vatCertificate',
  'OTHER': 'otherDocument'
};

const DocumentsStep: React.FC<DocumentsStepProps> = ({
  accountType,
  businessType: propBusinessType,
  vendorId,
  onDocumentsChange,
  onBusinessTypeChange,
  onSubmit,
  isSubmitting,
  onBack,
  showBackButton = true,
  onClearError,
  existingPersonalInfo,
  existingBankInfo,
  completeProfile
}) => {
  const { data: documentsResponse, refetch: refetchDocuments, isLoading: documentsLoading } = useGetDocumentsQuery(vendorId);
  const [uploadDocuments] = useUploadDocumentsMutation();
  const [deleteDocument] = useDeleteDocumentMutation();
  const [updatePersonalInfo] = useCreateOrUpdatePersonalInfoMutation();
  const [updateVendorProfile] = useUpdateVendorProfileMutation();

  const [selectedDocumentType, setSelectedDocumentType] = useState<'NID' | 'PASSPORT'>('NID');
  const [uploadedFiles, setUploadedFiles] = useState<DocumentUploadData>({});
  const [fileErrors, setFileErrors] = useState<{[key: string]: boolean}>({});
  const [selectedBusinessType, setSelectedBusinessType] = useState<'PROPRIETORSHIP' | 'LIMITED_COMPANY' | 'PARTNERSHIP_FIRM' | null>(propBusinessType || null);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);
  const [isSavingBusinessType, setIsSavingBusinessType] = useState(false);
  
  const [personalInfo, setPersonalInfo] = useState({
    idNumber: existingPersonalInfo?.idNumber || '',
    idName: existingPersonalInfo?.idName || '',
    companyName: existingPersonalInfo?.companyName || '',
    businessRegNo: existingPersonalInfo?.businessRegNo || '',
    taxIdNumber: existingPersonalInfo?.taxIdNumber || ''
  });

  // Process documents response properly
  const existingDocuments = React.useMemo(() => {
    if (!documentsResponse) return [];
    
    // Handle different response structures
    if (Array.isArray(documentsResponse)) {
      return documentsResponse;
    } 
    
    console.log('📄 Documents response structure:', documentsResponse);
    return [];
  }, [documentsResponse]);

  // Set business type from props
  useEffect(() => {
    if (propBusinessType && accountType === 'BUSINESS') {
      setSelectedBusinessType(propBusinessType);
    }
  }, [propBusinessType, accountType]);

  // Set personal info from existing data
  useEffect(() => {
    if (existingPersonalInfo) {
      setPersonalInfo({
        idNumber: existingPersonalInfo.idNumber || '',
        idName: existingPersonalInfo.idName || '',
        companyName: existingPersonalInfo.companyName || '',
        businessRegNo: existingPersonalInfo.businessRegNo || '',
        taxIdNumber: existingPersonalInfo.taxIdNumber || ''
      });
    }
  }, [existingPersonalInfo]);

  // Auto-select document type based on existing documents
  useEffect(() => {
    if (existingDocuments.length > 0 && accountType === 'INDIVIDUAL') {
      const hasPassport = existingDocuments.some(doc => 
        doc.type === 'PASSPORT_FRONT' || doc.type === 'PASSPORT_BACK'
      );
      const hasNID = existingDocuments.some(doc => 
        doc.type === 'NATIONAL_ID_FRONT' || doc.type === 'NATIONAL_ID_BACK'
      );
      
      if (hasPassport) setSelectedDocumentType('PASSPORT');
      else if (hasNID) setSelectedDocumentType('NID');
    }
  }, [existingDocuments, accountType]);

  const getDocumentTypeFromKey = (key: keyof DocumentUploadData): string => {
  const typeMap = {
    nidFront: 'NATIONAL_ID_FRONT',
    nidBack: 'NATIONAL_ID_BACK',
    passportFront: 'PASSPORT_FRONT',
    passportBack: 'PASSPORT_BACK',
    tradeLicense: 'TRADE_LICENSE',
    rjscRegistration: 'RJSC_REGISTRATION',
    tinCertificate: 'TIN_CERTIFICATE',
    vatCertificate: 'VAT_CERTIFICATE',
    otherDocument: 'OTHER'
  } as const;
  
  return typeMap[key];
};

  const isDocumentAllowedForAccountType = (documentType: string): boolean => {
    if (accountType === 'INDIVIDUAL') {
      const allowedTypes = [
        'NATIONAL_ID_FRONT', 'NATIONAL_ID_BACK', 
        'PASSPORT_FRONT', 'PASSPORT_BACK'
      ];
      return allowedTypes.includes(documentType);
    }
    return true;
  };

  const handleFileChange = (key: keyof DocumentUploadData, file: File | null) => {
    const newFiles = { ...uploadedFiles };
    const newErrors = { ...fileErrors };
    
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size exceeds 5MB limit. Please select a smaller file.');
        newErrors[key] = true;
        setFileErrors(newErrors);
        return;
      }
      newFiles[key] = file;
      delete newErrors[key];
    } else {
      delete newFiles[key];
      delete newErrors[key];
    }
    
    setUploadedFiles(newFiles);
    setFileErrors(newErrors);
    onDocumentsChange?.(newFiles);
    onClearError('submit');
  };

  const handleUploadFile = async (fieldKey: keyof DocumentUploadData) => {
    const file = uploadedFiles[fieldKey];
    if (!file) return;

    const documentType = getDocumentTypeFromKey(fieldKey);
    
    if (!isDocumentAllowedForAccountType(documentType)) {
      alert(`This document type is not allowed for ${accountType.toLowerCase()} accounts.`);
      return;
    }

    try {
      setUploadingField(fieldKey);
      const formData = new FormData();
      const uploadFieldName = DOCUMENT_FIELD_MAP[documentType];
      formData.append(uploadFieldName, file);

      console.log(`📤 Uploading document: ${documentType}`, { fieldKey, uploadFieldName });

      await uploadDocuments({ vendorId, files: formData }).unwrap();

      // Clear the file from local state after successful upload
      const newFiles = { ...uploadedFiles };
      delete newFiles[fieldKey];
      setUploadedFiles(newFiles);
      
      // Refetch documents to get updated list
      await refetchDocuments();
      console.log('✅ Document uploaded successfully!');
      
    } catch (error: any) {
      console.error('❌ Upload error:', error);
      const errorMessage = error.data?.message || error.message || 'Unknown upload error';
      alert(`Upload failed: ${errorMessage}`);
    } finally {
      setUploadingField(null);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      setDeletingDocId(documentId);
      await deleteDocument(documentId).unwrap();
      await refetchDocuments();
      console.log('✅ Document deleted successfully!');
    } catch (error: any) {
      console.error('❌ Delete error:', error);
      const errorMessage = error.data?.message || error.message || 'Unknown delete error';
      alert(`Delete failed: ${errorMessage}`);
    } finally {
      setDeletingDocId(null);
    }
  };

  const handleBusinessTypeChange = async (type: 'PROPRIETORSHIP' | 'LIMITED_COMPANY' | 'PARTNERSHIP_FIRM') => {
    setSelectedBusinessType(type);
    onBusinessTypeChange?.(type);
    onClearError('businessType');

    // Save business type to vendor profile
    if (accountType === 'BUSINESS') {
      try {
        setIsSavingBusinessType(true);
        const formData = new FormData();
        formData.append('businessType', type);
        
        await updateVendorProfile({
          id: vendorId,
          formData: formData
        }).unwrap();
        
        console.log('✅ Business type saved:', type);
      } catch (error: any) {
        console.error('❌ Failed to save business type:', error);
        alert('Failed to save business type. Please try again.');
      } finally {
        setIsSavingBusinessType(false);
      }
    }
  };

  const handlePersonalInfoChange = (field: keyof typeof personalInfo, value: string) => {
    setPersonalInfo(prev => ({ ...prev, [field]: value }));
    onClearError(field);
  };

  const getExistingDocument = (type: string): VendorDocument | undefined => {
    return existingDocuments.find(doc => doc?.type === type);
  };

  const getDocumentRequirements = () => {
    if (accountType === 'INDIVIDUAL') {
      return {
        nidFront: { required: selectedDocumentType === 'NID', label: 'NID Front Side' },
        nidBack: { required: selectedDocumentType === 'NID', label: 'NID Back Side' },
        passportFront: { required: selectedDocumentType === 'PASSPORT', label: 'Passport Front' },
        passportBack: { required: false, label: 'Passport Back' }
      };
    }

    // Business account requirements
    switch (selectedBusinessType) {
      case 'PROPRIETORSHIP':
        return {
          nidFront: { required: true, label: 'Owner NID Front' },
          nidBack: { required: true, label: 'Owner NID Back' },
          tradeLicense: { required: true, label: 'Trade License' },
          rjscRegistration: { required: true, label: 'RJSC Registration' },
          tinCertificate: { required: false, label: 'TIN Certificate' },
          vatCertificate: { required: false, label: 'VAT Certificate' },
          otherDocument: { required: false, label: 'Other Document' }
        };
      case 'LIMITED_COMPANY':
      case 'PARTNERSHIP_FIRM':
        return {
          nidFront: { required: true, label: 'Owner NID Front' },
          nidBack: { required: true, label: 'Owner NID Back' },
          tradeLicense: { required: true, label: 'Trade License' },
          rjscRegistration: { required: true, label: 'RJSC Registration' },
          tinCertificate: { required: true, label: 'TIN Certificate' },
          vatCertificate: { required: true, label: 'VAT Certificate' },
          otherDocument: { required: false, label: 'Other Document' }
        };
      default:
        return {};
    }
  };

  const hasRequiredDocuments = (): boolean => {
    const requirements = getDocumentRequirements();
    
    if (accountType === 'INDIVIDUAL') {
      if (selectedDocumentType === 'NID') {
        return !!(getExistingDocument('NATIONAL_ID_FRONT') && getExistingDocument('NATIONAL_ID_BACK'));
      } else {
        return !!getExistingDocument('PASSPORT_FRONT');
      }
    } else {
      // For business accounts, check if all required documents are uploaded
      return Object.entries(requirements).every(([key, requirement]) => {
        if (requirement.required) {
          const documentType = getDocumentTypeFromKey(key as keyof DocumentUploadData);
          return !!getExistingDocument(documentType);
        }
        return true;
      });
    }
  };

  const hasRequiredPersonalInfo = (): boolean => {
    if (accountType === 'INDIVIDUAL') {
      return !!(personalInfo.idNumber && personalInfo.idName);
    } else {
      return !!(personalInfo.companyName && personalInfo.businessRegNo);
    }
  };

  const handleDocumentTypeChange = (type: 'NID' | 'PASSPORT') => {
    setSelectedDocumentType(type);
    const newFiles = { ...uploadedFiles };
    
    // Clear files from the other document type
    if (type === 'NID') {
      delete newFiles.passportFront;
      delete newFiles.passportBack;
    } else {
      delete newFiles.nidFront;
      delete newFiles.nidBack;
    }
    
    setUploadedFiles(newFiles);
    onDocumentsChange?.(newFiles);
  };

  const getUploadStatus = () => {
    const requirements = getDocumentRequirements();
    let requiredCount = 0;
    let completedCount = 0;

    if (accountType === 'INDIVIDUAL') {
      if (selectedDocumentType === 'NID') {
        requiredCount = 2;
        completedCount = (getExistingDocument('NATIONAL_ID_FRONT') ? 1 : 0) + 
                        (getExistingDocument('NATIONAL_ID_BACK') ? 1 : 0);
      } else {
        requiredCount = 1;
        completedCount = getExistingDocument('PASSPORT_FRONT') ? 1 : 0;
      }
    } else {
      Object.entries(requirements).forEach(([key, requirement]) => {
        if (requirement.required) {
          requiredCount++;
          const documentType = getDocumentTypeFromKey(key as keyof DocumentUploadData);
          if (getExistingDocument(documentType)) completedCount++;
        }
      });
    }

    return { 
      complete: completedCount === requiredCount && requiredCount > 0,
      message: `${completedCount} of ${requiredCount} required documents uploaded`,
      progress: `${completedCount}/${requiredCount}`
    };
  };

  const handleSubmit = async () => {
    if (!hasRequiredDocuments()) {
      alert('Please upload all required documents before continuing.');
      return;
    }

    if (!hasRequiredPersonalInfo()) {
      alert('Please complete all required personal/business information fields.');
      return;
    }

    if (accountType === 'BUSINESS' && !selectedBusinessType) {
      alert('Please select your business type.');
      return;
    }

    try {
      // Save personal information first
      await updatePersonalInfo({
        vendorId,
        data: {
          ...(accountType === 'INDIVIDUAL' && {
            idNumber: personalInfo.idNumber,
            idName: personalInfo.idName
          }),
          ...(accountType === 'BUSINESS' && {
            companyName: personalInfo.companyName,
            businessRegNo: personalInfo.businessRegNo,
            taxIdNumber: personalInfo.taxIdNumber
          })
        }
      }).unwrap();

      console.log('✅ Personal info saved successfully');

      // Call parent onSubmit with the payload
      onSubmit({
        documents: uploadedFiles,
        businessType: selectedBusinessType || undefined,
        personalInfo: {
          ...(accountType === 'INDIVIDUAL' && {
            idNumber: personalInfo.idNumber,
            idName: personalInfo.idName
          }),
          ...(accountType === 'BUSINESS' && {
            companyName: personalInfo.companyName,
            businessRegNo: personalInfo.businessRegNo,
            taxIdNumber: personalInfo.taxIdNumber
          })
        }
      });

    } catch (error: any) {
      console.error('❌ Error saving information:', error);
      const errorMessage = error.data?.message || error.message || 'Unknown error';
      alert(`Failed to save information: ${errorMessage}`);
    }
  };

  const uploadStatus = getUploadStatus();

  if (documentsLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {accountType === 'INDIVIDUAL' ? 'Identity Verification' : 'Business Verification'}
        </h2>
        <p className="text-gray-600">
          {accountType === 'INDIVIDUAL' 
            ? 'Upload your identification documents for verification'
            : 'Upload your business registration documents and owner identification'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal/Business Information Section */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {accountType === 'INDIVIDUAL' ? 'Personal Information' : 'Business Information'}
            </h3>
            
            {accountType === 'INDIVIDUAL' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ID Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={personalInfo.idNumber}
                    onChange={(e) => handlePersonalInfoChange('idNumber', e.target.value)}
                    placeholder="Enter your National ID or Passport number"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {existingPersonalInfo?.idNumber && (
                    <p className="text-xs text-green-600 mt-1">Current: {existingPersonalInfo.idNumber}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name (as on ID) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={personalInfo.idName}
                    onChange={(e) => handlePersonalInfoChange('idName', e.target.value)}
                    placeholder="Enter your name as it appears on your ID"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {existingPersonalInfo?.idName && (
                    <p className="text-xs text-green-600 mt-1">Current: {existingPersonalInfo.idName}</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={personalInfo.companyName}
                    onChange={(e) => handlePersonalInfoChange('companyName', e.target.value)}
                    placeholder="Enter your registered company name"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {existingPersonalInfo?.companyName && (
                    <p className="text-xs text-green-600 mt-1">Current: {existingPersonalInfo.companyName}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Registration Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={personalInfo.businessRegNo}
                    onChange={(e) => handlePersonalInfoChange('businessRegNo', e.target.value)}
                    placeholder="Enter your business registration number"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {existingPersonalInfo?.businessRegNo && (
                    <p className="text-xs text-green-600 mt-1">Current: {existingPersonalInfo.businessRegNo}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tax ID Number (TIN) <span className="text-gray-400 text-xs">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={personalInfo.taxIdNumber}
                    onChange={(e) => handlePersonalInfoChange('taxIdNumber', e.target.value)}
                    placeholder="Enter your Tax Identification Number"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {existingPersonalInfo?.taxIdNumber && (
                    <p className="text-xs text-green-600 mt-1">Current: {existingPersonalInfo.taxIdNumber}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Business Type Selection */}
          {accountType === 'BUSINESS' && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Business Type <span className="text-red-500">*</span>
                {isSavingBusinessType && (
                  <span className="ml-2 text-sm text-blue-600">Saving...</span>
                )}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(['PROPRIETORSHIP', 'LIMITED_COMPANY', 'PARTNERSHIP_FIRM'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleBusinessTypeChange(type)}
                    disabled={isSavingBusinessType}
                    className={`p-4 text-center border-2 rounded-lg transition-all font-medium ${
                      selectedBusinessType === type
                        ? 'border-blue-600 bg-blue-600 text-white shadow-md transform scale-105'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-blue-400 hover:shadow-sm'
                    } ${isSavingBusinessType ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {type.replace('_', ' ')}
                    {completeProfile?.businessType === type && (
                      <div className="text-xs mt-1 text-blue-200">Current</div>
                    )}
                  </button>
                ))}
              </div>
              {!selectedBusinessType && (
                <p className="text-red-500 text-sm mt-2">Please select your business type</p>
              )}
            </div>
          )}

          {/* Document Upload Sections */}
          <div className="space-y-6">
            {accountType === 'INDIVIDUAL' ? (
              <>
                {/* Document Type Selection */}
                <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Document Type</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => handleDocumentTypeChange('NID')}
                      className={`p-5 text-center border-2 rounded-lg transition-all ${
                        selectedDocumentType === 'NID'
                          ? 'border-blue-600 bg-blue-50 shadow-md'
                          : 'border-gray-300 bg-white hover:border-blue-300 hover:shadow-sm'
                      }`}
                    >
                      <div className={`text-lg font-semibold mb-1 ${selectedDocumentType === 'NID' ? 'text-blue-700' : 'text-gray-900'}`}>
                        National ID Card
                      </div>
                      <div className={`text-sm ${selectedDocumentType === 'NID' ? 'text-blue-600' : 'text-gray-600'}`}>
                        Upload both sides of your NID
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDocumentTypeChange('PASSPORT')}
                      className={`p-5 text-center border-2 rounded-lg transition-all ${
                        selectedDocumentType === 'PASSPORT'
                          ? 'border-blue-600 bg-blue-50 shadow-md'
                          : 'border-gray-300 bg-white hover:border-blue-300 hover:shadow-sm'
                      }`}
                    >
                      <div className={`text-lg font-semibold mb-1 ${selectedDocumentType === 'PASSPORT' ? 'text-blue-700' : 'text-gray-900'}`}>
                        Passport
                      </div>
                      <div className={`text-sm ${selectedDocumentType === 'PASSPORT' ? 'text-blue-600' : 'text-gray-600'}`}>
                        Upload passport photo page
                      </div>
                    </button>
                  </div>
                </div>

                {/* NID Documents */}
                {selectedDocumentType === 'NID' && (
                  <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-5">National ID Card</h3>
                    <div className="space-y-5">
                      <FileUploadField
                        label="NID Front Side"
                        accept="image/*,.pdf"
                        file={uploadedFiles.nidFront}
                        onChange={(file) => handleFileChange('nidFront', file)}
                        onUpload={() => handleUploadFile('nidFront')}
                        onDelete={() => {
                          const doc = getExistingDocument('NATIONAL_ID_FRONT');
                          if (doc) handleDeleteDocument(doc.id);
                        }}
                        required
                        description="Clear photo of the front side of your National ID"
                        existingDocument={getExistingDocument('NATIONAL_ID_FRONT')}
                        isUploading={uploadingField === 'nidFront'}
                        isDeleting={deletingDocId === getExistingDocument('NATIONAL_ID_FRONT')?.id}
                        error={fileErrors.nidFront}
                      />
                      <FileUploadField
                        label="NID Back Side"
                        accept="image/*,.pdf"
                        file={uploadedFiles.nidBack}
                        onChange={(file) => handleFileChange('nidBack', file)}
                        onUpload={() => handleUploadFile('nidBack')}
                        onDelete={() => {
                          const doc = getExistingDocument('NATIONAL_ID_BACK');
                          if (doc) handleDeleteDocument(doc.id);
                        }}
                        required
                        description="Clear photo of the back side of your National ID"
                        existingDocument={getExistingDocument('NATIONAL_ID_BACK')}
                        isUploading={uploadingField === 'nidBack'}
                        isDeleting={deletingDocId === getExistingDocument('NATIONAL_ID_BACK')?.id}
                        error={fileErrors.nidBack}
                      />
                    </div>
                  </div>
                )}

                {/* Passport Documents */}
                {selectedDocumentType === 'PASSPORT' && (
                  <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-5">Passport</h3>
                    <div className="space-y-5">
                      <FileUploadField
                        label="Passport Photo Page"
                        accept="image/*,.pdf"
                        file={uploadedFiles.passportFront}
                        onChange={(file) => handleFileChange('passportFront', file)}
                        onUpload={() => handleUploadFile('passportFront')}
                        onDelete={() => {
                          const doc = getExistingDocument('PASSPORT_FRONT');
                          if (doc) handleDeleteDocument(doc.id);
                        }}
                        required
                        description="Clear photo of the photo page of your passport"
                        existingDocument={getExistingDocument('PASSPORT_FRONT')}
                        isUploading={uploadingField === 'passportFront'}
                        isDeleting={deletingDocId === getExistingDocument('PASSPORT_FRONT')?.id}
                        error={fileErrors.passportFront}
                      />
                      <FileUploadField
                        label="Passport Back Page"
                        accept="image/*,.pdf"
                        file={uploadedFiles.passportBack}
                        onChange={(file) => handleFileChange('passportBack', file)}
                        onUpload={() => handleUploadFile('passportBack')}
                        onDelete={() => {
                          const doc = getExistingDocument('PASSPORT_BACK');
                          if (doc) handleDeleteDocument(doc.id);
                        }}
                        description="Back page of passport if it contains additional information"
                        existingDocument={getExistingDocument('PASSPORT_BACK')}
                        isUploading={uploadingField === 'passportBack'}
                        isDeleting={deletingDocId === getExistingDocument('PASSPORT_BACK')?.id}
                        error={fileErrors.passportBack}
                      />
                    </div>
                  </div>
                )}
              </>
            ) : (
              // BUSINESS ACCOUNT DOCUMENTS
              selectedBusinessType && (
                <>
                  {/* Owner Identification */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                    <div className="flex items-center mb-5">
                      <div className="w-1 h-6 bg-blue-600 rounded-full mr-3"></div>
                      <h3 className="text-lg font-semibold text-gray-900">Owner Identification</h3>
                    </div>
                    <div className="space-y-5">
                      <FileUploadField
                        label="Owner NID Front Side"
                        accept="image/*,.pdf"
                        file={uploadedFiles.nidFront}
                        onChange={(file) => handleFileChange('nidFront', file)}
                        onUpload={() => handleUploadFile('nidFront')}
                        onDelete={() => {
                          const doc = getExistingDocument('NATIONAL_ID_FRONT');
                          if (doc) handleDeleteDocument(doc.id);
                        }}
                        required
                        description="Clear photo of the front side of owner's National ID"
                        existingDocument={getExistingDocument('NATIONAL_ID_FRONT')}
                        isUploading={uploadingField === 'nidFront'}
                        isDeleting={deletingDocId === getExistingDocument('NATIONAL_ID_FRONT')?.id}
                        error={fileErrors.nidFront}
                      />
                      <FileUploadField
                        label="Owner NID Back Side"
                        accept="image/*,.pdf"
                        file={uploadedFiles.nidBack}
                        onChange={(file) => handleFileChange('nidBack', file)}
                        onUpload={() => handleUploadFile('nidBack')}
                        onDelete={() => {
                          const doc = getExistingDocument('NATIONAL_ID_BACK');
                          if (doc) handleDeleteDocument(doc.id);
                        }}
                        required
                        description="Clear photo of the back side of owner's National ID"
                        existingDocument={getExistingDocument('NATIONAL_ID_BACK')}
                        isUploading={uploadingField === 'nidBack'}
                        isDeleting={deletingDocId === getExistingDocument('NATIONAL_ID_BACK')?.id}
                        error={fileErrors.nidBack}
                      />
                    </div>
                  </div>

                  {/* Business Documents */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                    <div className="flex items-center mb-5">
                      <div className="w-1 h-6 bg-green-600 rounded-full mr-3"></div>
                      <h3 className="text-lg font-semibold text-gray-900">Business Documents</h3>
                    </div>
                    <div className="space-y-5">
                      <FileUploadField
                        label="Trade License"
                        accept="image/*,.pdf"
                        file={uploadedFiles.tradeLicense}
                        onChange={(file) => handleFileChange('tradeLicense', file)}
                        onUpload={() => handleUploadFile('tradeLicense')}
                        onDelete={() => {
                          const doc = getExistingDocument('TRADE_LICENSE');
                          if (doc) handleDeleteDocument(doc.id);
                        }}
                        required
                        description="Official trade license from local authorities"
                        existingDocument={getExistingDocument('TRADE_LICENSE')}
                        isUploading={uploadingField === 'tradeLicense'}
                        isDeleting={deletingDocId === getExistingDocument('TRADE_LICENSE')?.id}
                        error={fileErrors.tradeLicense}
                      />
                      <FileUploadField
                        label="RJSC Registration"
                        accept="image/*,.pdf"
                        file={uploadedFiles.rjscRegistration}
                        onChange={(file) => handleFileChange('rjscRegistration', file)}
                        onUpload={() => handleUploadFile('rjscRegistration')}
                        onDelete={() => {
                          const doc = getExistingDocument('RJSC_REGISTRATION');
                          if (doc) handleDeleteDocument(doc.id);
                        }}
                        required
                        description="Registration certificate from RJSC"
                        existingDocument={getExistingDocument('RJSC_REGISTRATION')}
                        isUploading={uploadingField === 'rjscRegistration'}
                        isDeleting={deletingDocId === getExistingDocument('RJSC_REGISTRATION')?.id}
                        error={fileErrors.rjscRegistration}
                      />
                      <FileUploadField
                        label="TIN Certificate"
                        accept="image/*,.pdf"
                        file={uploadedFiles.tinCertificate}
                        onChange={(file) => handleFileChange('tinCertificate', file)}
                        onUpload={() => handleUploadFile('tinCertificate')}
                        onDelete={() => {
                          const doc = getExistingDocument('TIN_CERTIFICATE');
                          if (doc) handleDeleteDocument(doc.id);
                        }}
                        required={selectedBusinessType !== 'PROPRIETORSHIP'}
                        description="Tax Identification Number certificate"
                        existingDocument={getExistingDocument('TIN_CERTIFICATE')}
                        isUploading={uploadingField === 'tinCertificate'}
                        isDeleting={deletingDocId === getExistingDocument('TIN_CERTIFICATE')?.id}
                        error={fileErrors.tinCertificate}
                      />
                      <FileUploadField
                        label="VAT Certificate"
                        accept="image/*,.pdf"
                        file={uploadedFiles.vatCertificate}
                        onChange={(file) => handleFileChange('vatCertificate', file)}
                        onUpload={() => handleUploadFile('vatCertificate')}
                        onDelete={() => {
                          const doc = getExistingDocument('VAT_CERTIFICATE');
                          if (doc) handleDeleteDocument(doc.id);
                        }}
                        required={selectedBusinessType !== 'PROPRIETORSHIP'}
                        description="Value Added Tax registration certificate"
                        existingDocument={getExistingDocument('VAT_CERTIFICATE')}
                        isUploading={uploadingField === 'vatCertificate'}
                        isDeleting={deletingDocId === getExistingDocument('VAT_CERTIFICATE')?.id}
                        error={fileErrors.vatCertificate}
                      />
                      <FileUploadField
                        label="Other Business Document"
                        accept="image/*,.pdf"
                        file={uploadedFiles.otherDocument}
                        onChange={(file) => handleFileChange('otherDocument', file)}
                        onUpload={() => handleUploadFile('otherDocument')}
                        onDelete={() => {
                          const doc = getExistingDocument('OTHER');
                          if (doc) handleDeleteDocument(doc.id);
                        }}
                        description="Any other relevant business document"
                        existingDocument={getExistingDocument('OTHER')}
                        isUploading={uploadingField === 'otherDocument'}
                        isDeleting={deletingDocId === getExistingDocument('OTHER')?.id}
                        error={fileErrors.otherDocument}
                      />
                    </div>
                  </div>
                </>
              )
            )}
          </div>

          {/* Status Summary */}
          <div className={`border-2 rounded-lg p-6 shadow-sm ${
            uploadStatus.complete && hasRequiredPersonalInfo() && (accountType === 'INDIVIDUAL' || selectedBusinessType)
              ? 'bg-green-50 border-green-300' 
              : 'bg-yellow-50 border-yellow-300'
          }`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  {uploadStatus.complete && hasRequiredPersonalInfo() && (accountType === 'INDIVIDUAL' || selectedBusinessType) ? (
                    <svg className="w-6 h-6 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9 7a1 1 0 112 0v4a1 1 0 11-2 0V7zm1 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                  )}
                  <h4 className={`text-lg font-semibold ${
                    uploadStatus.complete && hasRequiredPersonalInfo() && (accountType === 'INDIVIDUAL' || selectedBusinessType)
                      ? 'text-green-900' 
                      : 'text-yellow-900'
                  }`}>
                    Document Upload Status
                  </h4>
                </div>
                <p className={`text-sm mb-1 ${
                  uploadStatus.complete && hasRequiredPersonalInfo() && (accountType === 'INDIVIDUAL' || selectedBusinessType)
                    ? 'text-green-700' 
                    : 'text-yellow-700'
                }`}>
                  {uploadStatus.message}
                </p>
                {!hasRequiredPersonalInfo() && (
                  <p className="text-sm text-red-600 font-medium">
                    ⚠️ Please complete all required information fields above
                  </p>
                )}
                {accountType === 'BUSINESS' && !selectedBusinessType && (
                  <p className="text-sm text-red-600 font-medium">
                    ⚠️ Please select your business type
                  </p>
                )}
              </div>
              <div className="ml-4 text-right">
                <div className="text-2xl font-bold text-gray-900 mb-1">{uploadStatus.progress}</div>
                <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  uploadStatus.complete && hasRequiredPersonalInfo() && (accountType === 'INDIVIDUAL' || selectedBusinessType)
                    ? 'bg-green-600 text-white' 
                    : 'bg-yellow-600 text-white'
                }`}>
                  {uploadStatus.complete && hasRequiredPersonalInfo() && (accountType === 'INDIVIDUAL' || selectedBusinessType) ? 'Complete' : 'In Progress'}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-4">
            {showBackButton ? (
              <button
                type="button"
                onClick={onBack}
                disabled={isSubmitting}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-all"
              >
                Back
              </button>
            ) : (
              <div></div>
            )}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || !uploadStatus.complete || !hasRequiredPersonalInfo() || (accountType === 'BUSINESS' && !selectedBusinessType)}
              className="px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-all shadow-md hover:shadow-lg"
            >
              {isSubmitting && (
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {isSubmitting ? 'Saving...' : 'Continue to Bank Info'}
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-5">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 shadow-sm sticky top-4">
            <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              Document Requirements
            </h3>
            <ul className="text-sm text-blue-800 space-y-2">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Documents must be clear and readable</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Maximum file size: 5MB per document</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Accepted formats: JPG, PNG, PDF</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Ensure all text is visible and not blurry</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Click Upload button after selecting each file</span>
              </li>
            </ul>
          </div>

          {accountType === 'BUSINESS' && selectedBusinessType && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-5 shadow-sm">
              <h4 className="font-semibold text-purple-900 mb-3">
                Required for {selectedBusinessType.replace('_', ' ')}
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center py-1 border-b border-purple-100">
                  <span className="text-purple-800">Trade License</span>
                  <span className="font-semibold text-purple-900 text-xs bg-purple-200 px-2 py-1 rounded">Required</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-purple-100">
                  <span className="text-purple-800">RJSC Registration</span>
                  <span className="font-semibold text-purple-900 text-xs bg-purple-200 px-2 py-1 rounded">Required</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-purple-100">
                  <span className="text-purple-800">TIN Certificate</span>
                  <span className={`font-semibold text-xs px-2 py-1 rounded ${
                    selectedBusinessType === 'PROPRIETORSHIP' 
                      ? 'text-gray-700 bg-gray-200' 
                      : 'text-purple-900 bg-purple-200'
                  }`}>
                    {selectedBusinessType === 'PROPRIETORSHIP' ? 'Optional' : 'Required'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-purple-100">
                  <span className="text-purple-800">VAT Certificate</span>
                  <span className={`font-semibold text-xs px-2 py-1 rounded ${
                    selectedBusinessType === 'PROPRIETORSHIP' 
                      ? 'text-gray-700 bg-gray-200' 
                      : 'text-purple-900 bg-purple-200'
                  }`}>
                    {selectedBusinessType === 'PROPRIETORSHIP' ? 'Optional' : 'Required'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {accountType === 'INDIVIDUAL' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-5 shadow-sm">
              <h4 className="font-semibold text-green-900 mb-3">
                Required for Individual Account
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center py-1 border-b border-green-100">
                  <span className="text-green-800">National ID or Passport</span>
                  <span className="font-semibold text-green-900 text-xs bg-green-200 px-2 py-1 rounded">Required</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-green-100">
                  <span className="text-green-800">ID Number</span>
                  <span className="font-semibold text-green-900 text-xs bg-green-200 px-2 py-1 rounded">Required</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-green-100">
                  <span className="text-green-800">Full Name</span>
                  <span className="font-semibold text-green-900 text-xs bg-green-200 px-2 py-1 rounded">Required</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentsStep;