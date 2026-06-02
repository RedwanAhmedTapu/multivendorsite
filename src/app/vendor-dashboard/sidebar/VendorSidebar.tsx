"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, LogOut, X } from "lucide-react";
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
  icon?: Icon;
  title: string;
  subtitle?: string;
};

type VendorSidebarProps = {
  logo: Logo;
  sections: SidebarSection[];
  mobileOpen?: boolean;
  onClose?: () => void;
  isCollapsed?: boolean;
};

function getDefaultOpenMenus(sections: SidebarSection[]): Record<string, boolean> {
  const map: Record<string, boolean> = {};
  sections.forEach((section) => {
    section.items.forEach((item) => {
      if (item.subItems) map[item.title] = true;
    });
  });
  return map;
}

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

  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>(
    () => getDefaultOpenMenus(sections)
  );

  const [logoutMutation, { isLoading: isLoggingOut }] = useLogoutMutation();

  const toggleMenu = (title: string) => {
    setOpenMenus((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const isActive = (href: string) => pathname === href;
  const isParentActive = (subItems?: MenuItem[]) =>
    subItems?.some((item) => pathname === item.href) || false;

  const handleLogout = async () => {
    try {
      await logoutMutation().unwrap();
      dispatch(clearAuth());
      router.push("/vendor/login");
    } catch {
      dispatch(clearAuth());
      router.push("/vendor/login");
    }
  };

  /*
   * KEY FIX: On desktop the sidebar is rendered as a normal in-flow element
   * (position: static) inside its wrapper div in VendorLayout.
   * On mobile it becomes fixed/off-canvas via the translate classes.
   * This eliminates the z-index/overlap issues entirely.
   */
  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          h-screen flex flex-col border-r border-transparent
          transition-all duration-300 ease-in-out overflow-hidden
          ${isCollapsed ? "w-20" : "w-72"}
          /* Mobile: fixed off-canvas, slides in */
          max-lg:fixed max-lg:inset-y-0 max-lg:left-0 max-lg:z-50
          ${mobileOpen ? "max-lg:translate-x-0" : "max-lg:-translate-x-full"}
        `}
        style={{ backgroundColor: "#f2f3ff" }}
      >
        {/* Brand */}
        <div className={`shrink-0 ${isCollapsed ? "px-3 py-6" : "px-8 py-6 mb-2"}`}>
          {isCollapsed ? (
            <div className="flex justify-center">
              <div className="w-10 h-10 rounded-lg bg-blue-700 flex items-center justify-center">
                <span className="text-white font-black text-sm">P</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-black text-blue-700 tracking-tight leading-tight">
                  {logo.title}
                </h1>
                {logo.subtitle && (
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold mt-0.5">
                    {logo.subtitle}
                  </p>
                )}
              </div>
              {mobileOpen && (
                <button
                  onClick={onClose}
                  className="lg:hidden p-1.5 rounded-md hover:bg-white/60 text-slate-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Nav */}
        <nav
          className="flex-1 overflow-y-auto px-4 pb-4 space-y-1"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}
        >
          <style jsx>{`
            nav::-webkit-scrollbar { display: none; }
          `}</style>

          {sections.map((section, sIdx) =>
            section.items.map((item) => (
              <div key={`${sIdx}-${item.title}`} className="mb-1">
                {item.subItems ? (
                  <div>
                    <button
                      onClick={() => !isCollapsed && toggleMenu(item.title)}
                      title={isCollapsed ? item.title : undefined}
                      className={`
                        w-full flex items-center justify-between
                        px-4 py-3 rounded-lg text-left transition-all duration-200
                        ${
                          isParentActive(item.subItems)
                            ? "bg-white text-blue-600 shadow-sm font-bold"
                            : "text-slate-600 hover:bg-white/50"
                        }
                      `}
                    >
                      <div className={`flex items-center gap-3 ${isCollapsed ? "justify-center w-full" : ""}`}>
                        <item.icon className={`w-5 h-5 flex-shrink-0 ${item.color || "text-slate-500"}`} />
                        {!isCollapsed && (
                          <span className="text-sm font-medium truncate">
                            {item.title}
                            {item.badge && (
                              <span className="ml-2 bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-black">
                                {item.badge}
                              </span>
                            )}
                          </span>
                        )}
                      </div>
                      {!isCollapsed && (
                        <ChevronDown
                          className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-300 ${
                            openMenus[item.title] ? "rotate-180" : ""
                          }`}
                        />
                      )}
                    </button>

                    {!isCollapsed && (
                      <div
                        className="overflow-hidden"
                        style={{
                          maxHeight: openMenus[item.title]
                            ? `${item.subItems.length * 38 + 16}px`
                            : "0px",
                          opacity: openMenus[item.title] ? 1 : 0,
                          transition: "max-height 350ms ease-in-out, opacity 300ms ease-in-out",
                        }}
                      >
                        <div className="pl-12 pt-1 pb-2 space-y-1">
                          {item.subItems.map((sub) => (
                            <Link
                              key={sub.title}
                              href={sub.href}
                              onClick={onClose}
                              className={`
                                flex items-center gap-2 text-[13px] py-1.5 px-2 rounded-md
                                transition-colors duration-150
                                ${
                                  isActive(sub.href)
                                    ? "text-blue-600 font-semibold bg-blue-50/70"
                                    : "text-slate-500 hover:text-blue-600"
                                }
                              `}
                            >
                              {sub.title}
                              {sub.badge && (
                                <span className="ml-auto bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-black">
                                  {sub.badge}
                                </span>
                              )}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    href={item.href}
                    onClick={onClose}
                    title={isCollapsed ? item.title : undefined}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-lg
                      transition-all duration-200
                      ${isCollapsed ? "justify-center" : ""}
                      ${
                        isActive(item.href)
                          ? "bg-white text-blue-600 shadow-sm font-bold"
                          : "text-slate-600 hover:bg-white/50"
                      }
                    `}
                  >
                    <item.icon className={`w-5 h-5 flex-shrink-0 ${item.color || "text-slate-500"}`} />
                    {!isCollapsed && (
                      <span className="text-sm font-medium truncate">
                        {item.title}
                        {item.badge && (
                          <span className="ml-2 bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-black">
                            {item.badge}
                          </span>
                        )}
                      </span>
                    )}
                  </Link>
                )}
              </div>
            ))
          )}
        </nav>

        {/* Footer — logout only */}
        <div className="shrink-0 border-t border-slate-200/60 p-4">
          {!isCollapsed ? (
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-red-50 border border-red-200 text-red-500 rounded-lg transition-all duration-200 text-sm font-medium disabled:opacity-50"
            >
              {isLoggingOut ? (
                <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </>
              )}
            </button>
          ) : (
            <div className="flex justify-center">
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                title="Logout"
              >
                {isLoggingOut ? (
                  <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <LogOut className="w-5 h-5 text-red-400 hover:text-red-600" />
                )}
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}