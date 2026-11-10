// src/features/hrm/pages/EmployeeManagementPage.tsx
//
// The full HRM-style "Employee Management" page — mount this at
//   /admin-dashboard/employees            (scope="admin")
//   /vendor-dashboard/hrm/employees       (scope="vendor")
//
// Tabs: Directory (list + edit) and Organization (branch/department/
// designation setup). "Add Employee" is owner-only, matching the sidebar's
// OWNER_ONLY / hrManagement split from the layout files in this package.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { usePermissions } from "../../../hooks/usePermissions";
import { HrmWorkspaceEntry } from "@/components/hrm/HrmWorkspaceEntry";
import { EmployeeTable } from "../components/EmployeeTable";
import { OrgStructureManager } from "../components/OrgStructureManager";
import { EmployeeFormModal } from "../components/EmployeeFormModal";

type Tab = "directory" | "organization";

export default function EmployeeManagementPage({ scope }: { scope: "admin" | "vendor" }) {
  const [tab, setTab] = useState<Tab>("directory");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { isOwner, isLoading } = usePermissions();
  const router = useRouter();

  if (isLoading) return <p className="p-6 text-sm text-gray-400">Loading…</p>;

  const employee360Path = (id: string) =>
    scope === "admin" ? `/admin-dashboard/employees/${id}` : `/vendor-dashboard/hrm/employees/${id}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <HrmWorkspaceEntry />
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Employee Management</h1>
          <p className="text-sm text-gray-500">Manage your {scope === "admin" ? "platform" : "store"} staff, their access, and HR data.</p>
        </div>
        {isOwner && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" /> Add Employee
          </button>
        )}
      </div>

      <div className="flex gap-1 border-b border-gray-200">
        <TabButton active={tab === "directory"} onClick={() => setTab("directory")}>Directory</TabButton>
        {isOwner && (
          <TabButton active={tab === "organization"} onClick={() => setTab("organization")}>
            Organization (Branch / Dept / Designation)
          </TabButton>
        )}
      </div>

      {tab === "directory" && <EmployeeTable scope={scope} />}
      {tab === "organization" && isOwner && <OrgStructureManager />}

      {/* One-step form: account + job placement + permissions in a single
          submit — there is no second "complete the HR profile" screen to
          open afterwards. The directory refreshes itself via RTK Query
          tag invalidation once the modal closes. */}
      {showCreateModal && (
        <EmployeeFormModal
          scope={scope}
          onClose={() => setShowCreateModal(false)}
          onCreated={(hrProfileId) => router.push(employee360Path(hrProfileId))}
        />
      )}
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
        active ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"
      }`}
    >
      {children}
    </button>
  );
}