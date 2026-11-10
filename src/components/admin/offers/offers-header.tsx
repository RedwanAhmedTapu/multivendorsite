// components/admin/offers/offers-header.tsx
import { BadgePercent, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { OfferPageHeader, offerPrimaryButton } from "@/components/offers/shared/offer-ui";

export function OffersHeader() {
  const router = useRouter();

  return (
    <OfferPageHeader
      icon={BadgePercent}
      eyebrow="Marketing"
      title="Offers management"
      description="Platform and vendor offers, vouchers and sales — review, approve and manage them in one place."
      actions={
        // Vouchers, flash sales and countdown deals are offer types chosen in the
        // create wizard, so a single entry point covers every kind.
        <Button type="button" className={cn("h-9 w-full sm:w-auto", offerPrimaryButton)} onClick={() => router.push("/admin-dashboard/offer-manage/add-offer")}>
          <Plus className="mr-1.5 h-4 w-4" /> Create offer
        </Button>
      }
    />
  );
}
