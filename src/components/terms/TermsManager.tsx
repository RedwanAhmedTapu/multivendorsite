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
    <div className="mx-auto max-w-[1180px] space-y-4 bg-[#F7F9FD] px-4 py-5 sm:px-6 sm:py-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-[22px] font-semibold leading-tight tracking-tight text-[#0D1B2E]">Terms & Conditions Manager</h1>
          <p className="mt-1.5 max-w-xl text-[12.5px] leading-relaxed text-[#7A90AB]">
            Create and manage terms of service, privacy policies, and other legal
            documents
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setActiveTab("create");
          }}
          className="inline-flex items-center gap-1.5 rounded-[11px] bg-gradient-to-br from-[#2563EB] to-[#8B5CF6] px-3.5 py-2 text-xs font-semibold text-white shadow-sm shadow-[#8B5CF6]/25 transition hover:brightness-105"
        >
          <Plus className="w-4 h-4" /> New Document
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 gap-1 rounded-[12px] border border-[#E5EAF2] bg-[#FAFBFD] p-1">
          <TabsTrigger value="browse" className="rounded-[9px] py-1.5 text-[11.5px] font-semibold text-[#3D5068] data-[state=active]:bg-white data-[state=active]:text-[#0D1B2E] data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-[#E5EAF2]">Browse Documents</TabsTrigger>
          <TabsTrigger value="create" className="rounded-[9px] py-1.5 text-[11.5px] font-semibold text-[#3D5068] data-[state=active]:bg-white data-[state=active]:text-[#0D1B2E] data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-[#E5EAF2]">Create New</TabsTrigger>
          <TabsTrigger value="edit" disabled={!editingId} className="rounded-[9px] py-1.5 text-[11.5px] font-semibold text-[#3D5068] data-[state=active]:bg-white data-[state=active]:text-[#0D1B2E] data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-[#E5EAF2]">
            Edit Document
          </TabsTrigger>
        </TabsList>

        {/* -------- Browse Tab -------- */}
        <TabsContent value="browse" className="mt-4 space-y-4">
          {/* Filter Section */}
          <section className="rounded-[14px] border border-[#E5EAF2] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-t-[13px] border-b border-[#F0F4FA] bg-[#FAFBFD] px-3.5 py-2.5">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-[8px] bg-[#EEF3FB] text-[#2563EB]">
                  <Search size={12} />
                </span>
                <h2 className="text-[11px] font-semibold uppercase tracking-wide text-[#3D5068]">Filters</h2>
              </div>
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1 rounded-[10px] border border-[#E5EAF2] bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[#3D5068] transition hover:border-[#D5DEEC] hover:bg-[#FAFBFD]"
              >
                <XCircle size={12} /> Clear
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 px-3.5 py-3 md:grid-cols-2 xl:grid-cols-4">
              <label className="block">
                <span className="text-[10.5px] font-semibold uppercase tracking-wide text-[#7A90AB]">Search</span>
                <span className="relative mt-1 block">
                  <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9BAABB]" />
                  <input
                    id="search"
                    placeholder="Search documents..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange("search", e.target.value)}
                    className="w-full rounded-[12px] border border-[#E5EAF2] bg-white px-2.5 py-2 text-[12.5px] text-[#0D1B2E] outline-none transition focus:border-[#A855F7] focus:ring-4 focus:ring-[#A855F7]/10 pl-8"
                  />
                </span>
              </label>

              <label className="block">
                <span className="text-[10.5px] font-semibold uppercase tracking-wide text-[#7A90AB]">Type</span>
                <select
                  id="filter-type"
                  value={filters.type}
                  onChange={(e) => handleFilterChange("type", e.target.value)}
                  className="w-full rounded-[12px] border border-[#E5EAF2] bg-white px-2.5 py-2 text-[12.5px] text-[#0D1B2E] outline-none transition focus:border-[#A855F7] focus:ring-4 focus:ring-[#A855F7]/10 mt-1 cursor-pointer"
                >
                  <option value="all">All Types</option>
                  <option value="GENERAL">General Terms</option>
                  <option value="PRIVACY_POLICY">Privacy Policy</option>
                  <option value="RETURN_POLICY">Return Policy</option>
                  <option value="VENDOR_AGREEMENT">Vendor Agreement</option>
                  <option value="CUSTOMER_TERMS">Customer Terms</option>
                  <option value="DELIVERY_TERMS">Delivery Terms</option>
                </select>
              </label>

              <label className="block">
                <span className="text-[10.5px] font-semibold uppercase tracking-wide text-[#7A90AB]">Language</span>
                <select
                  id="filter-language"
                  value={filters.language}
                  onChange={(e) => handleFilterChange("language", e.target.value)}
                  className="w-full rounded-[12px] border border-[#E5EAF2] bg-white px-2.5 py-2 text-[12.5px] text-[#0D1B2E] outline-none transition focus:border-[#A855F7] focus:ring-4 focus:ring-[#A855F7]/10 mt-1 cursor-pointer"
                >
                  <option value="all">All Languages</option>
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="bn">Bengali</option>
                </select>
              </label>

              <label className="block">
                <span className="text-[10.5px] font-semibold uppercase tracking-wide text-[#7A90AB]">Status</span>
                <select
                  id="filter-status"
                  value={filters.status}
                  onChange={(e) => handleFilterChange("status", e.target.value)}
                  className="w-full rounded-[12px] border border-[#E5EAF2] bg-white px-2.5 py-2 text-[12.5px] text-[#0D1B2E] outline-none transition focus:border-[#A855F7] focus:ring-4 focus:ring-[#A855F7]/10 mt-1 cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="active">Active</option>
                </select>
              </label>
            </div>
          </section>

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
              <div className="animate-pulse space-y-2 rounded-[14px] border border-[#E5EAF2] bg-white p-4"><div className="h-3 w-1/3 rounded bg-[#EEF3FB]" /><div className="h-2.5 w-full rounded bg-[#F4F7FC]" /><div className="h-2.5 w-2/3 rounded bg-[#F4F7FC]" /></div>
            </div>
          ) : filteredTerms && filteredTerms.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredTerms.map((term: Terms) => (
                <article
                  key={term.id}
                  className="group flex flex-col overflow-hidden rounded-[14px] border border-[#E5EAF2] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition hover:border-[#D5DEEC] hover:shadow-md hover:shadow-[#8B5CF6]/10"
                >
                  <div className="flex items-start justify-between gap-2 border-b border-[#F0F4FA] bg-[#FAFBFD] px-3.5 py-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-[13.5px] font-semibold text-[#0D1B2E]">{term.title}</h3>
                      <div className="mt-1 flex flex-wrap items-center gap-1">
                        <span className="inline-flex items-center gap-1 rounded-full border border-[#E5EAF2] bg-white px-1.5 py-0.5 text-[10px] font-semibold text-[#3D5068]">
                          <Hash size={9} className="text-[#9BAABB]" /> v{term.version}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full border border-[#E5EAF2] bg-white px-1.5 py-0.5 text-[10px] font-semibold text-[#3D5068]">
                          <Globe size={9} className="text-[#9BAABB]" /> {term.language.toUpperCase()}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full border border-[#E5EAF2] bg-white px-1.5 py-0.5 text-[10px] font-semibold text-[#3D5068]">
                          <Type size={9} className="text-[#9BAABB]" /> {term.type.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      {term.isActive && (
                        <span className="rounded-full bg-[#F0F9F0] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#16A34A] ring-1 ring-[#BBF7D0]">
                          Active
                        </span>
                      )}
                      {term.isPublished && (
                        <span className="rounded-full bg-[#EEF3FB] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#2563EB] ring-1 ring-[#D5DEEC]">
                          Published
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 px-3.5 py-3">
                    <div
                      className="line-clamp-3 text-[12px] leading-relaxed text-[#3D5068] prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{
                        __html: term.content || "<p>No content yet</p>",
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-2 border-t border-[#F0F4FA] px-3.5 py-2.5">
                    <span className="text-[10px] text-[#9BAABB]">
                      Updated {new Date(term.updatedAt).toLocaleDateString()}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleEdit(term)}
                        aria-label={`Edit ${term.title}`}
                        className="rounded-[9px] p-1.5 text-[#9BAABB] transition hover:bg-[#EEF3FB] hover:text-[#2563EB]"
                      >
                        <Edit size={13} />
                      </button>
                      {!term.isPublished && (
                        <button
                          type="button"
                          onClick={() => handlePublish(term.id)}
                          aria-label={`Publish ${term.title}`}
                          className="rounded-[9px] p-1.5 text-[#9BAABB] transition hover:bg-[#EEF3FB] hover:text-[#16A34A]"
                        >
                          <Upload size={13} />
                        </button>
                      )}
                      {!term.isActive && term.isPublished && (
                        <button
                          type="button"
                          onClick={() => handleActivate(term.id, term.type as TermType)}
                          aria-label={`Activate ${term.title}`}
                          className="rounded-[9px] p-1.5 text-[#9BAABB] transition hover:bg-[#F0F9F0] hover:text-[#16A34A]"
                        >
                          <CheckCircle size={13} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDelete(term.id)}
                        aria-label={`Delete ${term.title}`}
                        className="rounded-[9px] p-1.5 text-[#9BAABB] transition hover:bg-[#FEF2F2] hover:text-[#DC2626]"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <Card className="rounded-[14px] border border-dashed border-[#E5EAF2] bg-[#FAFBFD] px-4 py-12 text-center">
              <CardContent className="flex flex-col items-center">
                <FileText className="mx-auto mb-4 h-12 w-12 text-[#C3CEDD]" />
                <h3 className="mb-2 text-[15px] font-semibold text-[#0D1B2E]">
                  {terms && terms.length > 0 ? "No matching documents" : "No terms documents yet"}
                </h3>
                <p className="mb-4 max-w-sm text-[12px] leading-relaxed text-[#7A90AB]">
                  {terms && terms.length > 0 
                    ? "Try adjusting your filters to find what you're looking for."
                    : "Get started by creating your first terms and conditions document."}
                </p>
                <Button className="h-8 rounded-[10px] border-0 bg-[linear-gradient(135deg,#2563EB,#8B5CF6)] px-3.5 text-[11.5px] font-semibold text-white shadow-sm hover:opacity-95" onClick={() => {
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
        <TabsContent value="create" className="mt-4 space-y-4">
          <Card className="overflow-hidden rounded-[14px] border border-[#E5EAF2] bg-white shadow-[0_18px_40px_-24px_rgba(13,27,46,0.35)]">
            <CardHeader className="border-b border-[#E5EAF2] bg-[#FAFBFD] px-4 py-3">
              <CardTitle className="text-[14.5px] font-semibold tracking-tight text-[#0D1B2E]">Create New Terms Document</CardTitle>
              <CardDescription className="mt-0.5 text-[11.5px] text-[#7A90AB]">
                Fill in the details below to create a new terms and conditions
                document
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3.5 px-4 py-4">
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
            <CardFooter className="flex flex-col-reverse gap-2 border-t border-[#E5EAF2] bg-[#FAFBFD] px-4 py-3 sm:flex-row sm:justify-between">
              <Button variant="outline" onClick={handleCancel} className="h-8 rounded-[10px] border border-[#E5EAF2] bg-white px-3 text-[11.5px] font-semibold text-[#3D5068] hover:bg-[#FAFBFD]">
                <X className="w-4 h-4 mr-2" /> Cancel
              </Button>
              <Button onClick={handleSave} className="h-8 rounded-[10px] border-0 bg-[linear-gradient(135deg,#2563EB,#8B5CF6)] px-3.5 text-[11.5px] font-semibold text-white shadow-sm hover:opacity-95">
                <Save className="w-4 h-4 mr-2" /> Create Document
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* -------- Edit Tab -------- */}
        <TabsContent value="edit" className="mt-4 space-y-4">
          <Card className="overflow-hidden rounded-[14px] border border-[#E5EAF2] bg-white shadow-[0_18px_40px_-24px_rgba(13,27,46,0.35)]">
            <CardHeader className="border-b border-[#E5EAF2] bg-[#FAFBFD] px-4 py-3">
              <CardTitle className="text-[14.5px] font-semibold tracking-tight text-[#0D1B2E]">Edit Terms Document</CardTitle>
              <CardDescription className="mt-0.5 text-[11.5px] text-[#7A90AB]">
                Make changes to your terms and conditions document
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3.5 px-4 py-4">
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
            <CardFooter className="flex flex-col-reverse gap-2 border-t border-[#E5EAF2] bg-[#FAFBFD] px-4 py-3 sm:flex-row sm:justify-between">
              <Button variant="outline" onClick={() => setActiveTab("browse")} className="h-8 rounded-[10px] border border-[#E5EAF2] bg-white px-3 text-[11.5px] font-semibold text-[#3D5068] hover:bg-[#FAFBFD]">
                <X className="w-4 h-4 mr-2" /> Cancel
              </Button>
              <div className="flex gap-2">
                <Button className="h-8 rounded-[10px] border border-[#E5EAF2] bg-white px-3 text-[11.5px] font-semibold text-[#3D5068] hover:bg-[#FAFBFD]"
                  variant="outline"
                  onClick={() => handlePublish(editingId!)}
                  disabled={form.isPublished}
                >
                  <Upload className="w-4 h-4 mr-2" />{" "}
                  {form.isPublished ? "Published" : "Publish"}
                </Button>
                <Button className="h-8 rounded-[10px] border border-[#E5EAF2] bg-white px-3 text-[11.5px] font-semibold text-[#3D5068] hover:bg-[#FAFBFD]"
                  variant="outline"
                  onClick={() => handleActivate(editingId!, form.type)}
                  disabled={form.isActive}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />{" "}
                  {form.isActive ? "Active" : "Activate"}
                </Button>
              <Button onClick={handleSave} className="h-8 rounded-[10px] border-0 bg-[linear-gradient(135deg,#2563EB,#8B5CF6)] px-3.5 text-[11.5px] font-semibold text-white shadow-sm hover:opacity-95">
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