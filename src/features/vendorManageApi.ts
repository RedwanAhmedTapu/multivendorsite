// features/vendorManageApi.ts
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import baseQueryWithReauth from "./baseQueryWithReauth";

// ================================
// TYPES
// ================================

export interface Vendor {
  id: string;
  storeName: string;
  avatar?: string;
  status: "PENDING" | "ACTIVE" | "SUSPENDED" | "DEACTIVATED";
  currentCommissionRate?: number;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    email?: string;
    phone?: string;
    isActive: boolean;
    isVerified: boolean;
  };
  performance?: {
    totalSales: number;
    totalOrders: number;
    fulfillmentRatePct: number;
    avgRating: number;
  };
  _count?: {
    products: number;
    orders: number;
    flags: number;
    monthlyCharges?: number;
    offers?: [];
  };
}

export interface VendorWithDetails extends Vendor {
  user: {
    id: string;
    email?: string;
    phone?: string;
    isActive: boolean;
    isVerified: boolean;
  };
  performance: {
    totalSales: number;
    totalOrders: number;
    fulfillmentRatePct: number;
    avgRating: number;
    lastCalculatedAt: string;
  };
  _count: {
    products: number;
    orders: number;
    flags: number;
  };
}
export interface VerificationStatusRequest {
  approvedBy?: string; // For verify endpoint
  rejectionReason?: string; // For reject endpoint
  reason?: string; // For suspend endpoint
}
export interface CreateVendorRequest {
  storeName: string;
  email?: string;
  phone?: string;
  password: string;
  avatar?: string;
}

export interface UpdateVendorProfileRequest {
  storeName?: string;
  avatar?: string;
}

export interface VendorCommissionRequest {
  categoryId: string;
  rate: number;
  note?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
}

export interface VendorPayoutRequest {
  amount: number;
  method: string;
  period: string;
  note?: string;
  paidAt?: string;
}

export interface VendorMonthlyChargeRequest {
  amount: number;
  description?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
}

export interface VendorOfferRequest {
  title: string;
  details?: string;
  validFrom?: string;
  validTo?: string;
}

export interface VendorFlagRequest {
  reason: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  meta?: any;
}

export interface VendorFilterQuery {
  status?: string;
  search?: string;
  commissionMin?: number;
  commissionMax?: number;
  createdFrom?: string;
  createdTo?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface VendorPerformanceMetrics {
  vendorId: string;
  totalSales: number;
  totalOrders: number;
  fulfillmentRatePct: number;
  avgRating: number;
  monthlyGrowth: number;
  completedOrders: number;
  cancelledOrders: number;
  returnedOrders: number;
}

export interface PayoutSummary {
  vendorId: string;
  totalPending: number;
  totalPaid: number;
  totalFailed: number;
  lastPayoutDate?: string;
  currentBalance: number;
}

export interface FraudDetectionResult {
  vendorId: string;
  riskScore: number;
  flags: {
    excessiveOrderDeclines: boolean;
    suspiciousPricing: boolean;
    unusualOrderPatterns: boolean;
    lowFulfillmentRate: boolean;
  };
  recommendations: string[];
}

export interface BulkCommissionUpdateRequest {
  vendorIds: string[];
  rate: number;
  categoryId: string;
}

export interface BulkMonthlyChargeRequest {
  vendorIds: string[];
  amount: number;
  description?: string;
  effectiveFrom?: string;
}

export interface VendorExportOptions {
  filters?: VendorFilterQuery;
  fields: string[];
}

export interface VendorPaginationResponse {
  data: Vendor[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}
export interface VendorCharge {
  id: string;
  amount: number;
  description?: string;
  effectiveFrom: string;
  effectiveTo?: string | null;
  createdAt: string;
}
export interface PayoutRecord {
  id: string;
  amount: number;
  method: string;
  status: "PENDING" | "PAID" | "FAILED" | "CANCELLED";
  note?: string;
  createdAt: string;
  paidAt?: string;
  period: string;
}
export interface CommissionHistory {
  id: string;
  rate: number;
  effectiveFrom: string;
  effectiveTo?: string;
  note?: string;
  createdAt: string;
}
// ================================
// NEW TYPES FOR EXTENDED FUNCTIONALITY
// ================================

export interface VendorPersonalInfoRequest {
  // Individual-specific fields
  idNumber?: string;
  idName?: string;
  // Business-specific fields  
  companyName?: string;
  businessRegNo?: string;
  taxIdNumber?: string;
}


export interface VendorPersonalInfo {
  id: string;
  vendorId: string;
  // Individual-specific fields
  idNumber?: string | null;
  idName?: string | null;
  // Business-specific fields
  companyName?: string | null;
  businessRegNo?: string | null;
  taxIdNumber?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VendorAddressRequest {
  detailsAddress: string;
  city: string;
  zone?: string;
  area?: string;
}

export interface VendorAddress {
  id: string;
  vendorId: string;
  detailsAddress: string;
  city: string;
  zone?: string;
  area?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VendorBankInfoRequest {
  accountName: string;
  accountNumber: string;
  bankName: string;
  branchName: string;
}

export interface VendorBankInfo {
  id: string;
  vendorId: string;
  accountName: string;
  accountNumber: string;
  bankName: string;
  branchName: string;
  createdAt: string;
  updatedAt: string;
}

export interface VendorDocumentRequest {
  type: 
    | "NATIONAL_ID_FRONT" 
    | "NATIONAL_ID_BACK" 
    | "PASSPORT_FRONT" 
    | "PASSPORT_BACK" 
    | "TRADE_LICENSE"           // Updated to match Prisma enum
    | "RJSC_REGISTRATION"       // Added
    | "TIN_CERTIFICATE"         // Added
    | "VAT_CERTIFICATE"         // Added
    | "OTHER";                  // Added
  title: string;
  filePath: string;
  fileSize?: number | null;     // Made nullable to match schema
  mimeType?: string | null;     // Made nullable to match schema
  verificationStatus?: "PENDING" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "EXPIRED";
}


export interface VendorDocument {
  id: string;
  vendorId: string;
  type: string;
  title: string;
  filePath: string;
  fileSize?: number | null;    
  mimeType?: string | null;     
  verificationStatus: string;
  rejectionReason?: string | null;  // Added and made nullable
  createdAt: string;
  updatedAt: string;
}


export interface VendorSubscriptionRequest {
  planType: "FREE" | "BASIC" | "PRO" | "ENTERPRISE";
  isActive: boolean;
}

export interface VendorSubscription {
  id: string;
  vendorId: string;
  planType: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VendorSettingsRequest {
  emailNotifications: boolean;
}

export interface VendorSettings {
  id: string;
  vendorId: string;
  emailNotifications: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VendorOnboardingStatus {
  id: string;
  vendorId: string;
  personalInfoComplete: boolean;
  addressComplete: boolean;
  bankInfoComplete: boolean;
  documentsComplete: boolean; 
  overallComplete: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VendorVerificationRequest {
  rejectionReason?: string;
}

export interface CompleteVendorProfile extends VendorWithDetails {
  personalInfo?: VendorPersonalInfo | null;
  bankInfo?: VendorBankInfo | null;
  documents?: VendorDocument[]; 
  pickupAddress?: VendorAddress | null;
  settings?: VendorSettings | null;
  subscription?: VendorSubscription | null;
  onboarding?: VendorOnboardingStatus | null;
  accountType: "INDIVIDUAL" | "BUSINESS";
  businessType?: "PROPRIETORSHIP" | "LIMITED_COMPANY" | "PARTNERSHIP_FIRM" | null; 
}

export interface RequiredDocumentTypes {
  required: Array<{
    type: string;
    label: string;
  }>;
  alternatives: Array<{
    type: string;
    label: string;
  }>;
}

export interface DocumentUploadData {
  // Individual account documents
  nidFront?: File;
  nidBack?: File;
  passportFront?: File;
  passportBack?: File;
  
  // Business account documents - Updated to match schema
  tradeLicense?: File;
  rjscRegistration?: File;
  tinCertificate?: File;
  vatCertificate?: File;
  otherDocument?: File;
}


export interface OnboardingProgress {
  personalInfo: boolean;
  address: boolean;
  bankInfo: boolean;
  documents: boolean;
  overall: boolean;
  progressPercentage: number;
}
// ================================
// STORAGE RELATED TYPES
// ================================

// Types
export interface StorageFile {
  id: string;
  fileName: string;
  fileKey: string;
  fileSize: number;
  mimeType: string;
  fileType: "IMAGE" | "DOCUMENT";
  url: string;
  r2Url: string;
  productId?: string;
  variantId?: string;
  createdAt: string;
}

export interface StorageStats {
  // Raw bytes (for calculations)
  usedBytes: number;
  totalBytes: number;
  remainingBytes: number;

  // Readable size formats
  usedSize: string; // e.g. "251.56"
  usedUnit: string; // e.g. "KB", "MB", or "GB"
  usedMB: number;
  usedGB: number;
  totalGB: number;
  remainingGB: number;

  // Percentage of used space
  usagePercent: number;

  // Quota breakdown
  freeQuotaGB: number;
  paidQuotaGB: number;

  // File counts
  totalFiles: number;
  imageFiles: number;
  documentFiles: number;
}

export interface QuotaCheckResponse {
  success: boolean;
  available: boolean;
  currentUsage: string;
  totalQuota: string;
  availableSpace: string;
  requiredSpace: number;
  reason?: string;
}

export interface UploadFileResponse {
  success: boolean;
  file?: {
    id: string;
    fileName: string;
    url: string;
    fileSize: number;
    mimeType: string;
  };
  files?: Array<{
    id: string;
    fileName: string;
    url: string;
    path: string;
    fileSize: number;
    mimeType: string;
  }>;
  totalFiles?: number;
  totalSize?: number;
}

export interface PaginatedFilesResponse {
  success: boolean;
  files: StorageFile[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Folder interface
export interface Folder {
  id: string;
  name: string;
  path: string;
  parentPath?: string;
  fileCount: number;
  createdAt: string;
}
// ================================
// VENDOR MANAGEMENT API
// ================================

export const vendorManageApi = createApi({
  reducerPath: "vendorManageApi",
  baseQuery: baseQueryWithReauth,
   tagTypes: [
    "Vendor",
    "VendorCommission",
    "VendorPayout",
    "VendorCharge",
    "VendorOffer",
    "VendorFlag",
    "VendorPerformance",
    "VendorPersonalInfo",
    "VendorAddress",
    "VendorBankInfo",
    "VendorDocument",
    "VendorSubscription",
    "VendorSettings",
    "VendorOnboarding",
    "VendorStorage",
    "VendorFile",
    "Folders",
  ],
  endpoints: (builder) => ({
    // ================================
    // VENDOR CRUD OPERATIONS
    // ================================

    // Create new vendor (Admin only)
    createVendor: builder.mutation<Vendor, CreateVendorRequest>({
      query: (body) => ({
        url: "/vendormanagement",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Vendor"],
    }),

    // Get all vendors with filtering and pagination
    getVendors: builder.query<VendorPaginationResponse, VendorFilterQuery>({
      query: (params) => ({
        url: "/vendormanagement",
        method: "GET",
        params,
      }),
      providesTags: ["Vendor"],
    }),

    // Get vendor by ID
    getVendorById: builder.query<VendorWithDetails, string>({
      query: (id) => `/vendormanagement/${id}`,
      providesTags: (result, error, id) => [{ type: "Vendor", id }],
    }),

    // Update vendor profile
    updateVendorProfile: builder.mutation<
      Vendor,
      { id: string; formData: FormData }
    >({
      query: ({ id, formData }) => ({
        url: `/vendormanagement/${id}/profile`,
        method: "PATCH",
        body: formData,
        // Don't set Content-Type - let browser set it with boundary
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Vendor", id }],
    }),

    // Update vendor status
    updateVendorStatus: builder.mutation<
      Vendor,
      { id: string; status: string }
    >({
      query: ({ id, status }) => ({
        url: `/vendormanagement/${id}/${status.toLowerCase()}`,
        method: "PATCH",
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Vendor", id }],
    }),

    // Delete vendor
    deleteVendor: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/vendormanagement/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Vendor"],
    }),
     // ================================
    // VERIFICATION STATUS MANAGEMENT (NEW)
    // ================================

    // Update verification status to UNDER_REVIEW
    setUnderReview: builder.mutation<Vendor, string>({
      query: (vendorId) => ({
        url: `/vendormanagement/${vendorId}/verification/under-review`,
        method: "PATCH",
      }),
      invalidatesTags: (result, error, vendorId) => [
        { type: "Vendor", id: vendorId },
      ],
    }),

    // Verify vendor - approve documents
    verifyVendorVerification: builder.mutation<
      Vendor,
      { vendorId: string; approvedBy?: string }
    >({
      query: ({ vendorId, approvedBy }) => ({
        url: `/vendormanagement/${vendorId}/verification/verify`,
        method: "PATCH",
        body: { approvedBy },
      }),
      invalidatesTags: (result, error, { vendorId }) => [
        { type: "Vendor", id: vendorId },
        { type: "VendorDocument", id: vendorId },
        { type: "VendorOnboarding", id: vendorId },
      ],
    }),

    // Reject vendor verification
    rejectVendorVerification: builder.mutation<
      Vendor,
      { vendorId: string; rejectionReason: string }
    >({
      query: ({ vendorId, rejectionReason }) => ({
        url: `/vendormanagement/${vendorId}/verification/reject`,
        method: "PATCH",
        body: { rejectionReason },
      }),
      invalidatesTags: (result, error, { vendorId }) => [
        { type: "Vendor", id: vendorId },
        { type: "VendorDocument", id: vendorId },
      ],
    }),

    // Suspend vendor verification
    suspendVendorVerification: builder.mutation<
      Vendor,
      { vendorId: string; reason?: string }
    >({
      query: ({ vendorId, reason }) => ({
        url: `/vendormanagement/${vendorId}/verification/suspend`,
        method: "PATCH",
        body: { reason },
      }),
      invalidatesTags: (result, error, { vendorId }) => [
        { type: "Vendor", id: vendorId },
      ],
    }),

    // Request re-verification after rejection
    requestReVerificationStatus: builder.mutation<Vendor, string>({
      query: (vendorId) => ({
        url: `/vendormanagement/${vendorId}/verification/request-reverification`,
        method: "POST",
      }),
      invalidatesTags: (result, error, vendorId) => [
        { type: "Vendor", id: vendorId },
        { type: "VendorDocument", id: vendorId },
      ],
    }),

    // ================================
    // COMMISSION MANAGEMENT (Category-based)
    // ================================

    setCommissionRate: builder.mutation<
      Vendor,
      { vendorId: string; data: VendorCommissionRequest }
    >({
      query: ({ vendorId, data }) => ({
        url: `/vendormanagement/${vendorId}/commission`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (result, error, { vendorId }) => [
        { type: "Vendor", id: vendorId },
        { type: "VendorCommission", id: vendorId },
      ],
    }),

    // Get commission history (category-wise)
    getCommissionHistory: builder.query<any[], string>({
      query: (vendorId) => `/vendormanagement/${vendorId}/commission/history`,
      
      providesTags: (result, error, vendorId) => [
        { type: "VendorCommission", id: vendorId },
      ],
    }),

    // Bulk update (category-based commissions)
    bulkUpdateCommissions: builder.mutation<
      { updated: number },
      BulkCommissionUpdateRequest
    >({
      query: (data) => ({
        url: "/vendormanagement/set/bulk/commission",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Vendor", "VendorCommission"],
    }),

    // ================================
    // PAYOUT MANAGEMENT
    // ================================

    // Create payout
    createPayout: builder.mutation<
      any,
      { vendorId: string; data: VendorPayoutRequest }
    >({
      query: ({ vendorId, data }) => ({
        url: `/vendormanagement/${vendorId}/payouts`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (result, error, { vendorId }) => [
        { type: "VendorPayout", id: vendorId },
        { type: "Vendor", id: vendorId },
      ],
    }),

    // Update payout status
    updatePayoutStatus: builder.mutation<
      any,
      { payoutId: string; status: string; paidAt?: string }
    >({
      query: ({ payoutId, status, paidAt }) => ({
        url: `/vendormanagement/payouts/${payoutId}/status`,
        method: "PATCH",
        body: { status, paidAt },
      }),
      invalidatesTags: ["VendorPayout"],
    }),

    // Get vendor payouts
    getVendorPayouts: builder.query<any[], string>({
      query: (vendorId) => `/vendormanagement/${vendorId}/payouts`,
      providesTags: (result, error, vendorId) => [
        { type: "VendorPayout", id: vendorId },
      ],
    }),

    // Get payout summary
    getPayoutSummary: builder.query<PayoutSummary, string>({
      query: (vendorId) => `/vendormanagement/${vendorId}/payouts/summary`,
      providesTags: (result, error, vendorId) => [
        { type: "VendorPayout", id: vendorId },
      ],
    }),

    // ================================
    // MONTHLY CHARGES
    // ================================

    // Set monthly charge
    setMonthlyCharge: builder.mutation<
      any,
      { vendorId: string; data: VendorMonthlyChargeRequest }
    >({
      query: ({ vendorId, data }) => ({
        url: `/vendormanagement/${vendorId}/charges`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (result, error, { vendorId }) => [
        { type: "VendorCharge", id: vendorId },
        { type: "Vendor", id: vendorId },
      ],
    }),

    // Bulk set monthly charges
    bulkSetMonthlyCharges: builder.mutation<any, BulkMonthlyChargeRequest>({
      query: (data) => ({
        url: "/vendormanagement/bulk/charges",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["VendorCharge", "Vendor"],
    }),

    // Get vendor charges
    getVendorCharges: builder.query<VendorCharge[], string>({
      query: (vendorId) => `/vendormanagement/${vendorId}/charges`,
      providesTags: (result, error, vendorId) => [
        { type: "VendorCharge", id: vendorId },
      ],
    }),
    // ================================
    // PROMOTIONAL OFFERS
    // ================================

    // Create offer
    createOffer: builder.mutation<
      any,
      { vendorId: string; data: VendorOfferRequest }
    >({
      query: ({ vendorId, data }) => ({
        url: `/vendormanagement/${vendorId}/offers`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (result, error, { vendorId }) => [
        { type: "VendorOffer", id: vendorId },
        { type: "Vendor", id: vendorId },
      ],
    }),

    // Get vendor offers
    getVendorOffers: builder.query<any[], string>({
      query: (vendorId) => `/vendormanagement/${vendorId}/offers`,
      providesTags: (result, error, vendorId) => [
        { type: "VendorOffer", id: vendorId },
      ],
    }),

    // Toggle offer status
    toggleOfferStatus: builder.mutation<
      any,
      { offerId: string; isActive: boolean }
    >({
      query: ({ offerId, isActive }) => ({
        url: `/vendormanagement/offers/${offerId}/toggle`,
        method: "PATCH",
        body: { isActive },
      }),
      invalidatesTags: ["VendorOffer"],
    }),

    // ================================
    // PERFORMANCE MONITORING
    // ================================

    // Get vendor performance
    getVendorPerformance: builder.query<VendorPerformanceMetrics, string>({
      query: (vendorId) => `/vendormanagement/${vendorId}/performance`,
      providesTags: (result, error, vendorId) => [
        { type: "VendorPerformance", id: vendorId },
      ],
    }),

    // Update vendor performance
    updateVendorPerformance: builder.mutation<any, string>({
      query: (vendorId) => ({
        url: `/vendormanagement/${vendorId}/performance/update`,
        method: "POST",
      }),
      invalidatesTags: (result, error, vendorId) => [
        { type: "VendorPerformance", id: vendorId },
      ],
    }),

    // ================================
    // FRAUD DETECTION
    // ================================

    // Detect fraud
    detectFraud: builder.query<FraudDetectionResult, string>({
      query: (vendorId) => `/vendormanagement/${vendorId}/fraud-detection`,
      providesTags: (result, error, vendorId) => [
        { type: "Vendor", id: vendorId },
      ],
    }),

    // ================================
    // FLAG MANAGEMENT
    // ================================

    // Flag vendor
    flagVendor: builder.mutation<
      any,
      { vendorId: string; data: VendorFlagRequest }
    >({
      query: ({ vendorId, data }) => ({
        url: `/vendormanagement/${vendorId}/flags`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (result, error, { vendorId }) => [
        { type: "VendorFlag", id: vendorId },
        { type: "Vendor", id: vendorId },
      ],
    }),

    // Get vendor flags
    getVendorFlags: builder.query<any[], string>({
      query: (vendorId) => `/vendormanagement/${vendorId}/flags`,
      providesTags: (result, error, vendorId) => [
        { type: "VendorFlag", id: vendorId },
      ],
    }),

    // ================================
    // CHAT/CONVERSATION MANAGEMENT
    // ================================

    // Get vendor conversations
    getVendorConversations: builder.query<
      any[],
      { vendorId?: string; userId?: string }
    >({
      query: (params) => ({
        url: "/vendormanagement/conversations",
        method: "GET",
        params,
      }),
      providesTags: ["Vendor"],
    }),

    // Get conversation messages
    getConversationMessages: builder.query<any[], string>({
      query: (conversationId) =>
        `/vendormanagement/conversations/${conversationId}/messages`,
      providesTags: (result, error, conversationId) => [
        { type: "Vendor", id: conversationId },
      ],
    }),

    // Send message
    sendMessage: builder.mutation<
      any,
      { conversationId: string; content: string; metadata?: any }
    >({
      query: ({ conversationId, content, metadata }) => ({
        url: `/vendormanagement/conversations/${conversationId}/messages`,
        method: "POST",
        body: { content, metadata },
      }),
      invalidatesTags: (result, error, { conversationId }) => [
        { type: "Vendor", id: conversationId },
      ],
    }),

    // ================================
    // EXPORT FUNCTIONALITY
    // ================================

    // Export vendors
    exportVendors: builder.mutation<any[], VendorExportOptions>({
      query: (data) => ({
        url: "/vendormanagement/export/list",
        method: "GET",
        params: data,
      }),
    }),
   // Create or update personal info - UPDATED
    createOrUpdatePersonalInfo: builder.mutation<
      VendorPersonalInfo,
      { vendorId: string; data: VendorPersonalInfoRequest }
    >({
      query: ({ vendorId, data }) => ({
        url: `/vendormanagement/${vendorId}/personal-info`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { vendorId }) => [
        { type: "VendorPersonalInfo", id: vendorId },
        { type: "VendorOnboarding", id: vendorId },
        { type: "Vendor", id: vendorId },
      ],
    }),

    // Get personal info - UPDATED
    getPersonalInfo: builder.query<VendorPersonalInfo, string>({
      query: (vendorId) => `/vendormanagement/${vendorId}/personal-info`,
      providesTags: (result, error, vendorId) => [
        { type: "VendorPersonalInfo", id: vendorId },
      ],
    }),

    // ================================
    // ADDRESS MANAGEMENT
    // ================================

    // Create or update address
    createOrUpdateAddress: builder.mutation<
      VendorAddress,
      { vendorId: string; data: VendorAddressRequest }
    >({
      query: ({ vendorId, data }) => ({
        url: `/vendormanagement/${vendorId}/address`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { vendorId }) => [
        { type: "VendorAddress", id: vendorId },
        { type: "VendorOnboarding", id: vendorId },
        { type: "Vendor", id: vendorId },
      ],
    }),

    // Get address
    getAddress: builder.query<VendorAddress, string>({
      query: (vendorId) => `/vendormanagement/${vendorId}/address`,
      providesTags: (result, error, vendorId) => [
        { type: "VendorAddress", id: vendorId },
      ],
    }),

    // ================================
    // BANK INFO MANAGEMENT
    // ================================

    // Create or update bank info
    createOrUpdateBankInfo: builder.mutation<
      VendorBankInfo,
      { vendorId: string; data: VendorBankInfoRequest }
    >({
      query: ({ vendorId, data }) => ({
        url: `/vendormanagement/${vendorId}/bank-info`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { vendorId }) => [
        { type: "VendorBankInfo", id: vendorId },
        { type: "VendorOnboarding", id: vendorId },
        { type: "Vendor", id: vendorId },
      ],
    }),

    // Get bank info
    getBankInfo: builder.query<VendorBankInfo, string>({
      query: (vendorId) => `/vendormanagement/${vendorId}/bank-info`,
      providesTags: (result, error, vendorId) => [
        { type: "VendorBankInfo", id: vendorId },
      ],
    }),

    // ================================
    // DOCUMENT MANAGEMENT
    // ================================

    uploadDocuments: builder.mutation<
      {
        success: boolean;
        message: string;
        data: Array<{
          fieldName: string;
          documentType: string;
          document: VendorDocument;
          uploadUrl: string;
        }>;
        errors?: Array<{ field: string; message: string }>;
      },
      { vendorId: string; files: FormData }
    >({
      query: ({ vendorId, files }) => ({
        url: `/vendormanagement/${vendorId}/documents`,
        method: 'POST',
        body: files,
        // Don't set Content-Type - let browser handle it for FormData
      }),
      invalidatesTags: (result, error, { vendorId }) => [
        { type: 'VendorDocument', id: vendorId },
        { type: 'VendorOnboarding', id: vendorId },
        { type: 'Vendor', id: vendorId },
      ],
    }),

    // Get documents - UPDATED (returns array now)
    getDocuments: builder.query<VendorDocument[], string>({
  query: (vendorId) => `/vendormanagement/${vendorId}/documents`,
  transformResponse: (response: any) => {
    // Handle different response structures
    if (Array.isArray(response)) {
      return response;
    } else if (response?.data && Array.isArray(response.data)) {
      return response.data;
    } else if (response?.documents && Array.isArray(response.documents)) {
      return response.documents;
    }
    return [];
  },
  providesTags: (result, error, vendorId) => [
    { type: "VendorDocument", id: vendorId },
  ],
}),

    // Update document status - UPDATED
    updateDocumentStatus: builder.mutation<
      VendorDocument,
      { 
        documentId: string; 
        status: "PENDING" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "EXPIRED"; 
        rejectionReason?: string 
      }
    >({
      query: ({ documentId, status, rejectionReason }) => ({
        url: `/vendormanagement/documents/${documentId}/status`,
        method: "PATCH",
        body: { status, rejectionReason },
      }),
      invalidatesTags: (result, error, { documentId }) => [
        { type: "VendorDocument", id: documentId },
      ],
    }),
    // Delete a document
    deleteDocument: builder.mutation<
      { success: boolean; message: string },
      string
    >({
      query: (documentId) => ({
        url: `/vendormanagement/documents/${documentId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, documentId) => [
        'VendorDocument',
      ],
    }),
  // Get required document types
    getRequiredDocumentTypes: builder.query<RequiredDocumentTypes, string>({
      query: (vendorId) => `/vendormanagement/${vendorId}/required-document-types`,
      providesTags: (result, error, vendorId) => [
        { type: "Vendor", id: vendorId },
      ],
    }),

    // Check document completion status
    checkDocumentsComplete: builder.query<{ complete: boolean }, string>({
      query: (vendorId) => `/vendormanagement/${vendorId}/documents-complete`,
      providesTags: (result, error, vendorId) => [
        { type: "VendorDocument", id: vendorId },
        { type: "VendorOnboarding", id: vendorId },
      ],
    }),
    // ================================
    // SUBSCRIPTION MANAGEMENT
    // ================================

    // Create or update subscription
    createOrUpdateSubscription: builder.mutation<
      VendorSubscription,
      { vendorId: string; data: VendorSubscriptionRequest }
    >({
      query: ({ vendorId, data }) => ({
        url: `/vendormanagement/${vendorId}/subscription`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { vendorId }) => [
        { type: "VendorSubscription", id: vendorId },
        { type: "Vendor", id: vendorId },
      ],
    }),

    // Get subscription
    getSubscription: builder.query<VendorSubscription, string>({
      query: (vendorId) => `/vendormanagement/${vendorId}/subscription`,
      providesTags: (result, error, vendorId) => [
        { type: "VendorSubscription", id: vendorId },
      ],
    }),

    // Cancel subscription
    cancelSubscription: builder.mutation<VendorSubscription, string>({
      query: (vendorId) => ({
        url: `/vendormanagement/${vendorId}/subscription/cancel`,
        method: "PATCH",
      }),
      invalidatesTags: (result, error, vendorId) => [
        { type: "VendorSubscription", id: vendorId },
        { type: "Vendor", id: vendorId },
      ],
    }),

    // ================================
    // ONBOARDING MANAGEMENT
    // ================================

    // Get onboarding status
      getOnboardingStatus: builder.query<VendorOnboardingStatus, string>({
      query: (vendorId) => `/vendormanagement/${vendorId}/onboarding-status`,
      providesTags: (result, error, vendorId) => [
        { type: "VendorOnboarding", id: vendorId },
      ],
    }),

    // ================================
    // SETTINGS MANAGEMENT
    // ================================

    // Get settings
    getSettings: builder.query<VendorSettings, string>({
      query: (vendorId) => `/vendormanagement/${vendorId}/settings`,
      providesTags: (result, error, vendorId) => [
        { type: "VendorSettings", id: vendorId },
      ],
    }),

    // Update settings
    updateSettings: builder.mutation<
      VendorSettings,
      { vendorId: string; data: VendorSettingsRequest }
    >({
      query: ({ vendorId, data }) => ({
        url: `/vendormanagement/${vendorId}/settings`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { vendorId }) => [
        { type: "VendorSettings", id: vendorId },
        { type: "Vendor", id: vendorId },
      ],
    }),

   
    // ================================
    // COMPLETE PROFILE MANAGEMENT
    // ================================

    // Get complete vendor profile
    getCompleteVendorProfile: builder.query<CompleteVendorProfile, string>({
      query: (vendorId) => `/vendormanagement/${vendorId}/complete-profile`,
      providesTags: (result, error, vendorId) => [
        { type: "Vendor", id: vendorId },
        { type: "VendorPersonalInfo", id: vendorId },
        { type: "VendorAddress", id: vendorId },
        { type: "VendorBankInfo", id: vendorId },
        { type: "VendorDocument", id: vendorId },
        { type: "VendorSubscription", id: vendorId },
        { type: "VendorSettings", id: vendorId },
        { type: "VendorOnboarding", id: vendorId },
      ],
    }),
    // ================================
    // STORAGE MANAGEMENT
    // ================================

    // Upload single file
    uploadFile: builder.mutation<UploadFileResponse, FormData>({
      query: (formData) => ({
        url: "/vendor-storage/upload",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["VendorFile", "VendorStorage"],
    }),

    // Upload multiple files
    uploadMultipleFiles: builder.mutation<UploadFileResponse, FormData>({
      query: (formData) => ({
        url: "/vendor-storage/upload-multiple",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["VendorFile", "VendorStorage"],
    }),

    // Delete file
    deleteFile: builder.mutation<{ success: boolean; message: string }, string>(
      {
        query: (fileId) => ({
          url: `/vendor-storage/files/${fileId}`,
          method: "DELETE",
        }),
        invalidatesTags: ["VendorFile", "VendorStorage"],
      }
    ),

    // Get storage stats
    getStorageStats: builder.query<StorageStats, string>({
      query: (vendorId) => `/vendor-storage/stats?vendorId=${vendorId}`,
      transformResponse: (response: {
        success: boolean;
        stats: StorageStats;
      }) => response.stats,
      providesTags: (result, error, vendorId) => [
        { type: "VendorStorage", id: vendorId },
      ],
    }),

    // Check quota
    checkQuota: builder.mutation<
      QuotaCheckResponse,
      { vendorId: string; requiredSpace: number }
    >({
      query: ({ vendorId, requiredSpace }) => ({
        url: "/vendor-storage/check-quota",
        method: "POST",
        body: { vendorId, requiredSpace },
      }),
    }),

    // Purchase additional storage
    purchaseStorage: builder.mutation<
      { success: boolean; message: string; additionalGB: number },
      { vendorId: string; additionalGB: number }
    >({
      query: ({ vendorId, additionalGB }) => ({
        url: "/vendor-storage/purchase",
        method: "POST",
        body: { vendorId, additionalGB },
      }),
      invalidatesTags: ["VendorStorage"],
    }),

    // Get vendor files
    getVendorFiles: builder.query<
      PaginatedFilesResponse,
      {
        vendorId: string;
        category?: string;
        page?: number;
        limit?: number;
        fileType?: "IMAGE" | "DOCUMENT";
      }
    >({
      query: (params) => ({
        url: "/vendor-storage/files",
        method: "GET",
        params,
      }),
      providesTags: (result, error, { vendorId }) => [
        { type: "VendorFile", id: vendorId },
      ],
    }),
    // ================================
    // FOLDER MANAGEMENT
    // ================================

    // Get all folders
    getFolders: builder.query<Folder[], void>({
      query: () => "/filemanager/folders",
      providesTags: (result) =>
        result && result.length > 0
          ? [
              ...result.map(({ id }) => ({
                type: "Folders" as const,
                id: id.toString(),
              })),
              { type: "Folders", id: "LIST" },
            ]
          : [{ type: "Folders", id: "LIST" }],
    }),

    // Create a new folder
    createFolder: builder.mutation<
      { success: boolean; folder: Folder },
      { name: string; parentPath?: string }
    >({
      query: ({ name, parentPath }) => ({
        url: "/filemanager/folders",
        method: "POST",
        body: { name, parentPath },
      }),
      invalidatesTags: [{ type: "Folders", id: "LIST" }],
    }),

    // Rename folder
    renameFolder: builder.mutation<
      { success: boolean; newPath: string },
      { folderId: string; newName: string }
    >({
      query: ({ folderId, newName }) => ({
        url: `/filemanager/folders/${folderId}/rename`,
        method: "PUT",
        body: { newName },
      }),
      invalidatesTags: [{ type: "Folders", id: "LIST" }],
    }),

    // Delete folder
    deleteFolder: builder.mutation<
      { success: boolean; message: string },
      { folderId: string }
    >({
      query: ({ folderId }) => ({
        url: `/filemanager/folders/${folderId}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Folders", id: "LIST" }],
    }),

    // Move files to folder
    moveFilesToFolder: builder.mutation<
      { success: boolean; movedCount: number },
      { fileIds: string[]; targetFolderPath: string }
    >({
      query: ({ fileIds, targetFolderPath }) => ({
        url: "/filemanager/files/move",
        method: "POST",
        body: { fileIds, targetFolderPath },
      }),
      invalidatesTags: [{ type: "Folders", id: "LIST" }],
    }),
  }),
});

// ================================
// EXPORT HOOKS
// ================================

export const {
  // personalifo
  useCreateOrUpdatePersonalInfoMutation,
  useGetPersonalInfoQuery,
  // vendor address
  useCreateOrUpdateAddressMutation,
  useGetAddressQuery,
  // vendor bank info
  useCreateOrUpdateBankInfoMutation,
  useGetBankInfoQuery,
  // vendor document
  useUploadDocumentsMutation,
  useGetDocumentsQuery,
  useDeleteDocumentMutation,  
  useUpdateDocumentStatusMutation,
  useGetRequiredDocumentTypesQuery,
  useCheckDocumentsCompleteQuery,
  // vendor subscription
  useCreateOrUpdateSubscriptionMutation,
  useGetSubscriptionQuery,
  useCancelSubscriptionMutation,
  // vendor settings
  useGetOnboardingStatusQuery,
  useGetSettingsQuery,
  useUpdateSettingsMutation,
   // Verification Status Management 
  useSetUnderReviewMutation,
  useVerifyVendorVerificationMutation,
  useRejectVendorVerificationMutation,
  useSuspendVendorVerificationMutation,
  useRequestReVerificationStatusMutation,
  // vendor complete profile where need
  useGetCompleteVendorProfileQuery,
  // Vendor CRUD
  useCreateVendorMutation,
  useGetVendorsQuery,
  useGetVendorByIdQuery,
  useUpdateVendorProfileMutation,
  useUpdateVendorStatusMutation,
  useDeleteVendorMutation,

  // Commission Management
  useSetCommissionRateMutation,
  useGetCommissionHistoryQuery,
  useBulkUpdateCommissionsMutation,

  // Payout Management
  useCreatePayoutMutation,
  useUpdatePayoutStatusMutation,
  useGetVendorPayoutsQuery,
  useGetPayoutSummaryQuery,

  // Monthly Charges
  useSetMonthlyChargeMutation,
  useBulkSetMonthlyChargesMutation,
  useGetVendorChargesQuery,

  // Promotional Offers
  useCreateOfferMutation,
  useGetVendorOffersQuery,
  useToggleOfferStatusMutation,

  // Performance Monitoring
  useGetVendorPerformanceQuery,
  useUpdateVendorPerformanceMutation,

  // Fraud Detection
  useDetectFraudQuery,

  // Flag Management
  useFlagVendorMutation,
  useGetVendorFlagsQuery,

  // Chat/Conversation
  useGetVendorConversationsQuery,
  useGetConversationMessagesQuery,
  useSendMessageMutation,

  // Export
  useExportVendorsMutation,
  // Storage Management
  useUploadFileMutation,
  useUploadMultipleFilesMutation,
  useDeleteFileMutation,
  useGetStorageStatsQuery,
  useCheckQuotaMutation,
  usePurchaseStorageMutation,
  useGetVendorFilesQuery,
  // Folder Management
  useGetFoldersQuery,
  useCreateFolderMutation,
  useRenameFolderMutation,
  useDeleteFolderMutation,
  useMoveFilesToFolderMutation,
} = vendorManageApi;
