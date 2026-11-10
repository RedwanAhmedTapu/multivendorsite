import { createApi } from "@reduxjs/toolkit/query/react";
import { Category, AttributeValue } from "../types/type";
import baseQueryWithReauth from "./baseQueryWithReauth";
import { CategoryAttribute } from "@/types/category.types";

// ===========================
// TYPE DEFINITIONS
// ===========================

export interface FilterableAttributeValue {
  id: string;
  value: string;
  productCount: number;
}

export interface FilterableAttribute {
  id: string;
  name: string;
  slug: string;
  type: "TEXT" | "NUMBER" | "BOOLEAN" | "SELECT" | "MULTISELECT";
  unit?: string;
  values: FilterableAttributeValue[];
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
    keywords?: string[];
    tags?: string[];
    breadcrumb: CategoryHierarchy[];
  };
  filters: {
    attributes: FilterableAttribute[];
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
  totalFilterOptions: number;
  priceRange: PriceRange;
  totalProducts: number;
  hasFilters: boolean;
}

export interface EnhancedCategory extends Category {
  keywords: string[];
  tags: string[];
}

// Template Types
export interface TemplateInfoResponse {
  success: boolean;
  data: {
    description: string;
    rules: {
      image: string;
      keywords: string;
      tags: string;
      attributes: string;
    };
    availableTemplates: Array<{
      name: string;
      endpoint: string;
      description: string;
      parameters: {
        maxLevels: string;
        includeAttributes: string;
      };
    }>;
  };
}

// ⭐ NEW: Row-level detail for admin report
export interface RowDetail {
  row: number;
  status: "imported" | "failed";
  path: string;
  message?: string;
  categoriesCreated: number;
  categoriesReused: number;
  attributesCreated: number;
  categoryAttributeLinks: number;
}

// ⭐ UPDATED: Flat response matching new controller
export interface BulkImportResponse {
  success: boolean;
  message: string;
  totalRows: number;
  imported: number;
  failed: number;
  categoriesCreated: number;
  categoriesReused: number;
  attributesCreated: number;
  categoryAttributeLinks: number;
  warnings: string[];
  errors: Array<{ row: number; message: string }>;
  rowDetails: RowDetail[];
}

// ===========================
// API SLICE DEFINITION
// ===========================

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Category", "Attribute", "Product", "Auth", "CategoryFilter", "Template", "CatalogRequest"],
  endpoints: (builder) => ({
    // ---------- Category endpoints ----------
    getCategories: builder.query<EnhancedCategory[], void>({
      query: () => "/categories",
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Category" as const, id })),
              { type: "Category", id: "LIST" },
            ]
          : [{ type: "Category", id: "LIST" }],
    }),

    getCategoryById: builder.query<EnhancedCategory, string>({
      query: (id) => `/categories/${id}`,
      providesTags: (result, error, id) => [{ type: "Category", id }],
    }),

    searchCategories: builder.query<EnhancedCategory[], string>({
      query: (q) => `/categories/search?q=${encodeURIComponent(q)}`,
      providesTags: [{ type: "Category", id: "SEARCH" }],
    }),

    getCategoriesByTag: builder.query<EnhancedCategory[], string>({
      query: (tag) => `/categories/tag/${tag}`,
      providesTags: (result, error, tag) => [
        { type: "Category", id: `TAG-${tag}` },
      ],
    }),

    getCategoriesByKeyword: builder.query<EnhancedCategory[], string>({
      query: (keyword) => `/categories/keyword/${keyword}`,
      providesTags: (result, error, keyword) => [
        { type: "Category", id: `KEYWORD-${keyword}` },
      ],
    }),

    createCategory: builder.mutation<EnhancedCategory, FormData>({
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

    updateCategory: builder.mutation<
      EnhancedCategory,
      { id: string; formData: FormData }
    >({
      query: ({ id, formData }) => ({
        url: `/categories/${id}`,
        method: "PUT",
        body: formData,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Category", id },
        { type: "Category", id: "LIST" },
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

    // ---------- Category Filter endpoints ----------
    getCategoryFilters: builder.query<
      { success: boolean; data: CategoryFilterResponse; message: string },
      string
    >({
      query: (categoryId) => `/categories-filter/${categoryId}/filters`,
      transformResponse: (response: any) => ({
        success: true,
        data: response.data,
        message: response.message || "Filter data retrieved successfully",
      }),
      providesTags: (result, error, categoryId) => [
        { type: "CategoryFilter", id: categoryId },
      ],
    }),

    getCategoryFiltersBySlug: builder.query<
      { success: boolean; data: CategoryFilterResponse; message: string },
      string
    >({
      query: (slug) => `/categories-filter/slug/${slug}/filters`,
      transformResponse: (response: any) => ({
        success: true,
        data: response.data,
        message: response.message || "Filter data retrieved successfully",
      }),
      providesTags: (result) =>
        result
          ? [{ type: "CategoryFilter", id: result.data.category.id }]
          : [{ type: "CategoryFilter", id: "LIST" }],
    }),

    getMultipleCategoriesFilters: builder.query<
      { success: boolean; data: MultipleCategoriesFilterResponse; message: string },
      string[]
    >({
      query: (categoryIds) => ({
        url: "/categories-filter/filters/multiple",
        params: { categoryIds: categoryIds.join(",") },
      }),
      transformResponse: (response: any) => ({
        success: true,
        data: response.data,
        message: response.message || "Filter data retrieved successfully",
      }),
      providesTags: (result, error, categoryIds) => [
        ...categoryIds.map((id) => ({ type: "CategoryFilter" as const, id })),
        { type: "CategoryFilter", id: "MULTIPLE" },
      ],
    }),

    getMultipleCategoriesFiltersBySlugs: builder.query<
      { success: boolean; data: MultipleCategoriesFilterResponse; message: string },
      string[]
    >({
      query: (categorySlugs) => ({
        url: "/categories-filter/filters/multiple-slugs",
        params: { categorySlugs: categorySlugs.join(",") },
      }),
      transformResponse: (response: any) => ({
        success: true,
        data: response.data,
        message: response.message || "Filter data retrieved successfully",
      }),
      providesTags: [{ type: "CategoryFilter", id: "MULTIPLE" }],
    }),

    getCategoryFilterSummary: builder.query<
      { success: boolean; data: FilterSummaryResponse; message: string },
      string
    >({
      query: (categoryId) => `/categories-filter/${categoryId}/filters/summary`,
      transformResponse: (response: any) => ({
        success: true,
        data: response.data,
        message: response.message || "Filter summary retrieved successfully",
      }),
      providesTags: (result, error, categoryId) => [
        { type: "CategoryFilter", id: `${categoryId}-summary` },
      ],
    }),

    // ---------- Template endpoints ----------
    getTemplateInfo: builder.query<TemplateInfoResponse, void>({
      query: () => "/category-template/info",
      providesTags: [{ type: "Template", id: "INFO" }],
    }),

    // ⭐ Returns raw Blob — no transformResponse to avoid Redux serialization issues
    downloadStandardTemplate: builder.mutation<
      Blob,
      { maxLevels?: number; includeAttributes?: number }
    >({
      query: (params) => ({
        url: "/category-template/download/standard",
        method: "GET",
        params,
        responseHandler: (response) => response.blob(),
      }),
    }),

    // ⭐ Returns raw Blob — no transformResponse
    downloadCustomTemplate: builder.mutation<
      Blob,
      { maxLevels?: number; includeAttributes?: number }
    >({
      query: (params) => ({
        url: "/category-template/download/custom",
        method: "GET",
        params,
        responseHandler: (response) => response.blob(),
      }),
    }),

    // ---------- Bulk Import ----------
    // ⭐ No transformResponse — controller returns exact shape
    bulkImportCategories: builder.mutation<BulkImportResponse, FormData>({
      query: (formData) => ({
        url: "/bulk-import-category",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["Category", "Attribute", "CategoryFilter"],
    }),

    // ---------- Attribute endpoints ----------
    getAttributes: builder.query<CategoryAttribute[], string>({
      query: (categoryId) => `/attributes/${categoryId}`,
      providesTags: (result, error, categoryId) => [
        { type: "Attribute", id: categoryId },
        { type: "Attribute", id: "LIST" },
      ],
    }),

    createAttribute: builder.mutation<
      CategoryAttribute,
      {
        categoryId: string;
        name: string;
        type: "TEXT" | "NUMBER" | "BOOLEAN" | "SELECT" | "MULTISELECT";
        unit?: string;
        filterable: boolean;
        isRequired: boolean;
        sortOrder?: number;
        values?: string[];
      }
    >({
      query: (body) => ({
        url: "/attributes",
        method: "POST",
        body,
      }),
      invalidatesTags: [
        { type: "Attribute", id: "LIST" },
        { type: "CategoryFilter", id: "LIST" },
      ],
    }),

    updateAttribute: builder.mutation<
      CategoryAttribute,
      {
        id: string;
        data: Partial<{
          name: string;
          type: string;
          unit?: string;
          filterable: boolean;
          isRequired: boolean;
          sortOrder?: number;
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
        { type: "Attribute", id: "LIST" },
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
      invalidatesTags: (result, error, { attributeId }) => [
        { type: "Attribute", id: attributeId },
        { type: "CategoryFilter", id: "LIST" },
      ],
    }),

    deleteAttributeValue: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/attributes/values/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [
        { type: "Attribute", id: "LIST" },
        { type: "CategoryFilter", id: "LIST" },
      ],
    }),

    updateAttributeValue: builder.mutation<
      AttributeValue,
      { id: string; value: string }
    >({
      query: ({ id, value }) => ({
        url: `/attributes/values/${id}`,
        method: "PUT",
        body: { value },
      }),
      invalidatesTags: [
        { type: "Attribute", id: "LIST" },
        { type: "CategoryFilter", id: "LIST" },
      ],
    }),

    reorderAttributes: builder.mutation<
      { message: string },
      {
        categoryId: string;
        attributeOrders: { id: string; sortOrder: number }[];
      }
    >({
      query: ({ categoryId, attributeOrders }) => ({
        url: `/attributes/${categoryId}/reorder`,
        method: "PUT",
        body: { attributeOrders },
      }),
      invalidatesTags: (result, error, { categoryId }) => [
        { type: "Attribute", id: categoryId },
      ],
    }),

    // ---------- Catalog Request endpoints ----------
    createCatalogRequest: builder.mutation<
      any,
      {
        requestType: string;
        categoryId?: string;
        attributeId?: string;
        requestedName: string;
        requestedType?: string;
        description?: string;
      }
    >({
      query: (body) => ({
        url: "/categories/catalog-request",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "CatalogRequest", id: "LIST" }],
    }),

    getMyCatalogRequests: builder.query<any[], void>({
      query: () => "/categories/catalog-request/my",
      providesTags: [{ type: "CatalogRequest", id: "MY" }],
    }),

    getAllCatalogRequests: builder.query<any[], void>({
      query: () => "/categories/catalog-request/all",
      providesTags: [{ type: "CatalogRequest", id: "LIST" }],
    }),
  }),
});

// ===========================
// EXPORT HOOKS
// ===========================

export const {
  useGetCategoriesQuery,
  useGetCategoryByIdQuery,
  useSearchCategoriesQuery,
  useGetCategoriesByTagQuery,
  useGetCategoriesByKeywordQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useGetCategoryFiltersQuery,
  useGetCategoryFiltersBySlugQuery,
  useGetMultipleCategoriesFiltersQuery,
  useGetMultipleCategoriesFiltersBySlugsQuery,
  useGetCategoryFilterSummaryQuery,
  useGetTemplateInfoQuery,
  useDownloadStandardTemplateMutation,
  useDownloadCustomTemplateMutation,
  useBulkImportCategoriesMutation,
  useGetAttributesQuery,
  useCreateAttributeMutation,
  useUpdateAttributeMutation,
  useDeleteAttributeMutation,
  useAddAttributeValueMutation,
  useDeleteAttributeValueMutation,
  useUpdateAttributeValueMutation,
  useReorderAttributesMutation,
  useCreateCatalogRequestMutation,
  useGetMyCatalogRequestsQuery,
  useGetAllCatalogRequestsQuery,
} = apiSlice;