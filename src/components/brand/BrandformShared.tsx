"use client";
import React from "react";
import { AlertCircle, Check, Info } from "lucide-react";

// ─── Section Card Shell (same visual language as AddProductForm.tsx) ─────────

export function SectionCard({
  icon,
  title,
  subtitle,
  badge,
  children,
  error,
  id,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  badge?: "required" | "optional";
  children: React.ReactNode;
  error?: boolean;
  id?: string;
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
        transition: "box-shadow 0.2s, border-color 0.2s",
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
          flexWrap: "wrap",
          gap: 8,
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
              border: `1px solid ${badge === "required" ? "#FECACA" : "#BBF7D0"}`,
            }}
          >
            {badge === "required" ? "Required" : "Optional"}
          </span>
        )}
      </div>
      <div style={{ padding: "18px" }}>{children}</div>
    </div>
  );
}

// ─── Field Label ──────────────────────────────────────────────────────────────

export function FieldLabel({
  children,
  required,
  hint,
  info,
}: {
  children: React.ReactNode;
  required?: boolean;
  hint?: string;
  info?: string;
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
        {required && <span style={{ color: "#DC2626", fontWeight: 800 }}>*</span>}
        {info && (
          <span title={info} style={{ display: "inline-flex", cursor: "help" }}>
            <Info size={12} color="#9BAABB" />
          </span>
        )}
      </label>
      {hint && <p style={{ fontSize: 10.5, color: "#9BAABB", marginTop: 2 }}>{hint}</p>}
    </div>
  );
}

// ─── Inline error ─────────────────────────────────────────────────────────────

export function FieldError({ message }: { message?: string }) {
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

// ─── Toggle switch (blue, matching product-form accent instead of orange) ────

export function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      style={{
        width: 42,
        height: 24,
        borderRadius: 999,
        border: "none",
        padding: 3,
        display: "flex",
        alignItems: "center",
        justifyContent: checked ? "flex-end" : "flex-start",
        background: disabled
          ? "#E5EAF2"
          : checked
          ? "linear-gradient(135deg,#1D4ED8,#0891B2)"
          : "#CBD5E1",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "background 0.2s",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: "#fff",
          boxShadow: "0 1px 2px rgba(0,0,0,0.25)",
          transition: "transform 0.2s",
        }}
      />
    </button>
  );
}

// ─── Radio option (pill-style, matching relationship selector in design) ─────

export function RadioOption({
  label,
  selected,
  onSelect,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 14px",
        borderRadius: 9,
        border: `1.5px solid ${selected ? "#1D4ED8" : "#E5EAF2"}`,
        background: selected ? "#EFF6FF" : "#fff",
        cursor: "pointer",
        fontFamily: "inherit",
        transition: "all 0.15s",
      }}
    >
      <span
        style={{
          width: 16,
          height: 16,
          borderRadius: "50%",
          border: `2px solid ${selected ? "#1D4ED8" : "#CBD5E1"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {selected && (
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#1D4ED8",
            }}
          />
        )}
      </span>
      <span
        style={{
          fontSize: 12.5,
          fontWeight: selected ? 700 : 600,
          color: selected ? "#1D4ED8" : "#3D5068",
        }}
      >
        {label}
      </span>
    </button>
  );
}

// ─── Status badge (used in both vendor + admin brand lists) ─────────────────

export function StatusBadge({ status }: { status: "PENDING" | "APPROVED" | "REJECTED" }) {
  const map = {
    PENDING: { bg: "#FFFBEB", border: "#FDE68A", color: "#92400E", label: "Pending" },
    APPROVED: { bg: "#F0FDF4", border: "#BBF7D0", color: "#15803D", label: "Approved" },
    REJECTED: { bg: "#FEF2F2", border: "#FECACA", color: "#DC2626", label: "Rejected" },
  } as const;
  const s = map[status];
  return (
    <span
      style={{
        fontSize: 10.5,
        fontWeight: 700,
        letterSpacing: "0.03em",
        textTransform: "uppercase",
        padding: "3px 10px",
        borderRadius: 20,
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
      }}
    >
      {status === "APPROVED" && <Check size={10} />}
      {s.label}
    </span>
  );
}