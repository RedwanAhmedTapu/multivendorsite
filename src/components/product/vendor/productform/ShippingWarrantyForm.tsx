"use client";
import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AlertCircle, Check, Package, Shield, Truck, Weight, Ruler, X } from "lucide-react";
import { ProductShippingWarrantyInput } from "@/types/product";

interface Props {
  value: ProductShippingWarrantyInput | null;
  onChange: (val: ProductShippingWarrantyInput) => void;
  validationErrors: Record<string, boolean>;
}

const initialFormState: ProductShippingWarrantyInput = {
  packageWeightValue: 0,
  packageWeightUnit: "kg",
  packageLength: 0,
  packageWidth: 0,
  packageHeight: 0,
  dangerousGoods: "none",
  warrantyType: "",
  warrantyPeriodValue: 6,
  warrantyPeriodUnit: "months",
  warrantyDetails: "",
};

/* ─── Small reusable primitives (matching AddProductForm style) ─────────── */

function FieldLabel({
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

function FieldError({ message }: { message?: string }) {
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

function SubSection({
  icon,
  title,
  children,
  headerRight,
  accent = "#1D4ED8",
  accentBg = "#EFF6FF",
  accentBorder = "#BFDBFE",
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  headerRight?: React.ReactNode;
  accent?: string;
  accentBg?: string;
  accentBorder?: string;
}) {
  return (
    <div
      style={{
        background: accentBg,
        border: `0.5px solid ${accentBorder}`,
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      {/* sub-header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          padding: "9px 14px",
          borderBottom: `0.5px solid ${accentBorder}`,
          background: "#FFFFFF",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: 8,
              background: accentBg,
              border: `0.5px solid ${accentBorder}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {icon}
          </div>
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: accent,
              letterSpacing: "-0.1px",
            }}
          >
            {title}
          </span>
        </div>
        {headerRight}
      </div>
      {/* sub-body */}
      <div style={{ padding: "14px 14px" }}>{children}</div>
    </div>
  );
}

/* ─── Image preview modal ─────────────────────────────────────────────────
   Shows a reference diagram (e.g. how length/width/height are measured on a
   package) in an animated modal. Stays mounted while "closing" so the
   fade/scale-out transition can play, then unmounts after the animation
   duration — same pattern used elsewhere in the app for image previews. ─── */

interface ImagePreviewModalProps {
  open: boolean;
  onClose: () => void;
  src: string;
  alt: string;
  title?: string;
}

function ImagePreviewModal({ open, onClose, src, alt, title }: ImagePreviewModalProps) {
  const [visible, setVisible] = useState(open);
  const [closing, setClosing] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (open) {
      if (closeTimer.current) clearTimeout(closeTimer.current);
      setVisible(true);
      setClosing(false);
    } else if (visible) {
      setClosing(true);
      closeTimer.current = setTimeout(() => {
        setVisible(false);
        setClosing(false);
      }, 220);
    }
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!visible) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(15, 23, 42, 0.6)",
          backdropFilter: "blur(2px)",
          animation: `${closing ? "sw-img-overlay-out" : "sw-img-overlay-in"} 0.2s ease forwards`,
        }}
      />

      {/* Card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title || "Image preview"}
        style={{
          position: "relative",
          maxWidth: "min(700px, 92vw)",
          maxHeight: "88vh",
          background: "#fff",
          borderRadius: 16,
          boxShadow: "0 24px 60px rgba(15,23,42,0.3)",
          border: "1px solid #E2E8F0",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          animation: `${closing ? "sw-img-modal-out" : "sw-img-modal-in"} 0.24s cubic-bezier(0.16,1,0.3,1) forwards`,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 18px",
            borderBottom: "0.5px solid #E2E8F0",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: "#EFF6FF",
                border: "0.5px solid #BFDBFE",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Ruler size={14} color="#1D4ED8" />
            </div>
            <p style={{ fontSize: 13.5, fontWeight: 800, color: "#1E293B", margin: 0 }}>
              {title || "Package dimensions guide"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              border: "1px solid #E2E8F0",
              background: "#F8FAFC",
              color: "#64748B",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
              transition: "background 0.15s ease, color 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#FEE2E2";
              e.currentTarget.style.color = "#DC2626";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#F8FAFC";
              e.currentTarget.style.color = "#64748B";
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Image */}
        <div
          style={{
            padding: 16,
            overflow: "auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#F8FAFC",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            style={{
              maxWidth: "100%",
              maxHeight: "70vh",
              objectFit: "contain",
              borderRadius: 8,
              display: "block",
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes sw-img-overlay-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes sw-img-overlay-out { from { opacity: 1; } to { opacity: 0; } }
        @keyframes sw-img-modal-in {
          from { opacity: 0; transform: scale(0.92) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes sw-img-modal-out {
          from { opacity: 1; transform: scale(1) translateY(0); }
          to { opacity: 0; transform: scale(0.95) translateY(6px); }
        }
      `}</style>
    </div>
  );
}

/* ─── NumericInput ────────────────────────────────────────────────────────
   type="text" underneath, keeps its own local string state so whatever the
   user typed stays on screen exactly as typed.

   DEFAULT-ZERO vs USER-TYPED-ZERO
   --------------------------------
   `initialFormState` seeds several fields (packageWeightValue,
   packageLength/Width/Height) at 0 just so the shape is a valid number
   before the vendor has touched anything. We do NOT want that seed value
   rendered as a literal "0" in the box — the box should show the
   placeholder until the vendor actually types something.

   At the same time, if the vendor deliberately types "0" and blurs, that
   IS a real committed value and should stay visible as "0" (this was the
   original fix: never use `value ? String(value) : ""`, since 0 is falsy
   and that pattern would hide a genuinely-entered 0).

   The `touched` ref resolves both cases: it starts `false`, so an
   untouched field showing the seeded 0 renders as "" (placeholder shows
   through). It flips to `true` the moment the vendor types anything in
   this field. Once touched, 0 is a real value and renders as "0" like
   normal. If the vendor clears the field back to empty on blur, we reset
   `touched` to `false` again so the placeholder reappears instead of
   snapping back to a bare "0". ────────────────────────────────────────── */

function formatValue(v: number | null | undefined): string {
  if (v === null || v === undefined || Number.isNaN(v)) return "";
  return String(v);
}

function NumericInput({
  value,
  onChange,
  placeholder,
  min,
  max,
  allowDecimal = true,
  style,
  onBlurExtra,
}: {
  value: number;
  onChange: (val: number) => void;
  placeholder?: string;
  min?: number;
  max?: number;
  allowDecimal?: boolean;
  style?: React.CSSProperties;
  onBlurExtra?: () => void;
}) {
  // Only treat the incoming value as "already touched" if it's a real
  // (non-zero) number — a 0 coming in from initialFormState should still
  // render as empty/placeholder until the vendor interacts with the field.
  const touched = useRef<boolean>(value > 0);
  const [text, setText] = useState<string>(
    touched.current ? formatValue(value) : ""
  );
  const isFocused = useRef(false);

  // Keep local text in sync when the value changes from OUTSIDE this input
  // (e.g. parent resets the whole form) — but never fight the user while
  // they're actively typing in this exact field.
  useEffect(() => {
    if (isFocused.current) return;
    if (!touched.current && value === 0) {
      // Still an untouched, seed-default 0 — keep showing the placeholder.
      setText("");
      return;
    }
    setText(formatValue(value));
  }, [value]);

  const numericPattern = allowDecimal ? /^\d*\.?\d*$/ : /^\d*$/;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw !== "" && !numericPattern.test(raw)) return; // reject invalid keystrokes

    // Any keystroke in this field means the vendor is actively setting a
    // value — from this point on 0 is a real, intentional value, not the
    // unseen seed default.
    touched.current = true;
    setText(raw);

    if (raw === "" || raw === ".") {
      onChange(0);
      return;
    }
    const num = parseFloat(raw);
    onChange(Number.isNaN(num) ? 0 : num);
  };

  const handleFocus = () => {
    isFocused.current = true;
  };

  const handleBlur = () => {
    isFocused.current = false;

    // Vendor cleared the field entirely on blur — fall back to showing
    // the placeholder again instead of snapping to a bare "0", since an
    // empty box reads more clearly as "nothing entered" than "0" does.
    if (text === "") {
      touched.current = false;
      onChange(0);
      onBlurExtra?.();
      return;
    }

    let num = parseFloat(text);
    if (Number.isNaN(num)) num = 0;
    if (typeof min === "number" && num < min && num !== 0) num = min;
    if (typeof max === "number" && num > max) num = max;
    setText(formatValue(num)); // always show the real number, "0" included
    onChange(num);
    onBlurExtra?.();
  };

  return (
    <Input
      type="text"
      inputMode={allowDecimal ? "decimal" : "numeric"}
      value={text}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      placeholder={placeholder}
      style={style}
    />
  );
}

/* ─── Main component ─────────────────────────────────────────────────────── */

export default function ShippingWarrantyForm({
  value,
  onChange,
  validationErrors,
}: Props) {
  const [form, setForm] = useState<ProductShippingWarrantyInput>(
    value || initialFormState
  );

  const [showDimensionsGuide, setShowDimensionsGuide] = useState(false);

  useEffect(() => {
    if (value === null) {
      setForm(initialFormState);
      onChange(initialFormState);
    } else if (value) {
      setForm(value);
    }
  }, [value, onChange]);

  const updateField = (field: keyof ProductShippingWarrantyInput, val: any) => {
    const updated = { ...form, [field]: val };
    setForm(updated);
    onChange(updated);
  };

  const isFieldError = (fieldName: string) => validationErrors[fieldName];

  /* shared input style helper */
  const inputStyle = (hasError?: boolean, hasSuccess?: boolean): React.CSSProperties => ({
    fontSize: 13,
    borderColor: hasError ? "#FCA5A5" : hasSuccess ? "#6EE7B7" : undefined,
    background: "#FFFFFF",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 4 }}>

      {/* ── Package Details ── */}
      <SubSection
        icon={<Package size={13} color="#1D4ED8" />}
        title="Package details"
        accent="#1D4ED8"
        accentBg="#EFF6FF"
        accentBorder="#BFDBFE"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Weight row */}
          <div
            id="packageWeight"
            style={
              isFieldError("packageWeight")
                ? { borderLeft: "3px solid #FCA5A5", paddingLeft: 10 }
                : {}
            }
          >
            <FieldLabel required >
              Package weight
            </FieldLabel>
            <div style={{ display: "flex", gap: 8, maxWidth: 260 }}>
              <div style={{ position: "relative", flex: 1 }}>
                <NumericInput
                 
                  value={form.packageWeightValue}
                  onChange={(val) => updateField("packageWeightValue", val)}
                  placeholder="Enter weight"
                  style={{
                    ...inputStyle(
                      isFieldError("packageWeight"),
                      form.packageWeightValue > 0
                    ),
                    paddingRight: form.packageWeightValue > 0 ? 30 : 12,
                  }}
                />
                {/* FIX: was `form.packageWeightValue && form.packageWeightValue > 0 && (...)`.
                    When the value is exactly 0, `0 && x` evaluates to `0` — and React
                    renders a bare 0 as visible text instead of nothing. Using only the
                    `> 0` comparison guarantees a real boolean, so nothing renders when
                    the value is 0. */}
                {form.packageWeightValue > 0 && (
                  <Check
                    size={13}
                    color="#10B981"
                    style={{
                      position: "absolute",
                      right: 9,
                      top: "50%",
                      transform: "translateY(-50%)",
                    }}
                  />
                )}
              </div>
              <Select
                value={form.packageWeightUnit}
                onValueChange={(val) =>
                  updateField(
                    "packageWeightUnit",
                    val as ProductShippingWarrantyInput["packageWeightUnit"]
                  )
                }
              >
                <SelectTrigger
                  style={{
                    width: 80,
                    fontSize: 13,
                    background: "#FFFFFF",
                    borderColor: "#BFDBFE",
                  }}
                >
                  <SelectValue placeholder="Unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="g">g</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {isFieldError("packageWeight") && (
              <FieldError message="Package weight is required" />
            )}
          </div>

          {/* Dimensions row */}
          <div
            id="packageDimensions"
            style={
              isFieldError("packageDimensions")
                ? { borderLeft: "3px solid #FCA5A5", paddingLeft: 10 }
                : {}
            }
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 10,
              }}
            >
              <FieldLabel required >
                Package dimensions (cm)
              </FieldLabel>
              <button
                type="button"
                onClick={() => setShowDimensionsGuide(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "5px 10px",
                  borderRadius: 7,
                  border: "1px solid #BFDBFE",
                  background: "#EFF6FF",
                  color: "#1D4ED8",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  flexShrink: 0,
                  whiteSpace: "nowrap",
                }}
              >
                <Ruler size={12} />
                View diagram
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              {(
                [
                  { field: "packageLength", label: "Length" },
                  { field: "packageWidth",  label: "Width"  },
                  { field: "packageHeight", label: "Height" },
                ] as { field: keyof ProductShippingWarrantyInput; label: string }[]
              ).map(({ field, label }) => (
                <div key={field}>
                  <p
                    style={{
                      fontSize: 10.5,
                      fontWeight: 600,
                      color: "#64748B",
                      marginBottom: 4,
                      letterSpacing: "0.02em",
                      textTransform: "uppercase",
                    }}
                  >
                    {label}
                  </p>
                  <div style={{ position: "relative" }}>
                    <NumericInput
                      
                      value={form[field] as number}
                      onChange={(val) => updateField(field, val)}
                      placeholder=""
                      style={{
                        ...inputStyle(
                          isFieldError("packageDimensions"),
                          (form[field] as number) > 0
                        ),
                        paddingRight: (form[field] as number) > 0 ? 28 : 12,
                      }}
                    />
                    {/* Same fix as above: compare with `> 0` only, never
                        `form[field] && ... > 0`, or a stray "0" renders
                        under the input whenever the field is exactly 0. */}
                    {(form[field] as number) > 0 && (
                      <Check
                        size={12}
                        color="#10B981"
                        style={{
                          position: "absolute",
                          right: 8,
                          top: "50%",
                          transform: "translateY(-50%)",
                        }}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
            {isFieldError("packageDimensions") && (
              <FieldError message="Length, width, and height are all required" />
            )}
          </div>

          {/* Dangerous goods */}
          <div>
            <FieldLabel hint="Select if your product contains restricted materials">
              Dangerous goods
            </FieldLabel>
            <RadioGroup
              value={form.dangerousGoods}
              onValueChange={(val) => updateField("dangerousGoods", val)}
              style={{ display: "flex", gap: 10, flexWrap: "wrap" }}
            >
              {[
                { value: "none",     label: "None" },
                { value: "contains", label: "Contains battery / flammables / liquid" },
              ].map((opt) => (
                <label
                  key={opt.value}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    padding: "7px 12px",
                    borderRadius: 8,
                    border: `0.5px solid ${form.dangerousGoods === opt.value ? "#93C5FD" : "#CBD5E1"}`,
                    background: form.dangerousGoods === opt.value ? "#EFF6FF" : "#F8FAFC",
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: form.dangerousGoods === opt.value ? 600 : 400,
                    color: form.dangerousGoods === opt.value ? "#1D4ED8" : "#64748B",
                    transition: "all 0.15s",
                    userSelect: "none",
                  }}
                >
                  <RadioGroupItem value={opt.value} style={{ accentColor: "#1D4ED8" }} />
                  {opt.label}
                </label>
              ))}
            </RadioGroup>
          </div>
        </div>
      </SubSection>

      {/* ── Warranty ── */}
      <SubSection
        icon={<Shield size={13} color="#0369A1" />}
        title="Warranty information"
        accent="#0369A1"
        accentBg="#F0F9FF"
        accentBorder="#7DD3FC"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Warranty type */}
          <div
            id="warrantyType"
            style={
              isFieldError("warrantyType")
                ? { borderLeft: "3px solid #FCA5A5", paddingLeft: 10 }
                : {}
            }
          >
            <FieldLabel required>Warranty type</FieldLabel>
            <Select
              value={form.warrantyType}
              onValueChange={(val) => updateField("warrantyType", val)}
            >
              <SelectTrigger
                style={{
                  fontSize: 13,
                  background: "#FFFFFF",
                  borderColor: isFieldError("warrantyType")
                    ? "#FCA5A5"
                    : form.warrantyType
                    ? "#6EE7B7"
                    : "#7DD3FC",
                  maxWidth: 360,
                }}
              >
                <SelectValue placeholder="Select warranty type" />
              </SelectTrigger>
              <SelectContent>
                {[
                  { value: "FINIXMART_WARRANTY",                  label: "Finixmart Warranty"                  },
                  { value: "LOCAL_WARRANTY",                       label: "Local Warranty"                       },
                  { value: "AGENT_WARRANTY",                       label: "Agent Warranty"                       },
                  { value: "BRAND_WARRANTY",                       label: "Brand Warranty"                       },
                  { value: "SELLER_WARRANTY",                      label: "Seller Warranty"                      },
                  { value: "LOCAL_SELLER_WARRANTY",                label: "Local Seller Warranty"                },
                  { value: "INTERNATIONAL_WARRANTY",               label: "International Warranty"               },
                  { value: "INTERNATIONAL_MANUFACTURER_WARRANTY",  label: "International Manufacturer Warranty"  },
                  { value: "INTERNATIONAL_SELLER_WARRANTY",        label: "International Seller Warranty"        },
                  { value: "NON_LOCAL_WARRANTY",                   label: "Non Local Warranty"                   },
                  { value: "NO_WARRANTY",                          label: "No Warranty"                          },
                  { value: "NOT_APPLICABLE",                       label: "Not Applicable"                       },
                  { value: "ORIGINAL_PRODUCT",                     label: "Original Product"                     },
                ].map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} style={{ fontSize: 13 }}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isFieldError("warrantyType") && (
              <FieldError message="Warranty type is required" />
            )}
            {form.warrantyType && (
              <p
                style={{
                  fontSize: 11,
                  color: "#10B981",
                  marginTop: 4,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <Check size={11} /> Warranty type selected
              </p>
            )}
          </div>

          {/* Warranty period */}
          <div>
            <FieldLabel hint="Leave as 0 if not applicable">
              Warranty period
            </FieldLabel>
            <div style={{ display: "flex", gap: 8, maxWidth: 260 }}>
              <NumericInput
                allowDecimal={false}
                min={0}
                value={form.warrantyPeriodValue}
                onChange={(val) => updateField("warrantyPeriodValue", val)}
                placeholder="e.g. 6"
                style={{ ...inputStyle(), flex: 1 }}
              />
              <Select
                value={form.warrantyPeriodUnit}
                onValueChange={(val) =>
                  updateField(
                    "warrantyPeriodUnit",
                    val as ProductShippingWarrantyInput["warrantyPeriodUnit"]
                  )
                }
              >
                <SelectTrigger
                  style={{
                    width: 110,
                    fontSize: 13,
                    background: "#FFFFFF",
                    borderColor: "#7DD3FC",
                  }}
                >
                  <SelectValue placeholder="Unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="days"   style={{ fontSize: 13 }}>Days</SelectItem>
                  <SelectItem value="months" style={{ fontSize: 13 }}>Months</SelectItem>
                  <SelectItem value="years"  style={{ fontSize: 13 }}>Years</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Warranty details */}
          <div
            id="warrantyDetails"
            style={
              isFieldError("warrantyDetails")
                ? { borderLeft: "3px solid #FCA5A5", paddingLeft: 10 }
                : {}
            }
          >
            <FieldLabel required hint="Describe coverage, exclusions, and claim process">
              Warranty details
            </FieldLabel>
            <textarea
              value={form.warrantyDetails || ""}
              onChange={(e) => updateField("warrantyDetails", e.target.value)}
              placeholder="e.g. 1-year manufacturer warranty covering defects in materials and workmanship. Does not cover accidental damage."
              rows={3}
              style={{
                width: "100%",
                maxWidth: 560,
                fontSize: 13,
                fontFamily: "inherit",
                color: "#0D1B2E",
                padding: "8px 12px",
                borderRadius: 8,
                border: `0.5px solid ${
                  isFieldError("warrantyDetails")
                    ? "#FCA5A5"
                    : form.warrantyDetails
                    ? "#6EE7B7"
                    : "#7DD3FC"
                }`,
                background: "#FFFFFF",
                resize: "vertical",
                outline: "none",
                lineHeight: 1.6,
                transition: "border-color 0.15s",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#3B82F6";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.1)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.borderColor = form.warrantyDetails
                  ? "#6EE7B7"
                  : "#7DD3FC";
              }}
            />
            {isFieldError("warrantyDetails") && (
              <FieldError message="Warranty details are required" />
            )}
          </div>
        </div>
      </SubSection>

      <ImagePreviewModal
        open={showDimensionsGuide}
        onClose={() => setShowDimensionsGuide(false)}
        src="/shippingproductlenght/shippingLengthHeight.png"
        alt="Diagram showing how to measure package length, width, and height"
        title="How to measure package dimensions"
      />
    </div>
  );
}