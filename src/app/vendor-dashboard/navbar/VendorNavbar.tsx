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
  /** Opens the mobile drawer — the only navigation trigger this bar keeps,
   *  since it's the sole way to reach the sidebar on small screens. */
  onMobileMenuClick: () => void;
  menuItems?: FlatMenuItem[];
  isVisible?: boolean;
};

export function VendorNavbar({
  onMobileMenuClick,
  menuItems = [],
  isVisible = true,
}: VendorNavbarProps) {
  const router = useRouter();
  const dispatch = useDispatch();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
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
    return text
      .split(regex)
      .map((part, i) =>
        regex.test(part) ? (
          <span key={i} className="rounded bg-indigo-100 font-bold text-indigo-700">
            {part}
          </span>
        ) : (
          part
        )
      );
  };

  return (
    <header
      className={`
        sticky top-0 z-40 shrink-0
        border-b border-slate-100 bg-white/85 backdrop-blur-xl
        transition-transform duration-300 ease-in-out
        ${isVisible ? "translate-y-0" : "-translate-y-full"}
      `}
    >
      <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
        {/* Left — mobile menu trigger + search */}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {/* Mobile hamburger — the only way to reach the sidebar on small screens */}
          <button
            onClick={onMobileMenuClick}
            className="shrink-0 rounded-full p-2 text-slate-500 transition-colors hover:bg-indigo-50 hover:text-[#4f46e5] lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Search */}
          <div className="relative w-full max-w-md" ref={searchRef}>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="Search orders, products..."
              className="w-full rounded-full border border-transparent bg-slate-50 py-2.5 pl-10 pr-9 text-sm text-slate-700 placeholder-slate-400 transition-all focus:border-indigo-200 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => setShowSearchResults(searchQuery.length > 0)}
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setShowSearchResults(false);
                }}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-lg leading-none text-slate-400 hover:text-slate-600"
                aria-label="Clear search"
              >
                ×
              </button>
            )}

            {/* Search dropdown */}
            {showSearchResults && (
              <div
                ref={resultsRef}
                className="absolute left-0 right-0 top-full z-50 mt-2 max-h-80 overflow-y-auto rounded-2xl border border-slate-100 bg-white shadow-[0_16px_40px_-12px_rgba(30,27,75,0.18)]"
              >
                {filteredItems.length > 0 ? (
                  <>
                    <div className="rounded-t-2xl border-b border-slate-100 bg-slate-50 px-4 py-2">
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
                          flex w-full items-center justify-between border-b border-slate-50 px-4 py-3
                          transition-colors duration-150 last:border-b-0
                          ${selectedIndex === index ? "bg-indigo-50" : "hover:bg-slate-50"}
                        `}
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          <div className={`rounded-lg p-1.5 ${selectedIndex === index ? "bg-indigo-100" : "bg-slate-100"}`}>
                            <item.icon className={`h-4 w-4 ${selectedIndex === index ? "text-[#4f46e5]" : "text-slate-500"}`} />
                          </div>
                          <div className="min-w-0 flex-1 text-left">
                            <p className={`truncate text-sm font-semibold ${selectedIndex === index ? "text-[#4f46e5]" : "text-slate-900"}`}>
                              {highlightText(item.title, searchQuery)}
                            </p>
                            <p className="truncate text-[11px] text-slate-400">{item.href}</p>
                          </div>
                        </div>
                        <ChevronRight className={`h-4 w-4 shrink-0 ${selectedIndex === index ? "text-indigo-400" : "text-slate-300"}`} />
                      </button>
                    ))}
                    <div className="rounded-b-2xl border-t border-slate-100 bg-slate-50 px-4 py-2">
                      <p className="text-[10px] text-slate-400">↑↓ navigate · Enter select · Esc close</p>
                    </div>
                  </>
                ) : (
                  <div className="px-4 py-8 text-center">
                    <Search className="mx-auto mb-2 h-8 w-8 text-slate-200" />
                    <p className="text-sm text-slate-500">No results for &quot;{searchQuery}&quot;</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right — vendor dropdown */}
        <div className="relative shrink-0 group">
          <button className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-slate-50 sm:pr-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] text-sm font-bold text-white shadow-[0_4px_12px_-3px_rgba(79,70,229,0.5)]">
              {getUserInitials(user?.name)}
            </div>
            <div className="hidden text-left sm:block">
              <p className="text-sm font-bold leading-tight text-slate-900">{user?.name || "Vendor"}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                {user?.vendor?.storeName || user?.role || "Premium Partner"}
              </p>
            </div>
          </button>

          {/* Dropdown */}
          <div className="invisible absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-slate-100 bg-white opacity-0 shadow-[0_16px_40px_-12px_rgba(30,27,75,0.2)] transition-all duration-200 group-hover:visible group-hover:opacity-100">
            <div className="border-b border-slate-100 bg-slate-50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#4f46e5] to-[#7c3aed]">
                  <span className="text-sm font-bold text-white">{getUserInitials(user?.name)}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-900">{user?.name || "Vendor"}</p>
                  <p className="truncate text-[11px] text-slate-500">{user?.email || user?.phone}</p>
                  <span className="mt-1 inline-block rounded-full bg-indigo-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-[#4f46e5]">
                    {user?.role || "Vendor"}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-1">
              <button
                onClick={() => router.push("/vendor-dashboard/settings/profile")}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-50 hover:text-[#4f46e5]"
              >
                <Settings className="h-4 w-4" />
                Settings
              </button>
            </div>

            <div className="border-t border-slate-100 p-1">
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-rose-500 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
              >
                {isLoggingOut ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-rose-500 border-t-transparent" />
                ) : (
                  <LogOut className="h-4 w-4" />
                )}
                {isLoggingOut ? "Logging out..." : "Logout"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}