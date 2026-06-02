"use client";
import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AlertCircle, Check, Package, Shield, Truck, Weight } from "lucide-react";
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
  accent = "#1D4ED8",
  accentBg = "#EFF6FF",
  accentBorder = "#BFDBFE",
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
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
          gap: 8,
          padding: "9px 14px",
          borderBottom: `0.5px solid ${accentBorder}`,
          background: "#FFFFFF",
        }}
      >
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
      {/* sub-body */}
      <div style={{ padding: "14px 14px" }}>{children}</div>
    </div>
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
            <FieldLabel required hint="Between 0.001 kg and 300,000 g">
              Package weight
            </FieldLabel>
            <div style={{ display: "flex", gap: 8, maxWidth: 260 }}>
              <div style={{ position: "relative", flex: 1 }}>
                <Input
                  type="number"
                  min={0.001}
                  max={300000}
                  value={form.packageWeightValue || ""}
                  onChange={(e) =>
                    updateField("packageWeightValue", Number(e.target.value))
                  }
                  placeholder="Enter weight"
                  style={{
                    ...inputStyle(
                      isFieldError("packageWeight"),
                      !!form.packageWeightValue && form.packageWeightValue > 0
                    ),
                    paddingRight:
                      form.packageWeightValue && form.packageWeightValue > 0
                        ? 30
                        : 12,
                  }}
                />
                {form.packageWeightValue && form.packageWeightValue > 0 && (
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
          <div>
            <FieldLabel required hint="Each dimension: 0.01 – 300 cm">
              Package dimensions (cm)
            </FieldLabel>
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
                    <Input
                      type="number"
                      min={0.01}
                      max={300}
                      value={(form[field] as number) || ""}
                      onChange={(e) =>
                        updateField(field, Number(e.target.value))
                      }
                      placeholder="0.01 – 300"
                      style={{
                        ...inputStyle(
                          false,
                          !!form[field] && (form[field] as number) > 0
                        ),
                        paddingRight:
                          form[field] && (form[field] as number) > 0 ? 28 : 12,
                      }}
                    />
                    {form[field] && (form[field] as number) > 0 && (
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
            <FieldLabel>Warranty type</FieldLabel>
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
              <Input
                type="number"
                min={0}
                value={form.warrantyPeriodValue || ""}
                onChange={(e) =>
                  updateField("warrantyPeriodValue", Number(e.target.value))
                }
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
            <FieldLabel hint="Describe coverage, exclusions, and claim process">
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
    </div>
  );
}