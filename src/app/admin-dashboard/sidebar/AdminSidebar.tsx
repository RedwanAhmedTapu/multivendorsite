// src/components/layouts/sidebar/AdminSidebar.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, LogOut, X } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
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

type AdminSidebarProps = {
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

export function AdminSidebar({
  logo,
  sections,
  mobileOpen = false,
  onClose,
  isCollapsed = false,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();

  const { user } = useSelector((state: RootState) => state.auth);
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
      router.push("/login");
    } catch {
      dispatch(clearAuth());
      router.push("/login");
    }
  };

  const getUserInitials = (name?: string) => {
    if (!name) return "A";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const renderCollapsed = isCollapsed;

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[2px] lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          admin-sidebar-aside relative flex h-screen flex-col
          transition-[width] duration-300 ease-in-out overflow-hidden
          max-lg:fixed max-lg:inset-y-0 max-lg:left-0 max-lg:z-50
          max-lg:transition-transform
          ${mobileOpen ? "max-lg:translate-x-0" : "max-lg:-translate-x-full"}
        `}
        style={{
          backgroundColor: "#fbfbff",
          borderRight: "1px solid #eceeff",
        }}
      >
        <style jsx>{`
          .admin-sidebar-nav::-webkit-scrollbar {
            display: none;
          }
        `}</style>

        {/* Ambient top glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -left-16 h-56 w-56 rounded-full opacity-[0.16] blur-3xl"
          style={{ background: "radial-gradient(circle, #6366f1, transparent 70%)" }}
        />

        {/* ── Brand ── */}
        <div className={`relative shrink-0 ${renderCollapsed ? "px-2 py-6" : "px-5 pt-6 pb-5"}`}>
          {renderCollapsed ? (
            <div className="flex justify-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] shadow-[0_8px_20px_-6px_rgba(79,70,229,0.55)]">
                <span className="text-base font-black text-white">
                  {logo.title.charAt(0)}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {logo.icon && (
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] shadow-[0_6px_16px_-6px_rgba(79,70,229,0.55)]">
                    <logo.icon className="h-[18px] w-[18px] text-white" />
                  </div>
                )}
                <div className="min-w-0">
                  <h1 className="truncate text-[15px] font-black leading-tight tracking-tight text-slate-900">
                    {logo.title}
                  </h1>
                  {logo.subtitle && (
                    <p className="mt-0.5 truncate text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-400">
                      {logo.subtitle}
                    </p>
                  )}
                </div>
              </div>
              {mobileOpen && (
                <button
                  onClick={onClose}
                  className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 lg:hidden"
                  aria-label="Close menu"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Navigation ── */}
        <nav
          className={`admin-sidebar-nav relative flex-1 space-y-0.5 overflow-y-auto pb-4 ${
            renderCollapsed ? "px-2" : "px-3"
          }`}
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}
        >
          {sections.map((section, sIdx) => (
            <div key={sIdx} className={sIdx > 0 ? "mt-4 border-t border-slate-100 pt-4" : ""}>
              {section.items.map((item) => {
                const parentActive = isParentActive(item.subItems);
                return (
                  <div key={item.title} className="mb-0.5">
                    {item.subItems ? (
                      <div>
                        <button
                          onClick={() => !renderCollapsed && toggleMenu(item.title)}
                          title={renderCollapsed ? item.title : undefined}
                          className={`
                            group flex w-full items-center justify-between rounded-xl
                            py-2.5 text-left transition-all duration-200
                            ${renderCollapsed ? "px-0" : "px-3"}
                            ${
                              parentActive
                                ? "bg-gradient-to-r from-[#4f46e5] to-[#6366f1] text-white shadow-[0_6px_16px_-6px_rgba(79,70,229,0.6)]"
                                : "text-slate-600 hover:bg-indigo-50/70"
                            }
                          `}
                        >
                          <div className={`flex items-center gap-3 ${renderCollapsed ? "w-full justify-center" : ""}`}>
                            <item.icon
                              className={`h-[18px] w-[18px] shrink-0 ${
                                parentActive ? "text-white" : item.color || "text-slate-400"
                              }`}
                            />
                            {!renderCollapsed && (
                              <span className="truncate text-[13.5px] font-semibold">
                                {item.title}
                                {item.badge && (
                                  <span
                                    className={`ml-2 rounded-full px-1.5 py-0.5 text-[9px] font-black ${
                                      parentActive ? "bg-white/25 text-white" : "bg-rose-100 text-rose-500"
                                    }`}
                                  >
                                    {item.badge}
                                  </span>
                                )}
                              </span>
                            )}
                          </div>
                          {!renderCollapsed && (
                            <ChevronDown
                              className={`h-4 w-4 shrink-0 transition-transform duration-300 ${
                                parentActive ? "text-white/80" : "text-slate-300"
                              } ${openMenus[item.title] ? "rotate-180" : ""}`}
                            />
                          )}
                        </button>

                        {!renderCollapsed && (
                          <div
                            className="overflow-hidden"
                            style={{
                              maxHeight: openMenus[item.title]
                                ? `${item.subItems.length * 36 + 12}px`
                                : "0px",
                              opacity: openMenus[item.title] ? 1 : 0,
                              transition: "max-height 350ms ease-in-out, opacity 250ms ease-in-out",
                            }}
                          >
                            <div className="relative ml-[19px] mt-1 space-y-0.5 border-l border-slate-200 pb-1 pl-5">
                              {item.subItems.map((sub) => {
                                const active = isActive(sub.href);
                                return (
                                  <Link
                                    key={sub.title}
                                    href={sub.href}
                                    onClick={onClose}
                                    className="relative flex items-center gap-2 rounded-lg py-1.5 pl-2 pr-2 text-[12.5px] transition-colors duration-150"
                                  >
                                    <span
                                      className={`absolute -left-[21px] top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full transition-colors ${
                                        active ? "bg-[#4f46e5]" : "bg-slate-300"
                                      }`}
                                    />
                                    <span
                                      className={
                                        active
                                          ? "font-bold text-[#4f46e5]"
                                          : "font-medium text-slate-500 hover:text-[#4f46e5]"
                                      }
                                    >
                                      {sub.title}
                                    </span>
                                    {sub.badge && (
                                      <span className="ml-auto rounded-full bg-rose-100 px-1.5 py-0.5 text-[9px] font-black text-rose-500">
                                        {sub.badge}
                                      </span>
                                    )}
                                  </Link>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <Link
                        href={item.href}
                        onClick={onClose}
                        title={renderCollapsed ? item.title : undefined}
                        className={`
                          flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200
                          ${renderCollapsed ? "justify-center" : ""}
                          ${
                            isActive(item.href)
                              ? "bg-gradient-to-r from-[#4f46e5] to-[#6366f1] text-white shadow-[0_6px_16px_-6px_rgba(79,70,229,0.6)]"
                              : "text-slate-600 hover:bg-indigo-50/70"
                          }
                        `}
                      >
                        <item.icon
                          className={`h-[18px] w-[18px] shrink-0 ${
                            isActive(item.href) ? "text-white" : item.color || "text-slate-400"
                          }`}
                        />
                        {!renderCollapsed && (
                          <span className="truncate text-[13.5px] font-semibold">
                            {item.title}
                            {item.badge && (
                              <span
                                className={`ml-2 rounded-full px-1.5 py-0.5 text-[9px] font-black ${
                                  isActive(item.href) ? "bg-white/25 text-white" : "bg-rose-100 text-rose-500"
                                }`}
                              >
                                {item.badge}
                              </span>
                            )}
                          </span>
                        )}
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </nav>

        {/* ── Footer — user card + logout ── */}
        <div className={`shrink-0 border-t border-slate-100 ${renderCollapsed ? "p-2" : "p-3"}`}>
          {!renderCollapsed ? (
            <div className="space-y-3">
              {/* User Info Card */}
              <div className="rounded-xl border border-slate-100 bg-white/70 p-3">
                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] text-sm font-bold text-white shadow-[0_4px_10px_-4px_rgba(79,70,229,0.45)]">
                      {getUserInitials(user?.name)}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-rose-500 border-2 border-white" title={user?.role} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-bold text-slate-900">
                      {user?.name || "Admin"}
                    </p>
                    <p className="truncate text-[11px] text-slate-400">
                      {user?.email || user?.phone || "No contact"}
                    </p>
                    <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                      {user?.role?.toLowerCase() || "admin"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Logout */}
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-100 bg-white px-4 py-2.5 text-sm font-semibold text-rose-500 transition-all duration-200 hover:border-rose-200 hover:bg-rose-50 disabled:opacity-50"
              >
                {isLoggingOut ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-rose-500 border-t-transparent" />
                ) : (
                  <>
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Avatar */}
              <div className="relative mx-auto h-10 w-10">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] text-sm font-bold text-white shadow-[0_4px_10px_-4px_rgba(79,70,229,0.45)]">
                  {getUserInitials(user?.name)}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-rose-500 border-2 border-white" title={user?.role} />
              </div>

              {/* Logout */}
              <div className="flex justify-center">
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="rounded-xl p-2.5 text-rose-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                  title="Logout"
                >
                  {isLoggingOut ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-rose-500 border-t-transparent" />
                  ) : (
                    <LogOut className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}