import React, { useState } from "react";
import { CountdownProducts } from "./componentspreview/CountdownProducts";
import { StoreHeader } from "./componentspreview/StoreHeader";
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
  currentView: 'mobile' | 'desktop';
}

// Component configuration map for reusability
const COMPONENT_MAP = {
  categoryBar: StoreHeader,
  brandList:CategoryList,
  categoryAuto:SmartCategory,
  graphicThreeImages: ThreeBanners,
  countdownProduct: CountdownProducts,
  graphicCarousel: BannerCarousel,
  graphicOneImage: SingleBanner,
  fourBannersA: FourBanners,
  fiveBannersA: FiveBanners,
  graphicMultiImages: MultipleBanners,
  carouselProductRecommend:ProductsCarousel,
  productRecommendation:ProductRecommendation,
  sliderRecommend:SliderProduct,
  productPromotion:ProductHighlight,
  threeColumnProducts:ThreeColumnsProducts,
  voucher:Voucher
} as const;

type ComponentType = keyof typeof COMPONENT_MAP;

export const PreviewArea = ({
  activeModules,
  onModuleDrop,
  selectedModuleId,
  onModuleSelect,
  onMoveUp,
  onMoveDown,
  onCopy,
  onDelete,
  currentView
}: PreviewAreaProps) => {
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    const relatedTarget = e.relatedTarget as Node;
    const currentTarget = e.currentTarget as Node;
    
    if (!currentTarget.contains(relatedTarget)) {
      setDragOverIndex(null);
      setIsDragging(false);
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDrop = (e: React.DragEvent, position: number) => {
    e.preventDefault();
    const moduleId = e.dataTransfer.getData("moduleId");
    if (moduleId) {
      onModuleDrop(moduleId, position);
    }
    setDragOverIndex(null);
    setIsDragging(false);
  };

  const handleDragEnd = () => {
    setDragOverIndex(null);
    setIsDragging(false);
  };

  const handleModuleClick = (module: ActiveModule) => {
    onModuleSelect(module);
  };

  // Reusable module renderer
  const renderModule = (module: ActiveModule, index: number) => {
    const isSelected = module.id === selectedModuleId;
    const isStoreHeaderAtZero = module.type === "categoryBar" && index === 0;
    
    // Get the component from the map or use default
    const Component = COMPONENT_MAP[module.type as ComponentType];
    
    if (Component) {
      return (
        <div 
          onClick={() => handleModuleClick(module)}
          className={`cursor-pointer relative ${isSelected ? 'ring-2 ring-teal-500 ring-offset-2 rounded-lg' : ''}`}
        >
          <Component 
            key={module.id}
            isActive={isSelected}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={(e) => handleDrop(e, index)}
            onMoveUp={() => !(isStoreHeaderAtZero && module.type === "categoryBar") && onMoveUp(module.id)}
            onMoveDown={() => onMoveDown(module.id)}
            onCopy={() => onCopy(module.id)}
            onDelete={() => !(isStoreHeaderAtZero && module.type === "categoryBar") && onDelete(module.id)}
            viewMode={currentView}
          />
          {isSelected && (
            <ComponentHandler
              onMoveUp={() => !(isStoreHeaderAtZero && module.type === "categoryBar") && onMoveUp(module.id)}
              onMoveDown={() => onMoveDown(module.id)}
              onCopy={() => onCopy(module.id)}
              onDelete={() => !(isStoreHeaderAtZero && module.type === "categoryBar") && onDelete(module.id)}
            />
          )}
        </div>
      );
    }

    // Default fallback for unknown module types
    return (
      <div
        key={module.id}
        className={`relative border rounded-lg p-4 bg-gray-100 cursor-pointer ${
          isSelected ? 'ring-2 ring-teal-500 ring-offset-2' : ''
        }`}
        onClick={() => handleModuleClick(module)}
      >
        <div className="flex items-center gap-2">
          <img src={module.icon} alt={module.name} className="w-6 h-6" />
          <span className="text-sm font-medium">{module.name}</span>
        </div>
        {isSelected && (
          <ComponentHandler
            onMoveUp={() => onMoveUp(module.id)}
            onMoveDown={() => onMoveDown(module.id)}
            onCopy={() => onCopy(module.id)}
            onDelete={() => onDelete(module.id)}
          />
        )}
      </div>
    );
  };

  // Container dimensions based on view mode
  const containerConfig = {
    mobile: {
      width: 'w-[375px]',
      height: 'min-h-[630px]'
    },
    desktop: {
      width: 'w-[90%] mx-auto',
      height: 'min-h-[800px]'
    }
  };

  const { width: containerWidth, height: containerHeight } = containerConfig[currentView];

  return (
    <div 
      className="flex-1 bg-gray-100 flex items-center justify-center overflow-auto p-4"
      style={{
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
      }}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragEnd={handleDragEnd}
      onDragOver={(e) => e.preventDefault()}
    >
      <div className="bg-white rounded-lg shadow-lg">
        <div className={`${containerWidth} ${containerHeight} bg-white transition-all duration-300`}>
          <div className="space-y-2 p-2">
            {/* Top Drop Zone - Only show when dragging */}
            {isDragging && (
              <DropZone
                onDrop={(e) => handleDrop(e, 0)}
                onDragOver={(e) => handleDragOver(e, 0)}
                onDragLeave={() => setDragOverIndex(null)}
                isVisible={dragOverIndex === 0}
              />
            )}

            {activeModules.map((module, index) => (
              <React.Fragment key={module.id}>
                {renderModule(module, index)}

                {/* Drop Zone after each module - Only show when dragging */}
                {isDragging && (
                  <DropZone
                    onDrop={(e) => handleDrop(e, index + 1)}
                    onDragOver={(e) => handleDragOver(e, index + 1)}
                    onDragLeave={() => setDragOverIndex(null)}
                    isVisible={dragOverIndex === index + 1}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};