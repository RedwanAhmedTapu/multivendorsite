// components/vendor/layout/sidebar/VendorSidebar.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, LogOut, X, User, Store } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store/store";
import { useLogoutMutation } from "@/features/authApi";
import { clearAuth } from "@/features/authSlice";

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

type Logo = {
  icon: Icon;
  title: string;
  subtitle?: string;
  iconBgColor?: string;
};

type VendorSidebarProps = {
  logo: Logo;
  sections: SidebarSection[];
  mobileOpen?: boolean;
  onClose?: () => void;
  isCollapsed?: boolean;
};

export function VendorSidebar({
  logo,
  sections,
  mobileOpen = false,
  onClose,
  isCollapsed = false,
}: VendorSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();
  const [openMenus, setOpenMenus] = useState<{ [key: string]: boolean }>({});

  // Get auth state from Redux
  const { user } = useSelector((state: RootState) => state.auth);

  // Logout mutation
  const [logoutMutation, { isLoading: isLoggingOut }] = useLogoutMutation();

  const toggleMenu = (title: string) => {
    setOpenMenus((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  const isActive = (href: string) => pathname === href;
  const isParentActive = (subItems?: MenuItem[]) =>
    subItems?.some((item) => pathname === item.href) || false;

  const handleLogout = async () => {
    try {
      await logoutMutation().unwrap();
      dispatch(clearAuth());
      router.push("/vendor/login");
    } catch (error) {
      console.error("Logout failed:", error);
      // Still logout locally even if API fails
      dispatch(clearAuth());
      router.push("/vendor/login");
    }
  };

  // Get user initials for avatar
  const getUserInitials = (name?: string) => {
    if (!name) return "V";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Get vendor-specific badge color
  const getVendorBadgeColor = (vendorType?: string) => {
    switch (vendorType?.toUpperCase()) {
      case "PREMIUM":
        return "bg-purple-500";
      case "PARTNER":
        return "bg-blue-500";
      case "VERIFIED":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:relative inset-y-0 left-0 z-50
          bg-white border-r border-gray-200
          transition-all duration-300 ease-in-out
          ${isCollapsed ? "w-20" : "w-64"}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          flex flex-col h-screen overflow-hidden
        `}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`${
                logo.iconBgColor || "bg-teal-500"
              } p-2 rounded-lg flex items-center justify-center flex-shrink-0`}
            >
              <logo.icon className="w-6 h-6 text-white" />
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden">
                <h1 className="text-lg font-bold text-gray-900 truncate">
                  {logo.title}
                </h1>
                {logo.subtitle && (
                  <p className="text-xs text-gray-500 truncate">
                    {logo.subtitle}
                  </p>
                )}
              </div>
            )}
          </div>
          {mobileOpen && (
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-md hover:bg-gray-100 flex-shrink-0"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-3">
          <style jsx>{`
            nav::-webkit-scrollbar {
              display: none;
            }
            nav {
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
          `}</style>

          {sections.map((section, sectionIdx) => (
            <ul key={sectionIdx} className="space-y-2">
              {section.items.map((item) => (
                <li key={item.title}>
                  {item.subItems ? (
                    /* Parent Menu with Dropdown */
                    <div className="space-y-2">
                      <button
                        onClick={() => toggleMenu(item.title)}
                        className={`
                          w-full flex items-center justify-between
                          px-3 py-2.5 rounded-lg text-left
                          transition-all duration-200 group
                          ${
                            isParentActive(item.subItems)
                              ? "bg-teal-50 text-teal-600"
                              : "text-gray-700 hover:bg-gray-100"
                          }
                        `}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <item.icon
                            className={`w-5 h-5 flex-shrink-0 ${
                              item.color || ""
                            } ${isCollapsed ? "mx-auto" : ""}`}
                          />
                          {!isCollapsed && (
                            <span className="font-medium text-sm truncate flex items-center gap-2">
                              {item.title}
                              {item.badge && (
                                <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                                  {item.badge}
                                </span>
                              )}
                            </span>
                          )}
                        </div>
                        {!isCollapsed && (
                          <ChevronDown
                            className={`w-4 h-4 transition-transform duration-400 ease-in-out flex-shrink-0 ${
                              openMenus[item.title] ? "rotate-180" : ""
                            }`}
                          />
                        )}
                      </button>

                      {/* Smooth & Slow Dropdown */}
                      <div
                        className={`
                          overflow-hidden transition-all duration-400 ease-in-out
                          ${openMenus[item.title] && !isCollapsed ? "mt-2" : ""}
                        `}
                        style={{
                          maxHeight:
                            openMenus[item.title] && !isCollapsed
                              ? "320px"
                              : "0px",
                          opacity:
                            openMenus[item.title] && !isCollapsed ? 1 : 0,
                          transition:
                            "max-height 400ms ease-in-out, opacity 400ms ease-in-out, margin 400ms ease-in-out",
                        }}
                      >
                        <ul className="ml-10 space-y-1.5 border-l-2 border-gray-200">
                          {item.subItems.map((subItem) => (
                            <li key={subItem.title}>
                              <Link
                                href={subItem.href}
                                onClick={onClose}
                                className={`
                                  flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm
                                  transition-all duration-200
                                  ${
                                    isActive(subItem.href)
                                      ? "bg-teal-50 text-teal-600 font-medium"
                                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                  }
                                `}
                              >
                                <subItem.icon className="w-4 h-4 flex-shrink-0" />
                                <span className="truncate flex items-center gap-2">
                                  {subItem.title}
                                  {subItem.badge && (
                                    <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                                      {subItem.badge}
                                    </span>
                                  )}
                                </span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ) : (
                    /* Regular Item */
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className={`
                        flex items-center gap-3 px-3 py-2.5 rounded-lg
                        transition-all duration-200 group
                        ${
                          isActive(item.href)
                            ? "bg-teal-50 text-teal-600 font-medium"
                            : "text-gray-700 hover:bg-gray-100"
                        }
                      `}
                    >
                      <item.icon
                        className={`w-5 h-5 flex-shrink-0 ${item.color || ""} ${
                          isCollapsed ? "mx-auto" : ""
                        }`}
                      />
                      {!isCollapsed && (
                        <span className="font-medium text-sm truncate">
                          {item.title}
                          {item.badge && (
                            <span className="ml-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                              {item.badge}
                            </span>
                          )}
                        </span>
                      )}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          ))}
        </nav>

        {/* Footer with User Info */}
        <div className="border-t border-gray-200 p-4 shrink-0">
          {!isCollapsed ? (
            <div className="space-y-3">
              {/* Store Info Card - Minimal */}
              <div className="bg-gradient-to-r from-teal-50 to-gray-50 rounded-lg p-3 border border-teal-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-teal-500 rounded-lg">
                    <Store className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 truncate">
                      {user?.vendor?.storeName || "My Store"}
                    </h3>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-teal-600 font-medium capitalize">
                        {user?.role?.toLowerCase() || "vendor"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Logout Button - Compact */}
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-white hover:bg-red-50 border border-red-200 text-red-600 rounded-lg transition-all duration-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed group"
                title="Sign out"
              >
                {isLoggingOut ? (
                  <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <LogOut className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                    <span>Logout</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            /* Collapsed State - Ultra Minimal */
            <div className="flex flex-col items-center space-y-3">
              {/* Store Icon */}
              <div className="relative group">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-sm">
                  <Store className="w-5 h-5 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-teal-500 border-2 border-white">
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-[8px] font-bold text-white">
                      {user?.role?.charAt(0) || "V"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Logout Button - Icon Only */}
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="p-2.5 hover:bg-red-50 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
                title="Sign out"
              >
                {isLoggingOut ? (
                  <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <LogOut className="w-5 h-5 text-red-500 group-hover:scale-110 transition-transform" />
                )}
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
