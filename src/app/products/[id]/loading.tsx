// app/products/[id]/loading.tsx
const Skeleton = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
);

export default function Loading() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <Skeleton className="h-4 w-72 my-3" />
      </div>

      <section className="max-w-7xl mx-auto px-4 pb-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <Skeleton className="w-full aspect-square md:h-[420px] md:aspect-auto rounded-lg" />
          <div className="flex gap-2 mt-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="w-14 h-14 rounded-md flex-shrink-0" />
            ))}
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          <div className="pb-3 space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-6 w-4/5" />
            <Skeleton className="h-4 w-40" />
          </div>
          <div className="py-3"><Skeleton className="h-4 w-48" /></div>
          <div className="py-3"><Skeleton className="h-12 w-full rounded-lg" /></div>
          <div className="py-3"><Skeleton className="h-8 w-40" /></div>
          <div className="py-3"><Skeleton className="h-6 w-56" /></div>
          <div className="py-3 flex gap-2">
            <Skeleton className="h-14 w-14 rounded" />
            <Skeleton className="h-14 w-14 rounded" />
          </div>
          <div className="py-3"><Skeleton className="h-10 w-32 rounded-lg" /></div>
          <div className="py-3 flex gap-3">
            <Skeleton className="h-11 flex-1 rounded-lg" />
            <Skeleton className="h-11 flex-1 rounded-lg" />
          </div>
          <div className="py-3"><Skeleton className="h-24 w-full rounded-lg" /></div>
          <div className="py-3"><Skeleton className="h-20 w-full rounded-lg" /></div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 pb-8">
        <div className="flex gap-6 mb-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-8 w-24" />)}
        </div>
        <Skeleton className="h-40 w-full rounded-lg" />
      </section>

      <section className="max-w-7xl mx-auto px-4 pb-12">
        <Skeleton className="h-6 w-40 mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="w-full aspect-square rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}