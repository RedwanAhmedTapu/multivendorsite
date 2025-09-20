// features/apiSlice.ts
import { createApi } from "@reduxjs/toolkit/query/react";
import {
  Category,
  AttributeValue,
  CategoryAttribute,
  CategorySpecification,
  SpecificationOption,
} from "../types/type";
import baseQueryWithReauth from "./baseQueryWithReauth";

// API Slice Definition
export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
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
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Category" as const, id })),
              { type: "Category", id: "LIST" },
            ]
          : [{ type: "Category", id: "LIST" }],
    }),

    getCategoryById: builder.query<Category, string>({
      query: (id) => `/categories/${id}`,
      providesTags: (result, error, id) => [{ type: "Category", id }],
    }),

    createCategory: builder.mutation<Category, { name: string; slug: string; parentId?: string }>({
      query: (body) => ({
        url: "/categories",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Category", id: "LIST" }],
    }),

    updateCategory: builder.mutation<Category, { id: string; data: Partial<Category> }>({
      query: ({ id, data }) => ({
        url: `/categories/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Category", id }],
    }),

    deleteCategory: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/categories/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Category", id },
        { type: "Category", id: "LIST" },
      ],
    }),

    bulkImportCategories: builder.mutation<{ success: boolean; message: string }, FormData>({
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
      {
        categoryId: string;
        name: string;
        type: string;
        filterable: boolean;
        isRequired: boolean; // ✅ fixed naming
        values?: string[];
      }
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
          isRequired: boolean; // ✅ fixed naming
        }>;
      }
    >({
      query: ({ id, data }) => ({
        url: `/attributes/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Attribute", id }],
    }),

    deleteAttribute: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/attributes/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [{ type: "Attribute", id }],
    }),

    addAttributeValue: builder.mutation<AttributeValue, { attributeId: string; value: string }>({
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
      {
        categoryId: string;
        name: string;
        type: string;
        unit?: string;
        filterable: boolean;
        isRequired: boolean; // ✅ fixed naming
      }
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
          isRequired: boolean;
        }>;
      }
    >({
      query: ({ id, data }) => ({
        url: `/specifications/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Specification", id }],
    }),

    deleteSpecification: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/specifications/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [{ type: "Specification", id }],
    }),

    // ---------- SpecificationOption Endpoints ----------
    getSpecificationOptions: builder.query<SpecificationOption[], string>({
      query: (specificationId) => `/specifications/${specificationId}/options`,
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
} = apiSlice;
