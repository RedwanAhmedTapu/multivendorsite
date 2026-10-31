"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Medal, Pencil, Play, Plus, Trash2 } from "lucide-react";
import {
  apiErrorMessage,
  apiFieldErrors,
  useCreateAgentLevelMutation,
  useEvaluateAgentLevelsMutation,
  useDeleteAgentLevelMutation,
  useListAgentLevelsQuery,
  useUpdateAgentLevelMutation,
  type AgentLevel,
  type LevelInput,
} from "@/features/agentAdminApi";
import { AgentAdminHeader, Btn, Empty, FieldRow, Modal, Panel, Pill, bdt, inputCls, pct, tdCls, thCls } from "@/components/agent-admin/AgentAdminUI";

type Draft = {
  name: string;
  rank: string;
  minActiveVendors: string;
  minDeliveredSales: string;
  minPerformanceScore: string;
  commissionPercent: string;
  bonusAmount: string;
  perks: string;
  isActive: boolean;
};

const empty = (rank: number): Draft => ({
  name: "",
  rank: String(rank),
  minActiveVendors: "0",
  minDeliveredSales: "0",
  minPerformanceScore: "",
  commissionPercent: "",
  bonusAmount: "",
  perks: "",
  isActive: true,
});

const fromLevel = (l: AgentLevel): Draft => ({
  name: l.name,
  rank: String(l.rank),
  minActiveVendors: String(l.minActiveVendors),
  minDeliveredSales: String(Number(l.minDeliveredSales)),
  minPerformanceScore: l.minPerformanceScore === null ? "" : String(l.minPerformanceScore),
  commissionPercent: l.commissionPercent === null ? "" : String(Number(l.commissionPercent)),
  bonusAmount: l.bonusAmount === null ? "" : String(Number(l.bonusAmount)),
  perks: l.perks.join("\n"),
  isActive: l.isActive,
});

function toInput(d: Draft): LevelInput {
  return {
    name: d.name.trim(),
    rank: Number(d.rank),
    minActiveVendors: Number(d.minActiveVendors || 0),
    minDeliveredSales: d.minDeliveredSales.trim() || "0",
    minPerformanceScore: d.minPerformanceScore.trim() === "" ? null : Number(d.minPerformanceScore),
    commissionPercent: d.commissionPercent.trim() === "" ? null : d.commissionPercent.trim(),
    bonusAmount: d.bonusAmount.trim() === "" ? null : d.bonusAmount.trim(),
    perks: d.perks.split("\n").map((p) => p.trim()).filter(Boolean),
    isActive: d.isActive,
  };
}

export default function AgentLevelsPage() {
  const { data: levels, isLoading } = useListAgentLevelsQuery();
  const [create, { isLoading: creating }] = useCreateAgentLevelMutation();
  const [update, { isLoading: updating }] = useUpdateAgentLevelMutation();
  const [remove] = useDeleteAgentLevelMutation();
  const [editing, setEditing] = useState<AgentLevel | null>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(empty(1));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const openCreate = () => {
    setEditing(null);
    setDraft(empty((levels?.reduce((m, l) => Math.max(m, l.rank), 0) ?? 0) + 1));
    setErrors({});
    setOpen(true);
  };
  const openEdit = (l: AgentLevel) => {
    setEditing(l);
    setDraft(fromLevel(l));
    setErrors({});
    setOpen(true);
  };

  async function submit() {
    setErrors({});
    try {
      if (editing) await update({ id: editing.id, body: toInput(draft) }).unwrap();
      else await create(toInput(draft)).unwrap();
      toast.success(editing ? "Level updated" : "Level created");
      setOpen(false);
    } catch (err) {
      setErrors(apiFieldErrors(err));
      toast.error(apiErrorMessage(err, "Could not save the level"));
    }
  }

  async function toggleActive(l: AgentLevel) {
    try {
      await update({ id: l.id, body: { isActive: !l.isActive } }).unwrap();
      toast.success(l.isActive ? "Level deactivated" : "Level activated");
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  async function del(l: AgentLevel) {
    if (!confirm(`Delete the level "${l.name}"? This can't be undone.`)) return;
    try {
      await remove(l.id).unwrap();
      toast.success("Level deleted");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not delete the level"));
    }
  }

  const f = (k: keyof Draft) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDraft({ ...draft, [k]: e.target.value });

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-6 sm:px-6">
      <AgentAdminHeader
        title="Agent levels"
        subtitle="Define the tiers, their thresholds, commission rate and level bonus. Thresholds must not decrease as the rank rises."
        actions={
          <>
            <EvaluateNow />
            <Btn onClick={openCreate}>
              <Plus className="size-4" /> New level
            </Btn>
          </>
        }
      />
      <Panel>
        {isLoading ? (
          <p className="p-6 text-sm text-slate-400">Loading…</p>
        ) : !levels?.length ? (
          <Empty title="No levels yet" text="Create the first level (for example Bronze, rank 1)." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-100 bg-slate-50/60">
                <tr>
                  <th className={thCls}>Rank</th>
                  <th className={thCls}>Level</th>
                  <th className={thCls}>Min. active vendors</th>
                  <th className={thCls}>Min. delivered sales</th>
                  <th className={thCls}>Min. score</th>
                  <th className={thCls}>Commission</th>
                  <th className={thCls}>Level bonus</th>
                  <th className={thCls}>Agents</th>
                  <th className={thCls}>Status</th>
                  <th className={thCls} />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {levels.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/60">
                    <td className={`${tdCls} font-bold`}>{l.rank}</td>
                    <td className={tdCls}>
                      <span className="inline-flex items-center gap-2 font-semibold">
                        <Medal className="size-4 text-amber-500" /> {l.name}
                      </span>
                      {l.perks.length > 0 && <p className="mt-0.5 max-w-56 truncate text-xs text-slate-400">{l.perks.join(" · ")}</p>}
                    </td>
                    <td className={tdCls}>{l.minActiveVendors}</td>
                    <td className={tdCls}>{bdt(l.minDeliveredSales)}</td>
                    <td className={tdCls}>{l.minPerformanceScore ?? "—"}</td>
                    <td className={`${tdCls} font-semibold`}>{l.commissionPercent ? pct(l.commissionPercent) : <span className="text-slate-400">Falls through</span>}</td>
                    <td className={tdCls}>{bdt(l.bonusAmount)}</td>
                    <td className={tdCls}>{l.agentCount ?? 0}</td>
                    <td className={tdCls}>{l.isActive ? <Pill tone="green">Active</Pill> : <Pill>Inactive</Pill>}</td>
                    <td className={`${tdCls} whitespace-nowrap text-right`}>
                      <Btn variant="ghost" onClick={() => openEdit(l)} aria-label={`Edit ${l.name}`}>
                        <Pencil className="size-4" />
                      </Btn>
                      <Btn variant="ghost" onClick={() => toggleActive(l)}>
                        {l.isActive ? "Deactivate" : "Activate"}
                      </Btn>
                      <Btn variant="ghost" onClick={() => del(l)} aria-label={`Delete ${l.name}`} disabled={(l.agentCount ?? 0) > 0} title={(l.agentCount ?? 0) > 0 ? "In use — deactivate instead" : "Delete"}>
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
        title={editing ? `Edit level: ${editing.name}` : "New level"}
        wide
        footer={
          <>
            <Btn variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Btn>
            <Btn onClick={submit} loading={creating || updating}>
              Save level
            </Btn>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldRow label="Name" error={errors.name}>
            <input className={inputCls(!!errors.name)} value={draft.name} onChange={f("name")} placeholder="e.g. Silver" />
          </FieldRow>
          <FieldRow label="Rank" error={errors.rank} hint="Higher rank = higher level. Unique.">
            <input className={inputCls(!!errors.rank)} inputMode="numeric" value={draft.rank} onChange={f("rank")} />
          </FieldRow>
          <FieldRow label="Min. active vendors" error={errors.minActiveVendors}>
            <input className={inputCls(!!errors.minActiveVendors)} inputMode="numeric" value={draft.minActiveVendors} onChange={f("minActiveVendors")} />
          </FieldRow>
          <FieldRow label="Min. delivered sales (৳)" error={errors.minDeliveredSales}>
            <input className={inputCls(!!errors.minDeliveredSales)} inputMode="decimal" value={draft.minDeliveredSales} onChange={f("minDeliveredSales")} />
          </FieldRow>
          <FieldRow label="Min. performance score (optional)" error={errors.minPerformanceScore} hint="0–100">
            <input className={inputCls(!!errors.minPerformanceScore)} inputMode="decimal" value={draft.minPerformanceScore} onChange={f("minPerformanceScore")} />
          </FieldRow>
          <FieldRow label="Commission % (optional)" error={errors.commissionPercent} hint="Empty = this level has no rate; resolution falls through.">
            <input className={inputCls(!!errors.commissionPercent)} inputMode="decimal" value={draft.commissionPercent} onChange={f("commissionPercent")} />
          </FieldRow>
          <FieldRow label="Level bonus (৳, optional)" error={errors.bonusAmount} hint="One-time bonus when an agent reaches this level.">
            <input className={inputCls(!!errors.bonusAmount)} inputMode="decimal" value={draft.bonusAmount} onChange={f("bonusAmount")} />
          </FieldRow>
          <FieldRow label="Status">
            <label className="flex h-10 items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" className="size-4 accent-blue-600" checked={draft.isActive} onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })} /> Active
            </label>
          </FieldRow>
          <div className="sm:col-span-2">
            <FieldRow label="Perks (one per line)" error={errors.perks}>
              <textarea className={`${inputCls(!!errors.perks)} h-24 py-2`} value={draft.perks} onChange={f("perks")} placeholder={"48h payout processing\nMonthly growth reports"} />
            </FieldRow>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/**
 * Phase 9: run the automatic level evaluation now (it also runs once a month).
 * Upgrade only — no agent is ever moved down; level bonuses are paid once.
 */
function EvaluateNow() {
  const [evaluate, state] = useEvaluateAgentLevelsMutation();
  async function run() {
    if (!window.confirm("Evaluate every active agent now? Agents who meet a higher level's thresholds are upgraded (never downgraded) and its level bonus is credited once.")) return;
    try {
      const r = await evaluate({}).unwrap();
      if ("evaluated" in r) toast.success(`${r.evaluated} agent(s) evaluated, ${r.upgraded} upgraded${r.failed ? `, ${r.failed} failed` : ""}`);
    } catch (err) {
      toast.error((err as { data?: { message?: string } })?.data?.message ?? "Evaluation failed");
    }
  }
  return (
    <Btn variant="outline" onClick={run} loading={state.isLoading}>
      <Play className="size-4" /> Run evaluation now
    </Btn>
  );
}
