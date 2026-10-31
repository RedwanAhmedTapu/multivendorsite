"use client";

import { Fragment, useEffect, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useGetAgentAuditQuery, type AuditEntry } from "@/features/agentAdminApi";
import { AgentAdminHeader, Btn, Empty, Panel, Pill, fmtDateTime, tdCls, thCls, type Tone } from "@/components/agent-admin/AgentAdminUI";

const ENTITIES: Array<{ value: string; label: string }> = [
  { value: "", label: "Everything" },
  { value: "SETTING", label: "Settings" },
  { value: "LEVEL", label: "Levels" },
  { value: "OVERRIDE", label: "Rate overrides" },
  { value: "BONUS_RULE", label: "Bonus rules" },
  { value: "AGENT", label: "Agents" },
  { value: "VENDOR_LINK", label: "Vendor links" },
];
const ACTION_TONE: Record<string, Tone> = { CREATE: "green", UPDATE: "blue", DELETE: "red", DEACTIVATE: "amber", ACTIVATE: "green", STATUS: "violet" };

const show = (v: unknown) => (v === null || v === undefined ? "—" : typeof v === "string" ? v : JSON.stringify(v, null, 2));

/** Keys whose value differs between old and new (top level only). */
function changedKeys(e: AuditEntry): string[] {
  const o = (e.oldValue && typeof e.oldValue === "object" ? e.oldValue : {}) as Record<string, unknown>;
  const n = (e.newValue && typeof e.newValue === "object" ? e.newValue : {}) as Record<string, unknown>;
  const keys = new Set([...Object.keys(o), ...Object.keys(n)]);
  return [...keys].filter((k) => JSON.stringify(o[k]) !== JSON.stringify(n[k]));
}

export default function AgentAuditPage() {
  const [entity, setEntity] = useState("");
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);
  useEffect(() => setPage(1), [entity]);
  const { data, isLoading, isFetching } = useGetAgentAuditQuery({ entity: entity || undefined, page, limit: 25 });

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-6 sm:px-6">
      <AgentAdminHeader title="Audit log" subtitle="Every change to agent settings, levels, overrides, bonus rules, agents and vendor links — who, when, before and after." />
      <div className="mb-4 flex flex-wrap gap-2">
        {ENTITIES.map((e) => (
          <button
            key={e.value || "all"}
            onClick={() => setEntity(e.value)}
            className={`rounded-full border px-4 py-1.5 text-sm font-semibold ${entity === e.value ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
          >
            {e.label}
          </button>
        ))}
      </div>
      <Panel>
        {isLoading ? (
          <p className="p-6 text-sm text-slate-400">Loading…</p>
        ) : !data?.items.length ? (
          <Empty title="No changes recorded yet" />
        ) : (
          <div className={`overflow-x-auto ${isFetching ? "opacity-70" : ""}`}>
            <table className="w-full">
              <thead className="border-b border-slate-100 bg-slate-50/60">
                <tr>
                  <th className={thCls} />
                  <th className={thCls}>When</th>
                  <th className={thCls}>Area</th>
                  <th className={thCls}>Action</th>
                  <th className={thCls}>Item</th>
                  <th className={thCls}>Changed</th>
                  <th className={thCls}>By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.items.map((e) => {
                  const isOpen = expanded === e.id;
                  const keys = changedKeys(e);
                  return (
                    <Fragment key={e.id}>
                      <tr className="cursor-pointer hover:bg-slate-50/60" onClick={() => setExpanded(isOpen ? null : e.id)}>
                        <td className={`${tdCls} w-8`}>{isOpen ? <ChevronDown className="size-4 text-slate-400" /> : <ChevronRight className="size-4 text-slate-400" />}</td>
                        <td className={`${tdCls} whitespace-nowrap text-xs`}>{fmtDateTime(e.createdAt)}</td>
                        <td className={tdCls}>{ENTITIES.find((x) => x.value === e.entity)?.label ?? e.entity}</td>
                        <td className={tdCls}>
                          <Pill tone={ACTION_TONE[e.action] ?? "slate"}>{e.action}</Pill>
                        </td>
                        <td className={`${tdCls} max-w-48 truncate font-mono text-xs`}>{e.entityId}</td>
                        <td className={`${tdCls} max-w-64 truncate text-xs text-slate-500`}>{keys.slice(0, 4).join(", ") || "—"}{keys.length > 4 ? ` +${keys.length - 4}` : ""}</td>
                        <td className={`${tdCls} whitespace-nowrap text-xs`}>{e.actorName ?? e.actorUserId}</td>
                      </tr>
                      {isOpen && (
                        <tr className="bg-slate-50/60">
                          <td />
                          <td colSpan={6} className="px-4 pb-4">
                            <div className="grid gap-3 md:grid-cols-2">
                              <div>
                                <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">Before</p>
                                <pre className="max-h-72 overflow-auto rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-700">{show(e.oldValue)}</pre>
                              </div>
                              <div>
                                <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">After</p>
                                <pre className="max-h-72 overflow-auto rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-700">{show(e.newValue)}</pre>
                              </div>
                            </div>
                            {e.ip && <p className="mt-2 text-xs text-slate-400">IP: {e.ip}</p>}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
            <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
              <span>{data.total} change(s)</span>
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
    </div>
  );
}
