"use client";

import { BadgeCheck, ShoppingCart, Heart, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { useState, useEffect } from "react";
import { QuickView } from "@/components/productquickview/QuickView";
import { 
  useAddToWishlistMutation, 
  useRemoveFromWishlistMutation,
  useLazyCheckInWishlistQuery
} from "@/features/cartWishApi";
import { toast } from "sonner";

interface ProductVariant {
  id: string;
  price: number;
  specialPrice: number | null;
  discount: number | null;
  stock: number;
}

interface ProductImage {
  url: string;
  altText: string;
}

interface Vendor {
  id: string;
  storeName: string;
  avatar: string;
  verificationStatus: "PENDING" | "VERIFIED" | "REJECTED";
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Review {
  rating: number;
}

interface OfferProduct {
  offer: {
    id: string;
    type: string;
    title: string;
    minOrderAmount: number | null;
  };
}

interface Product {
  id: string;
  name: string;
  slug: string;
  approvalStatus?: string;
  createdAt?: string;
  vendor?: Vendor;
  category?: Category;
  images?: ProductImage[];
  variants?: ProductVariant[];
  reviews?: Review[];
  offerProducts?: OfferProduct[];
}

interface ProductCardProps {
  product: Product;
  view?: "grid" | "list";
}

// Taka Icon Component using FontAwesome
const TakaIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <i className={`fa-solid fa-bangladeshi-taka-sign ${className}`} />
);

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  view = "grid",
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);
  const [localWishlistState, setLocalWishlistState] = useState(false);

  // Get primary image
  const primaryImage = product.images?.length ? product.images[0].url : null;
  const imageAlt = product.images?.length
    ? product.images[0].altText
    : product.name;

  // Get variant info
  const variant = product.variants?.length ? product.variants[0] : null;
  const price = variant?.price || 0;
  const specialPrice = variant?.specialPrice || null;
  const discount = variant?.discount || null;
  const variantId = variant?.id || "";

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

  // Wishlist API hooks
  const [addToWishlist] = useAddToWishlistMutation();
  const [removeFromWishlist] = useRemoveFromWishlistMutation();
  const [triggerCheckWishlist, { data: wishlistCheck }] = useLazyCheckInWishlistQuery();

  // Check if product is in wishlist
  const isInWishlist = wishlistCheck?.data?.inWishlist || false;
  const wishlistItemId = wishlistCheck?.data?.itemId;

  // Check wishlist status on mount
  useEffect(() => {
    if (product.id) {
      triggerCheckWishlist({
        productId: product.id,
        variantId: variantId || undefined
      });
    }
  }, [product.id, variantId, triggerCheckWishlist]);

  // Update local state when wishlist check changes
  useEffect(() => {
    if (wishlistCheck?.data) {
      setLocalWishlistState(wishlistCheck.data.inWishlist);
    }
  }, [wishlistCheck]);

  // Handle quick view
  const handleQuickViewClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsQuickViewOpen(true);
  };

  // Handle wishlist
  const handleWishlistClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isWishlistLoading) return;
    
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
          variantId: variantId || undefined
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
          variantId: variantId || undefined
        });
      }
    } catch (error: any) {
      console.error("Wishlist toggle error:", error);
      const errorMessage = error?.data?.message || error?.message || "Something went wrong";
      toast.error(errorMessage);
    } finally {
      setIsWishlistLoading(false);
    }
  };

  // Determine if heart should be filled
  const shouldFillHeart = localWishlistState || isInWishlist;

  // ---------------- LIST VIEW ----------------
  if (view === "list") {
    return (
      <>
        <Card className="w-[62%] overflow-hidden border shadow-none hover:shadow-md transition-shadow duration-300">
          <CardContent className="p-0">
            <div className="flex flex-col lg:flex-row">
              {/* Image Section */}
              <div className="lg:w-2/5 xl:w-1/3 relative bg-gray-50 group">
                <div className="w-full h-48 sm:h-56 md:h-64 lg:h-full flex items-center justify-center relative overflow-hidden min-h-[200px]">
                  {primaryImage ? (
                    <Image
                      src={primaryImage}
                      alt={imageAlt}
                      fill
                      className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 1024px) 100vw, 33vw"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-400">No Image</span>
                    </div>
                  )}
                </div>

                {/* Badges Container */}
                <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex flex-col gap-2 z-10">
                  {hasFreeShipping && (
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

                {/* Discount Badge */}
                {discount && (
                  <div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10">
                    <Badge className="bg-pink-50 text-pink-600 px-2 py-0.5 sm:px-3 sm:py-1 text-xs font-bold border border-pink-200">
                      -{discount}%
                    </Badge>
                  </div>
                )}

                {/* Quick Actions Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="flex gap-2">
                    <button
                      onClick={handleWishlistClick}
                      disabled={isWishlistLoading}
                      className={`bg-white rounded-full p-2 sm:p-3 shadow-lg transition-all duration-200 transform hover:scale-110 ${
                        shouldFillHeart 
                          ? "text-pink-600 bg-pink-50 hover:bg-pink-100" 
                          : "hover:bg-pink-50 hover:text-pink-600"
                      } ${isWishlistLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <Heart 
                        size={16} 
                        className={`sm:w-4 sm:h-4 ${shouldFillHeart ? "fill-pink-600" : ""}`}
                      />
                    </button>
                    <button
                      onClick={handleQuickViewClick}
                      className="bg-white rounded-full p-2 sm:p-3 shadow-lg hover:bg-teal-50 hover:text-teal-600 transition-all duration-200 transform hover:scale-110"
                    >
                      <Eye size={16} className="sm:w-4 sm:h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Content Section */}
              <div className="p-4 sm:p-6 lg:w-3/5 xl:w-2/3 flex flex-col justify-between">
                <div>
                  {/* Store Name with Verification Badge */}
                  <div className="flex flex-col xs:flex-row xs:items-center gap-1 xs:gap-2 mb-2 sm:mb-3">
                    <span className="text-xs sm:text-sm text-gray-600 font-medium truncate">
                      {storeName}
                    </span>
                    {isVerified && (
                      <Badge className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white px-2 py-0.5 text-xs font-semibold shadow-lg border-0 flex items-center gap-1 flex-shrink-0 transition-all duration-200 w-fit">
                        <BadgeCheck className="w-3 h-3" />
                        Verified
                      </Badge>
                    )}
                  </div>

                  {/* Product Name */}
                  <h3
                    className={`font-medium text-base sm:text-lg text-gray-800 mb-2 sm:mb-3 leading-relaxed cursor-pointer hover:text-teal-700 transition-colors ${
                      isExpanded ? "" : "overflow-hidden"
                    }`}
                    style={{
                      display: isExpanded ? "block" : "-webkit-box",
                      WebkitLineClamp: isExpanded ? "unset" : 2,
                      WebkitBoxOrient: "vertical",
                    }}
                    onClick={() => setIsExpanded(!isExpanded)}
                    title={product.name}
                  >
                    {product.name}
                  </h3>

                  {/* Price Section */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2 sm:mb-3">
                    {specialPrice ? (
                      <>
                        <div className="flex items-center gap-1">
                          <TakaIcon className="text-teal-600 text-base sm:text-lg" />
                          <span className="text-2xl sm:text-3xl font-bold text-teal-600">
                            {specialPrice.toLocaleString()}
                          </span>
                        </div>
                        {discount && (
                          <Badge className="bg-pink-50 text-teal-600 px-2 py-0.5 sm:px-3 sm:py-1 text-xs font-bold border border-teal-200 w-fit">
                            -{discount}%
                          </Badge>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center gap-1">
                        <TakaIcon className="text-gray-800 text-base sm:text-lg" />
                        <span className="text-2xl sm:text-3xl font-bold text-gray-800">
                          {price.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Original Price */}
                  {specialPrice && (
                    <div className="mb-2 sm:mb-3">
                      <div className="flex items-center gap-1">
                        <TakaIcon className="text-gray-400 text-sm sm:text-base" />
                        <span className="text-sm sm:text-base text-gray-400 line-through">
                          {price.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Rating and Category Container */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3 sm:mb-4">
                    {/* Rating Section */}
                    <div className="flex items-center gap-2">
                      <div className="flex text-orange-400">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i} className="text-sm sm:text-base">
                            {i < Math.floor(averageRating) ? "★" : "☆"}
                          </span>
                        ))}
                      </div>
                      <span className="text-xs sm:text-sm text-gray-600 font-medium">
                        {averageRating.toFixed(1)} ({reviewCount} reviews)
                      </span>
                    </div>

                    {/* Category */}
                    {product.category && (
                      <Badge
                        variant="outline"
                        className="text-gray-500 text-xs w-fit"
                      >
                        {product.category.name}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Add to Cart Button */}
                <Button className="mt-3 sm:mt-4 bg-teal-900 hover:bg-teal-800 text-white flex items-center justify-center gap-2 h-10 sm:h-12 text-sm sm:text-base font-medium transition-all duration-200 hover:shadow-lg w-full">
                  <ShoppingCart size={16} className="sm:w-5 sm:h-5" />
                  Add to Cart
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick View Modal */}
        <QuickView
          isOpen={isQuickViewOpen}
          onClose={() => setIsQuickViewOpen(false)}
          product={product}
        />
      </>
    );
  }

  // ---------------- GRID VIEW ----------------
  return (
    <>
      <Card className="group relative border border-gray-200 rounded-lg p-0 shadow-sm hover:shadow-lg transition-all duration-300 h-full flex flex-col bg-white overflow-hidden">
        {/* Wishlist & View Icons */}
        <div className="absolute top-3 right-3 z-20 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={handleWishlistClick}
            disabled={isWishlistLoading}
            className={`bg-white rounded-full p-2 shadow-lg transition-all duration-200 transform hover:scale-110 ${
              shouldFillHeart 
                ? "text-pink-600 bg-pink-50 hover:bg-pink-100" 
                : "hover:bg-pink-50 hover:text-pink-600"
            } ${isWishlistLoading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <Heart 
              size={18} 
              className={shouldFillHeart ? "fill-pink-600" : ""}
            />
          </button>
          <button
            onClick={handleQuickViewClick}
            className="bg-white rounded-full p-2 shadow-lg hover:bg-teal-50 hover:text-teal-600 transition-all duration-200 transform hover:scale-110"
          >
            <Eye size={18} />
          </button>
        </div>

        {/* Also show wishlist heart in top right corner when item is in wishlist */}
        {shouldFillHeart && (
          <div className="absolute top-3 right-3 z-10 opacity-100 group-hover:opacity-0 transition-opacity duration-300">
            <button 
              onClick={handleWishlistClick}
              disabled={isWishlistLoading}
              className="bg-white rounded-full p-2 shadow-lg text-pink-600 bg-pink-50 transition-all duration-200"
              title="In wishlist"
            >
              <Heart size={18} className="fill-pink-600" />
            </button>
          </div>
        )}

        {/* Image Container */}
        <div className="relative w-full h-44 overflow-hidden bg-gray-50">
          <div className="relative w-full h-full flex items-center justify-center">
            {primaryImage ? (
              <Image
                src={primaryImage}
                alt={imageAlt}
                fill
                className="object-contain"
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
              <Image
                src="/tag/Envío gratuito destacado.png"
                alt="free shipping badge"
                width={100}
                height={40}
              />
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
            onClick={() => setIsExpanded(!isExpanded)}
            title={product.name}
          >
            {product.name}
          </h3>

          {/* Price Section */}
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
              <Image
                src="/tag/Envío gratuito destacado.png"
                alt="verified badge"
                width={100}
                height={40}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick View Modal */}
      <QuickView
        isOpen={isQuickViewOpen}
        onClose={() => setIsQuickViewOpen(false)}
        product={product}
      />
    </>
  );
};