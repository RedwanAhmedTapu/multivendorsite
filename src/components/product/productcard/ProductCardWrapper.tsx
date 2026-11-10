// components/product/productcard/ProductCardWrapper.tsx
// এটি একটি SERVER COMPONENT
import Image from "next/image";
import Link from "next/link";
import { VerifiedBadge } from "./VerifiedBadge";
// import { CardInteractiveButtons } from "./CardInteractiveButtons"; // Wishlist & QuickView disabled

// Taka Icon Component using FontAwesome
const TakaIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <i className={`fa-solid fa-bangladeshi-taka-sign ${className}`} />
);

export function ProductCardWrapper({ product }: { product: any }) {
  const primaryImage = product.images?.[0]?.url;
  const imageAlt = product.images?.[0]?.altText || product.name;

  const variant = product.variants?.[0];
  const price = variant?.price || 0;
  const specialPrice = variant?.specialPrice || null;
  const discount = variant?.discount || null;

  // Calculate average rating
  const averageRating = product.reviews?.length
    ? product.reviews.reduce((acc: number, review: any) => acc + review.rating, 0) /
      product.reviews.length
    : 0;

  // Check for free shipping
  const hasFreeShipping = product.offerProducts?.length
    ? product.offerProducts.some((op: any) => op.offer.type === "FREE_SHIPPING")
    : false;

  // Check vendor verification
  const isVerified = product.vendor?.verificationStatus === "VERIFIED";
  const storeName = product.vendor?.storeName || "Unknown Store";

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group relative border border-gray-200 rounded-lg p-0 shadow-sm hover:shadow-lg transition-all duration-300 h-full flex flex-col bg-white overflow-hidden block"
    >
      {/* Image Container */}
      <div className="relative w-full h-44 overflow-hidden bg-gray-50">
        <div className="relative w-full h-full flex items-center justify-center">
          {primaryImage ? (
            <Image
              src={primaryImage}
              alt={imageAlt} // SEO এর জন্য Alt Text অত্যন্ত জরুরি
              fill
              className="object-contain"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-400">No Image</span>
            </div>
          )}
        </div>

        {/* Top Left Badge - Free Shipping */}
        <div className="absolute top-3 left-3 z-10">
          {hasFreeShipping && (
            <Image
              src="/tag/Envío gratuito destacado.png"
              alt="free shipping badge"
              width={100}
              height={40}
            />
          )}
        </div>

        {/* Discount Badge */}
        {discount && (
          <div className="absolute top-2 right-2 z-10">
            <span className="bg-pink-50 text-pink-600 px-2 py-0.5 text-xs font-bold border border-pink-200 rounded">
              -{discount}%
            </span>
          </div>
        )}

        {/* Wishlist & Quick View - disabled */}
        {/* <CardInteractiveButtons product={product} variantId={variant?.id} /> */}
      </div>

      {/* Content */}
      <div className="flex flex-col px-4 py-1 flex-grow">
        {/* Product Name */}
        <h3
          className="text-sm font-medium text-gray-800 mb-2 leading-tight hover:text-teal-700 transition-colors line-clamp-2"
          title={product.name}
        >
          {product.name}
        </h3>

        {/* Price Section */}
        <div className="mb-2">
          {specialPrice ? (
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1">
                  <TakaIcon className="text-teal-600 text-lg" />
                  <span className="text-xl font-bold text-teal-600">
                    {specialPrice.toLocaleString()}
                  </span>
                </div>
                {discount && (
                  <span className="bg-pink-50 text-teal-600 px-2 py-0.5 text-xs font-bold border border-teal-200 rounded">
                    -{discount}%
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <TakaIcon className="text-gray-400 text-base" />
                  <span className="text-sm text-gray-400 line-through">
                    {price.toLocaleString()}
                  </span>
                </div>
                {/* Rating Section */}
                <div className="flex items-center gap-2">
                  <div className="flex text-orange-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} className="text-sm">
                        {i < Math.floor(averageRating) ? "★" : "☆"}
                      </span>
                    ))}
                  </div>
                  <span className="text-sm text-gray-600 font-medium">
                    {averageRating > 0 ? averageRating.toFixed(1) : ""}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <TakaIcon className="text-gray-800 text-lg" />
              <span className="text-xl font-bold text-gray-800">
                {price.toLocaleString()}
              </span>
            </div>
          )}
        </div>

        {/* Store Name with Verification Badge */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-gray-500 font-medium truncate">{storeName}</span>
          {isVerified && (
           <VerifiedBadge/>
          )}
        </div>
      </div>
    </Link>
  );
}