import { createApi } from "@reduxjs/toolkit/query/react";
import baseQueryWithReauth from "./baseQueryWithReauth";

/* ==================== REQUEST TYPES ==================== */

export type StockStatus = "in_stock" | "low_stock" | "out_stock" | "overstock";
export type EntityType = "ADMIN" | "VENDOR";

export interface StockListParams {
  page?: number;
  limit?: number;
  warehouseId?: string;
  // FIX: added rack/row/shelf filtering so the inventory list can be
  // narrowed to an exact shelf within a warehouse, mirroring the
  // WarehouseLocationInput shape already used by the mutation requests.
  rackId?: string;
  rowNumber?: number;
  shelfNumber?: number;
  categoryId?: string;
  status?: StockStatus;
  q?: string;
}

// FIX: shared exact-shelf targeting input, mirrors backend's
// WarehouseLocationInput (stock-inventory.types.ts). All fields optional —
// omit entirely for vendors who don't manage rack/row/shelf (backend then
// falls back to the warehouse's loose row / spreads across all rows).
export interface WarehouseLocationInput {
  rackId?: string;
  rowNumber?: number;
  shelfNumber?: number;
}

// FIX: extends WarehouseLocationInput so rack-managing vendors can target
// an exact shelf. Previously missing entirely, so a warehouse with only
// racked stock (no loose row) could never be adjusted from this request.
export interface StockAdjustRequest extends WarehouseLocationInput {
  variantId: string;
  warehouseId: string;
  quantity: number;
  reason?: string;
  notes?: string;
  entityType: EntityType;
  entityId?: string;
}

export interface StockDamageRequest extends WarehouseLocationInput {
  variantId: string;
  warehouseId: string;
  quantity: number;
  reason?: string;
  notes?: string;
  entityType: EntityType;
  entityId?: string;
}

// FIX: transfer needs a source AND destination location, so it takes two
// separate optional location objects instead of extending
// WarehouseLocationInput directly (a flat rackId would be ambiguous about
// which side it refers to). Matches backend's StockTransferDTO.from/.to.
export interface StockTransferRequest {
  variantId: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  quantity: number;
  from?: WarehouseLocationInput;
  to?: WarehouseLocationInput;
  reason?: string;
  notes?: string;
  entityType: EntityType;
  entityId?: string;
}

export interface StockSellDamageRequest extends WarehouseLocationInput {
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

// A single rack/row/shelf slice within a warehouse, as returned by
// stock.service.ts -> groupByWarehouse()
export interface WarehouseLocation {
  rackId: string | null;
  rackCode: string | null;
  rackLabel: string | null;
  rowNumber: number | null;
  shelfNumber: number | null;
  quantity: number;
  reservedQty: number;
  damagedQty: number;
}

// Matches groupByWarehouse() output exactly: warehouseId, warehouseName,
// warehouseCode, ...totals (quantity/damagedQty/reservedQty/available), locations
export interface WarehouseStockBreakdown {
  warehouseId: string;
  warehouseName: string;
  warehouseCode: string | null;
  quantity: number;
  reservedQty: number;
  damagedQty: number;
  available: number;
  locations: WarehouseLocation[];
}

// Same shape is used for both the list view and the variant detail view
export type WarehouseBreakdownDetail = WarehouseStockBreakdown;

export interface StockInventoryRow {
  variantId: string;
  sku: string;
  productId: string;
  productName: string;
  variantName: string;
  category: string | null;
  image: string | null;
  // NOTE: backend now converts Decimal -> number via .toNumber() before
  // responding (stock.service.ts fix), so these are genuinely numbers on
  // the wire. If the backend fix is not deployed, these arrive as strings
  // instead — coerce with Number(...) defensively if unsure.
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

export interface StockMovement {
  id: string;
  variantId: string;
  fromWarehouseId: string | null;
  toWarehouseId: string | null;
  rackId: string | null;
  toRackId: string | null;
  movementType: string;
  quantity: number;
  reason: string | null;
  notes: string | null;
  saleAmount: number | null;
  coaAccountId: string | null;
  voucherId: string | null;
  referenceId: string | null;
  createdBy: string | null;
  createdAt: string;
  // NOTE: only populated when the backend query included these relations
  // (currently only getVariantStockDetail's recentMovements does this).
  // Mutation responses (adjust/damage/transfer/sell-damage) do NOT include
  // these — they will always be undefined there, since stock.service.ts's
  // tx.stockMovement.create() calls don't pass an `include`.
  fromWarehouse?: { id: string; name: string } | null;
  toWarehouse?: { id: string; name: string } | null;
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

// The voucher object returned by accountingService.createAutoVoucher().
// NOTE: confirm exact fields against accounting.services.ts — adjust as needed.
export interface StockVoucher {
  id: string;
  voucherNumber: string;
  amount?: number;
  saleAmount?: number;
  [key: string]: unknown;
}

// stockAdjust / stockDamage / stockTransfer all resolve to { movement, voucher }
export interface StockMutationResponse {
  movement: StockMovement;
  voucher: StockVoucher | null;
}

// sellDamageStock also resolves to { movement, voucher }
export interface StockSellDamageResponse {
  movement: StockMovement;
  voucher: StockVoucher | null;
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