"use client";

import React from "react";
import { Container } from "../Container";

const HomeSectionSkeleton = () => {
  return (
    <div className="w-full bg-gray-50">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Left Section - Slider Skeleton (3/4 width) */}
          <div className="lg:col-span-3 relative rounded-lg overflow-hidden h-64 sm:h-72 md:h-80 lg:h-[22rem] bg-gradient-to-r from-gray-100 to-gray-200 animate-pulse">
            {/* Simulated slide content with shimmer effect */}
            <div className="absolute inset-0 flex items-center z-10 p-4 sm:p-6 md:p-8 lg:p-10">
              <div className="max-w-md space-y-4">
                {/* Title skeleton */}
                <div className="h-3 w-32 bg-gray-300 rounded-full overflow-hidden relative">
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer"></div>
                </div>
                
                {/* Subtitle skeleton */}
                <div className="h-8 sm:h-10 w-48 sm:w-64 bg-gray-300 rounded-xl overflow-hidden relative">
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer"></div>
                </div>
                
                {/* Description skeleton */}
                <div className="h-4 w-56 sm:w-72 bg-gray-300 rounded-lg overflow-hidden relative">
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer"></div>
                </div>
                
                {/* Button skeleton */}
                <div className="h-10 w-32 bg-gray-300 rounded-lg overflow-hidden relative mt-4">
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer"></div>
                </div>
              </div>
            </div>
            
            {/* Simulated navigation arrows */}
            <div className="hidden sm:block absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 p-2 rounded-full shadow-lg animate-pulse">
              <div className="w-5 h-5 bg-gray-400 rounded-full"></div>
            </div>
            <div className="hidden sm:block absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 p-2 rounded-full shadow-lg animate-pulse">
              <div className="w-5 h-5 bg-gray-400 rounded-full"></div>
            </div>
            
            {/* Simulated dot indicators */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-20">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-white/70 animate-pulse"
                />
              ))}
            </div>
          </div>

          {/* Right Section - Download App Skeleton (1/4 width) */}
          <div className="flex flex-col h-full">
            <div className="rounded-lg p-4 h-full flex flex-col justify-center bg-gradient-to-br from-teal-50 to-teal-100 animate-pulse">
              {/* Header skeleton */}
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 bg-gray-300 rounded-full"></div>
                <div className="h-6 w-40 bg-gray-300 rounded-lg"></div>
              </div>
              
              {/* Features Banner skeleton */}
              <div className="bg-gradient-to-br from-teal-100 to-teal-200 rounded-xl p-4 mb-5">
                <div className="h-5 w-32 bg-gray-300 rounded-lg mb-3"></div>
                
                <div className="grid grid-cols-2 gap-3">
                  {/* Free Delivery Feature skeleton */}
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center">
                      <div className="w-5 h-5 bg-gray-300 rounded"></div>
                    </div>
                    <div className="space-y-1">
                      <div className="h-3 w-16 bg-gray-300 rounded"></div>
                      <div className="h-3 w-12 bg-gray-300 rounded"></div>
                    </div>
                  </div>

                  {/* Exclusive Vouchers Feature skeleton */}
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center">
                      <div className="w-5 h-5 bg-gray-300 rounded"></div>
                    </div>
                    <div className="space-y-1">
                      <div className="h-3 w-20 bg-gray-300 rounded"></div>
                      <div className="h-3 w-16 bg-gray-300 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* QR Code and Store Buttons skeleton */}
              <div className="flex gap-4 items-center mb-4">
                {/* QR Code skeleton */}
                <div className="w-[90px] h-[90px] bg-white rounded-lg flex items-center justify-center border border-gray-200">
                  <div className="w-full h-full bg-gray-200 rounded-lg"></div>
                </div>

                {/* Store Buttons skeleton */}
                <div className="flex flex-col gap-2 flex-1">
                  {/* Google Play Button skeleton */}
                  <div className="bg-gray-900/20 rounded-lg px-3 py-2.5 flex items-center gap-2">
                    <div className="w-5 h-5 bg-gray-300 rounded"></div>
                    <div className="flex flex-col items-start space-y-1">
                      <div className="h-2 w-16 bg-gray-300 rounded"></div>
                      <div className="h-3 w-20 bg-gray-300 rounded"></div>
                    </div>
                  </div>

                  {/* App Store Button skeleton */}
                  <div className="bg-gray-900/20 rounded-lg px-3 py-2.5 flex items-center gap-2">
                    <div className="w-5 h-5 bg-gray-300 rounded"></div>
                    <div className="flex flex-col items-start space-y-1">
                      <div className="h-2 w-24 bg-gray-300 rounded"></div>
                      <div className="h-3 w-16 bg-gray-300 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Download Text skeleton */}
              <div className="text-center">
                <div className="h-3 w-36 bg-gray-300 rounded mx-auto"></div>
              </div>
            </div>
          </div>
        </div>
      </Container>
      
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
};

export default HomeSectionSkeleton;