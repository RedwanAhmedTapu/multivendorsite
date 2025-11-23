import { ModuleItem } from "./page";
import { CountdownDemo } from "./demo-components/CountdownDemo";
import { BannerCarouselDemo } from "./demo-components/BannerCarouselDemo";
import { ThreeBannersDemo } from "./demo-components/ThreeBannersDemo";
import { ProductsCarouselDemo } from "./demo-components/ProductsCarouselDemo";
import { ProductRecommendationDemo } from "./demo-components/ProductRecommendationDemo";
import ProductHighlight from "./demo-components/ProductHighlightsDemo";
import { VoucherDemo } from "./demo-components/VoucherDemo";
import { CategoryListDemo } from "./demo-components/CategoryListDemo";
import { SingleBannerDemo } from "./demo-components/SingleBannerDemo";
import { FourBannersDemo } from "./demo-components/FourBannersDemo";
import { ThreeColumnsProductsDemo } from "./demo-components/ThreeColumnsProductsDemo";
import { DefaultDemo } from "./demo-components/DefaultDemo";
import { FiveBannersDemo } from "./demo-components/FiveBannerDemo";
import { MultipleBannersDemo } from "./demo-components/MultipleBannerDemo";
import { SmartCategoryDemo } from "./demo-components/SmartCategoryDemo";
import { ProductSlider } from "./demo-components/ProductSlider";

interface ModuleDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  module: ModuleItem | null;
  sidebarWidth?: number;
}

export const ModuleDemoModal = ({ isOpen, onClose, module, sidebarWidth = 280 }: ModuleDemoModalProps) => {
  if (!isOpen || !module) return null;

  const renderDemo = () => {
    switch (module.id) {
      case "countdownProduct":
        return <CountdownDemo />;
      case "graphicCarousel":
        return <BannerCarouselDemo />;
      case "graphicThreeImages":
        return <ThreeBannersDemo />;
      case "carouselProductRecommend":
        return <ProductsCarouselDemo />;
      case "productRecommendation":
        return <ProductRecommendationDemo />;
      case "sliderRecommend":
        return <ProductSlider />;
      case "productPromotion":
        return <ProductHighlight />;
      case "voucher":
        return <VoucherDemo />;
      case "brandList":
        return <CategoryListDemo />;
      case "categoryAuto":
        return <SmartCategoryDemo />;
      case "graphicOneImage":
        return <SingleBannerDemo />;
      case "fourBannersA":
        return <FourBannersDemo />;
      case "fiveBannersA":
        return <FiveBannersDemo />;
      case "graphicMultiImages":
        return <MultipleBannersDemo />;
      case "threeColumnProducts":
        return <ThreeColumnsProductsDemo />;
      default:
        return <DefaultDemo module={module} />;
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-start p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl w-full max-w-2xl h-auto overflow-hidden shadow-2xl mt-4"
        style={{ marginLeft: `${sidebarWidth}px` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)] bg-gray-50">
          <div className="w-full">
            {renderDemo()}
          </div>
        </div>
      </div>
    </div>
  );
};