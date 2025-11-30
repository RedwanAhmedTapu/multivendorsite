"use client";

import React from "react";
import { Button } from "@/components/ui/button";

const FeaturedOffers = () => {
  return (
    <section className="max-w-4xl xl:max-w-6xl 2xl:max-w-[75rem] mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <h2 className="text-2xl font-bold">Our Featured Offers</h2>
        <a
          href="#"
          className="text-sm font-medium underline hover:text-gray-700"
        >
          See All Offers
        </a>
      </div>

      {/* Main Layout - Column on mobile, row on larger screens */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Left Big Card */}
        <div className="group flex-1 rounded-xl p-6 flex flex-col justify-between min-h-[400px] md:min-h-[600px] overflow-hidden relative">
          <div 
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
            style={{
              backgroundImage: "url('/homesection/homev3-trade.webp')",
            }}
          />
          <div className="relative z-10 max-w-md p-4 rounded-lg">
            <p className="text-xs font-semibold uppercase text-gray-500">
              Cell Phones
            </p>
            <h3 className="text-xl md:text-2xl font-bold mt-1">Trade in and Save</h3>
            <p className="text-sm text-gray-600 mt-2">
              From $29.12/mo. for 24 mo. or $699 before trade-in
            </p>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-4">
              <Button className="bg-emerald-700 hover:bg-emerald-800 text-white w-full sm:w-auto">
                Shop Now
              </Button>
              <a
                href="#"
                className="text-sm font-medium underline hover:text-gray-700 self-center text-center sm:text-left"
              >
                Learn More
              </a>
            </div>
          </div>
        </div>

        {/* Right Grid Layout */}
        <div className="w-full md:w-1/2 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Fragrance */}
          <div className="group rounded-xl p-6 flex flex-col justify-between min-h-[200px] overflow-hidden relative">
            <div 
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
              style={{
                backgroundImage: "url('/homesection/homev3-limitededition.webp')",
              }}
            />
            <div className="relative z-10 p-3 rounded-lg">
              <p className="text-xs font-semibold uppercase text-gray-500">
                Fragrance
              </p>
              <h3 className="text-lg sm:text-xl font-bold mt-1">Limited Edition</h3>
              <p className="text-sm text-gray-600 mt-2">
                The perfect complement your outfit
              </p>
            </div>
            <a
              href="#"
              className="relative z-10 mt-3 text-sm font-medium underline hover:text-gray-700 bg-white/90 p-2 rounded inline-block w-fit"
            >
              Shop Now
            </a>
          </div>

          {/* Furniture */}
          <div className="group rounded-xl p-6 flex flex-col justify-between min-h-[200px] overflow-hidden relative">
            <div 
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
              style={{
                backgroundImage: "url('/homesection/homev3-springtime.webp')",
              }}
            />
            <div className="relative z-10 p-3 rounded-lg">
              <p className="text-xs font-semibold uppercase text-gray-500">
                Furniture
              </p>
              <h3 className="text-lg sm:text-xl font-bold mt-1">Springtime</h3>
              <p className="text-sm text-gray-600 mt-2">
                Best-selling industrial collection
              </p>
            </div>
            <a
              href="#"
              className="relative z-10 mt-3 text-sm font-medium underline hover:text-gray-700 bg-white/90 p-2 rounded inline-block w-fit"
            >
              Shop Now
            </a>
          </div>

          {/* Kitchen & Dining (Full Width) */}
          <div className="group col-span-1 sm:col-span-2 rounded-xl p-6 flex flex-col justify-between min-h-[200px] overflow-hidden relative">
            <div 
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
              style={{
                backgroundImage: "url('/homesection/homev3-Discover-diningware.webp')",
              }}
            />
            <div className="relative z-10 p-4 rounded-lg max-w-md">
              <p className="text-xs font-semibold uppercase text-gray-500">
                Kitchen & Dining
              </p>
              <h3 className="text-lg sm:text-xl font-bold mt-1">Discover Dinnerware</h3>
              <p className="text-sm text-gray-600 mt-2">
                Soft tones & simplistic details add a special touch.
              </p>
              <a
                href="#"
                className="mt-3 text-sm font-medium underline hover:text-gray-700 inline-block"
              >
                Shop Now
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturedOffers;