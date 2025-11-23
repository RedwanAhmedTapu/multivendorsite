// features/authApi.ts
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import baseQueryWithReauth from "./baseQueryWithReauth";

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
    id: number;
    name?: string;
    email?: string;
    phone?: string;
    role: string;
  };
  accessToken?: string;
  message?: string;
}
export interface ForgotPasswordRequest {
  email?: string;
  phone?: string;
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
// --------- Auth API ---------
export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Auth"],
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
      invalidatesTags: ["Auth"],
    }),

    socialLogin: builder.mutation<AuthResponse, SocialLoginRequest>({
      query: (credentials) => ({
        url: "/auth/social-login",
        method: "POST",
        body: credentials,
      }),
      invalidatesTags: ["Auth"],
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
    forgotPassword: builder.mutation<
      { message: string },
      ForgotPasswordRequest
    >({
      query: (body) => ({
        url: "/auth/forgot-password",
        method: "POST",
        body,
      }),
    }),

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
} = authApi;
