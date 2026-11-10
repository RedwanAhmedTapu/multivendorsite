// src/features/posSubscriptionAdminApi.ts
//
// Admin › POS subscriptions (/api/admin/pos-subscriptions). Backend gate:
// ADMIN, or admin-side staff holding posSubscriptionManagement; plan writes,
// the trial policy and the rollout dry-run are ADMIN only. Injected into the
// existing posApi slice so no new store wiring is needed.

import { posApi, type ApiResponse, type PosEntitlement, type PosPlan } from "./posApi";

export interface AdminPosRow {
  vendorId: string;
  storeName: string;
  email: string | null;
  vendorStatus: string;
  subscription: { status: string; source: string; expiresAt: string | null; lastPaymentAt: string | null; currentPlan: { name: string } | null } | null;
  trial: { grantedAt: string; endsAt: string; days: number } | null;
  entitlement: PosEntitlement;
}

export interface AdminPosList {
  success: boolean;
  data: AdminPosRow[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export interface AdminPosPeriod {
  id: string;
  kind: string;
  previousStatus: string | null;
  newStatus: string | null;
  previousExpiresAt: string | null;
  newExpiresAt: string | null;
  actorUserId: string | null;
  actorRole: string | null;
  reason: string | null;
  createdAt: string;
}

export interface AdminPosDetail {
  vendor: { id: string; storeName: string; email: string | null; status: string; verifiedAt: string | null; posTrialGrant: { grantedAt: string; endsAt: string; days: number; trigger: string } | null };
  subscription: (NonNullable<AdminPosRow["subscription"]> & { id: string; periods: AdminPosPeriod[]; version: number }) | null;
  entitlement: PosEntitlement;
  payments: { id: string; tranId: string; amount: string; currency: string; durationDays: number; status: string; gateway: string; createdAt: string; failureReason: string | null; plan: { name: string } | null }[];
}

export interface PosPolicy {
  trialEnabled: boolean;
  trialDays: number | null;
  graceDays: number;
}

export type LifecycleOp = "grant" | "extend" | "revoke" | "suspend" | "restore";

export const posSubscriptionAdminApi = posApi.injectEndpoints({
  endpoints: (b) => ({
    adminPosSubscriptions: b.query<AdminPosList, { search?: string; status?: string; hasSubscription?: string; page?: number; limit?: number }>({
      query: (params) => ({ url: "/admin/pos-subscriptions", params }),
      providesTags: ["PosSubscription"],
    }),
    adminPosSubscription: b.query<ApiResponse<AdminPosDetail>, string>({
      query: (vendorId) => `/admin/pos-subscriptions/${encodeURIComponent(vendorId)}`,
      providesTags: ["PosSubscription"],
    }),
    adminPosLifecycle: b.mutation<ApiResponse<unknown>, { vendorId: string; op: LifecycleOp; reason: string; days?: number; until?: string | null }>({
      query: ({ vendorId, op, ...body }) => ({ url: `/admin/pos-subscriptions/${encodeURIComponent(vendorId)}/${op}`, method: "POST", body }),
      invalidatesTags: ["PosSubscription"],
    }),
    adminPosPlans: b.query<ApiResponse<PosPlan[]>, void>({
      query: () => "/admin/pos-subscriptions/plans",
      providesTags: ["PosSubscription"],
    }),
    adminCreatePosPlan: b.mutation<ApiResponse<PosPlan>, { code: string; name: string; description?: string; price: string; durationDays: number; sortOrder?: number }>({
      query: (body) => ({ url: "/admin/pos-subscriptions/plans", method: "POST", body }),
      invalidatesTags: ["PosSubscription"],
    }),
    adminUpdatePosPlan: b.mutation<ApiResponse<PosPlan>, { planId: string } & Partial<{ name: string; description: string | null; price: string; durationDays: number; isActive: boolean; sortOrder: number }>>({
      query: ({ planId, ...body }) => ({ url: `/admin/pos-subscriptions/plans/${encodeURIComponent(planId)}`, method: "PATCH", body }),
      invalidatesTags: ["PosSubscription"],
    }),
    adminPosPolicy: b.query<ApiResponse<PosPolicy>, void>({
      query: () => "/admin/pos-subscriptions/policy",
      providesTags: ["PosSubscription"],
    }),
    adminSetPosPolicy: b.mutation<ApiResponse<PosPolicy>, PosPolicy>({
      query: (body) => ({ url: "/admin/pos-subscriptions/policy", method: "PUT", body }),
      invalidatesTags: ["PosSubscription"],
    }),
  }),
});

export const {
  useAdminPosSubscriptionsQuery,
  useAdminPosSubscriptionQuery,
  useAdminPosLifecycleMutation,
  useAdminPosPlansQuery,
  useAdminCreatePosPlanMutation,
  useAdminUpdatePosPlanMutation,
  useAdminPosPolicyQuery,
  useAdminSetPosPolicyMutation,
} = posSubscriptionAdminApi;
