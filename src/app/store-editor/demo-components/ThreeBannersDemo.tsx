import React from 'react';
import { ShoppingBag, Gift, Star, ArrowRight } from "lucide-react";

export const ThreeBannersDemo=()=> {
  const banners = [
    {
      title: "New Arrivals",
      subtitle: "Fresh styles just landed in our latest collection",
      icon: ShoppingBag,
      image: "https://cdn.pixabay.com/photo/2016/11/19/18/06/feet-1840619_1280.jpg",
      stats: "50+ New Items"
    },
    {
      title: "Hot Deals",
      subtitle: "Limited time offers with amazing discounts",
      icon: Gift,
      image: "https://cdn.pixabay.com/photo/2017/08/01/11/48/woman-2564660_1280.jpg",
      stats: "Up to 60% Off"
    },
    {
      title: "Best Sellers",
      subtitle: "Customer favorites and top-rated products",
      icon: Star,
      image: "https://cdn.pixabay.com/photo/2016/11/29/09/10/man-1868730_1280.jpg",
      stats: "4.8★ Rating"
    }
  ];

  return (
    <div className="w-full bg-white p-3">
      <div className="flex gap-2 h-80">
        {/* Main Large Banner - Left Side */}
        <div className="w-1/2 relative overflow-hidden rounded-lg group cursor-pointer">
          <img 
            src={banners[0].image} 
            alt={banners[0].title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/20"></div>
          
          <div className="absolute inset-0 p-8 text-white flex flex-col justify-between z-10">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <ShoppingBag size={28} />
                </div>
                <span className="text-sm font-semibold bg-white/20 px-4 py-2 rounded-full backdrop-blur-sm">
                  {banners[0].stats}
                </span>
              </div>
              <h3 className="text-3xl font-bold mb-4 leading-tight">
                {banners[0].title}
              </h3>
              <p className="text-white/90 text-lg leading-relaxed">
                {banners[0].subtitle}
              </p>
            </div>
            <div className="flex items-center gap-3 text-lg font-semibold opacity-90 hover:opacity-100 transition-opacity group">
              <span>Shop Collection</span>
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>

        {/* Two Smaller Banners - Right Side */}
        <div className="w-1/2 flex flex-col gap-2">
          {/* Second Banner */}
          <div className="flex-1 relative overflow-hidden rounded-lg group cursor-pointer">
            <img 
              src={banners[1].image} 
              alt={banners[1].title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/20"></div>
            
            <div className="absolute inset-0 p-6 text-white flex flex-col justify-between z-10">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <Gift size={20} />
                  </div>
                  <span className="text-xs font-semibold bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                    {banners[1].stats}
                  </span>
                </div>
                <h4 className="text-xl font-bold mb-3">{banners[1].title}</h4>
                <p className="text-white/90 text-sm leading-relaxed">
                  {banners[1].subtitle}
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm font-semibold opacity-90 hover:opacity-100 transition-opacity group">
                <span>View Deals</span>
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>

          {/* Third Banner */}
          <div className="flex-1 relative overflow-hidden rounded-lg group cursor-pointer">
            <img 
              src={banners[2].image} 
              alt={banners[2].title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/20"></div>
            
            <div className="absolute inset-0 p-6 text-white flex flex-col justify-between z-10">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <Star size={20} />
                  </div>
                  <span className="text-xs font-semibold bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                    {banners[2].stats}
                  </span>
                </div>
                <h4 className="text-xl font-bold mb-3">{banners[2].title}</h4>
                <p className="text-white/90 text-sm leading-relaxed">
                  {banners[2].subtitle}
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm font-semibold opacity-90 hover:opacity-100 transition-opacity group">
                <span>See Top Picks</span>
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}