// app/admin-dashboard/offer-manage/edit-offer/[id]/page.tsx
"use client";

import { useGetOfferByIdQuery } from "@/features/offerApi";
import { use } from "react";
import { EditOfferPage } from "@/components/admin/offers/edit-offer-dialog";
import { PageSkeleton, Sk } from "@/components/admin/ui/AdminSkeletons";

interface EditOfferRouteProps {
  params: Promise<{
    id: string;
  }>;
}

function LoadingState() {
  return (
    <PageSkeleton>
      <div className="flex items-center gap-4">
        <Sk className="h-10 w-24 rounded-lg" />
        <div className="space-y-2">
          <Sk className="h-8 w-64 max-w-full" />
          <Sk soft className="h-4 w-96 max-w-full" />
        </div>
      </div>

      {/* Progress steps */}
      <div className="mx-auto flex max-w-2xl items-center justify-between">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center">
            <Sk className="h-8 w-8 rounded-full" />
            {i < 3 && <Sk soft className="mx-4 h-0.5 w-16" />}
          </div>
        ))}
      </div>

      <div className="mx-auto max-w-2xl">
        <Sk className="h-12 w-full rounded-xl" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
            <Sk className="h-4 w-40" />
            <Sk soft className="h-40 w-full rounded-lg" />
          </div>
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
            <Sk className="h-4 w-32" />
            <Sk soft className="h-28 w-full rounded-lg" />
          </div>
        </div>
        <div className="space-y-6">
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
            <Sk className="h-4 w-24" />
            <Sk soft className="h-16 w-full rounded-lg" />
          </div>
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
            <Sk className="h-4 w-24" />
            <Sk soft className="h-28 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </PageSkeleton>
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