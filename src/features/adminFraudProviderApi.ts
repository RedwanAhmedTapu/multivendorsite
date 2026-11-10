// features/adminFraudProviderApi.ts
import { createApi } from "@reduxjs/toolkit/query/react";
import baseQueryWithReauth from "./baseQueryWithReauth";

// =============================
// ENUM / SHARED TYPES
// =============================

export type RiskLevel = "low" | "medium" | "high" | "very_high" | "unknown";

export interface CredentialField {
  key: string;
  label: string;
  /** true = admin UI should render this as a password-style input and mask it after save. */
  secret: boolean;
}

// =============================
// RESPONSE WRAPPERS
// =============================

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

// =============================
// NESTED SHAPES
// =============================

/** One entry from GET /admin-fraud-providers/available — an adapter the backend code knows how to run. */
export interface AvailableFraudAdapter {
  slug: string;
  displayName: string;
  credentialFields: CredentialField[];
  /** true if a FraudCheckerProvider row already exists for this slug. */
  alreadyConfigured: boolean;
}

/**
 * A configured provider row, as returned by the admin endpoints.
 * `credentials` is ALWAYS masked (e.g. "••••••••3f2a") — the raw
 * secret never leaves the server after it's been saved.
 */
export interface FraudProvider {
  id: string;
  slug: string;
  name: string;
  baseUrl: string | null;
  isActive: boolean;
  priority: number;
  fallbackOnError: boolean;
  configJson: Record<string, unknown> | null;
  credentials: Record<string, string>; // masked values only
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FraudCourierBreakdown {
  courierName: string;
  totalParcels: number;
  delivered: number;
  returned: number;
  ratingOnly?: boolean;
  customerRating?: string;
}
export interface FraudReport {
  id: string;
  name: string;
  details: string;
  createdAt: string;
  courierName?: string;
}
/** Result of a live test call — POST /admin-fraud-providers/:id/test */
export interface FraudCheckTestResult {
  providerSlug: string;
  phone: string;
  totalParcels: number;
  delivered: number;
  returned: number;
  successRate: number;
  riskLevel: RiskLevel;
  couriers: FraudCourierBreakdown[];
  fraudReports?: FraudReport[];
  raw: unknown;
}

/** One row from GET /admin-fraud-providers/:id/logs */
export interface FraudCheckLog {
  id: string;
  providerId: string;
  phone: string;
  success: boolean;
  riskLevel: RiskLevel | null;
  responseJson: unknown;
  errorMessage: string | null;
  latencyMs: number | null;
  createdAt: string;
}

// =============================
// REQUEST TYPES
// =============================

/**
 * POST /admin-fraud-providers
 * `credentials` keys must match the adapter's `credentialFields` (from
 * GET /available) for the chosen `slug` — plaintext here, encrypted
 * server-side before it touches the database.
 */
export interface CreateFraudProviderRequest {
  slug: string;
  name: string;
  baseUrl?: string;
  isActive?: boolean;
  priority?: number;
  fallbackOnError?: boolean;
  credentials: Record<string, string>;
  configJson?: Record<string, unknown>;
}

/**
 * PATCH /admin-fraud-providers/:id
 * Omit `credentials` entirely to leave the stored (encrypted) ones
 * untouched — only send it when the admin is actually rotating a key.
 */
export interface UpdateFraudProviderRequest {
  id: string;
  name?: string;
  baseUrl?: string;
  isActive?: boolean;
  priority?: number;
  fallbackOnError?: boolean;
  credentials?: Record<string, string>;
  configJson?: Record<string, unknown>;
}

export interface SetFraudProviderActiveRequest {
  id: string;
  isActive: boolean;
}

export interface TestFraudProviderRequest {
  id: string;
  /** A real Bangladeshi number to run the live check against, e.g. "01712345678". */
  phone: string;
}

export interface GetFraudProviderLogsRequest {
  id: string;
  limit?: number;
}

// =============================
// ADMIN FRAUD PROVIDER API
// =============================

export const adminFraudProviderApi = createApi({
  reducerPath: "adminFraudProviderApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["FraudProvider", "FraudProviderLogs"],
  endpoints: (builder) => ({
    /**
     * GET /admin-fraud-providers/available
     * Every fraud-checker adapter the backend code can run (Nirvor,
     * FraudBD, ...), with the credential fields the "Add Provider" form
     * needs to render, and whether it's already configured.
     */
    getAvailableFraudAdapters: builder.query<
      ApiResponse<AvailableFraudAdapter[]>,
      void
    >({
      query: () => ({
        url: "/admin-fraud-providers/available",
        method: "GET",
      }),
    }),

    /**
     * GET /admin-fraud-providers
     * All configured provider rows, ordered by priority. Credentials
     * come back masked.
     */
    getFraudProviders: builder.query<ApiResponse<FraudProvider[]>, void>({
      query: () => ({
        url: "/admin-fraud-providers",
        method: "GET",
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({
                type: "FraudProvider" as const,
                id,
              })),
              { type: "FraudProvider", id: "LIST" },
            ]
          : [{ type: "FraudProvider", id: "LIST" }],
    }),

    /**
     * GET /admin-fraud-providers/:id
     */
    getFraudProviderById: builder.query<ApiResponse<FraudProvider>, string>({
      query: (id) => ({
        url: `/admin-fraud-providers/${id}`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [{ type: "FraudProvider", id }],
    }),

    /**
     * GET /admin-fraud-providers/:id/logs?limit=50
     * Recent success/failure history — for a per-provider health panel.
     */
    getFraudProviderLogs: builder.query<
      ApiResponse<FraudCheckLog[]>,
      GetFraudProviderLogsRequest
    >({
      query: ({ id, limit }) => ({
        url: `/admin-fraud-providers/${id}/logs`,
        method: "GET",
        params: limit ? { limit } : undefined,
      }),
      providesTags: (_result, _error, { id }) => [
        { type: "FraudProviderLogs", id },
      ],
    }),

    /**
     * POST /admin-fraud-providers
     * Creates a new provider row. Pick `slug` from the list returned by
     * getAvailableFraudAdapters, and build the `credentials` form from
     * that adapter's `credentialFields`.
     */
    createFraudProvider: builder.mutation<
      ApiResponse<FraudProvider>,
      CreateFraudProviderRequest
    >({
      query: (body) => ({
        url: "/admin-fraud-providers",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "FraudProvider", id: "LIST" }],
    }),

    /**
     * PATCH /admin-fraud-providers/:id
     * Partial update. Leave `credentials` out unless the admin is
     * rotating the key/secret for this provider.
     */
    updateFraudProvider: builder.mutation<
      ApiResponse<FraudProvider>,
      UpdateFraudProviderRequest
    >({
      query: ({ id, ...body }) => ({
        url: `/admin-fraud-providers/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "FraudProvider", id },
        { type: "FraudProvider", id: "LIST" },
      ],
    }),

    /**
     * PATCH /admin-fraud-providers/:id/active
     * One-click enable/disable — pulls a provider out of (or back into)
     * rotation instantly, no deploy needed.
     */
    setFraudProviderActive: builder.mutation<
      ApiResponse<FraudProvider>,
      SetFraudProviderActiveRequest
    >({
      query: ({ id, isActive }) => ({
        url: `/admin-fraud-providers/${id}/active`,
        method: "PATCH",
        body: { isActive },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "FraudProvider", id },
        { type: "FraudProvider", id: "LIST" },
      ],
    }),

    /**
     * DELETE /admin-fraud-providers/:id
     */
    deleteFraudProvider: builder.mutation<ApiResponse<{ success: boolean }>, string>({
      query: (id) => ({
        url: `/admin-fraud-providers/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "FraudProvider", id: "LIST" }],
    }),

    /**
     * POST /admin-fraud-providers/:id/test
     * Runs one live call against this specific provider (bypassing
     * priority/fallback) so the admin can confirm the credentials work
     * right after saving them. Body: { phone }
     */
    testFraudProviderConnection: builder.mutation<
      ApiResponse<FraudCheckTestResult>,
      TestFraudProviderRequest
    >({
      query: ({ id, phone }) => ({
        url: `/admin-fraud-providers/${id}/test`,
        method: "POST",
        body: { phone },
      }),
      // Not invalidating FraudProvider here — a test call doesn't change
      // the row itself, only writes a FraudCheckLog entry.
      invalidatesTags: (_result, _error, { id }) => [
        { type: "FraudProviderLogs", id },
      ],
    }),
  }),
});

// =============================
// EXPORT HOOKS
// =============================

export const {
  useGetAvailableFraudAdaptersQuery,
  useGetFraudProvidersQuery,
  useGetFraudProviderByIdQuery,
  useGetFraudProviderLogsQuery,
  useCreateFraudProviderMutation,
  useUpdateFraudProviderMutation,
  useSetFraudProviderActiveMutation,
  useDeleteFraudProviderMutation,
  useTestFraudProviderConnectionMutation,
} = adminFraudProviderApi;
