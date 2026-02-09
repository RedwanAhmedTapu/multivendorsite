"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Eye, BadgeCheck } from "lucide-react";
import { useGetProductsQuery } from "@/features/productApi";
import Link from "next/link";
import type { Product as ProductType } from "@/types/product";
import HomepageProductSectionSkeleton from "../skeletons/HomepageProductSectionSkeleton";
import { Container } from "../Container";
import {
  useAddToWishlistMutation,
  useRemoveFromWishlistMutation,
  useCheckInWishlistQuery,
  useGetWishlistQuery,
  useLazyCheckInWishlistQuery,
} from "@/features/cartWishApi";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

// Taka Icon Component using FontAwesome
const TakaIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <i className={`fa-solid fa-bangladeshi-taka-sign ${className}`} />
);

interface ProductCardProps {
  product: ProductType;
}

interface SectionProps {
  title: string;
  products: ProductType[];
}

const ProductCard = ({ product }: ProductCardProps) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [isWishlistLoading, setIsWishlistLoading] = React.useState(false);
  const [localWishlistState, setLocalWishlistState] = React.useState(false);

  // Get variant information
  const variant = product.variants?.[0];
  const price = variant?.price || 0;
  const specialPrice = variant?.specialPrice || null;
  const discount = variant?.discount || null;
  const variantId = variant?.id || "";
  const router = useRouter();

  // Calculate average rating
  const averageRating = product.reviews?.length
    ? product.reviews.reduce((acc, review) => acc + review.rating, 0) /
      product.reviews.length
    : 0;
  const reviewCount = product.reviews?.length || 0;

  // Check for free shipping
  const hasFreeShipping = product.offerProducts?.length
    ? product.offerProducts.some((op) => op.offer.type === "FREE_SHIPPING")
    : false;

  // Check vendor verification
  const isVerified = product.vendor?.verificationStatus === "VERIFIED";
  const storeName = product.vendor?.storeName || "Unknown Store";

  // Get first image or fallback
  const image = product.images?.[0];
  const altText = image?.altText || product.name;

  // Wishlist API hooks
  const [addToWishlist] = useAddToWishlistMutation();
  const [removeFromWishlist] = useRemoveFromWishlistMutation();

  // Use lazy query for wishlist check - this won't auto-fetch on mount
  const [
    triggerCheckWishlist,
    { data: wishlistCheck, isFetching: isCheckingWishlist },
  ] = useLazyCheckInWishlistQuery();

  // Get wishlist data (optional, for additional info)
  const { refetch: refetchWishlist } = useGetWishlistQuery();

  // Check if product is in wishlist
  const isInWishlist = wishlistCheck?.data?.inWishlist || false;
  const wishlistItemId = wishlistCheck?.data?.itemId;

  // Check wishlist status on mount and when product changes
  React.useEffect(() => {
    if (product.id) {
      triggerCheckWishlist({
        productId: product.id,
        variantId: variantId || undefined,
      });
    }
  }, [product.id, variantId, triggerCheckWishlist]);

  // Update local state when wishlist check changes
  React.useEffect(() => {
    if (wishlistCheck?.data) {
      setLocalWishlistState(wishlistCheck.data.inWishlist);
    }
  }, [wishlistCheck]);

  const handleWishlistToggle = async () => {
    if (isWishlistLoading || isCheckingWishlist) return;

    setIsWishlistLoading(true);

    try {
      if (isInWishlist && wishlistItemId) {
        // Remove from wishlist
        await removeFromWishlist(wishlistItemId).unwrap();
        toast.success("Removed from wishlist");
        setLocalWishlistState(false);

        // Update the wishlist check
        triggerCheckWishlist({
          productId: product.id,
          variantId: variantId || undefined,
        });
      } else {
        // Add to wishlist
        const wishlistData = {
          productId: product.id,
          variantId: variantId || undefined,
          priority: 1,
          notes: "",
          notifyOnDiscount: true,
          notifyOnRestock: true,
        };

        await addToWishlist(wishlistData).unwrap();
        toast.success("Added to wishlist");
        setLocalWishlistState(true);

        // Update the wishlist check
        triggerCheckWishlist({
          productId: product.id,
          variantId: variantId || undefined,
        });
      }

      // Refetch full wishlist if needed
      refetchWishlist();
    } catch (error: any) {
      console.error("Wishlist toggle error:", error);
      const errorMessage =
        error?.data?.message || error?.message || "Something went wrong";
      toast.error(errorMessage);
    } finally {
      setIsWishlistLoading(false);
    }
  };

  // Determine if heart should be filled
  const shouldFillHeart = localWishlistState || isInWishlist;
  const isLoading = isWishlistLoading || isCheckingWishlist;

  const handleProductClick = useCallback(() => {
    router.push(`/products/${product.id}`);
  }, [router, product.id]);

  return (
    <Card className="group relative border border-gray-200 rounded-lg p-0 shadow-sm hover:shadow-lg transition-all duration-300 h-full flex flex-col bg-white overflow-hidden" onClick={handleProductClick}>
      {/* Wishlist & View Icons */}
      <div className="absolute top-3 right-3 z-20 flex flex-col gap-2">
        <button
          onClick={handleWishlistToggle}
          disabled={isLoading}
          className={`rounded-full p-2 shadow-lg transition-all duration-200 transform hover:scale-110 ${
            shouldFillHeart
              ? "text-pink-600 bg-pink-50 hover:bg-pink-100"
              : "bg-white hover:bg-pink-50 hover:text-pink-600"
          } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
          title={shouldFillHeart ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart size={18} className={shouldFillHeart ? "fill-pink-600" : ""} />
        </button>
        <button
          className="bg-white rounded-full p-2 shadow-lg hover:bg-teal-50 hover:text-teal-600 transition-all duration-200 transform hover:scale-110"
          title="Quick view"
        >
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
        {/*  <Image
              src="/tag/Gemini_Generated_Image_f56micf56micf56m.png"
              alt="Offer Badge"
              width={100}
              height={80}
              className="object-contain"  
              /> */}
        {/* Top Left Badge - Free Shipping */}
        <div className="absolute bottom-0 left-3 z-10">
          {!hasFreeShipping && (
            <Badge className="bg-[#024f42] hover:bg-[#036939] text-white px-3 py-1 text-xs font-semibold flex items-center gap-1 shadow-md">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="1" y="3" width="15" height="13" />
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                <circle cx="5.5" cy="18.5" r="2.5" />
                <circle cx="18.5" cy="18.5" r="2.5" />
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
            isExpanded ? "" : "overflow-hidden text-ellipsis"
          }`}
          style={{
            display: isExpanded ? "block" : "-webkit-box",
            WebkitLineClamp: isExpanded ? "unset" : 2,
            WebkitBoxOrient: "vertical",
          }}
          title={product.name}
        >
          {product.name}
        </h3>

        {/* Price Section */}
        <div className="mb-2">
          {specialPrice ? (
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-1">
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
              <div className="flex  items-center justify-between">
              <div className="flex items-center gap-1">
                <TakaIcon className="text-gray-400 text-base" />
                <span className="text-sm text-gray-400 line-through">
                  {price.toLocaleString()}
                </span>
                </div>
                 {/* Rating Section */}
        <div className="flex items-center gap-2 ">
          <div className="flex text-orange-400">
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} className="text-sm">
                {i < Math.floor(averageRating) ? "★" : "☆"}
              </span>
            ))}
          </div>
          <span className="text-sm text-gray-600 font-medium">
            {averageRating > 0 ? averageRating.toFixed(1) : ""} 
            {/* (
            {reviewCount}) */}
          </span>
        </div>
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
        <h2 className="text-xs sm:text-sm md:text-lg lg:text-xl font-bold text-gray-800">
          {title}
        </h2>
        <Link
          href="/products"
          className="text-teal-600 hover:text-teal-800 text-sm font-medium transition-colors"
        >
          See All
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-6 gap-1">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </Container>
  );
};

const ProductGrid = () => {
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const {
    data: productsResponse,
    isLoading,
    error,
    isFetching,
  } = useGetProductsQuery(
    { page },
    {
      refetchOnMountOrArgChange: true,
    },
  );

  // Extract products and pagination info
  const products = productsResponse?.data || [];
  const pagination = productsResponse?.pagination;

  // Load more products
  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore || isFetching) return;

    setIsLoadingMore(true);
    const nextPage = page + 1;
    setPage(nextPage);
    setIsLoadingMore(false);
  }, [hasMore, isLoadingMore, isFetching, page]);

  // Check if there are more products
  useEffect(() => {
    if (pagination) {
      setHasMore(pagination.hasNextPage);
    }
  }, [pagination]);

  // Handle scroll for infinite scroll (optional for homepage)
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >=
          document.body.offsetHeight - 500 &&
        !isFetching &&
        hasMore &&
        !isLoadingMore
      ) {
        loadMore();
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isFetching, hasMore, isLoadingMore, loadMore]);

  // Show skeleton while loading initial products
  if (isLoading && page === 1) {
    return (
      <>
        <HomepageProductSectionSkeleton
          title={true}
          showSeeAll={true}
          gridCols={6}
        />
      </>
    );
  }

  if (error)
    return (
      <p className="text-center py-10 text-red-500">Failed to load products.</p>
    );

  return (
    <>
      <ProductSection
        title="Yearly Stock Clearance Sale Offer - Up to 70% Discount"
        products={products}
      />

      {/* Load More Button (Alternative to infinite scroll) */}
      {hasMore && (
        <div className="flex justify-center py-8">
          <Button
            onClick={loadMore}
            disabled={isLoadingMore || isFetching}
            variant="outline"
            className="px-8"
          >
            {isLoadingMore ? "Loading..." : "Load More Products"}
          </Button>
        </div>
      )}

      {/* Loading indicator for infinite scroll */}
      {(isLoadingMore || (isFetching && page > 1)) && (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
        </div>
      )}
    </>
  );
};

export default ProductGrid;
