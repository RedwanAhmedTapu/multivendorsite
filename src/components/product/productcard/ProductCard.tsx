"use client";

import { Heart, Eye, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { getImageUrl } from "@/utils/image";

interface Product {
  id: string;
  title: string;
  image: string;
  images: string[];
  colors: string;
  rating: number;
  reviews: number;
  price: number;
  oldPrice?: number;
  tags: string[];
}

export const ProductCard: React.FC<{ product: Product; view?: "grid" | "list" }> = ({
  product,
  view = "grid",
}) => {
  // Get the primary image with proper fallback
  const getPrimaryImage = () => {
    if (product.image && product.image.trim() !== "") {
      return getImageUrl(product.image);
    }
    if (product.images && product.images.length > 0) {
      return getImageUrl(product.images[0]);
    }
    return null;
  };

  const primaryImage = getPrimaryImage();
  const hasValidImage = primaryImage !== null;

  // ---------------- LIST VIEW ----------------
  if (view === "list") {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="flex flex-col md:flex-row">
            <div className="md:w-1/3 relative">
              <div className="w-full h-48 md:h-full bg-gray-100 flex items-center justify-center relative overflow-hidden">
                {hasValidImage ? (
                  <Image
                    src={primaryImage}
                    alt={product.title}
                    fill
                    className="object-contain transition-transform duration-500 ease-in-out hover:scale-105"
                  />
                ) : (
                  <span className="text-gray-500">No Image</span>
                )}
              </div>
              {product.tags.length > 0 && (
                <div className="absolute top-3 left-3 flex gap-2 z-10">
                  {product.tags.map((tag, i) => (
                    <Badge
                      key={i}
                      className={`${
                        tag === "Sale"
                          ? "bg-red-500 text-white"
                          : "bg-orange-500 text-white"
                      } px-2 py-0.5 text-xs`}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <div className="p-4 md:w-2/3">
              <h3 className="font-semibold text-lg mb-2">{product.title}</h3>
              <div className="flex items-center mb-2">
                <div className="flex text-yellow-500">
                  {"★".repeat(Math.floor(product.rating))}
                  {"☆".repeat(5 - Math.floor(product.rating))}
                </div>
                <span className="text-sm text-gray-600 ml-2">
                  ({product.reviews} reviews)
                </span>
              </div>
              {product.colors && (
                <p className="text-sm text-gray-600 mb-3">
                  Color: {product.colors}
                </p>
              )}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg font-bold">
                  ${product.price.toFixed(2)}
                </span>
                {product.oldPrice && (
                  <span className="text-sm text-gray-500 line-through">
                    ${product.oldPrice.toFixed(2)}
                  </span>
                )}
              </div>
              <Button className="bg-teal-900 hover:bg-teal-800 text-white rounded-lg flex items-center justify-center gap-2">
                <ShoppingCart size={16} />
                Add to Cart
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ---------------- GRID VIEW ----------------
  return (
    <Card className="group relative p-3 sm:p-4 rounded-xl border flex flex-col justify-between transition-all duration-300 hover:shadow-lg">
      {/* Icons */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <button className="bg-white rounded-full p-2 shadow-md hover:bg-gray-100">
          <Heart size={16} className="text-gray-600" />
        </button>
        <button className="bg-white rounded-full p-2 shadow-md hover:bg-gray-100">
          <Eye size={16} className="text-gray-600" />
        </button>
      </div>

      {/* Tags */}
      {product.tags.length > 0 && (
        <div className="absolute top-3 left-3 flex gap-2 z-10">
          {product.tags.map((tag, i) => (
            <Badge
              key={i}
              className={`${
                tag === "Sale"
                  ? "bg-red-500 text-white"
                  : "bg-orange-500 text-white"
              } px-2 py-0.5 text-xs sm:px-3 sm:py-1`}
            >
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Image */}
      <CardContent className="flex flex-col items-center p-0">
        <div className="relative w-full h-32 sm:h-40 mb-3 flex items-center justify-center bg-gray-100 overflow-hidden rounded-lg">
          {hasValidImage ? (
            <Image
              src={primaryImage}
              alt={product.title}
              fill
              className="object-contain transition-transform duration-500 ease-in-out group-hover:scale-105"
            />
          ) : (
            <span className="text-gray-500">No Image</span>
          )}
        </div>

        {product.colors && (
          <p className="text-xs text-gray-500 mb-1">{product.colors}</p>
        )}

        <h3 className="text-xs sm:text-sm font-medium text-center mb-1 line-clamp-2 h-8 sm:h-10">
          {product.title}
        </h3>

        <div className="flex text-yellow-500 text-xs sm:text-sm mb-1">
          {"★".repeat(Math.floor(product.rating))}
          {"☆".repeat(5 - Math.floor(product.rating))}
        </div>

        <p className="text-xs text-gray-500 mb-2">
          ({product.reviews} review{product.reviews !== 1 ? "s" : ""})
        </p>

        <div className="flex gap-2 items-center">
          <span className="text-base sm:text-lg font-semibold text-black">
            ${product.price.toFixed(2)}
          </span>
          {product.oldPrice && (
            <span className="text-xs sm:text-sm text-gray-400 line-through">
              ${product.oldPrice.toFixed(2)}
            </span>
          )}
        </div>
      </CardContent>

      <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <Button className="w-full bg-teal-900 hover:bg-teal-800 text-white rounded-lg flex items-center justify-center gap-2 py-2 text-sm">
          <ShoppingCart size={16} />
          Add to Cart
        </Button>
      </div>
    </Card>
  );
};