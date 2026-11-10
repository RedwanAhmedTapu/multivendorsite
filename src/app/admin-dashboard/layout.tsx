// src/app/admin-dashboard/layout.tsx
"use client";

import { useState, ReactNode, useMemo, useRef, useEffect } from "react";
import {
  User, Users, Layers, Box, Store, Shield, Tag, Layout, Monitor,
  Settings, PlusCircle, Mail, HelpCircle, Database, CreditCard,
  BarChart2, Home, ShoppingCart, FileText, Star, MapPin, Bell,
  Calendar, ChevronLeft, ChevronRight, RotateCcw, Megaphone, ShieldCheck, Scale,
  MessageSquare, Palette
} from "lucide-react";

import { AdminSidebar } from "./sidebar/AdminSidebar";
import PrivateRoute from "@/components/privateroute/PrivateRoute";
import { usePermissions } from "@/hooks/usePermissions";
import { filterSectionsByPermission, type PermissionAwareSection } from "@/utils/permissionNav";
// import { AdminNavbar } from "./navbar/AdminNavbar";

type FlatMenuItem = {
  title: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  keywords: string[];
};

// ── Flatten helper ──
const flattenMenuItems = (sections: PermissionAwareSection[]): FlatMenuItem[] => {
  const flat: FlatMenuItem[] = [];

  const addItem = (title: string, href: string, icon: FlatMenuItem["icon"], parentTitle?: string) => {
    const baseKeywords = [title.toLowerCase(), ...title.toLowerCase().split(" ")];
    if (parentTitle) {
      baseKeywords.push(parentTitle.toLowerCase());
      baseKeywords.push(...parentTitle.toLowerCase().split(" "));
    }
    flat.push({ title, href, icon, keywords: [...new Set(baseKeywords)] });
  };

  sections.forEach((section) => {
    section.items.forEach((item) => {
      const effectiveHref = item.href !== "#" ? item.href : item.subItems?.[0]?.href || "#";
      addItem(item.title, effectiveHref, item.icon, section.title);
      item.subItems?.forEach((sub) => addItem(sub.title, sub.href, sub.icon, item.title));
    });
  });

  return flat;
};

// ── Sidebar widths (must match the CSS w-72 / w-20) ──
const SIDEBAR_EXPANDED_WIDTH = 288; // w-72
const SIDEBAR_COLLAPSED_WIDTH = 80;  // w-20

function AdminLayout({ main }: { main: ReactNode }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { can, isLoading: permissionsLoading } = usePermissions();

  const logo = {
    icon: Layers,
    title: "FinixMart",
    subtitle: "Admin Dashboard",
  };

  // Every item below carries a `permissionKey`. Omit it for things every
  // logged-in staff member should see. Use "OWNER_ONLY" for things no
  // employee checkbox should ever unlock (Vendors, Settings, Locations,
  // Courier config, financial/content admin) — only ADMIN itself sees
  // those. Adjust the mapping below to match how your client actually
  // wants employee checkboxes to map to these sections; this is a
  // reasonable, conservative default (when in doubt, OWNER_ONLY).
  const sections: PermissionAwareSection[] = [
    {
      items: [
        { title: "Dashboard", href: "/admin-dashboard", icon: Home, color: "text-[#4f46e5]" },
      ],
    },
    {
      items: [
        {
          title: "Vendors",
          href: "#",
          icon: Store,
          color: "text-[#7c3aed]",
          permissionKey: "OWNER_ONLY",
          subItems: [
            { title: "All Vendors", href: "/admin-dashboard/vendormanage/vendor-approval", icon: Users },
            { title: "Vendor Payouts", href: "/admin-dashboard/payouts", icon: CreditCard },
            { title: "Performance", href: "/admin-dashboard/vendormanage/performance", icon: BarChart2 },
            { title: "Promotional Offers", href: "/admin-dashboard/vendormanage/promotions", icon: Tag },
          ],
        },
       
      ],
    },
    {
      items: [
        {
          title: "Customers",
          href: "#",
          icon: Users,
          color: "text-[#6d28d9]",
          subItems: [
            { title: "All Customers", href: "/admin-dashboard/customer-manage/accountmanage", icon: User, permissionKey: "customerSupport" },
            { title: "Customer Reviews", href: "/admin-dashboard/customer-manage/customer-review", icon: Star, permissionKey: "customerSupport" },
          ],
        },
        { title: "Live Chat", href: "/admin-dashboard/chat", icon: MessageSquare, color: "text-[#4f46e5]", permissionKey: "customerSupport" },

      ],
    },
    {
      items: [
        {
          title: "Employees",
          href: "#",
          icon: Users,
          color: "text-[#4338ca]",
          subItems: [
           
            { title: "My HR", href: "/admin-dashboard/employees/hrm/my-profile", icon: User },
           
          ],
        },
      ],
    },
    {
      items: [
        {
          title: "Orders",
          href: "#",
          icon: FileText,
          color: "text-[#4f46e5]",
          permissionKey: "orderManagement",
          subItems: [
            { title: "All Orders", href: "/admin-dashboard/order", icon: Database },
            { title: "Review Queue", href: "/admin-dashboard/order-review", icon: ShieldCheck },
            { title: "Payment Reconciliation", href: "/admin-dashboard/payment-reconciliation", icon: Scale },
            { title: "Refunds", href: "/admin-dashboard/refunds", icon: RotateCcw },
          ],
        },
      ],
    },
    {
      items: [
        {
          title: "Categories",
          href: "#",
          icon: Box,
          color: "text-[#7c3aed]",
          permissionKey: "OWNER_ONLY",
          subItems: [
            { title: "Categories", href: "/admin-dashboard/category/category-manage", icon: Layers },
            { title: "Bulk Categories", href: "/admin-dashboard/category/bulk-category-upload", icon: Layers },
            { title: "Add Brand", href: "/admin-dashboard/brands", icon: Layers },
            { title: "Brand Management", href: "/admin-dashboard/brands/management", icon: Layers },
          ],
        },
      ],
    },
    {
      items: [
        {
          title: "Products",
          href: "#",
          icon: Box,
          color: "text-[#4338ca]",
          permissionKey: "productManagement",
          subItems: [
            { title: "All Products", href: "/admin-dashboard/products", icon: Database },
          ],
        },
      ],
    },
    {
      items: [
        { title: "Locations", href: "/admin-dashboard/locations", icon: MapPin, color: "text-[#6d28d9]", permissionKey: "OWNER_ONLY" },
      ],
    },
    {
      items: [
        {
          title: "Courier & Shipping",
          href: "#",
          icon: MapPin,
          color: "text-[#6d28d9]",
          permissionKey: "OWNER_ONLY",
          subItems: [
            { title: "Courier Credentials", href: "/admin-dashboard/courier/credentials", icon: Settings },
            { title: "Courier Provider", href: "/admin-dashboard/courier", icon: Settings },
            { title: "Create Store", href: "/admin-dashboard/courier/courier-store", icon: Settings },
          ],
        },
      ],
    },
    {
      items: [
        {
          title: "Offers & Coupons",
          href: "#",
          icon: Tag,
          color: "text-[#4f46e5]",
          subItems: [
            { title: "All Offers", href: "/admin-dashboard/offer-manage", icon: Database, permissionKey: "offerManagement" },
            { title: "Add Offer", href: "/admin-dashboard/offer-manage/add-offer", icon: PlusCircle, permissionKey: "offerManagement" },
            { title: "Promotions & Programmes", href: "/admin-dashboard/promotions/programmes", icon: Layers, permissionKey: "OWNER_ONLY" },
            { title: "Email & SMS Campaigns", href: "/admin-dashboard/promotions/email-sms", icon: Mail, permissionKey: "OWNER_ONLY" },
          ],
        },
        // ADMIN only until an advertisement-approval permission exists for staff (UI visibility, not authorization).
        { title: "Advertisements", href: "/admin-dashboard/advertisements", icon: Megaphone, color: "text-[#7c3aed]", permissionKey: "OWNER_ONLY" },
      ],
    },
    {
      items: [
        {
          title: "Subscriptions & Memberships",
          href: "#",
          icon: Tag,
          color: "text-[#4f46e5]",
          subItems: [
        // Dynamic plans, features, offers and vendor subscriptions (backend: ADMIN only).
        { title: "Plans & Subscriptions", href: "/admin-dashboard/subscriptions", icon: Star, color: "text-[#7c3aed]", permissionKey: "OWNER_ONLY" },
        { title: "POS Subscriptions", href: "/admin-dashboard/pos-subscriptions", icon: CreditCard, color: "text-[#0891b2]", permissionKey: "posSubscriptionManagement" },
           
          ],
        },
      ],
    },
    {
      items: [
        // Agent Commission admin area (ADMIN, or admin staff holding agentManagement).
        { title: "Agents", href: "/admin-dashboard/agents", icon: Users, color: "text-[#0d9488]", permissionKey: "agentManagement" },
      ],
    },
    {
      items: [
        {
          title: "Settings",
          href: "#",
          icon: Settings,
          color: "text-[#7c3aed]",
          permissionKey: "OWNER_ONLY",
          subItems: [
            { title: "Themes & Layouts", href: "/admin-dashboard/theme-manage", icon: Layout },
            { title: "Product Card Design", href: "/admin-dashboard/theme-manage/product-card", icon: Box },
            // Part 3: palette management — ADMIN, or admin-side staff holding
            // themeManagement (mirrors the backend gate; vendor staff never qualify).
            { title: "Color Palettes", href: "/admin-dashboard/themes", icon: Palette, permissionKey: "themeManagement" },
            { title: "Terms & Conditions", href: "/admin-dashboard/settings/terms", icon: FileText },
            { title: "Footer Settings", href: "/admin-dashboard/settings/footer", icon: FileText },
            { title: "Bank Settings", href: "/admin-dashboard/settings/banks", icon: FileText },
            { title: "Fraud Providers", href: "/admin-dashboard/settings/fraud-providers", icon: FileText },
            { title: "Payment Providers", href: "/admin-dashboard/settings/payment-providers", icon: FileText },
          ],
        },
      ],
    },
    {
      items: [
        {
          title: "Content",
          href: "#",
          icon: FileText,
          color: "text-[#4338ca]",
          permissionKey: "OWNER_ONLY",
          subItems: [
            { title: "Banners", href: "/admin-dashboard/banners", icon: Layout },
            // ADMIN (page builder) or staff with marketingManagement (vendor rules + registrations only).
            { title: "Campaign", href: "/admin-dashboard/campaigns", icon: Layout, permissionKey: "marketingManagement" },
            { title: "Blogs", href: "/admin-dashboard/content/blogs", icon: FileText },
            { title: "FAQ", href: "/admin-dashboard/content/faq", icon: HelpCircle },
          ],
        },
      ],
    },
  ];

  const visibleSections = useMemo(() => filterSectionsByPermission(sections, can), [can]);
  const searchMenuItems = useMemo(() => flattenMenuItems(visibleSections), [visibleSections]);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const sidebarWidth = sidebarOpen ? SIDEBAR_EXPANDED_WIDTH : SIDEBAR_COLLAPSED_WIDTH;

  // While /api/auth/me is loading, don't flash the full unfiltered menu —
  // show nothing (or a skeleton) rather than briefly revealing sections an
  // employee shouldn't see.
  if (permissionsLoading) {
    return <div className="flex h-screen items-center justify-center" style={{ backgroundColor: "#f5f5ff" }}>Loading…</div>;
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "#f5f5ff" }}>
      {/* ── Desktop sidebar (static in flow) ── */}
      <div className="hidden lg:block relative shrink-0 transition-all duration-300" style={{ width: sidebarWidth }}>
        <AdminSidebar
          logo={logo}
          sections={visibleSections}
          mobileOpen={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
          isCollapsed={!sidebarOpen}
        />

        <button
          onClick={toggleSidebar}
          className="absolute top-4 -right-3 z-50 flex items-center justify-center rounded-full border border-[#c7d2fe] bg-white p-1.5 shadow-[0_2px_8px_rgba(79,70,229,0.15)] transition-all duration-200 hover:scale-110 hover:border-[#4f46e5] hover:shadow-[0_2px_12px_rgba(79,70,229,0.25)]"
          aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          {sidebarOpen ? <ChevronLeft className="h-4 w-4 text-[#4f46e5]" /> : <ChevronRight className="h-4 w-4 text-[#4f46e5]" />}
        </button>
      </div>

      {/* ── Mobile sidebar ── */}
      <div className="lg:hidden">
        <AdminSidebar
          logo={logo}
          sections={visibleSections}
          mobileOpen={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
          isCollapsed={false}
        />
      </div>

      {/* ── Main content area ── */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto" style={{ backgroundColor: "#f5f5ff" }}>
          <div className="pt-2">
            <div className="p-4 sm:p-6">{main}</div>
          </div>
        </main>
      </div>
    </div>
  );
}

/**
 * Guards against a VENDOR's employee ever landing on the admin dashboard.
 * ADMIN and admin's own EMPLOYEE (vendorId === null) pass through;
 * VENDOR and a vendor's EMPLOYEE (vendorId set) never should reach this
 * layout at all — PrivateRoute's allowedRoles already blocks VENDOR/CUSTOMER,
 * but role alone doesn't distinguish "admin's employee" from "vendor's
 * employee" (both are role EMPLOYEE) — vendorId does. This mirrors the
 * blockVendorEmployees backend middleware from the HRM module, on the UI side.
 */
function RequireAdminSide({ children }: { children: ReactNode }) {
  const { me, isLoading, isAdminSide, role } = usePermissions();

  if (isLoading) return <div className="flex h-screen items-center justify-center">Loading…</div>;
  if (role === "EMPLOYEE" && !isAdminSide) {
    return (
      <div className="flex h-screen items-center justify-center text-center p-6">
        <div>
          <p className="text-lg font-semibold text-red-600">Access denied</p>
          <p className="text-sm text-gray-500 mt-1">Your account belongs to a vendor, not the platform admin.</p>
        </div>
      </div>
    );
  }
  if (!me) return null;
  return <>{children}</>;
}

export default function AdminProtectedLayout({ main }: { main: ReactNode }) {
  return (
    <PrivateRoute allowedRoles={["ADMIN", "EMPLOYEE"]}>
      <RequireAdminSide>
        <AdminLayout main={main} />
      </RequireAdminSide>
    </PrivateRoute>
  );
}
