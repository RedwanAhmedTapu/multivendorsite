// src/app/hrm/employees/page.tsx — Employee Directory (PHASE B).

// PHASE F: direct-URL capability gate — the section's caps come from
// hrm-nav-config.ts (same source as the sidebar), evaluated via
// usePermissions; the backend re-authorizes every API call regardless.
import dynamic from "next/dynamic";
import { HrmGate } from "@/components/hrm/HrmGate";

const HrmEmployeeDirectory = dynamic(
  () => import("@/components/hrm/HrmEmployeeDirectory").then((m) => m.HrmEmployeeDirectory),
  { loading: () => <div className="hrm-loading-block" style={{ height: 300 }} /> }
);

export default function HrmEmployeeDirectoryPage() {
  return (
    <HrmGate section="employees">
      <HrmEmployeeDirectory />
    </HrmGate>
  );
}
