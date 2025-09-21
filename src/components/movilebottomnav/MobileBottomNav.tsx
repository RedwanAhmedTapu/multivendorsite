"use client";

import Link from "next/link";
import { Home, Grid, ShoppingCart, Heart, User } from "lucide-react";

const navItems = [
  { name: "Home", href: "/", icon: Home },
  { name: "Shop", href: "/products", icon: Grid },
  { name: "Cart", href: "/cart", icon: ShoppingCart },
  { name: "Wishlist", href: "/wishlist", icon: Heart },
  { name: "Account", href: "/account", icon: User },
];

export default function MobileBottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 shadow-md md:hidden z-50">
      <ul className="flex justify-between items-center px-4 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.name} className="flex-1 text-center">
              <Link
                href={item.href}
                className="flex flex-col items-center justify-center text-gray-700 hover:text-blue-500"
              >
                <Icon className="w-6 h-6 mb-1" />
                <span className="text-xs">{item.name}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
