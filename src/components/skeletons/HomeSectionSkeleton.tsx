"use client";

import React from "react";

const HomeSectionSkeleton = () => {
  return (
    <div className="w-full bg-gray-50">
      <div className="max-w-6xl xl:max-w-7xl 2xl:max-w-[90%] mx-auto md:px-4 sm:px-6 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Left Section - Slider Skeleton */}
          <div className="lg:col-span-2 relative rounded-xl overflow-hidden h-80 sm:h-96 md:h-[22rem] lg:h-[28rem] bg-gradient-to-r from-gray-100 to-gray-200 animate-pulse">
            {/* Simulated slide content with shimmer effect */}
            <div className="absolute inset-0 flex items-center z-10 p-6 md:p-8 lg:p-12">
              <div className="max-w-md space-y-5">
                <div className="h-4 w-28 bg-gray-300 rounded-full overflow-hidden relative">
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer"></div>
                </div>
                <div className="h-10 w-72 bg-gray-300 rounded-xl overflow-hidden relative">
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer"></div>
                </div>
                <div className="h-6 w-64 bg-gray-300 rounded-lg overflow-hidden relative">
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer"></div>
                </div>
                <div className="h-12 w-36 bg-gray-300 rounded-lg overflow-hidden relative">
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer"></div>
                </div>
              </div>
            </div>
            
            {/* Simulated navigation arrows */}
            <div className="hidden sm:block absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-70 p-3 rounded-full shadow-md animate-pulse">
              <div className="w-5 h-5 bg-gray-400 rounded-full"></div>
            </div>
            <div className="hidden sm:block absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-70 p-3 rounded-full shadow-md animate-pulse">
              <div className="w-5 h-5 bg-gray-400 rounded-full"></div>
            </div>
            
            {/* Simulated dot indicators */}
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-3 z-20">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="w-3 h-3 rounded-full bg-white bg-opacity-70 animate-pulse"
                />
              ))}
            </div>
          </div>

          {/* Right Section - Static Cards Skeleton */}
          <div className="flex flex-col px-4 md:px-0 mt-4 lg:mt-0 space-y-5 sm:space-y-6">
            {/* First Card */}
            <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl p-5 sm:p-6 h-48 sm:h-56 md:h-60 lg:h-[13.5rem] relative overflow-hidden animate-pulse">
              <div className="flex h-full">
                <div className="flex-1 space-y-4">
                  <div className="h-3 w-24 bg-gray-300 rounded-full overflow-hidden relative">
                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer"></div>
                  </div>
                  <div className="h-6 w-36 bg-gray-300 rounded-lg overflow-hidden relative">
                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer"></div>
                  </div>
                  <div className="h-4 w-44 bg-gray-300 rounded-lg overflow-hidden relative">
                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer"></div>
                  </div>
                  <div className="h-3 w-20 bg-gray-300 rounded-full overflow-hidden relative mt-5">
                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Second Card with Sale Badge */}
            <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl p-5 sm:p-6 h-48 sm:h-56 md:h-60 lg:h-[13.5rem] relative overflow-hidden animate-pulse">
              <div className="absolute top-4 right-4 bg-gray-300 text-transparent text-xs px-3 py-1.5 rounded-full font-semibold z-10 animate-pulse">
                SALE
              </div>
              <div className="flex h-full">
                <div className="flex-1 space-y-4">
                  <div className="h-3 w-24 bg-gray-300 rounded-full overflow-hidden relative">
                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer"></div>
                  </div>
                  <div className="h-6 w-40 bg-gray-300 rounded-lg overflow-hidden relative">
                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer"></div>
                  </div>
                  <div className="h-4 w-52 bg-gray-300 rounded-lg overflow-hidden relative">
                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer"></div>
                  </div>
                  <div className="h-3 w-20 bg-gray-300 rounded-full overflow-hidden relative mt-5">
                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
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