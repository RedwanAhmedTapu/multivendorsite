"use client";

// components/admin/theme-palettes/PaletteEditor.tsx
//
// Palette create + edit surface for /admin-dashboard/themes[/new|/:id].
//
// Edit-mode protocol (mirrors the product card editor):
//   * edits stay LOCAL until "Save draft";
//   * Save sends a minimal PATCH built by buildUpdatePayload() including the
//     updatedAt stamp the editor loaded (expectedUpdatedAt) — the backend
//     rejects stale saves with 409 DRAFT_CONFLICT and the editor offers a
//     reload instead of overwriting another admin's work;
//   * PUBLISHED palettes are frozen server-side — the editor switches to a
//     read-only view with a Duplicate escape hatch.
// Live preview is scoped to [data-palette-preview] only (never :root).
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Copy,
  Info,
  Loader2,
  Lock,
  RefreshCw,
  RotateCcw,
  Trash2,
  UploadCloud,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useArchivePaletteMutation,
  useCreatePaletteMutation,
  useDeletePaletteMutation,
  useDuplicatePaletteMutation,
  useGetPaletteQuery,
  usePublishPaletteMutation,
  useRestorePresetDefaultMutation,
  useUpdatePaletteMutation,
  type PaletteDetail,
} from "@/features/themePaletteApi";
import { COMPANION_TOKENS, type PaletteTokens, type SemanticToken } from "@/lib/palette/tokens";
import { PALETTE_PRESETS, getPalettePreset } from "@/lib/palette/presets";
import {
  TOKEN_GROUPS,
  buildUpdatePayload,
  canArchivePalette,
  canDeletePalette,
  canPublishPalette,
  canRestoreDefaultPalette,
  canRollbackPalette,
  describePaletteError,
  isConflictError,
  isEditorDirty,
  resolvedForDisplay,
  sanitizeTokens,
  tokenLabel,
  validateDarkDraft,
  validateTokenDraft,
  type EditorBaseline,
  type TokenFieldErrors,
} from "@/lib/palette/editor";
import { TokenField } from "./TokenField";
import { PalettePreview } from "./PalettePreview";
import { VersionHistory } from "./VersionHistory";

type Notice = { tone: "success" | "warning" | "info" | "error"; message: string; conflict?: boolean };
type ConfirmKind = "archive" | "delete" | "restore-default";
type TokenTab = "light" | "dark";
type MainTab = "tokens" | "versions";

const COMPANION_SET: ReadonlySet<string> = new Set(COMPANION_TOKENS);
const formatTime = (iso: string | null) => (iso ? new Date(iso).toLocaleString() : "—");

interface DraftState {
  name: string;
  description: string;
  light: PaletteTokens;
  dark: PaletteTokens;
}

function baselineFromDetail(detail: PaletteDetail): EditorBaseline {
  return {
    name: detail.name,
    description: detail.description ?? "",
    tokens: detail.tokens,
    darkTokens: detail.darkTokens,
    updatedAt: detail.updatedAt,
  };
}

function draftFromDetail(detail: PaletteDetail): DraftState {
  return {
    name: detail.name,
    description: detail.description ?? "",
    light: { ...detail.tokens },
    dark: { ...(detail.darkTokens ?? {}) },
  };
}

const EMPTY_DRAFT: DraftState = { name: "", description: "", light: {}, dark: {} };

export function PaletteEditor(props: { mode: "create" | "edit"; paletteId?: string }) {
  const router = useRouter();
  const isCreate = props.mode === "create";

  // ── data ──
  const detailQuery = useGetPaletteQuery(props.paletteId ?? "", { skip: isCreate });
  const detail = detailQuery.data?.data ?? null;

  const [createPalette, createState] = useCreatePaletteMutation();
  const [updatePalette, updateState] = useUpdatePaletteMutation();
  const [publishPalette, publishState] = usePublishPaletteMutation();
  const [archivePalette, archiveState] = useArchivePaletteMutation();
  const [deletePalette, deleteState] = useDeletePaletteMutation();
  const [restoreDefault, restoreState] = useRestorePresetDefaultMutation();
  const [duplicatePalette, duplicateState] = useDuplicatePaletteMutation();
  const busy =
    createState.isLoading ||
    updateState.isLoading ||
    publishState.isLoading ||
    archiveState.isLoading ||
    deleteState.isLoading ||
    restoreState.isLoading ||
    duplicateState.isLoading;

  // ── local state ──
  const [draft, setDraft] = useState<DraftState>(EMPTY_DRAFT);
  const [baseline, setBaseline] = useState<EditorBaseline | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [remoteChanged, setRemoteChanged] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [tokenTab, setTokenTab] = useState<TokenTab>("light");
  const [mainTab, setMainTab] = useState<MainTab>("tokens");
  const [confirm, setConfirm] = useState<ConfirmKind | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishNote, setPublishNote] = useState("");
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const adoptNext = useRef(false);

  // ── adopt server data (never silently move the version stamp under edits) ──
  const baselineRef = useRef(baseline);
  baselineRef.current = baseline;
  const dirtyRef = useRef(false);
  useEffect(() => {
    if (!detail) return;
    const current = baselineRef.current;
    if (!current || !dirtyRef.current || adoptNext.current) {
      adoptNext.current = false;
      setBaseline(baselineFromDetail(detail));
      setDraft(draftFromDetail(detail));
      setRemoteChanged(false);
    } else if (detail.updatedAt !== current.updatedAt) {
      setRemoteChanged(true);
    }
  }, [detail]);

  // ── derived state ──
  const status = detail?.status ?? null;
  const readOnly = !isCreate && status !== "DRAFT";
  const dirty = isCreate
    ? draft.name.trim() !== "" || draft.description.trim() !== "" || Object.keys(draft.light).length > 0 || Object.keys(draft.dark).length > 0
    : baseline !== null &&
      isEditorDirty(
        { name: draft.name, description: draft.description, tokens: draft.light, darkTokens: draft.dark },
        baseline,
      );
  dirtyRef.current = dirty;

  const lightValidation = useMemo(() => validateTokenDraft(draft.light), [draft.light]);
  const darkValidation = useMemo(() => validateDarkDraft(draft.dark), [draft.dark]);
  const fieldErrors: TokenFieldErrors = tokenTab === "light" ? lightValidation.errors : darkValidation.errors;
  const nameTrimmed = draft.name.trim();
  const nameValid = nameTrimmed.length > 0 && nameTrimmed.length <= 120;
  const formValid = nameValid && lightValidation.ok && darkValidation.ok;
  const resolvedLight = useMemo(() => resolvedForDisplay(draft.light), [draft.light]);

  // ── unsaved-changes guard ──
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  // ── field updates ──
  const setToken = useCallback(
    (tab: TokenTab) => (token: SemanticToken, value: string) => {
      adoptNext.current = false;
      setDraft((d) => (tab === "light" ? { ...d, light: { ...d.light, [token]: value } } : { ...d, dark: { ...d.dark, [token]: value } }));
    },
    [],
  );
  const clearToken = useCallback(
    (tab: TokenTab) => (token: SemanticToken) => {
      adoptNext.current = false;
      setDraft((d) => {
        const map = tab === "light" ? { ...d.light } : { ...d.dark };
        delete map[token];
        return tab === "light" ? { ...d, light: map } : { ...d, dark: map };
      });
    },
    [],
  );

  const applySeed = (presetId: string) => {
    const preset = getPalettePreset(presetId);
    if (!preset) return;
    if (dirty && !window.confirm(`Replace the current colors with the ${preset.name} preset?`)) return;
    setDraft((d) => ({ ...d, light: { ...preset.tokens }, dark: { ...(preset.darkTokens ?? {}) } }));
    setNotice({ tone: "info", message: `${preset.name} preset loaded into the editor. Save to keep it.` });
  };

  // ── outcome reporting ──
  const reportError = useCallback((error: unknown) => {
    if (isConflictError(error)) {
      setNotice({ tone: "error", message: describePaletteError(error).message, conflict: true });
      toast.error("This palette was changed elsewhere. Reload before saving.");
      return;
    }
    const described = describePaletteError(error);
    if (described.kind === "name-taken") setNameError(described.message);
    setNotice({ tone: "error", message: described.message });
    toast.error(described.message);
  }, []);

  const reloadLatest = () => {
    if (dirty && !window.confirm("Reloading replaces your unsaved changes with the latest saved palette. Continue?")) return;
    adoptNext.current = true;
    setNotice(null);
    void detailQuery.refetch();
  };

  // ── actions ──
  const handleCreate = async () => {
    if (!formValid) return;
    try {
      const dark = sanitizeTokens(draft.dark);
      const res = await createPalette({
        name: nameTrimmed,
        ...(draft.description.trim() !== "" ? { description: draft.description.trim() } : {}),
        tokens: sanitizeTokens(draft.light),
        ...(Object.keys(dark).length > 0 ? { darkTokens: dark } : {}),
      }).unwrap();
      toast.success(res.message ?? "Palette created as draft");
      router.push(`/admin-dashboard/themes/${res.data.id}`);
    } catch (error) {
      reportError(error);
    }
  };

  const handleSave = async () => {
    if (!baseline || !props.paletteId || !formValid) return;
    try {
      const payload = buildUpdatePayload(
        { name: draft.name, description: draft.description, tokens: draft.light, darkTokens: draft.dark },
        baseline,
      );
      const res = await updatePalette({ id: props.paletteId, ...payload }).unwrap();
      setNameError(null);
      adoptNext.current = true;
      setBaseline((b) => (b ? { ...b, updatedAt: res.data.updatedAt, name: res.data.name, description: res.data.description ?? "", tokens: res.data.tokens, darkTokens: res.data.darkTokens } : b));
      setDraft((d) => ({ ...d, light: { ...res.data.tokens }, dark: { ...(res.data.darkTokens ?? {}) } }));
      setNotice({ tone: "success", message: res.message ?? "Palette saved" });
      toast.success("Palette saved");
    } catch (error) {
      reportError(error);
    }
  };

  const runPublish = async () => {
    if (!props.paletteId) return;
    try {
      const res = await publishPalette({ id: props.paletteId, ...(publishNote.trim() !== "" ? { note: publishNote.trim() } : {}) }).unwrap();
      toast.success(res.message ?? `Palette published as version ${res.data.version}`);
      setPublishOpen(false);
      setPublishNote("");
      adoptNext.current = true;
    } catch (error) {
      reportError(error);
    }
  };

  const runConfirm = async () => {
    if (!confirm || !props.paletteId) return;
    try {
      if (confirm === "archive") {
        const res = await archivePalette(props.paletteId).unwrap();
        toast.success(res.message ?? "Palette archived");
        adoptNext.current = true;
      } else if (confirm === "restore-default") {
        const res = await restoreDefault(props.paletteId).unwrap();
        toast.success(res.message ?? "Palette restored to built-in defaults");
        adoptNext.current = true;
      } else {
        const res = await deletePalette(props.paletteId).unwrap();
        toast.success(res.message ?? "Palette deleted");
        router.push("/admin-dashboard/themes");
        return;
      }
      setConfirm(null);
    } catch (error) {
      reportError(error);
    }
  };

  const handleDuplicate = async () => {
    if (!props.paletteId) return;
    try {
      const res = await duplicatePalette(props.paletteId).unwrap();
      toast.success(res.message ?? "Palette duplicated as draft");
      router.push(`/admin-dashboard/themes/${res.data.id}`);
    } catch (error) {
      reportError(error);
    }
  };

  // ── render states ──
  if (!isCreate && detailQuery.isLoading) {
    return (
      <div className="flex items-center gap-2 p-8 text-sm text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Loading palette…
      </div>
    );
  }
  if (!isCreate && (detailQuery.isError || !detail)) {
    return (
      <div className="m-6 rounded-lg border border-red-200 bg-red-50 p-6 text-sm">
        <p className="flex items-center gap-2 font-semibold text-red-700">
          <AlertTriangle className="h-4 w-4" aria-hidden="true" /> Could not load this palette
        </p>
        <p className="mt-1 text-red-600">{detailQuery.error ? describePaletteError(detailQuery.error).message : "Palette not found."}</p>
        <div className="mt-3 flex gap-2">
          <Button variant="outline" size="sm" onClick={() => void detailQuery.refetch()}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" /> Try again
          </Button>
          <Button variant="ghost" size="sm" onClick={() => router.push("/admin-dashboard/themes")}>
            Back to palettes
          </Button>
        </div>
      </div>
    );
  }

  const actionState = detail
    ? {
        kind: detail.kind,
        status: detail.status,
        assignmentCount: detail.assignments.length,
        versionCount: detail._count.versions,
      }
    : null;

  return (
    <div className="space-y-5 p-4 md:p-6">
      {/* header */}
      <header className="flex flex-col gap-1">
        <button type="button" onClick={() => router.push("/admin-dashboard/themes")} className="w-fit text-xs text-indigo-600 hover:underline">
          ← All palettes
        </button>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold text-gray-900">{isCreate ? "New palette" : detail?.name}</h1>
          {detail && (
            <>
              <StatusBadge status={detail.status} />
              <span className="rounded-full border border-indigo-200 px-2 py-0.5 text-xs font-medium text-indigo-700">
                {detail.kind === "PRESET" ? "Built-in" : "Custom"}
              </span>
              {detail.status !== "DRAFT" && (
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">v{detail.version}</span>
              )}
            </>
          )}
          {dirty && !isCreate && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">Unsaved changes</span>
          )}
        </div>
        {detail && (
          <p className="text-xs text-gray-500">
            Last saved {formatTime(detail.updatedAt)}
            {detail.publishedAt ? ` · published ${formatTime(detail.publishedAt)}` : " · never published"}
            {detail.assignments.length > 0 ? ` · assigned to ${detail.assignments.length} ${detail.assignments.length === 1 ? "scope" : "scopes"}` : ""}
          </p>
        )}
      </header>

      {/* notices */}
      {readOnly && (
        <NoticeBox
          notice={{
            tone: "info",
            message:
              status === "PUBLISHED"
                ? "Published palettes are frozen so live data never changes silently. Duplicate this palette to iterate, or roll back a previous version."
                : "Archived palettes are read-only. Roll back a version to revive it, or duplicate it into a new draft.",
          }}
          icon={<Lock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />}
        />
      )}
      {remoteChanged && (
        <NoticeBox
          notice={{ tone: "warning", message: "This palette was changed elsewhere while you were editing.", conflict: true }}
          onReload={reloadLatest}
        />
      )}
      {notice && <NoticeBox notice={notice} onReload={reloadLatest} onDismiss={() => setNotice(null)} />}

      {/* actions */}
      <section aria-label="Palette actions" className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-white p-3">
        {isCreate ? (
          <>
            <Button size="sm" className="bg-teal-600 hover:bg-teal-700" disabled={!formValid || busy} onClick={() => void handleCreate()}>
              {createState.isLoading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : null}
              Create draft palette
            </Button>
            {!formValid && <span className="text-xs text-gray-500">A name and valid core colors are required.</span>}
          </>
        ) : (
          <>
            {!readOnly && (
              <Button
                size="sm"
                className="bg-teal-600 hover:bg-teal-700"
                disabled={!dirty || !formValid || busy}
                title={!dirty ? "No changes to save" : !formValid ? "Fix the invalid fields first" : undefined}
                onClick={() => void handleSave()}
              >
                {updateState.isLoading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : null}
                Save draft
              </Button>
            )}
            {actionState && canPublishPalette(actionState) && (
              <Button size="sm" variant="outline" disabled={busy || dirty} title={dirty ? "Save your changes before publishing" : undefined} onClick={() => setPublishOpen(true)}>
                <UploadCloud className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" /> Publish
              </Button>
            )}
            <Button size="sm" variant="outline" disabled={busy} onClick={() => void handleDuplicate()}>
              <Copy className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" /> Duplicate
            </Button>
            {actionState && canRestoreDefaultPalette(actionState) && (
              <Button size="sm" variant="outline" disabled={busy} onClick={() => setConfirm("restore-default")}>
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" /> Restore default
              </Button>
            )}
            {actionState && canArchivePalette(actionState) && (
              <Button size="sm" variant="outline" disabled={busy} onClick={() => setConfirm("archive")}>
                <Archive className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" /> Archive
              </Button>
            )}
            {actionState && canDeletePalette(actionState) && (
              <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700" disabled={busy} onClick={() => setConfirm("delete")}>
                <Trash2 className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" /> Delete
              </Button>
            )}
          </>
        )}
      </section>

      {/* tabs (edit mode only) */}
      {!isCreate && (
        <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1" role="tablist">
          {(["tokens", "versions"] as const).map((tab) => (
            <button
              key={tab}
              role="tab"
              aria-selected={mainTab === tab}
              onClick={() => setMainTab(tab)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                mainTab === tab ? "bg-indigo-600 text-white" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {tab === "tokens" ? "Tokens" : `Version history${detail ? ` (${detail._count.versions})` : ""}`}
            </button>
          ))}
        </div>
      )}

      {mainTab === "versions" && detail && props.paletteId ? (
        <VersionHistory
          paletteId={props.paletteId}
          paletteName={detail.name}
          currentVersion={detail.version}
          canRollback={canRollbackPalette({ kind: detail.kind, status: detail.status, assignmentCount: detail.assignments.length, versionCount: detail._count.versions })}
        />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          {/* form column */}
          <div className="space-y-4">
            {/* identity */}
            <section className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
              <h2 className="text-sm font-semibold text-gray-800">Identity</h2>
              <div>
                <label htmlFor="palette-name" className="text-xs font-medium text-gray-700">
                  Name <span className="text-red-500">*</span>
                </label>
                <Input
                  id="palette-name"
                  value={draft.name}
                  disabled={readOnly || busy || !!(detail && detail.kind === "PRESET")}
                  title={detail?.kind === "PRESET" ? "Built-in presets cannot be renamed" : undefined}
                  onChange={(e) => {
                    setDraft((d) => ({ ...d, name: e.target.value }));
                    setNameError(null);
                  }}
                  placeholder="e.g. Festive Sale"
                  className="mt-1"
                  aria-invalid={!nameValid || !!nameError}
                />
                {!nameValid && draft.name.trim() !== "" && <p className="mt-1 text-[11px] text-red-600">Maximum 120 characters.</p>}
                {!nameValid && draft.name.trim() === "" && <p className="mt-1 text-[11px] text-red-600">A name is required.</p>}
                {nameError && <p className="mt-1 text-[11px] text-red-600">{nameError}</p>}
              </div>
              <div>
                <label htmlFor="palette-description" className="text-xs font-medium text-gray-700">
                  Description
                </label>
                <Textarea
                  id="palette-description"
                  value={draft.description}
                  disabled={readOnly || busy}
                  onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                  placeholder="What is this palette for?"
                  rows={2}
                  className="mt-1"
                />
              </div>
              {isCreate && (
                <div>
                  <label htmlFor="palette-seed" className="text-xs font-medium text-gray-700">
                    Start from a preset
                  </label>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {PALETTE_PRESETS.map((preset) => (
                      <Button key={preset.id} type="button" size="sm" variant="outline" onClick={() => applySeed(preset.id)}>
                        {preset.name}
                      </Button>
                    ))}
                  </div>
                  <p className="mt-1 text-[11px] text-gray-500">Loads the preset&apos;s colors into the editor — nothing is saved until you create the palette.</p>
                </div>
              )}
            </section>

            {/* token editor */}
            <section className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-gray-800">Semantic tokens</h2>
                <div className="flex items-center gap-1 rounded-md border border-gray-200 p-0.5" role="group" aria-label="Token set">
                  {(["light", "dark"] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setTokenTab(tab)}
                      className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                        tokenTab === tab ? "bg-indigo-600 text-white" : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {tab === "light" ? "Light" : "Dark overrides"}
                    </button>
                  ))}
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {tokenTab === "light"
                  ? "Core tokens are required. Companion tokens can be left empty to use the derived default."
                  : "Optional: override any token for dark mode. Empty fields inherit the light values."}
              </p>
              <div className="mt-2 divide-y divide-gray-100">
                {TOKEN_GROUPS.map((group) => {
                  const isOpen = openGroups[group.id] ?? !group.advanced;
                  return (
                    <div key={group.id}>
                      <button
                        type="button"
                        onClick={() => setOpenGroups((g) => ({ ...g, [group.id]: !isOpen }))}
                        className="flex w-full items-center justify-between py-2.5 text-left"
                        aria-expanded={isOpen}
                      >
                        <span>
                          <span className="text-sm font-medium text-gray-800">{group.title}</span>
                          <span className="ml-2 text-xs text-gray-400">{group.tokens.length} tokens</span>
                        </span>
                        {isOpen ? (
                          <ChevronDown className="h-4 w-4 text-gray-400" aria-hidden="true" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-gray-400" aria-hidden="true" />
                        )}
                      </button>
                      {isOpen && (
                        <div className="pb-2 pl-1">
                          <p className="mb-1 text-xs text-gray-500">{group.description}</p>
                          {group.tokens.map((token) => {
                            const map = tokenTab === "light" ? draft.light : draft.dark;
                            const canClear = tokenTab === "dark" || COMPANION_SET.has(token);
                            return (
                              <TokenField
                                key={`${tokenTab}-${token}`}
                                token={token}
                                label={tokenLabel(token)}
                                value={map[token] ?? ""}
                                inheritedValue={tokenTab === "dark" ? resolvedLight[token] : canClear ? resolvedLight[token] : undefined}
                                error={fieldErrors[token]}
                                disabled={readOnly || busy}
                                onClear={canClear ? () => clearToken(tokenTab)(token) : undefined}
                                onChange={setToken(tokenTab)}
                              />
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          {/* preview column */}
          <div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 xl:sticky xl:top-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-gray-800">Live preview</h2>
                <span className="text-xs text-gray-500">{tokenTab === "dark" ? "Light tokens + dark overrides" : "Light tokens"}</span>
              </div>
              <PalettePreview tokens={draft.light} darkTokens={draft.dark} mode={tokenTab} />
              <p className="mt-3 text-xs text-gray-500">
                Scoped to this panel only — nothing here touches the admin UI or the live site
                {dirty ? " (showing unsaved edits)." : "."}
              </p>
              {(!lightValidation.ok || !darkValidation.ok) && (
                <p className="mt-2 flex items-start gap-1.5 text-xs text-red-600">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  Some values are invalid and cannot be saved; the preview falls back to defaults for them.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* confirm dialog (archive / delete / restore default) */}
      <AlertDialog open={confirm !== null} onOpenChange={(open) => !open && !busy && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm === "archive" ? `Archive “${detail?.name}”?` : confirm === "delete" ? `Delete “${detail?.name}”?` : `Restore “${detail?.name}” to the built-in default?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm === "archive"
                ? "The palette will no longer be assignable. Version history is kept and rollback remains available."
                : confirm === "delete"
                  ? "This palette has never been published and is not assigned anywhere. Deleting it cannot be undone."
                  : detail?.status === "DRAFT"
                    ? "The draft tokens are reset to the exact built-in preset values. Publish afterwards to record a version."
                    : "The palette is reset to the exact built-in preset values and published as a new version immediately."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              className={confirm === "delete" || confirm === "archive" ? "bg-red-600 hover:bg-red-700" : undefined}
              onClick={async (e) => {
                e.preventDefault();
                await runConfirm();
              }}
            >
              {busy ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : null}
              {confirm === "archive" ? "Archive" : confirm === "delete" ? "Delete" : "Restore default"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* publish dialog (optional version note) */}
      <Dialog open={publishOpen} onOpenChange={(open) => !open && !publishState.isLoading && setPublishOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Publish “{detail?.name}”?</DialogTitle>
            <DialogDescription>
              The current tokens are frozen as version {(detail?.version ?? 0) + 1} and the palette becomes available for
              assignments. Publishing never changes the live site by itself.
            </DialogDescription>
          </DialogHeader>
          <div>
            <label htmlFor="publish-note" className="text-xs font-medium text-gray-700">
              Version note (optional)
            </label>
            <Textarea
              id="publish-note"
              value={publishNote}
              onChange={(e) => setPublishNote(e.target.value)}
              placeholder="e.g. Eid campaign colors"
              rows={2}
              className="mt-1"
              maxLength={300}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" disabled={publishState.isLoading} onClick={() => setPublishOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" className="bg-teal-600 hover:bg-teal-700" disabled={publishState.isLoading} onClick={() => void runPublish()}>
              {publishState.isLoading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : null}
              Publish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── small display pieces ─────────────────────────────────────────────────────

function StatusBadge({ status }: { status: "DRAFT" | "PUBLISHED" | "ARCHIVED" }) {
  const style =
    status === "DRAFT"
      ? "bg-amber-100 text-amber-800"
      : status === "PUBLISHED"
        ? "bg-teal-100 text-teal-800"
        : "bg-slate-200 text-slate-600";
  const label = status === "DRAFT" ? "Draft" : status === "PUBLISHED" ? "Published" : "Archived";
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${style}`}>{label}</span>;
}

const NOTICE_STYLE = {
  success: { box: "border-teal-200 bg-teal-50 text-teal-800", Icon: CheckCircle2 },
  warning: { box: "border-amber-200 bg-amber-50 text-amber-800", Icon: AlertTriangle },
  info: { box: "border-blue-200 bg-blue-50 text-blue-800", Icon: Info },
  error: { box: "border-red-200 bg-red-50 text-red-700", Icon: XCircle },
} as const;

function NoticeBox({
  notice,
  onReload,
  onDismiss,
  icon,
}: {
  notice: Notice;
  onReload?: () => void;
  onDismiss?: () => void;
  icon?: React.ReactNode;
}) {
  const { box, Icon } = NOTICE_STYLE[notice.tone];
  return (
    <div role={notice.tone === "error" ? "alert" : "status"} className={`flex items-start gap-2 rounded-lg border px-4 py-3 text-sm ${box}`}>
      {icon ?? <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />}
      <p className="flex-1">{notice.message}</p>
      {notice.conflict && onReload && (
        <button type="button" onClick={onReload} className="shrink-0 text-xs font-semibold underline underline-offset-2">
          Reload latest
        </button>
      )}
      {onDismiss && (
        <button type="button" onClick={onDismiss} className="shrink-0 text-xs opacity-70 hover:opacity-100" aria-label="Dismiss message">
          ✕
        </button>
      )}
    </div>
  );
}
