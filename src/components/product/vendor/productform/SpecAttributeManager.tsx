"use client";
import React, { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { 
  Specification, 
  Attribute, 
} from "@/types/type";
import { ProductAttributeSettingInput, ProductSpecificationInput } from "@/types/product";

interface Props {
  categoryId: string | null;
  specs: ProductSpecificationInput[];
  setSpecs: (s: ProductSpecificationInput[]) => void;
  attributes: ProductAttributeSettingInput[];
  setAttributes: (a: ProductAttributeSettingInput[]) => void;
  categoryAttributes: Attribute[];
  categorySpecifications: Specification[];
  onVariantFieldChange: (fieldId: string, fieldName: string, value: any, includeInVariant: boolean) => void;
}

interface FieldValue {
  value: any;
  includeInVariant: boolean;
}

export default function SpecAttributeManager({
  categoryId,
  specs,
  setSpecs,
  attributes,
  setAttributes,
  categoryAttributes,
  categorySpecifications,
  onVariantFieldChange,
}: Props) {
  const [fieldValues, setFieldValues] = useState<Record<string, FieldValue>>({});

  // Initialize on category change
  useEffect(() => {
    if (categoryId) {
      // Initialize attribute settings - attributes are ALWAYS for variants
      const attributeSettings: ProductAttributeSettingInput[] = categoryAttributes.map(attr => ({
        attributeId: attr.id,
        isVariant: true, // Always true for attributes
      }));
      setAttributes(attributeSettings);

      // Initialize specs - empty by default
      setSpecs([]);

      // Initialize field values
      const initialValues: Record<string, FieldValue> = {};
      
      // Specifications default to NOT included in variant (they're just specs)
      categorySpecifications.forEach(spec => {
        initialValues[spec.id] = { value: '', includeInVariant: false };
      });
      
      // Attributes default to included in variant (they define variants)
      categoryAttributes.forEach(attr => {
        initialValues[attr.id] = { value: '', includeInVariant: true };
      });
      
      setFieldValues(initialValues);
    }
  }, [categoryId, categoryAttributes, categorySpecifications, setAttributes, setSpecs]);

  // Handle value change
  const handleValueChange = (id: string, name: string, value: any, isSpecification: boolean) => {
    // First update field values
    setFieldValues((prev: Record<string, FieldValue>) => ({
      ...prev,
      [id]: { ...prev[id], value },
    }));

    // Then handle specs update separately (outside of setState)
    if (isSpecification) {
      // Get current includeInVariant value
      const shouldInclude = fieldValues[id]?.includeInVariant ?? false;
      
      if (shouldInclude && value !== undefined && value !== null && value !== '') {
        const specInput: ProductSpecificationInput = {
          specificationId: id,
          valueString: typeof value === 'string' ? value : undefined,
          valueNumber: typeof value === 'number' ? value : undefined,
        };
        const filtered = specs.filter(s => s.specificationId !== id);
        setSpecs([...filtered, specInput]);
      } else if (!shouldInclude || value === undefined || value === null || value === '') {
        setSpecs(specs.filter(s => s.specificationId !== id));
      }
    }

    // Notify parent about variant field changes
    const includeInVariant = fieldValues[id]?.includeInVariant || false;
    onVariantFieldChange(id, name, value, includeInVariant);
  };

  // Handle Include in Variant toggle
  const handleIncludeInVariantChange = (id: string, name: string, include: boolean, isSpecification: boolean) => {
    setFieldValues((prev: Record<string, FieldValue>) => ({
      ...prev,
      [id]: { ...prev[id], includeInVariant: include }
    }));

    if (isSpecification) {
      // For specifications: include/exclude from specs array based on toggle
      if (include && fieldValues[id]?.value) {
        const specInput: ProductSpecificationInput = {
          specificationId: id,
          valueString: typeof fieldValues[id].value === 'string' ? fieldValues[id].value : undefined,
          valueNumber: typeof fieldValues[id].value === 'number' ? fieldValues[id].value : undefined,
        };
        const filtered = specs.filter(s => s.specificationId !== id);
        setSpecs([...filtered, specInput]);
      } else {
        // Remove from specs if toggle is off
        setSpecs(specs.filter(s => s.specificationId !== id));
      }
    } else {
      // For attributes: just update the isVariant flag (attributes always use attributeId, not specificationId)
      const updatedAttributes = attributes.map(attr =>
        attr.attributeId === id ? { ...attr, isVariant: include } : attr
      );
      setAttributes(updatedAttributes);
    }

    // Notify parent
    onVariantFieldChange(id, name, fieldValues[id]?.value, include);
  };

  // Render input field based on type
  const renderInputField = (item: Specification | Attribute, isSpecification: boolean) => {
    const currentValue = fieldValues[item.id]?.value || '';
    
    // For specifications, use 'options' property; for attributes, use 'values'
    const optionsList = isSpecification 
      ? (item as Specification).options || [] 
      : (item as Attribute).values || [];

    switch (item.type) {
      case 'SELECT':
        return (
          <Select
            value={currentValue}
            onValueChange={(value) => handleValueChange(item.id, item.name, value, isSpecification)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={`Select ${item.name}`} />
            </SelectTrigger>
            <SelectContent>
              {optionsList.map((option: any) => (
                <SelectItem key={option.id} value={option.value}>
                  {option.value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case 'BOOLEAN':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={`${item.id}-checkbox`}
              checked={!!currentValue}
              onCheckedChange={(checked) => handleValueChange(item.id, item.name, checked, isSpecification)}
            />
            <label htmlFor={`${item.id}-checkbox`} className="text-sm">
              {currentValue ? 'Yes' : 'No'}
            </label>
          </div>
        );
      case 'NUMBER':
        return (
          <Input
            type="number"
            value={currentValue}
            onChange={(e) => handleValueChange(item.id, item.name, parseFloat(e.target.value) || 0, isSpecification)}
            placeholder={`Enter ${item.name}`}
            className="w-full"
          />
        );
      case 'TEXT':
      default:
        return (
          <Input
            value={currentValue}
            onChange={(e) => handleValueChange(item.id, item.name, e.target.value, isSpecification)}
            placeholder={`Enter ${item.name}`}
            className="w-full"
          />
        );
    }
  };

  // Field Card Component
  const FieldCard = ({
    item,
    isAttribute = false,
  }: {
    item: Specification | Attribute;
    isAttribute?: boolean;
  }) => (
    <Card className="p-3 border rounded-md bg-white shadow-sm">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium">{item.name}</span>
        <div className="flex items-center gap-2">
          <span className={`text-xs ${isAttribute ? "text-blue-600" : "text-gray-500"}`}>
            {isAttribute ? "Use for Variant" : "Include"}
          </span>
          <Switch
            checked={fieldValues[item.id]?.includeInVariant !== false}
            onCheckedChange={(checked) =>
              handleIncludeInVariantChange(item.id, item.name, checked, !isAttribute)
            }
          />
        </div>
      </div>
      <div className="space-y-1">
        {renderInputField(item, !isAttribute)}
        {(() => {
          const optionsList = !isAttribute 
            ? (item as Specification).options || [] 
            : (item as Attribute).values || [];
          return optionsList.length > 0 && (
            <p className="text-xs text-gray-500">
              {optionsList.length} option{optionsList.length !== 1 ? "s" : ""} available
            </p>
          );
        })()}
      </div>
    </Card>
  );

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
          {/* Specifications */}
          <div>
            <h4 className="font-medium mb-3 text-md flex items-center">
              <span className="bg-gray-100 p-1 rounded mr-2">📋</span>
              Specifications
              <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                Product Details
              </span>
            </h4>
            {categorySpecifications.length === 0 ? (
              <div className="text-center py-4 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No specifications available</p>
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto border rounded-lg p-3 bg-white">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                  {categorySpecifications.map(item => (
                    <div key={item.id} className="bg-gray-50 p-2 rounded">
                      <FieldCard item={item} isAttribute={false} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Attributes */}
          <div>
            <h4 className="font-medium mb-3 text-md flex items-center">
              <span className="bg-blue-100 p-1 rounded mr-2 text-blue-600">🎨</span>
              Attributes
              <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                For Product Variants
              </span>
            </h4>
            {categoryAttributes.length === 0 ? (
              <div className="text-center py-4 bg-blue-50 rounded-lg">
                <p className="text-blue-600">No attributes available</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                {categoryAttributes.map(item => (
                  <div key={item.id} className="bg-blue-50 p-2 rounded">
                    <FieldCard item={item} isAttribute={true} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h5 className="font-medium mb-2 text-sm">Summary</h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
              <div>
                <span className="text-gray-600">Specifications: </span>
                <span className="font-medium">{specs.length} selected</span>
              </div>
              <div>
                <span className="text-gray-600">Attributes: </span>
                <span className="font-medium">{categoryAttributes.length} total</span>
              </div>
              <div>
                <span className="text-gray-600">Active for variants: </span>
                <span className="font-medium">
                  {attributes.filter(a => a.isVariant).length}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}