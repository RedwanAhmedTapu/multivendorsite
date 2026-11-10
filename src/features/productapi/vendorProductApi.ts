// productapi/vendorProductApi.ts
import { productApiBase } from "./productApiBase";
import type {
  ApiResponse,
  OffsetPage,
  VendorProductFilter,
  VendorStatistics,
  MonthlyTrendPoint,
  ProductContentScoreSummary,
  VendorTrashItem,
  SoftDeleteResult,
  ImageUploadResult,
  VideoUploadResult,
  Product,
  CreateProductData,
  UpdateProductData,
  ProductVariant,
  BulkImportSummary,
} from "./types";

/**
 * Maps to routes/product.routes.ts VENDOR section + VendorProductController.
 * Every endpoint here is scoped server-side to the authenticated vendor's
 * own products — offset-paginated (dashboards want total page counts).
 */
export const vendorProductApi = productApiBase.injectEndpoints({
  endpoints: (builder) => ({
    // ======================
    // GET /products/vendor/my-products
    // ======================
    getMyProducts: builder.query<OffsetPage<Product>, VendorProductFilter | void>({
      query: (params) => ({ url: "/products/vendor/my-products", params: params ?? undefined }),
      transformResponse: (response: ApiResponse<Product[]>) => ({
        items: response.data,
        pagination: response.pagination as any,
      }),
      providesTags: (result) =>
        result
          ? [
              { type: "VendorProducts" as const, id: "LIST" },
              ...result.items.map((p) => ({ type: "Products" as const, id: p.id })),
            ]
          : [{ type: "VendorProducts" as const, id: "LIST" }],
    }),

    // ======================
    // GET /products/vendor/:id
    // ======================
    getVendorProductById: builder.query<Product, string>({
      query: (id) => `/products/vendor/${id}`,
      transformResponse: (response: ApiResponse<Product>) => response.data,
      providesTags: (result, error, id) => [{ type: "Products", id }],
    }),

    // ======================
    // GET /products/vendor/statistics
    // ======================
    getVendorStatistics: builder.query<VendorStatistics, void>({
      query: () => "/products/vendor/statistics",
      transformResponse: (response: ApiResponse<VendorStatistics>) => response.data,
      providesTags: [{ type: "ProductStatistics", id: "VENDOR" }],
    }),

    // ======================
    // GET /products/vendor/statistics/monthly
    // ======================
    getVendorMonthlyTrends: builder.query<MonthlyTrendPoint[], void>({
      query: () => "/products/vendor/statistics/monthly",
      transformResponse: (response: ApiResponse<MonthlyTrendPoint[]>) => response.data,
      providesTags: [{ type: "ProductStatistics", id: "VENDOR_MONTHLY" }],
    }),

    // ======================
    // GET /products/vendor/product-contents-score
    // ======================
    getVendorProductsContentSummary: builder.query<ProductContentScoreSummary, void>({
      query: () => "/products/vendor/product-contents-score",
      transformResponse: (response: ApiResponse<ProductContentScoreSummary>) => response.data,
      providesTags: [{ type: "ProductContentScore", id: "VENDOR" }],
    }),

    // ======================
    // GET /products/vendor/trash — soft-deleted products still within
    // the 90-day grace period, with days-until-purge for the UI.
    // ======================
    getVendorTrash: builder.query<VendorTrashItem[], void>({
      query: () => "/products/vendor/trash",
      transformResponse: (response: ApiResponse<VendorTrashItem[]>) => response.data,
      providesTags: [{ type: "VendorTrash", id: "LIST" }],
    }),

    // ======================
    // POST /products/vendor — create (lands as PENDING)
    // ======================
    createProduct: builder.mutation<Product, CreateProductData>({
      query: (body) => ({ url: "/products/vendor", method: "POST", body }),
      transformResponse: (response: ApiResponse<Product>) => response.data,
      invalidatesTags: [
        { type: "VendorProducts", id: "LIST" },
        { type: "ProductStatistics", id: "VENDOR" },
        { type: "ProductContentScore", id: "VENDOR" },
      ],
    }),

    // ======================
    // GET /products/vendor/bulk-import/:categoryId/template — one-click
    // Excel template download for a category. Returns the raw file as a
    // Blob (NOT JSON — that's why this uses a custom responseHandler
    // instead of the usual transformResponse/ApiResponse envelope). The
    // caller is responsible for turning the Blob into an actual browser
    // download (see usage note below).
    // ======================
    getBulkImportTemplate: builder.query<Blob, { categoryId: string }>({
      query: ({ categoryId }) => ({
        url: `/products/vendor/bulk-import/${categoryId}/template`,
        responseHandler: (response) => response.blob(),
        cache: "no-cache",
      }),
      keepUnusedDataFor: 0,
    }),

    // ======================
    // POST /products/vendor/bulk-import/:categoryId — multipart Excel
    // upload (field name "file"), the filled copy of the category's
    // downloaded template. Creates multiple products in one request —
    // see BulkImportController.upload / BulkProductService.importFromExcel
    // on the server. Response is a per-group success/failure summary,
    // not a single Product, so this can partially succeed.
    // ======================
    bulkUploadProducts: builder.mutation<BulkImportSummary, { categoryId: string; file: File }>({
      query: ({ categoryId, file }) => {
        const formData = new FormData();
        formData.append("file", file);
        return {
          url: `/products/vendor/bulk-import/${categoryId}`,
          method: "POST",
          body: formData,
        };
      },
      transformResponse: (response: ApiResponse<BulkImportSummary>) => response.data,
      invalidatesTags: [
        { type: "VendorProducts", id: "LIST" },
        { type: "ProductStatistics", id: "VENDOR" },
        { type: "ProductContentScore", id: "VENDOR" },
      ],
    }),

    // ======================
    // PUT /products/vendor/:id — update (resets to PENDING for re-approval)
    // ======================
    updateProduct: builder.mutation<Product, { id: string; data: UpdateProductData }>({
      query: ({ id, data }) => ({ url: `/products/vendor/${id}`, method: "PUT", body: data }),
      transformResponse: (response: ApiResponse<Product>) => response.data,
      invalidatesTags: (result, error, { id }) => [
        { type: "Products", id },
        { type: "VendorProducts", id: "LIST" },
        { type: "ProductStatistics", id: "VENDOR" },
        { type: "ProductContentScore", id: "VENDOR" },
      ],
    }),

    // ======================
    // DELETE /products/vendor/:id — SOFT delete only.
    // Product disappears from listings immediately; the row survives for
    // 90 days (see scheduledPurgeAt in the response) and can be restored.
    // ======================
    deleteProduct: builder.mutation<SoftDeleteResult, string>({
      query: (id) => ({ url: `/products/vendor/${id}`, method: "DELETE" }),
      transformResponse: (response: ApiResponse<SoftDeleteResult>) => response.data,
      invalidatesTags: (result, error, id) => [
        { type: "Products", id },
        { type: "VendorProducts", id: "LIST" },
        { type: "ProductStatistics", id: "VENDOR" },
        { type: "VendorTrash", id: "LIST" },
      ],
    }),

    // ======================
    // PATCH /products/vendor/:id/restore — undo a soft delete before purge
    // ======================
    restoreProduct: builder.mutation<Product, string>({
      query: (id) => ({ url: `/products/vendor/${id}/restore`, method: "PATCH" }),
      transformResponse: (response: ApiResponse<Product>) => response.data,
      invalidatesTags: (result, error, id) => [
        { type: "Products", id },
        { type: "VendorProducts", id: "LIST" },
        { type: "VendorTrash", id: "LIST" },
        { type: "ProductStatistics", id: "VENDOR" },
      ],
    }),

    // ======================
    // PATCH /products/vendor/:id/variants/:variantId/stock
    // ======================
    updateProductStock: builder.mutation<
      ProductVariant,
      { productId: string; variantId: string; stock: number }
    >({
      query: ({ productId, variantId, stock }) => ({
        url: `/products/vendor/${productId}/variants/${variantId}/stock`,
        method: "PATCH",
        body: { stock },
      }),
      transformResponse: (response: ApiResponse<ProductVariant>) => response.data,
      invalidatesTags: (result, error, { productId }) => [
        { type: "Products", id: productId },
        { type: "VendorProducts", id: "LIST" },
      ],
    }),

    // ======================
    // PATCH /products/vendor/:id/variants/:variantId/price
    // ======================
    updateProductPrice: builder.mutation<
      ProductVariant,
      { productId: string; variantId: string; price: number; autoCalculateDiscount?: boolean }
    >({
      query: ({ productId, variantId, price, autoCalculateDiscount }) => ({
        url: `/products/vendor/${productId}/variants/${variantId}/price`,
        method: "PATCH",
        body: { price, autoCalculateDiscount },
      }),
      transformResponse: (response: ApiResponse<ProductVariant>) => response.data,
      invalidatesTags: (result, error, { productId }) => [
        { type: "Products", id: productId },
        { type: "VendorProducts", id: "LIST" },
      ],
    }),

    // ======================
    // PATCH /products/vendor/:id/variants/:variantId/special-price
    // ======================
    updateProductSpecialPrice: builder.mutation<
      ProductVariant,
      { productId: string; variantId: string; specialPrice: number | null; autoCalculateDiscount?: boolean }
    >({
      query: ({ productId, variantId, specialPrice, autoCalculateDiscount }) => ({
        url: `/products/vendor/${productId}/variants/${variantId}/special-price`,
        method: "PATCH",
        body: { specialPrice, autoCalculateDiscount },
      }),
      transformResponse: (response: ApiResponse<ProductVariant>) => response.data,
      invalidatesTags: (result, error, { productId }) => [
        { type: "Products", id: productId },
        { type: "VendorProducts", id: "LIST" },
      ],
    }),
// ======================
// PATCH /products/vendor/:id/variants/:variantId/reset-price-override
// Re-enables auto-pricing from future purchase receipts. Doesn't change
// the current price/specialPrice value itself — it only unlocks it for
// the NEXT purchase receive to update automatically.
// ======================
resetPriceOverride: builder.mutation<
  ProductVariant,
  { productId: string; variantId: string }
>({
  query: ({ productId, variantId }) => ({
    url: `/products/vendor/${productId}/variants/${variantId}/reset-price-override`,
    method: "PATCH",
  }),
  transformResponse: (response: ApiResponse<ProductVariant>) => response.data,
  invalidatesTags: (result, error, { productId }) => [
    { type: "Products", id: productId },
    { type: "VendorProducts", id: "LIST" },
  ],
}),
    // ======================
    // POST /products/upload — multipart image upload (field name "images")
    // ======================
    uploadProductImages: builder.mutation<ImageUploadResult, FormData>({
      query: (formData) => ({ url: "/products/upload", method: "POST", body: formData }),
      transformResponse: (response: ApiResponse<ImageUploadResult>) => response.data,
    }),

    // ======================
    // POST /products/upload-video — multipart video upload (field name "video")
    // ======================
    uploadProductVideo: builder.mutation<VideoUploadResult, FormData>({
      query: (formData) => ({ url: "/products/upload-video", method: "POST", body: formData }),
      transformResponse: (response: ApiResponse<VideoUploadResult>) => response.data,
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetMyProductsQuery,
  useGetVendorProductByIdQuery,
  useGetVendorStatisticsQuery,
  useGetVendorMonthlyTrendsQuery,
  useGetVendorProductsContentSummaryQuery,
  useGetVendorTrashQuery,
  useCreateProductMutation,
  useGetBulkImportTemplateQuery,
  useLazyGetBulkImportTemplateQuery,
  useBulkUploadProductsMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useRestoreProductMutation,
  useUpdateProductStockMutation,
  useUpdateProductPriceMutation,
  useUpdateProductSpecialPriceMutation,
  useResetPriceOverrideMutation,
  useUploadProductImagesMutation,
  useUploadProductVideoMutation,
} = vendorProductApi;