// features/mfaApi.ts
// MFA endpoints (TOTP + recovery codes + sessions + admin policy).
// Management endpoints are self-scoped by the authenticated session;
// /verify and /enrollment/start are public but challenge-scoped.
import { createApi } from "@reduxjs/toolkit/query/react";
import baseQueryWithReauth from "./baseQueryWithReauth";

// --------- Types ---------

export interface MfaChallengeResponse {
  mfaRequired: true;
  challengeId: string;
  enrollmentRequired: boolean;
}

export interface MfaEnrollmentStartResponse {
  otpauthUrl: string;
  qrCodeDataUrl: string;
  manualEntrySecret: string;
}

export interface MfaStatusResponse {
  enrolled: boolean;
  enabledAt: string | null;
  lastUsedAt: string | null;
  remainingRecoveryCodes: number;
}

export interface MfaVerifyRequest {
  challengeId: string;
  code?: string;
  recoveryCode?: string;
}

export interface MfaSessionSummary {
  id: string;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
  lastUsedAt: string | null;
  active: boolean;
  revokedAt: string | null;
}

export interface MfaPolicy {
  enforceAdmin: boolean;
  enforcePlatformEmployee: boolean;
  enforceVendorOwner: boolean;
  emailOtpFallbackEnabled: boolean;
  enrollmentGraceDays: number;
}

// --------- API ---------

export const mfaApi = createApi({
  reducerPath: "mfaApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["MfaStatus", "MfaSessions"],
  endpoints: (builder) => ({
    // Public, challenge-scoped login completion.
    mfaVerify: builder.mutation<any, MfaVerifyRequest>({
      query: (body) => ({ url: "/auth/mfa/verify", method: "POST", body }),
      invalidatesTags: ["MfaStatus", "MfaSessions"],
    }),

    // Public, challenge-scoped enrollment start (policy-enforced first login).
    mfaEnrollmentStart: builder.mutation<
      MfaEnrollmentStartResponse,
      { challengeId: string }
    >({
      query: (body) => ({
        url: "/auth/mfa/enrollment/start",
        method: "POST",
        body,
      }),
    }),

    // Authenticated self-service.
    getMfaStatus: builder.query<MfaStatusResponse, void>({
      query: () => ({ url: "/auth/mfa/status", method: "GET" }),
      providesTags: ["MfaStatus"],
    }),

    mfaSetupStart: builder.mutation<
      MfaEnrollmentStartResponse,
      { password?: string }
    >({
      query: (body) => ({ url: "/auth/mfa/setup/start", method: "POST", body }),
    }),

    mfaSetupVerify: builder.mutation<
      { message: string; recoveryCodes: string[] },
      { code: string }
    >({
      query: (body) => ({ url: "/auth/mfa/setup/verify", method: "POST", body }),
      invalidatesTags: ["MfaStatus"],
    }),

    mfaDisable: builder.mutation<
      { message: string },
      { password?: string; code?: string; recoveryCode?: string }
    >({
      query: (body) => ({ url: "/auth/mfa/disable", method: "POST", body }),
      invalidatesTags: ["MfaStatus"],
    }),

    mfaRegenerateRecoveryCodes: builder.mutation<
      { recoveryCodes: string[] },
      { password?: string; code: string }
    >({
      query: (body) => ({
        url: "/auth/mfa/recovery-codes/regenerate",
        method: "POST",
        body,
      }),
      invalidatesTags: ["MfaStatus"],
    }),

    getMfaSessions: builder.query<{ sessions: MfaSessionSummary[] }, void>({
      query: () => ({ url: "/auth/mfa/sessions", method: "GET" }),
      providesTags: ["MfaSessions"],
    }),

    revokeMfaSession: builder.mutation<{ message: string }, string>({
      query: (sessionId) => ({
        url: `/auth/mfa/sessions/${sessionId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["MfaSessions"],
    }),

    // Admin-only enforcement policy.
    getMfaPolicy: builder.query<MfaPolicy, void>({
      query: () => ({ url: "/auth/mfa/policy", method: "GET" }),
    }),

    updateMfaPolicy: builder.mutation<MfaPolicy, MfaPolicy>({
      query: (body) => ({ url: "/auth/mfa/policy", method: "PUT", body }),
    }),
  }),
});

export const {
  useMfaVerifyMutation,
  useMfaEnrollmentStartMutation,
  useGetMfaStatusQuery,
  useMfaSetupStartMutation,
  useMfaSetupVerifyMutation,
  useMfaDisableMutation,
  useMfaRegenerateRecoveryCodesMutation,
  useGetMfaSessionsQuery,
  useRevokeMfaSessionMutation,
  useGetMfaPolicyQuery,
  useUpdateMfaPolicyMutation,
} = mfaApi;
