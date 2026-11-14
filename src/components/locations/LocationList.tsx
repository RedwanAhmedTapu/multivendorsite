// components/locations/LocationList.tsx
"use client";

import React, { useState } from "react";
import { Check, MapPin, PencilLine, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import {
  Badge, Button, Card, EmptyState, Modal, Notice, Pager, SearchBox, Skeleton,
  tableCls, tdCls, thCls,
} from "@/components/payouts/ui";
import { useDeleteLocationMutation, useSearchLocationsQuery, type LocationLevel } from "@/features/locationApi";

const ROWS_PER_PAGE = 10;

const LEVEL_TONE: Record<LocationLevel, "blue" | "green" | "violet"> = {
  DIVISION: "blue",
  DISTRICT: "green",
  THANA: "violet",
};

interface LocationListProps {
  level?: LocationLevel;
  onEdit: (id: string) => void;
}

export default function LocationList({ level, onEdit }: LocationListProps) {
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const { data, isLoading, error, refetch } = useSearchLocationsQuery({ query: searchQuery, level });
  const [deleteLocation, { isLoading: isDeleting }] = useDeleteLocationMutation();

  const locations = data?.data ?? [];
  const totalPages = Math.max(1, Math.ceil(locations.length / ROWS_PER_PAGE));
  const currentPage = Math.min(page, totalPages - 1);
  const pageRows = locations.slice(currentPage * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE + ROWS_PER_PAGE);

  const handleSearch = (v: string) => {
    setSearchQuery(v);
    setPage(0);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteLocation(deleteTarget.id).unwrap();
      toast.success(`"${deleteTarget.name}" deleted successfully`);
      setDeleteTarget(null);
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to delete location");
    }
  };

  return (
    <Card flush>
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-4 py-2.5">
        <SearchBox
          value={searchQuery}
          onChange={handleSearch}
          placeholder="Search by name, local name, or code..."
          className="w-full sm:w-72"
        />
        <span className="ml-auto text-[11px] text-slate-400">
          {locations.length} location{locations.length === 1 ? "" : "s"}
        </span>
      </div>

      {isLoading ? (
        <div className="p-4"><Skeleton rows={6} /></div>
      ) : error ? (
        <div className="p-4">
          <Notice tone="red">
            Failed to load locations. Please try again.
            <Button size="sm" variant="secondary" className="ml-2" onClick={() => refetch()}>Retry</Button>
          </Notice>
        </div>
      ) : locations.length === 0 ? (
        <div className="p-4">
          <EmptyState
            icon={<MapPin />}
            title={searchQuery ? "No matching locations" : "No locations yet"}
            body={
              searchQuery
                ? `Nothing matches "${searchQuery}". Try a different search term.`
                : "Add your first location to enable delivery area coverage and courier sync."
            }
          />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className={tableCls}>
            <thead>
              <tr>
                <th className={thCls}>Name</th>
                <th className={thCls}>Level</th>
                <th className={thCls}>Code</th>
                <th className={`${thCls} text-center`}>COD</th>
                <th className={`${thCls} text-center`}>DG COD</th>
                <th className={`${thCls} text-center`}>Sort</th>
                <th className={`${thCls} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((location) => (
                <tr key={location.id} className="transition-colors hover:bg-indigo-50/40">
                  <td className={tdCls}>
                    <div className="font-medium text-slate-800">{location.name}</div>
                    <div className="flex flex-wrap items-center gap-x-2 text-[11px] text-slate-500">
                      {location.name_local && <span>{location.name_local}</span>}
                      {location.locations && (
                        <span className="text-slate-400">under {location.locations.name}</span>
                      )}
                    </div>
                  </td>
                  <td className={tdCls}>
                    <Badge tone={LEVEL_TONE[location.level]} dot>{location.level}</Badge>
                  </td>
                  <td className={`${tdCls} tabular-nums`}>
                    {location.external_code ? (
                      <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-600">
                        {location.external_code}
                      </code>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className={`${tdCls} text-center`}>
                    {location.is_cod_supported
                      ? <Check className="mx-auto h-4 w-4 text-emerald-600" aria-label="COD supported" />
                      : <X className="mx-auto h-4 w-4 text-slate-300" aria-label="COD not supported" />}
                  </td>
                  <td className={`${tdCls} text-center`}>
                    {location.is_dg_cod_supported
                      ? <Check className="mx-auto h-4 w-4 text-emerald-600" aria-label="DG COD supported" />
                      : <X className="mx-auto h-4 w-4 text-slate-300" aria-label="DG COD not supported" />}
                  </td>
                  <td className={`${tdCls} text-center tabular-nums`}>{location.sort_order ?? 0}</td>
                  <td className={tdCls}>
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" title="Edit" onClick={() => onEdit(location.id)}>
                        <PencilLine className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="danger" title="Delete" onClick={() => setDeleteTarget({ id: location.id, name: location.name })}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!isLoading && !error && locations.length > ROWS_PER_PAGE && (
        <Pager
          page={currentPage + 1}
          pages={totalPages}
          onPage={(p) => setPage(p - 1)}
          total={locations.length}
          pageSize={ROWS_PER_PAGE}
        />
      )}

      <Modal
        open={Boolean(deleteTarget)}
        title="Delete location?"
        onClose={() => setDeleteTarget(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger" loading={isDeleting} onClick={handleConfirmDelete}>Delete</Button>
          </>
        }
      >
        <p className="text-[13px] leading-5 text-slate-600">
          This will permanently delete <b className="text-slate-800">{deleteTarget?.name}</b> and all of its
          child locations. This action cannot be undone.
        </p>
      </Modal>
    </Card>
  );
}
