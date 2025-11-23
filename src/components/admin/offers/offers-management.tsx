// components/admin/offers/offers-management.tsx
"use client";

import { useState } from "react";
import {
  useGetAllOffersQuery,
  useGetAllOfferAnalyticsQuery,
  useGetAllVendorPermissionsQuery,
  useGetVendorPermissionStatsQuery,
  type Offer,
  type OfferFilters,
} from "@/features/offerApi";
import { OffersHeader } from "./offers-header";
import { OffersAnalytics } from "./offers-analytics";
import { OffersTable } from "./offers-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { VendorPermissionsManagement } from "./vendor-permissions-management";

export function OffersManagement() {
  const [activeTab, setActiveTab] = useState("offers");
  const [filters, setFilters] = useState<OfferFilters>({
    page: 1,
    limit: 10,
  });
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);

  // RTK Query hooks for offers
  const { data: offersData, isLoading: offersLoading } = useGetAllOffersQuery(filters);
  const { data: analyticsData } = useGetAllOfferAnalyticsQuery({});

  // RTK Query hooks for vendor permissions
  const { data: permissionsData } = useGetAllVendorPermissionsQuery({});
  const { data: permissionStatsData } = useGetVendorPermissionStatsQuery();
  console.log(permissionsData,"permissionData")

  const offers = offersData?.data || [];
  const analytics = analyticsData?.data || [];
  const vendorPermissions = permissionsData?.data || [];
  const permissionStats = permissionStatsData?.data;

  // Filter offers based on active tab
  const filteredOffers = offers.filter((offer) => {
    switch (activeTab) {
      case "active":
        return offer.isActive;
      case "inactive":
        return !offer.isActive;
      case "vouchers":
        return offer.type === "VOUCHER";
      case "flash-sales":
        return offer.type === "FLASH_SALE";
      case "countdown":
        return offer.type === "COUNTDOWN_DEAL";
      case "vendor-offers":
        return offer.createdByType === "VENDOR";
      default:
        return true;
    }
  });

  // Get vendor offers pending approval
  const pendingVendorOffers = offers.filter(
    offer => offer.createdByType === "VENDOR" && !offer.isActive
  );

  return (
    <div className="space-y-6">
      <OffersHeader 
        pendingApprovals={pendingVendorOffers.length}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-8">
          
          <TabsTrigger value="vendor-offers">
            Vendor Offers
            {pendingVendorOffers.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pendingVendorOffers.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
        </TabsList>

        <TabsContent value="offers" className="space-y-6">
          <OffersAnalytics 
            offers={offers} 
            analytics={analytics} 
            permissionStats={permissionStats}
          />
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>All Offers</CardTitle>
                  <CardDescription>
                    Manage all promotional offers and discounts across the platform
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <OffersTable
                offers={filteredOffers}
                isLoading={offersLoading}
                onEdit={setSelectedOffer}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active" className="space-y-6">
          <OffersAnalytics 
            offers={offers.filter(o => o.isActive)} 
            analytics={analytics} 
            permissionStats={permissionStats}
          />
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Active Offers</CardTitle>
                  <CardDescription>
                    Currently active promotional offers and discounts
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <OffersTable
                offers={filteredOffers}
                isLoading={offersLoading}
                onEdit={setSelectedOffer}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inactive" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Inactive Offers</CardTitle>
                  <CardDescription>
                    Expired or deactivated promotional offers
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <OffersTable
                offers={filteredOffers}
                isLoading={offersLoading}
                onEdit={setSelectedOffer}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vouchers" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Voucher Offers</CardTitle>
                  <CardDescription>
                    Manage voucher codes and discount coupons
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <OffersTable
                offers={filteredOffers}
                isLoading={offersLoading}
                onEdit={setSelectedOffer}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="flash-sales" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Flash Sales</CardTitle>
                  <CardDescription>
                    Limited-time flash sale events and promotions
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <OffersTable
                offers={filteredOffers}
                isLoading={offersLoading}
                onEdit={setSelectedOffer}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="countdown" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Countdown Deals</CardTitle>
                  <CardDescription>
                    Time-limited deals with countdown timers
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <OffersTable
                offers={filteredOffers}
                isLoading={offersLoading}
                onEdit={setSelectedOffer}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vendor-offers" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Vendor Offers</CardTitle>
                  <CardDescription>
                    Manage offers created by vendors
                    {pendingVendorOffers.length > 0 && (
                      <span className="ml-2 text-destructive font-medium">
                        ({pendingVendorOffers.length} pending approval)
                      </span>
                    )}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <OffersTable
                offers={filteredOffers}
                isLoading={offersLoading}
                onEdit={setSelectedOffer}
                showVendorInfo={true}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-6">
          <VendorPermissionsManagement />
        </TabsContent>
      </Tabs>

     

      
    </div>
  );
}