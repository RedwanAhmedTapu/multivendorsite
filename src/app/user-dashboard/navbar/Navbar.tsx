"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import {
  Search, ShoppingBag, ChevronDown, X, Tag,
} from "lucide-react";
import { useGetCategoriesQuery, useSearchCategoriesQuery } from "@/features/apiSlice";
import { useGetCartCountQuery } from "@/features/cartWishApi";
import NestedCategoryMenu from "@/components/publicnavbar/NestedCategoryMenu";

// ─── Types ────────────────────────────────────────────────────────────────────

type Icon = React.ComponentType<React.SVGProps<SVGSVGElement>>;

type FlatMenuItem = {
  title: string;
  href: string;
  icon: Icon;
  keywords: string[];
};

interface UserNavbarProps {
  onMobileMenuClick: () => void;
  onMenuClick: () => void;
  isSidebarOpen: boolean;
  showMenuButton: boolean;
  menuItems: FlatMenuItem[];
}

interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  children?: Category[];
}

// ─── Count Badge ──────────────────────────────────────────────────────────────

function CountBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold leading-none pointer-events-none">
      {count > 99 ? "99+" : count}
    </span>
  );
}

// ─── Search Suggestions ───────────────────────────────────────────────────────

function SearchSuggestions({
  query,
  onSelect,
  width,
}: {
  query: string;
  onSelect: (slug: string, name: string) => void;
  width?: number;
}) {
  const { data: results, isFetching } = useSearchCategoriesQuery(query, {
    skip: query.trim().length < 1,
  });

  if (!query.trim() || (!isFetching && (!results || results.length === 0))) return null;

  return (
    <div
      className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-[200] overflow-hidden"
      style={{ width: width ? `${width}px` : "100%" }}
    >
      {isFetching ? (
        <div className="px-4 py-3 flex items-center gap-2 text-gray-400 text-sm">
          <span className="inline-block w-3 h-3 border-2 border-gray-300 border-t-[#0052cc] rounded-full animate-spin" />
          Searching…
        </div>
      ) : (
        <ul>
          {results!.map((cat) => (
            <li key={cat.id}>
              <button
                onMouseDown={(e) => { e.preventDefault(); onSelect(cat.slug, cat.name); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 text-left group"
              >
                <Tag className="w-3.5 h-3.5 text-[#0052cc] flex-shrink-0" />
                <span className="text-sm font-medium text-gray-800 group-hover:text-[#0052cc] truncate block flex-1">
                  {cat.name}
                </span>
                <Search className="w-3 h-3 text-gray-300 group-hover:text-[#0052cc] flex-shrink-0" />
              </button>
              <div className="border-b border-gray-100 last:border-0" />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Main Navbar ──────────────────────────────────────────────────────────────

export function UserNavbar({
  onMobileMenuClick,
  onMenuClick,
  isSidebarOpen,
  showMenuButton,
  menuItems,
}: UserNavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useSelector((state: RootState) => state.auth);
  const isAuthenticated = !!user;

  const [search, setSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionQuery, setSuggestionQuery] = useState("");
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const categoryButtonRef = useRef<HTMLButtonElement>(null);
  const categoryMenuRef = useRef<HTMLDivElement>(null);

  const { data: categoriesData } = useGetCategoriesQuery();
  const { data: cartCountData } = useGetCartCountQuery(undefined, {
    skip: !isAuthenticated,
    pollingInterval: 30000,
  });

  const allCategories: Category[] = categoriesData || [];
  const cartCount = cartCountData?.data?.totalItems ?? 0;

  // Debounce search suggestions
  useEffect(() => {
    const t = setTimeout(() => setSuggestionQuery(search), 200);
    return () => clearTimeout(t);
  }, [search]);

  // Close category menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        isCategoryMenuOpen &&
        !categoryButtonRef.current?.contains(e.target as Node) &&
        !categoryMenuRef.current?.contains(e.target as Node)
      ) setIsCategoryMenuOpen(false);
    };
    if (isCategoryMenuOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isCategoryMenuOpen]);

  const handleSearchSubmit = () => {
    setShowSuggestions(false);
    if (!search.trim()) return;
    if (pathname === "/products") {
      const params = new URLSearchParams(searchParams.toString());
      params.set("search", search.trim());
      router.replace(`/products?${params.toString()}`, { scroll: false });
    } else {
      router.push(`/products?search=${encodeURIComponent(search.trim())}`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearchSubmit();
    if (e.key === "Escape") setShowSuggestions(false);
  };

  const handleCategoryClick = (slug: string) => {
    if (pathname === "/products") {
      const params = new URLSearchParams(searchParams.toString());
      params.set("category", slug);
      router.replace(`/products?${params.toString()}`, { scroll: false });
    } else {
      router.push(`/products?category=${slug}`);
    }
    setIsCategoryMenuOpen(false);
  };

  const handleSuggestionSelect = (slug: string, name: string) => {
    setSearch(name);
    setShowSuggestions(false);
    handleCategoryClick(slug);
  };

  // Mock cart items — replace with real data
  const cartItems = [
    { id: 1, name: "Wireless Earbuds", price: "$99.99", quantity: 1, image: "🎧" },
    { id: 2, name: "Smart Watch", price: "$249.99", quantity: 1, image: "⌚" },
    { id: 3, name: "USB-C Hub", price: "$29.99", quantity: 2, image: "🔌" },
  ];

  return (
    <nav className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
      <div className="px-4 py-2.5">
        <div className="flex items-center gap-3">

          {/* ── Search Bar with Category ── */}
          <div
            ref={searchContainerRef}
            className="flex flex-1 items-center border border-slate-300 rounded-lg bg-white overflow-visible relative focus-within:border-[#0052cc] focus-within:ring-1 focus-within:ring-[#0052cc]/20 transition-all"
          >
            {/* Browse Category Button */}
            <div className="relative">
              <button
                ref={categoryButtonRef}
                onClick={(e) => { e.stopPropagation(); setIsCategoryMenuOpen(!isCategoryMenuOpen); }}
                className="flex items-center gap-1.5 px-3 h-10 bg-[#f5f7f8] hover:bg-slate-100 border-r border-slate-300 text-slate-600 text-sm whitespace-nowrap rounded-l-lg transition-colors"
              >
                <span className="hidden sm:inline font-medium">Browse</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isCategoryMenuOpen ? "rotate-180" : ""}`}
                />
              </button>

              {/* Category Dropdown */}
              {isCategoryMenuOpen && (
                <div
                  ref={categoryMenuRef}
                  className="absolute top-full left-0 mt-2 z-[100]"
                >
                  <NestedCategoryMenu
                    categories={allCategories}
                    onCategorySelect={handleCategoryClick}
                    onClose={() => setIsCategoryMenuOpen(false)}
                  />
                </div>
              )}
            </div>

            {/* Search Input */}
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setShowSuggestions(true); }}
              onKeyDown={handleKeyPress}
              onFocus={() => search.trim() && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              placeholder="Search products, orders, help..."
              className="flex-1 h-10 px-3 text-sm text-slate-700 placeholder:text-slate-400 outline-none bg-transparent"
            />

            {/* Clear */}
            {search && (
              <button
                onClick={() => { setSearch(""); setShowSuggestions(false); }}
                className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Search Button */}
            <button
              onClick={handleSearchSubmit}
              className="flex items-center justify-center h-10 px-4 bg-[#0052cc] hover:bg-[#0047b3] text-white rounded-r-lg transition-colors"
              aria-label="Search"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Search Suggestions Dropdown */}
            {showSuggestions && (
              <SearchSuggestions
                query={suggestionQuery}
                onSelect={handleSuggestionSelect}
                width={searchContainerRef.current?.clientWidth}
              />
            )}
          </div>

          {/* ── Cart ── */}
          <div className="relative">
            <button
              onClick={() => setCartOpen(!cartOpen)}
              className="relative flex items-center justify-center w-10 h-10 rounded-lg text-slate-600 hover:bg-[#0052cc]/10 hover:text-[#0052cc] transition-colors"
              aria-label="Shopping cart"
            >
              <ShoppingBag className="w-5 h-5" />
              <CountBadge count={cartCount || cartItems.length} />
            </button>

            {/* Cart Dropdown */}
            {cartOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setCartOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden">
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-[#f5f7f8]">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-800">Shopping Cart</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{cartItems.length} items</p>
                    </div>
                    <button
                      onClick={() => setCartOpen(false)}
                      className="p-1 hover:bg-slate-200 rounded-md transition-colors"
                    >
                      <X className="w-4 h-4 text-slate-500" />
                    </button>
                  </div>

                  {/* Items */}
                  <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                        <div className="w-10 h-10 bg-[#0052cc]/10 rounded-lg flex items-center justify-center text-lg flex-shrink-0">
                          {item.image}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">{item.name}</p>
                          <div className="flex items-center justify-between mt-0.5">
                            <span className="text-sm font-semibold text-[#0052cc]">{item.price}</span>
                            <span className="text-xs text-slate-400">Qty: {item.quantity}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="px-4 py-3 border-t border-slate-100 bg-[#f5f7f8]">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-slate-600 font-medium">Total</span>
                      <span className="text-base font-bold text-slate-800">$409.96</span>
                    </div>
                    <Link
                      href="/cart"
                      className="block w-full py-2.5 bg-[#0052cc] hover:bg-[#0047b3] text-white text-center text-sm font-medium rounded-lg transition-colors"
                      onClick={() => setCartOpen(false)}
                    >
                      View Cart & Checkout
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
}