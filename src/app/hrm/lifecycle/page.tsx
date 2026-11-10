// src/app/hrm/lifecycle/page.tsx — Employment Lifecycle (placeholder phase page).

// PHASE F: direct-URL capability gate — the section's caps come from
// hrm-nav-config.ts (same source as the sidebar), evaluated via
// usePermissions; the backend re-authorizes every API call regardless.

"use client";

import { HrmGate } from "@/components/hrm/HrmGate";
import { HrmPlaceholder } from "@/components/hrm/HrmPlaceholder";

export default function HrmLifecyclePage() {
  return (
    <HrmGate section="lifecycle">
      <HrmPlaceholder title="Employment Lifecycle" subtitle="Promotions, transfers and salary revisions — the immutable employee history register" />
    </HrmGate>
  );
}
