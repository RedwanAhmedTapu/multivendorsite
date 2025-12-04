"use client";

import { useState, useRef, useEffect } from "react";
import {
  ChevronDown,
  Grid,
  X,
  MoreHorizontal,
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
  Palette,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Container } from "../Container";
import Link from "next/link";


interface Category {
  id: string;
  name: string;
  image?: string;
  children?: Category[];
}

interface Props {
  categories?: Category[];
  onSelectCategory?: (categoryId: string) => void;
}

// Map category names to Lucide icons
const getCategoryIcon = (categoryName: string): React.ReactElement => {
  const name = categoryName.toLowerCase();
  
  if (name.includes('fashion') || name.includes('clothing')) {
    return <Shirt className="w-4 h-4" />;
  }
  if (name.includes('electronics') || name.includes('gadgets')) {
    return <Laptop className="w-4 h-4" />;
  }
  if (name.includes('home') || name.includes('garden')) {
    return <Home className="w-4 h-4" />;
  }
  if (name.includes('jewellery') || name.includes('jewelry')) {
    return <Gem className="w-4 h-4" />;
  }
  if (name.includes('beauty') || name.includes('health')) {
    return <Sparkles className="w-4 h-4" />;
  }
  if (name.includes('toy') || name.includes('game')) {
    return <Gamepad2 className="w-4 h-4" />;
  }
  if (name.includes('mother') || name.includes('kids') || name.includes('baby')) {
    return <Baby className="w-4 h-4" />;
  }
  if (name.includes('sport')) {
    return <Dumbbell className="w-4 h-4" />;
  }
  if (name.includes('auto') || name.includes('car')) {
    return <Car className="w-4 h-4" />;
  }
  if (name.includes('art')) {
    return <Palette className="w-4 h-4" />;
  }
  if (name.includes('music')) {
    return <Music className="w-4 h-4" />;
  }
  if (name.includes('book')) {
    return <BookOpen className="w-4 h-4" />;
  }
  
  return <ShoppingBag className="w-4 h-4" />;
};

// Default categories matching the image
const defaultCategories: Category[] = [
  {
    id: "home-garden",
    name: "Home & Garden",
    image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop",
    children: [
      {
        id: "home-furniture",
        name: "Furniture",
        children: [
          { id: "home-furniture-living", name: "Living Room" },
          { id: "home-furniture-bedroom", name: "Bedroom" },
          { id: "home-furniture-dining", name: "Dining Room" },
          { id: "home-furniture-office", name: "Office Furniture" },
        ]
      },
      {
        id: "home-decor",
        name: "Home Decor",
        children: [
          { id: "home-decor-wallart", name: "Wall Art" },
          { id: "home-decor-lighting", name: "Lighting" },
          { id: "home-decor-rugs", name: "Rugs & Carpets" },
          { id: "home-decor-mirrors", name: "Mirrors" },
        ]
      },
      {
        id: "home-kitchen",
        name: "Kitchen & Dining",
        children: [
          { id: "home-kitchen-cookware", name: "Cookware" },
          { id: "home-kitchen-appliances", name: "Kitchen Appliances" },
          { id: "home-kitchen-utensils", name: "Utensils" },
          { id: "home-kitchen-storage", name: "Storage" },
        ]
      },
      {
        id: "home-garden-outdoor",
        name: "Outdoor & Garden",
        children: [
          { id: "home-garden-furniture", name: "Outdoor Furniture" },
          { id: "home-garden-grills", name: "Grills & Outdoor Cooking" },
          { id: "home-garden-plants", name: "Plants & Seeds" },
          { id: "home-garden-tools", name: "Garden Tools" },
        ]
      },
    ]
  },
  {
    id: "electronics",
    name: "Electronics",
    image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&auto=format&fit=crop",
    children: [
      {
        id: "electronics-smartphones",
        name: "Smartphones",
        children: [
          { id: "electronics-smartphones-iphone", name: "iPhone" },
          { id: "electronics-smartphones-samsung", name: "Samsung" },
          { id: "electronics-smartphones-google", name: "Google Pixel" },
          { id: "electronics-smartphones-oneplus", name: "OnePlus" },
        ]
      },
      {
        id: "electronics-laptops",
        name: "Laptops",
        children: [
          { id: "electronics-laptops-macbook", name: "MacBook" },
          { id: "electronics-laptops-dell", name: "Dell" },
          { id: "electronics-laptops-hp", name: "HP" },
          { id: "electronics-laptops-lenovo", name: "Lenovo" },
        ]
      },
      {
        id: "electronics-tv",
        name: "TV & Home Theater",
        children: [
          { id: "electronics-tv-smart", name: "Smart TVs" },
          { id: "electronics-tv-soundbars", name: "Soundbars" },
          { id: "electronics-tv-projectors", name: "Projectors" },
          { id: "electronics-tv-streaming", name: "Streaming Devices" },
        ]
      },
    ]
  },
  {
    id: "fashion",
    name: "Fashion",
    image: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&auto=format&fit=crop",
    children: [
      {
        id: "fashion-women",
        name: "Women's Fashion",
        children: [
          { id: "fashion-women-dresses", name: "Dresses" },
          { id: "fashion-women-tops", name: "Tops & T-Shirts" },
          { id: "fashion-women-jeans", name: "Jeans" },
          { id: "fashion-women-shoes", name: "Shoes" },
        ]
      },
      {
        id: "fashion-men",
        name: "Men's Fashion",
        children: [
          { id: "fashion-men-shirts", name: "Shirts" },
          { id: "fashion-men-t-shirts", name: "T-Shirts" },
          { id: "fashion-men-pants", name: "Pants" },
          { id: "fashion-men-shoes", name: "Shoes" },
        ]
      },
    ]
  },
  {
    id: "jewelry",
    name: "Jewelry",
    image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&auto=format&fit=crop",
    children: [
      {
        id: "jewelry-rings",
        name: "Rings",
        children: [
          { id: "jewelry-rings-engagement", name: "Engagement Rings" },
          { id: "jewelry-rings-wedding", name: "Wedding Rings" },
        ]
      },
      {
        id: "jewelry-necklaces",
        name: "Necklaces",
        children: [
          { id: "jewelry-necklaces-pendants", name: "Pendants" },
          { id: "jewelry-necklaces-chains", name: "Chains" },
        ]
      },
    ]
  },
  {
    id: "sports",
    name: "Sports",
    image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&auto=format&fit=crop",
    children: [
      {
        id: "sports-fitness",
        name: "Fitness Equipment",
        children: [
          { id: "sports-fitness-weights", name: "Weights & Dumbbells" },
          { id: "sports-fitness-yoga", name: "Yoga Equipment" },
        ]
      },
    ]
  },
  {
    id: "mother-kids",
    name: "Mother & Kids",
    image: "https://images.unsplash.com/photo-1512757776214-26d36777b513?w=800&auto=format&fit=crop",
    children: [
      {
        id: "baby-gear",
        name: "Baby Gear",
        children: [
          { id: "baby-gear-strollers", name: "Strollers" },
          { id: "baby-gear-carriers", name: "Baby Carriers" },
        ]
      },
    ]
  },
  {
    id: "beauty-health",
    name: "Beauty & Health",
    image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&auto=format&fit=crop",
    children: [
      {
        id: "beauty-skincare",
        name: "Skincare",
        children: [
          { id: "beauty-skincare-cleansers", name: "Cleansers" },
          { id: "beauty-skincare-moisturizers", name: "Moisturizers" },
        ]
      },
    ]
  },
  {
    id: "toys-games",
    name: "Toys & Games",
    image: "https://images.unsplash.com/photo-1578206134282-9f2d9e3f0e6f?w=800&auto=format&fit=crop",
    children: [
      {
        id: "toys-educational",
        name: "Educational Toys",
        children: [
          { id: "toys-educational-stem", name: "STEM Toys" },
          { id: "toys-educational-building", name: "Building Sets" },
        ]
      },
    ]
  },
  {
    id: "automobiles",
    name: "Automobiles",
    image: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&auto=format&fit=crop",
    children: [
      {
        id: "auto-parts",
        name: "Auto Parts",
        children: [
          { id: "auto-parts-engine", name: "Engine Parts" },
          { id: "auto-parts-brakes", name: "Brakes" },
        ]
      },
    ]
  },
  {
    id: "art",
    name: "Art",
    image: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800&auto=format&fit=crop",
    children: [
      {
        id: "art-paintings",
        name: "Paintings",
        children: [
          { id: "art-paintings-modern", name: "Modern Art" },
          { id: "art-paintings-abstract", name: "Abstract Art" },
        ]
      },
    ]
  },
];

export default function HorizontalCategoryNav({
  categories = defaultCategories,
  onSelectCategory,
}: Props) {
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
        setActiveCategory(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleMouseEnter = (category: Category) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setActiveCategory(category);
    setShowDropdown(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setShowDropdown(false);
      setActiveCategory(null);
    }, 200);
  };

  const handleDropdownEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  return (
    <div className="relative w-full bg-white border-b" ref={dropdownRef}>
      {/* Navigation Bar */}
      <Container>
        <ul className="flex items-center justify-between gap-1">
          {categories.map((category) => (
            <li
              key={category.id}
              className="relative group"
              onMouseEnter={() => handleMouseEnter(category)}
              onMouseLeave={handleMouseLeave}
            >
              <button className="relative px-4 py-4 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors duration-200 whitespace-nowrap">
                {category.name}
                
                {/* Animated bottom border */}
                <span 
                  className={cn(
                    "absolute bottom-0 left-0 h-0.5 bg-teal-600 transition-all duration-500 ease-out",
                    "scale-x-0 group-hover:scale-x-100 origin-left"
                  )}
                  style={{ width: '100%' }}
                />
              </button>
            </li>
          ))}
          
          {/* More button */}
          <li className="relative group">
            <button className="relative px-4 py-4 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors duration-200">
              <MoreHorizontal className="w-5 h-5" />
              
              {/* Animated bottom border */}
              <span 
                className={cn(
                  "absolute bottom-0 left-0 h-0.5 bg-teal-600 transition-all duration-500 ease-out",
                  "scale-x-0 group-hover:scale-x-100 origin-left"
                )}
                style={{ width: '100%' }}
              />
            </button>
          </li>
        </ul>
</Container>
      {/* Mega Dropdown Menu */}
      {showDropdown && activeCategory && (
        <div
          className="absolute left-0 right-0 top-full bg-white shadow-xl z-50 border-t"
          onMouseEnter={handleDropdownEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="max-w-7xl mx-auto p-8">
            <div className="flex gap-8">
              {/* Background Image Section */}
              {activeCategory.image && (
                <div className="w-1/4 relative rounded-lg overflow-hidden">
                  <img
                    src={activeCategory.image}
                    alt={activeCategory.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-6">
                    <h3 className="text-2xl font-bold text-white">
                      {activeCategory.name}
                    </h3>
                  </div>
                </div>
              )}

              {/* Subcategories Grid */}
              <div className="flex-1">
                <div className="grid grid-cols-3 gap-8">
                  {activeCategory.children?.map((sub) => (
                    <div key={sub.id}>
                      <h4 className="font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">
                        {sub.name}
                      </h4>
                      <ul className="space-y-2">
                        {sub.children?.map((child) => (
                          <Link href={"/products?category=" + child.name} key={child.id}>
                          <li
                            key={child.id}
                            className="text-sm text-gray-600 hover:text-teal-600 cursor-pointer transition-colors duration-200"
                            onClick={() => {
                              onSelectCategory?.(child.id);
                              setShowDropdown(false);
                            }}
                          >
                            {child.name}
                          </li>
                          </Link>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}