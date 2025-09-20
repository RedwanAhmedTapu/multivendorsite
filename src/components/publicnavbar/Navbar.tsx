"use client";

import { useState, useRef, ChangeEvent, useEffect } from "react";
import {
  Menu,
  Search,
  Heart,
  ShoppingBag,
  ChevronDown,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { JSX } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useGetCategoriesQuery } from "@/features/apiSlice";

export default function Navbar(): JSX.Element {
  const pathname = usePathname();
  const router = useRouter();

  const [search, setSearch] = useState<string>("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isNavbarFixed, setIsNavbarFixed] = useState<boolean>(false);
  const [popoverWidth, setPopoverWidth] = useState<number>(0);
  const [isPopoverOpen, setIsPopoverOpen] = useState<boolean>(false); // ✅ control popover
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // ✅ Fetch categories
  const { data: categoriesData } = useGetCategoriesQuery();
  const rootCategories =
    categoriesData?.filter((cat: any) => !cat.parentId) || [];

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
    pathname.includes("vendor-dashboard")
  ) {
    return <></>;
  }

  const handleCategoryClick = (slug: string) => {
    setIsPopoverOpen(false); // ✅ close popover after click
    router.push(`/products?cat=${slug}`);
  };

  return (
    <>
      {isNavbarFixed && <div className="h-28 md:h-36"></div>}
      <header
        className={`w-full bg-teal-900 text-white ${
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
              <Image
                src="/homesection/logo-light-short.svg"
                alt="Motta Logo"
                width={90}
                height={36}
                className="h-6 w-auto"
              />
            </div>

            {/* Desktop Left */}
            <div className="hidden md:flex items-center gap-3 lg:gap-4">
              <Image
                src="/homesection/logo-light-short.svg"
                alt="Motta Logo"
                width={90}
                height={36}
                className="h-7 w-auto"
              />
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
                  onOpenChange={setIsPopoverOpen} // ✅ control popover
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
                      {/* ✅ close popover when X clicked */}
                      <X
                        className="h-4 w-4 cursor-pointer"
                        onClick={() => setIsPopoverOpen(false)}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-x-6 gap-y-2 text-xs text-gray-700">
                      {rootCategories.length > 0 ? (
                        rootCategories.map((cat: any) => (
                          <button
                            key={cat.id}
                            onClick={() => handleCategoryClick(cat.slug)}
                            className="text-left hover:underline"
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
                  placeholder="Search for anything"
                  className="h-9 lg:h-10 px-3 text-gray-700 flex-1 border-0 rounded-none text-xs focus-visible:ring-0 focus-visible:ring-offset-0"
                />

                {/* Search Button */}
                <Button className="bg-orange-500 hover:bg-orange-600 h-9 lg:h-10 px-3 min-w-[40px] rounded-none border-0">
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
        <div className="md:hidden px-2 py-1 bg-teal-900">
          <div className="flex w-full gap-x-1">
            <Input
              value={search}
              onChange={handleSearchChange}
              placeholder="Search for anything"
              className="bg-white rounded-l-md border border-gray-300 text-gray-700 text-xs h-8 flex-1"
            />
            <Button className="bg-orange-500 hover:bg-orange-600 rounded-r-md px-2 h-8 min-w-[36px]">
              <Search size={14} />
            </Button>
          </div>
        </div>
      </header>
    </>
  );
}
