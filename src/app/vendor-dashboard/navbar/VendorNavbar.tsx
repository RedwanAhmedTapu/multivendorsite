// components/vendor/layout/navbar/VendorNavbar.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { Menu, Bell, Settings, Search, User, Store, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";

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
};

export function VendorNavbar({
  onMobileMenuClick,
  onMenuClick,
  isSidebarOpen,
  menuItems = [],
}: VendorNavbarProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Filter menu items based on search query
  const filteredItems = menuItems.filter((item) =>
    item.keywords.some((keyword) =>
      keyword.toLowerCase().includes(searchQuery.toLowerCase())
    ) || item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showSearchResults) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => 
          prev < filteredItems.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => 
          prev > 0 ? prev - 1 : filteredItems.length - 1
        );
      } else if (e.key === "Enter" && selectedIndex >= 0) {
        e.preventDefault();
        handleNavigate(filteredItems[selectedIndex].href);
      } else if (e.key === "Escape") {
        setShowSearchResults(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showSearchResults, filteredItems, selectedIndex]);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && resultsRef.current) {
      const selectedElement = resultsRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: "nearest" });
      }
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

  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, index) =>
      regex.test(part) ? (
        <span key={index} className="bg-yellow-200 font-bold">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="h-16 px-4 sm:px-6 flex items-center justify-between">
        {/* Left section */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-gray-600 hover:text-teal-600 hover:bg-gray-100"
            onClick={onMobileMenuClick}
          >
            <Menu className="w-5 h-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:flex text-gray-600 hover:text-teal-600 hover:bg-gray-100"
            onClick={onMenuClick}
          >
            <Menu className="w-5 h-5" />
          </Button>

          <div className="hidden md:flex items-center gap-2">
            <div className="p-1.5 bg-teal-500 rounded-md">
              <Store className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">
              FinixMart Vendor
            </span>
          </div>
        </div>

        {/* Center - Search */}
        <div className="flex-1 max-w-2xl mx-4 relative" ref={searchRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Search menus, pages, settings..."
              className="pl-10 pr-4 py-2 w-full bg-gray-50 border-gray-300 focus:border-teal-500 focus:ring-teal-500"
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
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            )}
          </div>

          {/* Search Results Dropdown */}
          {showSearchResults && (
            <div 
              ref={resultsRef}
              className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto"
            >
              {filteredItems.length > 0 ? (
                <>
                  <div className="px-4 py-2 border-b border-gray-100 bg-gray-50">
                    <p className="text-xs font-medium text-gray-500">
                      {filteredItems.length} result{filteredItems.length !== 1 ? "s" : ""} found
                    </p>
                  </div>
                  {filteredItems.map((item, index) => (
                    <button
                      key={`${item.href}-${index}`}
                      onClick={() => handleNavigate(item.href)}
                      className={`
                        w-full flex items-center justify-between px-4 py-3
                        hover:bg-teal-50 border-b border-gray-100 last:border-b-0
                        transition-colors duration-150
                        ${selectedIndex === index ? "bg-teal-50 border-teal-100" : ""}
                      `}
                      onMouseEnter={() => setSelectedIndex(index)}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`p-2 rounded-md ${
                          selectedIndex === index ? "bg-teal-100" : "bg-gray-100"
                        }`}>
                          <item.icon className={`w-4 h-4 ${
                            selectedIndex === index ? "text-teal-600" : "text-gray-600"
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <p className={`text-sm font-medium truncate ${
                            selectedIndex === index ? "text-teal-700" : "text-gray-900"
                          }`}>
                            {highlightText(item.title, searchQuery)}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {item.href}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 ${
                        selectedIndex === index ? "text-teal-500" : "text-gray-400"
                      }`} />
                    </button>
                  ))}
                  <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
                    <p className="text-xs text-gray-500">
                      ↑↓ to navigate • Enter to select • Esc to close
                    </p>
                  </div>
                </>
              ) : (
                <div className="px-4 py-8 text-center">
                  <Search className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No results found for "{searchQuery}"</p>
                  <p className="text-xs text-gray-400 mt-1">Try different keywords</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-600 hover:text-teal-600 hover:bg-gray-100 relative"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="text-gray-600 hover:text-teal-600 hover:bg-gray-100"
          >
            <Settings className="w-5 h-5" />
          </Button>

          <Button
            variant="ghost"
            className="hidden sm:flex items-center gap-2 text-gray-700 hover:text-teal-600 hover:bg-gray-100"
          >
            <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <span className="hidden lg:inline">Vendor Account</span>
          </Button>
        </div>
      </div>
    </header>
  );
}