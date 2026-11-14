// components/locations/location-stats.tsx
"use client";

import React, { useEffect, useState } from "react";
import { Building, CheckCircle, MapPin, Navigation, Package } from "lucide-react";
import { StatCard } from "@/components/payouts/ui";
import { useGetAllLocationsQuery } from "@/features/locationApi";

interface LocationStatsData {
  divisions: number;
  districts: number;
  thanas: number;
  total: number;
  codDivisions: number;
  dgCodDivisions: number;
  codDistricts: number;
  dgCodDistricts: number;
  codThanas: number;
  dgCodThanas: number;
}

const EMPTY_STATS: LocationStatsData = {
  divisions: 0, districts: 0, thanas: 0, total: 0,
  codDivisions: 0, dgCodDivisions: 0, codDistricts: 0, dgCodDistricts: 0, codThanas: 0, dgCodThanas: 0,
};

function StatSkeleton() {
  return (
    <div aria-busy="true" className="animate-pulse rounded-lg border border-slate-200 bg-white p-3.5">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-2.5 w-20 rounded bg-slate-200" />
          <div className="h-6 w-12 rounded bg-slate-200" />
        </div>
        <div className="h-8 w-8 rounded-md bg-slate-100" />
      </div>
      <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-2">
        <div className="h-2 w-28 rounded bg-slate-100" />
      </div>
    </div>
  );
}

export default function LocationStats() {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => setIsClient(true), []);

  const { data: locationsData, isLoading } = useGetAllLocationsQuery(undefined, { skip: !isClient });

  const stats = React.useMemo<LocationStatsData>(() => {
    if (!locationsData?.data) return EMPTY_STATS;
    const acc = { ...EMPTY_STATS };
    const walk = (nodes: any[]) => {
      nodes.forEach((node) => {
        if (node.level === "DIVISION") {
          acc.divisions++;
          if (node.is_cod_supported) acc.codDivisions++;
          if (node.is_dg_cod_supported) acc.dgCodDivisions++;
        } else if (node.level === "DISTRICT") {
          acc.districts++;
          if (node.is_cod_supported) acc.codDistricts++;
          if (node.is_dg_cod_supported) acc.dgCodDistricts++;
        } else if (node.level === "THANA") {
          acc.thanas++;
          if (node.is_cod_supported) acc.codThanas++;
          if (node.is_dg_cod_supported) acc.dgCodThanas++;
        }
        if (node.children?.length) walk(node.children);
      });
    };
    walk(locationsData.data);
    acc.total = acc.divisions + acc.districts + acc.thanas;
    return acc;
  }, [locationsData]);

  if (isLoading || !isClient) {
    return (
      <div aria-busy="true" aria-label="Loading location statistics" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)}
      </div>
    );
  }

  const codFooter = (cod: number, dgCod: number) => (
    <span className="flex items-center gap-3">
      <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-emerald-500" /> COD {cod}</span>
      <span className="flex items-center gap-1"><Package className="h-3 w-3 text-sky-500" /> DG COD {dgCod}</span>
    </span>
  );

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Divisions"
        value={stats.divisions}
        icon={<Building />}
        accent="sky"
        hint="Top-level regions"
        footer={codFooter(stats.codDivisions, stats.dgCodDivisions)}
      />
      <StatCard
        label="Districts"
        value={stats.districts}
        icon={<MapPin />}
        accent="green"
        hint="Cities under divisions"
        footer={codFooter(stats.codDistricts, stats.dgCodDistricts)}
      />
      <StatCard
        label="Thanas / Areas"
        value={stats.thanas}
        icon={<Navigation />}
        accent="indigo"
        hint="Delivery zones under districts"
        footer={codFooter(stats.codThanas, stats.dgCodThanas)}
      />
      <StatCard
        label="Total Locations"
        value={stats.total}
        icon={<Package />}
        accent="amber"
        hint="Across all hierarchy levels"
        footer={codFooter(
          stats.codDivisions + stats.codDistricts + stats.codThanas,
          stats.dgCodDivisions + stats.dgCodDistricts + stats.dgCodThanas,
        )}
      />
    </div>
  );
}
