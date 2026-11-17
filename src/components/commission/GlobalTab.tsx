"use client";

import { useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronRight, Download, History, Pencil, Search, Upload, X } from "lucide-react";
import { toast } from "sonner";
import {
  useApplyExcelMutation,
  useGetCategoryRatesQuery,
  useGetCommissionSettingsQuery,
  useLazyGetExcelTemplateQuery,
  usePreviewExcelMutation,
  useSetCategoryRateMutation,
  useUpdateCommissionSettingMutation,
  type CategoryRateNode,
  type ExcelPreview,
} from "@/features/commissionApi";
import {
  flattenTree,
  fmtDate,
  fmtDelta,
  fmtPercent,
  isExcelFile,
  parseCommissionExcel,
  type ExcelUploadRow,
} from "./commission-helpers";
import { Sk } from "@/components/admin/ui/AdminSkeletons";
import { downloadCommissionTemplate } from "./commission-template";
import RateHistoryDrawer from "./RateHistoryDrawer";

const STATUS_TONE: Record<string, string> = {
  OK: "bg-emerald-50 text-emerald-700 border-emerald-200",
  UNCHANGED: "bg-slate-100 text-slate-600 border-slate-200",
  SKIPPED: "bg-sky-50 text-sky-700 border-sky-200",
  NOT_FOUND: "bg-rose-50 text-rose-700 border-rose-200",
  AMBIGUOUS: "bg-amber-50 text-amber-700 border-amber-200",
  NOT_LEAF: "bg-amber-50 text-amber-700 border-amber-200",
  INVALID: "bg-rose-50 text-rose-700 border-rose-200",
  DUPLICATE: "bg-amber-50 text-amber-700 border-amber-200",
};

export default function GlobalTab() {
  const categories = useGetCategoryRatesQuery();
  const settings = useGetCommissionSettingsQuery();
  const [setCategoryRate, { isLoading: savingRate }] = useSetCategoryRateMutation();
  const [saveSetting, { isLoading: savingSetting }] = useUpdateCommissionSettingMutation();
  const [previewExcel, { isLoading: previewing }] = usePreviewExcelMutation();
  const [applyExcel, { isLoading: applying }] = useApplyExcelMutation();
  const [loadTemplate] = useLazyGetExcelTemplateQuery();

  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [rateInput, setRateInput] = useState("");
  const [defaultInput, setDefaultInput] = useState("");
  const [editingDefault, setEditingDefault] = useState(false);
  const [vatInput, setVatInput] = useState("");
  const [editingVat, setEditingVat] = useState(false);
  const [history, setHistory] = useState<{ title: string; categoryId?: string; scope?: string } | null>(null);
  const [preview, setPreview] = useState<ExcelPreview | null>(null);
  const [pendingRows, setPendingRows] = useState<ExcelUploadRow[]>([]);
  const [applyToDescendants, setApplyToDescendants] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const tree = categories.data?.tree ?? [];
  const matches = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return null;
    return flattenTree(tree).filter((node) => node.isLeaf && node.path.toLowerCase().includes(term));
  }, [search, tree]);

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const saveCategory = async (node: CategoryRateNode) => {
    try {
      await setCategoryRate({ categoryId: node.id, rate: Number(rateInput) }).unwrap();
      toast.success(`${node.name} set to ${fmtPercent(Number(rateInput))}`);
      setEditing(null);
    } catch (err: any) {
      toast.error(err?.data?.message || "Could not save the category rate");
    }
  };

  const saveDefault = async () => {
    try {
      await saveSetting({ key: "default", value: Number(defaultInput) }).unwrap();
      toast.success(`Global default set to ${fmtPercent(Number(defaultInput))}`);
      setEditingDefault(false);
    } catch (err: any) {
      toast.error(err?.data?.message || "Could not save the global default");
    }
  };

  const saveVat = async () => {
    const raw = vatInput.trim();
    if (!raw) {
      toast.error("Enter a VAT percent or 'same_as_line_tax'");
      return;
    }
    try {
      await saveSetting({ key: "vat", value: raw }).unwrap();
      toast.success("Commission VAT setting saved");
      setEditingVat(false);
    } catch (err: any) {
      toast.error(err?.data?.message || "Could not save the VAT setting");
    }
  };

  const downloadTemplate = async () => {
    try {
      const data = await loadTemplate().unwrap();
      await downloadCommissionTemplate(data.rows, "commission-template.xlsx");
    } catch (err: any) {
      toast.error(err?.data?.message || "Could not build the template");
    }
  };

  const runPreview = async (rows: ExcelUploadRow[], toDescendants = applyToDescendants) => {
    try {
      const data = await previewExcel({ rows, applyToDescendants: toDescendants }).unwrap();
      setPendingRows(rows);
      setPreview(data);
    } catch (err: any) {
      toast.error(err?.data?.message || "Could not preview the file");
    }
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    if (!isExcelFile(file)) {
      toast.error("Upload an .xlsx, .xls or .csv file");
      return;
    }
    try {
      const rows = await parseCommissionExcel(file);
      if (!rows.length) {
        toast.error("No rows found — use the template columns: Category Path, Commission %");
        return;
      }
      await runPreview(rows);
    } catch {
      toast.error("Could not read the file");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const apply = async () => {
    if (!preview) return;
    try {
      const result = await applyExcel({ rows: pendingRows, applyToDescendants, batchId: preview.batchId }).unwrap();
      toast.success(`${result.applied} category rate(s) updated`);
      setPreview(null);
      categories.refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || "Could not apply the file");
    }
  };

  const renderRow = (node: CategoryRateNode) => {
    if (search.trim() && !node.isLeaf && !flattenTree([node]).some((n) => n.isLeaf && n.path.toLowerCase().includes(search.trim().toLowerCase()))) {
      return null;
    }
    const open = expanded.has(node.id) || Boolean(search.trim());
    const delta = fmtDelta(node.lastChange?.delta);
    return (
      <tr key={node.id} className="border-b border-slate-100 hover:bg-slate-50/60">
        <td className="px-3 py-1.5">
          <div className="flex items-center" style={{ paddingLeft: node.depth * 14 }}>
            {node.children.length > 0 ? (
              <button type="button" onClick={() => toggle(node.id)} className="mr-1 rounded p-0.5 text-slate-400 hover:text-slate-700" aria-label={open ? "Collapse" : "Expand"}>
                {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
              </button>
            ) : (
              <span className="mr-1 inline-block w-[17px]" />
            )}
            <span className={`text-xs ${node.isLeaf ? "text-slate-800" : "font-semibold text-slate-700"}`}>{node.name}</span>
            <span className="ml-1 text-[10px] text-slate-300">{node.isLeaf ? "" : `(${node.children.length})`}</span>
          </div>
        </td>
        <td className="max-w-[320px] truncate px-3 py-1.5 text-[11px] text-slate-400" title={node.path}>
          {node.path}
        </td>
        <td className="px-3 py-1.5 text-right">
          {editing === node.id ? (
            <span className="inline-flex items-center gap-1">
              <input
                autoFocus
                value={rateInput}
                onChange={(e) => setRateInput(e.target.value)}
                inputMode="decimal"
                className="h-7 w-16 rounded-md border border-indigo-300 px-1.5 text-right text-xs outline-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveCategory(node);
                  if (e.key === "Escape") setEditing(null);
                }}
              />
              <button type="button" disabled={savingRate} onClick={() => saveCategory(node)} className="rounded-md bg-indigo-600 px-1.5 py-1 text-[10px] font-bold text-white disabled:opacity-50">
                Save
              </button>
              <button type="button" onClick={() => setEditing(null)} className="text-slate-400" aria-label="Cancel">
                <X size={12} />
              </button>
            </span>
          ) : (
            <span className="inline-flex items-center justify-end gap-1">
              <span className="text-xs font-bold text-slate-900">{fmtPercent(node.currentRate)}</span>
              {node.isLeaf && node.inherited && (
                <span className="rounded border border-slate-200 bg-slate-50 px-1 py-0.5 text-[9px] font-semibold text-slate-500" title={`Inherited from ${node.inheritedFrom ?? "parent"}`}>
                  inherited
                </span>
              )}
              {node.isLeaf && (
                <button
                  type="button"
                  onClick={() => {
                    setEditing(node.id);
                    setRateInput(String(node.currentRate ?? ""));
                  }}
                  className="rounded p-0.5 text-slate-400 hover:text-indigo-600"
                  aria-label={`Edit ${node.name} rate`}
                >
                  <Pencil size={11} />
                </button>
              )}
            </span>
          )}
        </td>
        <td className="px-3 py-1.5 text-right text-[11px]">
          {node.lastChange ? (
            <span>
              <span className={`font-semibold ${delta.tone}`}>{delta.text}</span>{" "}
              <span className="text-slate-400">{fmtDate(node.lastChange.at)}</span>
            </span>
          ) : (
            <span className="text-slate-300">—</span>
          )}
        </td>
        <td className="px-3 py-1.5 text-right">
          <button
            type="button"
            onClick={() => setHistory({ title: `${node.name} rate history`, scope: "CATEGORY", categoryId: node.id })}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:underline"
          >
            <History size={12} /> History
          </button>
        </td>
      </tr>
    );
  };

  if (categories.isError) {
    return <p className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700">Could not load category rates. Apply the commission migration and retry.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_1fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Global default rate</p>
          <div className="mt-2 flex items-center gap-3">
            {editingDefault ? (
              <>
                <input
                  autoFocus
                  value={defaultInput}
                  onChange={(e) => setDefaultInput(e.target.value)}
                  inputMode="decimal"
                  className="h-8 w-24 rounded-lg border border-indigo-300 px-2 text-sm outline-none"
                />
                <button type="button" disabled={savingSetting} onClick={saveDefault} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50">
                  Save
                </button>
                <button type="button" onClick={() => setEditingDefault(false)} className="text-xs text-slate-500">
                  Cancel
                </button>
              </>
            ) : (
              <>
                <p className="text-2xl font-extrabold text-slate-900">{fmtPercent(settings.data?.defaultRate)}</p>
                <button
                  type="button"
                  onClick={() => {
                    setEditingDefault(true);
                    setDefaultInput(String(settings.data?.defaultRate ?? ""));
                  }}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-50"
                >
                  <Pencil size={11} /> Edit
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => setHistory({ title: "Global default rate history", scope: "GLOBAL_DEFAULT" })}
              className="ml-auto inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:underline"
            >
              <History size={12} /> History
            </button>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Used when no category, vendor or badge rule applies. Missing key refuses orders rather than charging 0%.</p>
          <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-2">
            <span className="text-[11px] font-semibold text-slate-600">Commission VAT</span>
            {editingVat ? (
              <>
                <input
                  autoFocus
                  value={vatInput}
                  onChange={(e) => setVatInput(e.target.value)}
                  placeholder="number or same_as_line_tax"
                  className="h-8 w-40 rounded-lg border border-indigo-300 px-2 text-xs outline-none"
                />
                <button type="button" disabled={savingSetting} onClick={saveVat} className="rounded-lg bg-indigo-600 px-2.5 py-1 text-[11px] font-bold text-white disabled:opacity-50">
                  Save
                </button>
                <button type="button" onClick={() => setEditingVat(false)} className="text-[11px] text-slate-500">
                  Cancel
                </button>
              </>
            ) : (
              <>
                <span className="text-xs font-bold text-slate-800">{settings.data?.vatRate ?? "—"}</span>
                <button
                  type="button"
                  onClick={() => {
                    setEditingVat(true);
                    setVatInput(settings.data?.vatRate ?? "");
                  }}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-[10px] font-semibold text-slate-600 hover:bg-slate-50"
                >
                  <Pencil size={10} /> Edit
                </button>
                <span className="text-[10px] text-slate-400">number = VAT %, or same_as_line_tax</span>
              </>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Excel rates</p>
          <p className="mt-1 text-[11px] text-slate-400">Template pre-fills every leaf category path. Upload is dry-run first — nothing is written until you confirm.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" onClick={downloadTemplate} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50">
              <Download size={12} /> Download template
            </button>
            <button
              type="button"
              disabled={previewing}
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              <Upload size={12} /> {previewing ? "Checking…" : "Upload file"}
            </button>
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white">
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-3 py-2">
          <h3 className="text-xs font-bold text-slate-800">Category rates</h3>
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search category path…"
              className="h-8 w-56 rounded-lg border border-slate-200 pl-8 pr-2 text-xs outline-none focus:border-indigo-400"
            />
          </div>
        </header>
        <div className="max-h-[60vh] overflow-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead className="sticky top-0 z-10 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-3 py-2">Category</th>
                <th className="px-3 py-2">Path</th>
                <th className="px-3 py-2 text-right">Current %</th>
                <th className="px-3 py-2 text-right">Last change</th>
                <th className="px-3 py-2 text-right">History</th>
              </tr>
            </thead>
            <tbody>
              {search.trim()
                ? matches?.map((node) => renderRow({ ...node, depth: 0, children: [] }))
                : tree.map(renderRow)}
              {categories.isLoading &&
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={`sk-${i}`} className="border-t border-slate-100">
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1.5" style={{ paddingLeft: (i % 3) * 14 }}>
                        {(i % 3) === 0 ? <Sk soft className="h-3 w-3 rounded" /> : null}
                        <Sk className="h-3 w-28" />
                      </div>
                    </td>
                    <td className="px-3 py-2"><Sk soft className="h-3 w-40" /></td>
                    <td className="px-3 py-2"><Sk className="ml-auto h-3 w-10" /></td>
                    <td className="px-3 py-2"><Sk soft className="ml-auto h-3 w-16" /></td>
                    <td className="px-3 py-2"><Sk soft className="ml-auto h-3 w-10" /></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        <footer className="border-t border-slate-100 px-3 py-2 text-[11px] text-slate-400">
          Parent rows are read-only; leaves may inherit from the nearest ancestor. {categories.data ? `${flattenTree(tree).length} categories` : ""}
        </footer>
      </section>

      {history && <RateHistoryDrawer {...history} onClose={() => setHistory(null)} />}

      {preview && (
        <div className="fixed inset-0 z-[85] flex items-center justify-center p-4">
          <button type="button" aria-label="Close preview" onClick={() => setPreview(null)} className="absolute inset-0 bg-slate-900/30 backdrop-blur-[2px]" />
          <div role="dialog" aria-modal="true" aria-label="Excel dry-run preview" className="relative flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Dry-run preview</h3>
                <p className="text-[11px] text-slate-500">
                  OK rows are written only when you press Apply. Errors are skipped. Batch {preview.batchId.slice(0, 8)}.
                </p>
              </div>
              <label className="flex items-center gap-2 text-[11px] font-semibold text-slate-600">
                <input
                  type="checkbox"
                  checked={applyToDescendants}
                  onChange={(e) => {
                    setApplyToDescendants(e.target.checked);
                    runPreview(pendingRows, e.target.checked);
                  }}
                />
                Apply parent rows to all leaf descendants
              </label>
            </header>
            <div className="flex flex-wrap gap-2 border-b border-slate-100 px-4 py-2 text-[10px]">
              {Object.entries(preview.summary).map(([status, count]) => (
                <span key={status} className={`rounded border px-1.5 py-0.5 font-semibold ${STATUS_TONE[status] ?? ""}`}>
                  {status} {count}
                </span>
              ))}
            </div>
            <div className="flex-1 overflow-auto">
              <table className="w-full min-w-[720px] text-left text-xs">
                <thead className="sticky top-0 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Row</th>
                    <th className="px-3 py-2">Path</th>
                    <th className="px-3 py-2">Matched</th>
                    <th className="px-3 py-2 text-right">Old %</th>
                    <th className="px-3 py-2 text-right">New %</th>
                    <th className="px-3 py-2 text-right">Delta</th>
                    <th className="px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {preview.rows.map((row) => {
                    const delta = fmtDelta(row.delta);
                    return (
                      <tr key={`${row.row}-${row.path}`}>
                        <td className="px-3 py-1.5 text-slate-400">{row.row}</td>
                        <td className="max-w-[240px] truncate px-3 py-1.5" title={row.path}>
                          {row.path}
                        </td>
                        <td className="max-w-[200px] truncate px-3 py-1.5 text-slate-500" title={row.matchedPath}>
                          {row.matchedPath ?? "—"}
                        </td>
                        <td className="px-3 py-1.5 text-right">{fmtPercent(row.oldRate)}</td>
                        <td className="px-3 py-1.5 text-right font-semibold">{fmtPercent(row.newRate)}</td>
                        <td className={`px-3 py-1.5 text-right font-semibold ${delta.tone}`}>{delta.text}</td>
                        <td className="px-3 py-1.5">
                          <span className={`rounded border px-1.5 py-0.5 text-[10px] font-bold ${STATUS_TONE[row.status] ?? ""}`} title={row.message}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <footer className="flex items-center justify-end gap-2 border-t border-slate-200 px-4 py-3">
              <button type="button" onClick={() => setPreview(null)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600">
                Cancel
              </button>
              <button
                type="button"
                disabled={applying || (preview.summary.OK ?? 0) === 0}
                onClick={apply}
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {applying ? "Applying…" : `Apply ${preview.summary.OK ?? 0} row(s)`}
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
