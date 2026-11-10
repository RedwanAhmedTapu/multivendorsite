// src/components/ui/section-card.tsx
//
// Shared section-card shell carrying the FinixMart ProductForm visual
// language (see components/product/vendor/productform/ProductForm.tsx —
// the source this was extracted from). Use it for any new dashboard form
// or details page so everything reads as one application.
//
// Tokens (from ProductForm — do not invent new colors here):
//   card      #fff, border 1.5px #E5EAF2, radius 14, shadow 0 1px 3px rgba(0,0,0,0.04)
//   header    #FAFBFD, divider #F0F4FA, icon chip 32×32 r9 #EEF3FB
//   title     13.5px/700 #0D1B2E · subtitle 11px #7A90AB
//   badges    required #DC2626/#FECACA/#FEF2F2 · optional #16A34A/#BBF7D0/#F0F9F0

import { AlertCircle } from "lucide-react";
import * as React from "react";

export type SectionBadge = "required" | "optional";

export function SectionCard({
  icon,
  title,
  subtitle,
  badge,
  actions,
  children,
  error,
  id,
  noBodyPadding,
  bodyClassName,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  badge?: SectionBadge;
  /** Optional right-side header slot (e.g. an "Add" button on a section). */
  actions?: React.ReactNode;
  children: React.ReactNode;
  error?: boolean;
  id?: string;
  /** Flush body — for full-width tables that span the card edge-to-edge. */
  noBodyPadding?: boolean;
  bodyClassName?: string;
}) {
  return (
    <div
      id={id}
      style={{
        background: "#fff",
        border: `1.5px solid ${error ? "#FCA5A5" : "#E5EAF2"}`,
        borderRadius: 14,
        boxShadow: error
          ? "0 0 0 3px rgba(239,68,68,0.08)"
          : "0 1px 3px rgba(0,0,0,0.04)",
        transition: "box-shadow 0.3s, border-color 0.3s",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 18px",
          borderBottom: "1px solid #F0F4FA",
          background: "#FAFBFD",
          borderRadius: "12px 12px 0 0",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 9,
              background: error ? "#FEF2F2" : "#EEF3FB",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {icon}
          </div>
          <div>
            <div
              style={{
                fontSize: 13.5,
                fontWeight: 700,
                color: "#0D1B2E",
                letterSpacing: "-0.2px",
              }}
            >
              {title}
            </div>
            {subtitle && (
              <div style={{ fontSize: 11, color: "#7A90AB", marginTop: 1 }}>
                {subtitle}
              </div>
            )}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {actions}
          {badge && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                padding: "2px 9px",
                borderRadius: 20,
                background: badge === "required" ? "#FEF2F2" : "#F0F9F0",
                color: badge === "required" ? "#DC2626" : "#16A34A",
                border: `1px solid ${
                  badge === "required" ? "#FECACA" : "#BBF7D0"
                }`,
              }}
            >
              {badge === "required" ? "Required" : "Optional"}
            </span>
          )}
        </div>
      </div>
      <div
        className={bodyClassName}
        style={{ padding: noBodyPadding ? 0 : "18px 18px" }}
      >
        {children}
      </div>
    </div>
  );
}

/* ─── Field label / hint / inline error ─────────────────────────────────── */

export function FieldLabel({
  children,
  required,
  hint,
}: {
  children: React.ReactNode;
  required?: boolean;
  hint?: string;
}) {
  return (
    <div style={{ marginBottom: 6 }}>
      <label
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: "#3D5068",
          letterSpacing: "0.01em",
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        {children}
        {required && (
          <span style={{ color: "#DC2626", fontWeight: 800 }}>*</span>
        )}
      </label>
      {hint && (
        <p style={{ fontSize: 10.5, color: "#9BAABB", marginTop: 2 }}>{hint}</p>
      )}
    </div>
  );
}

export function FieldError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 5,
        marginTop: 5,
        fontSize: 11.5,
        color: "#DC2626",
      }}
    >
      <AlertCircle size={12} />
      {message}
    </div>
  );
}
