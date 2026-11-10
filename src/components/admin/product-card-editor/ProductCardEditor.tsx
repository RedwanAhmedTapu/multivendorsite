"use client";

// components/admin/product-card-editor/ProductCardEditor.tsx
//
// ADMIN editor for the GLOBAL product card design. Edits stay local (and in
// the live preview) until "Save draft"; "Publish" promotes the SAVED draft
// with the version this editor last saw (409 if another admin changed it).
// Every action uses the existing backend endpoints
// (features/productCardConfigApi.ts); the outcome rules — validation, error
// mapping, cache refresh only after a confirmed publish / restore — live in
// lib/product-card/editor.ts and are unit tested there.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, Info, Loader2, RefreshCw, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import type { RootState } from "@/store/store";
import { refreshStorefrontCache } from "@/features/themeApi";
import {
  useDiscardProductCardDraftMutation,
  useGetProductCardDraftQuery,
  usePublishProductCardMutation,
  useResetProductCardDraftMutation,
  useRestorePreviousProductCardMutation,
  useSaveProductCardDraftMutation,
  type ProductCardDraftData,
} from "@/features/productCardConfigApi";
import type { ProductCardConfig } from "@/lib/product-card/config";
import {
  blockedReason,
  describeApiError,
  draftActionWorkflow,
  publishWorkflow,
  restoreWorkflow,
  sameConfig,
  saveDraftWorkflow,
  setIn,
  validateConfig,
  type Breakpoint,
  type EditorError,
  type FieldErrors,
  type Outcome,
} from "@/lib/product-card/editor";
import { EditorControls } from "./EditorControls";
import { BreakpointToggle, PreviewPanel } from "./PreviewPanel";

type Notice = { tone: "success" | "warning" | "info" | "error"; message: string; conflict?: boolean };
type Confirm = { title: string; description: string; confirmLabel: string; destructive?: boolean; run: () => Promise<void> };

const formatTime = (iso: string | null) => (iso ? new Date(iso).toLocaleString() : "—");

const SOURCE_TEXT: Record<ProductCardDraftData["source"], string> = {
  draft: "Editing the saved draft",
  published: "No draft yet — editing a copy of the published design",
  default: "Nothing published yet — editing the built-in default design",
};

export function ProductCardEditor() {
  const router = useRouter();
  const token = useSelector((s: RootState) => s.auth.accessToken);
  const draftQuery = useGetProductCardDraftQuery();
  const [saveDraft, saveState] = useSaveProductCardDraftMutation();
  const [discardDraft, discardState] = useDiscardProductCardDraftMutation();
  const [resetDraft, resetState] = useResetProductCardDraftMutation();
  const [publish, publishState] = usePublishProductCardMutation();
  const [restorePrevious, restoreState] = useRestorePreviousProductCardMutation();
  const busy = saveState.isLoading || discardState.isLoading || resetState.isLoading || publishState.isLoading || restoreState.isLoading;

  // baseline = what the server holds (the draft as loaded / last saved); local = the editor's copy.
  const [baseline, setBaseline] = useState<ProductCardDraftData | null>(null);
  const [local, setLocal] = useState<ProductCardConfig | null>(null);
  const [breakpoint, setBreakpoint] = useState<Breakpoint>("desktop");
  const [serverFieldErrors, setServerFieldErrors] = useState<FieldErrors>({});
  const [notice, setNotice] = useState<Notice | null>(null);
  const [remoteChanged, setRemoteChanged] = useState(false);
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const adoptNext = useRef(false);

  const dirty = !!(baseline && local && !sameConfig(local, baseline.config));
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;

  // Adopt fresh server data unless the admin has unsaved edits; then only
  // flag that the draft changed elsewhere (never silently move the version stamp).
  const serverData = draftQuery.data?.data;
  const baselineRef = useRef(baseline);
  baselineRef.current = baseline;
  useEffect(() => {
    if (!serverData) return;
    const current = baselineRef.current;
    if (!current || !dirtyRef.current || adoptNext.current) {
      adoptNext.current = false;
      setBaseline(serverData);
      setLocal(serverData.config);
      setRemoteChanged(false);
    } else if (serverData.meta.draftUpdatedAt !== current.meta.draftUpdatedAt) {
      setRemoteChanged(true);
    }
  }, [serverData]);

  const clientValidation = useMemo(() => (local ? validateConfig(local) : null), [local]);
  const fieldErrors: FieldErrors = useMemo(
    () => ({ ...serverFieldErrors, ...(clientValidation && !clientValidation.ok ? clientValidation.fieldErrors : {}) }),
    [serverFieldErrors, clientValidation],
  );
  const hasFieldErrors = Object.keys(fieldErrors).length > 0;

  const onChange = useCallback((path: string, value: unknown) => {
    adoptNext.current = false; // a pending "adopt server data" must never overwrite new edits
    setLocal((c) => (c ? setIn(c, path, value) : c));
    setServerFieldErrors((e) => {
      if (!(path in e)) return e;
      const { [path]: _removed, ...rest } = e;
      return rest;
    });
  }, []);

  // ── unsaved-changes guard: reload / close tab, and in-app link clicks ──
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    const onClickCapture = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || a.closest("[data-fm-card-preview]")) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin || (url.pathname === window.location.pathname && url.search === window.location.search)) return;
      if (!window.confirm("You have unsaved product card changes. Leave this page and lose them?")) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClickCapture, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClickCapture, true);
    };
  }, [dirty]);

  // ── outcome reporting ──
  const report = useCallback(<T,>(outcome: Outcome<T>) => {
    if (outcome.ok) {
      setNotice({ tone: outcome.tone, message: outcome.message });
      if (outcome.tone === "success") toast.success(outcome.message);
      else if (outcome.tone === "warning") toast.warning(outcome.message);
      else toast.info(outcome.message);
      return;
    }
    const err: EditorError = outcome.error;
    if (err.kind === "validation") setServerFieldErrors(err.status === null ? {} : err.fieldErrors);
    setNotice({ tone: "error", message: err.message, conflict: err.kind === "conflict" });
    toast.error(err.message);
  }, []);

  const refreshCache = useCallback(() => refreshStorefrontCache(token, "card"), [token]);

  // ── actions ──
  const handleSave = async () => {
    if (!baseline || !local) return;
    const outcome = await saveDraftWorkflow((body) => saveDraft(body).unwrap(), local, baseline.meta.draftUpdatedAt);
    if (outcome.ok && outcome.data) {
      const saved = outcome.data;
      setServerFieldErrors({});
      setLocal(saved.config);
      setBaseline((b) =>
        b
          ? {
              ...b,
              config: saved.config,
              source: "draft",
              meta: { ...b.meta, draftUpdatedAt: saved.updatedAt, hasUnpublishedChanges: true },
            }
          : b,
      );
      adoptNext.current = true;
    }
    report(outcome);
  };

  const runPublish = async () => {
    if (!baseline) return;
    const outcome = await publishWorkflow((body) => publish(body).unwrap(), refreshCache, baseline.meta.draftUpdatedAt);
    if (outcome.ok && outcome.data) {
      const published = outcome.data;
      adoptNext.current = true;
      setLocal(published.config);
      setBaseline((b) => (b ? { ...b, config: published.config, meta: { ...b.meta, hasUnpublishedChanges: false } } : b));
      if (!published.unchanged) router.refresh();
    }
    report(outcome);
  };

  const runRestore = async () => {
    const outcome = await restoreWorkflow(() => restorePrevious().unwrap(), refreshCache);
    if (outcome.ok) {
      adoptNext.current = !dirtyRef.current;
      router.refresh();
      report({ ...outcome, message: `${outcome.message} Your saved draft was not changed — use “Discard draft” to load the live design into the editor.` });
      return;
    }
    report(outcome);
  };

  const runDraftAction = async (kind: "discard" | "reset") => {
    const outcome =
      kind === "discard"
        ? await draftActionWorkflow(() => discardDraft().unwrap(), "Draft discarded. The editor now shows the published design.")
        : await draftActionWorkflow(() => resetDraft().unwrap(), "Draft reset to the default design. Publish it to make it live.");
    if (outcome.ok && outcome.data) {
      const d = outcome.data;
      adoptNext.current = true;
      setServerFieldErrors({});
      setLocal(d.config);
      setBaseline((b) => (b ? { ...b, config: d.config, meta: { ...b.meta, draftUpdatedAt: d.updatedAt } } : b));
    }
    report(outcome);
  };

  const revertLocal = () => {
    if (!baseline) return;
    setLocal(baseline.config);
    setServerFieldErrors({});
    setNotice({ tone: "info", message: "Unsaved changes reverted." });
  };

  const reloadLatest = () => {
    const go = () => {
      adoptNext.current = true;
      setServerFieldErrors({});
      setNotice(null);
      void draftQuery.refetch();
    };
    if (dirty && !window.confirm("Reloading replaces your unsaved changes with the latest saved draft. Continue?")) return;
    go();
  };

  // ── render states ──
  if (draftQuery.isLoading || (!baseline && draftQuery.isFetching)) {
    return (
      <div className="flex items-center gap-2 p-8 text-sm text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Loading product card design…
      </div>
    );
  }
  if (draftQuery.isError && !baseline) {
    const err = describeApiError(draftQuery.error);
    return (
      <div className="m-6 rounded-lg border border-red-200 bg-red-50 p-6 text-sm">
        <p className="font-semibold text-red-700">Could not load the product card design</p>
        <p className="mt-1 text-red-600">{err.message}</p>
        {err.kind !== "forbidden" && (
          <Button variant="outline" size="sm" className="mt-3" onClick={() => void draftQuery.refetch()}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" /> Try again
          </Button>
        )}
      </div>
    );
  }
  if (!baseline || !local) return null;

  const state = {
    dirty,
    hasFieldErrors,
    busy,
    draftUpdatedAt: baseline.meta.draftUpdatedAt,
    hasUnpublishedChanges: baseline.meta.hasUnpublishedChanges,
    previousAvailable: baseline.meta.previousAvailable,
  };
  const why = (a: Parameters<typeof blockedReason>[0]) => blockedReason(a, state);

  const ask = (c: Confirm) => setConfirm(c);

  return (
    <div className="space-y-5 p-4 md:p-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-gray-900">Product Card Design</h1>
        <p className="text-sm text-gray-500">
          One design for every product listing: homepage sections, all products, categories, campaigns, vendor storefronts and related
          products. Changes are only visible to shoppers after you publish.
        </p>
      </header>

      {/* status + actions */}
      <section aria-label="Draft status" className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-gray-700">{SOURCE_TEXT[baseline.source]}</span>
          {dirty && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">Unsaved changes</span>}
          {baseline.meta.hasUnpublishedChanges ? (
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">Draft not published</span>
          ) : (
            <span className="rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-800">Draft matches live design</span>
          )}
        </div>
        <dl className="mt-2 grid gap-x-6 gap-y-1 text-xs text-gray-500 sm:grid-cols-2">
          <div><dt className="inline">Draft saved: </dt><dd className="inline text-gray-700">{formatTime(baseline.meta.draftUpdatedAt)}</dd></div>
          <div><dt className="inline">Live design published: </dt><dd className="inline text-gray-700">{baseline.meta.publishedUpdatedAt ? formatTime(baseline.meta.publishedUpdatedAt) : "never (default design is live)"}</dd></div>
        </dl>
        {(baseline.meta.storedDraftInvalid || baseline.meta.storedPublishedInvalid) && (
          <p className="mt-2 flex items-start gap-1.5 text-xs text-amber-700">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {baseline.meta.storedPublishedInvalid
              ? "The stored live design is invalid, so shoppers currently see the default design."
              : "The stored draft was invalid and was ignored; you are editing the live design instead."}
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <ActionButton label="Save draft" reason={why("save")} busy={saveState.isLoading} onClick={handleSave} primary />
          <ActionButton
            label="Publish"
            reason={why("publish")}
            busy={publishState.isLoading}
            onClick={() =>
              ask({
                title: "Publish this product card design?",
                description: "Every product listing on the site will switch to the saved draft design immediately.",
                confirmLabel: "Publish",
                run: runPublish,
              })
            }
          />
          <ActionButton label="Revert unsaved changes" reason={why("revert")} onClick={revertLocal} variant="ghost" />
          <ActionButton
            label="Discard draft"
            reason={why("discard")}
            busy={discardState.isLoading}
            variant="outline"
            onClick={() =>
              ask({
                title: "Discard the saved draft?",
                description: `The draft will be replaced by the live design.${dirty ? " Your unsaved changes will be lost too." : ""} Nothing changes for shoppers.`,
                confirmLabel: "Discard draft",
                destructive: true,
                run: () => runDraftAction("discard"),
              })
            }
          />
          <ActionButton
            label="Reset to defaults"
            reason={why("reset")}
            busy={resetState.isLoading}
            variant="outline"
            onClick={() =>
              ask({
                title: "Reset the draft to the default design?",
                description: `The saved draft will be replaced by the built-in FinixMart default design.${dirty ? " Your unsaved changes will be lost." : ""} It goes live only when you publish.`,
                confirmLabel: "Reset draft",
                destructive: true,
                run: () => runDraftAction("reset"),
              })
            }
          />
          {baseline.meta.previousAvailable && (
            <ActionButton
              label="Restore previous design"
              reason={why("restore")}
              busy={restoreState.isLoading}
              variant="outline"
              onClick={() =>
                ask({
                  title: "Restore the previously published design?",
                  description: "The previous design goes live immediately on every product listing. The current live design becomes the new “previous”, so this can be undone.",
                  confirmLabel: "Restore",
                  destructive: true,
                  run: runRestore,
                })
              }
            />
          )}
        </div>
      </section>

      {remoteChanged && (
        <NoticeBox notice={{ tone: "warning", message: "The saved draft was changed elsewhere while you were editing.", conflict: true }} onReload={reloadLatest} />
      )}
      {notice && <NoticeBox notice={notice} onReload={reloadLatest} onDismiss={() => setNotice(null)} />}

      <div className="grid gap-6 xl:grid-cols-[400px_minmax(0,1fr)]">
        <div className="order-2 xl:order-1">
          <EditorControls config={local} breakpoint={breakpoint} fieldErrors={fieldErrors} disabled={busy} onChange={onChange} />
        </div>
        <div className="order-1 xl:order-2">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 xl:sticky xl:top-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-gray-800">Live preview</h2>
              <BreakpointToggle value={breakpoint} onChange={setBreakpoint} />
            </div>
            <p className="mb-3 text-xs text-gray-500">
              Shows your current edits{dirty ? " (not saved yet)" : ""}. Size and spacing controls edit the selected screen size.
            </p>
            <PreviewPanel config={local} breakpoint={breakpoint} />
            {hasFieldErrors && (
              <p className="mt-3 text-xs text-red-600">Some settings are invalid; the preview shows them as entered, but they can't be saved.</p>
            )}
          </div>
        </div>
      </div>

      <AlertDialog open={confirm !== null} onOpenChange={(open) => !open && !busy && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirm?.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirm?.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              className={confirm?.destructive ? "bg-red-600 hover:bg-red-700" : undefined}
              onClick={async (e) => {
                e.preventDefault(); // keep the dialog open until the request settles
                const c = confirm;
                if (!c) return;
                await c.run();
                setConfirm(null);
              }}
            >
              {busy ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : null}
              {confirm?.confirmLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ActionButton(props: {
  label: string;
  reason: string | null;
  onClick: () => void;
  busy?: boolean;
  primary?: boolean;
  variant?: "outline" | "ghost";
}) {
  const disabled = props.reason !== null;
  return (
    <Button
      type="button"
      size="sm"
      variant={props.primary ? "default" : props.variant ?? "outline"}
      disabled={disabled}
      title={props.reason ?? undefined}
      onClick={props.onClick}
      className={props.primary ? "bg-teal-600 hover:bg-teal-700" : undefined}
    >
      {props.busy ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : null}
      {props.label}
    </Button>
  );
}

const NOTICE_STYLE = {
  success: { box: "border-teal-200 bg-teal-50 text-teal-800", Icon: CheckCircle2 },
  warning: { box: "border-amber-200 bg-amber-50 text-amber-800", Icon: AlertTriangle },
  info: { box: "border-blue-200 bg-blue-50 text-blue-800", Icon: Info },
  error: { box: "border-red-200 bg-red-50 text-red-700", Icon: XCircle },
} as const;

function NoticeBox({ notice, onReload, onDismiss }: { notice: Notice; onReload: () => void; onDismiss?: () => void }) {
  const { box, Icon } = NOTICE_STYLE[notice.tone];
  return (
    <div role={notice.tone === "error" ? "alert" : "status"} className={`flex items-start gap-2 rounded-lg border px-4 py-3 text-sm ${box}`}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <p className="flex-1">{notice.message}</p>
      {notice.conflict && (
        <button type="button" onClick={onReload} className="shrink-0 text-xs font-semibold underline underline-offset-2">
          Reload latest draft
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
