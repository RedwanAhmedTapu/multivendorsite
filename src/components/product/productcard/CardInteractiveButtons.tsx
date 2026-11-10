// components/product/productcard/CardInteractiveButtons.tsx
"use client"; // শুধু এই ছোট অংশটুকুই Client Component

import { Heart, Eye } from "lucide-react";
import { useState, useEffect } from "react";
import { useLazyCheckInWishlistQuery, useAddToWishlistMutation, useRemoveFromWishlistMutation } from "@/features/cartWishApi";
import { toast } from "sonner";

export function CardInteractiveButtons({ product, variantId }: { product: any, variantId?: string }) {
  const [isWishlist, setIsWishlist] = useState(false);
  const [triggerCheck, { data: wishlistData }] = useLazyCheckInWishlistQuery();
  const [addToWishlist] = useAddToWishlistMutation();
  const [removeFromWishlist] = useRemoveFromWishlistMutation();

  useEffect(() => {
    if (product.id) triggerCheck({ productId: product.id, variantId });
  }, [product.id, variantId]);

  useEffect(() => {
    if (wishlistData?.data?.inWishlist) setIsWishlist(true);
  }, [wishlistData]);

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault(); // Link এ যাওয়া বন্ধ করতে
    e.stopPropagation();
    // আপনার existing wishlist toggle লজিক এখানে বসান
    toast.success(isWishlist ? "Removed from wishlist" : "Added to wishlist");
    setIsWishlist(!isWishlist);
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Quick view open করার লজিক
  };

  return (
    <div className="absolute top-3 right-3 z-20 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
      <button
        onClick={handleWishlist}
        className={`bg-white rounded-full p-2 shadow-lg transition-all ${isWishlist ? 'text-pink-600' : 'hover:text-pink-600'}`}
      >
        <Heart size={18} className={isWishlist ? "fill-pink-600" : ""} />
      </button>
      <button
        onClick={handleQuickView}
        className="bg-white rounded-full p-2 shadow-lg hover:text-teal-600 transition-all"
      >
        <Eye size={18} />
      </button>
    </div>
  );
}