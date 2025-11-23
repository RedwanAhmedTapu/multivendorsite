import React from 'react';
import { Star, Heart, ShoppingCart } from "lucide-react";

export const ThreeColumnsProductsDemo=() =>{
  const products = [
    { 
      name: "Wireless Earbuds", 
      price: "$79.99", 
      rating: 4.8, 
      image: "https://cdn.pixabay.com/photo/2016/11/29/12/30/phone-1869510_1280.jpg"
    },
    { 
      name: "Smart Watch", 
      price: "$199.99", 
      rating: 4.6, 
      image: "https://cdn.pixabay.com/photo/2016/03/02/20/13/camera-1232617_1280.jpg"
    },
    { 
      name: "Phone Case", 
      price: "$24.99", 
      rating: 4.4, 
      image: "https://cdn.pixabay.com/photo/2016/11/19/18/06/feet-1840619_1280.jpg"
    },
    { 
      name: "Tablet Stand", 
      price: "$34.99", 
      rating: 4.7, 
      image: "https://cdn.pixabay.com/photo/2015/05/31/13/45/tablet-791179_1280.jpg"
    },
    { 
      name: "Camera Lens", 
      price: "$149.99", 
      rating: 4.9, 
      image: "https://cdn.pixabay.com/photo/2017/08/01/11/48/woman-2564660_1280.jpg"
    },
    { 
      name: "USB Cable", 
      price: "$14.99", 
      rating: 4.3, 
      image: "https://cdn.pixabay.com/photo/2016/11/29/09/10/man-1868730_1280.jpg"
    }
  ];

  return (
    <div className="w-full bg-white rounded-xl shadow-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg text-gray-800">Best Sellers</h3>
        <button className="text-blue-500 text-sm font-semibold hover:text-blue-600 transition-colors">
          See All →
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {products.map((product, index) => (
          <div key={index} className="group relative bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all">
            {/* Wishlist Button */}
            <button className="absolute top-2 right-2 w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-10">
              <Heart size={16} className="text-gray-600 hover:text-red-500 transition-colors" />
            </button>

            {/* Product Image */}
            <div className="w-full h-48 overflow-hidden bg-gray-100">
              <img 
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            </div>

            {/* Product Info */}
            <div className="p-3">
              <h4 className="font-semibold text-sm text-gray-800 mb-2 line-clamp-2 leading-tight h-10">
                {product.name}
              </h4>

              {/* Rating */}
              <div className="flex items-center gap-1 mb-2">
                <Star size={14} className="text-yellow-400 fill-yellow-400" />
                <span className="text-sm text-gray-600 font-medium">{product.rating}</span>
              </div>

              {/* Price & Cart */}
              <div className="flex items-center justify-between">
                <span className="text-red-500 font-bold text-lg">{product.price}</span>
                <button className="w-9 h-9 bg-blue-500 hover:bg-blue-600 rounded-lg flex items-center justify-center transition-colors shadow-sm">
                  <ShoppingCart size={16} className="text-white" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}