// src/components/layouts/navbar/AdminNavbar.tsx
"use client";

import { useState, useEffect, useRef, KeyboardEvent, useMemo } from "react";
import { Menu, Bell, Search, User, X, LogOut, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store/store";
import { useLogoutMutation } from "@/features/authApi";
import { clearAuth } from "@/features/authSlice";

type MenuItemFlat = {
  title: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  keywords?: string[];
};

type AdminNavbarProps = {
  onMobileMenuClick: () => void;
  onMenuClick?: () => void;
  isSidebarOpen?: boolean;
  showMenuButton?: boolean;
  menuItems?: MenuItemFlat[];
};

export function AdminNavbar({
  onMobileMenuClick,
  onMenuClick,
  isSidebarOpen = true,
  showMenuButton = false,
  menuItems = [],
}: AdminNavbarProps) {
  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const dispatch = useDispatch();

  // Get auth state from Redux
  const { user } = useSelector((state: RootState) => state.auth);
  
  // Logout mutation
  const [logoutMutation, { isLoading: isLoggingOut }] = useLogoutMutation();

  // This is now reactive — updates whenever menuItems changes
  const allItems = useMemo(() => menuItems, [menuItems]);

  const getSuggestions = useMemo(() => {
    if (!query.trim() || allItems.length === 0) return [];

    const lowerQuery = query.toLowerCase().trim();

    return allItems
      .map((item) => {
        const title = item.title.toLowerCase();
        const keywords = (item.keywords || []).map((k) => k.toLowerCase());

        let score = 0;
        if (title.includes(lowerQuery)) score = 3;
        else if (keywords.some((k) => k.includes(lowerQuery))) score = 2;
        else if (title.split(" ").some((word) => word.startsWith(lowerQuery))) score = 1.5;

        return score > 0 ? { ...item, score } : null;
      })
      .filter(Boolean)
      .sort((a, b) => (b?.score || 0) - (a?.score || 0))
      .slice(0, 8) as (MenuItemFlat & { score: number })[];
  }, [query, allItems]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [getSuggestions]);

  // Auto-show suggestions when typing
  useEffect(() => {
    if (query.trim() && getSuggestions.length > 0) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  }, [query, getSuggestions]);

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };

    if (showProfileMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showProfileMenu]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || getSuggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % getSuggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + getSuggestions.length) % getSuggestions.length);
    } else if (e.key === "Enter" && getSuggestions[selectedIndex]) {
      e.preventDefault();
      router.push(getSuggestions[selectedIndex].href);
      setQuery("");
      setShowSuggestions(false);
      inputRef.current?.blur();
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      inputRef.current?.blur();
    }
  };

  const handleSuggestionClick = (href: string) => {
    router.push(href);
    setQuery("");
    setShowSuggestions(false);
    inputRef.current?.blur();
  };

  const handleLogout = async () => {
    try {
      await logoutMutation().unwrap();
      dispatch(clearAuth());
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      // Still logout locally even if API fails
      dispatch(clearAuth());
      router.push("/login");
    }
  };

  // Get user initials for avatar
  const getUserInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Get role badge color
  const getRoleBadgeColor = (role?: string) => {
    switch (role?.toUpperCase()) {
      case "ADMIN":
        return "bg-red-100 text-red-700";
      case "VENDOR":
        return "bg-blue-100 text-blue-700";
      case "EMPLOYEE":
        return "bg-green-100 text-green-700";
      case "CUSTOMER":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <header className="h-14 sm:h-16 bg-white border-b border-gray-200 flex items-center justify-between px-2 sm:px-4 md:px-6">
      <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-4 flex-1 min-w-0">
        <button
          onClick={onMobileMenuClick}
          className="lg:hidden p-1.5 sm:p-2 rounded-md hover:bg-gray-100 flex-shrink-0"
          aria-label="Open mobile menu"
        >
          <Menu className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
        </button>

        {showMenuButton && (
          <button 
            onClick={onMenuClick} 
            className="hidden lg:block p-2 rounded-md hover:bg-gray-100 flex-shrink-0"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-6 h-6 text-gray-700" />
          </button>
        )}

        {/* Search Bar */}
        <div className="relative flex-1 max-w-xs sm:max-w-md md:max-w-2xl">
          <div className="flex items-center bg-gray-50 rounded-lg px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 w-full shadow-sm border border-gray-200">
            <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-gray-400 mr-1.5 sm:mr-2 md:mr-3 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => getSuggestions.length > 0 && setShowSuggestions(true)}
              onKeyDown={handleKeyDown}
              placeholder="Search..."
              className="bg-transparent outline-none text-xs sm:text-sm text-gray-700 placeholder-gray-400 flex-1 min-w-0"
            />
            {query && (
              <button
                onClick={() => {
                  setQuery("");
                  setShowSuggestions(false);
                }}
                className="ml-1 sm:ml-2 text-gray-400 hover:text-gray-600 flex-shrink-0"
                aria-label="Clear search"
              >
                <X className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
              </button>
            )}
          </div>

          {/* Suggestions Dropdown */}
          {showSuggestions && getSuggestions.length > 0 && (
            <div
              className="absolute top-full left-0 right-0 mt-1 sm:mt-2 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50 max-h-[70vh] sm:max-h-96 overflow-y-auto"
              onMouseDown={(e) => e.preventDefault()}
            >
              {getSuggestions.map((item, idx) => (
                <button
                  key={item.href+idx}
                  onClick={() => handleSuggestionClick(item.href)}
                  className={`w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 text-left transition-all ${
                    idx === selectedIndex
                      ? "bg-teal-50 text-teal-700 shadow-sm"
                      : "hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  <item.icon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-xs sm:text-sm truncate">{item.title}</div>
                    <div className="text-xs text-gray-400 truncate hidden sm:block">{item.href}</div>
                  </div>
                </button>
              ))}
              <div className="px-3 sm:px-4 py-2 sm:py-2.5 text-xs text-gray-400 bg-gray-50 border-t border-gray-200 hidden sm:block">
                ↑↓ to navigate • Enter to go • Esc to close
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-4 flex-shrink-0">
        {/* Notifications */}
        {/* <button 
          className="relative p-1.5 sm:p-2 rounded-md hover:bg-gray-100"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-gray-700" />
          <span className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-500 rounded-full"></span>
        </button> */}

        {/* User Profile Dropdown */}
        <div className="relative" ref={profileMenuRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center space-x-1 sm:space-x-2 p-1 sm:p-1.5 md:p-2 rounded-md "
          >
            {user?.avatar ? (
              <img 
                src={user.avatar} 
                alt={user.name || "User"} 
                className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-full object-cover"
              />
            ) : (
              <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-full bg-teal-500 flex items-center justify-center text-white font-semibold text-xs sm:text-sm">
                {getUserInitials(user?.name)}
              </div>
            )}
            <div className="hidden md:block text-left">
              <p className="text-xs sm:text-sm font-medium text-gray-900 truncate max-w-[100px] lg:max-w-[120px]">
                {user?.name || "User"}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {user?.role?.toLowerCase() || "Guest"}
              </p>
            </div>
            <ChevronDown className={`w-3 h-3 sm:w-4 sm:h-4 text-gray-500 transition-transform duration-200 hidden sm:block ${showProfileMenu ? "rotate-180" : ""}`} />
          </button>

          {/* Dropdown Menu */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-1 sm:mt-2 w-60 sm:w-64 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50">
              {/* User Info */}
              <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center gap-2 sm:gap-3">
                  {user?.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={user.name || "User"} 
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-teal-500 flex items-center justify-center text-white font-semibold text-base sm:text-lg flex-shrink-0">
                      {getUserInitials(user?.name)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {user?.name || "User"}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {user?.email || user?.phone || "No contact"}
                    </p>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user?.role)}`}>
                      {user?.role || "Guest"}
                    </span>
                  </div>
                </div>
              </div>

             

              {/* Logout */}
              <div className="border-t border-gray-200 p-1.5 sm:p-2">
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="w-full flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors duration-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoggingOut ? (
                    <>
                      <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs sm:text-sm">Logging out...</span>
                    </>
                  ) : (
                    <>
                      <LogOut className="w-4 h-4" />
                      <span className="text-xs sm:text-sm">Logout</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}