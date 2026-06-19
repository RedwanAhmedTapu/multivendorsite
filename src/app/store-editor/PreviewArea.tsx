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

// Extract StoreHeaderStyles from raw formData
function extractHeaderStyles(formData: any): StoreHeaderStyles {
  return {
    headerBgColor: formData?.headerBgColor,
    headerBgImageMobile: formData?.headerBgImageMobile,
    headerBgImageDesktop: formData?.headerBgImageDesktop,
    headerOverlayOpacity: formData?.headerOverlayOpacity,
    storeNameColor: formData?.storeNameColor,
    followersColor: formData?.followersColor,
    iconsColor: formData?.iconsColor,
    logoRingColor: formData?.logoRingColor,
    chatButtonColor: formData?.chatButtonColor,
    chatButtonTextColor: formData?.chatButtonTextColor,
    showLogo: formData?.showLogo,
    showStoreName: formData?.showStoreName,
    showFollowers: formData?.showFollowers,
    showRating: formData?.showRating,
    showVerifiedBadge: formData?.showVerifiedBadge,
    showChatButton: formData?.showChatButton,
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

    // Extra props only for StoreHeader

    const extraProps =
      module.type === "categoryBar"
        ? { styles: extractHeaderStyles(formData), viewMode: currentView }
        : module.type === "countdownProduct"
          ? { formData, viewMode: currentView }
          : { viewMode: currentView };

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
