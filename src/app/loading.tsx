// app/loading.tsx
const Pulse = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
);

const CircleSkeleton = () => (
  <div className="flex flex-col items-center text-center min-w-max">
    <Pulse className="w-16 h-16 md:w-20 md:h-20 rounded-full" />
    <Pulse className="mt-2 w-16 h-4" />
  </div>
);

const ProductCardSkeleton = () => (
  <div className="space-y-2 border border-gray-100 rounded-lg p-3">
    <Pulse className="w-full aspect-square rounded-lg" />
    <Pulse className="h-4 w-3/4" />
    <Pulse className="h-4 w-1/2" />
  </div>
);

export default function Loading() {
  return (
    <main className="min-h-screen">
      {/* Top nav placeholder — covers layout_2 / layout_3's category bar.
          Harmless thin flash even on layout_1 which has no top nav. */}
      <div className="w-full border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-6 py-4">
          {[...Array(7)].map((_, i) => (
            <Pulse key={i} className="h-4 w-20 flex-shrink-0" />
          ))}
        </div>
      </div>

      {/* Hero slider + download app */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 sm:gap-4">
          <Pulse className="lg:col-span-3 rounded-sm aspect-video w-full max-h-[50vh]" />
          <Pulse className="rounded-sm h-full min-h-[200px]" />
        </div>
      </div>

      {/* Benefits strip */}
      <div className="max-w-7xl mx-auto px-4 py-2">
        <div className="grid grid-cols-3 2xl:grid-cols-6 gap-2 py-4 bg-teal-50 rounded-sm px-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="hidden md:flex items-start gap-2 p-1.5">
              <Pulse className="w-8 h-8 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Pulse className="h-3 w-3/4" />
                <Pulse className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Category section */}
      <div className="max-w-7xl mx-auto px-4 py-2">
        <div className="bg-teal-50 rounded-sm px-3 py-1">
          <div className="flex items-center justify-between px-2 py-1.5">
            <Pulse className="h-6 w-32" />
            <Pulse className="h-4 w-14" />
          </div>
          <div className="flex gap-6 py-2 px-1.5 overflow-hidden">
            {[...Array(8)].map((_, i) => (
              <CircleSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>

      {/* Product grid */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Pulse className="h-6 w-48 mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </main>
  );
}