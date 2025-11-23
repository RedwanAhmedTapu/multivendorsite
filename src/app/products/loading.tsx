// app/products/loading.tsx
import FinixmartLoader from "@/components/loader/Loader";

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <FinixmartLoader />
    </div>
  );
}