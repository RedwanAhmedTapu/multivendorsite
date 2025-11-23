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
  ArrowLeft
} from "lucide-react";
import MoreInfoProduct from "@/components/product/moreinfoproduct/MoreInfoProduct";
import { useGetProductByIdQuery } from "@/features/productApi";
import { VendorChatButton } from "@/components/chatbox/VendorChatButton";
import DeliveryLocation from "@/components/deleiverylocation/DeliveryLocation";

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
  if (product?.variants?.[0]?.weight) {
    return product.variants[0].weight;
  }
  
  // Default weights based on category
  const defaultWeights: { [key: string]: number } = {
    'electronics': 1000,
    'clothing': 200,
    'books': 300,
    'home': 500,
    'default': 500,
  };
  
  return defaultWeights[product?.category?.toLowerCase()] || defaultWeights.default;
};

// Helper function to get product images
const getProductImages = (product: any): string[] => {
  const images: string[] = [];
  
  // Add main product images
  product?.images?.forEach((img: any) => {
    if (img.url) images.push(img.url);
  });
  
  // Add variant images
  product?.variants?.forEach((v: any) => {
    v.images?.forEach((img: any) => {
      if (img.url) images.push(img.url);
    });
  });
  
  return images.length > 0 ? images : ["/placeholder-product.jpg"];
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

  const productWeight = product ? calculateProductWeight(product) : 500;
  const productImages = product ? getProductImages(product) : [];

  useEffect(() => {
    if (productImages.length > 0) {
      setSelectedImg(productImages[0]);
    }
  }, [product, productImages]);

  const handleDeliveryCostCalculated = (cost: number | null) => {
    setDeliveryCost(cost);
  };

  const handleLocationSelected = (location: any) => {
    setSelectedLocation(location);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.pageX - left - window.scrollX) / width) * 100;
    const y = ((e.pageY - top - window.scrollY) / height) * 100;
    setHoverPos({ x, y });
  };

  const increaseQuantity = () => setQuantity(prev => prev + 1);
  const decreaseQuantity = () => setQuantity(prev => prev > 1 ? prev - 1 : 1);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading product...</div>
      </div>
    );
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
          <div className={`absolute inset-0 transition-opacity duration-300 ${isHovering ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
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
          <div className={`transition-opacity duration-300 ${!isHovering ? 'opacity-100' : 'opacity-0'}`}>
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
                    {product.vendor?.storeName || "No Brand"}
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
                  <div className="flex items-center gap-3">
                    <button 
                      className="px-3 py-1 border rounded hover:bg-gray-100"
                      onClick={decreaseQuantity}
                    >
                      -
                    </button>
                    <span>{quantity}</span>
                    <button 
                      className="px-3 py-1 border rounded hover:bg-gray-100"
                      onClick={increaseQuantity}
                    >
                      +
                    </button>
                    <span className="text-sm text-orange-600">Almost sold out, buy now!</span>
                  </div>
                </div>

                {/* Buy Now / Add to Cart */}
                <div className="flex gap-3 pt-2">
                  <Button className="bg-teal-900 hover:bg-teal-800 text-white flex-1 py-3">
                    Buy Now
                  </Button>
                  <Button
                    variant="outline"
                    className="border-teal-900 text-teal-900 hover:bg-teal-50 flex-1 py-3"
                  >
                    Add to Cart
                  </Button>
                </div>

               
              </div>

              {/* Right Column - Shipping & Seller Info */}
              <div className="space-y-5">
                {/* Delivery Options */}
                <div className="border rounded-lg p-4 space-y-3">
                    <div>
                      <DeliveryLocation 
                        productWeight={productWeight}
                        onDeliveryCostCalculated={handleDeliveryCostCalculated}
                        onLocationSelected={handleLocationSelected}
                      />
                     
                    </div>
                 
                </div>

                {/* Seller Information */}
                <div className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">Sold by</h3>
                    <div className="flex items-center gap-1 text-teal-700">
                      <ShieldCheck className="w-4 h-4" />
                      <span className="text-sm">Verified Seller</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700">{product.vendor?.storeName || "Unknown Seller"}</p>
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
                    <Button variant="outline" size="sm" className="flex items-center gap-1 text-xs">
                      <Store className="w-4 h-4" />
                      Visit Store
                    </Button>
                  </div>
                </div>

                {/* QR Code */}
                <div className="border rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Scan to view</h3>
                    <p className="text-xs text-gray-600">Use your phone camera to scan QR code</p>
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
     
      {/* Product Details Tabs */}
      <MoreInfoProduct product={product} />
    </div>
  );
};

export default SingleProduct;