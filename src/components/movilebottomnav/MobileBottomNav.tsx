"use client";

import Link from "next/link";
import { Home, Grid, ShoppingCart, Heart, User } from "lucide-react";
import { usePathname } from "next/navigation";

const navItems = [
  { name: "Home", href: "/", icon: Home },
  { name: "Shop", href: "/products", icon: Grid },
  { name: "Cart", href: "/cart", icon: ShoppingCart, badge: 3 },
  { name: "Wishlist", href: "/wishlist", icon: Heart, badge: 12 },
  { name: "Account", href: "/account", icon: User },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gradient-to-b from-white to-teal-50 border-t border-teal-100 shadow-lg shadow-teal-100/30 md:hidden z-50">
      <ul className="flex justify-between items-stretch px-3 py-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <li key={item.name} className="flex-1">
              <Link
                href={item.href}
                className={`relative flex flex-col items-center justify-center pt-2 pb-1.5 rounded-lg mx-1 transition-all duration-200 ${
                  isActive 
                    ? 'text-teal-600 bg-gradient-to-b from-teal-50 to-white shadow-inner shadow-teal-200/50' 
                    : 'text-gray-600 hover:text-teal-600 hover:bg-teal-50/50'
                }`}
              >
                {/* Active Indicator */}
                {isActive && (
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-teal-500 rounded-full"></div>
                )}
                
                {/* Icon Container */}
                <div className="relative">
                  <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-teal-600' : 'text-gray-500'}`} />
                  
                  {/* Badge */}
                  {item.badge && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold border border-white">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </div>
                
                {/* Label */}
                <span className={`text-[10px] font-medium mt-0.5 transition-colors ${
                  isActive ? 'text-teal-700' : 'text-gray-600'
                }`}>
                  {item.name}
                </span>
                
                {/* Active Background Animation */}
                {isActive && (
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-t from-teal-100/30 to-transparent"></div>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}