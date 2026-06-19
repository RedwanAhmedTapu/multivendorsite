import { createApi } from "@reduxjs/toolkit/query/react";
import baseQueryWithReauth from "./baseQueryWithReauth";

// ─────────────────────────────────────────────
// ENUMS  (mirror Prisma schema exactly)
// ─────────────────────────────────────────────

export enum ChargeValueType {
  FLAT       = "FLAT",
  PERCENTAGE = "PERCENTAGE",
}

export enum ChargeAppliesTo {
  ALL         = "ALL",
  COD_ONLY    = "COD_ONLY",
  PREPAID_ONLY = "PREPAID_ONLY",
}

export enum PaymentMethod {
  COD     = "COD",
  PREPAID = "PREPAID",
}

// ─────────────────────────────────────────────
// REQUEST TYPES
// ─────────────────────────────────────────────

export interface CreateOrderChargeRequest {
  key: string;
  label: string;
  type: ChargeValueType;
  value: number;
  isActive?: boolean;
  appliesTo?: ChargeAppliesTo;
  sortOrder?: number;
  description?: string;
}

export interface UpdateOrderChargeRequest {
  label?: string;
  type?: ChargeValueType;
  value?: number;
  isActive?: boolean;
  appliesTo?: ChargeAppliesTo;
  sortOrder?: number;
  description?: string;
}

export interface ToggleOrderChargeRequest {
  isActive: boolean;
}

export interface GetOrderSummaryRequest {
  subtotal: number;
  paymentMethod?: PaymentMethod;
}

// ─────────────────────────────────────────────
// RESPONSE TYPES
// ─────────────────────────────────────────────

export interface OrderChargeType {
  id: string;
  key: string;
  label: string;
  type: ChargeValueType;
  value: number;
  isActive: boolean;
  appliesTo: ChargeAppliesTo;
  sortOrder: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppliedCharge {
  key: string;
  label: string;
  amount: number;
}

export interface OrderSummary {
  subtotal: number;
  charges: AppliedCharge[];
  total: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// ─────────────────────────────────────────────
// API
// ─────────────────────────────────────────────

const BASE = "order-charges";

export const orderChargeApi = createApi({
  reducerPath: "orderChargeApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["OrderCharge", "OrderSummary"],
  endpoints: (builder) => ({

    // ── Admin CRUD ────────────────────────────

    /** GET /order-charges — admin list */
    listOrderCharges: builder.query<ApiResponse<OrderChargeType[]>, void>({
      query: () => BASE,
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ id }) => ({ type: "OrderCharge" as const, id })),
              { type: "OrderCharge", id: "LIST" },
            ]
          : [{ type: "OrderCharge", id: "LIST" }],
    }),

    /** GET /order-charges/:id */
    getOrderCharge: builder.query<ApiResponse<OrderChargeType>, string>({
      query: (id) => `${BASE}/${id}`,
      providesTags: (_, __, id) => [{ type: "OrderCharge", id }],
    }),

    /** POST /order-charges */
    createOrderCharge: builder.mutation<ApiResponse<OrderChargeType>, CreateOrderChargeRequest>({
      query: (body) => ({ url: BASE, method: "POST", body }),
      invalidatesTags: [{ type: "OrderCharge", id: "LIST" }, "OrderSummary"],
    }),

    /** PATCH /order-charges/:id */
    updateOrderCharge: builder.mutation<ApiResponse<OrderChargeType>, { id: string; data: UpdateOrderChargeRequest }>(
      {
        query: ({ id, data }) => ({ url: `${BASE}/${id}`, method: "PATCH", body: data }),
        invalidatesTags: (_, __, { id }) => [
          { type: "OrderCharge", id },
          { type: "OrderCharge", id: "LIST" },
          "OrderSummary",
        ],
      }
    ),

    /** PATCH /order-charges/:id/toggle */
    toggleOrderCharge: builder.mutation<ApiResponse<OrderChargeType>, { id: string; data: ToggleOrderChargeRequest }>(
      {
        query: ({ id, data }) => ({ url: `${BASE}/${id}/toggle`, method: "PATCH", body: data }),
        invalidatesTags: (_, __, { id }) => [
          { type: "OrderCharge", id },
          { type: "OrderCharge", id: "LIST" },
          "OrderSummary",
        ],
      }
    ),

    /** DELETE /order-charges/:id */
    deleteOrderCharge: builder.mutation<ApiResponse<{ message: string }>, string>({
      query: (id) => ({ url: `${BASE}/${id}`, method: "DELETE" }),
      invalidatesTags: (_, __, id) => [
        { type: "OrderCharge", id },
        { type: "OrderCharge", id: "LIST" },
        "OrderSummary",
      ],
    }),

    // ── Checkout ──────────────────────────────

    /** GET /order-charges/summary?subtotal=786&paymentMethod=COD */
    getOrderSummary: builder.query<ApiResponse<OrderSummary>, GetOrderSummaryRequest>({
      query: ({ subtotal, paymentMethod }) => {
        const qs = new URLSearchParams({
          subtotal: String(subtotal),
          ...(paymentMethod ? { paymentMethod } : {}),
        });
        return `${BASE}/summary?${qs.toString()}`;
      },
      providesTags: ["OrderSummary"],
    }),
  }),
});

// ─────────────────────────────────────────────
// EXPORTED HOOKS
// ─────────────────────────────────────────────

export const {
  // Admin queries
  useListOrderChargesQuery,
  useLazyListOrderChargesQuery,
  useGetOrderChargeQuery,
  useLazyGetOrderChargeQuery,

  // Admin mutations
  useCreateOrderChargeMutation,
  useUpdateOrderChargeMutation,
  useToggleOrderChargeMutation,
  useDeleteOrderChargeMutation,

  // Checkout
  useGetOrderSummaryQuery,
  useLazyGetOrderSummaryQuery,
} = orderChargeApi;