// app/products/loading.tsx
import { ProductsPageSkeleton } from "@/components/skeletons/ProductPageSkeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <ProductsPageSkeleton />
    </div>
  );
}