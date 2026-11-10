import { createApi } from "@reduxjs/toolkit/query/react";
import baseQueryWithReauth from "./baseQueryWithReauth";

/* ==================== REQUEST TYPES ==================== */

/** Two independent status enums on PurchaseOrder.
 *  SHORT_CLOSED added — a PO whose remaining un-received quantity was
 *  permanently written off via POST /:id/short-close. */
export type ReceivingStatus =
  | "DRAFT"
  | "CONFIRMED"
  | "PARTIALLY_RECEIVED"
  | "FULLY_RECEIVED"
  | "SHORT_CLOSED"
  | "CANCELLED";

/** OVERPAID added — a PO can end up here after short-close/cancel/return
 *  reduces totalAmount below what was already paid; the excess becomes
 *  PurchaseOrder.creditBalance, refundable via POST /:id/refund-credit. */
export type PaymentStatus = "UNPAID" | "PARTIALLY_PAID" | "PAID" | "OVERPAID";

export type EntityType = "ADMIN" | "VENDOR";

/** Per-item warehouseId / rackId / rowNumber / shelfNumber / specialPrice
 *  are NOT set here — bin assignment happens via POST /:id/receive.
 *  discountPercent is accepted but NOT persisted; it's applied to unitCost
 *  at order time. */
export interface PurchaseItemInput {
  variantId: string;
  productName: string;
  variantName: string;
  sku: string;
  quantity: number;
  unitCost: number;
  /** 0-100. Applied to unitCost before inventory/COGS + avgCost calculations.
   *  NOT stored as its own column on PurchaseOrderItem. */
  discountPercent?: number;
  mrpPrice?: number;
  sellPrice: number;
  expiryDate?: string | null;
}

/** warehouseId is optional at the PO level per the current service (a PO
 *  can be created without a default warehouse; bins are assigned per-line
 *  at receive time). */
export interface CreatePurchaseOrderRequest {
  purchaseDate: string; // ISO date string e.g. "2025-05-07"
  supplierId: string;
  warehouseId?: string;
  supplierInvoiceNo?: string;
  vatRate?: number; // e.g. 0.05 = 5%
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

/** Backs POST /:id/receive. Bin assignment lives here; supports partial
 *  damaged quantity per line. */
export interface ReceivePurchaseOrderItemInput {
  purchaseOrderItemId: string;
  quantity: number;
  /** Portion of `quantity` that arrived damaged. Booked into
   *  WarehouseStock.damagedQty instead of sellable quantity and excluded
   *  from the weighted-average cost recalculation. Defaults to 0. */
  damagedQuantity?: number;
  warehouseId: string;
  rackId?: string | null;
  rowNumber?: number | null;
  shelfNumber?: number | null;
}

export interface ReceivePurchaseOrderRequest {
  receivedBy?: string;
  notes?: string;
  items: ReceivePurchaseOrderItemInput[];
}

export interface PayPurchaseDueRequest {
  amount: number;
  method: string;
 vendorPaymentAccountId: string;
  reference?: string;
  entityType: EntityType;
  entityId?: string;
}

/** Backs POST /:id/short-close (Group A1/A2). */
export interface ShortCloseItemInput {
  purchaseOrderItemId: string;
  /** Quantity of the still-outstanding (ordered - received - already
   *  cancelled) balance to permanently write off. */
  cancelQuantity: number;
}

export interface ShortClosePurchaseOrderRequest {
  reason: string;
  items: ShortCloseItemInput[];
  entityType: EntityType;
  entityId?: string;
}

/** Backs POST /:id/cancel (Group B1/B2). Cancels everything still
 *  outstanding on the PO — no per-item selection needed. */
export interface CancelPurchaseOrderRequest {
  reason: string;
  entityType: EntityType;
  entityId?: string;
}

/** Backs POST /:id/returns (Group C1). */
export interface ReturnItemInput {
  purchaseOrderItemId: string;
  quantity: number;
  warehouseId: string;
  rackId?: string | null;
}

export interface ReturnPurchaseOrderRequest {
  reason: string;
  items: ReturnItemInput[];
  returnedBy?: string;
  entityType: EntityType;
  entityId?: string;
}

/** Backs POST /:id/refund-credit (Group D1). */
export interface RefundPurchaseOrderCreditRequest {
  amount: number;
  method: string;
  vendorPaymentAccountId: string;
  reference?: string;
  entityType: EntityType;
  entityId?: string;
}

export interface PurchaseOrderListParams {
  supplierId?: string;
  warehouseId?: string;
  receivingStatus?: ReceivingStatus;
  paymentStatus?: PaymentStatus;
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

export interface VoucherLedgerEntry {
  id: string;
  accountId: string;
  account?: { id: string; code: string; name: string };
  debitAmount: number;
  creditAmount: number;
  description: string | null;
}

export interface VoucherDetail extends VoucherSummary {
  voucherDate: string;
  narration: string;
  totalDebit: number;
  totalCredit: number;
  status: string;
  ledgerEntries: VoucherLedgerEntry[];
}

/** receivedQuantity is always present (starts at 0). cancelledQuantity
 *  tracks how much of this line has been permanently written off via
 *  short-close/cancel — used to derive the remaining outstanding balance
 *  (quantity - receivedQuantity - cancelledQuantity). */
export interface PurchaseOrderItem {
  id: string;
  variantId: string;
  productName: string;
  variantName: string;
  sku: string;
  quantity: number;
  unitCost: number;
  mrpPrice: number | null;
  total: number;
  newAvgCost: number;
  sellPrice: number;
  expiryDate: string | null;
  receivedQuantity: number;
  cancelledQuantity: number;
  /** Populated in detail view only. */
  variant?: { id: string; sku: string; avgCost: number };
}

/** Item within a PurchaseReceive, carrying the actual bin location and any
 *  damaged split. */
export interface PurchaseReceiveItemRef {
  id: string;
  quantity: number;
  warehouseId: string;
  rackId: string | null;
  rowNumber: number | null;
  shelfNumber: number | null;
  warehouse?: { id: string; name: string; code: string };
  rack?: { id: string; code: string; label?: string };
  purchaseOrderItem?: { id: string; sku: string; productName: string };
}

/** A single receive batch against a PO. */
export interface PurchaseReceive {
  id: string;
  receiveNo: string;
  receivedAt: string;
  receivedBy?: string;
  notes?: string;
  items: PurchaseReceiveItemRef[];
}

export interface PurchasePaymentRecord {
  id: string;
  amount: number;
  method: string;
  reference: string | null;
  paidAt: string;
}

/** A single line within a PurchaseReturn (Group C1). unitCost is frozen at
 *  the ORIGINAL PO per-unit cost, not the variant's current avgCost. */
export interface PurchaseReturnItem {
  id: string;
  purchaseOrderItemId: string;
  quantity: number;
  unitCost: number;
  warehouseId: string;
  rackId: string | null;
}

/** A batch of returned items sent back to the supplier against a PO. */
export interface PurchaseReturn {
  id: string;
  purchaseOrderId: string;
  returnNo: string;
  reason: string;
  returnedBy?: string;
  createdAt: string;
  items: PurchaseReturnItem[];
}

/** A cash-out (partial or full) of PurchaseOrder.creditBalance (Group D1). */
export interface PurchaseRefund {
  id: string;
  purchaseOrderId: string;
  amount: number;
  method: string;
  vendorPaymentAccountId: string;
  reference: string | null;
  createdAt: string;
}

/** `warehouseId` may be null — a PO can be created without a default
 *  warehouse (bins are assigned per-line at receive time). creditBalance /
 *  cancelledAt / cancelledBy / cancelReason / shortClosedAt / shortClosedBy /
 *  shortCloseReason are new lifecycle fields (Groups A/B/D). */
export interface PurchaseOrder {
  id: string;
  purchaseNo: string;
  supplierId: string;
  warehouseId: string | null;
  supplierInvoiceNo: string | null;
  purchaseDate: string;
  
  receivingStatus: ReceivingStatus;
  paymentStatus: PaymentStatus;
  subtotal: number;
  vatAmount: number;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  creditBalance: number;
  notes: string | null;
  cancelledAt: string | null;
  cancelledBy: string | null;
  cancelReason: string | null;
  shortClosedAt: string | null;
  shortClosedBy: string | null;
  shortCloseReason: string | null;
  supplier: { id: string; name: string; phone?: string; email?: string };
  warehouse: { id: string; name: string } | null;
  items: PurchaseOrderItem[];
  payments: PurchasePaymentRecord[];
  createdAt: string;
  updatedAt: string;
}

/** Adds `receives`, `returns`, `refunds` history and full voucher detail. */
export interface PurchaseOrderDetail extends PurchaseOrder {
  vouchers: VoucherDetail[];
  receives: PurchaseReceive[];
  returns: PurchaseReturn[];
  refunds: PurchaseRefund[];
}

export interface CreatePurchaseOrderResponse {
  id: string;
  purchaseNo: string;
  receivingStatus: ReceivingStatus;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  vouchers: VoucherSummary[];
}

/** Response from POST /:id/receive. */
export interface ReceivePurchaseOrderResponse extends PurchaseReceive {
  receivingStatus: ReceivingStatus;
}

export interface PayDueResponse {
  purchaseOrderId: string;
  purchaseNo: string;
  amountPaid: number;
  newDue: number;
  newPaymentStatus: PaymentStatus;
  voucherNumber: string;
}

/** Response from POST /:id/short-close and POST /:id/cancel — the updated
 *  PurchaseOrder plus the reversal voucher (or null if the voucher call
 *  itself is what failed — see service error message in that case). */
export interface ShortCloseOrCancelResponse extends PurchaseOrder {
  voucher: VoucherDetail | null;
}

/** Response from POST /:id/returns. */
export interface ReturnPurchaseOrderResponse extends PurchaseReturn {
  purchaseOrder: PurchaseOrder;
  voucher: VoucherDetail | null;
}

/** Response from POST /:id/refund-credit. */
export interface RefundPurchaseOrderCreditResponse extends PurchaseRefund {
  purchaseOrder: PurchaseOrder;
  voucher: VoucherDetail | null;
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
    getNextPurchaseNumber: builder.query<ApiResponse<NextNumberResponse>, void>(
      {
        query: () => "/purchase-orders/next-number",
      },
    ),

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
    getPurchaseOrderById: builder.query<
      ApiResponse<PurchaseOrderDetail>,
      string
    >({
      query: (id) => `/purchase-orders/${id}`,
      providesTags: (_result, _error, id) => [
        { type: "PurchaseOrderDetail", id },
      ],
    }),

    /* ─── POST /api/purchase-orders/:id/receive ──────────────────────────── */
    receivePurchaseOrder: builder.mutation<
      ApiResponse<ReceivePurchaseOrderResponse>,
      { id: string; data: ReceivePurchaseOrderRequest }
    >({
      query: ({ id, data }) => ({
        url: `/purchase-orders/${id}/receive`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "PurchaseOrderDetail", id },
        "PurchaseOrder",
      ],
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

    /* ─── POST /api/purchase-orders/:id/short-close ──────────────────────── */
    /** Group A1/A2 — permanently writes off the requested remaining
     *  (un-received) quantity on each item. */
    shortClosePurchaseOrder: builder.mutation<
      ApiResponse<ShortCloseOrCancelResponse>,
      { id: string; data: ShortClosePurchaseOrderRequest }
    >({
      query: ({ id, data }) => ({
        url: `/purchase-orders/${id}/short-close`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "PurchaseOrderDetail", id },
        "PurchaseOrder",
      ],
    }),

    /* ─── POST /api/purchase-orders/:id/cancel ───────────────────────────── */
    /** Group B1/B2 — cancels everything still outstanding on the PO. Not
     *  allowed once the PO is FULLY_RECEIVED (use returns instead). */
    cancelPurchaseOrder: builder.mutation<
      ApiResponse<ShortCloseOrCancelResponse>,
      { id: string; data: CancelPurchaseOrderRequest }
    >({
      query: ({ id, data }) => ({
        url: `/purchase-orders/${id}/cancel`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "PurchaseOrderDetail", id },
        "PurchaseOrder",
      ],
    }),

    /* ─── POST /api/purchase-orders/:id/returns ──────────────────────────── */
    /** Group C1 — sends already-received stock back to the supplier. */
    returnPurchaseOrderItems: builder.mutation<
      ApiResponse<ReturnPurchaseOrderResponse>,
      { id: string; data: ReturnPurchaseOrderRequest }
    >({
      query: ({ id, data }) => ({
        url: `/purchase-orders/${id}/returns`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "PurchaseOrderDetail", id },
        "PurchaseOrder",
      ],
    }),

    /* ─── POST /api/purchase-orders/:id/refund-credit ────────────────────── */
    /** Group D1 — cashes out (partially or fully) PurchaseOrder.creditBalance
     *  created by an overpayment discovered during short-close/cancel/return. */
    refundPurchaseOrderCredit: builder.mutation<
      ApiResponse<RefundPurchaseOrderCreditResponse>,
      { id: string; data: RefundPurchaseOrderCreditRequest }
    >({
      query: ({ id, data }) => ({
        url: `/purchase-orders/${id}/refund-credit`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "PurchaseOrderDetail", id },
        "PurchaseOrder",
      ],
    }),

    /* ─── GET /api/purchase-orders/stock-intake-template ─────────────────── */
    downloadStockIntakeTemplate: builder.mutation<Blob, void>({
      query: () => ({
        url: "/purchase-orders/stock-intake-template",
      method: "GET",
        responseHandler: (response: Response) => response.blob(),
      }),
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
  useReceivePurchaseOrderMutation,
  usePayPurchaseDueMutation,
  useShortClosePurchaseOrderMutation,
  useCancelPurchaseOrderMutation,
  useReturnPurchaseOrderItemsMutation,
  useRefundPurchaseOrderCreditMutation,
  useDownloadStockIntakeTemplateMutation,
} = purchaseOrderApi;