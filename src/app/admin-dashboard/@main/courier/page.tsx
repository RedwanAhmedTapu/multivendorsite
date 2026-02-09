// app/admin/courier/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Truck,
  MapPin,
  Settings,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Download,
  Upload,
  Building2,
  TrendingUp,
  Package,
  Activity,
  Search,
  Filter,
  ExternalLink,
  Info,
  X,
  ChevronRight,
  BarChart3,
} from "lucide-react";
import {
  useGetCourierProvidersQuery,
  usePathaoGetCitiesQuery,
  useLazyPathaoGetZonesQuery,
  useLazyPathaoGetAreasQuery,
  useRedxGetAreasQuery,
  useSyncServiceableAreasMutation,
  useGetServiceableAreasQuery,
  useDeleteServiceableAreaMutation,
  type PathaoCity,
  type PathaoZone,
  type PathaoArea,
  type RedXArea,
  type ServiceableArea,
  Environment,
} from "@/features/courierApi";
import { toast } from "sonner";
import Link from "next/link";
import { LocationSelectorDialog } from "@/components/courier/LocationSelectorDialog";

export default function CourierAdminPage() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
              Courier Management
            </h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              Manage courier integrations, serviceable areas, and delivery
              settings
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-sm">
              <Activity className="w-3 h-3 mr-1" />
              Platform Admin
            </Badge>
            <Link href="/admin/courier/credentials">
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Manage Credentials
              </Button>
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 bg-white dark:bg-gray-800 shadow-sm">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-teal-50 dark:data-[state=active]:bg-teal-900"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Overview</span>
              <span className="sm:hidden">Stats</span>
            </TabsTrigger>
            <TabsTrigger
              value="pathao"
              className="data-[state=active]:bg-teal-50 dark:data-[state=active]:bg-teal-900"
            >
              <Building2 className="w-4 h-4 mr-2" />
              Pathao
            </TabsTrigger>
            <TabsTrigger
              value="redx"
              className="data-[state=active]:bg-teal-50 dark:data-[state=active]:bg-teal-900"
            >
              <Building2 className="w-4 h-4 mr-2" />
              RedX
            </TabsTrigger>
            <TabsTrigger
              value="areas"
              className="data-[state=active]:bg-teal-50 dark:data-[state=active]:bg-teal-900"
            >
              <MapPin className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Areas</span>
              <span className="sm:hidden">Map</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <CourierOverview />
          </TabsContent>

          <TabsContent value="pathao" className="space-y-6">
            <PathaoManagement />
          </TabsContent>

          <TabsContent value="redx" className="space-y-6">
            <RedXManagement />
          </TabsContent>

          <TabsContent value="areas" className="space-y-6">
            <ServiceableAreasManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ==================== OVERVIEW TAB ====================
function CourierOverview() {
  const { data: providersData, isLoading } = useGetCourierProvidersQuery({
    includeCredentials: true,
  });
  const providers = providersData?.data || [];

  const { data: areasData } = useGetServiceableAreasQuery();
  const totalAreas = areasData?.data?.length || 0;

  // Calculate statistics
  const activeProviders = providers.filter((p) => p.isActive).length;
  const totalProviders = providers.length;
  const totalOrders = providers.reduce(
    (sum, p) => sum + (p._count?.courier_orders || 0),
    0
  );
  const totalServiceableAreas = providers.reduce(
    (sum, p) => sum + (p._count?.courier_serviceable_areas || 0),
    0
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900 dark:to-teal-800 border-teal-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              Active Providers
              <Building2 className="w-4 h-4 text-teal-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-teal-700 dark:text-teal-300">
              {activeProviders}/{totalProviders}
            </div>
            <p className="text-xs text-teal-600 dark:text-teal-400 mt-1">
              {totalProviders > 0 
                ? ((activeProviders / totalProviders) * 100).toFixed(0)
                : 0}%
              operational
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              Total Orders
              <Package className="w-4 h-4 text-blue-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">
              {totalOrders.toLocaleString()}
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              All-time deliveries
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800 border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              Serviceable Areas
              <MapPin className="w-4 h-4 text-purple-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-700 dark:text-purple-300">
              {totalServiceableAreas}
            </div>
            <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
              Mapped locations
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              Coverage Rate
              <TrendingUp className="w-4 h-4 text-green-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700 dark:text-green-300">
              {totalProviders > 0
                ? (
                    (totalServiceableAreas / (totalProviders * 100)) *
                    100
                  ).toFixed(0)
                : 0}
              %
            </div>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              Platform coverage
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Providers Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Courier Providers</h2>
          <Link href="/admin/courier/credentials">
            <Button size="sm" variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              Manage All
            </Button>
          </Link>
        </div>

        {providers.length === 0 ? (
          <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Truck className="w-16 h-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                No Courier Providers
              </h3>
              <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
                Get started by adding your first courier provider to enable
                deliveries
              </p>
              <Link href="/admin/courier/credentials">
                <Button>
                  <Building2 className="w-4 h-4 mr-2" />
                  Add Provider
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {providers.map((provider) => (
              <Card
                key={provider.id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-full ${
                          provider.isActive
                            ? "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300"
                            : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                        }`}
                      >
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {provider.displayName || provider.name}
                        </CardTitle>
                        <CardDescription className="text-xs line-clamp-1">
                          {provider.description || "No description"}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge
                      variant={provider.isActive ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {provider.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Orders</p>
                      <p className="text-xl font-bold">
                        {provider._count?.courier_orders || 0}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Areas</p>
                      <p className="text-xl font-bold">
                        {provider._count?.courier_serviceable_areas || 0}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Credentials</span>
                      <Badge variant="outline" className="text-xs">
                        {provider._count?.courier_credentials || 0} configured
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Auth Type</span>
                      <Badge variant="outline" className="text-xs">
                        {provider.authType}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 border-t">
                    <Link href="/admin/courier/credentials" className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Settings className="w-3 h-3 mr-2" />
                        Configure
                      </Button>
                    </Link>
                    <Button variant="outline" size="sm" className="flex-1">
                      <ExternalLink className="w-3 h-3 mr-2" />
                      Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== PATHAO MANAGEMENT TAB ====================
function PathaoManagement() {
  const { data: providersData } = useGetCourierProvidersQuery({
    includeCredentials: true,
  });
  const providers = providersData?.data || [];
  const pathaoProvider = providers.find(
    (p) => p.name.toLowerCase() === "pathao"
  );

  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedZone, setSelectedZone] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [selectedAreaForMapping, setSelectedAreaForMapping] =
    useState<PathaoArea | null>(null);
    
  const getCourierEnvironment = (): Environment =>
    process.env.NEXT_PUBLIC_ENVIRONMENT === "PRODUCTION" ? "PRODUCTION" : "SANDBOX";

  const { data: citiesData, isLoading: citiesLoading } =
    usePathaoGetCitiesQuery(
      {
        courierProviderId: pathaoProvider?.id || "",
        environment: getCourierEnvironment(),
      },
      { skip: !pathaoProvider }
    );

  const [getZones, { data: zonesData, isLoading: zonesLoading }] =
    useLazyPathaoGetZonesQuery();
  const [getAreas, { data: areasData, isLoading: areasLoading }] =
    useLazyPathaoGetAreasQuery();

  const cities = citiesData?.data?.data?.data || [];
  const zones = zonesData?.data?.data?.data || [];
  const areas = areasData?.data?.data?.data || [];

  const filteredAreas = areas.filter((area: PathaoArea) =>
    area.area_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    if (selectedCity && pathaoProvider) {
      getZones({
        courierProviderId: pathaoProvider.id,
        cityId: parseInt(selectedCity),
        environment: getCourierEnvironment(),
      });
    }
  }, [selectedCity, pathaoProvider, getZones]);

  useEffect(() => {
    if (selectedZone && pathaoProvider) {
      getAreas({
        courierProviderId: pathaoProvider.id,
        zoneId: parseInt(selectedZone),
        environment: getCourierEnvironment(),
      });
    }
  }, [selectedZone, pathaoProvider, getAreas]);

  const handleMapArea = (area: PathaoArea) => {
    const cityId = selectedCity;
    const zoneId = selectedZone;
    
    const cityName = cities.find(
      (c: PathaoCity) => c.city_id.toString() === cityId
    )?.city_name;
    
    const zoneName = zones.find(
      (z: PathaoZone) => z.zone_id.toString() === zoneId
    )?.zone_name;

    setSelectedAreaForMapping({
      ...area,
      city_id: parseInt(cityId),
      zone_id: parseInt(zoneId),
    });
    
    setShowLocationDialog(true);
  };

  const handleMappingComplete = (mapping: any) => {
    if (selectedZone && pathaoProvider) {
      getAreas({
        courierProviderId: pathaoProvider.id,
        zoneId: parseInt(selectedZone),
        environment: getCourierEnvironment(),
      });
    }
    setShowLocationDialog(false);
    setSelectedAreaForMapping(null);
  };

  if (!pathaoProvider) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Building2 className="w-16 h-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Pathao Not Configured</h3>
          <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
            You need to add Pathao as a courier provider first
          </p>
          <Link href="/admin/courier/credentials">
            <Button>
              <Building2 className="w-4 h-4 mr-2" />
              Add Pathao Provider
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Info Alert */}
      <Alert className="bg-teal-50 dark:bg-teal-900 border-teal-200">
        <Info className="h-4 w-4 text-teal-600" />
        <AlertTitle className="text-teal-900 dark:text-teal-100">
          Pathao Area Explorer
        </AlertTitle>
        <AlertDescription className="text-teal-700 dark:text-teal-300">
          Browse Pathao's serviceable areas and map them to your platform
          locations for automatic courier routing.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Filters Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters
            </CardTitle>
            <CardDescription>
              Navigate through cities, zones, and areas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* City Selection */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                City
              </Label>
              <Select
                value={selectedCity}
                onValueChange={(value) => {
                  setSelectedCity(value);
                  setSelectedZone("");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a city..." />
                </SelectTrigger>
                <SelectContent>
                  {citiesLoading ? (
                    <SelectItem value="loading" disabled>
                      <RefreshCw className="w-4 h-4 animate-spin inline mr-2" />
                      Loading...
                    </SelectItem>
                  ) : cities.length === 0 ? (
                    <SelectItem value="empty" disabled>
                      No cities available
                    </SelectItem>
                  ) : (
                    cities.map((city: PathaoCity) => (
                      <SelectItem
                        key={city.city_id}
                        value={city.city_id.toString()}
                      >
                        {city.city_name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Zone Selection */}
            {selectedCity && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Zone
                </Label>
                <Select
                  value={selectedZone}
                  onValueChange={setSelectedZone}
                  disabled={zonesLoading || zones.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a zone..." />
                  </SelectTrigger>
                  <SelectContent>
                    {zonesLoading ? (
                      <SelectItem value="loading" disabled>
                        <RefreshCw className="w-4 h-4 animate-spin inline mr-2" />
                        Loading...
                      </SelectItem>
                    ) : zones.length === 0 ? (
                      <SelectItem value="empty" disabled>
                        No zones available
                      </SelectItem>
                    ) : (
                      zones.map((zone: PathaoZone) => (
                        <SelectItem
                          key={zone.zone_id}
                          value={zone.zone_id.toString()}
                        >
                          {zone.zone_name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Stats */}
            {selectedZone && areas.length > 0 && (
              <div className="pt-4 border-t space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Areas</span>
                  <span className="font-semibold">{areas.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Home Delivery</span>
                  <span className="font-semibold">
                    {
                      areas.filter((a: PathaoArea) => a.home_delivery_available)
                        .length
                    }
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Pickup Available
                  </span>
                  <span className="font-semibold">
                    {areas.filter((a: PathaoArea) => a.pickup_available).length}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Areas Display Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Available Areas
                </CardTitle>
                <CardDescription>
                  {selectedZone
                    ? `${filteredAreas.length} areas found`
                    : "Select a zone to view areas"}
                </CardDescription>
              </div>
              {selectedZone && areas.length > 0 && (
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search areas..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                      onClick={() => setSearchQuery("")}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!selectedZone ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <MapPin className="w-12 h-12 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">
                  Select a city and zone to view available areas
                </p>
              </div>
            ) : areasLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin text-teal-600" />
              </div>
            ) : filteredAreas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle className="w-12 h-12 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">
                  {searchQuery
                    ? "No areas match your search"
                    : "No areas found in this zone"}
                </p>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-teal-50 dark:bg-teal-900">
                        <TableHead className="font-semibold">
                          Area Name
                        </TableHead>
                        <TableHead className="font-semibold text-center">
                          Home Delivery
                        </TableHead>
                        <TableHead className="font-semibold text-center">
                          Pickup
                        </TableHead>
                        <TableHead className="font-semibold text-right">
                          Action
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAreas.map((area: PathaoArea) => (
                        <TableRow
                          key={area.area_id}
                          className="hover:bg-muted/50"
                        >
                          <TableCell className="font-medium">
                            {area.area_name}
                          </TableCell>
                          <TableCell className="text-center">
                            {area.home_delivery_available ? (
                              <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                            ) : (
                              <X className="w-5 h-5 text-gray-400 mx-auto" />
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {area.pickup_available ? (
                              <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                            ) : (
                              <X className="w-5 h-5 text-gray-400 mx-auto" />
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMapArea(area)}
                            >
                              <ChevronRight className="w-4 h-4 mr-1" />
                              Map
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Location Selector Dialog */}
      {selectedAreaForMapping && pathaoProvider && (
        <LocationSelectorDialog
          open={showLocationDialog}
          onClose={() => {
            setShowLocationDialog(false);
            setSelectedAreaForMapping(null);
          }}
          courierProviderId={pathaoProvider.id}
          courierProviderName={
            pathaoProvider.displayName || pathaoProvider.name
          }
          courierArea={{
            courierAreaId: selectedAreaForMapping.area_id.toString(),
            courierAreaName: selectedAreaForMapping.area_name,
            courierCityId: selectedCity,
            courierCityName: cities.find(
              (c: PathaoCity) => c.city_id.toString() === selectedCity
            )?.city_name,
            courierZoneId: selectedZone,
            courierZoneName: zones.find(
              (z: PathaoZone) => z.zone_id.toString() === selectedZone
            )?.zone_name,
            homeDeliveryAvailable:
              selectedAreaForMapping.home_delivery_available,
            pickupAvailable: selectedAreaForMapping.pickup_available,
          }}
          onMapComplete={handleMappingComplete}
        />
      )}
    </div>
  );
}

// ==================== REDX MANAGEMENT TAB ====================
function RedXManagement() {
  const { data: providersData } = useGetCourierProvidersQuery({
    includeCredentials: true,
  });
  const providers = providersData?.data || [];
  const redxProvider = providers.find((p) => p.name.toLowerCase() === "redx");

  const [postCode, setPostCode] = useState("");
  const [districtName, setDistrictName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [selectedAreaForMapping, setSelectedAreaForMapping] =
    useState<RedXArea | null>(null);
    
  const getCourierEnvironment = (): Environment =>
    process.env.NEXT_PUBLIC_ENVIRONMENT === "PRODUCTION" ? "PRODUCTION" : "SANDBOX";

  const {
    data: areasData,
    isLoading,
    error,
    refetch,
  } = useRedxGetAreasQuery(
    {
      courierProviderId: redxProvider?.id || "",
      environment: getCourierEnvironment(),
      post_code: postCode ? parseInt(postCode) : undefined,
      district_name: districtName || undefined,
    },
    { skip: !redxProvider || !hasSearched }
  );

  const areas = areasData?.data?.areas || [];
  const totalAvailable = areasData?.data?.totalAvailable || 0;
  const availableSample = areasData?.data?.availableSample || [];
  const hasMessage = areasData?.data?.message;

  // Check if RedX credentials exist and are active
  const hasActiveCredentials = redxProvider?.courier_credentials?.some(
    (cred: any) => cred.isActive && cred.environment === getCourierEnvironment()
  );

  // Determine authentication status based on API response
  const isAuthenticated = hasSearched && !error;
  const authenticationFailed = hasSearched && (error as any)?.status === 401;

  const filteredAreas = areas.filter((area: RedXArea) =>
    area.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSearch = () => {
    setHasSearched(true);
    refetch();
  };

  const handleTestConnection = async () => {
    setPostCode('');
    setDistrictName('');
    setHasSearched(true);
    const result = await refetch();
    
    if (result.error) {
      const errorStatus = (result.error as any)?.status;
      if (errorStatus === 401) {
        toast.error('Authentication Failed', {
          description: 'RedX bearer token is invalid or expired. Please update your credentials.',
        });
      } else {
        toast.error('Connection test failed', {
          description: 'Please check your RedX credentials and try again.',
        });
      }
    } else {
      const totalAreas = result.data?.data?.totalAvailable || 0;
      toast.success('RedX connection successful!', {
        description: `Connected to ${getCourierEnvironment()} environment. Found ${totalAreas} area${totalAreas !== 1 ? 's' : ''}.`,
      });
    }
  };

  const handleMapArea = (area: RedXArea) => {
    setSelectedAreaForMapping(area);
    setShowLocationDialog(true);
  };

  const handleMappingComplete = () => {
    toast.success("Area mapped successfully");
    setShowLocationDialog(false);
    setSelectedAreaForMapping(null);
    refetch();
  };

  if (!redxProvider) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Building2 className="w-16 h-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">RedX Not Configured</h3>
          <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
            You need to add RedX as a courier provider first
          </p>
          <Link href="/admin/courier/credentials">
            <Button>
              <Building2 className="w-4 h-4 mr-2" />
              Add RedX Provider
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Authentication Status Alert */}
      {hasSearched && (
        <Alert 
          className={
            isAuthenticated && !authenticationFailed
              ? "bg-green-50 dark:bg-green-900 border-green-200"
              : "bg-red-50 dark:bg-red-900 border-red-200"
          }
        >
          {isAuthenticated && !authenticationFailed ? (
            <>
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-900 dark:text-green-100 flex items-center gap-2">
                RedX Connected
                <Badge variant="outline" className="bg-green-100 dark:bg-green-800">
                  {getCourierEnvironment()}
                </Badge>
              </AlertTitle>
              <AlertDescription className="text-green-700 dark:text-green-300">
                Your RedX API credentials are active and working properly. Found {totalAvailable} serviceable area{totalAvailable !== 1 ? 's' : ''}.
              </AlertDescription>
            </>
          ) : (
            <>
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertTitle className="text-red-900 dark:text-red-100">
                RedX Authentication Failed
              </AlertTitle>
              <AlertDescription className="text-red-700 dark:text-red-300">
                {authenticationFailed
                  ? "Bearer token is invalid or expired. Please update your RedX credentials."
                  : "Connection failed. Please check your bearer token and try again."}
                <Link href="/admin/courier/credentials" className="ml-2 underline font-medium">
                  Update Credentials
                </Link>
              </AlertDescription>
            </>
          )}
        </Alert>
      )}

      {/* Info Alert */}
      <Alert className="bg-blue-50 dark:bg-blue-900 border-blue-200">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-900 dark:text-blue-100 flex items-center gap-2">
          RedX Area Explorer
          <Badge variant="outline">
            {getCourierEnvironment()} Mode
          </Badge>
        </AlertTitle>
        <AlertDescription className="text-blue-700 dark:text-blue-300">
          Search and browse RedX's serviceable areas by post code or district name.
          {getCourierEnvironment() === 'SANDBOX' && (
            <span className="block mt-2 text-sm">
              💡 <strong>Tip:</strong> Sandbox has limited test data. Try post code{" "}
              <code className="bg-blue-100 dark:bg-blue-800 px-1 py-0.5 rounded">
                1212
              </code>{" "}
              or district{" "}
              <code className="bg-blue-100 dark:bg-blue-800 px-1 py-0.5 rounded">
                Test District
              </code>
            </span>
          )}
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Search Filters */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Search Filters
              </CardTitle>
              {hasActiveCredentials && isAuthenticated && !authenticationFailed ? (
                <Badge variant="default" className="bg-green-600">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Connected
                </Badge>
              ) : hasSearched && authenticationFailed ? (
                <Badge variant="destructive">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Auth Failed
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Not Tested
                </Badge>
              )}
            </div>
            <CardDescription>
              Filter areas by post code or district
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="postcode">Post Code</Label>
              <Input
                id="postcode"
                type="number"
                placeholder="e.g., 1212"
                value={postCode}
                onChange={(e) => setPostCode(e.target.value)}
              />
              {getCourierEnvironment() === 'SANDBOX' && (
                <p className="text-xs text-muted-foreground">
                  Sandbox test post code: 1212
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="district">District Name</Label>
              <Input
                id="district"
                placeholder="e.g., Test District"
                value={districtName}
                onChange={(e) => setDistrictName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Button
                onClick={handleSearch}
                disabled={isLoading || (!postCode && !districtName)}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Search Areas
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                onClick={handleTestConnection}
                disabled={isLoading}
                className="w-full"
              >
                <Activity className="w-4 h-4 mr-2" />
                Test Connection
              </Button>
              
              {hasSearched && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setPostCode('');
                    setDistrictName('');
                    setHasSearched(false);
                    setSearchQuery('');
                  }}
                  className="w-full"
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear All
                </Button>
              )}
            </div>

            {hasSearched && areas.length > 0 && (
              <div className="pt-4 border-t space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Found Areas</span>
                  <span className="font-semibold">{areas.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Available</span>
                  <span className="font-semibold">{totalAvailable}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Unique Districts
                  </span>
                  <span className="font-semibold">
                    {new Set(areas.map((a: RedXArea) => a.district_name)).size}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Display */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Search Results
                </CardTitle>
                <CardDescription>
                  {hasSearched
                    ? areasData?.data?.filtered 
                      ? `${areas.length} of ${totalAvailable} areas match your filters`
                      : `${filteredAreas.length} areas found`
                    : "Use filters to search for areas"}
                </CardDescription>
              </div>
              {hasSearched && areas.length > 0 && (
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Filter results..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                      onClick={() => setSearchQuery("")}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!hasSearched ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Search className="w-12 h-12 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground mb-2">
                  Enter post code or district name and click search
                </p>
                <p className="text-xs text-muted-foreground">
                  or click "Test Connection" to verify your credentials
                </p>
              </div>
            ) : isLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : hasMessage && filteredAreas.length === 0 ? (
              <div className="space-y-6">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>No Matching Areas</AlertTitle>
                  <AlertDescription>
                    {areasData.data.message}
                  </AlertDescription>
                </Alert>

                {availableSample && availableSample.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">
                        Available areas in {getCourierEnvironment()}:
                      </p>
                      <Badge variant="outline">
                        {totalAvailable} total
                      </Badge>
                    </div>
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-blue-50 dark:bg-blue-900">
                            <TableHead>Area Name</TableHead>
                            <TableHead>Post Code</TableHead>
                            <TableHead>District</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {availableSample.map((area: any) => (
                            <TableRow key={area.id}>
                              <TableCell className="font-medium">
                                {area.name}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{area.post_code}</Badge>
                              </TableCell>
                              <TableCell>{area.district_name}</TableCell>
                              <TableCell className="text-right">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setPostCode(area.post_code.toString());
                                    setDistrictName('');
                                    setTimeout(() => handleSearch(), 100);
                                  }}
                                >
                                  Try this
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    
                    <div className="flex justify-center">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setPostCode('');
                          setDistrictName('');
                          handleSearch();
                        }}
                      >
                        <MapPin className="w-4 h-4 mr-2" />
                        View All Areas
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : filteredAreas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle className="w-12 h-12 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">
                  {searchQuery
                    ? "No areas match your filter"
                    : "No areas found. Try different filters."}
                </p>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-blue-50 dark:bg-blue-900">
                        <TableHead className="font-semibold">
                          Area Name
                        </TableHead>
                        <TableHead className="font-semibold">
                          Post Code
                        </TableHead>
                        <TableHead className="font-semibold">
                          District
                        </TableHead>
                        <TableHead className="font-semibold">
                          Division
                        </TableHead>
                        <TableHead className="font-semibold text-right">
                          Action
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAreas.map((area: RedXArea) => (
                        <TableRow key={area.id} className="hover:bg-muted/50">
                          <TableCell className="font-medium">
                            {area.name}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{area.post_code}</Badge>
                          </TableCell>
                          <TableCell>{area.district_name || "N/A"}</TableCell>
                          <TableCell>{area.division_name}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMapArea(area)}
                            >
                              <ChevronRight className="w-4 h-4 mr-1" />
                              Map
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Location Selector Dialog */}
      {selectedAreaForMapping && redxProvider && (
        <LocationSelectorDialog
          open={showLocationDialog}
          onClose={() => {
            setShowLocationDialog(false);
            setSelectedAreaForMapping(null);
          }}
          courierProviderId={redxProvider.id}
          courierProviderName={redxProvider.displayName || redxProvider.name}
          courierArea={{
            courierAreaId: selectedAreaForMapping.id.toString(),
            courierAreaName: selectedAreaForMapping.name,
            courierCityName: selectedAreaForMapping.district_name,
            homeDeliveryAvailable: true,
            pickupAvailable: true,
          }}
          onMapComplete={handleMappingComplete}
        />
      )}
    </div>
  );
}

// ==================== SERVICEABLE AREAS TAB ====================
function ServiceableAreasManagement() {
  const { data: providersData } = useGetCourierProvidersQuery();
  const providers = providersData?.data || [];

  const [selectedCourier, setSelectedCourier] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  const [syncServiceableAreas, { isLoading: isSyncing }] =
    useSyncServiceableAreasMutation();
  const [deleteArea] = useDeleteServiceableAreaMutation();

  const { data: areasData, refetch } = useGetServiceableAreasQuery(
    selectedCourier ? { courierProviderId: selectedCourier } : undefined
  );
  const areas = areasData?.data || [];

  const filteredAreas = areas.filter(
    (area: ServiceableArea) =>
      area.courierAreaName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      area.courierCityName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      area.locations?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleBulkSync = async () => {
    if (!selectedCourier) {
      toast.error("Please select a courier provider");
      return;
    }

    try {
      const sampleAreas = [
        {
          locationId: "sample-location-id",
          courierAreaId: "123",
          courierAreaName: "Sample Area",
          homeDeliveryAvailable: true,
          pickupAvailable: false,
        },
      ];

      await syncServiceableAreas({
        courierProviderId: selectedCourier,
        areas: sampleAreas,
      }).unwrap();

      toast.success(`Successfully synced ${sampleAreas.length} areas`);
      refetch();
    } catch (error: any) {
      toast.error("Failed to sync areas", {
        description: error?.data?.message || "Please try again",
      });
    }
  };

  const handleDelete = async (areaId: string) => {
    try {
      await deleteArea({ areaId }).unwrap();
      toast.success("Area deleted successfully");
      refetch();
    } catch (error: any) {
      toast.error("Failed to delete area", {
        description: error?.data?.message || "Please try again",
      });
    }
  };

  // Calculate stats
  const activeAreas = areas.filter((a: ServiceableArea) => a.isActive).length;
  const homeDeliveryAreas = areas.filter(
    (a: ServiceableArea) => a.homeDeliveryAvailable
  ).length;
  const pickupAreas = areas.filter(
    (a: ServiceableArea) => a.pickupAvailable
  ).length;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900 dark:to-teal-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Mapped Areas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-teal-700 dark:text-teal-300">
              {areas.length}
            </div>
            <p className="text-xs text-teal-600 dark:text-teal-400 mt-1">
              {activeAreas} active
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Home Delivery</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">
              {homeDeliveryAreas}
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              {areas.length > 0
                ? ((homeDeliveryAreas / areas.length) * 100).toFixed(0)
                : 0}
              % coverage
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Pickup Available
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-700 dark:text-purple-300">
              {pickupAreas}
            </div>
            <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
              {areas.length > 0
                ? ((pickupAreas / areas.length) * 100).toFixed(0)
                : 0}
              % coverage
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Management Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Serviceable Areas Management
              </CardTitle>
              <CardDescription>
                Map courier serviceable areas to platform locations
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label>Courier Provider</Label>
              <Select
                value={selectedCourier}
                onValueChange={setSelectedCourier}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select courier..." />
                </SelectTrigger>
                <SelectContent>
                  {providers.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {provider.displayName || provider.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 items-end">
              <Button
                variant="outline"
                disabled={!selectedCourier}
                onClick={() => toast.info("CSV upload feature coming soon")}
              >
                <Upload className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Upload CSV</span>
                <span className="sm:hidden">Upload</span>
              </Button>
              <Button
                onClick={handleBulkSync}
                disabled={!selectedCourier || isSyncing}
              >
                {isSyncing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    <span className="hidden sm:inline">Syncing...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Sync Areas</span>
                    <span className="sm:hidden">Sync</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Search */}
          {areas.length > 0 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search areas, cities, or locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}

          {/* Areas Table */}
          {!selectedCourier ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Building2 className="w-12 h-12 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                Select a courier provider to view and manage areas
              </p>
            </div>
          ) : filteredAreas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MapPin className="w-12 h-12 text-muted-foreground mb-3" />
              <h3 className="text-lg font-semibold mb-2">No Areas Mapped</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery
                  ? "No areas match your search"
                  : "Start by mapping areas using the Pathao or RedX tabs"}
              </p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">
                        Platform Location
                      </TableHead>
                      <TableHead className="font-semibold">
                        Courier Area
                      </TableHead>
                      <TableHead className="font-semibold text-center">
                        Home Delivery
                      </TableHead>
                      <TableHead className="font-semibold text-center">
                        Pickup
                      </TableHead>
                      <TableHead className="font-semibold text-center">
                        Status
                      </TableHead>
                      <TableHead className="font-semibold text-right">
                        Action
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAreas.map((area: ServiceableArea) => (
                      <TableRow key={area.id} className="hover:bg-muted/50">
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {area.locations?.name || "N/A"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              ID: {area.locationId}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {area.courierAreaName}
                            </p>
                            {area.courierCityName && (
                              <p className="text-xs text-muted-foreground">
                                {area.courierCityName}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {area.homeDeliveryAvailable ? (
                            <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                          ) : (
                            <X className="w-5 h-5 text-gray-400 mx-auto" />
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {area.pickupAvailable ? (
                            <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                          ) : (
                            <X className="w-5 h-5 text-gray-400 mx-auto" />
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={area.isActive ? "default" : "secondary"}
                          >
                            {area.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(area.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}