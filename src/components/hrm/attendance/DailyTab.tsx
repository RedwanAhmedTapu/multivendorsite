// src/components/hrm/attendance/DailyTab.tsx
//
// Daily Attendance tab: date picker, counters, search, CSV, table with
// employee/shift/status/check-in/check-out/late/OT/source, In/Out buttons
// and Edit pencil. Bulk select-all + "Mark present".

"use client";

import { useMemo, useState } from "react";
import { Download, Search, ChevronLeft, ChevronRight, Pencil, X } from "lucide-react";
import { toast } from "sonner";
import {
  useGetAttendanceQuery,
  useGetEmployeesQuery,
  useGetShiftsOverviewQuery,
  useMarkAttendanceMutation,
  useGetShiftAssignmentsQuery,
} from "@/features/hrmApi";
import { usePermissions } from "@/hooks/usePermissions";
import { EmployeeStatusBadge } from "@/othersfeatures/hrm/components/employee360/EmployeeStatusBadge";
import { toArray } from "../hrm-utils";

const today = () => new Date().toISOString().slice(0, 10);
const nowHm = () => new Date().toTimeString().slice(0, 5);

function csvCell(v: unknown): string {
  const s = String(v ?? "");
  return /^[=+\-@]/.test(s) ? `'${s}` : s;
}

const STATUS_CHIPS: Record<string, string> = {
  PRESENT: "hrm-chip-active", LATE: "hrm-chip-late", ABSENT: "hrm-chip-absent",
  HALF_DAY: "hrm-chip-probation", LEAVE: "hrm-chip-probation", HOLIDAY: "hrm-chip-resigned",
  WEEKLY_OFF: "hrm-chip-resigned", WFH: "hrm-chip-active",
};

export function HrmAttendanceDaily() {
  const { can, canHrUmbrella } = usePermissions();
  // Backend POST /hrm/attendance(/mark|/bulk-mark) uses requirePermission("hrManagement"):
  // owners or the HR umbrella — NOT granular keys. Mirror that exactly.
  const canMark = canHrUmbrella;

  const [date, setDate] = useState(today());
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editRow, setEditRow] = useState<any>(null);

  const daily = useGetAttendanceQuery({ fromDate: date, toDate: date, page, limit: 50 });
  const { data: employeesData } = useGetEmployeesQuery({ page: 1, limit: 100 });
  const shifts = useGetShiftsOverviewQuery();
  const assignments = useGetShiftAssignmentsQuery({ page: 1, limit: 200 });
  const cPresent = useGetAttendanceQuery({ fromDate: date, toDate: date, status: "PRESENT", page: 1, limit: 1 });
  const cLate = useGetAttendanceQuery({ fromDate: date, toDate: date, status: "LATE", page: 1, limit: 1 });
  const cAbsent = useGetAttendanceQuery({ fromDate: date, toDate: date, status: "ABSENT", page: 1, limit: 1 });
  const cLeave = useGetAttendanceQuery({ fromDate: date, toDate: date, status: "LEAVE", page: 1, limit: 1 });
  const [mark] = useMarkAttendanceMutation();

  const nameOf = useMemo(() => {
    const m: Record<string, any> = {};
    toArray(employeesData?.items).forEach((e: any) => { m[e.id] = e; });
    return m;
  }, [employeesData]);

  const shiftFor = useMemo(() => {
    const m: Record<string, string> = {};
    toArray(assignments.data?.items).forEach((a: any) => {
      if (a.employee?.id) m[a.employee.id] = `${a.shift.name} (${a.shift.startTime}–${a.shift.endTime})`;
    });
    return m;
  }, [assignments.data]);

  const rows = useMemo(() => {
    const list = toArray(daily.data?.items);
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter((r: any) =>
      (nameOf[r.employeeId]?.fullName ?? r.employeeId).toLowerCase().includes(q)
    );
  }, [daily.data, search, nameOf]);

  async function markIn(row: any) {
    try {
      await mark({ employeeId: row.employeeId, date: row.date, checkIn: nowHm(), status: "PRESENT" }).unwrap();
      toast.success("Checked in.");
    } catch (err: any) { toast.error(err?.data?.message || "Mark failed."); }
  }
  async function markOut(row: any) {
    try {
      await mark({ employeeId: row.employeeId, date: row.date, checkOut: nowHm() }).unwrap();
      toast.success("Checked out.");
    } catch (err: any) { toast.error(err?.data?.message || "Mark failed."); }
  }

  async function bulkMark() {
    const ids = Array.from(selected);
    if (!ids.length) return;
    try {
      const res = await fetch("/api/hrm/attendance/bulk-mark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeIds: ids, date }),
      });
      const body = await res.json();
      if (body.success) toast.success(`Marked ${body.data.succeeded} employee(s) present.`);
      else toast.error(body.message ?? "Bulk mark failed.");
      setSelected(new Set());
      daily.refetch();
    } catch (err: any) { toast.error(err?.message || "Bulk mark failed."); }
  }

  function exportCsv() {
    const header = ["Employee", "Code", "Status", "Check In", "Check Out", "Late (min)", "OT (min)", "Source"];
    const lines = rows.map((r: any) =>
      [nameOf[r.employeeId]?.fullName ?? r.employeeId, nameOf[r.employeeId]?.code ?? "", r.status,
        r.checkIn, r.checkOut, r.lateMinutes, r.overtimeMinutes, r.source].map(csvCell).join(",")
    );
    const csv = "\uFEFF" + header.join(",") + "\n" + lines.join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = `attendance-${date}.csv`; a.click(); URL.revokeObjectURL(url);
  }

  function toggleSelect(empId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(empId)) next.delete(empId); else next.add(empId);
      return next;
    });
  }

  function selectAll() {
    if (selected.size === rows.length) setSelected(new Set());
    else setSelected(new Set(rows.map((r: any) => r.employeeId)));
  }

  return (
    <div>
      {/* Date picker + counters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input type="date" className="hrm-select" value={date} onChange={(e) => { setDate(e.target.value); setPage(1); }} />
        {canMark && selected.size > 0 && (
          <button className="hrm-pill hrm-pill-active" onClick={bulkMark}>Mark {selected.size} present</button>
        )}
        <div className="ml-auto flex gap-2">
          {[
            { label: "Present", value: cPresent.data?.total ?? 0, cls: "hrm-chip-active" },
            { label: "Late", value: cLate.data?.total ?? 0, cls: "hrm-chip-late" },
            { label: "Absent", value: cAbsent.data?.total ?? 0, cls: "hrm-chip-absent" },
            { label: "On Leave", value: cLeave.data?.total ?? 0, cls: "hrm-chip-probation" },
          ].map((c) => (
            <span key={c.label} className={`hrm-chip ${c.cls}`}>{c.label} {c.value}</span>
          ))}
        </div>
      </div>

      {/* Search + CSV */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="hrm-search" style={{ width: 280 }}>
          <Search size={14} className="text-[#94A3B8]" />
          <input placeholder="Search employee..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <button className="hrm-pill" onClick={exportCsv}><Download size={13} /> CSV</button>
      </div>

      {/* Table */}
      <div className="hrm-card" style={{ overflow: "hidden" }}>
        <div className="overflow-x-auto">
          <table className="hrm-table">
            <thead><tr>
              {canMark && <th style={{ width: 32 }}><input type="checkbox" checked={selected.size === rows.length && rows.length > 0} onChange={selectAll} /></th>}
              {["Employee", "Shift", "Status", "Check In", "Check Out", "Late", "OT", "Source", ...(canMark ? ["Actions"] : [])].map((h) => <th key={h}>{h}</th>)}
            </tr></thead>
            <tbody>
              {daily.isLoading && <tr><td colSpan={10}><div className="hrm-loading-block" style={{ margin: 16 }} /></td></tr>}
              {!daily.isLoading && rows.length === 0 && (
                <tr><td colSpan={10} className="p-10 text-center text-sm" style={{ color: "var(--hrm-muted)" }}>
                  No attendance records for {date}. Records appear when employees check in or HR marks attendance.
                </td></tr>
              )}
              {rows.map((r: any) => {
                const emp = nameOf[r.employeeId];
                return (
                  <tr key={r.id}>
                    {canMark && (
                      <td>
                        <input type="checkbox" checked={selected.has(r.employeeId)} onChange={() => toggleSelect(r.employeeId)} />
                      </td>
                    )}
                    <td>
                      <p style={{ margin: 0, fontSize: 12.5, fontWeight: 600, color: "var(--hrm-text)" }}>
                        {emp?.fullName ?? r.employeeId.slice(0, 10)}
                      </p>
                      <p style={{ margin: 0, fontSize: 10.5, color: "var(--hrm-muted)" }}>
                        {emp?.code ?? ""} · {emp?.branch?.name ?? ""} · {emp?.department?.name ?? ""}
                      </p>
                    </td>
                    <td style={{ color: "var(--hrm-muted)", fontSize: 12 }}>{shiftFor[r.employeeId] ?? "—"}</td>
                    <td>{r.status === "PRESENT" ? <span className="hrm-chip hrm-chip-active">Present</span>
                      : r.status === "LATE" ? <span className="hrm-chip hrm-chip-late">Late</span>
                      : r.status === "ABSENT" ? <span className="hrm-chip hrm-chip-absent">Absent</span>
                      : r.status === "HALF_DAY" ? <span className="hrm-chip hrm-chip-probation">Half Day</span>
                      : r.status === "LEAVE" ? <span className="hrm-chip hrm-chip-probation">On Leave</span>
                      : <span className="hrm-chip hrm-chip-resigned">Unmarked</span>}
                    </td>
                    <td>{r.checkIn || "—"}</td>
                    <td>{r.checkOut || "—"}</td>
                    <td>{r.lateMinutes > 0 ? `${r.lateMinutes}m` : "—"}</td>
                    <td>{r.overtimeMinutes > 0 ? `${r.overtimeMinutes}m` : "—"}</td>
                    <td><span className="hrm-chip hrm-chip-resigned">{r.source}</span></td>
                    {canMark && (
                      <td className="whitespace-nowrap">
                        {!r.checkIn && (
                          <button className="hrm-pill" style={{ padding: "3px 10px", marginRight: 4 }} onClick={() => markIn(r)}>
                            → In
                          </button>
                        )}
                        {r.checkIn && !r.checkOut && (
                          <button className="hrm-pill" style={{ padding: "3px 10px", marginRight: 4 }} onClick={() => markOut(r)}>
                            → Out
                          </button>
                        )}
                        <button className="hrm-row-action" style={{ color: "#64748B" }} title="Edit"
                          onClick={() => setEditRow(r)}>
                          <Pencil size={13} />
                        </button>
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
            <button className="hrm-pill" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}><ChevronLeft size={13} /> Prev</button>
            <span style={{ fontSize: 12, color: "var(--hrm-muted)" }}>Page {daily.data.page} of {daily.data!.totalPages}</span>
            <button className="hrm-pill" disabled={page >= (daily.data?.totalPages ?? 1)} onClick={() => setPage((p) => Math.min(daily.data!.totalPages, p + 1))}>Next <ChevronRight size={13} /></button>
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editRow && (
        <MarkModal
          row={editRow}
          employeeName={nameOf[editRow.employeeId]?.fullName ?? editRow.employeeId}
          date={date}
          onClose={() => setEditRow(null)}
          onSave={async (values) => {
            try {
              await mark({ employeeId: editRow.employeeId, date: editRow.date, ...values }).unwrap();
              toast.success("Attendance updated.");
              setEditRow(null);
              daily.refetch();
            } catch (err: any) { toast.error(err?.data?.message || "Save failed."); }
          }}
        />
      )}
    </div>
  );
}

// ── Mark attendance modal ──

function MarkModal({ row, employeeName, date, onClose, onSave }: {
  row: any; employeeName: string; date: string;
  onClose: () => void; onSave: (values: any) => Promise<void>;
}) {
  const [form, setForm] = useState({
    checkIn: row.checkIn ?? "",
    checkOut: row.checkOut ?? "",
    status: "",
    remarks: "",
  });
  const inputCls = "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 style={{ fontSize: 15, fontWeight: 800, color: "var(--hrm-text)", margin: 0 }}>
            Mark attendance — {employeeName}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <p style={{ fontSize: 12, color: "var(--hrm-muted)", margin: "0 0 16px" }}>
          Manual entry for {date}. Times are HH:MM; late / OT are recomputed against the assigned shift.
        </p>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Check In</label>
            <input type="time" className={inputCls} value={form.checkIn} onChange={(e) => setForm({ ...form, checkIn: e.target.value })} />
            <p style={{ fontSize: 10, color: "#9BAABB", marginTop: 2 }}>Required unless a status override is chosen</p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Check Out</label>
            <input type="time" className={inputCls} value={form.checkOut} onChange={(e) => setForm({ ...form, checkOut: e.target.value })} />
          </div>
        </div>
        <div className="mb-3">
          <label className="mb-1 block text-sm font-medium text-gray-700">Status Override</label>
          <select className={inputCls} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="">— derive from times —</option>
            {["PRESENT", "LATE", "ABSENT", "HALF_DAY", "LEAVE", "WFH"].map((s) => <option key={s} value={s}>{s.replaceAll("_", " ")}</option>)}
          </select>
        </div>
        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-gray-700">Remarks</label>
          <textarea rows={2} className={inputCls} value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} />
        </div>
        <div className="flex justify-end gap-2">
          <button className="rounded-md border border-gray-300 px-4 py-2 text-sm" onClick={onClose}>Cancel</button>
          <button
            className="rounded-md px-5 py-2 text-sm font-bold text-white" style={{ background: "var(--hrm-emerald-deep)" }}
            onClick={async () => {
              if (!form.checkIn && !form.status) { toast.error("Check-in is required unless a status override is chosen."); return; }
              await onSave(form);
            }}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
