// src/api/userAddressApi.ts
import { createApi } from "@reduxjs/toolkit/query/react";
import baseQueryWithReauth from "./baseQueryWithReauth";

/* ==================== REQUEST TYPES ==================== */

export interface CreateAddressRequest {
  locationId: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  isDefault?: boolean;
  addressType?: AddressType;
}

export interface UpdateAddressRequest {
  locationId?: string;
  fullName?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  landmark?: string;
  isDefault?: boolean;
  addressType?: AddressType;
}

export interface UpsertAddressRequest {
  id?: string;
  locationId: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  isDefault?: boolean;
  addressType?: AddressType;
}

export interface AddressFilters {
  isDefault?: boolean;
}

/* ==================== RESPONSE TYPES ==================== */

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: {
    total?: number;
    maxAllowed?: number;
  };
}

export interface AddressCountResponse {
  count: number;
  maxAllowed: number;
  canAddMore: boolean;
}

/* ---------- ENUM TYPES ---------- */
export enum AddressType {
  HOME = "HOME",
  WORK = "WORK",
  OTHER = "OTHER",
}

/* ---------- BASE TYPES ---------- */
export interface User {
  id: string;
  email: string;
  name: string | null;
  // Add other user fields as needed
}

export interface Location {
  id: string;
  name: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  // Add other location fields as needed
}

export interface UserAddress {
  id: string;
  userId: string;
  locationId: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  landmark: string | null;
  isDefault: boolean;
  addressType: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  locations?: Location;
  users?: User;
}

/* ==================== API ==================== */

export const userAddressApi = createApi({
  reducerPath: "userAddressApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["UserAddress", "UserAddressList", "DefaultAddress", "AddressCount"],

  endpoints: (builder) => ({
    /* ==================== ADDRESS ENDPOINTS ==================== */

    // Upsert address (create or update)
    upsertAddress: builder.mutation<
      ApiResponse<UserAddress>,
      UpsertAddressRequest
    >({
      query: (data) => ({
        url: `/user-address/addresses/upsert`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: [
        "UserAddressList",
        "DefaultAddress",
        "AddressCount",
        { type: "UserAddress", id: "LIST" },
      ],
    }),

    // Get all addresses for the authenticated user
    getAddresses: builder.query<
      ApiResponse<UserAddress[]>,
      { filters?: AddressFilters } | void
    >({
      query: (args) => {
        const filters = args?.filters || {};
        const params = new URLSearchParams();

        if (filters.isDefault !== undefined)
          params.append("isDefault", filters.isDefault.toString());

        const queryString = params.toString();
        return `/user-address/addresses${queryString ? `?${queryString}` : ""}`;
      },
      providesTags: (result) => [
        "UserAddressList",
        { type: "UserAddress", id: "LIST" },
        ...(result?.data?.map((address) => ({
          type: "UserAddress" as const,
          id: address.id,
        })) || []),
      ],
    }),

    // Get default address
    getDefaultAddress: builder.query<ApiResponse<UserAddress>, void>({
      query: () => `/user-address/addresses/default`,
      providesTags: ["DefaultAddress", { type: "UserAddress", id: "DEFAULT" }],
    }),

    // Get address count
    getAddressCount: builder.query<ApiResponse<AddressCountResponse>, void>({
      query: () => `/user-address/addresses/count`,
      providesTags: ["AddressCount"],
    }),

    // Get specific address by id
    getAddressById: builder.query<ApiResponse<UserAddress>, { id: string }>({
      query: ({ id }) => `/user-address/addresses/${id}`,
      providesTags: (result, error, { id }) => [
        { type: "UserAddress", id },
      ],
    }),

    // Create new address
    createAddress: builder.mutation<
      ApiResponse<UserAddress>,
      CreateAddressRequest
    >({
      query: (data) => ({
        url: `/user-address/addresses`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: [
        "UserAddressList",
        "DefaultAddress",
        "AddressCount",
        { type: "UserAddress", id: "LIST" },
      ],
    }),

    // Update address
    updateAddress: builder.mutation<
      ApiResponse<UserAddress>,
      { id: string; data: UpdateAddressRequest }
    >({
      query: ({ id, data }) => ({
        url: `/user-address/addresses/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "UserAddress", id },
        "UserAddressList",
        "DefaultAddress",
      ],
    }),

    // Delete address
    deleteAddress: builder.mutation<ApiResponse<null>, { id: string }>({
      query: ({ id }) => ({
        url: `/user-address/addresses/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "UserAddress", id },
        "UserAddressList",
        "DefaultAddress",
        "AddressCount",
      ],
    }),

    // Set address as default
    setDefaultAddress: builder.mutation<ApiResponse<UserAddress>, { id: string }>({
      query: ({ id }) => ({
        url: `/user-address/addresses/${id}/set-default`,
        method: "PATCH",
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "UserAddress", id },
        "UserAddressList",
        "DefaultAddress",
      ],
    }),

    // Toggle address as default
    toggleDefaultAddress: builder.mutation<ApiResponse<UserAddress>, { id: string }>({
      query: ({ id }) => ({
        url: `/user-address/addresses/${id}/toggle-default`,
        method: "PATCH",
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "UserAddress", id },
        "UserAddressList",
        "DefaultAddress",
      ],
    }),
  }),
});

/* ==================== EXPORT HOOKS ==================== */

export const {
  // Address hooks
  useUpsertAddressMutation,
  useGetAddressesQuery,
  useLazyGetAddressesQuery,
  useGetDefaultAddressQuery,
  useLazyGetDefaultAddressQuery,
  useGetAddressCountQuery,
  useLazyGetAddressCountQuery,
  useGetAddressByIdQuery,
  useLazyGetAddressByIdQuery,
  useCreateAddressMutation,
  useUpdateAddressMutation,
  useDeleteAddressMutation,
  useSetDefaultAddressMutation,
  useToggleDefaultAddressMutation,
} = userAddressApi;

// Export the API reducer and middleware
export default userAddressApi;