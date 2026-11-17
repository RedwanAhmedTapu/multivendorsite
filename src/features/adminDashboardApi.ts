// features/adminDashboardApi.ts
// Aggregated admin dashboard summary (ADMIN-only backend route).
import { createApi } from "@reduxjs/toolkit/query/react";
import baseQueryWithReauth from "./baseQueryWithReauth";

export type DashboardPreset = "today" | "7d" | "30d" | "90d" | "year" | "custom";

export interface DashboardRange {
  preset: DashboardPreset;
  from: string;
  to: string;
  previousFrom: string;
  previousTo: string;
}

export interface DashboardStats {
  revenue: number;
  orders: number;
  aov: number;
  newCustomers: number;
  activeVendors: number;
  totalVendors: number;
  pendingOrders: number;
  lowStockCount: number;
  refundAmount: number;
  refundCount: number;
  refundRate: number;
  fulfillment: { avgHours: number; deliveredShare: number };
  previous: { revenue: number; orders: number; newCustomers: number };
}

export interface AdminDashboardSummary {
  range: DashboardRange;
  stats: DashboardStats;
  revenueTrend: { date: string; revenue: number; orders: number }[];
  ordersByStatus: { status: string; count: number }[];
  paymentsByMethod: { method: string; count: number; amount: number }[];
  salesByCategory: { categoryId: string; name: string; revenue: number }[];
  topVendors: { vendorId: string; storeName: string; revenue: number; orders: number }[];
  topProducts: { productId: string; name: string; units: number; revenue: number }[];
  customerGrowth: { date: string; count: number }[];
  refunds: { byStatus: { status: string; count: number; amount: number }[] };
  lists: {
    pendingOrders: { id: string; orderNumber: string; totalAmount: number; createdAt: string; customer: string }[];
    lowStock: { variantId: string; productId: string; productName: string; available: number }[];
    recentOrders: {
      id: string;
      orderNumber: string;
      totalAmount: number;
      status: string;
      paymentMethod: string;
      createdAt: string;
      customer: string;
    }[];
    recentPayments: { id: string; amount: number; method: string; paidAt: string | null; orderNumber: string }[];
    newCustomers: { id: string; name: string | null; email: string | null; createdAt: string }[];
  };
}

export type DashboardQueryArgs =
  | { preset: Exclude<DashboardPreset, "custom">; from?: never; to?: never }
  | { preset: "custom"; from: string; to: string };

export const adminDashboardApi = createApi({
  reducerPath: "adminDashboardApi",
  baseQuery: baseQueryWithReauth,
  endpoints: (builder) => ({
    getAdminDashboardSummary: builder.query<AdminDashboardSummary, DashboardQueryArgs>({
      query: (args) => ({
        url: "/admin/dashboard/summary",
        method: "GET",
        params:
          args.preset === "custom"
            ? { from: args.from, to: args.to }
            : { preset: args.preset },
      }),
      transformResponse: (response: { success: boolean; data: AdminDashboardSummary }) => response.data,
    }),
  }),
});

export const { useGetAdminDashboardSummaryQuery } = adminDashboardApi;
