// components/vendor/offers/vendor-offers-header.tsx
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Ticket, AlertCircle } from "lucide-react";
import type { VendorPermissions } from "@/features/offerApi";

interface VendorOffersHeaderProps {
  onCreateOffer: () => void;
  onCreateVoucher: () => void;
  permissions?: VendorPermissions;
}

export function VendorOffersHeader({ 
  onCreateOffer, 
  onCreateVoucher, 
  permissions 
}: VendorOffersHeaderProps) {
  // Comprehensive debugging
  console.log('=== VENDOR OFFERS HEADER DEBUG ===');
  console.log('Permissions prop:', permissions);
  console.log('Type of permissions:', typeof permissions);
  console.log('Is permissions null?', permissions === null);
  console.log('Is permissions undefined?', permissions === undefined);
  
  if (permissions) {
    console.log('Permissions object keys:', Object.keys(permissions));
    console.log('canCreateRegular:', permissions.canCreateRegular);
    console.log('canCreateVoucher:', permissions.canCreateVoucher);
    console.log('requiresApproval:', permissions.requiresApproval);
  } else {
    console.log('No permissions object received');
  }

  const canCreateOffer = permissions?.canCreateRegular ?? true;
  const canCreateVoucher = permissions?.canCreateVoucher ?? true;

  console.log('Final decision - canCreateOffer:', canCreateOffer, 'canCreateVoucher:', canCreateVoucher);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Offer Management</h1>
          <p className="text-muted-foreground">
            Create and manage your promotional offers and vouchers
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Create Voucher Button */}
          {canCreateVoucher && (
            <Button variant="outline" onClick={onCreateVoucher}>
              <Ticket className="w-4 h-4 mr-2" />
              Create Voucher
            </Button>
          )}
          
          {/* Create Offer Button */}
          {canCreateOffer && (
            <Button onClick={onCreateOffer}>
              <Plus className="w-4 h-4 mr-2" />
              Create Offer
            </Button>
          )}
          
          {/* Debug badge */}
          <Badge variant="outline" className="ml-2">
            Perms: {permissions ? 'Yes' : 'No'}
          </Badge>
        </div>
      </div>

      {/* Debug information */}
      {!permissions && (
        <div className="flex items-center gap-2 p-3 border border-red-200 bg-red-50 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <div className="text-sm text-red-800">
            <strong>Debug:</strong> No permissions object received. Check parent component.
          </div>
        </div>
      )}

      {permissions?.requiresApproval && (
        <div className="flex items-center gap-2 p-3 border border-amber-200 bg-amber-50 rounded-lg">
          <AlertCircle className="w-4 h-4 text-amber-600" />
          <div className="text-sm text-amber-800">
            <strong>Approval Required:</strong> All new offers require admin approval before becoming active.
          </div>
        </div>
      )}
    </div>
  );
}