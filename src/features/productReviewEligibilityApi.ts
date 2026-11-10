// features/productReviewEligibilityApi.ts
//
// GET /products/:productId/reviews/eligibility — added by the Increment-1
// backend work (review-eligibility.service.ts) and the only place the UI can
// learn *why* someone may not review a product: NOT_PURCHASED / NOT_DELIVERED /
// RETURNED.
//
// Injected into the same `commonProductApi` instance as productReviewApi so the
// product cache and this flag invalidate together. No tags: eligibility is a
// point-in-time answer, so callers pass `refetchOnMountOrArgChange` instead of
// relying on invalidation.

import { commonProductApi } from "./productapi/commonProductApi";
import type { ApiResponse } from "./productapi/types";
import type { ReviewEligibility } from "@/components/reviews/review-types";

export const productReviewEligibilityApi = commonProductApi.injectEndpoints({
  endpoints: (builder) => ({
    getReviewEligibility: builder.query<ApiResponse<ReviewEligibility>, string>({
      query: (productId) => ({
        url: `/products/${productId}/reviews/eligibility`,
        method: "GET",
      }),
      keepUnusedDataFor: 0,
    }),
  }),
});

export const { useGetReviewEligibilityQuery } = productReviewEligibilityApi;
