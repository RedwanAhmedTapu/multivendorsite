"use client";

// Stage 5 — Badge Wise. Badge cards, rule editor (base rate + conditions),
// category overrides and assignment sync. Rates are PERCENT everywhere.
import { useEffect, useMemo, useState } from "react";
import { BadgeCheck, Plus, RefreshCw, RotateCcw, UserPlus, Users, X } from "lucide-react";
import { toast } from "sonner";
import {
  useAssignBadgeMutation,
  useBadgeEligibilityQuery,
  useCreateBadgeMutation,
  useDeleteBadgeOverrideMutation,
  useGetCategoryRatesQuery,
  useListBadgesQuery,
  useRecalculateBadgeMutation,
  useSetBadgeOverrideMutation,
  useSetBadgeRuleMutation,
  useUnassignBadgeMutation,
  useUpdateBadgeMutation,
  type BadgeCondition,
  type BadgeRow,
} from "@/features/commissionApi";
import { PanelSkeleton, Sk } from "@/components/admin/ui/AdminSkeletons";
import { flattenTree, fmtPercent } from "./commission-helpers";

const PREVIEW_BASE = 10000;
const EMPTY_ROWS: any[] = [];

type ConditionRow = BadgeCondition & { group: "all" | "any" };

const METRICS: { value: BadgeCondition["metric"]; label: string }[] = [
  { value: "completedOrders", label: "Completed orders" },
  { value: "sales", label: "Delivered sales (৳)" },
  { value: "avgRating", label: "Average rating" },
];

function currency(n: number): string {
  return `৳${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

function previewOf(rate: number | null | undefined): string {
  const n = Number(rate);
  if (!Number.isFinite(n)) return "—";
  return currency((PREVIEW_BASE * n) / 100);
}

function conditionsToRows(
  conditions: { all?: BadgeCondition[]; any?: BadgeCondition[] } | null | undefined,
): ConditionRow[] {
  if (!conditions) return [];
  return [
    ...(conditions.all ?? []).map((x) => ({ ...x, group: "all" as const })),
    ...(conditions.any ?? []).map((x) => ({ ...x, group: "any" as const })),
  ];
}

export default function BadgeWiseTab() {
  const badgesQuery = useListBadgesQuery();
  const categories = useGetCategoryRatesQuery();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPriority, setNewPriority] = useState("0");

  const [createBadge, createState] = useCreateBadgeMutation();
  const [updateBadge] = useUpdateBadgeMutation();

  const badges = badgesQuery.data ?? [];
  const selected = badges.find((b) => b.id === selectedId) ?? badges[0] ?? null;
  const allCategories = useMemo(() => flattenTree(categories.data?.tree ?? []), [categories.data]);

  const rule = selected?.rule ?? null;
  const [mode, setMode] = useState<"AUTOMATIC" | "MANUAL">("AUTOMATIC");
  const [baseRate, setBaseRate] = useState("");
  const [rulePriority, setRulePriority] = useState("0");
  const [ruleActive, setRuleActive] = useState(true);
  const [conditionRows, setConditionRows] = useState<ConditionRow[]>([]);
  const [overrideCategory, setOverrideCategory] = useState("");
  const [overrideRate, setOverrideRate] = useState("");
  const [assignSelection, setAssignSelection] = useState<string[]>([]);

  const [setBadgeRule, ruleState] = useSetBadgeRuleMutation();
  const [setBadgeOverride, overrideState] = useSetBadgeOverrideMutation();
  const [deleteBadgeOverride] = useDeleteBadgeOverrideMutation();
  const [assignBadge, assignState] = useAssignBadgeMutation();
  const [unassignBadge, unassignState] = useUnassignBadgeMutation();
  const [recalculateBadge, recalcState] = useRecalculateBadgeMutation();

  const eligibility = useBadgeEligibilityQuery(selected?.id ?? "", { skip: !selected?.id });
  const eligibleRows: any[] = eligibility.data?.rows ?? EMPTY_ROWS;
  const assignedRows = useMemo<any[]>(() => eligibleRows.filter((r: any) => r.assigned), [eligibleRows]);

  const ruleSignature = rule
    ? JSON.stringify({ id: rule.id, mode: rule.mode, baseRate: rule.baseRate, priority: rule.priority, active: rule.isActive, conditions: rule.conditions })
    : "";

  useEffect(() => {
    setMode(rule?.mode ?? "AUTOMATIC");
    setBaseRate(rule ? String(rule.baseRate) : "");
    setRulePriority(String(rule?.priority ?? 0));
    setRuleActive(rule?.isActive ?? true);
    setConditionRows(rule ? conditionsToRows(rule.conditions) : []);
    setOverrideCategory("");
    setOverrideRate("");
  }, [selected?.id, ruleSignature]);

  useEffect(() => {
    setAssignSelection(assignedRows.map((r: any) => r.vendorId));
  }, [assignedRows]);

  const rateNumber = Number(baseRate);
  const invalidRate = baseRate !== "" && (!Number.isFinite(rateNumber) || rateNumber < 0 || rateNumber > 100);

  const addCondition = () =>
    setConditionRows((rows) => [...rows, { group: "all", metric: "completedOrders", op: ">=", value: 0 }]);

  const patchCondition = (index: number, patch: Partial<ConditionRow>) =>
    setConditionRows((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  const saveRule = async () => {
    if (!selected) return;
    if (invalidRate || baseRate === "") {
      toast.error("Base rate must be between 0 and 100");
      return;
    }
    const all = conditionRows.filter((c) => c.group === "all").map(({ group, ...c }) => c);
    const any = conditionRows.filter((c) => c.group === "any").map(({ group, ...c }) => c);
    try {
      await setBadgeRule({
        badgeId: selected.id,
        baseRate: Number(baseRate),
        mode,
        priority: Number(rulePriority) || 0,
        isActive: ruleActive,
        conditions: all.length || any.length ? { all, any } : null,
      }).unwrap();
      toast.success("Badge rule saved");
    } catch (error: any) {
      toast.error(error?.data?.message ?? "Could not save the badge rule");
    }
  };

  const createNewBadge = async () => {
    const name = newName.trim();
    if (!name) {
      toast.error("Badge name is required");
      return;
    }
    try {
      const created: any = await createBadge({ name, priority: Number(newPriority) || 0 }).unwrap();
      toast.success(`Badge “${name}” created`);
      setCreateOpen(false);
      setNewName("");
      setNewPriority("0");
      if (created?.id) setSelectedId(created.id);
    } catch (error: any) {
      toast.error(error?.data?.message ?? "Could not create the badge");
    }
  };

  const addOverride = async () => {
    if (!selected) return;
    if (!overrideCategory) {
      toast.error("Pick a category");
      return;
    }
    const rate = Number(overrideRate);
    if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
      toast.error("Override rate must be between 0 and 100");
      return;
    }
    try {
      await setBadgeOverride({ badgeId: selected.id, categoryId: overrideCategory, rate }).unwrap();
      toast.success("Category override saved");
      setOverrideCategory("");
      setOverrideRate("");
    } catch (error: any) {
      toast.error(error?.data?.message ?? "Could not save the override");
    }
  };

  const resetOverride = async (categoryId: string) => {
    if (!selected) return;
    try {
      await deleteBadgeOverride({ badgeId: selected.id, categoryId }).unwrap();
      toast.success("Override removed — falls back to the badge base rate");
    } catch (error: any) {
      toast.error(error?.data?.message ?? "Could not remove the override");
    }
  };

  const toggleAssign = (vendorId: string) =>
    setAssignSelection((prev) => (prev.includes(vendorId) ? prev.filter((id) => id !== vendorId) : [...prev, vendorId]));

  const saveAssignments = async () => {
    if (!selected) return;
    const assignedIds = new Set<string>(assignedRows.map((r: any) => String(r.vendorId)));
    const toAssign = assignSelection.filter((id) => !assignedIds.has(id));
    const toUnassign: string[] = [...assignedIds].filter((id) => !assignSelection.includes(id));
    try {
      if (toAssign.length) await assignBadge({ badgeId: selected.id, vendorIds: toAssign, mode: "MANUAL" }).unwrap();
      for (const vendorId of toUnassign) {
        await unassignBadge({ badgeId: selected.id, vendorId }).unwrap();
      }
      toast.success(
        toAssign.length || toUnassign.length
          ? `Assignments saved (${toAssign.length} added, ${toUnassign.length} removed)`
          : "No assignment changes",
      );
    } catch (error: any) {
      toast.error(error?.data?.message ?? "Could not update assignments");
    }
  };

  const toggleActive = async (badge: BadgeRow) => {
    try {
      await updateBadge({ badgeId: badge.id, isActive: !badge.isActive }).unwrap();
      toast.success(badge.isActive ? "Badge deactivated" : "Badge activated");
    } catch (error: any) {
      toast.error(error?.data?.message ?? "Could not update the badge");
    }
  };

  const recalculate = async () => {
    if (!selected) return;
    try {
      const res: any = await recalculateBadge(selected.id).unwrap();
      toast.success(`Eligible ${res.eligible} vendors (${res.added} added, ${res.removed} removed)`);
    } catch (error: any) {
      toast.error(error?.data?.message ?? "Could not recalculate assignments");
    }
  };

  if (badgesQuery.isLoading) {
    return (
      <div aria-busy="true" aria-label="Loading badges" className="grid grid-cols-1 gap-3 xl:grid-cols-[300px_1fr]">
        <section className="rounded-2xl border border-slate-200 bg-white">
          <header className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
            <Sk className="h-3 w-16" />
            <Sk className="h-6 w-14 rounded-lg" />
          </header>
          <div className="space-y-2 p-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-slate-200 p-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1.5">
                    <Sk className="h-3 w-28" />
                    <Sk soft className="h-2.5 w-36" />
                  </div>
                  <Sk soft className="h-4 w-10 rounded-full" />
                </div>
                <Sk soft className="mt-2 h-2.5 w-20" />
              </div>
            ))}
          </div>
        </section>
        <div className="space-y-3">
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-3">
            <Sk className="h-4 w-40" />
            <Sk soft className="h-2.5 w-56" />
            <div className="grid grid-cols-2 gap-3">
              <Sk className="h-10 rounded-lg" />
              <Sk className="h-10 rounded-lg" />
            </div>
          </div>
          <PanelSkeleton rows={5} cols={4} />
        </div>
      </div>
    );
  }
  if (badgesQuery.isError) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700">
        Could not load badges. The commission migration may not be applied yet.{" "}
        <button type="button" onClick={() => badgesQuery.refetch()} className="font-semibold underline">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 xl:grid-cols-[300px_1fr]">
      <section className="rounded-2xl border border-slate-200 bg-white">
        <header className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
          <h3 className="text-xs font-bold text-slate-800">Badges</h3>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-2 py-1 text-[11px] font-bold text-white hover:bg-slate-800"
          >
            <Plus size={12} /> New
          </button>
        </header>
        <div className="max-h-[70vh] space-y-2 overflow-y-auto p-2">
          {badges.length === 0 && (
            <p className="px-2 py-8 text-center text-[11px] text-slate-500">No badges yet. Create one to start badge-wise pricing.</p>
          )}
          {badges.map((badge) => {
            const active = selected?.id === badge.id;
            return (
              <article
                key={badge.id}
                className={`cursor-pointer rounded-xl border p-2.5 transition ${active ? "border-indigo-300 bg-indigo-50/60" : "border-slate-200 hover:border-slate-300"}`}
                onClick={() => setSelectedId(badge.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-slate-800">{badge.name}</p>
                    <p className="mt-0.5 text-[10px] text-slate-500">
                      {badge.rule ? `${badge.rule.mode === "AUTOMATIC" ? "Automatic" : "Manual"} · ${fmtPercent(badge.rule.baseRate)}` : "No rule yet"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleActive(badge);
                    }}
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${badge.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
                  >
                    {badge.isActive ? "Active" : "Off"}
                  </button>
                </div>
                <div className="mt-1.5 flex items-center gap-2 text-[10px] text-slate-500">
                  <Users size={11} /> {badge.vendorCount} vendors
                  {badge.rule && badge.rule.overrides.length > 0 && <span>· {badge.rule.overrides.length} overrides</span>}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {!selected ? (
        <section className="flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white text-center">
          <div className="p-8">
            <BadgeCheck size={28} className="mx-auto text-slate-300" />
            <p className="mt-3 text-sm font-semibold text-slate-700">No badge selected</p>
            <p className="mt-1 text-[11px] text-slate-500">Create a badge, set its base rate and conditions, then assign vendors.</p>
          </div>
        </section>
      ) : (
        <div className="space-y-3">
          <section className="rounded-2xl border border-slate-200 bg-white p-3">
            <header className="flex flex-wrap items-center gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900">{selected.name}</h3>
                <p className="text-[11px] text-slate-500">
                  {rule ? `Base ${fmtPercent(rule.baseRate)} · ${rule.overrides.length} category overrides` : "No rule configured"}
                </p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <button
                  type="button"
                  onClick={recalculate}
                  disabled={!rule || rule.mode !== "AUTOMATIC" || recalcState.isLoading}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                >
                  <RefreshCw size={12} className={recalcState.isLoading ? "animate-spin" : ""} /> Recalculate
                </button>
              </div>
            </header>

            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-4">
              <label className="text-[11px] font-semibold text-slate-600">
                Mode
                <select value={mode} onChange={(e) => setMode(e.target.value as "AUTOMATIC" | "MANUAL")} className="mt-1 h-8 w-full rounded-lg border border-slate-200 px-2 text-xs font-normal outline-none focus:border-indigo-400">
                  <option value="AUTOMATIC">Automatic</option>
                  <option value="MANUAL">Manual</option>
                </select>
              </label>
              <label className="text-[11px] font-semibold text-slate-600">
                Base rate %
                <input
                  value={baseRate}
                  onChange={(e) => setBaseRate(e.target.value)}
                  inputMode="decimal"
                  placeholder="e.g. 12.5"
                  className={`mt-1 h-8 w-full rounded-lg border px-2 text-xs font-normal outline-none ${invalidRate ? "border-rose-300 focus:border-rose-400" : "border-slate-200 focus:border-indigo-400"}`}
                />
              </label>
              <label className="text-[11px] font-semibold text-slate-600">
                Priority
                <input value={rulePriority} onChange={(e) => setRulePriority(e.target.value)} inputMode="numeric" className="mt-1 h-8 w-full rounded-lg border border-slate-200 px-2 text-xs font-normal outline-none focus:border-indigo-400" />
              </label>
              <label className="mt-5 flex items-center gap-2 text-[11px] font-semibold text-slate-600">
                <input type="checkbox" checked={ruleActive} onChange={(e) => setRuleActive(e.target.checked)} /> Rule enabled
              </label>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-3 rounded-xl bg-slate-50 px-3 py-2">
              <span className="text-[11px] text-slate-600">
                Commission on a <b>৳{PREVIEW_BASE.toLocaleString("en-US")}</b> delivery
              </span>
              <span className="rounded-lg bg-white px-2 py-1 text-xs font-extrabold text-indigo-700">{previewOf(rateNumber)}</span>
            </div>

            <div className="mt-3 rounded-xl border border-slate-200">
              <header className="flex items-center justify-between border-b border-slate-100 px-2.5 py-1.5">
                <h4 className="text-[11px] font-bold text-slate-700">Eligibility conditions</h4>
                <button type="button" onClick={addCondition} className="text-[11px] font-semibold text-indigo-600 hover:underline">
                  + Add condition
                </button>
              </header>
              {conditionRows.length === 0 ? (
                <p className="px-2.5 py-3 text-[11px] text-slate-500">No conditions — every vendor is eligible when this rule is automatic.</p>
              ) : (
                <div className="divide-y divide-slate-50">
                  {conditionRows.map((row, index) => (
                    <div key={index} className="flex flex-wrap items-center gap-1.5 px-2.5 py-1.5">
                      <select value={row.group} onChange={(e) => patchCondition(index, { group: e.target.value as "all" | "any" })} className="h-7 rounded-md border border-slate-200 px-1.5 text-[11px] outline-none focus:border-indigo-400">
                        <option value="all">Match all</option>
                        <option value="any">Match any</option>
                      </select>
                      <select value={row.metric} onChange={(e) => patchCondition(index, { metric: e.target.value as BadgeCondition["metric"] })} className="h-7 rounded-md border border-slate-200 px-1.5 text-[11px] outline-none focus:border-indigo-400">
                        {METRICS.map((m) => (
                          <option key={m.value} value={m.value}>
                            {m.label}
                          </option>
                        ))}
                      </select>
                      <select value={row.op} onChange={(e) => patchCondition(index, { op: e.target.value as BadgeCondition["op"] })} className="h-7 rounded-md border border-slate-200 px-1.5 text-[11px] outline-none focus:border-indigo-400">
                        {[">=", ">", "<=", "<"].map((op) => (
                          <option key={op} value={op}>
                            {op}
                          </option>
                        ))}
                      </select>
                      <input
                        value={String(row.value)}
                        onChange={(e) => patchCondition(index, { value: Number(e.target.value) || 0 })}
                        inputMode="decimal"
                        className="h-7 w-24 rounded-md border border-slate-200 px-1.5 text-[11px] outline-none focus:border-indigo-400"
                      />
                      <button type="button" onClick={() => setConditionRows((rows) => rows.filter((_, i) => i !== index))} className="ml-auto text-slate-400 hover:text-rose-600" aria-label="Remove condition">
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-2 flex justify-end">
              <button
                type="button"
                onClick={saveRule}
                disabled={ruleState.isLoading || invalidRate}
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-indigo-700 disabled:opacity-40"
              >
                {ruleState.isLoading ? "Saving…" : "Save rule"}
              </button>
            </div>
          </section>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <section className="rounded-2xl border border-slate-200 bg-white">
              <header className="border-b border-slate-100 px-3 py-2">
                <h3 className="text-xs font-bold text-slate-800">Category overrides</h3>
                <p className="text-[10px] text-slate-500">Exact category match. Removing an override falls back to the badge base rate; history is kept.</p>
              </header>
              <div className="flex flex-wrap items-end gap-1.5 px-3 py-2">
                <label className="min-w-[160px] flex-1 text-[10px] font-semibold text-slate-600">
                  Category
                  <select value={overrideCategory} onChange={(e) => setOverrideCategory(e.target.value)} className="mt-1 h-8 w-full rounded-lg border border-slate-200 px-2 text-[11px] font-normal outline-none focus:border-indigo-400">
                    <option value="">Select category…</option>
                    {allCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.path}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="w-24 text-[10px] font-semibold text-slate-600">
                  Rate %
                  <input value={overrideRate} onChange={(e) => setOverrideRate(e.target.value)} inputMode="decimal" className="mt-1 h-8 w-full rounded-lg border border-slate-200 px-2 text-[11px] font-normal outline-none focus:border-indigo-400" />
                </label>
                <button type="button" onClick={addOverride} disabled={overrideState.isLoading} className="h-8 rounded-lg bg-slate-900 px-2.5 text-[11px] font-bold text-white hover:bg-slate-800 disabled:opacity-40">
                  Save
                </button>
              </div>
              <div className="max-h-56 overflow-y-auto border-t border-slate-100">
                {!rule || rule.overrides.length === 0 ? (
                  <p className="px-3 py-4 text-[11px] text-slate-500">No category overrides.</p>
                ) : (
                  <table className="w-full text-left text-[11px]">
                    <tbody className="divide-y divide-slate-50">
                      {rule.overrides.map((override) => (
                        <tr key={override.id}>
                          <td className="px-3 py-1.5 text-slate-700">{override.categoryPath}</td>
                          <td className="px-2 py-1.5 text-right font-bold text-slate-800">{fmtPercent(override.rate)}</td>
                          <td className="px-2 py-1.5 text-right text-slate-500">{previewOf(override.rate)}</td>
                          <td className="px-2 py-1.5 text-right">
                            <button type="button" onClick={() => resetOverride(override.categoryId)} className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 hover:text-rose-600">
                              <RotateCcw size={11} /> Reset
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white">
              <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-3 py-2">
                <div>
                  <h3 className="text-xs font-bold text-slate-800">Vendor assignment</h3>
                  <p className="text-[10px] text-slate-500">
                    Eligibility is computed live from delivered VendorOrders and published reviews (not the performance cache).
                  </p>
                </div>
                <button type="button" onClick={saveAssignments} disabled={assignState.isLoading || unassignState.isLoading} className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-2 py-1 text-[11px] font-bold text-white hover:bg-indigo-700 disabled:opacity-40">
                  <UserPlus size={12} /> Save assignments
                </button>
              </header>
              <div className="max-h-72 overflow-y-auto">
                {eligibility.isLoading ? (
                  <p className="px-3 py-6 text-center text-[11px] text-slate-500">Checking eligibility…</p>
                ) : eligibility.isError ? (
                  <p className="px-3 py-6 text-center text-[11px] text-rose-600">Could not load eligibility.</p>
                ) : eligibleRows.length === 0 ? (
                  <p className="px-3 py-6 text-center text-[11px] text-slate-500">No vendors found.</p>
                ) : (
                  <table className="w-full min-w-[420px] text-left text-[11px]">
                    <thead className="sticky top-0 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="w-8 px-2 py-1.5">
                          <input
                            type="checkbox"
                            aria-label="Select all eligible vendors"
                            checked={eligibleRows.length > 0 && eligibleRows.every((r: any) => assignSelection.includes(r.vendorId))}
                            onChange={(e) => setAssignSelection(e.target.checked ? eligibleRows.map((r: any) => r.vendorId) : [])}
                          />
                        </th>
                        <th className="px-2 py-1.5">Vendor</th>
                        <th className="px-2 py-1.5 text-right">Orders</th>
                        <th className="px-2 py-1.5 text-right">Rating</th>
                        <th className="px-2 py-1.5 text-right">Eligible</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {eligibleRows.map((row: any) => (
                        <tr key={row.vendorId} className={row.assigned ? "bg-indigo-50/40" : undefined}>
                          <td className="px-2 py-1.5">
                            <input type="checkbox" aria-label={`Assign ${row.storeName}`} checked={assignSelection.includes(row.vendorId)} onChange={() => toggleAssign(row.vendorId)} />
                          </td>
                          <td className="px-2 py-1.5">
                            <span className="font-semibold text-slate-700">{row.storeName}</span>
                            {row.assigned && (
                              <span className="ml-1.5 rounded bg-indigo-100 px-1 py-0.5 text-[9px] font-bold text-indigo-700">{row.assignmentMode ?? "ASSIGNED"}</span>
                            )}
                          </td>
                          <td className="px-2 py-1.5 text-right text-slate-600">{row.completedOrders}</td>
                          <td className="px-2 py-1.5 text-right text-slate-600">{Number(row.avgRating).toFixed(1)}</td>
                          <td className="px-2 py-1.5 text-right">
                            <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${row.eligible ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                              {row.eligible ? "YES" : "NO"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              {eligibility.data?.truncated && (
                <p className="border-t border-slate-100 px-3 py-1.5 text-[10px] text-amber-600">
                  Showing the first 200 vendors for preview — bulk assignment above this cap is not available yet.
                </p>
              )}
            </section>
          </div>
        </div>
      )}

      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={() => setCreateOpen(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-4 shadow-[0_2px_12px_rgba(15,23,42,0.12)]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">New badge</h3>
              <button type="button" onClick={() => setCreateOpen(false)} className="text-slate-400 hover:text-slate-700" aria-label="Close">
                <X size={16} />
              </button>
            </div>
            <label className="mt-3 block text-[11px] font-semibold text-slate-600">
              Name
              <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Platinum Vendor" className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-2 text-xs outline-none focus:border-indigo-400" />
            </label>
            <label className="mt-2 block text-[11px] font-semibold text-slate-600">
              Priority
              <input value={newPriority} onChange={(e) => setNewPriority(e.target.value)} inputMode="numeric" className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-2 text-xs outline-none focus:border-indigo-400" />
            </label>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setCreateOpen(false)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-50">
                Cancel
              </button>
              <button type="button" onClick={createNewBadge} disabled={createState.isLoading} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-indigo-700 disabled:opacity-40">
                {createState.isLoading ? "Creating…" : "Create badge"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
