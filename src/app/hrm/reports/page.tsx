// src/app/hrm/reports/page.tsx — HR Reports.

// PHASE F: direct-URL capability gate — the section's caps come from
// hrm-nav-config.ts (same source as the sidebar), evaluated via
// usePermissions; the backend re-authorizes every API call regardless.
import dynamic from "next/dynamic";
import { HrmGate } from "@/components/hrm/HrmGate";

const HrmReports = dynamic(
  () => import("@/components/hrm/HrmReports").then((m) => m.HrmReports),
  { loading: () => <div className="hrm-loading-block" style={{ height: 300 }} /> }
);

export default function HrmReportsPage() {
  return (
    <HrmGate section="reports">
      <HrmReports />
    </HrmGate>
  );
}
