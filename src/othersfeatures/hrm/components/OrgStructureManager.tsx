// src/features/hrm/components/OrgStructureManager.tsx
//
// Quick CRUD for Branch / Department / Designation — the organization
// structure that EmployeeProfileDrawer's dropdowns pull from. Needs to be
// set up once before assigning employees to a branch/department.

import { useState } from "react";
import {
  useGetBranchesQuery, useCreateBranchMutation, useDeleteBranchMutation,
  useGetDepartmentsQuery, useCreateDepartmentMutation, useDeleteDepartmentMutation,
  useGetDesignationsQuery, useCreateDesignationMutation, useDeleteDesignationMutation,
} from "../../../features/hrmApi";
import { toArray } from "@/components/hrm/hrm-utils";

const inputCls = "w-full rounded-md border border-gray-300 px-3 py-2 text-sm";

function QuickAddRow({ placeholder, onAdd, extra }: { placeholder: string; onAdd: (code: string, name: string) => void; extra?: React.ReactNode }) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  return (
    <div className="flex gap-2 items-center">
      <input className={inputCls + " w-24"} placeholder="Code" value={code} onChange={(e) => setCode(e.target.value)} />
      <input className={inputCls} placeholder={placeholder} value={name} onChange={(e) => setName(e.target.value)} />
      {extra}
      <button
        onClick={() => { if (code && name) { onAdd(code, name); setCode(""); setName(""); } }}
        className="shrink-0 rounded-md bg-indigo-600 px-3 py-2 text-sm text-white"
      >
        Add
      </button>
    </div>
  );
}

export function OrgStructureManager() {
  const { data: branches } = useGetBranchesQuery();
  const [createBranch] = useCreateBranchMutation();
  const [deleteBranch] = useDeleteBranchMutation();

  const { data: departments } = useGetDepartmentsQuery();
  const [createDepartment] = useCreateDepartmentMutation();
  const [deleteDepartment] = useDeleteDepartmentMutation();

  const { data: designations } = useGetDesignationsQuery();
  const [createDesignation] = useCreateDesignationMutation();
  const [deleteDesignation] = useDeleteDesignationMutation();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Branches */}
      <div className="rounded-xl border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Branches</h3>
        <QuickAddRow placeholder="Branch name" onAdd={(code, name) => createBranch({ code, name })} />
        <ul className="mt-3 space-y-1">
          {toArray(branches?.data).map((b) => (
            <li key={b.id} className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2 text-sm">
              <span>{b.name} <span className="text-gray-400">({b.code})</span></span>
              <button onClick={() => deleteBranch(b.id)} className="text-xs text-red-500 hover:underline">Deactivate</button>
            </li>
          ))}
        </ul>
      </div>

      {/* Departments */}
      <div className="rounded-xl border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Departments</h3>
        <QuickAddRow placeholder="Department name" onAdd={(code, name) => createDepartment({ code, name })} />
        <ul className="mt-3 space-y-1">
          {toArray(departments?.data).map((d) => (
            <li key={d.id} className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2 text-sm">
              <span>{d.name} <span className="text-gray-400">({d.code})</span></span>
              <button onClick={() => deleteDepartment(d.id)} className="text-xs text-red-500 hover:underline">Archive</button>
            </li>
          ))}
        </ul>
      </div>

      {/* Designations */}
      <div className="rounded-xl border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Designations</h3>
        <QuickAddRow placeholder="Designation name" onAdd={(code, name) => createDesignation({ code, name })} />
        <ul className="mt-3 space-y-1">
          {toArray(designations?.data).map((d) => (
            <li key={d.id} className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2 text-sm">
              <span>{d.name} <span className="text-gray-400">({d.code})</span></span>
              <button onClick={() => deleteDesignation(d.id)} className="text-xs text-red-500 hover:underline">Archive</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
