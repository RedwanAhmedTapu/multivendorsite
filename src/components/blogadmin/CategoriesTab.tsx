"use client";
import React, { useState } from "react";
import { toast } from "sonner";
import { FolderTree, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import {
  useListBlogCategoriesQuery,
  useCreateBlogCategoryMutation,
  useUpdateBlogCategoryMutation,
  useDeleteBlogCategoryMutation,
  type BlogCategory,
} from "@/features/blogApi";
import { SectionCard, FieldLabel, FieldError, TextInput, TextArea, Select, PrimaryButton, SecondaryButton, IconButton, COLORS } from "./ui";
import { BlogImageUploader } from "./BlogImageUploader";

interface FormState {
  id?: string;
  name: string;
  description: string;
  image: string | null;
  parentId: string;
  sortOrder: number;
  isActive: boolean;
}

const emptyForm: FormState = { name: "", description: "", image: null, parentId: "", sortOrder: 0, isActive: true };

export default function CategoriesTab() {
  const { data, isLoading } = useListBlogCategoriesQuery();
  const [createCategory, { isLoading: isCreating }] = useCreateBlogCategoryMutation();
  const [updateCategory, { isLoading: isUpdating }] = useUpdateBlogCategoryMutation();
  const [deleteCategory] = useDeleteBlogCategoryMutation();

  const categories = data?.data || [];
  const topLevel = categories.filter((c) => !c.parentId);

  const [form, setForm] = useState<FormState>(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [nameError, setNameError] = useState(false);

  const isSaving = isCreating || isUpdating;

  function startCreate(parentId?: string) {
    setForm({ ...emptyForm, parentId: parentId || "" });
    setShowForm(true);
    setNameError(false);
  }

  function startEdit(cat: BlogCategory) {
    setForm({
      id: cat.id,
      name: cat.name,
      description: cat.description || "",
      image: cat.image || null,
      parentId: cat.parentId || "",
      sortOrder: cat.sortOrder,
      isActive: cat.isActive,
    });
    setShowForm(true);
    setNameError(false);
  }

  async function handleSave() {
    if (!form.name.trim()) {
      setNameError(true);
      toast.error("Category name is required");
      return;
    }
    const payload = {
      name: form.name,
      description: form.description || undefined,
      image: form.image || undefined,
      parentId: form.parentId || undefined,
      sortOrder: form.sortOrder,
    };
    try {
      if (form.id) {
        await updateCategory({ id: form.id, data: { ...payload, isActive: form.isActive } }).unwrap();
        toast.success("Category updated");
      } else {
        await createCategory(payload).unwrap();
        toast.success("Category created");
      }
      setShowForm(false);
      setForm(emptyForm);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to save category");
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? Posts in this category will become uncategorized, not deleted.`)) return;
    try {
      await deleteCategory(id).unwrap();
      toast.success("Category deleted");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to delete category");
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <SectionCard
        icon={<FolderTree size={15} color="#7C3AED" />}
        title="Categories"
        subtitle="Used in the navbar dropdown and to organize posts"
        right={<SecondaryButton label="+ New Category" onClick={() => startCreate()} />}
      >
        {isLoading ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: COLORS.muted, fontSize: 13, padding: 8 }}>
            <Loader2 size={16} style={{ animation: "fm-blogadmin-spin 1s linear infinite" }} />
            Loading categories…
          </div>
        ) : topLevel.length === 0 ? (
          <p style={{ fontSize: 12.5, color: COLORS.hint }}>No categories yet — add your first one.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {topLevel.map((cat) => (
              <div key={cat.id}>
                <CategoryRow cat={cat} onEdit={() => startEdit(cat)} onDelete={() => handleDelete(cat.id, cat.name)} onAddChild={() => startCreate(cat.id)} />
                {(cat.children || []).map((child) => (
                  <div key={child.id} style={{ marginLeft: 28 }}>
                    <CategoryRow cat={child} onEdit={() => startEdit(child)} onDelete={() => handleDelete(child.id, child.name)} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {showForm && (
        <SectionCard
          icon={<Plus size={15} color="#16A34A" />}
          title={form.id ? "Edit Category" : "New Category"}
          badge="required"
          error={nameError}
        >
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14 }}>
            <div>
              <FieldLabel required>Name</FieldLabel>
              <TextInput
                value={form.name}
                onChange={(e) => { setForm((f) => ({ ...f, name: e.target.value })); setNameError(false); }}
                error={nameError}
                placeholder="e.g. Electronics"
              />
              {nameError && <FieldError message="Category name is required" />}
            </div>
            <div>
              <FieldLabel hint="Lower = appears first">Sort Order</FieldLabel>
              <TextInput type="number" value={form.sortOrder} onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) || 0 }))} />
            </div>
          </div>

          <div style={{ marginTop: 14 }}>
            <FieldLabel hint="Optional, shown on category listing pages">Description</FieldLabel>
            <TextArea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Short description of this category…" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 14 }}>
            <div>
              <FieldLabel hint="Nest under another category for the dropdown">Parent Category</FieldLabel>
              <Select value={form.parentId} onChange={(e) => setForm((f) => ({ ...f, parentId: e.target.value }))}>
                <option value="">— Top level —</option>
                {topLevel.filter((c) => c.id !== form.id).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </div>
            <div>
              <FieldLabel>Category Image</FieldLabel>
              <BlogImageUploader value={form.image} onChange={(key) => setForm((f) => ({ ...f, image: key }))} aspect="2 / 1" />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
            <SecondaryButton label="Cancel" onClick={() => { setShowForm(false); setForm(emptyForm); }} />
            <PrimaryButton isLoading={isSaving} onClick={handleSave} label={form.id ? "Update Category" : "Create Category"} />
          </div>
        </SectionCard>
      )}
    </div>
  );
}

function CategoryRow({ cat, onEdit, onDelete, onAddChild }: { cat: BlogCategory; onEdit: () => void; onDelete: () => void; onAddChild?: () => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderRadius: 9, border: `1px solid ${COLORS.cardBorder}`, background: "#FAFBFD" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.title }}>{cat.name}</span>
        {!cat.isActive && (
          <span style={{ fontSize: 9.5, fontWeight: 700, color: COLORS.danger, background: COLORS.dangerBg, padding: "1px 6px", borderRadius: 999 }}>INACTIVE</span>
        )}
        {typeof cat._count?.posts === "number" && (
          <span style={{ fontSize: 10.5, color: COLORS.hint }}>{cat._count.posts} post{cat._count.posts === 1 ? "" : "s"}</span>
        )}
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        {onAddChild && (
          <IconButton title="Add subcategory" onClick={onAddChild}><Plus size={13} /></IconButton>
        )}
        <IconButton title="Edit" onClick={onEdit}><Pencil size={13} /></IconButton>
        <IconButton title="Delete" danger onClick={onDelete}><Trash2 size={13} /></IconButton>
      </div>
    </div>
  );
}
