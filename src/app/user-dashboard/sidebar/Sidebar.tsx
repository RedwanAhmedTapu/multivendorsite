"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { useLogoutMutation } from "@/features/authApi";
import {
  ChevronDown,
  X,
  LogOut,
  HelpCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

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

type LogoProps = {
  icon: Icon;
  title: string;
  subtitle: string;
  iconBgColor: string;
};

interface UserSidebarProps {
  logo: LogoProps;
  sections: SidebarSection[];
  mobileOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
}

export function UserSidebar({
  logo: LogoData,
  sections,
  mobileOpen,
  onClose,
  isCollapsed = false,
}: UserSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);
  const [logoutMutation, { isLoading: isLoggingOut }] = useLogoutMutation();

  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ top: number; left: number } | null>(null);
  const itemRefs = useRef<Map<string, HTMLElement>>(new Map());

  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    const initialState: Record<string, boolean> = {};
    sections.forEach((section) => {
      section.items.forEach((item) => {
        if (item.subItems && item.subItems.length > 0) {
          initialState[item.title] = true;
        }
      });
    });
    return initialState;
  });

  const toggleSection = (title: string) => {
    setOpenSections((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const isActive = (href: string) => pathname === href;

  const handleLogout = async () => {
    try {
      await logoutMutation().unwrap();
      toast.success("Logged out successfully");
      router.push("/login");
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to logout");
    }
  };

  const getUserFirstName = () => {
    if (!user?.name) return "there";
    return user.name.split(" ")[0];
  };

  const getUserInitials = () => {
    if (!user?.name) return "U";
    const names = user.name.split(" ");
    if (names.length >= 2) return `${names[0][0]}${names[1][0]}`.toUpperCase();
    return user.name.substring(0, 2).toUpperCase();
  };

  const calculateTooltipPosition = (itemId: string) => {
    const el = itemRefs.current.get(itemId);
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return { top: rect.top + rect.height / 2, left: rect.right + 8 };
  };

  const handleItemHover = (itemId: string) => {
    setHoveredItem(itemId);
    const pos = calculateTooltipPosition(itemId);
    if (pos) setTooltipPosition(pos);
  };

  const handleItemLeave = (itemId: string) => {
    if (hoveredItem === itemId) {
      setHoveredItem(null);
      setTooltipPosition(null);
    }
  };

  useEffect(() => {
    if (!hoveredItem) return;
    const updatePos = () => {
      const pos = calculateTooltipPosition(hoveredItem);
      if (pos) setTooltipPosition(pos);
    };
    window.addEventListener("scroll", updatePos);
    window.addEventListener("resize", updatePos);
    return () => {
      window.removeEventListener("scroll", updatePos);
      window.removeEventListener("resize", updatePos);
    };
  }, [hoveredItem]);

  const SidebarContent = (
    <div className="h-full flex flex-col bg-[#f5f7f8] border-r border-slate-200 overflow-visible relative">

      {/* ── Greeting Header ── */}
      <div className="px-4 py-4 border-b border-slate-200 bg-[#f5f7f8]">
        {!isCollapsed ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] text-slate-400 font-medium uppercase tracking-widest">
                Welcome back
              </p>
              <h2 className="text-sm font-semibold text-slate-800 mt-0.5">
                Hi, {getUserFirstName()} 👋
              </h2>
            </div>
            {/* Mobile close button */}
            <button
              onClick={onClose}
              className="md:hidden p-1.5 hover:bg-slate-200 rounded-lg transition-colors"
              aria-label="Close sidebar"
            >
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        ) : (
          /* Collapsed: show initials avatar */
          <div className="flex justify-center">
            <div className="w-8 h-8 rounded-full bg-[#0052cc]/10 flex items-center justify-center text-[#0052cc] text-xs font-semibold">
              {getUserInitials()}
            </div>
          </div>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav
        className="flex-1 overflow-y-auto overflow-x-visible py-3 scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {sections.map((section, sectionIdx) => {
          const isLastSection = sectionIdx === sections.length - 1;
          const isFirstSection = sectionIdx === 0;

          return (
            <div key={sectionIdx}>
              {/* Horizontal divider between groups (skip before first) */}
              {!isFirstSection && (
                <div className="mx-3 my-2 border-t border-slate-200" />
              )}

              <div className={`px-2 ${isCollapsed ? "space-y-0.5" : "space-y-0.5"}`}>
                {section.items.map((item, itemIdx) => {
                  const hasSubItems = item.subItems && item.subItems.length > 0;
                  const isOpen = openSections[item.title];
                  const itemIsActive = isActive(item.href);
                  const itemId = `item-${sectionIdx}-${itemIdx}`;
                  const isLogout = item.href === "/logout" || item.color === "text-red-600";

                  return (
                    <div key={itemIdx}>
                      <div
                        className="relative"
                        ref={(el) => {
                          if (el) itemRefs.current.set(itemId, el);
                          else itemRefs.current.delete(itemId);
                        }}
                        onMouseEnter={() => isCollapsed && handleItemHover(itemId)}
                        onMouseLeave={() => isCollapsed && handleItemLeave(itemId)}
                      >
                        <Link
                          href={item.href}
                          onClick={(e) => {
                            if (hasSubItems) {
                              e.preventDefault();
                              toggleSection(item.title);
                            }
                            if (isLogout) {
                              e.preventDefault();
                              handleLogout();
                            }
                          }}
                          className={`
                            flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all duration-150 group
                            ${isCollapsed ? "justify-center" : "justify-between"}
                            ${
                              itemIsActive
                                ? "bg-[#0052cc]/10 text-[#0052cc]"
                                : isLogout
                                ? "text-red-500 hover:bg-red-50"
                                : "text-slate-600 hover:bg-white hover:shadow-sm"
                            }
                          `}
                        >
                          <div className={`flex items-center gap-2.5 min-w-0 ${isCollapsed ? "w-full justify-center" : ""}`}>
                            <item.icon
                              className={`w-4 h-4 flex-shrink-0 transition-colors
                                ${itemIsActive ? "text-[#0052cc]" : isLogout ? "text-red-500" : "text-slate-400 group-hover:text-slate-600"}
                              `}
                            />
                            {!isCollapsed && (
                              <span className={`text-sm font-medium truncate ${itemIsActive ? "text-[#0052cc]" : ""}`}>
                                {item.title}
                              </span>
                            )}
                          </div>

                          {!isCollapsed && (
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              {item.badge !== undefined && (
                                <span className={`px-1.5 py-0.5 text-[10px] rounded-full font-medium
                                  ${itemIsActive
                                    ? "bg-[#0052cc]/10 text-[#0052cc]"
                                    : "bg-[#0052cc]/10 text-[#0052cc]"
                                  }`}
                                >
                                  {item.badge}
                                </span>
                              )}
                              {hasSubItems && (
                                <ChevronDown
                                  className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                                />
                              )}
                            </div>
                          )}
                        </Link>
                      </div>

                      {/* Sub Items */}
                      {hasSubItems && !isLogout && (
                        <>
                          {/* Expanded */}
                          {isOpen && !isCollapsed && (
                            <div className="ml-3 mt-0.5 mb-0.5 pl-3 border-l-2 border-[#0052cc]/20 space-y-0.5">
                              {item.subItems!.map((subItem, subIdx) => (
                                <Link
                                  key={subIdx}
                                  href={subItem.href}
                                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-all duration-150 group
                                    ${isActive(subItem.href)
                                      ? "bg-[#0052cc]/10 text-[#0052cc]"
                                      : "text-slate-500 hover:bg-white hover:shadow-sm"
                                    }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <subItem.icon
                                      className={`w-3.5 h-3.5 flex-shrink-0 transition-colors
                                        ${isActive(subItem.href) ? "text-[#0052cc]" : "text-slate-400 group-hover:text-slate-500"}
                                      `}
                                    />
                                    <span className={`text-xs font-medium ${isActive(subItem.href) ? "text-[#0052cc]" : ""}`}>
                                      {subItem.title}
                                    </span>
                                  </div>
                                  {subItem.badge !== undefined && (
                                    <span className="px-1.5 py-0.5 bg-[#0052cc]/10 text-[#0052cc] text-[10px] rounded-full font-medium">
                                      {subItem.badge}
                                    </span>
                                  )}
                                </Link>
                              ))}
                            </div>
                          )}

                          {/* Collapsed */}
                          {isCollapsed && (
                            <div className="mt-0.5 space-y-0.5 px-2">
                              {item.subItems!.map((subItem, subIdx) => {
                                const subItemId = `${itemId}-sub-${subIdx}`;
                                return (
                                  <div
                                    key={subIdx}
                                    className="relative"
                                    ref={(el) => {
                                      if (el) itemRefs.current.set(subItemId, el);
                                      else itemRefs.current.delete(subItemId);
                                    }}
                                    onMouseEnter={() => handleItemHover(subItemId)}
                                    onMouseLeave={() => handleItemLeave(subItemId)}
                                  >
                                    <Link
                                      href={subItem.href}
                                      className={`flex items-center justify-center p-2 rounded-lg transition-colors
                                        ${isActive(subItem.href)
                                          ? "bg-[#0052cc]/10 text-[#0052cc]"
                                          : "text-slate-400 hover:bg-white"
                                        }`}
                                    >
                                      <subItem.icon className="w-4 h-4 flex-shrink-0" />
                                    </Link>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      
    </div>
  );

  // ── Tooltip ──
  const Tooltip = () => {
    if (!hoveredItem || !tooltipPosition || !isCollapsed) return null;

    let tooltipContent: React.ReactNode = null;
    let badge: string | number | undefined;

    sections.forEach((section) => {
      section.items.forEach((item, itemIdx) => {
        const sectionIdx = sections.indexOf(section);
        const itemId = `item-${sectionIdx}-${itemIdx}`;

        if (itemId === hoveredItem) {
          tooltipContent = item.title;
          badge = item.badge;
        } else if (item.subItems) {
          item.subItems.forEach((subItem, subIdx) => {
            const subItemId = `${itemId}-sub-${subIdx}`;
            if (subItemId === hoveredItem) {
              tooltipContent = subItem.title;
              badge = subItem.badge;
            }
          });
        }
      });
    });

    if (!tooltipContent) return null;

    return (
      <div
        className="fixed z-[9999] px-3 py-1.5 bg-slate-800 text-white text-xs rounded-lg shadow-lg whitespace-nowrap pointer-events-none"
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
          transform: "translateY(-50%)",
        }}
      >
        <div className="flex items-center gap-2">
          <span>{tooltipContent as string}</span>
          {badge !== undefined && (
            <span className="px-1.5 py-0.5 bg-[#0052cc] text-white text-[10px] rounded-full font-medium">
              {badge}
            </span>
          )}
        </div>
        <div className="absolute right-full top-1/2 -translate-y-1/2 border-[5px] border-transparent border-r-slate-800" />
      </div>
    );
  };

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <Tooltip />

      <aside
        className={`
          fixed md:sticky top-0 left-0 h-screen z-50
          transform transition-all duration-300 ease-in-out
          ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          ${isCollapsed ? "w-[72px]" : "w-[272px]"}
        `}
        style={{ overflow: "visible" }}
      >
        {SidebarContent}
      </aside>
    </>
  );
}