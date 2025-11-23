// components/admin/vendors/bulk-edit-permissions-dialog.tsx
"use client";

import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { UpdateVendorPermissionsRequest } from "@/features/offerApi";

interface BulkEditPermissionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: UpdateVendorPermissionsRequest) => void;
  vendorCount: number;
}

export function BulkEditPermissionsDialog({
  open,
  onOpenChange,
  onSave,
  vendorCount,
}: BulkEditPermissionsDialogProps) {
  const [formData, setFormData] = useState<Partial<UpdateVendorPermissionsRequest>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleNumberChange = (field: string, value: string) => {
    setFormData(prev => ({ 
      ...prev, 
      [field]: value === "" ? undefined : parseInt(value) 
    }));
  };

  const handleSelectChange = (field: string, value: string) => {
    if (value === "no-change") {
      const { [field as keyof UpdateVendorPermissionsRequest]: _, ...rest } = formData;
      setFormData(rest);
    } else {
      setFormData(prev => ({ ...prev, [field]: value === "true" }));
    }
  };

  const renderSelectField = (
    label: string,
    field: string,
    description: string
  ) => (
    <div className="space-y-2">
      <Label htmlFor={field}>{label}</Label>
      <Select
        value={formData[field as keyof UpdateVendorPermissionsRequest]?.toString() || "no-change"}
        onValueChange={(value) => handleSelectChange(field, value)}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="no-change">No Change</SelectItem>
          <SelectItem value="true">Enable</SelectItem>
          <SelectItem value="false">Disable</SelectItem>
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );

  const renderNumberField = (
    label: string,
    field: string,
    description: string,
    min?: number,
    max?: number
  ) => (
    <div className="space-y-2">
      <Label htmlFor={field}>{label}</Label>
      <Input
        id={field}
        type="number"
        min={min}
        max={max}
        placeholder="Leave empty for no change"
        value={formData[field as keyof UpdateVendorPermissionsRequest] as number || ""}
        onChange={(e) => handleNumberChange(field, e.target.value)}
      />
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bulk Edit Permissions</DialogTitle>
          <DialogDescription>
            Update permissions for {vendorCount} selected vendors
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Offer Type Permissions */}
            <div className="space-y-4">
              <h3 className="font-medium">Offer Type Permissions</h3>
              
              {renderSelectField(
                "Regular Discounts",
                "canCreateRegular",
                "Allow vendors to create regular discounts"
              )}
              
              {renderSelectField(
                "Voucher Codes",
                "canCreateVoucher",
                "Allow vendors to create voucher codes"
              )}
              
              {renderSelectField(
                "Countdown Deals",
                "canCreateCountdown",
                "Allow vendors to create countdown deals"
              )}
              
              {renderSelectField(
                "Flash Sales",
                "canCreateFlashSale",
                "Allow vendors to create flash sales"
              )}
            </div>

            {/* Limits & Restrictions */}
            <div className="space-y-4">
              <h3 className="font-medium">Limits & Restrictions</h3>
              
              {renderNumberField(
                "Max Discount Percentage",
                "maxDiscountPercent",
                "Maximum discount percentage (0-100)",
                0,
                100
              )}
              
              {renderNumberField(
                "Max Discount Amount",
                "maxDiscountAmount",
                "Maximum discount amount in rupees",
                0
              )}
              
              {renderNumberField(
                "Max Active Offers",
                "maxActiveOffers",
                "Maximum active offers allowed",
                0
              )}
              
              {renderSelectField(
                "Requires Approval",
                "requiresApproval",
                "Manual approval required for new offers"
              )}
            </div>
          </div>

          {/* Selected Vendors Info */}
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-sm text-blue-900 dark:text-blue-100">
                  Selected Vendors
                </h4>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  This action will affect {vendorCount} vendor{vendorCount !== 1 ? 's' : ''}
                </p>
              </div>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                {vendorCount} selected
              </Badge>
            </div>
          </div>

          {/* Bulk Update Notes */}
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-medium text-sm mb-2">Bulk Update Notes:</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• "No Change" will preserve existing values for each vendor</li>
              <li>• Empty number fields will not update existing limits</li>
              <li>• Changes will be applied to all selected vendors</li>
              <li>• Individual vendor settings that differ from bulk changes will be overwritten</li>
            </ul>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Apply to {vendorCount} Vendors</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}