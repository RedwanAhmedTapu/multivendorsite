// src/app/hrm/payroll/page.tsx — Payroll runs (sensitive: hrSalaryView/Edit).

// PHASE F: direct-URL capability gate — the section's caps come from
// hrm-nav-config.ts (same source as the sidebar), evaluated via
// usePermissions; the backend re-authorizes every API call regardless.
import dynamic from "next/dynamic";
import { HrmGate } from "@/components/hrm/HrmGate";

const HrmPayroll = dynamic(
  () => import("@/components/hrm/HrmPayroll").then((m) => m.HrmPayroll),
  { loading: () => <div className="hrm-loading-block" style={{ height: 300 }} /> }
);

export default function HrmPayrollPage() {
  return (
    <HrmGate section="payroll">
      <HrmPayroll />
    </HrmGate>
  );
}
