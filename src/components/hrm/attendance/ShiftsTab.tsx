// src/components/hrm/attendance/ShiftsTab.tsx
//
// Shift Definitions card (Add Shift, search, CSV, table with Edit/Delete
// actions) + current shift assignment register below it.

"use client";

import { useMemo, useState } from "react";
import { Plus, Search, Download, Pencil, Trash2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import {
  useGetShiftsOverviewQuery,
  useGetShiftAssignmentsQuery,
  useGetBranchesQuery,
  useGetEmployeesQuery,
  useCreateShiftMutation,
  useUpdateShiftMutation,
  useDeleteShiftMutation,
} from "@/features/hrmApi";
import { usePermissions } from "@/hooks/usePermissions";
import { toArray } from "../hrm-utils";

function csvCell(v: unknown): string {
  const s = String(v ?? "");
  return /^[=+\-@]/.test(s) ? `'${s}` : s;
}

/** "10m" / "8h" / "1.5x" — or "—" when the value is absent. */
function unit(v: unknown, suffix: string): string {
  return v === null || v === undefined || v === "" ? "—" : `${v}${suffix}`;
}

export function HrmAttendanceShifts() {
  const { can } = usePermissions();
  const canEdit = can("hrEmployeeEdit");

  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editShift, setEditShift] = useState<any>(null);

  const shifts = useGetShiftsOverviewQuery();
  const assignments = useGetShiftAssignmentsQuery({ page: 1, limit: 200 });
  const branches = useGetBranchesQuery();
  const employees = useGetEmployeesQuery({ page: 1, limit: 100 });
  const [createShift] = useCreateShiftMutation();
  const [updateShift] = useUpdateShiftMutation();
  const [deleteShift] = useDeleteShiftMutation();

  const branchNames = useMemo(() => {
    const m: Record<string, string> = {};
    toArray(branches?.data).forEach((b: any) => { m[b.id] = b.name; });
    return m;
  }, [branches]);

  const shiftList = useMemo(() => {
    const list = toArray(shifts.data?.data.items);
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter((s: any) => `${s.name} ${s.type}`.toLowerCase().includes(q));
  }, [shifts.data, search]);

  const assignList = toArray(assignments.data?.items);

  const inputCls = "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500";

  const initialForm = editShift ?? {
    name: "", type: "FIXED", startTime: "09:00", endTime: "17:00",
    graceMinutes: 10, breakMinutes: 60, minWorkingHours: 8,
    otThresholdMinutes: 30, otMultiplier: 1.5, weeklyOff: "FRIDAY", branchId: "",
  };

  return (
    <div>
      {/* Shift Definitions */}
      <div className="hrm-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 style={{ fontSize: 14, fontWeight: 800, color: "var(--hrm-text)", margin: 0 }}>Shift Definitions</h2>
          {canEdit && (
            <button className="hrm-pill hrm-pill-active" onClick={() => { setEditShift(null); setShowModal(true); }}>
              <Plus size={13} /> Add Shift
            </button>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="hrm-search" style={{ width: 260 }}>
            <Search size={14} className="text-[#94A3B8]" />
            <input placeholder="Search shift..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <button className="hrm-pill" onClick={() => {
            const header = ["Name", "Type", "Start", "End", "Grace", "Break", "Min Hrs", "OT Threshold", "OT Multiplier", "Weekly Off", "Active"];
            const lines = shiftList.map((s: any) =>
              [s.name, s.type, s.startTime, s.endTime,
                s.graceMinutes ?? "", s.breakMinutes ?? "", s.minWorkingHours ?? "",
                s.otThresholdMinutes ?? "", s.otMultiplier ?? "", s.weeklyOff, s.active ? "Yes" : "No"].map(csvCell).join(",")
            );
            const csv = "\uFEFF" + header.join(",") + "\n" + lines.join("\n");
            const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
            const a = document.createElement("a"); a.href = url; a.download = "shifts.csv"; a.click(); URL.revokeObjectURL(url);
          }}><Download size={13} /> CSV</button>
        </div>

        <div className="overflow-x-auto">
          <table className="hrm-table">
            <thead><tr>{["Shift", "Type", "Start — End", "Grace", "Break", "Min Hrs", "OT Rule", "Weekly Off", "Active", ...(canEdit ? ["Actions"] : [])].map((h) => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {shifts.isLoading && <tr><td colSpan={10}><div className="hrm-loading-block" style={{ margin: 16 }} /></td></tr>}
              {!shifts.isLoading && shiftList.length === 0 && (
                <tr><td colSpan={10} className="p-10 text-center text-sm" style={{ color: "var(--hrm-muted)" }}>
                  No shifts defined — starter shifts seed automatically on first org view.
                </td></tr>
              )}
              {shiftList.map((s: any) => (
                <tr key={s.id}>
                  <td>
                    <p style={{ margin: 0, fontSize: 12.5, fontWeight: 700, color: "var(--hrm-text)" }}>{s.name}</p>
                    <p style={{ margin: 0, fontSize: 10.5, color: "var(--hrm-muted)" }}>
                      {s.branchId ? branchNames[s.branchId] ?? "Branch" : "All branches"}
                    </p>
                  </td>
                  <td><span className="hrm-type-badge">{s.type}</span></td>
                  <td>{s.startTime} — {s.endTime}</td>
                  <td>{unit(s.graceMinutes, "m")}</td>
                  <td>{unit(s.breakMinutes, "m")}</td>
                  <td>{unit(s.minWorkingHours, "h")}</td>
                  <td>{s.otThresholdMinutes == null ? "—" : `+${s.otThresholdMinutes}m`} · WD {s.otMultiplier == null ? "—" : `${s.otMultiplier}×`}</td>
                  <td>{s.weeklyOff || "—"}</td>
                  <td>{s.active ? <span className="hrm-chip hrm-chip-active">Active</span> : <span className="hrm-chip hrm-chip-resigned">Inactive</span>}</td>
                  {canEdit && (
                    <td className="whitespace-nowrap">
                      <button className="hrm-row-action" style={{ color: "#64748B", marginRight: 8 }} title="Edit"
                        onClick={() => { setEditShift(s); setShowModal(true); }}>
                        <Pencil size={13} />
                      </button>
                      {!s.active && (
                        <button className="hrm-row-action" style={{ color: "#059669", marginRight: 8 }} title="Activate"
                          onClick={async () => {
                            try {
                              await updateShift({ id: s.id, data: { active: true } }).unwrap();
                              toast.success(`${s.name} activated.`);
                            } catch (err: any) { toast.error(err?.data?.message ?? "Failed to activate."); }
                          }}>
                          <RotateCcw size={13} />
                        </button>
                      )}
                      <button className="hrm-row-action" title={s.currentAssignments > 0 ? "Deactivate (assignments exist)" : "Delete"}
                        onClick={async () => {
                          try {
                            const r = await deleteShift(s.id).unwrap();
                            if (r.deactivated) toast.warning(r.message ?? "Shift deactivated — assignments exist.");
                            else toast.success(r.message ?? "Shift deleted.");
                          } catch (err: any) { toast.error(err?.data?.message ?? "Failed to delete."); }
                        }}>
                        <Trash2 size={13} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: "10px 16px", borderTop: "1px solid var(--hrm-border)", fontSize: 11.5, color: "var(--hrm-muted)" }}>
          {shiftList.length} records
        </div>
      </div>

      {/* Assignment register */}
      <div className="hrm-card mt-5" style={{ overflow: "hidden" }}>
        <div style={{ borderBottom: "1px solid var(--hrm-border)", background: "#FAFBFD", padding: "10px 16px" }}>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 800, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--hrm-muted)" }}>
            Current shift assignments (read-only)
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="hrm-table">
            <thead><tr>{["Employee", "Shift", "From", "To"].map((h) => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {assignments.isLoading && <tr><td colSpan={4}><div className="hrm-loading-block" style={{ margin: 16 }} /></td></tr>}
              {!assignments.isLoading && toArray(assignments.data?.items).length === 0 && (
                <tr><td colSpan={4} className="p-10 text-center text-sm" style={{ color: "var(--hrm-muted)" }}>No current shift assignments.</td></tr>
              )}
              {toArray(assignments.data?.items).map((a: any) => (
                <tr key={a.id}>
                  <td style={{ fontWeight: 600, color: "var(--hrm-text)" }}>
                    {a.employee.fullName} <span style={{ fontSize: 10.5, color: "var(--hrm-muted)" }}>({a.employee.code})</span>
                  </td>
                  <td>{a.shift.name} <span style={{ fontSize: 10.5, color: "var(--hrm-muted)" }}>({a.shift.startTime}–{a.shift.endTime})</span></td>
                  <td>{a.fromDate}</td>
                  <td>{a.toDate ?? "ongoing"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Shift modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl p-5 max-h-[92vh] overflow-y-auto">
            <h2 style={{ fontSize: 15, fontWeight: 800, color: "var(--hrm-text)", margin: "0 0 16px" }}>
              {editShift ? "Edit Shift" : "Add Shift"}
            </h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                if (editShift) {
                  await updateShift({ id: editShift.id, data: initialForm }).unwrap();
                  toast.success("Shift updated.");
                } else {
                  await createShift(initialForm).unwrap();
                  toast.success("Shift created.");
                }
                setShowModal(false);
              } catch (err: any) { toast.error(err?.data?.message ?? err?.message ?? "Failed."); }
            }} className="space-y-3">
              <ShiftFormFields initial={initialForm} branches={toArray(branches?.data)} />
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="rounded-md border border-gray-300 px-4 py-2 text-sm" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="rounded-md px-5 py-2 text-sm font-bold text-white" style={{ background: "var(--hrm-emerald-deep)" }}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// These are referenced in the JSX but need to be available
let initialForm: any;

function ShiftFormFields({ initial, branches }: { initial: any; branches: any[] }) {
  const [form, setForm] = useState(initial);
  initialForm = form;

  const inputCls = "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500";
  return (
    <>
      <input className={inputCls} placeholder="Shift name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      <div className="grid grid-cols-2 gap-3">
        <input type="time" className={inputCls} value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} required />
        <input type="time" className={inputCls} value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} required />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div><label className="text-xs text-gray-500">Grace (min)</label><input type="number" className={inputCls} value={form.graceMinutes} onChange={(e) => setForm({ ...form, graceMinutes: +e.target.value })} /></div>
        <div><label className="text-xs text-gray-500">Break (min)</label><input type="number" className={inputCls} value={form.breakMinutes} onChange={(e) => setForm({ ...form, breakMinutes: +e.target.value })} /></div>
        <div><label className="text-xs text-gray-500">Min hrs</label><input type="number" step="0.5" className={inputCls} value={form.minWorkingHours} onChange={(e) => setForm({ ...form, minWorkingHours: +e.target.value })} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="text-xs text-gray-500">OT threshold (min)</label><input type="number" className={inputCls} value={form.otThresholdMinutes} onChange={(e) => setForm({ ...form, otThresholdMinutes: +e.target.value })} /></div>
        <div><label className="text-xs text-gray-500">OT multiplier</label><input type="number" step="0.1" className={inputCls} value={form.otMultiplier} onChange={(e) => setForm({ ...form, otMultiplier: +e.target.value })} /></div>
      </div>
      <input className={inputCls} placeholder="Weekly off (e.g. FRIDAY)" value={form.weeklyOff} onChange={(e) => setForm({ ...form, weeklyOff: e.target.value })} />
      <select className={inputCls} value={form.branchId ?? ""} onChange={(e) => setForm({ ...form, branchId: e.target.value })}>
        <option value="">All branches</option>
        {branches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
      </select>
    </>
  );
}
