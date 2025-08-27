"use client";

import Image from "next/image";
import Link from "next/link";

interface Category {
  name: string;
  image: string;
  highlight?: boolean;
}

const categories: Category[] = [
  { name: "Deals", image: "/homesection/category/homev3-deals.webp", highlight: true },
  { name: "Electronics", image: "/homesection/category/homev3-electronics.webp" },
  { name: "Home & Garden", image: "/homesection/category/homev3-homegarden.webp" },
  { name: "Fashion", image: "/homesection/category/homev3-fashion.webp" },
  { name: "Jewelry", image: "/homesection/category/homev3-jewelry.webp" },
  { name: "Beauty & Heathy", image: "/homesection/category/homev3-beauty.webp" },
  { name: "Toys & Games", image: "/homesection/category/homev3-toys.webp" },
  { name: "Mother & Kids", image: "/homesection/category/homev3-motherkids.webp" },
  { name: "Sports", image: "/homesection/category/homev3-sports.webp" },
];

export default function CategorySection() {
  return (
    <section className="max-w-6xl xl:max-w-7xl 2xl:max-w-[90%] mx-auto  px-4 sm:px-6  ">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl md:text-2xl font-bold">Shop by Category</h2>
        <Link
          href="/categories"
          className="text-sm font-medium text-gray-700 hover:underline"
        >
          See All
        </Link>
      </div>

      {/* Horizontal Scrolling Container */}
      <div className="relative ">
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex space-x-6 pb-4 justify-between items-center">
            {categories.map((cat) => (
              <div
                key={cat.name}
                className="flex flex-col items-center text-center group cursor-pointer min-w-max"
              >
                <div
                  className={`flex items-center justify-center w-20 h-20 rounded-full 
                    ${cat.highlight ? "bg-red-50 border-2 border-red-500" : "bg-gray-100"} 
                    transition-colors group-hover:bg-gray-200`}
                >
                  <Image
                    src={cat.image}
                    alt={cat.name}
                    width={50}
                    height={50}
                    className="object-contain"
                  />
                </div>
                <p className="mt-2 text-sm text-gray-700">{cat.name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}