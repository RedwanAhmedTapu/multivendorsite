// features/themeApi.ts
import { createApi } from "@reduxjs/toolkit/query/react";
import baseQueryWithReauth from "./baseQueryWithReauth";

// --------- Types ---------
export type LayoutType = 'layout_1' | 'layout_2' | 'layout_3';
export type ThemeStatus = 'active' | 'inactive';

export interface Theme {
  id: string;
  name: string;
  layoutType: LayoutType;
  status: ThemeStatus;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateThemeRequest {
  name: string;
  layoutType: LayoutType;
  description?: string;
}

export interface LayoutOption {
  value: LayoutType;
  label: string;
  description?: string;
}

export interface ThemeResponse {
  success: boolean;
  data: Theme;
  message?: string;
}

export interface ThemesResponse {
  success: boolean;
  data: Theme[];
  message?: string;
}

export interface LayoutOptionsResponse {
  success: boolean;
  data: LayoutOption[];
  message?: string;
}

// --------- Theme API ---------
export const themeApi = createApi({
  reducerPath: "themeApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Theme"],
  endpoints: (builder) => ({
    // Get all themes
    // GET /api/themes
    getAllThemes: builder.query<ThemesResponse, void>({
      query: () => ({
        url: "/themes",
        method: "GET",
      }),
      providesTags: ["Theme"],
    }),

    // Get active theme
    // GET /api/themes/active
    getActiveTheme: builder.query<ThemeResponse, void>({
      query: () => ({
        url: "/themes/active",
        method: "GET",
      }),
      providesTags: ["Theme"],
    }),

    // Get theme by layout type
    // GET /api/themes/layout/:layoutType
    getThemeByLayoutType: builder.query<ThemeResponse, LayoutType>({
      query: (layoutType) => ({
        url: `/themes/layout/${layoutType}`,
        method: "GET",
      }),
      providesTags: (result, error, layoutType) => [
        { type: "Theme", id: layoutType },
      ],
    }),

    // Get layout options
    // GET /api/themes/layout-options
    getLayoutOptions: builder.query<LayoutOptionsResponse, void>({
      query: () => ({
        url: "/themes/layout-options",
        method: "GET",
      }),
    }),

    // Create a new theme
    // POST /api/themes
    createTheme: builder.mutation<ThemeResponse, CreateThemeRequest>({
      query: (body) => ({
        url: "/themes",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Theme"],
    }),

    // Activate theme (deactivates all others)
    // POST /api/themes/:layoutType/activate
    activateTheme: builder.mutation<ThemeResponse, LayoutType>({
      query: (layoutType) => ({
        url: `/themes/${layoutType}/activate`,
        method: "POST",
      }),
      invalidatesTags: ["Theme"],
    }),

    // Deactivate theme
    // POST /api/themes/:layoutType/deactivate
    deactivateTheme: builder.mutation<ThemeResponse, LayoutType>({
      query: (layoutType) => ({
        url: `/themes/${layoutType}/deactivate`,
        method: "POST",
      }),
      invalidatesTags: ["Theme"],
    }),

    // Toggle theme status
    // POST /api/themes/:layoutType/toggle
    toggleThemeStatus: builder.mutation<ThemeResponse, LayoutType>({
      query: (layoutType) => ({
        url: `/themes/${layoutType}/toggle`,
        method: "POST",
      }),
      invalidatesTags: ["Theme"],
    }),

    // Initialize themes (for admin)
    // POST /api/themes/initialize
    initializeThemes: builder.mutation<ThemesResponse, void>({
      query: () => ({
        url: "/themes/initialize",
        method: "POST",
      }),
      invalidatesTags: ["Theme"],
    }),
  }),
});

// --------- Export Hooks ---------
export const {
  useGetAllThemesQuery,
  useGetActiveThemeQuery,
  useGetThemeByLayoutTypeQuery,
  useGetLayoutOptionsQuery,
  useCreateThemeMutation,
  useActivateThemeMutation,
  useDeactivateThemeMutation,
  useToggleThemeStatusMutation,
  useInitializeThemesMutation,
} = themeApi;