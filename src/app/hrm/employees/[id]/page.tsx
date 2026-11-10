// src/app/hrm/employees/[id]/page.tsx — Employee 360 inside the /hrm
// workspace. Reuses the EXISTING Employee 360 implementation and APIs
// (salary/bank shaping, masking, lifecycle, archive/hard-delete, shift via
// shiftAssignments) — only the surrounding chrome is the HRM shell, and the
// scope derives from the logged-in role so tenant behavior stays exact.

"use client";

import { useParams } from "next/navigation";
import Employee360Page from "@/othersfeatures/hrm/pages/Employee360Page";
import { usePermissions } from "@/hooks/usePermissions";
import { HrmGate } from "@/components/hrm/HrmGate";

export default function HrmEmployee360Route() {
  const params = useParams<{ id: string }>();
  const { me } = usePermissions();
  const employeeId = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : "";
  if (!employeeId) return <p className="p-6 text-sm" style={{ color: "var(--hrm-muted)" }}>No employee selected.</p>;

  // Vendor sessions manage vendor employees (vendor-scoped APIs); everyone
  // else rides the platform path. Tenant isolation stays server-side.
  const scope = me?.role === "VENDOR" ? "vendor" : "admin";
  return (
    <HrmGate section="employees">
      <Employee360Page scope={scope} employeeId={employeeId} basePath="/hrm/employees" />
    </HrmGate>
  );
}
