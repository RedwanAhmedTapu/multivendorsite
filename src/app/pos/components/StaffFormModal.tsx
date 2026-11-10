// app/pos/components/StaffFormModal.tsx
"use client";

// Retired: the POS no longer has its own cashier logins (PosStaff), so there
// is nothing to create or edit here. Staff use their FinixMart employee
// account; POS permissions are set on the employee (HR → Employees →
// Permissions). Kept as a harmless notice so any stray import still renders.

import Link from "next/link";
import { X } from "lucide-react";
import type { PosStaff } from "@/features/posApi";

export default function StaffFormModal({
  onClose,
}: {
  editData?: PosStaff | null;
  onClose: () => void;
  onSaved?: (staff: PosStaff) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" role="dialog" aria-modal="true" aria-label="POS staff">
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-sm font-bold text-slate-800">POS staff</div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"><X size={16} /></button>
        </div>
        <p className="text-xs text-slate-600">
          Cashiers now use their own employee account. Manage POS permissions in{" "}
          <Link href="/vendor-dashboard/hrm/employees" className="font-bold text-cyan-700 underline">Employees</Link>.
        </p>
      </div>
    </div>
  );
}
