"use client";

// Payable to agents (Phase 8–9 extras): what FinixMart owes agents, from the
// agents' wallets. Available + on hold is owed now; pending clearance is owed
// once the hold period passes. Negative balances (a refunded return after a
// withdrawal) are offset by the agent's future earnings.

import { useState } from "react";
import Link from "next/link";
import { apiErrorMessage, useAgentPayableReportQuery } from "@/features/agentAdminApi";
import { AgentAdminHeader, Btn, Empty, Panel, Pill, STATUS_TONE, bdt, fmtDateTime, tdCls, thCls } from "@/components/agent-admin/AgentAdminUI";

export default function AgentPayablesPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error } = useAgentPayableReportQuery({ page, limit: 25 });

  const cards: Array<[string, string | undefined, string]> = [
    ["Total owed", data?.totals.totalOwed, "Available + on hold + pending clearance"],
    ["Available to withdraw", data?.totals.availableToWithdraw, "Positive balances agents can request"],
    ["On hold", data?.totals.onHold, "In withdrawals not yet paid"],
    ["Pending clearance", data?.totals.pendingClearance, "Still in the hold period"],
    ["Negative balances", data?.totals.negativeBalances, "Offset by the agents' future earnings"],
  ];

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-6 sm:px-6">
      <AgentAdminHeader title="Payable to agents" subtitle="What FinixMart owes its agents right now, per agent. All amounts in ৳." />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map(([label, value, hint]) => (
          <Panel key={label}>
            <div className="p-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
              <p className="mt-1 text-xl font-extrabold tabular-nums text-slate-800">{bdt(value ?? "0")}</p>
              <p className="text-[11px] text-slate-400">{hint}</p>
            </div>
          </Panel>
        ))}
      </div>

      <Panel>
        {isError ? (
          <p className="p-6 text-sm text-red-600">{apiErrorMessage(error)}</p>
        ) : isLoading ? (
          <p className="p-6 text-sm text-slate-400">Loading…</p>
        ) : !data?.items.length ? (
          <Empty title="Nothing owed" text="Agents' balances appear here once commission is earned." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-100 bg-slate-50/60">
                <tr>
                  <th className={thCls}>Agent</th>
                  <th className={`${thCls} text-right`}>Available</th>
                  <th className={`${thCls} text-right`}>On hold</th>
                  <th className={`${thCls} text-right`}>Pending</th>
                  <th className={`${thCls} text-right`}>Withdrawn to date</th>
                  <th className={thCls}>Last synced</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.items.map((r) => (
                  <tr key={r.agentId}>
                    <td className={tdCls}>
                      <Link href={`/admin-dashboard/agents/${r.agentId}`} className="font-semibold text-blue-700 hover:underline">
                        {r.name}
                      </Link>
                      <span className="ml-2 text-[11px] text-slate-400">{r.agentCode}</span>
                      {r.status && r.status !== "ACTIVE" && (
                        <span className="ml-2">
                          <Pill tone={STATUS_TONE[r.status] ?? "slate"}>{r.status.toLowerCase()}</Pill>
                        </span>
                      )}
                    </td>
                    <td className={`${tdCls} text-right font-bold tabular-nums ${Number(r.available) < 0 ? "text-red-600" : ""}`}>{bdt(r.available)}</td>
                    <td className={`${tdCls} text-right tabular-nums`}>{bdt(r.onHold)}</td>
                    <td className={`${tdCls} text-right tabular-nums`}>{bdt(r.pendingClearance)}</td>
                    <td className={`${tdCls} text-right tabular-nums text-slate-500`}>{bdt(r.totalWithdrawn)}</td>
                    <td className={`${tdCls} whitespace-nowrap text-xs text-slate-500`}>{fmtDateTime(r.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm text-slate-500">
              <span className="text-xs">{data.asOf}</span>
              <div className="flex gap-2">
                <Btn variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  Previous
                </Btn>
                <Btn variant="outline" disabled={page * data.limit >= data.total} onClick={() => setPage(page + 1)}>
                  Next
                </Btn>
              </div>
            </div>
          </div>
        )}
      </Panel>
    </div>
  );
}
