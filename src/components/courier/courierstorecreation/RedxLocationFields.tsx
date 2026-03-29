"use client";

import { useEffect } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPin, Loader2 } from "lucide-react";
import { useRedxGetAreasQuery, type Environment } from "@/features/courierApi";
import type { RedxLocation } from "@/types/courier-store";
import type { Location } from "@/features/locationApi";

interface Props {
  courierProviderId: string;
  environment: Environment;
  location: RedxLocation;
  warehouseLocationHint: Location | null;
  onChange: (loc: RedxLocation) => void;
}

export function RedxLocationFields({
  courierProviderId,
  environment,
  location,
  warehouseLocationHint,
  onChange,
}: Props) {
  const { data: areasData, isLoading: areasLoading } = useRedxGetAreasQuery({
    courierProviderId,
    environment,
    district_name: location.districtFilter || undefined,
  });

  const areas = areasData?.data?.areas || [];

  // Get unique districts for filter dropdown
  const allDistricts = [...new Set(areas.map((a) => a.district_name))].sort();

  // Auto-set district filter from warehouse location hint
  useEffect(() => {
    if (!warehouseLocationHint || location.districtFilter) return;

    const hint = warehouseLocationHint as any;
    const districtName =
      hint.level === "DISTRICT"
        ? hint.name
        : hint.level === "THANA"
        ? (hint.locations?.name ?? "")
        : "";

    if (districtName) {
      onChange({ ...location, districtFilter: districtName });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [warehouseLocationHint]);

  // Auto-match area by thana name from warehouse hint
  useEffect(() => {
    if (!warehouseLocationHint || !areas.length || location.areaId) return;

    const hint = warehouseLocationHint as any;
    const nameToMatch = hint.level === "THANA" ? hint.name : "";
    if (!nameToMatch) return;

    const matched = areas.find(
      (a) =>
        a.name.toLowerCase().includes(nameToMatch.toLowerCase()) ||
        nameToMatch.toLowerCase().includes(a.name.toLowerCase())
    );
    if (matched) {
      onChange({ ...location, areaId: matched.id, areaName: matched.name });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [areas, warehouseLocationHint]);

  return (
    <div className="space-y-3">
      {/* District filter */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
          Filter by District
        </Label>
        <Select
          value={location.districtFilter || "__all__"}
          onValueChange={(v) => {
            const val = v === "__all__" ? "" : v;
            onChange({ ...location, districtFilter: val, areaId: null, areaName: "" });
          }}
        >
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder="All districts" />
          </SelectTrigger>
          <SelectContent className="max-h-52">
            <SelectItem value="__all__">All Districts</SelectItem>
            {allDistricts.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Area */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
          Delivery Area <span className="text-red-500">*</span>
        </Label>
        <Select
          value={location.areaId?.toString() || ""}
          onValueChange={(v) => {
            const id = Number(v);
            const area = areas.find((a) => a.id === id);
            onChange({ ...location, areaId: id, areaName: area?.name || "" });
          }}
        >
          <SelectTrigger className="h-9 text-sm">
            {areasLoading ? (
              <span className="flex items-center gap-2 text-slate-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading areas…
              </span>
            ) : (
              <SelectValue placeholder="Select area" />
            )}
          </SelectTrigger>
          <SelectContent className="max-h-64">
            {areas.map((area) => (
              <SelectItem key={area.id} value={area.id.toString()}>
                <div className="flex flex-col leading-tight">
                  <span>{area.name}</span>
                  <span className="text-[10px] text-slate-400">
                    {area.district_name} · {area.division_name}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Selected area chip */}
      {location.areaId && (
        <div className="flex items-center gap-2 px-3 py-2 bg-red-50 rounded-lg border border-red-200 text-sm">
          <MapPin className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
          <span className="text-red-700 font-medium">{location.areaName}</span>
        </div>
      )}
    </div>
  );
}