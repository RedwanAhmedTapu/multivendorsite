// features/accountingApi.ts
import { createApi } from "@reduxjs/toolkit/query/react";
import baseQueryWithReauth from "./baseQueryWithReauth";

// ============================================
// REQUEST TYPES
// ============================================

export interface CreateChartOfAccountRequest {
  name: string;
  accountClass: string;
  accountType: string;
  group?: string;
  nature: string;
  entityType: string;
  entityId?: string;
  isSystem?: boolean;
}

export interface UpdateChartOfAccountRequest {
  name?: string;
  group?: string;
  isActive?: boolean;
}

export interface VoucherEntryRequest {
  accountId: string;
  debitAmount?: string | number;
  creditAmount?: string | number;
  description?: string;
  referenceType?: string;
  referenceId?: string;
  costCenter?: string;
  department?: string;
}

export interface CreateVoucherRequest {
  voucherType: string;
  entityType: string;
  entityId?: string;
  voucherDate?: string;
  narration: string;
  entries: VoucherEntryRequest[];
  referenceType?: string;
  referenceId?: string;
  internalNotes?: string;
  attachments?: any[];
}

export interface ReverseVoucherRequest {
  reason: string;
}

export interface AutoVoucherOrderConfirmedRequest {
  orderId: number;
  vendorId: string;
  customerId: string;
  amount: string | number;
  commissionRate: string | number;
  commissionAmount: string | number;
  netAmount: string | number;
}

export interface AutoVoucherPaymentReceivedRequest {
  sslTransaction: any;
  orderId: number;
  vendorId: string;
  amount: string | number;
  gatewayFee: string | number;
  vatAmount: string | number;
  netAmount: string | number;
}

export interface AutoVoucherSettlementRequest {
  settlementBatch: any;
  transactions: any[];
}

export interface AutoVoucherVendorPayoutRequest {
  vendorId: string;
  amount: string | number;
  bankDetails: any;
  reference: string;
}

export interface AutoVoucherRefundRequest {
  refundRecord: any;
  orderId: number;
  vendorId: string;
  refundAmount: string | number;
  commissionReversed: string | number;
}

export interface CreateAccountingPeriodRequest {
  periodName: string;
  periodType: string;
  startDate: string;
  endDate: string;
  entityType: string;
  entityId?: string;
}

// ============================================
// RESPONSE TYPES
// ============================================

export interface ChartOfAccount {
  id: string;
  code: string;
  name: string;
  accountClass: string;
  accountType: string;
  group?: string;
  nature: string;
  entityType: string;
  entityId?: string;
  isSystem: boolean;
  isActive: boolean;
  canDelete: boolean;
  createdAt: string;
  updatedAt: string;
  ledgerEntries?: LedgerEntry[];
}

export interface LedgerEntry {
  id: string;
  voucherId: string;
  accountId: string;
  debitAmount: string;
  creditAmount: string;
  entityType: string;
  entityId?: string;
  description?: string;
  referenceType?: string;
  referenceId?: string;
  costCenter?: string;
  department?: string;
  entryDate: string;
  createdAt: string;
  account?: ChartOfAccount;
  voucher?: Voucher;
  runningBalance?: string;
}

export interface Voucher {
  id: string;
  voucherNumber: string;
  voucherType: string;
  entityType: string;
  entityId?: string;
  voucherDate: string;
  narration: string;
  internalNotes?: string;
  attachments?: any[];
  totalDebit: string;
  totalCredit: string;
  status: string;
  isAuto: boolean;
  isLocked: boolean;
  isReversed: boolean;
  eventType?: string;
  referenceType?: string;
  referenceId?: string;
  reversedById?: string;
  reversalOfId?: string;
  postingDate?: string;
  postedBy?: string;
  lockedBy?: string;
  lockedAt?: string;
  createdBy: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
  ledgerEntries?: LedgerEntry[];
}

export interface TrialBalanceItem {
  accountCode: string;
  accountName: string;
  accountType: string;
  groupName?: string;
  totalDebit: string;
  totalCredit: string;
  balance: string;
  nature: string;
}

export interface TrialBalance {
  trialBalance: TrialBalanceItem[];
  totals: {
    totalDebit: string;
    totalCredit: string;
    difference: string;
  };
  asOf: string;
}

export interface ProfitAndLossItem {
  accountCode: string;
  accountName: string;
  amount: string;
}

export interface ProfitAndLoss {
  income: {
    accounts: ProfitAndLossItem[];
    total: string;
  };
  expenses: {
    accounts: ProfitAndLossItem[];
    total: string;
  };
  netProfit: string;
  period: {
    startDate: string;
    endDate: string;
  };
}

export interface BalanceSheetItem {
  accountCode: string;
  accountName: string;
  groupName?: string;
  balance: string;
}

export interface BalanceSheet {
  assets: {
    accounts: BalanceSheetItem[];
    total: string;
  };
  liabilities: {
    accounts: BalanceSheetItem[];
    total: string;
  };
  equity: {
    accounts: BalanceSheetItem[];
    total: string;
    retainedEarnings: string;
    totalWithRetainedEarnings: string;
  };
  totalAssets: string;
  totalLiabilitiesAndEquity: string;
  asOf: string;
}

export interface VendorPayable {
  id: string;
  vendorId: string;
  totalSales: string;
  totalCommission: string;
  totalPayable: string;
  totalPaid: string;
  balance: string;
  totalOrders: number;
  lastSaleAt?: string;
  lastPaymentAt?: string;
  lastSyncedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface AccountingPeriod {
  id: string;
  periodName: string;
  periodType: string;
  startDate: string;
  endDate: string;
  entityType: string;
  entityId?: string;
  isActive: boolean;
  isClosed: boolean;
  closedAt?: string;
  closedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  entityName: string;
  entityId: string;
  oldData?: any;
  newData?: any;
  userId?: string;
  userName?: string;
  userRole?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface CommissionRecord {
  id: string;
  orderId: number;
  vendorId: string;
  productId: string;
  productName: string;
  quantity: number;
  productPrice: string;
  totalAmount: string;
  commissionRate: string;
  commissionAmount: string;
  status: string;
  recognizedAt?: string;
  voucherId?: string;
  createdAt: string;
  updatedAt: string;
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

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

// ============================================
// ACCOUNTING API
// ============================================

export const accountingApi = createApi({
  reducerPath: "accountingApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    "ChartOfAccounts",
    "Vouchers",
    "Ledger",
    "Reports",
    "VendorPayables",
    "AccountingPeriods",
    "AuditLogs",
    "Statistics",
  ],
  endpoints: (builder) => ({
    // ============================================
    // CHART OF ACCOUNTS
    // ============================================

    createChartOfAccount: builder.mutation<
      ApiResponse<ChartOfAccount>,
      CreateChartOfAccountRequest
    >({
      query: (body) => ({
        url: "/accounting/chart-of-accounts",
        method: "POST",
        body,
      }),
      invalidatesTags: ["ChartOfAccounts", "Statistics"],
    }),

    updateChartOfAccount: builder.mutation<
      ApiResponse<ChartOfAccount>,
      { id: string; data: UpdateChartOfAccountRequest }
    >({
      query: ({ id, data }) => ({
        url: `/accounting/chart-of-accounts/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["ChartOfAccounts"],
    }),

    deleteChartOfAccount: builder.mutation<ApiResponse<void>, string>({
      query: (id) => ({
        url: `/accounting/chart-of-accounts/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["ChartOfAccounts", "Statistics"],
    }),

    getChartOfAccounts: builder.query<
      ApiResponse<ChartOfAccount[]>,
      { entityType: string; entityId?: string }
    >({
      query: ({ entityType, entityId }) => ({
        url: "/accounting/chart-of-accounts",
        params: { entityType, entityId },
      }),
      providesTags: ["ChartOfAccounts"],
    }),

    getChartOfAccountById: builder.query<ApiResponse<ChartOfAccount>, string>({
      query: (id) => `/accounting/chart-of-accounts/${id}`,
      providesTags: ["ChartOfAccounts"],
    }),

    // ============================================
    // VOUCHERS
    // ============================================

    createManualVoucher: builder.mutation<
      ApiResponse<Voucher>,
      CreateVoucherRequest
    >({
      query: (body) => ({
        url: "/accounting/vouchers/manual",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Vouchers", "Ledger", "Reports", "Statistics"],
    }),

    createVendorVoucher: builder.mutation<
      ApiResponse<Voucher>,
      CreateVoucherRequest
    >({
      query: (body) => ({
        url: "/accounting/vouchers/manual/vendor",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Vouchers", "Ledger", "Reports", "Statistics"],
    }),

    getVoucher: builder.query<ApiResponse<Voucher>, string>({
      query: (id) => `/accounting/vouchers/${id}`,
      providesTags: ["Vouchers"],
    }),

    getVouchers: builder.query<
      PaginatedResponse<Voucher>,
      {
        entityType: string;
        entityId?: string;
        voucherType?: string;
        status?: string;
        startDate?: string;
        endDate?: string;
        referenceType?: string;
        referenceId?: string;
        page?: number;
        limit?: number;
      }
    >({
      query: (params) => ({
        url: "/accounting/vouchers",
        params,
      }),
      providesTags: ["Vouchers"],
    }),

    postVoucher: builder.mutation<ApiResponse<Voucher>, string>({
      query: (id) => ({
        url: `/accounting/vouchers/${id}/post`,
        method: "POST",
      }),
      invalidatesTags: ["Vouchers", "Ledger", "Reports", "VendorPayables"],
    }),

    lockVoucher: builder.mutation<ApiResponse<Voucher>, string>({
      query: (id) => ({
        url: `/accounting/vouchers/${id}/lock`,
        method: "POST",
      }),
      invalidatesTags: ["Vouchers"],
    }),

    reverseVoucher: builder.mutation<
      ApiResponse<{ originalVoucher: Voucher; reversalVoucher: Voucher }>,
      { id: string; data: ReverseVoucherRequest }
    >({
      query: ({ id, data }) => ({
        url: `/accounting/vouchers/${id}/reverse`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Vouchers", "Ledger", "Reports"],
    }),
    cancelVoucher: builder.mutation<
      ApiResponse<Voucher>,
      { id: string; data: { reason: string } }
    >({
      query: ({ id, data }) => ({
        url: `/accounting/vouchers/${id}/cancel`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Vouchers"],
    }),

    // ============================================
    // AUTO VOUCHERS
    // ============================================

    triggerAutoVoucher: builder.mutation<
      ApiResponse<any>,
      { eventType: string; data: any }
    >({
      query: ({ eventType, data }) => ({
        url: `/accounting/auto-voucher/${eventType}`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Vouchers", "Ledger", "Reports", "VendorPayables"],
    }),

    orderConfirmedWebhook: builder.mutation<
      ApiResponse<any>,
      AutoVoucherOrderConfirmedRequest
    >({
      query: (body) => ({
        url: "/accounting/webhooks/order-confirmed",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Vouchers", "Ledger", "Reports", "VendorPayables"],
    }),

    paymentReceivedWebhook: builder.mutation<
      ApiResponse<any>,
      AutoVoucherPaymentReceivedRequest
    >({
      query: (body) => ({
        url: "/accounting/webhooks/payment-received",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Vouchers", "Ledger", "Reports"],
    }),

    // ============================================
    // REPORTS
    // ============================================

    getTrialBalance: builder.query<
      ApiResponse<TrialBalance>,
      { entityType: string; entityId?: string; asOf?: string }
    >({
      query: (params) => ({
        url: "/accounting/reports/trial-balance",
        params,
      }),
      providesTags: ["Reports"],
    }),

    getProfitAndLoss: builder.query<
      ApiResponse<ProfitAndLoss>,
      {
        entityType: string;
        entityId?: string;
        startDate?: string;
        endDate?: string;
      }
    >({
      query: (params) => ({
        url: "/accounting/reports/profit-loss",
        params,
      }),
      providesTags: ["Reports"],
    }),

    getBalanceSheet: builder.query<
      ApiResponse<BalanceSheet>,
      { entityType: string; entityId?: string; asOf?: string }
    >({
      query: (params) => ({
        url: "/accounting/reports/balance-sheet",
        params,
      }),
      providesTags: ["Reports"],
    }),

    getLedger: builder.query<
      PaginatedResponse<LedgerEntry>,
      {
        accountId?: string;
        entityType: string;
        entityId?: string;
        startDate?: string;
        endDate?: string;
        page?: number;
        limit?: number;
      }
    >({
      query: (params) => ({
        url: "/accounting/reports/ledger",
        params,
      }),
      providesTags: ["Ledger"],
    }),

    getAccountLedger: builder.query<
      PaginatedResponse<LedgerEntry>,
      {
        accountId: string;
        startDate?: string;
        endDate?: string;
        page?: number;
        limit?: number;
      }
    >({
      query: ({ accountId, ...params }) => ({
        url: `/accounting/reports/account-ledger/${accountId}`,
        params,
      }),
      providesTags: ["Ledger"],
    }),

    getVendorPayableReport: builder.query<
      ApiResponse<VendorPayable[]>,
      { vendorId?: string }
    >({
      query: (params) => ({
        url: "/accounting/reports/vendor-payables",
        params,
      }),
      providesTags: ["VendorPayables"],
    }),

    // ============================================
    // ACCOUNTING PERIODS
    // ============================================

    createAccountingPeriod: builder.mutation<
      ApiResponse<AccountingPeriod>,
      CreateAccountingPeriodRequest
    >({
      query: (body) => ({
        url: "/accounting/accounting-periods",
        method: "POST",
        body,
      }),
      invalidatesTags: ["AccountingPeriods"],
    }),

    closeAccountingPeriod: builder.mutation<
      ApiResponse<AccountingPeriod>,
      string
    >({
      query: (id) => ({
        url: `/accounting/accounting-periods/${id}/close`,
        method: "POST",
      }),
      invalidatesTags: ["AccountingPeriods", "Reports"],
    }),

    getAccountingPeriods: builder.query<
      ApiResponse<AccountingPeriod[]>,
      { entityType: string; entityId?: string }
    >({
      query: (params) => ({
        url: "/accounting/accounting-periods",
        params,
      }),
      providesTags: ["AccountingPeriods"],
    }),

    // ============================================
    // AUDIT LOGS
    // ============================================

    getAuditLogs: builder.query<
      PaginatedResponse<AuditLog>,
      {
        entityName?: string;
        entityId?: string;
        action?: string;
        userId?: string;
        startDate?: string;
        endDate?: string;
        page?: number;
        limit?: number;
      }
    >({
      query: (params) => ({
        url: "/accounting/audit-logs",
        params,
      }),
      providesTags: ["AuditLogs"],
    }),

    // ============================================
    // VENDOR-SPECIFIC ENDPOINTS
    // ============================================

    getVendorDashboard: builder.query<
      ApiResponse<{
        trialBalance: TrialBalance;
        profitLoss: ProfitAndLoss;
        balanceSheet: BalanceSheet;
      }>,
      void
    >({
      query: () => "/accounting/vendor/dashboard",
      providesTags: ["Reports"],
    }),

    getVendorSalesSummary: builder.query<
      ApiResponse<{
        totalSales: string;
        voucherCount: number;
        vouchers: Voucher[];
      }>,
      { startDate?: string; endDate?: string }
    >({
      query: (params) => ({
        url: "/accounting/vendor/sales-summary",
        params,
      }),
      providesTags: ["Reports", "Vouchers"],
    }),

    getVendorPayables: builder.query<
      ApiResponse<{
        summary: VendorPayable;
        recentPayouts: Voucher[];
      }>,
      void
    >({
      query: () => "/accounting/vendor/payables",
      providesTags: ["VendorPayables", "Vouchers"],
    }),

    getVendorCommissions: builder.query<
      ApiResponse<{
        totalCommission: string;
        commissionCount: number;
        commissions: CommissionRecord[];
      }>,
      { status?: string; startDate?: string; endDate?: string }
    >({
      query: (params) => ({
        url: "/accounting/vendor/commissions",
        params,
      }),
      providesTags: ["Reports"],
    }),

    // ============================================
    // ADMIN DASHBOARD
    // ============================================

    getAdminDashboard: builder.query<
      ApiResponse<{
        platformSummary: BalanceSheet;
        vendorPayables: {
          totalBalance: string;
          vendorCount: number;
          topVendors: VendorPayable[];
        };
        recentTransactions: Voucher[];
        pendingSettlements: any[];
        commissionSummary: {
          totalCommissions: string;
        };
      }>,
      void
    >({
      query: () => "/accounting/admin/dashboard",
      providesTags: ["Reports", "VendorPayables"],
    }),

    getVendorPayablesDetailed: builder.query<
      ApiResponse<(VendorPayable & { recentVouchers: Voucher[] })[]>,
      void
    >({
      query: () => "/accounting/admin/vendor-payables/detailed",
      providesTags: ["VendorPayables", "Vouchers"],
    }),

    getSettlements: builder.query<ApiResponse<any[]>, { status?: string }>({
      query: (params) => ({
        url: "/accounting/admin/settlements",
        params,
      }),
      providesTags: ["Reports"],
    }),

    // ============================================
    // UTILITIES
    // ============================================

    getAccountingStatistics: builder.query<
      ApiResponse<{
        voucherCount: number;
        accountCount: number;
        ledgerEntryCount: number;
      }>,
      { entityType: string; entityId?: string }
    >({
      query: (params) => ({
        url: "/accounting/statistics",
        params,
      }),
      providesTags: ["Statistics"],
    }),

    healthCheck: builder.query<
      { success: boolean; message: string; timestamp: string },
      void
    >({
      query: () => "/accounting/health",
    }),
  }),
});

// ============================================
// EXPORT HOOKS
// ============================================

export const {
  // Chart of Accounts
  useCreateChartOfAccountMutation,
  useUpdateChartOfAccountMutation,
  useDeleteChartOfAccountMutation,
  useGetChartOfAccountsQuery,
  useLazyGetChartOfAccountsQuery,
  useGetChartOfAccountByIdQuery,
  useLazyGetChartOfAccountByIdQuery,

  // Vouchers
  useCreateManualVoucherMutation,
  useCreateVendorVoucherMutation,
  useGetVoucherQuery,
  useLazyGetVoucherQuery,
  useGetVouchersQuery,
  useLazyGetVouchersQuery,
  usePostVoucherMutation,
  useLockVoucherMutation,
  useReverseVoucherMutation,
  useCancelVoucherMutation,

  // Auto Vouchers
  useTriggerAutoVoucherMutation,
  useOrderConfirmedWebhookMutation,
  usePaymentReceivedWebhookMutation,

  // Reports
  useGetTrialBalanceQuery,
  useLazyGetTrialBalanceQuery,
  useGetProfitAndLossQuery,
  useLazyGetProfitAndLossQuery,
  useGetBalanceSheetQuery,
  useLazyGetBalanceSheetQuery,
  useGetLedgerQuery,
  useLazyGetLedgerQuery,
  useGetAccountLedgerQuery,
  useLazyGetAccountLedgerQuery,
  useGetVendorPayableReportQuery,
  useLazyGetVendorPayableReportQuery,

  // Accounting Periods
  useCreateAccountingPeriodMutation,
  useCloseAccountingPeriodMutation,
  useGetAccountingPeriodsQuery,
  useLazyGetAccountingPeriodsQuery,

  // Audit Logs
  useGetAuditLogsQuery,
  useLazyGetAuditLogsQuery,

  // Vendor Endpoints
  useGetVendorDashboardQuery,
  useLazyGetVendorDashboardQuery,
  useGetVendorSalesSummaryQuery,
  useLazyGetVendorSalesSummaryQuery,
  useGetVendorPayablesQuery,
  useLazyGetVendorPayablesQuery,
  useGetVendorCommissionsQuery,
  useLazyGetVendorCommissionsQuery,

  // Admin Endpoints
  useGetAdminDashboardQuery,
  useLazyGetAdminDashboardQuery,
  useGetVendorPayablesDetailedQuery,
  useLazyGetVendorPayablesDetailedQuery,
  useGetSettlementsQuery,
  useLazyGetSettlementsQuery,

  // Utilities
  useGetAccountingStatisticsQuery,
  useLazyGetAccountingStatisticsQuery,
  useHealthCheckQuery,
} = accountingApi;
