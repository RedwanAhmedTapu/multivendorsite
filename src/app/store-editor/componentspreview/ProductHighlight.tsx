import React from 'react';
import { useGetNewArrivalsQuery } from "@/features/productapi/commonProductApi";
import { toDisplayProduct } from "./useAutoProducts";

export interface HighlightProductItem {
  id?:            string;
  name?:          string;
  image?:         string;
  price?:         string;
  originalPrice?: string;
  discount?:      string;
}

export interface ProductHighlightFormData {
  title?:     string;
  /** "auto": always the 4 most-recently-added products, live.
   *  "manual": exactly the 4 vendor-picked products in `products`.
   *  Defaults to "auto" when unset. */
  mode?:      'auto' | 'manual';
  products?:  HighlightProductItem[];
  isVisible?: boolean;
}

interface ProductHighlightProps {
  isActive?:   boolean;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?:     (e: React.DragEvent) => void;
  onMoveUp?:   () => void;
  onMoveDown?: () => void;
  onCopy?:     () => void;
  onDelete?:   () => void;
  viewMode?:   'mobile' | 'desktop';
  // ← new: previously this component took ZERO props and always rendered
  // the same hardcoded dress photos — nothing from ConfigurationForm ever
  // reached it. It now accepts `formData` like every other preview
  // component so real targeted products show up here too.
  formData?:   ProductHighlightFormData;
}

const DEFAULT_MAIN: HighlightProductItem = {
  name: "Short knitted dress with tailored collar droper c...",
  price: "$1,020.30",
  originalPrice: "$1,280.85",
  discount: "-70%",
};

const DEFAULT_SIDE: HighlightProductItem[] = [
  { name: "Short knitted dress with t...", price: "$1,020.30" },
  { name: "Short knitted dress with t...", price: "$1,020.30" },
  { name: "Short knitted dress with t...", price: "$1,020.30" },
];

const SIDE_STYLES = [
  { bg: 'from-purple-50 to-purple-100 border-purple-200', icon: 'text-purple-400' },
  { bg: 'from-green-50 to-green-100 border-green-200',    icon: 'text-green-400' },
  { bg: 'from-orange-50 to-orange-100 border-orange-200', icon: 'text-orange-400' },
];

const ProductHighlight = ({
  onDragOver,
  onDrop,
  formData = {},
}: ProductHighlightProps) => {
  const title = formData.title ?? 'Product Highlight';
  const mode  = formData.mode ?? 'auto';

  // Auto mode always pulls the 4 most-recently-added products live —
  // manual mode uses whatever the vendor picked (enforced to be exactly 4
  // in ConfigurationForm's picker; if fewer were saved, the remaining
  // slots fall back to the placeholder look rather than rendering empty).
  const { data: newArrivals } = useGetNewArrivalsQuery({ limit: 4 }, { skip: mode !== 'auto' });

  if (formData.isVisible === false) return null;

  const products: HighlightProductItem[] | undefined =
    mode === 'auto'
      ? newArrivals?.map(toDisplayProduct)
      : formData.products && formData.products.length > 0
        ? formData.products
        : undefined;

  const mainProduct = products?.[0] ?? DEFAULT_MAIN;
  const sideProducts = products && products.length > 1 ? products.slice(1, 4) : DEFAULT_SIDE;

  return (
    <div className="w-full bg-white p-6 rounded-lg border border-gray-200" onDragOver={onDragOver} onDrop={onDrop}>
      <h2 className="text-xl font-bold text-gray-900 mb-6">{title}</h2>

      <div className="flex gap-6">
        {/* Main Large Product - Left Side */}
        <div className="flex-1">
          {/* Product Image */}
          <div className="relative w-full h-64 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg overflow-hidden mb-4 flex items-center justify-center">
            {mainProduct.image ? (
              <img src={mainProduct.image} alt={mainProduct.name ?? ''} className="w-full h-full object-cover" />
            ) : (
              <svg className="w-24 h-24 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
            )}
            {mainProduct.discount && (
              <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                {mainProduct.discount}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div>
            <h3 className="text-base text-gray-700 mb-2 line-clamp-2">
              {mainProduct.name}
            </h3>

            {mainProduct.price && (
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl font-bold text-red-500">
                  {mainProduct.price}
                </span>
              </div>
            )}

            {(mainProduct.originalPrice || mainProduct.discount) && (
              <div className="flex items-center gap-2">
                {mainProduct.originalPrice && (
                  <span className="text-sm text-gray-400 line-through">
                    {mainProduct.originalPrice}
                  </span>
                )}
                {mainProduct.discount && (
                  <span className="text-sm font-bold text-red-500">
                    {mainProduct.discount}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Side Products - Right Side */}
        <div className="flex flex-col gap-4">
          {sideProducts.map((product, index) => {
            const style = SIDE_STYLES[index % SIDE_STYLES.length];
            return (
              <div key={product.id ?? index} className="flex gap-3 items-start cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors">
                {/* Small Product Image */}
                <div className={`w-16 h-16 rounded overflow-hidden flex-shrink-0 flex items-center justify-center bg-gradient-to-br border ${style.bg}`}>
                  {product.image ? (
                    <img src={product.image} alt={product.name ?? ''} className="w-full h-full object-cover" />
                  ) : (
                    <svg className={`w-8 h-8 ${style.icon}`} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>

                {/* Small Product Details */}
                <div className="flex-1">
                  <h4 className="text-sm text-gray-700 mb-1 line-clamp-2">
                    {product.name}
                  </h4>
                  {product.price && (
                    <span className="text-base font-bold text-red-500">
                      {product.price}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProductHighlight;