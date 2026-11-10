// src/redux/paymentApi.ts
import { createApi } from "@reduxjs/toolkit/query/react";
import baseQueryWithReauth from "./baseQueryWithReauth";

// ------- Types -------

export type PaymentMethod =
  | "COD"
  | "SSLCOMMERZ"
  | "EPS"
  | "PAYSTATION"
  | "BKASH"
  | "NAGAD"
  | "ROCKET"
  | "WALLET"
  | "BANK_TRANSFER";

export type GatewayCode = "BKASH" | "NAGAD" | "UPAY" | "EBL_COF" | "COD" | "ONLINE";

export type PaymentStatus =
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "REFUNDED"
  | "PARTIALLY_REFUNDED";

export type RefundType =
  | "FULL_REFUND"
  | "PARTIAL_REFUND"
  | "CHARGEBACK"
  | "CUSTOMER_INITIATED"
  | "VENDOR_INITIATED"
  | "ADMIN_INITIATED";

export type RefundStatus =
  | "PENDING"
  | "APPROVED"
  | "PROCESSING"
  | "REFUNDED"
  | "FAILED"
  | "REJECTED"
  | "CANCELLED";

// ---- Active gateway (public, no secrets) ----

export interface ActiveGateway {
  id: string;
  name: string;
  displayName: string | null;
  logo: string | null;
  slug: string;
}

export interface ActiveGatewayResponse {
  success: true;
  data: ActiveGateway | null; // null = no gateway configured yet
}

// ---- Initiate payment ----

export interface CreatePaymentDto {
  orderId: string;
  userId: string;
  gatewayCode: GatewayCode;
}

export interface CreatePaymentOnlineResponse {
  success: true;
  data: {
    gatewayPageURL: string;
    sessionKey: string | null;
    transactionId: string;
  };
}

export interface CreatePaymentCodResponse {
  success: true;
  message: string;
  data: {
    id: string;
    status: string;
  };
}

export type CreatePaymentResponse =
  | CreatePaymentOnlineResponse
  | CreatePaymentCodResponse;

// ---- Payment records ----

export interface SSLCommerzDetail {
  id: string;
  tranId: string;
  valId: string | null;
  bankTranId: string | null;
  cardType: string | null;
  cardBrand: string | null;
  cardIssuer: string | null;
  status: string;
  riskLevel: string | null;
  riskTitle: string | null;
}

export interface Payment {
  id: string;
  orderId: string;
  method: PaymentMethod;
  amount: string; // Decimal serialized as string
  status: PaymentStatus;
  meta: Record<string, unknown> | null;
  createdAt: string;
  paidAt: string | null;
  sslCommerzDetail?: SSLCommerzDetail | null;
}

export interface PaymentStatusResponse {
  success: true;
  data: Payment[];
}

export interface TransactionDetailsResponse {
  success: true;
  data: {
    status: string;
    tran_id: string;
    no_of_trans_found?: number;
    element?: Array<Record<string, unknown>>;
    [key: string]: unknown;
  };
}

// ---- COD delivery fee ----

// Phase 4 (D4): the server derives the payer (the logged-in owner) and the
// amount (the order's own delivery fee) — neither is sent from the client.
export interface ProcessDeliveryFeeDto {
  orderId: string;
  gatewayCode?: GatewayCode;
}

export interface ProcessDeliveryFeeResponse {
  success: true;
  data: {
    payment: Payment;
    sslResponse: {
      gatewayPageURL: string;
      sessionKey: string;
      transactionId: string;
    };
  };
}

export interface ConfirmDeliveryFeeDto {
  tranId: string;
  valId: string;
}

export interface ConfirmDeliveryFeeResponse {
  success: true;
  data: Payment;
}

// ---- Refunds (customer/vendor-facing request only) ----

export interface RequestRefundDto {
  orderId: string;
  refundAmount: number;
  refundReason: string;
  refundType: RefundType;
}

export interface RefundRecord {
  id: string;
  refundId: string;
  refundNumber: string;
  sslTranId: string | null;
  vendorId: string;
  customerId: string;
  refundType: RefundType;
  originalAmount: string;
  refundAmount: string;
  refundReason: string;
  status: RefundStatus;
  sslRefundRefId: string | null;
  sslRefundStatus: string | null;
  initiatedBy: string | null;
  approvedBy: string | null;
  rejectedBy: string | null;
  rejectionReason: string | null;
  /** 1C-5C failure state — populated when a gateway refund definitively failed. */
  failedReason: string | null;
  failedAt: string | null;
  initiatedAt: string;
  approvedAt: string | null;
  processedAt: string | null;
  completedAt: string | null;
  rejectedAt: string | null;
}

export interface Refund {
  id: string;
  orderId: string;
  amount: string;
  reason: string | null;
  status: RefundStatus;
  createdAt: string;
  processedAt: string | null;
  detail?: RefundRecord | null;
}

export interface RequestRefundResponse {
  success: true;
  message: string;
  data: {
    refund: Refund;
    detail: RefundRecord;
  };
}

export interface RefundStatusResponse {
  success: true;
  data:
    | { source: "internal"; status: RefundStatus | "NOT_FOUND" }
    | { source: "sslcommerz"; internal: Refund; gateway: Record<string, unknown> };
}

export interface RefundsByOrderResponse {
  success: true;
  data: Refund[];
}

export interface ApiErrorResponse {
  success: false;
  message: string;
}

// ------- Payment result (after a gateway redirect) -------
// The backend derives `state` from the PERSISTED payment + order state; the
// redirect URL is never trusted. Only the order's own customer gets a result.

export type PaymentResultState = "CONFIRMED" | "HELD" | "UNAPPLIED" | "PENDING" | "FAILED" | "CANCELLED" | "ORDER_CANCELLED" | "REFUNDED";

export interface PaymentResult {
  transactionId: string;
  state: PaymentResultState;
  purpose: "order_payment" | "delivery_fee";
  /** Why a paid order is not confirmed yet: its stock reservation was released, or it awaits review. */
  holdReason: "STOCK" | "REVIEW" | null;
  /** UNAPPLIED: the money was received but not applied — the order was already paid, cancelled or had moved on. Recorded for FinixMart review. */
  unappliedReason?: "ORDER_ALREADY_PAID" | "ORDER_CANCELLED" | "ORDER_NOT_PAYABLE" | null;
  /** PENDING only: the payment page reported a failure / cancellation the provider has NOT confirmed. */
  gatewayReport?: "FAILED" | "CANCELLED" | null;
  amount: string;
  method: string;
  paidAt: string | null;
  order: { id: string; orderNumber: string | null; status: string };
}

export interface PaymentResultResponse {
  success: boolean;
  data: PaymentResult;
}

// ------- API -------

export const paymentApi = createApi({
  reducerPath: "paymentApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Payment", "Refund", "ActiveGateway"],

  endpoints: (builder) => ({
    // ------- Which gateway is live right now (public, no secrets) -------
    getActiveGateway: builder.query<ActiveGatewayResponse, void>({
      query: () => "/payment/active-gateway",
      providesTags: ["ActiveGateway"],
    }),

    // ------- Initiate payment (BKASH/NAGAD/UPAY/EBL_COF/COD) -------
    createPayment: builder.mutation<CreatePaymentResponse, CreatePaymentDto>({
      query: (body) => ({
        url: "/payment/init",
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { orderId }) => [{ type: "Payment", id: orderId }],
    }),

    // ------- Persisted result of one transaction (owner only; 404 otherwise) -------
    getPaymentResult: builder.query<PaymentResultResponse, string>({
      query: (transactionId) => `/payment/result/${encodeURIComponent(transactionId)}`,
      keepUnusedDataFor: 0, // always re-read: the result changes once the gateway confirms
    }),

    // ------- Get payment status/history for an order -------
    getPaymentStatus: builder.query<PaymentStatusResponse, string>({
      query: (orderId) => `/payment/status/${orderId}`,
      providesTags: (result, error, orderId) => [{ type: "Payment", id: orderId }],
    }),

    // ------- Query live transaction status by transaction ID -------
    getTransactionDetails: builder.query<TransactionDetailsResponse, string>({
      query: (transactionId) => `/payment/details/${transactionId}`,
    }),

    // ------- COD: initiate delivery-fee prepayment -------
    processDeliveryFee: builder.mutation<ProcessDeliveryFeeResponse, ProcessDeliveryFeeDto>({
      query: (body) => ({
        url: "/payment/cod/delivery-fee",
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { orderId }) => [{ type: "Payment", id: orderId }],
    }),

    // ------- COD: confirm delivery-fee payment after gateway redirect -------
    confirmDeliveryFee: builder.mutation<ConfirmDeliveryFeeResponse, ConfirmDeliveryFeeDto>({
      query: (body) => ({
        url: "/payment/cod/confirm-delivery-fee",
        method: "POST",
        body,
      }),
      invalidatesTags: (result) =>
        result ? [{ type: "Payment", id: result.data.orderId }] : [],
    }),

    // ------- Request a refund (goes to PENDING, awaits admin approval) -------
    requestRefund: builder.mutation<RequestRefundResponse, RequestRefundDto>({
      query: (body) => ({
        url: "/payment/refund/request",
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { orderId }) => [{ type: "Refund", id: orderId }],
    }),

    // ------- Query a single refund's status (internal + gateway) -------
    getRefundStatus: builder.query<RefundStatusResponse, string>({
      query: (refundId) => `/payment/refund/${refundId}/status`,
      providesTags: (result, error, refundId) => [{ type: "Refund", id: refundId }],
    }),

    // ------- List all refunds for an order -------
    getRefundsByOrder: builder.query<RefundsByOrderResponse, string>({
      query: (orderId) => `/payment/refund/order/${orderId}`,
      providesTags: (result, error, orderId) => [{ type: "Refund", id: orderId }],
    }),
  }),
});

// ------- Export hooks -------
export const {
  // Queries
  useGetActiveGatewayQuery,
  useGetPaymentResultQuery,
  useGetPaymentStatusQuery,
  useGetTransactionDetailsQuery,
  useGetRefundStatusQuery,
  useGetRefundsByOrderQuery,

  // Mutations
  useCreatePaymentMutation,
  useProcessDeliveryFeeMutation,
  useConfirmDeliveryFeeMutation,
  useRequestRefundMutation,

  // Lazy queries
  useLazyGetPaymentStatusQuery,
  useLazyGetTransactionDetailsQuery,
  useLazyGetRefundStatusQuery,
  useLazyGetRefundsByOrderQuery,
} = paymentApi;