// app/admin-dashboard/@main/courier/page.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Activity, BarChart3, Building2, Check, ChevronRight, DollarSign, Info,
  MapPin, Package, PencilLine, Plus, Power, Search, Trash2, Truck,
  X,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Badge, Button, Card, EmptyState, Field, Modal, Notice, PageHeader, PageTabs,
  Pager, PayoutShell, SearchBox, Skeleton, Toggle, cx, inputCls,
  tableCls, tdCls, thCls,
} from "@/components/payouts/ui";
import {
  useGetCourierProvidersQuery,
  usePathaoGetCitiesQuery,
  useLazyPathaoGetZonesQuery,
  useLazyPathaoGetAreasQuery,
  useRedxGetAreasQuery,
  useGetServiceableAreasQuery,
  useDeleteServiceableAreaMutation,
  type PathaoCity,
  type PathaoZone,
  type PathaoArea,
  type RedXArea,
  type ServiceableArea,
  Environment,
} from "@/features/courierApi";
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

export default function CourierAdminPage() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <PayoutShell>
      <PageHeader
        icon={<Truck />}
        title="Courier Management"
        subtitle="Manage courier integrations, serviceable areas, and delivery settings."
        actions={
          <>
            <Badge tone="blue" dot>Platform Admin</Badge>
            <Link href="/admin-dashboard/courier/courier-store">
              <Button variant="secondary">
                <Package className="h-3.5 w-3.5" /> Courier Store
              </Button>
            </Link>
            <Link href="/admin-dashboard/courier/credentials">
              <Button>
                <Activity className="h-3.5 w-3.5" /> Manage Credentials
              </Button>
            </Link>
          </>
        }
      />

      <PageTabs
        active={activeTab}
        onChange={setActiveTab}
        items={[
          { key: "overview", label: "Overview", icon: <BarChart3 /> },
          { key: "pathao", label: "Pathao", icon: <Building2 /> },
          { key: "redx", label: "RedX", icon: <Building2 /> },
          { key: "areas", label: "Areas", icon: <MapPin /> },
          { key: "pricing", label: "Pricing Rules", icon: <DollarSign /> },
        ]}
      />

      {activeTab === "overview" && <CourierOverview />}
      {activeTab === "pathao" && <PathaoManagement />}
      {activeTab === "redx" && <RedXManagement />}
      {activeTab === "areas" && <ServiceableAreasManagement />}
      {activeTab === "pricing" && <PricingRulesManagement />}
    </PayoutShell>
  );
}

// ==================== OVERVIEW TAB ====================
function CourierOverview() {
  const { data: providersData, isLoading } = useGetCourierProvidersQuery({
    includeCredentials: true,
  });
  const providers = providersData?.data || [];

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
      <div className="space-y-4" aria-busy="true" aria-label="Loading courier providers">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-lg border border-slate-200 bg-white p-3.5">
              <div className="h-2.5 w-20 rounded bg-slate-200" />
              <div className="mt-2 h-6 w-12 rounded bg-slate-200" />
            </div>
          ))}
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-lg border border-slate-200 bg-white p-4">
              <div className="h-24 rounded bg-slate-100" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-3.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.09em] text-slate-500">Active Providers</p>
          <p className="mt-1 text-[22px] font-semibold tracking-tight text-slate-900 tabular-nums">
            {activeProviders}/{totalProviders}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            {totalProviders > 0 ? ((activeProviders / totalProviders) * 100).toFixed(0) : 0}% operational
          </p>
        </Card>
        <Card className="p-3.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.09em] text-slate-500">Total Orders</p>
          <p className="mt-1 text-[22px] font-semibold tracking-tight text-slate-900 tabular-nums">
            {totalOrders.toLocaleString()}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">All-time deliveries</p>
        </Card>
        <Card className="p-3.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.09em] text-slate-500">Serviceable Areas</p>
          <p className="mt-1 text-[22px] font-semibold tracking-tight text-slate-900 tabular-nums">
            {totalServiceableAreas}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">Mapped locations</p>
        </Card>
        <Card className="p-3.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.09em] text-slate-500">Coverage Rate</p>
          <p className="mt-1 text-[22px] font-semibold tracking-tight text-slate-900 tabular-nums">
            {totalProviders > 0
              ? ((totalServiceableAreas / (totalProviders * 100)) * 100).toFixed(0)
              : 0}
            %
          </p>
          <p className="mt-1 text-[11px] text-slate-500">Platform coverage</p>
        </Card>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[14px] font-semibold text-slate-800">Courier Providers</h2>
          <Link href="/admin-dashboard/courier/credentials">
            <Button size="sm" variant="secondary">Manage All</Button>
          </Link>
        </div>

        {providers.length === 0 ? (
          <EmptyState
            icon={<Truck />}
            title="No courier providers"
            body="Get started by adding your first courier provider to enable deliveries."
            action={
              <Link href="/admin-dashboard/courier/credentials">
                <Button size="sm"><Plus className="h-3.5 w-3.5" /> Add Provider</Button>
              </Link>
            }
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {providers.map((provider) => (
              <Card key={provider.id} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span
                      className={cx(
                        "grid h-9 w-9 shrink-0 place-items-center rounded-lg [&>svg]:h-4 [&>svg]:w-4",
                        provider.isActive ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"
                      )}
                    >
                      <Building2 />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-slate-800">
                        {provider.displayName || provider.name}
                      </p>
                      <p className="truncate text-[11px] text-slate-500">
                        {provider.description || "No description"}
                      </p>
                    </div>
                  </div>
                  <Badge tone={provider.isActive ? "green" : "slate"} dot>
                    {provider.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-slate-400">Orders</p>
                    <p className="text-[16px] font-semibold tabular-nums text-slate-800">
                      {provider._count?.courier_orders || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-slate-400">Areas</p>
                    <p className="text-[16px] font-semibold tabular-nums text-slate-800">
                      {provider._count?.courier_serviceable_areas || 0}
                    </p>
                  </div>
                </div>

                <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500">
                  <Badge tone="slate">{provider._count?.courier_credentials || 0} credentials</Badge>
                  <Badge tone="blue">{provider.authType}</Badge>
                </div>

                <div className="mt-3 border-t border-slate-100 pt-3">
                  <Link href="/admin-dashboard/courier/credentials" className="block">
                    <Button size="sm" variant="secondary" className="w-full">Configure</Button>
                  </Link>
                </div>
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

  const [getZones, { data: zonesData, isFetching: zonesLoading }] =
    useLazyPathaoGetZonesQuery();
  const [getAreas, { data: areasData, isFetching: areasLoading }] =
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
    setSelectedAreaForMapping({
      ...area,
      city_id: parseInt(selectedCity),
      zone_id: parseInt(selectedZone),
    });
    setShowLocationDialog(true);
  };

  const handleMappingComplete = () => {
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
      <EmptyState
        icon={<Building2 />}
        title="Pathao not configured"
        body="You need to add Pathao as a courier provider first."
        action={
          <Link href="/admin-dashboard/courier/credentials">
            <Button size="sm"><Plus className="h-3.5 w-3.5" /> Add Pathao Provider</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <Notice tone="violet">
        <span className="flex items-start gap-2">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            <b>Pathao Area Explorer.</b> Browse Pathao&apos;s serviceable areas and map them to
            your platform locations for automatic courier routing.
          </span>
        </span>
      </Notice>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Filters" subtitle="Navigate through cities, zones, and areas">
          <div className="space-y-4">
            <Field label="City">
              <select
                className={inputCls}
                value={selectedCity}
                onChange={(e) => {
                  setSelectedCity(e.target.value);
                  setSelectedZone("");
                }}
              >
                <option value="">
                  {citiesLoading ? "Loading cities..." : "Select a city..."}
                </option>
                {cities.map((city: PathaoCity) => (
                  <option key={city.city_id} value={city.city_id.toString()}>
                    {city.city_name}
                  </option>
                ))}
              </select>
            </Field>

            {selectedCity && (
              <Field label="Zone">
                <select
                  className={inputCls}
                  value={selectedZone}
                  onChange={(e) => setSelectedZone(e.target.value)}
                  disabled={zonesLoading || zones.length === 0}
                >
                  <option value="">
                    {zonesLoading ? "Loading zones..." : "Select a zone..."}
                  </option>
                  {zones.map((zone: PathaoZone) => (
                    <option key={zone.zone_id} value={zone.zone_id.toString()}>
                      {zone.zone_name}
                    </option>
                  ))}
                </select>
              </Field>
            )}

            {selectedZone && areas.length > 0 && (
              <div className="space-y-1.5 border-t border-slate-100 pt-3 text-[12px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Areas</span>
                  <span className="font-semibold tabular-nums text-slate-800">{areas.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Home Delivery</span>
                  <span className="font-semibold tabular-nums text-slate-800">
                    {areas.filter((a: PathaoArea) => a.home_delivery_available).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Pickup Available</span>
                  <span className="font-semibold tabular-nums text-slate-800">
                    {areas.filter((a: PathaoArea) => a.pickup_available).length}
                  </span>
                </div>
              </div>
            )}
          </div>
        </Card>

        <Card
          className="lg:col-span-2"
          title="Available Areas"
          subtitle={selectedZone ? `${filteredAreas.length} areas found` : "Select a zone to view areas"}
          action={
            selectedZone && areas.length > 0 ? (
              <SearchBox
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search areas..."
                className="w-full sm:w-56"
              />
            ) : undefined
          }
        >
          {!selectedZone ? (
            <EmptyState
              icon={<MapPin />}
              title="No zone selected"
              body="Select a city and zone to view available areas."
            />
          ) : areasLoading ? (
            <Skeleton rows={6} />
          ) : filteredAreas.length === 0 ? (
            <EmptyState
              icon={<MapPin />}
              title={searchQuery ? "No areas match your search" : "No areas found in this zone"}
              body={searchQuery ? `Nothing matches "${searchQuery}".` : "Try a different zone."}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className={tableCls}>
                <thead>
                  <tr>
                    <th className={thCls}>Area Name</th>
                    <th className={`${thCls} text-center`}>Home Delivery</th>
                    <th className={`${thCls} text-center`}>Pickup</th>
                    <th className={`${thCls} text-right`}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAreas.map((area: PathaoArea) => (
                    <tr key={area.area_id} className="transition-colors hover:bg-indigo-50/40">
                      <td className={`${tdCls} font-medium`}>{area.area_name}</td>
                      <td className={`${tdCls} text-center`}>
                        {area.home_delivery_available
                          ? <Check className="mx-auto h-4 w-4 text-emerald-600" />
                          : <X className="mx-auto h-4 w-4 text-slate-300" />}
                      </td>
                      <td className={`${tdCls} text-center`}>
                        {area.pickup_available
                          ? <Check className="mx-auto h-4 w-4 text-emerald-600" />
                          : <X className="mx-auto h-4 w-4 text-slate-300" />}
                      </td>
                      <td className={tdCls}>
                        <div className="flex justify-end">
                          <Button size="sm" variant="secondary" onClick={() => handleMapArea(area)}>
                            Map <ChevronRight className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

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
    isFetching,
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

  const hasActiveCredentials = redxProvider?.courier_credentials?.some(
    (cred: any) => cred.isActive && cred.environment === getCourierEnvironment()
  );

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
    setPostCode("");
    setDistrictName("");
    setHasSearched(true);
    const result = await refetch();

    if (result.error) {
      const errorStatus = (result.error as any)?.status;
      if (errorStatus === 401) {
        toast.error("Authentication Failed", {
          description: "RedX bearer token is invalid or expired. Please update your credentials.",
        });
      } else {
        toast.error("Connection test failed", {
          description: "Please check your RedX credentials and try again.",
        });
      }
    } else {
      const totalAreas = result.data?.data?.totalAvailable || 0;
      toast.success("RedX connection successful!", {
        description: `Connected to ${getCourierEnvironment()} environment. Found ${totalAreas} area${totalAreas !== 1 ? "s" : ""}.`,
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
      <EmptyState
        icon={<Building2 />}
        title="RedX not configured"
        body="You need to add RedX as a courier provider first."
        action={
          <Link href="/admin-dashboard/courier/credentials">
            <Button size="sm"><Plus className="h-3.5 w-3.5" /> Add RedX Provider</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      {hasSearched && (
        <Notice tone={isAuthenticated && !authenticationFailed ? "green" : "red"}>
          <span className="flex items-start gap-2">
            {isAuthenticated && !authenticationFailed
              ? <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              : <X className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
            <span>
              {isAuthenticated && !authenticationFailed ? (
                <>
                  <b>RedX Connected</b> ({getCourierEnvironment()}). Your RedX API credentials are
                  active and working. Found {totalAvailable} serviceable area{totalAvailable !== 1 ? "s" : ""}.
                </>
              ) : (
                <>
                  <b>RedX Authentication Failed.</b>{" "}
                  {authenticationFailed
                    ? "Bearer token is invalid or expired. Please update your RedX credentials."
                    : "Connection failed. Please check your bearer token and try again."}{" "}
                  <Link href="/admin-dashboard/courier/credentials" className="font-semibold underline">
                    Update Credentials
                  </Link>
                </>
              )}
            </span>
          </span>
        </Notice>
      )}

      <Notice tone="violet">
        <span className="flex items-start gap-2">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            <b>RedX Area Explorer</b> ({getCourierEnvironment()} mode). Search and browse
            RedX&apos;s serviceable areas by post code or district name.
            {getCourierEnvironment() === "SANDBOX" && (
              <span className="mt-1 block">
                Tip: Sandbox has limited test data. Try post code{" "}
                <code className="rounded bg-white/70 px-1 py-0.5 text-[10px]">1212</code> or district{" "}
                <code className="rounded bg-white/70 px-1 py-0.5 text-[10px]">Test District</code>.
              </span>
            )}
          </span>
        </span>
      </Notice>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card
          title="Search Filters"
          subtitle="Filter areas by post code or district"
          action={
            hasActiveCredentials && isAuthenticated && !authenticationFailed ? (
              <Badge tone="green" dot>Connected</Badge>
            ) : hasSearched && authenticationFailed ? (
              <Badge tone="red" dot>Auth Failed</Badge>
            ) : (
              <Badge tone="slate" dot>Not Tested</Badge>
            )
          }
        >
          <div className="space-y-4">
            <Field label="Post Code" hint={getCourierEnvironment() === "SANDBOX" ? "Sandbox test post code: 1212" : undefined}>
              <input
                className={inputCls}
                type="number"
                placeholder="e.g., 1212"
                value={postCode}
                onChange={(e) => setPostCode(e.target.value)}
              />
            </Field>

            <Field label="District Name">
              <input
                className={inputCls}
                placeholder="e.g., Test District"
                value={districtName}
                onChange={(e) => setDistrictName(e.target.value)}
              />
            </Field>

            <div className="space-y-2">
              <Button
                className="w-full"
                onClick={handleSearch}
                disabled={isFetching || (!postCode && !districtName)}
                loading={isFetching}
              >
                <Search className="h-3.5 w-3.5" /> Search Areas
              </Button>
              <Button variant="secondary" className="w-full" onClick={handleTestConnection} disabled={isFetching}>
                <Activity className="h-3.5 w-3.5" /> Test Connection
              </Button>
              {hasSearched && (
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setPostCode("");
                    setDistrictName("");
                    setHasSearched(false);
                    setSearchQuery("");
                  }}
                >
                  <X className="h-3.5 w-3.5" /> Clear All
                </Button>
              )}
            </div>

            {hasSearched && areas.length > 0 && (
              <div className="space-y-1.5 border-t border-slate-100 pt-3 text-[12px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Found Areas</span>
                  <span className="font-semibold tabular-nums text-slate-800">{areas.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Available</span>
                  <span className="font-semibold tabular-nums text-slate-800">{totalAvailable}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Unique Districts</span>
                  <span className="font-semibold tabular-nums text-slate-800">
                    {new Set(areas.map((a: RedXArea) => a.district_name)).size}
                  </span>
                </div>
              </div>
            )}
          </div>
        </Card>

        <Card
          className="lg:col-span-2"
          title="Search Results"
          subtitle={
            hasSearched
              ? areasData?.data?.filtered
                ? `${areas.length} of ${totalAvailable} areas match your filters`
                : `${filteredAreas.length} areas found`
              : "Use filters to search for areas"
          }
          action={
            hasSearched && areas.length > 0 ? (
              <SearchBox
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Filter results..."
                className="w-full sm:w-56"
              />
            ) : undefined
          }
        >
          {!hasSearched ? (
            <EmptyState
              icon={<Search />}
              title="Search RedX areas"
              body='Enter a post code or district name and click "Search Areas", or use "Test Connection" to verify your credentials.'
            />
          ) : isFetching ? (
            <Skeleton rows={6} />
          ) : hasMessage && filteredAreas.length === 0 ? (
            <div className="space-y-4">
              <Notice tone="amber">{areasData?.data?.message}</Notice>

              {availableSample && availableSample.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[12px] font-medium text-slate-700">
                      Available areas in {getCourierEnvironment()}:
                    </p>
                    <Badge tone="slate">{totalAvailable} total</Badge>
                  </div>
                  <div className="overflow-x-auto">
                    <table className={tableCls}>
                      <thead>
                        <tr>
                          <th className={thCls}>Area Name</th>
                          <th className={thCls}>Post Code</th>
                          <th className={thCls}>District</th>
                          <th className={`${thCls} text-right`}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {availableSample.map((area: any) => (
                          <tr key={area.id} className="transition-colors hover:bg-indigo-50/40">
                            <td className={`${tdCls} font-medium`}>{area.name}</td>
                            <td className={tdCls}>
                              <Badge tone="blue">{area.post_code}</Badge>
                            </td>
                            <td className={tdCls}>{area.district_name}</td>
                            <td className={tdCls}>
                              <div className="flex justify-end">
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => {
                                    setPostCode(area.post_code.toString());
                                    setDistrictName("");
                                    setTimeout(() => handleSearch(), 100);
                                  }}
                                >
                                  Try this
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex justify-center">
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setPostCode("");
                        setDistrictName("");
                        handleSearch();
                      }}
                    >
                      <MapPin className="h-3.5 w-3.5" /> View All Areas
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : filteredAreas.length === 0 ? (
            <EmptyState
              icon={<MapPin />}
              title={searchQuery ? "No areas match your filter" : "No areas found"}
              body={searchQuery ? `Nothing matches "${searchQuery}".` : "Try different filters."}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className={tableCls}>
                <thead>
                  <tr>
                    <th className={thCls}>Area Name</th>
                    <th className={thCls}>Post Code</th>
                    <th className={thCls}>District</th>
                    <th className={thCls}>Division</th>
                    <th className={`${thCls} text-right`}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAreas.map((area: RedXArea) => (
                    <tr key={area.id} className="transition-colors hover:bg-indigo-50/40">
                      <td className={`${tdCls} font-medium`}>{area.name}</td>
                      <td className={tdCls}><Badge tone="blue">{area.post_code}</Badge></td>
                      <td className={tdCls}>{area.district_name || "N/A"}</td>
                      <td className={tdCls}>{area.division_name}</td>
                      <td className={tdCls}>
                        <div className="flex justify-end">
                          <Button size="sm" variant="secondary" onClick={() => handleMapArea(area)}>
                            Map <ChevronRight className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

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
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const [deleteArea, { isLoading: isDeleting }] = useDeleteServiceableAreaMutation();

  const { data: areasData, isLoading: areasLoading, refetch } =
    useGetServiceableAreasQuery(
      selectedCourier ? { courierProviderId: selectedCourier } : undefined
    );
  const areas = areasData?.data || [];

  const filteredAreas = areas.filter(
    (area: ServiceableArea) =>
      area.courierAreaName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      area.courierCityName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      area.locations?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteArea({ areaId: deleteTarget.id }).unwrap();
      toast.success("Area deleted successfully");
      setDeleteTarget(null);
      refetch();
    } catch (error: any) {
      toast.error("Failed to delete area", {
        description: error?.data?.message || "Please try again",
      });
    }
  };

  const activeAreas = areas.filter((a: ServiceableArea) => a.isActive).length;
  const homeDeliveryAreas = areas.filter(
    (a: ServiceableArea) => a.homeDeliveryAvailable
  ).length;
  const pickupAreas = areas.filter(
    (a: ServiceableArea) => a.pickupAvailable
  ).length;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-3.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.09em] text-slate-500">Mapped Areas</p>
          <p className="mt-1 text-[22px] font-semibold tracking-tight text-slate-900 tabular-nums">{areasLoading ? "—" : areas.length}</p>
          <p className="mt-1 text-[11px] text-slate-500">{activeAreas} active</p>
        </Card>
        <Card className="p-3.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.09em] text-slate-500">Home Delivery</p>
          <p className="mt-1 text-[22px] font-semibold tracking-tight text-slate-900 tabular-nums">{areasLoading ? "—" : homeDeliveryAreas}</p>
          <p className="mt-1 text-[11px] text-slate-500">
            {!areasLoading && areas.length > 0 ? ((homeDeliveryAreas / areas.length) * 100).toFixed(0) : 0}% coverage
          </p>
        </Card>
        <Card className="p-3.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.09em] text-slate-500">Pickup Available</p>
          <p className="mt-1 text-[22px] font-semibold tracking-tight text-slate-900 tabular-nums">{areasLoading ? "—" : pickupAreas}</p>
          <p className="mt-1 text-[11px] text-slate-500">
            {!areasLoading && areas.length > 0 ? ((pickupAreas / areas.length) * 100).toFixed(0) : 0}% coverage
          </p>
        </Card>
      </div>

      <Card
        title="Serviceable Areas Management"
        subtitle="Map courier serviceable areas to platform locations"
      >
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <Field label="Courier Provider">
              <select
                className={cx(inputCls, "sm:w-64")}
                value={selectedCourier}
                onChange={(e) => setSelectedCourier(e.target.value)}
              >
                <option value="">Select courier...</option>
                {providers.map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.displayName || provider.name}
                  </option>
                ))}
              </select>
            </Field>
            <p className="text-xs text-slate-500 sm:pb-2.5">
              New mappings are added from the Pathao and RedX tabs above.
            </p>
          </div>

          {areas.length > 0 && (
            <SearchBox
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search areas, cities, or locations..."
              className="w-full sm:w-80"
            />
          )}

          {!selectedCourier ? (
            <EmptyState
              icon={<Building2 />}
              title="No courier selected"
              body="Select a courier provider to view and manage areas."
            />
          ) : areasLoading ? (
            <Skeleton rows={6} />
          ) : filteredAreas.length === 0 ? (
            <EmptyState
              icon={<MapPin />}
              title={searchQuery ? "No areas match your search" : "No areas mapped"}
              body={
                searchQuery
                  ? `Nothing matches "${searchQuery}".`
                  : "Start by mapping areas using the Pathao or RedX tabs."
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className={tableCls}>
                <thead>
                  <tr>
                    <th className={thCls}>Platform Location</th>
                    <th className={thCls}>Courier Area</th>
                    <th className={`${thCls} text-center`}>Home Delivery</th>
                    <th className={`${thCls} text-center`}>Pickup</th>
                    <th className={`${thCls} text-center`}>Status</th>
                    <th className={`${thCls} text-right`}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAreas.map((area: ServiceableArea) => (
                    <tr key={area.id} className="transition-colors hover:bg-indigo-50/40">
                      <td className={tdCls}>
                        <div className="font-medium text-slate-800">{area.locations?.name || "N/A"}</div>
                        <div className="text-[11px] text-slate-400">ID: {area.locationId}</div>
                      </td>
                      <td className={tdCls}>
                        <div className="font-medium text-slate-800">{area.courierAreaName}</div>
                        {area.courierCityName && (
                          <div className="text-[11px] text-slate-400">{area.courierCityName}</div>
                        )}
                      </td>
                      <td className={`${tdCls} text-center`}>
                        {area.homeDeliveryAvailable
                          ? <Check className="mx-auto h-4 w-4 text-emerald-600" />
                          : <X className="mx-auto h-4 w-4 text-slate-300" />}
                      </td>
                      <td className={`${tdCls} text-center`}>
                        {area.pickupAvailable
                          ? <Check className="mx-auto h-4 w-4 text-emerald-600" />
                          : <X className="mx-auto h-4 w-4 text-slate-300" />}
                      </td>
                      <td className={`${tdCls} text-center`}>
                        <Badge tone={area.isActive ? "green" : "slate"} dot>
                          {area.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className={tdCls}>
                        <div className="flex justify-end">
                          <Button
                            size="sm"
                            variant="danger"
                            title="Delete area"
                            onClick={() => setDeleteTarget({ id: area.id, name: area.courierAreaName })}
                          >
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
        </div>
      </Card>

      <Modal
        open={Boolean(deleteTarget)}
        title="Delete serviceable area?"
        onClose={() => setDeleteTarget(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger" loading={isDeleting} onClick={handleConfirmDelete}>Delete</Button>
          </>
        }
      >
        <p className="text-[13px] leading-5 text-slate-600">
          This will permanently remove the mapping for <b className="text-slate-800">{deleteTarget?.name}</b>.
          Courier routing for this location will stop until it is re-mapped.
        </p>
      </Modal>
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
    <div className="space-y-4">
      <Card
        title="Courier Pricing Rules"
        subtitle="Platform-wide delivery rates. A lane is priced at checkout only by an active rule for that provider that is inside its validity window and matches the parcel weight."
        action={<Button size="sm" onClick={openCreate}><Plus className="h-3.5 w-3.5" /> New rule</Button>}
      >
        <div className="space-y-4">
          <Notice tone="amber">
            <span className="flex items-start gap-2">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                <b>Enter business-approved rates only.</b> Nothing is prefilled and no rate is
                ever invented here. Use the courier contract rates your business has approved.
                Deactivate a rule to withdraw it from checkout pricing; deleting the only
                applicable rule for a lane makes checkout quotes for that lane fail.
              </span>
            </span>
          </Notice>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <select
              className={cx(inputCls, "sm:w-56")}
              value={providerFilter}
              onChange={(e) => {
                setProviderFilter(e.target.value);
                setPage(1);
              }}
              aria-label="Filter by provider"
            >
              <option value="all">All providers</option>
              {providers.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.displayName || provider.name}
                </option>
              ))}
            </select>

            <select
              className={cx(inputCls, "sm:w-40")}
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              aria-label="Filter by status"
            >
              <option value="all">All statuses</option>
              <option value="active">Active only</option>
              <option value="inactive">Inactive only</option>
            </select>

            <div className="flex items-center gap-2 sm:ml-auto">
              <Badge tone="slate">{rules.length} shown</Badge>
              <Badge tone="green">{activeCount} active</Badge>
            </div>
          </div>

          {isLoading ? (
            <Skeleton rows={6} />
          ) : rules.length === 0 ? (
            <EmptyState
              icon={<DollarSign />}
              title="No pricing rules"
              body="No rule matches the current filters. Until one exists, the checkout delivery engine cannot price this lane."
              action={<Button size="sm" variant="secondary" onClick={openCreate}>New rule</Button>}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className={tableCls}>
                <thead>
                  <tr>
                    <th className={thCls}>Provider</th>
                    <th className={thCls}>Lane</th>
                    <th className={thCls}>Weight band</th>
                    <th className={thCls}>Base price</th>
                    <th className={thCls}>Per kg</th>
                    <th className={thCls}>Validity</th>
                    <th className={`${thCls} text-center`}>Priority</th>
                    <th className={thCls}>Status</th>
                    <th className={`${thCls} text-right`}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rules.map((rule) => (
                    <tr key={rule.id} className="transition-colors hover:bg-indigo-50/40">
                      <td className={`${tdCls} font-medium`}>
                        {rule.courier_providers?.displayName ||
                          rule.courier_providers?.name ||
                          rule.courierProviderId}
                      </td>
                      <td className={`${tdCls} text-[12px]`}>{laneLabel(rule)}</td>
                      <td className={tdCls}>{weightBandLabel(rule)}</td>
                      <td className={`${tdCls} tabular-nums`}>{formatAmount(rule.basePrice)}</td>
                      <td className={`${tdCls} tabular-nums`}>{formatAmount(rule.perKgCharge)}</td>
                      <td className={`${tdCls} whitespace-nowrap text-[11px] text-slate-500`}>
                        {validityLabel(rule)}
                      </td>
                      <td className={`${tdCls} text-center tabular-nums`}>{rule.priority}</td>
                      <td className={tdCls}>
                        <Badge tone={rule.isActive ? "green" : "slate"} dot>
                          {rule.isActive ? "Active" : "Inactive"}
                        </Badge>
                        {rule.isActive && !isRuleInWindow(rule) && (
                          <span className="ml-1.5 text-[10px] text-amber-600">out of window</span>
                        )}
                      </td>
                      <td className={tdCls}>
                        <div className="flex items-center justify-end gap-1">
                          <Button size="sm" variant="ghost" title="Edit rule" onClick={() => openEdit(rule)}>
                            <PencilLine className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            title={rule.isActive ? "Deactivate rule" : "Activate rule"}
                            onClick={() => handleToggle(rule)}
                          >
                            <Power className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            title="Delete rule"
                            onClick={() => setPendingDelete(rule)}
                          >
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

          {pagination && pagination.totalPages > 1 && (
            <Pager
              page={pagination.page}
              pages={pagination.totalPages}
              onPage={setPage}
              total={pagination.total}
              pageSize={20}
            />
          )}
        </div>
      </Card>

      <Modal
        open={formOpen}
        title={editingId ? "Edit pricing rule" : "New pricing rule"}
        onClose={() => setFormOpen(false)}
        wide
        footer={
          <>
            <Button variant="secondary" onClick={() => setFormOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} loading={isSaving}>
              {editingId ? "Save changes" : "Create rule"}
            </Button>
          </>
        }
      >
        <p className="mb-4 text-[12px] leading-5 text-slate-500">
          Rules are platform-wide: vendor-scoped pricing is not supported and delivery type is
          fixed to standard (NORMAL) delivery.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Courier provider">
            <select
              className={inputCls}
              value={form.courierProviderId}
              disabled={Boolean(editingId)}
              onChange={(e) => setField("courierProviderId", e.target.value)}
            >
              <option value="">Select provider</option>
              {providers.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.displayName || provider.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Pickup location">
            <select
              className={inputCls}
              value={form.fromLocationId || "any"}
              onChange={(e) => setField("fromLocationId", e.target.value === "any" ? "" : e.target.value)}
            >
              <option value="any">Any pickup location</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>{location.name}</option>
              ))}
            </select>
          </Field>

          <Field label="Delivery location">
            <select
              className={inputCls}
              value={form.toLocationId || "any"}
              onChange={(e) => setField("toLocationId", e.target.value === "any" ? "" : e.target.value)}
            >
              <option value="any">Nationwide</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>{location.name}</option>
              ))}
            </select>
          </Field>

          <Field label="Base price" hint="Required.">
            <input
              className={inputCls}
              type="number"
              min="0"
              step="0.01"
              value={form.basePrice}
              onChange={(e) => setField("basePrice", e.target.value)}
              placeholder="Required"
            />
          </Field>

          <Field label="Per kg charge">
            <input
              className={inputCls}
              type="number"
              min="0"
              step="0.01"
              value={form.perKgCharge}
              onChange={(e) => setField("perKgCharge", e.target.value)}
            />
          </Field>

          <Field label="Fuel surcharge">
            <input
              className={inputCls}
              type="number"
              min="0"
              step="0.01"
              value={form.fuelSurcharge}
              onChange={(e) => setField("fuelSurcharge", e.target.value)}
            />
          </Field>

          <Field label="Minimum weight (kg)">
            <input
              className={inputCls}
              type="number"
              min="0"
              step="0.01"
              value={form.minWeight}
              onChange={(e) => setField("minWeight", e.target.value)}
            />
          </Field>

          <Field label="Maximum weight (kg)" hint="Empty = no upper bound.">
            <input
              className={inputCls}
              type="number"
              min="0"
              step="0.01"
              value={form.maxWeight}
              onChange={(e) => setField("maxWeight", e.target.value)}
              placeholder="Empty = no upper bound"
            />
          </Field>

          <Field label="Valid from">
            <input
              className={inputCls}
              type="date"
              value={form.validFrom}
              onChange={(e) => setField("validFrom", e.target.value)}
            />
          </Field>

          <Field label="Valid to" hint="Empty = no end date.">
            <input
              className={inputCls}
              type="date"
              value={form.validTo}
              onChange={(e) => setField("validTo", e.target.value)}
            />
          </Field>

          <Field label="Priority" hint="Lower numbers are evaluated first.">
            <input
              className={inputCls}
              type="number"
              step="1"
              value={form.priority}
              onChange={(e) => setField("priority", e.target.value)}
            />
          </Field>

          <div className="sm:col-span-2">
            <Toggle
              checked={form.isActive}
              onChange={(v) => setField("isActive", v)}
              label="Active — available to the checkout delivery engine"
            />
          </div>
        </div>
      </Modal>

      <Modal
        open={Boolean(pendingDelete)}
        title="Delete this pricing rule?"
        onClose={() => setPendingDelete(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setPendingDelete(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete}>Delete rule</Button>
          </>
        }
      >
        <p className="text-[13px] leading-5 text-slate-600">
          {pendingDelete
            ? `${laneLabel(pendingDelete)} for ${
                pendingDelete.courier_providers?.name || pendingDelete.courierProviderId
              } will be removed permanently. If it is the only applicable rule for this lane,
              checkout quotes for the lane will fail — deactivate it instead to keep the row.`
            : ""}
        </p>
      </Modal>
    </div>
  );
}
