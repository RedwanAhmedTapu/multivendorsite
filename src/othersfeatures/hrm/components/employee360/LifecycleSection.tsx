// src/othersfeatures/hrm/components/employee360/LifecycleSection.tsx
//
// Promotion / Transfer / Salary Revision on the Employee 360 page:
// create a PENDING record via a dialog, then an explicit Approve/Reject.
// Approving applies the change server-side and writes a history event —
// nothing is applied silently at creation time.

"use client";

import { useState } from "react";
import { TrendingUp, ArrowLeftRight, CircleDollarSign, Check, X } from "lucide-react";
import { SectionCard, FieldError } from "@/components/ui/section-card";
import { SmallOutlineButton } from "@/components/ui/section-buttons";
import { SimpleFormDialog, type FormFieldDef } from "./SimpleFormDialog";
import type { HrLifecycleRecord, HrDesignation, HrBranch, HrDepartment } from "../../../../features/hrmApi";

type Kind = "promotions" | "transfers" | "salary-revisions";

const KIND_META: Record<Kind, { label: string; icon: React.ReactNode; fields: (orgs: {
  designations: HrDesignation[]; branches: HrBranch[]; departments: HrDepartment[];
}) => FormFieldDef[] }> = {
  promotions: {
    label: "Promotion",
    icon: <TrendingUp size={16} className="text-indigo-600" />,
    fields: (orgs) => [
      { name: "newDesignationId", label: "New designation", type: "select", required: true,
        options: orgs.designations.map((d) => ({ value: d.id, label: d.name })) },
      { name: "newBasicSalary", label: "New basic salary (৳)", type: "number" },
      { name: "effectiveDate", label: "Effective date", type: "date", required: true },
      { name: "reason", label: "Reason", type: "textarea" },
    ],
  },
  transfers: {
    label: "Transfer",
    icon: <ArrowLeftRight size={16} className="text-indigo-600" />,
    fields: (orgs) => [
      { name: "toBranchId", label: "To branch", type: "select",
        options: orgs.branches.map((b) => ({ value: b.id, label: b.name })) },
      { name: "toDepartmentId", label: "To department", type: "select",
        options: orgs.departments.map((d) => ({ value: d.id, label: d.name })) },
      { name: "effectiveDate", label: "Effective date", type: "date", required: true },
      { name: "reason", label: "Reason", type: "textarea" },
    ],
  },
  "salary-revisions": {
    label: "Salary revision",
    icon: <CircleDollarSign size={16} className="text-indigo-600" />,
    fields: () => [
      { name: "newSalary", label: "New gross salary (৳)", type: "number", required: true },
      { name: "effectiveDate", label: "Effective date", type: "date", required: true },
      { name: "reason", label: "Reason", type: "textarea" },
    ],
  },
};

export function LifecycleSection({
  employeeId,
  promotions,
  transfers,
  salaryRevisions,
  designations,
  branches,
  departments,
  canCreate = true,
  canAct = true,
  onCreate,
  onAct,
}: {
  employeeId: string;
  promotions: HrLifecycleRecord[] | undefined;
  transfers: HrLifecycleRecord[] | undefined;
  salaryRevisions: HrLifecycleRecord[] | undefined;
  designations: HrDesignation[];
  branches: HrBranch[];
  departments: HrDepartment[];
  /** PHASE F: hide create dialogs / approve-reject without the capability. */
  canCreate?: boolean;
  canAct?: boolean;
  onCreate: (kind: Kind, data: Record<string, unknown>) => Promise<unknown>;
  onAct: (kind: Kind, recordId: string, status: "APPROVED" | "REJECTED") => Promise<unknown>;
}) {
  void employeeId;
  const [dialog, setDialog] = useState<Kind | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lists: Array<{ kind: Kind; items: HrLifecycleRecord[] | undefined }> = [
    { kind: "promotions", items: promotions },
    { kind: "transfers", items: transfers },
    { kind: "salary-revisions", items: salaryRevisions },
  ];

  async function save(values: Record<string, unknown>) {
    if (!dialog) return;
    setBusy(true);
    setError(null);
    try {
      await onCreate(dialog, values);
      setDialog(null);
    } catch (err: any) {
      setError(err?.data?.message || err?.message || "Failed to save.");
    } finally {
      setBusy(false);
    }
  }

  function describe(kind: Kind, r: HrLifecycleRecord): string {
    if (kind === "promotions") {
      const d = designations.find((x) => x.id === r.newDesignationId)?.name ?? r.newDesignationId ?? "—";
      return `→ ${d}${r.newBasicSalary ? ` · ৳${r.newBasicSalary}` : ""}`;
    }
    if (kind === "transfers") {
      const b = branches.find((x) => x.id === r.toBranchId)?.name;
      const dep = departments.find((x) => x.id === r.toDepartmentId)?.name;
      return `→ ${[b, dep].filter(Boolean).join(" / ") || "—"}`;
    }
    return `৳${r.previousSalary ?? 0} → ৳${r.newSalary ?? "—"}`;
  }

  return (
    <SectionCard
      icon={<TrendingUp size={16} className="text-indigo-600" />}
      title="Lifecycle"
      subtitle="Promotions, transfers, salary revisions — approve to apply"
      badge="optional"
      actions={
        canCreate ? (
          <div className="flex gap-2">
            {(Object.keys(KIND_META) as Kind[]).map((k) => (
              <SmallOutlineButton key={k} onClick={() => { setError(null); setDialog(k); }}>
                + {KIND_META[k].label}
              </SmallOutlineButton>
            ))}
          </div>
        ) : undefined
      }
    >
      <FieldError message={error} />
      {lists.every(({ items }) => !items || items.length === 0) && (
        <p className="text-sm text-gray-400">No lifecycle records yet.</p>
      )}
      <div className="space-y-4">
        {lists.map(({ kind, items }) =>
          items && items.length > 0 ? (
            <div key={kind}>
              <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">{KIND_META[kind].label}s</div>
              <div className="space-y-2">
                {items.map((r) => (
                  <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-100 bg-gray-50/60 px-3 py-2">
                    <div className="text-sm text-gray-700">
                      <span className="font-medium">{describe(kind, r)}</span>
                      <span className="ml-2 text-xs text-gray-400">effective {r.effectiveDate}</span>
                      {r.status === "PENDING" && (
                        <span className="ml-2 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700">Pending</span>
                      )}
                      {r.status === "APPROVED" && (
                        <span className="ml-2 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-bold uppercase text-green-700">Approved</span>
                      )}
                      {r.status === "REJECTED" && (
                        <span className="ml-2 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold uppercase text-red-700">Rejected</span>
                      )}
                    </div>
                    {canAct && r.status === "PENDING" && (
                      <div className="flex gap-2">
                        <SmallOutlineButton onClick={() => onAct(kind, r.id, "APPROVED")} icon={<Check size={12} />}>
                          Approve
                        </SmallOutlineButton>
                        <SmallOutlineButton onClick={() => onAct(kind, r.id, "REJECTED")} icon={<X size={12} />}>
                          Reject
                        </SmallOutlineButton>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : null
        )}
      </div>

      {dialog && (
        <SimpleFormDialog
          title={`New ${KIND_META[dialog].label}`}
          fields={KIND_META[dialog].fields({ designations, branches, departments })}
          loading={busy}
          error={error}
          onSave={save}
          onClose={() => setDialog(null)}
        />
      )}
    </SectionCard>
  );
}
