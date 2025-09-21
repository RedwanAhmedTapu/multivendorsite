"use client";

import React, { useState, useMemo } from "react";
import {
  useGetTermsQuery,
  useCreateTermsMutation,
  useUpdateTermsMutation,
  useDeleteTermsMutation,
  usePublishTermsMutation,
  useActivateTermsMutation,
  Terms,
} from "../../features/termsApi";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Editor } from "@tinymce/tinymce-react";
import {
  Trash2,
  Edit,
  CheckCircle,
  Upload,
  Plus,
  FileText,
  Save,
  X,
  Globe,
  Hash,
  Type,
  Search,
  XCircle,
} from "lucide-react";

// Define allowed types
type TermType =
  | "GENERAL"
  | "PRIVACY_POLICY"
  | "VENDOR_AGREEMENT"
  | "CUSTOMER_TERMS"
  | "DELIVERY_TERMS"
  | "RETURN_POLICY";

interface FormState {
  title: string;
  slug: string;
  version: string;
  content: string;
  type: TermType;
  language: string;
  isActive: boolean;
  isPublished: boolean;
  metaTitle?: string;
  metaDesc?: string;
}

interface FilterState {
  search: string;
  type: string;
  language: string;
  status: string;
}

export default function TermsManager() {
  const { data: terms, isLoading, refetch } = useGetTermsQuery();
  const [createTerms] = useCreateTermsMutation();
  const [updateTerms] = useUpdateTermsMutation();
  const [deleteTerms] = useDeleteTermsMutation();
  const [publishTerms] = usePublishTermsMutation();
  const [activateTerms] = useActivateTermsMutation();

  const [activeTab, setActiveTab] = useState("browse");
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    type: "all",
    language: "all",
    status: "all",
  });

  // Form state
  const [form, setForm] = useState<FormState>({
    title: "",
    slug: "",
    version: "1.0.0",
    content: "",
    type: "GENERAL",
    language: "en",
    isActive: false,
    isPublished: false,
    metaTitle: "",
    metaDesc: "",
  });

  // Filter terms based on filter state
  const filteredTerms = useMemo(() => {
    if (!terms) return [];
    
    return terms.filter(term => {
      // Search filter
      if (filters.search && 
          !term.title.toLowerCase().includes(filters.search.toLowerCase()) &&
          !term.content.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      
      // Type filter
      if (filters.type !== "all" && term.type !== filters.type) {
        return false;
      }
      
      // Language filter
      if (filters.language !== "all" && term.language !== filters.language) {
        return false;
      }
      
      // Status filter
      if (filters.status !== "all") {
        if (filters.status === "published" && !term.isPublished) return false;
        if (filters.status === "active" && !term.isActive) return false;
        if (filters.status === "draft" && term.isPublished) return false;
      }
      
      return true;
    });
  }, [terms, filters]);

  const handleSave = async () => {
    try {
      if (editingId) {
        await updateTerms({ 
          id: editingId, 
          data: {
            title: form.title,
            slug: form.slug,
            version: form.version,
            content: form.content,
            type: form.type,
            language: form.language,
            metaTitle: form.metaTitle,
            metaDesc: form.metaDesc,
          }
        }).unwrap();
      } else {
        await createTerms({
          title: form.title,
          slug: form.slug,
          version: form.version,
          content: form.content,
          type: form.type,
          language: form.language,
          metaTitle: form.metaTitle,
          metaDesc: form.metaDesc,
        }).unwrap();
      }
      resetForm();
      refetch();
      setActiveTab("browse");
    } catch (error) {
      console.error("Failed to save terms:", error);
    }
  };

  const handleEdit = (term: Terms) => {
    setEditingId(term.id);
    setForm({
      title: term.title,
      slug: term.slug,
      version: term.version,
      content: term.content,
      type: term.type as TermType,
      language: term.language,
      isActive: term.isActive,
      isPublished: term.isPublished,
      metaTitle: term.metaTitle || "",
      metaDesc: term.metaDesc || "",
    });
    setActiveTab("edit");
  };

  const handleDelete = async (id: string) => {
    if (
      confirm(
        "Are you sure you want to delete these terms? This action cannot be undone."
      )
    ) {
      try {
        await deleteTerms(id).unwrap();
        refetch();
      } catch (error) {
        console.error("Failed to delete terms:", error);
      }
    }
  };

  const handlePublish = async (id: string) => {
    try {
      await publishTerms(id).unwrap();
      refetch();
    } catch (error) {
      console.error("Failed to publish terms:", error);
    }
  };

  const handleActivate = async (id: string, type: TermType) => {
    try {
      await activateTerms({ id, type }).unwrap();
      refetch();
    } catch (error) {
      console.error("Failed to activate terms:", error);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({
      title: "",
      slug: "",
      version: "1.0.0",
      content: "",
      type: "GENERAL",
      language: "en",
      isActive: false,
      isPublished: false,
      metaTitle: "",
      metaDesc: "",
    });
  };

  const handleCancel = () => {
    resetForm();
    setActiveTab("browse");
  };

  const handleTypeChange = (value: TermType) => {
    setForm({ ...form, type: value });
  };

  const handleLanguageChange = (value: string) => {
    setForm({ ...form, language: value });
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    const slug = title
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]+/g, "");
    setForm({ ...form, title, slug });
  };

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      type: "all",
      language: "all",
      status: "all",
    });
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Terms & Conditions Manager</h1>
          <p className="text-muted-foreground">
            Create and manage terms of service, privacy policies, and other legal
            documents
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setActiveTab("create");
          }}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> New Document
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="browse">Browse Documents</TabsTrigger>
          <TabsTrigger value="create">Create New</TabsTrigger>
          <TabsTrigger value="edit" disabled={!editingId}>
            Edit Document
          </TabsTrigger>
        </TabsList>

        {/* -------- Browse Tab -------- */}
        <TabsContent value="browse" className="space-y-4 mt-6">
          {/* Filter Section */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Filters</CardTitle>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={clearFilters}
                  className="flex items-center gap-1"
                >
                  <XCircle className="w-4 h-4" /> Clear
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="search">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Search documents..."
                      value={filters.search}
                      onChange={(e) => handleFilterChange("search", e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="filter-type">Type</Label>
                  <Select
                    value={filters.type}
                    onValueChange={(value) => handleFilterChange("type", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="GENERAL">General Terms</SelectItem>
                      <SelectItem value="PRIVACY_POLICY">Privacy Policy</SelectItem>
                      <SelectItem value="RETURN_POLICY">Return Policy</SelectItem>
                      <SelectItem value="VENDOR_AGREEMENT">Vendor Agreement</SelectItem>
                      <SelectItem value="CUSTOMER_TERMS">Customer Terms</SelectItem>
                      <SelectItem value="DELIVERY_TERMS">Delivery Terms</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="filter-language">Language</Label>
                  <Select
                    value={filters.language}
                    onValueChange={(value) => handleFilterChange("language", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All languages" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Languages</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                      <SelectItem value="bn">Bengali</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="filter-status">Status</Label>
                  <Select
                    value={filters.status}
                    onValueChange={(value) => handleFilterChange("status", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results Count */}
          {!isLoading && terms && (
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Showing {filteredTerms.length} of {terms.length} documents
              </p>
            </div>
          )}

          {/* Documents Grid */}
          {isLoading ? (
            <div className="flex justify-center py-10">
              <p>Loading documents...</p>
            </div>
          ) : filteredTerms && filteredTerms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTerms.map((term: Terms) => (
                <Card
                  key={term.id}
                  className="overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{term.title}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Hash className="w-3 h-3" /> v{term.version}
                          </Badge>
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Globe className="w-3 h-3" />{" "}
                            {term.language.toUpperCase()}
                          </Badge>
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Type className="w-3 h-3" /> {term.type.replace("_", " ")}
                          </Badge>
                        </CardDescription>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {term.isActive && (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                            Active
                          </Badge>
                        )}
                        {term.isPublished && (
                          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                            Published
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <div
                      className="text-sm text-muted-foreground line-clamp-3 prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{
                        __html: term.content || "<p>No content yet</p>",
                      }}
                    />
                  </CardContent>
                  <CardFooter className="flex justify-between bg-muted/50 py-3">
                    <div className="text-xs text-muted-foreground">
                      Last updated:{" "}
                      {new Date(term.updatedAt).toLocaleDateString()}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(term)}
                        className="h-8 px-2"
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      {!term.isPublished && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePublish(term.id)}
                          className="h-8 px-2"
                        >
                          <Upload className="w-3 h-3" />
                        </Button>
                      )}
                      {!term.isActive && term.isPublished && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleActivate(term.id, term.type as TermType)}
                          className="h-8 px-2"
                        >
                          <CheckCircle className="w-3 h-3 text-green-600" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(term.id)}
                        className="h-8 px-2"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="text-center py-10">
              <CardContent>
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  {terms && terms.length > 0 ? "No matching documents" : "No terms documents yet"}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {terms && terms.length > 0 
                    ? "Try adjusting your filters to find what you're looking for."
                    : "Get started by creating your first terms and conditions document."}
                </p>
                <Button onClick={() => {
                  if (terms && terms.length > 0) {
                    clearFilters();
                  } else {
                    setActiveTab("create");
                  }
                }}>
                  {terms && terms.length > 0 ? "Clear Filters" : "Create New Document"}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* -------- Create Tab -------- */}
        <TabsContent value="create" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Create New Terms Document</CardTitle>
              <CardDescription>
                Fill in the details below to create a new terms and conditions
                document
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={form.title}
                    onChange={handleTitleChange}
                    placeholder="e.g., Terms of Service"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug *</Label>
                  <Input
                    id="slug"
                    value={form.slug}
                    onChange={(e) =>
                      setForm({ ...form, slug: e.target.value })
                    }
                    placeholder="e.g., terms-of-service"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="version">Version *</Label>
                  <Input
                    id="version"
                    value={form.version}
                    onChange={(e) =>
                      setForm({ ...form, version: e.target.value })
                    }
                    placeholder="e.g., 1.0.0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type *</Label>
                  <Select value={form.type} onValueChange={handleTypeChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GENERAL">General Terms</SelectItem>
                      <SelectItem value="PRIVACY_POLICY">
                        Privacy Policy
                      </SelectItem>
                      <SelectItem value="RETURN_POLICY">
                        Return Policy
                      </SelectItem>
                      <SelectItem value="VENDOR_AGREEMENT">
                        Vendor Agreement
                      </SelectItem>
                      <SelectItem value="CUSTOMER_TERMS">
                        Customer Terms
                      </SelectItem>
                      <SelectItem value="DELIVERY_TERMS">
                        Delivery Terms
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Language *</Label>
                  <Select
                    value={form.language}
                    onValueChange={handleLanguageChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                      <SelectItem value="bn">Bengali</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Content *</Label>
                <Editor
                  apiKey="b2zz2r7lny7pux1l4rgi2lsrelk385g581lyx6ohka861z6u"
                  value={form.content}
                  onEditorChange={(val) =>
                    setForm({ ...form, content: val })
                  }
                  init={{
                    height: 400,
                    menubar: true,
                    plugins: [
                      "advlist",
                      "autolink",
                      "lists",
                      "link",
                      "image",
                      "charmap",
                      "preview",
                      "anchor",
                      "searchreplace",
                      "visualblocks",
                      "code",
                      "fullscreen",
                      "insertdatetime",
                      "media",
                      "table",
                      "code",
                      "help",
                      "wordcount",
                    ],
                    toolbar:
                      "undo redo | blocks | bold italic forecolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link table | code",
                    branding: false,
                    content_style:
                      "body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif; font-size: 14px; }",
                  }}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="metaTitle">Meta Title</Label>
                  <Input
                    id="metaTitle"
                    value={form.metaTitle}
                    onChange={(e) =>
                      setForm({ ...form, metaTitle: e.target.value })
                    }
                    placeholder="Meta title for SEO"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="metaDesc">Meta Description</Label>
                  <Input
                    id="metaDesc"
                    value={form.metaDesc}
                    onChange={(e) =>
                      setForm({ ...form, metaDesc: e.target.value })
                    }
                    placeholder="Meta description for SEO"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={handleCancel}>
                <X className="w-4 h-4 mr-2" /> Cancel
              </Button>
              <Button onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" /> Create Document
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* -------- Edit Tab -------- */}
        <TabsContent value="edit" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Edit Terms Document</CardTitle>
              <CardDescription>
                Make changes to your terms and conditions document
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-title">Title *</Label>
                  <Input
                    id="edit-title"
                    value={form.title}
                    onChange={handleTitleChange}
                    placeholder="e.g., Terms of Service"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-slug">Slug *</Label>
                  <Input
                    id="edit-slug"
                    value={form.slug}
                    onChange={(e) =>
                      setForm({ ...form, slug: e.target.value })
                    }
                    placeholder="e.g., terms-of-service"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-version">Version *</Label>
                  <Input
                    id="edit-version"
                    value={form.version}
                    onChange={(e) =>
                      setForm({ ...form, version: e.target.value })
                    }
                    placeholder="e.g., 1.0.0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-type">Type *</Label>
                  <Select value={form.type} onValueChange={handleTypeChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GENERAL">General Terms</SelectItem>
                      <SelectItem value="PRIVACY_POLICY">
                        Privacy Policy
                      </SelectItem>
                      <SelectItem value="RETURN_POLICY">
                        Return Policy
                      </SelectItem>
                      <SelectItem value="VENDOR_AGREEMENT">
                        Vendor Agreement
                      </SelectItem>
                      <SelectItem value="CUSTOMER_TERMS">
                        Customer Terms
                      </SelectItem>
                      <SelectItem value="DELIVERY_TERMS">
                        Delivery Terms
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-language">Language *</Label>
                  <Select
                    value={form.language}
                    onValueChange={handleLanguageChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                      <SelectItem value="bn">Bengali</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-content">Content *</Label>
                <Editor
                  apiKey="b2zz2r7lny7pux1l4rgi2lsrelk385g581lyx6ohka861z6u"
                  value={form.content}
                  onEditorChange={(val) =>
                    setForm({ ...form, content: val })
                  }
                  init={{
                    height: 400,
                    menubar: true,
                    plugins: [
                      "advlist",
                      "autolink",
                      "lists",
                      "link",
                      "image",
                      "charmap",
                      "preview",
                      "anchor",
                      "searchreplace",
                      "visualblocks",
                      "code",
                      "fullscreen",
                      "insertdatetime",
                      "media",
                      "table",
                      "code",
                      "help",
                      "wordcount",
                    ],
                    toolbar:
                      "undo redo | blocks | bold italic forecolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link table | code",
                    branding: false,
                    content_style:
                      "body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif; font-size: 14px; }",
                  }}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-metaTitle">Meta Title</Label>
                  <Input
                    id="edit-metaTitle"
                    value={form.metaTitle}
                    onChange={(e) =>
                      setForm({ ...form, metaTitle: e.target.value })
                    }
                    placeholder="Meta title for SEO"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-metaDesc">Meta Description</Label>
                  <Input
                    id="edit-metaDesc"
                    value={form.metaDesc}
                    onChange={(e) =>
                      setForm({ ...form, metaDesc: e.target.value })
                    }
                    placeholder="Meta description for SEO"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setActiveTab("browse")}>
                <X className="w-4 h-4 mr-2" /> Cancel
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => handlePublish(editingId!)}
                  disabled={form.isPublished}
                >
                  <Upload className="w-4 h-4 mr-2" />{" "}
                  {form.isPublished ? "Published" : "Publish"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleActivate(editingId!, form.type)}
                  disabled={form.isActive}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />{" "}
                  {form.isActive ? "Active" : "Activate"}
                </Button>
                <Button onClick={handleSave}>
                  <Save className="w-4 h-4 mr-2" /> Save Changes
                </Button>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}