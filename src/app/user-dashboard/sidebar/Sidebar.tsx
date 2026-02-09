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
  Gift,
  Loader2
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
  
  // Tooltip state management
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{top: number, left: number} | null>(null);
  const itemRefs = useRef<Map<string, HTMLElement>>(new Map());
  
  // Initialize all sections as open by default
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    const initialState: Record<string, boolean> = {};
    sections.forEach(section => {
      section.items.forEach(item => {
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

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user?.name) return "U";
    const names = user.name.split(" ");
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return user.name.substring(0, 2).toUpperCase();
  };

  // Calculate tooltip position based on icon position
  const calculateTooltipPosition = (itemId: string) => {
    const itemElement = itemRefs.current.get(itemId);
    if (!itemElement) return null;

    const rect = itemElement.getBoundingClientRect();
    
    // Calculate center point of the icon
    const iconCenterY = rect.top + (rect.height / 2);
    
    // Position tooltip to the right of the icon with 8px gap
    const tooltipLeft = rect.right + 8;
    
    return {
      top: iconCenterY,
      left: tooltipLeft
    };
  };

  // Handle hover events
  const handleItemHover = (itemId: string) => {
    setHoveredItem(itemId);
    const position = calculateTooltipPosition(itemId);
    if (position) {
      setTooltipPosition(position);
    }
  };

  // Handle mouse leave
  const handleItemLeave = (itemId: string) => {
    if (hoveredItem === itemId) {
      setHoveredItem(null);
      setTooltipPosition(null);
    }
  };

  // Update tooltip position on scroll or resize
  useEffect(() => {
    if (!hoveredItem) return;

    const updatePosition = () => {
      const position = calculateTooltipPosition(hoveredItem);
      if (position) {
        setTooltipPosition(position);
      }
    };

    window.addEventListener('scroll', updatePosition);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
    };
  }, [hoveredItem]);

  const SidebarContent = (
    <div className="h-full flex flex-col bg-white border-r shadow-sm overflow-visible relative">
      {/* User Profile Section (Desktop) */}
      {!isCollapsed && user && (
        <div className=" md:p-4 border-b bg-gradient-to-br from-teal-50 to-cyan-50">
          <div className="hidden md:flex items-center gap-2.5">
            <div className="relative">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-10 h-10 rounded-full object-cover border-2 border-teal-200"
                />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {getUserInitials()}
                </div>
              )}
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm text-gray-800 truncate">{user.name}</h3>
              <p className="text-xs text-gray-600 truncate">{user.email}</p>
              {user.phone && (
                <p className="text-xs text-gray-500 truncate">{user.phone}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Collapsed User Avatar */}
      {isCollapsed && user && (
        <div className="p-3 border-b flex justify-center">
          <div className="relative group"
            ref={(el) => {
              if (el) itemRefs.current.set('user-avatar', el);
              else itemRefs.current.delete('user-avatar');
            }}
            onMouseEnter={() => handleItemHover('user-avatar')}
            onMouseLeave={() => handleItemLeave('user-avatar')}
          >
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-10 h-10 rounded-full object-cover border-2 border-teal-200"
              />
            ) : (
              <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                {getUserInitials()}
              </div>
            )}
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
          </div>
        </div>
      )}

      {/* Mobile Header with Close Button */}
      <div className="md:hidden flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2.5">
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="w-9 h-9 rounded-full object-cover"
            />
          ) : (
            <div className="w-9 h-9 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
              {getUserInitials()}
            </div>
          )}
          <div>
            <h3 className="font-semibold text-sm text-gray-800">{user?.name || "User"}</h3>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-gray-100 rounded-lg"
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Navigation Menu */}
       <nav className="flex-1 overflow-y-auto overflow-x-visible p-3 scrollbar-hide" style={{
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}>
        {sections.map((section, sectionIdx) => (
          <div key={sectionIdx} className="mb-4">
            {section.title && !isCollapsed && (
              <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">
                {section.title}
              </h3>
            )}
            
            <div className="space-y-0.5">
              {section.items.map((item, itemIdx) => {
                const hasSubItems = item.subItems && item.subItems.length > 0;
                const isOpen = openSections[item.title];
                const itemIsActive = isActive(item.href);
                const itemId = `item-${sectionIdx}-${itemIdx}`;
                
                return (
                  <div key={itemIdx}>
                    <div className="relative"
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
                        }}
                        className={`flex items-center justify-between px-2.5 py-2 rounded-lg transition-all duration-200 ${
                          itemIsActive || (hasSubItems && isOpen)
                            ? "bg-gradient-to-r from-teal-50 to-cyan-50 text-teal-700 shadow-sm"
                            : "text-gray-700 hover:bg-gray-50"
                        } ${item.color || ""} ${isCollapsed ? 'justify-center' : ''}`}
                      >
                        <div className={`flex items-center gap-2.5 ${isCollapsed ? 'w-full justify-center' : ''}`}>
                          <item.icon className={`w-4 h-4 flex-shrink-0 ${itemIsActive ? 'text-teal-600' : ''}`} />
                          {!isCollapsed && <span className="font-medium text-sm">{item.title}</span>}
                        </div>
                        
                        {!isCollapsed && (
                          <div className="flex items-center gap-1.5">
                            {item.badge && (
                              <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-[10px] rounded-full font-medium">
                                {item.badge}
                              </span>
                            )}
                            {hasSubItems && (
                              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                            )}
                          </div>
                        )}
                      </Link>
                    </div>

                    {/* Sub Items */}
                    {hasSubItems && (
                      <>
                        {/* Expanded View */}
                        {isOpen && !isCollapsed && (
                          <div className="ml-3 mt-0.5 space-y-0.5 border-l-2 border-teal-100 pl-2.5">
                            {item.subItems!.map((subItem, subIdx) => (
                              <Link
                                key={subIdx}
                                href={subItem.href}
                                className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors ${
                                  isActive(subItem.href)
                                    ? "bg-teal-100 text-teal-700 font-medium"
                                    : "text-gray-600 hover:bg-gray-50"
                                }`}
                              >
                                <div className="flex items-center gap-2.5">
                                  <subItem.icon className="w-3.5 h-3.5 flex-shrink-0" />
                                  <span className="text-xs">{subItem.title}</span>
                                </div>
                                {subItem.badge && (
                                  <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-[10px] rounded-full font-medium">
                                    {subItem.badge}
                                  </span>
                                )}
                              </Link>
                            ))}
                          </div>
                        )}
                        
                        {/* Collapsed View - Show all sub-items as centered icons with tooltips */}
                        {isCollapsed && (
                          <div className="mt-0.5 space-y-0.5">
                            {item.subItems!.map((subItem, subIdx) => {
                              const subItemId = `${itemId}-sub-${subIdx}`;
                              return (
                                <div key={subIdx} className="relative"
                                  ref={(el) => {
                                    if (el) itemRefs.current.set(subItemId, el);
                                    else itemRefs.current.delete(subItemId);
                                  }}
                                  onMouseEnter={() => handleItemHover(subItemId)}
                                  onMouseLeave={() => handleItemLeave(subItemId)}
                                >
                                  <Link
                                    href={subItem.href}
                                    className={`flex items-center justify-center px-2.5 py-2 rounded-lg transition-colors ${
                                      isActive(subItem.href)
                                        ? "bg-teal-100 text-teal-700"
                                        : "text-gray-600 hover:bg-gray-50"
                                    }`}
                                  >
                                    <subItem.icon className="w-4 h-4 flex-shrink-0 mx-auto" />
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
        ))}
      </nav>

      {/* Footer - Promo Card & Actions */}
      {!isCollapsed && (
        <div className="p-3 border-t bg-gray-50">
          {/* Support & Logout */}
          <div className="space-y-1">
            <Link
              href="/user-dashboard/support"
              className="flex items-center gap-2.5 px-2.5 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <HelpCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-xs">Help & Support</span>
            </Link>
            
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex items-center gap-2.5 px-2.5 py-1.5 text-red-600 hover:bg-red-50 rounded-lg w-full transition-colors disabled:opacity-50"
            >
              {isLoggingOut ? (
                <Loader2 className="w-4 h-4 flex-shrink-0 animate-spin" />
              ) : (
                <LogOut className="w-4 h-4 flex-shrink-0" />
              )}
              <span className="text-xs">{isLoggingOut ? "Logging out..." : "Logout"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Collapsed Logout Button with Tooltip */}
      {isCollapsed && (
        <div className="p-2 border-t relative"
          ref={(el) => {
            if (el) itemRefs.current.set('logout', el);
            else itemRefs.current.delete('logout');
          }}
          onMouseEnter={() => handleItemHover('logout')}
          onMouseLeave={() => handleItemLeave('logout')}
        >
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50"
          >
            {isLoggingOut ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <LogOut className="w-4 h-4" />
            )}
          </button>
        </div>
      )}
    </div>
  );

  // Tooltip component
  const Tooltip = () => {
    if (!hoveredItem || !tooltipPosition || !isCollapsed) return null;

    // Get item data for tooltip content
    let tooltipContent = null;
    let badge = null;

    // Find the item data
    sections.forEach(section => {
      section.items.forEach(item => {
        const itemId = `item-${sections.indexOf(section)}-${section.items.indexOf(item)}`;
        
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

    // Special cases
    if (hoveredItem === 'user-avatar' && user) {
      tooltipContent = (
        <div>
          <div className="font-semibold">{user.name}</div>
          <div className="text-[10px] text-gray-300">{user.email}</div>
        </div>
      );
    } else if (hoveredItem === 'logout') {
      tooltipContent = 'Logout';
    }

    if (!tooltipContent) return null;

    return (
      <div
        className="fixed z-[9999] px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg whitespace-nowrap pointer-events-none"
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
          transform: 'translateY(-50%)'
        }}
      >
        {typeof tooltipContent === 'string' ? (
          <div className="flex items-center gap-2">
            <span>{tooltipContent}</span>
            {badge && (
              <span className="px-1.5 py-0.5 bg-red-500 text-white text-[10px] rounded-full font-medium">
                {badge}
              </span>
            )}
          </div>
        ) : (
          tooltipContent
        )}
        {/* Arrow pointing to the icon */}
        <div className="absolute right-full top-1/2 -translate-y-1/2 border-[5px] border-transparent border-r-gray-900"></div>
      </div>
    );
  };

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Tooltip */}
      <Tooltip />

      {/* Sidebar */}
      <aside
        className={`
          fixed md:sticky
          top-0 left-0
          h-screen
          z-50
          transform transition-transform duration-300 ease-in-out
          ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          ${isCollapsed ? "w-20" : "w-72"}
        `}
        style={{ overflow: 'visible' }}
      >
        {SidebarContent}
      </aside>
    </>
  );
}