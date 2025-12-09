import { createApi } from "@reduxjs/toolkit/query/react";
import type {
  Product,
  CreateProductData,
  UpdateProductData,
  ProductFilter,
  ProductStatistics,
} from "../types/product";
import baseQueryWithReauth from "./baseQueryWithReauth";

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  count?: number;
}

interface TemplateResponse {
  success: boolean;
  message: string;
  templateData: any;
}

interface SearchParams {
  q: string;
  vendorId?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
}

export const productApi = createApi({
  reducerPath: "productApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Products", "VendorProducts", "ProductStatistics"],

  endpoints: (builder) => ({
    // ======================
    // GET ALL PRODUCTS
    // ======================
    getProducts: builder.query<Product[], void>({
      query: () => "/products",
      transformResponse: (response: ApiResponse<Product[]>) => {
        return response.data;
      },
      providesTags: ["Products"],
    }),

    // ======================
    // GET PRODUCT BY ID
    // ======================
    getProductById: builder.query<Product, string>({
      query: (id) => `/products/${id}`,
      transformResponse: (response: ApiResponse<Product>) => {
        return response.data;
      },
      providesTags: (result, error, id) => [{ type: "Products", id }],
    }),

    // ======================
    // GET PRODUCTS BY VENDOR ID
    // ======================
    getProductsByVendorId: builder.query<
      Product[],
      { vendorId: string; status?: "PENDING" | "ACTIVE" | "REJECTED" }
    >({
      query: ({ vendorId, status }) => {
        const params = new URLSearchParams();
        if (status) params.append("status", status);
        const queryString = params.toString();
        return `/products/vendor/${vendorId}${queryString ? `?${queryString}` : ""}`;
      },
      transformResponse: (response: ApiResponse<Product[]>) => {
        return response.data;
      },
      providesTags: (result, error, { vendorId }) => [
        { type: "VendorProducts", id: vendorId },
        "Products",
      ],
    }),

    // ======================
    // GET VENDOR PRODUCT STATISTICS
    // ======================
    getVendorStatistics: builder.query<ProductStatistics, string>({
      query: (vendorId) => `/products/vendor/${vendorId}/statistics`,
      transformResponse: (response: ApiResponse<ProductStatistics>) => {
        return response.data;
      },
      providesTags: (result, error, vendorId) => [
        { type: "ProductStatistics", id: vendorId },
      ],
    }),

    // ======================
    // SEARCH PRODUCTS
    // ======================
    searchProducts: builder.query<Product[], SearchParams>({
      query: ({ q, vendorId, categoryId, minPrice, maxPrice, inStock }) => {
        const params = new URLSearchParams();
        params.append("q", q);
        if (vendorId) params.append("vendorId", vendorId);
        if (categoryId) params.append("categoryId", categoryId);
        if (minPrice !== undefined) params.append("minPrice", minPrice.toString());
        if (maxPrice !== undefined) params.append("maxPrice", maxPrice.toString());
        if (inStock !== undefined) params.append("inStock", inStock.toString());

        return `/products/search?${params.toString()}`;
      },
      transformResponse: (response: ApiResponse<Product[]>) => {
        return response.data;
      },
      providesTags: ["Products"],
    }),

    // ======================
    // CREATE PRODUCT
    // ======================
    createProduct: builder.mutation<Product, CreateProductData>({
      query: (body) => ({
        url: "/products",
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiResponse<Product>) => {
        return response.data;
      },
      invalidatesTags: (result) => [
        "Products",
        { type: "VendorProducts", id: result?.vendorId },
        { type: "ProductStatistics", id: result?.vendorId },
      ],
    }),

    // ======================
    // UPDATE PRODUCT
    // ======================
    updateProduct: builder.mutation<
      Product,
      { id: string; data: UpdateProductData }
    >({
      query: ({ id, data }) => ({
        url: `/products/${id}`,
        method: "PUT",
        body: data,
      }),
      transformResponse: (response: ApiResponse<Product>) => {
        return response.data;
      },
      invalidatesTags: (result, error, { id }) => [
        { type: "Products", id },
        "Products",
        { type: "VendorProducts", id: result?.vendorId },
        { type: "ProductStatistics", id: result?.vendorId },
      ],
    }),

    // ======================
    // UPDATE PRODUCT STATUS (Admin approval)
    // ======================
    updateProductStatus: builder.mutation<
      Product,
      { id: string; status: "PENDING" | "ACTIVE" | "REJECTED"; approvedById?: string }
    >({
      query: ({ id, status, approvedById }) => ({
        url: `/products/${id}/status`,
        method: "PATCH",
        body: { status, approvedById },
      }),
      transformResponse: (response: ApiResponse<Product>) => {
        return response.data;
      },
      invalidatesTags: (result, error, { id }) => [
        { type: "Products", id },
        "Products",
        { type: "VendorProducts", id: result?.vendorId },
        { type: "ProductStatistics", id: result?.vendorId },
      ],
    }),

    // ======================
    // DELETE PRODUCT
    // ======================
    deleteProduct: builder.mutation<ApiResponse<null>, string>({
      query: (id) => ({
        url: `/products/${id}`,
        method: "DELETE",
      }),
      transformResponse: (response: ApiResponse<null>) => response,
      invalidatesTags: (result, error, id) => [
        { type: "Products", id },
        "Products",
        "VendorProducts",
        "ProductStatistics",
      ],
    }),

    // ======================
    // FILTER PRODUCTS (Advanced filtering)
    // ======================
    filterProducts: builder.mutation<Product[], ProductFilter>({
      query: (filters) => ({
        url: "/products/filter",
        method: "POST",
        body: filters,
      }),
      transformResponse: (response: ApiResponse<Product[]>) => {
        return response.data;
      },
    }),

    // ======================
    // GET PRODUCT STATISTICS (Global or by vendor)
    // ======================
    getProductStatistics: builder.query<ProductStatistics, string | void>({
      query: (vendorId) =>
        vendorId ? `/products/statistics?vendorId=${vendorId}` : "/products/statistics",
      transformResponse: (response: ApiResponse<ProductStatistics>) => {
        return response.data;
      },
      providesTags: (result, error, vendorId) => [
        { type: "ProductStatistics", id: vendorId || "global" },
      ],
    }),

    // ======================
    // BULK TEMPLATE GENERATION
    // ======================
    generateTemplate: builder.mutation<TemplateResponse, string>({
      query: (categoryId) => ({
        url: `/bulkproduct-templates/generate/${categoryId}`,
        method: "GET",
      }),
    }),

    // ======================
    // DOWNLOAD BULK TEMPLATE
    // ======================
    downloadTemplate: builder.query<{ url: string }, string>({
      query: (categoryId) => `/bulkproduct-templates/download/${categoryId}`,
    }),
  }),
});

// ======================
// Export hooks
// ======================
export const {
  // Query hooks
  useGetProductsQuery,
  useGetProductByIdQuery,
  useGetProductsByVendorIdQuery,
  useGetVendorStatisticsQuery,
  useGetProductStatisticsQuery,
  useSearchProductsQuery,
  useDownloadTemplateQuery,

  // Mutation hooks
  useCreateProductMutation,
  useUpdateProductMutation,
  useUpdateProductStatusMutation,
  useDeleteProductMutation,
  useFilterProductsMutation,
  useGenerateTemplateMutation,
} = productApi;