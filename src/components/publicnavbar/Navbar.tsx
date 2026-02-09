"use client";

import { useState, useRef, ChangeEvent, useEffect } from "react";
import { Menu, Search, Heart, ShoppingBag, ChevronDown, X, Package, HelpCircle, Globe, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { JSX } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { useGetCategoriesQuery } from "@/features/apiSlice";
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

export default function Navbar(): JSX.Element {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();

  const [search, setSearch] = useState<string>("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isNavbarFixed, setIsNavbarFixed] = useState<boolean>(false);
  const [popoverWidth, setPopoverWidth] = useState<number>(0);
  const [isPopoverOpen, setIsPopoverOpen] = useState<boolean>(false);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState<boolean>(false);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [loginRedirectPath, setLoginRedirectPath] = useState<string>("");
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const categoryButtonRef = useRef<HTMLButtonElement>(null);
  const categoryMenuRef = useRef<HTMLDivElement>(null);

  // Get user from Redux store
  const { user } = useSelector((state: RootState) => state.auth);
  const isAuthenticated = !!user;

  // ✅ Fetch categories
  const { data: categoriesData } = useGetCategoriesQuery();
  // ✅ Fetch active theme
  const { data: activeThemeData, isLoading: isThemeLoading } = useGetActiveThemeQuery();
  const activeLayoutType = activeThemeData?.data?.layoutType || 'layout_1';

  // Determine theme based on layout type
  const theme = activeLayoutType === 'layout_1' ? 'modern' : 'default';
  const rootCategories: Category[] = categoriesData?.filter((cat: Category) => !cat.parentId) || [];
  const allCategories: Category[] = categoriesData || [];

  useEffect(() => {
    const handleScroll = () => {
      const scrollThreshold = window.innerHeight * 0.7;
      setIsNavbarFixed(window.scrollY > scrollThreshold);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (searchContainerRef.current) {
      setPopoverWidth(searchContainerRef.current.clientWidth);
    }
  }, []);

  // Close category menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isCategoryMenuOpen && 
          categoryButtonRef.current && 
          !categoryButtonRef.current.contains(event.target as Node) &&
          categoryMenuRef.current &&
          !categoryMenuRef.current.contains(event.target as Node)) {
        setIsCategoryMenuOpen(false);
      }
    };

    if (isCategoryMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCategoryMenuOpen]);

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setSearch(e.target.value);
  };

  const toggleMobileMenu = (): void => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleLogout = () => {
    dispatch(clearAuth());
    router.push("/");
  };

  const handleCartClick = () => {
    if (isAuthenticated) {
      router.push("/cart");
    } else {
      setLoginRedirectPath("/cart");
      setShowLoginModal(true);
    }
  };

  const handleWishlistClick = () => {
    if (isAuthenticated) {
      router.push("/wishlist");
    } else {
      setLoginRedirectPath("/wishlist");
      setShowLoginModal(true);
    }
  };

  const handleUserDashboardClick = () => {
    if (user?.role === "CUSTOMER") {
      router.push(`/user-dashboard?userid=${user.id}`);
    } else if (user?.role === "VENDOR") {
      router.push("/vendor-dashboard");
    } else if (user?.role === "ADMIN") {
      router.push("/admin-dashboard");
    }
  };

  const handleLoginSuccess = () => {
    setShowLoginModal(false);
    if (loginRedirectPath) {
      router.push(loginRedirectPath);
      setLoginRedirectPath("");
    }
  };

  // ✅ hide navbar if admin/vendor
  if (
    pathname.includes("admin-dashboard") ||
    pathname.includes("vendor-dashboard") ||
    pathname.includes("user-dashboard") ||
    pathname.includes("register") ||
    pathname.includes("reset-password") ||
    pathname.includes("login") ||
    pathname.includes("accounting") ||
    pathname.includes("vendor-store-decoration")
  ) {
    return <></>;
  }

  const handleCategoryClick = (slug: string) => {
    // Navigate first
    if (pathname === '/products') {
      const params = new URLSearchParams(searchParams.toString());
      params.set('category', slug);
      router.replace(`/products?${params.toString()}`, { scroll: false });
    } else {
      router.push(`/products?category=${slug}`);
    }
    
    // Then close menus
    setIsPopoverOpen(false);
    setIsCategoryMenuOpen(false);
  };

  const handleSearchSubmit = () => {
    if (search.trim()) {
      if (pathname === '/products') {
        const params = new URLSearchParams(searchParams.toString());
        params.set('search', search.trim());
        router.replace(`/products?${params.toString()}`, { scroll: false });
      } else {
        router.push(`/products?search=${encodeURIComponent(search.trim())}`);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearchSubmit();
    }
  };

  // Get display name for user
  const getUserDisplayName = () => {
    if (!user) return "";
    return user.name || user.email || user.phone || "User";
  };

  if (theme === "default") {
    return (
      <>
        {/* Login Modal */}
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onLoginSuccess={handleLoginSuccess}
          redirectPath={loginRedirectPath}
          message={loginRedirectPath ? "Please sign in to continue" : undefined}
        />

        {/* Placeholder to prevent content jump when navbar becomes fixed */}
        {isNavbarFixed && <div className="h-[80px]"></div>}
        
        <header 
          className={`w-full bg-white p-0 ${
            isNavbarFixed
              ? "fixed top-0 left-0 z-50 shadow-sm animate-in slide-in-from-top duration-300"
              : "relative"
          }`}
        >
          {/* Top Bar */}
          <div 
            className={`border-b border-gray-200 ${
              isNavbarFixed ? "hidden" : "block"
            }`}
          >
            <Container className="h-12 flex items-center justify-between text-xs px-4 lg:px-0">
              {/* Left Links - Hide on mobile, show on medium+ */}
              <div className="hidden md:flex items-center gap-4 lg:gap-6 text-gray-600">
                <a href="#" className="hover:text-gray-900 whitespace-nowrap">About Us</a>
                <a href="#" className="hover:text-gray-900 whitespace-nowrap">Contact Us</a>
                <a href="#" className="hover:text-gray-900 whitespace-nowrap">Help Center</a>
                <a href="#" className="hover:text-gray-900 whitespace-nowrap">Find Stores</a>
                <a href="#" className="hover:text-gray-900 whitespace-nowrap">Gift Cards</a>
              </div>
              
              {/* Mobile Logo */}
              <div className="md:hidden flex-1">
                <Link href="/">
                  <Image
                    src="/navlogo/IMG_3794.PNG"
                    alt="FinixMart Logo"
                    width={80}
                    height={32}
                    className="w-auto"
                  />
                </Link>
              </div>

              {/* Right Links */}
              <div className="flex items-center gap-3 md:gap-4 text-gray-600">
                <a href="#" className="hidden sm:flex items-center gap-1 md:gap-2 hover:text-gray-900 whitespace-nowrap">
                  <Package size={14} className="md:size-[16px]" />
                  <span className="text-xs">Track Order</span>
                </a>
                <a href="#" className="hidden md:flex items-center gap-2 hover:text-gray-900 whitespace-nowrap">
                  <HelpCircle size={16} />
                  <span className="text-xs">Help Center</span>
                </a>
                <a href="#" className="hidden lg:flex items-center gap-2 hover:text-gray-900 whitespace-nowrap">
                  <span className="text-xs">Compare</span>
                </a>
                <a href="#" className="flex items-center gap-1 md:gap-2 hover:text-gray-900 whitespace-nowrap">
                  <Globe size={14} className="md:size-[16px]" />
                  <span className="text-xs">English</span>
                </a>
              </div>
            </Container>
          </div>

          {/* Main Navbar */}
          <Container className="h-20 flex items-center justify-between px-4 lg:px-0 gap-4">
            {/* Logo - Hide on mobile (already shown in top bar) */}
            <div className="hidden md:flex items-center flex-shrink-0">
              <Link href="/">
                <Image
                  src="/navlogo/IMG_3794.PNG"
                  alt="FinixMart Logo"
                  width={90}
                  height={36}
                  className="w-auto"
                />
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMobileMenu}
                className="h-9 w-9 p-0"
              >
                <Menu size={20} />
              </Button>
            </div>

            {/* Search Bar */}
            <div ref={searchContainerRef} className="flex-1 max-w-2xl lg:max-w-3xl mx-0 lg:mx-4 relative">
              <div className="flex items-center border border-gray-300 rounded-lg bg-white overflow-hidden">
                {/* Category Dropdown - Mobile Simple Dropdown */}
                <div className="relative flex md:hidden">
                  <button
                    onClick={() => setIsPopoverOpen(!isPopoverOpen)}
                    className="flex items-center gap-1 md:gap-2 px-3 md:px-4 h-10 md:h-12 bg-gray-50 hover:bg-gray-100 border-r border-gray-300 text-gray-700 text-xs md:text-sm whitespace-nowrap"
                  >
                    <span>All</span>
                    <ChevronDown size={14} className="md:size-[16px]" />
                  </button>
                  
                  {isPopoverOpen && (
                    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4"
                      style={{ width: popoverWidth }}>
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-semibold text-sm">Select Categories</h3>
                        <X
                          className="h-4 w-4 cursor-pointer hover:text-gray-700"
                          onClick={() => setIsPopoverOpen(false)}
                        />
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3 text-xs md:text-sm text-gray-700">
                        {rootCategories.map((cat) => (
                          <button
                            key={cat.id}
                            onClick={() => handleCategoryClick(cat.slug)}
                            className="text-left hover:text-emerald-600 cursor-pointer truncate"
                          >
                            {cat.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Category Dropdown - Desktop Nested Menu */}
                <div className="relative hidden md:block">
                  <button
                    ref={categoryButtonRef}
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsCategoryMenuOpen(!isCategoryMenuOpen);
                    }}
                    className="flex items-center gap-2 px-4 h-12 bg-gray-50 hover:bg-gray-100 border-r border-gray-300 text-gray-700 text-sm whitespace-nowrap"
                  >
                    <span>All Categories</span>
                    <ChevronDown size={16} />
                  </button>
                </div>

                {/* Search Input */}
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Search for anything"
                  className="flex-1 h-10 md:h-12 px-3 md:px-4 text-gray-700 text-xs md:text-sm outline-none placeholder:text-gray-400"
                />

                {/* Search Button */}
                <button
                  onClick={handleSearchSubmit}
                  className="bg-emerald-500 hover:bg-emerald-600 h-10 md:h-12 px-3 md:px-6 text-white flex items-center justify-center min-w-[40px] md:min-w-[60px]"
                >
                  <Search size={18} className="md:size-[20px]" />
                </button>
              </div>

              {/* Desktop Nested Category Menu - Positioned outside search bar */}
              {isCategoryMenuOpen && (
                <div 
                  ref={categoryMenuRef}
                  className="absolute top-full left-0 mt-1 z-[100]"
                >
                  <NestedCategoryMenu 
                    categories={allCategories}
                    onCategorySelect={handleCategoryClick}
                    onClose={() => setIsCategoryMenuOpen(false)}
                  />
                </div>
              )}
            </div>

            {/* Right Icons */}
            <div className="flex items-center gap-2 md:gap-4">
              {/* User Account or Login */}
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="hidden sm:flex items-center gap-2 text-gray-700 hover:text-emerald-600 p-1">
                      <User size={22} className="md:size-[24px]" />
                      <span className="hidden lg:block text-sm font-medium max-w-[120px] truncate">
                        {getUserDisplayName()}
                      </span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem onClick={handleUserDashboardClick} className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <button 
                  onClick={() => setShowLoginModal(true)}
                  className="hidden sm:flex flex-col items-center text-gray-700 hover:text-emerald-600 p-1"
                >
                  <User size={22} className="md:size-[24px]" />
                </button>
              )}

              <button 
                onClick={handleWishlistClick}
                className="hidden sm:flex flex-col items-center text-gray-700 hover:text-emerald-600 p-1"
              >
                <Heart size={22} className="md:size-[24px]" />
              </button>
              <button 
                onClick={handleCartClick}
                className="hidden sm:flex items-center gap-1 md:gap-2 bg-red-400 hover:bg-red-500 text-white px-3 md:px-4 h-10 md:h-12 rounded-lg whitespace-nowrap"
              >
                <ShoppingBag size={18} className="md:size-[20px]" />
                <span className="font-medium text-xs md:text-sm">Cart</span>
              </button>
            </div>
          </Container>
        </header>
      </>
    );
  }

  if (theme === "modern") {
    return (
      <>
        {/* Login Modal */}
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onLoginSuccess={handleLoginSuccess}
          redirectPath={loginRedirectPath}
          message={loginRedirectPath ? "Please sign in to continue" : undefined}
        />

        {isNavbarFixed && <div className="h-28 md:h-36"></div>}
        <header
          className={`w-full bg-[#0b5052] text-white ${
            isNavbarFixed
              ? "fixed top-0 left-0 z-50 shadow-lg animate-in slide-in-from-top duration-300"
              : "relative"
          }`}
        >
          {/* Main Navbar */}
          <div className="h-14 md:h-24 flex items-center">
            <div className="flex items-center justify-between w-full px-3 md:px-4">
              {/* Mobile Menu */}
              <div className="flex items-center gap-2 md:hidden">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleMobileMenu}
                  className="text-white p-1 h-7 w-7"
                >
                  <Menu size={16} />
                </Button>
                <Link href="/">
                  <Image
                    src="/navlogo/IMG_3794.PNG"
                    alt="FinixMart Logo"
                    width={90}
                    height={36}
                    className="w-auto"
                  />
                </Link>
              </div>

              {/* Desktop Left */}
              <div className="hidden md:flex items-center gap-3 lg:gap-4">
                <Link href="/">
                  <Image
                    src="/navlogo/IMG_3794.PNG"
                    alt="FinixMart Logo"
                    width={300}
                    height={300}
                    className="w-auto"
                  />
                </Link>
              </div>

              {/* Search Bar */}
              <div
                ref={searchContainerRef}
                className="hidden md:flex flex-1 max-w-3xl mx-2 lg:mx-4 relative"
              >
                <div className="flex w-full items-center border border-gray-300 rounded-md bg-white overflow-hidden">
                  {/* All Categories Button - Desktop Nested Menu */}
                  <div className="relative">
                    <button
                      ref={categoryButtonRef}
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsCategoryMenuOpen(!isCategoryMenuOpen);
                      }}
                      className="flex items-center justify-between px-3 bg-white text-gray-700 h-9 lg:h-10 min-w-[100px] hover:bg-gray-50 text-xs border-0 rounded-none border-r border-gray-300"
                    >
                      <span>All Categories</span>
                      <ChevronDown className="h-3 w-3 ml-2 text-gray-600" />
                    </button>
                  </div>

                  {/* Search Input */}
                  <Input
                    value={search}
                    onChange={handleSearchChange}
                    onKeyPress={handleKeyPress}
                    placeholder="Search for anything"
                    className="h-9 lg:h-10 px-3 text-gray-700 flex-1 border-0 rounded-none text-xs focus-visible:ring-0 focus-visible:ring-offset-0"
                  />

                  {/* Search Button */}
                  <Button 
                    onClick={handleSearchSubmit}
                    className="bg-orange-500 hover:bg-orange-600 h-9 lg:h-10 px-3 min-w-[40px] rounded-none border-0"
                  >
                    <Search size={16} />
                  </Button>
                </div>

                {/* Desktop Nested Category Menu - Positioned outside search bar */}
                {isCategoryMenuOpen && (
                  <div 
                    ref={categoryMenuRef}
                    className="absolute top-full left-0 mt-1 z-[100]"
                  >
                    <NestedCategoryMenu 
                      categories={allCategories}
                      onCategorySelect={handleCategoryClick}
                      onClose={() => setIsCategoryMenuOpen(false)}
                    />
                  </div>
                )}
              </div>

              {/* Right Section */}
              <div className="flex items-center gap-1 md:gap-2 lg:gap-3">
                {isAuthenticated ? (
                  <>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="link"
                          className="text-white hidden sm:flex items-center gap-1 text-xs px-2"
                        >
                          <User size={14} />
                          <span className="max-w-[100px] truncate">{getUserDisplayName()}</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuItem onClick={handleUserDashboardClick} className="cursor-pointer">
                          <User className="mr-2 h-4 w-4" />
                          <span>Dashboard</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
                          <LogOut className="mr-2 h-4 w-4" />
                          <span>Logout</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                ) : (
                  <>
                    <Link href="/vendor-register">
                      <Button
                        variant="link"
                        className="text-white hidden sm:block text-xs"
                      >
                        Become a Seller
                      </Button>
                    </Link>
                    <Link href="/register">
                      <Button
                        variant="link"
                        className="text-white hidden sm:block text-xs"
                      >
                        Sign Up
                      </Button>
                    </Link>
                    <Button
                      variant="link"
                      onClick={() => setShowLoginModal(true)}
                      className="text-white hidden sm:block text-xs"
                    >
                      Sign in
                    </Button>
                  </>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleWishlistClick}
                  className="text-white p-1 h-7 w-7"
                >
                  <Heart size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCartClick}
                  className="text-white p-1 h-7 w-7"
                >
                  <ShoppingBag size={16} />
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile Search */}
          <div className="md:hidden px-2 py-1 bg-[#0b5052]">
            <div className="flex w-full gap-x-1">
              <Input
                value={search}
                onChange={handleSearchChange}
                onKeyPress={handleKeyPress}
                placeholder="Search for anything"
                className="bg-white rounded-l-md border border-gray-300 text-gray-700 text-xs h-8 flex-1"
              />
              <Button 
                onClick={handleSearchSubmit}
                className="bg-orange-500 hover:bg-orange-600 rounded-r-md px-2 h-8 min-w-[36px]"
              >
                <Search size={14} />
              </Button>
            </div>
          </div>
        </header>
      </>
    );
  }

  return <></>;
}