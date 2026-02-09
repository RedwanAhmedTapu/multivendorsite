// features/courierApi.ts
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import baseQueryWithReauth from "./baseQueryWithReauth";

// ==================== COMMON TYPES ====================

export type Environment = "SANDBOX" | "PRODUCTION";
export type DeliveryType = "NORMAL" | "EXPRESS";
export type CourierAuthType = "BEARER" | "OAUTH2" | "API_KEY" | "BASIC";

// ==================== PROVIDER TYPES ====================

export interface CourierProvider {
  id: string;
  name: string;
  slug: string;
  displayName?: string;
  description?: string;
  logo?: string;
  isActive: boolean;
  sandboxBaseUrl?: string;
  productionBaseUrl: string;
  authType: CourierAuthType;
  supportsCOD: boolean;
  supportsTracking: boolean;
  supportsBulkOrder: boolean;
  supportsWebhook: boolean;
  priority: number;
  isPreferred: boolean;
  statusMappings: any;
  createdAt: string;
  updatedAt: string;
  courier_credentials?: CourierCredential[];
  _count?: {
    courier_orders: number;
    courier_serviceable_areas: number;
    courier_credentials: number;
  };
}

export interface CreateProviderRequest {
  name: string;
  displayName?: string;
  description?: string;
  logo?: string;
  sandboxBaseUrl?: string;
  productionBaseUrl: string;
  authType: CourierAuthType;
  supportsCOD?: boolean;
  supportsTracking?: boolean;
  supportsBulkOrder?: boolean;
  supportsWebhook?: boolean;
  priority?: number;
  isPreferred?: boolean;
  statusMappings?: any;
}

export interface UpdateProviderRequest {
  providerId: string;
  name?: string;
  displayName?: string;
  description?: string;
  logo?: string;
  sandboxBaseUrl?: string;
  productionBaseUrl?: string;
  authType?: CourierAuthType;
  supportsCOD?: boolean;
  supportsTracking?: boolean;
  supportsBulkOrder?: boolean;
  supportsWebhook?: boolean;
  priority?: number;
  isPreferred?: boolean;
  isActive?: boolean;
  statusMappings?: any;
}

export interface GetProvidersRequest {
  isActive?: boolean;
  authType?: CourierAuthType;
  includeCredentials?: boolean;
}

// ==================== CREDENTIAL TYPES ====================

export interface CourierCredential {
  id: string;
  courierProviderId: string;
  vendorId: string | null;
  environment: Environment;
  clientId?: string;
  clientSecret?: string;
  username?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: string;
  apiKey?: string;
  bearerToken?: string;
  storeId?: string;
  merchantId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  courier_providers?: CourierProvider;
  vendors?: {
    id: string;
    businessName: string;
    email: string;
  };
}

export interface CreateCredentialsRequest {
  courierProviderId: string;
  environment: Environment;
  clientId?: string;
  clientSecret?: string;
  username?: string;
  password?: string;
  apiKey?: string;
  bearerToken?: string;
  storeId?: string;
  merchantId?: string;
  vendorId?: string | null;
}

export interface UpdateCredentialsRequest {
  credentialId: string;
  clientId?: string;
  clientSecret?: string;
  username?: string;
  password?: string;
  apiKey?: string;
  bearerToken?: string;
  storeId?: string;
  merchantId?: string;
  isActive?: boolean;
}

export interface GetCredentialsRequest {
  courierProviderId?: string;
  environment?: Environment;
  isActive?: boolean;
  vendorId?: string | null;
}

// ==================== SERVICEABLE AREAS TYPES ====================

export interface ServiceableArea {
  id: string;
  courierProviderId: string;
  locationId: string;
  courierCityId?: string;
  courierZoneId?: string;
  courierAreaId: string;
  courierCityName?: string;
  courierZoneName?: string;
  courierAreaName: string;
  homeDeliveryAvailable: boolean;
  pickupAvailable: boolean;
  rawData?: any;
  lastSyncedAt: string;
  isActive: boolean;
  courier_providers?: {
    id: string;
    name: string;
    displayName: string;
  };
  locations?: {
    id: string;
    name: string;
    name_local?: string;
    level: string;
  };
}

export interface GetServiceableAreasRequest {
  courierProviderId?: string;
  locationId?: string;
  homeDeliveryAvailable?: boolean;
  pickupAvailable?: boolean;
  isActive?: boolean;
  search?: string;
}

export interface SyncServiceableAreasRequest {
  courierProviderId: string;
  areas: Array<{
    locationId: string;
    courierCityId?: string;
    courierZoneId?: string;
    courierAreaId: string;
    courierCityName?: string;
    courierZoneName?: string;
    courierAreaName: string;
    homeDeliveryAvailable?: boolean;
    pickupAvailable?: boolean;
    rawData?: any;
  }>;
}

// ==================== PATHAO TYPES ====================

export interface PathaoGetCitiesRequest {
  courierProviderId: string;
  environment?: Environment;
}

export interface PathaoGetZonesRequest {
  courierProviderId: string;
  cityId: number;
  environment?: Environment;
}

export interface PathaoGetAreasRequest {
  courierProviderId: string;
  zoneId: number;
  environment?: Environment;
}

export interface PathaoGetStoresRequest {
  courierProviderId: string;
  environment?: Environment;
}

export interface PathaoCreateStoreRequest {
  courierProviderId: string;
  environment?: Environment;
  storeData: {
    name: string;
    contact_name: string;
    contact_number: string;
    secondary_contact?: string;
    address: string;
    city_id: number;
    zone_id: number;
    area_id: number;
  };
}

export interface PathaoCity {
  city_id: number;
  city_name: string;
}

export interface PathaoCitiesResponse {
  message: string;
  type: string;
  code: number;
  data: {
    data: PathaoCity[];
  };
}

export interface PathaoZone {
  zone_id: number;
  zone_name: string;
  city_id: number;
}

export interface PathaoZonesResponse {
  message: string;
  type: string;
  code: number;
  data: {
    data: PathaoZone[];
  };
}

export interface PathaoArea {
  area_id: number;
  area_name: string;
  zone_id: number;
  city_id: number;
  home_delivery_available: boolean;
  pickup_available: boolean;
}

export interface PathaoAreasResponse {
  message: string;
  type: string;
  code: number;
  data: {
    data: PathaoArea[];
  };
}

export interface PathaoStore {
  store_id: number;
  store_name: string;
  store_address: string;
  contact_name: string;
  contact_number: string;
  city_id: number;
  zone_id: number;
  area_id: number;
}

export interface PathaoStoresResponse {
  message: string;
  type: string;
  code: number;
  data: {
    data: PathaoStore[];
  };
}

export interface PathaoOrderInfo {
  consignment_id: string;
  merchant_order_id?: string;
  order_status: string;
  order_status_slug: string;
  updated_at: string;
  invoice_id?: string;
}

export interface PathaoOrderInfoResponse {
  message: string;
  type: string;
  code: number;
  data: PathaoOrderInfo;
}

// ==================== REDX TYPES ====================

export interface RedXGetAreasRequest {
  courierProviderId: string;
  environment?: Environment;
  post_code?: number;
  district_name?: string;
}

export interface RedXGetStoresRequest {
  courierProviderId: string;
  environment?: Environment;
}

export interface RedXCreateStoreRequest {
  courierProviderId: string;
  environment?: Environment;
  storeData: {
    name: string;
    phone: string;
    address: string;
    area_id: number;
  };
}

export interface RedXArea {
  id: number;
  name: string;
  post_code: number;
  division_name: string;
  district_name: string;
  zone_id: number;
}

export interface RedXAreasResponse {
  areas: RedXArea[];
}

export interface RedXStore {
  id: number;
  name: string;
  phone: string;
  address: string;
  area_id: number;
}

export interface RedXStoresResponse {
  stores: RedXStore[];
}

export interface RedXTrackingUpdate {
  message_en: string;
  message_bn: string;
  time: string;
}

export interface RedXTrackingResponse {
  tracking: RedXTrackingUpdate[];
}

// ==================== ORDER TYPES ====================

export interface CreateCourierOrderRequest {
  orderId: number;
  vendorId: string;
  orderDetails: {
    recipientName: string;
    recipientPhone: string;
    recipientSecondaryPhone?: string;
    recipientAddress: string;
    recipientLocationId: string;
    vendorWarehouseLocationId: string;
    itemDescription: string;
    itemQuantity: number;
    itemWeight: number;
    codAmount: number;
    deliveryType: DeliveryType;
    specialInstructions?: string;
    itemValue?: number;
  };
}

export interface GetCourierQuoteRequest {
  vendorWarehouseLocationId: string;
  customerDeliveryLocationId: string;
  orderWeight: number;
  codAmount?: number;
  deliveryType?: DeliveryType;
}

export interface VendorMarkReadyRequest {
  orderId: number;
  vendorId: string;
}

export interface GetShippingLabelRequest {
  orderId: number;
  vendorId?: string;
}

export interface GetVendorOrdersRequest {
  vendorId: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface TrackOrderRequest {
  trackingId: string;
}

export interface GetOrdersByOrderIdRequest {
  orderId: number;
}

export interface PathaoGetOrderInfoRequest {
  courierProviderId: string;
  consignmentId: string;
  environment?: Environment;
}

export interface RedXTrackParcelRequest {
  courierProviderId: string;
  trackingId: string;
  environment?: Environment;
}

export interface CourierPricing {
  courierProviderId: string;
  courierName: string;
  deliveryCharge: number;
  codCharge: number;
  totalCharge: number;
  estimatedDeliveryDays: number;
}

export interface CourierSelection {
  courierProviderId: string;
  courierName: string;
  pricing: CourierPricing;
}

export interface CourierOrderResponse {
  courierOrder: {
    courierTrackingId: string;
    courierOrderId: string;
    courierName: string;
    dbRecord: any;
    [key: string]: any;
  };
  selectedCourier: CourierSelection;
}

export interface ShippingLabel {
  trackingId: string;
  orderId: string;
  courierName: string;
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  codAmount: number;
  weight: number;
  itemDescription: string;  
  barcode: string;
  createdAt: string;  
}

export interface CourierTrackingHistory {
  status: string;
  message: string;
  timestamp: string;
}

export interface PublicTrackingData {
  trackingId: string;
  courierName: string;
  status: string;
  courierStatus: string;
  recipientCity: string;
  trackingHistory: CourierTrackingHistory[];
}

export interface CourierOrder {
  id: string;
  orderId: number;
  courierProviderId: string;
  vendorId: string;
  courierTrackingId?: string;
  courierOrderId?: string;
  consignmentId?: string;
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  deliveryLocationId: string;
  itemType: string;
  deliveryType: string;
  itemWeight: number;
  itemQuantity: number;
  itemDescription?: string;
  specialInstruction?: string;
  codAmount: number;
  deliveryCharge: number;
  codCharge: number;
  totalCharge: number;
  status: string;
  courierStatus?: string;
  lastStatusUpdate?: string;
  createdAt: string;
  courier_providers?: any;
  vendors?: any;
  courier_tracking_history?: any[];
}

// ==================== WEBHOOK TYPES ====================

export interface PathaoWebhookRequest {
  consignment_id: string;
  merchant_order_id?: string;
  order_status: string;
  updated_at?: string;
  message?: string;
  [key: string]: any;
}

export interface RedXWebhookRequest {
  tracking_number: string;
  status: string;
  message_en?: string;
  message_bn?: string;
  timestamp?: string;
  [key: string]: any;
}

// ==================== RESPONSE TYPES ====================

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  count?: number;
  error?: string;
}

// ==================== COURIER API ====================

export const courierApi = createApi({
  reducerPath: "courierApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    "CourierProviders",
    "CourierProvider",
    "CourierCredentials",
    "CourierCredential",
    "ServiceableAreas",
    "PathaoCities",
    "PathaoZones",
    "PathaoAreas",
    "PathaoStores",
    "RedXAreas",
    "RedXStores",
    "CourierOrders",
    "VendorOrders",
    "OrderTracking",
    "ShippingLabels",
  ],
  endpoints: (builder) => ({
    // ==================== PROVIDER MANAGEMENT ENDPOINTS ====================

    /**
     * Get all courier providers
     * GET /api/courier/admin/providers
     */
    getCourierProviders: builder.query<ApiResponse<CourierProvider[]>, GetProvidersRequest | void>({
      query: (params) => ({
        url: "/courier/admin/providers",
        method: "GET",
        params: params || undefined,
      }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ id }) => ({ type: "CourierProviders" as const, id })),
              { type: "CourierProviders", id: "LIST" },
            ]
          : [{ type: "CourierProviders", id: "LIST" }],
    }),

    /**
     * Get single courier provider by ID
     * GET /api/courier/admin/providers/:providerId
     */
    getCourierProviderById: builder.query<ApiResponse<CourierProvider>, { providerId: string }>({
      query: ({ providerId }) => ({
        url: `/courier/admin/providers/${providerId}`,
        method: "GET",
      }),
      providesTags: (result, error, { providerId }) => [
        { type: "CourierProvider", id: providerId },
      ],
    }),

    /**
     * Create courier provider
     * POST /api/courier/admin/providers
     */
    createCourierProvider: builder.mutation<ApiResponse<CourierProvider>, CreateProviderRequest>({
      query: (body) => ({
        url: "/courier/admin/providers",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "CourierProviders", id: "LIST" }],
    }),

    /**
     * Update courier provider
     * PUT /api/courier/admin/providers/:providerId
     */
    updateCourierProvider: builder.mutation<ApiResponse<CourierProvider>, UpdateProviderRequest>({
      query: ({ providerId, ...body }) => ({
        url: `/courier/admin/providers/${providerId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { providerId }) => [
        { type: "CourierProviders", id: "LIST" },
        { type: "CourierProvider", id: providerId },
      ],
    }),

    /**
     * Delete courier provider
     * DELETE /api/courier/admin/providers/:providerId
     */
    deleteCourierProvider: builder.mutation<ApiResponse, { providerId: string }>({
      query: ({ providerId }) => ({
        url: `/courier/admin/providers/${providerId}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "CourierProviders", id: "LIST" }],
    }),

    /**
     * Toggle provider active status
     * PATCH /api/courier/admin/providers/:providerId/toggle
     */
    toggleProviderStatus: builder.mutation<ApiResponse<CourierProvider>, { providerId: string }>({
      query: ({ providerId }) => ({
        url: `/courier/admin/providers/${providerId}/toggle`,
        method: "PATCH",
      }),
      invalidatesTags: (result, error, { providerId }) => [
        { type: "CourierProviders", id: "LIST" },
        { type: "CourierProvider", id: providerId },
      ],
    }),

    // ==================== CREDENTIALS MANAGEMENT ENDPOINTS ====================

    /**
     * Get all credentials
     * GET /api/courier/admin/credentials
     */
    getAllCredentials: builder.query<ApiResponse<CourierCredential[]>, GetCredentialsRequest | void>({
      query: (params) => ({
        url: "/courier/admin/credentials",
        method: "GET",
        params: params || undefined,
      }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ id }) => ({ type: "CourierCredentials" as const, id })),
              { type: "CourierCredentials", id: "LIST" },
            ]
          : [{ type: "CourierCredentials", id: "LIST" }],
    }),

    /**
     * Get credential by ID
     * GET /api/courier/admin/credentials/:credentialId
     */
    getCredentialById: builder.query<ApiResponse<CourierCredential>, { credentialId: string }>({
      query: ({ credentialId }) => ({
        url: `/courier/admin/credentials/${credentialId}`,
        method: "GET",
      }),
      providesTags: (result, error, { credentialId }) => [
        { type: "CourierCredential", id: credentialId },
      ],
    }),

    /**
     * Create platform courier credentials
     * POST /api/courier/admin/credentials
     */
    createCourierCredentials: builder.mutation<
      ApiResponse<CourierCredential>,
      CreateCredentialsRequest
    >({
      query: (body) => ({
        url: "/courier/admin/credentials",
        method: "POST",
        body,
      }),
      invalidatesTags: [
        { type: "CourierProviders", id: "LIST" },
        { type: "CourierCredentials", id: "LIST" },
      ],
    }),

    /**
     * Update platform courier credentials
     * PUT /api/courier/admin/credentials/:credentialId
     */
    updateCourierCredentials: builder.mutation<
      ApiResponse<CourierCredential>,
      UpdateCredentialsRequest
    >({
      query: ({ credentialId, ...body }) => ({
        url: `/courier/admin/credentials/${credentialId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { credentialId }) => [
        { type: "CourierProviders", id: "LIST" },
        { type: "CourierCredentials", id: "LIST" },
        { type: "CourierCredential", id: credentialId },
      ],
    }),

    /**
     * Delete platform courier credentials
     * DELETE /api/courier/admin/credentials/:credentialId
     */
    deleteCourierCredentials: builder.mutation<ApiResponse, { credentialId: string }>({
      query: ({ credentialId }) => ({
        url: `/courier/admin/credentials/${credentialId}`,
        method: "DELETE",
      }),
      invalidatesTags: [
        { type: "CourierProviders", id: "LIST" },
        { type: "CourierCredentials", id: "LIST" },
      ],
    }),

    /**
     * Toggle credential active status
     * PATCH /api/courier/admin/credentials/:credentialId/toggle
     */
    toggleCredentialStatus: builder.mutation<
      ApiResponse<CourierCredential>,
      { credentialId: string }
    >({
      query: ({ credentialId }) => ({
        url: `/courier/admin/credentials/${credentialId}/toggle`,
        method: "PATCH",
      }),
      invalidatesTags: (result, error, { credentialId }) => [
        { type: "CourierCredentials", id: "LIST" },
        { type: "CourierCredential", id: credentialId },
      ],
    }),

    /**
     * Test courier credentials
     * POST /api/courier/admin/credentials/:credentialId/test
     */
    testCourierCredentials: builder.mutation<
      ApiResponse<{ courierName: string; environment: string }>,
      { credentialId: string }
    >({
      query: ({ credentialId }) => ({
        url: `/courier/admin/credentials/${credentialId}/test`,
        method: "POST",
      }),
    }),

    /**
     * Refresh OAuth token for credential
     * POST /api/courier/admin/credentials/:credentialId/refresh-token
     */
    refreshCredentialToken: builder.mutation<
      ApiResponse<{ expiresIn: number }>,
      { credentialId: string }
    >({
      query: ({ credentialId }) => ({
        url: `/courier/admin/credentials/${credentialId}/refresh-token`,
        method: "POST",
      }),
      invalidatesTags: (result, error, { credentialId }) => [
        { type: "CourierCredential", id: credentialId },
      ],
    }),

    // ==================== SERVICEABLE AREAS ENDPOINTS ====================

    /**
     * Get serviceable areas
     * GET /api/courier/admin/serviceable-areas
     */
    getServiceableAreas: builder.query<
      ApiResponse<ServiceableArea[]>,
      GetServiceableAreasRequest | void
    >({
      query: (params) => ({
        url: "/courier/admin/serviceable-areas",
        method: "GET",
        params: params || undefined,
      }),
      providesTags: [{ type: "ServiceableAreas", id: "LIST" }],
    }),

    /**
     * Sync serviceable areas for a courier provider
     * POST /api/courier/admin/serviceable-areas/sync
     */
    syncServiceableAreas: builder.mutation<ApiResponse<any[]>, SyncServiceableAreasRequest>({
      query: (body) => ({
        url: "/courier/admin/serviceable-areas/sync",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "ServiceableAreas", id: "LIST" }],
    }),

    /**
     * Delete serviceable area
     * DELETE /api/courier/admin/serviceable-areas/:areaId
     */
    deleteServiceableArea: builder.mutation<ApiResponse, { areaId: string }>({
      query: ({ areaId }) => ({
        url: `/courier/admin/serviceable-areas/${areaId}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "ServiceableAreas", id: "LIST" }],
    }),

    // ==================== PATHAO SPECIFIC ENDPOINTS ====================

    /**
     * Get Pathao cities for area mapping
     * GET /api/courier/admin/pathao/cities
     */
    pathaoGetCities: builder.query<ApiResponse<PathaoCitiesResponse>, PathaoGetCitiesRequest>({
      query: (params) => ({
        url: "/courier/admin/pathao/cities",
        method: "GET",
        params,
      }),
      providesTags: ["PathaoCities"],
    }),

    /**
     * Get Pathao zones for a city
     * GET /api/courier/admin/pathao/cities/:cityId/zones
     */
    pathaoGetZones: builder.query<ApiResponse<PathaoZonesResponse>, PathaoGetZonesRequest>({
      query: ({ cityId, ...params }) => ({
        url: `/courier/admin/pathao/cities/${cityId}/zones`,
        method: "GET",
        params,
      }),
      providesTags: (result, error, { cityId }) => [{ type: "PathaoZones", id: cityId }],
    }),

    /**
     * Get Pathao areas for a zone
     * GET /api/courier/admin/pathao/zones/:zoneId/areas
     */
    pathaoGetAreas: builder.query<ApiResponse<PathaoAreasResponse>, PathaoGetAreasRequest>({
      query: ({ zoneId, ...params }) => ({
        url: `/courier/admin/pathao/zones/${zoneId}/areas`,
        method: "GET",
        params,
      }),
      providesTags: (result, error, { zoneId }) => [{ type: "PathaoAreas", id: zoneId }],
    }),

    /**
     * Get Pathao stores
     * GET /api/courier/admin/pathao/stores
     */
    pathaoGetStores: builder.query<ApiResponse<PathaoStoresResponse>, PathaoGetStoresRequest>({
      query: (params) => ({
        url: "/courier/admin/pathao/stores",
        method: "GET",
        params,
      }),
      providesTags: ["PathaoStores"],
    }),

    /**
     * Create Pathao store
     * POST /api/courier/admin/pathao/stores
     */
    pathaoCreateStore: builder.mutation<ApiResponse, PathaoCreateStoreRequest>({
      query: (body) => ({
        url: "/courier/admin/pathao/stores",
        method: "POST",
        body,
      }),
      invalidatesTags: ["PathaoStores"],
    }),

    /**
     * Get detailed Pathao order info
     * GET /api/courier/orders/pathao/:consignmentId
     */
    pathaoGetOrderInfo: builder.query<
      ApiResponse<PathaoOrderInfoResponse>,
      PathaoGetOrderInfoRequest
    >({
      query: ({ consignmentId, ...params }) => ({
        url: `/courier/orders/pathao/${consignmentId}`,
        method: "GET",
        params,
      }),
      providesTags: (result, error, { consignmentId }) => [
        { type: "OrderTracking", id: `pathao-${consignmentId}` },
      ],
    }),

    // ==================== REDX SPECIFIC ENDPOINTS ====================

    /**
     * Get RedX delivery areas
     * GET /api/courier/admin/redx/areas
     */
    redxGetAreas: builder.query<ApiResponse<RedXAreasResponse>, RedXGetAreasRequest>({
      query: (params) => ({
        url: "/courier/admin/redx/areas",
        method: "GET",
        params,
      }),
      providesTags: ["RedXAreas"],
    }),

    /**
     * Get RedX pickup stores
     * GET /api/courier/admin/redx/stores
     */
    redxGetPickupStores: builder.query<ApiResponse<RedXStoresResponse>, RedXGetStoresRequest>({
      query: (params) => ({
        url: "/courier/admin/redx/stores",
        method: "GET",
        params,
      }),
      providesTags: ["RedXStores"],
    }),

    /**
     * Create RedX pickup store
     * POST /api/courier/admin/redx/stores
     */
    redxCreatePickupStore: builder.mutation<ApiResponse, RedXCreateStoreRequest>({
      query: (body) => ({
        url: "/courier/admin/redx/stores",
        method: "POST",
        body,
      }),
      invalidatesTags: ["RedXStores"],
    }),

    /**
     * Get detailed RedX tracking info
     * GET /api/courier/orders/redx/:trackingId/track
     */
    redxTrackParcel: builder.query<ApiResponse<RedXTrackingResponse>, RedXTrackParcelRequest>({
      query: ({ trackingId, ...params }) => ({
        url: `/courier/orders/redx/${trackingId}/track`,
        method: "GET",
        params,
      }),
      providesTags: (result, error, { trackingId }) => [
        { type: "OrderTracking", id: `redx-${trackingId}` },
      ],
    }),

    // ==================== ORDER PLACEMENT ENDPOINTS ====================

    /**
     * Create courier order (Platform automatically creates)
     * POST /api/courier/orders/create
     */
    createCourierOrder: builder.mutation<
      ApiResponse<CourierOrderResponse>,
      CreateCourierOrderRequest
    >({
      query: (body) => ({
        url: "/courier/orders/create",
        method: "POST",
        body,
      }),
      invalidatesTags: ["CourierOrders", "VendorOrders"],
    }),

    /**
     * Get courier pricing quote for checkout
     * POST /api/courier/quote
     */
    getCourierQuote: builder.mutation<ApiResponse<CourierSelection>, GetCourierQuoteRequest>({
      query: (body) => ({
        url: "/courier/quote",
        method: "POST",
        body,
      }),
    }),

    // ==================== VENDOR ENDPOINTS ====================

    /**
     * Vendor marks order as ready for pickup
     * POST /api/courier/vendor/orders/:orderId/ready
     */
    vendorMarkReadyForPickup: builder.mutation<ApiResponse, VendorMarkReadyRequest>({
      query: ({ orderId, vendorId }) => ({
        url: `/courier/vendor/orders/${orderId}/ready`,
        method: "POST",
        body: { vendorId },
      }),
      invalidatesTags: (result, error, { orderId }) => [
        { type: "VendorOrders", id: orderId },
        { type: "CourierOrders", id: orderId },
      ],
    }),

    /**
     * Get shipping label for vendor to print
     * GET /api/courier/vendor/orders/:orderId/label
     */
    getShippingLabel: builder.query<ApiResponse<ShippingLabel>, GetShippingLabelRequest>({
      query: ({ orderId, vendorId }) => ({
        url: `/courier/vendor/orders/${orderId}/label`,
        method: "GET",
        params: vendorId ? { vendorId } : undefined,
      }),
      providesTags: (result, error, { orderId }) => [{ type: "ShippingLabels", id: orderId }],
    }),

    /**
     * Get vendor's courier orders
     * GET /api/courier/vendor/orders
     */
    getVendorCourierOrders: builder.query<ApiResponse<CourierOrder[]>, GetVendorOrdersRequest>({
      query: (params) => ({
        url: "/courier/vendor/orders",
        method: "GET",
        params,
      }),
      providesTags: ["VendorOrders"],
    }),

    // ==================== TRACKING ENDPOINTS ====================

    /**
     * Track order by tracking ID (Public)
     * GET /api/courier/track/:trackingId
     */
    trackOrder: builder.query<ApiResponse<PublicTrackingData>, TrackOrderRequest>({
      query: ({ trackingId }) => ({
        url: `/courier/track/${trackingId}`,
        method: "GET",
      }),
      providesTags: (result, error, { trackingId }) => [
        { type: "OrderTracking", id: trackingId },
      ],
    }),

    /**
     * Get courier orders by order ID (Internal)
     * GET /api/courier/orders/:orderId
     */
    getCourierOrdersByOrderId: builder.query<ApiResponse<CourierOrder[]>, GetOrdersByOrderIdRequest>({
      query: ({ orderId }) => ({
        url: `/courier/orders/${orderId}`,
        method: "GET",
      }),
      providesTags: (result, error, { orderId }) => [{ type: "CourierOrders", id: orderId }],
    }),

    // ==================== WEBHOOK ENDPOINTS ====================

    /**
     * Pathao webhook endpoint for status updates
     * POST /api/courier/webhook/pathao
     */
    pathaoWebhook: builder.mutation<ApiResponse, PathaoWebhookRequest>({
      query: (body) => ({
        url: "/courier/webhook/pathao",
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, arg) => [
        { type: "OrderTracking", id: arg.consignment_id },
        "CourierOrders",
      ],
    }),

    /**
     * RedX webhook endpoint for status updates
     * POST /api/courier/webhook/redx
     */
    redxWebhook: builder.mutation<ApiResponse, RedXWebhookRequest>({
      query: (body) => ({
        url: "/courier/webhook/redx",
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, arg) => [
        { type: "OrderTracking", id: arg.tracking_number },
        "CourierOrders",
      ],
    }),
  }),
});

// ==================== EXPORT HOOKS ====================

export const {
  // Provider Management
  useGetCourierProvidersQuery,
  useLazyGetCourierProvidersQuery,
  useGetCourierProviderByIdQuery,
  useLazyGetCourierProviderByIdQuery,
  useCreateCourierProviderMutation,
  useUpdateCourierProviderMutation,
  useDeleteCourierProviderMutation,
  useToggleProviderStatusMutation,

  // Credential Management
  useGetAllCredentialsQuery,
  useLazyGetAllCredentialsQuery,
  useGetCredentialByIdQuery,
  useLazyGetCredentialByIdQuery,
  useCreateCourierCredentialsMutation,
  useUpdateCourierCredentialsMutation,
  useDeleteCourierCredentialsMutation,
  useToggleCredentialStatusMutation,
  useTestCourierCredentialsMutation,
  useRefreshCredentialTokenMutation,

  // Serviceable Areas
  useGetServiceableAreasQuery,
  useLazyGetServiceableAreasQuery,
  useSyncServiceableAreasMutation,
  useDeleteServiceableAreaMutation,

  // Pathao Specific
  usePathaoGetCitiesQuery,
  useLazyPathaoGetCitiesQuery,
  usePathaoGetZonesQuery,
  useLazyPathaoGetZonesQuery,
  usePathaoGetAreasQuery,
  useLazyPathaoGetAreasQuery,
  usePathaoGetStoresQuery,
  useLazyPathaoGetStoresQuery,
  usePathaoCreateStoreMutation,
  usePathaoGetOrderInfoQuery,
  useLazyPathaoGetOrderInfoQuery,

  // RedX Specific
  useRedxGetAreasQuery,
  useLazyRedxGetAreasQuery,
  useRedxGetPickupStoresQuery,
  useLazyRedxGetPickupStoresQuery,
  useRedxCreatePickupStoreMutation,
  useRedxTrackParcelQuery,
  useLazyRedxTrackParcelQuery,

  // Order Placement
  useCreateCourierOrderMutation,
  useGetCourierQuoteMutation,

  // Vendor
  useVendorMarkReadyForPickupMutation,
  useGetShippingLabelQuery,
  useLazyGetShippingLabelQuery,
  useGetVendorCourierOrdersQuery,
  useLazyGetVendorCourierOrdersQuery,

  // Tracking
  useTrackOrderQuery,
  useLazyTrackOrderQuery,
  useGetCourierOrdersByOrderIdQuery,
  useLazyGetCourierOrdersByOrderIdQuery,

  // Webhooks
  usePathaoWebhookMutation,
  useRedxWebhookMutation,
} = courierApi;