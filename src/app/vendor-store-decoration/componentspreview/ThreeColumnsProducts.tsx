import React from 'react';
import { Star, Heart, ShoppingCart } from "lucide-react";
import { ComponentHandler } from "../ComponentHandler";

interface ThreeColumnsProductsProps {
  isActive?: boolean;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onCopy?: () => void;
  onDelete?: () => void;
  viewMode?: 'mobile' | 'desktop';
}

export const ThreeColumnsProducts = ({
  isActive = false,
  onDragOver,
  onDrop,
  onMoveUp,
  onMoveDown,
  onCopy,
  onDelete,
  viewMode = 'mobile'
}: ThreeColumnsProductsProps) => {
  const products = [
    { 
      name: "Wireless Earbuds", 
      price: "$79.99", 
      rating: 4.8
    },
    { 
      name: "Smart Watch", 
      price: "$199.99", 
      rating: 4.6
    },
    { 
      name: "Phone Case", 
      price: "$24.99", 
      rating: 4.4
    },
    { 
      name: "Tablet Stand", 
      price: "$34.99", 
      rating: 4.7
    },
    { 
      name: "Camera Lens", 
      price: "$149.99", 
      rating: 4.9
    },
    { 
      name: "USB Cable", 
      price: "$14.99", 
      rating: 4.3
    }
  ];

  // Mobile View Design - 2 columns
  const renderMobileView = () => (
    <div className="w-full bg-white rounded-lg shadow-md p-3">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-sm text-gray-800">Best Sellers</h3>
        <button className="text-blue-500 text-xs font-semibold hover:text-blue-600 transition-colors">
          See All →
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {products.map((product, index) => (
          <div key={index} className="group relative bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-all">
            {/* Wishlist Button */}
            <button className="absolute top-1.5 right-1.5 w-7 h-7 bg-white/90 hover:bg-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-10">
              <Heart size={14} className="text-gray-600 hover:text-red-500 transition-colors" />
            </button>

            {/* Product Image */}
            <div className="w-full h-32 overflow-hidden bg-gray-100 flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
            </div>

            {/* Product Info */}
            <div className="p-2">
              <h4 className="font-semibold text-xs text-gray-800 mb-1.5 line-clamp-2 leading-tight h-8">
                {product.name}
              </h4>

              {/* Rating */}
              <div className="flex items-center gap-1 mb-1.5">
                <Star size={12} className="text-yellow-400 fill-yellow-400" />
                <span className="text-xs text-gray-600 font-medium">{product.rating}</span>
              </div>

              {/* Price & Cart */}
              <div className="flex items-center justify-between">
                <span className="text-red-500 font-bold text-sm">{product.price}</span>
                <button className="w-7 h-7 bg-blue-500 hover:bg-blue-600 rounded-md flex items-center justify-center transition-colors shadow-sm">
                  <ShoppingCart size={12} className="text-white" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Desktop View Design - 3 columns
  const renderDesktopView = () => (
    <div className="w-full bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-xl text-gray-800">Best Sellers</h3>
        <button className="text-blue-500 text-sm font-semibold hover:text-blue-600 transition-colors">
          See All →
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {products.map((product, index) => (
          <div key={index} className="group relative bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-xl transition-all">
            {/* Wishlist Button */}
            <button className="absolute top-3 right-3 w-9 h-9 bg-white/90 hover:bg-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-10">
              <Heart size={18} className="text-gray-600 hover:text-red-500 transition-colors" />
            </button>

            {/* Product Image */}
            <div className="w-full h-56 overflow-hidden bg-gray-100 flex items-center justify-center">
              <svg className="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
            </div>

            {/* Product Info */}
            <div className="p-4">
              <h4 className="font-semibold text-base text-gray-800 mb-3 line-clamp-2 leading-tight h-12">
                {product.name}
              </h4>

              {/* Rating */}
              <div className="flex items-center gap-1 mb-3">
                <Star size={16} className="text-yellow-400 fill-yellow-400" />
                <span className="text-sm text-gray-600 font-medium">{product.rating}</span>
              </div>

              {/* Price & Cart */}
              <div className="flex items-center justify-between">
                <span className="text-red-500 font-bold text-lg">{product.price}</span>
                <button className="w-10 h-10 bg-blue-500 hover:bg-blue-600 rounded-lg flex items-center justify-center transition-colors shadow-md">
                  <ShoppingCart size={16} className="text-white" />
                </button>
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