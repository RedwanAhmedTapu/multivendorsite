import React from 'react';

export const SmartCategoryDemo=()=> {
  const categories = [
    {
      image: "https://cdn.pixabay.com/photo/2016/11/29/12/30/phone-1869510_1280.jpg",
      name: "Electronics"
    },
    {
      image: "https://cdn.pixabay.com/photo/2016/11/19/18/06/feet-1840619_1280.jpg",
      name: "Fashion"
    },
    {
      image: "https://cdn.pixabay.com/photo/2017/08/01/11/48/woman-2564660_1280.jpg",
      name: "Beauty"
    },
    {
      image: "https://cdn.pixabay.com/photo/2016/11/29/09/10/man-1868730_1280.jpg",
      name: "Men Style"
    },
    {
      image: "https://cdn.pixabay.com/photo/2015/05/31/13/45/tablet-791179_1280.jpg",
      name: "Gadgets"
    },
    {
      image: "https://cdn.pixabay.com/photo/2016/03/02/20/13/camera-1232617_1280.jpg",
      name: "Cameras"
    },
    {
      image: "https://cdn.pixabay.com/photo/2017/08/06/12/06/people-2591874_1280.jpg",
      name: "Lifestyle"
    },
    {
      image: "https://cdn.pixabay.com/photo/2015/09/09/19/56/office-932926_1280.jpg",
      name: "Office"
    }
  ];

  return (
    <div className="w-full bg-white p-3">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-lg text-gray-800">Shop by Category</h3>
          <p className="text-sm text-gray-600">Browse our wide range of products</p>
        </div>
        <button className="text-blue-500 text-sm font-semibold hover:text-blue-600 transition-colors">
          View All →
        </button>
      </div>

      {/* Scrollable Container - Hidden Scrollbar */}
      <div 
        className="flex gap-6 overflow-x-auto pb-2"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        <style jsx>{`
          div::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        
        {categories.map((category, index) => (
          <div
            key={index}
            className="flex-shrink-0 flex flex-col items-center cursor-pointer group"
          >
            {/* Circular Image */}
            <div className="w-24 h-24 rounded-full overflow-hidden shadow-lg hover:shadow-xl transition-all border-4 border-gray-100 group-hover:border-blue-400">
              <img 
                src={category.image}
                alt={category.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            </div>
            
            {/* Category Name */}
            <h4 className="mt-3 text-sm font-semibold text-gray-800 text-center group-hover:text-blue-500 transition-colors">
              {category.name}
            </h4>
          </div>
        ))}
      </div>
    </div>
  );
}