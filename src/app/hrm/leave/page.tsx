// src/app/hrm/leave/page.tsx — Leave Management.

// PHASE F: direct-URL capability gate — the section's caps come from
// hrm-nav-config.ts (same source as the sidebar), evaluated via
// usePermissions; the backend re-authorizes every API call regardless.
import dynamic from "next/dynamic";
import { HrmGate } from "@/components/hrm/HrmGate";

const HrmLeave = dynamic(
  () => import("@/components/hrm/HrmLeave").then((m) => m.HrmLeave),
  { loading: () => <div className="hrm-loading-block" style={{ height: 300 }} /> }
);

export default function HrmLeavePage() {
  return (
    <HrmGate section="leave">
      <HrmLeave />
    </HrmGate>
  );
}
