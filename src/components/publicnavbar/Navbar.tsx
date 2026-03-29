"use client";

import { useState, useRef, ChangeEvent, useEffect } from "react";
import {
  Menu, Search, Heart, ShoppingBag, ChevronDown, X,
  Package, HelpCircle, Globe, User, LogOut, Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { JSX } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useGetCategoriesQuery, useSearchCategoriesQuery } from "@/features/apiSlice";
import { useGetCartCountQuery, useGetWishlistCountQuery } from "@/features/cartWishApi";
import { Container } from "../Container";
import { useGetActiveThemeQuery } from "@/features/themeApi";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store/store";
import { clearAuth } from "@/features/authSlice";
import { LoginModal } from "../loginmodal/loginModal";
import NestedCategoryMenu from "./NestedCategoryMenu";

interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  children?: Category[];
  image?: string | null;
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

interface SearchSuggestionsProps {
  query: string;
  onSelect: (slug: string, name: string) => void;
  onClose: () => void;
  width?: number;
}

function SearchSuggestions({ query, onSelect, width }: SearchSuggestionsProps) {
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
          <span className="inline-block w-3 h-3 border-2 border-gray-300 border-t-teal-500 rounded-full animate-spin" />
          Searching…
        </div>
      ) : (
        <ul>
          {results!.map((cat) => (
            <li key={cat.id}>
              <button
                onMouseDown={(e) => { e.preventDefault(); onSelect(cat.slug, cat.name); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-teal-50 text-left group"
              >
                <Tag className="w-3.5 h-3.5 text-teal-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-gray-800 group-hover:text-teal-600 truncate block">{cat.name}</span>
                  {cat.parentId === null && <span className="text-xs text-gray-400">Top-level category</span>}
                </div>
                <Search className="w-3 h-3 text-gray-300 group-hover:text-teal-400 flex-shrink-0" />
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

export default function Navbar(): JSX.Element {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();

  const [search, setSearch] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNavbarFixed, setIsNavbarFixed] = useState(false);
  const [popoverWidth, setPopoverWidth] = useState(0);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginRedirectPath, setLoginRedirectPath] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionQuery, setSuggestionQuery] = useState("");

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const mobileSearchContainerRef = useRef<HTMLDivElement>(null);
  const categoryButtonRef = useRef<HTMLButtonElement>(null);
  const categoryMenuRef = useRef<HTMLDivElement>(null);

  const { user } = useSelector((state: RootState) => state.auth);
  const isAuthenticated = !!user;
  const isVendorAuth = pathname === "/vendorauth";

  const { data: categoriesData } = useGetCategoriesQuery();
  const { data: activeThemeData } = useGetActiveThemeQuery();
  const activeLayoutType = activeThemeData?.data?.layoutType || "layout_1";
  const theme = activeLayoutType === "layout_1" ? "modern" : "default";

  // ── Cart & Wishlist counts ─────────────────────────────────────────────────
  const { data: cartCountData } = useGetCartCountQuery(undefined, {
    skip: !isAuthenticated,
    pollingInterval: 30000,
  });
  const { data: wishlistCountData } = useGetWishlistCountQuery(undefined, {
    skip: !isAuthenticated,
    pollingInterval: 30000,
  });

  const cartCount = cartCountData?.data?.totalItems ?? 0;
  const wishlistCount = wishlistCountData?.data?.count ?? 0;

  const rootCategories: Category[] = categoriesData?.filter((c: Category) => !c.parentId) || [];
  const allCategories: Category[] = categoriesData || [];

  useEffect(() => {
    const t = setTimeout(() => setSuggestionQuery(search), 200);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    const onScroll = () => setIsNavbarFixed(window.scrollY > window.innerHeight * 0.7);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (searchContainerRef.current) setPopoverWidth(searchContainerRef.current.clientWidth);
  }, []);

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

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setShowSuggestions(true);
  };

  const handleCategoryClick = (slug: string) => {
    if (pathname === "/products") {
      const params = new URLSearchParams(searchParams.toString());
      params.set("category", slug);
      router.replace(`/products?${params.toString()}`, { scroll: false });
    } else {
      router.push(`/products?category=${slug}`);
    }
    setIsPopoverOpen(false);
    setIsCategoryMenuOpen(false);
  };

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

  const handleSuggestionSelect = (slug: string, name: string) => {
    setSearch(name);
    setShowSuggestions(false);
    handleCategoryClick(slug);
  };

  const handleLogout = () => { dispatch(clearAuth()); router.push("/"); };

  const handleCartClick = () => {
    if (isAuthenticated) router.push("/cart");
    else { setLoginRedirectPath("/cart"); setShowLoginModal(true); }
  };

  const handleWishlistClick = () => {
    if (isAuthenticated) router.push("/wishlist");
    else { setLoginRedirectPath("/wishlist"); setShowLoginModal(true); }
  };

  const handleUserDashboardClick = () => {
    if (user?.role === "CUSTOMER") router.push(`/user-dashboard?userid=${user.id}`);
    else if (user?.role === "VENDOR") router.push("/vendor-dashboard");
    else if (user?.role === "ADMIN") router.push("/admin-dashboard");
  };

  const handleLoginSuccess = () => {
    setShowLoginModal(false);
    if (loginRedirectPath) { router.push(loginRedirectPath); setLoginRedirectPath(""); }
  };

  const getUserDisplayName = () => user?.name || user?.email || "User";

  if (
    pathname.includes("admin-dashboard") || pathname.includes("vendor-dashboard") ||
    pathname.includes("user-dashboard") || pathname.includes("register") ||
    pathname.includes("reset-password") || pathname.includes("login") ||
    pathname.includes("accounting") || pathname.includes("vendor-store-decoration")
  ) return <></>;

  if (isVendorAuth) {
    return (
      <header className="w-full bg-white border-b border-gray-100 shadow-sm">
        <Container className="h-16 flex items-center justify-between px-4 lg:px-0">
          <Link href="/"><Image src="/navlogo/IMG_3794.PNG" alt="FinixMart Logo" width={110} height={40} className="w-auto" /></Link>
          <Link href="/" className="text-xs font-medium text-gray-400 hover:text-teal-600 transition-colors">← Back to shop</Link>
        </Container>
      </header>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // DEFAULT THEME
  // ════════════════════════════════════════════════════════════════════════════
  if (theme === "default") {
    return (
      <>
        <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} onLoginSuccess={handleLoginSuccess} redirectPath={loginRedirectPath} message={loginRedirectPath ? "Please sign in to continue" : undefined} />
        {isNavbarFixed && <div className="h-[80px]" />}

        <header className={`w-full bg-white p-0 ${isNavbarFixed ? "fixed top-0 left-0 z-50 shadow-sm animate-in slide-in-from-top duration-300" : "relative"}`}>
          {/* Top Bar */}
          <div className={`border-b border-gray-200 ${isNavbarFixed ? "hidden" : "block"}`}>
            <Container className="h-12 flex items-center justify-between text-xs px-4 lg:px-0">
              <div className="hidden md:flex items-center gap-4 lg:gap-6 text-gray-600">
                {["About Us", "Contact Us", "Help Center", "Find Stores", "Gift Cards"].map((l) => (
                  <a key={l} href="#" className="hover:text-gray-900 whitespace-nowrap">{l}</a>
                ))}
              </div>
              <div className="md:hidden flex-1">
                <Link href="/"><Image src="/navlogo/IMG_3794.PNG" alt="FinixMart Logo" width={80} height={32} className="w-auto" /></Link>
              </div>
              <div className="flex items-center gap-3 md:gap-4 text-gray-600">
                <a href="#" className="hidden sm:flex items-center gap-1 hover:text-gray-900 whitespace-nowrap"><Package size={14} /><span>Track Order</span></a>
                <a href="#" className="hidden md:flex items-center gap-2 hover:text-gray-900 whitespace-nowrap"><HelpCircle size={16} /><span>Help Center</span></a>
                <a href="#" className="flex items-center gap-1 hover:text-gray-900 whitespace-nowrap"><Globe size={14} /><span>English</span></a>
              </div>
            </Container>
          </div>

          {/* Main Navbar */}
          <Container className="h-20 flex items-center justify-between px-4 lg:px-0 gap-4">
            <div className="hidden md:flex items-center flex-shrink-0">
              <Link href="/"><Image src="/navlogo/IMG_3794.PNG" alt="FinixMart Logo" width={90} height={36} className="w-auto" /></Link>
            </div>
            <div className="md:hidden">
              <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="h-9 w-9 p-0"><Menu size={20} /></Button>
            </div>

            {/* Search */}
            <div ref={searchContainerRef} className="flex-1 max-w-2xl lg:max-w-3xl mx-0 lg:mx-4 relative">
              <div className="flex items-center border border-gray-300 rounded-lg bg-white overflow-hidden">
                {/* Mobile category */}
                <div className="relative flex md:hidden">
                  <button onClick={() => setIsPopoverOpen(!isPopoverOpen)} className="flex items-center gap-1 px-3 h-10 bg-gray-50 hover:bg-gray-100 border-r border-gray-300 text-gray-700 text-xs whitespace-nowrap">
                    <span>All</span><ChevronDown size={14} />
                  </button>
                  {isPopoverOpen && (
                    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4" style={{ width: popoverWidth }}>
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-semibold text-sm">Select Categories</h3>
                        <X className="h-4 w-4 cursor-pointer" onClick={() => setIsPopoverOpen(false)} />
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-700">
                        {rootCategories.map((cat) => (
                          <button key={cat.id} onClick={() => handleCategoryClick(cat.slug)} className="text-left hover:text-emerald-600 cursor-pointer truncate">{cat.name}</button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Desktop category */}
                <div className="relative hidden md:block">
                  <button ref={categoryButtonRef} onClick={(e) => { e.stopPropagation(); setIsCategoryMenuOpen(!isCategoryMenuOpen); }} className="flex items-center gap-2 px-4 h-12 bg-gray-50 hover:bg-gray-100 border-r border-gray-300 text-gray-700 text-sm whitespace-nowrap">
                    <span>All Categories</span><ChevronDown size={16} />
                  </button>
                </div>

                <input type="text" value={search} onChange={handleSearchChange} onKeyDown={handleKeyPress} onFocus={() => search.trim() && setShowSuggestions(true)} onBlur={() => setTimeout(() => setShowSuggestions(false), 150)} placeholder="Search for anything" className="flex-1 h-10 md:h-12 px-3 md:px-4 text-gray-700 text-xs md:text-sm outline-none placeholder:text-gray-400" />
                <button onClick={handleSearchSubmit} className="bg-emerald-500 hover:bg-emerald-600 h-10 md:h-12 px-3 md:px-6 text-white flex items-center justify-center min-w-[40px] md:min-w-[60px]"><Search size={18} /></button>
              </div>

              {isCategoryMenuOpen && (
                <div ref={categoryMenuRef} className="absolute top-full left-0 mt-1 z-[100]">
                  <NestedCategoryMenu categories={allCategories} onCategorySelect={handleCategoryClick} onClose={() => setIsCategoryMenuOpen(false)} />
                </div>
              )}
              {showSuggestions && (
                <SearchSuggestions query={suggestionQuery} onSelect={handleSuggestionSelect} onClose={() => setShowSuggestions(false)} width={searchContainerRef.current?.clientWidth} />
              )}
            </div>

            {/* Right Icons */}
            <div className="flex items-center gap-2 md:gap-4">
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="hidden sm:flex items-center gap-2 text-gray-700 hover:text-emerald-600 p-1">
                      <User size={22} /><span className="hidden lg:block text-sm font-medium max-w-[120px] truncate">{getUserDisplayName()}</span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem onClick={handleUserDashboardClick} className="cursor-pointer"><User className="mr-2 h-4 w-4" /><span>Dashboard</span></DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600"><LogOut className="mr-2 h-4 w-4" /><span>Logout</span></DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <button onClick={() => setShowLoginModal(true)} className="hidden sm:flex items-center text-gray-700 hover:text-emerald-600 p-1"><User size={22} /></button>
              )}

              {/* Wishlist */}
              <button onClick={handleWishlistClick} className="hidden sm:flex relative items-center justify-center text-gray-700 hover:text-emerald-600 p-1 w-8 h-8">
                <Heart size={22} />
                <CountBadge count={wishlistCount} />
              </button>

              {/* Cart */}
              <button onClick={handleCartClick} className="hidden sm:flex relative items-center gap-1 md:gap-2 bg-red-400 hover:bg-red-500 text-white px-3 md:px-4 h-10 md:h-12 rounded-lg whitespace-nowrap">
                <span className="relative flex items-center">
                  <ShoppingBag size={18} />
                  <CountBadge count={cartCount} />
                </span>
                <span className="font-medium text-xs md:text-sm">Cart</span>
              </button>
            </div>
          </Container>
        </header>
      </>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // MODERN THEME
  // ════════════════════════════════════════════════════════════════════════════
  if (theme === "modern") {
    return (
      <>
        <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} onLoginSuccess={handleLoginSuccess} redirectPath={loginRedirectPath} message={loginRedirectPath ? "Please sign in to continue" : undefined} />
        {isNavbarFixed && <div className="h-28 md:h-36" />}

        <header className={`w-full bg-[#0b5052] text-white ${isNavbarFixed ? "fixed top-0 left-0 z-50 shadow-lg animate-in slide-in-from-top duration-300" : "relative"}`}>
          <div className="h-14 md:h-24 flex items-center">
            <div className="flex items-center justify-between w-full px-3 md:px-4">

              {/* Mobile */}
              <div className="flex items-center gap-2 md:hidden">
                <Button variant="ghost" size="sm" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-white p-1 h-7 w-7"><Menu size={16} /></Button>
                <Link href="/"><Image src="/navlogo/IMG_3794.PNG" alt="FinixMart Logo" width={90} height={36} className="w-auto" /></Link>
              </div>

              {/* Desktop Logo */}
              <div className="hidden md:flex">
                <Link href="/"><Image src="/navlogo/IMG_3794.PNG" alt="FinixMart Logo" width={300} height={300} className="w-auto" /></Link>
              </div>

              {/* Search */}
              <div ref={searchContainerRef} className="hidden md:flex flex-1 max-w-3xl mx-2 lg:mx-4 relative">
                <div className="flex w-full items-center border border-gray-300 rounded-md bg-white overflow-hidden">
                  <button ref={categoryButtonRef} onClick={(e) => { e.stopPropagation(); setIsCategoryMenuOpen(!isCategoryMenuOpen); }} className="flex items-center justify-between px-3 bg-white text-gray-700 h-9 lg:h-10 min-w-[100px] hover:bg-gray-50 text-xs border-r border-gray-300">
                    <span>All Categories</span><ChevronDown className="h-3 w-3 ml-2 text-gray-600" />
                  </button>
                  <Input value={search} onChange={handleSearchChange} onKeyDown={handleKeyPress} onFocus={() => search.trim() && setShowSuggestions(true)} onBlur={() => setTimeout(() => setShowSuggestions(false), 150)} placeholder="Search for anything" className="h-9 lg:h-10 px-3 text-gray-700 flex-1 border-0 rounded-none text-xs focus-visible:ring-0 focus-visible:ring-offset-0" />
                  <Button onClick={handleSearchSubmit} className="bg-orange-500 hover:bg-orange-600 h-9 lg:h-10 px-3 min-w-[40px] rounded-none border-0"><Search size={16} /></Button>
                </div>

                {isCategoryMenuOpen && (
                  <div ref={categoryMenuRef} className="absolute top-full left-0 mt-1 z-[100]">
                    <NestedCategoryMenu categories={allCategories} onCategorySelect={handleCategoryClick} onClose={() => setIsCategoryMenuOpen(false)} />
                  </div>
                )}
                {showSuggestions && (
                  <SearchSuggestions query={suggestionQuery} onSelect={handleSuggestionSelect} onClose={() => setShowSuggestions(false)} width={searchContainerRef.current?.clientWidth} />
                )}
              </div>

              {/* Right */}
              <div className="flex items-center gap-1 md:gap-2 lg:gap-3">
                {isAuthenticated ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="link" className="text-white hidden sm:flex items-center gap-1 text-xs px-2">
                        <User size={14} /><span className="max-w-[100px] truncate">{getUserDisplayName()}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem onClick={handleUserDashboardClick} className="cursor-pointer"><User className="mr-2 h-4 w-4" /><span>Dashboard</span></DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600"><LogOut className="mr-2 h-4 w-4" /><span>Logout</span></DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <>
                    <Link href="/vendorauth"><Button variant="link" className="text-white hidden sm:block text-xs">Become a Seller</Button></Link>
                    <Link href="/register"><Button variant="link" className="text-white hidden sm:block text-xs">Sign Up</Button></Link>
                    <Button variant="link" onClick={() => setShowLoginModal(true)} className="text-white hidden sm:block text-xs">Sign in</Button>
                  </>
                )}

                {/* Wishlist with badge */}
                <button onClick={handleWishlistClick} className="relative flex items-center justify-center text-white w-8 h-8 hover:opacity-80">
                  <Heart size={16} />
                  <CountBadge count={wishlistCount} />
                </button>

                {/* Cart with badge */}
                <button onClick={handleCartClick} className="relative flex items-center justify-center text-white w-8 h-8 hover:opacity-80">
                  <ShoppingBag size={16} />
                  <CountBadge count={cartCount} />
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Search */}
          <div className="md:hidden px-2 py-1 bg-[#0b5052]">
            <div ref={mobileSearchContainerRef} className="relative flex w-full gap-x-1">
              <Input value={search} onChange={handleSearchChange} onKeyDown={handleKeyPress} onFocus={() => search.trim() && setShowSuggestions(true)} onBlur={() => setTimeout(() => setShowSuggestions(false), 150)} placeholder="Search for anything" className="bg-white rounded-l-md border border-gray-300 text-gray-700 text-xs h-8 flex-1" />
              <Button onClick={handleSearchSubmit} className="bg-orange-500 hover:bg-orange-600 rounded-r-md px-2 h-8 min-w-[36px]"><Search size={14} /></Button>
              {showSuggestions && (
                <SearchSuggestions query={suggestionQuery} onSelect={handleSuggestionSelect} onClose={() => setShowSuggestions(false)} width={mobileSearchContainerRef.current?.clientWidth} />
              )}
            </div>
          </div>
        </header>
      </>
    );
  }

  return <></>;
}