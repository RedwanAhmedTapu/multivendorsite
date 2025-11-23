// src/components/layouts/AdminProtectedLayout.tsx
"use client";

import { useState, ReactNode } from "react";
import { AdminSidebar } from "./sidebar/AdminSidebar";
import PrivateRoute from "@/components/privateroute/PrivateRoute";

import {
  User,
  UserPlus,
  Users,
  Layers,
  Box,
  Store,
  Shield,
  Tag,
  Layout,
  Monitor,
  Settings,
  PlusCircle,
  Mail,
  HelpCircle,
  Database,
  CreditCard,
  BarChart2,
  AlertTriangle,
  Home,
  ShoppingCart,
  Truck,
  MapPin,
  Bell,
  Calendar,
  Star,
  FileText,
} from "lucide-react";

type AdminLayoutProps = {
  main: ReactNode;
};

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

function AdminLayout({ main }: AdminLayoutProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

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
        { title: "Dashboard", href: "/admin/dashboard", icon: Home, color: "text-teal-300" },
        { title: "POS", href: "/admin/pos", icon: ShoppingCart },
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
            // { title: "Add Vendor", href: "/admin/vendors/add", icon: UserPlus },
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
    // {
    //   title: "Delivery Management",
    //   items: [
    //     {
    //       title: "Delivery Personnel",
    //       href: "#",
    //       icon: Truck,
    //       subItems: [
    //         { title: "All Delivery Men", href: "/admin/delivery/list", icon: Users },
    //         { title: "Add Delivery Man", href: "/admin/delivery/add", icon: UserPlus },
    //         { title: "Performance Tracking", href: "/admin/delivery/performance", icon: BarChart2 },
    //         { title: "Payouts & Incentives", href: "/admin/delivery/payouts", icon: CreditCard },
    //         { title: "Customer Ratings", href: "/admin/delivery/ratings", icon: Star },
    //       ],
    //     },
    //   ],
    // },
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
      title: "Product Management",
      items: [
        {
          title: "Products",
          href: "#",
          icon: Box,
          subItems: [
            { title: "All Products", href: "/admin/products/list", icon: Database },
            { title: "Add Product", href: "/admin/products/add", icon: PlusCircle },
            { title: "Categories", href: "/admin-dashboard/category-manage", icon: Layers },
            { title: "Bulk Categories", href: "/admin-dashboard/bulk-category-upload", icon: Layers },
            // { title: "Brands", href: "/admin/brands/list", icon: Tag },
            { title: "Stock Status", href: "/admin/products/stock", icon: AlertTriangle },
          ],
        },
      ],
    },
    {
      title: "Shipping & Delivery",
      items: [
        {
          title: "Shipping",
          href: "#",
          icon: MapPin,
          subItems: [
            { title: "shippingprovider", href: "/admin-dashboard/shippingapi", icon: Settings },
            // { title: "Coverage Areas", href: "/admin/shipping/areas", icon: MapPin },
            // { title: "Real-Time Tracking", href: "/admin/shipping/tracking", icon: Truck },
          ],
        },
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
      title: "Settings",
      items: [
        // { title: "Business Settings", href: "/admin/settings/business", icon: Settings },
        // { title: "Payment Gateways", href: "/admin/settings/payments", icon: CreditCard },
        { title: "Themes & Layouts", href: "/admin/settings/themes", icon: Layout },
        { title: "SEO & Marketing", href: "/admin/settings/seo-marketing", icon: BarChart2 },
        // { title: "Backup & Restore", href: "/admin/settings/backup", icon: Database },
        { title: "Third-Party Integrations", href: "/admin/settings/integrations", icon: Settings },
        { title: "Terms & Conditions", href: "/admin-dashboard/settings/terms", icon: FileText },
      ],
    },
    {
      title: "Content Management",
      items: [
        { title: "Banners", href: "/admin-dashboard/banners", icon: Layout },
        { title: "Blogs", href: "/admin/content/blogs", icon: FileText },
        { title: "FAQ", href: "/admin/content/faq", icon: HelpCircle },
      ],
    },
  ];

  const footer = {
    user: { name: "Admin User", email: "admin@acme.com" },
    logoutAction: () => console.log("Logout!"),
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <AdminSidebar
        logo={logo}
        sections={sections}
        footer={footer}
        mobileOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 px-2 py-1 overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {main}
        </main>
      </div>
    </div>
  );
}

// Wrap AdminLayout inside PrivateRoute for admin role
export default function AdminProtectedLayout({ main }: { main: ReactNode }) {
  return (
    <PrivateRoute allowedRoles={["ADMIN"]}>
      <AdminLayout main={main} />
    </PrivateRoute>
  );
}
