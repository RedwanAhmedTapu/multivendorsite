// components/layout/LayoutProvider.tsx
import { ReactNode } from 'react';
import Footer from "@/components/footer/Footer";
import CategorySection from "@/components/homesections/CategorySection";
import HeroSlider from "@/components/homesections/HomeSection";
import ProductGrid from "@/components/homesections/ProductGrid";
import BenefitsSection from "../../../public/svg/BenefitsSection";
import HorizontalCategoryNav from "@/components/homesections/CategoryLayout_2";
import CategoryLayout3 from "@/components/homesections/CategoryLayout_3";

type LayoutType = 'layout_1' | 'layout_2' | 'layout_3';

interface LayoutProviderProps {
  layoutType: LayoutType;
  categories: any[];
}

export default function LayoutProvider({ layoutType, categories }: LayoutProviderProps) {
  // Layout 2: Horizontal Navigation
  if (layoutType === 'layout_2') {
    return (
      <>
        <HorizontalCategoryNav categories={categories} />
        <HeroSlider />
        <BenefitsSection />
        <CategorySection />
        <ProductGrid />
        <Footer />
      </>
    );
  }

  // Layout 3: Category Grid
  if (layoutType === 'layout_3') {
    return (
      <>
        <CategoryLayout3 categories={categories} />
        <BenefitsSection />
        <CategorySection />
        <ProductGrid />
        <Footer />
      </>
    );
  }

  // Layout 1: Default (fallback)
  return (
    <>
      <HeroSlider />
      <BenefitsSection />
      <CategorySection />
      <ProductGrid />
      <Footer />
    </>
  );
}