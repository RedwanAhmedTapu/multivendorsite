import { createApi } from "@reduxjs/toolkit/query/react";
import baseQueryWithReauth from "./baseQueryWithReauth";

// ─── Enums (mirror Prisma) ────────────────────────────────────────────────────

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

export type PaymentStatus = "PENDING" | "PAID" | "PARTIALLY_REFUNDED" | "FAILED" | "REFUNDED";

/** Persisted Refund.status values (Prisma RefundStatus). */
export type RefundStatus = "PENDING" | "APPROVED" | "PROCESSING" | "REFUNDED" | "FAILED" | "REJECTED" | "CANCELLED";

export type FulfillmentStatus =
  | "UNFULFILLED"
  | "PARTIALLY_FULFILLED"
  | "FULFILLED"
  | "SHIPPED"
  | "DELIVERED"
  | "RETURNED"
  | "CANCELLED";

/** Order.paymentmethod is now mandatory at placement time. */
export type PaymentMethod =
  | "COD"
  | "SSLCOMMERZ"
  | "BKASH"
  | "NAGAD"
  | "ROCKET"
  | "WALLET"
  | "BANK_TRANSFER";

// ─── Shared sub-types ─────────────────────────────────────────────────────────

export interface OrderVendor {
  id: string;
  storeName: string;
  avatar: string | null;
}

export interface OrderVariantImage {
  url: string;
  altText: string | null;
}

export interface OrderVariantProduct {
  id: string;
  name: string;
  slug: string;
  vendorId: string;
}

export interface OrderVariant {
  id: string;
  sku: string;
  name: string | null;
  price: number;
  specialPrice: number | null;
  taxRate: number | null;
  images: OrderVariantImage[];
  product: OrderVariantProduct;
}

export interface OrderItem {
  id: string;
  quantity: number;
  /** Unit price actually paid (persisted at order time; Decimal → may arrive as a string). */
  price: number | string;
  deliveredQuantity: number | null;
  returnedQuantity: number | null;
  variant: OrderVariant;
}

export interface OrderAddress {
  receiverFullName: string;
  phone: string;
  city: string;
  address: string;
}

// ─── List-level vendor order (lighter) ───────────────────────────────────────

export interface VendorOrderSummary {
  id: string;
  status: OrderStatus;
  fulfillmentStatus: FulfillmentStatus;
  subtotal: number;
  vendor: OrderVendor;
  items: OrderItem[];
}

// ─── Detail-level vendor order (includes courier + timestamps) ───────────────

export interface CourierProvider {
  id: string;
  displayName: string | null;
  logo: string | null;
}

/** Shape returned inline on Order/OrderDetail.vendorOrders[].courierOrder — no tracking history. */
export interface CourierSummary {
  id: string;
  courierTrackingId: string | null;
  status: string;
  recipientName: string;
  recipientAddress: string;
  deliveryCharge: number;
  codAmount: number;
  createdAt: string;
  pickedUpAt: string | null;
  inTransitAt: string | null;
  deliveredAt: string | null;
  courier_providers: CourierProvider | null;
}

export interface VendorOrderDetail extends VendorOrderSummary {
  shippingCost: number;
  shippedAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  courierOrder: CourierSummary | null;
}

// ─── Payment & Refund ─────────────────────────────────────────────────────────

export interface OrderPayment {
  id: string;
  method: string;
  amount: number;
  status: PaymentStatus;
  createdAt: string;
  paidAt: string | null;
}

export interface OrderRefund {
  id: string;
  /** Decimal — may arrive as a string. */
  amount: number | string;
  reason: string | null;
  status: RefundStatus;
  createdAt: string;
}

/**
 * Derived by the backend from the same rules it enforces (GET /user-orders/:id).
 * The cancel / Pay Now endpoints re-check — this only decides what to offer.
 */
export interface CustomerOrderActions {
  canPayNow: boolean;
  canCancel: boolean;
  cancelBlockedReason: "ALREADY_CANCELLED" | "DISPATCHED" | "COURIER_BOOKING_ACTIVE" | null;
}

/** POST /user-orders/:orderId/pay-now — the gateway page issued by the active gateway. */
export interface PayNowResponse {
  success: boolean;
  data: { gatewayPageURL: string; transactionId: string };
}

/** Error body of Pay Now (stable codes). */
export interface PayNowErrorBody {
  success: false;
  code?: "NOT_FOUND" | "NOT_PAYABLE" | "COD_ORDER" | "PAYMENT_IN_PROGRESS" | "STOCK_UNAVAILABLE" | "RESERVATION_CHANGED" | "GATEWAY_ERROR" | "INVALID_GATEWAY" | "PAY_NOW_FAILED";
  message?: string;
  retryAfterSeconds?: number;
}

// ─── Order shapes ─────────────────────────────────────────────────────────────

/** Returned in list responses — matches GET /orders */
export interface OrderSummary {
  id: string;
  orderNumber: string | null;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  /** Chosen at placement (COD or an online gateway). */
  paymentmethod?: PaymentMethod | string;
  fulfillmentStatus: FulfillmentStatus;
  totalAmount: number;
  subtotal: number | null;
  shippingCost: number | null;
  discountAmount: number | null;
  createdAt: string;
  /** Stays null until an actual confirm action happens (fraud-clear / COD confirm). */
  confirmedAt: string | null;
  vendorOrders: VendorOrderSummary[];
  address: OrderAddress | null;
}

/** Returned in single-order / detail responses — matches GET /orders/:id */
export interface OrderDetail extends OrderSummary {
  paidAt: string | null;
  cancelledAt: string | null;
  payments: OrderPayment[];
  refunds: OrderRefund[];
  vendorOrders: VendorOrderDetail[];
  customerActions?: CustomerOrderActions;
}

// ─── Tracking types ───────────────────────────────────────────────────────────

export interface TrackingEvent {
  id: string;
  status: string;
  courierStatus: string;
  messageEn: string;
  messageBn: string | null;
  location: string | null;
  timestamp: string;
}

/** Fuller courier shape used only by getOrderTracking — includes history + return/cancel timestamps. */
export interface CourierTrackingInfo {
  id: string;
  courierTrackingId: string | null;
  courierOrderId: string | null;
  status: string;
  courierStatus: string | null;
  shipmentKind: string | null;
  recipientName: string;
  recipientAddress: string;
  deliveryCharge: number;
  codAmount: number;
  createdAt: string;
  pickedUpAt: string | null;
  inTransitAt: string | null;
  deliveredAt: string | null;
  returnedAt: string | null;
  cancelledAt: string | null;
  courier_providers: CourierProvider | null;
  courier_tracking_history: TrackingEvent[];
}

export interface VendorOrderTracking {
  id: string;
  status: OrderStatus;
  shippedAt: string | null;
  deliveredAt: string | null;
  vendor: OrderVendor;
  courierOrder: CourierTrackingInfo | null;
}

export interface OrderTracking {
  orderId: string;
  orderNumber: string | null;
  orderStatus: OrderStatus;
  vendorOrders: VendorOrderTracking[];
}

// ─── Request types ────────────────────────────────────────────────────────────

/**
 * POST /orders
 * Places a new order from the user's selected cart items.
 * paymentMethod is now mandatory (schema: Order.paymentmethod).
 * COD gets no accounting voucher until delivery; non-COD methods get a
 * PENDING Payment placeholder created immediately for the gateway flow.
 */
export interface PlaceOrderRequest {
  userAddressId: string;
  paymentMethod: PaymentMethod;
  /** The reviewed checkout quote (POST /cart-wish/delivery-fees). Required. */
  quoteHash: string;
  /** The customer accepted prices that changed since the items were added. */
  acknowledgePriceChanges?: boolean;
}

/**
 * GET /orders
 */
export interface GetMyOrdersRequest {
  page?: number;
  limit?: number;
  status?: OrderStatus;
}

/**
 * PATCH /orders/:orderId/cancel
 * Only PENDING orders can be cancelled this way — post-confirm cancellation
 * must go through the admin courier-aware cancel flow instead.
 */
export interface CancelOrderRequest {
  orderId: string;
  reason: string;
}

// ─── Response wrappers ────────────────────────────────────────────────────────

export interface PaginatedOrdersResponse {
  success: boolean;
  data: OrderSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface OrderDetailResponse {
  success: boolean;
  data: OrderDetail;
}

export interface PlaceOrderResponse {
  success: boolean;
  data: OrderDetail;
}

export interface CancelOrderResponse {
  success: boolean;
  data: OrderDetail;
}

export interface OrderTrackingResponse {
  success: boolean;
  data: OrderTracking;
}

// ─── API slice ────────────────────────────────────────────────────────────────

export const userOrderApi = createApi({
  reducerPath: "userOrderApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Order", "OrderTracking"],
  endpoints: (builder) => ({
    /**
     * POST /orders
     * Places a new order directly from the user's selected cart items.
     * Body: { userAddressId, paymentMethod, quoteHash, acknowledgePriceChanges? }
     * 409 CHECKOUT_CHANGED (data.quote = the fresh quote) when the order no
     * longer matches the reviewed quote — nothing was placed.
     */
    placeOrder: builder.mutation<PlaceOrderResponse, PlaceOrderRequest>({
      query: (body) => ({
        url: "/user-orders",
        method: "POST",
        body, // sends { userAddressId, paymentMethod, quoteHash, acknowledgePriceChanges }
      }),
      invalidatesTags: [
        { type: "Order", id: "LIST" },
      ],
    }),

    /**
     * GET /orders?page=1&limit=10&status=PENDING
     * Returns paginated order list for the logged-in user.
     */
    getMyOrders: builder.query<PaginatedOrdersResponse, GetMyOrdersRequest>({
      query: ({ page = 1, limit = 10, status } = {}) => ({
        url: "/user-orders",
        method: "GET",
        params: {
          page,
          limit,
          ...(status ? { status } : {}),
        },
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({
                type: "Order" as const,
                id,
              })),
              { type: "Order", id: "LIST" },
            ]
          : [{ type: "Order", id: "LIST" }],
    }),

    /**
     * GET /orders/:orderId
     * Returns full detail for a single order.
     */
    getOrderById: builder.query<OrderDetailResponse, string>({
      query: (orderId) => ({
        url: `/user-orders/${orderId}`,
        method: "GET",
      }),
      providesTags: (_result, _error, orderId) => [
        { type: "Order", id: orderId },
      ],
    }),

    /**
     * GET /orders/:orderId/tracking
     * Returns courier tracking info for all vendor sub-orders.
     */
    trackOrder: builder.query<OrderTrackingResponse, string>({
      query: (orderId) => ({
        url: `/user-orders/${orderId}/tracking`,
        method: "GET",
      }),
      providesTags: (_result, _error, orderId) => [
        { type: "OrderTracking", id: orderId },
      ],
    }),

    /**
     * PATCH /orders/:orderId/cancel
     * Cancels a PENDING order. Restores stock reservation + creates a
     * PENDING refund record if a payment had already been captured.
     */
    /**
     * POST /user-orders/:orderId/pay-now
     * Opens a gateway session for a PAYMENT_PENDING online order and returns
     * the gateway page URL. Nothing is paid until the gateway confirms.
     * 409 PAYMENT_IN_PROGRESS (retryAfterSeconds) while another session is open.
     */
    payNow: builder.mutation<PayNowResponse, { orderId: string; gatewayCode?: string }>({
      query: ({ orderId, gatewayCode }) => ({
        url: `/user-orders/${encodeURIComponent(orderId)}/pay-now`,
        method: "POST",
        body: gatewayCode ? { gatewayCode } : {},
      }),
      // A refusal (e.g. no longer payable) means the order changed — refresh it.
      invalidatesTags: (result, _error, { orderId }) => (result ? [] : [{ type: "Order", id: orderId }]),
    }),

    cancelOrder: builder.mutation<CancelOrderResponse, CancelOrderRequest>({
      query: ({ orderId, reason }) => ({
        url: `/user-orders/${orderId}/cancel`,
        method: "PATCH",
        body: { reason },
      }),
      invalidatesTags: (_result, _error, { orderId }) => [
        { type: "Order", id: orderId },
        { type: "Order", id: "LIST" },
      ],
    }),
  }),
});

// ─── Export hooks ─────────────────────────────────────────────────────────────

export const {
  usePlaceOrderMutation,
  useGetMyOrdersQuery,
  useGetOrderByIdQuery,
  useTrackOrderQuery,
  useCancelOrderMutation,
  usePayNowMutation,
} = userOrderApi;