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
if (
    pathname.includes("admin-dashboard") || pathname.includes("vendor-dashboard") ||
    pathname.includes("user-dashboard") || pathname.includes("register") ||
    pathname.includes("reset-password") || pathname.includes("login") ||
    pathname.includes("accounting") || pathname.includes("vendor-store-decoration")||pathname.includes("store-editor") ||
    pathname === "/hrm" || pathname.startsWith("/hrm/") || pathname === "/pos" || pathname.startsWith("/pos/")
  ) return <></>;
  // --fm-* accent vars carry today's exact colors as fallbacks; the homepage's
  // palette injection overrides them for "/" only (dashboards never see it).
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gradient-to-b from-white to-[var(--fm-accent-tint,#f0fdfa)] border-t border-[var(--fm-accent-tint2,#ccfbf1)] shadow-lg shadow-[var(--fm-accent-shadow,rgba(204,251,241,0.3))] md:hidden z-50">
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
                    ? 'text-[var(--fm-accent,#0d9488)] bg-gradient-to-b from-[var(--fm-accent-tint,#f0fdfa)] to-white shadow-inner shadow-[var(--fm-accent-shadow-strong,rgba(153,246,228,0.5))]' 
                    : 'text-gray-600 hover:text-[var(--fm-accent,#0d9488)] hover:bg-[var(--fm-accent-tint,rgba(240,253,250,0.5))]'
                }`}
              >
                {/* Active Indicator */}
                {isActive && (
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-[var(--fm-accent-light,#14b8a6)] rounded-full"></div>
                )}
                
                {/* Icon Container */}
                <div className="relative">
                  <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-[var(--fm-accent,#0d9488)]' : 'text-gray-500'}`} />
                  
                  {/* Badge */}
                  {item.badge && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[var(--fm-danger,#ef4444)] text-white text-[10px] rounded-full flex items-center justify-center font-bold border border-white">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </div>
                
                {/* Label */}
                <span className={`text-[10px] font-medium mt-0.5 transition-colors ${
                  isActive ? 'text-[var(--fm-accent-hover,#0f766e)]' : 'text-gray-600'
                }`}>
                  {item.name}
                </span>
                
                {/* Active Background Animation */}
                {isActive && (
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-t from-[var(--fm-accent-shadow,rgba(204,251,241,0.3))] to-transparent"></div>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
