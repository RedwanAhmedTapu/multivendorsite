// src/app/hrm/[section]/page.tsx
//
// Placeholder pages for the /hrm sections that arrive in later phases
// (Employee Directory, Organization, Attendance, Leave, Payroll, Documents,
// Reports, Settings, ...). The sidebar already links these real routes so
// refresh/back-forward work; each renders the section header plus an
// explicit "coming in the next phase" state — never invented data.
// Unknown sections 404.

"use client";

import { notFound, useParams } from "next/navigation";
import { HRM_SECTION_META } from "@/components/hrm/hrm-nav-config";
import { HrmPlaceholder } from "@/components/hrm/HrmPlaceholder";
import { HrmGate } from "@/components/hrm/HrmGate";

const KNOWN = new Set(Object.keys(HRM_SECTION_META));

export default function HrmSectionPage() {
  const params = useParams<{ section: string }>();
  const section = typeof params?.section === "string" ? params.section : Array.isArray(params?.section) ? params.section[0] : "";
  const meta = KNOWN.has(section) ? HRM_SECTION_META[section] : null;
  if (!meta) notFound();
  return (
    <HrmGate section={section}>
      <HrmPlaceholder title={meta.title} subtitle={meta.subtitle} />
    </HrmGate>
  );
}
