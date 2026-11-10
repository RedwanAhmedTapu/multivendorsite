// src/app/hrm/overtime/page.tsx — Overtime Management (placeholder phase page).

// PHASE F: direct-URL capability gate — the section's caps come from
// hrm-nav-config.ts (same source as the sidebar), evaluated via
// usePermissions; the backend re-authorizes every API call regardless.

"use client";

import { HrmGate } from "@/components/hrm/HrmGate";
import { HrmPlaceholder } from "@/components/hrm/HrmPlaceholder";

export default function HrmOvertimePage() {
  return (
    <HrmGate section="overtime">
      <HrmPlaceholder title="Overtime Management" subtitle="Overtime requests, approvals and cost tracking" />
    </HrmGate>
  );
}
