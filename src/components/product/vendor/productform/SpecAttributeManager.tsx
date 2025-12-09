"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  onVariantFieldChange: (fieldId: string, fieldName: string, value: any, displayValue: string, includeInVariant: boolean) => void;
  validationErrors: Record<string, boolean>;
}

interface FieldValue {
  value: any;
  displayValue: string;
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

  // Initialize field values when category changes
  useEffect(() => {
    if (!categoryId || categoryAttributes.length === 0) {
      setFieldValues({});
      return;
    }

    const initialValues: Record<string, FieldValue> = {};
    
    categoryAttributes.forEach(attr => {
      // Check if this attribute already has a value in the attributes array
      const existingAttribute = attributes.find(a => a.attributeId === attr.id);
      
      if (existingAttribute) {
        let value: any = '';
        let displayValue: string = '';
        
        // Extract value based on type
        if (existingAttribute.valueString !== undefined && existingAttribute.valueString !== null && existingAttribute.valueString !== '') {
          value = existingAttribute.valueString;
          displayValue = existingAttribute.valueString;
        } else if (existingAttribute.valueNumber !== undefined && existingAttribute.valueNumber !== null) {
          value = existingAttribute.valueNumber;
          displayValue = existingAttribute.valueNumber.toString();
        } else if (existingAttribute.valueBoolean !== undefined && existingAttribute.valueBoolean !== null) {
          value = existingAttribute.valueBoolean;
          displayValue = existingAttribute.valueBoolean ? 'Yes' : 'No';
        } else if (existingAttribute.attributeValueId !== undefined && existingAttribute.attributeValueId !== null && existingAttribute.attributeValueId !== '') {
          value = existingAttribute.attributeValueId;
          const selectedValue = attr.values?.find(v => v.id === existingAttribute.attributeValueId);
          displayValue = selectedValue?.value || '';
        }
        
        initialValues[attr.id] = { 
          value, 
          displayValue,
          includeInVariant: existingAttribute.isForVariant || false 
        };
      } else {
        initialValues[attr.id] = { 
          value: '', 
          displayValue: '',
          includeInVariant: false 
        };
      }
    });
    
    setFieldValues(initialValues);
  }, [categoryId]); // Only re-initialize when category changes

  // Handle value change
  const handleValueChange = useCallback((id: string, name: string, value: any, displayValue: string, attribute: Attribute) => {
    // Update field values immediately
    setFieldValues(prev => ({
      ...prev,
      [id]: { 
        ...prev[id], 
        value, 
        displayValue 
      },
    }));

    // Get current includeInVariant value
    const shouldInclude = fieldValues[id]?.includeInVariant ?? false;
    
    // Always update attributes array with the new value
    if (value !== undefined && value !== null && value !== '') {
      const attributeInput: ProductAttributeInput = {
        attributeId: id,
        isForVariant: shouldInclude,
      };

      // Set the appropriate value based on attribute type
      switch (attribute.type) {
        case 'TEXT':
          attributeInput.valueString = value;
          break;
        case 'NUMBER':
          attributeInput.valueNumber = typeof value === 'number' ? value : parseFloat(value);
          break;
        case 'BOOLEAN':
          attributeInput.valueBoolean = !!value;
          break;
        case 'SELECT':
        case 'MULTISELECT':
          attributeInput.attributeValueId = value;
          break;
      }

      // Update attributes array
      const filtered = attributes.filter(a => a.attributeId !== id);
      setAttributes([...filtered, attributeInput]);
    } else {
      // Remove from attributes if value is empty
      setAttributes(attributes.filter(a => a.attributeId !== id));
    }

    // Notify parent about variant field changes
    onVariantFieldChange(id, name, value, displayValue, shouldInclude);
  }, [fieldValues, onVariantFieldChange, setAttributes]);

  // Handle Include in Variant toggle
  const handleIncludeInVariantChange = useCallback((
    id: string, 
    name: string, 
    include: boolean, 
    attribute: Attribute
  ) => {
    const currentValue = fieldValues[id];
    
    // Update field values
    setFieldValues(prev => ({
      ...prev,
      [id]: { ...prev[id], includeInVariant: include }
    }));

    if (include && currentValue?.value) {
      const attributeInput: ProductAttributeInput = {
        attributeId: id,
        isForVariant: include,
      };

      // Set the appropriate value based on attribute type
      switch (attribute.type) {
        case 'TEXT':
          attributeInput.valueString = currentValue.value;
          break;
        case 'NUMBER':
          attributeInput.valueNumber = typeof currentValue.value === 'number' 
            ? currentValue.value 
            : parseFloat(currentValue.value);
          break;
        case 'BOOLEAN':
          attributeInput.valueBoolean = !!currentValue.value;
          break;
        case 'SELECT':
        case 'MULTISELECT':
          attributeInput.attributeValueId = currentValue.value;
          break;
      }

      const filtered = attributes.filter(a => a.attributeId !== id);
      setAttributes([...filtered, attributeInput]);
    } else if (!include) {
      // Only update isForVariant flag, don't remove the attribute
      setAttributes(attributes.map(attr => 
        attr.attributeId === id ? { ...attr, isForVariant: false } : attr
      ));
    }
    onVariantFieldChange(id, name, currentValue?.value, currentValue?.displayValue || '', include);
  }, [fieldValues, setAttributes, onVariantFieldChange]);

  // Check if an attribute is filled - based on fieldValues state
  const isAttributeFilled = useCallback((attributeId: string): boolean => {
    const fieldValue = fieldValues[attributeId];
    if (!fieldValue) return false;
    
    const value = fieldValue.value;
    
    // Check for valid non-empty values
    if (typeof value === 'string') {
      return value.trim() !== '';
    }
    if (typeof value === 'number') {
      return true; // 0 is a valid number
    }
    if (typeof value === 'boolean') {
      return true; // false is a valid boolean
    }
    
    return false;
  }, [fieldValues]);

  // Get display value for an attribute
  const getAttributeDisplayValue = useCallback((attributeId: string): string => {
    const fieldValue = fieldValues[attributeId];
    return fieldValue?.displayValue || '';
  }, [fieldValues]);

  // Render input field based on type
  const renderInputField = useCallback((attribute: Attribute) => {
    const currentValue = fieldValues[attribute.id]?.value || '';
    const currentDisplayValue = fieldValues[attribute.id]?.displayValue || '';
    const isRequired = requiredAttributes.some(attr => attr.id === attribute.id);
    const hasError = validationErrors[`attribute-${attribute.id}`];
    const isFilled = isAttributeFilled(attribute.id);

    switch (attribute.type) {
      case 'SELECT':
      case 'MULTISELECT':
        return (
          <Select
            value={currentValue}
            onValueChange={(value) => {
              const selectedOption = attribute.values?.find(v => v.id === value);
              handleValueChange(
                attribute.id, 
                attribute.name, 
                value, 
                selectedOption?.value || '', 
                attribute
              );
            }}
          >
            <SelectTrigger className={`w-full ${hasError ? "border-red-500" : ""} ${isFilled ? "bg-green-50" : ""}`}>
              <SelectValue placeholder={`Select ${attribute.name}${isRequired ? ' *' : ''}`} />
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
      case 'BOOLEAN':
        return (
          <div className={`flex items-center space-x-2 ${hasError ? 'border-red-500 border-2 rounded-lg p-2' : ''} ${isFilled ? 'bg-green-50 p-2 rounded-lg' : ''}`}>
            <Checkbox
              id={`${attribute.id}-checkbox`}
              checked={!!currentValue}
              onCheckedChange={(checked) => {
                handleValueChange(
                  attribute.id, 
                  attribute.name, 
                  checked, 
                  checked ? 'Yes' : 'No', 
                  attribute
                );
              }}
            />
            <label htmlFor={`${attribute.id}-checkbox`} className="text-sm">
              {currentValue ? 'Yes' : 'No'} {isRequired && <span className="text-red-500">*</span>}
            </label>
          </div>
        );
      case 'NUMBER':
        return (
          <Input
            type="number"
            value={currentValue}
            onChange={(e) => {
              const value = e.target.value === '' ? '' : parseFloat(e.target.value);
              const displayVal = e.target.value === '' ? '' : value.toString() + (attribute.unit ? ` ${attribute.unit}` : '');
              handleValueChange(
                attribute.id, 
                attribute.name, 
                value, 
                displayVal, 
                attribute
              );
            }}
            placeholder={`Enter ${attribute.name}${attribute.unit ? ` (${attribute.unit})` : ''}${isRequired ? ' *' : ''}`}
            className={`w-full ${hasError ? "border-red-500" : ""} ${isFilled ? "bg-green-50" : ""}`}
          />
        );
      case 'TEXT':
      default:
        return (
          <Input
            value={currentDisplayValue}
            onChange={(e) => {
              handleValueChange(
                attribute.id, 
                attribute.name, 
                e.target.value, 
                e.target.value, 
                attribute
              );
            }}
            placeholder={`Enter ${attribute.name}${isRequired ? ' *' : ''}`}
            className={`w-full ${hasError ? "border-red-500" : ""} ${isFilled ? "bg-green-50" : ""}`}
          />
        );
    }
  }, [fieldValues, handleValueChange, requiredAttributes, validationErrors, isAttributeFilled]);

  // Field Card Component
  const FieldCard = React.memo(({
    attribute,
  }: {
    attribute: Attribute;
  }) => {
    const isRequired = requiredAttributes.some(attr => attr.id === attribute.id);
    const hasError = validationErrors[`attribute-${attribute.id}`];
    const isFilled = isAttributeFilled(attribute.id);
    const isIncludedInVariant = fieldValues[attribute.id]?.includeInVariant || false;

    return (
      <Card 
        id={`attribute-${attribute.id}`}
        className={`p-3 border rounded-md bg-white shadow-sm transition-all ${hasError ? 'border-red-500 border-2' : ''} ${isFilled ? 'bg-green-50 border-green-200' : ''}`}
      >
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{attribute.name}</span>
            {isRequired && (
              <span className="text-xs text-red-500 font-bold">*</span>
            )}
            {isFilled && (
              <span className="text-xs text-green-600 font-bold">✓</span>
            )}
            {attribute.unit && (
              <span className="text-xs text-gray-500 ml-1">({attribute.unit})</span>
            )}
            {hasError && (
              <AlertCircle className="w-4 h-4 text-red-500" />
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs ${isIncludedInVariant ? "text-blue-600" : "text-gray-500"}`}>
              {isIncludedInVariant ? "Variant" : "Include"}
            </span>
            <Switch
              checked={isIncludedInVariant}
              onCheckedChange={(checked) =>
                handleIncludeInVariantChange(attribute.id, attribute.name, checked, attribute)
              }
            />
          </div>
        </div>
        <div className="space-y-1">
          {renderInputField(attribute)}
          {attribute.values && attribute.values.length > 0 && (
            <p className="text-xs text-gray-500">
              {attribute.values.length} option{attribute.values.length !== 1 ? "s" : ""} available
            </p>
          )}
          <div className="flex justify-between items-center">
            <p className="text-xs text-gray-400">Type: {attribute.type}</p>
            {isRequired && (
              <p className={`text-xs font-medium ${isFilled ? 'text-green-600' : 'text-red-500'}`}>
                {isFilled ? 'Filled ✓' : 'Required'}
              </p>
            )}
          </div>
          {hasError && (
            <p className="text-xs text-red-500 mt-1">
              This field is required
            </p>
          )}
        </div>
      </Card>
    );
  });

  FieldCard.displayName = 'FieldCard';

  // Calculate filled required attributes
  const filledRequiredCount = useMemo(() => {
    return requiredAttributes.filter(attr => isAttributeFilled(attr.id)).length;
  }, [requiredAttributes, isAttributeFilled]);

  return (
    <div className="border p-4 rounded-lg">
      <h3 className="font-semibold mb-4 text-lg">Product Specifications & Attributes</h3>

      {!categoryId && (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">Please select a category first</p>
        </div>
      )}

      {categoryId && (
        <div className="space-y-6">
          {/* Required Attributes Section */}
          {requiredAttributes.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <span className="bg-red-100 p-1 rounded mr-2 text-red-600">⚠️</span>
                  <h4 className="font-medium text-md">
                    Required Attributes
                  </h4>
                  <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                    {filledRequiredCount}/{requiredAttributes.length} filled
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                {requiredAttributes.map(attr => (
                  <FieldCard key={attr.id} attribute={attr} />
                ))}
              </div>
            </div>
          )}

          {/* Optional Attributes Section */}
          <div>
            <h4 className="font-medium mb-3 text-md flex items-center">
              <span className="bg-blue-100 p-1 rounded mr-2 text-blue-600">🎯</span>
              Additional Attributes
              <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                Optional - Use for Specifications or Variants
              </span>
            </h4>
            {categoryAttributes.filter(attr => !requiredAttributes.some(r => r.id === attr.id)).length === 0 ? (
              <div className="text-center py-4 bg-blue-50 rounded-lg">
                <p className="text-blue-600">No additional attributes available</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                {categoryAttributes
                  .filter(attr => !requiredAttributes.some(r => r.id === attr.id))
                  .map(attr => (
                    <FieldCard key={attr.id} attribute={attr} />
                  ))}
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h5 className="font-medium mb-2 text-sm">Summary</h5>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm">
              <div>
                <span className="text-gray-600">Total Attributes: </span>
                <span className="font-medium">{categoryAttributes.length}</span>
              </div>
              <div>
                <span className="text-gray-600">Required: </span>
                <span className={`font-medium ${filledRequiredCount === requiredAttributes.length ? 'text-green-600' : 'text-red-600'}`}>
                  {filledRequiredCount} / {requiredAttributes.length} filled
                </span>
              </div>
              <div>
                <span className="text-gray-600">Specifications: </span>
                <span className="font-medium">
                  {attributes.filter(a => !a.isForVariant).length}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Variant Attributes: </span>
                <span className="font-medium">
                  {attributes.filter(a => a.isForVariant).length}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}