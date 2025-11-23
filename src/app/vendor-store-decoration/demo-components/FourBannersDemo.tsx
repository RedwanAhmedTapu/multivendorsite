import React from 'react';

export const FourBannersDemo=()=> {
  const banners = [
    {
      image: "https://cdn.pixabay.com/photo/2016/11/19/18/06/feet-1840619_1280.jpg",
      title: "FASHION",
      subtitle: "New Collection"
    },
    {
      image: "https://cdn.pixabay.com/photo/2017/08/01/11/48/woman-2564660_1280.jpg",
      title: "KIDS SALE",
      subtitle: "Up to 50% Off"
    },
    {
      image: "https://cdn.pixabay.com/photo/2016/11/29/09/10/man-1868730_1280.jpg",
      title: "Men Brands",
      subtitle: "Top Picks"
    },
    {
      image: "https://cdn.pixabay.com/photo/2017/08/06/12/06/people-2591874_1280.jpg",
      title: "WOMEN FASHION",
      subtitle: "Latest Trends"
    }
  ];

  return (
    <div className="w-full bg-white p-3">
      <div className="flex gap-2 h-64">
        {/* Large Left Banner */}
        <div className="w-1/2 relative overflow-hidden rounded-lg cursor-pointer group">
          <img 
            src={banners[0].image} 
            alt={banners[0].title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent"></div>
          <div className="absolute bottom-6 left-6 text-white">
            <h2 className="text-4xl font-bold tracking-wider mb-1">{banners[0].title}</h2>
            <p className="text-sm opacity-90">{banners[0].subtitle}</p>
          </div>
        </div>

        {/* Right Grid - 3 Banners */}
        <div className="w-1/2 grid grid-cols-2 gap-2">
          {/* Top Right Banner - spans 2 columns */}
          <div className="col-span-2 relative overflow-hidden rounded-lg cursor-pointer group">
            <img 
              src={banners[1].image} 
              alt={banners[1].title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white text-center">
              <h3 className="text-2xl font-bold tracking-wide">{banners[1].title}</h3>
              <p className="text-xs mt-1">{banners[1].subtitle}</p>
            </div>
          </div>

          {/* Bottom Left Banner */}
          <div className="relative overflow-hidden rounded-lg cursor-pointer group">
            <img 
              src={banners[2].image} 
              alt={banners[2].title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/30"></div>
            <div className="absolute bottom-3 left-3 text-white">
              <h4 className="text-lg font-bold">{banners[2].title}</h4>
              <p className="text-xs opacity-90">{banners[2].subtitle}</p>
            </div>
          </div>

          {/* Bottom Right Banner */}
          <div className="relative overflow-hidden rounded-lg cursor-pointer group">
            <img 
              src={banners[3].image} 
              alt={banners[3].title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/30"></div>
            <div className="absolute bottom-3 left-3 text-white">
              <h4 className="text-lg font-bold">{banners[3].title}</h4>
              <p className="text-xs opacity-90">{banners[3].subtitle}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}