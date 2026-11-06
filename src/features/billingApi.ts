// src/features/billingApi.ts
//
// Subscription platform + vendor payouts. Injected into the existing apiSlice
// (no new store wiring). Backend gates:
//   /admin/subscriptions, /admin/payouts   ADMIN only
//   /vendor/subscription, /vendor/payouts  the store owner (VENDOR role) only
// Plans, prices and features always come from these endpoints — nothing is
// hardcoded in the UI. Subscription billing and payouts are separate flows.

import { apiSlice } from "./apiSlice";

export interface Ok<T> { success: boolean; data: T; message?: string }

export type SubState = "NONE" | "PENDING" | "ACTIVE" | "GRACE" | "EXPIRED" | "CANCELLED" | "SUSPENDED";
export interface LimitDef { key: string; label: string; type: "number" | "boolean"; unit?: string; period?: "MONTH" }
export type LimitConfig = Record<string, number | boolean | null>;

export interface SubFeature {
  id: string; key: string; name: string; description: string | null; icon: string | null; color: string | null; category: string | null;
  limitDefs: LimitDef[]; enforced: boolean; isActive: boolean; sortOrder: number; _count?: { packages: number };
}
export interface SubCycle { id: string; key: string; name: string; months: number; isActive: boolean; sortOrder: number }
export interface SubPrice { id: string; packageId: string; cycleId: string; price: string; promoPrice: string | null; discountPercent: string | null; isActive: boolean; cycle?: SubCycle }
export interface SubPackageFeature { id: string; packageId: string; featureId: string; enabled: boolean; config: LimitConfig; feature?: SubFeature }
export interface SubPackage {
  id: string; name: string; slug: string; description: string | null; icon: string | null; color: string | null; displayOrder: number;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED"; visibility: "PUBLIC" | "HIDDEN"; isPopular: boolean; trialDays: number | null;
  features?: SubPackageFeature[]; prices?: SubPrice[]; _count?: { subscribers: number }; createdAt?: string;
}
export interface Evaluation { state: SubState; packageId: string | null; expiresAt: string | null; graceEndsAt: string | null; daysLeft: number | null }
export interface SubSettings { graceDays: number; reminderDays: number; changeStartsFrom: "NOW" | "CURRENT_END"; enforcement: "enforce" | "monitor" }
export interface SubOverview {
  totals: { active: number; grace: number; expired: number; suspended: number; cancelled: number; trials: number; expiringSoon: number; pendingPayments: number; activeOffers: number; revenueThisMonth: string; revenue12m: string };
  revenueByMonth: { month: string; revenue: string }[];
  byPackage: { id: string; name: string; color: string | null; status: string; activeSubscribers: number; revenue12m: string }[];
  plans: { published: number; draft: number; archived: number };
}
export interface VendorSubRow {
  id: string; vendorId: string; status: string | null; source: string | null; expiresAt: string | null; startedAt: string | null; amountPaid: string | null;
  vendor: { id: string; storeName: string; avatar: string | null }; package: { id: string; name: string; color: string | null } | null; cycle: { id: string; name: string } | null;
  evaluation: Evaluation;
}
export interface SubPayment {
  id: string; vendorId: string; packageId: string; cycleId: string; amount: string; listAmount: string; currency: string; status: string; method: string;
  reference: string | null; offerId: string | null; periodStart: string | null; periodEnd: string | null; note: string | null; createdAt: string;
  vendor?: { id: string; storeName: string }; package?: { name: string }; cycle?: { name: string };
}
export interface SubOffer {
  id: string; vendorId: string; kind: string; packageId: string | null; cycleId: string | null; featureId: string | null; value: string | null;
  startsAt: string; endsAt: string; status: string; afterExpiry: string; afterExpiryPackageId: string | null; note: string | null; createdAt: string;
  vendor?: { id: string; storeName: string }; package?: { id: string; name: string } | null; cycle?: { id: string; name: string } | null; feature?: { id: string; name: string; key: string } | null;
}
export interface SubEvent { id: string; kind: string; before: Record<string, unknown> | null; after: Record<string, unknown> | null; reason: string | null; actorUserId: string | null; createdAt: string }
export interface Entitlement {
  key: string; name: string; icon: string | null; color: string | null; granted: boolean; enforced: boolean; sources: string[];
  limits: LimitConfig; limitDefs: LimitDef[]; usage: { key: string; used: number }[];
}
export interface VendorSubDetail {
  vendor: { id: string; storeName: string }; subscription: VendorSubRow | null; package: { id: string; name: string; color: string | null } | null;
  evaluation: Evaluation; events: SubEvent[]; payments: SubPayment[]; offers: SubOffer[]; entitlements: Entitlement[];
}
export interface Quote { listPrice: string; basePrice: string; finalPrice: string; savings: string; offerId: string | null; offerKind: string | null }
export interface VendorPlan {
  id: string; name: string; slug: string; description: string | null; icon: string | null; color: string | null; isPopular: boolean; trialDays: number | null;
  features: { key: string; name: string; icon: string | null; description: string | null; limits: LimitConfig; limitDefs: LimitDef[] }[];
  prices: (Quote & { cycleId: string; cycleName: string; months: number })[];
  freeUntil: string | null;
}
export interface VendorCurrent {
  evaluation: Evaluation; graceDays: number;
  subscription: { status: string | null; source: string | null; startedAt: string | null; expiresAt: string | null; amountPaid: string | null; currency: string } | null;
  package: { id: string; name: string; color: string | null; icon: string | null } | null; cycle: { id: string; name: string; months: number } | null;
  offers: { id: string; kind: string; value: string | null; startsAt: string; endsAt: string; planName: string | null; featureName: string | null; afterExpiry: string; live: boolean }[];
  entitlements: Entitlement[]; pendingRequests: SubPayment[];
}

// ─── payouts ────────────────────────────────────────────────────────────────
export type PayoutCycle = "WEEKLY" | "BIWEEKLY" | "MONTHLY" | "QUARTERLY" | "CUSTOM";
export interface PayoutPolicy {
  cycle: PayoutCycle; weekday: number; monthDays: number[]; customIntervalDays: number | null; anchorDate: string | null; minThreshold: string;
  settlementDelayDays: number; refundWindowDays: number; autoPropose: boolean; requireApproval: boolean; holdAll: boolean;
}
export interface Eligibility { balance: string; pendingInWindow: string; inOpenBatches: string; available: string; payable: boolean; amount: string; reasons: string[] }
export interface PreviewRow { vendorId: string; storeName: string; dueOnDate: boolean; nextPayoutDate: string; totalPaid: string; lastPayoutAt: string | null; eligibility: Eligibility; rule: PayoutPolicy & { paused: boolean; holdUntil: string | null; holdReason: string | null; overridden: string[] } }
export interface PayoutPreview { date: string; policy: PayoutPolicy; totals: { vendors: number; payableVendors: number; balance: string; available: string; pendingInWindow: string; inOpenBatches: string; payableNow: string }; rows: PreviewRow[] }
export interface PayoutOverview { policy: PayoutPolicy; nextPayoutDate: string; totals: PayoutPreview["totals"] & { openBatches: number; heldItems: number; paid12m: string }; paidByMonth: { month: string; paid: string }[] }
export interface PayoutItem {
  id: string; batchId: string; vendorId: string; amount: string; status: string; calculation: Eligibility & { computedAt?: string }; method: string | null; reference: string | null;
  voucherId: string | null; paidAt: string | null; heldReason: string | null; createdAt: string; updatedAt: string;
  vendor?: { id: string; storeName: string }; batch?: { id: string; batchNumber: string; status: string; scheduledFor: string };
}
export interface PayoutBatch { id: string; batchNumber: string; scheduledFor: string; status: string; totalAmount: string; vendorCount: number; approvedAt: string | null; note: string | null; createdById: string | null; createdAt: string; items?: PayoutItem[] }
export interface PayoutRule {
  vendorId: string; cycle: PayoutCycle | null; weekday: number | null; monthDays: number[]; customIntervalDays: number | null; anchorDate: string | null; minThreshold: string | null;
  settlementDelayDays: number | null; requireApproval: boolean | null; paused: boolean; holdUntil: string | null; holdReason: string | null; note: string | null; updatedAt: string;
  vendor?: { id: string; storeName: string };
}
export interface PayoutAudit { id: string; entity: string; entityId: string; action: string; before: unknown; after: unknown; actorName: string | null; createdAt: string }
export interface VendorPayoutSummary {
  totalBalance: string; available: string; pending: string; onHold: string; inProcess: string; totalPaid: string; lastPayoutAt: string | null; nextPayoutDate: string;
  schedule: { cycle: PayoutCycle; minThreshold: string; holdWindowDays: number }; status: "ELIGIBLE" | "BELOW_THRESHOLD" | "NOTHING_DUE" | "ON_HOLD";
  history: { id: string; amount: string; status: string; method: string | null; reference: string | null; paidAt: string | null; createdAt: string; batch: { batchNumber: string; scheduledFor: string } }[];
}
export interface Paged<T> { items: T[]; total: number; page: number; pageSize: number }

const api = apiSlice.enhanceEndpoints({ addTagTypes: ["SubsAdmin", "SubsVendor", "PayoutAdmin", "PayoutVendor"] }).injectEndpoints({
  endpoints: (b) => ({
    // admin subscriptions
    subsOverview: b.query<Ok<SubOverview>, void>({ query: () => "/admin/subscriptions/overview", providesTags: ["SubsAdmin"] }),
    subsSettings: b.query<Ok<SubSettings>, void>({ query: () => "/admin/subscriptions/settings", providesTags: ["SubsAdmin"] }),
    subsSetSettings: b.mutation<Ok<SubSettings>, SubSettings>({ query: (body) => ({ url: "/admin/subscriptions/settings", method: "PUT", body }), invalidatesTags: ["SubsAdmin"] }),
    subsFeatures: b.query<Ok<SubFeature[]>, void>({ query: () => "/admin/subscriptions/features", providesTags: ["SubsAdmin"] }),
    subsSaveFeature: b.mutation<Ok<SubFeature>, Partial<SubFeature> & { id?: string }>({
      query: ({ id, ...body }) => (id ? { url: `/admin/subscriptions/features/${id}`, method: "PATCH", body } : { url: "/admin/subscriptions/features", method: "POST", body }),
      invalidatesTags: ["SubsAdmin"],
    }),
    subsCycles: b.query<Ok<SubCycle[]>, void>({ query: () => "/admin/subscriptions/cycles", providesTags: ["SubsAdmin"] }),
    subsSaveCycle: b.mutation<Ok<SubCycle>, Partial<SubCycle> & { id?: string }>({
      query: ({ id, ...body }) => (id ? { url: `/admin/subscriptions/cycles/${id}`, method: "PATCH", body } : { url: "/admin/subscriptions/cycles", method: "POST", body }),
      invalidatesTags: ["SubsAdmin"],
    }),
    subsPlans: b.query<Ok<SubPackage[]>, { status?: string } | void>({ query: (p) => ({ url: "/admin/subscriptions/plans", params: (p as { status?: string } | undefined) ?? {} }), providesTags: ["SubsAdmin"] }),
    subsPlan: b.query<Ok<SubPackage>, string>({ query: (id) => `/admin/subscriptions/plans/${id}`, providesTags: ["SubsAdmin"] }),
    subsSavePlan: b.mutation<Ok<SubPackage>, Partial<SubPackage> & { id?: string }>({
      query: ({ id, ...body }) => (id ? { url: `/admin/subscriptions/plans/${id}`, method: "PATCH", body } : { url: "/admin/subscriptions/plans", method: "POST", body }),
      invalidatesTags: ["SubsAdmin", "SubsVendor"],
    }),
    subsDuplicatePlan: b.mutation<Ok<SubPackage>, string>({ query: (id) => ({ url: `/admin/subscriptions/plans/${id}/duplicate`, method: "POST" }), invalidatesTags: ["SubsAdmin"] }),
    subsPlanStatus: b.mutation<Ok<SubPackage>, { id: string; status: SubPackage["status"] }>({ query: ({ id, status }) => ({ url: `/admin/subscriptions/plans/${id}/status`, method: "POST", body: { status } }), invalidatesTags: ["SubsAdmin", "SubsVendor"] }),
    subsPlanFeatures: b.mutation<Ok<SubPackageFeature[]>, { id: string; features: { featureId: string; enabled: boolean; config: LimitConfig }[] }>({
      query: ({ id, features }) => ({ url: `/admin/subscriptions/plans/${id}/features`, method: "PUT", body: { features } }), invalidatesTags: ["SubsAdmin", "SubsVendor"],
    }),
    subsPlanPrices: b.mutation<Ok<SubPrice[]>, { id: string; prices: { cycleId: string; price: string; promoPrice: string | null; discountPercent: string | null; isActive: boolean }[] }>({
      query: ({ id, prices }) => ({ url: `/admin/subscriptions/plans/${id}/prices`, method: "PUT", body: { prices } }), invalidatesTags: ["SubsAdmin", "SubsVendor"],
    }),
    subsVendorSearch: b.query<Ok<{ id: string; storeName: string; status: string }[]>, string>({ query: (q) => ({ url: "/admin/subscriptions/vendor-search", params: { q } }) }),
    subsVendors: b.query<Ok<Paged<VendorSubRow>>, { state?: string; q?: string; page?: number }>({ query: (params) => ({ url: "/admin/subscriptions/vendors", params }), providesTags: ["SubsAdmin"] }),
    subsVendor: b.query<Ok<VendorSubDetail>, string>({ query: (id) => `/admin/subscriptions/vendors/${id}`, providesTags: ["SubsAdmin"] }),
    subsQuote: b.query<Ok<Quote>, { vendorId: string; packageId: string; cycleId: string }>({ query: ({ vendorId, ...params }) => ({ url: `/admin/subscriptions/vendors/${vendorId}/quote`, params }) }),
    subsVendorAction: b.mutation<Ok<unknown>, { vendorId: string; action: "payments" | "activate" | "extend" | "suspend" | "restore" | "cancel"; body: Record<string, unknown> }>({
      query: ({ vendorId, action, body }) => ({ url: `/admin/subscriptions/vendors/${vendorId}/${action}`, method: "POST", body }), invalidatesTags: ["SubsAdmin"],
    }),
    subsOffers: b.query<Ok<SubOffer[]>, { vendorId?: string; status?: string } | void>({ query: (p) => ({ url: "/admin/subscriptions/offers", params: (p as { vendorId?: string; status?: string } | undefined) ?? {} }), providesTags: ["SubsAdmin"] }),
    subsCreateOffer: b.mutation<Ok<SubOffer>, Record<string, unknown>>({ query: (body) => ({ url: "/admin/subscriptions/offers", method: "POST", body }), invalidatesTags: ["SubsAdmin"] }),
    subsOfferAction: b.mutation<Ok<SubOffer>, { id: string; action: "pause" | "resume" | "revoke"; reason: string }>({ query: ({ id, action, reason }) => ({ url: `/admin/subscriptions/offers/${id}/${action}`, method: "POST", body: { reason } }), invalidatesTags: ["SubsAdmin"] }),
    subsTransactions: b.query<Ok<Paged<SubPayment>>, { status?: string; vendorId?: string; page?: number }>({ query: (params) => ({ url: "/admin/subscriptions/transactions", params }), providesTags: ["SubsAdmin"] }),
    subsConfirmPayment: b.mutation<Ok<unknown>, { id: string; reference: string; method?: string }>({ query: ({ id, ...body }) => ({ url: `/admin/subscriptions/transactions/${id}/confirm`, method: "POST", body }), invalidatesTags: ["SubsAdmin"] }),
    subsPaymentStatus: b.mutation<Ok<SubPayment>, { id: string; status: "CANCELLED" | "FAILED" | "REFUNDED"; reason: string }>({ query: ({ id, ...body }) => ({ url: `/admin/subscriptions/transactions/${id}/status`, method: "POST", body }), invalidatesTags: ["SubsAdmin"] }),

    // vendor subscription
    vendorPlans: b.query<Ok<{ cycles: { id: string; key: string; name: string; months: number }[]; plans: VendorPlan[] }>, void>({ query: () => "/vendor/subscription/plans", providesTags: ["SubsVendor"] }),
    vendorCurrent: b.query<Ok<VendorCurrent>, void>({ query: () => "/vendor/subscription/current", providesTags: ["SubsVendor"] }),
    vendorSubPayments: b.query<Ok<SubPayment[]>, void>({ query: () => "/vendor/subscription/payments", providesTags: ["SubsVendor"] }),
    vendorRequestPlan: b.mutation<Ok<{ status: string; payment: SubPayment; duplicate?: boolean }>, { packageId: string; cycleId: string; method?: string; reference?: string }>({
      query: (body) => ({ url: "/vendor/subscription/requests", method: "POST", body }), invalidatesTags: ["SubsVendor"],
    }),
    vendorCancelRequest: b.mutation<Ok<{ ok: boolean }>, string>({ query: (id) => ({ url: `/vendor/subscription/requests/${id}/cancel`, method: "POST" }), invalidatesTags: ["SubsVendor"] }),

    // admin payouts
    payoutOverview: b.query<Ok<PayoutOverview>, void>({ query: () => "/admin/payouts/overview", providesTags: ["PayoutAdmin"] }),
    payoutPolicy: b.query<Ok<PayoutPolicy>, void>({ query: () => "/admin/payouts/policy", providesTags: ["PayoutAdmin"] }),
    payoutSetPolicy: b.mutation<Ok<PayoutPolicy>, PayoutPolicy>({ query: (body) => ({ url: "/admin/payouts/policy", method: "PUT", body }), invalidatesTags: ["PayoutAdmin"] }),
    payoutPreview: b.query<Ok<PayoutPreview>, { onlyDue?: boolean; date?: string } | void>({ query: (p) => {
      const q = p as { onlyDue?: boolean; date?: string } | undefined;
      return { url: "/admin/payouts/preview", params: { ...(q?.onlyDue ? { onlyDue: "1" } : {}), ...(q?.date ? { date: q.date } : {}) } };
    }, providesTags: ["PayoutAdmin"] }),
    payoutRules: b.query<Ok<PayoutRule[]>, void>({ query: () => "/admin/payouts/rules", providesTags: ["PayoutAdmin"] }),
    payoutSetRule: b.mutation<Ok<PayoutRule>, { vendorId: string } & Record<string, unknown>>({ query: ({ vendorId, ...body }) => ({ url: `/admin/payouts/rules/${vendorId}`, method: "PUT", body }), invalidatesTags: ["PayoutAdmin"] }),
    payoutVendorState: b.mutation<Ok<PayoutRule>, { vendorId: string; action: "hold" | "release" | "pause" | "resume"; reason?: string; until?: string }>({
      query: ({ vendorId, action, ...body }) => ({ url: `/admin/payouts/vendors/${vendorId}/${action}`, method: "POST", body }), invalidatesTags: ["PayoutAdmin"],
    }),
    payoutBatches: b.query<Ok<PayoutBatch[]>, { status?: string } | void>({ query: (p) => ({ url: "/admin/payouts/batches", params: (p as { status?: string } | undefined) ?? {} }), providesTags: ["PayoutAdmin"] }),
    payoutBatch: b.query<Ok<PayoutBatch>, string>({ query: (id) => `/admin/payouts/batches/${id}`, providesTags: ["PayoutAdmin"] }),
    payoutCreateBatch: b.mutation<Ok<PayoutBatch>, { scheduledFor?: string; vendorIds?: string[]; includeNotDue?: boolean; note?: string }>({ query: (body) => ({ url: "/admin/payouts/batches", method: "POST", body }), invalidatesTags: ["PayoutAdmin"] }),
    payoutBatchAction: b.mutation<Ok<unknown>, { id: string; action: "approve" | "cancel"; reason?: string }>({ query: ({ id, action, reason }) => ({ url: `/admin/payouts/batches/${id}/${action}`, method: "POST", body: { reason } }), invalidatesTags: ["PayoutAdmin"] }),
    payoutItems: b.query<Ok<Paged<PayoutItem>>, { status?: string; vendorId?: string; page?: number }>({ query: (params) => ({ url: "/admin/payouts/items", params }), providesTags: ["PayoutAdmin"] }),
    payoutItemAction: b.mutation<Ok<unknown>, { id: string; action: "hold" | "release" | "cancel" | "mark-paid"; body?: Record<string, unknown> }>({
      query: ({ id, action, body }) => ({ url: `/admin/payouts/items/${id}/${action}`, method: "POST", body: body ?? {} }), invalidatesTags: ["PayoutAdmin"],
    }),
    payoutAudit: b.query<Ok<PayoutAudit[]>, { entity?: string; entityId?: string } | void>({ query: (p) => ({ url: "/admin/payouts/audit", params: (p as { entity?: string; entityId?: string } | undefined) ?? {} }), providesTags: ["PayoutAdmin"] }),

    // vendor payouts
    vendorPayoutSummary: b.query<Ok<VendorPayoutSummary>, void>({ query: () => "/vendor/payouts/summary", providesTags: ["PayoutVendor"] }),
  }),
});

export const {
  useSubsOverviewQuery, useSubsSettingsQuery, useSubsSetSettingsMutation, useSubsFeaturesQuery, useSubsSaveFeatureMutation, useSubsCyclesQuery, useSubsSaveCycleMutation,
  useSubsPlansQuery, useSubsPlanQuery, useSubsSavePlanMutation, useSubsDuplicatePlanMutation, useSubsPlanStatusMutation, useSubsPlanFeaturesMutation, useSubsPlanPricesMutation,
  useSubsVendorSearchQuery, useSubsVendorsQuery, useSubsVendorQuery, useSubsQuoteQuery, useSubsVendorActionMutation, useSubsOffersQuery, useSubsCreateOfferMutation, useSubsOfferActionMutation,
  useSubsTransactionsQuery, useSubsConfirmPaymentMutation, useSubsPaymentStatusMutation,
  useVendorPlansQuery, useVendorCurrentQuery, useVendorSubPaymentsQuery, useVendorRequestPlanMutation, useVendorCancelRequestMutation,
  usePayoutOverviewQuery, usePayoutPolicyQuery, usePayoutSetPolicyMutation, usePayoutPreviewQuery, usePayoutRulesQuery, usePayoutSetRuleMutation, usePayoutVendorStateMutation,
  usePayoutBatchesQuery, usePayoutBatchQuery, usePayoutCreateBatchMutation, usePayoutBatchActionMutation, usePayoutItemsQuery, usePayoutItemActionMutation, usePayoutAuditQuery,
  useVendorPayoutSummaryQuery,
} = api;

export function apiError(err: unknown): string {
  return (err as { data?: { message?: string } })?.data?.message ?? "Something went wrong. Please try again.";
}
