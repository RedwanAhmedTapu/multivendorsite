// src/app/vendor-dashboard/layout.tsx
"use client";

import { useState, ReactNode, useMemo, useRef, useEffect } from "react";
import {
  LayoutDashboard, Package, ShoppingCart, DollarSign, BarChart3, Megaphone, Star,
  MessageSquare, Calculator, Settings, HelpCircle, Mail, Plus, List, Clock, Tag,
  TrendingUp, FileText, Send, Crown, Users, Store, CreditCard, Receipt, PieChart,
  User, Lock, Wallet, MessageCircle, CheckCircle, Database, FolderOpen, StoreIcon,
  ChevronLeft, ChevronRight, BookOpen, Calendar,
} from "lucide-react";

import { VendorSidebar } from "./sidebar/VendorSidebar";
import PrivateRoute from "@/components/privateroute/PrivateRoute";
import { VendorNavbar } from "./navbar/VendorNavbar";
import { usePermissions } from "@/hooks/usePermissions";
import { filterSectionsByPermission, type PermissionAwareSection } from "@/utils/permissionNav";

type VendorLayoutProps = { main: ReactNode };

// ── Sidebar widths must match VendorSidebar (w-72 = 288px, w-20 = 80px) ──
const SIDEBAR_EXPANDED_WIDTH = 288;
const SIDEBAR_COLLAPSED_WIDTH = 80;

function flattenMenuItems(sections: PermissionAwareSection[]) {
  const flat: { title: string; href: string; icon: any; keywords: string[] }[] = [];
  const add = (title: string, href: string, icon: any, parentTitle?: string) => {
    const kw = [title.toLowerCase(), ...title.toLowerCase().split(" ")];
    if (parentTitle) kw.push(parentTitle.toLowerCase(), ...parentTitle.toLowerCase().split(" "));
    flat.push({ title, href, icon, keywords: [...new Set(kw)] });
  };
  sections.forEach((s) =>
    s.items.forEach((it) => {
      const href = it.href !== "#" ? it.href : it.subItems?.[0]?.href || "#";
      add(it.title, href, it.icon, s.title);
      it.subItems?.forEach((sub) => add(sub.title, sub.href, sub.icon, it.title));
    })
  );
  return flat;
}

function VendorLayout({ main }: VendorLayoutProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isNavbarVisible, setIsNavbarVisible] = useState(true);
  const mainContentRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);
  const { can, isLoading: permissionsLoading } = usePermissions();

  const logo = { title: "Finixmart", subtitle: "Vendor Panel" };

  // Same convention as admin-dashboard: omit permissionKey for things
  // every staff member should see; use one of the 7 keys for gated
  // sections; use "OWNER_ONLY" for things no employee checkbox should
  // ever unlock (financial/store-config/account-settings areas).
  const sections: PermissionAwareSection[] = [
      {
    items: [
      { title: "Dashboard", href: "/vendor-dashboard", icon: LayoutDashboard, color: "text-[#4f46e5]" },
      // Reviews of this vendor's products. Gated on the same key as product
      // management (stricter than the API, which also allows EMPLOYEE), so the
      // link never appears for staff who cannot reach the product screens.
    ],
  },
    {
      items: [
        {
          title: "Products",
          href: "#",
          icon: Package,
          color: "text-[#7c3aed]",
          subItems: [
            { title: "Add Product", href: "/vendor-dashboard/products/add", icon: Plus, permissionKey: "productManagement" },
            { title: "Manage Products", href: "/vendor-dashboard/products/product-manage", icon: List, permissionKey: "productManagement" },
            { title: "Bulk Template", href: "/vendor-dashboard/products/bulk-template", icon: BookOpen, permissionKey: "productManagement" },
            { title: "Inventory Management", href: "/vendor-dashboard/products/stock-inventory", icon: BookOpen, permissionKey: "inventoryManagement" },
            { title: "Brand Management", href: "/vendor-dashboard/products/brands", icon: BookOpen, permissionKey: "productManagement" },
          ],
        },
      ],
    },
    {
      items: [
        {
          title: "Purchase",
          href: "#",
          icon: Package,
          color: "text-[#7c3aed]",
          permissionKey: "inventoryManagement",
          subItems: [
            { title: " Suppliers", href: "/vendor-dashboard/products/supplier", icon: List },
            { title: "Purchase Entry", href: "/vendor-dashboard/products/purchase-entry", icon: Plus },
            { title: "Purchase Details", href: "/vendor-dashboard/products/purchase-details", icon: List },
          ],
        },
      ],
    },
    {
      items: [
        {
          title: "Orders",
          href: "#",
          icon: ShoppingCart,
          color: "text-[#4338ca]",
          permissionKey: "orderManagement",
          subItems: [{ title: "All Orders", href: "/vendor-dashboard/orders", icon: List }],
        },
      ],
    },
    {
      items: [
        {
          title: "Accounting",
          href: "#",
          icon: Calculator,
          color: "text-[#6d28d9]",
          permissionKey: "OWNER_ONLY",
          subItems: [{ title: "Account Management", href: "/accounting", icon: Receipt }],
        },
      ],
    },
    {
      items: [
        {
          title: "Analytics",
          href: "#",
          icon: BarChart3,
          color: "text-[#4f46e5]",
          permissionKey: "analytics",
          subItems: [{ title: "Business Advisor", href: "/vendor-dashboard/buisnessadvisor", icon: TrendingUp }],
        },
      ],
    },
    {
      items: [
        {
          title: "Promotions",
          href: "#",
          icon: Megaphone,
          color: "text-[#7c3aed]",
          permissionKey: "offerManagement",
          subItems: [
            { title: "All Offers", href: "/vendor-dashboard/offer/offer-manage", icon: Tag },
          ],
        },
        // Owner only until an advertising permission exists for vendor staff (UI visibility, not authorization).
        { title: "Advertisements", href: "/vendor-dashboard/advertisements", icon: Megaphone, color: "text-[#7c3aed]", permissionKey: "OWNER_ONLY" },
        // POS: the owner, or staff holding posAccess (server re-checks every POS call).
        // Opens the full-screen POS in its own tab; the dashboard stays open here.
        { title: "POS Terminal", href: "/pos", icon: Calculator, color: "text-[#0891b2]", permissionKey: "posAccess", openInNewTab: true },
        // Buying/renewing the POS plan is the owner's decision (backend: VENDOR role only).
        { title: "POS Subscription", href: "/vendor-dashboard/pos-billing", icon: CreditCard, color: "text-[#0891b2]", permissionKey: "OWNER_ONLY" },
        // FinixMart plan and earnings payouts are the owner's business (backend: VENDOR role only).
        { title: "Subscription Plan", href: "/vendor-dashboard/subscription", icon: Crown, color: "text-[#7c3aed]", permissionKey: "OWNER_ONLY" },
        { title: "Payouts", href: "/vendor-dashboard/payouts", icon: Wallet, color: "text-[#4f46e5]", permissionKey: "OWNER_ONLY" },
      ],
    },
    {
      items: [
        { title: "Customers", href: "/vendor-dashboard/customers", icon: Users, color: "text-[#6d28d9]", permissionKey: "customerSupport" },
        {
          title: "Reviews",
          href: "#",
          icon: Star,
          color: "text-[#7c3aed]",
          permissionKey: "customerSupport",
          subItems: [
            { title: "All Reviews", href: "/vendor-dashboard/reviews", icon: List },
          ],
        },
        { title: "Live Chat", href: "/vendor-dashboard/chat", icon: MessageSquare, color: "text-[#4f46e5]", permissionKey: "customerSupport" },
      ],
    },
    {
      items: [
        {
          title: "Storage",
          href: "#",
          icon: Database,
          color: "text-[#4338ca]",
          permissionKey: "OWNER_ONLY",
          subItems: [
            { title: "Storage Overview", href: "/vendor-dashboard/vendor-storage", icon: PieChart },
            { title: "File Manager", href: "/vendor-dashboard/vendor-file-manage", icon: FolderOpen },
          ],
        },
      ],
    },
    {
      items: [
        {
          title: "Store",
          href: "#",
          icon: StoreIcon,
          color: "text-[#7c3aed]",
          permissionKey: "OWNER_ONLY",
          subItems: [
            { title: "Store Decoration", href: "/vendor-store-decoration", icon: PieChart },
            { title: "Store Settings", href: "/vendor-dashboard/settings/shop", icon: FolderOpen },
          ],
        },
      ],
    },
    {
      items: [
        {
          title: "Account Settings",
          href: "#",
          icon: Settings,
          color: "text-[#6d28d9]",
          permissionKey: "OWNER_ONLY",
          subItems: [{ title: " Settings", href: "/vendor-dashboard/settings", icon: User }],
        },
      ],
    },
    {
      // Employees/HR — the new HRM module. hrManagement gates it, same as
      // the rest; the employee's own self-service pages (attendance
      // check-in, leave apply, own profile) live under /vendor-dashboard/hrm
      // and are reachable directly without a sidebar entry — see the HRM
      // employee-management UI package for the ESS (Employee Self Service) page.
      items: [
        {
          title: "Employees (HR)",
          href: "#",
          icon: Users,
          color: "text-[#4338ca]",
          permissionKey: "hrManagement",
          subItems: [
            { title: "Employee Directory", href: "/vendor-dashboard/hrm/employees", icon: Users, permissionKey: "hrEmployeeView" },
            { title: "Attendance", href: "/vendor-dashboard/hrm/attendance", icon: Clock, permissionKey: "hrEmployeeView" },
            { title: "Leave Requests", href: "/vendor-dashboard/hrm/leave", icon: Calendar, permissionKey: "hrEmployeeView" },
            { title: "Payroll", href: "/vendor-dashboard/hrm/payroll", icon: Wallet, permissionKey: "hrSalaryView" },
          ],
        },
      ],
    },
    {
      // Self-service for every staff member of this vendor, including those
      // WITHOUT the hrManagement permission — that's why it's a standalone
      // item rather than a child of the gated "Employees (HR)" section
      // above. Matches the backend's self-service routes.
      items: [
        { title: "My HR", href: "/vendor-dashboard/hrm/my-profile", icon: User },
      ],
    },
    {
      items: [
        { title: "Help Center", href: "/vendor-dashboard/help", icon: HelpCircle, color: "text-[#a78bfa]" },
        { title: "Contact Admin", href: "/vendor-dashboard/support", icon: MessageCircle, color: "text-[#a78bfa]" },
      ],
    },
  ];

  const visibleSections = useMemo(() => filterSectionsByPermission(sections, can), [can]);
  const searchMenuItems = useMemo(() => flattenMenuItems(visibleSections), [visibleSections]);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  useEffect(() => {
    const mainContent = mainContentRef.current;
    if (!mainContent) return;
    const scrollThreshold = 10;
    let ticking = false;
    const handleScroll = () => {
      const currentScrollY = mainContent.scrollTop;
      if (currentScrollY < 10) {
        setIsNavbarVisible(true);
        lastScrollY.current = currentScrollY;
        return;
      }
      if (Math.abs(currentScrollY - lastScrollY.current) < scrollThreshold) return;
      setIsNavbarVisible(currentScrollY <= lastScrollY.current);
      lastScrollY.current = currentScrollY;
    };
    const scrollListener = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };
    mainContent.addEventListener("scroll", scrollListener, { passive: true });
    return () => mainContent.removeEventListener("scroll", scrollListener);
  }, []);

  const sidebarWidth = sidebarOpen ? SIDEBAR_EXPANDED_WIDTH : SIDEBAR_COLLAPSED_WIDTH;

  if (permissionsLoading) {
    return <div className="flex h-screen items-center justify-center" style={{ backgroundColor: "#f5f5ff" }}>Loading…</div>;
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "#f5f5ff" }}>
      <div className="hidden lg:block relative shrink-0 transition-all duration-300 bg-red-600" style={{ width: sidebarWidth }}>
        <VendorSidebar
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

      <div className="lg:hidden">
        <VendorSidebar
          logo={logo}
          sections={visibleSections}
          mobileOpen={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
          isCollapsed={!sidebarOpen}
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <main ref={mainContentRef} className="flex-1 overflow-y-auto" style={{ backgroundColor: "#f5f5ff" }}>
          <div className="pt-2">
            <div className="p-4 sm:p-6">{main}</div>
          </div>
        </main>
      </div>
    </div>
  );
}

/** Blocks an admin's employee (vendorId === null) from ever landing on a
 *  vendor dashboard — mirrors RequireAdminSide on the other layout. */
function RequireVendorSide({ children }: { children: ReactNode }) {
  const { me, isLoading, isAdminSide, role } = usePermissions();

  if (isLoading) return <div className="flex h-screen items-center justify-center">Loading…</div>;
  if (role === "EMPLOYEE" && isAdminSide) {
    return (
      <div className="flex h-screen items-center justify-center text-center p-6">
        <div>
          <p className="text-lg font-semibold text-red-600">Access denied</p>
          <p className="text-sm text-gray-500 mt-1">Your account belongs to the platform admin, not a vendor.</p>
        </div>
      </div>
    );
  }
  if (!me) return null;
  return <>{children}</>;
}

export default function ProtectedVendorLayout({ main }: { main: ReactNode }) {
  return (
    <PrivateRoute allowedRoles={["VENDOR", "EMPLOYEE"]}>
      <RequireVendorSide>
        <VendorLayout main={main} />
      </RequireVendorSide>
    </PrivateRoute>
  );
}
