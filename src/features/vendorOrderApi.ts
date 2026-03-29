// features/vendorOrderApi.ts
import { createApi } from "@reduxjs/toolkit/query/react";
import baseQueryWithReauth from "./baseQueryWithReauth";

// =============================
// ENUM TYPES
// =============================

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "PACKAGING"
  | "SHIPPED"
  | "DELIVERED"
  | "RETURNED"
  | "FAILED_TO_DELIVER"
  | "CANCELLED"
  | "REFUNDED";

export type VendorAllowedStatus = "PROCESSING" | "PACKAGING";

export type FulfillmentStatus =
  | "UNFULFILLED"
  | "PARTIALLY_FULFILLED"
  | "FULFILLED"
  | "SHIPPED"
  | "DELIVERED"
  | "RETURNED"
  | "CANCELLED";

export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";

export type RevenuePeriod = "daily" | "weekly" | "monthly";

export type CourierOrderStatus =
  | "PENDING_PICKUP"
  | "READY_FOR_PICKUP"
  | "PICKUP_PENDING"
  | "PICKED_UP"
  | "IN_TRANSIT"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "FAILED_DELIVERY"
  | "RETURNING"
  | "RETURNED"
  | "CANCELLED"
  | "ON_HOLD";

// =============================
// REQUEST TYPES
// =============================

export interface VendorOrderFilters {
  status?: OrderStatus;
  fulfillmentStatus?: FulfillmentStatus;
  search?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}

export interface UpdateVendorOrderStatusRequest {
  status: VendorAllowedStatus;
}

export interface MarkForDeliveryRequest {
  warehouseId: string;
  specialInstruction?: string;
}

export interface ConfirmCodOrderRequest {
  confirmedByName: string;
  note?: string;
}

// =============================
// RESPONSE TYPES
// =============================

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: Pagination;
  count: number;
}

// ---- Nested shapes ----

export interface VendorOrderUser {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export interface VendorOrderAddress {
  receiverFullName: string;
  phone: string;
  city: string;
  address: string;
  zone?: string;
}

export interface OrderAddressDetail extends VendorOrderAddress {
  location: LocationInfo;
}

export interface LocationInfo {
  id: string;
  name: string;
  name_local?: string;
  level: string;
  parent_id?: string;
}

export interface VariantAttribute {
  id: string;
  attributeValue: {
    id: string;
    value: string;
    attribute: {
      id: string;
      name: string;
      slug: string;
    };
  };
}

export interface ProductImage {
  url: string;
  altText?: string;
}

export interface OrderVariant {
  id: string;
  sku: string;
  price: number;
  specialPrice?: number;
  stock: number;
  product: {
    id: string;
    name: string;
    slug: string;
    images?: ProductImage[];
  };
  images: ProductImage[];
  attributes: VariantAttribute[];
}

export interface OrderItem {
  id: string;
  vendorOrderId: string;
  variantId: string;
  quantity: number;
  price: number;
  variant: OrderVariant;
}

export interface CourierProvider {
  name: string;
  displayName?: string;
  logo?: string;
}

export interface TrackingHistoryEntry {
  id: string;
  status: CourierOrderStatus;
  courierStatus: string;
  messageEn: string;
  messageBn?: string;
  location?: string;
  timestamp: string;
}

export interface CourierOrderSummary {
  id: string;
  courierTrackingId?: string;
  courierOrderId?: string;
  status: CourierOrderStatus;
  lastStatusUpdate: string;
  courier_providers: CourierProvider;
}

export interface CourierOrderDetail extends CourierOrderSummary {
  courier_tracking_history: TrackingHistoryEntry[];
}

export interface VendorInfo {
  storeName: string;
  pickupAddress?: {
    detailsAddress?: string;
    city?: string;
    zone?: string;
    area?: string;
  } | null;
}

export interface MasterOrderSummary {
  id: string;
  orderNumber: string;
  paymentStatus: PaymentStatus;
  createdAt: string;
  confirmedAt?: string;
  address: VendorOrderAddress;
  user: VendorOrderUser;
}

export interface MasterOrderDetail {
  id: string;
  orderNumber: string;
  paymentStatus: PaymentStatus;
  createdAt: string;
  confirmedAt?: string;
  address: OrderAddressDetail;
  user: VendorOrderUser;
  payments: Array<{
    method: string;
    status: PaymentStatus;
    amount: number;
    paidAt?: string;
  }>;
}

// ---- Main VendorOrder shapes ----

export interface VendorOrder {
  id: string;
  orderId: string;
  vendorId: string;
  subtotal: number;
  shippingCost: number;
  status: OrderStatus;
  fulfillmentStatus: FulfillmentStatus;
  createdAt: string;
  shippedAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  courierOrderId?: string;
  order: MasterOrderSummary;
  items: OrderItem[];
  courierOrder?: CourierOrderSummary;
}

export interface VendorOrderDetail extends Omit<VendorOrder, "order" | "courierOrder"> {
  order: MasterOrderDetail;
  courierOrder?: CourierOrderDetail;
  vendor: VendorInfo;
}

// ---- Shipping label ----

export interface ShippingLabelData {
  id: string;
  orderId: string;
  vendorId: string;
  subtotal: number;
  shippingCost: number;
  status: OrderStatus;
  items: OrderItem[];
  vendor: VendorInfo;
  order: MasterOrderDetail;
  courierOrder: CourierOrderDetail & {
    recipientName: string;
    recipientPhone: string;
    recipientAddress: string;
    itemWeight: number;
    itemQuantity: number;
    itemDescription?: string;
    codAmount: number;
    deliveryCharge: number;
    totalCharge: number;
  };
}

// ---- Tracking ----

export interface TrackingData {
  vendorId: string;
  status: OrderStatus;
  fulfillmentStatus: FulfillmentStatus;
  shippedAt?: string;
  deliveredAt?: string;
  courierOrder: CourierOrderDetail;
}

// ---- Statistics ----

export interface VendorOrderStatistics {
  total: number;
  byStatus: {
    pending: number;
    confirmed: number;
    processing: number;
    packaging: number;
    shipped: number;
    delivered: number;
    cancelled: number;
    returned: number;
  };
  pendingCodConfirmations: number;
  totalRevenue: number;
  today: {
    orders: number;
    revenue: number;
  };
}

// ---- Revenue ----

export interface RevenueDataPoint {
  date: string;
  revenue: number;
  orders: number;
}

// ---- Mark for delivery response ----

export interface MarkForDeliveryResponse {
  vendorOrder: VendorOrderDetail;
  courierOrder: {
    id: string;
    courierProviderId: string;
    vendorId: string;
    recipientName: string;
    recipientPhone: string;
    recipientAddress: string;
    status: CourierOrderStatus;
    codAmount: number;
    deliveryCharge: number;
    totalCharge: number;
  };
  shippingLabelUrl: string;
}

// =============================
// VENDOR ORDER API
// =============================

export const vendorOrderApi = createApi({
  reducerPath: "vendorOrderApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    "VendorOrder",
    "VendorOrderDetail",
    "VendorOrderStatistics",
    "VendorOrderRevenue",
    "VendorOrderItems",
    "ShippingLabel",
    "Tracking",
  ],
  endpoints: (builder) => ({
    // =====================================================
    // DASHBOARD & OVERVIEW
    // =====================================================

    /**
     * GET /api/vendor-orders/statistics
     */
    getVendorOrderStatistics: builder.query<
      ApiResponse<VendorOrderStatistics>,
      void
    >({
      query: () => ({
        url: "/vendor-orders/statistics",
        method: "GET",
      }),
      providesTags: ["VendorOrderStatistics"],
    }),

    /**
     * GET /api/vendor-orders/revenue?period=monthly
     */
    getVendorOrderRevenue: builder.query<
      ApiResponse<RevenueDataPoint[]>,
      { period: RevenuePeriod }
    >({
      query: ({ period }) => ({
        url: "/vendor-orders/revenue",
        method: "GET",
        params: { period },
      }),
      providesTags: ["VendorOrderRevenue"],
    }),

    // =====================================================
    // ORDER LISTING & DETAILS
    // =====================================================

    /**
     * GET /api/vendor-orders
     * Supports: status, fulfillmentStatus, search, fromDate, toDate, page, limit
     */
    getVendorOrders: builder.query<
      PaginatedResponse<VendorOrder>,
      VendorOrderFilters
    >({
      query: (params) => ({
        url: "/vendor-orders",
        method: "GET",
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({
                type: "VendorOrder" as const,
                id,
              })),
              { type: "VendorOrder", id: "LIST" },
            ]
          : [{ type: "VendorOrder", id: "LIST" }],
    }),

    /**
     * GET /api/vendor-orders/:vendorOrderId
     */
    getVendorOrderById: builder.query<
      ApiResponse<VendorOrderDetail>,
      string
    >({
      query: (vendorOrderId) => ({
        url: `/vendor-orders/${vendorOrderId}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [
        { type: "VendorOrderDetail", id },
      ],
    }),

    /**
     * GET /api/vendor-orders/:vendorOrderId/items
     */
    getVendorOrderItems: builder.query<
      ApiResponse<OrderItem[]> & { count: number },
      string
    >({
      query: (vendorOrderId) => ({
        url: `/vendor-orders/${vendorOrderId}/items`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [
        { type: "VendorOrderItems", id },
      ],
    }),

    // =====================================================
    // ORDER STATUS MANAGEMENT
    // =====================================================

    /**
     * PATCH /api/vendor-orders/:vendorOrderId/status
     * Body: { status: "PROCESSING" | "PACKAGING" }
     * Allowed transitions: CONFIRMED → PROCESSING → PACKAGING
     */
    updateVendorOrderStatus: builder.mutation<
      ApiResponse<VendorOrder>,
      { vendorOrderId: string; status: VendorAllowedStatus }
    >({
      query: ({ vendorOrderId, status }) => ({
        url: `/vendor-orders/${vendorOrderId}/status`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: (result, error, { vendorOrderId }) => [
        { type: "VendorOrder", id: vendorOrderId },
        { type: "VendorOrderDetail", id: vendorOrderId },
        { type: "VendorOrder", id: "LIST" },
        "VendorOrderStatistics",
      ],
    }),

    /**
     * PATCH /api/vendor-orders/:vendorOrderId/mark-for-delivery
     * Body: { warehouseId: string, specialInstruction?: string }
     * Requires PACKAGING status. Creates CourierOrder + generates shipping label.
     */
    markVendorOrderForDelivery: builder.mutation<
      ApiResponse<MarkForDeliveryResponse>,
      { vendorOrderId: string } & MarkForDeliveryRequest
    >({
      query: ({ vendorOrderId, ...body }) => ({
        url: `/vendor-orders/${vendorOrderId}/mark-for-delivery`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { vendorOrderId }) => [
        { type: "VendorOrder", id: vendorOrderId },
        { type: "VendorOrderDetail", id: vendorOrderId },
        { type: "ShippingLabel", id: vendorOrderId },
        { type: "Tracking", id: vendorOrderId },
        { type: "VendorOrder", id: "LIST" },
        "VendorOrderStatistics",
      ],
    }),

    /**
     * PATCH /api/vendor-orders/:vendorOrderId/confirm-cod
     * Body: { confirmedByName: string, note?: string }
     * COD only — vendor confirms after calling customer
     */
    confirmVendorCodOrder: builder.mutation<
      ApiResponse<{ success: boolean }>,
      { vendorOrderId: string } & ConfirmCodOrderRequest
    >({
      query: ({ vendorOrderId, ...body }) => ({
        url: `/vendor-orders/${vendorOrderId}/confirm-cod`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { vendorOrderId }) => [
        { type: "VendorOrder", id: vendorOrderId },
        { type: "VendorOrderDetail", id: vendorOrderId },
        { type: "VendorOrder", id: "LIST" },
        "VendorOrderStatistics",
      ],
    }),

    // =====================================================
    // SHIPPING & COURIER
    // =====================================================

    /**
     * GET /api/vendor-orders/:vendorOrderId/shipping-label
     * Only available after mark-for-delivery
     */
    getVendorOrderShippingLabel: builder.query<
      ApiResponse<ShippingLabelData>,
      string
    >({
      query: (vendorOrderId) => ({
        url: `/vendor-orders/${vendorOrderId}/shipping-label`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [
        { type: "ShippingLabel", id },
      ],
    }),

    /**
     * GET /api/vendor-orders/:vendorOrderId/tracking
     */
    getVendorOrderTracking: builder.query<
      ApiResponse<TrackingData>,
      string
    >({
      query: (vendorOrderId) => ({
        url: `/vendor-orders/${vendorOrderId}/tracking`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [
        { type: "Tracking", id },
      ],
    }),
  }),
});

// =============================
// EXPORT HOOKS
// =============================

export const {
  // Dashboard & Overview
  useGetVendorOrderStatisticsQuery,
  useGetVendorOrderRevenueQuery,

  // Order Listing & Details
  useGetVendorOrdersQuery,
  useGetVendorOrderByIdQuery,
  useGetVendorOrderItemsQuery,

  // Status Management
  useUpdateVendorOrderStatusMutation,
  useMarkVendorOrderForDeliveryMutation,
  useConfirmVendorCodOrderMutation,

  // Shipping & Courier
  useGetVendorOrderShippingLabelQuery,
  useGetVendorOrderTrackingQuery,
} = vendorOrderApi;