"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Gift, Pencil, Plus, Trash2 } from "lucide-react";
import {
  apiErrorMessage,
  apiFieldErrors,
  useCreateAgentBonusRuleMutation,
  useDeleteAgentBonusRuleMutation,
  useListAgentBonusRulesQuery,
  useUpdateAgentBonusRuleMutation,
  type BonusRule,
} from "@/features/agentAdminApi";
import { AgentAdminHeader, Btn, Empty, FieldRow, Modal, Panel, Pill, bdt, fmtDate, inputCls, tdCls, thCls } from "@/components/agent-admin/AgentAdminUI";

const METRIC_LABEL: Record<BonusRule["metric"], string> = {
  DELIVERED_ORDERS: "Delivered orders",
  DELIVERED_SALES: "Delivered sales (৳)",
  ACTIVE_VENDORS: "Active vendors",
  NEW_VENDORS: "New vendors",
};
const SCOPE_LABEL: Record<BonusRule["scope"], string> = { PER_VENDOR: "Per vendor", PER_AGENT: "Per agent (all vendors)" };
const REC_LABEL: Record<BonusRule["recurrence"], string> = { ONE_TIME: "One-time", MONTHLY: "Every month" };

type Draft = {
  name: string;
  description: string;
  scope: BonusRule["scope"];
  metric: BonusRule["metric"];
  threshold: string;
  amount: string;
  recurrence: BonusRule["recurrence"];
  validFrom: string;
  validTo: string;
  isActive: boolean;
};

const blank: Draft = { name: "", description: "", scope: "PER_AGENT", metric: "DELIVERED_SALES", threshold: "", amount: "", recurrence: "ONE_TIME", validFrom: "", validTo: "", isActive: true };

const dhakaDay = (iso: string | null) => (iso ? new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka" }).format(new Date(iso)) : "");
const startOfDay = (d: string) => new Date(`${d}T00:00:00+06:00`).toISOString();
const endOfDay = (d: string) => new Date(`${d}T23:59:59+06:00`).toISOString();

function describe(r: Pick<BonusRule, "metric" | "threshold" | "amount" | "recurrence" | "scope">) {
  const t = r.metric === "DELIVERED_SALES" ? bdt(r.threshold) : Number(r.threshold).toLocaleString("en-BD");
  const unit = r.metric === "DELIVERED_SALES" ? "in delivered sales" : METRIC_LABEL[r.metric].toLowerCase();
  const who = r.scope === "PER_VENDOR" ? "a single vendor reaches" : "the agent reaches";
  return `${bdt(r.amount)} when ${who} ${t} ${unit}${r.recurrence === "MONTHLY" ? " in a calendar month" : ""}`;
}

export default function AgentBonusRulesPage() {
  const { data: rules, isLoading } = useListAgentBonusRulesQuery();
  const [create, { isLoading: creating }] = useCreateAgentBonusRuleMutation();
  const [update, { isLoading: updating }] = useUpdateAgentBonusRuleMutation();
  const [remove] = useDeleteAgentBonusRuleMutation();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<BonusRule | null>(null);
  const [draft, setDraft] = useState<Draft>(blank);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const locked = !!editing && (editing.awardCount ?? 0) > 0;
  const vendorCountMetric = draft.metric === "ACTIVE_VENDORS" || draft.metric === "NEW_VENDORS";

  const openCreate = () => {
    setEditing(null);
    setDraft(blank);
    setErrors({});
    setOpen(true);
  };
  const openEdit = (r: BonusRule) => {
    setEditing(r);
    setDraft({
      name: r.name,
      description: r.description ?? "",
      scope: r.scope,
      metric: r.metric,
      threshold: String(Number(r.threshold)),
      amount: String(Number(r.amount)),
      recurrence: r.recurrence,
      validFrom: dhakaDay(r.validFrom),
      validTo: dhakaDay(r.validTo),
      isActive: r.isActive,
    });
    setErrors({});
    setOpen(true);
  };

  function body(): Record<string, unknown> {
    const full: Record<string, unknown> = {
      name: draft.name.trim(),
      description: draft.description.trim() || null,
      scope: draft.scope,
      metric: draft.metric,
      threshold: draft.threshold.trim(),
      amount: draft.amount.trim(),
      recurrence: draft.recurrence,
      validTo: draft.validTo ? endOfDay(draft.validTo) : null,
      isActive: draft.isActive,
    };
    if (draft.validFrom) full.validFrom = startOfDay(draft.validFrom);
    if (!editing) return full;
    // Awarded rules: the condition and amount are frozen server-side; send only the editable fields.
    if (locked) return { name: full.name, description: full.description, validTo: full.validTo, isActive: full.isActive };
    return full;
  }

  async function submit() {
    setErrors({});
    try {
      if (editing) await update({ id: editing.id, body: body() }).unwrap();
      else await create(body()).unwrap();
      toast.success(editing ? "Bonus rule updated" : "Bonus rule created");
      setOpen(false);
    } catch (err) {
      setErrors(apiFieldErrors(err));
      toast.error(apiErrorMessage(err, "Could not save the bonus rule"));
    }
  }

  async function toggle(r: BonusRule) {
    try {
      await update({ id: r.id, body: { isActive: !r.isActive } }).unwrap();
      toast.success(r.isActive ? "Rule paused" : "Rule activated");
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  async function del(r: BonusRule) {
    if (!confirm(`Delete the bonus rule "${r.name}"?`)) return;
    try {
      await remove(r.id).unwrap();
      toast.success("Bonus rule deleted");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not delete the rule"));
    }
  }

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-6 sm:px-6">
      <AgentAdminHeader
        title="Milestone bonuses"
        subtitle="Fixed ৳ bonuses paid when an agent or one of their vendors reaches a milestone. Once a rule has paid out, its terms are frozen — create a new rule to change them."
        actions={
          <Btn onClick={openCreate}>
            <Plus className="size-4" /> New bonus rule
          </Btn>
        }
      />
      <Panel>
        {isLoading ? (
          <p className="p-6 text-sm text-slate-400">Loading…</p>
        ) : !rules?.length ? (
          <Empty title="No bonus rules" text="For example: ৳ 2,000 once an agent reaches 10 active vendors." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-100 bg-slate-50/60">
                <tr>
                  <th className={thCls}>Rule</th>
                  <th className={thCls}>Condition</th>
                  <th className={thCls}>Bonus</th>
                  <th className={thCls}>Repeats</th>
                  <th className={thCls}>Valid</th>
                  <th className={thCls}>Awarded</th>
                  <th className={thCls}>Status</th>
                  <th className={thCls} />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rules.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60">
                    <td className={tdCls}>
                      <span className="inline-flex items-center gap-2 font-semibold">
                        <Gift className="size-4 text-violet-500" /> {r.name}
                      </span>
                      <p className="max-w-64 text-xs text-slate-400">{describe(r)}</p>
                    </td>
                    <td className={`${tdCls} text-xs`}>
                      {SCOPE_LABEL[r.scope]}
                      <br />
                      {METRIC_LABEL[r.metric]} ≥ {r.metric === "DELIVERED_SALES" ? bdt(r.threshold) : Number(r.threshold)}
                    </td>
                    <td className={`${tdCls} font-bold text-emerald-700`}>{bdt(r.amount)}</td>
                    <td className={tdCls}>{REC_LABEL[r.recurrence]}</td>
                    <td className={`${tdCls} whitespace-nowrap text-xs`}>
                      {fmtDate(r.validFrom)} – {r.validTo ? fmtDate(r.validTo) : "open"}
                    </td>
                    <td className={tdCls}>{r.awardCount ?? 0}</td>
                    <td className={tdCls}>{r.isActive ? <Pill tone="green">Active</Pill> : <Pill>Paused</Pill>}</td>
                    <td className={`${tdCls} whitespace-nowrap text-right`}>
                      <Btn variant="ghost" onClick={() => openEdit(r)} aria-label={`Edit ${r.name}`}>
                        <Pencil className="size-4" />
                      </Btn>
                      <Btn variant="ghost" onClick={() => toggle(r)}>
                        {r.isActive ? "Pause" : "Activate"}
                      </Btn>
                      <Btn variant="ghost" onClick={() => del(r)} disabled={(r.awardCount ?? 0) > 0} title={(r.awardCount ?? 0) > 0 ? "Already paid out — pause it instead" : "Delete"} aria-label={`Delete ${r.name}`}>
                        <Trash2 className="size-4 text-red-500" />
                      </Btn>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? `Edit bonus rule: ${editing.name}` : "New bonus rule"}
        wide
        footer={
          <>
            <Btn variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Btn>
            <Btn onClick={submit} loading={creating || updating}>
              Save rule
            </Btn>
          </>
        }
      >
        {locked && (
          <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            This rule has already paid {editing?.awardCount} bonus(es). Only the name, description, end date and active status can change.
          </p>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldRow label="Name" error={errors.name}>
            <input className={inputCls(!!errors.name)} value={draft.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. 10 vendors club" />
          </FieldRow>
          <FieldRow label="Applies to" error={errors.scope}>
            <select className={inputCls(!!errors.scope)} value={draft.scope} disabled={locked} onChange={(e) => set("scope", e.target.value as Draft["scope"])}>
              {Object.entries(SCOPE_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </FieldRow>
          <FieldRow label="Measure" error={errors.metric} hint={vendorCountMetric && draft.scope === "PER_VENDOR" ? "Vendor-count measures need “Per agent”." : undefined}>
            <select className={inputCls(!!errors.metric)} value={draft.metric} disabled={locked} onChange={(e) => set("metric", e.target.value as Draft["metric"])}>
              {Object.entries(METRIC_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </FieldRow>
          <FieldRow label={draft.metric === "DELIVERED_SALES" ? "Threshold (৳)" : "Threshold (count)"} error={errors.threshold}>
            <input className={inputCls(!!errors.threshold)} inputMode="decimal" value={draft.threshold} disabled={locked} onChange={(e) => set("threshold", e.target.value)} />
          </FieldRow>
          <FieldRow label="Bonus amount (৳)" error={errors.amount}>
            <input className={inputCls(!!errors.amount)} inputMode="decimal" value={draft.amount} disabled={locked} onChange={(e) => set("amount", e.target.value)} />
          </FieldRow>
          <FieldRow label="Repeats" error={errors.recurrence} hint={draft.recurrence === "MONTHLY" ? "Can be earned once per calendar month (Asia/Dhaka)." : "Can be earned once per agent (or per vendor)."}>
            <select className={inputCls(!!errors.recurrence)} value={draft.recurrence} disabled={locked} onChange={(e) => set("recurrence", e.target.value as Draft["recurrence"])}>
              {Object.entries(REC_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </FieldRow>
          <FieldRow label="Valid from" error={errors.validFrom} hint={editing ? undefined : "Empty = today"}>
            <input type="date" className={inputCls(!!errors.validFrom)} value={draft.validFrom} disabled={locked} onChange={(e) => set("validFrom", e.target.value)} />
          </FieldRow>
          <FieldRow label="Valid until (optional)" error={errors.validTo}>
            <input type="date" className={inputCls(!!errors.validTo)} value={draft.validTo} onChange={(e) => set("validTo", e.target.value)} />
          </FieldRow>
          <div className="sm:col-span-2">
            <FieldRow label="Description (optional)" error={errors.description}>
              <textarea className={`${inputCls(!!errors.description)} h-20 py-2`} value={draft.description} onChange={(e) => set("description", e.target.value)} />
            </FieldRow>
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" className="size-4 accent-blue-600" checked={draft.isActive} onChange={(e) => set("isActive", e.target.checked)} /> Active
          </label>
        </div>
        {draft.threshold && draft.amount && (
          <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">Preview: {describe({ ...draft, threshold: draft.threshold, amount: draft.amount })}</p>
        )}
      </Modal>
    </div>
  );
}
