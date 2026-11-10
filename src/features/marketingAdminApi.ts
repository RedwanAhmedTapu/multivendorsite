// src/features/marketingAdminApi.ts
//
// Marketing Center — admin API for the VENDOR PROGRAMME of a campaign page.
// One RTK Query endpoint per backend route under /api/marketing/admin
// (multivendorbackend src/modules/marketing/admin-campaign.routes.ts):
//
//   GET    /campaign-pages                      ?search&page&limit → { data: CampaignPageSummary[], pagination }
//   GET    /campaign-pages/:pageId/programme                         → { data: { page, programme | null } }
//   POST   /campaign-pages/:pageId/programme    ProgrammeBody        → 201 { data: AdminProgramme }
//   PATCH  /programmes/:id                      Partial<ProgrammeBody> & { acknowledgeTightening? }
//                                                                    → { data, warning? } | 409 tightening | 422
//   POST   /programmes/:id/publish                                   → { data }
//   POST   /programmes/:id/cancel               { reason }           → { data }
//   GET    /programmes/:id/registrations        ?status&vendorId&page&limit → { data: AdminRegistration[], pagination }
//   POST   /programmes/:id/registrations/bulk-review  BulkReviewBody → { data: BulkPreview | BulkResult }
//   POST   /registrations/:id/approve                                → { data } | 422 violations
//   POST   /registrations/:id/reject            { reason }           → { data }
// The page itself (title, slug, hero, start/end dates, blocks) is edited with
// campaignPageApi (/api/campaigns, ADMIN only).

import { createApi } from "@reduxjs/toolkit/query/react";
import baseQueryWithReauth from "./baseQueryWithReauth";

export type ProgrammeStatus = "DRAFT" | "PUBLISHED" | "ENDED" | "CANCELLED";
export type ProgrammePhase = "DRAFT" | "CANCELLED" | "ENDED" | "UPCOMING" | "REGISTRATION_OPEN" | "REGISTRATION_CLOSED" | "LIVE";
export type RegistrationStatus = "PENDING" | "APPROVED" | "REJECTED" | "WITHDRAWN";
/** Decimals arrive as strings (Prisma Decimal JSON). */
export type DecimalString = string;

export interface RegistrationCounts {
  pending: number;
  approved: number;
  rejected: number;
  withdrawn: number;
  total: number;
  vendors: number;
}

export interface ProgrammePage {
  id: string;
  title: string;
  slug: string;
  status: string;
  heroImage: string | null;
  startDate: string | null;
  endDate: string | null;
}

export interface CampaignPageSummary extends ProgrammePage {
  programme: { id: string; status: ProgrammeStatus; counts?: RegistrationCounts } | null;
}

export interface AdminProgramme {
  id: string;
  campaignPageId: string;
  registrationStartAt: string;
  registrationEndAt: string;
  status: ProgrammeStatus;
  minDiscountPercent: DecimalString;
  minStock: number;
  maxProductsPerVendor: number | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  categories: { categoryId: string; category?: { id: string; name: string; slug: string } }[];
  categoryIds?: string[];
  campaignPage: ProgrammePage;
  phase: ProgrammePhase | ProgrammeStatus;
  counts?: RegistrationCounts;
}

export interface ProgrammeBody {
  registrationStartAt: string;
  registrationEndAt: string;
  minDiscountPercent: number;
  minStock: number;
  maxProductsPerVendor?: number | null;
  categoryIds: string[];
}

export interface AdminRegistration {
  id: string;
  campaignId: string;
  vendorId: string;
  productId: string;
  variantId: string;
  campaignPrice: DecimalString;
  originalPrice: DecimalString;
  committedStock: number;
  status: RegistrationStatus;
  rejectionReason: string | null;
  reviewedAt: string | null;
  createdAt: string;
  vendor: { id: string; storeName: string };
  product: { id: string; name: string; slug: string };
  variant: { id: string; sku: string; price: DecimalString; specialPrice: DecimalString | null; stock: number };
}

export interface RuleViolation {
  rule: string;
  message: string;
}

export interface BulkReviewBody {
  action: "approve" | "reject";
  registrationIds?: string[];
  reason?: string;
  confirm?: boolean;
  expectedCount?: number;
}
export interface BulkPreview {
  confirmRequired: true;
  action: "approve" | "reject";
  count: number;
  eligibleCount?: number;
  ineligible?: { id: string; violations: RuleViolation[] }[];
}
export interface BulkResult {
  action: "approve" | "reject";
  count: number;
  appliedCount: number;
  applied: string[];
  skipped: { id: string; status: number; message: string; details?: { violations?: RuleViolation[] } }[];
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
interface ListResponse<T> {
  success: boolean;
  data: T[];
  pagination: Pagination;
}
interface ItemResponse<T> {
  success: boolean;
  data: T;
}

const BASE = "/marketing/admin";
const enc = encodeURIComponent;

export const marketingAdminApi = createApi({
  reducerPath: "marketingAdminApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["MktPages", "MktProgramme", "MktRegistration"],
  // Page dates are edited through campaignPageApi; refetch when a tab opens.
  refetchOnMountOrArgChange: true,
  endpoints: (b) => ({
    listMarketingCampaignPages: b.query<ListResponse<CampaignPageSummary>, { search?: string; page?: number; limit?: number }>({
      query: (params) => ({ url: `${BASE}/campaign-pages`, params }),
      providesTags: ["MktPages"],
    }),
    getCampaignProgramme: b.query<ItemResponse<{ page: ProgrammePage; programme: AdminProgramme | null }>, string>({
      query: (pageId) => `${BASE}/campaign-pages/${enc(pageId)}/programme`,
      providesTags: (_r, _e, pageId) => [{ type: "MktProgramme", id: pageId }],
    }),
    createCampaignProgramme: b.mutation<ItemResponse<AdminProgramme>, { pageId: string; body: ProgrammeBody }>({
      query: ({ pageId, body }) => ({ url: `${BASE}/campaign-pages/${enc(pageId)}/programme`, method: "POST", body }),
      invalidatesTags: (_r, _e, { pageId }) => ["MktPages", { type: "MktProgramme", id: pageId }],
    }),
    updateCampaignProgramme: b.mutation<ItemResponse<AdminProgramme> & { warning?: { tightened: string[]; affectedRegistrations: number } }, { id: string; pageId: string; body: Partial<ProgrammeBody> & { acknowledgeTightening?: boolean } }>({
      query: ({ id, body }) => ({ url: `${BASE}/programmes/${enc(id)}`, method: "PATCH", body }),
      invalidatesTags: (_r, _e, { pageId }) => ["MktPages", { type: "MktProgramme", id: pageId }],
    }),
    publishCampaignProgramme: b.mutation<ItemResponse<AdminProgramme>, { id: string; pageId: string }>({
      query: ({ id }) => ({ url: `${BASE}/programmes/${enc(id)}/publish`, method: "POST" }),
      invalidatesTags: (_r, _e, { pageId }) => ["MktPages", { type: "MktProgramme", id: pageId }],
    }),
    cancelCampaignProgramme: b.mutation<ItemResponse<AdminProgramme>, { id: string; pageId: string; reason: string }>({
      query: ({ id, reason }) => ({ url: `${BASE}/programmes/${enc(id)}/cancel`, method: "POST", body: { reason } }),
      invalidatesTags: (_r, _e, { pageId }) => ["MktPages", { type: "MktProgramme", id: pageId }],
    }),
    listProgrammeRegistrations: b.query<ListResponse<AdminRegistration>, { id: string; status?: RegistrationStatus; vendorId?: string; page?: number; limit?: number }>({
      query: ({ id, ...params }) => ({ url: `${BASE}/programmes/${enc(id)}/registrations`, params }),
      providesTags: ["MktRegistration"],
    }),
    bulkReviewRegistrations: b.mutation<ItemResponse<BulkPreview | BulkResult>, { id: string; pageId: string; body: BulkReviewBody }>({
      query: ({ id, body }) => ({ url: `${BASE}/programmes/${enc(id)}/registrations/bulk-review`, method: "POST", body }),
      // A preview changes nothing; only a confirmed run refreshes the lists.
      invalidatesTags: (_r, _e, { pageId, body }) => (body.confirm ? ["MktRegistration", "MktPages", { type: "MktProgramme", id: pageId }] : []),
    }),
    approveCampaignRegistration: b.mutation<ItemResponse<{ id: string; status: "APPROVED" }>, { registrationId: string; pageId: string }>({
      query: ({ registrationId }) => ({ url: `${BASE}/registrations/${enc(registrationId)}/approve`, method: "POST" }),
      invalidatesTags: (_r, _e, { pageId }) => ["MktRegistration", "MktPages", { type: "MktProgramme", id: pageId }],
    }),
    rejectCampaignRegistration: b.mutation<ItemResponse<{ id: string; status: "REJECTED" }>, { registrationId: string; pageId: string; reason: string }>({
      query: ({ registrationId, reason }) => ({ url: `${BASE}/registrations/${enc(registrationId)}/reject`, method: "POST", body: { reason } }),
      invalidatesTags: (_r, _e, { pageId }) => ["MktRegistration", "MktPages", { type: "MktProgramme", id: pageId }],
    }),
  }),
});

export const {
  useListMarketingCampaignPagesQuery,
  useGetCampaignProgrammeQuery,
  useCreateCampaignProgrammeMutation,
  useUpdateCampaignProgrammeMutation,
  usePublishCampaignProgrammeMutation,
  useCancelCampaignProgrammeMutation,
  useListProgrammeRegistrationsQuery,
  useBulkReviewRegistrationsMutation,
  useApproveCampaignRegistrationMutation,
  useRejectCampaignRegistrationMutation,
} = marketingAdminApi;
