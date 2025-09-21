import { createApi } from "@reduxjs/toolkit/query/react";
import baseQueryWithReauth from "./baseQueryWithReauth";

// --- Types ---
export interface Terms {
  id: string;
  title: string;
  slug: string;
  content: string;
  version: string;
  isActive: boolean;
  isPublished: boolean;
  type:
    | "GENERAL"
    | "PRIVACY_POLICY"
    | "VENDOR_AGREEMENT"
    | "CUSTOMER_TERMS"
    | "DELIVERY_TERMS"
    | "RETURN_POLICY";
  language: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  metaTitle?: string;
  metaDesc?: string;
}

export interface CreateTermsData {
  title: string;
  slug: string;
  content: string;
  version: string;
  type?: Terms["type"];
  language?: string;
  metaTitle?: string;
  metaDesc?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// --- Safe Transform Helper ---
function safeTransform<T>(response: ApiResponse<T> | T | null): T {
  if (!response) throw new Error("No response received");
  return (response as ApiResponse<T>).data !== undefined
    ? (response as ApiResponse<T>).data
    : (response as T);
}

// --- API Slice ---
export const termsApi = createApi({
  reducerPath: "termsApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Terms"],

  endpoints: (builder) => ({
    // ------- LIST -------
    getTerms: builder.query<Terms[], void>({
      query: () => "/terms",
      transformResponse: (response: ApiResponse<Terms[]> | Terms[]) =>
        safeTransform(response),
      providesTags: ["Terms"],
    }),

    // ------- GET ACTIVE -------
    getActiveTerms: builder.query<Terms, { type: Terms["type"] }>({
      query: ({ type }) => `/terms/active?type=${type}`,
      transformResponse: (response: ApiResponse<Terms> | Terms) =>
        safeTransform(response),
      providesTags: ["Terms"],
    }),

    // ------- CREATE -------
    createTerms: builder.mutation<Terms, CreateTermsData>({
      query: (body) => ({
        url: "/terms",
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiResponse<Terms> | Terms) =>
        safeTransform(response),
      invalidatesTags: ["Terms"],
    }),

    // ------- UPDATE -------
    updateTerms: builder.mutation<
      Terms,
      { id: string; data: Partial<CreateTermsData> }
    >({
      query: ({ id, data }) => ({
        url: `/terms/${id}`,
        method: "PUT",
        body: data,
      }),
      transformResponse: (response: ApiResponse<Terms> | Terms) =>
        safeTransform(response),
      invalidatesTags: (result, error, { id }) => [
        { type: "Terms", id },
        "Terms",
      ],
    }),

    // ------- PUBLISH -------
    publishTerms: builder.mutation<Terms, string>({
      query: (id) => ({
        url: `/terms/${id}/publish`,
        method: "POST",
      }),
      transformResponse: (response: ApiResponse<Terms> | Terms) =>
        safeTransform(response),
      invalidatesTags: ["Terms"],
    }),

    // ------- ACTIVATE -------
    activateTerms: builder.mutation<Terms, { id: string; type: Terms["type"] }>(
      {
        query: ({ id, type }) => ({
          url: `/terms/${id}/activate`,
          method: "POST",
          body: { type },
        }),
        transformResponse: (response: ApiResponse<Terms> | Terms) =>
          safeTransform(response),
        invalidatesTags: ["Terms"],
      }
    ),

    // ------- DELETE -------
    deleteTerms: builder.mutation<ApiResponse<null> | null, string>({
      query: (id) => ({
        url: `/terms/${id}`,
        method: "DELETE",
      }),
      transformResponse: (response: ApiResponse<null> | null) =>
        response ?? { success: true, data: null },
      invalidatesTags: ["Terms"],
    }),
  }),
});

// --- Export Hooks ---
export const {
  useGetTermsQuery,
  useGetActiveTermsQuery,
  useCreateTermsMutation,
  useUpdateTermsMutation,
  usePublishTermsMutation,
  useActivateTermsMutation,
  useDeleteTermsMutation,
} = termsApi;
