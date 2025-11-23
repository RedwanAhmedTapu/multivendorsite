"use client";

import { useState, useRef, useEffect } from "react";
import {
  ChevronDown,
  Grid,
  Shirt,
  Laptop,
  Home,
  Sparkles,
  X,
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

const categoryIcons: Record<string, React.ReactElement> = {
  Fashion: <Shirt className="w-4 h-4 text-gray-600" />,
  Electronics: <Laptop className="w-4 h-4 text-gray-600" />,
  "Home & Garden": <Home className="w-4 h-4 text-gray-600" />,
  Default: <Sparkles className="w-4 h-4 text-gray-600" />,
};

export default function ProductCategories({
  categories,
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

  const getCategoryIcon = (categoryName: string) => {
    return categoryIcons[categoryName] || categoryIcons["Default"];
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
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
          "absolute left-0 mt-2 bg-white border shadow-lg z-50 overflow-hidden",
          isMobile ? "w-full max-h-[80vh] overflow-y-auto" : "flex"
        )}>
          {/* Left Categories */}
          <div className={cn(
            "border-r",
            isMobile ? "w-full" : "w-64"
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
                    "hover:bg-gray-50 border-b border-gray-100 last:border-b-0",
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
            <div className="w-[800px] relative min-h-[400px]">
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