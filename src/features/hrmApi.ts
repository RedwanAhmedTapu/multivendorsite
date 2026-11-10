// src/redux/hrmApi.ts
import { createApi } from "@reduxjs/toolkit/query/react";
import baseQueryWithReauth from "./baseQueryWithReauth";

// ------- Types -------
export interface HrBranch {
  id: string;
  code: string;
  name: string;
  type: string;
  address?: string | null;
  contact?: string | null;
  operatingHours?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  active: boolean;
  createdAt: string;
}

export interface HrDepartment {
  id: string;
  code: string;
  name: string;
  nameBn?: string | null;
  branchId?: string | null;
  status: string;
  branch?: HrBranch | null;
}

export interface HrDesignation {
  id: string;
  code: string;
  name: string;
  departmentId?: string | null;
  grade?: string | null;
  minSalary?: number | string | null;
  maxSalary?: number | string | null;
  status: string;
  department?: HrDepartment | null;
}

export interface HrEmployeeProfile {
  id: string;
  linkedUserId: string;
  linkedEmployeeId: string;
  linkedVendorId?: string | null;
  code: string;
  fullName: string;
  mobile?: string | null;
  personalEmail?: string | null;
  dob?: string | null;
  gender?: string | null;
  presentAddress?: string | null;
  branchId?: string | null;
  departmentId?: string | null;
  designationId?: string | null;
  employmentType: string;
  status: string;
  joiningDate?: string | null;
  branch?: HrBranch | null;
  department?: HrDepartment | null;
  designation?: HrDesignation | null;
}

// ── Employee 360 (full profile + nested collections) ─────────────────────

export interface HrFamilyMember {
  id: string;
  employeeId: string;
  name: string;
  relationship: string;
  dob?: string | null;
  occupation?: string | null;
  mobile?: string | null;
  dependent: boolean;
}

export interface HrEducationRecord {
  id: string;
  employeeId: string;
  degree: string;
  institution?: string | null;
  major?: string | null;
  passingYear?: string | null;
  result?: string | null;
}

export interface HrPreviousEmployment {
  id: string;
  employeeId: string;
  company: string;
  designation?: string | null;
  department?: string | null;
  joinDate?: string | null;
  leaveDate?: string | null;
  lastSalary?: string | number | null;
  reasonForLeaving?: string | null;
  supervisor?: string | null;
  contact?: string | null;
  notes?: string | null;
}

export interface HrBankAccount {
  id: string;
  employeeId: string;
  holderName?: string | null;
  bank?: string | null;
  branch?: string | null;
  accountNumber?: string | null;
  routingNumber?: string | null;
  accountType?: "SAVINGS" | "CURRENT" | "SALARY" | string;
  mfsProvider?: "BKASH" | "NAGAD" | "ROCKET" | "OTHER" | string | null;
  mfsNumber?: string | null;
  paymentMethod?: "BANK" | "MFS" | "CASH" | "OTHER" | string;
  isPrimary: boolean;
  verified: boolean;
}

export interface HrEmployeeDocument {
  id: string;
  employeeId: string;
  category: string;
  docType: string;
  title: string;
  docNumber?: string | null;
  issueDate?: string | null;
  expiryDate?: string | null;
  status: string;
  fileUrl?: string | null;
  notes?: string | null;
  verified: boolean;
  verifiedAt?: string | null;
  createdAt: string;
}

export interface HrLifecycleRecord {
  id: string;
  employeeId: string;
  oldDesignationId?: string | null;
  newDesignationId?: string | null;
  newBasicSalary?: string | number | null;
  toBranchId?: string | null;
  toDepartmentId?: string | null;
  previousSalary?: string | number | null;
  newSalary?: string | number | null;
  effectiveDate: string;
  reason?: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
}

export interface HrHistoryEvent {
  id: string;
  employeeId: string;
  eventType: string;
  title: string;
  description?: string | null;
  effectiveDate?: string | null;
  amount?: string | number | null;
  createdAt: string;
}

/** The shape GET /hrm/employees/:id returns (service getById includes). */
export interface HrEmployeeProfile360 extends HrEmployeeProfile {
  nameBn?: string | null;
  fatherName?: string | null;
  motherName?: string | null;
  spouseName?: string | null;
  bloodGroup?: string | null;
  maritalStatus?: string | null;
  nationality?: string | null;
  religion?: string | null;
  altMobile?: string | null;
  emergencyName?: string | null;
  emergencyRelation?: string | null;
  emergencyMobile?: string | null;
  permanentAddress?: string | null;
  division?: string | null;
  district?: string | null;
  city?: string | null;
  postCode?: string | null;
  reportingManagerId?: string | null;
  workLocation?: string | null;
  confirmationDate?: string | null;
  probationMonths?: number;
  grade?: string | null;
  photoUrl?: string | null;
  shift?: { id: string; name: string; startTime: string; endTime: string } | null;
  manager?: (Pick<HrEmployeeProfile, "id" | "code" | "fullName"> & { designation?: HrDesignation | null }) | null;
  familyMembers: HrFamilyMember[];
  education: HrEducationRecord[];
  documents: HrEmployeeDocument[];
  bankAccounts: HrBankAccount[];
  previousEmployments: HrPreviousEmployment[];
  promotions: HrLifecycleRecord[];
  transfers: HrLifecycleRecord[];
  salaryRevisions: HrLifecycleRecord[];
  history: HrHistoryEvent[];
  /** Present since the granular-permission work: salary structures are only
   *  included when the viewer holds hrSalaryView; always present as a flag. */
  salaryHidden?: boolean;
  salaryStructures?: Array<{
    id: string;
    effectiveFrom?: string | null;
    effectiveTo?: string | null;
    basic?: string | number | null;
    houseRent?: string | number | null;
    medical?: string | number | null;
    conveyance?: string | number | null;
    otherAllowance?: string | number | null;
    gross?: string | number | null;
    status?: string;
  }>;
}

export interface HrAttendance {
  id: string;
  employeeId: string;
  date: string;
  checkIn?: string | null;
  checkOut?: string | null;
  workingMinutes: number;
  status: string;
}

export interface HrLeaveType {
  id: string;
  code: string;
  name: string;
  paid: boolean;
  defaultDays: number;
  /** Full policy fields (schema-backed) — surfaced by the leave-type
   *  management UI (PHASE C). */
  carryForward?: boolean;
  maxCarryForward?: number;
  encashmentAllowed?: boolean;
  requiresAttachment?: boolean;
  active?: boolean;
}

export interface HrLeaveRequest {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  fromDate: string;
  toDate: string;
  days: number;
  reason?: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" | "WITHDRAWN";
  leaveType?: HrLeaveType;
}

export interface HrLeaveBalance {
  id: string;
  leaveTypeId: string;
  year: number;
  entitled: number;
  used: number;
  pending: number;
  leaveType: HrLeaveType;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface EmployeeListParams {
  page?: number;
  limit?: number;
  search?: string;
  branchId?: string;
  departmentId?: string;
  designationId?: string;
  status?: string;
}

export interface AttendanceListParams {
  page?: number;
  limit?: number;
  employeeId?: string;
  fromDate?: string;
  toDate?: string;
  status?: string;
}

export interface LeaveListParams {
  page?: number;
  limit?: number;
  employeeId?: string;
  status?: string;
  leaveTypeId?: string;
}

// ------- API -------
export const hrmApi = createApi({
  reducerPath: "hrmApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    "HrBranch", "HrDepartment", "HrDesignation", "HrEmployee", "HrAttendance", "HrLeave",
    "HrSalary", "HrPayroll", "HrBonus", "HrDeduction",
    "HrLoan", "HrAdvance", "HrExpense",
    "HrApproval", "HrLetter", "HrResignation", "HrPerformance",
  ],

  endpoints: (builder) => ({
    // ------- Branches -------
    getBranches: builder.query<{ success: boolean; data: HrBranch[] }, void>({
      query: () => "/hrm/branches",
      providesTags: ["HrBranch"],
    }),
    createBranch: builder.mutation<{ success: boolean; data: HrBranch }, Partial<HrBranch>>({
      query: (body) => ({ url: "/hrm/branches", method: "POST", body }),
      invalidatesTags: ["HrBranch"],
    }),
    updateBranch: builder.mutation<
      { success: boolean; data: HrBranch },
      { id: string; data: Partial<HrBranch> }
    >({
      query: ({ id, data }) => ({ url: `/hrm/branches/${id}`, method: "PUT", body: data }),
      invalidatesTags: ["HrBranch"],
    }),
    deleteBranch: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({ url: `/hrm/branches/${id}`, method: "DELETE" }),
      invalidatesTags: ["HrBranch"],
    }),

    // ------- Departments -------
    getDepartments: builder.query<{ success: boolean; data: HrDepartment[] }, { branchId?: string } | void>({
      query: (params) => ({ url: "/hrm/departments", params: params ?? undefined }),
      providesTags: ["HrDepartment"],
    }),
    createDepartment: builder.mutation<{ success: boolean; data: HrDepartment }, Partial<HrDepartment>>({
      query: (body) => ({ url: "/hrm/departments", method: "POST", body }),
      invalidatesTags: ["HrDepartment"],
    }),
    updateDepartment: builder.mutation<
      { success: boolean; data: HrDepartment },
      { id: string; data: Partial<HrDepartment> }
    >({
      query: ({ id, data }) => ({ url: `/hrm/departments/${id}`, method: "PUT", body: data }),
      invalidatesTags: ["HrDepartment"],
    }),
    deleteDepartment: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({ url: `/hrm/departments/${id}`, method: "DELETE" }),
      invalidatesTags: ["HrDepartment"],
    }),

    // ------- Designations -------
    getDesignations: builder.query<
      { success: boolean; data: HrDesignation[] },
      { departmentId?: string } | void
    >({
      query: (params) => ({ url: "/hrm/designations", params: params ?? undefined }),
      providesTags: ["HrDesignation"],
    }),
    createDesignation: builder.mutation<{ success: boolean; data: HrDesignation }, Partial<HrDesignation>>({
      query: (body) => ({ url: "/hrm/designations", method: "POST", body }),
      invalidatesTags: ["HrDesignation"],
    }),
    updateDesignation: builder.mutation<
      { success: boolean; data: HrDesignation },
      { id: string; data: Partial<HrDesignation> }
    >({
      query: ({ id, data }) => ({ url: `/hrm/designations/${id}`, method: "PUT", body: data }),
      invalidatesTags: ["HrDesignation"],
    }),
    deleteDesignation: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({ url: `/hrm/designations/${id}`, method: "DELETE" }),
      invalidatesTags: ["HrDesignation"],
    }),

    // ------- Employees -------
    getEmployees: builder.query<PaginatedResult<HrEmployeeProfile> & { success: boolean }, EmployeeListParams | void>({
      query: (params) => ({ url: "/hrm/employees", params: params ?? undefined }),
      providesTags: ["HrEmployee"],
    }),
    getEmployeeById: builder.query<{ success: boolean; data: HrEmployeeProfile360 }, string>({
      query: (id) => `/hrm/employees/${id}`,
      providesTags: (r, e, id) => [{ type: "HrEmployee", id }],
    }),
    getMyProfile: builder.query<{ success: boolean; data: HrEmployeeProfile }, void>({
      query: () => "/hrm/employees/me",
      providesTags: ["HrEmployee"],
    }),
    updateEmployee: builder.mutation<
      { success: boolean; data: HrEmployeeProfile },
      { id: string; data: Partial<HrEmployeeProfile> }
    >({
      query: ({ id, data }) => ({ url: `/hrm/employees/${id}`, method: "PUT", body: data }),
      invalidatesTags: ["HrEmployee"],
    }),
    deactivateEmployee: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({ url: `/hrm/employees/${id}`, method: "DELETE" }),
      invalidatesTags: ["HrEmployee"],
    }),
    /** Permanent delete — requires the employee's code as typed confirmation;
     *  the server re-verifies it. Fails when transactional records exist. */
    hardDeleteEmployee: builder.mutation<{ success: boolean; message: string }, { id: string; confirm: string }>({
      query: ({ id, confirm }) => ({ url: `/hrm/employees/${id}/hard-delete`, method: "POST", body: { confirm } }),
      invalidatesTags: ["HrEmployee"],
    }),
    /** Idempotent starter master data for the caller's tenant. */
    bootstrapHrDefaults: builder.mutation<{ success: boolean; data: Record<string, number> }, void>({
      query: () => ({ url: "/hrm/bootstrap", method: "POST" }),
      invalidatesTags: ["HrBranch", "HrDepartment", "HrDesignation", "HrLeave"],
    }),
    /** Edit leave-type policy / toggle active (no hard delete for types). */
    updateLeaveType: builder.mutation<
      { success: boolean; data: HrLeaveType },
      { id: string; data: Partial<HrLeaveType> & { active?: boolean } }
    >({
      query: ({ id, data }) => ({ url: `/hrm/leave/types/${id}`, method: "PUT", body: data }),
      invalidatesTags: ["HrLeave"],
    }),

    // ------- Attendance -------
    checkIn: builder.mutation<{ success: boolean; data: HrAttendance }, void>({
      query: () => ({ url: "/hrm/attendance/check-in", method: "POST" }),
      invalidatesTags: ["HrAttendance"],
    }),
    checkOut: builder.mutation<{ success: boolean; data: HrAttendance }, void>({
      query: () => ({ url: "/hrm/attendance/check-out", method: "POST" }),
      invalidatesTags: ["HrAttendance"],
    }),
    markAttendance: builder.mutation<{ success: boolean; data: HrAttendance }, Partial<HrAttendance> & { employeeId: string }>({
      query: (body) => ({ url: "/hrm/attendance/mark", method: "POST", body }),
      invalidatesTags: ["HrAttendance"],
    }),
    getAttendance: builder.query<PaginatedResult<HrAttendance> & { success: boolean }, AttendanceListParams | void>({
      query: (params) => ({ url: "/hrm/attendance", params: params ?? undefined }),
      providesTags: ["HrAttendance"],
    }),

    // ------- Leave -------
    getLeaveTypes: builder.query<{ success: boolean; data: HrLeaveType[] }, void>({
      query: () => "/hrm/leave/types",
      providesTags: ["HrLeave"],
    }),
    createLeaveType: builder.mutation<{ success: boolean; data: HrLeaveType }, Partial<HrLeaveType>>({
      query: (body) => ({ url: "/hrm/leave/types", method: "POST", body }),
      invalidatesTags: ["HrLeave"],
    }),
    applyLeave: builder.mutation<
      { success: boolean; data: HrLeaveRequest },
      Pick<HrLeaveRequest, "leaveTypeId" | "fromDate" | "toDate" | "days" | "reason">
    >({
      query: (body) => ({ url: "/hrm/leave/requests/mine", method: "POST", body }),
      invalidatesTags: ["HrLeave"],
    }),
    getMyLeaveRequests: builder.query<PaginatedResult<HrLeaveRequest> & { success: boolean }, LeaveListParams | void>({
      query: (params) => ({ url: "/hrm/leave/requests/mine", params: params ?? undefined }),
      providesTags: ["HrLeave"],
    }),
    getMyLeaveBalances: builder.query<{ success: boolean; data: HrLeaveBalance[] }, void>({
      query: () => "/hrm/leave/balances/mine",
      providesTags: ["HrLeave"],
    }),
    getAllLeaveRequests: builder.query<PaginatedResult<HrLeaveRequest> & { success: boolean }, LeaveListParams | void>({
      query: (params) => ({ url: "/hrm/leave/requests", params: params ?? undefined }),
      providesTags: ["HrLeave"],
    }),
    actOnLeave: builder.mutation<
      { success: boolean; data: HrLeaveRequest },
      { id: string; status: "APPROVED" | "REJECTED"; comment?: string }
    >({
      query: ({ id, ...body }) => ({ url: `/hrm/leave/requests/${id}/act`, method: "PATCH", body }),
      invalidatesTags: ["HrLeave"],
    }),

    // ------- Salary -------
    assignSalary: builder.mutation<{ success: boolean; data: any }, any>({
      query: (body) => ({ url: "/hrm/salary", method: "POST", body }),
      invalidatesTags: ["HrSalary"],
    }),
    getCurrentSalary: builder.query<{ success: boolean; data: any }, string>({
      query: (employeeId) => `/hrm/salary/${employeeId}/current`,
      providesTags: ["HrSalary"],
    }),
    getSalaryHistory: builder.query<{ success: boolean; data: any[] }, string>({
      query: (employeeId) => `/hrm/salary/${employeeId}/history`,
      providesTags: ["HrSalary"],
    }),

    // ------- Payroll -------
    createPayrollRun: builder.mutation<{ success: boolean; data: any }, { periodMonth: number; periodYear: number }>({
      query: (body) => ({ url: "/hrm/payroll/runs", method: "POST", body }),
      invalidatesTags: ["HrPayroll"],
    }),
    getPayrollRuns: builder.query<{ success: boolean; data: any[] }, void>({
      query: () => "/hrm/payroll/runs",
      providesTags: ["HrPayroll"],
    }),
    getPayrollRunById: builder.query<{ success: boolean; data: any }, string>({
      query: (id) => `/hrm/payroll/runs/${id}`,
      providesTags: ["HrPayroll"],
    }),
    calculatePayrollRun: builder.mutation<{ success: boolean; data: any }, string>({
      query: (id) => ({ url: `/hrm/payroll/runs/${id}/calculate`, method: "POST" }),
      invalidatesTags: ["HrPayroll"],
    }),
    approvePayrollRun: builder.mutation<{ success: boolean; data: any }, string>({
      query: (id) => ({ url: `/hrm/payroll/runs/${id}/approve`, method: "POST" }),
      invalidatesTags: ["HrPayroll"],
    }),
    markPayrollRunPaid: builder.mutation<{ success: boolean; data: any }, string>({
      query: (id) => ({ url: `/hrm/payroll/runs/${id}/mark-paid`, method: "POST" }),
      invalidatesTags: ["HrPayroll", "HrLoan", "HrAdvance"],
    }),

    // ------- Bonus / Deduction -------
    createBonus: builder.mutation<{ success: boolean; data: any }, any>({
      query: (body) => ({ url: "/hrm/bonuses", method: "POST", body }),
      invalidatesTags: ["HrBonus"],
    }),
    getBonuses: builder.query<{ success: boolean; data: any[] }, { employeeId?: string; status?: string } | void>({
      query: (params) => ({ url: "/hrm/bonuses", params: params ?? undefined }),
      providesTags: ["HrBonus"],
    }),
    actOnBonus: builder.mutation<{ success: boolean; data: any }, { id: string; status: "APPROVED" | "REJECTED" }>({
      query: ({ id, ...body }) => ({ url: `/hrm/bonuses/${id}/act`, method: "PATCH", body }),
      invalidatesTags: ["HrBonus"],
    }),
    createDeduction: builder.mutation<{ success: boolean; data: any }, any>({
      query: (body) => ({ url: "/hrm/deductions", method: "POST", body }),
      invalidatesTags: ["HrDeduction"],
    }),
    getDeductions: builder.query<{ success: boolean; data: any[] }, { employeeId?: string; status?: string } | void>({
      query: (params) => ({ url: "/hrm/deductions", params: params ?? undefined }),
      providesTags: ["HrDeduction"],
    }),

    // ------- Loans -------
    applyLoan: builder.mutation<{ success: boolean; data: any }, any>({
      query: (body) => ({ url: "/hrm/loans/apply", method: "POST", body }),
      invalidatesTags: ["HrLoan"],
    }),
    getMyLoans: builder.query<{ success: boolean; data: any[] }, void>({
      query: () => "/hrm/loans/mine",
      providesTags: ["HrLoan"],
    }),
    getLoans: builder.query<{ success: boolean; data: any[] }, { employeeId?: string; status?: string } | void>({
      query: (params) => ({ url: "/hrm/loans", params: params ?? undefined }),
      providesTags: ["HrLoan"],
    }),
    getLoanById: builder.query<{ success: boolean; data: any }, string>({
      query: (id) => `/hrm/loans/${id}`,
      providesTags: ["HrLoan"],
    }),
    actOnLoan: builder.mutation<{ success: boolean; data: any }, { id: string; status: "APPROVED" | "REJECTED" }>({
      query: ({ id, ...body }) => ({ url: `/hrm/loans/${id}/act`, method: "PATCH", body }),
      invalidatesTags: ["HrLoan"],
    }),
    recordLoanPayment: builder.mutation<{ success: boolean; data: any }, { id: string; installmentNo: number; amount: number }>({
      query: ({ id, ...body }) => ({ url: `/hrm/loans/${id}/payments`, method: "POST", body }),
      invalidatesTags: ["HrLoan"],
    }),

    // ------- Advances -------
    applyAdvance: builder.mutation<{ success: boolean; data: any }, any>({
      query: (body) => ({ url: "/hrm/advances/apply", method: "POST", body }),
      invalidatesTags: ["HrAdvance"],
    }),
    getMyAdvances: builder.query<{ success: boolean; data: any[] }, void>({
      query: () => "/hrm/advances/mine",
      providesTags: ["HrAdvance"],
    }),
    getAdvances: builder.query<{ success: boolean; data: any[] }, { employeeId?: string; status?: string } | void>({
      query: (params) => ({ url: "/hrm/advances", params: params ?? undefined }),
      providesTags: ["HrAdvance"],
    }),
    actOnAdvance: builder.mutation<{ success: boolean; data: any }, { id: string; status: "APPROVED" | "REJECTED" }>({
      query: ({ id, ...body }) => ({ url: `/hrm/advances/${id}/act`, method: "PATCH", body }),
      invalidatesTags: ["HrAdvance"],
    }),

    // ------- Expenses -------
    submitExpense: builder.mutation<{ success: boolean; data: any }, any>({
      query: (body) => ({ url: "/hrm/expenses/submit", method: "POST", body }),
      invalidatesTags: ["HrExpense"],
    }),
    getMyExpenses: builder.query<{ success: boolean; data: any[] }, void>({
      query: () => "/hrm/expenses/mine",
      providesTags: ["HrExpense"],
    }),
    getExpenses: builder.query<{ success: boolean; data: any[] }, { employeeId?: string; status?: string } | void>({
      query: (params) => ({ url: "/hrm/expenses", params: params ?? undefined }),
      providesTags: ["HrExpense"],
    }),
    actOnExpense: builder.mutation<{ success: boolean; data: any }, { id: string; status: "APPROVED" | "REJECTED"; approvedAmount?: number }>({
      query: ({ id, ...body }) => ({ url: `/hrm/expenses/${id}/act`, method: "PATCH", body }),
      invalidatesTags: ["HrExpense"],
    }),
    reimburseExpense: builder.mutation<{ success: boolean; data: any }, string>({
      query: (id) => ({ url: `/hrm/expenses/${id}/reimburse`, method: "POST" }),
      invalidatesTags: ["HrExpense"],
    }),

    // ------- Approval workflow -------
    createApprovalWorkflow: builder.mutation<{ success: boolean; data: any }, any>({
      query: (body) => ({ url: "/hrm/approvals/workflows", method: "POST", body }),
      invalidatesTags: ["HrApproval"],
    }),
    getApprovalWorkflows: builder.query<{ success: boolean; data: any[] }, void>({
      query: () => "/hrm/approvals/workflows",
      providesTags: ["HrApproval"],
    }),
    getPendingApprovals: builder.query<{ success: boolean; data: any[] }, { processType?: string } | void>({
      query: (params) => ({ url: "/hrm/approvals/requests", params: params ?? undefined }),
      providesTags: ["HrApproval"],
    }),
    actOnApproval: builder.mutation<{ success: boolean; data: any }, { id: string; action: "APPROVE" | "REJECT" | "SKIP"; comment?: string }>({
      query: ({ id, ...body }) => ({ url: `/hrm/approvals/requests/${id}/act`, method: "PATCH", body }),
      invalidatesTags: ["HrApproval"],
    }),

    // ------- HR Letters -------
    createLetterTemplate: builder.mutation<{ success: boolean; data: any }, any>({
      query: (body) => ({ url: "/hrm/letters/templates", method: "POST", body }),
      invalidatesTags: ["HrLetter"],
    }),
    getLetterTemplates: builder.query<{ success: boolean; data: any[] }, void>({
      query: () => "/hrm/letters/templates",
      providesTags: ["HrLetter"],
    }),
    generateLetter: builder.mutation<{ success: boolean; data: any }, any>({
      query: (body) => ({ url: "/hrm/letters", method: "POST", body }),
      invalidatesTags: ["HrLetter"],
    }),
    getLetters: builder.query<{ success: boolean; data: any[] }, { employeeId?: string; status?: string } | void>({
      query: (params) => ({ url: "/hrm/letters", params: params ?? undefined }),
      providesTags: ["HrLetter"],
    }),
    getMyLetters: builder.query<{ success: boolean; data: any[] }, void>({
      query: () => "/hrm/letters/mine",
      providesTags: ["HrLetter"],
    }),
    approveLetter: builder.mutation<{ success: boolean; data: any }, string>({
      query: (id) => ({ url: `/hrm/letters/${id}/approve`, method: "PATCH" }),
      invalidatesTags: ["HrLetter"],
    }),
    issueLetter: builder.mutation<{ success: boolean; data: any }, string>({
      query: (id) => ({ url: `/hrm/letters/${id}/issue`, method: "PATCH" }),
      invalidatesTags: ["HrLetter"],
    }),

    updateLetterTemplate: builder.mutation<{ success: boolean; data: any }, { id: string; data: any }>({
      query: ({ id, data }) => ({ url: `/hrm/letters/templates/${id}`, method: "PUT", body: data }),
      invalidatesTags: ["HrLetter"],
    }),
    deleteLetterTemplate: builder.mutation<{ success: boolean; message: string }, string>({
      query: (id) => ({ url: `/hrm/letters/templates/${id}`, method: "DELETE" }),
      invalidatesTags: ["HrLetter"],
    }),
    getManageLetterTemplates: builder.query<{ success: boolean; data: any[] }, void>({
      query: () => "/hrm/letters/templates/manage",
      providesTags: ["HrLetter"],
    }),

    // ------- Resignation & Exit -------
    submitResignation: builder.mutation<{ success: boolean; data: any }, any>({
      query: (body) => ({ url: "/hrm/resignations", method: "POST", body }),
      invalidatesTags: ["HrResignation"],
    }),
    withdrawResignation: builder.mutation<{ success: boolean; data: any }, string>({
      query: (id) => ({ url: `/hrm/resignations/${id}/withdraw`, method: "PATCH" }),
      invalidatesTags: ["HrResignation"],
    }),
    getResignations: builder.query<{ success: boolean; data: any[] }, { employeeId?: string; status?: string } | void>({
      query: (params) => ({ url: "/hrm/resignations", params: params ?? undefined }),
      providesTags: ["HrResignation"],
    }),
    getResignationById: builder.query<{ success: boolean; data: any }, string>({
      query: (id) => `/hrm/resignations/${id}`,
      providesTags: ["HrResignation"],
    }),
    actOnResignation: builder.mutation<{ success: boolean; data: any }, { id: string; status: string; actualLwd?: string }>({
      query: ({ id, ...body }) => ({ url: `/hrm/resignations/${id}/act`, method: "PATCH", body }),
      invalidatesTags: ["HrResignation"],
    }),
    updateExitClearance: builder.mutation<{ success: boolean; data: any }, { resignationId: string; checklistJson: any[] }>({
      query: ({ resignationId, checklistJson }) => ({
        url: `/hrm/resignations/${resignationId}/clearance`,
        method: "PATCH",
        body: { checklistJson },
      }),
      invalidatesTags: ["HrResignation"],
    }),
    computeFinalSettlement: builder.mutation<{ success: boolean; data: any }, string>({
      query: (resignationId) => ({ url: `/hrm/resignations/${resignationId}/settlement/compute`, method: "POST" }),
      invalidatesTags: ["HrResignation"],
    }),
    approveFinalSettlement: builder.mutation<{ success: boolean; data: any }, string>({
      query: (resignationId) => ({ url: `/hrm/resignations/${resignationId}/settlement/approve`, method: "PATCH" }),
      invalidatesTags: ["HrResignation"],
    }),
    markSettlementPaid: builder.mutation<{ success: boolean; data: any }, string>({
      query: (resignationId) => ({ url: `/hrm/resignations/${resignationId}/settlement/mark-paid`, method: "PATCH" }),
      invalidatesTags: ["HrResignation", "HrEmployee"],
    }),

    // ------- Performance / KPI -------
    createReviewCycle: builder.mutation<{ success: boolean; data: any }, any>({
      query: (body) => ({ url: "/hrm/performance/cycles", method: "POST", body }),
      invalidatesTags: ["HrPerformance"],
    }),
    getReviewCycles: builder.query<{ success: boolean; data: any[] }, void>({
      query: () => "/hrm/performance/cycles",
      providesTags: ["HrPerformance"],
    }),
    createPerformanceReview: builder.mutation<{ success: boolean; data: any }, any>({
      query: (body) => ({ url: "/hrm/performance/reviews", method: "POST", body }),
      invalidatesTags: ["HrPerformance"],
    }),
    submitPerformanceReview: builder.mutation<{ success: boolean; data: any }, { id: string; ratingsJson: any; overallRating: number; managerComments?: string }>({
      query: ({ id, ...body }) => ({ url: `/hrm/performance/reviews/${id}/submit`, method: "PATCH", body }),
      invalidatesTags: ["HrPerformance"],
    }),
    acknowledgePerformanceReview: builder.mutation<{ success: boolean; data: any }, { id: string; employeeComments: string }>({
      query: ({ id, ...body }) => ({ url: `/hrm/performance/reviews/${id}/acknowledge`, method: "PATCH", body }),
      invalidatesTags: ["HrPerformance"],
    }),
    getMyPerformanceReviews: builder.query<{ success: boolean; data: any[] }, void>({
      query: () => "/hrm/performance/reviews/mine",
      providesTags: ["HrPerformance"],
    }),
    createKpiTemplate: builder.mutation<{ success: boolean; data: any }, any>({
      query: (body) => ({ url: "/hrm/performance/kpi/templates", method: "POST", body }),
      invalidatesTags: ["HrPerformance"],
    }),
    assignKpi: builder.mutation<{ success: boolean; data: any }, any>({
      query: (body) => ({ url: "/hrm/performance/kpi/assignments", method: "POST", body }),
      invalidatesTags: ["HrPerformance"],
    }),
    submitKpiResults: builder.mutation<{ success: boolean; data: any }, { id: string; resultsJson: any[] }>({
      query: ({ id, resultsJson }) => ({
        url: `/hrm/performance/kpi/assignments/${id}/submit`,
        method: "PATCH",
        body: { resultsJson },
      }),
      invalidatesTags: ["HrPerformance"],
    }),
    getMyKpiAssignments: builder.query<{ success: boolean; data: any[] }, void>({
      query: () => "/hrm/performance/kpi/assignments/mine",
      providesTags: ["HrPerformance"],
    }),
  }),
});

// ------- Export hooks -------
export const {
  // Branches
  useGetBranchesQuery,
  useCreateBranchMutation,
  useUpdateBranchMutation,
  useDeleteBranchMutation,

  // Departments
  useGetDepartmentsQuery,
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
  useDeleteDepartmentMutation,

  // Designations
  useGetDesignationsQuery,
  useCreateDesignationMutation,
  useUpdateDesignationMutation,
  useDeleteDesignationMutation,

  // Employees
  useGetEmployeesQuery,
  useGetEmployeeByIdQuery,
  useGetMyProfileQuery,
  useUpdateEmployeeMutation,
  useDeactivateEmployeeMutation,

  // Attendance
  useCheckInMutation,
  useCheckOutMutation,
  useMarkAttendanceMutation,
  useGetAttendanceQuery,

  // Leave
  useGetLeaveTypesQuery,
  useCreateLeaveTypeMutation,
  useApplyLeaveMutation,
  useGetMyLeaveRequestsQuery,
  useGetMyLeaveBalancesQuery,
  useGetAllLeaveRequestsQuery,
  useActOnLeaveMutation,

  // Salary
  useAssignSalaryMutation,
  useGetCurrentSalaryQuery,
  useGetSalaryHistoryQuery,

  // Payroll
  useCreatePayrollRunMutation,
  useGetPayrollRunsQuery,
  useGetPayrollRunByIdQuery,
  useCalculatePayrollRunMutation,
  useApprovePayrollRunMutation,
  useMarkPayrollRunPaidMutation,

  // Bonus / Deduction
  useCreateBonusMutation,
  useGetBonusesQuery,
  useActOnBonusMutation,
  useCreateDeductionMutation,
  useGetDeductionsQuery,

  // Loans
  useApplyLoanMutation,
  useGetMyLoansQuery,
  useGetLoansQuery,
  useGetLoanByIdQuery,
  useActOnLoanMutation,
  useRecordLoanPaymentMutation,

  // Advances
  useApplyAdvanceMutation,
  useGetMyAdvancesQuery,
  useGetAdvancesQuery,
  useActOnAdvanceMutation,

  // Expenses
  useSubmitExpenseMutation,
  useGetMyExpensesQuery,
  useGetExpensesQuery,
  useActOnExpenseMutation,
  useReimburseExpenseMutation,

  // Approval workflow
  useCreateApprovalWorkflowMutation,
  useGetApprovalWorkflowsQuery,
  useGetPendingApprovalsQuery,
  useActOnApprovalMutation,

  // HR Letters
  useCreateLetterTemplateMutation,
  useGetLetterTemplatesQuery,
  useGenerateLetterMutation,
  useGetLettersQuery,
  useGetMyLettersQuery,
  useApproveLetterMutation,
  useIssueLetterMutation,
  useUpdateLetterTemplateMutation,
  useDeleteLetterTemplateMutation,
  useGetManageLetterTemplatesQuery,

  // Resignation & Exit
  useSubmitResignationMutation,
  useWithdrawResignationMutation,
  useGetResignationsQuery,
  useGetResignationByIdQuery,
  useActOnResignationMutation,
  useUpdateExitClearanceMutation,
  useComputeFinalSettlementMutation,
  useApproveFinalSettlementMutation,
  useMarkSettlementPaidMutation,

  // Performance / KPI
  useCreateReviewCycleMutation,
  useGetReviewCyclesQuery,
  useCreatePerformanceReviewMutation,
  useSubmitPerformanceReviewMutation,
  useAcknowledgePerformanceReviewMutation,
  useGetMyPerformanceReviewsQuery,
  useCreateKpiTemplateMutation,
  useAssignKpiMutation,
  useSubmitKpiResultsMutation,
  useGetMyKpiAssignmentsQuery,

  // P0: employee archive/hard-delete, defaults bootstrap, leave-type editing
  useHardDeleteEmployeeMutation,
  useBootstrapHrDefaultsMutation,
  useUpdateLeaveTypeMutation,
} = hrmApi;


// ═══════════════════════════════════════════════════════════════════════════
// Employee 360 — nested section resources + lifecycle + history.
//
// All mutations invalidate the employee's own tag ([{ type: "HrEmployee",
// id }]), which refetches getEmployeeById — that endpoint already returns
// every collection (family/education/documents/bank/previous-employment/
// lifecycle/history) via the backend's PROFILE_360_INCLUDE, so one
// invalidation refreshes the whole 360 page.
// ═══════════════════════════════════════════════════════════════════════════

type SectionList<T> = { success: boolean; data: T[] };
type IdArgs = { employeeId: string };
type SectionArgs = { employeeId: string; sectionId: string };

const sectionInvalidates = (id: string) => [{ type: "HrEmployee" as const, id }];

const employee360Api = hrmApi.injectEndpoints({
  endpoints: (builder) => ({
    // ── Family ──
    getEmployeeFamily: builder.query<SectionList<HrFamilyMember>, IdArgs>({
      query: ({ employeeId }) => `/hrm/employees/${employeeId}/family`,
      providesTags: (r, e, { employeeId }) => sectionInvalidates(employeeId),
    }),
    addEmployeeFamilyMember: builder.mutation<SectionList<HrFamilyMember>, IdArgs & { data: Partial<HrFamilyMember> }>({
      query: ({ employeeId, data }) => ({ url: `/hrm/employees/${employeeId}/family`, method: "POST", body: data }),
      invalidatesTags: (r, e, { employeeId }) => sectionInvalidates(employeeId),
    }),
    updateEmployeeFamilyMember: builder.mutation<SectionList<HrFamilyMember>, SectionArgs & { data: Partial<HrFamilyMember> }>({
      query: ({ employeeId, sectionId, data }) => ({ url: `/hrm/employees/${employeeId}/family/${sectionId}`, method: "PUT", body: data }),
      invalidatesTags: (r, e, { employeeId }) => sectionInvalidates(employeeId),
    }),
    removeEmployeeFamilyMember: builder.mutation<{ success: boolean }, SectionArgs>({
      query: ({ employeeId, sectionId }) => ({ url: `/hrm/employees/${employeeId}/family/${sectionId}`, method: "DELETE" }),
      invalidatesTags: (r, e, { employeeId }) => sectionInvalidates(employeeId),
    }),

    // ── Education ──
    getEmployeeEducation: builder.query<SectionList<HrEducationRecord>, IdArgs>({
      query: ({ employeeId }) => `/hrm/employees/${employeeId}/education`,
      providesTags: (r, e, { employeeId }) => sectionInvalidates(employeeId),
    }),
    addEmployeeEducation: builder.mutation<SectionList<HrEducationRecord>, IdArgs & { data: Partial<HrEducationRecord> }>({
      query: ({ employeeId, data }) => ({ url: `/hrm/employees/${employeeId}/education`, method: "POST", body: data }),
      invalidatesTags: (r, e, { employeeId }) => sectionInvalidates(employeeId),
    }),
    updateEmployeeEducation: builder.mutation<SectionList<HrEducationRecord>, SectionArgs & { data: Partial<HrEducationRecord> }>({
      query: ({ employeeId, sectionId, data }) => ({ url: `/hrm/employees/${employeeId}/education/${sectionId}`, method: "PUT", body: data }),
      invalidatesTags: (r, e, { employeeId }) => sectionInvalidates(employeeId),
    }),
    removeEmployeeEducation: builder.mutation<{ success: boolean }, SectionArgs>({
      query: ({ employeeId, sectionId }) => ({ url: `/hrm/employees/${employeeId}/education/${sectionId}`, method: "DELETE" }),
      invalidatesTags: (r, e, { employeeId }) => sectionInvalidates(employeeId),
    }),

    // ── Previous employment ──
    getEmployeePreviousEmployment: builder.query<SectionList<HrPreviousEmployment>, IdArgs>({
      query: ({ employeeId }) => `/hrm/employees/${employeeId}/previous-employment`,
      providesTags: (r, e, { employeeId }) => sectionInvalidates(employeeId),
    }),
    addEmployeePreviousEmployment: builder.mutation<SectionList<HrPreviousEmployment>, IdArgs & { data: Partial<HrPreviousEmployment> }>({
      query: ({ employeeId, data }) => ({ url: `/hrm/employees/${employeeId}/previous-employment`, method: "POST", body: data }),
      invalidatesTags: (r, e, { employeeId }) => sectionInvalidates(employeeId),
    }),
    updateEmployeePreviousEmployment: builder.mutation<SectionList<HrPreviousEmployment>, SectionArgs & { data: Partial<HrPreviousEmployment> }>({
      query: ({ employeeId, sectionId, data }) => ({ url: `/hrm/employees/${employeeId}/previous-employment/${sectionId}`, method: "PUT", body: data }),
      invalidatesTags: (r, e, { employeeId }) => sectionInvalidates(employeeId),
    }),
    removeEmployeePreviousEmployment: builder.mutation<{ success: boolean }, SectionArgs>({
      query: ({ employeeId, sectionId }) => ({ url: `/hrm/employees/${employeeId}/previous-employment/${sectionId}`, method: "DELETE" }),
      invalidatesTags: (r, e, { employeeId }) => sectionInvalidates(employeeId),
    }),

    // ── Bank / MFS ──
    getEmployeeBankAccounts: builder.query<SectionList<HrBankAccount>, IdArgs>({
      query: ({ employeeId }) => `/hrm/employees/${employeeId}/bank-accounts`,
      providesTags: (r, e, { employeeId }) => sectionInvalidates(employeeId),
    }),
    addEmployeeBankAccount: builder.mutation<SectionList<HrBankAccount>, IdArgs & { data: Partial<HrBankAccount> }>({
      query: ({ employeeId, data }) => ({ url: `/hrm/employees/${employeeId}/bank-accounts`, method: "POST", body: data }),
      invalidatesTags: (r, e, { employeeId }) => sectionInvalidates(employeeId),
    }),
    updateEmployeeBankAccount: builder.mutation<SectionList<HrBankAccount>, SectionArgs & { data: Partial<HrBankAccount> }>({
      query: ({ employeeId, sectionId, data }) => ({ url: `/hrm/employees/${employeeId}/bank-accounts/${sectionId}`, method: "PUT", body: data }),
      invalidatesTags: (r, e, { employeeId }) => sectionInvalidates(employeeId),
    }),
    removeEmployeeBankAccount: builder.mutation<{ success: boolean }, SectionArgs>({
      query: ({ employeeId, sectionId }) => ({ url: `/hrm/employees/${employeeId}/bank-accounts/${sectionId}`, method: "DELETE" }),
      invalidatesTags: (r, e, { employeeId }) => sectionInvalidates(employeeId),
    }),

    // ── Documents (multipart upload) ──
    uploadEmployeeDocument: builder.mutation<{ success: boolean; data: HrEmployeeDocument }, IdArgs & { formData: FormData }>({
      query: ({ employeeId, formData }) => ({ url: `/hrm/employees/${employeeId}/documents`, method: "POST", body: formData }),
      invalidatesTags: (r, e, { employeeId }) => sectionInvalidates(employeeId),
    }),
    updateEmployeeDocument: builder.mutation<SectionList<HrEmployeeDocument>, SectionArgs & { data: Partial<HrEmployeeDocument> }>({
      query: ({ employeeId, sectionId, data }) => ({ url: `/hrm/employees/${employeeId}/documents/${sectionId}`, method: "PUT", body: data }),
      invalidatesTags: (r, e, { employeeId }) => sectionInvalidates(employeeId),
    }),
    verifyEmployeeDocument: builder.mutation<SectionList<HrEmployeeDocument>, SectionArgs>({
      query: ({ employeeId, sectionId }) => ({ url: `/hrm/employees/${employeeId}/documents/${sectionId}/verify`, method: "POST" }),
      invalidatesTags: (r, e, { employeeId }) => sectionInvalidates(employeeId),
    }),
    removeEmployeeDocument: builder.mutation<{ success: boolean }, SectionArgs>({
      query: ({ employeeId, sectionId }) => ({ url: `/hrm/employees/${employeeId}/documents/${sectionId}`, method: "DELETE" }),
      invalidatesTags: (r, e, { employeeId }) => sectionInvalidates(employeeId),
    }),

    // ── Profile photo (multipart) ──
    uploadEmployeePhoto: builder.mutation<{ success: boolean; data: { photoUrl: string } }, IdArgs & { formData: FormData }>({
      query: ({ employeeId, formData }) => ({ url: `/hrm/employees/${employeeId}/photo`, method: "POST", body: formData }),
      invalidatesTags: (r, e, { employeeId }) => sectionInvalidates(employeeId),
    }),

    // ── History timeline ──
    getEmployeeHistory: builder.query<SectionList<HrHistoryEvent>, IdArgs>({
      query: ({ employeeId }) => `/hrm/employees/${employeeId}/history`,
      providesTags: (r, e, { employeeId }) => sectionInvalidates(employeeId),
    }),

    // ── Lifecycle (promotion / transfer / salary revision) ──
    createLifecycleRecord: builder.mutation<
      { success: boolean; data: HrLifecycleRecord },
      { employeeId: string; kind: "promotions" | "transfers" | "salary-revisions"; data: Record<string, unknown> }
    >({
      query: ({ employeeId, kind, data }) => ({ url: `/hrm/employees/${kind}/${employeeId}`, method: "POST", body: data }),
      invalidatesTags: (r, e, { employeeId }) => sectionInvalidates(employeeId),
    }),
    actOnLifecycleRecord: builder.mutation<
      { success: boolean; data: HrLifecycleRecord },
      { employeeId: string; kind: "promotions" | "transfers" | "salary-revisions"; sectionId: string; status: "APPROVED" | "REJECTED" }
    >({
      query: ({ employeeId, kind, sectionId, status }) => ({
        url: `/hrm/employees/${kind}/${employeeId}/${sectionId}/act`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: (r, e, { employeeId }) => sectionInvalidates(employeeId),
    }),
  }),
});

export const {
  // Family
  useGetEmployeeFamilyQuery,
  useAddEmployeeFamilyMemberMutation,
  useUpdateEmployeeFamilyMemberMutation,
  useRemoveEmployeeFamilyMemberMutation,
  // Education
  useGetEmployeeEducationQuery,
  useAddEmployeeEducationMutation,
  useUpdateEmployeeEducationMutation,
  useRemoveEmployeeEducationMutation,
  // Previous employment
  useGetEmployeePreviousEmploymentQuery,
  useAddEmployeePreviousEmploymentMutation,
  useUpdateEmployeePreviousEmploymentMutation,
  useRemoveEmployeePreviousEmploymentMutation,
  // Bank / MFS
  useGetEmployeeBankAccountsQuery,
  useAddEmployeeBankAccountMutation,
  useUpdateEmployeeBankAccountMutation,
  useRemoveEmployeeBankAccountMutation,
  // Documents
  useUploadEmployeeDocumentMutation,
  useUpdateEmployeeDocumentMutation,
  useVerifyEmployeeDocumentMutation,
  useRemoveEmployeeDocumentMutation,
  // Photo
  useUploadEmployeePhotoMutation,
  // History
  useGetEmployeeHistoryQuery,
  // Lifecycle
  useCreateLifecycleRecordMutation,
  useActOnLifecycleRecordMutation,
} = employee360Api;

// ── PHASE C additions ──
const hrmPhaseCApi = hrmApi.injectEndpoints({
  endpoints: (builder) => ({
    /** Management list of leave types (includes deactivated) — hrLeaveTypesEdit. */
    getManageLeaveTypes: builder.query<{ success: boolean; data: HrLeaveType[] }, void>({
      query: () => "/hrm/leave/types/manage",
      providesTags: ["HrLeave"],
    }),
  }),
});

export const { useGetManageLeaveTypesQuery } = hrmPhaseCApi;

// ── PHASE C2: insight aggregates ──
export interface BranchCount { branchId: string | null; count: number }
export interface DesignationCount { designationId: string | null; count: number }
export interface NewJoiners { days: number; cutoff: string; count: number }
export interface LifecycleRow {
  id: string;
  employee: { id: string; code: string; fullName: string; department?: { name: string } | null; designation?: { name: string } | null };
  effectiveDate: string;
  reason?: string | null;
  status: string;
  createdAt: string;
  amount?: number | null;
  toBranchId?: string | null;
  toDepartmentId?: string | null;
  previousSalary?: number | null;
  newSalary?: number | null;
  amountConfidential?: boolean;
}
export interface ManagerRollup { managerId: string; managerName: string | null; managerCode: string | null; reportCount: number }
export interface ShiftOverviewRow {
  id: string; name: string; type: string; startTime: string; endTime: string;
  weeklyOff: string; active: boolean; currentAssignments: number;
  // Shift-rule fields (PHASE F: previously missing from /hrm/insights/shifts,
  // which left the Grace/Break/Min Hrs/OT columns without numbers).
  graceMinutes?: number | null;
  breakMinutes?: number | null;
  minWorkingHours?: number | null;
  otThresholdMinutes?: number | null;
  otMultiplier?: number | null;
  branchId?: string | null;
}
export interface ShiftAssignmentRow {
  id: string;
  shift: { id: string; name: string; startTime: string; endTime: string };
  employee: { id: string; code: string; fullName: string };
  fromDate: string; toDate: string | null;
}

const hrmInsightsApi = hrmApi.injectEndpoints({
  endpoints: (builder) => ({
    getBranchCounts: builder.query<{ success: boolean; data: { items: BranchCount[] } }, void>({
      query: () => "/hrm/insights/branch-counts",
      providesTags: ["HrEmployee"],
    }),
    getDesignationCounts: builder.query<{ success: boolean; data: { items: DesignationCount[] } }, void>({
      query: () => "/hrm/insights/designation-counts",
      providesTags: ["HrEmployee"],
    }),
    getNewJoiners: builder.query<{ success: boolean; data: NewJoiners }, number | void>({
      query: (days) => `/hrm/insights/new-joiners${days ? `?days=${days}` : ""}`,
      providesTags: ["HrEmployee"],
    }),
    getLifecycleRegister: builder.query<
      PaginatedResult<LifecycleRow> & { success: boolean },
      { kind: "promotions" | "transfers" | "salary-revisions"; search?: string; page?: number; limit?: number }
    >({
      query: ({ kind, search, page, limit }) => ({
        url: `/hrm/insights/lifecycle/${kind}`,
        params: { search: search || undefined, page, limit },
      }),
      providesTags: ["HrEmployee"],
    }),
    getReportingStructure: builder.query<{ success: boolean; data: { managers: ManagerRollup[]; unassigned: number } }, void>({
      query: () => "/hrm/insights/reporting-structure",
      providesTags: ["HrEmployee"],
    }),
    getShiftsOverview: builder.query<{ success: boolean; data: { items: ShiftOverviewRow[] } }, void>({
      query: () => "/hrm/insights/shifts",
      providesTags: ["HrEmployee"],
    }),
    getShiftAssignments: builder.query<PaginatedResult<ShiftAssignmentRow> & { success: boolean }, { page?: number; limit?: number } | void>({
      query: (params) => ({ url: "/hrm/insights/shift-assignments", params: params ?? undefined }),
      providesTags: ["HrEmployee"],
    }),
  }),
});

export const {
  useGetBranchCountsQuery,
  useGetDesignationCountsQuery,
  useGetNewJoinersQuery,
  useGetLifecycleRegisterQuery,
  useGetReportingStructureQuery,
  useGetShiftsOverviewQuery,
  useGetShiftAssignmentsQuery,
} = hrmInsightsApi;

// ── PHASE F: shift CRUD mutations ──
// DELETE returns either { deleted: true } (no assignments — row gone) or
// { deleted: false, deactivated: true, message: "… (N assignment(s) exist …)" }
// (row stays, renders Inactive with an Activate action).
const hrmShiftApi = hrmApi.injectEndpoints({
  endpoints: (builder) => ({
    createShift: builder.mutation<{ success: boolean; data: ShiftOverviewRow }, Record<string, unknown>>({
      query: (body) => ({ url: "/hrm/attendance/shifts", method: "POST", body }),
      invalidatesTags: ["HrEmployee"],
    }),
    updateShift: builder.mutation<{ success: boolean; data: ShiftOverviewRow }, { id: string; data: Record<string, unknown> }>({
      query: ({ id, data }) => ({ url: `/hrm/attendance/shifts/${id}`, method: "PUT", body: data }),
      invalidatesTags: ["HrEmployee"],
    }),
    deleteShift: builder.mutation<
      { success: boolean; deleted: boolean; deactivated?: boolean; message?: string },
      string
    >({
      query: (id) => ({ url: `/hrm/attendance/shifts/${id}`, method: "DELETE" }),
      invalidatesTags: ["HrEmployee"],
    }),
  }),
});

export const { useCreateShiftMutation, useUpdateShiftMutation, useDeleteShiftMutation } = hrmShiftApi;


// == PHASE D2: reports / analytics / audit hooks =========================
export interface EmployeeReportRow {
  id: string; code: string; fullName: string; mobile?: string | null;
  employmentType?: string; status?: string; joiningDate?: string | null;
  department?: { name: string } | null; branch?: { name: string } | null;
  designation?: { name: string } | null;
  nameBn?: string | null; fatherName?: string | null; motherName?: string | null;
  spouseName?: string | null; dob?: string | null; gender?: string | null;
  bloodGroup?: string | null; maritalStatus?: string | null;
  nationality?: string | null; religion?: string | null;
  presentAddress?: string | null; permanentAddress?: string | null;
  emergencyName?: string | null; emergencyRelation?: string | null;
  emergencyMobile?: string | null; altMobile?: string | null;
  personalEmail?: string | null;
}
export interface AttendanceReportRow {
  id: string; date: string; status: string; checkIn?: string | null;
  checkOut?: string | null; workingMinutes?: number;
  employee: { id: string; code: string; fullName: string };
}
export interface LeaveReportRow {
  id: string; fromDate: string; toDate: string; days: number; status: string;
  employee: { id: string; code: string; fullName: string };
  leaveType: { id: string; name: string; paid: boolean } | null;
}
export interface LeaveBalanceReportRow {
  id: string; year: number; entitled: number; used: number; pending: number;
  carriedForward: number;
  employee: { id: string; code: string; fullName: string };
  leaveType: { id: string; name: string } | null;
}
export interface DepartmentCount { departmentId: string | null; count: number }
export interface TrendPoint { date: string; present: number }
export interface AuditRow {
  id: string; action: string; entity: string; entityId: string;
  user: { name: string | null; email: string | null } | null;
  userId?: string | null; createdAt: string;
}

const hrmReportsApi = hrmApi.injectEndpoints({
  endpoints: (builder) => ({
    getEmployeeReport: builder.query<
      PaginatedResult<EmployeeReportRow> & { success: boolean },
      Record<string, unknown>
    >({ query: (params) => ({ url: "/hrm/insights/reports/employees", params }) }),
    getAttendanceReport: builder.query<
      PaginatedResult<AttendanceReportRow> & { success: boolean },
      Record<string, unknown>
    >({ query: (params) => ({ url: "/hrm/insights/reports/attendance", params }) }),
    getLeaveReport: builder.query<
      PaginatedResult<LeaveReportRow> & { success: boolean },
      Record<string, unknown>
    >({ query: (params) => ({ url: "/hrm/insights/reports/leave", params }) }),
    getLeaveBalancesReport: builder.query<
      PaginatedResult<LeaveBalanceReportRow> & { success: boolean },
      Record<string, unknown>
    >({ query: (params) => ({ url: "/hrm/insights/reports/leave-balances", params }) }),
    getDepartmentCounts: builder.query<{ success: boolean; data: { items: DepartmentCount[] } }, void>({
      query: () => "/hrm/insights/department-counts",
      providesTags: ["HrEmployee"],
    }),
    getAttendanceTrend: builder.query<{ success: boolean; data: { days: number; items: TrendPoint[] } }, number | void>({
      query: (days) => ({ url: "/hrm/insights/attendance-trend", params: days ? { days } : undefined }),
      providesTags: ["HrEmployee"],
    }),
    /** PLATFORM resource (AuditLog has no tenant column) - ADMIN only. */
    getAuditLog: builder.query<PaginatedResult<AuditRow> & { success: boolean }, { page?: number; limit?: number } | void>({
      query: (params) => ({ url: "/hrm/insights/audit", params: params ?? undefined }),
    }),
  }),
});

export const {
  useGetEmployeeReportQuery,
  useGetAttendanceReportQuery,
  useGetLeaveReportQuery,
  useGetLeaveBalancesReportQuery,
  useGetDepartmentCountsQuery,
  useGetAttendanceTrendQuery,
  useGetAuditLogQuery,
} = hrmReportsApi;

// == PHASE D3: HR Calendar ==============================================
// (Letter hooks are in the ORIGINAL hrmApi block above - they already work.)
export interface CalendarEvent { date: string; type: string; title: string; employeeId?: string | null }
export interface HrLetterTemplate { id: string; type: string; name: string; subject: string; body: string; requiresApproval: boolean; active?: boolean }

const hrmD3Api = hrmApi.injectEndpoints({
  endpoints: (builder) => ({
    getCalendar: builder.query<{ success: boolean; items: CalendarEvent[] }, { from: string; to: string } | void>({
      query: (params) => ({ url: "/hrm/insights/calendar", params: params ?? undefined }),
      providesTags: ["HrEmployee"],
    }),
  }),
});

export const { useGetCalendarQuery } = hrmD3Api;
// ── PHASE AT1: attendance corrections hook ──
// ── Geo-fence simulator (management-side evaluation; no attendance write) ──
export interface GeoSimulateInput {
  employeeId: string;
  mode: "CHECK_IN" | "CHECK_OUT";
  latitude: number;
  longitude: number;
  accuracy?: number;
}
export interface GeoSimulateResult {
  allowed: boolean;
  distanceMeters: number | null;
  radiusMeters: number | null;
  branchName: string | null;
  message: string;
}

const hrmCorrectionsApi = hrmApi.injectEndpoints({
  endpoints: (builder) => ({
    getAttendanceCorrections: builder.query<
      PaginatedResult<{ id: string; employeeId: string; date: string; requestedIn: string | null; requestedOut: string | null; reason: string; status: string; createdAt: string }> & { success: boolean },
      { status?: string; employeeId?: string; page?: number; limit?: number } | void
    >({
      query: (params) => ({ url: "/hrm/attendance/corrections", params: params ?? undefined }),
      providesTags: ["HrAttendance"],
    }),
    geoSimulate: builder.mutation<{ success: boolean; data: GeoSimulateResult }, GeoSimulateInput>({
      query: (body) => ({ url: "/hrm/attendance/geo-simulate", method: "POST", body }),
    }),
  }),
});

export const { useGetAttendanceCorrectionsQuery, useGeoSimulateMutation } = hrmCorrectionsApi;
