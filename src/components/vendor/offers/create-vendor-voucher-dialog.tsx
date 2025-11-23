// components/vendor/offers/create-vendor-voucher-dialog.tsx
import { useState } from "react";
import { useCreateVendorVoucherMutation } from "@/features/offerApi";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Alert } from "@/components/ui/alert";
import { CalendarIcon, Info } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { CreateVendorVoucherRequest, VendorPermissions } from "@/features/offerApi";

interface CreateVendorVoucherDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  permissions?: VendorPermissions;
}

export function CreateVendorVoucherDialog({ open, onOpenChange, permissions }: CreateVendorVoucherDialogProps) {
  const [createVoucher, { isLoading }] = useCreateVendorVoucherMutation();
  const [formData, setFormData] = useState<CreateVendorVoucherRequest>({
    title: "",
    code: "",
    discountType: "PERCENTAGE",
    discountValue: 10,
    minOrderAmount: 0,
    validFrom: new Date().toISOString(),
    validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
    usageLimit: 100,
    userUsageLimit: 1,
  });

  const generateVoucherCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'VENDOR-';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, code }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.code) {
      toast.error("Please generate or enter a voucher code");
      return;
    }

    // Validate discount limits
    if (formData.discountType === "PERCENTAGE" && formData.discountValue > (permissions?.maxDiscountPercent || 100)) {
      toast.error(`Discount percentage cannot exceed ${permissions?.maxDiscountPercent}%`);
      return;
    }

    if (formData.discountType === "FIXED_AMOUNT" && formData.discountValue > (permissions?.maxDiscountAmount || 1000)) {
      toast.error(`Discount amount cannot exceed $${permissions?.maxDiscountAmount}`);
      return;
    }

    try {
      await createVoucher(formData).unwrap();
      toast.success("Voucher created successfully and sent for approval");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to create voucher");
    }
  };

  const maxDiscount = permissions?.maxDiscountPercent || 100;
  const maxAmount = permissions?.maxDiscountAmount || 1000;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Voucher</DialogTitle>
            <DialogDescription>
              Create a unique voucher code for your customers.
            </DialogDescription>
          </DialogHeader>

          {permissions?.requiresApproval && (
            <Alert className="bg-blue-50 border-blue-200">
              <Info className="h-4 w-4 text-blue-600" />
              <div className="text-sm text-blue-800">
                This voucher will be submitted for admin approval before becoming active.
              </div>
            </Alert>
          )}

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="voucher-title">Voucher Title</Label>
              <Input
                id="voucher-title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Summer Sale Voucher"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="voucher-code">
                Voucher Code
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="ml-2"
                  onClick={generateVoucherCode}
                >
                  Generate Code
                </Button>
              </Label>
              <Input
                id="voucher-code"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value.toUpperCase() })
                }
                placeholder="SUMMER2024"
                className="font-mono"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="voucher-discountType">Discount Type</Label>
                <Select
                  value={formData.discountType}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, discountType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                    <SelectItem value="FIXED_AMOUNT">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="voucher-discountValue">
                  {formData.discountType === "PERCENTAGE" ? "Discount %" : "Discount Amount"}
                  {formData.discountType === "PERCENTAGE" && (
                    <span className="text-xs text-muted-foreground ml-1">(Max: {maxDiscount}%)</span>
                  )}
                </Label>
                <Input
                  id="voucher-discountValue"
                  type="number"
                  value={formData.discountValue}
                  onChange={(e) =>
                    setFormData({ ...formData, discountValue: parseFloat(e.target.value) })
                  }
                  max={formData.discountType === "PERCENTAGE" ? maxDiscount : maxAmount}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="voucher-minOrderAmount">Minimum Order Amount</Label>
              <Input
                id="voucher-minOrderAmount"
                type="number"
                value={formData.minOrderAmount}
                onChange={(e) =>
                  setFormData({ ...formData, minOrderAmount: parseFloat(e.target.value) })
                }
                placeholder="0"
              />
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
                      {format(new Date(formData.validFrom), "PPP")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={new Date(formData.validFrom)}
                      onSelect={(date) =>
                        setFormData({ ...formData, validFrom: date?.toISOString() || new Date().toISOString() })
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
                      {format(new Date(formData.validTo!), "PPP")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={new Date(formData.validTo!)}
                      onSelect={(date) =>
                        setFormData({ ...formData, validTo: (date ? date.toISOString() : new Date().toISOString()) })
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="voucher-usageLimit">Total Usage Limit</Label>
                <Input
                  id="voucher-usageLimit"
                  type="number"
                  value={formData.usageLimit}
                  onChange={(e) =>
                    setFormData({ ...formData, usageLimit: parseInt(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="voucher-userUsageLimit">Uses Per Customer</Label>
                <Input
                  id="voucher-userUsageLimit"
                  type="number"
                  value={formData.userUsageLimit}
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
              {isLoading ? "Creating..." : "Create Voucher"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}