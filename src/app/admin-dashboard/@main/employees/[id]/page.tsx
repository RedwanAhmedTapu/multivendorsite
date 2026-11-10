// src/app/admin-dashboard/@main/employees/[id]/page.tsx
//
// Employee 360 for platform staff — renders the shared page with the
// admin scope. Reachable from the employee directory's "View" action.

"use client";

import { useParams } from "next/navigation";
import Employee360Page from "@/othersfeatures/hrm/pages/Employee360Page";

export default function AdminEmployee360Route() {
  const params = useParams<{ id: string }>();
  const employeeId = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : "";
  if (!employeeId) return <p className="p-6 text-sm text-gray-400">No employee selected.</p>;
  return <Employee360Page scope="admin" employeeId={employeeId} />;
}
