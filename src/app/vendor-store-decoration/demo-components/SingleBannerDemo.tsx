import React from 'react';
import { ArrowRight } from "lucide-react";

export const SingleBannerDemo=()=> {
  return (
    <div className="w-full bg-white p-3">
      <div className="relative rounded-2xl shadow-2xl overflow-hidden h-80">
        {/* Background Image */}
        <img 
          src="https://cdn.pixabay.com/photo/2016/11/19/18/06/feet-1840619_1280.jpg"
          alt="Summer Sale"
          className="w-full h-full object-cover"
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-transparent"></div>

        {/* Content */}
        <div className="absolute inset-0 p-8 flex items-center">
          <div className="max-w-md text-white z-10">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-semibold">Limited Time Offer</span>
            </div>

            {/* Content */}
            <h2 className="text-5xl font-black mb-3 leading-tight">
              SUMMER
              <br />
              <span className="text-yellow-300">SALE</span>
            </h2>
            
            <p className="text-xl mb-2 opacity-90">Up to 60% OFF on selected items</p>
            <p className="text-sm mb-6 opacity-80">Don't miss this amazing opportunity to upgrade your wardrobe</p>

           

            {/* Additional Info */}
            <div className="flex items-center gap-4 mt-6 text-sm">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Free Shipping</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span>Easy Returns</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}