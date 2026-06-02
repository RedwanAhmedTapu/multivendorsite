import { createApi } from "@reduxjs/toolkit/query/react";
import baseQueryWithReauth from "./baseQueryWithReauth";

/* ==================== REQUEST TYPES ==================== */

export type SupplierType = "LOCAL" | "FOREIGN" | "MANUFACTURER" | "DISTRIBUTOR";
export type SupplierStatus = "ACTIVE" | "INACTIVE";
export type EntityType = "ADMIN" | "VENDOR";

export interface CreateSupplierRequest {
  name: string;
  supplierType: SupplierType;
  contactName?: string;
  phone: string;
  phone2?: string;
  email: string;
  country?: string;
  city?: string;
  zipCode?: string;
  fullAddress?: string;
  paymentTerms?: string;
  creditLimit?: number;
  bankAccountName?: string;
  bankAccountNo?: string;
  bankName?: string;
  bankBranch?: string;
  routingNo?: string;
  notes?: string;
  entityType: EntityType;
  entityId?: string;
}

export interface UpdateSupplierRequest
  extends Partial<Omit<CreateSupplierRequest, "name" | "entityType" | "entityId">> {
  status?: SupplierStatus;
}

export interface SupplierListParams {
  search?: string;
  status?: SupplierStatus;
  supplierType?: SupplierType;
  entityType?: EntityType;
  entityId?: string;
  page?: number;
  limit?: number;
}

/* ==================== RESPONSE TYPES ==================== */

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface SupplierCOA {
  id: string;
  code: string;
  name: string;
}

export interface Supplier {
  id: string;
  name: string;
  supplierType: SupplierType;
  status: SupplierStatus;
  contactName: string | null;
  phone: string;
  phone2: string | null;
  email: string;
  country: string | null;
  city: string | null;
  zipCode: string | null;
  fullAddress: string | null;
  paymentTerms: string | null;
  creditLimit: number;
  bankAccountName: string | null;
  bankAccountNo: string | null;
  bankName: string | null;
  bankBranch: string | null;
  routingNo: string | null;
  notes: string | null;
  coaAccountId: string | null;
  coaAccount: SupplierCOA | null;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierWithDue extends Supplier {
  totalDue: number;
}

export interface SupplierDueOrder {
  id: string;
  purchaseNo: string;
  purchaseDate: string;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  status: string;
}

export interface SupplierDuesResponse {
  supplier: { id: string; name: string };
  totalDue: number;
  pendingOrders: SupplierDueOrder[];
}

export interface ToggleStatusResponse {
  id: string;
  name: string;
  status: SupplierStatus;
}

/* ==================== API ==================== */

export const supplierApi = createApi({
  reducerPath: "supplierApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Supplier", "SupplierDues"],

  endpoints: (builder) => ({

    /* ─── POST /api/suppliers ─────────────────────────────────────────────── */
    createSupplier: builder.mutation<ApiResponse<SupplierWithDue>, CreateSupplierRequest>({
      query: (body) => ({
        url: "/suppliers",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Supplier"],
    }),

    /* ─── GET /api/suppliers ──────────────────────────────────────────────── */
    getSuppliers: builder.query<PaginatedResponse<SupplierWithDue>, SupplierListParams>({
      query: (params) => ({
        url: "/suppliers",
        params,
      }),
      providesTags: ["Supplier"],
    }),

    /* ─── GET /api/suppliers/:id ──────────────────────────────────────────── */
    getSupplierById: builder.query<ApiResponse<SupplierWithDue>, string>({
      query: (id) => `/suppliers/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Supplier", id }],
    }),

    /* ─── PUT /api/suppliers/:id ──────────────────────────────────────────── */
    updateSupplier: builder.mutation<
      ApiResponse<Supplier>,
      { id: string; data: UpdateSupplierRequest }
    >({
      query: ({ id, data }) => ({
        url: `/suppliers/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Supplier", id },
        "Supplier",
      ],
    }),

    /* ─── PATCH /api/suppliers/:id/status ────────────────────────────────── */
    toggleSupplierStatus: builder.mutation<ApiResponse<ToggleStatusResponse>, string>({
      query: (id) => ({
        url: `/suppliers/${id}/status`,
        method: "PATCH",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Supplier", id },
        "Supplier",
      ],
    }),

    /* ─── GET /api/suppliers/:id/dues ─────────────────────────────────────── */
    getSupplierDues: builder.query<ApiResponse<SupplierDuesResponse>, string>({
      query: (id) => `/suppliers/${id}/dues`,
      providesTags: (_result, _error, id) => [{ type: "SupplierDues", id }],
    }),
  }),
});

/* ==================== EXPORT HOOKS ==================== */

export const {
  useCreateSupplierMutation,
  useGetSuppliersQuery,
  useLazyGetSuppliersQuery,
  useGetSupplierByIdQuery,
  useLazyGetSupplierByIdQuery,
  useUpdateSupplierMutation,
  useToggleSupplierStatusMutation,
  useGetSupplierDuesQuery,
  useLazyGetSupplierDuesQuery,
} = supplierApi;