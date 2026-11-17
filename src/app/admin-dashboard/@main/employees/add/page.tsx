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
import { ModalSkeleton, PageSkeleton, Sk } from "@/components/admin/ui/AdminSkeletons";

export default function AddEmployeePage() {
  const router = useRouter();
  const { isOwner, isLoading } = usePermissions();

  if (isLoading) {
    return (
      <PageSkeleton className="max-w-2xl">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <Sk className="h-5 w-44" />
          <Sk soft className="mt-2 h-2.5 w-72 max-w-full" />
          <div className="mt-6">
            <ModalSkeleton rows={6} />
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <Sk className="h-9 w-24 rounded-lg" />
            <Sk className="h-9 w-32 rounded-lg bg-indigo-200/70" />
          </div>
        </div>
      </PageSkeleton>
    );
  }

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
