import React, { useState, useMemo, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Edit,
  Trash2,
  CheckSquare,
  Type,
  Hash,
  ToggleLeft,
  Loader2,
  X,
  Link,
  List,
  Search,
  Filter,
  Check,
  AlertCircle,
  Tag,
  Key,
  Hash as HashIcon,
  Globe,
  FolderTree,
  Copy,
  Save,
  Upload,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import {
  useGetCategoriesQuery,
  useCreateAttributeMutation,
  useUpdateAttributeMutation,
  useDeleteAttributeMutation,
  useAddAttributeValueMutation,
  useDeleteAttributeValueMutation,
  useUpdateCategoryMutation,
} from "@/features/apiSlice";
import { useGetAllGlobalAttributesQuery } from "@/features/attrSpecSlice";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

interface AttributesTabProps {
  selectedChildId: string;
}

interface AttributeValue {
  id: string;
  value: string;
  attributeId: string;
  createdAt: string;
  updatedAt: string;
}

interface CategoryAttributeFromAPI {
  id: string;
  categoryAttributeId: string;
  name: string;
  slug: string;
  type: "SELECT" | "MULTISELECT" | "TEXT" | "NUMBER" | "BOOLEAN";
  unit?: string | null;
  isRequired: boolean;
  filterable: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  values?: AttributeValue[];
}

interface GlobalAttribute {
  id: string;
  name: string;
  slug?: string;
  type: "SELECT" | "MULTISELECT" | "TEXT" | "NUMBER" | "BOOLEAN";
  unit?: string;
  values?: AttributeValue[];
  createdAt: string;
  updatedAt: string;
}

interface CategoryData {
  id: string;
  name: string;
  slug: string;
  parentId?: string;
  keywords: string[];
  tags: string[];
  children?: CategoryData[];
  attributes?: CategoryAttributeFromAPI[];
}

type AttributeType = "SELECT" | "MULTISELECT" | "TEXT" | "NUMBER" | "BOOLEAN";

const AttributesTab: React.FC<AttributesTabProps> = ({ selectedChildId }) => {
  const [activeTab, setActiveTab] = useState("attributes");
  const [newAttribute, setNewAttribute] = useState({
    name: "",
    type: "SELECT" as AttributeType,
    unit: "",
    filterable: true,
    isRequired: false,
    values: [] as string[],
  });

  const [selectedExistingAttribute, setSelectedExistingAttribute] =
    useState("");
  const [existingAttributeValues, setExistingAttributeValues] = useState<
    string[]
  >([]);
  const [newValue, setNewValue] = useState("");
  const [addingValueTo, setAddingValueTo] = useState<string>("");
  const [editingAttribute, setEditingAttribute] =
    useState<CategoryAttributeFromAPI | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [attributeToDelete, setAttributeToDelete] = useState<{
    id: string;
    name: string;
    categoryAttributeId: string;
  } | null>(null);

  // Keywords and Tags state with bulk addition
  const [newKeyword, setNewKeyword] = useState("");
  const [newTag, setNewTag] = useState("");
  const [bulkKeywords, setBulkKeywords] = useState("");
  const [bulkTags, setBulkTags] = useState("");
  const [showBulkKeywords, setShowBulkKeywords] = useState(false);
  const [showBulkTags, setShowBulkTags] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryData | null>(
    null
  );
  const [isLeafCategory, setIsLeafCategory] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const componentRef = useRef<HTMLDivElement>(null);
  const lastScrolledId = useRef<string | null>(null);

  const {
    data: categories = [],
    isLoading: categoriesLoading,
    refetch: refetchCategories,
  } = useGetCategoriesQuery();

  const {
    data: allAttributes = [],
    isLoading: attributesLoading,
    refetch: refetchAttributes,
  } = useGetAllGlobalAttributesQuery();

  const [createAttribute, { isLoading: isCreating }] =
    useCreateAttributeMutation();
  const [updateAttribute, { isLoading: isUpdating }] =
    useUpdateAttributeMutation();
  const [deleteAttribute, { isLoading: isDeleting }] =
    useDeleteAttributeMutation();
  const [addAttributeValue, { isLoading: isAddingValue }] =
    useAddAttributeValueMutation();
  const [deleteAttributeValue, { isLoading: isDeletingValue }] =
    useDeleteAttributeValueMutation();
  const [updateCategory, { isLoading: isUpdatingCategory }] =
    useUpdateCategoryMutation();
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);
  useEffect(() => {
    if (selectedChildId && categories.length > 0) {
      const findCategoryById = (cats: any[], id: string): any => {
        for (const cat of cats) {
          if (cat.id === id) return cat;
          if (cat.children?.length) {
            const found = findCategoryById(cat.children, id);
            if (found) return found;
          }
        }
        return null;
      };

      const foundCategory = findCategoryById(categories, selectedChildId);
      if (foundCategory) {
        const isLeaf =
          !foundCategory.children || foundCategory.children.length === 0;
        setSelectedCategory(foundCategory);
        setIsLeafCategory(isLeaf);
      }
    }
  }, [selectedChildId, categories]);

  useEffect(() => {
    console.log("Scroll effect - Conditions:", {
      isMounted,
      isLeafCategory,
      selectedChildId,
      hasRef: !!componentRef.current,
      lastScrolledId: lastScrolledId.current,
    });

    // Only scroll if:
    // 1. Component is mounted
    // 2. We have a leaf category
    // 3. We have a selectedChildId
    // 4. We haven't already scrolled to this ID
    if (
      isMounted &&
      isLeafCategory &&
      selectedChildId &&
      componentRef.current
    ) {
      // Prevent duplicate scrolling
      if (lastScrolledId.current === selectedChildId) {
        console.log("Already scrolled to this category, skipping");
        return;
      }

      console.log("Attempting to scroll to component");
      lastScrolledId.current = selectedChildId;

      // Use setTimeout to ensure DOM is fully updated
      const scrollTimer = setTimeout(() => {
        if (componentRef.current) {
          console.log("Scrolling now...");
          componentRef.current.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      }, 300); // Increased delay to ensure ref is attached

      return () => clearTimeout(scrollTimer);
    }
  }, [isMounted, isLeafCategory, selectedChildId]);

  const currentAttributes = useMemo(() => {
    if (!selectedCategory || !selectedCategory.attributes) return [];
    return selectedCategory.attributes as CategoryAttributeFromAPI[];
  }, [selectedCategory]);

  const filteredAttributes = useMemo(() => {
    if (!searchQuery) return currentAttributes;
    return currentAttributes.filter(
      (attr) =>
        attr.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        attr.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (attr.unit &&
          attr.unit.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [currentAttributes, searchQuery]);

  const availableAttributes = useMemo(() => {
    const currentAttributeIds = currentAttributes.map((attr) => attr.id);
    const globalAttrs = allAttributes as unknown as GlobalAttribute[];

    return globalAttrs.filter((attr) => !currentAttributeIds.includes(attr.id));
  }, [allAttributes, currentAttributes]);

  // Add single keyword
  const handleAddKeyword = async () => {
    if (!selectedCategory || !newKeyword.trim()) {
      toast.error("Please enter a keyword");
      return;
    }

    const keyword = newKeyword.trim().toLowerCase();
    if (selectedCategory.keywords.includes(keyword)) {
      toast.error("Keyword already exists");
      return;
    }

    try {
      const formData = new FormData();
      const updatedKeywords = [...selectedCategory.keywords, keyword];
      formData.append("keywords", updatedKeywords.join(","));

      await updateCategory({
        id: selectedCategory.id,
        formData,
      }).unwrap();

      toast.success(`Keyword "${keyword}" added successfully`);
      setNewKeyword("");
      refetchCategories();
    } catch (error: any) {
      console.error("Add keyword error:", error);
      toast.error(error?.data?.message || "Failed to add keyword");
    }
  };

  // Add multiple keywords at once
  const handleAddBulkKeywords = async () => {
    if (!selectedCategory || !bulkKeywords.trim()) {
      toast.error("Please enter keywords");
      return;
    }

    try {
      // Parse bulk keywords (comma, newline, or space separated)
      const newKeywords = bulkKeywords
        .split(/[\n,]+/)
        .map((k) => k.trim().toLowerCase())
        .filter((k) => k.length > 0)
        .filter((k, index, self) => self.indexOf(k) === index); // Remove duplicates

      if (newKeywords.length === 0) {
        toast.error("No valid keywords found");
        return;
      }

      // Filter out existing keywords
      const existingKeywords = selectedCategory.keywords || [];
      const uniqueNewKeywords = newKeywords.filter(
        (k) => !existingKeywords.includes(k)
      );

      if (uniqueNewKeywords.length === 0) {
        toast.error("All keywords already exist");
        setBulkKeywords("");
        return;
      }

      const formData = new FormData();
      const updatedKeywords = [...existingKeywords, ...uniqueNewKeywords];
      formData.append("keywords", updatedKeywords.join(","));

      await updateCategory({
        id: selectedCategory.id,
        formData,
      }).unwrap();

      toast.success(`${uniqueNewKeywords.length} keywords added successfully`);
      setBulkKeywords("");
      setShowBulkKeywords(false);
      refetchCategories();
    } catch (error: any) {
      console.error("Add bulk keywords error:", error);
      toast.error(error?.data?.message || "Failed to add keywords");
    }
  };

  // Remove keyword
  const handleRemoveKeyword = async (keyword: string) => {
    if (!selectedCategory) return;

    try {
      const formData = new FormData();
      const updatedKeywords = selectedCategory.keywords.filter(
        (k) => k !== keyword
      );
      formData.append("keywords", updatedKeywords.join(","));

      await updateCategory({
        id: selectedCategory.id,
        formData,
      }).unwrap();

      toast.success(`Keyword "${keyword}" removed`);
      refetchCategories();
    } catch (error: any) {
      console.error("Remove keyword error:", error);
      toast.error(error?.data?.message || "Failed to remove keyword");
    }
  };

  // Clear all keywords
  const handleClearAllKeywords = async () => {
    if (!selectedCategory || selectedCategory.keywords.length === 0) return;

    if (
      !window.confirm(
        `Are you sure you want to remove all ${selectedCategory.keywords.length} keywords?`
      )
    ) {
      return;
    }

    try {
      const formData = new FormData();
      formData.append("keywords", ""); // Empty string for no keywords

      await updateCategory({
        id: selectedCategory.id,
        formData,
      }).unwrap();

      toast.success("All keywords removed");
      refetchCategories();
    } catch (error: any) {
      console.error("Clear keywords error:", error);
      toast.error(error?.data?.message || "Failed to clear keywords");
    }
  };

  // Copy keywords to clipboard
  const handleCopyKeywords = () => {
    if (!selectedCategory || selectedCategory.keywords.length === 0) {
      toast.error("No keywords to copy");
      return;
    }

    const keywordsText = selectedCategory.keywords.join(", ");
    navigator.clipboard.writeText(keywordsText);
    toast.success("Keywords copied to clipboard");
  };

  // Add single tag
  const handleAddTag = async () => {
    if (!selectedCategory || !newTag.trim()) {
      toast.error("Please enter a tag");
      return;
    }

    const tag = newTag.trim().toLowerCase();
    if (selectedCategory.tags.includes(tag)) {
      toast.error("Tag already exists");
      return;
    }

    try {
      const formData = new FormData();
      const updatedTags = [...selectedCategory.tags, tag];
      formData.append("tags", updatedTags.join(","));

      await updateCategory({
        id: selectedCategory.id,
        formData,
      }).unwrap();

      toast.success(`Tag "${tag}" added successfully`);
      setNewTag("");
      refetchCategories();
    } catch (error: any) {
      console.error("Add tag error:", error);
      toast.error(error?.data?.message || "Failed to add tag");
    }
  };

  // Add multiple tags at once
  const handleAddBulkTags = async () => {
    if (!selectedCategory || !bulkTags.trim()) {
      toast.error("Please enter tags");
      return;
    }

    try {
      // Parse bulk tags (comma, newline, or space separated)
      const newTags = bulkTags
        .split(/[\n,]+/)
        .map((t) => t.trim().toLowerCase())
        .filter((t) => t.length > 0)
        .filter((t, index, self) => self.indexOf(t) === index); // Remove duplicates

      if (newTags.length === 0) {
        toast.error("No valid tags found");
        return;
      }

      // Filter out existing tags
      const existingTags = selectedCategory.tags || [];
      const uniqueNewTags = newTags.filter((t) => !existingTags.includes(t));

      if (uniqueNewTags.length === 0) {
        toast.error("All tags already exist");
        setBulkTags("");
        return;
      }

      const formData = new FormData();
      const updatedTags = [...existingTags, ...uniqueNewTags];
      formData.append("tags", updatedTags.join(","));

      await updateCategory({
        id: selectedCategory.id,
        formData,
      }).unwrap();

      toast.success(`${uniqueNewTags.length} tags added successfully`);
      setBulkTags("");
      setShowBulkTags(false);
      refetchCategories();
    } catch (error: any) {
      console.error("Add bulk tags error:", error);
      toast.error(error?.data?.message || "Failed to add tags");
    }
  };

  // Remove tag
  const handleRemoveTag = async (tag: string) => {
    if (!selectedCategory) return;

    try {
      const formData = new FormData();
      const updatedTags = selectedCategory.tags.filter((t) => t !== tag);
      formData.append("tags", updatedTags.join(","));

      await updateCategory({
        id: selectedCategory.id,
        formData,
      }).unwrap();

      toast.success(`Tag "${tag}" removed`);
      refetchCategories();
    } catch (error: any) {
      console.error("Remove tag error:", error);
      toast.error(error?.data?.message || "Failed to remove tag");
    }
  };

  // Clear all tags
  const handleClearAllTags = async () => {
    if (!selectedCategory || selectedCategory.tags.length === 0) return;

    if (
      !window.confirm(
        `Are you sure you want to remove all ${selectedCategory.tags.length} tags?`
      )
    ) {
      return;
    }

    try {
      const formData = new FormData();
      formData.append("tags", ""); // Empty string for no tags

      await updateCategory({
        id: selectedCategory.id,
        formData,
      }).unwrap();

      toast.success("All tags removed");
      refetchCategories();
    } catch (error: any) {
      console.error("Clear tags error:", error);
      toast.error(error?.data?.message || "Failed to clear tags");
    }
  };

  // Copy tags to clipboard
  const handleCopyTags = () => {
    if (!selectedCategory || selectedCategory.tags.length === 0) {
      toast.error("No tags to copy");
      return;
    }

    const tagsText = selectedCategory.tags.join(", ");
    navigator.clipboard.writeText(tagsText);
    toast.success("Tags copied to clipboard");
  };

  // Import from clipboard for bulk
  const handleImportFromClipboard = (type: "keywords" | "tags") => {
    navigator.clipboard
      .readText()
      .then((text) => {
        if (type === "keywords") {
          setBulkKeywords(text);
          toast.success("Text imported from clipboard");
        } else {
          setBulkTags(text);
          toast.success("Text imported from clipboard");
        }
      })
      .catch((err) => {
        toast.error("Failed to read clipboard");
      });
  };

  // Export keywords/tags
  const handleExport = (type: "keywords" | "tags") => {
    if (!selectedCategory) return;

    const data =
      type === "keywords" ? selectedCategory.keywords : selectedCategory.tags;
    if (data.length === 0) {
      toast.error(`No ${type} to export`);
      return;
    }

    const text = data.join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedCategory.name}_${type}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success(
      `${type.charAt(0).toUpperCase() + type.slice(1)} exported successfully`
    );
  };

  // Rest of the functions remain the same...
  const handleExistingAttributeSelect = (attributeId: string) => {
    setSelectedExistingAttribute(attributeId);
    const selectedAttr = (allAttributes as unknown as GlobalAttribute[]).find(
      (attr) => attr.id === attributeId
    );
    if (selectedAttr) {
      setExistingAttributeValues([]);
      setNewAttribute({
        name: selectedAttr.name,
        type: selectedAttr.type,
        unit: selectedAttr.unit || "",
        filterable: true,
        isRequired: false,
        values: [],
      });
    }
  };

  const handleAddValueToNewAttribute = () => {
    if (!newValue.trim()) {
      toast.error("Please enter a value");
      return;
    }

    const targetValues = isCreatingNew
      ? newAttribute.values
      : existingAttributeValues;

    if (targetValues.includes(newValue.trim())) {
      toast.error("This value already exists");
      return;
    }

    if (isCreatingNew) {
      setNewAttribute((prev) => ({
        ...prev,
        values: [...prev.values, newValue.trim()],
      }));
    } else {
      setExistingAttributeValues((prev) => [...prev, newValue.trim()]);
    }
    setNewValue("");
  };

  const handleRemoveValueFromAttribute = (index: number) => {
    if (isCreatingNew) {
      setNewAttribute((prev) => ({
        ...prev,
        values: prev.values.filter((_, i) => i !== index),
      }));
    } else {
      setExistingAttributeValues((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleCreateOrLinkAttribute = async () => {
    if (!selectedChildId) {
      toast.error("Please select a category");
      return;
    }

    if (isCreatingNew) {
      if (!newAttribute.name.trim()) {
        toast.error("Please provide attribute name");
        return;
      }

      if (
        (newAttribute.type === "SELECT" ||
          newAttribute.type === "MULTISELECT") &&
        newAttribute.values.length === 0
      ) {
        toast.error(
          `Please add at least one value for ${newAttribute.type} type attribute`
        );
        return;
      }

      try {
        const attributeData = {
          name: newAttribute.name.trim(),
          type: newAttribute.type,
          unit: newAttribute.unit.trim() || undefined,
          filterable: newAttribute.filterable,
          isRequired: newAttribute.isRequired,
          categoryId: selectedChildId,
          ...((newAttribute.type === "SELECT" ||
            newAttribute.type === "MULTISELECT") && {
            values: newAttribute.values,
          }),
        };

        await createAttribute(attributeData).unwrap();

        toast.success(
          `Attribute "${newAttribute.name}" created successfully${
            newAttribute.values.length > 0
              ? ` with ${newAttribute.values.length} values`
              : ""
          }`
        );

        setNewAttribute({
          name: "",
          type: "SELECT",
          unit: "",
          filterable: true,
          isRequired: false,
          values: [],
        });

        refetchCategories();
      } catch (error: any) {
        toast.error(error?.data?.message || "Failed to create attribute");
      }
    } else {
      if (!selectedExistingAttribute) {
        toast.error("Please select an existing attribute");
        return;
      }

      const selectedAttr = (allAttributes as GlobalAttribute[]).find(
        (attr) => attr.id === selectedExistingAttribute
      );
      if (!selectedAttr) {
        toast.error("Selected attribute not found");
        return;
      }

      try {
        const attributeData = {
          name: selectedAttr.name,
          type: selectedAttr.type,
          unit: selectedAttr.unit,
          filterable: newAttribute.filterable,
          isRequired: newAttribute.isRequired,
          categoryId: selectedChildId,
          attributeId: selectedAttr.id,
          ...((selectedAttr.type === "SELECT" ||
            selectedAttr.type === "MULTISELECT") &&
            existingAttributeValues.length > 0 && {
              values: existingAttributeValues,
            }),
        };

        await createAttribute(attributeData).unwrap();

        let successMessage = `Attribute "${selectedAttr.name}" linked to category successfully`;
        if (existingAttributeValues.length > 0) {
          successMessage += ` with ${existingAttributeValues.length} additional values`;
        }

        toast.success(successMessage);

        setSelectedExistingAttribute("");
        setExistingAttributeValues([]);
        setNewAttribute({
          name: "",
          type: "SELECT",
          unit: "",
          filterable: true,
          isRequired: false,
          values: [],
        });

        refetchCategories();
      } catch (error: any) {
        toast.error(error?.data?.message || "Failed to link attribute");
      }
    }
  };

  const handleUpdateAttribute = async () => {
    if (!editingAttribute || !editingAttribute.name) {
      toast.error("Please provide attribute name");
      return;
    }

    try {
      const updateData = {
        name: editingAttribute.name,
        type: editingAttribute.type,
        unit: editingAttribute.unit || undefined,
        filterable: editingAttribute.filterable,
        isRequired: editingAttribute.isRequired,
      };

      await updateAttribute({
        id: editingAttribute.categoryAttributeId,
        data: updateData,
      }).unwrap();

      toast.success(
        `Attribute "${editingAttribute.name}" updated successfully`
      );
      setEditingAttribute(null);
      refetchCategories();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to update attribute");
    }
  };

  const confirmDeleteAttribute = (catAttr: CategoryAttributeFromAPI) => {
    setAttributeToDelete({
      id: catAttr.categoryAttributeId,
      name: catAttr.name,
      categoryAttributeId: catAttr.categoryAttributeId,
    });
    setShowDeleteDialog(true);
  };

  const handleDeleteAttribute = async () => {
    if (!attributeToDelete) return;

    try {
      await deleteAttribute(attributeToDelete.categoryAttributeId).unwrap();
      toast.success(
        `Attribute "${attributeToDelete.name}" deleted successfully`
      );
      setEditingAttribute(null);
      setShowDeleteDialog(false);
      setAttributeToDelete(null);
      refetchCategories();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to delete attribute");
      console.error("Delete error:", error);
    }
  };

  const handleAddAttributeValue = async (
    attributeId: string,
    attributeName: string
  ) => {
    const valueToAdd = addingValueTo === attributeId ? newValue : "";

    if (!valueToAdd.trim()) {
      toast.error("Please provide a value");
      return;
    }

    try {
      const result = await addAttributeValue({
        attributeId,
        value: valueToAdd.trim(),
      }).unwrap();

      toast.success(`Value "${result.value}" added successfully`);
      setNewValue("");
      setAddingValueTo("");
      refetchCategories();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to add value");
    }
  };

  const handleDeleteAttributeValue = async (
    valueId: string,
    value: string,
    attributeName: string
  ) => {
    if (
      !window.confirm(
        `Are you sure you want to delete value "${value}" from ${attributeName}?`
      )
    ) {
      return;
    }

    try {
      await deleteAttributeValue(valueId).unwrap();
      toast.success(`Value "${value}" deleted from ${attributeName}`);
      refetchCategories();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to delete value");
    }
  };

  const handleToggleMode = (mode: boolean) => {
    setIsCreatingNew(mode);
    setSelectedExistingAttribute("");
    setExistingAttributeValues([]);
    setNewAttribute({
      name: "",
      type: "SELECT",
      unit: "",
      filterable: true,
      isRequired: false,
      values: [],
    });
    setNewValue("");
  };

  const getAttributeIcon = (type: AttributeType) => {
    switch (type) {
      case "SELECT":
        return <CheckSquare className="h-3 w-3" />;
      case "MULTISELECT":
        return <List className="h-3 w-3" />;
      case "TEXT":
        return <Type className="h-3 w-3" />;
      case "NUMBER":
        return <Hash className="h-3 w-3" />;
      case "BOOLEAN":
        return <ToggleLeft className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const getAttributeTypeColor = (type: AttributeType) => {
    switch (type) {
      case "SELECT":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "MULTISELECT":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "TEXT":
        return "bg-green-100 text-green-800 border-green-200";
      case "NUMBER":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "BOOLEAN":
        return "bg-pink-100 text-pink-800 border-pink-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (categoriesLoading || attributesLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-teal-500" />
        <p className="text-gray-500">Loading attributes...</p>
      </div>
    );
  }

  if (!selectedChildId) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Filter className="h-16 w-16 text-gray-300" />
        <p className="text-gray-500 text-lg">
          Please select a category to manage attributes
        </p>
        <p className="text-gray-400 text-sm">
          Select a category from the sidebar to view and manage its attributes
        </p>
      </div>
    );
  }

  return (
    <div ref={componentRef} className="space-y-4 pb-4">
      {/* Tabs Navigation - Mobile optimized */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-12">
          <TabsTrigger
            value="keywords"
            className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
          >
            <Key className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="truncate">Keywords</span>
          </TabsTrigger>
          <TabsTrigger
            value="tags"
            className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
          >
            <Tag className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="truncate">Tags</span>
          </TabsTrigger>
          <TabsTrigger
            value="attributes"
            className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
            disabled={!isLeafCategory}
          >
            <CheckSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="truncate">Attributes</span>
          </TabsTrigger>
        </TabsList>

        {/* Keywords Tab */}
        <TabsContent value="keywords" className="space-y-4">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col gap-3">
                <div>
                  <CardTitle className="text-lg">Keywords</CardTitle>
                  <CardDescription className="text-sm">
                    Add keywords to help customers find products
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyKeywords}
                    disabled={!selectedCategory?.keywords?.length}
                    className="flex-1 min-w-[120px]"
                  >
                    <Copy className="h-3.5 w-3.5 mr-1.5" />
                    Copy
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport("keywords")}
                    disabled={!selectedCategory?.keywords?.length}
                    className="flex-1 min-w-[120px]"
                  >
                    <Download className="h-3.5 w-3.5 mr-1.5" />
                    Export
                  </Button>
                  {(selectedCategory?.keywords?.length ?? 0) > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleClearAllKeywords}
                      className="flex-1 min-w-[120px] border-red-200 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                      Clear All
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Section */}
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add keyword..."
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") handleAddKeyword();
                    }}
                    disabled={isUpdatingCategory}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleAddKeyword}
                    disabled={!newKeyword.trim() || isUpdatingCategory}
                    size="icon"
                    className="shrink-0"
                  >
                    {isUpdatingCategory ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {/* Bulk Add */}
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowBulkKeywords(!showBulkKeywords)}
                    className="w-full"
                  >
                    {showBulkKeywords ? "Hide Bulk Add" : "Bulk Add Keywords"}
                  </Button>

                  {showBulkKeywords && (
                    <div className="space-y-3 p-3 border rounded-lg bg-gray-50">
                      <Textarea
                        placeholder="Enter keywords separated by commas or new lines"
                        value={bulkKeywords}
                        onChange={(e) => setBulkKeywords(e.target.value)}
                        rows={3}
                        className="resize-none"
                      />
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleImportFromClipboard("keywords")}
                          className="flex-1"
                        >
                          <Copy className="h-3.5 w-3.5 mr-1.5" />
                          Import
                        </Button>
                        <Button
                          onClick={handleAddBulkKeywords}
                          disabled={!bulkKeywords.trim() || isUpdatingCategory}
                          className="flex-1 bg-teal-600 hover:bg-teal-700"
                        >
                          {isUpdatingCategory ? (
                            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                          ) : (
                            <Upload className="h-3.5 w-3.5 mr-1.5" />
                          )}
                          Add All
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Keywords List */}
              {selectedCategory?.keywords &&
              selectedCategory.keywords.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {selectedCategory.keywords.length} keywords
                    </span>
                    <span className="text-xs text-gray-500">
                      Click to remove
                    </span>
                  </div>
                  <div className="h-64 overflow-y-auto rounded-lg border p-3">
                    <div className="flex flex-wrap gap-2">
                      {selectedCategory.keywords.map((keyword, index) => (
                        <div
                          key={index}
                          className="inline-flex items-center gap-1.5 bg-gray-100 hover:bg-red-100 hover:text-red-700 px-3 py-1.5 rounded-full text-sm transition-colors cursor-pointer"
                          onClick={() => handleRemoveKeyword(keyword)}
                        >
                          <HashIcon className="h-3 w-3" />
                          {keyword}
                          <X className="h-3 w-3" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 border rounded-lg bg-gray-50">
                  <Key className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600 mb-2">No keywords yet</p>
                  <p className="text-sm text-gray-500">
                    Add keywords to improve search visibility
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tags Tab */}
        <TabsContent value="tags" className="space-y-4">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col gap-3">
                <div>
                  <CardTitle className="text-lg">Tags</CardTitle>
                  <CardDescription className="text-sm">
                    Add tags to organize and filter products
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyTags}
                    disabled={!selectedCategory?.tags?.length}
                    className="flex-1 min-w-[120px]"
                  >
                    <Copy className="h-3.5 w-3.5 mr-1.5" />
                    Copy
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport("tags")}
                    disabled={!selectedCategory?.tags?.length}
                    className="flex-1 min-w-[120px]"
                  >
                    <Download className="h-3.5 w-3.5 mr-1.5" />
                    Export
                  </Button>
                  {(selectedCategory?.tags?.length ?? 0) > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleClearAllTags}
                      className="flex-1 min-w-[120px] border-red-200 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                      Clear All
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Section */}
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add tag..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") handleAddTag();
                    }}
                    disabled={isUpdatingCategory}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleAddTag}
                    disabled={!newTag.trim() || isUpdatingCategory}
                    size="icon"
                    className="shrink-0"
                  >
                    {isUpdatingCategory ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {/* Bulk Add */}
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowBulkTags(!showBulkTags)}
                    className="w-full"
                  >
                    {showBulkTags ? "Hide Bulk Add" : "Bulk Add Tags"}
                  </Button>

                  {showBulkTags && (
                    <div className="space-y-3 p-3 border rounded-lg bg-gray-50">
                      <Textarea
                        placeholder="Enter tags separated by commas or new lines"
                        value={bulkTags}
                        onChange={(e) => setBulkTags(e.target.value)}
                        rows={3}
                        className="resize-none"
                      />
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleImportFromClipboard("tags")}
                          className="flex-1"
                        >
                          <Copy className="h-3.5 w-3.5 mr-1.5" />
                          Import
                        </Button>
                        <Button
                          onClick={handleAddBulkTags}
                          disabled={!bulkTags.trim() || isUpdatingCategory}
                          className="flex-1 bg-teal-600 hover:bg-teal-700"
                        >
                          {isUpdatingCategory ? (
                            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                          ) : (
                            <Upload className="h-3.5 w-3.5 mr-1.5" />
                          )}
                          Add All
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Tags List */}
              {(selectedCategory?.tags?.length ?? 0) > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {selectedCategory?.tags?.length || 0} tags
                    </span>
                    <span className="text-xs text-gray-500">
                      Click to remove
                    </span>
                  </div>
                  <div className="h-64 overflow-y-auto rounded-lg border p-3">
                    <div className="flex flex-wrap gap-2">
                      {selectedCategory?.tags?.map((tag, index) => (
                        <div
                          key={index}
                          className="inline-flex items-center gap-1.5 bg-teal-100 text-teal-800 hover:bg-red-100 hover:text-red-700 px-3 py-1.5 rounded-full text-sm transition-colors cursor-pointer"
                          onClick={() => handleRemoveTag(tag)}
                        >
                          <Tag className="h-3 w-3" />
                          {tag}
                          <X className="h-3 w-3" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 border rounded-lg bg-gray-50">
                  <Tag className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600 mb-2">No tags yet</p>
                  <p className="text-sm text-gray-500">
                    Add tags to organize and filter products
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attributes Tab */}
        <TabsContent value="attributes" className="space-y-4">
          {!isLeafCategory ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <FolderTree className="h-12 w-12 text-amber-300 mx-auto mb-3" />
                  <h3 className="text-base font-semibold text-gray-900 mb-1">
                    Parent Category
                  </h3>
                  <p className="text-gray-600 mb-3 text-sm">
                    Attributes can only be managed at leaf categories.
                  </p>
                  <div className="space-y-1 text-xs text-gray-500">
                    <p>• Select a leaf category to manage attributes</p>
                    <p>
                      • Keywords and tags are still available for this category
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Mobile Layout: Stacked */}
              <div className="lg:hidden space-y-4">
                {/* Existing Attributes Card */}
                <Card>
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">Attributes</CardTitle>
                        <CardDescription className="text-sm">
                          {currentAttributes.length} assigned
                        </CardDescription>
                      </div>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9 w-40"
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {filteredAttributes.length === 0 ? (
                      <div className="text-center py-8">
                        <Filter className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-600">
                          {searchQuery
                            ? "No matches found"
                            : "No attributes yet"}
                        </p>
                        {searchQuery && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-3"
                            onClick={() => setSearchQuery("")}
                          >
                            Clear Search
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {filteredAttributes.map((catAttr) => (
                          <div
                            key={catAttr.categoryAttributeId}
                            className="border rounded-lg p-3 bg-white"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="font-semibold truncate">
                                    {catAttr.name}
                                  </h3>
                                  {catAttr.unit && (
                                    <span className="text-xs text-gray-500">
                                      ({catAttr.unit})
                                    </span>
                                  )}
                                </div>
                                <div className="flex flex-wrap gap-1.5 mb-2">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-gray-100">
                                    {getAttributeIcon(catAttr.type)}
                                    {catAttr.type.toLowerCase()}
                                  </span>
                                  {catAttr.isRequired && (
                                    <span className="px-2 py-0.5 rounded text-xs bg-red-50 text-red-700">
                                      Required
                                    </span>
                                  )}
                                  {catAttr.filterable && (
                                    <span className="px-2 py-0.5 rounded text-xs bg-teal-50 text-teal-700">
                                      Filterable
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-1 ml-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => setEditingAttribute(catAttr)}
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-red-500"
                                  onClick={() =>
                                    confirmDeleteAttribute(catAttr)
                                  }
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>

                            {/* Values */}
                            {(catAttr.type === "SELECT" ||
                              catAttr.type === "MULTISELECT") &&
                              catAttr.values &&
                              catAttr.values.length > 0 && (
                                <div className="mt-3 pt-3 border-t">
                                  <div className="flex flex-wrap gap-1.5 mb-2">
                                    {catAttr.values.map((value) => (
                                      <span
                                        key={value.id}
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-gray-50 border"
                                      >
                                        {value.value}
                                        <X
                                          className="h-3 w-3 cursor-pointer"
                                          onClick={() =>
                                            handleDeleteAttributeValue(
                                              value.id,
                                              value.value,
                                              catAttr.name
                                            )
                                          }
                                        />
                                      </span>
                                    ))}
                                  </div>
                                  <div className="flex gap-2">
                                    <Input
                                      placeholder="Add value"
                                      value={
                                        addingValueTo === catAttr.id
                                          ? newValue
                                          : ""
                                      }
                                      onChange={(e) => {
                                        setNewValue(e.target.value);
                                        setAddingValueTo(catAttr.id);
                                      }}
                                      className="flex-1 text-sm"
                                      onKeyPress={(e) => {
                                        if (e.key === "Enter") {
                                          handleAddAttributeValue(
                                            catAttr.id,
                                            catAttr.name
                                          );
                                        }
                                      }}
                                    />
                                    <Button
                                      size="sm"
                                      className="bg-teal-600 hover:bg-teal-700"
                                      onClick={() =>
                                        handleAddAttributeValue(
                                          catAttr.id,
                                          catAttr.name
                                        )
                                      }
                                      disabled={
                                        addingValueTo !== catAttr.id ||
                                        !newValue.trim()
                                      }
                                    >
                                      <Plus className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Add Attribute Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Add Attribute</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Mode Toggle */}
                      <div className="flex bg-gray-100 rounded-lg p-1">
                        <Button
                          variant={isCreatingNew ? "default" : "ghost"}
                          size="sm"
                          className={`flex-1 ${
                            isCreatingNew
                              ? "bg-teal-600 text-white"
                              : "text-gray-600"
                          }`}
                          onClick={() => handleToggleMode(true)}
                        >
                          Create New
                        </Button>
                        <Button
                          variant={!isCreatingNew ? "default" : "ghost"}
                          size="sm"
                          className={`flex-1 ${
                            !isCreatingNew
                              ? "bg-teal-600 text-white"
                              : "text-gray-600"
                          }`}
                          onClick={() => handleToggleMode(false)}
                          disabled={availableAttributes.length === 0}
                        >
                          Use Existing
                        </Button>
                      </div>

                      {/* Form */}
                      <div className="space-y-4">
                        {isCreatingNew ? (
                          <>
                            <div className="space-y-2">
                              <Label className="text-sm">Name *</Label>
                              <Input
                                placeholder="e.g., Color, Size"
                                value={newAttribute.name}
                                onChange={(e) =>
                                  setNewAttribute({
                                    ...newAttribute,
                                    name: e.target.value,
                                  })
                                }
                              />
                            </div>

                            <div className="space-y-2">
                              <Label className="text-sm">Type *</Label>
                              <Select
                                value={newAttribute.type}
                                onValueChange={(value: AttributeType) =>
                                  setNewAttribute({
                                    ...newAttribute,
                                    type: value,
                                    values: [],
                                  })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="SELECT">Select</SelectItem>
                                  <SelectItem value="MULTISELECT">
                                    Multi-Select
                                  </SelectItem>
                                  <SelectItem value="TEXT">Text</SelectItem>
                                  <SelectItem value="NUMBER">Number</SelectItem>
                                  <SelectItem value="BOOLEAN">
                                    Boolean
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {newAttribute.type === "NUMBER" && (
                              <div className="space-y-2">
                                <Label className="text-sm">
                                  Unit (Optional)
                                </Label>
                                <Input
                                  placeholder="e.g., kg, cm"
                                  value={newAttribute.unit}
                                  onChange={(e) =>
                                    setNewAttribute({
                                      ...newAttribute,
                                      unit: e.target.value,
                                    })
                                  }
                                />
                              </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  id="attr-filterable"
                                  checked={newAttribute.filterable}
                                  onChange={(e) =>
                                    setNewAttribute({
                                      ...newAttribute,
                                      filterable: e.target.checked,
                                    })
                                  }
                                  className="rounded"
                                />
                                <Label
                                  htmlFor="attr-filterable"
                                  className="text-sm"
                                >
                                  Filterable
                                </Label>
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  id="attr-isRequired"
                                  checked={newAttribute.isRequired}
                                  onChange={(e) =>
                                    setNewAttribute({
                                      ...newAttribute,
                                      isRequired: e.target.checked,
                                    })
                                  }
                                  className="rounded"
                                />
                                <Label
                                  htmlFor="attr-isRequired"
                                  className="text-sm"
                                >
                                  Required
                                </Label>
                              </div>
                            </div>

                            {(newAttribute.type === "SELECT" ||
                              newAttribute.type === "MULTISELECT") && (
                              <div className="space-y-3">
                                <Label className="text-sm">Values *</Label>
                                <div className="flex gap-2">
                                  <Input
                                    placeholder="Add value"
                                    value={newValue}
                                    onChange={(e) =>
                                      setNewValue(e.target.value)
                                    }
                                    onKeyPress={(e) => {
                                      if (e.key === "Enter") {
                                        handleAddValueToNewAttribute();
                                      }
                                    }}
                                  />
                                  <Button
                                    onClick={handleAddValueToNewAttribute}
                                    className="bg-teal-600 hover:bg-teal-700"
                                    disabled={!newValue.trim()}
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </div>

                                {newAttribute.values.length > 0 && (
                                  <div className="flex flex-wrap gap-2">
                                    {newAttribute.values.map((value, index) => (
                                      <span
                                        key={index}
                                        className="inline-flex items-center gap-1 px-2 py-1 rounded text-sm bg-gray-100"
                                      >
                                        {value}
                                        <X
                                          className="h-3 w-3 cursor-pointer"
                                          onClick={() =>
                                            handleRemoveValueFromAttribute(
                                              index
                                            )
                                          }
                                        />
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            <div className="space-y-2">
                              <Label className="text-sm">
                                Select Attribute *
                              </Label>
                              <Select
                                value={selectedExistingAttribute}
                                onValueChange={handleExistingAttributeSelect}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Choose attribute" />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableAttributes.map((attr) => (
                                    <SelectItem key={attr.id} value={attr.id}>
                                      <div className="flex items-center justify-between">
                                        <span>{attr.name}</span>
                                        <span className="text-xs text-gray-500">
                                          {attr.type.toLowerCase()}
                                        </span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            {selectedExistingAttribute && (
                              <>
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      id="existing-filterable"
                                      checked={newAttribute.filterable}
                                      onChange={(e) =>
                                        setNewAttribute({
                                          ...newAttribute,
                                          filterable: e.target.checked,
                                        })
                                      }
                                      className="rounded"
                                    />
                                    <Label
                                      htmlFor="existing-filterable"
                                      className="text-sm"
                                    >
                                      Filterable
                                    </Label>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      id="existing-isRequired"
                                      checked={newAttribute.isRequired}
                                      onChange={(e) =>
                                        setNewAttribute({
                                          ...newAttribute,
                                          isRequired: e.target.checked,
                                        })
                                      }
                                      className="rounded"
                                    />
                                    <Label
                                      htmlFor="existing-isRequired"
                                      className="text-sm"
                                    >
                                      Required
                                    </Label>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <Label className="text-sm">
                                    Add Values (Optional)
                                  </Label>
                                  <div className="flex gap-2">
                                    <Input
                                      placeholder="Add value"
                                      value={newValue}
                                      onChange={(e) =>
                                        setNewValue(e.target.value)
                                      }
                                    />
                                    <Button
                                      onClick={handleAddValueToNewAttribute}
                                      className="bg-teal-600 hover:bg-teal-700"
                                      disabled={!newValue.trim()}
                                    >
                                      <Plus className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </>
                            )}
                          </>
                        )}
                      </div>

                      <Button
                        className="w-full bg-teal-600 hover:bg-teal-700 h-11 mt-6"
                        onClick={handleCreateOrLinkAttribute}
                        disabled={
                          isCreating ||
                          !selectedChildId ||
                          (isCreatingNew &&
                            (!newAttribute.name.trim() ||
                              ((newAttribute.type === "SELECT" ||
                                newAttribute.type === "MULTISELECT") &&
                                newAttribute.values.length === 0))) ||
                          (!isCreatingNew && !selectedExistingAttribute)
                        }
                      >
                        {isCreating ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : isCreatingNew ? (
                          "Create Attribute"
                        ) : (
                          "Link Attribute"
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Desktop Layout: Side by side */}
              <div className="hidden lg:grid lg:grid-cols-3 gap-6">
                {/* Existing Attributes */}
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">Attributes</CardTitle>
                          <CardDescription>
                            {currentAttributes.length} assigned to this category
                          </CardDescription>
                        </div>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 w-64"
                          />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {filteredAttributes.length === 0 ? (
                        <div className="text-center py-12">
                          <Filter className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-600">
                            {searchQuery
                              ? "No matches found"
                              : "No attributes yet"}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-4">
                          {filteredAttributes.map((catAttr) => (
                            <div
                              key={catAttr.categoryAttributeId}
                              className="border rounded-lg p-4 hover:border-teal-200 transition-colors"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h3 className="font-semibold">
                                      {catAttr.name}
                                    </h3>
                                    {catAttr.unit && (
                                      <span className="text-sm text-gray-500">
                                        ({catAttr.unit})
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex flex-wrap gap-2 mb-3">
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-gray-100">
                                      {getAttributeIcon(catAttr.type)}
                                      {catAttr.type.toLowerCase()}
                                    </span>
                                    {catAttr.isRequired && (
                                      <span className="px-2 py-0.5 rounded text-xs bg-red-50 text-red-700">
                                        Required
                                      </span>
                                    )}
                                    {catAttr.filterable && (
                                      <span className="px-2 py-0.5 rounded text-xs bg-teal-50 text-teal-700">
                                        Filterable
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => setEditingAttribute(catAttr)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-red-500"
                                    onClick={() =>
                                      confirmDeleteAttribute(catAttr)
                                    }
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>

                              {/* Values */}
                              {(catAttr.type === "SELECT" ||
                                catAttr.type === "MULTISELECT") &&
                                catAttr.values &&
                                catAttr.values.length > 0 && (
                                  <div className="mt-4 pt-4 border-t">
                                    <div className="flex flex-wrap gap-2 mb-3">
                                      {catAttr.values.map((value) => (
                                        <span
                                          key={value.id}
                                          className="inline-flex items-center gap-1 px-2 py-1 rounded text-sm bg-gray-50 border"
                                        >
                                          {value.value}
                                          <X
                                            className="h-3 w-3 cursor-pointer"
                                            onClick={() =>
                                              handleDeleteAttributeValue(
                                                value.id,
                                                value.value,
                                                catAttr.name
                                              )
                                            }
                                          />
                                        </span>
                                      ))}
                                    </div>
                                    <div className="flex gap-2">
                                      <Input
                                        placeholder="Add value"
                                        value={
                                          addingValueTo === catAttr.id
                                            ? newValue
                                            : ""
                                        }
                                        onChange={(e) => {
                                          setNewValue(e.target.value);
                                          setAddingValueTo(catAttr.id);
                                        }}
                                        className="flex-1"
                                        onKeyPress={(e) => {
                                          if (e.key === "Enter") {
                                            handleAddAttributeValue(
                                              catAttr.id,
                                              catAttr.name
                                            );
                                          }
                                        }}
                                      />
                                      <Button
                                        size="sm"
                                        className="bg-teal-600 hover:bg-teal-700"
                                        onClick={() =>
                                          handleAddAttributeValue(
                                            catAttr.id,
                                            catAttr.name
                                          )
                                        }
                                        disabled={
                                          addingValueTo !== catAttr.id ||
                                          !newValue.trim()
                                        }
                                      >
                                        <Plus className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                )}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Add Attribute Form */}
                <div>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Add Attribute</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {/* Same desktop form as mobile but with better spacing */}
                        <div className="flex bg-gray-100 rounded-lg p-1">
                          <Button
                            variant={isCreatingNew ? "default" : "ghost"}
                            size="sm"
                            className={`flex-1 ${
                              isCreatingNew
                                ? "bg-teal-600 text-white"
                                : "text-gray-600"
                            }`}
                            onClick={() => handleToggleMode(true)}
                          >
                            Create New
                          </Button>
                          <Button
                            variant={!isCreatingNew ? "default" : "ghost"}
                            size="sm"
                            className={`flex-1 ${
                              !isCreatingNew
                                ? "bg-teal-600 text-white"
                                : "text-gray-600"
                            }`}
                            onClick={() => handleToggleMode(false)}
                            disabled={availableAttributes.length === 0}
                          >
                            Use Existing
                          </Button>
                        </div>

                        {/* Form content - same as mobile but with better labels */}
                        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                          {/* Same form fields as mobile version */}
                          {isCreatingNew ? (
                            <>
                              <div className="space-y-2">
                                <Label>Name *</Label>
                                <Input
                                  placeholder="e.g., Color, Size"
                                  value={newAttribute.name}
                                  onChange={(e) =>
                                    setNewAttribute({
                                      ...newAttribute,
                                      name: e.target.value,
                                    })
                                  }
                                />
                              </div>

                              <div className="space-y-2">
                                <Label>Type *</Label>
                                <Select
                                  value={newAttribute.type}
                                  onValueChange={(value: AttributeType) =>
                                    setNewAttribute({
                                      ...newAttribute,
                                      type: value,
                                      values: [],
                                    })
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="SELECT">
                                      Select
                                    </SelectItem>
                                    <SelectItem value="MULTISELECT">
                                      Multi-Select
                                    </SelectItem>
                                    <SelectItem value="TEXT">Text</SelectItem>
                                    <SelectItem value="NUMBER">
                                      Number
                                    </SelectItem>
                                    <SelectItem value="BOOLEAN">
                                      Boolean
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              {newAttribute.type === "NUMBER" && (
                                <div className="space-y-2">
                                  <Label>Unit (Optional)</Label>
                                  <Input
                                    placeholder="e.g., kg, cm"
                                    value={newAttribute.unit}
                                    onChange={(e) =>
                                      setNewAttribute({
                                        ...newAttribute,
                                        unit: e.target.value,
                                      })
                                    }
                                  />
                                </div>
                              )}

                              <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    id="attr-filterable"
                                    checked={newAttribute.filterable}
                                    onChange={(e) =>
                                      setNewAttribute({
                                        ...newAttribute,
                                        filterable: e.target.checked,
                                      })
                                    }
                                    className="rounded"
                                  />
                                  <Label htmlFor="attr-filterable">
                                    Filterable
                                  </Label>
                                </div>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    id="attr-isRequired"
                                    checked={newAttribute.isRequired}
                                    onChange={(e) =>
                                      setNewAttribute({
                                        ...newAttribute,
                                        isRequired: e.target.checked,
                                      })
                                    }
                                    className="rounded"
                                  />
                                  <Label htmlFor="attr-isRequired">
                                    Required
                                  </Label>
                                </div>
                              </div>

                              {(newAttribute.type === "SELECT" ||
                                newAttribute.type === "MULTISELECT") && (
                                <div className="space-y-3">
                                  <Label>Values *</Label>
                                  <div className="flex gap-2">
                                    <Input
                                      placeholder="Add value"
                                      value={newValue}
                                      onChange={(e) =>
                                        setNewValue(e.target.value)
                                      }
                                      onKeyPress={(e) => {
                                        if (e.key === "Enter") {
                                          handleAddValueToNewAttribute();
                                        }
                                      }}
                                    />
                                    <Button
                                      onClick={handleAddValueToNewAttribute}
                                      className="bg-teal-600 hover:bg-teal-700"
                                      disabled={!newValue.trim()}
                                    >
                                      <Plus className="h-4 w-4" />
                                    </Button>
                                  </div>

                                  {newAttribute.values.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                      {newAttribute.values.map(
                                        (value, index) => (
                                          <span
                                            key={index}
                                            className="inline-flex items-center gap-1 px-2 py-1 rounded text-sm bg-gray-100"
                                          >
                                            {value}
                                            <X
                                              className="h-3 w-3 cursor-pointer"
                                              onClick={() =>
                                                handleRemoveValueFromAttribute(
                                                  index
                                                )
                                              }
                                            />
                                          </span>
                                        )
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                            </>
                          ) : (
                            <>
                              <div className="space-y-2">
                                <Label>Select Attribute *</Label>
                                <Select
                                  value={selectedExistingAttribute}
                                  onValueChange={handleExistingAttributeSelect}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Choose attribute" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {availableAttributes.map((attr) => (
                                      <SelectItem key={attr.id} value={attr.id}>
                                        <div className="flex items-center justify-between">
                                          <span>{attr.name}</span>
                                          <span className="text-sm text-gray-500">
                                            {attr.type.toLowerCase()}
                                          </span>
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              {selectedExistingAttribute && (
                                <>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        id="existing-filterable"
                                        checked={newAttribute.filterable}
                                        onChange={(e) =>
                                          setNewAttribute({
                                            ...newAttribute,
                                            filterable: e.target.checked,
                                          })
                                        }
                                        className="rounded"
                                      />
                                      <Label htmlFor="existing-filterable">
                                        Filterable
                                      </Label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        id="existing-isRequired"
                                        checked={newAttribute.isRequired}
                                        onChange={(e) =>
                                          setNewAttribute({
                                            ...newAttribute,
                                            isRequired: e.target.checked,
                                          })
                                        }
                                        className="rounded"
                                      />
                                      <Label htmlFor="existing-isRequired">
                                        Required
                                      </Label>
                                    </div>
                                  </div>

                                  <div className="space-y-2">
                                    <Label>Add Values (Optional)</Label>
                                    <div className="flex gap-2">
                                      <Input
                                        placeholder="Add value"
                                        value={newValue}
                                        onChange={(e) =>
                                          setNewValue(e.target.value)
                                        }
                                      />
                                      <Button
                                        onClick={handleAddValueToNewAttribute}
                                        className="bg-teal-600 hover:bg-teal-700"
                                        disabled={!newValue.trim()}
                                      >
                                        <Plus className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </>
                              )}
                            </>
                          )}
                        </div>

                        <Button
                          className="w-full bg-teal-600 hover:bg-teal-700 h-11"
                          onClick={handleCreateOrLinkAttribute}
                          disabled={
                            isCreating ||
                            !selectedChildId ||
                            (isCreatingNew &&
                              (!newAttribute.name.trim() ||
                                ((newAttribute.type === "SELECT" ||
                                  newAttribute.type === "MULTISELECT") &&
                                  newAttribute.values.length === 0))) ||
                            (!isCreatingNew && !selectedExistingAttribute)
                          }
                        >
                          {isCreating ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : isCreatingNew ? (
                            "Create Attribute"
                          ) : (
                            "Link Attribute"
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Attribute Dialog */}
      {editingAttribute && (
        <Dialog
          open={!!editingAttribute}
          onOpenChange={() => setEditingAttribute(null)}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Attribute</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={editingAttribute.name}
                  onChange={(e) =>
                    setEditingAttribute({
                      ...editingAttribute,
                      name: e.target.value,
                    })
                  }
                />
              </div>

              {editingAttribute.type === "NUMBER" && (
                <div className="space-y-2">
                  <Label>Unit</Label>
                  <Input
                    value={editingAttribute.unit || ""}
                    onChange={(e) =>
                      setEditingAttribute({
                        ...editingAttribute,
                        unit: e.target.value,
                      })
                    }
                    placeholder="e.g., kg, cm"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="edit-filterable"
                    checked={editingAttribute.filterable}
                    onChange={(e) =>
                      setEditingAttribute({
                        ...editingAttribute,
                        filterable: e.target.checked,
                      })
                    }
                    className="rounded"
                  />
                  <Label htmlFor="edit-filterable">Filterable</Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="edit-isRequired"
                    checked={editingAttribute.isRequired}
                    onChange={(e) =>
                      setEditingAttribute({
                        ...editingAttribute,
                        isRequired: e.target.checked,
                      })
                    }
                    className="rounded"
                  />
                  <Label htmlFor="edit-isRequired">Required</Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEditingAttribute(null)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateAttribute}
                disabled={isUpdating}
                className="bg-teal-600 hover:bg-teal-700"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Delete Attribute
            </DialogTitle>
            <DialogDescription>
              Delete "{attributeToDelete?.name}"?
            </DialogDescription>
          </DialogHeader>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-700">
              This will remove the attribute from this category.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAttribute}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AttributesTab;
