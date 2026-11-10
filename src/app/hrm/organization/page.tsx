// src/app/hrm/organization/page.tsx — Branches / Departments / Designations.

// PHASE F: direct-URL capability gate — the section's caps come from
// hrm-nav-config.ts (same source as the sidebar), evaluated via
// usePermissions; the backend re-authorizes every API call regardless.
import dynamic from "next/dynamic";
import { HrmGate } from "@/components/hrm/HrmGate";

const HrmOrganization = dynamic(
  () => import("@/components/hrm/HrmOrganization").then((m) => m.HrmOrganization),
  { loading: () => <div className="hrm-loading-block" style={{ height: 300 }} /> }
);

export default function HrmOrganizationPage() {
  return (
    <HrmGate section="organization">
      <HrmOrganization />
    </HrmGate>
  );
}
