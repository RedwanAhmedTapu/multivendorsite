// src/components/checkout/DeliveryLocation.tsx
import React, { useState, useMemo, useEffect } from "react";
import {
  useGetActiveProviderQuery,
  useGetCitiesQuery,
  useGetZonesQuery,
  useGetAreasQuery,
  useCalculateCostMutation,
} from "../../features/shippingProviderApi";
import { skipToken } from "@reduxjs/toolkit/query";

// Types
import type { City, Zone, Area } from "../../features/shippingProviderApi";

// shadcn/ui
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Navigation, Building } from "lucide-react";

interface DeliveryLocationProps {
  productWeight: number;
  onDeliveryCostCalculated?: (cost: number) => void;
  onLocationSelected?: (data: {
    city: City;
    zone: Zone;
    area: Area;
  }) => void;
}

const DeliveryLocation: React.FC<DeliveryLocationProps> = ({
  productWeight,
  onDeliveryCostCalculated,
  onLocationSelected,
}) => {
  const [step, setStep] = useState<"city" | "zone" | "area">("city");
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [deliveryCost, setDeliveryCost] = useState<number | null>(null);

  // Active provider
  const { data: activeProvider } = useGetActiveProviderQuery();

  // Cities
  const { data: cities = [] } = useGetCitiesQuery(
    activeProvider?.name ?? skipToken
  );

  // Zones
  const { data: zones = [] } = useGetZonesQuery(
    selectedCity && activeProvider?.name
      ? { provider: activeProvider.name, cityId: selectedCity.city_id }
      : skipToken
  );

  // Areas
  const { data: areas = [] } = useGetAreasQuery(
    selectedZone && activeProvider?.name
      ? { provider: activeProvider.name, zoneId: selectedZone.zone_id }
      : skipToken
  );

  // Mutation for cost calculation
  const [calculateCost, { isLoading: isCalculating }] =
    useCalculateCostMutation();

  // Filter items based on search term
  const filteredItems = useMemo(() => {
    let items: { value: string; label: string }[] = [];

    if (step === "city") {
      items = cities.map((c: City) => ({
        value: c.city_id.toString(),
        label: c.city_name,
      }));
    } else if (step === "zone") {
      items = zones.map((z: Zone) => ({
        value: z.zone_id.toString(),
        label: z.zone_name,
      }));
    } else if (step === "area") {
      items = areas.map((a: Area) => ({
        value: a.area_id.toString(),
        label: a.area_name,
      }));
    }

    if (searchTerm.trim() === "") {
      return items;
    }

    return items.filter((item) =>
      item.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [step, cities, zones, areas, searchTerm]);

  // Handler
  const handleSelect = (value: string) => {
    if (step === "city") {
      const city = cities.find((c) => c.city_id.toString() === value);
      if (city) {
        setSelectedCity(city);
        setSelectedZone(null);
        setSelectedArea(null);
        setStep("zone");
        setSearchTerm("");
        setOpen(true);
      }
    } else if (step === "zone") {
      const zone = zones.find((z) => z.zone_id.toString() === value);
      if (zone) {
        setSelectedZone(zone);
        setSelectedArea(null);
        setStep("area");
        setSearchTerm("");
        setOpen(true);
      }
    } else if (step === "area") {
      const area = areas.find((a) => a.area_id.toString() === value);
      if (area) {
        setSelectedArea(area);
        setSearchTerm("");
        setOpen(false);
      }
    }
  };

  // Reset selection
  const resetSelection = () => {
    setSelectedCity(null);
    setSelectedZone(null);
    setSelectedArea(null);
    setStep("city");
    setSearchTerm("");
    setOpen(false);
    setDeliveryCost(null);
  };

  // Go back to previous step
  const goBack = () => {
    if (step === "zone") {
      setStep("city");
      setSelectedZone(null);
      setSelectedArea(null);
      setSearchTerm("");
    } else if (step === "area") {
      setStep("zone");
      setSelectedArea(null);
      setSearchTerm("");
    }
    setOpen(true);
  };

  // Calculate delivery cost when full selection is made
  useEffect(() => {
    const fetchCost = async () => {
      if (
        activeProvider?.name &&
        selectedCity &&
        selectedZone &&
        selectedArea &&
        productWeight > 0
      ) {
        try {
          const payload = {
            provider: activeProvider.name,
            recipient_city: selectedCity.city_id,
            recipient_zone: selectedZone.zone_id,
            item_weight: productWeight,
            item_type: 2, // 1 = document, 2 = parcel (you can make dynamic later)
            delivery_type: 48, // default delivery type
          };

          const result = await calculateCost(payload).unwrap();
          const price =
            result?.data?.total_price || result?.data?.cost || null;

          setDeliveryCost(price);
          if (price && onDeliveryCostCalculated) {
            onDeliveryCostCalculated(price);
          }
          if (onLocationSelected) {
            onLocationSelected({
              city: selectedCity,
              zone: selectedZone,
              area: selectedArea,
            });
          }
        } catch (err) {
          console.error("Failed to calculate cost:", err);
          setDeliveryCost(null);
        }
      }
    };

    fetchCost();
  }, [activeProvider, selectedCity, selectedZone, selectedArea, productWeight]);

  // Dynamic placeholder and icon based on step
  const getStepConfig = () => {
    switch (step) {
      case "city":
        return {
          placeholder: selectedCity?.city_name || "Select City",
          icon: <Building className="h-4 w-4" />,
          label: "City",
          currentSelection: selectedCity?.city_name,
        };
      case "zone":
        return {
          placeholder: selectedZone?.zone_name || "Select Zone",
          icon: <Navigation className="h-4 w-4" />,
          label: "Zone",
          currentSelection: selectedZone?.zone_name,
        };
      case "area":
        return {
          placeholder: selectedArea?.area_name || "Select Area",
          icon: <MapPin className="h-4 w-4" />,
          label: "Area",
          currentSelection: selectedArea?.area_name,
        };
      default:
        return {
          placeholder: "Select Location",
          icon: <MapPin className="h-4 w-4" />,
          label: "Location",
          currentSelection: "",
        };
    }
  };

  const stepConfig = getStepConfig();

  return (
    <div className="p-4 rounded-lg border bg-white space-y-4 max-w-md">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <MapPin className="h-5 w-5 text-teal-600" />
          Delivery Location
        </h2>
        {(selectedCity || selectedZone || selectedArea) && (
          <Badge variant="secondary" className="capitalize">
            {step}
          </Badge>
        )}
      </div>

      {/* Breadcrumb */}
      {(selectedCity || selectedZone) && (
        <div className="flex items-center gap-1 text-sm text-gray-600 flex-wrap">
          <span
            className={`cursor-pointer hover:text-teal-600 ${
              selectedCity ? "text-teal-600" : ""
            }`}
            onClick={() => {
              setStep("city");
              setSelectedZone(null);
              setSelectedArea(null);
              setSearchTerm("");
              setOpen(true);
            }}
          >
            {selectedCity?.city_name || "City"}
          </span>
          {selectedCity && (
            <>
              <span>›</span>
              <span
                className={`cursor-pointer hover:text-teal-600 ${
                  selectedZone ? "text-teal-600" : ""
                }`}
                onClick={() => {
                  setStep("zone");
                  setSelectedArea(null);
                  setSearchTerm("");
                  setOpen(true);
                }}
              >
                {selectedZone?.zone_name || "Zone"}
              </span>
            </>
          )}
          {selectedZone && (
            <>
              <span>›</span>
              <span className="text-teal-600">
                {selectedArea?.area_name || "Area"}
              </span>
            </>
          )}
        </div>
      )}

      <Select
        open={open}
        onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) setSearchTerm("");
        }}
        onValueChange={handleSelect}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={stepConfig.placeholder}>
            <div className="flex items-center gap-2">
              {stepConfig.icon}
              <span>
                {stepConfig.currentSelection || stepConfig.placeholder}
              </span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="max-h-[280px]">
          {/* Search Input */}
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={`Search ${stepConfig.label.toLowerCase()}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
                autoFocus
              />
            </div>
          </div>

          {/* Back Button for zone and area steps */}
          {(step === "zone" || step === "area") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={goBack}
              className="w-full justify-start rounded-none border-b hover:text-teal-600 hover:bg-teal-50"
            >
              ← Back to {step === "zone" ? "Cities" : "Zones"}
            </Button>
          )}

          {/* Results */}
          <div className="max-h-[200px] overflow-y-auto">
            {filteredItems.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                No {stepConfig.label.toLowerCase()} found
              </div>
            ) : (
              filteredItems.map((item) => (
                <SelectItem
                  key={item.value}
                  value={item.value}
                  className="hover:bg-teal-50 focus:bg-teal-50"
                >
                  <div className="flex items-center gap-2">
                    {stepConfig.icon}
                    {item.label}
                  </div>
                </SelectItem>
              ))
            )}
          </div>
        </SelectContent>
      </Select>

      {/* Summary + Cost */}
      {selectedCity && selectedZone && selectedArea && (
        <div className="space-y-2">
          <Button
            variant="outline"
            size="sm"
            onClick={resetSelection}
            className="w-full hover:bg-teal-100 hover:text-teal-800 border-teal-200"
          >
            Change Location
          </Button>

          {deliveryCost !== null && (
            <div className="text-center text-sm text-teal-700 font-semibold">
              {isCalculating ? "Calculating cost..." : `Delivery Cost: ৳${deliveryCost}`}
            </div>
          )}
        </div>
      )}

      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
        <div
          className={`flex items-center gap-1 ${
            step === "city" ? "text-teal-600 font-medium" : ""
          }`}
        >
          <div
            className={`w-2 h-2 rounded-full ${
              step === "city" ? "bg-teal-600" : "bg-gray-300"
            }`}
          />
          <span>City</span>
        </div>
        <div className="w-4 h-px bg-gray-300" />
        <div
          className={`flex items-center gap-1 ${
            step === "zone" ? "text-teal-600 font-medium" : ""
          }`}
        >
          <div
            className={`w-2 h-2 rounded-full ${
              step === "zone" ? "bg-teal-600" : "bg-gray-300"
            }`}
          />
          <span>Zone</span>
        </div>
        <div className="w-4 h-px bg-gray-300" />
        <div
          className={`flex items-center gap-1 ${
            step === "area" ? "text-teal-600 font-medium" : ""
          }`}
        >
          <div
            className={`w-2 h-2 rounded-full ${
              step === "area" ? "bg-teal-600" : "bg-gray-300"
            }`}
          />
          <span>Area</span>
        </div>
      </div>
    </div>
  );
};

export default DeliveryLocation;
