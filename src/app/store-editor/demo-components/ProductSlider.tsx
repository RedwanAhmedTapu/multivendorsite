import React, { useRef } from 'react';
import { Star, ChevronLeft, ChevronRight } from "lucide-react";

export const ProductSlider = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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
    },
    { 
      name: "Smart Watch", 
      price: "$79.00",
      originalPrice: "$99.00",
      rating: 4.9,
      reviews: 89,
      discount: "20%",
      image: "https://cdn.pixabay.com/photo/2017/08/06/12/06/people-2591874_1280.jpg"
    },
    { 
      name: "Backpack", 
      price: "$39.00",
      originalPrice: "$55.00",
      rating: 4.2,
      reviews: 55,
      discount: "29%",
      image: "https://cdn.pixabay.com/photo/2015/09/09/19/56/office-932926_1280.jpg"
    }
  ];

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300;
      const newScrollLeft = scrollContainerRef.current.scrollLeft + 
        (direction === 'left' ? -scrollAmount : scrollAmount);
      
      scrollContainerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="w-full bg-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-bold text-2xl text-gray-800">Trending Now</h3>
          <p className="text-gray-600 mt-1">Discover hot products</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="text-blue-600 text-sm font-semibold hover:text-blue-700 transition-colors flex items-center gap-1">
            View All
            <span className="text-lg">→</span>
          </button>
        </div>
      </div>

      {/* Slider Container */}
      <div className="relative">
        {/* Navigation Arrows */}
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-4 bg-white border border-gray-300 rounded-full p-3 shadow-lg hover:bg-gray-50 transition-all duration-300 z-10 hover:scale-110"
        >
          <ChevronLeft size={20} className="text-gray-700" />
        </button>
        
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-4 bg-white border border-gray-300 rounded-full p-3 shadow-lg hover:bg-gray-50 transition-all duration-300 z-10 hover:scale-110"
        >
          <ChevronRight size={20} className="text-gray-700" />
        </button>

        {/* Horizontal Scroll Container */}
        <div 
          ref={scrollContainerRef}
          className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth py-4 px-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {products.map((product, index) => (
            <div 
              key={index} 
              className="flex-shrink-0 w-64 group bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer hover:border-gray-300"
            >
              {/* Product Image */}
              <div className="relative w-full h-40 bg-gray-100 overflow-hidden">
                <img 
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                
                {/* Discount Badge */}
                <div className="absolute top-3 left-3 bg-red-500 text-white text-xs px-2 py-1 rounded font-bold">
                  {product.discount} OFF
                </div>
              </div>
              
              {/* Product Info */}
              <div className="p-4">
                {/* Product Name */}
                <h4 className="text-sm font-semibold text-gray-800 mb-2 line-clamp-2 leading-tight">
                  {product.name}
                </h4>
                
                {/* Rating */}
                <div className="flex items-center gap-1 mb-3">
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        size={12} 
                        className={`${
                          i < Math.floor(product.rating) 
                            ? 'text-yellow-400 fill-yellow-400' 
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-gray-500 ml-1">({product.reviews})</span>
                </div>

                {/* Price */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-red-500 font-bold text-base">{product.price}</span>
                    <span className="text-sm text-gray-400 line-through">{product.originalPrice}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};