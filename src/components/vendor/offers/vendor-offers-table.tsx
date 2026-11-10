// components/vendor/offers/vendor-offers-table.tsx
import { useState } from "react";
import { Copy, Edit, MoreHorizontal, PowerOff } from "lucide-react";
import { toast } from "sonner";
import { useDeactivateVendorOfferMutation } from "@/features/offerApi";
import type { Offer } from "@/features/offerApi";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getOfferDisplayStatus } from "@/lib/offers/offer-view";
import { OfferListTable } from "@/components/offers/shared/offer-list-table";
import { OfferConfirmDialog } from "@/components/offers/shared/offer-ui";

interface VendorOffersTableProps {
  offers: Offer[];
  isLoading: boolean;
  isFetching: boolean;
  error: string | null;
  onRetry: () => void;
  onEdit: (offer: Offer) => void;
  empty: { title: string; description?: string; action?: React.ReactNode };
}

export function VendorOffersTable({ offers, isLoading, isFetching, error, onRetry, onEdit, empty }: VendorOffersTableProps) {
  const [deactivateOffer, { isLoading: deactivating }] = useDeactivateVendorOfferMutation();
  const [confirming, setConfirming] = useState<Offer | null>(null);

  const handleDeactivate = async () => {
    if (!confirming) return;
    try {
      const res = await deactivateOffer(confirming.id).unwrap();
      // Only report success when the server's copy says the offer is off.
      if (res?.data && res.data.isActive === false) {
        toast.success("Offer deactivated");
      } else {
        toast.error("The server didn't switch this offer off. It is still active — please contact FinixMart support.");
      }
    } catch (error) {
      const message = (error as { data?: { message?: string } })?.data?.message;
      toast.error(message ? `Couldn't deactivate: ${message}` : "Couldn't deactivate the offer");
    } finally {
      setConfirming(null);
    }
  };

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success(`Copied ${code}`);
    } catch {
      toast.error("Couldn't copy the code");
    }
  };

  const renderActions = (offer: Offer) => {
    const status = getOfferDisplayStatus(offer);
    const canDeactivate = offer.isActive && status !== "expired" && status !== "rejected";
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-[#3D5068] hover:bg-[#EEF3FB]" aria-label={`Actions for ${offer.title}`}>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 rounded-xl">
          <DropdownMenuLabel className="text-xs text-[#7A90AB]">Offer actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => onEdit(offer)}>
            <Edit className="mr-2 h-4 w-4" /> Edit details
          </DropdownMenuItem>
          {offer.voucherConfig?.code && (
            <DropdownMenuItem onClick={() => copyCode(offer.voucherConfig!.code)}>
              <Copy className="mr-2 h-4 w-4" /> Copy voucher code
            </DropdownMenuItem>
          )}
          {canDeactivate && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setConfirming(offer)} className="text-orange-600 focus:text-orange-700">
                <PowerOff className="mr-2 h-4 w-4" /> Deactivate
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  return (
    <>
      <OfferListTable
        offers={offers}
        isLoading={isLoading}
        isFetching={isFetching}
        error={error}
        onRetry={onRetry}
        renderActions={renderActions}
        empty={empty}
      />
      <OfferConfirmDialog
        open={!!confirming}
        onOpenChange={(o) => { if (!o) setConfirming(null); }}
        title="Deactivate this offer?"
        description={<>Customers will no longer be able to use <strong>{confirming?.title}</strong>. You may need admin approval to turn it back on.</>}
        confirmText="Deactivate"
        tone="destructive"
        busy={deactivating}
        onConfirm={handleDeactivate}
      />
    </>
  );
}
