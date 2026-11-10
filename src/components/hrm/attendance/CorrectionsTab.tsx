// src/components/hrm/attendance/CorrectionsTab.tsx
//
// Corrections tab: list of correction requests with approve/reject, and
// a "Request Correction" form for the logged-in employee.

"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  useGetAttendanceQuery,
  useGetEmployeesQuery,
} from "@/features/hrmApi";
import { usePermissions } from "@/hooks/usePermissions";
import { toArray } from "../hrm-utils";

export function HrmAttendanceCorrections() {
  const { can, me } = usePermissions();
  const canEdit = can("hrEmployeeEdit");
  const myProfile = me?.employeeId ?? null;

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [showRequest, setShowRequest] = useState(false);

  const corrections = useGetAttendanceCorrectionsQuery(
    { status: statusFilter || undefined, page, limit: 20 },
    { skip: !canEdit && !myProfile }
  );
  const { data: employeesData } = useGetEmployeesQuery({ page: 1, limit: 100 });

  const nameOf = useMemo(() => {
    const m: Record<string, any> = {};
    toArray(employeesData?.items).forEach((e: any) => { m[e.id] = e; });
    return m;
  }, [employeesData]);

  async function act(id: string, status: "APPROVED" | "REJECTED") {
    try {
      const raw = localStorage.getItem("persist:root");
      let token = "";
      if (raw) { try { token = JSON.parse(JSON.parse(raw).auth ?? "{}").accessToken ?? ""; } catch { /* ignore */ } }
      const res = await fetch(`/api/hrm/attendance/corrections/${id}/act`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ status }),
      });
      const body = await res.json();
      if (body.success) toast.success(`Correction ${status.toLowerCase()}.`);
      else toast.error(body.message ?? "Action failed.");
      corrections.refetch();
    } catch (err: any) { toast.error(err?.message ?? "Action failed."); }
  }

  const rows = toArray(corrections.data?.items);

  return (
    <div>
      <div className="mt-3 flex items-center justify-between mb-3">
        <div className="flex gap-1.5">
          {["", "PENDING", "APPROVED", "REJECTED"].map((s) => (
            <button key={s || "all"} className={`hrm-pill ${statusFilter === s ? "hrm-pill-active" : ""}`} onClick={() => { setStatusFilter(s); setPage(1); }}>
              {s || "All"}
            </button>
          ))}
        </div>
      </div>

      <div className="hrm-card" style={{ overflow: "hidden" }}>
        <div className="overflow-x-auto">
          <table className="hrm-table">
            <thead><tr>{["Employee", "Date", "Requested In", "Requested Out", "Reason", "Status", ...(canEdit ? ["Actions"] : [])].map((h) => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {corrections.isLoading && <tr><td colSpan={7}><div className="hrm-loading-block" style={{ margin: 16 }} /></td></tr>}
              {!corrections.isLoading && rows.length === 0 && (
                <tr><td colSpan={7} className="p-10 text-center text-sm" style={{ color: "var(--hrm-muted)" }}>
                  No correction requests.
                </td></tr>
              )}
              {rows.map((r: any) => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 600, color: "var(--hrm-text)" }}>{nameOf[r.employeeId]?.fullName ?? r.employeeId.slice(0, 10)}</td>
                  <td>{r.date}</td>
                  <td>{r.requestedIn || "—"}</td>
                  <td>{r.requestedOut || "—"}</td>
                  <td style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}>{r.reason}</td>
                  <td><span className={`hrm-chip ${r.status === "APPROVED" ? "hrm-chip-active" : r.status === "REJECTED" ? "hrm-chip-absent" : "hrm-chip-probation"}`}>{r.status}</span></td>
                  {canEdit && r.status === "PENDING" && (
                    <td className="whitespace-nowrap">
                      <button className="hrm-pill" style={{ padding: "4px 12px", marginRight: 6 }}
                        onClick={() => act(r.id, "APPROVED")}>Approve</button>
                      <button className="hrm-pill" style={{ padding: "4px 12px" }}
                        onClick={() => act(r.id, "REJECTED")}>Reject</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {corrections.data && corrections.data.totalPages > 1 && (
          <div className="flex items-center justify-end gap-2 p-4 text-sm">
            <button className="hrm-pill" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</button>
            <span style={{ fontSize: 12, color: "var(--hrm-muted)" }}>Page {corrections.data.page} of {corrections.data.totalPages}</span>
            <button className="hrm-pill" disabled={page >= corrections.data.totalPages} onClick={() => setPage((p) => Math.min(corrections.data!.totalPages, p + 1))}>Next</button>
          </div>
        )}
      </div>
    </div>
  );
}

// Hooks needed
import { useGetAttendanceCorrectionsQuery } from "@/features/hrmApi";
