import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Edit } from "lucide-react";
import { Category } from "../../types/type";

interface CategoryFormProps {
  editingCategory: Category | null;
  parentCategories: Category[];
  onCreateCategory: (categoryData: { name: string; slug: string }, parentId?: string) => void;
  onUpdateCategory: (category: Category) => void;
  onCancelEdit: () => void;
  selectedParentId: string | null;
  onSelectParent: (id: string | null) => void;
}

const CategoryForm: React.FC<CategoryFormProps> = ({
  editingCategory,
  onCreateCategory,
  onUpdateCategory,
  onCancelEdit,
  selectedParentId,
}) => {
  const [newCategory, setNewCategory] = useState({ name: "", slug: "" });
  const [slugEdited, setSlugEdited] = useState(false);

  useEffect(() => {
    if (!slugEdited && !editingCategory) {
      setNewCategory(prev => ({
        ...prev,
        slug: prev.name.trim().toLowerCase().replace(/\s+/g, "-")
      }));
    }
  }, [newCategory.name, slugEdited, editingCategory]);

  const handleSubmit = () => {
    if (editingCategory) {
      onUpdateCategory(editingCategory);
    } else {
      onCreateCategory(newCategory, selectedParentId || undefined);
      setNewCategory({ name: "", slug: "" });
      setSlugEdited(false);
    }
  };

  return (
    <Card className="bg-white border-gray-200 shadow-sm">
      <CardHeader className="bg-gray-50 border-b border-gray-200">
        <CardTitle className="flex items-center gap-2 text-gray-900">
          {editingCategory ? <Edit className="h-5 w-5 text-teal-500" /> : <Plus className="h-5 w-5 text-teal-500" />}
          {editingCategory ? `Edit ${editingCategory.name}` : "Add New Category"}
        </CardTitle>
        <CardDescription className="text-gray-500">
          {editingCategory ? "Update category details" : "Create new categories in the hierarchy"}
        </CardDescription>
      </CardHeader>

      <CardContent className="p-4 space-y-4 md:flex md:gap-4 md:flex-row">
        <div className="flex-1 space-y-2">
          <Label>Category Name *</Label>
          <Input
            placeholder="Enter category name"
            value={editingCategory ? editingCategory.name : newCategory.name}
            onChange={(e) => editingCategory
              ? onUpdateCategory({ ...editingCategory, name: e.target.value })
              : setNewCategory({ ...newCategory, name: e.target.value })}
          />

          <Label>Slug *</Label>
          <Input
            placeholder="Enter slug"
            value={editingCategory ? editingCategory.slug : newCategory.slug}
            onChange={(e) => {
              if (editingCategory) {
                onUpdateCategory({ ...editingCategory, slug: e.target.value });
              } else {
                setNewCategory({ ...newCategory, slug: e.target.value });
                setSlugEdited(true);
              }
            }}
          />

          <div className="flex gap-2 mt-4">
            {editingCategory ? (
              <>
                <Button className="bg-teal-600 hover:bg-teal-700 flex-1" onClick={() => onUpdateCategory(editingCategory)}>Update</Button>
                <Button variant="outline" onClick={onCancelEdit}>Cancel</Button>
              </>
            ) : (
              <Button className="bg-teal-600 hover:bg-teal-700 flex-1" onClick={handleSubmit} disabled={!newCategory.name || !newCategory.slug}>
                Add Category
              </Button>
            )}
          </div>
        </div>

       
      </CardContent>
    </Card>
  );
};

export default CategoryForm;
