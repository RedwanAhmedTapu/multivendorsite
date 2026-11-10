// src/redux/adminPaymentProviderApi.ts
//
// Admin-only endpoints for managing payment gateway providers
// (SSLCommerz, EPS, ...). Kept separate from paymentApi.ts on purpose:
// paymentApi.ts is the storefront/customer-facing surface (checkout,
// refund requests, order payment status) and never touches credentials.
// This file is the admin console surface — every call here can read or
// write gateway secrets and must sit behind an admin-authenticated route,
// exactly like adminFraudProviderApi.ts does for fraud-checker providers.
import { createApi } from "@reduxjs/toolkit/query/react";
import baseQueryWithReauth from "./baseQueryWithReauth";

// ------- Types -------

export type PaymentAuthType = "BASIC" | "TOKEN";
export type PaymentEnvironment = "SANDBOX" | "PRODUCTION";

export interface PaymentCredential {
  id: string;
  paymentProviderId: string;
  environment: PaymentEnvironment;
  // BASIC (SSLCommerz-style)
  storeId: string | null;
  storePassword: string | null;
  // TOKEN (EPS-style)
  merchantId: string | null; // NEW — EPS also requires this alongside storeId, both merchant-level constants
  username: string | null;
  password: string | null;
  hashKey: string | null;
  accessToken: string | null;
  tokenExpiresAt: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentProvider {
  id: string;
  name: string;
  slug: string;
  displayName: string | null;
  description: string | null;
  logo: string | null;
  isActive: boolean;
  sandboxBaseUrl: string | null;
  productionBaseUrl: string;
  authType: PaymentAuthType;
  priority: number;
  createdAt: string;
  updatedAt: string;
  payment_credentials: PaymentCredential[];
}

export interface GetPaymentProvidersResponse {
  success: true;
  data: PaymentProvider[];
}

// ---- Create provider ----

export interface CreatePaymentProviderDto {
  name: string; // e.g. "SSLCOMMERZ" | "EPS" — becomes the row's id/slug
  displayName?: string;
  description?: string;
  logo?: string;
  sandboxBaseUrl?: string;
  productionBaseUrl: string;
  authType: PaymentAuthType;
  priority?: number;
}

export interface CreatePaymentProviderResponse {
  success: true;
  data: PaymentProvider;
}

// ---- Upsert credential (per provider + environment) ----

export interface UpsertPaymentCredentialDto {
  providerId: string;
  environment: PaymentEnvironment;
  // BASIC
  storeId?: string;
  storePassword?: string;
  // TOKEN — EPS needs both merchantId and storeId (see eps.service.ts);
  // for SSLCommerz-style BASIC gateways storeId above is reused and
  // merchantId is simply left unset.
  merchantId?: string; // NEW
  username?: string;
  password?: string;
  hashKey?: string;
}

export interface UpsertPaymentCredentialResponse {
  success: true;
  data: PaymentCredential;
}

// ---- Activate / deactivate ----

export interface ActivatePaymentProviderResponse {
  success: true;
  message: string;
}

export interface DeactivatePaymentProviderResponse {
  success: true;
  data: PaymentProvider;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
}

// ------- API -------

export const adminPaymentProviderApi = createApi({
  reducerPath: "adminPaymentProviderApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["PaymentProvider"],

  endpoints: (builder) => ({
    // ------- List every configured gateway -------
    getPaymentProviders: builder.query<GetPaymentProvidersResponse, void>({
      query: () => "/payment/admin/providers",
      providesTags: (result) =>
        result
          ? [
              ...result.data.map((p) => ({ type: "PaymentProvider" as const, id: p.id })),
              { type: "PaymentProvider" as const, id: "LIST" },
            ]
          : [{ type: "PaymentProvider" as const, id: "LIST" }],
    }),

    // ------- Register a new gateway (created inactive) -------
    createPaymentProvider: builder.mutation<CreatePaymentProviderResponse, CreatePaymentProviderDto>({
      query: (body) => ({
        url: "/payment/admin/providers",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "PaymentProvider", id: "LIST" }],
    }),

    // ------- Set/rotate credentials for one environment -------
    upsertPaymentCredential: builder.mutation<UpsertPaymentCredentialResponse, UpsertPaymentCredentialDto>({
      query: ({ providerId, ...body }) => ({
        url: `/payment/admin/providers/${providerId}/credentials`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { providerId }) => [{ type: "PaymentProvider", id: providerId }, { type: "PaymentProvider", id: "LIST" }],
    }),

    // ------- Activate one gateway (deactivates every other one server-side) -------
    activatePaymentProvider: builder.mutation<ActivatePaymentProviderResponse, string>({
      query: (providerId) => ({
        url: `/payment/admin/providers/${providerId}/activate`,
        method: "PATCH",
      }),
      invalidatesTags: [{ type: "PaymentProvider", id: "LIST" }],
    }),

    // ------- Deactivate a gateway -------
    deactivatePaymentProvider: builder.mutation<DeactivatePaymentProviderResponse, string>({
      query: (providerId) => ({
        url: `/payment/admin/providers/${providerId}/deactivate`,
        method: "PATCH",
      }),
      invalidatesTags: (result, error, providerId) => [{ type: "PaymentProvider", id: providerId }, { type: "PaymentProvider", id: "LIST" }],
    }),
  }),
});

// ------- Export hooks -------
export const {
  useGetPaymentProvidersQuery,
  useCreatePaymentProviderMutation,
  useUpsertPaymentCredentialMutation,
  useActivatePaymentProviderMutation,
  useDeactivatePaymentProviderMutation,
} = adminPaymentProviderApi;