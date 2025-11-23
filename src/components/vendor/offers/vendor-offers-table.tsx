// components/vendor/offers/vendor-offers-table.tsx
import { useState } from "react";
import {
  useDeactivateVendorOfferMutation,
} from "@/features/offerApi";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, Filter, MoreHorizontal, Edit, PowerOff, Eye } from "lucide-react";
import { format } from "date-fns";
import type { Offer, VendorPermissions } from "@/features/offerApi";
import { toast } from "sonner";

interface VendorOffersTableProps {
  offers: Offer[];
  isLoading: boolean;
  onEdit: (offer: Offer) => void;
  permissions?: VendorPermissions;
}

export function VendorOffersTable({ offers, isLoading, onEdit }: VendorOffersTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [deactivateOffer] = useDeactivateVendorOfferMutation();

  const filteredOffers = offers.filter(offer =>
    offer.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    offer.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeactivateOffer = async (offerId: string) => {
    try {
      await deactivateOffer(offerId).unwrap();
      toast.success("Offer deactivated successfully");
    } catch (error) {
      toast.error("Failed to deactivate offer");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Loading your offers...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search your offers..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" size="sm">
          <Filter className="w-4 h-4 mr-2" />
          Filter
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Offer</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Discount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Usage</TableHead>
            <TableHead>Valid Until</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredOffers.map((offer) => (
            <VendorOfferTableRow
              key={offer.id}
              offer={offer}
              onEdit={onEdit}
              onDeactivate={handleDeactivateOffer}
            />
          ))}
        </TableBody>
      </Table>

      {filteredOffers.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          {searchTerm ? "No offers match your search" : "No offers found"}
        </div>
      )}
    </div>
  );
}

function VendorOfferTableRow({
  offer,
  onEdit,
  onDeactivate,
}: {
  offer: Offer;
  onEdit: (offer: Offer) => void;
  onDeactivate: (offerId: string) => void;
}) {
  const getStatusBadge = (offer: Offer) => {
    if (!offer.isActive) {
      if (offer.createdByType === "VENDOR") {
        return <Badge variant="outline">Pending Approval</Badge>;
      }
      return <Badge variant="secondary">Inactive</Badge>;
    }
    
    const now = new Date();
    const validTo = offer.validTo ? new Date(offer.validTo) : null;
    
    if (validTo && validTo < now) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    
    return <Badge variant="default">Active</Badge>;
  };

  const getTypeBadge = (type: string) => {
    const variants = {
      VOUCHER: "secondary",
      FLASH_SALE: "destructive",
      COUNTDOWN_DEAL: "outline",
      REGULAR_DISCOUNT: "default",
    } as const;

    return (
      <Badge variant={variants[type as keyof typeof variants] || "default"}>
        {type.replace(/_/g, " ")}
      </Badge>
    );
  };

  const getDiscountText = (offer: Offer) => {
    switch (offer.discountType) {
      case "PERCENTAGE":
        return `${offer.discountValue}% off`;
      case "FIXED_AMOUNT":
        return `$${offer.discountValue} off`;
      case "FREE_SHIPPING":
        return "Free Shipping";
      case "BUY_X_GET_Y":
        return "Buy X Get Y";
      default:
        return "Discount";
    }
  };

  return (
    <TableRow>
      <TableCell className="font-medium">
        <div>
          <div className="font-semibold">{offer.title}</div>
          <div className="text-sm text-muted-foreground line-clamp-1">
            {offer.description}
          </div>
        </div>
      </TableCell>
      <TableCell>{getTypeBadge(offer.type)}</TableCell>
      <TableCell>{getDiscountText(offer)}</TableCell>
      <TableCell>{getStatusBadge(offer)}</TableCell>
      <TableCell>
        {offer.currentUsageCount} / {offer.totalUsageLimit || "∞"}
      </TableCell>
      <TableCell>
        {offer.validTo ? format(new Date(offer.validTo), "MMM dd, yyyy") : "No expiry"}
      </TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onEdit(offer)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Eye className="w-4 h-4 mr-2" />
              View Analytics
            </DropdownMenuItem>
            {offer.isActive && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDeactivate(offer.id)}
                  className="text-amber-600"
                >
                  <PowerOff className="w-4 h-4 mr-2" />
                  Deactivate
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}