// src/app/hrm/calendar/page.tsx - HR Calendar.

// PHASE F: direct-URL capability gate — the section's caps come from
// hrm-nav-config.ts (same source as the sidebar), evaluated via
// usePermissions; the backend re-authorizes every API call regardless.
import dynamic from "next/dynamic";
import { HrmGate } from "@/components/hrm/HrmGate";

const HrmCalendar = dynamic(
  () => import("@/components/hrm/HrmCalendar").then((m) => m.HrmCalendar),
  { loading: () => <div className="hrm-loading-block" style={{ height: 300 }} /> }
);

export default function HrmCalendarPage() {
  return (
    <HrmGate section="calendar">
      <HrmCalendar />
    </HrmGate>
  );
}
