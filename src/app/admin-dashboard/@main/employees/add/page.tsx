// src/app/admin-dashboard/@main/employees/add/page.tsx
//
// Standalone "Add Employee" entry point for the sidebar item. Reuses the
// exact same EmployeeFormModal as the "Add Employee" button on the Employee
// Management directory page — no duplicate form. Closing the modal
// (cancel or success) returns to the directory, which refreshes itself via
// RTK Query tag invalidation.

"use client";

import { useRouter } from "next/navigation";
import { usePermissions } from "@/hooks/usePermissions";
import { EmployeeFormModal } from "@/othersfeatures/hrm/components/EmployeeFormModal";

export default function AddEmployeePage() {
  const router = useRouter();
  const { isOwner, isLoading } = usePermissions();

  if (isLoading) return <p className="p-6 text-sm text-gray-400">Loading…</p>;

  // The backend create endpoint is ADMIN-only (authorizeRoles('ADMIN') in
  // employee.routes.ts) — mirror that in the UI instead of letting a
  // permissioned employee hit a guaranteed 403 on submit.
  if (!isOwner) {
    return <p className="p-6 text-sm text-gray-500">Only an owner can add employees.</p>;
  }

  return (
    <EmployeeFormModal
      scope="admin"
      onClose={() => router.push("/admin-dashboard/employees")}
    />
  );
}
