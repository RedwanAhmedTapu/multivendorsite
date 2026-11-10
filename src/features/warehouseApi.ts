// src/features/warehouseApi.ts
import { createApi } from "@reduxjs/toolkit/query/react";
import baseQueryWithReauth from "./baseQueryWithReauth";

/* ==================== ENUMS ==================== */

export enum WarehouseType {
  PICKUP = "PICKUP",
  RETURN = "RETURN",
}

export enum StockMovementType {
  PURCHASE_RECEIVE = "PURCHASE_RECEIVE",
  ADJUSTMENT = "ADJUSTMENT",
  DAMAGE = "DAMAGE",
  RETURN = "RETURN",
  TRANSFER = "TRANSFER",
  SELL_DAMAGE = "SELL_DAMAGE",
}

/* ==================== REQUEST TYPES ==================== */

export interface CreateWarehouseRequest {
  vendorId: string;
  locationId: string;
  code?: string;
  name?: string;
  address?: string;
  email?: string;
  phone?: string;
  isDefault?: boolean;
  type?: WarehouseType;
}

export interface BulkWarehouseRequest {
  vendorId: string;
  pickupWarehouse: {
    locationId: string;
    address: string;
    code?: string;
    name?: string;
    email?: string;
    phone?: string;
  };
  returnWarehouse?: {
    locationId: string;
    address: string;
    code?: string;
    name?: string;
    email?: string;
    phone?: string;
    sameAsPickup?: boolean;
  };
}

export interface UpdateWarehouseRequest {
  locationId?: string;
  code?: string;
  name?: string;
  address?: string;
  email?: string;
  phone?: string;
  isDefault?: boolean;
  type?: WarehouseType;
}

export interface CreateHolidayRequest {
  warehouseId: string;
  start: Date | string;
  end: Date | string;
  isOpen?: boolean;
}

export interface UpdateHolidayRequest {
  start?: Date | string;
  end?: Date | string;
  isOpen?: boolean;
}

export interface WarehouseFilters {
  type?: WarehouseType;
  isDefault?: boolean;
  locationId?: string;
  /** true = only active warehouses (use for selectors that create new usage). */
  isActive?: boolean;
}

export interface HolidayFilters {
  startDate?: Date | string;
  endDate?: Date | string;
  isOpen?: boolean;
}

/* ---------- RACK REQUEST TYPES ---------- */

export interface CreateRackRequest {
  warehouseId: string;
  code: string;
  label?: string;
  totalRows?: number;
  totalShelves?: number;
  isActive?: boolean;
}

export interface UpdateRackRequest {
  code?: string;
  label?: string;
  totalRows?: number;
  totalShelves?: number;
  isActive?: boolean;
}

export interface RackFilters {
  isActive?: boolean;
}

/* ---------- STOCK REQUEST TYPES ---------- */

export interface ReceivePurchaseOrderItem {
  purchaseOrderItemId: string;
  variantId: string;
  receivedQty: number;
  unitCost: number;
  newAvgCost: number;
  sellPrice?: number;
  rackId?: string;
  rowNumber?: number;
  shelfNumber?: number;
}

export interface ReceivePurchaseOrderRequest {
  warehouseId: string;
  purchaseOrderId: string;
  vendorId: string;
  items: ReceivePurchaseOrderItem[];
}

export interface StockAdjustmentRequest {
  variantId: string;
  warehouseId: string;
  vendorId: string;
  quantity: number;
  movementType:
    | StockMovementType.ADJUSTMENT
    | StockMovementType.DAMAGE
    | StockMovementType.RETURN;
  rackId?: string;
  rowNumber?: number;
  shelfNumber?: number;
  reason?: string;
  notes?: string;
}

export interface StockTransferRequest {
  variantId: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  vendorId: string;
  quantity: number;
  fromRackId?: string;
  fromRowNumber?: number;
  fromShelfNumber?: number;
  toRackId?: string;
  toRowNumber?: number;
  toShelfNumber?: number;
  reason?: string;
  notes?: string;
}

export interface SellDamagedStockRequest {
  variantId: string;
  fromWarehouseId: string;
  vendorId: string;
  quantity: number;
  saleAmount: number;
  fromRackId?: string;
  fromRowNumber?: number;
  fromShelfNumber?: number;
  coaAccountId?: string;
  reason?: string;
  notes?: string;
}

export interface WarehouseStockFilters {
  warehouseId?: string;
  variantId?: string;
  rackId?: string;
  rowNumber?: number;
  shelfNumber?: number;
  lowStockOnly?: boolean;
  outOfStockOnly?: boolean;
  page?: number;
  limit?: number;
}

export interface StockMovementFilters {
  variantId?: string;
  warehouseId?: string;
  movementType?: StockMovementType;
  startDate?: Date | string;
  endDate?: Date | string;
  page?: number;
  limit?: number;
}

/* ==================== RESPONSE TYPES ==================== */

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedApiResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

/* ---------- BASE TYPES ---------- */

export interface Vendor {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

export interface WarehouseHoliday {
  id: string;
  warehouseId: string;
  start: Date;
  end: Date;
  isOpen: boolean;
  createdAt: Date;
  updatedAt: Date;
  warehouse?: Warehouse;
}

export interface WarehouseRack {
  id: string;
  warehouseId: string;
  code: string;
  label: string | null;
  totalRows: number;
  totalShelves: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  warehouse?: {
    id: string;
    name: string | null;
    code: string | null;
  };
  stockItems?: WarehouseStockSummary[];
}

export interface WarehouseStockSummary {
  id: string;
  variantId: string;
  warehouseId: string;
  rackId: string | null;
  rowNumber: number | null;
  shelfNumber: number | null;
  quantity: number;
  reservedQty: number;
  damagedQty: number;
  updatedAt: Date;
  variant: ProductVariantSummary;
}

export interface Warehouse {
  id: string;
  vendorId: string;
  locationId: string;
  code: string | null;
  name: string | null;
  address: string | null;
  email: string | null;
  phone: string | null;
  isDefault: boolean;
  type: WarehouseType;
  /** false = deactivated: no new operational use; history intact. */
  isActive: boolean;
  deactivatedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  vendor: Vendor;
  location: Location;
  holidays?: WarehouseHoliday[];
  racks?: WarehouseRack[];
  warehouseStock?: WarehouseStockSummary[];
}

/** Derived lifecycle state from GET /warehouse/warehouses/:id/usage. */
export interface WarehouseUsage {
  warehouseId: string;
  isActive: boolean;
  deactivatedAt: string | null;
  /** Derived from real stock/order activity — never stored. */
  operational: boolean;
  counts: Record<string, number>;
  /** Reason text when a field is locked, otherwise null. */
  locks: { locationId: string | null; type: string | null; address: string | null };
  canDeactivate: boolean;
  deactivationBlockers: string[];
  canHardDelete: boolean;
  hardDeleteBlockers: string[];
}

export interface BulkWarehouseResponse {
  pickupWarehouse: Warehouse;
  returnWarehouse?: Warehouse;
}

/* ---------- STOCK RESPONSE TYPES ---------- */

export interface ProductVariantSummary {
  id: string;
  sku: string;
  price: number;
  stock: number;
  damagedQty: number;
  reorderLevel?: number;
  product: {
    id: string;
    name: string;
    slug?: string;
  };
}

export interface WarehouseSummary {
  id: string;
  name: string | null;
  code: string | null;
  type: WarehouseType;
  location: Location;
}

export interface RackSummary {
  id: string;
  code: string;
  label: string | null;
  totalRows: number;
  totalShelves: number;
}

export interface WarehouseStock {
  id: string;
  variantId: string;
  warehouseId: string;
  rackId: string | null;
  rowNumber: number | null;
  shelfNumber: number | null;
  quantity: number;
  reservedQty: number;
  damagedQty: number;
  updatedAt: Date;
  warehouse: WarehouseSummary;
  rack: RackSummary | null;
  variant: ProductVariantSummary;
}

export interface StockMovement {
  id: string;
  variantId: string;
  fromWarehouseId: string | null;
  toWarehouseId: string | null;
  movementType: StockMovementType;
  quantity: number;
  reason: string | null;
  notes: string | null;
  saleAmount: number | null;
  coaAccountId: string | null;
  referenceId: string | null;
  createdBy: string;
  createdAt: Date;
  variant: {
    id: string;
    sku: string;
    product: {
      id: string;
      name: string;
    };
  };
  fromWarehouse: Pick<WarehouseSummary, "id" | "name" | "code"> | null;
  toWarehouse: Pick<WarehouseSummary, "id" | "name" | "code"> | null;
}

export interface ReceivePurchaseOrderResponse {
  purchaseOrderId: string;
  warehouseId: string;
  movements: StockMovement[];
}

/* ==================== API ==================== */

export const warehouseApi = createApi({
  reducerPath: "vendorWarehouseApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    "Warehouse",
    "WarehouseList",
    "WarehouseHoliday",
    "WarehouseHolidayList",
    "WarehouseRack",
    "WarehouseRackList",
    "WarehouseStock",
    "StockMovement",
    "WarehouseUsage",
  ],

  endpoints: (builder) => ({
    /* ==================== WAREHOUSE ENDPOINTS ==================== */

    createWarehouse: builder.mutation<
      ApiResponse<Warehouse>,
      CreateWarehouseRequest
    >({
      query: (data) => ({
        url: `/warehouse/vendors/${data.vendorId}/warehouses`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (_result, _error, { vendorId }) => [
        { type: "WarehouseList", id: vendorId },
        "Warehouse",
      ],
    }),

    createOrUpdateBulkWarehouses: builder.mutation<
      ApiResponse<BulkWarehouseResponse>,
      BulkWarehouseRequest
    >({
      query: (data) => ({
        url: `/warehouse/vendors/${data.vendorId}/warehouses/bulk`,
        method: "POST",
        body: {
          pickupWarehouse: data.pickupWarehouse,
          returnWarehouse: data.returnWarehouse,
        },
      }),
      invalidatesTags: (_result, _error, { vendorId }) => [
        { type: "WarehouseList", id: vendorId },
        "Warehouse",
      ],
    }),

    getWarehousesByVendor: builder.query<
      ApiResponse<Warehouse[]>,
      { vendorId: string; filters?: WarehouseFilters }
    >({
      query: ({ vendorId, filters }) => {
        const safeFilters = filters ?? {};
        const params = new URLSearchParams();
        if (safeFilters.type) params.append("type", safeFilters.type);
        if (safeFilters.isDefault !== undefined)
          params.append("isDefault", String(safeFilters.isDefault));
        if (safeFilters.locationId)
          params.append("locationId", safeFilters.locationId);
        if (safeFilters.isActive !== undefined)
          params.append("isActive", String(safeFilters.isActive));
        const queryString = params.toString();
        return `/warehouse/vendors/${vendorId}/warehouses${queryString ? `?${queryString}` : ""}`;
      },
      providesTags: (_result, _error, { vendorId }) => [
        { type: "WarehouseList", id: vendorId },
        ...(_result?.data?.map((w) => ({
          type: "Warehouse" as const,
          id: w.id,
        })) ?? []),
      ],
    }),

    getWarehouseById: builder.query<
      ApiResponse<Warehouse>,
      { id: string; includeHolidays?: boolean }
    >({
      query: ({ id, includeHolidays }) => {
        const params = new URLSearchParams();
        if (includeHolidays) params.append("includeHolidays", "true");
        const queryString = params.toString();
        return `/warehouse/warehouses/${id}${queryString ? `?${queryString}` : ""}`;
      },
      providesTags: (result) => [{ type: "Warehouse", id: result?.data.id }],
    }),

    updateWarehouse: builder.mutation<
      ApiResponse<Warehouse>,
      { id: string; data: UpdateWarehouseRequest }
    >({
      query: ({ id, data }) => ({
        url: `/warehouse/warehouses/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Warehouse", id },
        "WarehouseList",
        { type: "WarehouseUsage", id },
      ],
    }),

    /** Lifecycle state: operational?, locked fields, deactivate/delete eligibility. */
    getWarehouseUsage: builder.query<ApiResponse<WarehouseUsage>, { id: string }>({
      query: ({ id }) => `/warehouse/warehouses/${id}/usage`,
      providesTags: (_result, _error, { id }) => [{ type: "WarehouseUsage", id }],
    }),

    deactivateWarehouse: builder.mutation<ApiResponse<Warehouse>, { id: string }>({
      query: ({ id }) => ({
        url: `/warehouse/warehouses/${id}/deactivate`,
        method: "PATCH",
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Warehouse", id },
        "WarehouseList",
        { type: "WarehouseUsage", id },
      ],
    }),

    reactivateWarehouse: builder.mutation<ApiResponse<Warehouse>, { id: string }>({
      query: ({ id }) => ({
        url: `/warehouse/warehouses/${id}/reactivate`,
        method: "PATCH",
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Warehouse", id },
        "WarehouseList",
        { type: "WarehouseUsage", id },
      ],
    }),

    deleteWarehouse: builder.mutation<ApiResponse<null>, { id: string }>({
      query: ({ id }) => ({
        url: `/warehouse/warehouses/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Warehouse", id },
        "WarehouseList",
        "WarehouseStock",
        "WarehouseRackList",
      ],
    }),

    setDefaultWarehouse: builder.mutation<ApiResponse<Warehouse>, { id: string }>({
      query: ({ id }) => ({
        url: `/warehouse/warehouses/${id}/set-default`,
        method: "PATCH",
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Warehouse", id },
        "WarehouseList",
      ],
    }),

    /* ==================== RACK ENDPOINTS ==================== */

    createRack: builder.mutation<ApiResponse<WarehouseRack>, CreateRackRequest>({
      query: ({ warehouseId, ...body }) => ({
        url: `/warehouse/warehouses/${warehouseId}/racks`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { warehouseId }) => [
        { type: "WarehouseRackList", id: warehouseId },
        { type: "Warehouse", id: warehouseId },
        "WarehouseRack",
      ],
    }),

    getRacksByWarehouse: builder.query<
      ApiResponse<WarehouseRack[]>,
      { warehouseId: string; filters?: RackFilters }
    >({
      query: ({ warehouseId, filters }) => {
        const safeFilters = filters ?? {};
        const params = new URLSearchParams();
        if (safeFilters.isActive !== undefined)
          params.append("isActive", String(safeFilters.isActive));
        const queryString = params.toString();
        return `/warehouse/warehouses/${warehouseId}/racks${queryString ? `?${queryString}` : ""}`;
      },
      providesTags: (_result, _error, { warehouseId }) => [
        { type: "WarehouseRackList", id: warehouseId },
        ...(_result?.data?.map((r) => ({
          type: "WarehouseRack" as const,
          id: r.id,
        })) ?? []),
      ],
    }),

    getRackById: builder.query<ApiResponse<WarehouseRack>, { id: string }>({
      query: ({ id }) => `/warehouse/racks/${id}`,
      providesTags: (result) => [{ type: "WarehouseRack", id: result?.data.id }],
    }),

    updateRack: builder.mutation<
      ApiResponse<WarehouseRack>,
      { id: string; data: UpdateRackRequest }
    >({
      query: ({ id, data }) => ({
        url: `/warehouse/racks/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "WarehouseRack", id },
        "WarehouseRackList",
      ],
    }),

    deleteRack: builder.mutation<ApiResponse<null>, { id: string }>({
      query: ({ id }) => ({
        url: `/warehouse/racks/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "WarehouseRack", id },
        "WarehouseRackList",
        "WarehouseStock",
      ],
    }),

    toggleRackActive: builder.mutation<ApiResponse<WarehouseRack>, { id: string }>({
      query: ({ id }) => ({
        url: `/warehouse/racks/${id}/toggle-active`,
        method: "PATCH",
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "WarehouseRack", id },
        "WarehouseRackList",
      ],
    }),

    /* ==================== HOLIDAY ENDPOINTS ==================== */

    createHoliday: builder.mutation<
      ApiResponse<WarehouseHoliday>,
      CreateHolidayRequest
    >({
      query: (data) => ({
        url: `/warehouse/warehouses/${data.warehouseId}/holidays`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (_result, _error, { warehouseId }) => [
        { type: "WarehouseHolidayList", id: warehouseId },
        "WarehouseHoliday",
      ],
    }),

    getHolidaysByWarehouse: builder.query<
      ApiResponse<WarehouseHoliday[]>,
      { warehouseId: string; filters?: HolidayFilters }
    >({
      query: ({ warehouseId, filters }) => {
        const safeFilters = filters ?? {};
        const params = new URLSearchParams();
        if (safeFilters.startDate)
          params.append("startDate", String(safeFilters.startDate));
        if (safeFilters.endDate)
          params.append("endDate", String(safeFilters.endDate));
        if (safeFilters.isOpen !== undefined)
          params.append("isOpen", String(safeFilters.isOpen));
        const queryString = params.toString();
        return `/warehouse/warehouses/${warehouseId}/holidays${queryString ? `?${queryString}` : ""}`;
      },
      providesTags: (_result, _error, { warehouseId }) => [
        { type: "WarehouseHolidayList", id: warehouseId },
        ...(_result?.data?.map((h) => ({
          type: "WarehouseHoliday" as const,
          id: h.id,
        })) ?? []),
      ],
    }),

    updateHoliday: builder.mutation<
      ApiResponse<WarehouseHoliday>,
      { id: string; data: UpdateHolidayRequest }
    >({
      query: ({ id, data }) => ({
        url: `/warehouse/holidays/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "WarehouseHoliday", id },
        "WarehouseHolidayList",
      ],
    }),

    deleteHoliday: builder.mutation<ApiResponse<null>, { id: string }>({
      query: ({ id }) => ({
        url: `/warehouse/holidays/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "WarehouseHoliday", id },
        "WarehouseHolidayList",
      ],
    }),

    /* ==================== STOCK ENDPOINTS ==================== */

    receivePurchaseOrder: builder.mutation<
      ApiResponse<ReceivePurchaseOrderResponse>,
      ReceivePurchaseOrderRequest
    >({
      query: ({ warehouseId, ...body }) => ({
        url: `/warehouse/warehouses/${warehouseId}/stock/receive`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { warehouseId }) => [
        { type: "WarehouseStock", id: warehouseId },
        "StockMovement",
      ],
    }),

    adjustStock: builder.mutation<
      ApiResponse<StockMovement>,
      StockAdjustmentRequest
    >({
      query: (body) => ({
        url: `/warehouse/stock/adjust`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: "WarehouseStock", id: arg.warehouseId },
        "StockMovement",
      ],
    }),

    transferStock: builder.mutation<
      ApiResponse<StockMovement>,
      StockTransferRequest
    >({
      query: (body) => ({
        url: `/warehouse/stock/transfer`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: "WarehouseStock", id: arg.fromWarehouseId },
        { type: "WarehouseStock", id: arg.toWarehouseId },
        "StockMovement",
      ],
    }),

    sellDamagedStock: builder.mutation<
      ApiResponse<StockMovement>,
      SellDamagedStockRequest
    >({
      query: (body) => ({
        url: `/warehouse/stock/sell-damaged`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: "WarehouseStock", id: arg.fromWarehouseId },
        "StockMovement",
      ],
    }),

    getWarehouseStock: builder.query<
      PaginatedApiResponse<WarehouseStock>,
      WarehouseStockFilters
    >({
      query: (filters) => {
        const safeFilters = filters ?? {};
        const params = new URLSearchParams();
        if (safeFilters.warehouseId)
          params.append("warehouseId", safeFilters.warehouseId);
        if (safeFilters.variantId)
          params.append("variantId", safeFilters.variantId);
        if (safeFilters.rackId) params.append("rackId", safeFilters.rackId);
        if (safeFilters.rowNumber !== undefined)
          params.append("rowNumber", String(safeFilters.rowNumber));
        if (safeFilters.shelfNumber !== undefined)
          params.append("shelfNumber", String(safeFilters.shelfNumber));
        if (safeFilters.lowStockOnly)
          params.append("lowStockOnly", "true");
        if (safeFilters.outOfStockOnly)
          params.append("outOfStockOnly", "true");
        if (safeFilters.page) params.append("page", String(safeFilters.page));
        if (safeFilters.limit) params.append("limit", String(safeFilters.limit));
        const queryString = params.toString();
        return `/warehouse/stock${queryString ? `?${queryString}` : ""}`;
      },
      providesTags: (_result, _error, filters) => [
        { type: "WarehouseStock", id: filters?.warehouseId ?? "ALL" },
        ...(_result?.data?.map((s) => ({
          type: "WarehouseStock" as const,
          id: s.id,
        })) ?? []),
      ],
    }),

    getStockMovements: builder.query<
      PaginatedApiResponse<StockMovement>,
      StockMovementFilters
    >({
      query: (filters) => {
        const safeFilters = filters ?? {};
        const params = new URLSearchParams();
        if (safeFilters.variantId)
          params.append("variantId", safeFilters.variantId);
        if (safeFilters.warehouseId)
          params.append("warehouseId", safeFilters.warehouseId);
        if (safeFilters.movementType)
          params.append("movementType", safeFilters.movementType);
        if (safeFilters.startDate)
          params.append("startDate", String(safeFilters.startDate));
        if (safeFilters.endDate)
          params.append("endDate", String(safeFilters.endDate));
        if (safeFilters.page) params.append("page", String(safeFilters.page));
        if (safeFilters.limit) params.append("limit", String(safeFilters.limit));
        const queryString = params.toString();
        return `/warehouse/stock/movements${queryString ? `?${queryString}` : ""}`;
      },
      providesTags: (result) => [
        "StockMovement",
        ...(result?.data?.map((m) => ({
          type: "StockMovement" as const,
          id: m.id,
        })) ?? []),
      ],
    }),
  }),
});

/* ==================== EXPORT HOOKS ==================== */

export const {
  useCreateWarehouseMutation,
  useCreateOrUpdateBulkWarehousesMutation,
  useGetWarehousesByVendorQuery,
  useLazyGetWarehousesByVendorQuery,
  useGetWarehouseByIdQuery,
  useLazyGetWarehouseByIdQuery,
  useUpdateWarehouseMutation,
  useGetWarehouseUsageQuery,
  useDeactivateWarehouseMutation,
  useReactivateWarehouseMutation,
  useDeleteWarehouseMutation,
  useSetDefaultWarehouseMutation,
  useCreateRackMutation,
  useGetRacksByWarehouseQuery,
  useLazyGetRacksByWarehouseQuery,
  useGetRackByIdQuery,
  useLazyGetRackByIdQuery,
  useUpdateRackMutation,
  useDeleteRackMutation,
  useToggleRackActiveMutation,
  useCreateHolidayMutation,
  useGetHolidaysByWarehouseQuery,
  useLazyGetHolidaysByWarehouseQuery,
  useUpdateHolidayMutation,
  useDeleteHolidayMutation,
  useReceivePurchaseOrderMutation,
  useAdjustStockMutation,
  useTransferStockMutation,
  useSellDamagedStockMutation,
  useGetWarehouseStockQuery,
  useLazyGetWarehouseStockQuery,
  useGetStockMovementsQuery,
  useLazyGetStockMovementsQuery,
} = warehouseApi;

export default warehouseApi;