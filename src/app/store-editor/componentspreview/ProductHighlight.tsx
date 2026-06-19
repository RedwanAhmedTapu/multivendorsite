import React from 'react';

const ProductHighlight = () => {
  const mainProduct = {
    name: "Short knitted dress with tailored collar droper c...",
    price: "$1,020.30",
    originalPrice: "$1,280.85",
    discount: "-70%"
  };

  const sideProducts = [
    {
      name: "Short knitted dress with t...",
      price: "$1,020.30"
    },
    {
      name: "Short knitted dress with t...",
      price: "$1,020.30"
    },
    {
      name: "Short knitted dress with t...",
      price: "$1,020.30"
    }
  ];

  return (
    <div className="w-full bg-white p-6 rounded-lg border border-gray-200">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Product Highlight</h2>
      
      <div className="flex gap-6">
        {/* Main Large Product - Left Side */}
        <div className="flex-1">
          {/* Product Image */}
          <div className="w-full h-64 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg overflow-hidden mb-4 flex items-center justify-center">
            <svg className="w-24 h-24 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
            {/* Discount Badge */}
            <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
              {mainProduct.discount}
            </div>
          </div>

          {/* Product Details */}
          <div>
            <h3 className="text-base text-gray-700 mb-2 line-clamp-2">
              {mainProduct.name}
            </h3>

            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl font-bold text-red-500">
                {mainProduct.price}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400 line-through">
                {mainProduct.originalPrice}
              </span>
              <span className="text-sm font-bold text-red-500">
                {mainProduct.discount}
              </span>
            </div>
          </div>
        </div>

        {/* Side Products - Right Side */}
        <div className="flex flex-col gap-4">
          {sideProducts.map((product, index) => (
            <div key={index} className="flex gap-3 items-start cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors">
              {/* Small Product Image */}
              <div className={`w-16 h-16 rounded overflow-hidden flex-shrink-0 flex items-center justify-center ${
                index === 0 ? 'bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200' :
                index === 1 ? 'bg-gradient-to-br from-green-50 to-green-100 border border-green-200' :
                'bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200'
              }`}>
                <svg className={`w-8 h-8 ${
                  index === 0 ? 'text-purple-400' :
                  index === 1 ? 'text-green-400' :
                  'text-orange-400'
                }`} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
              </div>

              {/* Small Product Details */}
              <div className="flex-1">
                <h4 className="text-sm text-gray-700 mb-1 line-clamp-2">
                  {product.name}
                </h4>
                <span className="text-base font-bold text-red-500">
                  {product.price}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductHighlight;