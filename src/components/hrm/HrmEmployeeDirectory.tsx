// src/components/hrm/HrmEmployeeDirectory.tsx
//
// The /hrm Employee Directory (PHASE B), restyled to the HRM workspace
// visual language. Reuses the EXISTING FinixMart HR APIs and the existing
// EmployeeFormModal — no backend changes, no duplicated endpoints.
//
// Preserved guarantees: salary hidden without hrSalaryView, bank masked
// without hrBankView, archive/hard-delete gated by hrEmployeeDelete with
// server-verified typed code, tenant isolation via the scoped APIs.

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users, Search, ChevronLeft, ChevronRight, ArrowUpDown, Trash2, Download,
  ShieldAlert, Plus,
} from "lucide-react";
import { toast } from "sonner";
import {
  useGetEmployeesQuery,
  useGetBranchesQuery,
  useGetDepartmentsQuery,
  useDeactivateEmployeeMutation,
  useHardDeleteEmployeeMutation,
} from "@/features/hrmApi";
import { useToggleAdminEmployeeStatusMutation, useToggleVendorEmployeeStatusMutation } from "@/features/employeeApi";
import { usePermissions } from "@/hooks/usePermissions";
import { EmployeeStatusBadge } from "@/othersfeatures/hrm/components/employee360/EmployeeStatusBadge";
import { toArray } from "./hrm-utils";
import { EmployeeFormModal } from "@/othersfeatures/hrm/components/EmployeeFormModal";
import type { HrEmployeeProfile } from "@/features/hrmApi";

const STATUS_FILTERS = ["ACTIVE", "PROBATION", "ON_LEAVE", "RESIGNED", "TERMINATED"] as const;

const SORTABLE: Array<{ key: string; label: string; value: (r: HrEmployeeProfile) => string }> = [
  { key: "fullName", label: "Employee", value: (r) => r.fullName ?? "" },
  { key: "department", label: "Department", value: (r) => r.department?.name ?? "" },
  { key: "branch", label: "Branch", value: (r) => r.branch?.name ?? "" },
  { key: "type", label: "Type", value: (r) => r.employmentType ?? "" },
  { key: "status", label: "Status", value: (r) => r.status ?? "" },
  { key: "joiningDate", label: "Joined", value: (r) => r.joiningDate ?? "" },
  { key: "mobile", label: "Mobile", value: (r) => r.mobile ?? "" },
];

function csvCell(v: unknown): string {
  const s = String(v ?? "");
  // CSV formula-injection guard (HRM pattern)
  return /^[=+\-@]/.test(s) ? `'${s}` : s;
}

function initials(name?: string | null): string {
  if (!name) return "?";
  return name.split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

export function HrmEmployeeDirectory() {
  const router = useRouter();
  const { me, can } = usePermissions();
  const scope: "admin" | "vendor" = me?.role === "VENDOR" ? "vendor" : "admin";

  // ── Filters ──
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [branchId, setBranchId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | null>(null);

  const filters = {
    search: search || undefined,
    status: status || undefined,
    branchId: branchId || undefined,
    departmentId: departmentId || undefined,
    page,
    limit: 20,
  };

  // ── Real data ──
  const { data, isLoading, isError } = useGetEmployeesQuery(filters);
  const { data: branches } = useGetBranchesQuery();
  const { data: departments } = useGetDepartmentsQuery();

  const total = useGetEmployeesQuery({ page: 1, limit: 1 });
  const active = useGetEmployeesQuery({ status: "ACTIVE", page: 1, limit: 1 });
  const probation = useGetEmployeesQuery({ status: "PROBATION", page: 1, limit: 1 });
  const resigned = useGetEmployeesQuery({ status: "RESIGNED", page: 1, limit: 1 });
  const terminated = useGetEmployeesQuery({ status: "TERMINATED", page: 1, limit: 1 });
  const exited = (resigned.data?.total ?? 0) + (terminated.data?.total ?? 0);

  // ── Mutations ──
  const [deactivate] = useDeactivateEmployeeMutation();
  const [hardDelete, { isLoading: deleting }] = useHardDeleteEmployeeMutation();
  const [toggleAdmin] = useToggleAdminEmployeeStatusMutation();
  const [toggleVendor] = useToggleVendorEmployeeStatusMutation();
  const toggleStatus = scope === "admin" ? toggleAdmin : toggleVendor;

  const [addOpen, setAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<HrEmployeeProfile | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const rows = useMemo(() => {
    const items = data?.items ?? [];
    if (!sort) return items;
    const col = SORTABLE.find((c) => c.key === sort.key);
    if (!col) return items;
    return [...items].sort((a, b) => col.value(a).localeCompare(col.value(b)) * sort.dir);
  }, [data?.items, sort]);

  function exportCsv() {
    const header = ["Code", "Name", "Department", "Branch", "Type", "Status", "Joined", "Mobile"];
    const lines = rows.map((r) =>
      [r.code, r.fullName, r.department?.name, r.branch?.name, r.employmentType, r.status, r.joiningDate, r.mobile]
        .map(csvCell).join(",")
    );
    const csv = "\uFEFF" + header.join(",") + "\n" + lines.join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "employee-directory.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function archive(emp: HrEmployeeProfile) {
    if (!window.confirm(`Archive ${emp.fullName}? They disappear from the directory but all history is preserved.`)) return;
    try {
      await deactivate(emp.id).unwrap();
      toast.success(`${emp.fullName} archived (INACTIVE)`);
    } catch (err: any) {
      toast.error(err?.data?.message || "Archive failed.");
    }
  }

  async function confirmHardDelete() {
    if (!deleteTarget) return;
    try {
      const r = await hardDelete({ id: deleteTarget.id, confirm: deleteConfirmText }).unwrap();
      toast.success(r.message ?? "Employee permanently deleted");
      setDeleteTarget(null);
    } catch (err: any) {
      toast.error(err?.data?.message || "Delete failed.");
    }
  }

  function toggleSort(key: string) {
    setSort((s) => (s?.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: 1 }));
  }

  const statCards = [
    { label: "Total", value: total.data?.total ?? "—", tile: "hrm-tile-emerald", icon: Users },
    { label: "Active", value: active.data?.total ?? "—", tile: "hrm-tile-emerald", icon: Users },
    { label: "Probation", value: probation.data?.total ?? "—", tile: "hrm-tile-orange", icon: Users },
    { label: "Exited", value: exited || "—", tile: "hrm-tile-slate", icon: Users },
  ];

  return (
    <div>
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="hrm-page-title">Employee Directory</h1>
          <p className="hrm-page-subtitle">Central employee master — click any row for the 360° profile</p>
        </div>
        {can("hrEmployeeCreate") && (
          <button className="hrm-pill hrm-pill-active" onClick={() => setAddOpen(true)}>
            <Plus size={13} /> Add Employee
          </button>
        )}
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((s) => (
          <div key={s.label} className="hrm-card hrm-stat-card">
            <div>
              <p className="hrm-stat-label">{s.label}</p>
              <p className="hrm-stat-value">{s.value}</p>
            </div>
            <div className={`hrm-stat-tile ${s.tile}`}><s.icon size={18} /></div>
          </div>
        ))}
      </div>

      {/* ── Filter pills + selects ── */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <button
          className={`hrm-pill ${status === "" ? "hrm-pill-active" : ""}`}
          onClick={() => { setStatus(""); setPage(1); }}
        >
          All
        </button>
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            className={`hrm-pill ${status === s ? "hrm-pill-active" : ""}`}
            onClick={() => { setStatus(s); setPage(1); }}
          >
            {s === "ON_LEAVE" ? "On Leave" : s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
        <select
          className="hrm-select"
          value={branchId}
          onChange={(e) => { setBranchId(e.target.value); setPage(1); }}
        >
          <option value="">All branches</option>
          {toArray(branches?.data).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <select
          className="hrm-select"
          value={departmentId}
          onChange={(e) => { setDepartmentId(e.target.value); setPage(1); }}
        >
          <option value="">All departments</option>
          {toArray(departments?.data).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>

      {/* ── Table card ── */}
      <div className="hrm-card mt-4" style={{ overflow: "hidden" }}>
        <div className="flex flex-wrap items-center justify-between gap-3 p-4" style={{ borderBottom: "1px solid var(--hrm-border)" }}>
          <div className="hrm-search" style={{ width: 320 }}>
            <Search size={14} className="text-[#94A3B8]" />
            <input
              placeholder="Search name, code, mobile, email..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <button className="hrm-pill" onClick={exportCsv}>
            <Download size={13} /> CSV
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="hrm-table">
            <thead>
              <tr>
                {SORTABLE.map((c) => (
                  <th key={c.key}>
                    <button onClick={() => toggleSort(c.key)}>
                      {c.label} <ArrowUpDown size={11} className="opacity-50" />
                    </button>
                  </th>
                ))}
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {SORTABLE.map((c) => <td key={c.key}><div className="hrm-loading-block" style={{ height: 12 }} /></td>)}
                    <td />
                  </tr>
                ))}
              {!isLoading && rows.length === 0 && (
                <tr>
                  <td colSpan={SORTABLE.length + 1} className="p-10 text-center text-sm" style={{ color: "var(--hrm-muted)" }}>
                    No employees match the filters.
                  </td>
                </tr>
              )}
              {!isLoading &&
                rows.map((emp) => (
                  <tr key={emp.id} className="hrm-row" onClick={() => router.push(`/hrm/employees/${emp.id}`)}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="hrm-avatar" style={{ width: 32, height: 32, fontSize: 11 }}>{initials(emp.fullName)}</div>
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-bold" style={{ color: "var(--hrm-text)", margin: 0 }}>{emp.fullName}</p>
                          <p className="text-[11px]" style={{ color: "var(--hrm-muted)", margin: 0 }}>
                            {emp.code} · {emp.designation?.name ?? "—"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td>{emp.department?.name || "—"}</td>
                    <td>{emp.branch?.name || "—"}</td>
                    <td><span className="hrm-type-badge">{emp.employmentType}</span></td>
                    <td><EmployeeStatusBadge status={emp.status} /></td>
                    <td>{emp.joiningDate || "—"}</td>
                    <td>{emp.mobile || "—"}</td>
                    <td className="whitespace-nowrap" style={{ textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
                      <Link href={`/hrm/employees/${emp.id}`} className="hrm-row-link">360°</Link>
                      {can("hrEmployeeDelete") && (
                        <>
                          <button
                            className="hrm-row-action"
                            title="Archive (soft delete)"
                            onClick={async () => {
                              if (!window.confirm(`Archive ${emp.fullName}? All history is preserved.`)) return;
                              try {
                                await deactivate(emp.id).unwrap();
                                toast.success(`${emp.fullName} archived (INACTIVE)`);
                              } catch (err: any) {
                                toast.error(err?.data?.message || "Archive failed.");
                              }
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-end gap-2 p-4 text-sm">
            <button className="hrm-pill" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              <ChevronLeft size={13} /> Prev
            </button>
            <span style={{ fontSize: 12, color: "var(--hrm-muted)" }}>
              Page {data.page} of {data.totalPages} · {data.total} employees
            </span>
            <button className="hrm-pill" disabled={page >= data.totalPages} onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}>
              Next <ChevronRight size={13} />
            </button>
          </div>
        )}
      </div>

      {/* ── Add Employee (existing form, existing APIs) ── */}
      {addOpen && (
        <EmployeeFormModal
          scope={scope}
          onClose={() => setAddOpen(false)}
          onCreated={(hrProfileId) => router.push(`/hrm/employees/${hrProfileId}`)}
        />
      )}

      {/* ── Hard delete: typed code confirmation, server re-verified ── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
            <div className="flex items-center gap-2 border-b p-4" style={{ background: "#FEF2F2" }}>
              <ShieldAlert size={18} className="text-red-600" />
              <h2 className="text-base font-semibold text-red-700">Permanently delete {deleteTarget.fullName}</h2>
            </div>
            <div className="space-y-3 p-4">
              <p className="text-sm text-gray-600">
                Irreversible. Removes the employee and their biodata/history. Employees with attendance,
                payroll, leave or finance records cannot be permanently deleted — archive them instead.
              </p>
              <div>
                <label className="mb-1 block text-xs font-bold" style={{ color: "#334155" }}>
                  Type the employee code <span className="font-mono">{deleteTarget.code}</span> to confirm
                </label>
                <input
                  className="w-full rounded-md border border-red-200 px-3 py-2 font-mono text-sm focus:border-red-400 focus:ring-red-100"
                  placeholder={deleteTarget.code}
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2 border-t pt-3">
                <button onClick={() => setDeleteTarget(null)} className="rounded-md border border-gray-300 px-4 py-2 text-sm">Cancel</button>
                <button
                  disabled={deleting || deleteConfirmText !== deleteTarget.code}
                  onClick={confirmHardDelete}
                  className="rounded-md bg-red-600 px-4 py-2 text-sm text-white disabled:opacity-40"
                >
                  {deleting ? "Deleting…" : "Permanently Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
