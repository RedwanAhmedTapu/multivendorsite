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
import { Card } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
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
  const [fieldValues, setFieldValues] = useState<Record<string, FieldValue>>(
    {}
  );

  // Initialize field values when category changes
  useEffect(() => {
    if (!categoryId || categoryAttributes.length === 0) {
      setFieldValues({});
      return;
    }

    const initialValues: Record<string, FieldValue> = {};

    categoryAttributes.forEach((attr) => {
      const existingAttribute = attributes.find(
        (a) => a.attributeId === attr.id
      );

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
          const allValues = attr.values.map(v => v.value);
          const allValuesJson = JSON.stringify(allValues);
          
          onVariantFieldChange(
            attr.id,
            attr.name,
            allValuesJson,
            existingAttribute.isForVariant || false
          );
        } else {
          onVariantFieldChange(
            attr.id,
            attr.name,
            value,
            existingAttribute.isForVariant || false
          );
        }
      } else {
        initialValues[attr.id] = {
          value: "",
          includeInVariant: false,
        };
        
        if ((attr.type === "SELECT" || attr.type === "MULTISELECT") && attr.values) {
          const allValues = attr.values.map(v => v.value);
          const allValuesJson = JSON.stringify(allValues);
          
          onVariantFieldChange(
            attr.id,
            attr.name,
            allValuesJson,
            false
          );
        } else {
          onVariantFieldChange(
            attr.id,
            attr.name,
            "",
            false
          );
        }
      }
    });

    setFieldValues(initialValues);
  }, [categoryId, categoryAttributes, attributes, onVariantFieldChange]);

  // Handle value change
  const handleValueChange = useCallback(
    (
      id: string,
      name: string,
      value: any,
      attribute: Attribute
    ) => {
      let finalValue = value;

      if (
        (attribute.type === "SELECT" || attribute.type === "MULTISELECT") &&
        value
      ) {
        const selectedOption = attribute.values?.find((v) => v.id === value);
        if (selectedOption) {
          finalValue = selectedOption.value;
        }
      }

      setFieldValues((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          value: finalValue,
        },
      }));

      const shouldInclude = fieldValues[id]?.includeInVariant ?? false;

      if (
        finalValue !== undefined &&
        finalValue !== null &&
        finalValue !== ""
      ) {
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
              typeof finalValue === "number"
                ? finalValue
                : parseFloat(finalValue);
            break;
          case "BOOLEAN":
            attributeInput.valueBoolean = !!finalValue;
            break;
          case "SELECT":
          case "MULTISELECT":
            const selectedOption = attribute.values?.find(
              (v) => v.value === finalValue
            );
            if (selectedOption) {
              attributeInput.attributeValueId = selectedOption.id;
            } else {
              attributeInput.valueString = finalValue;
            }
            break;
        }

        const filtered = attributes.filter((a) => a.attributeId !== id);
        setAttributes([...filtered, attributeInput]);
      } else {
        setAttributes(attributes.filter((a) => a.attributeId !== id));
      }

      if ((attribute.type === "SELECT" || attribute.type === "MULTISELECT") && attribute.values) {
        const allValues = attribute.values.map(v => v.value);
        const allValuesJson = JSON.stringify(allValues);
        
        onVariantFieldChange(
          id,
          name,
          allValuesJson,
          shouldInclude
        );
      } else {
        onVariantFieldChange(
          id,
          name,
          finalValue,
          shouldInclude
        );
      }
    },
    [fieldValues, onVariantFieldChange, setAttributes, attributes]
  );

  // Handle Include in Variant toggle
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
          case "MULTISELECT":
            const selectedOption = attribute.values?.find(
              (v) => v.value === currentValue.value
            );
            attributeInput.attributeValueId = selectedOption?.id || currentValue.value;
            break;
        }

        const filtered = attributes.filter((a) => a.attributeId !== id);
        setAttributes([...filtered, attributeInput]);
      } else if (!include) {
        setAttributes(
          attributes.map((attr) =>
            attr.attributeId === id ? { ...attr, isForVariant: false } : attr
          )
        );
      }
      
      if ((attribute.type === "SELECT" || attribute.type === "MULTISELECT") && attribute.values) {
        const allValues = attribute.values.map(v => v.value);
        const allValuesJson = JSON.stringify(allValues);
        
        onVariantFieldChange(
          id,
          name,
          allValuesJson,
          include
        );
      } else {
        onVariantFieldChange(
          id,
          name,
          currentValue?.value || "",
          include
        );
      }
    },
    [fieldValues, setAttributes, onVariantFieldChange, attributes]
  );

  // Check if an attribute is filled
  const isAttributeFilled = useCallback(
    (attributeId: string): boolean => {
      const fieldValue = fieldValues[attributeId];
      if (!fieldValue) return false;

      const value = fieldValue.value;

      if (typeof value === "string") {
        return value.trim() !== "";
      }
      if (typeof value === "number") {
        return true;
      }
      if (typeof value === "boolean") {
        return true;
      }

      return false;
    },
    [fieldValues]
  );

  // Render input field based on type
  const renderInputField = useCallback(
    (attribute: Attribute) => {
      const currentValue = fieldValues[attribute.id]?.value || "";
      const isRequired = requiredAttributes.some(
        (attr) => attr.id === attribute.id
      );
      const hasError = validationErrors[`attribute-${attribute.id}`];
      const isFilled = isAttributeFilled(attribute.id);
      
      switch (attribute.type) {
        case "SELECT":
        case "MULTISELECT":
          const selectedOption = attribute.values?.find(
            (v) => v.value === currentValue || v.id === currentValue
          );
          const selectedId = selectedOption?.id || "";

          return (
            <Select
              value={selectedId}
              onValueChange={(selectedId) => {
                const selectedOption = attribute.values?.find(
                  (v) => v.id === selectedId
                );
                handleValueChange(
                  attribute.id,
                  attribute.name,
                  selectedOption?.value || "",
                  attribute
                );
              }}
            >
              <SelectTrigger
                className={`w-full ${hasError ? "border-red-500" : ""} ${
                  isFilled ? "bg-green-50" : ""
                } text-sm`}
              >
                <SelectValue
                  placeholder={`Select ${attribute.name}${
                    isRequired ? " *" : ""
                  }`}
                />
              </SelectTrigger>
              <SelectContent>
                {(attribute.values || []).map((option: AttributeValue) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        case "BOOLEAN":
          return (
            <div
              className={`flex items-center space-x-2 ${
                hasError ? "border-red-500 border-2 rounded p-1" : ""
              } ${isFilled ? "bg-green-50 p-1 rounded" : ""}`}
            >
              <Checkbox
                id={`${attribute.id}-checkbox`}
                checked={!!currentValue}
                onCheckedChange={(checked) => {
                  handleValueChange(
                    attribute.id,
                    attribute.name,
                    checked,
                    attribute
                  );
                }}
                className="h-4 w-4"
              />
              <label htmlFor={`${attribute.id}-checkbox`} className="text-sm">
                {currentValue ? "Yes" : "No"}{" "}
                {isRequired && <span className="text-red-500">*</span>}
              </label>
            </div>
          );
        case "NUMBER":
          return (
            <Input
              type="number"
              value={currentValue}
              onChange={(e) => {
                const value =
                  e.target.value === "" ? "" : parseFloat(e.target.value);
                handleValueChange(
                  attribute.id,
                  attribute.name,
                  value,
                  attribute
                );
              }}
              placeholder={`Enter ${attribute.name}${
                attribute.unit ? ` (${attribute.unit})` : ""
              }${isRequired ? " *" : ""}`}
              className={`w-full text-sm ${hasError ? "border-red-500" : ""} ${
                isFilled ? "bg-green-50" : ""
              }`}
            />
          );
        case "TEXT":
        default:
          return (
            <Input
              value={currentValue}
              onChange={(e) => {
                handleValueChange(
                  attribute.id,
                  attribute.name,
                  e.target.value,
                  attribute
                );
              }}
              placeholder={`Enter ${attribute.name}${isRequired ? " *" : ""}`}
              className={`w-full text-sm ${hasError ? "border-red-500" : ""} ${
                isFilled ? "bg-green-50" : ""
              }`}
            />
          );
      }
    },
    [
      fieldValues,
      handleValueChange,
      requiredAttributes,
      validationErrors,
      isAttributeFilled,
    ]
  );

  // Field Row Component - Compact form row
  const FieldRow = React.memo(({ attribute }: { attribute: Attribute }) => {
    const isRequired = requiredAttributes.some(
      (attr) => attr.id === attribute.id
    );
    const hasError = validationErrors[`attribute-${attribute.id}`];
    const isFilled = isAttributeFilled(attribute.id);
    const isIncludedInVariant =
      fieldValues[attribute.id]?.includeInVariant || false;

    return (
      <div
        id={`attribute-${attribute.id}`}
        className={`space-y-1.5 p-3 rounded border transition-all ${
          hasError ? "border-red-500 bg-red-50" : 
          isFilled ? "border-green-200 bg-green-50" : 
          "border-gray-200"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">
              {attribute.name}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </span>
            {isFilled && (
              <span className="text-xs text-green-600 font-bold">✓</span>
            )}
            {attribute.unit && (
              <span className="text-xs text-gray-500 ml-1">
                ({attribute.unit})
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <span className={`text-xs ${
              isIncludedInVariant ? "text-blue-600 font-medium" : "text-gray-500"
            }`}>
              {isIncludedInVariant ? "Variant" : "Include"}
            </span>
            <Switch
              checked={isIncludedInVariant}
              onCheckedChange={(checked) =>
                handleIncludeInVariantChange(
                  attribute.id,
                  attribute.name,
                  checked,
                  attribute
                )
              }
              className="h-5 w-9"
            />
          </div>
        </div>
        
        <div className="space-y-1">
          {renderInputField(attribute)}
          
          <div className="flex justify-between items-center text-xs">
            {isRequired && (
              <span className={`${isFilled ? "text-green-600" : "text-red-500"}`}>
                {isFilled ? "✓ Filled" : "Required"}
              </span>
            )}
            {hasError && (
              <span className="text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                This field is required
              </span>
            )}
          </div>
        </div>
      </div>
    );
  });

  FieldRow.displayName = "FieldRow";

  // Calculate filled required attributes
  const filledRequiredCount = useMemo(() => {
    return requiredAttributes.filter((attr) => isAttributeFilled(attr.id))
      .length;
  }, [requiredAttributes, isAttributeFilled]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Product Specifications</h3>
        {categoryId && requiredAttributes.length > 0 && (
          <div className="text-sm text-gray-600">
            <span className="font-medium">Required: </span>
            <span className={`px-2 py-1 rounded ${
              filledRequiredCount === requiredAttributes.length 
                ? "bg-green-100 text-green-800" 
                : "bg-red-100 text-red-800"
            }`}>
              {filledRequiredCount}/{requiredAttributes.length} filled
            </span>
          </div>
        )}
      </div>

      {!categoryId && (
        <div className="text-center py-6 border border-dashed border-gray-300 rounded-lg bg-gray-50">
          <p className="text-gray-500">Please select a category to view attributes</p>
        </div>
      )}

      {categoryId && (
        <div className="space-y-4">
          {requiredAttributes.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-gray-700 flex items-center gap-2">
                <span className="text-red-500">●</span>
                Required Attributes
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {requiredAttributes.map((attr) => (
                  <FieldRow key={attr.id} attribute={attr} />
                ))}
              </div>
            </div>
          )}

          {categoryAttributes.length > requiredAttributes.length && (
            <div className="space-y-2">
              <h4 className="font-medium text-gray-700">Additional Attributes</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categoryAttributes
                  .filter(attr => !requiredAttributes.some(req => req.id === attr.id))
                  .map((attr) => (
                    <FieldRow key={attr.id} attribute={attr} />
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}