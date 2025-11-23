import React, { useState, useEffect } from 'react';

export const BannerCarouselDemo = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const banners = [
    {
      title: "Summer Sale",
      subtitle: "Up to 50% Off Everything",
      image: "https://cdn.pixabay.com/photo/2016/11/19/18/06/feet-1840619_1280.jpg"
    },
    {
      title: "New Arrivals",
      subtitle: "Fresh styles just landed",
      image: "https://cdn.pixabay.com/photo/2017/08/01/11/48/woman-2564660_1280.jpg"
    },
    {
      title: "Best Deals",
      subtitle: "Limited time offers",
      image: "https://cdn.pixabay.com/photo/2016/11/29/09/10/man-1868730_1280.jpg"
    }
  ];

  // Auto-slide functionality
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 4000);
    
    return () => clearInterval(timer);
  }, [banners.length]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  return (
    <div className="w-full bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="relative h-96 overflow-hidden">
        {/* Slides */}
        <div 
          className="flex transition-transform duration-700 ease-out h-full"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {banners.map((banner, index) => (
            <div key={index} className="min-w-full h-full relative">
              <img 
                src={banner.image} 
                alt={banner.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent"></div>
              
              {/* Content */}
              <div className="absolute inset-0 flex items-center justify-center text-center text-white z-10">
                <div className="px-4">
                  <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
                    <div className="w-12 h-12 bg-white/30 rounded-full"></div>
                  </div>
                  <h3 className="text-4xl font-bold mb-4 drop-shadow-lg">{banner.title}</h3>
                  <p className="text-xl text-white/90 drop-shadow-md">{banner.subtitle}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination Dots */}
      <div className="flex justify-center gap-2 p-4 bg-gray-50">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-2 rounded-full transition-all duration-300 ${
              index === currentSlide ? "bg-blue-500 w-8" : "bg-gray-300 w-2 hover:bg-gray-400"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          ></button>
        ))}
      </div>
    </div>
  );
}