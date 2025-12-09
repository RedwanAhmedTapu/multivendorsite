// components/admindashboadrcomponents/KeywordsTags.tsx (UPDATED)
import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { TagIcon, Plus, X, Search, Hash, Key } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface KeywordsTagsProps {
  keywords: string[];
  tags: string[];
  isLeafCategory: boolean;
  onKeywordsChange?: (keywords: string[]) => void;
  onTagsChange?: (tags: string[]) => void;
  isLoading?: boolean;
}

const KeywordsTags: React.FC<KeywordsTagsProps> = ({
  keywords,
  tags,
  isLeafCategory,
  onKeywordsChange,
  onTagsChange,
  isLoading = false,
}) => {
  const [keywordInput, setKeywordInput] = useState("");
  const [tagInput, setTagInput] = useState("");

  const handleAddKeyword = () => {
    const trimmed = keywordInput.trim().toLowerCase();
    if (trimmed && !keywords.includes(trimmed)) {
      const newKeywords = [...keywords, trimmed];
      if (onKeywordsChange) {
        onKeywordsChange(newKeywords);
      }
      setKeywordInput("");
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    const newKeywords = keywords.filter((k) => k !== keyword);
    if (onKeywordsChange) {
      onKeywordsChange(newKeywords);
    }
  };

  const handleAddTag = () => {
    const trimmed = tagInput.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      const newTags = [...tags, trimmed];
      if (onTagsChange) {
        onTagsChange(newTags);
      }
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    const newTags = tags.filter((t) => t !== tag);
    if (onTagsChange) {
      onTagsChange(newTags);
    }
  };

  if (!isLeafCategory) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Keywords & Tags</CardTitle>
          <CardDescription>
            Available only for leaf categories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <TagIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Keywords & Tags Management Not Available
            </h3>
            <p className="text-gray-600 mb-4">
              This category has subcategories. Keywords & Tags can only be managed at leaf categories.
            </p>
            <div className="space-y-2 text-sm text-gray-500">
              <p>• Please select a leaf category (without subcategories) to manage keywords & tags</p>
              <p>• You can still manage attributes for this category</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Keywords Section */}
      <Card>
        <CardHeader>
          <CardTitle>Manage Keywords</CardTitle>
          <CardDescription>
            Add keywords to help customers find products in this category through search
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter a keyword (e.g., affordable, premium, wireless)"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") handleAddKeyword();
                }}
                disabled={isLoading}
              />
              <Button 
                onClick={handleAddKeyword} 
                disabled={!keywordInput.trim() || isLoading}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>

            {keywords.length > 0 ? (
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  Current Keywords ({keywords.length})
                </Label>
                <ScrollArea className="h-[300px] rounded-md border p-4">
                  <div className="flex flex-wrap gap-2">
                    {keywords.map((keyword, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="px-3 py-1 flex items-center gap-2"
                      >
                        <Key className="h-3 w-3" />
                        {keyword}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0 hover:bg-red-100 hover:text-red-700"
                          onClick={() => handleRemoveKeyword(keyword)}
                          disabled={isLoading}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            ) : (
              <div className="text-center py-8 border rounded-lg bg-gray-50">
                <Key className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No keywords added yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  Add keywords to improve search visibility
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tags Section */}
      <Card>
        <CardHeader>
          <CardTitle>Manage Tags</CardTitle>
          <CardDescription>
            Add tags to organize and filter products in this category
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter a tag (e.g., new-arrival, best-seller, eco-friendly)"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") handleAddTag();
                }}
                disabled={isLoading}
              />
              <Button 
                onClick={handleAddTag} 
                disabled={!tagInput.trim() || isLoading}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>

            {tags.length > 0 ? (
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  Current Tags ({tags.length})
                </Label>
                <ScrollArea className="h-[300px] rounded-md border p-4">
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag, index) => (
                      <Badge
                        key={index}
                        className="px-3 py-1 flex items-center gap-2 bg-teal-100 text-teal-800 border-teal-200"
                      >
                        <TagIcon className="h-3 w-3" />
                        {tag}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0 hover:bg-red-100 hover:text-red-700"
                          onClick={() => handleRemoveTag(tag)}
                          disabled={isLoading}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            ) : (
              <div className="text-center py-8 border rounded-lg bg-gray-50">
                <TagIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No tags added yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  Add tags to categorize products
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default KeywordsTags;