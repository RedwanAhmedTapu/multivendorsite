// src/app/hrm/page.tsx
//
// HR Dashboard — the /hrm landing page. Every number comes from the real
// FinixMart HR APIs (employees.list totals per status, branches/departments
// lists, attendance per-status totals for today). Widgets whose aggregate
// API does not exist yet (e.g. Payroll & Financial HR, new joiners, early
// leave, overtime) render an explicit empty/placeholder state — never
// invented numbers.

"use client";

import { useMemo } from "react";
import Link from "next/link";
import { format } from "date-fns";
import type { LucideIcon } from "lucide-react";
import {
  Users, CalendarClock, Plane, Sparkles, LogOut, UserX, Banknote,
  Plus, Clock, Plane as PlaneIcon, Receipt, UserPlus,
} from "lucide-react";
import {
  useGetEmployeesQuery,
  useGetBranchesQuery,
  useGetDepartmentsQuery,
  useGetAttendanceQuery,
  useGetNewJoinersQuery,
  useGetPayrollRunsQuery,
} from "@/features/hrmApi";
import { usePermissions } from "@/hooks/usePermissions";

const today = () => new Date().toISOString().slice(0, 10);

function useStatusTotal(status: string | undefined, skip: boolean) {
  const { data, isError } = useGetEmployeesQuery(
    status ? { status, page: 1, limit: 1 } : { page: 1, limit: 1 },
    { skip } // PHASE F: never fire (or toast 403) for a query the user may not read
  );
  return isError ? null : data?.total ?? null;
}

export default function HrmDashboardPage() {
  const { me, can } = usePermissions();
  const firstName = (me?.name ?? "there").split(/\s+/)[0];
  const dateLabel = format(new Date(), "EEEE, d MMMM yyyy");

  // PHASE F: everything below is gated on hrEmployeeView — the widgets and
  // stat cards needing it are hidden (not empty shells) and their queries
  // are skipped for users without the capability.
  const canView = can("hrEmployeeView");

  // ── Real data: employee totals per status ──
  const total = useStatusTotal(undefined, !canView);
  const active = useStatusTotal("ACTIVE", !canView);
  const probation = useStatusTotal("PROBATION", !canView);
  const onLeave = useStatusTotal("ON_LEAVE", !canView);
  const resigned = useStatusTotal("RESIGNED", !canView);
  const terminated = useStatusTotal("TERMINATED", !canView);

  // ── Real data: org shape ──
  const { data: branches } = useGetBranchesQuery(undefined, { skip: !canView });
  const { data: departments } = useGetDepartmentsQuery(undefined, { skip: !canView });

  // ── Real data: attendance today, per status ──
  const t = today();
  const attPresent = useGetAttendanceQuery({ fromDate: t, toDate: t, status: "PRESENT", page: 1, limit: 1 }, { skip: !canView });
  const attLate = useGetAttendanceQuery({ fromDate: t, toDate: t, status: "LATE", page: 1, limit: 1 }, { skip: !canView });
  const attLeave = useGetAttendanceQuery({ fromDate: t, toDate: t, status: "LEAVE", page: 1, limit: 1 }, { skip: !canView });
  const attAbsent = useGetAttendanceQuery({ fromDate: t, toDate: t, status: "ABSENT", page: 1, limit: 1 }, { skip: !canView });
  const attWfh = useGetAttendanceQuery({ fromDate: t, toDate: t, status: "WFH", page: 1, limit: 1 }, { skip: !canView });
  const attHalf = useGetAttendanceQuery({ fromDate: t, toDate: t, status: "HALF_DAY", page: 1, limit: 1 }, { skip: !canView });
  const attMarked = useGetAttendanceQuery({ fromDate: t, toDate: t, page: 1, limit: 1 }, { skip: !canView });
  const newJoiners = useGetNewJoinersQuery(30, { skip: !canView });
  // Real run-status counters (PHASE D1) — only fetched for hrSalaryView holders.
  const canSalaryView = can("hrSalaryView");
  const payrollRuns = useGetPayrollRunsQuery(undefined, { skip: !canSalaryView });
  const runCount = (...statuses: string[]) =>
    (payrollRuns.data?.data ?? []).filter((r: any) => statuses.includes(r.status)).length;

  const totalEmployees = total ?? 0;
  const present = attPresent.data?.total ?? 0;
  const rate = totalEmployees > 0 ? Math.round((present / totalEmployees) * 100) : 0;

  const quickActions = useMemo(() => {
    const actions: Array<{ label: string; icon: LucideIcon; href: string; show: boolean }> = [
      { label: "Add Employee", icon: Plus, href: "/hrm/employees", show: can("hrEmployeeCreate") },
      { label: "Mark Attendance", icon: Clock, href: "/hrm/attendance", show: can("hrEmployeeView") },
      { label: "Leave Request", icon: PlaneIcon, href: "/hrm/leave", show: can("hrEmployeeView") },
      { label: "Generate Payroll", icon: Receipt, href: "/hrm/payroll", show: can("hrSalaryEdit") },
      { label: "Approvals", icon: UserPlus, href: "/hrm/approvals", show: can("hrEmployeeEdit") },
    ];
    return actions.filter((a) => a.show);
  }, [can]);

  const stats = [
    { label: "Total Employees", value: total, sub: `${active ?? "—"} active`, tile: "hrm-tile-emerald", icon: Users },
    { label: "Probation", value: probation, sub: "confirmation due soon", tile: "hrm-tile-orange", icon: CalendarClock },
    { label: "On Leave", value: onLeave, sub: "currently away", tile: "hrm-tile-teal", icon: Plane },
    { label: "New Joiners (30d)", value: newJoiners.isError ? null : newJoiners.data?.data.count ?? 0, sub: "welcome aboard", tile: "hrm-tile-purple", icon: Sparkles },
    { label: "Resigned", value: resigned, sub: "exited employees", tile: "hrm-tile-slate", icon: LogOut },
    { label: "Terminated", value: terminated, sub: "this tenant", tile: "hrm-tile-rose", icon: UserX },
  ];

  const attendanceTiles = [
    { label: "PRESENT", value: attPresent.isError ? null : present, color: "#047857", bg: "#ECFDF5" },
    { label: "LATE", value: attLate.isError ? null : attLate.data?.total ?? 0, color: "#B45309", bg: "#FEF9E7" },
    { label: "ON LEAVE", value: attLeave.isError ? null : attLeave.data?.total ?? 0, color: "#C2410C", bg: "#FFF4EC" },
    { label: "ABSENT", value: attAbsent.isError ? null : attAbsent.data?.total ?? 0, color: "#B91C1C", bg: "#FEF2F2" },
    { label: "WFH / TRIP", value: attWfh.isError ? null : attWfh.data?.total ?? 0, color: "#0F766E", bg: "#ECFDF9" },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="hrm-page-title">Good day, {firstName}</h1>
          <p className="hrm-page-subtitle" style={{ marginBottom: 0 }}>
            {dateLabel}
            {canView && (
              <> · {totalEmployees} employees · {branches?.data.length ?? "—"} branches · {departments?.data.length ?? "—"} departments</>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {quickActions.map((a) => (
            <Link key={a.label} href={a.href} className="hrm-pill">
              <a.icon size={13} style={{ color: "#059669" }} />
              {a.label}
            </Link>
          ))}
        </div>
      </div>

      {/* ── Stat cards (hrEmployeeView) ── */}
      {canView && (
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
          {stats.map((s) => (
            <div key={s.label} className="hrm-card hrm-stat-card">
              <div className="min-w-0">
                <p className="hrm-stat-label">{s.label}</p>
                <p className="hrm-stat-value">{s.value ?? "—"}</p>
                <p className="hrm-stat-sub">{s.sub}</p>
              </div>
              <div className={`hrm-stat-tile ${s.tile}`}><s.icon size={19} /></div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-3">
        {/* ── Attendance Today (hrEmployeeView) ── */}
        {canView && (
        <div className="hrm-card p-5 xl:col-span-2">
          <h2 style={{ fontSize: 15, fontWeight: 800, color: "#0D1B2E", margin: "0 0 14px" }}>Attendance Today</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {attendanceTiles.map((tile) => (
              <div key={tile.label} className="hrm-mini-tile" style={{ background: tile.bg }}>
                <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.05em", color: tile.color, margin: 0 }}>{tile.label}</p>
                <p style={{ fontSize: 20, fontWeight: 800, color: tile.color, margin: "2px 0 0" }}>{tile.value ?? "—"}</p>
                <p style={{ fontSize: 10.5, color: "#94A3B8", margin: 0 }}>{totalEmployees} total</p>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between" style={{ fontSize: 12, color: "#7A90AB" }}>
              <span>Attendance rate today</span>
              <span style={{ fontWeight: 800, color: "#059669" }}>{totalEmployees > 0 ? `${rate}%` : "—"}</span>
            </div>
            <div style={{ height: 8, borderRadius: 999, background: "#E2E8F0", marginTop: 6, overflow: "hidden" }}>
              <div style={{ width: `${rate}%`, height: "100%", borderRadius: 999, background: "linear-gradient(90deg,#34D399,#059669)" }} />
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1" style={{ fontSize: 11.5, color: "#7A90AB" }}>
            <span>Early leave: <b style={{ color: "#334155" }}>—</b></span>
            <span>Half day: <b style={{ color: "#334155" }}>{attHalf.isError ? "—" : attHalf.data?.total ?? 0}</b></span>
            <span>Overtime today: <b style={{ color: "#334155" }}>—</b></span>
            <span>Marked records: <b style={{ color: "#334155" }}>{attMarked.isError ? "—" : attMarked.data?.total ?? 0}</b></span>
          </div>
        </div>
        )}

        {/* ── Payroll & Financial HR (placeholder until the aggregate API exists) ── */}
        <div className="hrm-card p-5">
          <h2 style={{ fontSize: 15, fontWeight: 800, color: "#0D1B2E", margin: "0 0 10px" }}>Payroll &amp; Financial HR</h2>
          {can("hrSalaryView") ? (
            <div>
              {[
                { label: "Runs awaiting approval", count: runCount("DRAFT", "CALCULATED", "REVIEW"), href: "/hrm/payroll" },
                { label: "Runs awaiting payment", count: runCount("APPROVED"), href: "/hrm/payroll" },
                { label: "Paid runs", count: runCount("PAID"), href: "/hrm/payroll" },
              ].map((row) => (
                <Link key={row.label} href={row.href} className="flex items-center justify-between rounded-lg px-3 py-2.5 mb-2"
                  style={{ background: "#FAFBFD", border: "1px solid var(--hrm-border)", textDecoration: "none" }}>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: "#334155" }}>{row.label}</span>
                  <span className="hrm-chip hrm-chip-active">{row.count} ›</span>
                </Link>
              ))}
              <p style={{ fontSize: 10.5, color: "var(--hrm-muted)", margin: "8px 0 0" }}>
                Gross/deduction/OT aggregates arrive with payroll reporting — no estimates shown.
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-400">
              Payroll is permission-gated (hrSalaryView). Ask your administrator for access.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
