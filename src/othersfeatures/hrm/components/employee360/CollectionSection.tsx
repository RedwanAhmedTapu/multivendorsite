// src/othersfeatures/hrm/components/employee360/CollectionSection.tsx
//
// Generic ProductForm-styled collection section (table + add/edit dialog)
// used for Family, Education and Previous Employment. One implementation —
// the sections only differ by field/column definitions.

"use client";

import { useState } from "react";
import { Trash2, Pencil } from "lucide-react";
import { SectionCard, FieldError } from "@/components/ui/section-card";
import { SmallOutlineButton } from "@/components/ui/section-buttons";
import { SimpleFormDialog, type FormFieldDef } from "./SimpleFormDialog";

export interface CollectionColumn<T> {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
}

export function CollectionSection<T extends { id: string }>({
  title,
  icon,
  subtitle,
  badge,
  items,
  columns,
  fields,
  emptyText = "Nothing added yet.",
  canEdit = true,
  onAdd,
  onUpdate,
  onRemove,
}: {
  title: string;
  icon: React.ReactNode;
  subtitle?: string;
  badge?: "required" | "optional";
  items: T[] | undefined;
  columns: CollectionColumn<T>[];
  fields: FormFieldDef[];
  emptyText?: string;
  /** PHASE F: hide Add/Edit/Remove when the user lacks the capability. */
  canEdit?: boolean;
  onAdd: (values: Record<string, unknown>) => Promise<unknown>;
  onUpdate: (id: string, values: Record<string, unknown>) => Promise<unknown>;
  onRemove: (id: string) => Promise<unknown>;
}) {
  const [dialog, setDialog] = useState<{ mode: "add" | "edit"; row?: T } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(values: Record<string, unknown>) {
    if (!dialog) return;
    setBusy(true);
    setError(null);
    try {
      if (dialog.mode === "add") await onAdd(values);
      else await onUpdate(dialog.row!.id, values);
      setDialog(null);
    } catch (err: any) {
      setError(err?.data?.message || err?.message || "Failed to save.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setError(null);
    try {
      await onRemove(id);
    } catch (err: any) {
      setError(err?.data?.message || err?.message || "Failed to remove.");
    }
  }

  return (
    <SectionCard
      icon={icon}
      title={title}
      subtitle={subtitle}
      badge={badge}
      actions={
        canEdit ? (
          <SmallOutlineButton onClick={() => { setError(null); setDialog({ mode: "add" }); }}>+ Add</SmallOutlineButton>
        ) : undefined
      }
    >
      <FieldError message={error} />
      {(!items || items.length === 0) && (
        <p className="text-sm text-gray-400">{emptyText}</p>
      )}
      {items && items.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead>
              <tr>
                {columns.map((c) => (
                  <th key={c.key} className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                    {c.label}
                  </th>
                ))}
                {canEdit && <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {items.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50/60">
                  {columns.map((c) => (
                    <td key={c.key} className="px-3 py-2.5 text-gray-700">
                      {c.render ? c.render(row) : String((row as any)[c.key] ?? "—")}
                    </td>
                  ))}
                  {canEdit && (
                    <td className="px-3 py-2.5 text-right whitespace-nowrap">
                      <button
                        className="mr-3 text-gray-400 hover:text-indigo-600"
                        title="Edit"
                        onClick={() => { setError(null); setDialog({ mode: "edit", row }); }}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        className="text-gray-400 hover:text-red-600"
                        title="Remove"
                        onClick={() => remove(row.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {dialog && (
        <SimpleFormDialog
          title={dialog.mode === "add" ? `Add ${title.replace(/s$/, "")}` : `Edit ${title.replace(/s$/, "")}`}
          fields={fields}
          initial={dialog.row ?? null}
          loading={busy}
          error={error}
          onSave={save}
          onClose={() => setDialog(null)}
        />
      )}
    </SectionCard>
  );
}
