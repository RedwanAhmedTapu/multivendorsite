"use client";

import { useState, useRef, useEffect } from "react";
import {
  ChevronDown,
  Grid,
  X,
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
  ChefHat,
  Camera,
  Smartphone,
  Watch,
  Flower2,
  Sofa,
  Palette,
  Wrench,
  Book,
  Coffee,
  Utensils,
  Trees,
  Dog,
  ShirtIcon as TShirt,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  image?: string;
  highlight?: boolean;
  count?: number;
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
  
  // Fashion & Clothing
  if (name.includes('fashion') || name.includes('clothing') || name.includes('apparel')) {
    return <Shirt className="w-4 h-4 text-gray-600" />;
  }
  if (name.includes('shirt') || name.includes('t-shirt')) {
    return <TShirt className="w-4 h-4 text-gray-600" />;
  }
  
  // Electronics
  if (name.includes('electronics') || name.includes('gadgets')) {
    return <Laptop className="w-4 h-4 text-gray-600" />;
  }
  if (name.includes('phone') || name.includes('mobile')) {
    return <Smartphone className="w-4 h-4 text-gray-600" />;
  }
  if (name.includes('watch') || name.includes('smartwatch')) {
    return <Watch className="w-4 h-4 text-gray-600" />;
  }
  if (name.includes('camera') || name.includes('photo')) {
    return <Camera className="w-4 h-4 text-gray-600" />;
  }
  
  // Home & Garden
  if (name.includes('home') || name.includes('garden') || name.includes('furniture')) {
    return <Home className="w-4 h-4 text-gray-600" />;
  }
  if (name.includes('sofa') || name.includes('furnishing')) {
    return <Sofa className="w-4 h-4 text-gray-600" />;
  }
  if (name.includes('decor') || name.includes('decorative')) {
    return <Palette className="w-4 h-4 text-gray-600" />;
  }
  if (name.includes('garden') || name.includes('plants')) {
    return <Trees className="w-4 h-4 text-gray-600" />;
  }
  if (name.includes('kitchen') || name.includes('cooking')) {
    return <ChefHat className="w-4 h-4 text-gray-600" />;
  }
  if (name.includes('tools') || name.includes('diy')) {
    return <Wrench className="w-4 h-4 text-gray-600" />;
  }
  if (name.includes('pet') || name.includes('animal')) {
    return <Dog className="w-4 h-4 text-gray-600" />;
  }
  
  // Jewellery & Accessories
  if (name.includes('jewellery') || name.includes('jewelry') || name.includes('gem')) {
    return <Gem className="w-4 h-4 text-gray-600" />;
  }
  
  // Beauty & Health
  if (name.includes('beauty') || name.includes('cosmetic') || name.includes('makeup')) {
    return <Sparkles className="w-4 h-4 text-gray-600" />;
  }
  if (name.includes('health') || name.includes('wellness') || name.includes('fitness')) {
    return <Heart className="w-4 h-4 text-gray-600" />;
  }
  
  // Toys & Games
  if (name.includes('toy') || name.includes('game') || name.includes('gaming')) {
    return <Gamepad2 className="w-4 h-4 text-gray-600" />;
  }
  
  // Mother & Kids
  if (name.includes('mother') || name.includes('baby') || name.includes('kids') || name.includes('child')) {
    return <Baby className="w-4 h-4 text-gray-600" />;
  }
  
  // Sports & Outdoors
  if (name.includes('sport') || name.includes('fitness') || name.includes('outdoor')) {
    return <Dumbbell className="w-4 h-4 text-gray-600" />;
  }
  
  // Books & Stationery
  if (name.includes('book') || name.includes('stationery') || name.includes('study')) {
    return <BookOpen className="w-4 h-4 text-gray-600" />;
  }
  
  // Automotive
  if (name.includes('car') || name.includes('auto') || name.includes('vehicle')) {
    return <Car className="w-4 h-4 text-gray-600" />;
  }
  
  // Music & Instruments
  if (name.includes('music') || name.includes('instrument')) {
    return <Music className="w-4 h-4 text-gray-600" />;
  }
  
  // Food & Beverages
  if (name.includes('food') || name.includes('beverage') || name.includes('drink')) {
    return <Coffee className="w-4 h-4 text-gray-600" />;
  }
  if (name.includes('grocery') || name.includes('utensil')) {
    return <Utensils className="w-4 h-4 text-gray-600" />;
  }
  
  // Default
  return <ShoppingBag className="w-4 h-4 text-gray-600" />;
};

// Sample categories data matching your requirements
const defaultCategories: Category[] = [
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
      {
        id: "electronics-audio",
        name: "Audio",
        children: [
          { id: "electronics-audio-headphones", name: "Headphones" },
          { id: "electronics-audio-speakers", name: "Speakers" },
          { id: "electronics-audio-earbuds", name: "Earbuds" },
          { id: "electronics-audio-homeaudio", name: "Home Audio" },
        ]
      },
      {
        id: "electronics-cameras",
        name: "Cameras",
        children: [
          { id: "electronics-cameras-dslr", name: "DSLR" },
          { id: "electronics-cameras-mirrorless", name: "Mirrorless" },
          { id: "electronics-cameras-action", name: "Action Cameras" },
          { id: "electronics-cameras-lenses", name: "Camera Lenses" },
        ]
      },
      {
        id: "electronics-wearables",
        name: "Wearables",
        children: [
          { id: "electronics-wearables-smartwatch", name: "Smart Watches" },
          { id: "electronics-wearables-fitness", name: "Fitness Trackers" },
          { id: "electronics-wearables-vr", name: "VR Headsets" },
          { id: "electronics-wearables-headsets", name: "Wireless Headsets" },
        ]
      },
    ]
  },
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
    id: "fashion",
    name: "Fashion",
    image: "https://images.unsplash.com/photo-1445205170230-053b83016050?w-800&auto=format&fit=crop",
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
      {
        id: "fashion-accessories",
        name: "Accessories",
        children: [
          { id: "fashion-accessories-bags", name: "Bags" },
          { id: "fashion-accessories-watches", name: "Watches" },
          { id: "fashion-accessories-belts", name: "Belts" },
          { id: "fashion-accessories-sunglasses", name: "Sunglasses" },
        ]
      },
      {
        id: "fashion-kids",
        name: "Kids' Fashion",
        children: [
          { id: "fashion-kids-boys", name: "Boys' Clothing" },
          { id: "fashion-kids-girls", name: "Girls' Clothing" },
          { id: "fashion-kids-baby", name: "Baby Clothing" },
          { id: "fashion-kids-shoes", name: "Kids' Shoes" },
        ]
      },
    ]
  },
  {
    id: "jewellery",
    name: "Jewellery",
    image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w-800&auto=format&fit=crop",
    children: [
      {
        id: "jewellery-rings",
        name: "Rings",
        children: [
          { id: "jewellery-rings-engagement", name: "Engagement Rings" },
          { id: "jewellery-rings-wedding", name: "Wedding Rings" },
          { id: "jewellery-rings-fashion", name: "Fashion Rings" },
          { id: "jewellery-rings-statement", name: "Statement Rings" },
        ]
      },
      {
        id: "jewellery-necklaces",
        name: "Necklaces",
        children: [
          { id: "jewellery-necklaces-pendants", name: "Pendants" },
          { id: "jewellery-necklaces-chains", name: "Chains" },
          { id: "jewellery-necklaces-lockets", name: "Lockets" },
          { id: "jewellery-necklaces-chokers", name: "Chokers" },
        ]
      },
      {
        id: "jewellery-earrings",
        name: "Earrings",
        children: [
          { id: "jewellery-earrings-studs", name: "Stud Earrings" },
          { id: "jewellery-earrings-hoops", name: "Hoops" },
          { id: "jewellery-earrings-danglers", name: "Danglers" },
          { id: "jewellery-earrings-clips", name: "Clip-Ons" },
        ]
      },
      {
        id: "jewellery-bracelets",
        name: "Bracelets",
        children: [
          { id: "jewellery-bracelets-bangles", name: "Bangles" },
          { id: "jewellery-bracelets-cuffs", name: "Cuffs" },
          { id: "jewellery-bracelets-charm", name: "Charm Bracelets" },
          { id: "jewellery-bracelets-tennis", name: "Tennis Bracelets" },
        ]
      },
    ]
  },
  {
    id: "beauty-health",
    name: "Beauty & Health",
    image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w-800&auto=format&fit=crop",
    children: [
      {
        id: "beauty-skincare",
        name: "Skincare",
        children: [
          { id: "beauty-skincare-cleansers", name: "Cleansers" },
          { id: "beauty-skincare-moisturizers", name: "Moisturizers" },
          { id: "beauty-skincare-serums", name: "Serums" },
          { id: "beauty-skincare-masks", name: "Face Masks" },
        ]
      },
      {
        id: "beauty-makeup",
        name: "Makeup",
        children: [
          { id: "beauty-makeup-foundation", name: "Foundation" },
          { id: "beauty-makeup-lipstick", name: "Lipstick" },
          { id: "beauty-makeup-eyeshadow", name: "Eyeshadow" },
          { id: "beauty-makeup-mascara", name: "Mascara" },
        ]
      },
      {
        id: "beauty-fragrance",
        name: "Fragrance",
        children: [
          { id: "beauty-fragrance-perfume", name: "Perfume" },
          { id: "beauty-fragrance-cologne", name: "Cologne" },
          { id: "beauty-fragrance-body", name: "Body Spray" },
          { id: "beauty-fragrance-diffusers", name: "Room Diffusers" },
        ]
      },
      {
        id: "beauty-health",
        name: "Health & Wellness",
        children: [
          { id: "beauty-health-vitamins", name: "Vitamins & Supplements" },
          { id: "beauty-health-fitness", name: "Fitness Equipment" },
          { id: "beauty-health-personal", name: "Personal Care" },
          { id: "beauty-health-massage", name: "Massage Tools" },
        ]
      },
    ]
  },
  {
    id: "toys-games",
    name: "Toys & Games",
    image: "https://images.unsplash.com/photo-1578206134282-9f2d9e3f0e6f?w-800&auto=format&fit=crop",
    children: [
      {
        id: "toys-educational",
        name: "Educational Toys",
        children: [
          { id: "toys-educational-stem", name: "STEM Toys" },
          { id: "toys-educational-building", name: "Building Sets" },
          { id: "toys-educational-puzzles", name: "Puzzles" },
          { id: "toys-educational-learning", name: "Learning Games" },
        ]
      },
      {
        id: "toys-action",
        name: "Action Figures",
        children: [
          { id: "toys-action-superhero", name: "Superheroes" },
          { id: "toys-action-movie", name: "Movie Characters" },
          { id: "toys-action-vehicles", name: "Action Vehicles" },
          { id: "toys-action-collectibles", name: "Collectible Figures" },
        ]
      },
      {
        id: "games-board",
        name: "Board Games",
        children: [
          { id: "games-board-family", name: "Family Games" },
          { id: "games-board-strategy", name: "Strategy Games" },
          { id: "games-board-party", name: "Party Games" },
          { id: "games-board-classic", name: "Classic Games" },
        ]
      },
      {
        id: "toys-outdoor",
        name: "Outdoor Toys",
        children: [
          { id: "toys-outdoor-bikes", name: "Bikes & Scooters" },
          { id: "toys-outdoor-playhouses", name: "Playhouses" },
          { id: "toys-outdoor-sports", name: "Sports Toys" },
          { id: "toys-outdoor-water", name: "Water Toys" },
        ]
      },
    ]
  },
  {
    id: "mother-kids",
    name: "Mother & Kids",
    image: "https://images.unsplash.com/photo-1512757776214-26d36777b513?w-800&auto=format&fit=crop",
    children: [
      {
        id: "mother-pregnancy",
        name: "Pregnancy & Maternity",
        children: [
          { id: "mother-pregnancy-clothing", name: "Maternity Clothing" },
          { id: "mother-pregnancy-support", name: "Support Belts" },
          { id: "mother-pregnancy-skincare", name: "Pregnancy Skincare" },
          { id: "mother-pregnancy-pillows", name: "Pregnancy Pillows" },
        ]
      },
      {
        id: "baby-gear",
        name: "Baby Gear",
        children: [
          { id: "baby-gear-strollers", name: "Strollers" },
          { id: "baby-gear-carriers", name: "Baby Carriers" },
          { id: "baby-gear-carseats", name: "Car Seats" },
          { id: "baby-gear-highchairs", name: "High Chairs" },
        ]
      },
      {
        id: "baby-feeding",
        name: "Feeding",
        children: [
          { id: "baby-feeding-bottles", name: "Baby Bottles" },
          { id: "baby-feeding-breastfeeding", name: "Breastfeeding Supplies" },
          { id: "baby-feeding-food", name: "Baby Food" },
          { id: "baby-feeding-utensils", name: "Feeding Utensils" },
        ]
      },
      {
        id: "kids-room",
        name: "Kids' Room",
        children: [
          { id: "kids-room-furniture", name: "Kids' Furniture" },
          { id: "kids-room-decor", name: "Room Decor" },
          { id: "kids-room-storage", name: "Storage Solutions" },
          { id: "kids-room-lighting", name: "Kids' Lighting" },
        ]
      },
    ]
  },
  {
    id: "sports",
    name: "Sports",
    image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w-800&auto=format&fit=crop",
    children: [
      {
        id: "sports-fitness",
        name: "Fitness Equipment",
        children: [
          { id: "sports-fitness-weights", name: "Weights & Dumbbells" },
          { id: "sports-fitness-yoga", name: "Yoga Equipment" },
          { id: "sports-fitness-cardio", name: "Cardio Machines" },
          { id: "sports-fitness-resistance", name: "Resistance Bands" },
        ]
      },
      {
        id: "sports-team",
        name: "Team Sports",
        children: [
          { id: "sports-team-soccer", name: "Soccer" },
          { id: "sports-team-basketball", name: "Basketball" },
          { id: "sports-team-baseball", name: "Baseball" },
          { id: "sports-team-football", name: "Football" },
        ]
      },
      {
        id: "sports-outdoor",
        name: "Outdoor Sports",
        children: [
          { id: "sports-outdoor-camping", name: "Camping Gear" },
          { id: "sports-outdoor-hiking", name: "Hiking Equipment" },
          { id: "sports-outdoor-cycling", name: "Cycling" },
          { id: "sports-outdoor-fishing", name: "Fishing Gear" },
        ]
      },
      {
        id: "sports-apparel",
        name: "Sports Apparel",
        children: [
          { id: "sports-apparel-shoes", name: "Sports Shoes" },
          { id: "sports-apparel-activewear", name: "Activewear" },
          { id: "sports-apparel-jackets", name: "Sports Jackets" },
          { id: "sports-apparel-accessories", name: "Sports Accessories" },
        ]
      },
    ]
  },
];

export default function ProductCategories({
  categories = defaultCategories,
  onSelectCategory,
  selectedCategory,
}: Props) {
  const [open, setOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Check if mobile view
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="hidden md:block relative text-left w-full" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2 border rounded-md shadow-sm bg-white hover:bg-gray-50 transition-all duration-200"
      >
        <Grid className="w-4 h-4" />
        <span className="text-sm font-medium">Shop by Category</span>
        {open ? <X className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {open && (
        <div className={cn(
          "absolute left-0 mt-2 bg-white w-full  shadow-lg z-50 overflow-hidden",
          isMobile ? "w-full max-h-[80vh] overflow-y-auto" : "flex"
        )}>
          {/* Left Categories */}
          <div className={cn(
            "border-none",
            isMobile ? "w-full" : "w-1/4"
          )}>
            {categories.map((cat) => {
              const Icon = getCategoryIcon(cat.name);
              return (
                <div
                  key={cat.id}
                  onMouseEnter={isMobile ? undefined : () => setActiveCategory(cat)}
                  onClick={isMobile ? () => setActiveCategory(
                    activeCategory?.id === cat.id ? null : cat
                  ) : undefined}
                  className={cn(
                    "flex items-center justify-between px-4 py-3 cursor-pointer transition-all duration-200",
                    "hover:bg-gray-50 ",
                    activeCategory?.id === cat.id && !isMobile
                      ? "border-l-2 border-teal-700 bg-gray-50"
                      : "",
                    activeCategory?.id === cat.id && isMobile
                      ? "bg-teal-50"
                      : ""
                  )}
                >
                  <div className="flex items-center gap-3">
                    {Icon}
                    <span className="text-sm font-medium">{cat.name}</span>
                  </div>
                  {isMobile && cat.children && cat.children.length > 0 && (
                    <ChevronDown className={cn(
                      "w-4 h-4 transition-transform duration-200",
                      activeCategory?.id === cat.id ? "rotate-180" : ""
                    )} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Right Subcategories */}
          {activeCategory && !isMobile && (
            <div className=" relative w-3/4 min-h-[400px]">
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
                  <div className="absolute inset-0 bg-black/10"></div>
                </div>
              )}
              
              {/* Content */}
              <div className="relative z-10 p-6 h-full">
                <h3 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  {activeCategory.name}
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {activeCategory.children?.map((sub) => (
                    <div key={sub.id} className="group">
                      <h4 className="font-semibold text-gray-900 mb-3 pb-1 border-b border-gray-200 group-hover:border-teal-300 transition-colors duration-200">
                        {sub.name}
                      </h4>
                      <ul className="space-y-2">
                        {sub.children?.map((child) => (
                          <li
                            key={child.id}
                            className="text-sm text-gray-700 hover:text-teal-700 cursor-pointer transition-all duration-200 transform origin-left hover:scale-105"
                            onClick={() => {
                              onSelectCategory?.(child.id);
                              setOpen(false);
                            }}
                          >
                            <div className="flex justify-between items-center">
                              <span className="py-1 hover:underline">{child.name}</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* Mobile subcategories view */}
          {isMobile && activeCategory && (
            <div className="w-full p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">{activeCategory.name}</h3>
                <button 
                  onClick={() => setActiveCategory(null)}
                  className="p-1 rounded-full hover:bg-gray-200"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-6">
                {activeCategory.children?.map((sub) => (
                  <div key={sub.id}>
                    <h4 className="font-semibold text-gray-900 mb-3 pb-1 border-b border-gray-200">
                      {sub.name}
                    </h4>
                    <ul className="space-y-2 pl-2">
                      {sub.children?.map((child) => (
                        <li
                          key={child.id}
                          className="text-sm text-gray-700 hover:text-teal-700 cursor-pointer py-2 border-b border-gray-100 last:border-b-0"
                          onClick={() => {
                            onSelectCategory?.(child.id);
                            setOpen(false);
                          }}
                        >
                          <div className="flex justify-between items-center">
                            <span>{child.name}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}