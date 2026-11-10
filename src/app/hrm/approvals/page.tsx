// src/app/hrm/approvals/page.tsx — Approval Queue.

// PHASE F: direct-URL capability gate — the section's caps come from
// hrm-nav-config.ts (same source as the sidebar), evaluated via
// usePermissions; the backend re-authorizes every API call regardless.
import dynamic from "next/dynamic";
import { HrmGate } from "@/components/hrm/HrmGate";

const HrmApprovals = dynamic(
  () => import("@/components/hrm/HrmApprovals").then((m) => m.HrmApprovals),
  { loading: () => <div className="hrm-loading-block" style={{ height: 300 }} /> }
);

export default function HrmApprovalsPage() {
  return (
    <HrmGate section="approvals">
      <HrmApprovals />
    </HrmGate>
  );
}
