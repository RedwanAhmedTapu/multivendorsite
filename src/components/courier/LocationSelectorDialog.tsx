// components/courier/LocationSelectorDialog.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Search,
  MapPin,
  ChevronRight,
  CheckCircle,
  Building2,
  Home,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useGetLeafLocationsQuery } from "@/features/locationApi";
import { useSyncServiceableAreasMutation } from "@/features/courierApi";

interface Location {
  id: string;
  name: string;
  name_local?: string;
  parent_id?: string;
  level: string;
  is_leaf_node: boolean;
}

interface CourierArea {
  courierAreaId: string;
  courierAreaName: string;
  courierCityId?: string;
  courierCityName?: string;
  courierZoneId?: string;
  courierZoneName?: string;
  homeDeliveryAvailable: boolean;
  pickupAvailable: boolean;
}

interface LocationSelectorDialogProps {
  open: boolean;
  onClose: () => void;
  courierProviderId: string;
  courierProviderName: string;
  courierArea: CourierArea;
  onMapComplete: (mapping: any) => void;
}

export function LocationSelectorDialog({
  open,
  onClose,
  courierProviderId,
  courierProviderName,
  courierArea,
  onMapComplete,
}: LocationSelectorDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);

  // Use RTK Query hooks
  const { data: locationsResponse, isLoading, error } = useGetLeafLocationsQuery(undefined, {
    skip: !open, // Only fetch when dialog is open
  });

  // Use the sync mutation from RTK Query
  const [syncServiceableAreas, { isLoading: isSyncing }] = useSyncServiceableAreasMutation();

  const locations = locationsResponse?.data || [];

  // Filter locations based on search
  const filteredLocations = searchQuery.trim() === "" 
    ? locations 
    : locations.filter((loc) => {
        const query = searchQuery.toLowerCase();
        return (
          loc.name.toLowerCase().includes(query) ||
          loc.name_local?.toLowerCase().includes(query) ||
          loc.id.toLowerCase().includes(query)
        );
      });

  // Reset selected location when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedLocation(null);
      setSearchQuery("");
    }
  }, [open]);

  // Show error toast if fetch fails
  useEffect(() => {
    if (error) {
      toast.error("Failed to load locations");
    }
  }, [error]);

  const handleMapLocation = async () => {
    if (!selectedLocation) {
      toast.error("Please select a location");
      return;
    }

    try {
      // Prepare the mapping data
      const mapping = {
        locationId: selectedLocation.id,
        courierCityId: courierArea.courierCityId,
        courierZoneId: courierArea.courierZoneId,
        courierAreaId: courierArea.courierAreaId,
        courierCityName: courierArea.courierCityName,
        courierZoneName: courierArea.courierZoneName,
        courierAreaName: courierArea.courierAreaName,
        homeDeliveryAvailable: courierArea.homeDeliveryAvailable,
        pickupAvailable: courierArea.pickupAvailable,
      };

      console.log("Mapping data:", mapping);
      console.log("Courier Provider ID:", courierProviderId);

      // Use RTK Query mutation
      const result = await syncServiceableAreas({
        courierProviderId,
        areas: [mapping],
      }).unwrap();

      console.log("Sync result:", result);

      toast.success(
        `Successfully mapped ${courierArea.courierAreaName} to ${selectedLocation.name}`
      );
      
      // Call the onMapComplete callback
      onMapComplete(mapping);
      
      // Close the dialog
      onClose();
      
    } catch (error: any) {
      console.error("Error mapping location:", error);
      
      // Extract error message
      const errorMessage = 
        error?.data?.message || 
        error?.message || 
        "Failed to map location";
      
      toast.error(errorMessage, {
        description: "Please try again or contact support if the issue persists"
      });
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level.toUpperCase()) {
      case "AREA":
      case "THANA":
        return <Home className="w-4 h-4" />;
      case "DISTRICT":
        return <Building2 className="w-4 h-4" />;
      default:
        return <MapPin className="w-4 h-4" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level.toUpperCase()) {
      case "AREA":
      case "THANA":
        return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
      case "DISTRICT":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300";
      case "DIVISION":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[100vh]  overflow-y-scroll">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-teal-600" />
            Map Courier Area to Platform Location
          </DialogTitle>
          <DialogDescription>
            Map <strong>{courierArea.courierAreaName}</strong> ({courierProviderName}) to a platform location
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 ">
          {/* Courier Area Info */}
          <div className="p-4 bg-teal-50 dark:bg-teal-900 rounded-lg border border-teal-200 dark:border-teal-700">
            <Label className="text-xs text-teal-600 dark:text-teal-400 mb-2">
              Courier Area Information
            </Label>
            <div className="space-y-2 mt-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Area Name</span>
                <span className="text-sm">{courierArea.courierAreaName}</span>
              </div>
              {courierArea.courierCityName && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">City</span>
                  <span className="text-sm">{courierArea.courierCityName}</span>
                </div>
              )}
              {courierArea.courierZoneName && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Zone</span>
                  <span className="text-sm">{courierArea.courierZoneName}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Capabilities</span>
                <div className="flex gap-2">
                  {courierArea.homeDeliveryAvailable && (
                    <Badge variant="outline" className="text-xs">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Home Delivery
                    </Badge>
                  )}
                  {courierArea.pickupAvailable && (
                    <Badge variant="outline" className="text-xs">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Pickup
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Search */}
          <div className="space-y-2">
            <Label>Search Platform Locations</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, local name, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Location List */}
          <ScrollArea className="h-[300px] border rounded-lg p-2">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 animate-spin text-teal-600 mr-2" />
                <p className="text-sm text-muted-foreground">Loading locations...</p>
              </div>
            ) : filteredLocations.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? "No locations match your search" : "No locations available"}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredLocations.map((location) => (
                  <button
                    key={location.id}
                    onClick={() => setSelectedLocation(location)}
                    className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                      selectedLocation?.id === location.id
                        ? "border-teal-500 bg-teal-50 dark:bg-teal-900"
                        : "border-gray-200 dark:border-gray-700 hover:border-teal-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${getLevelColor(location.level)}`}>
                          {getLevelIcon(location.level)}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{location.name}</p>
                          {location.name_local && (
                            <p className="text-xs text-muted-foreground">{location.name_local}</p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {location.level}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              ID: {location.id}
                            </span>
                          </div>
                        </div>
                      </div>
                      {selectedLocation?.id === location.id && (
                        <CheckCircle className="w-5 h-5 text-teal-600" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Selected Location Summary */}
          {selectedLocation && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900 rounded-lg border border-blue-200 dark:border-blue-700">
              <Label className="text-xs text-blue-600 dark:text-blue-400">
                Selected Location
              </Label>
              <div className="mt-2 flex items-center gap-2">
                <Badge variant="outline">{selectedLocation.level}</Badge>
                <span className="text-sm font-medium">{selectedLocation.name}</span>
                {selectedLocation.name_local && (
                  <span className="text-xs text-muted-foreground">
                    ({selectedLocation.name_local})
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSyncing}>
            Cancel
          </Button>
          <Button
            onClick={handleMapLocation}
            disabled={!selectedLocation || isSyncing}
          >
            {isSyncing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Mapping...
              </>
            ) : (
              <>
                <ChevronRight className="w-4 h-4 mr-2" />
                Map Location
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}