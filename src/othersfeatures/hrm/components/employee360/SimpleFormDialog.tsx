// src/othersfeatures/hrm/components/employee360/SimpleFormDialog.tsx
//
// Declarative add/edit dialog used by every Employee 360 collection
// section (family, education, previous employment, bank/MFS, documents,
// lifecycle) so the dialog scaffolding is written once. Fields drive the
// form; values come back as a flat object.

"use client";

import { useEffect, useState } from "react";

export interface FormFieldDef {
  name: string;
  label: string;
  type?: "text" | "date" | "number" | "select" | "textarea" | "checkbox";
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  hint?: string;
  /** Show this field only when another select field has one of these values. */
  visibleWhen?: { field: string; in: string[] };
}

export function SimpleFormDialog({
  title,
  fields,
  initial,
  submitLabel = "Save",
  loading,
  error,
  onSave,
  onClose,
}: {
  title: string;
  fields: FormFieldDef[];
  /** Existing values in edit mode. */
  initial?: object | null;
  submitLabel?: string;
  loading?: boolean;
  error?: string | null;
  onSave: (values: Record<string, unknown>) => void;
  onClose: () => void;
}) {
  const [values, setValues] = useState<Record<string, string | boolean>>({});

  useEffect(() => {
    const src = (initial ?? {}) as Record<string, unknown>;
    const init: Record<string, string | boolean> = {};
    for (const f of fields) {
      const v = src[f.name];
      init[f.name] = f.type === "checkbox" ? Boolean(v) : v === null || v === undefined ? "" : String(v);
    }
    setValues(init);
     
  }, [initial]);

  const inputCls =
    "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500";

  const isVisible = (f: FormFieldDef) =>
    !f.visibleWhen || f.visibleWhen.in.includes(String(values[f.visibleWhen.field] ?? ""));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const out: Record<string, unknown> = {};
    for (const f of fields) {
      if (!isVisible(f)) continue;
      const raw = values[f.name];
      if (f.type === "checkbox") {
        out[f.name] = Boolean(raw);
        continue;
      }
      const s = String(raw ?? "").trim();
      if (f.type === "number") out[f.name] = s === "" ? undefined : Number(s);
      else out[f.name] = s === "" ? undefined : s;
    }
    onSave(out);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-xl rounded-xl bg-white shadow-xl max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 flex items-center justify-between border-b bg-white p-4">
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <form onSubmit={submit} className="space-y-4 p-4">
          {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {fields.filter(isVisible).map((f) => (
              <div key={f.name} className={f.type === "textarea" ? "sm:col-span-2" : undefined}>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  {f.label}
                  {f.required && <span className="text-red-600"> *</span>}
                </label>
                {f.type === "select" ? (
                  <select
                    className={inputCls}
                    value={String(values[f.name] ?? "")}
                    onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                    required={f.required}
                  >
                    <option value="">— select —</option>
                    {f.options?.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                ) : f.type === "textarea" ? (
                  <textarea
                    rows={2}
                    className={inputCls}
                    value={String(values[f.name] ?? "")}
                    onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                    required={f.required}
                  />
                ) : f.type === "checkbox" ? (
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={Boolean(values[f.name])}
                      onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.checked }))}
                    />
                    {f.hint ?? "Yes"}
                  </label>
                ) : (
                  <input
                    type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
                    className={inputCls}
                    value={String(values[f.name] ?? "")}
                    onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                    required={f.required}
                  />
                )}
                {f.hint && f.type !== "checkbox" && <p className="mt-1 text-xs text-gray-400">{f.hint}</p>}
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2 border-t pt-4">
            <button type="button" onClick={onClose} className="rounded-md border border-gray-300 px-4 py-2 text-sm">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white disabled:opacity-50"
            >
              {loading ? "Saving…" : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
