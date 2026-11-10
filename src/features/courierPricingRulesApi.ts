// src/features/courierPricingRulesApi.ts
//
// Admin endpoints for platform courier pricing rules (`courier_pricing_rules`).
//
// These are injected into the existing `courierApi` slice instead of being a
// second `createApi`: one `reducerPath`, one cache, so a rule change
// invalidates alongside the rest of the courier dashboard. That is the layout
// documented in `src/features/productapi/README.md` ("one base + N inject
// files, not N separate createApi calls"); `hrmApi.ts` does the same with
// several injected slices. `courierApi` is already registered in the store, so
// nothing else needs wiring.
//
// `enhanceEndpoints({ addTagTypes })` is needed because the base slice's
// `tagTypes` array lives in `courierApi.ts`; enhancing adds the
// "CourierPricingRules" tag without editing the base file.
//
// Field names mirror the Prisma `CourierPricingRules` model, including the
// relation names the backend `include`s. `vendorId` is always null:
// vendor-scoped pricing is rejected by the backend and is deliberately not
// accepted on create/update.

import { courierApi, type ApiResponse } from "./courierApi";

// ==================== TYPES ====================

/** Provider summary the pricing-rule endpoints include with every row. */
export interface CourierPricingRuleProviderRef {
  id: string;
  name: string;
  slug: string;
  displayName?: string | null;
  isActive: boolean;
}

/** Pickup / delivery location summary included with every rule row. */
export interface CourierPricingRuleLocationRef {
  id: string;
  name: string;
  level?: string | null;
}

/**
 * A platform-wide courier pricing rule.
 *
 * These rules are what the checkout delivery engine reads: an active,
 * in-window, NORMAL-delivery rule for a provider prices that provider's lane.
 */
export interface CourierPricingRule {
  id: string;
  courierProviderId: string;
  vendorId: string | null;
  deliveryType: string;
  deliveryTypeCode?: string | null;
  itemType: string;
  itemTypeCode?: string | null;
  fromLocationId: string | null;
  toLocationId: string | null;
  minWeight: number;
  maxWeight: number | null;
  basePrice: number;
  perKgCharge: number;
  codChargeType?: string | null;
  codChargeValue?: number | null;
  fuelSurcharge?: number | null;
  validFrom: string;
  validTo: string | null;
  isActive: boolean;
  priority: number;
  createdAt?: string;
  updatedAt?: string;
  courier_providers?: CourierPricingRuleProviderRef | null;
  locations_courier_pricing_rules_fromLocationIdTolocations?: CourierPricingRuleLocationRef | null;
  locations_courier_pricing_rules_toLocationIdTolocations?: CourierPricingRuleLocationRef | null;
}

/** Filters for the pricing-rules list. */
export interface GetPricingRulesRequest {
  courierProviderId?: string;
  isActive?: boolean;
  deliveryType?: string;
  /** Empty string matches the nationwide (null) pickup location. */
  fromLocationId?: string;
  /** Empty string matches the nationwide (null) destination. */
  toLocationId?: string;
  page?: number;
  limit?: number;
}

/** The list response adds `pagination` next to the shared ApiResponse fields. */
export interface PricingRulesResponse {
  success: boolean;
  message?: string;
  data?: CourierPricingRule[];
  error?: string;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Create body.
 *
 * Every money field is a finite non-negative number. No rate is ever defaulted
 * or invented client-side — the values an admin enters are the business
 * approved ones, and the backend validates them. The backend rejects vendor
 * scoping and any `deliveryType` other than "NORMAL".
 */
export interface CreatePricingRuleRequest {
  courierProviderId: string;
  deliveryType?: string;
  itemType?: string;
  fromLocationId?: string | null;
  toLocationId?: string | null;
  minWeight?: number;
  maxWeight?: number | null;
  basePrice: number;
  perKgCharge?: number;
  codChargeType?: string | null;
  codChargeValue?: number | null;
  fuelSurcharge?: number;
  validFrom?: string;
  validTo?: string | null;
  isActive?: boolean;
  priority?: number;
}

/** Update body — create fields (all optional, provider is immutable) plus id. */
export interface UpdatePricingRuleRequest
  extends Partial<Omit<CreatePricingRuleRequest, "courierProviderId">> {
  id: string;
}

// ==================== ENDPOINTS ====================

export const courierPricingRulesApi = courierApi
  .enhanceEndpoints({ addTagTypes: ["CourierPricingRules"] })
  .injectEndpoints({
    endpoints: (builder) => ({
      /**
       * List platform-wide courier pricing rules with filters and pagination.
       * GET /api/courier/admin/pricing-rules
       */
      getPricingRules: builder.query<
        PricingRulesResponse,
        GetPricingRulesRequest | void
      >({
        query: (params) => ({
          url: "/courier/admin/pricing-rules",
          method: "GET",
          params: params || undefined,
        }),
        providesTags: (result) =>
          result?.data
            ? [
                ...result.data.map(({ id }) => ({
                  type: "CourierPricingRules" as const,
                  id,
                })),
                { type: "CourierPricingRules" as const, id: "LIST" },
              ]
            : [{ type: "CourierPricingRules" as const, id: "LIST" }],
      }),

      /**
       * Create a platform courier pricing rule.
       * POST /api/courier/admin/pricing-rules
       */
      createPricingRule: builder.mutation<
        ApiResponse<CourierPricingRule>,
        CreatePricingRuleRequest
      >({
        query: (body) => ({
          url: "/courier/admin/pricing-rules",
          method: "POST",
          body,
        }),
        invalidatesTags: [{ type: "CourierPricingRules", id: "LIST" }],
      }),

      /**
       * Update a courier pricing rule.
       * PUT /api/courier/admin/pricing-rules/:id
       */
      updatePricingRule: builder.mutation<
        ApiResponse<CourierPricingRule>,
        UpdatePricingRuleRequest
      >({
        query: ({ id, ...body }) => ({
          url: `/courier/admin/pricing-rules/${id}`,
          method: "PUT",
          body,
        }),
        invalidatesTags: (result, error, { id }) => [
          { type: "CourierPricingRules", id: "LIST" },
          { type: "CourierPricingRules", id },
        ],
      }),

      /**
       * Toggle a pricing rule's active status — the safe deactivation path.
       * PATCH /api/courier/admin/pricing-rules/:id/toggle
       *
       * Deactivating keeps the row (and its history) but removes the rule from
       * checkout matching, so a lane can be withdrawn without losing it.
       */
      togglePricingRule: builder.mutation<
        ApiResponse<CourierPricingRule>,
        { id: string }
      >({
        query: ({ id }) => ({
          url: `/courier/admin/pricing-rules/${id}/toggle`,
          method: "PATCH",
        }),
        invalidatesTags: (result, error, { id }) => [
          { type: "CourierPricingRules", id: "LIST" },
          { type: "CourierPricingRules", id },
        ],
      }),

      /**
       * Delete a courier pricing rule (hard delete).
       * DELETE /api/courier/admin/pricing-rules/:id
       *
       * Prefer `togglePricingRule`: removing the only applicable rule for a
       * lane makes checkout quotes for that lane fail.
       */
      deletePricingRule: builder.mutation<
        ApiResponse<{ id: string; deleted: boolean }>,
        { id: string }
      >({
        query: ({ id }) => ({
          url: `/courier/admin/pricing-rules/${id}`,
          method: "DELETE",
        }),
        invalidatesTags: (result, error, { id }) => [
          { type: "CourierPricingRules", id: "LIST" },
          { type: "CourierPricingRules", id },
        ],
      }),
    }),
  });

export const {
  useGetPricingRulesQuery,
  useLazyGetPricingRulesQuery,
  useCreatePricingRuleMutation,
  useUpdatePricingRuleMutation,
  useTogglePricingRuleMutation,
  useDeletePricingRuleMutation,
} = courierPricingRulesApi;

export default courierPricingRulesApi;
