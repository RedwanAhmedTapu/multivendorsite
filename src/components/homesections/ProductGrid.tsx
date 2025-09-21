"use client";

import React from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, Eye, ShoppingCart } from "lucide-react";
import { useGetProductsQuery } from "@/features/productApi";

// Updated image type
interface ProductImage {
  url: string;
  altText?: string;
}

interface Product {
  id: string;
  name: string;
  images: ProductImage[];
  variants: {
    id: string;
    price: number;
  }[];
}

interface SectionProps {
  title: string;
  products: Product[];
}

const ProductCard = ({ product }: { product: Product }) => {
  const variant = product.variants[0];
  const price = variant?.price || 0;
  const oldPrice = price * 1.2;
  const rating = Math.floor(Math.random() * 2) + 4; // 4-5 stars
  const reviews = Math.floor(Math.random() * 50) + 1;
  // Get first image or fallback
  const image = product.images?.[0];

  const imageSrc = image?.url ? `https://api.finixmart.com.bd${image?.url}` : "/placeholder-product.jpg";
  console.log(imageSrc);
  const altText = image?.altText || product.name;

  return (
    <Card className="group relative p-3 sm:p-4 rounded-xl border flex flex-col justify-between transition-all duration-300 hover:shadow-lg">
      {/* Top Right Icons */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <button className="bg-white rounded-full p-2 shadow-md hover:bg-gray-100">
          <Heart size={16} className="text-gray-600" />
        </button>
        <button className="bg-white rounded-full p-2 shadow-md hover:bg-gray-100">
          <Eye size={16} className="text-gray-600" />
        </button>
      </div>

      

      <CardContent className="flex flex-col items-center p-0">
        <div className="relative w-full h-28 sm:h-20 mb-3 flex items-center justify-center">
          <Image
            src={imageSrc}
            alt={altText}
            fill
            className="object-contain"
            sizes="(max-width: 640px) 100vw, 200px"
          />
        </div>
        <h3 className="text-xs sm:text-sm font-medium text-center mb-1 line-clamp-2 h-8 sm:h-10">
          {product.name}
        </h3>
        <div className="flex text-yellow-500 text-xs sm:text-sm mb-1">
          {"★".repeat(rating)}{"☆".repeat(5 - rating)}
        </div>
        <p className="text-xs text-gray-500 mb-2">
          ({reviews} review{reviews !== 1 ? "s" : ""})
        </p>
        <div className="flex gap-2 items-center">
          <span className="text-base sm:text-lg font-semibold text-black">
            ${price.toFixed(2)}
          </span>
          <span className="text-xs sm:text-sm text-gray-400 line-through">
            ${oldPrice.toFixed(2)}
          </span>
        </div>
      </CardContent>

      {/* Hover Add to Cart */}
      <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <Button className="w-full bg-teal-900 hover:bg-teal-800 text-white rounded-lg flex items-center justify-center gap-2 py-2 text-sm">
          <ShoppingCart size={16} />
          Add to Cart
        </Button>
      </div>
    </Card>
  );
};

const ProductSection = ({ title, products }: SectionProps) => {
  if (!products || products.length === 0) return null;

  return (
    <section className="max-w-5xl xl:max-w-6xl 2xl:max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl sm:text-2xl font-bold">{title}</h2>
        <a href="#" className="underline text-sm font-medium">
          See All Products
        </a>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
};

const ProductGrid = () => {
  const { data: products = [], isLoading, error } = useGetProductsQuery();

  if (isLoading) return <p className="text-center py-10">Loading...</p>;
  if (error) return <p className="text-center py-10 text-red-500">Failed to load products.</p>;

  // Example: splitting products into sections
  const flashDeals = products.slice(0, 6);
  const clearanceSale = products.slice(6, 12);
  const newArrivals = products.slice(12, 18);
  const youMightLike = products.slice(18, 24);

  return (
    <>
      <ProductSection title="Flash Deals" products={flashDeals} />
      <ProductSection
        title="Yearly Stock Clearance Sale Offer - Up to 70% Discount"
        products={clearanceSale}
      />
      <ProductSection title="New Arrivals" products={newArrivals} />
      <ProductSection title="You Might Also Like" products={youMightLike} />
    </>
  );
};

export default ProductGrid;
