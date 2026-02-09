"use client";

import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
  parentId?: string | null;
  children?: Category[];
}

interface NestedCategoryMenuProps {
  categories: Category[];
  onCategorySelect?: (slug: string) => void;
  onClose?: () => void;
}

export default function NestedCategoryMenu({ 
  categories, 
  onCategorySelect,
  onClose 
}: NestedCategoryMenuProps) {
  const router = useRouter();
  const [hoveredLevel1, setHoveredLevel1] = useState<Category | null>(null);
  const [hoveredLevel2, setHoveredLevel2] = useState<Category | null>(null);

  // Filter root categories (categories without parentId)
  const rootCategories = categories.filter(cat => !cat.parentId);

  const handleCategoryClick = (slug: string, event: React.MouseEvent, isRootCategory: boolean = false) => {
    event.stopPropagation();
    
    // Only navigate if it's NOT a root category (level 2 or 3)
    if (!isRootCategory) {
      if (onCategorySelect) {
        onCategorySelect(slug);
      } else {
        router.push(`/products?category=${slug}`);
      }
      
      // Close the modal after navigation
      if (onClose) {
        onClose();
      }
    }
  };

  const handleLevel1MouseEnter = (category: Category) => {
    setHoveredLevel1(category);
    setHoveredLevel2(null); // Reset level 2 when changing level 1
  };

  const handleLevel2MouseEnter = (category: Category) => {
    setHoveredLevel2(category);
  };

  return (
    <div className="flex gap-0 bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
      {/* Level 1: Root Categories */}
      <div className="w-64 border-r border-gray-200 bg-white">
        <div className="p-3 bg-gradient-to-r from-teal-600 to-teal-700 text-white font-semibold text-sm">
          All Categories
        </div>
        <div className="max-h-[500px] overflow-y-auto">
          {rootCategories.length > 0 ? (
            rootCategories.map((category) => (
              <div key={category.id}>
                <div
                  className={`flex items-center justify-between px-4 py-2.5 cursor-pointer transition-all duration-200 text-gray-700 hover:bg-gray-50 hover:text-teal-500 ${
                    hoveredLevel1?.id === category.id
                      ? 'bg-teal-50 text-teal-500'
                      : ''
                  }`}
                  onMouseEnter={() => handleLevel1MouseEnter(category)}
                  onClick={(e) => handleCategoryClick(category.slug, e, true)}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className={`text-sm truncate ${
                      hoveredLevel1?.id === category.id ? 'font-semibold' : 'font-medium'
                    }`}>
                      {category.name}
                    </span>
                  </div>
                  {category.children && category.children.length > 0 && (
                    <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
                  )}
                </div>
                <div className="border-b border-gray-200"></div>
              </div>
            ))
          ) : (
            <div className="px-4 py-8 text-center text-gray-500 text-sm">
              No categories available
            </div>
          )}
        </div>
      </div>

      {/* Level 2: Child Categories */}
      {hoveredLevel1 && hoveredLevel1.children && hoveredLevel1.children.length > 0 && (
        <div className="w-64 border-r border-gray-200 bg-white animate-in slide-in-from-left duration-200">
          <div className="p-3 bg-gray-100 font-semibold text-gray-600 border-b border-gray-200 text-sm truncate">
            {hoveredLevel1.name}
          </div>
          <div className="max-h-[500px] overflow-y-auto">
            {hoveredLevel1.children.map((child) => (
              <div key={child.id}>
                <div
                  className={`flex items-center justify-between px-4 py-2.5 cursor-pointer transition-all duration-200 text-gray-600 hover:bg-gray-50 hover:text-teal-500 ${
                    hoveredLevel2?.id === child.id
                      ? 'bg-teal-50 text-teal-500'
                      : ''
                  }`}
                  onMouseEnter={() => handleLevel2MouseEnter(child)}
                  onClick={(e) => handleCategoryClick(child.slug, e, false)}
                >
                  <span className={`text-sm flex-1 truncate ${
                    hoveredLevel2?.id === child.id ? 'font-semibold' : 'font-medium'
                  }`}>
                    {child.name}
                  </span>
                  {child.children && child.children.length > 0 && (
                    <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
                  )}
                </div>
                <div className="border-b border-gray-200"></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Level 3: Grand Child Categories */}
      {hoveredLevel2 && hoveredLevel2.children && hoveredLevel2.children.length > 0 && (
        <div className="w-64 bg-white animate-in slide-in-from-left duration-200">
          <div className="p-3 bg-gray-100 font-semibold text-gray-900 border-b border-gray-200 text-sm truncate">
            {hoveredLevel2.name}
          </div>
          <div className="max-h-[500px] overflow-y-auto">
            {hoveredLevel2.children?.map((grandChild) => (
              <div key={grandChild.id}>
                <div
                  className="px-4 py-2.5 cursor-pointer text-gray-900 hover:bg-teal-50 hover:text-teal-500 transition-all duration-200"
                  onClick={(e) => handleCategoryClick(grandChild.slug, e, false)}
                >
                  <span className="text-sm font-medium hover:font-semibold truncate block">
                    {grandChild.name}
                  </span>
                </div>
                <div className="border-b border-gray-200"></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}