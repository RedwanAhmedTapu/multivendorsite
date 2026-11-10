// src/components/hrm/attendance/HrmAttendanceShell.tsx
//
// PHASE AT1: Attendance & Shifts with 10 tabs. Real tabs: Daily Attendance,
// Monthly Register, Shifts & Roster, Geo-Fence, Corrections. Honest
// placeholders: ADMS Devices, Device Events, Unknown Users, Sync Monitor,
// QR Attendance (no backend yet).

"use client";

import { useState } from "react";
import { HrmAttendanceDaily } from "./DailyTab";
import { HrmAttendanceMonthly } from "./MonthlyTab";
import { HrmAttendanceShifts } from "./ShiftsTab";
import { HrmAttendanceGeoFence } from "./GeoFenceTab";
import { HrmAttendanceCorrections } from "./CorrectionsTab";
import { HrmPlaceholder } from "../HrmPlaceholder";

const TABS = [
  "Daily Attendance", "Monthly Register", "Shifts & Roster", "ADMS Devices",
  "Device Events", "Unknown Users", "Sync Monitor", "QR Attendance",
  "Geo-Fence", "Corrections",
] as const;
type Tab = (typeof TABS)[number];

const NOT_AVAILABLE: Partial<Record<Tab, string>> = {
  "ADMS Devices": "ZKTeco ADMS device management requires a device push protocol integration.",
  "Device Events": "Device event ingestion requires the ADMS push protocol.",
  "Unknown Users": "Unknown user mapping requires the ADMS device integration.",
  "Sync Monitor": "Device sync monitoring requires the ADMS push protocol.",
  "QR Attendance": "QR code attendance requires a QR token generation and validation API.",
};

export function HrmAttendanceShell() {
  const [tab, setTab] = useState<Tab>("Daily Attendance");

  return (
    <div>
      <h1 className="hrm-page-title">Attendance &amp; Shifts</h1>
      <p className="hrm-page-subtitle">
        Shift-aware daily marking, monthly register, shift definitions and geo-fence punch validation
      </p>

      <div className="flex flex-wrap gap-1 mb-4">
        {TABS.map((t) => (
          <button key={t} className={`hrm-pill ${tab === t ? "hrm-pill-active" : ""}`}
            onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      {tab === "Daily Attendance" && <HrmAttendanceDaily />}
      {tab === "Monthly Register" && <HrmAttendanceMonthly />}
      {tab === "Shifts & Roster" && <HrmAttendanceShifts />}
      {tab === "Geo-Fence" && <HrmAttendanceGeoFence />}
      {tab === "Corrections" && <HrmAttendanceCorrections />}
      {NOT_AVAILABLE[tab] && (
        <div className="hrm-card" style={{ padding: 48, textAlign: "center" }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: "#334155", margin: 0 }}>
            {tab} — not available yet
          </p>
          <p style={{ fontSize: 12, color: "var(--hrm-muted)", marginTop: 6, maxWidth: 480, marginLeft: "auto", marginRight: "auto" }}>
            {NOT_AVAILABLE[tab]}
          </p>
        </div>
      )}
    </div>
  );
}
