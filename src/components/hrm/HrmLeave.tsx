// src/components/hrm/HrmLeave.tsx
//
// Leave Management (PHASE C) on the existing leave APIs:
//   Requests tab  — real: GET /hrm/leave/requests (includes leaveType),
//                   Approve/Reject via PATCH /:id/act (umbrella HR gate).
//   Leave Types   — real: manage list (includes deactivated) + create +
//                   policy edit + activate/deactivate, gated hrLeaveTypesEdit.
//                   No hard delete exists for types — by design.

"use client";

import { useMemo, useState } from "react";
import { Plus, Download } from "lucide-react";
import { toast } from "sonner";
import {
  useGetAllLeaveRequestsQuery,
  useGetManageLeaveTypesQuery,
  useGetEmployeesQuery,
  useActOnLeaveMutation,
  useCreateLeaveTypeMutation,
  useUpdateLeaveTypeMutation,
  type HrLeaveRequest,
} from "@/features/hrmApi";
import { usePermissions } from "@/hooks/usePermissions";
import { SimpleFormDialog, type FormFieldDef } from "@/othersfeatures/hrm/components/employee360/SimpleFormDialog";

function csvCell(v: unknown): string {
  const s = String(v ?? "");
  return /^[=+\-@]/.test(s) ? `'${s}` : s;
}

export function HrmLeave() {
  const { can } = usePermissions();
  const canAct = can("hrManagement");
  const canEditTypes = can("hrLeaveTypesEdit");

  const [tab, setTab] = useState<"requests" | "types">("requests");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [dialog, setDialog] = useState<{ mode: "add" | "edit"; row?: any } | null>(null);
  const [busy, setBusy] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);

  const { data: employees } = useGetEmployeesQuery({ page: 1, limit: 100 });
  const nameOf = useMemo(() => {
    const m: Record<string, string> = {};
    (employees?.items ?? []).forEach((e) => { m[e.id] = e.fullName; });
    return m;
  }, [employees]);

  const requests = useGetAllLeaveRequestsQuery({ page, limit: 20 });
  const types = useGetManageLeaveTypesQuery();

  const [actOn] = useActOnLeaveMutation();
  const [createType] = useCreateLeaveTypeMutation();
  const [updateType] = useUpdateLeaveTypeMutation();

  const rows = useMemo(() => {
    const items = requests.data?.items ?? [];
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter((r) =>
      `${nameOf[r.employeeId] ?? r.employeeId} ${r.leaveType?.name ?? ""} ${r.status}`.toLowerCase().includes(q)
    );
  }, [requests.data?.items, search, nameOf]);

  async function act(r: HrLeaveRequest, status: "APPROVED" | "REJECTED") {
    try {
      await actOn({ id: r.id, status }).unwrap();
      toast.success(`Leave request ${status.toLowerCase()}.`);
    } catch (err: any) {
      toast.error(err?.data?.message || "Action failed.");
    }
  }

  const typeFields: FormFieldDef[] = [
    { name: "code", label: "Code", required: true, hint: "e.g. CASUAL — unique per tenant" },
    { name: "name", label: "Name", required: true },
    { name: "paid", label: "Paid leave", type: "checkbox" },
    { name: "defaultDays", label: "Default days / year", type: "number" },
    { name: "carryForward", label: "Carry forward", type: "checkbox" },
    { name: "maxCarryForward", label: "Max carry-forward days", type: "number" },
    { name: "encashmentAllowed", label: "Encashment allowed", type: "checkbox" },
    { name: "active", label: "Active", type: "checkbox" },
  ];

  async function saveType(values: Record<string, unknown>) {
    if (!dialog) return;
    setBusy(true);
    setDialogError(null);
    try {
      if (dialog.mode === "add") await createType(values).unwrap();
      else await updateType({ id: dialog.row.id, data: values }).unwrap();
      toast.success(dialog.mode === "add" ? "Leave type created." : "Leave type saved.");
      setDialog(null);
    } catch (err: any) {
      setDialogError(err?.data?.message || "Failed to save.");
    } finally {
      setBusy(false);
    }
  }

  function exportRequests() {
    const header = ["Employee", "Type", "From", "To", "Days", "Status"];
    const lines = rows.map((r) =>
      [nameOf[r.employeeId] ?? r.employeeId, r.leaveType?.name ?? "", r.fromDate, r.toDate, r.days, r.status].map(csvCell).join(",")
    );
    const csv = "\uFEFF" + header.join(",") + "\n" + lines.join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "leave-requests.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <h1 className="hrm-page-title">Leave Management</h1>
      <p className="hrm-page-subtitle">Leave requests, approvals and the leave-type catalog</p>

      <div className="flex gap-1.5">
        <button className={`hrm-pill ${tab === "requests" ? "hrm-pill-active" : ""}`} onClick={() => setTab("requests")}>
          Requests
        </button>
        <button className={`hrm-pill ${tab === "types" ? "hrm-pill-active" : ""}`} onClick={() => setTab("types")}>
          Leave Types
        </button>
      </div>

      {tab === "requests" && (
        <>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <span />
            <div className="flex items-center gap-3">
              <div className="hrm-search" style={{ width: 280 }}>
                <input placeholder="Search employee, type, status…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
              </div>
              <button className="hrm-pill" onClick={exportRequests}><Download size={13} /> CSV</button>
            </div>
          </div>

          <div className="hrm-card mt-4" style={{ overflow: "hidden" }}>
            <div className="overflow-x-auto">
              <table className="hrm-table">
                <thead><tr>{["Employee", "Type", "From", "To", "Days", "Status", ...(canAct ? ["Actions"] : [])].map((h) => <th key={h}>{h}</th>)}</tr></thead>
                <tbody>
                  {requests.isLoading && <tr><td colSpan={7}><div className="hrm-loading-block" style={{ margin: 16 }} /></td></tr>}
                  {!requests.isLoading && rows.length === 0 && (
                    <tr><td colSpan={7} className="p-10 text-center text-sm" style={{ color: "var(--hrm-muted)" }}>
                      No leave requests yet. Employees apply from their self-service portal.
                    </td></tr>
                  )}
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 600, color: "var(--hrm-text)" }}>{nameOf[r.employeeId] ?? `${r.employeeId.slice(0, 8)}…`}</td>
                      <td>{r.leaveType?.name ?? "—"}</td>
                      <td>{r.fromDate}</td>
                      <td>{r.toDate}</td>
                      <td>{r.days}</td>
                      <td>
                        <span className={`hrm-chip ${
                          r.status === "APPROVED" ? "hrm-chip-active"
                          : r.status === "PENDING" ? "hrm-chip-probation"
                          : r.status === "REJECTED" ? "hrm-chip-absent"
                          : "hrm-chip-resigned"
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      {canAct && (
                        <td className="whitespace-nowrap">
                          {r.status === "PENDING" ? (
                            <>
                              <button className="hrm-pill" style={{ padding: "4px 12px", marginRight: 8 }} onClick={() => act(r, "APPROVED")}>Approve</button>
                              <button className="hrm-pill" style={{ padding: "4px 12px" }} onClick={() => act(r, "REJECTED")}>Reject</button>
                            </>
                          ) : <span style={{ color: "var(--hrm-muted)", fontSize: 12 }}>—</span>}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {requests.data && requests.data.totalPages > 1 && (
              <div className="flex items-center justify-end gap-2 p-4 text-sm">
                <button className="hrm-pill" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</button>
                <span style={{ fontSize: 12, color: "var(--hrm-muted)" }}>Page {requests.data.page} of {requests.data.totalPages}</span>
                <button className="hrm-pill" disabled={page >= requests.data.totalPages} onClick={() => setPage((p) => Math.min(requests.data!.totalPages, p + 1))}>Next</button>
              </div>
            )}
          </div>
        </>
      )}

      {tab === "types" && (
        <>
          <div className="mt-5 flex items-center justify-between">
            <span />
            {canEditTypes && (
              <button className="hrm-pill hrm-pill-active" onClick={() => { setDialogError(null); setDialog({ mode: "add" }); }}>
                <Plus size={13} /> Add Leave Type
              </button>
            )}
          </div>

          <div className="hrm-card mt-4" style={{ overflow: "hidden" }}>
            <div className="overflow-x-auto">
              <table className="hrm-table">
                <thead><tr>{["Type", "Paid", "Days", "Carry-forward", "Encashment", "Status", ...(canEditTypes ? ["Actions"] : [])].map((h) => <th key={h}>{h}</th>)}</tr></thead>
                <tbody>
                  {types.isLoading && <tr><td colSpan={7}><div className="hrm-loading-block" style={{ margin: 16 }} /></td></tr>}
                  {!types.isLoading && (types.data?.data ?? []).length === 0 && (
                    <tr><td colSpan={7} className="p-10 text-center text-sm" style={{ color: "var(--hrm-muted)" }}>
                      No leave types — the 8 statutory defaults seed automatically on first use.
                    </td></tr>
                  )}
                  {(types.data?.data ?? []).map((t) => (
                    <tr key={t.id}>
                      <td>
                        <p style={{ margin: 0, fontWeight: 700, color: "var(--hrm-text)" }}>{t.name}</p>
                        <p style={{ margin: 0, fontSize: 11, color: "var(--hrm-muted)" }}>{t.code}</p>
                      </td>
                      <td>{t.paid ? <span className="hrm-chip hrm-chip-active">Paid</span> : <span className="hrm-chip hrm-chip-resigned">Unpaid</span>}</td>
                      <td>{t.defaultDays}</td>
                      <td>{t.carryForward ? `Up to ${t.maxCarryForward}d` : "No"}</td>
                      <td>{t.encashmentAllowed ? "Yes" : "No"}</td>
                      <td>{t.active ? <span className="hrm-chip hrm-chip-active">Active</span> : <span className="hrm-chip hrm-chip-resigned">Inactive</span>}</td>
                      {canEditTypes && (
                        <td className="whitespace-nowrap">
                          <button
                            className="hrm-pill" style={{ padding: "4px 12px", marginRight: 8 }}
                            onClick={async () => {
                              try {
                                await updateType({ id: t.id, data: { active: !t.active } }).unwrap();
                                toast.success(t.active ? "Leave type deactivated." : "Leave type reactivated.");
                              } catch (err: any) {
                                toast.error(err?.data?.message || "Failed.");
                              }
                            }}
                          >
                            {t.active ? "Deactivate" : "Activate"}
                          </button>
                          <button
                            className="hrm-row-action" style={{ color: "#64748B" }}
                            onClick={() => { setDialogError(null); setDialog({ mode: "edit", row: t }); }}
                          >
                            ✎
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p className="mt-2 text-[11px]" style={{ color: "var(--hrm-muted)" }}>
            Leave types have no hard delete — deactivate instead so historical balances stay valid.
          </p>
        </>
      )}

      {dialog && (
        <SimpleFormDialog
          title={dialog.mode === "add" ? "Add Leave Type" : "Edit Leave Type"}
          fields={typeFields}
          initial={dialog.mode === "edit"
            ? { ...dialog.row, paid: Boolean(dialog.row.paid), carryForward: Boolean(dialog.row.carryForward), encashmentAllowed: Boolean(dialog.row.encashmentAllowed), active: Boolean(dialog.row.active) }
            : { paid: true, active: true }}
          loading={busy}
          error={dialogError}
          onSave={saveType}
          onClose={() => setDialog(null)}
        />
      )}
    </div>
  );
}
