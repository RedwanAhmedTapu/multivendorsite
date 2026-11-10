// src/app/hrm/documents/page.tsx - Letters & Templates (PHASE D3).

// PHASE F: direct-URL capability gate — the section's caps come from
// hrm-nav-config.ts (same source as the sidebar), evaluated via
// usePermissions; the backend re-authorizes every API call regardless.
import dynamic from "next/dynamic";
import { HrmGate } from "@/components/hrm/HrmGate";

const HrmLetters = dynamic(
  () => import("@/components/hrm/HrmLetters").then((m) => m.HrmLetters),
  { loading: () => <div className="hrm-loading-block" style={{ height: 300 }} /> }
);

export default function HrmLettersPage() {
  return (
    <HrmGate section="documents">
      <HrmLetters />
    </HrmGate>
  );
}
