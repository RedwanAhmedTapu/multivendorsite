// src/components/hrm/HrmApprovals.tsx
//
// Approval Queue (PHASE D1) built from the GENUINELY actionable pending
// items in the existing APIs:
//   - Leave requests (PENDING)  → approve/reject via the leave act endpoint
//   - Promotions / Transfers (PENDING) → lifecycle act endpoints
//     (hrEmployeeEdit) — data from the tenant-wide lifecycle register
//   - Salary revisions (PENDING) → lifecycle act (SENSITIVE hrSalaryEdit)
//   - Workflow-engine requests → GET /hrm/approvals/requests (the generic
//     engine exists but no process submits into it yet — honest empty state)
//
// Separation of duties: the leave act endpoint now rejects an actor
// approving their own request (server-side).

"use client";

import { useMemo, useState } from "react";
import { Info } from "lucide-react";
import { toast } from "sonner";
import {
  useGetAllLeaveRequestsQuery,
  useActOnLeaveMutation,
  useGetLifecycleRegisterQuery,
  useActOnLifecycleRecordMutation,
  useGetPendingApprovalsQuery,
  useActOnApprovalMutation,
  useGetEmployeesQuery,
} from "@/features/hrmApi";
import { usePermissions } from "@/hooks/usePermissions";

type LifecycleKind = "promotions" | "transfers" | "salary-revisions";

export function HrmApprovals() {
  const { can, canHrUmbrella } = usePermissions();
  const [busy, setBusy] = useState(false);

  const leave = useGetAllLeaveRequestsQuery({ status: "PENDING", page: 1, limit: 50 });
  const [actLeave] = useActOnLeaveMutation();

  const promotions = useGetLifecycleRegisterQuery({ kind: "promotions", page: 1, limit: 50 });
  const transfers = useGetLifecycleRegisterQuery({ kind: "transfers", page: 1, limit: 50 });
  const salaryRevisions = useGetLifecycleRegisterQuery({ kind: "salary-revisions", page: 1, limit: 50 });
  const [actLifecycle] = useActOnLifecycleRecordMutation();

  const engine = useGetPendingApprovalsQuery(undefined);
  const [actEngine] = useActOnApprovalMutation();

  const { data: employees } = useGetEmployeesQuery({ page: 1, limit: 100 });
  const nameOf = useMemoName(employees?.items);

  async function run(fn: () => Promise<unknown>, message: string) {
    setBusy(true);
    try {
      await fn();
      toast.success(message);
    } catch (err: any) {
      toast.error(err?.data?.message || err?.message || "Action failed.");
    } finally {
      setBusy(false);
    }
  }

  const pendingLeave = (leave.data?.items ?? []).filter((r) => r.status === "PENDING");
  const pendingPromotions = (promotions.data?.items ?? []).filter((r) => r.status === "PENDING");
  const pendingTransfers = (transfers.data?.items ?? []).filter((r) => r.status === "PENDING");
  const pendingSalary = (salaryRevisions.data?.items ?? []).filter((r) => r.status === "PENDING");
  const enginePending = (engine.data as any)?.data ?? [];

  const totalPending = pendingLeave.length + pendingPromotions.length + pendingTransfers.length + pendingSalary.length;

  return (
    <div>
      <h1 className="hrm-page-title">Approval Queue</h1>
      <p className="hrm-page-subtitle">
        Requests waiting on a decision — approve or reject inline
        {totalPending > 0 ? ` · ${totalPending} pending` : ""}
      </p>

      {/* ── Leave requests ── */}
      <section className="mt-4">
        <SectionTitle label="Leave requests" count={pendingLeave.length} />
        {leave.isError && <div className="hrm-card p-4 text-sm text-red-600">Leave approvals need the HR permission on your account.</div>}
        {!leave.isError && pendingLeave.length === 0 && <EmptyCard text="No pending leave requests." />}
        {pendingLeave.map((r) => (
          <div key={r.id} className="hrm-card mb-2 flex flex-wrap items-center justify-between gap-2 p-4">
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "var(--hrm-text)" }}>
                {nameOf[r.employeeId] ?? `${r.employeeId.slice(0, 8)}…`} · {r.leaveType?.name ?? "Leave"}
              </p>
              <p style={{ margin: 0, fontSize: 11.5, color: "var(--hrm-muted)" }}>
                {r.fromDate} → {r.toDate} · {r.days} day(s){r.reason ? ` · ${r.reason}` : ""}
              </p>
            </div>
            {canHrUmbrella && (
              <div className="flex gap-2">
                <button className="hrm-pill hrm-pill-active" disabled={busy} onClick={() => run(() => actLeave({ id: r.id, status: "APPROVED" }).unwrap(), "Leave approved.")}>Approve</button>
                <button className="hrm-pill" disabled={busy} onClick={() => run(() => actLeave({ id: r.id, status: "REJECTED" }).unwrap(), "Leave rejected.")}>Reject</button>
              </div>
            )}
          </div>
        ))}
      </section>

      {/* ── Lifecycle: promotions / transfers ── */}
      {(["promotions", "transfers"] as LifecycleKind[]).map((kind) => {
        const items = kind === "promotions" ? pendingPromotions : pendingTransfers;
        const gated = can("hrEmployeeEdit");
        const label = kind === "promotions" ? "Promotion requests" : "Transfer requests";
        return (
          <section className="mt-6" key={kind}>
            <SectionTitle label={label} count={items.length} />
            {!gated && <div className="hrm-card p-4 text-sm" style={{ color: "var(--hrm-muted)" }}>Requires the employee-edit capability.</div>}
            {gated && items.length === 0 && <EmptyCard text={`No pending ${kind}.`} />}
            {gated && items.map((r) => (
              <div key={r.id} className="hrm-card mb-2 flex flex-wrap items-center justify-between gap-2 p-4">
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "var(--hrm-text)" }}>{r.employee.fullName}</p>
                  <p style={{ margin: 0, fontSize: 11.5, color: "var(--hrm-muted)" }}>
                    Effective {r.effectiveDate}{r.reason ? ` · ${r.reason}` : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button className="hrm-pill hrm-pill-active" disabled={busy} onClick={() => run(() => actLifecycle({ employeeId: r.employee.id, kind, sectionId: r.id, status: "APPROVED" }).unwrap(), "Approved and applied.")}>Approve</button>
                  <button className="hrm-pill" disabled={busy} onClick={() => run(() => actLifecycle({ employeeId: r.employee.id, kind, sectionId: r.id, status: "REJECTED" }).unwrap(), "Rejected.")}>Reject</button>
                </div>
              </div>
            ))}
          </section>
        );
      })}

      {/* ── Salary revisions (sensitive) ── */}
      <section className="mt-6">
        <SectionTitle label="Salary revision requests" count={pendingSalary.length} />
        {!can("hrSalaryEdit") && (
          <div className="hrm-card p-4 text-sm" style={{ color: "var(--hrm-muted)" }}>
            Salary decisions require the salary-edit capability (sensitive — not granted by default).
          </div>
        )}
        {can("hrSalaryEdit") && pendingSalary.length === 0 && <EmptyCard text="No pending salary revisions." />}
        {can("hrSalaryEdit") && pendingSalary.map((r) => (
          <div key={r.id} className="hrm-card mb-2 flex flex-wrap items-center justify-between gap-2 p-4">
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "var(--hrm-text)" }}>{r.employee.fullName}</p>
              <p style={{ margin: 0, fontSize: 11.5, color: "var(--hrm-muted)" }}>
                Effective {r.effectiveDate}{r.reason ? ` · ${r.reason}` : ""}
              </p>
            </div>
            <div className="flex gap-2">
              <button className="hrm-pill hrm-pill-active" disabled={busy} onClick={() => run(() => actLifecycle({ employeeId: r.employee.id, kind: "salary-revisions", sectionId: r.id, status: "APPROVED" }).unwrap(), "Approved — salary structure superseded.")}>Approve</button>
              <button className="hrm-pill" disabled={busy} onClick={() => run(() => actLifecycle({ employeeId: r.employee.id, kind: "salary-revisions", sectionId: r.id, status: "REJECTED" }).unwrap(), "Rejected.")}>Reject</button>
            </div>
          </div>
        ))}
      </section>

      {/* ── Workflow engine ── */}
      <section className="mt-6">
        <SectionTitle label="Workflow engine requests" count={enginePending.length} />
        <div className="mb-3 flex items-start gap-2.5 rounded-xl p-3.5" style={{ background: "#F0F9FF", border: "1px solid #BAE6FD" }}>
          <Info size={15} style={{ color: "#0284C7", marginTop: 1, flexShrink: 0 }} />
          <p style={{ fontSize: 12.5, color: "#075985", margin: 0 }}>
            Multi-step workflow routing exists in the backend; leave/lifecycle decisions currently
            act through their own endpoints above.
          </p>
        </div>
        {enginePending.length === 0 && <EmptyCard text="No workflow-engine requests pending." />}
        {enginePending.map((r: any) => (
          <div key={r.id} className="hrm-card mb-2 flex flex-wrap items-center justify-between gap-2 p-4">
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "var(--hrm-text)" }}>{r.processType} · {r.entityType}</p>
              <p style={{ margin: 0, fontSize: 11.5, color: "var(--hrm-muted)" }}>Step {r.currentStep}</p>
            </div>
            {canHrUmbrella && (
              <div className="flex gap-2">
                <button className="hrm-pill hrm-pill-active" disabled={busy} onClick={() => run(() => actEngine({ id: r.id, action: "APPROVE" }).unwrap(), "Approved.")}>Approve</button>
                <button className="hrm-pill" disabled={busy} onClick={() => run(() => actEngine({ id: r.id, action: "REJECT" }).unwrap(), "Rejected.")}>Reject</button>
              </div>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}

function SectionTitle({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center gap-2">
      <h2 style={{ fontSize: 14, fontWeight: 800, color: "var(--hrm-text)", margin: 0 }}>{label}</h2>
      <span className="hrm-chip hrm-chip-probation">{count} pending</span>
    </div>
  );
}

function EmptyCard({ text }: { text: string }) {
  return <div className="hrm-card p-4 text-sm" style={{ color: "var(--hrm-muted)" }}>{text}</div>;
}

function useMemoName(items?: Array<{ id: string; fullName: string }>) {
  return useMemo(() => {
    const m: Record<string, string> = {};
    (items ?? []).forEach((e) => { m[e.id] = e.fullName; });
    return m;
  }, [items]);
}
