// components/admin/offers/offers-analytics.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Users, Clock, Shield, Percent, Store } from "lucide-react";
import type { Offer, OfferAnalytics, VendorPermissionStats } from "@/features/offerApi";

interface OffersAnalyticsProps {
  offers: Offer[];
  analytics: OfferAnalytics[];
  permissionStats?: VendorPermissionStats;
}

export function OffersAnalytics({ offers, analytics, permissionStats }: OffersAnalyticsProps) {
  const totalUsage = analytics.reduce((sum, a) => sum + a.totalUsage, 0);
  const totalRevenue = analytics.reduce((sum, a) => sum + a.totalRevenue, 0);
  const activeOffers = offers.filter(o => o.isActive).length;
  const vendorOffers = offers.filter(o => o.createdByType === "VENDOR").length;
  const pendingVendorApproval = offers.filter(o => o.createdByType === "VENDOR" && !o.isActive).length;
  const adminOffers = offers.filter(o => o.createdByType === "ADMIN").length;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Offers</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{offers.length}</div>
          <p className="text-xs text-muted-foreground">
            Active: {activeOffers}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {totalUsage.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            All time redemptions
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Revenue Impact</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${totalRevenue.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            From offer redemptions
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Vendor Offers</CardTitle>
          <Store className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{vendorOffers}</div>
          <p className="text-xs text-muted-foreground">
            {pendingVendorApproval} pending approval
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Admin Offers</CardTitle>
          <Shield className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{adminOffers}</div>
          <p className="text-xs text-muted-foreground">
            System created offers
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Max Discount</CardTitle>
          <Percent className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {permissionStats?.averageMaxDiscount || 0}%
          </div>
          <p className="text-xs text-muted-foreground">
            Vendor average limit
          </p>
        </CardContent>
      </Card>
    </div>
  );
}