"use client";

import { useState, useRef, ChangeEvent, useEffect } from "react";
import { Menu, Search, Heart, ShoppingBag, ChevronDown, X } from "lucide-react";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Image from "next/image";

export default function Navbar(): JSX.Element {
  const [search, setSearch] = useState<string>("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isNavbarFixed, setIsNavbarFixed] = useState<boolean>(false);
  const [popoverWidth, setPopoverWidth] = useState<number>(0);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      // Calculate 30% of viewport height
      const scrollThreshold = window.innerHeight * 0.7;
      
      // Check if scrolled past the threshold
      if (window.scrollY > scrollThreshold) {
        setIsNavbarFixed(true);
      } else {
        setIsNavbarFixed(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    // Update popover width when search container ref is available or changes
    if (searchContainerRef.current) {
      setPopoverWidth(searchContainerRef.current.clientWidth);
    }
  }, [searchContainerRef.current]);

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setSearch(e.target.value);
  };

  const toggleMobileMenu = (): void => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const categories: string[][] = [
    [
      "Smart Appliances",
      "Smart TV",
      "Air Purifiers",
      "Automobiles & Motorcycles",
      "Beauty & Health",
      "Collectibles & Art",
    ],
    [
      "Electronics",
      "Fashion",
      "Footwear",
      "Home & Garden",
      "Jewelry & Accessories",
      "Kitchen & Dining",
    ],
    [
      "Mother & Kids",
      "Sports & Entertainment",
      "Tools & Home Improvement",
      "Toys & Games",
      "All",
    ],
  ];

  return (
    <>
      {/* Spacer to prevent content jump when navbar becomes fixed */}
      {isNavbarFixed && <div className="h-28 md:h-36"></div>}
      
      <header className={`w-full bg-teal-900 text-white ${isNavbarFixed ? 'fixed top-0 left-0 z-50 shadow-lg animate-in slide-in-from-top duration-300' : 'relative'}`}>
        {/* Main Navbar */}
        <div className="h-14 md:h-24 flex items-center">
          <div className="flex items-center justify-between w-full px-3 md:px-4">
            {/* Mobile Menu Button */}
            <div className="flex items-center gap-2 md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMobileMenu}
                className="text-white p-1 h-7 w-7"
              >
                <Menu size={16} />
              </Button>
              {/* SVG Logo for mobile */}
              <Image
                src="/homesection/logo-light-short.svg"
                alt="Motta Logo"
                width={90}
                height={36}
                className="h-6 w-auto"
              />
            </div>

            {/* Desktop Left Section */}
            <div className="hidden md:flex items-center gap-3 lg:gap-4">
              {/* SVG Logo for desktop */}
              <Image
                src="/homesection/logo-light-short.svg"
                alt="Motta Logo"
                width={90}
                height={36}
                className="h-7 w-auto"
              />

              {/* Categories Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-1 text-white hover:bg-teal-800 px-2 py-1 text-xs lg:text-sm"
                  >
                    Categories <ChevronDown size={14} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-white text-black">
                  <DropdownMenuItem>Electronics</DropdownMenuItem>
                  <DropdownMenuItem>Clothing</DropdownMenuItem>
                  <DropdownMenuItem>Books</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Deals */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-1 text-white hover:bg-teal-800 px-2 py-1 text-xs lg:text-sm"
                  >
                    Deals <ChevronDown size={14} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-white text-black">
                  <DropdownMenuItem>Hot Deals</DropdownMenuItem>
                  <DropdownMenuItem>Clearance</DropdownMenuItem>
                  <DropdownMenuItem>Special Offers</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* What's New */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-1 text-white font-semibold hover:bg-teal-800 px-2 py-1 text-xs lg:text-sm"
                  >
                    What's New <ChevronDown size={14} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-white text-black">
                  <DropdownMenuItem>Latest</DropdownMenuItem>
                  <DropdownMenuItem>Trending</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Search Bar - Desktop */}
            <div ref={searchContainerRef} className="hidden md:flex flex-1 max-w-3xl mx-2 lg:mx-4 relative">
              <div className="flex w-full items-center border border-gray-300 rounded-md bg-white overflow-hidden">
                {/* All Categories Dropdown inside Input */}
                <Popover>
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
                      <X className="h-4 w-4 cursor-pointer" />
                    </div>
                    <div className="grid grid-cols-3 gap-x-6 gap-y-2 text-xs text-gray-700">
                      {categories.map((col, colIdx) => (
                        <div key={colIdx} className="flex flex-col space-y-2">
                          {col.map((cat) => (
                            <button
                              key={cat}
                              className="text-left hover:underline"
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                      ))}
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
              <Button
                variant="link"
                className="text-white hidden sm:block text-xs"
              >
                Sign in
              </Button>
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

        {/* Mobile Search Bar - Always visible */}
        <div className="md:hidden px-2 py-1 bg-teal-900">
          <div className="flex w-full gap-x-1">
            {/* Mobile Search Input - Full width without categories dropdown */}
            <Input
              value={search}
              onChange={handleSearchChange}
              placeholder="Search for anything"
              className="bg-white rounded-l-md border border-gray-300 text-gray-700 text-xs h-8 flex-1"
            />

            {/* Mobile Search Button */}
            <Button className="bg-orange-500 hover:bg-orange-600 rounded-r-md px-2 h-8 min-w-[36px]">
              <Search size={14} />
            </Button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50 md:hidden">
            <div className="fixed left-0 top-0 h-full w-64 bg-teal-900 text-white shadow-lg">
              <div className="flex items-center justify-between p-3 border-b border-teal-800">
                <div className="h-6 w-20 bg-white/20 rounded flex items-center justify-center">
                  <span className="text-xs font-bold">MOTTA</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleMobileMenu}
                  className="text-white p-1 h-7 w-7"
                >
                  <X size={16} />
                </Button>
              </div>

              <div className="p-3 space-y-3">
                <div className="space-y-2">
                  <h3 className="font-semibold text-orange-300 text-xs">
                    Navigation
                  </h3>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="w-full justify-between text-white hover:bg-teal-800 py-2 h-9 text-xs"
                      >
                        Categories <ChevronDown size={14} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-white text-black w-52">
                      <DropdownMenuItem>Electronics</DropdownMenuItem>
                      <DropdownMenuItem>Clothing</DropdownMenuItem>
                      <DropdownMenuItem>Books</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="w-full justify-between text-white hover:bg-teal-800 py-2 h-9 text-xs"
                      >
                        Deals <ChevronDown size={14} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-white text-black w-52">
                      <DropdownMenuItem>Hot Deals</DropdownMenuItem>
                      <DropdownMenuItem>Clearance</DropdownMenuItem>
                      <DropdownMenuItem>Special Offers</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="w-full justify-between text-white font-semibold hover:bg-teal-800 py-2 h-9 text-xs"
                      >
                        What's New <ChevronDown size={14} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-white text-black w-52">
                      <DropdownMenuItem>Latest</DropdownMenuItem>
                      <DropdownMenuItem>Trending</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <hr className="border-teal-800" />

                <div className="space-y-2">
                  <h3 className="font-semibold text-orange-300 text-xs">
                    Account
                  </h3>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-white hover:bg-teal-800 py-2 h-9 text-xs"
                  >
                    Sign in
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
}