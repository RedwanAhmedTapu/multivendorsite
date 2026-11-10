// src/app/hrm/attendance/page.tsx — Attendance & Shifts (PHASE AT1).

// PHASE F: direct-URL capability gate — the section's caps come from
// hrm-nav-config.ts (same source as the sidebar), evaluated via
// usePermissions; the backend re-authorizes every API call regardless.
import dynamic from "next/dynamic";
import { HrmGate } from "@/components/hrm/HrmGate";

const HrmAttendanceShell = dynamic(
  () => import("@/components/hrm/attendance/HrmAttendanceShell").then((m) => m.HrmAttendanceShell),
  { loading: () => <div className="hrm-loading-block" style={{ height: 300 }} /> }
);

export default function HrmAttendanceShellPage() {
  return (
    <HrmGate section="attendance">
      <HrmAttendanceShell />
    </HrmGate>
  );
}
