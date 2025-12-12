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

  if (isLoading) return <HomeSectionSkeleton />;
  if (isError)
    return <div className="text-center py-8">Failed to load slider</div>;

  return (
    <Container>
      <div className="grid grid-cols-1 lg:grid-cols-4 sm:gap-4">
        {/* Left Section - Hero Slider */}
        <div
          className="lg:col-span-3 relative rounded-sm overflow-hidden h-64 sm:h-72 md:h-80 lg:h-[22rem] "
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
              <div className="relative w-full h-full">
                <Image
                  src={slide.imageUrl}
                  alt={slide.title || "slider image"}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 75vw, 1200px"
                  priority={index === 0}
                  className="object-cover object-left lg:object-center"
                  quality={90}
                />
              </div>

              {/* Content Overlay */}
              <div className="absolute inset-0 flex items-center z-20 p-4 sm:p-6 md:p-8 lg:p-10 xl:p-12">
                <div className="max-w-lg text-white">
                  {slide.title && (
                    <p className="text-xs sm:text-sm font-semibold tracking-wider mb-2 md:mb-3 opacity-95 drop-shadow-lg">
                      {slide.title}
                    </p>
                  )}
                  {slide.subtitle && (
                    <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3 md:mb-4 lg:mb-5 leading-tight drop-shadow-lg">
                      {slide.subtitle}
                    </h1>
                  )}
                  {slide.description && (
                    <p className="text-sm sm:text-base md:text-lg mb-4 md:mb-6 lg:mb-8 opacity-95 leading-relaxed max-w-md lg:max-w-lg drop-shadow-lg">
                      {slide.description}
                    </p>
                  )}
                  {slide.buttonText && (
                    <button className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 sm:px-5 sm:py-2.5 md:px-6 md:py-3 rounded-lg font-semibold transition-colors duration-200 text-sm sm:text-base md:text-lg shadow-lg hover:shadow-xl">
                      {slide.buttonText}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Navigation Arrows */}
          <button
            onClick={prevSlide}
            aria-label="Previous Slide"
            className="hidden sm:block h-8 absolute  top-1/2 transform -translate-y-1/2 bg-teal-700 hover:bg-teal-500 text-white p-1  rounded-r-md shadow-2xl  backdrop-blur-sm transition-all duration-200 cursor-pointer z-20"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={nextSlide}
            aria-label="Next Slide"
            className="hidden h-8 sm:block absolute sm:right-0 top-1/2 transform -translate-y-1/2 bg-teal-700 hover:bg-teal-500 text-white p-1 rounded-l-md shadow-2xl backdrop-blur-sm transition-all duration-200 cursor-pointer z-20"
          >
            <ChevronRight size={24} />
          </button>

          {/* Dot Indicators */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-20">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-all duration-200 hover:scale-125 ${
                  index === currentSlide
                    ? "bg-white scale-125"
                    : "bg-white/60 hover:bg-white/80"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Right Section - Download App */}
        <div className="flex flex-col h-full bg-teal-50 rounded-sm">
          <div className="rounded-sm  h-full flex flex-col justify-center">
            <DownloadApp />
          </div>
        </div>
      </div>
    </Container>
  );
};

export default HeroSlider;
