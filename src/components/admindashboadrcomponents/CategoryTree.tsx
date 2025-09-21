import React, { useState } from "react";
import { ChevronDown, ChevronRight, Folder, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Category } from "../../types/type";

interface CategoryTreeProps {
  categories: Category[];
  selectedCategoryId?: string | null;
  onSelectCategory: (id: string | null) => void;
  onEditCategory: (category: Category) => void;
  onDeleteCategory: (category: Category) => void;
}

const CategoryTreeItem: React.FC<{
  category: Category;
  selectedCategoryId?: string | null;
  onSelectCategory: (id: string | null) => void;
  onEditCategory: (category: Category) => void;
  onDeleteCategory: (category: Category) => void;
}> = ({ category, selectedCategoryId, onSelectCategory, onEditCategory, onDeleteCategory }) => {
  const [open, setOpen] = useState(false);
  const hasChildren = category.children && category.children.length > 0;

  return (
    <div className="ml-4">
      <div className={`flex justify-between items-center p-1 cursor-pointer rounded text-sm ${selectedCategoryId === category.id ? "bg-teal-50 border border-teal-200 text-teal-800" : "hover:bg-gray-100"}`}>
        {/* Expand/Collapse Arrow */}
        <div className="flex items-center gap-1" onClick={(e) => { e.stopPropagation(); if (hasChildren) setOpen(!open); }}>
          {hasChildren ? (
            <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
          ) : (
            <ChevronRight className="h-3 w-3 opacity-0" />
          )}
        </div>

        {/* Category Name - Select */}
        <div className="flex-1 flex items-center gap-1" onClick={() => onSelectCategory(category.id)}>
          <Folder className="h-3 w-3" />
          <span className="truncate">{category.name}</span>
        </div>

        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onEditCategory(category); }}>
            <Edit className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onDeleteCategory(category); }}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {hasChildren && open && (
        <div className="ml-3 border-l border-gray-200">
          {category?.children?.map((child) => (
            <CategoryTreeItem
              key={child.id}
              category={child}
              selectedCategoryId={selectedCategoryId}
              onSelectCategory={onSelectCategory}
              onEditCategory={onEditCategory}
              onDeleteCategory={onDeleteCategory}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const CategoryTree: React.FC<CategoryTreeProps> = ({ categories, selectedCategoryId, onSelectCategory, onEditCategory, onDeleteCategory }) => {
  return (
    <div className="space-y-1 max-h-96 overflow-auto">
      {categories.map((cat) => (
        <CategoryTreeItem
          key={cat.id}
          category={cat}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={onSelectCategory}
          onEditCategory={onEditCategory}
          onDeleteCategory={onDeleteCategory}
        />
      ))}
    </div>
  );
};

export default CategoryTree;
