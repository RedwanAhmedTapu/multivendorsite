"use client";

// components/chatbox/settings/QuickReplySettings.tsx
//
// The vendor's saved responses — list, create, edit, turn on/off, delete —
// through the real API:
//   GET    /chat/quick-replies          (the vendor's own rows, active + inactive)
//   POST   /chat/quick-replies          PATCH /chat/quick-replies/:id   DELETE /chat/quick-replies/:id
// Only rows the server returned in the vendor's OWN list are shown and
// editable here; platform quick replies appear (read-only) in the composer.
// Bodies are whitelisted; the server refuses scope / vendorId / counters.

import React, { useState } from "react";
import { Zap, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import {
  useGetMyQuickRepliesQuery,
  useCreateQuickReplyMutation,
  useUpdateQuickReplyMutation,
  useDeleteQuickReplyMutation,
  type ChatQuickReply,
} from "@/features/chatApi";
import {
  LIMITS,
  emptyQuickReplyDraft,
  quickReplyToDraft,
  validateQuickReplyDraft,
  toQuickReplyPayload,
  friendlyError,
  type QuickReplyDraft,
  type FieldErrors,
} from "@/lib/chat/chat-settings";
import {
  ChatSettingsShell,
  SettingsLoading,
  SettingsError,
  SettingsEmpty,
  FieldError,
  Toggle,
  inputClass,
  primaryBtn,
  secondaryBtn,
  dangerBtn,
} from "./ChatSettingsShell";

type Notice = { kind: "success" | "error"; text: string } | null;

export function QuickReplySettings() {
  const { data, isLoading, isError, error, refetch, isFetching } = useGetMyQuickRepliesQuery();
  const [createQr, { isLoading: creating }] = useCreateQuickReplyMutation();
  const [updateQr, { isLoading: updating }] = useUpdateQuickReplyMutation();
  const [deleteQr] = useDeleteQuickReplyMutation();

  const [editing, setEditing] = useState<"new" | string | null>(null);
  const [draft, setDraft] = useState<QuickReplyDraft>(emptyQuickReplyDraft());
  const [errors, setErrors] = useState<FieldErrors>({});
  const [notice, setNotice] = useState<Notice>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const items: ChatQuickReply[] = data?.data ?? [];
  const forbidden = (error as { status?: number } | undefined)?.status === 403;
  const saving = creating || updating;

  const openNew = () => {
    setEditing("new");
    setDraft(emptyQuickReplyDraft());
    setErrors({});
    setNotice(null);
  };
  const openEdit = (q: ChatQuickReply) => {
    setEditing(q.id);
    setDraft(quickReplyToDraft(q));
    setErrors({});
    setNotice(null);
  };

  const save = async () => {
    const e = validateQuickReplyDraft(draft);
    setErrors(e);
    if (Object.keys(e).length) return;
    try {
      if (editing === "new") await createQr(toQuickReplyPayload(draft, "create")).unwrap();
      else if (editing) await updateQr({ id: editing, ...toQuickReplyPayload(draft, "update") }).unwrap();
      setNotice({ kind: "success", text: editing === "new" ? "Quick reply created." : "Quick reply saved." });
      setEditing(null);
    } catch (err) {
      if ((err as { status?: number })?.status === 404) refetch();
      setNotice({ kind: "error", text: friendlyError(err) });
    }
  };

  const toggle = async (q: ChatQuickReply, next: boolean) => {
    setBusyId(q.id);
    setNotice(null);
    try {
      await updateQr({ id: q.id, isActive: next }).unwrap();
      setNotice({ kind: "success", text: next ? `“${q.name}” is available in chat.` : `“${q.name}” is hidden from chat.` });
    } catch (err) {
      setNotice({ kind: "error", text: friendlyError(err, "update the quick reply") });
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (q: ChatQuickReply) => {
    setBusyId(q.id);
    setNotice(null);
    try {
      await deleteQr(q.id).unwrap();
      setConfirmDelete(null);
      if (editing === q.id) setEditing(null);
      setNotice({ kind: "success", text: "Quick reply deleted." });
    } catch (err) {
      if ((err as { status?: number })?.status === 404) refetch();
      setNotice({ kind: "error", text: friendlyError(err, "delete the quick reply") });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <ChatSettingsShell
      title="Quick replies"
      description="Saved responses you can insert into a conversation from the message box."
      actions={
        !isLoading && !isError && editing !== "new" ? (
          <button type="button" className={primaryBtn} onClick={openNew}>
            <Plus className="h-4 w-4" aria-hidden /> New quick reply
          </button>
        ) : null
      }
    >
      <div aria-live="polite" className="mb-3">
        {notice ? (
          <p
            role={notice.kind === "error" ? "alert" : "status"}
            className={`rounded-lg px-3 py-2 text-sm ${notice.kind === "error" ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}
          >
            {notice.text}
          </p>
        ) : null}
      </div>

      {editing === "new" ? <QuickReplyEditor draft={draft} setDraft={setDraft} errors={errors} saving={saving} onSave={save} onCancel={() => setEditing(null)} isNew /> : null}

      {isLoading ? (
        <SettingsLoading label="Loading your quick replies…" />
      ) : isError ? (
        <SettingsError forbidden={forbidden} what="quick replies" onRetry={forbidden ? undefined : refetch} />
      ) : items.length === 0 && editing !== "new" ? (
        <SettingsEmpty
          icon={<Zap className="h-5 w-5" aria-hidden />}
          title="No quick replies yet"
          hint="Save answers you send often — return policy, delivery times, payment options — and insert them with one click."
          action={
            <button type="button" className={primaryBtn} onClick={openNew}>
              <Plus className="h-4 w-4" aria-hidden /> Create your first quick reply
            </button>
          }
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2" aria-label="Your quick replies" aria-busy={isFetching}>
          {items.map((q) =>
            editing === q.id ? (
              <li key={q.id} className="sm:col-span-2">
                <QuickReplyEditor draft={draft} setDraft={setDraft} errors={errors} saving={saving} onSave={save} onCancel={() => setEditing(null)} />
              </li>
            ) : (
              <li key={q.id} className={`flex flex-col rounded-xl border p-4 shadow-sm ${q.isActive ? "border-slate-200 bg-white" : "border-slate-200 bg-slate-50/60"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <h2 className="truncate text-sm font-semibold text-slate-900">{q.name}</h2>
                      {q.shortcut ? <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-600">/{q.shortcut}</code> : null}
                      {!q.isActive ? <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-600">Hidden</span> : null}
                    </div>
                    {q.category ? <p className="mt-0.5 text-[11px] uppercase tracking-wide text-slate-400">{q.category}</p> : null}
                  </div>
                  <Toggle checked={q.isActive} disabled={busyId === q.id} onChange={(next) => toggle(q, next)} label={`${q.isActive ? "Hide" : "Show"} ${q.name} in chat`} />
                </div>
                <p className="mt-2 line-clamp-4 flex-1 whitespace-pre-wrap text-sm text-slate-600">{q.content}</p>
                <p className="mt-2 text-xs text-slate-400">Used {q.usageCount ?? 0} time{(q.usageCount ?? 0) === 1 ? "" : "s"}</p>
                <div className="mt-3 flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-3">
                  {confirmDelete === q.id ? (
                    <>
                      <span className="mr-auto text-xs font-medium text-slate-600">Delete “{q.name}”?</span>
                      <button type="button" className={secondaryBtn + " !px-3 !py-1.5 !text-xs"} onClick={() => setConfirmDelete(null)}>
                        Cancel
                      </button>
                      <button type="button" className={dangerBtn} disabled={busyId === q.id} onClick={() => remove(q)}>
                        {busyId === q.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : null} Delete
                      </button>
                    </>
                  ) : (
                    <>
                      <button type="button" className={secondaryBtn + " !px-3 !py-1.5 !text-xs"} onClick={() => openEdit(q)} aria-label={`Edit ${q.name}`}>
                        <Pencil className="h-3.5 w-3.5" aria-hidden /> Edit
                      </button>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                        onClick={() => setConfirmDelete(q.id)}
                        aria-label={`Delete ${q.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden /> Delete
                      </button>
                    </>
                  )}
                </div>
              </li>
            )
          )}
        </ul>
      )}
    </ChatSettingsShell>
  );
}

function QuickReplyEditor({
  draft,
  setDraft,
  errors,
  saving,
  onSave,
  onCancel,
  isNew,
}: {
  draft: QuickReplyDraft;
  setDraft: React.Dispatch<React.SetStateAction<QuickReplyDraft>>;
  errors: FieldErrors;
  saving: boolean;
  onSave: () => void;
  onCancel: () => void;
  isNew?: boolean;
}) {
  const set = <K extends keyof QuickReplyDraft>(k: K, v: QuickReplyDraft[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const id = isNew ? "qr-new" : "qr-edit";
  const field = (key: keyof QuickReplyDraft, label: string, opts: { placeholder?: string; max?: number; help?: string } = {}) => (
    <div>
      <label htmlFor={`${id}-${key}`} className="mb-1 block text-xs font-semibold text-slate-700">
        {label}
      </label>
      <input
        id={`${id}-${key}`}
        className={inputClass}
        value={draft[key]}
        maxLength={opts.max}
        onChange={(e) => set(key, e.target.value)}
        placeholder={opts.placeholder}
        aria-invalid={!!errors[key === "keywordsText" ? "keywords" : key]}
        aria-describedby={opts.help ? `${id}-${key}-help` : undefined}
      />
      {opts.help ? (
        <p id={`${id}-${key}-help`} className="mt-1 text-xs text-slate-400">
          {opts.help}
        </p>
      ) : null}
      <FieldError id={`${id}-${key}-err`} message={errors[key === "keywordsText" ? "keywords" : key]} />
    </div>
  );
  return (
    <form
      className="mb-4 rounded-xl border border-indigo-200 bg-white p-4 shadow-sm"
      aria-label={isNew ? "New quick reply" : "Edit quick reply"}
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        onSave();
      }}
    >
      <h2 className="mb-3 text-sm font-semibold text-slate-900">{isNew ? "New quick reply" : "Edit quick reply"}</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">{field("name", "Name", { placeholder: "e.g. Delivery time", max: LIMITS.quickReplyName })}</div>
        <div className="sm:col-span-2">
          <label htmlFor={`${id}-content`} className="mb-1 block text-xs font-semibold text-slate-700">
            Message
          </label>
          <textarea
            id={`${id}-content`}
            className={inputClass + " min-h-[96px] resize-y"}
            value={draft.content}
            maxLength={LIMITS.quickReplyContent}
            onChange={(e) => set("content", e.target.value)}
            aria-invalid={!!errors.content}
            placeholder="Orders inside Dhaka arrive in 1–2 days; outside Dhaka in 3–5 days."
          />
          <div className="flex justify-between">
            <FieldError id={`${id}-content-err`} message={errors.content} />
            <span className="ml-auto mt-1 text-[11px] text-slate-400">
              {draft.content.length}/{LIMITS.quickReplyContent}
            </span>
          </div>
        </div>
        {field("shortcut", "Shortcut (optional)", { placeholder: "delivery", max: LIMITS.shortcut, help: "Type it in the quick-reply search to find this reply fast." })}
        {field("category", "Category (optional)", { placeholder: "Shipping", max: LIMITS.category })}
        <div className="sm:col-span-2">{field("keywordsText", "Search keywords (optional)", { placeholder: "delivery, shipping, courier", help: "Separate with commas." })}</div>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button type="button" className={secondaryBtn} onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        <button type="submit" className={primaryBtn} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
          {isNew ? "Create quick reply" : "Save changes"}
        </button>
      </div>
    </form>
  );
}

export default QuickReplySettings;
