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
import { AlertCircle, Check, Layers, ChevronDown, ChevronUp } from "lucide-react";
import { Attribute, AttributeValue } from "@/types/type";
import { ProductAttributeInput } from "@/types/product";

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
}

interface FieldValue {
  value: any;
  includeInVariant: boolean;
}

export default function SpecAttributeManager({
  categoryId,
  attributes,
  setAttributes,
  categoryAttributes,
  requiredAttributes,
  onVariantFieldChange,
  validationErrors,
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

        if (existingAttribute.valueString !== undefined && existingAttribute.valueString !== null && existingAttribute.valueString !== "") {
          value = existingAttribute.valueString;
        } else if (existingAttribute.valueNumber !== undefined && existingAttribute.valueNumber !== null) {
          value = existingAttribute.valueNumber;
        } else if (existingAttribute.valueBoolean !== undefined && existingAttribute.valueBoolean !== null) {
          value = existingAttribute.valueBoolean;
        } else if (existingAttribute.attributeValueId !== undefined && existingAttribute.attributeValueId !== null && existingAttribute.attributeValueId !== "") {
          const selectedValue = attr.values?.find((v) => v.id === existingAttribute.attributeValueId);
          value = selectedValue?.value || existingAttribute.attributeValueId;
        }

        initialValues[attr.id] = { value, includeInVariant: existingAttribute.isForVariant || false };

        if ((attr.type === "SELECT" || attr.type === "MULTISELECT") && attr.values) {
          const allValues = attr.values.map((v) => v.value);
          onVariantFieldChange(attr.id, attr.name, JSON.stringify(allValues), existingAttribute.isForVariant || false);
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
  }, [categoryId, categoryAttributes, attributes, onVariantFieldChange]);

  const handleValueChange = useCallback(
    (id: string, name: string, value: any, attribute: Attribute) => {
      let finalValue = value;

      if ((attribute.type === "SELECT" || attribute.type === "MULTISELECT") && value) {
        const selectedOption = attribute.values?.find((v) => v.id === value);
        if (selectedOption) finalValue = selectedOption.value;
      }

      setFieldValues((prev) => ({ ...prev, [id]: { ...prev[id], value: finalValue } }));

      const shouldInclude = fieldValues[id]?.includeInVariant ?? false;

      if (finalValue !== undefined && finalValue !== null && finalValue !== "") {
        const attributeInput: ProductAttributeInput = { attributeId: id, isForVariant: shouldInclude };

        switch (attribute.type) {
          case "TEXT":
            attributeInput.valueString = finalValue;
            break;
          case "NUMBER":
            attributeInput.valueNumber = typeof finalValue === "number" ? finalValue : parseFloat(finalValue);
            break;
          case "BOOLEAN":
            attributeInput.valueBoolean = !!finalValue;
            break;
          case "SELECT":
          case "MULTISELECT":
            const selectedOption = attribute.values?.find((v) => v.value === finalValue);
            if (selectedOption) attributeInput.attributeValueId = selectedOption.id;
            else attributeInput.valueString = finalValue;
            break;
        }

        const filtered = attributes.filter((a) => a.attributeId !== id);
        setAttributes([...filtered, attributeInput]);
      } else {
        setAttributes(attributes.filter((a) => a.attributeId !== id));
      }

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

      setFieldValues((prev) => ({ ...prev, [id]: { ...prev[id], includeInVariant: include } }));

      if (include && currentValue?.value) {
        const attributeInput: ProductAttributeInput = { attributeId: id, isForVariant: include };

        switch (attribute.type) {
          case "TEXT":
            attributeInput.valueString = currentValue.value;
            break;
          case "NUMBER":
            attributeInput.valueNumber = typeof currentValue.value === "number" ? currentValue.value : parseFloat(currentValue.value);
            break;
          case "BOOLEAN":
            attributeInput.valueBoolean = !!currentValue.value;
            break;
          case "SELECT":
          case "MULTISELECT":
            const selectedOption = attribute.values?.find((v) => v.value === currentValue.value);
            attributeInput.attributeValueId = selectedOption?.id || currentValue.value;
            break;
        }

        const filtered = attributes.filter((a) => a.attributeId !== id);
        setAttributes([...filtered, attributeInput]);
      } else if (!include) {
        setAttributes(attributes.map((attr) => attr.attributeId === id ? { ...attr, isForVariant: false } : attr));
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

      const baseInputStyle: React.CSSProperties = {
        fontSize: 13,
        borderColor: hasError ? "#FCA5A5" : isFilled ? "#6EE7B7" : "#BFDBFE",
        background: hasError ? "#FEF2F2" : isFilled ? "#F0FDF4" : "#FFFFFF",
      };

      switch (attribute.type) {
        case "SELECT":
        case "MULTISELECT":
          const selectedOption = attribute.values?.find((v) => v.value === currentValue || v.id === currentValue);
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
                onCheckedChange={(checked) => handleValueChange(attribute.id, attribute.name, checked, attribute)}
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
                <Check size={12} color="#10B981" style={{ position: "absolute", right: 9, top: "50%", transform: "translateY(-50%)" }} />
              )}
            </div>
          );

        case "TEXT":
        default:
          return (
            <div style={{ position: "relative" }}>
              <Input
                value={currentValue}
                onChange={(e) => handleValueChange(attribute.id, attribute.name, e.target.value, attribute)}
                placeholder={`Enter ${attribute.name}${isRequired ? " *" : ""}`}
                style={{ ...baseInputStyle, paddingRight: isFilled ? 30 : 12 }}
              />
              {isFilled && (
                <Check size={12} color="#10B981" style={{ position: "absolute", right: 9, top: "50%", transform: "translateY(-50%)" }} />
              )}
            </div>
          );
      }
    },
    [fieldValues, handleValueChange, requiredAttributes, validationErrors, isAttributeFilled]
  );

  const FieldRow = React.memo(({ attribute }: { attribute: Attribute }) => {
    const isRequired = requiredAttributes.some((attr) => attr.id === attribute.id);
    const hasError = validationErrors[`attribute-${attribute.id}`];
    const isFilled = isAttributeFilled(attribute.id);
    const isIncludedInVariant = fieldValues[attribute.id]?.includeInVariant || false;

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
        {/* Top row: label + variant toggle */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#3D5068" }}>
              {attribute.name}
              {isRequired && <span style={{ color: "#DC2626", marginLeft: 3 }}>*</span>}
            </span>
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

          {/* Variant toggle */}
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
            <Switch
              checked={isIncludedInVariant}
              onCheckedChange={(checked) =>
                handleIncludeInVariantChange(attribute.id, attribute.name, checked, attribute)
              }
            />
          </div>
        </div>

        {/* Input */}
        <div style={{ marginBottom: 6 }}>{renderInputField(attribute)}</div>

        {/* Bottom row: status */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 4 }}>
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

  FieldRow.displayName = "FieldRow";

  const filledRequiredCount = useMemo(
    () => requiredAttributes.filter((attr) => isAttributeFilled(attr.id)).length,
    [requiredAttributes, isAttributeFilled]
  );

  const optionalAttributes = useMemo(
    () => categoryAttributes.filter((attr) => !requiredAttributes.some((req) => req.id === attr.id)),
    [categoryAttributes, requiredAttributes]
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* ── Header row ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
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
              border: `0.5px solid ${filledRequiredCount === requiredAttributes.length ? "#6EE7B7" : "#FCA5A5"}`,
              fontSize: 11.5,
              fontWeight: 600,
              color: filledRequiredCount === requiredAttributes.length ? "#059669" : "#DC2626",
            }}
          >
            {filledRequiredCount === requiredAttributes.length
              ? <Check size={11} />
              : <AlertCircle size={11} />}
            {filledRequiredCount}/{requiredAttributes.length} required filled
          </div>
        )}
      </div>

      {/* ── Empty state ── */}
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
          <p style={{ fontSize: 13, color: "#64748B" }}>
            Select a category to view attributes
          </p>
        </div>
      )}

      {categoryId && (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

          {/* ── Required attributes ── */}
          {requiredAttributes.length > 0 && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#DC2626", flexShrink: 0 }} />
                <span style={{ fontSize: 11.5, fontWeight: 700, color: "#3D5068", textTransform: "uppercase", letterSpacing: "0.06em" }}>
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
                {requiredAttributes.map((attr) => (
                  <FieldRow key={attr.id} attribute={attr} />
                ))}
              </div>
            </div>
          )}

          {/* ── Optional attributes (collapsible) ── */}
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
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#93C5FD", flexShrink: 0 }} />
                <span style={{ fontSize: 11.5, fontWeight: 700, color: "#3D5068", textTransform: "uppercase", letterSpacing: "0.06em" }}>
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
                {optionalExpanded
                  ? <ChevronUp size={13} color="#64748B" />
                  : <ChevronDown size={13} color="#64748B" />}
              </button>

              {optionalExpanded && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                    gap: 10,
                  }}
                >
                  {optionalAttributes.map((attr) => (
                    <FieldRow key={attr.id} attribute={attr} />
                  ))}
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