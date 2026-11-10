"use client";

// /admin-dashboard/themes/[id] — palette detail, editor and version history
// (Part 3).
//
// The palette endpoints sit behind requirePermission('themeManagement') on
// the backend (the real security boundary); this page mirrors that gate so
// staff without the grant get a clear message instead of a failed request.
import { use } from "react";
import { ShieldAlert } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import { PaletteEditor } from "@/components/admin/theme-palettes/PaletteEditor";

export default function ThemePaletteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { me, isLoading, can } = usePermissions();

  if (isLoading) return <div className="p-8 text-sm text-gray-500">Loading…</div>;
  if (!me || !can("themeManagement")) {
    return (
      <div className="m-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-6">
        <ShieldAlert className="h-5 w-5 shrink-0 text-red-600" aria-hidden="true" />
        <div>
          <p className="font-semibold text-red-700">Access denied</p>
          <p className="mt-1 text-sm text-red-600">
            You need the theme management permission to manage theme palettes. Ask the platform administrator to grant it.
          </p>
        </div>
      </div>
    );
  }
  return <PaletteEditor mode="edit" paletteId={id} />;
}
