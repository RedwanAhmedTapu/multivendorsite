// src/app/vendor-dashboard/@main/hrm/employees/[id]/page.tsx
//
// Employee 360 for a vendor's staff — renders the shared page with the
// vendor scope. Reachable from the vendor employee directory's "View".

"use client";

import { useParams } from "next/navigation";
import Employee360Page from "@/othersfeatures/hrm/pages/Employee360Page";

export default function VendorEmployee360Route() {
  const params = useParams<{ id: string }>();
  const employeeId = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : "";
  if (!employeeId) return <p className="p-6 text-sm text-gray-400">No employee selected.</p>;
  return <Employee360Page scope="vendor" employeeId={employeeId} />;
}
