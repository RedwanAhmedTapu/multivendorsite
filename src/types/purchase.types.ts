// ============================================================
// Purchase Form Types
// ============================================================

/* ==================== REQUEST TYPES ==================== */

export type ReceivingStatus =
  | "DRAFT"
  | "CONFIRMED"
  | "PARTIALLY_RECEIVED"
  | "FULLY_RECEIVED"
  | "CANCELLED";

export type PaymentStatus = "UNPAID" | "PARTIALLY_PAID" | "PAID";

export type EntityType = "ADMIN" | "VENDOR";

export interface PurchaseItemInput {
  variantId: string;
  productName: string;
  variantName: string;
  sku: string;
  quantity: number;
  unitCost: number;

  /**
   * 0-100.
   * Applied to unitCost before inventory/COGS + avgCost calculations.
   * Not persisted as its own column.
   */
  discountPercent?: number;

  sellPrice: number;
  expiryDate?: string | null;
}

export interface CreatePurchaseOrderRequest {
  purchaseDate: string;
  supplierId: string;
  warehouseId: string;
  supplierInvoiceNo?: string;
  vatRate?: number;
  vatCoaAccountId?: string;
  paidAmount?: number;
  paymentMethod?: string;
  vendorPaymentAccountId?: string;
  paymentReference?: string;
  notes?: string;
  items: PurchaseItemInput[];
  entityType: EntityType;
  entityId?: string;
}

export interface ReceivePurchaseOrderItemInput {
  purchaseOrderItemId: string;
  quantity: number;
  warehouseId: string;
  rackId?: string | null;
  rowNumber?: number | null;
  shelfNumber?: number | null;
}

export interface ReceivePurchaseOrderRequest {
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

/* ==================== GENERIC RESPONSE TYPES ==================== */

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

/* ==================== VOUCHER TYPES ==================== */

export interface VoucherSummary {
  id: string;
  voucherNumber: string;
  voucherType: string;
}

export interface VoucherLedgerEntry {
  id: string;
  accountId: string;
  account?: {
    id: string;
    code: string;
    name: string;
  };
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

/* ==================== PURCHASE ITEM TYPES ==================== */

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
  receivedQuantity: number;

  /**
   * Populated in detail view only.
   */
  variant?: {
    id: string;
    sku: string;
    avgCost: number;
  };
}

/* ==================== PURCHASE RECEIVE TYPES ==================== */

export interface PurchaseReceiveItemRef {
  id: string;
  quantity: number;
  warehouseId: string;
  rackId: string | null;
  rowNumber: number | null;
  shelfNumber: number | null;

  warehouse?: {
    id: string;
    name: string;
    code: string;
  };

  rack?: {
    id: string;
    code: string;
    label?: string;
  };

  purchaseOrderItem?: {
    id: string;
    sku: string;
    productName: string;
  };
}

export interface PurchaseReceive {
  id: string;
  receiveNo: string;
  receivedAt: string;
  receivedBy?: string;
  notes?: string;
  items: PurchaseReceiveItemRef[];
}

/* ==================== PAYMENT TYPES ==================== */

export interface PurchasePaymentRecord {
  id: string;
  amount: number;
  method: string;
  reference: string | null;
  paidAt: string;
}

/* ==================== PURCHASE ORDER TYPES ==================== */

export interface PurchaseOrder {
  id: string;
  purchaseNo: string;
  supplierId: string;
  warehouseId: string;
  supplierInvoiceNo: string | null;
  purchaseDate: string;

  receivingStatus: ReceivingStatus;
  paymentStatus: PaymentStatus;

  subtotal: number;
  vatAmount: number;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;

  notes: string | null;

  supplier: {
    id: string;
    name: string;
    phone?: string;
    email?: string;
  };

  warehouse: {
    id: string;
    name: string;
  };

  items: PurchaseOrderItem[];
  payments: PurchasePaymentRecord[];

  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrderDetail extends PurchaseOrder {
  vouchers: VoucherDetail[];
  receives: PurchaseReceive[];
}

/* ==================== MUTATION RESPONSE TYPES ==================== */

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

export interface ReceivePurchaseOrderResponse
  extends PurchaseReceive {
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

export interface NextNumberResponse {
  purchaseNo: string;
}
export interface COAAccount {
  id: string;
  name: string;
  type: string;
  subtype: string;
}

export interface SelectOption {
  value: string;
  label: string;
  sub?: string;
  group?: string;
}
export interface Warehouse {
  id: string;
  name: string;
}
