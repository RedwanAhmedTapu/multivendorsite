// features/apiSlice.ts
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  Category,
  Attribute,
  AttributeValue,
  Specification,
  CategoryAttribute,
  CategorySpecification,
  SpecificationOption,
  Product,
} from "../types/type";

// Types for auth
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role?: "CUSTOMER" | "VENDOR" | "EMPLOYEE" | "ADMIN"; // optional, defaults to CUSTOMER
}

export interface AuthResponse {
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
}

// Base Query Setup
const baseQuery = fetchBaseQuery({
  baseUrl: "http://localhost:5000/api",
  
});


// API Slice Definition
export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery,
  tagTypes: [
    "Category",
    "Attribute",
    "Specification",
    "SpecificationOption",
    "Product",
    "Auth",
  ],
  endpoints: (builder) => ({
   
    // ---------- Category Endpoints ----------
    getCategories: builder.query<Category[], void>({
      query: () => "/categories",
      providesTags: ["Category"],
    }),
    getCategoryById: builder.query<Category, string>({
      query: (id) => `/categories/${id}`,
      providesTags: ["Category"],
    }),
    createCategory: builder.mutation<Category, Partial<Category>>({
      query: (body) => ({
        url: "/categories",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Category"],
    }),
    updateCategory: builder.mutation<
      Category,
      { id: string; data: Partial<Category> }
    >({
      query: ({ id, data }) => ({
        url: `/categories/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Category"],
    }),
    deleteCategory: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/categories/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Category"],
    }),
    bulkImportCategories: builder.mutation<
      { success: boolean; message: string },
      FormData
    >({
      query: (formData) => ({
        url: "/bulk-import-category",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["Category", "Attribute", "Specification"],
    }),

    // ---------- Attribute Endpoints ----------
    getAttributes: builder.query<CategoryAttribute[], string>({
      query: (categoryId) => `/attributes/${categoryId}`,
      providesTags: ["Attribute"],
    }),
    createAttribute: builder.mutation<
      CategoryAttribute,
      Partial<{
        categoryId: string;
        name: string;
        type: string;
        filterable: boolean;
        required: boolean;
        values?: string[];
      }>
    >({
      query: (body) => ({
        url: "/attributes",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Attribute"],
    }),
    updateAttribute: builder.mutation<
      CategoryAttribute,
      {
        id: string;
        data: Partial<{
          name: string;
          type: string;
          filterable: boolean;
          required: boolean;
        }>;
      }
    >({
      query: ({ id, data }) => ({
        url: `/attributes/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Attribute"],
    }),
    deleteAttribute: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/attributes/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Attribute"],
    }),
    addAttributeValue: builder.mutation<
      AttributeValue,
      { attributeId: string; value: string }
    >({
      query: ({ attributeId, value }) => ({
        url: `/attributes/${attributeId}/values`,
        method: "POST",
        body: { value },
      }),
      invalidatesTags: ["Attribute"],
    }),
    deleteAttributeValue: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/attributes/values/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Attribute"],
    }),

    // ---------- Specification Endpoints ----------
    getSpecifications: builder.query<CategorySpecification[], string>({
      query: (categoryId) => `/specifications/${categoryId}`,
      providesTags: ["Specification"],
    }),
    createSpecification: builder.mutation<
      CategorySpecification,
      Partial<{
        categoryId: string;
        name: string;
        type: string;
        unit?: string;
        filterable: boolean;
        required: boolean;
      }>
    >({
      query: (body) => ({
        url: "/specifications",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Specification"],
    }),
    updateSpecification: builder.mutation<
      CategorySpecification,
      {
        id: string;
        data: Partial<{
          name: string;
          type: string;
          unit?: string;
          filterable: boolean;
          required: boolean;
        }>;
      }
    >({
      query: ({ id, data }) => ({
        url: `/specifications/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Specification"],
    }),
    deleteSpecification: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/specifications/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Specification"],
    }),

    // ---------- SpecificationOption Endpoints ----------
    getSpecificationOptions: builder.query<SpecificationOption[], string>({
      query: (specificationId) =>
        `/specifications/${specificationId}/options`,
      providesTags: ["SpecificationOption"],
    }),
    createSpecificationOption: builder.mutation<
      SpecificationOption,
      { specificationId: string; value: string }
    >({
      query: ({ specificationId, value }) => ({
        url: `/specifications/${specificationId}/options`,
        method: "POST",
        body: { value },
      }),
      invalidatesTags: ["SpecificationOption"],
    }),
    deleteSpecificationOption: builder.mutation<void, string>({
      query: (id) => ({
        url: `/specifications/options/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["SpecificationOption"],
    }),

    // ---------- Product Endpoints ----------
    getProducts: builder.query<Product[], void>({
      query: () => "/products",
      providesTags: ["Product"],
    }),
    getProductById: builder.query<Product, string>({
      query: (id) => `/products/${id}`,
      providesTags: ["Product"],
    }),
    createProduct: builder.mutation<Product, Partial<Product>>({
      query: (body) => ({
        url: "/products",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Product"],
    }),
    updateProduct: builder.mutation<
      Product,
      { id: string; data: Partial<Product> }
    >({
      query: ({ id, data }) => ({
        url: `/products/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Product"],
    }),
    deleteProduct: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/products/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Product"],
    }),
  }),
});

// Export hooks for usage in components
export const {

  // ---------- Category hooks ----------
  useGetCategoriesQuery,
  useGetCategoryByIdQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useBulkImportCategoriesMutation,

  // ---------- Attribute hooks ----------
  useGetAttributesQuery,
  useCreateAttributeMutation,
  useUpdateAttributeMutation,
  useDeleteAttributeMutation,
  useAddAttributeValueMutation,
  useDeleteAttributeValueMutation,

  // ---------- Specification hooks ----------
  useGetSpecificationsQuery,
  useCreateSpecificationMutation,
  useUpdateSpecificationMutation,
  useDeleteSpecificationMutation,

  // ---------- SpecificationOption hooks ----------
  useGetSpecificationOptionsQuery,
  useCreateSpecificationOptionMutation,
  useDeleteSpecificationOptionMutation,

  // ---------- Product hooks ----------
  useGetProductsQuery,
  useGetProductByIdQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
} = apiSlice;
