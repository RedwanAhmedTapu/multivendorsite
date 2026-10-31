"use client";

// Agent commissions (Phase 6): every commission row the engine wrote, with
// filters by agent, vendor, status and date (Asia/Dhaka days). Amounts in ৳,
// net of reversals. The base is FinixMart's own commission on the line.

import { useEffect, useState } from "react";
import { Download, Loader2, RefreshCw } from "lucide-react";
import {
  apiErrorMessage,
  useLazyExportAgentCommissionsQuery,
  useListAgentCommissionsQuery,
  useLookupAgentVendorsQuery,
  useLookupAgentsQuery,
  useRerunAgentAccrualMutation,
  type AdminCommissionQuery,
  type AdminCommissionStatus,
} from "@/features/agentAdminApi";
import { AgentAdminHeader, Btn, Empty, Panel, Pill, bdt, fmtDate, inputCls, pct, tdCls, thCls, type Tone } from "@/components/agent-admin/AgentAdminUI";

const STATUSES: Array<{ value: "ALL" | AdminCommissionStatus; label: string }> = [
  { value: "ALL", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "AVAILABLE", label: "Available" },
  { value: "PARTIALLY_REVERSED", label: "Partly reversed" },
  { value: "REVERSED", label: "Reversed" },
];
const STATUS_TONE: Record<AdminCommissionStatus, Tone> = { PENDING: "amber", AVAILABLE: "green", PARTIALLY_REVERSED: "violet", REVERSED: "red" };
const STATUS_LABEL: Record<AdminCommissionStatus, string> = { PENDING: "Pending", AVAILABLE: "Available", PARTIALLY_REVERSED: "Partly reversed", REVERSED: "Reversed" };

function download(text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `finixmart-agent-commissions-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function AgentCommissionsPage() {
  const [status, setStatus] = useState<"ALL" | AdminCommissionStatus>("ALL");
  const [agentId, setAgentId] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [agentQ, setAgentQ] = useState("");
  const [vendorQ, setVendorQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [exportError, setExportError] = useState<string | null>(null);
  useEffect(() => setPage(1), [status, agentId, vendorId, from, to]);

  const badRange = !!from && !!to && from > to;
  const filters: AdminCommissionQuery = { status, agentId: agentId || undefined, vendorId: vendorId || undefined, from: from || undefined, to: to || undefined };
  const { data, isLoading, isFetching, isError, error } = useListAgentCommissionsQuery({ ...filters, page, limit: 25 }, { skip: badRange });
  const agents = useLookupAgentsQuery(agentQ);
  const vendors = useLookupAgentVendorsQuery(vendorQ);
  const [exportCsv, exporting] = useLazyExportAgentCommissionsQuery();

  async function onExport() {
    setExportError(null);
    try {
      download(await exportCsv(filters).unwrap());
    } catch (err) {
      setExportError(apiErrorMessage(err, "Export failed"));
    }
  }

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-6 sm:px-6">
      <AgentAdminHeader
        title="Agent commissions"
        subtitle="Commission earned by agents on delivered orders — a share of FinixMart's own commission on each line, net of reversals from refunded returns."
        actions={
          <Btn onClick={onExport} disabled={exporting.isFetching || badRange}>
            {exporting.isFetching ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
            Export CSV
          </Btn>
        }
      />

      <Panel className="mb-4">
        <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
          <label className="text-xs font-semibold text-slate-500">
            Agent
            <input className={inputCls()} placeholder="Search agents" value={agentQ} onChange={(e) => setAgentQ(e.target.value)} aria-label="Search agents" />
            <select className={`${inputCls()} mt-1`} value={agentId} onChange={(e) => setAgentId(e.target.value)} aria-label="Agent">
              <option value="">All agents</option>
              {(agents.data ?? []).map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.agentCode})
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-500">
            Vendor
            <input className={inputCls()} placeholder="Search vendors" value={vendorQ} onChange={(e) => setVendorQ(e.target.value)} aria-label="Search vendors" />
            <select className={`${inputCls()} mt-1`} value={vendorId} onChange={(e) => setVendorId(e.target.value)} aria-label="Vendor">
              <option value="">All vendors</option>
              {(vendors.data ?? []).map((v) => (
                <option key={v.id} value={v.id}>
                  {v.storeName}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-500">
            Status
            <select className={inputCls()} value={status} onChange={(e) => setStatus(e.target.value as typeof status)} aria-label="Status">
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-500">
            Earned from
            <input type="date" className={inputCls()} value={from} onChange={(e) => setFrom(e.target.value)} aria-label="From date" />
          </label>
          <label className="text-xs font-semibold text-slate-500">
            Earned to
            <input type="date" className={inputCls(badRange)} value={to} onChange={(e) => setTo(e.target.value)} aria-label="To date" />
          </label>
        </div>
        {badRange && <p className="px-4 pb-3 text-xs text-red-600">The start date must be on or before the end date.</p>}
        {exportError && <p className="px-4 pb-3 text-xs text-red-600">{exportError}</p>}
      </Panel>

      {data && (
        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          {[
            ["Earned", data.totals.earned],
            ["Reversed", data.totals.reversed],
            ["Net", data.totals.net],
          ].map(([label, value]) => (
            <Panel key={label}>
              <div className="p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label} (filtered)</p>
                <p className="mt-1 text-xl font-extrabold tabular-nums text-slate-800">{bdt(value)}</p>
              </div>
            </Panel>
          ))}
        </div>
      )}

      <RerunAccrualPanel />

      <Panel>
        {isError ? (
          <p className="p-6 text-sm text-red-600">{apiErrorMessage(error)}</p>
        ) : isLoading ? (
          <p className="p-6 text-sm text-slate-400">Loading…</p>
        ) : !data?.items.length ? (
          <Empty title="No commissions match" text="Commissions are created when an attributed vendor's order is delivered." />
        ) : (
          <div className={`overflow-x-auto ${isFetching ? "opacity-70" : ""}`}>
            <table className="w-full">
              <thead className="border-b border-slate-100 bg-slate-50/60">
                <tr>
                  <th className={thCls}>ID</th>
                  <th className={thCls}>Agent</th>
                  <th className={thCls}>Order · vendor</th>
                  <th className={`${thCls} text-right`}>FinixMart commission</th>
                  <th className={`${thCls} text-right`}>Rate</th>
                  <th className={`${thCls} text-right`}>Agent earned</th>
                  <th className={thCls}>Status</th>
                  <th className={thCls}>Earned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.items.map((c) => (
                  <tr key={c.id}>
                    <td className={`${tdCls} font-mono text-xs`}>{c.ref}</td>
                    <td className={tdCls}>
                      {c.agentName}
                      <span className="block text-[11px] text-slate-400">
                        {c.agentCode ?? ""}
                        {c.levelName ? ` · ${c.levelName}` : ""}
                      </span>
                    </td>
                    <td className={tdCls}>
                      {c.orderNumber ?? "—"}
                      <span className="block text-[11px] text-slate-400">
                        {c.storeName} · {c.quantity} unit{c.quantity === 1 ? "" : "s"}
                      </span>
                    </td>
                    <td className={`${tdCls} text-right tabular-nums`}>{bdt(c.baseAmount)}</td>
                    <td className={`${tdCls} text-right tabular-nums`}>
                      {pct(c.ratePercent)}
                      <span className="block text-[11px] text-slate-400">{c.rateSource.toLowerCase()}</span>
                    </td>
                    <td className={`${tdCls} text-right font-bold tabular-nums`}>
                      {bdt(c.netAmount)}
                      {Number(c.reversedAmount) > 0 && <span className="block text-[11px] font-medium text-red-600">−{bdt(c.reversedAmount)} reversed</span>}
                    </td>
                    <td className={tdCls}>
                      <Pill tone={STATUS_TONE[c.status]}>{STATUS_LABEL[c.status]}</Pill>
                      {c.status === "PENDING" && <span className="block text-[11px] text-slate-400">from {fmtDate(c.availableAt)}</span>}
                    </td>
                    <td className={`${tdCls} whitespace-nowrap`}>{fmtDate(c.earnedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm text-slate-500">
              <span>
                {data.total} commission{data.total === 1 ? "" : "s"}
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
    </div>
  );
}

/**
 * Re-run the commission accrual for one delivered consignment (Phase 7).
 * Idempotent: lines already accrued for that delivery are skipped.
 */
function RerunAccrualPanel() {
  const [deliveryId, setDeliveryId] = useState("");
  const [rerun, state] = useRerunAgentAccrualMutation();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function onRun() {
    setMessage(null);
    try {
      const r = await rerun(deliveryId.trim()).unwrap();
      setMessage(
        r.status === "DONE"
          ? { ok: true, text: r.created ? `${r.created} commission line(s) created; ${r.existing} already existed.` : `Nothing new: all ${r.existing} line(s) were already accrued.` }
          : { ok: false, text: `Skipped (${r.reason.toLowerCase().replace(/_/g, " ")})${r.detail ? `: ${r.detail}` : ""}` },
      );
    } catch (err) {
      setMessage({ ok: false, text: apiErrorMessage(err, "The re-run failed") });
    }
  }

  return (
    <Panel className="mb-4" title="Re-run accrual for a delivery" subtitle="If a delivered consignment earned no commission (for example settings were missing then), run the accrual again. Lines already accrued are never duplicated.">
      <div className="flex flex-wrap items-center gap-2 p-4">
        <input
          className={`${inputCls()} max-w-sm font-mono`}
          placeholder="Courier delivery ID"
          value={deliveryId}
          onChange={(e) => setDeliveryId(e.target.value)}
          aria-label="Courier delivery ID"
        />
        <Btn variant="outline" onClick={onRun} loading={state.isLoading} disabled={deliveryId.trim().length < 3}>
          <RefreshCw className="size-4" /> Re-run
        </Btn>
        {message && <p className={`w-full text-xs ${message.ok ? "text-emerald-700" : "text-red-600"}`}>{message.text}</p>}
      </div>
    </Panel>
  );
}
