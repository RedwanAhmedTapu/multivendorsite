// src/state/api/footerSettingsApi.ts
import { createApi } from "@reduxjs/toolkit/query/react";
import baseQueryWithReauth from "./baseQueryWithReauth";

/* ==================== REQUEST TYPES ==================== */

export interface CreateFooterElementRequest {
  label: string;
  url: string;
  displayOrder?: number;
  isVisible?: boolean;
  openInNewTab?: boolean;
}

export interface CreateFooterColumnRequest {
  title: string;
  isVisible?: boolean;
  elements?: CreateFooterElementRequest[];
}

export interface CreateFooterSettingsRequest {
  companyName: string;
  address: string;
  email: string;
  phone1: string;
  phone2?: string | null;
  dbidNumber: string;
  tradeLicense: string;
  newsletterTitle: string;
  newsletterDescription: string;
  socialMediaTitle: string;
  twitterUrl?: string | null;
  facebookUrl?: string | null;
  youtubeUrl?: string | null;
  instagramUrl?: string | null;
  whatsappUrl?: string | null;
  copyrightText: string;
  paymentBannerImage: string;
  columns?: CreateFooterColumnRequest[];
}

export interface UpdateFooterSettingsRequest {
  companyName?: string;
  address?: string;
  email?: string;
  phone1?: string;
  phone2?: string | null;
  dbidNumber?: string;
  tradeLicense?: string;
  newsletterTitle?: string;
  newsletterDescription?: string;
  socialMediaTitle?: string;
  twitterUrl?: string | null;
  facebookUrl?: string | null;
  youtubeUrl?: string | null;
  instagramUrl?: string | null;
  whatsappUrl?: string | null;
  copyrightText?: string;
  paymentBannerImage?: string;
}

export interface UpdateFooterColumnRequest {
  title?: string;
  isVisible?: boolean;
}

export interface UpdateFooterElementRequest {
  label?: string;
  url?: string;
  displayOrder?: number;
  isVisible?: boolean;
  openInNewTab?: boolean;
}

/* ==================== RESPONSE TYPES ==================== */

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface SuccessResponse {
  success: boolean;
  message: string;
}

export interface FooterElement {
  id: string;
  createdAt: string;
  updatedAt: string;
  label: string;
  url: string;
  displayOrder: number;
  isVisible: boolean;
  openInNewTab: boolean;
  footerColumnId: string;
}

export interface FooterColumn {
  id: string;
  createdAt: string;
  updatedAt: string;
  title: string;
  isVisible: boolean;
  footerSettingsId: string;
  elements: FooterElement[];
}

export interface FooterSettings {
  id: string;
  createdAt: string;
  updatedAt: string;
  companyName: string;
  address: string;
  email: string;
  phone1: string;
  phone2: string | null;
  dbidNumber: string;
  tradeLicense: string;
  newsletterTitle: string;
  newsletterDescription: string;
  socialMediaTitle: string;
  twitterUrl: string | null;
  facebookUrl: string | null;
  youtubeUrl: string | null;
  instagramUrl: string | null;
  whatsappUrl: string | null;
  copyrightText: string;
  paymentBannerImage: string;
  isActive: boolean;
  columns: FooterColumn[];
}

/* ==================== API ==================== */

export const footerSettingsApi = createApi({
  reducerPath: "footerSettingsApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["FooterSettings", "FooterColumn", "FooterElement"],

  endpoints: (builder) => ({
    /* ==================== FOOTER SETTINGS ==================== */

    // Get active footer settings (public)
    getFooterSettings: builder.query<ApiResponse<FooterSettings>, void>({
      query: () => "/footer-settings",
      providesTags: ["FooterSettings"],
    }),

    // Get footer settings by ID (admin)
    getFooterSettingsById: builder.query<ApiResponse<FooterSettings>, string>({
      query: (id) => `/footer-settings/${id}`,
      providesTags: ["FooterSettings"],
    }),

    // Create footer settings (admin)
    createFooterSettings: builder.mutation<
      ApiResponse<FooterSettings>,
      CreateFooterSettingsRequest
    >({
      query: (body) => ({
        url: "/footer-settings",
        method: "POST",
        body,
      }),
      invalidatesTags: ["FooterSettings"],
    }),

    // Update active footer settings (admin)
    updateFooterSettings: builder.mutation<
      ApiResponse<FooterSettings>,
      UpdateFooterSettingsRequest
    >({
      query: (body) => ({
        url: "/footer-settings",
        method: "PUT",
        body,
      }),
      invalidatesTags: ["FooterSettings"],
    }),

    // Update footer settings by ID (admin)
    updateFooterSettingsById: builder.mutation<
      ApiResponse<FooterSettings>,
      { id: string; data: UpdateFooterSettingsRequest }
    >({
      query: ({ id, data }) => ({
        url: `/footer-settings/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["FooterSettings"],
    }),

    // Soft delete active footer settings (admin)
    deleteFooterSettings: builder.mutation<SuccessResponse, void>({
      query: () => ({
        url: "/footer-settings",
        method: "DELETE",
      }),
      invalidatesTags: ["FooterSettings"],
    }),

    // Hard delete footer settings by ID (admin)
    deleteFooterSettingsById: builder.mutation<SuccessResponse, string>({
      query: (id) => ({
        url: `/footer-settings/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["FooterSettings"],
    }),

    /* ==================== FOOTER COLUMNS ==================== */

    // Add a new column to footer settings
    addFooterColumn: builder.mutation<
      ApiResponse<FooterColumn>,
      { footerSettingsId: string; data: CreateFooterColumnRequest }
    >({
      query: ({ footerSettingsId, data }) => ({
        url: `/footer-settings/${footerSettingsId}/columns`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["FooterSettings", "FooterColumn"],
    }),

    // Update a footer column
    updateFooterColumn: builder.mutation<
      ApiResponse<FooterColumn>,
      { columnId: string; data: UpdateFooterColumnRequest }
    >({
      query: ({ columnId, data }) => ({
        url: `/footer-settings/columns/${columnId}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["FooterSettings", "FooterColumn"],
    }),

    // Delete a footer column
    deleteFooterColumn: builder.mutation<SuccessResponse, string>({
      query: (columnId) => ({
        url: `/footer-settings/columns/${columnId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["FooterSettings", "FooterColumn"],
    }),

    /* ==================== FOOTER ELEMENTS ==================== */

    // Add a new element to a column
    addFooterElement: builder.mutation<
      ApiResponse<FooterElement>,
      { columnId: string; data: CreateFooterElementRequest }
    >({
      query: ({ columnId, data }) => ({
        url: `/footer-settings/columns/${columnId}/elements`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["FooterSettings", "FooterColumn", "FooterElement"],
    }),

    // Update a footer element
    updateFooterElement: builder.mutation<
      ApiResponse<FooterElement>,
      { elementId: string; data: UpdateFooterElementRequest }
    >({
      query: ({ elementId, data }) => ({
        url: `/footer-settings/elements/${elementId}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["FooterSettings", "FooterColumn", "FooterElement"],
    }),

    // Delete a footer element
    deleteFooterElement: builder.mutation<SuccessResponse, string>({
      query: (elementId) => ({
        url: `/footer-settings/elements/${elementId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["FooterSettings", "FooterColumn", "FooterElement"],
    }),
  }),
});

/* ==================== EXPORT HOOKS ==================== */

export const {
  // Footer Settings Hooks
  useGetFooterSettingsQuery,
  useLazyGetFooterSettingsQuery,
  useGetFooterSettingsByIdQuery,
  useLazyGetFooterSettingsByIdQuery,
  useCreateFooterSettingsMutation,
  useUpdateFooterSettingsMutation,
  useUpdateFooterSettingsByIdMutation,
  useDeleteFooterSettingsMutation,
  useDeleteFooterSettingsByIdMutation,

  // Footer Column Hooks
  useAddFooterColumnMutation,
  useUpdateFooterColumnMutation,
  useDeleteFooterColumnMutation,

  // Footer Element Hooks
  useAddFooterElementMutation,
  useUpdateFooterElementMutation,
  useDeleteFooterElementMutation,
} = footerSettingsApi;