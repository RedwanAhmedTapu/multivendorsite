// features/productReviewApi.ts
//
// Review endpoints for the product module. Physically a separate file for
// readability, but injected into the SAME `commonProductApi` instance (not
// a new createApi/reducerPath) — this is what lets a review mutation
// invalidate the product detail page's cached avgRating/reviewCount. If
// this were its own createApi (its own reducerPath), that cross-
// invalidation wouldn't happen: RTK Query only invalidates tags within the
// same api instance.
import { commonProductApi } from "./productapi/commonProductApi";
import type {
  ApiResponse,
 
} from "./productapi/types";
// =============================
// REQUEST TYPES
// =============================

export type ReviewSortBy = "newest" | "oldest" | "highest_rating" | "lowest_rating";

export interface CreateReviewRequest {
  productId: string;
  rating: number; // 1-5
  comment?: string;
}

export interface UpdateReviewRequest {
  rating?: number; // 1-5
  comment?: string;
}

export interface ListProductReviewsFilters {
  productId: string;
  page?: number;
  limit?: number;
  rating?: number; // filter by star (1-5)
  sortBy?: ReviewSortBy;
}

// =============================
// RESPONSE TYPES
// =============================

export interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  hasNext: boolean;
  hasPrevious: boolean;
  limit: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message?: string;
  data: T[];
  pagination: Pagination;
}

export interface ReviewUser {
  id: string;
  name: string;
}

export interface Review {
  id: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  updatedAt: string;
  userId: string;
  productId: string;
  user: ReviewUser;
}

export interface DeleteReviewResult {
  id: string;
}

// =============================
// INJECTED ENDPOINTS
// =============================

export const productReviewApi = commonProductApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * GET /api/products/:productId/reviews?page=1&limit=10&rating=5&sortBy=newest
     * Public, paginated reviews for a product's detail page.
     */
    getProductReviews: builder.query<PaginatedResponse<Review>, ListProductReviewsFilters>({
      query: ({ productId, ...params }) => ({
        url: `/products/${productId}/reviews`,
        method: "GET",
        params,
      }),
      providesTags: (result, error, { productId }) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: "Review" as const, id })),
              { type: "ProductReviews" as const, id: productId },
            ]
          : [{ type: "ProductReviews" as const, id: productId }],
    }),

    /**
     * GET /api/products/:productId/reviews/me
     * Auth required — "did I already review this product?" (null data if not yet).
     */
    getMyProductReview: builder.query<ApiResponse<Review | null>, string>({
      query: (productId) => ({ url: `/products/${productId}/reviews/me`, method: "GET" }),
      providesTags: (result, error, productId) => [{ type: "MyProductReview" as const, id: productId }],
    }),

    /**
     * POST /api/reviews
     * Auth required — one review per user per product (409 if it already exists).
     * Invalidates the product's own "Product" tag too, so the detail page's
     * avgRating/reviewCount refetch — this is the whole point of sharing
     * one api instance instead of a separate reviewApi.
     */
    createReview: builder.mutation<ApiResponse<Review>, CreateReviewRequest>({
      query: (body) => ({ url: "/reviews", method: "POST", body }),
      invalidatesTags: (result, error, { productId }) => [
        { type: "ProductReviews" as const, id: productId },
        { type: "MyProductReview" as const, id: productId },
        { type: "Products" as const, id: productId },
      ],
    }),

    /**
     * PATCH /api/reviews/:reviewId
     * Auth required — owner only.
     */
    updateReview: builder.mutation<ApiResponse<Review>, { reviewId: string; productId: string } & UpdateReviewRequest>({
      query: ({ reviewId, productId, ...body }) => ({ url: `/reviews/${reviewId}`, method: "PATCH", body }),
      invalidatesTags: (result, error, { reviewId, productId }) => [
        { type: "Review" as const, id: reviewId },
        { type: "ProductReviews" as const, id: productId },
        { type: "MyProductReview" as const, id: productId },
        { type: "Products" as const, id: productId },
      ],
    }),

    /**
     * DELETE /api/reviews/:reviewId
     * Auth required — owner only.
     */
    deleteReview: builder.mutation<ApiResponse<DeleteReviewResult>, { reviewId: string; productId: string }>({
      query: ({ reviewId }) => ({ url: `/reviews/${reviewId}`, method: "DELETE" }),
      invalidatesTags: (result, error, { reviewId, productId }) => [
        { type: "Review" as const, id: reviewId },
        { type: "ProductReviews" as const, id: productId },
        { type: "MyProductReview" as const, id: productId },
        { type: "Products" as const, id: productId },
      ],
    }),
  }),
});

export const {
  useGetProductReviewsQuery,
  useGetMyProductReviewQuery,
  useCreateReviewMutation,
  useUpdateReviewMutation,
  useDeleteReviewMutation,
} = productReviewApi;