"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Calculator, Plus, Search } from "lucide-react";
import {
  apiErrorMessage,
  apiFieldErrors,
  useAgentRatePreviewQuery,
  useCreateAgentOverrideMutation,
  useEndAgentOverrideMutation,
  useGetAgentSettingsQuery,
  useListAgentOverridesQuery,
  useLookupAgentCategoriesQuery,
  useLookupAgentVendorsQuery,
  useLookupAgentsQuery,
} from "@/features/agentAdminApi";
import { AgentAdminHeader, Btn, Empty, FieldRow, Modal, Panel, Pill, fmtDate, inputCls, pct, tdCls, thCls } from "@/components/agent-admin/AgentAdminUI";

type Scope = "VENDOR" | "AGENT" | "CATEGORY";
const SCOPE_LABEL: Record<Scope, string> = { VENDOR: "Vendor", AGENT: "Agent", CATEGORY: "Category" };

function useDebounced(v: string, ms = 300) {
  const [d, setD] = useState(v);
  useEffect(() => {
    const t = setTimeout(() => setD(v), ms);
    return () => clearTimeout(t);
  }, [v, ms]);
  return d;
}

/** Search-and-pick for a vendor, agent or category. */
function TargetPicker({ scope, value, onPick }: { scope: Scope; value: { id: string; label: string } | null; onPick: (v: { id: string; label: string } | null) => void }) {
  const [q, setQ] = useState("");
  const dq = useDebounced(q);
  const vendors = useLookupAgentVendorsQuery(dq, { skip: scope !== "VENDOR" });
  const agents = useLookupAgentsQuery(dq, { skip: scope !== "AGENT" });
  const cats = useLookupAgentCategoriesQuery(dq, { skip: scope !== "CATEGORY" });
  const options =
    scope === "VENDOR"
      ? (vendors.data ?? []).map((v) => ({ id: v.id, label: v.storeName, sub: v.currentAgent ? `Agent: ${v.currentAgent.name}` : "No agent" }))
      : scope === "AGENT"
        ? (agents.data ?? []).map((a) => ({ id: a.id, label: a.name, sub: `${a.agentCode} · ${a.status}` }))
        : (cats.data ?? []).map((c) => ({ id: c.id, label: c.name, sub: c.parent ? `in ${c.parent.name}` : "Top level" }));
  if (value) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm">
        <span className="font-semibold text-blue-800">{value.label}</span>
        <button className="text-xs font-semibold text-blue-700 hover:underline" onClick={() => onPick(null)}>
          Change
        </button>
      </div>
    );
  }
  return (
    <div>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <input className={`${inputCls(false)} pl-9`} value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${SCOPE_LABEL[scope].toLowerCase()}…`} />
      </div>
      <ul className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-slate-100">
        {options.map((o) => (
          <li key={o.id}>
            <button className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-50" onClick={() => onPick({ id: o.id, label: o.label })}>
              <span className="font-medium text-slate-700">{o.label}</span>
              <span className="text-xs text-slate-400">{o.sub}</span>
            </button>
          </li>
        ))}
        {options.length === 0 && <li className="px-3 py-3 text-xs text-slate-400">No matches</li>}
      </ul>
    </div>
  );
}

function RatePreview() {
  const [vendor, setVendor] = useState<{ id: string; label: string } | null>(null);
  const [agent, setAgent] = useState<{ id: string; label: string } | null>(null);
  const [category, setCategory] = useState<{ id: string; label: string } | null>(null);
  const ready = !!vendor || !!agent;
  const { data, error, isFetching } = useAgentRatePreviewQuery({ vendorId: vendor?.id, agentId: agent?.id, categoryId: category?.id }, { skip: !ready });
  return (
    <Panel title="Rate preview" subtitle="Runs the real resolver with today's settings, levels and overrides.">
      <div className="grid gap-4 p-5 md:grid-cols-3">
        <FieldRow label="Vendor">
          <TargetPicker scope="VENDOR" value={vendor} onPick={setVendor} />
        </FieldRow>
        <FieldRow label="Agent (optional if the vendor has one)">
          <TargetPicker scope="AGENT" value={agent} onPick={setAgent} />
        </FieldRow>
        <FieldRow label="Product category (optional)">
          <TargetPicker scope="CATEGORY" value={category} onPick={setCategory} />
        </FieldRow>
      </div>
      <div className="border-t border-slate-100 px-5 py-4">
        {!ready ? (
          <p className="text-sm text-slate-400">Pick a vendor or an agent.</p>
        ) : isFetching ? (
          <p className="text-sm text-slate-400">Resolving…</p>
        ) : error ? (
          <p className="text-sm text-red-600">{apiErrorMessage(error)}</p>
        ) : data ? (
          <div className="space-y-3">
            {data.resolution.status === "RESOLVED" ? (
              <p className="text-sm">
                Commission rate: <b className="text-lg text-blue-700">{pct(data.resolution.ratePercent)}</b> from <Pill tone="blue">{data.resolution.source}</Pill>
              </p>
            ) : (
              <p className="text-sm font-semibold text-amber-700">Not configured: {data.resolution.reason}</p>
            )}
            <ol className="space-y-1 text-xs text-slate-500">
              {data.resolution.trace.map((t, i) => (
                <li key={i}>
                  <b className={t.outcome === "USED" ? "text-emerald-700" : "text-slate-600"}>{t.source}</b> — {t.detail}
                </li>
              ))}
            </ol>
            {!data.agentId && <p className="text-xs text-amber-700">This vendor isn&apos;t linked to an agent, so agent and level rates can&apos;t apply.</p>}
          </div>
        ) : null}
      </div>
    </Panel>
  );
}

export default function AgentOverridesPage() {
  const [scope, setScope] = useState<Scope>("VENDOR");
  const [active, setActive] = useState<"true" | "">("true");
  const [page, setPage] = useState(1);
  const { data, isLoading } = useListAgentOverridesQuery({ scope, active, page, limit: 20 });
  const { data: settings } = useGetAgentSettingsQuery();
  const [create, { isLoading: creating }] = useCreateAgentOverrideMutation();
  const [end] = useEndAgentOverrideMutation();
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<{ id: string; label: string } | null>(null);
  const [rate, setRate] = useState("");
  const [effectiveTo, setEffectiveTo] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [replaceOffer, setReplaceOffer] = useState(false);

  useEffect(() => setPage(1), [scope, active]);
  const categoryInactive = scope === "CATEGORY" && settings && !settings.values.ratePrecedence?.includes("CATEGORY");

  const reset = () => {
    setTarget(null);
    setRate("");
    setEffectiveTo("");
    setNote("");
    setErrors({});
    setReplaceOffer(false);
  };

  async function submit(replaceExisting = false) {
    if (!target) {
      setErrors({ targetId: `Choose a ${SCOPE_LABEL[scope].toLowerCase()}` });
      return;
    }
    setErrors({});
    try {
      await create({
        scope,
        targetId: target.id,
        ratePercent: rate.trim(),
        effectiveTo: effectiveTo ? new Date(`${effectiveTo}T23:59:59+06:00`).toISOString() : null,
        note: note.trim() || undefined,
        replaceExisting,
      }).unwrap();
      toast.success(replaceExisting ? "Override replaced" : "Override created");
      setOpen(false);
      reset();
    } catch (err) {
      const code = (err as { data?: { code?: string } })?.data?.code;
      if (code === "OVERRIDE_EXISTS") {
        setReplaceOffer(true);
        return;
      }
      setErrors(apiFieldErrors(err));
      toast.error(apiErrorMessage(err, "Could not save the override"));
    }
  }

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-6 sm:px-6">
      <AgentAdminHeader
        title="Rate overrides"
        subtitle="Special commission rates for a vendor, an agent or a product category. A rate never changes in place — a new rate ends the old one."
        actions={
          <Btn
            onClick={() => {
              reset();
              setOpen(true);
            }}
          >
            <Plus className="size-4" /> New {SCOPE_LABEL[scope].toLowerCase()} override
          </Btn>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {(["VENDOR", "AGENT", "CATEGORY"] as Scope[]).map((s) => (
          <button key={s} onClick={() => setScope(s)} className={`rounded-full border px-4 py-1.5 text-sm font-semibold ${scope === s ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-600"}`}>
            {SCOPE_LABEL[s]}
          </button>
        ))}
        <label className="ml-auto inline-flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" className="size-4 accent-blue-600" checked={active === "true"} onChange={(e) => setActive(e.target.checked ? "true" : "")} /> Active only
        </label>
      </div>

      {categoryInactive && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Category overrides are saved but <b>not applied</b> until CATEGORY is added to the rate precedence on the Settings page.
        </div>
      )}

      <Panel>
        {isLoading ? (
          <p className="p-6 text-sm text-slate-400">Loading…</p>
        ) : !data?.items.length ? (
          <Empty title={`No ${active ? "active " : ""}${SCOPE_LABEL[scope].toLowerCase()} overrides`} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-100 bg-slate-50/60">
                <tr>
                  <th className={thCls}>{SCOPE_LABEL[scope]}</th>
                  <th className={thCls}>Rate</th>
                  <th className={thCls}>From</th>
                  <th className={thCls}>Until</th>
                  <th className={thCls}>Status</th>
                  <th className={thCls}>Note</th>
                  <th className={thCls} />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.items.map((o) => (
                  <tr key={o.id}>
                    <td className={`${tdCls} font-semibold`}>{o.targetName ?? o.vendorId ?? o.agentId ?? o.categoryId}</td>
                    <td className={`${tdCls} font-bold text-blue-700`}>{pct(o.ratePercent)}</td>
                    <td className={tdCls}>{fmtDate(o.effectiveFrom)}</td>
                    <td className={tdCls}>{o.effectiveTo ? fmtDate(o.effectiveTo) : "Open-ended"}</td>
                    <td className={tdCls}>{o.isActive ? <Pill tone="green">Active</Pill> : <Pill>Ended {fmtDate(o.endedAt)}</Pill>}</td>
                    <td className={`${tdCls} max-w-56 truncate text-xs text-slate-500`}>{o.note ?? ""}</td>
                    <td className={`${tdCls} text-right`}>
                      {o.isActive && (
                        <Btn
                          variant="outline"
                          onClick={async () => {
                            if (!confirm("End this override now? Commissions created from now on won't use it.")) return;
                            try {
                              await end({ id: o.id }).unwrap();
                              toast.success("Override ended");
                            } catch (err) {
                              toast.error(apiErrorMessage(err));
                            }
                          }}
                        >
                          End
                        </Btn>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
              <span>{data.total} override(s)</span>
              <span className="flex gap-2">
                <Btn variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  Previous
                </Btn>
                <Btn variant="outline" disabled={page * data.limit >= data.total} onClick={() => setPage(page + 1)}>
                  Next
                </Btn>
              </span>
            </div>
          </div>
        )}
      </Panel>

      <div className="mt-6">
        <RatePreview />
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`New ${SCOPE_LABEL[scope].toLowerCase()} override`}
        footer={
          replaceOffer ? (
            <>
              <Btn variant="outline" onClick={() => setReplaceOffer(false)}>
                Keep the current one
              </Btn>
              <Btn variant="danger" onClick={() => submit(true)} loading={creating}>
                End it and use the new rate
              </Btn>
            </>
          ) : (
            <>
              <Btn variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Btn>
              <Btn onClick={() => submit(false)} loading={creating}>
                <Calculator className="size-4" /> Save override
              </Btn>
            </>
          )
        }
      >
        <div className="space-y-4">
          <FieldRow label={SCOPE_LABEL[scope]} error={errors.targetId}>
            <TargetPicker scope={scope} value={target} onPick={setTarget} />
          </FieldRow>
          <FieldRow label="Commission rate (%)" error={errors.ratePercent} hint="0–100, up to 4 decimals">
            <input className={inputCls(!!errors.ratePercent)} inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="e.g. 7.5" />
          </FieldRow>
          <FieldRow label="Ends on (optional)" error={errors.effectiveTo} hint="Starts immediately. Leave empty for open-ended.">
            <input type="date" className={inputCls(!!errors.effectiveTo)} value={effectiveTo} onChange={(e) => setEffectiveTo(e.target.value)} />
          </FieldRow>
          <FieldRow label="Note (optional)" error={errors.note}>
            <input className={inputCls(!!errors.note)} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Why this rate?" />
          </FieldRow>
          {replaceOffer && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              This {SCOPE_LABEL[scope].toLowerCase()} already has an active override. Replace it? The current one will be ended now (its history is kept).
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
}
