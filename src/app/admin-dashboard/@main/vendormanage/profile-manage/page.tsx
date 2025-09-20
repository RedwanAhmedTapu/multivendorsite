// app/vendors/page.tsx
'use client';

import { useState } from 'react';
import VendorList from '@/components/vendor-management/VendorList';
import VendorProfileManager from '@/components/vendor-management/VendorProfileManager';
import { Toaster } from 'sonner';

export default function VendorsPage() {
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);

  const handleManageVendor = (vendorId: string) => {
    setSelectedVendorId(vendorId);
  };

  const handleBackToList = () => {
    setSelectedVendorId(null);
  };

  return (
    <div className="container mx-auto py-6">
      <Toaster position="top-right" />
      
      {selectedVendorId ? (
        <VendorProfileManager
          vendorId={selectedVendorId}
          onBackToList={handleBackToList}
        />
      ) : (
        <VendorList onManageVendor={handleManageVendor} />
      )}
    </div>
  );
}