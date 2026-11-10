// productapi/adminProductApi.ts
import { productApiBase } from "./productApiBase";
import type {
  ApiResponse,
  OffsetPage,
  AdminProductFilter,
  AdminStatistics,
  VendorStatistics,
  Product,
  UpdateProductData,
} from "./types";

/**
 * Maps to routes/product.routes.ts ADMIN section + AdminProductController.
 * Sees every approval status; offset-paginated. Approving a product is the
 * single trigger point that auto-generates & publishes its SEO on the
 * backend (services/product/product-approval.service.ts) — nothing extra
 * to do here besides calling the endpoint.
 */
export const adminProductApi = productApiBase.injectEndpoints({
  endpoints: (builder) => ({
    // ======================
    // GET /products/admin/all
    // ======================
    getAllProducts: builder.query<OffsetPage<Product>, AdminProductFilter | void>({
      query: (params) => ({ url: "/products/admin/all", params: params ?? undefined }),
      transformResponse: (response: ApiResponse<Product[]>) => ({
        items: response.data,
        pagination: response.pagination as any,
      }),
      providesTags: (result) =>
        result
          ? [
              { type: "AdminProducts" as const, id: "LIST" },
              ...result.items.map((p) => ({ type: "Products" as const, id: p.id })),
            ]
          : [{ type: "AdminProducts" as const, id: "LIST" }],
    }),

    // ======================
    // POST /products/admin/filter
    // ======================
    filterProductsAdmin: builder.query<OffsetPage<Product>, AdminProductFilter>({
      query: (filters) => ({ url: "/products/admin/filter", method: "POST", body: filters }),
      transformResponse: (response: ApiResponse<Product[]>) => ({
        items: response.data,
        pagination: response.pagination as any,
      }),
      providesTags: [{ type: "AdminProducts", id: "FILTERED_LIST" }],
    }),

    // ======================
    // GET /products/admin/pending
    // ======================
    getPendingApproval: builder.query<OffsetPage<Product>, { page?: number; limit?: number } | void>({
      query: (params) => ({ url: "/products/admin/pending", params: params ?? undefined }),
      transformResponse: (response: ApiResponse<Product[]>) => ({
        items: response.data,
        pagination: response.pagination as any,
      }),
      providesTags: [{ type: "AdminProducts", id: "PENDING" }],
    }),

    // ======================
    // GET /products/admin/vendor/:vendorId
    // ======================
    getProductsByVendorId: builder.query<OffsetPage<Product>, { vendorId: string } & Omit<AdminProductFilter, "vendorId">>({
      query: ({ vendorId, ...filters }) => ({ url: `/products/admin/vendor/${vendorId}`, params: filters }),
      transformResponse: (response: ApiResponse<Product[]>) => ({
        items: response.data,
        pagination: response.pagination as any,
      }),
      providesTags: (result, error, { vendorId }) => [{ type: "AdminProducts", id: `VENDOR_${vendorId}` }],
    }),

    // ======================
    // GET /products/admin/:id
    // ======================
    getProductById: builder.query<Product, string>({
      query: (id) => `/products/admin/${id}`,
      transformResponse: (response: ApiResponse<Product>) => response.data,
      providesTags: (result, error, id) => [{ type: "Products", id }],
    }),

    // ======================
    // GET /products/admin/statistics?vendorId=
    // ======================
    getAdminStatistics: builder.query<AdminStatistics | VendorStatistics, { vendorId?: string } | void>({
      query: (params) => ({ url: "/products/admin/statistics", params: params ?? undefined }),
      transformResponse: (response: ApiResponse<AdminStatistics | VendorStatistics>) => response.data,
      providesTags: (result, error, arg) => [{ type: "ProductStatistics", id: arg?.vendorId ?? "GLOBAL" }],
    }),

    // ======================
    // PATCH /products/admin/:id/approve
    // Triggers auto SEO generation on the backend (see README of the
    // product module). No extra client-side work needed.
    // ======================
    approveProduct: builder.mutation<Product, string>({
      query: (id) => ({ url: `/products/admin/${id}/approve`, method: "PATCH" }),
      transformResponse: (response: ApiResponse<Product>) => response.data,
      invalidatesTags: (result, error, id) => [
        { type: "Products", id },
        { type: "AdminProducts", id: "LIST" },
        { type: "AdminProducts", id: "PENDING" },
        { type: "ProductStatistics", id: "GLOBAL" },
      ],
    }),

    // ======================
    // PATCH /products/admin/:id/reject
    // ======================
    rejectProduct: builder.mutation<Product, { id: string; reason: string }>({
      query: ({ id, reason }) => ({ url: `/products/admin/${id}/reject`, method: "PATCH", body: { reason } }),
      transformResponse: (response: ApiResponse<Product>) => response.data,
      invalidatesTags: (result, error, { id }) => [
        { type: "Products", id },
        { type: "AdminProducts", id: "LIST" },
        { type: "AdminProducts", id: "PENDING" },
      ],
    }),

    // ======================
    // POST /products/admin/bulk-approve
    // ======================
    bulkApproveProducts: builder.mutation<{ count: number }, { productIds: string[] }>({
      query: (body) => ({ url: "/products/admin/bulk-approve", method: "POST", body }),
      transformResponse: (response: ApiResponse<{ count: number }>) => response.data,
      invalidatesTags: [
        { type: "AdminProducts", id: "LIST" },
        { type: "AdminProducts", id: "PENDING" },
        { type: "ProductStatistics", id: "GLOBAL" },
      ],
    }),

    // ======================
    // POST /products/admin/bulk-reject
    // ======================
    bulkRejectProducts: builder.mutation<{ count: number }, { productIds: string[]; reason?: string }>({
      query: (body) => ({ url: "/products/admin/bulk-reject", method: "POST", body }),
      transformResponse: (response: ApiResponse<{ count: number }>) => response.data,
      invalidatesTags: [
        { type: "AdminProducts", id: "LIST" },
        { type: "AdminProducts", id: "PENDING" },
      ],
    }),

    // ======================
    // PUT /products/admin/:id — admin override edit
    // ======================
    updateProductAdmin: builder.mutation<Product, { id: string; data: UpdateProductData }>({
      query: ({ id, data }) => ({ url: `/products/admin/${id}`, method: "PUT", body: data }),
      transformResponse: (response: ApiResponse<Product>) => response.data,
      invalidatesTags: (result, error, { id }) => [
        { type: "Products", id },
        { type: "AdminProducts", id: "LIST" },
      ],
    }),

    // ======================
    // PATCH /products/admin/:id/status
    // status: "ACTIVE" routes through the same approve flow (SEO
    // auto-generation included) on the backend.
    // ======================
    updateProductStatus: builder.mutation<
      Product,
      { id: string; status: "PENDING" | "ACTIVE" | "REJECTED" | "DRAFT" | "INACTIVE" }
    >({
      query: ({ id, status }) => ({ url: `/products/admin/${id}/status`, method: "PATCH", body: { status } }),
      transformResponse: (response: ApiResponse<Product>) => response.data,
      invalidatesTags: (result, error, { id }) => [
        { type: "Products", id },
        { type: "AdminProducts", id: "LIST" },
        { type: "AdminProducts", id: "PENDING" },
        { type: "ProductStatistics", id: "GLOBAL" },
      ],
    }),

    // ======================
    // PATCH /products/admin/:id/restore — admin can restore any vendor's
    // soft-deleted product before it's purged.
    // ======================
    restoreProductAdmin: builder.mutation<Product, string>({
      query: (id) => ({ url: `/products/admin/${id}/restore`, method: "PATCH" }),
      transformResponse: (response: ApiResponse<Product>) => response.data,
      invalidatesTags: (result, error, id) => [
        { type: "Products", id },
        { type: "AdminProducts", id: "LIST" },
      ],
    }),

    // ======================
    // DELETE /products/admin/:id — PERMANENT force delete. Bypasses the
    // vendor's 90-day soft-delete grace period entirely.
    // ======================
    forceDeleteProduct: builder.mutation<{ id: string; deleted: boolean }, string>({
      query: (id) => ({ url: `/products/admin/${id}`, method: "DELETE" }),
      transformResponse: (response: ApiResponse<{ id: string; deleted: boolean }>) => response.data,
      invalidatesTags: (result, error, id) => [
        { type: "Products", id },
        { type: "AdminProducts", id: "LIST" },
        { type: "ProductStatistics", id: "GLOBAL" },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetAllProductsQuery,
  useFilterProductsAdminQuery,
  useGetPendingApprovalQuery,
  useGetProductsByVendorIdQuery,
  useGetProductByIdQuery,
  useGetAdminStatisticsQuery,
  useApproveProductMutation,
  useRejectProductMutation,
  useBulkApproveProductsMutation,
  useBulkRejectProductsMutation,
  useUpdateProductAdminMutation,
  useUpdateProductStatusMutation,
  useRestoreProductAdminMutation,
  useForceDeleteProductMutation,
} = adminProductApi;
