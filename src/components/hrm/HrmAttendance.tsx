// src/components/hrm/HrmAttendance.tsx
//
// Attendance & Shifts (PHASE C) on the existing attendance APIs:
//   Daily Attendance  — real: GET /hrm/attendance per date + per-status
//                       counters, In/Out via POST /hrm/attendance/mark
//                       (management marking, umbrella gate).
//   Monthly Register  — real: per-employee records for a chosen month.
//   Shifts & Roster   — placeholder: shifts are seeded but the shift/roster
//                       API is a later phase. No invented rows.
//   Corrections       — placeholder: the corrections API is not built yet.
//
// Employee names resolve from the directory map (first 100 employees —
// page-size limit, noted in the UI).

"use client";

import { useMemo, useState } from "react";
import { Download, Clock } from "lucide-react";
import { toast } from "sonner";
import {
  useGetAttendanceQuery,
  useGetEmployeesQuery,
  useMarkAttendanceMutation,
  useGetShiftsOverviewQuery,
  useGetShiftAssignmentsQuery,
  type HrAttendance,
} from "@/features/hrmApi";
import { usePermissions } from "@/hooks/usePermissions";
import { SimpleFormDialog } from "@/othersfeatures/hrm/components/employee360/SimpleFormDialog";

const TABS = ["Daily Attendance", "Monthly Register", "Shifts & Roster", "Corrections"] as const;
type Tab = (typeof TABS)[number];

const STATUS_CHIPS: Record<string, string> = {
  PRESENT: "hrm-chip-active",
  LATE: "hrm-chip-late",
  ON_LEAVE: "hrm-chip-probation",
  LEAVE: "hrm-chip-probation",
  ABSENT: "hrm-chip-absent",
  HALF_DAY: "hrm-chip-late",
  HOLIDAY: "hrm-chip-resigned",
  WEEKLY_OFF: "hrm-chip-resigned",
  WFH: "hrm-chip-active",
};

const EDIT_STATUSES = ["PRESENT", "ABSENT", "LATE", "HALF_DAY", "LEAVE", "HOLIDAY", "WEEKLY_OFF", "WFH"];

const today = () => new Date().toISOString().slice(0, 10);
const nowHm = () => new Date().toTimeString().slice(0, 5);

function csvCell(v: unknown): string {
  const s = String(v ?? "");
  return /^[=+\-@]/.test(s) ? `'${s}` : s;
}

export function HrmAttendance() {
  const { can } = usePermissions();
  const canMark = can("hrManagement"); // /hrm/attendance/mark is the management-marking gate

  const [tab, setTab] = useState<Tab>("Daily Attendance");
  const [date, setDate] = useState(today());
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [editRow, setEditRow] = useState<HrAttendance | null>(null);
  const [registerEmployeeId, setRegisterEmployeeId] = useState("");
  const [month, setMonth] = useState(today().slice(0, 7));

  const { data: employees } = useGetEmployeesQuery({ page: 1, limit: 100 });
  const employeesFull = (employees?.total ?? 0) <= 100;
  const nameOf = useMemo(() => {
    const m: Record<string, string> = {};
    (employees?.items ?? []).forEach((e) => { m[e.id] = e.fullName; });
    return m;
  }, [employees]);

  // ── Daily ──
  const daily = useGetAttendanceQuery({ fromDate: date, toDate: date, page, limit: 50 });
  const cPresent = useGetAttendanceQuery({ fromDate: date, toDate: date, status: "PRESENT", page: 1, limit: 1 });
  const cLate = useGetAttendanceQuery({ fromDate: date, toDate: date, status: "LATE", page: 1, limit: 1 });
  const cAbsent = useGetAttendanceQuery({ fromDate: date, toDate: date, status: "ABSENT", page: 1, limit: 1 });
  const cLeave = useGetAttendanceQuery({ fromDate: date, toDate: date, status: "LEAVE", page: 1, limit: 1 });
  const [mark] = useMarkAttendanceMutation();
  const shifts = useGetShiftsOverviewQuery();
  const assignments = useGetShiftAssignmentsQuery({ page: 1, limit: 50 });

  const rows = useMemo(() => {
    const items = daily.data?.items ?? [];
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter((r) => (nameOf[r.employeeId] ?? r.employeeId).toLowerCase().includes(q));
  }, [daily.data?.items, search, nameOf]);

  async function markIn(emp: HrAttendance) {
    try {
      await mark({ employeeId: emp.employeeId, date: emp.date, checkIn: nowHm(), status: "PRESENT" }).unwrap();
      toast.success("Checked in.");
    } catch (err: any) {
      toast.error(err?.data?.message || "Mark failed.");
    }
  }
  async function markOut(emp: HrAttendance) {
    try {
      await mark({ employeeId: emp.employeeId, date: emp.date, checkOut: nowHm() }).unwrap();
      toast.success("Checked out.");
    } catch (err: any) {
      toast.error(err?.data?.message || "Mark failed.");
    }
  }

  // ── Monthly register ──
  const regFrom = `${month}-01`;
  const regTo = `${month}-31`;
  const register = useGetAttendanceQuery(
    registerEmployeeId ? { employeeId: registerEmployeeId, fromDate: regFrom, toDate: regTo, page: 1, limit: 200 } : { page: 1, limit: 1 }
  );

  function exportDaily() {
    const header = ["Employee", "Date", "Status", "Check In", "Check Out", "Minutes"];
    const lines = rows.map((r) =>
      [nameOf[r.employeeId] ?? r.employeeId, r.date, r.status, r.checkIn, r.checkOut, r.workingMinutes].map(csvCell).join(",")
    );
    const csv = "\uFEFF" + header.join(",") + "\n" + lines.join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-${date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <h1 className="hrm-page-title">Attendance &amp; Shifts</h1>
      <p className="hrm-page-subtitle">Daily attendance, monthly register, shifts and corrections</p>

      <div className="flex flex-wrap gap-1.5">
        {TABS.map((t) => (
          <button key={t} className={`hrm-pill ${tab === t ? "hrm-pill-active" : ""}`} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      {tab === "Daily Attendance" && (
        <>
          <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              { label: "Present", value: cPresent.data?.total, tile: "hrm-tile-emerald" },
              { label: "Late", value: cLate.data?.total, tile: "hrm-tile-orange" },
              { label: "Absent", value: cAbsent.data?.total, tile: "hrm-tile-rose" },
              { label: "On Leave", value: cLeave.data?.total, tile: "hrm-tile-teal" },
            ].map((s) => (
              <div key={s.label} className="hrm-card hrm-stat-card">
                <div><p className="hrm-stat-label">{s.label}</p><p className="hrm-stat-value">{s.value ?? "—"}</p></div>
                <div className={`hrm-stat-tile ${s.tile}`}><Clock size={18} /></div>
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <input type="date" className="hrm-select" value={date} onChange={(e) => { setDate(e.target.value); setPage(1); }} />
            <div className="flex items-center gap-3">
              <div className="hrm-search" style={{ width: 260 }}>
                <input placeholder="Search employee…" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <button className="hrm-pill" onClick={exportDaily}><Download size={13} /> CSV</button>
            </div>
          </div>

          <div className="hrm-card mt-4" style={{ overflow: "hidden" }}>
            <div className="overflow-x-auto">
              <table className="hrm-table">
                <thead><tr>
                  {["Employee", "Shift", "Status", "Check In", "Check Out", "Minutes", ...(canMark ? ["Actions"] : [])].map((h) => <th key={h}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {daily.isLoading && <tr><td colSpan={8}><div className="hrm-loading-block" style={{ margin: 16 }} /></td></tr>}
                  {!daily.isLoading && rows.length === 0 && (
                    <tr><td colSpan={8} className="p-10 text-center text-sm" style={{ color: "var(--hrm-muted)" }}>
                      No attendance records for {date}. Records appear once employees check in or HR marks attendance.
                    </td></tr>
                  )}
                  {rows.map((r) => {
                    const inName = nameOf[r.employeeId] ?? `${r.employeeId.slice(0, 8)}…`;
                    return (
                      <tr key={r.id}>
                        <td style={{ fontWeight: 600, color: "var(--hrm-text)" }}>{inName}</td>
                        <td>—</td>
                        <td><span className={`hrm-chip ${STATUS_CHIPS[r.status] ?? "hrm-chip-resigned"}`}>{r.status.replaceAll("_", " ")}</span></td>
                        <td>{r.checkIn || "—"}</td>
                        <td>{r.checkOut || "—"}</td>
                        <td>{r.workingMinutes ?? "—"}</td>
                        {canMark && (
                          <td className="whitespace-nowrap">
                            {!r.checkIn && (
                              <button className="hrm-pill" style={{ padding: "4px 12px", marginRight: 8 }} onClick={() => markIn(r)}>In</button>
                            )}
                            {r.checkIn && !r.checkOut && (
                              <button className="hrm-pill" style={{ padding: "4px 12px", marginRight: 8 }} onClick={() => markOut(r)}>Out</button>
                            )}
                            <button className="hrm-row-action" style={{ color: "#64748B" }} onClick={() => setEditRow(r)}>✎</button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {daily.data && daily.data.totalPages > 1 && (
              <div className="flex items-center justify-end gap-2 p-4 text-sm">
                <button className="hrm-pill" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</button>
                <span style={{ fontSize: 12, color: "var(--hrm-muted)" }}>Page {daily.data!.page} of {daily.data!.totalPages} · {daily.data!.total} records</span>
                <button className="hrm-pill" disabled={page >= (daily.data?.totalPages ?? 1)} onClick={() => setPage((p) => Math.min(daily.data!.totalPages, p + 1))}>Next</button>
              </div>
            )}
          </div>
          {!employeesFull && (
            <p className="mt-2 text-[11px]" style={{ color: "var(--hrm-muted)" }}>
              Employee names resolve from the first 100 directory entries (page-size limit).
            </p>
          )}
        </>
      )}

      {tab === "Monthly Register" && (
        <>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <select className="hrm-select" value={registerEmployeeId} onChange={(e) => setRegisterEmployeeId(e.target.value)}>
              <option value="">Select employee…</option>
              {(employees?.items ?? []).map((e) => (
                <option key={e.id} value={e.id}>{e.fullName} ({e.code})</option>
              ))}
            </select>
            <input type="month" className="hrm-select" value={month} onChange={(e) => setMonth(e.target.value)} />
          </div>

          {!registerEmployeeId ? (
            <div className="hrm-card mt-4 p-10 text-center text-sm" style={{ color: "var(--hrm-muted)" }}>
              Pick an employee and month to load their register.
            </div>
          ) : (
            <div className="hrm-card mt-4" style={{ overflow: "hidden" }}>
              <table className="hrm-table">
                <thead><tr>{["Date", "Status", "Check In", "Check Out", "Minutes"].map((h) => <th key={h}>{h}</th>)}</tr></thead>
                <tbody>
                  {register.isLoading && <tr><td colSpan={5}><div className="hrm-loading-block" style={{ margin: 16 }} /></td></tr>}
                  {!register.isLoading && (register.data?.items ?? []).length === 0 && (
                    <tr><td colSpan={5} className="p-10 text-center text-sm" style={{ color: "var(--hrm-muted)" }}>No records for {month}.</td></tr>
                  )}
                  {(register.data?.items ?? []).map((r) => (
                    <tr key={r.id}>
                      <td>{r.date}</td>
                      <td><span className={`hrm-chip ${STATUS_CHIPS[r.status] ?? "hrm-chip-resigned"}`}>{r.status.replaceAll("_", " ")}</span></td>
                      <td>{r.checkIn || "—"}</td>
                      <td>{r.checkOut || "—"}</td>
                      <td>{r.workingMinutes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {tab === "Shifts & Roster" && (
        <>
          <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {(shifts.data?.data.items ?? []).map((s) => (
              <div key={s.id} className="hrm-card p-4">
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "var(--hrm-text)" }}>{s.name}</p>
                <p style={{ margin: "2px 0 0", fontSize: 11.5, color: "var(--hrm-muted)" }}>
                  {s.startTime}–{s.endTime} · {s.type}
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="hrm-chip hrm-chip-active">{s.currentAssignments} assigned</span>
                  <span style={{ fontSize: 10.5, color: "var(--hrm-muted)" }}>off: {s.weeklyOff || "—"}</span>
                </div>
              </div>
            ))}
            {!shifts.isLoading && (shifts.data?.data.items.length ?? 0) === 0 && (
              <div className="hrm-card p-10 text-center text-sm col-span-4" style={{ color: "var(--hrm-muted)" }}>
                No shifts defined — starter shifts seed automatically on first org view.
              </div>
            )}
          </div>

          <div className="hrm-card mt-5" style={{ overflow: "hidden" }}>
            <div style={{ borderBottom: "1px solid var(--hrm-border)", background: "#FAFBFD", padding: "10px 16px" }}>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 800, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--hrm-muted)" }}>
                Current shift assignments (read-only — assignment API arrives later)
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="hrm-table">
                <thead><tr>{["Employee", "Shift", "From", "To"].map((h) => <th key={h}>{h}</th>)}</tr></thead>
                <tbody>
                  {assignments.isLoading && <tr><td colSpan={4}><div className="hrm-loading-block" style={{ margin: 16 }} /></td></tr>}
                  {!assignments.isLoading && (assignments.data?.items ?? []).length === 0 && (
                    <tr><td colSpan={4} className="p-10 text-center text-sm" style={{ color: "var(--hrm-muted)" }}>
                      No current shift assignments.
                    </td></tr>
                  )}
                  {(assignments.data?.items ?? []).map((a) => (
                    <tr key={a.id}>
                      <td style={{ fontWeight: 600, color: "var(--hrm-text)" }}>
                        {a.employee.fullName} <span style={{ fontSize: 11, color: "var(--hrm-muted)" }}>({a.employee.code})</span>
                      </td>
                      <td>{a.shift.name} <span style={{ fontSize: 11, color: "var(--hrm-muted)" }}>({a.shift.startTime}–{a.shift.endTime})</span></td>
                      <td>{a.fromDate}</td>
                      <td>{a.toDate ?? "ongoing"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === "Corrections" && (
        <div className="hrm-card mt-5" style={{ padding: 48, textAlign: "center" }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: "#334155", margin: 0 }}>Corrections workflow arrives with the attendance phase</p>
          <p style={{ fontSize: 12, color: "var(--hrm-muted)", marginTop: 6 }}>
            The corrections model exists in the schema but the API/UI is not built yet —
            this tab stays empty rather than pretending.
          </p>
        </div>
      )}

      {editRow && (
        <SimpleFormDialog
          title={`Edit attendance — ${nameOf[editRow.employeeId] ?? editRow.employeeId} (${editRow.date})`}
          fields={[
            { name: "checkIn", label: "Check in (HH:MM)" },
            { name: "checkOut", label: "Check out (HH:MM)" },
            { name: "status", label: "Status", type: "select", options: EDIT_STATUSES.map((s) => ({ value: s, label: s.replaceAll("_", " ") })) },
            { name: "remarks", label: "Remarks", type: "textarea" },
          ]}
          initial={{ checkIn: editRow.checkIn ?? "", checkOut: editRow.checkOut ?? "", status: editRow.status, remarks: "" }}
          onSave={async (values: Record<string, unknown>) => {
            try {
              await mark({ employeeId: editRow.employeeId, date: editRow.date, ...values }).unwrap();
              toast.success("Attendance updated.");
              setEditRow(null);
            } catch (err: any) {
              toast.error(err?.data?.message || "Update failed.");
            }
          }}
          onClose={() => setEditRow(null)}
        />
      )}
    </div>
  );
}
