// app/pos/types.ts
import type { PosStaff } from "@/features/posApi";

// The set of top-level sections the POS app can navigate to. Every switch
// on `activeView` in page.tsx keys off this union.
export type PosView = "pos" | "invoices" | "customers" | "dashboard" | "users" | "settings";

// Sidebar groups items under a section header; BottomNav ignores grouping
// and just takes the first 5 visible items for the mobile tab bar.
export type NavGroup = "Sales" | "Customers" | "Insights" | "Admin";

export interface NavItem {
  id: PosView;
  label: string;
  // Key into the ICONS map defined locally in Sidebar.tsx / BottomNav.tsx
  // (must be one of: ShoppingCart, Receipt, Users, BarChart2, UserCog, Settings).
  icon: string;
  group: NavGroup;
  // When true, only visible/reachable by staff.isAdmin (cashiers with the
  // right `permissions` flag still go through the per-view checks in
  // page.tsx, e.g. canViewDashboard — adminOnly is strictly for
  // admin-vs-everyone, not fine-grained permissions).
  adminOnly?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  // Dashboard is first in the POS navigation by product decision.
  { id: "dashboard", label: "Dashboard", icon: "BarChart2", group: "Insights" },
  { id: "pos", label: "POS Terminal", icon: "ShoppingCart", group: "Sales" },
  { id: "invoices", label: "Invoices", icon: "Receipt", group: "Sales" },
  { id: "customers", label: "Customers", icon: "Users", group: "Customers" },
  // "Staff" (id: users) is intentionally NOT in the POS navigation. The staff
  // management view and its backend remain available; only this nav entry is gone.
  { id: "settings", label: "Settings", icon: "Settings", group: "Admin", adminOnly: true },
];

// Shared by the Sidebar/BottomNav filtering (`!n.adminOnly || staff.isAdmin`)
// and page.tsx's route-guard, so both stay in sync by construction.
export function canSeeNavItem(item: NavItem, staff: PosStaff): boolean {
  return !item.adminOnly || staff.isAdmin;
}