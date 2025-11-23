// features/storeEditorApi.ts
import { createApi } from "@reduxjs/toolkit/query/react";
import baseQueryWithReauth from "./baseQueryWithReauth";

// --------- Request Types ---------
export interface CreateStoreLayoutRequest {
  isDefault?: boolean;
  thumbnail?: string;
}

export interface CreateComponentRequest {
  layoutId: string;
  type: ComponentType;
  sortOrder: number;
  config?: ComponentConfigInput;
  productIds?: string[];
  categoryIds?: string[];
}

export interface UpdateComponentRequest {
  sortOrder?: number;
  config?: ComponentConfigInput;
}

export interface UpdateComponentProductsRequest {
  productIds: string[];
}

export interface UpdateComponentCategoriesRequest {
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
}

export interface ComponentConfigInput {
  // Store Banner
  bannerImage?: string;
  bannerBackgroundType?: BackgroundType;
  bannerBackgroundColor?: string;
  showChatButton?: boolean;
  showRating?: boolean;
  showVerifiedBadge?: boolean;
  showFollowers?: boolean;
  showLogo?: boolean;
  showStoreName?: boolean;
  
  // Category Component
  categoryLayout?: CategoryLayout;
  categoriesPerRow?: number;
  showCategoryCount?: boolean;
  categorySlideInterval?: number;
  
  // Product Component
  productsPerRow?: number;
  showProductPrice?: boolean;
  showProductRating?: boolean;
  showAddToCart?: boolean;
  autoSlide?: boolean;
  slideInterval?: number;
  
  // Banner Component
  bannerType?: BannerType;
  bannerLayout?: BannerLayout;
  bannerHeight?: string;
  bannerImages?: Array<{
    url: string;
    link?: string;
    alt?: string;
  }>;
  
  // Countdown Component
  countdownBannerImage?: string;
  countdownEndDate?: string;
  timerPosition?: TimerPosition;
  showDays?: boolean;
  showHours?: boolean;
  showMinutes?: boolean;
  showSeconds?: boolean;
  countdownTitle?: string;
  countdownBackgroundColor?: string;
  
  // Voucher Component
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
  
  // Styling
  customCSS?: string;
  padding?: string;
  margin?: string;
  borderRadius?: string;
  boxShadow?: string;
}

// --------- Response Types ---------
export interface StoreLayout {
  id: string;
  vendorId: string;
  isDefault: boolean;
  thumbnail?: string;
  createdAt: string;
  updatedAt: string;
  components: StoreLayoutComponent[];
  vendor?: VendorInfo;
}

export interface VendorInfo {
  id: string;
  storeName: string;
  avatar?: string;
  verificationStatus: string;
  performance?: {
    avgRating: number;
    totalOrders: number;
  };
  followers: Array<{ id: string; userId: string; followedAt: string }>;
  bannerCustomization?: BannerCustomization;
}

export interface StoreLayoutComponent {
  id: string;
  layoutId: string;
  type: ComponentType;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  config?: ComponentConfig;
  products: ComponentProduct[];
  categories: ComponentCategory[];
}

export interface ComponentConfig {
  id: string;
  componentId: string;
  
  // Store Banner
  bannerImage?: string;
  bannerBackgroundType?: BackgroundType;
  bannerBackgroundColor?: string;
  showChatButton: boolean;
  showRating: boolean;
  showVerifiedBadge: boolean;
  showFollowers: boolean;
  showLogo: boolean;
  showStoreName: boolean;
  
  // Category Component
  categoryLayout?: CategoryLayout;
  categoriesPerRow?: number;
  showCategoryCount: boolean;
  categorySlideInterval?: number;
  
  // Product Component
  productsPerRow?: number;
  showProductPrice: boolean;
  showProductRating: boolean;
  showAddToCart: boolean;
  autoSlide: boolean;
  slideInterval?: number;
  
  // Banner Component
  bannerType?: BannerType;
  bannerLayout?: BannerLayout;
  bannerHeight?: string;
  bannerImages?: any;
  
  // Countdown Component
  countdownBannerImage?: string;
  countdownEndDate?: string;
  timerPosition?: TimerPosition;
  showDays: boolean;
  showHours: boolean;
  showMinutes: boolean;
  showSeconds: boolean;
  countdownTitle?: string;
  countdownBackgroundColor?: string;
  
  // Voucher Component
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
  showVoucherCode: boolean;
  useDefaultDesign: boolean;
  
  // Styling
  customCSS?: string;
  padding?: string;
  margin?: string;
  borderRadius?: string;
  boxShadow?: string;
  
  createdAt: string;
  updatedAt: string;
}

export interface ComponentProduct {
  id: string;
  componentId: string;
  productId: string;
  sortOrder: number;
  isFeatured: boolean;
  createdAt: string;
  product: Product;
}

export interface ComponentCategory {
  id: string;
  componentId: string;
  categoryId: string;
  sortOrder: number;
  isFeatured: boolean;
  createdAt: string;
  category: Category;
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
  vendor?: VendorInfo;
}

export interface LayoutTemplate {
  id: string;
  name: string;
  thumbnail?: string;
  category?: string;
  structure: any;
  isPremium: boolean;
  usageCount: number;
  rating?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  slug: string;
  vendorId: string;
  categoryId: string;
  approvalStatus: ProductApprovalStatus;
  images: ProductImage[];
  variants: ProductVariant[];
  createdAt: string;
  updatedAt: string;
  category: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface ProductImage {
  id: string;
  url: string;
  altText?: string;
  sortOrder?: number;
}

export interface ProductVariant {
  id: string;
  name?: string;
  sku: string;
  price: number;
  stock: number;
  weight?: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
  parent?: Category;
  children?: Category[];
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// --------- Enums ---------
export enum ComponentType {
  STORE_BANNER = "STORE_BANNER",
  CATEGORY_SLIDER = "CATEGORY_SLIDER",
  CATEGORY_GRID = "CATEGORY_GRID",
  BANNER = "BANNER",
  PRODUCT_CAROUSEL = "PRODUCT_CAROUSEL",
  PRODUCT_GRID = "PRODUCT_GRID",
  FEATURED_PRODUCTS = "FEATURED_PRODUCTS",
  COUNTDOWN_TIMER = "COUNTDOWN_TIMER",
  VOUCHER_PROMOTION = "VOUCHER_PROMOTION"
}

export enum BackgroundType {
  SOLID = "SOLID",
  LINEAR_GRADIENT = "LINEAR_GRADIENT",
  RADIAL_GRADIENT = "RADIAL_GRADIENT",
  IMAGE = "IMAGE"
}

export enum CategoryLayout {
  SLIDER = "SLIDER",
  GRID = "GRID",
  LIST = "LIST"
}

export enum BannerType {
  SINGLE_BANNER = "SINGLE_BANNER",
  DOUBLE_BANNER = "DOUBLE_BANNER",
  THREE_BANNER = "THREE_BANNER",
  FOUR_BANNER = "FOUR_BANNER",
  FIVE_BANNER = "FIVE_BANNER",
  SLIDER_BANNER = "SLIDER_BANNER",
  SLIDER_WITH_LEFT_BANNER = "SLIDER_WITH_LEFT_BANNER"
}

export enum BannerLayout {
  HORIZONTAL = "HORIZONTAL",
  VERTICAL = "VERTICAL",
  GRID = "GRID",
  MASONRY = "MASONRY"
}

export enum TimerPosition {
  TOP_LEFT = "TOP_LEFT",
  TOP_RIGHT = "TOP_RIGHT",
  TOP_CENTER = "TOP_CENTER",
  BOTTOM_LEFT = "BOTTOM_LEFT",
  BOTTOM_RIGHT = "BOTTOM_RIGHT",
  BOTTOM_CENTER = "BOTTOM_CENTER",
  CENTER = "CENTER",
  OVERLAY_TOP = "OVERLAY_TOP",
  OVERLAY_BOTTOM = "OVERLAY_BOTTOM"
}

export enum ProductApprovalStatus {
  PENDING = "PENDING",
  ACTIVE = "ACTIVE",
  REJECTED = "REJECTED"
}

// --------- Store Editor API ---------
export const storeEditorApi = createApi({
  reducerPath: "storeEditorApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    "StoreLayout",
    "StoreLayoutComponent",
    "BannerCustomization",
    "LayoutTemplate"
  ],
  endpoints: (builder) => ({
    // ========== Store Layout Endpoints ==========
    
    // Get all vendor layouts
    getVendorLayouts: builder.query<ApiResponse<StoreLayout[]>, void>({
      query: () => "/store-editor/layouts",
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ id }) => ({
                type: "StoreLayout" as const,
                id,
              })),
              "StoreLayout",
            ]
          : ["StoreLayout"],
    }),

    // Get specific layout by ID
    getStoreLayout: builder.query<ApiResponse<StoreLayout>, string>({
      query: (layoutId) => `/store-editor/layouts/${layoutId}`,
      providesTags: (result, error, id) => [{ type: "StoreLayout", id }],
    }),

    // Create new layout
    createStoreLayout: builder.mutation<ApiResponse<StoreLayout>, CreateStoreLayoutRequest>({
      query: (body) => ({
        url: "/store-editor/layouts",
        method: "POST",
        body,
      }),
      invalidatesTags: ["StoreLayout"],
    }),

    // Set default layout
    setDefaultLayout: builder.mutation<ApiResponse<StoreLayout>, string>({
      query: (layoutId) => ({
        url: "/store-editor/layouts/default",
        method: "PUT",
        body: { layoutId },
      }),
      invalidatesTags: ["StoreLayout"],
    }),

    // Delete layout
    deleteStoreLayout: builder.mutation<ApiResponse<null>, string>({
      query: (layoutId) => ({
        url: `/store-editor/layouts/${layoutId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["StoreLayout"],
    }),

    // ========== Component Endpoints ==========

    // Add component to layout
    addComponent: builder.mutation<ApiResponse<StoreLayoutComponent>, CreateComponentRequest>({
      query: (body) => ({
        url: "/store-editor/components",
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { layoutId }) => [
        { type: "StoreLayout", id: layoutId },
        "StoreLayoutComponent",
      ],
    }),

    // Update component
    updateComponent: builder.mutation<
      ApiResponse<StoreLayoutComponent>,
      { componentId: string; data: UpdateComponentRequest }
    >({
      query: ({ componentId, data }) => ({
        url: `/store-editor/components/${componentId}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { componentId }) => [
        { type: "StoreLayoutComponent", id: componentId },
        "StoreLayout",
      ],
    }),

    // Delete component
    deleteComponent: builder.mutation<ApiResponse<null>, string>({
      query: (componentId) => ({
        url: `/store-editor/components/${componentId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["StoreLayoutComponent", "StoreLayout"],
    }),

    // Update component products
    updateComponentProducts: builder.mutation<
      ApiResponse<StoreLayoutComponent>,
      { componentId: string; data: UpdateComponentProductsRequest }
    >({
      query: ({ componentId, data }) => ({
        url: `/store-editor/components/${componentId}/products`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { componentId }) => [
        { type: "StoreLayoutComponent", id: componentId },
        "StoreLayout",
      ],
    }),

    // Update component categories
    updateComponentCategories: builder.mutation<
      ApiResponse<StoreLayoutComponent>,
      { componentId: string; data: UpdateComponentCategoriesRequest }
    >({
      query: ({ componentId, data }) => ({
        url: `/store-editor/components/${componentId}/categories`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { componentId }) => [
        { type: "StoreLayoutComponent", id: componentId },
        "StoreLayout",
      ],
    }),

    // ========== Banner Customization Endpoints ==========

    // Get banner customization
    getBannerCustomization: builder.query<ApiResponse<BannerCustomization>, void>({
      query: () => "/store-editor/banner-customization",
      providesTags: ["BannerCustomization"],
    }),

    // Update banner customization
    updateBannerCustomization: builder.mutation<
      ApiResponse<BannerCustomization>,
      UpdateBannerCustomizationRequest
    >({
      query: (body) => ({
        url: "/store-editor/banner-customization",
        method: "PUT",
        body,
      }),
      invalidatesTags: ["BannerCustomization"],
    }),

    // ========== Template Endpoints ==========

    // Get layout templates
    getLayoutTemplates: builder.query<
      ApiResponse<LayoutTemplate[]>,
      { category?: string } | void
    >({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params?.category) {
          searchParams.append("category", params.category);
        }
        return `/store-editor/templates${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
      },
      providesTags: ["LayoutTemplate"],
    }),

    // Apply template
    applyTemplate: builder.mutation<ApiResponse<StoreLayout>, ApplyTemplateRequest>({
      query: (body) => ({
        url: "/store-editor/templates/apply",
        method: "POST",
        body,
      }),
      invalidatesTags: ["StoreLayout"],
    }),


  }),
});

// ========== Export Hooks ==========
export const {
  // Store Layout Hooks
  useGetVendorLayoutsQuery,
  useLazyGetVendorLayoutsQuery,
  useGetStoreLayoutQuery,
  useLazyGetStoreLayoutQuery,
  useCreateStoreLayoutMutation,
  useSetDefaultLayoutMutation,
  useDeleteStoreLayoutMutation,

  // Component Hooks
  useAddComponentMutation,
  useUpdateComponentMutation,
  useDeleteComponentMutation,
  useUpdateComponentProductsMutation,
  useUpdateComponentCategoriesMutation,

  // Banner Customization Hooks
  useGetBannerCustomizationQuery,
  useLazyGetBannerCustomizationQuery,
  useUpdateBannerCustomizationMutation,

  // Template Hooks
  useGetLayoutTemplatesQuery,
  useLazyGetLayoutTemplatesQuery,
  useApplyTemplateMutation,
} = storeEditorApi;