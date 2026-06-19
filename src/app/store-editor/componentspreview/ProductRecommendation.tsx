import React from 'react';
import { Star } from "lucide-react";
import { ComponentHandler } from "../ComponentHandler";

interface ProductRecommendationProps {
  isActive?: boolean;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onCopy?: () => void;
  onDelete?: () => void;
  viewMode?: 'mobile' | 'desktop';
}

export const ProductRecommendation = ({
  isActive = false,
  onDragOver,
  onDrop,
  onMoveUp,
  onMoveDown,
  onCopy,
  onDelete,
  viewMode = 'mobile'
}: ProductRecommendationProps) => {
  const products = [
    { 
      name: "Wireless Earbuds", 
      price: "$24.00",
      originalPrice: "$32.00",
      rating: 4.5,
      reviews: 98,
      discount: "25%"
    },
    { 
      name: "Digital Camera", 
      price: "$89.00",
      originalPrice: "$120.00",
      rating: 4.3,
      reviews: 87,
      discount: "26%"
    },
    { 
      name: "Running Shoes", 
      price: "$45.00",
      originalPrice: "$65.00",
      rating: 4.8,
      reviews: 76,
      discount: "31%"
    },
    { 
      name: "Tablet Pro", 
      price: "$199.00",
      originalPrice: "$249.00",
      rating: 4.6,
      reviews: 92,
      discount: "20%"
    },
    { 
      name: "Fashion Dress", 
      price: "$35.00",
      originalPrice: "$50.00",
      rating: 4.7,
      reviews: 65,
      discount: "30%"
    },
    { 
      name: "Casual Shirt", 
      price: "$28.00",
      originalPrice: "$40.00",
      rating: 4.4,
      reviews: 71,
      discount: "30%"
    }
  ];

  // Mobile View Design
  const renderMobileView = () => (
    <div className="w-full bg-white p-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-bold text-sm text-gray-800">Recommended For You</h3>
        </div>
        <button className="text-blue-600 text-xs font-semibold hover:text-blue-700 transition-colors">
          View All →
        </button>
      </div>

      {/* Compact Products Grid */}
      <div className="grid grid-cols-3 gap-2">
        {products.map((product, index) => (
          <div 
            key={index} 
            className="group bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-all duration-300 cursor-pointer"
          >
            {/* Product Image */}
            <div className="relative w-full h-20 bg-gray-100 overflow-hidden flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
              {/* Discount Badge */}
              <div className="absolute top-1 left-1 bg-red-500 text-white text-[8px] px-1 py-0.5 rounded font-bold">
                {product.discount}
              </div>
            </div>
            
            {/* Product Info */}
            <div className="p-1.5">
              {/* Product Name */}
              <h4 className="text-[10px] text-gray-800 font-medium mb-1 line-clamp-2 leading-tight min-h-[2rem]">
                {product.name}
              </h4>
              
              {/* Rating */}
              <div className="flex items-center gap-0.5 mb-1">
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      size={8} 
                      className={`${
                        i < Math.floor(product.rating) 
                          ? 'text-yellow-400 fill-yellow-400' 
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-[8px] text-gray-500">({product.reviews})</span>
              </div>

              {/* Price */}
              <div className="flex items-center justify-between">
                <span className="text-red-500 font-bold text-xs">{product.price}</span>
                <span className="text-[8px] text-gray-400 line-through">{product.originalPrice}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Desktop View Design with reduced gaps
  const renderDesktopView = () => (
    <div className="w-full bg-white p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-lg text-gray-800">Recommended For You</h3>
        </div>
        <button className="text-blue-600 text-sm font-semibold hover:text-blue-700 transition-colors">
          View All →
        </button>
      </div>

      {/* Products Grid with reduced gap */}
      <div className="grid grid-cols-6 gap-2">
        {products.map((product, index) => (
          <div 
            key={index} 
            className="group bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-all duration-300 cursor-pointer"
          >
            {/* Product Image */}
            <div className="relative w-full h-28 bg-gray-100 overflow-hidden flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
              {/* Discount Badge */}
              <div className="absolute top-1.5 left-1.5 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded font-bold">
                {product.discount}
              </div>
            </div>
            
            {/* Product Info */}
            <div className="p-2">
              {/* Product Name */}
              <h4 className="text-xs text-gray-800 font-medium mb-1.5 line-clamp-2 leading-tight min-h-[2.5rem]">
                {product.name}
              </h4>
              
              {/* Rating */}
              <div className="flex items-center gap-1 mb-1.5">
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      size={10} 
                      className={`${
                        i < Math.floor(product.rating) 
                          ? 'text-yellow-400 fill-yellow-400' 
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs text-gray-500">({product.reviews})</span>
              </div>

              {/* Price */}
              <div className="flex items-center justify-between">
                <span className="text-red-500 font-bold text-sm">{product.price}</span>
                <span className="text-xs text-gray-400 line-through">{product.originalPrice}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div
      className={`relative ${
        isActive ? "ring-2 ring-blue-500 ring-offset-2" : ""
      } rounded-lg transition-all duration-200`}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {viewMode === 'mobile' ? renderMobileView() : renderDesktopView()}

      {isActive && (
        <ComponentHandler
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
          onCopy={onCopy}
          onDelete={onDelete}
        />
      )}
    </div>
  );
};