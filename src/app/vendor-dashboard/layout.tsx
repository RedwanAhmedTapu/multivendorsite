"use client";

import { useState, ReactNode } from "react";
import { VendorSidebar } from "./sidebar/VendorSidebar";
import { VendorNavbar } from "./navbar/VendorNavbar";
import {
  User,
  Layers,
  Box,
  Store,
  Users,
  Tag,
  HelpCircle,
  Mail,
  Database,
  PlusCircle,
} from "lucide-react";
import PrivateRoute from "@/components/privateroute/PrivateRoute";

type VendorLayoutProps = {
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

function VendorLayout({ main }: VendorLayoutProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const logo = {
    icon: Layers,
    title: "FinixMart Vendor",
    subtitle: "Vendor Dashboard",
    iconBgColor: "bg-teal-500",
  };

  const sections: SidebarSection[] = [
    {
      title: "Management",
      items: [
        {
          title: "Products",
          href: "#",
          icon: Box,
          color: "text-teal-300",
          subItems: [
            { title: "Add Product", href: "/vendor-dashboard/products-add", icon: Database },
            { title: "Manage Products", href: "/vendor/products/add", icon: PlusCircle },
          ],
        },
        { title: "Orders and Reviews", href: "/vendor/orders-reviews", icon: Store, color: "text-teal-300" },
        { title: "Customers", href: "/vendor/customers", icon: Users, color: "text-teal-300" },
        {
          title: "Offers",
          href: "#",
          icon: Tag,
          color: "text-teal-300",
          subItems: [
            { title: "All Offers", href: "/vendor/offers/list", icon: Database },
            { title: "Add Offer", href: "/vendor/offers/add", icon: PlusCircle },
          ],
        },
      ],
    },
    {
      title: "Support",
      items: [
        { title: "Help Center", href: "/vendor/help", icon: HelpCircle, color: "text-teal-300" },
        { title: "Contact Support", href: "/vendor/contact", icon: Mail, color: "text-teal-300" },
      ],
    },
  ];

  const footer = {
    user: { name: "Vendor User", email: "vendor@acme.com" },
    logoutAction: () => console.log("Vendor Logout!"),
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <VendorSidebar
        logo={logo}
        sections={sections}
        footer={footer}
        mobileOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-shrink-0">
          <VendorNavbar onMobileMenuClick={() => setMobileSidebarOpen((prev) => !prev)} />
        </div>

        <main className="flex-1 px-2 py-1 overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {main}
        </main>
      </div>
    </div>
  );
}

// ✅ Correct way: wrap VendorLayout with PrivateRoute JSX
export default function ProtectedVendorLayout({ main }: { main: ReactNode }) {
  return (
    <PrivateRoute allowedRoles={["VENDOR"]}>
      <VendorLayout main={main} />
    </PrivateRoute>
  );
}
