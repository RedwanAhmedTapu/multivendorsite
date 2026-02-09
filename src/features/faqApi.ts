// src/redux/faqApi.ts
import { createApi } from "@reduxjs/toolkit/query/react";
import baseQueryWithReauth from "./baseQueryWithReauth";

// ------- Types -------
export interface Faq {
  id: string;
  category: string;
  question: string;
  answer: string;
  isActive: boolean;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFaqDto {
  category: string;
  question: string;
  answer: string;
  isActive: boolean;
  orderIndex?: number;
}

export interface UpdateFaqDto {
  category?: string;
  question?: string;
  answer?: string;
  isActive?: boolean;
  orderIndex?: number;
}

export interface FaqQuery {
  category?: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface FaqPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface FaqListResponse {
  success: boolean;
  data: Faq[];
  pagination: FaqPagination;
}

export interface FaqResponse {
  success: boolean;
  data: Faq;
  message?: string;
}

export interface FaqsResponse {
  success: boolean;
  data: Faq[];
}

export interface CategoriesResponse {
  success: boolean;
  data: string[];
}

export interface BulkOrderUpdate {
  id: string;
  orderIndex: number;
}

export interface MessageResponse {
  success: boolean;
  message: string;
}

// ------- API -------
export const faqApi = createApi({
  reducerPath: "faqApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Faqs", "FaqCategories"],

  endpoints: (builder) => ({
    // ------- Get all FAQs with filtering and pagination -------
   getFaqs: builder.query<FaqListResponse, FaqQuery | void>({
  query: (params) => {
    const queryParams = new URLSearchParams();
    
    if (params && params.category) queryParams.append("category", params.category);
    if (params && params.isActive !== undefined) {
      // Send as JSON boolean in URL or use a custom serializer
      queryParams.append("isActive", params.isActive ? "true" : "false");
    }
    if (params && params.search) queryParams.append("search", params.search);
    if (params && params.page) queryParams.append("page", String(params.page));
    if (params && params.limit) queryParams.append("limit", String(params.limit));

    const queryString = queryParams.toString();
    return `/faqs${queryString ? `?${queryString}` : ""}`;
  },
  providesTags: (result) =>
    result
      ? [
          ...result.data.map(({ id }) => ({ type: "Faqs" as const, id })),
          { type: "Faqs", id: "LIST" },
        ]
      : [{ type: "Faqs", id: "LIST" }],
}),
    // ------- Get FAQ by ID -------
    getFaqById: builder.query<FaqResponse, string>({
      query: (id) => `/faqs/${id}`,
      providesTags: (result, error, id) => [{ type: "Faqs", id }],
    }),

    // ------- Get FAQs by category -------
    getFaqsByCategory: builder.query<FaqsResponse, string>({
      query: (category) => `/faqs/category/${category}`,
      providesTags: (result, error, category) => [
        { type: "Faqs", id: `CATEGORY-${category}` },
      ],
    }),

    // ------- Get all categories -------
    getCategories: builder.query<CategoriesResponse, void>({
      query: () => "/faqs/categories",
      providesTags: ["FaqCategories"],
    }),

    // ------- Create FAQ -------
    createFaq: builder.mutation<FaqResponse, CreateFaqDto>({
      query: (body) => ({
        url: "/faqs",
        method: "POST",
        body,
      }),
      invalidatesTags: [
        { type: "Faqs", id: "LIST" },
        "FaqCategories",
      ],
    }),

    // ------- Update FAQ -------
    updateFaq: builder.mutation<
      FaqResponse,
      { id: string; data: UpdateFaqDto }
    >({
      query: ({ id, data }) => ({
        url: `/faqs/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Faqs", id },
        { type: "Faqs", id: "LIST" },
        "FaqCategories",
      ],
    }),

    // ------- Delete FAQ -------
    deleteFaq: builder.mutation<MessageResponse, string>({
      query: (id) => ({
        url: `/faqs/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [
        { type: "Faqs", id: "LIST" },
        "FaqCategories",
      ],
    }),

    // ------- Bulk update order -------
    updateFaqOrder: builder.mutation<MessageResponse, BulkOrderUpdate[]>({
      query: (updates) => ({
        url: "/faqs/order/bulk",
        method: "PATCH",
        body: { updates },
      }),
      invalidatesTags: [{ type: "Faqs", id: "LIST" }],
    }),

    // ------- Toggle FAQ status -------
    toggleFaqStatus: builder.mutation<FaqResponse, string>({
      query: (id) => ({
        url: `/faqs/${id}/toggle-status`,
        method: "PATCH",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Faqs", id },
        { type: "Faqs", id: "LIST" },
      ],
    }),
  }),
});

// ------- Export hooks -------
export const {
  // Queries
  useGetFaqsQuery,
  useGetFaqByIdQuery,
  useGetFaqsByCategoryQuery,
  useGetCategoriesQuery,

  // Mutations
  useCreateFaqMutation,
  useUpdateFaqMutation,
  useDeleteFaqMutation,
  useUpdateFaqOrderMutation,
  useToggleFaqStatusMutation,

  // Lazy queries (for manual triggering)
  useLazyGetFaqsQuery,
  useLazyGetFaqByIdQuery,
  useLazyGetFaqsByCategoryQuery,
  useLazyGetCategoriesQuery,
} = faqApi;