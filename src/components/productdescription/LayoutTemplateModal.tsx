"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Heading as HeadingIcon,
  AlignLeft,
  Quote as QuoteIcon,
  Image as ImageIcon,
  Columns,
  LayoutGrid,
  Rows,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type BlockType =
  | "heading"
  | "text"
  | "quote"
  | "image"
  | "two-images"
  | "gallery"
  | "image-text-left"
  | "image-text-right"
  | "image-top-text-bottom"
  | "raw";

export interface DescriptionBlock {
  id: string;
  type: BlockType;
  heading?: string;
  text?: string;
  images?: string[];
  html?: string; // only used by "raw" (legacy imported content)
}

interface LayoutMeta {
  type: BlockType;
  label: string;
  description: string;
  category: "Text" | "Image" | "Image + Text";
  icon: any;
  preview: () => React.ReactNode;
}

// ─── Tiny schematic previews (no real images, just placeholder shapes) ────────

const box = (flex: number | string = 1, h: number | string = "100%") => (
  <div style={{ flex, height: h, background: "#D6E2F5", borderRadius: 4 }} />
);

const lines = (count = 3) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      gap: 4,
      justifyContent: "center",
      flex: 1,
      height: "100%",
    }}
  >
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        style={{
          height: 5,
          borderRadius: 2,
          background: "#BDD0EE",
          width: i === count - 1 ? "60%" : "100%",
        }}
      />
    ))}
  </div>
);

// ─── Layout catalogue ───────────────────────────────────────────────────────

export const LAYOUT_META: LayoutMeta[] = [
  {
    type: "heading",
    label: "Heading",
    description: "A bold section title",
    category: "Text",
    icon: HeadingIcon,
    preview: () => (
      <div style={{ display: "flex", alignItems: "center", height: "100%" }}>
        <div style={{ height: 9, width: "70%", borderRadius: 2, background: "#1565C0" }} />
      </div>
    ),
  },
  {
    type: "text",
    label: "Paragraph",
    description: "Plain text paragraph",
    category: "Text",
    icon: AlignLeft,
    preview: () => lines(4),
  },
  {
    type: "quote",
    label: "Quote",
    description: "Highlighted quote or callout",
    category: "Text",
    icon: QuoteIcon,
    preview: () => (
      <div style={{ display: "flex", height: "100%", gap: 6 }}>
        <div style={{ width: 3, background: "#00ACC1", borderRadius: 2 }} />
        {lines(3)}
      </div>
    ),
  },
  {
    type: "image",
    label: "Single Image",
    description: "One full-width image",
    category: "Image",
    icon: ImageIcon,
    preview: () => <div style={{ display: "flex", height: "100%" }}>{box()}</div>,
  },
  {
    type: "two-images",
    label: "Two Images",
    description: "Two images side by side",
    category: "Image",
    icon: Columns,
    preview: () => (
      <div style={{ display: "flex", height: "100%", gap: 6 }}>
        {box()}
        {box()}
      </div>
    ),
  },
  {
    type: "gallery",
    label: "Image Gallery",
    description: "A grid of three images",
    category: "Image",
    icon: LayoutGrid,
    preview: () => (
      <div style={{ display: "flex", height: "100%", gap: 6 }}>
        {box()}
        {box()}
        {box()}
      </div>
    ),
  },
  {
    type: "image-text-left",
    label: "Image Left + Text",
    description: "Image on the left, text on the right",
    category: "Image + Text",
    icon: Columns,
    preview: () => (
      <div style={{ display: "flex", height: "100%", gap: 6 }}>
        {box()}
        {lines(3)}
      </div>
    ),
  },
  {
    type: "image-text-right",
    label: "Text + Image Right",
    description: "Text on the left, image on the right",
    category: "Image + Text",
    icon: Columns,
    preview: () => (
      <div style={{ display: "flex", height: "100%", gap: 6 }}>
        {lines(3)}
        {box()}
      </div>
    ),
  },
  {
    type: "image-top-text-bottom",
    label: "Image Above Text",
    description: "Image on top, caption text below",
    category: "Image + Text",
    icon: Rows,
    preview: () => (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 4 }}>
        {box(1, "60%")}
        {lines(2)}
      </div>
    ),
  },
];

const CATEGORIES: LayoutMeta["category"][] = ["Text", "Image", "Image + Text"];

// ─── Component ────────────────────────────────────────────────────────────────

interface LayoutTemplateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (type: BlockType) => void;
}

export default function LayoutTemplateModal({
  open,
  onOpenChange,
  onSelect,
}: LayoutTemplateModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        style={{
          maxWidth: 780,
          maxHeight: "85vh",
          overflowY: "auto",
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        }}
      >
        <DialogHeader>
          <DialogTitle style={{ fontSize: 15, fontWeight: 700, color: "#0D1B2E" }}>
            Choose a Layout
          </DialogTitle>
        </DialogHeader>

        {CATEGORIES.map((cat) => (
          <div key={cat} style={{ marginBottom: 18 }}>
            <div
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                color: "#7A90AB",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: 8,
              }}
            >
              {cat}
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                gap: 10,
              }}
            >
              {LAYOUT_META.filter((l) => l.category === cat).map((layout) => (
                <button
                  key={layout.type}
                  type="button"
                  onClick={() => {
                    onSelect(layout.type);
                    onOpenChange(false);
                  }}
                  style={{
                    textAlign: "left",
                    border: "1.5px solid #D6E2F5",
                    borderRadius: 10,
                    padding: 10,
                    background: "#fff",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "#1565C0";
                    (e.currentTarget as HTMLElement).style.background = "#F5F8FF";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "#D6E2F5";
                    (e.currentTarget as HTMLElement).style.background = "#fff";
                  }}
                >
                  <div
                    style={{
                      height: 56,
                      background: "#F5F8FF",
                      border: "1px solid #EAF0FB",
                      borderRadius: 6,
                      padding: 8,
                    }}
                  >
                    {layout.preview()}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <layout.icon size={13} color="#1565C0" />
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#0D1B2E" }}>
                      {layout.label}
                    </span>
                  </div>
                  <div style={{ fontSize: 10.5, color: "#7A90AB" }}>{layout.description}</div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </DialogContent>
    </Dialog>
  );
}