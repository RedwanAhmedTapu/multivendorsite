"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Eye, ShoppingCart } from "lucide-react";

interface Product {
  id: number;
  title: string;
  image: string;
  colors?: string;
  rating: number;
  reviews: number;
  price: number;
  oldPrice: number;
  tags?: string[];
}

const products: Product[] = [
  {
    id: 1,
    title: "Slate Series 33 Inch French Door Refrigerator Slate",
    image: "/homesection/flashsale/1-114 (1).webp",
    colors: "3 Colors",
    rating: 5,
    reviews: 1,
    price: 1899.0,
    oldPrice: 1994.05,
    tags: ["Sale"],
  },
  {
    id: 2,
    title: "CH25 Armchair by Hans J. Wegner",
    image: "/homesection/flashsale/1-19.webp",
    colors: "3 Colors",
    rating: 5,
    reviews: 1,
    price: 145.0,
    oldPrice: 245.0,
    tags: ["Sale"],
  },
  {
    id: 3,
    title: "50s Retro Style Blender with 6 Cups Tritan",
    image: "/homesection/flashsale/1-8.webp",
    colors: "3 Colors",
    rating: 5,
    reviews: 1,
    price: 199.0,
    oldPrice: 259.0,
    tags: ["Sale"],
  },
  {
    id: 4,
    title: "Apple iPhone SE (2020) 64GB, White",
    image: "/homesection/flashsale/1-5.webp",
    rating: 5,
    reviews: 2,
    price: 40.0,
    oldPrice: 45.0,
    tags: ["Sale", "Hot"],
  },
];

const DailyDeals = () => {
  const [timeLeft, setTimeLeft] = useState({ hours: 1, mins: 35, secs: 12 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        let { hours, mins, secs } = prev;
        if (secs > 0) secs--;
        else if (mins > 0) {
          mins--;
          secs = 59;
        } else if (hours > 0) {
          hours--;
          mins = 59;
          secs = 59;
        }
        return { hours, mins, secs };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="max-w-6xl xl:max-w-7xl 2xl:max-w-[90%] mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl sm:text-2xl font-bold">Daily Deals</h2>
        <a href="#" className="underline text-sm font-medium">
          See All
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
        {/* LEFT SIDE TIMER */}
        <Card className="flex flex-col justify-between items-center p-4 sm:p-6 rounded-xl border">
          <div className="text-center">
            <p className="font-medium text-sm sm:text-base">Only Available For 24 Hours.</p>
            <p className="text-orange-500 font-semibold text-sm sm:text-base">Don't Miss Out!</p>
          </div>
          <div className="flex gap-2 sm:gap-4 my-4 sm:my-6">
            <div className="bg-teal-900 text-white w-12 h-12 sm:w-14 sm:h-14 flex flex-col items-center justify-center rounded-full">
              <span className="text-base sm:text-lg font-bold">{timeLeft.hours.toString().padStart(2,"0")}</span>
              <span className="text-xs">Hours</span>
            </div>
            <div className="bg-teal-900 text-white w-12 h-12 sm:w-14 sm:h-14 flex flex-col items-center justify-center rounded-full">
              <span className="text-base sm:text-lg font-bold">{timeLeft.mins.toString().padStart(2,"0")}</span>
              <span className="text-xs">Mins</span>
            </div>
            <div className="bg-teal-900 text-white w-12 h-12 sm:w-14 sm:h-14 flex flex-col items-center justify-center rounded-full">
              <span className="text-base sm:text-lg font-bold">{timeLeft.secs.toString().padStart(2,"0")}</span>
              <span className="text-xs">Secs</span>
            </div>
          </div>
          <Button className="bg-orange-500 hover:bg-orange-600 text-white w-full rounded-lg text-sm sm:text-base">
            See All Products
          </Button>
        </Card>

        {/* PRODUCT CARDS */}
        {products.map((product) => (
          <Card
            key={product.id}
            className="group relative p-3 sm:p-4 rounded-xl border flex flex-col justify-between transition-all duration-300 hover:shadow-lg"
          >
            {/* Top Right Wishlist and Eye Icons */}
            <div className="absolute top-3 right-3 z-10 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <button className="bg-white rounded-full p-2 shadow-md hover:bg-gray-100 transition-colors">
                <Heart size={16} className="text-gray-600" />
              </button>
              <button className="bg-white rounded-full p-2 shadow-md hover:bg-gray-100 transition-colors">
                <Eye size={16} className="text-gray-600" />
              </button>
            </div>

            {/* Sale Tags */}
            <div className="absolute top-3 left-3 flex gap-2 z-10">
              {product.tags?.map((tag, i) => (
                <Badge
                  key={i}
                  className={`${
                    tag === "Sale"
                      ? "bg-red-500 text-white"
                      : "bg-orange-500 text-white"
                  } px-2 py-0.5 text-xs sm:px-3 sm:py-1`}
                >
                  {tag}
                </Badge>
              ))}
            </div>

            <CardContent className="flex flex-col items-center p-0">
              <div className="relative w-full h-32 sm:h-40 mb-3 flex items-center justify-center">
                <Image
                  src={product.image}
                  alt={product.title}
                  fill
                  className="object-contain"
                />
              </div>
              
              {product.colors && (
                <p className="text-xs text-gray-500 mb-1">{product.colors}</p>
              )}
              
              <h3 className="text-xs sm:text-sm font-medium text-center mb-1 line-clamp-2 h-8 sm:h-10">
                {product.title}
              </h3>
              
              <div className="flex text-yellow-500 text-xs sm:text-sm mb-1">
                {"★".repeat(product.rating)}{"☆".repeat(5 - product.rating)}
              </div>
              
              <p className="text-xs text-gray-500 mb-2">
                ({product.reviews} review{product.reviews !== 1 ? 's' : ''})
              </p>
              
              <div className="flex gap-2 items-center">
                <span className="text-base sm:text-lg font-semibold text-black">
                  ${product.price.toFixed(2)}
                </span>
                <span className="text-xs sm:text-sm text-gray-400 line-through">
                  ${product.oldPrice.toFixed(2)}
                </span>
              </div>
            </CardContent>

            {/* HOVER ADD TO CART BUTTON */}
            <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <Button className="w-full bg-teal-900 hover:bg-teal-800 text-white rounded-lg flex items-center justify-center gap-2 py-2 text-sm">
                <ShoppingCart size={16} />
                Add to Cart
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
};

export default DailyDeals;