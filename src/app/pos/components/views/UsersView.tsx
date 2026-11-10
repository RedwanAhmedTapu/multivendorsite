// app/pos/components/views/UsersView.tsx
"use client";

// POS staff. The POS has no separate cashier logins any more: people use the
// POS with their own FinixMart employee account, and what they may do is set
// on the employee (HR → Employees → Permissions: POS Terminal Access, POS
// discounts, POS credit sales, POS refunds & voids, POS reports). The server
// re-checks those on every request.
//
// Older terminal logins (PosStaff) are listed read-only because past sales
// still name them; they can no longer sign in.

import Link from "next/link";
import { Crown } from "lucide-react";
import { useGetStaffQuery, type PosStaff } from "@/features/posApi";
import { Badge, EmptyState } from "../../ui";

export default function UsersView({ staff }: { staff: PosStaff }) {
  const { data, isFetching, isError } = useGetStaffQuery(undefined, { skip: !staff.isAdmin });
  const legacy = data?.data ?? [];

  if (!staff.isAdmin) {
    return <div className="h-full flex items-center justify-center"><EmptyState icon={<span className="text-4xl">🚫</span>} text="Store owner only" /></div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white px-5 py-4 border-b border-slate-100 shrink-0">
        <div className="text-sm font-bold text-slate-800">POS staff</div>
        <div className="text-[10px] text-slate-400">Who can use this store&apos;s POS</div>
      </div>
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-800 space-y-1">
          <p>Your staff use the POS with their own employee account — no separate POS password.</p>
          <p>
            Give access in{" "}
            <Link href="/vendor-dashboard/hrm/employees" className="font-bold underline">Employees</Link>{" "}
            → Permissions: <b>POS Terminal Access</b>, plus <b>POS discounts</b>, <b>POS credit sales</b>, <b>POS refunds &amp; voids</b> and{" "}
            <b>POS reports</b> as needed. Removing a permission takes effect on their next action.
          </p>
        </div>

        <div>
          <div className="text-[10px] font-extrabold text-slate-300 uppercase tracking-widest mb-2">Old terminal logins (history only)</div>
          {isFetching ? (
            <div className="text-xs text-slate-400">Loading…</div>
          ) : isError ? (
            <div className="text-xs text-red-600">Couldn&apos;t load the old logins.</div>
          ) : legacy.length === 0 ? (
            <div className="text-xs text-slate-400">None.</div>
          ) : (
            <div className="space-y-2">
              {legacy.map((u) => (
                <div key={u.id} className="bg-white rounded-2xl border border-slate-100 p-3.5 flex items-center gap-3 shadow-sm">
                  <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center font-extrabold text-slate-600 text-sm shrink-0">{u.displayName[0]}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-extrabold text-slate-800">{u.displayName}</div>
                    <div className="text-[10px] text-slate-400">
                      @{u.username} · {u._count?.sales ?? 0} past sale(s){u.employeeId ? " · linked to an employee" : ""}
                    </div>
                  </div>
                  {u.isAdmin && <Badge color="purple"><Crown size={10} /> Admin</Badge>}
                  <span className="text-[10px] font-bold text-slate-400">Can&apos;t sign in</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
