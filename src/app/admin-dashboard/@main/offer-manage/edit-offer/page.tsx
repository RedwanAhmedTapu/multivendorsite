'use client';

import React, { use } from 'react';
import { EditOfferPage } from '@/components/admin/offers/edit-offer-dialog';
import { useGetOfferByIdQuery } from '@/features/offerApi';

// Next.js 15+ - params is now a Promise
export default function EditOfferRoute({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  // Unwrap the Promise using React's use() hook
  const { id } = use(params);
  
  const { data: apiResponse, isLoading, error } = useGetOfferByIdQuery(id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading offer...</p>
        </div>
      </div>
    );
  }

  if (error || !apiResponse?.data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600">Offer not found</h2>
          <p className="mt-2 text-gray-600">The requested offer could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <EditOfferPage
      offer={apiResponse.data}
      onSuccess={() => {
        console.log('Offer updated successfully');
      }}
    />
  );
}
