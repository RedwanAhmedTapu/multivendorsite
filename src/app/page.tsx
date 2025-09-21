import Footer from "@/components/footer/Footer";
import CashbackBanner from "@/components/homesections/CashbackBanner";
import CategorySection from "@/components/homesections/CategorySection";
import DailyDeals from "@/components/homesections/DailyDeals";
import FeaturedOffers from "@/components/homesections/FeaturedOffers";
import HeroSlider from "@/components/homesections/HomeSection";
import ProductGrid from "@/components/homesections/ProductGrid";

export default function Home() {
  return (
   <>
   <HeroSlider/>
   <CategorySection/>
   {/* <DailyDeals/> */}
   <ProductGrid/>
   {/* <FeaturedOffers/> */}
   {/* <CashbackBanner/> */}
   <Footer/>
   </>
  );
}
