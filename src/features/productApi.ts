import { createApi } from "@reduxjs/toolkit/query/react";
import type {
  Product,
  CreateProductData,
  UpdateProductData,
  ProductFilter,
  ProductStatistics,
  ProductVariant,
} from "../types/product";
import baseQueryWithReauth from "./baseQueryWithReauth";

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: PaginationMeta;
  filters?: any;
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
interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}
export const productApi = createApi({
  reducerPath: "productApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Products", "VendorProducts", "ProductStatistics"],

  endpoints: (builder) => ({
    // ======================
    // GET ALL PRODUCTS
    // ======================
   getProducts: builder.query<{
  data: Product[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}, { page?: number; limit?: number }>({
  query: ({ page = 1, limit = 12 } = {}) => ({
    url: "/products",
    params: { page, limit }
  }),
  transformResponse: (response: ApiResponse<Product[]>) => {
    return {
      data: response.data,
      pagination: response.pagination ? {
        currentPage: response.pagination.page,
        totalPages: response.pagination.totalPages,
        totalCount: response.pagination.total,
        hasNextPage: response.pagination.hasNext,
        hasPreviousPage: response.pagination.hasPrev,
      } : undefined
    };
  },
  providesTags: ["Products"],
  // Keep previous data for infinite scroll
  serializeQueryArgs: ({ endpointName }) => {
    return endpointName;
  },
  // Always merge incoming data to the cache entry
  merge: (currentCache, newItems, { arg }) => {
    // If page is 1, replace everything
    if (arg?.page === 1) {
      return newItems;
    }
    
    // Otherwise, append new items
    if (currentCache && newItems) {
      return {
        data: [...currentCache.data, ...newItems.data],
        pagination: newItems.pagination
      };
    }
    
    return newItems;
  },
  // Refetch when the page changes
  forceRefetch({ currentArg, previousArg }) {
    return currentArg?.page !== previousArg?.page;
  }
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
    // GET VENDOR'S OWN PRODUCTS
    // ======================
    getMyProducts: builder.query<
      {
        products: Product[];
        pagination: PaginationMeta;
        filters: any;
      },
      {
        status?: "PENDING" | "ACTIVE" | "REJECTED" | "DRAFT";
        search?: string;
        category?: string;
        minPrice?: number;
        maxPrice?: number;
        sortBy?: string;
        sortOrder?: "asc" | "desc";
        page?: number;
        limit?: number;
      }
    >({
      query: (params = {}) => {
        const queryParams = new URLSearchParams();

        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            queryParams.append(key, value.toString());
          }
        });

        const queryString = queryParams.toString();
        return {
          url: `/products/vendor/my-products${
            queryString ? `?${queryString}` : ""
          }`,
          method: "GET",
        };
      },
      transformResponse: (response: {
        success: boolean;
        data: Product[];
        pagination: PaginationMeta;
        filters: any;
        message?: string;
      }) => {
        return {
          products: response.data,
          pagination: response.pagination,
          filters: response.filters,
        };
      },
      // FIXED: Use only declared tag types
      providesTags: (result) => {
        // Return empty array if no result
        if (!result?.products) {
          return [{ type: "Products" as const }];
        }

        const tags = [
          { type: "VendorProducts" as const, id: "LIST" },
          ...result.products.map((product) => ({
            type: "Products" as const,
            id: product.id,
          })),
        ];

        return tags;
      },
    }),
    // UPDATE PRODUCT STOCK
    updateProductStock: builder.mutation<
      ApiResponse<ProductVariant>,
      { productId: string; variantId: string; stock: number }
    >({
      query: ({ productId, variantId, stock }) => ({
        url: `/products/vendor/${productId}/variants/${variantId}/stock`,
        method: "PATCH",
        body: { stock },
      }),
      invalidatesTags: (result, error, { productId }) => [
        { type: "Products", id: productId },
        "VendorProducts",
      ],
    }),

    // UPDATE PRODUCT PRICE
    updateProductPrice: builder.mutation<
      ApiResponse<ProductVariant>,
      {
        productId: string;
        variantId: string;
        price: number;
        autoCalculateDiscount?: boolean;
      }
    >({
      query: ({ productId, variantId, price, autoCalculateDiscount }) => ({
        url: `/products/vendor/${productId}/variants/${variantId}/price`,
        method: "PATCH",
        body: { price, autoCalculateDiscount },
      }),
      invalidatesTags: (result, error, { productId }) => [
        { type: "Products", id: productId },
        "VendorProducts",
      ],
    }),

    // UPDATE PRODUCT SPECIAL PRICE
    updateProductSpecialPrice: builder.mutation<
      ApiResponse<ProductVariant>,
      {
        productId: string;
        variantId: string;
        specialPrice: number | null;
        autoCalculateDiscount?: boolean;
      }
    >({
      query: ({
        productId,
        variantId,
        specialPrice,
        autoCalculateDiscount,
      }) => ({
        url: `/products/vendor/${productId}/variants/${variantId}/special-price`,
        method: "PATCH",
        body: { specialPrice, autoCalculateDiscount },
      }),
      invalidatesTags: (result, error, { productId }) => [
        { type: "Products", id: productId },
        "VendorProducts",
      ],
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
        return `/products/vendor/${vendorId}${
          queryString ? `?${queryString}` : ""
        }`;
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
    // GET VENDOR PRODUCTS CONTENT SUMMARY
    // ======================
    getVendorProductsContentSummary: builder.query<
      {
        totalProducts: number;
        needsImprovement: number;
        improvementRate: number;
        products: Array<{
          productId: string;
          productName: string;
          status: "PENDING" | "ACTIVE" | "REJECTED" | "DRAFT";
          imageCount: number;
          hasDescriptionImages: boolean;
          isDescriptionTooShort: boolean;
          issues: string[];
          needsImprovement: boolean;
        }>;
      },
      void
    >({
      query: () => ({
        url: "/products/vendor/product-contents-score",
        method: "GET",
      }),
      transformResponse: (
        response: ApiResponse<{
          totalProducts: number;
          needsImprovement: number;
          improvementRate: number;
          products: Array<{
            productId: string;
            productName: string;
            status: "PENDING" | "ACTIVE" | "REJECTED" | "DRAFT";
            imageCount: number;
            hasDescriptionImages: boolean;
            isDescriptionTooShort: boolean;
            issues: string[];
            needsImprovement: boolean;
          }>;
        }>
      ) => {
        return response.data;
      },
      providesTags: ["VendorProducts"],
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
        if (minPrice !== undefined)
          params.append("minPrice", minPrice.toString());
        if (maxPrice !== undefined)
          params.append("maxPrice", maxPrice.toString());
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
      {
        id: string;
        status: "PENDING" | "ACTIVE" | "REJECTED";
        approvedById?: string;
      }
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
        vendorId
          ? `/products/statistics?vendorId=${vendorId}`
          : "/products/statistics",
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
  useGetMyProductsQuery,
  useGetVendorProductsContentSummaryQuery,  
  useGetProductStatisticsQuery,
  useSearchProductsQuery,
  useDownloadTemplateQuery,

  // Mutation hooks
  useCreateProductMutation,
  useUpdateProductMutation,
  useUpdateProductStatusMutation,
  useDeleteProductMutation,
  useUpdateProductStockMutation,
  useUpdateProductPriceMutation,
  useUpdateProductSpecialPriceMutation,
  useFilterProductsMutation,
  useGenerateTemplateMutation,
} = productApi;
