"use client";

import { useState, ReactNode, useMemo, useRef, useEffect } from "react";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  DollarSign,
  BarChart3,
  Megaphone,
  Star,
  MessageSquare,
  Calculator,
  Settings,
  HelpCircle,
  Mail,
  Plus,
  List,
  Clock,
  Tag,
  TrendingUp,
  FileText,
  Send,
  Crown,
  Users,
  Store,
  CreditCard,
  Receipt,
  PieChart,
  User,
  Lock,
  Wallet,
  MessageCircle,
  CheckCircle,
  Database,
  FolderOpen,
  StoreIcon,
  ChevronLeft,
  ChevronRight,
  BookOpen,
} from "lucide-react";

import { VendorSidebar } from "./sidebar/VendorSidebar";
import PrivateRoute from "@/components/privateroute/PrivateRoute";
import { VendorNavbar } from "./navbar/VendorNavbar";
import { flattenMenuItems } from "@/utils/flattenMenuItems";

type VendorLayoutProps = {
  main: ReactNode;
};

type Icon = React.ComponentType<React.SVGProps<SVGSVGElement>>;

type MenuItem = {
  title: string;
  href: string;
  icon: Icon;
  color?: string;
  badge?: string;
  subItems?: MenuItem[];
};

type SidebarSection = {
  title?: string;
  items: MenuItem[];
};

// Sidebar widths must match the values in VendorSidebar (w-72 = 288px, w-20 = 80px)
const SIDEBAR_EXPANDED_WIDTH  = 288; // w-72
const SIDEBAR_COLLAPSED_WIDTH = 80;  // w-20

function VendorLayout({ main }: VendorLayoutProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen]             = useState(true);
  const [isNavbarVisible, setIsNavbarVisible]     = useState(true);
  const mainContentRef = useRef<HTMLDivElement>(null);
  const lastScrollY    = useRef(0);

  const logo = {
    title:    "Finixmart",
    subtitle: "Vendor Panel",
  };

  const sections: SidebarSection[] = [
    {
      items: [
        {
          title: "Dashboard",
          href:  "/vendor-dashboard",
          icon:  LayoutDashboard,
          color: "text-[#4f46e5]",
        },
      ],
    },
    {
      items: [
        {
          title: "Products",
          href:  "#",
          icon:  Package,
          color: "text-[#7c3aed]",
          subItems: [
            { title: "Add Product",      href: "/vendor-dashboard/products/add",             icon: Plus     },
            { title: "Manage Products",  href: "/vendor-dashboard/products/product-manage",  icon: List     },
            { title: "Purchase Entry",   href: "/vendor-dashboard/products/purchase-entry",  icon: List     },
            { title: " Suppliers",   href: "/vendor-dashboard/products/supplier",  icon: List     },
            { title: "Bulk Template",    href: "/vendor-dashboard/products/bulk-template",   icon: BookOpen },
          ],
        },
      ],
    },
    {
      items: [
        {
          title: "Orders",
          href:  "#",
          icon:  ShoppingCart,
          color: "text-[#4338ca]",
          subItems: [
            { title: "All Orders", href: "/vendor-dashboard/orders", icon: List },
          ],
        },
      ],
    },
    {
      items: [
        {
          title: "Accounting",
          href:  "#",
          icon:  Calculator,
          color: "text-[#6d28d9]",
          subItems: [
            { title: "Account Management", href: "/accounting", icon: Receipt },
          ],
        },
      ],
    },
    {
      items: [
        {
          title: "Analytics",
          href:  "#",
          icon:  BarChart3,
          color: "text-[#4f46e5]",
          subItems: [
            { title: "Business Advisor", href: "/vendor-dashboard/buisnessadvisor", icon: TrendingUp },
          ],
        },
      ],
    },
    {
      items: [
        {
          title: "Promotions",
          href:  "#",
          icon:  Megaphone,
          color: "text-[#7c3aed]",
          subItems: [
            { title: "All Offers", href: "/vendor-dashboard/offer/offer-manage", icon: Tag },
            { title: "Add Offer",  href: "/vendor-dashboard/offer/add-offer",    icon: Tag },
          ],
        },
        {
          title: "Advertisements",
          href:  "#",
          icon:  Send,
          color: "text-[#4338ca]",
          subItems: [
            { title: "Ad Requests",      href: "/vendor-dashboard/ads/requests", icon: Send         },
            { title: "Active Ads",       href: "/vendor-dashboard/ads/active",   icon: CheckCircle  },
            { title: "Ad Status & Cost", href: "/vendor-dashboard/ads/status",   icon: DollarSign   },
          ],
        },
        {
          title: "Membership",
          href:  "/vendor-dashboard/membership",
          icon:  Crown,
          color: "text-[#a78bfa]",
        },
      ],
    },
    {
      items: [
        {
          title: "Customers",
          href:  "/vendor-dashboard/customers",
          icon:  Users,
          color: "text-[#6d28d9]",
        },
        {
          title: "Reviews",
          href:  "#",
          icon:  Star,
          color: "text-[#7c3aed]",
          subItems: [
            { title: "All Reviews",       href: "/vendor-dashboard/reviews",          icon: List     },
            { title: "Pending Response",  href: "/vendor-dashboard/reviews/pending",  icon: Clock,  badge: "4" },
            { title: "Rating Analysis",   href: "/vendor-dashboard/reviews/analysis", icon: BarChart3 },
          ],
        },
        {
          title: "Live Chat",
          href:  "/vendor-dashboard/chat",
          icon:  MessageSquare,
          color: "text-[#4f46e5]",
          badge: "3",
        },
      ],
    },
    {
      items: [
        {
          title: "Storage",
          href:  "#",
          icon:  Database,
          color: "text-[#4338ca]",
          subItems: [
            { title: "Storage Overview", href: "/vendor-dashboard/vendor-storage",      icon: PieChart   },
            { title: "File Manager",     href: "/vendor-dashboard/vendor-file-manage",  icon: FolderOpen },
          ],
        },
      ],
    },
    {
      items: [
        {
          title: "Store",
          href:  "#",
          icon:  StoreIcon,
          color: "text-[#7c3aed]",
          subItems: [
            { title: "Store Decoration", href: "/vendor-store-decoration",          icon: PieChart   },
            { title: "Store Settings",   href: "/vendor-dashboard/settings/shop",   icon: FolderOpen },
          ],
        },
      ],
    },
    {
      items: [
        {
          title: "Settings",
          href:  "#",
          icon:  Settings,
          color: "text-[#6d28d9]",
          subItems: [
            { title: "Profile Settings", href: "/vendor-dashboard/settings/profile",   icon: User      },
            { title: "Shop Settings",    href: "/vendor-dashboard/settings/shop",      icon: Store     },
            { title: "Payment Info",     href: "/vendor-dashboard/settings/payment",   icon: CreditCard },
            { title: "Security",         href: "/vendor-dashboard/settings/security",  icon: Lock      },
            { title: "Document/KYC",     href: "/vendor-dashboard/settings/documents", icon: FileText  },
          ],
        },
      ],
    },
    {
      items: [
        { title: "Help Center",     href: "/vendor-dashboard/help",    icon: HelpCircle,    color: "text-[#a78bfa]" },
        { title: "Contact Admin",   href: "/vendor-dashboard/support", icon: MessageCircle, color: "text-[#a78bfa]" },
        { title: "Support Tickets", href: "/vendor-dashboard/tickets", icon: Mail,          color: "text-[#a78bfa]", badge: "1" },
      ],
    },
  ];

  const searchMenuItems = useMemo(() => flattenMenuItems(sections), []);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  // Scroll-based navbar hide/show
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

  return (
    // Root shell — indigo-tinted page background
    <div
      className="flex h-screen overflow-hidden"
      style={{ backgroundColor: "#f5f5ff" }}
    >
      {/* ── Sidebar (static in flow on desktop, fixed on mobile) ── */}
      <div
        className="hidden lg:block relative shrink-0 transition-all duration-300"
        style={{ width: sidebarWidth }}
      >
        <VendorSidebar
          logo={logo}
          sections={sections}
          mobileOpen={false}
          onClose={() => {}}
          isCollapsed={!sidebarOpen}
        />

        {/* Collapse toggle pill */}
        <button
          onClick={toggleSidebar}
          className="absolute top-4 -right-3 z-50 flex items-center justify-center rounded-full border border-[#c7d2fe] bg-white p-1.5 shadow-[0_2px_8px_rgba(79,70,229,0.15)] transition-all duration-200 hover:scale-110 hover:border-[#4f46e5] hover:shadow-[0_2px_12px_rgba(79,70,229,0.25)]"
          aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          {sidebarOpen ? (
            <ChevronLeft className="h-4 w-4 text-[#4f46e5]" />
          ) : (
            <ChevronRight className="h-4 w-4 text-[#4f46e5]" />
          )}
        </button>
      </div>

      {/* Mobile sidebar */}
      <div className="lg:hidden">
        <VendorSidebar
          logo={logo}
          sections={sections}
          mobileOpen={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
          isCollapsed={false}
        />
      </div>

      {/* ── Right column: navbar + content ── */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <VendorNavbar
          onMobileMenuClick={() => setMobileSidebarOpen(true)}
          onMenuClick={toggleSidebar}
          isSidebarOpen={sidebarOpen}
          menuItems={searchMenuItems}
          isVisible={isNavbarVisible}
        />

        {/* Scrollable page content */}
        <main
          ref={mainContentRef}
          className="flex-1 overflow-y-auto"
          style={{ backgroundColor: "#f5f5ff" }}
        >
          <div className="pt-2">
            <div className="p-4 sm:p-6">{main}</div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function ProtectedVendorLayout({ main }: { main: ReactNode }) {
  return (
    <PrivateRoute allowedRoles={["VENDOR"]}>
      <VendorLayout main={main} />
    </PrivateRoute>
  );
}