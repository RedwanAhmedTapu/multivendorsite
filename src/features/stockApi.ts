import { createApi } from "@reduxjs/toolkit/query/react";
import baseQueryWithReauth from "./baseQueryWithReauth";

/* ==================== REQUEST TYPES ==================== */

export type StockStatus = "in_stock" | "low_stock" | "out_stock" | "overstock";
export type EntityType = "ADMIN" | "VENDOR";

export interface StockListParams {
  page?: number;
  limit?: number;
  warehouseId?: string;
  categoryId?: string;
  status?: StockStatus;
  q?: string;
}

export interface StockAdjustRequest {
  variantId: string;
  warehouseId: string;
  quantity: number;
  reason?: string;
  notes?: string;
  entityType: EntityType;
  entityId?: string;
}

export interface StockDamageRequest {
  variantId: string;
  warehouseId: string;
  quantity: number;
  reason?: string;
  notes?: string;
  entityType: EntityType;
  entityId?: string;
}

export interface StockTransferRequest {
  variantId: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  quantity: number;
  reason?: string;
  notes?: string;
  entityType: EntityType;
  entityId?: string;
}

export interface StockSellDamageRequest {
  variantId: string;
  warehouseId: string;
  quantity: number;
  saleAmount: number;
  receiptCoaAccountId: string;
  notes?: string;
  entityType: EntityType;
  entityId?: string;
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
}

export interface WarehouseStockBreakdown {
  warehouseId: string;
  warehouseName: string;
  quantity: number;
  reservedQty: number;
  damagedQty: number;
}

export interface StockInventoryRow {
  variantId: string;
  sku: string;
  productId: string;
  productName: string;
  variantName: string;
  category: string | null;
  image: string | null;
  avgCost: number;
  price: number;
  reorderLevel: number;
  totalStock: number;
  damagedQty: number;
  reservedQty: number;
  availableStock: number;
  status: StockStatus;
  warehouseBreakdown: WarehouseStockBreakdown[];
}

export interface StockStats {
  totalVariants: number;
  totalStock: number;
  totalValue: number;
  totalAvailable: number;
  totalDamaged: number;
  totalReserved: number;
  lowStockCount: number;
  outOfStockCount: number;
  overstockCount: number;
}

export interface WarehouseBreakdownDetail {
  warehouseId: string;
  warehouseName: string;
  quantity: number;
  reservedQty: number;
  damagedQty: number;
  available: number;
}

export interface StockMovement {
  id: string;
  variantId: string;
  movementType: string;
  quantity: number;
  reason: string | null;
  notes: string | null;
  fromWarehouse: { id: string; name: string } | null;
  toWarehouse: { id: string; name: string } | null;
  createdAt: string;
}

export interface VariantStockDetail {
  variant: {
    id: string;
    sku: string;
    name: string;
    productName: string;
    totalStock: number;
    damagedQty: number;
    reservedQty: number;
    availableStock: number;
    avgCost: number | null;
    reorderLevel: number | null;
  };
  warehouseBreakdown: WarehouseBreakdownDetail[];
  recentMovements: StockMovement[];
}

export interface StockMutationResponse {
  voucherNumber: string;
  amount: number;
}

export interface StockSellDamageResponse {
  voucherNumber: string;
  saleAmount: number;
}

/* ==================== API ==================== */

export const stockApi = createApi({
  reducerPath: "stockApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Stock", "StockStats", "StockVariant"],

  endpoints: (builder) => ({

    /* ─── GET /api/stock ──────────────────────────────────────────────────── */
    getStockInventory: builder.query<PaginatedResponse<StockInventoryRow>, StockListParams>({
      query: (params) => ({
        url: "/stock",
        params,
      }),
      providesTags: ["Stock"],
    }),

    /* ─── GET /api/stock/stats ────────────────────────────────────────────── */
    getStockStats: builder.query<ApiResponse<StockStats>, void>({
      query: () => "/stock/stats",
      providesTags: ["StockStats"],
    }),

    /* ─── GET /api/stock/:variantId ───────────────────────────────────────── */
    getVariantStock: builder.query<ApiResponse<VariantStockDetail>, string>({
      query: (variantId) => `/stock/${variantId}`,
      providesTags: (_result, _error, variantId) => [
        { type: "StockVariant", id: variantId },
      ],
    }),

    /* ─── POST /api/stock/adjust ──────────────────────────────────────────── */
    adjustStock: builder.mutation<ApiResponse<StockMutationResponse>, StockAdjustRequest>({
      query: (body) => ({
        url: "/stock/adjust",
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { variantId }) => [
        "Stock",
        "StockStats",
        { type: "StockVariant", id: variantId },
      ],
    }),

    /* ─── POST /api/stock/damage ──────────────────────────────────────────── */
    damageStock: builder.mutation<ApiResponse<StockMutationResponse>, StockDamageRequest>({
      query: (body) => ({
        url: "/stock/damage",
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { variantId }) => [
        "Stock",
        "StockStats",
        { type: "StockVariant", id: variantId },
      ],
    }),

    /* ─── POST /api/stock/transfer ────────────────────────────────────────── */
    transferStock: builder.mutation<ApiResponse<StockMutationResponse>, StockTransferRequest>({
      query: (body) => ({
        url: "/stock/transfer",
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { variantId }) => [
        "Stock",
        "StockStats",
        { type: "StockVariant", id: variantId },
      ],
    }),

    /* ─── POST /api/stock/sell-damage ─────────────────────────────────────── */
    sellDamageStock: builder.mutation<
      ApiResponse<StockSellDamageResponse>,
      StockSellDamageRequest
    >({
      query: (body) => ({
        url: "/stock/sell-damage",
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { variantId }) => [
        "Stock",
        "StockStats",
        { type: "StockVariant", id: variantId },
      ],
    }),
  }),
});

/* ==================== EXPORT HOOKS ==================== */

export const {
  // Queries
  useGetStockInventoryQuery,
  useLazyGetStockInventoryQuery,
  useGetStockStatsQuery,
  useLazyGetStockStatsQuery,
  useGetVariantStockQuery,
  useLazyGetVariantStockQuery,

  // Mutations
  useAdjustStockMutation,
  useDamageStockMutation,
  useTransferStockMutation,
  useSellDamageStockMutation,
} = stockApi;