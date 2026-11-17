"use client";

import { useEffect, useMemo, useState } from "react";
import { History, Percent, Search, Trash2, Users, X } from "lucide-react";
import { toast } from "sonner";
import {
  useApplyBulkCommissionMutation,
  useDeleteVendorAdjustmentMutation,
  useDeleteVendorRateMutation,
  useGetCategoryRatesQuery,
  useGetVendorCommissionQuery,
  useLazyListCommissionVendorsQuery,
  useListCommissionVendorsQuery,
  usePreviewBulkCommissionMutation,
  useSetVendorCommissionMutation,
  type CommissionVendorDetail,
} from "@/features/commissionApi";
import { ModalSkeleton, Sk } from "@/components/admin/ui/AdminSkeletons";
import { flattenTree, fmtDelta, fmtPercent } from "./commission-helpers";
import RateHistoryDrawer from "./RateHistoryDrawer";

const MODES = [
  { value: "FIXED", label: "Fixed %" },
  { value: "DELTA_POINTS", label: "Global ± points" },
  { value: "DELTA_PERCENT", label: "Global ± % of rate" },
] as const;

export default function VendorSpecificTab() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [selectAllFiltered, setSelectAllFiltered] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
      setSelectAllFiltered(false);
      setSelected([]);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const list = useListCommissionVendorsQuery({ search: search || undefined, page, limit: 10 });
  const [loadAll] = useLazyListCommissionVendorsQuery();
  const categories = useGetCategoryRatesQuery();
  const leafCategories = useMemo(() => flattenTree(categories.data?.tree ?? []).filter((n) => n.isLeaf), [categories.data]);

  const rows = list.data?.rows ?? [];
  const allPageSelected = rows.length > 0 && rows.every((r) => selected.includes(r.id));

  const toggleRow = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
    setSelectAllFiltered(false);
  };

  const selectAll = async () => {
    if (selectAllFiltered || selected.length) {
      setSelected([]);
      setSelectAllFiltered(false);
      return;
    }
    const ids: string[] = [];
    let p = 1;
    let pages = 1;
    do {
      const res = await loadAll({ search: search || undefined, page: p, limit: 100 }).unwrap();
      ids.push(...res.rows.map((r) => r.id));
      pages = res.pages;
      p += 1;
    } while (p <= pages && p <= 10);
    setSelected(ids);
    setSelectAllFiltered(true);
  };

  return (
    <div className="space-y-3">
      <section className="rounded-2xl border border-slate-200 bg-white">
        <header className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-3 py-2">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search vendor…"
              className="h-8 w-56 rounded-lg border border-slate-200 pl-8 pr-2 text-xs outline-none focus:border-indigo-400"
            />
          </div>
          <span className="text-[11px] text-slate-500">
            {selectAllFiltered ? `All ${selected.length} filtered vendors selected` : `${selected.length} selected`}
          </span>
          <button type="button" onClick={selectAll} className="text-[11px] font-semibold text-indigo-600 hover:underline">
            {selected.length ? "Clear selection" : "Select all filtered"}
          </button>
          <button
            type="button"
            disabled={!selected.length}
            onClick={() => setBulkOpen(true)}
            className="ml-auto inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-indigo-700 disabled:opacity-40"
          >
            <Percent size={12} /> Bulk apply
          </button>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead className="sticky top-0 z-10 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
              <tr>
                <th className="w-8 px-3 py-2">
                  <input type="checkbox" checked={allPageSelected} onChange={() => (allPageSelected ? setSelected([]) : setSelected(rows.map((r) => r.id)))} aria-label="Select page" />
                </th>
                <th className="px-3 py-2">Vendor</th>
                <th className="px-3 py-2">Badge</th>
                <th className="px-3 py-2">Rate source</th>
                <th className="px-3 py-2 text-right">Overrides</th>
                <th className="px-3 py-2 text-right">Effective %</th>
                <th className="px-3 py-2 text-right">Manage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {list.isLoading &&
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={`sk-${i}`}>
                    <td className="px-3 py-2"><Sk soft className="h-4 w-4 rounded" /></td>
                    <td className="px-3 py-2">
                      <Sk soft className="h-3 w-32" />
                      <Sk soft className="mt-1.5 h-2 w-24" />
                    </td>
                    <td className="px-3 py-2"><Sk soft className="h-3 w-16" /></td>
                    <td className="px-3 py-2"><Sk soft className="h-3 w-24" /></td>
                    <td className="px-3 py-2"><Sk soft className="ml-auto h-3 w-6" /></td>
                    <td className="px-3 py-2"><Sk className="ml-auto h-3 w-12" /></td>
                    <td className="px-3 py-2"><Sk soft className="ml-auto h-3 w-10" /></td>
                  </tr>
                ))}
              {rows.map((row) => (
                <tr key={row.id} className={`hover:bg-slate-50/70 ${selected.includes(row.id) ? "bg-indigo-50/40" : ""}`}>
                  <td className="px-3 py-2">
                    <input type="checkbox" checked={selected.includes(row.id)} onChange={() => toggleRow(row.id)} aria-label={`Select ${row.storeName}`} />
                  </td>
                  <td className="px-3 py-2">
                    <p className="font-semibold text-slate-800">{row.storeName}</p>
                    <p className="text-[10px] text-slate-400">{row.email ?? row.id.slice(0, 10)}</p>
                  </td>
                  <td className="px-3 py-2 text-slate-600">{row.badge?.name ?? "—"}</td>
                  <td className="px-3 py-2 text-slate-600">
                    {row.source === "VENDOR" && row.adjustment
                      ? `Adjustment ${row.adjustment.mode === "DELTA_POINTS" ? `${row.adjustment.value > 0 ? "+" : ""}${row.adjustment.value} pts` : `${row.adjustment.value}%`}`
                      : row.source.replace(/_/g, " ").toLowerCase()}
                  </td>
                  <td className="px-3 py-2 text-right text-slate-600">{row.overrideCount}</td>
                  <td className="px-3 py-2 text-right font-bold text-slate-900">{fmtPercent(row.effectiveRate)}</td>
                  <td className="px-3 py-2 text-right">
                    <button type="button" onClick={() => setDetailId(row.id)} className="text-[11px] font-semibold text-indigo-600 hover:underline">
                      Open
                    </button>
                  </td>
                </tr>
              ))}
              {!list.isLoading && rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-10 text-center text-slate-400">
                    No vendors match.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <footer className="flex items-center justify-between border-t border-slate-100 px-3 py-2 text-[11px] text-slate-500">
          <span className="inline-flex items-center gap-2">
            {list.data ? (
              `Showing ${rows.length} of ${list.data.total}`
            ) : (
              <Sk soft className="h-2.5 w-40" />
            )}
            <span>· Page {page} of {Math.max(list.data?.pages ?? 1, 1)}</span>
          </span>
          <div className="flex gap-2">
            <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-md border border-slate-200 px-2 py-1 disabled:opacity-40">
              Prev
            </button>
            <button type="button" disabled={page >= (list.data?.pages ?? 1)} onClick={() => setPage((p) => p + 1)} className="rounded-md border border-slate-200 px-2 py-1 disabled:opacity-40">
              Next
            </button>
          </div>
        </footer>
      </section>

      {detailId && <VendorDetailDrawer vendorId={detailId} leaves={leafCategories} onClose={() => setDetailId(null)} />}
      {bulkOpen && (
        <BulkDialog
          vendorIds={selected}
          leaves={leafCategories}
          onClose={() => setBulkOpen(false)}
          onApplied={() => {
            setBulkOpen(false);
            setSelected([]);
            setSelectAllFiltered(false);
            list.refetch();
          }}
        />
      )}
    </div>
  );
}

function VendorDetailDrawer({
  vendorId,
  leaves,
  onClose,
}: {
  vendorId: string;
  leaves: { id: string; path: string; currentRate: number | null }[];
  onClose: () => void;
}) {
  const { data, isLoading, refetch } = useGetVendorCommissionQuery(vendorId);
  const [saveRate, { isLoading: saving }] = useSetVendorCommissionMutation();
  const [deleteRate] = useDeleteVendorRateMutation();
  const [deleteAdjustment] = useDeleteVendorAdjustmentMutation();
  const [mode, setMode] = useState<"DELTA_POINTS" | "DELTA_PERCENT">("DELTA_POINTS");
  const [adjustmentValue, setAdjustmentValue] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [rate, setRate] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  const detail: CommissionVendorDetail | undefined = data;

  const submitOverride = async () => {
    try {
      await saveRate({ vendorId, categoryId: categoryId || null, rate: Number(rate) }).unwrap();
      toast.success("Vendor rate saved");
      setRate("");
      setCategoryId("");
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || "Could not save the rate");
    }
  };

  const submitAdjustment = async () => {
    try {
      await saveRate({ vendorId, mode, value: Number(adjustmentValue) }).unwrap();
      toast.success("Adjustment applied");
      setAdjustmentValue("");
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || "Could not set the adjustment");
    }
  };

  return (
    <div className="fixed inset-0 z-[80]">
      <button type="button" aria-label="Close vendor panel" onClick={onClose} className="absolute inset-0 bg-slate-900/25 backdrop-blur-[2px]" />
      <aside role="dialog" aria-modal="true" aria-label="Vendor commission" className="absolute inset-y-0 right-0 flex h-full w-full flex-col border-l border-slate-200 bg-white sm:max-w-xl">
        <header className="flex items-start justify-between border-b border-slate-200 px-4 py-3">
          {isLoading ? (
            <div className="space-y-2">
              <Sk className="h-4 w-40" />
              <Sk soft className="h-2.5 w-56" />
            </div>
          ) : (
            <div>
              <h2 className="text-sm font-bold text-slate-900">{detail?.vendor.storeName ?? "Vendor"}</h2>
              <p className="text-[11px] text-slate-500">
                Effective {fmtPercent(detail?.effectiveRate)} · {detail?.source.replace(/_/g, " ").toLowerCase()} {detail?.badge ? `· ${detail.badge.name}` : ""}
              </p>
            </div>
          )}
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100" aria-label="Close">
            <X size={16} />
          </button>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {isLoading && (
            <div aria-busy="true" aria-label="Loading vendor commission" className="space-y-4">
              <div className="rounded-xl border border-slate-200 p-3">
                <div className="flex items-center justify-between">
                  <Sk className="h-3 w-40" />
                  <Sk soft className="h-3 w-14" />
                </div>
                <Sk soft className="mt-2 h-2.5 w-full" />
                <div className="mt-3 flex gap-2">
                  <Sk className="h-8 w-28 rounded-lg" />
                  <Sk className="h-8 w-24 rounded-lg" />
                  <Sk className="h-8 w-16 rounded-lg bg-slate-300/70" />
                </div>
              </div>
              <ModalSkeleton rows={4} />
            </div>
          )}

          {detail && (
            <>
              <section className="rounded-xl border border-slate-200 p-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-800">Vendor-wide adjustment</h3>
                  <button type="button" onClick={() => setShowHistory(true)} className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:underline">
                    <History size={12} /> History
                  </button>
                </div>
                <p className="mt-1 text-[11px] text-slate-500">Applied on top of the global/badge/category base at runtime — global changes stay in sync.</p>
                {detail.adjustment ? (
                  <div className="mt-2 flex items-center justify-between rounded-lg bg-slate-50 px-2.5 py-2 text-xs">
                    <span>
                      {detail.adjustment.mode === "DELTA_POINTS" ? `${detail.adjustment.value > 0 ? "+" : ""}${detail.adjustment.value} points` : `${detail.adjustment.value}% of base`}
                    </span>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!window.confirm("Remove the vendor-wide adjustment? The change is kept in history.")) return;
                        try {
                          await deleteAdjustment(vendorId).unwrap();
                          toast.success("Adjustment removed");
                          refetch();
                        } catch (err: any) {
                          toast.error(err?.data?.message || "Could not remove the adjustment");
                        }
                      }}
                      className="text-rose-600"
                      aria-label="Remove adjustment"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ) : (
                  <div className="mt-2 flex items-center gap-2">
                    <select value={mode} onChange={(e) => setMode(e.target.value as any)} className="h-8 rounded-lg border border-slate-200 px-2 text-xs">
                      <option value="DELTA_POINTS">± points</option>
                      <option value="DELTA_PERCENT">± % of base</option>
                    </select>
                    <input value={adjustmentValue} onChange={(e) => setAdjustmentValue(e.target.value)} placeholder="e.g. -1.5" inputMode="decimal" className="h-8 w-24 rounded-lg border border-slate-200 px-2 text-xs" />
                    <button type="button" disabled={saving || adjustmentValue === ""} onClick={submitAdjustment} className="rounded-lg bg-slate-900 px-2.5 py-1.5 text-[11px] font-bold text-white disabled:opacity-40">
                      Apply
                    </button>
                  </div>
                )}
              </section>

              <section className="rounded-xl border border-slate-200 p-3">
                <h3 className="text-xs font-bold text-slate-800">Overrides</h3>
                {detail.overrides.length === 0 && <p className="mt-1 text-[11px] text-slate-400">No vendor-specific rows. The effective rate follows the badge/category/global chain.</p>}
                <ul className="mt-2 divide-y divide-slate-100">
                  {detail.overrides.map((o) => (
                    <li key={o.id} className="flex items-center justify-between py-1.5 text-xs">
                      <span className="truncate pr-2" title={o.categoryPath}>
                        {o.categoryPath}
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="font-bold">{fmtPercent(o.rate)}</span>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!window.confirm(`Remove the ${o.categoryPath} override? The change is kept in history.`)) return;
                            try {
                              await deleteRate({ vendorId, categoryId: o.categoryId }).unwrap();
                              toast.success("Override removed (kept in history)");
                              refetch();
                            } catch (err: any) {
                              toast.error(err?.data?.message || "Could not remove the override");
                            }
                          }}
                          className="text-rose-600"
                          aria-label="Remove override"
                        >
                          <Trash2 size={13} />
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                  <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="h-8 max-w-[240px] rounded-lg border border-slate-200 px-2 text-xs">
                    <option value="">Vendor-wide fixed %</option>
                    {leaves.map((leaf) => (
                      <option key={leaf.id} value={leaf.id}>
                        {leaf.path}
                      </option>
                    ))}
                  </select>
                  <input value={rate} onChange={(e) => setRate(e.target.value)} placeholder="Rate %" inputMode="decimal" className="h-8 w-20 rounded-lg border border-slate-200 px-2 text-xs" />
                  <button type="button" disabled={saving || rate === ""} onClick={submitOverride} className="rounded-lg bg-indigo-600 px-2.5 py-1.5 text-[11px] font-bold text-white disabled:opacity-40">
                    Save
                  </button>
                </div>
              </section>
            </>
          )}
        </div>
      </aside>

      {showHistory && <RateHistoryDrawer title="Vendor rate history" vendorId={vendorId} onClose={() => setShowHistory(false)} />}
    </div>
  );
}

function BulkDialog({
  vendorIds,
  leaves,
  onClose,
  onApplied,
}: {
  vendorIds: string[];
  leaves: { id: string; path: string }[];
  onClose: () => void;
  onApplied: () => void;
}) {
  const [preview, { isLoading: previewing }] = usePreviewBulkCommissionMutation();
  const [applyBulk, { isLoading: applying }] = useApplyBulkCommissionMutation();
  const [target, setTarget] = useState<"ALL" | "CATEGORIES">("ALL");
  const [mode, setMode] = useState<"FIXED" | "DELTA_POINTS" | "DELTA_PERCENT">("DELTA_POINTS");
  const [value, setValue] = useState("");
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [sample, setSample] = useState<any[] | null>(null);
  const [batchId, setBatchId] = useState<string | null>(null);

  const input = () => ({
    vendorIds,
    target,
    categoryIds: target === "CATEGORIES" ? categoryIds : undefined,
    mode,
    value: Number(value),
  });

  const runPreview = async () => {
    try {
      const result = await preview(input()).unwrap();
      setSample(result.sample);
      setBatchId(result.batchId);
    } catch (err: any) {
      toast.error(err?.data?.message || "Could not preview");
    }
  };

  const apply = async () => {
    try {
      const result = await applyBulk(input()).unwrap();
      toast.success(`${result.updated} rate(s) updated`);
      onApplied();
    } catch (err: any) {
      toast.error(err?.data?.message || "Could not apply");
    }
  };

  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center p-4">
      <button type="button" aria-label="Close bulk panel" onClick={onClose} className="absolute inset-0 bg-slate-900/30 backdrop-blur-[2px]" />
      <div role="dialog" aria-modal="true" aria-label="Bulk commission" className="relative flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <header className="border-b border-slate-200 px-4 py-3">
          <h3 className="text-sm font-bold text-slate-900">Bulk commission — {vendorIds.length} vendor(s)</h3>
          <p className="text-[11px] text-slate-500">Preview first. DELTA modes stay relative to the global/badge base.</p>
        </header>
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          <div className="flex flex-wrap items-center gap-2">
            <select value={target} onChange={(e) => setTarget(e.target.value as any)} className="h-9 rounded-lg border border-slate-200 px-2 text-xs">
              <option value="ALL">All categories (vendor-wide)</option>
              <option value="CATEGORIES">Selected categories</option>
            </select>
            <select value={mode} onChange={(e) => setMode(e.target.value as any)} className="h-9 rounded-lg border border-slate-200 px-2 text-xs">
              {MODES.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
            <input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Value" inputMode="decimal" className="h-9 w-24 rounded-lg border border-slate-200 px-2 text-xs" />
            <button type="button" disabled={previewing || value === "" || (target === "CATEGORIES" && !categoryIds.length)} onClick={runPreview} className="rounded-lg bg-slate-900 px-3 py-2 text-[11px] font-bold text-white disabled:opacity-40">
              {previewing ? "Checking…" : "Preview"}
            </button>
          </div>

          {target === "CATEGORIES" && (
            <div className="max-h-40 overflow-auto rounded-lg border border-slate-200 p-2">
              {leaves.map((leaf) => (
                <label key={leaf.id} className="flex items-center gap-2 py-0.5 text-[11px]">
                  <input
                    type="checkbox"
                    checked={categoryIds.includes(leaf.id)}
                    onChange={() =>
                      setCategoryIds((prev) => (prev.includes(leaf.id) ? prev.filter((id) => id !== leaf.id) : [...prev, leaf.id]))
                    }
                  />
                  <span className="truncate">{leaf.path}</span>
                </label>
              ))}
            </div>
          )}

          {sample && (
            <div className="overflow-auto rounded-lg border border-slate-200">
              <table className="w-full min-w-[520px] text-left text-[11px]">
                <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-2 py-1.5">Vendor</th>
                    <th className="px-2 py-1.5">Category</th>
                    <th className="px-2 py-1.5 text-right">Old %</th>
                    <th className="px-2 py-1.5 text-right">New %</th>
                    <th className="px-2 py-1.5 text-right">Delta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sample.map((row, i) => {
                    const delta = fmtDelta(row.delta);
                    return (
                      <tr key={i}>
                        <td className="px-2 py-1.5">{row.vendorName}</td>
                        <td className="px-2 py-1.5">{row.categoryPath}</td>
                        <td className="px-2 py-1.5 text-right">{fmtPercent(row.oldRate)}</td>
                        <td className="px-2 py-1.5 text-right font-semibold">{fmtPercent(row.newRate)}</td>
                        <td className={`px-2 py-1.5 text-right font-semibold ${delta.tone}`}>{delta.text}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {batchId && <p className="text-[10px] text-slate-400">Batch {batchId.slice(0, 8)} will be recorded in history with source=BULK.</p>}
        </div>
        <footer className="flex items-center justify-end gap-2 border-t border-slate-200 px-4 py-3">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600">
            Cancel
          </button>
          <button type="button" disabled={!sample || applying} onClick={apply} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-40">
            {applying ? "Applying…" : "Apply"}
          </button>
        </footer>
      </div>
    </div>
  );
}
