// features/attributeSlice.ts
import { createApi } from "@reduxjs/toolkit/query/react";
import baseQueryWithReauth from "./baseQueryWithReauth";
import { Attribute, AttributeValue, CategoryAttribute } from "@/types/category.types";

// Types based on unified Attribute model


export const attributeSlice = createApi({
  reducerPath: "attributeApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Attribute", "AttributeValue", "CategoryAttribute"],

  endpoints: (builder) => ({
    // ---------- Global Attributes (all attributes across all categories) ----------
    getAllGlobalAttributes: builder.query<Attribute[], void>({
      query: () => `/attributes/`,
      providesTags: ["Attribute"],
    }),

    // ---------- Category-specific Attributes ----------
    getAttributesByCategory: builder.query<CategoryAttribute[], string>({
      query: (categoryId) => `/attributes/${categoryId}`,
      providesTags: (result, error, categoryId) => [
        { type: "CategoryAttribute", id: categoryId },
        { type: "Attribute", id: `category-${categoryId}` },
      ],
    }),

    createAttribute: builder.mutation<
      CategoryAttribute,
      {
        categoryId: string;
        name: string;
        type: "TEXT" | "NUMBER" | "BOOLEAN" | "SELECT" | "MULTISELECT" | "DATE" | "FILE";
        filterable?: boolean;
        required?: boolean;
        values?: string[];
        unit?: string;
      }
    >({
      query: (body) => ({
        url: "/attributes",
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { categoryId }) => [
        { type: "CategoryAttribute", id: categoryId },
        { type: "Attribute", id: `category-${categoryId}` },
      ],
    }),

    updateAttribute: builder.mutation<
      CategoryAttribute,
      {
        id: string; // categoryAttributeId
        data: {
          name?: string;
          type?: "TEXT" | "NUMBER" | "BOOLEAN" | "SELECT" | "MULTISELECT" | "DATE" | "FILE";
          filterable?: boolean;
          required?: boolean;
          sortOrder?: number;
          unit?: string;
        };
      }
    >({
      query: ({ id, data }) => ({
        url: `/attributes/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "CategoryAttribute", id },
        "Attribute",
      ],
    }),

    deleteAttribute: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/attributes/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "CategoryAttribute", id },
        "Attribute",
      ],
    }),

    updateAttributeSortOrder: builder.mutation<
      CategoryAttribute[],
      { categoryId: string; attributeOrders: { id: string; sortOrder: number }[] }
    >({
      query: ({ categoryId, attributeOrders }) => ({
        url: `/attributes/${categoryId}/sort-order`,
        method: "PUT",
        body: { attributeOrders },
      }),
      invalidatesTags: (result, error, { categoryId }) => [
        { type: "CategoryAttribute", id: categoryId },
      ],
    }),

    // ---------- Attribute Values ----------
    addAttributeValue: builder.mutation<
      AttributeValue,
      { attributeId: string; value: string }
    >({
      query: ({ attributeId, value }) => ({
        url: `/attributes/${attributeId}/values`,
        method: "POST",
        body: { value },
      }),
      invalidatesTags: ["AttributeValue", "Attribute"],
    }),

    deleteAttributeValue: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/attributes/values/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["AttributeValue", "Attribute"],
    }),

    // ---------- Additional utility endpoints ----------
    getAttributeById: builder.query<Attribute, string>({
      query: (attributeId) => `/attributes/details/${attributeId}`,
      providesTags: (result, error, attributeId) => [
        { type: "Attribute", id: attributeId },
      ],
    }),

    searchAttributes: builder.query<Attribute[], { query: string; limit?: number }>({
      query: ({ query, limit = 10 }) => ({
        url: `/attributes/search`,
        params: { query, limit },
      }),
    }),
  }),
});

// Export hooks
export const {
  // ---------- Attribute hooks ----------
  useGetAllGlobalAttributesQuery,
  useGetAttributesByCategoryQuery,
  useGetAttributeByIdQuery,
  useSearchAttributesQuery,
  
  // ---------- Attribute CRUD hooks ----------
  useCreateAttributeMutation,
  useUpdateAttributeMutation,
  useDeleteAttributeMutation,
  useUpdateAttributeSortOrderMutation,
  
  // ---------- Attribute Value hooks ----------
  useAddAttributeValueMutation,
  useDeleteAttributeValueMutation,
} = attributeSlice;