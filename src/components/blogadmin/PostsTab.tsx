"use client";
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Newspaper, Plus, Pencil, Trash2, Loader2, FileText, Tag, Image as ImageIcon,
  Search as SearchIcon, Link as LinkIcon, Sparkles, ArrowRight, X,
} from "lucide-react";
import {
  useListBlogPostsQuery,
  useGetBlogPostQuery,
  useCreateBlogPostMutation,
  useUpdateBlogPostMutation,
  useDeleteBlogPostMutation,
  useListBlogCategoriesQuery,
  BlogPostStatus,
  type BlogPostReference,
} from "@/features/blogApi";
import {
  SectionCard, FieldLabel, FieldError, TextInput, TextArea, Select,
  PrimaryButton, SecondaryButton, IconButton, StatusBadge, COLORS,
} from "./ui";
import { BlogImageUploader } from "./BlogImageUploader";

// Swap this for your real rich-text editor if you have one — same
// (value, onChange) signature as ProductDescriptionEditor used in
// AddProductForm, so it drops in directly:
//   import ProductDescriptionEditor from "@/components/productdescription/ProductDescriptionl";
//   <ProductDescriptionEditor value={body} onChange={setBody} />
function BodyEditorPlaceholder({ value, onChange, error }: { value: string; onChange: (v: string) => void; error?: boolean }) {
  return (
    <div>
      <TextArea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        error={error}
        placeholder="<p>Write the post body as HTML — headings, lists, tables all work…</p>"
        style={{ minHeight: 260, fontFamily: "monospace", fontSize: 12.5 }}
      />
      <p style={{ fontSize: 10.5, color: COLORS.hint, marginTop: 4 }}>
        Raw HTML for now — swap in your rich-text editor component here (same value/onChange shape as ProductDescriptionEditor).
      </p>
    </div>
  );
}

interface FormState {
  id?: string;
  title: string;
  excerpt: string;
  body: string;
  categoryId: string;
  featuredImage: string | null;
  tags: string;
  status: BlogPostStatus;
  metaTitle: string;
  metaDescription: string;
  references: BlogPostReference[];
}

const emptyForm: FormState = {
  title: "", excerpt: "", body: "", categoryId: "", featuredImage: null, tags: "",
  status: BlogPostStatus.DRAFT, metaTitle: "", metaDescription: "", references: [],
};

const STATUS_OPTIONS: BlogPostStatus[] = [BlogPostStatus.DRAFT, BlogPostStatus.PUBLISHED, BlogPostStatus.SCHEDULED, BlogPostStatus.ARCHIVED];

export default function PostsTab() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const { data, isLoading } = useListBlogPostsQuery({ page, limit: 10, status: (statusFilter || undefined) as BlogPostStatus | undefined });
  const { data: categoriesData } = useListBlogCategoriesQuery();
  const [deletePost] = useDeleteBlogPostMutation();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const categories = categoriesData?.data || [];
  const posts = data?.data?.items || [];
  const totalPages = data?.data?.totalPages || 1;

  function startCreate() {
    setEditingId(null);
    setShowForm(true);
  }
  function startEdit(id: string) {
    setEditingId(id);
    setShowForm(true);
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await deletePost(id).unwrap();
      toast.success("Post deleted");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to delete post");
    }
  }

  if (showForm) {
    return (
      <PostForm
        postId={editingId}
        categories={categories}
        onDone={() => { setShowForm(false); setEditingId(null); }}
      />
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <SectionCard
        icon={<Newspaper size={15} color="#1D4ED8" />}
        title="Blog Posts"
        subtitle="Create, edit, publish, or schedule articles"
        right={
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} style={{ width: 150, padding: "6px 10px", fontSize: 12 }}>
              <option value="">All statuses</option>
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
            <SecondaryButton label="+ New Post" onClick={startCreate} />
          </div>
        }
      >
        {isLoading ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: COLORS.muted, fontSize: 13, padding: 8 }}>
            <Loader2 size={16} style={{ animation: "fm-blogadmin-spin 1s linear infinite" }} />
            Loading posts…
          </div>
        ) : posts.length === 0 ? (
          <p style={{ fontSize: 12.5, color: COLORS.hint }}>No posts yet — click "New Post" to write your first article.</p>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {posts.map((post) => (
                <div key={post.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderRadius: 9, border: `1px solid ${COLORS.cardBorder}`, background: "#FAFBFD" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                    <div style={{ width: 44, height: 32, borderRadius: 6, background: "#EEF3FB", flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: COLORS.title, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{post.title}</p>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                        {post.status && <StatusBadge status={post.status} />}
                        {post.category && <span style={{ fontSize: 10.5, color: COLORS.hint }}>{post.category.name}</span>}
                        <span style={{ fontSize: 10.5, color: COLORS.hint }}>{post.viewCount} views</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    <IconButton title="Edit" onClick={() => startEdit(post.id)}><Pencil size={13} /></IconButton>
                    <IconButton title="Delete" danger onClick={() => handleDelete(post.id, post.title)}><Trash2 size={13} /></IconButton>
                  </div>
                </div>
              ))}
            </div>
            {totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 14 }}>
                <SecondaryButton label="Previous" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} />
                <span style={{ fontSize: 12, color: COLORS.muted, alignSelf: "center" }}>Page {page} of {totalPages}</span>
                <SecondaryButton label="Next" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} />
              </div>
            )}
          </>
        )}
      </SectionCard>
    </div>
  );
}

/* ─── Create / Edit form ─────────────────────────────────────────────────── */

function PostForm({ postId, categories, onDone }: { postId: string | null; categories: any[]; onDone: () => void }) {
  const { data: existing, isLoading: isFetching } = useGetBlogPostQuery(postId as string, { skip: !postId });
  const [createPost, { isLoading: isCreating }] = useCreateBlogPostMutation();
  const [updatePost, { isLoading: isUpdating }] = useUpdateBlogPostMutation();

  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const isSaving = isCreating || isUpdating;

  useEffect(() => {
    const p = existing?.data;
    if (!p) return;
    setForm({
      id: p.id,
      title: p.title,
      excerpt: p.excerpt || "",
      body: p.body || "",
      categoryId: p.category?.id || "",
      featuredImage: p.featuredImage || null,
      tags: (p.tags || []).join(", "),
      status: (p.status as BlogPostStatus) || BlogPostStatus.DRAFT,
      metaTitle: p.metaTitle || "",
      metaDescription: p.metaDescription || "",
      references: p.references || [],
    });
  }, [existing]);

  function addReference() {
    setForm((f) => ({ ...f, references: [...f.references, { label: "", url: "" }] }));
  }
  function updateReference(idx: number, field: keyof BlogPostReference, value: string) {
    setForm((f) => ({
      ...f,
      references: f.references.map((r, i) => (i === idx ? { ...r, [field]: field === "price" ? Number(value) || undefined : value } : r)),
    }));
  }
  function removeReference(idx: number) {
    setForm((f) => ({ ...f, references: f.references.filter((_, i) => i !== idx) }));
  }

  function validate() {
    const errs: Record<string, boolean> = {};
    if (!form.title.trim() || form.title.length < 3) errs.title = true;
    if (!form.body.trim()) errs.body = true;
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(status?: BlogPostStatus) {
    if (!validate()) {
      toast.warning("Please fill in the required fields");
      return;
    }
    const payload = {
      title: form.title,
      body: form.body,
      excerpt: form.excerpt || undefined,
      categoryId: form.categoryId || undefined,
      featuredImage: form.featuredImage || undefined,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      status: status || form.status,
      metaTitle: form.metaTitle || undefined,
      metaDescription: form.metaDescription || undefined,
      references: form.references.filter((r) => r.label.trim() && r.url.trim()),
    };
    try {
      if (form.id) {
        await updatePost({ id: form.id, data: payload }).unwrap();
        toast.success("Post updated");
      } else {
        await createPost(payload).unwrap();
        toast.success(status === BlogPostStatus.PUBLISHED ? "Post published!" : "Post saved as draft");
      }
      onDone();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to save post");
    }
  }

  if (postId && isFetching) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, color: COLORS.muted, fontSize: 13, padding: 24 }}>
        <Loader2 size={16} style={{ animation: "fm-blogadmin-spin 1s linear infinite" }} />
        Loading post…
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button onClick={onDone} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer", fontSize: 12.5, fontWeight: 600, color: COLORS.muted, padding: 0 }}>
          <X size={14} /> Back to posts
        </button>
      </div>

      <SectionCard icon={<FileText size={15} color={errors.title ? COLORS.danger : "#1D4ED8"} />} title="Title & Summary" badge="required" error={errors.title}>
        <FieldLabel required hint="At least 3 characters — this becomes the URL slug">Title</FieldLabel>
        <TextInput value={form.title} onChange={(e) => { setForm((f) => ({ ...f, title: e.target.value })); setErrors((er) => ({ ...er, title: false })); }} error={errors.title} placeholder="How to Choose the Right Air Fryer" />
        {errors.title && <FieldError message="Title is required (min 3 characters)" />}

        <div style={{ marginTop: 14 }}>
          <FieldLabel hint="Shown on cards and search results, max ~300 characters">Excerpt</FieldLabel>
          <TextArea value={form.excerpt} onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))} placeholder="A short one- or two-sentence summary…" style={{ minHeight: 70 }} />
        </div>
      </SectionCard>

      <SectionCard icon={<Tag size={15} color="#7C3AED" />} title="Category & Tags" badge="optional">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <FieldLabel>Category</FieldLabel>
            <Select value={form.categoryId} onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}>
              <option value="">— Uncategorized —</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </div>
          <div>
            <FieldLabel hint="Comma-separated">Tags</FieldLabel>
            <TextInput value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} placeholder="electronics, kitchen, buying-guide" />
          </div>
        </div>
      </SectionCard>

      <SectionCard icon={<ImageIcon size={15} color="#0891B2" />} title="Featured Image" badge="optional">
        <BlogImageUploader value={form.featuredImage} onChange={(key) => setForm((f) => ({ ...f, featuredImage: key }))} aspect="16 / 9" />
      </SectionCard>

      <SectionCard icon={<FileText size={15} color={errors.body ? COLORS.danger : "#16A34A"} />} title="Body" badge="required" error={errors.body}>
        <BodyEditorPlaceholder value={form.body} onChange={(v) => { setForm((f) => ({ ...f, body: v })); setErrors((er) => ({ ...er, body: false })); }} error={errors.body} />
        {errors.body && <FieldError message="Post body is required" />}
      </SectionCard>

      <SectionCard
        icon={<LinkIcon size={15} color="#D97706" />}
        title="Compare & Sources"
        subtitle="Price comparisons or links to other sites, rendered as cards on the post"
        badge="optional"
        right={<SecondaryButton label="+ Add Reference" onClick={addReference} />}
      >
        {form.references.length === 0 ? (
          <p style={{ fontSize: 12.5, color: COLORS.hint }}>No reference links added.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {form.references.map((ref, idx) => (
              <div key={idx} style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr 1fr auto", gap: 6 }}>
                <TextInput value={ref.label} onChange={(e) => updateReference(idx, "label", e.target.value)} placeholder="Label, e.g. Philips HD9252" />
                <TextInput value={ref.url} onChange={(e) => updateReference(idx, "url", e.target.value)} placeholder="https://…" />
                <TextInput type="number" value={ref.price ?? ""} onChange={(e) => updateReference(idx, "price", e.target.value)} placeholder="Price ৳" />
                <TextInput value={ref.source || ""} onChange={(e) => updateReference(idx, "source", e.target.value)} placeholder="Source" />
                <IconButton title="Remove" danger onClick={() => removeReference(idx)}><Trash2 size={13} /></IconButton>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard icon={<SearchIcon size={15} color="#64748B" />} title="SEO" badge="optional">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <FieldLabel hint="Max 60 characters — defaults to the title">Meta Title</FieldLabel>
            <TextInput value={form.metaTitle} onChange={(e) => setForm((f) => ({ ...f, metaTitle: e.target.value }))} maxLength={60} />
          </div>
          <div>
            <FieldLabel hint="Max 160 characters — defaults to the excerpt">Meta Description</FieldLabel>
            <TextInput value={form.metaDescription} onChange={(e) => setForm((f) => ({ ...f, metaDescription: e.target.value }))} maxLength={160} />
          </div>
        </div>
      </SectionCard>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, padding: "14px 18px", background: "#fff", border: `1.5px solid ${COLORS.cardBorder}`, borderRadius: 14 }}>
        <SecondaryButton label="Cancel" onClick={onDone} disabled={isSaving} />
        <SecondaryButton label="Save as Draft" onClick={() => handleSubmit(BlogPostStatus.DRAFT)} disabled={isSaving} />
        <PrimaryButton
          isLoading={isSaving}
          onClick={() => handleSubmit(BlogPostStatus.PUBLISHED)}
          label={form.id ? "Update & Publish" : "Publish"}
          icon={<Sparkles size={13} />}
        />
      </div>
    </div>
  );
}
