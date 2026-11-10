// src/features/bankApi.ts
import { createApi } from "@reduxjs/toolkit/query/react";
import baseQueryWithReauth from "./baseQueryWithReauth";

/* ==================== REQUEST TYPES ==================== */
export interface CreateBankRequest {
  name: string;
  code?: string;
  swiftCode?: string;
}

// PATCH /banks/:bankId — any subset of fields
export interface UpdateBankRequest {
  bankId: string;
  name?: string;
  code?: string;
  swiftCode?: string;
  isActive?: boolean;
}

// POST /banks/:bankId/branches
export interface CreateBankBranchRequest {
  bankId: string;
  branchName: string;
  routingNumber?: string;
  isActive?: boolean;
}

// PATCH /banks/branches/:branchId — any subset of fields
export interface UpdateBankBranchRequest {
  branchId: string;
  branchName?: string;
  routingNumber?: string;
  isActive?: boolean;
}

/* ── Vendor/Admin payment accounts — one of four shapes, chosen by `type` ──
   Matches vendor.controller.ts's addBankAccount switch, which routes each
   type to its own BankAccountService method. Only send the fields that
   belong to the chosen type; the others don't apply and are ignored. ──── */

interface BankAccountFields {
  type: "BANK";
  bankBranchId: string;
  accountName: string;
  accountNumber: string;
  label?: string;
  isDefault?: boolean;
}

interface MobileBankingAccountFields {
  type: "MOBILE_BANKING";
  mobileProvider: "BKASH" | "NAGAD" | "ROCKET" | "UPAY" | "OTHER";
  walletNumber: string;
  walletKind?: string;
  label?: string;
  isDefault?: boolean;
}

interface CardAccountFields {
  type: "CARD";
  cardProcessor: string;
  merchantId?: string;
  label?: string;
  isDefault?: boolean;
}

interface CashAccountFields {
  type: "CASH";
  label?: string;
  isDefault?: boolean;
}

export type AddBankAccountRequest =
  | BankAccountFields
  | MobileBankingAccountFields
  | CardAccountFields
  | CashAccountFields;

export type AddVendorBankAccountRequest = AddBankAccountRequest & { vendorId: string };

export interface SetDefaultVendorBankAccountRequest {
  vendorId: string;
  bankAccountId: string;
}

/* ==================== RESPONSE TYPES ==================== */

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface BankImportSummary {
  imported: number;
  failed: number;
  errors: { row: number; message: string }[];
  banksCreated: number;
}

export interface Bank {
  id: string;
  name: string;
  code: string | null;
  swiftCode: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// A single branch, as returned by GET /banks/:bankId/branches
export interface BankBranch {
  id: string;
  bankId: string;
  bankName?: string;
  branchName: string;
  routingNumber: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// What a bank account's branch looks like when nested in a response
export interface BankAccountBranch extends BankBranch {
  bank: Bank;
}

export interface BankAccountCOA {
  id: string;
  code: string;
  name: string;
}

/* ── Payment account response — generic across all four types.
   Only the fields relevant to `type` will be non-null; e.g. a
   MOBILE_BANKING row has bankBranch: null but mobileProvider/walletNumber
   set, a CASH row has almost everything null except type/label. ──────── */
export interface VendorBankAccount {
  id: string;
  vendorId: string;
  type: "BANK" | "MOBILE_BANKING" | "CARD" | "CASH";

  // BANK fields
  bankBranchId: string | null;
  accountName: string | null;
  accountNumber: string | null;
  bankBranch: BankAccountBranch | null;

  // MOBILE_BANKING fields
  mobileProvider: "BKASH" | "NAGAD" | "ROCKET" | "UPAY" | "OTHER" | null;
  walletNumber: string | null;
  walletKind: string | null;

  // CARD fields
  cardProcessor: string | null;
  merchantId: string | null;

  // shared
  label: string | null;
  isDefault: boolean;
  chartOfAccountId: string | null;
  chartOfAccount: BankAccountCOA | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminBankAccount {
  id: string;
  type: "BANK" | "MOBILE_BANKING" | "CARD" | "CASH";
  bankBranchId: string | null;
  accountName: string | null;
  accountNumber: string | null;
  bankBranch: BankAccountBranch | null;
  mobileProvider: "BKASH" | "NAGAD" | "ROCKET" | "UPAY" | "OTHER" | null;
  walletNumber: string | null;
  cardProcessor: string | null;
  merchantId: string | null;
  label: string | null;
  isDefault: boolean;
  chartOfAccountId: string | null;
  chartOfAccount: BankAccountCOA | null;
  createdAt: string;
  updatedAt: string;
}

export interface BankBranchFilters {
  bankName?: string;
  branchName?: string;
  routingNumber?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedBranchResponse {
  success: boolean;
  data: BankBranch[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

/* ==================== API ==================== */

export const bankApi = createApi({
  reducerPath: "bankApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Bank", "BankBranch", "VendorBankAccount", "AdminBankAccount"],

  endpoints: (builder) => ({
    /* ─── POST /api/banks ────────────────────────────────────────────────────── */
    createBank: builder.mutation<ApiResponse<Bank>, CreateBankRequest>({
      query: (body) => ({
        url: "/banks",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Bank"],
    }),

    /* ─── PATCH /api/banks/:bankId ───────────────────────────────────────────── */
    updateBank: builder.mutation<ApiResponse<Bank>, UpdateBankRequest>({
      query: ({ bankId, ...body }) => ({
        url: `/banks/${bankId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { bankId }) => [
        "Bank",
        { type: "Bank", id: bankId },
      ],
    }),

    /* ─── DELETE /api/banks/:bankId — soft delete (isActive: false),
       also deactivates every branch under it ────────────────────────────────── */
    deleteBank: builder.mutation<ApiResponse<null>, string>({
      query: (bankId) => ({
        url: `/banks/${bankId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Bank", "BankBranch"],
    }),

    /* ─── POST /api/banks/:bankId/branches ──────────────────────────────────────
       Was missing from this slice even though the route exists on the
       backend — this is what lets admin add a branch under a bank. ────────── */
    createBankBranch: builder.mutation<
      ApiResponse<BankBranch>,
      CreateBankBranchRequest
    >({
      query: ({ bankId, ...body }) => ({
        url: `/banks/${bankId}/branches`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { bankId }) => [
        "BankBranch",
        { type: "BankBranch", id: bankId },
      ],
    }),

    /* ─── PATCH /api/banks/branches/:branchId ───────────────────────────────── */
    updateBankBranch: builder.mutation<
      ApiResponse<BankBranch>,
      UpdateBankBranchRequest
    >({
      query: ({ branchId, ...body }) => ({
        url: `/banks/branches/${branchId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { branchId }) => [
        "BankBranch",
        { type: "BankBranch", id: branchId },
      ],
    }),

    /* ─── DELETE /api/banks/branches/:branchId — soft delete (isActive: false) ─── */
    deleteBankBranch: builder.mutation<ApiResponse<null>, string>({
      query: (branchId) => ({
        url: `/banks/branches/${branchId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, branchId) => [
        "BankBranch",
        { type: "BankBranch", id: branchId },
      ],
    }),

    /* ─── GET /api/banks — master bank list, powers the "select bank" dropdown ─── */
    getBanks: builder.query<ApiResponse<Bank[]>, void>({
      query: () => "/banks",
      providesTags: ["Bank"],
    }),

    /* ─── GET /api/banks/branches — filtered + paginated, for the admin table ─── */
    getBankBranches: builder.query<PaginatedBranchResponse, BankBranchFilters>({
      query: (params) => ({
        url: "/banks/branches",
        params,
      }),
      providesTags: ["Bank", "BankBranch"],
    }),

    /* ─── GET /api/banks/branches/:branchId — single branch detail ─────────── */
    getBankBranchById: builder.query<ApiResponse<BankBranch>, string>({
      query: (branchId) => `/banks/branches/${branchId}`,
      providesTags: (_result, _error, branchId) => [
        { type: "BankBranch", id: branchId },
      ],
    }),

    /* ─── GET /api/banks/:bankId/branches — flat list for cascading dropdowns ─── */
    getBranchesByBank: builder.query<ApiResponse<BankBranch[]>, string>({
      query: (bankId) => `/banks/${bankId}/branches`,
      providesTags: (_result, _error, bankId) => [
        { type: "BankBranch", id: bankId },
      ],
    }),

    /* ─── GET /api/banks/template/download ──────────────────────────────────────
       Deliberately a MUTATION, not a query: it returns a Blob. RTK Query
       queries are cached in the Redux store, and a Blob there trips the
       `serializableCheck` middleware — even with keepUnusedDataFor: 0, the
       warning fires the moment the fulfilled action is dispatched, before
       the cache entry is cleared. Mutation results aren't kept in the
       store's `queries` cache the same way, so the Blob never lands in
       state — it just flows straight to the caller to trigger a file
       download. ─────────────────────────────────────────────────────────── */
    downloadBankTemplate: builder.mutation<Blob, void>({
      query: () => ({
        url: "/banks/template/download",
        responseHandler: (response) => response.blob(),
      }),
    }),

    /* ─── POST /api/banks/bulk-import  (multipart/form-data, field "file") ───── */
    bulkImportBanks: builder.mutation<BankImportSummary, FormData>({
      query: (formData) => ({
        url: "/banks/bulk-import",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["Bank", "BankBranch"],
    }),

    /* ─── POST /api/vendor/:vendorId/bank-accounts
       Accepts BANK, MOBILE_BANKING, CARD or CASH — `type` picks the shape. ─── */
    addVendorBankAccount: builder.mutation<
      ApiResponse<VendorBankAccount>,
      AddVendorBankAccountRequest
    >({
      query: ({ vendorId, ...body }) => ({
        url: `/vendor/${vendorId}/bank-accounts`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { vendorId }) => [
        { type: "VendorBankAccount", id: vendorId },
      ],
    }),

    /* ─── GET /api/vendor/:vendorId/bank-accounts
       Returns every payment account for this vendor across all four types. ─── */
    getVendorBankAccounts: builder.query<
      ApiResponse<VendorBankAccount[]>,
      string
    >({
      query: (vendorId) => `/vendor/${vendorId}/bank-accounts`,
      providesTags: (_result, _error, vendorId) => [
        { type: "VendorBankAccount", id: vendorId },
      ],
    }),

    /* ─── PATCH /api/vendor/:vendorId/bank-accounts/:bankAccountId/default ──── */
    setDefaultVendorBankAccount: builder.mutation<
      ApiResponse<VendorBankAccount>,
      SetDefaultVendorBankAccountRequest
    >({
      query: ({ vendorId, bankAccountId }) => ({
        url: `/vendor/${vendorId}/bank-accounts/${bankAccountId}/default`,
        method: "PATCH",
      }),
      invalidatesTags: (_result, _error, { vendorId }) => [
        { type: "VendorBankAccount", id: vendorId },
      ],
    }),

    /* ─── POST /api/admin/bank-accounts — same four-shape union as vendor ──── */
    addAdminBankAccount: builder.mutation<
      ApiResponse<AdminBankAccount>,
      AddBankAccountRequest
    >({
      query: (body) => ({
        url: "/admin/bank-accounts",
        method: "POST",
        body,
      }),
      invalidatesTags: ["AdminBankAccount"],
    }),

    /* ─── GET /api/admin/bank-accounts ───────────────────────────────────────── */
    getAdminBankAccounts: builder.query<ApiResponse<AdminBankAccount[]>, void>({
      query: () => "/admin/bank-accounts",
      providesTags: ["AdminBankAccount"],
    }),

    /* ─── PATCH /api/admin/bank-accounts/:bankAccountId/default ─────────────── */
    setDefaultAdminBankAccount: builder.mutation<
      ApiResponse<AdminBankAccount>,
      string
    >({
      query: (bankAccountId) => ({
        url: `/admin/bank-accounts/${bankAccountId}/default`,
        method: "PATCH",
      }),
      invalidatesTags: ["AdminBankAccount"],
    }),
  }),
});

/* ==================== EXPORT HOOKS ==================== */

export const {
  useCreateBankMutation,
  useUpdateBankMutation,
  useDeleteBankMutation,
  useCreateBankBranchMutation,
  useUpdateBankBranchMutation,
  useDeleteBankBranchMutation,
  useGetBanksQuery,
  useLazyGetBanksQuery,
  useGetBankBranchesQuery,
  useLazyGetBankBranchesQuery,
  useGetBankBranchByIdQuery,
  useGetBranchesByBankQuery,
  useLazyGetBranchesByBankQuery,
  useDownloadBankTemplateMutation,
  useBulkImportBanksMutation,
  useAddVendorBankAccountMutation,
  useGetVendorBankAccountsQuery,
  useLazyGetVendorBankAccountsQuery,
  useSetDefaultVendorBankAccountMutation,
  useAddAdminBankAccountMutation,
  useGetAdminBankAccountsQuery,
  useLazyGetAdminBankAccountsQuery,
  useSetDefaultAdminBankAccountMutation,
} = bankApi;