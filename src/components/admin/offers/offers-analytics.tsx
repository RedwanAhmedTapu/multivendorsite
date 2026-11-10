// components/admin/offers/offers-analytics.tsx
//
// Stat cards from real data only: the most recent offers (admin list
// endpoint), the recorded offer analytics (admin analytics endpoint) and the
// vendor-permission stats. Labels say which window a number covers.
import { CircleDot, Clock, Gift, Percent, Store, TrendingUp } from "lucide-react";
import type { Offer, OfferAnalytics, VendorPermissionStats } from "@/features/offerApi";
import { countByStatus, formatTaka, totalRedemptions } from "@/lib/offers/offer-view";
import { OfferStatCard } from "@/components/offers/shared/offer-ui";

interface OffersAnalyticsProps {
  /** Most recent offers, up to `windowSize`. */
  offers: Offer[];
  windowSize: number;
  isLoading: boolean;
  analytics: OfferAnalytics[];
  analyticsLoading: boolean;
  pendingVendorOffers: number;
  pendingCapped: boolean;
  permissionStats?: VendorPermissionStats;
}

export function OffersAnalytics({
  offers,
  windowSize,
  isLoading,
  analytics,
  analyticsLoading,
  pendingVendorOffers,
  pendingCapped,
  permissionStats,
}: OffersAnalyticsProps) {
  const counts = countByStatus(offers);
  const capped = offers.length >= windowSize;
  const vendorOffers = offers.filter((o) => o.createdByType === "VENDOR").length;
  const revenue = analytics.reduce((sum, a) => sum + (Number(a.totalRevenue) || 0), 0);

  return (
    <section aria-label="Offer summary" className="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-3 xl:grid-cols-6">
      <OfferStatCard label="Offers" icon={Gift} tone="indigo" loading={isLoading} value={capped ? `${offers.length}+` : offers.length}
        hint={capped ? `Cards use the latest ${windowSize}` : "Across the platform"} />
      <OfferStatCard label="Live now" icon={CircleDot} tone="emerald" loading={isLoading} value={counts.active}
        hint={counts.scheduled ? `${counts.scheduled} scheduled` : "Active and within dates"} />
      <OfferStatCard label="Awaiting approval" icon={Clock} tone="amber" loading={isLoading} value={pendingCapped ? `${pendingVendorOffers}+` : pendingVendorOffers} hint="Vendor offers to review" />
      <OfferStatCard label="Vendor offers" icon={Store} tone="violet" loading={isLoading} value={vendorOffers} hint={capped ? `In the latest ${windowSize}` : "Created by vendors"} />
      <OfferStatCard label="Redemptions" icon={TrendingUp} tone="blue" loading={isLoading} value={totalRedemptions(offers).toLocaleString("en-BD")}
        hint={analyticsLoading ? "Loading revenue…" : analytics.length ? `${formatTaka(revenue)} recorded revenue` : "No revenue recorded yet"} />
      <OfferStatCard label="Vendor discount cap" icon={Percent} tone="cyan" loading={!permissionStats && isLoading}
        value={permissionStats ? `${Math.round((Number(permissionStats.averageMaxDiscount) || 0) * 10) / 10}%` : "—"} hint="Average across vendors" />
    </section>
  );
}
