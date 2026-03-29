// features/adminOrderApi.ts
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

export type FulfillmentStatus =
  | "UNFULFILLED"
  | "PARTIALLY_FULFILLED"
  | "FULFILLED"
  | "SHIPPED"
  | "DELIVERED"
  | "RETURNED"
  | "CANCELLED";

export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";

export type RefundStatus =
  | "PENDING"
  | "APPROVED"
  | "PROCESSING"
  | "REFUNDED"
  | "FAILED"
  | "REJECTED"
  | "CANCELLED";

export type RefundType =
  | "FULL_REFUND"
  | "PARTIAL_REFUND"
  | "CHARGEBACK"
  | "CUSTOMER_INITIATED"
  | "VENDOR_INITIATED"
  | "ADMIN_INITIATED";

export type AnalyticsPeriod = "daily" | "weekly" | "monthly";

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

export interface AdminOrderFilters {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  fulfillmentStatus?: FulfillmentStatus;
  vendorId?: string;
  userId?: string;
  search?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}

export interface VendorOrdersByVendorFilters {
  status?: OrderStatus;
  page?: number;
  limit?: number;
}

export interface FraudReviewFilters {
  page?: number;
  limit?: number;
}

export interface RefundListFilters {
  status?: RefundStatus;
  page?: number;
  limit?: number;
}

export interface AnalyticsFilters {
  period: AnalyticsPeriod;
  vendorId?: string;
}

export interface ConfirmOrderRequest {
  note?: string;
}

export interface ApproveOrderRequest {
  note?: string;
}

export interface RejectOrderRequest {
  reason: string;
}

export interface CancelOrderRequest {
  reason: string;
}

export interface UpdateOrderStatusRequest {
  status: OrderStatus;
  note?: string;
}

export interface UpdateVendorOrderStatusRequest {
  status: OrderStatus;
  note?: string;
}

export interface ProcessRefundRequest {
  amount: number;
  reason: string;
  refundType: RefundType;
}

export interface ApproveRefundRequest {
  amount: number;
  note?: string;
}

export interface RejectRefundRequest {
  reason: string;
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

export interface AdminOrderUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  isVerified: boolean;
  createdAt?: string;
}

export interface OrderAddressSummary {
  receiverFullName: string;
  phone: string;
  city: string;
  address: string;
  zone?: string;
}

export interface LocationInfo {
  id: string;
  name: string;
  name_local?: string;
  level: string;
  parent_id?: string;
}

export interface OrderAddressDetail extends OrderAddressSummary {
  location: LocationInfo;
}

export interface VariantAttribute {
  id: string;
  attributeValue: {
    id: string;
    value: string;
    attribute: { id: string; name: string; slug: string };
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
  product: { id: string; name: string; slug: string };
  images: ProductImage[];
}

export interface OrderItem {
  id: string;
  vendorOrderId: string;
  variantId: string;
  quantity: number;
  price: number;
  variant: OrderVariant;
}

export interface OrderItemSummary {
  quantity: number;
  price: number;
}

export interface CourierProvider {
  name: string;
  displayName?: string;
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
  courierTrackingId?: string;
  status: CourierOrderStatus;
}

export interface CourierOrderDetail {
  id: string;
  courierTrackingId?: string;
  courierOrderId?: string;
  status: CourierOrderStatus;
  lastStatusUpdate: string;
  courier_tracking_history: TrackingHistoryEntry[];
  courier_providers: CourierProvider;
}

export interface Payment {
  method: string;
  status: PaymentStatus;
  amount: number;
  paidAt?: string;
}

export interface Refund {
  id: string;
  orderId: string;
  amount: number;
  reason?: string;
  status: RefundStatus;
  createdAt: string;
  processedAt?: string;
  order?: {
    orderNumber: string;
    totalAmount: number;
    paymentStatus: PaymentStatus;
    user: { id: string; name: string; email: string; phone: string };
  };
}

export interface OfferUsageSummary {
  discountApplied: number;
  offer: { title: string; type: string; discountType: string };
}

// ---- VendorOrder in admin context ----

export interface AdminVendorOrderSummary {
  id: string;
  status: OrderStatus;
  fulfillmentStatus: FulfillmentStatus;
  subtotal: number;
  vendor: { id: string; storeName: string };
  items: OrderItemSummary[];
  courierOrder?: CourierOrderSummary;
}

export interface AdminVendorOrderDetail {
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
  vendor: { id: string; storeName: string; avatar?: string; email?: string };
  items: OrderItem[];
  courierOrder?: CourierOrderDetail;
}

// ---- Master Order shapes ----

export interface AdminOrder {
  id: string;
  orderNumber: string;
  userId?: string;
  totalAmount: number;
  subtotal?: number;
  shippingCost?: number;
  tax?: number;
  discountAmount?: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  createdAt: string;
  confirmedAt?: string;
  paidAt?: string;
  cancelledAt?: string;
  conversionSource?: string;
  deviceType?: string;
  user?: AdminOrderUser;
  address?: OrderAddressSummary;
  vendorOrders: AdminVendorOrderSummary[];
  payments: Payment[];
}

export interface AdminOrderDetail extends Omit<AdminOrder, "address" | "vendorOrders" | "payments"> {
  address?: OrderAddressDetail;
  vendorOrders: AdminVendorOrderDetail[];
  payments: Payment[];
  refunds: Refund[];
  offerUsages: OfferUsageSummary[];
}

// ---- Fraud review order (extra user risk fields) ----

export interface FraudReviewOrder {
  id: string;
  orderNumber: string;
  totalAmount: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  createdAt: string;
  user?: AdminOrderUser & {
    orders: { id: string }[]; // bad order history
  };
  address?: OrderAddressSummary;
  vendorOrders: Array<{
    subtotal: number;
    shippingCost: number;
    vendor: { id: string; storeName: string };
    items: OrderItemSummary[];
  }>;
}

// ---- Statistics ----

export interface AdminOrderStatistics {
  total: number;
  byStatus: {
    pending: number;
    confirmed: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
    refunded: number;
    failedDelivery: number;
  };
  newOrders: {
    today: number;
    week: number;
    month: number;
  };
  revenue: {
    total: number;
    today: number;
    week: number;
    month: number;
  };
  actionRequired: {
    pendingRefunds: number;
    fraudQueue: number;
    pendingCodConfirmations: number;
  };
}

// ---- Analytics ----

export interface AnalyticsDataPoint {
  date: string;
  revenue: number;
  orders: number;
}

// ---- Status update result ----

export interface StatusUpdateResult {
  success: boolean;
  oldStatus: OrderStatus;
  newStatus: OrderStatus;
}

// =============================
// ADMIN ORDER API
// =============================

export const adminOrderApi = createApi({
  reducerPath: "adminOrderApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    "AdminOrder",
    "AdminOrderDetail",
    "AdminOrderStatistics",
    "AdminOrderAnalytics",
    "FraudQueue",
    "AdminVendorOrders",
    "Refund",
  ],
  endpoints: (builder) => ({
    // =====================================================
    // STATISTICS & ANALYTICS
    // =====================================================

    /**
     * GET /api/admin-orders/statistics
     * Platform-wide order statistics including fraud queue + action required counts
     */
    getAdminOrderStatistics: builder.query<
      ApiResponse<AdminOrderStatistics>,
      void
    >({
      query: () => ({
        url: "/admin-orders/statistics",
        method: "GET",
      }),
      providesTags: ["AdminOrderStatistics"],
    }),

    /**
     * GET /api/admin-orders/analytics?period=monthly&vendorId=...
     * Revenue breakdown by daily / weekly / monthly. Optional vendorId to scope to one vendor.
     */
    getAdminOrderAnalytics: builder.query<
      ApiResponse<AnalyticsDataPoint[]>,
      AnalyticsFilters
    >({
      query: (params) => ({
        url: "/admin-orders/analytics",
        method: "GET",
        params,
      }),
      providesTags: ["AdminOrderAnalytics"],
    }),

    // =====================================================
    // ORDER LISTING & DETAILS
    // =====================================================

    /**
     * GET /api/admin-orders
     * Supports: status, paymentStatus, fulfillmentStatus, vendorId, userId, search, fromDate, toDate, page, limit
     */
    getAllAdminOrders: builder.query<
      PaginatedResponse<AdminOrder>,
      AdminOrderFilters
    >({
      query: (params) => ({
        url: "/admin-orders",
        method: "GET",
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({
                type: "AdminOrder" as const,
                id,
              })),
              { type: "AdminOrder", id: "LIST" },
            ]
          : [{ type: "AdminOrder", id: "LIST" }],
    }),

    /**
     * GET /api/admin-orders/fraud-review?page=1
     * Orders held in the fraud review queue: PENDING + no payment record
     */
    getAdminFraudReview: builder.query<
      PaginatedResponse<FraudReviewOrder>,
      FraudReviewFilters
    >({
      query: (params) => ({
        url: "/admin-orders/fraud-review",
        method: "GET",
        params,
      }),
      providesTags: ["FraudQueue"],
    }),

    /**
     * GET /api/admin-orders/refunds?status=PENDING&page=1
     */
    getAllAdminRefunds: builder.query<
      PaginatedResponse<Refund>,
      RefundListFilters
    >({
      query: (params) => ({
        url: "/admin-orders/refunds",
        method: "GET",
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({
                type: "Refund" as const,
                id,
              })),
              { type: "Refund", id: "LIST" },
            ]
          : [{ type: "Refund", id: "LIST" }],
    }),

    /**
     * GET /api/admin-orders/vendor/:vendorId?status=CONFIRMED&page=1
     */
    getAdminOrdersByVendor: builder.query<
      PaginatedResponse<AdminVendorOrderDetail>,
      { vendorId: string } & VendorOrdersByVendorFilters
    >({
      query: ({ vendorId, ...params }) => ({
        url: `/admin-orders/vendor/${vendorId}`,
        method: "GET",
        params,
      }),
      providesTags: (result, error, { vendorId }) => [
        { type: "AdminVendorOrders", id: vendorId },
      ],
    }),

    /**
     * GET /api/admin-orders/:id
     * Full admin detail: all vendor orders, payments, refunds, offer usages, tracking
     */
    getAdminOrderById: builder.query<
      ApiResponse<AdminOrderDetail>,
      string
    >({
      query: (id) => ({
        url: `/admin-orders/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [
        { type: "AdminOrderDetail", id },
      ],
    }),

    // =====================================================
    // ORDER STATUS ACTIONS
    // =====================================================

    /**
     * PATCH /api/admin-orders/:id/confirm
     * Confirm a PENDING order (COD or fraud-cleared). Body: { note? }
     */
    confirmAdminOrder: builder.mutation<
      ApiResponse<{ success: boolean }>,
      { id: string } & ConfirmOrderRequest
    >({
      query: ({ id, ...body }) => ({
        url: `/admin-orders/${id}/confirm`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "AdminOrder", id },
        { type: "AdminOrderDetail", id },
        { type: "AdminOrder", id: "LIST" },
        "AdminOrderStatistics",
        "FraudQueue",
      ],
    }),

    /**
     * PATCH /api/admin-orders/:id/approve
     * Approve a fraud-held order. Body: { note? }
     */
    approveAdminOrder: builder.mutation<
      ApiResponse<{ success: boolean }>,
      { id: string } & ApproveOrderRequest
    >({
      query: ({ id, ...body }) => ({
        url: `/admin-orders/${id}/approve`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "AdminOrder", id },
        { type: "AdminOrderDetail", id },
        { type: "AdminOrder", id: "LIST" },
        "AdminOrderStatistics",
        "FraudQueue",
      ],
    }),

    /**
     * PATCH /api/admin-orders/:id/reject
     * Reject a fraud-held order — cancels it. Body: { reason }
     */
    rejectAdminOrder: builder.mutation<
      ApiResponse<{ success: boolean }>,
      { id: string } & RejectOrderRequest
    >({
      query: ({ id, ...body }) => ({
        url: `/admin-orders/${id}/reject`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "AdminOrder", id },
        { type: "AdminOrderDetail", id },
        { type: "AdminOrder", id: "LIST" },
        "AdminOrderStatistics",
        "FraudQueue",
      ],
    }),

    /**
     * PATCH /api/admin-orders/:id/cancel
     * Force cancel any non-final order. Body: { reason }
     */
    cancelAdminOrder: builder.mutation<
      ApiResponse<{ success: boolean }>,
      { id: string } & CancelOrderRequest
    >({
      query: ({ id, ...body }) => ({
        url: `/admin-orders/${id}/cancel`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "AdminOrder", id },
        { type: "AdminOrderDetail", id },
        { type: "AdminOrder", id: "LIST" },
        "AdminOrderStatistics",
      ],
    }),

    /**
     * PATCH /api/admin-orders/:id/status
     * Override master order to any valid OrderStatus. Body: { status, note? }
     */
    updateAdminOrderStatus: builder.mutation<
      ApiResponse<StatusUpdateResult>,
      { id: string } & UpdateOrderStatusRequest
    >({
      query: ({ id, ...body }) => ({
        url: `/admin-orders/${id}/status`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "AdminOrder", id },
        { type: "AdminOrderDetail", id },
        { type: "AdminOrder", id: "LIST" },
        "AdminOrderStatistics",
      ],
    }),

    /**
     * PATCH /api/admin-orders/:id/vendor-orders/:vendorOrderId/status
     * Override a specific VendorOrder status. Body: { status, note? }
     */
    updateAdminVendorOrderStatus: builder.mutation<
      ApiResponse<StatusUpdateResult>,
      { id: string; vendorOrderId: string } & UpdateVendorOrderStatusRequest
    >({
      query: ({ id, vendorOrderId, ...body }) => ({
        url: `/admin-orders/${id}/vendor-orders/${vendorOrderId}/status`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { id, vendorOrderId }) => [
        { type: "AdminOrder", id },
        { type: "AdminOrderDetail", id },
        { type: "AdminOrder", id: "LIST" },
        { type: "AdminVendorOrders", id: vendorOrderId },
        "AdminOrderStatistics",
      ],
    }),

    // =====================================================
    // REFUNDS
    // =====================================================

    /**
     * POST /api/admin-orders/:id/refund
     * Initiate a refund for a paid order. Body: { amount, reason, refundType }
     */
    processAdminRefund: builder.mutation<
      ApiResponse<Refund>,
      { id: string } & ProcessRefundRequest
    >({
      query: ({ id, ...body }) => ({
        url: `/admin-orders/${id}/refund`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "AdminOrder", id },
        { type: "AdminOrderDetail", id },
        { type: "Refund", id: "LIST" },
        "AdminOrderStatistics",
      ],
    }),

    /**
     * PATCH /api/admin-orders/refunds/:refundId/approve
     * Approve a customer-submitted return/refund request. Body: { amount, note? }
     */
    approveAdminRefund: builder.mutation<
      ApiResponse<{ success: boolean }>,
      { refundId: string } & ApproveRefundRequest
    >({
      query: ({ refundId, ...body }) => ({
        url: `/admin-orders/refunds/${refundId}/approve`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { refundId }) => [
        { type: "Refund", id: refundId },
        { type: "Refund", id: "LIST" },
        "AdminOrderStatistics",
      ],
    }),

    /**
     * PATCH /api/admin-orders/refunds/:refundId/reject
     * Reject a customer-submitted return/refund request. Body: { reason }
     */
    rejectAdminRefund: builder.mutation<
      ApiResponse<{ success: boolean }>,
      { refundId: string } & RejectRefundRequest
    >({
      query: ({ refundId, ...body }) => ({
        url: `/admin-orders/refunds/${refundId}/reject`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { refundId }) => [
        { type: "Refund", id: refundId },
        { type: "Refund", id: "LIST" },
        "AdminOrderStatistics",
      ],
    }),
  }),
});

// =============================
// EXPORT HOOKS
// =============================

export const {
  // Statistics & Analytics
  useGetAdminOrderStatisticsQuery,
  useGetAdminOrderAnalyticsQuery,

  // Order Listing & Details
  useGetAllAdminOrdersQuery,
  useGetAdminFraudReviewQuery,
  useGetAllAdminRefundsQuery,
  useGetAdminOrdersByVendorQuery,
  useGetAdminOrderByIdQuery,

  // Order Status Actions
  useConfirmAdminOrderMutation,
  useApproveAdminOrderMutation,
  useRejectAdminOrderMutation,
  useCancelAdminOrderMutation,
  useUpdateAdminOrderStatusMutation,
  useUpdateAdminVendorOrderStatusMutation,

  // Refunds
  useProcessAdminRefundMutation,
  useApproveAdminRefundMutation,
  useRejectAdminRefundMutation,
} = adminOrderApi;