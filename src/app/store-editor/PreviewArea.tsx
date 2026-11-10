import React, { useState } from "react";
import { CountdownProducts } from "./componentspreview/CountdownProducts";
import {
  StoreHeader,
  StoreHeaderStyles,
} from "./componentspreview/StoreHeader";
import { SingleBanner } from "./componentspreview/SingleBanner";
import { ThreeBanners } from "./componentspreview/ThreeBanners";
import { FourBanners } from "./componentspreview/FourBanners";
import { FiveBanners } from "./componentspreview/FiveBanners";
import { MultipleBanners } from "./componentspreview/MultipleBanner";
import { ActiveModule } from "./page";
import { BannerCarousel } from "./componentspreview/BannerCarosoel";
import { DropZone } from "./DropZone";
import { ComponentHandler } from "./ComponentHandler";
import { ProductsCarousel } from "./componentspreview/ProductCarosoel";
import { ProductRecommendation } from "./componentspreview/ProductRecommendation";
import { SliderProduct } from "./componentspreview/SliderProduct";
import { CategoryList } from "./componentspreview/CategoryList";
import { SmartCategory } from "./componentspreview/SmartCategory";
import { ThreeColumnsProducts } from "./componentspreview/ThreeColumnsProducts";
import { Voucher } from "./componentspreview/Voucher";
import ProductHighlight from "./componentspreview/ProductHighlight";

interface PreviewAreaProps {
  activeModules: ActiveModule[];
  onModuleDrop: (moduleId: string, position: number) => void;
  selectedModuleId: string | null;
  onModuleSelect: (module: ActiveModule) => void;
  onMoveUp: (moduleId: string) => void;
  onMoveDown: (moduleId: string) => void;
  onCopy: (moduleId: string) => void;
  onDelete: (moduleId: string) => void;
  currentView: "mobile" | "desktop";
  /** Live form data for every module, keyed by module.id */
  formDataMap: Record<string, any>;
}

const COMPONENT_MAP = {
  categoryBar: StoreHeader,
  brandList: CategoryList,
  categoryAuto: SmartCategory,
  graphicThreeImages: ThreeBanners,
  countdownProduct: CountdownProducts,
  graphicCarousel: BannerCarousel,
  graphicOneImage: SingleBanner,
  fourBannersA: FourBanners,
  fiveBannersA: FiveBanners,
  graphicMultiImages: MultipleBanners,
  carouselProductRecommend: ProductsCarousel,
  productRecommendation: ProductRecommendation,
  sliderRecommend: SliderProduct,
  productPromotion: ProductHighlight,
  threeColumnProducts: ThreeColumnsProducts,
  voucher: Voucher,
} as const;

type ModuleType = keyof typeof COMPONENT_MAP;

// Hard-coded fallback values so the Store Header always renders fully
// styled — even on the very first paint of a brand-new store, before any
// backend config or formDataMap entry exists for it yet.
//
// IMPORTANT: these must match StoreHeader's own internal default values
// (see componentspreview/StoreHeader.tsx) exactly. StoreHeader applies its
// defaults via destructuring (`headerBgColor = "#0f172a"`, etc.), which only
// kicks in when a field is `undefined`. If this layer supplies a *different*
// default for the same field, it overrides StoreHeader's intended default
// and the two layers fall out of sync (e.g. a white header instead of the
// intended dark navy one).
const DEFAULT_HEADER_STYLES: Required<
  Pick<
    StoreHeaderStyles,
    | "headerBgColor"
    | "headerOverlayOpacity"
    | "storeNameColor"
    | "followersColor"
    | "iconsColor"
    | "logoRingColor"
    | "chatButtonColor"
    | "chatButtonTextColor"
    | "showLogo"
    | "showStoreName"
    | "showFollowers"
    | "showRating"
    | "showVerifiedBadge"
    | "showChatButton"
  >
> = {
  headerBgColor: "#0f172a",
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
};

// Extract StoreHeaderStyles from raw formData, always falling back to safe
// defaults for every field so StoreHeader never receives `undefined` for a
// value it needs to render (e.g. on first paint, before any config exists).
export function extractHeaderStyles(formData: any): StoreHeaderStyles {
  const f = formData ?? {};
  return {
    headerBgColor: f.headerBgColor ?? DEFAULT_HEADER_STYLES.headerBgColor,
    headerBgImageMobile: f.headerBgImageMobile,
    headerBgImageDesktop: f.headerBgImageDesktop,
    headerOverlayOpacity: f.headerOverlayOpacity ?? DEFAULT_HEADER_STYLES.headerOverlayOpacity,
    storeNameColor: f.storeNameColor ?? DEFAULT_HEADER_STYLES.storeNameColor,
    followersColor: f.followersColor ?? DEFAULT_HEADER_STYLES.followersColor,
    iconsColor: f.iconsColor ?? DEFAULT_HEADER_STYLES.iconsColor,
    logoRingColor: f.logoRingColor ?? DEFAULT_HEADER_STYLES.logoRingColor,
    chatButtonColor: f.chatButtonColor ?? DEFAULT_HEADER_STYLES.chatButtonColor,
    chatButtonTextColor: f.chatButtonTextColor ?? DEFAULT_HEADER_STYLES.chatButtonTextColor,
    showLogo: f.showLogo ?? DEFAULT_HEADER_STYLES.showLogo,
    showStoreName: f.showStoreName ?? DEFAULT_HEADER_STYLES.showStoreName,
    showFollowers: f.showFollowers ?? DEFAULT_HEADER_STYLES.showFollowers,
    showRating: f.showRating ?? DEFAULT_HEADER_STYLES.showRating,
    showVerifiedBadge: f.showVerifiedBadge ?? DEFAULT_HEADER_STYLES.showVerifiedBadge,
    showChatButton: f.showChatButton ?? DEFAULT_HEADER_STYLES.showChatButton,
  };
}

// Voucher.tsx renders an array of `VoucherItem` cards, but the backend only
// stores ONE voucher's worth of fields per component (voucherTitle,
// voucherCode, discountPercentage, etc. — see ComponentConfigInput.settings
// in storeEditorApi.ts). This adapter wraps that single saved voucher into
// the 1-item array shape Voucher.tsx expects, so the preview component
// itself didn't need to change.
export function extractVoucherFormData(formData: any) {
  const f = formData ?? {};
  const hasSavedVoucher = !!(f.voucherTitle || f.voucherCode || f.discountPercentage || f.discountAmount);
  if (!hasSavedVoucher) return f; // let Voucher.tsx fall back to its own DEFAULT_VOUCHERS

  const discount = f.discountPercentage
    ? `${f.discountPercentage}%`
    : f.discountAmount
      ? `৳${f.discountAmount}`
      : undefined;

  return {
    ...f,
    vouchers: [
      {
        id: 1,
        discount,
        upTo: f.voucherTitle ?? 'Special offer',
        date: f.voucherValidTo ? new Date(f.voucherValidTo).toLocaleDateString(undefined, { weekday: 'long' }) : undefined,
        fullDate: f.voucherValidTo ? new Date(f.voucherValidTo).toLocaleDateString() : undefined,
        event: f.voucherDescription,
        code: f.voucherCode,
        serialNumber: f.voucherCode ? `Code: ${f.voucherCode}` : undefined,
      },
    ],
  };
}

export const PreviewArea = ({
  activeModules,
  onModuleDrop,
  selectedModuleId,
  onModuleSelect,
  onMoveUp,
  onMoveDown,
  onCopy,
  onDelete,
  currentView,
  formDataMap,
}: PreviewAreaProps) => {
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // ── Drag handlers ────────────────────────────────────────────────────────

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragEnd = () => {
    setDragOverIndex(null);
    setIsDragging(false);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    const rel = e.relatedTarget as Node;
    const cur = e.currentTarget as Node;
    if (!cur.contains(rel)) {
      setDragOverIndex(null);
      setIsDragging(false);
    }
  };
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };
  const handleDrop = (e: React.DragEvent, position: number) => {
    e.preventDefault();
    const moduleId = e.dataTransfer.getData("moduleId");
    if (moduleId) onModuleDrop(moduleId, position);
    setDragOverIndex(null);
    setIsDragging(false);
  };

  // ── Module renderer ──────────────────────────────────────────────────────

  const renderModule = (module: ActiveModule, index: number) => {
    const isSelected = module.id === selectedModuleId;
    const isLocked = index === 0; // header is always index 0
    const canMoveUp = !isLocked && index > 1; // index 1 can't go above header
    const canMoveDown = !isLocked && index < activeModules.length - 1;

    const Component = COMPONENT_MAP[module.type as ModuleType];
    const formData = formDataMap[module.id] ?? {};

    // Every component now receives `formData` (previously only StoreHeader
    // and CountdownProducts did — every other module silently rendered its
    // hardcoded placeholder data forever, no matter what was saved in
    // ConfigurationForm). StoreHeader keeps its own `styles` shape; Voucher
    // gets its data pre-shaped into the `vouchers` array it expects.
    const extraProps =
      module.type === "categoryBar"
        ? { styles: extractHeaderStyles(formData), viewMode: currentView }
        : module.type === "voucher"
          ? { formData: extractVoucherFormData(formData), viewMode: currentView }
          : { formData, viewMode: currentView };

    const cardContent = Component ? (
      <Component
        key={module.id}
        isActive={isSelected}
        onDragOver={(e: React.DragEvent) => handleDragOver(e, index)}
        onDrop={(e: React.DragEvent) => handleDrop(e, index)}
        onMoveUp={canMoveUp ? () => onMoveUp(module.id) : undefined}
        onMoveDown={canMoveDown ? () => onMoveDown(module.id) : undefined}
        onCopy={!isLocked ? () => onCopy(module.id) : undefined}
        onDelete={!isLocked ? () => onDelete(module.id) : undefined}
        {...extraProps}
      />
    ) : (
      <div
        className={`border rounded-lg p-4 bg-gray-100 ${isSelected ? "ring-2 ring-teal-500 ring-offset-2" : ""}`}
      >
        <div className="flex items-center gap-2">
          <img src={module.icon} alt={module.name} className="w-6 h-6" />
          <span className="text-sm font-medium">{module.name}</span>
        </div>
      </div>
    );

    return (
      <div
        key={module.id}
        draggable={!isLocked}
        onDragStart={
          !isLocked
            ? (e) => {
                e.dataTransfer.setData("moduleId", module.type);
                setIsDragging(true);
              }
            : undefined
        }
        onDragEnd={!isLocked ? handleDragEnd : undefined}
        onClick={() => onModuleSelect(module)}
        className={`cursor-pointer relative ${isSelected ? "ring-2 ring-teal-500 ring-offset-2 rounded-lg" : ""}`}
      >
        {cardContent}

        {isSelected && (
          <ComponentHandler
            isLocked={isLocked}
            onMoveUp={canMoveUp ? () => onMoveUp(module.id) : undefined}
            onMoveDown={canMoveDown ? () => onMoveDown(module.id) : undefined}
            onCopy={!isLocked ? () => onCopy(module.id) : undefined}
            onDelete={!isLocked ? () => onDelete(module.id) : undefined}
          />
        )}
      </div>
    );
  };

  // ── Layout config ────────────────────────────────────────────────────────

  const { width: cw, height: ch } = {
    mobile: { width: "w-[375px]", height: "min-h-[630px]" },
    desktop: { width: "w-[90%] mx-auto", height: "min-h-[800px]" },
  }[currentView];

  return (
    <div
      className="flex-1 bg-gray-100 flex items-center justify-center overflow-auto p-4"
      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragEnd={handleDragEnd}
      onDragOver={(e) => e.preventDefault()}
    >
      <div className="bg-white rounded-lg shadow-lg">
        <div className={`${cw} ${ch} bg-white transition-all duration-300`}>
          <div className="space-y-2 p-2">
            {activeModules.map((module, index) => (
              <React.Fragment key={module.id}>
                {/*
                  Drop zone BEFORE each module.
                  position={index} → DropZone returns null for index 0,
                  so nothing can ever be dropped above the header.
                */}
                {isDragging && (
                  <DropZone
                    position={index}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragLeave={() => setDragOverIndex(null)}
                    isVisible={dragOverIndex === index}
                  />
                )}

                {renderModule(module, index)}
              </React.Fragment>
            ))}

            {/* Trailing drop zone — always position > 0 */}
            {isDragging && (
              <DropZone
                position={activeModules.length}
                onDrop={(e) => handleDrop(e, activeModules.length)}
                onDragOver={(e) => handleDragOver(e, activeModules.length)}
                onDragLeave={() => setDragOverIndex(null)}
                isVisible={dragOverIndex === activeModules.length}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};