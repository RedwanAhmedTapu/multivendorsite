import React from 'react';

 const ProductHighlight = () => {
  const mainProduct = {
    name: "Short knitted dress with tailored collar droper c...",
    price: "$1,020.30",
    originalPrice: "$1,280.85",
    discount: "-70%",
    image: "https://cdn.pixabay.com/photo/2016/11/19/18/06/feet-1840619_1280.jpg"
  };

  const sideProducts = [
    {
      name: "Short knitted dress with t...",
      price: "$1,020.30",
      image: "https://cdn.pixabay.com/photo/2017/08/01/11/48/woman-2564660_1280.jpg"
    },
    {
      name: "Short knitted dress with t...",
      price: "$1,020.30",
      image: "https://cdn.pixabay.com/photo/2016/11/29/09/10/man-1868730_1280.jpg"
    },
    {
      name: "Short knitted dress with t...",
      price: "$1,020.30",
      image: "https://cdn.pixabay.com/photo/2015/05/31/13/45/tablet-791179_1280.jpg"
    }
  ];

  return (
    <div className="w-full  bg-white p-6 rounded-lg border border-gray-200">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Product Highlight</h2>
      
      <div className="flex gap-6">
        {/* Main Large Product - Left Side */}
        <div className="flex-1">
          {/* Product Image */}
          <div className="w-full h-64 bg-gray-100 rounded-lg overflow-hidden mb-4">
            <img 
              src={mainProduct.image}
              alt={mainProduct.name}
              className="w-full h-full object-cover"
            />
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
              <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                <img 
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
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
