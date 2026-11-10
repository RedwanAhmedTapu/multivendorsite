"use client";

import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useGetSlidersQuery } from "@/features/sliderApi";
import HomeSectionSkeleton from "../skeletons/HomeSectionSkeleton";
import DownloadApp from "../DownloadApp";
import { Container } from "../Container";

const HeroSlider = () => {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);

  // Only the sliders an admin created for the homepage — vendor-page
  // slides live on that vendor's own /store/[vendorId] page instead.
  const { data: slides = [], isLoading, isError } = useGetSlidersQuery({ type: "HOMEPAGE" });

  // A slide either has an explicit buttonLink (set by admin, e.g. a
  // category or promo page) or is tagged with a vendorId (promoting a
  // specific vendor) — in that case it goes to that vendor's storefront.
  const getSlideHref = (slide: (typeof slides)[number]) =>
    slide.buttonLink || (slide.vendorId ? `/store/${slide.vendorId}` : null);

  const handleSlideClick = (slide: (typeof slides)[number]) => {
    const href = getSlideHref(slide);
    if (href) router.push(href);
  };

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
        className="lg:col-span-3 relative rounded-sm overflow-hidden aspect-video w-full max-h-[50vh]"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {slides.map((slide, index) => {
            const href = getSlideHref(slide);
            return (
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
              <div
                className={`relative w-full h-full ${href ? "cursor-pointer" : ""}`}
                onClick={() => handleSlideClick(slide)}
                role={href ? "link" : undefined}
                aria-label={href ? `Go to ${slide.title || "store"}` : undefined}
              >
                <Image
                  src={slide.imageUrl}
                  alt={slide.title || "slider image"}
                  fill
                  priority={index === 0}
                  className="absolute inset-0 w-full h-full object-cover"
                  quality={90}
                />
              </div>

              {/* Content Overlay */}
              <div className="absolute inset-0 flex items-center z-20 p-4 sm:p-6 md:p-8 lg:p-10 xl:p-12 pointer-events-none">
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
                    <button
                      onClick={() => handleSlideClick(slide)}
                      className="pointer-events-auto bg-primary hover:bg-primary-hover text-primary-foreground px-4 py-2 sm:px-5 sm:py-2.5 md:px-6 md:py-3 rounded-lg font-semibold transition-colors duration-200 text-sm sm:text-base md:text-lg shadow-lg hover:shadow-xl"
                    >
                      {slide.buttonText}
                    </button>
                  )}
                </div>
              </div>
            </div>
            );
          })}

          {/* Navigation Arrows */}
          <button
            onClick={prevSlide}
            aria-label="Previous Slide"
            className="hidden sm:block h-8 absolute  top-1/2 transform -translate-y-1/2 bg-primary-dark hover:bg-primary-hover text-primary-foreground p-1  rounded-r-md shadow-2xl  backdrop-blur-sm transition-all duration-200 cursor-pointer z-20"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={nextSlide}
            aria-label="Next Slide"
            className="hidden h-8 sm:block absolute sm:right-0 top-1/2 transform -translate-y-1/2 bg-primary-dark hover:bg-primary-hover text-primary-foreground p-1 rounded-l-md shadow-2xl backdrop-blur-sm transition-all duration-200 cursor-pointer z-20"
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
        <div className="flex flex-col h-full bg-primary-tint rounded-sm">
          <div className="rounded-sm  h-full flex flex-col justify-center">
            <DownloadApp />
          </div>
        </div>
      </div>
    </Container>
  );
};

export default HeroSlider;