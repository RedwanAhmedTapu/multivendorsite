"use client";

import { useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronRight, MapPin, Loader2 } from "lucide-react";
import {
  usePathaoGetCitiesQuery,
  usePathaoGetZonesQuery,
  usePathaoGetAreasQuery,
  type Environment,
} from "@/features/courierApi";
import type { PathaoLocation } from "@/types/courier-store";
import type { Location } from "@/features/locationApi";

interface Props {
  courierProviderId: string;
  environment: Environment;
  location: PathaoLocation;
  warehouseLocationHint: Location | null;
  onChange: (loc: PathaoLocation) => void;
}

export function PathaoLocationFields({
  courierProviderId,
  environment,
  location,
  warehouseLocationHint,
  onChange,
}: Props) {
  const { data: citiesData, isLoading: citiesLoading } = usePathaoGetCitiesQuery({
    courierProviderId,
    environment,
  });
  const { data: zonesData, isLoading: zonesLoading } = usePathaoGetZonesQuery(
    { courierProviderId, cityId: location.cityId!, environment },
    { skip: !location.cityId }
  );
  const { data: areasData, isLoading: areasLoading } = usePathaoGetAreasQuery(
    { courierProviderId, zoneId: location.zoneId!, environment },
    { skip: !location.zoneId }
  );

  const cities = citiesData?.data?.data?.data || [];
  const zones = zonesData?.data?.data?.data || [];
  const areas = areasData?.data?.data?.data || [];

  // Auto-match city by warehouse location name when cities load
  useEffect(() => {
    if (!warehouseLocationHint || !cities.length || location.cityId) return;

    const hint = warehouseLocationHint as any;
    // Location hierarchy: THANA > DISTRICT > DIVISION
    // Pathao cities usually map to districts/divisions
    const nameToMatch =
      hint.level === "DIVISION"
        ? hint.name
        : hint.level === "DISTRICT"
        ? hint.name
        : hint.locations?.name ?? ""; // thana → parent district

    if (!nameToMatch) return;
    const matched = cities.find((c) =>
      c.city_name.toLowerCase().includes(nameToMatch.toLowerCase()) ||
      nameToMatch.toLowerCase().includes(c.city_name.toLowerCase())
    );
    if (matched) {
      onChange({
        ...location,
        cityId: matched.city_id,
        cityName: matched.city_name,
        zoneId: null,
        zoneName: "",
        areaId: null,
        areaName: "",
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cities, warehouseLocationHint]);

  // Auto-match zone by warehouse hint when zones load
  useEffect(() => {
    if (!warehouseLocationHint || !zones.length || location.zoneId) return;

    const hint = warehouseLocationHint as any;
    const nameToMatch =
      hint.level === "THANA"
        ? hint.name
        : hint.level === "DISTRICT"
        ? hint.name
        : "";

    if (!nameToMatch) return;
    const matched = zones.find((z) =>
      z.zone_name.toLowerCase().includes(nameToMatch.toLowerCase()) ||
      nameToMatch.toLowerCase().includes(z.zone_name.toLowerCase())
    );
    if (matched) {
      onChange({
        ...location,
        zoneId: matched.zone_id,
        zoneName: matched.zone_name,
        areaId: null,
        areaName: "",
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zones, warehouseLocationHint]);

  // Auto-match area by warehouse hint when areas load
  useEffect(() => {
    if (!warehouseLocationHint || !areas.length || location.areaId) return;

    const hint = warehouseLocationHint as any;
    const nameToMatch = hint.level === "THANA" ? hint.name : "";
    if (!nameToMatch) return;

    const matched = areas.find((a) =>
      a.area_name.toLowerCase().includes(nameToMatch.toLowerCase()) ||
      nameToMatch.toLowerCase().includes(a.area_name.toLowerCase())
    );
    if (matched) {
      onChange({ ...location, areaId: matched.area_id, areaName: matched.area_name });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [areas, warehouseLocationHint]);

  return (
    <div className="space-y-3">
      {/* City */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
          City <span className="text-red-500">*</span>
        </Label>
        <Select
          value={location.cityId?.toString() || ""}
          onValueChange={(v) => {
            const id = Number(v);
            const city = cities.find((c) => c.city_id === id);
            onChange({
              cityId: id,
              cityName: city?.city_name || "",
              zoneId: null,
              zoneName: "",
              areaId: null,
              areaName: "",
            });
          }}
        >
          <SelectTrigger className="h-9 text-sm">
            {citiesLoading ? (
              <span className="flex items-center gap-2 text-slate-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading cities…
              </span>
            ) : (
              <SelectValue placeholder="Select city" />
            )}
          </SelectTrigger>
          <SelectContent>
            {cities.map((c) => (
              <SelectItem key={c.city_id} value={c.city_id.toString()}>
                {c.city_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Zone */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
          Zone <span className="text-red-500">*</span>
        </Label>
        <Select
          value={location.zoneId?.toString() || ""}
          disabled={!location.cityId}
          onValueChange={(v) => {
            const id = Number(v);
            const zone = zones.find((z) => z.zone_id === id);
            onChange({
              ...location,
              zoneId: id,
              zoneName: zone?.zone_name || "",
              areaId: null,
              areaName: "",
            });
          }}
        >
          <SelectTrigger className="h-9 text-sm">
            {zonesLoading ? (
              <span className="flex items-center gap-2 text-slate-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading zones…
              </span>
            ) : (
              <SelectValue placeholder={!location.cityId ? "Select city first" : "Select zone"} />
            )}
          </SelectTrigger>
          <SelectContent>
            {zones.map((z) => (
              <SelectItem key={z.zone_id} value={z.zone_id.toString()}>
                {z.zone_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Area */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
          Area <span className="text-red-500">*</span>
        </Label>
        <Select
          value={location.areaId?.toString() || ""}
          disabled={!location.zoneId}
          onValueChange={(v) => {
            const id = Number(v);
            const area = areas.find((a) => a.area_id === id);
            onChange({ ...location, areaId: id, areaName: area?.area_name || "" });
          }}
        >
          <SelectTrigger className="h-9 text-sm">
            {areasLoading ? (
              <span className="flex items-center gap-2 text-slate-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading areas…
              </span>
            ) : (
              <SelectValue placeholder={!location.zoneId ? "Select zone first" : "Select area"} />
            )}
          </SelectTrigger>
          <SelectContent className="max-h-52">
            {areas.map((a) => (
              <SelectItem key={a.area_id} value={a.area_id.toString()}>
                <span>{a.area_name}</span>
                {a.pickup_available && (
                  <Badge
                    variant="outline"
                    className="ml-2 text-[10px] bg-green-50 text-green-700 border-green-200 py-0"
                  >
                    Pickup
                  </Badge>
                )}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Breadcrumb summary */}
      {location.cityId && (
        <div className="flex items-center gap-1.5 flex-wrap px-3 py-2 bg-teal-50 rounded-lg border border-teal-200">
          <MapPin className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
          <Badge className="bg-teal-600 text-white text-xs py-0">{location.cityName}</Badge>
          {location.zoneName && (
            <>
              <ChevronRight className="w-3 h-3 text-teal-400" />
              <Badge variant="outline" className="border-teal-300 text-teal-700 text-xs py-0">
                {location.zoneName}
              </Badge>
            </>
          )}
          {location.areaName && (
            <>
              <ChevronRight className="w-3 h-3 text-teal-400" />
              <Badge variant="outline" className="border-teal-300 text-teal-700 text-xs py-0">
                {location.areaName}
              </Badge>
            </>
          )}
        </div>
      )}
    </div>
  );
}