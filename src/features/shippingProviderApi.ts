// src/redux/shippingProviderApi.ts
import { createApi } from "@reduxjs/toolkit/query/react";
import baseQueryWithReauth from "./baseQueryWithReauth";

// ------- Types -------
export interface ShippingProvider {
  id: string;
  name: string;
  baseUrl: string;
  config?: any;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateShippingProvider {
  name: string;
  baseUrl: string;
  config?: any;
}

// For location data
export interface City {
  city_id: number;
  city_name: string;
}
export interface Zone {
  zone_id: number;
  zone_name: string;
}
export interface Area {
  area_id: number;
  area_name: string;
  home_delivery_available: boolean;
  pickup_available: boolean;
}

// Balance
export interface BalanceInfo {
  balance: number;
  currency?: string;
}

// Stores
export interface Store {
  id: number;
  name: string;
  address?: string;
}

// Orders
export interface Order {
  trackingId: string;
  status: string;
  [key: string]: any;
}
export interface CreateOrderPayload {
  provider: string;
  [key: string]: any;
}
export interface CalculateCostPayload {
  provider: string;
  [key: string]: any;
}

// ------- API -------
export const shippingProviderApi = createApi({
  reducerPath: "shippingProviderApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["ShippingProviders", "CourierData", "Orders"],

  endpoints: (builder) => ({
    // ------- Provider CRUD -------
    getProviders: builder.query<ShippingProvider[], void>({
      query: () => "/shippingapi",
      providesTags: ["ShippingProviders"],
    }),

    getActiveProvider: builder.query<ShippingProvider, void>({
      query: () => "/shippingapi/active",
    }),

    createProvider: builder.mutation<ShippingProvider, CreateShippingProvider>({
      query: (body) => ({
        url: "/shippingapi",
        method: "POST",
        body,
      }),
      invalidatesTags: ["ShippingProviders"],
    }),

    updateProvider: builder.mutation<
      ShippingProvider,
      { id: string; data: Partial<CreateShippingProvider> }
    >({
      query: ({ id, data }) => ({
        url: `/shippingapi/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "ShippingProviders", id },
        "ShippingProviders",
      ],
    }),

    activateProvider: builder.mutation<ShippingProvider, string>({
      query: (id) => ({
        url: `/shippingapi/${id}/activate`,
        method: "PATCH",
      }),
      invalidatesTags: ["ShippingProviders"],
    }),

    deactivateProvider: builder.mutation<ShippingProvider, string>({
      query: (id) => ({
        url: `/shippingapi/${id}/deactivate`,
        method: "PATCH",
      }),
      invalidatesTags: ["ShippingProviders"],
    }),

    deleteProvider: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/shippingapi/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["ShippingProviders"],
    }),

    // ------- Courier API (3rd Party Providers like Pathao, REDX, etc.) -------

    // Get cities
    getCities: builder.query<City[], string>({
      query: (provider) => `/courier/${provider}/cities`,
      transformResponse: (response: { success: boolean; cities: City[] }) =>
        response.cities,
      providesTags: ["CourierData"],
    }),

    // Get zones by cityId
    getZones: builder.query<Zone[], { provider: string; cityId: number }>({
      query: ({ provider, cityId }) =>
        `/courier/${provider}/zones?cityId=${cityId}`,
      transformResponse: (response: { success: boolean; zones: Zone[] }) =>
        response.zones,
      providesTags: ["CourierData"],
    }),

    // Get areas by zoneId
    getAreas: builder.query<Area[], { provider: string; zoneId: number }>({
      query: ({ provider, zoneId }) =>
        `/courier/${provider}/areas?zoneId=${zoneId}`,
      transformResponse: (response: { success: boolean; areas: Area[] }) =>
        response.areas,
      providesTags: ["CourierData"],
    }),

    // Get balance
    getBalance: builder.query<BalanceInfo, string>({
      query: (provider) => `/courier/${provider}/balance`,
      providesTags: ["CourierData"],
    }),

    // Get pickup stores
    getStores: builder.query<Store[], string>({
      query: (provider) => `/courier/${provider}/stores`,
      providesTags: ["CourierData"],
    }),

    // ------- Orders -------
    createOrder: builder.mutation<Order, CreateOrderPayload>({
      query: (body) => ({
        url: `/courier/create-order`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Orders"],
    }),

    calculateCost: builder.mutation<any, CalculateCostPayload>({
      query: (body) => ({
        url: `/courier/calculate-cost`,
        method: "POST",
        body,
      }),
    }),

    trackOrder: builder.query<Order, { provider: string; trackingId: string }>({
      query: ({ provider, trackingId }) =>
        `/courier/${provider}/track/${trackingId}`,
      providesTags: ["Orders"],
    }),

    batchTrackOrders: builder.mutation<Order[], { trackingIds: string[] }>({
      query: (body) => ({
        url: `/courier/batch-track`,
        method: "POST",
        body,
      }),
    }),
  }),
});

// ------- Export hooks -------
export const {
  // Provider CRUD
  useGetProvidersQuery,
  useGetActiveProviderQuery,
  useCreateProviderMutation,
  useUpdateProviderMutation,
  useActivateProviderMutation,
  useDeactivateProviderMutation,
  useDeleteProviderMutation,

  // Courier data
  useGetCitiesQuery,
  useGetZonesQuery,
  useGetAreasQuery,
  useGetBalanceQuery,
  useGetStoresQuery,

  // Orders
  useCreateOrderMutation,
  useCalculateCostMutation,
  useTrackOrderQuery,
  useBatchTrackOrdersMutation,
} = shippingProviderApi;
