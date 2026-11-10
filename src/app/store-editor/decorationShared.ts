// @/features (or wherever this project keeps shared, non-component logic) —
// src/app/store-editor/decorationShared.ts
//
// Pure helpers shared between:
//   - the store editor (page.tsx / ConfigurationForm.tsx / PreviewArea.tsx),
//     which needs them to create components, resolve a saved component back
//     to the right frontend module type, and hydrate formData from the
//     backend on load; and
//   - the PUBLIC storefront page (app/store/[vendorId]/page.tsx), which
//     needs the exact same "backend component -> {type, formData}"
//     conversion to render a vendor's published decoration for customers.
//
// Extracted out of page.tsx so both call sites use ONE implementation —
// duplicating this logic risked the two pages silently drifting apart
// (e.g. the storefront rendering a component differently than the editor
// previewed it).
//
// No React/JSX here — plain TypeScript only, safe to import from server or
// client components alike.

import { ComponentType } from "@/features/storeEditorApi";

export const TYPE_TO_COMPONENT_TYPE: Record<string, ComponentType> = {
  categoryBar:              ComponentType.STORE_BANNER,
  graphicCarousel:          ComponentType.BANNER,
  graphicThreeImages:       ComponentType.BANNER,
  graphicOneImage:          ComponentType.BANNER,
  // ← previously missing: dragging these onto the canvas silently did
  // nothing past the local preview — addComponent() was never called, so
  // dbComponentId stayed undefined forever and "Save changes" sat on
  // "Waiting for server…" indefinitely. The banner-grid variants all share
  // ComponentType.BANNER (like the three above); the product-list variants
  // reuse the closest existing enum value since the backend only defines
  // 9 ComponentType values total.
  fourBannersA:             ComponentType.BANNER,
  fiveBannersA:             ComponentType.BANNER,
  graphicMultiImages:       ComponentType.BANNER,
  countdownProduct:         ComponentType.COUNTDOWN_TIMER,
  carouselProductRecommend: ComponentType.PRODUCT_CAROUSEL,
  sliderRecommend:          ComponentType.PRODUCT_CAROUSEL,
  productRecommendation:    ComponentType.PRODUCT_GRID,
  threeColumnProducts:      ComponentType.PRODUCT_GRID,
  productPromotion:         ComponentType.FEATURED_PRODUCTS,
  voucher:                  ComponentType.VOUCHER_PROMOTION,
  brandList:                ComponentType.CATEGORY_SLIDER,
  categoryAuto:             ComponentType.CATEGORY_GRID,
};

export const COMPONENT_TYPE_TO_MODULE: Record<ComponentType, { type: string; name: string; icon: string }> = {
  [ComponentType.STORE_BANNER]:      { type: "categoryBar",              name: "Category bar",             icon: "//id-live.slatic.net/original/7075aee0e853ad8e1042f3a3cfcccdaa.png" },
  [ComponentType.BANNER]:            { type: "graphicCarousel",          name: "Banner Carousel",           icon: "https://img.alicdn.com/imgextra/i1/O1CN01jXJ1ln1XYHH3YYADF_!!6000000002935-2-tps-72-73.png" },
  [ComponentType.COUNTDOWN_TIMER]:   { type: "countdownProduct",         name: "Countdown Products",        icon: "https://img.alicdn.com/imgextra/i1/O1CN01rPIhBB29LrwPfWVjR_!!6000000008052-2-tps-72-72.png" },
  [ComponentType.PRODUCT_CAROUSEL]:  { type: "carouselProductRecommend", name: "Products Carousel",         icon: "https://img.alicdn.com/imgextra/i2/O1CN01dWvm7F1lwvCeEJVm3_!!6000000004884-2-tps-72-72.png" },
  [ComponentType.PRODUCT_GRID]:      { type: "productRecommendation",    name: "Product Recommendation",    icon: "https://img.alicdn.com/imgextra/i1/O1CN01yA59ze1UDGFbMnQpX_!!6000000002483-2-tps-72-72.png" },
  [ComponentType.VOUCHER_PROMOTION]: { type: "voucher",                  name: "Voucher",                   icon: "https://img.alicdn.com/imgextra/i4/O1CN01uP1UbS1Jx67M1QR0L_!!6000000001094-2-tps-72-72.png" },
  [ComponentType.CATEGORY_SLIDER]:   { type: "brandList",                name: "Category List",             icon: "https://img.alicdn.com/imgextra/i2/O1CN01uaqewq1m3KkZnwwrP_!!6000000004898-2-tps-72-73.png" },
  [ComponentType.CATEGORY_GRID]:     { type: "categoryAuto",             name: "Smart Category Navigation", icon: "https://img.alicdn.com/imgextra/i4/O1CN01TEAeTy1x10VqTecnr_!!6000000006382-2-tps-72-72.png" },
  [ComponentType.FEATURED_PRODUCTS]: { type: "productPromotion",         name: "Product Highlights",        icon: "https://img.alicdn.com/imgextra/i2/O1CN01wQxPMu1OSTiWYg7wy_!!6000000001704-2-tps-72-72.png" },
};

// ─── Variant disambiguation ─────────────────────────────────────────────────
// Several frontend module types share ONE backend ComponentType, because the
// backend enum only has 9 values total (BANNER covers graphicCarousel /
// graphicThreeImages / graphicOneImage / fourBannersA / fiveBannersA /
// graphicMultiImages; PRODUCT_CAROUSEL covers carouselProductRecommend /
// sliderRecommend; PRODUCT_GRID covers productRecommendation /
// threeColumnProducts). A flat `ComponentType → module type` table like
// COMPONENT_TYPE_TO_MODULE above can only ever resolve to ONE of those on
// reload — e.g. every BANNER-type component would silently reappear as
// "Banner Carousel" after a refresh, even if it was actually a FiveBanners.
//
// Fix: every new component now also saves which exact frontend type it is
// into `config.settings.moduleVariant` (see the addComponent calls below).
// MODULE_META has name/icon for every frontend type id so the resolver can
// rebuild the full { type, name, icon } tuple from that variant string.
// Components created BEFORE this fix won't have moduleVariant set, so they
// safely fall back to the old flat-table behaviour (unchanged for them).
export const MODULE_META: Record<string, { name: string; icon: string }> = {
  categoryBar:              { name: "Category bar",                    icon: "//id-live.slatic.net/original/7075aee0e853ad8e1042f3a3cfcccdaa.png" },
  countdownProduct:         { name: "Countdown Products",               icon: "https://img.alicdn.com/imgextra/i1/O1CN01rPIhBB29LrwPfWVjR_!!6000000008052-2-tps-72-72.png" },
  brandList:                { name: "Category List",                   icon: "https://img.alicdn.com/imgextra/i2/O1CN01uaqewq1m3KkZnwwrP_!!6000000004898-2-tps-72-73.png" },
  categoryAuto:             { name: "Smart Category Navigation",       icon: "https://img.alicdn.com/imgextra/i4/O1CN01TEAeTy1x10VqTecnr_!!6000000006382-2-tps-72-72.png" },
  graphicThreeImages:       { name: "Three banners",                   icon: "https://img.alicdn.com/imgextra/i3/O1CN01jm3FKE1rlMuQPP8cj_!!6000000005671-2-tps-72-73.png" },
  graphicOneImage:          { name: "Single Banner",                   icon: "https://img.alicdn.com/imgextra/i3/O1CN01FHanhX1YBfKqdYp5p_!!6000000003021-2-tps-72-73.png" },
  graphicCarousel:          { name: "Banner Carousel",                 icon: "https://img.alicdn.com/imgextra/i1/O1CN01jXJ1ln1XYHH3YYADF_!!6000000002935-2-tps-72-73.png" },
  graphicMultiImages:       { name: "Multiple banners",                icon: "https://img.alicdn.com/imgextra/i3/O1CN01YYCWdk1SfXTXmMY3y_!!6000000002274-2-tps-72-73.png" },
  fourBannersA:             { name: "Four Banners A",                  icon: "https://img.alicdn.com/imgextra/i4/O1CN01fkakT21Bxzy4D28Dj_!!6000000000013-2-tps-72-73.png" },
  fiveBannersA:             { name: "Five banners A",                  icon: "https://img.alicdn.com/imgextra/i3/O1CN01dcCTVz1sjpBvUpvLH_!!6000000005803-2-tps-72-73.png" },
  carouselProductRecommend: { name: "Products Carousel",               icon: "https://img.alicdn.com/imgextra/i2/O1CN01dWvm7F1lwvCeEJVm3_!!6000000004884-2-tps-72-72.png" },
  productRecommendation:    { name: "Product Recommendation",          icon: "https://img.alicdn.com/imgextra/i1/O1CN01yA59ze1UDGFbMnQpX_!!6000000002483-2-tps-72-72.png" },
  sliderRecommend:          { name: "Slider Product Recommendation",   icon: "https://img.alicdn.com/imgextra/i1/O1CN01nkrYf41RTnhzHvTyE_!!6000000002113-2-tps-72-72.png" },
  productPromotion:         { name: "Product Highlights",              icon: "https://img.alicdn.com/imgextra/i2/O1CN01wQxPMu1OSTiWYg7wy_!!6000000001704-2-tps-72-72.png" },
  threeColumnProducts:      { name: "Three Columns Products List",     icon: "https://img.alicdn.com/imgextra/i2/O1CN01zVzTM01yHKF13lWhZ_!!6000000006553-2-tps-72-72.png" },
  voucher:                  { name: "Voucher",                         icon: "https://img.alicdn.com/imgextra/i4/O1CN01uP1UbS1Jx67M1QR0L_!!6000000001094-2-tps-72-72.png" },
};

export function resolveModuleMeta(c: { type: ComponentType; config?: { settings?: Record<string, unknown> | null } | null }) {
  const variant = c.config?.settings?.moduleVariant as string | undefined;
  if (variant && MODULE_META[variant]) {
    return { type: variant, ...MODULE_META[variant] };
  }
  return COMPONENT_TYPE_TO_MODULE[c.type];
}

// Default style values for a brand-new, unsynced Store Header so it always
// renders correctly even before any backend config exists.
//
// IMPORTANT: these intentionally mirror StoreHeader's own internal default
// values (componentspreview/StoreHeader.tsx) exactly — a dark navy band with
// white text and amber/orange accents. Don't change these without also
// checking StoreHeader's destructuring defaults, or the two will diverge.
export const DEFAULT_HEADER_FORM_DATA: Record<string, any> = {
  headerBgColor: "#0f172a",
  headerBgImageMobile: undefined,
  headerBgImageDesktop: undefined,
  headerOverlayOpacity: 0,
  storeNameColor: "#ffffff",
  followersColor: "#cbd5e1",
  iconsColor: "#f59e0b",
  logoRingColor: "#ffffff",
  chatButtonColor: "#f97316",
  chatButtonTextColor: "#ffffff",
  showLogo: true,
  showStoreName: true,
  showFollowers: true,
  showRating: true,
  showVerifiedBadge: true,
  showChatButton: true,
  isVisible: true,
};

// ─── Helper: build formData from a backend component ─────────────────────────

function formatMoney(n?: number | null) {
  if (n === undefined || n === null) return undefined;
  return `৳${Number(n).toLocaleString()}`;
}

/** DecorationComponentProduct[] (from getDecoration) → the display shape
 *  ConfigurationForm / preview components expect (PickedProduct-ish). This
 *  is what re-hydrates a component's targeted products after a page reload
 *  — previously `c.products` was never read at all here, so any products
 *  picked in a prior session silently vanished from the UI on reload (even
 *  though they were still correctly saved in the DB). */
export function productsToFormData(products?: Array<{
  productId: string;
  sortOrder: number;
  product: {
    id: string;
    name: string;
    slug: string;
    images?: { url: string }[];
    variants?: { price: number; specialPrice?: number; sku: string }[];
  };
}>): any[] {
  if (!products || products.length === 0) return [];
  return [...products]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(({ product }) => {
      const variant  = product.variants?.[0];
      const price    = variant?.specialPrice ?? variant?.price;
      const original = variant?.specialPrice ? variant?.price : undefined;
      const discount =
        original && price ? `-${Math.round(100 - (price / original) * 100)}%` : undefined;
      return {
        id:            product.id,
        name:          product.name,
        slug:          product.slug,
        image:         product.images?.[0]?.url,
        price:         formatMoney(price),
        originalPrice: formatMoney(original),
        discount,
      };
    });
}

/** Same idea as productsToFormData, for DecorationComponentCategory[]. */
export function categoriesToFormData(categories?: Array<{
  categoryId: string;
  sortOrder: number;
  category: { id: string; name: string; slug: string; image?: string | null };
}>): any[] {
  if (!categories || categories.length === 0) return [];
  return [...categories]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(({ category }) => ({
      id:    category.id,
      name:  category.name,
      slug:  category.slug,
      image: category.image ?? undefined,
    }));
}

export function componentToFormData(c: {
  isVisible: boolean;
  config?: {
    autoSlide?: boolean;
    slideInterval?: number | null;
    countdownEndDate?: string | null;
    showProductPrice?: boolean;
    showProductRating?: boolean;
    showAddToCart?: boolean;
    bannerImage?: string | null;
    settings?: Record<string, unknown> | null;
  } | null;
  products?: Parameters<typeof productsToFormData>[0];
  categories?: Parameters<typeof categoriesToFormData>[0];
}): Record<string, any> {
  const cfg      = c.config ?? {};
  const settings = (cfg.settings as Record<string, unknown>) ?? {};

  // settings.bannerImages is stored as BannerImage[] ({ url, link, alt })
  // to match the schema, but BannerCarosoel.tsx / ThreeBanners.tsx /
  // MultipleBanner.tsx (and the BannerImagesEditor form control) work with
  // plain url strings — convert back here, then let the explicit
  // `bannerImages` below win over whatever shape briefly lands from the
  // `...settings` spread. Order doesn't carry meaning for these components
  // (every slot looks the same), so it's fine to drop empty slots.
  const rawBannerImages = settings.bannerImages as Array<{ url?: string } | string> | undefined;
  const bannerImages = rawBannerImages?.map((b) => (typeof b === "string" ? b : b?.url)).filter(Boolean) as string[] | undefined;

  // settings.slotImages is the FourBanners/FiveBanners equivalent, but each
  // index is a fixed, differently-styled position — nulls/holes must be
  // preserved (NOT filtered out) or every later banner shifts into the
  // wrong slot.
  const rawSlotImages = settings.slotImages as Array<{ url?: string } | string | null> | undefined;
  const slotImages = rawSlotImages?.map((b) => (!b ? undefined : typeof b === "string" ? b : b.url));

  return {
    isVisible:         c.isVisible ?? true,
    autoSlide:         cfg.autoSlide,
    slideInterval:     cfg.slideInterval,
    countdownEndDate:  cfg.countdownEndDate,
    showProductPrice:  cfg.showProductPrice,
    showProductRating: cfg.showProductRating,
    showAddToCart:     cfg.showAddToCart,
    bannerImage:       cfg.bannerImage,
    // Spreads everything from settings:
    // headerBgColor, storeNameColor, chatButtonColor, title, voucherTitle,
    // bannerHeight, bannerImageMobile/Desktop, titles, subtitles, etc.
    ...settings,
    // These override whatever came out of the raw settings spread above,
    // since they need shape conversion rather than a straight pass-through.
    bannerImages: bannerImages ?? [],
    slotImages:   slotImages ?? [],
    products:     productsToFormData(c.products),
    categories:   categoriesToFormData(c.categories),
  };
}