// src/features/hrm/components/EmployeeTable.tsx
//
// The employee directory — lists HrEmployeeProfile rows via hrmApi with
// ProductForm visual language (ui/section-card tokens). Includes search +
// org/status filters, employee codes, status pills, and row actions:
// View (Employee 360), Edit (profile drawer), and owner-only Permissions /
// Toggle Access (those two live on the base Employee record → employeeApi).
//
// "View" navigates to the Employee 360 page:
//   admin  → /admin-dashboard/employees/[id]
//   vendor → /vendor-dashboard/hrm/employees/[id]

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Search, ChevronLeft, ChevronRight } from "lucide-react";
import {
  useGetEmployeesQuery,
  useGetBranchesQuery,
  useGetDepartmentsQuery,
  useGetDesignationsQuery,
} from "../../../features/hrmApi";
import { toArray } from "@/components/hrm/hrm-utils";
import { useToggleAdminEmployeeStatusMutation, useToggleVendorEmployeeStatusMutation } from "../../../features/employeeApi";
import { usePermissions } from "../../../hooks/usePermissions";
import { SectionCard, FieldError } from "@/components/ui/section-card";
import { SmallOutlineButton } from "@/components/ui/section-buttons";
import { EmployeeStatusBadge } from "./employee360/EmployeeStatusBadge";
import { EmployeeProfileDrawer } from "./EmployeeProfileDrawer";
import { PermissionEditorModal } from "./PermissionEditorModal";
import { toast } from "sonner";

const inputCls =
  "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500";

export function EmployeeTable({ scope }: { scope: "admin" | "vendor" }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [branchId, setBranchId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [designationId, setDesignationId] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const filters = {
    search: search || undefined,
    branchId: branchId || undefined,
    departmentId: departmentId || undefined,
    designationId: designationId || undefined,
    status: status || undefined,
    page,
    limit: 20,
  };

  const { data, isLoading, error } = useGetEmployeesQuery(filters);
  const { data: branches } = useGetBranchesQuery();
  const { data: departments } = useGetDepartmentsQuery();
  const { data: designations } = useGetDesignationsQuery();
  const { isOwner } = usePermissions();

  const [toggleAdmin] = useToggleAdminEmployeeStatusMutation();
  const [toggleVendor] = useToggleVendorEmployeeStatusMutation();
  const toggleStatus = scope === "admin" ? toggleAdmin : toggleVendor;

  const [profileDrawerId, setProfileDrawerId] = useState<string | null>(null);
  const [permissionModal, setPermissionModal] = useState<{ id: string; name: string } | null>(null);

  const view360 = (id: string) =>
    router.push(scope === "admin" ? `/admin-dashboard/employees/${id}` : `/vendor-dashboard/hrm/employees/${id}`);

  return (
    <SectionCard
      icon={<Users size={16} className="text-indigo-600" />}
      title="Employee directory"
      subtitle={scope === "admin" ? "Platform staff" : "Your store's staff"}
      noBodyPadding
    >
      {/* ── Filters ── */}
      <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-5">
        <div className="relative col-span-2">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className={`${inputCls} pl-8`}
            placeholder="Search by name, code, mobile…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select className={inputCls} value={branchId} onChange={(e) => { setBranchId(e.target.value); setPage(1); }}>
          <option value="">All branches</option>
          {toArray(branches?.data).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <select className={inputCls} value={departmentId} onChange={(e) => { setDepartmentId(e.target.value); setPage(1); }}>
          <option value="">All departments</option>
          {toArray(departments?.data).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select className={inputCls} value={designationId} onChange={(e) => { setDesignationId(e.target.value); setPage(1); }}>
          <option value="">All designations</option>
          {toArray(designations?.data).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select className={`${inputCls} md:col-span-1`} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All statuses</option>
          {["ACTIVE", "PROBATION", "ON_LEAVE", "SUSPENDED", "RESIGNED", "TERMINATED", "RETIRED", "INACTIVE"].map((s) => (
            <option key={s} value={s}>{s.replaceAll("_", " ")}</option>
          ))}
        </select>
      </div>

      <FieldError message={!isLoading && error ? "Failed to load employees." : null} />

      {/* ── Table ── */}
      <div className="overflow-x-auto" style={{ borderTop: "1px solid #F0F4FA", margin: "0 -18px", padding: "0 18px" }}>
        <table className="min-w-full divide-y divide-gray-100 text-sm">
          <thead>
            <tr>
              {["Employee", "Branch", "Department", "Designation", "Type", "Status", ""].map((h) => (
                <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 7 }).map((__, j) => (
                    <td key={j} className="px-3 py-3"><div className="h-3.5 animate-pulse rounded bg-gray-100" /></td>
                  ))}
                </tr>
              ))}
            {!isLoading && data?.items.length === 0 && (
              <tr><td colSpan={7} className="px-3 py-10 text-center text-gray-400">No employees match these filters.</td></tr>
            )}
            {data?.items.map((emp) => (
              <tr key={emp.id} className="cursor-pointer hover:bg-gray-50/60" onClick={() => view360(emp.id)}>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-indigo-600"
                      style={{ background: "#EEF3FB" }}
                    >
                      {emp.fullName.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-gray-900">{emp.fullName}</div>
                      <div className="text-xs text-gray-400">{emp.code} · {emp.mobile || "—"}</div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3 text-gray-600">{emp.branch?.name || "—"}</td>
                <td className="px-3 py-3 text-gray-600">{emp.department?.name || "—"}</td>
                <td className="px-3 py-3 text-gray-600">{emp.designation?.name || "—"}</td>
                <td className="px-3 py-3 text-gray-600">{emp.employmentType}</td>
                <td className="px-3 py-3"><EmployeeStatusBadge status={emp.status} /></td>
                <td className="px-3 py-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                  <button className="mr-3 text-xs text-indigo-600 hover:underline" onClick={() => view360(emp.id)}>
                    View
                  </button>
                  <button className="mr-3 text-xs text-gray-500 hover:underline" onClick={() => setProfileDrawerId(emp.id)}>
                    Edit
                  </button>
                  {isOwner && (
                    <>
                      <button
                        className="mr-3 text-xs text-amber-600 hover:underline"
                        onClick={() => setPermissionModal({ id: emp.linkedEmployeeId, name: emp.fullName })}
                      >
                        Permissions
                      </button>
                      <button
                        className="text-xs text-red-600 hover:underline"
                        onClick={async () => {
                          try {
                            await toggleStatus(emp.linkedEmployeeId).unwrap();
                            toast.success("Account status updated.");
                          } catch (err: any) {
                            toast.error(err?.data?.message || "Failed to toggle access.");
                          }
                        }}
                      >
                        Toggle Access
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      {data && data.totalPages > 1 && (
        <div className="mt-3 flex items-center justify-end gap-2 text-sm">
          <SmallOutlineButton onClick={() => setPage((p) => Math.max(1, p - 1))} icon={<ChevronLeft size={13} />}>
            Prev
          </SmallOutlineButton>
          <span className="text-gray-500">Page {data.page} of {data.totalPages} · {data.total} employees</span>
          <SmallOutlineButton onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}>
            Next <ChevronRight size={13} />
          </SmallOutlineButton>
        </div>
      )}

      {profileDrawerId && <EmployeeProfileDrawer employeeId={profileDrawerId} onClose={() => setProfileDrawerId(null)} />}
      {permissionModal && (
        <PermissionEditorModal
          employeeId={permissionModal.id}
          employeeName={permissionModal.name}
          onClose={() => setPermissionModal(null)}
        />
      )}
    </SectionCard>
  );
}
