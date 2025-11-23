// components/vendor/offers/vendor-offers-management.tsx
"use client";

import { useState } from "react";
import {
  useGetVendorOffersQuery,
  useGetVendorPermissionsQuery,
  useGetVendorOfferAnalyticsQuery,
  type Offer,
  type OfferFilters,
} from "@/features/offerApi";
import { VendorOffersHeader } from "./vendor-offers-header";
import { VendorOffersAnalytics } from "./vendor-offers-analytics";
import { VendorOffersTable } from "./vendor-offers-table";
import { CreateVendorVoucherDialog } from "./create-vendor-voucher-dialog";
import { EditVendorOfferDialog } from "./edit-vendor-offer-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { store } from "@/store/store";
import { useRouter } from "next/navigation";

export function VendorOffersManagement() {
  const [activeTab, setActiveTab] = useState("all");
  const [filters, setFilters] = useState<OfferFilters>({
    page: 1,
    limit: 10,
  });
  const [isCreateOfferDialogOpen, setIsCreateOfferDialogOpen] = useState(false);
  const [isCreateVoucherDialogOpen, setIsCreateVoucherDialogOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
const auth=store.getState().auth;
  const vendorId = auth?.user?.vendorId;
  const router=useRouter();

  // RTK Query hooks
  const { data: offersData, isLoading: offersLoading } = useGetVendorOffersQuery(filters);
  const { data: permissionsData } = useGetVendorPermissionsQuery(vendorId ?? "");
  const { data: analyticsData } = useGetVendorOfferAnalyticsQuery("");

  const offers = offersData?.data || [];
  const permissions = permissionsData?.data;
  const analytics = analyticsData?.data || [];

  // Filter offers based on active tab
  const filteredOffers = offers.filter(offer => {
    switch (activeTab) {
      case "active":
        return offer.isActive;
      case "inactive":
        return !offer.isActive;
      case "vouchers":
        return offer.type === "VOUCHER";
      case "pending":
        return offer.createdByType === "VENDOR" && !offer.isActive;
      default:
        return true;
    }
  });
const handleCreateOffer = () => {
  router.push("/vendor-dashboard/offer/add-offer");
};
  return (
    <div className="space-y-6">
      <VendorOffersHeader 
        onCreateOffer={handleCreateOffer}
        onCreateVoucher={() => setIsCreateVoucherDialogOpen(true)}
        permissions={permissions}
      />
      
      <VendorOffersAnalytics 
        offers={offers}
        analytics={analytics}
        permissions={permissions}
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>My Offers</CardTitle>
              <CardDescription>
                Manage your promotional offers and vouchers
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {permissions && (
                <Badge variant="outline" className="text-xs">
                  {offers.filter(o => o.isActive).length} / {permissions.maxActiveOffers} Active
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">All Offers</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="inactive">Inactive</TabsTrigger>
              <TabsTrigger value="vouchers">Vouchers</TabsTrigger>
              <TabsTrigger value="pending">
                Pending Approval
                {offers.filter(o => o.createdByType === "VENDOR" && !o.isActive).length > 0 && (
                  <Badge variant="destructive" className="ml-2 h-4 w-4 p-0 text-[10px]">
                    {offers.filter(o => o.createdByType === "VENDOR" && !o.isActive).length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4">
              <VendorOffersTable
                offers={filteredOffers}
                isLoading={offersLoading}
                onEdit={setSelectedOffer}
                permissions={permissions}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      

      <CreateVendorVoucherDialog
        open={isCreateVoucherDialogOpen}
        onOpenChange={setIsCreateVoucherDialogOpen}
        permissions={permissions}
      />

      <EditVendorOfferDialog
        offer={selectedOffer}
        onOpenChange={() => setSelectedOffer(null)}
        permissions={permissions}
      />
    </div>
  );
}