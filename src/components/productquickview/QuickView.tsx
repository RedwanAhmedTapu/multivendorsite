"use client";

import { useState } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, Star, ShoppingCart, Sparkles, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ProductVariant {
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

interface Review {
  rating: number;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  vendor?: Vendor;
  images?: ProductImage[];
  variants?: ProductVariant[];
  reviews?: Review[];
}

interface QuickViewProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
}

// Taka Icon Component
const TakaIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9v-4h2V8H9V6h2c1.1 0 2 .9 2 2v2c0 1.1-.9 2-2 2h2v2h-2v2zm6 0h-2v-2h2v-2h-2v-2h2V8h-2V6h2c1.1 0 2 .9 2 2v8c0 1.1-.9 2-2 2z" />
  </svg>
);

// Custom Image Component with error handling
const ProductImage = ({ src, alt, ...props }: any) => {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImgSrc("/placeholder-product.jpg");
    }
  };

  return (
    <Image
      {...props}
      src={hasError ? "/placeholder-product.jpg" : imgSrc}
      alt={alt}
      onError={handleError}
      sizes="(max-width: 768px) 100vw, 50vw"
    />
  );
};

export const QuickView: React.FC<QuickViewProps> = ({
  isOpen,
  onClose,
  product,
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [imageLoaded, setImageLoaded] = useState(false);

  if (!product) return null;

  // Get product images
  const productImages =
    product.images && product.images.length > 0
      ? product.images
      : [{ url: "/placeholder-product.jpg", altText: product.name }];

  // Get variant info
  const variant = product.variants?.length ? product.variants[0] : null;
  const price = variant?.price || 0;
  const specialPrice = variant?.specialPrice || null;
  const discount = variant?.discount || null;
  const stock = variant?.stock || 0;

  // Calculate average rating
  const averageRating = product.reviews?.length
    ? product.reviews.reduce((acc, review) => acc + review.rating, 0) /
      product.reviews.length
    : 0;
  const reviewCount = product.reviews?.length || 0;

  // Store info
  const storeName = product.vendor?.storeName || "Unknown Store";
  const isVerified = product.vendor?.verificationStatus === "VERIFIED";

  // Navigation handlers
  const handlePrevImage = () => {
    setImageLoaded(false);
    setCurrentImageIndex((prev) =>
      prev === 0 ? productImages.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    setImageLoaded(false);
    setCurrentImageIndex((prev) =>
      prev === productImages.length - 1 ? 0 : prev + 1
    );
  };

  // Quantity handlers
  const increaseQuantity = () => {
    if (quantity < stock) {
      setQuantity((prev) => prev + 1);
    }
  };

  const decreaseQuantity = () => {
    setQuantity((prev) => (prev > 1 ? prev - 1 : 1));
  };

  const handleAddToCart = () => {
    console.log("Add to cart:", { productId: product.id, quantity });
  };

  const handleBuyNow = () => {
    console.log("Buy now:", { productId: product.id, quantity });
  };

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Lexend:wght@400;500;600;700&display=swap');

        @keyframes modalFadeIn {
          from {
            opacity: 0;
            transform: scale(0.96) translateY(8px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }

        .modal-content {
          animation: modalFadeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .slide-in-left {
          animation: slideInLeft 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .slide-in-right {
          animation: slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .scale-in {
          animation: scaleIn 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .shimmer-effect {
          background: linear-gradient(
            to right,
            transparent 0%,
            rgba(255, 255, 255, 0.4) 50%,
            transparent 100%
          );
          background-size: 1000px 100%;
          animation: shimmer 2s infinite;
        }

        .quick-view-modal {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .quick-view-title {
          font-family: 'Lexend', sans-serif;
        }

        .glass-effect {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }

        /* Custom Scrollbar */
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(148, 163, 184, 0.1);
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(20, 184, 166, 0.3);
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(20, 184, 166, 0.5);
        }
      `}</style>

      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent 
          className="quick-view-modal modal-content w-[95vw] h-[90vh] sm:w-[85vw] sm:h-[85vh] lg:w-[70vw] lg:h-[70vh] p-0 overflow-hidden bg-white border border-gray-200 shadow-2xl"
          style={{
            maxWidth: '70vw',
            maxHeight: '90vh',
          }}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-50 glass-effect rounded-full p-2 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 group border border-gray-200"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-gray-600 group-hover:text-teal-600 transition-colors" />
          </button>

          {/* Main Grid Container */}
          <div className="grid grid-cols-1 lg:grid-cols-2 w-full h-full">
            {/* Left Section - Image Gallery */}
            <div className="relative bg-gradient-to-br from-gray-50 to-teal-50/20 flex flex-col items-center justify-center p-6 lg:p-8 overflow-hidden border-b lg:border-b-0 lg:border-r border-gray-200">
              {/* Discount Badge */}
              {discount && (
                <div className="absolute top-4 left-4 z-20 scale-in">
                  <div className="relative">
                    <div className="absolute inset-0 bg-teal-500 blur-md opacity-30 rounded-lg" />
                    <div className="relative bg-gradient-to-r from-teal-600 to-teal-500 text-white px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-1.5 font-semibold text-xs">
                      <Sparkles className="w-3 h-3" />
                      <span>-{discount}%</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Main Image Container */}
              <div className="relative w-full h-full flex items-center justify-center slide-in-left">
                <div className="relative w-full max-w-sm aspect-square">
                  {/* Image Loading Skeleton */}
                  {!imageLoaded && (
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 shimmer-effect rounded-2xl" />
                  )}
                  
                  <ProductImage
                    src={productImages[currentImageIndex].url}
                    alt={productImages[currentImageIndex].altText || product.name}
                    fill
                    className="object-contain drop-shadow-xl transition-opacity duration-300"
                    style={{ opacity: imageLoaded ? 1 : 0 }}
                    onLoad={() => setImageLoaded(true)}
                    priority
                  />
                </div>
              </div>

              {/* Navigation Arrows */}
              {productImages.length > 1 && (
                <>
                  <button
                    onClick={handlePrevImage}
                    className="absolute left-3 top-1/2 -translate-y-1/2 glass-effect rounded-full p-2 shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200 z-10 border border-gray-200 group"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-4 h-4 text-gray-600 group-hover:text-teal-600 transition-colors" />
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="absolute right-3 top-1/2 -translate-y-1/2 glass-effect rounded-full p-2 shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200 z-10 border border-gray-200 group"
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-teal-600 transition-colors" />
                  </button>
                </>
              )}

              {/* Image Indicators */}
              {productImages.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                  {productImages.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setImageLoaded(false);
                        setCurrentImageIndex(index);
                      }}
                      className={`transition-all duration-300 rounded-full ${
                        index === currentImageIndex
                          ? "bg-teal-600 w-8 h-2 shadow-md"
                          : "bg-gray-300 w-2 h-2 hover:bg-gray-400"
                      }`}
                      aria-label={`Go to image ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Right Section - Product Details (Scrollable) */}
            <div className="flex flex-col h-full overflow-hidden">
              <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar px-5 lg:px-6 py-5 lg:py-6 slide-in-right">
                {/* Product Header */}
                <div className="mb-5">
                  <DialogHeader className="mb-3">
                    <DialogTitle className="quick-view-title text-xl lg:text-2xl font-semibold text-gray-900 pr-8 leading-snug">
                      {product.name}
                    </DialogTitle>
                  </DialogHeader>

                  {/* Category & Rating Row */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <Badge className="bg-teal-50 text-teal-700 border border-teal-200 px-2.5 py-1 text-[10px] font-medium rounded-md">
                      Home & Garden
                    </Badge>

                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${
                              i < Math.floor(averageRating)
                                ? "fill-amber-400 text-amber-400"
                                : "fill-gray-200 text-gray-200"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-gray-600 font-medium">
                        {averageRating.toFixed(1)} <span className="text-gray-400">({reviewCount})</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Price Section */}
                <div className="mb-5 p-4 bg-gradient-to-br from-teal-50 to-teal-50/50 rounded-xl border border-teal-100">
                  <div className="flex items-baseline gap-2 mb-2">
                    <div className="flex items-center gap-1">
                      <TakaIcon className="text-teal-600 w-5 h-5 lg:w-6 lg:h-6" />
                      <span className="text-2xl lg:text-3xl font-bold text-teal-700 quick-view-title">
                        {specialPrice
                          ? specialPrice.toLocaleString()
                          : price.toLocaleString()}
                      </span>
                    </div>
                    
                    {discount && (
                      <div className="bg-teal-600 text-white px-2 py-0.5 rounded text-[10px] font-semibold">
                        Save ৳{(price - (specialPrice || price)).toLocaleString()}
                      </div>
                    )}
                  </div>

                  {specialPrice && (
                    <div className="flex items-center gap-1 mb-2">
                      <TakaIcon className="text-gray-400 w-4 h-4" />
                      <span className="text-sm text-gray-400 line-through">
                        {price.toLocaleString()}
                      </span>
                    </div>
                  )}

                  {/* Stock Status */}
                  <div className="flex items-center gap-1.5">
                    {stock > 0 ? (
                      <>
                        <div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-pulse" />
                        <span className="text-xs text-teal-700 font-medium">
                          {stock} items in stock
                        </span>
                      </>
                    ) : (
                      <>
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                        <span className="text-xs text-red-600 font-medium">
                          Out of stock
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Quantity Selector */}
                <div className="mb-5">
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Quantity
                  </label>
                  <div className="inline-flex items-center bg-white border border-gray-300 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <button
                      onClick={decreaseQuantity}
                      disabled={quantity <= 1}
                      className="px-3 py-2 hover:bg-teal-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed border-r border-gray-300"
                    >
                      <span className="text-base font-semibold text-teal-600">−</span>
                    </button>
                    <span className="px-6 py-2 text-sm font-semibold text-gray-900 min-w-[60px] text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={increaseQuantity}
                      disabled={quantity >= stock}
                      className="px-3 py-2 hover:bg-teal-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed border-l border-gray-300"
                    >
                      <span className="text-base font-semibold text-teal-600">+</span>
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2.5 mb-5">
                  <button
                    onClick={handleAddToCart}
                    disabled={stock === 0}
                    className="relative overflow-hidden bg-teal-600 hover:bg-teal-700 text-white py-2.5 px-4 rounded-lg font-semibold text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg hover:scale-[1.02] flex items-center justify-center gap-1.5 group"
                  >
                    <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                    <ShoppingCart className="w-4 h-4 relative z-10" />
                    <span className="relative z-10">Add to Cart</span>
                  </button>
                  
                  <button
                    onClick={handleBuyNow}
                    disabled={stock === 0}
                    className="bg-white border border-teal-600 text-teal-700 hover:bg-teal-50 py-2.5 px-4 rounded-lg font-semibold text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg hover:scale-[1.02]"
                  >
                    Buy Now
                  </button>
                </div>

                {/* Description */}
                <div className="mb-5 p-4 bg-white rounded-lg border border-gray-200">
                  <h3 className="text-xs font-semibold text-gray-900 mb-2 flex items-center gap-1.5">
                    <div className="w-0.5 h-4 bg-teal-600 rounded-full" />
                    Product Description
                  </h3>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    This premium product features high-quality materials and
                    excellent craftsmanship. Designed for durability and style, it
                    offers exceptional value for your home and garden needs.
                  </p>
                </div>

                {/* Vendor Info */}
                <div className="p-4 bg-gradient-to-br from-gray-50 to-teal-50/20 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-2.5">
                    <h3 className="text-xs font-semibold text-gray-900">Sold by</h3>
                    {isVerified && (
                      <div className="flex items-center gap-1 bg-teal-100 px-2 py-0.5 rounded-full">
                        <Shield className="w-3 h-3 text-teal-600" />
                        <span className="text-[10px] text-teal-700 font-semibold">Verified</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2.5">
                    {product.vendor?.avatar && (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-teal-500 p-0.5 flex-shrink-0">
                        <div className="w-full h-full rounded-full bg-white overflow-hidden">
                          <ProductImage
                            src={product.vendor.avatar}
                            alt={storeName}
                            width={40}
                            height={40}
                            className="object-cover"
                          />
                        </div>
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm text-gray-900 truncate mb-0.5">
                        {storeName}
                      </h4>
                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className="w-2.5 h-2.5 fill-amber-400 text-amber-400"
                            />
                          ))}
                        </div>
                        <span className="text-[10px] text-gray-600">
                          4.67 <span className="text-gray-400">(27)</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};