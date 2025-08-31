"use client";
import React, { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ListTree, Settings } from "lucide-react";
import {
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} from "@/features/apiSlice";
import CategoryTree from "../../admindashboadrcomponents/CategoryTree";
import CategoryForm from "../../admindashboadrcomponents/CategoryForm";
import PropertiesManager from "../../admindashboadrcomponents/PropertiesManager";
import { Category } from "../../../types/type";

const AdminCategoryManager = () => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [activeTab, setActiveTab] = useState<"attributes" | "specifications">("attributes");

  const { data: categories = [], isLoading: categoriesLoading, refetch: refetchCategories } = useGetCategoriesQuery();
  const [createCategory] = useCreateCategoryMutation();
  const [updateCategory] = useUpdateCategoryMutation();
  const [deleteCategory] = useDeleteCategoryMutation();

  // Find category by id recursively
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

  // Check if selected category is leaf (no children)
  const isLeaf = selectedCategory ? !(selectedCategory.children && selectedCategory.children.length > 0) : false;

  const handleCreateCategory = async (categoryData: { name: string; slug: string; image?: string }, parentId?: string) => {
    if (!categoryData.name || !categoryData.slug) {
      toast.error("Please provide both name and slug");
      return;
    }
    try {
      const promise = createCategory({ ...categoryData, parentId: parentId || null }).unwrap();
      toast.promise(promise, {
        loading: `Creating category "${categoryData.name}"...`,
        success: (category) => {
          refetchCategories();
          return `Category "${category.name}" created successfully`;
        },
        error: (error) => error.data?.message || "Failed to create category",
      });
    } catch (err) {
      toast.error("Failed to create category");
    }
  };

  const handleUpdateCategory = async (categoryData: Category) => {
    if (!categoryData.name || !categoryData.slug) {
      toast.error("Please provide both name and slug");
      return;
    }
    try {
      const { id, ...data } = categoryData;
      const promise = updateCategory({ id, data }).unwrap();
      toast.promise(promise, {
        loading: `Updating category "${categoryData.name}"...`,
        success: (category) => {
          setEditingCategory(null);
          refetchCategories();
          return `Category "${category.name}" updated successfully`;
        },
        error: (error) => error.data?.message || "Failed to update category",
      });
    } catch (err) {
      toast.error("Failed to update category");
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    try {
      const promise = deleteCategory(id).unwrap();
      toast.promise(promise, {
        loading: `Deleting category "${name}"...`,
        success: () => {
          if (selectedCategoryId === id) setSelectedCategoryId(null);
          refetchCategories();
          return "Category deleted successfully";
        },
        error: (error) => error.data?.message || "Failed to delete category",
      });
    } catch (err) {
      toast.error("Failed to delete category");
    }
  };

  const parentCategories = categories.filter(c => !c.parentId);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-100 rounded-lg">
              <ListTree className="h-7 w-7 text-teal-700" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Category Management</h1>
              <p className="text-gray-600">Manage your product categories, attributes and specifications</p>
            </div>
          </div>
          <Button className="bg-teal-600 hover:bg-teal-700">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Panel - Category Tree */}
          <Card className="lg:col-span-1 bg-white border-gray-200 shadow-sm">
            <CardHeader className="bg-gray-50 border-b border-gray-200">
              <CardTitle className="text-gray-900 flex items-center gap-2">Category Structure</CardTitle>
              <CardDescription className="text-gray-500">View and manage your category hierarchy</CardDescription>
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
          </Card>

          {/* Right Panel - Forms */}
          <div className="lg:col-span-3 space-y-6">
            <CategoryForm
              editingCategory={editingCategory}
              selectedParentId={selectedCategory?.parentId || null}
              parentCategories={parentCategories}
              onUpdateCategory={handleUpdateCategory}
              onCreateCategory={handleCreateCategory}
              onCancelEdit={() => setEditingCategory(null)}
              onSelectParent={setSelectedCategoryId}
            />

            {selectedCategory && isLeaf && (
              <PropertiesManager
                selectedChildId={selectedCategory.id}
                selectedChildCategory={selectedCategory}
                activeTab={activeTab}
                onTabChange={setActiveTab}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCategoryManager;
