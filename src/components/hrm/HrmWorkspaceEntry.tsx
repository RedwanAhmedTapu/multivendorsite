// src/components/hrm/HrmWorkspaceEntry.tsx
//
// The "HR Workspace" entry button for the existing Admin/Vendor/Employee
// dashboards. Opens /hrm in a NEW browser tab (the tab shares the FinixMart
// session: same-origin localStorage rehydration + the httpOnly refresh
// cookie). Rendered ONLY when the user has full HRM workspace access
// (usePermissions().hrAccess.full — derived from the server's
// hrCapabilities map in ONE place). Partial/no HR access → renders nothing.

"use client";

import { useRouter } from "next/navigation";
import { LayoutDashboard } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";

export function HrmWorkspaceEntry({ className }: { className?: string }) {
  const router = useRouter();
  const { hrAccess, isLoading } = usePermissions();

  if (isLoading || !hrAccess.full) return null;

  return (
    <button
      onClick={() => window.open("/hrm", "_blank", "noopener")}
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "9px 18px",
        borderRadius: 10,
        border: "1.5px solid #E5EAF2",
        background: "#fff",
        fontSize: 13,
        fontWeight: 700,
        color: "#0D1B2E",
        cursor: "pointer",
        fontFamily: "inherit",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      }}
      title="Opens the HRM workspace in a new tab"
    >
      <LayoutDashboard size={15} style={{ color: "#059669" }} />
      HR Workspace
      <span style={{ fontSize: 10, color: "#94A3B8" }}>↗</span>
    </button>
  );
}
