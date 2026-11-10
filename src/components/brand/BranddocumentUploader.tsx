"use client";
import React, { useCallback, useRef, useState } from "react";
import { UploadCloud, FileCheck2, X, Loader2, Eye } from "lucide-react";
import {
  useUploadBrandDocumentMutation,
  useDeleteBrandDocumentMutation,
} from "@/features/brandApi";
import { toast } from "sonner";

const R2_DOMAIN = process.env.NEXT_PUBLIC_R2_PUBLIC_DOMAIN as string;

function getPublicUrl(key: string): string {
  return `${R2_DOMAIN}/${key}`;
}

// Reverse of getPublicUrl — needed so we can delete a document that was
// already uploaded in a previous session (edit mode), where all we're
// handed back is the public `value` URL, not the raw R2 key.
function getKeyFromUrl(url: string): string | null {
  if (!R2_DOMAIN || !url.startsWith(R2_DOMAIN)) return null;
  return url.slice(R2_DOMAIN.length).replace(/^\/+/, "");
}

export default function BrandDocumentUploader({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [documentKey, setDocumentKey] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const [uploadDocument, { isLoading: isUploading }] =
    useUploadBrandDocumentMutation();
  const [deleteDocument, { isLoading: isDeleting }] =
    useDeleteBrandDocumentMutation();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      const allowed = [".jpg", ".jpeg", ".png", ".webp", ".pdf"];
      const ext = "." + file.name.split(".").pop()?.toLowerCase();
      if (!allowed.includes(ext)) {
        toast.error("Invalid file type", {
          description: "Only JPG, PNG, WEBP, and PDF files are allowed.",
        });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File too large", {
          description: "Maximum file size is 5 MB.",
        });
        return;
      }

      const formData = new FormData();
      formData.append("document", file);
      try {
        const result = await uploadDocument(formData).unwrap();
        const key = result.key;
        const publicUrl = getPublicUrl(key);
        onChange(publicUrl);
        setPreviewUrl(publicUrl);
        setDocumentKey(key);

        // Only show image preview for non-PDF files
        const isImage = /\.(jpe?g|png|webp)$/i.test(key);
        setShowPreview(isImage);

        toast.success("Document uploaded successfully");
      } catch (err: any) {
        toast.error(
          err?.data?.message || err?.message || "Failed to upload document"
        );
      }
    },
    [uploadDocument, onChange]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  // Derive the key to delete: prefer the key we captured at upload time
  // (fresh upload this session); fall back to reconstructing it from the
  // existing `value` URL (editing a brand that already has a document).
  const resolveKeyToDelete = useCallback((): string | null => {
    if (documentKey) return documentKey;
    if (value) return getKeyFromUrl(value);
    return null;
  }, [documentKey, value]);

  const handleRemove = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();

      const key = resolveKeyToDelete();

      // No resolvable key (e.g. domain mismatch) — just clear local state
      // rather than blocking the user from re-uploading.
      if (!key) {
        onChange(null);
        setPreviewUrl(null);
        setDocumentKey(null);
        setShowPreview(false);
        if (inputRef.current) inputRef.current.value = "";
        return;
      }

      try {
        await deleteDocument({ key }).unwrap();
        toast.success("Document removed");
      } catch (err: any) {
        toast.error(
          err?.data?.message || err?.message || "Failed to delete document"
        );
        return; // keep the current document if the delete actually failed
      }

      onChange(null);
      setPreviewUrl(null);
      setDocumentKey(null);
      setShowPreview(false);
      if (inputRef.current) inputRef.current.value = "";
    },
    [deleteDocument, onChange, resolveKeyToDelete]
  );

  // If value exists but previewUrl doesn't (e.g. editing an existing brand), derive it
  const displayPreview = previewUrl || (value ? value : null);
  const isImagePreview =
    displayPreview && /\.(jpe?g|png|webp)(\?.*)?$/i.test(displayPreview);
  const isBusy = isUploading || isDeleting;

  return (
    <>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.1fr 1fr",
          gap: 18,
        }}
        className="brand-doc-grid"
      >
        {/* Upload dropzone */}
        <div>
          <p
            style={{
              fontSize: 12.5,
              fontWeight: 700,
              color: "#3D5068",
              marginBottom: 8,
              textAlign: "center",
            }}
          >
            Upload Authentication Document
          </p>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              if (!isBusy) setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              if (isBusy) {
                e.preventDefault();
                return;
              }
              onDrop(e);
            }}
            onClick={() => {
              if (!isBusy) inputRef.current?.click();
            }}
            style={{
              border: `1.5px dashed ${
                isDragging ? "#1D4ED8" : displayPreview ? "#16A34A" : "#CBD5E1"
              }`,
              borderRadius: 12,
              background: isDragging
                ? "#EFF6FF"
                : displayPreview
                ? "#F0FDF4"
                : "#FAFBFD",
              padding: "28px 16px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              cursor: isBusy ? "not-allowed" : "pointer",
              minHeight: 160,
              transition: "all 0.2s ease",
              textAlign: "center",
              opacity: isBusy && !isUploading ? 0.7 : 1,
            }}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.pdf"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
                e.target.value = "";
              }}
              disabled={isBusy}
            />

            {isUploading ? (
              <>
                <Loader2
                  size={26}
                  color="#1D4ED8"
                  style={{ animation: "spin 1s linear infinite" }}
                />
                <span
                  style={{
                    fontSize: 12,
                    color: "#64748B",
                    fontWeight: 600,
                  }}
                >
                  Uploading…
                </span>
              </>
            ) : displayPreview ? (
              <>
                {isImagePreview ? (
                  <div
                    style={{
                      width: 64,
                      height: 48,
                      borderRadius: 8,
                      overflow: "hidden",
                      border: "1.5px solid #BBF7D0",
                      background: "#fff",
                      position: "relative",
                    }}
                  >
                    <img
                      src={displayPreview}
                      alt="Uploaded document"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </div>
                ) : (
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 10,
                      background: "#F0FDF4",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <FileCheck2 size={22} color="#16A34A" />
                  </div>
                )}
                <span
                  style={{
                    fontSize: 12,
                    color: "#15803D",
                    fontWeight: 700,
                  }}
                >
                  Document uploaded
                </span>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  {isImagePreview && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowPreview(true);
                      }}
                      disabled={isBusy}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        fontSize: 11,
                        fontWeight: 600,
                        color: "#1D4ED8",
                        background: "none",
                        border: "none",
                        cursor: isBusy ? "not-allowed" : "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      <Eye size={11} /> Preview
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleRemove}
                    disabled={isBusy}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 11,
                      fontWeight: 600,
                      color: isBusy ? "#F3A5A5" : "#DC2626",
                      background: "none",
                      border: "none",
                      cursor: isBusy ? "not-allowed" : "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    {isDeleting ? (
                      <>
                        <Loader2
                          size={11}
                          style={{ animation: "spin 1s linear infinite" }}
                        />
                        Removing…
                      </>
                    ) : (
                      <>
                        <X size={11} /> Remove & re-upload
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 10,
                    background: "#EEF3FB",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <UploadCloud size={22} color="#1D4ED8" />
                </div>
                <span
                  style={{
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: "#3D5068",
                  }}
                >
                  Drag or Click to Upload
                </span>
                <span style={{ fontSize: 10.5, color: "#9BAABB" }}>
                  JPG, PNG or PDF — up to 5MB
                </span>
              </>
            )}
          </div>
        </div>

        {/* Tips panel */}
        <div
          style={{
            background: "#F8FAFC",
            border: "1px solid #E2E8F0",
            borderRadius: 12,
            padding: "14px 16px",
            fontSize: 11.5,
            color: "#475569",
            lineHeight: 1.6,
          }}
        >
          <p
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "#1E293B",
              marginBottom: 6,
            }}
          >
            Tips for a faster approval
          </p>
          <ul
            style={{
              paddingLeft: 16,
              margin: 0,
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            <li>
              Use the exact brand name you're registering — no abbreviations.
            </li>
            <li>
              Make sure the document is sharp, well-lit, and fully legible.
            </li>
            <li>
              Include proof of the brand's presence elsewhere (official website,
              social media, or another marketplace listing).
            </li>
            <li>Avoid cropped, blurry, or watermarked screenshots.</li>
          </ul>
        </div>

        <style>{`
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
          @media (max-width: 720px) {
            .brand-doc-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </div>

      {/* ── Full-size image preview overlay ── */}
      {showPreview && displayPreview && (
        <div
          onClick={() => setShowPreview(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            cursor: "pointer",
            animation: "fadeIn 0.2s ease",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "relative",
              maxWidth: "90vw",
              maxHeight: "85vh",
              background: "#fff",
              borderRadius: 14,
              overflow: "hidden",
              boxShadow: "0 24px 80px rgba(0,0,0,0.4)",
              animation: "scaleIn 0.25s cubic-bezier(0.16,1,0.3,1)",
            }}
          >
            <img
              src={displayPreview}
              alt="Document preview"
              style={{
                display: "block",
                maxWidth: "90vw",
                maxHeight: "85vh",
                objectFit: "contain",
              }}
            />
            <button
              onClick={() => setShowPreview(false)}
              style={{
                position: "absolute",
                top: 10,
                right: 10,
                width: 32,
                height: 32,
                borderRadius: 8,
                border: "none",
                background: "rgba(0,0,0,0.5)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              <X size={16} />
            </button>
          </div>

          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes scaleIn {
              from { transform: scale(0.92); opacity: 0; }
              to { transform: scale(1); opacity: 1; }
            }
          `}</style>
        </div>
      )}
    </>
  );
}