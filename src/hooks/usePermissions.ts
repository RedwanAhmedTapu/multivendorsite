// src/hooks/usePermissions.ts
//
// SECURITY MODEL — read this before using this hook anywhere:
//
// This hook (and everything built on it: sidebar filtering, disabled
// buttons, hidden tabs) is a UX convenience ONLY. It stops honest users
// from being confused by menu items they can't use — it does NOT stop a
// malicious user, because anyone can open devtools, flip a boolean in
// Redux state, or hand-craft a fetch() call straight to the API.
//
// The ACTUAL security boundary is the backend's requirePermission()
// middleware (src/middlewares/permission.middleware.ts) — that's the one
// that can't be bypassed, because it re-reads Employee.permissions from
// the database on every request. This hook must never be the only gate in
// front of a sensitive action. If you hide a "Delete Product" button from
// an employee here, ALSO make sure DELETE /api/products/vendor/:id has
// requirePermission("productManagement") on the server — which it already
// does, per the earlier work on this project. This hook is the second
// layer, not the first.

import { useMemo } from "react";
import { useGetMeQuery } from "../features/authApi";
import type { PermissionKey, VendorOnlyPermissionKey } from "../features/authApi";

/** "OWNER_ONLY" is not a real Employee.permissions field — it's a sentinel
 *  used only in nav configs for sections that should never be unlockable
 *  by any employee checkbox (e.g. platform Settings, Vendor management on
 *  the admin side). can() returns true for it only when isOwner.
 *  PHASE F: granular HR capability keys are valid nav gates too — sidebar
 *  entries mirror the exact backend requireHr() grant per page. */
export type NavPermissionKey = PermissionKey | VendorOnlyPermissionKey | "OWNER_ONLY" | HrCapabilityKey;

/** Granular HR permission keys (P0) — the values come from the server's
 *  /auth/me `hrCapabilities` map, which is derived from the SAME source the
 *  backend requireHr() gates use. UI gating here is still convenience only. */
export const HR_GRANULAR_KEYS = [
  "hrEmployeeView", "hrEmployeeCreate", "hrEmployeeEdit", "hrEmployeeDelete",
  "hrSalaryView", "hrSalaryEdit",
  "hrDocsUpload", "hrDocsVerify", "hrDocsDownload", "hrDocsDelete",
  "hrBankView", "hrOrgEdit", "hrLeaveTypesEdit",
] as const;

export type HrCapabilityKey = (typeof HR_GRANULAR_KEYS)[number];
export type AnyPermissionKey = NavPermissionKey | HrCapabilityKey;

export function usePermissions() {
  const { data, isLoading, isError } = useGetMeQuery();
  const me = data?.data;

  const isOwner = me?.role === "ADMIN" || me?.role === "VENDOR";

  /** true if the current user may use this feature. Owners always can for
   *  the base keys; granular HR keys (salary/bank/docs/org) follow the
   *  server-derived capability map so sensitive data stays server-gated. */
  function can(key: AnyPermissionKey): boolean {
    if (!me) return false; // fail closed while loading / on error — never default to true
    if (key === "OWNER_ONLY") return isOwner;

    // Vendor POS: the vendor owner, or that vendor's staff holding posAccess.
    // Never the platform side — mirrors requireVendorPermission("posAccess").
    if (key === "posAccess") {
      if (me.role === "VENDOR") return !!me.vendorId;
      return me.role === "EMPLOYEE" && !!me.vendorId && me.permissions?.posAccess === true;
    }
    // POS subscription administration: ADMIN, or admin-side staff holding it
    // (never vendor accounts) — mirrors the backend admin route gate.
    if (key === "posSubscriptionManagement") {
      if (me.role === "ADMIN") return true;
      return me.role === "EMPLOYEE" && !me.vendorId && me.permissions?.posSubscriptionManagement === true;
    }
    // Agent Commission admin area: ADMIN, or admin-side staff holding it
    // (never vendor accounts) — mirrors the /api/admin/agents gate.
    if (key === "agentManagement") {
      if (me.role === "ADMIN") return true;
      return me.role === "EMPLOYEE" && !me.vendorId && me.permissions?.agentManagement === true;
    }
    // Theme palette management: ADMIN, or admin-side staff holding it
    // (never vendor accounts) — mirrors blockVendorEmployees +
    // requirePermission("themeManagement") on /api/themes/palettes…
    if (key === "themeManagement") {
      if (me.role === "ADMIN") return true;
      return me.role === "EMPLOYEE" && !me.vendorId && me.permissions?.themeManagement === true;
    }

    // Granular HR keys — the server's capability map is authoritative for
    // every role (VENDOR deliberately does NOT auto-pass salary/bank gates).
    if ((HR_GRANULAR_KEYS as readonly string[]).includes(key)) {
      return !!(me.hrCapabilities as Record<string, boolean> | undefined)?.[key];
    }

    // "hrManagement" as a nav gate = "has some HR access" — true when the
    // umbrella is granted or ANY granular HR capability is held.
    if (key === "hrManagement") {
      if (isOwner) return true;
      const caps = me.hrCapabilities as Record<string, boolean> | undefined;
      if (caps) return Object.values(caps).some(Boolean);
      return !!me.permissions?.hrManagement;
    }

    if (isOwner) return true;
    return !!me.permissions?.[key as PermissionKey];
  }

  /** true only for the platform admin side (vendorId === null). */
  const isAdminSide = me ? me.vendorId === null : false;

  // ── HRM workspace access (SINGLE definition — derived only from the
  //    server's hrCapabilities map; never from role strings or client state).
  //    PHASE F: holding ANY HR capability unlocks the dedicated /hrm
  //    workspace — the workspace itself filters every item, widget and
  //    action down to what the capability map allows (view-only HR users
  //    see read-only surfaces; the backend re-authorizes every call).
  //    Fail-closed: with no capabilities at all, no access.
  const hrAccess = useMemo(() => {
    const caps = (me?.hrCapabilities ?? null) as Record<string, boolean> | null;
    if (!caps) return { full: false, any: false };
    const anyHr = Object.values(caps).some(Boolean);
    return { full: anyHr, any: anyHr };
  }, [me?.hrCapabilities]);

  // ── Backend `requirePermission("hrManagement")` mirror — that middleware
  //    passes owners (ADMIN/VENDOR) and, for EMPLOYEE, ONLY the umbrella
  //    checkbox (any granular key alone is NOT enough). Distinct from
  //    can("hrManagement"), whose nav semantics are "holds some HR access".
  const canHrUmbrella = isOwner || !!me?.permissions?.hrManagement;

  return {
    me,
    isLoading,
    isError,
    isOwner,
    isAdminSide,
    role: me?.role,
    can,
    hrAccess,
    canHrUmbrella,
  };
}
