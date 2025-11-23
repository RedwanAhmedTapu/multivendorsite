// components/shipping/LocationManager.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronDown,
  ChevronRight,
  MapPin,
  Building,
  Navigation,
  Search,
  RefreshCw,
  CheckCircle,
  XCircle,
  Copy,
  CheckCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useGetCitiesQuery, useGetZonesQuery, useGetAreasQuery } from "@/features/shippingProviderApi";

interface LocationManagerProps {
  provider: string;
  onLocationSelect?: (location: {
    city?: { id: number; name: string };
    zone?: { id: number; name: string };
    area?: { id: number; name: string };
  }) => void;
  selectedLocation?: {
    cityId?: number;
    zoneId?: number;
    areaId?: number;
  };
}

// Simple toast component
function SimpleToast({ message, isVisible }: { message: string; isVisible: boolean }) {
  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-4 py-2 rounded-md shadow-lg animate-in slide-in-from-right-5 duration-300">
      {message}
    </div>
  );
}

export function LocationManager({ 
  provider, 
  onLocationSelect,
  selectedLocation 
}: LocationManagerProps) {
  const [selectedCityId, setSelectedCityId] = useState<number | null>(
    selectedLocation?.cityId || null
  );
  const [selectedZoneId, setSelectedZoneId] = useState<number | null>(
    selectedLocation?.zoneId || null
  );
  const [selectedAreaId, setSelectedAreaId] = useState<number | null>(
    selectedLocation?.areaId || null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedSections, setExpandedSections] = useState({
    cities: true,
    zones: false,
    areas: false,
  });
  const [copiedStates, setCopiedStates] = useState({
    cities: false,
    zones: false,
    areas: false,
  });
  const [toast, setToast] = useState<{ message: string; isVisible: boolean }>({
    message: "",
    isVisible: false,
  });

  // Show toast function
  const showToast = (message: string) => {
    setToast({ message, isVisible: true });
    setTimeout(() => setToast({ message: "", isVisible: false }), 3000);
  };

  // API queries
  const {
    data: cities = [],
    isLoading: citiesLoading,
    isError: citiesError,
    refetch: refetchCities,
  } = useGetCitiesQuery(provider);

  const {
    data: zones = [],
    isLoading: zonesLoading,
    isError: zonesError,
    refetch: refetchZones,
  } = useGetZonesQuery(
    { provider, cityId: selectedCityId! },
    { skip: !selectedCityId }
  );

  const {
    data: areas = [],
    isLoading: areasLoading,
    isError: areasError,
    refetch: refetchAreas,
  } = useGetAreasQuery(
    { provider, zoneId: selectedZoneId! },
    { skip: !selectedZoneId }
  );

  // Reset selections when provider changes
  useEffect(() => {
    setSelectedCityId(null);
    setSelectedZoneId(null);
    setSelectedAreaId(null);
  }, [provider]);

  // Update selections when selectedLocation prop changes
  useEffect(() => {
    if (selectedLocation?.cityId) {
      setSelectedCityId(selectedLocation.cityId);
    }
    if (selectedLocation?.zoneId) {
      setSelectedZoneId(selectedLocation.zoneId);
    }
    if (selectedLocation?.areaId) {
      setSelectedAreaId(selectedLocation.areaId);
    }
  }, [selectedLocation]);

  // Auto-expand sections when data is available
  useEffect(() => {
    if (selectedCityId && zones.length > 0) {
      setExpandedSections(prev => ({ ...prev, zones: true }));
    }
    if (selectedZoneId && areas.length > 0) {
      setExpandedSections(prev => ({ ...prev, areas: true }));
    }
  }, [selectedCityId, selectedZoneId, zones.length, areas.length]);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleCitySelect = (cityId: number, cityName: string) => {
    setSelectedCityId(cityId);
    setSelectedZoneId(null);
    setSelectedAreaId(null);
    setExpandedSections(prev => ({ ...prev, zones: true, areas: false }));
    
    onLocationSelect?.({
      city: { id: cityId, name: cityName },
      zone: undefined,
      area: undefined,
    });
  };

  const handleZoneSelect = (zoneId: number, zoneName: string) => {
    setSelectedZoneId(zoneId);
    setSelectedAreaId(null);
    setExpandedSections(prev => ({ ...prev, areas: true }));
    
    onLocationSelect?.({
      city: selectedCityId ? { 
        id: selectedCityId, 
        name: cities.find(c => c.city_id === selectedCityId)?.city_name || "" 
      } : undefined,
      zone: { id: zoneId, name: zoneName },
      area: undefined,
    });
  };

  const handleAreaSelect = (areaId: number, areaName: string) => {
    setSelectedAreaId(areaId);
    
    onLocationSelect?.({
      city: selectedCityId ? { 
        id: selectedCityId, 
        name: cities.find(c => c.city_id === selectedCityId)?.city_name || "" 
      } : undefined,
      zone: selectedZoneId ? { 
        id: selectedZoneId, 
        name: zones.find(z => z.zone_id === selectedZoneId)?.zone_name || "" 
      } : undefined,
      area: { id: areaId, name: areaName },
    });
  };

  const clearSelections = () => {
    setSelectedCityId(null);
    setSelectedZoneId(null);
    setSelectedAreaId(null);
    setExpandedSections({ cities: true, zones: false, areas: false });
    setSearchTerm("");
    onLocationSelect?.({});
  };

  // Copy functions
  const copyCitiesToClipboard = async () => {
    const citiesText = cities.map(city => `${city.city_name} (ID: ${city.city_id})`).join('\n');
    try {
      await navigator.clipboard.writeText(citiesText);
      setCopiedStates(prev => ({ ...prev, cities: true }));
      showToast(`✅ Copied ${cities.length} cities to clipboard`);
      setTimeout(() => setCopiedStates(prev => ({ ...prev, cities: false })), 2000);
    } catch (error) {
      showToast("❌ Failed to copy cities");
    }
  };

  const copyZonesToClipboard = async () => {
    const zonesText = zones.map(zone => `${zone.zone_name} (ID: ${zone.zone_id})`).join('\n');
    try {
      await navigator.clipboard.writeText(zonesText);
      setCopiedStates(prev => ({ ...prev, zones: true }));
      showToast(`✅ Copied ${zones.length} zones to clipboard`);
      setTimeout(() => setCopiedStates(prev => ({ ...prev, zones: false })), 2000);
    } catch (error) {
      showToast("❌ Failed to copy zones");
    }
  };

  const copyAreasToClipboard = async () => {
    const areasText = areas.map(area => 
      `${area.area_name} (ID: ${area.area_id}) - Home: ${area.home_delivery_available ? 'Yes' : 'No'}, Pickup: ${area.pickup_available ? 'Yes' : 'No'}`
    ).join('\n');
    try {
      await navigator.clipboard.writeText(areasText);
      setCopiedStates(prev => ({ ...prev, areas: true }));
      showToast(`✅ Copied ${areas.length} areas to clipboard`);
      setTimeout(() => setCopiedStates(prev => ({ ...prev, areas: false })), 2000);
    } catch (error) {
      showToast("❌ Failed to copy areas");
    }
  };

  // Filter data based on search term
  const filteredCities = cities.filter(city =>
    city.city_name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredZones = zones.filter(zone =>
    zone.zone_name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredAreas = areas.filter(area =>
    area.area_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedCity = cities.find(city => city.city_id === selectedCityId);
  const selectedZone = zones.find(zone => zone.zone_id === selectedZoneId);
  const selectedArea = areas.find(area => area.area_id === selectedAreaId);

  return (
    <>
      <SimpleToast message={toast.message} isVisible={toast.isVisible} />
      
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-teal-600" />
                Location Manager
              </CardTitle>
              <CardDescription>
                Select city, zone, and area for {provider} delivery service
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={clearSelections}
                disabled={!selectedCityId && !selectedZoneId && !selectedAreaId}
              >
                Clear
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  refetchCities();
                  if (selectedCityId) refetchZones();
                  if (selectedZoneId) refetchAreas();
                }}
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search cities, zones, or areas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Selected Location Summary */}
          {(selectedCity || selectedZone || selectedArea) && (
            <div className="p-3 bg-teal-50 rounded-lg border border-teal-200">
              <h4 className="text-sm font-medium text-teal-900 mb-2">Selected Location:</h4>
              <div className="flex items-center gap-2 text-sm text-teal-700">
                {selectedCity && (
                  <Badge variant="secondary" className="bg-teal-100 text-teal-800">
                    {selectedCity.city_name}
                  </Badge>
                )}
                {selectedZone && (
                  <>
                    <ChevronRight className="w-4 h-4 text-teal-500" />
                    <Badge variant="secondary" className="bg-teal-100 text-teal-800">
                      {selectedZone.zone_name}
                    </Badge>
                  </>
                )}
                {selectedArea && (
                  <>
                    <ChevronRight className="w-4 h-4 text-teal-500" />
                    <Badge variant="secondary" className="bg-teal-100 text-teal-800">
                      {selectedArea.area_name}
                    </Badge>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-3">
            {/* Cities Section */}
            <Card className={cn(
              "border-2 transition-all",
              selectedCityId ? "border-teal-200 bg-teal-25" : "border-gray-200"
            )}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => toggleSection("cities")}
                    className="flex items-center gap-2 text-left flex-1"
                  >
                    <Building className="w-4 h-4 text-teal-600" />
                    <CardTitle className="text-sm">Cities</CardTitle>
                    <Badge variant="outline" className="ml-1">
                      {citiesLoading ? "..." : cities.length}
                    </Badge>
                    {expandedSections.cities ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={copyCitiesToClipboard}
                    disabled={citiesLoading || cities.length === 0}
                    className="h-8 w-8"
                    title="Copy all cities"
                  >
                    {copiedStates.cities ? (
                      <CheckCheck className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                {citiesError && (
                  <div className="text-xs text-red-600 flex items-center gap-1">
                    <XCircle className="w-3 h-3" />
                    Failed to load cities
                  </div>
                )}
              </CardHeader>

              {expandedSections.cities && (
                <CardContent className="pt-0">
                  <ScrollArea className="h-64">
                    {citiesLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                        Loading cities...
                      </div>
                    ) : filteredCities.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        {searchTerm ? "No cities found" : "No cities available"}
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {filteredCities.map((city) => (
                          <button
                            key={city.city_id}
                            onClick={() => handleCitySelect(city.city_id, city.city_name)}
                            className={cn(
                              "w-full text-left p-2 rounded-md text-sm transition-colors flex items-center justify-between group",
                              selectedCityId === city.city_id
                                ? "bg-teal-100 text-teal-900 border border-teal-200"
                                : "hover:bg-gray-100"
                            )}
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className="truncate">{city.city_name}</span>
                              <Badge variant="outline" className="text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                                ID: {city.city_id}
                              </Badge>
                            </div>
                            {selectedCityId === city.city_id && (
                              <CheckCircle className="w-4 h-4 text-teal-600 flex-shrink-0" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              )}
            </Card>

            {/* Zones Section */}
            <Card className={cn(
              "border-2 transition-all",
              selectedZoneId ? "border-teal-200 bg-teal-25" : "border-gray-200",
              !selectedCityId && "opacity-50"
            )}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => selectedCityId && toggleSection("zones")}
                    className="flex items-center gap-2 text-left flex-1"
                    disabled={!selectedCityId}
                  >
                    <Navigation className="w-4 h-4 text-teal-600" />
                    <CardTitle className="text-sm">Zones</CardTitle>
                    <Badge variant="outline" className="ml-1">
                      {zonesLoading ? "..." : zones.length}
                    </Badge>
                    {expandedSections.zones ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={copyZonesToClipboard}
                    disabled={!selectedCityId || zonesLoading || zones.length === 0}
                    className="h-8 w-8"
                    title="Copy all zones"
                  >
                    {copiedStates.zones ? (
                      <CheckCheck className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                {!selectedCityId ? (
                  <div className="text-xs text-muted-foreground">
                    Select a city first
                  </div>
                ) : zonesError ? (
                  <div className="text-xs text-red-600 flex items-center gap-1">
                    <XCircle className="w-3 h-3" />
                    Failed to load zones
                  </div>
                ) : null}
              </CardHeader>

              {expandedSections.zones && selectedCityId && (
                <CardContent className="pt-0">
                  <ScrollArea className="h-64">
                    {zonesLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                        Loading zones...
                      </div>
                    ) : filteredZones.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        {searchTerm ? "No zones found" : "No zones available"}
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {filteredZones.map((zone) => (
                          <button
                            key={zone.zone_id}
                            onClick={() => handleZoneSelect(zone.zone_id, zone.zone_name)}
                            className={cn(
                              "w-full text-left p-2 rounded-md text-sm transition-colors flex items-center justify-between group",
                              selectedZoneId === zone.zone_id
                                ? "bg-teal-100 text-teal-900 border border-teal-200"
                                : "hover:bg-gray-100"
                            )}
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className="truncate">{zone.zone_name}</span>
                              <Badge variant="outline" className="text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                                ID: {zone.zone_id}
                              </Badge>
                            </div>
                            {selectedZoneId === zone.zone_id && (
                              <CheckCircle className="w-4 h-4 text-teal-600 flex-shrink-0" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              )}
            </Card>

            {/* Areas Section */}
            <Card className={cn(
              "border-2 transition-all",
              selectedAreaId ? "border-teal-200 bg-teal-25" : "border-gray-200",
              !selectedZoneId && "opacity-50"
            )}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => selectedZoneId && toggleSection("areas")}
                    className="flex items-center gap-2 text-left flex-1"
                    disabled={!selectedZoneId}
                  >
                    <MapPin className="w-4 h-4 text-teal-600" />
                    <CardTitle className="text-sm">Areas</CardTitle>
                    <Badge variant="outline" className="ml-1">
                      {areasLoading ? "..." : areas.length}
                    </Badge>
                    {expandedSections.areas ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={copyAreasToClipboard}
                    disabled={!selectedZoneId || areasLoading || areas.length === 0}
                    className="h-8 w-8"
                    title="Copy all areas"
                  >
                    {copiedStates.areas ? (
                      <CheckCheck className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                {!selectedZoneId ? (
                  <div className="text-xs text-muted-foreground">
                    Select a zone first
                  </div>
                ) : areasError ? (
                  <div className="text-xs text-red-600 flex items-center gap-1">
                    <XCircle className="w-3 h-3" />
                    Failed to load areas
                  </div>
                ) : null}
              </CardHeader>

              {expandedSections.areas && selectedZoneId && (
                <CardContent className="pt-0">
                  <ScrollArea className="h-64">
                    {areasLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                        Loading areas...
                      </div>
                    ) : filteredAreas.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        {searchTerm ? "No areas found" : "No areas available"}
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {filteredAreas.map((area) => (
                          <button
                            key={area.area_id}
                            onClick={() => handleAreaSelect(area.area_id, area.area_name)}
                            className={cn(
                              "w-full text-left p-2 rounded-md text-sm transition-colors flex items-center justify-between group",
                              selectedAreaId === area.area_id
                                ? "bg-teal-100 text-teal-900 border border-teal-200"
                                : "hover:bg-gray-100"
                            )}
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className="truncate">{area.area_name}</span>
                              <div className="flex gap-1 flex-shrink-0">
                                <Badge variant="outline" className="text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                                  ID: {area.area_id}
                                </Badge>
                                {area.home_delivery_available && (
                                  <Badge variant="outline" className="text-xs px-1">
                                    Home
                                  </Badge>
                                )}
                                {area.pickup_available && (
                                  <Badge variant="outline" className="text-xs px-1">
                                    Pickup
                                  </Badge>
                                )}
                              </div>
                            </div>
                            {selectedAreaId === area.area_id && (
                              <CheckCircle className="w-4 h-4 text-teal-600 flex-shrink-0 ml-2" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              )}
            </Card>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

// Usage Example Component
export function LocationManagerExample() {
  const [selectedProvider, setSelectedProvider] = useState("PATHAO");
  const [selectedLocation, setSelectedLocation] = useState<{
    city?: { id: number; name: string };
    zone?: { id: number; name: string };
    area?: { id: number; name: string };
  }>({});

  const handleLocationSelect = (location: {
    city?: { id: number; name: string };
    zone?: { id: number; name: string };
    area?: { id: number; name: string };
  }) => {
    setSelectedLocation(location);
    console.log("Selected location:", location);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Label htmlFor="provider">Select Provider:</Label>
        <Select value={selectedProvider} onValueChange={setSelectedProvider}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PATHAO">Pathao</SelectItem>
            <SelectItem value="REDX">RedX</SelectItem>
            <SelectItem value="STEADFAST">Steadfast</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <LocationManager
        provider={selectedProvider}
        onLocationSelect={handleLocationSelect}
        selectedLocation={{
          cityId: selectedLocation.city?.id,
          zoneId: selectedLocation.zone?.id,
          areaId: selectedLocation.area?.id,
        }}
      />

      {/* Display selected location */}
      {selectedLocation.city && (
        <Card>
          <CardHeader>
            <CardTitle>Selected Location Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {selectedLocation.city && (
                <div>
                  <strong>City:</strong> {selectedLocation.city.name} (ID: {selectedLocation.city.id})
                </div>
              )}
              {selectedLocation.zone && (
                <div>
                  <strong>Zone:</strong> {selectedLocation.zone.name} (ID: {selectedLocation.zone.id})
                </div>
              )}
              {selectedLocation.area && (
                <div>
                  <strong>Area:</strong> {selectedLocation.area.name} (ID: {selectedLocation.area.id})
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}