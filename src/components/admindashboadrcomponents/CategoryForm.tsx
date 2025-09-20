import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Image as ImageIcon } from "lucide-react";
import { Category } from "../../types/type";

interface CategoryFormProps {
  editingCategory: Category | null;
  parentCategories: Category[];
  onCreateCategory: (formData: FormData, parentId?: string) => void;
  onUpdateCategory: (id: string, formData: FormData) => void;
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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!slugEdited && !editingCategory) {
      setNewCategory(prev => ({
        ...prev,
        slug: prev.name.trim().toLowerCase().replace(/\s+/g, "-")
      }));
    }
  }, [newCategory.name, slugEdited, editingCategory]);

  useEffect(() => {
    if (editingCategory?.image) {
      setPreviewUrl(editingCategory.image);
    }
  }, [editingCategory]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = () => {
    const formData = new FormData();
    if (editingCategory) {
      formData.append("name", editingCategory.name);
      formData.append("slug", editingCategory.slug);
      if (imageFile) formData.append("image", imageFile);
      onUpdateCategory(editingCategory.id, formData);
    } else {
      formData.append("name", newCategory.name);
      formData.append("slug", newCategory.slug);
      if (imageFile) formData.append("image", imageFile);
      if (selectedParentId) formData.append("parentId", selectedParentId);
      onCreateCategory(formData, selectedParentId || undefined);

      setNewCategory({ name: "", slug: "" });
      setSlugEdited(false);
      setImageFile(null);
      setPreviewUrl(null);
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
            onChange={(e) =>
              editingCategory
                ? (editingCategory.name = e.target.value)
                : setNewCategory({ ...newCategory, name: e.target.value })
            }
          />

          <Label>Slug *</Label>
          <Input
            placeholder="Enter slug"
            value={editingCategory ? editingCategory.slug : newCategory.slug}
            onChange={(e) => {
              if (editingCategory) {
                editingCategory.slug = e.target.value;
              } else {
                setNewCategory({ ...newCategory, slug: e.target.value });
                setSlugEdited(true);
              }
            }}
          />

          <Label>Category Image</Label>
          <div className="flex items-center gap-4">
            <Input type="file" accept="image/*" onChange={handleImageChange} />
            {previewUrl ? (
              <img src={previewUrl} alt="Preview" className="w-16 h-16 rounded object-cover border" />
            ) : (
              <div className="w-16 h-16 flex items-center justify-center border rounded bg-gray-50 text-gray-400">
                <ImageIcon className="w-6 h-6" />
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-4">
            {editingCategory ? (
              <>
                <Button className="bg-teal-600 hover:bg-teal-700 flex-1" onClick={handleSubmit}>
                  Update
                </Button>
                <Button variant="outline" onClick={onCancelEdit}>
                  Cancel
                </Button>
              </>
            ) : (
              <Button
                className="bg-teal-600 hover:bg-teal-700 flex-1"
                onClick={handleSubmit}
                disabled={!newCategory.name || !newCategory.slug}
              >
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
