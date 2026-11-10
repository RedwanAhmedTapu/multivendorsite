// app/admin-dashboard/courier/page.tsx
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
  Plus,
  Pencil,
  Trash2,
  Power,
  DollarSign,
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
import {
  useGetPricingRulesQuery,
  useCreatePricingRuleMutation,
  useUpdatePricingRuleMutation,
  useTogglePricingRuleMutation,
  useDeletePricingRuleMutation,
  type CourierPricingRule,
  type CreatePricingRuleRequest,
  type UpdatePricingRuleRequest,
} from "@/features/courierPricingRulesApi";
import { useGetLeafLocationsQuery } from "@/features/locationApi";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

export default function CourierAdminPage() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div
      className="min-h-screen bg-[#F0F4FA]"
      style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
    >
      <div className="container mx-auto px-3 py-4 sm:p-6 space-y-5">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-[#1D4ED8] to-[#7C3AED] bg-clip-text text-transparent">
              Courier Management
            </h1>
            <p className="text-sm md:text-base text-[#7A90AB] mt-1">
              Manage courier integrations, serviceable areas, and delivery
              settings
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Badge variant="outline" className="text-sm border-[#E5EAF2] text-[#1D4ED8] bg-[#EEF3FB]">
              <Activity className="w-3 h-3 mr-1" />
              Platform Admin
            </Badge>
            <Link href="/admin-dashboard/courier/courier-store">
              <Button
                size="sm"
                variant="outline"
                className="border-[#E5EAF2] text-[#3D5068] hover:bg-[#FAFBFD]"
              >
                <Truck className="w-4 h-4 mr-2" />
                Courier Store
              </Button>
            </Link>
            <Link href="/admin-dashboard/courier/credentials">
              <Button size="sm" className="bg-gradient-to-r from-[#1D4ED8] to-[#7C3AED] hover:from-[#2563EB] hover:to-[#8B5CF6] text-white border-0 shadow-sm">
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
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-[#E5EAF2] p-1 h-auto gap-1">
            <TabsTrigger
              value="overview"
              className="rounded-lg py-2 text-xs sm:text-sm data-[state=active]:bg-[#EEF3FB] data-[state=active]:text-[#1D4ED8] dark:data-[state=active]:bg-[#1D4ED8]"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Overview</span>
              <span className="sm:hidden">Stats</span>
            </TabsTrigger>
            <TabsTrigger
              value="pathao"
              className="rounded-lg py-2 text-xs sm:text-sm data-[state=active]:bg-[#EEF3FB] data-[state=active]:text-[#1D4ED8] dark:data-[state=active]:bg-[#1D4ED8]"
            >
              <Building2 className="w-4 h-4 mr-2" />
              Pathao
            </TabsTrigger>
            <TabsTrigger
              value="redx"
              className="rounded-lg py-2 text-xs sm:text-sm data-[state=active]:bg-[#EEF3FB] data-[state=active]:text-[#1D4ED8] dark:data-[state=active]:bg-[#1D4ED8]"
            >
              <Building2 className="w-4 h-4 mr-2" />
              RedX
            </TabsTrigger>
            <TabsTrigger
              value="areas"
              className="rounded-lg py-2 text-xs sm:text-sm data-[state=active]:bg-[#EEF3FB] data-[state=active]:text-[#1D4ED8] dark:data-[state=active]:bg-[#1D4ED8]"
            >
              <MapPin className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Areas</span>
              <span className="sm:hidden">Map</span>
            </TabsTrigger>
            <TabsTrigger
              value="pricing"
              className="rounded-lg py-2 text-xs sm:text-sm data-[state=active]:bg-[#EEF3FB] data-[state=active]:text-[#1D4ED8] dark:data-[state=active]:bg-[#1D4ED8]"
            >
              <DollarSign className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Pricing Rules</span>
              <span className="sm:hidden">Rates</span>
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

          <TabsContent value="pricing" className="space-y-6">
            <PricingRulesManagement />
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
        <RefreshCw className="w-8 h-8 animate-spin text-[#1D4ED8]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-2xl bg-gradient-to-br from-[#EEF3FB] to-[#E5EAF2] dark:from-[#1D4ED8] dark:to-[#1D4ED8] border-[#E5EAF2] shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              Active Providers
              <Building2 className="w-4 h-4 text-[#1D4ED8]" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#1D4ED8] dark:text-[#93A9D9]">
              {activeProviders}/{totalProviders}
            </div>
            <p className="text-xs text-[#1D4ED8] dark:text-[#3B5FCB] mt-1">
              {totalProviders > 0 
                ? ((activeProviders / totalProviders) * 100).toFixed(0)
                : 0}%
              operational
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 border-blue-200 shadow-sm">
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

        <Card className="rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800 border-purple-200 shadow-sm">
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

        <Card className="rounded-2xl bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 border-green-200 shadow-sm">
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
          <Link href="/admin-dashboard/courier/credentials">
            <Button size="sm" variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              Manage All
            </Button>
          </Link>
        </div>

        {providers.length === 0 ? (
          <Card className="rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 border-dashed border-gray-200">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Truck className="w-16 h-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                No Courier Providers
              </h3>
              <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
                Get started by adding your first courier provider to enable
                deliveries
              </p>
              <Link href="/admin-dashboard/courier/credentials">
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
                className="rounded-2xl border-[#E5EAF2] hover:shadow-lg transition-shadow"
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
                    <Link href="/admin-dashboard/courier/credentials" className="flex-1">
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
      <Card className="rounded-2xl border-dashed border-[#E5EAF2] bg-[#EEF3FB]/30">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Building2 className="w-16 h-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Pathao Not Configured</h3>
          <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
            You need to add Pathao as a courier provider first
          </p>
          <Link href="/admin-dashboard/courier/credentials">
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
      <Alert className="bg-[#EEF3FB] dark:bg-[#1D4ED8] border-[#E5EAF2]">
        <Info className="h-4 w-4 text-[#1D4ED8]" />
        <AlertTitle className="text-[#1D4ED8] dark:text-[#E5EAF2]">
          Pathao Area Explorer
        </AlertTitle>
        <AlertDescription className="text-[#1D4ED8] dark:text-[#93A9D9]">
          Browse Pathao's serviceable areas and map them to your platform
          locations for automatic courier routing.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Filters Card */}
        <Card className="lg:col-span-1 rounded-2xl border-[#E5EAF2] shadow-sm">
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
        <Card className="lg:col-span-2 rounded-2xl border-[#E5EAF2] shadow-sm">
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
                <RefreshCw className="w-8 h-8 animate-spin text-[#1D4ED8]" />
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
                      <TableRow className="bg-[#EEF3FB] dark:bg-[#1D4ED8]">
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
      <Card className="rounded-2xl border-dashed border-[#E5EAF2] bg-[#EEF3FB]/30">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Building2 className="w-16 h-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">RedX Not Configured</h3>
          <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
            You need to add RedX as a courier provider first
          </p>
          <Link href="/admin-dashboard/courier/credentials">
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
                <Link href="/admin-dashboard/courier/credentials" className="ml-2 underline font-medium">
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
        <Card className="lg:col-span-1 rounded-2xl border-[#E5EAF2] shadow-sm">
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
        <Card className="lg:col-span-2 rounded-2xl border-[#E5EAF2] shadow-sm">
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
        <Card className="rounded-2xl bg-gradient-to-br from-[#EEF3FB] to-[#E5EAF2] dark:from-[#1D4ED8] dark:to-[#1D4ED8] shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Mapped Areas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#1D4ED8] dark:text-[#93A9D9]">
              {areas.length}
            </div>
            <p className="text-xs text-[#1D4ED8] dark:text-[#3B5FCB] mt-1">
              {activeAreas} active
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 shadow-sm">
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

        <Card className="rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800 shadow-sm">
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
      <Card className="rounded-2xl border-[#E5EAF2] shadow-sm">
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

// ==================== PRICING RULES MANAGEMENT ====================

/**
 * Create/edit form state. Every numeric field is held as a string so a
 * half-typed or empty box is never silently coerced to 0: the empty string
 * means "not set" and is mapped to null / the backend default only on submit.
 */
type PricingRuleFormState = {
  courierProviderId: string;
  fromLocationId: string;
  toLocationId: string;
  minWeight: string;
  maxWeight: string;
  basePrice: string;
  perKgCharge: string;
  fuelSurcharge: string;
  validFrom: string;
  validTo: string;
  priority: string;
  isActive: boolean;
};

const EMPTY_PRICING_RULE_FORM: PricingRuleFormState = {
  courierProviderId: "",
  fromLocationId: "",
  toLocationId: "",
  minWeight: "0",
  maxWeight: "",
  basePrice: "",
  perKgCharge: "0",
  fuelSurcharge: "0",
  validFrom: "",
  validTo: "",
  priority: "100",
  isActive: true,
};

/** Empty string -> fallback (null keeps "no bound" / "provider default"). */
const optionalNumber = (raw: string, fallback: number | null): number | null =>
  raw.trim() === "" ? fallback : Number(raw);

const formatAmount = (value: number | null | undefined) =>
  value === null || value === undefined ? "-" : String(value);

/** "0-10 kg", or "5 kg+" when the rule has no upper bound. */
const weightBandLabel = (rule: CourierPricingRule) =>
  rule.maxWeight === null || rule.maxWeight === undefined
    ? `${rule.minWeight} kg+`
    : `${rule.minWeight}-${rule.maxWeight} kg`;

/** A null location means "any lane" on that side of the route. */
const laneLabel = (rule: CourierPricingRule) => {
  const from =
    rule.locations_courier_pricing_rules_fromLocationIdTolocations?.name ||
    "Any pickup location";
  const to =
    rule.locations_courier_pricing_rules_toLocationIdTolocations?.name ||
    "Nationwide";
  return `${from} -> ${to}`;
};

const validityLabel = (rule: CourierPricingRule) => {
  const from = rule.validFrom
    ? new Date(rule.validFrom).toLocaleDateString()
    : "-";
  const to = rule.validTo
    ? new Date(rule.validTo).toLocaleDateString()
    : "No end";
  return `${from} -> ${to}`;
};

/** An open-ended rule is valid forever; a lapsed or future one is not in play. */
const isRuleInWindow = (rule: CourierPricingRule) => {
  const now = Date.now();
  if (rule.validFrom && new Date(rule.validFrom).getTime() > now) return false;
  if (rule.validTo && new Date(rule.validTo).getTime() <= now) return false;
  return true;
};

/**
 * Mirror of the backend's createPricingRule / updatePricingRule validation so
 * an admin sees the problem before the request is sent. The backend stays the
 * authority - this only avoids an avoidable round trip.
 */
function validatePricingRuleForm(form: PricingRuleFormState): string | null {
  if (!form.courierProviderId) return "Select a courier provider";
  if (form.basePrice.trim() === "") return "Base price is required";

  const nonNegative: Array<[string, string]> = [
    ["Base price", form.basePrice],
    ["Per kg charge", form.perKgCharge],
    ["Fuel surcharge", form.fuelSurcharge],
    ["Minimum weight", form.minWeight],
  ];
  for (const [label, raw] of nonNegative) {
    if (raw.trim() === "") continue;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return `${label} must be a finite non-negative number`;
    }
  }

  const minWeight = optionalNumber(form.minWeight, 0) ?? 0;
  if (form.maxWeight.trim() !== "") {
    const maxWeight = Number(form.maxWeight);
    if (!Number.isFinite(maxWeight) || maxWeight <= 0) {
      return "Maximum weight must be a finite positive number";
    }
    if (maxWeight <= minWeight) {
      return `Maximum weight (${maxWeight}) must be greater than minimum weight (${minWeight})`;
    }
  }

  if (form.validFrom && form.validTo) {
    if (new Date(form.validTo) <= new Date(form.validFrom)) {
      return "Valid-to must be strictly after valid-from";
    }
  }

  if (form.priority.trim() !== "" && !Number.isInteger(Number(form.priority))) {
    return "Priority must be a whole number";
  }

  return null;
}

function PricingRulesManagement() {
  const { data: providersData } = useGetCourierProvidersQuery();
  const providers = providersData?.data || [];

  const { data: locationsResponse } = useGetLeafLocationsQuery(undefined);
  const locations = locationsResponse?.data || [];

  const [providerFilter, setProviderFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState<number>(1);

  const { data: rulesData, isLoading } = useGetPricingRulesQuery({
    ...(providerFilter !== "all" ? { courierProviderId: providerFilter } : {}),
    ...(statusFilter === "all" ? {} : { isActive: statusFilter === "active" }),
    page,
    limit: 20,
  });
  const rules = rulesData?.data || [];
  const pagination = rulesData?.pagination;

  const [createPricingRule, { isLoading: isCreating }] =
    useCreatePricingRuleMutation();
  const [updatePricingRule, { isLoading: isUpdating }] =
    useUpdatePricingRuleMutation();
  const [togglePricingRule] = useTogglePricingRuleMutation();
  const [deletePricingRule] = useDeletePricingRuleMutation();

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PricingRuleFormState>(EMPTY_PRICING_RULE_FORM);
  // The date strings the dialog was opened with. A date the admin did not touch
  // is never re-sent: the stored value is a timestamp, so re-sending the day
  // truncated to midnight would silently shift the rule's validity window.
  const [loadedDates, setLoadedDates] = useState({ validFrom: "", validTo: "" });
  const [pendingDelete, setPendingDelete] = useState<CourierPricingRule | null>(null);

  const setField = <K extends keyof PricingRuleFormState>(
    key: K,
    value: PricingRuleFormState[K]
  ) => setForm((previous) => ({ ...previous, [key]: value }));

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_PRICING_RULE_FORM);
    setLoadedDates({ validFrom: "", validTo: "" });
    setFormOpen(true);
  };

  const openEdit = (rule: CourierPricingRule) => {
    // Date inputs are day-granular; remember exactly what was loaded so an
    // untouched date is left out of the update payload entirely.
    const loadedFrom = rule.validFrom ? rule.validFrom.slice(0, 10) : "";
    const loadedTo = rule.validTo ? rule.validTo.slice(0, 10) : "";

    setEditingId(rule.id);
    setLoadedDates({ validFrom: loadedFrom, validTo: loadedTo });
    setForm({
      courierProviderId: rule.courierProviderId,
      fromLocationId: rule.fromLocationId || "",
      toLocationId: rule.toLocationId || "",
      minWeight: String(rule.minWeight ?? 0),
      maxWeight:
        rule.maxWeight === null || rule.maxWeight === undefined
          ? ""
          : String(rule.maxWeight),
      basePrice: String(rule.basePrice ?? ""),
      perKgCharge: String(rule.perKgCharge ?? 0),
      fuelSurcharge:
        rule.fuelSurcharge === null || rule.fuelSurcharge === undefined
          ? "0"
          : String(rule.fuelSurcharge),
      validFrom: loadedFrom,
      validTo: loadedTo,
      priority: String(rule.priority ?? 100),
      isActive: rule.isActive,
    });
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    const problem = validatePricingRuleForm(form);
    if (problem) {
      toast.error(problem);
      return;
    }

    // validFrom is a non-nullable column, so it can never be cleared - only
    // moved. Refuse rather than silently keeping the old value.
    if (editingId && form.validFrom === "" && loadedDates.validFrom !== "") {
      toast.error(
        "Valid-from is required and cannot be cleared; delete the rule instead"
      );
      return;
    }

    const base = {
      fromLocationId: form.fromLocationId || null,
      toLocationId: form.toLocationId || null,
      minWeight: optionalNumber(form.minWeight, 0) ?? 0,
      maxWeight: optionalNumber(form.maxWeight, null),
      basePrice: Number(form.basePrice),
      perKgCharge: optionalNumber(form.perKgCharge, 0) ?? 0,
      fuelSurcharge: optionalNumber(form.fuelSurcharge, 0) ?? 0,
      priority: form.priority.trim() === "" ? 100 : Number(form.priority),
      isActive: form.isActive,
    };

    const toIso = (day: string) => new Date(day).toISOString();

    try {
      if (editingId) {
        const body: UpdatePricingRuleRequest = { id: editingId, ...base };
        if (form.validFrom !== loadedDates.validFrom) {
          body.validFrom = toIso(form.validFrom);
        }
        if (form.validTo !== loadedDates.validTo) {
          // An emptied box means "no end date", which the API expresses as null;
          // omitting the key would instead keep whatever is stored.
          body.validTo = form.validTo === "" ? null : toIso(form.validTo);
        }
        await updatePricingRule(body).unwrap();
        toast.success("Pricing rule updated");
      } else {
        const body: CreatePricingRuleRequest = {
          courierProviderId: form.courierProviderId,
          ...base,
        };
        if (form.validFrom) body.validFrom = toIso(form.validFrom);
        if (form.validTo) body.validTo = toIso(form.validTo);
        await createPricingRule(body).unwrap();
        toast.success("Pricing rule created");
      }
      setFormOpen(false);
    } catch (error: any) {
      toast.error(
        editingId ? "Failed to update pricing rule" : "Failed to create pricing rule",
        { description: error?.data?.message || "Please try again" }
      );
    }
  };

  const handleToggle = async (rule: CourierPricingRule) => {
    try {
      const result = await togglePricingRule({ id: rule.id }).unwrap();
      toast.success(
        result?.data?.isActive
          ? "Pricing rule activated"
          : "Pricing rule deactivated"
      );
    } catch (error: any) {
      toast.error("Failed to change pricing rule status", {
        description: error?.data?.message || "Please try again",
      });
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    try {
      await deletePricingRule({ id: pendingDelete.id }).unwrap();
      toast.success("Pricing rule deleted");
      setPendingDelete(null);
    } catch (error: any) {
      toast.error("Failed to delete pricing rule", {
        description: error?.data?.message || "Please try again",
      });
    }
  };

  const activeCount = rules.filter((rule) => rule.isActive).length;
  const isSaving = isCreating || isUpdating;

  return (
    <div className="space-y-6">
      <Card className="bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-[#E5EAF2]">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-[#1D4ED8]" />
                Courier Pricing Rules
              </CardTitle>
              <CardDescription className="mt-1">
                Platform-wide delivery rates. A lane is priced at checkout only by
                an active rule for that provider that is inside its validity window
                and matches the parcel weight.
              </CardDescription>
            </div>
            <Button
              onClick={openCreate}
              className="bg-[#1D4ED8] hover:bg-[#1a45bd] text-white shrink-0"
            >
              <Plus className="w-4 h-4 mr-2" />
              New rule
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <Alert className="border-[#E5EAF2] bg-[#F7F9FC] dark:bg-gray-900">
            <Info className="h-4 w-4" />
            <AlertTitle>Enter business-approved rates only</AlertTitle>
            <AlertDescription>
              Nothing is prefilled and no rate is ever invented here. Use the courier
              contract rates your business has approved. Deactivate a rule to withdraw
              it from checkout pricing; deleting the only applicable rule for a lane
              makes checkout quotes for that lane fail.
            </AlertDescription>
          </Alert>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Select
              value={providerFilter}
              onValueChange={(value) => {
                setProviderFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-56">
                <SelectValue placeholder="All providers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All providers</SelectItem>
                {providers.map((provider) => (
                  <SelectItem key={provider.id} value={provider.id}>
                    {provider.displayName || provider.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active only</SelectItem>
                <SelectItem value="inactive">Inactive only</SelectItem>
              </SelectContent>
            </Select>

            <div className="sm:ml-auto flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <Badge variant="secondary">{rules.length} shown</Badge>
              <Badge variant="secondary">{activeCount} active</Badge>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-gray-500">
              <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
              Loading pricing rules...
            </div>
          ) : rules.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No pricing rules</AlertTitle>
              <AlertDescription>
                No rule matches the current filters. Until one exists, the checkout
                delivery engine cannot price this lane.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Provider</TableHead>
                    <TableHead>Lane</TableHead>
                    <TableHead>Weight band</TableHead>
                    <TableHead>Base price</TableHead>
                    <TableHead>Per kg</TableHead>
                    <TableHead>Validity</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell className="font-medium">
                        {rule.courier_providers?.displayName ||
                          rule.courier_providers?.name ||
                          rule.courierProviderId}
                      </TableCell>
                      <TableCell className="text-xs">{laneLabel(rule)}</TableCell>
                      <TableCell>{weightBandLabel(rule)}</TableCell>
                      <TableCell>{formatAmount(rule.basePrice)}</TableCell>
                      <TableCell>{formatAmount(rule.perKgCharge)}</TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-gray-600 dark:text-gray-300">
                        {validityLabel(rule)}
                      </TableCell>
                      <TableCell>{rule.priority}</TableCell>
                      <TableCell>
                        <Badge variant={rule.isActive ? "default" : "secondary"}>
                          {rule.isActive ? "Active" : "Inactive"}
                        </Badge>
                        {rule.isActive && !isRuleInWindow(rule) && (
                          <span className="ml-1 text-[10px] text-amber-600">
                            out of window
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            title="Edit rule"
                            onClick={() => openEdit(rule)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            title={rule.isActive ? "Deactivate rule" : "Activate rule"}
                            onClick={() => handleToggle(rule)}
                          >
                            <Power className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            title="Delete rule"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setPendingDelete(rule)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
              <span>
                Page {pagination.page} of {pagination.totalPages} ({pagination.total}{' '}
                rules)
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / edit dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit pricing rule" : "New pricing rule"}
            </DialogTitle>
            <DialogDescription>
              Rules are platform-wide: vendor-scoped pricing is not supported and
              delivery type is fixed to standard (NORMAL) delivery.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pricing-provider">Courier provider</Label>
              <Select
                value={form.courierProviderId}
                onValueChange={(value) => setField("courierProviderId", value)}
                disabled={Boolean(editingId)}
              >
                <SelectTrigger id="pricing-provider">
                  <SelectValue placeholder="Select provider" />
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

            <div className="space-y-2">
              <Label htmlFor="pricing-from">Pickup location</Label>
              <Select
                value={form.fromLocationId || "any"}
                onValueChange={(value) =>
                  setField("fromLocationId", value === "any" ? "" : value)
                }
              >
                <SelectTrigger id="pricing-from">
                  <SelectValue placeholder="Any pickup location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any pickup location</SelectItem>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pricing-to">Delivery location</Label>
              <Select
                value={form.toLocationId || "any"}
                onValueChange={(value) =>
                  setField("toLocationId", value === "any" ? "" : value)
                }
              >
                <SelectTrigger id="pricing-to">
                  <SelectValue placeholder="Nationwide" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Nationwide</SelectItem>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pricing-base">Base price</Label>
              <Input
                id="pricing-base"
                type="number"
                min="0"
                step="0.01"
                value={form.basePrice}
                onChange={(event) => setField("basePrice", event.target.value)}
                placeholder="Required"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pricing-perkg">Per kg charge</Label>
              <Input
                id="pricing-perkg"
                type="number"
                min="0"
                step="0.01"
                value={form.perKgCharge}
                onChange={(event) => setField("perKgCharge", event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pricing-fuel">Fuel surcharge</Label>
              <Input
                id="pricing-fuel"
                type="number"
                min="0"
                step="0.01"
                value={form.fuelSurcharge}
                onChange={(event) => setField("fuelSurcharge", event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pricing-min">Minimum weight (kg)</Label>
              <Input
                id="pricing-min"
                type="number"
                min="0"
                step="0.01"
                value={form.minWeight}
                onChange={(event) => setField("minWeight", event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pricing-max">Maximum weight (kg)</Label>
              <Input
                id="pricing-max"
                type="number"
                min="0"
                step="0.01"
                value={form.maxWeight}
                onChange={(event) => setField("maxWeight", event.target.value)}
                placeholder="Empty = no upper bound"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pricing-valid-from">Valid from</Label>
              <Input
                id="pricing-valid-from"
                type="date"
                value={form.validFrom}
                onChange={(event) => setField("validFrom", event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pricing-valid-to">Valid to</Label>
              <Input
                id="pricing-valid-to"
                type="date"
                value={form.validTo}
                onChange={(event) => setField("validTo", event.target.value)}
                placeholder="Empty = no end date"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pricing-priority">Priority</Label>
              <Input
                id="pricing-priority"
                type="number"
                step="1"
                value={form.priority}
                onChange={(event) => setField("priority", event.target.value)}
              />
              <p className="text-xs text-gray-500">Lower numbers are evaluated first.</p>
            </div>

            <div className="flex items-center gap-3 sm:col-span-2">
              <Switch
                id="pricing-active"
                checked={form.isActive}
                onCheckedChange={(checked) => setField("isActive", checked)}
              />
              <Label htmlFor="pricing-active" className="cursor-pointer">
                Active - available to the checkout delivery engine
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setFormOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSaving}
              className="bg-[#1D4ED8] hover:bg-[#1a45bd] text-white"
            >
              {isSaving ? "Saving..." : editingId ? "Save changes" : "Create rule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation - deactivating is offered as the safe alternative */}
      <AlertDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this pricing rule?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete
                ? `${laneLabel(pendingDelete)} for ${
                    pendingDelete.courier_providers?.name ||
                    pendingDelete.courierProviderId
                  } will be removed permanently. If it is the only applicable rule for
                  this lane, checkout quotes for the lane will fail - deactivate it
                  instead to keep the row.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Delete rule
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}