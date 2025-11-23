// components/admin/employees/employee-permissions-dialog.tsx
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useUpdateEmployeePermissionsMutation } from '@/features/employeeApi';
import type { Employee } from '@/features/employeeApi';
import { toast } from 'sonner';

interface EmployeePermissionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee | null;
}

interface PermissionsState {
  productManagement: boolean;
  orderManagement: boolean;
  customerSupport: boolean;
  analytics: boolean;
  offerManagement: boolean;
  inventoryManagement: boolean;
}

export function EmployeePermissionsDialog({
  open,
  onOpenChange,
  employee,
}: EmployeePermissionsDialogProps) {
  const [updatePermissions, { isLoading }] = useUpdateEmployeePermissionsMutation();
  
  const [permissions, setPermissions] = useState<PermissionsState>({
    productManagement: false,
    orderManagement: false,
    customerSupport: false,
    analytics: false,
    offerManagement: false,
    inventoryManagement: false,
  });

  // Initialize permissions when employee changes
  useState(() => {
    if (employee) {
      setPermissions(employee.permissions || {
        productManagement: false,
        orderManagement: false,
        customerSupport: false,
        analytics: false,
        offerManagement: false,
        inventoryManagement: false,
      });
    }
  });

  const handlePermissionChange = (permission: keyof PermissionsState, checked: boolean) => {
    setPermissions(prev => ({
      ...prev,
      [permission]: checked,
    }));
  };

  const handleSave = async () => {
    if (!employee) return;

    try {
      await updatePermissions({
        employeeId: employee.id,
        data: { permissions },
      }).unwrap();
      toast.success('Permissions updated successfully');
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to update permissions');
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && employee) {
      // Reset to original permissions when closing without saving
      setPermissions(employee.permissions || {
        productManagement: false,
        orderManagement: false,
        customerSupport: false,
        analytics: false,
        offerManagement: false,
        inventoryManagement: false,
      });
    }
    onOpenChange(open);
  };

  if (!employee) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Permissions</DialogTitle>
          <DialogDescription>
            Set permissions for {employee.user?.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="productManagement"
                checked={permissions.productManagement}
                onCheckedChange={(checked) => 
                  handlePermissionChange('productManagement', checked as boolean)
                }
              />
              <Label htmlFor="productManagement">Product Management</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="orderManagement"
                checked={permissions.orderManagement}
                onCheckedChange={(checked) => 
                  handlePermissionChange('orderManagement', checked as boolean)
                }
              />
              <Label htmlFor="orderManagement">Order Management</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="customerSupport"
                checked={permissions.customerSupport}
                onCheckedChange={(checked) => 
                  handlePermissionChange('customerSupport', checked as boolean)
                }
              />
              <Label htmlFor="customerSupport">Customer Support</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="analytics"
                checked={permissions.analytics}
                onCheckedChange={(checked) => 
                  handlePermissionChange('analytics', checked as boolean)
                }
              />
              <Label htmlFor="analytics">Analytics</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="offerManagement"
                checked={permissions.offerManagement}
                onCheckedChange={(checked) => 
                  handlePermissionChange('offerManagement', checked as boolean)
                }
              />
              <Label htmlFor="offerManagement">Offer Management</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="inventoryManagement"
                checked={permissions.inventoryManagement}
                onCheckedChange={(checked) => 
                  handlePermissionChange('inventoryManagement', checked as boolean)
                }
              />
              <Label htmlFor="inventoryManagement">Inventory Management</Label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Permissions'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}