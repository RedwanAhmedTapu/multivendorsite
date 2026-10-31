"use client";

// Agent withdrawals (Phase 7). Payouts are manual: the admin sends the money
// by bKash / Nagad / bank outside FinixMart, then records the reference here.
// Approve → Mark paid (transaction reference required); Reject releases the
// held amount back to the agent's balance. Every action is audited server-side.

import { useEffect, useState } from "react";
import { CheckCircle2, Copy, Landmark, XCircle } from "lucide-react";
import {
  apiErrorMessage,
  useAgentWithdrawalActionMutation,
  useGetAgentWithdrawalQuery,
  useListAgentWithdrawalsQuery,
  useLookupAgentsQuery,
  type AdminWithdrawalStatus,
} from "@/features/agentAdminApi";
import { AgentAdminHeader, Btn, Empty, FieldRow, Modal, Panel, Pill, bdt, fmtDateTime, inputCls, tdCls, thCls, type Tone } from "@/components/agent-admin/AgentAdminUI";

const STATUSES: Array<{ value: AdminWithdrawalStatus | ""; label: string }> = [
  { value: "REQUESTED", label: "Requested" },
  { value: "APPROVED", label: "Approved" },
  { value: "PAID", label: "Paid" },
  { value: "REJECTED", label: "Rejected" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "", label: "All" },
];
const TONE: Record<AdminWithdrawalStatus, Tone> = { REQUESTED: "amber", APPROVED: "blue", PAID: "green", REJECTED: "red", CANCELLED: "slate" };

export default function AgentWithdrawalsPage() {
  const [status, setStatus] = useState<AdminWithdrawalStatus | "">("REQUESTED");
  const [agentId, setAgentId] = useState("");
  const [agentQ, setAgentQ] = useState("");
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string | null>(null);
  useEffect(() => setPage(1), [status, agentId]);

  const { data, isLoading, isFetching, isError, error } = useListAgentWithdrawalsQuery({ status: status || undefined, agentId: agentId || undefined, page, limit: 25 });
  const agents = useLookupAgentsQuery(agentQ);

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-6 sm:px-6">
      <AgentAdminHeader
        title="Agent withdrawals"
        subtitle="Approve, reject or record payment of agents' withdrawal requests. Send the money outside FinixMart, then mark it paid with the transaction reference."
      />

      {data && (
        <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(["REQUESTED", "APPROVED", "PAID", "REJECTED"] as AdminWithdrawalStatus[]).map((s) => (
            <Panel key={s}>
              <div className="p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{STATUSES.find((x) => x.value === s)?.label}</p>
                <p className="mt-1 text-xl font-extrabold tabular-nums text-slate-800">{bdt(data.summary[s]?.amount ?? "0")}</p>
                <p className="text-xs text-slate-500">{data.summary[s]?.count ?? 0} request(s)</p>
              </div>
            </Panel>
          ))}
        </div>
      )}

      <Panel className="mb-4">
        <div className="flex flex-wrap items-end gap-3 p-4">
          <div className="flex flex-wrap gap-1 rounded-lg bg-slate-100 p-1" role="tablist" aria-label="Status">
            {STATUSES.map((s) => (
              <button
                key={s.label}
                role="tab"
                aria-selected={status === s.value}
                onClick={() => setStatus(s.value)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold ${status === s.value ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <label className="min-w-56 flex-1 text-xs font-semibold text-slate-500 sm:max-w-sm">
            Agent
            <div className="mt-1 flex gap-2">
              <input className={inputCls()} placeholder="Search agents" value={agentQ} onChange={(e) => setAgentQ(e.target.value)} aria-label="Search agents" />
              <select className={inputCls()} value={agentId} onChange={(e) => setAgentId(e.target.value)} aria-label="Agent">
                <option value="">All agents</option>
                {(agents.data ?? []).map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.agentCode})
                  </option>
                ))}
              </select>
            </div>
          </label>
        </div>
      </Panel>

      <Panel>
        {isError ? (
          <p className="p-6 text-sm text-red-600">{apiErrorMessage(error)}</p>
        ) : isLoading ? (
          <p className="p-6 text-sm text-slate-400">Loading…</p>
        ) : !data?.items.length ? (
          <Empty title="No withdrawals here" text="Agents request withdrawals from their wallet in the agent portal." />
        ) : (
          <div className={`overflow-x-auto ${isFetching ? "opacity-70" : ""}`}>
            <table className="w-full">
              <thead className="border-b border-slate-100 bg-slate-50/60">
                <tr>
                  <th className={thCls}>Request</th>
                  <th className={thCls}>Agent</th>
                  <th className={`${thCls} text-right`}>Amount</th>
                  <th className={`${thCls} text-right`}>Fee</th>
                  <th className={`${thCls} text-right`}>To pay</th>
                  <th className={thCls}>Method</th>
                  <th className={thCls}>Status</th>
                  <th className={thCls}>Requested</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.items.map((w) => (
                  <tr key={w.id} className="cursor-pointer hover:bg-slate-50" onClick={() => setOpenId(w.id)}>
                    <td className={`${tdCls} font-mono text-xs`}>{w.ref}</td>
                    <td className={tdCls}>
                      {w.agent?.name ?? "—"}
                      <span className="block text-[11px] text-slate-400">
                        {w.agent?.agentCode ?? ""}
                        {w.agent?.status && w.agent.status !== "ACTIVE" ? ` · ${w.agent.status.toLowerCase()}` : ""}
                      </span>
                    </td>
                    <td className={`${tdCls} text-right tabular-nums`}>{bdt(w.amount)}</td>
                    <td className={`${tdCls} text-right tabular-nums text-slate-500`}>{bdt(w.fee)}</td>
                    <td className={`${tdCls} text-right font-bold tabular-nums`}>{bdt(w.netAmount)}</td>
                    <td className={tdCls}>
                      {w.method.label}
                      <span className="block text-[11px] text-slate-400">{w.method.accountNumberMasked}</span>
                    </td>
                    <td className={tdCls}>
                      <Pill tone={TONE[w.status]}>{w.status.toLowerCase()}</Pill>
                      {w.autoApproved && <span className="block text-[11px] text-slate-400">auto-approved</span>}
                    </td>
                    <td className={`${tdCls} whitespace-nowrap`}>{fmtDateTime(w.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm text-slate-500">
              <span>
                {data.total} withdrawal{data.total === 1 ? "" : "s"}
              </span>
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

      {openId && <WithdrawalDialog id={openId} onClose={() => setOpenId(null)} />}
    </div>
  );
}

function WithdrawalDialog({ id, onClose }: { id: string; onClose: () => void }) {
  const { data: w, isLoading, isError, error } = useGetAgentWithdrawalQuery(id);
  const [act, acting] = useAgentWithdrawalActionMutation();
  const [mode, setMode] = useState<"view" | "reject" | "paid">("view");
  const [reason, setReason] = useState("");
  const [transactionRef, setTransactionRef] = useState("");
  const [note, setNote] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  async function run(body: Parameters<typeof act>[0]) {
    setActionError(null);
    try {
      await act(body).unwrap();
      onClose();
    } catch (err) {
      setActionError(apiErrorMessage(err, "The action failed"));
    }
  }

  const agentActive = w?.agent?.status === "ACTIVE";
  const footer = !w ? null : mode === "reject" ? (
    <>
      <Btn variant="outline" onClick={() => setMode("view")}>
        Back
      </Btn>
      <Btn variant="danger" loading={acting.isLoading} disabled={reason.trim().length < 3} onClick={() => run({ id, action: "reject", reason: reason.trim() })}>
        Reject and release ৳{w.amount}
      </Btn>
    </>
  ) : mode === "paid" ? (
    <>
      <Btn variant="outline" onClick={() => setMode("view")}>
        Back
      </Btn>
      <Btn
        variant="success"
        loading={acting.isLoading}
        disabled={transactionRef.trim().length < 3}
        onClick={() => run({ id, action: "mark-paid", transactionRef: transactionRef.trim(), note: note.trim() || undefined })}
      >
        Confirm paid
      </Btn>
    </>
  ) : (
    <>
      {(w.status === "REQUESTED" || w.status === "APPROVED") && (
        <Btn variant="outline" onClick={() => setMode("reject")}>
          <XCircle className="size-4" /> Reject
        </Btn>
      )}
      {w.status === "REQUESTED" && (
        <Btn loading={acting.isLoading} disabled={!agentActive} onClick={() => run({ id, action: "approve" })}>
          <CheckCircle2 className="size-4" /> Approve
        </Btn>
      )}
      {w.status === "APPROVED" && (
        <Btn variant="success" disabled={!agentActive} onClick={() => setMode("paid")}>
          <Landmark className="size-4" /> Mark paid
        </Btn>
      )}
    </>
  );

  return (
    <Modal open onClose={onClose} title={w ? `Withdrawal ${w.ref}` : "Withdrawal"} footer={footer} wide>
      {isError ? (
        <p className="text-sm text-red-600">{apiErrorMessage(error)}</p>
      ) : isLoading || !w ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-slate-800">{w.agent?.name ?? "—"}</p>
              <p className="text-xs text-slate-500">
                {w.agent?.agentCode} · {w.agent?.email}
                {w.agent?.phone ? ` · ${w.agent.phone}` : ""}
              </p>
            </div>
            <Pill tone={TONE[w.status]}>{w.status.toLowerCase()}</Pill>
          </div>
          {!agentActive && (w.status === "REQUESTED" || w.status === "APPROVED") && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              This agent is {w.agent?.status?.toLowerCase() ?? "not active"}. Approving and paying are blocked until the agent is reactivated; you can still reject.
            </p>
          )}

          <dl className="grid grid-cols-3 gap-3 rounded-xl bg-slate-50 p-4 text-sm">
            <div>
              <dt className="text-[11px] font-bold uppercase text-slate-400">Requested</dt>
              <dd className="font-bold tabular-nums">{bdt(w.amount)}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-bold uppercase text-slate-400">Fee</dt>
              <dd className="tabular-nums">{bdt(w.fee)}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-bold uppercase text-slate-400">Send to agent</dt>
              <dd className="text-lg font-extrabold tabular-nums text-emerald-700">{bdt(w.netAmount)}</dd>
            </div>
          </dl>

          <div>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Pay to</h3>
            <div className="space-y-1 rounded-xl border border-slate-200 p-4 text-sm">
              <p>
                <span className="font-semibold">{w.method.label}</span> · {w.method.accountName}
              </p>
              <p className="flex items-center gap-2 font-mono">
                {w.method.accountNumber ?? w.method.accountNumberMasked}
                {w.method.accountNumber && (
                  <button className="text-slate-400 hover:text-slate-700" aria-label="Copy account number" onClick={() => navigator.clipboard?.writeText(w.method.accountNumber ?? "")}>
                    <Copy className="size-3.5" />
                  </button>
                )}
              </p>
              {w.method.bankName && (
                <p className="text-xs text-slate-500">
                  {w.method.bankName}
                  {w.method.branch ? ` · ${w.method.branch}` : ""}
                  {w.method.routingNumber ? ` · routing ${w.method.routingNumber}` : ""}
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-3 text-xs text-slate-500 sm:grid-cols-2">
            <p>Requested {fmtDateTime(w.createdAt)}</p>
            {w.reviewedAt && <p>{w.autoApproved ? "Auto-approved" : "Reviewed"} {fmtDateTime(w.reviewedAt)}</p>}
            {w.paidAt && (
              <p>
                Paid {fmtDateTime(w.paidAt)} · ref <span className="font-mono">{w.transactionRef}</span>
              </p>
            )}
            {w.rejectReason && <p className="text-red-600">Rejected: {w.rejectReason}</p>}
            {w.wallet && (
              <p>
                Agent balance now: {bdt(w.wallet.available)} available · {bdt(w.wallet.onHold)} on hold
              </p>
            )}
          </div>

          {mode === "reject" && (
            <FieldRow label="Reason (shown to the agent)" htmlFor="wd-reason">
              <textarea id="wd-reason" className={`${inputCls()} h-20 py-2`} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} />
            </FieldRow>
          )}
          {mode === "paid" && (
            <div className="space-y-3">
              <FieldRow label="Transaction reference" hint="The bKash / Nagad TrxID or bank reference of the payment you sent." htmlFor="wd-ref">
                <input id="wd-ref" className={inputCls()} value={transactionRef} onChange={(e) => setTransactionRef(e.target.value)} maxLength={120} />
              </FieldRow>
              <FieldRow label="Note (optional)" htmlFor="wd-note">
                <input id="wd-note" className={inputCls()} value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />
              </FieldRow>
            </div>
          )}
          {actionError && <p className="text-sm text-red-600">{actionError}</p>}
        </div>
      )}
    </Modal>
  );
}
