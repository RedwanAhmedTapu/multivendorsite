// components/vendor/offers/vendor-offers-header.tsx
import { BadgePercent, Plus, ShieldCheck, Ticket, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { VendorPermissions } from "@/features/offerApi";
import { formatTaka } from "@/lib/offers/offer-view";
import {
  OfferMetaPill,
  OfferPageHeader,
  offerPrimaryButton,
  offerSecondaryButton,
} from "@/components/offers/shared/offer-ui";

interface VendorOffersHeaderProps {
  permissions?: VendorPermissions;
  permissionsLoading: boolean;
  /** Any offer type the vendor may create (same rule as the create page). */
  canCreateOffer: boolean;
  canCreateVoucher: boolean;
  onCreateOffer: () => void;
  onCreateVoucher: () => void;
}

export function VendorOffersHeader({
  permissions,
  permissionsLoading,
  canCreateOffer,
  canCreateVoucher,
  onCreateOffer,
  onCreateVoucher,
}: VendorOffersHeaderProps) {
  const noAccessTitle = permissionsLoading ? "Checking your offer permissions…" : "Your store doesn't have permission for this. Contact FinixMart support.";
  return (
    <OfferPageHeader
      icon={BadgePercent}
      eyebrow="Marketing"
      title="Offers & vouchers"
      description="Create discounts and voucher codes for your store and track how they perform."
      meta={
        permissions && (
          <>
            <OfferMetaPill icon={ShieldCheck} tone="indigo">
              Up to {permissions.maxDiscountPercent}% or {formatTaka(permissions.maxDiscountAmount)} off
            </OfferMetaPill>
            <OfferMetaPill tone="slate">{permissions.maxActiveOffers} active offers max</OfferMetaPill>
          </>
        )
      }
      actions={
        <>
          <Button
            type="button"
            variant="outline"
            className={cn("h-9 flex-1 sm:flex-none", offerSecondaryButton)}
            onClick={onCreateVoucher}
            disabled={!canCreateVoucher}
            title={canCreateVoucher ? undefined : noAccessTitle}
          >
            {canCreateVoucher || permissionsLoading ? <Ticket className="mr-1.5 h-4 w-4 text-violet-600" /> : <Lock className="mr-1.5 h-4 w-4" />}
            Create voucher
          </Button>
          <Button
            type="button"
            className={cn("h-9 flex-1 sm:flex-none", offerPrimaryButton)}
            onClick={onCreateOffer}
            disabled={!canCreateOffer}
            title={canCreateOffer ? undefined : noAccessTitle}
          >
            {canCreateOffer || permissionsLoading ? <Plus className="mr-1.5 h-4 w-4" /> : <Lock className="mr-1.5 h-4 w-4" />}
            Create offer
          </Button>
        </>
      }
    />
  );
}
