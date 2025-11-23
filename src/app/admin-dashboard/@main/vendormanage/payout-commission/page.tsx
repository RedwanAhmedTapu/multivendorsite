// app/vendor-management/page.tsx (main page)
'use client';

import { useState } from 'react';
import VendorManagementTabs from '@/components/vendor-management/VendorManagementTabs';
import VendorPayoutCommissionManager from '@/components/vendor-management/VendorPayoutCommissionManager';

export default function VendorManagementPage() {
  const [currentView, setCurrentView] = useState<'list' | 'manage'>();
  const [selectedVendorId, setSelectedVendorId] = useState<string>();

  const handleManageVendor = (vendorId: string) => {
    setSelectedVendorId(vendorId);
    setCurrentView('manage');
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedVendorId(undefined);
  };

  if (currentView === 'manage' && selectedVendorId) {
    return (
      <VendorPayoutCommissionManager
        vendorId={selectedVendorId}
        onBackToList={handleBackToList}
      />
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Vendor Management</h1>
        <p className="text-muted-foreground">
          Manage vendors, commissions, payouts, and bulk operations
        </p>
      </div>

      <VendorManagementTabs onManageVendor={handleManageVendor} />
    </div>
  );
}