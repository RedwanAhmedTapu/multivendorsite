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
  status: 'PENDING' | 'APPROVED' | 'SUSPENDED' | 'DEACTIVATED';
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
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
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
  sortOrder?: 'asc' | 'desc';
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
  note?: string;
  effectiveFrom?: string;
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

// ================================
// VENDOR MANAGEMENT API
// ================================

export const vendorManageApi = createApi({
  reducerPath: "vendorManageApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Vendor", "VendorCommission", "VendorPayout", "VendorCharge", "VendorOffer", "VendorFlag", "VendorPerformance"],
  endpoints: (builder) => ({
    // ================================
    // VENDOR CRUD OPERATIONS
    // ================================

    // Create new vendor (Admin only)
    createVendor: builder.mutation<Vendor, CreateVendorRequest>({
      query: (body) => ({
        url: "/vendormangement",
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
    updateVendorProfile: builder.mutation<Vendor, { id: string; data: UpdateVendorProfileRequest }>({
      query: ({ id, data }) => ({
        url: `/vendormanagement/${id}/profile`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Vendor", id }],
    }),

    // Update vendor status
    updateVendorStatus: builder.mutation<Vendor, { id: string; status: string }>({
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
    // COMMISSION MANAGEMENT
    // ================================

    // Set commission rate
    setCommissionRate: builder.mutation<Vendor, { vendorId: string; data: VendorCommissionRequest }>({
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

    // Get commission history
    getCommissionHistory: builder.query<any[], string>({
      query: (vendorId) => `/vendormanagement/${vendorId}/commission/history`,
      providesTags: (result, error, vendorId) => [{ type: "VendorCommission", id: vendorId }],
    }),

    // Bulk update commissions
    bulkUpdateCommissions: builder.mutation<{ updated: number }, BulkCommissionUpdateRequest>({
      query: (data) => ({
        url: "/vendormanagement/bulk/commission",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Vendor", "VendorCommission"],
    }),

    // ================================
    // PAYOUT MANAGEMENT
    // ================================

    // Create payout
    createPayout: builder.mutation<any, { vendorId: string; data: VendorPayoutRequest }>({
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
    updatePayoutStatus: builder.mutation<any, { payoutId: string; status: string; paidAt?: string }>({
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
      providesTags: (result, error, vendorId) => [{ type: "VendorPayout", id: vendorId }],
    }),

    // Get payout summary
    getPayoutSummary: builder.query<PayoutSummary, string>({
      query: (vendorId) => `/vendormanagement/${vendorId}/payouts/summary`,
      providesTags: (result, error, vendorId) => [{ type: "VendorPayout", id: vendorId }],
    }),

    // ================================
    // MONTHLY CHARGES
    // ================================

    // Set monthly charge
    setMonthlyCharge: builder.mutation<any, { vendorId: string; data: VendorMonthlyChargeRequest }>({
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
    getVendorCharges: builder.query<any[], string>({
      query: (vendorId) => `/vendormanagement/${vendorId}/charges`,
      providesTags: (result, error, vendorId) => [{ type: "VendorCharge", id: vendorId }],
    }),

    // ================================
    // PROMOTIONAL OFFERS
    // ================================

    // Create offer
    createOffer: builder.mutation<any, { vendorId: string; data: VendorOfferRequest }>({
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
      providesTags: (result, error, vendorId) => [{ type: "VendorOffer", id: vendorId }],
    }),

    // Toggle offer status
    toggleOfferStatus: builder.mutation<any, { offerId: string; isActive: boolean }>({
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
      providesTags: (result, error, vendorId) => [{ type: "VendorPerformance", id: vendorId }],
    }),

    // Update vendor performance
    updateVendorPerformance: builder.mutation<any, string>({
      query: (vendorId) => ({
        url: `/vendormanagement/${vendorId}/performance/update`,
        method: "POST",
      }),
      invalidatesTags: (result, error, vendorId) => [{ type: "VendorPerformance", id: vendorId }],
    }),

    // ================================
    // FRAUD DETECTION
    // ================================

    // Detect fraud
    detectFraud: builder.query<FraudDetectionResult, string>({
      query: (vendorId) => `/vendormanagement/${vendorId}/fraud-detection`,
      providesTags: (result, error, vendorId) => [{ type: "Vendor", id: vendorId }],
    }),

    // ================================
    // FLAG MANAGEMENT
    // ================================

    // Flag vendor
    flagVendor: builder.mutation<any, { vendorId: string; data: VendorFlagRequest }>({
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
      providesTags: (result, error, vendorId) => [{ type: "VendorFlag", id: vendorId }],
    }),

    // ================================
    // CHAT/CONVERSATION MANAGEMENT
    // ================================

    // Get vendor conversations
    getVendorConversations: builder.query<any[], { vendorId?: string; userId?: string }>({
      query: (params) => ({
        url: "/vendormanagement/conversations",
        method: "GET",
        params,
      }),
      providesTags: ["Vendor"],
    }),

    // Get conversation messages
    getConversationMessages: builder.query<any[], string>({
      query: (conversationId) => `/vendormanagement/conversations/${conversationId}/messages`,
      providesTags: (result, error, conversationId) => [{ type: "Vendor", id: conversationId }],
    }),

    // Send message
    sendMessage: builder.mutation<any, { conversationId: string; content: string; metadata?: any }>({
      query: ({ conversationId, content, metadata }) => ({
        url: `/vendormanagement/conversations/${conversationId}/messages`,
        method: "POST",
        body: { content, metadata },
      }),
      invalidatesTags: (result, error, { conversationId }) => [{ type: "Vendor", id: conversationId }],
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
  }),
});

// ================================
// EXPORT HOOKS
// ================================

export const {
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
} = vendorManageApi;