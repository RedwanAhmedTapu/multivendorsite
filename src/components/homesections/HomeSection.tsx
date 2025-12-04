"use client";

import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useGetSlidersQuery } from "@/features/sliderApi";
import HomeSectionSkeleton from "../skeletons/HomeSectionSkeleton";
import DownloadApp from "../DownloadApp";
import { Container } from "../Container";

const HeroSlider = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);

  // Fetch sliders from API
  const { data: slides = [], isLoading, isError } = useGetSlidersQuery();

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlay || slides.length === 0) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlay, slides.length]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () =>
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  const goToSlide = (index: number) => setCurrentSlide(index);
  const handleMouseEnter = () => setIsAutoPlay(false);
  const handleMouseLeave = () => setIsAutoPlay(true);

  if (isLoading) return <HomeSectionSkeleton />; // Show skeleton
  if (isError)
    return <div className="text-center py-8">Failed to load slider</div>;

  return (
    <div className="w-full">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-x-10">
          {/* Left Section - Hero Slider */}
          <div
            className="lg:col-span-2 relative rounded-sm overflow-hidden h-80 sm:h-96 md:h-[22rem] lg:h-[25rem]"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {slides.map((slide, index) => (
              <div
                key={slide.id}
                className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                  index === currentSlide
                    ? "opacity-100 translate-x-0"
                    : index < currentSlide
                    ? "opacity-0 -translate-x-full"
                    : "opacity-0 translate-x-full"
                }`}
              >
                <Image
                  src={slide.imageUrl}
                  alt={slide.title || "image"}
                  fill
                  style={{ objectFit: "cover" }}
                  priority={index === 0} // first slide loads immediately
                  className="z-0"
                />
                <div className="absolute bg-transparent inset-0 flex items-center z-10 p-6 md:p-8 lg:p-12">
                  <div className="max-w-md text-gray-900">
                    <p className="text-xs sm:text-sm font-semibold tracking-wider mb-2 opacity-90">
                      {slide.title}
                    </p>
                    <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 leading-tight">
                      {slide.subtitle}
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
            ))}

            {/* Navigation Arrows */}
            <button
              onClick={prevSlide}
              aria-label="Previous Slide"
              className="hidden sm:block h-16 absolute  sm:left-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-gray-800 p-1  rounded-md shadow-2xl shadow-gray-950 transition-all duration-200 cursor-pointer z-20"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={nextSlide}
              aria-label="Next Slide"
              className="hidden h-16 sm:block absolute  sm:right-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-gray-800 p-1  rounded-md shadow-2xl shadow-gray-950 transition-all duration-200 cursor-pointer z-20"
            >
              <ChevronRight size={24} />
            </button>

            {/* Dot Indicators */}
            <div className="absolute bottom-4 sm:bottom-6 left-1/2 transform -translate-x-1/2 flex gap-2 z-20">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-200 ${
                    index === currentSlide
                      ? "bg-gray-900"
                      : "bg-white bg-opacity-50 hover:bg-opacity-75"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Right Section - Static Cards */}
          <div className="hidden lg:flex flex-col px-4 md:px-0 mt-4 lg:mt-0  ">
           <DownloadApp/>
          </div>
        </div>
        </Container>
      </div>
  );
};

export default HeroSlider;
