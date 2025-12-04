import { createApi } from "@reduxjs/toolkit/query/react";
import type {
  Product,
  CreateProductData,
  ProductFilter,
  ApiResponse,
} from "../types/product";
import baseQueryWithReauth from "./baseQueryWithReauth";

interface TemplateResponse {
  success: boolean;
  message: string;
  templateData: any;
}

interface ProductStatistics {
  total: number;
  pending: number;
  active: number;
  rejected: number;
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
    // ------- GET ALL -------
    getProducts: builder.query<Product[], void>({
      query: () => "/products",
      transformResponse: (response: { success: boolean; data: Product[] }) => {
        return response.data;
      },
      providesTags: ["Products"],
    }),

    // ------- GET BY ID -------
    getProductById: builder.query<Product, string>({
      query: (id) => `/products/${id}`,
      transformResponse: (response: { success: boolean; data: Product }) => {
        return response.data;
        
      },
      providesTags: (result, error, id) => [{ type: "Products", id }],
    }),

    // ------- GET BY VENDOR ID -------
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
      transformResponse: (response: { success: boolean; data: Product[]; count: number }) => {
        return response.data;
      },
      providesTags: (result, error, { vendorId }) => [
        { type: "VendorProducts", id: vendorId },
        "Products",
      ],
    }),

    // ------- GET VENDOR STATISTICS -------
    getVendorStatistics: builder.query<ProductStatistics, string>({
      query: (vendorId) => `/products/vendor/${vendorId}/statistics`,
      transformResponse: (response: { success: boolean; data: ProductStatistics }) => {
        return response.data;
      },
      providesTags: (result, error, vendorId) => [
        { type: "ProductStatistics", id: vendorId },
      ],
    }),

    // ------- SEARCH PRODUCTS -------
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
      transformResponse: (response: { success: boolean; data: Product[]; count: number }) => {
        return response.data;
      },
      providesTags: ["Products"],
    }),

    // ------- CREATE -------
    createProduct: builder.mutation<Product, CreateProductData>({
      query: (body) => ({
        url: "/products",
        method: "POST",
        body,
      }),
      transformResponse: (response: { success: boolean; data: Product; message: string }) => {
        return response.data;
      },
      invalidatesTags: (result) => [
        "Products",
        { type: "VendorProducts", id: result?.vendorId },
        { type: "ProductStatistics", id: result?.vendorId },
      ],
    }),

    // ------- UPDATE -------
    updateProduct: builder.mutation<
      Product,
      { id: string; data: Partial<CreateProductData> }
    >({
      query: ({ id, data }) => ({
        url: `/products/${id}`,
        method: "PUT",
        body: data,
      }),
      transformResponse: (response: { success: boolean; data: Product; message: string }) => {
        return response.data;
      },
      invalidatesTags: (result, error, { id }) => [
        { type: "Products", id },
        "Products",
        { type: "VendorProducts", id: result?.vendorId },
        { type: "ProductStatistics", id: result?.vendorId },
      ],
    }),

    // ------- UPDATE STATUS -------
    updateProductStatus: builder.mutation<
      Product,
      { id: string; status: "PENDING" | "ACTIVE" | "REJECTED" }
    >({
      query: ({ id, status }) => ({
        url: `/products/${id}/status`,
        method: "PATCH",
        body: { status },
      }),
      transformResponse: (response: { success: boolean; data: Product; message: string }) => {
        return response.data;
      },
      invalidatesTags: (result, error, { id }) => [
        { type: "Products", id },
        "Products",
        { type: "VendorProducts", id: result?.vendorId },
        { type: "ProductStatistics", id: result?.vendorId },
      ],
    }),

    // ------- DELETE -------
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

    // ------- FILTER -------
    filterProducts: builder.mutation<Product[], ProductFilter>({
      query: (filters) => ({
        url: "/products/filter",
        method: "POST",
        body: filters,
      }),
      transformResponse: (response: { success: boolean; data: Product[]; count: number }) => {
        return response.data;
      },
    }),

    // ------- GENERATE TEMPLATE -------
    generateTemplate: builder.mutation<TemplateResponse, string>({
      query: (categoryId) => ({
        url: `/bulkproduct-templates/generate/${categoryId}`,
        method: "GET",
      }),
    }),

    // ------- DOWNLOAD TEMPLATE -------
    downloadTemplate: builder.query<{ url: string }, string>({
      query: (categoryId) => `/bulkproduct-templates/download/${categoryId}`,
    }),
  }),
});

// ------- Export hooks -------
export const {
  useGetProductsQuery,
  useGetProductByIdQuery,
  useGetProductsByVendorIdQuery,
  useGetVendorStatisticsQuery,
  useSearchProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useUpdateProductStatusMutation,
  useDeleteProductMutation,
  useFilterProductsMutation,
  useGenerateTemplateMutation,
  useDownloadTemplateQuery,
} = productApi;