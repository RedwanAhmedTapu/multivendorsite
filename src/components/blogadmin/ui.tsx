"use client";
import React, { useState } from "react";
import { Loader2, AlertCircle, Check, Sparkles, ArrowRight } from "lucide-react";

/* ─── Colors (same palette as AddProductForm) ───────────────────────────── */

export const COLORS = {
  pageBg: "#F0F4FA",
  cardBorder: "#E5EAF2",
  cardHeaderBg: "#FAFBFD",
  title: "#0D1B2E",
  subtitle: "#7A90AB",
  label: "#3D5068",
  hint: "#9BAABB",
  danger: "#DC2626",
  dangerBorder: "#FCA5A5",
  dangerBg: "#FEF2F2",
  success: "#10B981",
  successBg: "#F0F9F0",
  successBorder: "#BBF7D0",
  successBorderStrong: "#6EE7B7",
  iconBoxBg: "#EEF3FB",
  muted: "#64748B",
};

/* ─── Error-glow keyframe injection (once) ──────────────────────────────── */

const ERROR_GLOW_CLASS = "fm-blogadmin-error-glow";

export function useInjectErrorGlowStyle() {
  if (typeof document !== "undefined" && !document.getElementById("fm-blogadmin-error-glow-style")) {
    const s = document.createElement("style");
    s.id = "fm-blogadmin-error-glow-style";
    s.textContent = `
      @keyframes fm-blogadmin-error-pulse {
        0%, 100% { box-shadow: 0 0 0 2px rgba(168,85,247,0.35), 0 0 10px 0 rgba(239,68,68,0.12); border-color: #A855F7 !important; }
        50% { box-shadow: 0 0 0 4px rgba(239,68,68,0.28), 0 0 20px 2px rgba(168,85,247,0.18); border-color: #EF4444 !important; }
      }
      .${ERROR_GLOW_CLASS} { animation: fm-blogadmin-error-pulse 0.9s ease-in-out 4 !important; }
      @keyframes fm-blogadmin-spin { to { transform: rotate(360deg); } }
    `;
    document.head.appendChild(s);
  }
}
export { ERROR_GLOW_CLASS };

/* ─── SectionCard ────────────────────────────────────────────────────────── */

export function SectionCard({
  icon,
  title,
  subtitle,
  badge,
  children,
  error,
  id,
  right,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  badge?: "required" | "optional";
  children: React.ReactNode;
  error?: boolean;
  id?: string;
  right?: React.ReactNode;
}) {
  return (
    <div
      id={id}
      style={{
        background: "#fff",
        border: `1.5px solid ${error ? COLORS.dangerBorder : COLORS.cardBorder}`,
        borderRadius: 14,
        boxShadow: error ? "0 0 0 3px rgba(239,68,68,0.08)" : "0 1px 3px rgba(0,0,0,0.04)",
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
          background: COLORS.cardHeaderBg,
          borderRadius: "12px 12px 0 0",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 9,
              background: error ? COLORS.dangerBg : COLORS.iconBoxBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {icon}
          </div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: COLORS.title, letterSpacing: "-0.2px" }}>
              {title}
            </div>
            {subtitle && <div style={{ fontSize: 11, color: COLORS.subtitle, marginTop: 1 }}>{subtitle}</div>}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {badge && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                padding: "2px 9px",
                borderRadius: 20,
                background: badge === "required" ? COLORS.dangerBg : COLORS.successBg,
                color: badge === "required" ? COLORS.danger : "#16A34A",
                border: `1px solid ${badge === "required" ? "#FECACA" : COLORS.successBorder}`,
              }}
            >
              {badge === "required" ? "Required" : "Optional"}
            </span>
          )}
          {right}
        </div>
      </div>
      <div style={{ padding: "18px 18px" }}>{children}</div>
    </div>
  );
}

/* ─── FieldLabel / FieldError ────────────────────────────────────────────── */

export function FieldLabel({ children, required, hint }: { children: React.ReactNode; required?: boolean; hint?: string }) {
  return (
    <div style={{ marginBottom: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 700, color: COLORS.label, letterSpacing: "0.01em", display: "flex", alignItems: "center", gap: 4 }}>
        {children}
        {required && <span style={{ color: COLORS.danger, fontWeight: 800 }}>*</span>}
      </label>
      {hint && <p style={{ fontSize: 10.5, color: COLORS.hint, marginTop: 2 }}>{hint}</p>}
    </div>
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 5, fontSize: 11.5, color: COLORS.danger }}>
      <AlertCircle size={12} />
      {message}
    </div>
  );
}

/* ─── Shared text input style (matches shadcn Input visually) ──────────── */

export const inputBaseStyle: React.CSSProperties = {
  width: "100%",
  fontSize: 13,
  padding: "8px 12px",
  borderRadius: 8,
  border: `1px solid ${COLORS.cardBorder}`,
  outline: "none",
  fontFamily: "inherit",
  background: "#fff",
  color: COLORS.title,
};

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement> & { error?: boolean }) {
  const { error, style, ...rest } = props;
  return (
    <input
      {...rest}
      style={{ ...inputBaseStyle, borderColor: error ? COLORS.dangerBorder : COLORS.cardBorder, ...style }}
    />
  );
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: boolean }) {
  const { error, style, ...rest } = props;
  return (
    <textarea
      {...rest}
      style={{ ...inputBaseStyle, minHeight: 100, resize: "vertical", borderColor: error ? COLORS.dangerBorder : COLORS.cardBorder, ...style }}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement> & { error?: boolean }) {
  const { error, style, children, ...rest } = props;
  return (
    <select {...rest} style={{ ...inputBaseStyle, borderColor: error ? COLORS.dangerBorder : COLORS.cardBorder, ...style }}>
      {children}
    </select>
  );
}

/* ─── Buttons (same gradient as SubmitProductButton) ────────────────────── */

export function PrimaryButton({
  isLoading,
  onClick,
  label = "Save",
  loadingLabel = "Saving…",
  icon,
  disabled,
  type = "button",
}: {
  isLoading?: boolean;
  onClick?: () => void;
  label?: string;
  loadingLabel?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const isDisabled = !!disabled || !!isLoading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setIsPressed(false); }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      style={{
        padding: "10px 22px",
        borderRadius: 11,
        border: "none",
        background: isDisabled ? "#C7D2E5" : isHovered ? "linear-gradient(135deg,#2563EB,#8B5CF6)" : "linear-gradient(135deg,#1D4ED8,#7C3AED)",
        color: "#fff",
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: "0.01em",
        cursor: isDisabled ? "not-allowed" : "pointer",
        fontFamily: "inherit",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        boxShadow: isDisabled ? "none" : isHovered ? "0 10px 24px rgba(124,58,237,0.35), 0 2px 6px rgba(29,78,216,0.25)" : "0 4px 14px rgba(124,58,237,0.25)",
        transform: isPressed ? "scale(0.97)" : isHovered ? "translateY(-1px)" : "translateY(0)",
        transition: "all 0.18s ease",
      }}
    >
      {isLoading ? (
        <>
          <Loader2 size={14} style={{ animation: "fm-blogadmin-spin 1s linear infinite" }} />
          {loadingLabel}
        </>
      ) : (
        <>
          {icon ?? <Sparkles size={13} style={{ opacity: 0.9 }} />}
          {label}
        </>
      )}
    </button>
  );
}

export function SecondaryButton({ onClick, label, disabled, danger }: { onClick?: () => void; label: string; disabled?: boolean; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "9px 18px",
        borderRadius: 9,
        border: `1.5px solid ${danger ? "#FECACA" : COLORS.cardBorder}`,
        background: "#fff",
        fontSize: 12.5,
        fontWeight: 600,
        color: danger ? COLORS.danger : COLORS.muted,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
        fontFamily: "inherit",
      }}
    >
      {label}
    </button>
  );
}

export function IconButton({ onClick, title, danger, children, disabled }: { onClick?: () => void; title?: string; danger?: boolean; children: React.ReactNode; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      style={{
        width: 28,
        height: 28,
        borderRadius: 7,
        border: `1px solid ${danger ? "#FECACA" : COLORS.cardBorder}`,
        background: danger ? COLORS.dangerBg : "#fff",
        color: danger ? COLORS.danger : COLORS.muted,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  );
}

export function StatusBadge({ status }: { status: "DRAFT" | "PUBLISHED" | "SCHEDULED" | "ARCHIVED" }) {
  const map: Record<string, { bg: string; color: string; border: string }> = {
    DRAFT: { bg: "#F1F5F9", color: "#475569", border: "#E2E8F0" },
    PUBLISHED: { bg: COLORS.successBg, color: "#16A34A", border: COLORS.successBorder },
    SCHEDULED: { bg: "#EFF6FF", color: "#2563EB", border: "#BFDBFE" },
    ARCHIVED: { bg: COLORS.dangerBg, color: COLORS.danger, border: "#FECACA" },
  };
  const c = map[status] ?? map.DRAFT;
  return (
    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", padding: "2px 8px", borderRadius: 20, background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>
      {status}
    </span>
  );
}

export function SuccessNote({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 11, color: COLORS.success, marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
      <Check size={11} /> {children}
    </p>
  );
}

export function ArrowIcon() {
  return <ArrowRight size={13} />;
}
