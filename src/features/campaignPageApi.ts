import { createApi } from "@reduxjs/toolkit/query/react";
import baseQueryWithReauth from "./baseQueryWithReauth";

/* ==================== TYPES ==================== */

export type ComponentType =
  | "STORE_BANNER"
  | "CATEGORY_SLIDER"
  | "CATEGORY_GRID"
  | "BANNER"
  | "PRODUCT_CAROUSEL"
  | "PRODUCT_GRID"
  | "FEATURED_PRODUCTS"
  | "COUNTDOWN_TIMER"
  | "VOUCHER_PROMOTION";

export type CampaignStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED" | "SCHEDULED";

export interface CampaignComponentConfig {
  id?: string;
  title?: string | null;
  bannerImage?: string | null;
  bannerLink?: string | null;
  bannerBackgroundType?: "SOLID" | "LINEAR_GRADIENT" | "RADIAL_GRADIENT" | "IMAGE" | null;
  bannerBackgroundColor?: string | null;
  productsPerRow?: number | null;
  countdownEndDate?: string | null;
  showProductPrice?: boolean;
  showProductRating?: boolean;
  settings?: Record<string, unknown> | null;
}

export interface CampaignComponentProductRef {
  id: string;
  sortOrder: number;
  isFeatured: boolean;
  product: {
    id: string;
    name: string;
    slug: string;
    images: { url: string }[];
    variants: { price: number; specialPrice: number | null; sku: string; stock?: number }[];
  };
}

export interface CampaignComponent {
  id: string;
  campaignPageId: string;
  type: ComponentType;
  sortOrder: number;
  isVisible: boolean;
  config: CampaignComponentConfig | null;
  products: CampaignComponentProductRef[];
}

export interface CampaignPage {
  id: string;
  title: string;
  slug: string;
  status: CampaignStatus;
  heroImage?: string | null;
  heroTitle?: string | null;
  heroSubtitle?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  createdAt: string;
  updatedAt: string;
  components?: CampaignComponent[];
  _count?: { components: number };
}

export interface CreateCampaignRequest {
  title: string;
  heroImage?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * PUT /api/campaigns/:id — the body is applied as-is, so send only these
 * fields. `null` clears an optional field; an omitted field is unchanged.
 * Dates are full ISO-8601 datetimes. The slug never changes after creation.
 */
export interface UpdateCampaignRequest {
  id: string;
  title?: string;
  heroImage?: string | null;
  heroTitle?: string | null;
  heroSubtitle?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  status?: CampaignStatus;
}

export interface AddComponentRequest {
  campaignId: string;
  type: ComponentType;
  sortOrder: number;
  isVisible?: boolean;
  config?: CampaignComponentConfig;
  productIds?: string[];
}

export interface UpdateComponentRequest {
  componentId: string;
  isVisible?: boolean;
  config?: CampaignComponentConfig;
}

interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
}

export const campaignPageApi = createApi({
  reducerPath: "campaignPageApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["CampaignPage", "PublicCampaignPage"],
  endpoints: (builder) => ({
    // ── Admin: CRUD ──────────────────────────────

    listCampaigns: builder.query<CampaignPage[], void>({
      query: () => "/campaigns",
      transformResponse: (res: ApiEnvelope<CampaignPage[]>) => res.data,
      providesTags: ["CampaignPage"],
    }),

    getCampaignById: builder.query<CampaignPage, string>({
      query: (id) => `/campaigns/${id}`,
      transformResponse: (res: ApiEnvelope<CampaignPage>) => res.data,
      providesTags: (_r, _e, id) => [{ type: "CampaignPage", id }],
    }),

    createCampaign: builder.mutation<CampaignPage, CreateCampaignRequest>({
      query: (body) => ({ url: "/campaigns", method: "POST", body }),
      transformResponse: (res: ApiEnvelope<CampaignPage>) => res.data,
      invalidatesTags: ["CampaignPage"],
    }),

    updateCampaign: builder.mutation<CampaignPage, UpdateCampaignRequest>({
      query: ({ id, ...body }) => ({ url: `/campaigns/${id}`, method: "PUT", body }),
      transformResponse: (res: ApiEnvelope<CampaignPage>) => res.data,
      invalidatesTags: (_r, _e, { id }) => [{ type: "CampaignPage", id }, "CampaignPage"],
    }),

    publishCampaign: builder.mutation<CampaignPage, string>({
      query: (id) => ({ url: `/campaigns/${id}/publish`, method: "POST" }),
      transformResponse: (res: ApiEnvelope<CampaignPage>) => res.data,
      invalidatesTags: (_r, _e, id) => [{ type: "CampaignPage", id }, "CampaignPage"],
    }),

    unpublishCampaign: builder.mutation<CampaignPage, string>({
      query: (id) => ({ url: `/campaigns/${id}/unpublish`, method: "POST" }),
      transformResponse: (res: ApiEnvelope<CampaignPage>) => res.data,
      invalidatesTags: (_r, _e, id) => [{ type: "CampaignPage", id }, "CampaignPage"],
    }),

    deleteCampaign: builder.mutation<void, string>({
      query: (id) => ({ url: `/campaigns/${id}`, method: "DELETE" }),
      invalidatesTags: ["CampaignPage"],
    }),

    // ── Admin: components ────────────────────────

    addComponent: builder.mutation<CampaignComponent, AddComponentRequest>({
      query: ({ campaignId, ...body }) => ({
        url: `/campaigns/${campaignId}/components`,
        method: "POST",
        body,
      }),
      transformResponse: (res: ApiEnvelope<CampaignComponent>) => res.data,
      invalidatesTags: (_r, _e, { campaignId }) => [{ type: "CampaignPage", id: campaignId }],
    }),

    updateComponent: builder.mutation<CampaignComponent, UpdateComponentRequest & { campaignId: string }>({
      query: ({ componentId, campaignId, ...body }) => ({
        url: `/campaigns/components/${componentId}`,
        method: "PUT",
        body,
      }),
      transformResponse: (res: ApiEnvelope<CampaignComponent>) => res.data,
      invalidatesTags: (_r, _e, { campaignId }) => [{ type: "CampaignPage", id: campaignId }],
    }),

    deleteComponent: builder.mutation<void, { componentId: string; campaignId: string }>({
      query: ({ componentId }) => ({ url: `/campaigns/components/${componentId}`, method: "DELETE" }),
      invalidatesTags: (_r, _e, { campaignId }) => [{ type: "CampaignPage", id: campaignId }],
    }),

    reorderComponents: builder.mutation<void, { campaignId: string; orderedIds: string[] }>({
      query: ({ campaignId, orderedIds }) => ({
        url: `/campaigns/${campaignId}/components/reorder`,
        method: "PUT",
        body: { orderedIds },
      }),
      invalidatesTags: (_r, _e, { campaignId }) => [{ type: "CampaignPage", id: campaignId }],
    }),

    setComponentProducts: builder.mutation<
      CampaignComponent,
      { componentId: string; campaignId: string; productIds: string[] }
    >({
      query: ({ componentId, productIds }) => ({
        url: `/campaigns/components/${componentId}/products`,
        method: "PUT",
        body: { productIds },
      }),
      transformResponse: (res: ApiEnvelope<CampaignComponent>) => res.data,
      invalidatesTags: (_r, _e, { campaignId }) => [{ type: "CampaignPage", id: campaignId }],
    }),

    uploadCampaignImage: builder.mutation<{ url: string }, File>({
      query: (file) => {
        const formData = new FormData();
        formData.append("image", file);
        return { url: "/campaigns/upload-image", method: "POST", body: formData };
      },
      transformResponse: (res: ApiEnvelope<{ url: string }>) => res.data,
    }),

    // ── Public: storefront lookup ────────────────

    getPublicCampaignBySlug: builder.query<CampaignPage, string>({
      query: (slug) => `/campaigns/public/${slug}`,
      transformResponse: (res: ApiEnvelope<CampaignPage>) => res.data,
      providesTags: (_r, _e, slug) => [{ type: "PublicCampaignPage", id: slug }],
    }),
  }),
});

export const {
  useListCampaignsQuery,
  useGetCampaignByIdQuery,
  useCreateCampaignMutation,
  useUpdateCampaignMutation,
  usePublishCampaignMutation,
  useUnpublishCampaignMutation,
  useDeleteCampaignMutation,
  useAddComponentMutation,
  useUpdateComponentMutation,
  useDeleteComponentMutation,
  useReorderComponentsMutation,
  useSetComponentProductsMutation,
  useUploadCampaignImageMutation,
  useGetPublicCampaignBySlugQuery,
} = campaignPageApi;