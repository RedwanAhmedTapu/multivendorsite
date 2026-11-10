// components/vendor/offers/create-vendor-voucher-dialog.tsx
import { useEffect, useRef, useState } from "react";
import { Clock, Shuffle, Ticket } from "lucide-react";
import { toast } from "sonner";
import { useCreateVendorVoucherMutation } from "@/features/offerApi";
import type { CreateVendorVoucherRequest, VendorPermissions } from "@/features/offerApi";
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
import { cn } from "@/lib/utils";
import {
  formatTaka,
  normalizeVoucherCode,
  validateOfferForm,
  validateVoucherCode,
  type OfferFormErrors,
} from "@/lib/offers/offer-view";
import { OfferBanner, VoucherCode, offerPrimaryButton, offerSecondaryButton } from "@/components/offers/shared/offer-ui";
import { OfferDateField, OfferField, OfferFormSection, offerInputClass, parseNumberInput } from "@/components/offers/shared/offer-form-fields";

interface CreateVendorVoucherDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  permissions?: VendorPermissions;
}

const DAY = 24 * 60 * 60 * 1000;
const initialForm = (): CreateVendorVoucherRequest => ({
  title: "",
  code: "",
  discountType: "PERCENTAGE",
  discountValue: 10,
  minOrderAmount: 0,
  validFrom: new Date().toISOString(),
  validTo: new Date(Date.now() + 30 * DAY).toISOString(), // 30 days from now
  usageLimit: 100,
  userUsageLimit: 1,
});

export function CreateVendorVoucherDialog({ open, onOpenChange, permissions }: CreateVendorVoucherDialogProps) {
  const [createVoucher, { isLoading }] = useCreateVendorVoucherMutation();
  const [formData, setFormData] = useState<CreateVendorVoucherRequest>(initialForm);
  const [errors, setErrors] = useState<OfferFormErrors>({});
  const submitting = useRef(false);

  // Fresh form every time the dialog opens.
  useEffect(() => {
    if (open) { setFormData(initialForm()); setErrors({}); }
  }, [open]);

  const set = <K extends keyof CreateVendorVoucherRequest>(key: K, value: CreateVendorVoucherRequest[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key === "usageLimit" ? "totalUsageLimit" : key]: undefined }));
  };

  const generateVoucherCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const bytes = new Uint32Array(6);
    crypto.getRandomValues(bytes);
    let code = "VENDOR-";
    for (const b of bytes) code += chars.charAt(b % chars.length);
    set("code", code);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting.current) return;
    const code = formData.code ?? "";
    const found: OfferFormErrors = {
      ...validateOfferForm(
        {
          title: formData.title,
          discountType: formData.discountType,
          discountValue: formData.discountValue,
          minOrderAmount: formData.minOrderAmount,
          validFrom: String(formData.validFrom),
          validTo: String(formData.validTo),
          totalUsageLimit: formData.usageLimit,
          userUsageLimit: formData.userUsageLimit,
        },
        permissions,
      ),
      code: validateVoucherCode(code),
    };
    if (!formData.validTo) found.validTo = "Vouchers need an end date.";
    setErrors(found);
    if (Object.values(found).some(Boolean)) return;

    submitting.current = true;
    try {
      await createVoucher({ ...formData, title: formData.title.trim(), code }).unwrap();
      toast.success(permissions?.requiresApproval ? "Voucher created and sent for approval" : "Voucher created");
      onOpenChange(false);
    } catch (error) {
      const message = (error as { data?: { message?: string } })?.data?.message;
      toast.error(message ? `Couldn't create voucher: ${message}` : "Couldn't create the voucher");
    } finally {
      submitting.current = false;
    }
  };

  const isPercent = formData.discountType === "PERCENTAGE";
  const preview = Number.isFinite(formData.discountValue) && formData.discountValue > 0
    ? isPercent ? `${formData.discountValue}% off` : `${formatTaka(formData.discountValue)} off`
    : "Set a discount";

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!isLoading) onOpenChange(o); }}>
      <DialogContent className="flex max-h-[92vh] flex-col gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-2xl">
        <form onSubmit={handleSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
          <DialogHeader className="border-b border-[#EEF2F7] px-5 py-4 text-left">
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white">
                <Ticket className="h-4 w-4" />
              </span>
              <div className="space-y-1">
                <DialogTitle className="text-base text-[#0D1B2E]">Create voucher</DialogTitle>
                <DialogDescription className="text-xs text-[#7A90AB]">A code customers enter at checkout to get a discount from your store.</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4">
            {permissions?.requiresApproval && (
              <OfferBanner tone="amber" icon={Clock} title="Needs approval">
                This voucher goes live after a FinixMart admin approves it.
              </OfferBanner>
            )}

            {/* Live preview */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-4 text-white">
              <div aria-hidden className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" />
              <p className="text-[11px] font-semibold uppercase tracking-wider text-white/70">Preview</p>
              <p className="mt-0.5 truncate text-lg font-bold">{formData.title.trim() || "Voucher title"}</p>
              <p className="text-sm text-white/85">
                {preview}
                {(formData.minOrderAmount ?? 0) > 0 && ` · min. order ${formatTaka(formData.minOrderAmount)}`}
              </p>
              <div className="mt-3">
                {formData.code ? <span className="rounded-lg bg-white/95 p-0.5"><VoucherCode code={formData.code} size="lg" /></span> : <span className="text-sm text-white/70">No code yet</span>}
              </div>
            </div>

            <OfferFormSection title="Voucher">
              <OfferField id="voucher-title" label="Voucher title" required error={errors.title}>
                <Input id="voucher-title" className={offerInputClass} value={formData.title} maxLength={120} placeholder="Eid special" aria-invalid={!!errors.title} onChange={(e) => set("title", e.target.value)} />
              </OfferField>
              <OfferField id="voucher-code" label="Voucher code" required error={errors.code} hint="Letters, numbers and dashes. Customers type this at checkout.">
                <div className="flex gap-2">
                  <Input id="voucher-code" className={cn(offerInputClass, "font-mono uppercase tracking-wider")} value={formData.code ?? ""} placeholder="EID2026" aria-invalid={!!errors.code}
                    onChange={(e) => set("code", normalizeVoucherCode(e.target.value))} />
                  <Button type="button" variant="outline" className={cn("h-9 shrink-0", offerSecondaryButton)} onClick={generateVoucherCode}>
                    <Shuffle className="mr-1.5 h-4 w-4 text-violet-600" /> Generate
                  </Button>
                </div>
              </OfferField>
            </OfferFormSection>

            <OfferFormSection title="Discount">
              <div role="radiogroup" aria-label="Discount type" className="grid grid-cols-2 gap-2">
                {(["PERCENTAGE", "FIXED_AMOUNT"] as const).map((t) => (
                  <button key={t} type="button" role="radio" aria-checked={formData.discountType === t} onClick={() => set("discountType", t)}
                    className={cn("rounded-lg border px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300",
                      formData.discountType === t ? "border-indigo-300 bg-indigo-50 text-indigo-700" : "border-[#E5EAF2] bg-white text-[#3D5068] hover:bg-[#F5F8FD]")}>
                    <span className="font-semibold">{t === "PERCENTAGE" ? "Percentage" : "Fixed amount"}</span>
                    <span className="block text-xs opacity-80">{t === "PERCENTAGE" ? `Up to ${permissions?.maxDiscountPercent ?? 100}%` : permissions ? `Up to ${formatTaka(permissions.maxDiscountAmount)}` : "Taka off the order"}</span>
                  </button>
                ))}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <OfferField id="voucher-discountValue" label={isPercent ? "Discount (%)" : "Discount (৳)"} required error={errors.discountValue}>
                  <Input id="voucher-discountValue" type="number" inputMode="decimal" min={0} step="0.01" className={offerInputClass} aria-invalid={!!errors.discountValue}
                    max={isPercent ? permissions?.maxDiscountPercent : permissions?.maxDiscountAmount}
                    value={Number.isFinite(formData.discountValue) ? formData.discountValue : ""} onChange={(e) => set("discountValue", parseNumberInput(e.target.value) ?? NaN)} />
                </OfferField>
                <OfferField id="voucher-minOrderAmount" label="Minimum order (৳)" error={errors.minOrderAmount} hint="0 means no minimum">
                  <Input id="voucher-minOrderAmount" type="number" inputMode="decimal" min={0} className={offerInputClass}
                    value={formData.minOrderAmount ?? ""} onChange={(e) => set("minOrderAmount", parseNumberInput(e.target.value))} />
                </OfferField>
              </div>
            </OfferFormSection>

            <OfferFormSection title="Schedule & limits">
              <div className="grid gap-3 sm:grid-cols-2">
                <OfferField id="voucher-validFrom" label="Starts" required error={errors.validFrom}>
                  <OfferDateField id="voucher-validFrom" value={String(formData.validFrom)} invalid={!!errors.validFrom} onChange={(iso) => set("validFrom", iso ?? formData.validFrom)} />
                </OfferField>
                <OfferField id="voucher-validTo" label="Ends" required error={errors.validTo}>
                  <OfferDateField id="voucher-validTo" value={String(formData.validTo)} invalid={!!errors.validTo} onChange={(iso) => set("validTo", iso ?? formData.validTo)} />
                </OfferField>
                <OfferField id="voucher-usageLimit" label="Total uses" error={errors.totalUsageLimit} hint="Empty for unlimited">
                  <Input id="voucher-usageLimit" type="number" inputMode="numeric" min={1} step={1} placeholder="Unlimited" className={offerInputClass}
                    value={formData.usageLimit ?? ""} onChange={(e) => set("usageLimit", parseNumberInput(e.target.value))} />
                </OfferField>
                <OfferField id="voucher-userUsageLimit" label="Uses per customer" error={errors.userUsageLimit}>
                  <Input id="voucher-userUsageLimit" type="number" inputMode="numeric" min={1} step={1} className={offerInputClass}
                    value={formData.userUsageLimit ?? ""} onChange={(e) => set("userUsageLimit", parseNumberInput(e.target.value))} />
                </OfferField>
              </div>
            </OfferFormSection>
          </div>

          <DialogFooter className="gap-2 border-t border-[#EEF2F7] bg-[#FAFBFD] px-5 py-3 sm:gap-2">
            <Button type="button" variant="outline" className={offerSecondaryButton} onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" className={offerPrimaryButton} disabled={isLoading}>
              {isLoading ? "Creating…" : "Create voucher"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
