"use client";

// components/admin/theme-palettes/VersionHistory.tsx
//
// Append-only publish history for one palette (GET /themes/palettes/:id/
// versions). Rollback republishes an older version's tokens as a NEW version
// (the replaced state stays in history, so rollback is itself reversible) —
// the confirm copy says exactly that.
import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Loader2, RefreshCw, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
import { useGetPaletteVersionsQuery, useRollbackPaletteMutation, type PaletteVersionRow } from "@/features/themePaletteApi";
import { describePaletteError, displaySwatches } from "@/lib/palette/editor";

const formatTime = (iso: string | null) => (iso ? new Date(iso).toLocaleString() : "—");

export function VersionHistory(props: { paletteId: string; paletteName: string; currentVersion: number; canRollback: boolean }) {
  const versionsQuery = useGetPaletteVersionsQuery(props.paletteId);
  const [rollback, rollbackState] = useRollbackPaletteMutation();
  const [target, setTarget] = useState<PaletteVersionRow | null>(null);

  const runRollback = async () => {
    if (!target) return;
    try {
      const res = await rollback({ id: props.paletteId, version: target.version }).unwrap();
      toast.success(res.message ?? `Rolled back — published as version ${res.data.version}`);
      setTarget(null);
    } catch (error) {
      toast.error(describePaletteError(error).message);
    }
  };

  if (versionsQuery.isLoading) {
    return (
      <div className="space-y-3">
        {[0, 1].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }
  if (versionsQuery.isError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm">
        <p className="flex items-center gap-2 font-semibold text-red-700">
          <AlertTriangle className="h-4 w-4" aria-hidden="true" /> Could not load version history
        </p>
        <p className="mt-1 text-red-600">{describePaletteError(versionsQuery.error).message}</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={() => void versionsQuery.refetch()}>
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" /> Try again
        </Button>
      </div>
    );
  }

  const versions = versionsQuery.data?.data ?? [];
  if (versions.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center">
        <p className="text-sm font-medium text-gray-700">No published versions yet</p>
        <p className="mt-1 text-sm text-gray-500">Publishing this palette records its first immutable version here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">
        History is append-only: rollback publishes the selected version&apos;s tokens as a new version, so nothing is ever lost.
      </p>
      <ul className="space-y-2">
        {versions.map((version) => {
          const swatches = displaySwatches(version.tokens);
          const isCurrent = version.version === props.currentVersion;
          return (
            <li
              key={version.id}
              className={`flex flex-wrap items-center gap-3 rounded-lg border p-3 ${
                isCurrent ? "border-teal-300 bg-teal-50/50" : "border-gray-200 bg-white"
              }`}
            >
              <div className="flex h-8 w-28 shrink-0 overflow-hidden rounded" aria-hidden="true">
                {swatches.map((color, i) => (
                  <span key={i} className="h-full flex-1" style={{ backgroundColor: color }} />
                ))}
              </div>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-gray-900">
                  Version {version.version}
                  {isCurrent && (
                    <span className="rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-800">Current</span>
                  )}
                </p>
                <p className="mt-0.5 text-xs text-gray-500">
                  {formatTime(version.createdAt)}
                  {version.note ? ` · ${version.note}` : ""}
                </p>
              </div>
              {!isCurrent && props.canRollback && (
                <Button variant="outline" size="sm" disabled={rollbackState.isLoading} onClick={() => setTarget(version)}>
                  <RotateCcw className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" /> Roll back to v{version.version}
                </Button>
              )}
            </li>
          );
        })}
      </ul>

      <AlertDialog open={target !== null} onOpenChange={(open) => !open && !rollbackState.isLoading && setTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Roll back “{props.paletteName}” to version {target?.version}?</AlertDialogTitle>
            <AlertDialogDescription>
              The tokens of version {target?.version} will be published as a new version {props.currentVersion + 1}. The current
              state stays in history, so this can be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={rollbackState.isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={rollbackState.isLoading}
              onClick={async (e) => {
                e.preventDefault();
                await runRollback();
              }}
            >
              {rollbackState.isLoading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : null}
              Roll back
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
