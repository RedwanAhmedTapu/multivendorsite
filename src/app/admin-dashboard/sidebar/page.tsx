"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuSubItem,
  SidebarSeparator,
  SidebarProvider,
  SidebarHeader,
} from "@/components/ui/sidebar";
import {
  PlusCircle,
  Edit,
  Settings,
  FileText,
  ChevronDown,
  Users,
  BarChart2,
  Layers,
  Database,
  Shield,
  MessageSquare,
  Calendar,
  HelpCircle,
  Mail,
  LogOut,
  User,
  Book,
  Store,
  UserPlus,
  Monitor,
  Layout,
  Tag,
  Box,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

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
  isGroup?: boolean;
};

type SidebarProps = {
  logo: {
    icon: Icon;
    title: string;
    subtitle: string;
    iconBgColor?: string;
  };
  sections: SidebarSection[];
  footer: {
    user: {
      name: string;
      email: string;
      avatar?: string;
    };
    logoutAction: () => void;
  };
  className?: string;
};

export function CustomSidebar({
  logo,
  sections,
  footer,
  className = "",
}: SidebarProps) {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (group: string) => {
    setOpenGroups((prev) => {
      const isOpen = prev[group];
      return isOpen ? {} : { [group]: true };
    });
  };

  return (
    <SidebarProvider>
      <Sidebar
        className={`h-screen bg-gray-900 w-64 relative flex flex-col text-white border-r border-gray-800 ${className}`}
      >
        {/* Header */}
        <SidebarHeader className="p-4 border-b bg-gray-900 border-gray-800">
          <div className="flex items-center gap-3">
            <div className={`p-2 ${logo.iconBgColor || 'bg-teal-500'} rounded-lg`}>
              <logo.icon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">{logo.title}</h2>
              <p className="text-xs text-gray-400">{logo.subtitle}</p>
            </div>
          </div>
        </SidebarHeader>
        
        {/* Content */}
        <SidebarContent
          className="flex-1 bg-gray-900 overflow-auto py-4
               [-ms-overflow-style:none]  
               [scrollbar-width:none]    
               [&::-webkit-scrollbar]:hidden
          "
        >
          {sections.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              {section.title && (
                <div className="px-4 pb-2 text-xs uppercase text-gray-500 font-medium tracking-wider">
                  {section.title}
                </div>
              )}

              <SidebarGroup>
                <SidebarMenu>
                  {section.items.map((item, itemIndex) => (
                    <div key={itemIndex}>
                      {item.subItems ? (
                        <>
                          <SidebarMenuItem
                            className="pl-4 hover:bg-gray-800 rounded-md mx-2 transition-colors duration-200"
                            onClick={() => toggleGroup(item.title)}
                          >
                            <div className="flex items-center justify-between w-full cursor-pointer py-2">
                              <div className="flex items-center gap-3">
                                <item.icon
                                  className={`h-4 w-4 ${
                                    item.color || "text-gray-300"
                                  }`}
                                />
                                <span className="text-sm text-gray-100">{item.title}</span>
                              </div>
                              <ChevronDown
                                className={`h-4 w-4 transition-transform duration-200 text-gray-400 ${
                                  openGroups[item.title] ? "rotate-180" : ""
                                }`}
                              />
                            </div>
                          </SidebarMenuItem>

                          <AnimatePresence>
                            {openGroups[item.title] && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <SidebarGroupContent>
                                  {item.subItems.map((subItem, subIndex) => (
                                    <SidebarMenuSubItem
                                      key={subIndex}
                                      className="pl-12 hover:bg-gray-800 rounded-md mx-2 transition-colors duration-200"
                                    >
                                      <Link
                                        href={subItem.href}
                                        className="flex items-center gap-3 py-2"
                                      >
                                        <subItem.icon
                                          className={`h-4 w-4 ${
                                            subItem.color || "text-gray-300"
                                          }`}
                                        />
                                        <span className="text-sm text-gray-300">
                                          {subItem.title}
                                        </span>
                                      </Link>
                                    </SidebarMenuSubItem>
                                  ))}
                                </SidebarGroupContent>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </>
                      ) : (
                        <SidebarMenuItem className="pl-4 hover:bg-gray-800 rounded-md mx-2 transition-colors duration-200">
                          <Link
                            href={item.href}
                            className="flex items-center gap-3 w-full py-2"
                          >
                            <item.icon
                              className={`h-4 w-4 ${
                                item.color || "text-gray-300"
                              }`}
                            />
                            <span className="text-sm text-gray-100">{item.title}</span>
                          </Link>
                        </SidebarMenuItem>
                      )}
                    </div>
                  ))}
                </SidebarMenu>
              </SidebarGroup>

              {sectionIndex < sections.length - 1 && (
                <SidebarSeparator className="my-4 bg-gray-800" />
              )}
            </div>
          ))}
        </SidebarContent>

        {/* Footer */}
        <SidebarFooter className="p-4 border-t bg-gray-900 border-gray-800">
          <div className="flex items-center gap-3">
            {footer.user.avatar ? (
              <div className="h-9 w-9 rounded-full bg-teal-600 flex items-center justify-center">
                {/* Avatar image would go here */}
              </div>
            ) : (
              <div className="h-9 w-9 rounded-full bg-teal-600 flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white leading-none truncate">
                {footer.user.name}
              </div>
              <div className="text-xs text-gray-400 truncate">
                {footer.user.email}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
              onClick={footer.logoutAction}
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>
    </SidebarProvider>
  );
}

// Example usage as an AdminSidebar
export function AdminSidebar() {
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
    user: {
      name: "Admin User",
      email: "admin@acme.com",
    },
    logoutAction: () => {
      // Handle logout logic
      console.log("Logging out...");
    },
  };

  return <CustomSidebar logo={logo} sections={sections} footer={footer} />;
}

export default AdminSidebar;