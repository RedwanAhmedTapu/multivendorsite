// features/productCardConfigApi.ts
//
// ADMIN editor endpoints for the GLOBAL product card design
// (backend: routes/theme.routes.ts → /api/themes/product-card…). Every
// endpoint here is ADMIN-only on the backend; the public, published-only read
// is done server-side in lib/theme-utils.ts and is not part of this slice.
// Storefront cache refresh after publish / restore is done by the editor
// (lib/product-card/editor.ts workflows) so it can report the outcome.
import { createApi } from "@reduxjs/toolkit/query/react";
import baseQueryWithReauth from "./baseQueryWithReauth";
import type { ProductCardConfig } from "@/lib/product-card/config";

export interface ProductCardDraftMeta {
  draftUpdatedAt: string | null;
  publishedUpdatedAt: string | null;
  previousAvailable: boolean;
  hasUnpublishedChanges: boolean;
  storedDraftInvalid: boolean;
  storedPublishedInvalid: boolean;
}

export interface ProductCardDraftData {
  config: ProductCardConfig;
  source: "draft" | "published" | "default";
  meta: ProductCardDraftMeta;
}

interface Envelope<T> {
  success: true;
  data: T;
  message?: string;
}

export interface SaveDraftResult { config: ProductCardConfig; updatedAt: string }
export interface DiscardResult { config: ProductCardConfig; source: "published" | "default"; updatedAt: string }
export interface ResetResult { config: ProductCardConfig; updatedAt: string }
export interface PublishResult { config: ProductCardConfig; publishedAt: string; previousSaved: boolean; unchanged: boolean }
export interface RestoreResult { config: ProductCardConfig; publishedAt: string; reversible: boolean }

const BASE = "/themes/product-card";

export const productCardConfigApi = createApi({
  reducerPath: "productCardConfigApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["ProductCardDraft"],
  // The editor must never act on a stale draft / version stamp.
  refetchOnMountOrArgChange: true,
  endpoints: (builder) => ({
    getProductCardDraft: builder.query<Envelope<ProductCardDraftData>, void>({
      query: () => ({ url: `${BASE}/draft`, method: "GET" }),
      providesTags: ["ProductCardDraft"],
    }),

    saveProductCardDraft: builder.mutation<Envelope<SaveDraftResult>, { config: ProductCardConfig; expectedUpdatedAt: string | null }>({
      query: (body) => ({ url: `${BASE}/draft`, method: "PUT", body }),
      invalidatesTags: ["ProductCardDraft"],
    }),

    discardProductCardDraft: builder.mutation<Envelope<DiscardResult>, void>({
      query: () => ({ url: `${BASE}/draft/discard`, method: "POST" }),
      invalidatesTags: ["ProductCardDraft"],
    }),

    resetProductCardDraft: builder.mutation<Envelope<ResetResult>, void>({
      query: () => ({ url: `${BASE}/draft/reset-defaults`, method: "POST" }),
      invalidatesTags: ["ProductCardDraft"],
    }),

    publishProductCard: builder.mutation<Envelope<PublishResult>, { expectedDraftUpdatedAt: string | null }>({
      query: (body) => ({ url: `${BASE}/publish`, method: "POST", body }),
      invalidatesTags: ["ProductCardDraft"],
    }),

    restorePreviousProductCard: builder.mutation<Envelope<RestoreResult>, void>({
      query: () => ({ url: `${BASE}/restore-previous`, method: "POST" }),
      invalidatesTags: ["ProductCardDraft"],
    }),
  }),
});

export const {
  useGetProductCardDraftQuery,
  useSaveProductCardDraftMutation,
  useDiscardProductCardDraftMutation,
  useResetProductCardDraftMutation,
  usePublishProductCardMutation,
  useRestorePreviousProductCardMutation,
} = productCardConfigApi;
