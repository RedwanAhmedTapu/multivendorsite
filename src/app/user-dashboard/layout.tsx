"use client";

import { useState, ReactNode } from "react";
import { UserSidebar } from "./sidebar/Sidebar";
import PrivateRoute from "@/components/privateroute/PrivateRoute";
import { UserNavbar } from "./navbar/Navbar";
import {
  User, Home, ShoppingCart, Package, MapPin, Tag, Star,
  Heart, MessageSquare, Settings, LogOut, CreditCard,
  FileText, Shield, Bell, HelpCircle, Calendar, ChevronLeft,
  ChevronRight, Wallet, Gift, Truck, RefreshCcw, XCircle,
  History, Award, ShieldCheck,
  Clock,
  CheckCircle,
  Edit,
  Phone,
  Globe,
  Palette,
  Mail,
  Monitor,
  Eye
} from "lucide-react";

type Icon = React.ComponentType<React.SVGProps<SVGSVGElement>>;

type MenuItem = {
  title: string;
  href: string;
  icon: Icon;
  color?: string;
  badge?: string | number;
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
      const effectiveHref = item.href !== "#" ? item.href : item.subItems?.[0]?.href || "#";
      addItem(item.title, effectiveHref, item.icon, section.title);
      
      item.subItems?.forEach((sub) => {
        addItem(sub.title, sub.href, sub.icon, item.title);
      });
    });
  });

  return flat;
};

export default function UserProtectedLayout({ 
  children,
  main 
}: { 
  children: ReactNode;
  main: ReactNode;
}) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const logo = {
    icon: ShoppingCart,
    title: "FinixMart",
    subtitle: "My Account",
    iconBgColor: "bg-blue-500",
  };

  const sections: SidebarSection[] = [
    {
      title: "Dashboard",
      items: [
        { title: "Dashboard", href: "/user-dashboard", icon: Home, color: "text-blue-600" },
      ],
    },
    {
      title: "Manage My Account",
      items: [
        {
          title: "Account Settings",
          href: "#",
          icon: User,
          subItems: [
            { title: "My Profile", href: "/user-dashboard/profile", icon: User },
            { title: "Address Book", href: "/user-dashboard/address-book", icon: MapPin },
            { title: "Change Password", href: "/user-dashboard/change-password", icon: Shield },
            { title: "Privacy Settings", href: "/user-dashboard/privacy", icon: ShieldCheck },
          ],
        },
        {
          title: "Payment & Wallet",
          href: "#",
          icon: CreditCard,
          subItems: [
            { title: "Payment Methods", href: "/user-dashboard/payment-methods", icon: CreditCard },
            { title: "Wallet Balance", href: "/user-dashboard/wallet", icon: Wallet, badge: "$250" },
            { title: "Transaction History", href: "/user-dashboard/transactions", icon: History },
          ],
        },
      ],
    },
    {
      title: "My Orders",
      items: [
        {
          title: "Orders",
          href: "#",
          icon: Package,
          badge: 3,
          subItems: [
            { title: "All Orders", href: "/user-dashboard/orders", icon: Package },
            { title: "Pending Orders", href: "/user-dashboard/orders/pending", icon: Clock, badge: 2 },
            { title: "Shipped Orders", href: "/user-dashboard/orders/shipped", icon: Truck },
            { title: "Delivered Orders", href: "/user-dashboard/orders/delivered", icon: CheckCircle },
          ],
        },
        {
          title: "Order Issues",
          href: "#",
          icon: RefreshCcw,
          subItems: [
            { title: "My Returns", href: "/user-dashboard/returns", icon: RefreshCcw },
            { title: "My Cancellations", href: "/user-dashboard/cancellations", icon: XCircle },
            { title: "Refund Status", href: "/user-dashboard/refunds", icon: CreditCard },
          ],
        },
      ],
    },
    {
      title: "Vouchers & Rewards",
      items: [
        {
          title: "Voucher Center",
          href: "#",
          icon: Tag,
          subItems: [
            { title: "My Vouchers", href: "/user-dashboard/vouchers", icon: Tag, badge: 3 },
            { title: "Available Offers", href: "/user-dashboard/offers", icon: Gift },
            { title: "Reward Points", href: "/user-dashboard/rewards", icon: Award, badge: "1,250" },
          ],
        },
      ],
    },
    {
      title: "My Reviews & Feedback",
      items: [
        {
          title: "Reviews",
          href: "#",
          icon: Star,
          subItems: [
            { title: "My Reviews", href: "/user-dashboard/reviews", icon: Star },
            { title: "Write a Review", href: "/user-dashboard/reviews/write", icon: Edit },
            { title: "Product Ratings", href: "/user-dashboard/ratings", icon: Star },
          ],
        },
      ],
    },
    {
      title: "Wishlist & Favorites",
      items: [
        {
          title: "Wishlist",
          href: "/user-dashboard/wishlist",
          icon: Heart,
          badge: 12,
        },
        {
          title: "Recently Viewed",
          href: "/user-dashboard/recently-viewed",
          icon: Eye,
        },
      ],
    },
    {
      title: "Support & Help",
      items: [
        {
          title: "Customer Support",
          href: "#",
          icon: HelpCircle,
          subItems: [
            { title: "Live Chat", href: "/user-dashboard/support/chat", icon: MessageSquare },
            { title: "Help Center", href: "/user-dashboard/support/help", icon: HelpCircle },
            { title: "Contact Us", href: "/user-dashboard/support/contact", icon: Phone },
            { title: "FAQ", href: "/user-dashboard/support/faq", icon: FileText },
          ],
        },
        {
          title: "Complaints & Tickets",
          href: "/user-dashboard/support/tickets",
          icon: FileText,
          badge: 2,
        },
      ],
    },
    {
      title: "Account Security",
      items: [
        {
          title: "Security",
          href: "#",
          icon: Shield,
          subItems: [
            { title: "Login Activity", href: "/user-dashboard/security/login-activity", icon: History },
            { title: "Two-Factor Auth", href: "/user-dashboard/security/2fa", icon: Shield },
            { title: "Trusted Devices", href: "/user-dashboard/security/devices", icon: Monitor },
          ],
        },
        {
          title: "Notifications",
          href: "/user-dashboard/notifications",
          icon: Bell,
          badge: 5,
        },
      ],
    },
    {
      title: "Settings",
      items: [
        {
          title: "Preferences",
          href: "#",
          icon: Settings,
          subItems: [
            { title: "Language", href: "/user-dashboard/settings/language", icon: Globe },
            { title: "Theme", href: "/user-dashboard/settings/theme", icon: Palette },
            { title: "Email Preferences", href: "/user-dashboard/settings/email", icon: Mail },
          ],
        },
      ],
    },
    {
      items: [
        {
          title: "Logout",
          href: "/logout",
          icon: LogOut,
          color: "text-red-600",
        },
      ],
    },
  ];

  const searchMenuItems = flattenMenuItems(sections);

  const footer = {
    user: { 
      name: "John Doe", 
      email: "john.doe@example.com",
      avatar: "JD",
      membership: "Premium Member"
    },
    logoutAction: () => console.log("Logout!"),
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <PrivateRoute allowedRoles={["CUSTOMER"]}>
      <div className="flex min-h-screen bg-gray-50">
        {/* Sidebar */}
        <UserSidebar
          logo={logo}
          sections={sections}
          mobileOpen={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
          isCollapsed={!sidebarOpen}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Navbar - positioned relative to main content area, not full width */}
          <UserNavbar
            onMobileMenuClick={() => setMobileSidebarOpen(true)}
            onMenuClick={toggleSidebar}
            isSidebarOpen={sidebarOpen}
            showMenuButton={true}
            menuItems={searchMenuItems}
          />

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto bg-gray-50 p-4 pb-20  md:p-6 lg:p-8">
            {/* Render the @main slot if it exists, otherwise render children */}
            {main || children}
          </main>
        </div>

        {/* Sidebar Toggle Button */}
        <button
          onClick={toggleSidebar}
          className="fixed top-6 z-50 bg-white border border-gray-200 rounded-full p-1.5 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 hidden md:block"
          style={{
            left: sidebarOpen ? '280px' : '68px',
            transform: 'translateX(-50%)',
            transition: 'left 0.3s ease-in-out',
          }}
          aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          {sidebarOpen ? (
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-600" />
          )}
        </button>
      </div>
    </PrivateRoute>
  );
}