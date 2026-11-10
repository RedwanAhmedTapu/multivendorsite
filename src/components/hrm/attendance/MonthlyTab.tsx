// src/components/hrm/attendance/MonthlyTab.tsx
//
// Monthly Register tab: month/year/branch/department/employee filters,
// counters, table with real attendance data including Working/Late/OT.

"use client";

import { useMemo, useState } from "react";
import { Download, Search } from "lucide-react";
import {
  useGetAttendanceQuery,
  useGetEmployeesQuery,
  useGetBranchesQuery,
  useGetDepartmentsQuery,
} from "@/features/hrmApi";
import { toArray } from "../hrm-utils";

const MONTH_NAMES = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function csvCell(v: unknown): string {
  const s = String(v ?? "");
  return /^[=+\-@]/.test(s) ? `'${s}` : s;
}

export function HrmAttendanceMonthly() {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [branchFilter, setBranchFilter] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState("");
  const [search, setSearch] = useState("");

  const from = `${year}-${String(month).padStart(2, "0")}-01`;
  const to = `${year}-${String(month).padStart(2, "0")}-31`;

  const { data: employeesData } = useGetEmployeesQuery({ page: 1, limit: 100 });
  const branches = useGetBranchesQuery();
  const departments = useGetDepartmentsQuery();

  const empFilters = useMemo(() => {
    const ids = toArray(employeesData?.items);
    if (branchFilter) return ids.filter((e: any) => e.branchId === branchFilter).map((e: any) => e.id);
    if (deptFilter) return ids.filter((e: any) => e.departmentId === deptFilter).map((e: any) => e.id);
    return null;
  }, [employeesData, branchFilter, deptFilter]);

  // If we can't narrow by branch/department server-side, fetch all records
  // for the month and filter client-side using the employee IDs.
  const attendance = useGetAttendanceQuery({
    fromDate: from, toDate: to, page: 1, limit: 200,
    ...(employeeFilter ? { employeeId: employeeFilter } : {}),
  });

  const nameOf = useMemo(() => {
    const m: Record<string, any> = {};
    toArray(employeesData?.items).forEach((e: any) => { m[e.id] = e; });
    return m;
  }, [employeesData]);

  const rows = useMemo(() => {
    let list = toArray(attendance.data?.items);
    // Server-side employee filter
    if (employeeFilter) return list;
    // Client-side branch/department filter
    if (branchFilter || deptFilter) {
      list = list.filter((r: any) => {
        const emp = nameOf[r.employeeId];
        if (!emp) return false;
        if (branchFilter && emp.branchId !== branchFilter) return false;
        if (deptFilter && emp.departmentId !== deptFilter) return false;
        return true;
      });
    }
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter((r: any) => (nameOf[r.employeeId]?.fullName ?? "").toLowerCase().includes(q));
  }, [attendance.data, branchFilter, deptFilter, employeeFilter, search, nameOf]);

  const counts = useMemo(() => ({
    present: rows.filter((r: any) => r.status === "PRESENT").length,
    absent: rows.filter((r: any) => r.status === "ABSENT").length,
    late: rows.filter((r: any) => r.status === "LATE").length,
    overtime: rows.filter((r: any) => (r.overtimeMinutes ?? 0) > 0).length,
  }), [rows]);

  function exportCsv() {
    const header = ["Date", "Employee", "Code", "Status", "Check In", "Check Out", "Working (min)", "Late (min)", "OT (min)", "Source"];
    const lines = rows.map((r: any) =>
      [r.date, nameOf[r.employeeId]?.fullName ?? r.employeeId, nameOf[r.employeeId]?.code ?? "", r.status, r.checkIn, r.checkOut, r.workingMinutes, r.lateMinutes, r.overtimeMinutes, r.source].map(csvCell).join(",")
    );
    const csv = "\uFEFF" + header.join(",") + "\n" + lines.join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = `monthly-register-${year}-${month}.csv`; a.click(); URL.revokeObjectURL(url);
  }

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <select className="hrm-select" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
          {MONTH_NAMES.slice(1).map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
        </select>
        <input type="number" className="hrm-select" style={{ width: 90 }} value={year} onChange={(e) => setYear(Number(e.target.value))} />
        <select className="hrm-select" value={branchFilter} onChange={(e) => { setBranchFilter(e.target.value); }}>
          <option value="">All branches</option>
          {toArray(branches?.data).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <select className="hrm-select" value={deptFilter} onChange={(e) => { setDeptFilter(e.target.value); }}>
          <option value="">All departments</option>
          {toArray(departments?.data).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select className="hrm-select" value={employeeFilter} onChange={(e) => setEmployeeFilter(e.target.value)}>
          <option value="">All employees</option>
          {toArray(employeesData?.items).map((e: any) => <option key={e.id} value={e.id}>{e.fullName}</option>)}
        </select>
      </div>

      {/* Counters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="hrm-chip hrm-chip-active">Present {counts.present}</span>
        <span className="hrm-chip hrm-chip-absent">Absent {counts.absent}</span>
        <span className="hrm-chip hrm-chip-late">Late {counts.late}</span>
        <span className="hrm-chip hrm-chip-active">Overtime {counts.overtime || "—"}</span>
      </div>

      {/* Search + CSV */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="hrm-search" style={{ width: 280 }}>
          <Search size={14} className="text-[#94A3B8]" />
          <input placeholder="Search employee..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <button className="hrm-pill" onClick={exportCsv}><Download size={13} /> CSV</button>
      </div>

      {/* Table */}
      <div className="hrm-card" style={{ overflow: "hidden" }}>
        <div className="overflow-x-auto">
          <table className="hrm-table">
            <thead><tr>{["Date", "Employee", "Status", "Check In", "Check Out", "Working", "Late", "OT", "Source"].map((h) => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {attendance.isLoading && <tr><td colSpan={9}><div className="hrm-loading-block" style={{ margin: 16 }} /></td></tr>}
              {!attendance.isLoading && rows.length === 0 && (
                <tr><td colSpan={9} className="p-10 text-center text-sm" style={{ color: "var(--hrm-muted)" }}>
                  No attendance records for this month and filters.
                </td></tr>
              )}
              {rows.map((r: any) => (
                <tr key={r.id}>
                  <td>{r.date}</td>
                  <td>
                    <p style={{ margin: 0, fontSize: 12.5, fontWeight: 600, color: "var(--hrm-text)" }}>
                      {nameOf[r.employeeId]?.fullName ?? r.employeeId.slice(0, 10)}
                    </p>
                    <p style={{ margin: 0, fontSize: 10.5, color: "var(--hrm-muted)" }}>
                      {nameOf[r.employeeId]?.code ?? ""}
                    </p>
                  </td>
                  <td>{r.status === "PRESENT" ? <span className="hrm-chip hrm-chip-active">Present</span>
                    : r.status === "LATE" ? <span className="hrm-chip hrm-chip-late">Late</span>
                    : r.status === "ABSENT" ? <span className="hrm-chip hrm-chip-absent">Absent</span>
                    : r.status === "HALF_DAY" ? <span className="hrm-chip hrm-chip-probation">Half Day</span>
                    : r.status === "LEAVE" ? <span className="hrm-chip hrm-chip-probation">On Leave</span>
                    : <span className="hrm-chip hrm-chip-resigned">{r.status}</span>}
                  </td>
                  <td>{r.checkIn || "—"}</td>
                  <td>{r.checkOut || "—"}</td>
                  <td>{r.workingMinutes > 0 ? `${r.workingMinutes}m` : "—"}</td>
                  <td>{r.lateMinutes > 0 ? `${r.lateMinutes}m` : "—"}</td>
                  <td>{r.overtimeMinutes > 0 ? `${r.overtimeMinutes}m` : "—"}</td>
                  <td><span className="hrm-chip hrm-chip-resigned">{r.source}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: "10px 16px", borderTop: "1px solid var(--hrm-border)", fontSize: 11.5, color: "var(--hrm-muted)" }}>
          {rows.length} record(s)
        </div>
      </div>
    </div>
  );
}
