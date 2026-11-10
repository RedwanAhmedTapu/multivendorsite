// src/components/hrm/HrmReports.tsx
//
// HR Reports (PHASE D2): category list on the left (real reports + honest
// "not available yet" entries), filter bar, result table, row-count chip,
// Export CSV (formula-guarded, exports exactly what is on screen) and
// Print (scoped @media print rules in the /hrm layout).
//
// Every report query is server-side, tenant-scoped and paginated.

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Download, Printer, Search, ChevronLeft, ChevronRight } from "lucide-react";
import {
  useGetEmployeeReportQuery,
  useGetAttendanceReportQuery,
  useGetLeaveReportQuery,
  useGetLeaveBalancesReportQuery,
  useGetBranchesQuery,
  useGetDepartmentsQuery,
} from "@/features/hrmApi";
import { usePermissions } from "@/hooks/usePermissions";
import { toArray } from "./hrm-utils";

type Row = Record<string, any>;

interface ReportDef {
  id: string;
  group: string;
  label: string;
  /** Which fetcher + columns this report uses. Omitted = not available yet. */
  real?: {
    columns: Array<{ key: string; label: string; get?: (r: Row) => React.ReactNode }>;
    /** /hrm/insights/reports/... */
    endpoint: "employees" | "attendance" | "leave" | "leave-balances";
    filters: Array<"status" | "branch" | "department" | "search" | "dates" | "view" | "year">;
    baseParams?: Record<string, unknown>;
  };
}

const REPORTS: ReportDef[] = [
  // ── Employees ──
  { id: "register", group: "Employees", label: "Employee Register", real: {
    endpoint: "employees",
    filters: ["status", "branch", "department", "search"],
    columns: [
      { key: "code", label: "Code" },
      { key: "fullName", label: "Name" },
      { key: "department", label: "Department", get: (r) => r.department?.name ?? "—" },
      { key: "branch", label: "Branch", get: (r) => r.branch?.name ?? "—" },
      { key: "designation", label: "Designation", get: (r) => r.designation?.name ?? "—" },
      { key: "employmentType", label: "Type" },
      { key: "status", label: "Status" },
      { key: "joiningDate", label: "Joined" },
      { key: "mobile", label: "Mobile" },
    ],
  } },
  { id: "biodata", group: "Employees", label: "Biodata", real: {
    endpoint: "employees",
    filters: ["branch", "department", "search"],
    baseParams: { view: "biodata" },
    columns: [
      { key: "code", label: "Code" },
      { key: "fullName", label: "Name" },
      { key: "dob", label: "Date of birth" },
      { key: "gender", label: "Gender" },
      { key: "bloodGroup", label: "Blood" },
      { key: "maritalStatus", label: "Marital status" },
      { key: "fatherName", label: "Father" },
      { key: "motherName", label: "Mother" },
      { key: "emergencyMobile", label: "Emergency" },
    ],
  } },
  { id: "contacts", group: "Employees", label: "Contact Directory", real: {
    endpoint: "employees",
    filters: ["branch", "department", "search"],
    baseParams: { view: "contacts" },
    columns: [
      { key: "fullName", label: "Name" },
      { key: "mobile", label: "Mobile" },
      { key: "altMobile", label: "Alt mobile" },
      { key: "personalEmail", label: "Email" },
      { key: "emergencyName", label: "Emergency contact", get: (r) => r.emergencyName ? `${r.emergencyName} (${r.emergencyRelation ?? "—"})` : "—" },
      { key: "emergencyMobile", label: "Emergency mobile" },
    ],
  } },
  { id: "joiners", group: "Employees", label: "New Joiners (30d)", real: {
    endpoint: "employees",
    filters: [],
    baseParams: { joiningFrom: new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10) },
    columns: [
      { key: "code", label: "Code" },
      { key: "fullName", label: "Name" },
      { key: "designation", label: "Designation", get: (r) => r.designation?.name ?? "—" },
      { key: "branch", label: "Branch", get: (r) => r.branch?.name ?? "—" },
      { key: "joiningDate", label: "Joined" },
    ],
  } },
  { id: "exits", group: "Employees", label: "Exits", real: {
    endpoint: "employees",
    filters: ["branch", "department", "search"],
    baseParams: { statuses: "RESIGNED,TERMINATED,RETIRED,INACTIVE" },
    columns: [
      { key: "code", label: "Code" },
      { key: "fullName", label: "Name" },
      { key: "status", label: "Status" },
      { key: "branch", label: "Branch", get: (r) => r.branch?.name ?? "—" },
      { key: "joiningDate", label: "Joined" },
    ],
  } },
  { id: "lifecycle", group: "Employees", label: "Lifecycle History", real: {
    endpoint: "employees", // special-cased below → links to the lifecycle register
    filters: [],
    columns: [],
  } },

  // ── Attendance ──
  { id: "attendance", group: "Attendance", label: "Attendance Register", real: {
    endpoint: "attendance",
    filters: ["dates", "status"],
    columns: [
      { key: "date", label: "Date" },
      { key: "employee", label: "Employee", get: (r) => r.employee?.fullName ?? r.employeeId },
      { key: "status", label: "Status" },
      { key: "checkIn", label: "In" },
      { key: "checkOut", label: "Out" },
      { key: "workingMinutes", label: "Minutes" },
    ],
  } },
  { id: "late", group: "Attendance", label: "Late Arrivals", real: {
    endpoint: "attendance",
    filters: ["dates", "search"],
    baseParams: { status: "LATE" },
    columns: [
      { key: "date", label: "Date" },
      { key: "employee", label: "Employee", get: (r) => r.employee?.fullName ?? r.employeeId },
      { key: "checkIn", label: "In" },
      { key: "workingMinutes", label: "Minutes" },
    ],
  } },
  { id: "absence", group: "Attendance", label: "Absence", real: {
    endpoint: "attendance",
    filters: ["dates"],
    baseParams: { status: "ABSENT" },
    columns: [
      { key: "date", label: "Date" },
      { key: "employee", label: "Employee", get: (r) => r.employee?.fullName ?? r.employeeId },
    ],
  } },
  { id: "hours", group: "Attendance", label: "Working Hours", real: {
    endpoint: "attendance",
    filters: ["dates"],
    columns: [
      { key: "date", label: "Date" },
      { key: "employee", label: "Employee", get: (r) => r.employee?.fullName ?? r.employeeId },
      { key: "checkIn", label: "In" },
      { key: "checkOut", label: "Out" },
      { key: "workingMinutes", label: "Minutes" },
    ],
  } },
  { id: "overtime", group: "Attendance", label: "Overtime" },

  // ── Leave ──
  { id: "leave", group: "Leave", label: "Leave Register", real: {
    endpoint: "leave",
    filters: ["dates", "status"],
    columns: [
      { key: "employee", label: "Employee", get: (r) => r.employee?.fullName ?? r.employeeId },
      { key: "leaveType", label: "Type", get: (r) => r.leaveType?.name ?? "—" },
      { key: "fromDate", label: "From" },
      { key: "toDate", label: "To" },
      { key: "days", label: "Days" },
      { key: "status", label: "Status" },
    ],
  } },
  { id: "balances", group: "Leave", label: "Leave Balances", real: {
    endpoint: "leave-balances",
    filters: ["year"],
    columns: [
      { key: "employee", label: "Employee", get: (r) => r.employee?.fullName ?? r.employeeId },
      { key: "leaveType", label: "Type", get: (r) => r.leaveType?.name ?? "—" },
      { key: "year", label: "Year" },
      { key: "entitled", label: "Entitled" },
      { key: "used", label: "Used" },
      { key: "pending", label: "Pending" },
      { key: "carriedForward", label: "Carried in" },
    ],
  } },
  { id: "leave-utilization", group: "Leave", label: "Leave Utilization" },
  { id: "leave-department", group: "Leave", label: "Department Leave" },

  // ── Payroll ──
  { id: "payroll-register", group: "Payroll", label: "Payroll Register", real: {
    endpoint: "employees", // special-cased below → links to /hrm/payroll
    filters: [],
    columns: [],
  } },
  { id: "payslips", group: "Payroll", label: "Payslips" },
  { id: "deductions", group: "Payroll", label: "Deductions" },

  // ── Performance ──
  { id: "reviews", group: "Performance", label: "Performance Reviews" },
  { id: "kpi", group: "Performance", label: "KPI Achievement" },
];

const GROUPS = Array.from(new Set(REPORTS.map((r) => r.group)));

export function HrmReports() {
  const { can } = usePermissions();
  const [reportId, setReportId] = useState("register");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [branchId, setBranchId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [page, setPage] = useState(1);

  const report = REPORTS.find((r) => r.id === reportId)!;
  const real = report.real;

  const { data: branches } = useGetBranchesQuery();
  const { data: departments } = useGetDepartmentsQuery();

  // Build params for the selected report.
  const params: Record<string, unknown> = { page, limit: 50, ...(real?.baseParams ?? {}) };
  if (real?.filters.includes("status") && status) params.status = status;
  if (real?.filters.includes("branch") && branchId) params.branchId = branchId;
  if (real?.filters.includes("department") && departmentId) params.departmentId = departmentId;
  if (real?.filters.includes("search") && search) params.search = search;
  if (real?.filters.includes("dates")) {
    if (fromDate) params.fromDate = fromDate;
    if (toDate) params.toDate = toDate;
  }
  if (real?.filters.includes("year") && year) params.year = Number(year);

  // Each report family has its own endpoint; only the active one is fetched.
  const isEmployees = !!real && real.endpoint === "employees" && report.id !== "lifecycle" && report.id !== "payroll-register";
  const isAttendance = !!real && real.endpoint === "attendance";
  const isLeave = !!real && real.endpoint === "leave";
  const isBalances = !!real && real.endpoint === "leave-balances";

  const employeeReport = useGetEmployeeReportQuery(params as any, { skip: !isEmployees });
  const attendanceReport = useGetAttendanceReportQuery(params as any, { skip: !isAttendance });
  const leaveReport = useGetLeaveReportQuery(params as any, { skip: !isLeave });
  const balancesReport = useGetLeaveBalancesReportQuery(params as any, { skip: !isBalances });

  const activeQuery =
    isEmployees ? employeeReport : isAttendance ? attendanceReport : isLeave ? leaveReport : isBalances ? balancesReport : null;

  const showTable = !!real && report.id !== "lifecycle" && report.id !== "payroll-register";
  const items: Row[] = showTable ? (activeQuery?.data?.items ?? []) : [];
  const total = showTable ? activeQuery?.data?.total ?? 0 : 0;
  const totalPages = showTable ? activeQuery?.data?.totalPages ?? 1 : 1;
  const isQueryLoading = activeQuery?.isLoading ?? false;
  const isQueryError = activeQuery?.isError ?? false;
  const columns = real?.columns ?? [];

  function exportCsv() {
    const header = columns.map((c) => c.label);
    const lines = items.map((row) => columns.map((c) => {
      const v = c.get ? c.get(row) : row[c.key];
      const s = String(v ?? "");
      return /^[=+\-@]/.test(s) ? `'${s}` : s;
    }).join(","));
    const csv = "\uFEFF" + header.join(",") + "\n" + lines.join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `hrm-report-${report.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <h1 className="hrm-page-title">HR Reports</h1>
      <p className="hrm-page-subtitle">Workforce, attendance, leave and payroll registers — filtered, exported, printable</p>

      <div className="flex gap-5 items-start">
        {/* ── Left: report list ── */}
        <div className="hrm-card p-3 shrink-0" style={{ width: 240, position: "sticky", top: 70 }}>
          {GROUPS.map((g) => (
            <div key={g} className="mb-3">
              <p className="hrm-nav-label" style={{ padding: "2px 8px" }}>{g}</p>
              {REPORTS.filter((r) => r.group === g).map((r) => (
                <button
                  key={r.id}
                  onClick={() => { if (r.real) { setReportId(r.id); setPage(1); } }}
                  disabled={!r.real}
                  className={`hrm-nav-item w-full ${reportId === r.id ? "hrm-report-active" : ""}`}
                  style={!r.real ? { opacity: 0.45, cursor: "not-allowed" } : undefined}
                  title={r.real ? r.label : "Not available yet"}
                >
                  <span>{r.label}</span>
                  {!r.real && <span style={{ fontSize: 9, marginLeft: "auto", color: "#94A3B8" }}>soon</span>}
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* ── Right: filter bar + result table ── */}
        <div className="flex-1 min-w-0">
          {!report.real && (
            <div className="hrm-card p-10 text-center">
              <p style={{ fontSize: 14, fontWeight: 700, color: "#334155", margin: 0 }}>{report.label} — not available yet</p>
              <p style={{ fontSize: 12, color: "var(--hrm-muted)", marginTop: 6 }}>
                This report needs an API that does not exist today — it stays disabled rather than showing estimated data.
              </p>
            </div>
          )}

          {report.id === "lifecycle" && (
            <div className="hrm-card p-8 text-center">
              <p style={{ fontSize: 14, fontWeight: 700, color: "#334155", margin: 0 }}>Lifecycle register</p>
              <p style={{ fontSize: 12, color: "var(--hrm-muted)", marginTop: 6 }}>
                Served by the Employment Lifecycle register — including salary-revision amounts with
                the appropriate permission.
              </p>
              <Link href="/hrm/lifecycle" className="hrm-pill hrm-pill-active" style={{ display: "inline-flex", marginTop: 12, textDecoration: "none" }}>
                Open the Lifecycle register
              </Link>
            </div>
          )}

          {report.id === "payroll-register" && (
            <div className="hrm-card p-8 text-center">
              <p style={{ fontSize: 14, fontWeight: 700, color: "#334155", margin: 0 }}>Payroll register</p>
              <p style={{ fontSize: 12, color: "var(--hrm-muted)", marginTop: 6 }}>
                Run totals and per-employee entries live in the Payroll page (sensitive — hrSalaryView).
              </p>
              <Link href="/hrm/payroll" className="hrm-pill hrm-pill-active" style={{ display: "inline-flex", marginTop: 12, textDecoration: "none" }}>
                Open Payroll
              </Link>
            </div>
          )}

          {showTable && (
            <>
              {/* Filter bar */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <div className="hrm-search" style={{ width: 240 }}>
                  <Search size={14} className="text-[#94A3B8]" />
                  <input placeholder="Search…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
                </div>
                {real!.filters.includes("status") && (
                  <select className="hrm-select" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
                    <option value="">All statuses</option>
                    {["ACTIVE", "PROBATION", "ON_LEAVE", "SUSPENDED", "RESIGNED", "TERMINATED", "RETIRED", "INACTIVE"].map((s) => (
                      <option key={s} value={s}>{s.replaceAll("_", " ")}</option>
                    ))}
                  </select>
                )}
                {real!.filters.includes("branch") && (
                  <select className="hrm-select" value={branchId} onChange={(e) => { setBranchId(e.target.value); setPage(1); }}>
                    <option value="">All branches</option>
                    {toArray(branches?.data).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                )}
                {real!.filters.includes("department") && (
                  <select className="hrm-select" value={departmentId} onChange={(e) => { setDepartmentId(e.target.value); setPage(1); }}>
                    <option value="">All departments</option>
                    {toArray(departments?.data).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                )}
                {real!.filters.includes("dates") && (
                  <>
                    <input type="date" className="hrm-select" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setPage(1); }} />
                    <input type="date" className="hrm-select" value={toDate} onChange={(e) => { setToDate(e.target.value); setPage(1); }} />
                  </>
                )}
                {real!.filters.includes("year") && (
                  <input type="number" className="hrm-select" value={year} onChange={(e) => { setYear(e.target.value); setPage(1); }} />
                )}
                <span className="hrm-chip hrm-chip-active">{total} rows</span>
                <div className="ml-auto flex gap-2">
                  <button className="hrm-pill" onClick={exportCsv}><Download size={13} /> Export CSV</button>
                  <button className="hrm-pill" onClick={() => window.print()}><Printer size={13} /> Print</button>
                </div>
              </div>

              {/* Result table */}
              <div className="hrm-card hrm-print-area" style={{ overflow: "hidden" }}>
                <div className="overflow-x-auto">
                  <table className="hrm-table">
                    <thead><tr>{columns.map((c) => <th key={c.key}>{c.label}</th>)}</tr></thead>
                    <tbody>
                      {isQueryLoading && (
                        <tr><td colSpan={columns.length}><div className="hrm-loading-block" style={{ margin: 16 }} /></td></tr>
                      )}
                      {isQueryError && (
                        <tr><td colSpan={columns.length} className="p-10 text-center text-sm text-red-600">
                          Failed to load this report.
                        </td></tr>
                      )}
                      {!isQueryLoading && !isQueryError && items.length === 0 && (
                        <tr><td colSpan={columns.length} className="p-10 text-center text-sm" style={{ color: "var(--hrm-muted)" }}>
                          No rows match the filters.
                        </td></tr>
                      )}
                      {items.map((row, i) => (
                        <tr key={row.id ?? i}>
                          {columns.map((c) => (
                            <td key={c.key}>{c.get ? c.get(row) : String(row[c.key] ?? "—")}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center justify-end gap-2 p-4 text-sm">
                    <button className="hrm-pill" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}><ChevronLeft size={13} /> Prev</button>
                    <span style={{ fontSize: 12, color: "var(--hrm-muted)" }}>Page {page} of {totalPages}</span>
                    <button className="hrm-pill" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next <ChevronRight size={13} /></button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
