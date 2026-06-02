import { createApi } from "@reduxjs/toolkit/query/react";
import baseQueryWithReauth from "./baseQueryWithReauth";

/* ==================== REQUEST TYPES ==================== */

export type PurchaseOrderStatus =
  | "PENDING"
  | "PARTIALLY_PAID"
  | "CONFIRMED"
  | "CANCELLED";

export type EntityType = "ADMIN" | "VENDOR";

export interface PurchaseItemInput {
  variantId: string;
  productName: string;
  variantName: string;
  sku: string;
  quantity: number;
  unitCost: number;
  sellPrice: number;
  expiryDate?: string | null;
}

export interface CreatePurchaseOrderRequest {
  purchaseDate: string;           // ISO date string e.g. "2025-05-07"
  supplierId: string;
  warehouseId: string;
  supplierInvoiceNo?: string;
  vatRate?: number;               // e.g. 0.05 = 5%
  vatCoaAccountId?: string;
  paidAmount?: number;
  paymentMethod?: string;
  paymentCoaAccountId?: string;
  paymentReference?: string;
  notes?: string;
  items: PurchaseItemInput[];
  entityType: EntityType;
  entityId?: string;
}

export interface PayPurchaseDueRequest {
  amount: number;
  method: string;
  coaAccountId: string;
  reference?: string;
  entityType: EntityType;
  entityId?: string;
}

export interface PurchaseOrderListParams {
  supplierId?: string;
  warehouseId?: string;
  status?: PurchaseOrderStatus;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

/* ==================== RESPONSE TYPES ==================== */

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  stats: {
    count: number;
    totalValue: number;
    totalPaid: number;
    totalDue: number;
  };
}

export interface VoucherSummary {
  id: string;
  voucherNumber: string;
  voucherType: string;
}

export interface PurchaseOrderItem {
  id: string;
  variantId: string;
  productName: string;
  variantName: string;
  sku: string;
  quantity: number;
  unitCost: number;
  total: number;
  newAvgCost: number;
  sellPrice: number;
  expiryDate: string | null;
}

export interface PurchasePaymentRecord {
  id: string;
  amount: number;
  method: string;
  reference: string | null;
  paidAt: string;
}

export interface PurchaseOrder {
  id: string;
  purchaseNo: string;
  supplierId: string;
  warehouseId: string;
  supplierInvoiceNo: string | null;
  purchaseDate: string;
  status: PurchaseOrderStatus;
  subtotal: number;
  vatAmount: number;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  notes: string | null;
  supplier: { id: string; name: string };
  warehouse: { id: string; name: string };
  items: PurchaseOrderItem[];
  payments: PurchasePaymentRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrderDetail extends PurchaseOrder {
  vouchers: VoucherSummary[];
}

export interface CreatePurchaseOrderResponse {
  id: string;
  purchaseNo: string;
  status: PurchaseOrderStatus;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  vouchers: VoucherSummary[];
}

export interface PayDueResponse {
  purchaseOrderId: string;
  purchaseNo: string;
  amountPaid: number;
  newDue: number;
  newStatus: PurchaseOrderStatus;
  voucherNumber: string;
}

export interface NextNumberResponse {
  purchaseNo: string;
}

/* ==================== API ==================== */

export const purchaseOrderApi = createApi({
  reducerPath: "purchaseOrderApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["PurchaseOrder", "PurchaseOrderDetail"],

  endpoints: (builder) => ({

    /* ─── GET /api/purchase-orders/next-number ────────────────────────────── */
    getNextPurchaseNumber: builder.query<ApiResponse<NextNumberResponse>, void>({
      query: () => "/purchase-orders/next-number",
    }),

    /* ─── POST /api/purchase-orders ──────────────────────────────────────── */
    createPurchaseOrder: builder.mutation<
      ApiResponse<CreatePurchaseOrderResponse>,
      CreatePurchaseOrderRequest
    >({
      query: (body) => ({
        url: "/purchase-orders",
        method: "POST",
        body,
      }),
      invalidatesTags: ["PurchaseOrder"],
    }),

    /* ─── GET /api/purchase-orders ───────────────────────────────────────── */
    getPurchaseOrders: builder.query<
      PaginatedResponse<PurchaseOrder>,
      PurchaseOrderListParams
    >({
      query: (params) => ({
        url: "/purchase-orders",
        params,
      }),
      providesTags: ["PurchaseOrder"],
    }),

    /* ─── GET /api/purchase-orders/:id ───────────────────────────────────── */
    getPurchaseOrderById: builder.query<ApiResponse<PurchaseOrderDetail>, string>({
      query: (id) => `/purchase-orders/${id}`,
      providesTags: (_result, _error, id) => [{ type: "PurchaseOrderDetail", id }],
    }),

    /* ─── POST /api/purchase-orders/:id/payments ─────────────────────────── */
    payPurchaseDue: builder.mutation<
      ApiResponse<PayDueResponse>,
      { id: string; data: PayPurchaseDueRequest }
    >({
      query: ({ id, data }) => ({
        url: `/purchase-orders/${id}/payments`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "PurchaseOrderDetail", id },
        "PurchaseOrder",
      ],
    }),
  }),
});

/* ==================== EXPORT HOOKS ==================== */

export const {
  useGetNextPurchaseNumberQuery,
  useLazyGetNextPurchaseNumberQuery,
  useCreatePurchaseOrderMutation,
  useGetPurchaseOrdersQuery,
  useLazyGetPurchaseOrdersQuery,
  useGetPurchaseOrderByIdQuery,
  useLazyGetPurchaseOrderByIdQuery,
  usePayPurchaseDueMutation,
} = purchaseOrderApi;