// app/admin-dashboard/offer-manage/edit-offer/[id]/page.tsx
"use client";

import { useGetOfferByIdQuery } from "@/features/offerApi";
import { use } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { EditOfferPage } from "@/components/admin/offers/edit-offer-dialog";

interface EditOfferRouteProps {
  params: Promise<{
    id: string;
  }>;
}

function LoadingState() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-24" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
      </div>
      
      {/* Progress Steps Skeleton */}
      <div className="flex items-center justify-between max-w-2xl mx-auto">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center">
            <Skeleton className="h-8 w-8 rounded-full" />
            {i < 3 && <Skeleton className="w-16 h-0.5 mx-4" />}
          </div>
        ))}
      </div>

      {/* Tabs Skeleton */}
      <div className="max-w-2xl mx-auto">
        <Skeleton className="h-12 w-full" />
      </div>

      {/* Content Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-64 w-full rounded-lg" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center min-h-64">
      <div className="text-center">
        <div className="text-destructive text-lg font-semibold">Offer not found</div>
        <p className="text-muted-foreground mt-2">
          {message}
        </p>
      </div>
    </div>
  );
}

export default function EditOfferRoute({ params }: EditOfferRouteProps) {
  // Use React.use() to unwrap the params promise in a client component
  const { id } = use(params);
  
  // Now we can use the React hook
  const { data: offer, isLoading, error } = useGetOfferByIdQuery(id);

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    const errorMessage = 
      (error as any)?.data?.message || 
      'The offer you\'re trying to edit doesn\'t exist or you don\'t have permission to access it.';
    
    return <ErrorState message={errorMessage} />;
  }

  if (!offer?.data) {
    return <ErrorState message="The offer you're trying to edit doesn't exist." />;
  }

  return <EditOfferPage offer={offer.data} />;
}