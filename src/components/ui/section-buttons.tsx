// src/components/ui/section-buttons.tsx
//
// Primary/secondary buttons carrying the FinixMart ProductForm visual
// language (extracted from ProductForm.tsx — same gradients, radii,
// shadows, and interaction states). "use client" because of the
// hover/press state hooks.

"use client";

import { Loader2 } from "lucide-react";
import * as React from "react";

export function GradientButton({
  children,
  onClick,
  isLoading,
  disabled,
  type = "button",
  style,
  icon,
}: {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  isLoading?: boolean;
  disabled?: boolean;
  type?: "button" | "submit";
  style?: React.CSSProperties;
  icon?: React.ReactNode;
}) {
  const [isHovered, setIsHovered] = React.useState(false);
  const [isPressed, setIsPressed] = React.useState(false);

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsPressed(false);
      }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      style={{
        padding: "11px 32px",
        borderRadius: 11,
        border: "none",
        background: isHovered
          ? "linear-gradient(135deg,#2563EB,#8B5CF6)"
          : "linear-gradient(135deg,#1D4ED8,#7C3AED)",
        color: "#fff",
        fontSize: 13.5,
        fontWeight: 700,
        letterSpacing: "0.01em",
        cursor: disabled || isLoading ? "not-allowed" : "pointer",
        opacity: disabled && !isLoading ? 0.6 : 1,
        fontFamily: "inherit",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        boxShadow: isHovered
          ? "0 10px 24px rgba(124,58,237,0.35), 0 2px 6px rgba(29,78,216,0.25)"
          : "0 4px 14px rgba(124,58,237,0.25)",
        transform: isPressed
          ? "scale(0.97)"
          : isHovered
            ? "translateY(-1px)"
            : "translateY(0)",
        transition: "all 0.18s ease",
        ...style,
      }}
    >
      {isLoading ? (
        <>
          <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} />
          Saving…
        </>
      ) : (
        <>
          {icon}
          {children}
        </>
      )}
    </button>
  );
}

export function OutlineButton({
  children,
  onClick,
  disabled,
  type = "button",
  style,
  icon,
}: {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  disabled?: boolean;
  type?: "button" | "submit";
  style?: React.CSSProperties;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "9px 20px",
        borderRadius: 9,
        border: "1.5px solid #E5EAF2",
        background: "#fff",
        fontSize: 13,
        fontWeight: 600,
        color: "#64748B",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
        fontFamily: "inherit",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        ...style,
      }}
    >
      {icon}
      {children}
    </button>
  );
}

/** Compact variant for use inside SectionCard headers / table rows. */
export function SmallOutlineButton({
  children,
  onClick,
  disabled,
  style,
  icon,
}: {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  disabled?: boolean;
  style?: React.CSSProperties;
  icon?: React.ReactNode;
}) {
  return (
    <OutlineButton
      onClick={onClick}
      disabled={disabled}
      style={{ padding: "6px 12px", fontSize: 12, borderRadius: 8, ...style }}
      icon={icon}
    >
      {children}
    </OutlineButton>
  );
}
