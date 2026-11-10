"use client";
import React, { useMemo, useState } from "react";
import { toast } from "sonner";
import { Menu, Plus, Pencil, Trash2, ArrowUp, ArrowDown, Loader2, Eye, EyeOff } from "lucide-react";
import {
  useListBlogNavItemsQuery,
  useCreateBlogNavItemMutation,
  useUpdateBlogNavItemMutation,
  useDeleteBlogNavItemMutation,
  useReorderBlogNavItemsMutation,
  type BlogNavItem,
} from "@/features/blogApi";
import { SectionCard, FieldLabel, FieldError, TextInput, Select, PrimaryButton, SecondaryButton, IconButton, COLORS } from "./ui";

interface FormState {
  id?: string;
  label: string;
  url: string;
  parentId: string;
  isVisible: boolean;
  openInNewTab: boolean;
}
const emptyForm: FormState = { label: "", url: "", parentId: "", isVisible: true, openInNewTab: false };

export default function NavMenuTab() {
  const { data, isLoading } = useListBlogNavItemsQuery();
  const [createItem, { isLoading: isCreating }] = useCreateBlogNavItemMutation();
  const [updateItem, { isLoading: isUpdating }] = useUpdateBlogNavItemMutation();
  const [deleteItem] = useDeleteBlogNavItemMutation();
  const [reorderItems] = useReorderBlogNavItemsMutation();

  const flat: BlogNavItem[] = data?.data || [];
  const topLevel = useMemo(
    () => flat.filter((i) => !i.parentId).sort((a, b) => a.sortOrder - b.sortOrder),
    [flat]
  );
  const childrenOf = (parentId: string) =>
    flat.filter((i) => i.parentId === parentId).sort((a, b) => a.sortOrder - b.sortOrder);

  const [form, setForm] = useState<FormState>(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [labelError, setLabelError] = useState(false);
  const isSaving = isCreating || isUpdating;

  function startCreate(parentId?: string) {
    setForm({ ...emptyForm, parentId: parentId || "" });
    setShowForm(true);
    setLabelError(false);
  }
  function startEdit(item: BlogNavItem) {
    setForm({ id: item.id, label: item.label, url: item.url || "", parentId: item.parentId || "", isVisible: item.isVisible, openInNewTab: item.openInNewTab });
    setShowForm(true);
    setLabelError(false);
  }

  async function handleSave() {
    if (!form.label.trim()) {
      setLabelError(true);
      toast.error("Label is required");
      return;
    }
    const payload = {
      label: form.label,
      url: form.url || undefined,
      parentId: form.parentId || null,
      isVisible: form.isVisible,
      openInNewTab: form.openInNewTab,
    };
    try {
      if (form.id) {
        await updateItem({ id: form.id, data: payload }).unwrap();
        toast.success("Nav item updated");
      } else {
        await createItem(payload).unwrap();
        toast.success("Nav item created");
      }
      setShowForm(false);
      setForm(emptyForm);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to save nav item");
    }
  }

  async function handleDelete(item: BlogNavItem) {
    const childCount = childrenOf(item.id).length;
    const warn = childCount ? ` and its ${childCount} sub-item(s)` : "";
    if (!confirm(`Delete "${item.label}"${warn}?`)) return;
    try {
      await deleteItem(item.id).unwrap();
      toast.success("Nav item deleted");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to delete nav item");
    }
  }

  async function toggleVisible(item: BlogNavItem) {
    try {
      await updateItem({ id: item.id, data: { isVisible: !item.isVisible } }).unwrap();
    } catch {
      toast.error("Failed to update visibility");
    }
  }

  async function move(list: BlogNavItem[], index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= list.length) return;
    const reordered = [...list];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    try {
      await reorderItems(reordered.map((i) => i.id)).unwrap();
    } catch {
      toast.error("Failed to reorder");
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <SectionCard
        icon={<Menu size={15} color="#1D4ED8" />}
        title="Header Navigation"
        subtitle="Two-layer dropdown menu — top-level items with optional sub-items"
        right={<SecondaryButton label="+ Top-level Item" onClick={() => startCreate()} />}
      >
        {isLoading ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: COLORS.muted, fontSize: 13, padding: 8 }}>
            <Loader2 size={16} style={{ animation: "fm-blogadmin-spin 1s linear infinite" }} />
            Loading nav menu…
          </div>
        ) : topLevel.length === 0 ? (
          <p style={{ fontSize: 12.5, color: COLORS.hint }}>No nav items yet — add "Discover", "Electronics", etc.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {topLevel.map((item, idx) => {
              const children = childrenOf(item.id);
              return (
                <div key={item.id}>
                  <NavRow
                    item={item}
                    onEdit={() => startEdit(item)}
                    onDelete={() => handleDelete(item)}
                    onToggleVisible={() => toggleVisible(item)}
                    onMoveUp={() => move(topLevel, idx, -1)}
                    onMoveDown={() => move(topLevel, idx, 1)}
                    onAddChild={() => startCreate(item.id)}
                    canMoveUp={idx > 0}
                    canMoveDown={idx < topLevel.length - 1}
                  />
                  {children.length > 0 && (
                    <div style={{ marginLeft: 26, marginTop: 6, display: "flex", flexDirection: "column", gap: 6 }}>
                      {children.map((child, cidx) => (
                        <NavRow
                          key={child.id}
                          item={child}
                          isChild
                          onEdit={() => startEdit(child)}
                          onDelete={() => handleDelete(child)}
                          onToggleVisible={() => toggleVisible(child)}
                          onMoveUp={() => move(children, cidx, -1)}
                          onMoveDown={() => move(children, cidx, 1)}
                          canMoveUp={cidx > 0}
                          canMoveDown={cidx < children.length - 1}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      {showForm && (
        <SectionCard icon={<Plus size={15} color="#16A34A" />} title={form.id ? "Edit Nav Item" : "New Nav Item"} badge="required" error={labelError}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <FieldLabel required>Label</FieldLabel>
              <TextInput value={form.label} onChange={(e) => { setForm((f) => ({ ...f, label: e.target.value })); setLabelError(false); }} error={labelError} placeholder="e.g. Electronics" />
              {labelError && <FieldError message="Label is required" />}
            </div>
            <div>
              <FieldLabel hint="Leave blank if this is just a dropdown parent">Link URL</FieldLabel>
              <TextInput value={form.url} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))} placeholder="/category/electronics" />
            </div>
          </div>

          <div style={{ marginTop: 14 }}>
            <FieldLabel hint="Two levels only — a child can't have its own children">Parent Item</FieldLabel>
            <Select value={form.parentId} onChange={(e) => setForm((f) => ({ ...f, parentId: e.target.value }))}>
              <option value="">— Top level —</option>
              {topLevel.filter((i) => i.id !== form.id).map((i) => (
                <option key={i.id} value={i.id}>{i.label}</option>
              ))}
            </Select>
          </div>

          <div style={{ display: "flex", gap: 20, marginTop: 14 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: COLORS.label, fontWeight: 600 }}>
              <input type="checkbox" checked={form.isVisible} onChange={(e) => setForm((f) => ({ ...f, isVisible: e.target.checked }))} />
              Visible on site
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: COLORS.label, fontWeight: 600 }}>
              <input type="checkbox" checked={form.openInNewTab} onChange={(e) => setForm((f) => ({ ...f, openInNewTab: e.target.checked }))} />
              Open in new tab
            </label>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
            <SecondaryButton label="Cancel" onClick={() => { setShowForm(false); setForm(emptyForm); }} />
            <PrimaryButton isLoading={isSaving} onClick={handleSave} label={form.id ? "Update Item" : "Create Item"} />
          </div>
        </SectionCard>
      )}
    </div>
  );
}

function NavRow({
  item, isChild, onEdit, onDelete, onToggleVisible, onMoveUp, onMoveDown, onAddChild, canMoveUp, canMoveDown,
}: {
  item: BlogNavItem; isChild?: boolean; onEdit: () => void; onDelete: () => void; onToggleVisible: () => void;
  onMoveUp: () => void; onMoveDown: () => void; onAddChild?: () => void; canMoveUp: boolean; canMoveDown: boolean;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 12px", borderRadius: 9, border: `1px solid ${COLORS.cardBorder}`, background: isChild ? "#fff" : "#FAFBFD", opacity: item.isVisible ? 1 : 0.55 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: isChild ? 500 : 700, color: COLORS.title }}>{item.label}</span>
        {item.url && <span style={{ fontSize: 10.5, color: COLORS.hint }}>{item.url}</span>}
      </div>
      <div style={{ display: "flex", gap: 5 }}>
        <IconButton title="Move up" onClick={onMoveUp} disabled={!canMoveUp}><ArrowUp size={13} /></IconButton>
        <IconButton title="Move down" onClick={onMoveDown} disabled={!canMoveDown}><ArrowDown size={13} /></IconButton>
        <IconButton title={item.isVisible ? "Hide" : "Show"} onClick={onToggleVisible}>{item.isVisible ? <Eye size={13} /> : <EyeOff size={13} />}</IconButton>
        {onAddChild && <IconButton title="Add sub-item" onClick={onAddChild}><Plus size={13} /></IconButton>}
        <IconButton title="Edit" onClick={onEdit}><Pencil size={13} /></IconButton>
        <IconButton title="Delete" danger onClick={onDelete}><Trash2 size={13} /></IconButton>
      </div>
    </div>
  );
}
