// pages/products/[id].tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Star,
  Truck,
  MapPin,
  RotateCcw,
  ShieldAlert,
  MessageCircle,
  Store,
  QrCode,
  ShieldCheck,
  ArrowLeft,
  FileText,
  MessageSquare,
  CheckSquare,
  ShoppingCart,
  Heart,
  Eye,
  Plus,
  Minus,
} from "lucide-react";
import MoreInfoProduct from "@/components/product/moreinfoproduct/MoreInfoProduct";
import { useGetProductByIdQuery } from "@/features/productApi";
import { VendorChatButton } from "@/components/chatbox/VendorChatButton";
import DeliveryLocation from "@/components/deleiverylocation/DeliveryLocation";
import { LoginModal } from "@/components/loginmodal/loginModal";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { 
  useAddToCartMutation, 
  useCheckInWishlistQuery,
  useAddToWishlistMutation,
  useRemoveFromWishlistMutation,
  useLazyCheckInWishlistQuery
} from "@/features/cartWishApi";
import { toast } from "sonner";

// Skeleton Component
const Skeleton = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
);

// Custom image component with proper error handling
const ProductImage = ({ src, alt, ...props }: any) => {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setImgSrc(src);
    setHasError(false);
  }, [src]);

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
    />
  );
};

// Helper function to calculate product weight
const calculateProductWeight = (product: any): number => {
  try {
    if (product?.variants?.[0]?.weight) {
      return product.variants[0].weight;
    }

    const defaultWeights: { [key: string]: number } = {
      electronics: 1000,
      phones: 1000,
      android: 1000,
      iphone: 1000,
      mobile: 1000,
      clothing: 200,
      fashion: 200,
      books: 300,
      stationery: 300,
      home: 500,
      furniture: 500,
      kitchen: 500,
      default: 500,
    };

    const categoryName = product?.category?.name;
    
    if (typeof categoryName === 'string') {
      const lowerCategory = categoryName.toLowerCase();
      
      for (const [key, weight] of Object.entries(defaultWeights)) {
        if (lowerCategory.includes(key)) {
          return weight;
        }
      }
    }

    return defaultWeights.default;
  } catch (error) {
    console.error('Error calculating product weight:', error);
    return 500;
  }
};

// Helper function to get product images
const getProductImages = (product: any): string[] => {
  const images: string[] = [];

  product?.images?.forEach((img: any) => {
    if (img.url) images.push(img.url);
  });

  product?.variants?.forEach((v: any) => {
    v.images?.forEach((img: any) => {
      if (img.url) images.push(img.url);
    });
  });

  return images.length > 0 ? images : ["/placeholder-product.jpg"];
};

// Tab names enum
enum TabType {
  DESCRIPTION = 'description',
  SPECIFICATIONS = 'specifications',
  REVIEWS = 'reviews'
}

// Loading Skeleton Component
const ProductSkeleton = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back Button Skeleton */}
      <div className="container mx-auto px-4 py-4 max-w-7xl">
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Product Content Skeleton */}
      <section className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Section - Images Skeleton */}
        <div>
          {/* Main Image Skeleton */}
          <Skeleton className="w-full h-[400px] rounded-lg" />
          
          {/* Thumbnails Skeleton */}
          <div className="flex gap-2 mt-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="w-14 h-14 rounded-md" />
            ))}
          </div>
        </div>

        {/* Right Section Skeleton */}
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-5">
              {/* Title */}
              <Skeleton className="h-8 w-3/4" />
              
              {/* Rating */}
              <div className="flex gap-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>
              
              {/* Brand */}
              <Skeleton className="h-4 w-32" />
              
              {/* Price */}
              <div className="flex gap-3">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-16" />
              </div>
              
              {/* Promotion */}
              <Skeleton className="h-8 w-40" />
              
              {/* Color */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-12 w-12" />
              </div>
              
              {/* Quantity */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-32" />
              </div>
              
              {/* Buttons */}
              <div className="flex gap-3">
                <Skeleton className="h-12 flex-1" />
                <Skeleton className="h-12 flex-1" />
              </div>
              
              {/* Wishlist */}
              <Skeleton className="h-12 w-full" />
            </div>

            {/* Right Column */}
            <div className="space-y-5">
              {/* Seller Info */}
              <div className="border rounded-lg p-4 space-y-3">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-40" />
                <div className="flex gap-2">
                  <Skeleton className="h-9 w-28" />
                  <Skeleton className="h-9 w-28" />
                </div>
              </div>
              
              {/* QR Code */}
              <div className="border rounded-lg p-4">
                <Skeleton className="h-16 w-full" />
              </div>
              
              {/* Return & Warranty */}
              <div className="border rounded-lg p-4 space-y-3">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs Section Skeleton */}
      <section className="md:max-w-7xl mx-auto px-4 py-8">
        <div className="border-b border-gray-200 mb-6">
          <div className="flex gap-2">
            <Skeleton className="h-12 w-32 rounded-t-lg" />
            <Skeleton className="h-12 w-32 rounded-t-lg" />
            <Skeleton className="h-12 w-32 rounded-t-lg" />
          </div>
        </div>
        
        <div className="p-6 bg-white rounded-lg">
          <Skeleton className="h-6 w-48 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4 mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </section>
    </div>
  );
};

const SingleProduct = () => {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const { data: product, isLoading, error } = useGetProductByIdQuery(productId);
  const [selectedImg, setSelectedImg] = useState<string | null>(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [deliveryCost, setDeliveryCost] = useState<number | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{
    city: any;
    zone: any;
    area: any;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>(TabType.DESCRIPTION);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);
  
  // Auth state
  const { user, accessToken } = useSelector((state: RootState) => state.auth);
  const isAuthenticated = !!user && !!accessToken;

  // Cart and Wishlist mutations with error handling
  const [addToCart, { isLoading: isAddingToCart, error: addToCartError, reset: resetAddToCart }] = useAddToCartMutation();
  const [addToWishlist] = useAddToWishlistMutation();
  const [removeFromWishlist] = useRemoveFromWishlistMutation();
  const [triggerCheckWishlist, { data: wishlistCheck }] = useLazyCheckInWishlistQuery();

  const productWeight = product ? calculateProductWeight(product) : 500;
  const productImages = product ? getProductImages(product) : [];
  const variant = product?.variants?.[0];
  const variantId = variant?.id;

  // Check wishlist status
  const isInWishlist = wishlistCheck?.data?.inWishlist || false;
  const wishlistItemId = wishlistCheck?.data?.itemId;

  useEffect(() => {
    if (productImages.length > 0) {
      setSelectedImg(productImages[0]);
    }
  }, [product, productImages]);

  // Check wishlist status when product loads
  useEffect(() => {
    if (product?.id && variantId && isAuthenticated) {
      triggerCheckWishlist({
        productId: product.id,
        variantId: variantId
      });
    }
  }, [product?.id, variantId, isAuthenticated, triggerCheckWishlist]);

  // Handle addToCart errors (token expired)
  useEffect(() => {
    if (addToCartError) {
      const errorData = addToCartError as any;
      if (errorData?.status === 401 || errorData?.status === 403) {
        // Token expired or invalid
        toast.error("Your session has expired. Please login again.");
        setIsLoginModalOpen(true);
        resetAddToCart(); // Reset the mutation state
      } else {
        // Other errors
        toast.error(errorData?.data?.message || "Failed to add to cart");
      }
    }
  }, [addToCartError, resetAddToCart]);

  const handleDeliveryCostCalculated = (cost: number | null) => {
    setDeliveryCost(cost);
  };

  const handleLocationSelected = (location: any) => {
    setSelectedLocation(location);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const { left, top, width, height } =
      e.currentTarget.getBoundingClientRect();
    const x = ((e.pageX - left - window.scrollX) / width) * 100;
    const y = ((e.pageY - top - window.scrollY) / height) * 100;
    setHoverPos({ x, y });
  };

  const increaseQuantity = () => setQuantity((prev) => prev + 1);
  const decreaseQuantity = () =>
    setQuantity((prev) => (prev > 1 ? prev - 1 : 1));

  const handleAddToCart = async () => {
    // First check if user is authenticated
    if (!isAuthenticated) {
      setIsLoginModalOpen(true);
      return;
    }

    if (!variantId) {
      toast.error("Please select a variant");
      return;
    }

    try {
      const cartData = {
        productId: productId,
        variantId: variantId,
        quantity: quantity,
        notes: "",
      };

      await addToCart(cartData).unwrap();
      toast.success("Added to cart successfully!");
    } catch (error: any) {
      // Error is already handled in useEffect above
      console.error("Add to cart error:", error);
      // Don't show toast here, it's handled in useEffect
    }
  };

  const handleBuyNow = async () => {
    // First check if user is authenticated
    if (!isAuthenticated) {
      setIsLoginModalOpen(true);
      return;
    }

    if (!variantId) {
      toast.error("Please select a variant");
      return;
    }

    try {
      const cartData = {
        productId: productId,
        variantId: variantId,
        quantity: quantity,
        notes: "",
      };

      await addToCart(cartData).unwrap();
      toast.success("Added to cart!");
      router.push("/cart");
    } catch (error: any) {
      console.error("Buy now error:", error);
      // Check if it's an auth error
      const errorData = error as any;
      if (errorData?.status === 401 || errorData?.status === 403) {
        toast.error("Your session has expired. Please login again.");
        setIsLoginModalOpen(true);
      } else {
        toast.error(errorData?.data?.message || "Failed to process order");
      }
    }
  };

  const handleWishlistToggle = async () => {
    if (!isAuthenticated) {
      setIsLoginModalOpen(true);
      return;
    }

    if (isWishlistLoading) return;
    
    setIsWishlistLoading(true);
    
    try {
      if (isInWishlist && wishlistItemId) {
        await removeFromWishlist(wishlistItemId).unwrap();
        toast.success("Removed from wishlist");
      } else {
        const wishlistData = {
          productId: productId,
          variantId: variantId || undefined,
          priority: 1,
          notes: "",
          notifyOnDiscount: true,
          notifyOnRestock: true,
        };
        
        await addToWishlist(wishlistData).unwrap();
        toast.success("Added to wishlist");
      }
      
      // Refresh wishlist check
      triggerCheckWishlist({
        productId: productId,
        variantId: variantId
      });
    } catch (error: any) {
      console.error("Wishlist toggle error:", error);
      // Check if it's an auth error
      const errorData = error as any;
      if (errorData?.status === 401 || errorData?.status === 403) {
        toast.error("Your session has expired. Please login again.");
        setIsLoginModalOpen(true);
      } else {
        toast.error(errorData?.data?.message || "Failed to update wishlist");
      }
    } finally {
      setIsWishlistLoading(false);
    }
  };

  const handleLoginSuccess = () => {
    toast.success("Login successful!");
    setIsLoginModalOpen(false);
    
    // After successful login, retry the last action
    // You could add logic here to remember what the user was trying to do
    // For now, just show a message
    toast.info("You can now add items to cart");
  };

  // Render content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case TabType.DESCRIPTION:
        return (
          <div className="p-6 bg-white rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold mb-4 text-teal-900">Product Description</h3>
            <div 
              className="prose prose-sm md:prose-base max-w-none
                prose-headings:text-teal-900 prose-headings:font-semibold
                prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-4
                prose-ul:list-disc prose-ul:ml-6 prose-ul:mb-4
                prose-ol:list-decimal prose-ol:ml-6 prose-ol:mb-4
                prose-li:text-gray-700 prose-li:mb-2
                prose-strong:text-gray-900 prose-strong:font-semibold
                prose-a:text-teal-700 prose-a:underline hover:prose-a:text-teal-900
                prose-img:rounded-lg prose-img:shadow-sm prose-img:my-4
                prose-blockquote:border-l-4 prose-blockquote:border-teal-900 
                prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-600
                prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 
                prose-code:rounded prose-code:text-sm prose-code:text-teal-800
                prose-pre:bg-gray-100 prose-pre:p-4 prose-pre:rounded-lg 
                prose-pre:overflow-x-auto"
              dangerouslySetInnerHTML={{ 
                __html: product?.description || "<p class='text-gray-500 italic'>No description available.</p>" 
              }}
            />
          </div>
        );

      case TabType.SPECIFICATIONS:
        return (
          <div className="p-6 bg-white rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold mb-6 text-teal-900">Specifications</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <tbody className="divide-y divide-gray-200">
                  {(product as any)?.attributes && (product as any).attributes.length > 0 ? (
                    (product as any).attributes.map((spec: any, index: number) => (
                      <tr key={index} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 bg-gray-50 w-1/3">
                          {spec.name}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {spec.value}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={2} className="px-4 py-8 text-center text-gray-500">
                        No specifications available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );

      case TabType.REVIEWS:
        return (
          <div className="p-6 bg-white rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold mb-6 text-teal-900">Customer Reviews</h3>
            
            {/* Average Rating */}
            <div className="flex items-center gap-6 mb-8 p-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-900">4.5</div>
                <div className="flex items-center justify-center mt-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-5 h-5 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
                <div className="text-sm text-gray-600 mt-1">Based on 339 reviews</div>
              </div>
              
              {/* Rating Breakdown */}
              <div className="flex-1">
                {[5, 4, 3, 2, 1].map((stars) => (
                  <div key={stars} className="flex items-center gap-2 mb-1">
                    <div className="flex items-center gap-1 w-16">
                      <span className="text-sm">{stars}</span>
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    </div>
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-yellow-400"
                        style={{ width: `${(stars/5) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 w-10 text-right">
                      {Math.round((stars/5) * 339)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Review List */}
            <div className="space-y-6">
              {/* Sample Review 1 */}
              <div className="border-b pb-6">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold">John Doe</h4>
                    <div className="flex items-center gap-1 mt-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className="w-4 h-4 fill-yellow-400 text-yellow-400"
                        />
                      ))}
                      <span className="text-sm text-gray-600 ml-2">2 days ago</span>
                    </div>
                  </div>
                </div>
                <p className="text-gray-700 mt-2">
                  Excellent product! Works perfectly and the quality is outstanding.
                  Highly recommended!
                </p>
              </div>

              {/* Sample Review 2 */}
              <div className="border-b pb-6">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold">Jane Smith</h4>
                    <div className="flex items-center gap-1 mt-1">
                      {[...Array(4)].map((_, i) => (
                        <Star
                          key={i}
                          className="w-4 h-4 fill-yellow-400 text-yellow-400"
                        />
                      ))}
                      <Star className="w-4 h-4 fill-gray-300 text-gray-300" />
                      <span className="text-sm text-gray-600 ml-2">1 week ago</span>
                    </div>
                  </div>
                </div>
                <p className="text-gray-700 mt-2">
                  Good product overall, but delivery took longer than expected.
                  The product itself works well though.
                </p>
              </div>

              {/* Add Review Button */}
              <Button 
                onClick={() => !isAuthenticated ? setIsLoginModalOpen(true) : null}
                className="mt-6 bg-teal-900 hover:bg-teal-800"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Write a Review
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (isLoading) {
    return <ProductSkeleton />;
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Product not found</h2>
          <Button onClick={() => router.push("/products")}>
            Back to Products
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back Button */}
      <div className="container mx-auto px-4 py-4 max-w-7xl">
        <Button
          variant="ghost"
          onClick={() => router.push("/products")}
          className="mb-4 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Products
        </Button>
      </div>

      {/* Product Content */}
      <section className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Section - Product Images */}
        <div>
          {/* Main Image */}
          <div
            className="relative border rounded-lg overflow-hidden bg-white h-[400px]"
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            {selectedImg && (
              <ProductImage
                src={selectedImg}
                alt={product.name}
                fill
                className="object-contain"
                priority
              />
            )}
            {isHovering && (
              <div
                className="absolute border-2 border-teal-900 bg-gray-300/30 pointer-events-none"
                style={{
                  left: `${hoverPos.x}%`,
                  top: `${hoverPos.y}%`,
                  transform: "translate(-50%, -50%)",
                  width: "140px",
                  height: "140px",
                }}
              />
            )}
          </div>

          {/* Thumbnail Slider */}
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
            {productImages.map((img, i) => (
              <button
                key={i}
                onClick={() => setSelectedImg(img)}
                className={`flex-shrink-0 border-2 rounded-md p-1 transition-all ${
                  selectedImg === img
                    ? "border-teal-900 scale-105"
                    : "border-gray-300 hover:border-teal-500"
                }`}
              >
                <ProductImage
                  src={img}
                  alt={`Thumbnail ${i}`}
                  width={64}
                  height={64}
                  className="w-14 h-14 object-contain"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Right Section - Two Column Layout */}
        <div className="text-gray-800 relative">
          {/* Zoom Preview */}
          <div
            className={`absolute inset-0 transition-opacity duration-300 ${
              isHovering
                ? "opacity-100 z-10"
                : "opacity-0 z-0 pointer-events-none"
            }`}
          >
            <div className="border rounded-lg overflow-hidden w-full h-[400px] bg-gray-100 mb-6">
              {selectedImg && (
                <div
                  className="w-full h-full bg-no-repeat bg-contain bg-center"
                  style={{
                    backgroundImage: `url(${selectedImg})`,
                    backgroundSize: "200%",
                    backgroundPosition: `${hoverPos.x}% ${hoverPos.y}%`,
                  }}
                />
              )}
            </div>
          </div>

          {/* Product Info - Two Columns */}
          <div
            className={`transition-opacity duration-300 ${
              !isHovering ? "opacity-100" : "opacity-0"
            }`}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Product Details */}
              <div className="space-y-5">
                {/* Title */}
                <h2 className="text-2xl font-bold text-teal-900">
                  {product.name}
                </h2>

                {/* Ratings */}
                <div className="flex items-center gap-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                  <span className="text-sm text-gray-600">339 Ratings</span>
                </div>

                {/* Brand */}
                <p className="text-sm">
                  Brand:{" "}
                  <span className="text-teal-700 hover:underline cursor-pointer">
                    No Brand
                  </span>
                </p>

                {/* Price */}
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-semibold text-teal-900">
                    ৳{product.variants?.[0]?.price || 0}
                  </span>
                  <span className="line-through text-gray-500">৳324</span>
                  <span className="text-sm text-white bg-teal-900 px-2 py-1 rounded">
                    -44%
                  </span>
                </div>

                {/* Promotions */}
                <div className="bg-orange-100 text-orange-700 px-3 py-2 rounded text-sm inline-block">
                  Min. spend ৳600
                </div>

                {/* Color Family */}
                {product.variants?.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Color family</h4>
                    <button className="border-2 border-teal-900 rounded p-1">
                      <ProductImage
                        src={productImages[0] || "/placeholder-product.jpg"}
                        alt="Product color"
                        width={40}
                        height={40}
                        className="object-contain"
                      />
                    </button>
                  </div>
                )}

                {/* Quantity */}
                <div>
                  <h4 className="font-semibold text-sm mb-2">Quantity</h4>
                  <div className="flex items-center gap-3 border rounded-lg w-fit">
                    <button
                      className="px-3 py-2 hover:bg-gray-100 rounded-l-lg disabled:opacity-50"
                      onClick={decreaseQuantity}
                      disabled={quantity <= 1}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="px-4 py-2 border-x">{quantity}</span>
                    <button
                      className="px-3 py-2 hover:bg-gray-100 rounded-r-lg"
                      onClick={increaseQuantity}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Buy Now / Add to Cart */}
                <div className="flex gap-3 pt-2">
                  <Button 
                    onClick={handleBuyNow}
                    disabled={isAddingToCart}
                    className="bg-teal-900 hover:bg-teal-800 text-white flex-1 py-3"
                  >
                    {isAddingToCart ? "Processing..." : "Buy Now"}
                  </Button>
                  <Button
                    onClick={handleAddToCart}
                    disabled={isAddingToCart}
                    variant="outline"
                    className="border-teal-900 text-teal-900 hover:bg-teal-50 flex-1 py-3"
                  >
                    {isAddingToCart ? "Adding..." : "Add to Cart"}
                  </Button>
                </div>

                {/* Wishlist Button */}
                <Button
                  onClick={handleWishlistToggle}
                  disabled={isWishlistLoading}
                  variant="outline"
                  className="w-full border-teal-900 text-teal-900 hover:bg-pink-50 hover:border-pink-500 hover:text-pink-600"
                >
                  <Heart 
                    className={`w-4 h-4 mr-2 ${isInWishlist ? "fill-pink-600 text-pink-600" : ""}`}
                  />
                  {isWishlistLoading 
                    ? "Processing..." 
                    : isInWishlist 
                      ? "Remove from Wishlist" 
                      : "Add to Wishlist"
                  }
                </Button>
              </div>

              {/* Right Column - Shipping & Seller Info */}
              <div className="space-y-5">
                {/* Seller Information */}
                <div className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">Sold by</h3>
                    <div className="flex items-center gap-1 text-teal-700">
                      <ShieldCheck className="w-4 h-4" />
                      <span className="text-sm">Verified Seller</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700">
                    {product.vendor?.storeName || "Unknown Seller"}
                  </p>
                  <div className="flex gap-2 pt-2">
                    {product.vendor && (
                      <VendorChatButton
                        vendorId={product.vendor.id}
                        vendorName={product.vendor.storeName}
                        vendorAvatar={product.vendor.avatar}
                        productId={product.id}
                        productName={product.name}
                      />
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1 text-xs"
                    >
                      <Store className="w-4 h-4" />
                      Visit Store
                    </Button>
                  </div>
                </div>

                {/* QR Code */}
                <div className="border rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Scan to view</h3>
                    <p className="text-xs text-gray-600">
                      Use your phone camera to scan QR code
                    </p>
                  </div>
                  <div className="bg-white p-2 border rounded">
                    <QrCode className="w-12 h-12 text-teal-900" />
                  </div>
                </div>

                {/* Return & Warranty */}
                <div className="border rounded-lg p-4 space-y-3">
                  <h3 className="font-semibold text-lg">Return & Warranty</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <RotateCcw className="w-4 h-4 flex-shrink-0" />
                    <span>7 Day Return</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                    <span>Warranty not available</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Details Tabs Section */}
      <section className="md:max-w-7xl mx-auto px-4 py-8">
        {/* Tabs Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex flex-wrap sm:flex-nowrap gap-1 sm:gap-2 w-full overflow-x-auto">
            <button
              onClick={() => setActiveTab(TabType.DESCRIPTION)}
              className={`px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium rounded-t-lg transition-colors duration-200 flex items-center gap-1.5 sm:gap-2 whitespace-nowrap flex-shrink-0 ${
                activeTab === TabType.DESCRIPTION
                  ? "bg-white border border-b-0 border-gray-200 text-teal-900"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">Description</span>
              <span className="xs:hidden">Desc</span>
            </button>
            
            <button
              onClick={() => setActiveTab(TabType.SPECIFICATIONS)}
              className={`px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium rounded-t-lg transition-colors duration-200 flex items-center gap-1.5 sm:gap-2 whitespace-nowrap flex-shrink-0 ${
                activeTab === TabType.SPECIFICATIONS
                  ? "bg-white border border-b-0 border-gray-200 text-teal-900"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">Specifications</span>
              <span className="xs:hidden">Specs</span>
            </button>
            
            <button
              onClick={() => setActiveTab(TabType.REVIEWS)}
              className={`px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium rounded-t-lg transition-colors duration-200 flex items-center gap-1.5 sm:gap-2 whitespace-nowrap flex-shrink-0 ${
                activeTab === TabType.REVIEWS
                  ? "bg-white border border-b-0 border-gray-200 text-teal-900"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Reviews (339)</span>
              <span className="sm:hidden">Reviews</span>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {renderTabContent()}
      </section>

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        message="Please login to add items to your cart"
      />
    </div>
  );
};

export default SingleProduct;