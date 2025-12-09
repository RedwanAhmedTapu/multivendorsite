// AdminCategoryManager.tsx (Updated to Single Column)
"use client";
import React, { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ListTree, Settings, Tags } from "lucide-react";
import {
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} from "@/features/apiSlice";
import CategoryTree from "../CategoryTree";
import CategoryForm from "../CategoryForm";
import PropertiesManager from "../PropertiesManager";
import { Category } from "@/types/category.types";

const AdminCategoryManager = () => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const { data: categories = [], refetch: refetchCategories } = useGetCategoriesQuery();
  const [createCategory] = useCreateCategoryMutation();
  const [updateCategory] = useUpdateCategoryMutation();
  const [deleteCategory] = useDeleteCategoryMutation();

  // Find the selected category in the full tree
  const selectedCategory = useMemo(() => {
    const findCategoryById = (cats: Category[], id: string): Category | null => {
      for (const cat of cats) {
        if (cat.id === id) return cat;
        if (cat.children?.length) {
          const found = findCategoryById(cat.children, id);
          if (found) return found;
        }
      }
      return null;
    };
    if (selectedCategoryId) return findCategoryById(categories, selectedCategoryId);
    return null;
  }, [selectedCategoryId, categories]);

  const handleCreateCategory = async (formData: FormData, parentId?: string | null) => {
    try {
      if (parentId) {
        formData.set("parentId", parentId);
      } else {
        formData.delete("parentId");
      }

      const promise = createCategory(formData).unwrap();
      toast.promise(promise, {
        loading: `Creating category...`,
        success: (category) => {
          refetchCategories();
          return `Category "${category.name}" created successfully`;
        },
        error: (error) => error.data?.message || "Failed to create category",
      });
    } catch {
      toast.error("Failed to create category");
    }
  };

  const handleUpdateCategory = async (id: string, formData: FormData) => {
    try {
      const promise = updateCategory({ id, formData }).unwrap();
      toast.promise(promise, {
        loading: `Updating category...`,
        success: (category) => {
          setEditingCategory(null);
          refetchCategories();
          return `Category "${category.name}" updated successfully`;
        },
        error: (error) => error.data?.message || "Failed to update category",
      });
    } catch {
      toast.error("Failed to update category");
    }
  };

  const handleDeleteCategory = async (category: Category) => {
    try {
      const promise = deleteCategory(category.id).unwrap();
      toast.promise(promise, {
        loading: `Deleting category "${category.name}"...`,
        success: () => {
          if (selectedCategoryId === category.id) setSelectedCategoryId(null);
          refetchCategories();
          return "Category deleted successfully";
        },
        error: (error) => error.data?.message || "Failed to delete category",
      });
    } catch {
      toast.error("Failed to delete category");
    }
  };

  const parentCategories = categories.filter((c) => !c.parentId);

  return (
    <div className="min-h-screen">
      <div className="mx-auto space-y-6">
        {/* Single Column Layout */}
        <div className="space-y-6">
          {/* Category Structure Section */}
          {categories.length !== 0 && (
          <Card className="bg-white border-gray-200 shadow-none ">
            <CardHeader className="bg-gray-50 border-b border-gray-200">
              <CardTitle className="text-gray-900 flex items-center gap-2">
                <ListTree className="h-5 w-5" />
                Category Structure
              </CardTitle>
              <CardDescription className="text-gray-500">
                View and manage your category hierarchy
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <CategoryTree
                categories={categories}
                selectedCategoryId={selectedCategoryId}
                onSelectCategory={setSelectedCategoryId}
                onEditCategory={setEditingCategory}
                onDeleteCategory={handleDeleteCategory}
              />
            </CardContent>
          </Card>)}

          {/* Category Form Section */}
          <Card className="bg-white border-gray-200 shadow-none">
            <CardHeader className="bg-gray-50 border-b border-gray-200">
              <CardTitle className="text-gray-900">
                {editingCategory ? "Edit Category" : "Create New Category"}
              </CardTitle>
              <CardDescription className="text-gray-500">
                {editingCategory
                  ? "Update category details"
                  : "Add a new category to your hierarchy"}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <CategoryForm
                editingCategory={editingCategory}
                selectedParentId={selectedCategoryId}
                parentCategories={parentCategories}
                onUpdateCategory={handleUpdateCategory}
                onCreateCategory={handleCreateCategory}
                onCancelEdit={() => setEditingCategory(null)}
                onSelectParent={setSelectedCategoryId}
              />
            </CardContent>
          </Card>

          {/* Properties Manager Section (Conditional) */}
          {selectedCategory && (
            <Card className="bg-white border-gray-200 shadow-none">
              
              <CardContent className="p-2">
                <PropertiesManager
                  selectedChildId={selectedCategory.id}
                  selectedChildCategory={selectedCategory}
                />
              </CardContent>
            </Card>
          )}

         
        </div>
      </div>
    </div>
  );
};

export default AdminCategoryManager;