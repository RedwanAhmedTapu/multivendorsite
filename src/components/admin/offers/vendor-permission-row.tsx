// components/admin/vendors/vendor-permission-row.tsx
"use client";

import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, RotateCcw, Eye, Mail, Settings } from "lucide-react";
import type { VendorWithPermissions } from "@/features/offerApi";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface VendorPermissionRowProps {
  permission: VendorWithPermissions;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onReset: () => void;
}

export function VendorPermissionRow({ 
  permission, 
  isSelected, 
  onSelect, 
  onEdit, 
  onReset 
}: VendorPermissionRowProps) {
  const vendor = permission.vendor;
  const user = vendor?.user;
  
  const getPermissionStatus = () => {
    const permissions = [
      permission.canCreateRegular,
      permission.canCreateVoucher,
      permission.canCreateCountdown,
      permission.canCreateFlashSale,
    ];
    
    const enabledCount = permissions.filter(Boolean).length;
    
    if (enabledCount === 0) return { text: "No Permissions", variant: "outline" as const };
    if (enabledCount === 1) return { text: "Limited", variant: "secondary" as const };
    if (enabledCount === 2) return { text: "Moderate", variant: "default" as const };
    if (enabledCount === 3) return { text: "Good", variant: "default" as const };
    return { text: "Full Access", variant: "default" as const };
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const permissionStatus = getPermissionStatus();

  return (
    <TableRow className={isSelected ? "bg-muted/50" : ""}>
      <TableCell>
        <input
          type="checkbox"
          className="rounded border-gray-300"
          checked={isSelected}
          onChange={onSelect}
        />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.avatar} />
            <AvatarFallback className="text-xs">
              {user?.name ? getInitials(user.name) : "V"}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">
                {vendor?.storeName || user?.name || "N/A"}
              </span>
              {vendor?.storeName && user?.name && (
                <span className="text-xs text-muted-foreground">by {user.name}</span>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Mail className="h-3 w-3" />
              {user?.email || "No email"}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              ID: {permission.vendorId.slice(0, 8)}...
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col items-start gap-1">
          <Badge variant="outline" className="text-xs">
            {vendor?._count?.offers || 0} active
          </Badge>
          <div className="text-xs text-muted-foreground">
            Max: {permission.maxActiveOffers}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1">
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
          </div>
          <Badge variant={permissionStatus.variant} className="text-xs">
            {permissionStatus.text}
          </Badge>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col text-sm space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-xs">Max %:</span>
            <Badge variant="outline" className="text-xs">
              {permission.maxDiscountPercent}%
            </Badge>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-xs">Max Amount:</span>
            <Badge variant="outline" className="text-xs">
              ₹{permission.maxDiscountAmount}
            </Badge>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge
          variant={permission.requiresApproval ? "destructive" : "default"}
          className={
            permission.requiresApproval 
              ? "bg-orange-100 text-orange-800 hover:bg-orange-100" 
              : "bg-green-100 text-green-800 hover:bg-green-100"
          }
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
              <Settings className="w-4 h-4 mr-2" />
              Edit Permissions
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              <Eye className="w-4 h-4 mr-2" />
              View Vendor Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              <Mail className="w-4 h-4 mr-2" />
              Contact Vendor
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