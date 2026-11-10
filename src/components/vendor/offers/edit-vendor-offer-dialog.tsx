// components/vendor/offers/edit-vendor-offer-dialog.tsx
import { useEffect, useRef, useState } from "react";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import { useUpdateVendorOfferMutation } from "@/features/offerApi";
import type { CreateOfferRequest, Offer, VendorPermissions } from "@/features/offerApi";
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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  formatTaka,
  getOfferDisplayStatus,
  validateOfferForm,
  type OfferFormErrors,
} from "@/lib/offers/offer-view";
import { OfferStatusBadge, OfferTypeBadge, VoucherCode, offerPrimaryButton, offerSecondaryButton } from "@/components/offers/shared/offer-ui";
import { OfferDateField, OfferField, OfferFormSection, offerInputClass, parseNumberInput } from "@/components/offers/shared/offer-form-fields";

interface EditVendorOfferDialogProps {
  offer: Offer | null;
  onOpenChange: (open: boolean) => void;
  permissions?: VendorPermissions;
}

type EditForm = Pick<
  CreateOfferRequest,
  "title" | "description" | "discountValue" | "minOrderAmount" | "maxDiscountAmount" | "validFrom" | "validTo" | "totalUsageLimit" | "userUsageLimit" | "termsAndConditions"
>;

const fromOffer = (offer: Offer): EditForm => ({
  title: offer.title,
  description: offer.description ?? "",
  discountValue: offer.discountValue,
  minOrderAmount: offer.minOrderAmount,
  maxDiscountAmount: offer.maxDiscountAmount,
  validFrom: offer.validFrom,
  validTo: offer.validTo,
  totalUsageLimit: offer.totalUsageLimit,
  userUsageLimit: offer.userUsageLimit,
  termsAndConditions: offer.termsAndConditions ?? "",
});

export function EditVendorOfferDialog({ offer, onOpenChange, permissions }: EditVendorOfferDialogProps) {
  const [updateOffer, { isLoading }] = useUpdateVendorOfferMutation();
  const [formData, setFormData] = useState<EditForm | null>(null);
  const [errors, setErrors] = useState<OfferFormErrors>({});
  const submitting = useRef(false);

  // Load the selected offer into the form each time a different offer opens.
  useEffect(() => {
    setFormData(offer ? fromOffer(offer) : null);
    setErrors({});
  }, [offer]);

  if (!offer || !formData) return null;

  const set = <K extends keyof EditForm>(key: K, value: EditForm[K]) => {
    setFormData((prev) => (prev ? { ...prev, [key]: value } : prev));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting.current) return;
    const found = validateOfferForm({ ...formData, discountType: offer.discountType }, permissions);
    setErrors(found);
    if (Object.values(found).some(Boolean)) return;

    submitting.current = true;
    try {
      await updateOffer({
        offerId: offer.id,
        // type + discountType are unchanged; the server needs them to check
        // this vendor's type permission and discount limits on update.
        data: { ...formData, title: formData.title.trim(), type: offer.type, discountType: offer.discountType },
      }).unwrap();
      toast.success("Offer updated");
      onOpenChange(false);
    } catch (error) {
      const message = (error as { data?: { message?: string } })?.data?.message;
      toast.error(message ? `Couldn't save: ${message}` : "Couldn't save the offer");
    } finally {
      submitting.current = false;
    }
  };

  const status = getOfferDisplayStatus(offer);
  const showsValue = offer.discountType === "PERCENTAGE" || offer.discountType === "FIXED_AMOUNT";
  const unit = offer.discountType === "PERCENTAGE" ? "%" : "৳";
  const limitHint = offer.discountType === "PERCENTAGE"
    ? permissions ? `Your limit: ${permissions.maxDiscountPercent}%` : undefined
    : permissions ? `Your limit: ${formatTaka(permissions.maxDiscountAmount)}` : undefined;

  return (
    <Dialog open={!!offer} onOpenChange={(o) => { if (!isLoading) onOpenChange(o); }}>
      <DialogContent className="flex max-h-[92vh] flex-col gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-2xl">
        <form onSubmit={handleSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
          <DialogHeader className="border-b border-[#EEF2F7] px-5 py-4 text-left">
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white">
                <Pencil className="h-4 w-4" />
              </span>
              <div className="min-w-0 space-y-1">
                <DialogTitle className="text-base text-[#0D1B2E]">Edit offer</DialogTitle>
                <DialogDescription className="text-xs text-[#7A90AB]">
                  Offer type and discount type can&apos;t be changed after creation.
                </DialogDescription>
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <OfferStatusBadge status={status} />
                  <OfferTypeBadge type={offer.type} />
                  {offer.voucherConfig?.code && <VoucherCode code={offer.voucherConfig.code} />}
                </div>
              </div>
            </div>
          </DialogHeader>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4">
            <OfferFormSection title="Basics">
              <OfferField id="edit-title" label="Offer title" required error={errors.title}>
                <Input id="edit-title" className={offerInputClass} value={formData.title} maxLength={120} aria-invalid={!!errors.title} onChange={(e) => set("title", e.target.value)} />
              </OfferField>
              <OfferField id="edit-description" label="Description">
                <Textarea id="edit-description" className="rounded-lg border-[#E5EAF2]" rows={2} value={formData.description ?? ""} onChange={(e) => set("description", e.target.value)} />
              </OfferField>
            </OfferFormSection>

            <OfferFormSection title="Discount">
              <div className="grid gap-3 sm:grid-cols-2">
                {showsValue && (
                  <OfferField id="edit-discountValue" label={`Discount (${unit})`} required error={errors.discountValue} hint={limitHint}>
                    <Input id="edit-discountValue" type="number" inputMode="decimal" min={0} step="0.01" className={offerInputClass} aria-invalid={!!errors.discountValue}
                      value={formData.discountValue ?? ""} onChange={(e) => set("discountValue", parseNumberInput(e.target.value) as number)} />
                  </OfferField>
                )}
                <OfferField id="edit-minOrderAmount" label="Minimum order (৳)" error={errors.minOrderAmount} hint="0 means no minimum">
                  <Input id="edit-minOrderAmount" type="number" inputMode="decimal" min={0} className={offerInputClass}
                    value={formData.minOrderAmount ?? ""} onChange={(e) => set("minOrderAmount", parseNumberInput(e.target.value))} />
                </OfferField>
                {offer.discountType === "PERCENTAGE" && (
                  <OfferField id="edit-maxDiscountAmount" label="Maximum discount (৳)" error={errors.maxDiscountAmount} hint="Caps the percentage discount; empty for no cap">
                    <Input id="edit-maxDiscountAmount" type="number" inputMode="decimal" min={0} className={offerInputClass}
                      value={formData.maxDiscountAmount ?? ""} onChange={(e) => set("maxDiscountAmount", parseNumberInput(e.target.value))} />
                  </OfferField>
                )}
              </div>
            </OfferFormSection>

            <OfferFormSection title="Schedule & limits">
              <div className="grid gap-3 sm:grid-cols-2">
                <OfferField id="edit-validFrom" label="Starts" required error={errors.validFrom}>
                  <OfferDateField id="edit-validFrom" value={formData.validFrom} invalid={!!errors.validFrom} onChange={(iso) => set("validFrom", iso ?? formData.validFrom)} />
                </OfferField>
                <OfferField id="edit-validTo" label="Ends" error={errors.validTo} hint="Leave empty for no end date">
                  <OfferDateField id="edit-validTo" value={formData.validTo} placeholder="No end date" clearable invalid={!!errors.validTo} onChange={(iso) => set("validTo", iso)} />
                </OfferField>
                <OfferField id="edit-totalUsageLimit" label="Total uses" error={errors.totalUsageLimit} hint="Empty for unlimited">
                  <Input id="edit-totalUsageLimit" type="number" inputMode="numeric" min={1} step={1} placeholder="Unlimited" className={offerInputClass}
                    value={formData.totalUsageLimit ?? ""} onChange={(e) => set("totalUsageLimit", parseNumberInput(e.target.value))} />
                </OfferField>
                <OfferField id="edit-userUsageLimit" label="Uses per customer" error={errors.userUsageLimit}>
                  <Input id="edit-userUsageLimit" type="number" inputMode="numeric" min={1} step={1} className={offerInputClass}
                    value={formData.userUsageLimit ?? ""} onChange={(e) => set("userUsageLimit", parseNumberInput(e.target.value))} />
                </OfferField>
              </div>
            </OfferFormSection>

            <OfferFormSection title="Terms & conditions">
              <Textarea id="edit-terms" aria-label="Terms and conditions" className="rounded-lg border-[#E5EAF2]" rows={3} value={formData.termsAndConditions ?? ""} onChange={(e) => set("termsAndConditions", e.target.value)} />
            </OfferFormSection>
          </div>

          <DialogFooter className="gap-2 border-t border-[#EEF2F7] bg-[#FAFBFD] px-5 py-3 sm:gap-2">
            <Button type="button" variant="outline" className={offerSecondaryButton} onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" className={cn(offerPrimaryButton)} disabled={isLoading}>
              {isLoading ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
