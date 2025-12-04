"use client";

import { useState, useRef, useEffect } from "react";
import {
  ChevronRight,
  // Category-specific icons
  Shirt,
  Laptop,
  Home,
  Sparkles,
  Gem,
  Heart,
  Gamepad2,
  Baby,
  Dumbbell,
  ShoppingBag,
  Music,
  Car,
  BookOpen,
  Camera,
  Smartphone,
  Watch,
  Sofa,
  Palette,
  Wrench,
  Dog,
  ShirtIcon as TShirt,
  Trees,
  ChefHat,
  Coffee,
  Utensils,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Container } from "../Container";
import HeroSlider from "./HomeSection";

interface Category {
  id: string;
  name: string;
  image?: string;
  children?: Category[];
}

interface Props {
  categories: Category[];
  onSelectCategory?: (categoryId: string) => void;
  selectedCategory?: string;
}

// Map category names to Lucide icons
const getCategoryIcon = (categoryName: string): React.ReactElement => {
  const name = categoryName.toLowerCase();
  
  if (name.includes('fashion') || name.includes('clothing') || name.includes('apparel')) {
    return <Shirt className="w-4 h-4" />;
  }
  if (name.includes('shirt') || name.includes('t-shirt')) {
    return <TShirt className="w-4 h-4" />;
  }
  if (name.includes('electronics') || name.includes('gadgets')) {
    return <Laptop className="w-4 h-4" />;
  }
  if (name.includes('phone') || name.includes('mobile')) {
    return <Smartphone className="w-4 h-4" />;
  }
  if (name.includes('watch') || name.includes('smartwatch')) {
    return <Watch className="w-4 h-4" />;
  }
  if (name.includes('camera') || name.includes('photo')) {
    return <Camera className="w-4 h-4" />;
  }
  if (name.includes('home') || name.includes('garden') || name.includes('furniture')) {
    return <Home className="w-4 h-4" />;
  }
  if (name.includes('sofa') || name.includes('furnishing')) {
    return <Sofa className="w-4 h-4" />;
  }
  if (name.includes('decor') || name.includes('decorative')) {
    return <Palette className="w-4 h-4" />;
  }
  if (name.includes('garden') || name.includes('plants')) {
    return <Trees className="w-4 h-4" />;
  }
  if (name.includes('kitchen') || name.includes('cooking')) {
    return <ChefHat className="w-4 h-4" />;
  }
  if (name.includes('tools') || name.includes('diy')) {
    return <Wrench className="w-4 h-4" />;
  }
  if (name.includes('pet') || name.includes('animal')) {
    return <Dog className="w-4 h-4" />;
  }
  if (name.includes('jewellery') || name.includes('jewelry') || name.includes('gem')) {
    return <Gem className="w-4 h-4" />;
  }
  if (name.includes('beauty') || name.includes('cosmetic') || name.includes('makeup')) {
    return <Sparkles className="w-4 h-4" />;
  }
  if (name.includes('health') || name.includes('wellness') || name.includes('fitness')) {
    return <Heart className="w-4 h-4" />;
  }
  if (name.includes('toy') || name.includes('game') || name.includes('gaming')) {
    return <Gamepad2 className="w-4 h-4" />;
  }
  if (name.includes('mother') || name.includes('baby') || name.includes('kids') || name.includes('child')) {
    return <Baby className="w-4 h-4" />;
  }
  if (name.includes('sport') || name.includes('fitness') || name.includes('outdoor')) {
    return <Dumbbell className="w-4 h-4" />;
  }
  if (name.includes('book') || name.includes('stationery') || name.includes('study')) {
    return <BookOpen className="w-4 h-4" />;
  }
  if (name.includes('car') || name.includes('auto') || name.includes('vehicle')) {
    return <Car className="w-4 h-4" />;
  }
  if (name.includes('music') || name.includes('instrument')) {
    return <Music className="w-4 h-4" />;
  }
  if (name.includes('food') || name.includes('beverage') || name.includes('drink')) {
    return <Coffee className="w-4 h-4" />;
  }
  if (name.includes('grocery') || name.includes('utensil')) {
    return <Utensils className="w-4 h-4" />;
  }
  
  return <ShoppingBag className="w-4 h-4" />;
};



export default function CategoryLayout3({
  categories = [],
  onSelectCategory,
  selectedCategory,
}: Props) {
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  if (isMobile) {
    return null; // Hidden on mobile as per original
  }

  return (
    <div className=" w-full " >
        <Container className="hidden md:flex bg-white shadow-lg overflow-hidden">

      {/* Left Sidebar - Always Open */}
      <div className="w-1/4 border-r border-gray-200 overflow-y-auto">
        {categories.map((cat) => {
          const Icon = getCategoryIcon(cat.name);
          return (
            <div
              key={cat.id}
              onMouseEnter={() => setActiveCategory(cat)}
              onMouseLeave={() => setActiveCategory(null)}
              className={cn(
                "flex items-center justify-between px-4 py-3 cursor-pointer transition-all duration-200",
                "hover:bg-teal-50 border-b border-gray-100",
                activeCategory?.id === cat.id
                  ? "bg-teal-50 border-l-4 border-teal-600"
                  : ""
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "transition-colors duration-200",
                  activeCategory?.id === cat.id ? "text-teal-600" : "text-gray-600"
                )}>
                  {Icon}
                </div>
                <span className={cn(
                  "text-sm font-medium transition-colors duration-200",
                  activeCategory?.id === cat.id ? "text-teal-700" : "text-gray-700"
                )}>
                  {cat.name}
                </span>
              </div>
              {cat.children && cat.children.length > 0 && (
                <ChevronRight className={cn(
                  "w-4 h-4 transition-all duration-200",
                  activeCategory?.id === cat.id ? "text-teal-600 translate-x-1" : "text-gray-400"
                )} />
              )}
            </div>
          );
        })}
      </div>

      {/* Right Content Area */}
      <div className="w-3/4 relative">
        {!activeCategory ? (
          /* Show Hero Slider by default */
          <HeroSlider />
        ) : (
          /* Show Category Content on hover */
          <div className="relative w-full h-full">
            {/* Background Image */}
            {activeCategory.image && (
              <div 
                className="absolute inset-0 z-0"
                style={{
                  backgroundImage: `url(${activeCategory.image})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                <div className="absolute inset-0 bg-white/95"></div>
              </div>
            )}
            
            {/* Content */}
            <div className="relative z-10 p-6 h-full overflow-y-auto">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-teal-600">
                {activeCategory.name}
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {activeCategory.children?.map((sub) => (
                  <div key={sub.id} className="group">
                    <h4 className="font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-300 group-hover:border-teal-500 transition-colors duration-200">
                      {sub.name}
                    </h4>
                    <ul className="space-y-2">
                      {sub.children?.map((child) => (
                        <li
                          key={child.id}
                          className="text-sm text-gray-700 hover:text-teal-600 cursor-pointer transition-all duration-200 hover:translate-x-1"
                          onClick={() => {
                            onSelectCategory?.(child.id);
                          }}
                        >
                          <span className="py-1 hover:underline inline-block">{child.name}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
        </Container>

    </div>
  );
}