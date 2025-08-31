"use client";

import { Bell, ChevronDown, LogOut, Menu, Search, Settings, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Link from "next/link";

export function AdminNavbar() {

  return (
    <header className="sticky top-0 z-50 w-full bg-gray-900 border-b border-gray-800 px-4">
      <div className="flex h-16 items-center justify-between">
        {/* Left side - Mobile menu and brand */}
        <div className="flex items-center gap-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden text-gray-300 hover:bg-gray-800 hover:text-white">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] bg-gray-900 border-r border-gray-800">
              <div className="flex items-center gap-3 p-4 border-b border-gray-800">
                <div className="p-2 bg-teal-500 rounded-lg">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">FinixMart</h2>
                  <p className="text-xs text-gray-400">Admin Dashboard</p>
                </div>
              </div>
              <nav className="flex flex-col gap-2 pt-6">
                <Link href="/admin-dashboard" className="px-4 py-2 text-gray-300 hover:bg-gray-800 hover:text-white rounded-md font-medium transition-colors">
                  Dashboard
                </Link>
                <Link href="/admin-dashboard/users" className="px-4 py-2 text-gray-300 hover:bg-gray-800 hover:text-white rounded-md font-medium transition-colors">
                  Users
                </Link>
                <Link href="/admin-dashboard/content" className="px-4 py-2 text-gray-300 hover:bg-gray-800 hover:text-white rounded-md font-medium transition-colors">
                  Content
                </Link>
                <Link href="/admin-dashboard/settings" className="px-4 py-2 text-gray-300 hover:bg-gray-800 hover:text-white rounded-md font-medium transition-colors">
                  Settings
                </Link>
              </nav>
            </SheetContent>
          </Sheet>

          <Link href="/admin-dashboard" className="font-bold text-white flex items-center gap-2">
            <div className="p-1.5 bg-teal-500 rounded-md">
              <User className="h-5 w-5 text-white" />
            </div>
            <span className="hidden sm:inline-block">FinixMart</span>
          </Link>
        </div>

        {/* Center - Search (hidden on mobile) */}
        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Search..."
              className="w-full pl-9 bg-gray-800 border-gray-700 text-white placeholder:text-gray-400 focus:ring-teal-500"
            />
          </div>
        </div>

        {/* Right side - User controls */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-gray-800">
            <Bell className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-gray-800">
            <Settings className="h-5 w-5" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 text-gray-300 hover:bg-gray-800 hover:text-white">
                <div className="h-8 w-8 rounded-full bg-teal-600 flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <span className="hidden md:inline">Admin</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-gray-800 border-gray-700 text-white">
              <DropdownMenuLabel className="text-gray-300">Admin Account</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-gray-700" />
              <DropdownMenuItem asChild className="text-gray-300 hover:bg-gray-700 focus:bg-gray-700 focus:text-white">
                <Link href="/admin-dashboard/profile" className="flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="text-gray-300 hover:bg-gray-700 focus:bg-gray-700 focus:text-white">
                <Link href="/admin-dashboard/settings" className="flex items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-700" />
              <DropdownMenuItem className="text-red-400 hover:bg-gray-700 hover:text-red-300 focus:bg-gray-700 focus:text-red-300">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}