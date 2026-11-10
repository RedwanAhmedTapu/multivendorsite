// @/features/blogApi.ts
//
// RTK Query API for managing blog.finixmart.com.bd content from your
// existing main-site admin panel. Mirrors storeEditorApi.ts's shape
// (createApi, tagTypes, ApiResponse<T> envelope, FormData upload
// mutation) so it drops into the same store without new conventions.
//
// Hits the blog-module routes mounted at /api/blog on your main API
// (see blog-module/README.md) — NOT the blog.finixmart.com.bd frontend,
// which only ever calls the public GET endpoints.

import { createApi } from "@reduxjs/toolkit/query/react";
import baseQueryWithReauth from "./baseQueryWithReauth";

// ─────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────

export enum BlogPostStatus {
  DRAFT     = "DRAFT",
  PUBLISHED = "PUBLISHED",
  SCHEDULED = "SCHEDULED",
  ARCHIVED  = "ARCHIVED",
}

// ─────────────────────────────────────────────
// SHARED TYPES
// ─────────────────────────────────────────────

export interface BlogPostReference {
  id?: string;
  label: string;
  url: string;
  price?: number;
  source?: string;
  sortOrder?: number;
}

export interface BlogCategorySummary {
  id: string;
  name: string;
  slug: string;
  image?: string;
}

export interface BlogAuthorSummary {
  id: string;
  name: string | null;
}

export interface BlogPostCard {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  featuredImage?: string;
  featuredImageAlt?: string;
  readTimeMinutes?: number;
  viewCount: number;
  publishedAt?: string;
  tags: string[];
  category?: BlogCategorySummary;
  author?: BlogAuthorSummary;
  status?: BlogPostStatus;
  createdAt?: string;
}

export interface BlogPostDetail extends BlogPostCard {
  body: string;
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: string;
  canonicalUrl?: string;
  references: BlogPostReference[];
}

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: string | null;
  sortOrder: number;
  isActive: boolean;
  children?: BlogCategory[];
  _count?: { posts: number };
}

export interface BlogNavItem {
  id: string;
  label: string;
  url?: string;
  parentId?: string | null;
  sortOrder: number;
  isVisible: boolean;
  openInNewTab: boolean;
  children?: BlogNavItem[];
}

export interface BlogSiteSettings {
  id: string;
  siteName: string;
  logoUrl?: string;
  faviconUrl?: string;
  tagline?: string;
  primaryColorHex: string;
  backgroundHex: string;
  textColorHex: string;
  defaultOgImage?: string;
  googleAnalyticsId?: string;
}

export interface BlogFooterElement {
  id?: string;
  label: string;
  url: string;
  sortOrder?: number;
  isVisible?: boolean;
  openInNewTab?: boolean;
}

export interface BlogFooterColumn {
  id?: string;
  title: string;
  sortOrder?: number;
  isVisible?: boolean;
  elements: BlogFooterElement[];
}

export interface BlogFooterSettings {
  id: string;
  aboutTitle: string;
  aboutText: string;
  facebookUrl?: string;
  youtubeUrl?: string;
  instagramUrl?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  copyrightText: string;
  columns: BlogFooterColumn[];
}

// ─────────────────────────────────────────────
// REQUEST TYPES
// ─────────────────────────────────────────────

export interface CreateBlogPostRequest {
  title: string;
  body: string;
  excerpt?: string;
  categoryId?: string;
  featuredImage?: string;
  featuredImageAlt?: string;
  tags?: string[];
  status?: BlogPostStatus;
  scheduledAt?: string;
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: string;
  references?: BlogPostReference[];
}

export type UpdateBlogPostRequest = Partial<CreateBlogPostRequest>;

export interface CreateBlogCategoryRequest {
  name: string;
  description?: string;
  image?: string;
  parentId?: string;
  sortOrder?: number;
}

export type UpdateBlogCategoryRequest = Partial<CreateBlogCategoryRequest> & { isActive?: boolean };

export interface UpsertBlogNavItemRequest {
  label: string;
  url?: string;
  parentId?: string | null;
  sortOrder?: number;
  isVisible?: boolean;
  openInNewTab?: boolean;
}

export interface UpdateBlogSiteSettingsRequest {
  siteName?: string;
  logoUrl?: string;
  faviconUrl?: string;
  tagline?: string;
  primaryColorHex?: string;
  backgroundHex?: string;
  textColorHex?: string;
  defaultOgImage?: string;
  googleAnalyticsId?: string;
}

export interface UpsertBlogFooterRequest {
  aboutTitle?: string;
  aboutText: string;
  facebookUrl?: string;
  youtubeUrl?: string;
  instagramUrl?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  copyrightText: string;
  columns: BlogFooterColumn[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface OffsetPage<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface UploadedFile {
  id?: string;
  fileName?: string;
  url: string;
  fileSize?: string | number;
  mimeType?: string;
}

export interface UploadFileResponse {
  success: boolean;
  file: UploadedFile;
  message?: string;
}

// ─────────────────────────────────────────────
// API
// ─────────────────────────────────────────────

const BASE = "blog";

export const blogApi = createApi({
  reducerPath: "blogApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["BlogPost", "BlogCategory", "BlogNavItem", "BlogSiteSettings", "BlogFooter"],
  endpoints: (builder) => ({

    // ── Posts (admin) ──────────────────────

    listBlogPosts: builder.query<
      ApiResponse<OffsetPage<BlogPostCard>>,
      { page?: number; limit?: number; status?: BlogPostStatus; category?: string; authorId?: string } | void
    >({
      query: (params) => {
        const qs = new URLSearchParams(params as Record<string, string>).toString();
        return `${BASE}/admin/posts${qs ? `?${qs}` : ""}`;
      },
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.items.map(({ id }) => ({ type: "BlogPost" as const, id })),
              { type: "BlogPost", id: "LIST" },
            ]
          : [{ type: "BlogPost", id: "LIST" }],
    }),

    getBlogPost: builder.query<ApiResponse<BlogPostDetail>, string>({
      query: (id) => `${BASE}/admin/posts/${id}`,
      providesTags: (_, __, id) => [{ type: "BlogPost", id }],
    }),

    createBlogPost: builder.mutation<ApiResponse<BlogPostDetail>, CreateBlogPostRequest>({
      query: (body) => ({ url: `${BASE}/admin/posts`, method: "POST", body }),
      invalidatesTags: [{ type: "BlogPost", id: "LIST" }],
    }),

    updateBlogPost: builder.mutation<
      ApiResponse<BlogPostDetail>,
      { id: string; data: UpdateBlogPostRequest }
    >({
      query: ({ id, data }) => ({ url: `${BASE}/admin/posts/${id}`, method: "PUT", body: data }),
      invalidatesTags: (_, __, { id }) => [
        { type: "BlogPost", id },
        { type: "BlogPost", id: "LIST" },
      ],
    }),

    deleteBlogPost: builder.mutation<ApiResponse<{ id: string }>, string>({
      query: (id) => ({ url: `${BASE}/admin/posts/${id}`, method: "DELETE" }),
      invalidatesTags: (_, __, id) => [
        { type: "BlogPost", id },
        { type: "BlogPost", id: "LIST" },
      ],
    }),

    restoreBlogPostRevision: builder.mutation<ApiResponse<BlogPostDetail>, string>({
      query: (revisionId) => ({ url: `${BASE}/admin/posts/revisions/${revisionId}/restore`, method: "POST" }),
      invalidatesTags: [{ type: "BlogPost", id: "LIST" }],
    }),

    // ── Categories ──────────────────────────

    listBlogCategories: builder.query<ApiResponse<BlogCategory[]>, void>({
      query: () => `${BASE}/admin/categories`,
      providesTags: (result) =>
        result?.data
          ? [...result.data.map(({ id }) => ({ type: "BlogCategory" as const, id })), { type: "BlogCategory", id: "LIST" }]
          : [{ type: "BlogCategory", id: "LIST" }],
    }),

    createBlogCategory: builder.mutation<ApiResponse<BlogCategory>, CreateBlogCategoryRequest>({
      query: (body) => ({ url: `${BASE}/admin/categories`, method: "POST", body }),
      invalidatesTags: [{ type: "BlogCategory", id: "LIST" }],
    }),

    updateBlogCategory: builder.mutation<
      ApiResponse<BlogCategory>,
      { id: string; data: UpdateBlogCategoryRequest }
    >({
      query: ({ id, data }) => ({ url: `${BASE}/admin/categories/${id}`, method: "PUT", body: data }),
      invalidatesTags: [{ type: "BlogCategory", id: "LIST" }],
    }),

    deleteBlogCategory: builder.mutation<ApiResponse<{ id: string }>, string>({
      query: (id) => ({ url: `${BASE}/admin/categories/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "BlogCategory", id: "LIST" }],
    }),

    // ── Nav menu (two-layer dropdown) ──────

    listBlogNavItems: builder.query<ApiResponse<BlogNavItem[]>, void>({
      query: () => `${BASE}/admin/nav`,
      providesTags: [{ type: "BlogNavItem", id: "LIST" }],
    }),

    createBlogNavItem: builder.mutation<ApiResponse<BlogNavItem>, UpsertBlogNavItemRequest>({
      query: (body) => ({ url: `${BASE}/admin/nav`, method: "POST", body }),
      invalidatesTags: [{ type: "BlogNavItem", id: "LIST" }],
    }),

    updateBlogNavItem: builder.mutation<
      ApiResponse<BlogNavItem>,
      { id: string; data: Partial<UpsertBlogNavItemRequest> }
    >({
      query: ({ id, data }) => ({ url: `${BASE}/admin/nav/${id}`, method: "PUT", body: data }),
      invalidatesTags: [{ type: "BlogNavItem", id: "LIST" }],
    }),

    deleteBlogNavItem: builder.mutation<ApiResponse<{ id: string }>, string>({
      query: (id) => ({ url: `${BASE}/admin/nav/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "BlogNavItem", id: "LIST" }],
    }),

    reorderBlogNavItems: builder.mutation<ApiResponse<{ message: string }>, string[]>({
      query: (orderedIds) => ({ url: `${BASE}/admin/nav-reorder`, method: "PUT", body: { orderedIds } }),
      invalidatesTags: [{ type: "BlogNavItem", id: "LIST" }],
    }),

    // ── Site settings (logo, brand colors) ─

    getBlogSiteSettings: builder.query<ApiResponse<BlogSiteSettings>, void>({
      query: () => `${BASE}/admin/site-settings`,
      providesTags: ["BlogSiteSettings"],
    }),

    updateBlogSiteSettings: builder.mutation<ApiResponse<BlogSiteSettings>, UpdateBlogSiteSettingsRequest>({
      query: (body) => ({ url: `${BASE}/admin/site-settings`, method: "PUT", body }),
      invalidatesTags: ["BlogSiteSettings"],
    }),

    // ── Footer (dynamic, admin/employee managed) ─

    getBlogFooter: builder.query<ApiResponse<BlogFooterSettings>, void>({
      query: () => `${BASE}/admin/footer`,
      providesTags: ["BlogFooter"],
    }),

    upsertBlogFooter: builder.mutation<ApiResponse<BlogFooterSettings>, UpsertBlogFooterRequest>({
      query: (body) => ({ url: `${BASE}/admin/footer`, method: "PUT", body }),
      invalidatesTags: ["BlogFooter"],
    }),

    // ── File upload (featured images, logo) ─

    uploadBlogImage: builder.mutation<UploadFileResponse, FormData>({
      query: (formData) => ({ url: `${BASE}/upload`, method: "POST", body: formData }),
    }),
  }),
});

// ─────────────────────────────────────────────
// EXPORTED HOOKS
// ─────────────────────────────────────────────

export const {
  useListBlogPostsQuery,
  useLazyListBlogPostsQuery,
  useGetBlogPostQuery,
  useLazyGetBlogPostQuery,
  useCreateBlogPostMutation,
  useUpdateBlogPostMutation,
  useDeleteBlogPostMutation,
  useRestoreBlogPostRevisionMutation,

  useListBlogCategoriesQuery,
  useCreateBlogCategoryMutation,
  useUpdateBlogCategoryMutation,
  useDeleteBlogCategoryMutation,

  useListBlogNavItemsQuery,
  useCreateBlogNavItemMutation,
  useUpdateBlogNavItemMutation,
  useDeleteBlogNavItemMutation,
  useReorderBlogNavItemsMutation,

  useGetBlogSiteSettingsQuery,
  useUpdateBlogSiteSettingsMutation,

  useGetBlogFooterQuery,
  useUpsertBlogFooterMutation,

  useUploadBlogImageMutation,
} = blogApi;