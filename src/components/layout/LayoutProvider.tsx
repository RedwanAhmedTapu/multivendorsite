// components/layout/LayoutProvider.tsx
//
// Renders the active homepage layout from the published configuration.
// Section types map to a FIXED registry of trusted components below; a config
// can only choose which of these render, in what order, on which breakpoints,
// and with which validated settings. With the built-in defaults the output is
// the same components in the same order as the original hardcoded layouts:
//   layout_1: Hero → Benefits → Categories → Products → Footer
//   layout_2: HorizontalCategoryNav → Hero → Benefits → Categories → Products → Footer
//   layout_3: CategoryLayout3 → Benefits → Categories → Products → Footer
//
// Not rendered yet (validated and stored, applied in later phases): section
// appearance (colors / alignment / width / spacing), categoryCircles title /
// subtitle / maxItems, theme settings. Product card design is a separate
// global setting (not part of the homepage config).
import { Fragment, type ReactNode } from 'react';
import Footer from "@/components/footer/Footer";
import CategorySection from "@/components/homesections/CategorySection";
import HeroSlider from "@/components/homesections/HomeSection";
import ProductCollectionSection from "@/components/homesections/ProductCollectionSection";
import BenefitsSection from "../../../public/svg/BenefitsSection";
import HorizontalCategoryNav from "@/components/homesections/CategoryLayout_2";
import CategoryLayout3 from "@/components/homesections/CategoryLayout_3";
import {
  getDefaultHomepageConfig,
  getRenderableSections,
  normalizeLayoutId,
  type HomepageConfig,
  type HomepageSection,
} from "@/lib/homepage-config/core";

type LayoutType = 'layout_1' | 'layout_2' | 'layout_3';

interface LayoutProviderProps {
  layoutType: LayoutType;
  categories: any[];
  /** Published homepage configuration; defaults (today's homepage) when omitted. */
  config?: HomepageConfig;
}

function renderSection(section: HomepageSection, categories: any[]): ReactNode {
  switch (section.type) {
    case 'hero':
      return <HeroSlider />;
    case 'horizontalCategoryNav':
      return <HorizontalCategoryNav categories={categories} />;
    case 'categoryGrid':
      return <CategoryLayout3 categories={categories} />;
    case 'benefits':
      return <BenefitsSection />;
    case 'categoryCircles':
      return <CategorySection />;
    case 'productCollection':
      return <ProductCollectionSection settings={section.settings} />;
    case 'footer':
      return <Footer />;
    default:
      return null; // unknown types never render
  }
}

export default function LayoutProvider({ layoutType, categories, config }: LayoutProviderProps) {
  const layoutId = normalizeLayoutId(layoutType);
  const sections = getRenderableSections(config ?? getDefaultHomepageConfig(), layoutId);

  return (
    <>
      {sections.map(({ section, wrapperClass }) => {
        const node = renderSection(section, categories);
        return wrapperClass ? (
          <div key={section.id} className={wrapperClass} data-fm-section={section.id}>
            {node}
          </div>
        ) : (
          <Fragment key={section.id}>{node}</Fragment>
        );
      })}
    </>
  );
}