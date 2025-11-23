// components/vendor/offers/vendor-offers-analytics.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Users, Clock, Target } from "lucide-react";
import type { Offer, OfferAnalytics, VendorPermissions } from "@/features/offerApi";

interface VendorOffersAnalyticsProps {
  offers: Offer[];
  analytics: OfferAnalytics[];
  permissions?: VendorPermissions;
}

export function VendorOffersAnalytics({ offers, analytics, permissions }: VendorOffersAnalyticsProps) {
  const totalUsage = analytics.reduce((sum, a) => sum + a.totalUsage, 0);
  const totalRevenue = analytics.reduce((sum, a) => sum + a.totalRevenue, 0);
  const activeOffers = offers.filter(o => o.isActive).length;
  const pendingApproval = offers.filter(o => o.createdByType === "VENDOR" && !o.isActive).length;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Offers</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeOffers}</div>
          <p className="text-xs text-muted-foreground">
            {permissions ? `${activeOffers} / ${permissions.maxActiveOffers} limit` : 'Total active'}
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
          <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {pendingApproval}
          </div>
          <p className="text-xs text-muted-foreground">
            Waiting admin review
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Max Discount</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {permissions?.maxDiscountPercent}%
          </div>
          <p className="text-xs text-muted-foreground">
            Maximum allowed
          </p>
        </CardContent>
      </Card>
    </div>
  );
}