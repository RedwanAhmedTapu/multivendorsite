// features/locationApi.ts
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import baseQueryWithReauth from "./baseQueryWithReauth";

// --------- Type Definitions ---------
export type LocationLevel = "DIVISION" | "DISTRICT" | "THANA";

export interface Location {
  id: string;
  name: string;
  name_local?: string;
  level: LocationLevel;
  parent_id?: string;
  external_code?: string;
  is_cod_supported?: boolean;
  is_dg_cod_supported?: boolean;
  is_leaf_node: boolean;
  sort_order?: number;
  created_at: string;
  updated_at: string;
  locations?: Location; // parent
  children?: Location[]; // children
}

export interface LocationTree extends Location {
  children: LocationTree[];
  ancestors?: Location[];
}

// --------- Response Wrapper ---------
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

// --------- Request Types ---------
export interface CreateLocationRequest {
  name: string;
  nameLocal?: string;
  level: LocationLevel;
  parentId?: string;
  externalCode?: string;
  isCodSupported?: boolean;
  isDgCodSupported?: boolean;
  sortOrder?: number;
}

export interface UpdateLocationRequest {
  name?: string;
  nameLocal?: string;
  parentId?: string;
  externalCode?: string;
  isCodSupported?: boolean;
  isDgCodSupported?: boolean;
  sortOrder?: number;
}

export interface BulkUploadResponse {
  success: boolean;
  data: {
    divisions: { created: number; updated: number };
    districts: { created: number; updated: number };
    thanas: { created: number; updated: number };
    errors: Array<{ row: number; message: string }>;
  };
  message: string;
}

// --------- Location API ---------
export const locationApi = createApi({
  reducerPath: "locationApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Location"],
  endpoints: (builder) => ({
    // Get all locations with tree structure
    getAllLocations: builder.query<ApiResponse<LocationTree[]>, void>({
      query: () => "/locations",
      providesTags: ["Location"],
    }),

    // Get location by ID
    getLocationById: builder.query<ApiResponse<LocationTree>, string>({
      query: (id) => `/locations/${id}`,
      providesTags: (result, error, id) => [{ type: "Location", id }],
    }),

    // Get locations by level
    getLocationsByLevel: builder.query<
      ApiResponse<Location[]>,
      { level: LocationLevel; parentId?: string }
    >({
      query: ({ level, parentId }) => {
        const params = new URLSearchParams();
        if (parentId) params.append("parentId", parentId);
        return `/locations/level/${level}?${params.toString()}`;
      },
      providesTags: ["Location"],
    }),

    // Get children of a specific location
    getChildren: builder.query<ApiResponse<Location[]>, string>({
      query: (parentId) => `/locations/children/${parentId}`,
      providesTags: (result, error, parentId) => [
        "Location",
        { type: "Location", id: parentId },
      ],
    }),

    // Get divisions (root level locations)
    getDivisions: builder.query<ApiResponse<Location[]>, void>({
      query: () => "/locations/divisions",
      providesTags: ["Location"],
    }),

    // Get districts (optional division filter)
    getDistricts: builder.query<ApiResponse<Location[]>, string | undefined>({
      query: (divisionId) => {
        if (divisionId) {
          return `/locations/districts?divisionId=${divisionId}`;
        }
        return "/locations/districts";
      },
      providesTags: ["Location"],
    }),

    // Get thanas (optional district filter)
    getThanas: builder.query<ApiResponse<Location[]>, string | undefined>({
      query: (districtId) => {
        if (districtId) {
          return `/locations/thanas?districtId=${districtId}`;
        }
        return "/locations/thanas";
      },
      providesTags: ["Location"],
    }),

    // Search locations
    searchLocations: builder.query<
      ApiResponse<Location[]>,
      { query: string; level?: LocationLevel }
    >({
      query: ({ query, level }) => {
        const params = new URLSearchParams({ q: query });
        if (level) params.append("level", level);
        return `/locations/search?${params.toString()}`;
      },
    }),

    // Get leaf locations
    getLeafLocations: builder.query<
      ApiResponse<Location[]>,
      LocationLevel | undefined
    >({
      query: (level) => {
        const params = new URLSearchParams();
        if (level) params.append("level", level);
        return `/locations/leaf?${params.toString()}`;
      },
      providesTags: ["Location"],
    }),

    // Get COD-supported locations
    getCodLocations: builder.query<
      ApiResponse<Location[]>,
      boolean | undefined
    >({
      query: (includeDgCod = false) => {
        return `/locations/cod?includeDgCod=${includeDgCod}`;
      },
      providesTags: ["Location"],
    }),

    // Create location
    createLocation: builder.mutation<
      ApiResponse<Location>,
      CreateLocationRequest
    >({
      query: (body) => ({
        url: "/locations",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Location"],
    }),

    // Update location
    updateLocation: builder.mutation<
      ApiResponse<Location>,
      { id: string; data: UpdateLocationRequest }
    >({
      query: ({ id, data }) => ({
        url: `/locations/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        "Location",
        { type: "Location", id },
      ],
    }),

    // Delete location
    deleteLocation: builder.mutation<ApiResponse<Location>, string>({
      query: (id) => ({
        url: `/locations/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Location"],
    }),

    // Bulk upload locations
    bulkUploadLocations: builder.mutation<BulkUploadResponse, FormData>({
      query: (formData) => ({
        url: "/locations/bulk-upload",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["Location"],
    }),
  }),
});

// --------- Export Hooks ---------
export const {
  // Queries
  useGetAllLocationsQuery,
  useGetLocationByIdQuery,
  useGetLocationsByLevelQuery,
  useGetChildrenQuery,
  useGetDivisionsQuery,
  useGetDistrictsQuery,
  useGetThanasQuery,
  useSearchLocationsQuery,
  useGetLeafLocationsQuery,
  useGetCodLocationsQuery,

  // Mutations
  useCreateLocationMutation,
  useUpdateLocationMutation,
  useDeleteLocationMutation,
  useBulkUploadLocationsMutation,
} = locationApi;