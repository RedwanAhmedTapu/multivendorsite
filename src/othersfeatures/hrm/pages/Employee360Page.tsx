// src/othersfeatures/hrm/pages/Employee360Page.tsx
//
// The central employee profile — "Employee 360". Mount at:
//   /admin-dashboard/employees/[id]        (scope="admin")
//   /vendor-dashboard/hrm/employees/[id]   (scope="vendor")
//
// Read-mostly by design (per the approved spec): information is organised
// into ProductForm-styled tabs; edits happen through the profile drawer
// and per-section dialogs. All data comes from a single query —
// GET /hrm/employees/:id returns the profile plus every collection.

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User, Briefcase, Users, GraduationCap, BriefcaseBusiness, Wallet,
  FileText, TrendingUp, History, LayoutGrid, ChevronLeft, Pencil,
  Banknote, Archive, Trash2, ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import {
  useGetEmployeeByIdQuery,
  useGetBranchesQuery,
  useGetDepartmentsQuery,
  useGetDesignationsQuery,
  useAddEmployeeFamilyMemberMutation,
  useUpdateEmployeeFamilyMemberMutation,
  useRemoveEmployeeFamilyMemberMutation,
  useAddEmployeeEducationMutation,
  useUpdateEmployeeEducationMutation,
  useRemoveEmployeeEducationMutation,
  useAddEmployeePreviousEmploymentMutation,
  useUpdateEmployeePreviousEmploymentMutation,
  useRemoveEmployeePreviousEmploymentMutation,
  useAddEmployeeBankAccountMutation,
  useUpdateEmployeeBankAccountMutation,
  useRemoveEmployeeBankAccountMutation,
  useUploadEmployeeDocumentMutation,
  useUpdateEmployeeDocumentMutation,
  useVerifyEmployeeDocumentMutation,
  useRemoveEmployeeDocumentMutation,
  useUploadEmployeePhotoMutation,
  useCreateLifecycleRecordMutation,
  useActOnLifecycleRecordMutation,
  useAssignSalaryMutation,
  useHardDeleteEmployeeMutation,
  useDeactivateEmployeeMutation,
  type HrEmployeeProfile360,
} from "../../../features/hrmApi";
import { useToggleAdminEmployeeStatusMutation, useToggleVendorEmployeeStatusMutation } from "../../../features/employeeApi";
import { usePermissions } from "../../../hooks/usePermissions";
import { SectionCard, FieldLabel } from "@/components/ui/section-card";
import { OutlineButton, SmallOutlineButton } from "@/components/ui/section-buttons";
import { SimpleFormDialog } from "../components/employee360/SimpleFormDialog";
import { EmployeeStatusBadge } from "../components/employee360/EmployeeStatusBadge";
import { ProfileFieldGrid } from "../components/employee360/ProfileFieldGrid";
import { CollectionSection } from "../components/employee360/CollectionSection";
import { BankSection } from "../components/employee360/BankSection";
import { DocumentsSection } from "../components/employee360/DocumentsSection";
import { LifecycleSection } from "../components/employee360/LifecycleSection";
import { HistoryTimeline } from "../components/employee360/HistoryTimeline";
import { EmployeeProfileDrawer } from "../components/EmployeeProfileDrawer";
import { toArray } from "@/components/hrm/hrm-utils";
import { PermissionEditorModal } from "../components/PermissionEditorModal";

type Tab = "overview" | "personal" | "employment" | "family" | "education" | "previous" | "bank" | "documents" | "lifecycle" | "history";

const TABS: Array<{ key: Tab; label: string }> = [
  { key: "overview", label: "Overview" },
  { key: "personal", label: "Personal" },
  { key: "employment", label: "Employment" },
  { key: "family", label: "Family" },
  { key: "education", label: "Education" },
  { key: "previous", label: "Previous Employment" },
  { key: "bank", label: "Bank & MFS" },
  { key: "documents", label: "Documents" },
  { key: "lifecycle", label: "Lifecycle" },
  { key: "history", label: "History" },
];

function r2Url(key?: string | null): string | null {
  if (!key) return null;
  if (/^https?:\/\//i.test(key)) return key;
  const domain = process.env.NEXT_PUBLIC_R2_PUBLIC_DOMAIN;
  return domain ? `${domain.replace(/\/$/, "")}/${key}` : null;
}

const listPath = (scope: "admin" | "vendor") =>
  scope === "admin" ? "/admin-dashboard/employees" : "/vendor-dashboard/hrm/employees";

export default function Employee360Page({
  scope,
  employeeId,
  /** Where "Back to employees" goes. Defaults to the legacy dashboard
   *  paths; the /hrm workspace passes /hrm/employees. */
  basePath,
}: { scope: "admin" | "vendor"; employeeId: string; basePath?: string }) {
  const [tab, setTab] = useState<Tab>("overview");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [permissionModal, setPermissionModal] = useState(false);
  const [salaryDialogOpen, setSalaryDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const { isOwner, can } = usePermissions();

  const { data, isLoading, isError, refetch } = useGetEmployeeByIdQuery(employeeId);
  const { data: branches } = useGetBranchesQuery();
  const { data: departments } = useGetDepartmentsQuery();
  const { data: designations } = useGetDesignationsQuery();

  const [toggleAdmin] = useToggleAdminEmployeeStatusMutation();
  const [toggleVendor] = useToggleVendorEmployeeStatusMutation();
  const toggleStatus = scope === "admin" ? toggleAdmin : toggleVendor;

  // Section mutations
  const [addFamily] = useAddEmployeeFamilyMemberMutation();
  const [updateFamily] = useUpdateEmployeeFamilyMemberMutation();
  const [removeFamily] = useRemoveEmployeeFamilyMemberMutation();
  const [addEducation] = useAddEmployeeEducationMutation();
  const [updateEducation] = useUpdateEmployeeEducationMutation();
  const [removeEducation] = useRemoveEmployeeEducationMutation();
  const [addPrevJob] = useAddEmployeePreviousEmploymentMutation();
  const [updatePrevJob] = useUpdateEmployeePreviousEmploymentMutation();
  const [removePrevJob] = useRemoveEmployeePreviousEmploymentMutation();
  const [addBank] = useAddEmployeeBankAccountMutation();
  const [updateBank] = useUpdateEmployeeBankAccountMutation();
  const [removeBank] = useRemoveEmployeeBankAccountMutation();
  const [uploadDoc] = useUploadEmployeeDocumentMutation();
  const [updateDoc] = useUpdateEmployeeDocumentMutation();
  const [verifyDoc] = useVerifyEmployeeDocumentMutation();
  const [removeDoc] = useRemoveEmployeeDocumentMutation();
  const [uploadPhoto] = useUploadEmployeePhotoMutation();
  const [createLifecycle] = useCreateLifecycleRecordMutation();
  const [actLifecycle] = useActOnLifecycleRecordMutation();
  const [assignSalary, { isLoading: savingSalary }] = useAssignSalaryMutation();
  const [hardDelete, { isLoading: deleting }] = useHardDeleteEmployeeMutation();
  const [deactivate] = useDeactivateEmployeeMutation();
  const router = useRouter();

  const profile = data?.data;

  async function run(fn: () => Promise<unknown>, successMessage?: string) {
    try {
      await fn();
      if (successMessage) toast.success(successMessage);
    } catch (err: any) {
      // Validation failures carry field-level messages (PHASE F item 2:
      // backend now returns 400 { message, errors[] }) — surface them.
      const fieldErrors = Array.isArray(err?.data?.errors)
        ? err.data.errors.map((e: any) => `${String(e?.path ?? "").replace(/^body[.]/, "")}: ${e?.message}`).join("; ")
        : null;
      toast.error(fieldErrors || err?.data?.message || err?.message || "Action failed.");
    }
  }

  const overviewFields = useMemo(() => profile ? [
    { label: "Employee code", value: profile.code },
    { label: "Status", render: <EmployeeStatusBadge status={profile.status} /> },
    { label: "Designation", value: profile.designation?.name },
    { label: "Department", value: profile.department?.name },
    { label: "Branch", value: profile.branch?.name },
    { label: "Employment type", value: profile.employmentType },
    { label: "Joining date", value: profile.joiningDate },
    { label: "Reporting manager", value: profile.manager?.fullName },
    { label: "Contact", value: profile.mobile },
    { label: "Email", value: profile.personalEmail },
  ] : [], [profile]);

  const personalFields = useMemo(() => profile ? [
    { label: "Full name", value: profile.fullName },
    { label: "Name (Bangla)", value: profile.nameBn },
    { label: "Date of birth", value: profile.dob },
    { label: "Gender", value: profile.gender },
    { label: "Blood group", value: profile.bloodGroup },
    { label: "Marital status", value: profile.maritalStatus },
    { label: "Nationality", value: profile.nationality },
    { label: "Religion", value: profile.religion },
    { label: "Father's name", value: profile.fatherName },
    { label: "Mother's name", value: profile.motherName },
    { label: "Spouse", value: profile.spouseName },
    { label: "Mobile", value: profile.mobile },
    { label: "Alternate mobile", value: profile.altMobile },
    { label: "Personal email", value: profile.personalEmail },
    { label: "Emergency contact", value: [profile.emergencyName, profile.emergencyRelation, profile.emergencyMobile].filter(Boolean).join(" · ") || null },
    { label: "Present address", value: profile.presentAddress, wide: true },
    { label: "Permanent address", value: profile.permanentAddress, wide: true },
  ] : [], [profile]);

  const employmentFields = useMemo(() => profile ? [
    { label: "Employee code", value: profile.code },
    { label: "Employment type", value: profile.employmentType },
    { label: "Branch", value: profile.branch?.name },
    { label: "Department", value: profile.department?.name },
    { label: "Designation", value: profile.designation?.name },
    { label: "Grade", value: profile.grade },
    { label: "Reporting manager", value: profile.manager?.fullName },
    { label: "Shift", value: profile.shift ? `${profile.shift.name} (${profile.shift.startTime}–${profile.shift.endTime})` : null },
    { label: "Work location", value: profile.workLocation },
    { label: "Joining date", value: profile.joiningDate },
    { label: "Confirmation date", value: profile.confirmationDate },
    { label: "Probation (months)", value: profile.probationMonths },
  ] : [], [profile]);

  if (isLoading) {
    return <div className="space-y-4">
      <div className="h-36 animate-pulse rounded-xl bg-gray-100" />
      <div className="h-10 w-2/3 animate-pulse rounded-lg bg-gray-100" />
      <div className="h-64 animate-pulse rounded-xl bg-gray-100" />
    </div>;
  }

  if (isError || !profile) {
    return (
      <SectionCard icon={<User size={16} className="text-indigo-600" />} title="Employee not found">
        <p className="text-sm text-gray-500">
          This employee doesn't exist or belongs to another {scope === "admin" ? "platform" : "vendor"} account.
        </p>
        <div className="mt-4"><Link href={basePath ?? listPath(scope)}><OutlineButton icon={<ChevronLeft size={14} />}>Back to employees</OutlineButton></Link></div>
      </SectionCard>
    );
  }

  const photo = r2Url(profile.photoUrl);

  return (
    <div className="emp360-page space-y-5">
      {/* ── Header card ── */}
      <SectionCard
        icon={<User size={16} className="text-indigo-600" />}
        title={`${profile.code} · ${profile.designation?.name ?? "—"}`}
        subtitle={[profile.department?.name, profile.branch?.name].filter(Boolean).join(" · ") || undefined}
        actions={
          <div className="flex items-center gap-2">
            {can("hrEmployeeEdit") && (
              <SmallOutlineButton onClick={() => setDrawerOpen(true)} icon={<Pencil size={12} />}>Edit Profile</SmallOutlineButton>
            )}
            {isOwner && (
              <>
                <SmallOutlineButton onClick={() => setPermissionModal(true)}>Permissions</SmallOutlineButton>
                <SmallOutlineButton
                  onClick={() => run(() => toggleStatus(profile.linkedEmployeeId).unwrap(), "Account status updated.")}
                >
                  Toggle Access
                </SmallOutlineButton>
                {can("hrEmployeeDelete") && (
                  <SmallOutlineButton
                    onClick={async () => {
                      if (!window.confirm(`Archive ${profile.fullName}? They disappear from the directory but all history is preserved.`)) return;
                      await run(() => deactivate(employeeId).unwrap(), `${profile.fullName} archived (INACTIVE)`);
                    }}
                    icon={<Archive size={12} />}
                  >
                    Archive
                  </SmallOutlineButton>
                )}
                {can("hrEmployeeDelete") && (
                  <SmallOutlineButton
                    onClick={() => { setDeleteConfirmText(""); setDeleteDialogOpen(true); }}
                    icon={<Trash2 size={12} />}
                  >
                    Delete
                  </SmallOutlineButton>
                )}
              </>
            )}
          </div>
        }
      >
        <div className="flex flex-wrap items-center gap-5">
          <div className="relative">
            {photo ? (
               
              <img src={photo} alt={profile.fullName} className="h-20 w-20 rounded-full object-cover" style={{ border: "1.5px solid #E5EAF2" }} />
            ) : (
              <div
                className="flex h-20 w-20 items-center justify-center rounded-full text-xl font-bold text-indigo-600"
                style={{ background: "#EEF3FB" }}
              >
                {profile.fullName.slice(0, 1).toUpperCase()}
              </div>
            )}
            {isOwner && can("hrEmployeeEdit") && (
              <label
                className="absolute -bottom-1 -right-1 cursor-pointer rounded-full bg-white px-1.5 py-0.5 text-[10px] font-semibold text-indigo-600 shadow"
                style={{ border: "1px solid #E5EAF2" }}
                title="Upload photo"
              >
                ✎
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const fd = new FormData();
                    fd.append("file", file);
                    run(() => uploadPhoto({ employeeId, formData: fd }).unwrap(), "Photo updated.");
                  }}
                />
              </label>
            )}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-bold text-gray-900">{profile.fullName}</h1>
              {profile.nameBn && <span className="text-sm text-gray-500">{profile.nameBn}</span>}
              <EmployeeStatusBadge status={profile.status} />
            </div>
            <div className="mt-1 text-sm text-gray-500">
              {profile.employmentType} · Joined {profile.joiningDate || "—"}
              {profile.manager ? ` · Reports to ${profile.manager.fullName}` : ""}
            </div>
          </div>
          <div className="ml-auto">
            <Link href={basePath ?? listPath(scope)}>
              <OutlineButton icon={<ChevronLeft size={14} />}>Back to employees</OutlineButton>
            </Link>
          </div>
        </div>
      </SectionCard>

      {/* ── Tabs ── */}
      <div className="emp360-tabs flex flex-wrap gap-1 border-b border-gray-200">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3.5 py-2 text-sm font-medium ${
              tab === t.key ? "border-b-2 border-indigo-600 text-indigo-600" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      {tab === "overview" && (
        <div className="space-y-5">
          <SectionCard icon={<LayoutGrid size={16} className="text-indigo-600" />} title="Overview" subtitle="Key information at a glance">
            <ProfileFieldGrid fields={overviewFields} />
          </SectionCard>

          {!profile.salaryHidden && (
            <SectionCard
              icon={<Banknote size={16} className="text-indigo-600" />}
              title="Current salary structure"
              subtitle="Drives payroll for this employee"
              actions={
                can("hrSalaryEdit") && (
                  <SmallOutlineButton onClick={() => setSalaryDialogOpen(true)}>
                    {(profile.salaryStructures?.length ?? 0) > 0 ? "Revise Structure" : "Set Structure"}
                  </SmallOutlineButton>
                )
              }
            >
              {(profile.salaryStructures?.length ?? 0) === 0 ? (
                <p className="text-sm text-gray-400">
                  No salary structure yet. Set one to include this employee in payroll.
                </p>
              ) : (
                (() => {
                  const st = (profile.salaryStructures ?? [])[0];
                  if (!st) return null;
                  const money = (v: unknown) => `৳${Number(v ?? 0).toLocaleString()}`;
                  return (
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                      {[
                        ["Basic", money(st.basic)],
                        ["House rent", money(st.houseRent)],
                        ["Medical", money(st.medical)],
                        ["Conveyance", money(st.conveyance)],
                        ["Other allowance", money(st.otherAllowance)],
                        ["Effective from", st.effectiveFrom || "—"],
                        ["Status", st.status],
                      ].map(([label, value]) => (
                        <div key={label}>
                          <div className="text-[10.5px] font-bold uppercase tracking-wide text-gray-400">{label}</div>
                          <div className="mt-0.5 text-sm text-gray-900">{value}</div>
                        </div>
                      ))}
                      <div>
                        <div className="text-[10.5px] font-bold uppercase tracking-wide text-gray-400">Gross</div>
                        <div className="mt-0.5 text-sm font-bold text-green-700">{money(st.gross)}</div>
                      </div>
                    </div>
                  );
                })()
              )}
            </SectionCard>
          )}
        </div>
      )}

      {tab === "personal" && (
        <SectionCard icon={<User size={16} className="text-indigo-600" />} title="Personal information" subtitle="Edit via the Edit Profile drawer">
          <ProfileFieldGrid fields={personalFields} />
        </SectionCard>
      )}

      {tab === "employment" && (
        <SectionCard icon={<Briefcase size={16} className="text-indigo-600" />} title="Employment information" subtitle="Org placement and job details">
          <ProfileFieldGrid fields={employmentFields} />
        </SectionCard>
      )}

      {tab === "family" && (
        <CollectionSection
          title="Family"
          icon={<Users size={16} className="text-indigo-600" />}
          subtitle="Family members and dependents"
          badge="optional"
          items={profile.familyMembers}
          canEdit={can("hrEmployeeEdit")}
          columns={[
            { key: "name", label: "Name" },
            { key: "relationship", label: "Relationship" },
            { key: "dob", label: "Date of birth" },
            { key: "occupation", label: "Occupation" },
            { key: "mobile", label: "Mobile" },
            { key: "dependent", label: "Dependent", render: (r) => (r.dependent ? "Yes" : "—") },
          ]}
          fields={[
            { name: "name", label: "Name", required: true },
            { name: "relationship", label: "Relationship", required: true },
            { name: "dob", label: "Date of birth", type: "date" },
            { name: "occupation", label: "Occupation" },
            { name: "mobile", label: "Mobile" },
            { name: "dependent", label: "Dependent", type: "checkbox", hint: "Financially dependent on the employee" },
          ]}
          onAdd={(v) => run(() => addFamily({ employeeId, data: v }).unwrap(), "Family member added.")}
          onUpdate={(id, v) => run(() => updateFamily({ employeeId, sectionId: id, data: v }).unwrap(), "Family member updated.")}
          onRemove={(id) => run(() => removeFamily({ employeeId, sectionId: id }).unwrap(), "Removed.")}
        />
      )}

      {tab === "education" && (
        <CollectionSection
          title="Education"
          icon={<GraduationCap size={16} className="text-indigo-600" />}
          subtitle="Academic record"
          badge="optional"
          items={profile.education}
          canEdit={can("hrEmployeeEdit")}
          columns={[
            { key: "degree", label: "Degree" },
            { key: "institution", label: "Institution" },
            { key: "major", label: "Major" },
            { key: "passingYear", label: "Passing year" },
            { key: "result", label: "Result" },
          ]}
          fields={[
            { name: "degree", label: "Degree", required: true },
            { name: "institution", label: "Institution" },
            { name: "major", label: "Major / group" },
            { name: "passingYear", label: "Passing year" },
            { name: "result", label: "Result / GPA" },
          ]}
          onAdd={(v) => run(() => addEducation({ employeeId, data: v }).unwrap(), "Education added.")}
          onUpdate={(id, v) => run(() => updateEducation({ employeeId, sectionId: id, data: v }).unwrap(), "Education updated.")}
          onRemove={(id) => run(() => removeEducation({ employeeId, sectionId: id }).unwrap(), "Removed.")}
        />
      )}

      {tab === "previous" && (
        <CollectionSection
          title="Previous Employment"
          icon={<BriefcaseBusiness size={16} className="text-indigo-600" />}
          subtitle="Work history before joining"
          badge="optional"
          items={profile.previousEmployments}
          canEdit={can("hrEmployeeEdit")}
          columns={[
            { key: "company", label: "Company" },
            { key: "designation", label: "Designation" },
            { key: "joinDate", label: "From" },
            { key: "leaveDate", label: "To" },
            { key: "lastSalary", label: "Last salary" },
            { key: "reasonForLeaving", label: "Reason for leaving" },
          ]}
          fields={[
            { name: "company", label: "Company", required: true },
            { name: "designation", label: "Designation" },
            { name: "department", label: "Department" },
            { name: "joinDate", label: "Join date", type: "date" },
            { name: "leaveDate", label: "Leave date", type: "date" },
            { name: "lastSalary", label: "Last salary (৳)", type: "number" },
            { name: "reasonForLeaving", label: "Reason for leaving" },
            { name: "supervisor", label: "Supervisor" },
            { name: "contact", label: "Contact" },
            { name: "notes", label: "Notes", type: "textarea" },
          ]}
          onAdd={(v) => run(() => addPrevJob({ employeeId, data: v }).unwrap(), "Previous employment added.")}
          onUpdate={(id, v) => run(() => updatePrevJob({ employeeId, sectionId: id, data: v }).unwrap(), "Updated.")}
          onRemove={(id) => run(() => removePrevJob({ employeeId, sectionId: id }).unwrap(), "Removed.")}
        />
      )}

      {tab === "bank" && (
        <BankSection
          employeeId={employeeId}
          accounts={profile.bankAccounts}
          canEdit={can("hrEmployeeEdit")}
          onAdd={(v) => run(() => addBank({ employeeId, data: v }).unwrap(), "Account added.")}
          onUpdate={(id, v) => run(() => updateBank({ employeeId, sectionId: id, data: v }).unwrap(), "Account updated.")}
          onRemove={(id) => run(() => removeBank({ employeeId, sectionId: id }).unwrap(), "Removed.")}
        />
      )}

      {tab === "documents" && (
        <DocumentsSection
          employeeId={employeeId}
          documents={profile.documents}
          canUpload={can("hrDocsUpload")}
          canVerify={can("hrDocsVerify")}
          canRemove={can("hrDocsDelete")}
          onUpload={(fd) => run(() => uploadDoc({ employeeId, formData: fd }).unwrap(), "Document uploaded.")}
          onUpdate={(id, v) => run(() => updateDoc({ employeeId, sectionId: id, data: v }).unwrap(), "Document updated.")}
          onVerify={(id) => run(() => verifyDoc({ employeeId, sectionId: id }).unwrap(), "Document verified.")}
          onRemove={(id) => run(() => removeDoc({ employeeId, sectionId: id }).unwrap(), "Document deleted.")}
        />
      )}

      {tab === "lifecycle" && (
        <LifecycleSection
          employeeId={employeeId}
          promotions={profile.promotions}
          transfers={profile.transfers}
          salaryRevisions={profile.salaryRevisions}
          designations={toArray(designations?.data)}
          branches={toArray(branches?.data)}
          departments={toArray(departments?.data)}
          canCreate={can("hrEmployeeEdit")}
          canAct={can("hrEmployeeEdit")}
          onCreate={(kind, v) => run(() => createLifecycle({ employeeId, kind, data: v }).unwrap(), "Created as PENDING — approve to apply.")}
          onAct={(kind, id, status) => run(() => actLifecycle({ employeeId, kind, sectionId: id, status }).unwrap(), status === "APPROVED" ? "Approved and applied." : "Rejected.")}
        />
      )}

      {tab === "history" && <HistoryTimeline events={profile.history} />}

      {salaryDialogOpen && (
        <SimpleFormDialog
          title={`${(profile.salaryStructures?.length ?? 0) > 0 ? "Revise salary" : "Set salary"} — ${profile.fullName}`}
          fields={[
            { name: "basic", label: "Basic salary (৳)", type: "number", required: true },
            { name: "houseRent", label: "House rent (৳)", type: "number" },
            { name: "medical", label: "Medical (৳)", type: "number" },
            { name: "conveyance", label: "Conveyance (৳)", type: "number" },
            { name: "otherAllowance", label: "Other allowance (৳)", type: "number" },
            { name: "effectiveFrom", label: "Effective from", type: "date", required: true },
          ]}
          initial={(profile.salaryStructures ?? [])[0]
            ? {
                basic: String((profile.salaryStructures ?? [])[0].basic ?? ""),
                houseRent: String((profile.salaryStructures ?? [])[0].houseRent ?? ""),
                medical: String((profile.salaryStructures ?? [])[0].medical ?? ""),
                conveyance: String((profile.salaryStructures ?? [])[0].conveyance ?? ""),
                otherAllowance: String((profile.salaryStructures ?? [])[0].otherAllowance ?? ""),
                effectiveFrom: new Date().toISOString().slice(0, 10),
              }
            : { effectiveFrom: new Date().toISOString().slice(0, 10) }}
          loading={savingSalary}
          onSave={async (values) => {
            await run(() => assignSalary({ employeeId, ...values }).unwrap(), "Salary structure saved.");
            await refetch();
            setSalaryDialogOpen(false);
          }}
          onClose={() => setSalaryDialogOpen(false)}
        />
      )}

      {deleteDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
            <div className="flex items-center gap-2 border-b p-4" style={{ background: "#FEF2F2" }}>
              <ShieldAlert size={18} className="text-red-600" />
              <h2 className="text-base font-semibold text-red-700">Permanently delete {profile.fullName}</h2>
            </div>
            <div className="space-y-3 p-4">
              <p className="text-sm text-gray-600">
                Irreversible. Removes the employee and their biodata/history. Employees with attendance,
                payroll, leave or finance records cannot be permanently deleted — archive them instead.
              </p>
              <div>
                <FieldLabel required>
                  Type the employee code <span className="font-mono">{profile.code}</span> to confirm
                </FieldLabel>
                <input
                  className="w-full rounded-md border border-red-200 px-3 py-2 font-mono text-sm focus:border-red-400 focus:ring-red-100"
                  placeholder={profile.code}
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2 border-t pt-3">
                <button onClick={() => setDeleteDialogOpen(false)} className="rounded-md border border-gray-300 px-4 py-2 text-sm">
                  Cancel
                </button>
                <button
                  disabled={deleting || deleteConfirmText !== profile.code}
                  onClick={async () => {
                    try {
                      const r = await hardDelete({ id: employeeId, confirm: deleteConfirmText }).unwrap();
                      toast.success(r.message ?? "Employee permanently deleted");
                      router.push(basePath ?? listPath(scope));
                    } catch (err: any) {
                      toast.error(err?.data?.message || "Delete failed.");
                    }
                  }}
                  className="rounded-md bg-red-600 px-4 py-2 text-sm text-white disabled:opacity-40"
                >
                  {deleting ? "Deleting…" : "Permanently Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {drawerOpen && <EmployeeProfileDrawer employeeId={employeeId} onClose={() => setDrawerOpen(false)} />}
      {permissionModal && (
        <PermissionEditorModal
          employeeId={profile.linkedEmployeeId}
          employeeName={profile.fullName}
          onClose={() => setPermissionModal(false)}
        />
      )}

      <style>{`@media (max-width: 900px) { .emp360-page .emp360-tabs { overflow-x: auto; flex-wrap: nowrap; } }`}</style>
    </div>
  );
}

// Re-export for route pages that need the profile type.
export type { HrEmployeeProfile360 };
