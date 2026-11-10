"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertCircle,
  Check,
  Layers,
  ChevronDown,
  ChevronUp,
  PlusCircle,
  Award,
  Search,
  Info,
  RefreshCw,
} from "lucide-react";
import { Attribute, AttributeValue } from "@/types/type";
import { ProductAttributeInput } from "@/types/product";
import { useGetMyBrandsQuery } from "@/features/brandApi";

interface Props {
  categoryId: string | null;
  attributes: ProductAttributeInput[];
  setAttributes: (a: ProductAttributeInput[]) => void;
  categoryAttributes: Attribute[];
  requiredAttributes: Attribute[];
  onVariantFieldChange: (
    fieldId: string,
    fieldName: string,
    value: any,
    includeInVariant: boolean
  ) => void;
  validationErrors: Record<string, boolean>;
  onRequestMissing?: () => void;
  brandId: string | null;
  onBrandChange: (brandId: string | null) => void;
}

interface FieldValue {
  value: any;
  includeInVariant: boolean;
}

/* ─── Helpers ────────────────────────────────────────────────────────── */

/** Short "why this field matters" copy, shown on hover next to the label. */
function getFieldHint(attribute: Attribute, isRequired: boolean): string {
  const name = attribute.name.toLowerCase();
  if (name.includes("sku"))
    return "A unique code identifying this exact product/variant. Must be unique store-wide, or the server will reject it.";
  if (name.includes("color"))
    return "Lets buyers filter and match products by color.";
  if (name.includes("size"))
    return "Used for size filtering and to tell variants apart.";
  if (name.includes("weight"))
    return "Used to calculate accurate shipping costs.";
  if (name.includes("material"))
    return "Helps buyers judge quality, comfort, and care needs.";
  if (name.includes("brand"))
    return "Confirms authenticity and helps buyers search by brand.";
  return isRequired
    ? "Required so buyers can find and compare this product accurately."
    : "Optional — adds extra detail that helps buyers decide.";
}

/** Generates a SKU that's extremely unlikely to collide with existing ones. */
function generateUniqueSKU(categoryId: string | null, attributeName: string): string {
  const prefix =
    attributeName.replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase() || "SKU";
  const catPart = categoryId
    ? categoryId.replace(/[^A-Za-z0-9]/g, "").slice(-4).toUpperCase()
    : "GEN";
  const timePart = Date.now().toString(36).toUpperCase();
  const randPart = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `${prefix}-${catPart}-${timePart}-${randPart}`;
}

/** Small hover-tooltip icon. Native title attribute = zero extra deps, no focus issues. */
function FieldHint({ text }: { text: string }) {
  return (
    <span
      title={text}
      style={{
        display: "inline-flex",
        alignItems: "center",
        cursor: "help",
        color: "#94A3B8",
      }}
    >
      <Info size={12} />
    </span>
  );
}

/* ─── Brand Selector (uses vendor's OWN approved brands, NOT catalog) ── */

function BrandSelector({
  brandId,
  onBrandChange,
  hasError,
}: {
  brandId: string | null;
  onBrandChange: (id: string | null) => void;
  hasError: boolean;
}) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const { data: brandsData, isLoading } = useGetMyBrandsQuery({
    status: "APPROVED" as any,
    search: search || undefined,
  });

  const brands = brandsData?.brands ?? [];
  const selectedBrand = brands.find((b) => b.id === brandId);

  return (
    <div
      id="brandSelector"
      style={{
        padding: "14px 16px",
        borderRadius: 12,
        border: `1.5px solid ${hasError ? "#FCA5A5" : "#C4B5FD"}`,
        background: hasError ? "#FDF2F8" : brandId ? "#FAF5FF" : "#FEFEFE",
        transition: "all 0.25s",
        position: "relative",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: "#F5F3FF",
            border: "0.5px solid #C4B5FD",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Award size={14} color="#7C3AED" />
        </div>
        <span
          title="The brand this product is sold under. Buyers filter and trust products by verified brand."
          style={{
            fontSize: 12.5,
            fontWeight: 700,
            color: "#5B21B6",
            letterSpacing: "-0.1px",
            display: "flex",
            alignItems: "center",
            gap: 4,
            cursor: "help",
          }}
        >
          Brand
          <span style={{ color: "#DC2626", marginLeft: 3 }}>*</span>
          <Info size={11} color="#A78BFA" />
        </span>
        {brandId && selectedBrand && (
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: "#7C3AED",
              background: "#F5F3FF",
              border: "0.5px solid #C4B5FD",
              borderRadius: 20,
              padding: "1px 7px",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              marginLeft: "auto",
            }}
          >
            Selected
          </span>
        )}
      </div>

      <div style={{ position: "relative", marginBottom: 8 }}>
        <Search
          size={13}
          color="#A78BFA"
          style={{
            position: "absolute",
            left: 10,
            top: "50%",
            transform: "translateY(-50%)",
            pointerEvents: "none",
          }}
        />
        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search your approved brands…"
          style={{
            paddingLeft: 30,
            paddingRight: brandId ? 28 : 12,
            fontSize: 13,
            borderColor: hasError ? "#FCA5A5" : brandId ? "#A78BFA" : "#C4B5FD",
            background: "#fff",
          }}
        />
        {brandId && (
          <Check
            size={13}
            color="#7C3AED"
            style={{
              position: "absolute",
              right: 9,
              top: "50%",
              transform: "translateY(-50%)",
            }}
          />
        )}
      </div>

      {open && (
        <div
          style={{
            position: "absolute",
            left: 14,
            right: 14,
            top: "100%",
            marginTop: 4,
            background: "#fff",
            border: "1px solid #C4B5FD",
            borderRadius: 10,
            boxShadow: "0 8px 24px rgba(124,58,237,0.12)",
            zIndex: 50,
            maxHeight: 200,
            overflowY: "auto",
          }}
        >
          {isLoading ? (
            <div style={{ padding: "14px", fontSize: 12, color: "#A78BFA", textAlign: "center" }}>
              Loading brands…
            </div>
          ) : brands.length === 0 ? (
            <div
              style={{
                padding: "14px",
                fontSize: 12,
                color: "#94A3B8",
                textAlign: "center",
                lineHeight: 1.6,
              }}
            >
              {search
                ? `No approved brands matching "${search}"`
                : "No approved brands yet. Create and get a brand approved first."}
            </div>
          ) : (
            brands.map((brand) => {
              const isSelected = brand.id === brandId;
              return (
                <button
                  key={brand.id}
                  onClick={() => {
                    onBrandChange(brand.id);
                    setOpen(false);
                    setSearch("");
                  }}
                  style={{
                    width: "100%",
                    padding: "9px 14px",
                    textAlign: "left",
                    background: isSelected ? "#F5F3FF" : "none",
                    border: "none",
                    borderBottom: "0.5px solid #FAF5FF",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    transition: "background 0.12s",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.background = "#FAF5FF";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = isSelected ? "#F5F3FF" : "none";
                  }}
                >
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: 4,
                      border: `1.5px solid ${isSelected ? "#7C3AED" : "#CBD5E1"}`,
                      background: isSelected ? "#7C3AED" : "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {isSelected && <Check size={9} color="#fff" />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: isSelected ? 600 : 400,
                        color: isSelected ? "#5B21B6" : "#0F172A",
                      }}
                    >
                      {brand.name}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: 8.5,
                      fontWeight: 700,
                      padding: "1px 6px",
                      borderRadius: 20,
                      color: "#059669",
                      background: "#D1FAE5",
                      border: "0.5px solid #6EE7B7",
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      flexShrink: 0,
                    }}
                  >
                    Approved
                  </span>
                </button>
              );
            })
          )}
        </div>
      )}

      {brandId && selectedBrand && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "7px 10px",
            background: "#F5F3FF",
            border: "0.5px solid #C4B5FD",
            borderRadius: 8,
            fontSize: 12.5,
            color: "#5B21B6",
            fontWeight: 600,
          }}
        >
          <Check size={12} color="#7C3AED" />
          {selectedBrand.name}
          <button
            onClick={() => onBrandChange(null)}
            style={{
              marginLeft: "auto",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#A78BFA",
              fontSize: 14,
              padding: 0,
              lineHeight: 1,
              fontFamily: "inherit",
            }}
          >
            ×
          </button>
        </div>
      )}

      {hasError && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            marginTop: 6,
            fontSize: 11,
            color: "#DC2626",
          }}
        >
          <AlertCircle size={11} /> Please select a brand
        </div>
      )}

      {open && (
        <div style={{ position: "fixed", inset: 0, zIndex: 40 }} onClick={() => setOpen(false)} />
      )}
    </div>
  );
}

/* ─── FieldRow ───────────────────────────────────────────────────────────
   IMPORTANT: this is declared at MODULE scope (not inside the parent
   component). Previously it was defined inside SpecAttributeManager's
   render body, which meant React saw a brand-new component *type* on
   every re-render (including every keystroke) and unmounted + remounted
   the whole row — including the <Input> — killing focus after each
   character. Declaring it once here fixes the cursor-jump bug for every
   field, SKU included.
────────────────────────────────────────────────────────────────────── */

interface FieldRowProps {
  attribute: Attribute;
  isRequired: boolean;
  hasError: boolean;
  isFilled: boolean;
  isIncludedInVariant: boolean;
  hint: string;
  inputElement: React.ReactNode;
  onIncludeChange: (checked: boolean) => void;
}

const FieldRow = React.memo(function FieldRow({
  attribute,
  isRequired,
  hasError,
  isFilled,
  isIncludedInVariant,
  hint,
  inputElement,
  onIncludeChange,
}: FieldRowProps) {
  return (
    <div
      id={`attribute-${attribute.id}`}
      style={{
        padding: "12px 14px",
        borderRadius: 10,
        border: `0.5px solid ${hasError ? "#FCA5A5" : isFilled ? "#6EE7B7" : "#BFDBFE"}`,
        background: hasError ? "#FEF2F2" : isFilled ? "#F0FDF4" : "#F8FAFC",
        transition: "all 0.2s",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8,
          flexWrap: "wrap",
          gap: 6,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#3D5068" }}>
            {attribute.name}
            {isRequired && <span style={{ color: "#DC2626", marginLeft: 3 }}>*</span>}
          </span>
          <FieldHint text={hint} />
          {isFilled && (
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: "#059669",
                background: "#D1FAE5",
                border: "0.5px solid #6EE7B7",
                borderRadius: 20,
                padding: "1px 6px",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              Filled
            </span>
          )}
          {attribute.unit && (
            <span style={{ fontSize: 10.5, color: "#94A3B8" }}>({attribute.unit})</span>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 500,
              color: isIncludedInVariant ? "#1D4ED8" : "#94A3B8",
              transition: "color 0.15s",
            }}
          >
            {isIncludedInVariant ? "Used for variant" : "Use for variant"}
          </span>
          <Switch checked={isIncludedInVariant} onCheckedChange={onIncludeChange} />
        </div>
      </div>

      <div style={{ marginBottom: 6 }}>{inputElement}</div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 4,
        }}
      >
        {isRequired && (
          <span
            style={{
              fontSize: 10.5,
              color: isFilled ? "#059669" : "#DC2626",
              display: "flex",
              alignItems: "center",
              gap: 3,
            }}
          >
            {isFilled ? <Check size={10} /> : <AlertCircle size={10} />}
            {isFilled ? "Required — filled" : "Required"}
          </span>
        )}
        {hasError && (
          <span
            style={{
              fontSize: 10.5,
              color: "#DC2626",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <AlertCircle size={10} />
            This field is required
          </span>
        )}
        {isIncludedInVariant && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: "#1D4ED8",
              background: "#DBEAFE",
              border: "0.5px solid #93C5FD",
              borderRadius: 20,
              padding: "1px 7px",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            Variant field
          </span>
        )}
      </div>
    </div>
  );
});

/* ─── Main SpecAttributeManager ─────────────────────────────────────────── */

export default function SpecAttributeManager({
  categoryId,
  attributes,
  setAttributes,
  categoryAttributes,
  requiredAttributes,
  onVariantFieldChange,
  validationErrors,
  onRequestMissing,
  brandId,
  onBrandChange,
}: Props) {
  const [fieldValues, setFieldValues] = useState<Record<string, FieldValue>>({});
  const [optionalExpanded, setOptionalExpanded] = useState(true);

  useEffect(() => {
    if (!categoryId || categoryAttributes.length === 0) {
      setFieldValues({});
      return;
    }

    const initialValues: Record<string, FieldValue> = {};

    categoryAttributes.forEach((attr) => {
      const existingAttribute = attributes.find((a) => a.attributeId === attr.id);

      if (existingAttribute) {
        let value: any = "";

        if (
          existingAttribute.valueString !== undefined &&
          existingAttribute.valueString !== null &&
          existingAttribute.valueString !== ""
        ) {
          value = existingAttribute.valueString;
        } else if (
          existingAttribute.valueNumber !== undefined &&
          existingAttribute.valueNumber !== null
        ) {
          value = existingAttribute.valueNumber;
        } else if (
          existingAttribute.valueBoolean !== undefined &&
          existingAttribute.valueBoolean !== null
        ) {
          value = existingAttribute.valueBoolean;
        } else if (
          existingAttribute.attributeValueId !== undefined &&
          existingAttribute.attributeValueId !== null &&
          existingAttribute.attributeValueId !== ""
        ) {
          const selectedValue = attr.values?.find(
            (v) => v.id === existingAttribute.attributeValueId
          );
          value = selectedValue?.value || existingAttribute.attributeValueId;
        }

        initialValues[attr.id] = {
          value,
          includeInVariant: existingAttribute.isForVariant || false,
        };

        if ((attr.type === "SELECT" || attr.type === "MULTISELECT") && attr.values) {
          const allValues = attr.values.map((v) => v.value);
          onVariantFieldChange(
            attr.id,
            attr.name,
            JSON.stringify(allValues),
            existingAttribute.isForVariant || false
          );
        } else {
          onVariantFieldChange(attr.id, attr.name, value, existingAttribute.isForVariant || false);
        }
      } else {
        initialValues[attr.id] = { value: "", includeInVariant: false };

        if ((attr.type === "SELECT" || attr.type === "MULTISELECT") && attr.values) {
          const allValues = attr.values.map((v) => v.value);
          onVariantFieldChange(attr.id, attr.name, JSON.stringify(allValues), false);
        } else {
          onVariantFieldChange(attr.id, attr.name, "", false);
        }
      }
    });

    setFieldValues(initialValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId, categoryAttributes]);

  const handleValueChange = useCallback(
    (id: string, name: string, value: any, attribute: Attribute) => {
      let finalValue = value;

      if ((attribute.type === "SELECT" || attribute.type === "MULTISELECT") && value) {
        const selectedOption = attribute.values?.find((v) => v.id === value);
        if (selectedOption) finalValue = selectedOption.value;
      }

      setFieldValues((prev) => ({
        ...prev,
        [id]: { ...prev[id], value: finalValue },
      }));

      setAttributes(
        (() => {
          const shouldInclude = fieldValues[id]?.includeInVariant ?? false;

          if (finalValue !== undefined && finalValue !== null && finalValue !== "") {
            const attributeInput: ProductAttributeInput = {
              attributeId: id,
              isForVariant: shouldInclude,
            };

            switch (attribute.type) {
              case "TEXT":
                attributeInput.valueString = finalValue;
                break;
              case "NUMBER":
                attributeInput.valueNumber =
                  typeof finalValue === "number" ? finalValue : parseFloat(finalValue);
                break;
              case "BOOLEAN":
                attributeInput.valueBoolean = !!finalValue;
                break;
              case "SELECT":
              case "MULTISELECT": {
                const selectedOption = attribute.values?.find((v) => v.value === finalValue);
                if (selectedOption) attributeInput.attributeValueId = selectedOption.id;
                else attributeInput.valueString = finalValue;
                break;
              }
            }

            const filtered = attributes.filter((a) => a.attributeId !== id);
            return [...filtered, attributeInput];
          }
          return attributes.filter((a) => a.attributeId !== id);
        })()
      );

      const shouldInclude = fieldValues[id]?.includeInVariant ?? false;
      if ((attribute.type === "SELECT" || attribute.type === "MULTISELECT") && attribute.values) {
        const allValues = attribute.values.map((v) => v.value);
        onVariantFieldChange(id, name, JSON.stringify(allValues), shouldInclude);
      } else {
        onVariantFieldChange(id, name, finalValue, shouldInclude);
      }
    },
    [fieldValues, onVariantFieldChange, setAttributes, attributes]
  );

  const handleIncludeInVariantChange = useCallback(
    (id: string, name: string, include: boolean, attribute: Attribute) => {
      const currentValue = fieldValues[id];

      setFieldValues((prev) => ({
        ...prev,
        [id]: { ...prev[id], includeInVariant: include },
      }));

      if (include && currentValue?.value) {
        const attributeInput: ProductAttributeInput = {
          attributeId: id,
          isForVariant: include,
        };

        switch (attribute.type) {
          case "TEXT":
            attributeInput.valueString = currentValue.value;
            break;
          case "NUMBER":
            attributeInput.valueNumber =
              typeof currentValue.value === "number"
                ? currentValue.value
                : parseFloat(currentValue.value);
            break;
          case "BOOLEAN":
            attributeInput.valueBoolean = !!currentValue.value;
            break;
          case "SELECT":
          case "MULTISELECT": {
            const selectedOption = attribute.values?.find((v) => v.value === currentValue.value);
            attributeInput.attributeValueId = selectedOption?.id || currentValue.value;
            break;
          }
        }

        const filtered = attributes.filter((a) => a.attributeId !== id);
        setAttributes([...filtered, attributeInput]);
      } else if (!include) {
        setAttributes(
          attributes.map((attr) => (attr.attributeId === id ? { ...attr, isForVariant: false } : attr))
        );
      }

      if ((attribute.type === "SELECT" || attribute.type === "MULTISELECT") && attribute.values) {
        const allValues = attribute.values.map((v) => v.value);
        onVariantFieldChange(id, name, JSON.stringify(allValues), include);
      } else {
        onVariantFieldChange(id, name, currentValue?.value || "", include);
      }
    },
    [fieldValues, setAttributes, onVariantFieldChange, attributes]
  );

  const isAttributeFilled = useCallback(
    (attributeId: string): boolean => {
      const fieldValue = fieldValues[attributeId];
      if (!fieldValue) return false;
      const value = fieldValue.value;
      if (typeof value === "string") return value.trim() !== "";
      if (typeof value === "number") return true;
      if (typeof value === "boolean") return true;
      return false;
    },
    [fieldValues]
  );

  const renderInputField = useCallback(
    (attribute: Attribute) => {
      const currentValue = fieldValues[attribute.id]?.value || "";
      const isRequired = requiredAttributes.some((attr) => attr.id === attribute.id);
      const hasError = validationErrors[`attribute-${attribute.id}`];
      const isFilled = isAttributeFilled(attribute.id);
      const isSkuField = /sku/i.test(attribute.name);

      const baseInputStyle: React.CSSProperties = {
        fontSize: 13,
        borderColor: hasError ? "#FCA5A5" : isFilled ? "#6EE7B7" : "#BFDBFE",
        background: hasError ? "#FEF2F2" : isFilled ? "#F0FDF4" : "#FFFFFF",
      };

      switch (attribute.type) {
        case "SELECT":
        case "MULTISELECT": {
          const selectedOption = attribute.values?.find(
            (v) => v.value === currentValue || v.id === currentValue
          );
          const selectedId = selectedOption?.id || "";

          return (
            <Select
              value={selectedId}
              onValueChange={(selectedId) => {
                const opt = attribute.values?.find((v) => v.id === selectedId);
                handleValueChange(attribute.id, attribute.name, opt?.value || "", attribute);
              }}
            >
              <SelectTrigger
                style={{
                  fontSize: 13,
                  borderColor: hasError ? "#FCA5A5" : isFilled ? "#6EE7B7" : "#BFDBFE",
                  background: hasError ? "#FEF2F2" : isFilled ? "#F0FDF4" : "#FFFFFF",
                }}
              >
                <SelectValue placeholder={`Select ${attribute.name}${isRequired ? " *" : ""}`} />
              </SelectTrigger>
              <SelectContent>
                {(attribute.values || []).map((option: AttributeValue) => (
                  <SelectItem key={option.id} value={option.id} style={{ fontSize: 13 }}>
                    {option.value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        }

        case "BOOLEAN":
          return (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 10px",
                borderRadius: 8,
                border: `0.5px solid ${hasError ? "#FCA5A5" : isFilled ? "#6EE7B7" : "#BFDBFE"}`,
                background: hasError ? "#FEF2F2" : isFilled ? "#F0FDF4" : "#FFFFFF",
              }}
            >
              <Checkbox
                id={`${attribute.id}-checkbox`}
                checked={!!currentValue}
                onCheckedChange={(checked) =>
                  handleValueChange(attribute.id, attribute.name, checked, attribute)
                }
                style={{ width: 16, height: 16, accentColor: "#1D4ED8" }}
              />
              <label
                htmlFor={`${attribute.id}-checkbox`}
                style={{ fontSize: 13, color: "#0F172A", cursor: "pointer" }}
              >
                {currentValue ? "Yes" : "No"}
                {isRequired && <span style={{ color: "#DC2626", marginLeft: 3 }}>*</span>}
              </label>
            </div>
          );

        case "NUMBER":
          return (
            <div style={{ position: "relative" }}>
              <Input
                type="number"
                value={currentValue}
                onChange={(e) => {
                  const value = e.target.value === "" ? "" : parseFloat(e.target.value);
                  handleValueChange(attribute.id, attribute.name, value, attribute);
                }}
                placeholder={`Enter ${attribute.name}${attribute.unit ? ` (${attribute.unit})` : ""}${isRequired ? " *" : ""}`}
                style={{ ...baseInputStyle, paddingRight: isFilled ? 30 : 12 }}
              />
              {isFilled && (
                <Check
                  size={12}
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
          );

        case "TEXT":
        default:
          return (
            <div style={{ position: "relative", display: "flex", gap: 6 }}>
              <div style={{ position: "relative", flex: 1 }}>
                <Input
                  value={currentValue}
                  onChange={(e) =>
                    handleValueChange(attribute.id, attribute.name, e.target.value, attribute)
                  }
                  placeholder={`Enter ${attribute.name}${isRequired ? " *" : ""}`}
                  style={{
                    ...baseInputStyle,
                    paddingRight: isFilled && !isSkuField ? 30 : 12,
                  }}
                />
                {isFilled && !isSkuField && (
                  <Check
                    size={12}
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

              {isSkuField && (
                <button
                  type="button"
                  title="Generate a unique SKU (timestamp + random suffix) so it won't clash with existing SKUs"
                  onClick={() =>
                    handleValueChange(
                      attribute.id,
                      attribute.name,
                      generateUniqueSKU(categoryId, attribute.name),
                      attribute
                    )
                  }
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "0 10px",
                    fontSize: 11.5,
                    fontWeight: 600,
                    color: "#1D4ED8",
                    background: "#DBEAFE",
                    border: "0.5px solid #93C5FD",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    whiteSpace: "nowrap",
                  }}
                >
                  <RefreshCw size={11} /> Generate
                </button>
              )}
            </div>
          );
      }
    },
    [fieldValues, handleValueChange, requiredAttributes, validationErrors, isAttributeFilled, categoryId]
  );

  const filledRequiredCount = useMemo(
    () => requiredAttributes.filter((attr) => isAttributeFilled(attr.id)).length,
    [requiredAttributes, isAttributeFilled]
  );

  const optionalAttributes = useMemo(
    () => categoryAttributes.filter((attr) => !requiredAttributes.some((req) => req.id === attr.id)),
    [categoryAttributes, requiredAttributes]
  );

  const renderFieldRow = (attr: Attribute) => {
    const isRequired = requiredAttributes.some((a) => a.id === attr.id);
    const hasError = !!validationErrors[`attribute-${attr.id}`];
    const isFilled = isAttributeFilled(attr.id);
    const isIncludedInVariant = fieldValues[attr.id]?.includeInVariant || false;

    return (
      <FieldRow
        key={attr.id}
        attribute={attr}
        isRequired={isRequired}
        hasError={hasError}
        isFilled={isFilled}
        isIncludedInVariant={isIncludedInVariant}
        hint={getFieldHint(attr, isRequired)}
        inputElement={renderInputField(attr)}
        onIncludeChange={(checked) =>
          handleIncludeInVariantChange(attr.id, attr.name, checked, attr)
        }
      />
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {categoryId && onRequestMissing && (
        <button
          onClick={onRequestMissing}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            background: "none",
            border: "1px solid #FDE68A",
            borderRadius: 20,
            padding: "4px 10px",
            fontSize: 11,
            fontWeight: 600,
            color: "#92400E",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          <PlusCircle size={11} /> Missing attribute or value?
        </button>
      )}

      <BrandSelector
        brandId={brandId}
        onBrandChange={onBrandChange}
        hasError={!!validationErrors.brandSelector}
      />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: "#DBEAFE",
              border: "0.5px solid #93C5FD",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Layers size={14} color="#1D4ED8" />
          </div>
          <span style={{ fontSize: 13.5, fontWeight: 700, color: "#0D1B2E", letterSpacing: "-0.2px" }}>
            Product specifications
          </span>
        </div>

        {categoryId && requiredAttributes.length > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 10px",
              borderRadius: 20,
              background: filledRequiredCount === requiredAttributes.length ? "#D1FAE5" : "#FEF2F2",
              border: `0.5px solid ${
                filledRequiredCount === requiredAttributes.length ? "#6EE7B7" : "#FCA5A5"
              }`,
              fontSize: 11.5,
              fontWeight: 600,
              color: filledRequiredCount === requiredAttributes.length ? "#059669" : "#DC2626",
            }}
          >
            {filledRequiredCount === requiredAttributes.length ? (
              <Check size={11} />
            ) : (
              <AlertCircle size={11} />
            )}
            {filledRequiredCount}/{requiredAttributes.length} required filled
          </div>
        )}
      </div>

      {!categoryId && (
        <div
          style={{
            padding: "32px 0",
            textAlign: "center",
            border: "0.5px dashed #BFDBFE",
            borderRadius: 10,
            background: "#F8FAFC",
          }}
        >
          <Layers size={24} color="#BFDBFE" style={{ margin: "0 auto 8px" }} />
          <p style={{ fontSize: 13, color: "#64748B" }}>Select a category to view attributes</p>
        </div>
      )}

      {categoryId && (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {requiredAttributes.length > 0 && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                <div
                  style={{ width: 6, height: 6, borderRadius: "50%", background: "#DC2626", flexShrink: 0 }}
                />
                <span
                  style={{
                    fontSize: 11.5,
                    fontWeight: 700,
                    color: "#3D5068",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  Required attributes
                </span>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                  gap: 10,
                }}
              >
                {requiredAttributes.map((attr) => renderFieldRow(attr))}
              </div>
            </div>
          )}

          {optionalAttributes.length > 0 && (
            <div>
              <button
                onClick={() => setOptionalExpanded((p) => !p)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: optionalExpanded ? 10 : 0,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  fontFamily: "inherit",
                }}
              >
                <div
                  style={{ width: 6, height: 6, borderRadius: "50%", background: "#93C5FD", flexShrink: 0 }}
                />
                <span
                  style={{
                    fontSize: 11.5,
                    fontWeight: 700,
                    color: "#3D5068",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  Additional attributes
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: "#64748B",
                    background: "#F1F5F9",
                    border: "0.5px solid #CBD5E1",
                    borderRadius: 20,
                    padding: "1px 7px",
                  }}
                >
                  {optionalAttributes.length}
                </span>
                {optionalExpanded ? (
                  <ChevronUp size={13} color="#64748B" />
                ) : (
                  <ChevronDown size={13} color="#64748B" />
                )}
              </button>

              {optionalExpanded && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                    gap: 10,
                  }}
                >
                  {optionalAttributes.map((attr) => renderFieldRow(attr))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <style>{`
        @media (max-width: 640px) {
          .spec-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}