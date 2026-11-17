"use client";

import { useState } from "react";
import { BadgeCheck, History, Percent, Users } from "lucide-react";
import { useGetCommissionOverviewQuery, useListCommissionVendorsQuery } from "@/features/commissionApi";
import { fmtDateTime, fmtDelta, fmtPercent, scopeLabel } from "./commission-helpers";
import { PanelSkeleton, Sk, StatsSkeleton } from "@/components/admin/ui/AdminSkeletons";
import RateHistoryDrawer from "./RateHistoryDrawer";

const SOURCE_LABEL: Record<string, string> = {
  VENDOR_CATEGORY: "Vendor × category",
  VENDOR: "Vendor override / adjustment",
  BADGE_CATEGORY: "Badge × category",
  BADGE: "Badge rule",
  CATEGORY: "Category rate",
  GLOBAL_DEFAULT: "Global default",
};

export default function OverviewTab() {
  const { data, isLoading, isError, refetch } = useGetCommissionOverviewQuery();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [historyVendor, setHistoryVendor] = useState<string | null>(null);
  const vendors = useListCommissionVendorsQuery({ search: search || undefined, page, limit: 10 });

  if (isLoading) {
    return (
      <div aria-busy="true" aria-label="Loading commission overview" className="space-y-4">
        <StatsSkeleton count={4} />
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.35fr_1fr]">
          <PanelSkeleton rows={6} cols={5} />
          <PanelSkeleton rows={5} cols={1} />
        </div>
      </div>
    );
  }
  if (isError || !data) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700">
        Could not load the overview. The commission migration may not be applied yet.{" "}
        <button type="button" onClick={() => refetch()} className="font-semibold underline">
          Retry
        </button>
      </div>
    );
  }

  const kpis = [
    { label: "Effective avg rate", value: fmtPercent(data.effectiveAverageRate), note: `${data.vendorCount} vendors`, icon: <Percent size={15} /> },
    { label: "Vendor overrides", value: String(data.vendorOverrideCount), note: "Vendors with category overrides", icon: <Users size={15} /> },
    { label: "Badge rules", value: String(data.badgeRuleCount), note: "Active rules", icon: <BadgeCheck size={15} /> },
    { label: "Last rate change", value: data.lastChangeAt ? fmtDateTime(data.lastChangeAt) : "—", note: "Append-only history", icon: <History size={15} /> },
  ];

  return (
    <div className="space-y-4">
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{kpi.label}</span>
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">{kpi.icon}</span>
            </div>
            <p className="mt-2 text-xl font-extrabold text-slate-900">{kpi.value}</p>
            <p className="mt-0.5 text-[11px] text-slate-400">{kpi.note}</p>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.35fr_1fr]">
        <section className="rounded-2xl border border-slate-200 bg-white">
          <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-2.5">
            <h3 className="text-xs font-bold text-slate-800">Vendor effective rates</h3>
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search vendor…"
              className="h-8 w-48 rounded-lg border border-slate-200 px-2.5 text-xs outline-none focus:border-indigo-400"
            />
          </header>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-xs">
              <thead className="sticky top-0 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-2">Vendor</th>
                  <th className="px-3 py-2">Badge</th>
                  <th className="px-3 py-2">Source</th>
                  <th className="px-3 py-2 text-right">Effective</th>
                  <th className="px-3 py-2 text-right">History</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vendors.isLoading &&
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={`sk-${i}`}>
                      <td className="px-4 py-2">
                        <Sk soft className="h-3 w-32" />
                        <Sk soft className="mt-1.5 h-2 w-20" />
                      </td>
                      <td className="px-3 py-2"><Sk soft className="h-3 w-16" /></td>
                      <td className="px-3 py-2"><Sk soft className="h-3 w-24" /></td>
                      <td className="px-3 py-2"><Sk className="ml-auto h-3 w-12" /></td>
                      <td className="px-3 py-2"><Sk soft className="ml-auto h-3 w-10" /></td>
                    </tr>
                  ))}
                {(vendors.data?.rows ?? []).map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-2">
                      <p className="font-semibold text-slate-800">{row.storeName}</p>
                      <p className="text-[10px] text-slate-400">{row.overrideCount} override(s)</p>
                    </td>
                    <td className="px-3 py-2 text-slate-600">{row.badge?.name ?? "—"}</td>
                    <td className="px-3 py-2 text-slate-600">{SOURCE_LABEL[row.source] ?? row.source}</td>
                    <td className="px-3 py-2 text-right font-bold text-slate-900">{fmtPercent(row.effectiveRate)}</td>
                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => setHistoryVendor(row.id)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:underline"
                      >
                        <History size={12} /> View
                      </button>
                    </td>
                  </tr>
                ))}
                {!vendors.isLoading && (vendors.data?.rows ?? []).length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                      No vendors match.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <footer className="flex items-center justify-between border-t border-slate-100 px-4 py-2 text-[11px] text-slate-500">
            <span>
              Page {page} of {Math.max(vendors.data?.pages ?? 0, 1)}
            </span>
            <div className="flex gap-2">
              <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-md border border-slate-200 px-2 py-1 disabled:opacity-40">
                Prev
              </button>
              <button
                type="button"
                disabled={page >= (vendors.data?.pages ?? 1)}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-md border border-slate-200 px-2 py-1 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </footer>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white">
          <header className="border-b border-slate-100 px-4 py-2.5">
            <h3 className="text-xs font-bold text-slate-800">Recent rate changes</h3>
          </header>
          <ul className="divide-y divide-slate-100">
            {(data.recentChanges ?? []).map((change: any) => {
              const delta = fmtDelta(change.delta);
              return (
                <li key={change.id} className="px-4 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-slate-700">{scopeLabel(change.scope)}</span>
                    <span className={`text-xs font-bold ${delta.tone}`}>{delta.text}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-600">
                    {fmtPercent(change.oldRate)} → <span className="font-semibold text-slate-900">{fmtPercent(change.newRate)}</span>
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {fmtDateTime(change.createdAt)} · {change.source}
                  </p>
                </li>
              );
            })}
            {(data.recentChanges ?? []).length === 0 && (
              <li className="px-4 py-8 text-center text-xs text-slate-400">No rate changes yet.</li>
            )}
          </ul>
        </section>
      </div>

      {historyVendor && (
        <RateHistoryDrawer title="Vendor rate history" vendorId={historyVendor} onClose={() => setHistoryVendor(null)} />
      )}
    </div>
  );
}
