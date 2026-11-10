"use client";
import React, { useRef, useState } from "react";
import { toast } from "sonner";
import { Upload, Loader2, X, ImageIcon } from "lucide-react";
import { useUploadBlogImageMutation } from "@/features/blogApi";
import { COLORS } from "./ui";

// R2 returns a KEY, not a full URL (see blog-module README). Set this
// once for the whole admin app — same convention as the blog site's
// NEXT_PUBLIC_R2_PUBLIC_DOMAIN.
const R2_PUBLIC_DOMAIN = process.env.NEXT_PUBLIC_R2_PUBLIC_DOMAIN || "";

export function resolveBlogImageUrl(key?: string | null): string | undefined {
  if (!key) return undefined;
  if (/^https?:\/\//i.test(key)) return key;
  if (!R2_PUBLIC_DOMAIN) return undefined;
  return `${R2_PUBLIC_DOMAIN.replace(/\/$/, "")}/${key.replace(/^\//, "")}`;
}

/**
 * value / onChange carry the raw R2 KEY (never a full URL) — matches
 * BlogPost.featuredImage / BlogSiteSettings.logoUrl etc.
 */
export function BlogImageUploader({
  value,
  onChange,
  label = "Image",
  aspect = "16 / 9",
  error,
}: {
  value?: string | null;
  onChange: (key: string | null) => void;
  label?: string;
  aspect?: string;
  error?: boolean;
}) {
  const [uploadImage, { isLoading }] = useUploadBlogImageMutation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const previewUrl = resolveBlogImageUrl(value);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must not exceed 5MB");
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await uploadImage(formData).unwrap();
      onChange(res.file.url); // raw R2 key
      toast.success("Image uploaded");
    } catch (err: any) {
      toast.error(err?.data?.message || "Upload failed");
    }
  }

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) handleFile(file);
        }}
        onClick={() => inputRef.current?.click()}
        style={{
          aspectRatio: aspect,
          width: "100%",
          borderRadius: 10,
          border: `1.5px dashed ${error ? COLORS.dangerBorder : isDragging ? "#7C3AED" : COLORS.cardBorder}`,
          background: isDragging ? "#F5F3FF" : "#FAFBFD",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
        />

        {previewUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt={label} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange(null); }}
              style={{
                position: "absolute", top: 8, right: 8, width: 26, height: 26, borderRadius: 999,
                background: "rgba(15,23,42,0.65)", color: "#fff", border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
              title="Remove"
            >
              <X size={13} />
            </button>
          </>
        ) : value && !R2_PUBLIC_DOMAIN ? (
          <div style={{ textAlign: "center", padding: 12 }}>
            <ImageIcon size={20} color={COLORS.hint} />
            <p style={{ fontSize: 10.5, color: COLORS.hint, marginTop: 6 }}>
              Key saved (<code>{value}</code>) — set NEXT_PUBLIC_R2_PUBLIC_DOMAIN to preview
            </p>
          </div>
        ) : isLoading ? (
          <>
            <Loader2 size={20} color="#7C3AED" style={{ animation: "fm-blogadmin-spin 1s linear infinite" }} />
            <p style={{ fontSize: 11, color: COLORS.muted, marginTop: 8 }}>Uploading…</p>
          </>
        ) : (
          <>
            <Upload size={18} color={COLORS.hint} />
            <p style={{ fontSize: 11.5, color: COLORS.muted, marginTop: 8, fontWeight: 600 }}>
              Click or drag an image
            </p>
            <p style={{ fontSize: 10, color: COLORS.hint, marginTop: 2 }}>PNG, JPG, WEBP — up to 5MB</p>
          </>
        )}
      </div>
    </div>
  );
}
