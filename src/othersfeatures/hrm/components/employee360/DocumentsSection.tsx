// src/othersfeatures/hrm/components/employee360/DocumentsSection.tsx
//
// Employee documents on the Employee 360 page: multipart upload through
// the HRM document endpoint (server-side R2 keys), metadata edit,
// verification, and removal.

"use client";

import { useRef, useState } from "react";
import { FileText, BadgeCheck } from "lucide-react";
import { SectionCard, FieldError } from "@/components/ui/section-card";
import { SmallOutlineButton } from "@/components/ui/section-buttons";
import { SimpleFormDialog } from "./SimpleFormDialog";
import type { HrEmployeeDocument } from "../../../../features/hrmApi";

const CATEGORY_OPTIONS = ["IDENTITY", "EDUCATION", "EXPERIENCE", "CONTRACT", "OTHER"].map((c) => ({ value: c, label: c }));

function fileUrl(key?: string | null): string | null {
  if (!key) return null;
  if (/^https?:\/\//i.test(key)) return key;
  const domain = process.env.NEXT_PUBLIC_R2_PUBLIC_DOMAIN;
  return domain ? `${domain.replace(/\/$/, "")}/${key}` : null;
}

export function DocumentsSection({
  employeeId,
  documents,
  canUpload = true,
  canVerify = true,
  canRemove = true,
  onUpload,
  onUpdate,
  onVerify,
  onRemove,
}: {
  employeeId: string;
  documents: HrEmployeeDocument[] | undefined;
  /** PHASE F: mirror the backend docs gates (hrDocsUpload/Verify/Delete). */
  canUpload?: boolean;
  canVerify?: boolean;
  canRemove?: boolean;
  onUpload: (formData: FormData) => Promise<unknown>;
  onUpdate: (id: string, data: Record<string, unknown>) => Promise<unknown>;
  onVerify: (id: string) => Promise<unknown>;
  onRemove: (id: string) => Promise<unknown>;
}) {
  void employeeId;
  const fileRef = useRef<HTMLInputElement>(null);
  const [meta, setMeta] = useState<Record<string, string>>({ category: "IDENTITY", docType: "", title: "" });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editRow, setEditRow] = useState<HrEmployeeDocument | null>(null);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) { setError("Choose a file first."); return; }
    if (!meta.docType || !meta.title) { setError("Document type and title are required."); return; }
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      Object.entries(meta).forEach(([k, v]) => v && fd.append(k, v));
      await onUpload(fd);
      setMeta({ category: "IDENTITY", docType: "", title: "" });
      if (fileRef.current) fileRef.current.value = "";
    } catch (err: any) {
      setError(err?.data?.message || err?.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  const inputCls = "w-full rounded-md border border-gray-300 px-3 py-2 text-sm";

  return (
    <SectionCard
      icon={<FileText size={16} className="text-indigo-600" />}
      title="Documents"
      subtitle="NID, certificates, contracts — PDF or image up to 10 MB"
      badge="optional"
    >
      <FieldError message={error} />

      {/* Upload (hrDocsUpload) */}
      {canUpload && <form onSubmit={handleUpload} className="mb-4 grid grid-cols-2 gap-2 rounded-lg border border-dashed border-gray-300 p-3 sm:grid-cols-5">
        <select className={inputCls} value={meta.category} onChange={(e) => setMeta((m) => ({ ...m, category: e.target.value }))}>
          {CATEGORY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <input className={inputCls} placeholder="Type (NID, Certificate…)" value={meta.docType} onChange={(e) => setMeta((m) => ({ ...m, docType: e.target.value }))} />
        <input className={inputCls} placeholder="Title" value={meta.title} onChange={(e) => setMeta((m) => ({ ...m, title: e.target.value }))} />
        <input ref={fileRef} type="file" accept="image/*,application/pdf" className={`${inputCls} py-1.5`} />
        <button type="submit" disabled={uploading} className="rounded-md bg-indigo-600 px-3 py-2 text-sm text-white disabled:opacity-50">
          {uploading ? "Uploading…" : "Upload"}
        </button>
      </form>}

      {(!documents || documents.length === 0) && <p className="text-sm text-gray-400">No documents uploaded yet.</p>}
      {documents && documents.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead>
              <tr>
                {["Document", "Category", "Number", "Expiry", "Status", ""].map((h) => (
                  <th key={h} className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {documents.map((doc) => {
                const url = fileUrl(doc.fileUrl);
                return (
                  <tr key={doc.id} className="hover:bg-gray-50/60">
                    <td className="px-3 py-2.5">
                      <span className="font-medium text-gray-900">{doc.title}</span>
                      <span className="ml-2 text-xs text-gray-400">{doc.docType}</span>
                    </td>
                    <td className="px-3 py-2.5 text-gray-600">{doc.category}</td>
                    <td className="px-3 py-2.5 text-gray-600">{doc.docNumber || "—"}</td>
                    <td className="px-3 py-2.5 text-gray-600">{doc.expiryDate || "—"}</td>
                    <td className="px-3 py-2.5">
                      {doc.verified ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700">
                          <BadgeCheck size={13} /> Verified
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">Unverified</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right whitespace-nowrap text-xs">
                      {url && (
                        <a href={url} target="_blank" rel="noreferrer" className="mr-3 text-indigo-600 hover:underline">View</a>
                      )}
                      {canVerify && !doc.verified && (
                        <button className="mr-3 text-green-700 hover:underline" onClick={() => onVerify(doc.id)}>Verify</button>
                      )}
                      {canUpload && (
                        <button className="mr-3 text-gray-500 hover:underline" onClick={() => setEditRow(doc)}>Edit</button>
                      )}
                      {canRemove && (
                        <button className="text-red-600 hover:underline" onClick={() => onRemove(doc.id)}>Delete</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {editRow && (
        <SimpleFormDialog
          title="Edit document"
          fields={[
            { name: "title", label: "Title", required: true },
            { name: "docType", label: "Type", required: true },
            { name: "category", label: "Category", type: "select", options: CATEGORY_OPTIONS },
            { name: "docNumber", label: "Document number" },
            { name: "issueDate", label: "Issue date", type: "date" },
            { name: "expiryDate", label: "Expiry date", type: "date" },
            { name: "notes", label: "Notes", type: "textarea" },
          ]}
          initial={editRow}
          loading={false}
          onSave={async (values) => { await onUpdate(editRow.id, values); setEditRow(null); }}
          onClose={() => setEditRow(null)}
        />
      )}
    </SectionCard>
  );
}
