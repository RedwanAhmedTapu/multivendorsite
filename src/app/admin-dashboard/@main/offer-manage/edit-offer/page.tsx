'use client';

import React, { use } from 'react';
import { EditOfferPage } from '@/components/admin/offers/edit-offer-dialog';
import { useGetOfferByIdQuery } from '@/features/offerApi';
import { FormSkeleton, HeaderSkeleton, PageSkeleton } from '@/components/admin/ui/AdminSkeletons';

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
      <PageSkeleton>
        <HeaderSkeleton actions={2} />
        <FormSkeleton sections={2} fields={4} />
        <FormSkeleton sections={1} fields={3} footer={false} />
      </PageSkeleton>
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
