// src/features/hrm/pages/EmployeeSelfServicePage.tsx
//
// The employee-facing counterpart to EmployeeManagementPage — every
// logged-in staff member (owner or not) can see their own data here, no
// hrManagement permission required (these are the self-service routes in
// hrm.routes.ts: check-in/out, /employees/me, leave apply, leave balances).
//
// Mount at any path reachable by all roles, e.g. /account/hrm (both admin
// and vendor dashboards can link here from the user menu).

"use client";

import { useState } from "react";
import { HrmWorkspaceEntry } from "@/components/hrm/HrmWorkspaceEntry";
import {
  useGetMyProfileQuery,
  useCheckInMutation,
  useCheckOutMutation,
  useGetMyLeaveBalancesQuery,
  useGetMyLeaveRequestsQuery,
  useApplyLeaveMutation,
  useGetLeaveTypesQuery,
} from "../../../features/hrmApi";

export default function EmployeeSelfServicePage() {
  const { data: profile, isLoading: profileLoading, isError: profileError } = useGetMyProfileQuery();
  const [checkIn, { isLoading: checkingIn }] = useCheckInMutation();
  const [checkOut, { isLoading: checkingOut }] = useCheckOutMutation();
  const { data: balances } = useGetMyLeaveBalancesQuery();
  const { data: myLeaves } = useGetMyLeaveRequestsQuery();
  const { data: leaveTypes } = useGetLeaveTypesQuery();
  const [applyLeave, { isLoading: applying }] = useApplyLeaveMutation();

  const [leaveForm, setLeaveForm] = useState({ leaveTypeId: "", fromDate: "", toDate: "", days: 1, reason: "" });
  const [error, setError] = useState<string | null>(null);

  if (profileLoading) return <p className="p-6 text-sm text-gray-400">Loading…</p>;

  // Owners (ADMIN/VENDOR) and unlinked accounts have no HR profile — every
  // section below would fail against the backend, so show a clean empty
  // state instead of a half-broken page.
  if (profileError || !profile?.data) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
        <h1 className="text-lg font-semibold text-gray-900">My HR</h1>
        <p className="mt-2 text-sm text-gray-500">
          No employee profile is linked to this account. If you are a staff member, ask your administrator to link your HR profile.
        </p>
      </div>
    );
  }

  const p = profile?.data;

  async function handleApplyLeave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await applyLeave(leaveForm).unwrap();
      setLeaveForm({ leaveTypeId: "", fromDate: "", toDate: "", days: 1, reason: "" });
    } catch (err: any) {
      setError(err?.data?.message || "Failed to apply for leave.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end"><HrmWorkspaceEntry /></div>
      <div className="rounded-xl border border-gray-200 p-4">
        <h1 className="text-lg font-semibold text-gray-900">My Profile</h1>
        <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-gray-600">
          <p><span className="text-gray-400">Name:</span> {p?.fullName}</p>
          <p><span className="text-gray-400">Code:</span> {p?.code}</p>
          <p><span className="text-gray-400">Branch:</span> {p?.branch?.name || "—"}</p>
          <p><span className="text-gray-400">Department:</span> {p?.department?.name || "—"}</p>
          <p><span className="text-gray-400">Designation:</span> {p?.designation?.name || "—"}</p>
          <p><span className="text-gray-400">Status:</span> {p?.status}</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 p-4">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Attendance</h2>
        <div className="flex gap-2">
          <button
            onClick={() => checkIn()}
            disabled={checkingIn}
            className="rounded-md bg-green-600 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {checkingIn ? "…" : "Check In"}
          </button>
          <button
            onClick={() => checkOut()}
            disabled={checkingOut}
            className="rounded-md bg-gray-700 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {checkingOut ? "…" : "Check Out"}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 p-4">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Leave Balance</h2>
        <div className="flex flex-wrap gap-3">
          {balances?.data.map((b) => (
            <div key={b.id} className="rounded-lg bg-gray-50 px-3 py-2 text-sm">
              <p className="font-medium">{b.leaveType.name}</p>
              <p className="text-gray-500">{b.entitled - b.used - b.pending} days left</p>
            </div>
          ))}
          {!balances?.data.length && <p className="text-sm text-gray-400">No leave balance recorded yet.</p>}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 p-4">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Apply for Leave</h2>
        {error && <div className="mb-3 rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>}
        <form onSubmit={handleApplyLeave} className="grid grid-cols-2 gap-3">
          <select
            className="col-span-2 rounded-md border border-gray-300 px-3 py-2 text-sm"
            value={leaveForm.leaveTypeId}
            onChange={(e) => setLeaveForm({ ...leaveForm, leaveTypeId: e.target.value })}
            required
          >
            <option value="">Select leave type</option>
            {leaveTypes?.data.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <input type="date" className="rounded-md border border-gray-300 px-3 py-2 text-sm" value={leaveForm.fromDate}
            onChange={(e) => setLeaveForm({ ...leaveForm, fromDate: e.target.value })} required />
          <input type="date" className="rounded-md border border-gray-300 px-3 py-2 text-sm" value={leaveForm.toDate}
            onChange={(e) => setLeaveForm({ ...leaveForm, toDate: e.target.value })} required />
          <input type="number" min={0.5} step={0.5} className="rounded-md border border-gray-300 px-3 py-2 text-sm" placeholder="Days"
            value={leaveForm.days} onChange={(e) => setLeaveForm({ ...leaveForm, days: Number(e.target.value) })} />
          <textarea className="col-span-2 rounded-md border border-gray-300 px-3 py-2 text-sm" placeholder="Reason (optional)" rows={2}
            value={leaveForm.reason} onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })} />
          <button type="submit" disabled={applying} className="col-span-2 rounded-md bg-indigo-600 px-4 py-2 text-sm text-white disabled:opacity-50">
            {applying ? "Submitting…" : "Submit Leave Request"}
          </button>
        </form>
      </div>

      <div className="rounded-xl border border-gray-200 p-4">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">My Leave Requests</h2>
        <ul className="space-y-2">
          {myLeaves?.items.map((r) => (
            <li key={r.id} className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2 text-sm">
              <span>{r.leaveType?.name}: {r.fromDate} → {r.toDate} ({r.days}d)</span>
              <span className="text-xs font-medium text-gray-500">{r.status}</span>
            </li>
          ))}
          {!myLeaves?.items.length && <p className="text-sm text-gray-400">No leave requests yet.</p>}
        </ul>
      </div>
    </div>
  );
}
