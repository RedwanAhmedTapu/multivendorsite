// components/product/moreinfoproduct/MoreInfoProduct.tsx
import React from 'react';

interface MoreInfoProductProps {
  product: any;
}

const MoreInfoProduct: React.FC<MoreInfoProductProps> = ({ product }) => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6">Product Details</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Specifications */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Specifications</h3>
            <div className="space-y-3">
              {product.specifications?.map((spec: any, index: number) => (
                <div key={index} className="flex justify-between border-b pb-2">
                  <span className="text-gray-600">{spec.name}:</span>
                  <span className="font-medium">{spec.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Additional Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Additional Information</h3>
            <div className="space-y-3">
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600">Category:</span>
                <span className="font-medium">{product.category?.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600">Vendor:</span>
                <span className="font-medium">{product.vendor?.storeName || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600">Status:</span>
                <span className="font-medium">{product.status || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        {product.description && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Description</h3>
            <p className="text-gray-700 leading-relaxed">{product.description}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MoreInfoProduct;