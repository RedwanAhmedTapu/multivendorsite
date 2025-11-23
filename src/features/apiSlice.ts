// features/apiSlice.ts
import { createApi } from "@reduxjs/toolkit/query/react";
import {
  Category,
  AttributeValue,
  CategorySpecification,
  SpecificationOption,
} from "../types/type";
import baseQueryWithReauth from "./baseQueryWithReauth";
import { Attribute } from "next-themes";

// ===========================
// TYPE DEFINITIONS
// ===========================

interface CategoryAttribute {
  id: string;
  categoryId: string;
  category?: Category;
  attributeId: string;
  attribute?: Attribute;
  isRequired: boolean;
  isForVariant: boolean;
  filterable: boolean;
  createdAt: string;
  updatedAt: string;
}

// Filter API Response Types
export interface FilterableAttributeValue {
  id: string;
  value: string;
  productCount: number;
}

export interface FilterableAttribute {
  id: string;
  name: string;
  slug: string;
  type: 'TEXT' | 'NUMBER' | 'BOOLEAN' | 'SELECT';
  values: FilterableAttributeValue[];
}

export interface FilterableSpecificationValue {
  value: string | number;
  productCount: number;
}

export interface FilterableSpecification {
  id: string;
  name: string;
  slug: string;
  type: 'TEXT' | 'NUMBER' | 'BOOLEAN' | 'SELECT';
  unit?: string;
  values: FilterableSpecificationValue[];
  options?: Array<{ id: string; value: string }>;
}

export interface PriceRange {
  min: number;
  max: number;
}

export interface CategoryHierarchy {
  id: string;
  name: string;
  slug: string;
  level: number;
}

export interface CategoryFilterResponse {
  category: {
    id: string;
    name: string;
    slug: string;
    breadcrumb: CategoryHierarchy[];
  };
  filters: {
    attributes: FilterableAttribute[];
    specifications: FilterableSpecification[];
    priceRange: PriceRange;
  };
  meta: {
    totalProducts: number;
    hasFilters: boolean;
  };
}

export interface MultipleCategoriesFilterResponse {
  filters: {
    attributes: FilterableAttribute[];
    specifications: FilterableSpecification[];
    priceRange: PriceRange;
  };
  meta: {
    totalProducts: number;
    categoriesProcessed: number;
    hasFilters: boolean;
  };
}

export interface FilterSummaryResponse {
  attributeCount: number;
  specificationCount: number;
  totalFilterOptions: number;
  priceRange: PriceRange;
  totalProducts: number;
  hasFilters: boolean;
}

// ===========================
// API SLICE DEFINITION
// ===========================

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
    "CategoryFilter",
  ],
  endpoints: (builder) => ({
    // ==========================================
    // CATEGORY ENDPOINTS
    // ==========================================
    
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

    createCategory: builder.mutation<Category, FormData>({
      query: (formData) => ({
        url: "/categories",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: [
        { type: "Category", id: "LIST" },
        { type: "CategoryFilter", id: "LIST" },
      ],
    }),

    updateCategory: builder.mutation<Category, { id: string; formData: FormData }>({
      query: ({ id, formData }) => ({
        url: `/categories/${id}`,
        method: "PUT",
        body: formData,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Category", id },
        { type: "CategoryFilter", id },
      ],
    }),

    deleteCategory: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/categories/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Category", id },
        { type: "Category", id: "LIST" },
        { type: "CategoryFilter", id: "LIST" },
      ],
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
      invalidatesTags: [
        "Category",
        "Attribute",
        "Specification",
        "CategoryFilter",
      ],
    }),

    // ==========================================
    // CATEGORY FILTER ENDPOINTS
    // ==========================================

    /**
     * Get filter data for a single category by ID
     */
    getCategoryFilters: builder.query<CategoryFilterResponse, string>({
      query: (categoryId) => `/categories-filter/${categoryId}/filters`,
      providesTags: (result, error, categoryId) => [
        { type: "CategoryFilter", id: categoryId },
      ],
    }),

    /**
     * Get filter data for a single category by slug (SEO-friendly)
     */
    getCategoryFiltersBySlug: builder.query<CategoryFilterResponse, string>({
      query: (slug) => `/categories-filter/slug/${slug}/filters`,
      providesTags: (result) =>
        result
          ? [{ type: "CategoryFilter", id: result.category.id }]
          : [{ type: "CategoryFilter", id: "LIST" }],
    }),

    /**
     * Get combined filter data for multiple categories by IDs
     */
    getMultipleCategoriesFilters: builder.query<
      MultipleCategoriesFilterResponse,
      string[]
    >({
      query: (categoryIds) => ({
        url: "/categories-filter/filters/multiple",
        params: { categoryIds: categoryIds.join(",") },
      }),
      providesTags: (result, error, categoryIds) => [
        ...categoryIds.map((id) => ({ type: "CategoryFilter" as const, id })),
        { type: "CategoryFilter", id: "MULTIPLE" },
      ],
    }),

    /**
     * Get combined filter data for multiple categories by slugs
     */
    getMultipleCategoriesFiltersBySlugs: builder.query<
      MultipleCategoriesFilterResponse,
      string[]
    >({
      query: (categorySlugs) => ({
        url: "/categories-filter/filters/multiple-slugs",
        params: { categorySlugs: categorySlugs.join(",") },
      }),
      providesTags: [{ type: "CategoryFilter", id: "MULTIPLE" }],
    }),

    /**
     * Get filter summary (lightweight endpoint)
     */
    getCategoryFilterSummary: builder.query<FilterSummaryResponse, string>({
      query: (categoryId) => `/categories-filter/${categoryId}/filters/summary`,
      providesTags: (result, error, categoryId) => [
        { type: "CategoryFilter", id: `${categoryId}-summary` },
      ],
    }),

    // ==========================================
    // ATTRIBUTE ENDPOINTS
    // ==========================================
    
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
        isRequired: boolean;
        values?: string[];
      }
    >({
      query: (body) => ({
        url: "/attributes",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Attribute", { type: "CategoryFilter", id: "LIST" }],
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
      invalidatesTags: (result, error, { id }) => [
        { type: "Attribute", id },
        { type: "CategoryFilter", id: "LIST" },
      ],
    }),

    deleteAttribute: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/attributes/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Attribute", id },
        { type: "CategoryFilter", id: "LIST" },
      ],
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
      invalidatesTags: ["Attribute", { type: "CategoryFilter", id: "LIST" }],
    }),

    deleteAttributeValue: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/attributes/values/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Attribute", { type: "CategoryFilter", id: "LIST" }],
    }),

    // ==========================================
    // SPECIFICATION ENDPOINTS
    // ==========================================
    
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
        isRequired: boolean;
      }
    >({
      query: (body) => ({
        url: "/specifications",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Specification", { type: "CategoryFilter", id: "LIST" }],
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
        { type: "CategoryFilter", id: "LIST" },
      ],
    }),

    deleteSpecification: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/specifications/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Specification", id },
        { type: "CategoryFilter", id: "LIST" },
      ],
    }),

    // ==========================================
    // SPECIFICATION OPTION ENDPOINTS
    // ==========================================
    
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
      invalidatesTags: [
        "SpecificationOption",
        { type: "CategoryFilter", id: "LIST" },
      ],
    }),

    deleteSpecificationOption: builder.mutation<void, string>({
      query: (id) => ({
        url: `/specifications/options/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [
        "SpecificationOption",
        { type: "CategoryFilter", id: "LIST" },
      ],
    }),
  }),
});

// ===========================
// EXPORT HOOKS
// ===========================

export const {
  // ---------- Category hooks ----------
  useGetCategoriesQuery,
  useGetCategoryByIdQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useBulkImportCategoriesMutation,

  // ---------- Category Filter hooks ----------
  useGetCategoryFiltersQuery,
  useGetCategoryFiltersBySlugQuery,
  useGetMultipleCategoriesFiltersQuery,
  useGetMultipleCategoriesFiltersBySlugsQuery,
  useGetCategoryFilterSummaryQuery,

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