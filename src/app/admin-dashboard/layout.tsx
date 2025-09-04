"use client";

import { useState } from "react";
import { AdminSidebar } from "./sidebar/AdminSidebar";
// import { AdminNavbar } from "./navbar/page";
import {
  User,
  Layers,
  Box,
  Store,
  Users,
  Shield,
  Tag,
  Layout,
  Monitor,
  Settings,
  PlusCircle,
  Mail,
  HelpCircle,
  Database,
  UserPlus,
} from "lucide-react";

type AdminLayoutProps = {
  main: React.ReactNode;
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

export default function AdminLayout({ main }: AdminLayoutProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const toggleMobileSidebar = () => setMobileSidebarOpen((prev) => !prev);

  const logo = {
    icon: Layers,
    title: "FinixMart",
    subtitle: "Admin Dashboard",
    iconBgColor: "bg-teal-500",
  };

  const sections: SidebarSection[] = [
  {
    title: "Management",
    items: [
      {
        title: "Categories",
        href: "#",
        icon: Layers,
        color: "text-teal-300",
        subItems: [
          {
            title: "All Categories",
            href: "/admin/categories/list",
            icon: Database,
            color: "text-teal-300",
          },
          {
            title: "Add New",
            href: "/admin-dashboard/category-manage",
            icon: PlusCircle,
            color: "text-teal-300",
          },
        ],
      },
      {
        title: "Products",
        href: "#",
        icon: Box,
        color: "text-teal-300",
        subItems: [
          {
            title: "All Products",
            href: "/admin/products/list",
            icon: Database,
            color: "text-teal-300",
          },
          {
            title: "Add New",
            href: "/admin/products/add",
            icon: PlusCircle,
            color: "text-teal-300",
          },
        ],
      },
      {
        title: "Vendors",
        href: "#",
        icon: Store,
        color: "text-teal-300",
        subItems: [
          {
            title: "All Vendors",
            href: "/admin/vendors/list",
            icon: Users,
            color: "text-teal-300",
          },
          {
            title: "Add Vendor",
            href: "/admin/vendors/add",
            icon: UserPlus,
            color: "text-teal-300",
          },
        ],
      },
      {
        title: "Users",
        href: "#",
        icon: Users,
        color: "text-teal-300",
        subItems: [
          {
            title: "All Users",
            href: "/admin/users/list",
            icon: User,
            color: "text-teal-300",
          },
          {
            title: "Roles & Permissions",
            href: "/admin/users/roles",
            icon: Shield,
            color: "text-teal-300",
          },
        ],
      },
      {
        title: "Offers",
        href: "#",
        icon: Tag,
        color: "text-teal-300",
        subItems: [
          {
            title: "All Offers",
            href: "/admin/offers/list",
            icon: Database,
            color: "text-teal-300",
          },
          {
            title: "Add Offer",
            href: "/admin/offers/add",
            icon: PlusCircle,
            color: "text-teal-300",
          },
        ],
      },
      {
        title: "Design Layout",
        href: "#",
        icon: Layout,
        color: "text-teal-300",
        subItems: [
          {
            title: "Homepage Layout",
            href: "/admin/design/homepage",
            icon: Monitor,
            color: "text-teal-300",
          },
          {
            title: "Theme Settings",
            href: "/admin/design/theme",
            icon: Settings,
            color: "text-teal-300",
          },
        ],
      },
    ],
  },
  {
    title: "Support",
    items: [
      {
        title: "Help Center",
        href: "/admin/help",
        icon: HelpCircle,
        color: "text-teal-300",
      },
      {
        title: "Contact Support",
        href: "/admin/contact",
        icon: Mail,
        color: "text-teal-300",
      },
    ],
  },
];

  const footer = {
    user: { name: "Admin User", email: "admin@acme.com" },
    logoutAction: () => console.log("Logout!"),
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <AdminSidebar
        logo={logo}
        sections={sections}
        footer={footer}
        mobileOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />

      {/* Main content area (navbar + page) */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Navbar */}
        {/* <div className="flex-shrink-0">
          <AdminNavbar onMobileMenuClick={toggleMobileSidebar} />
        </div> */}

        {/* Page content */}
        <main className="flex-1 px-2 py-1 overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {main}
        </main>
      </div>
    </div>
  );
}
