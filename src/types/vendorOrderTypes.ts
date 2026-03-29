// ─── Re-exported from shared types (no duplication) ─────────────────────────
export type {
  OrderStatus,
  PaymentStatus,
  FulfillmentStatus,
  CourierOrderStatus,
  OrderAddress,
  OrderItem,
  OrderItemVariant,
  CourierOrderSummary,
} from "@/types/orderpage";

// ─── Vendor-scoped order (the VendorOrder row + parent Order context) ────────

export interface VendorOrderCustomer {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
}

export interface VendorOrderParent {
  id: string;
  orderNumber?: string;
  totalAmount: number;
  paymentStatus: import("@/types/orderpage").PaymentStatus;
  createdAt: string;
  confirmedAt: string;
  paidAt?: string;
  user?: VendorOrderCustomer;
  address?: import("@/types/orderpage").OrderAddress;
}

export interface VendorOrderRow {
  id: string;
  orderId: string;
  vendorId: string;
  subtotal: number;
  shippingCost: number;
  status: import("@/types/orderpage").OrderStatus;
  fulfillmentStatus: import("@/types/orderpage").FulfillmentStatus;
  createdAt: string;
  shippedAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  items: import("@/types/orderpage").OrderItem[];
  courierOrder?: import("@/types/orderpage").CourierOrderSummary;
  order: VendorOrderParent; // parent order context joined from API
}

// ─── Status transitions allowed for vendor ──────────────────────────────────
// Vendor can only move forward in their own fulfillment pipeline.
// Admin handles cancellations, refunds, overrides.
export type VendorUpdatableStatus =
  | "PROCESSING"
  | "PACKAGING"
  | "SHIPPED";

// ─── Filter types ─────────────────────────────────────────────────────────────

export interface VendorOrderFilters {
  page: number;
  limit: number;
  search: string;                                            // order# or customer name/phone
  status: import("@/types/orderpage").OrderStatus | "";
  fulfillmentStatus: import("@/types/orderpage").FulfillmentStatus | "";
  dateFrom: string;
  dateTo: string;
  sortBy: "createdAt" | "subtotal";
  sortOrder: "asc" | "desc";
}

export interface VendorOrdersPagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface VendorOrdersResponse {
  success: boolean;
  data: VendorOrderRow[];
  pagination: VendorOrdersPagination;
}

export interface VendorOrderStatsResponse {
  success: boolean;
  data: {
    totalOrders: number;
    totalRevenue: number;
    pendingOrders: number;         // CONFIRMED, not yet processing
    processingOrders: number;
    shippedOrders: number;
    deliveredOrders: number;
    cancelledOrders: number;
    todayOrders: number;
    avgOrderValue: number;
  };
}

export interface VendorSingleOrderResponse {
  success: boolean;
  data: VendorOrderRow;
}