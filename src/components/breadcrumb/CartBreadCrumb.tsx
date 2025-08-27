// components/cart/CartBreadcrumb.tsx
"use client";

import Link from "next/link";
import { Home, ShoppingCart } from "lucide-react";

export default function CartBreadcrumb() {
  // Dummy data for the cart
  const cartData = {
    name: "Shopping Cart",
    productCount: 3, // Example count of items in cart
  };

  return (
    <section className="relative w-full h-[180px] bg-[url('/homesection/homev3-cashback.jpg')] bg-center  bg-no-repeat md:h-[200px] flex items-start overflow-hidden px-2 bg-gradient-to-r from-teal-50 via-white to-teal-50">
      {/* Content positioned at start */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-12 flex flex-col mt-8  h-full">
        {/* Breadcrumb */}
        <div className="flex items-start space-x-2 mb-4">
          <Link 
            href="/" 
            className="text-xs text-teal-600 font-medium hover:text-teal-800 flex items-center"
          >
            <Home className="w-3 h-3 mr-1" />
            Home
          </Link>
          <span className="text-xs text-teal-300">/</span>
          <span className="text-xs text-teal-600 font-medium">Cart</span>
          <span className="text-xs text-teal-300">/</span>
          <span className="text-xs text-gray-900 font-semibold">
            {cartData.name}
          </span>
        </div>

      
      </div>
    </section>
  );
}