// src/features/customerManageApi.ts
import { createApi } from "@reduxjs/toolkit/query/react";
import baseQueryWithReauth from "./baseQueryWithReauth";

// ================================
// TYPES
// ================================

export interface Customer {
  id: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  avatar?: string | null;
  status?: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING";
  createdAt?: string;
  updatedAt?: string;
  isVerified?: boolean;
  isActive?: boolean;
  customerProfile?: {
    id?: string;
    wallet?: number;
    loyaltyPoints?: number;
    phone?: string | null;
    address?: string | null;
  };
  _count?: {
    orders?: number;
    reviews?: number;
    supportTickets?: number;
  };
}

export interface CustomerWithDetails extends Customer {
  // extend if needed
}

export interface CreateCustomerRequest {
  name: string;
  email?: string;
  phone?: string;
  password: string;
  avatar?: string;
}

export interface UpdateCustomerProfileRequest {
  name?: string;
  avatar?: string;
  phone?: string;
  email?: string;
}

export interface CustomerFilterQuery {
  status?: string;
  search?: string;
  createdFrom?: string;
  createdTo?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface CustomerExportOptions {
  format?: "excel" | "csv" | "json";
  fields: string[];
  filters?: CustomerFilterQuery;
}

export interface CustomerPaginationResponse {
  data: Customer[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

// ================================
// CUSTOMER MANAGEMENT API
// ================================

export const customerManageApi = createApi({
  reducerPath: "customerManageApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    "Customer",
    "CustomerProfile",
    "CustomerLoyalty",
    "CustomerWallet",
    "CustomerReview",
    "CustomerComplaint",
  ],
  endpoints: (builder) => ({
    // Create new customer
    createCustomer: builder.mutation<Customer, CreateCustomerRequest>({
      query: (body) => ({
        url: "/customermanagement",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Customer"],
    }),

    // Get all customers with filtering and pagination
    getCustomers: builder.query<
      CustomerPaginationResponse,
      CustomerFilterQuery
    >({
      query: (params) => ({
        url: "/customermanagement",
        method: "GET",
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map((c) => ({
                type: "Customer" as const,
                id: c.id,
              })),
              { type: "Customer", id: "LIST" },
            ]
          : [{ type: "Customer", id: "LIST" }],
    }),

    // Get customer by ID
    getCustomerById: builder.query<CustomerWithDetails, string>({
      query: (id) => `/customermanagement/${id}`,
      providesTags: (result, error, id) => [{ type: "Customer", id }],
    }),

    // Update customer profile (PUT /:id/profile)
    updateCustomerProfile: builder.mutation<
      Customer,
      { id: string; data: UpdateCustomerProfileRequest }
    >({
      query: ({ id, data }) => ({
        url: `/customermanagement/${id}/profile`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Customer", id }],
    }),

    // Toggle block/unblock customer (PUT /:id/block)
    toggleCustomerBlock: builder.mutation<
      { message?: string },
      { id: string; block: boolean; reason?: string }
    >({
      query: ({ id, block, reason }) => ({
        url: `/customermanagement/${id}/block`,
        method: "PUT",
        body: { block, reason },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Customer", id }],
    }),

    // Delete customer (DELETE /:id)
    deleteCustomer: builder.mutation<{ message?: string }, string>({
      query: (id) => ({
        url: `/customermanagement/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Customer"],
    }),

    // Reviews
    getCustomerReviews: builder.query<any[], string>({
      query: (userId) => `/customermanagement/${userId}/reviews`,
      providesTags: (result, error, userId) => [
        { type: "CustomerReview", id: userId },
      ],
    }),

    moderateReview: builder.mutation<
      { message?: string },
      { reviewId: string; data: any }
    >({
      query: ({ reviewId, data }) => ({
        url: `/customermanagement/reviews/${reviewId}/moderate`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["CustomerReview"],
    }),

    // Complaints
    getComplaints: builder.query<any[], void>({
      query: () => `/customermanagement/complaints/list`,
      providesTags: ["CustomerComplaint"],
    }),

    updateComplaintStatus: builder.mutation<
      { message?: string },
      { complaintId: string; data: any }
    >({
      query: ({ complaintId, data }) => ({
        url: `/customermanagement/complaints/${complaintId}/status`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["CustomerComplaint"],
    }),

    addComplaintMessage: builder.mutation<
      { message?: string },
      { complaintId: string; data: any }
    >({
      query: ({ complaintId, data }) => ({
        url: `/customermanagement/complaints/${complaintId}/messages`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["CustomerComplaint"],
    }),

    // Wallet
    getWalletTransactions: builder.query<any[], string>({
      query: (userId) => `/customermanagement/${userId}/wallet-transactions`,
      providesTags: (result, error, userId) => [
        { type: "CustomerWallet", id: userId },
      ],
    }),

    adjustWallet: builder.mutation<
      { message?: string },
      { userId: string; data: any }
    >({
      query: ({ userId, data }) => ({
        url: `/customermanagement/${userId}/wallet-adjust`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (result, error, { userId }) => [
        { type: "CustomerWallet", id: userId },
      ],
    }),

    // Loyalty
    getLoyaltyTransactions: builder.query<any[], string>({
      query: (userId) => `/customermanagement/${userId}/loyalty-transactions`,
      providesTags: (result, error, userId) => [
        { type: "CustomerLoyalty", id: userId },
      ],
    }),

    adjustLoyalty: builder.mutation<
      { message?: string },
      { userId: string; data: any }
    >({
      query: ({ userId, data }) => ({
        url: `/customermanagement/${userId}/loyalty-adjust`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (result, error, { userId }) => [
        { type: "CustomerLoyalty", id: userId },
      ],
    }),

    // Export
    exportCustomers: builder.mutation<any, CustomerExportOptions>({
      query: (data) => ({
        url: `/customermanagement/export`,
        method: "POST",
        body: data,
      }),
    }),
  }),
});

// ================================
// EXPORT HOOKS
// ================================

export const {
  // CRUD
  useCreateCustomerMutation,
  useGetCustomersQuery,
  useGetCustomerByIdQuery,
  useUpdateCustomerProfileMutation,
  useToggleCustomerBlockMutation,
  useDeleteCustomerMutation,

  // Reviews
  useGetCustomerReviewsQuery,
  useModerateReviewMutation,

  // Complaints
  useGetComplaintsQuery,
  useUpdateComplaintStatusMutation,
  useAddComplaintMessageMutation,

  // Wallet
  useGetWalletTransactionsQuery,
  useAdjustWalletMutation,

  // Loyalty
  useGetLoyaltyTransactionsQuery,
  useAdjustLoyaltyMutation,

  // Export
  useExportCustomersMutation,
} = customerManageApi;
