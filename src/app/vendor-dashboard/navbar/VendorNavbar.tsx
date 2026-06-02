// components/vendor/layout/navbar/VendorNavbar.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { Menu, Search, ChevronRight, LogOut, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store/store";
import { useLogoutMutation } from "@/features/authApi";
import { clearAuth } from "@/features/authSlice";

type Icon = React.ComponentType<React.SVGProps<SVGSVGElement>>;

type FlatMenuItem = {
  title: string;
  href: string;
  icon: Icon;
  keywords: string[];
};

type VendorNavbarProps = {
  onMobileMenuClick: () => void;
  onMenuClick: () => void;
  isSidebarOpen: boolean;
  menuItems?: FlatMenuItem[];
  isVisible?: boolean;
};

const TIME_FILTERS = ["Today", "This Week", "This Month", "This Year"] as const;
type TimeFilter = (typeof TIME_FILTERS)[number];

export function VendorNavbar({
  onMobileMenuClick,
  onMenuClick,
  isSidebarOpen,
  menuItems = [],
  isVisible = true,
}: VendorNavbarProps) {
  const router = useRouter();
  const dispatch = useDispatch();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [activeFilter, setActiveFilter] = useState<TimeFilter>("This Week");
  const searchRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const { user } = useSelector((state: RootState) => state.auth);
  const [logoutMutation, { isLoading: isLoggingOut }] = useLogoutMutation();

  const filteredItems = menuItems.filter(
    (item) =>
      item.keywords.some((k) => k.toLowerCase().includes(searchQuery.toLowerCase())) ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchResults(false);
        setSelectedIndex(-1);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Keyboard nav
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!showSearchResults) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((p) => (p < filteredItems.length - 1 ? p + 1 : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((p) => (p > 0 ? p - 1 : filteredItems.length - 1));
      } else if (e.key === "Enter" && selectedIndex >= 0) {
        e.preventDefault();
        handleNavigate(filteredItems[selectedIndex].href);
      } else if (e.key === "Escape") {
        setShowSearchResults(false);
        setSelectedIndex(-1);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [showSearchResults, filteredItems, selectedIndex]);

  // Scroll selected into view
  useEffect(() => {
    if (selectedIndex >= 0 && resultsRef.current) {
      const el = resultsRef.current.children[selectedIndex] as HTMLElement;
      el?.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setShowSearchResults(value.length > 0);
    setSelectedIndex(-1);
  };

  const handleNavigate = (href: string) => {
    if (href && href !== "#") {
      router.push(href);
      setShowSearchResults(false);
      setSearchQuery("");
      setSelectedIndex(-1);
    }
  };

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

  const getUserInitials = (name?: string) => {
    if (!name) return "V";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, "gi");
    return text.split(regex).map((part, i) =>
      regex.test(part) ? <span key={i} className="bg-yellow-200 font-bold">{part}</span> : part
    );
  };

  return (
    /*
     * KEY FIX: navbar is now `sticky top-0` inside the right column flex container,
     * NOT `fixed left-0 right-0`. This means it scrolls with its column but sticks
     * to the top of the scrollable area — no overlap with the sidebar at all.
     * The translate-y animation still works for hide-on-scroll.
     */
    <header
      className={`
        sticky top-0 z-40 shrink-0
        bg-white/80 backdrop-blur-xl
        border-b border-slate-100
        transition-transform duration-300 ease-in-out
        ${isVisible ? "translate-y-0" : "-translate-y-full"}
      `}
    >
      <div className="h-16 px-4 sm:px-6 flex items-center justify-between gap-4">

        {/* Left — toggles + search + time filters */}
        <div className="flex items-center gap-3 sm:gap-5 flex-1 min-w-0">

          {/* Mobile hamburger */}
          <button
            onClick={onMobileMenuClick}
            className="lg:hidden p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors shrink-0"
            aria-label="Open mobile menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Desktop sidebar toggle */}
          <button
            onClick={onMenuClick}
            className="hidden lg:flex p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors shrink-0"
            aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Search */}
          <div className="relative w-full max-w-xs sm:max-w-sm md:max-w-md" ref={searchRef}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="search"
              placeholder="Search orders, products..."
              className="w-full pl-10 pr-8 py-2 bg-slate-50 border-none rounded-full text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 transition-all"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => setShowSearchResults(searchQuery.length > 0)}
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(""); setShowSearchResults(false); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-lg leading-none"
                aria-label="Clear search"
              >
                ×
              </button>
            )}

            {/* Search dropdown */}
            {showSearchResults && (
              <div
                ref={resultsRef}
                className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-xl shadow-xl z-50 max-h-80 overflow-y-auto"
              >
                {filteredItems.length > 0 ? (
                  <>
                    <div className="px-4 py-2 border-b border-slate-100 bg-slate-50 rounded-t-xl">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        {filteredItems.length} result{filteredItems.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    {filteredItems.map((item, index) => (
                      <button
                        key={`${item.href}-${index}`}
                        onClick={() => handleNavigate(item.href)}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={`
                          w-full flex items-center justify-between px-4 py-3
                          border-b border-slate-50 last:border-b-0 transition-colors duration-150
                          ${selectedIndex === index ? "bg-blue-50" : "hover:bg-slate-50"}
                        `}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`p-1.5 rounded-lg ${selectedIndex === index ? "bg-blue-100" : "bg-slate-100"}`}>
                            <item.icon className={`w-4 h-4 ${selectedIndex === index ? "text-blue-600" : "text-slate-500"}`} />
                          </div>
                          <div className="flex-1 min-w-0 text-left">
                            <p className={`text-sm font-semibold truncate ${selectedIndex === index ? "text-blue-700" : "text-slate-900"}`}>
                              {highlightText(item.title, searchQuery)}
                            </p>
                            <p className="text-[11px] text-slate-400 truncate">{item.href}</p>
                          </div>
                        </div>
                        <ChevronRight className={`w-4 h-4 shrink-0 ${selectedIndex === index ? "text-blue-400" : "text-slate-300"}`} />
                      </button>
                    ))}
                    <div className="px-4 py-2 border-t border-slate-100 bg-slate-50 rounded-b-xl">
                      <p className="text-[10px] text-slate-400">↑↓ navigate · Enter select · Esc close</p>
                    </div>
                  </>
                ) : (
                  <div className="px-4 py-8 text-center">
                    <Search className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">No results for &quot;{searchQuery}&quot;</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Time filter tabs — hidden on small screens */}
          <nav className="hidden xl:flex items-center gap-1 shrink-0">
            {TIME_FILTERS.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`
                  px-3 py-1 text-sm transition-all duration-150 whitespace-nowrap
                  ${
                    activeFilter === filter
                      ? "text-blue-600 font-bold border-b-2 border-blue-600 rounded-none"
                      : "text-slate-500 hover:text-slate-900 font-medium rounded-md"
                  }
                `}
              >
                {filter}
              </button>
            ))}
          </nav>
        </div>

        {/* Right — user */}
        <div className="flex items-center gap-3 pl-3 border-l border-slate-200 shrink-0">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-slate-900 leading-tight">
              {user?.name || "Vendor"}
            </p>
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
              {user?.vendor?.storeName || user?.role || "Premium Partner"}
            </p>
          </div>

          {/* Avatar + hover dropdown */}
          <div className="relative group">
            <button className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center border-2 border-blue-100 shadow-sm hover:shadow-md transition-shadow">
              <span className="text-sm font-bold text-white">
                {getUserInitials(user?.name)}
              </span>
            </button>

            {/* Dropdown */}
            <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-100 rounded-xl shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-white">{getUserInitials(user?.name)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{user?.name || "Vendor"}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user?.email || user?.phone}</p>
                    <span className="inline-block mt-1 text-[9px] font-black uppercase tracking-wider bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                      {user?.role || "Vendor"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-1">
                <button
                  onClick={() => router.push("/vendor-dashboard/settings/profile")}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 rounded-lg transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </button>
              </div>

              <div className="p-1 border-t border-slate-100">
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isLoggingOut ? (
                    <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <LogOut className="w-4 h-4" />
                  )}
                  {isLoggingOut ? "Logging out..." : "Logout"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}