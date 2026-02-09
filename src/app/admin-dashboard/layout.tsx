// src/components/layouts/AdminProtectedLayout.tsx
"use client";

import { useState, ReactNode } from "react";
import { AdminSidebar } from "./sidebar/AdminSidebar";
import PrivateRoute from "@/components/privateroute/PrivateRoute";
import { AdminNavbar } from "./navbar/AdminNavbar";

import {
  User, Users, Layers, Box, Store, Shield, Tag, Layout, Monitor,
  Settings, PlusCircle, Mail, HelpCircle, Database, CreditCard,
  BarChart2, Home, ShoppingCart, FileText, Star, MapPin, Bell,
  Calendar, ChevronLeft, ChevronRight
} from "lucide-react";

type Icon = React.ComponentType<React.SVGProps<SVGSVGElement>>;

type MenuItem = {
  title: string;
  href: string;
  icon: Icon;
  color?: string;
  subItems?: MenuItem[];
};

type SidebarSection = {
  title?: string;
  items: MenuItem[];
};

type FlatMenuItem = {
  title: string;
  href: string;
  icon: Icon;
  keywords: string[];
};

// Fixed & strongly typed flattener
const flattenMenuItems = (sections: SidebarSection[]): FlatMenuItem[] => {
  const flat: FlatMenuItem[] = [];

  const addItem = (title: string, href: string, icon: Icon, parentTitle?: string) => {
    const baseKeywords = [
      title.toLowerCase(),
      ...title.toLowerCase().split(" "),
    ];
    if (parentTitle) {
      baseKeywords.push(parentTitle.toLowerCase());
      baseKeywords.push(...parentTitle.toLowerCase().split(" "));
    }
    flat.push({
      title,
      href,
      icon,
      keywords: [...new Set(baseKeywords)],
    });
  };

  sections.forEach((section) => {
    section.items.forEach((item) => {
      // Add parent item (even if href="#", we'll make it point to first sub-item if exists)
      const effectiveHref =
        item.href !== "#" ? item.href : item.subItems?.[0]?.href || "#";

      addItem(item.title, effectiveHref, item.icon, section.title);

      // Add all sub-items
      item.subItems?.forEach((sub) => {
        addItem(sub.title, sub.href, sub.icon, item.title);
      });
    });
  });

  return flat;
};

function AdminLayout({ main }: { main: ReactNode }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const logo = {
    icon: Layers,
    title: "FinixMart",
    subtitle: "Admin Dashboard",
    iconBgColor: "bg-teal-500",
  };

  const sections: SidebarSection[] = [
    {
      title: "Dashboard",
      items: [
        { title: "Dashboard", href: "/admin-dashboard", icon: Home, color: "text-teal-600" },
      ],
    },
    {
      title: "Vendor Management",
      items: [
        {
          title: "Vendors",
          href: "#",
          icon: Store,
          subItems: [
            { title: "All Vendors", href: "/admin-dashboard/vendormanage/vendor-approval", icon: Users },
            { title: "Payouts & Commissions", href: "/admin-dashboard/vendormanage/payout-commission", icon: CreditCard },
            { title: "Performance", href: "/admin-dashboard/vendormanage/performance", icon: BarChart2 },
            { title: "Promotional Offers", href: "/admin-dashboard/vendormanage/promotions", icon: Tag },
            { title: "Monthly Charges", href: "/admin-dashboard/vendormanage/monthly-charges", icon: Calendar },
          ],
        },
      ],
    },
    {
      title: "Customer Management",
      items: [
        {
          title: "Customers",
          href: "#",
          icon: Users,
          subItems: [
            { title: "All Customers", href: "/admin-dashboard/customer-manage/accountmanage", icon: User },
            { title: "Wallet & Loyalty", href: "/admin-dashboard/customer-manage/wallet-loyalty", icon: CreditCard },
            { title: "Feedback & Reviews", href: "/admin-dashboard/customer-manage/customer-review", icon: Star },
            { title: "Complaints", href: "/admin/customers/complaints", icon: HelpCircle },
          ],
        },
      ],
    },
     {
      title: "Employee Management",
      items: [
        {
          title: "Employees",
          href: "#",
          icon: Users,
          subItems: [
            { title: "All Employees", href: "/admin-dashboard/employees", icon: User },
            { title: "Add Employee", href: "/admin-dashboard/employees/add", icon: PlusCircle },
            { title: "Roles & Permissions", href: "/admin-dashboard/employees/roles-permissions", icon: Shield },
            { title: "Task Management", href: "/admin-board/employees/tasks", icon: Calendar },
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
          icon: FileText,
          subItems: [
            { title: "All Orders", href: "/admin/orders/list", icon: Database },
            { title: "Refunds & Returns", href: "/admin/orders/refunds", icon: CreditCard },
            { title: "Order Notifications", href: "/admin/orders/notifications", icon: Bell },
            { title: "Cancellations", href: "/admin/orders/cancellations", icon: Calendar },
          ],
        },
      ],
    },
    {
      title: "Category Management",
      items: [
        {
          title: "Category",
          href: "#",
          icon: Box,
          subItems: [
            { title: "Categories", href: "/admin-dashboard/category/category-manage", icon: Layers },
            { title: "Bulk Categories", href: "/admin-dashboard/category/bulk-category-upload", icon: Layers },
          ],
        },
      ],
    },
    {
      title: "Product Management",
      items: [
        {
          title: "Products",
          href: "#",
          icon: Box,
          subItems: [
            { title: "All Products", href: "/admin-dashboard/products", icon: Database },
            { title: "Categories", href: "/admin-dashboard/category-manage", icon: Layers },
            { title: "Bulk Categories", href: "/admin-dashboard/bulk-category-upload", icon: Layers },
          ],
        },
      ],
    },
    {
      title: "Shipping & Delivery",
      items: [
        {
          title: "Courier & Shipping",
          href: "#",
          icon: MapPin,
          subItems: [
            { title: "couriercredentials", href: "/admin-dashboard/courier/credentials", icon: Settings },
            { title: "courierprovider", href: "/admin-dashboard/courier", icon: Settings },
          ],
        },
      ],
    },
     {
      title: "Ads & Promotions",
      items: [
        {
          title: "Offers & Coupons",
          href: "#",
          icon: Tag,
          subItems: [
            { title: "All Offers", href: "/admin-dashboard/offer-manage", icon: Database },
            { title: "Add Offer", href: "/admin-dashboard/offer-manage/add-offer", icon: PlusCircle },
            { title: "Email & SMS Campaigns", href: "/admin/promotions/email-sms", icon: Mail },
            { title: "Ad Spaces", href: "/admin/promotions/ads", icon: Monitor },
          ],
        },
        { title: "Premium Membership", href: "/admin/promotions/premium", icon: Star },
      ],
    },
    
    {
      title: "Reports & Analytics",
      items: [
        { title: "Sales & Revenue", href: "/admin/reports/sales", icon: BarChart2 },
        { title: "Product Analysis", href: "/admin/reports/products", icon: Box },
        { title: "Customer Insights", href: "/admin/reports/customers", icon: Users },
        { title: "Real-Time Monitoring", href: "/admin/reports/real-time", icon: Monitor },
      ],
    },
   
   
    {
      title: "Settings",
      items: [
        { title: "Themes & Layouts", href: "/admin-dashboard/theme-manage", icon: Layout },
        { title: "SEO & Marketing", href: "/admin/settings/seo-marketing", icon: BarChart2 },
        { title: "Third-Party Integrations", href: "/admin/settings/integrations", icon: Settings },
        { title: "Terms & Conditions", href: "/admin-dashboard/settings/terms", icon: FileText },
        { title: "Footer Settings", href: "/admin-dashboard/settings/footer", icon: FileText },
      ],
    },
    {
      title: "Content Management",
      items: [
        { title: "Banners", href: "/admin-dashboard/banners", icon: Layout },
        { title: "Blogs", href: "/admin-dashboard/content/blogs", icon: FileText },
        { title: "FAQ", href: "/admin-dashboard/content/faq", icon: HelpCircle },
      ],
    },
  ];

  // This now works 100%
  const searchMenuItems = flattenMenuItems(sections);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <div className="relative flex">
        <AdminSidebar
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
        <AdminNavbar
          onMobileMenuClick={() => setMobileSidebarOpen(true)}
          onMenuClick={toggleSidebar}
          isSidebarOpen={sidebarOpen}
          showMenuButton={false}
          menuItems={searchMenuItems}
        />

        <main className="flex-1 overflow-y-auto bg-grey-50 ">
          <div className="p-2 sm:p-4">{main}</div>
        </main>
      </div>
    </div>
  );
}

export default function AdminProtectedLayout({ main }: { main: ReactNode }) {
  return (
    <PrivateRoute allowedRoles={["ADMIN"]}>
      <AdminLayout main={main} />
    </PrivateRoute>
  );
}