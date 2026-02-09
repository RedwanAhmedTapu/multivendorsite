// components/vendor/layout/VendorLayout.tsx
"use client";

import { useState, ReactNode, useMemo, useRef, useEffect } from "react";
import { VendorSidebar } from "./sidebar/VendorSidebar";
import PrivateRoute from "@/components/privateroute/PrivateRoute";
import { VendorNavbar } from "./navbar/VendorNavbar";
import { BookTemplateIcon, ChevronLeft, ChevronRight } from "lucide-react";
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

function VendorLayout({ main }: VendorLayoutProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isNavbarVisible, setIsNavbarVisible] = useState(true);
  const mainContentRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);

  const logo = {
    icon: Store,
    title: "FinixMart",
    subtitle: "Vendor Panel",
    iconBgColor: "bg-teal-500",
  };

  const sections: SidebarSection[] = [
    {
      title: "Dashboard",
      items: [
        { title: "Dashboard", href: "/vendor-dashboard", icon: LayoutDashboard, color: "text-teal-600" },
      ],
    },
    {
      title: "Product Management",
      items: [
        {
          title: "Products",
          href: "#",
          icon: Package,
          color: "text-blue-500",
          subItems: [
            { title: "Add Product", href: "/vendor-dashboard/products/add", icon: Plus },
            { title: "Manage Products", href: "/vendor-dashboard/products/product-manage", icon: List },
            { title: "Bulk Template", href: "/vendor-dashboard/products/bulk-template", icon: BookTemplateIcon },
            { title: "Bulk Upload", href: "/vendor-dashboard/products/bulk-upload", icon: Upload },
            // { title: "Product Scheduling", href: "/vendor-dashboard/products/schedule", icon: Clock },
            // { title: "Stock Alerts", href: "/vendor-dashboard/products/stock-alerts", icon: AlertCircle, badge: "3" },
          ],
        },
      ],
    },
    {
      title: "Order Management",
      items: [
        {
          title: "Orders",
          href: "#",
          icon: ShoppingCart,
          color: "text-orange-500",
          subItems: [
            { title: "All Orders", href: "/vendor-dashboard/orders", icon: List },
            { title: "Pending Orders", href: "/vendor-dashboard/orders/pending", icon: Clock, badge: "5" },
            { title: "Processing", href: "/vendor-dashboard/orders/processing", icon: Package },
            { title: "Shipped", href: "/vendor-dashboard/orders/shipped", icon: TrendingUp },
            { title: "Delivered", href: "/vendor-dashboard/orders/delivered", icon: CheckCircle },
            { title: "Returned", href: "/vendor-dashboard/orders/returned", icon: RotateCcw },
            { title: "Cancelled", href: "/vendor-dashboard/orders/cancelled", icon: XCircle },
            { title: "Print Invoices", href: "/vendor-dashboard/orders/invoices", icon: FileText },
          ],
        },
        {
          title: "Refund Requests",
          href: "#",
          icon: Receipt,
          color: "text-red-500",
          subItems: [
            { title: "Pending", href: "/vendor-dashboard/refunds/pending", icon: Clock, badge: "2" },
            { title: "Approved", href: "/vendor-dashboard/refunds/approved", icon: CheckCircle },
            { title: "Rejected", href: "/vendor-dashboard/refunds/rejected", icon: XCircle },
            { title: "Refunded", href: "/vendor-dashboard/refunds/refunded", icon: DollarSign },
          ],
        },
      ],
    },
    {
      title: "Finance & Earnings",
      items: [
        {
          title: "Earnings",
          href: "#",
          icon: DollarSign,
          color: "text-green-500",
          subItems: [
            { title: "Payout History", href: "/vendor-dashboard/earnings/payouts", icon: Wallet },
            { title: "Pending Payouts", href: "/vendor-dashboard/earnings/pending", icon: Clock },
            { title: "Request Payout", href: "/vendor-dashboard/earnings/request", icon: Send },
            { title: "Commissions", href: "/vendor-dashboard/earnings/commissions", icon: Percent },
          ],
        },
        {
          title: "Accounting",
          href: "#",
          icon: Calculator,
          color: "text-purple-500",
          subItems: [
            { title: "Expense Management", href: "/vendor-dashboard/accounting/expenses", icon: Receipt },
            { title: "Liabilities", href: "/vendor-dashboard/accounting/liabilities", icon: CreditCard },
            { title: "Assets", href: "/vendor-dashboard/accounting/assets", icon: Building },
            { title: "Financial Reports", href: "/vendor-dashboard/accounting/reports", icon: PieChart },
            { title: "Profit & Loss", href: "/vendor-dashboard/accounting/profit-loss", icon: TrendingUp },
            { title: "Tax Reports", href: "/vendor-dashboard/accounting/tax", icon: FileText },
          ],
        },
      ],
    },
    {
      title: "Reports & Analytics",
      items: [
        {
          title: "Analytics",
          href: "#",
          icon: BarChart3,
          color: "text-indigo-500",
          subItems: [
            { title: "Sales Analytics", href: "/vendor-dashboard/analytics/sales", icon: TrendingUp },
            { title: "Performance Metrics", href: "/vendor-dashboard/analytics/performance", icon: BarChart3 },
            { title: "Transaction Report", href: "/vendor-dashboard/analytics/transactions", icon: Receipt },
            { title: "Product Report", href: "/vendor-dashboard/analytics/products", icon: Package },
            { title: "Order Reports", href: "/vendor-dashboard/analytics/orders", icon: ShoppingCart },
            { title: "Export Reports", href: "/vendor-dashboard/analytics/export", icon: Download },
          ],
        },
      ],
    },
    {
      title: "Marketing & Promotion",
      items: [
        {
          title: "Promotions",
          href: "#",
          icon: Megaphone,
          color: "text-pink-500",
          subItems: [
            { title: "All Offers", href: "/vendor-dashboard/offer/offer-manage", icon: Tag },
            { title: "Add Offer", href: "/vendor-dashboard/offer/add-offer", icon: Tag },
          ],
        },
        {
          title: "Advertisements",
          href: "#",
          icon: Megaphone,
          color: "text-yellow-500",
          subItems: [
            { title: "Ad Requests", href: "/vendor-dashboard/ads/requests", icon: Send },
            { title: "Active Ads", href: "/vendor-dashboard/ads/active", icon: CheckCircle },
            { title: "Ad Status & Cost", href: "/vendor-dashboard/ads/status", icon: DollarSign },
          ],
        },
        { title: "Membership", href: "/vendor-dashboard/membership", icon: Crown, color: "text-yellow-500" },
      ],
    },
    {
      title: "Customer Management",
      items: [
        { title: "Customers", href: "/vendor-dashboard/customers", icon: Users, color: "text-cyan-500" },
        {
          title: "Reviews",
          href: "#",
          icon: Star,
          color: "text-amber-500",
          subItems: [
            { title: "All Reviews", href: "/vendor-dashboard/reviews", icon: List },
            { title: "Pending Response", href: "/vendor-dashboard/reviews/pending", icon: Clock, badge: "4" },
            { title: "Rating Analysis", href: "/vendor-dashboard/reviews/analysis", icon: BarChart3 },
          ],
        },
        { title: "Live Chat", href: "/vendor-dashboard/chat", icon: MessageSquare, color: "text-green-500", badge: "3" },
      ],
    },
    {
      title: "Storage",
      items: [
        {
          title: "Storage",
          href: "#",
          icon: Database,
          color: "text-slate-500",
          subItems: [
            { title: "Storage Overview", href: "/vendor-dashboard/vendor-storage", icon: PieChart },
            { title: "File Manager", href: "/vendor-dashboard/vendor-file-manage", icon: FolderOpen },
          ],
        },
      ],
    },
    {
      title: "Store",
      items: [
        {
          title: "Store",
          href: "#",
          icon: StoreIcon,
          color: "text-slate-500",
          subItems: [
            { title: "Store Decoration", href: "/vendor-store-decoration", icon: PieChart },
            { title: "Store Settings", href: "/vendor-dashboard/vendor-file-manage", icon: FolderOpen },
          ],
        },
      ],
    },
    {
      title: "Settings",
      items: [
        {
          title: "Settings",
          href: "#",
          icon: Settings,
          color: "text-gray-500",
          subItems: [
            { title: "Profile Settings", href: "/vendor-dashboard/settings/profile", icon: User },
            { title: "Shop Settings", href: "/vendor-dashboard/settings/shop", icon: Store },
            { title: "Payment Info", href: "/vendor-dashboard/settings/payment", icon: CreditCard },
            { title: "Security", href: "/vendor-dashboard/settings/security", icon: Lock },
            { title: "Document/KYC", href: "/vendor-dashboard/settings/documents", icon: FileText },
          ],
        },
      ],
    },
    {
      title: "Support",
      items: [
        { title: "Help Center", href: "/vendor-dashboard/help", icon: HelpCircle, color: "text-teal-500" },
        { title: "Contact Admin", href: "/vendor-dashboard/support", icon: MessageCircle, color: "text-teal-500" },
        { title: "Support Tickets", href: "/vendor-dashboard/tickets", icon: Mail, color: "text-teal-500", badge: "1" },
      ],
    },
  ];

  // Flatten menu items for search
  const searchMenuItems = useMemo(() => flattenMenuItems(sections), [sections]);

  

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  // Handle scroll on the main content container
  useEffect(() => {
    const mainContent = mainContentRef.current;
    if (!mainContent) return;

    const scrollThreshold = 10;

    const handleScroll = () => {
      const currentScrollY = mainContent.scrollTop;

      // Always show navbar when at the top
      if (currentScrollY < 10) {
        setIsNavbarVisible(true);
        lastScrollY.current = currentScrollY;
        return;
      }

      // Check if scroll difference meets threshold
      if (Math.abs(currentScrollY - lastScrollY.current) < scrollThreshold) {
        return;
      }

      // Hide when scrolling down, show when scrolling up
      if (currentScrollY > lastScrollY.current) {
        setIsNavbarVisible(false);
      } else {
        setIsNavbarVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    // Throttle scroll events for better performance
    let ticking = false;
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

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <div className="relative flex">
        <VendorSidebar
          logo={logo}
          sections={sections}
          mobileOpen={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
          isCollapsed={!sidebarOpen}
        />

        <button
          onClick={toggleSidebar}
          className="absolute top-4 -right-3 z-50 bg-white border border-gray-200 rounded-full p-1.5 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-110"
          aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          {sidebarOpen ? (
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-600" />
          )}
        </button>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <VendorNavbar
          onMobileMenuClick={() => setMobileSidebarOpen(true)}
          onMenuClick={toggleSidebar}
          isSidebarOpen={sidebarOpen}
          menuItems={searchMenuItems}
          isVisible={isNavbarVisible}
        />

        <main 
          ref={mainContentRef}
          className="flex-1 overflow-y-auto bg-grey-50"
        >
          {/* Add padding top to account for fixed navbar */}
          <div className="pt-16">
            <div className="p-2 sm:p-4">{main}</div>
          </div>
        </main>
      </div>
    </div>
  );
}

// Import all icons used
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
  Upload,
  Clock,
  Tag,
  AlertCircle,
  TrendingUp,
  FileText,
  Percent,
  Send,
  Crown,
  Users,
  Store,
  CreditCard,
  Receipt,
  PieChart,
  Download,
  User,
  Lock,
  Building,
  Wallet,
  MessageCircle,
  Layers,
  CheckCircle,
  RotateCcw,
  XCircle,
  Database,
  FolderOpen,
  StoreIcon,
} from "lucide-react";

// Protected wrapper
export default function ProtectedVendorLayout({ main }: { main: ReactNode }) {
  return (
    <PrivateRoute allowedRoles={["VENDOR"]}>
      <VendorLayout main={main} />
    </PrivateRoute>
  );
}