// features/authApi.ts
import { createApi } from "@reduxjs/toolkit/query/react";
import baseQueryWithReauth from "./baseQueryWithReauth";
export type PermissionKey =
  | "productManagement"
  | "orderManagement"
  | "customerSupport"
  | "analytics"
  | "offerManagement"
  | "inventoryManagement"
  | "hrManagement"
  | "marketingManagement"
  | "posSubscriptionManagement"
  | "agentManagement"
  | "themeManagement";

/** Keys only a vendor OWNER grants to its own staff (backend
 *  VENDOR_ONLY_PERMISSION_KEYS minus keys that have no UI yet). */
export const VENDOR_ONLY_PERMISSION_KEYS = ["posAccess", "posDiscount", "posCredit", "posRefund", "posReports"] as const;
export type VendorOnlyPermissionKey = (typeof VENDOR_ONLY_PERMISSION_KEYS)[number];

export interface CurrentUser {
  id: string;
  rawId: string;
  role: "ADMIN" | "VENDOR" | "EMPLOYEE";
  vendorId: string | null;
  employeeId: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  // null = ADMIN/VENDOR (owner — full access). An object = EMPLOYEE — check keys.
  permissions: Partial<Record<PermissionKey | VendorOnlyPermissionKey, boolean>> | null;
  employeeMeta: { designation: string | null; department: string | null; isActive: boolean } | null;
  /** Granular HR capability map (P0) — server-derived for EVERY role from
   *  the same source the backend requireHr() gates use. VENDOR deliberately
   *  does not auto-pass the sensitive salary/bank keys. */
  hrCapabilities?: Record<string, boolean>;
}
// --------- Request Types ---------
export interface LoginRequest {
  email?: string;
  phone?: string;
  password: string;
}

export interface RegisterRequest {
  name?: string;
  email?: string;
  phone?: string;
  password: string;
  role?: "CUSTOMER" | "VENDOR" | "EMPLOYEE" | "ADMIN";
  storeName?: string;
  designation?: string;
  department?: string;
}

export interface VerifyEmailRequest {
  token: string;
  name?: string;
  password: string;
  role?: "CUSTOMER" | "VENDOR" | "EMPLOYEE" | "ADMIN";
  storeName?: string;
  designation?: string;
  department?: string;
}

export interface VerifyOtpRequest {
  phone: string;
  otp: string;
  password: string;
  role?: "CUSTOMER" | "VENDOR" | "EMPLOYEE" | "ADMIN";
  name?: string;
  storeName?: string;
  designation?: string;
  department?: string;
}

export interface SocialLoginRequest {
  provider: "google" | "facebook";
  token: string;
}

// --------- Response Types ---------
export interface AuthResponse {
  user: {
    id: string;
    name?: string;
    email?: string;
    phone?: string;
    role: string;
    /** Included by the backend's loginUser (include: { employee: true, ... }).
     *  Used to route EMPLOYEE logins to the dashboard side their account
     *  belongs to (platform vs vendor). */
    employee?: { vendorId: string | null } | null;
  };
  accessToken?: string;
  message?: string;
}

export interface ForgotPasswordRequest {
  email?: string;
  phone?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface VerifyResetTokenRequest {
  token?: string;
  phone?: string;
  otp?: string;
}

export interface ResetPasswordRequest {
  token?: string;
  phone?: string;
  otp?: string;
  newPassword: string;
  confirmPassword: string;
}

// --------- Login History Types ---------
export interface LoginHistoryEntry {
  id: string;
  userId: string | null;
  success: boolean;
  method: "PASSWORD" | "SOCIAL" | "WEBAUTHN";
  failureReason?: string | null;
  attemptedEmail?: string | null;
  attemptedPhone?: string | null;
  ipAddress: string;
  device: string;
  deviceName: string;
  browser: string;
  os: string;
  platform?: string | null;
  platformVersion?: string | null;
  model?: string | null;
  loginAt: string;
  createdAt: string;
}

export interface LoginHistoryResponse {
  items: LoginHistoryEntry[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface LoginHistoryQuery {
  page?: number;
  pageSize?: number;
}

export interface LastLoginResponse {
  lastLogin: LoginHistoryEntry | null;
}

// --------- WebAuthn Types ---------
export interface WebAuthnRegisterOptionsResponse {
  challengeId: string;
  options: any; // PublicKeyCredentialCreationOptionsJSON
}

export interface WebAuthnRegisterVerifyRequest {
  challengeId: string;
  response: any; // RegistrationResponseJSON from startRegistration()
  nickname?: string;
}

export interface WebAuthnRegisterVerifyResponse {
  message: string;
  credential: {
    id: string;
    nickname: string | null;
    deviceType: string;
    createdAt: string;
  };
}

export interface WebAuthnLoginOptionsRequest {
  email?: string;
  phone?: string;
}

export interface WebAuthnLoginOptionsResponse {
  challengeId: string;
  options: any; // PublicKeyCredentialRequestOptionsJSON
}

export interface WebAuthnLoginVerifyRequest {
  challengeId: string;
  response: any; // AuthenticationResponseJSON from startAuthentication()
}

export interface WebAuthnCredentialSummary {
  id: string;
  nickname: string | null;
  deviceType: string;
  backedUp: boolean;
  transports: string[];
  createdAt: string;
  lastUsedAt: string | null;
}

export interface WebAuthnCredentialsResponse {
  credentials: WebAuthnCredentialSummary[];
}

// --------- Auth API ---------
export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Auth", "LoginHistory", "WebAuthnCredential","Me"],
  endpoints: (builder) => ({
    register: builder.mutation<{ message: string }, RegisterRequest>({
      query: (body) => ({
        url: "/auth/register",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Auth"],
    }),

    verifyEmail: builder.mutation<AuthResponse, VerifyEmailRequest>({
      query: (body) => ({
        url: "/auth/verify-email",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Auth"],
    }),

    verifyOtp: builder.mutation<AuthResponse, VerifyOtpRequest>({
      query: (body) => ({
        url: "/auth/verify-otp",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Auth"],
    }),

    login: builder.mutation<AuthResponse, LoginRequest>({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
      }),
      invalidatesTags: ["Auth", "LoginHistory"],
    }),

    socialLogin: builder.mutation<AuthResponse, SocialLoginRequest>({
      query: (credentials) => ({
        url: "/auth/social-login",
        method: "POST",
        body: credentials,
      }),
      invalidatesTags: ["Auth", "LoginHistory"],
    }),

    refresh: builder.query<{ accessToken: string }, void>({
      query: () => ({
        url: "/auth/refresh",
        method: "GET",
      }),
    }),

    logout: builder.mutation<{ message: string }, void>({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
      invalidatesTags: ["Auth"],
    }),

    forgotPassword: builder.mutation<{ message: string }, ForgotPasswordRequest>({
      query: (body) => ({
        url: "/auth/forgot-password",
        method: "POST",
        body,
      }),
    }),

    // ✅ FIX: Added missing < >
    verifyResetToken: builder.mutation<
      {
        message: string;
        email?: string;
        phone?: string;
        type: "email" | "phone";
      },
      VerifyResetTokenRequest
    >({
      query: (body) => ({
        url: "/auth/verify-reset-token",
        method: "POST",
        body,
      }),
    }),

    resetPassword: builder.mutation<{ message: string }, ResetPasswordRequest>({
      query: (body) => ({
        url: "/auth/reset-password",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Auth"],
    }),

    changePassword: builder.mutation<{ message: string }, ChangePasswordRequest>({
      query: (body) => ({
        url: "/auth/change-password",
        method: "POST",
        body,
      }),
    }),

    // --------- Login History ---------
    getLoginHistory: builder.query<LoginHistoryResponse, LoginHistoryQuery | void>({
      query: (params) => ({
        url: "/auth/login-history",
        method: "GET",
        params: {
          page: params?.page ?? 1,
          pageSize: params?.pageSize ?? 20,
        },
      }),
      providesTags: ["LoginHistory"],
    }),

    getLastLogin: builder.query<LastLoginResponse, void>({
      query: () => ({
        url: "/auth/last-login",
        method: "GET",
      }),
      providesTags: ["LoginHistory"],
    }),

    // --------- WebAuthn: register a passkey (must already be logged in) ---------
    webauthnRegisterOptions: builder.mutation<WebAuthnRegisterOptionsResponse, void>({
      query: () => ({
        url: "/webauthn/register/options",
        method: "POST",
      }),
    }),

    // ✅ FIX: Added missing < >
    webauthnRegisterVerify: builder.mutation<
      WebAuthnRegisterVerifyResponse,
      WebAuthnRegisterVerifyRequest
    >({
      query: (body) => ({
        url: "/webauthn/register/verify",
        method: "POST",
        body,
      }),
      invalidatesTags: ["WebAuthnCredential"],
    }),

    // --------- WebAuthn: passwordless login ---------
    // ✅ FIX: Added missing < >
    webauthnLoginOptions: builder.mutation<
      WebAuthnLoginOptionsResponse,
      WebAuthnLoginOptionsRequest | void
    >({
      query: (body) => ({
        url: "/webauthn/login/options",
        method: "POST",
        body: body ?? {},
      }),
    }),

    webauthnLoginVerify: builder.mutation<AuthResponse, WebAuthnLoginVerifyRequest>({
      query: (body) => ({
        url: "/webauthn/login/verify",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Auth", "LoginHistory"],
    }),

    // --------- WebAuthn: credential management ---------
    getWebauthnCredentials: builder.query<WebAuthnCredentialsResponse, void>({
      query: () => ({
        url: "/webauthn/credentials",
        method: "GET",
      }),
      providesTags: ["WebAuthnCredential"],
    }),

    removeWebauthnCredential: builder.mutation<{ message: string }, string>({
      query: (credentialId) => ({
        url: `/webauthn/credentials/${credentialId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["WebAuthnCredential"],
    }),
    // Called once per page load / after login. Never cache this in
    // localStorage as a source of truth — always re-fetch from the server,
    // since an admin can revoke a permission at any time.
    getMe: builder.query<{ success: boolean; data: CurrentUser }, void>({
      query: () => "/auth/me",
      providesTags: ["Me"],
    }),
  }),
   
});

// --------- Export Hooks ---------
export const {
  useRegisterMutation,
  useVerifyEmailMutation,
  useVerifyOtpMutation,
  useLoginMutation,
  useSocialLoginMutation,
  useRefreshQuery,
  useLogoutMutation,
  useForgotPasswordMutation,
  useVerifyResetTokenMutation,
  useResetPasswordMutation,
  useChangePasswordMutation,
  useGetLoginHistoryQuery,
  useGetLastLoginQuery,
  useWebauthnRegisterOptionsMutation,
  useWebauthnRegisterVerifyMutation,
  useWebauthnLoginOptionsMutation,
  useWebauthnLoginVerifyMutation,
  useGetWebauthnCredentialsQuery,
  useRemoveWebauthnCredentialMutation,
  useGetMeQuery,
} = authApi;