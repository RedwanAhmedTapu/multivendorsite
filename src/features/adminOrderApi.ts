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

// 1C-9: complete backend payment-state union — includes PARTIALLY_REFUNDED
// produced by partial refunds since 1C-5D.
export type PaymentStatus =
  | "PENDING"
  | "PAID"
  | "PARTIALLY_REFUNDED"
  | "FAILED"
  | "REFUNDED";

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
  | "PARTIAL_DELIVERED"
  | "FAILED_DELIVERY"
  | "RETURNING"
  | "RETURNED"
  | "CANCELLED"
  | "ON_HOLD";

/** REGULAR = normal forward shipment. Only REGULAR legs trigger the delivery accounting voucher. */
export type CourierShipmentKind = "REGULAR" | "EXCHANGE" | "RETURN";

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
  /** "cod" = COD orders awaiting confirmation, "paid" = paid online orders awaiting confirmation (incl. stock-released holds). */
  queue?: "cod" | "paid";
  /** Order-number search (contains, case-insensitive; server caps at 64 chars). */
  search?: string;
}

export interface RefundListFilters {
  status?: RefundStatus;
  /** 1C-7B G3: optional — refunds of one order */
  orderId?: string;
  /** 1C-7B G3: optional — exact refund id lookup */
  refundId?: string;
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

/**
 * Non-goodwill refunds on shipped orders are blocked server-side until the
 * vendor has confirmed physical receipt of the returned parcel
 * (vendor.confirmReturnReceipt). Set isGoodwill=true to bypass for
 * platform-funded refunds.
 */
export interface ProcessRefundRequest {
  amount: number;
  reason: string;
  refundType: RefundType;
  isGoodwill?: boolean;
}

export interface ApproveRefundRequest {
  amount: number;
  note?: string;
  isGoodwill?: boolean;
}

export interface RejectRefundRequest {
  reason: string;
}

/** Dev/QA-only: manually replay a courier webhook event for a given courier order. */
export interface SimulateCourierWebhookRequest {
  newStatus: CourierOrderStatus;
  courierStatus: string;
  shipmentKind?: CourierShipmentKind;
  messageEn?: string;
  messageBn?: string;
  location?: string;
  timestamp: string;
  rawData?: unknown;
  returnConsignmentId?: string;
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
  deliveredQuantity?: number;
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
  shipmentKind?: CourierShipmentKind;
  lastStatusUpdate: string;
  pickedUpAt?: string;
  inTransitAt?: string;
  deliveredAt?: string;
  returnedAt?: string;
  vendorConfirmedReturnAt?: string;
  cancelledAt?: string;
  courier_tracking_history: TrackingHistoryEntry[];
  courier_providers: CourierProvider;
}

export interface Payment {
  method: string;
  status: PaymentStatus;
  /** Prisma Decimal(18,4) serialized — always a string. */
  amount: string;
  paidAt?: string;
}

export interface Refund {
  id: string;
  orderId: string;
  /** Prisma Decimal(18,4) serialized — always a string, never a number. */
  amount: string;
  reason?: string;
  status: RefundStatus;
  createdAt: string;
  processedAt?: string;
  order?: {
    orderNumber: string;
    /** Prisma Decimal(18,4) serialized — always a string. */
    totalAmount: string;
    paymentStatus: PaymentStatus;
    user: { id: string; name: string; email: string; phone: string };
  };
}

// ── 1C-7B contract: refund mutation terminal response ──────────────────────
// POST /admin-orders/:id/refund, PATCH .../approve, PATCH .../reject all
// return the enriched terminal state of the affected refund (null status
// fields mean the backend had nothing persisted for them — never fabricated).

export interface RefundMutationResult {
  success: boolean;
  refundId: string;
  orderId: string;
  paymentStatus: PaymentStatus | null;
  refundStatus: RefundStatus | null;
  /** RefundRecord status — null when no record exists. */
  refundRecordStatus: RefundStatus | null;
}

// ── 1C-7B contract: RefundRecord (detail) ──────────────────────────────────
// Includes the 1C-5C failure state (failedReason/failedAt) and gateway
// reference fields. Money fields are Decimal-serialized strings.

export interface RefundRecord {
  id: string;
  refundId: string;
  refundNumber: string;
  vendorId: string;
  customerId: string;
  refundType: RefundType;
  /** Decimal-serialized strings. */
  originalAmount: string;
  refundAmount: string;
  refundReason: string;
  status: RefundStatus;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectionReason?: string;
  rejectedAt?: string;
  processedAt?: string;
  completedAt?: string;
  /** 1C-5C failure state — present when a gateway refund definitively failed. */
  failedReason?: string;
  failedAt?: string;
  sslTranId?: string | null;
  sslRefundRefId?: string | null;
  sslRefundStatus?: string | null;
  initiatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

// ── 1C-7B contract: VendorReturn linkage on refund detail ──────────────────
// The backend exposes the VendorReturns consumed by a refund via the
// Refund.returns back-relation (VendorReturn.refundId).

export interface RefundVendorReturnItem {
  id: string;
  orderItemId: string;
  variantId: string;
  quantity: number;
}

export interface RefundVendorReturn {
  id: string;
  vendorOrderId: string;
  vendorId: string;
  refundId: string | null;
  condition: "SELLABLE" | "DAMAGED";
  status: string;
  confirmedAt: string;
  confirmedBy?: string | null;
  note?: string | null;
  items: RefundVendorReturnItem[];
}

export interface RefundDetail extends Omit<Refund, "order"> {
  /** RefundRecord — null when the backend has none (never fabricated). */
  detail: RefundRecord | null;
  order: {
    id: string;
    orderNumber: string | null;
    totalAmount: string;
    paymentStatus: PaymentStatus;
  };
  returns: RefundVendorReturn[];
}

// ── 1C-7B contract: remaining-refundable summary (READ-ONLY) ───────────────
// GET /admin-orders/refunds/summary/:orderId — mirrors the H1 consumed
// definition (PENDING+APPROVED+PROCESSING+REFUNDED). All money = strings.

export interface RefundSummary {
  orderId: string;
  paymentId: string | null;
  paymentAmount: string;
  consumedRefundAmount: string;
  remainingRefundableAmount: string;
  paymentStatus: PaymentStatus | null;
  orderPaymentStatus: PaymentStatus;
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

// ---- Review queue item (GET /admin-orders/fraud-review) ----
// Every field is derived by the backend (toReviewItem). `actions` are the
// transitions the backend will accept for this order right now; the UI must
// not offer anything outside them. Money values are Decimal strings.

export type ReviewReason =
  | "HIGH_RISK_COD"
  | "COD_AWAITING_CONFIRMATION"
  | "PAID_AWAITING_CONFIRMATION"
  | "PAID_STOCK_RELEASED";

export interface ReviewQueueItem {
  id: string;
  orderNumber: string;
  createdAt: string;
  totalAmount: string;
  paymentMethod: string;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  /** null = order placed before risk scoring existed. */
  riskScore: number | null;
  highRisk: boolean;
  reviewReason: ReviewReason;
  /** True only while every live item still holds its stock allocation. */
  stockReserved: boolean;
  reservationReleasedAt: string | null;
  payment: {
    method: string;
    status: string;
    amount: string;
    paidAt: string | null;
    /** Payment arrived after the stock reservation was released. */
    stockHold: boolean;
  } | null;
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    verified: boolean;
    memberSince: string;
    /** Cancelled / returned / failed-to-deliver orders by this customer. */
    problemOrders: number;
  } | null;
  shipTo: { name: string; city: string; address: string } | null;
  vendors: { id: string; storeName: string; subtotal: string; items: number }[];
  actions: { canApprove: boolean; canReject: boolean; canCancel: boolean };
}

export interface ReviewQueueResponse extends PaginatedResponse<ReviewQueueItem> {
  /** Totals per queue, independent of the current queue filter and search. */
  counts: { cod: number; paid: number };
}

// ---- Payment reconciliation (GET /admin-orders/payment-reconciliation) ----
// Verified gateway payments the backend could NOT apply to their order
// (payment-reconciliation.ts). Read-only: nothing here applies or refunds
// them — the payment row keeps its status and the order is untouched.

export type UnappliedReason = "ORDER_ALREADY_PAID" | "ORDER_CANCELLED" | "ORDER_NOT_PAYABLE";

export interface UnappliedPayment {
  id: string;
  method: string;
  /** Unchanged by the reconciliation record (usually PENDING; FAILED for a session that had been marked failed). */
  status: string;
  /** Decimal string. */
  amount: string;
  createdAt: string;
  reconciliation: {
    state: "NEEDS_REVIEW";
    reason: UnappliedReason;
    receivedAt: string;
    gateway: string;
    gatewayRef: string | null;
    amount: string;
  } | null;
  order: {
    id: string;
    orderNumber: string | null;
    status: OrderStatus;
    paymentStatus: PaymentStatus;
    user: { id: string; name: string | null; email: string | null } | null;
  } | null;
}

export type UnappliedPaymentsResponse = PaginatedResponse<UnappliedPayment>;

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

// ---- Courier webhook simulation / COA seeding results ----

export interface SimulateCourierWebhookResult {
  success: boolean;
}

export interface SeedCoaResult {
  success: boolean;
  message?: string;
  created?: number;
  skipped?: number;
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
    "PaymentReconciliation",
    "AdminVendorOrders",
    "Refund",
    "RefundSummary",
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
     * GET /api/admin-orders/payment-reconciliation?page=1&limit=20
     * Phase 6: verified payments that couldn't be applied (read-only queue).
     */
    getUnappliedPayments: builder.query<UnappliedPaymentsResponse, { page?: number; limit?: number }>({
      query: (params) => ({ url: "/admin-orders/payment-reconciliation", method: "GET", params }),
      providesTags: ["PaymentReconciliation"],
    }),

    /**
     * GET /api/admin-orders/fraud-review?page=1
     * PENDING orders awaiting admin review (COD, and paid online orders incl. stock-released holds). Params: queue, search, page, limit
     */
    getAdminFraudReview: builder.query<
      ReviewQueueResponse,
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
     * GET /api/admin-orders/refunds/:refundId   (1C-7B G3)
     * Single refund incl. RefundRecord (null when absent) and the associated
     * VendorReturns consumed by it.
     */
    getAdminRefundById: builder.query<ApiResponse<RefundDetail>, string>({
      query: (refundId) => `/admin-orders/refunds/${refundId}`,
      providesTags: (_result, _error, refundId) => [
        { type: "Refund", id: refundId },
      ],
    }),

    /**
     * GET /api/admin-orders/refunds/summary/:orderId   (1C-7B G6)
     * READ-ONLY remaining-refundable summary (H1 consumed definition).
     * All money fields are Decimal-serialized strings.
     */
    getAdminRefundSummary: builder.query<ApiResponse<RefundSummary>, string>({
      query: (orderId) => `/admin-orders/refunds/summary/${orderId}`,
      providesTags: (_result, _error, orderId) => [
        { type: "RefundSummary", id: orderId },
      ],
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
     * Confirm a PENDING order — non-COD (fraud-cleared / gateway-paid) only.
     * COD orders must go through PATCH /vendor-orders/:vendorOrderId/confirm-cod.
     * Body: { note? }
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
     * Force cancel any non-final order (courier-aware: blocks if already
     * picked up, otherwise cancels the courier booking + releases the
     * stock reservation). Body: { reason }
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
     * Override a specific VendorOrder status. DELIVERED is blocked unless a
     * courierOrder is already linked (phantom-delivery guard).
     * Body: { status, note? }
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
     * Initiate a refund for a paid order. Non-goodwill refunds on shipped
     * orders are blocked until the vendor confirms physical receipt of the
     * returned parcel. Body: { amount, reason, refundType, isGoodwill? }
     */
    // 1C-7B G1: returns the enriched terminal state (refundId/orderId/
    // paymentStatus/refundStatus/refundRecordStatus), not a Refund row.
    processAdminRefund: builder.mutation<
      ApiResponse<RefundMutationResult>,
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
        { type: "RefundSummary", id },
        "AdminOrderStatistics",
      ],
    }),

    /**
     * PATCH /api/admin-orders/refunds/:refundId/approve
     * Approve a customer-submitted return/refund request. Same physical-return
     * gate as processRefund unless isGoodwill=true.
     * Body: { amount, note?, isGoodwill? }
     */
    // 1C-7B G1: enriched terminal response; the result carries orderId so the
    // affected RefundSummary cache entry can be invalidated precisely.
    approveAdminRefund: builder.mutation<
      ApiResponse<RefundMutationResult>,
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
        ...(result?.data?.orderId
          ? [{ type: "RefundSummary" as const, id: result.data.orderId }]
          : []),
        "AdminOrderStatistics",
      ],
    }),

    /**
     * PATCH /api/admin-orders/refunds/:refundId/reject
     * Reject a return/refund request. Body: { reason }
     */
    // 1C-7B G1: enriched terminal response; rejection does not change the
    // consumed balance, but the order's payment state is invalidated via the
    // result's orderId when the backend provides it.
    rejectAdminRefund: builder.mutation<
      ApiResponse<RefundMutationResult>,
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
        ...(result?.data?.orderId
          ? [{ type: "RefundSummary" as const, id: result.data.orderId }]
          : []),
        "AdminOrderStatistics",
      ],
    }),

    // =====================================================
    // COURIER WEBHOOK (DEV/QA) & ACCOUNTING SETUP
    // =====================================================

    /**
     * POST /api/admin-orders/courier-webhook-test/:courierOrderId
     * Dev/QA-only: manually replay a courier status webhook to exercise
     * processCourierStatusUpdate without waiting for the real provider.
     * Body: { newStatus, courierStatus, shipmentKind?, messageEn?, messageBn?, location?, timestamp, rawData?, returnConsignmentId? }
     */
    simulateCourierWebhook: builder.mutation<
      ApiResponse<SimulateCourierWebhookResult>,
      { courierOrderId: string } & SimulateCourierWebhookRequest
    >({
      query: ({ courierOrderId, ...body }) => ({
        url: `/admin-orders/courier-webhook-test/${courierOrderId}`,
        method: "POST",
        body,
      }),
      invalidatesTags: [
        { type: "AdminOrder", id: "LIST" },
        "AdminOrderStatistics",
      ],
    }),

    /**
     * POST /api/admin-orders/seed-platform-coa
     * Run ONCE — idempotent, safe to call again (skips existing accounts).
     * Seeds the platform-level chart of accounts used by the accounting service.
     */
    seedPlatformCoa: builder.mutation<ApiResponse<SeedCoaResult>, void>({
      query: () => ({
        url: "/admin-orders/seed-platform-coa",
        method: "POST",
      }),
    }),

    /**
     * POST /api/admin-orders/seed-vendor-coa/:vendorId
     * Run once per vendor before that vendor's first delivery/refund voucher.
     */
    seedVendorCoa: builder.mutation<ApiResponse<SeedCoaResult>, { vendorId: string }>({
      query: ({ vendorId }) => ({
        url: `/admin-orders/seed-vendor-coa/${vendorId}`,
        method: "POST",
      }),
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
  useGetUnappliedPaymentsQuery,
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
  useGetAdminRefundByIdQuery,
  useGetAdminRefundSummaryQuery,

  // Courier Webhook (Dev/QA) & Accounting Setup
  useSimulateCourierWebhookMutation,
  useSeedPlatformCoaMutation,
  useSeedVendorCoaMutation,
} = adminOrderApi;