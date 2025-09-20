import { createApi } from "@reduxjs/toolkit/query/react";
import type {
  Product,
  CreateProductData,
  ProductFilter,
  ApiResponse,
} from "../types/product";
import baseQueryWithReauth from "./baseQueryWithReauth";

export const productApi = createApi({
  reducerPath: "productApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Products"],

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

    // ------- CREATE -------
    createProduct: builder.mutation<Product, CreateProductData>({
      query: (body) => ({
        url: "/products",
        method: "POST",
        body,
      }),
      transformResponse: (response: { success: boolean; data: Product }) => {
        return response.data;
      },
      invalidatesTags: ["Products"],
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
      transformResponse: (response: { success: boolean; data: Product }) => {
        return response.data;
      },
      invalidatesTags: (result, error, { id }) => [
        { type: "Products", id },
        "Products",
      ],
    }),

    // ------- UPDATE STATUS (NEW) -------
    updateProductStatus: builder.mutation<
      Product,
      { id: string; status: "ACTIVE" | "REJECTED" }
    >({
      query: ({ id, status }) => ({
        url: `/products/${id}`,
        method: "PATCH",
        body: { status },
      }),
      transformResponse: (response: { success: boolean; data: Product }) => {
        return response.data;
      },
      invalidatesTags: (result, error, { id }) => [
        { type: "Products", id },
        "Products",
      ],
    }),

    // ------- DELETE -------
    deleteProduct: builder.mutation<ApiResponse<null>, string>({
      query: (id) => ({
        url: `/products/${id}`,
        method: "DELETE",
      }),
      transformResponse: (response: ApiResponse<null>) => response,
      invalidatesTags: ["Products"],
    }),

    // ------- FILTER -------
    filterProducts: builder.mutation<Product[], ProductFilter>({
      query: (filters) => ({
        url: "/products/filter",
        method: "POST",
        body: filters,
      }),
      transformResponse: (response: { success: boolean; data: Product[] }) => {
        return response.data;
      },
    }),
  }),
});

// ------- Export hooks -------
export const {
  useGetProductsQuery,
  useGetProductByIdQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useUpdateProductStatusMutation, // ✅ new hook
  useDeleteProductMutation,
  useFilterProductsMutation,
} = productApi;
