// Admin Commission module API — /api/admin/commission.
// Canonical unit is PERCENT (0-100) everywhere; no /100 in the UI.
import { createApi } from "@reduxjs/toolkit/query/react";
import baseQueryWithReauth from "./baseQueryWithReauth";

export type CommissionSource =
  | "VENDOR_CATEGORY"
  | "VENDOR"
  | "BADGE_CATEGORY"
  | "BADGE"
  | "CATEGORY"
  | "GLOBAL_DEFAULT";

export type CommissionSettings = { defaultRate: number; vatRate: string | null; updatedAt: string };

export type CategoryRateNode = {
  id: string;
  name: string;
  path: string;
  depth: number;
  isLeaf: boolean;
  currentRate: number | null;
  ownRate: number | null;
  inherited: boolean;
  inheritedFrom: string | null;
  lastChange: { oldRate: number; newRate: number; delta: number; at: string } | null;
  children: CategoryRateNode[];
};

export type CategoryRatesResponse = { tree: CategoryRateNode[]; globalDefault: number; updatedAt: string };

export type CommissionVendorRow = {
  id: string;
  storeName: string;
  email: string | null;
  status: string;
  effectiveRate: number;
  source: CommissionSource;
  adjustment: { mode: "DELTA_POINTS" | "DELTA_PERCENT"; value: number } | null;
  overrideCount: number;
  hasVendorWideOverride: boolean;
  badge: { id: string; name: string } | null;
};

export type CommissionVendorList = {
  rows: CommissionVendorRow[];
  total: number;
  page: number;
  limit: number;
  pages: number;
  globalDefault: number;
};

export type CommissionVendorDetail = {
  vendor: { id: string; storeName: string; email: string | null; status: string };
  effectiveRate: number;
  source: CommissionSource;
  adjustment: { mode: "DELTA_POINTS" | "DELTA_PERCENT"; value: number; note: string | null } | null;
  badge: { id: string; name: string } | null;
  overrides: { id: string; categoryId: string | null; categoryPath: string; rate: number; note: string | null; updatedAt: string }[];
  history: HistoryRow[];
};

export type HistoryRow = {
  id: string;
  scope: string;
  targetId: string | null;
  vendorId: string | null;
  categoryId: string | null;
  badgeId: string | null;
  oldRate: string | null;
  newRate: string | null;
  delta: string | null;
  source: string;
  batchId: string | null;
  note: string | null;
  createdAt: string;
};

export type HistoryResponse = { rows: HistoryRow[]; total: number; page: number; limit: number; pages: number };

export type ExcelPreviewRow = {
  row: number;
  path: string;
  categoryId: string | null;
  matchedPath?: string;
  oldRate: number | null;
  newRate: number;
  delta: number | null;
  status: "OK" | "UNCHANGED" | "SKIPPED" | "NOT_FOUND" | "AMBIGUOUS" | "NOT_LEAF" | "INVALID" | "DUPLICATE";
  message?: string;
};

export type ExcelPreview = {
  rows: ExcelPreviewRow[];
  summary: Record<string, number>;
  batchId: string;
  applyToDescendants: boolean;
};

export type BadgeRow = {
  id: string;
  name: string;
  priority: number;
  isActive: boolean;
  vendorCount: number;
  rule: {
    id: string;
    mode: "AUTOMATIC" | "MANUAL";
    baseRate: number;
    priority: number;
    conditions: { all?: BadgeCondition[]; any?: BadgeCondition[] } | null;
    isActive: boolean;
    overrides: { id: string; categoryId: string; categoryPath: string; rate: number }[];
  } | null;
};

export type BadgeCondition = {
  metric: "completedOrders" | "sales" | "avgRating";
  op: ">=" | "<=" | ">" | "<";
  value: number;
};

type BulkInput = {
  vendorIds: string[];
  target: "ALL" | "CATEGORIES";
  categoryIds?: string[];
  mode: "FIXED" | "DELTA_POINTS" | "DELTA_PERCENT";
  value: number;
  note?: string | null;
};

type ExcelRowInput = { path: string; rate: unknown };

export const commissionApi = createApi({
  reducerPath: "commissionApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["CommissionSettings", "CommissionCategory", "CommissionVendor", "CommissionHistory", "CommissionBadge"],
  endpoints: (builder) => ({
    getCommissionOverview: builder.query<any, void>({
      query: () => "/admin/commission/overview",
      transformResponse: (res: any) => res.data,
      providesTags: ["CommissionHistory", "CommissionVendor"],
    }),
    getCommissionSettings: builder.query<CommissionSettings, void>({
      query: () => "/admin/commission/settings",
      transformResponse: (res: any) => res.data,
      providesTags: ["CommissionSettings"],
    }),
    updateCommissionSetting: builder.mutation<{ defaultRate?: number; vatRate?: string; changed: boolean }, { key: "default" | "vat"; value: string | number }>({
      query: (body) => ({ url: "/admin/commission/settings", method: "PUT", body }),
      transformResponse: (res: any) => res.data,
      invalidatesTags: ["CommissionSettings", "CommissionHistory", "CommissionCategory", "CommissionVendor"],
    }),
    getCategoryRates: builder.query<CategoryRatesResponse, void>({
      query: () => "/admin/commission/categories",
      transformResponse: (res: any) => res.data,
      providesTags: ["CommissionCategory"],
    }),
    setCategoryRate: builder.mutation<any, { categoryId: string; rate: number; note?: string }>({
      query: ({ categoryId, ...body }) => ({ url: `/admin/commission/categories/${categoryId}`, method: "PUT", body }),
      transformResponse: (res: any) => res.data,
      invalidatesTags: ["CommissionCategory", "CommissionHistory"],
    }),
    listCommissionVendors: builder.query<CommissionVendorList, { search?: string; status?: string; page?: number; limit?: number }>({
      query: (params) => ({ url: "/admin/commission/vendors", params }),
      transformResponse: (res: any) => res.data,
      providesTags: ["CommissionVendor"],
    }),
    getVendorCommission: builder.query<CommissionVendorDetail, string>({
      query: (vendorId) => `/admin/commission/vendors/${vendorId}`,
      transformResponse: (res: any) => res.data,
      providesTags: ["CommissionVendor", "CommissionHistory"],
    }),
    setVendorCommission: builder.mutation<any, { vendorId: string; categoryId?: string | null; rate?: number; mode?: "DELTA_POINTS" | "DELTA_PERCENT"; value?: number; note?: string | null }>({
      query: ({ vendorId, ...body }) => ({ url: `/admin/commission/vendors/${vendorId}`, method: "PUT", body }),
      transformResponse: (res: any) => res.data,
      invalidatesTags: ["CommissionVendor", "CommissionHistory", "CommissionCategory"],
    }),
    deleteVendorRate: builder.mutation<any, { vendorId: string; categoryId?: string | null }>({
      query: ({ vendorId, categoryId }) => ({
        url: `/admin/commission/vendors/${vendorId}/rate`,
        method: "DELETE",
        params: categoryId ? { categoryId } : undefined,
      }),
      transformResponse: (res: any) => res.data,
      invalidatesTags: ["CommissionVendor", "CommissionHistory"],
    }),
    deleteVendorAdjustment: builder.mutation<any, string>({
      query: (vendorId) => ({ url: `/admin/commission/vendors/${vendorId}/adjustment`, method: "DELETE" }),
      transformResponse: (res: any) => res.data,
      invalidatesTags: ["CommissionVendor", "CommissionHistory"],
    }),
    previewBulkCommission: builder.mutation<any, BulkInput>({
      query: (body) => ({ url: "/admin/commission/vendors/bulk/preview", method: "POST", body }),
      transformResponse: (res: any) => res.data,
    }),
    applyBulkCommission: builder.mutation<{ batchId: string; updated: number }, BulkInput>({
      query: (body) => ({ url: "/admin/commission/vendors/bulk", method: "POST", body }),
      transformResponse: (res: any) => res.data,
      invalidatesTags: ["CommissionVendor", "CommissionHistory"],
    }),
    getRateHistory: builder.query<HistoryResponse, { scope?: string; categoryId?: string; vendorId?: string; badgeId?: string; source?: string; from?: string; to?: string; page?: number; limit?: number }>({
      query: (params) => ({ url: "/admin/commission/history", params }),
      transformResponse: (res: any) => res.data,
      providesTags: ["CommissionHistory"],
    }),
    getExcelTemplate: builder.query<{ rows: { path: string; currentRate: number; inherited: boolean }[]; globalDefault: number }, void>({
      query: () => "/admin/commission/excel/template",
      transformResponse: (res: any) => res.data,
    }),
    previewExcel: builder.mutation<ExcelPreview, { rows: ExcelRowInput[]; applyToDescendants?: boolean }>({
      query: (body) => ({ url: "/admin/commission/excel/preview", method: "POST", body }),
      transformResponse: (res: any) => res.data,
    }),
    applyExcel: builder.mutation<{ batchId: string; applied: number; skipped: number; rows: ExcelPreviewRow[] }, { rows: ExcelRowInput[]; applyToDescendants?: boolean; batchId?: string; note?: string }>({
      query: (body) => ({ url: "/admin/commission/excel/apply", method: "POST", body }),
      transformResponse: (res: any) => res.data,
      invalidatesTags: ["CommissionCategory", "CommissionHistory"],
    }),
    listBadges: builder.query<BadgeRow[], void>({
      query: () => "/admin/commission/badges",
      transformResponse: (res: any) => res.data,
      providesTags: ["CommissionBadge"],
    }),
    createBadge: builder.mutation<any, { name: string; priority?: number; isActive?: boolean }>({
      query: (body) => ({ url: "/admin/commission/badges", method: "POST", body }),
      transformResponse: (res: any) => res.data,
      invalidatesTags: ["CommissionBadge"],
    }),
    updateBadge: builder.mutation<any, { badgeId: string; name?: string; priority?: number; isActive?: boolean }>({
      query: ({ badgeId, ...body }) => ({ url: `/admin/commission/badges/${badgeId}`, method: "PUT", body }),
      transformResponse: (res: any) => res.data,
      invalidatesTags: ["CommissionBadge"],
    }),
    setBadgeRule: builder.mutation<any, { badgeId: string; baseRate: number; mode?: "AUTOMATIC" | "MANUAL"; priority?: number; conditions?: any; isActive?: boolean }>({
      query: ({ badgeId, ...body }) => ({ url: `/admin/commission/badges/${badgeId}/rule`, method: "PUT", body }),
      transformResponse: (res: any) => res.data,
      invalidatesTags: ["CommissionBadge", "CommissionHistory"],
    }),
    setBadgeOverride: builder.mutation<any, { badgeId: string; categoryId: string; rate: number }>({
      query: ({ badgeId, ...body }) => ({ url: `/admin/commission/badges/${badgeId}/overrides`, method: "PUT", body }),
      transformResponse: (res: any) => res.data,
      invalidatesTags: ["CommissionBadge", "CommissionHistory"],
    }),
    deleteBadgeOverride: builder.mutation<any, { badgeId: string; categoryId: string }>({
      query: ({ badgeId, categoryId }) => ({
        url: `/admin/commission/badges/${badgeId}/overrides/${categoryId}`,
        method: "DELETE",
      }),
      transformResponse: (res: any) => res.data,
      invalidatesTags: ["CommissionBadge", "CommissionHistory"],
    }),
    assignBadge: builder.mutation<any, { badgeId: string; vendorIds: string[]; mode?: "MANUAL" | "AUTO" }>({
      query: ({ badgeId, ...body }) => ({ url: `/admin/commission/badges/${badgeId}/assign`, method: "POST", body }),
      transformResponse: (res: any) => res.data,
      invalidatesTags: ["CommissionBadge", "CommissionVendor"],
    }),
    unassignBadge: builder.mutation<any, { badgeId: string; vendorId: string }>({
      query: ({ badgeId, vendorId }) => ({ url: `/admin/commission/badges/${badgeId}/assign/${vendorId}`, method: "DELETE" }),
      transformResponse: (res: any) => res.data,
      invalidatesTags: ["CommissionBadge", "CommissionVendor"],
    }),
    badgeEligibility: builder.query<any, string>({
      query: (badgeId) => `/admin/commission/badges/${badgeId}/eligibility`,
      transformResponse: (res: any) => res.data,
      providesTags: ["CommissionBadge"],
    }),
    recalculateBadge: builder.mutation<any, string>({
      query: (badgeId) => ({ url: `/admin/commission/badges/${badgeId}/recalculate`, method: "POST" }),
      transformResponse: (res: any) => res.data,
      invalidatesTags: ["CommissionBadge", "CommissionVendor"],
    }),
  }),
});

export const {
  useGetCommissionOverviewQuery,
  useGetCommissionSettingsQuery,
  useUpdateCommissionSettingMutation,
  useGetCategoryRatesQuery,
  useSetCategoryRateMutation,
  useListCommissionVendorsQuery,
  useLazyListCommissionVendorsQuery,
  useGetVendorCommissionQuery,
  useSetVendorCommissionMutation,
  useDeleteVendorRateMutation,
  useDeleteVendorAdjustmentMutation,
  usePreviewBulkCommissionMutation,
  useApplyBulkCommissionMutation,
  useGetRateHistoryQuery,
  useGetExcelTemplateQuery,
  useLazyGetExcelTemplateQuery,
  usePreviewExcelMutation,
  useApplyExcelMutation,
  useListBadgesQuery,
  useCreateBadgeMutation,
  useUpdateBadgeMutation,
  useSetBadgeRuleMutation,
  useSetBadgeOverrideMutation,
  useDeleteBadgeOverrideMutation,
  useAssignBadgeMutation,
  useUnassignBadgeMutation,
  useBadgeEligibilityQuery,
  useRecalculateBadgeMutation,
} = commissionApi;
