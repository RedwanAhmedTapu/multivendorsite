// src/redux/employeeApi.ts
//
// Talks to the ORIGINAL employee module (src/routes/employee.routes.ts,
// mounted at /api/employees) — account creation, activate/deactivate,
// and the permission checkboxes. This is intentionally separate from
// hrmApi.ts, which only manages the richer HrEmployeeProfile data
// (branch/department/designation, attendance, leave, payroll...).
//
// Creating a new staff member is a two-step flow in the UI:
//   1) employeeApi.createAdminEmployee / createVendorEmployee — makes the
//      login account (User + Employee + permissions)
//   2) An HrEmployeeProfile is auto-created server-side right after step 1
//      (see the employee.service.ts hook from the HRM module README) —
//      the UI then immediately calls hrmApi.useUpdateEmployeeMutation to
//      fill in branch/department/designation/personal info.

import { createApi } from "@reduxjs/toolkit/query/react";
import baseQueryWithReauth from "./baseQueryWithReauth";
import type { PermissionKey } from "./authApi";

export interface EmployeePermissions {
  productManagement?: boolean;
  orderManagement?: boolean;
  customerSupport?: boolean;
  analytics?: boolean;
  offerManagement?: boolean;
  inventoryManagement?: boolean;
  hrManagement?: boolean;
  /** Marketing Center admin side — admin-only grant. */
  marketingManagement?: boolean;
  /** Admin-only grant: manage vendor POS subscriptions (never vendor POS access). */
  posSubscriptionManagement?: boolean;
  /** Admin-only grant: the Agent Commission admin area. */
  agentManagement?: boolean;
  /** Admin-only grant: theme palette management (Part 3). */
  themeManagement?: boolean;
  /** Vendor-only grant: use this vendor's POS terminal. */
  posAccess?: boolean;
  /** Vendor-only POS action grants. */
  posDiscount?: boolean;
  posCredit?: boolean;
  posRefund?: boolean;
  posReports?: boolean;
  /** Granular HR permissions (P0) — hrManagement umbrella overrides all. */
  hrEmployeeView?: boolean;
  hrEmployeeCreate?: boolean;
  hrEmployeeEdit?: boolean;
  hrEmployeeDelete?: boolean;
  hrSalaryView?: boolean;
  hrSalaryEdit?: boolean;
  hrDocsUpload?: boolean;
  hrDocsVerify?: boolean;
  hrDocsDownload?: boolean;
  hrDocsDelete?: boolean;
  hrBankView?: boolean;
  hrOrgEdit?: boolean;
  hrLeaveTypesEdit?: boolean;
}

export interface Employee {
  id: string;
  // Present only on the response from createAdminEmployee/createVendorEmployee
  // — the auto-created HrEmployeeProfile's id (see the HRM module README's
  // employee.service.ts hook). Use THIS id when opening EmployeeProfileDrawer,
  // not `id` above (that one is for permissions/toggle-status calls).
  hrProfileId?: string;
  designation?: string | null;
  department?: string | null;
  permissions: EmployeePermissions;
  isActive: boolean;
  vendorId?: string | null;
  createdAt: string;
  user: { id: string; name: string | null; email: string | null; phone: string | null; isActive: boolean };
}

export interface CreateEmployeeInput {
  name: string;
  email?: string;
  phone?: string;
  password: string;
  designation?: string;
  department?: string;
  permissions: EmployeePermissions;
}

export interface UpdateEmployeeInput {
  designation?: string;
  department?: string;
  name?: string;
  email?: string;
  phone?: string;
}

export const employeeApi = createApi({
  reducerPath: "employeeApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Employee", "EmployeePermissions", "EmployeeStats"],

  endpoints: (builder) => ({
    // ------- Admin employees -------
    createAdminEmployee: builder.mutation<{ success: boolean; data: Employee }, CreateEmployeeInput>({
      query: (body) => ({ url: "/employees/admin/employees", method: "POST", body }),
      invalidatesTags: ["Employee", "EmployeeStats"],
    }),
    getAdminEmployees: builder.query<{ success: boolean; data: Employee[] }, void>({
      query: () => "/employees/admin/employees",
      providesTags: ["Employee"],
    }),
    updateAdminEmployee: builder.mutation<{ success: boolean; data: Employee }, { employeeId: string; data: UpdateEmployeeInput }>({
      query: ({ employeeId, data }) => ({ url: `/employees/admin/employees/${employeeId}`, method: "PUT", body: data }),
      invalidatesTags: ["Employee"],
    }),
    toggleAdminEmployeeStatus: builder.mutation<{ success: boolean; data: Employee }, string>({
      query: (employeeId) => ({ url: `/employees/admin/employees/${employeeId}/toggle-status`, method: "PATCH" }),
      invalidatesTags: ["Employee", "EmployeeStats"],
    }),
    getAdminEmployeeStats: builder.query<{ success: boolean; data: any }, void>({
      query: () => "/employees/admin/stats",
      providesTags: ["EmployeeStats"],
    }),

    // ------- Vendor employees -------
    createVendorEmployee: builder.mutation<{ success: boolean; data: Employee }, CreateEmployeeInput>({
      query: (body) => ({ url: "/employees/vendor/employees", method: "POST", body }),
      invalidatesTags: ["Employee", "EmployeeStats"],
    }),
    getVendorEmployees: builder.query<{ success: boolean; data: Employee[] }, void>({
      query: () => "/employees/vendor/employees",
      providesTags: ["Employee"],
    }),
    updateVendorEmployee: builder.mutation<{ success: boolean; data: Employee }, { employeeId: string; data: UpdateEmployeeInput }>({
      query: ({ employeeId, data }) => ({ url: `/employees/vendor/employees/${employeeId}`, method: "PUT", body: data }),
      invalidatesTags: ["Employee"],
    }),
    toggleVendorEmployeeStatus: builder.mutation<{ success: boolean; data: Employee }, string>({
      query: (employeeId) => ({ url: `/employees/vendor/employees/${employeeId}/toggle-status`, method: "PATCH" }),
      invalidatesTags: ["Employee", "EmployeeStats"],
    }),
    getVendorEmployeeStats: builder.query<{ success: boolean; data: any }, void>({
      query: () => "/employees/vendor/stats",
      providesTags: ["EmployeeStats"],
    }),

    // ------- Permissions (ADMIN/VENDOR only — see the security fix note) -------
    getEmployeePermissions: builder.query<{ success: boolean; data: EmployeePermissions }, string>({
      query: (employeeId) => `/employees/employees/${employeeId}/permissions`,
      providesTags: ["EmployeePermissions"],
    }),
    updateEmployeePermissions: builder.mutation<
      { success: boolean; data: Employee },
      { employeeId: string; permissions: EmployeePermissions }
    >({
      query: ({ employeeId, permissions }) => ({
        url: `/employees/employees/${employeeId}/permissions`,
        method: "PUT",
        body: { permissions },
      }),
      invalidatesTags: ["Employee", "EmployeePermissions"],
    }),

    // ------- Common -------
    getEmployeeById: builder.query<{ success: boolean; data: Employee }, string>({
      query: (employeeId) => `/employees/employees/${employeeId}`,
      providesTags: ["Employee"],
    }),
  }),
});

export const {
  useCreateAdminEmployeeMutation,
  useGetAdminEmployeesQuery,
  useUpdateAdminEmployeeMutation,
  useToggleAdminEmployeeStatusMutation,
  useGetAdminEmployeeStatsQuery,

  useCreateVendorEmployeeMutation,
  useGetVendorEmployeesQuery,
  useUpdateVendorEmployeeMutation,
  useToggleVendorEmployeeStatusMutation,
  useGetVendorEmployeeStatsQuery,

  useGetEmployeePermissionsQuery,
  useUpdateEmployeePermissionsMutation,

  useGetEmployeeByIdQuery,
} = employeeApi;
