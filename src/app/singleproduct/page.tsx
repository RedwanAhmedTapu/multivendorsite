"use client";

import React, { useState } from "react";
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
  ShieldCheck
} from "lucide-react";
import MoreInfoProduct from "@/components/product/moreinfoproduct/MoreInfoProduct";

const productImages = [
  "/products/1-103.webp",
  "/products/1-9.webp",
  "/products/1-80.webp",
  "/products/1-103.webp",
  "/products/1-132.webp",
  "/products/1-143.webp",
  "/products/2-75.webp",
  "/products/3.webp",
];

const SingleProduct = () => {
  const [selectedImg, setSelectedImg] = useState(productImages[0]);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.pageX - left - window.scrollX) / width) * 100;
    const y = ((e.pageY - top - window.scrollY) / height) * 100;
    setHoverPos({ x, y });
  };

  const increaseQuantity = () => setQuantity(prev => prev + 1);
  const decreaseQuantity = () => setQuantity(prev => prev > 1 ? prev - 1 : 1);

  return (
    <>
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
          <Image
            src={selectedImg}
            alt="Product"
            fill
            className="object-contain"
          />
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
              <Image
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
            <div
              className="w-full h-full bg-no-repeat"
              style={{
                backgroundImage: `url(${selectedImg})`,
                backgroundSize: "200%",
                backgroundPosition: `${hoverPos.x}% ${hoverPos.y}%`,
              }}
            />
          </div>
        </div>

        {/* Product Info - Two Columns */}
        <div className={`transition-opacity duration-300 ${!isHovering ? 'opacity-100' : 'opacity-0'}`}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Product Details */}
            <div className="space-y-5">
              {/* Title */}
              <h2 className="text-2xl font-bold text-teal-900">
                Geepas Gp-007 Rechargeable LED Flashlight Torch Lamp - Charger Light
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
                <span className="text-2xl font-semibold text-teal-900">৳180</span>
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
              <div>
                <h4 className="font-semibold text-sm mb-2">Color family</h4>
                <button className="border-2 border-teal-900 rounded p-1">
                  <Image
                    src="/products/1-103.webp"
                    alt="Color Black"
                    width={40}
                    height={40}
                    className="object-contain"
                  />
                </button>
              </div>

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
                <h3 className="font-semibold text-lg">Delivery Options</h3>
                <div className="flex items-start gap-2 text-sm text-gray-700">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p>Dhaka, Faridpur, Engineering College</p>
                    <button className="text-teal-700 text-xs underline mt-1">Change</button>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Truck className="w-4 h-4 flex-shrink-0" />
                  <span>Standard Delivery ৳135 (2-3 days)</span>
                </div>
                <p className="text-sm text-gray-600 mt-2">Cash on Delivery Available</p>
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
                <p className="text-sm text-gray-700">ElectroHub Store</p>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex items-center gap-1 text-xs">
                    <MessageCircle className="w-4 h-4" />
                    Chat
                  </Button>
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
     <MoreInfoProduct/>
    </>
   
  );
};

export default SingleProduct;