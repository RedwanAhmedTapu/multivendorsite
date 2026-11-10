// app/products/[id]/SingleProductClient.tsx
"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Star,
  RotateCcw,
  ShieldAlert,
  Store,
  ShieldCheck,
  ShoppingCart,
  Heart,
  Share2,
  Plus,
  Minus,
  MessageSquare,
  ChevronRight,
  ChevronDown,
  Ticket,
  Home,
  Zap,
} from "lucide-react";
import { VendorChatButton } from "@/components/chatbox/VendorChatButton";
import { ProductReviews } from "@/components/reviews/product-reviews";
import { LoginModal } from "@/components/loginmodal/loginModal";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import {
  useAddToCartMutation,
  useAddToWishlistMutation,
  useRemoveFromWishlistMutation,
  useLazyCheckInWishlistQuery,
} from "@/features/cartWishApi";
import { useGetOffersForProductQuery, type Offer } from "@/features/offerApi";
import { useGetRelatedProductsQuery } from "@/features/productapi/commonProductApi";
import { SharedProductCard } from "@/components/product/card/SharedProductCard";
import { effectivePrice } from "@/lib/pricing/effective-price";
import { toast } from "sonner";
import { useTrackProductView } from "@/lib/analytics/useAnalytics";

// =============================
// SHARED PRIMITIVES
// =============================

// Still needed: RelatedProducts fetches client-side after mount, which is
// a separate loading moment from the route-level loading.tsx (that only
// covers the initial server fetch in page.tsx).
const Skeleton = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
);

const ProductImage = ({ src, alt, ...props }: any) => {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setImgSrc(src);
    setHasError(false);
  }, [src]);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImgSrc("/placeholder-product.jpg");
    }
  };

  return (
    <Image
      {...props}
      src={hasError ? "/placeholder-product.jpg" : imgSrc}
      alt={alt}
      onError={handleError}
    />
  );
};

const getProductImages = (product: any): string[] => {
  const images: string[] = [];
  product?.images?.forEach((img: any) => {
    if (img.url) images.push(img.url);
  });
  product?.variants?.forEach((v: any) => {
    v.images?.forEach((img: any) => {
      if (img.url) images.push(img.url);
    });
  });
  return images.length > 0 ? images : ["/placeholder-product.jpg"];
};

// FIX: builds a unit-aware label from a variant's attributes array
// (e.g. "8GB / 256GB / 1 Year") instead of relying on the backend's
// pre-baked `variant.name`, which concatenates raw values without units
// ("8 / 256 / 1 Year") because it's built before unit lookup.
const getVariantSpecLabel = (variant: any): string => {
  if (!variant?.attributes?.length) return variant?.name || "";
  return variant.attributes
    .map((a: any) => {
      const val = a.attributeValue?.value;
      const unit = a.attributeValue?.attribute?.unit;
      if (val == null) return null;
      return unit ? `${val}${unit}` : val;
    })
    .filter(Boolean)
    .join(" / ");
};

enum TabType {
  DESCRIPTION = "description",
  SPECIFICATIONS = "specifications",
  REVIEWS = "reviews",
}

// =============================
// BREADCRUMB — full nested chain, robust to several backend shapes
// =============================

export interface BreadcrumbItem {
  name: string;
  url: string;
}

/** Walk up parent/parentCategory references until the root, guarding against cycles. */
const collectCategoryChain = (category: any): BreadcrumbItem[] => {
  const chain: BreadcrumbItem[] = [];
  const seen = new Set<string>();
  let current = category;
  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    chain.unshift({ name: current.name, url: `/category/${current.slug || current.id}` });
    current = current.parent || current.parentCategory || current.Parent || null;
  }
  return chain;
};

const getBreadcrumbs = (product: any): BreadcrumbItem[] => {
  // 1) Backend already resolved the full chain — always prefer this.
  if (Array.isArray(product?.breadcrumbs) && product.breadcrumbs.length > 0) {
    return product.breadcrumbs;
  }

  // 2) Category ships an explicit root-first ancestors/path array.
  const ancestors = product?.category?.ancestors || product?.category?.path;
  if (Array.isArray(ancestors) && ancestors.length > 0) {
    const chain: BreadcrumbItem[] = ancestors.map((a: any) => ({
      name: a.name,
      url: `/category/${a.slug || a.id}`,
    }));
    if (product?.category?.name) {
      chain.push({
        name: product.category.name,
        url: `/category/${product.category.slug || product.category.id}`,
      });
    }
    return chain;
  }

  // 3) Fall back to walking category.parent / category.parentCategory references.
  if (product?.category) {
    const chain = collectCategoryChain(product.category);
    if (chain.length > 0) return chain;
  }

  return [];
  // NOTE: if this still renders only 1–2 levels, the API response for this
  // product needs to include the full ancestor chain — either as a top-level
  // `breadcrumbs` array, a `category.ancestors`/`category.path` array, or a
  // nested `category.parent` reference all the way to the root category.
};

// FIX: every breadcrumb item (including the LAST one) is now a real <Link>,
// so clicking ANY category navigates. Previously the last item rendered as a
// plain <span>, which looked clickable but did nothing.
const Breadcrumb = ({ items }: { items: BreadcrumbItem[] }) => {
  return (
    <nav
      aria-label="Breadcrumb"
      className="w-full overflow-x-auto whitespace-nowrap [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <ol className="flex items-center gap-1.5 py-2 text-sm text-gray-500">
        <li className="flex items-center gap-1.5 flex-shrink-0">
          <Link
            href="/"
            className="inline-block py-1.5 text-gray-500 hover:text-teal-700 transition-colors"
          >
            <Home className="w-4 h-4" />
          </Link>
          {items.length > 0 && (
            <ChevronRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
          )}
        </li>
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={`${item.url}-${i}`} className="flex items-center gap-1.5 flex-shrink-0">
              <Link
                href={item.url}
                title={item.name}
                className={`inline-block py-1.5 px-1 rounded transition-colors hover:text-teal-700 ${
                  isLast
                    ? "text-gray-800 font-medium truncate max-w-[45vw] sm:max-w-none"
                    : "text-gray-500"
                }`}
              >
                {item.name}
              </Link>
              {!isLast && (
                <ChevronRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

// =============================
// FLASH SALE / COUNTDOWN BANNER
// =============================

const pad2 = (n: number) => String(Math.max(0, n)).padStart(2, "0");

const FlashSaleBanner = ({ offer }: { offer: Offer }) => {
  const config = offer.countdownConfig;
  const [left, setLeft] = useState({ h: 0, m: 0, s: 0 });

  useEffect(() => {
    if (!config?.countdownEnds) return;
    const end = new Date(config.countdownEnds).getTime();
    const tick = () => {
      const diff = Math.max(0, end - Date.now());
      setLeft({
        h: Math.floor(diff / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [config?.countdownEnds]);

  if (!config) return null;

  const sold =
    config.quantityLimit != null && config.remainingQty != null
      ? Math.max(0, config.quantityLimit - config.remainingQty)
      : null;
  const progressPct =
    config.quantityLimit && sold != null
      ? Math.min(100, (sold / config.quantityLimit) * 100)
      : 0;

  return (
    <div className="rounded-lg bg-gradient-to-r from-teal-900 to-teal-700 text-white px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 font-extrabold tracking-wide text-sm sm:text-base italic">
          <Zap className="w-4 h-4 fill-yellow-300 text-yellow-300" />
          FLASH SALE
        </div>
        <div className="flex items-center gap-1 font-mono text-xs sm:text-sm">
          <span className="bg-black/70 px-1.5 py-1 rounded">{pad2(left.h)}</span>
          <span className="text-white/70">:</span>
          <span className="bg-black/70 px-1.5 py-1 rounded">{pad2(left.m)}</span>
          <span className="text-white/70">:</span>
          <span className="bg-black/70 px-1.5 py-1 rounded">{pad2(left.s)}</span>
        </div>
      </div>
      {config.quantityLimit ? (
        <div className="mt-2 flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-white/25 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full" style={{ width: `${progressPct}%` }} />
          </div>
          <span className="text-[11px] text-white/90 whitespace-nowrap">
            {sold} {config.scarcityText || "item sold"}
          </span>
        </div>
      ) : (
        config.urgencyText && <p className="mt-1 text-[11px] text-white/90">{config.urgencyText}</p>
      )}
    </div>
  );
};

// =============================
// VOUCHER SECTION (driven by offerApi) — compact inline trigger
// =============================

type VoucherTab = "all" | "store" | "cartup";

const formatOfferDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString("en-GB").split("/").join(".") : "";

const formatDiscountLabel = (o: Offer) => {
  if (o.discountType === "PERCENTAGE") return `${o.discountValue}% OFF`;
  if (o.discountType === "FIXED_AMOUNT") return `\u09F3${o.discountValue} OFF`;
  if (o.discountType === "FREE_SHIPPING") return "Free Shipping";
  return o.title;
};

const VoucherSection = ({ offers, sku }: { offers: Offer[]; sku?: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<VoucherTab>("all");
  const [collectedIds, setCollectedIds] = useState<string[]>([]);

  const vouchers = useMemo(
    () => offers.filter((o) => o.type === "VOUCHER" || o.voucherConfig),
    [offers]
  );

  const storeVouchers = vouchers.filter((v) => v.createdByType === "VENDOR");
  const cartupVouchers = vouchers.filter(
    (v) => v.createdByType === "ADMIN" || v.createdByType === "SYSTEM"
  );

  const tabs: { key: VoucherTab; label: string; list: Offer[] }[] = [
    { key: "all", label: `All Voucher(${vouchers.length})`, list: vouchers },
    { key: "store", label: `Store(${storeVouchers.length})`, list: storeVouchers },
    { key: "cartup", label: `Cartup(${cartupVouchers.length})`, list: cartupVouchers },
  ];

  const activeList = tabs.find((t) => t.key === activeTab)?.list || [];
  const headlineMinSpend = vouchers[0]?.minOrderAmount;

  const handleCollect = (id: string) => {
    // NOTE: no dedicated "collect voucher" endpoint was supplied — this is a
    // local UI acknowledgement only. Wire this to a real mutation when available.
    setCollectedIds((prev) => [...prev, id]);
    toast.success("Voucher collected!");
  };

  return (
    <div className="py-3">
      <div className="flex items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-gray-500 flex-shrink-0">Voucher</span>
          {vouchers.length > 0 ? (
            <button
              onClick={() => setIsOpen((o) => !o)}
              className="flex items-center gap-1 text-teal-700 font-medium bg-teal-50 border border-teal-100 rounded-full px-3 py-1 whitespace-nowrap"
            >
              {headlineMinSpend ? `Min. spend \u09F3${headlineMinSpend}` : `${vouchers.length} available`}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>
          ) : (
            <span className="text-gray-400 text-xs">No voucher for this product</span>
          )}
        </div>
        {sku && <span className="text-gray-400 text-xs whitespace-nowrap flex-shrink-0">SKU: {sku}</span>}
      </div>

      {isOpen && vouchers.length > 0 && (
        <div className="mt-3 border border-gray-100 rounded-lg p-4 space-y-4">
          <div className="flex items-center gap-6 border-b border-gray-100 pb-2 overflow-x-auto">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`text-sm whitespace-nowrap pb-2 border-b-2 transition-colors ${
                  activeTab === t.key
                    ? "border-teal-700 text-teal-800 font-semibold"
                    : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {activeList.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">No vouchers in this tab.</p>
            )}
            {activeList.map((offer) => (
              <div
                key={offer.id}
                className="flex items-center gap-3 bg-teal-50/60 border border-teal-100 rounded-lg p-3"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex-shrink-0">
                  <Ticket className="w-5 h-5" />
                </div>
                <div className="w-px self-stretch bg-teal-100" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-teal-900">{formatDiscountLabel(offer)}</p>
                  <p className="text-xs text-gray-600 truncate">
                    {offer.minOrderAmount ? `Min. Spend \u09F3${offer.minOrderAmount}` : ""}
                    {offer.maxDiscountAmount ? ` | Max Discount \u09F3${offer.maxDiscountAmount}` : ""}
                  </p>
                  <p className="text-[11px] text-gray-400">
                    *T&C Apply
                    {offer.validFrom &&
                      ` \u00B7 ${formatOfferDate(offer.validFrom)} - ${formatOfferDate(offer.validTo)}`}
                  </p>
                </div>
                <Button
                  size="sm"
                  disabled={collectedIds.includes(offer.id)}
                  onClick={() => handleCollect(offer.id)}
                  className="bg-teal-700 hover:bg-teal-800 text-white rounded-full px-4 flex-shrink-0"
                >
                  {collectedIds.includes(offer.id) ? "Collected" : "Collect"}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// =============================
// RELATED PRODUCTS
// =============================

const RelatedProducts = ({ productId }: { productId: string }) => {
  const { data, isLoading } = useGetRelatedProductsQuery({ productId, limit: 10 });
  const products = data || [];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="w-full aspect-square rounded-lg" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (!products.length) return null;

  return (
    <div>
      <h3 className="text-lg font-semibold text-teal-900 mb-4">Related Products</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {/* Shared global product card (real link, same design as every listing). */}
        {products.map((p: any) => (
          <SharedProductCard
            key={p.id}
            product={p}
            imageSizes="(max-width: 639px) 50vw, (max-width: 767px) 33vw, (max-width: 1023px) 25vw, 20vw"
          />
        ))}
      </div>
    </div>
  );
};

// =============================
// MAIN COMPONENT
// =============================

interface SingleProductClientProps {
  initialProduct: any;
}

const SingleProductClient: React.FC<SingleProductClientProps> = ({ initialProduct }) => {
  const product = initialProduct;
  // Business Advisor: one genuine product-page view (deduplicated per session).
  useTrackProductView(product?.id, "PRODUCT_PAGE");

  const [selectedImg, setSelectedImg] = useState<string | null>(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<TabType>(TabType.DESCRIPTION);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);

  // FIX: remembers which cart action ("buy" or "cart") the user attempted
  // while logged out, so it can be retried automatically after login.
  const pendingCartActionRef = useRef<"buy" | "cart" | null>(null);

  const { user, accessToken } = useSelector((state: RootState) => state.auth);
  const isAuthenticated = !!user && !!accessToken;

  const [addToCart, { isLoading: isAddingToCart, error: addToCartError, reset: resetAddToCart }] =
    useAddToCartMutation();
  const [addToWishlist] = useAddToWishlistMutation();
  const [removeFromWishlist] = useRemoveFromWishlistMutation();
  const [triggerCheckWishlist, { data: wishlistCheck }] = useLazyCheckInWishlistQuery();

  const { data: offersData } = useGetOffersForProductQuery(product?.id, {
    skip: !product?.id,
  });
  const offers = offersData?.data || [];
  const flashSaleOffer = offers.find(
    (o) => (o.type === "FLASH_SALE" || o.type === "COUNTDOWN_DEAL") && o.countdownConfig
  );
  const hasFreeShipping = offers.some((o) => o.type === "FREE_SHIPPING") || !!product?.freeShipping;

  const variant = product?.variants?.find((v: any) => v.id === selectedVariantId) || product?.variants?.[0];
  const variantId = variant?.id;
  const isInWishlist = wishlistCheck?.data?.inWishlist || false;
  const wishlistItemId = wishlistCheck?.data?.itemId;

  const productImages = product ? getProductImages(product) : [];
  const breadcrumbs = useMemo(() => getBreadcrumbs(product), [product]);

  // FIX: the public product-detail API does NOT return `variant.warehouseStock`
  // (that per-warehouse breakdown is only in the vendor/admin management
  // payload — see ProductRepository.detailInclude). Reading it here always
  // evaluated to `undefined`, so totalStock was permanently 0 regardless of
  // actual stock, which disabled Buy Now/Add to Cart and showed
  // "Out of Stock" even for in-stock products.
  //
  // Use the denormalized scalar fields the backend actually sends instead:
  // available = stock - reservedQty - damagedQty.
  const totalStock = useMemo(() => {
    if (!variant) return 0;
    const available = (variant.stock || 0) - (variant.reservedQty || 0) - (variant.damagedQty || 0);
    return Math.max(0, available);
  }, [variant]);

  const averageRating = product?.reviewSummary?.averageRating || 0;
  const reviewCount = product?.reviewSummary?.totalReviews || 0;
  const ratingDistribution = product?.reviewSummary?.ratingDistribution || [];

  useEffect(() => {
    if (productImages.length > 0) setSelectedImg(productImages[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product]);

  useEffect(() => {
    if (product?.id && variantId && isAuthenticated) {
      triggerCheckWishlist({ productId: product.id, variantId });
    }
  }, [product?.id, variantId, isAuthenticated, triggerCheckWishlist]);

  useEffect(() => {
    if (addToCartError) {
      const errorData: any = addToCartError;
      if (errorData?.status === 401 || errorData?.status === 403) {
        toast.error("Session expired. Please login again.");
        setIsLoginModalOpen(true);
      } else {
        toast.error(errorData?.data?.message || "Failed to add to cart");
      }
      resetAddToCart();
    }
  }, [addToCartError, resetAddToCart]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    setHoverPos({
      x: ((e.pageX - left - window.scrollX) / width) * 100,
      y: ((e.pageY - top - window.scrollY) / height) * 100,
    });
  };

  const handleVariantSelect = (v: any) => {
    setSelectedVariantId(v.id);
    // Bugfix: selecting a variant now also swaps the main/preview image
    const variantImage = v.images?.[0]?.url;
    if (variantImage) setSelectedImg(variantImage);
    setQuantity(1);
  };

  // Shared add-to-cart flow (used both directly and after login).
  const performCartAction = async (buyNow: boolean) => {
    if (!variantId) {
      toast.error("Please select a variant");
      return;
    }

    try {
      // source: tells Business Advisor whether this add came from "Buy Now" (direct path)
      await addToCart({ productId: product.id, variantId, quantity, notes: "", source: buyNow ? "BUY_NOW" : "PRODUCT_PAGE" }).unwrap();
      toast.success("Added to cart!");
      if (buyNow) window.location.href = "/cart";
    } catch (error) {
      console.error(error);
    }
  };

  const handleCartAction = async (buyNow: boolean = false) => {
    // Not logged in → remember the intended action and show the login modal.
    // After a successful login the pending action is retried automatically.
    if (!isAuthenticated) {
      pendingCartActionRef.current = buyNow ? "buy" : "cart";
      setIsLoginModalOpen(true);
      return;
    }
    await performCartAction(buyNow);
  };

  const handleWishlistToggle = async () => {
    if (!isAuthenticated) {
      setIsLoginModalOpen(true);
      return;
    }
    if (isWishlistLoading) return;
    setIsWishlistLoading(true);

    try {
      if (isInWishlist && wishlistItemId) {
        await removeFromWishlist(wishlistItemId).unwrap();
        toast.success("Removed from wishlist");
      } else {
        await addToWishlist({
          productId: product.id,
          variantId: variantId || undefined,
          priority: 1,
          notes: "",
          notifyOnDiscount: true,
          notifyOnRestock: true,
        }).unwrap();
        toast.success("Added to wishlist");
      }
      triggerCheckWishlist({ productId: product.id, variantId });
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to update wishlist");
    } finally {
      setIsWishlistLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Could not copy link");
    }
  };

  const price = parseFloat(variant?.price) || 0;
  const specialPrice = variant?.specialPrice ? parseFloat(variant.specialPrice) : null;
  // Approved rule: the special price is the selling price only when 0 < special < price.
  const shownPrice = effectivePrice(price, specialPrice);
  const sku = variant?.sku || product?.sku;

  const renderTabContent = () => {
    switch (activeTab) {
      case TabType.DESCRIPTION:
        return (
          <div
            className="p-6 bg-white rounded-lg prose prose-sm md:prose-base max-w-none"
            dangerouslySetInnerHTML={{
              __html:
                product?.description ||
                "<p class='text-gray-500 italic'>No description available.</p>",
            }}
          />
        );
     case TabType.SPECIFICATIONS:
  return (
    <div className="p-6 bg-white rounded-lg">
      <h3 className="text-xl font-semibold mb-6 text-teal-900">Specifications</h3>
      <table className="min-w-full divide-y divide-gray-100">
        <tbody className="divide-y divide-gray-100">
          {product?.attributes?.length > 0 ? (
            product.attributes.map((spec: any, i: number) => {
              // FIX: ProductAttribute stores the value in a different field
              // depending on the attribute's type. `attributeValue` is only
              // populated for SELECT-type attributes (attributeValueId set);
              // NUMBER/TEXT/BOOLEAN types store their value in
              // valueNumber/valueString/valueBoolean instead. The old code
              // only ever read `spec.attributeValue?.value`, which is null
              // for every NUMBER/BOOLEAN attribute — so only the unit showed.
              let displayValue: string;
              if (spec.attributeValue?.value != null) {
                displayValue = spec.attributeValue.value;
              } else if (spec.valueNumber != null) {
                displayValue = String(spec.valueNumber);
              } else if (spec.valueBoolean != null) {
                displayValue = spec.valueBoolean ? "Yes" : "No";
              } else if (spec.valueString != null) {
                displayValue = spec.valueString;
              } else {
                displayValue = "-";
              }

              return (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 bg-gray-50 w-1/3">
                    {spec.attribute?.name || "Unknown"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {displayValue}
                    {spec.attribute?.unit ? ` ${spec.attribute.unit}` : ""}
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={2} className="px-4 py-8 text-center text-gray-400">
                No specifications available.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
      case TabType.REVIEWS:
        return (
          <div className="p-6 bg-white rounded-lg">
            <h3 className="text-xl font-semibold mb-6 text-teal-900">Customer Reviews</h3>
            <div className="flex items-center gap-6 mb-8 p-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-900">{averageRating.toFixed(1)}</div>
                <div className="flex items-center justify-center mt-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.round(averageRating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "fill-gray-200 text-gray-200"
                      }`}
                    />
                  ))}
                </div>
                <div className="text-sm text-gray-500 mt-1">Based on {reviewCount} reviews</div>
              </div>
              <div className="flex-1">
                {[5, 4, 3, 2, 1].map((stars) => {
                  const dist = ratingDistribution.find((d: any) => d.star === stars);
                  return (
                    <div key={stars} className="flex items-center gap-2 mb-1">
                      <div className="flex items-center gap-1 w-16">
                        <span className="text-sm">{stars}</span>
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      </div>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-yellow-400"
                          style={{ width: `${dist?.percentage || 0}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-500 w-10 text-right">
                        {dist?.count || 0}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            <Button
              onClick={() => {
                if (!isAuthenticated) {
                  setIsLoginModalOpen(true);
                  return;
                }
                document.getElementById("product-reviews")?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="mt-6 bg-teal-800 hover:bg-teal-900"
            >
              <MessageSquare className="w-4 h-4 mr-2" /> Write a Review
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  // NOTE: no `if (!product) return <ProductSkeleton />` here anymore.
  // `page.tsx` is a Server Component that awaits the product fetch (and
  // calls notFound() on failure) before this component ever mounts, and
  // app/products/[id]/loading.tsx now covers that entire wait with a
  // route-level skeleton. So `product` is guaranteed to be present by the
  // time this renders — that early-return was dead code.

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <Breadcrumb items={breadcrumbs} />
      </div>

      <div className="border-t border-gray-100" />

      <section className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left — Gallery */}
        <div className="relative">
          <div
            className="relative border border-gray-100 rounded-lg overflow-hidden bg-white aspect-square md:h-[420px] md:aspect-auto cursor-crosshair"
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            {selectedImg && (
              <ProductImage
                src={selectedImg}
                alt={product.name}
                fill
                className="object-contain"
                priority
              />
            )}
          </div>

          {/* Zoom preview — floats beside the main image, desktop only */}
          {isHovering && selectedImg && (
            <div
              className="hidden lg:block absolute top-0 left-full ml-4 w-[420px] h-[420px] border border-gray-100 rounded-lg bg-white shadow-xl z-30 pointer-events-none"
              style={{
                backgroundImage: `url(${selectedImg})`,
                backgroundSize: "200%",
                backgroundPosition: `${hoverPos.x}% ${hoverPos.y}%`,
                backgroundRepeat: "no-repeat",
              }}
            />
          )}

          <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
            {productImages.map((img, i) => (
              <button
                key={i}
                onClick={() => setSelectedImg(img)}
                className={`flex-shrink-0 border-2 rounded-md p-1 transition-all ${
                  selectedImg === img
                    ? "border-teal-700 scale-105"
                    : "border-gray-200 hover:border-teal-400"
                }`}
              >
                <ProductImage
                  src={img}
                  alt={`Thumbnail ${i}`}
                  width={64}
                  height={64}
                  className="w-14 h-14 object-contain"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Right — Details, hairline-separated rows */}
        <div className="text-gray-800 divide-y divide-gray-100">
          {/* Title + rating + share/wishlist icons */}
          <div className="pb-3 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                {product.vendor?.verificationStatus === "VERIFIED" && (
                  <span className="inline-flex items-center gap-1 text-xs bg-teal-900 text-white px-2 py-0.5 rounded-full mb-2">
                    <ShieldCheck className="w-3 h-3" /> Verified
                  </span>
                )}
                <h1 className="text-xl sm:text-2xl font-bold text-teal-900 leading-snug">
                  {product.name}
                </h1>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={handleShare}
                  className="p-2 rounded-full text-gray-400 hover:text-teal-700 hover:bg-gray-50"
                  aria-label="Share"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                <button
                  onClick={handleWishlistToggle}
                  disabled={isWishlistLoading}
                  className="p-2 rounded-full text-gray-400 hover:text-pink-600 hover:bg-gray-50"
                  aria-label="Wishlist"
                >
                  <Heart className={`w-4 h-4 ${isInWishlist ? "fill-pink-600 text-pink-600" : ""}`} />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < Math.round(averageRating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "fill-gray-200 text-gray-200"
                  }`}
                />
              ))}
              <span className="text-sm font-medium text-gray-700">{averageRating.toFixed(1)}</span>
              <span className="text-sm text-teal-700">{reviewCount} Ratings</span>
            </div>
          </div>

          {/* Brand + free shipping */}
          <div className="py-3 flex items-center justify-between text-sm">
            <span>
              Brand: <span className="text-teal-700 font-medium">{product.brand?.name || "No Brand"}</span>
            </span>
            {hasFreeShipping && <span className="text-teal-700 font-medium">Free Shipping</span>}
          </div>

          {/* Flash sale banner */}
          {flashSaleOffer && (
            <div className="py-3">
              <FlashSaleBanner offer={flashSaleOffer} />
            </div>
          )}

          {/* Price + stock */}
          <div className="py-3 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <span className="text-2xl font-semibold text-teal-900">৳{shownPrice.price}</span>
              {shownPrice.discounted && <span className="line-through text-gray-400">৳{price}</span>}
              {shownPrice.discounted && variant?.discount && (
                <span className="text-xs font-semibold text-teal-800 bg-teal-50 px-2 py-1 rounded-full">
                  -{variant.discount}%
                </span>
              )}
            </div>
            <span
              className={`text-sm font-medium ${totalStock > 0 ? "text-green-600" : "text-red-500"}`}
            >
              {totalStock > 0 ? `In Stock (${totalStock})` : "Out of Stock"}
            </span>
          </div>

          {/* Voucher — hidden field automatically when there's no offer */}
          <VoucherSection offers={offers} sku={sku} />

          {/* Variants */}
          {product.variants?.length > 1 && (
            <div className="py-3">
              {/* FIX: label was "Color:" but these are spec variants
                  (RAM/Storage/Warranty combos), not colors. */}
              <h4 className="text-sm text-gray-500 mb-2">Options:</h4>
              <div className="flex gap-3 flex-wrap">
                {product.variants.map((v: any) => {
                  // FIX: build a unit-aware label from v.attributes
                  // ("8GB / 256GB / 1 Year") instead of using v.name
                  // as-is, which the backend bakes without units
                  // ("8 / 256 / 1 Year").
                  const specLabel = getVariantSpecLabel(v);

                  return (
                    <button
                      key={v.id}
                      onClick={() => handleVariantSelect(v)}
                      className="flex flex-col items-center gap-1"
                    >
                      <span
                        className={`border-2 rounded-lg p-1 transition-all ${
                          v.id === variantId
                            ? "border-teal-700"
                            : "border-gray-200 hover:border-teal-400"
                        }`}
                      >
                        <ProductImage
                          src={v.images?.[0]?.url || productImages[0]}
                          alt={specLabel || v.name}
                          width={44}
                          height={44}
                          className="object-contain w-11 h-11"
                        />
                      </span>
                      <span
                        className="text-xs text-gray-600 max-w-[80px] truncate"
                        title={specLabel || v.name}
                      >
                        {specLabel || v.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="py-3">
            <h4 className="text-sm text-gray-500 mb-2">Quantity</h4>
            <div className="flex items-center border border-gray-200 rounded-lg w-fit">
              <button
                className="px-3 py-2 hover:bg-gray-50 rounded-l-lg disabled:opacity-40"
                onClick={() => setQuantity((p) => (p > 1 ? p - 1 : 1))}
                disabled={quantity <= 1}
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="px-4 py-2 border-x border-gray-200">{quantity}</span>
              <button
                className="px-3 py-2 hover:bg-gray-50 rounded-r-lg disabled:opacity-40"
                onClick={() => setQuantity((p) => (totalStock ? Math.min(totalStock, p + 1) : p + 1))}
                disabled={totalStock > 0 && quantity >= totalStock}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Buy buttons */}
          <div className="py-3 flex gap-3">
            <Button
              onClick={() => handleCartAction(true)}
              disabled={isAddingToCart || totalStock <= 0}
              className="bg-teal-800 hover:bg-teal-900 text-white flex-1 py-3"
            >
              {isAddingToCart ? "Processing..." : "Buy Now"}
            </Button>
            <Button
              onClick={() => handleCartAction(false)}
              disabled={isAddingToCart || totalStock <= 0}
              variant="outline"
              className="border-teal-800 text-teal-800 hover:bg-teal-50 flex-1 py-3"
            >
              <ShoppingCart className="w-4 h-4 mr-2" /> Add to Cart
            </Button>
          </div>

          {/* Sold by */}
          <div className="py-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Sold by</h3>
            </div>
            <p className="text-sm text-gray-700 mt-1">{product.vendor?.storeName || "Unknown Seller"}</p>
            <div className="flex gap-2 pt-2">
              {product.vendor && (
                <VendorChatButton
                  vendorId={product.vendor.id}
                  vendorName={product.vendor.storeName}
                  vendorAvatar={product.vendor.avatar}
                  productId={product.id}
                  productName={product.name}
                />
              )}
              {product.vendor?.id ? (
                <Button variant="outline" size="sm" asChild className="flex items-center gap-1 text-xs">
                  <Link href={`/store/${product.vendor.id}`}>
                    <Store className="w-4 h-4" /> Visit Store
                    <span className="sr-only"> — {product.vendor?.storeName}</span>
                  </Link>
                </Button>
              ) : (
                <Button variant="outline" size="sm" disabled className="flex items-center gap-1 text-xs">
                  <Store className="w-4 h-4" /> Visit Store
                </Button>
              )}
            </div>
          </div>

          {/* Warranty */}
          <div className="py-3 space-y-2">
            <h3 className="font-semibold text-sm">Warranty &amp; Returns</h3>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <RotateCcw className="w-4 h-4 flex-shrink-0" />
              <span>7 Day Return Policy</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span>
                {product.warranty?.type === "NO_WARRANTY"
                  ? "No Warranty"
                  : `${product.warranty?.duration} ${product.warranty?.unit} Warranty`}
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="border-t border-gray-100" />

      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="border-b border-gray-100 mb-6">
          <nav className="flex gap-2">
            {Object.values(TabType).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-sm font-medium rounded-t-lg transition-colors ${
                  activeTab === tab
                    ? "border-b-2 border-teal-800 text-teal-900"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>
        {renderTabContent()}
      </section>

      <div className="border-t border-gray-100" />

      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="border-t border-gray-100" />
        <ProductReviews
          productId={product.id}
          summary={product.reviewSummary}
          isAuthenticated={isAuthenticated}
          onRequireAuth={() => setIsLoginModalOpen(true)}
        />
        <RelatedProducts productId={product.id} />
      </section>

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => {
          // user dismissed the modal — drop any pending cart action
          pendingCartActionRef.current = null;
          setIsLoginModalOpen(false);
        }}
        onLoginSuccess={() => {
          toast.success("Login successful!");
          setIsLoginModalOpen(false);
          // FIX: retry the Buy Now / Add to Cart the user attempted before login
          const pending = pendingCartActionRef.current;
          pendingCartActionRef.current = null;
          if (pending) {
            // run on the next tick so the fresh token is in the store
            setTimeout(() => performCartAction(pending === "buy"), 0);
          }
        }}
        message="Please login to continue"
      />
    </div>
  );
};

export default SingleProductClient;