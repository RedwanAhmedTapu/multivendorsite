"use client";

import React from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, Eye, ShoppingCart, BadgeCheck } from "lucide-react";
import { useGetProductsQuery } from "@/features/productApi";
import Link from "next/link";
import type { Product as ProductType } from "@/types/product"; // Import with alias
import HomepageProductSectionSkeleton from "../skeletons/HomepageProductSectionSkeleton";
import { Container } from "../Container";

// Taka Icon Component using FontAwesome
const TakaIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <i className={`fa-solid fa-bangladeshi-taka-sign ${className}`} />
);

// Updated image type
interface ProductImage {
  url: string;
  altText?: string;
}

interface Vendor {
  id: string;
  storeName: string;
  avatar: string;
  verificationStatus: "PENDING" | "VERIFIED" | "REJECTED";
}

// Use the imported ProductType instead of redefining
interface ProductCardProps {
  product: ProductType;
}

interface SectionProps {
  title: string;
  products: ProductType[]; // Use ProductType here
}

const ProductCard = ({ product }: ProductCardProps) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  
  const variant = product.variants?.[0];
  const price = variant?.price || 0;
  const specialPrice = variant?.specialPrice || null;
  const discount = variant?.discount || null;
  
  // Calculate average rating
  const averageRating = product.reviews?.length
    ? product.reviews.reduce((acc, review) => acc + review.rating, 0) / product.reviews.length
    : 0;
  const reviewCount = product.reviews?.length || 0;

  // Check for free shipping
  const hasFreeShipping = product.offerProducts?.length
    ? product.offerProducts.some(op => op.offer.type === "FREE_SHIPPING")
    : false;

  // Check vendor verification - handle undefined case
  const isVerified = product.vendor?.verificationStatus === "VERIFIED";
  const storeName = product.vendor?.storeName || "Unknown Store";

  // Get first image or fallback
  const image = product.images?.[0];
  const altText = image?.altText || product.name;

  return (
    <Card className="group relative border border-gray-200 rounded-lg p-0 shadow-sm hover:shadow-lg transition-all duration-300 h-full flex flex-col bg-white overflow-hidden">
      {/* Wishlist & View Icons */}
      <div className="absolute top-3 right-3 z-20 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <button className="bg-white rounded-full p-2 shadow-lg hover:bg-pink-50 hover:text-pink-600 transition-all duration-200 transform hover:scale-110">
          <Heart size={18} />
        </button>
        <button className="bg-white rounded-full p-2 shadow-lg hover:bg-teal-50 hover:text-teal-600 transition-all duration-200 transform hover:scale-110">
          <Eye size={18} />
        </button>
      </div>

      {/* Image Container */}
      <div className="relative w-full h-44 overflow-hidden bg-gray-50">
        <div className="relative w-full h-full flex items-center justify-center">
          {image?.url ? (
            <Image
              src={image.url}
              alt={altText}
              fill
              className="object-contain"
              sizes="(max-width: 640px) 100vw, 200px"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-400">No Image</span>
            </div>
          )}
        </div>

        {/* Top Left Badge - Free Shipping */}
        <div className="absolute top-3 left-3 z-10">
          {hasFreeShipping && (
            <Badge className="bg-[#00A9E0] hover:bg-[#0095C9] text-white px-3 py-1 text-xs font-semibold flex items-center gap-1 shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="3" width="15" height="13"/>
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
                <circle cx="5.5" cy="18.5" r="2.5"/>
                <circle cx="18.5" cy="18.5" r="2.5"/>
              </svg>
              FREE DELIVERY
            </Badge>
          )}
        </div>
      </div>

      {/* Content */}
      <CardContent className="flex flex-col px-4 py-1 flex-grow">
        {/* Product Name */}
        <h3 
          className={`text-sm font-medium text-gray-800 mb-2 leading-tight cursor-pointer hover:text-teal-700 transition-colors ${
            isExpanded ? '' : 'overflow-hidden text-ellipsis'
          }`}
          style={{
            display: isExpanded ? 'block' : '-webkit-box',
            WebkitLineClamp: isExpanded ? 'unset' : 2,
            WebkitBoxOrient: 'vertical'
          }}
          onClick={() => setIsExpanded(!isExpanded)}
          title={product.name}
        >
          {product.name}
        </h3>

        {/* Price Section */}
        <div className="mb-2">
          {specialPrice ? (
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 mb-1">
                <div className="flex items-center gap-1">
                  <TakaIcon className="text-teal-600 text-lg" />
                  <span className="text-xl font-bold text-teal-600">
                    {specialPrice.toLocaleString()}
                  </span>
                </div>
                {discount && (
                  <Badge className="bg-pink-50 text-teal-600 px-2 py-0.5 text-xs font-bold border border-teal-200">
                    -{discount}%
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1">
                <TakaIcon className="text-gray-400 text-base" />
                <span className="text-sm text-gray-400 line-through">
                  {price.toLocaleString()}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <TakaIcon className="text-gray-800 text-lg" />
              <span className="text-xl font-bold text-gray-800">
                {price.toLocaleString()}
              </span>
            </div>
          )}
        </div>

        {/* Rating Section */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex text-orange-400">
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} className="text-sm">
                {i < Math.floor(averageRating) ? "★" : "☆"}
              </span>
            ))}
          </div>
          <span className="text-sm text-gray-600 font-medium">
            {averageRating > 0 ? averageRating.toFixed(1) : "0.0"} ({reviewCount})
          </span>
        </div>

        {/* Store Name with Verification Badge */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-gray-500 font-medium truncate">
            {storeName}
          </span>
          {isVerified && (
            <Badge className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white px-2 py-0.5 text-xs font-semibold shadow-lg border-0 flex items-center gap-1 flex-shrink-0 transition-all duration-200">
              <BadgeCheck className="w-3 h-3" />
              Verified
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const ProductSection = ({ title, products }: SectionProps) => {
  if (!products || products.length === 0) return null;

  return (
    <Container className="py-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xs sm:text-sm md:text-lg lg:text-xl font-bold text-gray-800">{title}</h2>
        <Link href="/products" className="text-teal-600 hover:text-teal-800 text-sm font-medium transition-colors">
          See All 
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-6 gap-1 ">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </Container>
  );
};

const ProductGrid = () => {
  const { data: products = [], isLoading, error } = useGetProductsQuery();

  // Show skeleton while loading
  if (isLoading) {
    return (
      <>
        {/* <HomepageProductSectionSkeleton title={true} showSeeAll={true} gridCols={5} /> */}
        <HomepageProductSectionSkeleton title={true} showSeeAll={true} gridCols={6} />
        {/* <HomepageProductSectionSkeleton title={true} showSeeAll={true} gridCols={5} />
        <HomepageProductSectionSkeleton title={true} showSeeAll={true} gridCols={5} /> */}
      </>
    );
  }
  if (error) return <p className="text-center py-10 text-red-500">Failed to load products.</p>;

  // Example: splitting products into sections
  const flashDeals = products.slice(0, 5);
  const clearanceSale = products;
  const newArrivals = products.slice(10, 15);
  const youMightLike = products.slice(15, 20);

  return (
    <>
      {/* <ProductSection title="Flash Deals" products={flashDeals} /> */}
      <ProductSection
        title="Yearly Stock Clearance Sale Offer - Up to 70% Discount"
        products={clearanceSale}
      />
      {/* <ProductSection title="New Arrivals" products={newArrivals} />
      <ProductSection title="You Might Also Like" products={youMightLike} /> */}
    </>
  );
};

export default ProductGrid;