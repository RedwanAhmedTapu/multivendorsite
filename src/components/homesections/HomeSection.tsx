"use client";
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const HeroSlider = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);

  const slides = [
    {
      category: "ELECTRONICS",
      title: "Spring Deals",
      description: "Spring into incredible deals on a selection of TVs, Smart screens, and so much more.",
      buttonText: "Shop Now",
      image: "/homesection/homev3-slider1.webp"
    },
    {
      category: "IMAC",
      title: "Macbook Air ",
      description: "Discover amazing offers on the latest smartphones, tablets, and mobile accessories.",
      buttonText: "Shop Now",
      image: "/homesection/homev3-slider2.webp"
    },
    {
      category: "Furniture",
      title: "Simple Living",
      description: "Explore our collection of stylish and functional furniture for every room in your home. ",
      buttonText: "Shop Now",
      image: "/homesection/homev3-slider3.webp"
    }
  ];

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlay) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlay, slides.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  const handleMouseEnter = () => {
    setIsAutoPlay(false);
  };

  const handleMouseLeave = () => {
    setIsAutoPlay(true);
  };

  return (
    <div className="w-full bg-gray-50">
      <div className="max-w-6xl xl:max-w-7xl 2xl:max-w-[90%] mx-auto md:px-4 sm:px-6 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Left Section - Hero Slider */}
          <div 
            className="lg:col-span-2 relative rounded-sm overflow-hidden h-80 sm:h-96 md:h-[22rem] lg:h-[28rem]"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {/* Slider Content */}
            <div className="relative h-full">
              {slides.map((slide, index) => (
                <div
                  key={index}
                  className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                    index === currentSlide 
                      ? 'opacity-100 translate-x-0' 
                      : index < currentSlide 
                        ? 'opacity-0 -translate-x-full' 
                        : 'opacity-0 translate-x-full'
                  }`}
                  style={{
                    backgroundImage: `url(${slide.image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                >
                  <div className="flex h-full items-center">
                    {/* Content */}
                    <div className="flex flex-col justify-center p-6 md:p-8 lg:p-12 z-10 max-w-md">
                      <div className="text-gray-900">
                        <p className="text-xs sm:text-sm font-semibold tracking-wider mb-2 opacity-90">
                          {slide.category}
                        </p>
                        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 leading-tight">
                          {slide.title}
                        </h1>
                        <p className="text-sm sm:text-base md:text-lg mb-4 md:mb-8 opacity-90 leading-relaxed">
                          {slide.description}
                        </p>
                        <button className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2 sm:px-6 sm:py-2 md:px-8 md:py-3 rounded-lg font-semibold transition-colors duration-200 text-sm sm:text-base">
                          {slide.buttonText}
                        </button>
                      </div>
                    </div>
                  </div>
                  
                </div>
              ))}
            </div>

            {/* Navigation Arrows - Hidden on mobile */}
            <button
              onClick={prevSlide}
              className="hidden sm:block absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-gray-800 p-1 sm:p-2 rounded-full transition-all duration-200 z-20"
            >
              <ChevronLeft size={18} className="sm:w-5 sm:h-5 md:w-6 md:h-6" />
            </button>
            <button
              onClick={nextSlide}
              className="hidden sm:block absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-gray-800 p-1 sm:p-2 rounded-full transition-all duration-200 z-20"
            >
              <ChevronRight size={18} className="sm:w-5 sm:h-5 md:w-6 md:h-6" />
            </button>

            {/* Dot Indicators */}
            <div className="absolute bottom-4 sm:bottom-6 left-1/2 transform -translate-x-1/2 flex gap-2 z-20">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-200 ${
                    index === currentSlide 
                      ? 'bg-gray-900' 
                      : 'bg-white bg-opacity-50 hover:bg-opacity-75'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Right Section - Static Cards */}
          <div className="flex flex-col px-4 md:px-0 mt-4 lg:mt-0 space-y-4 sm:space-y-6">
            {/* Stay Comfy Card */}
            <div className="bg-[#E8EDF6] rounded-sm p-4 sm:p-6 h-48 sm:h-56 md:h-60 lg:h-[13.5rem] relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('/homesection/homev3-Newarrivals.webp')] bg-cover bg-center"></div>
              <div className="flex h-full relative z-10">
                <div className="flex-1">
                  <p className="text-xs sm:text-sm font-semibold text-gray-900 tracking-wider mb-1">
                    NEW ARRIVALS
                  </p>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">
                    Stay Comfy
                  </h2>
                  <p className="text-gray-800 text-xs sm:text-sm mb-3 sm:mb-4 leading-relaxed">
                    A collection of premium organic pieces.
                  </p>
                  <button className="text-gray-800 font-semibold text-xs sm:text-sm border-b-2 border-teal-400 hover:border-teal-300 transition-colors duration-200">
                    Shop Now
                  </button>
                </div>
              </div>
            </div>

            {/* Smart Toothbrush Card */}
            <div className="bg-[#E8EDF6] rounded-sm p-4 sm:p-6 h-48 sm:h-56 md:h-60 lg:h-[13.5rem] relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('/homesection/homev3-featured.webp')] bg-cover bg-center"></div>
              <div className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-teal-500 text-white text-xs px-2 py-1 rounded-full font-semibold z-10">
                SALE
              </div>
              <div className="flex h-full relative z-10">
                <div className="flex-1">
                  <p className="text-xs sm:text-sm font-semibold text-gray-900 tracking-wider mb-1">
                    FEATURED
                  </p>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">
                    Smart Toothbrush
                  </h2>
                  <p className="text-gray-800 text-xs sm:text-sm mb-3 sm:mb-4 leading-relaxed">
                    A brush that knows you. an app that shows you.
                  </p>
                  <button className="text-gray-800 font-semibold text-xs sm:text-sm border-b-2 border-teal-400 hover:border-teal-300 transition-colors duration-200">
                    Shop Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSlider;