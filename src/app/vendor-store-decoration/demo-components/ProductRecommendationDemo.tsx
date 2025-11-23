import React from 'react';
import { Star } from "lucide-react";

export const ProductRecommendationDemo = () => {
  const products = [
    { 
      name: "Wireless Earbuds", 
      price: "$24.00",
      originalPrice: "$32.00",
      rating: 4.5,
      reviews: 98,
      discount: "25%",
      image: "https://cdn.pixabay.com/photo/2016/11/29/12/30/phone-1869510_1280.jpg"
    },
    { 
      name: "Digital Camera", 
      price: "$89.00",
      originalPrice: "$120.00",
      rating: 4.3,
      reviews: 87,
      discount: "26%",
      image: "https://cdn.pixabay.com/photo/2016/03/02/20/13/camera-1232617_1280.jpg"
    },
    { 
      name: "Running Shoes", 
      price: "$45.00",
      originalPrice: "$65.00",
      rating: 4.8,
      reviews: 76,
      discount: "31%",
      image: "https://cdn.pixabay.com/photo/2016/11/19/18/06/feet-1840619_1280.jpg"
    },
    { 
      name: "Tablet Pro", 
      price: "$199.00",
      originalPrice: "$249.00",
      rating: 4.6,
      reviews: 92,
      discount: "20%",
      image: "https://cdn.pixabay.com/photo/2015/05/31/13/45/tablet-791179_1280.jpg"
    },
    { 
      name: "Fashion Dress", 
      price: "$35.00",
      originalPrice: "$50.00",
      rating: 4.7,
      reviews: 65,
      discount: "30%",
      image: "https://cdn.pixabay.com/photo/2017/08/01/11/48/woman-2564660_1280.jpg"
    },
    { 
      name: "Casual Shirt", 
      price: "$28.00",
      originalPrice: "$40.00",
      rating: 4.4,
      reviews: 71,
      discount: "30%",
      image: "https://cdn.pixabay.com/photo/2016/11/29/09/10/man-1868730_1280.jpg"
    }
  ];

  return (
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

      {/* Compact Products Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {products.map((product, index) => (
          <div 
            key={index} 
            className="group bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-all duration-300 cursor-pointer"
          >
            {/* Product Image */}
            <div className="relative w-full h-24 bg-gray-100 overflow-hidden">
              <img 
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              {/* Discount Badge */}
              <div className="absolute top-1 left-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded font-bold">
                {product.discount}
              </div>
            </div>
            
            {/* Product Info */}
            <div className="p-2">
              {/* Product Name */}
              <h4 className="text-xs text-gray-800 font-medium mb-1 line-clamp-2 leading-tight min-h-[2rem]">
                {product.name}
              </h4>
              
              {/* Rating */}
              <div className="flex items-center gap-1 mb-1">
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
                <span className="text-[10px] text-gray-500">({product.reviews})</span>
              </div>

              {/* Price */}
              <div className="flex items-center justify-between">
                <span className="text-red-500 font-bold text-sm">{product.price}</span>
                <span className="text-[10px] text-gray-400 line-through">{product.originalPrice}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}