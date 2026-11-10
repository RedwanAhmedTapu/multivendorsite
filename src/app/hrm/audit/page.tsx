// src/app/hrm/audit/page.tsx — Audit Trail (PLATFORM resource, ADMIN only).
// AuditLog has no tenant column: a tenant-scoped HR audit view is impossible
// today, so this page is honest about its scope and gated to ADMIN
// server-side (authorizeRoles("ADMIN") on /hrm/insights/audit).

"use client";

import { useState } from "react";
import { useGetAuditLogQuery } from "@/features/hrmApi";
import { usePermissions } from "@/hooks/usePermissions";

export default function HrmAuditPage() {
  const { me } = usePermissions();
  const [page, setPage] = useState(1);
  const isAdmin = me?.role === "ADMIN";

  const audit = useGetAuditLogQuery({ page, limit: 50 }, { skip: !isAdmin });

  if (!isAdmin) {
    return (
      <div className="hrm-card" style={{ padding: 48, textAlign: "center" }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: "#334155", margin: 0 }}>Audit Trail is a platform-admin view</p>
        <p style={{ fontSize: 12, color: "var(--hrm-muted)", marginTop: 6 }}>
          The platform audit log is not tenant-scoped (no vendor column), so it is
          restricted to platform administrators. Tenant-level HR events remain on each
          employee's 360° history tab.
        </p>
      </div>
    );
  }

  const rows = audit.data?.items ?? [];

  return (
    <div>
      <h1 className="hrm-page-title">Audit Trail</h1>
      <p className="hrm-page-subtitle">Platform audit log — read-only, newest first</p>

      <div className="hrm-card" style={{ overflow: "hidden" }}>
        <div className="overflow-x-auto">
          <table className="hrm-table">
            <thead><tr>{["When", "Actor", "Action", "Entity", "Entity ID"].map((h) => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {audit.isLoading && <tr><td colSpan={5}><div className="hrm-loading-block" style={{ margin: 16 }} /></td></tr>}
              {audit.isError && (
                <tr><td colSpan={5} className="p-10 text-center text-sm text-red-600">Failed to load the audit log.</td></tr>
              )}
              {!audit.isLoading && rows.length === 0 && (
                <tr><td colSpan={5} className="p-10 text-center text-sm" style={{ color: "var(--hrm-muted)" }}>No audit entries yet.</td></tr>
              )}
              {rows.map((a) => (
                <tr key={a.id}>
                  <td style={{ whiteSpace: "nowrap" }}>{new Date(a.createdAt).toLocaleString()}</td>
                  <td>{a.user?.name ?? a.userId ?? "system"}</td>
                  <td><span className="hrm-chip hrm-chip-resigned">{a.action}</span></td>
                  <td>{a.entity}</td>
                  <td style={{ fontFamily: "monospace", fontSize: 11 }}>{a.entityId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {audit.data && audit.data.totalPages > 1 && (
          <div className="flex items-center justify-end gap-2 p-4 text-sm">
            <button className="hrm-pill" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</button>
            <span style={{ fontSize: 12, color: "var(--hrm-muted)" }}>Page {audit.data.page} of {audit.data.totalPages} · {audit.data.total} entries</span>
            <button className="hrm-pill" disabled={page >= audit.data.totalPages} onClick={() => setPage((p) => Math.min(audit.data!.totalPages, p + 1))}>Next</button>
          </div>
        )}
      </div>
      <p className="mt-2 text-[11px]" style={{ color: "var(--hrm-muted)" }}>
        Read-only. No edit or delete exists for audit entries.
      </p>
    </div>
  );
}
