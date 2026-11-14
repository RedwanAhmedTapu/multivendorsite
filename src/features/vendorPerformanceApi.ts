// features/vendorPerformanceApi.ts
//
// Admin vendor-performance endpoints (Phase 4). Injected into the existing
// vendorManageApi slice so the store registration in store.ts stays untouched:
// the base query, auth refresh behaviour and tag types are shared.
//
// All routes live under /api/admin/vendor-performance and are protected by
// authenticateUser + ADMIN/EMPLOYEE + blockVendorEmployees +
// requirePermission("analytics") on the server. The vendor id here is always an
// admin-selected route parameter, never a session value.

import { vendorManageApi } from "./vendorManageApi";
import type {
  CatalogResponse,
  ConfigResponse,
  DistributionResponse,
  ExpiryMissingResponse,
  HistoryResponse,
  KycResponse,
  PerformanceListQuery,
  PerformanceListResponse,
  PublishConfigResponse,
  RunResponse,
  SetExpiryResponse,
} from "@/components/vendor-performance/types";

const BASE = "/admin/vendor-performance";

export const vendorPerformanceApi = vendorManageApi.injectEndpoints({
  endpoints: (builder) => ({
    getVendorPerformanceList: builder.query<PerformanceListResponse, PerformanceListQuery>({
      query: (params) => ({
        url: BASE,
        method: "GET",
        params: {
          page: params.page,
          limit: params.limit,
          ...(params.search ? { search: params.search } : {}),
          ...(params.grade ? { grade: params.grade } : {}),
          ...(params.kycStatus ? { kycStatus: params.kycStatus } : {}),
          ...(params.sort ? { sort: params.sort } : {}),
        },
      }),
      providesTags: ["VendorPerformance"],
    }),

    getVendorPerformanceDistribution: builder.query<DistributionResponse, void>({
      query: () => ({ url: `${BASE}/distribution`, method: "GET" }),
      providesTags: ["VendorPerformance"],
    }),

    getVendorPerformanceHistory: builder.query<
      HistoryResponse,
      { vendorId: string; days?: number }
    >({
      query: ({ vendorId, days = 24 }) => ({
        url: `${BASE}/vendors/${encodeURIComponent(vendorId)}/history`,
        method: "GET",
        params: { days },
      }),
      providesTags: (result, error, { vendorId }) => [
        { type: "VendorPerformance", id: vendorId },
      ],
    }),

    getVendorPerformanceCatalog: builder.query<
      CatalogResponse,
      { vendorId: string; limit?: number }
    >({
      query: ({ vendorId, limit = 50 }) => ({
        url: `${BASE}/vendors/${encodeURIComponent(vendorId)}/catalog`,
        method: "GET",
        params: { limit },
      }),
      providesTags: (result, error, { vendorId }) => [
        { type: "VendorPerformance", id: vendorId },
      ],
    }),

    getVendorPerformanceKyc: builder.query<KycResponse, string>({
      query: (vendorId) => ({
        url: `${BASE}/vendors/${encodeURIComponent(vendorId)}/kyc`,
        method: "GET",
      }),
      providesTags: (result, error, vendorId) => [
        { type: "VendorPerformance", id: vendorId },
        "VendorDocument",
      ],
    }),

    getVendorPerformanceExpiryMissing: builder.query<
      ExpiryMissingResponse,
      { page: number; limit: number }
    >({
      query: (params) => ({
        url: `${BASE}/expiry-missing`,
        method: "GET",
        params,
      }),
      providesTags: ["VendorDocument"],
    }),

    setVendorDocumentExpiry: builder.mutation<
      SetExpiryResponse,
      { documentId: string; expiresAt: string }
    >({
      query: ({ documentId, expiresAt }) => ({
        url: `${BASE}/documents/${encodeURIComponent(documentId)}/expiry`,
        method: "PATCH",
        body: { expiresAt },
      }),
      invalidatesTags: ["VendorDocument", "VendorPerformance"],
    }),

    runVendorPerformanceSnapshot: builder.mutation<
      RunResponse,
      { vendorId: string; dryRun: boolean }
    >({
      query: ({ vendorId, dryRun }) => ({
        url: `${BASE}/run`,
        method: "POST",
        params: { vendorId, dryRun },
      }),
      invalidatesTags: ["VendorPerformance", "VendorDocument"],
    }),

    getVendorPerformanceConfig: builder.query<ConfigResponse, void>({
      query: () => ({ url: `${BASE}/config`, method: "GET" }),
      providesTags: ["VendorPerformance"],
    }),

    publishVendorPerformanceConfig: builder.mutation<
      PublishConfigResponse,
      { config: unknown; note?: string | null }
    >({
      query: ({ config, note }) => ({
        url: `${BASE}/config`,
        method: "POST",
        body: { config, note: note ?? null },
      }),
      invalidatesTags: ["VendorPerformance"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetVendorPerformanceListQuery,
  useGetVendorPerformanceDistributionQuery,
  useGetVendorPerformanceHistoryQuery,
  useGetVendorPerformanceCatalogQuery,
  useGetVendorPerformanceKycQuery,
  useGetVendorPerformanceExpiryMissingQuery,
  useSetVendorDocumentExpiryMutation,
  useRunVendorPerformanceSnapshotMutation,
  useGetVendorPerformanceConfigQuery,
  usePublishVendorPerformanceConfigMutation,
} = vendorPerformanceApi;
