import { createApi } from "@reduxjs/toolkit/query/react";
import baseQueryWithReauth from "./baseQueryWithReauth";

export type ProductField =
  | "NAME_BN"
  | "DESCRIPTION"
  | "IMAGES"
  | "VARIANT_IMAGES"
  | "WARRANTY"
  | "ATTRIBUTES"
  | "SPECIAL_PRICE"
  | "DISCOUNT"
  | "SKU"
  | "STOCK";

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface VendorProductFieldRule {
  id: string;
  vendorId: string;
  categoryId: string | null;
  field: ProductField;
  isEnabled: boolean;
  isRequired: boolean;
  setById: string;
  createdAt: string;
  updatedAt: string;
  category?: { id: string; name: string } | null;
}

export interface ResolvedFieldRule {
  isEnabled: boolean;
  isRequired: boolean;
  source: "category" | "vendor" | "default";
}

export type ResolvedProductFieldRules = Record<ProductField, ResolvedFieldRule>;

// ======================
// A "scope" = one (vendorId, categoryId) pair that has at least one
// field rule configured, with counts rolled up across its fields.
// ======================
export interface PermissionScope {
  vendorId: string;
  vendorName: string;
  categoryId: string | null;
  categoryName: string | null;
  totalFields: number;
  enabledCount: number;
  requiredCount: number;
  updatedAt: string;
}

interface UpsertRuleBody {
  categoryId?: string | null;
  field: ProductField;
  isEnabled?: boolean;
  isRequired?: boolean;
}

interface BulkUpsertBody {
  categoryId?: string | null;
  rules: { field: ProductField; isEnabled?: boolean; isRequired?: boolean }[];
}

interface ListScopesParams {
  search?: string;
  page?: number;
  limit?: number;
}

export const productrequiredfieldsettingsAdminApi = createApi({
  reducerPath: "productrequiredfieldsettingsAdminApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["ProductFieldRules"],

  endpoints: (builder) => ({
    // ======================
    // VENDOR: resolved rules for the add-product form
    // ======================
    getMyProductFieldRules: builder.query<
      ResolvedProductFieldRules,
      { categoryId?: string } | void
    >({
      query: (params) => {
        const qs = params?.categoryId ? `?categoryId=${params.categoryId}` : "";
        return { url: `/product-field-rules/vendor/my-rules${qs}`, method: "GET" };
      },
      transformResponse: (response: ApiResponse<ResolvedProductFieldRules>) =>
        response.data,
      providesTags: [{ type: "ProductFieldRules", id: "MINE" }],
    }),

    // ======================
    // ADMIN: available fields for the settings UI
    // ======================
    getAvailableProductFields: builder.query<ProductField[], void>({
      query: () => ({ url: "/product-field-rules/admin/fields", method: "GET" }),
      transformResponse: (response: ApiResponse<ProductField[]>) => response.data,
    }),

    // ======================
    // ADMIN: rules configured for a vendor (raw rows, optionally scoped)
    // ======================
    getVendorProductFieldRules: builder.query<
      VendorProductFieldRule[],
      { vendorId: string; categoryId?: string }
    >({
      query: ({ vendorId, categoryId }) => {
        const qs = categoryId ? `?categoryId=${categoryId}` : "";
        return { url: `/product-field-rules/admin/vendor/${vendorId}${qs}`, method: "GET" };
      },
      transformResponse: (response: ApiResponse<VendorProductFieldRule[]>) =>
        response.data,
      providesTags: (result, error, { vendorId }) => [
        { type: "ProductFieldRules", id: vendorId },
      ],
    }),

    // ======================
    // ADMIN: browse every vendor/scope pair that currently has rules
    // ======================
    listPermissionScopes: builder.query<
      { scopes: PermissionScope[]; pagination: PaginationMeta },
      ListScopesParams | void
    >({
      query: (params = {}) => {
        const qs = new URLSearchParams();
        Object.entries(params ?? {}).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            qs.append(key, String(value));
          }
        });
        const queryString = qs.toString();
        return {
          url: `/product-field-rules/admin/scopes${queryString ? `?${queryString}` : ""}`,
          method: "GET",
        };
      },
      transformResponse: (
        response: ApiResponse<PermissionScope[]> & { pagination: PaginationMeta }
      ) => ({
        scopes: response.data,
        pagination: response.pagination,
      }),
      providesTags: (result) =>
        result
          ? [
              { type: "ProductFieldRules" as const, id: "SCOPES" },
              ...result.scopes.map((s) => ({
                type: "ProductFieldRules" as const,
                id: `${s.vendorId}::${s.categoryId ?? "null"}`,
              })),
            ]
          : [{ type: "ProductFieldRules" as const, id: "SCOPES" }],
    }),

    // ======================
    // ADMIN: upsert a single rule
    // ======================
    upsertProductFieldRule: builder.mutation<
      VendorProductFieldRule,
      { vendorId: string; body: UpsertRuleBody }
    >({
      query: ({ vendorId, body }) => ({
        url: `/product-field-rules/admin/vendor/${vendorId}`,
        method: "PUT",
        body,
      }),
      transformResponse: (response: ApiResponse<VendorProductFieldRule>) =>
        response.data,
      invalidatesTags: (result, error, { vendorId }) => [
        { type: "ProductFieldRules", id: vendorId },
        { type: "ProductFieldRules", id: "MINE" },
        { type: "ProductFieldRules", id: "SCOPES" },
      ],
    }),

    // ======================
    // ADMIN: bulk upsert (save the whole settings form)
    // ======================
    bulkUpsertProductFieldRules: builder.mutation<
      VendorProductFieldRule[],
      { vendorId: string; body: BulkUpsertBody }
    >({
      query: ({ vendorId, body }) => ({
        url: `/product-field-rules/admin/vendor/${vendorId}/bulk`,
        method: "PUT",
        body,
      }),
      transformResponse: (response: ApiResponse<VendorProductFieldRule[]>) =>
        response.data,
      invalidatesTags: (result, error, { vendorId }) => [
        { type: "ProductFieldRules", id: vendorId },
        { type: "ProductFieldRules", id: "MINE" },
        { type: "ProductFieldRules", id: "SCOPES" },
      ],
    }),

    // ======================
    // ADMIN: remove a single field rule
    // ======================
    deleteProductFieldRule: builder.mutation<
      ApiResponse<null>,
      { id: string; vendorId: string }
    >({
      query: ({ id }) => ({
        url: `/product-field-rules/admin/${id}`,
        method: "DELETE",
      }),
      transformResponse: (response: ApiResponse<null>) => response,
      invalidatesTags: (result, error, { vendorId }) => [
        { type: "ProductFieldRules", id: vendorId },
        { type: "ProductFieldRules", id: "MINE" },
        { type: "ProductFieldRules", id: "SCOPES" },
      ],
    }),

    // ======================
    // ADMIN: remove every field rule for one vendor/scope pair at once
    // (used by the assignments list's "Remove" action)
    // ======================
    deleteScope: builder.mutation<
      ApiResponse<null>,
      { vendorId: string; categoryId: string | null }
    >({
      query: ({ vendorId, categoryId }) => ({
        url: `/product-field-rules/admin/vendor/${vendorId}/scope`,
        method: "DELETE",
        body: { categoryId },
      }),
      transformResponse: (response: ApiResponse<null>) => response,
      invalidatesTags: (result, error, { vendorId }) => [
        { type: "ProductFieldRules", id: "SCOPES" },
        { type: "ProductFieldRules", id: vendorId },
        { type: "ProductFieldRules", id: "MINE" },
      ],
    }),
  }),
});

export const {
  useGetMyProductFieldRulesQuery,
  useGetAvailableProductFieldsQuery,
  useGetVendorProductFieldRulesQuery,
  useListPermissionScopesQuery,
  useUpsertProductFieldRuleMutation,
  useBulkUpsertProductFieldRulesMutation,
  useDeleteProductFieldRuleMutation,
  useDeleteScopeMutation,
} = productrequiredfieldsettingsAdminApi;