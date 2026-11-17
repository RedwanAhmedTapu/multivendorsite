// Route-level fallback for every admin-dashboard page: sidebar stays mounted,
// the content column shows the shared admin skeleton until data is ready.
import { AdminPageSkeleton } from "@/components/admin/ui/AdminSkeletons";

export default function Loading() {
  return <AdminPageSkeleton />;
}
