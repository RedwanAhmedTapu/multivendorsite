"use client";

// components/chatbox/settings/AutoReplySettings.tsx
//
// Vendor auto-reply rules — list, create, edit, enable/disable, delete —
// persisted through the real API:
//   GET    /chat/auto-replies/mine   (the vendor's own rules, active + inactive)
//   POST   /chat/auto-replies        PATCH /chat/auto-replies/:id   DELETE /chat/auto-replies/:id
// The server derives the vendor from the session and forces scope VENDOR;
// nothing here sends a vendor id or scope. Only the triggers the engine runs
// are offered (see lib/chat/chat-settings.ts).

import React, { useState } from "react";
import { Bot, Plus, Pencil, Trash2, Loader2, Info } from "lucide-react";
import {
  useGetMyAutoRepliesQuery,
  useCreateAutoReplyMutation,
  useUpdateAutoReplyMutation,
  useDeleteAutoReplyMutation,
  type ChatAutoReply,
} from "@/features/chatApi";
import {
  SUPPORTED_AUTO_REPLY_TRIGGERS,
  UNSUPPORTED_TRIGGER_COPY,
  LIMITS,
  emptyAutoReplyDraft,
  autoReplyToDraft,
  validateAutoReplyDraft,
  toAutoReplyPayload,
  friendlyError,
  type AutoReplyDraft,
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

export function AutoReplySettings() {
  const { data, isLoading, isError, error, refetch, isFetching } = useGetMyAutoRepliesQuery();
  const [createRule, { isLoading: creating }] = useCreateAutoReplyMutation();
  const [updateRule, { isLoading: updating }] = useUpdateAutoReplyMutation();
  const [deleteRule] = useDeleteAutoReplyMutation();

  const [editing, setEditing] = useState<"new" | string | null>(null);
  const [draft, setDraft] = useState<AutoReplyDraft>(emptyAutoReplyDraft());
  const [errors, setErrors] = useState<FieldErrors>({});
  const [notice, setNotice] = useState<Notice>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const rules: ChatAutoReply[] = data?.data ?? [];
  const forbidden = (error as { status?: number } | undefined)?.status === 403;
  const saving = creating || updating;

  const openNew = () => {
    setEditing("new");
    setDraft(emptyAutoReplyDraft());
    setErrors({});
    setNotice(null);
  };
  const openEdit = (rule: ChatAutoReply) => {
    setEditing(rule.id);
    setDraft(autoReplyToDraft(rule));
    setErrors({});
    setNotice(null);
  };
  const closeEditor = () => {
    setEditing(null);
    setErrors({});
  };

  const save = async () => {
    const e = validateAutoReplyDraft(draft);
    setErrors(e);
    if (Object.keys(e).length) return;
    const body = toAutoReplyPayload(draft);
    try {
      if (editing === "new") await createRule(body).unwrap();
      else if (editing) await updateRule({ id: editing, ...body }).unwrap();
      setNotice({ kind: "success", text: editing === "new" ? "Auto reply created." : "Auto reply saved." });
      setEditing(null);
    } catch (err) {
      if ((err as { status?: number })?.status === 404) refetch();
      setNotice({ kind: "error", text: friendlyError(err) });
    }
  };

  const toggle = async (rule: ChatAutoReply, next: boolean) => {
    setBusyId(rule.id);
    setNotice(null);
    try {
      await updateRule({ id: rule.id, isActive: next }).unwrap();
      setNotice({ kind: "success", text: next ? `“${rule.name}” is on.` : `“${rule.name}” is off.` });
    } catch (err) {
      setNotice({ kind: "error", text: friendlyError(err, "update the rule") });
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (rule: ChatAutoReply) => {
    setBusyId(rule.id);
    setNotice(null);
    try {
      await deleteRule(rule.id).unwrap();
      setConfirmDelete(null);
      if (editing === rule.id) setEditing(null);
      setNotice({ kind: "success", text: "Auto reply deleted." });
    } catch (err) {
      if ((err as { status?: number })?.status === 404) refetch();
      setNotice({ kind: "error", text: friendlyError(err, "delete the rule") });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <ChatSettingsShell
      title="Auto replies"
      description="Automatic answers sent on your store's behalf in customer conversations."
      actions={
        !isLoading && !isError && editing !== "new" ? (
          <button type="button" className={primaryBtn} onClick={openNew}>
            <Plus className="h-4 w-4" aria-hidden /> New auto reply
          </button>
        ) : null
      }
    >
      <div aria-live="polite" className="mb-3 min-h-0">
        {notice ? (
          <p
            role={notice.kind === "error" ? "alert" : "status"}
            className={`rounded-lg px-3 py-2 text-sm ${notice.kind === "error" ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}
          >
            {notice.text}
          </p>
        ) : null}
      </div>

      {editing === "new" ? (
        <RuleEditor draft={draft} setDraft={setDraft} errors={errors} saving={saving} onSave={save} onCancel={closeEditor} isNew />
      ) : null}

      {isLoading ? (
        <SettingsLoading label="Loading your auto replies…" />
      ) : isError ? (
        <SettingsError forbidden={forbidden} what="auto replies" onRetry={forbidden ? undefined : refetch} />
      ) : rules.length === 0 && editing !== "new" ? (
        <SettingsEmpty
          icon={<Bot className="h-5 w-5" aria-hidden />}
          title="No auto replies yet"
          hint="Greet first-time customers or answer common questions automatically, for example shipping times."
          action={
            <button type="button" className={primaryBtn} onClick={openNew}>
              <Plus className="h-4 w-4" aria-hidden /> Create your first auto reply
            </button>
          }
        />
      ) : (
        <ul className="flex flex-col gap-3" aria-label="Your auto replies" aria-busy={isFetching}>
          {rules.map((rule) => {
            const unsupported = UNSUPPORTED_TRIGGER_COPY[rule.triggerType];
            const trigger = SUPPORTED_AUTO_REPLY_TRIGGERS.find((t) => t.value === rule.triggerType);
            if (editing === rule.id) {
              return (
                <li key={rule.id}>
                  <RuleEditor draft={draft} setDraft={setDraft} errors={errors} saving={saving} onSave={save} onCancel={closeEditor} unsupportedNote={unsupported} />
                </li>
              );
            }
            return (
              <li key={rule.id} className={`rounded-xl border bg-white p-4 shadow-sm transition-colors ${rule.isActive ? "border-slate-200" : "border-slate-200 bg-slate-50/60"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-sm font-semibold text-slate-900">{rule.name}</h2>
                      <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">
                        {trigger?.label ?? rule.triggerType}
                      </span>
                      {!rule.isActive ? <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-600">Off</span> : null}
                    </div>
                    {rule.triggerType === "KEYWORD" && rule.keywords?.length ? (
                      <p className="mt-1.5 flex flex-wrap gap-1" aria-label="Keywords">
                        {rule.keywords.map((k) => (
                          <span key={k} className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-600">
                            {k}
                          </span>
                        ))}
                      </p>
                    ) : null}
                    <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm text-slate-600">{rule.message}</p>
                    <p className="mt-2 text-xs text-slate-400">
                      Up to {rule.maxTriggersPerConv} time{rule.maxTriggersPerConv === 1 ? "" : "s"} per conversation · sent {rule.triggerCount ?? 0} time
                      {(rule.triggerCount ?? 0) === 1 ? "" : "s"} so far
                    </p>
                    {unsupported ? (
                      <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-amber-700">
                        <Info className="h-3.5 w-3.5" aria-hidden /> {unsupported} Edit it to use a supported trigger.
                      </p>
                    ) : null}
                  </div>
                  <Toggle checked={rule.isActive} disabled={busyId === rule.id} onChange={(next) => toggle(rule, next)} label={`${rule.isActive ? "Turn off" : "Turn on"} ${rule.name}`} />
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-3">
                  {confirmDelete === rule.id ? (
                    <>
                      <span className="mr-auto text-xs font-medium text-slate-600">Delete “{rule.name}”? This can&apos;t be undone.</span>
                      <button type="button" className={secondaryBtn + " !px-3 !py-1.5 !text-xs"} onClick={() => setConfirmDelete(null)}>
                        Cancel
                      </button>
                      <button type="button" className={dangerBtn} disabled={busyId === rule.id} onClick={() => remove(rule)}>
                        {busyId === rule.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : null} Delete
                      </button>
                    </>
                  ) : (
                    <>
                      <button type="button" className={secondaryBtn + " !px-3 !py-1.5 !text-xs"} onClick={() => openEdit(rule)} aria-label={`Edit ${rule.name}`}>
                        <Pencil className="h-3.5 w-3.5" aria-hidden /> Edit
                      </button>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                        onClick={() => setConfirmDelete(rule.id)}
                        aria-label={`Delete ${rule.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden /> Delete
                      </button>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-6 text-xs leading-relaxed text-slate-400">
        Auto replies are sent as your store. Inactivity and away-mode replies, match types and cooldowns aren&apos;t available yet.
      </p>
    </ChatSettingsShell>
  );
}

function RuleEditor({
  draft,
  setDraft,
  errors,
  saving,
  onSave,
  onCancel,
  isNew,
  unsupportedNote,
}: {
  draft: AutoReplyDraft;
  setDraft: React.Dispatch<React.SetStateAction<AutoReplyDraft>>;
  errors: FieldErrors;
  saving: boolean;
  onSave: () => void;
  onCancel: () => void;
  isNew?: boolean;
  unsupportedNote?: string;
}) {
  const set = <K extends keyof AutoReplyDraft>(k: K, v: AutoReplyDraft[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const id = isNew ? "ar-new" : "ar-edit";
  return (
    <form
      className="mb-4 rounded-xl border border-indigo-200 bg-white p-4 shadow-sm"
      aria-label={isNew ? "New auto reply" : "Edit auto reply"}
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        onSave();
      }}
    >
      <h2 className="mb-3 text-sm font-semibold text-slate-900">{isNew ? "New auto reply" : "Edit auto reply"}</h2>
      {unsupportedNote ? <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">{unsupportedNote} Saving switches it to the trigger chosen below.</p> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor={`${id}-name`} className="mb-1 block text-xs font-semibold text-slate-700">
            Name
          </label>
          <input
            id={`${id}-name`}
            className={inputClass}
            value={draft.name}
            maxLength={LIMITS.autoReplyName}
            onChange={(e) => set("name", e.target.value)}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? `${id}-name-err` : undefined}
            placeholder="e.g. Welcome message"
          />
          <FieldError id={`${id}-name-err`} message={errors.name} />
        </div>

        <fieldset className="sm:col-span-2">
          <legend className="mb-1 block text-xs font-semibold text-slate-700">When is it sent?</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {SUPPORTED_AUTO_REPLY_TRIGGERS.map((t) => (
              <label
                key={t.value}
                className={`flex cursor-pointer items-start gap-2 rounded-lg border p-3 text-sm ${draft.triggerType === t.value ? "border-indigo-300 bg-indigo-50/50" : "border-slate-200"}`}
              >
                <input type="radio" name={`${id}-trigger`} className="mt-0.5 accent-indigo-600" checked={draft.triggerType === t.value} onChange={() => set("triggerType", t.value)} />
                <span>
                  <span className="block font-semibold text-slate-800">{t.label}</span>
                  <span className="block text-xs text-slate-500">{t.help}</span>
                </span>
              </label>
            ))}
          </div>
          <FieldError id={`${id}-trigger-err`} message={errors.triggerType} />
        </fieldset>

        {draft.triggerType === "KEYWORD" ? (
          <div className="sm:col-span-2">
            <label htmlFor={`${id}-keywords`} className="mb-1 block text-xs font-semibold text-slate-700">
              Keywords
            </label>
            <input
              id={`${id}-keywords`}
              className={inputClass}
              value={draft.keywordsText}
              onChange={(e) => set("keywordsText", e.target.value)}
              aria-invalid={!!errors.keywords}
              aria-describedby={`${id}-keywords-help${errors.keywords ? ` ${id}-keywords-err` : ""}`}
              placeholder="delivery, shipping, how long"
            />
            <p id={`${id}-keywords-help`} className="mt-1 text-xs text-slate-400">
              Separate with commas. The reply is sent when a message contains any of them.
            </p>
            <FieldError id={`${id}-keywords-err`} message={errors.keywords} />
          </div>
        ) : null}

        <div className="sm:col-span-2">
          <label htmlFor={`${id}-message`} className="mb-1 block text-xs font-semibold text-slate-700">
            Reply
          </label>
          <textarea
            id={`${id}-message`}
            className={inputClass + " min-h-[96px] resize-y"}
            value={draft.message}
            maxLength={LIMITS.autoReplyMessage}
            onChange={(e) => set("message", e.target.value)}
            aria-invalid={!!errors.message}
            aria-describedby={errors.message ? `${id}-message-err` : `${id}-message-count`}
            placeholder="Thanks for reaching out! We usually reply within a few hours."
          />
          <div className="flex justify-between">
            <FieldError id={`${id}-message-err`} message={errors.message} />
            <span id={`${id}-message-count`} className="ml-auto mt-1 text-[11px] text-slate-400">
              {draft.message.length}/{LIMITS.autoReplyMessage}
            </span>
          </div>
        </div>

        <div>
          <label htmlFor={`${id}-max`} className="mb-1 block text-xs font-semibold text-slate-700">
            Times per conversation
          </label>
          <input
            id={`${id}-max`}
            type="number"
            inputMode="numeric"
            min={LIMITS.maxTriggersMin}
            max={LIMITS.maxTriggersMax}
            className={inputClass}
            value={draft.maxTriggersPerConv}
            onChange={(e) => set("maxTriggersPerConv", e.target.value)}
            aria-invalid={!!errors.maxTriggersPerConv}
            aria-describedby={errors.maxTriggersPerConv ? `${id}-max-err` : undefined}
          />
          <FieldError id={`${id}-max-err`} message={errors.maxTriggersPerConv} />
        </div>

        <div className="flex items-center gap-3 self-end pb-2">
          <Toggle checked={draft.isActive} onChange={(v) => set("isActive", v)} label="Rule is on" />
          <span className="text-sm text-slate-700">{draft.isActive ? "On" : "Off"}</span>
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <button type="button" className={secondaryBtn} onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        <button type="submit" className={primaryBtn} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
          {isNew ? "Create auto reply" : "Save changes"}
        </button>
      </div>
    </form>
  );
}

export default AutoReplySettings;
