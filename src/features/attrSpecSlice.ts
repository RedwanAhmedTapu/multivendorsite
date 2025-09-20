// features/attrSpecSlice.ts
import { createApi } from "@reduxjs/toolkit/query/react";
import {
  CategoryAttribute,
  AttributeValue,
  CategorySpecification,
  SpecificationOption,
} from "../types/type";
import baseQueryWithReauth from "./baseQueryWithReauth";

export const attrSpecSlice = createApi({
  reducerPath: "attrSpecApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Attribute", "Specification", "SpecificationOption"],

  endpoints: (builder) => ({
    // ---------- Attribute Endpoints ----------
    getAllAttributes: builder.query<CategoryAttribute[], void>({
      query: () => `/attributes/`,
      providesTags: ["Attribute"],
    }),

    getAttributesByCategory: builder.query<CategoryAttribute[], string>({
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
        isRequired: boolean;
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
          isRequired: boolean;
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
    getAllSpecifications: builder.query<CategorySpecification[], void>({
      query: () => `/specifications`,
      providesTags: ["Specification"],
    }),

    getSpecificationsByCategory: builder.query<CategorySpecification[], string>({
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
        isRequired: boolean;
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
      invalidatesTags: (result, error, { id }) => [
        { type: "Specification", id },
      ],
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

// Export hooks
export const {
  // ---------- Attribute hooks ----------
  useGetAllAttributesQuery,
  useGetAttributesByCategoryQuery,
  useCreateAttributeMutation,
  useUpdateAttributeMutation,
  useDeleteAttributeMutation,
  useAddAttributeValueMutation,
  useDeleteAttributeValueMutation,

  // ---------- Specification hooks ----------
  useGetAllSpecificationsQuery,
  useGetSpecificationsByCategoryQuery,
  useCreateSpecificationMutation,
  useUpdateSpecificationMutation,
  useDeleteSpecificationMutation,

  // ---------- SpecificationOption hooks ----------
  useGetSpecificationOptionsQuery,
  useCreateSpecificationOptionMutation,
  useDeleteSpecificationOptionMutation,
} = attrSpecSlice;
