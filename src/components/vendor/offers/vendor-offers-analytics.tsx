// components/vendor/offers/vendor-offers-analytics.tsx
//
// Stat cards computed from the vendor's own offers (the vendor list endpoint,
// scoped server-side to the signed-in vendor). The vendor summary/analytics
// endpoints aren't usable here (see the offer redesign notes), so no revenue
// figure is shown rather than a made-up one.
import { CircleDot, Clock, Gift, ShieldCheck, Users } from "lucide-react";
import type { Offer, VendorPermissions } from "@/features/offerApi";
import { countByStatus, formatTaka, totalRedemptions } from "@/lib/offers/offer-view";
import { OfferStatCard } from "@/components/offers/shared/offer-ui";

interface VendorOffersAnalyticsProps {
  /** The vendor's most recent offers (up to `windowSize`). */
  offers: Offer[];
  windowSize: number;
  isLoading: boolean;
  permissions?: VendorPermissions;
}

export function VendorOffersAnalytics({ offers, windowSize, isLoading, permissions }: VendorOffersAnalyticsProps) {
  const counts = countByStatus(offers);
  const capped = offers.length >= windowSize;
  const live = counts.active + counts.scheduled;
  const redemptions = totalRedemptions(offers);

  return (
    <section aria-label="Offer summary" className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-5">
      <OfferStatCard
        label="Offers"
        icon={Gift}
        tone="indigo"
        loading={isLoading}
        value={capped ? `${offers.length}+` : offers.length}
        hint={capped ? `Latest ${windowSize} shown in these cards` : "All offers you've created"}
      />
      <OfferStatCard
        label="Live now"
        icon={CircleDot}
        tone="emerald"
        loading={isLoading}
        value={live}
        hint={counts.scheduled ? `${counts.scheduled} scheduled to start` : "Active and within dates"}
      />
      <OfferStatCard label="Pending review" icon={Clock} tone="amber" loading={isLoading} value={counts.pending} hint="Waiting for FinixMart approval" />
      <OfferStatCard label="Redemptions" icon={Users} tone="violet" loading={isLoading} value={redemptions.toLocaleString("en-BD")} hint="Times customers used your offers" />
      <OfferStatCard
        label="Discount cap"
        icon={ShieldCheck}
        tone="cyan"
        loading={isLoading && !permissions}
        value={permissions ? `${permissions.maxDiscountPercent}%` : "—"}
        hint={permissions ? `or ${formatTaka(permissions.maxDiscountAmount)} fixed` : "Permissions unavailable"}
      />
    </section>
  );
}
