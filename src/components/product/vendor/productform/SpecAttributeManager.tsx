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
  AttributeValue, 
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
      // Initialize attribute settings
      const attributeSettings: ProductAttributeSettingInput[] = categoryAttributes.map(attr => ({
        attributeId: attr.id,
        isVariant: true,
      }));
      setAttributes(attributeSettings);

      // Initialize specs
      const specInputs: ProductSpecificationInput[] = [];
      setSpecs(specInputs);

      // Initialize field values
      const initialValues: Record<string, FieldValue> = {};
      categorySpecifications.forEach(spec => {
        initialValues[spec.id] = { value: '', includeInVariant: false };
      });
      categoryAttributes.forEach(attr => {
        initialValues[attr.id] = { value: '', includeInVariant: true };
      });
      setFieldValues(initialValues);
    }
  }, [categoryId, categoryAttributes, categorySpecifications, setAttributes, setSpecs]);

  // Handle value change
  const handleValueChange = (id: string, name: string, value: any, isSpecification: boolean) => {
    setFieldValues((prev: Record<string, FieldValue>) => ({
      ...prev,
      [id]: { ...prev[id], value },
    }));

    if (isSpecification) {
      const fv = fieldValues[id];
      if (fv?.includeInVariant && value !== undefined && value !== null) {
        const specInput: ProductSpecificationInput = {
          specificationId: id,
          valueString: typeof value === 'string' ? value : undefined,
          valueNumber: typeof value === 'number' ? value : undefined,
        };
        const filtered = specs.filter(s => s.specificationId !== id);
        setSpecs([...filtered, specInput]);
      }
    }

    onVariantFieldChange(id, name, value, fieldValues[id]?.includeInVariant || false);
  };

  // Handle Include in Variant toggle
  const handleIncludeInVariantChange = (id: string, name: string, include: boolean, isSpecification: boolean) => {
    setFieldValues((prev: Record<string, FieldValue>) => ({
      ...prev,
      [id]: { ...prev[id], includeInVariant: include }
    }));

    if (isSpecification) {
      if (include && fieldValues[id]?.value) {
        const specInput: ProductSpecificationInput = {
          specificationId: id,
          valueString: typeof fieldValues[id].value === 'string' ? fieldValues[id].value : undefined,
          valueNumber: typeof fieldValues[id].value === 'number' ? fieldValues[id].value : undefined,
        };
        const filtered = specs.filter(s => s.specificationId !== id);
        setSpecs([...filtered, specInput]);
      } else {
        setSpecs(specs.filter(s => s.specificationId !== id));
      }
    } else {
      const updatedAttributes = attributes.map(attr =>
        attr.attributeId === id ? { ...attr, isVariant: include } : attr
      );
      setAttributes(updatedAttributes);
    }

    onVariantFieldChange(id, name, fieldValues[id]?.value, include);
  };

  // Render input field based on type
  const renderInputField = (item: Specification | Attribute) => {
    const currentValue = fieldValues[item.id]?.value || '';

    const isSpec = !('attributeId' in item);

    switch (item.type) {
      case 'SELECT':
        return (
          <Select
            value={currentValue}
            onValueChange={(value) => handleValueChange(item.id, item.name, value, isSpec)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={`Select ${item.name}`} />
            </SelectTrigger>
            <SelectContent>
              {(item.values || []).map((value: any) => (
                <SelectItem key={value.id} value={value.value}>
                  {value.value}
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
              onCheckedChange={(checked) => handleValueChange(item.id, item.name, checked, isSpec)}
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
            onChange={(e) => handleValueChange(item.id, item.name, parseFloat(e.target.value) || 0, isSpec)}
            placeholder={`Enter ${item.name}`}
            className="w-full"
          />
        );
      case 'TEXT':
      default:
        return (
          <Input
            value={currentValue}
            onChange={(e) => handleValueChange(item.id, item.name, e.target.value, isSpec)}
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
            {isAttribute ? "Variant" : "Include"}
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
        {renderInputField(item)}
        {item.values && item.values.length > 0 && (
          <p className="text-xs text-gray-500">
            {item.values.length} option{item.values.length !== 1 ? "s" : ""} available
          </p>
        )}
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
                For Variants
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-600">Specifications: </span>
                <span className="font-medium">{categorySpecifications.length}</span>
              </div>
              <div>
                <span className="text-gray-600">Attributes: </span>
                <span className="font-medium">{categoryAttributes.length}</span>
              </div>
              <div>
                <span className="text-gray-600">Included in variants: </span>
                <span className="font-medium">
                  {Object.values(fieldValues).filter(fv => fv.includeInVariant && fv.value).length}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}