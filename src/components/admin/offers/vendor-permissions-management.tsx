// components/admin/vendors/vendor-permissions-management.tsx
"use client";

import { useState, useEffect } from "react";
import {
  useGetAllVendorPermissionsQuery,
  useUpdateVendorPermissionsMutation,
  useBulkUpdateVendorPermissionsMutation,
  useGetVendorPermissionStatsQuery,
  useResetVendorPermissionsMutation,
  type VendorWithPermissions,
  type UpdateVendorPermissionsRequest,
} from "@/features/offerApi";
import {
  useGetVendorsQuery,
  type Vendor,
} from "@/features/vendorManageApi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Settings, RefreshCw, RotateCcw, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EditVendorPermissionDialog } from "./edit-vendor-permission-dialog";
import { BulkEditPermissionsDialog } from "./bulk-edit-permissions-dialog";

export function VendorPermissionsManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVendor, setSelectedVendor] = useState<VendorWithPermissions | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isBulkEditDialogOpen, setIsBulkEditDialogOpen] = useState(false);
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);

  // Vendor Management API hooks
  const { data: vendorsData, isLoading: vendorsLoading } = useGetVendorsQuery({
    page: 1,
    limit: 100,
    status: "ACTIVE",
  });

  // Permissions API hooks
  const { data: permissionsData, isLoading: permissionsLoading, refetch } = useGetAllVendorPermissionsQuery({});
  const { data: statsData } = useGetVendorPermissionStatsQuery();
  const [updatePermissions] = useUpdateVendorPermissionsMutation();
  const [bulkUpdatePermissions] = useBulkUpdateVendorPermissionsMutation();
  const [resetPermissions] = useResetVendorPermissionsMutation();

  const vendors = vendorsData?.data || [];
  const permissions = permissionsData?.data || [];
  const stats = statsData?.data;

  // Combine vendor data with permissions data - properly typed to match VendorWithPermissions
  const combinedVendors: VendorWithPermissions[] = vendors.map(vendor => {
    const vendorPermission = permissions.find(p => p.vendorId === vendor.id);
    
    return {
      vendorId: vendor.id,
      vendor: {
        id: vendor.id,
        user: {
          id: vendor.user?.id || '',
          name: vendor.storeName || 'Unknown',
          email: vendor.user?.email || '',
        },
        storeName: vendor.storeName,
        _count: {
          offers: typeof vendor._count?.offers === "number" ? vendor._count.offers : 0,
        }
      },
      // Map all permission fields from API response
      id: vendorPermission?.id || '',
      canCreateRegular: vendorPermission?.canCreateRegular ?? false,
      canCreateVoucher: vendorPermission?.canCreateVoucher ?? false,
      canCreateCountdown: vendorPermission?.canCreateCountdown ?? false,
      canCreateFlashSale: vendorPermission?.canCreateFlashSale ?? false,
      canCreateBuyXGetY: vendorPermission?.canCreateBuyXGetY ?? false,
      canCreateFreeShipping: vendorPermission?.canCreateFreeShipping ?? false,
      canCreateBundleDeal: vendorPermission?.canCreateBundleDeal ?? false,
      canCreateSeasonalSale: vendorPermission?.canCreateSeasonalSale ?? false,
      canCreateLoyaltyReward: vendorPermission?.canCreateLoyaltyReward ?? false,
      canCreateReferralBonus: vendorPermission?.canCreateReferralBonus ?? false,
      maxDiscountPercent: vendorPermission?.maxDiscountPercent || 0,
      maxDiscountAmount: vendorPermission?.maxDiscountAmount || 0,
      maxActiveOffers: vendorPermission?.maxActiveOffers || 0,
      maxVouchersPerOffer: vendorPermission?.maxVouchersPerOffer,
      maxFlashSaleDuration: vendorPermission?.maxFlashSaleDuration,
      maxBundleItems: vendorPermission?.maxBundleItems,
      requiresApproval: vendorPermission?.requiresApproval ?? true,
      createdAt: vendorPermission?.createdAt || new Date().toISOString(),
      updatedAt: vendorPermission?.updatedAt || new Date().toISOString(),
    };
  });

  const filteredVendors = combinedVendors.filter(vendor =>
    vendor.vendor?.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.vendor?.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.vendor?.storeName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUpdatePermissions = async (vendorId: string, data: UpdateVendorPermissionsRequest) => {
    try {
      await updatePermissions({ vendorId, data }).unwrap();
      toast.success("Permissions updated successfully");
      setIsEditDialogOpen(false);
      refetch();
    } catch (error) {
      console.error("Failed to update permissions:", error);
      toast.error("Failed to update permissions");
    }
  };

  const handleBulkUpdate = async (data: UpdateVendorPermissionsRequest) => {
    try {
      // FIXED: Spread the permission fields directly per BulkUpdatePermissionsRequest interface
      await bulkUpdatePermissions({ 
        vendorIds: selectedVendors,
        ...data  // Spread permission fields directly into the request
      }).unwrap();
      toast.success(`Permissions updated for ${selectedVendors.length} vendors`);
      setIsBulkEditDialogOpen(false);
      setSelectedVendors([]);
      refetch();
    } catch (error) {
      console.error("Failed to bulk update permissions:", error);
      toast.error("Failed to update permissions");
    }
  };

  const handleResetPermissions = async (vendorId: string) => {
    try {
      await resetPermissions(vendorId).unwrap();
      toast.success("Permissions reset to defaults");
      refetch();
    } catch (error) {
      console.error("Failed to reset permissions:", error);
      toast.error("Failed to reset permissions");
    }
  };

  const toggleVendorSelection = (vendorId: string) => {
    setSelectedVendors(prev =>
      prev.includes(vendorId)
        ? prev.filter(id => id !== vendorId)
        : [...prev, vendorId]
    );
  };

  const selectAllVendors = () => {
    if (selectedVendors.length === filteredVendors.length) {
      setSelectedVendors([]);
    } else {
      setSelectedVendors(filteredVendors.map(v => v.vendorId));
    }
  };

  const isLoading = vendorsLoading || permissionsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Loading vendor permissions...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vendor Permissions</h1>
          <p className="text-muted-foreground">
            Manage vendor permissions for creating offers and discounts
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedVendors.length > 0 && (
            <Button
              variant="outline"
              onClick={() => setIsBulkEditDialogOpen(true)}
            >
              <Settings className="w-4 h-4 mr-2" />
              Bulk Edit ({selectedVendors.length})
            </Button>
          )}
          <Button onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.totalVendors || vendors.length}</div>
              <div className="text-sm text-muted-foreground">Total Vendors</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.vendorsWithPermissions || permissions.length}</div>
              <div className="text-sm text-muted-foreground">With Permissions</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.canCreateFlashSale || 0}</div>
              <div className="text-sm text-muted-foreground">Can Create Flash Sales</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.requiresApproval || 0}</div>
              <div className="text-sm text-muted-foreground">Require Approval</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Permissions Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Vendor Permissions</CardTitle>
              <CardDescription>
                Manage individual vendor permissions and restrictions
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search vendors..."
                  className="pl-8 w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300"
                    checked={selectedVendors.length === filteredVendors.length && filteredVendors.length > 0}
                    onChange={selectAllVendors}
                  />
                </TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Active Offers</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>Discount Limits</TableHead>
                <TableHead>Approval</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVendors.map((vendor) => (
                <VendorPermissionRow
                  key={vendor.vendorId}
                  permission={vendor}
                  isSelected={selectedVendors.includes(vendor.vendorId)}
                  onSelect={() => toggleVendorSelection(vendor.vendorId)}
                  onEdit={() => {
                    setSelectedVendor(vendor);
                    setIsEditDialogOpen(true);
                  }}
                  onReset={() => handleResetPermissions(vendor.vendorId)}
                />
              ))}
            </TableBody>
          </Table>

          {filteredVendors.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? "No vendors match your search" : "No vendors found"}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Permission Dialog */}
      {selectedVendor && (
        <EditVendorPermissionDialog
          permission={selectedVendor}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSave={handleUpdatePermissions}
        />
      )}

      {/* Bulk Edit Dialog */}
      <BulkEditPermissionsDialog
        open={isBulkEditDialogOpen}
        onOpenChange={setIsBulkEditDialogOpen}
        onSave={handleBulkUpdate}
        vendorCount={selectedVendors.length}
      />
    </div>
  );
}

// Vendor Permission Row Component
interface VendorPermissionRowProps {
  permission: VendorWithPermissions;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onReset: () => void;
}

function VendorPermissionRow({ 
  permission, 
  isSelected, 
  onSelect, 
  onEdit, 
  onReset 
}: VendorPermissionRowProps) {
  // FIXED: Add null check for vendor
  const vendor = permission.vendor;
  
  if (!vendor) {
    return null; // Skip rendering if vendor data is missing
  }
  
  const getPermissionStatus = () => {
    const permissions = [
      permission.canCreateRegular,
      permission.canCreateVoucher,
      permission.canCreateCountdown,
      permission.canCreateFlashSale,
      permission.canCreateBuyXGetY,
      permission.canCreateBundleDeal,
      permission.canCreateSeasonalSale,
      permission.canCreateFreeShipping,
      permission.canCreateLoyaltyReward,
      permission.canCreateReferralBonus,
    ];
    
    const enabledCount = permissions.filter(Boolean).length;
    const totalPermissions = permissions.length;
    
    if (enabledCount === 0) return { text: "No Permissions", variant: "outline" as const };
    if (enabledCount <= totalPermissions * 0.3) return { text: "Limited", variant: "secondary" as const };
    if (enabledCount <= totalPermissions * 0.6) return { text: "Moderate", variant: "default" as const };
    if (enabledCount <= totalPermissions * 0.9) return { text: "Good", variant: "default" as const };
    return { text: "Full Access", variant: "default" as const };
  };

  const permissionStatus = getPermissionStatus();
  const activeOffersCount = vendor._count?.offers || 0;

  return (
    <TableRow>
      <TableCell>
        <input
          type="checkbox"
          className="rounded border-gray-300"
          checked={isSelected}
          onChange={onSelect}
        />
      </TableCell>
      <TableCell>
        <div className="flex flex-col">
          <span className="font-medium">{vendor.storeName || "N/A"}</span>
          <span className="text-sm text-muted-foreground">{vendor.user?.email || "N/A"}</span>
          <span className="text-xs text-muted-foreground">ID: {vendor.id}</span>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline">
          {activeOffersCount} active
        </Badge>
      </TableCell>
      <TableCell>
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1 max-w-[200px]">
            {permission.canCreateRegular && (
              <Badge variant="secondary" className="text-xs">
                Regular
              </Badge>
            )}
            {permission.canCreateVoucher && (
              <Badge variant="secondary" className="text-xs">
                Vouchers
              </Badge>
            )}
            {permission.canCreateCountdown && (
              <Badge variant="secondary" className="text-xs">
                Countdown
              </Badge>
            )}
            {permission.canCreateFlashSale && (
              <Badge variant="secondary" className="text-xs">
                Flash Sales
              </Badge>
            )}
            {permission.canCreateBuyXGetY && (
              <Badge variant="secondary" className="text-xs">
                Buy X Get Y
              </Badge>
            )}
            {permission.canCreateBundleDeal && (
              <Badge variant="secondary" className="text-xs">
                Bundle
              </Badge>
            )}
            {permission.canCreateSeasonalSale && (
              <Badge variant="secondary" className="text-xs">
                Seasonal
              </Badge>
            )}
            {/* Show +X more if there are more permissions */}
            {(permission.canCreateFreeShipping || permission.canCreateLoyaltyReward || permission.canCreateReferralBonus) && (
              <Badge variant="outline" className="text-xs">
                +3 more
              </Badge>
            )}
          </div>
          <Badge variant={permissionStatus.variant} className="text-xs">
            {permissionStatus.text}
          </Badge>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col text-sm space-y-1">
          <div className="flex items-center gap-1">
            <span className="font-medium">Max %:</span>
            <span>{permission.maxDiscountPercent}%</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-medium">Max ₹:</span>
            <span>₹{permission.maxDiscountAmount}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-medium">Active:</span>
            <span>{permission.maxActiveOffers}</span>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge
          variant={permission.requiresApproval ? "destructive" : "default"}
          className={permission.requiresApproval ? "bg-orange-100 text-orange-800 hover:bg-orange-100" : "bg-green-100 text-green-800 hover:bg-green-100"}
        >
          {permission.requiresApproval ? "Approval Required" : "Auto-Approved"}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit} className="cursor-pointer">
              <span>Edit Permissions</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={onReset} 
              className="cursor-pointer text-orange-600 focus:text-orange-600"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset to Defaults
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}