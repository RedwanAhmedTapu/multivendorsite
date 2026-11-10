// src/components/hrm/HrmGate.tsx
//
// Per-page capability gate for the /hrm workspace (PHASE F). The sidebar
// hides items the user cannot use; this gate makes DIRECT URLs behave the
// same: a page whose section capability the user lacks renders the existing
// denial card instead of the page shell (no empty states, no 403 toasts).
//
// The section → capability mapping comes from hrm-nav-config.ts (the same
// config that drives the sidebar), evaluated through usePermissions.can —
// one capability source only. Backend enforcement is unchanged.

"use client";

import Link from "next/link";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import { useGetMeQuery } from "@/features/authApi";
import { usePermissions } from "@/hooks/usePermissions";
import { HRM_NAV } from "./hrm-nav-config";

function findNavItem(section: string) {
  // section "" = the dashboard itself (href "/hrm").
  const href = section ? `/hrm/${section}` : "/hrm";
  for (const group of HRM_NAV) {
    for (const item of group.items) {
      if (item.href === href) return item;
    }
  }
  return null;
}

export function useHrmSectionAccess(section: string): { allowed: boolean; known: boolean } {
  const { me, can } = usePermissions();
  const item = findNavItem(section);
  if (!me) return { allowed: false, known: !!item };
  if (!item) return { allowed: true, known: false }; // not nav-listed (e.g. /hrm/employees/[id]) — no gate
  if (item.adminsOnly && me.role !== "ADMIN") return { allowed: false, known: true };
  if (item.requiresEmployeeProfile && !me.employeeId) return { allowed: false, known: true };
  if (item.caps.length === 0) return { allowed: true, known: true };
  return { allowed: item.caps.some((c) => can(c as Parameters<typeof can>[0])), known: true };
}

export function HrmGate({ section, children }: { section: string; children: React.ReactNode }) {
  const { isLoading } = useGetMeQuery();
  const { allowed } = useHrmSectionAccess(section);

  if (isLoading) return <div className="hrm-loading-block" style={{ margin: 24 }} />;

  if (!allowed) {
    return (
      <div className="flex items-center justify-center p-6" style={{ minHeight: "60vh" }}>
        <div className="hrm-card max-w-md p-8 text-center">
          <div style={{ width: 48, height: 48, borderRadius: 14, background: "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
            <ShieldCheck size={22} style={{ color: "#DC2626" }} />
          </div>
          <p style={{ fontSize: 15, fontWeight: 700, color: "var(--hrm-text)", margin: 0 }}>Access denied</p>
          <p style={{ fontSize: 12.5, color: "var(--hrm-muted)", marginTop: 6 }}>
            Your HR capabilities do not cover this page. The sidebar only lists pages you can use —
            the backend re-authorizes every API call regardless.
          </p>
          <Link href="/hrm" className="hrm-btn-primary" style={{ display: "inline-flex", marginTop: 16, textDecoration: "none" }}>
            <ArrowLeft size={14} /> Back to HR Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
