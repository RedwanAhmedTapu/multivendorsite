// srcs/vendorWarehouseApi.ts
import { createApi } from "@reduxjs/toolkit/query/react";
import baseQueryWithReauth from "./baseQueryWithReauth";

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

/* ==================== RESPONSE TYPES ==================== */

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

/* ---------- ENUM TYPES ---------- */
export enum WarehouseType {
  PICKUP = "PICKUP",
  DROPOFF = "RETURN",
}

/* ---------- BASE TYPES ---------- */
export interface Vendor {
  id: string;
  name: string;
  email: string;
  phone: string;
  // Add other vendor fields as needed
}

export interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  // Add other location fields as needed
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
}
export interface BulkWarehouseResponse {
  pickupWarehouse: Warehouse;
  returnWarehouse?: Warehouse;
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
  ],

  endpoints: (builder) => ({
    /* ==================== WAREHOUSE ENDPOINTS ==================== */

    // Create warehouse for a vendor
    createWarehouse: builder.mutation<
      ApiResponse<Warehouse>,
      CreateWarehouseRequest
    >({
      query: (data) => ({
        url: `/warehouse/vendors/${data.vendorId}/warehouses`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (result) => [
        { type: "WarehouseList", id: result?.data.vendorId },
        "Warehouse",
      ],
    }),
    // Create or update both pickup and return warehouses
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

    // Get warehouses by vendor with optional filters
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

        return `/warehouse/vendors/${vendorId}/warehouses?${params.toString()}`;
      },
      providesTags: (result, error, { vendorId }) => [
        { type: "WarehouseList", id: vendorId },
        ...(result?.data?.map((warehouse) => ({
          type: "Warehouse" as const,
          id: warehouse.id,
        })) || []),
      ],
    }),

    // Get warehouse by ID
    getWarehouseById: builder.query<
      ApiResponse<Warehouse>,
      { id: string; includeHolidays?: boolean }
    >({
      query: ({ id, includeHolidays = false }) => {
        const params = new URLSearchParams();
        if (includeHolidays) params.append("includeHolidays", "true");

        return `/warehouse/warehouses/${id}?${params.toString()}`;
      },
      providesTags: (result) => [{ type: "Warehouse", id: result?.data.id }],
    }),

    // Update warehouse
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
        { type: "WarehouseList" },
      ],
    }),

    // Delete warehouse
    deleteWarehouse: builder.mutation<ApiResponse<null>, { id: string }>({
      query: ({ id }) => ({
        url: `/warehouse/warehouses/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Warehouse", id },
        { type: "WarehouseList" },
      ],
    }),

    // Set default warehouse
    setDefaultWarehouse: builder.mutation<
      ApiResponse<Warehouse>,
      { id: string }
    >({
      query: ({ id }) => ({
        url: `/warehouse/warehouses/${id}/set-default`,
        method: "PATCH",
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Warehouse", id },
        { type: "WarehouseList" },
      ],
    }),

    /* ==================== HOLIDAY ENDPOINTS ==================== */

    // Create holiday for a warehouse
    createHoliday: builder.mutation<
      ApiResponse<WarehouseHoliday>,
      CreateHolidayRequest
    >({
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

    // Get holidays by warehouse with optional filters
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

        return `/warehouse/warehouses/${warehouseId}/holidays?${params.toString()}`;
      },
      providesTags: (result, error, { warehouseId }) => [
        { type: "WarehouseHolidayList", id: warehouseId },
        ...(result?.data?.map((holiday) => ({
          type: "WarehouseHoliday" as const,
          id: holiday.id,
        })) || []),
      ],
    }),

    // Update holiday
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
        { type: "WarehouseHolidayList" },
      ],
    }),

    // Delete holiday
    deleteHoliday: builder.mutation<ApiResponse<null>, { id: string }>({
      query: ({ id }) => ({
        url: `/warehouse/holidays/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "WarehouseHoliday", id },
        { type: "WarehouseHolidayList" },
      ],
    }),
  }),
});

/* ==================== EXPORT HOOKS ==================== */

export const {
  // Warehouse hooks
  useCreateOrUpdateBulkWarehousesMutation,
  useCreateWarehouseMutation,
  useGetWarehousesByVendorQuery,
  useLazyGetWarehousesByVendorQuery,
  useGetWarehouseByIdQuery,
  useLazyGetWarehouseByIdQuery,
  useUpdateWarehouseMutation,
  useDeleteWarehouseMutation,
  useSetDefaultWarehouseMutation,

  // Holiday hooks
  useCreateHolidayMutation,
  useGetHolidaysByWarehouseQuery,
  useLazyGetHolidaysByWarehouseQuery,
  useUpdateHolidayMutation,
  useDeleteHolidayMutation,
} = warehouseApi;

// Export the API reducer and middleware
export default warehouseApi;
