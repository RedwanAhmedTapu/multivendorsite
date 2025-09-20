"use client";

import { User, Settings, Menu, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type NavbarProps = {
  onMobileMenuClick: () => void;
};

export function VendorNavbar({ onMobileMenuClick }: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-200 px-4 shadow-sm">
      <div className="flex h-16 items-center justify-between">
        {/* Left: Menu + Brand */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-gray-700 hover:bg-gray-100 hover:text-black"
            onClick={onMobileMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <Link
            href="/vendor-dashboard"
            className="font-bold text-gray-900 flex items-center gap-2"
          >
            <div className="p-1.5 bg-teal-500 rounded-md">
              <User className="h-5 w-5 text-white" />
            </div>
            <span className="hidden sm:inline-block">FinixMart Vendor</span>
          </Link>
        </div>

        {/* Right: Icons */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-500 hover:text-teal-600 hover:bg-gray-100"
          >
            <Bell className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-500 hover:text-teal-600 hover:bg-gray-100"
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
