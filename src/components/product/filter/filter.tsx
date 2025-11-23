"use client";

import { useState, useEffect } from "react";
import { X, Plus, Minus, Star, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";



interface Category {
  name: string;
  count: number;
  children?: Category[];
}

// Dummy data
const categories: Category[] = [
  {
    name: "Fashion",
    count: 45,
    children: [
      {
        name: "Men",
        count: 20,
        children: [
          { name: "Accessories", count: 5 },
          { name: "Coats", count: 2 },
          { name: "Jackets", count: 3 },
          { name: "Jeans", count: 4 },
          { name: "Pants", count: 3 },
          { name: "Shirts", count: 3 },
        ],
      },
      {
        name: "Women",
        count: 25,
        children: [
          { name: "Dresses", count: 6 },
          { name: "Tops", count: 5 },
          { name: "Skirts", count: 4 },
          { name: "Pants", count: 5 },
          { name: "Shoes", count: 5 },
        ],
      },
    ],
  },
  {
    name: "Electronics",
    count: 28,
    children: [
      {
        name: "Audio",
        count: 8,
        children: [
          { name: "Headphones", count: 4 },
          { name: "Speakers", count: 4 },
        ],
      },
      {
        name: "Wearables",
        count: 6,
        children: [
          { name: "Smart Watches", count: 4 },
          { name: "Fitness Trackers", count: 2 },
        ],
      },
      {
        name: "Computers",
        count: 7,
        children: [
          { name: "Laptops", count: 3 },
          { name: "Desktops", count: 2 },
          { name: "Monitors", count: 2 },
        ],
      },
      {
        name: "Phones",
        count: 7,
        children: [
          { name: "Smartphones", count: 5 },
          { name: "Feature Phones", count: 2 },
        ],
      },
    ],
  },
  {
    name: "Home & Furniture",
    count: 20,
    children: [
      {
        name: "Living Room",
        count: 8,
        children: [
          { name: "Sofas", count: 3 },
          { name: "Coffee Tables", count: 2 },
          { name: "TV Stands", count: 3 },
        ],
      },
      {
        name: "Bedroom",
        count: 7,
        children: [
          { name: "Beds", count: 3 },
          { name: "Wardrobes", count: 2 },
          { name: "Nightstands", count: 2 },
        ],
      },
      {
        name: "Kitchen",
        count: 5,
        children: [
          { name: "Cookware", count: 2 },
          { name: "Dining Tables", count: 3 },
        ],
      },
    ],
  },
  {
    name: "Beauty & Personal Care",
    count: 18,
    children: [
      {
        name: "Makeup",
        count: 8,
        children: [
          { name: "Lipsticks", count: 3 },
          { name: "Foundations", count: 3 },
          { name: "Mascaras", count: 2 },
        ],
      },
      {
        name: "Skincare",
        count: 6,
        children: [
          { name: "Moisturizers", count: 2 },
          { name: "Cleansers", count: 2 },
          { name: "Serums", count: 2 },
        ],
      },
      {
        name: "Haircare",
        count: 4,
        children: [
          { name: "Shampoos", count: 2 },
          { name: "Conditioners", count: 2 },
        ],
      },
    ],
  },
  {
    name: "Sports & Outdoors",
    count: 22,
    children: [
      {
        name: "Fitness",
        count: 10,
        children: [
          { name: "Treadmills", count: 2 },
          { name: "Dumbbells", count: 3 },
          { name: "Yoga Mats", count: 2 },
          { name: "Resistance Bands", count: 3 },
        ],
      },
      {
        name: "Outdoor",
        count: 12,
        children: [
          { name: "Camping Gear", count: 4 },
          { name: "Tents", count: 3 },
          { name: "Sleeping Bags", count: 2 },
          { name: "Backpacks", count: 3 },
        ],
      },
    ],
  },
  {
    name: "Books",
    count: 12,
    children: [
      {
        name: "Fiction",
        count: 6,
        children: [
          { name: "Novels", count: 3 },
          { name: "Short Stories", count: 3 },
        ],
      },
      {
        name: "Non-Fiction",
        count: 6,
        children: [
          { name: "Biographies", count: 2 },
          { name: "Self-Help", count: 2 },
          { name: "Science", count: 2 },
        ],
      },
    ],
  },
];


const brands = [
  "Nike",
  "Adidas",
  "Puma",
  "Levi's",
  "H&M",
  "Gucci",
  "Zara",
  "Apple",
  "Samsung",
  "Sony",
  "Bose",
  "LG",
  "Microsoft",
  "Dell",
  "HP",
];
const sizes = ["XS", "S", "M", "L", "XL", "XXL"];
const colorsList = [
  { name: "Black", value: "#000000" },
  { name: "White", value: "#FFFFFF" },
  { name: "Red", value: "#FF0000" },
  { name: "Blue", value: "#0000FF" },
  { name: "Green", value: "#008000" },
  { name: "Yellow", value: "#FFFF00" },
  { name: "Purple", value: "#800080" },
  { name: "Pink", value: "#FFC0CB" },
  { name: "Orange", value: "#FFA500" },
  { name: "Gray", value: "#808080" },
];

// Filter Sidebar Component
interface FilterSidebarProps {
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

export const FilterSidebar: React.FC<FilterSidebarProps> = ({ 
  isMobileOpen, 
  onMobileClose 
}) => {
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >({
    Fashion: true,
    Electronics: true,
  });
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [brandSearch, setBrandSearch] = useState("");
  const [showAllBrands, setShowAllBrands] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);

  const toggleFilter = (filter: string) => {
    setSelectedFilters((prev) =>
      prev.includes(filter)
        ? prev.filter((f) => f !== filter)
        : [...prev, filter]
    );
  };

//   const clearAll = () => setSelectedFilters([]);

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryName]: !prev[categoryName],
    }));
  };

  const renderCategory = (category: Category, level = 0) => {
    const bgColors = [
      "bg-transparent",
      "bg-gray-50",
      "bg-gray-100",
    ];
    
    return (
      <li 
        key={category.name} 
        className={`mb-1 rounded-md ${level < bgColors.length ? bgColors[level] : ''}`}
      >
        <div
          className="flex justify-between items-center py-2 px-2 cursor-pointer hover:text-gray-900"
          onClick={() => category.children && toggleCategory(category.name)}
        >
          <span className="text-sm">
            {category.name}{" "}
            <span className="text-gray-500">({category.count})</span>
          </span>
          {category.children &&
            (expandedCategories[category.name] ? (
              <Minus size={14} />
            ) : (
              <Plus size={14} />
            ))}
        </div>
        {category.children && expandedCategories[category.name] && (
          <ul className={`ml-4 mt-1 space-y-1 ${level > 0 ? "border-l pl-2" : ""}`}>
            {category.children.map((child) => renderCategory(child, level + 1))}
          </ul>
        )}
      </li>
    );
  };

  // Determine how many categories to show initially
  const initialCategoryCount = 2;
  const displayedCategories = showAllCategories 
    ? categories 
    : categories.slice(0, initialCategoryCount);

  // Filter and limit brands based on search and showAll state
  const filteredBrands = brands.filter((brand) =>
    brand.toLowerCase().includes(brandSearch.toLowerCase())
  );
  const initialBrandCount = 5;
  const displayedBrands = showAllBrands 
    ? filteredBrands 
    : filteredBrands.slice(0, initialBrandCount);

  // Close mobile sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (isMobileOpen && !target.closest('.filter-sidebar') && !target.closest('.filter-button')) {
        onMobileClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobileOpen, onMobileClose]);

  const FilterContent = () => (
    <div className="w-full md:w-64 p-4 h-full md:h-fit bg-white overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Filters</h2>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden h-8 w-8"
          onClick={onMobileClose}
        >
          <X size={16} />
        </Button>
      </div>

      <div className="space-y-4">
        {/* Selected Filters */}
        {selectedFilters.length > 0 && (
          <div className="pb-4 border-b">
            <h3 className="text-sm font-medium mb-2">Active Filters</h3>
            <div className="flex flex-wrap gap-2">
              {selectedFilters.map((filter) => (
                <Badge
                  key={filter}
                  variant="secondary"
                  className="flex items-center gap-1 py-1 px-2 text-xs"
                >
                  {filter}
                  <X
                    size={12}
                    className="cursor-pointer"
                    onClick={() => toggleFilter(filter)}
                  />
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Categories */}
        <div className="pb-4 border-b">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium">Categories</h3>
            {categories.length > initialCategoryCount && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => setShowAllCategories(!showAllCategories)}
              >
                {showAllCategories ? (
                  <>
                    <ChevronUp size={12} className="mr-1" />
                    See Less
                  </>
                ) : (
                  <>
                    <ChevronDown size={12} className="mr-1" />
                    See More
                  </>
                )}
              </Button>
            )}
          </div>
          <ul className="space-y-1">
            {displayedCategories.map((category) => renderCategory(category))}
          </ul>
        </div>

        {/* Price Filter */}
        <div className="pb-4 border-b">
          <h3 className="text-sm font-medium mb-2">Price Range</h3>
          <Slider
            value={priceRange}
            onValueChange={setPriceRange}
            max={500}
            step={10}
            className="mb-2"
          />
          <div className="flex justify-between text-sm text-gray-600">
            <span>${priceRange[0]}</span>
            <span>${priceRange[1]}</span>
          </div>
        </div>

        {/* Brand Filter */}
        <div className="pb-4 border-b">
          <h3 className="text-sm font-medium mb-2">Brand</h3>
          <Input
            placeholder="Search brand"
            value={brandSearch}
            onChange={(e) => setBrandSearch(e.target.value)}
            className="mb-2"
          />
          <div className="space-y-2">
            {displayedBrands.map((brand) => (
              <div key={brand} className="flex items-center space-x-2">
                <Checkbox
                  id={`brand-${brand}`}
                  checked={selectedFilters.includes(brand)}
                  onCheckedChange={() => toggleFilter(brand)}
                />
                <label
                  htmlFor={`brand-${brand}`}
                  className="text-sm text-gray-700 cursor-pointer"
                >
                  {brand}
                </label>
              </div>
            ))}
          </div>
          {filteredBrands.length > initialBrandCount && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 h-8 px-2 text-xs"
              onClick={() => setShowAllBrands(!showAllBrands)}
            >
              {showAllBrands ? (
                <>
                  <ChevronUp size={12} className="mr-1" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown size={12} className="mr-1" />
                  Show More ({filteredBrands.length - initialBrandCount})
                </>
              )}
            </Button>
          )}
        </div>

        {/* Size Filter */}
        <div className="pb-4 border-b">
          <h3 className="text-sm font-medium mb-2">Size</h3>
          <div className="flex flex-wrap gap-2">
            {sizes.map((size) => (
              <Button
                key={size}
                variant={selectedFilters.includes(size) ? "default" : "outline"}
                size="sm"
                className="h-8 px-2 text-xs"
                onClick={() => toggleFilter(size)}
              >
                {size}
              </Button>
            ))}
          </div>
        </div>

        {/* Color Filter */}
        <div className="pb-4 border-b">
          <h3 className="text-sm font-medium mb-2">Color</h3>
          <div className="flex flex-wrap gap-2">
            {colorsList.map((color) => (
              <div
                key={color.value}
                className={`w-6 h-6 rounded-full border cursor-pointer flex items-center justify-center ${
                  selectedFilters.includes(color.name)
                    ? "ring-2 ring-offset-2 ring-gray-800"
                    : ""
                }`}
                style={{ backgroundColor: color.value }}
                onClick={() => toggleFilter(color.name)}
                title={color.name}
              />
            ))}
          </div>
        </div>

        {/* Customer Ratings */}
        <div className="pb-4 border-b">
          <h3 className="text-sm font-medium mb-2">Customer Ratings</h3>
          <div className="space-y-2">
            {[5, 4, 3].map((rating) => (
              <div key={rating} className="flex items-center space-x-2">
                <Checkbox
                  id={`rating-${rating}`}
                  checked={selectedFilters.includes(`${rating} stars`)}
                  onCheckedChange={() => toggleFilter(`${rating} stars`)}
                />
                <label
                  htmlFor={`rating-${rating}`}
                  className="flex items-center text-sm text-gray-700 cursor-pointer"
                >
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      className={`${
                        i < rating
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                  <span className="ml-1">& Up</span>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Availability */}
        <div>
          <h3 className="text-sm font-medium mb-2">Availability</h3>
          <div className="space-y-2">
            {["In Stock", "On Sale", "New Arrivals"].map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <Checkbox
                  id={option}
                  checked={selectedFilters.includes(option)}
                  onCheckedChange={() => toggleFilter(option)}
                />
                <label
                  htmlFor={option}
                  className="text-sm text-gray-700 cursor-pointer"
                >
                  {option}
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:block filter-sidebar">
        <FilterContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" />
      )}

      {/* Mobile sidebar */}
      <div className={`
        fixed top-0 left-0 h-full w-full bg-white z-50 shadow-xl transform transition-transform duration-300 ease-in-out
        md:hidden filter-sidebar overflow-y-auto
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <FilterContent />
      </div>
    </>
  );
};