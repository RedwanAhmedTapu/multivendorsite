import React, { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { ComponentHandler } from "../ComponentHandler";

interface SliderProductProps {
  isActive?: boolean;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onCopy?: () => void;
  onDelete?: () => void;
  viewMode?: 'mobile' | 'desktop';
}

export const SliderProduct = ({
  isActive = false,
  onDragOver,
  onDrop,
  onMoveUp,
  onMoveDown,
  onCopy,
  onDelete,
  viewMode = 'mobile'
}: SliderProductProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const products = [
    { 
      name: "Lancome Advanced Genifique Youth Activating Serum", 
      price: "৳11,520", 
      originalPrice: "৳14,400",
      discount: "-20%",
      rating: 4.5,
      reviews: 2
    },
    { 
      name: "Estee Lauder Advanced Night Repair Serum", 
      price: "৳8,640", 
      originalPrice: "৳10,800",
      discount: "-20%",
      rating: 4.8,
      reviews: 15
    },
    { 
      name: "L'Oreal Paris Revitalift Hyaluronic Acid Serum", 
      price: "৳2,880", 
      originalPrice: "৳3,600",
      discount: "-20%",
      rating: 4.3,
      reviews: 8
    },
    { 
      name: "Olay Regenerist Micro-Sculpting Cream", 
      price: "৳4,320", 
      originalPrice: "৳5,400",
      discount: "-20%",
      rating: 4.6,
      reviews: 12
    },
    { 
      name: "Skincare Set Premium", 
      price: "৳6,500", 
      originalPrice: "৳8,000",
      discount: "-19%",
      rating: 4.7,
      reviews: 23
    },
    { 
      name: "Anti-Aging Cream", 
      price: "৳3,200", 
      originalPrice: "৳4,000",
      discount: "-20%",
      rating: 4.4,
      reviews: 7
    },
    { 
      name: "Vitamin C Brightening Serum", 
      price: "৳5,800", 
      originalPrice: "৳7,200",
      discount: "-19%",
      rating: 4.6,
      reviews: 18
    },
    { 
      name: "Hydrating Face Moisturizer", 
      price: "৳3,600", 
      originalPrice: "৳4,500",
      discount: "-20%",
      rating: 4.3,
      reviews: 11
    }
  ];

  // Always show 4 products per slide
  const itemsPerView = 4;
  const totalSlides = Math.ceil(products.length / itemsPerView);

  const scrollToIndex = (index: number) => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const scrollWidth = container.scrollWidth;
      const containerWidth = container.clientWidth;
      const scrollPosition = (scrollWidth / totalSlides) * index;
      
      container.scrollTo({
        left: scrollPosition,
        behavior: 'smooth'
      });
      setCurrentIndex(index);
    }
  };

  const nextSlide = () => {
    const nextIndex = (currentIndex + 1) % totalSlides;
    scrollToIndex(nextIndex);
  };

  const prevSlide = () => {
    const prevIndex = (currentIndex - 1 + totalSlides) % totalSlides;
    scrollToIndex(prevIndex);
  };

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const scrollPos = container.scrollLeft;
      const scrollWidth = container.scrollWidth;
      const newIndex = Math.round((scrollPos / scrollWidth) * totalSlides);
      setCurrentIndex(Math.min(newIndex, totalSlides - 1));
    }
  };

  // Mobile View Design - Show 2 products (since mobile screens are smaller)
  const renderMobileView = () => {
    const mobileItemsPerView = 2;
    const mobileTotalSlides = Math.ceil(products.length / mobileItemsPerView);
    
    return (
      <div className="w-full bg-white p-3">
        {/* Title */}
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-gray-900">Drag Module</h3>
        </div>

        {/* Carousel Container */}
        <div className="relative bg-white border border-gray-300 rounded-lg overflow-hidden">
          {/* Left Button */}
          <button 
            onClick={prevSlide}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white/90 hover:bg-white shadow-lg rounded-full flex items-center justify-center transition-all border border-gray-200"
          >
            <ChevronLeft className="w-4 h-4 text-gray-700" />
          </button>

          {/* Products Scroll Section */}
          <div 
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex gap-3 overflow-x-auto scrollbar-hide px-10 py-3 snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {/* Group products for mobile */}
            {Array.from({ length: mobileTotalSlides }).map((_, slideIndex) => (
              <div key={slideIndex} className="flex-shrink-0 w-full snap-start">
                <div className="grid grid-cols-2 gap-3 px-1">
                  {products.slice(slideIndex * mobileItemsPerView, slideIndex * mobileItemsPerView + mobileItemsPerView).map((product, productIndex) => (
                    <div key={productIndex} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      {/* Product Image */}
                      <div className="relative bg-gray-100 p-2">
                        <div className="w-full h-20 flex items-center justify-center">
                          <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                          </svg>
                        </div>
                        {/* Discount Badge */}
                        {product.discount && (
                          <div className="absolute top-1 left-1 bg-red-500 text-white text-[8px] font-bold px-1 py-0.5 rounded">
                            {product.discount}
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="p-2">
                        <h4 className="text-[10px] text-gray-800 mb-1 line-clamp-2 leading-tight h-8">
                          {product.name}
                        </h4>

                        {/* Rating */}
                        <div className="flex items-center gap-0.5 mb-1">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className={`w-2 h-2 ${
                                  i < Math.floor(product.rating) 
                                    ? 'fill-yellow-400 text-yellow-400' 
                                    : 'fill-gray-200 text-gray-200'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-[8px] text-gray-500">({product.reviews})</span>
                        </div>

                        {/* Prices */}
                        <div className="space-y-0.5">
                          <div className="text-orange-600 font-bold text-xs">
                            {product.price}
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[8px] text-gray-400 line-through">
                              {product.originalPrice}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Right Button */}
          <button 
            onClick={nextSlide}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white/90 hover:bg-white shadow-lg rounded-full flex items-center justify-center transition-all border border-gray-200"
          >
            <ChevronRight className="w-4 h-4 text-gray-700" />
          </button>

          {/* Navigation Dots */}
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
            {Array.from({ length: mobileTotalSlides }).map((_, index) => (
              <button
                key={index}
                onClick={() => scrollToIndex(index)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  index === currentIndex ? 'bg-gray-700' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Desktop View Design - Show exactly 4 products per slide
  const renderDesktopView = () => {
    return (
      <div className="w-full bg-white p-6">
        {/* Carousel Container */}
        <div className="relative bg-white border border-gray-300 rounded-xl overflow-hidden">
          {/* Left Button */}
          <button 
            onClick={prevSlide}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/90 hover:bg-white shadow-lg rounded-full flex items-center justify-center transition-all border border-gray-200"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>

          {/* Products Scroll Section */}
          <div 
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex gap-4 overflow-x-auto scrollbar-hide px-12 py-4 snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {/* Group products in sets of 4 for desktop */}
            {Array.from({ length: totalSlides }).map((_, slideIndex) => (
              <div key={slideIndex} className="flex-shrink-0 w-full snap-start">
                <div className="grid grid-cols-4 gap-4 px-2">
                  {products.slice(slideIndex * itemsPerView, slideIndex * itemsPerView + itemsPerView).map((product, productIndex) => (
                    <div key={productIndex} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow h-full">
                      {/* Product Image */}
                      <div className="relative bg-gray-100 p-4">
                        <div className="w-full h-32 flex items-center justify-center">
                          <svg className="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                          </svg>
                        </div>
                        {/* Discount Badge */}
                        {product.discount && (
                          <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                            {product.discount}
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="p-3 border-t border-gray-100">
                        <h4 className="text-sm text-gray-800 mb-2 line-clamp-2 leading-tight h-12">
                          {product.name}
                        </h4>

                        {/* Rating */}
                        <div className="flex items-center gap-1 mb-2">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className={`w-3 h-3 ${
                                  i < Math.floor(product.rating) 
                                    ? 'fill-yellow-400 text-yellow-400' 
                                    : 'fill-gray-200 text-gray-200'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-gray-500">({product.reviews})</span>
                        </div>

                        {/* Prices */}
                        <div className="space-y-1">
                          <div className="text-orange-600 font-bold text-sm">
                            {product.price}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-gray-400 line-through">
                              {product.originalPrice}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Right Button */}
          <button 
            onClick={nextSlide}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/90 hover:bg-white shadow-lg rounded-full flex items-center justify-center transition-all border border-gray-200"
          >
            <ChevronRight className="w-5 h-5 text-gray-700" />
          </button>

          {/* Navigation Dots */}
          {totalSlides > 1 && (
            <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex gap-2">
              {Array.from({ length: totalSlides }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => scrollToIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentIndex ? 'bg-gray-700' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

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

// Add this CSS to hide scrollbars
const styles = `
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}