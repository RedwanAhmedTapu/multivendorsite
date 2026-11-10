"use client";

// /admin-dashboard/theme-manage/product-card — global product card design.
//
// The admin dashboard layout also admits the admin's EMPLOYEEs, but the
// product card endpoints are ADMIN-only on the backend (the real security
// boundary). This page checks the role too, so non-admins get a clear
// "access denied" and the editor never requests the draft for them.
import { ShieldAlert } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import { ProductCardEditor } from "@/components/admin/product-card-editor/ProductCardEditor";

export default function ProductCardDesignPage() {
  const { me, role, isLoading } = usePermissions();

  if (isLoading) return <div className="p-8 text-sm text-gray-500">Loading…</div>;
  if (!me || role !== "ADMIN") {
    return (
      <div className="m-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-6">
        <ShieldAlert className="h-5 w-5 shrink-0 text-red-600" aria-hidden="true" />
        <div>
          <p className="font-semibold text-red-700">Access denied</p>
          <p className="mt-1 text-sm text-red-600">Only the platform administrator can change the product card design.</p>
        </div>
      </div>
    );
  }
  return <ProductCardEditor />;
}
