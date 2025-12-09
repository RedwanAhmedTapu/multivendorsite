import React, { useState } from "react";
import { ChevronDown, ChevronRight, Folder, Edit, Trash2, AlertTriangle } from "lucide-react";
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
  onDeleteClick: (category: Category) => void;
}> = ({ category, selectedCategoryId, onSelectCategory, onEditCategory, onDeleteClick }) => {
  const [open, setOpen] = useState(false);
  const hasChildren = category.children && category.children.length > 0;

  return (
    <div className="ml-4">
      <div className={`flex justify-between items-center p-1 cursor-pointer rounded text-sm ${selectedCategoryId === category.id ? "bg-teal-50 border border-teal-200 text-teal-800" : "hover:bg-gray-100"}`}>
        <div className="flex items-center gap-1" onClick={(e) => { e.stopPropagation(); if (hasChildren) setOpen(!open); }}>
          {hasChildren ? (
            <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
          ) : (
            <ChevronRight className="h-3 w-3 opacity-0" />
          )}
        </div>

        <div className="flex-1 flex items-center gap-1" onClick={() => onSelectCategory(category.id)}>
          <Folder className="h-3 w-3" />
          <span className="truncate">{category.name}</span>
        </div>

        <div className="flex gap-1">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={(e) => { 
              e.stopPropagation(); 
              onEditCategory(category); 
            }}
          >
            <Edit className="h-3 w-3" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={(e) => { 
              e.stopPropagation(); 
              onDeleteClick(category); 
            }}
          >
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
              onDeleteClick={onDeleteClick}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const CategoryTree: React.FC<CategoryTreeProps> = ({ 
  categories, 
  selectedCategoryId, 
  onSelectCategory, 
  onEditCategory, 
  onDeleteCategory 
}) => {
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    category: Category | null;
  }>({
    isOpen: false,
    category: null,
  });

  const handleDeleteClick = (category: Category) => {
    setDeleteDialog({
      isOpen: true,
      category,
    });
  };

  const handleConfirmDelete = () => {
    if (deleteDialog.category) {
      onDeleteCategory(deleteDialog.category);
      setDeleteDialog({ isOpen: false, category: null });
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialog({ isOpen: false, category: null });
  };

  const hasChildren = deleteDialog.category?.children && deleteDialog.category.children.length > 0;

  return (
    <>
      <div className="space-y-1 max-h-96 overflow-auto">
        {categories.map((cat) => (
          <CategoryTreeItem
            key={cat.id}
            category={cat}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={onSelectCategory}
            onEditCategory={onEditCategory}
            onDeleteClick={handleDeleteClick}
          />
        ))}
      </div>

      {deleteDialog.isOpen && deleteDialog.category && (
        <div className="fixed inset-0  flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-red-100 p-2">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Delete Category
                  </h3>
                  <p className="text-gray-600 mt-2">
                    Are you sure you want to delete{" "}
                    <span className="font-semibold text-gray-900">"{deleteDialog.category.name}"</span>?
                  </p>
                  
                  {hasChildren && (
                    <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-md">
                      <p className="text-amber-800 font-medium text-sm">
                        ⚠️ This category has {deleteDialog.category.children?.length} subcategories. 
                        All subcategories will also be deleted.
                      </p>
                    </div>
                  )}
                  
                  <p className="text-red-600 font-medium mt-4">
                    This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 rounded-b-lg">
              <Button
                variant="outline"
                onClick={handleCancelDelete}
                className="px-4"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmDelete}
                className="px-4"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CategoryTree;