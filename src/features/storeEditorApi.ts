// @/features/storeEditorApi.ts
//
// CHANGES FROM ORIGINAL:
//   1. Added `uploadStoreImage` mutation — posts a FormData file to the
//      existing R2 upload route (POST /vendor-storage/upload) and returns
//      the real, persistent URL. This replaces the old fake
//      `URL.createObjectURL(file)` flow in ConfigurationForm's
//      ImageUploadSlot, which never uploaded anything.
//   2. Exported `useUploadStoreImageMutation` hook alongside the existing
//      hooks.
//
// Nothing else changed — all existing endpoints/types are untouched, so
// this is a drop-in replacement for the current file.

import { createApi } from "@reduxjs/toolkit/query/react";
import baseQueryWithReauth from "./baseQueryWithReauth";

// ─────────────────────────────────────────────
// ENUMS  (mirror Prisma schema exactly)
// ─────────────────────────────────────────────

export enum DecorationStatus {
  DRAFT     = "DRAFT",
  PUBLISHED = "PUBLISHED",
  ARCHIVED  = "ARCHIVED",
  SCHEDULED = "SCHEDULED",
}

export enum ComponentType {
  STORE_BANNER       = "STORE_BANNER",
  CATEGORY_SLIDER    = "CATEGORY_SLIDER",
  CATEGORY_GRID      = "CATEGORY_GRID",
  BANNER             = "BANNER",
  PRODUCT_CAROUSEL   = "PRODUCT_CAROUSEL",
  PRODUCT_GRID       = "PRODUCT_GRID",
  FEATURED_PRODUCTS  = "FEATURED_PRODUCTS",
  COUNTDOWN_TIMER    = "COUNTDOWN_TIMER",
  VOUCHER_PROMOTION  = "VOUCHER_PROMOTION",
}

export enum BackgroundType {
  SOLID            = "SOLID",
  LINEAR_GRADIENT  = "LINEAR_GRADIENT",
  RADIAL_GRADIENT  = "RADIAL_GRADIENT",
  IMAGE            = "IMAGE",
}

export enum CategoryLayout {
  SLIDER = "SLIDER",
  GRID   = "GRID",
  LIST   = "LIST",
}

export enum BannerType {
  SINGLE_BANNER          = "SINGLE_BANNER",
  DOUBLE_BANNER          = "DOUBLE_BANNER",
  THREE_BANNER           = "THREE_BANNER",
  FOUR_BANNER            = "FOUR_BANNER",
  FIVE_BANNER            = "FIVE_BANNER",
  SLIDER_BANNER          = "SLIDER_BANNER",
  SLIDER_WITH_LEFT_BANNER = "SLIDER_WITH_LEFT_BANNER",
}

export enum BannerLayout {
  HORIZONTAL = "HORIZONTAL",
  VERTICAL   = "VERTICAL",
  GRID       = "GRID",
  MASONRY    = "MASONRY",
}

export enum TimerPosition {
  TOP_LEFT      = "TOP_LEFT",
  TOP_RIGHT     = "TOP_RIGHT",
  TOP_CENTER    = "TOP_CENTER",
  BOTTOM_LEFT   = "BOTTOM_LEFT",
  BOTTOM_RIGHT  = "BOTTOM_RIGHT",
  BOTTOM_CENTER = "BOTTOM_CENTER",
  CENTER        = "CENTER",
  OVERLAY_TOP   = "OVERLAY_TOP",
  OVERLAY_BOTTOM = "OVERLAY_BOTTOM",
}

// ─────────────────────────────────────────────
// SHARED / NESTED TYPES
// ─────────────────────────────────────────────

export interface BannerImage {
  url: string;
  link?: string;
  alt?: string;
}

export interface ComponentConfigInput {
  bannerImage?: string;
  bannerBackgroundType?: BackgroundType;
  bannerBackgroundColor?: string;
  categoryLayout?: CategoryLayout;
  productsPerRow?: number;
  categoriesPerRow?: number;
  autoSlide?: boolean;
  slideInterval?: number;
  countdownEndDate?: string;
  showProductPrice?: boolean;
  showProductRating?: boolean;
  showAddToCart?: boolean;
  showCategoryCount?: boolean;
  customCSS?: string;
  padding?: string;
  margin?: string;
  borderRadius?: string;
  boxShadow?: string;
  settings?: {
    bannerType?: BannerType;
    bannerLayout?: BannerLayout;
    bannerHeight?: string;
    bannerImages?: BannerImage[];
    countdownBannerImage?: string;
    timerPosition?: TimerPosition;
    showDays?: boolean;
    showHours?: boolean;
    showMinutes?: boolean;
    showSeconds?: boolean;
    countdownTitle?: string;
    countdownBackgroundColor?: string;
    voucherBannerImage?: string;
    voucherCode?: string;
    voucherTitle?: string;
    voucherDescription?: string;
    voucherBackgroundColor?: string;
    voucherTextColor?: string;
    minOrderAmount?: number;
    discountAmount?: number;
    discountPercentage?: number;
    voucherValidFrom?: string;
    voucherValidTo?: string;
    showVoucherCode?: boolean;
    useDefaultDesign?: boolean;
    showChatButton?: boolean;
    showRating?: boolean;
    showVerifiedBadge?: boolean;
    showFollowers?: boolean;
    showLogo?: boolean;
    showStoreName?: boolean;
    [key: string]: unknown;
  };
}

// ─────────────────────────────────────────────
// REQUEST TYPES
// ─────────────────────────────────────────────

export interface CreateDecorationRequest {
  name: string;
  thumbnail?: string;
  isDefault?: boolean;
}

export interface UpdateDecorationRequest {
  name?: string;
  thumbnail?: string;
  status?: DecorationStatus;
  publishedAt?: string;
}

export interface DuplicateDecorationRequest {
  name: string;
}

export interface CreateComponentRequest {
  type: ComponentType;
  sortOrder: number;
  isVisible?: boolean;
  config?: ComponentConfigInput;
  productIds?: string[];
  categoryIds?: string[];
}

export interface UpdateComponentRequest {
  sortOrder?: number;
  isVisible?: boolean;
  config?: ComponentConfigInput;
}

export interface ReorderComponentsRequest {
  orderedIds: string[];
}

export interface SetComponentProductsRequest {
  productIds: string[];
}

export interface SetComponentCategoriesRequest {
  categoryIds: string[];
}

export interface UpdateBannerCustomizationRequest {
  bannerImage?: string;
  bannerBackgroundType?: BackgroundType;
  bannerBackgroundValue?: string;
  showChatButton?: boolean;
  showRating?: boolean;
  showVerifiedBadge?: boolean;
  showFollowers?: boolean;
  chatButtonColor?: string;
  storeNameColor?: string;
  textColor?: string;
}

export interface ApplyTemplateRequest {
  templateId: string;
  name?: string;
}

// ─────────────────────────────────────────────
// RESPONSE TYPES
// ─────────────────────────────────────────────

export interface ProductSummary {
  id: string;
  name: string;
  slug: string;
  images: { url: string }[];
  variants: { price: number; specialPrice?: number; sku: string }[];
}

export interface CategorySummary {
  id: string;
  name: string;
  slug: string;
  image?: string;
}

export interface DecorationComponentProduct {
  id: string;
  componentId: string;
  productId: string;
  sortOrder: number;
  isFeatured: boolean;
  createdAt: string;
  product: ProductSummary;
}

export interface DecorationComponentCategory {
  id: string;
  componentId: string;
  categoryId: string;
  sortOrder: number;
  isFeatured: boolean;
  createdAt: string;
  category: CategorySummary;
}

export interface DecorationComponentConfig {
  id: string;
  componentId: string;
  bannerImage?: string;
  bannerBackgroundType?: BackgroundType;
  bannerBackgroundColor?: string;
  categoryLayout?: CategoryLayout;
  productsPerRow?: number;
  categoriesPerRow?: number;
  autoSlide: boolean;
  slideInterval?: number;
  countdownEndDate?: string;
  showProductPrice: boolean;
  showProductRating: boolean;
  showAddToCart: boolean;
  showCategoryCount: boolean;
  customCSS?: string;
  padding?: string;
  margin?: string;
  borderRadius?: string;
  boxShadow?: string;
  settings?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface DecorationComponent {
  id: string;
  decorationId: string;
  type: ComponentType;
  sortOrder: number;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
  config?: DecorationComponentConfig;
  products: DecorationComponentProduct[];
  categories: DecorationComponentCategory[];
}

export interface StoreDecoration {
  id: string;
  vendorId: string;
  name: string;
  slug: string;
  status: DecorationStatus;
  isDefault: boolean;
  thumbnail?: string;
  version: number;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  components: DecorationComponent[];
}

export interface StoreDecorationSummary {
  id: string;
  vendorId: string;
  name: string;
  slug: string;
  status: DecorationStatus;
  isDefault: boolean;
  thumbnail?: string;
  version: number;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  _count: { components: number };
}

export interface BannerCustomization {
  id: string;
  vendorId: string;
  bannerImage?: string;
  bannerBackgroundType: BackgroundType;
  bannerBackgroundValue?: string;
  showChatButton: boolean;
  showRating: boolean;
  showVerifiedBadge: boolean;
  showFollowers: boolean;
  chatButtonColor: string;
  storeNameColor: string;
  textColor: string;
  createdAt: string;
  updatedAt: string;
}

export interface LayoutTemplate {
  id: string;
  name: string;
  thumbnail?: string;
  category?: string;
  isPremium: boolean;
  usageCount: number;
  rating?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// NEW: actual shape returned by POST /vendor-storage/upload —
// note it's `file`, not `data`, and `file.url` is the raw R2 KEY
// (e.g. "vendors/xxx/productimages/....jpg"), not a full https:// URL.
export interface UploadedFile {
  id?:       string;
  fileName?: string;
  url:       string;   // R2 key/path — needs a public-domain prefix to be a usable <img src>
  fileSize?: string | number;
  mimeType?: string;
  folderId?: string | null;
}

export interface UploadFileResponse {
  success: boolean;
  file: UploadedFile;
  message?: string;
}

// ─────────────────────────────────────────────
// API
// ─────────────────────────────────────────────

const BASE = "store-decoration";

export const storeDecorationApi = createApi({
  reducerPath: "storeDecorationApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    "Decoration",
    "DecorationComponent",
    "BannerCustomization",
    "LayoutTemplate",
  ],
  endpoints: (builder) => ({

    // ── Decoration CRUD ──────────────────────

    listDecorations: builder.query<ApiResponse<StoreDecorationSummary[]>, void>({
      query: () => BASE,
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ id }) => ({ type: "Decoration" as const, id })),
              { type: "Decoration", id: "LIST" },
            ]
          : [{ type: "Decoration", id: "LIST" }],
    }),

    getDecoration: builder.query<ApiResponse<StoreDecoration>, string>({
      query: (id) => `${BASE}/${id}`,
      providesTags: (_, __, id) => [{ type: "Decoration", id }],
    }),

    getStorefront: builder.query<ApiResponse<StoreDecoration>, string>({
      query: (vendorId) => `${BASE}/storefront/${vendorId}`,
      providesTags: (_, __, vendorId) => [{ type: "Decoration", id: `storefront-${vendorId}` }],
    }),

    createDecoration: builder.mutation<ApiResponse<StoreDecorationSummary>, CreateDecorationRequest>({
      query: (body) => ({ url: BASE, method: "POST", body }),
      invalidatesTags: [{ type: "Decoration", id: "LIST" }],
    }),

    updateDecoration: builder.mutation<
      ApiResponse<StoreDecorationSummary>,
      { id: string; data: UpdateDecorationRequest }
    >({
      query: ({ id, data }) => ({ url: `${BASE}/${id}`, method: "PATCH", body: data }),
      invalidatesTags: (_, __, { id }) => [
        { type: "Decoration", id },
        { type: "Decoration", id: "LIST" },
      ],
    }),

    deleteDecoration: builder.mutation<ApiResponse<{ message: string }>, string>({
      query: (id) => ({ url: `${BASE}/${id}`, method: "DELETE" }),
      invalidatesTags: (_, __, id) => [
        { type: "Decoration", id },
        { type: "Decoration", id: "LIST" },
      ],
    }),

    publishDecoration: builder.mutation<ApiResponse<StoreDecorationSummary>, string>({
      query: (id) => ({ url: `${BASE}/${id}/publish`, method: "POST" }),
      invalidatesTags: (_, __, id) => [
        { type: "Decoration", id },
        { type: "Decoration", id: "LIST" },
      ],
    }),

    archiveDecoration: builder.mutation<ApiResponse<StoreDecorationSummary>, string>({
      query: (id) => ({ url: `${BASE}/${id}/archive`, method: "POST" }),
      invalidatesTags: (_, __, id) => [
        { type: "Decoration", id },
        { type: "Decoration", id: "LIST" },
      ],
    }),

    duplicateDecoration: builder.mutation<
      ApiResponse<StoreDecorationSummary>,
      { id: string; data: DuplicateDecorationRequest }
    >({
      query: ({ id, data }) => ({ url: `${BASE}/${id}/duplicate`, method: "POST", body: data }),
      invalidatesTags: [{ type: "Decoration", id: "LIST" }],
    }),

    // ── Component mutations ──────────────────

    addComponent: builder.mutation<
      ApiResponse<DecorationComponent>,
      { decorationId: string; data: CreateComponentRequest }
    >({
      query: ({ decorationId, data }) => ({
        url: `${BASE}/${decorationId}/components`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (_, __, { decorationId }) => [
        { type: "Decoration", id: decorationId },
      ],
    }),

    updateComponent: builder.mutation<
      ApiResponse<DecorationComponent>,
      { decorationId: string; componentId: string; data: UpdateComponentRequest }
    >({
      query: ({ decorationId, componentId, data }) => ({
        url: `${BASE}/${decorationId}/components/${componentId}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (_, __, { decorationId }) => [
        { type: "Decoration", id: decorationId },
      ],
    }),

    deleteComponent: builder.mutation<
      ApiResponse<{ message: string }>,
      { decorationId: string; componentId: string }
    >({
      query: ({ decorationId, componentId }) => ({
        url: `${BASE}/${decorationId}/components/${componentId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_, __, { decorationId }) => [
        { type: "Decoration", id: decorationId },
      ],
    }),

    reorderComponents: builder.mutation<
      ApiResponse<{ message: string }>,
      { decorationId: string; orderedIds: string[] }
    >({
      query: ({ decorationId, orderedIds }) => ({
        url: `${BASE}/${decorationId}/components/reorder`,
        method: "PUT",
        body: { orderedIds },
      }),
      invalidatesTags: (_, __, { decorationId }) => [
        { type: "Decoration", id: decorationId },
      ],
    }),

    // Sets the FULL product list for a component (replace semantics) —
    // used by the new product picker in ConfigurationForm.
    setComponentProducts: builder.mutation<
      ApiResponse<DecorationComponent>,
      { decorationId: string; componentId: string; productIds: string[] }
    >({
      query: ({ decorationId, componentId, productIds }) => ({
        url: `${BASE}/${decorationId}/components/${componentId}/products`,
        method: "PUT",
        body: { productIds },
      }),
      invalidatesTags: (_, __, { decorationId }) => [
        { type: "Decoration", id: decorationId },
      ],
    }),

    setComponentCategories: builder.mutation<
      ApiResponse<DecorationComponent>,
      { decorationId: string; componentId: string; categoryIds: string[] }
    >({
      query: ({ decorationId, componentId, categoryIds }) => ({
        url: `${BASE}/${decorationId}/components/${componentId}/categories`,
        method: "PUT",
        body: { categoryIds },
      }),
      invalidatesTags: (_, __, { decorationId }) => [
        { type: "Decoration", id: decorationId },
      ],
    }),

    // ── Banner Customization ─────────────────

    getBannerCustomization: builder.query<ApiResponse<BannerCustomization | null>, void>({
      query: () => `${BASE}/banner-customization`,
      providesTags: ["BannerCustomization"],
    }),

    upsertBannerCustomization: builder.mutation<
      ApiResponse<BannerCustomization>,
      UpdateBannerCustomizationRequest
    >({
      query: (body) => ({
        url: `${BASE}/banner-customization`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["BannerCustomization"],
    }),

    // ── Templates ───────────────────────────

    getLayoutTemplates: builder.query<
      ApiResponse<LayoutTemplate[]>,
      { category?: string } | void
    >({
      query: (params) => {
        const qs = params?.category ? `?category=${params.category}` : "";
        return `${BASE}/templates${qs}`;
      },
      providesTags: ["LayoutTemplate"],
    }),

    applyTemplate: builder.mutation<ApiResponse<StoreDecoration>, ApplyTemplateRequest>({
      query: (body) => ({
        url: `${BASE}/templates/apply`,
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Decoration", id: "LIST" }],
    }),

    // ── NEW: file upload (real R2 upload, replaces blob: URLs) ─────────
    // Hits the existing vendor-storage route: router.post("/upload", ...)
    // which is wired to imageUpload("product","VENDOR") + uploadToR2().
    // Pass a FormData with a single "file" field.
    // Response is { success, file: { url, ... } } — see UploadFileResponse.
    uploadStoreImage: builder.mutation<UploadFileResponse, FormData>({
      query: (formData) => ({
        url: "vendor-storage/upload",
        method: "POST",
        body: formData,
      }),
    }),
  }),
});

// ─────────────────────────────────────────────
// EXPORTED HOOKS
// ─────────────────────────────────────────────

export const {
  useListDecorationsQuery,
  useLazyListDecorationsQuery,
  useGetDecorationQuery,
  useLazyGetDecorationQuery,
  useGetStorefrontQuery,
  useLazyGetStorefrontQuery,

  useCreateDecorationMutation,
  useUpdateDecorationMutation,
  useDeleteDecorationMutation,
  usePublishDecorationMutation,
  useArchiveDecorationMutation,
  useDuplicateDecorationMutation,

  useAddComponentMutation,
  useUpdateComponentMutation,
  useDeleteComponentMutation,
  useReorderComponentsMutation,
  useSetComponentProductsMutation,
  useSetComponentCategoriesMutation,

  useGetBannerCustomizationQuery,
  useLazyGetBannerCustomizationQuery,
  useUpsertBannerCustomizationMutation,

  useGetLayoutTemplatesQuery,
  useLazyGetLayoutTemplatesQuery,
  useApplyTemplateMutation,

  // NEW
  useUploadStoreImageMutation,
} = storeDecorationApi;