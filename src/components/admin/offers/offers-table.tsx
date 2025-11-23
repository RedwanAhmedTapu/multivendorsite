// components/admin/offers/offers-table.tsx
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  useDeleteOfferMutation,
  useApproveVendorOfferMutation,
  useUpdateOfferMutation,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Search, 
  MoreHorizontal, 
  CheckCircle, 
  XCircle, 
  Store, 
  Eye,
  EyeOff,
  Calendar,
  Users,
  AlertTriangle,
  Info,
  Edit
} from "lucide-react";
import { format } from "date-fns";
import type { Offer, OfferStatus, OfferType, CreatorType, CreateOfferRequest } from "@/features/offerApi";
import { toast } from "sonner";

interface OffersTableProps {
  offers: Offer[];
  isLoading: boolean;
  onEdit?: (offer: Offer) => void; // Made optional since we're using router now
  showVendorInfo?: boolean;
  onViewAnalytics?: (offer: Offer) => void;
}

type ActionType = 
  | 'delete' 
  | 'approve' 
  | 'reject' 
  | 'activate' 
  | 'deactivate';

interface ConfirmationDialogState {
  isOpen: boolean;
  action: ActionType;
  offer: Offer | null;
  title: string;
  description: string;
  confirmText: string;
  variant: 'default' | 'destructive' | 'success';
}

export function OffersTable({ 
  offers, 
  isLoading, 
  onEdit, 
  showVendorInfo = false,
  onViewAnalytics 
}: OffersTableProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<OfferStatus | "ALL">("ALL");
  const [typeFilter, setTypeFilter] = useState<OfferType | "ALL">("ALL");
  const [deleteOffer] = useDeleteOfferMutation();
  const [approveVendorOffer] = useApproveVendorOfferMutation();
  const [updateOffer] = useUpdateOfferMutation();

  const [confirmationDialog, setConfirmationDialog] = useState<ConfirmationDialogState>({
    isOpen: false,
    action: 'delete',
    offer: null,
    title: '',
    description: '',
    confirmText: '',
    variant: 'default'
  });

  // Handle edit navigation
  const handleEdit = (offer: Offer) => {
    // Use router to navigate to the edit page
    router.push(`/admin-dashboard/offer-manage/edit-offer/${offer.id}`);
    
    // Also call the onEdit prop if provided (for backward compatibility)
    if (onEdit) {
      onEdit(offer);
    }
  };

  const filteredOffers = offers.filter(offer => {
    const matchesSearch = 
      offer.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      offer.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      offer.voucherConfig?.code?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "ALL" || offer.status === statusFilter;
    const matchesType = typeFilter === "ALL" || offer.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const showConfirmationDialog = (
    action: ActionType, 
    offer: Offer, 
    options: {
      title: string;
      description: string;
      confirmText: string;
      variant?: 'default' | 'destructive' | 'success';
    }
  ) => {
    setConfirmationDialog({
      isOpen: true,
      action,
      offer,
      title: options.title,
      description: options.description,
      confirmText: options.confirmText,
      variant: options.variant || 'default'
    });
  };

  const handleConfirmAction = async () => {
    if (!confirmationDialog.offer) return;

    const { action, offer } = confirmationDialog;

    try {
      switch (action) {
        case 'delete':
          await deleteOffer(offer.id).unwrap();
          toast.success("Offer deleted successfully");
          break;

        case 'approve':
          await approveVendorOffer({ offerId: offer.id, approved: true }).unwrap();
          toast.success("Offer approved successfully");
          break;

        case 'reject':
          await approveVendorOffer({ offerId: offer.id, approved: false }).unwrap();
          toast.success("Offer rejected successfully");
          break;

        case 'activate':
          // Only send the status field to avoid sending undefined values
          await updateOffer({ 
            offerId: offer.id, 
            data: { 
              status: 'ACTIVE' as OfferStatus
            } 
          }).unwrap();
          toast.success("Offer activated successfully");
          break;

        case 'deactivate':
          // Only send the status field to avoid sending undefined values
          await updateOffer({ 
            offerId: offer.id, 
            data: { 
              status: 'PAUSED' as OfferStatus
            } 
          }).unwrap();
          toast.success("Offer deactivated successfully");
          break;
      }
    } catch (error: any) {
      console.error(`Failed to ${action} offer:`, error);
      toast.error(`Failed to ${action} offer: ${error?.data?.message || 'Unknown error'}`);
    } finally {
      setConfirmationDialog(prev => ({ ...prev, isOpen: false }));
    }
  };

  const handleDeleteOffer = (offer: Offer) => {
    showConfirmationDialog('delete', offer, {
      title: "Delete Offer",
      description: `Are you sure you want to delete "${offer.title}"? This action cannot be undone and will remove all associated data.`,
      confirmText: "Delete Offer",
      variant: 'destructive'
    });
  };

  const handleApproveVendorOffer = (offer: Offer, approved: boolean) => {
    const action = approved ? 'approve' : 'reject';
    showConfirmationDialog(action, offer, {
      title: `${approved ? 'Approve' : 'Reject'} Offer`,
      description: `Are you sure you want to ${approved ? 'approve' : 'reject'} the offer "${offer.title}"? ${approved ? 'This will make it available to customers.' : 'This will prevent the offer from being used.'}`,
      confirmText: `${approved ? 'Approve' : 'Reject'} Offer`,
      variant: approved ? 'success' : 'destructive'
    });
  };

  const handleToggleActive = (offer: Offer) => {
    const isActive = offer.status === 'ACTIVE';
    const action = isActive ? 'deactivate' : 'activate';
    
    showConfirmationDialog(action, offer, {
      title: `${isActive ? 'Deactivate' : 'Activate'} Offer`,
      description: `Are you sure you want to ${isActive ? 'deactivate' : 'activate'} the offer "${offer.title}"? ${isActive ? 'This will make it unavailable to customers.' : 'This will make it available to customers.'}`,
      confirmText: `${isActive ? 'Deactivate' : 'Activate'} Offer`,
      variant: isActive ? 'destructive' : 'success'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Loading offers...</div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search offers by title, description, or voucher code..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2">
            <select 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as OfferStatus | "ALL")}
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="EXPIRED">Expired</option>
            </select>

            <select 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as OfferType | "ALL")}
            >
              <option value="ALL">All Types</option>
              <option value="REGULAR_DISCOUNT">Regular Discount</option>
              <option value="VOUCHER">Voucher</option>
              <option value="COUNTDOWN_DEAL">Countdown Deal</option>
              <option value="FLASH_SALE">Flash Sale</option>
              <option value="BUY_X_GET_Y">Buy X Get Y</option>
              <option value="FREE_SHIPPING">Free Shipping</option>
              <option value="BUNDLE_DEAL">Bundle Deal</option>
            </select>
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Offer Details</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Validity</TableHead>
                {showVendorInfo && <TableHead>Created By</TableHead>}
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOffers.map((offer) => (
                <OfferTableRow
                  key={offer.id}
                  offer={offer}
                  onEdit={handleEdit} // Use the new handleEdit function
                  onDelete={handleDeleteOffer}
                  onApprove={handleApproveVendorOffer}
                  onToggleActive={handleToggleActive}
                  onViewAnalytics={onViewAnalytics}
                  showVendorInfo={showVendorInfo}
                />
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredOffers.length === 0 && (
          <div className="text-center py-12 text-muted-foreground border rounded-lg">
            <div className="flex flex-col items-center gap-2">
              <Search className="h-8 w-8" />
              <div>
                {searchTerm || statusFilter !== "ALL" || typeFilter !== "ALL" 
                  ? "No offers match your filters" 
                  : "No offers found"
                }
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={confirmationDialog.isOpen} onOpenChange={(open) => setConfirmationDialog(prev => ({ ...prev, isOpen: open }))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {confirmationDialog.variant === 'destructive' && (
                <AlertTriangle className="h-5 w-5 text-destructive" />
              )}
              {confirmationDialog.variant === 'success' && (
                <Info className="h-5 w-5 text-green-600" />
              )}
              {confirmationDialog.title}
            </DialogTitle>
            <DialogDescription>
              {confirmationDialog.description}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setConfirmationDialog(prev => ({ ...prev, isOpen: false }))}
              className="sm:flex-1"
            >
              Cancel
            </Button>
            <Button
              variant={confirmationDialog.variant === 'destructive' ? 'destructive' : 'default'}
              onClick={handleConfirmAction}
              className="sm:flex-1"
            >
              {confirmationDialog.confirmText}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function OfferTableRow({
  offer,
  onEdit,
  onDelete,
  onApprove,
  onToggleActive,
  onViewAnalytics,
  showVendorInfo,
}: {
  offer: Offer;
  onEdit: (offer: Offer) => void;
  onDelete: (offer: Offer) => void;
  onApprove: (offer: Offer, approved: boolean) => void;
  onToggleActive: (offer: Offer) => void;
  onViewAnalytics?: (offer: Offer) => void;
  showVendorInfo: boolean;
}) {
  const getStatusBadge = (offer: Offer) => {
    const statusConfig = {
      ACTIVE: { variant: "default" as const, label: "Active" },
      PENDING: { variant: "outline" as const, label: "Pending" },
      APPROVED: { variant: "default" as const, label: "Approved" },
      REJECTED: { variant: "destructive" as const, label: "Rejected" },
      PAUSED: { variant: "secondary" as const, label: "Paused" },
      EXPIRED: { variant: "destructive" as const, label: "Expired" },
    };

    const config = statusConfig[offer.status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getTypeBadge = (type: OfferType) => {
    const variants: Record<OfferType, "default" | "secondary" | "destructive" | "outline"> = {
      REGULAR_DISCOUNT: "default",
      VOUCHER: "secondary",
      COUNTDOWN_DEAL: "outline",
      FLASH_SALE: "destructive",
      BUY_X_GET_Y: "default",
      FREE_SHIPPING: "secondary",
      BUNDLE_DEAL: "outline",
      SEASONAL_SALE: "default",
      LOYALTY_REWARD: "secondary",
      REFERRAL_BONUS: "outline",
    };

    return (
      <Badge variant={variants[type] || "default"} className="capitalize">
        {type.toLowerCase().replace(/_/g, " ")}
      </Badge>
    );
  };

  const getDiscountText = (offer: Offer) => {
    switch (offer.discountType) {
      case "PERCENTAGE":
        return `${offer.discountValue}%${offer.maxDiscountAmount ? ` (max $${offer.maxDiscountAmount})` : ''}`;
      case "FIXED_AMOUNT":
        return `$${offer.discountValue} off`;
      case "FREE_SHIPPING":
        return "Free Shipping";
      case "BUY_X_GET_Y":
        const config = offer.buyXGetYOffer;
        return config ? `Buy ${config.buyQuantity} Get ${config.getQuantity}` : "Buy X Get Y";
      default:
        return "Discount";
    }
  };

  const getValidityStatus = (offer: Offer) => {
    const now = new Date();
    const validFrom = new Date(offer.validFrom);
    const validTo = offer.validTo ? new Date(offer.validTo) : null;

    if (validTo && validTo < now) {
      return { status: "expired", text: "Expired" };
    }
    if (validFrom > now) {
      return { status: "scheduled", text: `Starts ${format(validFrom, "MMM dd")}` };
    }
    if (validTo) {
      const daysLeft = Math.ceil((validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return { 
        status: "active", 
        text: daysLeft <= 3 ? `${daysLeft}d left` : format(validTo, "MMM dd")
      };
    }
    return { status: "no-expiry", text: "No expiry" };
  };

  const getCreatorBadge = (createdByType: CreatorType, vendor?: any) => {
    const config = {
      ADMIN: { variant: "default" as const, label: "Admin", icon: null },
      VENDOR: { variant: "outline" as const, label: vendor?.storeName || "Vendor", icon: Store },
      SYSTEM: { variant: "secondary" as const, label: "System", icon: null },
    };

    const creatorConfig = config[createdByType];
    const IconComponent = creatorConfig.icon;

    return (
      <Badge variant={creatorConfig.variant} className="flex items-center gap-1">
        {IconComponent && <IconComponent className="w-3 h-3" />}
        {creatorConfig.label}
      </Badge>
    );
  };

  const validity = getValidityStatus(offer);
  const isVendorOffer = offer.createdByType === "VENDOR";
  const requiresApproval = isVendorOffer && offer.status === "PENDING";
  const canToggleActive = !requiresApproval && (offer.status === 'ACTIVE' || offer.status === 'PAUSED' || offer.status === 'APPROVED');

  return (
    <TableRow>
      <TableCell>
        <div className="flex flex-col space-y-1">
          <div className="font-semibold flex items-center gap-2">
            {offer.title}
            {offer.voucherConfig?.code && (
              <Badge variant="outline" className="text-xs">
                {offer.voucherConfig.code}
              </Badge>
            )}
          </div>
          <div className="text-sm text-muted-foreground line-clamp-2">
            {offer.description}
          </div>
          {offer.priority > 1 && (
            <div className="text-xs text-blue-600">
              Priority: {offer.priority}
            </div>
          )}
        </div>
      </TableCell>
      
      <TableCell>
        <div className="flex flex-col gap-1">
          {getTypeBadge(offer.type)}
          {offer.category && offer.category !== "GENERAL" && (
            <div className="text-xs text-muted-foreground capitalize">
              {offer.category.toLowerCase().replace(/_/g, " ")}
            </div>
          )}
        </div>
      </TableCell>
      
      <TableCell>
        <div className="font-medium">{getDiscountText(offer)}</div>
        {(offer?.minOrderAmount ?? 0) > 0 && (
          <div className="text-xs text-muted-foreground">
            Min: ${offer.minOrderAmount ?? 0}
          </div>
        )}
      </TableCell>
      
      <TableCell>
        <div className="flex flex-col gap-1">
          {getStatusBadge(offer)}
          {!offer.isPublic && (
            <Badge variant="outline" className="text-xs">
              Private
            </Badge>
          )}
        </div>
      </TableCell>
      
      <TableCell>
        <div className="flex flex-col">
          <div className="flex items-center gap-1 text-sm">
            <Users className="w-3 h-3" />
            {offer.currentUsageCount}
            {offer.totalUsageLimit && ` / ${offer.totalUsageLimit}`}
          </div>
          {(offer.userUsageLimit ?? 0) > 1 && (
            <div className="text-xs text-muted-foreground">
              {offer.userUsageLimit} per user
            </div>
          )}
        </div>
      </TableCell>
      
      <TableCell>
        <div className="flex flex-col">
          <div className={`text-sm ${
            validity.status === "expired" ? "text-destructive" : 
            validity.status === "scheduled" ? "text-blue-600" : 
            "text-foreground"
          }`}>
            {validity.text}
          </div>
          {offer.validTo && validity.status !== "expired" && (
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {format(new Date(offer.validTo), "MMM dd, yyyy")}
            </div>
          )}
        </div>
      </TableCell>
      
      {showVendorInfo && (
        <TableCell>
          {getCreatorBadge(offer.createdByType, offer.createdByVendor)}
        </TableCell>
      )}
      
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Offer Actions</DropdownMenuLabel>
            
            <DropdownMenuItem onClick={() => onEdit(offer)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit Offer
            </DropdownMenuItem>

            {onViewAnalytics && (
              <DropdownMenuItem onClick={() => onViewAnalytics(offer)}>
                View Analytics
              </DropdownMenuItem>
            )}

            {canToggleActive && (
              <DropdownMenuItem 
                onClick={() => onToggleActive(offer)}
                className={offer.status === "ACTIVE" ? "text-orange-600" : "text-green-600"}
              >
                {offer.status === "ACTIVE" ? (
                  <>
                    <EyeOff className="w-4 h-4 mr-2" />
                    Deactivate Offer
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 mr-2" />
                    Activate Offer
                  </>
                )}
              </DropdownMenuItem>
            )}

            {requiresApproval && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Vendor Approval</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => onApprove(offer, true)}
                  className="text-green-600"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve Offer
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onApprove(offer, false)}
                  className="text-red-600"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject Offer
                </DropdownMenuItem>
              </>
            )}

            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => onDelete(offer)}
            >
              Delete Offer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}