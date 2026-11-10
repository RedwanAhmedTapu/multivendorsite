"use client";
import React, { useRef, useState, useEffect } from "react";
import { ChevronDown, X } from "lucide-react";
import BrandForm from "./BrandForm";
import type { Brand } from "@/types/brand";

export default function BrandFormCollapse({
  open,
  brand,
  onClose,
  onSuccess,
}: {
  open: boolean;
  brand?: Brand | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | "auto">(0);

  // Animate height on open/close, and re-measure if form content changes size
  useEffect(() => {
    if (!contentRef.current) return;

    if (open) {
      const el = contentRef.current;
      const resize = () => setHeight(el.scrollHeight);
      resize();

      const ro = new ResizeObserver(resize);
      ro.observe(el);
      return () => ro.disconnect();
    } else {
      setHeight(0);
    }
  }, [open, brand]);

  return (
    <div
      style={{
        background: "#fff",
        border: "1.5px solid #E5EAF2",
        borderRadius: 14,
        marginBottom: 14,
        overflow: "hidden",
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      }}
    >
      {/* Header - only shown once open, acts as a labeled bar */}
      {open && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 18px",
            borderBottom: "1px solid #E5EAF2",
            background: "#FAFBFD",
          }}
        >
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#0D1B2E" }}>
              {brand ? "Edit Brand" : "Register a New Brand"}
            </div>
            <div style={{ fontSize: 11.5, color: "#7A90AB", marginTop: 1 }}>
              {brand
                ? "Changes will be sent back for re-approval"
                : "Your brand will be reviewed before it goes live"}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "6px 10px",
              borderRadius: 8,
              border: "1px solid #E5EAF2",
              background: "#fff",
              color: "#64748B",
              fontSize: 11.5,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            <X size={13} /> Close
          </button>
        </div>
      )}

      {/* Animated collapse body */}
      <div
        style={{
          height: typeof height === "number" ? `${height}px` : height,
          transition: "height 240ms ease",
        }}
      >
        <div ref={contentRef} style={{ padding: open ? 20 : 0 }}>
          {open && <BrandForm brand={brand} onSuccess={onSuccess} onCancel={onClose} />}
        </div>
      </div>
    </div>
  );
}