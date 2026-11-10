// src/features/hrm/components/EmployeeProfileDrawer.tsx
//
// Edits the RICH HR profile (HrEmployeeProfile) — full personal info,
// emergency contacts, addresses, org placement, employment status, grade
// and reporting manager. Uses hrmApi, not employeeApi (that one only
// handles the login account + permissions). Any staff with hrManagement
// can open this for others; the employee themself can view (not
// necessarily edit) their own via /hrm/employees/me.

import { useEffect, useState } from "react";
import {
  useGetEmployeeByIdQuery,
  useUpdateEmployeeMutation,
  useGetBranchesQuery,
  useGetDepartmentsQuery,
  useGetDesignationsQuery,
  useGetEmployeesQuery,
} from "../../../features/hrmApi";
import { toArray } from "@/components/hrm/hrm-utils";

const inputCls =
  "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500";

export function EmployeeProfileDrawer({ employeeId, onClose }: { employeeId: string; onClose: () => void }) {
  const { data, isLoading } = useGetEmployeeByIdQuery(employeeId);
  const { data: branches } = useGetBranchesQuery();
  const { data: departments } = useGetDepartmentsQuery();
  const { data: designations } = useGetDesignationsQuery();
  const { data: colleagues } = useGetEmployeesQuery({ page: 1, limit: 100 });
  const [updateEmployee, { isLoading: saving }] = useUpdateEmployeeMutation();

  const profile = data?.data;
  const [form, setForm] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setForm({
        fullName: profile.fullName ?? "",
        nameBn: profile.nameBn ?? "",
        fatherName: profile.fatherName ?? "",
        motherName: profile.motherName ?? "",
        spouseName: profile.spouseName ?? "",
        dob: profile.dob ?? "",
        gender: profile.gender ?? "",
        bloodGroup: profile.bloodGroup ?? "",
        maritalStatus: profile.maritalStatus ?? "",
        nationality: profile.nationality ?? "",
        religion: profile.religion ?? "",
        mobile: profile.mobile ?? "",
        altMobile: profile.altMobile ?? "",
        personalEmail: profile.personalEmail ?? "",
        emergencyName: profile.emergencyName ?? "",
        emergencyRelation: profile.emergencyRelation ?? "",
        emergencyMobile: profile.emergencyMobile ?? "",
        presentAddress: profile.presentAddress ?? "",
        permanentAddress: profile.permanentAddress ?? "",
        division: profile.division ?? "",
        district: profile.district ?? "",
        city: profile.city ?? "",
        postCode: profile.postCode ?? "",
        branchId: profile.branchId ?? "",
        departmentId: profile.departmentId ?? "",
        designationId: profile.designationId ?? "",
        reportingManagerId: profile.reportingManagerId ?? "",
        workLocation: profile.workLocation ?? "",
        employmentType: profile.employmentType ?? "PERMANENT",
        status: profile.status ?? "ACTIVE",
        grade: profile.grade ?? "",
        joiningDate: profile.joiningDate ?? "",
        confirmationDate: profile.confirmationDate ?? "",
      });
    }
  }, [profile]);

  function set(name: string, value: string) {
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function handleSave() {
    setError(null);
    // Omit empty strings so untouched fields aren't overwritten with "".
    const payload: Record<string, string> = {};
    Object.entries(form).forEach(([k, v]) => {
      if (v !== "") payload[k] = v;
    });
    try {
      await updateEmployee({ id: employeeId, data: payload }).unwrap();
      onClose();
    } catch (err: any) {
      setError(err?.data?.message || "Failed to save profile.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
      <div className="h-full w-full max-w-lg overflow-y-auto bg-white shadow-xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white p-4">
          <h2 className="text-lg font-semibold">Edit Profile</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        {isLoading ? (
          <p className="p-4 text-sm text-gray-500">Loading…</p>
        ) : (
          <div className="space-y-5 p-4">
            {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>}

            <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
                {profile?.code}
              </div>
              <div>
                <p className="text-sm font-medium">{profile?.fullName}</p>
                <p className="text-xs text-gray-500">{profile?.status}</p>
              </div>
            </div>

            <Group title="Identity">
              <Field label="Full Name"><input className={inputCls} value={form.fullName || ""} onChange={(e) => set("fullName", e.target.value)} /></Field>
              <Field label="Name (Bangla)"><input className={inputCls} value={form.nameBn || ""} onChange={(e) => set("nameBn", e.target.value)} /></Field>
              <Field label="Date of Birth"><input type="date" className={inputCls} value={form.dob || ""} onChange={(e) => set("dob", e.target.value)} /></Field>
              <Field label="Gender">
                <select className={inputCls} value={form.gender || ""} onChange={(e) => set("gender", e.target.value)}>
                  <option value="">— select —</option>
                  {["MALE", "FEMALE", "OTHER"].map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </Field>
              <Field label="Blood Group">
                <select className={inputCls} value={form.bloodGroup || ""} onChange={(e) => set("bloodGroup", e.target.value)}>
                  <option value="">— select —</option>
                  {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </Field>
              <Field label="Marital Status">
                <select className={inputCls} value={form.maritalStatus || ""} onChange={(e) => set("maritalStatus", e.target.value)}>
                  <option value="">— select —</option>
                  {["SINGLE", "MARRIED", "DIVORCED", "WIDOWED"].map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </Field>
              <Field label="Father's Name"><input className={inputCls} value={form.fatherName || ""} onChange={(e) => set("fatherName", e.target.value)} /></Field>
              <Field label="Mother's Name"><input className={inputCls} value={form.motherName || ""} onChange={(e) => set("motherName", e.target.value)} /></Field>
              <Field label="Spouse Name"><input className={inputCls} value={form.spouseName || ""} onChange={(e) => set("spouseName", e.target.value)} /></Field>
              <Field label="Nationality"><input className={inputCls} value={form.nationality || ""} onChange={(e) => set("nationality", e.target.value)} /></Field>
              <Field label="Religion">
                <select className={inputCls} value={form.religion || ""} onChange={(e) => set("religion", e.target.value)}>
                  <option value="">— select —</option>
                  {["ISLAM", "HINDUISM", "BUDDHISM", "CHRISTIANITY", "OTHER"].map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </Field>
            </Group>

            <Group title="Contact">
              <Field label="Mobile"><input className={inputCls} value={form.mobile || ""} onChange={(e) => set("mobile", e.target.value)} /></Field>
              <Field label="Alternate Mobile"><input className={inputCls} value={form.altMobile || ""} onChange={(e) => set("altMobile", e.target.value)} /></Field>
              <Field label="Personal Email"><input className={inputCls} value={form.personalEmail || ""} onChange={(e) => set("personalEmail", e.target.value)} /></Field>
            </Group>

            <Group title="Emergency contact">
              <Field label="Name"><input className={inputCls} value={form.emergencyName || ""} onChange={(e) => set("emergencyName", e.target.value)} /></Field>
              <Field label="Relation"><input className={inputCls} value={form.emergencyRelation || ""} onChange={(e) => set("emergencyRelation", e.target.value)} /></Field>
              <Field label="Mobile"><input className={inputCls} value={form.emergencyMobile || ""} onChange={(e) => set("emergencyMobile", e.target.value)} /></Field>
            </Group>

            <Group title="Addresses">
              <Field label="Present Address"><textarea rows={2} className={inputCls} value={form.presentAddress || ""} onChange={(e) => set("presentAddress", e.target.value)} /></Field>
              <Field label="Permanent Address"><textarea rows={2} className={inputCls} value={form.permanentAddress || ""} onChange={(e) => set("permanentAddress", e.target.value)} /></Field>
              <Field label="Division"><input className={inputCls} value={form.division || ""} onChange={(e) => set("division", e.target.value)} /></Field>
              <Field label="District"><input className={inputCls} value={form.district || ""} onChange={(e) => set("district", e.target.value)} /></Field>
              <Field label="City"><input className={inputCls} value={form.city || ""} onChange={(e) => set("city", e.target.value)} /></Field>
              <Field label="Post Code"><input className={inputCls} value={form.postCode || ""} onChange={(e) => set("postCode", e.target.value)} /></Field>
            </Group>

            <Group title="Employment">
              <Field label="Branch">
                <select className={inputCls} value={form.branchId || ""} onChange={(e) => set("branchId", e.target.value)}>
                  <option value="">— none —</option>
                  {toArray(branches?.data).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </Field>
              <Field label="Department">
                <select className={inputCls} value={form.departmentId || ""} onChange={(e) => set("departmentId", e.target.value)}>
                  <option value="">— none —</option>
                  {toArray(departments?.data).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </Field>
              <Field label="Designation">
                <select className={inputCls} value={form.designationId || ""} onChange={(e) => set("designationId", e.target.value)}>
                  <option value="">— none —</option>
                  {toArray(designations?.data).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </Field>
              <Field label="Reporting Manager">
                <select className={inputCls} value={form.reportingManagerId || ""} onChange={(e) => set("reportingManagerId", e.target.value)}>
                  <option value="">— none —</option>
                  {colleagues?.items
                    .filter((c) => c.id !== employeeId)
                    .map((c) => <option key={c.id} value={c.id}>{c.fullName} ({c.code})</option>)}
                </select>
              </Field>
              <Field label="Work Location"><input className={inputCls} value={form.workLocation || ""} onChange={(e) => set("workLocation", e.target.value)} /></Field>
              <Field label="Grade"><input className={inputCls} value={form.grade || ""} onChange={(e) => set("grade", e.target.value)} /></Field>
              <Field label="Employment Type">
                <select className={inputCls} value={form.employmentType || "PERMANENT"} onChange={(e) => set("employmentType", e.target.value)}>
                  {["PERMANENT", "PROBATIONARY", "CONTRACTUAL", "TEMPORARY", "PART_TIME", "INTERN"].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </Field>
              <Field label="Status">
                <select className={inputCls} value={form.status || "ACTIVE"} onChange={(e) => set("status", e.target.value)}>
                  {["ACTIVE", "PROBATION", "ON_LEAVE", "SUSPENDED", "RESIGNED", "TERMINATED", "RETIRED", "INACTIVE"].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </Field>
              <Field label="Joining Date"><input type="date" className={inputCls} value={form.joiningDate || ""} onChange={(e) => set("joiningDate", e.target.value)} /></Field>
              <Field label="Confirmation Date"><input type="date" className={inputCls} value={form.confirmationDate || ""} onChange={(e) => set("confirmationDate", e.target.value)} /></Field>
            </Group>

            <div className="sticky bottom-0 flex justify-end gap-2 border-t bg-white pt-4">
              <button onClick={onClose} className="rounded-md border border-gray-300 px-4 py-2 text-sm">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white disabled:opacity-50">
                {saving ? "Saving…" : "Save Profile"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">{title}</div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>
    </div>
  );
}
