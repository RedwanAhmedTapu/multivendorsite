// ─── Enums matching Prisma schema ───────────────────────────────────────────

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

// ─── Core order types ───────────────────────────────────────────────────────

export interface OrderAddress {
  id: string;
  orderId: string;
  country: string;
  state: string;
  zone?: string;
  city: string;
  address: string;
  landmark?: string;
  receiverFullName: string;
  phone: string;
}

export interface OrderItemVariant {
  id: string;
  sku: string;
  price: number;
  product: {
    id: string;
    name: string;
    images?: { url: string }[];
  };
}

export interface OrderItem {
  id: string;
  vendorOrderId: string;
  variantId: string;
  quantity: number;
  price: number;
  variant: OrderItemVariant;
}

export interface VendorInfo {
  id: string;
  storeName: string;
  avatar?: string;
}

export interface CourierOrderSummary {
  id: string;
  courierTrackingId?: string;
  status: CourierOrderStatus;
  courierStatus?: string;
  lastStatusUpdate: string;
  courier_providers?: {
    name: string;
    displayName?: string;
    logo?: string;
  };
}

export interface VendorOrder {
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
  vendor: VendorInfo;
  items: OrderItem[];
  courierOrder?: CourierOrderSummary;
}

export interface CustomerInfo {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
}

export interface Order {
  id: string;
  orderNumber?: string;
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
  updatedAt: string;
  confirmedAt: string;
  paidAt?: string;
  cancelledAt?: string;
  conversionSource?: string;
  deviceType?: string;
  user?: CustomerInfo;
  address?: OrderAddress;
  vendorOrders: VendorOrder[];
  payments?: {
    id: string;
    method: string;
    amount: number;
    status: PaymentStatus;
    paidAt?: string;
  }[];
}

// ─── Filter / Query types ────────────────────────────────────────────────────

export interface OrderFilters {
  page: number;
  limit: number;
  search: string;
  status: OrderStatus | "";
  paymentStatus: PaymentStatus | "";
  fulfillmentStatus: FulfillmentStatus | "";
  vendorId: string;
  dateFrom: string;
  dateTo: string;
  sortBy: "createdAt" | "totalAmount" | "orderNumber";
  sortOrder: "asc" | "desc";
}

export interface OrdersPagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface OrdersResponse {
  success: boolean;
  data: Order[];
  pagination: OrdersPagination;
  stats?: {
    totalOrders: number;
    totalRevenue: number;
    pendingOrders: number;
    todayOrders: number;
    paidOrders: number;
    cancelledOrders: number;
  };
}

export interface SingleOrderResponse {
  success: boolean;
  data: Order;
}