// src/app/hrm/org-chart/page.tsx — Organogram / Reporting Structure.

// PHASE F: direct-URL capability gate — the section's caps come from
// hrm-nav-config.ts (same source as the sidebar), evaluated via
// usePermissions; the backend re-authorizes every API call regardless.
import dynamic from "next/dynamic";
import { HrmGate } from "@/components/hrm/HrmGate";

const HrmOrgChart = dynamic(
  () => import("@/components/hrm/HrmOrgChart").then((m) => m.HrmOrgChart),
  { loading: () => <div className="hrm-loading-block" style={{ height: 300 }} /> }
);

export default function HrmOrgChartPage() {
  return (
    <HrmGate section="org-chart">
      <HrmOrgChart />
    </HrmGate>
  );
}
