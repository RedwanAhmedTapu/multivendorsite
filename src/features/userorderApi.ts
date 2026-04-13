import { createApi } from "@reduxjs/toolkit/query/react";
import baseQueryWithReauth from "./baseQueryWithReauth";

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
}

export interface OrderVariant {
  id: string;
  sku: string;
  name: string | null;
  price: number;
  specialPrice: number | null;
  images: OrderVariantImage[];
  product: OrderVariantProduct;
}

export interface OrderItem {
  id: string;
  quantity: number;
  price: number;
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

export interface CourierInfo {
  id: string;
  courierTrackingId: string | null;
  courierOrderId: string | null;
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
  courierOrder: CourierInfo | null;
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
  amount: number;
  reason: string | null;
  status: string;
  createdAt: string;
}

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

export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";

export type FulfillmentStatus =
  | "UNFULFILLED"
  | "PARTIALLY_FULFILLED"
  | "FULFILLED"
  | "SHIPPED"
  | "DELIVERED"
  | "RETURNED"
  | "CANCELLED";

// ─── Order shapes ─────────────────────────────────────────────────────────────

/** Returned in list responses — matches GET /orders */
export interface OrderSummary {
  id: string;
  orderNumber: string | null;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  totalAmount: number;
  subtotal: number | null;
  shippingCost: number | null;
  discountAmount: number | null;
  createdAt: string;
  confirmedAt: string;
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

export interface VendorOrderTracking {
  id: string;
  status: OrderStatus;
  shippedAt: string | null;
  deliveredAt: string | null;
  vendor: OrderVendor;
  courierOrder:
    | (CourierInfo & {
        courier_tracking_history: TrackingEvent[];
      })
    | null;
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
 * Controller reads `userAddressId` from req.body — no checkoutSessionId needed.
 */
export interface PlaceOrderRequest {
  userAddressId: string; // ✅ fixed: was `checkoutSessionId`
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
 */
export interface CancelOrderRequest {
  orderId: string;
  reason?: string;
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
     * Body: { userAddressId }
     */
    placeOrder: builder.mutation<PlaceOrderResponse, PlaceOrderRequest>({
      query: (body) => ({
        url: "/user-orders",
        method: "POST",
        body, // sends { userAddressId }
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
     * Cancels a PENDING order. Restores stock + creates refund if paid.
     */
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
} = userOrderApi;