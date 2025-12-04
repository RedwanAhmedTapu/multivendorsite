"use client";

import { useState, useRef, ChangeEvent, useEffect } from "react";
import { Menu, Search, Heart, ShoppingBag, ChevronDown, X, Package, HelpCircle, Globe, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { JSX } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useGetCategoriesQuery } from "@/features/apiSlice";
import { Container } from "../Container";
import { useGetActiveThemeQuery } from "@/features/themeApi";

interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
}

export default function Navbar(): JSX.Element {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState<string>("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isNavbarFixed, setIsNavbarFixed] = useState<boolean>(false);
  const [popoverWidth, setPopoverWidth] = useState<number>(0);
  const [isPopoverOpen, setIsPopoverOpen] = useState<boolean>(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // ✅ Fetch categories
  const { data: categoriesData } = useGetCategoriesQuery();
  // ✅ Fetch active theme
  const { data: activeThemeData, isLoading: isThemeLoading } = useGetActiveThemeQuery();
  const activeLayoutType = activeThemeData?.data?.layoutType || 'layout_1';

  // Determine theme based on layout type
  const theme = activeLayoutType === 'layout_1' ? 'modern' : 'default';
  const rootCategories: Category[] = categoriesData?.filter((cat: Category) => !cat.parentId) || [];

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

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setSearch(e.target.value);
  };

  const toggleMobileMenu = (): void => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // ✅ hide navbar if admin/vendor
  if (
    pathname.includes("admin-dashboard") ||
    pathname.includes("vendor-dashboard") ||
    pathname.includes("register") ||
    pathname.includes("reset-password") ||
    pathname.includes("login") ||
    pathname.includes("vendor-store-decoration")
  ) {
    return <></>;
  }

  const handleCategoryClick = (slug: string) => {
    setIsPopoverOpen(false);
    
    if (pathname === '/products') {
      const params = new URLSearchParams(searchParams.toString());
      params.set('category', slug);
      router.replace(`/products?${params.toString()}`, { scroll: false });
    } else {
      router.push(`/products?category=${slug}`);
    }
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

  

  if (theme === "default") {
    return (
      <>
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
            <div ref={searchContainerRef} className="flex-1 max-w-2xl lg:max-w-3xl mx-0 lg:mx-4">
              <div className="flex items-center border border-gray-300 rounded-lg bg-white overflow-hidden">
                {/* Category Dropdown */}
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
            </div>

            {/* Right Icons */}
            <div className="flex items-center gap-2 md:gap-4">
              <button className="hidden sm:flex flex-col items-center text-gray-700 hover:text-emerald-600 p-1">
                <User size={22} className="md:size-[24px]" />
              </button>
              <button className="hidden sm:flex flex-col items-center text-gray-700 hover:text-emerald-600 p-1">
                <Heart size={22} className="md:size-[24px]" />
              </button>
              <button className="hidden sm:flex items-center gap-1 md:gap-2 bg-red-400 hover:bg-red-500 text-white px-3 md:px-4 h-10 md:h-12 rounded-lg whitespace-nowrap">
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
                  {/* All Categories Button */}
                  <Popover
                    open={isPopoverOpen}
                    onOpenChange={setIsPopoverOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="flex items-center justify-between px-2 bg-white text-gray-700 h-9 lg:h-10 min-w-[40px] hover:bg-gray-50 text-xs border-0 rounded-none border-r border-gray-300"
                      >
                        <span>All</span>
                        <ChevronDown className="h-3 w-3 ml-1 text-gray-600" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-full p-4"
                      style={{ width: popoverWidth }}
                      align="start"
                    >
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-semibold text-base">
                          Select Categories
                        </h3>
                        <X
                          className="h-4 w-4 cursor-pointer"
                          onClick={() => setIsPopoverOpen(false)}
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-x-6 gap-y-2 text-xs text-gray-700">
                        {rootCategories.length > 0 ? (
                          rootCategories.map((cat: Category) => (
                            <button
                              key={cat.id}
                              onClick={() => handleCategoryClick(cat.slug)}
                              className="text-left hover:underline cursor-pointer"
                            >
                              {cat.name}
                            </button>
                          ))
                        ) : (
                          <p className="text-gray-500 col-span-3">
                            No categories
                          </p>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>

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
              </div>

              {/* Right Section */}
              <div className="flex items-center gap-1 md:gap-2 lg:gap-3">
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
                <Link href="/login">
                  <Button
                    variant="link"
                    className="text-white hidden sm:block text-xs"
                  >
                    Sign in
                  </Button>
                </Link>

                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white p-1 h-7 w-7"
                >
                  <Heart size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
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