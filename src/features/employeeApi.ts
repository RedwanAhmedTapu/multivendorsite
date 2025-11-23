// features/employeeApi.ts
import { createApi } from "@reduxjs/toolkit/query/react";
import baseQueryWithReauth from "./baseQueryWithReauth";

// =============================
// REQUEST TYPES
// =============================

export interface CreateEmployeeRequest {
  name: string;
  email: string;
  phone?: string;
  password: string;
  designation: string;
  department: string;
  permissions: {
    productManagement?: boolean;
    orderManagement?: boolean;
    customerSupport?: boolean;
    analytics?: boolean;
    offerManagement?: boolean;
    inventoryManagement?: boolean;
  };
}

export interface UpdateEmployeeRequest {
  name?: string;
  email?: string;
  phone?: string;
  designation?: string;
  department?: string;
  permissions?: {
    productManagement?: boolean;
    orderManagement?: boolean;
    customerSupport?: boolean;
    analytics?: boolean;
    offerManagement?: boolean;
    inventoryManagement?: boolean;
  };
  isActive?: boolean;
}

export interface EmployeeFilters {
  search?: string;
  department?: string;
  designation?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface UpdatePermissionsRequest {
  permissions: {
    productManagement?: boolean;
    orderManagement?: boolean;
    customerSupport?: boolean;
    analytics?: boolean;
    offerManagement?: boolean;
    inventoryManagement?: boolean;
  };
}

// =============================
// RESPONSE TYPES
// =============================

export interface Employee {
  id: string;
  designation: string;
  department: string;
  permissions: any;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    isActive: boolean;
  };
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
  vendor?: {
    id: string;
    storeName: string;
  };
}

export interface EmployeeStats {
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
  byDepartment: Record<string, number>;
  byDesignation: Record<string, number>;
}

export interface ToggleStatusResponse {
  message: string;
  isActive: boolean;
}

export interface PermissionsResponse {
  id: string;
  permissions: any;
  user?: {
    name: string;
    email: string;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Array<{ field: string; message: string }>;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// =============================
// EMPLOYEE API
// =============================

export const employeeApi = createApi({
  reducerPath: "employeeApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Employee", "VendorEmployee", "EmployeeStats", "Permissions"],
  endpoints: (builder) => ({
    // =============================
    // ADMIN ENDPOINTS
    // =============================
    
    createAdminEmployee: builder.mutation<ApiResponse<Employee>, CreateEmployeeRequest>({
      query: (body) => ({
        url: "/employees/admin/employees",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Employee", "EmployeeStats"],
    }),

    getAdminEmployees: builder.query<PaginatedResponse<Employee>, EmployeeFilters>({
      query: (params) => ({
        url: "/employees/admin/employees",
        method: "GET",
        params,
      }),
      providesTags: ["Employee"],
    }),

    updateAdminEmployee: builder.mutation<
      ApiResponse<Employee>,
      { employeeId: string; data: UpdateEmployeeRequest }
    >({
      query: ({ employeeId, data }) => ({
        url: `/employees/admin/employees/${employeeId}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Employee", "EmployeeStats"],
    }),

    toggleAdminEmployeeStatus: builder.mutation<
      ApiResponse<ToggleStatusResponse>,
      string
    >({
      query: (employeeId) => ({
        url: `/employees/admin/employees/${employeeId}/toggle-status`,
        method: "PATCH",
      }),
      invalidatesTags: ["Employee", "EmployeeStats"],
    }),

    // =============================
    // VENDOR ENDPOINTS
    // =============================

    createVendorEmployee: builder.mutation<ApiResponse<Employee>, CreateEmployeeRequest>({
      query: (body) => ({
        url: "/employees/vendor/employees",
        method: "POST",
        body,
      }),
      invalidatesTags: ["VendorEmployee", "EmployeeStats"],
    }),

    getVendorEmployees: builder.query<PaginatedResponse<Employee>, EmployeeFilters>({
      query: (params) => ({
        url: "/employees/vendor/employees",
        method: "GET",
        params,
      }),
      providesTags: ["VendorEmployee"],
    }),

    updateVendorEmployee: builder.mutation<
      ApiResponse<Employee>,
      { employeeId: string; data: UpdateEmployeeRequest }
    >({
      query: ({ employeeId, data }) => ({
        url: `/employees/vendor/employees/${employeeId}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["VendorEmployee", "EmployeeStats"],
    }),

    toggleVendorEmployeeStatus: builder.mutation<
      ApiResponse<ToggleStatusResponse>,
      string
    >({
      query: (employeeId) => ({
        url: `/employees/vendor/employees/${employeeId}/toggle-status`,
        method: "PATCH",
      }),
      invalidatesTags: ["VendorEmployee", "EmployeeStats"],
    }),

    // =============================
    // EMPLOYEE PERMISSION ENDPOINTS
    // =============================

    updateEmployeePermissions: builder.mutation<
      ApiResponse<Employee>,
      { employeeId: string; data: UpdatePermissionsRequest }
    >({
      query: ({ employeeId, data }) => ({
        url: `/employees/employees/${employeeId}/permissions`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Employee", "VendorEmployee", "Permissions"],
    }),

    getEmployeePermissions: builder.query<
      ApiResponse<PermissionsResponse>,
      string
    >({
      query: (employeeId) => ({
        url: `/employees/employees/${employeeId}/permissions`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "Permissions", id }],
    }),

    // =============================
    // EMPLOYEE STATISTICS ENDPOINTS
    // =============================

    getAdminEmployeeStats: builder.query<ApiResponse<EmployeeStats>, void>({
      query: () => ({
        url: "/employees/admin/stats",
        method: "GET",
      }),
      providesTags: ["EmployeeStats"],
    }),

    getVendorEmployeeStats: builder.query<ApiResponse<EmployeeStats>, void>({
      query: () => ({
        url: "/employees/vendor/stats",
        method: "GET",
      }),
      providesTags: ["EmployeeStats"],
    }),

    // =============================
    // COMMON ENDPOINTS
    // =============================

    getEmployeeById: builder.query<ApiResponse<Employee>, string>({
      query: (employeeId) => ({
        url: `/employees/employees/${employeeId}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "Employee", id }],
    }),

    // =============================
    // EMPLOYEE SELF-SERVICE ENDPOINTS
    // =============================

    getMyProfile: builder.query<ApiResponse<Employee>, void>({
      query: () => ({
        url: "/employees/me/profile",
        method: "GET",
      }),
      providesTags: ["Employee"],
    }),

    updateMyProfile: builder.mutation<
      ApiResponse<Employee>,
      { name?: string; phone?: string }
    >({
      query: (data) => ({
        url: "/employees/me/profile",
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Employee"],
    }),

    changeMyPassword: builder.mutation<
      ApiResponse<{ message: string }>,
      { currentPassword: string; newPassword: string }
    >({
      query: (data) => ({
        url: "/employees/me/change-password",
        method: "PATCH",
        body: data,
      }),
    }),

    // =============================
    // BULK OPERATIONS
    // =============================

    bulkToggleEmployeeStatus: builder.mutation<
      ApiResponse<{ updated: number; failed: string[] }>,
      { employeeIds: string[]; activate: boolean }
    >({
      query: (body) => ({
        url: "/employees/admin/employees/bulk-toggle-status",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Employee", "VendorEmployee", "EmployeeStats"],
    }),

    bulkUpdatePermissions: builder.mutation<
      ApiResponse<{ updated: number; failed: string[] }>,
      { employeeIds: string[]; permissions: any }
    >({
      query: (body) => ({
        url: "/employees/admin/employees/bulk-permissions",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Employee", "VendorEmployee", "Permissions"],
    }),

    // =============================
    // SEARCH AND FILTER ENDPOINTS
    // =============================

    searchEmployees: builder.query<
      ApiResponse<Employee[]>,
      { query: string; limit?: number }
    >({
      query: ({ query, limit = 10 }) => ({
        url: "/employees/search",
        method: "GET",
        params: { query, limit },
      }),
    }),

    getDepartments: builder.query<ApiResponse<string[]>, void>({
      query: () => ({
        url: "/employees/departments",
        method: "GET",
      }),
    }),

    getDesignations: builder.query<ApiResponse<string[]>, void>({
      query: () => ({
        url: "/employees/designations",
        method: "GET",
      }),
    }),
  }),
});

// =============================
// EXPORT HOOKS
// =============================

export const {
  // Admin endpoints
  useCreateAdminEmployeeMutation,
  useGetAdminEmployeesQuery,
  useUpdateAdminEmployeeMutation,
  useToggleAdminEmployeeStatusMutation,

  // Vendor endpoints
  useCreateVendorEmployeeMutation,
  useGetVendorEmployeesQuery,
  useUpdateVendorEmployeeMutation,
  useToggleVendorEmployeeStatusMutation,

  // Permission endpoints
  useUpdateEmployeePermissionsMutation,
  useGetEmployeePermissionsQuery,

  // Statistics endpoints
  useGetAdminEmployeeStatsQuery,
  useGetVendorEmployeeStatsQuery,

  // Common endpoints
  useGetEmployeeByIdQuery,

  // Employee self-service
  useGetMyProfileQuery,
  useUpdateMyProfileMutation,
  useChangeMyPasswordMutation,

  // Bulk operations
  useBulkToggleEmployeeStatusMutation,
  useBulkUpdatePermissionsMutation,

  // Search and filter
  useSearchEmployeesQuery,
  useGetDepartmentsQuery,
  useGetDesignationsQuery,
} = employeeApi;