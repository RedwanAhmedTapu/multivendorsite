// src/features/hrm/components/EmployeeFormModal.tsx
//
// Add-employee flow, ProductForm visual language (ui/section-card).
//
// ONE form, ONE submit:
//   Section 1 — Basic information (name, email, phone, password, DOB,
//               gender, present address)      -> employeeApi (account)
//   Section 2 — Employment (branch, department, designation, type,
//               joining date)                 -> hrmApi (HR profile)
//   Section 3 — Contact & emergency            -> hrmApi (HR profile)
//   Section 4 — Permissions (owner checkboxes) -> employeeApi
//
// On submit: (1) create the login account + Employee row — the server
// auto-creates the HrEmployeeProfile and returns its id; (2) PUT the
// placement/personal fields onto that profile. Family, education,
// documents, bank etc. are added afterwards on the Employee 360 page.

import { useState } from "react";
import {
  User, Briefcase, Phone, ShieldCheck,
} from "lucide-react";
import {
  useCreateAdminEmployeeMutation,
  useCreateVendorEmployeeMutation,
  type EmployeePermissions,
} from "../../../features/employeeApi";
import {
  useGetBranchesQuery,
  useGetDepartmentsQuery,
  useGetDesignationsQuery,
  useUpdateEmployeeMutation,
} from "../../../features/hrmApi";
import { PermissionCheckboxGroup } from "./PermissionCheckboxGroup";
import { toArray } from "@/components/hrm/hrm-utils";
import { SectionCard, FieldLabel } from "@/components/ui/section-card";

const EMPTY_PERMISSIONS: EmployeePermissions = {
  productManagement: false,
  orderManagement: false,
  customerSupport: false,
  analytics: false,
  offerManagement: false,
  inventoryManagement: false,
  hrManagement: false,
};

const inputCls =
  "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500";

export function EmployeeFormModal({
  scope,
  onClose,
  onCreated,
}: {
  scope: "admin" | "vendor";
  onClose: () => void;
  /** Called after everything (account + HR placement) is saved. Optional —
   *  the list refreshes on its own through RTK Query tag invalidation. */
  onCreated?: (hrProfileId: string) => void;
}) {
  // Account
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [presentAddress, setPresentAddress] = useState("");

  // Employment
  const [branchId, setBranchId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [designationId, setDesignationId] = useState("");
  const [departmentText, setDepartmentText] = useState(""); // fallback when no structured departments exist yet
  const [designationText, setDesignationText] = useState("");
  const [employmentType, setEmploymentType] = useState("PERMANENT");
  const [joiningDate, setJoiningDate] = useState("");

  // Contact / emergency
  const [altMobile, setAltMobile] = useState("");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyRelation, setEmergencyRelation] = useState("");
  const [emergencyMobile, setEmergencyMobile] = useState("");

  const [permissions, setPermissions] = useState<EmployeePermissions>(EMPTY_PERMISSIONS);
  const [error, setError] = useState<string | null>(null);

  const { data: branches } = useGetBranchesQuery();
  const { data: departments } = useGetDepartmentsQuery();
  const { data: designations } = useGetDesignationsQuery();

  const [createAdmin, { isLoading: creatingAdmin }] = useCreateAdminEmployeeMutation();
  const [createVendor, { isLoading: creatingVendor }] = useCreateVendorEmployeeMutation();
  const [updateProfile, { isLoading: savingProfile }] = useUpdateEmployeeMutation();
  const isLoading = creatingAdmin || creatingVendor || savingProfile;

  const departmentList = toArray(departments?.data);
  const designationList = toArray(designations?.data);
  const branchList = toArray(branches?.data);
  const hasDepartments = departmentList.length > 0;
  const hasDesignations = designationList.length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name || !password || (!email && !phone)) {
      setError("Name, password, and at least one of email/phone are required.");
      return;
    }

    // One choice feeds both worlds: the dropdown's NAME becomes the legacy
    // text field the old employee controller requires, and its ID is
    // applied to the HR profile right after.
    const departmentName = hasDepartments
      ? departments!.data.find((d) => d.id === departmentId)?.name ?? ""
      : departmentText;
    const designationName = hasDesignations
      ? designations!.data.find((d) => d.id === designationId)?.name ?? ""
      : designationText;

    if (!departmentName || !designationName) {
      setError("Please choose (or type) a department and a designation.");
      return;
    }

    const body = {
      name,
      email: email || undefined,
      phone: phone || undefined,
      password,
      designation: designationName,
      department: departmentName,
      permissions,
    };

    try {
      // Step 1 — account. The server auto-creates the HR profile and
      // pre-fills name / phone / email on it.
      const created =
        scope === "admin" ? await createAdmin(body).unwrap() : await createVendor(body).unwrap();
      const hrProfileId = created.data.hrProfileId;

      // Step 2 — layer the placement + personal details on top, only what
      // was filled.
      if (hrProfileId) {
        const placement: Record<string, string> = {};
        if (branchId) placement.branchId = branchId;
        if (hasDepartments && departmentId) placement.departmentId = departmentId;
        if (hasDesignations && designationId) placement.designationId = designationId;
        if (employmentType) placement.employmentType = employmentType;
        if (joiningDate) placement.joiningDate = joiningDate;
        if (dob) placement.dob = dob;
        if (gender) placement.gender = gender;
        if (presentAddress) placement.presentAddress = presentAddress;
        if (altMobile) placement.altMobile = altMobile;
        if (emergencyName) placement.emergencyName = emergencyName;
        if (emergencyRelation) placement.emergencyRelation = emergencyRelation;
        if (emergencyMobile) placement.emergencyMobile = emergencyMobile;

        if (Object.keys(placement).length > 0) {
          await updateProfile({ id: hrProfileId, data: placement }).unwrap();
        }
        onCreated?.(hrProfileId);
      }

      onClose();
    } catch (err: any) {
      setError(err?.data?.message || "Failed to create employee.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-3xl rounded-xl bg-white shadow-xl max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white p-4">
          <h2 className="text-lg font-semibold">Add {scope === "admin" ? "Admin" : "Vendor"} Employee</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-4">
          {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>}

          {/* ── 1. Basic information ── */}
          <SectionCard icon={<User size={16} className="text-indigo-600" />} title="Basic information" badge="required">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel required>Full name</FieldLabel>
                <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div>
                <FieldLabel hint="The employee logs in with this">Email</FieldLabel>
                <input type="email" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div>
                <FieldLabel>Phone</FieldLabel>
                <input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div>
                <FieldLabel required hint="The employee changes this at first login">Temporary password</FieldLabel>
                <input type="password" className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <div>
                <FieldLabel>Date of birth</FieldLabel>
                <input type="date" className={inputCls} value={dob} onChange={(e) => setDob(e.target.value)} />
              </div>
              <div>
                <FieldLabel>Gender</FieldLabel>
                <select className={inputCls} value={gender} onChange={(e) => setGender(e.target.value)}>
                  <option value="">— select —</option>
                  {["MALE", "FEMALE", "OTHER"].map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <FieldLabel>Present address</FieldLabel>
                <input className={inputCls} value={presentAddress} onChange={(e) => setPresentAddress(e.target.value)} />
              </div>
            </div>
          </SectionCard>

          {/* ── 2. Employment ── */}
          <SectionCard icon={<Briefcase size={16} className="text-indigo-600" />} title="Employment" badge="required">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel>Branch</FieldLabel>
                <select className={inputCls} value={branchId} onChange={(e) => setBranchId(e.target.value)}>
                  <option value="">— none —</option>
                  {branchList.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <FieldLabel required>Department</FieldLabel>
                {hasDepartments ? (
                  <select className={inputCls} value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
                    <option value="">— select —</option>
                    {departmentList.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                ) : (
                  <input className={inputCls} value={departmentText} onChange={(e) => setDepartmentText(e.target.value)} placeholder="e.g. Sales" />
                )}
              </div>
              <div>
                <FieldLabel required>Designation</FieldLabel>
                {hasDesignations ? (
                  <select className={inputCls} value={designationId} onChange={(e) => setDesignationId(e.target.value)}>
                    <option value="">— select —</option>
                    {designationList.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                ) : (
                  <input className={inputCls} value={designationText} onChange={(e) => setDesignationText(e.target.value)} placeholder="e.g. Store Manager" />
                )}
              </div>
              <div>
                <FieldLabel>Employment type</FieldLabel>
                <select className={inputCls} value={employmentType} onChange={(e) => setEmploymentType(e.target.value)}>
                  {["PERMANENT", "PROBATIONARY", "CONTRACTUAL", "TEMPORARY", "PART_TIME", "INTERN"].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <FieldLabel>Joining date</FieldLabel>
                <input type="date" className={inputCls} value={joiningDate} onChange={(e) => setJoiningDate(e.target.value)} />
              </div>
            </div>
            {!hasDepartments && (
              <p className="mt-3 text-xs text-gray-400">
                Tip: set up Branches / Departments / Designations once under the "Organization" tab — after that these become dropdowns.
              </p>
            )}
          </SectionCard>

          {/* ── 3. Contact & emergency ── */}
          <SectionCard icon={<Phone size={16} className="text-indigo-600" />} title="Contact & emergency" badge="optional">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel>Alternate mobile</FieldLabel>
                <input className={inputCls} value={altMobile} onChange={(e) => setAltMobile(e.target.value)} />
              </div>
              <div>
                <FieldLabel>Emergency contact name</FieldLabel>
                <input className={inputCls} value={emergencyName} onChange={(e) => setEmergencyName(e.target.value)} />
              </div>
              <div>
                <FieldLabel>Emergency relation</FieldLabel>
                <input className={inputCls} value={emergencyRelation} onChange={(e) => setEmergencyRelation(e.target.value)} />
              </div>
              <div>
                <FieldLabel>Emergency mobile</FieldLabel>
                <input className={inputCls} value={emergencyMobile} onChange={(e) => setEmergencyMobile(e.target.value)} />
              </div>
            </div>
          </SectionCard>

          {/* ── 4. Permissions ── */}
          <SectionCard icon={<ShieldCheck size={16} className="text-indigo-600" />} title="Permissions" subtitle="What this employee can manage">
            <PermissionCheckboxGroup value={permissions} onChange={setPermissions} />
          </SectionCard>

          <div className="sticky bottom-0 flex justify-end gap-2 border-t bg-white pt-4">
            <button type="button" onClick={onClose} className="rounded-md border border-gray-300 px-4 py-2 text-sm">Cancel</button>
            <button type="submit" disabled={isLoading} className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white disabled:opacity-50">
              {isLoading ? "Saving…" : "Create Employee"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
