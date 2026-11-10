"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Editor } from "@tinymce/tinymce-react";
import {
  Image as ImageIcon,
  Upload,
  LayoutGrid,
  X,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useUploadFileMutation } from "@/features/vendorManageApi";
import MediaCenter, {
  type MediaCenterItem,
} from "../mediauploader/MediaCenter";
import { LAYOUT_META, type BlockType } from "./LayoutTemplateModal";

// ─── Data shape filled in by the vendor for the chosen layout ─────────────────
//
// NOTE: `text` now holds FORMATTED HTML (bold/italic/underline/color/align/
// links/lists), produced by the RichTextField below — not plain text. It's
// inserted as-is by buildLayoutHtml, so don't re-escape or nl2br() it.

export interface LayoutData {
  heading?: string;
  text?: string;
  images?: string[];
}

const IMAGE_SLOTS: Record<BlockType, number> = {
  heading: 0,
  text: 0,
  quote: 0,
  image: 1,
  "two-images": 2,
  gallery: 3,
  "image-text-left": 1,
  "image-text-right": 1,
  "image-top-text-bottom": 1,
  raw: 0,
};

// Layout types whose "text" field should show the rich text toolbar.
const RICH_TEXT_TYPES = new Set<BlockType>([
  "text",
  "quote",
  "image-text-left",
  "image-text-right",
  "image-top-text-bottom",
]);

function emptyData(type: BlockType): LayoutData {
  const slots = IMAGE_SLOTS[type] || 0;
  return {
    heading: type === "heading" ? "" : undefined,
    text: [
      "text",
      "quote",
      "image-text-left",
      "image-text-right",
      "image-top-text-bottom",
    ].includes(type)
      ? ""
      : undefined,
    images: slots > 0 ? Array(slots).fill("") : undefined,
  };
}

/** Strips tags/&nbsp; so a "formatted but empty" block (e.g. just `<p></p>`)
 *  still counts as empty for the completeness check below. */
function stripHtml(html?: string): string {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();
}

function isLayoutComplete(type: BlockType, data: LayoutData): boolean {
  switch (type) {
    case "heading":
      return !!data.heading?.trim();
    case "text":
    case "quote":
      return !!stripHtml(data.text);
    case "image":
      return !!data.images?.[0];
    case "two-images":
      return !!data.images?.[0] && !!data.images?.[1];
    case "gallery":
      return !!data.images?.[0] && !!data.images?.[1] && !!data.images?.[2];
    case "image-text-left":
    case "image-text-right":
    case "image-top-text-bottom":
      return !!data.images?.[0] && !!stripHtml(data.text);
    default:
      return false;
  }
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function genId() {
  return `blk_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// Wrapped in a `.desc-block` container so the editor can recognize, move,
// duplicate, and delete it as a unit once it's pasted in.
function wrap(type: BlockType, inner: string) {
  return `<div class="desc-block" data-block-id="${genId()}" data-block-type="${type}">${inner}</div>`;
}

export function buildLayoutHtml(type: BlockType, data: LayoutData): string {
  // `data.text` is already-formatted HTML from the rich text field — insert
  // it directly, don't escape/nl2br it.
  switch (type) {
    case "heading":
      return wrap(
        type,
        `<h2 style="font-weight:700;margin:16px 0 8px;">${escapeHtml(data.heading || "")}</h2>`,
      );
    case "text":
      return wrap(
        type,
        `<div style="margin:0 0 12px;line-height:1.6;">${data.text || ""}</div>`,
      );
    case "quote":
      return wrap(
        type,
        `<blockquote style="margin:12px 0;padding:10px 16px;border-left:3px solid #00ACC1;font-style:italic;">${
          data.text || ""
        }</blockquote>`,
      );
    case "image":
      return wrap(
        type,
        `<figure style="margin:12px 0;"><img src="${data.images?.[0]}" style="max-width:100%;border-radius:8px;display:block;" /></figure>`,
      );
    case "two-images":
      return wrap(
        type,
        `<div style="display:flex;gap:10px;margin:12px 0;">${(data.images || [])
          .slice(0, 2)
          .map(
            (u) =>
              `<img src="${u}" style="flex:1;width:50%;border-radius:8px;object-fit:cover;" />`,
          )
          .join("")}</div>`,
      );
    case "gallery":
      return wrap(
        type,
        `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:12px 0;">${(
          data.images || []
        )
          .slice(0, 3)
          .map(
            (u) =>
              `<img src="${u}" style="width:100%;border-radius:8px;object-fit:cover;" />`,
          )
          .join("")}</div>`,
      );
    case "image-text-left":
      return wrap(
        type,
        `<div style="display:flex;gap:16px;margin:12px 0;align-items:center;"><img src="${
          data.images?.[0]
        }" style="flex:1;width:50%;border-radius:8px;object-fit:cover;" /><div style="flex:1;line-height:1.6;">${
          data.text || ""
        }</div></div>`,
      );
    case "image-text-right":
      return wrap(
        type,
        `<div style="display:flex;gap:16px;margin:12px 0;align-items:center;"><div style="flex:1;line-height:1.6;">${
          data.text || ""
        }</div><img src="${data.images?.[0]}" style="flex:1;width:50%;border-radius:8px;object-fit:cover;" /></div>`,
      );
    case "image-top-text-bottom":
      return wrap(
        type,
        `<div style="margin:12px 0;"><img src="${
          data.images?.[0]
        }" style="width:100%;border-radius:8px;object-fit:cover;margin-bottom:8px;" /><div style="line-height:1.6;">${
          data.text || ""
        }</div></div>`,
      );
    default:
      return "";
  }
}

// ─── RichTextField — a compact, boxed formatting field for any block's text.
// Built on the same TinyMCE already used for the main description editor, but
// stripped down to just the marks vendors need inside a small layout block:
// bold/italic/underline/strikethrough, color, alignment, lists, and links. ──

function RichTextField({
  value,
  onChange,
  placeholder,
  minHeight = 150,
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}) {
  return (
    <div
      style={{
        border: "1.5px solid #D6E2F5",
        borderRadius: 8,
        overflow: "hidden",
      }}
    >
      <Editor
        apiKey="b2zz2r7lny7pux1l4rgi2lsrelk385g581lyx6ohka861z6u"
        value={value}
        onEditorChange={(newValue) => onChange(newValue)}
        init={{
          height: minHeight,
          menubar: false,
          statusbar: false,
          branding: false,
          promotion: false,
          plugins: ["lists", "link", "autolink"],
          toolbar:
            "bold italic underline strikethrough | forecolor backcolor | " +
            "alignleft aligncenter alignright | bullist numlist | link removeformat",
          placeholder,
          content_style:
            "body { font-family:'Plus Jakarta Sans', system-ui, sans-serif; font-size:12.5px; color:#0D1B2E; }",
        }}
      />
    </div>
  );
}

// ─── ImageSlot — upload a file OR pick one from the Media Center ──────────────

function ImageSlot({
  url,
  uploading,
  onUpload,
  onPickMediaCenter,
  onRemove,
  height = 130,
}: {
  url?: string;
  uploading: boolean;
  onUpload: (file: File) => void;
  onPickMediaCenter: () => void;
  onRemove: () => void;
  height?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  if (url) {
    return (
      <div
        style={{
          position: "relative",
          borderRadius: 8,
          overflow: "hidden",
          border: "1.5px solid #D6E2F5",
          height,
          background: "#F5F8FF",
        }}
      >
        <img
          src={url}
          alt=""
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        <button
          type="button"
          onClick={onRemove}
          title="Remove image"
          style={{
            position: "absolute",
            top: 6,
            right: 6,
            background: "#D32F2F",
            border: "none",
            borderRadius: "50%",
            width: 20,
            height: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <X size={11} color="#fff" />
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        border: "1.5px dashed #BDD0EE",
        borderRadius: 8,
        height,
        background: "#F5F8FF",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        padding: 8,
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onUpload(f);
          e.target.value = "";
        }}
      />
      {uploading ? (
        <>
          <div
            style={{
              width: 20,
              height: 20,
              border: "2.5px solid #1565C0",
              borderTopColor: "transparent",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <span style={{ fontSize: 10, color: "#1565C0", fontWeight: 600 }}>
            Uploading…
          </span>
        </>
      ) : (
        <>
          <ImageIcon size={16} color="#7A90AB" />
          <div
            style={{
              display: "flex",
              gap: 6,
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "#1565C0",
                background: "#fff",
                border: "1px solid #BDD0EE",
                borderRadius: 6,
                padding: "3px 6px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 3,
              }}
            >
              <Upload size={10} /> Upload
            </button>
            <button
              type="button"
              onClick={onPickMediaCenter}
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "#1565C0",
                background: "#fff",
                border: "1px solid #BDD0EE",
                borderRadius: 6,
                padding: "3px 6px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 3,
              }}
            >
              <LayoutGrid size={10} /> Media Center
            </button>
          </div>
        </>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Main builder modal ─────────────────────────────────────────────────────

interface LayoutBuilderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: BlockType | null;
  onInsert: (html: string) => void;
}

export default function LayoutBuilderModal({
  open,
  onOpenChange,
  type,
  onInsert,
}: LayoutBuilderModalProps) {
  const [data, setData] = useState<LayoutData>({});
  const [uploadingSlots, setUploadingSlots] = useState<Set<number>>(new Set());
  const [mediaCenterOpen, setMediaCenterOpen] = useState(false);
  // Refs (not state) on purpose: the outside-interaction guard and the select
  // handler both run in the middle of Radix/MediaCenter event dispatch, before
  // React has re-rendered with fresh state, so they must read live values.
  const mediaCenterOpenRef = useRef(false);
  const mediaSlotRef = useRef<number | null>(null);
  const mediaCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [uploadFile] = useUploadFileMutation();

  // Reset the form whenever a new layout type is opened
  useEffect(() => {
    if (open && type) {
      setData(emptyData(type));
      setUploadingSlots(new Set());
    }
  }, [open, type]);

  if (!type) return null;
  const meta = LAYOUT_META.find((l) => l.type === type);
  const complete = isLayoutComplete(type, data);
  const isRichText = RICH_TEXT_TYPES.has(type);

  const setImageAt = (index: number, url: string) => {
    setData((prev) => {
      const images = prev.images ? [...prev.images] : [];
      images[index] = url;
      return { ...prev, images };
    });
  };

  const uploadImageAt = async (index: number, file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error(`${file.name} exceeds 5MB.`);
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error(`${file.name} is not an image.`);
      return;
    }
    setUploadingSlots((prev) => new Set(prev).add(index));
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res: any = await uploadFile(formData).unwrap();
      const url = res?.file?.url;
      if (!res?.success || !url) throw new Error("Upload failed");
      setImageAt(index, url);
    } catch (err: any) {
      toast.error(err?.message || "Image upload failed");
    } finally {
      setUploadingSlots((prev) => {
        const next = new Set(prev);
        next.delete(index);
        return next;
      });
    }
  };

  const handleMediaCenterOpenChange = (o: boolean) => {
    setMediaCenterOpen(o);
    if (mediaCloseTimerRef.current) {
      clearTimeout(mediaCloseTimerRef.current);
      mediaCloseTimerRef.current = null;
    }
    if (o) {
      mediaCenterOpenRef.current = true;
    } else {
      // Keep ignoring trailing "outside" events (focus being handed back, the
      // click that just closed the picker) for a moment after it closes.
      mediaCloseTimerRef.current = setTimeout(() => {
        mediaCenterOpenRef.current = false;
      }, 300);
    }
  };

  const openMediaCenterAt = (index: number) => {
    mediaSlotRef.current = index;
    handleMediaCenterOpenChange(true);
  };

  const handleMediaCenterSelect = (items: MediaCenterItem[]) => {
    const item = items[0];
    const slot = mediaSlotRef.current;
    if (!item || slot === null) return;
    setImageAt(slot, item.url);
    mediaSlotRef.current = null;
  };

  // This builder dialog is non-modal, so Radix treats anything that happens
  // outside its DOM as an "outside interaction" and dismisses it. Two things
  // live outside it on purpose: TinyMCE's popups (.tox) and the Media Center
  // dialog. Without this guard the builder was closing the moment the Media
  // Center took focus — so the picked image was written into a builder the
  // user could no longer see (and the form reset on the next open).
  const ignoreOutsideInteraction = (e: Event) => {
    if (mediaCenterOpenRef.current) return true;
    const target = e.target as HTMLElement | null;
    return !!target?.closest?.(".tox");
  };

  const slotCount = IMAGE_SLOTS[type] || 0;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange} modal={false}>
        <DialogContent
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => {
            if (ignoreOutsideInteraction(e)) e.preventDefault();
          }}
          onFocusOutside={(e) => {
            if (ignoreOutsideInteraction(e)) e.preventDefault();
          }}
          onInteractOutside={(e) => {
            if (ignoreOutsideInteraction(e)) e.preventDefault();
          }}
          style={{
            maxWidth: 560,
            maxHeight: "85vh",
            overflowY: "auto",
            fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
          }}
        >
          <DialogHeader>
            <DialogTitle
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: "#0D1B2E",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              {meta && <meta.icon size={16} color="#1565C0" />}
              {meta?.label || "Layout"}
            </DialogTitle>
          </DialogHeader>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {type === "heading" && (
              <div>
                <label
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#3D5068",
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  Heading text
                </label>
                <Input
                  value={data.heading || ""}
                  onChange={(e) =>
                    setData((p) => ({ ...p, heading: e.target.value }))
                  }
                  placeholder="e.g. Why you'll love this product"
                  style={{ fontSize: 13 }}
                />
              </div>
            )}

            {(type === "text" || type === "quote") && (
              <div>
                <label
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#3D5068",
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  {type === "quote" ? "Quote / callout text" : "Paragraph text"}
                </label>
                <RichTextField
                  value={data.text || ""}
                  onChange={(html) => setData((p) => ({ ...p, text: html }))}
                  placeholder={
                    type === "quote"
                      ? "Write your quote or callout…"
                      : "Write here…"
                  }
                  minHeight={160}
                />
                <p style={{ fontSize: 10, color: "#9BAABB", marginTop: 5 }}>
                  Use the toolbar to bold, italicize, color, align, or link
                  parts of the text.
                </p>
              </div>
            )}

            {(type === "image" ||
              type === "two-images" ||
              type === "gallery") && (
              <div>
                <label
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#3D5068",
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  {slotCount > 1 ? `Images (${slotCount})` : "Image"}
                </label>
                <div style={{ display: "flex", gap: 10 }}>
                  {Array.from({ length: slotCount }).map((_, i) => (
                    <div key={i} style={{ flex: 1 }}>
                      <ImageSlot
                        url={data.images?.[i]}
                        uploading={uploadingSlots.has(i)}
                        onUpload={(f) => uploadImageAt(i, f)}
                        onPickMediaCenter={() => openMediaCenterAt(i)}
                        onRemove={() => setImageAt(i, "")}
                        height={slotCount === 1 ? 170 : 120}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(type === "image-text-left" ||
              type === "image-text-right" ||
              type === "image-top-text-bottom") && (
              <>
                <div>
                  <label
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#3D5068",
                      display: "block",
                      marginBottom: 6,
                    }}
                  >
                    Image
                  </label>
                  <ImageSlot
                    url={data.images?.[0]}
                    uploading={uploadingSlots.has(0)}
                    onUpload={(f) => uploadImageAt(0, f)}
                    onPickMediaCenter={() => openMediaCenterAt(0)}
                    onRemove={() => setImageAt(0, "")}
                    height={150}
                  />
                </div>
                <div>
                  <label
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#3D5068",
                      display: "block",
                      marginBottom: 6,
                    }}
                  >
                    {type === "image-top-text-bottom" ? "Caption text" : "Text"}
                  </label>
                  <RichTextField
                    value={data.text || ""}
                    onChange={(html) => setData((p) => ({ ...p, text: html }))}
                    placeholder="Describe this image…"
                    minHeight={140}
                  />
                  <p style={{ fontSize: 10, color: "#9BAABB", marginTop: 5 }}>
                    Use the toolbar to bold, italicize, color, align, or link
                    parts of the text.
                  </p>
                </div>
              </>
            )}

            {!complete && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 11,
                  color: "#E65100",
                  background: "#FFF3E0",
                  border: "1px solid #FFCC80",
                  borderRadius: 6,
                  padding: "6px 8px",
                }}
              >
                <AlertCircle size={12} />
                Fill in all fields above before pasting this layout into the
                description.
              </div>
            )}
          </div>

          <DialogFooter style={{ marginTop: 6 }}>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!complete}
              onClick={() => {
                onInsert(buildLayoutHtml(type, data));
                onOpenChange(false);
              }}
              style={{
                background: "#1565C0",
                color: "#fff",
                border: "none",
                opacity: complete ? 1 : 0.5,
              }}
            >
              Paste into Description
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MediaCenter
        open={mediaCenterOpen}
        onOpenChange={handleMediaCenterOpenChange}
        fileType="IMAGE"
        multiple={false}
        onSelect={handleMediaCenterSelect}
        title="Choose Image"
        description="Select an image already in your media."
      />
    </>
  );
}