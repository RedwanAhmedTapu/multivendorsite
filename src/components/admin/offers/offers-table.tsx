// components/admin/offers/offers-table.tsx
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  useDeleteOfferMutation,
  useApproveVendorOfferMutation,
  useUpdateOfferMutation,
} from "@/features/offerApi";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  AlertTriangle,
  Info,
  Edit,
  Copy,
  Trash2,
  BarChart3,
} from "lucide-react";
import type { Offer, OfferStatus } from "@/features/offerApi";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { OfferListTable } from "@/components/offers/shared/offer-list-table";
import { offerPrimaryButton, offerSecondaryButton } from "@/components/offers/shared/offer-ui";

interface OffersTableProps {
  offers: Offer[];
  isLoading: boolean;
  isFetching?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onEdit?: (offer: Offer) => void; // Optional: editing navigates to the edit page
  showVendorInfo?: boolean;
  onViewAnalytics?: (offer: Offer) => void;
  empty?: { title: string; description?: string; action?: React.ReactNode };
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
  isFetching,
  error,
  onRetry,
  onEdit,
  showVendorInfo = false,
  onViewAnalytics,
  empty = { title: "No offers found" },
}: OffersTableProps) {
  const router = useRouter();
  const [deleteOffer] = useDeleteOfferMutation();
  const [approveVendorOffer] = useApproveVendorOfferMutation();
  const [updateOffer] = useUpdateOfferMutation();
  const [working, setWorking] = useState(false);

  const [confirmationDialog, setConfirmationDialog] = useState<ConfirmationDialogState>({
    isOpen: false,
    action: 'delete',
    offer: null,
    title: '',
    description: '',
    confirmText: '',
    variant: 'default'
  });
  // Rejecting a vendor offer requires a reason (kept in the audit log).
  const [rejectReason, setRejectReason] = useState("");
  const rejectReasonMissing = confirmationDialog.action === 'reject' && !rejectReason.trim();

  const handleEdit = (offer: Offer) => {
    router.push(`/admin-dashboard/offer-manage/edit-offer/${offer.id}`);
    onEdit?.(offer);
  };

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
    setRejectReason("");
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
    if (!confirmationDialog.offer || working) return;

    const { action, offer } = confirmationDialog;
    if (action === 'reject' && !rejectReason.trim()) {
      toast.error("Please enter a reason for rejecting this offer");
      return;
    }

    setWorking(true);
    try {
      switch (action) {
        case 'delete':
          await deleteOffer(offer.id).unwrap();
          toast.success("Offer deleted");
          break;

        case 'approve':
          await approveVendorOffer({ offerId: offer.id, approved: true }).unwrap();
          toast.success("Offer approved");
          break;

        case 'reject':
          await approveVendorOffer({ offerId: offer.id, approved: false, reason: rejectReason.trim() }).unwrap();
          toast.success("Offer rejected");
          break;

        case 'activate':
          // Only send the status field to avoid sending undefined values
          await updateOffer({ offerId: offer.id, data: { status: 'ACTIVE' as OfferStatus } }).unwrap();
          toast.success("Offer activated");
          break;

        case 'deactivate':
          // Only send the status field to avoid sending undefined values
          await updateOffer({ offerId: offer.id, data: { status: 'PAUSED' as OfferStatus } }).unwrap();
          toast.success("Offer paused");
          break;
      }
    } catch (error) {
      const message = (error as { data?: { message?: string } })?.data?.message;
      toast.error(`Couldn't ${action} the offer${message ? `: ${message}` : ''}`);
    } finally {
      setWorking(false);
      setConfirmationDialog(prev => ({ ...prev, isOpen: false }));
    }
  };

  const handleDeleteOffer = (offer: Offer) => {
    showConfirmationDialog('delete', offer, {
      title: "Delete offer?",
      description: `"${offer.title}" will be permanently deleted along with its associated data. This can't be undone.`,
      confirmText: "Delete offer",
      variant: 'destructive'
    });
  };

  const handleApproveVendorOffer = (offer: Offer, approved: boolean) => {
    const action = approved ? 'approve' : 'reject';
    showConfirmationDialog(action, offer, {
      title: approved ? 'Approve vendor offer?' : 'Reject vendor offer?',
      description: approved
        ? `"${offer.title}" will go live for customers.`
        : `"${offer.title}" won't be usable. Your reason is saved in the offer's audit log.`,
      confirmText: approved ? 'Approve offer' : 'Reject offer',
      variant: approved ? 'success' : 'destructive'
    });
  };

  const handleToggleActive = (offer: Offer) => {
    const isActive = offer.status === 'ACTIVE';
    showConfirmationDialog(isActive ? 'deactivate' : 'activate', offer, {
      title: isActive ? 'Pause offer?' : 'Activate offer?',
      description: isActive
        ? `"${offer.title}" will stop being available to customers until you activate it again.`
        : `"${offer.title}" will become available to customers.`,
      confirmText: isActive ? 'Pause offer' : 'Activate offer',
      variant: isActive ? 'destructive' : 'success'
    });
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
    const requiresApproval = offer.createdByType === "VENDOR" && offer.status === "PENDING";
    const canToggleActive = !requiresApproval && (offer.status === 'ACTIVE' || offer.status === 'PAUSED' || offer.status === 'APPROVED');
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-[#3D5068] hover:bg-[#EEF3FB]" aria-label={`Actions for ${offer.title}`}>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52 rounded-xl">
          {requiresApproval && (
            <>
              <DropdownMenuLabel className="text-xs text-[#7A90AB]">Vendor approval</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleApproveVendorOffer(offer, true)} className="text-emerald-700 focus:text-emerald-800">
                <CheckCircle className="mr-2 h-4 w-4" /> Approve
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleApproveVendorOffer(offer, false)} className="text-rose-600 focus:text-rose-700">
                <XCircle className="mr-2 h-4 w-4" /> Reject…
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuLabel className="text-xs text-[#7A90AB]">Offer actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => handleEdit(offer)}>
            <Edit className="mr-2 h-4 w-4" /> Edit offer
          </DropdownMenuItem>
          {offer.voucherConfig?.code && (
            <DropdownMenuItem onClick={() => copyCode(offer.voucherConfig!.code)}>
              <Copy className="mr-2 h-4 w-4" /> Copy voucher code
            </DropdownMenuItem>
          )}
          {onViewAnalytics && (
            <DropdownMenuItem onClick={() => onViewAnalytics(offer)}>
              <BarChart3 className="mr-2 h-4 w-4" /> View analytics
            </DropdownMenuItem>
          )}
          {canToggleActive && (
            <DropdownMenuItem
              onClick={() => handleToggleActive(offer)}
              className={offer.status === "ACTIVE" ? "text-orange-600 focus:text-orange-700" : "text-emerald-700 focus:text-emerald-800"}
            >
              {offer.status === "ACTIVE" ? <><EyeOff className="mr-2 h-4 w-4" /> Pause offer</> : <><Eye className="mr-2 h-4 w-4" /> Activate offer</>}
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-rose-600 focus:text-rose-700" onClick={() => handleDeleteOffer(offer)}>
            <Trash2 className="mr-2 h-4 w-4" /> Delete offer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const tone = confirmationDialog.variant;
  return (
    <>
      <OfferListTable
        offers={offers}
        isLoading={isLoading}
        isFetching={isFetching}
        error={error}
        onRetry={onRetry}
        renderActions={renderActions}
        showCreator={showVendorInfo}
        empty={empty}
      />

      {/* Confirmation Dialog */}
      <Dialog open={confirmationDialog.isOpen} onOpenChange={(open) => { if (!working) setConfirmationDialog(prev => ({ ...prev, isOpen: open })); }}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <div className="flex items-start gap-3">
              <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-xl ring-1",
                tone === 'destructive' ? "bg-rose-50 text-rose-600 ring-rose-100" : tone === 'success' ? "bg-emerald-50 text-emerald-600 ring-emerald-100" : "bg-indigo-50 text-indigo-600 ring-indigo-100")}>
                {tone === 'destructive' ? <AlertTriangle className="h-4 w-4" /> : <Info className="h-4 w-4" />}
              </span>
              <div className="space-y-1 text-left">
                <DialogTitle className="text-base text-[#0D1B2E]">{confirmationDialog.title}</DialogTitle>
                <DialogDescription className="text-sm text-[#3D5068]">{confirmationDialog.description}</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          {confirmationDialog.action === 'reject' && (
            <div className="space-y-2">
              <Label htmlFor="offer-reject-reason" className="text-xs font-semibold text-[#3D5068]">Reason for rejection</Label>
              <Textarea
                id="offer-reject-reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Explain why this offer is being rejected"
                rows={3}
                maxLength={500}
                className="rounded-lg border-[#E5EAF2]"
              />
              <p className="text-right text-[11px] text-[#7A90AB]">{rejectReason.length}/500</p>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              className={offerSecondaryButton}
              onClick={() => setConfirmationDialog(prev => ({ ...prev, isOpen: false }))}
              disabled={working}
            >
              Cancel
            </Button>
            <Button
              className={tone === 'destructive' ? "bg-rose-600 text-white hover:bg-rose-500" : tone === 'success' ? "bg-emerald-600 text-white hover:bg-emerald-500" : offerPrimaryButton}
              onClick={handleConfirmAction}
              disabled={rejectReasonMissing || working}
            >
              {working ? "Working…" : confirmationDialog.confirmText}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
