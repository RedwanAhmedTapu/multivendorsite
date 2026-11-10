// src/features/hrm/components/PermissionEditorModal.tsx
//
// Owner-only. Edits an EXISTING employee's permission checkboxes.
// Only mount this component behind an isOwner check at the call site
// (EmployeeTable.tsx / Employee360Page.tsx already do this) — never render
// its trigger button for a logged-in EMPLOYEE, even one with hrManagement.
//
// PHASE F:
// - Loads the employee's CURRENT granted set from GET …/permissions (the
//   endpoint now returns the permission map itself) and shows it pre-checked.
// - "N granted" summary + a "Currently granted" chip list at the top.
// - Saving sends ONLY the changed keys; the backend merges the diff over the
//   stored set, so untouched grants survive.
// - A user can never grant more than they hold: sensitive salary/bank keys
//   are locked for VENDOR actors (the backend rejects them regardless).

import { useState } from "react";
import {
  useGetEmployeePermissionsQuery,
  useUpdateEmployeePermissionsMutation,
  type EmployeePermissions,
} from "../../../features/employeeApi";
import { usePermissions } from "../../../hooks/usePermissions";
import { PermissionCheckboxGroup, PERMISSION_LABELS } from "./PermissionCheckboxGroup";

const ALL_PERMISSION_KEYS = Object.keys(PERMISSION_LABELS) as Array<keyof EmployeePermissions>;

/** Keys a VENDOR owner does not hold (never auto-passed) — cannot grant. */
const SENSITIVE_GRANT_KEYS = ["hrSalaryView", "hrSalaryEdit", "hrBankView"];

export function PermissionEditorModal({
  employeeId,
  employeeName,
  onClose,
}: {
  employeeId: string;
  employeeName: string;
  onClose: () => void;
}) {
  const { data, isLoading: fetching, isError } = useGetEmployeePermissionsQuery(employeeId);
  const [updatePermissions, { isLoading: saving }] = useUpdateEmployeePermissionsMutation();
  const [draft, setDraft] = useState<EmployeePermissions | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { role } = usePermissions();

  const loaded = (data?.data ?? {}) as EmployeePermissions;
  const current = draft ?? loaded;

  const grantedKeys = ALL_PERMISSION_KEYS.filter((k) => !!current[k]);
  // ADMIN holds everything; VENDOR cannot grant the sensitive salary/bank keys.
  const disabledKeys = role === "ADMIN" ? [] : SENSITIVE_GRANT_KEYS;

  async function handleSave() {
    setError(null);
    // Send ONLY the changes relative to the loaded set — never the whole
    // object (and never a diff computed against an unloaded/error state,
    // which could wipe existing grants).
    if (fetching || isError || !data) return;
    const changes: EmployeePermissions = {};
    for (const k of ALL_PERMISSION_KEYS) {
      if (!!current[k] !== !!loaded[k]) {
        (changes as Record<string, boolean>)[k] = !!current[k];
      }
    }
    if (Object.keys(changes).length === 0) {
      onClose();
      return;
    }
    try {
      await updatePermissions({ employeeId, permissions: changes }).unwrap();
      onClose();
    } catch (err: any) {
      setError(err?.data?.message || "Failed to update permissions.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b p-4">
          <div>
            <h2 className="text-lg font-semibold">Edit Permissions</h2>
            <p className="text-xs text-gray-500">{employeeName}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <div className="p-4 space-y-4">
          {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>}
          {isError ? (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
              Could not load the current permissions — saving is disabled so existing grants are never overwritten.
            </div>
          ) : fetching ? (
            <p className="text-sm text-gray-500">Loading…</p>
          ) : (
            <>
              {/* "N granted" summary + currently granted chips */}
              <div className="rounded-lg border border-indigo-100 bg-indigo-50/60 p-3">
                <p className="text-sm font-semibold text-gray-900">
                  {grantedKeys.length} granted
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {grantedKeys.length === 0 ? (
                    <p className="text-xs text-gray-500">No permissions granted yet.</p>
                  ) : (
                    grantedKeys.map((k) => (
                      <span
                        key={k}
                        className="rounded-full border border-indigo-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-indigo-700"
                      >
                        {PERMISSION_LABELS[k] ?? k}
                      </span>
                    ))
                  )}
                </div>
              </div>
              {disabledKeys.length > 0 && (
                <p className="text-xs text-gray-400">
                  Locked keys are permissions your own account does not hold — a user can never grant more than they hold.
                </p>
              )}
              <PermissionCheckboxGroup value={current} onChange={setDraft} disabledKeys={disabledKeys} />
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t p-4">
          <button onClick={onClose} className="rounded-md border border-gray-300 px-4 py-2 text-sm">Cancel</button>
          <button
            onClick={handleSave}
            disabled={saving || fetching || isError || !data}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save Permissions"}
          </button>
        </div>
      </div>
    </div>
  );
}
