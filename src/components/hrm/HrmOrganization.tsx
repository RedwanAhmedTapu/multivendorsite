// src/components/hrm/HrmOrganization.tsx
//
// Branches / Departments / Designations (PHASE C) on the existing org
// master-data APIs — create/edit/delete gated by hrOrgEdit, tenant-scoped,
// with the P0 reference guards ("Cannot delete this branch because N
// employee(s)…"). Employee counts derive from the employee directory map
// (first 100 employees — honest limitation shown when the tenant is larger).

"use client";

import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Download, Search } from "lucide-react";
import { toast } from "sonner";
import {
  useGetBranchesQuery,
  useGetDepartmentsQuery,
  useGetDesignationsQuery,
  useGetEmployeesQuery,
  useCreateBranchMutation,
  useUpdateBranchMutation,
  useDeleteBranchMutation,
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
  useDeleteDepartmentMutation,
  useCreateDesignationMutation,
  useUpdateDesignationMutation,
  useDeleteDesignationMutation,
  useGetBranchCountsQuery,
} from "@/features/hrmApi";
import { usePermissions } from "@/hooks/usePermissions";
import { SimpleFormDialog, type FormFieldDef } from "@/othersfeatures/hrm/components/employee360/SimpleFormDialog";
import { toArray } from "./hrm-utils";

type Tab = "branches" | "departments" | "designations";

function csvCell(v: unknown): string {
  const s = String(v ?? "");
  return /^[=+\-@]/.test(s) ? `'${s}` : s;
}

export function HrmOrganization() {
  const { can } = usePermissions();
  const canEdit = can("hrOrgEdit");

  const [tab, setTab] = useState<Tab>("branches");
  const [search, setSearch] = useState("");
  const [dialog, setDialog] = useState<{ mode: "add" | "edit"; row?: any } | null>(null);
  const [busy, setBusy] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);

  const { data: branches, isLoading: bLoading } = useGetBranchesQuery();
  const { data: departments } = useGetDepartmentsQuery();
  const { data: designations } = useGetDesignationsQuery();
  const employeesQuery = useGetEmployeesQuery({ page: 1, limit: 100 });
  const employeesFull = (employeesQuery.data?.total ?? 0) <= 100;
  const branchCounts = useGetBranchCountsQuery();

  const [createBranch, { isLoading: creatingB }] = useCreateBranchMutation();
  const [updateBranch] = useUpdateBranchMutation();
  const [deleteBranch] = useDeleteBranchMutation();
  const [createDepartment] = useCreateDepartmentMutation();
  const [updateDepartment] = useUpdateDepartmentMutation();
  const [deleteDepartment] = useDeleteDepartmentMutation();
  const [createDesignation] = useCreateDesignationMutation();
  const [updateDesignation] = useUpdateDesignationMutation();
  const [deleteDesignation] = useDeleteDesignationMutation();

  const empByBranch = useMemo(() => {
    // Server-side grouped counts (PHASE C2) — exact for any tenant size.
    const m: Record<string, number> = {};
    (branchCounts.data?.data.items ?? []).forEach((c) => {
      if (c.branchId) m[c.branchId] = c.count;
    });
    return m;
  }, [branchCounts.data]);

  const branchList = toArray(branches?.data);
  const stats = {
    branches: branchList.length,
    geo: branchList.filter((b) => b.latitude != null && b.longitude != null).length,
    stores: branchList.filter((b) => b.type === "STORE").length,
    warehouses: branchList.filter((b) => b.type === "WAREHOUSE").length,
  };

  const q = search.trim().toLowerCase();
  const filteredBranches = branchList.filter((b) => !q || `${b.name} ${b.code} ${b.type}`.toLowerCase().includes(q));
  const filteredDepartments = (departments?.data ?? []).filter((d) => !q || `${d.name} ${d.code}`.toLowerCase().includes(q));
  const filteredDesignations = (designations?.data ?? []).filter((d) => !q || `${d.name} ${d.code} ${d.grade ?? ""}`.toLowerCase().includes(q));

  function exportCsv() {
    let header: string[], lines: string[];
    if (tab === "branches") {
      header = ["Code", "Branch", "Type", "Address", "Hours", "Status"];
      lines = filteredBranches.map((b) => [b.code, b.name, b.type, b.address, b.operatingHours, b.active ? "Active" : "Inactive"].map(csvCell).join(","));
    } else if (tab === "departments") {
      header = ["Code", "Department", "Branch", "Status"];
      lines = filteredDepartments.map((d) => [d.code, d.name, d.branch?.name ?? "", d.status].map(csvCell).join(","));
    } else {
      header = ["Code", "Designation", "Department", "Grade", "Min Salary", "Max Salary", "Status"];
      lines = filteredDesignations.map((d) => [d.code, d.name, d.department?.name ?? "", d.grade ?? "", d.minSalary ?? "", d.maxSalary ?? "", d.status].map(csvCell).join(","));
    }
    const csv = "\uFEFF" + header.join(",") + "\n" + lines.join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `hrm-${tab}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function save(values: Record<string, unknown>) {
    if (!dialog) return;
    setBusy(true);
    setDialogError(null);
    try {
      if (dialog.mode === "add") {
        if (tab === "branches") await createBranch(values as any).unwrap();
        else if (tab === "departments") await createDepartment(values as any).unwrap();
        else await createDesignation(values as any).unwrap();
      } else {
        const id = dialog.row.id;
        if (tab === "branches") await updateBranch({ id, data: values }).unwrap();
        else if (tab === "departments") await updateDepartment({ id, data: values }).unwrap();
        else await updateDesignation({ id, data: values }).unwrap();
      }
      toast.success(dialog.mode === "add" ? "Created." : "Saved.");
      setDialog(null);
    } catch (err: any) {
      setDialogError(err?.data?.message || err?.message || "Failed to save.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(row: any) {
    const label = tab === "branches" ? "branch" : tab === "departments" ? "department" : "designation";
    if (!window.confirm(`Archive this ${label}? It stays in the database and can be reactivated.`)) return;
    try {
      if (tab === "branches") await deleteBranch(row.id).unwrap();
      else if (tab === "departments") await deleteDepartment(row.id).unwrap();
      else await deleteDesignation(row.id).unwrap();
      toast.success("Archived.");
    } catch (err: any) {
      // Reference guards ("Cannot delete this branch because N employee(s)…")
      toast.error(err?.data?.message || "Delete failed.");
    }
  }

  const branchFields: FormFieldDef[] = [
    { name: "code", label: "Code", hint: "Leave blank to auto-generate as BR-0001, BR-0002, …" },
    { name: "name", label: "Branch name", required: true },
    { name: "type", label: "Type", type: "select", options: [
      { value: "OFFICE", label: "Office" }, { value: "STORE", label: "Store" },
      { value: "WAREHOUSE", label: "Warehouse" }, { value: "OTHER", label: "Other" },
    ] },
    { name: "operatingHours", label: "Operating hours", hint: "e.g. 09:00-18:00" },
    { name: "address", label: "Address", type: "textarea" },
    { name: "contact", label: "Contact" },
    { name: "latitude", label: "Latitude", type: "number" },
    { name: "longitude", label: "Longitude", type: "number" },
  ];
  const departmentFields: FormFieldDef[] = [
    { name: "code", label: "Code", hint: "Leave blank to auto-generate as DEPT-0001, DEPT-0002, …" },
    { name: "name", label: "Department name", required: true },
    { name: "branchId", label: "Branch", type: "select", options: branchList.map((b) => ({ value: b.id, label: b.name })) },
  ];
  const designationFields: FormFieldDef[] = [
    { name: "code", label: "Code", hint: "Leave blank to auto-generate as DESIG-0001, DESIG-0002, …" },
    { name: "name", label: "Designation name", required: true },
    { name: "departmentId", label: "Department", type: "select", options: (departments?.data ?? []).map((d) => ({ value: d.id, label: d.name })) },
    { name: "grade", label: "Grade", hint: "A / B / C" },
    { name: "minSalary", label: "Min salary (৳)", type: "number" },
    { name: "maxSalary", label: "Max salary (৳)", type: "number" },
  ];

  const fields = tab === "branches" ? branchFields : tab === "departments" ? departmentFields : designationFields;
  const addLabel = tab === "branches" ? "Add Branch" : tab === "departments" ? "Add Department" : "Add Designation";

  return (
    <div>
      <h1 className="hrm-page-title">Organization Structure</h1>
      <p className="hrm-page-subtitle">Branches with geo-fence, departments and designations</p>

      <div className="flex gap-1.5">
        {(["branches", "departments", "designations"] as Tab[]).map((t) => (
          <button key={t} className={`hrm-pill ${tab === t ? "hrm-pill-active" : ""}`} onClick={() => { setTab(t); setDialog(null); }}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === "branches" && (
        <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { label: "Branches", value: stats.branches, tile: "hrm-tile-emerald" },
            { label: "Geo-fenced", value: stats.geo, tile: "hrm-tile-emerald" },
            { label: "Stores", value: stats.stores, tile: "hrm-tile-purple" },
            { label: "Warehouses", value: stats.warehouses, tile: "hrm-tile-orange" },
          ].map((s) => (
            <div key={s.label} className="hrm-card hrm-stat-card">
              <div><p className="hrm-stat-label">{s.label}</p><p className="hrm-stat-value">{s.value}</p></div>
              <div className={`hrm-stat-tile ${s.tile}`}><span style={{ fontSize: 18, fontWeight: 800 }}>{s.value}</span></div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        {canEdit ? (
          <button className="hrm-pill hrm-pill-active" onClick={() => { setDialogError(null); setDialog({ mode: "add" }); }}>
            <Plus size={13} /> {addLabel}
          </button>
        ) : <span />}
        <div className="flex items-center gap-3">
          <div className="hrm-search" style={{ width: 260 }}>
            <Search size={14} className="text-[#94A3B8]" />
            <input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <button className="hrm-pill" onClick={exportCsv}><Download size={13} /> CSV</button>
        </div>
      </div>

      <div className="hrm-card mt-4" style={{ overflow: "hidden" }}>
        <div className="overflow-x-auto">
          {tab === "branches" && (
            <table className="hrm-table">
              <thead><tr>
                {["Branch", "Address", "Geo-Fence", "Hours", "Employees", "Status", ...(canEdit ? ["Actions"] : [])].map((h) => <th key={h}>{h}</th>)}
              </tr></thead>
              <tbody>
                {bLoading && <tr><td colSpan={8}><div className="hrm-loading-block" style={{ margin: 16 }} /></td></tr>}
                {filteredBranches.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <p style={{ margin: 0, fontWeight: 700, color: "var(--hrm-text)" }}>{b.name}</p>
                      <p style={{ margin: 0, fontSize: 11, color: "var(--hrm-muted)" }}>{b.code} · {b.type}</p>
                    </td>
                    <td>{b.address || "—"}</td>
                    <td>
                      {b.latitude != null && b.longitude != null
                        ? <span className="hrm-chip hrm-chip-active">◎ Geo-tagged</span>
                        : <span style={{ color: "var(--hrm-muted)" }}>—</span>}
                    </td>
                    <td>{b.operatingHours || "—"}</td>
                    <td>{empByBranch[b.id] ?? 0}</td>
                    <td>{b.active ? <span className="hrm-chip hrm-chip-active">Active</span> : <span className="hrm-chip hrm-chip-resigned">Inactive</span>}</td>
                    {canEdit && (
                      <td className="whitespace-nowrap">
                        <button className="hrm-row-action" style={{ color: "#64748B", marginRight: 10 }} onClick={() => { setDialogError(null); setDialog({ mode: "edit", row: b }); }}><Pencil size={13} /></button>
                        <button className="hrm-row-action" onClick={() => remove(b)}><Trash2 size={13} /></button>
                      </td>
                    )}
                  </tr>
                ))}
                {!bLoading && filteredBranches.length === 0 && (
                  <tr><td colSpan={8} className="p-10 text-center text-sm" style={{ color: "var(--hrm-muted)" }}>No branches yet — use Add Branch to bootstrap your org structure.</td></tr>
                )}
              </tbody>
            </table>
          )}

          {tab === "departments" && (
            <table className="hrm-table">
              <thead><tr>
                {["Department", "Branch", "Status", ...(canEdit ? ["Actions"] : [])].map((h) => <th key={h}>{h}</th>)}
              </tr></thead>
              <tbody>
                {filteredDepartments.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <p style={{ margin: 0, fontWeight: 700, color: "var(--hrm-text)" }}>{d.name}</p>
                      <p style={{ margin: 0, fontSize: 11, color: "var(--hrm-muted)" }}>{d.code}</p>
                    </td>
                    <td>{d.branch?.name || "—"}</td>
                    <td>{d.status === "ACTIVE" ? <span className="hrm-chip hrm-chip-active">Active</span> : <span className="hrm-chip hrm-chip-resigned">{d.status}</span>}</td>
                    {canEdit && (
                      <td className="whitespace-nowrap">
                        <button className="hrm-row-action" style={{ color: "#64748B", marginRight: 10 }} onClick={() => { setDialogError(null); setDialog({ mode: "edit", row: d }); }}><Pencil size={13} /></button>
                        <button className="hrm-row-action" onClick={() => remove(d)}><Trash2 size={13} /></button>
                      </td>
                    )}
                  </tr>
                ))}
                {filteredDepartments.length === 0 && (
                  <tr><td colSpan={4} className="p-10 text-center text-sm" style={{ color: "var(--hrm-muted)" }}>No departments yet.</td></tr>
                )}
              </tbody>
            </table>
          )}

          {tab === "designations" && (
            <table className="hrm-table">
              <thead><tr>
                {["Designation", "Department", "Grade", "Salary band", "Status", ...(canEdit ? ["Actions"] : [])].map((h) => <th key={h}>{h}</th>)}
              </tr></thead>
              <tbody>
                {filteredDesignations.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <p style={{ margin: 0, fontWeight: 700, color: "var(--hrm-text)" }}>{d.name}</p>
                      <p style={{ margin: 0, fontSize: 11, color: "var(--hrm-muted)" }}>{d.code}</p>
                    </td>
                    <td>{d.department?.name || "—"}</td>
                    <td>{d.grade || "—"}</td>
                    <td>{d.minSalary != null ? `৳${Number(d.minSalary).toLocaleString()} – ৳${Number(d.maxSalary).toLocaleString()}` : "—"}</td>
                    <td>{d.status === "ACTIVE" ? <span className="hrm-chip hrm-chip-active">Active</span> : <span className="hrm-chip hrm-chip-resigned">{d.status}</span>}</td>
                    {canEdit && (
                      <td className="whitespace-nowrap">
                        <button className="hrm-row-action" style={{ color: "#64748B", marginRight: 10 }} onClick={() => { setDialogError(null); setDialog({ mode: "edit", row: d }); }}><Pencil size={13} /></button>
                        <button className="hrm-row-action" onClick={() => remove(d)}><Trash2 size={13} /></button>
                      </td>
                    )}
                  </tr>
                ))}
                {filteredDesignations.length === 0 && (
                  <tr><td colSpan={6} className="p-10 text-center text-sm" style={{ color: "var(--hrm-muted)" }}>No designations yet.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {dialog && (
        <SimpleFormDialog
          title={`${dialog.mode === "add" ? addLabel : "Edit " + addLabel.replace("Add ", "")}`}
          fields={fields}
          initial={dialog.mode === "edit" ? dialog.row : null}
          loading={busy || creatingB}
          error={dialogError}
          onSave={save}
          onClose={() => setDialog(null)}
        />
      )}
    </div>
  );
}
