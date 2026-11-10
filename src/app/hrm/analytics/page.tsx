// src/app/hrm/analytics/page.tsx — HR Analytics (placeholder phase page).

// PHASE F: direct-URL capability gate — the section's caps come from
// hrm-nav-config.ts (same source as the sidebar), evaluated via
// usePermissions; the backend re-authorizes every API call regardless.

"use client";

import { HrmGate } from "@/components/hrm/HrmGate";
import { HrmPlaceholder } from "@/components/hrm/HrmPlaceholder";

export default function HrmAnalyticsPage() {
  return (
    <HrmGate section="analytics">
      <HrmPlaceholder title="HR Analytics" subtitle="Trends and distributions across your workforce" />
    </HrmGate>
  );
}
