// components/vendor-management/VendorManagementTabs.tsx
'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import VendorList from './VendorList';
import VendorPayoutCommission from './VendorPayoutCommission';
import BulkCommissionManager from './BulkCommissionModal';

interface VendorManagementTabsProps {
  onManageVendor: (vendorId: string) => void;
}

export default function VendorManagementTabs({ onManageVendor }: VendorManagementTabsProps) {
  const [activeTab, setActiveTab] = useState('vendors');

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="vendors">Vendor List</TabsTrigger>
        <TabsTrigger value="bulk">Bulk Commission</TabsTrigger>
        <TabsTrigger value="payouts">Payouts & Commissions</TabsTrigger>
      </TabsList>

      <TabsContent value="vendors" className="space-y-4">
        <VendorList onManageVendor={onManageVendor} />
      </TabsContent>

      <TabsContent value="bulk" className="space-y-4">
        <BulkCommissionManager />
      </TabsContent>

      <TabsContent value="payouts" className="space-y-4">
        <VendorPayoutCommission />
      </TabsContent>
    </Tabs>
  );
}