import { useState, useEffect } from 'react';
import { Zap, ShoppingBag, ChevronLeft, ChevronRight } from 'lucide-react';

export const CountdownDemo = () => {
  const [time, setTime] = useState({ days: 22, hours: 13, minutes: 53, seconds: 15 });
  const [currentSlide, setCurrentSlide] = useState(0);

  const products = [
    {
      id: 1,
      name: "Premium Party Gown",
      originalPrice: 1147,
      discountPrice: 344,
      discount: 70,
      image: "https://cdn.pixabay.com/photo/2016/11/19/18/06/feet-1840619_1280.jpg"
    },
    {
      id: 2,
      name: "Elegant Evening Dress",
      originalPrice: 1299,
      discountPrice: 389,
      discount: 70,
      image: "https://cdn.pixabay.com/photo/2016/11/19/18/06/feet-1840619_1280.jpg"
    },
    {
      id: 3,
      name: "Designer Cocktail Dress",
      originalPrice: 999,
      discountPrice: 299,
      discount: 70,
      image: "https://cdn.pixabay.com/photo/2016/11/19/18/06/feet-1840619_1280.jpg"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(prevTime => {
        let { days, hours, minutes, seconds } = prevTime;
        
        if (seconds > 0) seconds--;
        else if (minutes > 0) { minutes--; seconds = 59; }
        else if (hours > 0) { hours--; minutes = 59; seconds = 59; }
        else if (days > 0) { days--; hours = 23; minutes = 59; seconds = 59; }
        
        return { days, hours, minutes, seconds };
      });
    }, 1000);

    const autoSlide = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % products.length);
    }, 4000);

    return () => {
      clearInterval(timer);
      clearInterval(autoSlide);
    };
  }, [products.length]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % products.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + products.length) % products.length);

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-violet-600 to-fuchsia-600 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-xl">
                <Zap className="text-yellow-300 fill-yellow-300" size={24} />
              </div>
              <h2 className="text-2xl font-black text-white">Flash Sale</h2>
            </div>
            <div className="text-white/80 text-sm">
              {currentSlide + 1}/{products.length}
            </div>
          </div>

          {/* Countdown */}
          <div className="flex justify-center gap-1">
            {[time.days, time.hours, time.minutes, time.seconds].map((value, index) => (
              <div key={index} className="flex items-center">
                <div className="bg-white/90 rounded-lg px-3 py-2 min-w-[50px] text-center">
                  <div className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-br from-violet-600 to-fuchsia-600">
                    {String(value).padStart(2, '0')}
                  </div>
                </div>
                {index < 3 && <span className="text-white/60 mx-1">:</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Product Slider */}
        <div className="p-4">
          <div className="relative">
            <button
              onClick={prevSlide}
              className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-white border border-gray-200 rounded-full p-1 shadow-md z-10"
            >
              <ChevronLeft size={16} />
            </button>
            
            <button
              onClick={nextSlide}
              className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-white border border-gray-200 rounded-full p-1 shadow-md z-10"
            >
              <ChevronRight size={16} />
            </button>

            <div className="flex items-center gap-4 px-8">
              <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0">
                <img 
                  src={products[currentSlide].image} 
                  alt={products[currentSlide].name}
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="flex-1">
                <div className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded-full inline-block mb-2">
                  -{products[currentSlide].discount}% OFF
                </div>
                <h3 className="font-bold text-gray-800 mb-2">{products[currentSlide].name}</h3>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-600">
                    ৳{products[currentSlide].discountPrice}
                  </span>
                  <span className="text-gray-400 line-through text-sm">
                    ৳{products[currentSlide].originalPrice}
                  </span>
                </div>
                <button className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold py-2 px-6 rounded-xl text-sm flex items-center gap-2 hover:shadow-lg transition-all">
                  <ShoppingBag size={16} />
                  Buy Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};