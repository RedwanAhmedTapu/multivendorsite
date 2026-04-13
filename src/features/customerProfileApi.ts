import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query";
import baseQueryWithReauth from "./baseQueryWithReauth";

/* ==================== ENUM TYPES ==================== */

export enum Gender {
  MALE   = "MALE",
  FEMALE = "FEMALE",
  OTHER  = "OTHER",
}

/* ==================== BASE TYPES ==================== */

export interface CustomerProfileData {
  id: string;
  profileImage: string | null;
  gender: Gender | null;
  dateOfBirth: string | null;
  wallet: number;
  loyaltyPoints: number;
  isVerifiedBySocialMedia: boolean;
}

export interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  isVerified: boolean;
  provider: string | null;
  createdAt: string;
  customerProfile: CustomerProfileData | null;
}

/* ==================== REQUEST TYPES ==================== */

export interface UpdateProfileRequest {
  name?: string;
  gender?: Gender;
  dateOfBirth?: string;
}

export interface RequestEmailChangeRequest {
  newEmail: string;
}

export interface VerifyEmailChangeRequest {
  token: string;
}

export interface RequestPhoneChangeRequest {
  newPhone: string;
}

export interface VerifyPhoneChangeRequest {
  newPhone: string;
  otp: string;
}

/* ==================== RESPONSE TYPES ==================== */

export type ProfileResponse  = ApiResponse<UserProfile>;
export type MessageResponse  = { success: boolean; message: string };

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

/* ==================== API ==================== */

export const customerProfileApi = createApi({
  reducerPath: "customerProfileApi",
  baseQuery: baseQueryWithReauth as BaseQueryFn<
    string | FetchArgs,
    unknown,
    FetchBaseQueryError
  >,
  tagTypes: ["CustomerProfile"] as const,

  endpoints: (builder) => ({

    /* -------------------- Profile -------------------- */

    getProfile: builder.query<ProfileResponse, void>({
      query: () => "/customer/profile",
      providesTags: [{ type: "CustomerProfile" as const, id: "ME" }],
    }),

    updateProfile: builder.mutation<ProfileResponse, UpdateProfileRequest>({
      query: (data) => ({
        url: "/customer/profile",
        method: "PUT",
        body: data,
      }),
      invalidatesTags: [{ type: "CustomerProfile" as const, id: "ME" }],
    }),

    /* -------------------- Avatar -------------------- */

    uploadAvatar: builder.mutation<ProfileResponse, FormData>({
      query: (formData) => ({
        url: "/customer/profile/avatar",
        method: "POST",
        body: formData,
        formData: true,
      }),
      invalidatesTags: [{ type: "CustomerProfile" as const, id: "ME" }],
    }),

    deleteAvatar: builder.mutation<ProfileResponse, void>({
      query: () => ({
        url: "/customer/profile/avatar",
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "CustomerProfile" as const, id: "ME" }],
    }),

    /* -------------------- Email change -------------------- */

    requestEmailChange: builder.mutation<MessageResponse, RequestEmailChangeRequest>({
      query: (data) => ({
        url: "/customer/profile/request-email-change",
        method: "POST",
        body: data,
      }),
    }),

    verifyEmailChange: builder.mutation<ProfileResponse, VerifyEmailChangeRequest>({
      query: (data) => ({
        url: "/customer/profile/verify-email-change",
        method: "POST",
        body: data,
      }),
      invalidatesTags: [{ type: "CustomerProfile" as const, id: "ME" }],
    }),

    /* -------------------- Phone change -------------------- */

    requestPhoneChange: builder.mutation<MessageResponse, RequestPhoneChangeRequest>({
      query: (data) => ({
        url: "/customer/profile/request-phone-change",
        method: "POST",
        body: data,
      }),
    }),

    verifyPhoneChange: builder.mutation<ProfileResponse, VerifyPhoneChangeRequest>({
      query: (data) => ({
        url: "/customer/profile/verify-phone-change",
        method: "POST",
        body: data,
      }),
      invalidatesTags: [{ type: "CustomerProfile" as const, id: "ME" }],
    }),
  }),
});

/* ==================== EXPORT HOOKS ==================== */

export const {
  useGetProfileQuery,
  useLazyGetProfileQuery,
  useUpdateProfileMutation,
  useUploadAvatarMutation,
  useDeleteAvatarMutation,
  useRequestEmailChangeMutation,
  useVerifyEmailChangeMutation,
  useRequestPhoneChangeMutation,
  useVerifyPhoneChangeMutation,
} = customerProfileApi;

export default customerProfileApi;