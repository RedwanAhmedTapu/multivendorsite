// features/reviewModerationApi.ts
//
// Vendor + admin review management.
//
// Feeds are LIVE: GET /api/vendor/reviews and GET /api/admin/reviews are
// implemented and tested (tests/review-vendor-api.test.ts,
// tests/review-admin-api.test.ts). Both respond with
//   { success, message, data: rows[], pagination, meta: { schemaReady, missing } }
//
// Writes are NOT live: POST /api/vendor/reviews/:id/reply and PATCH
// /api/admin/reviews/:id/status are implemented but answer 503
// REVIEW_SCHEMA_NOT_PROVISIONED until Migration A is applied and the Prisma
// client is regenerated. They are wired here so the screens have the exact
// contract, and their controls read `meta.schemaReady` from the feed — the UI
// never enables a button the server would refuse.

import { commonProductApi } from "./productapi/commonProductApi";
import type { ApiResponse } from "./productapi/types";
import type { PaginatedResponse, Review } from "./productReviewApi";

/** The feed is deployed. Writes are a separate, server-reported capability. */
export const REVIEW_MODERATION_API_READY = true;

export interface ReviewFeedMeta {
  schemaReady: boolean;
  missing: string[];
}

export interface ModerationPage<T> extends PaginatedResponse<T> {
  meta?: ReviewFeedMeta;
}

export interface ModerationListQuery {
  page?: number;
  limit?: number;
  rating?: number;
  status?: "PUBLISHED" | "HIDDEN" | "ALL";
  search?: string;
  productId?: string;
  sortBy?: "newest" | "oldest" | "highest_rating" | "lowest_rating";
}

export interface ReviewProductRef {
  id: string;
  name?: string | null;
  slug?: string | null;
  image?: string | null;
  vendor?: { id: string; storeName?: string | null } | null;
}

export interface VendorReviewRow extends Review {
  product?: ReviewProductRef | null;
  orderRef?: string | null;
}

export interface AdminReviewRow extends Review {
  product?: ReviewProductRef | null;
  vendor?: { id: string; name?: string | null } | null;
  hiddenAt?: string | null;
  hiddenReason?: string | null;
}

export interface EndpointSpec {
  method: string;
  path: string;
  body?: string;
  returns?: string;
  live: boolean;
}

/** The contract both dashboards speak, with what is actually deployed. */
export const ENDPOINTS_REQUIRED: readonly EndpointSpec[] = [
  {
    method: "GET",
    path: "/api/vendor/reviews?page=&limit=&status=&rating=&search=&sortBy=",
    returns: "rows[] + pagination + meta { schemaReady, missing } — scoped by session vendorId",
    live: true,
  },
  {
    method: "POST",
    path: "/api/vendor/reviews/:reviewId/reply",
    body: "{ reply: string }",
    returns: "503 until reviews.vendorReply* exists; then one reply per review (409 on a second)",
    live: false,
  },
  {
    method: "GET",
    path: "/api/admin/reviews?page=&limit=&status=&rating=&search=&vendorId=",
    returns: "rows[] + pagination + meta — ADMIN only, every vendor",
    live: true,
  },
  {
    method: "PATCH",
    path: "/api/admin/reviews/:reviewId/status",
    body: '{ status: "PUBLISHED" | "HIDDEN", reason?: string }',
    returns: "503 until reviews.status exists; then idempotent + aggregate recalculation",
    live: false,
  },
] as const;

export const reviewModerationApi = commonProductApi.injectEndpoints({
  endpoints: (builder) => ({
    getVendorReviews: builder.query<ModerationPage<VendorReviewRow>, ModerationListQuery>({
      query: (params) => ({ url: "/vendor/reviews", method: "GET", params }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map((r) => ({ type: "Review" as const, id: r.id })),
              { type: "VendorReviews" as const, id: "LIST" },
            ]
          : [{ type: "VendorReviews" as const, id: "LIST" }],
    }),

    replyToReview: builder.mutation<ApiResponse<Review>, { reviewId: string; reply: string }>({
      query: ({ reviewId, reply }) => ({
        url: `/vendor/reviews/${reviewId}/reply`,
        method: "POST",
        body: { reply },
      }),
      invalidatesTags: (result, error, { reviewId }) => [
        { type: "Review" as const, id: reviewId },
        { type: "VendorReviews" as const, id: "LIST" },
      ],
    }),

    getAdminReviews: builder.query<ModerationPage<AdminReviewRow>, ModerationListQuery>({
      query: (params) => ({ url: "/admin/reviews", method: "GET", params }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map((r) => ({ type: "Review" as const, id: r.id })),
              { type: "AdminReviews" as const, id: "LIST" },
            ]
          : [{ type: "AdminReviews" as const, id: "LIST" }],
    }),

    moderateReviewStatus: builder.mutation<
      ApiResponse<Review>,
      { reviewId: string; status: "PUBLISHED" | "HIDDEN"; reason?: string }
    >({
      query: ({ reviewId, ...body }) => ({
        url: `/admin/reviews/${reviewId}/status`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { reviewId }) => [
        { type: "Review" as const, id: reviewId },
        { type: "AdminReviews" as const, id: "LIST" },
        { type: "Products" as const, id: "PUBLIC_LIST" },
      ],
    }),
  }),
});

export const {
  useGetVendorReviewsQuery,
  useReplyToReviewMutation,
  useGetAdminReviewsQuery,
  useModerateReviewStatusMutation,
} = reviewModerationApi;
