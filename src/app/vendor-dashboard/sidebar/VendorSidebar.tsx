// components/vendor/layout/sidebar/VendorSidebar.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, LogOut, X } from "lucide-react";

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

type Footer = {
  user: { name: string; email: string; avatar?: string };
  logoutAction: () => void;
};

type VendorSidebarProps = {
  logo: Logo;
  sections: SidebarSection[];
  footer?: Footer;
  mobileOpen?: boolean;
  onClose?: () => void;
  isCollapsed?: boolean;
};

export function VendorSidebar({
  logo,
  sections,
  footer,
  mobileOpen = false,
  onClose,
  isCollapsed = false,
}: VendorSidebarProps) {
  const pathname = usePathname();
  const [openMenus, setOpenMenus] = useState<{ [key: string]: boolean }>({});

  const toggleMenu = (title: string) => {
    setOpenMenus((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  const isActive = (href: string) => pathname === href;
  const isParentActive = (subItems?: MenuItem[]) =>
    subItems?.some((item) => pathname === item.href) || false;

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
          <div className="flex items-center gap-3">
            <div
              className={`${
                logo.iconBgColor || "bg-teal-500"
              } p-2 rounded-lg flex items-center justify-center`}
            >
              <logo.icon className="w-6 h-6 text-white" />
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden">
                <h1 className="text-lg font-bold text-gray-900 truncate">
                  {logo.title}
                </h1>
                {logo.subtitle && (
                  <p className="text-xs text-gray-500 truncate">{logo.subtitle}</p>
                )}
              </div>
            )}
          </div>
          {mobileOpen && (
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-md hover:bg-gray-100"
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
                        <div className="flex items-center gap-3 flex-1">
                          <item.icon
                            className={`w-5 h-5 flex-shrink-0 ${item.color || ""} ${
                              isCollapsed ? "mx-auto" : ""
                            }`}
                          />
                          {!isCollapsed && (
                            <span className="font-medium text-sm flex items-center gap-2">
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

                      {/* Smooth Dropdown */}
                      <div
                        className={`
                          overflow-hidden transition-all duration-400 ease-in-out
                          ${openMenus[item.title] && !isCollapsed ? "mt-2" : ""}
                        `}
                        style={{
                          maxHeight: openMenus[item.title] && !isCollapsed ? "320px" : "0px",
                          opacity: openMenus[item.title] && !isCollapsed ? 1 : 0,
                          transition: "max-height 400ms ease-in-out, opacity 400ms ease-in-out, margin 400ms ease-in-out",
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
                                <span className="flex items-center gap-2">
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
                        flex items-center px-3 py-2.5 rounded-lg
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
                        <span className="font-medium text-sm flex items-center gap-2">
                          {item.title}
                          {item.badge && (
                            <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
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

        {/* Footer */}
        {footer && (
          <div className="border-t border-gray-200 p-4 shrink-0">
            {!isCollapsed ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  {footer.user.avatar ? (
                    <img
                      src={footer.user.avatar}
                      alt={footer.user.name}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center text-white font-semibold text-sm">
                      {footer.user.name.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {footer.user.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {footer.user.email}
                    </p>
                  </div>
                </div>

                <button
                  onClick={footer.logoutAction}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200 text-sm font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <button
                onClick={footer.logoutAction}
                className="w-full flex justify-center p-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
      </aside>
    </>
  );
}