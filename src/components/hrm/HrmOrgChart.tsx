// src/components/hrm/HrmOrgChart.tsx
//
// Org Chart (PHASE C): Organogram tab = collapsible department groups with
// their designations and holder counts; Reporting Structure tab = honest
// placeholder (manager roll-ups are per-360 data; no register API yet).
// Holder counts derive from the employee directory map (first 100 employees
// — shown only when the tenant fits that page size).

"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Info, Network } from "lucide-react";
import {
  useGetDepartmentsQuery,
  useGetDesignationsQuery,
  useGetEmployeesQuery,
  useGetDesignationCountsQuery,
  useGetReportingStructureQuery,
} from "@/features/hrmApi";
import { toArray } from "./hrm-utils";

export function HrmOrgChart() {
  const [tab, setTab] = useState<"organogram" | "reporting">("organogram");
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const { data: departments } = useGetDepartmentsQuery();
  const { data: designations } = useGetDesignationsQuery();
  // Server-side grouped counts (PHASE C2) — exact for any tenant size.
  const designationCounts = useGetDesignationCountsQuery();
  const reporting = useGetReportingStructureQuery();

  const holderCounts = useMemo(() => {
    const byDesignation: Record<string, number> = {};
    (designationCounts.data?.data.items ?? []).forEach((c) => {
      if (c.designationId) byDesignation[c.designationId] = c.count;
    });
    return byDesignation;
  }, [designationCounts.data]);
  const positionsFilled = useMemo(
    () => Object.values(holderCounts).reduce((a, b) => a + b, 0),
    [holderCounts]
  );

  const groups = useMemo(() => {
    const depts = departments?.data ?? [];
    const desigs = toArray(designations?.data);
    return depts.map((d) => ({
      department: d,
      designations: desigs.filter((x) => x.departmentId === d.id),
    }));
  }, [departments, designations]);

  const totalDesignations = designations?.data.length ?? 0;

  return (
    <div>
      <h1 className="hrm-page-title">Org Chart</h1>
      <p className="hrm-page-subtitle">Departments, designations and reporting structure</p>

      <div className="flex gap-1.5">
        <button className={`hrm-pill ${tab === "organogram" ? "hrm-pill-active" : ""}`} onClick={() => setTab("organogram")}>
          Organogram
        </button>
        <button className={`hrm-pill ${tab === "reporting" ? "hrm-pill-active" : ""}`} onClick={() => setTab("reporting")}>
          Reporting Structure
        </button>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="hrm-card hrm-stat-card">
          <div><p className="hrm-stat-label">Departments</p><p className="hrm-stat-value">{departments?.data.length ?? "—"}</p></div>
          <div className="hrm-stat-tile hrm-tile-emerald"><Network size={18} /></div>
        </div>
        <div className="hrm-card hrm-stat-card">
          <div><p className="hrm-stat-label">Designations</p><p className="hrm-stat-value">{totalDesignations || "—"}</p></div>
          <div className="hrm-stat-tile hrm-tile-purple"><Network size={18} /></div>
        </div>
        <div className="hrm-card hrm-stat-card">
          <div><p className="hrm-stat-label">Positions filled</p><p className="hrm-stat-value">{positionsFilled}</p></div>
          <div className="hrm-stat-tile hrm-tile-slate"><Network size={18} /></div>
        </div>
      </div>

      {tab === "organogram" ? (
        <>
          <div className="mt-5 flex items-start gap-2.5 rounded-xl p-3.5" style={{ background: "#F0F9FF", border: "1px solid #BAE6FD" }}>
            <Info size={15} style={{ color: "#0284C7", marginTop: 1, flexShrink: 0 }} />
            <p style={{ fontSize: 12.5, color: "#075985", margin: 0 }}>
              Expand a department to see its designations and holder counts.
            </p>
          </div>

          <div className="mt-4 space-y-3">
            {groups.map(({ department, designations: desigs }) => {
              const isOpen = open[department.id] ?? false;
              return (
                <div key={department.id} className="hrm-card" style={{ overflow: "hidden" }}>
                  <button
                    className="flex w-full items-center justify-between gap-3 p-4 text-left"
                    onClick={() => setOpen((o) => ({ ...o, [department.id]: !o[department.id] }))}
                  >
                    <div className="flex items-center gap-3">
                      {isOpen ? <ChevronDown size={16} style={{ color: "var(--hrm-emerald-deep)" }} /> : <ChevronRight size={16} style={{ color: "var(--hrm-muted)" }} />}
                      <div>
                        <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: "var(--hrm-text)" }}>{department.name}</p>
                        <p style={{ margin: 0, fontSize: 11, color: "var(--hrm-muted)" }}>
                          {department.code} · {department.branch?.name ?? "No branch"} · {desigs.length} designation(s)
                        </p>
                      </div>
                    </div>
                    <span className="hrm-chip hrm-chip-active">{department.status}</span>
                  </button>
                  {isOpen && (
                    <div style={{ borderTop: "1px solid var(--hrm-border)" }}>
                      {desigs.length === 0 && (
                        <p className="p-4 text-sm" style={{ color: "var(--hrm-muted)" }}>No designations in this department yet.</p>
                      )}
                      {desigs.map((d) => (
                        <div key={d.id} className="flex items-center justify-between px-5 py-2.5" style={{ borderBottom: "1px solid #F0F4FA" }}>
                          <div>
                            <p style={{ margin: 0, fontSize: 12.5, fontWeight: 600, color: "var(--hrm-text)" }}>{d.name}</p>
                            <p style={{ margin: 0, fontSize: 11, color: "var(--hrm-muted)" }}>
                              {d.code}{d.grade ? ` · Grade ${d.grade}` : ""}
                            </p>
                          </div>
                          <span className="hrm-chip hrm-chip-resigned">
                            {holderCounts[d.id] ?? 0} holder(s)
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            {groups.length === 0 && (
              <div className="hrm-card p-10 text-center text-sm" style={{ color: "var(--hrm-muted)" }}>
                No departments yet — set them up under Branches &amp; Departments.
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="hrm-card hrm-stat-card">
              <div><p className="hrm-stat-label">Managers</p><p className="hrm-stat-value">{reporting.data?.data.managers.length ?? "—"}</p></div>
              <div className="hrm-stat-tile hrm-tile-emerald"><Network size={18} /></div>
            </div>
            <div className="hrm-card hrm-stat-card">
              <div><p className="hrm-stat-label">Employees with a manager</p><p className="hrm-stat-value">{reporting.data?.data.managers.reduce((a, m) => a + m.reportCount, 0) ?? "—"}</p></div>
              <div className="hrm-stat-tile hrm-tile-teal"><Network size={18} /></div>
            </div>
            <div className="hrm-card hrm-stat-card">
              <div><p className="hrm-stat-label">Unassigned</p><p className="hrm-stat-value">{reporting.data?.data.unassigned ?? "—"}</p></div>
              <div className="hrm-stat-tile hrm-tile-slate"><Network size={18} /></div>
            </div>
          </div>

          <div className="hrm-card mt-4" style={{ overflow: "hidden" }}>
            <div style={{ borderBottom: "1px solid var(--hrm-border)", background: "#FAFBFD", padding: "10px 16px" }}>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 800, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--hrm-muted)" }}>
                Manager → direct reports
              </p>
            </div>
            {reporting.isLoading && <div className="hrm-loading-block" style={{ margin: 16 }} />}
            {!reporting.isLoading && (reporting.data?.data.managers.length ?? 0) === 0 && (
              <p className="p-6 text-sm" style={{ color: "var(--hrm-muted)" }}>
                No reporting lines yet — set a reporting manager on an Employee 360° profile.
              </p>
            )}
            {(reporting.data?.data.managers ?? []).map((m) => (
              <div key={m.managerId} className="flex items-center justify-between px-5 py-3" style={{ borderBottom: "1px solid #F0F4FA" }}>
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "var(--hrm-text)" }}>{m.managerName}</p>
                  <p style={{ margin: 0, fontSize: 11, color: "var(--hrm-muted)" }}>{m.managerCode}</p>
                </div>
                <span className="hrm-chip hrm-chip-active">{m.reportCount} direct report(s)</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
