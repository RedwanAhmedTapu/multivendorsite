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
  row?: string;
  shelf?: string;
  isActive?: boolean;
}

export interface UpdateRackRequest {
  code?: string;
  label?: string;
  row?: string;
  shelf?: string;
  isActive?: boolean;
}

export interface RackFilters {
  isActive?: boolean;
  row?: string;
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
  reason?: string;
  notes?: string;
}

export interface StockTransferRequest {
  variantId: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  vendorId: string;
  quantity: number;
  toRackId?: string;
  reason?: string;
  notes?: string;
}

export interface SellDamagedStockRequest {
  variantId: string;
  fromWarehouseId: string;
  vendorId: string;
  quantity: number;
  saleAmount: number;
  coaAccountId?: string;
  reason?: string;
  notes?: string;
}

export interface WarehouseStockFilters {
  warehouseId?: string;
  variantId?: string;
  rackId?: string;
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
  row: string | null;
  shelf: string | null;
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
  createdAt: Date;
  updatedAt: Date;
  vendor: Vendor;
  location: Location;
  holidays?: WarehouseHoliday[];
  racks?: WarehouseRack[];
  warehouseStock?: WarehouseStockSummary[];
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
  row: string | null;
  shelf: string | null;
}

export interface WarehouseStock {
  id: string;
  variantId: string;
  warehouseId: string;
  rackId: string | null;
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
  ],

  endpoints: (builder) => ({
    /* ==================== WAREHOUSE ENDPOINTS ==================== */

    // POST /vendors/:vendorId/warehouses
    createWarehouse: builder.mutation<ApiResponse<Warehouse>, CreateWarehouseRequest>({
      query: (data) => ({
        url: `/warehouse/vendors/${data.vendorId}/warehouses`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (result, error, { vendorId }) => [
        { type: "WarehouseList", id: vendorId },
        "Warehouse",
      ],
    }),

    // POST /vendors/:vendorId/warehouses/bulk
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
      invalidatesTags: (result, error, { vendorId }) => [
        { type: "WarehouseList", id: vendorId },
        "Warehouse",
      ],
    }),

    // GET /vendors/:vendorId/warehouses
    getWarehousesByVendor: builder.query<
      ApiResponse<Warehouse[]>,
      { vendorId: string; filters?: WarehouseFilters }
    >({
      query: ({ vendorId, filters = {} }) => {
        const params = new URLSearchParams();
        if (filters.type) params.append("type", filters.type);
        if (filters.isDefault !== undefined)
          params.append("isDefault", filters.isDefault.toString());
        if (filters.locationId) params.append("locationId", filters.locationId);
        const queryString = params.toString();
        return `/warehouse/vendors/${vendorId}/warehouses${queryString ? `?${queryString}` : ""}`;
      },
      providesTags: (result, error, { vendorId }) => [
        { type: "WarehouseList", id: vendorId },
        ...(result?.data?.map((w) => ({
          type: "Warehouse" as const,
          id: w.id,
        })) || []),
      ],
    }),

    // GET /warehouses/:id
    getWarehouseById: builder.query<
      ApiResponse<Warehouse>,
      { id: string; includeHolidays?: boolean }
    >({
      query: ({ id, includeHolidays = false }) => {
        const params = new URLSearchParams();
        if (includeHolidays) params.append("includeHolidays", "true");
        const queryString = params.toString();
        return `/warehouse/warehouses/${id}${queryString ? `?${queryString}` : ""}`;
      },
      providesTags: (result) => [{ type: "Warehouse", id: result?.data.id }],
    }),

    // PATCH /warehouses/:id
    updateWarehouse: builder.mutation<
      ApiResponse<Warehouse>,
      { id: string; data: UpdateWarehouseRequest }
    >({
      query: ({ id, data }) => ({
        url: `/warehouse/warehouses/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Warehouse", id },
        "WarehouseList",
      ],
    }),

    // DELETE /warehouses/:id
    deleteWarehouse: builder.mutation<ApiResponse<null>, { id: string }>({
      query: ({ id }) => ({
        url: `/warehouse/warehouses/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Warehouse", id },
        "WarehouseList",
        "WarehouseStock",
        "WarehouseRackList",
      ],
    }),

    // PATCH /warehouses/:id/set-default
    setDefaultWarehouse: builder.mutation<ApiResponse<Warehouse>, { id: string }>({
      query: ({ id }) => ({
        url: `/warehouse/warehouses/${id}/set-default`,
        method: "PATCH",
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Warehouse", id },
        "WarehouseList",
      ],
    }),

    /* ==================== RACK ENDPOINTS ==================== */

    // POST /warehouses/:warehouseId/racks
    createRack: builder.mutation<ApiResponse<WarehouseRack>, CreateRackRequest>({
      query: ({ warehouseId, ...body }) => ({
        url: `/warehouse/warehouses/${warehouseId}/racks`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { warehouseId }) => [
        { type: "WarehouseRackList", id: warehouseId },
        { type: "Warehouse", id: warehouseId },
        "WarehouseRack",
      ],
    }),

    // GET /warehouses/:warehouseId/racks
    getRacksByWarehouse: builder.query<
      ApiResponse<WarehouseRack[]>,
      { warehouseId: string; filters?: RackFilters }
    >({
      query: ({ warehouseId, filters = {} }) => {
        const params = new URLSearchParams();
        if (filters.isActive !== undefined)
          params.append("isActive", filters.isActive.toString());
        if (filters.row) params.append("row", filters.row);
        const queryString = params.toString();
        return `/warehouse/warehouses/${warehouseId}/racks${queryString ? `?${queryString}` : ""}`;
      },
      providesTags: (result, error, { warehouseId }) => [
        { type: "WarehouseRackList", id: warehouseId },
        ...(result?.data?.map((r) => ({
          type: "WarehouseRack" as const,
          id: r.id,
        })) || []),
      ],
    }),

    // GET /racks/:id
    getRackById: builder.query<ApiResponse<WarehouseRack>, { id: string }>({
      query: ({ id }) => `/warehouse/racks/${id}`,
      providesTags: (result) => [{ type: "WarehouseRack", id: result?.data.id }],
    }),

    // PATCH /racks/:id
    updateRack: builder.mutation<
      ApiResponse<WarehouseRack>,
      { id: string; data: UpdateRackRequest }
    >({
      query: ({ id, data }) => ({
        url: `/warehouse/racks/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "WarehouseRack", id },
        "WarehouseRackList",
      ],
    }),

    // DELETE /racks/:id
    deleteRack: builder.mutation<ApiResponse<null>, { id: string }>({
      query: ({ id }) => ({
        url: `/warehouse/racks/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "WarehouseRack", id },
        "WarehouseRackList",
        "WarehouseStock",
      ],
    }),

    // PATCH /racks/:id/toggle-active
    toggleRackActive: builder.mutation<ApiResponse<WarehouseRack>, { id: string }>({
      query: ({ id }) => ({
        url: `/warehouse/racks/${id}/toggle-active`,
        method: "PATCH",
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "WarehouseRack", id },
        "WarehouseRackList",
      ],
    }),

    /* ==================== HOLIDAY ENDPOINTS ==================== */

    // POST /warehouses/:warehouseId/holidays
    createHoliday: builder.mutation<ApiResponse<WarehouseHoliday>, CreateHolidayRequest>({
      query: (data) => ({
        url: `/warehouse/warehouses/${data.warehouseId}/holidays`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (result, error, { warehouseId }) => [
        { type: "WarehouseHolidayList", id: warehouseId },
        "WarehouseHoliday",
      ],
    }),

    // GET /warehouses/:warehouseId/holidays
    getHolidaysByWarehouse: builder.query<
      ApiResponse<WarehouseHoliday[]>,
      { warehouseId: string; filters?: HolidayFilters }
    >({
      query: ({ warehouseId, filters = {} }) => {
        const params = new URLSearchParams();
        if (filters.startDate)
          params.append("startDate", filters.startDate.toString());
        if (filters.endDate)
          params.append("endDate", filters.endDate.toString());
        if (filters.isOpen !== undefined)
          params.append("isOpen", filters.isOpen.toString());
        const queryString = params.toString();
        return `/warehouse/warehouses/${warehouseId}/holidays${queryString ? `?${queryString}` : ""}`;
      },
      providesTags: (result, error, { warehouseId }) => [
        { type: "WarehouseHolidayList", id: warehouseId },
        ...(result?.data?.map((h) => ({
          type: "WarehouseHoliday" as const,
          id: h.id,
        })) || []),
      ],
    }),

    // PATCH /holidays/:id
    updateHoliday: builder.mutation<
      ApiResponse<WarehouseHoliday>,
      { id: string; data: UpdateHolidayRequest }
    >({
      query: ({ id, data }) => ({
        url: `/warehouse/holidays/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "WarehouseHoliday", id },
        "WarehouseHolidayList",
      ],
    }),

    // DELETE /holidays/:id
    deleteHoliday: builder.mutation<ApiResponse<null>, { id: string }>({
      query: ({ id }) => ({
        url: `/warehouse/holidays/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "WarehouseHoliday", id },
        "WarehouseHolidayList",
      ],
    }),

    /* ==================== STOCK ENDPOINTS ==================== */

    // POST /warehouses/:warehouseId/stock/receive
    receivePurchaseOrder: builder.mutation<
      ApiResponse<ReceivePurchaseOrderResponse>,
      ReceivePurchaseOrderRequest
    >({
      query: ({ warehouseId, ...body }) => ({
        url: `/warehouse/warehouses/${warehouseId}/stock/receive`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { warehouseId }) => [
        { type: "WarehouseStock", id: warehouseId },
        "StockMovement",
      ],
    }),

    // POST /stock/adjust
    adjustStock: builder.mutation<ApiResponse<StockMovement>, StockAdjustmentRequest>({
      query: (body) => ({
        url: `/warehouse/stock/adjust`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { warehouseId }) => [
        { type: "WarehouseStock", id: warehouseId },
        "StockMovement",
      ],
    }),

    // POST /stock/transfer
    transferStock: builder.mutation<ApiResponse<StockMovement>, StockTransferRequest>({
      query: (body) => ({
        url: `/warehouse/stock/transfer`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { fromWarehouseId, toWarehouseId }) => [
        { type: "WarehouseStock", id: fromWarehouseId },
        { type: "WarehouseStock", id: toWarehouseId },
        "StockMovement",
      ],
    }),

    // POST /stock/sell-damaged
    sellDamagedStock: builder.mutation<ApiResponse<StockMovement>, SellDamagedStockRequest>({
      query: (body) => ({
        url: `/warehouse/stock/sell-damaged`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { fromWarehouseId }) => [
        { type: "WarehouseStock", id: fromWarehouseId },
        "StockMovement",
      ],
    }),

    // GET /stock
    getWarehouseStock: builder.query<
      PaginatedApiResponse<WarehouseStock>,
      WarehouseStockFilters
    >({
      query: (filters = {}) => {
        const params = new URLSearchParams();
        if (filters.warehouseId) params.append("warehouseId", filters.warehouseId);
        if (filters.variantId) params.append("variantId", filters.variantId);
        if (filters.rackId) params.append("rackId", filters.rackId);
        if (filters.lowStockOnly) params.append("lowStockOnly", "true");
        if (filters.outOfStockOnly) params.append("outOfStockOnly", "true");
        if (filters.page) params.append("page", filters.page.toString());
        if (filters.limit) params.append("limit", filters.limit.toString());
        const queryString = params.toString();
        return `/warehouse/stock${queryString ? `?${queryString}` : ""}`;
      },
      providesTags: (result, error, { warehouseId }) => [
        { type: "WarehouseStock", id: warehouseId ?? "ALL" },
        ...(result?.data?.map((s) => ({
          type: "WarehouseStock" as const,
          id: s.id,
        })) || []),
      ],
    }),

    // GET /stock/movements
    getStockMovements: builder.query<
      PaginatedApiResponse<StockMovement>,
      StockMovementFilters
    >({
      query: (filters = {}) => {
        const params = new URLSearchParams();
        if (filters.variantId) params.append("variantId", filters.variantId);
        if (filters.warehouseId) params.append("warehouseId", filters.warehouseId);
        if (filters.movementType) params.append("movementType", filters.movementType);
        if (filters.startDate)
          params.append("startDate", filters.startDate.toString());
        if (filters.endDate)
          params.append("endDate", filters.endDate.toString());
        if (filters.page) params.append("page", filters.page.toString());
        if (filters.limit) params.append("limit", filters.limit.toString());
        const queryString = params.toString();
        return `/warehouse/stock/movements${queryString ? `?${queryString}` : ""}`;
      },
      providesTags: (result) => [
        "StockMovement",
        ...(result?.data?.map((m) => ({
          type: "StockMovement" as const,
          id: m.id,
        })) || []),
      ],
    }),
  }),
});

/* ==================== EXPORT HOOKS ==================== */

export const {
  // Warehouse hooks
  useCreateWarehouseMutation,
  useCreateOrUpdateBulkWarehousesMutation,
  useGetWarehousesByVendorQuery,
  useLazyGetWarehousesByVendorQuery,
  useGetWarehouseByIdQuery,
  useLazyGetWarehouseByIdQuery,
  useUpdateWarehouseMutation,
  useDeleteWarehouseMutation,
  useSetDefaultWarehouseMutation,

  // Rack hooks
  useCreateRackMutation,
  useGetRacksByWarehouseQuery,
  useLazyGetRacksByWarehouseQuery,
  useGetRackByIdQuery,
  useLazyGetRackByIdQuery,
  useUpdateRackMutation,
  useDeleteRackMutation,
  useToggleRackActiveMutation,

  // Holiday hooks
  useCreateHolidayMutation,
  useGetHolidaysByWarehouseQuery,
  useLazyGetHolidaysByWarehouseQuery,
  useUpdateHolidayMutation,
  useDeleteHolidayMutation,

  // Stock hooks
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