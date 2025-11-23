import React from 'react';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';

export const ProductsCarouselDemo = () => {
  const bannerImage =
    "https://cdn.pixabay.com/photo/2015/08/18/11/32/seal-893797_1280.png"; 

  const products = [
    { 
      name: "Lancome Advanced Genifique Youth Activating Serum", 
      price: "৳11,520", 
      originalPrice: "৳14,400",
      discount: "-20%",
      rating: 4.5,
      reviews: 2,
      image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=200&h=200&fit=crop"
    },
    { 
      name: "Estee Lauder Advanced Night Repair Serum", 
      price: "৳8,640", 
      originalPrice: "৳10,800",
      discount: "-20%",
      rating: 4.8,
      reviews: 15,
      image: "https://images.unsplash.com/photo-1571875257727-256c39da42af?w=200&h=200&fit=crop"
    },
    { 
      name: "L'Oreal Paris Revitalift Hyaluronic Acid Serum", 
      price: "৳2,880", 
      originalPrice: "৳3,600",
      discount: "-20%",
      rating: 4.3,
      reviews: 8,
      image: "https://images.unsplash.com/photo-1617897903246-719242758050?w=200&h=200&fit=crop"
    },
    { 
      name: "Olay Regenerist Micro-Sculpting Cream", 
      price: "৳4,320", 
      originalPrice: "৳5,400",
      discount: "-20%",
      rating: 4.6,
      reviews: 12,
      image: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=200&h=200&fit=crop"
    }
  ];

  return (
    <div className="w-full bg-white p-3">
      {/* Title */}
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-gray-900">Drag Module</h3>
      </div>

      {/* Wrapper */}
      <div className="flex border border-gray-300 rounded-lg overflow-hidden">
        
        {/* Left Banner */}
        <div className="w-1/4 bg-gray-100 relative">
          <img
            src={bannerImage}
            alt="Banner"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/30"></div>
        </div>

        {/* Right Carousel Section */}
        <div className="relative w-3/4 bg-white">
          {/* Left Button */}
          <button className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white/90 hover:bg-white shadow-lg rounded-full flex items-center justify-center transition-all -translate-x-1/2">
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>

          {/* Products Scroll Section */}
          <div className="flex gap-2 overflow-hidden px-4 py-2">
            {products.map((product, index) => (
              <div key={index} className="flex-shrink-0 w-[140px]">
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Product Image */}
                  <div className="relative bg-white p-3">
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="w-full h-32 object-contain"
                    />
                    {/* Discount Badge */}
                    {product.discount && (
                      <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                        {product.discount}
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-2 border-t border-gray-100">
                    <h4 className="text-[11px] text-gray-800 mb-1.5 line-clamp-2 leading-tight h-8">
                      {product.name}
                    </h4>

                    {/* Rating */}
                    <div className="flex items-center gap-1 mb-1.5">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-2.5 h-2.5 ${
                              i < Math.floor(product.rating) 
                                ? 'fill-yellow-400 text-yellow-400' 
                                : 'fill-gray-200 text-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] text-gray-500">({product.reviews})</span>
                    </div>

                    {/* Prices */}
                    <div className="space-y-0.5">
                      <div className="text-orange-600 font-bold text-sm">
                        {product.price}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-gray-400 line-through">
                          {product.originalPrice}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Right Button */}
         <button className="absolute -right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white/90 hover:bg-white shadow-lg rounded-full flex items-center justify-center transition-all">
            <ChevronRight className="w-5 h-5 text-gray-700" />
          </button>
        </div>
      </div>
    </div>
  );
};
