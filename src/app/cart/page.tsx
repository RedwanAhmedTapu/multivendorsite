"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Minus, Plus, X, ArrowLeft, Heart, Shield, Truck, RotateCcw } from "lucide-react";
import CartBreadcrumb from "@/components/breadcrumb/CartBreadCrumb";

const CartPage = () => {
  const [cartItems, setCartItems] = useState([
    {
      id: 1,
      name: "Geepas Gp-007 Rechargeable LED Flashlight Torch Lamp",
      price: 180,
      originalPrice: 324,
      image: "/products/1-103.webp",
      quantity: 1,
      inStock: true,
    },
    {
      id: 2,
      name: "Wireless Bluetooth Earbuds with Charging Case",
      price: 899,
      originalPrice: 1299,
      image: "/products/2-75.webp",
      quantity: 2,
      inStock: true,
    },
    {
      id: 3,
      name: "Smart Fitness Tracker Watch - Black",
      price: 1249,
      originalPrice: 1999,
      image: "/products/3.webp",
      quantity: 1,
      inStock: false,
    },
  ]);

  const relatedProducts = [
    {
      id: 4,
      name: "Portable Power Bank 10000mAh",
      price: 699,
      originalPrice: 999,
      image: "/products/1-9.webp",
    },
    {
      id: 5,
      name: "USB-C Fast Charging Cable",
      price: 199,
      originalPrice: 299,
      image: "/products/1-80.webp",
    },
    {
      id: 6,
      name: "Phone Holder for Car Dashboard",
      price: 349,
      originalPrice: 499,
      image: "/products/1-132.webp",
    },
  ];

  const updateQuantity = (id: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    setCartItems(cartItems.map(item => 
      item.id === id ? { ...item, quantity: newQuantity } : item
    ));
  };

  const removeItem = (id: number) => {
    setCartItems(cartItems.filter(item => item.id !== id));
  };

  const moveToWishlist = (id: number) => {
    // Logic to move item to wishlist would go here
    removeItem(id);
  };

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discount = cartItems.reduce((sum, item) => sum + ((item.originalPrice - item.price) * item.quantity), 0);
  const shipping = subtotal > 0 ? (subtotal > 1000 ? 0 : 135) : 0;
  const total = subtotal + shipping;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
     <CartBreadcrumb  /> 
      
      {cartItems.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
            </svg>
          </div>
          <h2 className="text-xl font-medium text-gray-900 mb-2">Your cart is empty</h2>
          <p className="text-gray-600 mb-6">Looks like you haven't added any items to your cart yet.</p>
          <Button className="bg-teal-700 hover:bg-teal-800">
            Continue Shopping
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border p-4 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Cart Items ({cartItems.length})</h2>
                <button className="text-teal-700 text-sm font-medium flex items-center">
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Continue Shopping
                </button>
              </div>
              
              <div className="divide-y">
                {cartItems.map((item) => (
                  <div key={item.id} className="py-4 flex flex-col sm:flex-row">
                    <div className="flex-shrink-0 w-full sm:w-24 h-24 bg-gray-100 rounded-md overflow-hidden mb-3 sm:mb-0">
                      <Image
                        src={item.image}
                        alt={item.name}
                        width={96}
                        height={96}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    
                    <div className="sm:ml-4 flex-1">
                      <div className="flex justify-between">
                        <div>
                          <h3 className="text-sm font-medium text-gray-900 line-clamp-2">
                            {item.name}
                          </h3>
                          {!item.inStock && (
                            <p className="text-xs text-red-600 mt-1">Out of Stock</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-gray-900">৳{item.price}</p>
                          <p className="text-sm text-gray-500 line-through">৳{item.originalPrice}</p>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex justify-between items-center">
                        <div className="flex items-center border rounded-md w-fit">
                          <button 
                            className="px-2 py-1 text-gray-600 hover:bg-gray-100"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="px-3 py-1 text-gray-900">{item.quantity}</span>
                          <button 
                            className="px-2 py-1 text-gray-600 hover:bg-gray-100"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <div className="flex space-x-3">
                          <button 
                            className="text-gray-500 hover:text-teal-700"
                            onClick={() => moveToWishlist(item.id)}
                          >
                            <Heart className="w-5 h-5" />
                          </button>
                          <button 
                            className="text-gray-500 hover:text-red-600"
                            onClick={() => removeItem(item.id)}
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Security & Benefits */}
            <div className="bg-white rounded-lg border p-4 mb-6">
              <h3 className="text-lg font-semibold mb-4">Benefits of your account</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-start">
                  <Shield className="w-6 h-6 text-teal-700 mr-2 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">Secure transaction</h4>
                    <p className="text-sm text-gray-600">Your transaction is secured with encryption</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Truck className="w-6 h-6 text-teal-700 mr-2 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">Free delivery</h4>
                    <p className="text-sm text-gray-600">On orders over ৳1000</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <RotateCcw className="w-6 h-6 text-teal-700 mr-2 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">Easy returns</h4>
                    <p className="text-sm text-gray-600">7-day return policy</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Frequently Bought Together */}
            <div className="bg-white rounded-lg border p-4">
              <h3 className="text-lg font-semibold mb-4">Frequently bought together</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {relatedProducts.map((product) => (
                  <div key={product.id} className="border rounded-lg p-3 hover:shadow-md transition-shadow">
                    <div className="h-32 bg-gray-100 rounded-md mb-3 flex items-center justify-center">
                      <Image
                        src={product.image}
                        alt={product.name}
                        width={80}
                        height={80}
                        className="object-contain"
                      />
                    </div>
                    <h4 className="text-sm font-medium text-gray-900 line-clamp-2 mb-2">
                      {product.name}
                    </h4>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">৳{product.price}</p>
                        <p className="text-xs text-gray-500 line-through">৳{product.originalPrice}</p>
                      </div>
                      <Button size="sm" className="bg-teal-700 hover:bg-teal-800">
                        Add to Cart
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border p-5 sticky top-6">
              <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">৳{subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Discount</span>
                  <span className="text-green-600">-৳{discount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">
                    {shipping === 0 ? "Free" : `৳${shipping}`}
                  </span>
                </div>
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span>৳{total}</span>
                  </div>
                </div>
              </div>
              
              <Button className="w-full bg-teal-700 hover:bg-teal-800 py-3 text-base mb-4">
                Proceed to Checkout
              </Button>
              
              <div className="text-xs text-gray-500 text-center">
                By completing your purchase you agree to these{" "}
                <a href="#" className="text-teal-700 hover:underline">Terms of Service</a>
              </div>
              
              <div className="mt-6 p-3 bg-gray-50 rounded-lg">
                <h3 className="font-medium mb-2">Need help with your order?</h3>
                <p className="text-sm text-gray-600">
                  Call us at <span className="text-teal-700">+880 XXX-XXXXXXX</span> or email{" "}
                  <span className="text-teal-700">support@electrohub.com</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;