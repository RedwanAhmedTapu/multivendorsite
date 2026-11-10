// features/productReviewImageApi.ts
//
// Review photo endpoints, injected into the same `commonProductApi` instance so a
// successful upload invalidates the review list (the card renders the photos).
//
// Multipart: the browser sets the boundary, so the body is a FormData and no
// JSON Content-Type header may be added.

import { commonProductApi } from "./productapi/commonProductApi";
import type { ApiResponse } from "./productapi/types";

export interface ReviewImageResult {
  id: string;
  url: string;
  position: number;
}

export const productReviewImageApi = commonProductApi.injectEndpoints({
  endpoints: (builder) => ({
    uploadReviewImage: builder.mutation<ApiResponse<ReviewImageResult>, { reviewId: string; file: File }>({
      query: ({ reviewId, file }) => {
        const body = new FormData();
        body.append("file", file);
        return { url: `/reviews/${reviewId}/images`, method: "POST", body };
      },
      invalidatesTags: ["ProductReviews", "AdminReviews", "VendorReviews"],
    }),

    deleteReviewImage: builder.mutation<ApiResponse<{ id: string }>, { reviewId: string; imageId: string }>({
      query: ({ reviewId, imageId }) => ({
        url: `/reviews/${reviewId}/images/${imageId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["ProductReviews", "AdminReviews", "VendorReviews"],
    }),
  }),
});

export const { useUploadReviewImageMutation, useDeleteReviewImageMutation } = productReviewImageApi;
