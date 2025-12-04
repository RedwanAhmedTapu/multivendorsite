// src/components/layouts/navbar/AdminNavbar.tsx
"use client";

import { useState, useEffect, useRef, KeyboardEvent, useMemo } from "react";
import { Menu, Bell, Search, User, X } from "lucide-react";
import { useRouter } from "next/navigation";

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
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

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

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div className="flex items-center space-x-4 flex-1">
        <button
          onClick={onMobileMenuClick}
          className="lg:hidden p-2 rounded-md hover:bg-gray-100"
        >
          <Menu className="w-6 h-6 text-gray-700" />
        </button>

        {showMenuButton && (
          <button onClick={onMenuClick} className="hidden lg:block p-2 rounded-md hover:bg-gray-100">
            <Menu className="w-6 h-6 text-gray-700" />
          </button>
        )}

        {/* Search Bar */}
        <div className="relative flex-1 max-w-2xl">
          <div className="flex items-center bg-gray-50 rounded-lg px-4 py-2.5 w-full shadow-sm border border-gray-200">
            <Search className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => getSuggestions.length > 0 && setShowSuggestions(true)}
              onKeyDown={handleKeyDown}
              placeholder="Search anything... (offers, vendors, products)"
              className="bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400 flex-1"
            />
            {query && (
              <button
                onClick={() => {
                  setQuery("");
                  setShowSuggestions(false);
                }}
                className="ml-2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Suggestions Dropdown */}
          {showSuggestions && getSuggestions.length > 0 && (
            <div
              className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50 max-h-96 overflow-y-auto"
              onMouseDown={(e) => e.preventDefault()}
            >
              {getSuggestions.map((item, idx) => (
                <button
                  key={item.href}
                  onClick={() => handleSuggestionClick(item.href)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all ${
                    idx === selectedIndex
                      ? "bg-teal-50 text-teal-700 shadow-sm"
                      : "hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  <item.icon className="w-5 h-5 text-gray-500" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{item.title}</div>
                    <div className="text-xs text-gray-400 truncate">{item.href}</div>
                  </div>
                </button>
              ))}
              <div className="px-4 py-2.5 text-xs text-gray-400 bg-gray-50 border-t border-gray-200">
                ↑↓ to navigate • Enter to go • Esc to close
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <button className="relative p-2 rounded-md hover:bg-gray-100">
          <Bell className="w-6 h-6 text-gray-700" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        <button className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100">
          <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
        </button>
      </div>
    </header>
  );
}