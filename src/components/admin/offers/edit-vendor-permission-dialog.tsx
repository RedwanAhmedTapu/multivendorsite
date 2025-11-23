// components/admin/vendors/edit-vendor-permission-dialog.tsx
"use client";

import { useState, useEffect } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { VendorWithPermissions, UpdateVendorPermissionsRequest } from "@/features/offerApi";

interface EditVendorPermissionDialogProps {
  permission: VendorWithPermissions;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (vendorId: string, data: UpdateVendorPermissionsRequest) => void;
}

export function EditVendorPermissionDialog({
  permission,
  open,
  onOpenChange,
  onSave,
}: EditVendorPermissionDialogProps) {
  const [formData, setFormData] = useState<UpdateVendorPermissionsRequest>({
    canCreateRegular: permission.canCreateRegular ?? true,
    canCreateVoucher: permission.canCreateVoucher ?? true,
    canCreateCountdown: permission.canCreateCountdown ?? true,
    canCreateFlashSale: permission.canCreateFlashSale ?? false,
    canCreateBuyXGetY: permission.canCreateBuyXGetY ?? false,
    canCreateFreeShipping: permission.canCreateFreeShipping ?? false,
    canCreateBundleDeal: permission.canCreateBundleDeal ?? false,
    canCreateSeasonalSale: permission.canCreateSeasonalSale ?? true,
    canCreateLoyaltyReward: permission.canCreateLoyaltyReward ?? false,
    canCreateReferralBonus: permission.canCreateReferralBonus ?? false,
    maxDiscountPercent: permission.maxDiscountPercent ?? 50,
    maxDiscountAmount: permission.maxDiscountAmount ?? 500,
    maxActiveOffers: permission.maxActiveOffers ?? 10,
    maxVouchersPerOffer: permission.maxVouchersPerOffer,
    maxFlashSaleDuration: permission.maxFlashSaleDuration,
    maxBundleItems: permission.maxBundleItems,
    requiresApproval: permission.requiresApproval ?? true,
  });

  console.log(permission, "permission");

  useEffect(() => {
    if (open) {
      setFormData({
        canCreateRegular: permission.canCreateRegular ?? true,
        canCreateVoucher: permission.canCreateVoucher ?? true,
        canCreateCountdown: permission.canCreateCountdown ?? true,
        canCreateFlashSale: permission.canCreateFlashSale ?? false,
        canCreateBuyXGetY: permission.canCreateBuyXGetY ?? false,
        canCreateFreeShipping: permission.canCreateFreeShipping ?? false,
        canCreateBundleDeal: permission.canCreateBundleDeal ?? false,
        canCreateSeasonalSale: permission.canCreateSeasonalSale ?? true,
        canCreateLoyaltyReward: permission.canCreateLoyaltyReward ?? false,
        canCreateReferralBonus: permission.canCreateReferralBonus ?? false,
        maxDiscountPercent: permission.maxDiscountPercent ?? 50,
        maxDiscountAmount: permission.maxDiscountAmount ?? 500,
        maxActiveOffers: permission.maxActiveOffers ?? 10,
        maxVouchersPerOffer: permission.maxVouchersPerOffer,
        maxFlashSaleDuration: permission.maxFlashSaleDuration,
        maxBundleItems: permission.maxBundleItems,
        requiresApproval: permission.requiresApproval ?? true,
      });
    }
  }, [open, permission]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(permission.vendorId, formData);
  };

  const handleSwitchChange = (field: string, value: boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNumberChange = (field: string, value: string) => {
    setFormData(prev => ({ 
      ...prev, 
      [field]: value === "" ? 0 : Number(value) 
    }));
  };

  const getBadgeVariant = (condition: boolean) => condition ? "default" : "outline";
  const getBadgeText = (condition: boolean) => condition ? "Yes" : "No";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Vendor Permissions</DialogTitle>
          <DialogDescription>
            Configure permissions for {permission.vendor?.user?.name || permission.vendor?.user?.email}
            {permission.vendor?.storeName && (
              <span> - {permission.vendor.storeName}</span>
            )}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="offer-types" className="w-full">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="offer-types">Offer Types</TabsTrigger>
              <TabsTrigger value="limits">Limits & Restrictions</TabsTrigger>
              <TabsTrigger value="advanced">Advanced Settings</TabsTrigger>
            </TabsList>

            {/* Offer Types Tab */}
            <TabsContent value="offer-types" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Offer Type Permissions</CardTitle>
                  <CardDescription>
                    Control which types of offers this vendor can create
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Basic Offers */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-muted-foreground">BASIC OFFERS</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <Label htmlFor="canCreateRegular" className="flex flex-col space-y-1 cursor-pointer">
                          <span className="font-medium">Regular Discounts</span>
                          <span className="text-xs text-muted-foreground">
                            Standard percentage or fixed amount discounts
                          </span>
                        </Label>
                        <Switch
                          id="canCreateRegular"
                          checked={formData.canCreateRegular}
                          onCheckedChange={(value) => handleSwitchChange("canCreateRegular", value)}
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <Label htmlFor="canCreateVoucher" className="flex flex-col space-y-1 cursor-pointer">
                          <span className="font-medium">Voucher Codes</span>
                          <span className="text-xs text-muted-foreground">
                            Discount codes with custom or auto-generated codes
                          </span>
                        </Label>
                        <Switch
                          id="canCreateVoucher"
                          checked={formData.canCreateVoucher}
                          onCheckedChange={(value) => handleSwitchChange("canCreateVoucher", value)}
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Time-Sensitive Offers */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-muted-foreground">TIME-SENSITIVE OFFERS</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <Label htmlFor="canCreateCountdown" className="flex flex-col space-y-1 cursor-pointer">
                          <span className="font-medium">Countdown Deals</span>
                          <span className="text-xs text-muted-foreground">
                            Time-limited deals with countdown timer
                          </span>
                        </Label>
                        <Switch
                          id="canCreateCountdown"
                          checked={formData.canCreateCountdown}
                          onCheckedChange={(value) => handleSwitchChange("canCreateCountdown", value)}
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <Label htmlFor="canCreateFlashSale" className="flex flex-col space-y-1 cursor-pointer">
                          <span className="font-medium">Flash Sales</span>
                          <span className="text-xs text-muted-foreground">
                            Short-duration, high-discount sales events
                          </span>
                        </Label>
                        <Switch
                          id="canCreateFlashSale"
                          checked={formData.canCreateFlashSale}
                          onCheckedChange={(value) => handleSwitchChange("canCreateFlashSale", value)}
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Advanced Offers */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-muted-foreground">ADVANCED OFFERS</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <Label htmlFor="canCreateBuyXGetY" className="flex flex-col space-y-1 cursor-pointer">
                          <span className="font-medium">Buy X Get Y</span>
                          <span className="text-xs text-muted-foreground">
                            Purchase quantity-based free item offers
                          </span>
                        </Label>
                        <Switch
                          id="canCreateBuyXGetY"
                          checked={formData.canCreateBuyXGetY}
                          onCheckedChange={(value) => handleSwitchChange("canCreateBuyXGetY", value)}
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <Label htmlFor="canCreateBundleDeal" className="flex flex-col space-y-1 cursor-pointer">
                          <span className="font-medium">Bundle Deals</span>
                          <span className="text-xs text-muted-foreground">
                            Product bundle discounts and packages
                          </span>
                        </Label>
                        <Switch
                          id="canCreateBundleDeal"
                          checked={formData.canCreateBundleDeal}
                          onCheckedChange={(value) => handleSwitchChange("canCreateBundleDeal", value)}
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <Label htmlFor="canCreateFreeShipping" className="flex flex-col space-y-1 cursor-pointer">
                          <span className="font-medium">Free Shipping</span>
                          <span className="text-xs text-muted-foreground">
                            Free shipping on orders above threshold
                          </span>
                        </Label>
                        <Switch
                          id="canCreateFreeShipping"
                          checked={formData.canCreateFreeShipping}
                          onCheckedChange={(value) => handleSwitchChange("canCreateFreeShipping", value)}
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <Label htmlFor="canCreateSeasonalSale" className="flex flex-col space-y-1 cursor-pointer">
                          <span className="font-medium">Seasonal Sales</span>
                          <span className="text-xs text-muted-foreground">
                            Seasonal and holiday promotion offers
                          </span>
                        </Label>
                        <Switch
                          id="canCreateSeasonalSale"
                          checked={formData.canCreateSeasonalSale}
                          onCheckedChange={(value) => handleSwitchChange("canCreateSeasonalSale", value)}
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Loyalty & Referral */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-muted-foreground">LOYALTY & REFERRAL</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <Label htmlFor="canCreateLoyaltyReward" className="flex flex-col space-y-1 cursor-pointer">
                          <span className="font-medium">Loyalty Rewards</span>
                          <span className="text-xs text-muted-foreground">
                            Points-based rewards for loyal customers
                          </span>
                        </Label>
                        <Switch
                          id="canCreateLoyaltyReward"
                          checked={formData.canCreateLoyaltyReward}
                          onCheckedChange={(value) => handleSwitchChange("canCreateLoyaltyReward", value)}
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <Label htmlFor="canCreateReferralBonus" className="flex flex-col space-y-1 cursor-pointer">
                          <span className="font-medium">Referral Bonus</span>
                          <span className="text-xs text-muted-foreground">
                            Referral program bonuses and discounts
                          </span>
                        </Label>
                        <Switch
                          id="canCreateReferralBonus"
                          checked={formData.canCreateReferralBonus}
                          onCheckedChange={(value) => handleSwitchChange("canCreateReferralBonus", value)}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Limits & Restrictions Tab */}
            <TabsContent value="limits" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Global Limits</CardTitle>
                  <CardDescription>
                    Set overall limits that apply to all offer types
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="maxDiscountPercent">Maximum Discount Percentage</Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          id="maxDiscountPercent"
                          type="number"
                          min="0"
                          max="100"
                          value={formData.maxDiscountPercent}
                          onChange={(e) => handleNumberChange("maxDiscountPercent", e.target.value)}
                        />
                        <span className="text-sm text-muted-foreground">%</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Maximum discount percentage allowed (0-100%)
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="maxDiscountAmount">Maximum Discount Amount</Label>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-muted-foreground">₹</span>
                        <Input
                          id="maxDiscountAmount"
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.maxDiscountAmount}
                          onChange={(e) => handleNumberChange("maxDiscountAmount", e.target.value)}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Maximum discount amount in rupees
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="maxActiveOffers">Maximum Active Offers</Label>
                      <Input
                        id="maxActiveOffers"
                        type="number"
                        min="0"
                        value={formData.maxActiveOffers}
                        onChange={(e) => handleNumberChange("maxActiveOffers", e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Maximum number of active offers allowed simultaneously
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="maxVouchersPerOffer">Max Vouchers Per Offer</Label>
                      <Input
                        id="maxVouchersPerOffer"
                        type="number"
                        min="0"
                        value={formData.maxVouchersPerOffer || ""}
                        onChange={(e) => handleNumberChange("maxVouchersPerOffer", e.target.value)}
                        placeholder="Unlimited"
                      />
                      <p className="text-xs text-muted-foreground">
                        Maximum voucher codes per offer (leave empty for unlimited)
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Advanced Settings Tab */}
            <TabsContent value="advanced" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Advanced Settings</CardTitle>
                  <CardDescription>
                    Type-specific limits and approval settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Type-Specific Limits */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Type-Specific Limits</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="maxFlashSaleDuration">Max Flash Sale Duration (hours)</Label>
                        <Input
                          id="maxFlashSaleDuration"
                          type="number"
                          min="1"
                          max="168"
                          value={formData.maxFlashSaleDuration || ""}
                          onChange={(e) => handleNumberChange("maxFlashSaleDuration", e.target.value)}
                          placeholder="24"
                        />
                        <p className="text-xs text-muted-foreground">
                          Maximum duration for flash sales (1-168 hours)
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="maxBundleItems">Max Bundle Items</Label>
                        <Input
                          id="maxBundleItems"
                          type="number"
                          min="2"
                          max="20"
                          value={formData.maxBundleItems || ""}
                          onChange={(e) => handleNumberChange("maxBundleItems", e.target.value)}
                          placeholder="5"
                        />
                        <p className="text-xs text-muted-foreground">
                          Maximum products in a bundle deal (2-20 items)
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Approval Settings */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <Label htmlFor="requiresApproval" className="text-base cursor-pointer">
                          Requires Manual Approval
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          All new offers must be approved by admin before going live
                        </p>
                      </div>
                      <Switch
                        id="requiresApproval"
                        checked={formData.requiresApproval}
                        onCheckedChange={(value) => handleSwitchChange("requiresApproval", value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Current Status Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Current Permission Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Badge variant={getBadgeVariant(permission.canCreateRegular)}>
                  Regular: {getBadgeText(permission.canCreateRegular)}
                </Badge>
                <Badge variant={getBadgeVariant(permission.canCreateVoucher)}>
                  Vouchers: {getBadgeText(permission.canCreateVoucher)}
                </Badge>
                <Badge variant={getBadgeVariant(permission.canCreateCountdown)}>
                  Countdown: {getBadgeText(permission.canCreateCountdown)}
                </Badge>
                <Badge variant={getBadgeVariant(permission.canCreateFlashSale)}>
                  Flash Sales: {getBadgeText(permission.canCreateFlashSale)}
                </Badge>
                <Badge variant={getBadgeVariant(permission.canCreateBuyXGetY ?? false)}>
                  Buy X Get Y: {getBadgeText(permission.canCreateBuyXGetY ?? false)}
                </Badge>
                <Badge variant={getBadgeVariant(permission.canCreateBundleDeal ?? false)}>
                  Bundle: {getBadgeText(permission.canCreateBundleDeal ?? false)}
                </Badge>
                <Badge variant={getBadgeVariant(permission.canCreateFreeShipping ?? false)}>
                  Free Shipping: {getBadgeText(permission.canCreateFreeShipping ?? false)}
                </Badge>
                <Badge variant={getBadgeVariant(permission.canCreateSeasonalSale ?? true)}>
                  Seasonal: {getBadgeText(permission.canCreateSeasonalSale ?? true)}
                </Badge>
                <Badge variant={getBadgeVariant(permission.canCreateLoyaltyReward ?? false)}>
                  Loyalty: {getBadgeText(permission.canCreateLoyaltyReward ?? false)}
                </Badge>
                <Badge variant={getBadgeVariant(permission.canCreateReferralBonus ?? false)}>
                  Referral: {getBadgeText(permission.canCreateReferralBonus ?? false)}
                </Badge>
                <Badge variant={permission.requiresApproval ? "destructive" : "default"}>
                  Approval: {permission.requiresApproval ? "Required" : "Auto"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}