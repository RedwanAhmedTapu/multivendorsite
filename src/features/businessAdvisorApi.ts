// features/businessAdvisorApi.ts
//
// Business Advisor API (injected into the shared apiSlice, so no new store
// wiring). The vendor scope is decided by the SERVER from the session — the
// vendor dashboard never sends a vendorId; only admin-side callers may pass
// one (`vendorId`), and the server validates it.

import { apiSlice } from "./apiSlice";
import { demoModeEnabled } from "@/lib/analytics/replay/demo-gate";
import { resolveDetail, resolveList } from "@/lib/analytics/replay/demo-adapter";

export interface AdvisorKpi {
  value: number | null;
  previous: number | null;
  /** % change vs the comparison period (counts only) */
  change: number | null;
  /** change in percentage points (rates only) */
  pointsChange: number | null;
}

export interface FunnelStage {
  key: string;
  label: string;
  journeys: number;
  fromPrevious: number | null;
  dropOff: number | null;
}

export interface AdvisorInsight {
  id: string;
  tone: "info" | "warning" | "positive";
  fact: string;
  hypothesis: string | null;
  sample: number;
}

export interface AdvisorOverview {
  scope: { vendorId: string | null; platform: boolean };
  range: { from: string; to: string; days: number; timezone: string };
  comparison: { from: string; to: string };
  productId: string | null;
  trackingStartedAt: string | null;
  kpis: Record<"views" | "addToCart" | "checkoutStarts" | "orders" | "unitsOrdered" | "orderedValueMinor" | "checkoutFailures" | "viewToCart" | "cartToCheckout" | "checkoutToOrder", AdvisorKpi>;
  funnel: {
    basis: "journeys";
    truncated: boolean;
    totalJourneys: number;
    stages: FunnelStage[];
    paths: { cart: { label: string; stages: FunnelStage[] }; buyNow: { label: string; stages: FunnelStage[] } };
  };
  abandonment: { customersStarted: number; converted: number; abandoned: number; inProgress: number; abandonmentRate: number | null; windowHours: number };
  series: { day: string; views: number; addToCart: number; checkoutStarts: number; orders: number }[];
  failureReasons: { reason: string; attempts: number }[];
  orders: {
    current: { ordersPlaced: number; cancelled: number; paid: number; paymentFailed: number; cashOnDelivery: number; revenueMinor: number };
    previous: { ordersPlaced: number; cancelled: number; paid: number; paymentFailed: number; cashOnDelivery: number; revenueMinor: number };
  } | null;
  insights: AdvisorInsight[];
  definitions: Record<string, string>;
}

export interface AdvisorProductRow {
  productId: string;
  name: string;
  slug: string;
  thumbnail: string | null;
  views: number;
  addToCart: number;
  checkoutStarts: number;
  orders: number;
  unitsOrdered: number;
  orderedValueMinor: number;
  conversion: number | null;
  viewsChange: number | null;
}

export interface AdvisorProducts {
  range: AdvisorOverview["range"];
  sort: string;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  items: AdvisorProductRow[];
}

export interface JourneyStep {
  type: "PRODUCT_VIEW" | "ADD_TO_CART" | "REMOVE_FROM_CART" | "CART_QUANTITY_CHANGED" | "CHECKOUT_STARTED" | "CHECKOUT_FAILED" | "ORDER_PLACED";
  at: string;
  secondsSincePrevious: number | null;
  productId: string;
  productName: string;
  source: string | null;
  reason: string | null;
  quantity: number | null;
}

export interface Journey {
  id: string;
  /** true when only the latest steps are included (per-journey cap) */
  stepsTruncated?: boolean;
  startedAt: string;
  lastActivityAt: string;
  durationSeconds: number;
  path: "CART" | "BUY_NOW" | "BROWSE";
  outcome: string;
  products: { id: string; name: string; thumbnail: string | null }[];
  steps: JourneyStep[];
}

export interface AdvisorJourneys {
  range: AdvisorOverview["range"];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  items: Journey[];
  abandonAfterHours: number;
  replayNotice: string;
}

export interface AdvisorFilters {
  from: string;
  to: string;
  productId?: string;
  /** admin-side only; the server ignores it for vendor accounts */
  vendorId?: string;
}

/** A visual (rrweb) recording — admin-only; see session-replay.routes.ts on the server. */
export interface SessionRecordingSummary {
  id: string;
  /** The Business Advisor journey this recording belongs to (J-XXXXXXXX). */
  journeyId: string;
  synthetic: boolean;
  status: "RECORDING" | "COMPLETE" | "STOPPED";
  stopReason: string | null;
  entryPath: string | null;
  startedAt: string;
  firstEventAt: string | null;
  lastEventAt: string | null;
  durationMs: number;
  pageCount: number;
  chunkCount: number;
  eventCount: number;
  bytes: number;
  expiresAt: string;
}
export interface SessionRecordingList {
  items: SessionRecordingSummary[];
  total: number;
  page: number;
  pageSize: number;
}
export interface SessionRecordingDetail extends SessionRecordingSummary {
  chunks: { seq: number; bytes: number; eventCount: number; firstEventAt: string; lastEventAt: string }[];
}

type Envelope<T> = { success: boolean; data: T };
const params = (o: Record<string, unknown>) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== null && v !== ""));

export const businessAdvisorApi = apiSlice.enhanceEndpoints({ addTagTypes: ["BusinessAdvisor", "SessionRecordings"] }).injectEndpoints({
  endpoints: (builder) => ({
    getAdvisorOverview: builder.query<AdvisorOverview, AdvisorFilters>({
      query: (f) => ({ url: "/analytics/business-advisor/overview", params: params({ ...f }) }),
      transformResponse: (r: Envelope<AdvisorOverview>) => r.data,
      providesTags: ["BusinessAdvisor"],
    }),
    getAdvisorProducts: builder.query<AdvisorProducts, AdvisorFilters & { q?: string; sort?: string; page?: number; pageSize?: number }>({
      query: (f) => ({ url: "/analytics/business-advisor/products", params: params({ ...f }) }),
      transformResponse: (r: Envelope<AdvisorProducts>) => r.data,
      providesTags: ["BusinessAdvisor"],
    }),
    getAdvisorJourneys: builder.query<AdvisorJourneys, AdvisorFilters & { page?: number }>({
      query: (f) => ({ url: "/analytics/business-advisor/journeys", params: params({ ...f }) }),
      transformResponse: (r: Envelope<AdvisorJourneys>) => r.data,
      providesTags: ["BusinessAdvisor"],
    }),
    /** Visual recordings (admin only). Chunk bodies are fetched by the player, outside the store. */
    getSessionRecordings: builder.query<SessionRecordingList, { journey?: string; page?: number }>({
      async queryFn(p, _api, _extra, baseQuery) {
        const r = resolveList(demoModeEnabled(), p.journey);
        if (r.demo) return r.found ? { data: r.data } : { error: { status: 404, data: "Recording not found" } };
        const res = await baseQuery({ url: "/analytics/business-advisor/recordings", params: params({ ...p }) });
        if (res.error) return { error: res.error };
        return { data: (res.data as Envelope<SessionRecordingList>).data };
      },
      providesTags: ["SessionRecordings"],
    }),
    getSessionRecording: builder.query<SessionRecordingDetail, string>({
      async queryFn(id, _api, _extra, baseQuery) {
        const r = resolveDetail(demoModeEnabled(), id);
        if (r.demo) return r.found ? { data: r.data } : { error: { status: 404, data: "Recording not found" } };
        const res = await baseQuery({ url: `/analytics/business-advisor/recordings/${encodeURIComponent(id)}` });
        if (res.error) return { error: res.error };
        return { data: (res.data as Envelope<SessionRecordingDetail>).data };
      },
      providesTags: ["SessionRecordings"],
    }),
    deleteSessionRecording: builder.mutation<{ deleted: number }, string>({
      async queryFn(id, _api, _extra, baseQuery) {
        // demo mode never reaches the real DELETE — whatever the id (fixture or not)
        if (demoModeEnabled()) return { error: { status: 403, data: "Demo recordings can't be deleted" } };
        const res = await baseQuery({ url: `/analytics/business-advisor/recordings/${encodeURIComponent(id)}`, method: "DELETE" });
        if (res.error) return { error: res.error };
        return { data: (res.data as Envelope<{ deleted: number }>).data };
      },
      invalidatesTags: ["SessionRecordings"],
    }),
    /** Browser events (fire-and-forget; the server validates everything). */
    trackAnalyticsEvents: builder.mutation<{ success: boolean; accepted: number }, { events: ({ type: "PRODUCT_VIEW"; productId: string; source?: string } | { type: "CHECKOUT_STARTED" })[] }>({
      query: (body) => ({ url: "/analytics/events", method: "POST", body }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetAdvisorOverviewQuery,
  useGetAdvisorProductsQuery,
  useGetAdvisorJourneysQuery,
  useTrackAnalyticsEventsMutation,
  useGetSessionRecordingsQuery,
  useGetSessionRecordingQuery,
  useDeleteSessionRecordingMutation,
} = businessAdvisorApi;
