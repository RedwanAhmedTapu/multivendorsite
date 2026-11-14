// components/locations/LocationTreeView.tsx
"use client";

import React, { useState } from "react";
import { Building, CheckCircle, ChevronDown, ChevronRight, MapPin, Navigation, TreePine } from "lucide-react";
import { Badge, Card, EmptyState, Notice, SearchBox, Skeleton, cx } from "@/components/payouts/ui";
import { useGetAllLocationsQuery, type LocationTree } from "@/features/locationApi";

interface TreeNodeProps {
  node: LocationTree;
  level: number;
  searchTerm: string;
}

function TreeNode({ node, level, searchTerm }: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(level === 0);

  const q = searchTerm.trim().toLowerCase();
  const matchesSearch =
    q === "" ||
    node.name.toLowerCase().includes(q) ||
    node.name_local?.toLowerCase().includes(q) ||
    node.external_code?.toLowerCase().includes(q);

  if (!matchesSearch && (!node.children || node.children.length === 0)) return null;

  const hasChildren = node.children && node.children.length > 0;
  const Icon = node.level === "DIVISION" ? Building : node.level === "DISTRICT" ? MapPin : Navigation;
  const rowTone =
    node.level === "DIVISION"
      ? "bg-sky-50 text-sky-600"
      : node.level === "DISTRICT"
        ? "bg-emerald-50 text-emerald-600"
        : "bg-indigo-50 text-indigo-600";

  return (
    <div className={level > 0 ? "ml-4 border-l border-slate-100" : undefined}>
      <div
        className="flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 transition-colors hover:bg-indigo-50/50"
        onClick={() => hasChildren && setIsExpanded(!isExpanded)}
      >
        {hasChildren ? (
          isExpanded
            ? <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            : <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />
        ) : (
          <span className="w-3.5 shrink-0" />
        )}
        <span className={cx("grid h-6 w-6 shrink-0 place-items-center rounded-md [&>svg]:h-3.5 [&>svg]:w-3.5", rowTone)}>
          <Icon />
        </span>
        <span className="text-[13px] font-medium text-slate-800">{node.name}</span>
        {node.name_local && <span className="text-[11px] text-slate-400">({node.name_local})</span>}
        {node.is_cod_supported && <CheckCircle className="h-3.5 w-3.5 shrink-0 text-emerald-500" aria-label="COD supported" />}
        {node.external_code && (
          <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">{node.external_code}</code>
        )}
      </div>
      {isExpanded && hasChildren && (
        <div className="ml-4">
          {node.children.map((child) => (
            <TreeNode key={child.id} node={child} level={level + 1} searchTerm={searchTerm} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function LocationTreeView() {
  const [searchTerm, setSearchTerm] = useState("");
  const { data, isLoading, error, refetch } = useGetAllLocationsQuery();

  if (isLoading) {
    return (
      <Card>
        <div className="mb-3"><Skeleton rows={1} /></div>
        <div className="space-y-1.5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2" style={{ marginLeft: (i % 3) * 16 }}>
              <Skeleton rows={1} />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Notice tone="red">
        Failed to load the location tree. Please try again.
        <button className="ml-2 font-semibold underline" onClick={() => refetch()}>Retry</button>
      </Notice>
    );
  }

  const locations = data?.data ?? [];

  return (
    <Card>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <SearchBox
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search in tree by name or code..."
          className="w-full sm:w-72"
        />
        <span className="ml-auto text-[11px] text-slate-400">
          {locations.length} root division{locations.length === 1 ? "" : "s"}
        </span>
      </div>

      {locations.length === 0 ? (
        <EmptyState
          icon={<TreePine />}
          title="No locations yet"
          body="Add divisions, districts, and thanas to build the delivery hierarchy."
        />
      ) : (
        <div className="max-h-[480px] overflow-y-auto rounded-md border border-slate-100 p-2">
          {locations.map((node) => (
            <TreeNode key={node.id} node={node} level={0} searchTerm={searchTerm} />
          ))}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-4 border-t border-slate-100 pt-2.5 text-[11px] text-slate-500">
        <span className="flex items-center gap-1.5"><Building className="h-3.5 w-3.5 text-sky-500" /> Division</span>
        <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-emerald-500" /> District</span>
        <span className="flex items-center gap-1.5"><Navigation className="h-3.5 w-3.5 text-indigo-500" /> Thana</span>
        <span className="flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> COD supported</span>
      </div>
    </Card>
  );
}
