// productapi/productApiBase.ts
import { createApi } from "@reduxjs/toolkit/query/react";
import baseQueryWithReauth from "../baseQueryWithReauth";

/**
 * Single base api instance, split into endpoint files via
 * `.injectEndpoints()`:
 *   - commonProductApi.ts  → public / logged-in-user endpoints
 *   - vendorProductApi.ts  → vendor dashboard endpoints
 *   - adminProductApi.ts   → admin dashboard endpoints
 *   - productReviewApi.ts  → review endpoints (maps to review.routes.ts /
 *                            review.controller.ts on the backend)
 *
 * This mirrors the backend's controller split while keeping ONE Redux
 * slice (`reducerPath: "productApi"`) and ONE shared RTK Query cache.
 *
 * Review tags live in this shared array (not a separate reviewApi
 * reducer) specifically so a review mutation can invalidate `Products`
 * too — creating/editing/deleting a review changes Product.avgRating /
 * reviewCount server-side (see ProductRatingService), and the product
 * detail page's cached `Products` entry needs to refetch when that
 * happens. That cross-invalidation only works within one api instance.
 */
export const productApiBase = createApi({
  reducerPath: "productApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    "Products", // single product / listing entries
    "VendorProducts", // vendor "my products" list
    "AdminProducts", // admin "all products" list
    "ProductStatistics", // vendor or admin stats
    "ProductContentScore", // vendor content-quality score
    "VendorTrash", // vendor soft-deleted products
    "RecentlyViewed",
    "Review", // a single review, by review id
    "ProductReviews", // the paginated review list for one product, keyed by productId
    "MyProductReview", // "did I review this product yet", keyed by productId
    "VendorReviews", // vendor review feed (moderation API, not yet deployed)
    "AdminReviews", // admin review feed (moderation API, not yet deployed)
  ],
  endpoints: () => ({}),
});