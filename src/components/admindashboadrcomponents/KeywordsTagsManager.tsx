// components/admindashboadrcomponents/KeywordsTagsManager.tsx (FIXED)
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tag, Key, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Category } from "@/types/type";
import { toast } from "sonner";
import { useUpdateCategoryMutation } from "@/features/apiSlice";
import KeywordsTags from "./KeywordsTags";

interface KeywordsTagsManagerProps {
  selectedChildId: string;
  selectedChildCategory: Category;
  onUpdate?: () => void;
}

const KeywordsTagsManager: React.FC<KeywordsTagsManagerProps> = ({
  selectedChildId,
  selectedChildCategory,
  onUpdate,
}) => {
  const [keywords, setKeywords] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [isLeafCategory, setIsLeafCategory] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [updateCategory] = useUpdateCategoryMutation();

  useEffect(() => {
    if (selectedChildCategory) {
      setKeywords(selectedChildCategory.keywords || []);
      setTags(selectedChildCategory.tags || []);
      // Check if it's a leaf category (no children)
      setIsLeafCategory(!selectedChildCategory.children || selectedChildCategory.children.length === 0);
    }
  }, [selectedChildCategory]);

  const handleKeywordsChange = async (newKeywords: string[]) => {
    setKeywords(newKeywords);
    await saveChanges(newKeywords, tags);
  };

  const handleTagsChange = async (newTags: string[]) => {
    setTags(newTags);
    await saveChanges(keywords, newTags);
  };

const saveChanges = async (currentKeywords: string[], currentTags: string[]) => {
  if (!selectedChildId) {
    toast.error("No category selected");
    return;
  }

  setIsSaving(true);
  try {
    console.log("Saving changes for category:", selectedChildId);
    console.log("Keywords to save:", currentKeywords);
    console.log("Tags to save:", currentTags);
    
    // Send as FormData
    const formData = new FormData();
    
    // Send keywords and tags as comma-separated strings
    formData.append("keywords", currentKeywords.join(","));
    formData.append("tags", currentTags.join(","));
    
    console.log("FormData contents:");
    for (const [key, value] of formData.entries()) {
      console.log(key, value);
    }
    
    // Call the mutation with formData
    const result = await updateCategory({
      id: selectedChildId,
      formData
    }).unwrap();
    
    console.log("Update successful:", result);
    
    toast.success("Keywords & Tags updated successfully");
    if (onUpdate) onUpdate();
    
  } catch (error: any) {
    console.error("Update error:", error);
    toast.error(error?.data?.message || "Failed to update keywords & tags");
    
    // Revert changes on error
    if (selectedChildCategory) {
      setKeywords(selectedChildCategory.keywords || []);
      setTags(selectedChildCategory.tags || []);
    }
  } finally {
    setIsSaving(false);
  }
};
  return (
    <Card className="bg-white border-gray-200 shadow-sm">
      <CardHeader className="bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <CardTitle className="text-gray-900 flex items-center gap-2">
            <Tag className="h-5 w-5 text-teal-500" />
            Manage Keywords & Tags for {selectedChildCategory?.name || "Category"}
            {isSaving && (
              <Loader2 className="h-4 w-4 animate-spin text-teal-600" />
            )}
          </CardTitle>
          <div className="flex items-center gap-2 bg-teal-100 text-teal-800 px-3 py-1.5 rounded-md">
            <Key className="h-4 w-4" />
            <span className="text-sm font-medium">SEO & Organization</span>
          </div>
        </div>
        <CardDescription className="text-gray-500">
          Add keywords to improve search visibility and tags for internal categorization.
          {!isLeafCategory && " Only available for leaf categories."}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <KeywordsTags
          keywords={keywords}
          tags={tags}
          isLeafCategory={isLeafCategory}
          onKeywordsChange={handleKeywordsChange}
          onTagsChange={handleTagsChange}
          isLoading={isSaving}
        />
      </CardContent>
    </Card>
  );
};

export default KeywordsTagsManager;