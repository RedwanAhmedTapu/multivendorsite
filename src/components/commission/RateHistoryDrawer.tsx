"use client";

import { X } from "lucide-react";
import { useGetRateHistoryQuery } from "@/features/commissionApi";
import { Sk } from "@/components/admin/ui/AdminSkeletons";
import { fmtDateTime, fmtDelta, fmtPercent, scopeLabel } from "./commission-helpers";

type Props = {
  title: string;
  scope?: string;
  categoryId?: string;
  vendorId?: string;
  badgeId?: string;
  onClose: () => void;
};

export default function RateHistoryDrawer({ title, scope, categoryId, vendorId, badgeId, onClose }: Props) {
  const { data, isLoading, isError } = useGetRateHistoryQuery(
    { scope, categoryId, vendorId, badgeId, limit: 50 },
    { skip: !scope && !categoryId && !vendorId && !badgeId },
  );
  const rows = data?.rows ?? [];

  return (
    <div className="fixed inset-0 z-[80]">
      <button type="button" aria-label="Close history" onClick={onClose} className="absolute inset-0 bg-slate-900/25 backdrop-blur-[2px]" />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="absolute inset-y-0 right-0 flex h-full w-full flex-col border-l border-slate-200 bg-white sm:max-w-md"
      >
        <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">{title}</h2>
            <p className="text-[11px] text-slate-500">Append-only rate changes (↑ increase, ↓ decrease)</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100" aria-label="Close">
            <X size={16} />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto">
          {isLoading && (
            <ul aria-busy="true" aria-label="Loading history" className="divide-y divide-slate-100">
              {Array.from({ length: 6 }).map((_, i) => (
                <li key={i} className="px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <Sk soft className="h-2.5 w-28" />
                    <Sk className="h-3 w-12" />
                  </div>
                  <Sk className="mt-2 h-3.5 w-40" />
                  <div className="mt-2 flex gap-2">
                    <Sk soft className="h-2 w-24" />
                    <Sk soft className="h-2 w-16" />
                  </div>
                </li>
              ))}
            </ul>
          )}
          {isError && <p className="px-4 py-6 text-xs text-rose-600">Could not load history (is the commission migration applied?).</p>}
          {!isLoading && !isError && rows.length === 0 && <p className="px-4 py-6 text-xs text-slate-500">No rate changes recorded yet.</p>}
          <ul className="divide-y divide-slate-100">
            {rows.map((row) => {
              const delta = fmtDelta(row.delta);
              return (
                <li key={row.id} className="px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-slate-600">{scopeLabel(row.scope)}</span>
                    <span className={`text-xs font-bold ${delta.tone}`}>{delta.text}</span>
                  </div>
                  <div className="mt-1 text-xs text-slate-800">
                    {fmtPercent(row.oldRate)} → <span className="font-semibold">{fmtPercent(row.newRate)}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
                    <span>{fmtDateTime(row.createdAt)}</span>
                    <span>· {row.source}</span>
                    {row.batchId && <span className="font-mono">· batch {row.batchId.slice(0, 8)}</span>}
                  </div>
                  {row.note && <p className="mt-1 text-[11px] text-slate-500">{row.note}</p>}
                </li>
              );
            })}
          </ul>
        </div>
      </aside>
    </div>
  );
}
