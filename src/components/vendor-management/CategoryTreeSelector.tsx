// components/vendor-management/CategoryTreeSelector.tsx
"use client";
import React, { useState, useMemo } from "react";
import { ChevronDown, ChevronRight, Folder } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGetCategoriesQuery } from "@/features/apiSlice";
import { Category } from "@/types/type";

interface Props {
  onSelect: (id: string, path: string, isLeaf: boolean, attributes: any[], specifications: any[]) => void;
}

const CategoryTreeSelectorItem: React.FC<{
  category: Category;
  selectedCategoryId?: string | null;
  onSelectCategory: (id: string, path: string, isLeaf: boolean, attributes: any[], specifications: any[]) => void;
  parentPath?: string;
}> = ({ category, selectedCategoryId, onSelectCategory, parentPath = "" }) => {
  const [open, setOpen] = useState(false);
  const hasChildren = Array.isArray(category.children) && category.children.length > 0;
  const isLeaf = !hasChildren;
  const currentPath = parentPath ? `${parentPath} > ${category.name}` : category.name;

  // Split unified attributes into original categories for backward compatibility
  const { regularAttributes, specificationAttributes } = useMemo(() => {
    const regular: any[] = [];
    const specs: any[] = [];
    
    // Check if category has the unified attributes array
    if (category.attributes && Array.isArray(category.attributes)) {
      category.attributes.forEach((attr: any) => {
        // Determine if it's a specification based on its properties
        // You can adjust these conditions based on your actual data structure
        const isSpecification = 
          attr.type === 'specification' ||
          attr.dataType === 'number' ||
          attr.unit !== undefined ||
          attr.minValue !== undefined ||
          attr.maxValue !== undefined ||
          (attr.name && attr.name.toLowerCase().includes('spec'));
        
        if (isSpecification) {
          specs.push(attr);
        } else {
          regular.push(attr);
        }
      });
    }
    
    return { regularAttributes: regular, specificationAttributes: specs };
  }, [category.attributes]);

  return (
    <div className="ml-4">
      <div
        className={`flex justify-between items-center p-1 cursor-pointer rounded text-sm ${
          selectedCategoryId === category.id
            ? "bg-teal-50 border border-teal-200 text-teal-800"
            : "hover:bg-gray-100"
        }`}
        onClick={() => onSelectCategory(
          category.id, 
          currentPath, 
          isLeaf, 
          regularAttributes, 
          specificationAttributes
        )}
      >
        {/* Expand/Collapse Arrow */}
        <div
          className="flex items-center gap-1"
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) setOpen(!open);
          }}
        >
          {hasChildren ? (
            <ChevronDown
              className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`}
            />
          ) : (
            <ChevronRight className="h-3 w-3 opacity-0" />
          )}
        </div>

        {/* Category Name */}
        <div className="flex-1 flex items-center gap-1">
          <Folder className="h-3 w-3" />
          <span className="truncate">{category.name}</span>
          {isLeaf && <span className="text-xs text-gray-500 ml-1">(Leaf)</span>}
        </div>
      </div>

      {hasChildren && open && (
        <div className="ml-3 border-l border-gray-200">
          {category.children?.map((child) => (
            <CategoryTreeSelectorItem
              key={child.id}
              category={child}
              selectedCategoryId={selectedCategoryId}
              onSelectCategory={onSelectCategory}
              parentPath={currentPath}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default function CategoryTreeSelector({ onSelect }: Props) {
  const { data: categories } = useGetCategoriesQuery();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedPath, setSelectedPath] = useState<string>("");
  const [isLeafCategory, setIsLeafCategory] = useState<boolean>(false);
  const [categoryAttributes, setCategoryAttributes] = useState<any[]>([]);
  const [categorySpecifications, setCategorySpecifications] = useState<any[]>([]);

  const handleSelectCategory = (id: string, path: string, isLeaf: boolean, attributes: any[], specifications: any[]) => {
    setSelectedId(id);
    setSelectedPath(path);
    setIsLeafCategory(isLeaf);
    setCategoryAttributes(attributes);
    setCategorySpecifications(specifications);
    onSelect(id, path, isLeaf, attributes, specifications);
  };

  return (
    <div>
      <h3 className="font-medium mb-2">Select Category</h3>
      <div className="space-y-1 max-h-96 overflow-auto">
        {categories ? (
          categories.map((cat) => (
            <CategoryTreeSelectorItem
              key={cat.id}
              category={cat}
              selectedCategoryId={selectedId}
              onSelectCategory={handleSelectCategory}
            />
          ))
        ) : (
          <p>Loading...</p>
        )}
      </div>

      {selectedId && (
        <div className="mt-4 p-3 border rounded-md bg-gray-50">
          <p className="text-sm font-medium">Selected: {selectedPath}</p>
          
          <div className="mt-2 text-xs">
            {categoryAttributes.length > 0 && (
              <p className="text-gray-600">
                Attributes: {categoryAttributes.length} available
              </p>
            )}
            {categorySpecifications.length > 0 && (
              <p className="text-gray-600">
                Specifications: {categorySpecifications.length} available
              </p>
            )}
            {categoryAttributes.length === 0 && categorySpecifications.length === 0 && (
              <p className="text-gray-500">No attributes or specifications defined for this category</p>
            )}
          </div>
          
          {isLeafCategory ? (
            <div className="mt-2">
              <p className="text-xs text-green-600">✓ Leaf category selected</p>
            </div>
          ) : (
            <p className="text-xs text-red-600 mt-1">
              ⚠️ Please select a leaf category (no subcategories)
            </p>
          )}
        </div>
      )}
    </div>
  );
}