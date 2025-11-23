// components/vendor/offers/edit-vendor-offer-dialog.tsx
import { useState } from "react";
import { useUpdateVendorOfferMutation } from "@/features/offerApi";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Offer, VendorPermissions } from "@/features/offerApi";

interface EditVendorOfferDialogProps {
  offer: Offer | null;
  onOpenChange: (open: boolean) => void;
  permissions?: VendorPermissions;
}

export function EditVendorOfferDialog({ offer, onOpenChange, permissions }: EditVendorOfferDialogProps) {
  const [updateOffer, { isLoading }] = useUpdateVendorOfferMutation();
  const [formData, setFormData] = useState<Partial<any>>({});

  // Update form data when offer changes
  useState(() => {
    if (offer) {
      setFormData({
        title: offer.title,
        description: offer.description,
        discountValue: offer.discountValue,
        minOrderAmount: offer.minOrderAmount,
        maxDiscountAmount: offer.maxDiscountAmount,
        validFrom: offer.validFrom,
        validTo: offer.validTo,
        totalUsageLimit: offer.totalUsageLimit,
        userUsageLimit: offer.userUsageLimit,
        termsAndConditions: offer.termsAndConditions,
      });
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offer) return;

    try {
      await updateOffer({
        offerId: offer.id,
        data: formData,
      }).unwrap();
      toast.success("Offer updated successfully");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to update offer");
    }
  };

  if (!offer) return null;

  const isPendingApproval = offer.createdByType === "VENDOR" && !offer.isActive;

  return (
    <Dialog open={!!offer} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Edit Offer
              {isPendingApproval && (
                <Badge variant="outline" className="text-amber-600">
                  Pending Approval
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              Update your offer details. {isPendingApproval && "Changes will require re-approval."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Offer Title</Label>
              <Input
                id="edit-title"
                value={formData.title || ""}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description || ""}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-discountValue">
                  Discount Value
                  {offer.discountType === "PERCENTAGE" && " (%)"}
                  {offer.discountType === "FIXED_AMOUNT" && " ($)"}
                </Label>
                <Input
                  id="edit-discountValue"
                  type="number"
                  value={formData.discountValue || 0}
                  onChange={(e) =>
                    setFormData({ ...formData, discountValue: parseFloat(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-minOrderAmount">Minimum Order Amount</Label>
                <Input
                  id="edit-minOrderAmount"
                  type="number"
                  value={formData.minOrderAmount || 0}
                  onChange={(e) =>
                    setFormData({ ...formData, minOrderAmount: parseFloat(e.target.value) })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valid From</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.validFrom && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.validFrom ? (
                        format(new Date(formData.validFrom), "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.validFrom ? new Date(formData.validFrom) : new Date()}
                      onSelect={(date) =>
                        setFormData({ ...formData, validFrom: date?.toISOString() })
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Valid To</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.validTo && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.validTo ? (
                        format(new Date(formData.validTo), "PPP")
                      ) : (
                        <span>No expiry</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.validTo ? new Date(formData.validTo) : undefined}
                      onSelect={(date) =>
                        setFormData({ ...formData, validTo: date?.toISOString() })
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-totalUsageLimit">Total Usage Limit</Label>
                <Input
                  id="edit-totalUsageLimit"
                  type="number"
                  value={formData.totalUsageLimit || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      totalUsageLimit: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                  placeholder="No limit"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-userUsageLimit">Usage Limit Per User</Label>
                <Input
                  id="edit-userUsageLimit"
                  type="number"
                  value={formData.userUsageLimit || 1}
                  onChange={(e) =>
                    setFormData({ ...formData, userUsageLimit: parseInt(e.target.value) })
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}