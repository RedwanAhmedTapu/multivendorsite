import React from 'react';

export const MultipleBannersDemo=() =>{
  const banners = [
    {
      image: "https://cdn.pixabay.com/photo/2016/11/29/12/30/phone-1869510_1280.jpg",
      title: "Smart Home",
      subtitle: "Control Your Life",
      badge: "NEW",
      bgColor: "from-green-600 to-green-700"
    },
    {
      image: "https://cdn.pixabay.com/photo/2016/03/02/20/13/camera-1232617_1280.jpg",
      title: "Top Cameras",
      subtitle: "Capture Moments",
      badge: "HOT",
      bgColor: "from-blue-600 to-blue-700"
    },
    {
      image: "https://cdn.pixabay.com/photo/2017/08/06/12/06/people-2591874_1280.jpg",
      title: "Fashion Week",
      subtitle: "Latest Trends",
      badge: "SALE",
      bgColor: "from-purple-600 to-purple-700"
    },
    {
      image: "https://cdn.pixabay.com/photo/2015/05/31/13/45/tablet-791179_1280.jpg",
      title: "Tech Deals",
      subtitle: "Best Prices",
      badge: "50%",
      bgColor: "from-cyan-600 to-cyan-700"
    }
  ];

  return (
    <div className="w-full bg-white p-3">
      <div className="flex gap-3">
        {banners.map((banner, index) => (
          <div 
            key={index} 
            className="flex-1 relative rounded-lg overflow-hidden shadow-lg group cursor-pointer h-32"
          >
            {/* Background Image */}
            <img 
              src={banner.image} 
              alt={banner.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            
            {/* Gradient Overlay */}
            <div className={`absolute inset-0 bg-gradient-to-br ${banner.bgColor} opacity-80`}></div>

            {/* Content */}
            <div className="absolute inset-0 p-4 flex flex-col justify-between text-white z-10">
              <div>
                <h3 className="text-lg font-bold mb-1">{banner.title}</h3>
                <p className="text-xs opacity-90">{banner.subtitle}</p>
              </div>

              {/* Badge */}
              <div className="self-start">
                <span className="bg-yellow-400 text-black text-xs font-bold px-3 py-1 rounded-full">
                  {banner.badge}
                </span>
              </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute top-2 right-2 w-12 h-12 bg-white/10 rounded-full blur-xl"></div>
            <div className="absolute bottom-2 left-2 w-8 h-8 bg-white/10 rounded-full blur-lg"></div>
          </div>
        ))}
      </div>
    </div>
  );
}