"use client";

// Agent Training Center (Phase 9): resources agents read in the agent portal.
// Only published resources are visible to agents; every change is audited.

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ExternalLink, Pencil, Plus, Star, Trash2 } from "lucide-react";
import {
  apiErrorMessage,
  apiFieldErrors,
  useDeleteAgentTrainingMutation,
  useListAgentTrainingQuery,
  useSaveAgentTrainingMutation,
  type TrainingResource,
} from "@/features/agentAdminApi";
import { AgentAdminHeader, Btn, Empty, FieldRow, Modal, Panel, Pill, fmtDate, inputCls, tdCls, thCls } from "@/components/agent-admin/AgentAdminUI";

type Draft = { category: string; title: string; summary: string; body: string; url: string; coverImage: string; isFeatured: boolean; isPublished: boolean };
const EMPTY: Draft = { category: "", title: "", summary: "", body: "", url: "", coverImage: "", isFeatured: false, isPublished: false };

export default function AgentTrainingPage() {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [q, category]);
  const { data, isLoading, isError, error } = useListAgentTrainingQuery({ q: q || undefined, category: category || undefined, page, limit: 25 });
  const [save, saving] = useSaveAgentTrainingMutation();
  const [remove] = useDeleteAgentTrainingMutation();
  const [editing, setEditing] = useState<{ id?: string; draft: Draft } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function open(r?: TrainingResource) {
    setErrors({});
    setEditing(
      r
        ? { id: r.id, draft: { category: r.category, title: r.title, summary: r.summary ?? "", body: r.body ?? "", url: r.url ?? "", coverImage: r.coverImage ?? "", isFeatured: r.isFeatured, isPublished: r.isPublished } }
        : { draft: EMPTY },
    );
  }

  async function onSave() {
    if (!editing) return;
    const d = editing.draft;
    setErrors({});
    try {
      await save({
        id: editing.id,
        body: { category: d.category, title: d.title, summary: d.summary || null, body: d.body || null, url: d.url || null, coverImage: d.coverImage || null, isFeatured: d.isFeatured, isPublished: d.isPublished },
      }).unwrap();
      toast.success(editing.id ? "Resource updated" : "Resource created");
      setEditing(null);
    } catch (err) {
      setErrors(apiFieldErrors(err));
      toast.error(apiErrorMessage(err, "Could not save"));
    }
  }

  async function onDelete(r: TrainingResource) {
    if (!window.confirm(`Delete "${r.title}"? Agents will no longer see it.`)) return;
    try {
      await remove(r.id).unwrap();
      toast.success("Resource deleted");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not delete"));
    }
  }

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => editing && setEditing({ ...editing, draft: { ...editing.draft, [k]: v } });

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-6 sm:px-6">
      <AgentAdminHeader
        title="Training Center"
        subtitle="Guides, videos and links for agents. Only published resources appear in the agent portal; featured ones are shown first."
        actions={
          <Btn onClick={() => open()}>
            <Plus className="size-4" /> New resource
          </Btn>
        }
      />

      <Panel className="mb-4">
        <div className="flex flex-wrap gap-3 p-4">
          <input className={`${inputCls()} max-w-xs`} placeholder="Search title or summary" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search" />
          <select className={`${inputCls()} max-w-xs`} value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category">
            <option value="">All categories</option>
            {(data?.categories ?? []).map((c) => (
              <option key={c.category} value={c.category}>
                {c.category} ({c.count})
              </option>
            ))}
          </select>
        </div>
      </Panel>

      <Panel>
        {isError ? (
          <p className="p-6 text-sm text-red-600">{apiErrorMessage(error)}</p>
        ) : isLoading ? (
          <p className="p-6 text-sm text-slate-400">Loading…</p>
        ) : !data?.items.length ? (
          <Empty title="No training resources yet" text="Create one to help agents onboard vendors." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-100 bg-slate-50/60">
                <tr>
                  <th className={thCls}>Title</th>
                  <th className={thCls}>Category</th>
                  <th className={thCls}>Status</th>
                  <th className={thCls}>Updated</th>
                  <th className={thCls} aria-label="Actions" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.items.map((r) => (
                  <tr key={r.id}>
                    <td className={tdCls}>
                      <span className="flex items-center gap-1.5 font-semibold text-slate-800">
                        {r.isFeatured && <Star className="size-3.5 fill-amber-400 text-amber-400" aria-label="Featured" />}
                        {r.title}
                      </span>
                      {r.url && (
                        <a href={r.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline">
                          {r.url.slice(0, 60)} <ExternalLink className="size-3" />
                        </a>
                      )}
                    </td>
                    <td className={tdCls}>{r.category}</td>
                    <td className={tdCls}>{r.isPublished ? <Pill tone="green">Published</Pill> : <Pill>Draft</Pill>}</td>
                    <td className={`${tdCls} whitespace-nowrap`}>{fmtDate(r.updatedAt)}</td>
                    <td className={`${tdCls} text-right`}>
                      <Btn variant="ghost" onClick={() => open(r)} aria-label={`Edit ${r.title}`}>
                        <Pencil className="size-4" />
                      </Btn>
                      <Btn variant="ghost" onClick={() => onDelete(r)} aria-label={`Delete ${r.title}`}>
                        <Trash2 className="size-4 text-red-500" />
                      </Btn>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm text-slate-500">
              <span>{data.total} resource(s)</span>
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

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.id ? "Edit resource" : "New resource"}
        wide
        footer={
          <>
            <Btn variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Btn>
            <Btn onClick={onSave} loading={saving.isLoading}>
              Save
            </Btn>
          </>
        }
      >
        {editing && (
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldRow label="Title" error={errors.title} htmlFor="tr-title">
              <input id="tr-title" className={inputCls(!!errors.title)} value={editing.draft.title} onChange={(e) => set("title", e.target.value)} maxLength={160} />
            </FieldRow>
            <FieldRow label="Category" error={errors.category} hint="e.g. Onboarding, Sales, Policies" htmlFor="tr-cat">
              <input id="tr-cat" className={inputCls(!!errors.category)} value={editing.draft.category} onChange={(e) => set("category", e.target.value)} maxLength={60} list="tr-categories" />
              <datalist id="tr-categories">
                {(data?.categories ?? []).map((c) => (
                  <option key={c.category} value={c.category} />
                ))}
              </datalist>
            </FieldRow>
            <div className="sm:col-span-2">
              <FieldRow label="Summary (optional)" error={errors.summary} htmlFor="tr-summary">
                <input id="tr-summary" className={inputCls(!!errors.summary)} value={editing.draft.summary} onChange={(e) => set("summary", e.target.value)} maxLength={500} />
              </FieldRow>
            </div>
            <FieldRow label="Link (optional)" error={errors.url} hint="A video or document, https://…" htmlFor="tr-url">
              <input id="tr-url" className={inputCls(!!errors.url)} value={editing.draft.url} onChange={(e) => set("url", e.target.value)} />
            </FieldRow>
            <FieldRow label="Cover image URL (optional)" error={errors.coverImage} htmlFor="tr-cover">
              <input id="tr-cover" className={inputCls(!!errors.coverImage)} value={editing.draft.coverImage} onChange={(e) => set("coverImage", e.target.value)} />
            </FieldRow>
            <div className="sm:col-span-2">
              <FieldRow label="Content (optional if a link is given)" error={errors.body} htmlFor="tr-body">
                <textarea id="tr-body" className={`${inputCls(!!errors.body)} h-40 py-2`} value={editing.draft.body} onChange={(e) => set("body", e.target.value)} maxLength={20000} />
              </FieldRow>
            </div>
            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" className="size-4 accent-blue-600" checked={editing.draft.isPublished} onChange={(e) => set("isPublished", e.target.checked)} />
              Published (visible to agents)
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" className="size-4 accent-blue-600" checked={editing.draft.isFeatured} onChange={(e) => set("isFeatured", e.target.checked)} />
              Featured
            </label>
          </div>
        )}
      </Modal>
    </div>
  );
}
