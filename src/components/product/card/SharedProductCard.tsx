"use client";

// components/product/card/SharedProductCard.tsx
//
// The ONE customer-facing product card. Design comes from the global product
// card configuration (ProductCardConfigProvider; built-in defaults without a
// provider). The default design reproduces today's homepage card
// (productcard/ProductCard.tsx, grid view) on tablet/desktop — same element
// structure, Tailwind colors and computed sizes — with the approved changes:
//   - compact mobile spacing (via config values);
//   - ratings only from real data (avgRating/reviewCount), never empty stars;
//   - a real <Link> to the product page instead of a JS click handler,
//     with prefetch={false} (see the link below);
//   - no "Unknown Store" placeholder;
//   - store name hidden on the vendor's own storefront (context="storefront").
// No Wishlist / Quick View. Add to Cart is opt-in (config.show.addToCart):
// when it applies to the product, the card becomes a <div> holding the product
// <Link> and, as a SIBLING (never nested in the link), CardCartButton. When it
// is off or doesn't apply, the markup is exactly the link-only card.
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { Badge } from "@/components/ui/badge";
import { VerifiedBadge } from "@/components/product/productcard/VerifiedBadge";
import { toProductCardModel, type CardProductInput } from "@/lib/product-card/model";
import { CardCartButton } from "./CardCartButton";
import { useProductCardDesign } from "./ProductCardConfigProvider";
import { resolveCardVisibility, type ModuleCardVisibility } from "@/lib/product-card/visibility";
import styles from "./SharedProductCard.module.css";

export type ProductCardContext = "marketplace" | "storefront";

interface SharedProductCardProps {
  product: CardProductInput;
  /** "storefront" = listing on the vendor's own store page (store name hidden). */
  context?: ProductCardContext;
  /** Passed to next/image `sizes`; defaults fit the homepage grids. */
  imageSizes?: string;
  /**
   * Skip Next's image optimizer (no remotePatterns host check). For listings
   * that rendered a plain <img> before (campaign, storefront, related
   * products), so product images from any host keep working as they did.
   */
  unoptimizedImage?: boolean;
  /** Admin editor preview: the cart button never touches a cart. */
  preview?: boolean;
  /**
   * Hide-only module overrides (store modules). Effective visibility is the
   * global config AND these flags — a module can turn an element off, never on,
   * and never restyle: colour/typography/geometry stay global.
   */
  visibility?: ModuleCardVisibility;
}

const TakaIcon = ({ className = "", style }: { className?: string; style?: CSSProperties }) => (
  <i className={`fa-solid fa-bangladeshi-taka-sign ${className}`} style={style} aria-hidden="true" />
);

function RatingStars({ average, count, showCount }: { average: number; count: number; showCount: boolean }) {
  const full = Math.floor(average);
  return (
    <div
      className="flex items-center gap-2"
      role="img"
      aria-label={`Rated ${average.toFixed(1)} out of 5 from ${count} review${count === 1 ? "" : "s"}`}
    >
      <div className="flex text-orange-400" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} className="text-sm">
            {i < full ? "★" : "☆"}
          </span>
        ))}
      </div>
      <span className="text-sm text-gray-600 font-medium" aria-hidden="true">
        {average.toFixed(1)}
        {showCount ? ` (${count})` : ""}
      </span>
    </div>
  );
}

export function SharedProductCard({
  product,
  context = "marketplace",
  imageSizes = "(max-width: 767px) 50vw, (max-width: 1023px) 20vw, 17vw",
  unoptimizedImage = false,
  preview = false,
  visibility,
}: SharedProductCardProps) {
  const { config, vars, colors } = useProductCardDesign();
  const m = toProductCardModel(product);
  const show = resolveCardVisibility(config.show, visibility);

  const discount = show.discountBadge && m.discountPercent !== null ? m.discountPercent : null;
  const badgePos = config.discountBadge.position;
  const rating = show.rating && m.rating ? m.rating : null;
  const storeName = show.storeName && context !== "storefront" ? m.storeName : null;
  const verified = show.verifiedBadge && context !== "storefront" && m.verified;
  const stockLabel = show.stockLabel && m.available !== null ? (m.available > 0 ? "In stock" : "Out of stock") : null;
  const fitClass = config.image.fit === "cover" ? "object-cover" : "object-contain";
  const center = config.card.align === "center";
  const cartAction = show.addToCart && m.cart.kind !== "none" ? m.cart : null;

  const imageBadge =
    discount !== null && badgePos !== "besidePrice" ? (
      <div className={`absolute top-2 z-10 ${badgePos === "imageTopLeft" ? "left-2" : "right-2"}`}>
        <Badge className={`bg-pink-50 text-teal-600 px-2 py-0.5 text-xs font-bold border border-teal-200 ${styles.badge}`} style={colors.badge}>
          -{discount}%
        </Badge>
      </div>
    ) : null;

  const sideBadge =
    discount !== null && badgePos === "besidePrice" ? (
      <Badge className={`bg-pink-50 text-teal-600 px-2 py-0.5 text-xs font-bold border border-teal-200 ${styles.badge}`} style={colors.badge}>
        -{discount}%
      </Badge>
    ) : null;

  const body = (
    <>
      {show.image && (
        <div
          className={`bg-gray-50 ${styles.imageBox} ${config.image.sizing !== "fixed" ? styles.imageBoxRatio : ""}`}
          style={colors.image}
        >
          <div className={styles.imageInset}>
            <div className="relative w-full h-full flex items-center justify-center">
              {m.image ? (
                <Image
                  src={m.image.url}
                  alt={m.image.alt}
                  fill
                  sizes={imageSizes}
                  unoptimized={unoptimizedImage}
                  className={fitClass}
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-400">No Image</span>
                </div>
              )}
            </div>
          </div>

          {/* Top Left Badge - Free Shipping */}
          {show.freeShippingBadge && m.freeShipping && (
            <div className="absolute top-3 left-3 z-10">
              <Image src="/tag/Envío gratuito destacado.png" alt="Free shipping" width={100} height={40} />
            </div>
          )}
          {imageBadge}
        </div>
      )}

      <div className={`flex flex-col flex-grow ${styles.content} ${center ? styles.center : ""}`}>
        {show.title && (
          <h3
            className={`text-gray-800 mb-2 hover:text-teal-700 transition-colors ${styles.title}`}
            style={colors.title}
            title={m.name}
          >
            {m.name}
          </h3>
        )}

        {show.price && (
          <div className="mb-2">
            {m.originalPriceText !== null ? (
              <div className="flex flex-col">
                {/* flex-wrap: on very narrow cells (e.g. 320px phones) the badge drops
                    below the price instead of being clipped; where it fits, nothing wraps. */}
                <div className={`flex flex-wrap items-center justify-between gap-y-1 mb-1 ${styles.row}`}>
                  <div className={`flex items-center gap-1 ${styles.price}`}>
                    <TakaIcon className={`text-teal-600 ${styles.priceIcon}`} style={colors.price} />
                    <span className={`text-teal-600 ${styles.priceValue}`} style={colors.price}>
                      {m.priceText}
                    </span>
                  </div>
                  {sideBadge}
                </div>
                {(show.originalPrice || rating) && (
                  <div className={`flex flex-wrap items-center justify-between gap-y-1 ${styles.row}`}>
                    {show.originalPrice ? (
                      <div className={`flex items-center gap-1 ${styles.original}`}>
                        <TakaIcon className={`text-gray-400 ${styles.originalIcon}`} style={colors.originalPrice} />
                        <span className={`text-gray-400 line-through ${styles.originalValue}`} style={colors.originalPrice}>
                          {m.originalPriceText}
                        </span>
                      </div>
                    ) : (
                      <span />
                    )}
                    {rating && <RatingStars average={rating.average} count={rating.count} showCount={show.reviewCount} />}
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className={`flex items-center gap-1 ${styles.price} ${styles.row}`}>
                  <TakaIcon className={`text-gray-800 ${styles.priceIcon}`} style={colors.price} />
                  <span className={`text-gray-800 ${styles.priceValue}`} style={colors.price}>
                    {m.priceText}
                  </span>
                </div>
                {rating && (
                  <div className={`flex items-center mt-1 ${styles.row}`}>
                    <RatingStars average={rating.average} count={rating.count} showCount={show.reviewCount} />
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {stockLabel && (
          <p className={`text-xs font-medium mb-2 ${m.available! > 0 ? "text-teal-700" : "text-red-600"}`}>{stockLabel}</p>
        )}

        {/* Store Name with Verification Badge */}
        {(storeName || verified) && (
          <div className={`flex items-center justify-between gap-2 mb-2 ${styles.row}`}>
            {storeName ? <span className="text-xs text-gray-500 font-medium truncate">{storeName}</span> : <span />}
            {verified && <VerifiedBadge />}
          </div>
        )}
      </div>
    </>
  );

  // Prefetch policy: listing cards do NOT prefetch. A grid can hold dozens of
  // cards, and viewport prefetching would fire one product-route request per
  // visible card. Clicking still navigates normally (client-side) — only the
  // speculative background fetch is skipped.
  if (!cartAction) {
    return (
      <Link
        href={m.href}
        prefetch={false}
        data-fm-card=""
        className={`group bg-white border-gray-200 transition-all duration-300 ${styles.card}`}
        style={{ ...(vars as CSSProperties), ...colors.card }}
      >
        {body}
      </Link>
    );
  }

  return (
    <div
      data-fm-card-root=""
      className={`group bg-white border-gray-200 transition-all duration-300 ${styles.card} ${styles.cardWithAction}`}
      style={{ ...(vars as CSSProperties), ...colors.card }}
    >
      <Link href={m.href} prefetch={false} data-fm-card="" className={styles.cardBody}>
        {body}
      </Link>
      <CardCartButton action={cartAction} href={m.href} productName={m.name} config={config.addToCart} preview={preview} />
    </div>
  );
}

export default SharedProductCard;
