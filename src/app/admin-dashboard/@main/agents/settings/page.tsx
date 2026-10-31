"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, History, RotateCcw, Save } from "lucide-react";
import {
  apiErrorMessage,
  apiFieldErrors,
  useGetAgentAuditQuery,
  useGetAgentSettingsQuery,
  useUpdateAgentSettingsMutation,
  type AgentSettingsValues,
  type PayoutMethod,
  type RateSource,
  type SettingKey,
} from "@/features/agentAdminApi";
import { AgentAdminHeader, Btn, FieldRow, Panel, Pill, bdt, fmtDateTime, inputCls } from "@/components/agent-admin/AgentAdminUI";

type Form = {
  defaultCommissionPercent: string;
  ratePrecedence: RateSource[];
  holdDays: string;
  durationLifetime: boolean;
  commissionDurationMonths: string;
  minWithdrawalAmount: string;
  maxWithdrawalAmount: string;
  feeType: "NONE" | "FLAT" | "PERCENT";
  feeValue: string;
  enabledPayoutMethods: PayoutMethod[];
  autoApproveWithdrawalLimit: string;
  registrationRequiresApproval: boolean;
};

const ALL_SOURCES: RateSource[] = ["VENDOR", "AGENT", "CATEGORY", "LEVEL", "GLOBAL"];
const SOURCE_LABEL: Record<RateSource, string> = {
  VENDOR: "Vendor override",
  AGENT: "Agent override",
  CATEGORY: "Category override",
  LEVEL: "Agent level rate",
  GLOBAL: "Default (global) rate",
};
// Proposed starting order for a first-time setup: the business rule
// "vendor > agent > level > global". It is only a form starting point —
// nothing is saved until the admin presses Save.
const PROPOSED_PRECEDENCE: RateSource[] = ["VENDOR", "AGENT", "LEVEL", "GLOBAL"];
const METHODS: Array<{ value: PayoutMethod; label: string }> = [
  { value: "BKASH", label: "bKash" },
  { value: "NAGAD", label: "Nagad" },
  { value: "BANK", label: "Bank transfer" },
];

function toForm(v: AgentSettingsValues): Form {
  const fee = v.withdrawalFee;
  return {
    defaultCommissionPercent: v.defaultCommissionPercent ? String(Number(v.defaultCommissionPercent)) : "",
    ratePrecedence: v.ratePrecedence ?? PROPOSED_PRECEDENCE,
    holdDays: v.holdDays === null ? "" : String(v.holdDays),
    durationLifetime: v.commissionDurationMonths === null,
    commissionDurationMonths: v.commissionDurationMonths === null ? "" : String(v.commissionDurationMonths),
    minWithdrawalAmount: v.minWithdrawalAmount ? String(Number(v.minWithdrawalAmount)) : "",
    maxWithdrawalAmount: v.maxWithdrawalAmount ? String(Number(v.maxWithdrawalAmount)) : "",
    feeType: fee?.type ?? "NONE",
    feeValue: fee?.type === "FLAT" ? String(Number(fee.amount)) : fee?.type === "PERCENT" ? String(Number(fee.percent)) : "",
    enabledPayoutMethods: v.enabledPayoutMethods ?? [],
    autoApproveWithdrawalLimit: v.autoApproveWithdrawalLimit ? String(Number(v.autoApproveWithdrawalLimit)) : "",
    registrationRequiresApproval: v.registrationRequiresApproval ?? true,
  };
}

/** The payload value for each key, or undefined when the field is left empty. */
function payloadOf(f: Form): Partial<Record<SettingKey, unknown>> {
  const out: Partial<Record<SettingKey, unknown>> = {};
  if (f.defaultCommissionPercent.trim() !== "") out.defaultCommissionPercent = f.defaultCommissionPercent.trim();
  out.ratePrecedence = f.ratePrecedence;
  if (f.holdDays.trim() !== "") out.holdDays = Number(f.holdDays);
  if (f.durationLifetime) out.commissionDurationMonths = null;
  else if (f.commissionDurationMonths.trim() !== "") out.commissionDurationMonths = Number(f.commissionDurationMonths);
  if (f.minWithdrawalAmount.trim() !== "") out.minWithdrawalAmount = f.minWithdrawalAmount.trim();
  if (f.maxWithdrawalAmount.trim() !== "") out.maxWithdrawalAmount = f.maxWithdrawalAmount.trim();
  if (f.feeType === "NONE") out.withdrawalFee = { type: "NONE" };
  else if (f.feeValue.trim() !== "") out.withdrawalFee = f.feeType === "FLAT" ? { type: "FLAT", amount: f.feeValue.trim() } : { type: "PERCENT", percent: f.feeValue.trim() };
  if (f.enabledPayoutMethods.length) out.enabledPayoutMethods = f.enabledPayoutMethods;
  if (f.autoApproveWithdrawalLimit.trim() !== "") out.autoApproveWithdrawalLimit = f.autoApproveWithdrawalLimit.trim();
  out.registrationRequiresApproval = f.registrationRequiresApproval;
  return out;
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

function NotSet({ show }: { show: boolean }) {
  return show ? <Pill tone="amber">Not configured</Pill> : null;
}

function SettingHistory() {
  const { data } = useGetAgentAuditQuery({ entity: "SETTING", limit: 15 });
  return (
    <Panel title="Change history" subtitle="Every settings change with the admin, time, old and new value.">
      <ul className="divide-y divide-slate-100">
        {data?.items.length === 0 && <li className="px-5 py-6 text-sm text-slate-400">No changes yet.</li>}
        {data?.items.map((a) => (
          <li key={a.id} className="px-5 py-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-semibold text-slate-700">{a.entityId}</span>
              <span className="text-xs text-slate-400">{fmtDateTime(a.createdAt)}</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              <span className="font-mono text-red-600 line-through decoration-red-300">{a.oldValue ? JSON.stringify((a.oldValue as { value: unknown }).value) : "not set"}</span>
              {" → "}
              <span className="font-mono text-emerald-700">{JSON.stringify((a.newValue as { value: unknown } | null)?.value)}</span>
            </p>
            <p className="mt-0.5 text-[11px] text-slate-400">by {a.actorName ?? a.actorUserId}</p>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

export default function AgentSettingsPage() {
  const { data, isLoading, refetch } = useGetAgentSettingsQuery();
  const [save, { isLoading: saving }] = useUpdateAgentSettingsMutation();
  const [form, setForm] = useState<Form | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (data) setForm(toForm(data.values));
  }, [data]);

  const missing = useMemo(() => new Set(data?.missing ?? []), [data]);
  const baseline = useMemo(() => (data ? payloadOf(toForm(data.values)) : {}), [data]);
  const current = form ? payloadOf(form) : {};
  const dirtyKeys = (Object.keys(current) as SettingKey[]).filter((k) => missing.has(k) || !same(current[k], baseline[k]));

  if (isLoading || !form || !data) return <div className="p-6 text-sm text-slate-400">Loading settings…</div>;
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm({ ...form, [k]: v });

  async function onSave() {
    setErrors({});
    const body: Partial<Record<SettingKey, unknown>> = {};
    for (const k of dirtyKeys) body[k] = current[k];
    if (!Object.keys(body).length) {
      toast.info("Nothing to save");
      return;
    }
    try {
      const res = await save(body).unwrap();
      toast.success(res.changed?.length ? `Saved ${res.changed.length} setting(s)` : "No changes");
    } catch (err) {
      setErrors(apiFieldErrors(err));
      toast.error(apiErrorMessage(err, "Could not save settings"));
    }
  }

  const move = (i: number, dir: -1 | 1) => {
    const list = [...form.ratePrecedence];
    const j = i + dir;
    if (j < 0 || j >= list.length || list[j] === "GLOBAL" || list[i] === "GLOBAL") return;
    [list[i], list[j]] = [list[j], list[i]];
    set("ratePrecedence", list);
  };
  const hasCategory = form.ratePrecedence.includes("CATEGORY");

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-6 sm:px-6">
      <AgentAdminHeader
        title="Agent settings"
        subtitle="Every commission and payout rule is configured here — nothing is hardcoded. Changes are validated and audited."
        actions={
          <>
            <Btn variant="outline" onClick={() => { setForm(toForm(data.values)); setErrors({}); refetch(); }}>
              <RotateCcw className="size-4" /> Reset
            </Btn>
            <Btn onClick={onSave} loading={saving} disabled={!dirtyKeys.length}>
              <Save className="size-4" /> Save {dirtyKeys.length ? `(${dirtyKeys.length})` : ""}
            </Btn>
          </>
        }
      />

      {data.missing.length > 0 && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <b>{data.missing.length} setting(s) not configured yet.</b> Features that depend on them stay closed until you save them (for example, commission is not calculated without a default rate and hold days).
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <Panel title="Commission" subtitle="How an agent's commission rate is chosen and when it becomes withdrawable.">
            <div className="grid gap-5 p-5 md:grid-cols-2">
              <FieldRow label="Default (global) commission %" error={errors.defaultCommissionPercent} hint="Used when no other source applies. 0–100, up to 4 decimals.">
                <div className="flex items-center gap-2">
                  <input className={inputCls(!!errors.defaultCommissionPercent)} inputMode="decimal" value={form.defaultCommissionPercent} onChange={(e) => set("defaultCommissionPercent", e.target.value)} placeholder="e.g. 2" />
                  <NotSet show={missing.has("defaultCommissionPercent")} />
                </div>
              </FieldRow>
              <FieldRow label="Hold days" error={errors.holdDays} hint="Days after delivery before commission can be withdrawn (0–365).">
                <div className="flex items-center gap-2">
                  <input className={inputCls(!!errors.holdDays)} inputMode="numeric" value={form.holdDays} onChange={(e) => set("holdDays", e.target.value)} placeholder="e.g. 7" />
                  <NotSet show={missing.has("holdDays")} />
                </div>
              </FieldRow>
              <FieldRow label="Commission duration" error={errors.commissionDurationMonths} hint="How long after a vendor is linked the agent earns on it.">
                <div className="flex flex-wrap items-center gap-3">
                  <label className="inline-flex items-center gap-2 text-sm text-slate-600">
                    <input type="checkbox" checked={form.durationLifetime} onChange={(e) => set("durationLifetime", e.target.checked)} className="size-4 accent-blue-600" />
                    For the life of the link
                  </label>
                  {!form.durationLifetime && (
                    <input className={`${inputCls(!!errors.commissionDurationMonths)} w-32`} inputMode="numeric" value={form.commissionDurationMonths} onChange={(e) => set("commissionDurationMonths", e.target.value)} placeholder="months" />
                  )}
                  <NotSet show={missing.has("commissionDurationMonths")} />
                </div>
              </FieldRow>
              <div className="md:col-span-2">
                <FieldRow label="Rate precedence" error={errors.ratePrecedence} hint="The first source with a rate wins. GLOBAL is always last.">
                  <div className="flex flex-wrap items-center gap-2">
                    <ol className="flex flex-wrap items-center gap-2">
                      {form.ratePrecedence.map((s, i) => (
                        <li key={s} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 py-1 pl-3 pr-1 text-sm font-semibold text-slate-700">
                          <span className="mr-1 text-xs text-slate-400">{i + 1}.</span>
                          {SOURCE_LABEL[s]}
                          {s !== "GLOBAL" && (
                            <>
                              <button className="rounded p-1 text-slate-400 hover:bg-white hover:text-slate-700 disabled:opacity-30" disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Move ${s} up`}>
                                <ArrowUp className="size-3.5" />
                              </button>
                              <button className="rounded p-1 text-slate-400 hover:bg-white hover:text-slate-700 disabled:opacity-30" disabled={form.ratePrecedence[i + 1] === "GLOBAL"} onClick={() => move(i, 1)} aria-label={`Move ${s} down`}>
                                <ArrowDown className="size-3.5" />
                              </button>
                            </>
                          )}
                        </li>
                      ))}
                    </ol>
                    <NotSet show={missing.has("ratePrecedence")} />
                  </div>
                  <label className="mt-3 inline-flex items-center gap-2 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      className="size-4 accent-blue-600"
                      checked={hasCategory}
                      onChange={(e) => {
                        const list: RateSource[] = form.ratePrecedence.filter((s) => s !== "CATEGORY");
                        if (e.target.checked) list.splice(Math.max(0, list.indexOf("LEVEL")), 0, "CATEGORY");
                        set("ratePrecedence", list);
                      }}
                    />
                    Use category overrides (placed before the level rate; move it as needed)
                  </label>
                  {!hasCategory && <p className="mt-1 text-xs text-amber-700">Category overrides are stored but not applied while CATEGORY is not in this list.</p>}
                </FieldRow>
              </div>
            </div>
          </Panel>

          <Panel title="Withdrawals" subtitle="Limits, fee and payout methods for agent withdrawals (all amounts in ৳).">
            <div className="grid gap-5 p-5 md:grid-cols-2">
              <FieldRow label="Minimum withdrawal (৳)" error={errors.minWithdrawalAmount}>
                <div className="flex items-center gap-2">
                  <input className={inputCls(!!errors.minWithdrawalAmount)} inputMode="decimal" value={form.minWithdrawalAmount} onChange={(e) => set("minWithdrawalAmount", e.target.value)} placeholder="e.g. 500" />
                  <NotSet show={missing.has("minWithdrawalAmount")} />
                </div>
              </FieldRow>
              <FieldRow label="Maximum withdrawal (৳)" error={errors.maxWithdrawalAmount} hint="Per request; must be at least the minimum.">
                <div className="flex items-center gap-2">
                  <input className={inputCls(!!errors.maxWithdrawalAmount)} inputMode="decimal" value={form.maxWithdrawalAmount} onChange={(e) => set("maxWithdrawalAmount", e.target.value)} placeholder="e.g. 50000" />
                  <NotSet show={missing.has("maxWithdrawalAmount")} />
                </div>
              </FieldRow>
              <FieldRow label="Withdrawal fee" error={errors.withdrawalFee} hint={form.feeType === "FLAT" ? "Flat ৳ per withdrawal; must be smaller than the minimum." : form.feeType === "PERCENT" ? "Percent of the requested amount." : "No fee is charged."}>
                <div className="flex items-center gap-2">
                  <select className={`${inputCls(false)} w-40`} value={form.feeType} onChange={(e) => set("feeType", e.target.value as Form["feeType"])}>
                    <option value="NONE">No fee</option>
                    <option value="FLAT">Flat (৳)</option>
                    <option value="PERCENT">Percent (%)</option>
                  </select>
                  {form.feeType !== "NONE" && (
                    <input className={inputCls(!!errors.withdrawalFee)} inputMode="decimal" value={form.feeValue} onChange={(e) => set("feeValue", e.target.value)} placeholder={form.feeType === "FLAT" ? "৳" : "%"} />
                  )}
                  <NotSet show={missing.has("withdrawalFee")} />
                </div>
              </FieldRow>
              <FieldRow label="Auto-approve limit (৳)" error={errors.autoApproveWithdrawalLimit} hint="Requests up to this amount are approved automatically (paid manually). 0 = never.">
                <div className="flex items-center gap-2">
                  <input className={inputCls(!!errors.autoApproveWithdrawalLimit)} inputMode="decimal" value={form.autoApproveWithdrawalLimit} onChange={(e) => set("autoApproveWithdrawalLimit", e.target.value)} placeholder="e.g. 0" />
                  <NotSet show={missing.has("autoApproveWithdrawalLimit")} />
                </div>
              </FieldRow>
              <div className="md:col-span-2">
                <FieldRow label="Enabled payout methods" error={errors.enabledPayoutMethods}>
                  <div className="flex flex-wrap items-center gap-3">
                    {METHODS.map((m) => (
                      <label key={m.value} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700">
                        <input
                          type="checkbox"
                          className="size-4 accent-blue-600"
                          checked={form.enabledPayoutMethods.includes(m.value)}
                          onChange={(e) => set("enabledPayoutMethods", e.target.checked ? [...form.enabledPayoutMethods, m.value] : form.enabledPayoutMethods.filter((x) => x !== m.value))}
                        />
                        {m.label}
                      </label>
                    ))}
                    <NotSet show={missing.has("enabledPayoutMethods")} />
                  </div>
                </FieldRow>
              </div>
              {form.minWithdrawalAmount && form.maxWithdrawalAmount && (
                <p className="text-xs text-slate-500 md:col-span-2">
                  Agents will be able to request between <b>{bdt(form.minWithdrawalAmount)}</b> and <b>{bdt(form.maxWithdrawalAmount)}</b> per withdrawal.
                </p>
              )}
            </div>
          </Panel>

          <Panel title="Registration" subtitle="How new agents join.">
            <label className="flex items-center justify-between gap-4 p-5">
              <span>
                <span className="block text-sm font-semibold text-slate-700">New agent registrations need admin approval</span>
                <span className="block text-xs text-slate-500">When on, self-registered agents start as Pending until approved. If never saved, approval is required.</span>
              </span>
              <span className="flex items-center gap-2">
                <NotSet show={missing.has("registrationRequiresApproval")} />
                <input type="checkbox" className="size-5 accent-blue-600" checked={form.registrationRequiresApproval} onChange={(e) => set("registrationRequiresApproval", e.target.checked)} />
              </span>
            </label>
          </Panel>
        </div>

        <div className="space-y-6">
          <SettingHistory />
          <Panel title="How it is stored">
            <ul className="space-y-2 p-5 text-xs text-slate-500">
              <li className="flex gap-2">
                <History className="mt-0.5 size-3.5 shrink-0" /> Saved in the database and read with a 30-second cache; money operations always read the latest value.
              </li>
              <li className="flex gap-2">
                <History className="mt-0.5 size-3.5 shrink-0" /> Each commission keeps a copy of the rate and rules used, so later changes never alter past commissions.
              </li>
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}
