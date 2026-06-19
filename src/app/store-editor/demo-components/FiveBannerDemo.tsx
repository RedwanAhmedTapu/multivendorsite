import React from 'react';

export const FiveBannersDemo=() =>{
  const banners = [
    {
      image: "https://cdn.pixabay.com/photo/2016/11/29/12/30/phone-1869510_1280.jpg",
      title: "GADGETS",
      subtitle: "Latest Tech"
    },
    {
      image: "https://cdn.pixabay.com/photo/2016/03/02/20/13/camera-1232617_1280.jpg",
      title: "HAPPY NEW YEAR",
      subtitle: "Special Offers"
    },
    {
      image: "https://cdn.pixabay.com/photo/2015/09/09/19/56/office-932926_1280.jpg",
      title: "WINTER TRAVEL",
      subtitle: "Exclusive Deals",
      large: true
    },
    {
      image: "https://cdn.pixabay.com/photo/2016/11/29/08/41/apple-1868496_1280.jpg",
      title: "NOW OR NEVER!",
      subtitle: "Limited Time"
    },
    {
      image: "https://cdn.pixabay.com/photo/2015/05/31/13/45/tablet-791179_1280.jpg",
      title: "SHOP NOW",
      subtitle: "Best Deals"
    }
  ];

  return (
    <div className="w-full bg-white p-3">
      <div className="flex gap-2 h-80">
        {/* Left Column - 2 Small Banners */}
        <div className="w-1/4 flex flex-col gap-2">
          {/* Top Left Banner */}
          <div className="flex-1 relative overflow-hidden rounded-lg group cursor-pointer">
            <img 
              src={banners[0].image} 
              alt={banners[0].title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
            <div className="absolute bottom-4 left-4 text-white z-10">
              <h4 className="text-lg font-bold mb-1">{banners[0].title}</h4>
              <p className="text-xs text-white/90">{banners[0].subtitle}</p>
            </div>
          </div>

          {/* Bottom Left Banner */}
          <div className="flex-1 relative overflow-hidden rounded-lg group cursor-pointer">
            <img 
              src={banners[1].image} 
              alt={banners[1].title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
            <div className="absolute bottom-4 left-4 text-white z-10">
              <h4 className="text-lg font-bold mb-1">{banners[1].title}</h4>
              <p className="text-xs text-white/90">{banners[1].subtitle}</p>
            </div>
          </div>
        </div>

        {/* Center - Large Banner */}
        <div className="w-1/2 relative overflow-hidden rounded-lg group cursor-pointer">
          <img 
            src={banners[2].image} 
            alt={banners[2].title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent"></div>
          <div className="absolute inset-0 flex items-center justify-center text-center text-white z-10">
            <div className="px-6">
              <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
                <div className="w-16 h-16 bg-white/30 rounded-full"></div>
              </div>
              <h3 className="text-4xl font-bold mb-3 drop-shadow-lg">{banners[2].title}</h3>
              <p className="text-xl text-white/90 drop-shadow-md">{banners[2].subtitle}</p>
            </div>
          </div>
        </div>

        {/* Right Column - 2 Small Banners */}
        <div className="w-1/4 flex flex-col gap-2">
          {/* Top Right Banner */}
          <div className="flex-1 relative overflow-hidden rounded-lg group cursor-pointer">
            <img 
              src={banners[3].image} 
              alt={banners[3].title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
            <div className="absolute bottom-4 left-4 text-white z-10">
              <h4 className="text-lg font-bold mb-1">{banners[3].title}</h4>
              <p className="text-xs text-white/90">{banners[3].subtitle}</p>
            </div>
          </div>

          {/* Bottom Right Banner */}
          <div className="flex-1 relative overflow-hidden rounded-lg group cursor-pointer">
            <img 
              src={banners[4].image} 
              alt={banners[4].title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
            <div className="absolute bottom-4 left-4 text-white z-10">
              <h4 className="text-lg font-bold mb-1">{banners[4].title}</h4>
              <p className="text-xs text-white/90">{banners[4].subtitle}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}