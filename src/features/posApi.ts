import { createApi } from "@reduxjs/toolkit/query/react";
import baseQueryWithReauth from "./baseQueryWithReauth";

// Every POS call uses the signed-in FinixMart session (vendor owner or one of
// the vendor's employees). There is no separate terminal login/token; the
// server derives the vendor and the acting person from the session and
// re-checks the employee's POS permissions on every request.

/* ==================== SHARED TYPES ==================== */

export type PosPaymentMethod = "CASH" | "CARD" | "BKASH" | "NAGAD" | "ROCKET" | "BANK_TRANSFER" | "OTHER";
export type DiscountValueType = "PERCENT" | "FLAT";
export type PosSaleStatus = "PAID" | "PENDING" | "REFUNDED" | "VOIDED";

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
}

/* ==================== BARCODE LOOKUP TYPES ==================== */

export interface PosVariantLookup {
  variantId: string;
  productId: string;
  name: string;
  sku: string;
  barcode: string | null;
  price: number;
  taxRate: number;
  image: string | null;
  availableQty: number;
  availability: boolean;
}

/* ==================== TERMINAL PRODUCT GRID ==================== */

export interface PosStockLocation {
  warehouseId: string;
  warehouseName: string;
  isDefault: boolean;
  rackId: string | null;
  rackCode: string | null;
  available: number;
}

/** GET /pos/products — the vendor's own sellable variants with POS-sellable stock. */
export interface PosProduct {
  variantId: string;
  productId: string;
  name: string;
  category: string;
  sku: string;
  barcode: string | null;
  /** Display only — the server re-prices every sale. */
  price: number;
  taxRate: number;
  image: string | null;
  locations: PosStockLocation[];
  totalAvailable: number;
}

/* ==================== SALE TYPES ==================== */

/**
 * A sale line. Catalog lines send only variant + location + qty: the server
 * prices, costs and taxes them itself. (name/price are for custom lines only.)
 */
export interface PosSaleItemInput {
  variantId?: string | null;
  qty: number;
  warehouseId?: string | null;
  rackId?: string | null;
  name?: string;
  price?: number;
  taxRate?: number;
  icon?: string | null;
}

/** The vendor and the cashier come from the session — never sent. */
export interface CreateSaleRequest {
  /** One id per checkout attempt; a retried submit returns the same sale. */
  clientRequestId: string;
  customerId?: string | null;
  customerName?: string;
  bankAccountId?: string | null;
  items: PosSaleItemInput[];
  discountAmount?: number;
  discountPct?: number;
  discountType?: DiscountValueType;
  /** Cash tendered; anything above the bill comes back as `change`. */
  paidAmount: number;
  paymentMethod: PosPaymentMethod;
  note?: string;
}

export interface PosSaleItem {
  id: string;
  saleId: string;
  variantId: string | null;
  name: string;
  icon: string | null;
  qty: number;
  price: number;
  cost: number;
  taxRate: number;
  warehouseId: string | null;
  rackId: string | null;
}

export interface PosSale {
  id: string;
  vendorId: string;
  invoiceNo: string;
  voucherNo: string;
  staffId: string | null;
  customerId: string | null;
  bankAccountId: string | null;
  isWalkIn: boolean;
  subtotal: number;
  discountAmount: number;
  discountPct: number;
  discountType: DiscountValueType;
  taxAmount: number;
  netBilling: number;
  paidAmount: number;
  dueAmount: number;
  extraAmount: number;
  dueCutAmount: number;
  walletAddAmount: number;
  cogs: number;
  paymentMethod: PosPaymentMethod;
  note: string | null;
  status: PosSaleStatus;
  saleDate: string;
  createdAt: string;
  accountingVoucherId: string | null;
  items: PosSaleItem[];
  customer?: PosCustomer | null;
  staff?: { id: string; displayName: string } | null;
}

export interface CreateSaleResponse {
  sale: PosSale;
  /** Tendered above the bill, returned to the customer (not revenue). */
  change: number;
  /** true when this clientRequestId had already created the sale. */
  duplicate: boolean;
}

export interface RefundSaleRequest {
  items?: Array<{ saleItemId: string; qty: number }>;
  reason?: string;
  paymentMethod?: PosPaymentMethod;
  refundDate?: string;
  /** One id per refund attempt (8–64 of A-Z a-z 0-9 -): a repeat returns the first refund. */
  clientRequestId?: string;
}

export interface RefundSaleResponse {
  voucher: unknown;
  refundNet: number;
  /** Money paid back (only what was collected on the sale). */
  cashRefund: number;
  /** Unpaid due cancelled instead of being paid back. */
  dueReduced: number;
  isFullRefund: boolean;
}

/** One audited change of a customer's credit terms (GET /pos/customers/:id). */
export interface PosCreditTermsChange {
  id: string;
  createdAt: string;
  userId: string | null;
  oldData: { loanLimit?: number; loanInterestRate?: number; loanTenureDays?: number } | null;
  newData: { loanLimit?: number; loanInterestRate?: number; loanTenureDays?: number; changed?: string[]; byEmployeeId?: string | null };
}

export interface VoidSaleRequest {
  reason: string;
}

export interface PayDueRequest {
  payingAmount: number;
  paymentMethod: PosPaymentMethod;
  note?: string;
  paymentDate?: string;
  /** One id per collection attempt: a repeat returns the first collection. */
  clientRequestId?: string;
}

export interface PayDueResponse {
  voucher: unknown;
  sale: PosSale;
}

export interface SaleListParams {
  status?: PosSaleStatus;
  customerId?: string;
  staffId?: string;
  startDate?: string;
  endDate?: string;
  q?: string;
  page?: number;
  limit?: number;
}

export interface DashboardSummary {
  today: {
    salesCount: number;
    netBilling: number;
    collected: number;
    due: number;
  };
  totalCustomerDue: number;
  subscription: PosSubscriptionStatus;
}

/* ==================== CUSTOMER TYPES ==================== */

export interface PosCustomer {
  id: string;
  vendorId: string;
  name: string;
  phone: string;
  email: string | null;
  nid: string | null;
  address: string | null;
  note: string | null;
  loanLimit: number;
  loanBalance: number;
  loanInterestRate: number;
  loanTenureDays: number;
  creditScore: string;
  walletBalance: number;
  due: number;
  orders: number;
  spent: number;
  lastOrderAt: string | null;
  createdAt: string;
}

export interface CreateCustomerRequest {
  name: string;
  phone: string;
  email?: string;
  nid?: string;
  address?: string;
  note?: string;
  loanLimit?: number;
}

export type UpdateCustomerRequest = Partial<CreateCustomerRequest> & {
  loanInterestRate?: number;
  loanTenureDays?: number;
};

/* ==================== STAFF TYPES ==================== */

export interface LinkedEmployee {
  id: string;
  designation: string | null;
  department: string | null;
}

export interface PosLegacyStaff {
  id: string;
  username: string;
  displayName: string;
  isAdmin: boolean;
  isActive: boolean;
  createdAt: string;
  employeeId: string | null;
  employee?: { designation: string | null; department: string | null } | null;
  _count?: { sales: number };
}

/** View model the POS components render the current operator with (built from /pos/me). */
export interface PosStaff {
  id: string;
  username: string;
  displayName: string;
  isAdmin: boolean;
  isActive: boolean;
  avatarColor: string;
  permissions: Record<string, boolean>;
  createdAt: string;
  employeeId: string | null;
  employee?: LinkedEmployee | null;
}

/** The signed-in person as the POS sees them (GET /pos/me). UI only — the server re-checks. */
export interface PosMe {
  vendorId: string;
  userId: string;
  employeeId: string | null;
  isOwner: boolean;
  displayName: string | null;
  grants: { posDiscount: boolean; posCredit: boolean; posRefund: boolean; posReports: boolean };
}

/* ==================== BANK ACCOUNT TYPES ==================== */

export interface PosBankAccount {
  id: string;
  vendorId: string;
  bankName: string;
  accountName: string;
  accountNo: string;
  routing: string | null;
  branch: string | null;
  createdAt: string;
}

export interface CreateBankAccountRequest {
  bankName: string;
  accountName: string;
  accountNo: string;
  routing?: string;
  branch?: string;
}

/* ==================== SETTINGS / SUBSCRIPTION TYPES ==================== */

export interface PosSettings {
  id: string;
  vendorId: string;
  invoicePrefix: string;
  voucherPrefix: string;
  currencySymbol: string;
  receiptFooterText: string | null;
  storeOnline: boolean;
}

export type UpdateSettingsRequest = Partial<{
  invoicePrefix: string;
  voucherPrefix: string;
  currencySymbol: string;
  receiptFooterText: string;
  storeOnline: boolean;
}>;

export type EntitlementState = "NONE" | "INVALID" | "SUSPENDED" | "CANCELLED" | "ACTIVE" | "GRACE" | "EXPIRED";

/** Server-evaluated access (see backend modules/pos-subscription/entitlement.ts). */
export interface PosEntitlement {
  state: EntitlementState;
  /** Sales, refunds, voids, due collection and every other POS mutation. */
  canOperate: boolean;
  expiresAt: string | null;
  graceEndsAt: string | null;
  daysLeft: number | null;
}

export interface PosPlan {
  id: string;
  code: string;
  name: string;
  description: string | null;
  price: string;
  currency: string;
  durationDays: number;
  isActive: boolean;
  sortOrder: number;
}

export interface PosSubscription {
  status: "ACTIVE" | "EXPIRED" | "CANCELLED" | "SUSPENDED";
  source: "TRIAL" | "PAID" | "COMPLIMENTARY" | "LEGACY";
  startedAt: string;
  expiresAt: string | null;
  lastPaymentAt: string | null;
  suspended: boolean;
  plan: Pick<PosPlan, "id" | "code" | "name" | "price" | "currency" | "durationDays"> | null;
}

export interface PosSubscriptionStatus {
  entitlement: PosEntitlement;
  enforcement: "enforce" | "monitor";
  subscription: PosSubscription | null;
  graceDays: number;
}

export interface PosSubscriptionPayment {
  id: string;
  tranId: string;
  amount: string;
  currency: string;
  durationDays: number;
  status: "PENDING" | "PAID" | "FAILED" | "CANCELLED" | "REFUNDED";
  gateway: string;
  createdAt: string;
  appliedAt: string | null;
  plan: { name: string } | null;
}

export interface PosCheckoutResponse {
  tranId: string;
  redirectUrl: string;
  amount: string;
  currency: string;
  plan: { id: string; name: string; durationDays: number };
}

/* ==================== API ==================== */

export const posApi = createApi({
  reducerPath: "posApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["PosSale", "PosCustomer", "PosStaff", "PosBankAccount", "PosSettings", "PosDashboard", "PosSubscription"],

  endpoints: (builder) => ({
    /* ─── SALES ─────────────────────────────────────────────────────────── */

    createSale: builder.mutation<ApiResponse<CreateSaleResponse>, CreateSaleRequest>({
      query: (body) => ({ url: "/pos/sales", method: "POST", body }),
      invalidatesTags: ["PosSale", "PosDashboard", "PosCustomer"],
    }),

    getSales: builder.query<PaginatedResponse<PosSale>, SaleListParams>({
      query: (params) => ({ url: "/pos/sales", params }),
      providesTags: ["PosSale"],
    }),

    getSale: builder.query<ApiResponse<PosSale>, string>({
      query: (id) => `/pos/sales/${id}`,
      providesTags: (_r, _e, id) => [{ type: "PosSale", id }],
    }),

    refundSale: builder.mutation<ApiResponse<RefundSaleResponse>, { id: string } & RefundSaleRequest>({
      query: ({ id, ...body }) => ({ url: `/pos/sales/${id}/refund`, method: "POST", body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "PosSale", id }, "PosSale", "PosDashboard", "PosCustomer"],
    }),

    voidSale: builder.mutation<ApiResponse<RefundSaleResponse>, { id: string } & VoidSaleRequest>({
      query: ({ id, ...body }) => ({ url: `/pos/sales/${id}/void`, method: "POST", body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "PosSale", id }, "PosSale", "PosDashboard"],
    }),

    payDue: builder.mutation<ApiResponse<PayDueResponse>, { id: string } & PayDueRequest>({
      query: ({ id, ...body }) => ({ url: `/pos/sales/${id}/pay-due`, method: "POST", body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "PosSale", id }, "PosSale", "PosCustomer", "PosDashboard"],
    }),

    getDashboard: builder.query<ApiResponse<DashboardSummary>, void>({
      query: () => "/pos/dashboard",
      providesTags: ["PosDashboard"],
    }),

    /* ─── BARCODE / SKU SCAN LOOKUP ──────────────────────────────────────── */

    getPosProducts: builder.query<ApiResponse<PosProduct[]>, { q?: string } | void>({
      query: (params) => ({ url: "/pos/products", params: params ?? {} }),
      providesTags: ["PosSale"],
    }),

    lookupVariantByCode: builder.query<ApiResponse<PosVariantLookup>, string>({
      query: (code) => `/pos/variant/lookup/${encodeURIComponent(code)}`,
    }),

    /* ─── CUSTOMERS ──────────────────────────────────────────────────────── */

    getCustomers: builder.query<ApiResponse<PosCustomer[]>, { q?: string } | void>({
      query: (params) => ({ url: "/pos/customers", params: params ?? {} }),
      providesTags: ["PosCustomer"],
    }),

    getCustomer: builder.query<ApiResponse<PosCustomer & { sales: PosSale[]; creditHistory: PosCreditTermsChange[] }>, string>({
      query: (id) => `/pos/customers/${id}`,
      providesTags: (_r, _e, id) => [{ type: "PosCustomer", id }],
    }),

    createCustomer: builder.mutation<ApiResponse<PosCustomer>, CreateCustomerRequest>({
      query: (body) => ({ url: "/pos/customers", method: "POST", body }),
      invalidatesTags: ["PosCustomer"],
    }),

    updateCustomer: builder.mutation<ApiResponse<PosCustomer>, { id: string } & UpdateCustomerRequest>({
      query: ({ id, ...body }) => ({ url: `/pos/customers/${id}`, method: "PUT", body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "PosCustomer", id }, "PosCustomer"],
    }),

    /* ─── STAFF ──────────────────────────────────────────────────────────── */

    // Legacy terminal-login records (read-only, owner only) — kept for historical sale attribution.
    getStaff: builder.query<ApiResponse<PosLegacyStaff[]>, void>({
      query: () => "/pos/staff",
      providesTags: ["PosStaff"],
    }),

    getPosMe: builder.query<ApiResponse<PosMe>, void>({
      query: () => "/pos/me",
    }),

    /* ─── BANK ACCOUNTS ──────────────────────────────────────────────────── */

    getBankAccounts: builder.query<ApiResponse<PosBankAccount[]>, void>({
      query: () => "/pos/bank-accounts",
      providesTags: ["PosBankAccount"],
    }),

    createBankAccount: builder.mutation<ApiResponse<PosBankAccount>, CreateBankAccountRequest>({
      query: (body) => ({ url: "/pos/bank-accounts", method: "POST", body }),
      invalidatesTags: ["PosBankAccount"],
    }),

    /* ─── SETTINGS & SUBSCRIPTION ───────────────────────────────────────── */

    getSettings: builder.query<ApiResponse<PosSettings>, void>({
      query: () => "/pos/settings",
      providesTags: ["PosSettings"],
    }),

    updateSettings: builder.mutation<ApiResponse<PosSettings>, UpdateSettingsRequest>({
      query: (body) => ({ url: "/pos/settings", method: "PUT", body }),
      invalidatesTags: ["PosSettings"],
    }),

    getSubscription: builder.query<ApiResponse<PosSubscriptionStatus>, void>({
      query: () => "/pos/subscription",
      providesTags: ["PosSubscription"],
    }),

    getPosPlans: builder.query<ApiResponse<PosPlan[]>, void>({
      query: () => "/pos/subscription/plans",
    }),

    getPosPayments: builder.query<ApiResponse<PosSubscriptionPayment[]>, void>({
      query: () => "/pos/subscription/payments",
      providesTags: ["PosSubscription"],
    }),

    startPosCheckout: builder.mutation<ApiResponse<PosCheckoutResponse>, { planId: string }>({
      query: (body) => ({ url: "/pos/subscription/checkout", method: "POST", body }),
      invalidatesTags: ["PosSubscription"],
    }),
  }),
});

/* ==================== EXPORT HOOKS ==================== */

export const {
  // Sales
  useCreateSaleMutation,
  useGetSalesQuery,
  useLazyGetSalesQuery,
  useGetSaleQuery,
  useLazyGetSaleQuery,
  useRefundSaleMutation,
  useVoidSaleMutation,
  usePayDueMutation,
  useGetDashboardQuery,
  useLazyGetDashboardQuery,

  // Barcode / SKU scan lookup
  useGetPosProductsQuery,
  useLookupVariantByCodeQuery,
  useLazyLookupVariantByCodeQuery,

  // Customers
  useGetCustomersQuery,
  useLazyGetCustomersQuery,
  useGetCustomerQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,

  // Staff
  useGetStaffQuery,
  useGetPosMeQuery,

  // Bank accounts
  useGetBankAccountsQuery,
  useCreateBankAccountMutation,

  // Settings & subscription
  useGetSettingsQuery,
  useUpdateSettingsMutation,
  useGetSubscriptionQuery,
  useGetPosPlansQuery,
  useGetPosPaymentsQuery,
  useStartPosCheckoutMutation,
} = posApi;