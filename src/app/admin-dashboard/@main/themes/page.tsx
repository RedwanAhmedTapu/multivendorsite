"use client";

// /admin-dashboard/themes — theme palette list (Part 3) + homepage assignment
// (homepage integration: a published palette only reaches the public homepage
// once it is assigned to the PLATFORM_WEBSITE scope — see
// AI_CONTEXT/THEME_MANAGEMENT_HOMEPAGE_AUDIT.md §6, decision: Option A).
//
// The palette endpoints sit behind requirePermission('themeManagement') on
// the backend (the real security boundary). This page mirrors that with the
// usePermissions() UX gate so staff without the grant get a clear message
// instead of a failed request.
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  Copy,
  History,
  Loader2,
  Monitor,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldAlert,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { usePermissions } from "@/hooks/usePermissions";
import {
  useArchivePaletteMutation,
  useDeletePaletteMutation,
  useDuplicatePaletteMutation,
  useGetAssignmentsQuery,
  useGetPaletteQuery,
  useGetPalettesQuery,
  usePublishPaletteMutation,
  useRestorePresetDefaultMutation,
  useUpsertAssignmentMutation,
  type PaletteStatus,
  type PaletteSummary,
} from "@/features/themePaletteApi";
import { type PaletteTokens } from "@/lib/palette/tokens";
import { getPalettePreset } from "@/lib/palette/presets";
import {
  canArchivePalette,
  canDeletePalette,
  canEditPalette,
  canPublishPalette,
  canRestoreDefaultPalette,
  canRollbackPalette,
  describePaletteError,
  displaySwatches,
  filterPalettes,
} from "@/lib/palette/editor";

type StatusFilter = "ALL" | PaletteStatus;

type Confirm =
  | { kind: "publish"; palette: PaletteSummary }
  | { kind: "archive"; palette: PaletteSummary }
  | { kind: "delete"; palette: PaletteSummary }
  | { kind: "restore-default"; palette: PaletteSummary }
  | { kind: "assign-homepage"; palette: PaletteSummary }
  | { kind: "reset-homepage"; palette: PaletteSummary };

const STATUS_STYLE: Record<PaletteStatus, string> = {
  DRAFT: "bg-amber-100 text-amber-800",
  PUBLISHED: "bg-teal-100 text-teal-800",
  ARCHIVED: "bg-slate-200 text-slate-600",
};

const STATUS_LABEL: Record<PaletteStatus, string> = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
  ARCHIVED: "Archived",
};

const formatTime = (iso: string | null) => (iso ? new Date(iso).toLocaleString() : "—");

export default function ThemePalettesPage() {
  const router = useRouter();
  const { me, isLoading: permissionsLoading, can } = usePermissions();
  const allowed = can("themeManagement");

  const palettesQuery = useGetPalettesQuery(undefined, { skip: !allowed });
  const assignmentsQuery = useGetAssignmentsQuery(undefined, { skip: !allowed });
  const [duplicatePalette, duplicateState] = useDuplicatePaletteMutation();
  const [publishPalette, publishState] = usePublishPaletteMutation();
  const [archivePalette, archiveState] = useArchivePaletteMutation();
  const [deletePalette, deleteState] = useDeletePaletteMutation();
  const [restoreDefault, restoreState] = useRestorePresetDefaultMutation();
  const [upsertAssignment, assignState] = useUpsertAssignmentMutation();
  const busy =
    duplicateState.isLoading || publishState.isLoading || archiveState.isLoading || deleteState.isLoading || restoreState.isLoading || assignState.isLoading;

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [confirm, setConfirm] = useState<Confirm | null>(null);

  const palettes = useMemo(() => palettesQuery.data?.data ?? [], [palettesQuery.data]);
  const visible = useMemo(() => filterPalettes(palettes, search, status), [palettes, search, status]);

  // The PLATFORM_WEBSITE assignment decides which published palette the
  // public homepage serves (backend getActivePalette falls back to Neutral
  // when no assignment exists).
  const assignments = useMemo(() => assignmentsQuery.data?.data ?? [], [assignmentsQuery.data]);
  const homepageAssignment = useMemo(
    () => assignments.find((a) => a.scope === "PLATFORM_WEBSITE") ?? null,
    [assignments],
  );
  const neutralPreset = useMemo(
    () => palettes.find((p) => p.kind === "PRESET" && p.name.trim().toLowerCase() === "neutral") ?? null,
    [palettes],
  );

  if (permissionsLoading) {
    return <div className="p-8 text-sm text-gray-500">Loading…</div>;
  }
  if (!me || !allowed) {
    return (
      <div className="m-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-6">
        <ShieldAlert className="h-5 w-5 shrink-0 text-red-600" aria-hidden="true" />
        <div>
          <p className="font-semibold text-red-700">Access denied</p>
          <p className="mt-1 text-sm text-red-600">
            You need the theme management permission to see theme palettes. Ask the platform administrator to grant it.
          </p>
        </div>
      </div>
    );
  }

  const runConfirm = async () => {
    if (!confirm) return;
    const { palette } = confirm;
    try {
      if (confirm.kind === "publish") {
        const res = await publishPalette({ id: palette.id }).unwrap();
        toast.success(res.message ?? `Palette published as version ${res.data.version}`);
      } else if (confirm.kind === "archive") {
        const res = await archivePalette(palette.id).unwrap();
        toast.success(res.message ?? "Palette archived");
      } else if (confirm.kind === "delete") {
        const res = await deletePalette(palette.id).unwrap();
        toast.success(res.message ?? "Palette deleted");
      } else if (confirm.kind === "assign-homepage" || confirm.kind === "reset-homepage") {
        const res = await upsertAssignment({ scope: "PLATFORM_WEBSITE", paletteId: palette.id }).unwrap();
        toast.success(res.message ?? `“${res.data.palette.name}” is now assigned to the homepage`);
      } else {
        const res = await restoreDefault(palette.id).unwrap();
        toast.success(res.message ?? "Palette restored to built-in defaults");
      }
      setConfirm(null);
    } catch (error) {
      const described = describePaletteError(error);
      toast.error(described.message);
      // Keep the dialog open so the admin can retry or cancel.
    }
  };

  const handleDuplicate = async (palette: PaletteSummary) => {
    try {
      const res = await duplicatePalette(palette.id).unwrap();
      toast.success(res.message ?? "Palette duplicated as draft");
      router.push(`/admin-dashboard/themes/${res.data.id}`);
    } catch (error) {
      toast.error(describePaletteError(error).message);
    }
  };

  const homepageIsNeutral =
    homepageAssignment !== null && neutralPreset !== null && homepageAssignment.paletteId === neutralPreset.id;

  return (
    <div className="space-y-5 p-4 md:p-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-gray-900">Color Palettes</h1>
        <p className="max-w-3xl text-sm text-gray-500">
          Semantic color palettes for FinixMart surfaces. Built-in presets are the platform defaults; duplicate one to create
          your own. Publishing a palette records an immutable version — it reaches the public homepage only after you assign
          it to the homepage below (propagation takes up to ~5 minutes).
        </p>
        <p className="flex flex-wrap items-center gap-2 pt-1 text-sm" aria-live="polite">
          <Monitor className="h-4 w-4 text-gray-400" aria-hidden="true" />
          <span className="text-gray-600">
            Homepage palette:{" "}
            <strong className="font-semibold text-gray-900">
              {assignmentsQuery.isLoading
                ? "Loading…"
                : homepageAssignment
                  ? `${homepageAssignment.palette.name} (v${homepageAssignment.palette.version})`
                  : "Neutral (built-in default — no assignment)"}
            </strong>
          </span>
          {homepageAssignment && !homepageIsNeutral && neutralPreset && (
            <button
              type="button"
              disabled={busy}
              onClick={() => setConfirm({ kind: "reset-homepage", palette: neutralPreset })}
              className="text-xs font-medium text-indigo-600 underline underline-offset-2 hover:text-indigo-800 disabled:opacity-50"
            >
              Reset homepage to Neutral
            </button>
          )}
        </p>
      </header>

      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-52 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search palettes…"
            aria-label="Search palettes"
            className="pl-8"
          />
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1" role="group" aria-label="Filter by status">
          {(["ALL", "DRAFT", "PUBLISHED", "ARCHIVED"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setStatus(option)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                status === option ? "bg-indigo-600 text-white" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {option === "ALL" ? "All" : STATUS_LABEL[option]}
            </button>
          ))}
        </div>
        <div className="ml-auto">
          <Button asChild size="sm" className="bg-indigo-600 hover:bg-indigo-700">
            <Link href="/admin-dashboard/themes/new">
              <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" /> New palette
            </Link>
          </Button>
        </div>
      </div>

      {/* content states */}
      {palettesQuery.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          ))}
        </div>
      ) : palettesQuery.isError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm">
          <p className="flex items-center gap-2 font-semibold text-red-700">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" /> Could not load palettes
          </p>
          <p className="mt-1 text-red-600">{describePaletteError(palettesQuery.error).message}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => void palettesQuery.refetch()}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" /> Try again
          </Button>
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-10 text-center">
          <p className="text-sm font-medium text-gray-700">
            {palettes.length === 0 ? "No palettes yet" : "No palettes match your filters"}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {palettes.length === 0
              ? "The built-in presets appear here automatically. Create a custom palette to get started."
              : "Try a different search or status filter."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((palette) => (
            <PaletteCard
              key={palette.id}
              palette={palette}
              busy={busy}
              isOnHomepage={homepageAssignment?.paletteId === palette.id}
              onDuplicate={() => void handleDuplicate(palette)}
              onPublish={() => setConfirm({ kind: "publish", palette })}
              onArchive={() => setConfirm({ kind: "archive", palette })}
              onDelete={() => setConfirm({ kind: "delete", palette })}
              onRestoreDefault={() => setConfirm({ kind: "restore-default", palette })}
              onAssignHomepage={() => setConfirm({ kind: "assign-homepage", palette })}
            />
          ))}
        </div>
      )}

      <ConfirmDialog confirm={confirm} busy={busy} onCancel={() => setConfirm(null)} onConfirm={runConfirm} />
    </div>
  );
}

// ── palette card ─────────────────────────────────────────────────────────────

function PaletteCard(props: {
  palette: PaletteSummary;
  busy: boolean;
  isOnHomepage: boolean;
  onDuplicate: () => void;
  onPublish: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onRestoreDefault: () => void;
  onAssignHomepage: () => void;
}) {
  const { palette, busy } = props;
  // Swatch tokens: a PRESET palette's tokens always equal the built-in
  // constants (presets are frozen — only restore-default/rollback can change
  // them, and both restore built-in values), so they are matched client-side
  // by name. CUSTOM palettes load their detail lazily (shared RTK cache with
  // the editor page). Until tokens are known the strip renders neutrally.
  const preset = palette.kind === "PRESET" ? getPalettePreset(palette.name.trim().toLowerCase()) : null;
  const detailQuery = useGetPaletteQuery(palette.id, { skip: preset !== null });
  const tokens: PaletteTokens | null = preset?.tokens ?? detailQuery.data?.data.tokens ?? null;
  const swatches = useMemo(() => (tokens ? displaySwatches(tokens) : null), [tokens]);

  const editable = canEditPalette(palette);
  const publishable = canPublishPalette(palette);
  const archivable = canArchivePalette(palette);
  const deletable = canDeletePalette(palette);
  const restorable = canRestoreDefaultPalette(palette);
  const rollbackable = canRollbackPalette(palette);

  return (
    <article className="flex flex-col rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <Link href={`/admin-dashboard/themes/${palette.id}`} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-t-lg">
        <div className="flex h-14 overflow-hidden rounded-t-lg" aria-hidden="true">
          {swatches === null
            ? [0, 1, 2, 3, 4, 5, 6].map((i) => <span key={i} className="h-full flex-1 animate-pulse bg-gray-200" />)
            : swatches.map((color, i) => <span key={i} className="h-full flex-1" style={{ backgroundColor: color }} />)}
        </div>
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              href={`/admin-dashboard/themes/${palette.id}`}
              className="block truncate text-sm font-semibold text-gray-900 hover:text-indigo-700"
            >
              {palette.name}
            </Link>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[palette.status]}`}>
                {STATUS_LABEL[palette.status]}
              </span>
              <span className="rounded-full border border-indigo-200 px-2 py-0.5 text-xs font-medium text-indigo-700">
                {palette.kind === "PRESET" ? "Built-in" : "Custom"}
              </span>
              {palette.status !== "DRAFT" && (
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">v{palette.version}</span>
              )}
              {props.isOnHomepage && (
                <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                  <Monitor className="h-3 w-3" aria-hidden="true" /> On homepage
                </span>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" aria-label={`Actions for ${palette.name}`}>
                <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/admin-dashboard/themes/${palette.id}`}>
                  {editable ? (
                    <>
                      <Pencil className="mr-2 h-4 w-4" aria-hidden="true" /> Edit draft
                    </>
                  ) : (
                    <>
                      <History className="mr-2 h-4 w-4" aria-hidden="true" /> View details
                    </>
                  )}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem disabled={busy} onClick={props.onDuplicate}>
                <Copy className="mr-2 h-4 w-4" aria-hidden="true" /> Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {publishable && (
                <DropdownMenuItem disabled={busy} onClick={props.onPublish}>
                  <UploadCloud className="mr-2 h-4 w-4" aria-hidden="true" /> Publish
                </DropdownMenuItem>
              )}
              {palette.status === "PUBLISHED" && !props.isOnHomepage && (
                <DropdownMenuItem disabled={busy} onClick={props.onAssignHomepage}>
                  <Monitor className="mr-2 h-4 w-4" aria-hidden="true" /> Assign to homepage
                </DropdownMenuItem>
              )}
              {restorable && (
                <DropdownMenuItem disabled={busy} onClick={props.onRestoreDefault}>
                  <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" /> Restore built-in default
                </DropdownMenuItem>
              )}
              {archivable && (
                <DropdownMenuItem disabled={busy} onClick={props.onArchive}>
                  <Archive className="mr-2 h-4 w-4" aria-hidden="true" /> Archive
                </DropdownMenuItem>
              )}
              {deletable && (
                <DropdownMenuItem disabled={busy} onClick={props.onDelete} className="text-red-600 focus:text-red-700">
                  <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" /> Delete
                </DropdownMenuItem>
              )}
              {!publishable && !archivable && !deletable && !restorable && !rollbackable && (
                <DropdownMenuItem disabled>No actions available</DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {palette.description && <p className="line-clamp-2 text-xs text-gray-500">{palette.description}</p>}
        <dl className="mt-auto grid grid-cols-2 gap-x-4 gap-y-1 pt-2 text-xs text-gray-500">
          <div>
            <dt className="inline">Updated: </dt>
            <dd className="inline text-gray-700">{formatTime(palette.updatedAt)}</dd>
          </div>
          <div>
            <dt className="inline">Assignments: </dt>
            <dd className="inline text-gray-700">{palette.assignmentCount}</dd>
          </div>
        </dl>
        {palette.assignmentCount > 0 && (
          <p className="flex items-center gap-1 text-xs text-gray-400">
            <CheckCircle2 className="h-3 w-3" aria-hidden="true" /> Assigned to {palette.assignmentCount}{" "}
            {palette.assignmentCount === 1 ? "scope" : "scopes"}
          </p>
        )}
      </div>
    </article>
  );
}

// ── confirm dialog ───────────────────────────────────────────────────────────

const CONFIRM_TEXT: Record<Confirm["kind"], { title: string; description: (p: PaletteSummary) => string; confirmLabel: string; destructive?: boolean }> = {
  publish: {
    title: "Publish this palette?",
    description: (p) =>
      `“${p.name}” will be published as version ${p.version + 1}. The new version is recorded in history and becomes available for assignments.`,
    confirmLabel: "Publish",
  },
  archive: {
    title: "Archive this palette?",
    description: (p) =>
      `“${p.name}” will no longer be assignable. Existing version history is kept and rollback remains available. You can restore it by rolling back a version.`,
    confirmLabel: "Archive",
    destructive: true,
  },
  delete: {
    title: "Delete this palette?",
    description: (p) => `“${p.name}” has never been published and is not assigned anywhere. Deleting it cannot be undone.`,
    confirmLabel: "Delete",
    destructive: true,
  },
  "restore-default": {
    title: "Restore the built-in default?",
    description: (p) =>
      `“${p.name}” will be reset to the exact built-in preset values. ${p.status === "DRAFT" ? "Only the draft changes — publish it afterwards to record a version." : "The reset is published as a new version immediately."}`,
    confirmLabel: "Restore default",
    destructive: true,
  },
  "assign-homepage": {
    title: "Assign this palette to the homepage?",
    description: (p) =>
      `The public homepage will switch to “${p.name}” (v${p.version}). The change propagates within ~5 minutes and every visitor sees it. You can switch back at any time by assigning another palette or resetting to Neutral.`,
    confirmLabel: "Assign to homepage",
  },
  "reset-homepage": {
    title: "Reset the homepage to Neutral?",
    description: () =>
      "The public homepage will switch back to the built-in Neutral palette (the original platform look). The change propagates within ~5 minutes.",
    confirmLabel: "Reset to Neutral",
    destructive: true,
  },
};

function ConfirmDialog(props: { confirm: Confirm | null; busy: boolean; onCancel: () => void; onConfirm: () => Promise<void> }) {
  const { confirm, busy } = props;
  const text = confirm ? CONFIRM_TEXT[confirm.kind] : null;
  return (
    <AlertDialog open={confirm !== null} onOpenChange={(open) => !open && !busy && props.onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{text?.title}</AlertDialogTitle>
          <AlertDialogDescription>{confirm && text ? text.description(confirm.palette) : null}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={busy}
            className={text?.destructive ? "bg-red-600 hover:bg-red-700" : undefined}
            onClick={async (e) => {
              e.preventDefault(); // keep the dialog open until the request settles
              await props.onConfirm();
            }}
          >
            {busy ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : null}
            {text?.confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
